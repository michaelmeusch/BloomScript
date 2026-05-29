// ============================================================================
// COMIC ART STUDIO AI — CINEMATIC ANATOMY + SPECIES ENGINE
// TypeScript port of Java CinematicDescriptionInterpreter, CameraDistortionEngine,
//   CinematicBodyLanguageAI, AnatomySummaryRenderer, BodyProportions, MuscleFlowProfile
// ============================================================================

import type {
  BodyEmotion,
  BodyProportions,
  CharacterDNA,
  FemaleAnatomyType,
  MaleAnatomyType,
  MuscleFlowProfile,
} from './character-memory';

// ── Male Anatomy Profiles (Java: generateMaleHeroicAnatomy + all 10 archetypes) ─

export const MALE_ANATOMY_PROFILES: Record<MaleAnatomyType, {
  label: string; emoji: string; desc: string; proportions: BodyProportions;
}> = {
  HEROIC_V_TAPER: {
    label: 'Heroic V-Taper', emoji: '🦸', desc: 'Wide shoulder taper — classic superhero build',
    proportions: { shoulderWidth:1.4, chestSize:1.5, waistSize:0.8, armLength:1.1, legLength:1.2, handSize:1.15, neckThickness:1.2, headScale:0.95 },
  },
  BRUISER: {
    label: 'Bruiser', emoji: '🥊', desc: 'Thick neck, wide waist, immovable slab of muscle',
    proportions: { shoulderWidth:1.5, chestSize:1.8, waistSize:1.1, armLength:1.3, legLength:1.0, handSize:1.3, neckThickness:1.4, headScale:1.0 },
  },
  ATHLETIC_ACROBAT: {
    label: 'Athletic Acrobat', emoji: '🤸', desc: 'Lean, springy, long limbs — built for motion',
    proportions: { shoulderWidth:1.1, chestSize:1.2, waistSize:0.7, armLength:1.1, legLength:1.3, handSize:0.95, neckThickness:0.9, headScale:1.0 },
  },
  LEAN_ASSASSIN: {
    label: 'Lean Assassin', emoji: '🗡️', desc: 'Minimal profile — sleek, silent, dangerous',
    proportions: { shoulderWidth:0.95, chestSize:1.0, waistSize:0.65, armLength:1.0, legLength:1.2, handSize:0.85, neckThickness:0.8, headScale:0.95 },
  },
  TITAN: {
    label: 'Titan', emoji: '🗿', desc: 'Oversized in every dimension — barely fits the panel',
    proportions: { shoulderWidth:1.7, chestSize:2.0, waistSize:1.3, armLength:1.6, legLength:1.1, handSize:1.6, neckThickness:1.7, headScale:0.85 },
  },
  MONSTER: {
    label: 'Monster', emoji: '👹', desc: 'Grotesque asymmetric mass — anatomy breaks the rules',
    proportions: { shoulderWidth:1.6, chestSize:1.9, waistSize:1.4, armLength:1.5, legLength:1.2, handSize:1.4, neckThickness:1.5, headScale:1.1 },
  },
  SPEEDSTER: {
    label: 'Speedster', emoji: '💨', desc: 'Aerodynamic — small torso, oversized legs, slight frame',
    proportions: { shoulderWidth:0.9, chestSize:0.95, waistSize:0.6, armLength:0.95, legLength:1.4, handSize:0.8, neckThickness:0.8, headScale:0.9 },
  },
  SOLDIER: {
    label: 'Soldier', emoji: '🪖', desc: 'Balanced military build — functional and powerful',
    proportions: { shoulderWidth:1.2, chestSize:1.3, waistSize:0.9, armLength:1.15, legLength:1.15, handSize:1.1, neckThickness:1.1, headScale:1.0 },
  },
  COSMIC_ENTITY: {
    label: 'Cosmic Entity', emoji: '🌌', desc: 'Elongated, otherworldly — human rules do not apply',
    proportions: { shoulderWidth:1.0, chestSize:1.0, waistSize:0.6, armLength:1.3, legLength:1.5, handSize:1.0, neckThickness:0.7, headScale:1.1 },
  },
  MARTIAL_ARTIST: {
    label: 'Martial Artist', emoji: '🥋', desc: 'Balanced, flexible form — speed and precision',
    proportions: { shoulderWidth:1.15, chestSize:1.25, waistSize:0.7, armLength:1.1, legLength:1.3, handSize:1.0, neckThickness:1.0, headScale:1.0 },
  },
};

// ── Female Anatomy Profiles (Java: generateFemaleHeroicAnatomy + all 10 archetypes) ─

export const FEMALE_ANATOMY_PROFILES: Record<FemaleAnatomyType, {
  label: string; emoji: string; desc: string; proportions: BodyProportions;
}> = {
  ATHLETIC_HEROINE: {
    label: 'Athletic Heroine', emoji: '🦸‍♀️', desc: 'Classic heroic female — strong, defined, dynamic',
    proportions: { shoulderWidth:1.1, chestSize:1.1, waistSize:0.7, armLength:1.0, legLength:1.25, handSize:0.95, neckThickness:0.85, headScale:1.0 },
  },
  AMAZONIAN: {
    label: 'Amazonian', emoji: '⚔️', desc: 'Tall warrior queen — powerful frame, regal presence',
    proportions: { shoulderWidth:1.3, chestSize:1.3, waistSize:0.8, armLength:1.2, legLength:1.3, handSize:1.1, neckThickness:1.0, headScale:0.95 },
  },
  ACROBATIC: {
    label: 'Acrobatic', emoji: '🤸‍♀️', desc: 'Lithe acrobat — flexible, minimal, fast silhouette',
    proportions: { shoulderWidth:0.95, chestSize:1.0, waistSize:0.65, armLength:1.0, legLength:1.3, handSize:0.85, neckThickness:0.8, headScale:0.95 },
  },
  STEALTH_ASSASSIN: {
    label: 'Stealth Assassin', emoji: '🌑', desc: 'Ghost — near-invisible profile, moves in silence',
    proportions: { shoulderWidth:0.85, chestSize:0.9, waistSize:0.6, armLength:0.95, legLength:1.2, handSize:0.8, neckThickness:0.75, headScale:0.9 },
  },
  POWERHOUSE: {
    label: 'Powerhouse', emoji: '💪', desc: 'Brute force — muscular, dominant, unstoppable',
    proportions: { shoulderWidth:1.4, chestSize:1.4, waistSize:0.9, armLength:1.3, legLength:1.1, handSize:1.2, neckThickness:1.2, headScale:0.9 },
  },
  COSMIC_BEING: {
    label: 'Cosmic Being', emoji: '✨', desc: 'Otherworldly proportions — light, elongated, divine',
    proportions: { shoulderWidth:0.9, chestSize:0.95, waistSize:0.55, armLength:1.2, legLength:1.4, handSize:0.9, neckThickness:0.7, headScale:1.1 },
  },
  MYSTIC: {
    label: 'Mystic', emoji: '🔮', desc: 'Flowing robes hide a lean form — grace over power',
    proportions: { shoulderWidth:0.9, chestSize:0.95, waistSize:0.6, armLength:1.1, legLength:1.3, handSize:0.85, neckThickness:0.75, headScale:1.05 },
  },
  SOLDIER_F: {
    label: 'Soldier', emoji: '🪖', desc: 'Functional military build — armor-ready, mission-ready',
    proportions: { shoulderWidth:1.1, chestSize:1.1, waistSize:0.75, armLength:1.05, legLength:1.15, handSize:0.95, neckThickness:0.9, headScale:0.95 },
  },
  CYBERNETIC: {
    label: 'Cybernetic', emoji: '🤖', desc: 'Part machine — hybrid proportions, hard lines',
    proportions: { shoulderWidth:1.15, chestSize:1.1, waistSize:0.7, armLength:1.15, legLength:1.2, handSize:1.0, neckThickness:0.9, headScale:0.95 },
  },
  MONSTROUS: {
    label: 'Monstrous', emoji: '👹', desc: 'Beyond human — corrupted form, asymmetric anatomy',
    proportions: { shoulderWidth:1.3, chestSize:1.4, waistSize:1.0, armLength:1.2, legLength:1.1, handSize:1.1, neckThickness:1.2, headScale:1.0 },
  },
};

// ── Muscle Flow Profiles (Java: MuscleFlowProfile pre-built instances) ────────

export const ACTION_MUSCLE_FLOWS: Record<string, MuscleFlowProfile & { label: string; emoji: string }> = {
  AERIAL: {
    label: 'Aerial / Gliding', emoji: '🦅',
    torsoFlow: 'Extended Dynamic Torso', spineCurve: 'Curved Action Spine',
    tensionDirection: 'Downward Diagonal Energy', weightDistribution: 'Airborne Weight Shift',
    compressionZones: 'Compressed Lower Torso', stretchZones: 'Extended Arms and Legs',
  },
  PUNCH: {
    label: 'Punch / Impact', emoji: '👊',
    torsoFlow: 'Twisting Combat Torso', spineCurve: 'Aggressive Forward Spine',
    tensionDirection: 'Forward Impact Energy', weightDistribution: 'Front-Leg Weight Drive',
    compressionZones: 'Shoulder Compression', stretchZones: 'Extended Punch Arm',
  },
  DEFENSE: {
    label: 'Defense / Block', emoji: '🛡️',
    torsoFlow: 'Contracted Core', spineCurve: 'Reactive Curved Spine',
    tensionDirection: 'Upward Block Energy', weightDistribution: 'Backward Weight Shift',
    compressionZones: 'Forearm Compression', stretchZones: 'Squared Blocking Stance',
  },
  CROUCH: {
    label: 'Crouch / Coil', emoji: '🐱',
    torsoFlow: 'Coiled Core Spring', spineCurve: 'Compressed S-Curve Spine',
    tensionDirection: 'Downward Stored Energy', weightDistribution: 'Leg Loading Weight',
    compressionZones: 'Hip Compression', stretchZones: 'Coiled Arm Reach',
  },
  STANDING: {
    label: 'Power Stance', emoji: '🗿',
    torsoFlow: 'Relaxed Upright Torso', spineCurve: 'Neutral S-Curve Spine',
    tensionDirection: 'Balanced Energy', weightDistribution: 'Equal Weight Distribution',
    compressionZones: 'None', stretchZones: 'None',
  },
  CHARGE: {
    label: 'Charge / Rush', emoji: '⚡',
    torsoFlow: 'Extended Aggressive Torso', spineCurve: 'Forward Driving Spine',
    tensionDirection: 'Forward Diagonal Energy', weightDistribution: 'Front-Leg Drive Force',
    compressionZones: 'Back Compression', stretchZones: 'Extended Leading Shoulder',
  },
  LANDING: {
    label: 'Landing / Impact', emoji: '💥',
    torsoFlow: 'Impact Absorb Torso', spineCurve: 'Shock Absorb Spine',
    tensionDirection: 'Downward Impact Energy', weightDistribution: 'Bent Knee Weight Catch',
    compressionZones: 'Leg Compression', stretchZones: 'Arms Out Balance',
  },
  CAST: {
    label: 'Magic / Energy Cast', emoji: '🔮',
    torsoFlow: 'Open Channel Torso', spineCurve: 'Extended Back Arch Spine',
    tensionDirection: 'Outward Energy Radiate', weightDistribution: 'Planted Anchored Weight',
    compressionZones: 'Core Energy Center', stretchZones: 'Extended Energy Arms',
  },
};

// ── Camera Distortion Notes (Java: CameraDistortionEngine.applyCameraDistortion) ─

export const CAMERA_DISTORTION_NOTES: Record<string, string> = {
  WORM_EYE_VIEW:       'Enlarged foreground anatomy. Extended legs. Massive heroic torso. Dynamic foreshortening toward camera.',
  CINEMATIC_LOW_ANGLE: 'Heroic scale enhancement. Expanded chest silhouette. Sky-framed head.',
  BIRD_EYE_VIEW:       'Compressed torso. Extended shoulders horizontally. Head dominates top of frame.',
  DUTCH_ANGLE:         'Diagonal tension anatomy. Shoulder tilt creates instability. Spine lean toward tension.',
  CLOSE_UP:            'Facial perspective distortion. Nose forward. Eyes wide. Near-side jaw enlarged.',
  WIDE_SHOT:           'Full body silhouette priority. Environment dwarfs figure. Pure outline anatomy.',
  ACTION_TRACKING:     'Motion blur extremities. Speed lines along action axis. Leading limb extended.',
  OVER_SHOULDER:       'Near shoulder blocks frame. Far figure in depth. Depth distortion scale.',
  HERO_SHOT:           'Three-quarter low angle. Cape or power effect behind. Environmental drama framing.',
};

// ── Body Emotion Rules (Java: CinematicBodyLanguageAI.applyBodyEmotion) ────────

export const BODY_EMOTION_PROFILES: Record<BodyEmotion, {
  emoji: string; rule: string; poseCue: string;
}> = {
  CONFIDENT:    { emoji: '😎', rule: 'Open chest pose. Weight on back leg. Arms relaxed.', poseCue: 'Wide stance, relaxed shoulders, slight chin lift.' },
  FEARFUL:      { emoji: '😨', rule: 'Contracted shoulders. Defensive spine curve. Arms crossing chest.', poseCue: 'Hunched, weight pulled back, wide eyes.' },
  AGGRESSIVE:   { emoji: '😡', rule: 'Forward lean. Heavy weight shift to front leg. Fists forward.', poseCue: 'Low center of gravity, chin tucked, shoulders forward.' },
  SAD:          { emoji: '😔', rule: 'Collapsed chest. Downward gaze. Sunken shoulders.', poseCue: 'Curved spine, arms limp, head bowed.' },
  DIVINE:       { emoji: '🌟', rule: 'Elevated arms spread. Upward chin tilt. Glowing energy radiating.', poseCue: 'Floating stance, arms wide, open chest, upward gaze.' },
  CHAOTIC:      { emoji: '😈', rule: 'Asymmetric erratic pose. Off-balance weight. Mixed tension directions.', poseCue: 'No clean lines — broken silhouette, frenzied limbs.' },
  STEALTH:      { emoji: '🌑', rule: 'Compressed low profile. Arms close to body. Minimal silhouette.', poseCue: 'Crouched, tight, neutral weight, no sharp extensions.' },
  HEROIC:       { emoji: '🦸', rule: 'Open chest pose. Elevated chin. Dominant silhouette. Diagonal weight shift.', poseCue: 'Wide V-taper, chin up, cape or power effect behind.' },
  INTIMIDATING: { emoji: '👁️', rule: 'Massive forward lean. Shoulders hunched forward. Arms spread wide.', poseCue: 'Low heavy stance, looming over viewer, shadow framing.' },
};

// ── Pose Styles ───────────────────────────────────────────────────────────────

export const POSE_STYLES: Array<{ id: string; label: string; emoji: string }> = [
  { id: 'Dynamic Aerial Pose',       label: 'Aerial',         emoji: '🦅' },
  { id: 'Impact Attack Pose',        label: 'Impact',         emoji: '👊' },
  { id: 'Power Stance',              label: 'Power Stance',   emoji: '🗿' },
  { id: 'Charge Pose',               label: 'Charge',         emoji: '⚡' },
  { id: 'Defensive Block Pose',      label: 'Defense',        emoji: '🛡️' },
  { id: 'Stealth Crouch Pose',       label: 'Stealth',        emoji: '🌑' },
  { id: 'Landing Impact Pose',       label: 'Landing',        emoji: '💥' },
  { id: 'Energy Cast Pose',          label: 'Energy Cast',    emoji: '🔮' },
  { id: 'Running Sprint Pose',       label: 'Sprint',         emoji: '💨' },
  { id: 'Triumphant Reveal Pose',    label: 'Triumphant',     emoji: '🏆' },
];

// ── Prompt fragment builder (Java: AnatomySummaryRenderer + CameraDistortionEngine + BodyLanguageAI) ─

export function buildAnatomyFragment(dna: CharacterDNA, cameraId?: string): string {
  const parts: (string | null)[] = [];

  if (dna.gender) parts.push(`Gender: ${dna.gender}.`);

  // Anatomy archetype
  if (dna.maleAnatomyType) {
    const profile = MALE_ANATOMY_PROFILES[dna.maleAnatomyType];
    const p = profile.proportions;
    parts.push(
      `Male anatomy: ${profile.label}. ${profile.desc}.`,
      `Proportions: shoulders ×${p.shoulderWidth}, chest ×${p.chestSize}, waist ×${p.waistSize}, arms ×${p.armLength}, legs ×${p.legLength}.`,
    );
  }
  if (dna.femaleAnatomyType) {
    const profile = FEMALE_ANATOMY_PROFILES[dna.femaleAnatomyType];
    const p = profile.proportions;
    parts.push(
      `Female anatomy: ${profile.label}. ${profile.desc}.`,
      `Proportions: shoulders ×${p.shoulderWidth}, chest ×${p.chestSize}, waist ×${p.waistSize}, arms ×${p.armLength}, legs ×${p.legLength}.`,
    );
  }

  // Muscle flow
  if (dna.muscleFlow) {
    const mf = dna.muscleFlow;
    parts.push(
      `Muscle flow: ${mf.torsoFlow}. ${mf.spineCurve}. ${mf.tensionDirection}.`,
      `Weight: ${mf.weightDistribution}. Compression: ${mf.compressionZones}. Stretch: ${mf.stretchZones}.`,
    );
  }

  // Body emotion
  if (dna.bodyEmotion) {
    const ep = BODY_EMOTION_PROFILES[dna.bodyEmotion];
    parts.push(`Body emotion: ${dna.bodyEmotion}. ${ep.rule}`);
  }

  // Pose style + silhouette
  if (dna.poseStyle)      parts.push(`Pose: ${dna.poseStyle}.`);
  if (dna.silhouetteType) parts.push(`Silhouette: ${dna.silhouetteType}.`);
  if (dna.movementEnergy) parts.push(`Movement energy: ${dna.movementEnergy}.`);

  // Camera distortion (Java: CameraDistortionEngine.applyCameraDistortion)
  const distortion = cameraId ? CAMERA_DISTORTION_NOTES[cameraId] : null;
  if (distortion)          parts.push(`Camera distortion: ${distortion}`);

  return parts.filter(Boolean).join(' ');
}

// ── CinematicDescriptionInterpreter (Java port) ───────────────────────────────

export function interpretAnatomyFromDescription(description: string): Partial<CharacterDNA> {
  const partial: Partial<CharacterDNA> = {};
  const d = description.toLowerCase();

  // Gender detection — Java: CinematicDescriptionInterpreter
  if (d.includes('woman') || d.includes('female') || d.includes('girl') || d.includes('she ')) {
    partial.gender = 'Female';
    partial.femaleAnatomyType = 'ATHLETIC_HEROINE';
  } else {
    partial.gender = 'Male';
    partial.maleAnatomyType = 'HEROIC_V_TAPER';
  }

  // Anatomy overrides
  if (d.includes('titan') || d.includes('giant') || d.includes('massive'))  {
    partial.maleAnatomyType = 'TITAN';
    partial.femaleAnatomyType = 'POWERHOUSE';
  }
  if (d.includes('assassin') || d.includes('stealth') || d.includes('shadow')) {
    partial.maleAnatomyType = 'LEAN_ASSASSIN';
    partial.femaleAnatomyType = 'STEALTH_ASSASSIN';
  }
  if (d.includes('acrobat') || d.includes('flip') || d.includes('nimble')) {
    partial.maleAnatomyType = 'ATHLETIC_ACROBAT';
    partial.femaleAnatomyType = 'ACROBATIC';
  }
  if (d.includes('cosmic') || d.includes('celestial') || d.includes('divine being')) {
    partial.maleAnatomyType = 'COSMIC_ENTITY';
    partial.femaleAnatomyType = 'COSMIC_BEING';
  }
  if (d.includes('speedster') || d.includes('fast') || d.includes('blur')) {
    partial.maleAnatomyType = 'SPEEDSTER';
  }
  if (d.includes('martial') || d.includes('karate') || d.includes('kung fu')) {
    partial.maleAnatomyType = 'MARTIAL_ARTIST';
  }
  if (d.includes('monster') || d.includes('mutant') || d.includes('corrupted')) {
    partial.maleAnatomyType = 'MONSTER';
    partial.femaleAnatomyType = 'MONSTROUS';
  }
  if (d.includes('amazonian') || d.includes('warrior queen') || d.includes('warrior woman')) {
    partial.femaleAnatomyType = 'AMAZONIAN';
  }
  if (d.includes('mystic') || d.includes('sorceress') || d.includes('witch')) {
    partial.femaleAnatomyType = 'MYSTIC';
  }
  if (d.includes('cyborg') || d.includes('android') || d.includes('mechanical')) {
    partial.femaleAnatomyType = 'CYBERNETIC';
  }

  // Muscle flow
  if (d.includes('jump') || d.includes('glide') || d.includes('leap') || d.includes('aerial')) {
    partial.poseStyle = 'Dynamic Aerial Pose';
    partial.muscleFlow = ACTION_MUSCLE_FLOWS.AERIAL;
  } else if (d.includes('punch') || d.includes('strike') || d.includes('attack')) {
    partial.poseStyle = 'Impact Attack Pose';
    partial.muscleFlow = ACTION_MUSCLE_FLOWS.PUNCH;
  } else if (d.includes('charge') || d.includes('rush') || d.includes('dash')) {
    partial.poseStyle = 'Charge Pose';
    partial.muscleFlow = ACTION_MUSCLE_FLOWS.CHARGE;
  } else if (d.includes('land') || d.includes('crash')) {
    partial.poseStyle = 'Landing Impact Pose';
    partial.muscleFlow = ACTION_MUSCLE_FLOWS.LANDING;
  } else if (d.includes('cast') || d.includes('spell') || d.includes('energy')) {
    partial.poseStyle = 'Energy Cast Pose';
    partial.muscleFlow = ACTION_MUSCLE_FLOWS.CAST;
  } else if (d.includes('crouch') || d.includes('coil') || d.includes('hide')) {
    partial.poseStyle = 'Stealth Crouch Pose';
    partial.muscleFlow = ACTION_MUSCLE_FLOWS.CROUCH;
  } else if (d.includes('run') || d.includes('sprint')) {
    partial.poseStyle = 'Running Sprint Pose';
    partial.muscleFlow = ACTION_MUSCLE_FLOWS.CHARGE;
  }

  // Body emotion
  if (d.includes('heroic') || d.includes('triumphant')) partial.bodyEmotion = 'HEROIC';
  else if (d.includes('fear') || d.includes('scared'))   partial.bodyEmotion = 'FEARFUL';
  else if (d.includes('rage') || d.includes('aggress'))  partial.bodyEmotion = 'AGGRESSIVE';
  else if (d.includes('sad') || d.includes('grief'))     partial.bodyEmotion = 'SAD';
  else if (d.includes('divine') || d.includes('holy'))   partial.bodyEmotion = 'DIVINE';
  else if (d.includes('chaos') || d.includes('frenzied')) partial.bodyEmotion = 'CHAOTIC';
  else if (d.includes('stealth') || d.includes('shadow')) partial.bodyEmotion = 'STEALTH';
  else if (d.includes('intimidat'))                       partial.bodyEmotion = 'INTIMIDATING';
  else                                                    partial.bodyEmotion = 'HEROIC';

  partial.silhouetteType = 'Dynamic Cinematic Readable Silhouette';

  // Movement energy from species
  if (d.includes('avian') || d.includes('glid'))         partial.movementEnergy = 'Flowing Curved Motion';
  else if (d.includes('reptilian') || d.includes('predator')) partial.movementEnergy = 'Heavy Predator Movement';
  else if (d.includes('speedster') || d.includes('fast')) partial.movementEnergy = 'Rapid Velocity Motion';
  else if (d.includes('cosmic') || d.includes('float'))   partial.movementEnergy = 'Weightless Ethereal Motion';

  return partial;
}

// ── Body Archetype DNA System ─────────────────────────────────────────────────
// Ported from BODY_ARCHETYPE_DNA_SYSTEM spec
export interface BodyArchetypeAnatomyData {
  bodyMass: number;
  shoulderWidth: number;
  chestSize: number;
  armThickness: number;
  legThickness: number;
  neckThickness: number;
  posture: string;
  silhouette: string;
}

export interface BodyArchetypeDNA {
  id: string;
  displayName: string;
  uiDescription: string;
  tags: string[];
  anatomy: BodyArchetypeAnatomyData;
  visualLanguage: { readsAs: string };
}

export const BODY_ARCHETYPE_DNA: BodyArchetypeDNA[] = [
  {
    id: 'NERD_SLIM',
    displayName: 'Nerd Slim',
    uiDescription: 'Thin frame, narrow shoulders, lighter muscle tone, intelligent posture.',
    tags: ['smart', 'scientist', 'inventor', 'awkward', 'young'],
    anatomy: { bodyMass: 0.2, shoulderWidth: 0.25, chestSize: 0.2, armThickness: 0.15, legThickness: 0.2, neckThickness: 0.15, posture: 'forward_lean', silhouette: 'slim_vertical' },
    visualLanguage: { readsAs: 'intelligent_underestimated_character' },
  },
  {
    id: 'LEAN_HERO',
    displayName: 'Lean Hero',
    uiDescription: 'Athletic superhero frame with balanced muscle and agility.',
    tags: ['heroic', 'agile', 'balanced', 'fighter'],
    anatomy: { bodyMass: 0.45, shoulderWidth: 0.55, chestSize: 0.5, armThickness: 0.45, legThickness: 0.5, neckThickness: 0.35, posture: 'heroic_upright', silhouette: 'athletic_v' },
    visualLanguage: { readsAs: 'classic_dynamic_protagonist' },
  },
  {
    id: 'MEGA_HERO',
    displayName: 'Mega Hero',
    uiDescription: 'Massive heroic anatomy with exaggerated proportions and immense power.',
    tags: ['powerful', 'alpha', 'leader', 'tank'],
    anatomy: { bodyMass: 0.9, shoulderWidth: 1.0, chestSize: 1.0, armThickness: 0.95, legThickness: 0.9, neckThickness: 0.8, posture: 'dominant_expanded', silhouette: 'mega_v_taper' },
    visualLanguage: { readsAs: 'unstoppable_powerhouse' },
  },
  {
    id: 'BEAST_FORM',
    displayName: 'Beast Form',
    uiDescription: 'Monstrous anatomy with oversized limbs and primal proportions.',
    tags: ['monster', 'rage', 'creature', 'mutated'],
    anatomy: { bodyMass: 1.0, shoulderWidth: 1.0, chestSize: 0.95, armThickness: 1.0, legThickness: 0.85, neckThickness: 0.9, posture: 'forward_beast', silhouette: 'monster_mass' },
    visualLanguage: { readsAs: 'feral_brutal_force' },
  },
  {
    id: 'SPEED_RUNNER',
    displayName: 'Speed Runner',
    uiDescription: 'Lightweight anatomy built for speed, reflexes, and acrobatic movement.',
    tags: ['speed', 'agile', 'runner', 'acrobat'],
    anatomy: { bodyMass: 0.35, shoulderWidth: 0.4, chestSize: 0.35, armThickness: 0.3, legThickness: 0.55, neckThickness: 0.2, posture: 'forward_motion', silhouette: 'streamlined' },
    visualLanguage: { readsAs: 'velocity_and_motion' },
  },
  {
    id: 'SHADOW_ASSASSIN',
    displayName: 'Shadow Assassin',
    uiDescription: 'Sleek stealth body type with razor sharp movement and flexibility.',
    tags: ['stealth', 'ninja', 'silent', 'hunter'],
    anatomy: { bodyMass: 0.4, shoulderWidth: 0.45, chestSize: 0.35, armThickness: 0.3, legThickness: 0.45, neckThickness: 0.25, posture: 'low_predator', silhouette: 'sleek_shadow' },
    visualLanguage: { readsAs: 'silent_deadly_precision' },
  },
  {
    id: 'COSMIC_TITAN',
    displayName: 'Cosmic Titan',
    uiDescription: 'God-like anatomy with celestial scale and mythic presence.',
    tags: ['god', 'cosmic', 'mythic', 'universal'],
    anatomy: { bodyMass: 0.95, shoulderWidth: 1.0, chestSize: 1.0, armThickness: 0.9, legThickness: 0.9, neckThickness: 0.75, posture: 'divine_expansion', silhouette: 'mythic_giant' },
    visualLanguage: { readsAs: 'celestial_overwhelming_presence' },
  },
];

// ── Render Style DNA System ───────────────────────────────────────────────────
// CAN CHANGE ANYTIME — does not affect character identity
export interface RenderStyleDNA {
  id: string;
  displayName: string;
  uiDescription: string;
  category: 'Comic' | 'Anime' | 'Painterly' | 'Retro' | 'Fantasy' | 'Realism' | 'Sketch';
}

export const RENDER_STYLE_DNA: RenderStyleDNA[] = [
  { id: 'WESTERN_HEROIC',   displayName: 'Western Heroic',   uiDescription: 'Bold anatomy, dynamic poses, dramatic comic shading.',                          category: 'Comic'     },
  { id: 'DARK_NOIR',        displayName: 'Dark Noir',        uiDescription: 'Heavy shadows, cinematic darkness, gothic atmosphere.',                         category: 'Comic'     },
  { id: 'ANIME_CINEMATIC',  displayName: 'Anime Cinematic',  uiDescription: 'Expressive anime proportions with cinematic lighting.',                         category: 'Anime'     },
  { id: 'SHONEN_ACTION',    displayName: 'Shonen Action',    uiDescription: 'High energy action style with speed effects and exaggerated emotion.',           category: 'Anime'     },
  { id: 'SEINEN_REALISM',   displayName: 'Seinen Realism',   uiDescription: 'Mature anime realism with grounded anatomy and gritty detail.',                  category: 'Anime'     },
  { id: 'PAINTERLY_EPIC',   displayName: 'Painterly Epic',   uiDescription: 'Digital painting style with cinematic brushwork.',                              category: 'Painterly' },
  { id: 'RETRO_PULP',       displayName: 'Retro Pulp',       uiDescription: 'Vintage comic texture with retro print aesthetics.',                            category: 'Retro'     },
  { id: 'EURO_FANTASY',     displayName: 'Euro Fantasy',     uiDescription: 'Detailed fantasy illustration with elegant line work.',                         category: 'Fantasy'   },
  { id: 'HYPER_REAL',       displayName: 'Hyper Real',       uiDescription: 'Photoreal cinematic rendering with realistic textures.',                        category: 'Realism'   },
  { id: 'INK_SKETCH',       displayName: 'Ink Sketch',       uiDescription: 'Loose expressive ink illustration style.',                                      category: 'Sketch'    },
];

export const RENDER_STYLE_CATEGORY_COLORS: Record<RenderStyleDNA['category'], string> = {
  Comic:     '#E8001C',
  Anime:     '#A78BFA',
  Painterly: '#22C55E',
  Retro:     '#C4913A',
  Fantasy:   '#38BDF8',
  Realism:   '#94A3B8',
  Sketch:    '#6B6560',
};

export function detectBodyArchetype(prompt: string): string {
  const d = prompt.toLowerCase();
  if (d.includes('nerd') || d.includes('skinny') || d.includes('weak') || d.includes('scientist'))   return 'NERD_SLIM';
  if (d.includes('mega') || d.includes('huge') || d.includes('massive') || d.includes('tank'))       return 'MEGA_HERO';
  if (d.includes('beast') || d.includes('monster') || d.includes('creature') || d.includes('feral')) return 'BEAST_FORM';
  if (d.includes('speed') || d.includes('runner') || d.includes('acrobat') || d.includes('dash'))    return 'SPEED_RUNNER';
  if (d.includes('shadow') || d.includes('ninja') || d.includes('stealth') || d.includes('assassin')) return 'SHADOW_ASSASSIN';
  if (d.includes('cosmic') || d.includes('god') || d.includes('titan') || d.includes('divine'))      return 'COSMIC_TITAN';
  return 'LEAN_HERO';
}

// ── Master Anatomy DNA Engine ─────────────────────────────────────────────────
// Built from 40+ years of comic visual patterns — Western Comics, Anime, Manga
export const ANATOMY_MASTER_RULES = {
  principles: [
    'silhouette_readability', 'shape_language', 'visual_weight_balance',
    'heroic_proportion_logic', 'dynamic_line_of_action', 'genre_specific_exaggeration',
    'facial_storytelling', 'muscle_group_clarity', 'costume_body_integration', 'motion_based_anatomy',
  ],
};

export const BODY_PROPORTION_SYSTEM: Record<string, number> = {
  realisticHuman: 7.5,
  heroicComic:    8.5,
  megaHeroic:     9,
  animeStylized:  7,
  fantasyTitan:   10,
  childHero:      5,
  speedRunner:    8,
  noirDetective:  7.75,
  monsterMass:    11,
};

export interface MasterAnatomyArchetype {
  id: string;
  displayName: string;
  uiDescription: string;
  genreAffinity: string[];
  proportions: {
    heightRatio: number;
    shoulderWidth: number;
    waistCompression: number;
    legLength: number;
    armLength: number;
    handScale: number;
    footScale: number;
  };
  muscleGroups: { chest: number; shoulders: number; arms: number; abs: number; legs: number; neck: number };
  silhouette: { primary: string; readability: string };
  psychology: string;
}

export const MASTER_ANATOMY_ARCHETYPES: MasterAnatomyArchetype[] = [
  {
    id: 'CLASSIC_HEROIC',
    displayName: 'Classic Heroic',
    uiDescription: 'Balanced heroic anatomy with broad shoulders, athletic muscle structure, and clean silhouette readability.',
    genreAffinity: ['superhero', 'action', 'adventure'],
    proportions: { heightRatio: 8.5, shoulderWidth: 0.85, waistCompression: 0.55, legLength: 0.65, armLength: 0.55, handScale: 1.0, footScale: 1.0 },
    muscleGroups: { chest: 0.75, shoulders: 0.8, arms: 0.7, abs: 0.7, legs: 0.75, neck: 0.55 },
    silhouette: { primary: 'heroic_v_taper', readability: 'high' },
    psychology: 'noble_confident_protector',
  },
  {
    id: 'MEGA_POWERHOUSE',
    displayName: 'Mega Powerhouse',
    uiDescription: 'Massive exaggerated anatomy designed for overwhelming power and visual dominance.',
    genreAffinity: ['cosmic', 'heavy_action', 'epic_battles'],
    proportions: { heightRatio: 9, shoulderWidth: 1.0, waistCompression: 0.45, legLength: 0.6, armLength: 0.65, handScale: 1.25, footScale: 1.2 },
    muscleGroups: { chest: 1.0, shoulders: 1.0, arms: 1.0, abs: 0.95, legs: 0.95, neck: 0.9 },
    silhouette: { primary: 'massive_tank', readability: 'extreme' },
    psychology: 'unstoppable_force',
  },
  {
    id: 'AGILE_ACROBAT',
    displayName: 'Agile Acrobat',
    uiDescription: 'Lightweight athletic anatomy built for agility, flips, speed, and dynamic motion.',
    genreAffinity: ['urban_action', 'martial_arts', 'anime'],
    proportions: { heightRatio: 7.75, shoulderWidth: 0.55, waistCompression: 0.5, legLength: 0.72, armLength: 0.6, handScale: 0.9, footScale: 0.95 },
    muscleGroups: { chest: 0.45, shoulders: 0.5, arms: 0.45, abs: 0.65, legs: 0.7, neck: 0.25 },
    silhouette: { primary: 'streamlined_motion', readability: 'high' },
    psychology: 'quick_reactive_intelligent',
  },
  {
    id: 'DARK_NOIR',
    displayName: 'Dark Noir',
    uiDescription: 'Grounded anatomy with realistic proportions and shadow-heavy visual storytelling.',
    genreAffinity: ['detective', 'gothic', 'crime'],
    proportions: { heightRatio: 7.75, shoulderWidth: 0.65, waistCompression: 0.7, legLength: 0.62, armLength: 0.55, handScale: 1.0, footScale: 1.0 },
    muscleGroups: { chest: 0.55, shoulders: 0.55, arms: 0.5, abs: 0.45, legs: 0.55, neck: 0.35 },
    silhouette: { primary: 'shadow_coat_shape', readability: 'medium' },
    psychology: 'brooding_determined',
  },
  {
    id: 'ANIME_SHONEN',
    displayName: 'Anime Shonen',
    uiDescription: 'Expressive anime anatomy with dynamic proportions and emotional exaggeration.',
    genreAffinity: ['anime', 'martial_arts', 'energy_action'],
    proportions: { heightRatio: 7, shoulderWidth: 0.6, waistCompression: 0.55, legLength: 0.7, armLength: 0.58, handScale: 1.05, footScale: 1.05 },
    muscleGroups: { chest: 0.4, shoulders: 0.45, arms: 0.5, abs: 0.4, legs: 0.55, neck: 0.2 },
    silhouette: { primary: 'expressive_spiky_motion', readability: 'high' },
    psychology: 'determined_energetic_emotional',
  },
  {
    id: 'COSMIC_GOD',
    displayName: 'Cosmic God',
    uiDescription: 'Mythic celestial anatomy designed to feel divine, ancient, and larger than reality.',
    genreAffinity: ['cosmic', 'mythic', 'space_fantasy'],
    proportions: { heightRatio: 10, shoulderWidth: 1.0, waistCompression: 0.35, legLength: 0.7, armLength: 0.7, handScale: 1.3, footScale: 1.25 },
    muscleGroups: { chest: 0.9, shoulders: 1.0, arms: 0.9, abs: 0.8, legs: 0.85, neck: 0.75 },
    silhouette: { primary: 'mythic_giant', readability: 'legendary' },
    psychology: 'godlike_presence',
  },
  {
    id: 'MONSTER_BEAST',
    displayName: 'Monster Beast',
    uiDescription: 'Primal monstrous anatomy with asymmetry, oversized limbs, and brutal silhouette mass.',
    genreAffinity: ['horror', 'monster', 'mutation'],
    proportions: { heightRatio: 11, shoulderWidth: 1.0, waistCompression: 0.9, legLength: 0.5, armLength: 0.85, handScale: 1.5, footScale: 1.4 },
    muscleGroups: { chest: 1.0, shoulders: 1.0, arms: 1.0, abs: 0.6, legs: 0.85, neck: 1.0 },
    silhouette: { primary: 'feral_mass', readability: 'extreme' },
    psychology: 'rage_instinct_predator',
  },
];

export interface FaceDNA {
  id: string; jaw: string; eyes: string; cheekbones: string; psychology: string;
}
export const FACE_DNA_SYSTEM: FaceDNA[] = [
  { id: 'HEROIC_FACE',     jaw: 'strong_square',   eyes: 'focused_sharp',    cheekbones: 'defined',   psychology: 'confidence'    },
  { id: 'YOUTHFUL_ANIME',  jaw: 'soft_v',           eyes: 'large_expressive', cheekbones: 'minimal',   psychology: 'emotion_growth' },
  { id: 'DARK_VIGILANTE',  jaw: 'angular_hard',     eyes: 'shadowed_narrow',  cheekbones: 'sharp',     psychology: 'brooding'       },
  { id: 'COSMIC_ENTITY',   jaw: 'divine_smooth',    eyes: 'glowing_abstract', cheekbones: 'ethereal',  psychology: 'otherworldly'   },
];

export const FEMALE_ANATOMY_SYSTEM = {
  principles: ['strength_with_elegance', 'dynamic_silhouette', 'athletic_structure', 'genre_specific_shapes', 'combat_functionality', 'stylized_motion'],
  archetypes: ['warrior_athletic', 'acrobat_speedster', 'cosmic_queen', 'gothic_hunter', 'fantasy_mage', 'anime_fighter', 'tank_powerhouse', 'stealth_assassin'],
};

export function detectMasterAnatomy(prompt: string): string {
  const d = prompt.toLowerCase();
  if (d.includes('mega') || d.includes('massive') || d.includes('powerhouse'))         return 'MEGA_POWERHOUSE';
  if (d.includes('anime') || d.includes('shonen') || d.includes('manga'))              return 'ANIME_SHONEN';
  if (d.includes('dark') || d.includes('detective') || d.includes('noir'))             return 'DARK_NOIR';
  if (d.includes('cosmic') || d.includes('god') || d.includes('celestial'))            return 'COSMIC_GOD';
  if (d.includes('monster') || d.includes('beast') || d.includes('mutant'))            return 'MONSTER_BEAST';
  if (d.includes('acrobat') || d.includes('agile') || d.includes('parkour'))           return 'AGILE_ACROBAT';
  return 'CLASSIC_HEROIC';
}

export const ANATOMY_GENRE_COLORS: Record<string, string> = {
  superhero: '#FFD600', action: '#E8001C', adventure: '#F97316',
  cosmic: '#60A5FA', heavy_action: '#E8001C', epic_battles: '#DC2626',
  urban_action: '#22C55E', martial_arts: '#F97316', anime: '#A78BFA',
  detective: '#94A3B8', gothic: '#6B6560', crime: '#94A3B8',
  energy_action: '#A78BFA', space_fantasy: '#60A5FA', mythic: '#FFD600',
  horror: '#DC2626', monster: '#DC2626', mutation: '#22C55E',
};

// ── Costume Material DNA System ───────────────────────────────────────────────
// Core spec (7) + Western comics / Anime research additions (10) = 17 materials
export interface CostumeMaterialDNA {
  id: string;
  displayName: string;
  uiDescription: string;
  category: string;
  physicalProperties: { stretch: number; flexibility: number; wrinkleAmount: number; thickness: number };
  visualProperties: { reflectivity: number; glossiness: number; specularHighlights: boolean; shadowSharpness: number };
  comicBehavior: { idealFor: string[]; renderingStyle: string; silhouette: string };
}

export const COSTUME_MATERIAL_DNA: CostumeMaterialDNA[] = [
  // ── Core 7 from spec ──────────────────────────────────────────────────────
  {
    id: 'LYCRA_HEROIC', displayName: 'Heroic Lycra', category: 'Superhero Fabric',
    uiDescription: 'Flexible superhero fabric with smooth stretch surfaces and clean comic shading.',
    physicalProperties: { stretch: 0.95, flexibility: 0.95, wrinkleAmount: 0.2, thickness: 0.25 },
    visualProperties: { reflectivity: 0.45, glossiness: 0.65, specularHighlights: true, shadowSharpness: 0.55 },
    comicBehavior: { idealFor: ['hero_suits', 'speed_characters', 'acrobatics'], renderingStyle: 'clean_contour_shading', silhouette: 'body_form_fitting' },
  },
  {
    id: 'SPACE_AGE_FABRIC', displayName: 'Space Age Fabric', category: 'Retro Sci-Fi',
    uiDescription: 'Retro futuristic fabric inspired by classic sci-fi comics and cosmic adventure suits.',
    physicalProperties: { stretch: 0.55, flexibility: 0.65, wrinkleAmount: 0.15, thickness: 0.45 },
    visualProperties: { reflectivity: 0.7, glossiness: 0.8, specularHighlights: true, shadowSharpness: 0.65 },
    comicBehavior: { idealFor: ['cosmic_heroes', 'space_adventurers', 'retro_future'], renderingStyle: 'retro_scifi_shine', silhouette: 'clean_space_geometry' },
  },
  {
    id: 'NANOTECH_WEAVE', displayName: 'Nanotech Weave', category: 'Future Tech',
    uiDescription: 'Advanced adaptive fabric with intelligent texture shifting and energy-reactive surfaces.',
    physicalProperties: { stretch: 0.85, flexibility: 0.95, wrinkleAmount: 0.05, thickness: 0.3 },
    visualProperties: { reflectivity: 0.9, glossiness: 0.95, specularHighlights: true, shadowSharpness: 0.8 },
    comicBehavior: { idealFor: ['cyber_heroes', 'future_soldiers', 'advanced_ai'], renderingStyle: 'energy_reflective', silhouette: 'sleek_techwear' },
  },
  {
    id: 'COSMIC_METAL', displayName: 'Cosmic Metal', category: 'Cosmic Armor',
    uiDescription: 'Celestial metallic armor infused with glowing cosmic energy and dimensional reflections.',
    physicalProperties: { stretch: 0.05, flexibility: 0.15, wrinkleAmount: 0.0, thickness: 0.95 },
    visualProperties: { reflectivity: 1.0, glossiness: 1.0, specularHighlights: true, shadowSharpness: 1.0 },
    comicBehavior: { idealFor: ['cosmic_gods', 'space_kings', 'celestial_warriors'], renderingStyle: 'ultra_reflective_energy', silhouette: 'mythic_heavy_armor' },
  },
  {
    id: 'TACTICAL_KEVLAR', displayName: 'Tactical Kevlar', category: 'Combat',
    uiDescription: 'Modern tactical combat fabric with reinforced armored sections and grounded realism.',
    physicalProperties: { stretch: 0.35, flexibility: 0.55, wrinkleAmount: 0.45, thickness: 0.7 },
    visualProperties: { reflectivity: 0.2, glossiness: 0.15, specularHighlights: false, shadowSharpness: 0.75 },
    comicBehavior: { idealFor: ['soldiers', 'vigilantes', 'modern_heroes'], renderingStyle: 'matte_tactical', silhouette: 'combat_bulk' },
  },
  {
    id: 'GOTHIC_LEATHER', displayName: 'Gothic Leather', category: 'Noir',
    uiDescription: 'Dark layered leather with dramatic folds, trench silhouettes, and noir aesthetics.',
    physicalProperties: { stretch: 0.25, flexibility: 0.45, wrinkleAmount: 0.8, thickness: 0.75 },
    visualProperties: { reflectivity: 0.35, glossiness: 0.45, specularHighlights: true, shadowSharpness: 0.9 },
    comicBehavior: { idealFor: ['gothic_characters', 'dark_detectives', 'shadow_hunters'], renderingStyle: 'deep_shadow_folds', silhouette: 'layered_darkness' },
  },
  {
    id: 'ENERGY_CLOTH', displayName: 'Energy Cloth', category: 'Energy',
    uiDescription: 'Semi-physical glowing fabric made of living energy and dimensional particles.',
    physicalProperties: { stretch: 1.0, flexibility: 1.0, wrinkleAmount: 0.0, thickness: 0.05 },
    visualProperties: { reflectivity: 0.95, glossiness: 1.0, specularHighlights: true, shadowSharpness: 0.2 },
    comicBehavior: { idealFor: ['energy_beings', 'cosmic_entities', 'magic_users'], renderingStyle: 'glowing_particle_surface', silhouette: 'flowing_energy_shape' },
  },
  // ── Western Comics Research Additions (Action Style) ─────────────────────
  {
    id: 'VIBRANIUM_WEAVE', displayName: 'Vibranium Weave', category: 'Vibranium',
    uiDescription: 'Elite warrior-king nano-fiber weave that absorbs kinetic energy and redistributes it as purple-light pulses on impact.',
    physicalProperties: { stretch: 0.75, flexibility: 0.9, wrinkleAmount: 0.05, thickness: 0.4 },
    visualProperties: { reflectivity: 0.6, glossiness: 0.7, specularHighlights: true, shadowSharpness: 0.85 },
    comicBehavior: { idealFor: ['warrior_kings', 'tech_hunters', 'african_royalty'], renderingStyle: 'kinetic_purple_sheen', silhouette: 'sleek_royal_armor' },
  },
  {
    id: 'SYMBIOTE_ORGANIC', displayName: 'Symbiote Organic', category: 'Alien Bio',
    uiDescription: 'Living alien biomaterial that bonds to the host — liquid tendrils, shape-shifting surface, and predatory gloss.',
    physicalProperties: { stretch: 1.0, flexibility: 1.0, wrinkleAmount: 0.1, thickness: 0.2 },
    visualProperties: { reflectivity: 0.55, glossiness: 0.8, specularHighlights: true, shadowSharpness: 0.95 },
    comicBehavior: { idealFor: ['symbiote_hosts', 'anti_heroes', 'alien_entities'], renderingStyle: 'liquid_predator_surface', silhouette: 'organic_tendrils' },
  },
  {
    id: 'ASGARDIAN_URU_PLATE', displayName: 'Asgardian Uru Plate', category: 'Mythic Metal',
    uiDescription: 'Enchanted uru-forged battle plate from Asgardian armories — crackling lightning detail and god-tier durability.',
    physicalProperties: { stretch: 0.05, flexibility: 0.2, wrinkleAmount: 0.0, thickness: 1.0 },
    visualProperties: { reflectivity: 0.85, glossiness: 0.9, specularHighlights: true, shadowSharpness: 0.95 },
    comicBehavior: { idealFor: ['gods', 'asgardians', 'divine_warriors'], renderingStyle: 'enchanted_metal_crackle', silhouette: 'norse_battle_plate' },
  },
  // ── Western Comics Research Additions (Heroic Style) ─────────────────────
  {
    id: 'KRYPTONIAN_SOLAR_WEAVE', displayName: 'Solar Crystal Weave', category: 'Alien Tech',
    uiDescription: 'Crystalline alien nanofiber engineered for solar energy storage — virtually indestructible under yellow sun radiation.',
    physicalProperties: { stretch: 0.4, flexibility: 0.5, wrinkleAmount: 0.02, thickness: 0.35 },
    visualProperties: { reflectivity: 0.65, glossiness: 0.75, specularHighlights: true, shadowSharpness: 0.7 },
    comicBehavior: { idealFor: ['kryptonian_heroes', 'solar_warriors', 'invulnerable_icons'], renderingStyle: 'solar_crystalline_sheen', silhouette: 'clean_iconic_cape' },
  },
  {
    id: 'AMAZONIAN_DIVINE_GOLD', displayName: 'Amazonian Divine Gold', category: 'Divine Armor',
    uiDescription: 'God-forged adamantine gold plate from a legendary divine island — blessed by the gods with divine strength and warrior grace.',
    physicalProperties: { stretch: 0.1, flexibility: 0.3, wrinkleAmount: 0.0, thickness: 0.85 },
    visualProperties: { reflectivity: 0.95, glossiness: 0.95, specularHighlights: true, shadowSharpness: 0.9 },
    comicBehavior: { idealFor: ['warrior_queens', 'divine_champions', 'amazonian_warriors'], renderingStyle: 'divine_gold_radiance', silhouette: 'classical_warrior_queen' },
  },
  {
    id: 'SPEED_FORCE_SUIT', displayName: 'Speed Force Suit', category: 'Speed Tech',
    uiDescription: 'Frictionless polymer that vibrates at the molecular level — absorbs lightning charges and phases through impacts.',
    physicalProperties: { stretch: 0.98, flexibility: 1.0, wrinkleAmount: 0.0, thickness: 0.1 },
    visualProperties: { reflectivity: 0.5, glossiness: 0.6, specularHighlights: true, shadowSharpness: 0.3 },
    comicBehavior: { idealFor: ['speedsters', 'lightning_runners', 'velocity_heroes'], renderingStyle: 'lightning_streak_motion', silhouette: 'aerodynamic_velocity' },
  },
  // ── Anime Research Additions ──────────────────────────────────────────────
  {
    id: 'HAORI_NICHIRIN', displayName: 'Haori Nichirin', category: 'Spirit Cloth',
    uiDescription: 'Nichirin sword-dyed haori cloth from Demon Slayer tradition — elemental breath patterns woven into the textile grain.',
    physicalProperties: { stretch: 0.5, flexibility: 0.7, wrinkleAmount: 0.65, thickness: 0.5 },
    visualProperties: { reflectivity: 0.25, glossiness: 0.3, specularHighlights: false, shadowSharpness: 0.6 },
    comicBehavior: { idealFor: ['demon_slayers', 'sword_fighters', 'elemental_warriors'], renderingStyle: 'flowing_elemental_cloth', silhouette: 'dramatic_haori_cape' },
  },
  {
    id: 'SOUL_REAPER_HAKAMA', displayName: 'Soul Reaper Hakama', category: 'Spirit Cloth',
    uiDescription: 'Spirit-particle woven cloth tuned to spiritual pressure — responds to reiatsu output and hardens under high energy.',
    physicalProperties: { stretch: 0.45, flexibility: 0.65, wrinkleAmount: 0.7, thickness: 0.45 },
    visualProperties: { reflectivity: 0.15, glossiness: 0.1, specularHighlights: false, shadowSharpness: 0.7 },
    comicBehavior: { idealFor: ['soul_reapers', 'spirit_warriors', 'shinigami'], renderingStyle: 'spirit_pressure_cloth', silhouette: 'flowing_battle_robes' },
  },
  {
    id: 'KI_ABSORBING_GI', displayName: 'Ki-Absorbing Gi', category: 'Martial Arts',
    uiDescription: 'Battle-worn gi woven with ki-absorbing fibers — accumulates energy through combat and shows authentic battle damage.',
    physicalProperties: { stretch: 0.6, flexibility: 0.8, wrinkleAmount: 0.75, thickness: 0.4 },
    visualProperties: { reflectivity: 0.1, glossiness: 0.05, specularHighlights: false, shadowSharpness: 0.5 },
    comicBehavior: { idealFor: ['martial_artists', 'ki_warriors', 'tournament_fighters'], renderingStyle: 'battle_worn_combat_cloth', silhouette: 'open_gi_fighter' },
  },
  {
    id: 'CURSED_ENERGY_CLOTH', displayName: 'Cursed Energy Cloth', category: 'Dark Magic',
    uiDescription: 'Curse technique-woven fabric with black energy seams — amplifies cursed output and glows with hollow-violet resonance.',
    physicalProperties: { stretch: 0.5, flexibility: 0.7, wrinkleAmount: 0.3, thickness: 0.35 },
    visualProperties: { reflectivity: 0.4, glossiness: 0.5, specularHighlights: true, shadowSharpness: 0.85 },
    comicBehavior: { idealFor: ['curse_users', 'jujutsu_sorcerers', 'dark_mages'], renderingStyle: 'cursed_hollow_energy_seams', silhouette: 'sorcerer_battle_uniform' },
  },
];

export const MATERIAL_CATEGORY_COLORS: Record<string, string> = {
  'Superhero Fabric': '#FFD600',
  'Retro Sci-Fi':     '#38BDF8',
  'Future Tech':      '#A78BFA',
  'Cosmic Armor':     '#60A5FA',
  'Combat':           '#E8001C',
  'Noir':             '#94A3B8',
  'Energy':           '#22C55E',
  'Vibranium':        '#7C3AED',
  'Alien Bio':        '#DC2626',
  'Mythic Metal':     '#F59E0B',
  'Alien Tech':       '#38BDF8',
  'Divine Armor':     '#FCD34D',
  'Speed Tech':       '#FDE047',
  'Spirit Cloth':     '#818CF8',
  'Martial Arts':     '#F97316',
  'Dark Magic':       '#6D28D9',
};

export function detectCostumeMaterials(prompt: string): string[] {
  const d = prompt.toLowerCase();
  const detected: string[] = [];
  if (d.includes('lycra') || d.includes('spandex') || d.includes('skin tight') || d.includes('super suit'))   detected.push('LYCRA_HEROIC');
  if (d.includes('space age') || d.includes('retro future') || d.includes('retro sci'))                        detected.push('SPACE_AGE_FABRIC');
  if (d.includes('nanotech') || d.includes('nano armor') || d.includes('ai suit') || d.includes('adaptive'))  detected.push('NANOTECH_WEAVE');
  if (d.includes('cosmic armor') || d.includes('celestial armor') || d.includes('cosmic metal'))               detected.push('COSMIC_METAL');
  if (d.includes('kevlar') || d.includes('tactical') || d.includes('combat suit') || d.includes('military'))  detected.push('TACTICAL_KEVLAR');
  if (d.includes('leather') || d.includes('gothic') || d.includes('trench coat') || d.includes('noir'))       detected.push('GOTHIC_LEATHER');
  if (d.includes('energy cloth') || d.includes('living energy') || d.includes('glowing fabric'))               detected.push('ENERGY_CLOTH');
  if (d.includes('vibranium') || d.includes('kinetic') || d.includes('panther'))                               detected.push('VIBRANIUM_WEAVE');
  if (d.includes('symbiote') || d.includes('venom') || d.includes('alien suit') || d.includes('organic suit')) detected.push('SYMBIOTE_ORGANIC');
  if (d.includes('asgardian') || d.includes('uru') || d.includes('norse armor'))                               detected.push('ASGARDIAN_URU_PLATE');
  if (d.includes('kryptonian') || d.includes('solar weave') || d.includes('krypton'))                          detected.push('KRYPTONIAN_SOLAR_WEAVE');
  if (d.includes('amazonian') || d.includes('divine gold') || d.includes('themyscira'))                        detected.push('AMAZONIAN_DIVINE_GOLD');
  if (d.includes('speed force') || d.includes('speedster suit') || d.includes('lightning suit'))                detected.push('SPEED_FORCE_SUIT');
  if (d.includes('haori') || d.includes('nichirin') || d.includes('demon slayer'))                             detected.push('HAORI_NICHIRIN');
  if (d.includes('hakama') || d.includes('soul reaper') || d.includes('shinigami'))                            detected.push('SOUL_REAPER_HAKAMA');
  if (d.includes('gi') || d.includes('martial arts') || d.includes('dragon ball') || d.includes('ki cloth'))  detected.push('KI_ABSORBING_GI');
  if (d.includes('cursed') || d.includes('jujutsu') || d.includes('sorcerer suit'))                            detected.push('CURSED_ENERGY_CLOTH');
  return detected;
}
