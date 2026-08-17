// All tuning (speeds, litter stages/points, art) lives in config.js.
// This file just wires up state, input, collision, and rendering.

const { cols: COLS, rows: ROWS, cellSize: CELL } = CONFIG.grid;
const LITTER_STAGES = CONFIG.scoring.litterStages;

// ---- Canvas setup ------------------------------------------------------
const canvas = document.getElementById('board');
canvas.width = COLS * CELL;
canvas.height = ROWS * CELL;
const ctx = canvas.getContext('2d');
ctx.textAlign = 'center';
ctx.textBaseline = 'middle';

const ladyScoreEl = document.getElementById('ladyScore');
const catLengthEl = document.getElementById('catLength');
const finalScoreEl = document.getElementById('finalScore');
const litterLegendEl = document.getElementById('litterLegend');
const overlayEl = document.getElementById('overlay');
const overlayTitleEl = document.getElementById('overlayTitle');
const overlayMsgEl = document.getElementById('overlayMsg');
const restartBtn = document.getElementById('restartBtn');

// ---- Game state ----------------------------------------------------------
let cat, lady, food, litter, ladyScore, lastCatMove, lastLadyMove, lastLitterOutput, running;
const images = {};

function randCell() {
  return {
    x: Math.floor(Math.random() * COLS),
    y: Math.floor(Math.random() * ROWS),
  };
}

function cellsEqual(a, b) {
  return a.x === b.x && a.y === b.y;
}

function occupiedByCat(cell) {
  return cat.body.some(seg => cellsEqual(seg, cell));
}

function occupiedByLitter(cell) {
  return litter.some(l => cellsEqual(l, cell));
}

function spawnFood() {
  let cell;
  do {
    cell = randCell();
  } while (occupiedByCat(cell) || occupiedByLitter(cell) || cellsEqual(cell, lady.pos));
  food = cell;
}

function resetGame() {
  const startX = Math.floor(COLS / 2);
  const startY = Math.floor(ROWS / 2);

  cat = {
    body: [
      { x: startX, y: startY },
      { x: startX - 1, y: startY },
      { x: startX - 2, y: startY },
    ],
    dir: { x: 1, y: 0 },
    nextDir: { x: 1, y: 0 },
  };

  lady = {
    pos: { x: 3, y: 3 },
    dir: { x: 0, y: 0 },
    nextDir: { x: 0, y: 0 },
  };

  litter = [];
  ladyScore = 0;
  lastCatMove = 0;
  lastLadyMove = 0;
  lastLitterOutput = 0;
  running = true;

  spawnFood();
  updateHud();
  overlayEl.classList.add('hidden');
}

function updateHud() {
  const catLength = cat.body.length;
  ladyScoreEl.textContent = ladyScore;
  catLengthEl.textContent = catLength;
  finalScoreEl.textContent = ladyScore + catLength;
}

function buildLitterLegend() {
  litterLegendEl.innerHTML = '';
  LITTER_STAGES.forEach(stage => {
    const item = document.createElement('span');
    item.className = 'legend-item';

    const swatch = document.createElement('span');
    swatch.className = 'swatch';
    swatch.style.background = stage.color;

    const label = document.createElement('span');
    label.textContent = `${stage.name}: ${stage.points} pt${stage.points === 1 ? '' : 's'}`;

    item.appendChild(swatch);
    item.appendChild(label);
    litterLegendEl.appendChild(item);
  });
}

// ---- Input ----------------------------------------------------------
const ARROW_DIRS = {
  ArrowUp: { x: 0, y: -1 },
  ArrowDown: { x: 0, y: 1 },
  ArrowLeft: { x: -1, y: 0 },
  ArrowRight: { x: 1, y: 0 },
};

const WASD_DIRS = {
  w: { x: 0, y: -1 },
  s: { x: 0, y: 1 },
  a: { x: -1, y: 0 },
  d: { x: 1, y: 0 },
};

function isOpposite(a, b) {
  return a.x === -b.x && a.y === -b.y;
}

window.addEventListener('keydown', (e) => {
  const key = e.key;

  if (ARROW_DIRS[key]) {
    e.preventDefault();
    const d = ARROW_DIRS[key];
    // prevent the cat from reversing directly into itself
    if (!isOpposite(d, cat.dir)) cat.nextDir = d;
  } else if (WASD_DIRS[key.toLowerCase()]) {
    e.preventDefault();
    lady.nextDir = WASD_DIRS[key.toLowerCase()];
  } else if (key === ' ' || key === 'Enter') {
    if (!running) resetGame();
  }
});

restartBtn.addEventListener('click', resetGame);

// ---- Litter aging ----------------------------------------------------------
// A tile's *score* value steps down discretely at each stage's afterMs
// threshold. Its *display color* fades smoothly between stage anchors,
// so the point drop is foreshadowed by the color shifting green -> brown
// -> black before it actually lands.
function litterStageAt(tile, now) {
  const age = now - tile.spawnedAt;
  let current = LITTER_STAGES[0];
  for (const stage of LITTER_STAGES) {
    if (age >= stage.afterMs) current = stage;
  }
  return current;
}

function hexToRgb(hex) {
  const n = parseInt(hex.slice(1), 16);
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}

function lerp(a, b, t) {
  return a + (b - a) * t;
}

function litterColorAt(tile, now) {
  const age = now - tile.spawnedAt;
  let lo = LITTER_STAGES[0];
  let hi = LITTER_STAGES[LITTER_STAGES.length - 1];

  for (let i = 0; i < LITTER_STAGES.length - 1; i++) {
    if (age >= LITTER_STAGES[i].afterMs && age <= LITTER_STAGES[i + 1].afterMs) {
      lo = LITTER_STAGES[i];
      hi = LITTER_STAGES[i + 1];
      break;
    }
  }

  if (age >= hi.afterMs) return hi.color;

  const span = hi.afterMs - lo.afterMs || 1;
  const t = Math.min(1, Math.max(0, (age - lo.afterMs) / span));
  const c1 = hexToRgb(lo.color);
  const c2 = hexToRgb(hi.color);
  const r = Math.round(lerp(c1.r, c2.r, t));
  const g = Math.round(lerp(c1.g, c2.g, t));
  const b = Math.round(lerp(c1.b, c2.b, t));
  return `rgb(${r}, ${g}, ${b})`;
}

// ---- Update logic ----------------------------------------------------------
function moveCat() {
  cat.dir = cat.nextDir;
  const head = cat.body[0];
  const newHead = { x: head.x + cat.dir.x, y: head.y + cat.dir.y };

  // wall collision
  if (newHead.x < 0 || newHead.x >= COLS || newHead.y < 0 || newHead.y >= ROWS) {
    return gameOver('The Cat ran into a wall!');
  }

  // self collision
  if (occupiedByCat(newHead)) {
    return gameOver('The Cat tripped over its own tail!');
  }

  // litter collision — blocks movement, regardless of how stale it is
  if (occupiedByLitter(newHead)) {
    return gameOver('The Cat got stuck in its own mess!');
  }

  const ateFood = cellsEqual(newHead, food);

  cat.body.unshift(newHead);

  if (ateFood) {
    spawnFood(); // growing the Cat (not popping the tail) IS the reward
  } else {
    cat.body.pop();
  }

  updateHud();
}

function moveLady(timestamp) {
  lady.dir = lady.nextDir;
  if (lady.dir.x === 0 && lady.dir.y === 0) return;

  const newPos = { x: lady.pos.x + lady.dir.x, y: lady.pos.y + lady.dir.y };

  // stay in bounds — she just stops at the wall
  if (newPos.x < 0 || newPos.x >= COLS || newPos.y < 0 || newPos.y >= ROWS) {
    return;
  }

  lady.pos = newPos;

  // sweep up litter — bank whatever it's currently worth, permanently
  const idx = litter.findIndex(l => cellsEqual(l, lady.pos));
  if (idx !== -1) {
    const stage = litterStageAt(litter[idx], timestamp);
    ladyScore += stage.points;
    litter.splice(idx, 1);
    updateHud();
  }
}

function outputLitter(timestamp) {
  const tail = cat.body[cat.body.length - 1];
  if (!tail) return;
  if (occupiedByLitter(tail)) return; // don't stack duplicates
  if (cellsEqual(tail, food) || cellsEqual(tail, lady.pos)) return;

  litter.push({ x: tail.x, y: tail.y, spawnedAt: timestamp });
}

function gameOver(message) {
  running = false;
  const catLength = cat.body.length;
  overlayTitleEl.textContent = 'Game Over';
  overlayMsgEl.textContent =
    `${message} Cat-Lady banked ${ladyScore} pts, Cat reached length ${catLength} ` +
    `→ Final score ${ladyScore + catLength}.`;
  overlayEl.classList.remove('hidden');
}

// ---- Rendering ----------------------------------------------------------
function drawGlyph(cell, glyph, color) {
  ctx.fillStyle = color;
  ctx.font = `${CONFIG.font.weight} ${CELL * CONFIG.font.sizeRatio}px ${CONFIG.font.family}`;
  ctx.fillText(
    glyph,
    cell.x * CELL + CELL / 2,
    cell.y * CELL + CELL / 2 + 1 // small nudge to visually center most monospace glyphs
  );
}

function drawImageCell(img, cell, inset = 1) {
  ctx.drawImage(
    img,
    cell.x * CELL + inset,
    cell.y * CELL + inset,
    CELL - inset * 2,
    CELL - inset * 2
  );
}

function drawLitter(tile, timestamp) {
  ctx.fillStyle = litterColorAt(tile, timestamp);
  const cx = tile.x * CELL + CELL / 2;
  const cy = tile.y * CELL + CELL / 2;
  ctx.beginPath();
  ctx.ellipse(cx, cy, CELL * 0.38, CELL * 0.3, 0, 0, Math.PI * 2);
  ctx.fill();
}

function render(timestamp) {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // grid background
  ctx.fillStyle = '#241631';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  litter.forEach(l => drawLitter(l, timestamp));
  drawGlyph(food, CONFIG.art.food.glyph, CONFIG.art.food.color);
  cat.body.forEach(seg => drawImageCell(images.cat, seg));
  drawImageCell(images.lady, lady.pos);
}

// ---- Main loop ----------------------------------------------------------
// Cat movement, Cat-Lady movement, and litter output each run on their
// own independent clock (see CONFIG.speed), so any one of them can be
// tuned without affecting the others.
function loop(timestamp) {
  if (!lastCatMove) lastCatMove = timestamp;
  if (!lastLadyMove) lastLadyMove = timestamp;
  if (!lastLitterOutput) lastLitterOutput = timestamp;

  if (running) {
    if (timestamp - lastCatMove >= CONFIG.speed.catMoveMs) {
      lastCatMove = timestamp;
      moveCat();
    }
    if (running && timestamp - lastLadyMove >= CONFIG.speed.ladyMoveMs) {
      lastLadyMove = timestamp;
      moveLady(timestamp);
    }
    if (running && timestamp - lastLitterOutput >= CONFIG.speed.litterOutputMs) {
      lastLitterOutput = timestamp;
      outputLitter(timestamp);
    }
  }

  render(timestamp);
  requestAnimationFrame(loop);
}

// ---- Boot ----------------------------------------------------------
function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Failed to load image: ${src}`));
    img.src = src;
  });
}

buildLitterLegend();

Promise.all([
  loadImage(CONFIG.images.cat.src).then(img => (images.cat = img)),
  loadImage(CONFIG.images.lady.src).then(img => (images.lady = img)),
]).then(() => {
  resetGame();
  requestAnimationFrame(loop);
}).catch(err => {
  console.error(err);
  overlayTitleEl.textContent = 'Failed to load';
  overlayMsgEl.textContent = err.message;
  overlayEl.classList.remove('hidden');
});
