import { EffectComposer, Bloom, Vignette, Noise, DepthOfField, BrightnessContrast, HueSaturation } from "@react-three/postprocessing";
import { BlendFunction } from "postprocessing";
import { useExperience } from "../../state/ExperienceContext";

// Camera near/far are fixed at 0.05 / 20 (set on the Canvas camera prop) so these
// normalized focus distances are calibrated against the scene's real depth range,
// not the renderer's default near/far which would put "focus" far outside the booth.
const FOCUS_DISTANCE = {
  exterior: 0.373,
  interior: 0.08,
  focused: 0.045,
};

export function EffectsPipeline() {
  const { phase } = useExperience();
  const focused = phase === "focusing" || phase === "content";
  const interior = phase === "inside" || phase === "entering" || phase === "exiting";

  const focusDistance = focused ? FOCUS_DISTANCE.focused : interior ? FOCUS_DISTANCE.interior : FOCUS_DISTANCE.exterior;
  // Exterior keeps deep focus (near-zero bokeh) — it's a wide establishing shot,
  // and the wider distance range there is far more error-prone to hand-tune.
  const bokehScale = focused ? 1.4 : interior ? 0.7 : 0.08;

  return (
    <EffectComposer multisampling={0} enableNormalPass={false} stencilBuffer>
      <DepthOfField
        focusDistance={focusDistance}
        focalLength={focused ? 0.028 : 0.016}
        bokehScale={bokehScale}
        height={480}
      />
      <Bloom
        intensity={0.4}
        luminanceThreshold={0.82}
        luminanceSmoothing={0.25}
        mipmapBlur
        radius={0.5}
      />
      <BrightnessContrast brightness={0.02} contrast={0.09} />
      <HueSaturation saturation={-0.06} />
      <Noise premultiply blendFunction={BlendFunction.OVERLAY} opacity={0.045} />
      <Vignette eskil={false} offset={0.2} darkness={0.85} />
    </EffectComposer>
  );
}
