import { useMemo } from "react";
import { DoubleSide, ExtrudeGeometry } from "three";
import { RoundedBox } from "@react-three/drei";
import { roundedRectShape, roundedRectPath } from "../../utils/roundedRect";
import { cloneRepeated, useWoodTextures } from "../../utils/textures";
import {
  BOOTH,
  FRAME_BACK_Z,
  INTERIOR_BACK_Z,
  OPENING_BOTTOM,
  OPENING_TOP,
  WOOD_COLORS,
} from "./boothConfig";

export function BoothBody() {
  const frameWood = useWoodTextures({ ...WOOD_COLORS, seed: 3, knots: 4 });
  const wallWood = useWoodTextures({ ...WOOD_COLORS, base: "#3d2c21", seed: 11, knots: 2 });

  const frameTex = useMemo(() => cloneRepeated(frameWood, 1.6, 2.2), [frameWood]);
  const sideTex = useMemo(() => cloneRepeated(wallWood, 1.2, 2.4), [wallWood]);
  const backTex = useMemo(() => cloneRepeated(wallWood, 2, 2.4), [wallWood]);

  const frameGeometry = useMemo(() => {
    const shape = roundedRectShape(BOOTH.outerWidth, BOOTH.outerHeight, BOOTH.outerRadius);
    const hole = roundedRectPath(
      BOOTH.openingWidth,
      BOOTH.openingHeight,
      BOOTH.openingRadius,
      0,
      BOOTH.openingCenterY,
    );
    shape.holes.push(hole);
    const geometry = new ExtrudeGeometry(shape, {
      depth: BOOTH.frameDepth,
      bevelEnabled: true,
      bevelThickness: 0.04,
      bevelSize: 0.04,
      bevelSegments: 4,
      curveSegments: 20,
    });
    geometry.center();
    geometry.computeVertexNormals();
    return geometry;
  }, []);

  const sideWallWidth = (BOOTH.outerWidth - BOOTH.openingWidth) / 2;
  const topWallHeight = BOOTH.outerHeight / 2 - OPENING_TOP;
  const bottomWallHeight = OPENING_BOTTOM - -BOOTH.outerHeight / 2;
  const cavityZ = (FRAME_BACK_Z + INTERIOR_BACK_Z) / 2;
  const cavityDepth = BOOTH.interiorDepth;

  return (
    <group>
      {/* Front rounded frame with recessed opening cut through it */}
      <mesh geometry={frameGeometry} castShadow receiveShadow>
        <meshStandardMaterial
          map={frameTex.map}
          roughnessMap={frameTex.roughnessMap}
          bumpMap={frameTex.bumpMap}
          bumpScale={0.028}
          roughness={0.55}
          metalness={0.06}
          side={DoubleSide}
        />
      </mesh>

      {/* Left / right cavity walls */}
      {[-1, 1].map((side) => (
        <RoundedBox
          key={side}
          args={[sideWallWidth - 0.02, BOOTH.outerHeight - 0.05, cavityDepth]}
          radius={0.03}
          smoothness={2}
          position={[side * (BOOTH.openingWidth / 2 + sideWallWidth / 2), 0, cavityZ]}
          castShadow
          receiveShadow
        >
          <meshStandardMaterial
            map={sideTex.map}
            roughnessMap={sideTex.roughnessMap}
            bumpMap={sideTex.bumpMap}
            bumpScale={0.022}
            roughness={0.65}
            metalness={0.05}
          />
        </RoundedBox>
      ))}

      {/* Top / bottom cavity closures */}
      <RoundedBox
        args={[BOOTH.openingWidth, topWallHeight - 0.02, cavityDepth]}
        radius={0.03}
        smoothness={2}
        position={[0, OPENING_TOP + topWallHeight / 2, cavityZ]}
        castShadow
        receiveShadow
      >
        <meshStandardMaterial
          map={sideTex.map}
          roughnessMap={sideTex.roughnessMap}
          bumpMap={sideTex.bumpMap}
          bumpScale={0.022}
          roughness={0.65}
          metalness={0.05}
        />
      </RoundedBox>
      <RoundedBox
        args={[BOOTH.openingWidth, bottomWallHeight - 0.02, cavityDepth]}
        radius={0.03}
        smoothness={2}
        position={[0, OPENING_BOTTOM - bottomWallHeight / 2, cavityZ]}
        castShadow
        receiveShadow
      >
        <meshStandardMaterial
          map={sideTex.map}
          roughnessMap={sideTex.roughnessMap}
          bumpMap={sideTex.bumpMap}
          bumpScale={0.022}
          roughness={0.65}
          metalness={0.05}
        />
      </RoundedBox>

      {/* Base plinth the booth stands on */}
      <RoundedBox
        args={[BOOTH.outerWidth + 0.16, 0.18, cavityDepth + BOOTH.frameDepth + 0.2]}
        radius={0.06}
        smoothness={2}
        position={[0, -BOOTH.outerHeight / 2 - 0.09, FRAME_BACK_Z - cavityDepth / 2]}
        castShadow
        receiveShadow
      >
        <meshStandardMaterial
          map={backTex.map}
          roughnessMap={backTex.roughnessMap}
          roughness={0.6}
          metalness={0.08}
        />
      </RoundedBox>
    </group>
  );
}
