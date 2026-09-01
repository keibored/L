import { useMemo } from "react";
import { CanvasTexture, SRGBColorSpace } from "three";

function makeBackdropTexture() {
  const size = 512;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d")!;

  ctx.fillStyle = "#0a0605";
  ctx.fillRect(0, 0, size, size);

  const glow = ctx.createRadialGradient(
    size * 0.42,
    size * 0.38,
    0,
    size * 0.42,
    size * 0.38,
    size * 0.62,
  );
  glow.addColorStop(0, "rgba(150, 98, 68, 0.55)");
  glow.addColorStop(0.5, "rgba(80, 50, 34, 0.22)");
  glow.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, size, size);

  const vignette = ctx.createRadialGradient(
    size * 0.5,
    size * 0.5,
    size * 0.3,
    size * 0.5,
    size * 0.5,
    size * 0.72,
  );
  vignette.addColorStop(0, "rgba(0,0,0,0)");
  vignette.addColorStop(1, "rgba(0,0,0,0.75)");
  ctx.fillStyle = vignette;
  ctx.fillRect(0, 0, size, size);

  const tex = new CanvasTexture(canvas);
  tex.colorSpace = SRGBColorSpace;
  return tex;
}

function makeFloorTexture() {
  const size = 256;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = "#0d0805";
  ctx.fillRect(0, 0, size, size);
  const glow = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size * 0.55);
  glow.addColorStop(0, "rgba(90, 55, 38, 0.22)");
  glow.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, size, size);
  const tex = new CanvasTexture(canvas);
  tex.colorSpace = SRGBColorSpace;
  return tex;
}

export function ExteriorEnvironment() {
  const backdropTex = useMemo(() => makeBackdropTexture(), []);
  const floorTex = useMemo(() => makeFloorTexture(), []);

  return (
    <group>
      {/* Distant backdrop wall, gives the booth somewhere to exist */}
      <mesh position={[0, 0.4, -3.3]}>
        <planeGeometry args={[9, 6.5]} />
        <meshBasicMaterial map={backdropTex} toneMapped={false} fog={false} />
      </mesh>

      {/* Subtle floor with a warm glow pooling near the booth */}
      <mesh position={[0, -2.36, -1]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[16, 12]} />
        <meshStandardMaterial map={floorTex} roughness={0.85} metalness={0.05} />
      </mesh>

      {/* Rim light separating the booth silhouette from the backdrop */}
      <pointLight position={[-0.5, 1.4, -4.2]} intensity={18} color="#7a8db0" distance={9} decay={2} />
      <pointLight position={[3.4, 0.2, 1.5]} intensity={10} color="#3a2820" distance={6} decay={2} />
    </group>
  );
}
