// Boss / finish set pieces. Each boss is built around its character's ability.
import { W, GROUND, R, circle, rand, lerp, clamp } from './consts.js';
import { sfx } from './audio.js';
import { GAME } from './config.js';
import { makeEntity } from './obstacles.js';

function makeDrop(g, x, y, vx, vy, ay) {
  return makeEntity('inkDrop', x, { y, vx, vy, ay }, g);
}

const DUR = Math.max(0.1, GAME.bossDurationMultiplier);

const INTRO = 2.2;

class Boss {
  constructor(g, phases) {
    this.g = g;
    this.phases = phases;
    this.progress = 0;
    this.t = 0;
    this.done = false;
    this.timer = INTRO;
  }
  get phase() { return Math.min(this.phases - 1, Math.floor(this.progress * this.phases)); }
  get active() { return this.t > INTRO && !this.done; }
  tick(dt) {
    this.t += dt;
    if (this.done) return;
    this.timer -= dt;
    if (this.timer <= 0) {
      // attack() returns false when its spawn would be unfair right now -> retry shortly
      const ok = this.attack();
      if (ok === false) this.timer = 0.15;
      else if (this.timer <= 0) this.timer = this.interval();
    }
  }
  advance(v) {
    if (this.done) return;
    const before = this.phase;
    this.progress = clamp(this.progress + v, 0, 1);
    if (this.progress >= 1 - 1e-6) { this.progress = 1; this.done = true; return; } // float-safe (10 x 0.1 != 1)
    if (this.phases > 1 && this.phase > before) {
      sfx.phase();
      this.g.banner = { text: 'PHASE ' + (this.phase + 1), t: 1.2 };
    }
  }
}

// ---------- 1. Steamer pot chases the crab: dash to keep it back ----------
const CRAB_STAGE_X = 130; // crab's resting x during the boss (centered so the pot is visible)
const POT_MIN = -22;      // pot never retreats past here: at least ~28 px of it stays on screen
class Steamer extends Boss {
  constructor(g, ph) { super(g, ph); this.potX = -60; }
  interval() { return rand(1.0, 1.45); }
  attack() {
    const g = this.g, r = Math.random();
    if (r < 0.28) return !!g.trySpawn([['potTrap', W + 8]]);
    if (r < 0.64) return !!g.trySpawn([['oldbayCloud', W + 8, { alt: 0 }]]);
    return !!g.trySpawn([['oldbayCloud', W + 8, { alt: 4, h: 12 }]]);
  }
  onAbility() { if (this.active) this.potX = Math.max(POT_MIN, this.potX - 24); }
  onHurt() { this.potX += 14; }
  update(dt) {
    const p = this.g.player;
    this.tick(dt);
    // move the crab to center stage so the pot has room on screen
    p.homeX = this.done ? GAME.playerX : CRAB_STAGE_X;
    if (this.done) { this.potX -= 70 * dt; return; }
    if (this.t < INTRO) { this.potX = lerp(this.potX, POT_MIN + 10, Math.min(1, dt * 2)); return; }
    this.advance(dt / (20 * DUR));
    this.potX = clamp(this.potX + 12 * dt, POT_MIN, 200);
    if (this.potX + 50 > p.x + 3 && p.hurt(this.g)) this.potX = Math.max(POT_MIN, this.potX - 40);
  }
  draw(ctx) {
    const x = Math.round(this.potX), y = GROUND - 44, t = this.t;
    for (let i = 0; i < 4; i++) {
      const sy = y - 8 - ((t * 20 + i * 10) % 30);
      ctx.globalAlpha = 0.6;
      R(ctx, '#e0783c', x + 8 + i * 10 + Math.sin(t * 3 + i) * 3, sy, 8, 6);
      ctx.globalAlpha = 1;
    }
    R(ctx, '#1f2f45', x, y + 6, 50, 38);
    R(ctx, '#2c4466', x + 2, y + 8, 46, 34);
    const specks = [[6, 12], [14, 30], [22, 18], [9, 36], [40, 34], [30, 12], [18, 24], [44, 14]];
    for (const [sx, sy] of specks) R(ctx, '#dfe8f5', x + sx, y + sy, 1, 1);
    const ly = y + (Math.sin(t * 25) > 0.3 ? -2 : 0);
    R(ctx, '#1f2f45', x - 2, ly + 2, 54, 5);
    R(ctx, '#888888', x + 21, ly - 2, 8, 4);
    R(ctx, '#111', x - 5, y + 16, 5, 4);
    R(ctx, '#111', x + 50, y + 16, 5, 4);
    R(ctx, '#ffd23a', x + 30, y + 18, 6, 4);
    R(ctx, '#ffd23a', x + 40, y + 18, 6, 4);
    R(ctx, '#111', x + 33, y + 19, 2, 2);
    R(ctx, '#111', x + 43, y + 19, 2, 2);
    R(ctx, '#111', x + 29, y + 16, 7, 1);
    R(ctx, '#111', x + 40, y + 16, 7, 1);
    R(ctx, '#000', x + 31, y + 28, 15, 5);
    R(ctx, '#e5532d', x + 33, y + 29, 3, 3);
    R(ctx, '#e5532d', x + 41, y + 29, 3, 3);
  }
}

// ---------- 2. Runaway chip truck: slide to close the gap ----------
class Truck extends Boss {
  constructor(g, ph) { super(g, ph); this.x = W + 30; this.drops = 0; }
  interval() { return this.phase === 0 ? 1.45 : 1.1; }
  attack() {
    const g = this.g;
    if ((this.drops + 1) % 3 === 0) {
      if (!g.trySpawn([['awning', W + 8]])) return false;
    } else {
      const items = [['chipBox', W + 8]];
      if (this.phase > 0 && Math.random() < 0.4) items.push(['chipBox', W + 19]);
      if (!g.trySpawn(items, true)) return false;
    }
    this.drops++;
    return true;
  }
  onHurt() { this.advance(-0.05); }
  update(dt) {
    const p = this.g.player;
    this.tick(dt);
    const target = this.done ? p.x + 40 : lerp(285, p.x + 105, this.progress);
    this.x = lerp(this.x, target, Math.min(1, dt * 2));
    if (!this.active) return;
    this.advance((dt / 34 + (p.slideT > 0 ? dt / 10 : 0)) / DUR);
  }
  draw(ctx) {
    const x = Math.round(this.x), y = GROUND - 34 + (Math.floor(this.t * 10) % 2);
    R(ctx, '#e8e8e8', x, y, 40, 26);
    R(ctx, '#bdbdbd', x, y + 25, 40, 1);
    R(ctx, '#d3202f', x, y + 18, 40, 3);
    R(ctx, '#f6c33b', x + 12, y + 5, 14, 10);
    R(ctx, '#d3202f', x + 14, y + 7, 10, 2);
    R(ctx, '#e89a3a', x + 15, y + 10, 8, 3);
    R(ctx, '#7a5a3a', x - 1, y + 2, 2, 24);
    R(ctx, '#c8202a', x + 40, y + 8, 14, 18);
    R(ctx, '#9fd0ff', x + 46, y + 10, 6, 6);
    R(ctx, '#333', x + 52, y + 22, 3, 3);
    R(ctx, '#111', x + 4, y + 25, 8, 8);
    R(ctx, '#111', x + 30, y + 25, 8, 8);
    R(ctx, '#111', x + 44, y + 25, 8, 8);
    R(ctx, '#888', x + 7, y + 28, 2, 2);
    R(ctx, '#888', x + 33, y + 28, 2, 2);
    R(ctx, '#888', x + 47, y + 28, 2, 2);
    if (this.active) { ctx.globalAlpha = 0.5; R(ctx, '#aaaaaa', x - 6, y + 28 + Math.sin(this.t * 20), 4, 3); ctx.globalAlpha = 1; }
  }
}

// ---------- 3. Keg cannon: rolls kegs, blows foam bubbles up high -> twirl up and pop them ----------
class Kegs extends Boss {
  constructor(g, ph) { super(g, ph); this.x = W + 40; this.need = Math.max(1, Math.round(10 * DUR)); this.recoil = 0; this.n = 0; }
  interval() { return this.phase === 0 ? rand(0.8, 1.0) : rand(0.65, 0.85); }
  attack() {
    const g = this.g;
    if (this.n % 2 === 0) {
      // a foam bubble drifts up out of reach of a plain jump. It reserves clear time around
      // itself (spawn safety) so nothing on the ground arrives while you twirl up for it.
      const made = g.trySpawn([['foam', this.x - 2, { y: GROUND - 30, vx: -25, clear: 0.7 }]]);
      if (!made) return false;
      made[0].targetY = GROUND - rand(76, 92) - 12;
    } else {
      // ground pressure: a rolling keg, or (phase 2) a rolling keg tower to twirl over
      const tower = this.phase > 0 && Math.random() < 0.4;
      const made = tower
        ? g.trySpawn([['kegTower', this.x - 4, { vx: -20 }]])
        : g.trySpawn([['keg', this.x - 4, { vx: -55 }]]);
      if (!made) return false;
      this.recoil = 0.2;
      sfx.cannon();
    }
    this.n++;
    return true;
  }
  onPop() {
    if (this.done) return;
    this.advance(1 / this.need);
    sfx.bossHit();
    this.g.burst(this.x + 20, GROUND - 30, '#fff6dc', 10, 60);
    if (GAME.screenShake) this.g.shake = 2;
  }
  update(dt) {
    this.tick(dt);
    this.x = lerp(this.x, this.done ? W + 80 : W - 62, Math.min(1, dt * 2));
    this.recoil = Math.max(0, this.recoil - dt);
  }
  draw(ctx) {
    const x = Math.round(this.x + this.recoil * 15), y = GROUND - 36;
    R(ctx, '#5a3a1c', x, y + 18, 56, 8);
    R(ctx, '#8a5a32', x + 1, y + 19, 54, 6);
    R(ctx, '#2a1a0a', x + 6, y + 26, 10, 10);
    R(ctx, '#2a1a0a', x + 40, y + 26, 10, 10);
    R(ctx, '#c8a060', x + 10, y + 30, 2, 2);
    R(ctx, '#c8a060', x + 44, y + 30, 2, 2);
    // the cannon: a giant keg on its side
    R(ctx, '#5d646c', x + 4, y, 40, 18);
    R(ctx, '#c0c6cc', x + 5, y + 1, 38, 16);
    R(ctx, '#4d545c', x + 12, y + 1, 2, 16);
    R(ctx, '#4d545c', x + 34, y + 1, 2, 16);
    R(ctx, '#222', x - 2, y + 4, 7, 10);
    R(ctx, '#f6c33b', x + 20, y + 5, 8, 8);
    R(ctx, '#d3202f', x + 22, y + 7, 4, 4);
    if (this.recoil > 0.1) { R(ctx, '#ffd23a', x - 8, y + 6, 6, 6); R(ctx, '#ffffff', x - 6, y + 8, 2, 2); }
    // foam spilling over the top
    for (let i = 0; i < 5; i++) R(ctx, '#fff6dc', x + 8 + i * 7, y - 3 + Math.round(Math.sin(this.t * 4 + i) * 1.5), 6, 4);
    // damage cracks as bubbles get popped
    if (this.progress > 0.3) R(ctx, '#333', x + 14, y + 4, 1, 8);
    if (this.progress > 0.6) R(ctx, '#333', x + 30, y + 3, 1, 10);
  }
}

// ---------- 4. Home run derby: pitching machine, ball walls need a double jump ----------
class Derby extends Boss {
  constructor(g, ph) { super(g, ph); this.x = W + 30; this.fire = 0; this.wheel = 0; }
  interval() { return [1.35, 1.1, 0.9][this.phase]; }
  attack() {
    const g = this.g, ph = this.phase, vx = -120 - ph * 15, r = Math.random();
    let made;
    if (ph >= 1 && r < 0.35) {
      // a wall of balls: slower pitch, and lots of clear space around it for the double jump
      made = g.trySpawn([0, 18, 36, 54].map((a) => ['foulBall', this.x, { alt: a, vx: -90, clear: 1.1 }]), true);
    } else if (r < 0.68) {
      made = g.trySpawn([['foulBall', this.x, { alt: 0, vx }]]);
    } else {
      made = g.trySpawn([['foulBall', this.x, { alt: 6, vx }]]);
    }
    if (!made) return false;
    this.fire = 0.15;
    sfx.pitch();
    if (ph === 2 && Math.random() < 0.3) this.timer = 0.45; // quick follow-up pitch (still spacing-checked)
    return true;
  }
  update(dt) {
    this.tick(dt);
    this.x = lerp(this.x, this.done ? W + 60 : W - 40, Math.min(1, dt * 2));
    this.fire = Math.max(0, this.fire - dt);
    this.wheel += dt * (this.timer < 0.4 ? 40 : 10);
    if (this.active) this.advance(dt / (28 * DUR));
  }
  draw(ctx) {
    const x = Math.round(this.x), y = GROUND - 28;
    R(ctx, '#555', x + 4, y + 16, 2, 12);
    R(ctx, '#555', x + 18, y + 16, 2, 12);
    R(ctx, '#555', x + 11, y + 16, 2, 12);
    R(ctx, '#8a8f99', x, y + 4, 24, 12);
    R(ctx, '#5d6470', x, y + 15, 24, 2);
    const spin = Math.floor(this.wheel) % 2;
    circle(ctx, '#222', x + 7, y + 4, 5);
    circle(ctx, '#222', x + 17, y + 4, 5);
    R(ctx, spin ? '#999' : '#444', x + 6, y + 1, 2, 6);
    R(ctx, spin ? '#444' : '#999', x + 16, y + 1, 2, 6);
    R(ctx, '#6a6f78', x - 10, y + 6, 12, 4);
    R(ctx, this.timer < 0.4 && !this.done ? '#ff3030' : '#661010', x + 20, y + 6, 2, 2);
    if (this.fire > 0) { R(ctx, '#ffffff', x - 14, y + 5, 3, 1); R(ctx, '#ffffff', x - 15, y + 8, 4, 1); }
  }
}

// ---------- 5. Nevermore: giant quill, ink pools need a glide ----------
class Quill extends Boss {
  constructor(g, ph) { super(g, ph); this.x = W + 40; this.y = 30; this.n = 0; this.swoopT = -1; }
  interval() { return [1.5, 1.25, 1.0][this.phase]; }
  attack() {
    const g = this.g, ph = this.phase, p = g.player;
    if ((this.n + 1) % 3 === 0) {
      if (!g.trySpawn([['inkPool', W + 8]])) return false;
      this.n++;
      return true;
    }
    if (ph >= 1 && this.swoopT < 0 && Math.random() < 0.4) {
      this.swoopT = 0.75;
      g.banner = { text: 'NEVERMORE!', t: 0.8, small: true };
      this.n++;
      return true;
    }
    // ink drops: aimed to splash down well ahead of the player, never on top of them
    const y0 = this.y + 40, vy0 = 20, ay = 340, fall = GROUND - 6 - y0;
    const tFall = (-vy0 + Math.sqrt(vy0 * vy0 + 2 * ay * fall)) / ay;
    const drops = [];
    for (let i = 0; i < 1 + ph; i++) {
      const x0 = this.x + 4 + i * 16;
      const landX = rand(p.x + 110, W - 20) ;
      const vx = (landX - x0) / tFall + g.speed;
      const e = makeDrop(g, x0, y0, vx, vy0, ay);
      e.shadow = { x: landX - 3 + g.speed * tFall, w: 10 };
      drops.push(e);
    }
    if (!g.fits(drops)) return false;
    drops.forEach((e) => g.addEntity(e));
    this.n++;
    return true;
  }
  update(dt) {
    this.tick(dt);
    const tx = this.done ? W + 80 : 200 + Math.sin(this.t * 0.9) * 70;
    this.x = lerp(this.x, tx, Math.min(1, dt * 2));
    this.y = 22 + Math.sin(this.t * 1.7) * 10;
    if (this.swoopT > 0) {
      this.swoopT -= dt;
      if (this.swoopT <= 0) {
        // keep waiting until the swoop can come in without crowding another hazard
        if (this.done || this.g.trySpawn([['quillSwoop', W + 8]])) this.swoopT = -1;
        else this.swoopT = 0.05;
      }
    }
    if (this.active) this.advance(dt / (32 * DUR));
  }
  draw(ctx) {
    const x = Math.round(this.x), y = Math.round(this.y);
    const warn = this.swoopT > 0 && Math.floor(this.swoopT * 12) % 2 === 0;
    ctx.globalAlpha = 0.25;
    circle(ctx, warn ? '#ff3060' : '#8a5ad8', x + 9, y + 20, 18);
    ctx.globalAlpha = 1;
    for (let i = 0; i < 36; i++) {
      const cx = x + i * 0.45;
      const wv = Math.round(8 * Math.sin(Math.PI * i / 40)) + 1;
      R(ctx, '#ece8f6', cx - wv / 2, y + i, wv, 1);
    }
    for (let i = 0; i < 40; i++) R(ctx, '#9a8fb0', x + i * 0.45, y + i, 1, 1);
    R(ctx, '#111', x + 17, y + 38, 3, 6);
    R(ctx, '#111', x + 18, y + 44, 1, 2);
    R(ctx, warn ? '#ff3060' : '#ff4444', x + 2, y + 10, 2, 2);
    R(ctx, warn ? '#ff3060' : '#ff4444', x + 7, y + 11, 2, 2);
  }
}

const BOSSES = { steamer: Steamer, truck: Truck, kegs: Kegs, derby: Derby, quill: Quill };

export function makeBoss(id, g, phases) {
  return new BOSSES[id](g, phases);
}
