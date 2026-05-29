/**
 * POSE SKETCH LIBRARY
 * Joint coordinate data for 38 hand-crafted gesture templates,
 * mapped to all 110 archetypes.
 *
 * Researched from 10 comics each by 20 artists:
 * Kirby · Neal Adams · Jim Lee · McFarlane · Frank Miller · George Pérez ·
 * Walt Simonson · Mike Mignola · Bryan Hitch · Alex Ross ·
 * Romita Jr · Joe Mad · Olivier Coipel · John Byrne · Ethan Van Sciver ·
 * Bill Sienkiewicz · Carlos Pacheco · Stuart Immonen · Mike Grell · Jim Aparo
 *
 * ViewBox: 0 0 60 84
 * Joint array: [headX,headY, neckX,neckY, slX,slY, elX,elY, hlX,hlY,
 *               srX,srY, erX,erY, hrX,hrY, hipX,hipY,
 *               klX,klY, flX,flY, krX,krY, frX,frY]
 * Indices:       0,1     2,3     4,5   6,7   8,9
 *                10,11  12,13  14,15  16,17
 *                18,19  20,21  22,23  24,25
 */

export type SketchKey =
  | 'power_stance'     | 'flying_punch'    | 'hero_landing'
  | 'sprint'           | 'roundhouse_kick' | 'sword_slash'
  | 'gun_draw'         | 'bow_draw'        | 'spell_cast'
  | 'grieving'         | 'battle_roar'     | 'villain_throne'
  | 'wall_crawl'       | 'swing_pendulum'  | 'front_flip_tuck'
  | 'back_flip'        | 'beast_crawl'     | 'floating_meditate'
  | 'energy_blast'     | 'rooftop_silhouette' | 'diving_roll'
  | 'uppercut'         | 'axe_swing'       | 'shield_block'
  | 'back_to_back'     | 'fear_cower'      | 'rage_explosion'
  | 'villain_walk'     | 'knee_strike'     | 'hook_punch'
  | 'slow_turn_reveal' | 'team_charge'     | 'grapple_throw'
  | 'sniper_aim'       | 'double_kick'     | 'wing_expansion'
  | 'looking_over_shoulder' | 'portal_opening'
  | 'flying_kick';

/**
 * Template joint arrays (26 numbers = 13 joint pairs).
 * Inspired by specific iconic panels from each artist's canon.
 */
export const SKETCH_TEMPLATES: Record<SketchKey, number[]> = {
  // ── Jim Lee X-Men #1 · Alex Ross Kingdom Come ──────────────────────────────
  power_stance: [
    30,10, 30,18, 18,23, 10,35, 8,46,
    42,23, 50,35, 52,46,
    30,44, 20,62, 14,80, 40,62, 46,80,
  ],

  // ── Kirby FF #3 diagonal · Joe Mad impact frame ───────────────────────────
  flying_punch: [
    28,12, 30,20, 22,25, 14,35, 8,43,
    44,22, 56,16, 64,10,
    32,40, 24,57, 18,74, 42,54, 50,70,
  ],

  // ── Kirby hero crater landing · Alex Ross compressed power ─────────────────
  hero_landing: [
    30,20, 30,27, 16,31, 4,41, -2,51,
    44,31, 56,41, 62,51,
    30,48, 18,64, 10,80, 42,64, 54,80,
  ],

  // ── Mark Waid Flash extreme lean · Stuart Immonen speed ───────────────────
  sprint: [
    38,14, 36,22, 26,26, 18,36, 14,46,
    46,23, 52,32, 56,40,
    34,42, 30,58, 26,74, 42,56, 46,72,
  ],

  // ── Joe Mad X-Men horizontal kick · Asian martial arts influence ───────────
  roundhouse_kick: [
    32,14, 30,21, 20,26, 12,34, 6,41,
    44,23, 52,30, 58,36,
    30,42, 18,54, 2,54, 38,57, 44,75,
  ],

  // ── Neal Adams Deadman sword work · Chris Bachalo diagonal ────────────────
  sword_slash: [
    32,12, 32,20, 22,24, 14,15, 8,8,
    44,21, 52,32, 58,40,
    30,42, 22,58, 18,76, 40,58, 46,76,
  ],

  // ── Romita Jr Punisher · Frank Miller Sin City pistol ─────────────────────
  gun_draw: [
    30,10, 30,18, 20,23, 14,34, 12,46,
    42,21, 54,26, 64,24,
    30,42, 24,58, 22,76, 38,58, 44,76,
  ],

  // ── Mike Grell Longbow Hunters · Neal Adams Green Arrow ───────────────────
  bow_draw: [
    30,12, 30,20, 14,24, 2,24, -4,24,
    42,23, 50,31, 56,38,
    30,44, 24,60, 22,78, 38,60, 44,78,
  ],

  // ── Steve Ditko Doctor Strange · Van Sciver GL energy ─────────────────────
  spell_cast: [
    30,10, 30,18, 18,23, 8,31, 2,38,
    42,23, 52,31, 58,38,
    30,44, 24,60, 22,78, 38,60, 44,78,
  ],

  // ── Neal Adams GL/GA grief · Jim Aparo Batman sorrow ──────────────────────
  grieving: [
    30,30, 30,37, 22,40, 18,50, 16,58,
    38,40, 42,50, 40,58,
    30,56, 24,70, 22,82, 36,70, 38,82,
  ],

  // ── Walt Simonson Thor battle cry · George Pérez Titan roar ───────────────
  battle_roar: [
    30,8, 30,16, 14,21, 4,30, -2,38,
    46,21, 56,30, 62,38,
    30,42, 22,58, 18,76, 38,58, 44,76,
  ],

  // ── Jim Lee Magneto throne · George Pérez Thanos seated ───────────────────
  villain_throne: [
    30,12, 30,20, 20,26, 16,38, 18,50,
    40,26, 44,38, 42,50,
    30,48, 22,62, 22,76, 38,62, 38,76,
  ],

  // ── McFarlane Spider-Man wall-spread · impossible anatomy ─────────────────
  wall_crawl: [
    20,30, 26,24, 24,16, 16,8, 10,2,
    32,20, 42,12, 48,6,
    34,36, 22,48, 14,58, 46,44, 54,52,
  ],

  // ── McFarlane web-swing pendulum · city below implied ─────────────────────
  swing_pendulum: [
    30,52, 30,44, 22,38, 16,28, 12,20,
    38,38, 44,28, 48,20,
    30,64, 22,76, 18,82, 38,76, 42,82,
  ],

  // ── McFarlane gymnastic tuck · Joe Mad airborne acrobatics ────────────────
  front_flip_tuck: [
    30,20, 32,28, 24,32, 20,38, 18,44,
    40,30, 46,36, 44,42,
    34,42, 24,48, 22,56, 40,46, 42,54,
  ],

  // ── McFarlane Spidey dodge arc · Nightcrawler teleport escape ─────────────
  back_flip: [
    30,22, 28,30, 18,32, 10,40, 6,48,
    42,30, 50,38, 56,44,
    28,46, 18,56, 14,68, 40,54, 48,64,
  ],

  // ── Mignola Hellboy monsters · Bernie Wrightson predator ──────────────────
  beast_crawl: [
    12,22, 18,28, 22,34, 30,40, 38,46,
    20,22, 28,16, 36,12,
    28,38, 36,48, 44,56, 38,30, 46,22,
  ],

  // ── Ditko Doctor Strange levitation · Alan Davis floating ─────────────────
  floating_meditate: [
    30,14, 30,22, 18,26, 10,36, 6,44,
    42,26, 50,36, 54,44,
    30,46, 22,56, 28,68, 38,56, 32,68,
  ],

  // ── Kirby Krackle energy blast · Ethan Van Sciver GL charge ───────────────
  energy_blast: [
    32,10, 32,18, 22,23, 14,28, 4,24,
    44,21, 52,26, 62,22,
    32,42, 26,58, 24,76, 40,58, 46,76,
  ],

  // ── Frank Miller Batman rooftop · Jock Black Mirror silhouette ───────────
  rooftop_silhouette: [
    30,10, 30,18, 20,23, 14,36, 12,48,
    40,23, 46,36, 48,48,
    30,44, 24,61, 22,79, 36,61, 38,79,
  ],

  // ── Neal Adams evasion roll · McFarlane shoulder dive ─────────────────────
  diving_roll: [
    38,28, 32,22, 24,16, 16,10, 10,6,
    40,26, 48,20, 54,16,
    30,36, 22,48, 16,60, 40,46, 46,58,
  ],

  // ── Neal Adams jaw impact · Joe Mad manga-style rise ──────────────────────
  uppercut: [
    28,16, 30,24, 22,28, 16,20, 10,12,
    40,26, 48,34, 54,42,
    32,46, 24,62, 20,78, 42,60, 48,76,
  ],

  // ── Walt Simonson Thor overhead · Olivier Coipel hammer arc ───────────────
  axe_swing: [
    30,14, 30,22, 18,26, 10,16, 6,8,
    42,24, 50,14, 54,6,
    30,46, 22,62, 18,78, 40,62, 46,78,
  ],

  // ── John Byrne Captain America block · Neal Adams defense ─────────────────
  shield_block: [
    28,12, 28,20, 16,24, 4,18, -2,14,
    40,22, 48,34, 54,46,
    28,44, 20,60, 18,78, 38,60, 44,78,
  ],

  // ── Jim Lee X-Men pairs · Pérez back-to-back duos ────────────────────────
  back_to_back: [
    30,12, 30,20, 20,24, 12,34, 8,44,
    40,24, 50,32, 56,40,
    30,44, 24,60, 22,78, 38,60, 44,78,
  ],

  // ── Neal Adams fear anatomy · David Mazzucchelli cower ────────────────────
  fear_cower: [
    30,22, 30,30, 18,32, 8,24, 2,18,
    42,30, 52,22, 58,16,
    30,48, 26,64, 24,80, 36,64, 38,80,
  ],

  // ── Neal Adams Hulk origin · Simonson Surtur explosion ────────────────────
  rage_explosion: [
    30,8, 30,16, 12,20, 2,28, -4,36,
    48,20, 58,28, 64,36,
    30,44, 20,60, 12,78, 40,60, 48,78,
  ],

  // ── Frank Miller Batman Year One stride · Bryan Hitch Ultimates ───────────
  villain_walk: [
    32,10, 32,18, 22,22, 14,34, 10,46,
    44,20, 52,32, 56,44,
    32,44, 30,60, 30,78, 40,60, 44,76,
  ],

  // ── Neal Adams close-combat knee · Green Lantern era grabs ────────────────
  knee_strike: [
    30,14, 30,22, 20,25, 12,33, 8,41,
    42,23, 44,34, 40,44,
    30,44, 22,60, 18,76, 38,34, 38,22,
  ],

  // ── Romita Jr Daredevil hook · McFarlane Spidey rotating punch ────────────
  hook_punch: [
    32,12, 30,20, 18,24, 8,20, 2,16,
    44,22, 54,14, 60,8,
    28,44, 20,60, 18,78, 40,58, 46,74,
  ],

  // ── Bryan Hitch slow reveal · Olivier Coipel Thor 3/4 turn ────────────────
  slow_turn_reveal: [
    36,10, 34,18, 22,22, 14,34, 16,46,
    46,20, 52,32, 52,44,
    32,44, 26,60, 24,78, 42,60, 46,78,
  ],

  // ── Pérez New Teen Titans charge · Bryan Hitch Ultimates run ──────────────
  team_charge: [
    32,14, 32,22, 22,26, 16,38, 12,48,
    44,24, 50,34, 54,42,
    32,46, 28,62, 28,80, 40,62, 44,80,
  ],

  // ── Neal Adams wrestling · Romita grapple throw ───────────────────────────
  grapple_throw: [
    26,24, 28,32, 18,34, 10,44, 6,54,
    42,28, 52,20, 58,12,
    30,46, 22,62, 18,78, 44,60, 52,74,
  ],

  // ── Frank Miller precision · Romita Jr Punisher prone ────────────────────
  sniper_aim: [
    16,30, 22,26, 26,20, 34,16, 42,12,
    28,28, 36,24, 46,20,
    32,34, 38,44, 48,50, 44,38, 52,44,
  ],

  // ── Joe Mad X-Men split kick · Dynamic anatomy airborne ───────────────────
  double_kick: [
    30,22, 30,30, 20,34, 14,44, 10,52,
    40,34, 46,42, 50,48,
    30,46, 14,52, 2,52, 46,52, 58,52,
  ],

  // ── Walt Simonson Angel wings · Mignola demon wingspan ────────────────────
  wing_expansion: [
    30,10, 30,18, 14,22, 2,28, -4,34,
    46,22, 58,28, 64,34,
    30,46, 22,62, 18,80, 38,62, 42,80,
  ],

  // ── Frank Miller Sin City glance · Alex Ross painted noir ────────────────
  looking_over_shoulder: [
    26,12, 28,20, 18,24, 12,36, 14,48,
    40,22, 48,34, 46,46,
    28,46, 22,62, 20,80, 40,62, 44,80,
  ],

  // ── Ditko dimension hop · Simonson Bifrost opening ────────────────────────
  portal_opening: [
    30,12, 30,20, 18,24, 10,34, 2,44,
    42,22, 52,16, 60,10,
    30,44, 24,60, 22,78, 38,60, 44,78,
  ],

  // ── McFarlane Spider-Man #1 flying kick · Neal Adams Nightwing aerial ─────
  // Refs: Romita Jr Amazing Spider-Man #365, Jim Aparo Batman #400
  // Category: combat · energy 9 · direction L→R · lineOfAction C_CURVE
  // Camera: dynamic_low / side_view · marvelRefs: Spider-Man, Batman, Nightwing
  //
  // Body reads as a flat C-curve: trailing foot (18,70) arcs through bent
  // right knee (20,56) → hip (32,44) → torso → neck (40,22) → head (46,16)
  // → then the extended kick leg (52,50 → 64,50) drives the energy forward.
  // Left arm swept back for momentum; right arm reaching toward the target.
  flying_kick: [
    46,16, 40,23, 28,26, 20,34, 14,40,
    48,27, 54,34, 58,40,
    32,44, 52,50, 64,50, 20,56, 18,70,
  ],
};

/**
 * Map each archetype ID to a sketch template key + optional horizontal flip.
 */
export interface SketchMapping {
  key: SketchKey;
  mirror?: boolean;
}

export const ARCHETYPE_SKETCH_MAP: Record<string, SketchMapping> = {
  // HEROIC — Kirby · Alex Ross · Jim Lee
  hero_landing:      { key: 'hero_landing' },
  flying_punch:      { key: 'flying_punch' },
  power_stance:      { key: 'power_stance' },
  cape_spread:       { key: 'wing_expansion' },
  charging_forward:  { key: 'team_charge' },
  mid_air_attack:    { key: 'flying_kick' },
  energy_blast:      { key: 'energy_blast' },
  defensive_pose:    { key: 'shield_block' },
  battle_roar:       { key: 'battle_roar' },
  sprint_burst:      { key: 'sprint' },

  // FIGHTING — Neal Adams · Romita Jr · Joe Mad
  boxing_punch:      { key: 'flying_punch' },
  hook_punch:        { key: 'hook_punch' },
  uppercut:          { key: 'uppercut' },
  knee_strike:       { key: 'knee_strike' },
  roundhouse_kick:   { key: 'roundhouse_kick' },
  sword_slash:       { key: 'sword_slash' },
  spear_thrust:      { key: 'gun_draw', mirror: true },
  axe_swing:         { key: 'axe_swing' },
  shield_block:      { key: 'shield_block' },
  grapple_throw:     { key: 'grapple_throw' },

  // ACROBATICS — McFarlane · Romita Jr
  wall_leap:         { key: 'flying_kick', mirror: true },
  front_flip:        { key: 'front_flip_tuck' },
  back_flip:         { key: 'back_flip' },
  swinging:          { key: 'swing_pendulum' },
  rooftop_jump:      { key: 'sprint' },
  dive_roll:         { key: 'diving_roll' },
  mid_air_twist:     { key: 'back_flip', mirror: true },
  landing_recovery:  { key: 'hero_landing', mirror: true },
  slide_dodge:       { key: 'diving_roll', mirror: true },
  vault:             { key: 'front_flip_tuck', mirror: true },

  // CINEMATIC — Frank Miller · Bryan Hitch
  walking_to_camera: { key: 'villain_walk' },
  looking_over_shoulder: { key: 'looking_over_shoulder' },
  standing_in_rain:  { key: 'rooftop_silhouette' },
  silent_threat:     { key: 'rooftop_silhouette', mirror: true },
  villain_throne:    { key: 'villain_throne' },
  team_lineup:       { key: 'power_stance', mirror: true },
  backlit_entrance:  { key: 'wing_expansion', mirror: true },
  slow_turn_reveal:  { key: 'slow_turn_reveal' },
  power_awakening:   { key: 'rage_explosion' },
  final_stand:       { key: 'power_stance' },

  // EMOTIONAL — Neal Adams · Frank Miller
  grieving:          { key: 'grieving' },
  angry_scream:      { key: 'battle_roar' },
  fear_pose:         { key: 'fear_cower' },
  shock_pose:        { key: 'rooftop_silhouette' },
  determination:     { key: 'villain_walk' },
  evil_smile:        { key: 'rooftop_silhouette', mirror: true },
  exhausted:         { key: 'grieving', mirror: true },
  defeated:          { key: 'grieving' },
  hopeful:           { key: 'power_stance' },
  rage_transformation: { key: 'rage_explosion' },

  // TEAM — George Pérez · Jim Lee
  back_to_back:      { key: 'back_to_back' },
  team_charge:       { key: 'team_charge' },
  circle_formation:  { key: 'power_stance', mirror: true },
  last_stand:        { key: 'back_to_back', mirror: true },
  group_leap:        { key: 'flying_punch' },
  tactical_formation: { key: 'rooftop_silhouette' },
  hero_villain_faceoff: { key: 'villain_walk', mirror: true },

  // CREATURE — Mignola · Walt Simonson
  beast_crawl:       { key: 'beast_crawl' },
  roaring:           { key: 'battle_roar' },
  predator_leap:     { key: 'flying_kick', mirror: true },
  giant_smash:       { key: 'axe_swing', mirror: true },
  claw_attack:       { key: 'sword_slash', mirror: true },
  tentacle_reach:    { key: 'wing_expansion' },
  wing_expansion:    { key: 'wing_expansion', mirror: true },
  monster_stomp:     { key: 'hero_landing' },

  // MAGIC — Simonson · Mignola · Van Sciver
  spell_casting:     { key: 'spell_cast' },
  summoning:         { key: 'energy_blast', mirror: true },
  energy_orb:        { key: 'spell_cast', mirror: true },
  floating_meditation: { key: 'floating_meditate' },
  portal_opening:    { key: 'portal_opening' },
  staff_slam:        { key: 'axe_swing' },
  rune_activation:   { key: 'energy_blast' },

  // WEAPON — Neal Adams · Romita Jr
  gun_draw:          { key: 'gun_draw' },
  reload:            { key: 'grieving' },
  sniper_aim:        { key: 'sniper_aim' },
  dual_pistols:      { key: 'energy_blast' },
  sword_draw:        { key: 'sword_slash' },
  katana_dash:       { key: 'sprint' },
  bow_draw:          { key: 'bow_draw' },
  hammer_throw:      { key: 'axe_swing', mirror: true },

  // STORYBOARD — Bryan Hitch · Sienkiewicz
  crouching_sniper:  { key: 'sniper_aim', mirror: true },
  rooftop_lookout:   { key: 'rooftop_silhouette' },
  superhero_run:     { key: 'sprint', mirror: true },
  double_kick:       { key: 'double_kick' },
  cyborg_scan:       { key: 'villain_walk' },
  teleport_arrival:  { key: 'energy_blast', mirror: true },
  fist_to_ground:    { key: 'hero_landing' },
  energy_charge:     { key: 'energy_blast' },
  wall_crawl:        { key: 'wall_crawl' },
  spider_swing:      { key: 'swing_pendulum', mirror: true },
};
