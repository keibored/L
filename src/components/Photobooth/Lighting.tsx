import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import type { PointLight } from "three";
import { OBJECT_POSITIONS } from "./interior/interiorLayout";

interface LightingProps {
  active: boolean;
}

export function Lighting({ active }: LightingProps) {
  const glowRef = useRef<PointLight>(null);

  useFrame((state) => {
    if (!glowRef.current) return;
    const flicker = 1 + Math.sin(state.clock.elapsedTime * 1.6) * 0.05;
    glowRef.current.intensity = (active ? 9 : 4) * flicker;
  });

  return (
    <group>
      {/* Warm key light — directional so real shadow falls, not a flat wash */}
      <spotLight
        position={[-2.3, 3.4, 4.6]}
        intensity={155}
        angle={0.58}
        penumbra={0.65}
        color="#ffd2a0"
        castShadow
        shadow-mapSize={[1536, 1536]}
        shadow-bias={-0.0003}
        shadow-radius={3}
      />

      {/* Fill — enough to keep the shadow side legible without cancelling the shadow */}
      <spotLight position={[2.7, 1.6, 4.2]} intensity={32} angle={0.65} penumbra={0.95} color="#d4c2ae" />

      {/* Cool rim light separating the booth silhouette from the backdrop */}
      <pointLight position={[0.5, 2.6, -3.8]} intensity={62} color="#7f93b8" distance={13} decay={2} />

      {/* Ambient fill — enough to keep wood surfaces legible, low enough to preserve contrast */}
      <ambientLight intensity={0.45} color="#4a3b2e" />

      {/* Interior warm glow, brightens once the curtain opens — the only light that
          reaches the desk objects, so it casts real contact shadows to ground them */}
      <pointLight
        ref={glowRef}
        position={[-0.15, 0.9, -1.15]}
        intensity={4}
        distance={4.2}
        decay={2}
        color="#ff9d5c"
        castShadow={active}
        shadow-mapSize={[1024, 1024]}
        shadow-bias={-0.001}
        shadow-radius={4}
      />

      {/* Small glow that always leaks through the curtain gap */}
      <pointLight position={[0, 0.4, 1.1]} intensity={active ? 0.7 : 1.8} distance={2.3} color="#ffb17a" />

      {/* Selective accent lights — the eye should be pulled to these, everything else may fall into shadow */}
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
