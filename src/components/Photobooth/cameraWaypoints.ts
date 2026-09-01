import type { ObjectId } from "../../state/ExperienceContext";
import { STATION_BY_ID } from "./interior/hub/stationData";
import { ENTRANCE_TUNING } from "./entranceConfig";
import { BOOTH, FRAME_BACK_Z } from "./boothConfig";
import { interiorWaypointToWorld } from "./worldLayout";

export type SceneMode = "exterior" | "interior";

export interface Waypoint {
  position: readonly [number, number, number];
  lookAt: readonly [number, number, number];
  fov: number;
}

export const EXTERIOR: Waypoint = { ...ENTRANCE_TUNING.camera.desktop };

export function exteriorWaypointForViewport(width: number, height: number): Waypoint {
  const aspect = width / Math.max(height, 1);
  if (width <= 680 || aspect < 0.82) return { ...ENTRANCE_TUNING.camera.mobile };
  if (width <= 1024 || aspect < 1.2) return { ...ENTRANCE_TUNING.camera.tablet };
  return EXTERIOR;
}

export function interiorWaypointForViewport(width: number, height: number): Waypoint {
  const aspect = width / Math.max(height, 1);
  if (width <= 680 || aspect < 0.82) {
    const portraitDistance = aspect < 0.7 ? 12.2 : 9.4;
    return interiorWaypointToWorld({ position: [0, 0.02, portraitDistance], lookAt: [0, -0.32, -0.2], fov: 58 });
  }
  if (width <= 1024 || aspect < 1.2) {
    return interiorWaypointToWorld({ position: [0.18, 0.12, 6.9], lookAt: [0, -0.36, -0.18], fov: 48 });
  }
  return interiorWaypointToWorld({ position: [0.38, 0.12, 6.35], lookAt: [0, -0.4, -0.16], fov: 44 });
}

const EXIT_VIEW_DISTANCE = 2.3;
const CURTAIN_CENTER = {
  x: 0,
  y: BOOTH.openingCenterY * ENTRANCE_TUNING.boothScale + 0.061,
  z: (FRAME_BACK_Z + 0.14) * ENTRANCE_TUNING.boothScale,
} as const;

function centeredTransitionAnchor(z: number): Waypoint {
  return {
    position: [CURTAIN_CENTER.x, CURTAIN_CENTER.y, z],
    lookAt: [CURTAIN_CENTER.x, CURTAIN_CENTER.y, z - EXIT_VIEW_DISTANCE],
    fov: 45,
  };
}

export function entryAnchorsForViewport(width: number, height: number) {
  return {
    exteriorHome: exteriorWaypointForViewport(width, height),
    exteriorApproach: centeredTransitionAnchor(CURTAIN_CENTER.z + 3.4884),
    curtainThreshold: centeredTransitionAnchor(CURTAIN_CENTER.z - 0.3816),
    interiorEntry: centeredTransitionAnchor(CURTAIN_CENTER.z - 1.4116),
    interiorHome: interiorWaypointForViewport(width, height),
  } as const;
}

export function exitAnchorsForViewport(width: number, height: number) {
  return {
    interiorHome: interiorWaypointForViewport(width, height),
    interiorExitAligned: centeredTransitionAnchor(CURTAIN_CENTER.z - 1.4116),
    interiorThreshold: centeredTransitionAnchor(CURTAIN_CENTER.z - 0.3816),
    exteriorThreshold: centeredTransitionAnchor(CURTAIN_CENTER.z + 0.7584),
    exteriorClear: centeredTransitionAnchor(CURTAIN_CENTER.z + 3.4884),
    exteriorHome: exteriorWaypointForViewport(width, height),
  } as const;
}

export function focusWaypoint(id: ObjectId, width: number): Waypoint {
  const [x, y, z] = STATION_BY_ID[id].position;
  const mobile = width <= 680;
  return interiorWaypointToWorld({
    position: [x * (mobile ? 0.26 : 0.38), y + (mobile ? 0.5 : 0.72), mobile ? 5.15 : 4.35],
    lookAt: [x * 0.86, y + 0.04, z],
    fov: mobile ? 42 : 36,
  });
}

export const INTERIOR_CONTROL_LIMITS = {
  azimuth: [-0.14, 0.14],
  polar: [-0.065, 0.08],
  zoomOffset: [-0.72, 0.68],
} as const;
