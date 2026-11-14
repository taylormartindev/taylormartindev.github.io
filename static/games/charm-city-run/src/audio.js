// WebAudio chiptune: SFX + a tiny step sequencer with one original theme per character.
let ctx = null, master, musicBus, sfxBus, noiseBuf;
let muted = false;
try { muted = localStorage.getItem('ccr-muted') === '1'; } catch { /* ignore */ }
let pending = null;
const VOL = 0.55;

export function initAudio() {
  if (ctx) return;
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return;
  try {
    ctx = new AC();
  } catch { ctx = null; return; }
  master = ctx.createGain();
  master.gain.value = muted ? 0 : VOL;
  master.connect(ctx.destination);
  musicBus = ctx.createGain();
  musicBus.gain.value = 0.32;
  musicBus.connect(master);
  sfxBus = ctx.createGain();
  sfxBus.gain.value = 0.6;
  sfxBus.connect(master);
  noiseBuf = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
  const d = noiseBuf.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  if (pending) { const p = pending; pending = null; playMusic(...p); }
}

let held = false; // suspended on purpose (game paused)
export function suspendAudio() { held = true; if (ctx && ctx.state === 'running') ctx.suspend(); }
export function resumeAudio() { held = false; if (ctx && ctx.state === 'suspended') ctx.resume(); }
// Mobile browsers (iOS especially) only start audio inside a tap; call from touch/click handlers.
export function unlockAudio() {
  if (!ctx) initAudio();
  else if (ctx.state === 'suspended' && !held) ctx.resume();
}
export function toggleMute() {
  muted = !muted;
  if (master) master.gain.value = muted ? 0 : VOL;
  try { localStorage.setItem('ccr-muted', muted ? '1' : '0'); } catch { /* ignore */ }
}
export const isMuted = () => muted;

// ---------- synthesis ----------
const NOTE = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
function midi(s) {
  const m = /^([A-G])(#|b)?(-?\d)$/.exec(s);
  if (!m) return 60;
  return NOTE[m[1]] + (m[2] === '#' ? 1 : m[2] === 'b' ? -1 : 0) + 12 * (+m[3] + 1);
}
const freq = (m) => 440 * Math.pow(2, (m - 69) / 12);

function tone(t, f, dur, type = 'square', vol = 0.2, dest = sfxBus, f2 = null) {
  const o = ctx.createOscillator();
  const g = ctx.createGain();
  o.type = type;
  o.frequency.setValueAtTime(f, t);
  if (f2) o.frequency.exponentialRampToValueAtTime(f2, t + dur);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(vol, t + 0.008);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g).connect(dest);
  o.start(t);
  o.stop(t + dur + 0.03);
}

function noise(t, dur, vol = 0.2, f = 2000, ftype = 'highpass', dest = sfxBus) {
  const s = ctx.createBufferSource();
  s.buffer = noiseBuf;
  const filt = ctx.createBiquadFilter();
  filt.type = ftype;
  filt.frequency.value = f;
  const g = ctx.createGain();
  g.gain.setValueAtTime(vol, t);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  s.connect(filt).connect(g).connect(dest);
  s.start(t);
  s.stop(t + dur + 0.02);
}

// ---------- songs (all original) ----------
// Tokens: note (C5, F#4, Bb3), chord (A3+C4+F4), '.' rest, '-' hold previous, '|' bar marker (ignored)
const SONGS = {
  title: {
    bpm: 112, spb: 2,
    tracks: [
      { wave: 'square', vol: 0.12, notes: 'C5 E5 G5 - E5 G5 C6 - | B5 A5 G5 E5 F5 - D5 - | C5 E5 G5 - A5 G5 E5 - | D5 E5 C5 - - - . .' },
      { wave: 'triangle', vol: 0.28, notes: 'C3 . G2 . C3 . G2 . | F2 . C3 . G2 . D3 . | C3 . G2 . F2 . C3 . | G2 . G2 . C3 . . .' },
    ],
    drums: 'k h s h k h s h',
  },
  // Crab: bouncy calypso / sea-shanty with sideways syncopation
  crab: {
    bpm: 118, spb: 4,
    tracks: [
      { wave: 'square', vol: 0.11, notes: 'E5 . G5 . . C6 . . A5 . G5 . E5 . . . | F5 . A5 . . D6 . . C6 . A5 . G5 . . . | E5 . G5 . . C6 . . E6 . D6 . C6 . A5 . | G5 . . E5 . . D5 . C5 - - - . . . .' },
      { wave: 'triangle', vol: 0.3, notes: 'C3 . . C3 . . G2 . C3 . . C3 . . G2 . | F2 . . F2 . . C3 . G2 . . G2 . . D3 . | C3 . . C3 . . G2 . A2 . . A2 . . E3 . | G2 . . G2 . . B2 . C3 . . G2 . C3 . .' },
      { wave: 'triangle', vol: 0.07, legato: 0.3, notes: '. . E5+G5 . . . E5+G5 . . . E5+G5 . . . E5+G5 . | . . F5+A5 . . . F5+A5 . . . D5+G5 . . . D5+G5 . | . . E5+G5 . . . E5+G5 . . . E5+A5 . . . E5+A5 . | . . D5+G5 . . . D5+F5 . . . E5+G5 . . . E5+G5 .' },
    ],
    drums: 'k . h k s . h . k . h k s . h h',
  },
  // Utz girl: upbeat, quick pop march
  utz: {
    bpm: 144, spb: 2,
    tracks: [
      { wave: 'square', vol: 0.11, notes: 'G4 B4 D5 G5 - D5 B4 D5 | E5 C5 E5 G5 F#5 - D5 . | G4 B4 D5 G5 - B5 A5 G5 | F#5 A5 D5 F#5 G5 - . .' },
      { wave: 'triangle', vol: 0.3, notes: 'G2 . D3 . G2 . D3 . | C3 . G2 . D3 . A2 . | G2 . D3 . E3 . B2 . | D3 . A2 . G2 . D3 .' },
    ],
    drums: 'k h s h k k s h',
  },
  // Natty Boh guy: oom-pah beer-hall polka
  boh: {
    bpm: 128, spb: 2,
    tracks: [
      { wave: 'square', vol: 0.11, notes: 'C5 A4 C5 F5 | E5 - D5 . | D5 Bb4 D5 G5 | F5 - E5 . | C5 A4 C5 F5 | A5 - G5 F5 | E5 G5 C5 E5 | F5 - . .' },
      { wave: 'triangle', vol: 0.34, notes: 'F2 . C3 . | F2 . C3 . | G2 . D3 . | C3 . G2 . | F2 . C3 . | F2 . A2 . | C3 . G2 . | F2 . C3 .' },
      { wave: 'square', vol: 0.045, legato: 0.4, notes: '. A3+C4+F4 . A3+C4+F4 | . A3+C4+F4 . A3+C4+F4 | . Bb3+D4+G4 . Bb3+D4+G4 | . Bb3+C4+E4 . Bb3+C4+E4 | . A3+C4+F4 . A3+C4+F4 | . A3+C4+F4 . A3+C4+F4 | . Bb3+C4+E4 . Bb3+C4+E4 | . A3+C4+F4 . A3+C4+F4' },
    ],
    drums: 'k s k s',
  },
  // Oriole: ballpark-organ riff
  oriole: {
    bpm: 132, spb: 2,
    tracks: [
      { wave: 'square', vol: 0.08, notes: 'C5 E5 G5 C6 - . A5 G5 | F5 A5 C6 - A5 . G5 . | E5 G5 C6 E6 - D6 C6 A5 | G5 B5 D6 - C6 - . .' },
      { wave: 'sine', vol: 0.16, notes: 'C5 E5 G5 C6 - . A5 G5 | F5 A5 C6 - A5 . G5 . | E5 G5 C6 E6 - D6 C6 A5 | G5 B5 D6 - C6 - . .' },
      { wave: 'triangle', vol: 0.3, notes: 'C3 . E3 . G3 . E3 . | F2 . A2 . C3 . A2 . | C3 . E3 . A2 . C3 . | G2 . B2 . C3 . G2 .' },
    ],
    drums: 'k h s h k h s k',
  },
  // Raven: minor-key gothic waltz
  raven: {
    bpm: 100, spb: 2,
    tracks: [
      { wave: 'triangle', vol: 0.26, legato: 0.95, notes: 'A4 - C5 - E5 - | D5 - C5 - B4 - | C5 - A4 - E4 - | G#4 - - - . . | A4 - C5 - E5 - | F5 - E5 - D5 - | C5 - B4 - G#4 - | A4 - - - . .' },
      { wave: 'square', vol: 0.05, legato: 0.95, notes: 'A5 - C6 - E6 - | D6 - C6 - B5 - | C6 - A5 - E5 - | G#5 - - - . . | A5 - C6 - E6 - | F6 - E6 - D6 - | C6 - B5 - G#5 - | A5 - - - . .' },
      { wave: 'triangle', vol: 0.3, notes: 'A2 . E3 . E3 . | D3 . A3 . A3 . | A2 . E3 . E3 . | E2 . B2 . B2 . | A2 . E3 . E3 . | D3 . A3 . A3 . | E2 . B2 . G#3 . | A2 . E3 . A2 .' },
    ],
    drums: 'k . h . h .',
  },
};

function tokens(str) { return str.trim().split(/\s+/).filter((t) => t !== '|'); }

function compile(song) {
  return {
    ...song,
    tracks: song.tracks.map((tr) => {
      const toks = tokens(tr.notes);
      const by = [];
      let last = null;
      toks.forEach((tk, i) => {
        if (tk === '-') { if (last) last.len++; return; }
        last = null;
        if (tk === '.') return;
        last = { notes: tk.split('+').map(midi), len: 1 };
        (by[i] || (by[i] = [])).push(last);
      });
      return { ...tr, len: toks.length, by };
    }),
    drums: tokens(song.drums),
  };
}

let cur = null, step = 0, nextT = 0, timer = null, stepDur = 0, bossMode = false;

export function playMusic(name, boss = false) {
  if (!ctx) { pending = [name, boss]; return; }
  stopMusic();
  const s = SONGS[name];
  if (!s) return;
  cur = compile(s);
  bossMode = boss;
  stepDur = 60 / (s.bpm * (boss ? 1.2 : 1)) / s.spb;
  step = 0;
  nextT = ctx.currentTime + 0.08;
  timer = setInterval(schedule, 25);
  schedule();
}

export function stopMusic() {
  if (timer) clearInterval(timer);
  timer = null;
  cur = null;
  pending = null;
}

function schedule() {
  if (!cur || !ctx || ctx.state !== 'running') return;
  if (nextT < ctx.currentTime - 0.25) nextT = ctx.currentTime + 0.05;
  while (nextT < ctx.currentTime + 0.15) {
    playStep(step, nextT);
    step++;
    nextT += stepDur;
  }
}

function playStep(i, t) {
  for (const tr of cur.tracks) {
    const evs = tr.by[i % tr.len];
    if (!evs) continue;
    for (const ev of evs) {
      for (const n of ev.notes) {
        tone(t, freq(n), Math.max(0.05, ev.len * stepDur * (tr.legato || 0.85)), tr.wave, tr.vol, musicBus);
      }
    }
  }
  const d = cur.drums;
  const k = d[i % d.length];
  drum(k, t);
  if (bossMode && k === '.') drum('h', t);
}

function drum(k, t) {
  if (k === 'k') tone(t, 150, 0.14, 'sine', 0.5, musicBus, 40);
  else if (k === 's') noise(t, 0.12, 0.22, 1800, 'highpass', musicBus);
  else if (k === 'h') noise(t, 0.035, 0.08, 7000, 'highpass', musicBus);
}

// ---------- sound effects ----------
const S = (fn) => (...a) => { if (ctx && ctx.state === 'running') fn(ctx.currentTime, ...a); };

export const sfx = {
  jump: S((t) => tone(t, 320, 0.14, 'square', 0.16, sfxBus, 640)),
  double: S((t) => { tone(t, 520, 0.12, 'square', 0.15, sfxBus, 1040); tone(t + 0.05, 780, 0.1, 'triangle', 0.15, sfxBus, 1300); }),
  collect: S((t) => { tone(t, 988, 0.07, 'square', 0.12); tone(t + 0.06, 1319, 0.12, 'square', 0.12); }),
  hurt: S((t) => { tone(t, 220, 0.3, 'sawtooth', 0.22, sfxBus, 55); noise(t, 0.18, 0.25, 800, 'lowpass'); }),
  armor: S((t) => { tone(t, 1200, 0.15, 'triangle', 0.25, sfxBus, 600); tone(t + 0.05, 1800, 0.2, 'triangle', 0.15); }),
  dash: S((t) => { noise(t, 0.25, 0.3, 1200, 'bandpass'); tone(t, 180, 0.2, 'square', 0.1, sfxBus, 720); }),
  slide: S((t) => noise(t, 0.35, 0.22, 2500, 'highpass')),
  swing: S((t) => noise(t, 0.12, 0.18, 900, 'bandpass')),
  twirl: S((t) => { tone(t, 260, 0.55, 'triangle', 0.18, sfxBus, 900); for (let i = 0; i < 6; i++) noise(t + i * 0.09, 0.05, 0.12, 1400, 'bandpass'); }),
  pop: S((t) => { tone(t, 900, 0.08, 'sine', 0.25, sfxBus, 1800); noise(t, 0.06, 0.15, 3000, 'highpass'); }),
  glide: S((t) => noise(t, 0.08, 0.08, 1500, 'bandpass')),
  bounce: S((t) => tone(t, 200, 0.25, 'square', 0.18, sfxBus, 700)),
  cannon: S((t) => { noise(t, 0.25, 0.4, 400, 'lowpass'); tone(t, 90, 0.2, 'sine', 0.4, sfxBus, 40); }),
  pitch: S((t) => { noise(t, 0.08, 0.2, 3000, 'bandpass'); tone(t, 600, 0.08, 'square', 0.08, sfxBus, 200); }),
  bossHit: S((t) => { tone(t, 300, 0.15, 'square', 0.22, sfxBus, 150); noise(t, 0.2, 0.3, 500, 'lowpass'); }),
  bossAppear: S((t) => { [196, 185, 175].forEach((f, i) => tone(t + i * 0.15, f, 0.25, 'sawtooth', 0.18)); }),
  phase: S((t) => { tone(t, 440, 0.1, 'square', 0.14); tone(t + 0.1, 660, 0.15, 'square', 0.14); }),
  win: S((t) => { [523, 659, 784, 1047].forEach((f, i) => tone(t + i * 0.1, f, 0.2, 'square', 0.15)); }),
  levelClear: S((t) => {
    [523, 659, 784, 659, 784, 1047].forEach((f, i) => tone(t + i * 0.12, f, 0.22, 'square', 0.14));
    [131, 196, 262].forEach((f, i) => tone(t + i * 0.24, f, 0.3, 'triangle', 0.25));
  }),
  gameOver: S((t) => { [392, 370, 349, 330].forEach((f, i) => tone(t + i * 0.2, f, 0.3, 'square', 0.15)); }),
  select: S((t) => tone(t, 660, 0.06, 'square', 0.12)),
  buzz: S((t) => tone(t, 110, 0.15, 'square', 0.15)),
};
