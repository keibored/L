import { useEffect, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import type { PerspectiveCamera } from "three";
import { gsap } from "gsap";
import { MathUtils, Vector3 } from "three";
import { useExperience } from "../../state/ExperienceContext";
import { EXTERIOR, INTERIOR, exteriorWaypointForViewport, focusWaypoint, type Waypoint } from "./cameraWaypoints";

function applyFov(target: PerspectiveCamera, fov: number) {
  target.fov = fov;
  target.updateProjectionMatrix();
}

interface CameraRigProps {
  dragging: boolean;
  engaged: boolean;
  reducedMotion: boolean;
  coarsePointer: boolean;
}

export function CameraRig({ dragging, engaged, reducedMotion, coarsePointer }: CameraRigProps) {
  const { camera, pointer, size } = useThree();
  const { phase, focusedObject } = useExperience();

  const basePosition = useRef(new Vector3(...EXTERIOR.position));
  const lookTarget = useRef(new Vector3(...EXTERIOR.lookAt));
  const fovValue = useRef(EXTERIOR.fov);
  const parallax = useRef(new Vector3());
  const engagement = useRef(0);
  const tweenRef = useRef<gsap.core.Timeline | null>(null);
  const hasInit = useRef(false);

  useEffect(() => {
    if (!hasInit.current) return;

    let waypoint: Waypoint = INTERIOR;
    if (phase === "loading" || phase === "exterior") waypoint = exteriorWaypointForViewport(size.width, size.height);
    else if (phase === "interior") waypoint = INTERIOR;
    else if (phase === "focused" && focusedObject) waypoint = focusWaypoint(focusedObject);
    else if (phase === "entering") waypoint = INTERIOR;

    tweenRef.current?.kill();
    const duration = reducedMotion ? 0.3 : phase === "entering" || phase === "interior" ? 1.5 : 1.1;
    const fovObj = { fov: fovValue.current };
    const tl = gsap.timeline();
    tl.to(
      basePosition.current,
      { x: waypoint.position[0], y: waypoint.position[1], z: waypoint.position[2], duration, ease: "power2.inOut" },
      0,
    );
    tl.to(
      lookTarget.current,
      { x: waypoint.lookAt[0], y: waypoint.lookAt[1], z: waypoint.lookAt[2], duration, ease: "power2.inOut" },
      0,
    );
    tl.to(
      fovObj,
      {
        fov: waypoint.fov,
        duration: 1.1,
        ease: "power2.inOut",
        onUpdate() {
          fovValue.current = fovObj.fov;
        },
      },
      0,
    );
    tweenRef.current = tl;
  }, [phase, focusedObject, reducedMotion, size.height, size.width]);

  useFrame((state) => {
    if (!hasInit.current) {
      const initial = exteriorWaypointForViewport(size.width, size.height);
      basePosition.current.set(...initial.position);
      lookTarget.current.set(...initial.lookAt);
      fovValue.current = initial.fov;
      hasInit.current = true;
    }

    // Subtle depth-giving parallax. Frozen on the exterior while the curtain is
    // being dragged so the panel being grabbed never drifts out from under the cursor.
    let targetParallax = { x: 0, y: 0 };
    const allowPointerMotion = !reducedMotion && !coarsePointer;
    if (phase === "interior" && allowPointerMotion) targetParallax = { x: pointer.x * 0.07, y: pointer.y * 0.04 };
    else if (phase === "exterior" && !dragging && allowPointerMotion) targetParallax = { x: pointer.x * 0.075, y: pointer.y * 0.028 };
    parallax.current.x = MathUtils.lerp(parallax.current.x, targetParallax.x, 0.04);
    parallax.current.y = MathUtils.lerp(parallax.current.y, targetParallax.y, 0.04);

    const exterior = phase === "loading" || phase === "exterior";
    engagement.current = MathUtils.lerp(engagement.current, exterior && engaged ? 1 : 0, reducedMotion ? 1 : 0.055);
    const idleX = exterior && !reducedMotion ? Math.sin(state.clock.elapsedTime * 0.16) * 0.012 : 0;
    const idleY = exterior && !reducedMotion ? Math.sin(state.clock.elapsedTime * 0.12 + 1.2) * 0.008 : 0;

    camera.position.set(
      basePosition.current.x + parallax.current.x + idleX,
      basePosition.current.y + parallax.current.y + idleY,
      basePosition.current.z - engagement.current * 0.085,
    );
    camera.lookAt(lookTarget.current);

    if ("fov" in camera && camera.fov !== fovValue.current) {
      applyFov(camera as PerspectiveCamera, fovValue.current);
    }
  });

  return null;
}
