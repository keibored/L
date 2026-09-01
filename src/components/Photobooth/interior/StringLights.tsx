import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import type { InstancedMesh } from "three";
import { Color, Object3D } from "three";
import { BOOTH, INTERIOR_BACK_Z } from "../boothConfig";
import { STRING_LIGHT_Y } from "./interiorLayout";

const BULB_COUNT = 11;
const dummy = new Object3D();
const warmColor = new Color("#ffcf9e");

export function StringLights() {
  const meshRef = useRef<InstancedMesh>(null);

  const bulbs = useMemo(() => {
    const list: { x: number; baseY: number; z: number; phase: number }[] = [];
    for (let i = 0; i < BULB_COUNT; i++) {
      const t = i / (BULB_COUNT - 1);
      const x = (t - 0.5) * (BOOTH.openingWidth - 0.16);
      const sag = Math.sin(t * Math.PI) * 0.14;
      list.push({ x, baseY: STRING_LIGHT_Y - sag, z: INTERIOR_BACK_Z + 0.62, phase: i * 0.7 });
    }
    return list;
  }, []);

  useFrame((state) => {
    if (!meshRef.current) return;
    bulbs.forEach((bulb, i) => {
      const flicker = 0.75 + Math.sin(state.clock.elapsedTime * 2.2 + bulb.phase) * 0.25;
      dummy.position.set(bulb.x, bulb.baseY, bulb.z);
      dummy.scale.setScalar(0.022 * flicker);
      dummy.updateMatrix();
      meshRef.current!.setMatrixAt(i, dummy.matrix);
    });
    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <group>
      {/* Wire */}
      <mesh position={[0, STRING_LIGHT_Y - 0.06, INTERIOR_BACK_Z + 0.62]}>
        <boxGeometry args={[BOOTH.openingWidth - 0.16, 0.004, 0.004]} />
        <meshStandardMaterial color="#1a130f" roughness={0.7} />
      </mesh>
      <instancedMesh ref={meshRef} args={[undefined, undefined, BULB_COUNT]}>
        <sphereGeometry args={[1, 10, 10]} />
        <meshStandardMaterial color={warmColor} emissive={warmColor} emissiveIntensity={1.4} roughness={0.4} />
      </instancedMesh>
      <pointLight position={[bulbs[2]?.x ?? -0.6, STRING_LIGHT_Y, INTERIOR_BACK_Z + 0.62]} intensity={0.9} distance={1.4} color="#ffcf9e" decay={2} />
      <pointLight position={[bulbs[8]?.x ?? 0.6, STRING_LIGHT_Y, INTERIOR_BACK_Z + 0.62]} intensity={0.9} distance={1.4} color="#ffcf9e" decay={2} />
    </group>
  );
}
