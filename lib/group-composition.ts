// ============================================================================
// COMIC ART STUDIO AI
// GROUP COMPOSITION ENGINE — TypeScript port from Java
// ============================================================================

// ── Enums ─────────────────────────────────────────────────────────────────────

export type CompositionType =
  | 'TRIANGLE_FORMATION'
  | 'V_FORMATION'
  | 'CIRCULAR_COMPOSITION'
  | 'PYRAMID_DEPTH_STACK'
  | 'Z_FLOW_LAYOUT'
  | 'OPPOSING_FORCES'
  | 'EXPLOSION_COMPOSITION'
  | 'RADIAL_HERO'
  | 'LAYERED_CROWD'
  | 'STAIR_STEP'
  | 'CINEMATIC_DEPTH'
  | 'SPLASH_PAGE'
  | 'DOUBLE_PAGE_SPREAD'
  | 'TEAM_HERO_SHOT'
  | 'WAR_BATTLEFIELD'
  | 'ROOFTOP_CHASE'
  | 'AERIAL_ASSAULT'
  | 'PORTAL_EMERGENCE'
  | 'FINAL_BOSS_STANDOFF';

export type CompositionCameraAngle =
  | 'EYE_LEVEL'
  | 'LOW_ANGLE'
  | 'HIGH_ANGLE'
  | 'BIRDS_EYE'
  | 'DUTCH_ANGLE'
  | 'OVER_SHOULDER'
  | 'WORMS_EYE'
  | 'EXTREME_CLOSEUP'
  | 'CINEMATIC_WIDE'
  | 'ISOMETRIC';

export type EyeFlowPattern =
  | 'Z_FLOW'
  | 'S_CURVE'
  | 'TRIANGLE_FLOW'
  | 'SPIRAL_FLOW'
  | 'RADIAL_FLOW'
  | 'DIAGONAL_FLOW'
  | 'CENTER_FOCUS';

export type EmotionalTone =
  | 'HEROIC'
  | 'CHAOTIC'
  | 'TRAGIC'
  | 'MYSTICAL'
  | 'AGGRESSIVE'
  | 'HOPEFUL'
  | 'INTIMIDATING'
  | 'EPIC'
  | 'DARK'
  | 'TENSE';

export type CompositionEnvironmentType =
  | 'CITY'
  | 'FUTURISTIC_CITY'
  | 'SPACE'
  | 'CASTLE'
  | 'FOREST'
  | 'APOCALYPSE'
  | 'UNDERWATER'
  | 'DIMENSIONAL_REALM'
  | 'ROOFTOP'
  | 'INTERIOR_LAB'
  | 'MEDIEVAL'
  | 'TEMPLE'
  | 'BATTLEFIELD';

export type MotionDirection =
  | 'LEFT_TO_RIGHT'
  | 'RIGHT_TO_LEFT'
  | 'FORWARD'
  | 'BACKWARD'
  | 'UPWARD'
  | 'DOWNWARD'
  | 'RADIAL_OUT'
  | 'RADIAL_IN';

// ── Data structures ───────────────────────────────────────────────────────────

export interface Vector2 { x: number; y: number; }

export interface CharacterSlot {
  role: string;
  position: Vector2;
  scale: number;
  depthLayer: number;
  suggestedPose: string;
  motionDirection: MotionDirection;
  foregroundPriority: boolean;
  silhouettePriority: boolean;
}

export interface MotionVector {
  start: Vector2;
  end: Vector2;
  intensity: number;
  direction: MotionDirection;
}

export interface CompositionRules {
  enforceSilhouetteReadability: boolean;
  avoidTangentOverlaps: boolean;
  preserveEyeFlow: boolean;
  dynamicPerspective: boolean;
  dialogueSafeAreas: boolean;
  environmentDepthFog: boolean;
  cinematicLighting: boolean;
  motionBlurGuides: boolean;
}

export const DEFAULT_RULES: CompositionRules = {
  enforceSilhouetteReadability: true,
  avoidTangentOverlaps:         true,
  preserveEyeFlow:              true,
  dynamicPerspective:           true,
  dialogueSafeAreas:            true,
  environmentDepthFog:          true,
  cinematicLighting:            true,
  motionBlurGuides:             true,
};

export interface CompositionTemplate {
  type: CompositionType;
  emoji: string;
  cameraAngle: CompositionCameraAngle;
  eyeFlowPattern: EyeFlowPattern;
  emotionalTone: EmotionalTone;
  environmentType: CompositionEnvironmentType;
  characterSlots: CharacterSlot[];
  motionVectors: MotionVector[];
  rules: CompositionRules;
  focalPoint: string;
  lightingStyle: string;
  description: string;
}

// ── Composition Templates (ported from Java AICompositionEngine) ─────────────

export const COMPOSITION_TEMPLATES: Record<CompositionType, CompositionTemplate> = {

  TRIANGLE_FORMATION: {
    type: 'TRIANGLE_FORMATION',
    emoji: '▲',
    cameraAngle: 'LOW_ANGLE',
    eyeFlowPattern: 'TRIANGLE_FLOW',
    emotionalTone: 'HEROIC',
    environmentType: 'CITY',
    focalPoint: 'Central Hero',
    lightingStyle: 'Epic Rim Lighting',
    description: 'Classic Western comics team composition. Leader foreground center, two supports flanking in midground.',
    rules: DEFAULT_RULES,
    motionVectors: [
      { start: { x: 0.2, y: 0.9 }, end: { x: 0.5, y: 0.7 }, intensity: 0.8, direction: 'FORWARD' },
    ],
    characterSlots: [
      { role: 'Leader',        position: { x: 0.50, y: 0.72 }, scale: 1.3, depthLayer: 1, suggestedPose: 'Heroic Stand',   motionDirection: 'FORWARD',        foregroundPriority: true,  silhouettePriority: true },
      { role: 'Support Left',  position: { x: 0.25, y: 0.52 }, scale: 1.0, depthLayer: 2, suggestedPose: 'Combat Ready',   motionDirection: 'LEFT_TO_RIGHT',  foregroundPriority: false, silhouettePriority: true },
      { role: 'Support Right', position: { x: 0.75, y: 0.52 }, scale: 1.0, depthLayer: 2, suggestedPose: 'Weapon Aim',     motionDirection: 'RIGHT_TO_LEFT',  foregroundPriority: false, silhouettePriority: true },
    ],
  },

  V_FORMATION: {
    type: 'V_FORMATION',
    emoji: '✌️',
    cameraAngle: 'DUTCH_ANGLE',
    eyeFlowPattern: 'DIAGONAL_FLOW',
    emotionalTone: 'AGGRESSIVE',
    environmentType: 'BATTLEFIELD',
    focalPoint: 'Forward Momentum',
    lightingStyle: 'Dynamic War Lighting',
    description: 'Aggressive charge composition. All forces drive forward in a V wedge — unstoppable momentum.',
    rules: DEFAULT_RULES,
    motionVectors: [
      { start: { x: 0.5, y: 0.1 }, end: { x: 0.5, y: 0.9 }, intensity: 1.0, direction: 'FORWARD' },
    ],
    characterSlots: [
      { role: 'Center Leader', position: { x: 0.50, y: 0.75 }, scale: 1.4, depthLayer: 1, suggestedPose: 'Charge Forward',  motionDirection: 'FORWARD', foregroundPriority: true,  silhouettePriority: true },
      { role: 'Left Wing',     position: { x: 0.25, y: 0.45 }, scale: 1.0, depthLayer: 2, suggestedPose: 'Running Attack',  motionDirection: 'FORWARD', foregroundPriority: false, silhouettePriority: true },
      { role: 'Right Wing',    position: { x: 0.75, y: 0.45 }, scale: 1.0, depthLayer: 2, suggestedPose: 'Leap Attack',     motionDirection: 'FORWARD', foregroundPriority: false, silhouettePriority: true },
    ],
  },

  OPPOSING_FORCES: {
    type: 'OPPOSING_FORCES',
    emoji: '⚔️',
    cameraAngle: 'CINEMATIC_WIDE',
    eyeFlowPattern: 'Z_FLOW',
    emotionalTone: 'TENSE',
    environmentType: 'APOCALYPSE',
    focalPoint: 'Conflict Center',
    lightingStyle: 'Storm Lighting',
    description: 'Two forces preparing for collision. Tension fills the charged gap between hero and villain teams.',
    rules: DEFAULT_RULES,
    motionVectors: [],
    characterSlots: [
      { role: 'Hero Team',    position: { x: 0.25, y: 0.60 }, scale: 1.1, depthLayer: 1, suggestedPose: 'Battle Stance',    motionDirection: 'RIGHT_TO_LEFT', foregroundPriority: true, silhouettePriority: true },
      { role: 'Villain Team', position: { x: 0.75, y: 0.60 }, scale: 1.2, depthLayer: 1, suggestedPose: 'Threatening Pose', motionDirection: 'LEFT_TO_RIGHT', foregroundPriority: true, silhouettePriority: true },
    ],
  },

  RADIAL_HERO: {
    type: 'RADIAL_HERO',
    emoji: '⭕',
    cameraAngle: 'LOW_ANGLE',
    eyeFlowPattern: 'RADIAL_FLOW',
    emotionalTone: 'EPIC',
    environmentType: 'DIMENSIONAL_REALM',
    focalPoint: 'Hero Center',
    lightingStyle: 'Energy Burst Lighting',
    description: 'Iconic radial hero composition. Single hero at center, energy radiates outward — universe pivots around them.',
    rules: DEFAULT_RULES,
    motionVectors: [],
    characterSlots: [
      { role: 'Main Hero', position: { x: 0.5, y: 0.5 }, scale: 1.5, depthLayer: 1, suggestedPose: 'Power Pose', motionDirection: 'RADIAL_OUT', foregroundPriority: true, silhouettePriority: true },
    ],
  },

  LAYERED_CROWD: {
    type: 'LAYERED_CROWD',
    emoji: '👥',
    cameraAngle: 'CINEMATIC_WIDE',
    eyeFlowPattern: 'S_CURVE',
    emotionalTone: 'CHAOTIC',
    environmentType: 'BATTLEFIELD',
    focalPoint: 'Crowd Depth',
    lightingStyle: 'Dust and Fire Lighting',
    description: 'Large-scale cinematic battlefield. Five depth layers of crowd — foreground detail, midground action, background silhouettes.',
    rules: DEFAULT_RULES,
    motionVectors: [],
    characterSlots: [
      { role: 'Foreground Fighter',  position: { x: 0.15, y: 0.85 }, scale: 1.4, depthLayer: 1, suggestedPose: 'Combat Lunge',  motionDirection: 'FORWARD',       foregroundPriority: true,  silhouettePriority: true },
      { role: 'Foreground Fighter 2',position: { x: 0.85, y: 0.82 }, scale: 1.3, depthLayer: 1, suggestedPose: 'Block Stance',  motionDirection: 'RIGHT_TO_LEFT', foregroundPriority: true,  silhouettePriority: true },
      { role: 'Mid Action A',        position: { x: 0.35, y: 0.60 }, scale: 1.0, depthLayer: 2, suggestedPose: 'Crowd Action',  motionDirection: 'FORWARD',       foregroundPriority: false, silhouettePriority: false },
      { role: 'Mid Action B',        position: { x: 0.65, y: 0.58 }, scale: 1.0, depthLayer: 2, suggestedPose: 'Crowd Action',  motionDirection: 'FORWARD',       foregroundPriority: false, silhouettePriority: false },
      { role: 'Background Mass',     position: { x: 0.50, y: 0.35 }, scale: 0.6, depthLayer: 4, suggestedPose: 'Crowd Silhouette', motionDirection: 'FORWARD',    foregroundPriority: false, silhouettePriority: false },
    ],
  },

  EXPLOSION_COMPOSITION: {
    type: 'EXPLOSION_COMPOSITION',
    emoji: '💥',
    cameraAngle: 'DUTCH_ANGLE',
    eyeFlowPattern: 'RADIAL_FLOW',
    emotionalTone: 'CHAOTIC',
    environmentType: 'CITY',
    focalPoint: 'Explosion Epicenter',
    lightingStyle: 'Fireball Lighting',
    description: 'Characters burst outward from central impact. All motion vectors radiate from the explosion core.',
    rules: DEFAULT_RULES,
    motionVectors: [],
    characterSlots: [
      { role: 'Explosion Center Hero', position: { x: 0.5, y: 0.5 }, scale: 1.4, depthLayer: 1, suggestedPose: 'Explosion Leap', motionDirection: 'RADIAL_OUT', foregroundPriority: true, silhouettePriority: true },
    ],
  },

  Z_FLOW_LAYOUT: {
    type: 'Z_FLOW_LAYOUT',
    emoji: '↩',
    cameraAngle: 'CINEMATIC_WIDE',
    eyeFlowPattern: 'Z_FLOW',
    emotionalTone: 'HEROIC',
    environmentType: 'ROOFTOP',
    focalPoint: 'Z Reader Path',
    lightingStyle: 'Comic Contrast Lighting',
    description: 'Eye-guided storytelling composition. Reader eye traces Z-path: top-left anchor → center action → bottom-right resolution.',
    rules: DEFAULT_RULES,
    motionVectors: [],
    characterSlots: [
      { role: 'Top Left Focus',    position: { x: 0.20, y: 0.20 }, scale: 0.9, depthLayer: 2, suggestedPose: 'Pointing',     motionDirection: 'LEFT_TO_RIGHT', foregroundPriority: false, silhouettePriority: true },
      { role: 'Center Action',     position: { x: 0.50, y: 0.50 }, scale: 1.3, depthLayer: 1, suggestedPose: 'Mid Combat',   motionDirection: 'FORWARD',       foregroundPriority: true,  silhouettePriority: true },
      { role: 'Bottom Right Finish', position: { x: 0.80, y: 0.80 }, scale: 1.0, depthLayer: 2, suggestedPose: 'Landing Pose', motionDirection: 'RIGHT_TO_LEFT', foregroundPriority: false, silhouettePriority: true },
    ],
  },

  // ── Additional templates (from enum, no Java implementation provided) ──────
  CIRCULAR_COMPOSITION: {
    type: 'CIRCULAR_COMPOSITION',
    emoji: '🔵',
    cameraAngle: 'BIRDS_EYE',
    eyeFlowPattern: 'SPIRAL_FLOW',
    emotionalTone: 'INTIMIDATING',
    environmentType: 'TEMPLE',
    focalPoint: 'Surrounded Center',
    lightingStyle: 'Ritual Lighting',
    description: 'Characters arranged in a circle, all facing inward. Surrounded standoff — outnumbered hero or villain summoning.',
    rules: DEFAULT_RULES,
    motionVectors: [],
    characterSlots: [
      { role: 'Center Figure', position: { x: 0.50, y: 0.50 }, scale: 1.4, depthLayer: 1, suggestedPose: 'Defiant Stand',    motionDirection: 'RADIAL_OUT', foregroundPriority: true,  silhouettePriority: true },
      { role: 'North',         position: { x: 0.50, y: 0.20 }, scale: 1.0, depthLayer: 2, suggestedPose: 'Aggressive Stance', motionDirection: 'DOWNWARD',  foregroundPriority: false, silhouettePriority: true },
      { role: 'East',          position: { x: 0.80, y: 0.50 }, scale: 1.0, depthLayer: 2, suggestedPose: 'Weapon Ready',      motionDirection: 'LEFT_TO_RIGHT', foregroundPriority: false, silhouettePriority: true },
      { role: 'West',          position: { x: 0.20, y: 0.50 }, scale: 1.0, depthLayer: 2, suggestedPose: 'Weapon Ready',      motionDirection: 'RIGHT_TO_LEFT', foregroundPriority: false, silhouettePriority: true },
    ],
  },

  PYRAMID_DEPTH_STACK: {
    type: 'PYRAMID_DEPTH_STACK',
    emoji: '🔺',
    cameraAngle: 'LOW_ANGLE',
    eyeFlowPattern: 'TRIANGLE_FLOW',
    emotionalTone: 'EPIC',
    environmentType: 'CITY',
    focalPoint: 'Apex Hero',
    lightingStyle: 'Top-down Epic Lighting',
    description: 'Pyramid depth stacking — hero at apex, allies receding in depth layers behind. George Pérez signature.',
    rules: DEFAULT_RULES,
    motionVectors: [],
    characterSlots: [
      { role: 'Apex Hero',    position: { x: 0.50, y: 0.80 }, scale: 1.5, depthLayer: 1, suggestedPose: 'Power Stance',  motionDirection: 'FORWARD', foregroundPriority: true,  silhouettePriority: true },
      { role: 'Mid Left',     position: { x: 0.30, y: 0.55 }, scale: 1.1, depthLayer: 2, suggestedPose: 'Battle Ready',  motionDirection: 'FORWARD', foregroundPriority: false, silhouettePriority: true },
      { role: 'Mid Right',    position: { x: 0.70, y: 0.55 }, scale: 1.1, depthLayer: 2, suggestedPose: 'Battle Ready',  motionDirection: 'FORWARD', foregroundPriority: false, silhouettePriority: true },
      { role: 'Back Center',  position: { x: 0.50, y: 0.30 }, scale: 0.8, depthLayer: 3, suggestedPose: 'Running',       motionDirection: 'FORWARD', foregroundPriority: false, silhouettePriority: false },
    ],
  },

  STAIR_STEP: {
    type: 'STAIR_STEP',
    emoji: '🪜',
    cameraAngle: 'EYE_LEVEL',
    eyeFlowPattern: 'DIAGONAL_FLOW',
    emotionalTone: 'HEROIC',
    environmentType: 'CITY',
    focalPoint: 'Diagonal Path',
    lightingStyle: 'Side Rim Lighting',
    description: 'Characters descend diagonally across the panel — stair-step depth staging. Clean storytelling read.',
    rules: DEFAULT_RULES,
    motionVectors: [],
    characterSlots: [
      { role: 'First',  position: { x: 0.20, y: 0.75 }, scale: 1.3, depthLayer: 1, suggestedPose: 'Lead Walk',   motionDirection: 'LEFT_TO_RIGHT', foregroundPriority: true,  silhouettePriority: true },
      { role: 'Second', position: { x: 0.45, y: 0.55 }, scale: 1.1, depthLayer: 2, suggestedPose: 'Follow Walk', motionDirection: 'LEFT_TO_RIGHT', foregroundPriority: false, silhouettePriority: true },
      { role: 'Third',  position: { x: 0.70, y: 0.35 }, scale: 0.9, depthLayer: 3, suggestedPose: 'Rear Walk',   motionDirection: 'LEFT_TO_RIGHT', foregroundPriority: false, silhouettePriority: false },
    ],
  },

  CINEMATIC_DEPTH: {
    type: 'CINEMATIC_DEPTH',
    emoji: '🎬',
    cameraAngle: 'CINEMATIC_WIDE',
    eyeFlowPattern: 'Z_FLOW',
    emotionalTone: 'TENSE',
    environmentType: 'CITY',
    focalPoint: 'Depth Vanishing Point',
    lightingStyle: 'Bryan Hitch Widescreen Lighting',
    description: 'Maximum depth illusion — foreground framing element, midground character, background environment. Bryan Hitch signature.',
    rules: DEFAULT_RULES,
    motionVectors: [],
    characterSlots: [
      { role: 'Foreground Frame',  position: { x: 0.10, y: 0.65 }, scale: 1.6, depthLayer: 1, suggestedPose: 'Back Silhouette', motionDirection: 'FORWARD', foregroundPriority: true,  silhouettePriority: true },
      { role: 'Midground Subject', position: { x: 0.55, y: 0.55 }, scale: 1.1, depthLayer: 2, suggestedPose: 'Cinematic Pose',  motionDirection: 'FORWARD', foregroundPriority: false, silhouettePriority: true },
    ],
  },

  SPLASH_PAGE: {
    type: 'SPLASH_PAGE',
    emoji: '🌟',
    cameraAngle: 'WORMS_EYE',
    eyeFlowPattern: 'RADIAL_FLOW',
    emotionalTone: 'EPIC',
    environmentType: 'CITY',
    focalPoint: 'Splash Hero',
    lightingStyle: 'Alex Ross Painted Light',
    description: 'Full page splash — single hero dominates the entire page. Maximum impact introduction or reveal.',
    rules: DEFAULT_RULES,
    motionVectors: [],
    characterSlots: [
      { role: 'Splash Hero', position: { x: 0.5, y: 0.55 }, scale: 2.0, depthLayer: 1, suggestedPose: 'Iconic Power Stance', motionDirection: 'FORWARD', foregroundPriority: true, silhouettePriority: true },
    ],
  },

  DOUBLE_PAGE_SPREAD: {
    type: 'DOUBLE_PAGE_SPREAD',
    emoji: '📖',
    cameraAngle: 'CINEMATIC_WIDE',
    eyeFlowPattern: 'Z_FLOW',
    emotionalTone: 'EPIC',
    environmentType: 'BATTLEFIELD',
    focalPoint: 'Spread Center Gutter',
    lightingStyle: 'Epic War Lighting',
    description: 'Double page spread battle scene. Action flows across both pages with the gutter as a natural tension point.',
    rules: DEFAULT_RULES,
    motionVectors: [],
    characterSlots: [
      { role: 'Left Page Hero',    position: { x: 0.25, y: 0.60 }, scale: 1.3, depthLayer: 1, suggestedPose: 'Battle Charge',   motionDirection: 'LEFT_TO_RIGHT', foregroundPriority: true,  silhouettePriority: true },
      { role: 'Right Page Villain',position: { x: 0.75, y: 0.60 }, scale: 1.3, depthLayer: 1, suggestedPose: 'Villain Counter', motionDirection: 'RIGHT_TO_LEFT', foregroundPriority: true,  silhouettePriority: true },
      { role: 'Background Army',   position: { x: 0.50, y: 0.35 }, scale: 0.7, depthLayer: 3, suggestedPose: 'Crowd Charge',    motionDirection: 'FORWARD',       foregroundPriority: false, silhouettePriority: false },
    ],
  },

  TEAM_HERO_SHOT: {
    type: 'TEAM_HERO_SHOT',
    emoji: '🦸',
    cameraAngle: 'LOW_ANGLE',
    eyeFlowPattern: 'TRIANGLE_FLOW',
    emotionalTone: 'HEROIC',
    environmentType: 'CITY',
    focalPoint: 'Team Leader',
    lightingStyle: 'Sunrise Hero Lighting',
    description: 'Classic team roster shot. Five heroes arranged for maximum individual readability — poster composition.',
    rules: DEFAULT_RULES,
    motionVectors: [],
    characterSlots: [
      { role: 'Team Leader',  position: { x: 0.50, y: 0.75 }, scale: 1.4, depthLayer: 1, suggestedPose: 'Leader Stance',   motionDirection: 'FORWARD',       foregroundPriority: true,  silhouettePriority: true },
      { role: 'Heavy Hitter', position: { x: 0.20, y: 0.58 }, scale: 1.2, depthLayer: 2, suggestedPose: 'Arms Crossed',    motionDirection: 'LEFT_TO_RIGHT', foregroundPriority: false, silhouettePriority: true },
      { role: 'Speedster',    position: { x: 0.80, y: 0.58 }, scale: 1.0, depthLayer: 2, suggestedPose: 'Speed Crouch',    motionDirection: 'RIGHT_TO_LEFT', foregroundPriority: false, silhouettePriority: true },
      { role: 'Tactician',    position: { x: 0.35, y: 0.40 }, scale: 0.9, depthLayer: 3, suggestedPose: 'Observing',       motionDirection: 'FORWARD',       foregroundPriority: false, silhouettePriority: true },
      { role: 'Wildcard',     position: { x: 0.65, y: 0.40 }, scale: 0.9, depthLayer: 3, suggestedPose: 'Casual Lean',     motionDirection: 'FORWARD',       foregroundPriority: false, silhouettePriority: true },
    ],
  },

  WAR_BATTLEFIELD: {
    type: 'WAR_BATTLEFIELD',
    emoji: '🔥',
    cameraAngle: 'CINEMATIC_WIDE',
    eyeFlowPattern: 'S_CURVE',
    emotionalTone: 'CHAOTIC',
    environmentType: 'BATTLEFIELD',
    focalPoint: 'Battle Focal Hero',
    lightingStyle: 'Fire and Smoke Lighting',
    description: 'Epic war battlefield. S-curve eye flow through layers of conflict from foreground to distant horizon.',
    rules: DEFAULT_RULES,
    motionVectors: [],
    characterSlots: [
      { role: 'Battle Hero',    position: { x: 0.30, y: 0.75 }, scale: 1.3, depthLayer: 1, suggestedPose: 'Battlecry',      motionDirection: 'FORWARD', foregroundPriority: true,  silhouettePriority: true },
      { role: 'Fallen Ally',    position: { x: 0.70, y: 0.78 }, scale: 1.0, depthLayer: 1, suggestedPose: 'Fallen Pose',    motionDirection: 'DOWNWARD', foregroundPriority: false, silhouettePriority: true },
      { role: 'Enemy Advance',  position: { x: 0.55, y: 0.50 }, scale: 0.9, depthLayer: 2, suggestedPose: 'Charge Advance', motionDirection: 'FORWARD', foregroundPriority: false, silhouettePriority: false },
      { role: 'Background War', position: { x: 0.50, y: 0.30 }, scale: 0.5, depthLayer: 4, suggestedPose: 'Battle Mass',    motionDirection: 'FORWARD', foregroundPriority: false, silhouettePriority: false },
    ],
  },

  ROOFTOP_CHASE: {
    type: 'ROOFTOP_CHASE',
    emoji: '🏃',
    cameraAngle: 'DUTCH_ANGLE',
    eyeFlowPattern: 'DIAGONAL_FLOW',
    emotionalTone: 'TENSE',
    environmentType: 'ROOFTOP',
    focalPoint: 'Chase Target',
    lightingStyle: 'Night Neon Lighting',
    description: 'High-speed rooftop chase. Dutch angle adds psychological urgency. Pursuer and prey in diagonal tension.',
    rules: DEFAULT_RULES,
    motionVectors: [],
    characterSlots: [
      { role: 'Pursuer',  position: { x: 0.25, y: 0.65 }, scale: 1.3, depthLayer: 1, suggestedPose: 'Full Sprint',     motionDirection: 'LEFT_TO_RIGHT', foregroundPriority: true,  silhouettePriority: true },
      { role: 'Prey',     position: { x: 0.72, y: 0.48 }, scale: 1.1, depthLayer: 2, suggestedPose: 'Rooftop Leap',    motionDirection: 'LEFT_TO_RIGHT', foregroundPriority: false, silhouettePriority: true },
    ],
  },

  AERIAL_ASSAULT: {
    type: 'AERIAL_ASSAULT',
    emoji: '🦅',
    cameraAngle: 'BIRDS_EYE',
    eyeFlowPattern: 'RADIAL_FLOW',
    emotionalTone: 'AGGRESSIVE',
    environmentType: 'CITY',
    focalPoint: 'Attack Origin',
    lightingStyle: 'Sky Backlit Lighting',
    description: 'Aerial assault from above. Birds-eye view shows multiple attackers converging on a ground target.',
    rules: DEFAULT_RULES,
    motionVectors: [],
    characterSlots: [
      { role: 'Aerial Lead',  position: { x: 0.50, y: 0.25 }, scale: 1.4, depthLayer: 1, suggestedPose: 'Sky Dive',        motionDirection: 'DOWNWARD', foregroundPriority: true,  silhouettePriority: true },
      { role: 'Wing Left',    position: { x: 0.25, y: 0.35 }, scale: 1.0, depthLayer: 2, suggestedPose: 'Aerial Combat',   motionDirection: 'DOWNWARD', foregroundPriority: false, silhouettePriority: true },
      { role: 'Wing Right',   position: { x: 0.75, y: 0.35 }, scale: 1.0, depthLayer: 2, suggestedPose: 'Aerial Combat',   motionDirection: 'DOWNWARD', foregroundPriority: false, silhouettePriority: true },
      { role: 'Ground Target',position: { x: 0.50, y: 0.80 }, scale: 0.8, depthLayer: 3, suggestedPose: 'Defensive Guard', motionDirection: 'UPWARD',   foregroundPriority: false, silhouettePriority: true },
    ],
  },

  PORTAL_EMERGENCE: {
    type: 'PORTAL_EMERGENCE',
    emoji: '🌀',
    cameraAngle: 'EYE_LEVEL',
    eyeFlowPattern: 'SPIRAL_FLOW',
    emotionalTone: 'MYSTICAL',
    environmentType: 'DIMENSIONAL_REALM',
    focalPoint: 'Portal Origin',
    lightingStyle: 'Portal Energy Glow',
    description: 'Hero or villain emerges from dimensional portal. Spiral flow pulls eye toward the figure stepping through.',
    rules: DEFAULT_RULES,
    motionVectors: [],
    characterSlots: [
      { role: 'Emerging Figure', position: { x: 0.50, y: 0.55 }, scale: 1.4, depthLayer: 1, suggestedPose: 'Portal Step Through', motionDirection: 'FORWARD', foregroundPriority: true, silhouettePriority: true },
    ],
  },

  FINAL_BOSS_STANDOFF: {
    type: 'FINAL_BOSS_STANDOFF',
    emoji: '👑',
    cameraAngle: 'LOW_ANGLE',
    eyeFlowPattern: 'TRIANGLE_FLOW',
    emotionalTone: 'INTIMIDATING',
    environmentType: 'DIMENSIONAL_REALM',
    focalPoint: 'Boss Figure',
    lightingStyle: 'Villain Overhead Dramatic Lighting',
    description: 'Ultimate standoff. Final boss looms above — small hero below creates maximum scale contrast and dread.',
    rules: DEFAULT_RULES,
    motionVectors: [],
    characterSlots: [
      { role: 'Final Boss', position: { x: 0.50, y: 0.30 }, scale: 2.0, depthLayer: 1, suggestedPose: 'Villain Loom',   motionDirection: 'DOWNWARD',  foregroundPriority: true,  silhouettePriority: true },
      { role: 'Hero',       position: { x: 0.50, y: 0.80 }, scale: 0.9, depthLayer: 2, suggestedPose: 'Defiant Stand',  motionDirection: 'UPWARD',    foregroundPriority: false, silhouettePriority: true },
    ],
  },
};

// ── CinematicDirectorAI.optimizeComposition() ─────────────────────────────────
// Ported from Java: foreground chars get +10% scale; silhouette chars get a flag
export function optimizeComposition(template: CompositionTemplate): CompositionTemplate {
  return {
    ...template,
    characterSlots: template.characterSlots.map(slot => ({
      ...slot,
      scale: slot.foregroundPriority ? slot.scale * 1.1 : slot.scale,
    })),
  };
}

// ── AICompositionEngine.analyzePrompt() ───────────────────────────────────────
export function analyzeGroupPrompt(prompt: string): CompositionType {
  const p = prompt.toLowerCase();
  if (p.includes('splash') || p.includes('full page'))               return 'SPLASH_PAGE';
  if (p.includes('double page') || p.includes('spread'))             return 'DOUBLE_PAGE_SPREAD';
  if (p.includes('boss') || p.includes('final') || p.includes('villain loom')) return 'FINAL_BOSS_STANDOFF';
  if (p.includes('portal') || p.includes('dimension'))               return 'PORTAL_EMERGENCE';
  if (p.includes('rooftop chase') || p.includes('pursuit'))          return 'ROOFTOP_CHASE';
  if (p.includes('aerial') || p.includes('dive bomb'))               return 'AERIAL_ASSAULT';
  if (p.includes('surrounded') || p.includes('circle'))              return 'CIRCULAR_COMPOSITION';
  if (p.includes('war') || p.includes('battlefield'))                return 'WAR_BATTLEFIELD';
  if (p.includes('team shot') || p.includes('roster'))               return 'TEAM_HERO_SHOT';
  if (p.includes('explosion') || p.includes('blast'))                return 'EXPLOSION_COMPOSITION';
  if (p.includes('crowd') || p.includes('army'))                     return 'LAYERED_CROWD';
  if (p.includes('battle') || p.includes('vs') || p.includes('versus')) return 'OPPOSING_FORCES';
  if (p.includes('charge') || p.includes('rush'))                    return 'V_FORMATION';
  if (p.includes('team') || p.includes('squad') || p.includes('group')) return 'TRIANGLE_FORMATION';
  if (p.includes('hero') || p.includes('power'))                     return 'RADIAL_HERO';
  if (p.includes('depth') || p.includes('cinematic'))                return 'CINEMATIC_DEPTH';
  return 'Z_FLOW_LAYOUT';
}

// ── Prompt fragment builder ───────────────────────────────────────────────────
export function buildGroupCompositionFragment(type: CompositionType): string {
  const t = optimizeComposition(COMPOSITION_TEMPLATES[type]);
  const slots = t.characterSlots.map(s =>
    `${s.role} (${s.suggestedPose}, depth ${s.depthLayer})`
  ).join(', ');
  return [
    `Group composition: ${type.replace(/_/g, ' ')}.`,
    `Slots: ${slots}.`,
    `Camera: ${t.cameraAngle.replace(/_/g, ' ')}.`,
    `Eye flow: ${t.eyeFlowPattern.replace(/_/g, ' ')}.`,
    `Tone: ${t.emotionalTone}.`,
    `Focal point: ${t.focalPoint}.`,
    `Lighting: ${t.lightingStyle}.`,
  ].join(' ');
}

// ── Display metadata ──────────────────────────────────────────────────────────
export const EMOTIONAL_TONE_COLORS: Record<EmotionalTone, string> = {
  HEROIC:       '#FFD600',
  CHAOTIC:      '#E8001C',
  TRAGIC:       '#8B7355',
  MYSTICAL:     '#A78BFA',
  AGGRESSIVE:   '#FF6A00',
  HOPEFUL:      '#22C55E',
  INTIMIDATING: '#1E1E2E',
  EPIC:         '#FF9500',
  DARK:         '#94A3B8',
  TENSE:        '#60A5FA',
};

export const EYE_FLOW_EMOJI: Record<EyeFlowPattern, string> = {
  Z_FLOW:        '↩',
  S_CURVE:       '〜',
  TRIANGLE_FLOW: '▲',
  SPIRAL_FLOW:   '🌀',
  RADIAL_FLOW:   '⭕',
  DIAGONAL_FLOW: '↗',
  CENTER_FOCUS:  '🎯',
};
