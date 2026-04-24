import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = fileURLToPath(new URL('..', import.meta.url));
const assetRoot = join(repoRoot, 'assets', 'sprites', 'beach');

const C = {
  ink: '#273043',
  ink2: '#5b4b3d',
  skyTop: '#7fd7ff',
  skyLow: '#ffe7a1',
  sun: '#ffd951',
  sun2: '#ff9f43',
  ocean: '#1fb7d7',
  oceanDark: '#0e7ea0',
  foam: '#f7ffff',
  sand: '#f5c96b',
  sandDark: '#c58f3c',
  red: '#ef4444',
  orange: '#f97316',
  yellow: '#fde047',
  green: '#22c55e',
  blue: '#3b82f6',
  purple: '#8b5cf6',
  white: '#fff7e6',
};

function svg(width, height, body, defs = '') {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img">
<defs>${defs}</defs>
${body}
</svg>
`;
}

function ellipse(cx, cy, rx, ry, fill, stroke = C.ink, sw = 18, extra = '') {
  return `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="${fill}" stroke="${stroke}" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round" ${extra}/>`;
}

function path(d, fill, stroke = C.ink, sw = 18, extra = '') {
  return `<path d="${d}" fill="${fill}" stroke="${stroke}" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round" ${extra}/>`;
}

function circle(cx, cy, r, fill, stroke = C.ink, sw = 18, extra = '') {
  return `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${fill}" stroke="${stroke}" stroke-width="${sw}" ${extra}/>`;
}

function rect(x, y, w, h, fill, stroke = 'none', sw = 0, extra = '') {
  return `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${fill}" stroke="${stroke}" stroke-width="${sw}" ${extra}/>`;
}

function beachball() {
  return svg(1024, 1024, `
${ellipse(512, 840, 260, 42, 'rgba(39,48,67,0.16)', 'none', 0)}
${circle(512, 512, 310, '#fffaf0', C.ink, 26)}
<g clip-path="url(#ballClip)">
  ${rect(202, 202, 620, 620, '#fffaf0')}
  ${path('M512 202 C396 270 318 390 314 522 C318 652 398 760 512 822 C452 660 448 362 512 202Z', '#fde047', 'none', 0)}
  ${path('M512 202 C620 252 706 364 724 490 C642 462 560 468 500 512 C468 394 478 282 512 202Z', '#ef4444', 'none', 0)}
  ${path('M724 490 C750 632 666 764 512 822 C568 662 558 568 500 512 C560 468 642 462 724 490Z', '#3b82f6', 'none', 0)}
  ${path('M512 822 C394 760 318 652 314 522 C386 492 450 492 500 512 C558 568 568 662 512 822Z', '#f97316', 'none', 0)}
  ${circle(512, 512, 310, 'url(#ballShade)', 'none', 0)}
</g>
${path('M512 202 C452 362 452 660 512 822 M512 202 C620 252 706 364 724 490 C750 632 666 764 512 822 M314 522 C386 492 450 492 500 512 C558 568 568 662 512 822', 'none', C.ink, 16)}
${path('M500 512 C560 468 642 462 724 490', 'none', C.ink, 16)}
${circle(512, 512, 310, 'none', C.ink, 26)}
${circle(548, 428, 34, '#fff7d6', C.ink, 10)}
${ellipse(414, 364, 68, 44, '#ffffff', 'none', 0, 'opacity="0.46"')}
`, `<clipPath id="ballClip"><circle cx="512" cy="512" r="310"/></clipPath><radialGradient id="ballShade" cx="36%" cy="28%" r="78%"><stop offset="0" stop-color="#ffffff" stop-opacity="0.28"/><stop offset="0.62" stop-color="#ffffff" stop-opacity="0"/><stop offset="1" stop-color="#273043" stop-opacity="0.22"/></radialGradient>`);
}

function crab(variant = 1) {
  const shell = variant === 1 ? '#e94b4b' : '#f97316';
  return svg(1024, 1024, `
${ellipse(512, 560, 250, 170, shell)}
${circle(410, 430, 56, '#fffaf0', C.ink, 14)}
${circle(615, 430, 56, '#fffaf0', C.ink, 14)}
${circle(425, 435, 18, C.ink, C.ink, 8)}
${circle(600, 435, 18, C.ink, C.ink, 8)}
${path('M425 645 C470 690 555 690 605 645', 'none', C.ink, 18)}
${path('M320 520 C210 475 155 390 170 330 C185 270 260 260 290 315 C315 365 270 420 220 435', 'none', C.ink, 24)}
${path('M704 520 C814 475 869 390 854 330 C839 270 764 260 734 315 C709 365 754 420 804 435', 'none', C.ink, 24)}
${path('M300 630 L170 700 M370 700 L250 810 M655 700 L775 810 M724 630 L854 700', 'none', C.ink, 24)}
${ellipse(512, 770, 250, 42, 'rgba(39,48,67,0.14)', 'none', 0)}
`);
}

function seagull(variant = 1) {
  const wing = variant === 1 ? '#f8fafc' : '#dbeafe';
  return svg(1024, 1024, `
${path('M155 520 C300 355 440 355 512 500 C584 355 724 355 869 520 C740 475 640 505 555 620 C535 650 489 650 469 620 C384 505 284 475 155 520Z', wing, C.ink, 22)}
${ellipse(512, 548, 115, 92, '#ffffff', C.ink, 18)}
${circle(592, 510, 34, '#ffffff', C.ink, 14)}
${path('M622 508 L710 480 L642 548Z', C.yellow, C.ink, 12)}
${circle(600, 502, 8, C.ink, C.ink, 4)}
${path('M450 620 L420 672 M525 630 L500 688', 'none', C.orange, 16)}
${ellipse(506, 720, 205, 30, 'rgba(39,48,67,0.12)', 'none', 0)}
`);
}

function sandcastle() {
  return svg(1024, 1024, `
${rect(250, 500, 524, 285, C.sand, C.ink, 18, 'rx="26"')}
${rect(180, 410, 160, 375, C.sand, C.ink, 18, 'rx="22"')}
${rect(684, 410, 160, 375, C.sand, C.ink, 18, 'rx="22"')}
${rect(392, 350, 240, 435, '#ffd37c', C.ink, 18, 'rx="26"')}
${path('M180 410 L220 340 L260 410 L300 340 L340 410Z', C.sand, C.ink, 18)}
${path('M392 350 L440 275 L488 350 L536 275 L584 350 L632 275 L632 350Z', '#ffd37c', C.ink, 18)}
${path('M684 410 L724 340 L764 410 L804 340 L844 410Z', C.sand, C.ink, 18)}
${path('M472 785 L472 655 C472 600 552 600 552 655 L552 785Z', C.sandDark, C.ink, 14)}
${circle(332, 595, 28, C.sandDark, C.ink, 10)}
${circle(692, 595, 28, C.sandDark, C.ink, 10)}
${ellipse(512, 825, 360, 44, 'rgba(39,48,67,0.14)', 'none', 0)}
`);
}

function palmTree() {
  return svg(1024, 1024, `
${path('M482 810 C520 650 545 470 512 270 L594 270 C615 490 590 660 555 825Z', '#a76731', C.ink, 18)}
${path('M500 350 L580 350 M492 455 L584 455 M477 575 L573 575 M455 700 L554 700', 'none', '#6b3f1d', 14)}
${path('M540 288 C620 130 800 130 890 240 C740 225 645 270 560 360Z', C.green, C.ink, 18)}
${path('M538 290 C485 120 310 100 190 220 C330 210 430 260 536 360Z', '#16a34a', C.ink, 18)}
${path('M530 288 C560 120 690 50 820 110 C685 170 610 250 548 365Z', '#2dd26f', C.ink, 18)}
${path('M520 288 C470 125 340 55 210 110 C348 170 420 250 500 365Z', '#22c55e', C.ink, 18)}
${circle(500, 302, 36, '#8b5a2b', C.ink, 10)}
${circle(552, 318, 34, '#8b5a2b', C.ink, 10)}
${ellipse(520, 840, 235, 34, 'rgba(39,48,67,0.14)', 'none', 0)}
`);
}

function tidepool() {
  return svg(1024, 512, `
${ellipse(512, 275, 390, 125, '#50d8f6', C.ink, 18)}
${ellipse(460, 250, 210, 55, '#b9fbff', 'none', 0)}
${path('M270 320 C365 380 635 380 760 310', 'none', '#0e7ea0', 18)}
${circle(285, 205, 22, '#fef3c7', C.ink, 8)}
${circle(730, 245, 18, '#fef3c7', C.ink, 8)}
`);
}

function coin() {
  return svg(512, 512, `
${circle(256, 256, 178, '#facc15', C.ink, 14)}
${circle(256, 256, 118, '#fde68a', '#d97706', 12)}
${path('M255 150 L286 222 L365 228 L304 278 L322 356 L255 314 L188 356 L206 278 L145 228 L224 222Z', '#f59e0b', '#92400e', 10)}
`);
}

function shell() {
  return svg(512, 512, `
${path('M92 340 C120 190 220 100 256 94 C292 100 392 190 420 340 C342 390 170 390 92 340Z', '#fff1c9', C.ink, 14)}
${path('M256 96 L256 378 M180 146 C220 220 230 300 220 370 M332 146 C292 220 282 300 292 370', 'none', '#d97706', 10)}
${path('M102 330 C190 300 322 300 410 330', 'none', '#d97706', 12)}
${ellipse(256, 386, 190, 24, 'rgba(39,48,67,0.12)', 'none', 0)}
`);
}

function sandProjectile() {
  return svg(512, 512, `
${path('M118 300 C120 195 210 112 318 126 C418 140 462 238 418 326 C350 425 180 408 118 300Z', '#d9953b', C.ink, 16)}
${path('M190 230 C245 175 335 185 372 260', 'none', '#f7d98b', 18)}
${circle(235, 290, 22, '#a16207', 'none', 0)}
${circle(322, 312, 18, '#a16207', 'none', 0)}
${path('M110 340 C66 360 54 406 78 438 C108 400 142 380 192 374Z', '#c1782d', C.ink, 12)}
`);
}

function powerup(kind) {
  const data = {
    speed: { color: C.blue, icon: 'M165 265 L275 120 L250 230 L352 230 L222 400 L248 282Z' },
    magnet: { color: C.purple, icon: 'M170 165 L230 165 L230 280 C230 330 282 330 282 280 L282 165 L342 165 L342 292 C342 420 170 420 170 292Z' },
    super: { color: C.green, icon: 'M256 110 L294 216 L406 220 L318 288 L350 398 L256 334 L162 398 L194 288 L106 220 L218 216Z' },
  }[kind];
  return svg(512, 512, `
${circle(256, 256, 190, data.color, C.ink, 16)}
${circle(256, 256, 142, '#ffffff', 'rgba(255,255,255,0.8)', 10, 'opacity="0.35"')}
${path(data.icon, '#ffffff', C.ink, 12)}
`);
}

function boat(sinking = false) {
  return svg(1248, 832, `
${path('M185 472 L1015 472 C955 642 310 642 236 472Z', sinking ? '#b45309' : '#ff8a18', C.ink, 24)}
${rect(520, 255, 78, 225, '#7c4a22', C.ink, 18)}
${path('M608 272 L890 438 L608 438Z', sinking ? '#fecaca' : '#fff7d6', C.ink, 20)}
${path('M508 278 L245 438 L508 438Z', '#ffffff', C.ink, 20)}
${path('M250 530 L960 530', 'none', '#fff3a3', 16)}
${path('M150 605 C300 660 455 555 610 605 C765 655 895 555 1110 605', 'none', C.foam, 30)}
${path('M160 636 C315 690 470 585 625 636 C790 690 920 585 1120 636', 'none', C.oceanDark, 18)}
${sinking ? path('M735 548 L850 668 M815 548 L930 668', 'none', '#ef4444', 30) : ''}
`);
}

function airplane(onFire = false) {
  return svg(1248, 832, `
${path('M230 420 C410 330 770 320 1000 390 C930 450 520 490 230 420Z', '#f8fafc', C.ink, 18)}
${path('M520 405 L370 260 L690 360Z', '#bfdbfe', C.ink, 16)}
${path('M600 440 L440 600 L770 470Z', '#93c5fd', C.ink, 16)}
${path('M930 382 L1050 300 L1020 430Z', '#ef4444', C.ink, 14)}
${circle(450, 420, 20, '#60a5fa', C.ink, 8)}
${circle(535, 412, 20, '#60a5fa', C.ink, 8)}
${circle(620, 405, 20, '#60a5fa', C.ink, 8)}
${onFire ? path('M180 425 C80 380 82 505 178 480 C138 545 270 535 250 455Z', C.orange, C.ink, 14) + path('M164 434 C122 418 135 476 178 458Z', C.yellow, 'none', 0) : ''}
`);
}

function surfer() {
  return svg(1024, 1024, `
${path('M205 710 C380 620 645 610 820 690 C650 775 360 790 205 710Z', '#fef3c7', C.ink, 18)}
${circle(508, 320, 48, '#f3b37a', C.ink, 12)}
${path('M465 382 C530 360 595 405 620 495', 'none', C.ink, 18)}
${path('M510 430 L410 575 M560 455 L660 580', 'none', C.ink, 18)}
${path('M435 570 L570 650 M645 575 L735 660', 'none', '#f3b37a', 18)}
${path('M155 760 C330 810 620 815 875 750', 'none', C.oceanDark, 26)}
`);
}

function jetski() {
  return svg(1024, 1024, `
${path('M215 620 C330 520 655 515 810 620 C690 700 360 710 215 620Z', C.red, C.ink, 18)}
${path('M390 560 C450 470 560 465 630 550', C.yellow, C.ink, 14)}
${circle(545, 380, 42, '#f3b37a', C.ink, 12)}
${path('M515 425 L455 540 M565 430 L640 540', 'none', C.ink, 18)}
${path('M145 705 C290 760 625 760 900 690', 'none', C.oceanDark, 28)}
`);
}

function boss(state) {
  const mood = {
    idle: {
      bodyA: '#d79a45',
      bodyB: '#8f5a25',
      eyes: '#fff3b0',
      pupil: '#2b1308',
      mouth: 'M414 652 C468 705 566 705 622 652',
      teeth: true,
      overlay: '',
    },
    attack: {
      bodyA: '#c67830',
      bodyB: '#6f351a',
      eyes: '#ffe45c',
      pupil: '#7f1d1d',
      mouth: 'M388 646 C450 548 586 548 652 646 C582 696 466 696 388 646Z',
      teeth: true,
      overlay: `${path('M720 605 C806 540 894 600 908 720', 'none', '#ef4444', 34)}${path('M304 606 C226 552 152 600 132 705', 'none', '#ef4444', 28)}`,
    },
    hit: {
      bodyA: '#f4a62f',
      bodyB: '#a35219',
      eyes: '#ffe45c',
      pupil: '#7f1d1d',
      mouth: 'M410 672 C474 628 562 628 626 672',
      teeth: false,
      overlay: `${path('M222 262 L134 170 M808 246 L906 154 M518 154 L530 44', 'none', '#ef4444', 30)}${circle(710, 326, 28, '#ef4444', 'none', 0, 'opacity="0.65"')}`,
    },
    defeat: {
      bodyA: '#9b6a38',
      bodyB: '#5b341e',
      eyes: '#d1d5db',
      pupil: '#111827',
      mouth: 'M408 678 C474 640 562 640 628 678',
      teeth: false,
      overlay: `${rect(220, 735, 585, 130, C.sand, C.ink2, 16, 'rx="65"')}${path('M270 760 C390 720 518 820 650 760 C715 735 760 745 818 770', 'none', '#f8d987', 22)}`,
    },
  }[state];
  const teeth = mood.teeth
    ? `${path('M452 666 L482 724 L512 668 L542 724 L574 666Z', '#fff7e6', C.ink2, 10)}`
    : '';
  return svg(1024, 1024, `
${ellipse(512, 858, 350, 54, 'rgba(39,48,67,0.23)', 'none', 0)}
${path('M142 820 C154 610 232 386 370 270 C438 214 520 184 612 214 C772 264 880 520 892 820 C748 900 306 902 142 820Z', 'url(#body)', C.ink, 28, 'filter="url(#grain)"')}
${path('M244 754 C298 648 388 614 476 692 C556 590 708 636 784 754 C690 812 352 818 244 754Z', 'url(#belly)', C.ink2, 14, 'opacity="0.96"')}
${path('M212 372 C120 316 82 238 112 180 C184 214 236 280 266 376Z', '#b87935', C.ink, 20)}
${path('M812 372 C904 316 942 238 912 180 C840 214 788 280 758 376Z', '#b87935', C.ink, 20)}
${path('M318 278 L282 128 L390 240 M708 278 L742 128 L634 240', '#c58f3c', C.ink, 18)}
${path('M242 540 C164 548 112 600 98 678 C172 646 228 644 288 676Z', '#c4863e', C.ink, 20)}
${path('M782 540 C860 548 912 600 926 678 C852 646 796 644 736 676Z', '#c4863e', C.ink, 20)}
${ellipse(386, 466, 74, 56, mood.eyes, C.ink, 16)}
${ellipse(638, 466, 74, 56, mood.eyes, C.ink, 16)}
${circle(402, 474, 22, mood.pupil, mood.pupil, 6)}
${circle(622, 474, 22, mood.pupil, mood.pupil, 6)}
${path('M324 388 C372 348 426 348 466 382', 'none', C.ink, 24)}
${path('M700 388 C652 348 598 348 558 382', 'none', C.ink, 24)}
${path(mood.mouth, state === 'attack' ? '#32170c' : 'none', C.ink, 22)}
${teeth}
${path('M238 815 C324 872 700 872 786 815', 'none', '#f2c769', 28, 'opacity="0.92"')}
${path('M326 340 C382 314 438 310 498 328 M540 328 C606 306 668 316 720 350 M330 575 C440 540 596 538 706 578', 'none', '#e8b66a', 12, 'opacity="0.58"')}
${circle(300, 690, 18, '#70421f', 'none', 0, 'opacity="0.24"')}
${circle(720, 710, 14, '#70421f', 'none', 0, 'opacity="0.22"')}
${circle(600, 282, 12, '#70421f', 'none', 0, 'opacity="0.22"')}
${mood.overlay}
`, `<radialGradient id="body" cx="45%" cy="32%" r="70%"><stop stop-color="${mood.bodyA}"/><stop offset="0.62" stop-color="#bd7a35"/><stop offset="1" stop-color="${mood.bodyB}"/></radialGradient><radialGradient id="belly" cx="50%" cy="35%" r="70%"><stop stop-color="#ffe0a0"/><stop offset="1" stop-color="#c58f3c"/></radialGradient><filter id="grain" x="-20%" y="-20%" width="140%" height="140%"><feTurbulence type="fractalNoise" baseFrequency="0.75" numOctaves="2" seed="${state.length + 8}" result="noise"/><feColorMatrix in="noise" type="saturate" values="0"/><feComponentTransfer><feFuncA type="table" tableValues="0 0.12"/></feComponentTransfer><feBlend in2="SourceGraphic" mode="multiply"/></filter>`);
}

function cloud(variant = 1) {
  const fill = variant === 1 ? '#f8fdff' : '#dff6ff';
  return svg(1024, 512, `
${path('M178 326 C188 258 246 214 320 220 C354 142 458 118 530 184 C588 150 682 168 724 238 C796 236 858 284 864 350 C774 392 308 398 178 326Z', fill, '#6eaec4', 18)}
${path('M270 304 C390 340 612 338 770 304', 'none', '#bdefff', 14)}
`);
}

const files = new Map([
  ['environment/sky.svg', svg(1344, 768, `
${rect(0, 0, 1344, 768, 'url(#sky)')}
${rect(0, 515, 1344, 98, 'url(#water)')}
${rect(0, 606, 1344, 30, C.foam)}
${rect(0, 636, 1344, 132, C.sand)}
${path('M0 660 C180 625 320 690 500 655 C710 615 875 690 1070 655 C1190 635 1280 646 1344 675 L1344 768 L0 768Z', '#eab85d', 'none', 0)}
`, `<linearGradient id="sky" x1="0" x2="0" y1="0" y2="1"><stop stop-color="${C.skyTop}"/><stop offset="0.68" stop-color="${C.skyLow}"/><stop offset="1" stop-color="${C.sand}"/></linearGradient><linearGradient id="water" x1="0" x2="1"><stop stop-color="${C.ocean}"/><stop offset="1" stop-color="${C.oceanDark}"/></linearGradient>`)],
  ['environment/sun.svg', svg(1024, 1024, `
${circle(512, 512, 250, '#ffd84f', '#e7892e', 34)}
${circle(438, 430, 42, '#fff0a4', 'none', 0, 'opacity="0.85"')}
${path('M512 210 L512 96 M512 928 L512 814 M210 512 L96 512 M928 512 L814 512 M298 298 L218 218 M726 298 L806 218 M298 726 L218 806 M726 726 L806 806', 'none', '#f59e0b', 52)}
`)],
  ['environment/cloud-1.svg', cloud(1)],
  ['environment/cloud-2.svg', cloud(2)],
  ['environment/ocean-tile.svg', svg(1536, 672, `${rect(0, 0, 1536, 672, 'url(#ocean)')}${path('M0 155 C180 100 310 210 500 155 C720 90 850 220 1050 160 C1240 105 1370 210 1536 160 L1536 672 L0 672Z', '#26c6da', 'none', 0, 'opacity="0.72"')}${path('M0 275 C205 220 365 330 560 275 C770 220 930 330 1150 275 C1330 232 1450 300 1536 275', 'none', '#e8ffff', 18)}${path('M0 430 C200 375 360 485 560 430 C760 375 930 485 1150 430 C1330 386 1450 455 1536 430', 'none', '#b8f5ff', 14)}`, `<linearGradient id="ocean" x1="0" x2="0" y1="0" y2="1"><stop stop-color="${C.ocean}"/><stop offset="1" stop-color="${C.oceanDark}"/></linearGradient>`)],
  ['environment/waterline-foam.svg', svg(1536, 192, `${rect(0, 0, 1536, 192, C.foam)}${path('M0 68 C160 18 300 118 460 68 C620 18 760 118 920 68 C1080 18 1220 118 1380 68 C1440 48 1490 48 1536 68 L1536 192 L0 192Z', '#d7fbff', 'none', 0)}${path('M0 95 C180 150 315 45 500 95 C700 150 850 45 1050 95 C1240 145 1380 50 1536 95', 'none', C.ocean, 14)}`)],
  ['environment/sand-tile.svg', svg(1536, 672, `${rect(0, 0, 1536, 672, C.sand)}${path('M0 115 C210 70 385 160 590 115 C795 70 970 160 1180 115 C1335 82 1450 100 1536 125', 'none', '#e9b65a', 18)}${path('M0 355 C240 315 420 400 660 355 C900 315 1080 400 1320 355 C1405 340 1475 340 1536 355', 'none', '#ffe19c', 16)}${circle(290, 255, 12, C.sandDark, 'none', 0)}${circle(520, 465, 9, C.sandDark, 'none', 0)}${circle(860, 215, 10, C.sandDark, 'none', 0)}${circle(1260, 505, 11, C.sandDark, 'none', 0)}`)],
  ['obstacles/crab-1.svg', crab(1)],
  ['obstacles/crab-2.svg', crab(2)],
  ['obstacles/seagull-1.svg', seagull(1)],
  ['obstacles/seagull-2.svg', seagull(2)],
  ['obstacles/beachball.svg', beachball()],
  ['obstacles/sandcastle.svg', sandcastle()],
  ['obstacles/palm-tree.svg', palmTree()],
  ['obstacles/tidepool.svg', tidepool()],
  ['collectibles/coin.svg', coin()],
  ['collectibles/shell.svg', shell()],
  ['fx/sand-projectile.svg', sandProjectile()],
  ['fx/speed-powerup.svg', powerup('speed')],
  ['fx/magnet-powerup.svg', powerup('magnet')],
  ['fx/super-size-powerup.svg', powerup('super')],
  ['fx/shell-projectile.svg', shell()],
  ['entities/boat.svg', boat(false)],
  ['entities/boat-sinking.svg', boat(true)],
  ['entities/airplane.svg', airplane(false)],
  ['entities/airplane-fire.svg', airplane(true)],
  ['entities/surfer.svg', surfer()],
  ['entities/jetski.svg', jetski()],
  ['boss/sand-monster-idle.svg', boss('idle')],
  ['boss/sand-monster-attack.svg', boss('attack')],
  ['boss/sand-monster-hit.svg', boss('hit')],
  ['boss/sand-monster-defeat.svg', boss('defeat')],
]);

for (const [relativePath, contents] of files) {
  const target = join(assetRoot, relativePath);
  await mkdir(dirname(target), { recursive: true });
  await writeFile(target, contents, 'utf8');
}

console.log(`Wrote ${files.size} Beach art assets to ${assetRoot}`);
