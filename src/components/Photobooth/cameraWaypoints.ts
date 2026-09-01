import type { ObjectId } from "../../state/ExperienceContext";
import { OBJECT_POSITIONS } from "./interior/interiorLayout";
import { ENTRANCE_TUNING } from "./entranceConfig";

export interface Waypoint {
  position: readonly [number, number, number];
  lookAt: readonly [number, number, number];
  fov: number;
}

export const EXTERIOR: Waypoint = {
  ...ENTRANCE_TUNING.camera.desktop,
};

export function exteriorWaypointForViewport(width: number, height: number): Waypoint {
  const aspect = width / Math.max(height, 1);
  if (width <= 680 || aspect < 0.82) return { ...ENTRANCE_TUNING.camera.mobile };
  if (width <= 1024 || aspect < 1.2) return { ...ENTRANCE_TUNING.camera.tablet };
  return EXTERIOR;
}

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
