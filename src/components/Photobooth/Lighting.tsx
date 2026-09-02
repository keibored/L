import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { MathUtils, type AmbientLight, type PointLight, type SpotLight } from "three";
import { OBJECT_POSITIONS } from "./interior/interiorLayout";
import { ENTRANCE_TUNING } from "./entranceConfig";
import type { TransitionRef } from "../../hooks/useTransitionDirector";

interface LightingProps {
  active: boolean;
  attention: boolean;
  revealing: boolean;
  reducedMotion: boolean;
  strength?: number;
  transitionRef?: TransitionRef;
}
function smoothReveal(value: number, start: number, end: number) {
  const normalized = MathUtils.clamp((value - start) / (end - start), 0, 1);
  return normalized * normalized * (3 - 2 * normalized);
}

export function Lighting({ active, attention, revealing, reducedMotion, strength = 1, transitionRef }: LightingProps) {
  const keyRef = useRef<SpotLight>(null);
  const fillRef = useRef<SpotLight>(null);
  const rimRef = useRef<PointLight>(null);
  const ambientRef = useRef<AmbientLight>(null);
  const glowRef = useRef<PointLight>(null);
  const leakRef = useRef<PointLight>(null);

  useFrame((state) => {
    const time = state.clock.elapsedTime;
    const reveal = revealing
      ? smoothReveal(time, reducedMotion ? 0 : 0.35, reducedMotion ? 0.45 : 2.55)
      : 1;
    const flickerWindow = !reducedMotion && time > 1.05 && time < 1.48;
    const flicker = flickerWindow
      ? 1 - Math.sin(((time - 1.05) / 0.43) * Math.PI) * 0.22
      : 1;
    const hoverBoost = attention ? ENTRANCE_TUNING.lighting.hoverBoost : 1;
    const breathing = reducedMotion ? 1 : 1 + Math.sin(time * 0.72) * 0.022;
    const liveStrength = transitionRef ? 1 - transitionRef.current.interiorBlend : strength;

    if (keyRef.current) {
      keyRef.current.intensity = ENTRANCE_TUNING.lighting.keyIntensity * reveal * flicker * hoverBoost * liveStrength;
    }
    if (fillRef.current) fillRef.current.intensity = ENTRANCE_TUNING.lighting.fillIntensity * reveal * liveStrength;
    if (rimRef.current) rimRef.current.intensity = ENTRANCE_TUNING.lighting.rimIntensity * reveal * liveStrength;
    if (ambientRef.current) {
      ambientRef.current.intensity = ENTRANCE_TUNING.lighting.ambientIntensity * Math.max(reveal, 0.08) * liveStrength;
    }
    if (glowRef.current) {
      const base = active ? 9 : ENTRANCE_TUNING.lighting.curtainGlowIntensity;
      glowRef.current.intensity = base * reveal * breathing * hoverBoost * liveStrength;
    }
    if (leakRef.current) {
      leakRef.current.intensity = (active ? 0.75 : attention ? 2.75 : 1.65) * Math.max(reveal, 0.15) * liveStrength;
    }
  });

  return (
    <group>
      <spotLight
        ref={keyRef}
        position={[-2.3, 3.6, 4.7]}
        intensity={0}
        angle={0.6}
        penumbra={0.78}
        color="#ffd0a0"
        castShadow
        shadow-mapSize={[1024, 1024]}
        shadow-bias={-0.0003}
        shadow-radius={4}
      />
      <spotLight
        ref={fillRef}
        position={[2.8, 1.7, 4.1]}
        intensity={0}
        angle={0.68}
        penumbra={0.96}
        color="#d1b7a5"
      />
      <pointLight
        ref={rimRef}
        position={[0.8, 2.5, -3.9]}
        intensity={0}
        color="#73839f"
        distance={13}
        decay={2}
      />
      <ambientLight ref={ambientRef} intensity={0.03} color="#4a382f" />
      <pointLight
        ref={glowRef}
        position={[-0.15, 0.9, -1.15]}
        intensity={0}
        distance={4.2}
        decay={2}
        color="#ff9d70"
        castShadow={active}
        shadow-mapSize={[1024, 1024]}
        shadow-bias={-0.001}
        shadow-radius={4}
      />
      <pointLight
        ref={leakRef}
        position={[0, 0.35, 0.8]}
        intensity={0}
        distance={2.6}
        decay={2}
        color="#e9968d"
      />

      {active && (
        <>
          <pointLight
            position={[OBJECT_POSITIONS.photostrip[0], OBJECT_POSITIONS.photostrip[1] + 0.25, OBJECT_POSITIONS.photostrip[2] + 0.3]}
            intensity={3.4}
            distance={1.2}
            decay={2}
            color="#ffcf94"
          />
          <pointLight
            position={[OBJECT_POSITIONS.surprise[0], OBJECT_POSITIONS.surprise[1] + 0.35, OBJECT_POSITIONS.surprise[2] + 0.2]}
            intensity={2.6}
            distance={1}
            decay={2}
            color="#ffb0bc"
          />
          <pointLight
            position={[OBJECT_POSITIONS.letters[0], OBJECT_POSITIONS.letters[1] + 0.28, OBJECT_POSITIONS.letters[2] + 0.2]}
            intensity={1.8}
            distance={0.9}
            decay={2}
            color="#ffdcb0"
          />
          <pointLight position={[-0.6, 0.35, -1.7]} intensity={1.6} distance={0.85} decay={2} color="#8ea3c4" />
        </>
      )}
    </group>
  );
}
