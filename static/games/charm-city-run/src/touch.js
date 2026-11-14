// On-screen touch controls for phones/tablets, plus the page layout (portrait / landscape /
// forced landscape). The button set changes with the game state. Hidden on desktop.
import { virtualPress, virtualRelease } from './input.js';
import { unlockAudio } from './audio.js';

let touchMode = matchMedia('(pointer: coarse)').matches;
export const isTouch = () => touchMode;

const root = document.getElementById('touch');
const app = document.getElementById('app');
const stage = document.getElementById('stage');
const toast = document.getElementById('toast');
const inIframe = (() => { try { return window.self !== window.top; } catch { return true; } })();
let forced = false;  // player asked for full screen landscape
let fsActive = false; // real browser fullscreen is on
const codeInput = document.getElementById('code-input');
const groups = {
  left: root.querySelector('.left'),
  mid: root.querySelector('.mid'),
  right: root.querySelector('.right'),
};

function enable() {
  touchMode = true;
  root.classList.add('on');
  document.body.classList.add('touch');
  layout();
}

// ---------- layout ----------
// Sizes #app to the viewport. In forced landscape on a phone held upright (e.g. iPhone, where
// web pages can't lock orientation), #app is rotated 90 degrees to fill the screen sideways.
export function layout() {
  const vw = window.innerWidth, vh = window.innerHeight;
  const rotate = touchMode && forced && vh > vw;
  const AW = rotate ? vh : vw, AH = rotate ? vw : vh;
  const land = AW >= AH;
  const cl = document.body.classList;
  cl.toggle('rot', rotate);
  cl.toggle('land', touchMode && land);
  cl.toggle('port', touchMode && !land);
  app.style.width = AW + 'px';
  app.style.height = AH + 'px';
  app.style.transform = rotate ? `translateX(${vw}px) rotate(90deg)` : '';
  const sw = Math.floor(touchMode && !land ? AW : Math.min(AW, (AH * 16) / 9));
  stage.style.width = sw + 'px';
  stage.style.height = Math.floor((sw * 9) / 16) + 'px';
}
addEventListener('resize', layout);
addEventListener('orientationchange', () => setTimeout(layout, 150));
const fsElement = () => document.fullscreenElement || document.webkitFullscreenElement;
for (const ev of ['fullscreenchange', 'webkitfullscreenchange']) {
  document.addEventListener(ev, () => {
    if (!fsElement() && fsActive) { fsActive = false; forced = false; } // left fullscreen (e.g. back gesture)
    lastKey = '';
    layout();
  });
}

// Screen point -> game pixels (accounts for the forced-landscape rotation).
export function clientToGame(cx, cy, gw, gh) {
  let u = cx, v = cy;
  if (document.body.classList.contains('rot')) { u = cy; v = window.innerWidth - cx; }
  return {
    x: ((u - stage.offsetLeft) / stage.offsetWidth) * gw,
    y: ((v - stage.offsetTop) / stage.offsetHeight) * gh,
  };
}

let toastT = 0;
function showToast(msg) {
  toast.textContent = msg;
  toast.classList.add('show');
  clearTimeout(toastT);
  toastT = setTimeout(() => toast.classList.remove('show'), 3500);
}

// Full screen + landscape. Must run inside a tap (click) handler.
export async function toggleLandscape() {
  if (forced) {
    forced = false;
    try { screen.orientation?.unlock?.(); } catch { /* ignore */ }
    if (fsElement()) (document.exitFullscreen || document.webkitExitFullscreen)?.call(document)?.catch?.(() => {});
    fsActive = false;
    lastKey = '';
    layout();
    return;
  }
  const el = document.documentElement;
  const req = el.requestFullscreen || el.webkitRequestFullscreen;
  if (req) {
    try { await req.call(el, { navigationUI: 'hide' }); } catch { /* not allowed here */ }
  }
  fsActive = !!fsElement();
  if (!fsActive && inIframe) {
    // can't take over the screen from inside the post's embed on this browser
    showToast('For full screen, tap "Open in a new tab" below the game.');
    return;
  }
  forced = true;
  if (fsActive) { try { await screen.orientation?.lock?.('landscape'); } catch { /* CSS rotation covers it */ } }
  lastKey = '';
  layout();
}
if (touchMode) enable();
addEventListener('touchstart', () => { if (!touchMode) enable(); }, { passive: true });
addEventListener('touchend', unlockAudio, { passive: true });
addEventListener('click', unlockAudio);

// [action, label, size]   size: 'big' | 'small' | undefined
function layoutFor(g) {
  switch (g.state) {
    case 'title': return { left: [['left', '◀'], ['right', '▶']], mid: [['fullscreen', forced ? 'EXIT FULL' : 'FULL SCREEN', 'small'], ['mute', 'SOUND', 'small'], ['code', 'CODE', 'small']], right: [['confirm', 'PLAY', 'big']] };
    case 'code': return { left: [['back', 'CANCEL']], right: [['confirm', 'OK', 'big']] };
    case 'intro': return { left: [['back', 'MENU', 'small']], right: [['confirm', 'START', 'big']] };
    case 'play': {
      const label = g.player.c.label || (g.player.c.ability === 'double' ? '2X JUMP' : 'GLIDE');
      return { left: [['duck', 'DUCK', 'big']], mid: [['pause', 'PAUSE', 'small']], right: [['ability', label], ['jump', 'JUMP', 'big']] };
    }
    case 'paused': return { left: [['back', 'QUIT']], mid: [['fullscreen', forced ? 'EXIT FULL' : 'FULL SCREEN', 'small'], ['mute', 'SOUND', 'small']], right: [['pause', 'RESUME', 'big']] };
    case 'gameover': return { left: [['back', 'MENU']], right: [['confirm', 'RETRY', 'big']] };
    case 'complete': return { left: [['back', 'MENU']], right: [['confirm', g.levelIndex < 4 ? 'NEXT' : 'FINISH', 'big']] };
    case 'victory': return { right: [['confirm', 'MENU', 'big']] };
    default: return {};
  }
}

function makeButton([action, label, size]) {
  const b = document.createElement('button');
  b.type = 'button';
  b.textContent = label;
  b.className = 'tbtn' + (size ? ' ' + size : '');
  b.dataset.action = action;
  if (action === 'fullscreen') {
    // not a game input: fullscreen/orientation APIs need a real tap (click) to work
    b.addEventListener('click', () => { unlockAudio(); toggleLandscape(); });
    b.addEventListener('pointerdown', () => b.classList.add('down'));
    for (const ev of ['pointerup', 'pointercancel', 'lostpointercapture']) b.addEventListener(ev, () => b.classList.remove('down'));
    return b;
  }
  const release = () => { if (b.classList.contains('down')) { b.classList.remove('down'); virtualRelease(action); } };
  b.addEventListener('pointerdown', (e) => {
    e.preventDefault();
    try { b.setPointerCapture(e.pointerId); } catch { /* ignore */ }
    b.classList.add('down');
    virtualPress(action);
    unlockAudio();
  });
  b.addEventListener('pointerup', release);
  b.addEventListener('pointercancel', release);
  b.addEventListener('lostpointercapture', release);
  b.addEventListener('contextmenu', (e) => e.preventDefault());
  // the on-screen keyboard only opens from a click/tap handler
  if (action === 'code') b.addEventListener('click', () => focusCodeInput());
  return b;
}

let lastKey = '';
export function updateTouch(g) {
  if (!touchMode) return;
  const L = layoutFor(g);
  const key = g.state + '|' + JSON.stringify(L);
  if (key === lastKey) return;
  lastKey = key;
  for (const name of Object.keys(groups)) {
    // release anything held when the layout swaps (e.g. jump held as the level ends)
    for (const b of groups[name].querySelectorAll('.tbtn.down')) virtualRelease(b.dataset.action);
    groups[name].replaceChildren(...(L[name] || []).map(makeButton));
  }
  if (g.state !== 'code' && document.activeElement === codeInput) codeInput.blur();
}

// ---------- code entry on phones: a hidden text field drives the on-screen keyboard ----------
let codeCb = null;
export function onCodeInput(fn) { codeCb = fn; }
export function focusCodeInput(clear = true) {
  if (clear) codeInput.value = '';
  codeInput.focus();
}
export function clearCodeInput() { codeInput.value = ''; }
codeInput.addEventListener('input', () => {
  const v = codeInput.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 16);
  codeInput.value = v;
  codeCb?.(v);
});

layout();
