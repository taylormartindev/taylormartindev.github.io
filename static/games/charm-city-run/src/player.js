// Player physics shared by all characters, plus each character's unique ability.
import { W, GROUND, R } from './consts.js';
import { GAME, CHARACTERS } from './config.js';
import { save } from './save.js';
import { input } from './input.js';
import { sfx } from './audio.js';
import { SPR } from './sprites.js';

// Fixed per-character traits (sprite size, ability type). Tunable numbers live in config.js.
const BASE = {
  crab:   { w: 16, h: 9,  ability: 'dash',   label: 'DASH' },
  utz:    { w: 12, h: 19, ability: 'slide',  label: 'SLIDE' },
  boh:    { w: 14, h: 21, ability: 'twirl',  label: 'TWIRL' },
  oriole: { w: 12, h: 11, ability: 'double' },
  raven:  { w: 13, h: 11, ability: 'glide' },
};

export const CHARS = Object.fromEntries(Object.entries(BASE).map(([id, b]) => {
  const c = { ...b, ...CHARACTERS[id] };
  c.cd = c.dashCooldown ?? c.slideCooldown ?? c.twirlCooldown ?? 0;
  return [id, c];
}));

export class Player {
  constructor(id) {
    const c = CHARS[id];
    this.id = id;
    this.c = c;
    this.w = c.w;
    this.h = c.h;
    this.homeX = GAME.playerX;
    this.x = this.homeX;
    this.y = GROUND - c.h;
    this.vy = 0;
    this.onGround = true;
    this.maxHearts = Math.max(1, Math.min(16, save.heartsOverride || GAME.startingHearts | 0));
    this.hearts = this.maxHearts;
    this.armor = c.armor || 0;
    this.invuln = 0;
    this.cd = 0;
    this.coyote = 0;
    this.jumpBuf = 0;
    this.canCut = false;
    this.extraJumps = 0;
    this.dashT = 0;
    this.slideT = 0;
    this.slideBuf = 0;
    this.twirlT = 0;
    this.twirlUsed = false;
    this.gliding = false;
    this.ducking = false;
    this.anim = 0;
    this.trail = [];
    this.dead = false;
    this.glideSfxT = 0;
  }

  hitbox() {
    return { x: this.x + 2, y: this.y + 2, w: this.w - 4, h: Math.max(2, this.h - 2) };
  }

  setHeight(h) {
    const bottom = this.y + this.h;
    this.h = h;
    this.y = bottom - h;
  }

  update(dt, g) {
    const c = this.c;
    this.invuln = Math.max(0, this.invuln - dt);
    this.cd = Math.max(0, this.cd - dt);
    this.anim += dt * (g.speed / 100);
    for (const tr of this.trail) tr.life -= dt;
    this.trail = this.trail.filter((tr) => tr.life > 0);

    const abilityPressed = input.pressed('ability');
    const abilityHeld = input.down('ability');
    const jumpHeld = input.down('jump');
    const duckHeld = input.down('duck');
    if (input.pressed('jump')) this.jumpBuf = 0.12;
    else this.jumpBuf = Math.max(0, this.jumpBuf - dt);

    // ----- abilities -----
    if (c.ability === 'dash' && abilityPressed && this.cd <= 0 && this.dashT <= 0) {
      this.dashT = c.dashTime;
      this.cd = c.cd;
      sfx.dash();
      g.burst(this.x, this.y + this.h / 2, '#bfe6ff', 8, 60);
      g.boss?.onAbility?.();
    }
    if (c.ability === 'slide') {
      if (abilityPressed) this.slideBuf = 0.15;
      else this.slideBuf = Math.max(0, this.slideBuf - dt);
      if (this.slideBuf > 0 && this.onGround && this.slideT <= 0 && this.cd <= 0) {
        this.slideT = c.slideTime;
        this.slideBuf = 0;
        sfx.slide();
        g.boss?.onAbility?.();
      }
    }
    // Mustache Twirl: spin the handlebar mustache like a rotor and climb. Once per air time.
    if (c.ability === 'twirl' && abilityPressed && !this.twirlUsed && this.cd <= 0) {
      this.twirlT = c.twirlTime;
      this.twirlUsed = true;
      this.cd = c.cd;
      if (this.onGround) { this.onGround = false; this.coyote = 0; this.setHeight(c.h); }
      sfx.twirl();
      g.burst(this.x + this.w / 2, this.y + 10, '#ffffff', 6, 50);
      g.boss?.onAbility?.();
    }
    // 2X JUMP / GLIDE buttons also jump from the ground (handy with just two touch buttons)
    if ((c.ability === 'double' || c.ability === 'glide') && abilityPressed) this.jumpBuf = 0.12;

    // ----- jumping -----
    if (this.onGround) {
      this.coyote = 0.08;
      this.extraJumps = c.ability === 'double' ? c.extraJumps : 0;
      this.twirlUsed = false;
    } else {
      this.coyote = Math.max(0, this.coyote - dt);
    }
    if (this.jumpBuf > 0) {
      if (this.coyote > 0) {
        if (this.slideT > 0) { this.slideT = 0; this.cd = c.cd; }
        this.setHeight(c.h);
        this.vy = c.jump;
        this.onGround = false;
        this.coyote = 0;
        this.jumpBuf = 0;
        this.canCut = true;
        sfx.jump();
      } else if (this.extraJumps > 0) {
        this.extraJumps--;
        this.vy = c.doubleJump;
        this.jumpBuf = 0;
        this.canCut = true;
        sfx.double();
        g.burst(this.x + this.w / 2, this.y + this.h, '#f28c28', 8, 50);
      }
    }
    // variable jump height: releasing early cuts the jump
    if (this.canCut && !jumpHeld && !((c.ability === 'double' || c.ability === 'glide') && abilityHeld) && this.vy < -140) {
      this.vy = -140;
      this.canCut = false;
    }
    if (this.vy >= 0) this.canCut = false;

    // ----- horizontal (dash) -----
    let grav = GAME.gravity;
    if (!this.onGround && duckHeld) grav *= 2.2;
    if (this.dashT > 0) {
      this.dashT = Math.max(0, this.dashT - dt);
      this.x = Math.min(W - 40, this.x + (c.dashDistance / c.dashTime) * dt);
      if (Math.floor(this.dashT * 60) % 3 === 0) this.trail.push({ x: this.x, y: this.y, life: 0.18 });
      if (!this.onGround) { this.vy = 0; grav = 0; }
    } else if (this.x > this.homeX) {
      this.x = Math.max(this.homeX, this.x - (c.dashReturnSpeed ?? 50) * dt);
    } else if (this.x < this.homeX) {
      this.x = Math.min(this.homeX, this.x + 60 * dt);
    }

    // ----- vertical -----
    this.vy += grav * dt;
    if (this.twirlT > 0) {
      this.twirlT -= dt;
      if (duckHeld) this.twirlT = 0; // duck cancels the twirl
      else if (this.vy > -c.twirlRiseSpeed) this.vy = -c.twirlRiseSpeed;
    }
    this.gliding = false;
    if (c.ability === 'glide' && !this.onGround && this.vy > 0 && (jumpHeld || abilityHeld)) {
      this.vy = Math.min(this.vy, c.glideFallSpeed);
      this.gliding = true;
      this.glideSfxT -= dt;
      if (this.glideSfxT <= 0) { sfx.glide(); this.glideSfxT = 0.3; }
    }
    this.y += this.vy * dt;
    if (this.y < 22) { this.y = 22; if (this.vy < 0) this.vy = 0; } // ceiling

    const cx = this.x + this.w / 2;
    const overPit = g.isOverPit(cx);
    if (this.y + this.h >= GROUND) {
      if (!overPit) {
        if (this.vy >= 0) {
          if (!this.onGround && this.vy > 250) g.burst(cx, GROUND - 1, '#dddddd', 4, 30);
          this.y = GROUND - this.h;
          this.vy = 0;
          this.onGround = true;
        }
      } else {
        this.onGround = false;
        if (this.y + this.h > GROUND + 16) {
          // fell into a pit: hurt, then bounce back out
          this.hurt(g, true);
          this.setHeight(c.h);
          this.y = GROUND + 16 - this.h;
          this.vy = -470;
          this.canCut = false;
          this.slideT = 0;
          sfx.bounce();
        }
      }
    } else {
      this.onGround = false;
    }

    // ----- slide / duck height -----
    if (this.slideT > 0) {
      this.slideT -= dt;
      if (!this.onGround) this.slideT = 0;
      if (this.slideT <= 0) this.cd = c.cd;
      if (Math.random() < 0.4) g.burst(this.x + 2, GROUND - 1, '#bbbbbb', 1, 30);
    }
    this.ducking = this.onGround && duckHeld && this.slideT <= 0;
    const targetH = this.slideT > 0 ? 6 : this.ducking ? Math.round(c.h * 0.6) : c.h;
    if (targetH !== this.h) this.setHeight(targetH);

  }

  hurt(g, fromPit = false) {
    if (this.dead || this.invuln > 0 || (this.dashT > 0 && !fromPit) || g.endT >= 0) return false;
    if (this.armor > 0) {
      this.armor--;
      this.invuln = 1.0;
      sfx.armor();
      if (GAME.screenShake) g.shake = 3;
      g.burst(this.x + this.w / 2, this.y + this.h / 2, '#9ad0ff', 12, 70);
      return true;
    }
    this.hearts--;
    this.invuln = GAME.hurtInvulnTime;
    sfx.hurt();
    g.burst(this.x + this.w / 2, this.y + this.h / 2, '#ff6b6b', 10, 70);
    g.onPlayerHurt();
    return true;
  }

  sprite() {
    const S = SPR[this.id];
    if (this.slideT > 0 && S.slide) return S.slide;
    if (!this.onGround || this.dead) return S.air;
    return S.run[Math.floor(this.anim * 6) % 2];
  }

  draw(ctx) {
    const img = this.sprite();
    let dw = img.width, dh = img.height;
    if (this.ducking) dh = Math.max(4, Math.round(dh * 0.6));
    const dx = Math.round(this.x + this.w / 2 - dw / 2);
    const dy = Math.round(this.y + this.h - dh);

    // dash afterimages
    for (const tr of this.trail) {
      ctx.globalAlpha = Math.max(0, tr.life / 0.18) * 0.4;
      ctx.drawImage(img, Math.round(tr.x + this.w / 2 - dw / 2), Math.round(tr.y + this.h - dh), dw, dh);
    }
    ctx.globalAlpha = 1;

    if (this.dead) {
      ctx.save();
      ctx.translate(dx + dw / 2, dy + dh / 2);
      ctx.scale(1, -1);
      ctx.drawImage(img, -dw / 2, -dh / 2, dw, dh);
      ctx.restore();
      return;
    }
    if (this.invuln > 0 && Math.floor(this.invuln * 15) % 2 === 0) return;

    if (this.gliding) {
      const wy = dy + 3, cx = dx + Math.floor(dw / 2);
      const flap = Math.floor(this.anim * 8) % 2;
      R(ctx, '#16141c', cx - 12, wy + flap, 10, 2);
      R(ctx, '#16141c', cx - 16, wy - 1 + flap, 5, 2);
      R(ctx, '#4a3a6e', cx - 14, wy + 1 + flap, 6, 1);
      R(ctx, '#16141c', cx + 2, wy + flap, 10, 2);
      R(ctx, '#16141c', cx + 11, wy - 1 + flap, 5, 2);
      R(ctx, '#4a3a6e', cx + 8, wy + 1 + flap, 6, 1);
    }
    ctx.drawImage(img, dx, dy, dw, dh);

    if (this.twirlT > 0) {
      // spinning handlebar mustache
      const my = dy + 10, cx = dx + Math.floor(dw / 2), f = Math.floor(this.twirlT * 40) % 3;
      if (f === 0) { R(ctx, '#141414', cx - 13, my, 26, 2); R(ctx, '#141414', cx - 14, my - 2, 2, 2); R(ctx, '#141414', cx + 12, my + 2, 2, 2); }
      else if (f === 1) { R(ctx, '#141414', cx - 7, my - 1, 14, 2); R(ctx, '#141414', cx - 8, my - 3, 2, 2); R(ctx, '#141414', cx + 6, my + 1, 2, 2); }
      else { R(ctx, '#141414', cx - 3, my, 6, 2); }
      ctx.globalAlpha = 0.5;
      R(ctx, '#ffffff', cx - 15, my + 4, 3, 1); R(ctx, '#ffffff', cx + 12, my + 4, 3, 1);
      R(ctx, '#ffffff', cx - 12, my + 7, 2, 1); R(ctx, '#ffffff', cx + 10, my + 7, 2, 1);
      ctx.globalAlpha = 1;
    }
  }
}
