import { useMemo, useRef, type MutableRefObject } from "react";
import { useFrame } from "@react-three/fiber";
import type { ThreeEvent } from "@react-three/fiber";
import type { Mesh } from "three";
import { DoubleSide, MathUtils, PlaneGeometry } from "three";
import { useFabricTextures } from "../../utils/textures";
import { BOOTH, FRAME_BACK_Z, OPENING_TOP, CURTAIN_COLOR } from "./boothConfig";

interface CurtainsProps {
  progressRef: MutableRefObject<number>;
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

function addCurtainFolds(geometry: PlaneGeometry, side: -1 | 1) {
  const positions = geometry.attributes.position;
  const uv = geometry.attributes.uv;

  for (let index = 0; index < positions.count; index += 1) {
    const u = uv.getX(index);
    const v = uv.getY(index);
    const bottomWeight = 1 - v;
    const phase = u * FOLDS * Math.PI * 2 + side * 0.31 + Math.sin(v * Math.PI * 3) * 0.12;
    positions.setY(index, positions.getY(index) - Math.abs(Math.cos(phase * 0.86)) * 0.026 * bottomWeight * bottomWeight);
    positions.setZ(index, Math.cos(phase) * 0.075 * (0.82 + bottomWeight * 0.18));
  }

  positions.needsUpdate = true;
  geometry.computeVertexNormals();
  geometry.computeBoundingBox();
  geometry.computeBoundingSphere();
}

function CurtainPanel({
  side,
  progressRef,
  interactive,
  highlighted,
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
    addCurtainFolds(panel, side);
    return panel;
  }, [side]);

  useFrame(() => {
    if (!meshRef.current) return;
    const progress = MathUtils.clamp(progressRef.current, 0, 1);
    const gathered = progress * progress * (3 - 2 * progress);
    const widthScale = MathUtils.lerp(1, OPEN_WIDTH_RATIO, gathered);
    meshRef.current.scale.x = widthScale;
    meshRef.current.position.x = side * (PANEL_WIDTH / 2 + PANEL_WIDTH * (1 - widthScale) / 2);
    meshRef.current.position.y = ROD_Y - PANEL_HEIGHT / 2 - Math.sin(gathered * Math.PI) * 0.012;
    meshRef.current.rotation.z = side * Math.sin(gathered * Math.PI) * 0.006;
  });

  const handlePointerDown = (event: ThreeEvent<PointerEvent>) => {
    event.stopPropagation();
    onPointerDown(event.nativeEvent.clientX);
  };

  return (
    <mesh
        ref={meshRef}
        geometry={geometry}
        position={[side * PANEL_WIDTH / 2, ROD_Y - PANEL_HEIGHT / 2, PANEL_Z]}
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
        />
    </mesh>
  );
}

export function GatheredCurtainPanel({ side, reducedMotion }: { side: -1 | 1; reducedMotion: boolean }) {
  const progressRef = useRef(1);
  return (
    <CurtainPanel
      side={side}
      progressRef={progressRef}
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
