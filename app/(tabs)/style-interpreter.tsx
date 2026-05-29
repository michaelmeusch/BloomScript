import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import React, { useRef, useState } from 'react';
import {
  Animated,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// ── Palette ───────────────────────────────────────────────────────────────────
const C = {
  bg:     '#0E0C0A',
  card:   '#181410',
  card2:  '#1E1A14',
  border: '#2E2618',
  yellow: '#FFD600',
  red:    '#E8001C',
  blue:   '#0057A8',
  green:  '#2A7A3A',
  purple: '#8B3FBE',
  orange: '#FF6A00',
  ink:    '#F0EAD8',
  muted:  '#7A6A58',
  white:  '#FFFFFF',
};

// ════════════════════════════════════════════════════════════════════════════
// ENUM DATA  (mirrors the Java blueprint)
// ════════════════════════════════════════════════════════════════════════════

type ComicGenre =
  | 'SUPERHERO' | 'COSMIC' | 'SCI_FI' | 'CYBERPUNK' | 'HORROR'
  | 'FANTASY' | 'DARK_FANTASY' | 'NOIR' | 'DETECTIVE' | 'POST_APOCALYPTIC'
  | 'MARTIAL_ARTS' | 'WAR' | 'WESTERN' | 'STEAMPUNK' | 'GOTHIC'
  | 'MYTHOLOGICAL' | 'ROMANCE' | 'SLICE_OF_LIFE' | 'HUMOR' | 'SATIRE'
  | 'UNDERGROUND' | 'PSYCHEDELIC' | 'MECHA' | 'MONSTER' | 'SUPERNATURAL'
  | 'SPACE_OPERA' | 'MANGA_ACTION' | 'MANGA_SEINEN' | 'MANGA_SHOJO'
  | 'EUROPEAN_BD' | 'INDIE_EXPERIMENTAL';

type SceneEmotion =
  | 'FEAR' | 'ACTION' | 'LOVE' | 'SADNESS' | 'MYSTERY'
  | 'CHAOS' | 'TENSION' | 'WONDER' | 'VICTORY' | 'TRAGEDY';

type RenderLanguage =
  | 'DYNAMIC_ACTION' | 'CINEMATIC_REALISM' | 'ABSTRACT_EXPRESSIONISM'
  | 'MINIMAL_LINEWORK' | 'HEAVY_INK' | 'SCRATCHBOARD' | 'HALFTONE_RETRO'
  | 'CLEAN_LINE' | 'PAINTERLY' | 'WATERCOLOR' | 'DIGITAL_AIRBRUSH'
  | 'GRAINY_NOIR' | 'HIGH_CONTRAST' | 'ANIME_CEL' | 'SCREEN_TONE'
  | 'GRAPHIC_SHADOW' | 'GESTURAL_SKETCH' | 'BRUTALIST'
  | 'PSYCHEDELIC_COLOR' | 'RETRO_PULP' | 'NEON_NOIR';

type StorytellingMode =
  | 'CINEMATIC' | 'FAST_ACTION' | 'SLOW_BURN' | 'EMOTIONAL'
  | 'HORROR_TENSION' | 'MYSTERY_REVEAL' | 'EPIC_SCOPE' | 'CHARACTER_DRIVEN'
  | 'COMEDIC_TIMING' | 'DOCUMENTARY_STYLE' | 'EXPERIMENTAL_FLOW' | 'DREAM_SEQUENCE';

type PanelStyle =
  | 'GRID_STANDARD' | 'CINEMATIC_WIDE' | 'MANGA_DYNAMIC' | 'CHAOTIC_ACTION'
  | 'VERTICAL_SCROLL' | 'EUROPEAN_CLEAR' | 'HORROR_FRAGMENTED'
  | 'NOIR_SHADOWBOX' | 'ABSTRACT_LAYOUT' | 'SPLASH_PAGE'
  | 'MULTI_LAYERED' | 'DIAGONAL_FLOW';

type VisualMood =
  | 'HEROIC' | 'BLEAK' | 'TRIUMPHANT' | 'MELANCHOLIC' | 'APOCALYPTIC'
  | 'MYSTICAL' | 'CHAOTIC' | 'DREAMLIKE' | 'PARANOID' | 'AGGRESSIVE'
  | 'WHIMSICAL' | 'CLAUSTROPHOBIC' | 'OPERATIC' | 'SURREAL';

type CameraLanguage =
  | 'HERO_LOW_ANGLE' | 'DUTCH_ANGLE' | 'OVER_SHOULDER' | 'EXTREME_CLOSEUP'
  | 'WIDE_ESTABLISHING' | 'TRACKING_ACTION' | 'CINEMATIC_PAN'
  | 'INTIMATE_FACE' | 'HORROR_POV' | 'SILHOUETTE_SHOT';

interface ComicStyleProfile {
  genre:            ComicGenre;
  renderLanguage:   RenderLanguage;
  storytellingMode: StorytellingMode;
  panelStyle:       PanelStyle;
  mood:             VisualMood;
  camera:           CameraLanguage;
  // numeric sliders 0–1
  anatomyStylization:    number;
  realismLevel:          number;
  inkDensity:            number;
  motionIntensity:       number;
  textureAmount:         number;
  colorComplexity:       number;
  environmentalDetail:   number;
  // boolean flags
  usesHalftones:          boolean;
  usesScreenTone:         boolean;
  cinematicLighting:      boolean;
  exaggeratedPerspective: boolean;
  heavyShadowing:         boolean;
}

// ── Genre metadata ────────────────────────────────────────────────────────────
const GENRES: { id: ComicGenre; label: string; emoji: string; color: string }[] = [
  { id: 'SUPERHERO',        label: 'Superhero',        emoji: '🦸', color: C.blue   },
  { id: 'COSMIC',           label: 'Cosmic',           emoji: '🌌', color: C.purple },
  { id: 'SCI_FI',          label: 'Sci-Fi',            emoji: '🚀', color: '#00BCD4' },
  { id: 'CYBERPUNK',        label: 'Cyberpunk',        emoji: '⚡', color: '#00E5FF' },
  { id: 'HORROR',           label: 'Horror',           emoji: '💀', color: C.red    },
  { id: 'FANTASY',          label: 'Fantasy',          emoji: '🐉', color: C.green  },
  { id: 'DARK_FANTASY',     label: 'Dark Fantasy',     emoji: '🔮', color: '#6A0DAD' },
  { id: 'NOIR',             label: 'Noir',             emoji: '🕯️', color: '#888888' },
  { id: 'DETECTIVE',        label: 'Detective',        emoji: '🔍', color: '#A0784A' },
  { id: 'POST_APOCALYPTIC', label: 'Post-Apocalyptic', emoji: '☢️', color: '#C4781A' },
  { id: 'MARTIAL_ARTS',     label: 'Martial Arts',     emoji: '🥋', color: '#B8860B' },
  { id: 'WAR',              label: 'War',              emoji: '⚔️', color: '#6B6B6B' },
  { id: 'WESTERN',          label: 'Western',          emoji: '🤠', color: '#A0522D' },
  { id: 'STEAMPUNK',        label: 'Steampunk',        emoji: '⚙️', color: '#CD7F32' },
  { id: 'GOTHIC',           label: 'Gothic',           emoji: '🦇', color: '#4B0082' },
  { id: 'MYTHOLOGICAL',     label: 'Mythological',     emoji: '⚡', color: '#DAA520' },
  { id: 'ROMANCE',          label: 'Romance',          emoji: '💕', color: '#FF69B4' },
  { id: 'SLICE_OF_LIFE',    label: 'Slice of Life',    emoji: '☕', color: '#8BC34A' },
  { id: 'HUMOR',            label: 'Humor',            emoji: '😂', color: C.yellow  },
  { id: 'SATIRE',           label: 'Satire',           emoji: '🎭', color: '#FF8C00' },
  { id: 'UNDERGROUND',      label: 'Underground',      emoji: '✊', color: '#808000' },
  { id: 'PSYCHEDELIC',      label: 'Psychedelic',      emoji: '🌀', color: '#FF00FF' },
  { id: 'MECHA',            label: 'Mecha',            emoji: '🤖', color: '#607D8B' },
  { id: 'MONSTER',          label: 'Monster',          emoji: '👹', color: '#8B0000' },
  { id: 'SUPERNATURAL',     label: 'Supernatural',     emoji: '👻', color: '#9370DB' },
  { id: 'SPACE_OPERA',      label: 'Space Opera',      emoji: '🌠', color: '#483D8B' },
  { id: 'MANGA_ACTION',     label: 'Manga Action',     emoji: '🇯🇵', color: '#E63946' },
  { id: 'MANGA_SEINEN',     label: 'Manga Seinen',     emoji: '📖', color: '#457B9D' },
  { id: 'MANGA_SHOJO',      label: 'Manga Shojo',      emoji: '🌸', color: '#FF85A1' },
  { id: 'EUROPEAN_BD',      label: 'European BD',      emoji: '🎨', color: '#2196F3' },
  { id: 'INDIE_EXPERIMENTAL', label: 'Indie Exp.',     emoji: '✏️', color: '#78909C' },
];

const EMOTIONS: { id: SceneEmotion; label: string; emoji: string }[] = [
  { id: 'FEAR',    label: 'Fear',    emoji: '😱' },
  { id: 'ACTION',  label: 'Action',  emoji: '💥' },
  { id: 'LOVE',    label: 'Love',    emoji: '❤️' },
  { id: 'SADNESS', label: 'Sadness', emoji: '😢' },
  { id: 'MYSTERY', label: 'Mystery', emoji: '🌫️' },
  { id: 'CHAOS',   label: 'Chaos',   emoji: '🌪️' },
  { id: 'TENSION', label: 'Tension', emoji: '😤' },
  { id: 'WONDER',  label: 'Wonder',  emoji: '✨' },
  { id: 'VICTORY', label: 'Victory', emoji: '🏆' },
  { id: 'TRAGEDY', label: 'Tragedy', emoji: '💔' },
];

// ── Scene flags ───────────────────────────────────────────────────────────────
type SceneFlag = 'battle' | 'horror' | 'romance' | 'mysticism' | 'cyberpunk';
const SCENE_FLAGS: { id: SceneFlag; label: string; emoji: string }[] = [
  { id: 'battle',    label: 'Battle',    emoji: '⚔️' },
  { id: 'horror',    label: 'Horror',    emoji: '💀' },
  { id: 'romance',   label: 'Romance',   emoji: '💕' },
  { id: 'mysticism', label: 'Mysticism', emoji: '🔮' },
  { id: 'cyberpunk', label: 'Cyberpunk', emoji: '⚡' },
];

// ════════════════════════════════════════════════════════════════════════════
// AI STYLE INTERPRETER  (TypeScript port of Java AIStyleInterpreter +
//                        CameraDirector + GenreFusionEngine)
// ════════════════════════════════════════════════════════════════════════════

function chooseCamera(genre: ComicGenre, emotion: SceneEmotion): CameraLanguage {
  if (genre === 'HORROR')     return 'HORROR_POV';
  if (genre === 'NOIR' || genre === 'DETECTIVE') return 'OVER_SHOULDER';
  if (genre === 'CYBERPUNK')  return 'DUTCH_ANGLE';
  if (genre === 'ROMANCE' || genre === 'SLICE_OF_LIFE') return 'INTIMATE_FACE';
  if (genre === 'SUPERHERO' || genre === 'COSMIC' || genre === 'SPACE_OPERA') return 'HERO_LOW_ANGLE';
  if (emotion === 'ACTION' || emotion === 'CHAOS') return 'TRACKING_ACTION';
  if (emotion === 'WONDER') return 'WIDE_ESTABLISHING';
  if (emotion === 'SADNESS' || emotion === 'TRAGEDY') return 'INTIMATE_FACE';
  if (genre === 'MANGA_ACTION' || genre === 'MARTIAL_ARTS') return 'TRACKING_ACTION';
  return 'CINEMATIC_PAN';
}

function interpretGenre(
  genre: ComicGenre,
  emotion: SceneEmotion,
  flags: Set<SceneFlag>,
): ComicStyleProfile {
  // Base profile by genre (mirrors AIStyleInterpreter.analyze)
  const base: Omit<ComicStyleProfile, 'camera'> = (() => {
    switch (genre) {
      case 'CYBERPUNK':
        return {
          genre, renderLanguage: 'NEON_NOIR', storytellingMode: 'CINEMATIC',
          panelStyle: 'CINEMATIC_WIDE', mood: 'PARANOID',
          anatomyStylization: 0.6, realismLevel: 0.5, inkDensity: 0.7,
          motionIntensity: 0.6, textureAmount: 0.8, colorComplexity: 0.9,
          environmentalDetail: 0.85,
          usesHalftones: false, usesScreenTone: false,
          cinematicLighting: true, exaggeratedPerspective: true, heavyShadowing: true,
        };
      case 'HORROR':
        return {
          genre, renderLanguage: 'HEAVY_INK', storytellingMode: 'HORROR_TENSION',
          panelStyle: 'HORROR_FRAGMENTED', mood: 'CLAUSTROPHOBIC',
          anatomyStylization: 0.5, realismLevel: 0.4, inkDensity: 0.95,
          motionIntensity: 0.3, textureAmount: 0.9, colorComplexity: 0.3,
          environmentalDetail: 0.7,
          usesHalftones: false, usesScreenTone: false,
          cinematicLighting: false, exaggeratedPerspective: false, heavyShadowing: true,
        };
      case 'NOIR': case 'DETECTIVE':
        return {
          genre, renderLanguage: 'GRAINY_NOIR', storytellingMode: 'MYSTERY_REVEAL',
          panelStyle: 'NOIR_SHADOWBOX', mood: 'BLEAK',
          anatomyStylization: 0.3, realismLevel: 0.7, inkDensity: 0.85,
          motionIntensity: 0.2, textureAmount: 0.75, colorComplexity: 0.2,
          environmentalDetail: 0.8,
          usesHalftones: true, usesScreenTone: false,
          cinematicLighting: true, exaggeratedPerspective: false, heavyShadowing: true,
        };
      case 'SUPERHERO': case 'COSMIC': case 'SPACE_OPERA':
        return {
          genre, renderLanguage: 'DYNAMIC_ACTION', storytellingMode: 'EPIC_SCOPE',
          panelStyle: 'CHAOTIC_ACTION', mood: 'HEROIC',
          anatomyStylization: 0.7, realismLevel: 0.5, inkDensity: 0.65,
          motionIntensity: 0.9, textureAmount: 0.4, colorComplexity: 0.8,
          environmentalDetail: 0.6,
          usesHalftones: true, usesScreenTone: false,
          cinematicLighting: true, exaggeratedPerspective: true, heavyShadowing: false,
        };
      case 'MANGA_ACTION': case 'MARTIAL_ARTS':
        return {
          genre, renderLanguage: 'ANIME_CEL', storytellingMode: 'FAST_ACTION',
          panelStyle: 'MANGA_DYNAMIC', mood: 'AGGRESSIVE',
          anatomyStylization: 0.85, realismLevel: 0.3, inkDensity: 0.6,
          motionIntensity: 0.95, textureAmount: 0.3, colorComplexity: 0.7,
          environmentalDetail: 0.4,
          usesHalftones: false, usesScreenTone: true,
          cinematicLighting: false, exaggeratedPerspective: true, heavyShadowing: false,
        };
      case 'MANGA_SEINEN':
        return {
          genre, renderLanguage: 'SCREEN_TONE', storytellingMode: 'CHARACTER_DRIVEN',
          panelStyle: 'GRID_STANDARD', mood: 'MELANCHOLIC',
          anatomyStylization: 0.65, realismLevel: 0.5, inkDensity: 0.55,
          motionIntensity: 0.4, textureAmount: 0.5, colorComplexity: 0.4,
          environmentalDetail: 0.65,
          usesHalftones: false, usesScreenTone: true,
          cinematicLighting: false, exaggeratedPerspective: false, heavyShadowing: false,
        };
      case 'MANGA_SHOJO':
        return {
          genre, renderLanguage: 'MINIMAL_LINEWORK', storytellingMode: 'EMOTIONAL',
          panelStyle: 'VERTICAL_SCROLL', mood: 'DREAMLIKE',
          anatomyStylization: 0.8, realismLevel: 0.25, inkDensity: 0.4,
          motionIntensity: 0.3, textureAmount: 0.2, colorComplexity: 0.6,
          environmentalDetail: 0.3,
          usesHalftones: false, usesScreenTone: true,
          cinematicLighting: false, exaggeratedPerspective: false, heavyShadowing: false,
        };
      case 'EUROPEAN_BD':
        return {
          genre, renderLanguage: 'CLEAN_LINE', storytellingMode: 'CINEMATIC',
          panelStyle: 'EUROPEAN_CLEAR', mood: 'OPERATIC',
          anatomyStylization: 0.4, realismLevel: 0.6, inkDensity: 0.5,
          motionIntensity: 0.45, textureAmount: 0.3, colorComplexity: 0.7,
          environmentalDetail: 0.9,
          usesHalftones: false, usesScreenTone: false,
          cinematicLighting: false, exaggeratedPerspective: false, heavyShadowing: false,
        };
      case 'FANTASY': case 'MYTHOLOGICAL':
        return {
          genre, renderLanguage: 'PAINTERLY', storytellingMode: 'EPIC_SCOPE',
          panelStyle: 'SPLASH_PAGE', mood: 'MYSTICAL',
          anatomyStylization: 0.55, realismLevel: 0.65, inkDensity: 0.5,
          motionIntensity: 0.6, textureAmount: 0.7, colorComplexity: 0.85,
          environmentalDetail: 0.9,
          usesHalftones: false, usesScreenTone: false,
          cinematicLighting: true, exaggeratedPerspective: false, heavyShadowing: false,
        };
      case 'DARK_FANTASY': case 'GOTHIC':
        return {
          genre, renderLanguage: 'SCRATCHBOARD', storytellingMode: 'SLOW_BURN',
          panelStyle: 'HORROR_FRAGMENTED', mood: 'BLEAK',
          anatomyStylization: 0.5, realismLevel: 0.45, inkDensity: 0.9,
          motionIntensity: 0.35, textureAmount: 0.85, colorComplexity: 0.35,
          environmentalDetail: 0.8,
          usesHalftones: false, usesScreenTone: false,
          cinematicLighting: true, exaggeratedPerspective: false, heavyShadowing: true,
        };
      case 'PSYCHEDELIC':
        return {
          genre, renderLanguage: 'PSYCHEDELIC_COLOR', storytellingMode: 'DREAM_SEQUENCE',
          panelStyle: 'ABSTRACT_LAYOUT', mood: 'SURREAL',
          anatomyStylization: 0.9, realismLevel: 0.1, inkDensity: 0.4,
          motionIntensity: 0.7, textureAmount: 0.6, colorComplexity: 1.0,
          environmentalDetail: 0.5,
          usesHalftones: false, usesScreenTone: false,
          cinematicLighting: false, exaggeratedPerspective: true, heavyShadowing: false,
        };
      case 'POST_APOCALYPTIC': case 'WAR':
        return {
          genre, renderLanguage: 'GRAINY_NOIR', storytellingMode: 'SLOW_BURN',
          panelStyle: 'CINEMATIC_WIDE', mood: 'BLEAK',
          anatomyStylization: 0.35, realismLevel: 0.75, inkDensity: 0.7,
          motionIntensity: 0.5, textureAmount: 0.8, colorComplexity: 0.3,
          environmentalDetail: 0.85,
          usesHalftones: true, usesScreenTone: false,
          cinematicLighting: true, exaggeratedPerspective: false, heavyShadowing: true,
        };
      case 'ROMANCE':
        return {
          genre, renderLanguage: 'WATERCOLOR', storytellingMode: 'EMOTIONAL',
          panelStyle: 'GRID_STANDARD', mood: 'DREAMLIKE',
          anatomyStylization: 0.5, realismLevel: 0.55, inkDensity: 0.3,
          motionIntensity: 0.2, textureAmount: 0.4, colorComplexity: 0.65,
          environmentalDetail: 0.6,
          usesHalftones: false, usesScreenTone: false,
          cinematicLighting: false, exaggeratedPerspective: false, heavyShadowing: false,
        };
      case 'HUMOR': case 'SATIRE':
        return {
          genre, renderLanguage: 'HALFTONE_RETRO', storytellingMode: 'COMEDIC_TIMING',
          panelStyle: 'GRID_STANDARD', mood: 'WHIMSICAL',
          anatomyStylization: 0.75, realismLevel: 0.2, inkDensity: 0.55,
          motionIntensity: 0.5, textureAmount: 0.35, colorComplexity: 0.7,
          environmentalDetail: 0.4,
          usesHalftones: true, usesScreenTone: false,
          cinematicLighting: false, exaggeratedPerspective: false, heavyShadowing: false,
        };
      case 'STEAMPUNK':
        return {
          genre, renderLanguage: 'RETRO_PULP', storytellingMode: 'CINEMATIC',
          panelStyle: 'MULTI_LAYERED', mood: 'OPERATIC',
          anatomyStylization: 0.45, realismLevel: 0.65, inkDensity: 0.6,
          motionIntensity: 0.55, textureAmount: 0.75, colorComplexity: 0.6,
          environmentalDetail: 0.9,
          usesHalftones: true, usesScreenTone: false,
          cinematicLighting: true, exaggeratedPerspective: false, heavyShadowing: false,
        };
      case 'MECHA':
        return {
          genre, renderLanguage: 'DIGITAL_AIRBRUSH', storytellingMode: 'FAST_ACTION',
          panelStyle: 'DIAGONAL_FLOW', mood: 'AGGRESSIVE',
          anatomyStylization: 0.6, realismLevel: 0.6, inkDensity: 0.65,
          motionIntensity: 0.9, textureAmount: 0.55, colorComplexity: 0.75,
          environmentalDetail: 0.7,
          usesHalftones: false, usesScreenTone: false,
          cinematicLighting: true, exaggeratedPerspective: true, heavyShadowing: false,
        };
      case 'INDIE_EXPERIMENTAL': case 'UNDERGROUND':
        return {
          genre, renderLanguage: 'GESTURAL_SKETCH', storytellingMode: 'EXPERIMENTAL_FLOW',
          panelStyle: 'ABSTRACT_LAYOUT', mood: 'SURREAL',
          anatomyStylization: 0.8, realismLevel: 0.15, inkDensity: 0.5,
          motionIntensity: 0.4, textureAmount: 0.6, colorComplexity: 0.5,
          environmentalDetail: 0.3,
          usesHalftones: false, usesScreenTone: false,
          cinematicLighting: false, exaggeratedPerspective: false, heavyShadowing: false,
        };
      default: // WESTERN, MONSTER, SUPERNATURAL, SLICE_OF_LIFE, SCI_FI
        return {
          genre, renderLanguage: 'CINEMATIC_REALISM', storytellingMode: 'CHARACTER_DRIVEN',
          panelStyle: 'GRID_STANDARD', mood: 'HEROIC',
          anatomyStylization: 0.4, realismLevel: 0.65, inkDensity: 0.55,
          motionIntensity: 0.4, textureAmount: 0.5, colorComplexity: 0.55,
          environmentalDetail: 0.7,
          usesHalftones: false, usesScreenTone: false,
          cinematicLighting: false, exaggeratedPerspective: false, heavyShadowing: false,
        };
    }
  })();

  // Emotion overrides (partial modifiers)
  const profile: ComicStyleProfile = { ...base, camera: chooseCamera(genre, emotion) };
  if (emotion === 'ACTION' || emotion === 'CHAOS') {
    profile.motionIntensity = Math.min(1, profile.motionIntensity + 0.2);
    profile.exaggeratedPerspective = true;
  }
  if (emotion === 'FEAR' || emotion === 'TENSION') {
    profile.heavyShadowing = true;
    profile.inkDensity = Math.min(1, profile.inkDensity + 0.1);
  }
  if (emotion === 'WONDER') {
    profile.colorComplexity = Math.min(1, profile.colorComplexity + 0.15);
    profile.environmentalDetail = Math.min(1, profile.environmentalDetail + 0.1);
  }

  // Scene flag overrides
  if (flags.has('horror')) { profile.heavyShadowing = true; profile.cinematicLighting = true; }
  if (flags.has('battle')) { profile.motionIntensity = Math.min(1, profile.motionIntensity + 0.15); }
  if (flags.has('cyberpunk')) { profile.renderLanguage = 'NEON_NOIR'; profile.colorComplexity = Math.min(1, profile.colorComplexity + 0.1); }
  if (flags.has('mysticism')) { profile.mood = 'MYSTICAL'; profile.colorComplexity = Math.min(1, profile.colorComplexity + 0.1); }

  return profile;
}

function fuseProfiles(a: ComicStyleProfile, b: ComicStyleProfile): ComicStyleProfile {
  return {
    genre:            a.genre,
    renderLanguage:   a.renderLanguage,
    storytellingMode: a.storytellingMode,
    panelStyle:       a.panelStyle,
    mood:             a.mood,
    camera:           a.camera,
    anatomyStylization:    (a.anatomyStylization + b.anatomyStylization) / 2,
    realismLevel:          (a.realismLevel + b.realismLevel) / 2,
    inkDensity:            (a.inkDensity + b.inkDensity) / 2,
    motionIntensity:       (a.motionIntensity + b.motionIntensity) / 2,
    textureAmount:         (a.textureAmount + b.textureAmount) / 2,
    colorComplexity:       (a.colorComplexity + b.colorComplexity) / 2,
    environmentalDetail:   (a.environmentalDetail + b.environmentalDetail) / 2,
    usesHalftones:          a.usesHalftones || b.usesHalftones,
    usesScreenTone:         a.usesScreenTone || b.usesScreenTone,
    cinematicLighting:      a.cinematicLighting || b.cinematicLighting,
    exaggeratedPerspective: a.exaggeratedPerspective || b.exaggeratedPerspective,
    heavyShadowing:         a.heavyShadowing || b.heavyShadowing,
  };
}

// ── Human-readable label maps ────────────────────────────────────────────────
const RENDER_LABELS: Record<RenderLanguage, string> = {
  DYNAMIC_ACTION: 'Dynamic Action', CINEMATIC_REALISM: 'Cinematic Realism',
  ABSTRACT_EXPRESSIONISM: 'Abstract Expressionism', MINIMAL_LINEWORK: 'Minimal Linework',
  HEAVY_INK: 'Heavy Ink', SCRATCHBOARD: 'Scratchboard', HALFTONE_RETRO: 'Halftone Retro',
  CLEAN_LINE: 'Clean Line', PAINTERLY: 'Painterly', WATERCOLOR: 'Watercolor',
  DIGITAL_AIRBRUSH: 'Digital Airbrush', GRAINY_NOIR: 'Grainy Noir',
  HIGH_CONTRAST: 'High Contrast', ANIME_CEL: 'Anime Cel', SCREEN_TONE: 'Screen Tone',
  GRAPHIC_SHADOW: 'Graphic Shadow', GESTURAL_SKETCH: 'Gestural Sketch',
  BRUTALIST: 'Brutalist', PSYCHEDELIC_COLOR: 'Psychedelic Color',
  RETRO_PULP: 'Retro Pulp', NEON_NOIR: 'Neon Noir',
};
const STORYTELLING_LABELS: Record<StorytellingMode, string> = {
  CINEMATIC: 'Cinematic', FAST_ACTION: 'Fast Action', SLOW_BURN: 'Slow Burn',
  EMOTIONAL: 'Emotional', HORROR_TENSION: 'Horror Tension', MYSTERY_REVEAL: 'Mystery Reveal',
  EPIC_SCOPE: 'Epic Scope', CHARACTER_DRIVEN: 'Character Driven',
  COMEDIC_TIMING: 'Comedic Timing', DOCUMENTARY_STYLE: 'Documentary Style',
  EXPERIMENTAL_FLOW: 'Experimental Flow', DREAM_SEQUENCE: 'Dream Sequence',
};
const PANEL_LABELS: Record<PanelStyle, string> = {
  GRID_STANDARD: 'Grid Standard', CINEMATIC_WIDE: 'Cinematic Wide',
  MANGA_DYNAMIC: 'Manga Dynamic', CHAOTIC_ACTION: 'Chaotic Action',
  VERTICAL_SCROLL: 'Vertical Scroll', EUROPEAN_CLEAR: 'European Clear',
  HORROR_FRAGMENTED: 'Horror Fragmented', NOIR_SHADOWBOX: 'Noir Shadow Box',
  ABSTRACT_LAYOUT: 'Abstract Layout', SPLASH_PAGE: 'Splash Page',
  MULTI_LAYERED: 'Multi Layered', DIAGONAL_FLOW: 'Diagonal Flow',
};
const MOOD_LABELS: Record<VisualMood, string> = {
  HEROIC: 'Heroic', BLEAK: 'Bleak', TRIUMPHANT: 'Triumphant', MELANCHOLIC: 'Melancholic',
  APOCALYPTIC: 'Apocalyptic', MYSTICAL: 'Mystical', CHAOTIC: 'Chaotic', DREAMLIKE: 'Dreamlike',
  PARANOID: 'Paranoid', AGGRESSIVE: 'Aggressive', WHIMSICAL: 'Whimsical',
  CLAUSTROPHOBIC: 'Claustrophobic', OPERATIC: 'Operatic', SURREAL: 'Surreal',
};
const CAMERA_LABELS: Record<CameraLanguage, string> = {
  HERO_LOW_ANGLE: 'Hero Low Angle', DUTCH_ANGLE: 'Dutch Angle',
  OVER_SHOULDER: 'Over Shoulder', EXTREME_CLOSEUP: 'Extreme Closeup',
  WIDE_ESTABLISHING: 'Wide Establishing', TRACKING_ACTION: 'Tracking Action',
  CINEMATIC_PAN: 'Cinematic Pan', INTIMATE_FACE: 'Intimate Face',
  HORROR_POV: 'Horror POV', SILHOUETTE_SHOT: 'Silhouette Shot',
};

// ════════════════════════════════════════════════════════════════════════════
// MINI UI COMPONENTS
// ════════════════════════════════════════════════════════════════════════════

function MeterBar({ value, color }: { value: number; color: string }) {
  return (
    <View style={s.meterTrack}>
      <View style={[s.meterFill, { width: `${Math.round(value * 100)}%` as any, backgroundColor: color }]} />
    </View>
  );
}

function ProfileCard({ profile, label, accentColor }: {
  profile: ComicStyleProfile;
  label: string;
  accentColor: string;
}) {
  const meters: { key: string; val: number }[] = [
    { key: 'Anatomy Stylization', val: profile.anatomyStylization },
    { key: 'Realism Level',       val: profile.realismLevel },
    { key: 'Ink Density',         val: profile.inkDensity },
    { key: 'Motion Intensity',    val: profile.motionIntensity },
    { key: 'Texture Amount',      val: profile.textureAmount },
    { key: 'Color Complexity',    val: profile.colorComplexity },
    { key: 'Environmental Detail',val: profile.environmentalDetail },
  ];
  const flags = [
    profile.usesHalftones          && 'Halftone Dots',
    profile.usesScreenTone          && 'Screen Tone',
    profile.cinematicLighting       && 'Cinematic Lighting',
    profile.exaggeratedPerspective  && 'Exaggerated Perspective',
    profile.heavyShadowing          && 'Heavy Shadowing',
  ].filter(Boolean) as string[];

  const genreMeta = GENRES.find(g => g.id === profile.genre);

  return (
    <View style={[s.profileCard, { borderColor: accentColor }]}>
      {/* Header row */}
      <View style={[s.profileHeader, { backgroundColor: accentColor + '22' }]}>
        <Text style={[s.profileLabel, { color: accentColor }]}>{label}</Text>
        <Text style={[s.profileGenre, { color: accentColor }]}>
          {genreMeta?.emoji} {genreMeta?.label ?? profile.genre}
        </Text>
      </View>

      {/* Core outputs */}
      <View style={s.outputGrid}>
        <OutputChip icon="📡" label="Render" value={RENDER_LABELS[profile.renderLanguage]} color={accentColor} />
        <OutputChip icon="🎭" label="Mode"   value={STORYTELLING_LABELS[profile.storytellingMode]} color={accentColor} />
        <OutputChip icon="📐" label="Panel"  value={PANEL_LABELS[profile.panelStyle]} color={accentColor} />
        <OutputChip icon="🌑" label="Mood"   value={MOOD_LABELS[profile.mood]} color={accentColor} />
        <OutputChip icon="🎬" label="Camera" value={CAMERA_LABELS[profile.camera]} color={accentColor} />
      </View>

      {/* Sliders */}
      <Text style={s.metersTitle}>RENDER PARAMETERS</Text>
      {meters.map(m => (
        <View key={m.key} style={s.meterRow}>
          <Text style={s.meterLabel}>{m.key}</Text>
          <MeterBar value={m.val} color={accentColor} />
          <Text style={[s.meterPct, { color: accentColor }]}>{Math.round(m.val * 100)}%</Text>
        </View>
      ))}

      {/* Boolean flags */}
      {flags.length > 0 && (
        <View style={s.flagsRow}>
          {flags.map(f => (
            <View key={f} style={[s.flagChip, { borderColor: accentColor }]}>
              <Text style={[s.flagText, { color: accentColor }]}>{f}</Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

function OutputChip({ icon, label, value, color }: {
  icon: string; label: string; value: string; color: string;
}) {
  return (
    <View style={s.outputChip}>
      <Text style={s.outputIcon}>{icon}</Text>
      <View>
        <Text style={s.outputLabelText}>{label}</Text>
        <Text style={[s.outputValue, { color }]}>{value}</Text>
      </View>
    </View>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// MAIN SCREEN
// ════════════════════════════════════════════════════════════════════════════

type Mode = 'single' | 'fusion';

export default function StyleInterpreterScreen() {
  const insets = useSafeAreaInsets();

  const [mode, setMode] = useState<Mode>('single');

  // Single mode
  const [genre, setGenre]   = useState<ComicGenre | null>(null);
  const [emotion, setEmotion] = useState<SceneEmotion | null>(null);
  const [flags, setFlags]   = useState<Set<SceneFlag>>(new Set());
  const [profile, setProfile] = useState<ComicStyleProfile | null>(null);

  // Fusion mode
  const [genreA, setGenreA] = useState<ComicGenre | null>(null);
  const [genreB, setGenreB] = useState<ComicGenre | null>(null);
  const [fusedProfile, setFusedProfile] = useState<ComicStyleProfile | null>(null);

  // Animation
  const resultAnim = useRef(new Animated.Value(0)).current;

  function animateIn() {
    resultAnim.setValue(0);
    Animated.spring(resultAnim, { toValue: 1, useNativeDriver: true, tension: 60, friction: 10 }).start();
  }

  function toggleFlag(f: SceneFlag) {
    Haptics.selectionAsync();
    setFlags(prev => {
      const next = new Set(prev);
      next.has(f) ? next.delete(f) : next.add(f);
      return next;
    });
  }

  function runInterpreter() {
    if (!genre || !emotion) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const result = interpretGenre(genre, emotion, flags);
    setProfile(result);
    animateIn();
  }

  function runFusion() {
    if (!genreA || !genreB) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    const neutral: SceneEmotion = 'TENSION';
    const pA = interpretGenre(genreA, neutral, new Set());
    const pB = interpretGenre(genreB, neutral, new Set());
    setFusedProfile(fuseProfiles(pA, pB));
    animateIn();
  }

  const genreMeta = GENRES.find(g => g.id === genre);
  const genreAMeta = GENRES.find(g => g.id === genreA);
  const genreBMeta = GENRES.find(g => g.id === genreB);

  return (
    <View style={[s.root, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
          <Feather name="arrow-left" size={20} color={C.ink} />
        </TouchableOpacity>
        <View>
          <Text style={s.headerTitle}>🧠 Style Interpreter</Text>
          <Text style={s.headerSub}>AI Genre + Render Engine</Text>
        </View>
      </View>

      {/* Mode toggle */}
      <View style={s.modeRow}>
        {(['single', 'fusion'] as Mode[]).map(m => (
          <TouchableOpacity
            key={m}
            style={[s.modeBtn, mode === m && s.modeBtnActive]}
            onPress={() => { setMode(m); Haptics.selectionAsync(); }}
          >
            <Text style={[s.modeBtnText, mode === m && s.modeBtnTextActive]}>
              {m === 'single' ? '🎯 Interpreter' : '⚗️ Genre Fusion'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>

        {/* ─── SINGLE MODE ─────────────────────────────────────── */}
        {mode === 'single' && (
          <>
            <SectionLabel text="SELECT GENRE" />
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.hScroll}>
              <View style={s.hRow}>
                {GENRES.map(g => (
                  <TouchableOpacity
                    key={g.id}
                    style={[s.genreChip, genre === g.id && { backgroundColor: g.color + '33', borderColor: g.color }]}
                    onPress={() => { setGenre(g.id); Haptics.selectionAsync(); }}
                  >
                    <Text style={s.genreEmoji}>{g.emoji}</Text>
                    <Text style={[s.genreLabel, genre === g.id && { color: g.color }]}>{g.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>

            <SectionLabel text="SCENE EMOTION" />
            <View style={s.chipGrid}>
              {EMOTIONS.map(e => (
                <TouchableOpacity
                  key={e.id}
                  style={[s.emotionChip, emotion === e.id && s.emotionChipActive]}
                  onPress={() => { setEmotion(e.id); Haptics.selectionAsync(); }}
                >
                  <Text style={s.emotionEmoji}>{e.emoji}</Text>
                  <Text style={[s.emotionLabel, emotion === e.id && { color: C.yellow }]}>{e.label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <SectionLabel text="SCENE FLAGS  (optional)" />
            <View style={s.flagsPickRow}>
              {SCENE_FLAGS.map(f => (
                <TouchableOpacity
                  key={f.id}
                  style={[s.flagPick, flags.has(f.id) && s.flagPickActive]}
                  onPress={() => toggleFlag(f.id)}
                >
                  <Text style={s.flagPickEmoji}>{f.emoji}</Text>
                  <Text style={[s.flagPickLabel, flags.has(f.id) && { color: C.orange }]}>{f.label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity
              style={[s.runBtn, (!genre || !emotion) && s.runBtnDisabled]}
              onPress={runInterpreter}
              disabled={!genre || !emotion}
            >
              <Feather name="cpu" size={18} color={C.bg} />
              <Text style={s.runBtnText}>RUN INTERPRETER</Text>
            </TouchableOpacity>

            {profile && (
              <Animated.View style={{
                opacity: resultAnim,
                transform: [{ translateY: resultAnim.interpolate({ inputRange: [0,1], outputRange: [24, 0] }) }],
              }}>
                <ProfileCard
                  profile={profile}
                  label="STYLE PROFILE OUTPUT"
                  accentColor={genreMeta?.color ?? C.yellow}
                />
              </Animated.View>
            )}
          </>
        )}

        {/* ─── FUSION MODE ─────────────────────────────────────── */}
        {mode === 'fusion' && (
          <>
            <View style={s.fusionIntro}>
              <Text style={s.fusionIntroText}>
                Select two genres — the Genre Fusion Engine blends their render parameters, mood, and cinematic language into a hybrid style profile.
              </Text>
            </View>

            {([
              { label: 'GENRE A', current: genreA, setter: setGenreA, meta: genreAMeta, accentColor: C.blue },
              { label: 'GENRE B', current: genreB, setter: setGenreB, meta: genreBMeta, accentColor: C.red },
            ] as const).map(slot => (
              <View key={slot.label}>
                <SectionLabel text={slot.label} />
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.hScroll}>
                  <View style={s.hRow}>
                    {GENRES.map(g => (
                      <TouchableOpacity
                        key={g.id}
                        style={[s.genreChip, slot.current === g.id && { backgroundColor: slot.accentColor + '33', borderColor: slot.accentColor }]}
                        onPress={() => { (slot.setter as (v: ComicGenre) => void)(g.id); Haptics.selectionAsync(); }}
                      >
                        <Text style={s.genreEmoji}>{g.emoji}</Text>
                        <Text style={[s.genreLabel, slot.current === g.id && { color: slot.accentColor }]}>{g.label}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </ScrollView>
              </View>
            ))}

            {/* Fusion preview row */}
            {genreA && genreB && (
              <View style={s.fusionPreviewRow}>
                <View style={[s.fusionBadge, { borderColor: C.blue }]}>
                  <Text style={s.fusionBadgeEmoji}>{genreAMeta?.emoji}</Text>
                  <Text style={[s.fusionBadgeLabel, { color: C.blue }]}>{genreAMeta?.label}</Text>
                </View>
                <Text style={s.fusionPlus}>⚗️</Text>
                <View style={[s.fusionBadge, { borderColor: C.red }]}>
                  <Text style={s.fusionBadgeEmoji}>{genreBMeta?.emoji}</Text>
                  <Text style={[s.fusionBadgeLabel, { color: C.red }]}>{genreBMeta?.label}</Text>
                </View>
              </View>
            )}

            <TouchableOpacity
              style={[s.runBtn, { backgroundColor: C.purple }, (!genreA || !genreB) && s.runBtnDisabled]}
              onPress={runFusion}
              disabled={!genreA || !genreB}
            >
              <Feather name="zap" size={18} color={C.white} />
              <Text style={[s.runBtnText, { color: C.white }]}>FUSE GENRES</Text>
            </TouchableOpacity>

            {fusedProfile && genreA && genreB && (
              <Animated.View style={{
                opacity: resultAnim,
                transform: [{ translateY: resultAnim.interpolate({ inputRange: [0,1], outputRange: [24, 0] }) }],
              }}>
                {/* Show individual profiles side info */}
                <View style={s.fusionSideRow}>
                  <View style={[s.fusionSide, { borderColor: C.blue }]}>
                    <Text style={[s.fusionSideTitle, { color: C.blue }]}>{genreAMeta?.emoji} {genreAMeta?.label}</Text>
                    <Text style={[s.fusionSideStat, { color: C.muted }]}>
                      {RENDER_LABELS[interpretGenre(genreA, 'TENSION', new Set()).renderLanguage]}
                    </Text>
                    <Text style={[s.fusionSideStat, { color: C.muted }]}>
                      {MOOD_LABELS[interpretGenre(genreA, 'TENSION', new Set()).mood]}
                    </Text>
                  </View>
                  <View style={[s.fusionSide, { borderColor: C.red }]}>
                    <Text style={[s.fusionSideTitle, { color: C.red }]}>{genreBMeta?.emoji} {genreBMeta?.label}</Text>
                    <Text style={[s.fusionSideStat, { color: C.muted }]}>
                      {RENDER_LABELS[interpretGenre(genreB, 'TENSION', new Set()).renderLanguage]}
                    </Text>
                    <Text style={[s.fusionSideStat, { color: C.muted }]}>
                      {MOOD_LABELS[interpretGenre(genreB, 'TENSION', new Set()).mood]}
                    </Text>
                  </View>
                </View>
                <ProfileCard
                  profile={fusedProfile}
                  label={`FUSED: ${genreAMeta?.label} × ${genreBMeta?.label}`}
                  accentColor={C.purple}
                />
              </Animated.View>
            )}
          </>
        )}

        <View style={{ height: 60 }} />
      </ScrollView>
    </View>
  );
}

function SectionLabel({ text }: { text: string }) {
  return <Text style={s.sectionLabel}>{text}</Text>;
}

// ════════════════════════════════════════════════════════════════════════════
// STYLES
// ════════════════════════════════════════════════════════════════════════════

const s = StyleSheet.create({
  root:        { flex: 1, backgroundColor: C.bg },
  header:      { flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 18, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: C.border },
  backBtn:     { width: 36, height: 36, borderRadius: 18, backgroundColor: C.card, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '800', color: C.ink, letterSpacing: 0.5 },
  headerSub:   { fontSize: 11, color: C.muted, marginTop: 1 },

  modeRow:          { flexDirection: 'row', margin: 16, gap: 10 },
  modeBtn:          { flex: 1, paddingVertical: 10, borderRadius: 10, borderWidth: 1, borderColor: C.border, alignItems: 'center', backgroundColor: C.card },
  modeBtnActive:    { backgroundColor: C.yellow + '22', borderColor: C.yellow },
  modeBtnText:      { fontSize: 13, fontWeight: '700', color: C.muted },
  modeBtnTextActive:{ color: C.yellow },

  scroll:      { paddingHorizontal: 16, paddingBottom: 32 },
  sectionLabel:{ fontSize: 10, fontWeight: '800', color: C.muted, letterSpacing: 1.5, marginTop: 20, marginBottom: 10 },

  hScroll:     { marginHorizontal: -16, paddingLeft: 16 },
  hRow:        { flexDirection: 'row', gap: 8, paddingRight: 24, paddingBottom: 4 },

  genreChip:   { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, backgroundColor: C.card, borderWidth: 1, borderColor: C.border, alignItems: 'center', minWidth: 80 },
  genreEmoji:  { fontSize: 18, marginBottom: 2 },
  genreLabel:  { fontSize: 10, fontWeight: '700', color: C.muted, textAlign: 'center' },

  chipGrid:    { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  emotionChip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, backgroundColor: C.card, borderWidth: 1, borderColor: C.border },
  emotionChipActive: { backgroundColor: C.yellow + '22', borderColor: C.yellow },
  emotionEmoji:{ fontSize: 16 },
  emotionLabel:{ fontSize: 12, fontWeight: '600', color: C.muted },

  flagsPickRow:{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  flagPick:    { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, backgroundColor: C.card, borderWidth: 1, borderColor: C.border },
  flagPickActive: { backgroundColor: C.orange + '22', borderColor: C.orange },
  flagPickEmoji:{ fontSize: 15 },
  flagPickLabel:{ fontSize: 12, fontWeight: '600', color: C.muted },

  runBtn:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, marginTop: 24, paddingVertical: 15, borderRadius: 14, backgroundColor: C.yellow },
  runBtnDisabled: { opacity: 0.35 },
  runBtnText:  { fontSize: 14, fontWeight: '900', color: C.bg, letterSpacing: 1.5 },

  profileCard: { marginTop: 20, borderRadius: 16, borderWidth: 1.5, backgroundColor: C.card, overflow: 'hidden' },
  profileHeader:{ paddingHorizontal: 16, paddingVertical: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  profileLabel:{ fontSize: 10, fontWeight: '900', letterSpacing: 1.5 },
  profileGenre:{ fontSize: 13, fontWeight: '800' },

  outputGrid:  { padding: 14, gap: 10 },
  outputChip:  { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: C.card2, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8 },
  outputIcon:  { fontSize: 18 },
  outputLabelText: { fontSize: 9, fontWeight: '700', color: C.muted, letterSpacing: 1 },
  outputValue: { fontSize: 13, fontWeight: '700', marginTop: 1 },

  metersTitle: { fontSize: 9, fontWeight: '800', color: C.muted, letterSpacing: 1.5, marginHorizontal: 14, marginTop: 4, marginBottom: 8 },
  meterRow:    { flexDirection: 'row', alignItems: 'center', marginHorizontal: 14, marginBottom: 6, gap: 8 },
  meterLabel:  { fontSize: 10, color: C.muted, width: 120 },
  meterTrack:  { flex: 1, height: 6, backgroundColor: C.border, borderRadius: 3, overflow: 'hidden' },
  meterFill:   { height: '100%', borderRadius: 3 },
  meterPct:    { fontSize: 10, fontWeight: '700', width: 32, textAlign: 'right' },

  flagsRow:    { flexDirection: 'row', flexWrap: 'wrap', gap: 6, padding: 14, paddingTop: 8 },
  flagChip:    { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, borderWidth: 1, backgroundColor: C.card2 },
  flagText:    { fontSize: 10, fontWeight: '700' },

  fusionIntro:     { backgroundColor: C.card, borderRadius: 12, padding: 14, marginBottom: 4, borderWidth: 1, borderColor: C.border },
  fusionIntroText: { fontSize: 13, color: C.muted, lineHeight: 19 },

  fusionPreviewRow:{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 14, marginTop: 16 },
  fusionBadge:     { paddingHorizontal: 14, paddingVertical: 10, borderRadius: 12, borderWidth: 1.5, backgroundColor: C.card, alignItems: 'center', minWidth: 100 },
  fusionBadgeEmoji:{ fontSize: 22, marginBottom: 4 },
  fusionBadgeLabel:{ fontSize: 12, fontWeight: '800' },
  fusionPlus:      { fontSize: 24 },

  fusionSideRow:  { flexDirection: 'row', gap: 10, marginTop: 16, marginBottom: 4 },
  fusionSide:     { flex: 1, backgroundColor: C.card, borderRadius: 12, padding: 12, borderWidth: 1 },
  fusionSideTitle:{ fontSize: 12, fontWeight: '800', marginBottom: 6 },
  fusionSideStat: { fontSize: 11, marginTop: 2 },
});
