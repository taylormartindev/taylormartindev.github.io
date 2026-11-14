// Procedurally drawn parallax backgrounds for each Baltimore setting.
import { W, H, GROUND, R, circle } from './consts.js';

const LW = 480; // layer width (tiles horizontally)

function rng(seed) {
  return () => {
    seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const ri = (r, a, b) => Math.floor(a + r() * (b - a + 1));

function canvas(w, h, fn) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  fn(c.getContext('2d'), w, h);
  return c;
}

function hex(c) { const n = parseInt(c.slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; }
function mix(a, b, t) {
  const A = hex(a), B = hex(b);
  return `rgb(${A.map((v, i) => Math.round(v + (B[i] - v) * t)).join(',')})`;
}
function bandedSky(ctx, top, bottom, bands = 12) {
  const bh = Math.ceil(GROUND / bands);
  for (let i = 0; i < bands; i++) R(ctx, mix(top, bottom, i / (bands - 1)), 0, i * bh, W, bh + 1);
}

function windows(ctx, r, x, y, w, h, lit, dark, chance = 0.35) {
  for (let yy = y + 3; yy < y + h - 4; yy += 6) {
    for (let xx = x + 2; xx < x + w - 3; xx += 5) {
      R(ctx, r() < chance ? lit : dark, xx, yy, 2, 3);
    }
  }
}

// ---------- themes ----------
const THEMES = {
  crab: {
    sky(ctx) {
      bandedSky(ctx, '#5aa8e0', '#d8f0ff');
      circle(ctx, '#fff3b0', 262, 28, 10);
      for (const [x, y, w] of [[30, 30, 26], [140, 18, 34], [210, 44, 22]]) {
        R(ctx, '#ffffff', x, y, w, 5); R(ctx, '#ffffff', x + 5, y - 3, w - 12, 3);
      }
    },
    layers: [
      { f: 0.1, build(ctx, r) {
        const col = '#86a3bf', base = GROUND - 22;
        for (let x = 0; x < LW - 20;) {
          const w = ri(r, 14, 28), h = ri(r, 22, 58);
          R(ctx, col, x, base - h, w, h);
          windows(ctx, r, x, base - h, w, h, '#b9cde0', '#7a96b2', 0.25);
          x += w + ri(r, 0, 4);
        }
        // pentagon-topped trade-center style tower
        R(ctx, col, 100, base - 82, 18, 82); R(ctx, col, 102, base - 86, 14, 4); R(ctx, col, 105, base - 88, 8, 2);
        windows(ctx, r, 100, base - 82, 18, 82, '#b9cde0', '#7a96b2', 0.3);
        // clock tower
        R(ctx, '#7f95ad', 330, base - 74, 12, 74); R(ctx, '#7f95ad', 328, base - 80, 16, 6);
        R(ctx, '#e8e0c0', 333, base - 70, 6, 6); R(ctx, '#7f95ad', 334, base - 88, 4, 8);
      } },
      { f: 0.35, build(ctx, r) {
        R(ctx, '#2f6f9f', 0, GROUND - 24, LW, 24);
        for (let i = 0; i < 60; i++) R(ctx, '#5fa0d0', ri(r, 0, LW), ri(r, GROUND - 22, GROUND - 2), 3, 1);
        // tall ship
        const sx = 60, sy = GROUND - 30;
        R(ctx, '#3a2a1e', sx, sy, 70, 10); R(ctx, '#3a2a1e', sx + 4, sy + 10, 62, 3);
        R(ctx, '#e8e8e8', sx + 2, sy + 3, 66, 1);
        for (let i = 0; i < 9; i++) R(ctx, '#111', sx + 6 + i * 7, sy + 5, 2, 2);
        for (const [mx, mh] of [[16, 70], [36, 76], [56, 62]]) {
          R(ctx, '#4a3a2a', sx + mx, sy - mh, 2, mh);
          R(ctx, '#4a3a2a', sx + mx - 8, sy - mh + 12, 18, 1);
          R(ctx, '#4a3a2a', sx + mx - 6, sy - mh + 30, 14, 1);
        }
        R(ctx, '#4a3a2a', sx + 68, sy - 14, 16, 1);
        // water taxi
        R(ctx, '#1f4e9c', 300, GROUND - 20, 26, 5); R(ctx, '#ffffff', 304, GROUND - 26, 16, 6);
        R(ctx, '#1f4e9c', 306, GROUND - 25, 12, 2);
        // pier posts
        for (let x = 10; x < LW; x += 40) R(ctx, '#5a3a1c', x, GROUND - 12, 3, 12);
      } },
    ],
    ground(ctx, w, h) {
      R(ctx, '#9a6a3a', 0, 0, w, h);
      R(ctx, '#c08850', 0, 0, w, 2);
      for (let x = 0; x < w; x += 16) R(ctx, '#6b4325', x, 2, 1, h);
      R(ctx, '#7a5030', 0, 12, w, 1); R(ctx, '#7a5030', 0, 22, w, 1);
      for (let x = 4; x < w; x += 16) { R(ctx, '#3a2a1a', x, 5, 1, 1); R(ctx, '#3a2a1a', x + 6, 16, 1, 1); }
    },
  },

  utz: {
    sky(ctx) {
      bandedSky(ctx, '#f39a6a', '#fde8c8');
      circle(ctx, '#fff0c0', 60, 46, 14);
    },
    layers: [
      { f: 0.12, build(ctx, r) {
        const col = '#c49a86', base = GROUND - 40;
        for (let x = 0; x < LW - 20;) {
          const w = ri(r, 20, 36), h = ri(r, 10, 26);
          R(ctx, col, x, base - h, w, h + 40);
          R(ctx, '#b0887a', x, base - h, w, 2);
          x += w + ri(r, 0, 3);
        }
        // church steeple
        R(ctx, '#b88a78', 210, base - 60, 12, 60); R(ctx, '#b88a78', 212, base - 72, 8, 12); R(ctx, '#b88a78', 215, base - 82, 2, 10);
        R(ctx, '#f6e2b0', 214, base - 52, 4, 6);
      } },
      { f: 0.4, build(ctx, r) {
        const bricks = ['#a8483a', '#b85c40', '#9a3e34', '#b4503a'];
        const doors = ['#2a5fd0', '#3aa040', '#d3202f', '#1a1a1a', '#f6c33b'];
        for (let x = 0; x < LW; x += 24) {
          const h = ri(r, 48, 60), top = GROUND - h;
          const formstone = r() < 0.25;
          R(ctx, formstone ? '#b0a898' : bricks[ri(r, 0, 3)], x, top, 24, h);
          if (formstone) for (let i = 0; i < 30; i++) R(ctx, '#8f887a', x + ri(r, 0, 22), top + ri(r, 3, h - 2), 2, 1);
          else for (let yy = top + 4; yy < GROUND; yy += 4) R(ctx, 'rgba(0,0,0,0.12)', x, yy, 24, 1);
          R(ctx, '#3a2a2a', x, top, 24, 3);
          R(ctx, '#5a4040', x, top + 3, 24, 1);
          for (const wy of [top + 8, top + 24]) {
            R(ctx, '#f0ead8', x + 3, wy, 7, 10); R(ctx, '#4a5a70', x + 4, wy + 1, 5, 8);
            R(ctx, '#f0ead8', x + 14, wy, 7, 10); R(ctx, '#4a5a70', x + 15, wy + 1, 5, 8);
          }
          R(ctx, '#f0ead8', x + 13, GROUND - 16, 8, 11);
          R(ctx, doors[ri(r, 0, 4)], x + 14, GROUND - 15, 6, 10);
          R(ctx, '#ffffff', x + 11, GROUND - 5, 12, 2);
          R(ctx, '#e8e8e8', x + 10, GROUND - 3, 14, 3);
        }
      } },
    ],
    ground(ctx, w, h) {
      R(ctx, '#6e6a66', 0, 0, w, h);
      R(ctx, '#bdbdbd', 0, 0, w, 3);
      R(ctx, '#8a8580', 0, 3, w, 1);
      for (let row = 0; row < 7; row++) {
        const off = (row % 2) * 4;
        for (let x = -4; x < w; x += 8) R(ctx, '#86817c', x + off + 1, 5 + row * 4, 6, 3);
      }
    },
  },

  boh: {
    sky(ctx) {
      bandedSky(ctx, '#3c2a5a', '#f08a4a');
      const r = rng(5);
      for (let i = 0; i < 18; i++) R(ctx, '#f5e6ff', ri(r, 0, W), ri(r, 2, 40), 1, 1);
    },
    layers: [
      { f: 0.1, build(ctx, r) {
        const col = '#5a3550', base = GROUND - 30;
        for (let x = 0; x < LW - 20;) {
          const w = ri(r, 24, 50), h = ri(r, 14, 34);
          R(ctx, col, x, base - h, w, h + 30);
          if (r() < 0.5) { const sx = x + ri(r, 2, w - 6); R(ctx, col, sx, base - h - 30, 5, 30); }
          x += w + ri(r, 2, 10);
        }
        // water tower
        R(ctx, col, 300, base - 60, 18, 14); R(ctx, col, 302, base - 46, 2, 46); R(ctx, col, 314, base - 46, 2, 46);
        R(ctx, col, 299, base - 64, 20, 4);
      } },
      { f: 0.35, build(ctx, r) {
        for (let x = 0; x < LW;) {
          const w = ri(r, 70, 130), h = ri(r, 36, 56), top = GROUND - h;
          R(ctx, '#7a3a2a', x, top, w, h);
          R(ctx, '#5a2a20', x, top, w, 3);
          for (let wx = x + 6; wx < x + w - 8; wx += 12) {
            for (let wy = top + 8; wy < GROUND - 12; wy += 16) {
              const lit = r() < 0.45;
              R(ctx, lit ? '#f6c35a' : '#3a1a14', wx, wy + 2, 6, 8);
              R(ctx, lit ? '#f6c35a' : '#3a1a14', wx + 1, wy, 4, 2);
            }
          }
          x += w + ri(r, 4, 16);
        }
        // brewery tower topped by a big red neon sign of the one-eyed, mustachioed brewer
        const tx = 236, ty = GROUND - 78;
        R(ctx, '#6a3226', tx, ty, 34, 78);
        R(ctx, '#4a221a', tx, ty, 34, 3);
        for (let wy = ty + 12; wy < GROUND - 10; wy += 14) { R(ctx, '#3a1a14', tx + 6, wy, 8, 8); R(ctx, '#3a1a14', tx + 20, wy, 8, 8); }
        R(ctx, '#2a1a1a', tx + 6, ty - 6, 2, 6); R(ctx, '#2a1a1a', tx + 26, ty - 6, 2, 6);
        const face = [
          '.......NNNNNNNNNN.......',
          '.....NN...N......NN.....',
          '....N.....N........N....',
          '...N......N.........N...',
          '...r.NNNNN.NNNNNNNN.r...',
          '..r..................r..',
          '..r..........WWWW....r..',
          '..r.........W....W...r..',
          '..r.........W.KK.W...r..',
          '..r..........WWWW....r..',
          '..r..............rr..r..',
          'N.r.............r..r.r.N',
          'NN..NNNNNNNNNNNNNNNN..NN',
          '.NNN................NNN.',
          '...r.....rrrrrr.....r...',
          '....r.....rrrr.....r....',
          '.....rr..........rr.....',
          '.......rrrrrrrrrr.......',
        ];
        const fx = tx + 17 - 24, fy = ty - 4 - face.length * 2;
        const col = { N: '#ff3b3b', r: '#ff5a4a', W: '#ffffff', K: '#ff3b3b' };
        ctx.globalAlpha = 0.18;
        circle(ctx, '#ff3b3b', fx + 24, fy + 18, 28);
        ctx.globalAlpha = 1;
        face.forEach((row, yy) => {
          // dim fill inside the outline so it reads as a head, not a box
          const a = row.search(/[^.]/), b = row.length - 1 - [...row].reverse().join('').search(/[^.]/);
          if (yy > 0 && yy < face.length - 1 && a >= 0) R(ctx, 'rgba(70,10,20,0.55)', fx + a * 2, fy + yy * 2, (b - a + 1) * 2, 2);
          for (let xx = 0; xx < row.length; xx++) {
            const ch = row[xx];
            if (ch !== '.') R(ctx, col[ch], fx + xx * 2, fy + yy * 2, 2, 2);
          }
        });
      } },
    ],
    ground(ctx, w, h) {
      R(ctx, '#3a3a40', 0, 0, w, h);
      R(ctx, '#777777', 0, 0, w, 2);
      R(ctx, '#e6c23a', 4, 13, 16, 2);
      R(ctx, '#e6c23a', 36, 13, 16, 2);
      const r = rng(9);
      for (let i = 0; i < 30; i++) R(ctx, '#4a4a52', ri(r, 0, w), ri(r, 3, h), 1, 1);
    },
  },

  oriole: {
    sky(ctx) {
      bandedSky(ctx, '#1d2b5a', '#7a9ad0');
      const r = rng(3);
      for (let i = 0; i < 14; i++) R(ctx, '#ffffff', ri(r, 0, W), ri(r, 2, 36), 1, 1);
    },
    layers: [
      { f: 0.1, build(ctx, r) {
        const base = GROUND - 50;
        for (let x = 0; x < LW - 20;) {
          const w = ri(r, 14, 30), h = ri(r, 20, 56);
          R(ctx, '#2a3a66', x, base - h, w, h + 50);
          windows(ctx, r, x, base - h, w, h, '#f6d36b', '#24325a', 0.3);
          x += w + ri(r, 0, 6);
        }
        for (const lx of [60, 260, 420]) {
          R(ctx, '#3a3a48', lx, base - 70, 3, 70);
          ctx.globalAlpha = 0.25; circle(ctx, '#fffbe0', lx + 1, base - 76, 14); ctx.globalAlpha = 1;
          R(ctx, '#dddddd', lx - 7, base - 82, 17, 9);
          for (let i = 0; i < 4; i++) for (let j = 0; j < 2; j++) R(ctx, '#fffbe0', lx - 6 + i * 4, base - 81 + j * 4, 3, 3);
        }
      } },
      { f: 0.35, build(ctx, r) {
        // long brick warehouse
        const top = GROUND - 70;
        R(ctx, '#9c4a33', 0, top, LW, 70);
        R(ctx, '#6a2f20', 0, top - 2, LW, 4);
        for (let x = 0; x < LW; x += 120) R(ctx, '#7c3a28', x, top, 4, 70);
        for (let x = 6; x < LW - 4; x += 10) {
          if (x % 120 < 8) continue;
          for (let y = top + 6; y < GROUND - 14; y += 12) R(ctx, r() < 0.25 ? '#f6d36b' : '#3a2a2a', x + 2, y, 5, 7);
        }
        R(ctx, '#1f5a2f', 0, GROUND - 10, LW, 10);
        R(ctx, '#2f7a3f', 0, GROUND - 10, LW, 1);
      } },
    ],
    ground(ctx, w, h) {
      R(ctx, '#7a3a28', 0, 0, w, h);
      R(ctx, '#c46a48', 0, 0, w, 2);
      for (let row = 0; row < 7; row++) {
        const off = (row % 2) * 4;
        for (let x = -4; x < w; x += 8) R(ctx, '#a8553a', x + off, 3 + row * 4, 7, 3);
      }
    },
  },

  raven: {
    sky(ctx) {
      bandedSky(ctx, '#0e0b1e', '#3a2a5a');
      const r = rng(11);
      for (let i = 0; i < 50; i++) R(ctx, r() < 0.2 ? '#c8b8ff' : '#ffffff', ri(r, 0, W), ri(r, 2, 90), 1, 1);
      circle(ctx, '#f0ecd0', 252, 32, 13);
      circle(ctx, '#d8d2b0', 248, 28, 3);
      circle(ctx, '#d8d2b0', 257, 37, 2);
      circle(ctx, '#d8d2b0', 256, 26, 1);
    },
    layers: [
      { f: 0.08, build(ctx, r) {
        const col = '#1c1730';
        for (let x = 0; x < LW; x++) {
          const h = 18 + Math.round(Math.sin(x / 40) * 6 + Math.sin(x / 17) * 3);
          R(ctx, col, x, GROUND - h, 1, h);
        }
        // gothic church with steeple
        R(ctx, col, 140, GROUND - 56, 70, 40);
        R(ctx, col, 148, GROUND - 100, 14, 50);
        for (let i = 0; i < 12; i++) R(ctx, col, 155 - i * 0.6, GROUND - 112 + i, 1 + i * 1.2, 1);
        R(ctx, col, 154, GROUND - 120, 2, 8);
        for (let wx = 168; wx < 205; wx += 10) { R(ctx, '#6a4aa8', wx, GROUND - 48, 4, 10); R(ctx, '#6a4aa8', wx + 1, GROUND - 50, 2, 2); }
        R(ctx, '#6a4aa8', 153, GROUND - 90, 4, 8);
        // bare trees
        for (const tx of [40, 300, 410]) {
          R(ctx, col, tx, GROUND - 60, 3, 50);
          for (let b = 0; b < 5; b++) {
            const by = GROUND - 58 + b * 7, len = ri(r, 6, 14), dir = b % 2 ? 1 : -1;
            for (let i = 0; i < len; i++) R(ctx, col, tx + 1 + dir * i, by - Math.floor(i / 2), 1, 1);
          }
        }
      } },
      { f: 0.3, build(ctx, r) {
        for (let x = 0; x < LW;) {
          const kind = r();
          if (kind < 0.6) {
            const h = ri(r, 10, 18);
            R(ctx, '#2c2440', x, GROUND - 14 - h, 8, h);
            R(ctx, '#2c2440', x + 1, GROUND - 16 - h, 6, 2);
          } else {
            R(ctx, '#2c2440', x + 3, GROUND - 40, 2, 26);
            R(ctx, '#2c2440', x, GROUND - 34, 8, 2);
          }
          x += ri(r, 14, 30);
        }
        R(ctx, '#3b2f4a', 0, GROUND - 14, LW, 14);
        R(ctx, '#4b3f5a', 0, GROUND - 14, LW, 2);
        for (let x = 0; x < LW; x += 12) R(ctx, '#2f2540', x, GROUND - 12, 1, 12);
      } },
    ],
    ground(ctx, w, h) {
      R(ctx, '#3a2c22', 0, 0, w, h);
      R(ctx, '#2f4a2a', 0, 0, w, 3);
      R(ctx, '#3f6a38', 0, 0, w, 1);
      const r = rng(13);
      for (let i = 0; i < 24; i++) R(ctx, '#4a3a2e', ri(r, 0, w), ri(r, 4, h), 2, 1);
    },
  },
};

export class Background {
  constructor(id) {
    const th = THEMES[id];
    this.sky = canvas(W, H, (ctx) => th.sky(ctx));
    this.layers = th.layers.map((L, i) => ({
      f: L.f,
      img: canvas(LW, H, (ctx) => L.build(ctx, rng(17 + i * 31 + id.length * 7))),
    }));
    this.ground = canvas(64, H - GROUND, (ctx, w, h) => th.ground(ctx, w, h));
  }
  draw(ctx, scroll) {
    ctx.drawImage(this.sky, 0, 0);
    for (const L of this.layers) {
      const o = Math.floor((scroll * L.f) % LW);
      ctx.drawImage(L.img, -o, 0);
      ctx.drawImage(L.img, LW - o, 0);
    }
    const go = Math.floor(scroll % 64);
    for (let x = -go; x < W; x += 64) ctx.drawImage(this.ground, x, GROUND);
  }
}
