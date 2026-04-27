import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const repoRoot = fileURLToPath(new URL('..', import.meta.url));
const outDir = join(repoRoot, 'assets', 'sprites', 'beach', 'hero');
const svgPath = join(outDir, 'runner-hero-sheet.svg');
const pngPath = join(outDir, 'runner-hero-sheet.png');

const FRAME_SIZE = 256;
const COLUMNS = 8;
const TOTAL_FRAMES = 29;
const ROWS = Math.ceil(TOTAL_FRAMES / COLUMNS);

const C = {
  ink: '#273043',
  outline: '#1f2937',
  fur: '#f6a64a',
  furDark: '#df7c25',
  furLight: '#ffd59b',
  cream: '#fff2d5',
  pink: '#ff9bb3',
  shell: '#fff1c9',
  shellLine: '#d97706',
  hurt: '#ef4444',
  gold: '#facc15',
  shadow: 'rgba(39,48,67,0.18)',
  white: '#ffffff',
};

function svg(body) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${FRAME_SIZE * COLUMNS}" height="${FRAME_SIZE * ROWS}" viewBox="0 0 ${FRAME_SIZE * COLUMNS} ${FRAME_SIZE * ROWS}" role="img">
${body}
</svg>
`;
}

function p(d, fill, stroke = C.ink, sw = 8, extra = '') {
  return `<path d="${d}" fill="${fill}" stroke="${stroke}" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round" ${extra}/>`;
}

function ellipse(cx, cy, rx, ry, fill, stroke = C.ink, sw = 8, extra = '') {
  return `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="${fill}" stroke="${stroke}" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round" ${extra}/>`;
}

function circle(cx, cy, r, fill, stroke = C.ink, sw = 8, extra = '') {
  return `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${fill}" stroke="${stroke}" stroke-width="${sw}" ${extra}/>`;
}

function line(x1, y1, x2, y2, stroke = C.ink, sw = 13, extra = '') {
  return `<path d="M${x1} ${y1} L${x2} ${y2}" fill="none" stroke="${stroke}" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round" ${extra}/>`;
}

function polygon(points, fill, stroke = C.ink, sw = 8, extra = '') {
  return `<polygon points="${points}" fill="${fill}" stroke="${stroke}" stroke-width="${sw}" stroke-linejoin="round" ${extra}/>`;
}

function shell(cx, cy, scale = 1) {
  return `<g transform="translate(${cx} ${cy}) scale(${scale})">
${p('M-24 16 C-18 -18 -5 -34 0 -36 C5 -34 18 -18 24 16 C10 28 -10 28 -24 16Z', C.shell, C.ink, 5)}
${line(0, -34, 0, 24, C.shellLine, 3)}
${p('M-15 -22 C-4 -4 -4 12 -8 24 M15 -22 C4 -4 4 12 8 24 M-20 12 C-8 5 8 5 20 12', 'none', C.shellLine, 3)}
</g>`;
}

function spark(cx, cy, scale = 1) {
  return `<g transform="translate(${cx} ${cy}) scale(${scale})">
${p('M0 -20 L7 -6 L23 -4 L10 6 L14 22 L0 13 L-14 22 L-10 6 L-23 -4 L-7 -6Z', C.gold, C.ink, 4)}
</g>`;
}

function catFrame(options = {}) {
  const {
    bob = 0,
    bodySx = 1,
    bodySy = 1,
    bodyRotate = 0,
    headX = 146,
    headY = 90,
    headRotate = 0,
    tail = 'up',
    ears = 'up',
    face = 'smile',
    paws = 'runA',
    legs = 'stand',
    extra = '',
    shadowRx = 54,
    shadowY = 226,
  } = options;

  const bodyCx = 116;
  const bodyCy = 158 + bob;
  const headCy = headY + bob;
  const tailPath = {
    up: 'M78 153 C42 128 44 80 78 60',
    mid: 'M77 157 C42 150 35 112 60 91',
    down: 'M79 165 C50 181 46 210 75 221',
    back: 'M79 154 C42 134 38 97 66 75',
    tuck: 'M80 174 C58 176 52 194 67 204',
    proud: 'M79 151 C39 112 56 60 100 55',
  }[tail];

  const legSet = {
    stand: [
      [96, 190, 88, 220],
      [128, 190, 126, 220],
      [148, 188, 162, 218],
    ],
    run1: [
      [92, 186, 62, 218],
      [126, 190, 134, 220],
      [148, 188, 180, 212],
    ],
    run2: [
      [92, 190, 104, 220],
      [126, 188, 158, 216],
      [148, 190, 132, 220],
    ],
    run3: [
      [92, 190, 82, 220],
      [126, 188, 150, 220],
      [148, 188, 172, 218],
    ],
    jump: [
      [96, 184, 78, 200],
      [128, 184, 118, 202],
      [150, 184, 176, 198],
    ],
    fall: [
      [94, 188, 82, 214],
      [128, 188, 132, 218],
      [150, 188, 166, 214],
    ],
    duck: [
      [88, 192, 64, 220],
      [122, 194, 130, 220],
      [158, 192, 190, 220],
    ],
    defeat: [
      [86, 198, 56, 216],
      [124, 199, 112, 220],
      [158, 198, 190, 214],
    ],
  }[legs];

  const pawSet = {
    runA: [
      [143, 148, 174, 166],
      [101, 148, 82, 166],
    ],
    runB: [
      [144, 148, 160, 177],
      [101, 148, 78, 137],
    ],
    tuck: [
      [142, 150, 163, 151],
      [101, 150, 86, 156],
    ],
    throw1: [
      [146, 144, 190, 129],
      [101, 148, 85, 166],
    ],
    throw2: [
      [148, 141, 201, 117],
      [101, 148, 89, 166],
    ],
    cheer: [
      [143, 145, 166, 84],
      [101, 148, 82, 122],
    ],
    hurt: [
      [142, 150, 166, 173],
      [101, 150, 79, 174],
    ],
    low: [
      [139, 176, 180, 191],
      [101, 178, 74, 196],
    ],
  }[paws];

  const eye = face === 'defeat'
    ? `${line(headX + 8, headCy - 7, headX + 21, headCy + 6, C.ink, 4)}${line(headX + 21, headCy - 7, headX + 8, headCy + 6, C.ink, 4)}`
    : `${circle(headX + 13, headCy - 7, 5, C.ink, C.ink, 1)}`;
  const mouth = {
    smile: p(`M${headX + 25} ${headCy + 16} C${headX + 34} ${headCy + 23} ${headX + 43} ${headCy + 18} ${headX + 48} ${headCy + 12}`, 'none', C.ink, 4),
    focused: p(`M${headX + 27} ${headCy + 17} C${headX + 36} ${headCy + 15} ${headX + 42} ${headCy + 15} ${headX + 49} ${headCy + 17}`, 'none', C.ink, 4),
    hurt: p(`M${headX + 27} ${headCy + 20} C${headX + 36} ${headCy + 12} ${headX + 45} ${headCy + 20} ${headX + 51} ${headCy + 14}`, 'none', C.ink, 4),
    defeat: p(`M${headX + 26} ${headCy + 21} C${headX + 34} ${headCy + 14} ${headX + 45} ${headCy + 14} ${headX + 52} ${headCy + 21}`, 'none', C.ink, 4),
  }[face];

  const earOffset = ears === 'back' ? 10 : 0;
  const leftEar = `${headX - 32},${headCy - 24 + earOffset} ${headX - 20},${headCy - 66 + earOffset} ${headX + 1},${headCy - 31}`;
  const rightEar = `${headX + 7},${headCy - 34} ${headX + 38},${headCy - 60 + earOffset} ${headX + 34},${headCy - 19 + earOffset}`;

  return `
${ellipse(128, shadowY, shadowRx, 8, C.shadow, 'none', 0)}
${p(tailPath, 'none', C.outline, 18)}
${p(tailPath, 'none', C.fur, 10)}
<g transform="rotate(${bodyRotate} ${bodyCx} ${bodyCy})">
${legSet.map(([x1, y1, x2, y2], index) => line(x1, y1 + bob, x2, y2, index === 0 ? C.furDark : C.fur, 15)).join('')}
${ellipse(bodyCx, bodyCy, 52 * bodySx, 55 * bodySy, C.fur, C.outline, 8)}
${ellipse(bodyCx + 18, bodyCy + 13, 24 * bodySx, 34 * bodySy, C.cream, 'none', 0, 'opacity="0.98"')}
${p(`M${bodyCx - 30} ${bodyCy - 15} C${bodyCx - 6} ${bodyCy - 36} ${bodyCx + 20} ${bodyCy - 36} ${bodyCx + 41} ${bodyCy - 10}`, 'none', C.furLight, 6)}
${pawSet.map(([x1, y1, x2, y2], index) => line(x1, y1 + bob, x2, y2 + bob, index === 0 ? C.fur : C.furDark, 14)).join('')}
</g>
<g transform="rotate(${headRotate} ${headX} ${headCy})">
${polygon(leftEar, C.fur, C.outline, 7)}
${polygon(rightEar, C.fur, C.outline, 7)}
${polygon(`${headX - 23},${headCy - 29 + earOffset} ${headX - 20},${headCy - 51 + earOffset} ${headX - 8},${headCy - 33}`, C.pink, 'none', 0)}
${polygon(`${headX + 16},${headCy - 35} ${headX + 32},${headCy - 50 + earOffset} ${headX + 31},${headCy - 25 + earOffset}`, C.pink, 'none', 0)}
${ellipse(headX + 4, headCy, 48, 42, C.fur, C.outline, 8)}
${ellipse(headX + 29, headCy + 9, 24, 17, C.cream, 'none', 0)}
${eye}
${circle(headX + 33, headCy + 5, 4, C.pink, C.ink, 2)}
${mouth}
${line(headX + 31, headCy + 9, headX + 52, headCy + 4, C.ink, 2)}
${line(headX + 31, headCy + 15, headX + 53, headCy + 17, C.ink, 2)}
</g>
${extra}
`;
}

const frames = [
  { bob: 1, tail: 'up', legs: 'stand', paws: 'runA', face: 'smile' },
  { bob: -2, tail: 'mid', legs: 'stand', paws: 'runB', face: 'smile', headY: 88 },
  { bob: 0, tail: 'up', legs: 'stand', paws: 'runA', face: 'smile' },
  { bob: 0, tail: 'back', legs: 'run1', paws: 'runA', face: 'focused', bodyRotate: -5, headY: 88 },
  { bob: -4, tail: 'up', legs: 'run2', paws: 'runB', face: 'focused', bodyRotate: 2, headY: 86 },
  { bob: 0, tail: 'down', legs: 'run3', paws: 'runA', face: 'focused', bodyRotate: 5, headY: 89 },
  { bob: 2, tail: 'mid', legs: 'run1', paws: 'runB', face: 'focused', bodyRotate: -3, headY: 90 },
  { bob: -3, tail: 'up', legs: 'run2', paws: 'runA', face: 'focused', bodyRotate: 2, headY: 86 },
  { bob: 0, tail: 'down', legs: 'run3', paws: 'runB', face: 'focused', bodyRotate: 4, headY: 89 },
  { bob: -20, tail: 'proud', legs: 'jump', paws: 'tuck', face: 'focused', bodyRotate: -12, headX: 150, headY: 78, shadowRx: 36 },
  { bob: -32, tail: 'up', legs: 'jump', paws: 'tuck', face: 'focused', bodyRotate: -8, headX: 150, headY: 74, shadowRx: 30 },
  { bob: -30, tail: 'back', legs: 'fall', paws: 'hurt', face: 'focused', bodyRotate: 10, headX: 150, headY: 82, shadowRx: 30 },
  { bob: -16, tail: 'down', legs: 'fall', paws: 'hurt', face: 'focused', bodyRotate: 8, headX: 150, headY: 88, shadowRx: 38 },
  { bob: 18, bodySx: 1.18, bodySy: 0.62, tail: 'tuck', legs: 'duck', paws: 'low', face: 'focused', headX: 165, headY: 126, headRotate: 4, shadowRx: 70 },
  { bob: 20, bodySx: 1.24, bodySy: 0.58, tail: 'tuck', legs: 'duck', paws: 'low', face: 'focused', headX: 174, headY: 128, headRotate: 4, shadowRx: 75 },
  { bob: 18, bodySx: 1.18, bodySy: 0.62, tail: 'tuck', legs: 'duck', paws: 'low', face: 'focused', headX: 165, headY: 126, headRotate: 4, shadowRx: 70 },
  { bob: -5, tail: 'down', legs: 'stand', paws: 'hurt', face: 'hurt', ears: 'back', bodyRotate: -8, headRotate: -8, extra: spark(78, 74, 0.75) },
  { bob: -2, tail: 'tuck', legs: 'stand', paws: 'hurt', face: 'hurt', ears: 'back', bodyRotate: 7, headRotate: 7, extra: spark(203, 65, 0.62) },
  { bob: 0, tail: 'down', legs: 'stand', paws: 'hurt', face: 'hurt', ears: 'back', bodyRotate: -5, extra: spark(70, 85, 0.55) },
  { bob: 0, tail: 'back', legs: 'stand', paws: 'throw1', face: 'focused', bodyRotate: -4, extra: shell(196, 126, 0.68) },
  { bob: -2, tail: 'up', legs: 'stand', paws: 'throw2', face: 'focused', bodyRotate: -8, headX: 150, extra: shell(211, 114, 0.72) },
  { bob: 1, tail: 'mid', legs: 'stand', paws: 'throw2', face: 'smile', bodyRotate: -2, extra: shell(225, 108, 0.62) },
  { bob: -2, tail: 'proud', legs: 'stand', paws: 'cheer', face: 'smile', headY: 86, extra: spark(170, 66, 0.5) },
  { bob: -8, tail: 'proud', legs: 'stand', paws: 'cheer', face: 'smile', bodyRotate: -6, headY: 82, extra: `${spark(84, 72, 0.42)}${spark(193, 48, 0.45)}` },
  { bob: -3, tail: 'up', legs: 'stand', paws: 'cheer', face: 'smile', bodyRotate: 4, headY: 86, extra: spark(190, 62, 0.5) },
  { bob: 0, tail: 'proud', legs: 'stand', paws: 'cheer', face: 'smile', headY: 88, extra: spark(76, 82, 0.4) },
  { bob: 18, bodySx: 1.22, bodySy: 0.55, tail: 'down', legs: 'defeat', paws: 'low', face: 'defeat', ears: 'back', headX: 160, headY: 147, headRotate: 9, shadowRx: 76 },
  { bob: 20, bodySx: 1.28, bodySy: 0.5, tail: 'tuck', legs: 'defeat', paws: 'low', face: 'defeat', ears: 'back', headX: 166, headY: 150, headRotate: 5, shadowRx: 80 },
  { bob: 22, bodySx: 1.32, bodySy: 0.48, tail: 'tuck', legs: 'defeat', paws: 'low', face: 'defeat', ears: 'back', headX: 168, headY: 152, headRotate: 3, shadowRx: 82 },
];

function buildSheet() {
  return frames.map((frame, index) => {
    const x = (index % COLUMNS) * FRAME_SIZE;
    const y = Math.floor(index / COLUMNS) * FRAME_SIZE;
    return `<g transform="translate(${x} ${y})">${catFrame(frame)}</g>`;
  }).join('\n');
}

await mkdir(dirname(svgPath), { recursive: true });
const markup = svg(buildSheet());
await writeFile(svgPath, markup, 'utf8');
await sharp(Buffer.from(markup)).png().toFile(pngPath);

console.log(`Generated ${TOTAL_FRAMES} frames:`);
console.log(`- ${svgPath}`);
console.log(`- ${pngPath}`);
