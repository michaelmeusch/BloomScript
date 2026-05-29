// ── CINEMATIC COMPOSITION ENGINE ─────────────────────────────────────────────
// AI Comic Art Studio — Visual Storytelling + Comic Directing System
// Powers: Character Builder PANEL tab + AI Prompt Expansion

export interface CinematicCompositionScene {
  panelLayout?:     'standardGrid' | 'diagonalPanels' | 'verticalPanels' | 'widescreenPanels' | 'splashPages';
  cameraAngle?:     'lowAngle' | 'birdsEyeView' | 'dutchAngle' | 'extremeCloseUp' | 'overShoulder';
  emotionalPacing?: 'calmMoments' | 'tensionBuild' | 'emotionalImpact' | 'explosiveMoments';
  pacingStyle?:     'slowBurn' | 'actionRush' | 'emotionalFocus';
  cinematicShot?:   'heroicReveal' | 'rooftopSilhouette' | 'finalBattleWideShot' | 'emotionalCloseUp' | 'intimidationFrame' | 'rainDuelShot';
  panelTransition?: 'actionToAction' | 'subjectToSubject' | 'sceneToScene' | 'emotionalTransition';
  splashPage?:      boolean;
  splashTrigger?:   string;
}

// ── Panel Layouts ─────────────────────────────────────────────────────────────

export const CC_PANEL_LAYOUTS: Record<'standardGrid' | 'diagonalPanels' | 'verticalPanels' | 'widescreenPanels' | 'splashPages', string[]> = {
  standardGrid:    ['dialogue scenes', 'story exposition', 'calm pacing', 'character interaction'],
  diagonalPanels:  ['combat intensity', 'chaos', 'high-speed action', 'explosive sequences'],
  verticalPanels:  ['towering environments', 'falling motion', 'vertical movement', 'large-scale characters'],
  widescreenPanels:['cinematic reveals', 'landscape shots', 'battlefields', 'city destruction'],
  splashPages:     ['major reveals', 'transformations', 'epic battles', 'legendary moments'],
};

export const CC_PANEL_LABELS: Record<'standardGrid' | 'diagonalPanels' | 'verticalPanels' | 'widescreenPanels' | 'splashPages', string> = {
  standardGrid:    'STANDARD GRID',
  diagonalPanels:  'DIAGONAL',
  verticalPanels:  'VERTICAL',
  widescreenPanels:'WIDESCREEN',
  splashPages:     'SPLASH PAGE',
};

export const CC_PANEL_COLORS: Record<'standardGrid' | 'diagonalPanels' | 'verticalPanels' | 'widescreenPanels' | 'splashPages', string> = {
  standardGrid:    '#6B6560',
  diagonalPanels:  '#E8001C',
  verticalPanels:  '#A78BFA',
  widescreenPanels:'#FFD600',
  splashPages:     '#F97316',
};

// ── Camera Language ───────────────────────────────────────────────────────────

export const CC_CAMERA_MEANINGS: Record<'lowAngle' | 'birdsEyeView' | 'dutchAngle' | 'extremeCloseUp' | 'overShoulder', string[]> = {
  lowAngle:       ['power', 'heroism', 'intimidation', 'dominance'],
  birdsEyeView:   ['vulnerability', 'scale', 'chaos', 'strategy perspective'],
  dutchAngle:     ['tension', 'fear', 'instability', 'psychological imbalance'],
  extremeCloseUp: ['emotion', 'rage', 'realization', 'dramatic intensity'],
  overShoulder:   ['conversation framing', 'confrontation', 'perspective immersion'],
};

export const CC_CAMERA_LABELS: Record<'lowAngle' | 'birdsEyeView' | 'dutchAngle' | 'extremeCloseUp' | 'overShoulder', string> = {
  lowAngle:       'LOW ANGLE',
  birdsEyeView:   "BIRD'S EYE",
  dutchAngle:     'DUTCH ANGLE',
  extremeCloseUp: 'EXTREME CU',
  overShoulder:   'OVER SHOULDER',
};

export const CC_CAMERA_COLORS: Record<'lowAngle' | 'birdsEyeView' | 'dutchAngle' | 'extremeCloseUp' | 'overShoulder', string> = {
  lowAngle:       '#FFD600',
  birdsEyeView:   '#22C55E',
  dutchAngle:     '#F97316',
  extremeCloseUp: '#E8001C',
  overShoulder:   '#A78BFA',
};

// ── Action Flow ───────────────────────────────────────────────────────────────

export const CC_MOTION_RULES: string[] = [
  'left-to-right motion flow', 'clear impact direction', 'visual momentum continuity',
  'clean silhouette readability', 'panel-to-panel movement consistency',
];

export const CC_COMBAT_FLOW: string[] = [
  'anticipation pose', 'strike motion', 'impact frame', 'recovery pose', 'counter movement',
];

// ── Emotional Pacing ──────────────────────────────────────────────────────────

export const CC_EMOTIONAL_PACING: Record<'calmMoments' | 'tensionBuild' | 'emotionalImpact' | 'explosiveMoments', string[]> = {
  calmMoments:     ['wide breathing space', 'soft lighting', 'minimal panel density', 'quiet composition'],
  tensionBuild:    ['tight framing', 'heavy shadows', 'slower pacing', 'compressed composition'],
  emotionalImpact: ['silent panels', 'negative space', 'close-up emotion', 'cinematic pause'],
  explosiveMoments:['panel breakage', 'dynamic angles', 'debris overlap', 'energy distortion'],
};

export const CC_PACING_LABELS: Record<'calmMoments' | 'tensionBuild' | 'emotionalImpact' | 'explosiveMoments', string> = {
  calmMoments:     'CALM',
  tensionBuild:    'TENSION',
  emotionalImpact: 'EMOTIONAL',
  explosiveMoments:'EXPLOSIVE',
};

export const CC_PACING_COLORS: Record<'calmMoments' | 'tensionBuild' | 'emotionalImpact' | 'explosiveMoments', string> = {
  calmMoments:     '#22C55E',
  tensionBuild:    '#F97316',
  emotionalImpact: '#A78BFA',
  explosiveMoments:'#E8001C',
};

// ── Visual Rhythm ─────────────────────────────────────────────────────────────

export const CC_VISUAL_RHYTHM: Record<'slowBurn' | 'actionRush' | 'emotionalFocus', string[]> = {
  slowBurn:      ['larger panels', 'quiet spacing', 'cinematic atmosphere'],
  actionRush:    ['rapid panel cuts', 'dynamic overlap', 'visual intensity'],
  emotionalFocus:['close-up emphasis', 'minimal background distraction', 'slow pacing'],
};

export const CC_RHYTHM_LABELS: Record<'slowBurn' | 'actionRush' | 'emotionalFocus', string> = {
  slowBurn:      'SLOW BURN',
  actionRush:    'ACTION RUSH',
  emotionalFocus:'EMOTIONAL FOCUS',
};

export const CC_RHYTHM_COLORS: Record<'slowBurn' | 'actionRush' | 'emotionalFocus', string> = {
  slowBurn:      '#6B6560',
  actionRush:    '#E8001C',
  emotionalFocus:'#A78BFA',
};

// ── Cinematic Shot Database ───────────────────────────────────────────────────

export const CC_CINEMATIC_SHOTS: Record<'heroicReveal' | 'rooftopSilhouette' | 'finalBattleWideShot' | 'emotionalCloseUp' | 'intimidationFrame' | 'rainDuelShot', string[]> = {
  heroicReveal:        ['low-angle framing', 'cape motion', 'rim lighting', 'heroic silhouette'],
  rooftopSilhouette:   ['moonlit skyline', 'heavy shadows', 'cinematic fog', 'dramatic posture'],
  finalBattleWideShot: ['destroyed battlefield', 'epic scale', 'energy storms', 'widescreen composition'],
  emotionalCloseUp:    ['tight framing', 'eye detail', 'soft shadows', 'emotional lighting'],
  intimidationFrame:   ['towering perspective', 'shadow dominance', 'cold lighting', 'minimal motion'],
  rainDuelShot:        ['rain atmosphere', 'wet reflections', 'katana stance', 'dramatic tension'],
};

export const CC_SHOT_LABELS: Record<'heroicReveal' | 'rooftopSilhouette' | 'finalBattleWideShot' | 'emotionalCloseUp' | 'intimidationFrame' | 'rainDuelShot', string> = {
  heroicReveal:        'HEROIC REVEAL',
  rooftopSilhouette:   'ROOFTOP SILHOUETTE',
  finalBattleWideShot: 'FINAL BATTLE WIDE',
  emotionalCloseUp:    'EMOTIONAL CLOSE-UP',
  intimidationFrame:   'INTIMIDATION FRAME',
  rainDuelShot:        'RAIN DUEL SHOT',
};

export const CC_SHOT_COLORS: Record<'heroicReveal' | 'rooftopSilhouette' | 'finalBattleWideShot' | 'emotionalCloseUp' | 'intimidationFrame' | 'rainDuelShot', string> = {
  heroicReveal:        '#FFD600',
  rooftopSilhouette:   '#6B6560',
  finalBattleWideShot: '#E8001C',
  emotionalCloseUp:    '#A78BFA',
  intimidationFrame:   '#F97316',
  rainDuelShot:        '#22C55E',
};

// ── Panel Transitions ─────────────────────────────────────────────────────────

export const CC_PANEL_TRANSITIONS: Record<'actionToAction' | 'subjectToSubject' | 'sceneToScene' | 'emotionalTransition', string[]> = {
  actionToAction:    ['combat continuation', 'movement progression', 'impact sequence'],
  subjectToSubject:  ['conversation flow', 'reaction shots', 'perspective exchange'],
  sceneToScene:      ['time transition', 'location shift', 'story progression'],
  emotionalTransition:['mood shift', 'psychological tension', 'dramatic escalation'],
};

export const CC_TRANSITION_LABELS: Record<'actionToAction' | 'subjectToSubject' | 'sceneToScene' | 'emotionalTransition', string> = {
  actionToAction:    'ACTION → ACTION',
  subjectToSubject:  'SUBJECT → SUBJECT',
  sceneToScene:      'SCENE → SCENE',
  emotionalTransition:'EMOTIONAL',
};

// ── Splash Page ───────────────────────────────────────────────────────────────

export const CC_SPLASH_TRIGGERS: string[] = [
  'first villain reveal', 'hero transformation', 'city destruction',
  'cosmic arrival', 'final attack', 'legendary entrance', 'massive emotional reveal',
];

export const CC_SPLASH_VISUAL_RULES: string[] = [
  'maximum visual hierarchy', 'large-scale composition', 'cinematic lighting',
  'high-detail rendering', 'epic perspective',
];

// ── Page Hierarchy ────────────────────────────────────────────────────────────

export const CC_DOMINANCE_TOOLS: string[] = [
  'larger scale', 'strong contrast', 'foreground placement', 'dramatic lighting', 'center composition',
];

export const CC_EYE_GUIDANCE: string[] = [
  'lighting direction', 'motion flow', 'speech bubble alignment', 'leading lines', 'visual contrast',
];

// ── Storytelling AI suggestions ───────────────────────────────────────────────

export const CC_STORYTELLING_SUGGESTIONS: string[] = [
  'dynamic panel composition', 'emotional pacing optimization', 'cinematic camera framing',
  'hero/villain visual hierarchy', 'comic storytelling rhythm',
  'dramatic splash page potential', 'action readability enhancement', 'environmental storytelling',
];

export const CC_VISUAL_DIRECTION: string[] = [
  'heavy cinematic shadows', 'strong contrast hierarchy', 'dynamic action readability',
  'environment-reactive lighting', 'stylized comic impact FX',
];

// ── Prompt Builder ────────────────────────────────────────────────────────────

export function buildCinematicCompositionPrompt(scene: CinematicCompositionScene): string {
  const parts: string[] = [];

  if (scene.panelLayout) {
    const purpose = CC_PANEL_LAYOUTS[scene.panelLayout];
    parts.push(`Panel layout: ${CC_PANEL_LABELS[scene.panelLayout].toLowerCase()} — ${purpose.join(', ')}.`);
  }

  if (scene.cameraAngle) {
    const meanings = CC_CAMERA_MEANINGS[scene.cameraAngle];
    parts.push(`Camera: ${CC_CAMERA_LABELS[scene.cameraAngle].toLowerCase()} — ${meanings.join(', ')}.`);
  }

  if (scene.emotionalPacing) {
    const traits = CC_EMOTIONAL_PACING[scene.emotionalPacing];
    parts.push(`Pacing: ${traits.join(', ')}.`);
  }

  if (scene.pacingStyle) {
    const traits = CC_VISUAL_RHYTHM[scene.pacingStyle];
    parts.push(`Visual rhythm: ${CC_RHYTHM_LABELS[scene.pacingStyle].toLowerCase()} — ${traits.join(', ')}.`);
  }

  if (scene.cinematicShot) {
    const elements = CC_CINEMATIC_SHOTS[scene.cinematicShot];
    parts.push(`Cinematic shot: ${CC_SHOT_LABELS[scene.cinematicShot].toLowerCase()} — ${elements.join(', ')}.`);
  }

  if (scene.panelTransition) {
    const traits = CC_PANEL_TRANSITIONS[scene.panelTransition];
    parts.push(`Panel transition: ${traits.join(', ')}.`);
  }

  if (scene.splashPage) {
    parts.push(`Full splash page composition. ${CC_SPLASH_VISUAL_RULES.join(', ')}.`);
    if (scene.splashTrigger) parts.push(`Splash trigger: ${scene.splashTrigger}.`);
  }

  parts.push(CC_VISUAL_DIRECTION.join(', ') + '.');
  return parts.join(' ');
}
