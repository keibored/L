import type { Waypoint } from "./cameraWaypoints";

export const INTERIOR_WORLD = {
  position: [0, -0.08, -8.75] as const,
  scale: 1,
} as const;

export function interiorWaypointToWorld(waypoint: Waypoint): Waypoint {
  const scale = INTERIOR_WORLD.scale;
  return {
    position: [
      INTERIOR_WORLD.position[0] + waypoint.position[0] * scale,
      INTERIOR_WORLD.position[1] + waypoint.position[1] * scale,
      INTERIOR_WORLD.position[2] + waypoint.position[2] * scale,
    ],
    lookAt: [
      INTERIOR_WORLD.position[0] + waypoint.lookAt[0] * scale,
      INTERIOR_WORLD.position[1] + waypoint.lookAt[1] * scale,
      INTERIOR_WORLD.position[2] + waypoint.lookAt[2] * scale,
    ],
    fov: waypoint.fov,
  };
}
