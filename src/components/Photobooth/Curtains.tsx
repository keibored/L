import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import type { ThreeEvent } from "@react-three/fiber";
import type { Group } from "three";
import { DoubleSide } from "three";
import { createCurtainGeometry } from "../../utils/curtainGeometry";
import { useFabricTextures } from "../../utils/textures";
import { BOOTH, FRAME_BACK_Z, OPENING_TOP, CURTAIN_COLOR } from "./boothConfig";

interface CurtainsProps {
  progress: number;
  dragging: boolean;
  interactive: boolean;
  highlighted: boolean;
  reducedMotion: boolean;
  onPointerDown: (clientX: number) => void;
  onClick: () => void;
  onEngagementChange: (engaged: boolean) => void;
}

const PANEL_WIDTH = BOOTH.openingWidth / 2 + 0.14;
const PANEL_HEIGHT = BOOTH.openingHeight - 0.12;
const ROD_Y = OPENING_TOP - 0.06;
const PIVOT_X = BOOTH.openingWidth / 2 - 0.02;
const PANEL_Z = FRAME_BACK_Z + 0.14;

function CurtainPanel({
  side,
  progress,
  dragging,
  interactive,
  highlighted,
  reducedMotion,
  onPointerDown,
  onClick,
  onEngagementChange,
}: {
  side: -1 | 1;
} & CurtainsProps) {
  const pivotRef = useRef<Group>(null);
  const fabric = useFabricTextures(CURTAIN_COLOR, side === -1 ? 5 : 9);

  const geometry = useMemo(
    () =>
      createCurtainGeometry({
        width: PANEL_WIDTH,
        height: PANEL_HEIGHT,
        folds: 5,
        seed: side === -1 ? 3 : 8,
      }),
    [side],
  );

  useFrame((state) => {
    if (!pivotRef.current) return;
    const idleSway = dragging || reducedMotion ? 0 : Math.sin(state.clock.elapsedTime * 0.55 + side) * 0.012 * (1 - progress * 0.6);
    const openRotation = -side * progress * 1.28;
    pivotRef.current.rotation.y = openRotation + idleSway;
  });

  const handlePointerDown = (event: ThreeEvent<PointerEvent>) => {
    event.stopPropagation();
    onPointerDown(event.nativeEvent.clientX);
  };

  return (
    <group ref={pivotRef} position={[side * PIVOT_X, ROD_Y - PANEL_HEIGHT / 2, PANEL_Z]}>
      <mesh
        geometry={geometry}
        position={[-side * (PANEL_WIDTH / 2), 0, 0]}
        castShadow
        receiveShadow
        onPointerDown={interactive ? handlePointerDown : undefined}
        onClick={interactive ? (event) => {
          event.stopPropagation();
          onClick();
        } : undefined}
        onPointerOver={interactive ? () => {
          document.body.style.cursor = "grab";
          onEngagementChange(true);
        } : undefined}
        onPointerOut={interactive ? () => {
          document.body.style.cursor = "auto";
          onEngagementChange(false);
        } : undefined}
      >
        <meshStandardMaterial
          map={fabric.map}
          roughnessMap={fabric.roughnessMap}
          bumpMap={fabric.bumpMap}
          bumpScale={0.013}
          color={CURTAIN_COLOR}
          emissive="#4b1d28"
          emissiveIntensity={highlighted ? 0.22 : 0.07}
          roughness={0.85}
          metalness={0}
          side={DoubleSide}
        />
      </mesh>
    </group>
  );
}

export function Curtains(props: CurtainsProps) {
  return (
    <group>
      <mesh position={[0, BOOTH.openingCenterY, PANEL_Z - 0.035]}>
        <planeGeometry args={[BOOTH.openingWidth * 0.96, BOOTH.openingHeight * 0.97]} />
        <meshBasicMaterial
          color="#b97874"
          transparent
          opacity={props.highlighted ? 0.1 : 0.035}
          depthWrite={false}
        />
      </mesh>
      <CurtainPanel side={-1} {...props} />
      <CurtainPanel side={1} {...props} />
      {/* Curtain rod */}
      <mesh position={[0, ROD_Y + 0.03, PANEL_Z]} rotation={[0, 0, Math.PI / 2]} castShadow>
        <cylinderGeometry args={[0.025, 0.025, BOOTH.openingWidth + 0.3, 12]} />
        <meshStandardMaterial color="#8a6a4f" roughness={0.4} metalness={0.55} />
      </mesh>
    </group>
  );
}
