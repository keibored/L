import type { ObjectId } from "../../state/ExperienceContext";
import { OBJECT_POSITIONS } from "./interior/interiorLayout";

export interface Waypoint {
  position: readonly [number, number, number];
  lookAt: readonly [number, number, number];
  fov: number;
}

export const EXTERIOR: Waypoint = {
  position: [2.55, 1.15, 6.9],
  lookAt: [-0.1, -0.15, 0],
  fov: 40,
};

export const INTERIOR: Waypoint = {
  position: [0.4, -0.52, -0.18],
  lookAt: [-0.08, -0.92, -1.55],
  fov: 50,
};

export function focusWaypoint(id: ObjectId): Waypoint {
  const [x, y, z] = OBJECT_POSITIONS[id];
  return {
    position: [x * 0.4, y + 0.06, z + 0.45],
    lookAt: [x, y, z],
    fov: 26,
  };
}
