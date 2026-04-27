#!/usr/bin/env node
import { access, mkdir, readFile, writeFile } from 'node:fs/promises';
import { constants } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = fileURLToPath(new URL('..', import.meta.url));

const LEVELS = [
  { number: 1, id: 'BEACH', name: 'Sunny Shore', genre: 'runner', slug: 'beach', assetSlug: 'beach' },
  { number: 2, id: 'ROOFTOPS', name: 'City Heights', genre: 'platformer', slug: 'city-heights', assetSlug: 'rooftops' },
  { number: 3, id: 'KITCHEN', name: 'Countertop Chaos', genre: 'launcher', slug: 'countertop-chaos', assetSlug: 'kitchen' },
  { number: 4, id: 'SPACE', name: 'Cardboard Cosmos', genre: 'shooter', slug: 'cardboard-cosmos', assetSlug: 'space' },
  { number: 5, id: 'YARN', name: 'Yarn Ball Bounce', genre: 'breakout', slug: 'yarn-ball-bounce', assetSlug: 'yarn' },
  { number: 6, id: 'STREET', name: 'Busy Crossing', genre: 'frogger', slug: 'busy-crossing', assetSlug: 'street' },
  { number: 7, id: 'GARDEN_WHACK', name: 'Garden Patrol', genre: 'whack', slug: 'garden-patrol', assetSlug: 'garden-whack' },
  { number: 8, id: 'GARDEN_SNAKE', name: 'Garden Snake', genre: 'snake', slug: 'garden-snake', assetSlug: 'garden-snake' },
  { number: 9, id: 'CAT_TREE', name: 'The Cat Tree', genre: 'climber', slug: 'cat-tree', assetSlug: 'cat-tree' },
];

const GENRE_PROFILES = {
  runner: {
    coreMechanic: 'auto-run, jump/duck obstacle reading, collectible buildup, and boss projectile exchange',
    promptPhrase: 'side-view auto-runner arcade game asset with strong foreground/background separation',
    readabilityFocus: [
      'Foreground hazards must read before they reach the player because the camera auto-scrolls.',
      'Ground contact, jump arc, duck silhouette, and boss attack tells must be visible at speed.',
    ],
    assetFamilies: [
      'environment tiles and parallax layers',
      'ground obstacles, airborne hazards, collectibles, power-ups, projectiles',
      'boss idle/attack/hit/defeat states',
    ],
    promptFamilies: [
      'runner ground-lane hazards with clear baselines',
      'airborne threats that do not disappear into the sky band',
      'boss tells and projectile shapes that read during motion',
    ],
    heroStates: ['idle', 'run loop', 'jump rise', 'jump fall', 'duck', 'hurt', 'attack/throw', 'victory', 'defeat'],
    resolverConcerns: ['terminal states beat feedback', 'hurt/attack beat locomotion', 'airborne split uses vertical velocity', 'duck beats run'],
    qaFocus: ['jump timing', 'duck hitbox feel', 'obstacle recognition at speed', 'boss prompt/ammo clarity'],
  },
  platformer: {
    coreMechanic: 'left/right movement, variable-height jumping, stomps, secondary platforms, and camera-follow traversal',
    promptPhrase: 'side-view platformer arcade game asset with readable collision surfaces and rooftop traversal depth',
    readabilityFocus: [
      'Walkable rooftop edges must be more readable than decorative facades.',
      'Enemy stomp silhouettes, jump targets, and hazard timing tells must remain clear while the camera follows the player.',
    ],
    assetFamilies: [
      'rooftop/building surfaces, facades, skyline layers, attached secondary platforms',
      'stompable enemies, timed hazards, traversal aids, power-ups',
      'boss arena props, boss states, projectiles, and health/readability support',
    ],
    promptFamilies: [
      'walkable rooftop surfaces with distinct edges',
      'stompable rooftop enemy silhouettes',
      'hazards with clear safe/unsafe animation states',
      'secondary platforms that read as usable without looking like background decoration',
    ],
    heroStates: ['idle', 'run left/right', 'jump rise', 'fall', 'land/stomp', 'glide or power-up action', 'hurt', 'victory', 'defeat'],
    resolverConcerns: ['terminal states beat feedback', 'hurt beats action', 'stomp/land feedback beats fall', 'jump/fall beats run', 'facing direction must be deterministic'],
    qaFocus: ['platform edge clarity', 'jump arc and landing feel', 'stomp vs side-hit readability', 'boss arena camera lock'],
  },
  launcher: {
    coreMechanic: 'pull/aim/release slingshot shots, trajectory preview, destructible structures, and round resolution',
    promptPhrase: 'side-view physics launcher arcade game asset with clean silhouettes for aiming and destruction',
    readabilityFocus: [
      'Launch angle, projectile identity, material types, and target structure damage must be distinguishable while aiming.',
      'Round success/failure should read from the structure state, not only from score text.',
    ],
    assetFamilies: ['kitchen backdrop', 'launcher base', 'projectiles/treats', 'material blocks', 'targets', 'impact/debris FX'],
    promptFamilies: ['projectiles with readable spin/weight', 'block materials with distinct color/material language', 'targets with clear hit states'],
    heroStates: ['idle', 'aim/pull', 'strain/hold', 'release', 'celebrate hit', 'hurt/fail', 'victory', 'defeat'],
    resolverConcerns: ['aim-hold must be stable', 'release is a short one-shot', 'round-end reactions should not interrupt active aiming'],
    qaFocus: ['trajectory preview contrast', 'drag input feel', 'material readability', 'round transition clarity'],
  },
  shooter: {
    coreMechanic: 'free horizontal movement, continuous firing, enemy wave dodging, projectile readability, and boss phases',
    promptPhrase: 'arcade shooter game asset with high-contrast bullets, enemy waves, and boss tells',
    readabilityFocus: [
      'Player bullets, enemy bullets, pickups, and enemy bodies must have separate color languages.',
      'Boss attacks need visible anticipation so dodging is fair.',
    ],
    assetFamilies: ['space/backdrop layers', 'player ship/cat craft', 'enemy waves', 'bullets', 'pickup/score items', 'boss states'],
    promptFamilies: ['player projectile and enemy projectile pairs with distinct silhouettes', 'enemy wave variants', 'boss phase tell states'],
    heroStates: ['idle/fly', 'bank left', 'bank right', 'fire', 'hit', 'power-up', 'victory', 'defeat'],
    resolverConcerns: ['hit beats fire', 'banking reflects input direction', 'fire can overlay movement if supported'],
    qaFocus: ['bullet contrast', 'enemy wave density', 'boss tell fairness', 'screen clutter under power-ups'],
  },
  breakout: {
    coreMechanic: 'paddle positioning, ball bounce prediction, brick damage, power-up catches, and clear-all victory',
    promptPhrase: 'arcade breakout game asset with readable paddle, ball, brick damage states, and impact feedback',
    readabilityFocus: [
      'Ball visibility is the top priority; decorative art must never compete with the ball.',
      'Brick health/damage states and paddle bounds must be readable at a glance.',
    ],
    assetFamilies: ['playfield backdrop', 'paddle/hero', 'ball/yarn', 'brick states', 'power-ups', 'impact/clear FX'],
    promptFamilies: ['high-contrast ball/yarn asset', 'brick families with damage states', 'paddle states with clear hit area'],
    heroStates: ['idle', 'move left/right', 'hit/rebound', 'catch/power-up', 'hurt/miss', 'victory', 'defeat'],
    resolverConcerns: ['hit feedback is short', 'miss/defeat beats movement', 'power-up state must not hide paddle bounds'],
    qaFocus: ['ball contrast', 'paddle hitbox feel', 'brick damage readability', 'multi-ball or power-up clutter'],
  },
  frogger: {
    coreMechanic: 'grid hopping, lane timing, riding safe movers, avoiding traffic/water hazards, and goal crossings',
    promptPhrase: 'top-down or shallow side-view lane-crossing arcade asset with clear grid/lane readability',
    readabilityFocus: [
      'Safe lanes, danger lanes, rideable movers, and goal cells must be visually distinct.',
      'Grid hops need precise destination clarity before the player commits.',
    ],
    assetFamilies: ['lane backgrounds', 'traffic hazards', 'rideable movers', 'goal markers', 'splash/hit FX'],
    promptFamilies: ['road and water lane tiles', 'hazard vehicles with direction clarity', 'rideable objects distinct from hazards'],
    heroStates: ['idle', 'hop up/down/left/right', 'ride', 'reach goal', 'hit/splash', 'victory', 'defeat'],
    resolverConcerns: ['hop direction must match last input', 'ride state must not mask hazards', 'hit/splash beats movement'],
    qaFocus: ['lane alignment', 'input buffering', 'rideable vs hazard distinction', 'timer/goal feedback'],
  },
  whack: {
    coreMechanic: 'rapid target recognition, click/tap accuracy, combo timing, decoys, and boss vulnerability windows',
    promptPhrase: 'arcade whack-a-mole game asset with readable target states and fast tap/click feedback',
    readabilityFocus: [
      'Targets, decoys, holes, timers, and boss vulnerability states must read instantly.',
      'Hit/miss feedback must be strong without covering adjacent targets.',
    ],
    assetFamilies: ['garden board/holes', 'target variants', 'decoys', 'mallet/paw effects', 'boss states', 'combo FX'],
    promptFamilies: ['target pop-up states', 'decoy silhouettes that differ from valid targets', 'boss vulnerable/invulnerable tells'],
    heroStates: ['idle', 'wind-up', 'strike', 'hit-confirm', 'miss', 'hurt/penalty', 'victory', 'defeat'],
    resolverConcerns: ['strike one-shot timing must align with input', 'hit-confirm beats idle', 'boss vulnerability state must stay visible'],
    qaFocus: ['target contrast', 'tap hit areas', 'combo readability', 'boss invulnerability tells'],
  },
  snake: {
    coreMechanic: 'grid turning, growth, self-collision avoidance, item routing, speed escalation, and finale survival',
    promptPhrase: 'grid-based arcade snake game asset with crisp tile readability and directional character states',
    readabilityFocus: [
      'Head direction, body path, pickups, walls, and enemy patrols must read tile-by-tile.',
      'Speed escalation should not hide the next-turn decision.',
    ],
    assetFamilies: ['grid tiles', 'snake head/body/tail', 'pickups', 'walls/obstacles', 'patrol enemies', 'finale FX'],
    promptFamilies: ['directional head/body/tail tiles', 'pickup icons distinct from hazards', 'wall tiles with clear blocked cells'],
    heroStates: ['head up/down/left/right', 'turns', 'body/tail', 'eat', 'hit', 'victory', 'defeat'],
    resolverConcerns: ['directional state is authoritative', 'eat feedback must not change grid occupancy ambiguity', 'collision beats movement'],
    qaFocus: ['tile alignment', 'direction changes', 'growth readability', 'speed escalation fairness'],
  },
  climber: {
    coreMechanic: 'vertical auto-bounce, platform targeting, falling recovery, special platform effects, and summit transition',
    promptPhrase: 'vertical climber arcade game asset with readable platforms, bounce targets, and upward depth',
    readabilityFocus: [
      'Next reachable platforms must be visible and distinct from decorative background.',
      'Special platform states need simple color/shape language because the camera scrolls upward.',
    ],
    assetFamilies: ['vertical backdrop layers', 'platform variants', 'special surfaces', 'collectibles', 'summit/finale assets', 'fall/hit FX'],
    promptFamilies: ['platform variants with clear gameplay meaning', 'vertical background layers that do not compete with platforms', 'summit/finale visual reward'],
    heroStates: ['idle', 'bounce up', 'fall', 'land/squash', 'cling or special platform action', 'hurt/fall', 'victory', 'defeat'],
    resolverConcerns: ['vertical velocity controls rise/fall', 'land feedback is short', 'terminal fall beats bounce'],
    qaFocus: ['platform contrast', 'bounce target clarity', 'camera lead', 'summit transition readability'],
  },
};

const TEMPLATE_SPECS = [
  {
    template: 'level-art-brief.template.md',
    outputName: (level) => `level-${level.number}-${level.slug}-visual-brief.md`,
  },
  {
    template: 'level-prompt-pack.template.md',
    outputName: (level) => `level-${level.number}-${level.slug}-prompt-pack.md`,
  },
  {
    template: 'level-asset-inventory.template.md',
    outputName: (level) => `level-${level.number}-${level.slug}-asset-inventory.md`,
  },
  {
    template: 'genre-hero-sheet-contract.template.md',
    outputName: (level) => `level-${level.number}-${level.genre}-hero-sheet-contract.md`,
  },
  {
    template: 'level-qa-checklist.template.md',
    outputName: (level) => `level-${level.number}-${level.slug}-qa-checklist.md`,
  },
];

const ASSET_SUBDIRS = ['environment', 'obstacles', 'collectibles', 'entities', 'boss', 'hero', 'fx'];

function parseArgs(argv) {
  const args = {
    level: null,
    all: false,
    dryRun: false,
    force: false,
    list: false,
  };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--level') {
      args.level = argv[i + 1];
      i += 1;
    } else if (arg.startsWith('--level=')) {
      args.level = arg.slice('--level='.length);
    } else if (arg === '--all') {
      args.all = true;
    } else if (arg === '--dry-run') {
      args.dryRun = true;
    } else if (arg === '--force') {
      args.force = true;
    } else if (arg === '--list') {
      args.list = true;
    } else {
      throw new Error(`Unknown argument "${arg}"`);
    }
  }

  return args;
}

function findLevel(levelId) {
  const normalized = levelId.toUpperCase();
  return LEVELS.find((level) => level.id === normalized);
}

function titleCase(value) {
  return value.replace(/(^|[-_ ])([a-z])/g, (_match, prefix, char) => `${prefix}${char.toUpperCase()}`);
}

function bulletList(items) {
  return items.map((item) => `- ${item}`).join('\n');
}

function replacementMap(level) {
  const profile = GENRE_PROFILES[level.genre];
  const visualBriefDoc = `level-${level.number}-${level.slug}-visual-brief.md`;
  const promptPackDoc = `level-${level.number}-${level.slug}-prompt-pack.md`;
  const assetInventoryDoc = `level-${level.number}-${level.slug}-asset-inventory.md`;
  const heroContractDoc = `level-${level.number}-${level.genre}-hero-sheet-contract.md`;
  const qaChecklistDoc = `level-${level.number}-${level.slug}-qa-checklist.md`;

  return {
    LEVEL_ID: level.id,
    LEVEL_NUMBER: String(level.number),
    LEVEL_NAME: level.name,
    LEVEL_SLUG: level.slug,
    ASSET_SLUG: level.assetSlug,
    GENRE: level.genre,
    GENRE_TITLE: titleCase(level.genre),
    ASSET_CONST_PREFIX: level.id.replace(/[^A-Z0-9]/g, '_'),
    VISUAL_BRIEF_DOC: visualBriefDoc,
    PROMPT_PACK_DOC: promptPackDoc,
    ASSET_INVENTORY_DOC: assetInventoryDoc,
    HERO_CONTRACT_DOC: heroContractDoc,
    QA_CHECKLIST_DOC: qaChecklistDoc,
    CORE_MECHANIC: profile.coreMechanic,
    GENRE_PROMPT_PHRASE: profile.promptPhrase,
    GENRE_READABILITY_FOCUS: bulletList(profile.readabilityFocus),
    GENRE_ASSET_FAMILIES: bulletList(profile.assetFamilies),
    GENRE_PROMPT_FAMILIES: bulletList(profile.promptFamilies),
    GENRE_HERO_STATES: bulletList(profile.heroStates),
    GENRE_RESOLVER_CONCERNS: bulletList(profile.resolverConcerns),
    GENRE_QA_FOCUS: bulletList(profile.qaFocus),
  };
}

function render(template, replacements) {
  return template.replace(/\{\{([A-Z0-9_]+)\}\}/g, (match, key) => {
    if (!(key in replacements)) {
      throw new Error(`No replacement registered for ${match}`);
    }
    return replacements[key];
  });
}

async function exists(path) {
  try {
    await access(path, constants.F_OK);
    return true;
  } catch {
    return false;
  }
}

async function writeRenderedFile(path, content, options) {
  const alreadyExists = await exists(path);
  if (alreadyExists && !options.force) {
    return { path, action: 'skip' };
  }
  if (!options.dryRun) {
    await mkdir(dirname(path), { recursive: true });
    await writeFile(path, content, 'utf8');
  }
  return { path, action: alreadyExists ? 'overwrite' : 'create' };
}

async function scaffoldLevel(level, options) {
  const replacements = replacementMap(level);
  const actions = [];

  for (const spec of TEMPLATE_SPECS) {
    const templatePath = join(repoRoot, 'docs', 'templates', spec.template);
    const outputPath = join(repoRoot, 'docs', 'plans', spec.outputName(level));
    const template = await readFile(templatePath, 'utf8');
    actions.push(await writeRenderedFile(outputPath, render(template, replacements), options));
  }

  for (const subdir of ASSET_SUBDIRS) {
    const gitkeepPath = join(repoRoot, 'assets', 'sprites', level.assetSlug, subdir, '.gitkeep');
    actions.push(await writeRenderedFile(gitkeepPath, '', options));
  }

  return actions;
}

function printActions(level, actions, options) {
  const mode = options.dryRun ? 'dry-run' : 'write';
  console.log(`${level.id} (${level.name}, ${level.genre}) ${mode}:`);
  for (const action of actions) {
    console.log(`  ${action.action.padEnd(9)} ${relative(repoRoot, action.path)}`);
  }
}

async function main() {
  const args = parseArgs(process.argv.slice(2));

  if (args.list) {
    for (const level of LEVELS) {
      console.log(`${level.id.padEnd(13)} level-${level.number} ${level.name} (${level.genre})`);
    }
    return;
  }

  let targets;
  if (args.all) {
    targets = LEVELS.filter((level) => level.number > 1);
  } else if (args.level) {
    const level = findLevel(args.level);
    if (!level) {
      throw new Error(`Unknown level "${args.level}". Run with --list to see valid ids.`);
    }
    targets = [level];
  } else {
    throw new Error('Pass --level LEVEL_ID, --all, or --list.');
  }

  for (const level of targets) {
    const actions = await scaffoldLevel(level, args);
    printActions(level, actions, args);
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
