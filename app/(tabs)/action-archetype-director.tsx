/**
 * ACTION ARCHETYPE DIRECTOR
 * 182 archetypes across 18 categories, researched from 50 top Western/Anime comic artists:
 * Kirby · Neal Adams · Jim Lee · McFarlane · Frank Miller · George Pérez ·
 * Simonson · Mignola · Bryan Hitch · Alex Ross · Romita Jr · Joe Mad ·
 * Pacheco · Coipel · Van Sciver · Byrne · Sienkiewicz · McKean · Immonen ·
 * Steve Ditko · Ethan Van Sciver · Mike Wieringo · Francis Manapul ·
 * John Cassaday · Greg Capullo · David Finch · Salvador Larroca · Leinil Yu ·
 * Alan Davis · John Buscema · Gene Colan · Barry Windsor-Smith · Dave Cockrum ·
 * Paul Smith · Kevin Nowlan · Joe Sinnott · Werner Roth · Gil Kane · Herb Trimpe ·
 * Don Heck · Wally Wood · Steve Rude · Howard Chaykin · Bill Sienkiewicz ·
 * Mike Ploog · Rich Buckler · Bob Layton · Michael Golden · Don Perlin · Art Adams
 *
 * Pattern research:
 * - Line of Action (C-curve, S-curve, straight)
 * - 45° diagonal rule  · Low-angle = power
 * - Silhouette readability · Foreshortening toward camera
 * - Weight shift · Implied motion language
 * - Emotional alignment · Negative space framing
 * - Aerial dynamics · Power accumulation · Blast trajectory physics
 * - Stealth geometry · Velocity distortion · Impact crater math
 */
import { Feather } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React, { useCallback, useMemo, useRef, useState } from 'react';
import PoseSketch from '@/components/PoseSketch';
import {
  analyzePose,
  buildForeshorteningPromptFragment,
  getActiveEffects,
  getCompositionDNA,
  getForeshorteningProfile,
  getPanelBreakRecommendation,
  parseComicActions,
  type CompositionDNA,
  type ForeshorteningProfile,
  type PanelBreakMode,
  type PanelBreakResult,
  type PoseAnalysis,
} from '@/lib/foreshortening';
import {
  Animated,
  FlatList,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import CharacterBuilderModal from './character-builder-modal';
import UniverseModal from './universe-modal';
import EnvironmentModal from './environment-modal';
import GroupCompositionModal from './group-composition-modal';
import CinematicDirectorModal from './cinematic-director-modal';
import { buildCinematicDescriptionFragment } from '@/lib/cinematic-interpreter';
import {
  BLANK_CHARACTER_DNA,
  buildCharacterDNAFragment,
  useCharacterMemory,
  type CharacterDNA,
} from '@/lib/character-memory';
import {
  BLANK_ENVIRONMENT,
  COMIC_ENVIRONMENT_DATABASE,
  buildEnvironmentFragment,
  type ActiveEnvironment,
} from '@/lib/environment-database';
import {
  buildGroupCompositionFragment,
  type CompositionType,
} from '@/lib/group-composition';

// ── Ink + Gold palette ────────────────────────────────────────────────────────
const C = {
  bg:     '#0A0806',
  bgMid:  '#14100A',
  card:   '#1A1510',
  border: '#2A2218',
  gold:   '#FFD600',
  goldDim:'#FFD60060',
  goldBg: '#FFD60012',
  white:  '#F0EAD8',
  muted:  '#7A6A58',
  red:    '#E8001C',
  blue:   '#0057A8',
  green:  '#22C55E',
  purple: '#8B3FBE',
  orange: '#FF6A00',
};

// ── Category definitions ───────────────────────────────────────────────────────
type CategoryId =
  | 'HEROIC' | 'FIGHTING' | 'ACROBATICS' | 'CINEMATIC' | 'EMOTIONAL'
  | 'TEAM' | 'CREATURE' | 'MAGIC' | 'WEAPON' | 'STORYBOARD'
  | 'AERIAL' | 'POWERUP' | 'BLAST' | 'IMPACT' | 'STEALTH' | 'SPEED'
  | 'DOMINANCE' | 'DIALOGUE';

interface Category {
  id: CategoryId;
  emoji: string;
  label: string;
  color: string;
  artistRef: string;   // which artist defined this category
  lineOfAction: string;
}

const CATEGORIES: Category[] = [
  { id: 'HEROIC',     emoji: '⚜️',  label: 'HEROIC',      color: C.gold,   artistRef: 'Kirby · Alex Ross · Jim Lee',    lineOfAction: 'S-Curve upward — chest leads' },
  { id: 'FIGHTING',   emoji: '⚔️',  label: 'FIGHTING',    color: C.red,    artistRef: 'Neal Adams · Romita Jr · Joe Mad', lineOfAction: '45° diagonal — fist toward camera' },
  { id: 'ACROBATICS', emoji: '🌪️',  label: 'ACROBATICS',  color: C.blue,   artistRef: 'McFarlane · Romita Jr',           lineOfAction: 'C-Curve arc — full body rotation' },
  { id: 'CINEMATIC',  emoji: '🎬',  label: 'CINEMATIC',   color: C.purple, artistRef: 'Frank Miller · Bryan Hitch',       lineOfAction: 'Straight vertical — silhouette reads' },
  { id: 'EMOTIONAL',  emoji: '🎭',  label: 'EMOTIONAL',   color: '#60A5FA',artistRef: 'Neal Adams · Frank Miller',        lineOfAction: 'C-Curve inward — weight collapse' },
  { id: 'TEAM',       emoji: '🤝',  label: 'TEAM',        color: '#00BCD4',artistRef: 'George Pérez · Jim Lee',           lineOfAction: 'Triangle formation — Z-pattern eye' },
  { id: 'CREATURE',   emoji: '👹',  label: 'CREATURE',    color: '#FF6B6B',artistRef: 'Mignola · Walt Simonson',          lineOfAction: 'Hunched diagonal — mass forward' },
  { id: 'MAGIC',      emoji: '✨',  label: 'MAGIC',       color: '#A78BFA',artistRef: 'Simonson · Mignola · Van Sciver',  lineOfAction: 'Radial burst — energy from center' },
  { id: 'WEAPON',     emoji: '🗡️',  label: 'WEAPON',      color: C.orange, artistRef: 'Neal Adams · Romita Jr',          lineOfAction: 'Diagonal slash — weapon leads eye' },
  { id: 'STORYBOARD', emoji: '🎞️',  label: 'STORYBOARD',  color: C.green,    artistRef: 'Bryan Hitch · Bill Sienkiewicz',            lineOfAction: 'Varies — cinematic staging priority' },
  { id: 'AERIAL',     emoji: '🦅',  label: 'AERIAL',      color: '#38BDF8',  artistRef: 'Kirby · Pacheco · Larroca · Cassaday',       lineOfAction: 'Upward S-curve — chest leads, legs trail' },
  { id: 'POWERUP',    emoji: '⚡',  label: 'POWER-UP',    color: '#FDE68A',  artistRef: 'Van Sciver · Alex Ross · Peter David Hulk',   lineOfAction: 'Radial inward-then-burst — energy accumulates then erupts' },
  { id: 'BLAST',      emoji: '💥',  label: 'BLAST',       color: '#FB923C',  artistRef: 'Kirby · Van Sciver · Manapul · Cassaday',     lineOfAction: 'Horizontal arrow — energy exits from body toward target' },
  { id: 'IMPACT',     emoji: '💢',  label: 'IMPACT',      color: '#F87171',  artistRef: 'Romita Jr · Coipel · David Finch · Leinil Yu', lineOfAction: 'Inverted triangle descending — all mass drives through contact point' },
  { id: 'STEALTH',    emoji: '🌑',  label: 'STEALTH',     color: '#94A3B8',  artistRef: 'Frank Miller · Mignola · Capullo · Jock',     lineOfAction: 'Low compressed diagonal — minimum silhouette' },
  { id: 'SPEED',      emoji: '💨',  label: 'SPEED',       color: '#67E8F9',  artistRef: 'Wieringo · Manapul · Immonen · Gil Kane',        lineOfAction: 'Pure horizontal — body at 15° lean, full commitment' },
  { id: 'DOMINANCE',  emoji: '👑',  label: 'DOMINANCE',   color: '#D4AF37',  artistRef: 'Frank Miller · Alex Ross · Bryan Hitch',          lineOfAction: 'Stable vertical or forward loom — gravity of authority' },
  { id: 'DIALOGUE',   emoji: '💬',  label: 'DIALOGUE',    color: '#8B7355',  artistRef: 'Neal Adams · George Pérez · Frank Miller',        lineOfAction: 'Two-body tension gap — charged negative space between figures' },
];

// ── Pose DNA type ─────────────────────────────────────────────────────────────
interface PoseDNA {
  flexibility:           number; // 0-10
  aggression:            number;
  balance:               number;
  speed:                 number;
  acrobatics:            number;
  combatStyle:           number;
  silhouetteReadability: number;
}

// ── Camera shots (from Java spec + existing screen) ───────────────────────────
const CAMERA_SHOTS = [
  { id: 'CLOSE_UP',            label: 'Close-Up',            emoji: '👁️',  desc: 'Face / expression focus — Neal Adams signature' },
  { id: 'EXTREME_CLOSE_UP',    label: 'Extreme Close-Up',    emoji: '🔬',  desc: 'Eyes only — Frank Miller noir technique' },
  { id: 'MEDIUM_SHOT',         label: 'Medium Shot',         emoji: '🧍',  desc: 'Waist up — dialogue & emotion standard' },
  { id: 'FULL_BODY',           label: 'Full Body',           emoji: '🦸',  desc: 'Full costume read — Alex Ross go-to' },
  { id: 'WIDE_SHOT',           label: 'Wide Shot',           emoji: '🌆',  desc: 'Environment included — Bryan Hitch widescreen' },
  { id: 'OVER_SHOULDER',       label: 'Over Shoulder',       emoji: '👤',  desc: 'POV proximity — interrogation / tension' },
  { id: 'DUTCH_ANGLE',         label: 'Dutch Angle',         emoji: '📐',  desc: 'Tilted horizon — Frank Miller psychological unease' },
  { id: 'BIRD_EYE_VIEW',       label: "Bird's Eye View",     emoji: '🦅',  desc: 'Looking down — villain dominance / crowd shot' },
  { id: 'WORM_EYE_VIEW',       label: "Worm's Eye View",     emoji: '🐛',  desc: 'Looking up — Kirby power angle, hero as giant' },
  { id: 'CINEMATIC_LOW_ANGLE', label: 'Cinematic Low Angle', emoji: '🎬',  desc: 'Low + dramatic — Hitch Ultimates signature' },
  { id: 'ACTION_TRACKING',     label: 'Action Tracking',     emoji: '🏃',  desc: 'Side-pan motion blur — speed force & sprint' },
  { id: 'ESTABLISHING_SHOT',   label: 'Establishing Shot',   emoji: '🏙️',  desc: 'Full environment — Pérez team scene opener' },
] as const;

type CameraId = (typeof CAMERA_SHOTS)[number]['id'];

// ── 182 Archetypes — 18 categories, 50 artist canons ─────────────────────────
interface Archetype {
  id: string;
  name: string;
  category: CategoryId;
  emoji: string;
  artistDNA: string;   // which artist's work this evokes
  lineOfAction: string;
  silhouetteShape: string;
  motionLanguage: string;
  bestCamera: CameraId;
  DNA: PoseDNA;
  // ── PoseDNA anatomy fields from Java spec (optional — only populated for
  //    DOMINANCE and DIALOGUE categories to start; backfill others over time)
  interactionType?: string;  // 'attack' | 'impact' | 'energy_release' | 'dominance' | 'emotion' | 'tension' | 'movement'
  leadingMass?: string;      // which body part leads the pose
  anatomy?: {
    torsoRotation: number;   // degrees, -45 to +45
    hipTilt: number;         // degrees
    shoulderTilt: number;    // degrees
    foreshortening: number;  // 0.0–1.0 (Java PoseDNA.foreshortening)
  };
}

const ARCHETYPES: Archetype[] = [
  // ── HEROIC (10) — Kirby · Alex Ross · Jim Lee ──────────────────────────────
  {
    id:'hero_landing', name:'Hero Landing', category:'HEROIC', emoji:'💥',
    artistDNA:'Kirby (FF#1 cover) · Alex Ross (Kingdom Come)',
    lineOfAction:'Straight downward — weight drives into earth',
    silhouetteShape:'Triangle — wide base, compressed height',
    motionLanguage:'Dust crater radiates outward · cape settles late',
    bestCamera:'WORM_EYE_VIEW',
    DNA:{ flexibility:7, aggression:8, balance:9, speed:7, acrobatics:6, combatStyle:7, silhouetteReadability:10 },
  },
  {
    id:'flying_punch', name:'Flying Punch', category:'HEROIC', emoji:'👊',
    artistDNA:'Kirby Krackle energy · Joe Madureira impact flash',
    lineOfAction:'45° diagonal — fist first, body trailing',
    silhouetteShape:'Diagonal spear — elongated toward camera',
    motionLanguage:'Foreshortened fist huge · speed lines · Kirby dots',
    bestCamera:'WORM_EYE_VIEW',
    DNA:{ flexibility:7, aggression:10, balance:6, speed:9, acrobatics:7, combatStyle:9, silhouetteReadability:9 },
  },
  {
    id:'power_stance', name:'Power Stance', category:'HEROIC', emoji:'⚜️',
    artistDNA:'Jim Lee (X-Men #1 cover) · Alex Ross',
    lineOfAction:'S-curve upward — chest forward, chin up',
    silhouetteShape:'Wide-W — feet planted, cape spread',
    motionLanguage:'Static but charged · cape billows · ground cracks optional',
    bestCamera:'WORM_EYE_VIEW',
    DNA:{ flexibility:5, aggression:6, balance:10, speed:3, acrobatics:4, combatStyle:6, silhouetteReadability:10 },
  },
  {
    id:'cape_spread', name:'Cape Spread', category:'HEROIC', emoji:'🦸',
    artistDNA:'Alex Ross classic hero · Curt Swan golden-age heroic',
    lineOfAction:'Vertical straight — arms horizontal, cape fans',
    silhouetteShape:'Cross / T-shape — maximum wingspan',
    motionLanguage:'Wind lift · fabric light source · shadow dramatic',
    bestCamera:'BIRD_EYE_VIEW',
    DNA:{ flexibility:5, aggression:4, balance:9, speed:3, acrobatics:5, combatStyle:4, silhouetteReadability:10 },
  },
  {
    id:'charging_forward', name:'Charging Forward', category:'HEROIC', emoji:'🚀',
    artistDNA:'George Pérez team charge · Bryan Hitch Ultimates',
    lineOfAction:'45° diagonal — body leans forward, arms back',
    silhouetteShape:'Wedge — compressed triangle toward camera',
    motionLanguage:'Ground kicks up · wind resistance · speed lines',
    bestCamera:'CINEMATIC_LOW_ANGLE',
    DNA:{ flexibility:6, aggression:9, balance:7, speed:9, acrobatics:6, combatStyle:8, silhouetteReadability:8 },
  },
  {
    id:'mid_air_attack', name:'Mid-Air Attack', category:'HEROIC', emoji:'⚡',
    artistDNA:'Kirby flying punch · Jim Lee mid-combat',
    lineOfAction:'Diagonal falling — momentum committed',
    silhouetteShape:'Diagonal spike — one arm extended',
    motionLanguage:'Cape trails · energy lines · target below',
    bestCamera:'WORM_EYE_VIEW',
    DNA:{ flexibility:8, aggression:9, balance:5, speed:8, acrobatics:8, combatStyle:8, silhouetteReadability:9 },
  },
  {
    id:'energy_blast', name:'Energy Blast', category:'HEROIC', emoji:'✨',
    artistDNA:'Kirby Krackle · Ethan Van Sciver GL rings',
    lineOfAction:'Straight horizontal — both arms forward',
    silhouetteShape:'Cross — wide base, arms horizontal',
    motionLanguage:'Recoil lean back · energy radiates · Kirby dots',
    bestCamera:'MEDIUM_SHOT',
    DNA:{ flexibility:5, aggression:8, balance:7, speed:6, acrobatics:4, combatStyle:7, silhouetteReadability:8 },
  },
  {
    id:'defensive_pose', name:'Defensive Pose', category:'HEROIC', emoji:'🛡️',
    artistDNA:'Neal Adams Captain America · John Byrne X-Men',
    lineOfAction:'Angled back-lean — weight shifts rearward',
    silhouetteShape:'Diamond — arms raised, legs braced',
    motionLanguage:'Impact incoming · debris · shield raised high',
    bestCamera:'FULL_BODY',
    DNA:{ flexibility:6, aggression:5, balance:9, speed:5, acrobatics:5, combatStyle:8, silhouetteReadability:8 },
  },
  {
    id:'battle_roar', name:'Battle Roar', category:'HEROIC', emoji:'😤',
    artistDNA:'Walt Simonson Thor · George Pérez Titan characters',
    lineOfAction:'S-curve backward — chest thrust out, arms spread',
    silhouetteShape:'Radial — limbs spread from center',
    motionLanguage:'Sound effect fills panel · shockwave ring · hair back',
    bestCamera:'CINEMATIC_LOW_ANGLE',
    DNA:{ flexibility:6, aggression:9, balance:7, speed:4, acrobatics:4, combatStyle:6, silhouetteReadability:9 },
  },
  {
    id:'sprint_burst', name:'Sprint Burst', category:'HEROIC', emoji:'💨',
    artistDNA:'Mark Waid Flash runs · Stuart Immonen speed',
    lineOfAction:'Pure horizontal diagonal — full lean forward',
    silhouetteShape:'Horizontal arrow — maximum forward lean',
    motionLanguage:'Speed lines · ground blur · afterimage ghost',
    bestCamera:'ACTION_TRACKING',
    DNA:{ flexibility:8, aggression:6, balance:6, speed:10, acrobatics:7, combatStyle:5, silhouetteReadability:7 },
  },

  // ── FIGHTING (10) — Neal Adams · Romita Jr · Joe Mad ─────────────────────
  {
    id:'boxing_punch', name:'Boxing Punch', category:'FIGHTING', emoji:'🥊',
    artistDNA:'Neal Adams boxing technique · Romita Sr classic',
    lineOfAction:'Diagonal straight — shoulder leads fist',
    silhouetteShape:'Compressed L — rear foot planted, arm extended',
    motionLanguage:'Impact flash · opponent recoils · motion blur on fist',
    bestCamera:'DUTCH_ANGLE',
    DNA:{ flexibility:6, aggression:9, balance:8, speed:9, acrobatics:4, combatStyle:9, silhouetteReadability:8 },
  },
  {
    id:'hook_punch', name:'Hook Punch', category:'FIGHTING', emoji:'🪝',
    artistDNA:'Romita Jr Daredevil fights · McFarlane Spidey combat',
    lineOfAction:'Circular arc — elbow leads, hip rotates',
    silhouetteShape:'C-arc — arm circles from shoulder',
    motionLanguage:'Blurred arc trail · impact starburst · sweat drops',
    bestCamera:'CLOSE_UP',
    DNA:{ flexibility:7, aggression:9, balance:7, speed:8, acrobatics:5, combatStyle:9, silhouetteReadability:7 },
  },
  {
    id:'uppercut', name:'Uppercut', category:'FIGHTING', emoji:'☝️',
    artistDNA:'Neal Adams jaw impact · Joe Madureira manga-style',
    lineOfAction:'Vertical upward — hip drives fist skyward',
    silhouetteShape:'Vertical J — crouched to extended',
    motionLanguage:'Target lifted off feet · impact star at jaw · teeth fly',
    bestCamera:'MEDIUM_SHOT',
    DNA:{ flexibility:6, aggression:10, balance:7, speed:8, acrobatics:4, combatStyle:9, silhouetteReadability:8 },
  },
  {
    id:'knee_strike', name:'Knee Strike', category:'FIGHTING', emoji:'🦵',
    artistDNA:'Neal Adams close-combat · Green Lantern era',
    lineOfAction:'Upward diagonal — planted foot, knee drives',
    silhouetteShape:'Rising triangle — knee apex at top',
    motionLanguage:'Impact absorption by target · dust from ground · balance shift',
    bestCamera:'FULL_BODY',
    DNA:{ flexibility:7, aggression:9, balance:7, speed:7, acrobatics:5, combatStyle:8, silhouetteReadability:7 },
  },
  {
    id:'roundhouse_kick', name:'Roundhouse Kick', category:'FIGHTING', emoji:'🦶',
    artistDNA:'Joe Madureira X-Men · Asian martial arts influence',
    lineOfAction:'Horizontal arc — full body rotation',
    silhouetteShape:'Horizontal bar — kick leg horizontal',
    motionLanguage:'Speed arc on leg · pivot dust · cloth trails',
    bestCamera:'FULL_BODY',
    DNA:{ flexibility:9, aggression:9, balance:6, speed:9, acrobatics:8, combatStyle:9, silhouetteReadability:9 },
  },
  {
    id:'sword_slash', name:'Sword Slash', category:'FIGHTING', emoji:'⚔️',
    artistDNA:'Neal Adams Deadman sword work · Chris Bachalo',
    lineOfAction:'Diagonal slash — weapon leads, body follows',
    silhouetteShape:'X or diagonal — body opposed to sword line',
    motionLanguage:'Blade trail arc · sparks at impact · cloth shreds',
    bestCamera:'DUTCH_ANGLE',
    DNA:{ flexibility:7, aggression:9, balance:7, speed:8, acrobatics:6, combatStyle:10, silhouetteReadability:9 },
  },
  {
    id:'spear_thrust', name:'Spear Thrust', category:'FIGHTING', emoji:'🏹',
    artistDNA:'Walt Simonson Asgardian combat · George Pérez',
    lineOfAction:'Horizontal straight — lunging extension',
    silhouetteShape:'Horizontal line — body in lunge',
    motionLanguage:'Front foot slides · dust streak · tip foreshortened',
    bestCamera:'MEDIUM_SHOT',
    DNA:{ flexibility:6, aggression:8, balance:7, speed:7, acrobatics:4, combatStyle:8, silhouetteReadability:8 },
  },
  {
    id:'axe_swing', name:'Axe Swing', category:'FIGHTING', emoji:'🪓',
    artistDNA:'Walt Simonson Thor runs · Simonson Stormbreaker',
    lineOfAction:'Descending diagonal — overhead to ground',
    silhouetteShape:'Inverted triangle — arms high, wide arc',
    motionLanguage:'Ground crack on impact · shockwave · debris fly',
    bestCamera:'CINEMATIC_LOW_ANGLE',
    DNA:{ flexibility:5, aggression:10, balance:7, speed:7, acrobatics:3, combatStyle:8, silhouetteReadability:9 },
  },
  {
    id:'shield_block', name:'Shield Block', category:'FIGHTING', emoji:'🛡️',
    artistDNA:'John Byrne Captain America · Neal Adams',
    lineOfAction:'Angled brace — weight back, shield arm forward',
    silhouetteShape:'Leaning rectangle — shield as vertical element',
    motionLanguage:'Impact wave spreads from shield face · sparks',
    bestCamera:'OVER_SHOULDER',
    DNA:{ flexibility:5, aggression:4, balance:9, speed:5, acrobatics:4, combatStyle:9, silhouetteReadability:8 },
  },
  {
    id:'grapple_throw', name:'Grapple Throw', category:'FIGHTING', emoji:'🤼',
    artistDNA:'Neal Adams wrestling technique · Romita Spidey',
    lineOfAction:'Circular — attacker pivots, target arcs',
    silhouetteShape:'Two-body circle — one airborne',
    motionLanguage:"Target's feet leave ground · fabric tears · blur",
    bestCamera:'WIDE_SHOT',
    DNA:{ flexibility:8, aggression:8, balance:8, speed:7, acrobatics:7, combatStyle:9, silhouetteReadability:8 },
  },

  // ── ACROBATICS (10) — McFarlane · Romita Jr ──────────────────────────────
  {
    id:'wall_leap', name:'Wall Leap', category:'ACROBATICS', emoji:'🧱',
    artistDNA:"McFarlane Spider-Man · Romita Jr Daredevil rooftop",
    lineOfAction:'Vertical push-off — legs drive from wall',
    silhouetteShape:'Diagonal arc — body compressed then extended',
    motionLanguage:'Wall crack at push point · limbs trail',
    bestCamera:'FULL_BODY',
    DNA:{ flexibility:9, aggression:5, balance:8, speed:9, acrobatics:10, combatStyle:5, silhouetteReadability:8 },
  },
  {
    id:'front_flip', name:'Front Flip', category:'ACROBATICS', emoji:'🤸',
    artistDNA:'McFarlane gymnastic anatomy · Joe Mad acrobatics',
    lineOfAction:'Forward rotating circle — tuck position',
    silhouetteShape:'O-circle — tight tuck',
    motionLanguage:'Ghost frames of rotation · hair streams · trajectory arc',
    bestCamera:'FULL_BODY',
    DNA:{ flexibility:10, aggression:4, balance:7, speed:8, acrobatics:10, combatStyle:4, silhouetteReadability:8 },
  },
  {
    id:'back_flip', name:'Back Flip', category:'ACROBATICS', emoji:'🔄',
    artistDNA:'McFarlane Spidey dodging · Nightcrawler teleport',
    lineOfAction:'Backward rotating arc — arched through air',
    silhouetteShape:'Inverted arch — back arched maximum',
    motionLanguage:'Previous position ghost · escape trail · hair arc',
    bestCamera:'FULL_BODY',
    DNA:{ flexibility:10, aggression:3, balance:7, speed:8, acrobatics:10, combatStyle:3, silhouetteReadability:9 },
  },
  {
    id:'swinging', name:'Swinging', category:'ACROBATICS', emoji:'🕸️',
    artistDNA:'McFarlane web-swing · Amazing Spider-Man iconic',
    lineOfAction:'Pendulum arc — body hangs below attachment',
    silhouetteShape:'Pendulum — arms up, body drops',
    motionLanguage:'Web taut at top · city blurs below · wind-blown hair',
    bestCamera:'WORM_EYE_VIEW',
    DNA:{ flexibility:9, aggression:4, balance:8, speed:9, acrobatics:10, combatStyle:4, silhouetteReadability:10 },
  },
  {
    id:'rooftop_jump', name:'Rooftop Jump', category:'ACROBATICS', emoji:'🏙️',
    artistDNA:'Romita Jr Daredevil · McFarlane city Spidey',
    lineOfAction:'Upward diagonal — pushing off ledge',
    silhouetteShape:'Upward arrow — body stretched tall',
    motionLanguage:'Ledge crumbles · city below establishes height',
    bestCamera:'WIDE_SHOT',
    DNA:{ flexibility:8, aggression:4, balance:7, speed:8, acrobatics:9, combatStyle:4, silhouetteReadability:8 },
  },
  {
    id:'dive_roll', name:'Dive Roll', category:'ACROBATICS', emoji:'🌀',
    artistDNA:'Neal Adams evasion technique · McFarlane dodge',
    lineOfAction:'Diagonal diving — shoulder leads',
    silhouetteShape:'Compressed diagonal — rolling mass',
    motionLanguage:'Dust burst at roll point · speed trail',
    bestCamera:'FULL_BODY',
    DNA:{ flexibility:9, aggression:3, balance:6, speed:8, acrobatics:9, combatStyle:5, silhouetteReadability:7 },
  },
  {
    id:'mid_air_twist', name:'Mid-Air Twist', category:'ACROBATICS', emoji:'💫',
    artistDNA:'McFarlane Spidey contortions · impossible anatomy',
    lineOfAction:'Spiral — rotating around central axis',
    silhouetteShape:'Dynamic diagonal — asymmetric limbs',
    motionLanguage:'Multiple ghost positions · rotational blur',
    bestCamera:'FULL_BODY',
    DNA:{ flexibility:10, aggression:4, balance:5, speed:8, acrobatics:10, combatStyle:4, silhouetteReadability:7 },
  },
  {
    id:'landing_recovery', name:'Landing Recovery', category:'ACROBATICS', emoji:'🫷',
    artistDNA:'Kirby hero landing · Alex Ross triumphant recovery',
    lineOfAction:'Compressed downward → rising S-curve',
    silhouetteShape:'Triangle → expanding stance',
    motionLanguage:'Crater impact · dust radiates · cape settles',
    bestCamera:'WORM_EYE_VIEW',
    DNA:{ flexibility:7, aggression:5, balance:9, speed:6, acrobatics:7, combatStyle:5, silhouetteReadability:9 },
  },
  {
    id:'slide_dodge', name:'Slide Dodge', category:'ACROBATICS', emoji:'⚡',
    artistDNA:'Romita Jr Wolverine · McFarlane evasion',
    lineOfAction:'Horizontal low diagonal — body parallel to ground',
    silhouetteShape:'Horizontal slim — low to earth',
    motionLanguage:'Dirt slash under body · hair streams · opponent miss',
    bestCamera:'FULL_BODY',
    DNA:{ flexibility:9, aggression:3, balance:6, speed:9, acrobatics:9, combatStyle:5, silhouetteReadability:8 },
  },
  {
    id:'vault', name:'Vault', category:'ACROBATICS', emoji:'🏃',
    artistDNA:'Nightcrawler acrobatics · Gambit agility',
    lineOfAction:'Horizontal arc — hands plant, legs sweep over',
    silhouetteShape:'Inverted V — hands grounded, legs airborne',
    motionLanguage:'Hand plant dust · legs blur above obstacle',
    bestCamera:'FULL_BODY',
    DNA:{ flexibility:9, aggression:3, balance:8, speed:8, acrobatics:9, combatStyle:4, silhouetteReadability:7 },
  },

  // ── CINEMATIC (10) — Frank Miller · Bryan Hitch ──────────────────────────
  {
    id:'walking_to_camera', name:'Walking to Camera', category:'CINEMATIC', emoji:'🚶',
    artistDNA:"Bryan Hitch Ultimates · Frank Miller Batman Year One",
    lineOfAction:'Straight vertical — deliberate forward lean',
    silhouetteShape:'Rectangle narrowing to point at camera',
    motionLanguage:'Ground reflects neon · suit details sharp · unflinching gaze',
    bestCamera:'CINEMATIC_LOW_ANGLE',
    DNA:{ flexibility:4, aggression:6, balance:9, speed:3, acrobatics:3, combatStyle:5, silhouetteReadability:9 },
  },
  {
    id:'looking_over_shoulder', name:'Looking Over Shoulder', category:'CINEMATIC', emoji:'👀',
    artistDNA:'Frank Miller Sin City · Alex Ross painted noir',
    lineOfAction:'Slight twist — body faces away, head turns',
    silhouetteShape:'S-twist — body away, face toward reader',
    motionLanguage:'Shadow covers half face · light catches eye only',
    bestCamera:'OVER_SHOULDER',
    DNA:{ flexibility:5, aggression:3, balance:8, speed:2, acrobatics:3, combatStyle:4, silhouetteReadability:8 },
  },
  {
    id:'standing_in_rain', name:'Standing in Rain', category:'CINEMATIC', emoji:'🌧️',
    artistDNA:'Frank Miller Daredevil rain · Jim Lee rain staging',
    lineOfAction:'Straight vertical — unmoving in storm',
    silhouetteShape:'Strong column — rain lines add vertical rhythm',
    motionLanguage:'Rain streaks · puddle reflections · steam rising',
    bestCamera:'FULL_BODY',
    DNA:{ flexibility:3, aggression:4, balance:9, speed:1, acrobatics:2, combatStyle:4, silhouetteReadability:9 },
  },
  {
    id:'silent_threat', name:'Silent Threat', category:'CINEMATIC', emoji:'😶',
    artistDNA:'Frank Miller Batman · Jock Black Mirror',
    lineOfAction:'Slightly forward lean — predator stillness',
    silhouetteShape:'Compact dominant — fills lower frame',
    motionLanguage:'Shadow engulfs frame · costume details sharp · breath vapor',
    bestCamera:'CLOSE_UP',
    DNA:{ flexibility:4, aggression:7, balance:9, speed:2, acrobatics:2, combatStyle:7, silhouetteReadability:10 },
  },
  {
    id:'villain_throne', name:'Villain Throne', category:'CINEMATIC', emoji:'👑',
    artistDNA:'Jim Lee Magneto throne · Pérez Thanos seated',
    lineOfAction:'Relaxed S — dominant but lazy',
    silhouetteShape:'Wide seated triangle — elbows on armrests',
    motionLanguage:'Throne frames character · distant subordinates · dramatic lighting',
    bestCamera:'BIRD_EYE_VIEW',
    DNA:{ flexibility:3, aggression:7, balance:9, speed:1, acrobatics:1, combatStyle:6, silhouetteReadability:10 },
  },
  {
    id:'team_lineup', name:'Team Lineup', category:'CINEMATIC', emoji:'🦸',
    artistDNA:'Jim Lee X-Men lineup · Pérez New Teen Titans',
    lineOfAction:'Multiple S-curves — staggered depth',
    silhouetteShape:'Composite triangle — tallest center',
    motionLanguage:'Wind catches capes simultaneously · Z-pattern reads left to right',
    bestCamera:'WIDE_SHOT',
    DNA:{ flexibility:5, aggression:5, balance:9, speed:3, acrobatics:4, combatStyle:5, silhouetteReadability:10 },
  },
  {
    id:'backlit_entrance', name:'Backlit Entrance', category:'CINEMATIC', emoji:'🚪',
    artistDNA:'Frank Miller Batman · Jock Batman The Black Mirror',
    lineOfAction:'Vertical — character fills doorway/portal',
    silhouetteShape:'Pure silhouette — no interior detail readable',
    motionLanguage:'Light halos edge only · fog or smoke · floor glow',
    bestCamera:'ESTABLISHING_SHOT',
    DNA:{ flexibility:4, aggression:5, balance:8, speed:2, acrobatics:2, combatStyle:5, silhouetteReadability:10 },
  },
  {
    id:'slow_turn_reveal', name:'Slow Turn Reveal', category:'CINEMATIC', emoji:'🔄',
    artistDNA:'Bryan Hitch slow-build reveals · Olivier Coipel Thor',
    lineOfAction:'Gradual rotation — 3/4 to full face',
    silhouetteShape:'Transitional — mid-turn dynamic twist',
    motionLanguage:'Cape mid-swing · multiple panels implied · hair trails',
    bestCamera:'MEDIUM_SHOT',
    DNA:{ flexibility:5, aggression:4, balance:8, speed:2, acrobatics:3, combatStyle:4, silhouetteReadability:8 },
  },
  {
    id:'power_awakening', name:'Power Awakening', category:'CINEMATIC', emoji:'💥',
    artistDNA:'Jim Lee Jean Grey Phoenix · Kirby Galactus reveal',
    lineOfAction:'Radial — energy erupts from center outward',
    silhouetteShape:'Star burst — limbs radiate from core',
    motionLanguage:'Energy shreds clothing · shockwave · environmental destruction',
    bestCamera:'WIDE_SHOT',
    DNA:{ flexibility:6, aggression:7, balance:5, speed:5, acrobatics:5, combatStyle:5, silhouetteReadability:9 },
  },
  {
    id:'final_stand', name:'Final Stand', category:'CINEMATIC', emoji:'⚔️',
    artistDNA:'Alex Ross Kingdom Come · Bryan Hitch Ultimates finale',
    lineOfAction:'S-curve — weary but unbroken',
    silhouetteShape:'Wounded hero — asymmetric, weight favored',
    motionLanguage:'Battle damage visible · light from behind · lone figure',
    bestCamera:'WIDE_SHOT',
    DNA:{ flexibility:5, aggression:7, balance:7, speed:3, acrobatics:3, combatStyle:8, silhouetteReadability:10 },
  },

  // ── EMOTIONAL (10) — Neal Adams · Frank Miller ────────────────────────────
  {
    id:'grieving', name:'Grieving', category:'EMOTIONAL', emoji:'😭',
    artistDNA:'Neal Adams Green Lantern/Arrow · Jim Aparo',
    lineOfAction:'C-curve inward — full body collapses',
    silhouetteShape:'Compressed round — no strong edge',
    motionLanguage:'Shoulders shake · head drops · hands cover face',
    bestCamera:'CLOSE_UP',
    DNA:{ flexibility:5, aggression:1, balance:5, speed:1, acrobatics:2, combatStyle:1, silhouetteReadability:6 },
  },
  {
    id:'angry_scream', name:'Angry Scream', category:'EMOTIONAL', emoji:'😡',
    artistDNA:'Neal Adams Hulk rage · Walt Simonson Thor',
    lineOfAction:'S-curve explosive — backward arch, arms out',
    silhouetteShape:'Radial expansion — maximum size',
    motionLanguage:'Sound wave rings · veins · surrounding destruction',
    bestCamera:'CLOSE_UP',
    DNA:{ flexibility:6, aggression:9, balance:5, speed:4, acrobatics:3, combatStyle:5, silhouetteReadability:8 },
  },
  {
    id:'fear_pose', name:'Fear', category:'EMOTIONAL', emoji:'😱',
    artistDNA:'Neal Adams fear anatomy · David Mazzucchelli',
    lineOfAction:'C-curve away — body retreats from threat',
    silhouetteShape:'Compressed backward lean',
    motionLanguage:'Eyes wide · hands raised · shadow surrounds',
    bestCamera:'CLOSE_UP',
    DNA:{ flexibility:5, aggression:1, balance:4, speed:5, acrobatics:4, combatStyle:1, silhouetteReadability:6 },
  },
  {
    id:'shock_pose', name:'Shock', category:'EMOTIONAL', emoji:'😲',
    artistDNA:'George Pérez revelation panels · Neal Adams',
    lineOfAction:'Straight vertical — rigid freeze',
    silhouetteShape:'Frozen column — stiff limbs',
    motionLanguage:'Motion stops dead · sweat fly · eyes max-open',
    bestCamera:'MEDIUM_SHOT',
    DNA:{ flexibility:3, aggression:1, balance:7, speed:1, acrobatics:1, combatStyle:1, silhouetteReadability:6 },
  },
  {
    id:'determination', name:'Determination', category:'EMOTIONAL', emoji:'😤',
    artistDNA:'Alex Ross Superman · Neal Adams Green Arrow',
    lineOfAction:'Forward lean — chin down, eyes up',
    silhouetteShape:'Forward-leaning wedge',
    motionLanguage:'Fists clench · jaw set · eyes narrow on target',
    bestCamera:'CLOSE_UP',
    DNA:{ flexibility:5, aggression:7, balance:8, speed:3, acrobatics:3, combatStyle:6, silhouetteReadability:8 },
  },
  {
    id:'evil_smile', name:'Evil Smile', category:'EMOTIONAL', emoji:'😈',
    artistDNA:'Frank Miller Joker · Mike Mignola villain close-ups',
    lineOfAction:'Slight forward lean — predatory stillness',
    silhouetteShape:'Triangular — sharp chin, high collar',
    motionLanguage:'Half-shadow face · single light source · cold eyes',
    bestCamera:'EXTREME_CLOSE_UP',
    DNA:{ flexibility:4, aggression:6, balance:8, speed:1, acrobatics:1, combatStyle:5, silhouetteReadability:8 },
  },
  {
    id:'exhausted', name:'Exhausted', category:'EMOTIONAL', emoji:'😮‍💨',
    artistDNA:'Neal Adams post-battle · Frank Miller Sin City',
    lineOfAction:'C-curve down — full weight collapse',
    silhouetteShape:'Slumped — weight seeks lowest point',
    motionLanguage:'Steam breath · torn costume · hands on knees',
    bestCamera:'MEDIUM_SHOT',
    DNA:{ flexibility:4, aggression:2, balance:4, speed:1, acrobatics:2, combatStyle:2, silhouetteReadability:6 },
  },
  {
    id:'defeated', name:'Defeated', category:'EMOTIONAL', emoji:'😞',
    artistDNA:'Neal Adams hero in crisis · Alex Ross Kingdom Come',
    lineOfAction:'Straight down — gravity wins',
    silhouetteShape:'Collapsed heap — no heroic line',
    motionLanguage:'Face to ground · symbol obscured · rubble around',
    bestCamera:'BIRD_EYE_VIEW',
    DNA:{ flexibility:3, aggression:1, balance:3, speed:1, acrobatics:1, combatStyle:1, silhouetteReadability:5 },
  },
  {
    id:'hopeful', name:'Hopeful', category:'EMOTIONAL', emoji:'🌟',
    artistDNA:'Alex Ross painted optimism · Curt Swan Superman',
    lineOfAction:'Gentle S-curve — open chest, gaze up',
    silhouetteShape:'Open upward V — welcoming stance',
    motionLanguage:'Light source from above · calm environment · slight smile',
    bestCamera:'MEDIUM_SHOT',
    DNA:{ flexibility:5, aggression:2, balance:8, speed:2, acrobatics:3, combatStyle:2, silhouetteReadability:7 },
  },
  {
    id:'rage_transformation', name:'Rage Transformation', category:'EMOTIONAL', emoji:'💢',
    artistDNA:'Neal Adams Hulk origin · Peter David Hulk runs',
    lineOfAction:'Explosive radial — body expands in all directions',
    silhouetteShape:'Growing irregular — tearing through normal silhouette',
    motionLanguage:'Clothes rip · skin color shifts · shockwave · environment reacts',
    bestCamera:'WIDE_SHOT',
    DNA:{ flexibility:5, aggression:10, balance:4, speed:5, acrobatics:3, combatStyle:6, silhouetteReadability:9 },
  },

  // ── TEAM (7) — George Pérez · Jim Lee ────────────────────────────────────
  {
    id:'back_to_back', name:'Back to Back', category:'TEAM', emoji:'🤜🤛',
    artistDNA:'Jim Lee X-Men pairs · Pérez hero duos',
    lineOfAction:'Two opposing S-curves — mirrored',
    silhouetteShape:'Double column — fused center, splayed edges',
    motionLanguage:'Surrounded enemies · both ready · clear space between pair',
    bestCamera:'WIDE_SHOT',
    DNA:{ flexibility:6, aggression:7, balance:9, speed:4, acrobatics:5, combatStyle:7, silhouetteReadability:9 },
  },
  {
    id:'team_charge', name:'Team Charge', category:'TEAM', emoji:'⚡',
    artistDNA:'Pérez New Teen Titans charge · Bryan Hitch Ultimates',
    lineOfAction:'Unified diagonal — all lean same direction',
    silhouetteShape:'Wedge composite — tallest at back, shortest at point',
    motionLanguage:'Ground tears · unified speed lines · battle cry implied',
    bestCamera:'CINEMATIC_LOW_ANGLE',
    DNA:{ flexibility:6, aggression:9, balance:7, speed:8, acrobatics:5, combatStyle:7, silhouetteReadability:9 },
  },
  {
    id:'circle_formation', name:'Circle Formation', category:'TEAM', emoji:'⭕',
    artistDNA:'Pérez Avengers assemble · Jim Lee X-Men circle',
    lineOfAction:'Radial — all face outward from center',
    silhouetteShape:'Crown — figures spaced around circle',
    motionLanguage:'Each character covers a zone · enemy surrounds · tension peak',
    bestCamera:'BIRD_EYE_VIEW',
    DNA:{ flexibility:5, aggression:7, balance:9, speed:3, acrobatics:4, combatStyle:7, silhouetteReadability:10 },
  },
  {
    id:'last_stand', name:'Last Stand', category:'TEAM', emoji:'🏴',
    artistDNA:'Alex Ross Kingdom Come · Bryan Hitch final pages',
    lineOfAction:'Unified S-curves — battered but standing',
    silhouetteShape:'Irregular wall — battle-worn but solid',
    motionLanguage:'Wreckage behind · sky dramatic · all wounded · defiant',
    bestCamera:'WIDE_SHOT',
    DNA:{ flexibility:4, aggression:7, balance:7, speed:3, acrobatics:3, combatStyle:7, silhouetteReadability:10 },
  },
  {
    id:'group_leap', name:'Group Leap', category:'TEAM', emoji:'🚀',
    artistDNA:'Pérez Teen Titans · Joe Mad X-Force',
    lineOfAction:'Unified diagonal upward — synchronized',
    silhouetteShape:'Ascending starburst — multiple arcs',
    motionLanguage:'Synchronized launch · environment reaction · air displacement',
    bestCamera:'WIDE_SHOT',
    DNA:{ flexibility:7, aggression:6, balance:6, speed:8, acrobatics:7, combatStyle:5, silhouetteReadability:8 },
  },
  {
    id:'tactical_formation', name:'Tactical Formation', category:'TEAM', emoji:'🗺️',
    artistDNA:'Bryan Hitch Ultimates military staging · Pérez',
    lineOfAction:'Geometric — deliberate positioning, no overlap',
    silhouetteShape:'Staggered grid — each figure reads individually',
    motionLanguage:'Pointing / signaling · focused gazes · environment scouted',
    bestCamera:'WIDE_SHOT',
    DNA:{ flexibility:5, aggression:5, balance:9, speed:3, acrobatics:3, combatStyle:8, silhouetteReadability:9 },
  },
  {
    id:'hero_villain_faceoff', name:'Hero vs Villain Face-Off', category:'TEAM', emoji:'⚔️',
    artistDNA:'Jim Lee Batman vs Joker · Pérez classic clashes',
    lineOfAction:'Two opposing forces — mirror tension',
    silhouetteShape:'Double triangle — pointed at each other',
    motionLanguage:'Space between charged · wind stops · environment waits',
    bestCamera:'WIDE_SHOT',
    DNA:{ flexibility:6, aggression:8, balance:8, speed:3, acrobatics:4, combatStyle:8, silhouetteReadability:10 },
  },

  // ── CREATURE (8) — Mignola · Walt Simonson ────────────────────────────────
  {
    id:'beast_crawl', name:'Beast Crawl', category:'CREATURE', emoji:'🐾',
    artistDNA:'Mignola Hellboy monsters · Bernie Wrightson',
    lineOfAction:'Horizontal forward — belly low, head up',
    silhouetteShape:'Horizontal predator — wide and low',
    motionLanguage:'Claws dig ground · eyes glow · breath visible',
    bestCamera:'FULL_BODY',
    DNA:{ flexibility:8, aggression:8, balance:8, speed:7, acrobatics:6, combatStyle:7, silhouetteReadability:8 },
  },
  {
    id:'roaring', name:'Roaring', category:'CREATURE', emoji:'😤',
    artistDNA:'Simonson Beta Ray Bill · Mignola creature mouths',
    lineOfAction:'Backward S — head thrown back, chest forward',
    silhouetteShape:'Open radial — mouth gapes, limbs wide',
    motionLanguage:'Shockwave rings · smaller objects repelled · sonic distortion',
    bestCamera:'CLOSE_UP',
    DNA:{ flexibility:5, aggression:9, balance:5, speed:3, acrobatics:3, combatStyle:6, silhouetteReadability:9 },
  },
  {
    id:'predator_leap', name:'Predator Leap', category:'CREATURE', emoji:'🐆',
    artistDNA:'Mignola monster hunts · Wrightson Swamp Thing',
    lineOfAction:'Diagonal arrow — all mass forward',
    silhouetteShape:'Horizontal spear — elongated in flight',
    motionLanguage:'Ground impact launching · target in foreground · air displaced',
    bestCamera:'DUTCH_ANGLE',
    DNA:{ flexibility:9, aggression:10, balance:5, speed:9, acrobatics:8, combatStyle:8, silhouetteReadability:8 },
  },
  {
    id:'giant_smash', name:'Giant Smash', category:'CREATURE', emoji:'💥',
    artistDNA:'Simonson Surtur · Kirby Galactus scale',
    lineOfAction:'Downward diagonal — fist or foot descends',
    silhouetteShape:'Inverted pyramid — mass at top, point of impact',
    motionLanguage:'Ground shatters · buildings bow · shockwave radius',
    bestCamera:'WORM_EYE_VIEW',
    DNA:{ flexibility:3, aggression:10, balance:6, speed:6, acrobatics:2, combatStyle:7, silhouetteReadability:9 },
  },
  {
    id:'claw_attack', name:'Claw Attack', category:'CREATURE', emoji:'🦅',
    artistDNA:'Mignola talons · Jim Lee Wolverine unsheathe',
    lineOfAction:'Diagonal slice — arm leads, claws at tip',
    silhouetteShape:'Fan-shape at tip — fingers/claws splayed',
    motionLanguage:'Air slash trail · fabric tears · target recoils',
    bestCamera:'CLOSE_UP',
    DNA:{ flexibility:8, aggression:10, balance:6, speed:9, acrobatics:5, combatStyle:9, silhouetteReadability:9 },
  },
  {
    id:'tentacle_reach', name:'Tentacle Reach', category:'CREATURE', emoji:'🐙',
    artistDNA:'Mignola Cthulhu influences · Sienkiewicz abstract',
    lineOfAction:'Radiating curves — multiple reaching arms',
    silhouetteShape:'Star burst with curves — irregular',
    motionLanguage:'Environmental wrap · water or slime drips · victims struggle',
    bestCamera:'WIDE_SHOT',
    DNA:{ flexibility:10, aggression:8, balance:7, speed:6, acrobatics:6, combatStyle:7, silhouetteReadability:8 },
  },
  {
    id:'wing_expansion', name:'Wing Expansion', category:'CREATURE', emoji:'🦅',
    artistDNA:'Simonson Angel · Mignola demon wings',
    lineOfAction:'Radial horizontal — wingspan maximum',
    silhouetteShape:'Wide horizontal W — wings dominate',
    motionLanguage:'Wind blast from wing beat · environment bends · debris flies',
    bestCamera:'WIDE_SHOT',
    DNA:{ flexibility:7, aggression:7, balance:7, speed:6, acrobatics:6, combatStyle:6, silhouetteReadability:10 },
  },
  {
    id:'monster_stomp', name:'Monster Stomp', category:'CREATURE', emoji:'👣',
    artistDNA:'Kirby Fin Fang Foom · Simonson Surtur',
    lineOfAction:'Straight down — vertical gravity',
    silhouetteShape:'Vertical descending mass — foot foremost',
    motionLanguage:'Ground crater pre-impact · buildings in background for scale',
    bestCamera:'WORM_EYE_VIEW',
    DNA:{ flexibility:3, aggression:10, balance:7, speed:5, acrobatics:1, combatStyle:6, silhouetteReadability:9 },
  },

  // ── MAGIC (7) — Simonson · Mignola · Van Sciver ──────────────────────────
  {
    id:'spell_casting', name:'Spell Casting', category:'MAGIC', emoji:'🔮',
    artistDNA:'Steve Ditko Doctor Strange · Van Sciver GL energy',
    lineOfAction:'Circular — hands trace the spell pattern',
    silhouetteShape:'Open gesture — hands apart, energy between',
    motionLanguage:'Runes appear · energy tendrils · ambient light shifts color',
    bestCamera:'MEDIUM_SHOT',
    DNA:{ flexibility:6, aggression:5, balance:8, speed:4, acrobatics:3, combatStyle:6, silhouetteReadability:8 },
  },
  {
    id:'summoning', name:'Summoning', category:'MAGIC', emoji:'📜',
    artistDNA:'Mignola Hellboy rituals · Simonson Asgardian magic',
    lineOfAction:'Upward reach — arms raised, offering gesture',
    silhouetteShape:'Inverted triangle — arms up, energy descends',
    motionLanguage:'Portal opens above · energy pours down · ground glows',
    bestCamera:'WIDE_SHOT',
    DNA:{ flexibility:5, aggression:4, balance:7, speed:3, acrobatics:3, combatStyle:5, silhouetteReadability:8 },
  },
  {
    id:'energy_orb', name:'Energy Orb', category:'MAGIC', emoji:'🌀',
    artistDNA:'Van Sciver GL constructs · Ditko Strange energy',
    lineOfAction:'Centered radial — orb held between hands',
    silhouetteShape:'Compressed — hands cup ball of light',
    motionLanguage:'Orb pulses · color shifts · wind spirals inward',
    bestCamera:'CLOSE_UP',
    DNA:{ flexibility:5, aggression:6, balance:8, speed:4, acrobatics:3, combatStyle:6, silhouetteReadability:7 },
  },
  {
    id:'floating_meditation', name:'Floating Meditation', category:'MAGIC', emoji:'🧘',
    artistDNA:'Ditko Doctor Strange astral · Alan Davis',
    lineOfAction:'Perfectly vertical — gravity ignored',
    silhouetteShape:'Cross — arms outstretched, legs folded',
    motionLanguage:'Ground is far below · ambient energy field · calm face',
    bestCamera:'FULL_BODY',
    DNA:{ flexibility:7, aggression:2, balance:10, speed:1, acrobatics:4, combatStyle:3, silhouetteReadability:8 },
  },
  {
    id:'portal_opening', name:'Portal Opening', category:'MAGIC', emoji:'🌀',
    artistDNA:'Ditko dimension hops · Simonson Bifrost',
    lineOfAction:'Diagonal lean — hand pressed into portal',
    silhouetteShape:'Arch framing — portal larger than figure',
    motionLanguage:'Space-time tears · other dimension visible · wind pulls inward',
    bestCamera:'WIDE_SHOT',
    DNA:{ flexibility:5, aggression:4, balance:7, speed:3, acrobatics:3, combatStyle:4, silhouetteReadability:9 },
  },
  {
    id:'staff_slam', name:'Staff Slam', category:'MAGIC', emoji:'🪄',
    artistDNA:'Simonson Thor hammer down · Pérez Wonder Woman',
    lineOfAction:'Downward diagonal — staff leads vertical',
    silhouetteShape:'Diagonal cross — staff and body form X',
    motionLanguage:'Ground cracks at impact · energy radiates from tip',
    bestCamera:'CINEMATIC_LOW_ANGLE',
    DNA:{ flexibility:6, aggression:8, balance:7, speed:7, acrobatics:4, combatStyle:7, silhouetteReadability:8 },
  },
  {
    id:'rune_activation', name:'Rune Activation', category:'MAGIC', emoji:'✦',
    artistDNA:'Simonson Asgardian runes · Mignola occult panels',
    lineOfAction:'Radiating from hand — outward burst',
    silhouetteShape:'Starburst — runes appear around figure',
    motionLanguage:'Symbols ignite · environment reacts · reality bends',
    bestCamera:'MEDIUM_SHOT',
    DNA:{ flexibility:5, aggression:5, balance:8, speed:3, acrobatics:2, combatStyle:5, silhouetteReadability:7 },
  },

  // ── WEAPON (8) — Neal Adams · Romita Jr ──────────────────────────────────
  {
    id:'gun_draw', name:'Gun Draw', category:'WEAPON', emoji:'🔫',
    artistDNA:"Romita Jr Punisher · Frank Miller Sin City gun work",
    lineOfAction:'Vertical rise → diagonal aim',
    silhouetteShape:'Triangle — elbow out, barrel points',
    motionLanguage:'Motion blur on draw · holster empty · target framed',
    bestCamera:'OVER_SHOULDER',
    DNA:{ flexibility:6, aggression:8, balance:8, speed:9, acrobatics:4, combatStyle:9, silhouetteReadability:8 },
  },
  {
    id:'reload', name:'Reload', category:'WEAPON', emoji:'🔧',
    artistDNA:'Romita Jr gritty realism · Brian Michael Bendis era',
    lineOfAction:'Bent focus — eyes on magazine, hands work',
    silhouetteShape:'Compact — concentrated on task',
    motionLanguage:'Shell casings fall · smoke curls · grim expression',
    bestCamera:'CLOSE_UP',
    DNA:{ flexibility:5, aggression:5, balance:7, speed:4, acrobatics:3, combatStyle:8, silhouetteReadability:6 },
  },
  {
    id:'sniper_aim', name:'Sniper Aim', category:'WEAPON', emoji:'🎯',
    artistDNA:'Romita Jr Ultimate Hawkeye · Frank Miller precision',
    lineOfAction:'Horizontal straight — rifle extends to target',
    silhouetteShape:'Elongated horizontal — flat profile',
    motionLanguage:'Crosshair POV overlay · held breath · long distance implied',
    bestCamera:'OVER_SHOULDER',
    DNA:{ flexibility:6, aggression:7, balance:9, speed:3, acrobatics:3, combatStyle:9, silhouetteReadability:7 },
  },
  {
    id:'dual_pistols', name:'Dual Pistols', category:'WEAPON', emoji:'🔫',
    artistDNA:'Romita Punisher · Deadpool 90s action aesthetic',
    lineOfAction:'Wide X — both arms extended outward',
    silhouetteShape:'Wide T — arms horizontal, guns at tips',
    motionLanguage:'Both barrels fire simultaneously · shell casings arc · smoke fills',
    bestCamera:'CINEMATIC_LOW_ANGLE',
    DNA:{ flexibility:6, aggression:9, balance:7, speed:8, acrobatics:5, combatStyle:9, silhouetteReadability:9 },
  },
  {
    id:'sword_draw', name:'Sword Draw', category:'WEAPON', emoji:'🗡️',
    artistDNA:'Neal Adams Deadpool · Joe Mad sword-focused panels',
    lineOfAction:'Upward diagonal — blade clears sheath',
    silhouetteShape:'Diagonal accent — blade line creates dynamic',
    motionLanguage:'Blade ring sound implied · flash of reflection · cloth disturbed',
    bestCamera:'MEDIUM_SHOT',
    DNA:{ flexibility:7, aggression:7, balance:8, speed:8, acrobatics:5, combatStyle:9, silhouetteReadability:8 },
  },
  {
    id:'katana_dash', name:'Katana Dash', category:'WEAPON', emoji:'⚡',
    artistDNA:'Joe Mad ninja aesthetic · McFarlane Spawn blades',
    lineOfAction:'Diagonal pass-through — fastest arc possible',
    silhouetteShape:'Diagonal slash — barely readable mid-motion',
    motionLanguage:'After-image trail · fabric split · target stands stunned',
    bestCamera:'ACTION_TRACKING',
    DNA:{ flexibility:9, aggression:9, balance:7, speed:10, acrobatics:7, combatStyle:10, silhouetteReadability:7 },
  },
  {
    id:'bow_draw', name:'Bow Draw', category:'WEAPON', emoji:'🏹',
    artistDNA:'Neal Adams Green Arrow · Mike Grell Longbow Hunters',
    lineOfAction:'Horizontal extension — arrow to cheek',
    silhouetteShape:'Wide T — bowstring pulled to face',
    motionLanguage:'String tension visible · feathers straight · target framed',
    bestCamera:'OVER_SHOULDER',
    DNA:{ flexibility:7, aggression:7, balance:9, speed:5, acrobatics:4, combatStyle:8, silhouetteReadability:8 },
  },
  {
    id:'hammer_throw', name:'Hammer Throw', category:'WEAPON', emoji:'🔨',
    artistDNA:'Simonson Thor throws Mjolnir · Olivier Coipel',
    lineOfAction:'Circular wind-up → release diagonal',
    silhouetteShape:'Full rotational — arm arc at release',
    motionLanguage:'Lightning trail behind hammer · strap wraps wrist · thunder crack',
    bestCamera:'WIDE_SHOT',
    DNA:{ flexibility:7, aggression:9, balance:6, speed:8, acrobatics:5, combatStyle:8, silhouetteReadability:9 },
  },

  // ── STORYBOARD (10) — Bryan Hitch · Sienkiewicz ──────────────────────────
  {
    id:'crouching_sniper', name:'Crouching Sniper', category:'STORYBOARD', emoji:'🎯',
    artistDNA:'Frank Miller tactical · Romita Jr Punisher',
    lineOfAction:'Compressed horizontal — flat low profile',
    silhouetteShape:'L-shape low — head up, body horizontal',
    motionLanguage:'Scope glint · breath control · distant target implied',
    bestCamera:'OVER_SHOULDER',
    DNA:{ flexibility:7, aggression:6, balance:9, speed:2, acrobatics:4, combatStyle:8, silhouetteReadability:7 },
  },
  {
    id:'rooftop_lookout', name:'Rooftop Lookout', category:'STORYBOARD', emoji:'🏙️',
    artistDNA:'Frank Miller Batman rooftop · Jim Lee city staging',
    lineOfAction:'Slightly forward lean — scanning the city',
    silhouetteShape:'Strong vertical — against sky',
    motionLanguage:'Wind moves cape · city lights below · dawn or rain',
    bestCamera:'WIDE_SHOT',
    DNA:{ flexibility:4, aggression:3, balance:9, speed:1, acrobatics:2, combatStyle:4, silhouetteReadability:10 },
  },
  {
    id:'superhero_run', name:'Superhero Run', category:'STORYBOARD', emoji:'🏃',
    artistDNA:'Romita Sr Spider-Man run · Immonen dynamic runs',
    lineOfAction:'Strong forward diagonal — full commitment',
    silhouetteShape:'Dynamic diagonal — runner profile',
    motionLanguage:'Ground cracks under feet · air displaced · determined face',
    bestCamera:'ACTION_TRACKING',
    DNA:{ flexibility:7, aggression:7, balance:7, speed:9, acrobatics:6, combatStyle:5, silhouetteReadability:8 },
  },
  {
    id:'double_kick', name:'Double Kick', category:'STORYBOARD', emoji:'🦵',
    artistDNA:'Joe Mad X-Men combat · dynamic anatomy',
    lineOfAction:'Dual horizontal bars — both legs out',
    silhouetteShape:'Wide horizontal — both feet at tips',
    motionLanguage:'Two targets hit simultaneously · impossibly athletic',
    bestCamera:'FULL_BODY',
    DNA:{ flexibility:10, aggression:9, balance:4, speed:9, acrobatics:10, combatStyle:8, silhouetteReadability:9 },
  },
  {
    id:'cyborg_scan', name:'Cyborg Scan', category:'STORYBOARD', emoji:'🤖',
    artistDNA:'Romita Jr Iron Man HUD · Bryan Hitch tech staging',
    lineOfAction:'Slight forward lean — scanning gaze',
    silhouetteShape:'Upright rectangle — mechanical stillness',
    motionLanguage:'HUD overlay visible · targeting reticle · cold glow from eye',
    bestCamera:'CLOSE_UP',
    DNA:{ flexibility:4, aggression:5, balance:9, speed:3, acrobatics:2, combatStyle:7, silhouetteReadability:7 },
  },
  {
    id:'teleport_arrival', name:'Teleport Arrival', category:'STORYBOARD', emoji:'✨',
    artistDNA:'Nightcrawler BAMF · Simonson cosmic arrival',
    lineOfAction:'Radial burst from center point',
    silhouetteShape:'Starburst — energy from single point',
    motionLanguage:'Smoke puff at arrival · displaced air · ozone smell implied',
    bestCamera:'MEDIUM_SHOT',
    DNA:{ flexibility:6, aggression:4, balance:7, speed:8, acrobatics:5, combatStyle:4, silhouetteReadability:8 },
  },
  {
    id:'fist_to_ground', name:'Fist to Ground', category:'STORYBOARD', emoji:'✊',
    artistDNA:'Kirby Hulk ground pound · Pérez power demonstration',
    lineOfAction:'Straight downward — vertical force',
    silhouetteShape:'Inverted V — fist at apex of downstroke',
    motionLanguage:'Crater expands · shockwave ring · dust column rises',
    bestCamera:'WORM_EYE_VIEW',
    DNA:{ flexibility:4, aggression:10, balance:7, speed:7, acrobatics:3, combatStyle:7, silhouetteReadability:8 },
  },
  {
    id:'energy_charge', name:'Energy Charge', category:'STORYBOARD', emoji:'⚡',
    artistDNA:'Van Sciver Green Lantern charge · Kirby New Gods',
    lineOfAction:'Radial inward then outward — accumulate then release',
    silhouetteShape:'Compressed → expanding star',
    motionLanguage:'Energy pulls inward · environment distorts · explosion imminent',
    bestCamera:'MEDIUM_SHOT',
    DNA:{ flexibility:5, aggression:7, balance:6, speed:5, acrobatics:3, combatStyle:6, silhouetteReadability:8 },
  },
  {
    id:'wall_crawl', name:'Wall Crawl', category:'STORYBOARD', emoji:'🕷️',
    artistDNA:'McFarlane Spider-Man wall poses · impossible anatomy',
    lineOfAction:'Perpendicular to wall — gravity defied',
    silhouetteShape:'Spider — spread limbs on vertical plane',
    motionLanguage:'Wall surface texture · height implied · urban context',
    bestCamera:'DUTCH_ANGLE',
    DNA:{ flexibility:10, aggression:3, balance:9, speed:5, acrobatics:10, combatStyle:3, silhouetteReadability:10 },
  },
  {
    id:'spider_swing', name:'Spider Swing', category:'STORYBOARD', emoji:'🕸️',
    artistDNA:'McFarlane web-swing masterclass · Romita Sr Spidey',
    lineOfAction:'Pendulum at full extension — maximum arc',
    silhouetteShape:'Diagonal hang — web taut above',
    motionLanguage:'Buildings blur · web trails · one-handed for drama',
    bestCamera:'WORM_EYE_VIEW',
    DNA:{ flexibility:9, aggression:4, balance:7, speed:9, acrobatics:10, combatStyle:3, silhouetteReadability:10 },
  },

  // ── AERIAL (10) — Kirby · Pacheco · Larroca · Cassaday ──────────────────
  {
    id:'power_leap', name:'Power Leap', category:'AERIAL', emoji:'🦘',
    artistDNA:'Kirby Fantastic Four launch · George Pérez Titan jump',
    lineOfAction:'45° diagonal upward — knees tuck at apex',
    silhouetteShape:'Inverted arrow — body rockets upward',
    motionLanguage:'Ground explodes at push-off · cape unfurls · Kirby dots trail',
    bestCamera:'WORM_EYE_VIEW',
    DNA:{ flexibility:8, aggression:7, balance:6, speed:9, acrobatics:9, combatStyle:6, silhouetteReadability:9 },
  },
  {
    id:'soaring_glide', name:'Soaring Glide', category:'AERIAL', emoji:'🦸',
    artistDNA:'Alex Ross iconic hero glide · Pacheco cosmic hero soar',
    lineOfAction:'Horizontal S-curve — chest leads, arms back, feet angled',
    silhouetteShape:'Arrow shape — streamlined horizontal',
    motionLanguage:'Clouds part · speed lines parallel to body · city tiny below',
    bestCamera:'CINEMATIC_LOW_ANGLE',
    DNA:{ flexibility:7, aggression:5, balance:9, speed:9, acrobatics:7, combatStyle:5, silhouetteReadability:10 },
  },
  {
    id:'apex_hover', name:'Apex Hover', category:'AERIAL', emoji:'🌀',
    artistDNA:'Larroca Iron Man hovering · Ditko Doctor Strange float',
    lineOfAction:'Perfectly vertical — gravitational defiance, arms slightly out',
    silhouetteShape:'T-cross — body column, arms horizontal control',
    motionLanguage:'Repulsor glow under boots · energy distortion · environment waits',
    bestCamera:'WORM_EYE_VIEW',
    DNA:{ flexibility:6, aggression:5, balance:10, speed:3, acrobatics:5, combatStyle:6, silhouetteReadability:9 },
  },
  {
    id:'combat_dive', name:'Combat Dive', category:'AERIAL', emoji:'🦅',
    artistDNA:'Cassaday Cyclops aerial · Gil Kane diving hero',
    lineOfAction:'Steep diagonal downward — head-first committed dive',
    silhouetteShape:'Spear descending — arms back, legs straight',
    motionLanguage:'Speed lines converge at target · wind tears cape · ground rushes up',
    bestCamera:'BIRD_EYE_VIEW',
    DNA:{ flexibility:8, aggression:9, balance:5, speed:10, acrobatics:8, combatStyle:8, silhouetteReadability:9 },
  },
  {
    id:'sky_patrol', name:'Sky Patrol', category:'AERIAL', emoji:'🌆',
    artistDNA:'Jim Lee Batman glide · Frank Miller Daredevil rooftop survey',
    lineOfAction:'Gentle forward diagonal — scanning angle, arms at ease',
    silhouetteShape:'Wide delta — cape spreads like wings',
    motionLanguage:'City grid below · wind current visible · cape billows steady',
    bestCamera:'WIDE_SHOT',
    DNA:{ flexibility:5, aggression:3, balance:9, speed:5, acrobatics:4, combatStyle:4, silhouetteReadability:10 },
  },
  {
    id:'upward_spiral', name:'Upward Spiral', category:'AERIAL', emoji:'🌪️',
    artistDNA:'Art Adams Storm tornado · Simonson Thor cyclone ascent',
    lineOfAction:'Helical upward — body rotates along vertical axis',
    silhouetteShape:'Dynamic helix — limbs offset in rotation',
    motionLanguage:'Cyclone forms below · debris circles · hair and cape spiral',
    bestCamera:'WORM_EYE_VIEW',
    DNA:{ flexibility:9, aggression:6, balance:7, speed:8, acrobatics:9, combatStyle:5, silhouetteReadability:8 },
  },
  {
    id:'free_fall', name:'Free Fall', category:'AERIAL', emoji:'🪂',
    artistDNA:'Neal Adams falling hero · John Buscema drama descent',
    lineOfAction:'Straight downward — terminal velocity, limbs spread',
    silhouetteShape:'X-spread — maximum air resistance posture',
    motionLanguage:'Wind screams past · hair streams up · ground distant but rising',
    bestCamera:'BIRD_EYE_VIEW',
    DNA:{ flexibility:8, aggression:3, balance:5, speed:8, acrobatics:7, combatStyle:3, silhouetteReadability:8 },
  },
  {
    id:'rocket_launch', name:'Rocket Launch', category:'AERIAL', emoji:'🚀',
    artistDNA:'Larroca Iron Man blastoff · Bob Layton Shellhead classic',
    lineOfAction:'Vertical straight — full thrust upward from planted stance',
    silhouetteShape:'Inverted T → column — arms snap to sides at launch',
    motionLanguage:'Blast crater forms below · shockwave ring · sonic boom cone',
    bestCamera:'CINEMATIC_LOW_ANGLE',
    DNA:{ flexibility:5, aggression:7, balance:8, speed:10, acrobatics:5, combatStyle:6, silhouetteReadability:8 },
  },
  {
    id:'aerial_cartwheel', name:'Aerial Cartwheel', category:'AERIAL', emoji:'🤸',
    artistDNA:'Art Adams X-Men aerial antics · McFarlane impossible grace',
    lineOfAction:'Rotating horizontal — arms and legs form turning wheel',
    silhouetteShape:'Four-pointed star rotating — dynamic symmetry',
    motionLanguage:'Multiple ghost frames visible · hair fans radial · joy in motion',
    bestCamera:'FULL_BODY',
    DNA:{ flexibility:10, aggression:3, balance:7, speed:8, acrobatics:10, combatStyle:3, silhouetteReadability:9 },
  },
  {
    id:'controlled_descent', name:'Controlled Descent', category:'AERIAL', emoji:'🦜',
    artistDNA:'Alex Ross painted landings · Cassaday composed arrivals',
    lineOfAction:'Gentle downward diagonal — body upright, arms slightly raised',
    silhouetteShape:'Elongated vertical — dignified drop',
    motionLanguage:'Dust motes rise to meet figure · cape settles · crowd watches',
    bestCamera:'FULL_BODY',
    DNA:{ flexibility:6, aggression:3, balance:10, speed:4, acrobatics:5, combatStyle:3, silhouetteReadability:10 },
  },

  // ── POWERUP (10) — Van Sciver · Alex Ross · Peter David · Wieringo ───────
  {
    id:'energy_accumulation', name:'Energy Accumulation', category:'POWERUP', emoji:'🔋',
    artistDNA:'Van Sciver GL ring charging · Kirby Cosmic Rod power build',
    lineOfAction:'Radial inward — energy draws toward body center',
    silhouetteShape:'Compressed sphere — body curls as power collects',
    motionLanguage:'Surrounding energy pulled in · color shifts · ground lifts',
    bestCamera:'MEDIUM_SHOT',
    DNA:{ flexibility:5, aggression:6, balance:8, speed:3, acrobatics:3, combatStyle:5, silhouetteReadability:8 },
  },
  {
    id:'power_surge', name:'Power Surge', category:'POWERUP', emoji:'⚡',
    artistDNA:'Peter David Hulk peak power · Van Sciver Parallax release',
    lineOfAction:'Explosive radial outward — everything blasts from center',
    silhouetteShape:'Star burst — limbs and energy radiate equally',
    motionLanguage:'Ground shatters outward · aura blinds · hair and cape explode',
    bestCamera:'WIDE_SHOT',
    DNA:{ flexibility:6, aggression:9, balance:5, speed:7, acrobatics:4, combatStyle:7, silhouetteReadability:9 },
  },
  {
    id:'armor_activation', name:'Armor Activation', category:'POWERUP', emoji:'🤖',
    artistDNA:'Bob Layton Iron Man suit-up · Larroca Extremis sequence',
    lineOfAction:'Vertical straight — armor plates lock into place systematically',
    silhouetteShape:'Column with expanding plates — growing larger',
    motionLanguage:'Panels click shut · HUD comes online · energy fills chest piece',
    bestCamera:'FULL_BODY',
    DNA:{ flexibility:4, aggression:5, balance:9, speed:4, acrobatics:3, combatStyle:7, silhouetteReadability:9 },
  },
  {
    id:'berserker_rage', name:'Berserker Rage', category:'POWERUP', emoji:'😤',
    artistDNA:'Herb Trimpe Wolverine berserk · Jim Lee rage anatomy',
    lineOfAction:'Forward explosive diagonal — no held back energy',
    silhouetteShape:'Jagged wedge — angular aggression',
    motionLanguage:'Claws unsheathe through skin · veins bulge · costume tears',
    bestCamera:'CINEMATIC_LOW_ANGLE',
    DNA:{ flexibility:6, aggression:10, balance:4, speed:9, acrobatics:6, combatStyle:10, silhouetteReadability:8 },
  },
  {
    id:'mutation_outbreak', name:'Mutation Outbreak', category:'POWERUP', emoji:'🧬',
    artistDNA:'Neal Adams Hulk origin · Peter David transformation scenes',
    lineOfAction:'Multi-directional expansion — body grows in all planes',
    silhouetteShape:'Irregular expanding blob — breaks normal body outline',
    motionLanguage:'Clothing tears systematically · skin changes color or texture · ground cracks',
    bestCamera:'WIDE_SHOT',
    DNA:{ flexibility:5, aggression:9, balance:3, speed:5, acrobatics:2, combatStyle:6, silhouetteReadability:8 },
  },
  {
    id:'cosmic_awakening', name:'Cosmic Awakening', category:'POWERUP', emoji:'🌌',
    artistDNA:'John Buscema Silver Surfer · Kirby Galactus power scenes',
    lineOfAction:'Straight vertical — absolute stillness as power flows through',
    silhouetteShape:'Column of light — figure becomes conduit',
    motionLanguage:'Universe visible through body · stars align · planetary scale event',
    bestCamera:'FULL_BODY',
    DNA:{ flexibility:5, aggression:6, balance:10, speed:2, acrobatics:2, combatStyle:5, silhouetteReadability:10 },
  },
  {
    id:'limit_break', name:'Limit Break', category:'POWERUP', emoji:'💫',
    artistDNA:'Wieringo Flash breaking speed limit · Van Sciver White Lantern',
    lineOfAction:'Diagonal upward burst — maximum push beyond previous ceiling',
    silhouetteShape:'Elongated upward spike — stretched beyond normal proportions',
    motionLanguage:'Reality distorts around figure · previous limits shatter · new aura color',
    bestCamera:'CINEMATIC_LOW_ANGLE',
    DNA:{ flexibility:7, aggression:8, balance:5, speed:9, acrobatics:6, combatStyle:7, silhouetteReadability:9 },
  },
  {
    id:'final_form', name:'Final Form', category:'POWERUP', emoji:'👑',
    artistDNA:'Alex Ross Kingdom Come power reveal · Pérez Thanos transformation',
    lineOfAction:'Perfectly vertical — absolute command of gravity and space',
    silhouetteShape:'Maximum expansion — every element at full extension',
    motionLanguage:'Everything around bends in reverence · sky changes · crowd kneels',
    bestCamera:'WORM_EYE_VIEW',
    DNA:{ flexibility:5, aggression:7, balance:10, speed:2, acrobatics:2, combatStyle:8, silhouetteReadability:10 },
  },
  {
    id:'healing_factor', name:'Healing Factor', category:'POWERUP', emoji:'💚',
    artistDNA:'Jim Lee Wolverine healing · Barry Windsor-Smith regeneration',
    lineOfAction:'Upward recovery arc — collapse reverting to standing',
    silhouetteShape:'Rising C-curve — returning from ground',
    motionLanguage:'Wounds close visibly · torn suit knits · enemy watches in horror',
    bestCamera:'MEDIUM_SHOT',
    DNA:{ flexibility:6, aggression:4, balance:6, speed:3, acrobatics:3, combatStyle:5, silhouetteReadability:7 },
  },
  {
    id:'aura_manifest', name:'Aura Manifest', category:'POWERUP', emoji:'🌟',
    artistDNA:'Van Sciver emotional spectrum · Manapul Flash energy aura',
    lineOfAction:'Radial from core — aura extends body outline outward',
    silhouetteShape:'Double silhouette — body inside larger aura shape',
    motionLanguage:'Inner color bleeds outward · heat shimmer · emotion visible as light',
    bestCamera:'FULL_BODY',
    DNA:{ flexibility:5, aggression:6, balance:8, speed:4, acrobatics:3, combatStyle:5, silhouetteReadability:9 },
  },

  // ── BLAST (10) — Kirby · Van Sciver · Manapul · Cassaday ──────────────────
  {
    id:'optic_blast', name:'Optic Blast', category:'BLAST', emoji:'👁️',
    artistDNA:'Neal Adams Cyclops · Cassaday Astonishing X-Men optic',
    lineOfAction:'Horizontal straight from eyes — narrow beam to target',
    silhouetteShape:'T-shape — head steady, beam extends horizontal',
    motionLanguage:'Visor flares · beam cuts groove in ground · target explodes on contact',
    bestCamera:'OVER_SHOULDER',
    DNA:{ flexibility:4, aggression:8, balance:9, speed:7, acrobatics:2, combatStyle:7, silhouetteReadability:8 },
  },
  {
    id:'heat_vision_sweep', name:'Heat Vision Sweep', category:'BLAST', emoji:'🔴',
    artistDNA:'Jim Lee Superman heat vision · John Byrne classic sweep',
    lineOfAction:'Horizontal arc — eyes track moving target, beam curves',
    silhouetteShape:'Wide arc — beam sweeps across panel',
    motionLanguage:'Ground melts in line · smoke rises along path · target dodges or burns',
    bestCamera:'WIDE_SHOT',
    DNA:{ flexibility:5, aggression:8, balance:9, speed:6, acrobatics:2, combatStyle:7, silhouetteReadability:8 },
  },
  {
    id:'unibeam_blast', name:'Unibeam Blast', category:'BLAST', emoji:'🔵',
    artistDNA:'Bob Layton Iron Man unibeam · Larroca Extremis chest shot',
    lineOfAction:'Straight forward horizontal — centered from chest piece',
    silhouetteShape:'Circle origin spreading cone — beam fans out at distance',
    motionLanguage:'Chest plate retracts · beam diameter matches torso · recoil pushes back',
    bestCamera:'MEDIUM_SHOT',
    DNA:{ flexibility:4, aggression:9, balance:7, speed:7, acrobatics:2, combatStyle:7, silhouetteReadability:8 },
  },
  {
    id:'lightning_call', name:'Lightning Call', category:'BLAST', emoji:'⛈️',
    artistDNA:'Walt Simonson Thor summoning · Olivier Coipel lightning panels',
    lineOfAction:'Vertical upward reach — energy comes down from sky',
    silhouetteShape:'Upward triangle — arms raised, lightning descends to weapon',
    motionLanguage:'Storm clouds form instantly · ground chars · enemy blinded',
    bestCamera:'CINEMATIC_LOW_ANGLE',
    DNA:{ flexibility:6, aggression:9, balance:7, speed:6, acrobatics:3, combatStyle:8, silhouetteReadability:9 },
  },
  {
    id:'plasma_burst', name:'Plasma Burst', category:'BLAST', emoji:'🟠',
    artistDNA:'Gene Colan Torch flare · Art Adams energy attacks',
    lineOfAction:'Diagonal forward — arm extended at 45°, energy expands conically',
    silhouetteShape:'Diagonal line from shoulder — cone at tip',
    motionLanguage:'Plasma corona around fist · impact flash · air ignites along path',
    bestCamera:'DUTCH_ANGLE',
    DNA:{ flexibility:5, aggression:9, balance:7, speed:8, acrobatics:3, combatStyle:7, silhouetteReadability:8 },
  },
  {
    id:'concussion_wave', name:'Concussion Wave', category:'BLAST', emoji:'🌊',
    artistDNA:'Kirby Destroyer · Pérez energy wave panels',
    lineOfAction:'Horizontal spread — both hands push forward, wave radiates out',
    silhouetteShape:'Wide T — arms extended, wave fills width of panel',
    motionLanguage:'Wave flattens everything in line · ground ripples · targets tumble',
    bestCamera:'WIDE_SHOT',
    DNA:{ flexibility:5, aggression:8, balance:8, speed:6, acrobatics:3, combatStyle:7, silhouetteReadability:9 },
  },
  {
    id:'ice_ray', name:'Ice Ray', category:'BLAST', emoji:'❄️',
    artistDNA:'Neal Adams Iceman classic · Don Heck cold villain shots',
    lineOfAction:'Diagonal forward — beam crystallizes as it travels',
    silhouetteShape:'Pointed diagonal — ice lattice grows from tip',
    motionLanguage:'Frost spreads from impact point · breath visible · target encases',
    bestCamera:'MEDIUM_SHOT',
    DNA:{ flexibility:5, aggression:7, balance:8, speed:6, acrobatics:2, combatStyle:6, silhouetteReadability:8 },
  },
  {
    id:'telekinetic_hurl', name:'Telekinetic Hurl', category:'BLAST', emoji:'🧠',
    artistDNA:'Dave Cockrum Phoenix force · Van Sciver Jean Grey',
    lineOfAction:'Diagonal gesture — arm sweeps, objects follow trajectory',
    silhouetteShape:'Asymmetric gesture — weight on one leg, arm commands',
    motionLanguage:'Multiple objects in flight · crackling aura around debris · strain on face',
    bestCamera:'WIDE_SHOT',
    DNA:{ flexibility:6, aggression:7, balance:7, speed:6, acrobatics:4, combatStyle:6, silhouetteReadability:8 },
  },
  {
    id:'point_blank_explosion', name:'Point-Blank Explosion', category:'BLAST', emoji:'💣',
    artistDNA:'Romita Jr impact panels · David Finch close detonation',
    lineOfAction:'Radial outward from contact point — everything blasts from zero range',
    silhouetteShape:'Starburst at center — both figures silhouetted by flash',
    motionLanguage:'White flash panel · both figures thrown back · debris cone expands',
    bestCamera:'CLOSE_UP',
    DNA:{ flexibility:5, aggression:10, balance:3, speed:8, acrobatics:4, combatStyle:8, silhouetteReadability:7 },
  },
  {
    id:'charged_throw', name:'Charged Throw', category:'BLAST', emoji:'🃏',
    artistDNA:'Manapul Gambit cards · Joe Mad kinetic energy panels',
    lineOfAction:'Diagonal wind-up — object trails energy as it accelerates',
    silhouetteShape:'Pitcher arm at release — object at end of arc',
    motionLanguage:'Object glows before release · energy trail fades · target unaware',
    bestCamera:'DUTCH_ANGLE',
    DNA:{ flexibility:8, aggression:8, balance:7, speed:9, acrobatics:6, combatStyle:8, silhouetteReadability:8 },
  },

  // ── IMPACT (9) — Romita Jr · Coipel · David Finch · Leinil Yu ────────────
  {
    id:'ground_pound_crater', name:'Ground Pound Crater', category:'IMPACT', emoji:'☄️',
    artistDNA:'Romita Jr Hulk smash · Coipel Thor ground strike',
    lineOfAction:'Straight vertical — maximum mass descending',
    silhouetteShape:'Inverted pyramid — fist fills bottom of panel',
    motionLanguage:'Crater ring expands at instant of contact · buildings in background bow',
    bestCamera:'WORM_EYE_VIEW',
    DNA:{ flexibility:3, aggression:10, balance:6, speed:8, acrobatics:3, combatStyle:7, silhouetteReadability:9 },
  },
  {
    id:'wall_crash_through', name:'Wall Crash Through', category:'IMPACT', emoji:'🧱',
    artistDNA:'David Finch figure through wall · Leinil Yu impact panels',
    lineOfAction:'Horizontal straight — body is the projectile',
    silhouetteShape:'Figure-in-debris cloud — outline in negative space',
    motionLanguage:'Structural material sprays outward · dust cloud blooms · figure emerges',
    bestCamera:'MEDIUM_SHOT',
    DNA:{ flexibility:5, aggression:10, balance:4, speed:9, acrobatics:5, combatStyle:7, silhouetteReadability:8 },
  },
  {
    id:'aerial_pile_driver', name:'Aerial Pile Driver', category:'IMPACT', emoji:'⬇️',
    artistDNA:'Romita Jr wrestling attacks · Jim Lee grapple moves',
    lineOfAction:'Vertical grab-and-drive — attacker wraps target, drives head-first',
    silhouetteShape:'Two-body vertical column descending',
    motionLanguage:"Target's head aimed at ground · speed lines vertical · crater imminent",
    bestCamera:'ACTION_TRACKING',
    DNA:{ flexibility:7, aggression:10, balance:6, speed:8, acrobatics:7, combatStyle:9, silhouetteReadability:8 },
  },
  {
    id:'collision_impact', name:'Two-Body Collision', category:'IMPACT', emoji:'💥',
    artistDNA:'Byrne X-Men collisions · Pérez Avengers clash',
    lineOfAction:'Two opposing diagonals meeting at center point',
    silhouetteShape:'X at collision — forces meet and cancel',
    motionLanguage:'Impact star centered · both figures freeze one frame · shockwave expands',
    bestCamera:'WIDE_SHOT',
    DNA:{ flexibility:6, aggression:9, balance:5, speed:9, acrobatics:5, combatStyle:8, silhouetteReadability:9 },
  },
  {
    id:'building_destruction', name:'Building Destruction', category:'IMPACT', emoji:'🏗️',
    artistDNA:'Kirby scale impacts · Simonson Surtur scale',
    lineOfAction:'Descending diagonal — body or attack carves through structure',
    silhouetteShape:'Diagonal cut — building divides on impact line',
    motionLanguage:'Floors pancake · windows blow out · scale figure shows enormity',
    bestCamera:'WIDE_SHOT',
    DNA:{ flexibility:3, aggression:10, balance:5, speed:7, acrobatics:2, combatStyle:6, silhouetteReadability:8 },
  },
  {
    id:'sonic_boom_body', name:'Sonic Boom', category:'IMPACT', emoji:'🔊',
    artistDNA:'Wieringo Flash speed barrier · Manapul sound break',
    lineOfAction:'Pure horizontal arrow — body punches through air barrier',
    silhouetteShape:'Cone shape — body at tip, shock cone trails',
    motionLanguage:'Circular shock ring forms at body · windows shatter nearby · sonic crack',
    bestCamera:'ACTION_TRACKING',
    DNA:{ flexibility:7, aggression:7, balance:7, speed:10, acrobatics:5, combatStyle:5, silhouetteReadability:8 },
  },
  {
    id:'shockwave_epicenter', name:'Shockwave Epicenter', category:'IMPACT', emoji:'🌐',
    artistDNA:'Pérez crisis splash · Van Sciver Rebirth epicenter',
    lineOfAction:'Radial outward — figure at center, wave expands in all directions',
    silhouetteShape:"Figure at bull's-eye of concentric rings",
    motionLanguage:'Wave flattens terrain · objects orbit impact zone · figure unharmed at eye',
    bestCamera:'BIRD_EYE_VIEW',
    DNA:{ flexibility:4, aggression:9, balance:8, speed:6, acrobatics:3, combatStyle:7, silhouetteReadability:9 },
  },
  {
    id:'car_launch', name:'Car Launch', category:'IMPACT', emoji:'🚗',
    artistDNA:'Romita Sr Hulk classic · Herb Trimpe vehicle attacks',
    lineOfAction:'Rising diagonal arc — vehicle thrown like a ball',
    silhouetteShape:'Irregular mass airborne — recognizable vehicle shape',
    motionLanguage:'Wheels still spinning mid-air · passengers silhouetted · attacker winds up',
    bestCamera:'WIDE_SHOT',
    DNA:{ flexibility:4, aggression:10, balance:5, speed:7, acrobatics:2, combatStyle:7, silhouetteReadability:8 },
  },
  {
    id:'slam_down', name:'Slam Down', category:'IMPACT', emoji:'👊',
    artistDNA:'Neal Adams grapple finisher · Romita Jr Daredevil floor slams',
    lineOfAction:'Vertical straight — attacker over target, drives down',
    silhouetteShape:'Two-body vertical — attacker dominant above',
    motionLanguage:"Target's back to ground · floor cracks under impact · reversal threat implied",
    bestCamera:'BIRD_EYE_VIEW',
    DNA:{ flexibility:6, aggression:9, balance:7, speed:7, acrobatics:5, combatStyle:9, silhouetteReadability:8 },
  },

  // ── STEALTH (9) — Frank Miller · Mignola · Capullo · Jock ─────────────────
  {
    id:'gargoyle_perch', name:'Gargoyle Perch', category:'STEALTH', emoji:'🗿',
    artistDNA:"Frank Miller Batman Year One · Capullo Batman's city",
    lineOfAction:'Compressed crouch — weight forward on perch, cape drapes',
    silhouetteShape:'Triangle sitting — compressed but loaded with potential',
    motionLanguage:'Shadow swallows lower half · rain on cape · city far below',
    bestCamera:'WIDE_SHOT',
    DNA:{ flexibility:7, aggression:5, balance:9, speed:2, acrobatics:5, combatStyle:7, silhouetteReadability:10 },
  },
  {
    id:'shadow_merge', name:'Shadow Merge', category:'STEALTH', emoji:'🌑',
    artistDNA:'Mignola Hellboy shadow work · Jock abstract silhouettes',
    lineOfAction:'Compressed flat — body merges with shadow geometry',
    silhouetteShape:'Abstract — figure and shadow become indistinguishable',
    motionLanguage:'Only eyes catch light · shape breaks up in darkness · target walks past',
    bestCamera:'DUTCH_ANGLE',
    DNA:{ flexibility:8, aggression:3, balance:8, speed:2, acrobatics:5, combatStyle:6, silhouetteReadability:5 },
  },
  {
    id:'ceiling_hang', name:'Ceiling Hang', category:'STEALTH', emoji:'🦇',
    artistDNA:'Capullo Batman inverted · McFarlane Spider-Man ceiling',
    lineOfAction:'Inverted vertical — hands or feet grip ceiling, body hangs',
    silhouetteShape:'Inverted T — arms spread, body hangs below',
    motionLanguage:'Dust falls from disturbed grip · target oblivious below · drop imminent',
    bestCamera:'DUTCH_ANGLE',
    DNA:{ flexibility:9, aggression:4, balance:8, speed:3, acrobatics:9, combatStyle:6, silhouetteReadability:9 },
  },
  {
    id:'wall_press', name:'Wall Press', category:'STEALTH', emoji:'🧱',
    artistDNA:'Frank Miller corridor work · Mignola figure in architecture',
    lineOfAction:'Perfectly flat — body presses perpendicular to wall',
    silhouetteShape:'Thin vertical — minimum profile',
    motionLanguage:'Breath held · footstep heard · edge of frame reveals the hunter',
    bestCamera:'OVER_SHOULDER',
    DNA:{ flexibility:7, aggression:3, balance:9, speed:1, acrobatics:5, combatStyle:6, silhouetteReadability:6 },
  },
  {
    id:'ninja_vanish', name:'Ninja Vanish', category:'STEALTH', emoji:'💨',
    artistDNA:'McFarlane smoke effects · Howard Chaykin ninja work',
    lineOfAction:'Diagonal departure — last moment before vanish',
    silhouetteShape:'Partial silhouette — dissolving into smoke or shadow',
    motionLanguage:'Smoke cloud obscures · afterimage left · only footprint remains',
    bestCamera:'MEDIUM_SHOT',
    DNA:{ flexibility:9, aggression:3, balance:7, speed:8, acrobatics:8, combatStyle:5, silhouetteReadability:6 },
  },
  {
    id:'ambush_drop', name:'Ambush Drop', category:'STEALTH', emoji:'⬇️',
    artistDNA:'Capullo Batman ambush · Mignola demon drops',
    lineOfAction:'Vertical descent — dropping from height onto target',
    silhouetteShape:'Compressed triangle descending — knees tucked, cape funnels',
    motionLanguage:"Target's shadow shows attacker above · one moment of warning",
    bestCamera:'BIRD_EYE_VIEW',
    DNA:{ flexibility:8, aggression:8, balance:6, speed:8, acrobatics:8, combatStyle:8, silhouetteReadability:9 },
  },
  {
    id:'crouched_stalk', name:'Crouched Stalk', category:'STEALTH', emoji:'🐆',
    artistDNA:'Mignola predator posture · Frank Miller cat burglar movement',
    lineOfAction:'Horizontal low diagonal — weight on balls of feet, back hunched',
    silhouetteShape:'Low horizontal — staying below sightlines',
    motionLanguage:'Each step placed deliberately · weight shifts silent · darkness ahead',
    bestCamera:'FULL_BODY',
    DNA:{ flexibility:9, aggression:5, balance:8, speed:4, acrobatics:7, combatStyle:7, silhouetteReadability:7 },
  },
  {
    id:'wire_traverse', name:'Wire Traverse', category:'STEALTH', emoji:'🕸️',
    artistDNA:'Frank Miller rooftop mobility · Jock Catwoman wire work',
    lineOfAction:'Diagonal horizontal — body perpendicular to wire, arms out for balance',
    silhouetteShape:'Tightrope cross — T-shape on diagonal',
    motionLanguage:'Wire vibrates · city below vast · security cameras avoided',
    bestCamera:'WIDE_SHOT',
    DNA:{ flexibility:8, aggression:2, balance:10, speed:4, acrobatics:8, combatStyle:4, silhouetteReadability:8 },
  },
  {
    id:'interrogation_loom', name:'Interrogation Loom', category:'STEALTH', emoji:'😤',
    artistDNA:"Frank Miller Batman interrogation · Capullo Batman's shadows",
    lineOfAction:'Downward diagonal — looming over seated/kneeling target',
    silhouetteShape:'Authority triangle — wide at top, target tiny at base',
    motionLanguage:"Light source behind · face invisible · target's fear is visible",
    bestCamera:'OVER_SHOULDER',
    DNA:{ flexibility:4, aggression:7, balance:8, speed:1, acrobatics:2, combatStyle:8, silhouetteReadability:9 },
  },

  // ── SPEED (8) — Wieringo · Manapul · Immonen · Gil Kane ─────────────────
  {
    id:'sonic_sprint', name:'Sonic Sprint', category:'SPEED', emoji:'⚡',
    artistDNA:'Mike Wieringo Flash · Manapul lightning bolt trails',
    lineOfAction:'Pure horizontal at 10° lean — absolute commitment to direction',
    silhouetteShape:'Horizontal arrow — body perfectly streamlined',
    motionLanguage:'Lightning bolt trail · ground scorched in footstep pattern · afterimage left',
    bestCamera:'ACTION_TRACKING',
    DNA:{ flexibility:8, aggression:6, balance:7, speed:10, acrobatics:7, combatStyle:4, silhouetteReadability:8 },
  },
  {
    id:'afterimage_blur', name:'Afterimage Blur', category:'SPEED', emoji:'👻',
    artistDNA:'Wieringo velocity blur · Immonen multiple exposure technique',
    lineOfAction:'Ghost of previous positions — speed renders body multiply',
    silhouetteShape:'Multiple overlapping figures — transparency gradient',
    motionLanguage:'3–5 ghost images in motion arc · only last is solid · too fast to follow',
    bestCamera:'WIDE_SHOT',
    DNA:{ flexibility:8, aggression:5, balance:6, speed:10, acrobatics:8, combatStyle:5, silhouetteReadability:7 },
  },
  {
    id:'bullet_dodge', name:'Bullet Dodge', category:'SPEED', emoji:'💫',
    artistDNA:'Gil Kane reflex shots · Wieringo Flash impossible evasion',
    lineOfAction:'Dramatic C-curve lean away — body arcs around projectile path',
    silhouetteShape:'Arc-lean silhouette — extreme body angle',
    motionLanguage:'Bullet visible mid-air · hair displaced · clothes pulled by speed',
    bestCamera:'FULL_BODY',
    DNA:{ flexibility:10, aggression:3, balance:5, speed:10, acrobatics:9, combatStyle:4, silhouetteReadability:9 },
  },
  {
    id:'momentum_tackle', name:'Momentum Tackle', category:'SPEED', emoji:'🏈',
    artistDNA:'Gil Kane Superman tackle · Immonen high-speed collision',
    lineOfAction:'Diagonal arrow into target — all mass becomes projectile',
    silhouetteShape:'Wedge compressed — shoulder leads, legs trail',
    motionLanguage:'Target lifts off feet · speed lines center on point of contact · structural damage',
    bestCamera:'DUTCH_ANGLE',
    DNA:{ flexibility:6, aggression:9, balance:6, speed:9, acrobatics:6, combatStyle:8, silhouetteReadability:8 },
  },
  {
    id:'vertical_wall_run', name:'Vertical Wall Run', category:'SPEED', emoji:'🧗',
    artistDNA:'Wieringo Flash physics defying · McFarlane wall running',
    lineOfAction:'Vertical straight upward — gravity treated as obstacle, not law',
    silhouetteShape:'Upward arrow — one foot on wall, body pitched forward',
    motionLanguage:'Footprints dent the wall · speed maintains grip · top of building goal',
    bestCamera:'DUTCH_ANGLE',
    DNA:{ flexibility:9, aggression:5, balance:7, speed:9, acrobatics:10, combatStyle:4, silhouetteReadability:8 },
  },
  {
    id:'time_slice', name:'Time Slice', category:'SPEED', emoji:'⏱️',
    artistDNA:'Manapul time-stop visuals · Immonen frozen moment panels',
    lineOfAction:'Frozen mid-motion diagonal — caught between frames',
    silhouetteShape:'Dynamic diagonal — one foot off ground, mid-stride',
    motionLanguage:'Everything else stopped · debris frozen mid-air · protagonist alone in motion',
    bestCamera:'CINEMATIC_LOW_ANGLE',
    DNA:{ flexibility:7, aggression:5, balance:6, speed:10, acrobatics:6, combatStyle:5, silhouetteReadability:9 },
  },
  {
    id:'speed_force_vortex', name:'Speed Force Vortex', category:'SPEED', emoji:'🌀',
    artistDNA:'Wieringo speed force · Manapul energy corridor',
    lineOfAction:'Circular — running forms vortex, centripetal force visible',
    silhouetteShape:'Spiral — body at center, energy extends outward',
    motionLanguage:'Wind vortex forms · objects sucked into orbit · lightning arcs wildly',
    bestCamera:'BIRD_EYE_VIEW',
    DNA:{ flexibility:8, aggression:6, balance:7, speed:10, acrobatics:7, combatStyle:5, silhouetteReadability:8 },
  },
  {
    id:'sprint_attack_combo', name:'Sprint Attack Combo', category:'SPEED', emoji:'🥊',
    artistDNA:'Wieringo Flash punch series · Manapul combo panels',
    lineOfAction:'Horizontal into diagonal — sprint converts to striking motion',
    silhouetteShape:'L-shape transition — horizontal becomes vertical at contact',
    motionLanguage:'Multiple impact flashes along target body · fists blur · single breath',
    bestCamera:'ACTION_TRACKING',
    DNA:{ flexibility:8, aggression:9, balance:7, speed:10, acrobatics:7, combatStyle:9, silhouetteReadability:8 },
  },

  // ── DOMINANCE (8) — Frank Miller · Alex Ross · Bryan Hitch ─────────────────
  // Java: PoseCategories.DOMINANCE — power display, intimidation, authority
  {
    id:'villain_throne', name:'Villain Throne', category:'DOMINANCE', emoji:'👑',
    artistDNA:"Miller's seated crime lords · Alex Ross seated Superman authority",
    lineOfAction:'Stable vertical — absolute stillness commands the room',
    silhouetteShape:'Wide throne pyramid — arms on rests, crown of shoulders dominant',
    motionLanguage:'No movement needed · gravity of gaze pulls all eyes · stillness IS power',
    bestCamera:'WORM_EYE_VIEW',
    DNA:{ flexibility:3, aggression:6, balance:9, speed:1, acrobatics:1, combatStyle:6, silhouetteReadability:9 },
    interactionType:'dominance', leadingMass:'head',
    anatomy:{ torsoRotation:5, hipTilt:15, shoulderTilt:8, foreshortening:0.2 },
  },
  {
    id:'power_reveal', name:'Power Reveal', category:'DOMINANCE', emoji:'✨',
    artistDNA:'Alex Ross backlit Superman · Hitch arms-spread Ultimates reveal',
    lineOfAction:'Perfect vertical T — arms wide, chest forward, light from behind',
    silhouetteShape:'Cross spread — maximum width, total presence, cape fans outward',
    motionLanguage:'Light blooms outward · cape unfurls · no words necessary · awe enforced',
    bestCamera:'CINEMATIC_LOW_ANGLE',
    DNA:{ flexibility:4, aggression:5, balance:10, speed:2, acrobatics:2, combatStyle:5, silhouetteReadability:10 },
    interactionType:'dominance', leadingMass:'chest',
    anatomy:{ torsoRotation:0, hipTilt:0, shoulderTilt:5, foreshortening:0.4 },
  },
  {
    id:'intimidation_loom', name:'Intimidation Loom', category:'DOMINANCE', emoji:'😤',
    artistDNA:"Miller's Batman looming · David Finch close villain step",
    lineOfAction:'Forward diagonal — body pitches toward viewer, mass grows with each step',
    silhouetteShape:'Expanding triangle — shoulders wider as figure approaches camera',
    motionLanguage:'Shadow falls before figure arrives · each footstep echoes · smile optional',
    bestCamera:'WORM_EYE_VIEW',
    DNA:{ flexibility:5, aggression:8, balance:8, speed:4, acrobatics:3, combatStyle:8, silhouetteReadability:9 },
    interactionType:'dominance', leadingMass:'shoulders',
    anatomy:{ torsoRotation:15, hipTilt:-10, shoulderTilt:20, foreshortening:0.6 },
  },
  {
    id:'territory_claim', name:'Territory Claim', category:'DOMINANCE', emoji:'🦁',
    artistDNA:"Ross's Superman over city · Pérez villain survey of fallen",
    lineOfAction:'Vertical with downward gaze — standing over, surveying domain',
    silhouetteShape:'Inverted power pyramid — figure above, world below, cape trails',
    motionLanguage:'Foot on rubble · wind in cape · empire surveyed and found sufficient',
    bestCamera:'BIRD_EYE_VIEW',
    DNA:{ flexibility:4, aggression:7, balance:9, speed:2, acrobatics:2, combatStyle:7, silhouetteReadability:9 },
    interactionType:'dominance', leadingMass:'chest',
    anatomy:{ torsoRotation:20, hipTilt:-5, shoulderTilt:15, foreshortening:0.5 },
  },
  {
    id:'silent_command', name:'Silent Command', category:'DOMINANCE', emoji:'☝️',
    artistDNA:'Jim Lee Xavier command · Alex Ross Captain America rallying point',
    lineOfAction:'Vertical with arm diagonal — body stable, one arm directs all action',
    silhouetteShape:'Figure-seven — torso column, arm arrow, followers implied behind',
    motionLanguage:'Single raised arm speaks volumes · armies mobilize · no shouting needed',
    bestCamera:'CINEMATIC_LOW_ANGLE',
    DNA:{ flexibility:4, aggression:5, balance:9, speed:2, acrobatics:2, combatStyle:6, silhouetteReadability:9 },
    interactionType:'dominance', leadingMass:'hand',
    anatomy:{ torsoRotation:10, hipTilt:5, shoulderTilt:10, foreshortening:0.3 },
  },
  {
    id:'god_stare', name:'God Stare', category:'DOMINANCE', emoji:'👁️',
    artistDNA:'Alex Ross perfect stillness · Hitch New Ultimates pure presence',
    lineOfAction:'Absolute vertical — zero deviation, total axis control',
    silhouetteShape:'Column — rigid symmetry, gaze toward viewer breaks fourth wall',
    motionLanguage:'Eyes hold the page · reader cannot look away · the universe waits',
    bestCamera:'CLOSE_UP',
    DNA:{ flexibility:2, aggression:7, balance:10, speed:1, acrobatics:1, combatStyle:7, silhouetteReadability:8 },
    interactionType:'dominance', leadingMass:'eyes',
    anatomy:{ torsoRotation:0, hipTilt:0, shoulderTilt:0, foreshortening:0.2 },
  },
  {
    id:'alpha_crouch', name:'Alpha Crouch', category:'DOMINANCE', emoji:'🐆',
    artistDNA:"Capullo Batman gargoyle · Miller's crouched panther readiness",
    lineOfAction:'Compressed forward diagonal — coiled energy ready to release',
    silhouetteShape:'Wide low diamond — weight distributed, claws gripping surface',
    motionLanguage:'Muscle memory of a thousand victories · prey does not know it is chosen yet',
    bestCamera:'WORM_EYE_VIEW',
    DNA:{ flexibility:8, aggression:9, balance:8, speed:8, acrobatics:7, combatStyle:9, silhouetteReadability:9 },
    interactionType:'dominance', leadingMass:'claws',
    anatomy:{ torsoRotation:35, hipTilt:-25, shoulderTilt:30, foreshortening:0.7 },
  },
  {
    id:'monologue_stance', name:'Monologue Stance', category:'DOMINANCE', emoji:'🎭',
    artistDNA:'Mignola theatrical villain address · Miller Kingpin boardroom speech',
    lineOfAction:'Theatrical diagonal — one hand raised, body turned to address audience',
    silhouetteShape:'Asymmetric triangle — raised arm peak, wide shoulders, feet planted',
    motionLanguage:'Words weaponized · cadence deliberate · every syllable a chess move',
    bestCamera:'CINEMATIC_LOW_ANGLE',
    DNA:{ flexibility:4, aggression:6, balance:8, speed:1, acrobatics:1, combatStyle:6, silhouetteReadability:9 },
    interactionType:'dominance', leadingMass:'hand',
    anatomy:{ torsoRotation:15, hipTilt:-5, shoulderTilt:10, foreshortening:0.3 },
  },

  // ── DIALOGUE (8) — Neal Adams · George Pérez · Frank Miller ────────────────
  // Java: PoseCategories.DIALOGUE — confrontation, emotion, tension scenes
  {
    id:'confrontation_standoff', name:'Confrontation Standoff', category:'DIALOGUE', emoji:'⚡',
    artistDNA:"Adams charged space · Miller's two-figure tension geometry",
    lineOfAction:'Two opposing verticals — charged void between figures holds the drama',
    silhouetteShape:'Double column with gap — negative space IS the story',
    motionLanguage:'Neither moves first · air between figures crackles · reader holds breath',
    bestCamera:'MEDIUM_SHOT',
    DNA:{ flexibility:4, aggression:6, balance:8, speed:2, acrobatics:2, combatStyle:6, silhouetteReadability:8 },
    interactionType:'tension', leadingMass:'head',
    anatomy:{ torsoRotation:5, hipTilt:-5, shoulderTilt:5, foreshortening:0.3 },
  },
  {
    id:'heated_argument', name:'Heated Argument', category:'DIALOGUE', emoji:'🗯️',
    artistDNA:'Adams accusation finger · Pérez team dispute close framing',
    lineOfAction:'Aggressive diagonal — accuser leans in, finger extends toward face',
    silhouetteShape:'Arrow into block — pointing arm drives into resistant posture',
    motionLanguage:'Voices raised past reason · finger jabs air · veins in neck visible',
    bestCamera:'OVER_SHOULDER',
    DNA:{ flexibility:5, aggression:7, balance:6, speed:3, acrobatics:2, combatStyle:5, silhouetteReadability:7 },
    interactionType:'tension', leadingMass:'hand',
    anatomy:{ torsoRotation:20, hipTilt:-15, shoulderTilt:25, foreshortening:0.4 },
  },
  {
    id:'villain_monologue', name:'Villain Monologue', category:'DIALOGUE', emoji:'🦹',
    artistDNA:'Mignola theatrical speech · Romita Jr close villain address',
    lineOfAction:'Center-stage vertical — villain holds court, audience implied below',
    silhouetteShape:'Open triangle — hands spread wide, claiming all space as stage',
    motionLanguage:'Every word practiced · pauses deliberate · hero forced to listen',
    bestCamera:'WORM_EYE_VIEW',
    DNA:{ flexibility:4, aggression:7, balance:8, speed:1, acrobatics:1, combatStyle:7, silhouetteReadability:9 },
    interactionType:'dominance', leadingMass:'hand',
    anatomy:{ torsoRotation:10, hipTilt:0, shoulderTilt:10, foreshortening:0.3 },
  },
  {
    id:'desperate_plea', name:'Desperate Plea', category:'DIALOGUE', emoji:'🙏',
    artistDNA:'Adams emotional reach · Pérez civilian desperation scene',
    lineOfAction:'Open forward diagonal — hands extend toward camera, body leans',
    silhouetteShape:'Open reach — arms wide, palms up, vulnerability on display',
    motionLanguage:'Everything rides on this moment · voice breaks · hands tremble',
    bestCamera:'CLOSE_UP',
    DNA:{ flexibility:6, aggression:2, balance:5, speed:2, acrobatics:3, combatStyle:2, silhouetteReadability:7 },
    interactionType:'emotion', leadingMass:'hands',
    anatomy:{ torsoRotation:25, hipTilt:-20, shoulderTilt:20, foreshortening:0.5 },
  },
  {
    id:'cold_threat', name:'Cold Threat', category:'DIALOGUE', emoji:'🥶',
    artistDNA:"Miller's cold villain lean · Hitch close-up calculated menace",
    lineOfAction:'Slow forward lean — controlled weight shift, proximity weaponized',
    silhouetteShape:'Inverted wedge closing — head grows, body narrows toward camera',
    motionLanguage:'Volume drops below whisper · smile does not reach eyes · no rush',
    bestCamera:'EXTREME_CLOSE_UP',
    DNA:{ flexibility:4, aggression:9, balance:8, speed:2, acrobatics:2, combatStyle:8, silhouetteReadability:8 },
    interactionType:'tension', leadingMass:'face',
    anatomy:{ torsoRotation:10, hipTilt:-5, shoulderTilt:10, foreshortening:0.4 },
  },
  {
    id:'revelation_moment', name:'Revelation Moment', category:'DIALOGUE', emoji:'😱',
    artistDNA:'Pérez double-page reaction · Adams bombshell reveal staging',
    lineOfAction:'Speaker diagonal to listener vertical — revelation fires left to right',
    silhouetteShape:'Arrow to wall — speaker gestures, listener recoils in shock',
    motionLanguage:'World stops · coffee cup hits floor in slow motion · everything changes',
    bestCamera:'WIDE_SHOT',
    DNA:{ flexibility:4, aggression:4, balance:6, speed:2, acrobatics:2, combatStyle:3, silhouetteReadability:8 },
    interactionType:'emotion', leadingMass:'face',
    anatomy:{ torsoRotation:20, hipTilt:-10, shoulderTilt:15, foreshortening:0.4 },
  },
  {
    id:'ultimatum_pose', name:'Ultimatum Pose', category:'DIALOGUE', emoji:'⏳',
    artistDNA:'Hitch boardroom ultimatum · Miller final offer closed stance',
    lineOfAction:'Locked vertical — arms folded, zero concession in every line',
    silhouetteShape:'Closed rectangle — arms create horizontal bar, non-negotiable',
    motionLanguage:'This is the last offer · clock ticks audibly · blink and it is war',
    bestCamera:'MEDIUM_SHOT',
    DNA:{ flexibility:3, aggression:7, balance:9, speed:1, acrobatics:1, combatStyle:7, silhouetteReadability:8 },
    interactionType:'tension', leadingMass:'arms',
    anatomy:{ torsoRotation:5, hipTilt:0, shoulderTilt:5, foreshortening:0.2 },
  },
  {
    id:'mentor_guidance', name:'Mentor Guidance', category:'DIALOGUE', emoji:'🎓',
    artistDNA:'Ross Xavier and student · Adams Batman teaching Dick Grayson',
    lineOfAction:'Paired columns — elder slightly taller, hand on younger shoulder',
    silhouetteShape:'Two-pillar composition — close together, trust in shared space',
    motionLanguage:'Wisdom transfers slowly · hand on shoulder carries weight of years',
    bestCamera:'MEDIUM_SHOT',
    DNA:{ flexibility:4, aggression:2, balance:9, speed:1, acrobatics:1, combatStyle:3, silhouetteReadability:8 },
    interactionType:'emotion', leadingMass:'hand',
    anatomy:{ torsoRotation:15, hipTilt:-5, shoulderTilt:10, foreshortening:0.2 },
  },
];

// ── Scene Generator output from Java spec ────────────────────────────────────
const SCENE_CHECKS = [
  { icon: '📐', label: 'Dynamic Panel Layout',       detail: 'Wally Wood principle — vary panel height by action energy' },
  { icon: '🎬', label: 'Cinematic Camera Placement', detail: 'Shot type matched to emotional moment' },
  { icon: '🌊', label: 'Action Flow Composition',    detail: 'Eye moves left-to-right through action sequence' },
  { icon: '🔲', label: 'Z-Pattern Eye Tracking',     detail: 'Pérez/Hitch rule — gaze guided through page' },
  { icon: '🤝', label: 'Team Positioning',           detail: 'No two characters at same depth — stagger for read clarity' },
  { icon: '📏', label: 'Perspective Staging',        detail: 'Neal Adams foreshortening — one element toward reader' },
  { icon: '📖', label: 'Comic Storyboarding',        detail: 'Kirby rule — every panel advances story OR character' },
];

// ── Pose Prompt Builder (ported from Java PosePromptBuilder) ──────────────────
function buildPrompt(
  archetype: Archetype,
  camera: CameraId,
  intensity: number,
  charName: string,
  activeDNA?: CharacterDNA | null,
  activeEnv?: ActiveEnvironment | null,
  activeGroupType?: CompositionType | null,
  cinematicFragment?: string | null,
): string {
  const cam = CAMERA_SHOTS.find(c => c.id === camera);
  const cat = CATEGORIES.find(c => c.id === archetype.category);
  // Include PoseDNA anatomy fields if present (ported from Java PoseDNA)
  const anatomyFragment = archetype.anatomy
    ? `Torso rotation ${archetype.anatomy.torsoRotation > 0 ? '+' : ''}${archetype.anatomy.torsoRotation}°, ` +
      `hip tilt ${archetype.anatomy.hipTilt > 0 ? '+' : ''}${archetype.anatomy.hipTilt}°, ` +
      `shoulder tilt ${archetype.anatomy.shoulderTilt > 0 ? '+' : ''}${archetype.anatomy.shoulderTilt}°, ` +
      `foreshortening ${Math.round(archetype.anatomy.foreshortening * 100)}%.`
    : null;
  // CompositionEngine — panel layout DNA (ported from Java CompositionEngine)
  const comp = getCompositionDNA(
    archetype.category,
    archetype.interactionType ?? 'neutral',
    archetype.leadingMass ?? archetype.silhouetteShape,
    archetype.silhouetteShape,
  );
  const compositionFragment =
    `Composition: ${comp.compositionType.replace(/_/g, ' ')}, ` +
    `force geometry ${comp.forceGeometry.replace(/_/g, ' ')}, ` +
    `eye path ${comp.eyePath.replace(/_/g, ' ')}.`;
  const characterFragment = activeDNA
    ? buildCharacterDNAFragment(activeDNA)
    : charName.trim() ? charName + '.' : null;
  const environmentFragment  = activeEnv       ? buildEnvironmentFragment(activeEnv)             : null;
  const groupFragment        = activeGroupType  ? buildGroupCompositionFragment(activeGroupType)  : null;
  return [
    characterFragment ?? 'Comic hero.',
    archetype.name + '.',
    `Camera: ${cam?.label ?? camera}.`,
    `Action intensity ${intensity}/100.`,
    `Line of action: ${archetype.lineOfAction}.`,
    `Silhouette shape: ${archetype.silhouetteShape}.`,
    `Motion language: ${archetype.motionLanguage}.`,
    `Artist DNA: ${archetype.artistDNA}.`,
    archetype.interactionType ? `Interaction type: ${archetype.interactionType}.` : null,
    archetype.leadingMass     ? `Leading mass: ${archetype.leadingMass}.`         : null,
    anatomyFragment,
    compositionFragment,
    `Category: ${cat?.artistRef ?? archetype.category}.`,
    'Dynamic comic anatomy.',
    buildForeshorteningPromptFragment(getForeshorteningProfile(archetype.id), intensity) + '.',
    environmentFragment,
    groupFragment,
    cinematicFragment ?? null,
    'Professional classic comics style action pose.',
    'Black and white pencil sketch preview.',
    'Cinematic composition.',
    'Strong silhouette readability.',
    'Gesture drawing energy lines.',
    'Storyboard quality action staging.',
    'Comic panel ready.',
  ].filter(Boolean).join(' ');
}

// ── DNA Bar ───────────────────────────────────────────────────────────────────
function DNABar({ label, value }: { label: string; value: number }) {
  const pct = (value / 10) * 100;
  const color = value >= 8 ? C.red : value >= 6 ? C.gold : value >= 4 ? C.blue : C.muted;
  return (
    <View style={db.row}>
      <Text style={db.label}>{label}</Text>
      <View style={db.track}>
        <View style={[db.fill, { width: `${pct}%` as any, backgroundColor: color }]} />
      </View>
      <Text style={[db.val, { color }]}>{value.toFixed(0)}</Text>
    </View>
  );
}
const db = StyleSheet.create({
  row:   { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  label: { width: 120, fontFamily: 'Inter_600SemiBold', fontSize: 11, color: C.muted },
  track: { flex: 1, height: 5, borderRadius: 3, backgroundColor: C.border, overflow: 'hidden' },
  fill:  { height: 5, borderRadius: 3 },
  val:   { width: 20, fontFamily: 'Inter_700Bold', fontSize: 11, textAlign: 'right' },
});

// ── Intensity slider (pure RN, no external lib) ───────────────────────────────
function IntensitySlider({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const STEPS = [0,10,20,30,40,50,60,70,80,90,100];
  const color = value >= 80 ? C.red : value >= 50 ? C.gold : C.blue;
  return (
    <View>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
        <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 11, color: C.muted, letterSpacing: 1 }}>ACTION INTENSITY</Text>
        <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 15, color }}>{value}</Text>
      </View>
      <View style={{ flexDirection: 'row', gap: 4 }}>
        {STEPS.map(s => (
          <TouchableOpacity
            key={s}
            style={{ flex: 1, height: 28, borderRadius: 4, alignItems: 'center', justifyContent: 'center',
              backgroundColor: s <= value ? color + '33' : C.border, borderWidth: 1,
              borderColor: s <= value ? color : C.border }}
            onPress={() => { Haptics.selectionAsync(); onChange(s); }}
            activeOpacity={0.8}
          >
            <Text style={{ color: s <= value ? color : C.muted, fontSize: 8, fontFamily: 'Inter_700Bold' }}>
              {s === 0 ? 'IDLE' : s === 100 ? 'MAX' : ''}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 }}>
        <Text style={{ color: C.muted, fontSize: 9, fontFamily: 'Inter_400Regular' }}>IDLE · CALM</Text>
        <Text style={{ color: C.muted, fontSize: 9, fontFamily: 'Inter_400Regular' }}>EXPLOSIVE · MAXIMUM</Text>
      </View>
    </View>
  );
}

// ── Foreshortening Engine Block ───────────────────────────────────────────────
function ForeshorteningBlock({
  archetypeId, dna, intensity, catColor,
}: {
  archetypeId: string;
  dna: Archetype['DNA'];
  intensity: number;
  catColor: string;
}) {
  const profile: ForeshorteningProfile = getForeshorteningProfile(archetypeId);
  const analysis: PoseAnalysis = analyzePose(dna, profile, intensity);
  const effects = getActiveEffects(intensity, profile);
  const compressions = Object.entries(profile.anatomyCompression);

  const publisherColor =
    profile.publisherStyle === 'Action Comics'  ? C.red :
    profile.publisherStyle === 'Heroic Comics'  ? C.blue : C.gold;

  const formatPart = (s: string) =>
    s.replace(/([A-Z])/g, ' $1').replace(/^./, c => c.toUpperCase()).trim();

  const distortionPct = (profile.distortion / 10) * 100;
  const distortionColor =
    profile.distortion >= 8 ? C.red :
    profile.distortion >= 5 ? C.gold : C.blue;

  return (
    <View style={[fb.wrap, { borderColor: catColor + '35' }]}>
      {/* Header row */}
      <View style={fb.header}>
        <Text style={fb.title}>FORESHORTENING ENGINE</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <View style={[fb.badge, { borderColor: publisherColor + '55', backgroundColor: publisherColor + '18' }]}>
            <Text style={[fb.badgeText, { color: publisherColor }]}>{profile.publisherStyle}</Text>
          </View>
          <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 13, color: distortionColor }}>
            {profile.distortion}/10
          </Text>
        </View>
      </View>

      {/* Dominant shape + distortion bar */}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 }}>
        <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 10, color: C.muted, flex: 1 }}>
          Shape: <Text style={{ color: C.white }}>{profile.dominantShape}</Text>
        </Text>
        <View style={[fb.miniTrack, { flex: 1 }]}>
          <View style={[fb.miniFill, { width: `${distortionPct}%` as any, backgroundColor: distortionColor }]} />
        </View>
      </View>

      {/* Anatomy Compression bars */}
      <Text style={fb.subTitle}>ANATOMY COMPRESSION</Text>
      {compressions.map(([part, val]) => {
        const pct = Math.min((val / 2.5) * 100, 100);
        const barC =
          val >= 2.0 ? C.red  :
          val >= 1.5 ? C.gold :
          val >= 1.1 ? catColor : C.muted;
        return (
          <View key={part} style={fb.row}>
            <Text style={fb.partLabel}>{formatPart(part)}</Text>
            <View style={fb.track}>
              <View style={[fb.fill, { width: `${pct}%` as any, backgroundColor: barC }]} />
            </View>
            <Text style={[fb.scale, { color: barC }]}>×{val.toFixed(1)}</Text>
          </View>
        );
      })}

      {/* Publisher style analysis */}
      <Text style={[fb.subTitle, { marginTop: 10 }]}>PUBLISHER STYLE ANALYSIS</Text>
      {([['Action', C.red, analysis.marvelScore], ['Heroic', C.blue, analysis.dcScore]] as const).map(([label, color, score]) => (
        <View key={label} style={fb.row}>
          <Text style={[fb.pubLabel, { color }]}>{label}</Text>
          <View style={fb.track}>
            <View style={[fb.fill, { width: `${score}%` as any, backgroundColor: color + 'AA' }]} />
          </View>
          <Text style={[fb.scale, { color }]}>{score}</Text>
        </View>
      ))}

      {/* Extreme + Silhouette scores */}
      <View style={{ flexDirection: 'row', gap: 8, marginTop: 8 }}>
        <View style={[fb.scoreChip, { borderColor: C.red + '40', backgroundColor: C.red + '10' }]}>
          <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 9, color: C.muted, letterSpacing: 0.8 }}>EXTREME</Text>
          <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 16, color: C.red }}>{analysis.extremeScore}</Text>
          <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 8, color: C.muted }}>/10</Text>
        </View>
        <View style={[fb.scoreChip, { borderColor: C.blue + '40', backgroundColor: C.blue + '10' }]}>
          <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 9, color: C.muted, letterSpacing: 0.8 }}>SILHOUETTE</Text>
          <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 16, color: C.blue }}>{analysis.silhouetteScore}</Text>
          <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 8, color: C.muted }}>/10</Text>
        </View>
        {/* Camera angle chip */}
        <View style={[fb.scoreChip, { flex: 1, borderColor: catColor + '40', backgroundColor: catColor + '10' }]}>
          <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 9, color: C.muted, letterSpacing: 0.8 }}>CAMERA</Text>
          <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 9, color: catColor, textAlign: 'center', marginTop: 4 }} numberOfLines={2}>
            {profile.cameraAngle.replace(/_/g, ' ').toUpperCase()}
          </Text>
        </View>
      </View>

      {/* Active effects */}
      {effects.length > 0 && (
        <View style={fb.effectsRow}>
          {effects.map(fx => {
            const emoji = fx === 'Speed Lines' ? '⚡' : fx === 'Impact Burst' ? '💥' : '🔥';
            return (
              <View key={fx} style={[fb.fxChip, { borderColor: catColor + '55', backgroundColor: catColor + '12' }]}>
                <Text style={{ fontSize: 10 }}>{emoji}</Text>
                <Text style={[fb.fxText, { color: catColor }]}>{fx.toUpperCase()}</Text>
              </View>
            );
          })}
        </View>
      )}

      {/* Pose correction tips */}
      {analysis.recommendations.length > 0 && (
        <View style={fb.corrections}>
          <Text style={fb.subTitle}>POSE CORRECTION</Text>
          {analysis.recommendations.map((tip, i) => (
            <View key={i} style={{ flexDirection: 'row', gap: 6, marginBottom: 3 }}>
              <Text style={{ color: catColor, fontSize: 10, fontFamily: 'Inter_700Bold' }}>▸</Text>
              <Text style={{ flex: 1, fontFamily: 'Inter_400Regular', fontSize: 10, color: C.muted, lineHeight: 15 }}>
                {tip}
              </Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}
const fb = StyleSheet.create({
  wrap:       { borderWidth: 1, borderRadius: 12, padding: 14, marginBottom: 12 },
  header:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  title:      { fontFamily: 'Inter_700Bold', fontSize: 9, color: C.muted, letterSpacing: 1.5 },
  badge:      { borderWidth: 1, borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2 },
  badgeText:  { fontFamily: 'Inter_700Bold', fontSize: 8, letterSpacing: 1 },
  subTitle:   { fontFamily: 'Inter_700Bold', fontSize: 9, color: C.muted, letterSpacing: 1.5, marginBottom: 6 },
  row:        { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 5 },
  partLabel:  { width: 86, fontFamily: 'Inter_600SemiBold', fontSize: 9, color: C.muted },
  pubLabel:   { width: 50, fontFamily: 'Inter_700Bold', fontSize: 10 },
  track:      { flex: 1, height: 5, borderRadius: 3, backgroundColor: C.border, overflow: 'hidden' },
  fill:       { height: 5, borderRadius: 3 },
  scale:      { width: 32, fontFamily: 'Inter_700Bold', fontSize: 10, textAlign: 'right' },
  miniTrack:  { height: 3, borderRadius: 2, backgroundColor: C.border, overflow: 'hidden' },
  miniFill:   { height: 3, borderRadius: 2 },
  scoreChip:  { width: 64, borderWidth: 1, borderRadius: 10, padding: 8, alignItems: 'center', gap: 2 },
  effectsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 10 },
  fxChip:     { flexDirection: 'row', alignItems: 'center', gap: 4, borderWidth: 1, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
  fxText:     { fontFamily: 'Inter_700Bold', fontSize: 9, letterSpacing: 0.5 },
  corrections:{ marginTop: 10, borderTopWidth: 1, borderTopColor: C.border, paddingTop: 8 },
});

// ── Panel Break Block (ported from Java PanelBreakEngine) ────────────────────
function PanelBreakBlock({
  category, interactionType, intensity, catColor,
}: {
  category: string; interactionType: string; intensity: number; catColor: string;
}) {
  const result: PanelBreakResult = getPanelBreakRecommendation(category, interactionType, intensity);
  const MODES: PanelBreakMode[] = ['NONE', 'MINOR', 'ACTION', 'EXTREME', 'FULL_BLEED'];
  const modeIndex = MODES.indexOf(result.mode);
  const modeColors: Record<PanelBreakMode, string> = {
    NONE:       C.muted,
    MINOR:      C.blue,
    ACTION:     C.gold,
    EXTREME:    C.orange,
    FULL_BLEED: C.red,
  };
  const modeColor = modeColors[result.mode];

  return (
    <View style={[pb.wrap, { borderColor: modeColor + '35' }]}>
      <View style={pb.header}>
        <Text style={pb.title}>PANEL BREAK ENGINE</Text>
        <View style={[pb.badge, { borderColor: modeColor + '60', backgroundColor: modeColor + '18' }]}>
          <Text style={[pb.badgeText, { color: modeColor }]}>{result.mode.replace('_', ' ')}</Text>
        </View>
      </View>

      {/* Mode progression strip: NONE → MINOR → ACTION → EXTREME → FULL_BLEED */}
      <View style={pb.modeRow}>
        {MODES.map((m, i) => {
          const active = i <= modeIndex;
          const isCurrent = m === result.mode;
          const mc = modeColors[m];
          return (
            <View key={m} style={[pb.modeSeg, {
              backgroundColor: active ? mc + '28' : C.border,
              borderWidth: isCurrent ? 1 : 0,
              borderColor: mc,
            }]}>
              <Text style={{ fontSize: 6, fontFamily: 'Inter_700Bold', color: active ? mc : C.muted, textAlign: 'center' }}>
                {m === 'FULL_BLEED' ? 'BLEED' : m}
              </Text>
            </View>
          );
        })}
      </View>

      <Text style={pb.desc}>{result.description}</Text>

      {/* Overflow flags */}
      <View style={pb.flagRow}>
        {([
          { key: 'DEBRIS',  active: result.debrisOverflow, emoji: '💫' },
          { key: 'ENERGY',  active: result.energyOverflow,  emoji: '⚡' },
          { key: 'SHATTER', active: result.shatterPanel,    emoji: '💥' },
        ] as const).map(f => (
          <View key={f.key} style={[pb.flag, {
            borderColor:     f.active ? modeColor + '55' : C.border,
            backgroundColor: f.active ? modeColor + '12' : 'transparent',
          }]}>
            <Text style={{ fontSize: 10 }}>{f.active ? f.emoji : '○'}</Text>
            <Text style={[pb.flagText, { color: f.active ? modeColor : C.muted }]}>{f.key}</Text>
          </View>
        ))}
        {result.breakDirection !== 'none' && (
          <View style={[pb.flag, { flex: 1.2, borderColor: catColor + '55', backgroundColor: catColor + '12' }]}>
            <Text style={{ fontSize: 10 }}>↗</Text>
            <Text style={[pb.flagText, { color: catColor }]}>{result.breakDirection.toUpperCase()}</Text>
          </View>
        )}
      </View>
    </View>
  );
}
const pb = StyleSheet.create({
  wrap:     { borderWidth: 1, borderRadius: 12, padding: 14, marginBottom: 12 },
  header:   { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
  title:    { fontFamily: 'Inter_700Bold', fontSize: 9, color: C.muted, letterSpacing: 1.5 },
  badge:    { borderWidth: 1, borderRadius: 6, paddingHorizontal: 7, paddingVertical: 3 },
  badgeText:{ fontFamily: 'Inter_700Bold', fontSize: 9, letterSpacing: 0.8 },
  modeRow:  { flexDirection: 'row', gap: 4, marginBottom: 8 },
  modeSeg:  { flex: 1, borderRadius: 4, paddingVertical: 6, alignItems: 'center', justifyContent: 'center' },
  desc:     { fontFamily: 'Inter_400Regular', fontSize: 10, color: C.muted, lineHeight: 15, marginBottom: 10 },
  flagRow:  { flexDirection: 'row', gap: 5 },
  flag:     { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, borderWidth: 1, borderRadius: 8, paddingVertical: 6 },
  flagText: { fontFamily: 'Inter_700Bold', fontSize: 8, letterSpacing: 0.5 },
});

// ── Anatomy Blueprint Block (ported from Java PoseDNA anatomy fields) ─────────
function AnatomyBlock({
  anatomy, catColor,
}: {
  anatomy: NonNullable<Archetype['anatomy']>; catColor: string;
}) {
  const rows = [
    { label: 'Torso Rotation', value: anatomy.torsoRotation, max: 45 },
    { label: 'Hip Tilt',       value: anatomy.hipTilt,        max: 35 },
    { label: 'Shoulder Tilt',  value: anatomy.shoulderTilt,   max: 35 },
  ] as const;

  return (
    <View style={[ab.wrap, { borderColor: catColor + '30' }]}>
      <View style={ab.header}>
        <Text style={ab.title}>ANATOMY BLUEPRINT</Text>
        <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 9, color: C.muted }}>Java PoseDNA</Text>
      </View>

      {rows.map(({ label, value, max }) => {
        const pct = Math.min(Math.abs(value) / max * 100, 100);
        const isNeg = value < 0;
        return (
          <View key={label} style={{ marginBottom: 9 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 3 }}>
              <Text style={ab.label}>{label}</Text>
              <Text style={[ab.val, { color: catColor }]}>{value > 0 ? '+' : ''}{value}°</Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
              {/* Left (negative) side */}
              <View style={{ flex: 1, height: 4, borderRadius: 2, backgroundColor: C.border, overflow: 'hidden', flexDirection: 'row', justifyContent: 'flex-end' }}>
                {isNeg && <View style={{ width: `${pct}%` as any, height: 4, backgroundColor: catColor + 'AA', borderRadius: 2 }} />}
              </View>
              <View style={ab.pivot} />
              {/* Right (positive) side */}
              <View style={{ flex: 1, height: 4, borderRadius: 2, backgroundColor: C.border, overflow: 'hidden' }}>
                {!isNeg && <View style={{ width: `${pct}%` as any, height: 4, backgroundColor: catColor, borderRadius: 2 }} />}
              </View>
            </View>
          </View>
        );
      })}

      {/* Foreshortening bar */}
      <View style={{ borderTopWidth: 1, borderTopColor: C.border, paddingTop: 8, marginTop: 2 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
          <Text style={ab.label}>Foreshortening</Text>
          <Text style={[ab.val, { color: catColor }]}>{Math.round(anatomy.foreshortening * 100)}%</Text>
        </View>
        <View style={{ height: 5, borderRadius: 3, backgroundColor: C.border, overflow: 'hidden' }}>
          <View style={{ width: `${anatomy.foreshortening * 100}%` as any, height: 5, backgroundColor: catColor, borderRadius: 3 }} />
        </View>
      </View>
    </View>
  );
}
const ab = StyleSheet.create({
  wrap:      { borderWidth: 1, borderRadius: 12, padding: 14, marginBottom: 12 },
  header:    { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
  title:     { fontFamily: 'Inter_700Bold', fontSize: 9, color: C.muted, letterSpacing: 1.5 },
  label:     { fontFamily: 'Inter_600SemiBold', fontSize: 10, color: C.muted },
  val:       { fontFamily: 'Inter_700Bold', fontSize: 10 },
  pivot:     { width: 1, height: 10, backgroundColor: C.muted + '50' },
});

// ── Composition Engine Block (ported from Java CompositionEngine) ──────────────
function CompositionBlock({ archetype, catColor }: {
  archetype: Archetype; catColor: string;
}) {
  const comp: CompositionDNA = getCompositionDNA(
    archetype.category,
    archetype.interactionType ?? 'neutral',
    archetype.leadingMass ?? archetype.silhouetteShape,
    archetype.silhouetteShape,
  );
  const fmt = (s: string) => s.replace(/_/g, ' ').toUpperCase();
  const rows = [
    { icon: '🎭', label: 'COMPOSITION', value: fmt(comp.compositionType) },
    { icon: '⚡', label: 'FORCE GEO',   value: fmt(comp.forceGeometry) },
    { icon: '👁', label: 'EYE PATH',    value: fmt(comp.eyePath) },
    { icon: '🎯', label: 'FOCAL POINT', value: fmt(comp.focalPoint) },
    { icon: '📐', label: 'DEPTH',       value: 'F · M · BG' },
  ];
  return (
    <View style={[cob.wrap, { borderColor: catColor + '30' }]}>
      <View style={cob.header}>
        <Text style={cob.title}>COMPOSITION ENGINE</Text>
        <View style={[cob.badge, { borderColor: catColor + '55', backgroundColor: catColor + '15' }]}>
          <Text style={[cob.badgeText, { color: catColor }]}>CINEMATIC</Text>
        </View>
      </View>
      {rows.map(row => (
        <View key={row.label} style={cob.row}>
          <Text style={{ fontSize: 10, width: 18 }}>{row.icon}</Text>
          <Text style={cob.rowLabel}>{row.label}</Text>
          <View style={[cob.chip, { borderColor: catColor + '40', backgroundColor: catColor + '0C' }]}>
            <Text style={[cob.chipText, { color: catColor }]}>{row.value}</Text>
          </View>
        </View>
      ))}
    </View>
  );
}
const cob = StyleSheet.create({
  wrap:      { borderWidth: 1, borderRadius: 12, padding: 14, marginBottom: 12 },
  header:    { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
  title:     { fontFamily: 'Inter_700Bold', fontSize: 9, color: C.muted, letterSpacing: 1.5 },
  badge:     { borderWidth: 1, borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2 },
  badgeText: { fontFamily: 'Inter_700Bold', fontSize: 8, letterSpacing: 0.8 },
  row:       { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 7 },
  rowLabel:  { fontFamily: 'Inter_700Bold', fontSize: 9, color: C.muted, letterSpacing: 0.8, width: 90 },
  chip:      { flex: 1, borderWidth: 1, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 4 },
  chipText:  { fontFamily: 'Inter_600SemiBold', fontSize: 9, letterSpacing: 0.5 },
});

// ── Archetype Card ────────────────────────────────────────────────────────────
function ArchetypeCard({ archetype, selected, catColor, onPress, isMatched }: {
  archetype: Archetype; selected: boolean; catColor: string; onPress: () => void; isMatched?: boolean;
}) {
  const borderCol = isMatched && !selected ? C.gold : selected ? catColor : C.border;
  const bgCol     = isMatched && !selected ? '#FFD60010' : selected ? catColor + '15' : C.card;
  return (
    <TouchableOpacity
      style={[ac.card, { borderColor: borderCol, backgroundColor: bgCol }]}
      onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); onPress(); }}
      activeOpacity={0.8}
    >
      {/* Gold match dot — lit when action search hits this archetype */}
      {isMatched && !selected && (
        <View style={ac.matchDot} />
      )}
      {/* Sketch thumbnail */}
      <View style={[ac.sketchBox, { borderColor: selected ? catColor + '40' : isMatched ? C.gold + '40' : C.border }]}>
        <PoseSketch
          archetypeId={archetype.id}
          size={72}
          color={selected ? catColor : isMatched ? C.gold : undefined}
        />
      </View>
      <Text style={[ac.name, { color: selected ? catColor : isMatched ? C.gold : C.white }]} numberOfLines={2}>
        {archetype.name}
      </Text>
      <Text style={ac.camera} numberOfLines={1}>
        {CAMERA_SHOTS.find(c => c.id === archetype.bestCamera)?.emoji}
        <Text style={{ fontSize: 8, color: C.muted }}> {archetype.emoji}</Text>
      </Text>
    </TouchableOpacity>
  );
}
const ac = StyleSheet.create({
  card:     { borderRadius: 10, borderWidth: 1, padding: 8, alignItems: 'center', gap: 4 },
  sketchBox:{ width: '100%', aspectRatio: 1, borderRadius: 8, borderWidth: 1,
              alignItems: 'center', justifyContent: 'center', backgroundColor: '#0A080614', marginBottom: 2 },
  name:     { fontFamily: 'Inter_600SemiBold', fontSize: 10, textAlign: 'center', lineHeight: 14 },
  camera:   { fontSize: 11 },
  matchDot: { position: 'absolute', top: 5, right: 5, width: 6, height: 6, borderRadius: 3, backgroundColor: C.gold },
});

// ── Archetype Detail Modal ────────────────────────────────────────────────────
function ArchetypeModal({
  archetype, camera, intensity, charName, visible, onClose, onCopy, copied,
  onCameraChange, onIntensityChange, activeDNA, onOpenCharBuilder,
}: {
  archetype: Archetype | null; camera: CameraId; intensity: number;
  charName: string; visible: boolean; onClose: () => void;
  onCopy: () => void; copied: boolean;
  onCameraChange: (c: CameraId) => void; onIntensityChange: (v: number) => void;
  activeDNA?: CharacterDNA | null; onOpenCharBuilder?: () => void;
}) {
  if (!archetype) return null;
  const cat = CATEGORIES.find(c => c.id === archetype.category)!;
  const prompt = buildPrompt(archetype, camera, intensity, charName, activeDNA);

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <Pressable style={md.overlay} onPress={onClose}>
        <View style={[md.sheet, { backgroundColor: C.bg }]}>
          <View style={[md.handle, { backgroundColor: cat.color }]} />

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={md.scroll}>
            {/* Header row: sketch + title + close */}
            <View style={md.head}>
              {/* Large sketch preview */}
              <View style={[md.sketchWrap, { borderColor: cat.color + '35', backgroundColor: cat.color + '08' }]}>
                <PoseSketch archetypeId={archetype.id} size={110} color={cat.color} />
                {/* Category label overlaid on sketch */}
                <View style={[md.sketchLabel, { backgroundColor: cat.color + '25', borderColor: cat.color + '50' }]}>
                  <Text style={[md.sketchLabelText, { color: cat.color }]}>{cat.emoji} {cat.label}</Text>
                </View>
              </View>

              {/* Title + meta */}
              <View style={{ flex: 1, paddingLeft: 12 }}>
                <Text style={[md.title, { color: C.white }]}>{archetype.name}</Text>
                <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 11, color: C.muted, marginTop: 4, lineHeight: 16 }}>
                  {archetype.emoji} {archetype.motionLanguage.split(' · ')[0]}
                </Text>
                <View style={{ marginTop: 8 }}>
                  <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 9, color: C.muted, letterSpacing: 1.2, marginBottom: 3 }}>BEST CAMERA</Text>
                  <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 11, color: cat.color }}>
                    {CAMERA_SHOTS.find(c => c.id === archetype.bestCamera)?.emoji}{' '}
                    {CAMERA_SHOTS.find(c => c.id === archetype.bestCamera)?.label}
                  </Text>
                </View>
              </View>

              <TouchableOpacity
                onPress={onClose}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                style={{ alignSelf: 'flex-start' }}
              >
                <Feather name="x" size={20} color={C.muted} />
              </TouchableOpacity>
            </View>

            {/* Artist DNA */}
            <View style={[md.block, { borderColor: C.border }]}>
              <Text style={md.blockTitle}>ARTIST DNA</Text>
              <Text style={[md.value, { color: cat.color }]}>{archetype.artistDNA}</Text>
            </View>

            {/* Line of Action */}
            <View style={{ flexDirection: 'row', gap: 8, marginBottom: 12 }}>
              <View style={[md.halfBlock, { borderColor: C.border }]}>
                <Text style={md.blockTitle}>LINE OF ACTION</Text>
                <Text style={[md.value, { color: C.white }]}>{archetype.lineOfAction}</Text>
              </View>
              <View style={[md.halfBlock, { borderColor: C.border }]}>
                <Text style={md.blockTitle}>SILHOUETTE SHAPE</Text>
                <Text style={[md.value, { color: C.white }]}>{archetype.silhouetteShape}</Text>
              </View>
            </View>

            {/* Motion Language */}
            <View style={[md.block, { borderColor: C.border }]}>
              <Text style={md.blockTitle}>MOTION LANGUAGE</Text>
              <Text style={[md.value, { color: C.white }]}>{archetype.motionLanguage}</Text>
            </View>

            {/* Foreshortening Engine */}
            <ForeshorteningBlock
              archetypeId={archetype.id}
              dna={archetype.DNA}
              intensity={intensity}
              catColor={cat.color}
            />

            {/* Panel Break Engine — ported from Java PanelBreakEngine.analyze() */}
            <PanelBreakBlock
              category={archetype.category}
              interactionType={archetype.interactionType ?? 'neutral'}
              intensity={intensity}
              catColor={cat.color}
            />

            {/* Anatomy Blueprint — shown only when archetype has Java PoseDNA anatomy data */}
            {archetype.anatomy && (
              <AnatomyBlock anatomy={archetype.anatomy} catColor={cat.color} />
            )}

            {/* Composition Engine — panel layout DNA (ported from Java CompositionEngine) */}
            <CompositionBlock archetype={archetype} catColor={cat.color} />

            {/* Pose DNA bars */}
            <View style={[md.block, { borderColor: C.border }]}>
              <Text style={md.blockTitle}>POSE DNA</Text>
              <DNABar label="Flexibility"     value={archetype.DNA.flexibility} />
              <DNABar label="Aggression"      value={archetype.DNA.aggression} />
              <DNABar label="Balance"         value={archetype.DNA.balance} />
              <DNABar label="Speed"           value={archetype.DNA.speed} />
              <DNABar label="Acrobatics"      value={archetype.DNA.acrobatics} />
              <DNABar label="Combat Style"    value={archetype.DNA.combatStyle} />
              <DNABar label="Silhouette Read" value={archetype.DNA.silhouetteReadability} />
            </View>

            {/* Camera shot selector */}
            <View style={[md.block, { borderColor: C.border }]}>
              <Text style={md.blockTitle}>CAMERA SHOT</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 7 }}>
                {CAMERA_SHOTS.map(cs => {
                  const sel = camera === cs.id;
                  return (
                    <TouchableOpacity
                      key={cs.id}
                      style={[md.camChip, { borderColor: sel ? C.gold : C.border, backgroundColor: sel ? C.goldBg : C.bgMid }]}
                      onPress={() => { Haptics.selectionAsync(); onCameraChange(cs.id); }}
                      activeOpacity={0.8}
                    >
                      <Text style={{ fontSize: 14 }}>{cs.emoji}</Text>
                      <Text style={[md.camLabel, { color: sel ? C.gold : C.muted }]}>{cs.label}</Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
              {/* Best camera hint */}
              <Text style={md.camHint}>
                Best: {CAMERA_SHOTS.find(c => c.id === archetype.bestCamera)?.emoji} {CAMERA_SHOTS.find(c => c.id === archetype.bestCamera)?.label}
                {' · '}{CAMERA_SHOTS.find(c => c.id === archetype.bestCamera)?.desc}
              </Text>
            </View>

            {/* Intensity */}
            <View style={[md.block, { borderColor: C.border }]}>
              <IntensitySlider value={intensity} onChange={onIntensityChange} />
            </View>

            {/* AI Prompt */}
            <View style={[md.block, { borderColor: C.border }]}>
              <View style={md.promptHead}>
                <Text style={md.blockTitle}>AI IMAGE PROMPT</Text>
                <TouchableOpacity
                  style={[md.copyBtn, { borderColor: copied ? C.green : C.border, backgroundColor: copied ? C.green + '18' : C.bgMid }]}
                  onPress={onCopy}
                  activeOpacity={0.8}
                >
                  <Feather name={copied ? 'check' : 'copy'} size={11} color={copied ? C.green : C.muted} />
                  <Text style={[md.copyText, { color: copied ? C.green : C.muted }]}>{copied ? 'COPIED' : 'COPY'}</Text>
                </TouchableOpacity>
              </View>
              <Text style={md.promptText} selectable>{prompt}</Text>
            </View>
          </ScrollView>
        </View>
      </Pressable>
    </Modal>
  );
}

const md = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: '#000000CC', justifyContent: 'flex-end' },
  sheet:   { borderTopLeftRadius: 22, borderTopRightRadius: 22, maxHeight: '93%' },
  handle:  { width: 44, height: 4, borderRadius: 2, alignSelf: 'center', marginTop: 10, marginBottom: 4 },
  scroll:  { padding: 20, paddingBottom: 40 },
  head:       { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16 },
  sketchWrap: { width: 110, height: 110, borderRadius: 14, borderWidth: 1, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  sketchLabel:{ position: 'absolute', bottom: 0, left: 0, right: 0, borderTopWidth: 1, paddingVertical: 3, alignItems: 'center' },
  sketchLabelText: { fontFamily: 'Inter_700Bold', fontSize: 8, letterSpacing: 0.8 },
  title:      { fontFamily: 'Inter_700Bold', fontSize: 18, marginBottom: 2 },
  catTag:     { borderWidth: 1, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3, alignSelf: 'flex-start' },
  catTagText: { fontFamily: 'Inter_600SemiBold', fontSize: 11 },
  block:   { borderWidth: 1, borderRadius: 12, padding: 14, marginBottom: 12 },
  halfBlock:{ flex: 1, borderWidth: 1, borderRadius: 12, padding: 12 },
  blockTitle:{ fontFamily: 'Inter_700Bold', fontSize: 9, color: C.muted, letterSpacing: 1.5, marginBottom: 6 },
  value:   { fontFamily: 'Inter_400Regular', fontSize: 12, lineHeight: 18, color: C.white },
  camChip: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 8, alignItems: 'center', gap: 3 },
  camLabel:{ fontFamily: 'Inter_600SemiBold', fontSize: 9, letterSpacing: 0.5 },
  camHint: { fontFamily: 'Inter_400Regular', fontSize: 10, color: C.muted, marginTop: 8, lineHeight: 15, fontStyle: 'italic' },
  promptHead:{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  copyBtn: { flexDirection: 'row', alignItems: 'center', gap: 5, borderWidth: 1, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 4 },
  copyText:{ fontFamily: 'Inter_700Bold', fontSize: 10, letterSpacing: 0.8 },
  promptText:{ fontFamily: 'Inter_400Regular', fontSize: 11, color: C.white, lineHeight: 18 },
});

// ── Scene Generator Modal ─────────────────────────────────────────────────────
function SceneModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose}>
      <Pressable style={md.overlay} onPress={onClose}>
        <View style={[md.sheet, { backgroundColor: C.card, padding: 24, borderTopLeftRadius: 22, borderTopRightRadius: 22 }]}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
            <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 17, color: C.gold }}>🎬 SCENE GENERATOR</Text>
            <TouchableOpacity onPress={onClose}><Feather name="x" size={18} color={C.muted} /></TouchableOpacity>
          </View>
          {SCENE_CHECKS.map((item) => (
            <View key={item.label} style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: 14 }}>
              <View style={{ width: 32, height: 32, borderRadius: 10, backgroundColor: C.goldBg, borderWidth: 1, borderColor: C.goldDim, alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ fontSize: 14 }}>{item.icon}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 12, color: C.white, marginBottom: 2 }}>{item.label}</Text>
                <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 11, color: C.muted, lineHeight: 16 }}>{item.detail}</Text>
              </View>
              <Feather name="check-circle" size={16} color={C.green} />
            </View>
          ))}
          <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 10, color: C.muted, textAlign: 'center', marginTop: 4, lineHeight: 15 }}>
            Based on Wally Wood's 22 Panels · Neal Adams foreshortening · Pérez/Hitch staging
          </Text>
        </View>
      </Pressable>
    </Modal>
  );
}

// ── Main Screen ───────────────────────────────────────────────────────────────
export default function ActionArchetypeDirector() {
  const insets = useSafeAreaInsets();
  const [activeCat, setActiveCat] = useState<CategoryId>('HEROIC');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [camera, setCamera] = useState<CameraId>('WORM_EYE_VIEW');
  const [intensity, setIntensity] = useState(70);
  const [charName, setCharName] = useState('');
  const [sceneVisible, setSceneVisible] = useState(false);
  const [charBuilderVisible, setCharBuilderVisible] = useState(false);
  const [envVisible, setEnvVisible] = useState(false);
  const [groupVisible, setGroupVisible] = useState(false);
  const [cinematicVisible, setCinematicVisible] = useState(false);
  const [universeVisible, setUniverseVisible] = useState(false);
  const [cinematicDescription, setCinematicDescription] = useState('');
  const [cinematicFragment, setCinematicFragment] = useState('');
  const [copied, setCopied] = useState(false);
  const [actionSearch, setActionSearch] = useState('');
  const [activeDNA, setActiveDNA] = useState<CharacterDNA | null>(null);
  const [activeEnv, setActiveEnv] = useState<ActiveEnvironment>(BLANK_ENVIRONMENT);
  const [activeGroupType, setActiveGroupType] = useState<CompositionType | null>(null);
  const copyTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { save: saveCharacter, load: loadCharacter, remove: removeCharacter, names: savedCharNames } = useCharacterMemory();

  const filtered = useMemo(() => ARCHETYPES.filter(a => a.category === activeCat), [activeCat]);
  const matchedIds = useMemo<Set<string>>(() => {
    if (!actionSearch.trim()) return new Set();
    return new Set(parseComicActions(actionSearch));
  }, [actionSearch]);
  const selected = useMemo(() => ARCHETYPES.find(a => a.id === selectedId) ?? null, [selectedId]);
  const activeCatData = CATEGORIES.find(c => c.id === activeCat)!;

  const handleCopy = useCallback(async () => {
    if (!selected) return;
    const prompt = buildPrompt(selected, camera, intensity, charName, activeDNA, activeEnv, activeGroupType, cinematicFragment || null);
    await Clipboard.setStringAsync(prompt);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setCopied(true);
    if (copyTimerRef.current) clearTimeout(copyTimerRef.current);
    copyTimerRef.current = setTimeout(() => setCopied(false), 2200);
  }, [selected, camera, intensity, charName, activeDNA, cinematicFragment]);

  const numCols = 3;
  const topPad = Platform.OS === 'web' ? 16 : insets.top;

  return (
    <View style={[s.root, { paddingTop: topPad }]}>
      {/* Header */}
      <LinearGradient colors={[C.bgMid, C.bg]} style={s.header}>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Feather name="arrow-left" size={20} color={C.white} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={s.headerEyebrow}>182 ARCHETYPES · 50 ARTIST DNA · 18 CATEGORIES</Text>
          <Text style={s.headerTitle}>ACTION DIRECTOR</Text>
        </View>
        <TouchableOpacity
          style={[s.sceneBtn, { borderColor: activeDNA ? C.gold : C.border }]}
          onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setCharBuilderVisible(true); }}
          activeOpacity={0.85}
        >
          <Text style={{ fontSize: 13 }}>👤</Text>
          <Text style={[s.sceneBtnText, { color: activeDNA ? C.gold : C.muted }]} numberOfLines={1}>
            {activeDNA ? activeDNA.characterName.toUpperCase().slice(0, 8) : 'DNA'}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[s.sceneBtn, { borderColor: activeGroupType ? '#A78BFA' : C.border }]}
          onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setGroupVisible(true); }}
          activeOpacity={0.85}
        >
          <Text style={{ fontSize: 13 }}>🤝</Text>
          <Text style={[s.sceneBtnText, { color: activeGroupType ? '#A78BFA' : C.muted }]}>GROUP</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[s.sceneBtn, { borderColor: activeEnv.locationId || activeEnv.atmosphereId || activeEnv.aerialPoseId ? '#00E5FF' : C.border }]}
          onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setEnvVisible(true); }}
          activeOpacity={0.85}
        >
          <Text style={{ fontSize: 13 }}>🌆</Text>
          <Text style={[s.sceneBtnText, { color: activeEnv.locationId || activeEnv.atmosphereId || activeEnv.aerialPoseId ? '#00E5FF' : C.muted }]}>ENV</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[s.sceneBtn, { borderColor: C.goldDim }]}
          onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setSceneVisible(true); }}
          activeOpacity={0.85}
        >
          <Text style={{ fontSize: 13 }}>🎬</Text>
          <Text style={s.sceneBtnText}>SCENE</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[s.sceneBtn, { borderColor: activeDNA?.speciesDNA || activeDNA?.civilization ? '#00E5FF' : C.border }]}
          onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setUniverseVisible(true); }}
          activeOpacity={0.85}
        >
          <Text style={{ fontSize: 13 }}>🌌</Text>
          <Text style={[s.sceneBtnText, { color: activeDNA?.speciesDNA || activeDNA?.civilization ? '#00E5FF' : C.muted }]}>UNIVERSE</Text>
        </TouchableOpacity>
      </LinearGradient>

      {/* Cinematic description bar — tap to open full director */}
      <TouchableOpacity
        style={[s.descBar, { borderColor: cinematicDescription ? '#FFD60055' : '#2A2420', backgroundColor: cinematicDescription ? '#FFD60008' : '#110E0B' }]}
        onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setCinematicVisible(true); }}
        activeOpacity={0.85}
      >
        <Text style={{ fontSize: 13 }}>🎬</Text>
        <Text style={[s.descBarText, { color: cinematicDescription ? '#F5F0E8' : '#6B6560' }]} numberOfLines={1}>
          {cinematicDescription || 'Describe your scene — AI director interprets it live...'}
        </Text>
        {cinematicDescription ? (
          <View style={s.descActiveTag}>
            <Text style={s.descActiveTagText}>ACTIVE</Text>
          </View>
        ) : (
          <Feather name="chevron-right" size={13} color="#6B6560" />
        )}
      </TouchableOpacity>

      {/* Category strip */}
      <ScrollView
        horizontal showsHorizontalScrollIndicator={false}
        style={s.catStrip}
        contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}
      >
        {CATEGORIES.map(cat => {
          const sel = activeCat === cat.id;
          const count = ARCHETYPES.filter(a => a.category === cat.id).length;
          return (
            <TouchableOpacity
              key={cat.id}
              style={[s.catChip, { borderColor: sel ? cat.color : C.border, backgroundColor: sel ? cat.color + '18' : C.card }]}
              onPress={() => { Haptics.selectionAsync(); setActiveCat(cat.id); setSelectedId(null); }}
              activeOpacity={0.8}
            >
              <Text style={{ fontSize: 13 }}>{cat.emoji}</Text>
              <Text style={[s.catLabel, { color: sel ? cat.color : C.muted }]}>{cat.label}</Text>
              <Text style={[s.catCount, { color: sel ? cat.color + 'AA' : C.border }]}>{count}</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Category info bar */}
      <View style={[s.catInfo, { borderColor: activeCatData.color + '30', backgroundColor: activeCatData.color + '08' }]}>
        <View style={[s.catInfoDot, { backgroundColor: activeCatData.color }]} />
        <View style={{ flex: 1 }}>
          <Text style={[s.catInfoArtist, { color: activeCatData.color }]}>{activeCatData.artistRef}</Text>
          <Text style={s.catInfoLine}>{activeCatData.lineOfAction}</Text>
        </View>
      </View>

      {/* Comic Language Parser + Environment Scene Interpreter */}
      <View style={[s.searchRow, { borderColor: actionSearch ? C.gold + '60' : C.border }]}>
        <Text style={{ fontSize: 12 }}>⚡</Text>
        <TextInput
          style={s.searchInput}
          placeholder="punch · leap · blast · rainy city · night..."
          placeholderTextColor={C.muted}
          value={actionSearch}
          onChangeText={setActionSearch}
          autoCapitalize="none"
          autoCorrect={false}
          returnKeyType="done"
        />
        {matchedIds.size > 0 && (
          <View style={s.searchBadge}>
            <Text style={s.searchBadgeText}>{matchedIds.size}</Text>
          </View>
        )}
        {actionSearch.length > 0 && (
          <TouchableOpacity onPress={() => setActionSearch('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Feather name="x" size={13} color={C.muted} />
          </TouchableOpacity>
        )}
      </View>
      {/* aiSceneInterpreter — live environment context chips */}
      {actionSearch.length > 2 && (() => {
        const scene = COMIC_ENVIRONMENT_DATABASE.aiSceneInterpreter(actionSearch);
        const chips: Array<{ label: string; color: string }> = [];
        if (scene.cityEnvironment) chips.push({ label: '🌆 CITY',        color: '#00E5FF' });
        if (scene.aerialAction)    chips.push({ label: '🦅 AERIAL',      color: '#38BDF8' });
        if (scene.weather)         chips.push({ label: `🌧 ${scene.weather.toUpperCase()}`, color: '#67E8F9' });
        if (scene.perspective)     chips.push({ label: `📷 ${scene.perspective}`,           color: '#A78BFA' });
        scene.mood.forEach(m => chips.push({ label: `🎭 ${m.toUpperCase()}`, color: '#F59E0B' }));
        if (chips.length === 0) return null;
        return (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 6 }} contentContainerStyle={{ paddingHorizontal: 12, gap: 6 }}>
            {chips.map(chip => (
              <TouchableOpacity
                key={chip.label}
                style={{ borderWidth: 1, borderColor: chip.color + '60', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4, backgroundColor: chip.color + '12' }}
                onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setEnvVisible(true); }}
                activeOpacity={0.8}
              >
                <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 9, color: chip.color, letterSpacing: 0.8 }}>{chip.label}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        );
      })()}

      {/* Archetype grid */}
      <FlatList
        data={filtered}
        key={activeCat}
        numColumns={numCols}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={s.grid}
        columnWrapperStyle={{ gap: 8 }}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <View style={{ flex: 1 }}>
            <ArchetypeCard
              archetype={item}
              selected={selectedId === item.id}
              catColor={activeCatData.color}
              onPress={() => setSelectedId(prev => prev === item.id ? null : item.id)}
              isMatched={matchedIds.has(item.id)}
            />
          </View>
        )}
        ListFooterComponent={<View style={{ height: insets.bottom + 20 }} />}
      />

      {/* Archetype Detail Modal */}
      <ArchetypeModal
        archetype={selected}
        camera={camera}
        intensity={intensity}
        charName={charName}
        visible={!!selected}
        onClose={() => setSelectedId(null)}
        onCopy={handleCopy}
        copied={copied}
        onCameraChange={setCamera}
        onIntensityChange={setIntensity}
        activeDNA={activeDNA}
        onOpenCharBuilder={() => setCharBuilderVisible(true)}
      />

      <SceneModal visible={sceneVisible} onClose={() => setSceneVisible(false)} />

      {/* Cinematic Director Modal — ported from Java AICinematicInterpreter + CameraRecommendationEngine */}
      <CinematicDirectorModal
        visible={cinematicVisible}
        onClose={() => setCinematicVisible(false)}
        onApplyCameraId={id => { setCamera(id as CameraId); }}
        onApplyArchetypeCategory={cat => { setActiveCat(cat as typeof activeCat); setSelectedId(null); }}
        onApplyDescription={(desc, frag) => {
          setCinematicDescription(desc);
          setCinematicFragment(frag);
        }}
      />

      {/* Group Composition Modal — ported from Java AICompositionEngine */}
      <GroupCompositionModal
        visible={groupVisible}
        onClose={() => setGroupVisible(false)}
        activeType={activeGroupType}
        onTypeChange={t => { setActiveGroupType(t); setGroupVisible(false); }}
      />

      {/* Environment Modal — ported from JS COMIC_ENVIRONMENT_DATABASE + aiSceneInterpreter */}
      <EnvironmentModal
        visible={envVisible}
        onClose={() => setEnvVisible(false)}
        env={activeEnv}
        onEnvChange={setActiveEnv}
      />

      {/* Universe Engine Modal — ported from Java UniversalAIInterpreter + CinematicTrainingSystem */}
      <UniverseModal
        visible={universeVisible}
        onClose={() => setUniverseVisible(false)}
        onApplyCameraId={id => { setCamera(id as CameraId); }}
        onApplyDNAExtension={partial => {
          setActiveDNA(prev => prev
            ? { ...prev, ...partial }
            : { characterName: charName || 'Character', ...BLANK_CHARACTER_DNA, ...partial }
          );
        }}
      />

      {/* Character Builder Modal — ported from Java CharacterDNA + CharacterMemoryEngine */}
      <CharacterBuilderModal
        visible={charBuilderVisible}
        onClose={() => setCharBuilderVisible(false)}
        initialName={charName || activeDNA?.characterName || ''}
        savedNames={savedCharNames}
        onLoad={loadCharacter}
        onDelete={name => { removeCharacter(name); if (activeDNA?.characterName === name) setActiveDNA(null); }}
        onApply={async dna => {
          await saveCharacter(dna);
          setActiveDNA(dna);
          setCharName(dna.characterName);
        }}
      />
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  header: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: 16, paddingBottom: 14, paddingTop: 4,
  },
  backBtn: { width: 34, height: 34, borderRadius: 10, backgroundColor: C.card, borderWidth: 1, borderColor: C.border, alignItems: 'center', justifyContent: 'center' },
  headerEyebrow: { fontFamily: 'Inter_600SemiBold', fontSize: 9, color: C.goldDim, letterSpacing: 2, marginBottom: 2 },
  headerTitle:   { fontFamily: 'Inter_700Bold', fontSize: 22, color: C.white },
  sceneBtn: { flexDirection: 'row', alignItems: 'center', gap: 5, borderWidth: 1, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 7 },
  sceneBtnText:  { fontFamily: 'Inter_700Bold', fontSize: 10, color: C.goldDim, letterSpacing: 1 },
  descBar:        { flexDirection: 'row', alignItems: 'center', gap: 8, marginHorizontal: 14, marginBottom: 8, borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 9 },
  descBarText:    { flex: 1, fontFamily: 'Inter_400Regular', fontSize: 11, lineHeight: 15 },
  descActiveTag:  { borderWidth: 1, borderColor: '#FFD60055', borderRadius: 6, paddingHorizontal: 6, paddingVertical: 3 },
  descActiveTagText: { fontFamily: 'Inter_700Bold', fontSize: 8, color: '#FFD600', letterSpacing: 0.8 },
  catStrip:  { flexGrow: 0, marginBottom: 8 },
  catChip:   { flexDirection: 'row', alignItems: 'center', gap: 5, borderWidth: 1, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 7 },
  catLabel:  { fontFamily: 'Inter_700Bold', fontSize: 11, letterSpacing: 0.5 },
  catCount:  { fontFamily: 'Inter_400Regular', fontSize: 10 },
  catInfo:   { flexDirection: 'row', alignItems: 'center', gap: 10, marginHorizontal: 16, marginBottom: 10, borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8 },
  catInfoDot:{ width: 6, height: 6, borderRadius: 3 },
  catInfoArtist: { fontFamily: 'Inter_600SemiBold', fontSize: 10, letterSpacing: 0.5, marginBottom: 2 },
  catInfoLine:   { fontFamily: 'Inter_400Regular', fontSize: 10, color: C.muted, lineHeight: 14 },
  searchRow:      { flexDirection: 'row', alignItems: 'center', gap: 8, marginHorizontal: 12, marginBottom: 8, borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8, backgroundColor: C.card },
  searchInput:    { flex: 1, fontFamily: 'Inter_400Regular', fontSize: 11, color: C.white, paddingVertical: 0 },
  searchBadge:    { backgroundColor: C.gold, borderRadius: 8, paddingHorizontal: 6, paddingVertical: 1, minWidth: 20, alignItems: 'center' },
  searchBadgeText:{ fontFamily: 'Inter_700Bold', fontSize: 9, color: C.bg },
  grid:      { paddingHorizontal: 16, gap: 8 },
});
