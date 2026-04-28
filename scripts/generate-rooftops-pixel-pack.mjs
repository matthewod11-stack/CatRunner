import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { deflateSync } from 'node:zlib';

const repoRoot = fileURLToPath(new URL('..', import.meta.url));
const assetRoot = join(repoRoot, 'assets', 'sprites', 'rooftops');

const C = {
  transparent: [0, 0, 0, 0],
  ink: [17, 24, 39, 255],
  ink2: [39, 48, 67, 255],
  nightTop: [7, 10, 30, 255],
  nightMid: [15, 21, 55, 255],
  nightLow: [31, 39, 86, 255],
  nightHaze: [64, 66, 126, 255],
  star: [255, 248, 199, 255],
  starDim: [172, 196, 255, 170],
  moon: [255, 238, 170, 245],
  skyOrange: [255, 159, 67, 255],
  skyGold: [255, 209, 102, 255],
  skyPurple: [124, 58, 237, 255],
  skyDeep: [26, 26, 62, 255],
  skylineFar: [9, 13, 35, 235],
  skylineMid: [14, 18, 45, 245],
  buildingA: [26, 26, 46, 255],
  buildingB: [30, 30, 53, 255],
  windowDim: [255, 204, 68, 120],
  roof: [139, 115, 85, 255],
  roofLight: [216, 193, 152, 255],
  roofDark: [47, 37, 28, 255],
  cat: [246, 176, 109, 255],
  catLight: [255, 207, 138, 255],
  cream: [254, 243, 199, 255],
  cheek: [244, 164, 164, 255],
  pigeon: [148, 163, 184, 255],
  pigeonDark: [71, 85, 105, 255],
  rat: [112, 89, 72, 255],
  raccoon: [86, 68, 51, 255],
  metal: [148, 163, 184, 255],
  metalDark: [71, 85, 105, 255],
  neon: [217, 70, 239, 255],
  danger: [239, 68, 68, 255],
  orange: [249, 115, 22, 255],
  coin: [250, 204, 21, 255],
  coinDark: [180, 83, 9, 255],
  blue: [59, 130, 246, 255],
  green: [34, 197, 94, 255],
  purple: [168, 85, 247, 255],
  white: [248, 250, 252, 255],
  steam: [226, 232, 240, 210],
};

function rgba([r, g, b, a]) {
  return { r, g, b, a };
}

function makeImage(width, height, fill = C.transparent) {
  const data = new Uint8Array(width * height * 4);
  const color = rgba(fill);
  for (let i = 0; i < width * height; i++) {
    const p = i * 4;
    data[p] = color.r;
    data[p + 1] = color.g;
    data[p + 2] = color.b;
    data[p + 3] = color.a;
  }
  return { width, height, data };
}

function blendPixel(img, x, y, color) {
  if (x < 0 || y < 0 || x >= img.width || y >= img.height) return;
  const { r, g, b, a } = rgba(color);
  const p = (Math.floor(y) * img.width + Math.floor(x)) * 4;
  if (a === 255) {
    img.data[p] = r;
    img.data[p + 1] = g;
    img.data[p + 2] = b;
    img.data[p + 3] = a;
    return;
  }
  const srcA = a / 255;
  const dstA = img.data[p + 3] / 255;
  const outA = srcA + dstA * (1 - srcA);
  if (outA <= 0) return;
  img.data[p] = Math.round((r * srcA + img.data[p] * dstA * (1 - srcA)) / outA);
  img.data[p + 1] = Math.round((g * srcA + img.data[p + 1] * dstA * (1 - srcA)) / outA);
  img.data[p + 2] = Math.round((b * srcA + img.data[p + 2] * dstA * (1 - srcA)) / outA);
  img.data[p + 3] = Math.round(outA * 255);
}

function rect(img, x, y, w, h, color) {
  for (let py = Math.floor(y); py < Math.floor(y + h); py++) {
    for (let px = Math.floor(x); px < Math.floor(x + w); px++) blendPixel(img, px, py, color);
  }
}

function outlineRect(img, x, y, w, h, fill, outline = C.ink) {
  rect(img, x, y, w, h, outline);
  rect(img, x + 1, y + 1, w - 2, h - 2, fill);
}

function circle(img, cx, cy, r, color) {
  const rr = r * r;
  for (let y = Math.floor(cy - r); y <= Math.ceil(cy + r); y++) {
    for (let x = Math.floor(cx - r); x <= Math.ceil(cx + r); x++) {
      const dx = x - cx;
      const dy = y - cy;
      if (dx * dx + dy * dy <= rr) blendPixel(img, x, y, color);
    }
  }
}

function ellipse(img, cx, cy, rx, ry, color) {
  for (let y = Math.floor(cy - ry); y <= Math.ceil(cy + ry); y++) {
    for (let x = Math.floor(cx - rx); x <= Math.ceil(cx + rx); x++) {
      const dx = (x - cx) / rx;
      const dy = (y - cy) / ry;
      if (dx * dx + dy * dy <= 1) blendPixel(img, x, y, color);
    }
  }
}

function line(img, x0, y0, x1, y1, color) {
  const steps = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0));
  for (let i = 0; i <= steps; i++) {
    const t = steps === 0 ? 0 : i / steps;
    blendPixel(img, Math.round(x0 + (x1 - x0) * t), Math.round(y0 + (y1 - y0) * t), color);
  }
}

function stamp(dst, src, dx, dy) {
  for (let y = 0; y < src.height; y++) {
    for (let x = 0; x < src.width; x++) {
      const p = (y * src.width + x) * 4;
      const color = [src.data[p], src.data[p + 1], src.data[p + 2], src.data[p + 3]];
      if (color[3] > 0) blendPixel(dst, dx + x, dy + y, color);
    }
  }
}

function mixColor(a, b, t) {
  return [
    Math.round(a[0] + (b[0] - a[0]) * t),
    Math.round(a[1] + (b[1] - a[1]) * t),
    Math.round(a[2] + (b[2] - a[2]) * t),
    Math.round(a[3] + (b[3] - a[3]) * t),
  ];
}

const crcTable = new Uint32Array(256).map((_, n) => {
  let c = n;
  for (let k = 0; k < 8; k++) c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
  return c >>> 0;
});

function crc32(buf) {
  let c = 0xffffffff;
  for (const b of buf) c = crcTable[(c ^ b) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const typeBuf = Buffer.from(type);
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])));
  return Buffer.concat([len, typeBuf, data, crc]);
}

function pngBuffer(img) {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(img.width, 0);
  ihdr.writeUInt32BE(img.height, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;

  const stride = img.width * 4;
  const raw = Buffer.alloc((stride + 1) * img.height);
  for (let y = 0; y < img.height; y++) {
    raw[y * (stride + 1)] = 0;
    Buffer.from(img.data.buffer, y * stride, stride).copy(raw, y * (stride + 1) + 1);
  }

  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

async function save(relPath, img) {
  const abs = join(assetRoot, relPath);
  await mkdir(dirname(abs), { recursive: true });
  await writeFile(abs, pngBuffer(img));
}

function sky() {
  const img = makeImage(320, 180);
  for (let y = 0; y < img.height; y++) {
    const t = y / (img.height - 1);
    const upper = mixColor(C.nightTop, C.nightMid, Math.min(1, t * 1.6));
    const lower = mixColor(C.nightMid, C.nightLow, Math.max(0, (t - 0.35) / 0.65));
    const color = t < 0.45 ? upper : lower;
    rect(img, 0, y, img.width, 1, color);
  }

  // Broad pixel haze near the horizon keeps the full backdrop from reading as flat black.
  for (let y = 112; y < img.height; y += 3) {
    const alpha = Math.max(28, 120 - (y - 112) * 2);
    rect(img, 0, y, img.width, 1, [C.nightHaze[0], C.nightHaze[1], C.nightHaze[2], alpha]);
  }

  const stars = [
    [18, 16, 1], [42, 36, 0], [73, 20, 1], [96, 58, 0], [126, 30, 1],
    [151, 72, 0], [178, 18, 1], [207, 45, 0], [238, 24, 1], [286, 52, 0],
    [28, 88, 0], [62, 118, 1], [111, 101, 0], [143, 132, 0], [191, 97, 1],
    [222, 126, 0], [268, 94, 0], [304, 118, 1], [12, 145, 0], [252, 151, 0],
  ];
  for (const [x, y, bright] of stars) {
    blendPixel(img, x, y, bright ? C.star : C.starDim);
    if (bright) {
      blendPixel(img, x - 1, y, C.starDim);
      blendPixel(img, x + 1, y, C.starDim);
      blendPixel(img, x, y - 1, C.starDim);
      blendPixel(img, x, y + 1, C.starDim);
    }
  }

  circle(img, 270, 34, 13, C.moon);
  circle(img, 276, 30, 12, C.nightMid);
  return img;
}

function skyline(kind) {
  const img = makeImage(320, kind === 'far' ? 360 : 440);
  const base = img.height - 4;
  const color = kind === 'far' ? C.skylineFar : C.skylineMid;
  const accent = kind === 'far' ? [255, 204, 68, 35] : [255, 204, 68, 55];
  let x = 0;
  let i = 0;
  while (x < 320) {
    const w = kind === 'far' ? 24 + (i % 5) * 9 : 32 + (i % 6) * 12;
    const minH = kind === 'far' ? 150 : 220;
    const rangeH = kind === 'far' ? 145 : 165;
    const h = minH + (i * (kind === 'far' ? 29 : 37)) % rangeH;
    rect(img, x, base - h, w, h, color);
    if (i % 3 === 0) rect(img, x + Math.floor(w / 2), base - h - 16, 3, 16, color);
    if (i % 4 === 1) rect(img, x + w - 10, base - h - 8, 6, 8, color);
    for (let wy = base - h + 18; wy < base - 12; wy += kind === 'far' ? 22 : 24) {
      for (let wx = x + 8; wx < x + w - 6; wx += kind === 'far' ? 13 : 16) {
        if ((wx + wy + i) % 4 === 0) rect(img, wx, wy, 2, 3, accent);
      }
    }
    x += w + (kind === 'far' ? 8 : 10);
    i++;
  }
  return img;
}

function facadeTile() {
  const img = makeImage(64, 64, C.buildingA);
  rect(img, 0, 0, 64, 64, C.buildingA);
  rect(img, 31, 0, 2, 64, C.buildingB);
  for (let y = 10; y < 58; y += 18) {
    for (let x = 8; x < 60; x += 18) {
      if ((x + y) % 3 !== 0) rect(img, x, y, 5, 7, C.windowDim);
    }
  }
  return img;
}

function rooftopCap() {
  const img = makeImage(64, 12);
  rect(img, 0, 0, 64, 2, C.roofLight);
  rect(img, 0, 2, 64, 6, C.roof);
  rect(img, 0, 8, 64, 4, C.roofDark);
  for (let x = 5; x < 64; x += 13) blendPixel(img, x, 3, [255, 236, 190, 130]);
  return img;
}

function coin() {
  const img = makeImage(24, 24);
  circle(img, 12, 12, 10, C.ink);
  circle(img, 12, 12, 8, C.coin);
  rect(img, 10, 5, 4, 14, C.coinDark);
  rect(img, 7, 8, 10, 2, C.cream);
  rect(img, 8, 14, 8, 2, [255, 236, 120, 255]);
  return img;
}

function pigeon(w = 28, h = 22) {
  const img = makeImage(32, 32);
  ellipse(img, 15, 19, 12, 8, C.ink);
  ellipse(img, 15, 18, 10, 7, C.pigeon);
  circle(img, 22, 13, 6, C.ink);
  circle(img, 22, 13, 5, C.pigeon);
  rect(img, 26, 13, 5, 3, C.orange);
  rect(img, 21, 11, 2, 2, C.white);
  rect(img, 22, 11, 1, 1, C.ink);
  rect(img, 6, 18, 9, 5, C.pigeonDark);
  rect(img, 11, 26, 2, 4, C.orange);
  rect(img, 20, 26, 2, 4, C.orange);
  return cropToCanvas(img, w, h);
}

function rat() {
  const img = makeImage(28, 20);
  ellipse(img, 13, 12, 11, 6, C.ink);
  ellipse(img, 13, 11, 10, 5, C.rat);
  rect(img, 22, 10, 5, 3, C.rat);
  line(img, 3, 13, 0, 16, C.ink);
  rect(img, 19, 8, 2, 2, C.white);
  rect(img, 20, 8, 1, 1, C.ink);
  return img;
}

function raccoon(charging = false) {
  const img = makeImage(36, 28);
  ellipse(img, 18, 16, 14, 9, C.ink);
  ellipse(img, 18, 15, 12, 8, charging ? C.danger : C.raccoon);
  circle(img, 24, 10, 7, C.ink);
  circle(img, 24, 10, 6, C.raccoon);
  rect(img, 19, 8, 10, 4, C.ink2);
  rect(img, 21, 9, 2, 2, C.white);
  rect(img, 27, 9, 2, 2, C.white);
  line(img, 6, 15, 0, charging ? 9 : 20, C.ink);
  rect(img, 8, 23, 4, 3, C.ink);
  rect(img, 24, 23, 4, 3, C.ink);
  return img;
}

function acUnit() {
  const img = makeImage(36, 28);
  outlineRect(img, 2, 3, 31, 22, C.metal, C.ink);
  rect(img, 6, 7, 23, 3, C.metalDark);
  rect(img, 6, 13, 23, 3, C.metalDark);
  rect(img, 6, 19, 23, 3, C.metalDark);
  rect(img, 28, 3, 5, 22, [203, 213, 225, 255]);
  return img;
}

function satelliteDish() {
  const img = makeImage(36, 28);
  ellipse(img, 18, 12, 14, 8, C.ink);
  ellipse(img, 18, 11, 12, 6, C.metal);
  rect(img, 17, 17, 4, 7, C.ink);
  rect(img, 11, 23, 15, 3, C.metalDark);
  line(img, 24, 10, 31, 5, C.ink);
  return img;
}

function neon(on = true) {
  const img = makeImage(18, 36);
  outlineRect(img, 4, 3, 10, 28, on ? C.neon : [55, 17, 34, 255], C.ink);
  rect(img, 1, 14, 4, 3, C.metalDark);
  if (on) {
    rect(img, 7, 8, 4, 10, C.danger);
    rect(img, 8, 19, 3, 8, C.cream);
  }
  return img;
}

function clothesline() {
  const img = makeImage(96, 24);
  line(img, 0, 4, 95, 4, C.ink);
  line(img, 0, 5, 95, 5, C.white);
  rect(img, 18, 6, 8, 11, [239, 68, 68, 255]);
  rect(img, 39, 6, 9, 12, [59, 130, 246, 255]);
  rect(img, 62, 6, 8, 10, [34, 197, 94, 255]);
  return img;
}

function fireEscape() {
  const img = makeImage(64, 28);
  rect(img, 0, 8, 64, 3, C.ink);
  rect(img, 0, 11, 64, 3, C.metalDark);
  for (let x = 4; x < 64; x += 10) rect(img, x, 2, 2, 18, C.metal);
  line(img, 4, 2, 60, 2, C.metal);
  return img;
}

function powerup(color, icon) {
  const img = makeImage(28, 28);
  circle(img, 14, 14, 12, C.ink);
  circle(img, 14, 14, 10, color);
  if (icon === 'triple') {
    rect(img, 8, 17, 3, 3, C.white);
    rect(img, 13, 13, 3, 7, C.white);
    rect(img, 18, 9, 3, 11, C.white);
  } else if (icon === 'glide') {
    line(img, 6, 12, 14, 7, C.white);
    line(img, 14, 7, 22, 12, C.white);
    rect(img, 13, 8, 2, 11, C.white);
  } else {
    outlineRect(img, 9, 7, 10, 13, C.white, C.ink2);
    rect(img, 11, 9, 6, 7, color);
  }
  return img;
}

function steamPuff() {
  const img = makeImage(32, 24);
  circle(img, 10, 14, 6, C.steam);
  circle(img, 17, 10, 7, C.steam);
  circle(img, 23, 15, 5, C.steam);
  rect(img, 8, 17, 18, 3, C.steam);
  return img;
}

function shieldBubble() {
  const img = makeImage(48, 48);
  circle(img, 24, 24, 22, [168, 85, 247, 70]);
  for (let x = 10; x <= 38; x++) {
    blendPixel(img, x, 5, [248, 250, 252, 160]);
    blendPixel(img, x, 43, [168, 85, 247, 130]);
  }
  return img;
}

function feather() {
  const img = makeImage(20, 12);
  ellipse(img, 10, 6, 9, 4, C.ink);
  ellipse(img, 10, 6, 8, 3, C.white);
  line(img, 3, 7, 17, 5, C.pigeonDark);
  return img;
}

function boss(state = 'idle') {
  const img = makeImage(80, 64);
  const body = state === 'hit' ? [196, 181, 253, 255] : state === 'defeat' ? C.pigeonDark : C.pigeon;
  ellipse(img, 38, 36, 28, 18, C.ink);
  ellipse(img, 38, 34, 25, 16, body);
  circle(img, 54, 24, 13, C.ink);
  circle(img, 54, 24, 11, body);
  rect(img, 59, 23, 11, 5, C.orange);
  rect(img, 48, 17, 5, 5, C.white);
  rect(img, 60, 17, 5, 5, state === 'hit' ? C.danger : C.white);
  rect(img, 50, 18, 2, 2, C.ink);
  rect(img, 62, 18, 2, 2, C.ink);
  rect(img, 39, 5, 5, 11, C.coin);
  rect(img, 33, 10, 18, 4, C.coinDark);
  if (state === 'attack' || state === 'swoop') {
    line(img, 15, 28, 0, 12, C.ink);
    line(img, 16, 29, 5, 14, body);
  }
  if (state === 'landed') {
    rect(img, 25, 51, 5, 7, C.orange);
    rect(img, 48, 51, 5, 7, C.orange);
  }
  if (state === 'defeat') {
    rect(img, 48, 21, 7, 2, C.ink);
    rect(img, 60, 21, 7, 2, C.ink);
  }
  return img;
}

function cropToCanvas(src, width, height) {
  const img = makeImage(width, height);
  stamp(img, src, Math.floor((width - src.width) / 2), Math.floor((height - src.height) / 2));
  return img;
}

function catFrame(frame) {
  const img = makeImage(64, 64);
  const state = frame < 2 ? 'idle'
    : frame < 8 ? 'run'
      : frame < 10 ? 'jump'
        : frame < 12 ? 'fall'
          : frame < 15 ? 'stomp'
            : frame < 18 ? 'glide'
              : frame < 21 ? 'hurt'
                : frame < 25 ? 'victory'
                  : frame < 28 ? 'defeat'
                    : 'power';

  const runPhase = frame % 4;
  const bob = state === 'run' ? (runPhase % 2 === 0 ? 1 : -1) : state === 'jump' ? -4 : state === 'fall' ? 2 : 0;
  const squash = state === 'stomp';
  const cx = 32;
  const ground = 58;

  if (state === 'glide') {
    line(img, 12, 30, 30, 22, C.green);
    line(img, 34, 22, 52, 30, C.green);
    rect(img, 13, 30, 38, 3, C.ink);
  }

  const bodyY = ground - (squash ? 20 : 24) + bob;
  ellipse(img, cx, bodyY + 8, squash ? 16 : 13, squash ? 8 : 12, C.ink);
  ellipse(img, cx, bodyY + 7, squash ? 14 : 11, squash ? 6 : 10, state === 'hurt' ? C.cheek : C.cat);
  circle(img, cx, bodyY - 8, 13, C.ink);
  circle(img, cx, bodyY - 8, 11, state === 'defeat' ? C.catLight : C.cat);

  line(img, 24, bodyY - 18, 19, bodyY - 29, C.ink);
  line(img, 25, bodyY - 18, 21, bodyY - 27, C.cat);
  line(img, 40, bodyY - 18, 45, bodyY - 29, C.ink);
  line(img, 39, bodyY - 18, 43, bodyY - 27, C.cat);

  rect(img, 26, bodyY - 12, 4, 4, C.white);
  rect(img, 38, bodyY - 12, 4, 4, C.white);
  if (state === 'defeat') {
    line(img, 26, bodyY - 12, 30, bodyY - 8, C.ink);
    line(img, 30, bodyY - 12, 26, bodyY - 8, C.ink);
    line(img, 38, bodyY - 12, 42, bodyY - 8, C.ink);
    line(img, 42, bodyY - 12, 38, bodyY - 8, C.ink);
  } else {
    rect(img, 28, bodyY - 11, 2, 2, C.ink);
    rect(img, 40, bodyY - 11, 2, 2, C.ink);
  }
  rect(img, 32, bodyY - 5, 2, 2, C.ink);
  rect(img, 23, bodyY - 6, 3, 2, C.cheek);
  rect(img, 43, bodyY - 6, 3, 2, C.cheek);

  if (state === 'victory') {
    line(img, 21, bodyY, 14, bodyY - 14, C.ink);
    line(img, 43, bodyY, 52, bodyY - 15, C.ink);
  } else if (state === 'power') {
    rect(img, 12, 14, 3, 3, C.coin);
    rect(img, 50, 16, 3, 3, C.blue);
    rect(img, 46, 44, 3, 3, C.green);
  } else {
    line(img, 21, bodyY + 3, 15, bodyY + 9, C.ink);
    line(img, 43, bodyY + 3, 49, bodyY + 8, C.ink);
  }

  const legShift = state === 'run' ? (runPhase < 2 ? 3 : -3) : 0;
  rect(img, 24 + legShift, ground - 8 + bob, 5, 8 - Math.max(0, bob), C.ink);
  rect(img, 37 - legShift, ground - 8 + bob, 5, 8 - Math.max(0, bob), C.ink);
  rect(img, 22 + legShift, ground - 2, 8, 3, C.ink);
  rect(img, 36 - legShift, ground - 2, 8, 3, C.ink);

  const tailY = bodyY + (state === 'hurt' ? 2 : -1);
  line(img, 43, bodyY + 5, 54, tailY, C.ink);
  line(img, 43, bodyY + 4, 53, tailY - 1, C.catLight);

  return img;
}

function heroSheet() {
  const img = makeImage(512, 256);
  for (let frame = 0; frame < 32; frame++) {
    stamp(img, catFrame(frame), (frame % 8) * 64, Math.floor(frame / 8) * 64);
  }
  return img;
}

async function main() {
  await save('environment/sky.png', sky());
  await save('environment/far-skyline.png', skyline('far'));
  await save('environment/mid-skyline.png', skyline('mid'));
  await save('environment/building-facade-tile.png', facadeTile());
  await save('environment/rooftop-cap.png', rooftopCap());
  await save('collectibles/coin.png', coin());
  await save('obstacles/pigeon.png', pigeon());
  await save('obstacles/rat.png', rat());
  await save('obstacles/raccoon-idle.png', raccoon(false));
  await save('obstacles/raccoon-charge.png', raccoon(true));
  await save('obstacles/ac-unit.png', acUnit());
  await save('obstacles/satellite-dish.png', satelliteDish());
  await save('obstacles/neon-sign-on.png', neon(true));
  await save('obstacles/neon-sign-off.png', neon(false));
  await save('obstacles/clothesline.png', clothesline());
  await save('entities/fire-escape.png', fireEscape());
  await save('fx/triple-jump-powerup.png', powerup(C.blue, 'triple'));
  await save('fx/glide-powerup.png', powerup(C.green, 'glide'));
  await save('fx/shield-powerup.png', powerup(C.purple, 'shield'));
  await save('fx/shield-bubble.png', shieldBubble());
  await save('fx/steam-puff.png', steamPuff());
  await save('fx/feather-projectile.png', feather());
  await save('boss/pigeon-king-idle.png', boss('idle'));
  await save('boss/pigeon-king-swoop.png', boss('swoop'));
  await save('boss/pigeon-king-landed.png', boss('landed'));
  await save('boss/pigeon-king-attack.png', boss('attack'));
  await save('boss/pigeon-king-hit.png', boss('hit'));
  await save('boss/pigeon-king-defeat.png', boss('defeat'));
  await save('hero/platformer-hero-sheet.png', heroSheet());
}

await main();
