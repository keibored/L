/* eslint-disable react-hooks/immutability -- React Three Fiber exposes camera as an imperative Three.js object. */
import { useEffect, useRef, type MutableRefObject, type RefObject } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { CatmullRomCurve3, MathUtils, PerspectiveCamera, Vector2, Vector3 } from "three";
import { useExperience } from "../../state/ExperienceContext";
import type { CameraCommandKind, TransitionRef } from "../../hooks/useTransitionDirector";
import {
  EXTERIOR,
  INTERIOR_CONTROL_LIMITS,
  entryAnchorsForViewport,
  exteriorWaypointForViewport,
  focusAnchorsForViewport,
  interiorWaypointForViewport,
  type CameraPose,
  type Waypoint,
} from "./cameraWaypoints";

interface CameraRigProps {
  transitionRef: TransitionRef;
  curtainProgressRef: MutableRefObject<number>;
  shellRef: RefObject<HTMLDivElement | null>;
  reducedMotion: boolean;
  onTransitionComplete: (requestId: number) => void;
}

interface PosePath {
  positions: CatmullRomCurve3;
  targets: CatmullRomCurve3;
  startFov: number;
  endFov: number;
}

interface ActiveMotion {
  id: number;
  kind: CameraCommandKind;
  elapsed: number;
  delay: number;
  poseDuration: number;
  boothDuration: number;
  closeDuration: number;
  posePath: PosePath | null;
  boothPath: PosePath | null;
  destination: Waypoint;
}

const ENTER_DURATION = 2.58;
const EXIT_DURATION = 2.58;
const ENTER_CAMERA_DELAY = 0.14;
const EXIT_CURTAIN_CLOSE_DURATION = 0.42;
const REDUCED_ENTER_DURATION = 0.46;
const REDUCED_POSE_DURATION = 0.32;
const tempPosition = new Vector3();
const tempTarget = new Vector3();

function clamp01(value: number) {
  return Math.min(1, Math.max(0, value));
}

function power3InOut(value: number) {
  const t = clamp01(value);
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

function smoothstep(value: number) {
  const t = clamp01(value);
  return t * t * (3 - 2 * t);
}

function pathFromWaypoints(waypoints: readonly Waypoint[]): PosePath {
  return {
    positions: new CatmullRomCurve3(waypoints.map((pose) => new Vector3(...pose.position)), false, "centripetal"),
    targets: new CatmullRomCurve3(waypoints.map((pose) => new Vector3(...pose.lookAt)), false, "centripetal"),
    startFov: waypoints[0].fov,
    endFov: waypoints[waypoints.length - 1].fov,
  };
}

function curvedPosePath(start: CameraPose, end: Waypoint): PosePath {
  const startPosition = new Vector3(...start.position);
  const endPosition = new Vector3(...end.position);
  const startTarget = new Vector3(...start.target);
  const endTarget = new Vector3(...end.lookAt);
  const positionOne = startPosition.clone().lerp(endPosition, 0.32);
  const positionTwo = startPosition.clone().lerp(endPosition, 0.7);
  positionOne.y += 0.045;
  positionTwo.y += 0.025;
  const targetOne = startTarget.clone().lerp(endTarget, 0.34);
  const targetTwo = startTarget.clone().lerp(endTarget, 0.72);
  return {
    positions: new CatmullRomCurve3([startPosition, positionOne, positionTwo, endPosition], false, "centripetal"),
    targets: new CatmullRomCurve3([startTarget, targetOne, targetTwo, endTarget], false, "centripetal"),
    startFov: start.fov ?? end.fov,
    endFov: end.fov,
  };
}

function samePose(position: Vector3, target: Vector3, waypoint: Waypoint) {
  return position.distanceTo(tempPosition.set(...waypoint.position)) < 0.001
    && target.distanceTo(tempTarget.set(...waypoint.lookAt)) < 0.001;
}

export function CameraRig({
  transitionRef,
  curtainProgressRef,
  shellRef,
  reducedMotion,
  onTransitionComplete,
}: CameraRigProps) {
  const { camera, gl, size } = useThree();
  const { phase, recenterToken } = useExperience();
  const basePosition = useRef(new Vector3(...EXTERIOR.position));
  const baseTarget = useRef(new Vector3(...EXTERIOR.lookAt));
  const renderedTarget = useRef(new Vector3(...EXTERIOR.lookAt));
  const fovValue = useRef(EXTERIOR.fov);
  const orbit = useRef(new Vector2());
  const orbitTarget = useRef(new Vector2());
  const zoom = useRef(0);
  const activeMotion = useRef<ActiveMotion | null>(null);
  const handledCommand = useRef(0);
  const hasInit = useRef(false);
  const pointers = useRef(new Map<number, Vector2>());
  const previousPointer = useRef<Vector2 | null>(null);
  const pinchDistance = useRef<number | null>(null);

  const setFov = (value: number) => {
    fovValue.current = value;
    if (camera instanceof PerspectiveCamera && Math.abs(camera.fov - value) > 0.0001) {
      camera.fov = value;
      camera.updateProjectionMatrix();
    }
  };

  const applyBoothProgress = (value: number) => {
    const progress = clamp01(value);
    const archiveOpacity = smoothstep((progress - 0.7) / 0.14);
    transitionRef.current.progress = progress;
    transitionRef.current.interiorBlend = smoothstep(progress);
    transitionRef.current.archiveOpacity = archiveOpacity;
    shellRef.current?.style.setProperty("--archive-opacity", archiveOpacity.toFixed(4));
  };

  const applyPosePath = (path: PosePath, progress: number) => {
    const eased = power3InOut(progress);
    path.positions.getPoint(eased, basePosition.current);
    path.targets.getPoint(eased, baseTarget.current);
    renderedTarget.current.copy(baseTarget.current);
    camera.position.copy(basePosition.current);
    camera.lookAt(renderedTarget.current);
    setFov(MathUtils.lerp(path.startFov, path.endFov, eased));
  };

  const settleAt = (waypoint: Waypoint) => {
    basePosition.current.set(...waypoint.position);
    baseTarget.current.set(...waypoint.lookAt);
    renderedTarget.current.copy(baseTarget.current);
    camera.position.copy(basePosition.current);
    camera.lookAt(renderedTarget.current);
    setFov(waypoint.fov);
  };

  const beginMotion = () => {
    const command = transitionRef.current.command;
    if (!command || command.id === handledCommand.current) return;
    handledCommand.current = command.id;
    const livePose: CameraPose = {
      position: camera.position.toArray() as [number, number, number],
      target: renderedTarget.current.toArray() as [number, number, number],
      fov: camera instanceof PerspectiveCamera ? camera.fov : fovValue.current,
    };
    orbit.current.set(0, 0);
    orbitTarget.current.set(0, 0);
    zoom.current = 0;
    pointers.current.clear();
    previousPointer.current = null;
    pinchDistance.current = null;

    const anchors = entryAnchorsForViewport(size.width, size.height);
    let destination: Waypoint;
    let delay = 0;
    let poseDuration = 0;
    let boothDuration = 0;
    let closeDuration = 0;
    let posePath: PosePath | null = null;
    let boothPath: PosePath | null = null;

    if (command.kind === "enter") {
      destination = anchors.interiorHome;
      delay = reducedMotion ? 0.04 : ENTER_CAMERA_DELAY;
      boothDuration = reducedMotion ? REDUCED_ENTER_DURATION : ENTER_DURATION;
      const liveStart: Waypoint = { position: livePose.position, lookAt: livePose.target, fov: livePose.fov ?? anchors.exteriorHome.fov };
      boothPath = pathFromWaypoints([
        liveStart,
        anchors.doorwayApproach,
        anchors.doorwayThreshold,
        anchors.interiorEntry,
        anchors.interiorHome,
      ]);
    } else if (command.kind === "focus" && command.objectId) {
      const focusAnchors = focusAnchorsForViewport(size.width);
      destination = command.objectId === "memories"
        ? focusAnchors.memoriesFocus
        : command.objectId === "letters"
          ? focusAnchors.lettersFocus
          : command.objectId === "playlist"
            ? focusAnchors.playlistFocus
            : focusAnchors.storyFocus;
      const distance = camera.position.distanceTo(tempPosition.set(...destination.position));
      poseDuration = reducedMotion ? REDUCED_POSE_DURATION : MathUtils.clamp(distance / 2.25, 1.25, 2.1);
      posePath = curvedPosePath(livePose, destination);
    } else if (command.kind === "return") {
      destination = anchors.interiorHome;
      const distance = camera.position.distanceTo(tempPosition.set(...destination.position));
      poseDuration = reducedMotion ? REDUCED_POSE_DURATION : MathUtils.clamp(0.68 + distance * 0.16, 0.72, 1.2);
      posePath = curvedPosePath(livePose, destination);
    } else {
      destination = anchors.exteriorHome;
      const needsReturn = !samePose(camera.position, renderedTarget.current, anchors.interiorHome);
      if (needsReturn) {
        const distance = camera.position.distanceTo(tempPosition.set(...anchors.interiorHome.position));
        poseDuration = reducedMotion ? REDUCED_POSE_DURATION : MathUtils.clamp(0.7 + distance * 0.15, 0.75, 1.2);
        posePath = curvedPosePath(livePose, anchors.interiorHome);
      }
      boothDuration = reducedMotion ? REDUCED_ENTER_DURATION : EXIT_DURATION;
      closeDuration = reducedMotion ? 0.16 : EXIT_CURTAIN_CLOSE_DURATION;
      boothPath = pathFromWaypoints([
        anchors.interiorHome,
        anchors.interiorEntry,
        anchors.doorwayThreshold,
        anchors.doorwayApproach,
        anchors.exteriorHome,
      ]);
    }

    activeMotion.current = {
      id: command.id,
      kind: command.kind,
      elapsed: 0,
      delay,
      poseDuration,
      boothDuration,
      closeDuration,
      posePath,
      boothPath,
      destination,
    };
  };

  useEffect(() => {
    orbitTarget.current.set(0, 0);
    zoom.current = 0;
  }, [recenterToken]);

  useEffect(() => {
    const canvas = gl.domElement;
    const controlsActive = () => phase === "inside" && !transitionRef.current.active;
    const onPointerDown = (event: PointerEvent) => {
      if (!controlsActive() || (event.pointerType === "mouse" && event.button !== 0)) return;
      pointers.current.set(event.pointerId, new Vector2(event.clientX, event.clientY));
      previousPointer.current = new Vector2(event.clientX, event.clientY);
      canvas.setPointerCapture?.(event.pointerId);
    };
    const onPointerMove = (event: PointerEvent) => {
      if (!controlsActive() || !pointers.current.has(event.pointerId)) return;
      pointers.current.set(event.pointerId, new Vector2(event.clientX, event.clientY));
      const points = [...pointers.current.values()];
      if (points.length >= 2) {
        const distance = points[0].distanceTo(points[1]);
        if (pinchDistance.current !== null) {
          zoom.current = MathUtils.clamp(zoom.current + (pinchDistance.current - distance) * 0.006, ...INTERIOR_CONTROL_LIMITS.zoomOffset);
        }
        pinchDistance.current = distance;
        return;
      }
      if (!previousPointer.current) return;
      const dx = event.clientX - previousPointer.current.x;
      const dy = event.clientY - previousPointer.current.y;
      orbitTarget.current.x = MathUtils.clamp(orbitTarget.current.x - dx * 0.0015, ...INTERIOR_CONTROL_LIMITS.azimuth);
      orbitTarget.current.y = MathUtils.clamp(orbitTarget.current.y + dy * 0.0012, ...INTERIOR_CONTROL_LIMITS.polar);
      previousPointer.current.set(event.clientX, event.clientY);
    };
    const onPointerUp = (event: PointerEvent) => {
      pointers.current.delete(event.pointerId);
      pinchDistance.current = null;
      const remaining = [...pointers.current.values()][0];
      previousPointer.current = remaining ? remaining.clone() : null;
    };
    const onWheel = (event: WheelEvent) => {
      if (!controlsActive()) return;
      event.preventDefault();
      zoom.current = MathUtils.clamp(zoom.current + event.deltaY * 0.0012, ...INTERIOR_CONTROL_LIMITS.zoomOffset);
    };
    canvas.addEventListener("pointerdown", onPointerDown);
    canvas.addEventListener("pointermove", onPointerMove);
    canvas.addEventListener("pointerup", onPointerUp);
    canvas.addEventListener("pointercancel", onPointerUp);
    canvas.addEventListener("wheel", onWheel, { passive: false });
    return () => {
      canvas.removeEventListener("pointerdown", onPointerDown);
      canvas.removeEventListener("pointermove", onPointerMove);
      canvas.removeEventListener("pointerup", onPointerUp);
      canvas.removeEventListener("pointercancel", onPointerUp);
      canvas.removeEventListener("wheel", onWheel);
    };
  }, [gl, phase, transitionRef]);

  useFrame((_, delta) => {
    if (!hasInit.current) {
      const initial = phase === "inside"
        ? interiorWaypointForViewport(size.width, size.height)
        : exteriorWaypointForViewport(size.width, size.height);
      settleAt(initial);
      hasInit.current = true;
    }

    beginMotion();
    const motion = activeMotion.current;
    if (motion) {
      motion.elapsed += Math.min(delta, 0.05);
      if (motion.kind === "enter") {
        curtainProgressRef.current = smoothstep(motion.elapsed / (reducedMotion ? 0.16 : 0.62));
        const travel = clamp01((motion.elapsed - motion.delay) / motion.boothDuration);
        if (motion.boothPath && motion.elapsed >= motion.delay) applyPosePath(motion.boothPath, travel);
        applyBoothProgress(travel);
        if (travel >= 1) {
          settleAt(motion.destination);
          curtainProgressRef.current = 1;
          activeMotion.current = null;
          onTransitionComplete(motion.id);
        }
        return;
      }

      if (motion.kind === "focus" || motion.kind === "return") {
        const progress = clamp01(motion.elapsed / Math.max(motion.poseDuration, 0.001));
        if (motion.posePath) applyPosePath(motion.posePath, progress);
        if (progress >= 1) {
          settleAt(motion.destination);
          activeMotion.current = null;
          onTransitionComplete(motion.id);
        }
        return;
      }

      const poseProgress = motion.poseDuration > 0 ? clamp01(motion.elapsed / motion.poseDuration) : 1;
      if (poseProgress < 1 && motion.posePath) {
        applyPosePath(motion.posePath, poseProgress);
        applyBoothProgress(1);
        curtainProgressRef.current = 1;
        return;
      }
      if (motion.poseDuration > 0 && motion.posePath) settleAt(entryAnchorsForViewport(size.width, size.height).interiorHome);
      const boothElapsed = motion.elapsed - motion.poseDuration;
      const boothProgress = clamp01(boothElapsed / motion.boothDuration);
      if (boothProgress < 1) {
        if (motion.boothPath) applyPosePath(motion.boothPath, boothProgress);
        applyBoothProgress(1 - boothProgress);
        curtainProgressRef.current = 1;
        return;
      }
      settleAt(motion.destination);
      applyBoothProgress(0);
      const closeProgress = clamp01((boothElapsed - motion.boothDuration) / Math.max(motion.closeDuration, 0.001));
      curtainProgressRef.current = 1 - power3InOut(closeProgress);
      if (closeProgress >= 1) {
        curtainProgressRef.current = 0;
        activeMotion.current = null;
        onTransitionComplete(motion.id);
      }
      return;
    }

    orbit.current.lerp(orbitTarget.current, reducedMotion ? 1 : 0.1);
    const controlsEnabled = phase === "inside";
    const orbitX = controlsEnabled ? orbit.current.x * 5.2 : 0;
    const orbitY = controlsEnabled ? orbit.current.y * 3.2 : 0;
    camera.position.set(basePosition.current.x + orbitX, basePosition.current.y + orbitY, basePosition.current.z + (controlsEnabled ? zoom.current : 0));
    renderedTarget.current.set(baseTarget.current.x + orbitX * 0.18, baseTarget.current.y + orbitY * 0.18, baseTarget.current.z);
    camera.lookAt(renderedTarget.current);
    setFov(fovValue.current);
  });

  return null;
}
