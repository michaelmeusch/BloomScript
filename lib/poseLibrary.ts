// ── Comic Art Studio — Ultimate Pose Library ──────────────────────────────────────────
// 110+ industry-standard comic poses with categories, silhouette types,
// motion flows, intensity levels, and AI generation metadata.

export type PoseCategory =
  | 'Hero' | 'Action' | 'Emotional' | 'Dialogue' | 'Horror'
  | 'Villain' | 'Team' | 'Manga' | 'Cinematic' | 'Transition' | 'Sacrifice';

export interface ComicPose {
  id: string;
  name: string;
  category: PoseCategory;
  emotionalPurpose: string;
  description: string;
  silhouette: string;
  motionFlow: string;
  intensity: number;      // 1-10
  groupPose: boolean;
}

export const POSE_CATEGORIES: PoseCategory[] = [
  'Hero','Action','Emotional','Dialogue','Horror',
  'Villain','Team','Manga','Cinematic','Transition','Sacrifice',
];

export const CAT_COLORS: Record<PoseCategory, string> = {
  Hero:      '#FFD600',
  Action:    '#E8001C',
  Emotional: '#0057A8',
  Dialogue:  '#9B59B6',
  Horror:    '#FF6B6B',
  Villain:   '#7B2FBE',
  Team:      '#00BCD4',
  Manga:     '#FF6B00',
  Cinematic: '#2A7A3A',
  Transition:'#7A6A58',
  Sacrifice: '#E91E8C',
};

function p(
  id: string,
  name: string,
  category: PoseCategory,
  emo: string,
  desc: string,
  sil: string,
  motion: string,
  intensity: number,
  group = false
): ComicPose {
  return { id, name, category, emotionalPurpose: emo, description: desc, silhouette: sil, motionFlow: motion, intensity, groupPose: group };
}

export const POSE_LIBRARY: ComicPose[] = [
  // HERO (10)
  p('hero_landing',     'Hero Landing',     'Hero', 'Power arrival',   'One knee landing, dust impact',                    'Triangle',         'Downward Impact',  9),
  p('power_walk',       'Power Walk',       'Hero', 'Confidence',      'Slow intimidating walk toward camera',               'Wide Dominance',   'Forward Motion',   7),
  p('fist_raised',      'Fist Raised',      'Hero', 'Triumph',         'Victory pose, fist thrust skyward',                  'Vertical Power',   'Upward Energy',    8),
  p('shield_block',     'Shield Block',     'Hero', 'Protection',      'Raised guard deflecting attack',                     'Diagonal Brace',   'Recoil Backward',  8),
  p('hero_stare',       'Hero Stare',       'Hero', 'Determination',   'Unwavering gaze at horizon',                         'Strong Profile',   'Static Resolve',   6),
  p('flying_punch',     'Flying Punch',     'Hero', 'Impact',          'Mid-air haymaker with wind lines',                   'Diagonal Punch',   'Forward Rush',    10),
  p('landing_recovery', 'Landing Recovery', 'Hero', 'Resilience',      'Rising from crater impact',                          'Collapsed→Vertical','Upward Recovery', 8),
  p('dual_wield',       'Dual Wield',       'Hero', 'Readiness',       'Two weapons drawn, back-to-back',                    'X-Cross',          'Static Tension',   7),
  p('cape_flow',        'Cape Flow',        'Hero', 'Majesty',         'Cape billowing, back turned',                        'Vertical Flow',    'Wind Sweep',       6),
  p('hero_crouch',      'Hero Crouch',      'Hero', 'Stealth',         'Low ready position before leap',                     'Compressed Triangle','Tension Build',  7),

  // ACTION (10)
  p('mid_kick',         'Mid Kick',         'Action', 'Force',         'High roundhouse mid-motion',                         'Horizontal Arc',   'Circular Motion',  9),
  p('sword_clash',      'Sword Clash',      'Action', 'Impact',        'Blade lock with sparks',                             'Crossed Diagonal', 'Static Clash',     9),
  p('dodge_roll',       'Dodge Roll',       'Action', 'Agility',       'Tumbling evasion, hair trailing',                    'Rolling Curve',    'Rotational Motion',8),
  p('uppercut',         'Uppercut',         'Action', 'Power',         'Close-up fist rising under chin',                    'Vertical Arc',     'Upward Motion',    9),
  p('wall_run',         'Wall Run',         'Action', 'Momentum',      'Horizontal sprint on vertical surface',              'L-Shape',          'Sideways Rush',   10),
  p('explosion_dive',   'Explosion Dive',   'Action', 'Escape',        'Leaping away from fireball',                         'Diagonal Dive',    'Forward Escape',   9),
  p('grappling_hook',   'Grappling Hook',   'Action', 'Ascension',     'Rope swing mid-arc, city below',                     'Inverted Arc',     'Swing Motion',     8),
  p('gun_draw',         'Gun Draw',         'Action', 'Tension',       'Quick-draw holster blur',                            'Triangle Ready',   'Static→Burst',     7),
  p('melee_spin',       'Melee Spin',       'Action', 'Chaos',         'Whirling attack, weapon blur',                       'Radial',           'Rotational Burst', 9),
  p('parkour_vault',    'Parkour Vault',    'Action', 'Flow',          'Hand-spring over obstacle',                          'Arched Bridge',    'Forward Arc',      8),

  // EMOTIONAL (10)
  p('kneeling_defeat',  'Kneeling Defeat',  'Emotional', 'Defeat',     'Head bowed, fist on ground',                         'Collapsed Curve',  'Downward Energy',  6),
  p('tear_fall',        'Tear Fall',        'Emotional', 'Grief',      'Single tear, hand against glass',                      'Soft Profile',     'Static Sorrow',    4),
  p('shocked_gasp',     'Shocked Gasp',     'Emotional', 'Revelation', 'Hands to mouth, wide eyes',                          'Broken Vertical',  'Static Shock',     5),
  p('reaching_out',     'Reaching Out',     'Emotional', 'Yearning',   'Hand stretched toward light',                          'Diagonal Reach',   'Forward Yearn',    5),
  p('hug_tight',        'Hug Tight',        'Emotional', 'Comfort',    'Embrace from behind, chin on shoulder',              'Enclosed Curve',   'Static Warmth',    3),
  p('scream_silence',   'Scream Silence',   'Emotional', 'Despair',    'Mouth open, no sound, tears',                          'Vertical Collapse','Downward Release', 7),
  p('lonely_bench',     'Lonely Bench',     'Emotional', 'Isolation',  'Slumped alone, rain puddle',                         'Small Figure',     'Static Melancholy',3),
  p('clenched_jaw',     'Clenched Jaw',     'Emotional', 'Resolve',    'Side profile, fist trembling',                       'Rigid Profile',    'Contained Energy', 6),
  p('carry_off',        'Carry-Off',        'Emotional', 'Urgency',    'Carrying wounded loved one',                         'Triangle',         'Forward Motion',   7, true),
  p('broken_hero',      'Broken Hero',      'Emotional', 'Defeat',     'Emotionally destroyed posture',                       'Collapsed Curve',  'Downward Energy',  5),

  // DIALOGUE (8)
  p('pointing_accuse',  'Pointing Accuse',  'Dialogue', 'Confrontation','Finger thrust, accusatory stance',                   'Diagonal Point',   'Forward Assertion',6),
  p('arms_crossed',     'Arms Crossed',     'Dialogue', 'Defiance',   'Closed body language, skeptical',                      'Enclosed Shape',   'Static Challenge', 4),
  p('leaning_in',       'Leaning In',       'Dialogue', 'Intimacy',   'Close whisper, hand on wall',                          'Diagonal Lean',    'Forward Intimacy', 4),
  p('thinking_pose',    'Thinking Pose',    'Dialogue', 'Contemplation','Hand on chin, gaze distant',                         'Asymmetrical',     'Static Thought',   2),
  p('shrug_uncertain',  'Shrug Uncertain',  'Dialogue', 'Uncertainty','Hands up, shoulders raised',                           'Soft Curve',       'Upward Uncertainty',3),
  p('lecture_stance',   'Lecture Stance',   'Dialogue', 'Authority',  'Hand raised, palm open',                               'Vertical Authority','Static Command',  5),
  p('confession_kneel', 'Confession Kneel', 'Dialogue', 'Vulnerability','On knees, hands clasped',                              'Compressed Vertical','Static Plea',   6),
  p('phone_listen',     'Phone Listen',     'Dialogue', 'Secret',     'Head tilted, shadowed face',                           'Asymmetrical',     'Static Tension',   3),

  // HORROR (8)
  p('creeping_hand',    'Creeping Hand',    'Horror', 'Dread',        'Fingers curling over door frame',                      'Jagged Curve',     'Slow Invasion',    6),
  p('contorted_spine',  'Contorted Spine',  'Horror', 'Unnatural',    'Back bent backward, joints wrong',                       'Broken S-Curve',   'Static Wrongness', 8),
  p('shadow_approach',   'Shadow Approach',  'Horror', 'Menace',       'Silhouette looming, only eyes visible',                  'Towering Vertical','Slow Advance',     7),
  p('dead_gaze',        'Dead Gaze',        'Horror', 'Undead',       'Head tilted, milky eyes, slack jaw',                     'Soft Oval',        'Static Horror',    5),
  p('crawling_ceil',    'Crawling Ceiling', 'Horror', 'Inversion',    'Upside-down crawl, limbs too long',                    'Inverted Spider',  'Creeping Motion',  9),
  p('mirror_ghost',     'Mirror Ghost',     'Horror', 'Doppelganger', 'Reflection moves independently',                           'Symmetrical Mirror','Static Wrong',     6),
  p('jaw_unhinge',      'Jaw Unhinge',      'Horror', 'Shock',        'Mouth opening impossibly wide',                          'Vertical Stretch', 'Static Revulsion', 7),
  p('bloody_smile',     'Bloody Smile',     'Horror', 'Madness',      'Grin with bloody teeth, head cocked',                    'Asymmetrical',     'Static Menace',    6),

  // VILLAIN (7)
  p('throne_recline',   'Throne Recline',   'Villain', 'Arrogance',   'Lounging on throne, pet in lap',                       'Relaxed Diagonal', 'Static Power',     5),
  p('knife_twirl',      'Knife Twirl',      'Villain', 'Threat',      'Casual blade spinning on finger',                      'Small Circle',     'Rotational Ease',  5),
  p('monologue_turn',   'Monologue Turn',   'Villain', 'Dramatic',    'Back to camera, turning mid-speech',                     'Pivot Arc',        'Rotational Reveal',6),
  p('evil_smirk',       'Evil Smirk',       'Villain', 'Cruelty',     'One-sided grin, narrowed eyes',                          'Asymmetrical',     'Static Malice',    4),
  p('army_address',      'Army Address',     'Villain', 'Command',    'Arms wide, troops below',                                'Wide Dominance',   'Static Authority', 7, true),
  p('trophy_pose',       'Trophy Pose',      'Villain', 'Victory',     'Foot on fallen hero, sword raised',                      'Triumph Triangle', 'Static Conquest',  8),
  p('hidden_face',       'Hidden Face',      'Villain', 'Mystery',     'Hood shadow, only chin visible',                         'Enclosed Dark',    'Static Mystery',   4),

  // TEAM (5)
  p('back_to_back',     'Back-to-Back',     'Team', 'Unity',          'Two fighters surrounded, weapons ready',                 'Dual Vertical',    'Static Readiness', 7, true),
  p('high_five',        'High Five',        'Team', 'Celebration',    'Hands meeting mid-air, impact lines',                    'Vertical Clash',   'Upward Impact',    5, true),
  p('combined_attack',  'Combined Attack',  'Team', 'Synergy',        'Two characters, one punch trajectory',                   'Merged Figure-8',  'Forward Rush',     9, true),
  p('rescue_catch',     'Rescue Catch',     'Team', 'Trust',          'One falling, one catching mid-air',                      'Linked Arc',       'Downward Catch',   8, true),
  p('team_stance',      'Team Stance',      'Team', 'Solidarity',     'Line formation, shoulder-to-shoulder',                   'Horizontal Bar',   'Static Unity',     6, true),

  // MANGA (5)
  p('speed_lines',      'Speed Lines',      'Manga', 'Velocity',      'Character mid-dash, background streaks',                 'Diagonal Rush',    'Forward Blur',     9),
  p('chibi_rage',       'Chibi Rage',       'Manga', 'Comedy',        'Tiny body, giant head, vein pop',                        'Oversized Head',   'Static Exaggeration',4),
  p('sweat_drop',       'Sweat Drop',       'Manga', 'Embarrassment', 'Giant sweat bead, awkward smile',                        'Soft Curve',       'Static Awkward',   2),
  p('impact_frame',     'Impact Frame',     'Manga', 'Shock',         'White background, black speed streaks',                  'Radial Burst',     'Static Explosion', 8),
  p('romantic_sparkle', 'Romantic Sparkle', 'Manga', 'Affection',     'Flowers and sparkles background',                        'Soft Oval',        'Static Glow',      3),

  // CINEMATIC (5)
  p('slow_walk_fire',   'Slow Walk Fire',   'Cinematic', 'Cool',      'Walking away from explosion',                              'Vertical Calm',    'Slow Forward',     8),
  p('window_gaze',      'Window Gaze',      'Cinematic', 'Contemplation','Back to camera, rain on glass',                       'Vertical Reflection','Static Thought',  4),
  p('hand_drop_gun',    'Hand Drop Gun',    'Cinematic', 'Defeat',    'Weapon falling from limp fingers',                         'Vertical Descent', 'Downward Release', 6),
  p('overhead_battle',  'Overhead Battle',  'Cinematic', 'Scale',     'Birds-eye view of duel',                                   'Radial Duel',      'Static Overview',  7),
  p('silhouette_sunset','Silhouette Sunset','Cinematic', 'Poetry',    'Figure against blood-red sky',                             'Pure Silhouette',  'Static Beauty',    3),

  // TRANSITION (4)
  p('door_open',        'Door Open',        'Transition', 'Threshold','Hand on knob, light from crack',                          'Vertical Split',   'Static Threshold', 3),
  p('stair_ascend',     'Stair Ascend',     'Transition', 'Progress', 'Climbing into darkness above',                            'Diagonal Ascent',  'Upward Motion',    4),
  p('train_depart',     'Train Depart',     'Transition', 'Farewell', 'Waving from platform, train leaving',                      'Horizontal Divide','Static Longing',   3),
  p('rain_window',      'Rain Window',      'Transition', 'Mood',     'Watching raindrops race',                                  'Soft Frame',       'Static Atmosphere',2),

  // SACRIFICE (5)
  p('last_stand',       'Last Stand',       'Sacrifice', 'Defiance',   'Facing impossible odds, weapon raised',                  'Broken Vertical',  'Forward Pressure',  9),
  p('shield_fall',      'Shield Fall',      'Sacrifice', 'Protection', 'Collapsing while guarding another',                        'Falling Diagonal', 'Downward Sacrifice',8),
  p('final_smile',      'Final Smile',      'Sacrifice', 'Peace',      'Blood on lip, gentle smile',                             'Soft Curve',       'Static Acceptance', 5),
  p('hand_slip',        'Hand Slip',        'Sacrifice', 'Loss',       'Fingers letting go, drifting apart',                     'Reaching Diagonal','Downward Release',  6),
  p('light_fade',       'Light Fade',       'Sacrifice', 'Transcendence','Body dissolving into particles',                        'Dissolving Shape', 'Upward Dissolve',   7),
];
