import { useMemo } from "react";
import { RoundedBox } from "@react-three/drei";
import { cloneRepeated, useFloorTextures, useWoodTextures } from "../../utils/textures";
import { BOOTH, FRAME_BACK_Z, INTERIOR_BACK_Z, WOOD_DARK_COLORS } from "./boothConfig";
import {
  DESK_DEPTH,
  DESK_THICKNESS,
  DESK_TOP_Y,
  DESK_WIDTH,
  DESK_Z,
  FLOOR_Y,
  RUG_POSITION,
  SHELF_Y,
} from "./interior/interiorLayout";

interface BoothInteriorProps {
  visible: boolean;
}

const CAVITY_DEPTH = FRAME_BACK_Z - INTERIOR_BACK_Z;

export function BoothInterior({ visible }: BoothInteriorProps) {
  const floorWood = useFloorTextures({ ...WOOD_DARK_COLORS, base: "#3a2519", seed: 21, knots: 1 });
  const floorTex = useMemo(() => cloneRepeated(floorWood, 2.4, 1.6), [floorWood]);

  const wallWood = useWoodTextures({ ...WOOD_DARK_COLORS, seed: 31, knots: 1 });
  const wallTex = useMemo(() => cloneRepeated(wallWood, 1.8, 2), [wallWood]);

  const deskWood = useWoodTextures({ ...WOOD_DARK_COLORS, base: "#4a3225", seed: 41, knots: 2 });
  const deskTex = useMemo(() => cloneRepeated(deskWood, 2, 1), [deskWood]);

  return (
    <group visible={visible}>
      {/* Floor platform */}
      <mesh
        position={[0, FLOOR_Y, FRAME_BACK_Z - CAVITY_DEPTH / 2]}
        rotation={[-Math.PI / 2, 0, 0]}
        receiveShadow
      >
        <planeGeometry args={[BOOTH.openingWidth - 0.05, CAVITY_DEPTH - 0.05]} />
        <meshStandardMaterial
          map={floorTex.map}
          roughnessMap={floorTex.roughnessMap}
          bumpMap={floorTex.bumpMap}
          bumpScale={0.016}
          roughness={0.55}
          metalness={0.05}
        />
      </mesh>

      {/* Soft rug for warmth and a grounded foreground layer */}
      <mesh position={RUG_POSITION} rotation={[-Math.PI / 2, 0, 0.02]} receiveShadow>
        <planeGeometry args={[1.15, 0.72]} />
        <meshStandardMaterial color="#5c2430" roughness={0.95} metalness={0} transparent opacity={0.85} />
      </mesh>

      {/* Interior back wall accent, slightly inset from the cabinet's back wall */}
      <mesh position={[0, 0.35, INTERIOR_BACK_Z + 0.05]} receiveShadow>
        <planeGeometry args={[BOOTH.openingWidth - 0.08, BOOTH.openingHeight - 0.1]} />
        <meshStandardMaterial
          map={wallTex.map}
          roughnessMap={wallTex.roughnessMap}
          bumpMap={wallTex.bumpMap}
          bumpScale={0.02}
          roughness={0.7}
          metalness={0.04}
        />
      </mesh>

      {/* Slim shelf ledge holding the small framed photos */}
      <RoundedBox
        args={[0.55, 0.025, 0.1]}
        radius={0.006}
        smoothness={2}
        position={[0.72, SHELF_Y - 0.11, INTERIOR_BACK_Z + 0.16]}
        castShadow
        receiveShadow
      >
        <meshStandardMaterial
          map={deskTex.map}
          roughnessMap={deskTex.roughnessMap}
          roughness={0.55}
          metalness={0.08}
        />
      </RoundedBox>

      {/* Desk / shelf holding the keepsakes */}
      <RoundedBox
        args={[DESK_WIDTH, DESK_THICKNESS, DESK_DEPTH]}
        radius={0.015}
        smoothness={2}
        position={[0, DESK_TOP_Y - DESK_THICKNESS / 2, DESK_Z]}
        castShadow
        receiveShadow
      >
        <meshStandardMaterial
          map={deskTex.map}
          roughnessMap={deskTex.roughnessMap}
          bumpMap={deskTex.bumpMap}
          bumpScale={0.02}
          roughness={0.5}
          metalness={0.1}
        />
      </RoundedBox>
      {/* Desk legs */}
      {[-1, 1].map((sx) =>
        [-1, 1].map((sz) => (
          <mesh
            key={`${sx}-${sz}`}
            position={[
              sx * (DESK_WIDTH / 2 - 0.05),
              FLOOR_Y + (DESK_TOP_Y - DESK_THICKNESS - FLOOR_Y) / 2,
              DESK_Z + sz * (DESK_DEPTH / 2 - 0.04),
            ]}
            castShadow
          >
            <boxGeometry args={[0.035, DESK_TOP_Y - DESK_THICKNESS - FLOOR_Y, 0.035]} />
            <meshStandardMaterial color="#241a15" roughness={0.55} metalness={0.15} />
          </mesh>
        )),
      )}
    </group>
  );
}
