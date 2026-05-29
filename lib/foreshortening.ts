/**
 * EXTREME FORESHORTENING ENGINE
 * Western Comics Pose Analysis System
 *
 * Reference: COMIC ART STUDIO EXTREME FORESHORTENING ENGINE
 * Classes: PerspectiveCameraEngine · ComicPoseAnalyzer ·
 *          ExtremePoseGenerator · AIPoseCorrector · PanelFlowEngine
 */

export interface AnatomyCompression {
  [bodyPart: string]: number; // scale factor: >1 toward camera, <1 receding
}

export interface ForeshorteningProfile {
  distortion:         number;             // 1–10 extreme distortion score
  dominantShape:      string;             // triangle, diamond, arrow, monster_mass…
  publisherStyle:     'Action Comics' | 'Heroic Comics' | 'Classic Comics';
  cameraAngle:        string;             // worm_eye, ground_level, etc.
  anatomyCompression: AnatomyCompression;
  effectsAt: {
    speedLines:  number;  // intensity/10 threshold
    impactBurst: number;
    panelBreak:  number;
  };
}

export interface PoseAnalysis {
  marvelScore:     number;  // 0–100
  dcScore:         number;  // 0–100
  extremeScore:    number;  // 0–10
  silhouetteScore: number;  // 0–10
  recommendations: string[];
}

// ── Profile map ───────────────────────────────────────────────────────────────
// Researched from FORESHORTENING_ARCHETYPES reference +
// ComicPoseAnalyzer / PerspectiveCameraEngine depth calculations

export const FORESHORTENING_PROFILES: Record<string, ForeshorteningProfile> = {

  // ── reference archetypes (canonical) ────────────────────────────────────────
  punch_camera: {
    distortion: 9, dominantShape: 'Triangle', publisherStyle: 'Action Comics',
    cameraAngle: 'low_close',
    anatomyCompression: { fist: 2.4, forearm: 1.8, torso: 1.0, legs: 0.7 },
    effectsAt: { speedLines: 4, impactBurst: 6, panelBreak: 9 },
  },
  villain_lunge: {
    distortion: 10, dominantShape: 'Monster Mass', publisherStyle: 'Action Comics',
    cameraAngle: 'extreme_low',
    anatomyCompression: { head: 1.8, shoulders: 2.2, legs: 0.6, claws: 2.0 },
    effectsAt: { speedLines: 3, impactBurst: 5, panelBreak: 8 },
  },
  flying_toward_camera: {
    distortion: 9, dominantShape: 'Arrow', publisherStyle: 'Heroic Comics',
    cameraAngle: 'upward_tracking',
    anatomyCompression: { chest: 2.2, fists: 2.0, hips: 0.7, feet: 0.4 },
    effectsAt: { speedLines: 3, impactBurst: 6, panelBreak: 8 },
  },

  // ── HEROIC ───────────────────────────────────────────────────────────────────
  hero_landing: {
    distortion: 8, dominantShape: 'Diamond', publisherStyle: 'Classic Comics',
    cameraAngle: 'ground_level',
    anatomyCompression: { frontLeg: 2.0, torso: 1.2, rearLeg: 0.5, fist: 1.3 },
    effectsAt: { speedLines: 5, impactBurst: 7, panelBreak: 9 },
  },
  flying_punch: {
    distortion: 9, dominantShape: 'Diagonal Spear', publisherStyle: 'Action Comics',
    cameraAngle: 'extreme_low',
    anatomyCompression: { fist: 2.4, forearm: 1.8, torso: 1.0, legs: 0.7 },
    effectsAt: { speedLines: 4, impactBurst: 6, panelBreak: 9 },
  },
  mid_air_attack: {
    distortion: 9, dominantShape: 'Forward Triangle', publisherStyle: 'Action Comics',
    cameraAngle: 'low_close',
    anatomyCompression: { fist: 2.2, forearm: 1.6, chest: 1.3, legs: 0.6 },
    effectsAt: { speedLines: 4, impactBurst: 6, panelBreak: 8 },
  },
  energy_blast: {
    distortion: 7, dominantShape: 'Cross', publisherStyle: 'Action Comics',
    cameraAngle: 'hero_low',
    anatomyCompression: { hands: 1.8, forearms: 1.4, torso: 1.0, feet: 0.8 },
    effectsAt: { speedLines: 3, impactBurst: 6, panelBreak: 8 },
  },
  power_stance: {
    distortion: 5, dominantShape: 'Wide-W', publisherStyle: 'Classic Comics',
    cameraAngle: 'hero_low',
    anatomyCompression: { chest: 1.4, shoulders: 1.3, feet: 0.9, head: 0.8 },
    effectsAt: { speedLines: 6, impactBurst: 8, panelBreak: 10 },
  },
  cape_spread: {
    distortion: 4, dominantShape: 'Cross / T-Shape', publisherStyle: 'Heroic Comics',
    cameraAngle: 'upward_tracking',
    anatomyCompression: { chest: 1.6, shoulders: 1.4, feet: 0.5 },
    effectsAt: { speedLines: 7, impactBurst: 9, panelBreak: 10 },
  },
  charging_forward: {
    distortion: 8, dominantShape: 'Wedge', publisherStyle: 'Classic Comics',
    cameraAngle: 'tilted_dutch',
    anatomyCompression: { chest: 1.8, head: 1.4, legs: 0.7, rear: 0.5 },
    effectsAt: { speedLines: 4, impactBurst: 7, panelBreak: 9 },
  },
  sprint_burst: {
    distortion: 6, dominantShape: 'Horizontal Arrow', publisherStyle: 'Action Comics',
    cameraAngle: 'tilted_dutch',
    anatomyCompression: { leadFoot: 1.8, torso: 1.2, rearLeg: 0.7, head: 1.1 },
    effectsAt: { speedLines: 3, impactBurst: 7, panelBreak: 10 },
  },
  battle_roar: {
    distortion: 6, dominantShape: 'Radial Burst', publisherStyle: 'Classic Comics',
    cameraAngle: 'hero_low',
    anatomyCompression: { chest: 1.5, shoulders: 1.4, arms: 1.2, legs: 0.9 },
    effectsAt: { speedLines: 5, impactBurst: 7, panelBreak: 9 },
  },
  defensive_pose: {
    distortion: 5, dominantShape: 'Diamond Guard', publisherStyle: 'Classic Comics',
    cameraAngle: 'hero_low',
    anatomyCompression: { shield: 2.0, forearms: 1.5, torso: 0.9, rear: 0.7 },
    effectsAt: { speedLines: 5, impactBurst: 8, panelBreak: 10 },
  },

  // ── FIGHTING ─────────────────────────────────────────────────────────────────
  boxing_punch: {
    distortion: 8, dominantShape: 'Compressed L', publisherStyle: 'Action Comics',
    cameraAngle: 'tilted_dutch',
    anatomyCompression: { fist: 2.2, forearm: 1.7, shoulder: 1.3, rear: 0.7 },
    effectsAt: { speedLines: 4, impactBurst: 6, panelBreak: 9 },
  },
  hook_punch: {
    distortion: 7, dominantShape: 'C-Arc', publisherStyle: 'Action Comics',
    cameraAngle: 'hero_low',
    anatomyCompression: { fist: 2.0, forearm: 1.5, elbow: 1.3, rear: 0.8 },
    effectsAt: { speedLines: 4, impactBurst: 6, panelBreak: 9 },
  },
  uppercut: {
    distortion: 8, dominantShape: 'Vertical J', publisherStyle: 'Action Comics',
    cameraAngle: 'extreme_low',
    anatomyCompression: { fist: 2.0, forearm: 1.5, torso: 1.2, legs: 0.8 },
    effectsAt: { speedLines: 5, impactBurst: 7, panelBreak: 9 },
  },
  knee_strike: {
    distortion: 7, dominantShape: 'Rising Triangle', publisherStyle: 'Action Comics',
    cameraAngle: 'hero_low',
    anatomyCompression: { knee: 2.0, thigh: 1.6, torso: 1.1, rear: 0.7 },
    effectsAt: { speedLines: 4, impactBurst: 6, panelBreak: 9 },
  },
  roundhouse_kick: {
    distortion: 7, dominantShape: 'Arc', publisherStyle: 'Action Comics',
    cameraAngle: 'hero_low',
    anatomyCompression: { foot: 2.0, shin: 1.6, thigh: 1.2, torso: 0.9 },
    effectsAt: { speedLines: 4, impactBurst: 6, panelBreak: 9 },
  },
  flying_kick: {
    distortion: 9, dominantShape: 'Horizontal Spear', publisherStyle: 'Action Comics',
    cameraAngle: 'low_close',
    anatomyCompression: { foot: 2.2, shin: 1.8, torso: 1.0, trailingLeg: 0.6 },
    effectsAt: { speedLines: 3, impactBurst: 6, panelBreak: 8 },
  },
  grapple_throw: {
    distortion: 8, dominantShape: 'Arc Mass', publisherStyle: 'Action Comics',
    cameraAngle: 'tilted_dutch',
    anatomyCompression: { arms: 1.6, torso: 1.3, head: 1.1, legs: 0.7 },
    effectsAt: { speedLines: 5, impactBurst: 7, panelBreak: 9 },
  },
  sword_slash: {
    distortion: 7, dominantShape: 'Diagonal Blade', publisherStyle: 'Classic Comics',
    cameraAngle: 'tilted_dutch',
    anatomyCompression: { hand: 1.8, forearm: 1.5, blade: 2.0, legs: 0.8 },
    effectsAt: { speedLines: 3, impactBurst: 6, panelBreak: 9 },
  },
  axe_swing: {
    distortion: 8, dominantShape: 'Overhead Arc', publisherStyle: 'Action Comics',
    cameraAngle: 'overhead_attack',
    anatomyCompression: { hands: 2.0, weapon: 2.4, torso: 1.3, legs: 0.7 },
    effectsAt: { speedLines: 3, impactBurst: 5, panelBreak: 8 },
  },
  shield_block: {
    distortion: 6, dominantShape: 'Diamond Guard', publisherStyle: 'Classic Comics',
    cameraAngle: 'hero_low',
    anatomyCompression: { shield: 2.2, arm: 1.6, torso: 0.9, rear: 0.7 },
    effectsAt: { speedLines: 5, impactBurst: 7, panelBreak: 9 },
  },
  spear_thrust: {
    distortion: 8, dominantShape: 'Forward Spear', publisherStyle: 'Classic Comics',
    cameraAngle: 'low_close',
    anatomyCompression: { spearTip: 2.4, hands: 1.8, torso: 1.1, legs: 0.7 },
    effectsAt: { speedLines: 3, impactBurst: 6, panelBreak: 8 },
  },

  // ── ACROBATICS ───────────────────────────────────────────────────────────────
  front_flip: {
    distortion: 7, dominantShape: 'Tuck Circle', publisherStyle: 'Action Comics',
    cameraAngle: 'overhead_attack',
    anatomyCompression: { head: 1.6, knees: 1.4, torso: 0.9, feet: 0.7 },
    effectsAt: { speedLines: 4, impactBurst: 8, panelBreak: 10 },
  },
  back_flip: {
    distortion: 7, dominantShape: 'Arch', publisherStyle: 'Action Comics',
    cameraAngle: 'tilted_dutch',
    anatomyCompression: { chest: 1.5, head: 1.3, legs: 1.2, torso: 0.9 },
    effectsAt: { speedLines: 4, impactBurst: 8, panelBreak: 10 },
  },
  wall_crawl: {
    distortion: 6, dominantShape: 'X-Spread', publisherStyle: 'Action Comics',
    cameraAngle: 'fisheye_action',
    anatomyCompression: { hands: 1.5, feet: 1.3, torso: 0.9, head: 0.8 },
    effectsAt: { speedLines: 6, impactBurst: 9, panelBreak: 10 },
  },
  swinging: {
    distortion: 7, dominantShape: 'Pendulum Arc', publisherStyle: 'Action Comics',
    cameraAngle: 'upward_tracking',
    anatomyCompression: { hands: 1.7, arms: 1.4, torso: 1.1, legs: 0.7 },
    effectsAt: { speedLines: 4, impactBurst: 7, panelBreak: 10 },
  },
  dive_roll: {
    distortion: 7, dominantShape: 'Compressed Spiral', publisherStyle: 'Action Comics',
    cameraAngle: 'overhead_attack',
    anatomyCompression: { shoulder: 1.8, head: 1.5, torso: 1.0, legs: 0.7 },
    effectsAt: { speedLines: 4, impactBurst: 7, panelBreak: 9 },
  },
  double_kick: {
    distortion: 8, dominantShape: 'Horizontal Split', publisherStyle: 'Action Comics',
    cameraAngle: 'hero_low',
    anatomyCompression: { feet: 2.0, shins: 1.6, torso: 1.0, head: 0.8 },
    effectsAt: { speedLines: 3, impactBurst: 6, panelBreak: 8 },
  },
  wall_leap: {
    distortion: 7, dominantShape: 'Diagonal Launch', publisherStyle: 'Action Comics',
    cameraAngle: 'low_close',
    anatomyCompression: { leadFoot: 1.8, chest: 1.4, torso: 1.1, rear: 0.6 },
    effectsAt: { speedLines: 4, impactBurst: 7, panelBreak: 9 },
  },
  slide_dodge: {
    distortion: 6, dominantShape: 'Low Horizontal', publisherStyle: 'Action Comics',
    cameraAngle: 'ground_level',
    anatomyCompression: { leadLeg: 1.8, torso: 1.2, arms: 1.1, head: 0.9 },
    effectsAt: { speedLines: 4, impactBurst: 7, panelBreak: 9 },
  },

  // ── CINEMATIC ────────────────────────────────────────────────────────────────
  villain_walk: {
    distortion: 5, dominantShape: 'Vertical Mass', publisherStyle: 'Classic Comics',
    cameraAngle: 'impact_closeup',
    anatomyCompression: { head: 1.3, shoulders: 1.5, torso: 1.1, feet: 0.7 },
    effectsAt: { speedLines: 6, impactBurst: 9, panelBreak: 10 },
  },
  rooftop_silhouette: {
    distortion: 4, dominantShape: 'Vertical Silhouette', publisherStyle: 'Heroic Comics',
    cameraAngle: 'upward_tracking',
    anatomyCompression: { head: 1.2, shoulders: 1.1, torso: 1.0, feet: 0.7 },
    effectsAt: { speedLines: 7, impactBurst: 9, panelBreak: 10 },
  },
  slow_turn_reveal: {
    distortion: 3, dominantShape: 'Profile Mass', publisherStyle: 'Classic Comics',
    cameraAngle: 'impact_closeup',
    anatomyCompression: { head: 1.3, shoulders: 1.2, torso: 1.0, feet: 0.9 },
    effectsAt: { speedLines: 7, impactBurst: 9, panelBreak: 10 },
  },
  power_awakening: {
    distortion: 8, dominantShape: 'Radial Explosion', publisherStyle: 'Action Comics',
    cameraAngle: 'extreme_low',
    anatomyCompression: { chest: 1.8, shoulders: 2.0, arms: 1.6, legs: 0.8 },
    effectsAt: { speedLines: 3, impactBurst: 5, panelBreak: 7 },
  },
  backlit_entrance: {
    distortion: 5, dominantShape: 'Silhouette Spread', publisherStyle: 'Heroic Comics',
    cameraAngle: 'upward_tracking',
    anatomyCompression: { shoulders: 1.6, chest: 1.4, feet: 0.6 },
    effectsAt: { speedLines: 6, impactBurst: 8, panelBreak: 10 },
  },

  // ── EMOTIONAL ────────────────────────────────────────────────────────────────
  grieving: {
    distortion: 2, dominantShape: 'Collapsed C', publisherStyle: 'Classic Comics',
    cameraAngle: 'impact_closeup',
    anatomyCompression: { head: 1.4, shoulders: 1.2, torso: 1.0, legs: 0.9 },
    effectsAt: { speedLines: 9, impactBurst: 10, panelBreak: 10 },
  },
  rage_transformation: {
    distortion: 9, dominantShape: 'Radial Explosion', publisherStyle: 'Action Comics',
    cameraAngle: 'extreme_low',
    anatomyCompression: { chest: 2.0, shoulders: 2.2, arms: 1.6, legs: 0.8 },
    effectsAt: { speedLines: 3, impactBurst: 5, panelBreak: 7 },
  },
  angry_scream: {
    distortion: 6, dominantShape: 'Radial Open', publisherStyle: 'Classic Comics',
    cameraAngle: 'hero_low',
    anatomyCompression: { mouth: 1.6, chest: 1.4, shoulders: 1.3, legs: 0.9 },
    effectsAt: { speedLines: 4, impactBurst: 7, panelBreak: 9 },
  },
  fear_pose: {
    distortion: 4, dominantShape: 'Recoil Wedge', publisherStyle: 'Classic Comics',
    cameraAngle: 'tilted_dutch',
    anatomyCompression: { hands: 1.6, head: 1.3, torso: 0.9, legs: 0.8 },
    effectsAt: { speedLines: 6, impactBurst: 8, panelBreak: 10 },
  },

  // ── TEAM ─────────────────────────────────────────────────────────────────────
  team_charge: {
    distortion: 7, dominantShape: 'Wedge Formation', publisherStyle: 'Classic Comics',
    cameraAngle: 'tilted_dutch',
    anatomyCompression: { leadFigure: 1.6, midFigures: 1.0, rearFigures: 0.6 },
    effectsAt: { speedLines: 3, impactBurst: 6, panelBreak: 8 },
  },
  back_to_back: {
    distortion: 5, dominantShape: 'Double Silhouette', publisherStyle: 'Classic Comics',
    cameraAngle: 'hero_low',
    anatomyCompression: { shoulders: 1.4, heads: 1.2, torsos: 1.0, feet: 0.8 },
    effectsAt: { speedLines: 5, impactBurst: 8, panelBreak: 10 },
  },
  last_stand: {
    distortion: 7, dominantShape: 'Fortress Ring', publisherStyle: 'Classic Comics',
    cameraAngle: 'overhead_attack',
    anatomyCompression: { shoulders: 1.5, weapons: 1.6, torsos: 1.0, feet: 0.7 },
    effectsAt: { speedLines: 4, impactBurst: 6, panelBreak: 8 },
  },

  // ── CREATURE ─────────────────────────────────────────────────────────────────
  beast_crawl: {
    distortion: 7, dominantShape: 'Monster Mass', publisherStyle: 'Action Comics',
    cameraAngle: 'fisheye_action',
    anatomyCompression: { head: 1.8, shoulders: 2.2, legs: 0.6, claws: 1.6 },
    effectsAt: { speedLines: 5, impactBurst: 7, panelBreak: 8 },
  },
  roaring: {
    distortion: 7, dominantShape: 'Radial Jaw', publisherStyle: 'Action Comics',
    cameraAngle: 'extreme_low',
    anatomyCompression: { mouth: 2.0, head: 1.8, shoulders: 1.4, body: 0.8 },
    effectsAt: { speedLines: 4, impactBurst: 6, panelBreak: 8 },
  },
  predator_leap: {
    distortion: 8, dominantShape: 'Claws Forward', publisherStyle: 'Action Comics',
    cameraAngle: 'low_close',
    anatomyCompression: { claws: 2.2, head: 1.8, torso: 1.1, rear: 0.6 },
    effectsAt: { speedLines: 3, impactBurst: 5, panelBreak: 8 },
  },
  giant_smash: {
    distortion: 9, dominantShape: 'Fist Down Mass', publisherStyle: 'Action Comics',
    cameraAngle: 'overhead_attack',
    anatomyCompression: { fist: 2.4, forearm: 2.0, torso: 1.4, legs: 0.6 },
    effectsAt: { speedLines: 3, impactBurst: 5, panelBreak: 7 },
  },
  wing_expansion: {
    distortion: 6, dominantShape: 'Wingspan Arc', publisherStyle: 'Classic Comics',
    cameraAngle: 'upward_tracking',
    anatomyCompression: { wings: 2.4, chest: 1.6, legs: 0.6 },
    effectsAt: { speedLines: 5, impactBurst: 7, panelBreak: 9 },
  },

  // ── MAGIC ────────────────────────────────────────────────────────────────────
  spell_casting: {
    distortion: 6, dominantShape: 'Radial', publisherStyle: 'Classic Comics',
    cameraAngle: 'hero_low',
    anatomyCompression: { hands: 2.0, forearms: 1.4, torso: 1.0, feet: 0.9 },
    effectsAt: { speedLines: 5, impactBurst: 7, panelBreak: 9 },
  },
  energy_orb: {
    distortion: 6, dominantShape: 'Sphere Focus', publisherStyle: 'Classic Comics',
    cameraAngle: 'hero_low',
    anatomyCompression: { hands: 2.2, forearms: 1.5, torso: 1.0, legs: 0.9 },
    effectsAt: { speedLines: 5, impactBurst: 7, panelBreak: 9 },
  },
  portal_opening: {
    distortion: 7, dominantShape: 'Dimensional Arc', publisherStyle: 'Classic Comics',
    cameraAngle: 'tilted_dutch',
    anatomyCompression: { hands: 2.0, forearms: 1.6, torso: 1.0, feet: 0.8 },
    effectsAt: { speedLines: 5, impactBurst: 7, panelBreak: 9 },
  },
  floating_meditation: {
    distortion: 4, dominantShape: 'Lotus Oval', publisherStyle: 'Classic Comics',
    cameraAngle: 'upward_tracking',
    anatomyCompression: { head: 1.3, hands: 1.4, torso: 1.0, legs: 0.8 },
    effectsAt: { speedLines: 7, impactBurst: 9, panelBreak: 10 },
  },
  staff_slam: {
    distortion: 8, dominantShape: 'Overhead Arc', publisherStyle: 'Classic Comics',
    cameraAngle: 'overhead_attack',
    anatomyCompression: { staff: 2.2, hands: 1.8, torso: 1.2, legs: 0.7 },
    effectsAt: { speedLines: 3, impactBurst: 5, panelBreak: 8 },
  },

  // ── WEAPON ───────────────────────────────────────────────────────────────────
  gun_draw: {
    distortion: 7, dominantShape: 'Gun Barrel Forward', publisherStyle: 'Action Comics',
    cameraAngle: 'hero_low',
    anatomyCompression: { gun: 2.2, hand: 1.8, forearm: 1.4, body: 0.8 },
    effectsAt: { speedLines: 5, impactBurst: 7, panelBreak: 9 },
  },
  sniper_aim: {
    distortion: 5, dominantShape: 'Prone Horizontal', publisherStyle: 'Action Comics',
    cameraAngle: 'ground_level',
    anatomyCompression: { barrel: 2.0, hands: 1.6, torso: 1.0, legs: 0.8 },
    effectsAt: { speedLines: 6, impactBurst: 8, panelBreak: 10 },
  },
  bow_draw: {
    distortion: 6, dominantShape: 'T-Bow', publisherStyle: 'Classic Comics',
    cameraAngle: 'hero_low',
    anatomyCompression: { bow: 1.8, leadArm: 1.5, torso: 1.1, rear: 0.8 },
    effectsAt: { speedLines: 5, impactBurst: 7, panelBreak: 9 },
  },
  dual_pistols: {
    distortion: 7, dominantShape: 'Spread Eagle Guns', publisherStyle: 'Action Comics',
    cameraAngle: 'hero_low',
    anatomyCompression: { guns: 2.0, hands: 1.7, arms: 1.3, body: 0.9 },
    effectsAt: { speedLines: 4, impactBurst: 6, panelBreak: 8 },
  },
  hammer_throw: {
    distortion: 8, dominantShape: 'Rotating Mass', publisherStyle: 'Action Comics',
    cameraAngle: 'tilted_dutch',
    anatomyCompression: { hammer: 2.4, hand: 1.8, arm: 1.5, body: 0.8 },
    effectsAt: { speedLines: 3, impactBurst: 5, panelBreak: 7 },
  },

  // ── STORYBOARD ───────────────────────────────────────────────────────────────
  spider_swing: {
    distortion: 7, dominantShape: 'Pendulum Arc', publisherStyle: 'Action Comics',
    cameraAngle: 'upward_tracking',
    anatomyCompression: { hands: 1.7, arms: 1.5, torso: 1.1, legs: 0.6 },
    effectsAt: { speedLines: 4, impactBurst: 7, panelBreak: 9 },
  },
  fist_to_ground: {
    distortion: 9, dominantShape: 'Impact Crater', publisherStyle: 'Action Comics',
    cameraAngle: 'ground_level',
    anatomyCompression: { fist: 2.4, forearm: 2.0, torso: 1.3, legs: 0.6 },
    effectsAt: { speedLines: 3, impactBurst: 5, panelBreak: 7 },
  },
  energy_charge: {
    distortion: 7, dominantShape: 'Aura Radial', publisherStyle: 'Action Comics',
    cameraAngle: 'extreme_low',
    anatomyCompression: { chest: 1.8, shoulders: 1.6, arms: 1.4, legs: 0.9 },
    effectsAt: { speedLines: 4, impactBurst: 6, panelBreak: 8 },
  },

  // ── AERIAL ────────────────────────────────────────────────────────────────
  power_leap: {
    distortion: 8, dominantShape: 'Inverted Arrow', publisherStyle: 'Action Comics',
    cameraAngle: 'extreme_low',
    anatomyCompression: { feet: 2.2, shins: 1.8, torso: 1.1, head: 0.7 },
    effectsAt: { speedLines: 3, impactBurst: 6, panelBreak: 8 },
  },
  soaring_glide: {
    distortion: 7, dominantShape: 'Arrow', publisherStyle: 'Classic Comics',
    cameraAngle: 'upward_tracking',
    anatomyCompression: { chest: 2.0, fists: 1.8, hips: 0.8, feet: 0.4 },
    effectsAt: { speedLines: 3, impactBurst: 7, panelBreak: 9 },
  },
  apex_hover: {
    distortion: 5, dominantShape: 'T-Cross', publisherStyle: 'Classic Comics',
    cameraAngle: 'extreme_low',
    anatomyCompression: { chest: 1.6, shoulders: 1.4, arms: 1.2, feet: 0.5 },
    effectsAt: { speedLines: 6, impactBurst: 8, panelBreak: 10 },
  },
  combat_dive: {
    distortion: 9, dominantShape: 'Descending Spear', publisherStyle: 'Classic Comics',
    cameraAngle: 'overhead_attack',
    anatomyCompression: { head: 2.0, shoulders: 1.8, torso: 1.2, feet: 0.4 },
    effectsAt: { speedLines: 3, impactBurst: 5, panelBreak: 7 },
  },
  sky_patrol: {
    distortion: 4, dominantShape: 'Delta Wing', publisherStyle: 'Heroic Comics',
    cameraAngle: 'upward_tracking',
    anatomyCompression: { chest: 1.5, shoulders: 1.3, cape: 2.2, feet: 0.5 },
    effectsAt: { speedLines: 6, impactBurst: 9, panelBreak: 10 },
  },
  upward_spiral: {
    distortion: 7, dominantShape: 'Helix Arc', publisherStyle: 'Action Comics',
    cameraAngle: 'extreme_low',
    anatomyCompression: { leadArm: 1.8, torso: 1.3, trailingLeg: 0.7, head: 0.9 },
    effectsAt: { speedLines: 4, impactBurst: 7, panelBreak: 9 },
  },
  free_fall: {
    distortion: 7, dominantShape: 'X-Spread', publisherStyle: 'Classic Comics',
    cameraAngle: 'overhead_attack',
    anatomyCompression: { arms: 1.6, legs: 1.5, torso: 1.1, head: 0.9 },
    effectsAt: { speedLines: 4, impactBurst: 7, panelBreak: 9 },
  },
  rocket_launch: {
    distortion: 8, dominantShape: 'Vertical Column', publisherStyle: 'Action Comics',
    cameraAngle: 'extreme_low',
    anatomyCompression: { boots: 2.4, shins: 1.8, torso: 1.1, head: 0.6 },
    effectsAt: { speedLines: 3, impactBurst: 5, panelBreak: 7 },
  },
  aerial_cartwheel: {
    distortion: 7, dominantShape: 'Four-Point Star', publisherStyle: 'Action Comics',
    cameraAngle: 'tilted_dutch',
    anatomyCompression: { leadArm: 1.9, leadLeg: 1.8, torso: 1.0, rearLeg: 0.7 },
    effectsAt: { speedLines: 4, impactBurst: 8, panelBreak: 10 },
  },
  controlled_descent: {
    distortion: 4, dominantShape: 'Vertical Silhouette', publisherStyle: 'Heroic Comics',
    cameraAngle: 'upward_tracking',
    anatomyCompression: { chest: 1.4, shoulders: 1.2, torso: 1.0, feet: 0.7 },
    effectsAt: { speedLines: 7, impactBurst: 9, panelBreak: 10 },
  },

  // ── POWERUP ────────────────────────────────────────────────────────────────
  energy_accumulation: {
    distortion: 6, dominantShape: 'Compressed Sphere', publisherStyle: 'Classic Comics',
    cameraAngle: 'hero_low',
    anatomyCompression: { hands: 2.0, chest: 1.5, shoulders: 1.3, feet: 0.9 },
    effectsAt: { speedLines: 4, impactBurst: 6, panelBreak: 9 },
  },
  power_surge: {
    distortion: 9, dominantShape: 'Radial Explosion', publisherStyle: 'Action Comics',
    cameraAngle: 'extreme_low',
    anatomyCompression: { chest: 2.0, shoulders: 2.2, arms: 1.7, legs: 0.8 },
    effectsAt: { speedLines: 3, impactBurst: 4, panelBreak: 6 },
  },
  armor_activation: {
    distortion: 5, dominantShape: 'Expanding Column', publisherStyle: 'Action Comics',
    cameraAngle: 'hero_low',
    anatomyCompression: { chest: 1.8, shoulders: 1.6, gauntlets: 1.5, feet: 0.8 },
    effectsAt: { speedLines: 5, impactBurst: 7, panelBreak: 9 },
  },
  berserker_rage: {
    distortion: 9, dominantShape: 'Jagged Wedge', publisherStyle: 'Action Comics',
    cameraAngle: 'extreme_low',
    anatomyCompression: { claws: 2.4, fists: 2.2, shoulders: 1.8, legs: 0.7 },
    effectsAt: { speedLines: 3, impactBurst: 5, panelBreak: 7 },
  },
  mutation_outbreak: {
    distortion: 9, dominantShape: 'Irregular Expansion', publisherStyle: 'Action Comics',
    cameraAngle: 'fisheye_action',
    anatomyCompression: { torso: 2.2, shoulders: 2.4, hands: 1.8, feet: 0.7 },
    effectsAt: { speedLines: 4, impactBurst: 5, panelBreak: 7 },
  },
  cosmic_awakening: {
    distortion: 7, dominantShape: 'Light Column', publisherStyle: 'Classic Comics',
    cameraAngle: 'extreme_low',
    anatomyCompression: { chest: 1.8, aura: 2.5, torso: 1.2, legs: 0.8 },
    effectsAt: { speedLines: 4, impactBurst: 6, panelBreak: 8 },
  },
  limit_break: {
    distortion: 8, dominantShape: 'Elongated Spike', publisherStyle: 'Classic Comics',
    cameraAngle: 'extreme_low',
    anatomyCompression: { chest: 2.0, shoulders: 1.9, aura: 2.2, feet: 0.6 },
    effectsAt: { speedLines: 3, impactBurst: 5, panelBreak: 7 },
  },
  final_form: {
    distortion: 8, dominantShape: 'Maximum Radial', publisherStyle: 'Classic Comics',
    cameraAngle: 'extreme_low',
    anatomyCompression: { chest: 2.2, shoulders: 2.4, aura: 3.0, feet: 0.5 },
    effectsAt: { speedLines: 3, impactBurst: 4, panelBreak: 5 },
  },
  healing_factor: {
    distortion: 4, dominantShape: 'Rising C-Curve', publisherStyle: 'Action Comics',
    cameraAngle: 'hero_low',
    anatomyCompression: { torso: 1.3, shoulders: 1.2, hands: 1.1, feet: 0.9 },
    effectsAt: { speedLines: 6, impactBurst: 8, panelBreak: 10 },
  },
  aura_manifest: {
    distortion: 6, dominantShape: 'Double Silhouette', publisherStyle: 'Classic Comics',
    cameraAngle: 'hero_low',
    anatomyCompression: { aura: 2.0, chest: 1.5, shoulders: 1.3, feet: 0.8 },
    effectsAt: { speedLines: 4, impactBurst: 6, panelBreak: 8 },
  },

  // ── BLAST ──────────────────────────────────────────────────────────────────
  optic_blast: {
    distortion: 6, dominantShape: 'Horizontal Beam', publisherStyle: 'Action Comics',
    cameraAngle: 'hero_low',
    anatomyCompression: { visor: 2.0, head: 1.6, shoulders: 1.3, legs: 0.9 },
    effectsAt: { speedLines: 3, impactBurst: 5, panelBreak: 8 },
  },
  heat_vision_sweep: {
    distortion: 5, dominantShape: 'Wide Horizontal Arc', publisherStyle: 'Heroic Comics',
    cameraAngle: 'hero_low',
    anatomyCompression: { eyes: 1.8, head: 1.4, shoulders: 1.2, legs: 0.9 },
    effectsAt: { speedLines: 4, impactBurst: 6, panelBreak: 9 },
  },
  unibeam_blast: {
    distortion: 8, dominantShape: 'Circle-to-Cone', publisherStyle: 'Action Comics',
    cameraAngle: 'hero_low',
    anatomyCompression: { chestPiece: 2.4, torso: 1.6, shoulders: 1.2, feet: 0.7 },
    effectsAt: { speedLines: 3, impactBurst: 5, panelBreak: 7 },
  },
  lightning_call: {
    distortion: 8, dominantShape: 'Upward Triangle', publisherStyle: 'Action Comics',
    cameraAngle: 'extreme_low',
    anatomyCompression: { weapon: 2.4, hands: 1.8, chest: 1.4, feet: 0.7 },
    effectsAt: { speedLines: 3, impactBurst: 5, panelBreak: 7 },
  },
  plasma_burst: {
    distortion: 7, dominantShape: 'Diagonal Cone', publisherStyle: 'Action Comics',
    cameraAngle: 'hero_low',
    anatomyCompression: { fist: 2.2, forearm: 1.8, shoulders: 1.3, legs: 0.8 },
    effectsAt: { speedLines: 3, impactBurst: 5, panelBreak: 7 },
  },
  concussion_wave: {
    distortion: 7, dominantShape: 'Wide T Push', publisherStyle: 'Classic Comics',
    cameraAngle: 'hero_low',
    anatomyCompression: { hands: 1.8, arms: 1.5, chest: 1.2, legs: 0.8 },
    effectsAt: { speedLines: 3, impactBurst: 5, panelBreak: 7 },
  },
  ice_ray: {
    distortion: 5, dominantShape: 'Diagonal Lattice', publisherStyle: 'Action Comics',
    cameraAngle: 'hero_low',
    anatomyCompression: { hand: 1.8, forearm: 1.5, torso: 1.0, legs: 0.9 },
    effectsAt: { speedLines: 4, impactBurst: 6, panelBreak: 9 },
  },
  telekinetic_hurl: {
    distortion: 6, dominantShape: 'Asymmetric Gesture', publisherStyle: 'Action Comics',
    cameraAngle: 'hero_low',
    anatomyCompression: { hand: 2.0, forearm: 1.6, torso: 1.0, legs: 0.9 },
    effectsAt: { speedLines: 4, impactBurst: 6, panelBreak: 9 },
  },
  point_blank_explosion: {
    distortion: 10, dominantShape: 'Zero-Range Starburst', publisherStyle: 'Action Comics',
    cameraAngle: 'impact_closeup',
    anatomyCompression: { contact: 3.0, arms: 1.8, torso: 1.2, legs: 0.6 },
    effectsAt: { speedLines: 3, impactBurst: 4, panelBreak: 5 },
  },
  charged_throw: {
    distortion: 7, dominantShape: 'Pitcher Arc', publisherStyle: 'Action Comics',
    cameraAngle: 'tilted_dutch',
    anatomyCompression: { throwHand: 2.2, forearm: 1.8, torso: 1.2, rearLeg: 0.7 },
    effectsAt: { speedLines: 3, impactBurst: 5, panelBreak: 8 },
  },

  // ── IMPACT ─────────────────────────────────────────────────────────────────
  ground_pound_crater: {
    distortion: 10, dominantShape: 'Descending Mass', publisherStyle: 'Action Comics',
    cameraAngle: 'extreme_low',
    anatomyCompression: { fist: 2.6, forearm: 2.2, torso: 1.5, legs: 0.5 },
    effectsAt: { speedLines: 3, impactBurst: 4, panelBreak: 5 },
  },
  wall_crash_through: {
    distortion: 9, dominantShape: 'Figure-In-Debris', publisherStyle: 'Action Comics',
    cameraAngle: 'hero_low',
    anatomyCompression: { chest: 2.2, shoulders: 2.0, torso: 1.4, legs: 0.6 },
    effectsAt: { speedLines: 3, impactBurst: 5, panelBreak: 6 },
  },
  aerial_pile_driver: {
    distortion: 9, dominantShape: 'Two-Body Spear', publisherStyle: 'Action Comics',
    cameraAngle: 'overhead_attack',
    anatomyCompression: { head: 2.0, shoulders: 1.8, torso: 1.3, legs: 0.6 },
    effectsAt: { speedLines: 3, impactBurst: 5, panelBreak: 7 },
  },
  collision_impact: {
    distortion: 9, dominantShape: 'Double Wedge X', publisherStyle: 'Classic Comics',
    cameraAngle: 'tilted_dutch',
    anatomyCompression: { contact: 2.4, chests: 1.8, legs: 0.7, heads: 1.0 },
    effectsAt: { speedLines: 3, impactBurst: 5, panelBreak: 6 },
  },
  building_destruction: {
    distortion: 8, dominantShape: 'Diagonal Cut Mass', publisherStyle: 'Action Comics',
    cameraAngle: 'overhead_attack',
    anatomyCompression: { impactZone: 2.2, torso: 1.6, arms: 1.3, legs: 0.6 },
    effectsAt: { speedLines: 3, impactBurst: 5, panelBreak: 6 },
  },
  sonic_boom_body: {
    distortion: 8, dominantShape: 'Cone Compression', publisherStyle: 'Classic Comics',
    cameraAngle: 'tilted_dutch',
    anatomyCompression: { chest: 2.0, shoulders: 1.8, torso: 1.2, feet: 0.5 },
    effectsAt: { speedLines: 2, impactBurst: 5, panelBreak: 7 },
  },
  shockwave_epicenter: {
    distortion: 7, dominantShape: 'Bull-Eye Radial', publisherStyle: 'Classic Comics',
    cameraAngle: 'overhead_attack',
    anatomyCompression: { torso: 1.6, arms: 1.4, shockwave: 3.0, legs: 0.8 },
    effectsAt: { speedLines: 3, impactBurst: 5, panelBreak: 6 },
  },
  car_launch: {
    distortion: 8, dominantShape: 'Projectile Arc', publisherStyle: 'Action Comics',
    cameraAngle: 'tilted_dutch',
    anatomyCompression: { arms: 2.2, shoulders: 2.0, torso: 1.4, legs: 0.7 },
    effectsAt: { speedLines: 3, impactBurst: 5, panelBreak: 7 },
  },
  slam_down: {
    distortion: 8, dominantShape: 'Two-Body Vertical', publisherStyle: 'Action Comics',
    cameraAngle: 'overhead_attack',
    anatomyCompression: { hands: 2.0, arms: 1.7, torso: 1.3, legs: 0.7 },
    effectsAt: { speedLines: 3, impactBurst: 5, panelBreak: 7 },
  },

  // ── STEALTH ────────────────────────────────────────────────────────────────
  gargoyle_perch: {
    distortion: 5, dominantShape: 'Compressed Triangle', publisherStyle: 'Heroic Comics',
    cameraAngle: 'extreme_low',
    anatomyCompression: { cape: 2.2, shoulders: 1.6, torso: 1.1, feet: 0.8 },
    effectsAt: { speedLines: 7, impactBurst: 9, panelBreak: 10 },
  },
  shadow_merge: {
    distortion: 3, dominantShape: 'Abstract Shadow', publisherStyle: 'Heroic Comics',
    cameraAngle: 'tilted_dutch',
    anatomyCompression: { shadow: 2.0, torso: 1.0, limbs: 0.9, head: 0.8 },
    effectsAt: { speedLines: 8, impactBurst: 10, panelBreak: 10 },
  },
  ceiling_hang: {
    distortion: 6, dominantShape: 'Inverted T', publisherStyle: 'Heroic Comics',
    cameraAngle: 'upward_tracking',
    anatomyCompression: { hands: 1.8, arms: 1.5, torso: 1.1, head: 0.8 },
    effectsAt: { speedLines: 6, impactBurst: 9, panelBreak: 10 },
  },
  wall_press: {
    distortion: 3, dominantShape: 'Thin Vertical', publisherStyle: 'Heroic Comics',
    cameraAngle: 'impact_closeup',
    anatomyCompression: { torso: 1.2, shoulders: 1.1, arms: 1.0, depth: 0.2 },
    effectsAt: { speedLines: 8, impactBurst: 10, panelBreak: 10 },
  },
  ninja_vanish: {
    distortion: 5, dominantShape: 'Dissolving Diagonal', publisherStyle: 'Action Comics',
    cameraAngle: 'tilted_dutch',
    anatomyCompression: { leadFoot: 1.6, torso: 1.1, trailingArm: 0.7, head: 0.9 },
    effectsAt: { speedLines: 5, impactBurst: 8, panelBreak: 10 },
  },
  ambush_drop: {
    distortion: 7, dominantShape: 'Compressed Descent', publisherStyle: 'Heroic Comics',
    cameraAngle: 'overhead_attack',
    anatomyCompression: { cape: 2.0, shoulders: 1.7, torso: 1.2, legs: 0.7 },
    effectsAt: { speedLines: 4, impactBurst: 7, panelBreak: 9 },
  },
  crouched_stalk: {
    distortion: 4, dominantShape: 'Low Horizontal', publisherStyle: 'Classic Comics',
    cameraAngle: 'ground_level',
    anatomyCompression: { leadFoot: 1.7, torso: 1.2, arms: 1.1, head: 0.9 },
    effectsAt: { speedLines: 6, impactBurst: 9, panelBreak: 10 },
  },
  wire_traverse: {
    distortion: 4, dominantShape: 'Tightrope Cross', publisherStyle: 'Heroic Comics',
    cameraAngle: 'upward_tracking',
    anatomyCompression: { arms: 1.5, torso: 1.1, feet: 1.2, head: 0.9 },
    effectsAt: { speedLines: 6, impactBurst: 9, panelBreak: 10 },
  },
  interrogation_loom: {
    distortion: 5, dominantShape: 'Authority Triangle', publisherStyle: 'Heroic Comics',
    cameraAngle: 'extreme_low',
    anatomyCompression: { shoulders: 1.8, chest: 1.5, head: 1.3, feet: 0.6 },
    effectsAt: { speedLines: 7, impactBurst: 9, panelBreak: 10 },
  },

  // ── DOMINANCE ──────────────────────────────────────────────────────────────
  villain_throne: {
    distortion: 3, dominantShape: 'Authority Throne', publisherStyle: 'Classic Comics',
    cameraAngle: 'extreme_low',
    anatomyCompression: { head: 1.5, shoulders: 1.8, torso: 1.2, feet: 0.5 },
    effectsAt: { speedLines: 7, impactBurst: 9, panelBreak: 10 },
  },
  power_reveal: {
    distortion: 5, dominantShape: 'Silhouette Spread', publisherStyle: 'Heroic Comics',
    cameraAngle: 'upward_tracking',
    anatomyCompression: { chest: 1.6, shoulders: 1.8, cape: 2.2, feet: 0.5 },
    effectsAt: { speedLines: 7, impactBurst: 9, panelBreak: 10 },
  },
  intimidation_loom: {
    distortion: 6, dominantShape: 'Authority Triangle', publisherStyle: 'Classic Comics',
    cameraAngle: 'extreme_low',
    anatomyCompression: { shoulders: 1.9, chest: 1.6, head: 1.4, feet: 0.6 },
    effectsAt: { speedLines: 6, impactBurst: 8, panelBreak: 10 },
  },
  territory_claim: {
    distortion: 5, dominantShape: 'Standing Over', publisherStyle: 'Classic Comics',
    cameraAngle: 'overhead_attack',
    anatomyCompression: { chest: 1.5, shoulders: 1.4, head: 1.2, legs: 0.8 },
    effectsAt: { speedLines: 6, impactBurst: 9, panelBreak: 10 },
  },
  silent_command: {
    distortion: 4, dominantShape: 'Command Arm', publisherStyle: 'Classic Comics',
    cameraAngle: 'hero_low',
    anatomyCompression: { arm: 1.7, hand: 2.0, chest: 1.3, feet: 0.8 },
    effectsAt: { speedLines: 6, impactBurst: 9, panelBreak: 10 },
  },
  god_stare: {
    distortion: 3, dominantShape: 'Absolute Column', publisherStyle: 'Heroic Comics',
    cameraAngle: 'extreme_low',
    anatomyCompression: { head: 1.4, shoulders: 1.6, torso: 1.2, feet: 0.5 },
    effectsAt: { speedLines: 7, impactBurst: 9, panelBreak: 10 },
  },
  alpha_crouch: {
    distortion: 7, dominantShape: 'Predator Spring', publisherStyle: 'Classic Comics',
    cameraAngle: 'extreme_low',
    anatomyCompression: { claws: 2.2, shoulders: 1.8, head: 1.5, legs: 0.7 },
    effectsAt: { speedLines: 5, impactBurst: 7, panelBreak: 9 },
  },
  monologue_stance: {
    distortion: 4, dominantShape: 'Theatrical Triangle', publisherStyle: 'Classic Comics',
    cameraAngle: 'hero_low',
    anatomyCompression: { hand: 1.8, arm: 1.5, chest: 1.3, feet: 0.8 },
    effectsAt: { speedLines: 6, impactBurst: 9, panelBreak: 10 },
  },

  // ── DIALOGUE ───────────────────────────────────────────────────────────────
  confrontation_standoff: {
    distortion: 3, dominantShape: 'Tension Gap', publisherStyle: 'Classic Comics',
    cameraAngle: 'impact_closeup',
    anatomyCompression: { heads: 1.3, shoulders: 1.2, torsos: 1.0, feet: 0.9 },
    effectsAt: { speedLines: 7, impactBurst: 9, panelBreak: 10 },
  },
  heated_argument: {
    distortion: 4, dominantShape: 'Aggressive Point', publisherStyle: 'Classic Comics',
    cameraAngle: 'hero_low',
    anatomyCompression: { hand: 1.9, arm: 1.5, chest: 1.2, feet: 0.9 },
    effectsAt: { speedLines: 6, impactBurst: 8, panelBreak: 10 },
  },
  villain_monologue: {
    distortion: 4, dominantShape: 'Theatrical Mass', publisherStyle: 'Classic Comics',
    cameraAngle: 'extreme_low',
    anatomyCompression: { hand: 1.7, chest: 1.4, shoulders: 1.3, feet: 0.7 },
    effectsAt: { speedLines: 6, impactBurst: 9, panelBreak: 10 },
  },
  desperate_plea: {
    distortion: 4, dominantShape: 'Open Reach', publisherStyle: 'Classic Comics',
    cameraAngle: 'hero_low',
    anatomyCompression: { hands: 2.0, arms: 1.5, chest: 1.1, feet: 0.9 },
    effectsAt: { speedLines: 6, impactBurst: 9, panelBreak: 10 },
  },
  cold_threat: {
    distortion: 5, dominantShape: 'Lean In', publisherStyle: 'Heroic Comics',
    cameraAngle: 'impact_closeup',
    anatomyCompression: { face: 2.0, head: 1.6, shoulders: 1.2, feet: 0.8 },
    effectsAt: { speedLines: 6, impactBurst: 9, panelBreak: 10 },
  },
  revelation_moment: {
    distortion: 4, dominantShape: 'Opposing Reaction', publisherStyle: 'Classic Comics',
    cameraAngle: 'impact_closeup',
    anatomyCompression: { speaker: 1.4, listener: 1.2, torso: 1.0, feet: 0.9 },
    effectsAt: { speedLines: 7, impactBurst: 9, panelBreak: 10 },
  },
  ultimatum_pose: {
    distortion: 2, dominantShape: 'Closed Triangle', publisherStyle: 'Classic Comics',
    cameraAngle: 'hero_low',
    anatomyCompression: { arms: 1.4, chest: 1.2, shoulders: 1.1, feet: 0.9 },
    effectsAt: { speedLines: 7, impactBurst: 10, panelBreak: 10 },
  },
  mentor_guidance: {
    distortion: 2, dominantShape: 'Paired Column', publisherStyle: 'Classic Comics',
    cameraAngle: 'hero_low',
    anatomyCompression: { hand: 1.5, arms: 1.2, torso: 1.0, feet: 0.9 },
    effectsAt: { speedLines: 8, impactBurst: 10, panelBreak: 10 },
  },

  // ── SPEED ──────────────────────────────────────────────────────────────────
  sonic_sprint: {
    distortion: 7, dominantShape: 'Horizontal Arrow', publisherStyle: 'Classic Comics',
    cameraAngle: 'tilted_dutch',
    anatomyCompression: { leadFoot: 2.0, torso: 1.3, rearLeg: 0.6, head: 1.1 },
    effectsAt: { speedLines: 2, impactBurst: 6, panelBreak: 8 },
  },
  afterimage_blur: {
    distortion: 6, dominantShape: 'Ghost Overlap', publisherStyle: 'Classic Comics',
    cameraAngle: 'tilted_dutch',
    anatomyCompression: { leadFigure: 1.4, midFigure: 1.0, trailFigure: 0.6 },
    effectsAt: { speedLines: 2, impactBurst: 7, panelBreak: 9 },
  },
  bullet_dodge: {
    distortion: 8, dominantShape: 'Extreme Lean Arc', publisherStyle: 'Classic Comics',
    cameraAngle: 'hero_low',
    anatomyCompression: { torso: 1.8, leadArm: 1.5, rearLeg: 1.6, head: 1.2 },
    effectsAt: { speedLines: 3, impactBurst: 6, panelBreak: 8 },
  },
  momentum_tackle: {
    distortion: 8, dominantShape: 'Compressed Wedge', publisherStyle: 'Classic Comics',
    cameraAngle: 'low_close',
    anatomyCompression: { shoulder: 2.4, chest: 1.9, head: 1.4, legs: 0.6 },
    effectsAt: { speedLines: 3, impactBurst: 5, panelBreak: 7 },
  },
  vertical_wall_run: {
    distortion: 7, dominantShape: 'Vertical Arrow', publisherStyle: 'Classic Comics',
    cameraAngle: 'fisheye_action',
    anatomyCompression: { leadFoot: 2.0, torso: 1.3, rearLeg: 0.8, arms: 1.2 },
    effectsAt: { speedLines: 3, impactBurst: 6, panelBreak: 8 },
  },
  time_slice: {
    distortion: 5, dominantShape: 'Frozen Diagonal', publisherStyle: 'Classic Comics',
    cameraAngle: 'hero_low',
    anatomyCompression: { leadLeg: 1.8, torso: 1.2, arms: 1.1, rearFoot: 0.7 },
    effectsAt: { speedLines: 8, impactBurst: 10, panelBreak: 10 },
  },
  speed_force_vortex: {
    distortion: 8, dominantShape: 'Spiral Column', publisherStyle: 'Classic Comics',
    cameraAngle: 'overhead_attack',
    anatomyCompression: { aura: 3.0, arms: 1.6, torso: 1.2, feet: 0.8 },
    effectsAt: { speedLines: 2, impactBurst: 5, panelBreak: 7 },
  },
  sprint_attack_combo: {
    distortion: 8, dominantShape: 'L-Transition', publisherStyle: 'Classic Comics',
    cameraAngle: 'tilted_dutch',
    anatomyCompression: { fist: 2.2, forearm: 1.8, torso: 1.2, rearLeg: 0.6 },
    effectsAt: { speedLines: 2, impactBurst: 5, panelBreak: 7 },
  },
};

const DEFAULT_PROFILE: ForeshorteningProfile = {
  distortion: 5, dominantShape: 'Dynamic Silhouette', publisherStyle: 'Classic Comics',
  cameraAngle: 'hero_low',
  anatomyCompression: { torso: 1.0, arms: 1.1, legs: 0.9 },
  effectsAt: { speedLines: 6, impactBurst: 8, panelBreak: 10 },
};

export function getForeshorteningProfile(id: string): ForeshorteningProfile {
  return FORESHORTENING_PROFILES[id] ?? DEFAULT_PROFILE;
}

// ── PanelBreakEngine (ported from Java ComicArtStudioDirector) ───────────────
// Maps to Java: PanelBreakMode · PanelBreakRule · PanelBreakEngine.analyze()

export type PanelBreakMode = 'NONE' | 'MINOR' | 'ACTION' | 'EXTREME' | 'FULL_BLEED';

export interface PanelBreakResult {
  mode:           PanelBreakMode;
  breakDirection: string;
  shatterPanel:   boolean;
  debrisOverflow: boolean;
  energyOverflow: boolean;
  description:    string;
}

const PANEL_BREAK_DESCRIPTIONS: Record<PanelBreakMode, string> = {
  NONE:       'Standard containment — border holds all content inside panel',
  MINOR:      'Slight border bleed — element grazes the panel edge',
  ACTION:     'Panel border breaks forward — debris overflows into gutter',
  EXTREME:    'Energy blows out panel border in radial burst — Kirby style',
  FULL_BLEED: 'Full-page bleed — panel shatters, action is entirely unrestricted',
};

/**
 * Ported from Java PanelBreakEngine.analyze()
 *   - interactionType == "impact"  → ACTION break, forward, debrisOverflow
 *   - category == "BLAST"          → EXTREME break, radial, energyOverflow
 *   - intensity >= 90 (was >=9/10) → FULL_BLEED, shatterPanel
 *   - intensity >= 50              → MINOR bleed when no stronger rule fires
 */
export function getPanelBreakRecommendation(
  category:        string,
  interactionType: string,
  intensity:       number, // 0–100
): PanelBreakResult {
  let mode:           PanelBreakMode = 'NONE';
  let breakDirection  = 'none';
  let shatterPanel    = false;
  let debrisOverflow  = false;
  let energyOverflow  = false;

  if (interactionType === 'impact') {
    mode           = 'ACTION';
    breakDirection = 'forward';
    debrisOverflow = true;
  }

  if (category === 'BLAST') {
    mode           = 'EXTREME';
    energyOverflow = true;
    breakDirection = 'radial';
  }

  if (intensity >= 90) {
    mode         = 'FULL_BLEED';
    shatterPanel = true;
  }

  if (mode === 'NONE' && intensity >= 50) {
    mode           = 'MINOR';
    breakDirection = 'edge';
  }

  return {
    mode, breakDirection, shatterPanel, debrisOverflow, energyOverflow,
    description: PANEL_BREAK_DESCRIPTIONS[mode],
  };
}

// ── CompositionEngine (ported from Java CompositionEngine.buildComposition()) ─
// Java: CompositionDNA fields — compositionType, eyePath, forceGeometry,
//       depthStructure, focalPoint, balanceType, cinematic

export interface CompositionDNA {
  compositionType: string;
  eyePath:         string;
  forceGeometry:   string;
  depthStructure:  string;
  focalPoint:      string;
  balanceType:     string;
  cinematic:       boolean;
}

/**
 * Ported from Java CompositionEngine.buildComposition()
 * Extended beyond the 3 Java cases (force_vs_force / GROUP / BLAST)
 * to cover all 18 categories.
 */
export function getCompositionDNA(
  category:        string,
  interactionType: string,
  leadingMass:     string,
  silhouetteShape: string,
): CompositionDNA {
  let compositionType = 'hero_showcase';
  let forceGeometry   = 'triangle';
  let eyePath         = 'natural_flow';

  // ── Java original rules ─────────────────────────────────────────────────────
  if (interactionType === 'force_vs_force') {
    compositionType = 'collision_x';
    forceGeometry   = 'x_shape';
    eyePath         = 'center_impact';
  }
  if (category === 'TEAM') {
    compositionType = 'wave_charge';
    forceGeometry   = 'wedge';
    eyePath         = 'left_to_right';
  }
  if (category === 'BLAST') {
    compositionType = 'projection';
    forceGeometry   = 'arrow';
    eyePath         = 'energy_direction';
  }

  // ── Extended rules for remaining categories ─────────────────────────────────
  if (interactionType === 'impact' || category === 'IMPACT') {
    compositionType = 'impact_crater';
    forceGeometry   = 'starburst';
    eyePath         = 'center_outward';
  }
  if (category === 'DOMINANCE') {
    compositionType = 'authority_pyramid';
    forceGeometry   = 'triangle';
    eyePath         = 'downward_gaze';
  }
  if (category === 'DIALOGUE') {
    compositionType = 'tension_gap';
    forceGeometry   = 'opposing_verticals';
    eyePath         = 'back_and_forth';
  }
  if (category === 'SPEED') {
    compositionType = 'velocity_trail';
    forceGeometry   = 'horizontal_arrow';
    eyePath         = 'left_to_right';
  }
  if (category === 'AERIAL') {
    compositionType = 'aerial_arc';
    forceGeometry   = 's_curve';
    eyePath         = 'upward_sweep';
  }
  if (category === 'MAGIC') {
    compositionType = 'magical_radial';
    forceGeometry   = 'circle';
    eyePath         = 'center_outward';
  }
  if (category === 'STEALTH') {
    compositionType = 'shadow_geometry';
    forceGeometry   = 'low_diagonal';
    eyePath         = 'bottom_up';
  }
  if (category === 'POWERUP') {
    compositionType = 'energy_accumulation';
    forceGeometry   = 'radial_inward';
    eyePath         = 'center_burst';
  }
  if (category === 'WEAPON') {
    compositionType = 'slash_trajectory';
    forceGeometry   = 'diagonal';
    eyePath         = 'weapon_direction';
  }
  if (category === 'CREATURE') {
    compositionType = 'beast_mass';
    forceGeometry   = 'hunched_diagonal';
    eyePath         = 'downward_attack';
  }
  if (category === 'CINEMATIC') {
    compositionType = 'widescreen_stage';
    forceGeometry   = 'vertical';
    eyePath         = 'z_pattern';
  }

  return {
    compositionType,
    eyePath,
    forceGeometry,
    depthStructure: 'foreground_mid_background',
    focalPoint:     leadingMass || 'chest',
    balanceType:    silhouetteShape,
    cinematic:      true,
  };
}

// ── ActionDictionary + ComicLanguageParser (ported from Java) ─────────────────
// Java: ActionDictionary.actions HashMap + ComicLanguageParser.parseActions()
// Extended from Java's 17 entries to 32 covering all director categories.

export const ACTION_DICTIONARY: Record<string, string> = {
  // Movement — Java spec
  leap:      'power_leap',
  jump:      'power_leap',
  dash:      'sonic_sprint',
  crawl:     'crouched_stalk',
  slam:      'slam_down',
  // Attacks — Java spec
  punch:     'flying_punch',
  kick:      'double_kick',
  blast:     'optic_blast',
  slice:     'sword_draw',
  stab:      'katana_dash',
  // Power — Java spec
  explode:   'point_blank_explosion',
  charge:    'energy_accumulation',
  summon:    'summoning',
  transform: 'mutation_outbreak',
  // Emotions — Java spec
  angry:     'heated_argument',
  fear:      'desperate_plea',
  confident: 'power_stance',
  // Extended mappings
  fly:       'soaring_glide',
  hover:     'apex_hover',
  loom:      'intimidation_loom',
  threaten:  'cold_threat',
  reveal:    'power_reveal',
  crouch:    'alpha_crouch',
  land:      'hero_landing',
  sneak:     'shadow_merge',
  rage:      'berserker_rage',
  roar:      'battle_roar',
  run:       'sonic_sprint',
  sprint:    'sonic_sprint',
  dodge:     'bullet_dodge',
  defend:    'defensive_pose',
  shoot:     'gun_draw',
  aim:       'sniper_aim',
  magic:     'spell_casting',
  meditate:  'floating_meditation',
  scream:    'angry_scream',
  swing:     'axe_swing',
  throw:     'hammer_throw',
};

/** Ported from Java ComicLanguageParser.parseActions() */
export function parseComicActions(text: string): string[] {
  const lower = text.toLowerCase();
  const found: string[] = [];
  for (const [keyword, archetypeId] of Object.entries(ACTION_DICTIONARY)) {
    if (lower.includes(keyword) && !found.includes(archetypeId)) {
      found.push(archetypeId);
    }
  }
  return found;
}

// ── ComicPoseAnalyzer ─────────────────────────────────────────────────────────

export function analyzePose(
  dna: {
    flexibility: number; aggression: number; balance: number; speed: number;
    acrobatics: number; combatStyle: number; silhouetteReadability: number;
  },
  profile: ForeshorteningProfile,
  intensity: number, // 0–100
): PoseAnalysis {
  const i10 = intensity / 10;

  // Action Comics style: raw power, extreme camera, giant limbs, kinetic energy
  const marvelScore = Math.min(100, Math.round(
    (dna.aggression > 7 ? 20 : dna.aggression > 4 ? 10 : 0) +
    (dna.speed > 7 ? 15 : dna.speed > 4 ? 8 : 0) +
    (profile.distortion > 7 ? 25 : profile.distortion > 4 ? 12 : 0) +
    (i10 > 7 ? 20 : i10 > 4 ? 10 : 0) +
    (dna.combatStyle > 7 ? 20 : dna.combatStyle > 4 ? 10 : 0),
  ));

  // Heroic Comics style: balanced composition, clean silhouette, acrobatic grace
  const dcScore = Math.min(100, Math.round(
    (dna.balance > 7 ? 25 : dna.balance > 4 ? 12 : 0) +
    (dna.silhouetteReadability > 7 ? 20 : dna.silhouetteReadability > 4 ? 10 : 0) +
    (dna.flexibility > 6 ? 15 : 0) +
    (dna.acrobatics > 6 ? 15 : 0) +
    (profile.publisherStyle === 'Heroic Comics' ? 25 :
     profile.publisherStyle === 'Classic Comics' ? 10 : 0),
  ));

  // Extreme score: 0–10 based on distortion + intensity + aggression
  const extremeScore = Math.round(
    profile.distortion * 0.4 + i10 * 0.35 + dna.aggression * 0.25,
  );

  // Silhouette clarity: high readability + lower distortion = clearer
  const silhouetteScore = Math.max(1, Math.round(
    dna.silhouetteReadability * 0.7 + (10 - profile.distortion) * 0.3,
  ));

  // AIPoseCorrector recommendations
  const recommendations: string[] = [];
  if (extremeScore < 7)
    recommendations.push('Push nearest limb 30% larger toward camera');
  if (silhouetteScore < 6)
    recommendations.push('Separate limbs from torso silhouette for panel readability');
  if (dna.balance > 7 && dna.aggression > 7)
    recommendations.push('Rotate shoulders and hips opposite directions to break stiff symmetry');
  if (profile.distortion < 5 && i10 > 6)
    recommendations.push('Add stronger S-curve gesture line to match action intensity');

  return { marvelScore, dcScore, extremeScore, silhouetteScore, recommendations };
}

// ── PanelFlowEngine — active effects at intensity threshold ──────────────────

export function getActiveEffects(
  intensity: number, // 0–100
  profile: ForeshorteningProfile,
): string[] {
  const i10 = intensity / 10;
  const fx: string[] = [];
  if (i10 >= profile.effectsAt.speedLines)  fx.push('Speed Lines');
  if (i10 >= profile.effectsAt.impactBurst) fx.push('Impact Burst');
  if (i10 >= profile.effectsAt.panelBreak)  fx.push('Panel Break');
  return fx;
}

// ── PerspectiveCameraEngine ── foreshortening math ───────────────────────────

export function calculateForeshortening(
  depth: number, // 0–10
): { scale: number; compression: number; perspectiveShift: number } {
  const scale = 1 + depth * 0.18;
  return { scale, compression: 1 / scale, perspectiveShift: Math.round(depth * 12) };
}

// ── AI prompt fragment ────────────────────────────────────────────────────────

const CAMERA_LABELS: Record<string, string> = {
  extreme_low:     'extreme low-angle worm-eye view',
  ground_level:    'ground-level camera position',
  low_close:       'low and close worm-eye lens',
  upward_tracking: 'upward tracking shot perspective',
  hero_low:        'heroic low-angle camera',
  tilted_dutch:    'dutch-tilt dynamic angle',
  overhead_attack: 'overhead attack angle looking down',
  fisheye_action:  'fisheye lens wide distortion',
  impact_closeup:  'impact close-up lens compression',
  worm_eye:        'worm-eye view from the ground',
};

export function buildForeshorteningPromptFragment(
  profile: ForeshorteningProfile,
  intensity: number, // 0–100
): string {
  const cam = CAMERA_LABELS[profile.cameraAngle]
    ?? profile.cameraAngle.replace(/_/g, ' ');
  const entries = Object.entries(profile.anatomyCompression);
  const [biggest, bVal] = entries.reduce((a, b) => b[1] > a[1] ? b : a);
  const [smallest, sVal] = entries.reduce((a, b) => b[1] < a[1] ? b : a);
  const i10 = intensity / 10;
  const formatPart = (s: string) =>
    s.replace(/([A-Z])/g, ' $1').toLowerCase().trim();
  return [
    cam,
    `extreme foreshortening distortion ${profile.distortion}/10`,
    `${formatPart(biggest)} enlarged ×${bVal.toFixed(1)} toward camera`,
    smallest !== biggest
      ? `${formatPart(smallest)} compressed ×${sVal.toFixed(1)} receding`
      : null,
    `dominant silhouette ${profile.dominantShape}`,
    `${profile.publisherStyle} house-style anatomy`,
    i10 >= 8 ? 'panel-breaking explosive energy burst' : null,
    i10 >= 6 ? 'speed lines motion blur arcs' : null,
  ].filter(Boolean).join(', ');
}
