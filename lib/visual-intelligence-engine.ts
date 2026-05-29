// ── CHARACTER VISUAL INTELLIGENCE ENGINE ─────────────────────────────────────
// AI Comic Art Studio — Silhouette, Anatomy, Posture & Cinematic Systems
// Powers: Character Builder INTEL tab + AI Prompt Expansion

export interface VisualIntelligenceScene {
  silhouetteType?:    'heroic' | 'speedster' | 'tank' | 'assassin' | 'cosmicEntity';
  anatomyGender?:     'male' | 'female';
  anatomyBuild?:      string;
  posturePsychology?: 'hero' | 'villain' | 'brokenCharacter' | 'berserker';
  costumeIdentity?:   'heroic' | 'darkKnight' | 'cosmic' | 'feudalJapan';
  emotionalPresence?: 'rage' | 'sorrow' | 'intimidation' | 'determination';
  archetype?:         'titanHero' | 'rogueAssassin' | 'cosmicEmperor' | 'demonHunter' | 'shadowVigilante';
  cinematicFraming?:  string;
}

// ── Silhouette System ─────────────────────────────────────────────────────────

export const VI_SILHOUETTE_TRAITS: Record<'heroic' | 'speedster' | 'tank' | 'assassin' | 'cosmicEntity', string[]> = {
  heroic:       ['broad shoulders', 'strong chest taper', 'power stance', 'cape silhouette', 'confident posture'],
  speedster:    ['lean frame', 'aerodynamic shape', 'forward tilt', 'long leg emphasis', 'motion-oriented silhouette'],
  tank:         ['massive torso', 'thick limbs', 'heavy stance', 'large shoulder silhouette', 'grounded posture'],
  assassin:     ['narrow silhouette', 'hooded profile', 'asymmetrical cloth', 'stealth posture', 'minimal armor bulk'],
  cosmicEntity: ['floating posture', 'energy halo', 'elongated proportions', 'non-human silhouette', 'cosmic aura'],
};

export const VI_SILHOUETTE_LABELS: Record<'heroic' | 'speedster' | 'tank' | 'assassin' | 'cosmicEntity', string> = {
  heroic:       'HEROIC',
  speedster:    'SPEEDSTER',
  tank:         'TANK',
  assassin:     'ASSASSIN',
  cosmicEntity: 'COSMIC',
};

export const VI_SILHOUETTE_COLORS: Record<'heroic' | 'speedster' | 'tank' | 'assassin' | 'cosmicEntity', string> = {
  heroic:       '#FFD600',
  speedster:    '#22C55E',
  tank:         '#F97316',
  assassin:     '#6B6560',
  cosmicEntity: '#A78BFA',
};

// ── Anatomy System ────────────────────────────────────────────────────────────

export const VI_ANATOMY_BUILDS: Record<'male' | 'female', Record<string, string[]>> = {
  male: {
    titanBuild:   ['massive chest', 'thick neck', 'powerful arms', 'heavy legs', 'imposing frame'],
    agileBuild:   ['lean muscle', 'athletic legs', 'defined core', 'fast-movement anatomy'],
    warriorBuild: ['balanced musculature', 'combat-ready frame', 'functional strength'],
  },
  female: {
    athletic:   ['defined shoulders', 'strong legs', 'combat conditioning', 'agile frame'],
    amazonian:  ['powerful build', 'warrior stance', 'heroic proportions'],
    stealth:    ['light frame', 'fast-movement anatomy', 'minimal bulk'],
  },
};

export const VI_BUILD_LABELS: Record<string, string> = {
  titanBuild:   'TITAN BUILD',
  agileBuild:   'AGILE BUILD',
  warriorBuild: 'WARRIOR BUILD',
  athletic:     'ATHLETIC',
  amazonian:    'AMAZONIAN',
  stealth:      'STEALTH',
};

// ── Posture Psychology ────────────────────────────────────────────────────────

export const VI_POSTURE_TRAITS: Record<'hero' | 'villain' | 'brokenCharacter' | 'berserker', string[]> = {
  hero:            ['open chest posture', 'grounded stance', 'lifted chin', 'balanced footing'],
  villain:         ['looming stance', 'relaxed intimidation', 'head tilt dominance', 'shadow posture'],
  brokenCharacter: ['slouched shoulders', 'lowered head', 'uneven stance', 'fatigue posture'],
  berserker:       ['forward lean', 'aggressive stance', 'clenched fists', 'unstable balance'],
};

export const VI_POSTURE_LABELS: Record<'hero' | 'villain' | 'brokenCharacter' | 'berserker', string> = {
  hero:            'HERO',
  villain:         'VILLAIN',
  brokenCharacter: 'BROKEN',
  berserker:       'BERSERKER',
};

export const VI_POSTURE_COLORS: Record<'hero' | 'villain' | 'brokenCharacter' | 'berserker', string> = {
  hero:            '#FFD600',
  villain:         '#E8001C',
  brokenCharacter: '#6B6560',
  berserker:       '#F97316',
};

// ── Costume Identity ──────────────────────────────────────────────────────────

export const VI_COSTUME_IDENTITY: Record<'heroic' | 'darkKnight' | 'cosmic' | 'feudalJapan', string[]> = {
  heroic:     ['bold emblem placement', 'clean silhouette lines', 'cape integration', 'armor layering'],
  darkKnight: ['heavy shadows', 'tactical armor', 'angular silhouette', 'dark textures'],
  cosmic:     ['glowing symbols', 'energy-infused materials', 'floating cloth', 'celestial armor'],
  feudalJapan:['layered samurai armor', 'weathered kimono', 'rope bindings', 'oni mask influence'],
};

export const VI_COSTUME_LABELS: Record<'heroic' | 'darkKnight' | 'cosmic' | 'feudalJapan', string> = {
  heroic:     'HEROIC',
  darkKnight: 'DARK KNIGHT',
  cosmic:     'COSMIC',
  feudalJapan:'FEUDAL JAPAN',
};

export const VI_COSTUME_COLORS: Record<'heroic' | 'darkKnight' | 'cosmic' | 'feudalJapan', string> = {
  heroic:     '#FFD600',
  darkKnight: '#6B6560',
  cosmic:     '#A78BFA',
  feudalJapan:'#22C55E',
};

// ── Emotional Presence ────────────────────────────────────────────────────────

export const VI_EMOTIONAL_TRAITS: Record<'rage' | 'sorrow' | 'intimidation' | 'determination', string[]> = {
  rage:         ['energy spikes', 'intense shadow contrast', 'violent posture tension', 'aura distortion'],
  sorrow:       ['negative space', 'soft lighting', 'rain atmosphere', 'isolated composition'],
  intimidation: ['towering camera angle', 'heavy shadows', 'minimal movement', 'cold expression'],
  determination:['focused eyes', 'firm stance', 'tight framing', 'cinematic rim light'],
};

export const VI_EMOTIONAL_COLORS: Record<'rage' | 'sorrow' | 'intimidation' | 'determination', string> = {
  rage:         '#E8001C',
  sorrow:       '#6B6560',
  intimidation: '#F97316',
  determination:'#FFD600',
};

// ── Archetype Recognition ─────────────────────────────────────────────────────

export const VI_ARCHETYPES: Record<'titanHero' | 'rogueAssassin' | 'cosmicEmperor' | 'demonHunter' | 'shadowVigilante', { silhouette: string; posture: string; lighting: string }> = {
  titanHero:      { silhouette: 'massive heroic frame',      posture: 'power stance',          lighting: 'heroic rim light' },
  rogueAssassin:  { silhouette: 'narrow stealth profile',    posture: 'low balanced stance',    lighting: 'shadow concealment' },
  cosmicEmperor:  { silhouette: 'floating dominance',        posture: 'effortless control',     lighting: 'cosmic aura glow' },
  demonHunter:    { silhouette: 'battle-worn warrior',       posture: 'combat readiness',       lighting: 'dark dramatic contrast' },
  shadowVigilante:{ silhouette: 'cape-heavy silhouette',     posture: 'intimidation stance',    lighting: 'noir shadows' },
};

export const VI_ARCHETYPE_LABELS: Record<'titanHero' | 'rogueAssassin' | 'cosmicEmperor' | 'demonHunter' | 'shadowVigilante', string> = {
  titanHero:      'TITAN HERO',
  rogueAssassin:  'ROGUE ASSASSIN',
  cosmicEmperor:  'COSMIC EMPEROR',
  demonHunter:    'DEMON HUNTER',
  shadowVigilante:'SHADOW VIGILANTE',
};

export const VI_ARCHETYPE_COLORS: Record<'titanHero' | 'rogueAssassin' | 'cosmicEmperor' | 'demonHunter' | 'shadowVigilante', string> = {
  titanHero:      '#FFD600',
  rogueAssassin:  '#6B6560',
  cosmicEmperor:  '#A78BFA',
  demonHunter:    '#E8001C',
  shadowVigilante:'#C4913A',
};

// ── Cinematic Framing ─────────────────────────────────────────────────────────

export const VI_CINEMATIC_FRAMINGS: string[] = [
  'low-angle hero shot', 'intimidation framing', 'widescreen battle shot',
  'tight emotional close-up', 'silhouette reveal', 'dynamic aerial perspective',
  'comic splash page framing', 'dramatic over-the-shoulder shot',
];

// ── Visual Hierarchy & Readability ────────────────────────────────────────────

export const VI_DOMINANCE_TOOLS: string[] = [
  'larger scale', 'center framing', 'strong lighting contrast', 'foreground placement', 'camera angle superiority',
];

export const VI_ACTION_READABILITY: string[] = [
  'clean combat silhouettes', 'clear limb visibility', 'strong motion arcs',
  'readable impact direction', 'dynamic body flow', 'cinematic spacing',
];

export const VI_SHADOW_LANGUAGE: string[] = [
  'half-face shadow', 'dramatic noir contrast', 'full silhouette reveal', 'shadow engulfment', 'hard rim lighting',
];

// ── Cinematic Expansion ───────────────────────────────────────────────────────

export const VI_CINEMATIC_EXPANSION: string[] = [
  'heroic anatomy exaggeration', 'dynamic silhouette design', 'cinematic lighting',
  'visual hierarchy optimization', 'comic-style framing', 'emotional posture psychology',
  'dramatic shadow language', 'high-impact readability', 'stylized comic rendering',
  'environment-reactive costume physics',
];

// ── Prompt Builder ────────────────────────────────────────────────────────────

export function buildVisualIntelligencePrompt(scene: VisualIntelligenceScene): string {
  const parts: string[] = [];

  if (scene.silhouetteType) {
    const traits = VI_SILHOUETTE_TRAITS[scene.silhouetteType];
    parts.push(`Silhouette: ${VI_SILHOUETTE_LABELS[scene.silhouetteType].toLowerCase()} — ${traits.join(', ')}.`);
  }

  if (scene.anatomyGender && scene.anatomyBuild) {
    const builds = VI_ANATOMY_BUILDS[scene.anatomyGender];
    const traits = builds[scene.anatomyBuild];
    if (traits?.length) parts.push(`Anatomy: ${traits.join(', ')}.`);
  }

  if (scene.posturePsychology) {
    const traits = VI_POSTURE_TRAITS[scene.posturePsychology];
    parts.push(`Posture psychology: ${traits.join(', ')}.`);
  }

  if (scene.costumeIdentity) {
    const traits = VI_COSTUME_IDENTITY[scene.costumeIdentity];
    parts.push(`Costume identity: ${traits.join(', ')}.`);
  }

  if (scene.emotionalPresence) {
    const traits = VI_EMOTIONAL_TRAITS[scene.emotionalPresence];
    parts.push(`Emotional presence: ${traits.join(', ')}.`);
  }

  if (scene.archetype) {
    const a = VI_ARCHETYPES[scene.archetype];
    parts.push(`Archetype: ${VI_ARCHETYPE_LABELS[scene.archetype]} — silhouette: ${a.silhouette}, posture: ${a.posture}, lighting: ${a.lighting}.`);
  }

  if (scene.cinematicFraming)
    parts.push(`Cinematic framing: ${scene.cinematicFraming}.`);

  parts.push(VI_CINEMATIC_EXPANSION.join(', ') + '.');
  return parts.join(' ');
}
