export const ENTRANCE_TUNING = {
  revealDuration: 3,
  enterDuration: 1.55,
  boothScale: 0.94,
  environmentVisibility: 0.92,
  grainOpacity: 0.052,
  lighting: {
    keyIntensity: 138,
    fillIntensity: 24,
    rimIntensity: 48,
    ambientIntensity: 0.34,
    curtainGlowIntensity: 4.4,
    hoverBoost: 1.12,
  },
  camera: {
    desktop: {
      position: [2.35, 0.95, 7.45] as const,
      lookAt: [-0.12, -0.18, 0] as const,
      fov: 40,
    },
    tablet: {
      position: [1.15, 0.72, 7.7] as const,
      lookAt: [-0.05, -0.2, 0] as const,
      fov: 42,
    },
    mobile: {
      position: [0, 0.3, 8.35] as const,
      lookAt: [0, -0.2, 0] as const,
      fov: 43,
    },
  },
} as const;
