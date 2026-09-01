export const ENTRANCE_TUNING = {
  revealDuration: 3,
  enterDuration: 1.55,
  boothScale: 0.94,
  environmentVisibility: 0.95,
  grainOpacity: 0.052,
  lighting: {
    keyIntensity: 149,
    fillIntensity: 26.4,
    rimIntensity: 52.8,
    ambientIntensity: 0.374,
    curtainGlowIntensity: 4.4,
    hoverBoost: 1.12,
  },
  camera: {
    desktop: {
      position: [1.32, 0.58, 7.65] as const,
      lookAt: [0, -0.22, 0] as const,
      fov: 40,
    },
    tablet: {
      position: [0.66, 0.48, 7.88] as const,
      lookAt: [0, -0.22, 0] as const,
      fov: 42,
    },
    mobile: {
      position: [0, 0.3, 8.35] as const,
      lookAt: [0, -0.2, 0] as const,
      fov: 43,
    },
  },
} as const;
