import { INTERIOR_BACK_Z, OPENING_BOTTOM, OPENING_TOP } from "../boothConfig";

export type LegacyObjectId = "memories" | "photostrip" | "letters" | "song" | "surprise";

export const FLOOR_Y = OPENING_BOTTOM + 0.02;
export const DESK_TOP_Y = FLOOR_Y + 0.55;
export const DESK_Z = -1.45;
export const DESK_DEPTH = 0.66;
export const DESK_WIDTH = 1.95;
export const DESK_THICKNESS = 0.05;

// Asymmetric, layered placement: memories anchors the back, photostrip hangs
// higher in the midground, the rest sit in the foreground at varying depths
// so the eye travels through the scene rather than scanning a straight row.
export const OBJECT_POSITIONS: Record<LegacyObjectId, readonly [number, number, number]> = {
  memories: [-0.12, DESK_TOP_Y + 0.32, INTERIOR_BACK_Z + 0.34],
  photostrip: [0.72, DESK_TOP_Y + 0.82, INTERIOR_BACK_Z + 0.5],
  letters: [-0.68, DESK_TOP_Y + 0.02, DESK_Z + 0.3],
  song: [0.08, DESK_TOP_Y + 0.06, DESK_Z + 0.08],
  surprise: [0.64, DESK_TOP_Y + 0.1, DESK_Z + 0.24],
};

export const OBJECT_LABELS: Record<LegacyObjectId, string> = {
  memories: "OUR MEMORIES",
  photostrip: "PHOTO STRIP",
  letters: "LETTERS",
  song: "OUR SONG",
  surprise: "LITTLE SURPRISE",
};

// Non-interactive dressing that sells "this is a real photobooth" and adds depth
export const CAMERA_PROP_POSITION: readonly [number, number, number] = [
  -0.5,
  FLOOR_Y + 0.62,
  INTERIOR_BACK_Z + 0.32,
];

export const STOOL_POSITION: readonly [number, number, number] = [-0.72, FLOOR_Y, DESK_Z + 0.65];

export const RUG_POSITION: readonly [number, number, number] = [0.05, FLOOR_Y + 0.003, DESK_Z + 0.15];

export const SHELF_Y = OPENING_TOP - 0.62;
export const STRING_LIGHT_Y = OPENING_TOP - 0.18;

export const PHOTO_FRAME_POSITIONS: readonly (readonly [number, number, number, number])[] = [
  // x, y, z, rotationZ
  [0.6, SHELF_Y + 0.02, INTERIOR_BACK_Z + 0.16, -0.06],
  [0.83, SHELF_Y - 0.16, INTERIOR_BACK_Z + 0.16, 0.09],
];
