import { useMemo } from "react";
import { CanvasTexture, RepeatWrapping, SRGBColorSpace, type Texture } from "three";

function mulberry32(seed: number) {
  let s = seed;
  return function random() {
    s |= 0;
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

interface WoodGrainOptions {
  base: string;
  grainDark: string;
  grainLight: string;
  seed?: number;
  knots?: number;
  orientation?: "horizontal" | "vertical";
}

function paintWoodGrain(
  ctx: CanvasRenderingContext2D,
  size: number,
  { base, grainDark, grainLight, seed = 1, knots = 3, orientation = "horizontal" }: WoodGrainOptions,
) {
  const rand = mulberry32(seed);
  ctx.fillStyle = base;
  ctx.fillRect(0, 0, size, size);

  for (let i = 0; i < 6; i++) {
    const grd = ctx.createRadialGradient(
      rand() * size, rand() * size, 0,
      rand() * size, rand() * size, size * (0.4 + rand() * 0.4),
    );
    grd.addColorStop(0, `rgba(255,255,255,${0.02 + rand() * 0.03})`);
    grd.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = grd;
    ctx.fillRect(0, 0, size, size);
  }

  const lines = 100;
  for (let i = 0; i < lines; i++) {
    const pos = (i / lines) * size + (rand() - 0.5) * 6;
    const amp = 4 + rand() * 10;
    const freq = 0.01 + rand() * 0.02;
    const phase = rand() * Math.PI * 2;
    ctx.strokeStyle = rand() > 0.5 ? grainDark : grainLight;
    ctx.globalAlpha = 0.05 + rand() * 0.12;
    ctx.lineWidth = 0.6 + rand() * 1.8;
    ctx.beginPath();
    for (let x = 0; x <= size; x += 8) {
      const wobble = pos + Math.sin(x * freq + phase) * amp;
      const px = orientation === "horizontal" ? x : wobble;
      const py = orientation === "horizontal" ? wobble : x;
      if (x === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.stroke();
  }
  ctx.globalAlpha = 1;

  for (let i = 0; i < knots; i++) {
    const kx = rand() * size;
    const ky = rand() * size;
    const kr = 6 + rand() * 10;
    const grd = ctx.createRadialGradient(kx, ky, 0, kx, ky, kr * 2.4);
    grd.addColorStop(0, "rgba(20,12,8,0.5)");
    grd.addColorStop(0.4, "rgba(20,12,8,0.18)");
    grd.addColorStop(1, "rgba(20,12,8,0)");
    ctx.fillStyle = grd;
    ctx.beginPath();
    ctx.ellipse(kx, ky, kr * 2.2, kr, rand() * Math.PI, 0, Math.PI * 2);
    ctx.fill();
  }
}

function grayscaleFrom(canvas: HTMLCanvasElement, size: number) {
  const gCanvas = document.createElement("canvas");
  gCanvas.width = size;
  gCanvas.height = size;
  const gCtx = gCanvas.getContext("2d")!;
  gCtx.drawImage(canvas, 0, 0);
  const imgData = gCtx.getImageData(0, 0, size, size);
  const d = imgData.data;
  for (let i = 0; i < d.length; i += 4) {
    const lum = d[i] * 0.3 + d[i + 1] * 0.59 + d[i + 2] * 0.11;
    const v = 140 + (lum - 128) * 0.6;
    const clamped = Math.min(255, Math.max(60, v));
    d[i] = d[i + 1] = d[i + 2] = clamped;
  }
  gCtx.putImageData(imgData, 0, 0);
  return gCanvas;
}

export interface ProceduralTextureSet {
  map: Texture;
  roughnessMap: Texture;
  bumpMap: Texture;
}

export function makeWoodTextures(options: WoodGrainOptions, size = 512): ProceduralTextureSet {
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  paintWoodGrain(ctx, size, options);

  const map = new CanvasTexture(canvas);
  map.colorSpace = SRGBColorSpace;
  map.wrapS = map.wrapT = RepeatWrapping;

  const grayCanvas = grayscaleFrom(canvas, size);
  const roughnessMap = new CanvasTexture(grayCanvas);
  roughnessMap.wrapS = roughnessMap.wrapT = RepeatWrapping;

  return { map, roughnessMap, bumpMap: roughnessMap };
}

export function makeFabricTextures(baseColor: string, seed = 7, size = 256): ProceduralTextureSet {
  const rand = mulberry32(seed);
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = baseColor;
  ctx.fillRect(0, 0, size, size);

  ctx.strokeStyle = "rgba(255,255,255,0.05)";
  ctx.lineWidth = 1;
  for (let x = 0; x < size; x += 3) {
    ctx.beginPath();
    ctx.moveTo(x + (rand() - 0.5) * 1.5, 0);
    ctx.lineTo(x + (rand() - 0.5) * 1.5, size);
    ctx.stroke();
  }
  ctx.strokeStyle = "rgba(0,0,0,0.04)";
  for (let y = 0; y < size; y += 3) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(size, y);
    ctx.stroke();
  }

  for (let i = 0; i < 40; i++) {
    const x = rand() * size;
    const y = rand() * size;
    const r = 10 + rand() * 30;
    const grd = ctx.createRadialGradient(x, y, 0, x, y, r);
    grd.addColorStop(0, `rgba(255,255,255,${0.02 + rand() * 0.03})`);
    grd.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = grd;
    ctx.fillRect(0, 0, size, size);
  }

  const map = new CanvasTexture(canvas);
  map.colorSpace = SRGBColorSpace;
  map.wrapS = map.wrapT = RepeatWrapping;

  const grayCanvas = grayscaleFrom(canvas, size);
  const roughnessMap = new CanvasTexture(grayCanvas);
  roughnessMap.wrapS = roughnessMap.wrapT = RepeatWrapping;

  return { map, roughnessMap, bumpMap: roughnessMap };
}

export function makeFloorTextures(options: WoodGrainOptions, size = 512): ProceduralTextureSet {
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  paintWoodGrain(ctx, size, { ...options, orientation: "vertical" });

  const rand = mulberry32((options.seed ?? 1) + 99);
  const planks = 6;
  for (let i = 1; i < planks; i++) {
    const x = (i / planks) * size + (rand() - 0.5) * 3;
    ctx.strokeStyle = "rgba(10,6,4,0.35)";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, size);
    ctx.stroke();
    ctx.strokeStyle = "rgba(255,230,210,0.06)";
    ctx.beginPath();
    ctx.moveTo(x + 1.5, 0);
    ctx.lineTo(x + 1.5, size);
    ctx.stroke();
  }

  const map = new CanvasTexture(canvas);
  map.colorSpace = SRGBColorSpace;
  map.wrapS = map.wrapT = RepeatWrapping;

  const grayCanvas = grayscaleFrom(canvas, size);
  const roughnessMap = new CanvasTexture(grayCanvas);
  roughnessMap.wrapS = roughnessMap.wrapT = RepeatWrapping;

  return { map, roughnessMap, bumpMap: roughnessMap };
}

export function cloneRepeated(set: ProceduralTextureSet, rx: number, ry: number): ProceduralTextureSet {
  const map = set.map.clone();
  const roughnessMap = set.roughnessMap.clone();
  map.repeat.set(rx, ry);
  roughnessMap.repeat.set(rx, ry);
  map.needsUpdate = true;
  roughnessMap.needsUpdate = true;
  return { map, roughnessMap, bumpMap: roughnessMap };
}

export function useWoodTextures(options: WoodGrainOptions, size = 512) {
  // eslint-disable-next-line react-hooks/exhaustive-deps
  return useMemo(() => makeWoodTextures(options, size), [options.base, options.grainDark, options.grainLight, options.seed, options.knots, size]);
}

export function useFabricTextures(color: string, seed = 7, size = 256) {
  return useMemo(() => makeFabricTextures(color, seed, size), [color, seed, size]);
}

export function useFloorTextures(options: WoodGrainOptions, size = 512) {
  // eslint-disable-next-line react-hooks/exhaustive-deps
  return useMemo(() => makeFloorTextures(options, size), [options.base, options.grainDark, options.grainLight, options.seed, options.knots, size]);
}
