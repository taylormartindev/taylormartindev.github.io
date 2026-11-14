import { GAME, LEVEL_TUNING } from './config.js';

// Level data. Difficulty rises every level: base/max speed, spawn gaps, gate frequency,
// combos, length and boss phases. Each level's "gates" can only be passed with that
// character's ability.
//
// Scroll speed and level length are set in config.js (LEVEL_TUNING).
//
// obstacles: [type, weight, opts]   combos: [[type, dx, opts], ...]
export const LEVELS = [
  {
    id: 'crab', char: 'crab', name: 'Blue Crab', short: 'BLUE CRAB', place: 'Inner Harbor',
    ability: 'SCUTTLE DASH',
    tip: ['Press X or SHIFT to dash forward.', 'Dashing makes you invincible:', 'blast through traps and gull swarms!'],
    collect: 'oldbay', collectName: 'Old Bay tins',
    gap: [0.95, 1.7], gate: [0.12, 0.3], combo: [0, 0],
    obstacles: [['crabpot', 3], ['gull', 2, { alt: 4 }], ['gull', 1, { alt: 26 }], ['splash', 2], ['wake', 2]],
    gates: ['potTrap', 'gullSwarm'],
    combos: [],
    boss: 'steamer', bossName: 'THE STEAMER POT', bossTip: 'DASH TO KNOCK THE POT BACK!', bossPhases: 1, winText: 'ESCAPED THE POT!',
  },
  {
    id: 'utz', char: 'utz', name: 'Utz Girl', short: 'UTZ GIRL', place: 'Fells Point',
    ability: 'SLIDE',
    tip: ['Press X or SHIFT to slide.', 'Scaffolding hangs too low to duck:', 'slide right under it!'],
    collect: 'chips', collectName: 'bags of chips',
    gap: [0.85, 1.5], gate: [0.15, 0.36], combo: [0.04, 0.12],
    obstacles: [['dirtbike', 2], ['cart', 2], ['puddle', 2], ['pigeon', 2, { alt: 10 }]],
    gates: ['awning'],
    combos: [[['puddle', 0], ['dirtbike', 140]], [['pigeon', 0, { alt: 10 }], ['puddle', 110]]],
    boss: 'truck', bossName: 'RUNAWAY CHIP TRUCK', bossTip: 'SLIDE TO CATCH UP!', bossPhases: 2, winText: 'CAUGHT THE TRUCK!',
  },
  {
    id: 'boh', char: 'boh', name: 'Natty Boh Guy', short: 'NATTY BOH', place: 'Brewers Hill',
    ability: 'MUSTACHE TWIRL',
    tip: ['Jump, then press X or SHIFT to twirl', 'your mustache and fly higher.', 'Twirl over tall keg towers!'],
    collect: 'cap', collectName: 'bottle caps', collectAlt: [8, 90],
    gap: [0.8, 1.4], gate: [0.17, 0.38], combo: [0.08, 0.2],
    obstacles: [['keg', 3], ['forklift', 2], ['pothole', 2], ['stoop', 2], ['pigeon', 1, { alt: 12 }]],
    gates: ['kegTower', 'crateStack'],
    combos: [[['keg', 0], ['keg', 26]], [['stoop', 0], ['keg', 110]], [['pothole', 0], ['pigeon', 120, { alt: 12 }]]],
    boss: 'kegs', bossName: 'THE KEG CANNON', bossTip: 'TWIRL UP AND POP THE FOAM!', bossPhases: 2, winText: 'KEG CANNON KAPUT!',
  },
  {
    id: 'oriole', char: 'oriole', name: 'Oriole', short: 'ORIOLE', place: 'Camden Yards',
    ability: 'DOUBLE JUMP',
    tip: ['Press JUMP again in mid-air.', 'Double jump over tall peanut stacks', 'and wide light-rail gaps!'],
    collect: 'card', collectName: 'baseball cards', collectAlt: [8, 80],
    gap: [0.75, 1.3], gate: [0.19, 0.42], combo: [0.12, 0.26],
    obstacles: [['foulBall', 3], ['foulBall', 2, { alt: 0 }], ['hotdogCart', 2]],
    gates: ['peanutStack', 'railGap'],
    combos: [[['foulBall', 0, { alt: 0 }], ['foulBall', 30, { alt: 0 }]], [['hotdogCart', 0], ['foulBall', 140]]],
    boss: 'derby', bossName: 'HOME RUN DERBY', bossTip: 'DOUBLE JUMP THE BALL WALLS!', bossPhases: 3, winText: 'SAFE AT HOME!',
  },
  {
    id: 'raven', char: 'raven', name: 'Raven', short: 'RAVEN', place: "Poe's Grave",
    ability: 'GLIDE',
    tip: ['Hold JUMP in mid-air to glide.', 'Open graves are too wide to jump:', 'glide across them!'],
    collect: 'quill', collectName: 'quills', collectAlt: [8, 70],
    gap: [0.7, 1.2], gate: [0.2, 0.45], combo: [0.15, 0.3],
    obstacles: [['tombstone', 3], ['fence', 2], ['bat', 2], ['football', 2]],
    gates: ['grave'],
    combos: [[['tombstone', 0], ['tombstone', 30]], [['fence', 0], ['bat', 140]]],
    boss: 'quill', bossName: 'NEVERMORE', bossTip: 'GLIDE OVER THE INK!', bossPhases: 3, winText: 'QUOTH THE RAVEN: DONE!',
  },
];

// Apply config.js tuning.
for (const L of LEVELS) {
  const t = LEVEL_TUNING[L.id] || {};
  L.speed = (t.speed || [120, 170]).map((v) => v * GAME.speedMultiplier);
  L.length = (t.length || 6000) * GAME.levelLengthMultiplier;
  L.gap = L.gap.map((v) => v * GAME.spawnGapMultiplier);
  L.gate = L.gate.map((v) => Math.min(1, v * GAME.gateChanceMultiplier));
}
