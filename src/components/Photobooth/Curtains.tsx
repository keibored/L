import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import type { ThreeEvent } from "@react-three/fiber";
import type { BufferAttribute, Mesh } from "three";
import { DoubleSide, DynamicDrawUsage, MathUtils, PlaneGeometry } from "three";
import { useFabricTextures } from "../../utils/textures";
import { BOOTH, FRAME_BACK_Z, OPENING_TOP, CURTAIN_COLOR } from "./boothConfig";

interface CurtainsProps {
  progress: number;
  opacity?: number;
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
const PANEL_Z = FRAME_BACK_Z + 0.14;
const WIDTH_SEGMENTS = 40;
const HEIGHT_SEGMENTS = 20;
const FOLDS = 7;
const OPEN_WIDTH_RATIO = 0.24;

function deformCurtain(
  geometry: PlaneGeometry,
  side: -1 | 1,
  progress: number,
  time: number,
  updateBounds = false,
) {
  const positions = geometry.attributes.position;
  const uv = geometry.attributes.uv;

  for (let index = 0; index < positions.count; index += 1) {
    const u = uv.getX(index);
    const v = uv.getY(index);
    const bottomWeight = 1 - v;
    const rowDelay = bottomWeight * 0.11;
    const rowProgress = MathUtils.clamp((progress - rowDelay) / Math.max(1 - rowDelay, 0.001), 0, 1);
    const gathered = rowProgress * rowProgress * (3 - 2 * rowProgress);
    const openWidth = PANEL_WIDTH * OPEN_WIDTH_RATIO;
    const closedX = side === -1 ? -PANEL_WIDTH + u * PANEL_WIDTH : u * PANEL_WIDTH;
    const gatheredX = side === -1
      ? -PANEL_WIDTH + u * openWidth
      : PANEL_WIDTH - openWidth + u * openWidth;
    const phase = u * FOLDS * Math.PI * 2 + side * 0.31 + Math.sin(v * Math.PI * 3) * 0.12;
    const foldAmplitude = MathUtils.lerp(0.068, 0.12, gathered) * (0.82 + bottomWeight * 0.18);
    const lowerSway = Math.sin(time * 1.18 + v * 2.4 + side * 0.7)
      * 0.021 * bottomWeight * (0.25 + gathered * 0.75);
    const x = MathUtils.lerp(closedX, gatheredX, gathered) + lowerSway;
    const y = (v - 0.5) * PANEL_HEIGHT
      - Math.abs(Math.cos(phase * 0.86)) * 0.026 * bottomWeight * bottomWeight
      + Math.sin(time * 0.83 + u * 4.2) * 0.009 * bottomWeight * gathered;
    const z = Math.cos(phase) * foldAmplitude
      + Math.sin(time * 0.92 + u * 3.1 + side) * 0.012 * bottomWeight * gathered;

    positions.setXYZ(index, x, y, z);
  }

  positions.needsUpdate = true;
  geometry.computeVertexNormals();
  if (updateBounds) {
    geometry.computeBoundingBox();
    geometry.computeBoundingSphere();
  }
}

function CurtainPanel({
  side,
  progress,
  opacity,
  dragging,
  interactive,
  highlighted,
  reducedMotion,
  onPointerDown,
  onClick,
  onEngagementChange,
  tone = "exterior",
}: {
  side: -1 | 1;
  tone?: "exterior" | "interior";
} & CurtainsProps) {
  const meshRef = useRef<Mesh>(null);
  const fabric = useFabricTextures(CURTAIN_COLOR, side === -1 ? 5 : 9);

  const geometry = useMemo(() => {
    const panel = new PlaneGeometry(PANEL_WIDTH, PANEL_HEIGHT, WIDTH_SEGMENTS, HEIGHT_SEGMENTS);
    (panel.attributes.position as BufferAttribute).setUsage(DynamicDrawUsage);
    deformCurtain(panel, side, 0, 0, true);
    return panel;
  }, [side]);

  useFrame((state) => {
    if (!meshRef.current) return;
    const motionTime = dragging || reducedMotion ? 0 : state.clock.elapsedTime;
    deformCurtain(geometry, side, progress, motionTime);
  });

  const handlePointerDown = (event: ThreeEvent<PointerEvent>) => {
    event.stopPropagation();
    onPointerDown(event.nativeEvent.clientX);
  };

  return (
    <mesh
        ref={meshRef}
        geometry={geometry}
        position={[0, ROD_Y - PANEL_HEIGHT / 2, PANEL_Z]}
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
          color={tone === "interior" ? "#8d4b56" : CURTAIN_COLOR}
          emissive={tone === "interior" ? "#3c1720" : "#4b1d28"}
          emissiveIntensity={tone === "interior" ? 0.08 : highlighted ? 0.22 : 0.07}
          roughness={tone === "interior" ? 0.94 : 0.9}
          metalness={0}
          side={DoubleSide}
          transparent={(opacity ?? 1) < 1}
          opacity={opacity ?? 1}
          depthWrite={(opacity ?? 1) > 0.98}
        />
    </mesh>
  );
}

export function GatheredCurtainPanel({ side, reducedMotion }: { side: -1 | 1; reducedMotion: boolean }) {
  return (
    <CurtainPanel
      side={side}
      progress={1}
      opacity={1}
      dragging={false}
      interactive={false}
      highlighted={false}
      reducedMotion={reducedMotion}
      onPointerDown={() => undefined}
      onClick={() => undefined}
      onEngagementChange={() => undefined}
      tone="interior"
    />
  );
}

export function Curtains(props: CurtainsProps) {
  const opacity = props.opacity ?? 1;
  return (
    <group>
      <mesh position={[0, BOOTH.openingCenterY, PANEL_Z - 0.035]}>
        <planeGeometry args={[BOOTH.openingWidth * 0.96, BOOTH.openingHeight * 0.97]} />
        <meshBasicMaterial
          color="#b97874"
          transparent
          opacity={(props.highlighted ? 0.1 : 0.035) * opacity}
          depthWrite={false}
        />
      </mesh>
      <CurtainPanel side={-1} {...props} />
      <CurtainPanel side={1} {...props} />
      {/* Curtain rod */}
      <mesh position={[0, ROD_Y + 0.03, PANEL_Z]} rotation={[0, 0, Math.PI / 2]} castShadow>
        <cylinderGeometry args={[0.025, 0.025, BOOTH.openingWidth + 0.3, 12]} />
        <meshStandardMaterial color="#8a6a4f" roughness={0.4} metalness={0.55} transparent={opacity < 1} opacity={opacity} depthWrite={opacity > 0.98} />
      </mesh>
    </group>
  );
}
