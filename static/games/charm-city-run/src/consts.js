// Shared constants and tiny helpers.
export const W = 320;
export const H = 180;
export const GROUND = 150;
export const SCALE = 3;

export const lerp = (a, b, t) => a + (b - a) * t;
export const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
export const rand = (a, b) => a + Math.random() * (b - a);
export const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

// list of [value, weight, ...extra] -> returns the whole entry
export function weighted(list) {
  let total = 0;
  for (const it of list) total += it[1];
  let r = Math.random() * total;
  for (const it of list) {
    r -= it[1];
    if (r <= 0) return it;
  }
  return list[list.length - 1];
}

export const overlap = (a, b) =>
  a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;

// Pixel rectangle
export function R(ctx, color, x, y, w, h) {
  ctx.fillStyle = color;
  ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
}

// Stepped (pixel) filled circle
export function circle(ctx, color, cx, cy, r) {
  ctx.fillStyle = color;
  for (let dy = -r; dy <= r; dy++) {
    const hw = Math.round(Math.sqrt(r * r - dy * dy));
    ctx.fillRect(Math.round(cx - hw), Math.round(cy + dy), hw * 2, 1);
  }
}
