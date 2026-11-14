// Pixel sprites defined as string grids, pre-rendered to offscreen canvases.
// All characters face right. '.' is transparent.

function build(rows, pal, outline) {
  const h = rows.length;
  const w = Math.max(...rows.map((r) => r.length));
  const pad = outline ? 1 : 0;
  const c = document.createElement('canvas');
  c.width = w + pad * 2;
  c.height = h + pad * 2;
  const x = c.getContext('2d');
  const op = (cx, cy) => {
    const r = rows[cy];
    if (!r) return false;
    const ch = r[cx];
    return !!ch && ch !== '.';
  };
  if (outline) {
    x.fillStyle = outline;
    for (let yy = -1; yy <= h; yy++) {
      for (let xx = -1; xx <= w; xx++) {
        if (op(xx, yy)) continue;
        if (op(xx - 1, yy) || op(xx + 1, yy) || op(xx, yy - 1) || op(xx, yy + 1)) x.fillRect(xx + pad, yy + pad, 1, 1);
      }
    }
  }
  for (let yy = 0; yy < h; yy++) {
    for (let xx = 0; xx < w; xx++) {
      const ch = rows[yy][xx];
      if (!ch || ch === '.') continue;
      x.fillStyle = pal[ch] || '#f0f';
      x.fillRect(xx + pad, yy + pad, 1, 1);
    }
  }
  return c;
}

// ---------- Blue crab ----------
const crabPal = { K: '#111111', k: '#24518f', R: '#e5532d', B: '#3d7fd0', b: '#24518f', L: '#8fc3ff' };
const crabBody = [
  '..K..........K..',
  '..k..........k..',
  'RR.k........k.RR',
  'RBB.bbbbbbbb.BBR',
  '.BBbBBBBBBBBbBB.',
  '..bBBBBLLBBBBb..',
  '...bBBBBBBBBb...',
  '....bbbbbbbb....',
];
const crabA = [...crabBody, '...b.b.b..b.b.b.', '..b.b.b....b.b.b'];
const crabB = [...crabBody, '...b.b.b..b.b.b.', '...b.b.b..b.b.b.'];

// ---------- Utz girl (chibi nod to the logo: dark bob, big red bow, rosy cheeks, chips) ----------
const utzPal = {
  B: '#e3202f', b: '#a8101e', H: '#3d2216', h: '#5e3624', S: '#fad4ae', K: '#1a1a1a', W: '#ffffff',
  C: '#f27c86', M: '#c0303f', R: '#e3202f', r: '#b01624', Y: '#f6c33b', O: '#e08a2a', k: '#2a2a2a',
};
const utzTop = [
  '..BBB....BBB..',
  '.BBbBB..BBbBB.',
  '.BBBBBbbBBBBB.',
  '..BBBbBBbBBB..',
  '...HHHbbHHH...',
  '..HHHHHHHHHH..',
  '.HHhHHhhHHhHH.',
  '.HhhhhhhhhhhH.',
  'HHSSSSSSSSSSHH',
  'HHSKKSSSSKKSHH',
  'HHSKWSSSSKWSHH',
  'HHCCSSSSSSCCHH',
  'HHSSSSMMSSSSHH',
  'HH.SSSSSSSS.HH',
  '....rWWWWr....',
  '...RRRRRRYYY..',
  '..SRRRRRRYOYY.',
  '...RRRRRRYYY..',
  '..RRRRRRRR....',
  '....SS..SS....',
];
const utzA = [...utzTop, '...SS....SS...', '..kk.....kk...'];
const utzB = [...utzTop, '.....SS.SS....', '.....kk.kk....'];
const utzSlide = [
  'BB..HHHHH...........',
  'BbBHHhhhhH..........',
  'BBHHSKSSKSH.....YY..',
  '.HHHSCSSCSRRRRRYOY..',
  '.HHHSSMMSRRRRRRRYSkk',
  '..HHHSSSRRRRRRRR....',
];

// ---------- Natty Boh guy (nod: big round head, slick part, one eye, handlebar mustache) ----------
const bohPal = { K: '#141414', S: '#f4caa0', s: '#e0a87e', W: '#ffffff', w: '#f0f0f0', R: '#d22b2b', N: '#2b3a67', O: '#e89a80', M: '#9a1c1c' };
const bohTop = [
  '.....KKKKKKK......',
  '....KKKKKKK.KK....',
  '...KKKKKKKK.KKK...',
  '...KSSSSSSSSSSK...',
  '..SSSSSSSSSSSSSS..',
  '..SSSSSSSSWWWSSS..',
  '..SSSSSSSSWKKSSS..',
  '..SSSSSSSSWKKSSS..',
  '..SSSSSSSSSSSOOS..',
  'K.SSSSSSSSSSOOOS.K',
  'KK.SKKKKKKKKKKS.KK',
  '.KKKKKKKKKKKKKKKK.',
  '...SSSSMMMMSSSS...',
  '....sSSSSSSSSs....',
  '......SSSSSS......',
  '......wRRRw.......',
  '.....wwwRwww......',
  '....SwwwwwwwS.....',
  '....SwwwwwwwS.....',
  '.....NNNNNNN......',
];
const bohA = [...bohTop, '.....NN...NN......', '....KKK...KKK.....'];
const bohB = [...bohTop, '......NN.NN.......', '......KK.KK.......'];

// ---------- Oriole ----------
const oriPal = { K: '#141414', O: '#f28c28', W: '#ffffff', G: '#8a8a8a' };
const oriTop = [
  '.......KKKK...',
  '......KKKKKK..',
  '......KKKWKKK.',
  '.....KKKKKKKGG',
  'KK..OOKKKKKO..',
  'KKKOOKKKKOOO..',
  '.KOOOKWWKOOOO.',
  '..OOOKKKKOOOO.',
  '...OOOOOOOOO..',
  '....OOOOOOO...',
];
const oriA = [...oriTop, '.....G...G....', '....GG..GG....'];
const oriB = [...oriTop, '......G.G.....', '.....GG.GG....'];
const oriAir = [
  '..KK...KKKK...',
  '...KK.KKKKKK..',
  '....KKKKKWKKK.',
  '.....KKKKKKKGG',
  'KK..OOOOOOOO..',
  'KKKOOOOOOOOO..',
  '.KOOOOOOOOOOO.',
  '..OOOOOOOOOOO.',
  '...OOOOOOOOO..',
  '....OOOOOOO...',
  '.....G...G....',
];

// ---------- Raven ----------
const ravPal = { K: '#16141c', P: '#4a3a6e', W: '#e8e8e8', G: '#6a6872' };
const ravTop = [
  '........KKKK....',
  '.......KKKKKK...',
  '.......KKKKWKK..',
  '......KKKKKKKGGG',
  'KKK..KKKKKKK....',
  '.KKKKKPPKKKK....',
  '..KKKPPPPKKKK...',
  '...KKKKPPKKKK...',
  '....KKKKKKKK....',
  '.....KKKKKK.....',
];
const ravA = [...ravTop, '......G..G......', '.....GG.GG......'];
const ravB = [...ravTop, '.......GG.......', '......GGGG......'];
const ravOutline = '#8f80c0';

export const SPR = {
  crab: { run: [build(crabA, crabPal), build(crabB, crabPal)], air: build(crabA, crabPal) },
  utz: { run: [build(utzA, utzPal), build(utzB, utzPal)], air: build(utzA, utzPal), slide: build(utzSlide, utzPal) },
  boh: { run: [build(bohA, bohPal), build(bohB, bohPal)], air: build(bohB, bohPal) },
  oriole: { run: [build(oriA, oriPal), build(oriB, oriPal)], air: build(oriAir, oriPal) },
  raven: { run: [build(ravA, ravPal, ravOutline), build(ravB, ravPal, ravOutline)], air: build(ravTop, ravPal, ravOutline) },
};

// ---------- icons ----------
export const ICONS = {
  oldbay: build([
    '..RRRRRRRR..',
    '.RRRRRRRRRR.',
    '.YYYYYYYYYY.',
    '.YBBBBBBBBY.',
    '.YBWWWWWWBY.',
    '.YBBBBBBBBY.',
    '.YYYRRRRYYY.',
    '.YYRYYYYRYY.',
    '.YYYRRRRYYY.',
    '.YYYYYYYYYY.',
    '.kkkkkkkkkk.',
  ], { Y: '#f6d33b', R: '#c8202a', B: '#1f4e9c', W: '#ffffff', k: '#777' }, '#1a1a1a'),
  chips: build([
    '..RRRRRRRR..',
    '.YYYYYYYYYY.',
    '.YRRRRRRRRY.',
    '.YRWWWWWWRY.',
    '.YRRRRRRRRY.',
    '.YYYOOOOYYY.',
    '.YYOOooOOYY.',
    '.YOOOOOOOOY.',
    '.YYOOOOOOYY.',
    '.YYYYYYYYYY.',
    '..RRRRRRRR..',
  ], { R: '#c8202a', Y: '#f6c33b', O: '#e8a23a', o: '#f8d070', W: '#ffffff' }, '#1a1a1a'),
  cap: build([
    '...kkkkkk...',
    '..kRRRRRRk..',
    '.kRRWWWWRRk.',
    'kRRWRRRRWRRk',
    'kRWRRWWRRWRk',
    'kRWRWRRWRWRk',
    'kRWRRWWRRWRk',
    'kRRWRRRRWRRk',
    '.kRRWWWWRRk.',
    '..kRRRRRRk..',
    '...kkkkkk...',
  ], { k: '#9a9a9a', R: '#c8202a', W: '#ffffff' }, '#1a1a1a'),
  card: build([
    'WWWWWWWWWW',
    'WOOOOOOOOW',
    'WOOKKKOOOW',
    'WOKKWKOOOW',
    'WOOKKKKGOW',
    'WOOOKKOOOW',
    'WOOOOGGOOW',
    'WOOOOOOOOW',
    'WWWWWWWWWW',
    'WKKKKKKKKW',
    'WWWWWWWWWW',
  ], { W: '#ffffff', O: '#f28c28', K: '#141414', G: '#8a8a8a' }, '#1a1a1a'),
  quill: build([
    '..........WW',
    '.........WWW',
    '........WWWG',
    '.......WWWG.',
    '......WWWG..',
    '.....WWWG...',
    '....WWWG....',
    '...WWWG.....',
    '..WWG.......',
    '..WG........',
    '.G..........',
    'K...........',
  ], { W: '#f4f0ff', G: '#9a8fb0', K: '#111' }, '#c8b8ff'),
  heart: build([
    '.RR.RR.',
    'RrRRRRR',
    'RRRRRRR',
    '.RRRRR.',
    '..RRR..',
    '...R...',
  ], { R: '#e83a4a', r: '#ff9aa8' }, '#200'),
  heartEmpty: build([
    '.RR.RR.',
    'RRRRRRR',
    'RRRRRRR',
    '.RRRRR.',
    '..RRR..',
    '...R...',
  ], { R: '#3a3a48' }, '#111'),
  shield: build([
    'bbbbbbb',
    'bBBWBBb',
    'bBWWWBb',
    'bBBWBBb',
    '.bBBBb.',
    '..bBb..',
    '...b...',
  ], { B: '#7ab8ff', W: '#e8f4ff', b: '#2a5a9a' }),
};
