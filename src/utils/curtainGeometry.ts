import { PlaneGeometry } from "three";

interface CurtainGeometryOptions {
  width: number;
  height: number;
  folds?: number;
  widthSegments?: number;
  heightSegments?: number;
  depthAmp?: number;
  hemAmp?: number;
  seed?: number;
}

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

export function createCurtainGeometry({
  width,
  height,
  folds = 5,
  widthSegments = 36,
  heightSegments = 28,
  depthAmp = 0.1,
  hemAmp = 0.09,
  seed = 1,
}: CurtainGeometryOptions) {
  const geometry = new PlaneGeometry(width, height, widthSegments, heightSegments);
  const position = geometry.attributes.position;
  const rand = mulberry32(seed);
  const jitter: number[] = [];
  for (let i = 0; i <= folds; i++) jitter.push((rand() - 0.5) * 0.7);

  for (let i = 0; i < position.count; i++) {
    const x = position.getX(i);
    const y = position.getY(i);
    const u = x / width + 0.5;
    const v = y / height + 0.5;

    const foldIndex = Math.min(Math.max(Math.floor(u * folds), 0), jitter.length - 1);
    const phase = u * folds * Math.PI * 2 + jitter[foldIndex];

    const topPinch = 0.5 + 0.5 * (1 - v);
    const z = Math.cos(phase) * depthAmp * topPinch;
    const xOff = Math.sin(phase + Math.PI / 2) * depthAmp * 0.4 * (0.6 + v * 0.4);

    const hemFalloff = Math.pow(1 - v, 4);
    const yOff = -Math.abs(Math.cos(phase * 0.9)) * hemAmp * hemFalloff;

    position.setXYZ(i, x + xOff, y + yOff, z);
  }

  geometry.computeVertexNormals();
  return geometry;
}
