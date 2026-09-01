export const BOOTH = {
  outerWidth: 3.2,
  outerHeight: 4.4,
  outerRadius: 0.5,
  frameDepth: 0.5,
  interiorDepth: 1.55,
  openingWidth: 2.15,
  openingHeight: 3.35,
  openingRadius: 0.32,
  openingCenterY: -0.15,
} as const;

export const OPENING_TOP = BOOTH.openingCenterY + BOOTH.openingHeight / 2;
export const OPENING_BOTTOM = BOOTH.openingCenterY - BOOTH.openingHeight / 2;
export const FRAME_FRONT_Z = 0;
export const FRAME_BACK_Z = -BOOTH.frameDepth;
export const INTERIOR_BACK_Z = FRAME_BACK_Z - BOOTH.interiorDepth;

export const WOOD_COLORS = {
  base: "#68472f",
  grainDark: "#2f1d13",
  grainLight: "#8d6242",
} as const;

export const WOOD_DARK_COLORS = {
  base: "#2c1e17",
  grainDark: "#170f0a",
  grainLight: "#3c2a1f",
} as const;

export const CURTAIN_COLOR = "#b97874";
