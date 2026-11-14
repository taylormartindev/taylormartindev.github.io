// =====================================================================
//  CHARM CITY RUN — TUNING CONFIG
//  Edit the numbers below and reload the page. Units: pixels and seconds.
//  The game screen is 320 x 180 pixels; the player stands at x = 48.
// =====================================================================

// ---------- Game-wide settings ----------
export const GAME = {
  speedMultiplier: 1.0,        // scales the scroll speed of every level (1.2 = 20% faster)
  levelLengthMultiplier: 1.0,  // scales the run distance before each boss
  spawnGapMultiplier: 1.0,     // > 1 = more space between obstacles (easier), < 1 = tighter
  gateChanceMultiplier: 1.0,   // how often ability-only obstacles appear (0 = never)
  minObstacleGap: 0.65,        // min seconds between one obstacle passing and the next arriving
                               // (raise for more breathing room between jumps)
  bossDurationMultiplier: 1.0, // > 1 = longer bosses (more time / more keg hits needed)
  gravity: 1000,               // downward pull in px/s^2 (lower = floatier jumps)
  startingHearts: 11,           // hearts at the start of each level (1-16)
  hurtInvulnTime: 1.4,         // seconds of invincibility after taking a hit
  collectiblePoints: 50,       // points per collectible
  foamPoints: 20,              // points per foam bubble popped in the Keg Cannon fight
  bossBonus: 500,              // points for beating a boss
  playerX: 48,                 // player's resting horizontal position on screen
  screenShake: true,           // set false to disable screen shake
};

// ---------- Per-level settings ----------
// speed: [start, max] scroll speed in px/s (ramps up over the level, before speedMultiplier)
// length: distance in px before the boss (10 px = 1 "meter" on the HUD)
export const LEVEL_TUNING = {
  crab:   { speed: [105, 145], length: 5000 },
  utz:    { speed: [118, 165], length: 6200 },
  boh:    { speed: [128, 178], length: 7400 },
  oriole: { speed: [138, 192], length: 8600 },
  raven:  { speed: [148, 205], length: 10000 },
};

// ---------- Character settings ----------
// jump: launch velocity (more negative = higher). -300 reaches ~45 px with gravity 1000.
export const CHARACTERS = {
  crab: {
    jump: -300,
    dashDistance: 60,    // how far forward the dash carries the crab (px).
                         // Crab-pot towers are 52 px wide; much below ~60 they get hard to clear.
    dashTime: 0.38,      // dash duration in seconds (the crab is invincible for this long)
    dashCooldown: 1.0,   // seconds before the dash can be used again
    dashReturnSpeed: 100, // px/s the crab drifts back to its resting spot after dashing
  },
  utz: {
    jump: -330,
    slideTime: 0.55,     // seconds a slide lasts
    slideCooldown: 0.35, // seconds between slides
  },
  boh: {
    jump: -315,
    twirlRiseSpeed: 95,  // px/s he climbs while twirling his mustache
    twirlTime: 0.6,      // seconds a twirl lasts (one twirl per jump; recharges on landing)
    twirlCooldown: 0.25, // seconds before another twirl after landing
                         // Keg towers / crate stacks are 60 px tall: a jump alone reaches ~49 px,
                         // jump + twirl reaches ~85-110 px depending on timing.
    armor: 1,            // free hits absorbed per level before losing hearts
  },
  oriole: {
    jump: -320,
    doubleJump: -300,    // strength of the mid-air jump
    extraJumps: 1,       // number of mid-air jumps (2 = triple jump)
  },
  raven: {
    jump: -320,
    glideFallSpeed: 32,  // max fall speed while gliding (lower = longer glides)
  },
};

// ---------- Cheat codes ----------
// Entered from the title screen (press C). Codes are case-insensitive.
// Available effects: 'unlockAll'
export const CODES = {
  ILUVBALTIMORE: { effect: 'unlockAll', message: 'ALL LEVELS UNLOCKED, HON!' },
};
