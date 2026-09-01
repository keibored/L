export const ENTRANCE_TUNING = {
  revealDuration: 3,
  enterDuration: 1.55,
  boothScale: 0.9,
  environmentVisibility: 0.98,
  floorVisibility: 0.96,
  rendererExposure: 1.22,
  gridOpacity: 0.66,
  grainOpacity: 0.046,
  vignetteDarkness: 0.66,
  lighting: {
    keyIntensity: 162,
    environmentKeyIntensity: 76,
    fillIntensity: 42,
    rimIntensity: 68,
    ambientIntensity: 0.62,
    hemisphereIntensity: 0.46,
    curtainGlowIntensity: 4.8,
    hoverBoost: 1.12,
  },
  camera: {
    desktop: {
      position: [1.18, 0.64, 8.35] as const,
      lookAt: [-0.18, 0.02, 0] as const,
      fov: 40,
    },
    tablet: {
      position: [0.48, 0.52, 8.65] as const,
      lookAt: [0, 0, 0] as const,
      fov: 42,
    },
    mobile: {
      position: [0, 0.42, 9.05] as const,
      lookAt: [0, -0.02, 0] as const,
      fov: 43,
    },
  },
} as const;
