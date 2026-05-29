// ── STYLIZED COMIC LANGUAGE ENGINE ───────────────────────────────────────────
// AI Comic Art Studio — Visual FX & Panel Language Module
// Powers: Character Builder FX tab + AI Prompt Expansion

export interface ComicLanguageScene {
  impactLevel?:     'lightImpact' | 'mediumImpact' | 'heavyImpact' | 'cosmicImpact';
  damageEffects?:   string[];
  speedFX?:         string[];
  powerFXCategory?: 'cosmic' | 'mystical' | 'darkEnergy' | 'elemental';
  powerFXEffects?:  string[];
  panelMood?:       'heroicReveal' | 'emotionalIsolation' | 'intimidation' | 'finalBattle';
  shadowStyle?:     string;
  emotionalState?:  'rage' | 'sorrow' | 'fear';
  artStyleDNA?:     'bronzeAge' | 'modernCinematic' | 'mangaHybrid' | 'darkFantasy';
}

// ── Impact FX ────────────────────────────────────────────────────────────────

export const COMIC_IMPACT_FX: Record<'lightImpact' | 'mediumImpact' | 'heavyImpact' | 'cosmicImpact', string[]> = {
  lightImpact:  ['small debris burst', 'speed crack', 'motion streak', 'impact spark'],
  mediumImpact: ['shockwave ring', 'ground fracture', 'air distortion', 'speed-line explosion'],
  heavyImpact:  ['massive debris eruption', 'panel-shaking crack', 'environmental destruction', 'energy rupture'],
  cosmicImpact: ['reality distortion', 'dimensional crack', 'gravity ripple', 'cosmic shockwave'],
};

export const COMIC_IMPACT_LABELS: Record<'lightImpact' | 'mediumImpact' | 'heavyImpact' | 'cosmicImpact', string> = {
  lightImpact:  'LIGHT',
  mediumImpact: 'MEDIUM',
  heavyImpact:  'HEAVY',
  cosmicImpact: 'COSMIC',
};

export const COMIC_IMPACT_COLORS: Record<'lightImpact' | 'mediumImpact' | 'heavyImpact' | 'cosmicImpact', string> = {
  lightImpact:  '#22C55E',
  mediumImpact: '#FFD600',
  heavyImpact:  '#F97316',
  cosmicImpact: '#A78BFA',
};

// ── Damage Language ───────────────────────────────────────────────────────────

export const COMIC_DAMAGE_EFFECTS: string[] = [
  'torn cape', 'cracked armor', 'burn marks', 'energy scars',
  'shadow corruption', 'battle scratches', 'ink splatter damage', 'fractured gauntlets',
];

export const COMIC_STYLIZED_BLOOD_ALTERNATIVES: string[] = [
  'black ink spray', 'shadow fluid', 'dark energy leakage',
  'symbiote residue', 'void corruption', 'smoke-like impact trails',
];

// ── Speed FX ─────────────────────────────────────────────────────────────────

export const COMIC_SPEED_MOVEMENT: string[] = [
  'speed lines', 'afterimages', 'motion blur', 'air streaks', 'panel stretch distortion',
];

export const COMIC_SPEED_SUPER: string[] = [
  'lightning trails', 'time distortion', 'speed vortex', 'ground tearing',
];

export const COMIC_SPEED_FX_ALL: string[] = [
  ...COMIC_SPEED_MOVEMENT, ...COMIC_SPEED_SUPER,
];

// ── Power FX ─────────────────────────────────────────────────────────────────

export const COMIC_POWER_FX: Record<'cosmic' | 'mystical' | 'darkEnergy' | 'elemental', string[]> = {
  cosmic:     ['starfield aura', 'gravity distortion', 'cosmic flare', 'galactic particles'],
  mystical:   ['ancient runes', 'energy seals', 'spiritual smoke', 'floating symbols'],
  darkEnergy: ['shadow tendrils', 'void aura', 'black flame', 'corruption mist'],
  elemental:  ['fire eruption', 'ice shards', 'lightning arcs', 'tidal surges'],
};

export const COMIC_POWER_COLORS: Record<'cosmic' | 'mystical' | 'darkEnergy' | 'elemental', string> = {
  cosmic:     '#A78BFA',
  mystical:   '#C4913A',
  darkEnergy: '#E8001C',
  elemental:  '#22C55E',
};

// ── Panel Language ────────────────────────────────────────────────────────────

export const COMIC_PANEL_MOODS: Record<'heroicReveal' | 'emotionalIsolation' | 'intimidation' | 'finalBattle', string[]> = {
  heroicReveal:       ['low-angle framing', 'wind-reactive cape', 'silhouette lighting', 'dramatic skyline'],
  emotionalIsolation: ['negative space', 'rain atmosphere', 'desaturated lighting', 'tight facial framing'],
  intimidation:       ['heavy shadows', 'towering perspective', 'glowing eyes', 'environment darkening'],
  finalBattle:        ['destroyed environment', 'energy storms', 'debris fields', 'epic widescreen composition'],
};

export const COMIC_PANEL_MOOD_LABELS: Record<'heroicReveal' | 'emotionalIsolation' | 'intimidation' | 'finalBattle', string> = {
  heroicReveal:       'HEROIC REVEAL',
  emotionalIsolation: 'EMOTIONAL',
  intimidation:       'INTIMIDATION',
  finalBattle:        'FINAL BATTLE',
};

export const COMIC_PANEL_MOOD_COLORS: Record<'heroicReveal' | 'emotionalIsolation' | 'intimidation' | 'finalBattle', string> = {
  heroicReveal:       '#FFD600',
  emotionalIsolation: '#6B6560',
  intimidation:       '#E8001C',
  finalBattle:        '#A78BFA',
};

// ── Shadow Language ───────────────────────────────────────────────────────────

export const COMIC_SHADOW_STYLES: string[] = [
  'half-face shadow', 'silhouette reveal', 'noir contrast',
  'heavy ink blacks', 'dramatic rim light', 'shadow engulfment',
];

// ── Emotional FX ─────────────────────────────────────────────────────────────

export const COMIC_EMOTIONAL_FX: Record<'rage' | 'sorrow' | 'fear', string[]> = {
  rage:   ['shaking aura', 'energy spikes', 'shadow expansion', 'panel vibration'],
  sorrow: ['rain streaks', 'fading background', 'soft shadows', 'silent composition'],
  fear:   ['distorted perspective', 'elongated shadows', 'cold lighting', 'tight framing'],
};

export const COMIC_EMOTIONAL_COLORS: Record<'rage' | 'sorrow' | 'fear', string> = {
  rage:   '#E8001C',
  sorrow: '#6B6560',
  fear:   '#A78BFA',
};

// ── Art Style DNA ─────────────────────────────────────────────────────────────

export const COMIC_ART_STYLE_DNA: Record<'bronzeAge' | 'modernCinematic' | 'mangaHybrid' | 'darkFantasy', string[]> = {
  bronzeAge:       ['bold outlines', 'flat colors', 'dramatic poses'],
  modernCinematic: ['realistic lighting', 'dynamic anatomy', 'high detail rendering'],
  mangaHybrid:     ['speed line emphasis', 'exaggerated emotion', 'cinematic panel flow'],
  darkFantasy:     ['heavy shadows', 'textured ink', 'gothic atmosphere'],
};

export const COMIC_ART_STYLE_LABELS: Record<'bronzeAge' | 'modernCinematic' | 'mangaHybrid' | 'darkFantasy', string> = {
  bronzeAge:       'BRONZE AGE',
  modernCinematic: 'CINEMATIC',
  mangaHybrid:     'MANGA HYBRID',
  darkFantasy:     'DARK FANTASY',
};

// ── Sound FX ─────────────────────────────────────────────────────────────────

export const COMIC_SOUND_FX = {
  impacts: ['KRAKK', 'THOOM', 'BOOOM', 'KRRSH'],
  blades:  ['SHING', 'SKKKT', 'VRSH'],
  energy:  ['VMMMM', 'ZZZRAKK', 'WHOOOM'],
};

// ── AI Prompt Cinematic Additions ─────────────────────────────────────────────

export const COMIC_CINEMATIC_ADDITIONS: string[] = [
  'dynamic comic framing', 'stylized impact language', 'cinematic lighting',
  'heavy shadow contrast', 'dramatic perspective', 'comic-style FX rendering',
  'environmental storytelling', 'heroic anatomy exaggeration',
];

// ── Prompt Builder ────────────────────────────────────────────────────────────

export function buildComicLanguagePrompt(scene: ComicLanguageScene): string {
  const parts: string[] = [];

  if (scene.impactLevel) {
    const impacts = COMIC_IMPACT_FX[scene.impactLevel];
    parts.push(`Impact FX: ${impacts.join(', ')}.`);
  }

  if (scene.damageEffects?.length)
    parts.push(`Damage language: ${scene.damageEffects.join(', ')}.`);

  if (scene.speedFX?.length)
    parts.push(`Speed FX: ${scene.speedFX.join(', ')}.`);

  if (scene.powerFXEffects?.length)
    parts.push(`Power FX: ${scene.powerFXEffects.join(', ')}.`);

  if (scene.panelMood) {
    const moodFX = COMIC_PANEL_MOODS[scene.panelMood];
    parts.push(`Panel language: ${moodFX.join(', ')}.`);
  }

  if (scene.shadowStyle)
    parts.push(`Shadow style: ${scene.shadowStyle}.`);

  if (scene.emotionalState) {
    const emoFX = COMIC_EMOTIONAL_FX[scene.emotionalState];
    parts.push(`Emotional FX: ${emoFX.join(', ')}.`);
  }

  if (scene.artStyleDNA) {
    const styleFX = COMIC_ART_STYLE_DNA[scene.artStyleDNA];
    parts.push(`Art style: ${COMIC_ART_STYLE_LABELS[scene.artStyleDNA]} — ${styleFX.join(', ')}.`);
  }

  parts.push(COMIC_CINEMATIC_ADDITIONS.join(', ') + '.');
  return parts.join(' ');
}
