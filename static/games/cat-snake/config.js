// ---------------------------------------------------------------------
// Single source of truth for game tuning: grid size, movement speeds,
// litter fade/scoring, and the art used to render every entity. Edit
// this file to reskin or rebalance the game without touching game.js.
// ---------------------------------------------------------------------
const CONFIG = {
  grid: {
    cols: 30,
    rows: 30,
    cellSize: 20, // px per cell; canvas size is derived from this
  },

  // Lower ms = faster. Each entity/system ticks on its own independent
  // clock, so e.g. the Cat-Lady can be sped up without touching the
  // Cat or the litter rate.
  speed: {
    catMoveMs: 300,      // how often the Cat advances one cell
    ladyMoveMs: 150,     // how often the Cat-Lady advances one cell
    litterOutputMs: 650, // how often the Cat drops a new litter tile
  },

  scoring: {
    // A litter tile ages through these stages, in order. Sweeping a
    // tile banks whatever "points" its *current* stage is worth into
    // the Cat-Lady's permanent score — that banked total never decays.
    // Only an unswept tile's own potential value drops as it ages
    // (visualized as its color fading toward the next stage's color).
    // This same list drives the legend shown on the page, so add,
    // remove, retime, recolor, or repoint stages freely here.
    litterStages: [
      { name: 'Fresh',   afterMs: 0,    points: 5, color: '#43a047' }, // green
      { name: 'Aging',   afterMs: 3000, points: 2, color: '#8d5a2b' }, // brown
      { name: 'Expired', afterMs: 7000, points: 0, color: '#1c1c1c' }, // black
    ],
  },

  // Small character images, drawn at cell size. Any same-origin image
  // path works (SVG or raster).
  images: {
    cat: { src: 'assets/cat.svg' },
    lady: { src: 'assets/lady.svg' },
  },

  // Food is still drawn as an ASCII glyph.
  art: {
    food: {
      glyph: '*',
      color: '#ffe066',
    },
  },

  font: {
    family: "'Courier New', Courier, monospace",
    weight: '700',
    sizeRatio: 0.8, // glyph font-size as a fraction of cellSize
  },
};
