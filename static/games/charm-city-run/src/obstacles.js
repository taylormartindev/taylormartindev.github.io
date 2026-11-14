// Obstacle / entity type table: size, behavior and pixel drawing for every level.
import { GROUND, H, R } from './consts.js';
import { ICONS } from './sprites.js';
import { GAME } from './config.js';

const fl = (t, rate = 8) => Math.floor(t * rate) % 2;

// small bird facing left (toward the player)
function bird(ctx, x, y, body, wing, beak, t, rate = 8) {
  x = Math.round(x); y = Math.round(y);
  const f = fl(t, rate);
  R(ctx, beak, x, y + 3, 2, 1);
  R(ctx, body, x + 2, y + 2, 3, 3);
  R(ctx, '#111', x + 3, y + 2, 1, 1);
  R(ctx, body, x + 4, y + 3, 6, 3);
  R(ctx, wing, x + 10, y + 3, 2, 2);
  if (f) R(ctx, wing, x + 5, y, 4, 3);
  else R(ctx, wing, x + 5, y + 5, 4, 2);
}

function mesh(ctx, x, y, w, h, frame, fill) {
  R(ctx, frame, x, y, w, h);
  R(ctx, fill, x + 1, y + 1, w - 2, h - 2);
  ctx.fillStyle = frame;
  for (let i = 3; i < w - 1; i += 3) ctx.fillRect(Math.round(x + i), Math.round(y + 1), 1, h - 2);
  for (let j = 3; j < h - 1; j += 3) ctx.fillRect(Math.round(x + 1), Math.round(y + j), w - 2, 1);
}

function crate(ctx, x, y, w, h) {
  R(ctx, '#5a3a1c', x, y, w, h);
  R(ctx, '#a8743a', x + 1, y + 1, w - 2, h - 2);
  ctx.fillStyle = '#7a5228';
  for (let i = 0; i < h - 2; i++) {
    const k = i * (w - 3) / (h - 3);
    ctx.fillRect(Math.round(x + 1 + k), Math.round(y + 1 + i), 1, 1);
    ctx.fillRect(Math.round(x + w - 2 - k), Math.round(y + 1 + i), 1, 1);
  }
}

function pit(ctx, e, inside = '#0b0a12', edge = '#2a2a33') {
  R(ctx, inside, e.x, GROUND, e.w, H - GROUND);
  R(ctx, edge, e.x, GROUND, 2, H - GROUND);
  R(ctx, edge, e.x + e.w - 2, GROUND, 2, H - GROUND);
}

const PIT_H = H - GROUND;

export const TYPES = {
  // ----- collectible -----
  collect: {
    w: 14, h: 14, kind: 'collect',
    draw(ctx, e) {
      const img = ICONS[e.icon];
      const x = Math.round(e.x + (e.w - img.width) / 2), y = Math.round(e.y + (e.h - img.height) / 2 + Math.sin(e.t * 5) * 1.5);
      ctx.drawImage(img, x, y);
      const s = Math.floor(e.t * 4) % 4;
      if (s === 0) { R(ctx, '#ffffff', x + img.width - 2, y - 2, 1, 3); R(ctx, '#ffffff', x + img.width - 3, y - 1, 3, 1); }
    },
  },

  // ----- Level 1: Inner Harbor (crab) -----
  crabpot: {
    w: 14, h: 12, debris: '#6f9a74',
    draw(ctx, e) {
      mesh(ctx, e.x, e.y, e.w, e.h, '#24402f', '#6f9a74');
      R(ctx, '#f28c28', e.x + 9, e.y - 5, 4, 4);
      R(ctx, '#ddd', e.x + 10, e.y - 1, 1, 1);
    },
  },
  potTrap: {
    w: 52, h: 66, hint: 'DASH!', clear: 0.5,
    draw(ctx, e) {
      for (let r = 0; r < 6; r++) for (let c = 0; c < 4; c++) {
        mesh(ctx, e.x + c * 13, e.y + r * 11, 13, 11, '#24402f', (r + c) % 2 ? '#6f9a74' : '#5d8a66');
      }
      R(ctx, '#f28c28', e.x + 22, e.y - 6, 6, 6);
    },
  },
  gull: {
    w: 12, h: 7, vx: -35,
    draw(ctx, e) { bird(ctx, e.x, e.y, '#f4f4f4', '#9aa3ad', '#f2b134', e.t); },
  },
  gullSwarm: {
    w: 22, h: 92, vx: -10, hint: 'DASH!', clear: 0.5,
    draw(ctx, e) {
      for (let i = 0; i < 7; i++) {
        bird(ctx, e.x + (i % 2) * 9 + Math.sin(e.t * 4 + i) * 2, e.y + i * 12.5, '#f4f4f4', '#9aa3ad', '#f2b134', e.t + i * 0.13, 10);
      }
    },
  },
  splash: {
    w: 10, h: 14,
    draw(ctx, e) {
      const k = Math.round(Math.sin(e.t * 14) * 2);
      R(ctx, '#2f7fc0', e.x + 2, e.y + 3 - k, 6, e.h - 3 + k);
      R(ctx, '#bfe6ff', e.x + 3, e.y + 1 - k, 4, 3);
      R(ctx, '#bfe6ff', e.x, e.y + 5 - k, 2, 2);
      R(ctx, '#bfe6ff', e.x + 8, e.y + 4 - k, 2, 2);
      R(ctx, '#1d5a8f', e.x, e.y + e.h - 2, e.w, 2);
    },
  },
  wake: {
    w: 30, h: 6,
    draw(ctx, e) {
      R(ctx, '#2f7fc0', e.x, e.y + 2, e.w, 4);
      const o = Math.floor(e.t * 20) % 3;
      for (let i = 0; i < e.w - 4; i += 6) R(ctx, '#e6f6ff', e.x + i + o, e.y + ((i / 6) % 2), 4, 2);
    },
  },
  oldbayCloud: {
    w: 18, h: 10, vx: -20,
    draw(ctx, e) {
      const { x, y } = e;
      R(ctx, '#c4562a', x + 2, y + 2, 14, e.h - 3);
      R(ctx, '#d86a34', x, y + 3, 6, e.h - 4);
      R(ctx, '#d86a34', x + 12, y + 2, 6, e.h - 3);
      R(ctx, '#e88a44', x + 5, y, 8, 5);
      const f = fl(e.t, 6);
      R(ctx, '#f6d33b', x + 4 + f * 3, y + 4, 1, 1);
      R(ctx, '#f6d33b', x + 11 - f * 2, y + 6, 1, 1);
      R(ctx, '#f6d33b', x + 8, y + 2 + f, 1, 1);
    },
  },

  // ----- Level 2: Fells Point (Utz girl) -----
  dirtbike: {
    w: 22, h: 18, vx: -75,
    draw(ctx, e) {
      const { x, y } = e;
      const b = fl(e.t, 12);
      R(ctx, '#111', x, y + 12, 6, 6); R(ctx, '#111', x + 16, y + 12, 6, 6);
      R(ctx, '#888', x + 2, y + 14, 2, 2); R(ctx, '#888', x + 18, y + 14, 2, 2);
      R(ctx, '#d3202f', x + 4, y + 10, 14, 3); R(ctx, '#d3202f', x + 2, y + 8, 4, 3);
      R(ctx, '#333', x + 8, y + 3 + b, 6, 7);
      R(ctx, '#2a5fd0', x + 7, y - 1 + b, 6, 5);
      R(ctx, '#99bbdd', x + 7, y + 1 + b, 2, 2);
      R(ctx, '#333', x + 5, y + 6 + b, 4, 2);
    },
  },
  cart: { // arabber's horse-drawn produce cart
    w: 40, h: 24, vx: -15,
    draw(ctx, e) {
      const { x, y } = e;
      const s = fl(e.t, 6);
      R(ctx, '#7a4a2a', x + 3, y + 8, 11, 7);
      R(ctx, '#7a4a2a', x, y + 3, 4, 7);
      R(ctx, '#5a3418', x + 1, y + 2, 2, 2);
      R(ctx, '#111', x + 1, y + 5, 1, 1);
      R(ctx, '#5a3418', x + 4 + s, y + 15, 2, 9);
      R(ctx, '#5a3418', x + 11 - s, y + 15, 2, 9);
      R(ctx, '#d3202f', x + 6, y + 6, 3, 2);
      R(ctx, '#3a2a1a', x + 13, y + 12, 3, 1);
      R(ctx, '#8a5a32', x + 16, y + 12, 24, 6);
      R(ctx, '#5a3418', x + 16, y + 17, 24, 1);
      const cols = ['#d3202f', '#3aa040', '#f28c28', '#f6d33b'];
      for (let i = 0; i < 7; i++) R(ctx, cols[i % 4], x + 17 + i * 3, y + 9 - (i % 2), 3, 3);
      for (let i = 0; i < 6; i++) R(ctx, i % 2 ? '#ffffff' : '#d3202f', x + 16 + i * 4, y + 1, 4, 3);
      R(ctx, '#5a3418', x + 16, y + 4, 1, 8);
      R(ctx, '#5a3418', x + 39, y + 4, 1, 8);
      R(ctx, '#2a1a0a', x + 24, y + 17, 7, 7);
      R(ctx, '#c8a060', x + 27, y + 20, 1, 1);
    },
  },
  puddle: {
    w: 26, h: 4,
    draw(ctx, e) {
      R(ctx, '#3a78b8', e.x, e.y + 1, e.w, 3);
      R(ctx, '#3a78b8', e.x + 3, e.y, e.w - 6, 1);
      R(ctx, '#a8d8ff', e.x + 5 + Math.floor(e.t * 8) % 12, e.y + 1, 4, 1);
    },
  },
  pigeon: {
    w: 12, h: 7, vx: -25, alt: 10,
    draw(ctx, e) {
      bird(ctx, e.x, e.y, '#8d93a0', '#5d6470', '#e8a0b0', e.t, 9);
      R(ctx, '#3fae8a', e.x + 2, e.y + 4, 2, 1);
    },
  },
  awning: { // low scaffolding: too low to duck, slide under
    w: 30, alt: 6, h: GROUND - 6, hint: 'SLIDE!', clear: 0.65,
    draw(ctx, e) {
      const { x, w } = e;
      const by = e.y + e.h;
      R(ctx, '#7d7d86', x + 1, 0, 2, by - 8);
      R(ctx, '#7d7d86', x + w - 3, 0, 2, by - 8);
      for (let yy = 8; yy < by - 26; yy += 20) {
        R(ctx, '#7d7d86', x, yy, w, 2);
        for (let i = 0; i < 18; i++) R(ctx, '#6a6a72', x + 2 + i * (w - 4) / 18, yy + 2 + i, 1, 1);
      }
      R(ctx, '#7d7d86', x, by - 10, w, 2);
      for (let i = 0; i < w; i += 6) {
        R(ctx, '#e87722', x + i, by - 8, 3, 8);
        R(ctx, '#ffffff', x + i + 3, by - 8, Math.min(3, w - i - 3), 8);
      }
    },
  },
  chipBox: {
    w: 10, h: 9,
    draw(ctx, e) {
      const { x, y } = e;
      R(ctx, '#8a5a2a', x, y, 10, 9);
      R(ctx, '#c89a5a', x + 1, y + 1, 8, 7);
      R(ctx, '#f6c33b', x + 2, y + 3, 6, 3);
      R(ctx, '#d3202f', x + 4, y + 4, 2, 1);
    },
  },

  // ----- Level 3: Brewers Hill (Natty Boh guy) -----
  keg: {
    w: 11, h: 11, vx: -45,
    draw(ctx, e) {
      const { x, y } = e;
      R(ctx, '#5d646c', x + 1, y, 9, 11);
      R(ctx, '#5d646c', x, y + 1, 11, 9);
      R(ctx, e.bossKeg ? '#d6b46a' : '#c0c6cc', x + 1, y + 1, 9, 9);
      const o = Math.floor(e.t * 14) % 3;
      R(ctx, '#4d545c', x + 2 + o, y + 1, 1, 9);
      R(ctx, '#4d545c', x + 6 + o, y + 1, 1, 9);
      R(ctx, '#f0f4f8', x + 2, y + 2, 2, 2);
    },
  },
  // too tall to jump: jump, then twirl over
  crateStack: {
    w: 16, h: 60, hint: 'JUMP + TWIRL!', clear: 1.0,
    draw(ctx, e) {
      const n = Math.round(e.h / 13);
      for (let i = 0; i < n; i++) crate(ctx, e.x + (i % 2 ? 1 : 0), e.y + e.h - (i + 1) * (e.h / n), 15, e.h / n);
    },
  },
  kegTower: {
    w: 14, h: 60, hint: 'JUMP + TWIRL!', clear: 1.0,
    draw(ctx, e) {
      for (let i = 0; i < 5; i++) {
        const y = e.y + i * 12;
        R(ctx, '#5d646c', e.x, y, 14, 12);
        R(ctx, '#c0c6cc', e.x + 1, y + 1, 12, 10);
        R(ctx, '#4d545c', e.x + 1, y + 3, 12, 1);
        R(ctx, '#4d545c', e.x + 1, y + 8, 12, 1);
        R(ctx, '#f0f4f8', e.x + 2, y + 1, 2, 2);
      }
      if (e.vx) { R(ctx, '#333', e.x - 2, e.y + e.h - 2, 18, 2); R(ctx, '#111', e.x, e.y + e.h - 1, 3, 1); R(ctx, '#111', e.x + 11, e.y + e.h - 1, 3, 1); }
    },
  },
  // boss: foam bubble floating up high; pop it by twirling into it
  foam: {
    w: 12, h: 12, kind: 'bubble',
    update(e, dt) {
      if (e.targetY != null) e.y += (e.targetY - e.y) * Math.min(1, dt * 3);
      e.wob = Math.sin(e.t * 6);
    },
    draw(ctx, e) {
      const x = Math.round(e.x), y = Math.round(e.y + (e.wob || 0));
      R(ctx, '#fff6dc', x + 3, y, 6, 12);
      R(ctx, '#fff6dc', x, y + 3, 12, 6);
      R(ctx, '#fff6dc', x + 1, y + 1, 10, 10);
      R(ctx, '#f6d36b', x + 2, y + 2, 8, 8);
      R(ctx, '#ffe9a8', x + 3, y + 3, 6, 6);
      R(ctx, '#ffffff', x + 3, y + 2, 2, 2);
      R(ctx, '#d6a83a', x + 8, y + 8, 2, 2);
    },
  },
  forklift: {
    w: 26, h: 20, vx: -10,
    draw(ctx, e) {
      const { x, y } = e;
      R(ctx, '#e6b422', x + 6, y + 8, 18, 8);
      R(ctx, '#222', x + 10, y + 2, 10, 1);
      R(ctx, '#222', x + 10, y + 2, 1, 7);
      R(ctx, '#222', x + 19, y + 2, 1, 7);
      R(ctx, '#333', x + 13, y + 5, 3, 3);
      R(ctx, '#555', x + 4, y, 2, 16);
      R(ctx, '#555', x, y + 14, 6, 2);
      R(ctx, '#111', x + 7, y + 15, 5, 5);
      R(ctx, '#111', x + 18, y + 15, 5, 5);
    },
  },
  pothole: {
    w: 18, h: PIT_H, kind: 'pit',
    draw(ctx, e) { pit(ctx, e, '#111014', '#555'); },
  },
  stoop: { // white marble steps
    w: 20, h: 12,
    draw(ctx, e) {
      const { x, y } = e;
      R(ctx, '#d8d8d8', x, y + 8, 20, 4);
      R(ctx, '#ececec', x + 6, y + 4, 14, 4);
      R(ctx, '#ffffff', x + 12, y, 8, 4);
      R(ctx, '#b0b0b0', x, y + 8, 20, 1);
      R(ctx, '#c0c0c0', x + 6, y + 4, 14, 1);
    },
  },

  // ----- Level 4: Camden Yards (Oriole) -----
  foulBall: {
    w: 6, h: 6, vx: -110, alt: 6,
    draw(ctx, e) {
      const { x, y } = e;
      R(ctx, '#ffffff', x + 1, y, 4, 6);
      R(ctx, '#ffffff', x, y + 1, 6, 4);
      const f = fl(e.t, 16);
      R(ctx, '#d3202f', x + 1 + f, y + 1, 1, 4);
      R(ctx, '#d3202f', x + 4 - f, y + 1, 1, 4);
    },
  },
  hotdogCart: {
    w: 24, h: 26, vx: -5,
    draw(ctx, e) {
      const { x, y } = e;
      R(ctx, '#d3202f', x + 3, y, 18, 2);
      for (let i = 0; i < 6; i++) R(ctx, i % 2 ? '#f6d33b' : '#d3202f', x + i * 4, y + 2, 4, 3);
      R(ctx, '#666', x + 11, y + 5, 2, 8);
      R(ctx, '#c0c6cc', x + 1, y + 13, 22, 9);
      R(ctx, '#d3202f', x + 1, y + 15, 22, 2);
      R(ctx, '#c86a3a', x + 8, y + 18, 8, 2);
      R(ctx, '#f6d33b', x + 9, y + 18, 6, 1);
      R(ctx, '#111', x + 3, y + 21, 5, 5);
      R(ctx, '#111', x + 16, y + 21, 5, 5);
    },
  },
  peanutStack: {
    w: 16, h: 64, hint: 'DOUBLE JUMP!', clear: 1.0,
    draw(ctx, e) {
      for (let i = 0; i < 8; i++) {
        const yy = e.y + i * 8;
        R(ctx, '#c8a070', e.x + 1, yy, 14, 8);
        R(ctx, '#8a6a40', e.x + 1, yy + 7, 14, 1);
        R(ctx, '#d3202f', e.x + 5, yy + 3, 6, 2);
      }
    },
  },
  railGap: {
    w: (g) => Math.max(80, g.speed * 0.82), h: PIT_H, kind: 'pit', hint: 'DOUBLE JUMP!', clear: 1.0,
    draw(ctx, e) {
      pit(ctx, e, '#0d0c14', '#6a4a3a');
      R(ctx, '#b0b0b8', e.x - 6, GROUND + 4, 6, 2);
      R(ctx, '#b0b0b8', e.x + e.w, GROUND + 4, 6, 2);
    },
  },

  // ----- Level 5: Poe's grave (Raven) -----
  tombstone: {
    w: 10, h: 15,
    draw(ctx, e) {
      const { x, y } = e;
      R(ctx, '#6b6f7a', x + 1, y, 8, 15);
      R(ctx, '#6b6f7a', x, y + 2, 10, 13);
      R(ctx, '#8a8f9a', x + 2, y + 2, 6, 11);
      R(ctx, '#55596a', x + 4, y + 4, 2, 6);
      R(ctx, '#55596a', x + 3, y + 5, 4, 2);
      R(ctx, '#3d7a3d', x, y + 13, 3, 2);
    },
  },
  fence: {
    w: 24, h: 18,
    draw(ctx, e) {
      const { x, y, w } = e;
      for (let i = 0; i < w; i += 4) {
        R(ctx, '#1a1a22', x + i + 1, y + 2, 1, 16);
        R(ctx, '#1a1a22', x + i, y + 1, 3, 1);
        R(ctx, '#1a1a22', x + i + 1, y, 1, 1);
      }
      R(ctx, '#1a1a22', x, y + 5, w, 1);
      R(ctx, '#1a1a22', x, y + 14, w, 1);
    },
  },
  grave: {
    w: (g) => Math.max(110, g.speed * 1.35), h: PIT_H, kind: 'pit', hint: 'GLIDE! HOLD JUMP', clear: 0.75,
    draw(ctx, e) {
      pit(ctx, e, '#0a0810', '#3a2a20');
      R(ctx, '#4a3626', e.x - 6, GROUND - 3, 8, 3);
      R(ctx, '#4a3626', e.x + e.w - 2, GROUND - 3, 8, 3);
    },
  },
  bat: {
    w: 10, h: 6, alt: 6, vx: -45,
    update(e) {
      if (e.baseY == null) e.baseY = e.y;
      e.y = e.baseY - Math.abs(Math.sin(e.t * 6)) * 4;
    },
    draw(ctx, e) {
      const { x, y } = e;
      const f = fl(e.t, 12);
      R(ctx, '#2a1f3a', x + 3, y + 2, 4, 3);
      R(ctx, '#ff4444', x + 3, y + 3, 1, 1);
      if (f) { R(ctx, '#2a1f3a', x, y, 3, 2); R(ctx, '#2a1f3a', x + 7, y, 3, 2); }
      else { R(ctx, '#2a1f3a', x, y + 3, 3, 2); R(ctx, '#2a1f3a', x + 7, y + 3, 3, 2); }
    },
  },
  football: {
    w: 8, h: 5, alt: 0, vx: -60, vy: -140, ay: 700, bounce: 140,
    draw(ctx, e) {
      R(ctx, '#7a3f1d', e.x + 1, e.y, 6, 5);
      R(ctx, '#7a3f1d', e.x, e.y + 1, 8, 3);
      R(ctx, '#ffffff', e.x + 3, e.y + 2, 3, 1);
    },
  },
  inkDrop: {
    w: 4, h: 6, ay: 340,
    update(e, dt, g) {
      if (e.y + e.h >= GROUND) {
        e.dead = true;
        g.spawn('inkSplat', e.x - 3);
        g.burst(e.x + 2, GROUND - 1, '#3a2a58', 5, 40);
      }
    },
    draw(ctx, e) {
      R(ctx, '#e0d4ff', e.x, e.y - 1, 4, 3);
      R(ctx, '#e0d4ff', e.x - 1, e.y + 1, 6, 6);
      R(ctx, '#1a1028', e.x + 1, e.y, 2, 2);
      R(ctx, '#1a1028', e.x, e.y + 2, 4, 4);
      R(ctx, '#6a5a98', e.x + 1, e.y + 3, 1, 1);
    },
  },
  inkSplat: {
    w: 10, h: 3,
    draw(ctx, e) {
      R(ctx, '#e0d4ff', e.x - 1, e.y - 1, 12, 4);
      R(ctx, '#1a1028', e.x, e.y, 10, 3);
      R(ctx, '#4a3a78', e.x + 2, e.y, 3, 1);
    },
  },
  inkPool: {
    w: (g) => Math.max(110, g.speed * 1.3), h: PIT_H, kind: 'pit', hint: 'GLIDE! HOLD JUMP', clear: 0.75,
    draw(ctx, e) {
      pit(ctx, e, '#160c26', '#3a2a58');
      const o = Math.floor(e.t * 10) % 12;
      for (let i = o; i < e.w - 4; i += 12) R(ctx, '#5a4a98', e.x + i, GROUND + 2, 4, 1);
    },
  },
  quillSwoop: {
    w: 40, h: 8, alt: 5, vx: -110, hint: 'DUCK!',
    draw(ctx, e) {
      const { x, y } = e;
      R(ctx, '#ff5a7a', x - 1, y + 2, 7, 4);
      for (let i = 0; i < 30; i++) {
        const hh = Math.round(3 * Math.sin(Math.PI * i / 30)) + 1;
        R(ctx, '#ff5a7a', x + 8 + i, y + 3 - hh, 1, hh * 2 + 2);
      }
      R(ctx, '#ff5a7a', x + 5, y + 3, 36, 3);
      R(ctx, '#111', x, y + 3, 5, 2);
      R(ctx, '#9a8fb0', x + 5, y + 4, 35, 1);
      for (let i = 0; i < 30; i++) {
        const hh = Math.round(3 * Math.sin(Math.PI * i / 30)) + 1;
        R(ctx, '#ece8f6', x + 8 + i, y + 4 - hh, 1, hh * 2);
      }
      R(ctx, '#9a8fb0', x + 8, y + 4, 32, 1);
    },
  },
};

export function makeEntity(type, x, opts = {}, g) {
  const d = TYPES[type];
  if (!d) throw new Error('Unknown entity type: ' + type);
  const val = (v) => (typeof v === 'function' ? v(g) : v);
  const w = Math.round(opts.w ?? val(d.w));
  const h = opts.h ?? val(d.h);
  const alt = opts.alt ?? d.alt ?? 0;
  const kind = d.kind || 'hurt';
  return {
    type, x, w, h,
    y: opts.y ?? (kind === 'pit' ? GROUND : GROUND - alt - h),
    vx: opts.vx ?? d.vx ?? 0,
    vy: opts.vy ?? d.vy ?? 0,
    ay: opts.ay ?? d.ay ?? 0,
    bounce: opts.bounce ?? d.bounce ?? null,
    kind,
    // seconds of free space needed around this hazard (never less than the config minimum)
    clear: Math.max(GAME.minObstacleGap, opts.clear ?? d.clear ?? 0),
    hint: opts.hint ?? d.hint,
    icon: opts.icon,
    t: 0,
    dead: false,
  };
}
