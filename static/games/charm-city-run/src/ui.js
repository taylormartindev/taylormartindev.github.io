// HUD, menus and overlays. Pixel parts draw on the low-res buffer; text draws on the
// full-res display canvas so it stays crisp.
import { W, H, GROUND, SCALE as S, R } from './consts.js';
import { SPR, ICONS } from './sprites.js';
import { LEVELS } from './levels.js';
import { save } from './save.js';
import { isMuted } from './audio.js';
import { isTouch } from './touch.js';

// pick the prompt for keyboard vs touch screens
const T = (keys, touch) => (isTouch() ? touch : keys);

const FONT = '"Press Start 2P", ui-monospace, monospace';

function txt(c, s, x, y, size = 16, color = '#fff', align = 'center') {
  c.font = `${size}px ${FONT}`;
  c.textAlign = align;
  c.textBaseline = 'middle';
  const o = Math.max(1, Math.round(size / 8));
  c.fillStyle = 'rgba(0,0,0,0.8)';
  c.fillText(s, x * S + o, y * S + o);
  c.fillStyle = color;
  c.fillText(s, x * S, y * S);
}

function wrap(c, s, maxW, size) {
  c.font = `${size}px ${FONT}`;
  const lines = [];
  let cur = '';
  for (const w of s.split(' ')) {
    const t = cur ? cur + ' ' + w : w;
    if (c.measureText(t).width > maxW && cur) { lines.push(cur); cur = w; } else cur = t;
  }
  if (cur) lines.push(cur);
  return lines;
}

function panel(ctx, x, y, w, h, border = '#f6c33b') {
  R(ctx, 'rgba(10,10,25,0.85)', x, y, w, h);
  R(ctx, border, x, y, w, 1);
  R(ctx, border, x, y + h - 1, w, 1);
  R(ctx, border, x, y, 1, h);
  R(ctx, border, x + w - 1, y, 1, h);
}

const blink = (g, rate = 2) => Math.floor(g.time * rate) % 2 === 0;

function drawScaled(ctx, img, cx, bottom, k) {
  ctx.drawImage(img, Math.round(cx - (img.width * k) / 2), Math.round(bottom - img.height * k), img.width * k, img.height * k);
}

// ---------- title cards ----------
const CARD = { y: 52, w: 56, h: 72 };
const cardX = (i) => 8 + i * 62;
export function cardAt(x, y) {
  for (let i = 0; i < LEVELS.length; i++) {
    if (x >= cardX(i) && x < cardX(i) + CARD.w && y >= CARD.y - 2 && y < CARD.y + CARD.h) return i;
  }
  return -1;
}

function titlePixels(ctx, g) {
  for (let i = 0; i < LEVELS.length; i++) {
    const L = LEVELS[i];
    const x = cardX(i), sel = i === g.sel, locked = i >= save.unlocked;
    const y = CARD.y - (sel ? 2 : 0);
    panel(ctx, x, y, CARD.w, CARD.h, sel ? '#ffffff' : '#6a6a8a');
    if (sel) panel(ctx, x - 1, y - 1, CARD.w + 2, CARD.h + 2, '#f6c33b');
    const bob = sel ? Math.round(Math.sin(g.time * 6)) : 0;
    const img = SPR[L.char].run[sel ? Math.floor(g.time * 8) % 2 : 0];
    drawScaled(ctx, img, x + CARD.w / 2, y + 36 + bob, 2);
    if (locked) {
      R(ctx, 'rgba(0,0,0,0.65)', x + 1, y + 1, CARD.w - 2, CARD.h - 2);
      const cx = x + CARD.w / 2;
      R(ctx, '#bbbbbb', cx - 5, y + 22, 10, 8);
      R(ctx, '#bbbbbb', cx - 4, y + 16, 2, 6);
      R(ctx, '#bbbbbb', cx + 2, y + 16, 2, 6);
      R(ctx, '#bbbbbb', cx - 4, y + 15, 8, 2);
      R(ctx, '#555555', cx - 1, y + 25, 2, 3);
    }
  }
}

function titleText(c, g) {
  txt(c, 'CHARM CITY RUN', 160, 18, 34, '#f6c33b');
  txt(c, 'a Baltimore side-scroller, hon', 160, 34, 12, '#ffffff');
  for (let i = 0; i < LEVELS.length; i++) {
    const L = LEVELS[i], x = cardX(i) + CARD.w / 2, locked = i >= save.unlocked;
    const y = CARD.y - (i === g.sel ? 2 : 0);
    txt(c, `${i + 1}`, cardX(i) + 5, y + 6, 9, '#f6c33b', 'left');
    txt(c, L.short, x, y + 44, 8, locked ? '#888' : '#fff');
    txt(c, L.place.toUpperCase(), x, y + 53, 7, locked ? '#666' : '#9adfff');
    txt(c, locked ? 'LOCKED' : `BEST ${save.best(i)}`, x, y + 63, 7, locked ? '#888' : '#f6c33b');
  }
  if (blink(g)) txt(c, T('< >  CHOOSE     SPACE / ENTER  PLAY', 'TAP A CHARACTER, THEN TAP AGAIN TO PLAY'), 160, 138, 11, '#ffffff');
  if (!isTouch()) txt(c, 'SPACE/UP JUMP   DOWN DUCK   X/SHIFT ABILITY   P PAUSE   M MUTE', 160, 152, 8, '#dddddd');
  txt(c, T('Clear a level to unlock the next character     C: ENTER CODE', 'Clear a level to unlock the next character'), 160, isTouch() ? 152 : 163, 8, '#bbbbbb');
}

// ---------- in-level HUD ----------
function hudPixels(ctx, g) {
  const p = g.player;
  // hearts wrap into rows of 8
  for (let i = 0; i < p.maxHearts; i++) ctx.drawImage(i < p.hearts ? ICONS.heart : ICONS.heartEmpty, 5 + (i % 8) * 10, 5 + Math.floor(i / 8) * 9);
  if (p.armor > 0) ctx.drawImage(ICONS.shield, 5 + (p.maxHearts % 8) * 10, 5 + Math.floor(p.maxHearts / 8) * 9);
  const my = meterY(p);
  if (p.c.cd) {
    const r = 1 - p.cd / p.c.cd;
    R(ctx, 'rgba(0,0,0,0.6)', 5, my, 30, 4);
    R(ctx, r >= 1 ? '#5fe07a' : '#7a8a9a', 6, my + 1, Math.round(28 * r), 2);
  }
  const bx = 105, bw = 110;
  R(ctx, 'rgba(0,0,0,0.6)', bx - 1, 5, bw + 2, 6);
  if (!g.boss) {
    const px = Math.round(bw * g.progress);
    R(ctx, '#f6c33b', bx, 6, px, 4);
    R(ctx, '#ffffff', bx + px - 1, 4, 2, 8);
    R(ctx, '#d3202f', bx + bw - 1, 3, 2, 10);
  } else {
    R(ctx, '#5fe07a', bx, 6, Math.round(bw * g.boss.progress), 4);
    for (let k = 1; k < g.boss.phases; k++) R(ctx, '#ffffff', bx + Math.round((bw * k) / g.boss.phases), 5, 1, 6);
  }
  ctx.drawImage(ICONS[g.level.collect], W - 50, 2);
}

const meterY = (p) => 15 + Math.floor((p.maxHearts + (p.armor > 0 ? 1 : 0) - 1) / 8) * 9;

function hudText(c, g) {
  const p = g.player, L = g.level;
  if (p.c.label) txt(c, p.c.label, 38, meterY(p) + 2, 8, p.cd <= 0 ? '#5fe07a' : '#aaaaaa', 'left');
  txt(c, `x${g.collected}`, W - 34, 9, 10, '#ffffff', 'left');
  txt(c, `${g.score}`, W - 6, 19, 10, '#ffffff', 'right');
  if (g.boss) txt(c, L.bossName, 160, 17, 8, '#ff9a9a');
  else txt(c, `${L.place.toUpperCase()}  ${Math.floor(g.distance / 10)}m`, 160, 17, 9, '#ffffff');

  // ability hints over gate obstacles
  if (blink(g, 5)) {
    for (const e of g.entities) {
      if (!e.hint || e.x > W - 4 || e.x + e.w < p.x - 4) continue;
      const hy = e.kind === 'pit' ? GROUND - 34 : Math.max(26, e.y - 6);
      txt(c, e.hint, Math.min(W - 30, Math.max(30, e.x + e.w / 2)), hy, 8, '#ffe14d');
    }
  }
  if (g.banner) {
    const b = g.banner;
    c.globalAlpha = Math.min(1, b.t * 2);
    if (b.sub) txt(c, b.sub, 160, 46, 12, '#ff5050');
    txt(c, b.text, 160, 60, b.small ? 16 : 22, b.small ? '#c8a0ff' : '#ffffff');
    if (b.tip) txt(c, b.tip, 160, 74, 11, '#ffe14d');
    c.globalAlpha = 1;
  }
}

// ---------- screens ----------
export function drawPixelUI(ctx, g) {
  switch (g.state) {
    case 'title': titlePixels(ctx, g); break;
    case 'code':
      titlePixels(ctx, g);
      R(ctx, 'rgba(0,0,0,0.55)', 0, 0, W, H);
      panel(ctx, 50, 46, 220, 86);
      R(ctx, '#000000', 70, 76, 180, 18);
      R(ctx, '#6a6a8a', 70, 76, 180, 1);
      R(ctx, '#6a6a8a', 70, 93, 180, 1);
      break;
    case 'intro': {
      hudPixels(ctx, g);
      panel(ctx, 36, 22, 248, 130);
      drawScaled(ctx, SPR[g.level.char].run[Math.floor(g.time * 6) % 2], 66, 104, 3);
      drawScaled(ctx, ICONS[g.level.collect], 256, 112, 2);
      break;
    }
    case 'play': case 'dead': hudPixels(ctx, g); break;
    case 'paused': hudPixels(ctx, g); panel(ctx, 90, 62, 140, 46); break;
    case 'gameover': hudPixels(ctx, g); panel(ctx, 50, 54, 220, 66, '#ff6b6b'); break;
    case 'complete': {
      panel(ctx, 16, 10, 288, 160);
      drawScaled(ctx, SPR[g.level.char].run[Math.floor(g.time * 6) % 2], 44, 66, 3);
      drawScaled(ctx, ICONS[g.level.collect], 276, 66, 2);
      break;
    }
    case 'victory': {
      panel(ctx, 20, 12, 280, 156);
      LEVELS.forEach((L, i) => {
        const img = SPR[L.char].run[Math.floor(g.time * 8 + i) % 2];
        drawScaled(ctx, img, 60 + i * 50, 104 + Math.round(Math.sin(g.time * 5 + i) * 3), 2);
      });
      break;
    }
  }
}

export function drawTextUI(c, g) {
  const L = g.level;
  switch (g.state) {
    case 'title': titleText(c, g); break;
    case 'code': {
      txt(c, 'CHARM CITY RUN', 160, 18, 34, '#f6c33b');
      txt(c, 'ENTER CODE', 160, 60, 16, '#ffffff');
      const cursor = !(g.codeMsg && g.codeMsg.ok) && blink(g, 3) ? '_' : ' ';
      txt(c, g.codeText + cursor, 160, 85, 16, '#5fe07a');
      if (g.codeMsg) txt(c, g.codeMsg.text, 160, 106, 10, g.codeMsg.ok ? '#5fe07a' : '#ff6b6b');
      txt(c, T('ENTER: SUBMIT    ESC: CANCEL', 'TAP HERE TO TYPE'), 160, 121, 8, '#bbbbbb');
      break;
    }
    case 'intro':
      hudText(c, g);
      txt(c, `LEVEL ${g.levelIndex + 1} OF ${LEVELS.length}`, 160, 34, 11, '#f6c33b');
      txt(c, L.name.toUpperCase(), 160, 48, 22, '#ffffff');
      txt(c, L.place.toUpperCase(), 160, 62, 11, '#9adfff');
      txt(c, `ABILITY: ${L.ability}`, 160, 80, 13, '#7fe0ff');
      L.tip.forEach((line, i) => txt(c, isTouch() ? line.replace(/press X or SHIFT/i, (m) => (m[0] === 'P' ? 'Tap' : 'tap') + ' the ability button') : line, 160, 94 + i * 10, 10, '#ffffff'));
      txt(c, `COLLECT ${L.collectName.toUpperCase()}`, 160, 128, 9, '#f6c33b');
      if (blink(g)) txt(c, T('PRESS SPACE TO START', 'TAP START'), 160, 142, 12, '#ffffff');
      break;
    case 'play': case 'dead': hudText(c, g); break;
    case 'paused':
      hudText(c, g);
      txt(c, 'PAUSED', 160, 78, 22, '#ffffff');
      if (!isTouch()) txt(c, 'P: RESUME    ESC: QUIT TO MENU', 160, 96, 9, '#dddddd');
      break;
    case 'gameover':
      hudText(c, g);
      txt(c, 'OUT OF HEARTS, HON!', 160, 70, 18, '#ff6b6b');
      txt(c, `SCORE ${g.score}`, 160, 86, 12, '#ffffff');
      if (!isTouch()) txt(c, 'SPACE: RETRY LEVEL    ESC: MENU', 160, 104, 9, '#dddddd');
      break;
    case 'complete': {
      txt(c, 'LEVEL CLEAR!', 160, 22, 22, '#f6c33b');
      txt(c, `${L.name.toUpperCase()} - ${L.place.toUpperCase()}`, 160, 36, 10, '#9adfff');
      txt(c, `SCORE ${g.finalScore}`, 160, 52, 16, '#ffffff');
      if (g.newBest) { if (blink(g, 4)) txt(c, 'NEW BEST!', 160, 64, 11, '#5fe07a'); }
      else txt(c, `BEST ${save.best(g.levelIndex)}`, 160, 64, 11, '#dddddd');
      txt(c, `${L.collectName.toUpperCase()}: ${g.collected}`, 160, 76, 9, '#f6c33b');
      txt(c, 'DID YOU KNOW?', 160, 92, 12, '#7fe0ff');
      wrap(c, g.fact, 268 * S, 11).slice(0, 5).forEach((line, i) => txt(c, line, 160, 105 + i * 10, 11, '#ffffff'));
      if (!isTouch() && g.stateT > 0.8 && blink(g)) {
        txt(c, g.levelIndex < LEVELS.length - 1 ? 'SPACE: NEXT LEVEL    ESC: MENU' : 'SPACE: FINISH', 160, 162, 10, '#ffffff');
      }
      break;
    }
    case 'victory':
      txt(c, 'YOU RAN ALL OF', 160, 30, 18, '#ffffff');
      txt(c, 'CHARM CITY, HON!', 160, 46, 24, '#f6c33b');
      txt(c, `TOTAL OF BEST SCORES: ${save.totalBest()}`, 160, 124, 11, '#9adfff');
      if (!isTouch() && blink(g)) txt(c, 'SPACE: BACK TO MENU', 160, 150, 11, '#ffffff');
      break;
  }
  if (isMuted()) txt(c, 'MUTED', W - 4, H - 6, 8, '#aaaaaa', 'right');
}
