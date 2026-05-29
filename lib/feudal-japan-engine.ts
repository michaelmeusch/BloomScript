// ── FEUDAL JAPAN ENGINE ───────────────────────────────────────────────────────
// AI Comic Art Studio — World Environment Module
// Powers: Character Builder WORLD tab + AI Prompt Expansion

export interface FeudalJapanScene {
  environmentCategory: 'rural' | 'urban' | 'sacred' | 'military';
  environmentDetail?:  string;
  characterArchetype?: string;
  atmosphereFX:        string[];
  lighting?:           string;
  combatStyle?:        string;
  yokai?:              string[];
  cursedArtifacts?:    string[];
  cinematicShot?:      string;
  styleDNA?:           string;
}

export const FEUDAL_JAPAN_ENVIRONMENTS: Record<'rural' | 'urban' | 'sacred' | 'military', string[]> = {
  rural:    [
    'rice fields', 'bamboo forests', 'mountain villages', 'mist valleys',
    'stone bridges', 'waterfalls', 'snowy mountain paths', 'quiet fishing villages',
  ],
  urban:    [
    'Edo streets', 'merchant districts', 'lantern alleys', 'marketplaces',
    'tea houses', 'rooftop districts', 'narrow rain-soaked streets',
  ],
  sacred:   [
    'Shinto shrines', 'temple interiors', 'torii gates', 'sacred forests',
    'mountain monasteries', 'meditation gardens',
  ],
  military: [
    'samurai castles', 'war camps', 'watch towers', 'training dojos',
    'siege walls', 'fortified villages',
  ],
};

export const FEUDAL_JAPAN_ARCHITECTURE = {
  structures: [
    'curved tiled roofs', 'wooden beams', 'tatami flooring', 'sliding shoji doors',
    'stone pathways', 'courtyard gardens', 'paper walls', 'elevated wooden platforms',
  ],
  atmosphereDetails: [
    'lantern glow', 'candle flicker', 'rain dripping from rooftops',
    'fog between buildings', 'weathered wood textures', 'wind-blown banners',
  ],
};

export const FEUDAL_JAPAN_COSTUMES = {
  samurai:   ['heavy war armor', 'ceremonial armor', 'battle-worn armor', 'ronin attire', 'shogun armor', 'elite imperial armor'],
  shinobi:   ['stealth wraps', 'hooded shinobi gear', 'lightweight climbing outfits', 'masked assassin clothing'],
  civilian:  ['kimono', 'monk robes', 'merchant clothing', 'shrine maiden attire', 'peasant garments'],
  materials: ['silk', 'woven cloth', 'lacquered armor', 'rope bindings', 'leather', 'weathered fabric'],
};

export const FEUDAL_JAPAN_WEAPONS = {
  blades:       ['katana', 'wakizashi', 'tanto', 'naginata'],
  polearms:     ['yari spear', 'war naginata'],
  ranged:       ['yumi bow', 'throwing blades'],
  shinobiTools: ['smoke bombs', 'grappling hooks', 'climbing claws', 'hidden blades'],
};

export const FEUDAL_JAPAN_COMBAT_STYLES: string[] = [
  'iaijutsu sword draw', 'samurai duel stance', 'ninja stealth movement',
  'rooftop traversal', 'dual sword combat', 'spear formations',
  'close-quarter knife combat', 'mounted samurai combat',
];

export const FEUDAL_JAPAN_LIGHTING: string[] = [
  'lantern glow', 'moonlit silhouettes', 'rain reflections', 'fog diffusion',
  'candle-lit interiors', 'snow-blue night lighting', 'sunset duel lighting', 'fire-lit battle scenes',
];

export const FEUDAL_JAPAN_ATMOSPHERE_FX: string[] = [
  'falling cherry blossoms', 'drifting fog', 'rain streaks', 'snow flurries',
  'incense smoke', 'burning embers', 'wind through bamboo', 'falling autumn leaves',
];

export const FEUDAL_JAPAN_CHARACTER_ARCHETYPES: string[] = [
  'wandering ronin', 'shogun', 'ninja assassin', 'blind swordsman',
  'monk warrior', 'imperial guard', 'village samurai', 'demon hunter',
  'shrine maiden', 'rogue shinobi',
];

export const FEUDAL_JAPAN_MYTHOLOGY = {
  yokai:           ['oni', 'kitsune', 'tengu', 'dragon spirits', 'ghost warriors', 'shadow demons', 'spirit wolves'],
  cursedArtifacts: ['cursed masks', 'ancient katanas', 'spirit scrolls', 'sacred talismans'],
};

export const FEUDAL_JAPAN_CINEMATIC_SHOTS: string[] = [
  'silhouette duel at sunset', 'rooftop moon jump', 'low-angle katana draw',
  'rain duel close-up', 'wide temple establishing shot',
  'tracking shot through bamboo forest', 'lantern alley perspective', 'snow battlefield panorama',
];

export const FEUDAL_JAPAN_SYMBOLISM: Record<string, string> = {
  cherryBlossoms: 'mortality',
  moonlight:      'solitude',
  fog:            'uncertainty',
  crows:          'death omen',
  fallingLeaves:  'transition',
  redSun:         'destiny',
};

export const FEUDAL_JAPAN_CREATURES: string[] = [
  'oni warlords', 'giant serpents', 'spirit deer', 'yokai hybrids', 'cursed samurai', 'shadow beasts',
];

export const FEUDAL_JAPAN_STYLE_DNA: string[] = [
  'manga', 'realistic cinematic', 'watercolor ink',
  'ukiyo-e inspired', 'anime hybrid', 'dark fantasy', 'brush ink rendering',
];

export const FEUDAL_JAPAN_SOUND_FX: string[] = ['SHING', 'KRAKK', 'SHHK', 'VRMMMM', 'THOOM'];

export const FEUDAL_JAPAN_ATMOSPHERE_EXTRAS: string[] = [
  'moonlit atmosphere', 'cinematic fog', 'dynamic fabric movement', 'wet stone reflections',
  'lantern lighting', 'dramatic composition', 'samurai cinematic framing',
  'wind-reactive clothing', 'anime-style speed intensity', 'feudal Japan architecture',
];

export const FEUDAL_ENV_COLORS: Record<'rural' | 'urban' | 'sacred' | 'military', string> = {
  rural:    '#22C55E',
  urban:    '#F97316',
  sacred:   '#A78BFA',
  military: '#E8001C',
};

export function buildFeudalJapanPrompt(scene: FeudalJapanScene): string {
  const parts: string[] = [];
  const envList = FEUDAL_JAPAN_ENVIRONMENTS[scene.environmentCategory];
  const envDetail = scene.environmentDetail ?? envList[0] ?? scene.environmentCategory;
  parts.push(`Feudal Japan setting: ${envDetail}, ${scene.environmentCategory} environment.`);
  if (scene.characterArchetype) parts.push(`Character archetype: ${scene.characterArchetype}.`);
  if (scene.atmosphereFX.length) parts.push(`Atmosphere: ${scene.atmosphereFX.join(', ')}.`);
  if (scene.lighting)            parts.push(`Lighting: ${scene.lighting}.`);
  if (scene.combatStyle)         parts.push(`Combat style: ${scene.combatStyle}.`);
  if (scene.yokai?.length)       parts.push(`Supernatural elements: ${scene.yokai.join(', ')}.`);
  if (scene.cursedArtifacts?.length) parts.push(`Cursed artifacts: ${scene.cursedArtifacts.join(', ')}.`);
  if (scene.cinematicShot)       parts.push(`Cinematic framing: ${scene.cinematicShot}.`);
  if (scene.styleDNA)            parts.push(`Visual style: ${scene.styleDNA}.`);
  parts.push(FEUDAL_JAPAN_ATMOSPHERE_EXTRAS.join(', ') + '.');
  return parts.join(' ');
}
