// On-screen touch controls for phones/tablets. The button set changes with the game state
// (menu buttons on menus; DUCK / ability / JUMP while playing). Hidden on desktop.
import { virtualPress, virtualRelease } from './input.js';
import { unlockAudio } from './audio.js';

let touchMode = matchMedia('(pointer: coarse)').matches;
export const isTouch = () => touchMode;

const root = document.getElementById('touch');
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
}
if (touchMode) enable();
addEventListener('touchstart', () => { if (!touchMode) enable(); }, { passive: true });
addEventListener('touchend', unlockAudio, { passive: true });
addEventListener('click', unlockAudio);

// [action, label, size]   size: 'big' | 'small' | undefined
function layoutFor(g) {
  switch (g.state) {
    case 'title': return { left: [['left', '◀'], ['right', '▶']], mid: [['mute', 'SOUND', 'small'], ['code', 'CODE', 'small']], right: [['confirm', 'PLAY', 'big']] };
    case 'code': return { left: [['back', 'CANCEL']], right: [['confirm', 'OK', 'big']] };
    case 'intro': return { left: [['back', 'MENU', 'small']], right: [['confirm', 'START', 'big']] };
    case 'play': {
      const label = g.player.c.label || (g.player.c.ability === 'double' ? '2X JUMP' : 'GLIDE');
      return { left: [['duck', 'DUCK', 'big']], mid: [['pause', 'PAUSE', 'small']], right: [['ability', label], ['jump', 'JUMP', 'big']] };
    }
    case 'paused': return { left: [['back', 'QUIT']], mid: [['mute', 'SOUND', 'small']], right: [['pause', 'RESUME', 'big']] };
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
