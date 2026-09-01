import { useRef, type ReactNode } from "react";
import { useFrame, type ThreeEvent } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import type { Group } from "three";
import { MathUtils } from "three";
import { useExperience, type ObjectId } from "../../../state/ExperienceContext";
import { OBJECT_LABELS } from "./interiorLayout";

interface InteractiveObjectProps {
  id: ObjectId;
  position: readonly [number, number, number];
  labelOffsetY?: number;
  interactive: boolean;
  children: ReactNode;
}

// Each object gets a small, distinct hover personality rather than one generic bump.
const HOVER_TILT: Record<ObjectId, number> = {
  memories: 0,
  photostrip: 0.09,
  letters: -0.05,
  song: 0,
  surprise: 0.04,
};

const HOVER_LIFT: Record<ObjectId, number> = {
  memories: 0.015,
  photostrip: 0.03,
  letters: 0.012,
  song: 0.01,
  surprise: 0.03,
};

export function InteractiveObject({
  id,
  position,
  labelOffsetY = 0.3,
  interactive,
  children,
}: InteractiveObjectProps) {
  const groupRef = useRef<Group>(null);
  const { hoveredObject, setHoveredObject, focusObject } = useExperience();
  const hovered = hoveredObject === id;

  useFrame(() => {
    if (!groupRef.current) return;
    const targetScale = hovered ? 1.07 : 1;
    const s = MathUtils.lerp(groupRef.current.scale.x, targetScale, 0.15);
    groupRef.current.scale.setScalar(s);
    const targetY = position[1] + (hovered ? HOVER_LIFT[id] : 0);
    groupRef.current.position.y = MathUtils.lerp(groupRef.current.position.y, targetY, 0.15);
    const targetTilt = hovered ? HOVER_TILT[id] : 0;
    groupRef.current.rotation.z = MathUtils.lerp(groupRef.current.rotation.z, targetTilt, 0.15);
  });

  const handleOver = (event: ThreeEvent<PointerEvent>) => {
    if (!interactive) return;
    event.stopPropagation();
    setHoveredObject(id);
    document.body.style.cursor = "pointer";
  };

  const handleOut = (event: ThreeEvent<PointerEvent>) => {
    if (!interactive) return;
    event.stopPropagation();
    setHoveredObject(null);
    document.body.style.cursor = "auto";
  };

  const handleClick = (event: ThreeEvent<MouseEvent>) => {
    if (!interactive) return;
    event.stopPropagation();
    setHoveredObject(null);
    document.body.style.cursor = "auto";
    focusObject(id);
  };

  return (
    <group
      ref={groupRef}
      position={[position[0], position[1], position[2]]}
      onPointerOver={handleOver}
      onPointerOut={handleOut}
      onClick={handleClick}
    >
      {children}
      {interactive && (
        <Html position={[0, labelOffsetY, 0]} center distanceFactor={4} zIndexRange={[10, 0]}>
          <div className={`object-label${hovered ? " object-label--visible" : ""}`}>
            {OBJECT_LABELS[id]}
          </div>
        </Html>
      )}
    </group>
  );
}
