// Keyboard (+ simple tap) input with per-step "pressed" edges.
const MAP = {
  Space: 'jump', ArrowUp: 'jump', KeyW: 'jump',
  ArrowDown: 'duck', KeyS: 'duck',
  ShiftLeft: 'ability', ShiftRight: 'ability', KeyX: 'ability', KeyK: 'ability',
  ArrowLeft: 'left', KeyA: 'left',
  ArrowRight: 'right', KeyD: 'right',
  Enter: 'confirm', NumpadEnter: 'confirm',
  Escape: 'back',
  KeyP: 'pause',
  KeyM: 'mute',
  KeyC: 'code',
};

const codesDown = new Set();
const pressed = new Set();
const firstCbs = [];
let pointerDown = false;
let textHandler = null; // when set, keystrokes go to text entry instead of game actions
const virtualDown = new Set(); // actions held via on-screen touch buttons
let tapPos = null; // last canvas tap/click, in game pixels

export function onFirstInput(fn) { firstCbs.push(fn); }
function fireFirst() { while (firstCbs.length) firstCbs.shift()(); }

addEventListener('keydown', (e) => {
  fireFirst();
  // the hidden mobile code field types its own letters; only forward Enter from it
  if (e.target && e.target.id === 'code-input') {
    if (e.key === 'Enter') { e.preventDefault(); textHandler?.('Enter'); }
    return;
  }
  if (textHandler) {
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    e.preventDefault();
    if (!e.repeat || e.key === 'Backspace') textHandler(e.key);
    return;
  }
  const a = MAP[e.code];
  if (!a) return;
  e.preventDefault();
  if (!e.repeat) pressed.add(a);
  codesDown.add(e.code);
});
addEventListener('keyup', (e) => { codesDown.delete(e.code); });
addEventListener('blur', () => { codesDown.clear(); pointerDown = false; });

export function bindPointer(el, gameW, gameH) {
  el.addEventListener('pointerdown', (e) => {
    fireFirst();
    e.preventDefault();
    const r = el.getBoundingClientRect();
    tapPos = { x: ((e.clientX - r.left) / r.width) * gameW, y: ((e.clientY - r.top) / r.height) * gameH };
    pointerDown = true;
    pressed.add('jump');
    pressed.add('tap');
  });
  addEventListener('pointerup', () => { pointerDown = false; });
  addEventListener('pointercancel', () => { pointerDown = false; });
}

// On-screen touch buttons
export function virtualPress(a) { fireFirst(); pressed.add(a); virtualDown.add(a); }
export function virtualRelease(a) { virtualDown.delete(a); }

export const input = {
  get tapPos() { return tapPos; },
  // Route raw keys (e.key) to fn until stopText() is called.
  startText(fn) { textHandler = fn; codesDown.clear(); pressed.clear(); },
  stopText() { textHandler = null; },
  down(a) {
    if (virtualDown.has(a)) return true;
    if (a === 'jump' && pointerDown) return true;
    for (const c of codesDown) if (MAP[c] === a) return true;
    return false;
  },
  pressed(a) { return pressed.has(a); },
  endStep() { pressed.clear(); },
};
