import { Path, Shape } from "three";

export function traceRoundedRect<T extends Path>(
  target: T,
  width: number,
  height: number,
  radius: number,
  offsetX = 0,
  offsetY = 0,
): T {
  const w = width / 2;
  const h = height / 2;
  const r = Math.min(radius, w, h);

  target.moveTo(offsetX - w + r, offsetY - h);
  target.lineTo(offsetX + w - r, offsetY - h);
  target.quadraticCurveTo(offsetX + w, offsetY - h, offsetX + w, offsetY - h + r);
  target.lineTo(offsetX + w, offsetY + h - r);
  target.quadraticCurveTo(offsetX + w, offsetY + h, offsetX + w - r, offsetY + h);
  target.lineTo(offsetX - w + r, offsetY + h);
  target.quadraticCurveTo(offsetX - w, offsetY + h, offsetX - w, offsetY + h - r);
  target.lineTo(offsetX - w, offsetY - h + r);
  target.quadraticCurveTo(offsetX - w, offsetY - h, offsetX - w + r, offsetY - h);

  return target;
}

export function roundedRectShape(width: number, height: number, radius: number, offsetX = 0, offsetY = 0): Shape {
  return traceRoundedRect(new Shape(), width, height, radius, offsetX, offsetY);
}

export function roundedRectPath(width: number, height: number, radius: number, offsetX = 0, offsetY = 0): Path {
  return traceRoundedRect(new Path(), width, height, radius, offsetX, offsetY);
}
