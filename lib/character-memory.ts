// ============================================================================
// CHARACTER MEMORY — TypeScript port of Java Universal Character DNA System
// Java classes ported: CharacterDNA, CharacterDescriptionInterpreter,
//   CharacterMemoryDatabase, ConsistencyEngine, FacialFeature,
//   TattooProfile, FacialPaint, WeaponProfile
// ============================================================================

import AsyncStorage from '@react-native-async-storage/async-storage';
import type { FeudalJapanScene } from './feudal-japan-engine';
import type { ComicLanguageScene } from './comic-language-engine';
import type { VisualIntelligenceScene } from './visual-intelligence-engine';
import type { CinematicCompositionScene } from './cinematic-composition-engine';
import { useCallback, useEffect, useState } from 'react';

// ── Enums (ported from Java) ───────────────────────────────────────────────────

export type CharacterRole =
  | 'HERO' | 'VILLAIN' | 'ANTI_HERO' | 'MENTOR' | 'SIDEKICK'
  | 'MONSTER' | 'CYBORG' | 'WARRIOR' | 'MAGE' | 'ASSASSIN' | 'SOLDIER' | 'ALIEN';

export type DNABodyType =
  | 'SLIM' | 'ATHLETIC' | 'MUSCULAR' | 'HEAVY' | 'GIANT'
  | 'ELDER' | 'TEEN' | 'ROBOTIC' | 'MONSTROUS';

export type CinematicStyleDNA =
  | 'HEROIC' | 'DARK_NOIR' | 'CHAOTIC_ACTION' | 'EPIC_FANTASY'
  | 'HORROR' | 'CYBERPUNK' | 'ANIME' | 'MANGA' | 'REALISTIC' | 'PAINTED';

// ── Rich entity interfaces (ported from Java classes) ─────────────────────────

/** Java: FacialFeature — scars, birthmarks with location + permanent flag */
export interface FacialFeature {
  featureName: string;
  location: string;
  description: string;
  permanent: boolean;
}

/** Java: TattooProfile — full tattoo with magical/glowing properties */
export interface TattooProfile {
  tattooName: string;
  bodyLocation: string;
  style: string;
  color: string;
  glowing: boolean;
  magical: boolean;
  symbolism: string;
}

/** Java: FacialPaint — war paint / face paint with emotional meaning */
export interface FacialPaint {
  paintStyle: string;
  color: string;
  placement: string;
  emotionalMeaning: string;
  symmetrical: boolean;
}

/** Java: WeaponProfile — signature weapon with energy effects */
export interface WeaponProfile {
  weaponName: string;
  weaponType: string;
  material: string;
  energyEffect: string;
  signatureWeapon: boolean;
}

// ── Universe Engine types (ported from Java UniversalCinematicStoryEngine) ─────

export type SpeciesType =
  | 'HUMAN' | 'AVIAN' | 'REPTILIAN' | 'INSECTOID' | 'AQUATIC'
  | 'CELESTIAL' | 'SHADOW_ENTITY' | 'ENERGY_BEING' | 'CYBORG' | 'SYNTHETIC'
  | 'PLANT_BASED' | 'GIANT' | 'DEMONIC' | 'ANGELIC' | 'HYBRID' | 'CRYSTALLINE';

export type CivilizationType =
  | 'FUTURISTIC_EMPIRE' | 'ANCIENT_KINGDOM' | 'CYBERPUNK_CITY' | 'VOLCANIC_CLANS'
  | 'SKY_TEMPLE' | 'UNDERWATER_REALM' | 'INTERGALACTIC_ORDER' | 'HIVE_COLONY'
  | 'NOMADIC_TRIBES' | 'MYSTICAL_REALM' | 'MECHANICAL_WORLD' | 'RUINED_APOCALYPSE';

export type MotionType =
  | 'GLIDING' | 'FALLING' | 'LEAPING' | 'CHARGING' | 'FLOATING'
  | 'ATTACKING' | 'DESCENDING' | 'ASCENDING' | 'RUNNING' | 'IMPACT';

export type EmotionalToneScene =
  | 'HEROIC' | 'EPIC' | 'FEARFUL' | 'CHAOTIC' | 'MYSTICAL'
  | 'HOPEFUL' | 'INTIMIDATING' | 'DIVINE' | 'DARK' | 'TRAGIC';

/** Java: SpeciesDNA — alien biology, body structure, silhouette properties */
export interface SpeciesDNA {
  speciesType: SpeciesType;
  bodyStructure: string;
  skinTexture: string;
  movementStyle: string;
  eyeStructure: string;
  wings: boolean;
  tail: boolean;
  glowingSkin: boolean;
  energySignature: string;
  silhouetteStyle: string;
}

/** Java: CivilizationProfile — architecture, technology, combat, clothing */
export interface CivilizationProfile {
  civilizationType: CivilizationType;
  architectureStyle: string;
  technologyLevel: string;
  colorIdentity: string;
  combatStyle: string;
  clothingStyle: string;
  symbolism: string;
}

// ── Cinematic Anatomy Engine types (Java: CinematicAnatomyEngine) ─────────────

export type MaleAnatomyType =
  | 'HEROIC_V_TAPER' | 'BRUISER' | 'ATHLETIC_ACROBAT' | 'LEAN_ASSASSIN' | 'TITAN'
  | 'MONSTER' | 'SPEEDSTER' | 'SOLDIER' | 'COSMIC_ENTITY' | 'MARTIAL_ARTIST';

export type FemaleAnatomyType =
  | 'ATHLETIC_HEROINE' | 'AMAZONIAN' | 'ACROBATIC' | 'STEALTH_ASSASSIN' | 'POWERHOUSE'
  | 'COSMIC_BEING' | 'MYSTIC' | 'SOLDIER_F' | 'CYBERNETIC' | 'MONSTROUS';

export type BodyEmotion =
  | 'CONFIDENT' | 'FEARFUL' | 'AGGRESSIVE' | 'SAD' | 'DIVINE'
  | 'CHAOTIC' | 'STEALTH' | 'HEROIC' | 'INTIMIDATING';

/** Java: BodyProportions — 8-float cinematic anatomy proportions */
export interface BodyProportions {
  shoulderWidth: number;
  chestSize:     number;
  waistSize:     number;
  armLength:     number;
  legLength:     number;
  handSize:      number;
  neckThickness: number;
  headScale:     number;
}

/** Java: MuscleFlowProfile — torso flow, spine curve, tension direction */
export interface MuscleFlowProfile {
  torsoFlow:          string;
  spineCurve:         string;
  tensionDirection:   string;
  weightDistribution: string;
  compressionZones:   string;
  stretchZones:       string;
}

// ── CharacterDNA (ported from Java CharacterDNA class) ────────────────────────

export interface CharacterDNA {
  characterName: string;

  // Face (original fields)
  eyeShape:   string;
  jawType:    string;
  noseType:   string;
  mouthType:  string;
  facialScar: string;

  // Body (original fields)
  bodyType:          string;
  bodyArchetype?:    string;
  masterAnatomyType?: string;
  heightRatio:       number;
  shoulderWidth:  number;
  muscleMass:     number;

  // Hair (original fields)
  hairStyle: string;
  hairColor: string;

  // Costume (original fields)
  primarySuit:   string;
  secondarySuit: string;
  capeType:      string;
  symbol:        string;

  // Colors (original fields)
  primaryColor:   string;
  secondaryColor: string;

  // Style (original fields)
  renderingStyle: string;

  // ── New extended fields (Java Universal Character DNA System) ──────────────

  // Core identity
  role?:           CharacterRole;
  age?:            number;
  ethnicityStyle?: string;

  // Extended face
  faceShape?:  string;
  eyeColor?:   string;
  skinTone?:   string;
  skinTexture?: string;
  beardStyle?: string;

  // Rich visual features — Java: List<FacialFeature>, List<TattooProfile>, etc.
  scars?:        FacialFeature[];
  birthmarks?:   FacialFeature[];
  tattoos?:      TattooProfile[];
  facialPaints?: FacialPaint[];

  // Costume additions
  armorPieces?:       string[];
  accessories?:       string[];
  costumeMaterials?:  string[];
  costumeDescription?: string;

  // Weapons — Java: List<WeaponProfile>
  weapons?: WeaponProfile[];

  // Powers
  powers?:        string[];
  energyEffects?: string[];

  // Cinematic style — Java: CinematicStyle, lightingIdentity, colorPalette, motionStyle
  cinematicStyleDNA?: CinematicStyleDNA;
  lightingIdentity?:  string;
  colorPalette?:      string;
  motionStyle?:       string;

  // Consistency locks — Java: ConsistencyEngine / lockFace, lockHair, etc.
  lockFace?:            boolean;
  lockHair?:            boolean;
  lockTattooPlacement?: boolean;
  lockCostume?:         boolean;
  lockColorPalette?:    boolean;
  lockWeapons?:         boolean;
  lockLighting?:        boolean;

  // Universe Engine extensions — Java: UniversalCinematicStoryEngine
  speciesDNA?:    SpeciesDNA;
  civilization?:  CivilizationProfile;
  emotionalTone?: EmotionalToneScene;

  // World Environment Engine
  worldSetting?:     string;
  feudalJapanScene?: FeudalJapanScene;

  // Stylized Comic Language Engine
  comicLanguageScene?: ComicLanguageScene;

  // Character Visual Intelligence Engine
  visualIntelligenceScene?: VisualIntelligenceScene;

  // Cinematic Composition Engine
  cinematicCompositionScene?: CinematicCompositionScene;

  // Cinematic Anatomy Engine — Java: CinematicAnatomyEngine
  gender?:            'Male' | 'Female' | 'Non-Binary';
  maleAnatomyType?:   MaleAnatomyType;
  femaleAnatomyType?: FemaleAnatomyType;
  bodyEmotion?:       BodyEmotion;
  bodyProportions?:   BodyProportions;
  muscleFlow?:        MuscleFlowProfile;
  poseStyle?:         string;
  silhouetteType?:    string;
  movementEnergy?:    string;
}

export const BLANK_CHARACTER_DNA: Omit<CharacterDNA, 'characterName'> = {
  eyeShape:      'fierce_dark',
  jawType:       'heroic_square',
  noseType:      'straight',
  mouthType:     'determined',
  facialScar:    'none',
  bodyType:      'lean_muscular',
  heightRatio:   1.0,
  shoulderWidth: 0.7,
  muscleMass:    0.7,
  hairStyle:     'short_dark',
  hairColor:     'black',
  primarySuit:   'dark_armor',
  secondarySuit: 'none',
  capeType:      'none',
  symbol:        'none',
  primaryColor:  '#1A1A2E',
  secondaryColor:'#FFD600',
  renderingStyle:'jim_lee',
  // Extended defaults — Java: all locks true by default
  lockFace:            true,
  lockHair:            true,
  lockTattooPlacement: true,
  lockCostume:         true,
  lockColorPalette:    true,
  lockWeapons:         true,
  lockLighting:        true,
};

// ── Option palettes (used by CharacterBuilderModal) ───────────────────────────

export const EYE_SHAPES = [
  'fierce_dark', 'glowing_white', 'sharp_blue', 'round_kind',
  'compound_red', 'golden_feral', 'hollow_empty', 'scarlet_glow',
];

export const JAW_TYPES = [
  'heroic_square', 'angular_sharp', 'soft_round',
  'massive_titan', 'narrow_sharp', 'broken_scarred',
];

export const NOSE_TYPES = [
  'straight', 'broad', 'pointed', 'button', 'flat_broken',
];

export const MOUTH_TYPES = [
  'determined', 'smirking', 'snarling', 'open_scream', 'tight_silent',
];

export const SCAR_TYPES = [
  'none', 'left_cheek', 'right_eye', 'chin_slash', 'brow_cut', 'multiple',
];

export const FACE_SHAPES = [
  { value: 'OVAL',       emoji: '🟡', desc: 'Classic balanced proportions — most versatile hero face' },
  { value: 'ROUND',      emoji: '⭕', desc: 'Soft full cheeks — approachable, youthful energy' },
  { value: 'SQUARE',     emoji: '🟥', desc: 'Strong angular jaw — power, authority, resolve' },
  { value: 'RECTANGLE',  emoji: '📐', desc: 'Long with parallel sides — dignified, noble presence' },
  { value: 'TRIANGLE',   emoji: '🔺', desc: 'Narrow forehead, wide jaw — imposing, immovable' },
  { value: 'HEART',      emoji: '❤️',  desc: 'Wide forehead, pointed chin — expressive, romantic lead' },
  { value: 'DIAMOND',    emoji: '💎', desc: 'High cheekbones, narrow brow and jaw — striking, exotic' },
  { value: 'LONG',       emoji: '📏', desc: 'Elongated proportions — brooding, introspective depth' },
  { value: 'GAUNT',      emoji: '💀', desc: 'Hollow cheeks, sunken eyes — battle-worn, haunted past' },
  { value: 'HEROIC',     emoji: '⚜️',  desc: 'Idealized comic hero construction — sharp jaw, high brow' },
  { value: 'MONSTER',    emoji: '👹', desc: 'Non-human distortion — alien geometry, horror scale' },
  { value: 'SYNTHETIC',  emoji: '🤖', desc: 'Android / synthetic — precise symmetry, uncanny valley' },
  { value: 'ALIEN',      emoji: '👽', desc: 'Extra-terrestrial — elongated cranium, otherworldly' },
] as const;
export type FaceShapeValue = (typeof FACE_SHAPES)[number]['value'];

export const BODY_TYPES = [
  'lean_muscular', 'powerhouse', 'slim_agile',
  'massive_tank', 'athletic_balanced', 'wiry_fast',
];

export const HAIR_STYLES = [
  'short_dark', 'long_black', 'spiked_red', 'bald', 'flowing_gold',
  'mohawk', 'braided', 'wild_white', 'undercut', 'silver_streak',
];

export const HAIR_COLORS = [
  'black', 'white', 'red', 'blonde', 'silver',
  'blue', 'purple', 'brown', 'green', 'orange',
];

export const HAIR_COLOR_SWATCHES: Array<{ name: string; hex: string }> = [
  { name: 'Black',        hex: '#0A0806' },
  { name: 'Dark Brown',   hex: '#2C1A0E' },
  { name: 'Brown',        hex: '#6B3A2A' },
  { name: 'Auburn',       hex: '#9B3A1A' },
  { name: 'Red',          hex: '#C0392B' },
  { name: 'Copper',       hex: '#C85A1A' },
  { name: 'Blonde',       hex: '#D4A855' },
  { name: 'Platinum',     hex: '#E8DECA' },
  { name: 'Silver',       hex: '#B8C4C8' },
  { name: 'White',        hex: '#F0EDE8' },
  { name: 'Blue',         hex: '#1A4FA0' },
  { name: 'Teal',         hex: '#0E7C7B' },
  { name: 'Green',        hex: '#2E7D32' },
  { name: 'Purple',       hex: '#6A1A8A' },
  { name: 'Pink',         hex: '#C45B8A' },
  { name: 'Orange',       hex: '#D45B0A' },
];

export const SKIN_TONES: Array<{ name: string; hex: string; fantasy?: boolean }> = [
  // ── Human range ──
  { name: 'Porcelain',      hex: '#FDDBB4' },
  { name: 'Fair',           hex: '#F2C48D' },
  { name: 'Light',          hex: '#E8A87C' },
  { name: 'Medium Light',   hex: '#D4886A' },
  { name: 'Tan',            hex: '#C67642' },
  { name: 'Olive',          hex: '#A56B3A' },
  { name: 'Brown',          hex: '#7A4A2A' },
  { name: 'Dark Brown',     hex: '#5C3222' },
  { name: 'Deep',           hex: '#3B1F15' },
  // ── Fantasy ──
  { name: 'Pale Undead',    hex: '#C8D4C0', fantasy: true },
  { name: 'Frost Blue',     hex: '#8AAEC0', fantasy: true },
  { name: 'Ocean Blue',     hex: '#2E6DA4', fantasy: true },
  { name: 'Alien Green',    hex: '#5A9E6A', fantasy: true },
  { name: 'Forest Green',   hex: '#2E6B3A', fantasy: true },
  { name: 'Demon Red',      hex: '#8B2020', fantasy: true },
  { name: 'Magma Orange',   hex: '#8B4A1A', fantasy: true },
  { name: 'Arcane Purple',  hex: '#6A3B8A', fantasy: true },
  { name: 'Stone Grey',     hex: '#5A6A6A', fantasy: true },
  { name: 'Gold Titan',     hex: '#B87820', fantasy: true },
  { name: 'Obsidian',       hex: '#1A0A0A', fantasy: true },
  { name: 'Silver Golem',   hex: '#8AA0A8', fantasy: true },
];

export const EYE_COLOR_SWATCHES: Array<{ name: string; hex: string }> = [
  { name: 'Dark Brown',  hex: '#2E1503' },
  { name: 'Brown',       hex: '#6B3A2A' },
  { name: 'Amber',       hex: '#C17A2A' },
  { name: 'Hazel',       hex: '#8B6914' },
  { name: 'Green',       hex: '#3D7A3D' },
  { name: 'Blue',        hex: '#2E6DA4' },
  { name: 'Ice Blue',    hex: '#8ABCD4' },
  { name: 'Grey',        hex: '#8DA5B0' },
  { name: 'Silver',      hex: '#B8C8D0' },
  { name: 'Gold',        hex: '#D4A017' },
  { name: 'Red',         hex: '#8B0000' },
  { name: 'Crimson',     hex: '#C0002A' },
  { name: 'Purple',      hex: '#6B3587' },
  { name: 'Violet',      hex: '#9B30FF' },
  { name: 'Cyan',        hex: '#00B4D8' },
  { name: 'White',       hex: '#D8E4F0' },
  { name: 'Black',       hex: '#0A0806' },
  { name: 'Yellow',      hex: '#E8C200' },
];

export const SUIT_TYPES = [
  'dark_armor', 'spandex_tight', 'tactical_vest',
  'ancient_robes', 'biomech_suit', 'sci_fi_suit', 'armored_plate',
];

export const SECONDARY_SUIT = [
  'none', 'chest_plate', 'utility_belt', 'bracers', 'shoulder_guards',
];

export const CAPE_TYPES = [
  'none', 'short_battle_cape', 'long_dramatic_cape',
  'tattered_ghost_cape', 'billowing_hero_cape', 'half_cape',
];

export const SYMBOLS = [
  'none', 'chest_star', 'chest_emblem_S', 'bat_symbol',
  'lightning_bolt', 'skull', 'omega_symbol', 'custom_crest',
];

export const PRESET_COLORS = [
  '#0A0806', '#1A1A2E', '#16213E', '#1F2937', '#0D0D0D',
  '#7B0000', '#B91C1C', '#E8001C', '#FF6A00', '#FF4500',
  '#FFD600', '#F59E0B', '#84CC16', '#10B981', '#00C896',
  '#0EA5E9', '#0057A8', '#6366F1', '#A855F7', '#EC4899',
  '#FFFFFF', '#94A3B8', '#64748B', '#374151', '#2D1F12',
  '#FF00FF', '#00FFFF', '#8B0057', '#004D40', '#C0392B',
];

export const RENDER_STYLES: Array<{ id: string; label: string; desc: string }> = [
  { id: 'golden_age',      label: 'Golden Age',          desc: '1938–1956 · Bold primary colors, flat shadows, iconic heroic poses' },
  { id: 'silver_age',      label: 'Silver Age',          desc: '1956–1970 · Cosmic scale, bright palette, dynamic energy fields' },
  { id: 'bronze_age',      label: 'Bronze Age',          desc: '1970–1985 · Grittier tone, complex plots, deeper shadow work' },
  { id: 'modern_age',      label: 'Modern Age',          desc: '1985–2000 · Hyper-detail crosshatch, extreme anatomy, bold ink' },
  { id: 'marvel_house',    label: 'Action Comics Style',  desc: 'Action anatomy, dynamic movement, full-bleed explosive energy' },
  { id: 'dc_house',        label: 'Heroic Comics Style',  desc: 'Clean heroic figures, architectural backgrounds, visual clarity' },
  { id: 'manga_classic',   label: 'Manga Classic',       desc: 'B&W ink, speed lines, expressive range from chibi to epic scale' },
  { id: 'shonen_manga',    label: 'Shonen Manga',        desc: 'Exaggerated action, bold ink, power aura and determination lines' },
  { id: 'seinen_manga',    label: 'Seinen Manga',        desc: 'Detailed realism, fine crosshatch, psychological depth and grit' },
  { id: 'josei_shoujo',    label: 'Josei / Shoujo',      desc: 'Soft flowing line art, expressive large eyes, emotional resonance' },
  { id: 'noir_crime',      label: 'Noir / Crime',        desc: 'High contrast black, rain-slicked shadows, chiaroscuro lighting' },
  { id: 'horror_ink',      label: 'Horror Ink',          desc: 'Scratchy lines, deep blacks, oppressive atmosphere and dread' },
  { id: 'cosmic_epic',     label: 'Cosmic / Epic',       desc: 'Vast scale, Kirby-dot energy fields, dimensional power effects' },
  { id: 'indie_alt',       label: 'Indie / Alt Comics',  desc: 'Raw expressive line, loose ink, character-driven emotional grit' },
  { id: 'painted_realism', label: 'Painted Realism',     desc: 'Oil and watercolor quality, photorealistic figure rendering' },
  { id: 'european_bd',     label: 'European BD',         desc: 'Ligne claire clean outline, Moebius / Tintin heritage clarity' },
];

export const CHARACTER_ROLES: Array<{ id: CharacterRole; label: string; emoji: string }> = [
  { id: 'HERO',      label: 'Hero',       emoji: '🦸' },
  { id: 'VILLAIN',   label: 'Villain',    emoji: '💀' },
  { id: 'ANTI_HERO', label: 'Anti-Hero',  emoji: '🌑' },
  { id: 'WARRIOR',   label: 'Warrior',    emoji: '⚔️' },
  { id: 'MAGE',      label: 'Mage',       emoji: '🔮' },
  { id: 'ASSASSIN',  label: 'Assassin',   emoji: '🗡️' },
  { id: 'MENTOR',    label: 'Mentor',     emoji: '📜' },
  { id: 'SIDEKICK',  label: 'Sidekick',   emoji: '🤝' },
  { id: 'MONSTER',   label: 'Monster',    emoji: '👹' },
  { id: 'CYBORG',    label: 'Cyborg',     emoji: '🤖' },
  { id: 'SOLDIER',   label: 'Soldier',    emoji: '🪖' },
  { id: 'ALIEN',     label: 'Alien',      emoji: '👽' },
];

export const CINEMATIC_STYLES: Array<{ id: CinematicStyleDNA; label: string; desc: string }> = [
  { id: 'HEROIC',          label: 'Heroic',          desc: 'Alex Ross / Bryan Hitch' },
  { id: 'DARK_NOIR',       label: 'Dark Noir',       desc: 'Frank Miller / Mignola' },
  { id: 'CHAOTIC_ACTION',  label: 'Chaotic Action',  desc: 'McFarlane / David Finch' },
  { id: 'EPIC_FANTASY',    label: 'Epic Fantasy',    desc: 'George Pérez / Coipel' },
  { id: 'HORROR',          label: 'Horror',          desc: 'Mignola / Bernie Wrightson' },
  { id: 'CYBERPUNK',       label: 'Cyberpunk',       desc: 'Manapul / Digital Neon' },
  { id: 'ANIME',           label: 'Anime',           desc: 'High Contrast Anime' },
  { id: 'MANGA',           label: 'Manga',           desc: 'B&W Manga Ink' },
  { id: 'REALISTIC',       label: 'Realistic',       desc: 'Alex Ross Painted' },
  { id: 'PAINTED',         label: 'Painted',         desc: 'Painted Oil / Watercolor' },
];

export const WEAPON_TYPES = [
  'Sword', 'Staff', 'Hammer', 'Spear', 'Bow', 'Gun', 'Shield',
  'Axe', 'Dagger', 'Claws', 'Gauntlet', 'Whip', 'Magic Orb',
];

export const WEAPON_MATERIALS = [
  'Steel', 'Black Steel', 'Ancient Wood', 'Vibranium', 'Bone',
  'Crystal', 'Energy', 'Gold', 'Shadow Material', 'Tech Alloy',
];

export const ENERGY_EFFECTS = [
  'none', 'Lightning Aura', 'Fire Glow', 'Shadow Energy', 'Blue Electric',
  'Green Poison', 'Purple Void', 'Golden Light', 'Ice Crystal', 'Blood Red',
];

export const TATTOO_STYLES = [
  'Ancient Runes', 'Tribal', 'Biomechanical', 'Serpent', 'Dragon Scale',
  'Circuit Pattern', 'Celtic Knot', 'Occult Symbol', 'Clan Crest',
];

export const BODY_LOCATIONS = [
  'Right Arm', 'Left Arm', 'Chest', 'Back', 'Neck', 'Face', 'Shoulder',
  'Forearm', 'Hand', 'Leg', 'Full Body',
];

export const PAINT_STYLES = [
  'War Paint', 'Ritual Mask', 'Tribal Lines', 'Clan Marking', 'Scar Paint',
];

export const PAINT_PLACEMENTS = [
  'Across Eyes', 'Full Face', 'Forehead', 'Cheeks', 'Chin', 'Jaw Line',
];

// ── CharacterDescriptionInterpreter (ported from Java) ────────────────────────

/** Java: CharacterDescriptionInterpreter.interpret()
 *  Parses natural language description → partial CharacterDNA */
export function interpretCharacterDescription(description: string): Partial<CharacterDNA> {
  const partial: Partial<CharacterDNA> = {};
  const d = description.toLowerCase();

  // Age extraction — Java: extractAge()
  for (let i = 18; i <= 80; i++) {
    if (d.includes(String(i))) { partial.age = i; break; }
  }

  // Role
  if (d.includes('villain') || d.includes('evil'))           partial.role = 'VILLAIN';
  else if (d.includes('anti-hero') || d.includes('anti hero')) partial.role = 'ANTI_HERO';
  else if (d.includes('mage') || d.includes('wizard') || d.includes('sorcerer')) partial.role = 'MAGE';
  else if (d.includes('assassin') || d.includes('ninja'))    partial.role = 'ASSASSIN';
  else if (d.includes('cyborg') || d.includes('robot'))      partial.role = 'CYBORG';
  else if (d.includes('monster'))                             partial.role = 'MONSTER';
  else if (d.includes('soldier') || d.includes('military'))  partial.role = 'SOLDIER';
  else if (d.includes('alien'))                               partial.role = 'ALIEN';
  else if (d.includes('warrior') || d.includes('fighter') || d.includes('berserker')) partial.role = 'WARRIOR';
  else if (d.includes('hero'))                                partial.role = 'HERO';

  // Hair
  if (d.includes('long hair'))         partial.hairStyle = 'long_black';
  if (d.includes('bald'))              partial.hairStyle = 'bald';
  if (d.includes('mohawk'))            partial.hairStyle = 'mohawk';
  if (d.includes('white hair') || d.includes('silver hair')) partial.hairColor = 'white';
  if (d.includes('red hair'))          partial.hairColor = 'red';
  if (d.includes('blonde'))            partial.hairColor = 'blonde';
  if (d.includes('beard') || d.includes('stubble') || d.includes('goatee')) {
    partial.beardStyle = d.includes('full beard') ? 'Full Beard'
                       : d.includes('goatee')     ? 'Goatee'
                       : 'Stubble';
  }

  // Scar (simple field — backward compat)
  if (d.includes('scar on') || d.includes('scar')) partial.facialScar = 'left_cheek';

  // Scars (rich)
  if (d.includes('scar')) {
    partial.scars = [{
      featureName: 'Battle Scar',
      location: d.includes('right') ? 'Right Cheek' : 'Left Cheek',
      description: 'Long vertical scar across cheek.',
      permanent: true,
    }];
  }

  // Birthmark
  if (d.includes('birthmark')) {
    partial.birthmarks = [{
      featureName: 'Birthmark',
      location: 'Neck',
      description: 'Dark crescent-shaped birthmark.',
      permanent: true,
    }];
  }

  // Tattoos
  if (d.includes('tattoo') || d.includes('rune')) {
    partial.tattoos = [{
      tattooName: d.includes('rune') ? 'Rune Tattoo' : 'Custom Tattoo',
      bodyLocation: 'Right Arm',
      style: 'Ancient Runes',
      color: 'Blue',
      glowing: d.includes('glow') || d.includes('rune'),
      magical: d.includes('magic') || d.includes('rune'),
      symbolism: d.includes('rune') ? 'Represents magical power.' : 'Personal identity mark.',
    }];
  }

  // Facial paint
  if (d.includes('face paint') || d.includes('war paint')) {
    partial.facialPaints = [{
      paintStyle: 'War Paint',
      color: 'Red',
      placement: 'Across Eyes',
      emotionalMeaning: 'Aggression and warrior spirit.',
      symmetrical: true,
    }];
  }

  // Weapons
  const weapons: WeaponProfile[] = [];
  if (d.includes('staff') || d.includes('scepter')) {
    weapons.push({ weaponName: 'Storm Staff', weaponType: 'Staff', material: 'Ancient Wood', energyEffect: 'Lightning Aura', signatureWeapon: true });
  }
  if (d.includes('sword') || d.includes('blade') || d.includes('katana')) {
    weapons.push({ weaponName: 'Dark Blade', weaponType: 'Sword', material: 'Black Steel', energyEffect: 'Shadow Energy', signatureWeapon: true });
  }
  if (d.includes('hammer')) {
    weapons.push({ weaponName: 'War Hammer', weaponType: 'Hammer', material: 'Vibranium', energyEffect: 'Thunder Energy', signatureWeapon: true });
  }
  if (d.includes('bow') || d.includes('arrow')) {
    weapons.push({ weaponName: 'Void Bow', weaponType: 'Bow', material: 'Shadow Material', energyEffect: 'none', signatureWeapon: true });
  }
  if (d.includes('gun') || d.includes('rifle')) {
    weapons.push({ weaponName: 'Custom Firearm', weaponType: 'Gun', material: 'Tech Alloy', energyEffect: 'none', signatureWeapon: false });
  }
  if (d.includes('claws') || d.includes('talons')) {
    weapons.push({ weaponName: 'Bone Claws', weaponType: 'Claws', material: 'Bone', energyEffect: 'none', signatureWeapon: true });
  }
  if (weapons.length > 0) partial.weapons = weapons;

  // Powers
  const powers: string[] = [];
  const energyEffects: string[] = [];
  if (d.includes('lightning') || d.includes('thunder')) { powers.push('Lightning Control'); energyEffects.push('Blue Electric Aura'); }
  if (d.includes('fire') || d.includes('flame'))        { powers.push('Pyrokinesis'); energyEffects.push('Fire Glow'); }
  if (d.includes('shadow') || d.includes('darkness'))   { powers.push('Shadow Manipulation'); energyEffects.push('Shadow Energy'); }
  if (d.includes('ice') || d.includes('frost'))         { powers.push('Cryokinesis'); energyEffects.push('Ice Crystal'); }
  if (d.includes('fly') || d.includes('flight'))        { powers.push('Flight'); }
  if (d.includes('super strength') || d.includes('superhuman')) { powers.push('Super Strength'); }
  if (d.includes('invisible') || d.includes('stealth power')) { powers.push('Invisibility'); }
  if (d.includes('telepathy') || d.includes('mind'))    { powers.push('Telepathy'); }
  if (powers.length > 0)       partial.powers = powers;
  if (energyEffects.length > 0) partial.energyEffects = energyEffects;

  // Cinematic style
  if (d.includes('cyberpunk') || d.includes('neon'))           partial.cinematicStyleDNA = 'CYBERPUNK';
  else if (d.includes('horror') || d.includes('dark'))         partial.cinematicStyleDNA = 'DARK_NOIR';
  else if (d.includes('anime'))                                 partial.cinematicStyleDNA = 'ANIME';
  else if (d.includes('manga'))                                 partial.cinematicStyleDNA = 'MANGA';
  else if (d.includes('realistic') || d.includes('painted'))   partial.cinematicStyleDNA = 'REALISTIC';
  else if (d.includes('epic') || d.includes('fantasy'))        partial.cinematicStyleDNA = 'EPIC_FANTASY';
  else                                                          partial.cinematicStyleDNA = 'HEROIC';

  // Lighting identity
  if (d.includes('left lighting') || d.includes('rim light'))  partial.lightingIdentity = 'Strong Left Rim Lighting';
  else if (d.includes('backlit'))                               partial.lightingIdentity = 'Backlit Silhouette Lighting';
  else if (d.includes('neon'))                                  partial.lightingIdentity = 'Neon City Reflection Lighting';
  else                                                          partial.lightingIdentity = 'Cinematic Contrast Lighting';

  // Color palette
  if (d.includes('blue') && d.includes('gold'))         partial.colorPalette = 'Electric Blue + Gold';
  else if (d.includes('red') && d.includes('black'))    partial.colorPalette = 'Crimson + Shadow';
  else if (d.includes('purple') || d.includes('void'))  partial.colorPalette = 'Void Purple + Black';
  else                                                   partial.colorPalette = 'Cold Blue + Dark Silver';

  // Motion style
  if (d.includes('fast') || d.includes('speed') || d.includes('agile'))   partial.motionStyle = 'Rapid Diagonal Motion';
  else if (d.includes('heavy') || d.includes('slow') || d.includes('powerful')) partial.motionStyle = 'Heavy Weighted Motion';
  else partial.motionStyle = 'Diagonal Aggressive Motion';

  // Body type from keywords
  if (d.includes('muscular') || d.includes('massive'))   partial.bodyType = 'powerhouse';
  else if (d.includes('slim') || d.includes('agile') || d.includes('lithe')) partial.bodyType = 'slim_agile';
  else if (d.includes('athletic'))                        partial.bodyType = 'athletic_balanced';

  // Body archetype — mirrors BODY_TYPE_AI_ENGINE.detectBodyType()
  if      (d.includes('nerd') || d.includes('skinny') || d.includes('scientist')) partial.bodyArchetype = 'NERD_SLIM';
  else if (d.includes('mega') || d.includes('massive') || d.includes('tank'))     partial.bodyArchetype = 'MEGA_HERO';
  else if (d.includes('beast') || d.includes('monster') || d.includes('creature')) partial.bodyArchetype = 'BEAST_FORM';
  else if (d.includes('speed') || d.includes('runner') || d.includes('acrobat'))  partial.bodyArchetype = 'SPEED_RUNNER';
  else if (d.includes('shadow') || d.includes('ninja') || d.includes('stealth'))  partial.bodyArchetype = 'SHADOW_ASSASSIN';
  else if (d.includes('cosmic') || d.includes('god') || d.includes('titan'))      partial.bodyArchetype = 'COSMIC_TITAN';
  else if (d.includes('hero') || d.includes('athletic') || d.includes('fighter')) partial.bodyArchetype = 'LEAN_HERO';

  // Master anatomy archetype — genre-based anatomy style
  if      (d.includes('mega') || d.includes('massive') || d.includes('powerhouse')) partial.masterAnatomyType = 'MEGA_POWERHOUSE';
  else if (d.includes('anime') || d.includes('shonen') || d.includes('manga'))      partial.masterAnatomyType = 'ANIME_SHONEN';
  else if (d.includes('dark') || d.includes('detective') || d.includes('noir'))     partial.masterAnatomyType = 'DARK_NOIR';
  else if (d.includes('cosmic') || d.includes('god') || d.includes('celestial'))    partial.masterAnatomyType = 'COSMIC_GOD';
  else if (d.includes('monster') || d.includes('beast') || d.includes('mutant'))    partial.masterAnatomyType = 'MONSTER_BEAST';
  else if (d.includes('acrobat') || d.includes('agile') || d.includes('parkour'))   partial.masterAnatomyType = 'AGILE_ACROBAT';

  // Costume material detection — MATERIAL_AI_ENGINE.detectMaterials()
  const mats: string[] = [];
  if (d.includes('lycra') || d.includes('spandex') || d.includes('skin tight'))    mats.push('LYCRA_HEROIC');
  if (d.includes('nanotech') || d.includes('nano armor') || d.includes('adaptive suit')) mats.push('NANOTECH_WEAVE');
  if (d.includes('leather') || d.includes('gothic') || d.includes('trench coat'))  mats.push('GOTHIC_LEATHER');
  if (d.includes('energy cloth') || d.includes('glowing fabric'))                   mats.push('ENERGY_CLOTH');
  if (d.includes('vibranium') || d.includes('kinetic armor'))                       mats.push('VIBRANIUM_WEAVE');
  if (d.includes('symbiote') || d.includes('venom suit'))                           mats.push('SYMBIOTE_ORGANIC');
  if (d.includes('asgardian') || d.includes('uru metal'))                           mats.push('ASGARDIAN_URU_PLATE');
  if (d.includes('kryptonian') || d.includes('solar weave'))                        mats.push('KRYPTONIAN_SOLAR_WEAVE');
  if (d.includes('amazonian') || d.includes('divine gold'))                         mats.push('AMAZONIAN_DIVINE_GOLD');
  if (d.includes('speed force') || d.includes('lightning suit'))                    mats.push('SPEED_FORCE_SUIT');
  if (d.includes('haori') || d.includes('demon slayer'))                            mats.push('HAORI_NICHIRIN');
  if (d.includes('hakama') || d.includes('soul reaper'))                            mats.push('SOUL_REAPER_HAKAMA');
  if (d.includes('cursed') || d.includes('jujutsu'))                                mats.push('CURSED_ENERGY_CLOTH');
  if (d.includes(' gi ') || d.includes('ki cloth') || d.includes('martial gi'))    mats.push('KI_ABSORBING_GI');
  if (d.includes('tactical') || d.includes('kevlar'))                               mats.push('TACTICAL_KEVLAR');
  if (mats.length) partial.costumeMaterials = mats;

  return partial;
}

// ── CharacterMemoryEngine (ported from Java CharacterMemoryDatabase) ───────────
// Java: HashMap<String, CharacterDNA> + saveCharacter() + loadCharacter()
// TypeScript: AsyncStorage-backed React hook

const STORAGE_KEY = '@bloomscript_character_memory_v1';

export function useCharacterMemory() {
  const [characters, setCharacters] = useState<Record<string, CharacterDNA>>({});
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then(raw => {
      if (raw) {
        try { setCharacters(JSON.parse(raw)); } catch { /* corrupt data — ignore */ }
      }
      setLoaded(true);
    });
  }, []);

  const persist = useCallback(async (next: Record<string, CharacterDNA>) => {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  }, []);

  /** Java: memory.saveCharacter(dna) — persists full DNA to AsyncStorage */
  const save = useCallback(async (dna: CharacterDNA) => {
    const next = { ...characters, [dna.characterName]: dna };
    setCharacters(next);
    await persist(next);
  }, [characters, persist]);

  /** Java: memory.loadCharacter(name) */
  const load = useCallback((name: string): CharacterDNA | null => {
    return characters[name] ?? null;
  }, [characters]);

  const remove = useCallback(async (name: string) => {
    const next = { ...characters };
    delete next[name];
    setCharacters(next);
    await persist(next);
  }, [characters, persist]);

  const names = Object.keys(characters).sort();

  return { characters, save, load, remove, names, loaded };
}

// ── Prompt builder (used by director buildPrompt) ─────────────────────────────
// Java: CharacterSummaryRenderer + ConsistencyEngine combined

export function buildCharacterDNAFragment(dna: CharacterDNA): string {
  const fmt = (s: string) => s.replace(/_/g, ' ');

  // Base fields (original)
  const parts: (string | null)[] = [
    `${dna.characterName}.`,
    dna.role                    ? `Role: ${dna.role.replace(/_/g, ' ')}.` : null,
    dna.age                     ? `Age: ${dna.age}.`                       : null,
    `Eyes: ${fmt(dna.eyeShape)}.`,
    dna.eyeColor                ? `Eye color: ${dna.eyeColor}.`            : null,
    `Jaw: ${fmt(dna.jawType)}.`,
    dna.facialScar !== 'none'   ? `Scar: ${fmt(dna.facialScar)}.`          : null,
    // Rich scars override simple scar if present
    ...(dna.scars && dna.scars.length > 0
      ? dna.scars.map(s => `Scar — ${s.location}: ${s.description}`)
      : []),
    ...(dna.birthmarks && dna.birthmarks.length > 0
      ? dna.birthmarks.map(b => `Birthmark — ${b.location}: ${b.description}`)
      : []),
    `Body: ${fmt(dna.bodyType)}.`,
    dna.beardStyle              ? `Beard: ${dna.beardStyle}.`              : null,
    `Hair: ${fmt(dna.hairStyle)}, ${dna.hairColor}.`,
    // Tattoos
    ...(dna.tattoos && dna.tattoos.length > 0
      ? dna.tattoos.map(t =>
          `Tattoo: ${t.tattooName} on ${t.bodyLocation}, ${t.style}` +
          (t.glowing ? ', glowing' : '') +
          (t.magical ? ', magical' : '') +
          `.`)
      : []),
    // Facial paint
    ...(dna.facialPaints && dna.facialPaints.length > 0
      ? dna.facialPaints.map(p => `Face paint: ${p.paintStyle}, ${p.color}, ${p.placement}.`)
      : []),
    `Costume: ${fmt(dna.primarySuit)}.`,
    dna.capeType !== 'none'     ? `Cape: ${fmt(dna.capeType)}.`            : null,
    dna.symbol !== 'none'       ? `Symbol: ${fmt(dna.symbol)}.`            : null,
    // Weapons
    ...(dna.weapons && dna.weapons.length > 0
      ? dna.weapons.filter(w => w.signatureWeapon).map(w =>
          `Signature weapon: ${w.weaponName} (${w.weaponType}` +
          (w.energyEffect && w.energyEffect !== 'none' ? `, ${w.energyEffect}` : '') +
          ').') 
      : []),
    // Powers
    ...(dna.powers && dna.powers.length > 0
      ? [`Powers: ${dna.powers.join(', ')}.`]
      : []),
    ...(dna.energyEffects && dna.energyEffects.length > 0
      ? [`Energy: ${dna.energyEffects.join(', ')}.`]
      : []),
    `Primary color: ${dna.primaryColor}.`,
    `Secondary color: ${dna.secondaryColor}.`,
    `Art style: ${fmt(dna.renderingStyle)}.`,
    // Cinematic style
    dna.cinematicStyleDNA       ? `Cinematic style: ${dna.cinematicStyleDNA.replace(/_/g, ' ')}.` : null,
    dna.lightingIdentity        ? `Lighting: ${dna.lightingIdentity}.`     : null,
    dna.colorPalette            ? `Color palette: ${dna.colorPalette}.`    : null,
    dna.motionStyle             ? `Motion: ${dna.motionStyle}.`            : null,
    // Cinematic Anatomy Engine — Java: AnatomySummaryRenderer
    dna.gender            ? `Gender: ${dna.gender}.` : null,
    dna.maleAnatomyType   ? `Male anatomy type: ${dna.maleAnatomyType.replace(/_/g,' ')}.` : null,
    dna.femaleAnatomyType ? `Female anatomy type: ${dna.femaleAnatomyType.replace(/_/g,' ')}.` : null,
    dna.bodyEmotion       ? `Body emotion: ${dna.bodyEmotion}.` : null,
    dna.muscleFlow        ? `Muscle flow: ${dna.muscleFlow.torsoFlow}. ${dna.muscleFlow.spineCurve}. ${dna.muscleFlow.tensionDirection}.` : null,
    dna.poseStyle         ? `Pose: ${dna.poseStyle}.` : null,
    dna.movementEnergy    ? `Movement energy: ${dna.movementEnergy}.` : null,
    dna.silhouetteType    ? `Silhouette: ${dna.silhouetteType}.` : null,
    // Universe Engine — species + civilization (Java: UniversalCinematicStoryEngine)
    dna.speciesDNA ? `Species: ${dna.speciesDNA.speciesType.replace(/_/g,' ')}. Body: ${dna.speciesDNA.bodyStructure}. Movement: ${dna.speciesDNA.movementStyle}.${dna.speciesDNA.wings ? ' Wings.' : ''}${dna.speciesDNA.tail ? ' Tail.' : ''}${dna.speciesDNA.glowingSkin ? ` ${dna.speciesDNA.energySignature}.` : ''}` : null,
    dna.civilization ? `Civilization: ${dna.civilization.civilizationType.replace(/_/g,' ')}. Architecture: ${dna.civilization.architectureStyle}. Clothing: ${dna.civilization.clothingStyle}. Color palette: ${dna.civilization.colorIdentity}.` : null,
    dna.emotionalTone ? `Emotional tone: ${dna.emotionalTone}.` : null,
    // Consistency locks — Java: ConsistencyEngine.applyConsistency()
    (dna.lockFace || dna.lockCostume || dna.lockWeapons || dna.lockLighting)
      ? 'CONSISTENCY LOCKS: ' + [
          dna.lockFace            ? 'face' : null,
          dna.lockHair            ? 'hair' : null,
          dna.lockTattooPlacement ? 'tattoos' : null,
          dna.lockCostume         ? 'costume' : null,
          dna.lockColorPalette    ? 'colors' : null,
          dna.lockWeapons         ? 'weapons' : null,
          dna.lockLighting        ? 'lighting' : null,
        ].filter(Boolean).join(', ') + ' — maintain across all panels.'
      : null,
  ];

  return parts.filter(Boolean).join(' ');
}
