// Boot, fixed-timestep loop, and the game state machine:
// title -> intro -> play (-> boss) -> complete -> next intro ... -> victory
//                       \-> dead -> gameover -> retry
import { W, H, GROUND, SCALE, lerp, clamp, rand, pick, weighted, overlap } from './consts.js';
import { input, onFirstInput, bindPointer } from './input.js';
import { initAudio, playMusic, stopMusic, sfx, toggleMute, suspendAudio, resumeAudio } from './audio.js';
import { LEVELS } from './levels.js';
import { Player } from './player.js';
import { TYPES, makeEntity } from './obstacles.js';
import { makeBoss } from './bosses.js';
import { Background } from './background.js';
import { drawPixelUI, drawTextUI, cardAt } from './ui.js';
import { updateTouch, isTouch, onCodeInput, focusCodeInput, clearCodeInput } from './touch.js';
import { nextFact } from './facts.js';
import { save } from './save.js';
import { GAME, CODES } from './config.js';

const display = document.getElementById('game');
display.width = W * SCALE;
display.height = H * SCALE;
const dctx = display.getContext('2d');
const buf = document.createElement('canvas');
buf.width = W;
buf.height = H;
const ctx = buf.getContext('2d');
ctx.imageSmoothingEnabled = false;

onFirstInput(initAudio);
bindPointer(display, W, H);
// tapping the game while entering a code re-opens the phone keyboard
display.addEventListener('click', () => { if (game.state === 'code' && isTouch()) focusCodeInput(false); });
if (document.fonts && document.fonts.load) document.fonts.load('16px "Press Start 2P"').catch(() => {});

class Game {
  constructor() {
    this.time = 0;
    this.stateT = 0;
    this.entities = [];
    this.particles = [];
    this.shake = 0;
    this.banner = null;
    this.titleBg = new Background('crab');
    this.bgCache = {};
    this.scroll = 0;
    this.speed = 0;
    this.endT = -1;
    this.state = 'title';
    this.sel = clamp(save.unlocked - 1, 0, LEVELS.length - 1);
    playMusic('title');
  }

  setState(s) { this.state = s; this.stateT = 0; }

  toTitle() {
    this.setState('title');
    this.sel = clamp(save.unlocked - 1, 0, LEVELS.length - 1);
    this.entities = [];
    this.particles = [];
    this.banner = null;
    playMusic('title');
  }

  startLevel(i) {
    const L = LEVELS[i];
    this.levelIndex = i;
    this.level = L;
    this.bg = this.bgCache[L.id] || (this.bgCache[L.id] = new Background(L.id));
    this.player = new Player(L.char);
    this.entities = [];
    this.particles = [];
    this.scroll = 0;
    this.distance = 0;
    this.speed = L.speed[0];
    this.collected = 0;
    this.bossBonus = 0;
    this.boss = null;
    this.toNext = 200;
    this.toCollect = 1.5;
    this.taughtGate = false;
    this.hintUsed = false;
    this.banner = null;
    this.endT = -1;
    this.setState('intro');
    playMusic(L.id);
  }

  get progress() { return this.level ? Math.min(1, this.distance / this.level.length) : 0; }
  get score() { return Math.floor(this.distance / 10) + this.collected * GAME.collectiblePoints + this.bossBonus; }

  spawn(type, x, opts) {
    return this.addEntity(makeEntity(type, x, opts, this));
  }

  addEntity(e) {
    // the ability reminder only flashes over the first gate obstacle of each level
    if (e.hint) { if (this.hintUsed) e.hint = undefined; else this.hintUsed = true; }
    this.entities.push(e);
    return e;
  }

  // ---------- spawn safety ----------
  // Seconds from now when a hazard enters / leaves the player's column, or null if it never will.
  arrival(x, w, vx) {
    const rel = this.speed - vx;
    if (rel < 10) return null;
    const p = this.player;
    return [(x - (p.x + p.w)) / rel, (x + w - p.x) / rel];
  }

  // True if the candidates can be added without crowding any existing hazard: every pair must
  // reach the player at least max(clear) seconds apart, so there is always time to react / use
  // the ability. Items spawned "together" (e.g. a wall of balls) are one obstacle.
  fits(cands, together = false) {
    const list = this.entities.filter((e) => !e.dead && e.kind !== 'collect');
    for (const c of cands) {
      const a = c.shadow ? this.arrival(c.shadow.x, c.shadow.w, 0) : this.arrival(c.x, c.w, c.vx);
      if (a) {
        for (const e of list) {
          const b = e.shadow ? this.arrival(e.shadow.x, e.shadow.w, 0) : this.arrival(e.x, e.w, e.vx);
          if (!b || b[1] < 0) continue;
          const need = Math.max(c.clear, e.clear);
          if (a[0] < b[1] + need && b[0] < a[1] + need) return false;
        }
      }
      if (!together) list.push(c);
    }
    return true;
  }

  // items: [[type, x, opts], ...] -> spawns all (returns them) or none (returns null)
  trySpawn(items, together = false) {
    const cands = items.map(([t, x, o]) => makeEntity(t, x, o ? { ...o } : {}, this));
    if (!this.fits(cands, together)) return null;
    for (const e of cands) this.addEntity(e);
    return cands;
  }

  isOverPit(px) {
    for (const e of this.entities) if (e.kind === 'pit' && px > e.x + 1 && px < e.x + e.w - 1) return e;
    return null;
  }

  burst(x, y, color, n, spd = 80) {
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2, s = rand(20, spd);
      this.particles.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s - 30, life: rand(0.3, 0.7), color, size: Math.random() < 0.5 ? 1 : 2 });
    }
  }

  onPlayerHurt() {
    if (GAME.screenShake) this.shake = 6;
    this.boss?.onHurt?.();
    if (this.player.hearts <= 0) this.die();
  }

  die() {
    this.player.dead = true;
    this.player.vy = -260;
    this.setState('dead');
    stopMusic();
    sfx.gameOver();
  }

  spawnPattern() {
    const L = this.level, p = this.progress;
    let pat, teach = false;
    if (L.gates.length && !this.taughtGate && this.distance > 450 && GAME.gateChanceMultiplier > 0) {
      pat = [[L.gates[0], 0]]; // early guaranteed gate to teach the ability
      teach = true;
    } else if (L.gates.length && Math.random() < lerp(L.gate[0], L.gate[1], p)) {
      pat = [[pick(L.gates), 0]];
    } else if (L.combos.length && Math.random() < lerp(L.combo[0], L.combo[1], p)) {
      pat = pick(L.combos);
    } else {
      const o = weighted(L.obstacles);
      pat = [[o[0], 0, o[2]]];
    }
    const together = pat.every((it) => it[0] === pat[0][0]);
    const made = this.trySpawn(pat.map(([type, dx, opts]) => [type, W + 8 + dx, opts]), together);
    if (!made) return -1; // would be unfair right now; try again shortly
    if (teach) this.taughtGate = true;
    return Math.max(...made.map((e) => e.x + e.w)) - (W + 8);
  }

  startBoss() {
    const L = this.level;
    this.boss = makeBoss(L.boss, this, L.bossPhases);
    this.banner = { text: L.bossName, sub: 'BOSS', tip: L.bossTip, t: 3.2 };
    sfx.bossAppear();
    playMusic(L.id, true);
  }

  completeLevel() {
    this.finalScore = this.score;
    this.newBest = save.recordLevel(this.levelIndex, this.finalScore);
    this.fact = nextFact();
    stopMusic();
    sfx.levelClear();
    this.setState('complete');
  }

  // ---------- update ----------
  update(dt) {
    this.time += dt;
    this.stateT += dt;
    if (input.pressed('mute')) toggleMute();
    const go = input.pressed('confirm') || input.pressed('jump');

    switch (this.state) {
      case 'title': this.updateTitle(dt, go); break;
      case 'code':
        this.scroll += 40 * dt;
        if (this.codeMsg && this.codeMsg.ok) {
          if (this.time - this.codeMsg.t > 1.8) this.closeCodeEntry();
        } else if (input.pressed('confirm')) this.submitCode();   // on-screen OK button
        else if (input.pressed('back')) this.closeCodeEntry();    // on-screen CANCEL button
        break;
      case 'intro':
        if (this.stateT > 0.35 && (go || input.pressed('ability'))) this.setState('play');
        else if (input.pressed('back')) this.toTitle();
        break;
      case 'play': this.updatePlay(dt); break;
      case 'paused':
        if (input.pressed('pause') || go) { resumeAudio(); this.setState('play'); }
        else if (input.pressed('back')) { resumeAudio(); this.toTitle(); }
        break;
      case 'dead': {
        const p = this.player;
        p.vy += 900 * dt;
        p.y += p.vy * dt;
        this.updateParticles(dt);
        if (this.stateT > 1.4) this.setState('gameover');
        break;
      }
      case 'gameover':
        if (this.stateT > 0.5 && go) this.startLevel(this.levelIndex);
        else if (input.pressed('back')) this.toTitle();
        break;
      case 'complete':
        if (this.stateT > 0.8 && go) {
          if (this.levelIndex < LEVELS.length - 1) this.startLevel(this.levelIndex + 1);
          else { this.setState('victory'); playMusic('title'); }
        } else if (input.pressed('back')) this.toTitle();
        break;
      case 'victory':
        this.scroll += 40 * dt;
        if (this.stateT > 1 && go) this.toTitle();
        break;
    }
    this.shake = Math.max(0, this.shake - dt * 20);
  }

  // ---------- cheat codes ----------
  openCodeEntry() {
    this.codeText = '';
    this.codeMsg = null;
    this.setState('code');
    sfx.select();
    input.startText((k) => this.onCodeKey(k));
    // phones type into a hidden text field (opened by the CODE button)
    onCodeInput((v) => {
      if (this.state !== 'code' || (this.codeMsg && this.codeMsg.ok)) return;
      this.codeText = v;
      this.codeMsg = null;
    });
  }

  closeCodeEntry() {
    input.stopText();
    this.setState('title');
  }

  onCodeKey(k) {
    if (this.codeMsg && this.codeMsg.ok) return; // success message showing; closes itself
    if (k === 'Escape') { this.closeCodeEntry(); return; }
    if (k === 'Enter') { this.submitCode(); return; }
    if (k === 'Backspace') { this.codeText = this.codeText.slice(0, -1); this.codeMsg = null; return; }
    if (/^[a-z0-9]$/i.test(k) && this.codeText.length < 16) {
      this.codeText += k.toUpperCase();
      this.codeMsg = null;
      sfx.select();
    }
  }

  submitCode() {
    const code = CODES[this.codeText];
    if (!code) {
      this.codeMsg = { text: 'INVALID CODE', ok: false };
      this.codeText = '';
      clearCodeInput();
      sfx.buzz();
      return;
    }
    if (code.effect === 'unlockAll') save.unlockAll();
    this.codeMsg = { text: code.message || 'CODE ACCEPTED!', ok: true, t: this.time };
    sfx.win();
  }

  updateTitle(dt, go) {
    this.scroll += 40 * dt;
    if (input.pressed('code')) { this.openCodeEntry(); return; }
    // tap/click a level card: first tap selects it, tapping the selected card plays it
    if (input.pressed('tap') && input.tapPos) {
      const i = cardAt(input.tapPos.x, input.tapPos.y);
      if (i < 0) return;
      if (i !== this.sel) { this.sel = i; sfx.select(); return; }
    }
    if (input.pressed('left')) { this.sel = (this.sel + LEVELS.length - 1) % LEVELS.length; sfx.select(); }
    if (input.pressed('right')) { this.sel = (this.sel + 1) % LEVELS.length; sfx.select(); }
    if (go) {
      if (this.sel < save.unlocked) { sfx.select(); this.startLevel(this.sel); }
      else sfx.buzz();
    }
  }

  updatePlay(dt) {
    if (input.pressed('pause') || input.pressed('back')) { this.setState('paused'); suspendAudio(); return; }
    const L = this.level, p = this.player;

    if (!this.boss) {
      this.speed = lerp(L.speed[0], L.speed[1], this.progress);
      this.distance += this.speed * dt;
    } else {
      this.speed = L.speed[1];
    }
    if (this.endT >= 0) this.speed *= Math.max(0.35, 1 - this.endT * 0.5);
    this.scroll += this.speed * dt;

    p.update(dt, this);

    // spawning / boss
    if (!this.boss) {
      this.toNext -= this.speed * dt;
      if (this.toNext <= 0) {
        const w = this.spawnPattern();
        const k = 1 - 0.3 * this.progress;
        this.toNext = w < 0 ? 12 : w + this.speed * rand(L.gap[0], L.gap[1]) * k;
      }
      if (this.distance >= L.length) this.startBoss();
    } else {
      this.boss.update(dt);
      // (bosses can also finish from a collision, e.g. popping the last foam bubble)
      if (this.boss.done && this.endT < 0) {
        this.endT = 0;
        this.bossBonus += GAME.bossBonus;
        sfx.win();
        this.banner = { text: L.winText, t: 2.4 };
        for (const e of this.entities) if (e.kind === 'hurt') { e.dead = true; this.burst(e.x + e.w / 2, e.y + e.h / 2, '#ffffff', 4, 40); }
      }
      if (this.endT >= 0) {
        this.endT += dt;
        if (this.endT > 2.6) { this.completeLevel(); return; }
      }
    }

    if (this.endT < 0) {
      this.toCollect -= dt;
      if (this.toCollect <= 0) {
        this.toCollect = rand(1.4, 3.2);
        const a = L.collectAlt || [8, 46];
        this.spawn('collect', W + 10, { alt: rand(a[0], a[1]), icon: L.collect });
      }
    }

    // entities
    for (const e of this.entities) {
      e.t += dt;
      e.x += (e.vx - this.speed) * dt;
      if (e.shadow) e.shadow.x -= this.speed * dt;
      if (e.ay || e.vy) { e.vy += e.ay * dt; e.y += e.vy * dt; }
      if (e.bounce != null && e.vy > 0 && e.y + e.h >= GROUND) {
        e.y = GROUND - e.h;
        e.vy = e.bounce > 1 ? -e.bounce : -e.vy * e.bounce;
      }
      TYPES[e.type].update?.(e, dt, this);
      if (e.x + e.w < -60 || e.y > H + 30) e.dead = true;
    }

    // collisions
    if (this.state === 'play') {
      const hb = p.hitbox();
      for (const e of this.entities) {
        if (e.dead) continue;
        if (e.kind === 'collect') {
          if (overlap({ x: p.x, y: p.y - 2, w: p.w, h: p.h + 4 }, e)) {
            e.dead = true;
            this.collected++;
            sfx.collect();
            this.burst(e.x + 4, e.y + 4, '#ffe14d', 8, 50);
          }
        } else if (e.kind === 'bubble') {
          if (overlap({ x: p.x - 2, y: p.y - 4, w: p.w + 4, h: p.h + 4 }, e)) {
            e.dead = true;
            this.bossBonus += GAME.foamPoints;
            sfx.pop();
            this.burst(e.x + 6, e.y + 6, '#fff6dc', 14, 70);
            this.boss?.onPop?.();
          }
        } else if (e.kind === 'hurt') {
          if (overlap(hb, { x: e.x + 1, y: e.y + 1, w: e.w - 2, h: e.h - 2 })) {
            p.hurt(this);
            if (this.state !== 'play') break;
          }
        }
      }
    }
    this.entities = this.entities.filter((e) => !e.dead);
    this.updateParticles(dt);
    if (this.banner) { this.banner.t -= dt; if (this.banner.t <= 0) this.banner = null; }
  }

  updateParticles(dt) {
    for (const q of this.particles) {
      q.life -= dt;
      q.vy += 200 * dt;
      q.x += q.vx * dt;
      q.y += q.vy * dt;
    }
    this.particles = this.particles.filter((q) => q.life > 0);
  }

  // ---------- render ----------
  render() {
    const inLevel = this.state !== 'title' && this.state !== 'victory' && this.state !== 'code';
    (inLevel ? this.bg : this.titleBg).draw(ctx, this.scroll);
    if (inLevel) {
      for (const e of this.entities) if (e.kind === 'pit') TYPES[e.type].draw(ctx, e, this);
      this.boss?.draw(ctx);
      for (const e of this.entities) if (e.kind !== 'pit') TYPES[e.type].draw(ctx, e, this);
      this.player.draw(ctx);
      for (const q of this.particles) {
        ctx.globalAlpha = Math.min(1, q.life * 3);
        ctx.fillStyle = q.color;
        ctx.fillRect(Math.round(q.x), Math.round(q.y), q.size, q.size);
      }
      ctx.globalAlpha = 1;
    }
    drawPixelUI(ctx, this);

    dctx.imageSmoothingEnabled = false;
    dctx.fillStyle = '#000';
    dctx.fillRect(0, 0, display.width, display.height);
    const sx = this.shake > 0.5 ? Math.round(rand(-1, 1) * this.shake) * 2 : 0;
    const sy = this.shake > 0.5 ? Math.round(rand(-1, 1) * this.shake) * 2 : 0;
    dctx.drawImage(buf, sx, sy, W * SCALE, H * SCALE);
    drawTextUI(dctx, this);
  }
}

const game = new Game();
window.__game = game; // handy for debugging in the console

document.addEventListener('visibilitychange', () => {
  if (document.hidden && game.state === 'play') { game.setState('paused'); suspendAudio(); }
});

const DT = 1 / 60;
let last = performance.now(), acc = 0;
function frame(now) {
  acc += Math.min(0.1, (now - last) / 1000);
  last = now;
  while (acc >= DT) {
    game.update(DT);
    input.endStep();
    acc -= DT;
  }
  game.render();
  updateTouch(game);
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
