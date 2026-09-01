import { useEffect, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import type { PerspectiveCamera } from "three";
import { gsap } from "gsap";
import { MathUtils, Vector3 } from "three";
import { useExperience } from "../../state/ExperienceContext";
import { EXTERIOR, INTERIOR, focusWaypoint, type Waypoint } from "./cameraWaypoints";

function applyFov(target: PerspectiveCamera, fov: number) {
  target.fov = fov;
  target.updateProjectionMatrix();
}

interface CameraRigProps {
  dragging: boolean;
}

export function CameraRig({ dragging }: CameraRigProps) {
  const { camera, pointer } = useThree();
  const { phase, focusedObject } = useExperience();

  const basePosition = useRef(new Vector3(...EXTERIOR.position));
  const lookTarget = useRef(new Vector3(...EXTERIOR.lookAt));
  const fovValue = useRef(EXTERIOR.fov);
  const parallax = useRef(new Vector3());
  const tweenRef = useRef<gsap.core.Timeline | null>(null);
  const hasInit = useRef(false);

  useEffect(() => {
    if (!hasInit.current) return;

    let waypoint: Waypoint = INTERIOR;
    if (phase === "exterior") waypoint = EXTERIOR;
    else if (phase === "interior") waypoint = INTERIOR;
    else if (phase === "focused" && focusedObject) waypoint = focusWaypoint(focusedObject);
    else if (phase === "entering") waypoint = INTERIOR;

    tweenRef.current?.kill();
    const duration = phase === "entering" || phase === "interior" ? 1.5 : 1.1;
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
  }, [phase, focusedObject]);

  useFrame(() => {
    if (!hasInit.current) {
      basePosition.current.set(...EXTERIOR.position);
      lookTarget.current.set(...EXTERIOR.lookAt);
      fovValue.current = EXTERIOR.fov;
      hasInit.current = true;
    }

    // Subtle depth-giving parallax. Frozen on the exterior while the curtain is
    // being dragged so the panel being grabbed never drifts out from under the cursor.
    let targetParallax = { x: 0, y: 0 };
    if (phase === "interior") targetParallax = { x: pointer.x * 0.07, y: pointer.y * 0.04 };
    else if (phase === "exterior" && !dragging) targetParallax = { x: pointer.x * 0.1, y: pointer.y * 0.035 };
    parallax.current.x = MathUtils.lerp(parallax.current.x, targetParallax.x, 0.04);
    parallax.current.y = MathUtils.lerp(parallax.current.y, targetParallax.y, 0.04);

    camera.position.set(
      basePosition.current.x + parallax.current.x,
      basePosition.current.y + parallax.current.y,
      basePosition.current.z,
    );
    camera.lookAt(lookTarget.current);

    if ("fov" in camera && camera.fov !== fovValue.current) {
      applyFov(camera as PerspectiveCamera, fovValue.current);
    }
  });

  return null;
}
