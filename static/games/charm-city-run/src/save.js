// Progress + high scores in localStorage (fails soft when storage is unavailable).
const KEY = 'charm-city-run-v1';
const N = 5;
let data = { unlocked: 1, best: new Array(N).fill(0) };

try {
  const raw = localStorage.getItem(KEY);
  if (raw) {
    const d = JSON.parse(raw);
    if (d && typeof d.unlocked === 'number') {
      data.unlocked = Math.min(N, Math.max(1, d.unlocked | 0));
      if (Array.isArray(d.best)) data.best = data.best.map((_, i) => +d.best[i] || 0);
    }
  }
} catch { /* ignore */ }

function persist() {
  try { localStorage.setItem(KEY, JSON.stringify(data)); } catch { /* ignore */ }
}

export const save = {
  get unlocked() { return data.unlocked; },
  best(i) { return data.best[i] || 0; },
  totalBest() { return data.best.reduce((a, b) => a + b, 0); },
  unlockAll() { data.unlocked = N; persist(); },
  // returns true when this is a new best
  recordLevel(i, score) {
    let newBest = false;
    if (score > data.best[i]) { data.best[i] = score; newBest = true; }
    data.unlocked = Math.min(N, Math.max(data.unlocked, i + 2));
    persist();
    return newBest;
  },
};
