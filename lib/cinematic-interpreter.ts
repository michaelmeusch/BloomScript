// ============================================================================
// COMIC ART STUDIO AI
// CINEMATIC DESCRIPTION + DIRECTOR SYSTEM — TypeScript port from Java
// ============================================================================

// ── Detection types ────────────────────────────────────────────────────────────
export type DetectionType =
  | 'CHARACTER' | 'ACTION' | 'CAMERA' | 'LIGHTING'
  | 'ENVIRONMENT' | 'EMOTION' | 'EFFECTS' | 'COMPOSITION'
  | 'MOTION' | 'WEAPON';

export interface DetectionResult {
  type: DetectionType;
  detectedValue: string;
  explanation: string;
  /** maps to a director CameraId when type === 'CAMERA' */
  directorCameraId?: string;
  /** maps to a director archetype category when type === 'ACTION' */
  archetypeCategory?: string;
}

export interface TrainingBubble {
  title: string;
  message: string;
  important: boolean;
}

export interface CameraCard {
  cameraType: string;
  emotion: string;
  explanation: string;
  directorCameraId: string;
}

export interface CinematicInterpretation {
  detections: DetectionResult[];
  bubbles: TrainingBubble[];
  cameraCards: CameraCard[];
}

// ── Detection type display metadata ───────────────────────────────────────────
export const DETECTION_META: Record<DetectionType, { icon: string; color: string; label: string }> = {
  CHARACTER:   { icon: '👤', color: '#FFD600', label: 'CHARACTER'   },
  ACTION:      { icon: '⚡', color: '#FF6A00', label: 'ACTION'      },
  CAMERA:      { icon: '📷', color: '#38BDF8', label: 'CAMERA'      },
  LIGHTING:    { icon: '💡', color: '#FDE68A', label: 'LIGHTING'    },
  ENVIRONMENT: { icon: '🌆', color: '#00E5FF', label: 'ENVIRONMENT' },
  EMOTION:     { icon: '🎭', color: '#A78BFA', label: 'EMOTION'     },
  EFFECTS:     { icon: '✨', color: '#67E8F9', label: 'EFFECTS'     },
  COMPOSITION: { icon: '📐', color: '#22C55E', label: 'COMPOSITION' },
  MOTION:      { icon: '💨', color: '#60A5FA', label: 'MOTION'      },
  WEAPON:      { icon: '⚔️', color: '#E8001C', label: 'WEAPON'      },
};

// ── AICinematicInterpreter.interpretScene() (ported + expanded) ────────────────
export function interpretScene(description: string): CinematicInterpretation {
  const detections: DetectionResult[] = [];
  const bubbles: TrainingBubble[] = [];
  const d = description.toLowerCase();

  // ── CAMERA ──────────────────────────────────────────────────────────────────
  if (d.includes("worm") || d.includes("worm's-eye") || d.includes("worms eye")) {
    detections.push({ type: 'CAMERA', detectedValue: "Worm's Eye View", directorCameraId: 'WORM_EYE_VIEW',
      explanation: "Creates a powerful larger-than-life perspective — Kirby power angle." });
    bubbles.push({ title: "Worm's Eye Camera",
      message: "Worm's-eye shots exaggerate scale and power. Great for heroes, monsters, and dramatic action scenes.", important: false });
  }
  if (d.includes("low-angle") || d.includes("low angle") || d.includes("cinematic low")) {
    detections.push({ type: 'CAMERA', detectedValue: "Cinematic Low Angle", directorCameraId: 'CINEMATIC_LOW_ANGLE',
      explanation: "Makes the subject feel dominant and heroic." });
  }
  if (d.includes("dutch")) {
    detections.push({ type: 'CAMERA', detectedValue: "Dutch Angle", directorCameraId: 'DUTCH_ANGLE',
      explanation: "Adds tension and cinematic instability — Frank Miller signature." });
  }
  if (d.includes("bird") || d.includes("birds eye") || d.includes("bird's eye") || d.includes("top down") || d.includes("overhead")) {
    detections.push({ type: 'CAMERA', detectedValue: "Bird's Eye View", directorCameraId: 'BIRD_EYE_VIEW',
      explanation: "Shows scale, vulnerability, and environmental scope." });
  }
  if (d.includes("close-up") || d.includes("closeup") || d.includes("close up")) {
    detections.push({ type: 'CAMERA', detectedValue: "Close-Up", directorCameraId: 'CLOSE_UP',
      explanation: "Face/expression focus — Neal Adams signature." });
  }
  if (d.includes("extreme close") || d.includes("macro")) {
    detections.push({ type: 'CAMERA', detectedValue: "Extreme Close-Up", directorCameraId: 'EXTREME_CLOSE_UP',
      explanation: "Eyes only — Frank Miller noir technique." });
  }
  if (d.includes("wide shot") || d.includes("wide-shot") || d.includes("establishing")) {
    detections.push({ type: 'CAMERA', detectedValue: "Wide Shot", directorCameraId: 'WIDE_SHOT',
      explanation: "Environment included — Bryan Hitch widescreen." });
  }
  if (d.includes("over shoulder") || d.includes("over-shoulder")) {
    detections.push({ type: 'CAMERA', detectedValue: "Over Shoulder", directorCameraId: 'OVER_SHOULDER',
      explanation: "POV proximity — interrogation / tension." });
  }
  if (d.includes("tracking") || d.includes("following shot") || d.includes("pan shot")) {
    detections.push({ type: 'CAMERA', detectedValue: "Action Tracking", directorCameraId: 'ACTION_TRACKING',
      explanation: "Side-pan motion blur — speed force and sprint." });
  }

  // ── ACTION / POSE ──────────────────────────────────────────────────────────
  if (d.includes("jump") || d.includes("leap") || d.includes("bound") || d.includes("spring")) {
    detections.push({ type: 'ACTION', detectedValue: "Dynamic Leap", archetypeCategory: 'ACROBATICS',
      explanation: "Detected aerial movement action pose." });
    bubbles.push({ title: "Dynamic Motion",
      message: "Diagonal leap poses create stronger visual energy than vertical poses.", important: false });
  }
  if (d.includes("punch") || d.includes("strike") || d.includes("slam") || d.includes("uppercut")) {
    detections.push({ type: 'ACTION', detectedValue: "Punch Attack", archetypeCategory: 'FIGHTING',
      explanation: "Detected impact-focused attack pose." });
    bubbles.push({ title: "Foreshortening Tip",
      message: "Punches feel more powerful when the fist overlaps the foreground camera space.", important: true });
  }
  if (d.includes("run") || d.includes("sprint") || d.includes("charge") || d.includes("dash")) {
    detections.push({ type: 'ACTION', detectedValue: "Speed Run", archetypeCategory: 'SPEED',
      explanation: "Detected high-velocity motion pose." });
  }
  if (d.includes("fly") || d.includes("soar") || d.includes("hover") || d.includes("float")) {
    detections.push({ type: 'ACTION', detectedValue: "Flight Pose", archetypeCategory: 'AERIAL',
      explanation: "Detected aerial suspended motion." });
  }
  if (d.includes("kick") || d.includes("sweep kick") || d.includes("roundhouse")) {
    detections.push({ type: 'ACTION', detectedValue: "Kick Attack", archetypeCategory: 'FIGHTING',
      explanation: "Detected lower-body combat action." });
  }
  if (d.includes("dodge") || d.includes("evade") || d.includes("duck") || d.includes("roll")) {
    detections.push({ type: 'ACTION', detectedValue: "Evasive Move", archetypeCategory: 'ACROBATICS',
      explanation: "Detected defensive agility action." });
  }
  if (d.includes("power up") || d.includes("power-up") || d.includes("charge up") || d.includes("energy surge")) {
    detections.push({ type: 'ACTION', detectedValue: "Power-Up Surge", archetypeCategory: 'POWERUP',
      explanation: "Detected energy accumulation pose." });
  }
  if (d.includes("land") || d.includes("landing") || d.includes("touch down")) {
    detections.push({ type: 'ACTION', detectedValue: "Landing Impact", archetypeCategory: 'IMPACT',
      explanation: "Detected landing impact crater pose." });
  }
  if (d.includes("crouch") || d.includes("lurk") || d.includes("sneak") || d.includes("prowl")) {
    detections.push({ type: 'ACTION', detectedValue: "Stealth Crouch", archetypeCategory: 'STEALTH',
      explanation: "Detected low-profile stealth motion." });
  }
  if (d.includes("blast") || d.includes("beam") || d.includes("fire bolt") || d.includes("energy shot")) {
    detections.push({ type: 'ACTION', detectedValue: "Energy Blast", archetypeCategory: 'BLAST',
      explanation: "Detected projectile energy release pose." });
  }

  // ── LIGHTING ───────────────────────────────────────────────────────────────
  if (d.includes("lightning") || d.includes("glow") || d.includes("energy glow")) {
    detections.push({ type: 'LIGHTING', detectedValue: "Dynamic FX Lighting",
      explanation: "Detected high-contrast cinematic lighting effect." });
  }
  if (d.includes("backlit") || d.includes("rim light") || d.includes("rim lighting")) {
    detections.push({ type: 'LIGHTING', detectedValue: "Rim Lighting",
      explanation: "Edge lighting that silhouettes the character against the background." });
  }
  if (d.includes("neon") || d.includes("city light")) {
    detections.push({ type: 'LIGHTING', detectedValue: "Neon City Lighting",
      explanation: "Cyberpunk neon reflections — warm color contrast." });
  }
  if (d.includes("moonlight") || (d.includes("night") && d.includes("moon"))) {
    detections.push({ type: 'LIGHTING', detectedValue: "Moonlight",
      explanation: "Cool blue-white ambient night lighting." });
  }
  if (d.includes("fire") || d.includes("flames") || d.includes("explosion light")) {
    detections.push({ type: 'LIGHTING', detectedValue: "Fire Lighting",
      explanation: "Warm orange underbelly lighting from fire source below." });
  }
  if (d.includes("sun") || d.includes("sunset") || d.includes("sunrise") || d.includes("golden hour")) {
    detections.push({ type: 'LIGHTING', detectedValue: "Golden Hour",
      explanation: "Warm directional sunlight — Alex Ross painted quality." });
  }
  if (d.includes(" left ") || d.includes("from the left") || d.includes("left side light")) {
    detections.push({ type: 'LIGHTING', detectedValue: "Left Side Lighting",
      explanation: "Primary light source appears from the left." });
  }

  // ── ENVIRONMENT ────────────────────────────────────────────────────────────
  if (d.includes("mountain") || d.includes("peak") || d.includes("summit") || d.includes("cliff")) {
    detections.push({ type: 'ENVIRONMENT', detectedValue: "Mountain Environment",
      explanation: "Detected cinematic mountain background." });
  }
  if (d.includes("city") || d.includes("skyline") || d.includes("skyscraper") || d.includes("urban")) {
    detections.push({ type: 'ENVIRONMENT', detectedValue: "City Environment",
      explanation: "Detected urban cinematic environment." });
  }
  if (d.includes("rooftop") || d.includes("roof top")) {
    detections.push({ type: 'ENVIRONMENT', detectedValue: "Rooftop Scene",
      explanation: "Detected elevated urban action environment." });
  }
  if (d.includes("forest") || d.includes("trees") || d.includes("jungle") || d.includes("woods")) {
    detections.push({ type: 'ENVIRONMENT', detectedValue: "Forest Environment",
      explanation: "Detected natural forest environment." });
  }
  if (d.includes("space") || d.includes("stars") || d.includes("galaxy") || d.includes("cosmic")) {
    detections.push({ type: 'ENVIRONMENT', detectedValue: "Space Environment",
      explanation: "Detected deep space or cosmic scene." });
  }
  if (d.includes("temple") || d.includes("ruin") || d.includes("ancient") || d.includes("monument")) {
    detections.push({ type: 'ENVIRONMENT', detectedValue: "Temple/Ancient Ruins",
      explanation: "Detected ancient or mythological environment." });
  }
  if (d.includes("snow") || d.includes("arctic") || d.includes("tundra") || d.includes("frozen")) {
    detections.push({ type: 'ENVIRONMENT', detectedValue: "Snow Environment",
      explanation: "Cold isolation — reduced visibility, stark lighting." });
  }
  if (d.includes("rain") || d.includes("storm") || d.includes("thunder") || d.includes("wet street")) {
    detections.push({ type: 'ENVIRONMENT', detectedValue: "Rainstorm",
      explanation: "Rain adds drama — wet reflections, atmospheric depth." });
  }
  if (d.includes("underwater") || d.includes("ocean") || d.includes("sea") || d.includes("deep water")) {
    detections.push({ type: 'ENVIRONMENT', detectedValue: "Underwater Scene",
      explanation: "Subaquatic lighting — caustic patterns, blue depth." });
  }

  // ── WEAPON ─────────────────────────────────────────────────────────────────
  if (d.includes("staff") || d.includes("scepter") || d.includes("wand") || d.includes("pole")) {
    detections.push({ type: 'WEAPON', detectedValue: "Staff Weapon",
      explanation: "Detected long-range melee weapon." });
  }
  if (d.includes("sword") || d.includes("blade") || d.includes("katana") || d.includes("saber")) {
    detections.push({ type: 'WEAPON', detectedValue: "Sword Weapon",
      explanation: "Detected bladed melee weapon." });
  }
  if (d.includes("gun") || d.includes("rifle") || d.includes("pistol") || d.includes("firearm")) {
    detections.push({ type: 'WEAPON', detectedValue: "Firearm",
      explanation: "Detected ranged weapon — blast trajectory forward." });
  }
  if (d.includes("hammer") || d.includes("mallet") || d.includes("mjolnir")) {
    detections.push({ type: 'WEAPON', detectedValue: "Hammer Weapon",
      explanation: "Detected heavy impact weapon — Kirby/Thor energy." });
  }
  if (d.includes("bow") || d.includes("arrow") || d.includes("quiver")) {
    detections.push({ type: 'WEAPON', detectedValue: "Bow & Arrow",
      explanation: "Detected precision ranged weapon — line of action through arm." });
  }
  if (d.includes("shield") || d.includes("buckler")) {
    detections.push({ type: 'WEAPON', detectedValue: "Shield",
      explanation: "Detected defensive weapon — framing element." });
  }
  if (d.includes("spear") || d.includes("lance") || d.includes("trident")) {
    detections.push({ type: 'WEAPON', detectedValue: "Spear/Lance",
      explanation: "Detected long-thrust weapon — diagonal line of action." });
  }

  // ── CHARACTER ──────────────────────────────────────────────────────────────
  if (d.includes("scar")) {
    detections.push({ type: 'CHARACTER', detectedValue: "Facial Scar",
      explanation: "Detected facial storytelling detail — battle history." });
  }
  if (d.includes("beard") || d.includes("stubble") || d.includes("goatee")) {
    detections.push({ type: 'CHARACTER', detectedValue: "Facial Hair",
      explanation: "Detected facial hair attribute." });
  }
  if (d.includes("cape") || d.includes("cloak") || d.includes("mantle")) {
    detections.push({ type: 'CHARACTER', detectedValue: "Cape/Cloak",
      explanation: "Detected flowing fabric — dynamic motion indicator." });
    bubbles.push({ title: "Cape Dynamics",
      message: "A flowing cape extends the line of action and adds kinetic energy to any pose.", important: false });
  }
  if (d.includes("armor") || d.includes("armored") || d.includes("plate mail")) {
    detections.push({ type: 'CHARACTER', detectedValue: "Armored Character",
      explanation: "Detected heavy armor — silhouette mass priority." });
  }
  if (d.includes("mask") || d.includes("helmet") || d.includes("cowl")) {
    detections.push({ type: 'CHARACTER', detectedValue: "Masked/Helmeted",
      explanation: "Detected face covering — mysterious identity element." });
  }
  if (d.includes("wing") || d.includes("wings") || d.includes("feathered")) {
    detections.push({ type: 'CHARACTER', detectedValue: "Winged Character",
      explanation: "Detected wings — aerial silhouette extension." });
  }

  // ── EMOTION ────────────────────────────────────────────────────────────────
  if (d.includes("angry") || d.includes("rage") || d.includes("furious") || d.includes("wrath")) {
    detections.push({ type: 'EMOTION', detectedValue: "Rage",
      explanation: "Emotional intensity — explosive energy posture." });
  }
  if (d.includes("fear") || d.includes("terrified") || d.includes("horror") || d.includes("scared")) {
    detections.push({ type: 'EMOTION', detectedValue: "Fear",
      explanation: "Defensive collapse posture — weight falls back." });
  }
  if (d.includes("determined") || d.includes("resolve") || d.includes("focused") || d.includes("grit")) {
    detections.push({ type: 'EMOTION', detectedValue: "Determination",
      explanation: "Forward lean, jaw set — S-curve of resolve." });
  }
  if (d.includes("confident") || d.includes("proud") || d.includes("triumphant")) {
    detections.push({ type: 'EMOTION', detectedValue: "Confidence",
      explanation: "Chest leads, stable vertical — Alex Ross heroic archetype." });
  }
  if (d.includes("grief") || d.includes("mourning") || d.includes("sad") || d.includes("sorrow")) {
    detections.push({ type: 'EMOTION', detectedValue: "Grief/Sorrow",
      explanation: "Weight collapse inward — C-curve of emotional defeat." });
  }

  // ── EFFECTS ────────────────────────────────────────────────────────────────
  if (d.includes("explosion") || d.includes("detonation") || d.includes("blast radius")) {
    detections.push({ type: 'EFFECTS', detectedValue: "Explosion FX",
      explanation: "Radial debris, shockwave rings, heat distortion." });
  }
  if (d.includes("speed line") || d.includes("motion blur") || d.includes("afterimage")) {
    detections.push({ type: 'EFFECTS', detectedValue: "Speed Lines",
      explanation: "Velocity distortion — manga speed force aesthetic." });
  }
  if (d.includes("smoke") || d.includes("debris") || d.includes("dust cloud")) {
    detections.push({ type: 'EFFECTS', detectedValue: "Smoke/Debris",
      explanation: "Environmental scatter from impact or movement." });
  }

  // ── MOTION ─────────────────────────────────────────────────────────────────
  if (d.includes("toward") || d.includes("towards") || d.includes("at the viewer") || d.includes("at viewer")) {
    detections.push({ type: 'MOTION', detectedValue: "Toward Camera",
      explanation: "Foreshortening toward viewer — maximum impact." });
    bubbles.push({ title: "Foreshortening Power",
      message: "Poses aimed directly at the viewer use foreshortening to compress limbs and maximize visual impact.", important: true });
  }
  if (d.includes("left to right") || d.includes("running right") || d.includes("moving right")) {
    detections.push({ type: 'MOTION', detectedValue: "Left-to-Right Motion",
      explanation: "Western reading direction — feels like forward progress." });
  }
  if (d.includes("falling") || d.includes("plummet") || d.includes("diving down")) {
    detections.push({ type: 'MOTION', detectedValue: "Downward Fall",
      explanation: "Gravity-driven vertical descent — weight accumulation." });
  }

  // ── TRAINING BUBBLES — missing elements ─────────────────────────────────────
  const hasCamera = detections.some(d => d.type === 'CAMERA');
  const hasEnv    = detections.some(d => d.type === 'ENVIRONMENT');
  const hasAction = detections.some(d => d.type === 'ACTION');
  const hasEmotion = detections.some(d => d.type === 'EMOTION');

  if (!hasCamera) {
    bubbles.push({ title: "Add Camera Language",
      message: "Try cinematic terms like low-angle, close-up, worm's-eye, or wide shot to improve visual storytelling.", important: false });
  }
  if (!hasEnv) {
    bubbles.push({ title: "Add Environment Depth",
      message: "Background environments increase immersion. Try: city, rooftop, mountain, temple, space.", important: false });
  }
  if (!hasAction) {
    bubbles.push({ title: "Add More Motion",
      message: "Action words like leap, charge, dodge, or blast create stronger comic energy.", important: false });
  }
  if (!hasEmotion && detections.length > 2) {
    bubbles.push({ title: "Add Emotional Tone",
      message: "Emotional keywords like determined, rage, or triumphant guide the character's body language.", important: false });
  }

  // ── CameraRecommendationEngine.recommend() (ported + expanded) ──────────────
  const cameraCards = recommendCameras(d);

  return { detections, bubbles, cameraCards };
}

// ── CameraRecommendationEngine ─────────────────────────────────────────────────
export function recommendCameras(description: string): CameraCard[] {
  const cards: CameraCard[] = [];
  const d = description.toLowerCase();

  if (d.includes("jump") || d.includes("leap") || d.includes("fly") || d.includes("soar")) {
    cards.push({ cameraType: "Worm's Eye View", emotion: "Epic / Powerful",
      explanation: "Makes aerial action feel massive and cinematic.", directorCameraId: 'WORM_EYE_VIEW' });
    cards.push({ cameraType: "Dutch Angle", emotion: "Chaotic / Intense",
      explanation: "Adds energy and instability to action scenes.", directorCameraId: 'DUTCH_ANGLE' });
  }
  if (d.includes("team") || d.includes("squad") || d.includes("group") || d.includes("formation")) {
    cards.push({ cameraType: "Cinematic Wide", emotion: "Heroic Team Energy",
      explanation: "Perfect for team formations and large environments.", directorCameraId: 'WIDE_SHOT' });
  }
  if (d.includes("punch") || d.includes("strike") || d.includes("slam") || d.includes("impact")) {
    cards.push({ cameraType: "Close-Up", emotion: "Aggressive Impact",
      explanation: "Close-up shots exaggerate combat intensity.", directorCameraId: 'CLOSE_UP' });
  }
  if (d.includes("run") || d.includes("sprint") || d.includes("chase") || d.includes("dash")) {
    cards.push({ cameraType: "Action Tracking", emotion: "Speed / Momentum",
      explanation: "Side-pan tracking shot follows the motion blur energy.", directorCameraId: 'ACTION_TRACKING' });
  }
  if (d.includes("hero") || d.includes("stand") || d.includes("reveal") || d.includes("tower")) {
    cards.push({ cameraType: "Cinematic Low Angle", emotion: "Dominant / Heroic",
      explanation: "Low + dramatic — Hitch Ultimates hero reveal.", directorCameraId: 'CINEMATIC_LOW_ANGLE' });
  }
  if (d.includes("face") || d.includes("expression") || d.includes("eye") || d.includes("emotion")) {
    cards.push({ cameraType: "Extreme Close-Up", emotion: "Intense / Intimate",
      explanation: "Eyes only — Frank Miller noir emotional reveal.", directorCameraId: 'EXTREME_CLOSE_UP' });
  }
  if (d.includes("city") || d.includes("environment") || d.includes("establishing") || d.includes("scene setting")) {
    cards.push({ cameraType: "Establishing Shot", emotion: "World-Building",
      explanation: "Full environment establishes scale and world.", directorCameraId: 'ESTABLISHING_SHOT' });
  }
  if (d.includes("villain") || d.includes("boss") || d.includes("monster") || d.includes("giant")) {
    cards.push({ cameraType: "Worm's Eye View", emotion: "Dread / Imposing",
      explanation: "Looming villain from below — maximum intimidation.", directorCameraId: 'WORM_EYE_VIEW' });
  }

  // Default if no camera detected — suggest worm's eye as universal power shot
  if (cards.length === 0) {
    cards.push({ cameraType: "Worm's Eye View", emotion: "Power",
      explanation: "A universal upgrade for any hero pose.", directorCameraId: 'WORM_EYE_VIEW' });
    cards.push({ cameraType: "Cinematic Low Angle", emotion: "Heroic",
      explanation: "Cinematic low angle works for most action scenes.", directorCameraId: 'CINEMATIC_LOW_ANGLE' });
  }

  // Deduplicate by directorCameraId
  const seen = new Set<string>();
  return cards.filter(c => {
    if (seen.has(c.directorCameraId)) return false;
    seen.add(c.directorCameraId);
    return true;
  }).slice(0, 4);
}

// ── Prompt fragment from scene description ─────────────────────────────────────
export function buildCinematicDescriptionFragment(
  rawDescription: string,
  detections: DetectionResult[],
): string {
  if (!rawDescription.trim()) return '';
  const detected = detections.map(d => d.detectedValue).join(', ');
  return `Scene: ${rawDescription.trim()}${detected ? ` [Detected: ${detected}]` : ''}.`;
}
