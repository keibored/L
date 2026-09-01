import { useEffect, useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { RoundedBox } from "@react-three/drei";
import {
  CanvasTexture,
  DoubleSide,
  MathUtils,
  RepeatWrapping,
  SRGBColorSpace,
  type MeshStandardMaterial,
} from "three";
import { ENTRANCE_TUNING } from "./entranceConfig";

function makeBackdropTexture() {
  const size = 640;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d")!;

  const base = ctx.createLinearGradient(0, 0, size, size);
  base.addColorStop(0, "#251719");
  base.addColorStop(0.48, "#1b1110");
  base.addColorStop(1, "#100b09");
  ctx.fillStyle = base;
  ctx.fillRect(0, 0, size, size);

  let seed = 41;
  const random = () => {
    seed = (seed * 16807) % 2147483647;
    return seed / 2147483647;
  };

  for (let index = 0; index < 3900; index += 1) {
    const value = random();
    ctx.fillStyle = value > 0.5 ? "rgba(255,225,210,0.018)" : "rgba(0,0,0,0.025)";
    const radius = 0.35 + random() * 1.2;
    ctx.fillRect(random() * size, random() * size, radius, radius);
  }

  for (let index = 0; index < 18; index += 1) {
    ctx.strokeStyle = `rgba(226,190,171,${0.008 + random() * 0.008})`;
    ctx.lineWidth = 0.6 + random() * 1.2;
    ctx.beginPath();
    const y = random() * size;
    ctx.moveTo(0, y);
    ctx.bezierCurveTo(size * 0.28, y + random() * 24, size * 0.72, y - random() * 22, size, y + random() * 8);
    ctx.stroke();
  }

  const glow = ctx.createRadialGradient(size * 0.48, size * 0.38, 0, size * 0.48, size * 0.38, size * 0.68);
  glow.addColorStop(0, "rgba(129,72,57,0.24)");
  glow.addColorStop(0.58, "rgba(66,37,31,0.1)");
  glow.addColorStop(1, "rgba(0,0,0,0.42)");
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, size, size);

  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  texture.wrapS = RepeatWrapping;
  texture.wrapT = RepeatWrapping;
  texture.repeat.set(1.6, 1.15);
  return texture;
}
function makeFloorTexture() {
  const size = 512;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = "#120d0b";
  ctx.fillRect(0, 0, size, size);

  let seed = 19;
  const random = () => {
    seed = (seed * 48271) % 2147483647;
    return seed / 2147483647;
  };

  for (let row = 0; row <= 8; row += 1) {
    const y = row * 64;
    ctx.strokeStyle = "rgba(6,4,3,0.72)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(size, y);
    ctx.stroke();
    for (let x = -20; x < size; x += 58 + Math.floor(random() * 46)) {
      ctx.strokeStyle = "rgba(150,104,78,0.045)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x, y + 5);
      ctx.lineTo(x + 120 + random() * 90, y + 5 + random() * 48);
      ctx.stroke();
    }
  }

  for (let index = 0; index < 1200; index += 1) {
    ctx.fillStyle = random() > 0.5 ? "rgba(255,224,190,0.012)" : "rgba(0,0,0,0.03)";
    ctx.fillRect(random() * size, random() * size, 1, 1);
  }

  const glow = ctx.createRadialGradient(size / 2, size * 0.36, 0, size / 2, size * 0.36, size * 0.64);
  glow.addColorStop(0, "rgba(116,72,51,0.18)");
  glow.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, size, size);

  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  texture.wrapS = RepeatWrapping;
  texture.wrapT = RepeatWrapping;
  texture.repeat.set(2.8, 3.2);
  return texture;
}

function WallDetails({ detailed }: { detailed: boolean }) {
  return (
    <group>
      <group position={[3.05, 1.28, -3.93]}>
        <mesh position={[0, 0.28, 0.01]} castShadow>
          <cylinderGeometry args={[0.17, 0.24, 0.34, 20, 1, true]} />
          <meshStandardMaterial color="#38241e" roughness={0.72} side={DoubleSide} />
        </mesh>
        <mesh position={[0, 0.52, -0.05]}>
          <boxGeometry args={[0.06, 0.42, 0.07]} />
          <meshStandardMaterial color="#241915" roughness={0.65} metalness={0.18} />
        </mesh>
        <pointLight position={[0, 0.16, 0.4]} intensity={7} distance={3.2} decay={2} color="#ffbd86" />
      </group>

      {detailed && (
        <>
          <group position={[-3.15, 0.5, -3.92]} rotation={[0, 0.03, -0.035]}>
            <mesh castShadow>
              <planeGeometry args={[1.45, 1.35]} />
              <meshStandardMaterial color="#1b1311" roughness={0.88} />
            </mesh>
            {[-0.42, 0, 0.42].map((x, column) => (
              <group key={x} position={[x, 0.04 + column * 0.035, 0.015]} rotation={[0, 0, (column - 1) * 0.025]}>
                <mesh>
                  <planeGeometry args={[0.24, 0.82]} />
                  <meshStandardMaterial color="#c5aa96" roughness={0.9} />
                </mesh>
                {[0.25, 0.08, -0.09, -0.26].map((y, image) => (
                  <mesh key={y} position={[0, y, 0.006]}>
                    <planeGeometry args={[0.18, 0.13]} />
                    <meshStandardMaterial
                      color={["#513837", "#78524b", "#3e3535", "#6f4a43"][(column + image) % 4]}
                      roughness={0.94}
                    />
                  </mesh>
                ))}
              </group>
            ))}
          </group>

          <group position={[3.08, -1.87, -1.9]} rotation={[0, -0.16, 0]}>
            <RoundedBox args={[1.35, 0.16, 0.5]} radius={0.06} smoothness={2} castShadow receiveShadow>
              <meshStandardMaterial color="#241814" roughness={0.78} />
            </RoundedBox>
            {[-0.5, 0.5].map((x) => (
              <mesh key={x} position={[x, -0.36, 0]} castShadow>
                <boxGeometry args={[0.09, 0.7, 0.34]} />
                <meshStandardMaterial color="#17100e" roughness={0.7} metalness={0.08} />
              </mesh>
            ))}
            <group position={[0.12, 0.22, 0]} rotation={[0, -0.2, 0]}>
              <RoundedBox args={[0.42, 0.28, 0.24]} radius={0.04} smoothness={2} castShadow>
                <meshStandardMaterial color="#171617" roughness={0.48} metalness={0.25} />
              </RoundedBox>
              <mesh position={[0, 0, 0.15]} rotation={[Math.PI / 2, 0, 0]}>
                <cylinderGeometry args={[0.09, 0.12, 0.1, 18]} />
                <meshStandardMaterial color="#202329" roughness={0.35} metalness={0.45} />
              </mesh>
            </group>
          </group>
        </>
      )}
    </group>
  );
}

interface ExteriorEnvironmentProps {
  revealing: boolean;
  reducedMotion: boolean;
}

export function ExteriorEnvironment({ revealing, reducedMotion }: ExteriorEnvironmentProps) {
  const backdropTexture = useMemo(() => makeBackdropTexture(), []);
  const floorTexture = useMemo(() => makeFloorTexture(), []);
  const wallMaterial = useRef<MeshStandardMaterial>(null);
  const floorMaterial = useRef<MeshStandardMaterial>(null);
  const width = useThree((state) => state.size.width);

  useEffect(() => () => {
    backdropTexture.dispose();
    floorTexture.dispose();
  }, [backdropTexture, floorTexture]);

  useFrame((state) => {
    const time = state.clock.elapsedTime;
    const wallReveal = revealing
      ? MathUtils.smoothstep(time, reducedMotion ? 0 : 0.1, reducedMotion ? 0.35 : 1.45)
      : 1;
    const floorReveal = revealing
      ? MathUtils.smoothstep(time, reducedMotion ? 0.05 : 1.05, reducedMotion ? 0.45 : 2.35)
      : 1;
    if (wallMaterial.current) wallMaterial.current.opacity = ENTRANCE_TUNING.environmentVisibility * wallReveal;
    if (floorMaterial.current) floorMaterial.current.opacity = 0.9 * floorReveal;
  });

  return (
    <group>
      <mesh position={[0, 0.42, -4.05]} receiveShadow>
        <planeGeometry args={[12, 7.4]} />
        <meshStandardMaterial
          ref={wallMaterial}
          map={backdropTexture}
          color="#7b5650"
          roughness={0.96}
          metalness={0}
          transparent
          opacity={0}
        />
      </mesh>

      <mesh position={[0, -2.36, -0.8]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[18, 15]} />
        <meshStandardMaterial
          ref={floorMaterial}
          map={floorTexture}
          color="#6f5548"
          roughness={0.88}
          metalness={0.08}
          transparent
          opacity={0}
        />
      </mesh>

      <WallDetails detailed={width > 760} />
    </group>
  );
}
