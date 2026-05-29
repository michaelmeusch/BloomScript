// ── VISUAL MEMORY BANK ────────────────────────────────────────────────────────
// Persistent AI style memory for Comic Art Studio
// Storage format: style_vector.json per profile, 64-dim CLIP-style float embedding
// Categories: Style Profiles, Character DNA, Lighting Signatures,
//             Pose Archetypes, Environment Styles, Brush Systems, Composition Patterns

import AsyncStorage from '@react-native-async-storage/async-storage';

// ── style_vector.json schema ──────────────────────────────────────────────────

export interface LineStyle {
  weight:       'ultra-thin' | 'thin' | 'medium' | 'heavy' | 'ultra-heavy';
  variation:    number; // 0–1
  edgeSharpness:number; // 0–1
  inkingStyle:  string; // e.g. "western_comic", "manga", "brush_ink"
}

export interface AnatomyStyle {
  heroicScale:      number; // 0–1
  stylization:      'realistic' | 'semi-realistic' | 'stylized' | 'cartoon' | 'anime';
  headRatio:        string;  // e.g. "7.5_heads"
  muscleDefinition: number;  // 0–1
}

export interface LightingStyle {
  shadowType:    'soft' | 'medium' | 'hard' | 'extreme';
  contrast:      number;  // 0–1
  rimLight:      boolean;
  lightingStyle: string;  // e.g. "cinematic", "flat", "dramatic"
}

export interface ColorStyle {
  palette:     string[];  // hex colors from image
  saturation:  number;    // 0–1
  temperature: 'very-cool' | 'cool' | 'neutral' | 'warm' | 'very-warm';
  style:       string;    // e.g. "retro_marvel", "noir_monochrome"
}

export interface CompositionStyle {
  cameraAngle: string;  // e.g. "worm_eye", "low_angle"
  motionFlow:  string;  // e.g. "diagonal", "explosive"
  panelEnergy: number;  // 0–1
}

export interface MotionStyle {
  speedLines:    boolean;
  impactFrames:  boolean;
  poseEnergy:    number; // 0–1
  choreography:  'static' | 'sequential' | 'explosive' | 'aerial' | 'flowing';
  motionBlur:    number; // 0–1
}

export interface EnvironmentBlock {
  density:           number; // 0–1 (sparse → dense)
  atmosphere:        string; // "gothic" | "cyberpunk" | "natural" | "alien" | "urban" | "feudal"
  timeOfDay:         string; // "day" | "night" | "dusk" | "dawn" | "void"
  weatherFX:         string[]; // e.g. ["rain", "fog", "snow"]
  architectureStyle: string; // e.g. "gothic_city" | "japanese_temple" | "megacity"
}

// ── Full Style Vector (primary memory unit — style_vector.json) ───────────────

export interface StyleVector {
  profileId:   string;
  name:        string;
  createdAt:   number;
  sourceImageUri?: string;
  keywords:    string[];
  embedding:   number[];  // 64-dim CLIP-style float array
  lineStyle:   LineStyle;
  anatomy:     AnatomyStyle;
  lighting:    LightingStyle;
  color:       ColorStyle;
  composition: CompositionStyle;
  // Optional extended blocks (v2.0)
  motion?:      MotionStyle;
  environment?: EnvironmentBlock;
  learnedPatterns?: string[];
  trainingIntent?:  string;
  // Pipeline classification outputs
  classifiedGenre?:          string;
  classifiedMood?:           string;
  classifiedRenderLanguage?: string;
}

// ── Other memory category types ───────────────────────────────────────────────

export interface CharacterDNAMemory {
  profileId:  string;
  name:       string;
  createdAt:  number;
  keywords:   string[];
  embedding:  number[];
  dna:        Record<string, unknown>;
  thumbnail?: string;
}

export interface LightingSignature {
  profileId:        string;
  name:             string;
  createdAt:        number;
  keywords:         string[];
  embedding:        number[];
  shadowType:       string;
  contrast:         number;
  rimLight:         boolean;
  lightingStyle:    string;
  ambientMood:      string;
  keyLightDirection:string;
  colorTemperature: string;
}

export interface PoseArchetype {
  profileId:    string;
  name:         string;
  createdAt:    number;
  keywords:     string[];
  embedding:    number[];
  posture:      string;
  cameraAngle:  string;
  bodyLanguage: string;
  motionState:  string;
  weightShift:  string;
}

export interface EnvironmentStyle {
  profileId:         string;
  name:              string;
  createdAt:         number;
  keywords:          string[];
  embedding:         number[];
  setting:           string;
  atmosphere:        string[];
  timeOfDay:         string;
  weatherFX:         string[];
  colorMood:         string;
  architectureStyle: string;
}

export interface BrushSystem {
  profileId:       string;
  name:            string;
  createdAt:       number;
  keywords:        string[];
  embedding:       number[];
  lineWeight:      string;
  inkingStyle:     string;
  textureAmount:   number;
  edgeSharpness:   number;
  strokeVariation: number;
  medium:          string;
}

export interface CompositionPattern {
  profileId:     string;
  name:          string;
  createdAt:     number;
  keywords:      string[];
  embedding:     number[];
  cameraAngle:   string;
  motionFlow:    string;
  panelEnergy:   number;
  panelLayout:   string;
  eyeGuidance:   string;
  hierarchyTool: string;
}

// ── Memory Bank container ─────────────────────────────────────────────────────

export type MemoryCategory =
  | 'styleProfiles'
  | 'characterDNA'
  | 'lightingSignatures'
  | 'poseArchetypes'
  | 'environmentStyles'
  | 'brushSystems'
  | 'compositionPatterns';

export const MEMORY_CATEGORY_META: Record<MemoryCategory, { label: string; icon: string; color: string; description: string }> = {
  styleProfiles:       { label: 'Style Profiles',      icon: '🎨', color: '#FFD600', description: 'Full visual style DNA from image analysis' },
  characterDNA:        { label: 'Character DNA',        icon: '🦸', color: '#E8001C', description: 'Saved character builds and anatomy profiles' },
  lightingSignatures:  { label: 'Lighting Signatures',  icon: '💡', color: '#F97316', description: 'Shadow, contrast and cinematic light profiles' },
  poseArchetypes:      { label: 'Pose Archetypes',      icon: '🥋', color: '#A78BFA', description: 'Body posture and camera angle templates' },
  environmentStyles:   { label: 'Environment Styles',   icon: '🌆', color: '#22C55E', description: 'Scene, atmosphere and world visual memories' },
  brushSystems:        { label: 'Brush Systems',        icon: '✏️', color: '#C4913A', description: 'Line weight, inking and stroke profiles' },
  compositionPatterns: { label: 'Composition Patterns', icon: '📐', color: '#38BDF8', description: 'Camera, motion flow and panel energy patterns' },
};

export interface MemoryBank {
  styleProfiles:       StyleVector[];
  characterDNA:        CharacterDNAMemory[];
  lightingSignatures:  LightingSignature[];
  poseArchetypes:      PoseArchetype[];
  environmentStyles:   EnvironmentStyle[];
  brushSystems:        BrushSystem[];
  compositionPatterns: CompositionPattern[];
}

// ── Trigger phrases ───────────────────────────────────────────────────────────

// ── v2.0 extended trigger system ─────────────────────────────────────────────

export const LEARN_TRIGGERS = [
  'comic art studio: learn this',
  'comic art studio: study anatomy',
  'comic art studio: study shadows',
  'comic art studio: study lighting',
  'comic art studio: study motion',
  'comic art studio: study composition',
  'comic art studio: memorize environment',
  'comic art studio: extract comic composition',
  'comic art studio: learn manga motion',
  'comic art studio: study cinematic lighting',
  'learn this',
  'study style',
  'memorize art',
  'save visual dna',
  'analyze rendering',
  'extract anatomy',
  'store lighting style',
  'study anatomy',
  'study shadows',
  'study lighting',
  'study motion',
  'study composition',
  'study environment',
  'learn manga motion',
  'study speed lines',
  'study ink techniques',
];

export const RECALL_TRIGGERS = [
  'comic art studio: use learned style',
  'use learned style',
  'recall style',
  'apply saved style',
  'use memorized style',
  'use visual memory',
  'apply visual dna',
];

export type StudyFocus =
  | 'anatomy' | 'shadows' | 'lighting' | 'motion'
  | 'composition' | 'environment' | 'manga' | 'noir'
  | 'superhero' | 'cinematic' | 'general';

export interface StudyIntent {
  focus:      StudyFocus[];
  manga:      boolean;
  noir:       boolean;
  superhero:  boolean;
  cinematic:  boolean;
  rawText:    string;
}

export function detectLearnTrigger(text: string): boolean {
  const lower = text.toLowerCase().trim();
  return LEARN_TRIGGERS.some(t => lower.includes(t));
}

export function detectRecallTrigger(text: string): boolean {
  const lower = text.toLowerCase().trim();
  return RECALL_TRIGGERS.some(t => lower.includes(t));
}

export function parseStudyIntent(text: string): StudyIntent {
  const lower = text.toLowerCase();
  const focus: StudyFocus[] = [];
  if (lower.includes('anatomy') || lower.includes('pose') || lower.includes('figure')) focus.push('anatomy');
  if (lower.includes('shadow') || lower.includes('noir') || lower.includes('black')) focus.push('shadows');
  if (lower.includes('light') || lower.includes('cinematic') || lower.includes('rim')) focus.push('lighting');
  if (lower.includes('motion') || lower.includes('speed') || lower.includes('action') || lower.includes('fight')) focus.push('motion');
  if (lower.includes('composition') || lower.includes('panel') || lower.includes('splash') || lower.includes('framing')) focus.push('composition');
  if (lower.includes('environment') || lower.includes('background') || lower.includes('city') || lower.includes('world')) focus.push('environment');
  if (lower.includes('manga') || lower.includes('anime') || lower.includes('japanese')) focus.push('manga');
  return {
    focus: focus.length ? focus : ['general'],
    manga:     lower.includes('manga') || lower.includes('anime'),
    noir:      lower.includes('noir') || lower.includes('dark'),
    superhero: lower.includes('superhero') || lower.includes('hero') || lower.includes('marvel') || lower.includes('dc'),
    cinematic: lower.includes('cinematic') || lower.includes('film'),
    rawText:   text,
  };
}

export function buildLearnedPatterns(intent: StudyIntent): string[] {
  const patterns: string[] = [];
  if (intent.manga) patterns.push('manga_motion', 'anime_shadows', 'speed_line_system', 'cel_shading');
  if (intent.noir) patterns.push('heavy_blacks', 'cinematic_noir', 'gritty_lighting', 'chiaroscuro');
  if (intent.superhero) patterns.push('heroic_anatomy', 'dynamic_foreshortening', 'power_pose_structure', 'heavy_ink_spotting');
  if (intent.cinematic) patterns.push('cinematic_depth', 'film_composition', 'dramatic_lighting', 'cinematic_grading');
  if (intent.focus.includes('anatomy')) patterns.push('figure_construction', 'muscle_definition', 'proportion_system');
  if (intent.focus.includes('shadows')) patterns.push('shadow_mapping', 'contrast_system', 'value_structure');
  if (intent.focus.includes('motion')) patterns.push('impact_frame_system', 'speed_line_flow', 'pose_energy');
  if (intent.focus.includes('composition')) patterns.push('panel_layout', 'eye_guidance', 'splash_composition');
  if (intent.focus.includes('environment')) patterns.push('environment_density', 'atmospheric_depth', 'world_building');
  return [...new Set(patterns)];
}

// ── AsyncStorage engine ───────────────────────────────────────────────────────

const STORAGE_KEY = '@comicart:visual_memory_bank_v1';

function genId(): string {
  return `${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

async function loadBank(): Promise<MemoryBank> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return emptyBank();
    return JSON.parse(raw) as MemoryBank;
  } catch {
    return emptyBank();
  }
}

async function saveBank(bank: MemoryBank): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(bank));
}

function emptyBank(): MemoryBank {
  return {
    styleProfiles: [], characterDNA: [], lightingSignatures: [],
    poseArchetypes: [], environmentStyles: [], brushSystems: [], compositionPatterns: [],
  };
}

// ── Style Profiles CRUD ───────────────────────────────────────────────────────

export async function saveStyleProfile(
  profile: Omit<StyleVector, 'profileId' | 'createdAt'>,
): Promise<StyleVector> {
  const bank = await loadBank();
  const full: StyleVector = { ...profile, profileId: genId(), createdAt: Date.now() };
  bank.styleProfiles = [full, ...bank.styleProfiles];
  await saveBank(bank);
  return full;
}

export async function listStyleProfiles(): Promise<StyleVector[]> {
  return (await loadBank()).styleProfiles;
}

export async function getStyleProfile(profileId: string): Promise<StyleVector | null> {
  const bank = await loadBank();
  return bank.styleProfiles.find(p => p.profileId === profileId) ?? null;
}

export async function deleteStyleProfile(profileId: string): Promise<void> {
  const bank = await loadBank();
  bank.styleProfiles = bank.styleProfiles.filter(p => p.profileId !== profileId);
  await saveBank(bank);
}

// ── Character DNA CRUD ────────────────────────────────────────────────────────

export async function saveCharacterDNA(
  entry: Omit<CharacterDNAMemory, 'profileId' | 'createdAt'>,
): Promise<CharacterDNAMemory> {
  const bank = await loadBank();
  const full: CharacterDNAMemory = { ...entry, profileId: genId(), createdAt: Date.now() };
  bank.characterDNA = [full, ...bank.characterDNA];
  await saveBank(bank);
  return full;
}

export async function listCharacterDNA(): Promise<CharacterDNAMemory[]> {
  return (await loadBank()).characterDNA;
}

export async function deleteCharacterDNA(profileId: string): Promise<void> {
  const bank = await loadBank();
  bank.characterDNA = bank.characterDNA.filter(p => p.profileId !== profileId);
  await saveBank(bank);
}

// ── Lighting Signatures CRUD ──────────────────────────────────────────────────

export async function saveLightingSignature(
  entry: Omit<LightingSignature, 'profileId' | 'createdAt'>,
): Promise<LightingSignature> {
  const bank = await loadBank();
  const full: LightingSignature = { ...entry, profileId: genId(), createdAt: Date.now() };
  bank.lightingSignatures = [full, ...bank.lightingSignatures];
  await saveBank(bank);
  return full;
}

export async function listLightingSignatures(): Promise<LightingSignature[]> {
  return (await loadBank()).lightingSignatures;
}

export async function deleteLightingSignature(profileId: string): Promise<void> {
  const bank = await loadBank();
  bank.lightingSignatures = bank.lightingSignatures.filter(p => p.profileId !== profileId);
  await saveBank(bank);
}

// ── Pose Archetypes CRUD ──────────────────────────────────────────────────────

export async function savePoseArchetype(
  entry: Omit<PoseArchetype, 'profileId' | 'createdAt'>,
): Promise<PoseArchetype> {
  const bank = await loadBank();
  const full: PoseArchetype = { ...entry, profileId: genId(), createdAt: Date.now() };
  bank.poseArchetypes = [full, ...bank.poseArchetypes];
  await saveBank(bank);
  return full;
}

export async function listPoseArchetypes(): Promise<PoseArchetype[]> {
  return (await loadBank()).poseArchetypes;
}

export async function deletePoseArchetype(profileId: string): Promise<void> {
  const bank = await loadBank();
  bank.poseArchetypes = bank.poseArchetypes.filter(p => p.profileId !== profileId);
  await saveBank(bank);
}

// ── Environment Styles CRUD ───────────────────────────────────────────────────

export async function saveEnvironmentStyle(
  entry: Omit<EnvironmentStyle, 'profileId' | 'createdAt'>,
): Promise<EnvironmentStyle> {
  const bank = await loadBank();
  const full: EnvironmentStyle = { ...entry, profileId: genId(), createdAt: Date.now() };
  bank.environmentStyles = [full, ...bank.environmentStyles];
  await saveBank(bank);
  return full;
}

export async function listEnvironmentStyles(): Promise<EnvironmentStyle[]> {
  return (await loadBank()).environmentStyles;
}

export async function deleteEnvironmentStyle(profileId: string): Promise<void> {
  const bank = await loadBank();
  bank.environmentStyles = bank.environmentStyles.filter(p => p.profileId !== profileId);
  await saveBank(bank);
}

// ── Brush Systems CRUD ────────────────────────────────────────────────────────

export async function saveBrushSystem(
  entry: Omit<BrushSystem, 'profileId' | 'createdAt'>,
): Promise<BrushSystem> {
  const bank = await loadBank();
  const full: BrushSystem = { ...entry, profileId: genId(), createdAt: Date.now() };
  bank.brushSystems = [full, ...bank.brushSystems];
  await saveBank(bank);
  return full;
}

export async function listBrushSystems(): Promise<BrushSystem[]> {
  return (await loadBank()).brushSystems;
}

export async function deleteBrushSystem(profileId: string): Promise<void> {
  const bank = await loadBank();
  bank.brushSystems = bank.brushSystems.filter(p => p.profileId !== profileId);
  await saveBank(bank);
}

// ── Composition Patterns CRUD ─────────────────────────────────────────────────

export async function saveCompositionPattern(
  entry: Omit<CompositionPattern, 'profileId' | 'createdAt'>,
): Promise<CompositionPattern> {
  const bank = await loadBank();
  const full: CompositionPattern = { ...entry, profileId: genId(), createdAt: Date.now() };
  bank.compositionPatterns = [full, ...bank.compositionPatterns];
  await saveBank(bank);
  return full;
}

export async function listCompositionPatterns(): Promise<CompositionPattern[]> {
  return (await loadBank()).compositionPatterns;
}

export async function deleteCompositionPattern(profileId: string): Promise<void> {
  const bank = await loadBank();
  bank.compositionPatterns = bank.compositionPatterns.filter(p => p.profileId !== profileId);
  await saveBank(bank);
}

// ── Full bank accessors ───────────────────────────────────────────────────────

export async function getMemoryBank(): Promise<MemoryBank> {
  return loadBank();
}

export async function clearCategory(category: MemoryCategory): Promise<void> {
  const bank = await loadBank();
  (bank[category] as unknown[]) = [];
  await saveBank(bank);
}

export function getTotalCount(bank: MemoryBank): number {
  return Object.values(bank).reduce((sum, arr) => sum + (arr as unknown[]).length, 0);
}

// ── 64-dim CLIP-style embedding (cosine similarity search) ───────────────────

export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) return 0;
  let dot = 0, magA = 0, magB = 0;
  for (let i = 0; i < a.length; i++) {
    dot  += a[i] * b[i];
    magA += a[i] * a[i];
    magB += b[i] * b[i];
  }
  return dot / (Math.sqrt(magA) * Math.sqrt(magB) + 1e-9);
}

export function findMostSimilarProfile(
  query: number[],
  profiles: StyleVector[],
): StyleVector | null {
  if (!profiles.length) return null;
  let best = profiles[0];
  let bestScore = cosineSimilarity(query, profiles[0].embedding);
  for (const p of profiles.slice(1)) {
    const score = cosineSimilarity(query, p.embedding);
    if (score > bestScore) { bestScore = score; best = p; }
  }
  return best;
}

// ── v2.0 Style Categories ─────────────────────────────────────────────────────

export const STYLE_CATEGORIES = {
  linework: [
    'brush ink', 'technical pen', 'crosshatching', 'scratch lines',
    'feathering', 'heavy black spotting', 'dry brush', 'clean contour',
    'bold contour', 'minimal rendering',
  ],
  anatomy: [
    'heroic anatomy', 'extreme anatomy', 'emotional anatomy',
    'stylized anatomy', 'realistic anatomy', 'manga anatomy',
    'gothic anatomy', 'iconic posing',
  ],
  shadows: [
    'noir blacks', 'anime cel shadows', 'hard comic shadows',
    'soft painterly light', 'ambient lighting', 'rim lighting',
    'realistic shadows', 'flat lighting',
  ],
  composition: [
    'splash pages', 'worms-eye shots', 'dutch angles', 'impact framing',
    'panel pacing', 'visual rhythm', 'dynamic camera angles', 'film composition',
    'depth layering', 'dramatic composition',
  ],
  motion: [
    'speed line flow', 'fight choreography', 'impact exaggeration',
    'martial poses', 'aerial movement', 'dynamic action', 'aggressive motion',
    'expressive energy',
  ],
  environments: [
    'gothic cities', 'futuristic megacities', 'alien worlds', 'medieval villages',
    'japanese temples', 'space stations', 'urban grit', 'cyberpunk neon',
  ],
} as const;

export type StyleCategoryKey = keyof typeof STYLE_CATEGORIES;

// ── v2.0 User Training Guide ──────────────────────────────────────────────────

export const USER_TRAINING_GUIDE = {
  intro: 'The AI learns best when uploads are high quality, style intent is clearly described, and you explain what should be studied.',
  uploadRules: [
    'Use clear comic pages or full illustrations',
    'Avoid blurry screenshots or low-res JPGs',
    'Upload full pages when possible',
    'Upload separated styles individually',
    'Use high contrast images for better learning',
    'Train one major style at a time',
    'Use 10–50 images per style',
  ],
  trainingCommands: [
    'Comic Art Studio: learn this',
    'Comic Art Studio: study anatomy',
    'Comic Art Studio: study shadows',
    'Comic Art Studio: study lighting',
    'Comic Art Studio: learn manga motion',
    'Comic Art Studio: study cinematic lighting',
    'Comic Art Studio: memorize environment style',
    'Comic Art Studio: extract comic composition',
  ],
  bestPractices: [
    'Train one visual category at a time',
    'Separate noir from manga from superhero styles',
    'Train environments separately from anatomy',
    'Use action scenes to teach movement',
    'Describe what the AI should study',
  ],
  trainingExamples: [
    'Comic Art Studio:\nLearn this manga action style\nStudy speed lines and anatomy',
    'Comic Art Studio:\nStudy noir lighting\nLearn cinematic shadows\nMemorize environment detail',
    'Comic Art Studio:\nLearn superhero anatomy\nStudy dynamic poses\nAnalyze splash page composition',
    'Comic Art Studio:\nStudy feudal Japan architecture\nLearn samurai clothing folds\nAnalyze ink brush techniques',
  ],
} as const;

// ── v2.0 Genre Presets — 10 comic styles ─────────────────────────────────────

export const GENRE_PRESETS: Array<Omit<StyleVector, 'profileId' | 'createdAt' | 'embedding'>> = [
  {
    name: 'American Comics',
    keywords: ['heavy-ink', 'heroic-anatomy', 'dynamic-action', 'bold-contour', 'cinematic-realism'],
    lineStyle: { weight: 'heavy', variation: 0.82, edgeSharpness: 0.88, inkingStyle: 'western_comic' },
    anatomy: { heroicScale: 0.92, stylization: 'semi-realistic', headRatio: '8_heads', muscleDefinition: 0.85 },
    lighting: { shadowType: 'hard', contrast: 0.88, rimLight: true, lightingStyle: 'cinematic' },
    color: { palette: ['#101820', '#FF2200', '#3366FF', '#FFD600'], saturation: 0.78, temperature: 'warm', style: 'retro_marvel' },
    composition: { cameraAngle: 'low_angle', motionFlow: 'diagonal', panelEnergy: 0.92 },
    motion: { speedLines: false, impactFrames: true, poseEnergy: 0.88, choreography: 'explosive', motionBlur: 0.3 },
    learnedPatterns: ['heroic_anatomy', 'dynamic_foreshortening', 'power_pose_structure', 'heavy_ink_spotting'],
    classifiedGenre: 'superhero', classifiedMood: 'heroic', classifiedRenderLanguage: 'DYNAMIC_ACTION',
  },
  {
    name: 'Japanese Manga',
    keywords: ['speed-lines', 'cel-shading', 'manga-anatomy', 'expressive-energy', 'flat-bold'],
    lineStyle: { weight: 'thin', variation: 0.65, edgeSharpness: 0.92, inkingStyle: 'manga' },
    anatomy: { heroicScale: 0.72, stylization: 'stylized', headRatio: '7_heads', muscleDefinition: 0.55 },
    lighting: { shadowType: 'hard', contrast: 0.78, rimLight: false, lightingStyle: 'flat' },
    color: { palette: ['#FFFFFF', '#000000', '#FF6B9D', '#00D4FF'], saturation: 0.85, temperature: 'neutral', style: 'anime_vivid' },
    composition: { cameraAngle: 'eye_level', motionFlow: 'explosive', panelEnergy: 0.95 },
    motion: { speedLines: true, impactFrames: true, poseEnergy: 0.95, choreography: 'explosive', motionBlur: 0.6 },
    learnedPatterns: ['manga_motion', 'anime_shadows', 'speed_line_system', 'cel_shading', 'impact_frame_system'],
    classifiedGenre: 'manga_action', classifiedMood: 'aggressive', classifiedRenderLanguage: 'ANIME_CEL',
  },
  {
    name: 'European Comics',
    keywords: ['clean-line', 'flat-bold', 'iconic-posing', 'retro-print', 'minimal-rendering'],
    lineStyle: { weight: 'medium', variation: 0.4, edgeSharpness: 0.95, inkingStyle: 'technical_pen' },
    anatomy: { heroicScale: 0.5, stylization: 'cartoon', headRatio: '7_heads', muscleDefinition: 0.3 },
    lighting: { shadowType: 'soft', contrast: 0.5, rimLight: false, lightingStyle: 'flat' },
    color: { palette: ['#E8D44D', '#E84545', '#2B5BB6', '#FFFFFF'], saturation: 0.9, temperature: 'warm', style: 'flat_bold' },
    composition: { cameraAngle: 'eye_level', motionFlow: 'horizontal', panelEnergy: 0.6 },
    learnedPatterns: ['clear_line_system', 'flat_color_fills', 'iconic_design', 'panel_rhythm'],
    classifiedGenre: 'european_bd', classifiedMood: 'triumphant', classifiedRenderLanguage: 'CLEAN_LINE',
  },
  {
    name: 'Dark Fantasy Comics',
    keywords: ['gothic', 'painterly', 'heavy-blacks', 'dramatic-light', 'depth-layering'],
    lineStyle: { weight: 'heavy', variation: 0.75, edgeSharpness: 0.72, inkingStyle: 'brush_ink' },
    anatomy: { heroicScale: 0.8, stylization: 'semi-realistic', headRatio: '8_heads', muscleDefinition: 0.78 },
    lighting: { shadowType: 'extreme', contrast: 0.94, rimLight: true, lightingStyle: 'chiaroscuro' },
    color: { palette: ['#0D0D0D', '#8B0000', '#4B0082', '#C4913A'], saturation: 0.55, temperature: 'cool', style: 'painted_oil' },
    composition: { cameraAngle: 'dutch_angle', motionFlow: 'diagonal', panelEnergy: 0.85 },
    environment: { density: 0.9, atmosphere: 'gothic', timeOfDay: 'night', weatherFX: ['fog', 'rain'], architectureStyle: 'gothic_city' },
    learnedPatterns: ['heavy_blacks', 'cinematic_noir', 'chiaroscuro', 'atmospheric_depth', 'gothic_world_building'],
    classifiedGenre: 'horror', classifiedMood: 'bleak', classifiedRenderLanguage: 'HEAVY_INK',
  },
  {
    name: 'Sci-Fi Comics',
    keywords: ['cyberpunk-neon', 'digital-painting', 'hyper-detail', 'cinematic', 'megacity'],
    lineStyle: { weight: 'medium', variation: 0.6, edgeSharpness: 0.85, inkingStyle: 'digital_clean' },
    anatomy: { heroicScale: 0.82, stylization: 'semi-realistic', headRatio: '8_heads', muscleDefinition: 0.7 },
    lighting: { shadowType: 'hard', contrast: 0.85, rimLight: true, lightingStyle: 'neon' },
    color: { palette: ['#0A0A1E', '#00F5FF', '#FF00FF', '#FFD600'], saturation: 0.95, temperature: 'cool', style: 'neon_glow' },
    composition: { cameraAngle: 'worm_eye', motionFlow: 'vertical', panelEnergy: 0.88 },
    environment: { density: 0.95, atmosphere: 'cyberpunk', timeOfDay: 'night', weatherFX: ['rain', 'neon-haze'], architectureStyle: 'megacity' },
    learnedPatterns: ['cinematic_depth', 'neon_glow_system', 'film_composition', 'megacity_world'],
    classifiedGenre: 'sci_fi', classifiedMood: 'operatic', classifiedRenderLanguage: 'NEON_NOIR',
  },
  {
    name: 'Indie Comics',
    keywords: ['minimal', 'expressive', 'raw-line', 'emotional-anatomy', 'flat-color'],
    lineStyle: { weight: 'thin', variation: 0.85, edgeSharpness: 0.5, inkingStyle: 'brush_ink' },
    anatomy: { heroicScale: 0.3, stylization: 'stylized', headRatio: '7_heads', muscleDefinition: 0.2 },
    lighting: { shadowType: 'soft', contrast: 0.45, rimLight: false, lightingStyle: 'flat' },
    color: { palette: ['#F5E6D0', '#2D2D2D', '#C0392B', '#7B68EE'], saturation: 0.55, temperature: 'warm', style: 'flat_bold' },
    composition: { cameraAngle: 'eye_level', motionFlow: 'static', panelEnergy: 0.45 },
    learnedPatterns: ['raw_line_energy', 'emotional_anatomy', 'minimalist_rendering', 'expressive_mark'],
    classifiedGenre: 'indie', classifiedMood: 'melancholic', classifiedRenderLanguage: 'CLEAN_LINE',
  },
  {
    name: 'Underground Comics',
    keywords: ['underground', 'raw', 'scratchy-noir', 'gritty', 'heavy-crosshatch'],
    lineStyle: { weight: 'heavy', variation: 0.92, edgeSharpness: 0.45, inkingStyle: 'brush_ink' },
    anatomy: { heroicScale: 0.25, stylization: 'cartoon', headRatio: '6_heads', muscleDefinition: 0.15 },
    lighting: { shadowType: 'extreme', contrast: 0.92, rimLight: false, lightingStyle: 'dramatic' },
    color: { palette: ['#1A1A1A', '#F0E68C', '#8B4513', '#CD5C5C'], saturation: 0.4, temperature: 'warm', style: 'halftone_print' },
    composition: { cameraAngle: 'eye_level', motionFlow: 'explosive', panelEnergy: 0.78 },
    environment: { density: 0.7, atmosphere: 'urban', timeOfDay: 'night', weatherFX: [], architectureStyle: 'gothic_city' },
    learnedPatterns: ['heavy_blacks', 'gritty_lighting', 'crosshatch_texture', 'underground_energy'],
    classifiedGenre: 'indie', classifiedMood: 'paranoid', classifiedRenderLanguage: 'GRAINY_NOIR',
  },
  {
    name: 'Webtoon Styles',
    keywords: ['vertical-scroll', 'clean-digital', 'soft-light', 'muted-palette', 'modern'],
    lineStyle: { weight: 'thin', variation: 0.5, edgeSharpness: 0.9, inkingStyle: 'digital_clean' },
    anatomy: { heroicScale: 0.55, stylization: 'anime', headRatio: '7_heads', muscleDefinition: 0.35 },
    lighting: { shadowType: 'soft', contrast: 0.55, rimLight: true, lightingStyle: 'ambient' },
    color: { palette: ['#FAFAFA', '#FFB7C5', '#7FC6E8', '#B8A9E0'], saturation: 0.65, temperature: 'cool', style: 'anime_vivid' },
    composition: { cameraAngle: 'eye_level', motionFlow: 'vertical', panelEnergy: 0.62 },
    learnedPatterns: ['soft_digital_light', 'clean_line_system', 'modern_manga_anatomy', 'scroll_composition'],
    classifiedGenre: 'manga_action', classifiedMood: 'dreamlike', classifiedRenderLanguage: 'ANIME_CEL',
  },
  {
    name: 'Anime Hybrid Comics',
    keywords: ['anime-cinematic', 'dynamic', 'cel-shading', 'speed-lines', 'impact'],
    lineStyle: { weight: 'medium', variation: 0.72, edgeSharpness: 0.88, inkingStyle: 'manga' },
    anatomy: { heroicScale: 0.85, stylization: 'anime', headRatio: '7.5_heads', muscleDefinition: 0.68 },
    lighting: { shadowType: 'hard', contrast: 0.82, rimLight: true, lightingStyle: 'cinematic' },
    color: { palette: ['#0D0D1A', '#FF4500', '#00E5FF', '#FFD700'], saturation: 0.88, temperature: 'neutral', style: 'anime_vivid' },
    composition: { cameraAngle: 'low_angle', motionFlow: 'explosive', panelEnergy: 0.94 },
    motion: { speedLines: true, impactFrames: true, poseEnergy: 0.94, choreography: 'aerial', motionBlur: 0.55 },
    learnedPatterns: ['manga_motion', 'cel_shading', 'cinematic_depth', 'impact_frame_system', 'aerial_movement'],
    classifiedGenre: 'manga_action', classifiedMood: 'heroic', classifiedRenderLanguage: 'DYNAMIC_ACTION',
  },
  {
    name: 'Painterly Comics',
    keywords: ['painterly', 'oil-paint', 'soft-light', 'depth-layering', 'realistic-shadows'],
    lineStyle: { weight: 'medium', variation: 0.88, edgeSharpness: 0.35, inkingStyle: 'painted' },
    anatomy: { heroicScale: 0.7, stylization: 'realistic', headRatio: '8_heads', muscleDefinition: 0.75 },
    lighting: { shadowType: 'soft', contrast: 0.72, rimLight: true, lightingStyle: 'natural' },
    color: { palette: ['#2C1810', '#8B7355', '#C4A882', '#E8D5B7'], saturation: 0.6, temperature: 'warm', style: 'painted_oil' },
    composition: { cameraAngle: 'eye_level', motionFlow: 'diagonal', panelEnergy: 0.65 },
    environment: { density: 0.85, atmosphere: 'natural', timeOfDay: 'dusk', weatherFX: [], architectureStyle: 'gothic_city' },
    learnedPatterns: ['painterly_rendering', 'soft_light_system', 'depth_layering', 'atmospheric_depth'],
    classifiedGenre: 'fantasy', classifiedMood: 'dreamlike', classifiedRenderLanguage: 'PAINTERLY',
  },
];

// ── Visual Principles catalog ─────────────────────────────────────────────────

export const VISUAL_PRINCIPLES = [
  'bold contour', 'minimal rendering', 'flat lighting', 'iconic posing',
  'dynamic action', 'clean inks', 'retro color theory', 'expressive energy',
  'realistic shadows', 'dramatic composition', 'urban grit', 'emotional anatomy',
  'extreme anatomy', 'dynamic camera angles', 'hyper detail', 'aggressive motion',
  'cinematic realism', 'digital painting', 'depth layering', 'film composition',
] as const;

// ── Prompt injection — build generation prompt from recalled style vector ─────

export function buildStyleVectorPrompt(sv: StyleVector): string {
  const parts: string[] = [];

  parts.push(
    `Learned art style: ${sv.classifiedRenderLanguage ?? 'custom'} rendering — ` +
    `${sv.classifiedGenre ?? ''} genre, ${sv.classifiedMood ?? ''} mood.`,
  );

  const ls = sv.lineStyle;
  parts.push(
    `Line system: ${ls.weight}-weight lines, ` +
    `${Math.round(ls.variation * 100)}% line variation, ` +
    `${Math.round(ls.edgeSharpness * 100)}% edge sharpness, ` +
    `${ls.inkingStyle.replace(/_/g, ' ')} inking.`,
  );

  const an = sv.anatomy;
  parts.push(
    `Anatomy: ${an.stylization} stylization, ` +
    `${an.headRatio.replace(/_/g, ' ')} body proportions, ` +
    `${Math.round(an.heroicScale * 100)}% heroic scale, ` +
    `${Math.round(an.muscleDefinition * 100)}% muscle definition.`,
  );

  const li = sv.lighting;
  parts.push(
    `Lighting: ${li.lightingStyle} style, ${li.shadowType} shadows, ` +
    `${Math.round(li.contrast * 100)}% contrast` +
    `${li.rimLight ? ', rim lighting' : ''}.`,
  );

  const co = sv.color;
  parts.push(
    `Color: ${co.style.replace(/_/g, ' ')} palette, ` +
    `${co.temperature} temperature, ` +
    `${Math.round(co.saturation * 100)}% saturation` +
    `${co.palette.length ? `, dominant colors ${co.palette.join(' ')}` : ''}.`,
  );

  const cm = sv.composition;
  parts.push(
    `Composition: ${cm.cameraAngle.replace(/_/g, ' ')} camera angle, ` +
    `${cm.motionFlow} motion flow, ` +
    `${Math.round(cm.panelEnergy * 100)}% panel energy.`,
  );

  if (sv.keywords.length) {
    parts.push(`Style fingerprint: ${sv.keywords.join(', ')}.`);
  }

  return parts.join(' ');
}
