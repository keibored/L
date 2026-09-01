import { useEffect, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { gsap } from "gsap";
import { MathUtils, PerspectiveCamera, Quaternion, Vector2, Vector3 } from "three";
import { useExperience } from "../../state/ExperienceContext";
import {
  EXTERIOR,
  INTERIOR_CONTROL_LIMITS,
  entryAnchorsForViewport,
  exitAnchorsForViewport,
  exteriorWaypointForViewport,
  focusWaypoint,
  interiorWaypointForViewport,
  type SceneMode,
  type Waypoint,
} from "./cameraWaypoints";

function applyFov(target: PerspectiveCamera, fov: number) {
  target.fov = fov;
  target.updateProjectionMatrix();
}

interface CameraRigProps {
  sceneMode: SceneMode;
  entryProgress: number;
  exitProgress: number;
  dragging: boolean;
  engaged: boolean;
  reducedMotion: boolean;
  coarsePointer: boolean;
}

function eased(value: number) {
  const clamped = MathUtils.clamp(value, 0, 1);
  return clamped * clamped * (3 - 2 * clamped);
}

export function CameraRig({ sceneMode, entryProgress, exitProgress, dragging, engaged, reducedMotion, coarsePointer }: CameraRigProps) {
  const { camera, gl, pointer, size } = useThree();
  const { phase, focusedObject, recenterToken } = useExperience();

  const basePosition = useRef(new Vector3(...EXTERIOR.position));
  const lookTarget = useRef(new Vector3(...EXTERIOR.lookAt));
  const fovValue = useRef(EXTERIOR.fov);
  const parallax = useRef(new Vector3());
  const engagement = useRef(0);
  const orbit = useRef(new Vector2());
  const orbitTarget = useRef(new Vector2());
  const zoom = useRef(0);
  const tweenRef = useRef<gsap.core.Timeline | null>(null);
  const hasInit = useRef(false);
  const pointers = useRef(new Map<number, Vector2>());
  const previousPointer = useRef<Vector2 | null>(null);
  const pinchDistance = useRef<number | null>(null);
  const entryCaptured = useRef(false);
  const entryStartPosition = useRef(new Vector3());
  const entryStartTarget = useRef(new Vector3());
  const entryStartFov = useRef(EXTERIOR.fov);
  const entryDirection = useRef(new Vector3());
  const settledPosition = useRef(new Vector3());
  const settledTarget = useRef(new Vector3());
  const exitCaptured = useRef(false);
  const exitStartPosition = useRef(new Vector3());
  const exitStartTarget = useRef(new Vector3());
  const exitStartFov = useRef(EXTERIOR.fov);
  const exitStartQuaternion = useRef(new Quaternion());
  const exitAlignedQuaternion = useRef(new Quaternion());
  const exteriorHomeQuaternion = useRef(new Quaternion());
  const exitDirection = useRef(new Vector3());
  const quaternionHelper = useRef(new PerspectiveCamera());
  const exitFromPosition = useRef(new Vector3());
  const exitToPosition = useRef(new Vector3());
  const exitFromTarget = useRef(new Vector3());
  const exitToTarget = useRef(new Vector3());

  useEffect(() => {
    orbitTarget.current.set(0, 0);
    zoom.current = 0;
  }, [recenterToken]);

  useEffect(() => {
    if (!hasInit.current) return;

    if (phase === "entering" || phase === "exiting") {
      tweenRef.current?.kill();
      orbitTarget.current.set(0, 0);
      zoom.current = 0;
      return;
    }

    let waypoint: Waypoint;
    if (phase === "loading" || phase === "outside") {
      waypoint = exteriorWaypointForViewport(size.width, size.height);
    } else if (phase === "focusing" || phase === "content") {
      waypoint = focusedObject
        ? focusWaypoint(focusedObject, size.width)
        : interiorWaypointForViewport(size.width, size.height);
    } else {
      waypoint = interiorWaypointForViewport(size.width, size.height);
    }

    if (phase !== "inside") {
      orbitTarget.current.set(0, 0);
      zoom.current = 0;
    }

    tweenRef.current?.kill();
    const duration = reducedMotion ? 0.22 : phase === "focusing" || phase === "content" ? 0.72 : 0.95;
    const fovObject = { fov: fovValue.current };
    const timeline = gsap.timeline();
    timeline.to(
      basePosition.current,
      { x: waypoint.position[0], y: waypoint.position[1], z: waypoint.position[2], duration, ease: "power2.inOut" },
      0,
    );
    timeline.to(
      lookTarget.current,
      { x: waypoint.lookAt[0], y: waypoint.lookAt[1], z: waypoint.lookAt[2], duration, ease: "power2.inOut" },
      0,
    );
    timeline.to(
      fovObject,
      {
        fov: waypoint.fov,
        duration,
        ease: "power2.inOut",
        onUpdate() {
          fovValue.current = fovObject.fov;
        },
      },
      0,
    );
    tweenRef.current = timeline;

    return () => {
      timeline.kill();
    };
  }, [focusedObject, phase, recenterToken, reducedMotion, sceneMode, size.height, size.width]);

  useEffect(() => {
    const canvas = gl.domElement;
    const controlsActive = () => phase === "inside";

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
          zoom.current = MathUtils.clamp(
            zoom.current + (pinchDistance.current - distance) * 0.006,
            INTERIOR_CONTROL_LIMITS.zoomOffset[0],
            INTERIOR_CONTROL_LIMITS.zoomOffset[1],
          );
        }
        pinchDistance.current = distance;
        return;
      }

      if (!previousPointer.current) return;
      const dx = event.clientX - previousPointer.current.x;
      const dy = event.clientY - previousPointer.current.y;
      orbitTarget.current.x = MathUtils.clamp(
        orbitTarget.current.x - dx * 0.0015,
        INTERIOR_CONTROL_LIMITS.azimuth[0],
        INTERIOR_CONTROL_LIMITS.azimuth[1],
      );
      orbitTarget.current.y = MathUtils.clamp(
        orbitTarget.current.y + dy * 0.0012,
        INTERIOR_CONTROL_LIMITS.polar[0],
        INTERIOR_CONTROL_LIMITS.polar[1],
      );
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
      zoom.current = MathUtils.clamp(
        zoom.current + event.deltaY * 0.0012,
        INTERIOR_CONTROL_LIMITS.zoomOffset[0],
        INTERIOR_CONTROL_LIMITS.zoomOffset[1],
      );
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
  }, [gl, phase]);

  useFrame((state) => {
    if (!hasInit.current) {
      const initial = sceneMode === "interior"
        ? interiorWaypointForViewport(size.width, size.height)
        : exteriorWaypointForViewport(size.width, size.height);
      basePosition.current.set(...initial.position);
      lookTarget.current.set(...initial.lookAt);
      fovValue.current = initial.fov;
      hasInit.current = true;
    }

    if (phase === "entering") {
      const anchors = entryAnchorsForViewport(size.width, size.height);
      if (!entryCaptured.current) {
        entryCaptured.current = true;
        entryStartPosition.current.copy(camera.position);
        camera.getWorldDirection(entryDirection.current);
        entryStartTarget.current.copy(camera.position).addScaledVector(entryDirection.current, 2.3);
        entryStartFov.current = "fov" in camera ? camera.fov : fovValue.current;
      }

      orbitTarget.current.set(0, 0);
      orbit.current.set(0, 0);
      zoom.current = 0;
      parallax.current.set(0, 0, 0);
      engagement.current = 0;

      if (reducedMotion) {
        if (entryProgress < 0.5) {
          basePosition.current.copy(entryStartPosition.current);
          lookTarget.current.copy(entryStartTarget.current);
          fovValue.current = entryStartFov.current;
        } else {
          basePosition.current.set(...anchors.interiorHome.position);
          lookTarget.current.set(...anchors.interiorHome.lookAt);
          fovValue.current = anchors.interiorHome.fov;
        }
      } else if (entryProgress < 0.5 / 2.6) {
        basePosition.current.copy(entryStartPosition.current);
        lookTarget.current.copy(entryStartTarget.current);
        fovValue.current = entryStartFov.current;
      } else if (entryProgress < 1 / 2.6) {
        const progress = eased((entryProgress - 0.5 / 2.6) / (0.5 / 2.6));
        basePosition.current.lerpVectors(
          entryStartPosition.current,
          settledPosition.current.set(...anchors.exteriorApproach.position),
          progress,
        );
        lookTarget.current.lerpVectors(
          entryStartTarget.current,
          settledTarget.current.set(...anchors.exteriorApproach.lookAt),
          progress,
        );
        fovValue.current = MathUtils.lerp(entryStartFov.current, anchors.exteriorApproach.fov, progress);
      } else if (entryProgress < 1.6 / 2.6) {
        const progress = eased((entryProgress - 1 / 2.6) / (0.6 / 2.6));
        basePosition.current.lerpVectors(
          exitFromPosition.current.set(...anchors.exteriorApproach.position),
          exitToPosition.current.set(...anchors.curtainThreshold.position),
          progress,
        );
        lookTarget.current.lerpVectors(
          exitFromTarget.current.set(...anchors.exteriorApproach.lookAt),
          exitToTarget.current.set(...anchors.curtainThreshold.lookAt),
          progress,
        );
        fovValue.current = anchors.curtainThreshold.fov;
      } else if (entryProgress < 2.1 / 2.6) {
        const progress = eased((entryProgress - 1.6 / 2.6) / (0.5 / 2.6));
        basePosition.current.lerpVectors(
          exitFromPosition.current.set(...anchors.curtainThreshold.position),
          exitToPosition.current.set(...anchors.interiorEntry.position),
          progress,
        );
        lookTarget.current.lerpVectors(
          exitFromTarget.current.set(...anchors.curtainThreshold.lookAt),
          exitToTarget.current.set(...anchors.interiorEntry.lookAt),
          progress,
        );
        fovValue.current = anchors.interiorEntry.fov;
      } else {
        const progress = eased((entryProgress - 2.1 / 2.6) / (0.5 / 2.6));
        basePosition.current.lerpVectors(
          exitFromPosition.current.set(...anchors.interiorEntry.position),
          exitToPosition.current.set(...anchors.interiorHome.position),
          progress,
        );
        lookTarget.current.lerpVectors(
          exitFromTarget.current.set(...anchors.interiorEntry.lookAt),
          exitToTarget.current.set(...anchors.interiorHome.lookAt),
          progress,
        );
        fovValue.current = MathUtils.lerp(anchors.interiorEntry.fov, anchors.interiorHome.fov, progress);
      }

      camera.position.copy(basePosition.current);
      camera.lookAt(lookTarget.current);
      if ("fov" in camera && camera.fov !== fovValue.current) applyFov(camera as PerspectiveCamera, fovValue.current);
      return;
    }

    entryCaptured.current = false;

    if (phase === "exiting") {
      const anchors = exitAnchorsForViewport(size.width, size.height);
      const helper = quaternionHelper.current;

      if (!exitCaptured.current) {
        exitCaptured.current = true;
        exitStartPosition.current.copy(camera.position);
        exitStartQuaternion.current.copy(camera.quaternion);
        camera.getWorldDirection(exitDirection.current);
        exitStartTarget.current.copy(camera.position).addScaledVector(exitDirection.current, 2.3);
        exitStartFov.current = "fov" in camera ? camera.fov : fovValue.current;

        helper.position.set(...anchors.interiorExitAligned.position);
        helper.lookAt(new Vector3(...anchors.interiorExitAligned.lookAt));
        exitAlignedQuaternion.current.copy(helper.quaternion);
        helper.position.set(...anchors.exteriorHome.position);
        helper.lookAt(new Vector3(...anchors.exteriorHome.lookAt));
        exteriorHomeQuaternion.current.copy(helper.quaternion);
      }

      orbitTarget.current.set(0, 0);
      orbit.current.set(0, 0);
      zoom.current = 0;
      parallax.current.set(0, 0, 0);
      engagement.current = 0;

      const prepareEnd = 0.25 / 3.1;
      const recenterEnd = 0.7 / 3.1;
      const interiorThresholdEnd = 1.35 / 3.1;
      const reducedSwap = 1.4 / 3.1;
      const exteriorThresholdEnd = 1.65 / 3.1;
      const exteriorClearEnd = 2.2 / 3.1;
      const settleEnd = 2.85 / 3.1;

      if (reducedMotion) {
        if (exitProgress < reducedSwap) {
          basePosition.current.copy(exitStartPosition.current);
          lookTarget.current.copy(exitStartTarget.current);
          fovValue.current = exitStartFov.current;
          camera.quaternion.copy(exitStartQuaternion.current);
        } else {
          basePosition.current.set(...anchors.exteriorHome.position);
          lookTarget.current.set(...anchors.exteriorHome.lookAt);
          fovValue.current = anchors.exteriorHome.fov;
          camera.quaternion.copy(exteriorHomeQuaternion.current);
        }
      } else if (exitProgress < prepareEnd) {
        basePosition.current.copy(exitStartPosition.current);
        lookTarget.current.copy(exitStartTarget.current);
        fovValue.current = exitStartFov.current;
        camera.quaternion.copy(exitStartQuaternion.current);
      } else if (exitProgress < recenterEnd) {
        const progress = eased((exitProgress - prepareEnd) / (recenterEnd - prepareEnd));
        basePosition.current.lerpVectors(
          exitStartPosition.current,
          exitToPosition.current.set(...anchors.interiorExitAligned.position),
          progress,
        );
        lookTarget.current.lerpVectors(
          exitStartTarget.current,
          exitToTarget.current.set(...anchors.interiorExitAligned.lookAt),
          progress,
        );
        fovValue.current = MathUtils.lerp(exitStartFov.current, anchors.interiorExitAligned.fov, progress);
        camera.quaternion.slerpQuaternions(exitStartQuaternion.current, exitAlignedQuaternion.current, progress);
      } else if (exitProgress < interiorThresholdEnd) {
        const progress = eased((exitProgress - recenterEnd) / (interiorThresholdEnd - recenterEnd));
        basePosition.current.lerpVectors(
          exitFromPosition.current.set(...anchors.interiorExitAligned.position),
          exitToPosition.current.set(...anchors.interiorThreshold.position),
          progress,
        );
        lookTarget.current.lerpVectors(
          exitFromTarget.current.set(...anchors.interiorExitAligned.lookAt),
          exitToTarget.current.set(...anchors.interiorThreshold.lookAt),
          progress,
        );
        fovValue.current = anchors.interiorThreshold.fov;
        camera.quaternion.copy(exitAlignedQuaternion.current);
      } else if (exitProgress < exteriorThresholdEnd) {
        const progress = eased(
          (exitProgress - interiorThresholdEnd) / (exteriorThresholdEnd - interiorThresholdEnd),
        );
        basePosition.current.lerpVectors(
          exitFromPosition.current.set(...anchors.interiorThreshold.position),
          exitToPosition.current.set(...anchors.exteriorThreshold.position),
          progress,
        );
        lookTarget.current.lerpVectors(
          exitFromTarget.current.set(...anchors.interiorThreshold.lookAt),
          exitToTarget.current.set(...anchors.exteriorThreshold.lookAt),
          progress,
        );
        fovValue.current = anchors.exteriorThreshold.fov;
        camera.quaternion.copy(exitAlignedQuaternion.current);
      } else if (exitProgress < exteriorClearEnd) {
        const progress = eased(
          (exitProgress - exteriorThresholdEnd) / (exteriorClearEnd - exteriorThresholdEnd),
        );
        basePosition.current.lerpVectors(
          exitFromPosition.current.set(...anchors.exteriorThreshold.position),
          exitToPosition.current.set(...anchors.exteriorClear.position),
          progress,
        );
        lookTarget.current.lerpVectors(
          exitFromTarget.current.set(...anchors.exteriorThreshold.lookAt),
          exitToTarget.current.set(...anchors.exteriorClear.lookAt),
          progress,
        );
        fovValue.current = anchors.exteriorClear.fov;
        camera.quaternion.copy(exitAlignedQuaternion.current);
      } else if (exitProgress < settleEnd) {
        const progress = eased((exitProgress - exteriorClearEnd) / (settleEnd - exteriorClearEnd));
        basePosition.current.lerpVectors(
          exitFromPosition.current.set(...anchors.exteriorClear.position),
          exitToPosition.current.set(...anchors.exteriorHome.position),
          progress,
        );
        lookTarget.current.lerpVectors(
          exitFromTarget.current.set(...anchors.exteriorClear.lookAt),
          exitToTarget.current.set(...anchors.exteriorHome.lookAt),
          progress,
        );
        fovValue.current = MathUtils.lerp(anchors.exteriorClear.fov, anchors.exteriorHome.fov, progress);
        camera.quaternion.slerpQuaternions(exitAlignedQuaternion.current, exteriorHomeQuaternion.current, progress);
      } else {
        basePosition.current.set(...anchors.exteriorHome.position);
        lookTarget.current.set(...anchors.exteriorHome.lookAt);
        fovValue.current = anchors.exteriorHome.fov;
        camera.quaternion.copy(exteriorHomeQuaternion.current);
      }

      camera.position.copy(basePosition.current);
      if ("fov" in camera && camera.fov !== fovValue.current) applyFov(camera as PerspectiveCamera, fovValue.current);
      return;
    }

    exitCaptured.current = false;

    const exterior = phase === "loading" || phase === "outside";
    const allowPointerMotion = !reducedMotion && !coarsePointer;
    let targetParallax = { x: 0, y: 0 };
    if (exterior && !dragging && allowPointerMotion) targetParallax = { x: pointer.x * 0.075, y: pointer.y * 0.028 };
    parallax.current.x = MathUtils.lerp(parallax.current.x, targetParallax.x, 0.04);
    parallax.current.y = MathUtils.lerp(parallax.current.y, targetParallax.y, 0.04);

    orbit.current.lerp(orbitTarget.current, reducedMotion ? 1 : 0.1);
    engagement.current = MathUtils.lerp(engagement.current, exterior && engaged ? 1 : 0, reducedMotion ? 1 : 0.055);
    const idleX = exterior && !reducedMotion ? Math.sin(state.clock.elapsedTime * 0.16) * 0.012 : 0;
    const idleY = exterior && !reducedMotion ? Math.sin(state.clock.elapsedTime * 0.12 + 1.2) * 0.008 : 0;
    const controlsEnabled = phase === "inside";
    const orbitX = controlsEnabled ? orbit.current.x * 5.2 : 0;
    const orbitY = controlsEnabled ? orbit.current.y * 3.2 : 0;

    camera.position.set(
      basePosition.current.x + parallax.current.x + idleX + orbitX,
      basePosition.current.y + parallax.current.y + idleY + orbitY,
      basePosition.current.z - engagement.current * 0.085 + (controlsEnabled ? zoom.current : 0),
    );
    camera.lookAt(
      lookTarget.current.x + orbitX * 0.18,
      lookTarget.current.y + orbitY * 0.18,
      lookTarget.current.z,
    );

    if ("fov" in camera && camera.fov !== fovValue.current) applyFov(camera as PerspectiveCamera, fovValue.current);
  });

  return null;
}
