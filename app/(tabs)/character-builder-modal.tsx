// ============================================================================
// CHARACTER BUILDER MODAL
// Full port of Java Universal Character DNA + Consistency System
// Tabs: FACE · BODY · HAIR · COSTUME · COLORS · STYLE · MARKS · POWERS · LOCK
// ============================================================================

import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Animated,
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import {
  BLANK_CHARACTER_DNA,
  BODY_LOCATIONS,
  BODY_TYPES,
  CAPE_TYPES,
  CHARACTER_ROLES,
  CINEMATIC_STYLES,
  EYE_SHAPES,
  ENERGY_EFFECTS,
  FACE_SHAPES,
  EYE_COLOR_SWATCHES,
  HAIR_COLOR_SWATCHES,
  HAIR_COLORS,
  HAIR_STYLES,
  SKIN_TONES,
  JAW_TYPES,
  MOUTH_TYPES,
  NOSE_TYPES,
  PAINT_PLACEMENTS,
  PAINT_STYLES,
  PRESET_COLORS,
  RENDER_STYLES,
  SCAR_TYPES,
  SECONDARY_SUIT,
  SUIT_TYPES,
  SYMBOLS,
  TATTOO_STYLES,
  WEAPON_MATERIALS,
  WEAPON_TYPES,
  interpretCharacterDescription,
  type BodyEmotion,
  type CharacterDNA,
  type FacialFeature,
  type FacialPaint,
  type FemaleAnatomyType,
  type MaleAnatomyType,
  type TattooProfile,
  type WeaponProfile,
} from '@/lib/character-memory';
import {
  ACTION_MUSCLE_FLOWS,
  ANATOMY_GENRE_COLORS,
  BODY_ARCHETYPE_DNA,
  BODY_EMOTION_PROFILES,
  COSTUME_MATERIAL_DNA,
  FEMALE_ANATOMY_PROFILES,
  MALE_ANATOMY_PROFILES,
  MASTER_ANATOMY_ARCHETYPES,
  MATERIAL_CATEGORY_COLORS,
  POSE_STYLES,
  RENDER_STYLE_CATEGORY_COLORS,
  RENDER_STYLE_DNA,
  type BodyArchetypeDNA,
  type CostumeMaterialDNA,
  type MasterAnatomyArchetype,
  type RenderStyleDNA,
} from '@/lib/anatomy-engine';
import {
  FEUDAL_ENV_COLORS,
  FEUDAL_JAPAN_ATMOSPHERE_FX,
  FEUDAL_JAPAN_CHARACTER_ARCHETYPES,
  FEUDAL_JAPAN_CINEMATIC_SHOTS,
  FEUDAL_JAPAN_COMBAT_STYLES,
  FEUDAL_JAPAN_ENVIRONMENTS,
  FEUDAL_JAPAN_LIGHTING,
  FEUDAL_JAPAN_MYTHOLOGY,
  FEUDAL_JAPAN_STYLE_DNA,
  FEUDAL_JAPAN_SYMBOLISM,
  type FeudalJapanScene,
} from '@/lib/feudal-japan-engine';
import {
  COMIC_ART_STYLE_DNA,
  COMIC_ART_STYLE_LABELS,
  COMIC_CINEMATIC_ADDITIONS,
  COMIC_DAMAGE_EFFECTS,
  COMIC_EMOTIONAL_COLORS,
  COMIC_EMOTIONAL_FX,
  COMIC_IMPACT_COLORS,
  COMIC_IMPACT_FX,
  COMIC_IMPACT_LABELS,
  COMIC_PANEL_MOOD_COLORS,
  COMIC_PANEL_MOOD_LABELS,
  COMIC_PANEL_MOODS,
  COMIC_POWER_COLORS,
  COMIC_POWER_FX,
  COMIC_SHADOW_STYLES,
  COMIC_SOUND_FX,
  COMIC_SPEED_FX_ALL,
  COMIC_STYLIZED_BLOOD_ALTERNATIVES,
  type ComicLanguageScene,
} from '@/lib/comic-language-engine';
import {
  VI_ACTION_READABILITY,
  VI_ARCHETYPE_COLORS,
  VI_ARCHETYPE_LABELS,
  VI_ARCHETYPES,
  VI_ANATOMY_BUILDS,
  VI_BUILD_LABELS,
  VI_CINEMATIC_EXPANSION,
  VI_CINEMATIC_FRAMINGS,
  VI_COSTUME_COLORS,
  VI_COSTUME_IDENTITY,
  VI_COSTUME_LABELS,
  VI_DOMINANCE_TOOLS,
  VI_EMOTIONAL_COLORS,
  VI_EMOTIONAL_TRAITS,
  VI_POSTURE_COLORS,
  VI_POSTURE_LABELS,
  VI_POSTURE_TRAITS,
  VI_SHADOW_LANGUAGE,
  VI_SILHOUETTE_COLORS,
  VI_SILHOUETTE_LABELS,
  VI_SILHOUETTE_TRAITS,
  type VisualIntelligenceScene,
} from '@/lib/visual-intelligence-engine';
import {
  CC_CAMERA_COLORS,
  CC_CAMERA_LABELS,
  CC_CAMERA_MEANINGS,
  CC_CINEMATIC_SHOTS,
  CC_COMBAT_FLOW,
  CC_DOMINANCE_TOOLS,
  CC_EMOTIONAL_PACING,
  CC_EYE_GUIDANCE,
  CC_MOTION_RULES,
  CC_PACING_COLORS,
  CC_PACING_LABELS,
  CC_PANEL_COLORS,
  CC_PANEL_LABELS,
  CC_PANEL_LAYOUTS,
  CC_PANEL_TRANSITIONS,
  CC_RHYTHM_COLORS,
  CC_RHYTHM_LABELS,
  CC_SHOT_COLORS,
  CC_SHOT_LABELS,
  CC_SPLASH_TRIGGERS,
  CC_SPLASH_VISUAL_RULES,
  CC_STORYTELLING_SUGGESTIONS,
  CC_TRANSITION_LABELS,
  CC_VISUAL_DIRECTION,
  CC_VISUAL_RHYTHM,
  type CinematicCompositionScene,
} from '@/lib/cinematic-composition-engine';

// ── Palette ───────────────────────────────────────────────────────────────────
const C = {
  bg:      '#0A0806',
  bgMid:   '#110E0B',
  card:    '#161210',
  border:  '#2A2420',
  white:   '#F5F0E8',
  muted:   '#6B6560',
  gold:    '#FFD600',
  goldDim: '#C4913A',
  red:     '#E8001C',
  green:   '#22C55E',
  purple:  '#A78BFA',
};

// ── Tab config ────────────────────────────────────────────────────────────────
type TabId = 'FACE' | 'BODY' | 'HAIR' | 'COSTUME' | 'COLORS' | 'STYLE' | 'MARKS' | 'POWERS' | 'FX' | 'INTEL' | 'PANEL' | 'WORLD' | 'LOCK';

const TABS: Array<{ id: TabId; icon: React.ComponentProps<typeof Feather>['name']; label: string }> = [
  { id: 'FACE',    icon: 'user',      label: 'FACE'    },
  { id: 'BODY',    icon: 'activity',  label: 'BODY'    },
  { id: 'HAIR',    icon: 'wind',      label: 'HAIR'    },
  { id: 'COSTUME', icon: 'shield',    label: 'SUIT'    },
  { id: 'COLORS',  icon: 'droplet',   label: 'COLOR'   },
  { id: 'STYLE',   icon: 'pen-tool',  label: 'STYLE'   },
  { id: 'MARKS',   icon: 'feather',   label: 'MARKS'   },
  { id: 'POWERS',  icon: 'zap',       label: 'POWERS'  },
  { id: 'FX',      icon: 'film',      label: 'FX'      },
  { id: 'INTEL',   icon: 'eye',       label: 'INTEL'   },
  { id: 'PANEL',   icon: 'layout',    label: 'PANEL'   },
  { id: 'WORLD',   icon: 'globe',     label: 'WORLD'   },
  { id: 'LOCK',    icon: 'lock',      label: 'LOCK'    },
];

// ── Role → Feather icon map ────────────────────────────────────────────────
const ROLE_ICONS: Record<string, React.ComponentProps<typeof Feather>['name']> = {
  HERO:      'shield',
  VILLAIN:   'alert-octagon',
  ANTI_HERO: 'moon',
  WARRIOR:   'zap',
  MAGE:      'star',
  ASSASSIN:  'target',
  MENTOR:    'book-open',
  SIDEKICK:  'users',
  MONSTER:   'alert-triangle',
  CYBORG:    'cpu',
  SOLDIER:   'crosshair',
  ALIEN:     'radio',
};

const ARCHETYPE_ICONS: Record<string, React.ComponentProps<typeof Feather>['name']> = {
  NERD_SLIM:       'book',
  LEAN_HERO:       'shield',
  MEGA_HERO:       'zap',
  BEAST_FORM:      'alert-triangle',
  SPEED_RUNNER:    'wind',
  SHADOW_ASSASSIN: 'target',
  COSMIC_TITAN:    'star',
};

// ── BodyArchetypeCard ─────────────────────────────────────────────────────────
function BodyArchetypeCard({ arch, selected, onPress }: {
  arch: BodyArchetypeDNA; selected: boolean; onPress: () => void;
}) {
  const bars: { label: string; val: number }[] = [
    { label: 'MASS',  val: arch.anatomy.bodyMass },
    { label: 'SHLD',  val: arch.anatomy.shoulderWidth },
    { label: 'CHEST', val: arch.anatomy.chestSize },
    { label: 'ARMS',  val: arch.anatomy.armThickness },
  ];
  return (
    <TouchableOpacity
      style={[ba.card, { borderColor: selected ? C.gold : C.border, backgroundColor: selected ? C.gold + '0A' : C.card }]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <View style={ba.cardHeader}>
        <Feather name={ARCHETYPE_ICONS[arch.id] ?? 'user'} size={16} color={selected ? C.gold : C.muted} />
        <Text style={[ba.cardTitle, { color: selected ? C.gold : '#F5EDD6' }]}>{arch.displayName}</Text>
        {selected && <Feather name="check-circle" size={12} color={C.gold} />}
      </View>
      <View style={ba.barsWrap}>
        {bars.map(b => (
          <View key={b.label} style={ba.barRow}>
            <Text style={ba.barLabel}>{b.label}</Text>
            <View style={ba.barTrack}>
              <View style={[ba.barFill, { width: `${Math.round(b.val * 100)}%` as `${number}%`, backgroundColor: selected ? C.gold : C.goldDim }]} />
            </View>
          </View>
        ))}
      </View>
      <Text style={[ba.visualRead, { color: selected ? C.gold : C.goldDim }]}>
        {arch.visualLanguage.readsAs.replace(/_/g, ' ').toUpperCase()}
      </Text>
      <Text style={ba.cardDesc} numberOfLines={2}>{arch.uiDescription}</Text>
      <View style={ba.tagsRow}>
        {arch.tags.slice(0, 3).map(tag => (
          <View key={tag} style={[ba.tag, { borderColor: selected ? C.gold + '55' : C.border }]}>
            <Text style={[ba.tagText, { color: selected ? C.gold : C.muted }]}>{tag}</Text>
          </View>
        ))}
      </View>
    </TouchableOpacity>
  );
}
const ba = StyleSheet.create({
  card:       { width: 188, borderWidth: 1.5, borderRadius: 14, padding: 14, marginRight: 10, gap: 10 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  cardTitle:  { fontFamily: 'Inter_700Bold', fontSize: 13, letterSpacing: 0.4, flex: 1 },
  barsWrap:   { gap: 5 },
  barRow:     { flexDirection: 'row', alignItems: 'center', gap: 7 },
  barLabel:   { fontFamily: 'Inter_700Bold', fontSize: 7, color: '#6B6560', letterSpacing: 0.8, width: 30 },
  barTrack:   { flex: 1, height: 4, backgroundColor: '#2A2420', borderRadius: 2, overflow: 'hidden' },
  barFill:    { height: 4, borderRadius: 2 },
  visualRead: { fontFamily: 'Inter_700Bold', fontSize: 8, letterSpacing: 1.1 },
  cardDesc:   { fontFamily: 'Inter_400Regular', fontSize: 10, color: '#6B6560', lineHeight: 14 },
  tagsRow:    { flexDirection: 'row', flexWrap: 'wrap', gap: 4 },
  tag:        { borderWidth: 1, borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2 },
  tagText:    { fontFamily: 'Inter_600SemiBold', fontSize: 8, letterSpacing: 0.4 },
});

// ── RenderStyleCard ───────────────────────────────────────────────────────────
function RenderStyleCard({ style, selected, onPress }: {
  style: RenderStyleDNA; selected: boolean; onPress: () => void;
}) {
  const catColor = RENDER_STYLE_CATEGORY_COLORS[style.category];
  return (
    <TouchableOpacity
      style={[rs.card, { borderColor: selected ? C.gold : C.border, backgroundColor: selected ? C.gold + '0A' : C.card }]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <View style={rs.topRow}>
        <View style={[rs.catBadge, { backgroundColor: catColor + '22', borderColor: catColor + '55' }]}>
          <Text style={[rs.catText, { color: catColor }]}>{style.category.toUpperCase()}</Text>
        </View>
        {selected && <Feather name="check-circle" size={12} color={C.gold} />}
      </View>
      <Text style={[rs.name, { color: selected ? C.gold : '#F5EDD6' }]}>{style.displayName}</Text>
      <View style={[rs.accentBar, { backgroundColor: selected ? C.gold : catColor }]} />
      <Text style={rs.desc} numberOfLines={2}>{style.uiDescription}</Text>
    </TouchableOpacity>
  );
}
const rs = StyleSheet.create({
  card:     { width: 160, borderWidth: 1.5, borderRadius: 14, padding: 14, marginRight: 10, gap: 9 },
  topRow:   { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  catBadge: { borderWidth: 1, borderRadius: 6, paddingHorizontal: 7, paddingVertical: 2 },
  catText:  { fontFamily: 'Inter_700Bold', fontSize: 8, letterSpacing: 1 },
  name:     { fontFamily: 'Inter_700Bold', fontSize: 14, letterSpacing: 0.3 },
  accentBar:{ height: 2, borderRadius: 1, width: 32 },
  desc:     { fontFamily: 'Inter_400Regular', fontSize: 10, color: '#6B6560', lineHeight: 14 },
});

// ── MasterAnatomyCard ─────────────────────────────────────────────────────────
function MasterAnatomyCard({ arch, selected, onPress }: {
  arch: MasterAnatomyArchetype; selected: boolean; onPress: () => void;
}) {
  const genre = arch.genreAffinity[0] ?? 'action';
  const genreColor = ANATOMY_GENRE_COLORS[genre] ?? '#FFD600';
  const bars = [
    { label: 'HEIGHT', val: (arch.proportions.heightRatio - 5) / 6 },
    { label: 'SHLD',   val: arch.proportions.shoulderWidth },
    { label: 'CHEST',  val: arch.muscleGroups.chest },
    { label: 'ARMS',   val: arch.muscleGroups.arms },
  ];
  return (
    <TouchableOpacity
      style={[ma.card, { borderColor: selected ? C.gold : C.border, backgroundColor: selected ? C.gold + '0A' : C.card }]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <View style={ma.topRow}>
        <View style={[ma.badge, { backgroundColor: genreColor + '22', borderColor: genreColor + '55' }]}>
          <Text style={[ma.badgeText, { color: genreColor }]}>{genre.replace(/_/g, ' ').toUpperCase()}</Text>
        </View>
        {selected && <Feather name="check-circle" size={12} color={C.gold} />}
      </View>
      <Text style={[ma.name, { color: selected ? C.gold : '#F5EDD6' }]}>{arch.displayName}</Text>
      <View style={[ma.accentBar, { backgroundColor: selected ? C.gold : genreColor }]} />
      <View style={ma.barsWrap}>
        {bars.map(b => (
          <View key={b.label} style={ma.barRow}>
            <Text style={ma.barLabel}>{b.label}</Text>
            <View style={ma.barTrack}>
              <View style={[ma.barFill, { width: `${Math.round(b.val * 100)}%` as `${number}%`, backgroundColor: selected ? C.gold : genreColor }]} />
            </View>
          </View>
        ))}
      </View>
      <Text style={[ma.psychology, { color: selected ? C.gold : C.goldDim }]}>
        {arch.psychology.replace(/_/g, ' ').toUpperCase()}
      </Text>
      <Text style={ma.desc} numberOfLines={2}>{arch.uiDescription}</Text>
    </TouchableOpacity>
  );
}
const ma = StyleSheet.create({
  card:       { width: 188, borderWidth: 1.5, borderRadius: 14, padding: 14, marginRight: 10, gap: 9 },
  topRow:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  badge:      { borderWidth: 1, borderRadius: 6, paddingHorizontal: 7, paddingVertical: 2 },
  badgeText:  { fontFamily: 'Inter_700Bold', fontSize: 8, letterSpacing: 1 },
  name:       { fontFamily: 'Inter_700Bold', fontSize: 14, letterSpacing: 0.3 },
  accentBar:  { height: 2, borderRadius: 1, width: 32 },
  barsWrap:   { gap: 4 },
  barRow:     { flexDirection: 'row', alignItems: 'center', gap: 7 },
  barLabel:   { fontFamily: 'Inter_700Bold', fontSize: 7, color: '#6B6560', letterSpacing: 0.8, width: 36 },
  barTrack:   { flex: 1, height: 4, backgroundColor: '#2A2420', borderRadius: 2, overflow: 'hidden' },
  barFill:    { height: 4, borderRadius: 2 },
  psychology: { fontFamily: 'Inter_700Bold', fontSize: 8, letterSpacing: 1.1 },
  desc:       { fontFamily: 'Inter_400Regular', fontSize: 10, color: '#6B6560', lineHeight: 14 },
});

// ── MaterialCard ──────────────────────────────────────────────────────────────
function MaterialCard({ mat, selected, onPress }: {
  mat: CostumeMaterialDNA; selected: boolean; onPress: () => void;
}) {
  const catColor = MATERIAL_CATEGORY_COLORS[mat.category] ?? '#FFD600';
  return (
    <TouchableOpacity
      style={[mt.card, { borderColor: selected ? C.gold : C.border, backgroundColor: selected ? C.gold + '0A' : C.card }]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <View style={mt.topRow}>
        <View style={[mt.badge, { backgroundColor: catColor + '22', borderColor: catColor + '55' }]}>
          <Text style={[mt.badgeText, { color: catColor }]}>{mat.category.toUpperCase()}</Text>
        </View>
        {selected && <Feather name="check-circle" size={12} color={C.gold} />}
      </View>
      <Text style={[mt.name, { color: selected ? C.gold : '#F5EDD6' }]}>{mat.displayName}</Text>
      <View style={[mt.accentBar, { backgroundColor: selected ? C.gold : catColor }]} />
      <View style={mt.barsWrap}>
        <View style={mt.barRow}>
          <Text style={mt.barLabel}>REFL</Text>
          <View style={mt.barTrack}>
            <View style={[mt.barFill, { width: `${Math.round(mat.visualProperties.reflectivity * 100)}%` as `${number}%`, backgroundColor: selected ? C.gold : catColor }]} />
          </View>
        </View>
        <View style={mt.barRow}>
          <Text style={mt.barLabel}>GLOSS</Text>
          <View style={mt.barTrack}>
            <View style={[mt.barFill, { width: `${Math.round(mat.visualProperties.glossiness * 100)}%` as `${number}%`, backgroundColor: selected ? C.gold : catColor }]} />
          </View>
        </View>
        <View style={mt.barRow}>
          <Text style={mt.barLabel}>FLEX</Text>
          <View style={mt.barTrack}>
            <View style={[mt.barFill, { width: `${Math.round(mat.physicalProperties.flexibility * 100)}%` as `${number}%`, backgroundColor: selected ? C.goldDim : '#2A2420' }]} />
          </View>
        </View>
      </View>
      <Text style={mt.idealFor} numberOfLines={1}>
        {mat.comicBehavior.idealFor.slice(0, 2).join(' · ').replace(/_/g, ' ')}
      </Text>
      <Text style={mt.desc} numberOfLines={2}>{mat.uiDescription}</Text>
    </TouchableOpacity>
  );
}
const mt = StyleSheet.create({
  card:      { width: 178, borderWidth: 1.5, borderRadius: 14, padding: 14, marginRight: 10, gap: 9 },
  topRow:    { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  badge:     { borderWidth: 1, borderRadius: 6, paddingHorizontal: 7, paddingVertical: 2 },
  badgeText: { fontFamily: 'Inter_700Bold', fontSize: 7, letterSpacing: 0.8 },
  name:      { fontFamily: 'Inter_700Bold', fontSize: 13, letterSpacing: 0.3 },
  accentBar: { height: 2, borderRadius: 1, width: 28 },
  barsWrap:  { gap: 4 },
  barRow:    { flexDirection: 'row', alignItems: 'center', gap: 7 },
  barLabel:  { fontFamily: 'Inter_700Bold', fontSize: 7, color: '#6B6560', letterSpacing: 0.8, width: 34 },
  barTrack:  { flex: 1, height: 4, backgroundColor: '#2A2420', borderRadius: 2, overflow: 'hidden' },
  barFill:   { height: 4, borderRadius: 2 },
  idealFor:  { fontFamily: 'Inter_600SemiBold', fontSize: 8, color: '#6B6560', letterSpacing: 0.5 },
  desc:      { fontFamily: 'Inter_400Regular', fontSize: 10, color: '#6B6560', lineHeight: 14 },
});

// ── Chip ──────────────────────────────────────────────────────────────────────
function Chip({ label, active, onPress, color }: {
  label: string; active: boolean; onPress: () => void; color?: string;
}) {
  const c = color ?? C.gold;
  return (
    <TouchableOpacity
      style={[ch.chip, { borderColor: active ? c : C.border, backgroundColor: active ? c + '18' : C.card }]}
      onPress={onPress}
      activeOpacity={0.75}
    >
      <Text style={[ch.label, { color: active ? c : C.muted }]}>
        {label.replace(/_/g, ' ').toUpperCase()}
      </Text>
    </TouchableOpacity>
  );
}
const ch = StyleSheet.create({
  chip:  { borderWidth: 1, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6 },
  label: { fontFamily: 'Inter_600SemiBold', fontSize: 9, letterSpacing: 0.6 },
});

// ── Section row ───────────────────────────────────────────────────────────────
function OptionRow({ label, options, value, onChange, color }: {
  label: string; options: string[]; value: string; onChange: (v: string) => void; color?: string;
}) {
  return (
    <View style={or.wrap}>
      <Text style={or.label}>{label}</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6 }}>
        {options.map(opt => (
          <Chip key={opt} label={opt} active={value === opt} onPress={() => onChange(opt)} color={color} />
        ))}
      </ScrollView>
    </View>
  );
}
const or = StyleSheet.create({
  wrap:  { marginBottom: 14 },
  label: { fontFamily: 'Inter_700Bold', fontSize: 8, color: C.muted, letterSpacing: 1.5, marginBottom: 6 },
});

const wt = StyleSheet.create({
  activateCard:  { borderWidth: 1.5, borderRadius: 14, padding: 16, marginBottom: 16, gap: 10 },
  activateRow:   { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  activateLeft:  { flexDirection: 'row', alignItems: 'center', gap: 12 },
  activateTitle: { fontFamily: 'Inter_700Bold', fontSize: 14, letterSpacing: 0.5 },
  activateSub:   { fontFamily: 'Inter_400Regular', fontSize: 10, color: C.muted, marginTop: 1 },
  activateDot:   { width: 10, height: 10, borderRadius: 5 },
  activateDesc:  { fontFamily: 'Inter_400Regular', fontSize: 11, color: C.muted, lineHeight: 16 },
  envBtn:        { borderWidth: 1.5, borderRadius: 10, paddingVertical: 10, alignItems: 'center', justifyContent: 'center' },
  symbolChip:    { borderWidth: 1, borderColor: C.border, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 5, gap: 2 },
  symbolKey:     { fontFamily: 'Inter_700Bold', fontSize: 8, color: C.goldDim, letterSpacing: 0.5, textTransform: 'capitalize' },
  symbolVal:     { fontFamily: 'Inter_400Regular', fontSize: 9, color: C.muted },
});

// ── Section label ─────────────────────────────────────────────────────────────
function SectionLabel({ children }: { children: string }) {
  return <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 8, color: C.muted, letterSpacing: 1.5, marginBottom: 8, marginTop: 4 }}>{children}</Text>;
}

// ── Color grid ────────────────────────────────────────────────────────────────
function ColorGrid({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [customHex, setCustomHex] = useState('');
  const isValidHex = /^#[0-9A-Fa-f]{6}$/.test(customHex.trim());

  function applyCustom() {
    if (!isValidHex) return;
    onChange(customHex.trim().toUpperCase());
    setCustomHex('');
  }

  return (
    <View>
      <View style={cg.grid}>
        {PRESET_COLORS.map(col => (
          <TouchableOpacity
            key={col}
            style={[cg.swatch, { backgroundColor: col, borderColor: value === col ? C.gold : C.border }]}
            onPress={() => onChange(col)}
            activeOpacity={0.8}
          >
            {value === col && (
              <Feather name="check" size={9} color={col === '#FFFFFF' ? '#000' : '#FFF'} />
            )}
          </TouchableOpacity>
        ))}
        {!PRESET_COLORS.includes(value) && !!value && (
          <View style={[cg.swatch, { backgroundColor: value, borderColor: C.gold, borderWidth: 2.5 }]}>
            <Feather name="check" size={9} color="#FFF" />
          </View>
        )}
      </View>
      <View style={cg.customRow}>
        <TextInput
          style={cg.customInput}
          value={customHex}
          onChangeText={setCustomHex}
          placeholder="#FF0080 — add your own hex"
          placeholderTextColor={C.muted}
          autoCapitalize="characters"
          maxLength={7}
          onSubmitEditing={applyCustom}
          returnKeyType="done"
        />
        {customHex.length > 0 && (
          <View style={[cg.customPreview, { backgroundColor: isValidHex ? customHex : C.card }]} />
        )}
        <TouchableOpacity
          style={[cg.customBtn, { opacity: isValidHex ? 1 : 0.35 }]}
          onPress={applyCustom}
          disabled={!isValidHex}
          activeOpacity={0.8}
        >
          <Text style={cg.customBtnText}>USE</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
const cg = StyleSheet.create({
  grid:         { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  swatch:       { width: 34, height: 34, borderRadius: 8, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  customRow:    { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 10 },
  customInput:  { flex: 1, fontFamily: 'Inter_400Regular', fontSize: 12, color: C.white, borderWidth: 1, borderColor: C.border, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 7, backgroundColor: C.card },
  customPreview:{ width: 32, height: 32, borderRadius: 6, borderWidth: 1, borderColor: C.border },
  customBtn:    { backgroundColor: C.gold, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8 },
  customBtnText:{ fontFamily: 'Inter_700Bold', fontSize: 10, color: C.bg, letterSpacing: 0.8 },
});

// ── SwatchGrid — visual color picker for skin / eye / hair ────────────────────
function isLightColor(hex: string): boolean {
  if (hex.length < 7) return false;
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return r * 0.299 + g * 0.587 + b * 0.114 > 160;
}

function SwatchGrid({ swatches, value, onChange, size = 50 }: {
  swatches: Array<{ name: string; hex: string; fantasy?: boolean }>;
  value: string | undefined;
  onChange: (name: string) => void;
  size?: number;
}) {
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
      {swatches.map(s => {
        const selected = value === s.name;
        const light = isLightColor(s.hex);
        return (
          <TouchableOpacity
            key={s.name}
            style={{ alignItems: 'center', width: size + 10 }}
            onPress={() => onChange(s.name)}
            activeOpacity={0.75}
          >
            <View style={{
              width: size, height: size, borderRadius: size / 2,
              backgroundColor: s.hex,
              borderWidth: selected ? 3 : 1.5,
              borderColor: selected ? C.gold : (s.fantasy ? C.purple + '80' : C.border),
              alignItems: 'center', justifyContent: 'center',
            }}>
              {selected && <Feather name="check" size={Math.round(size * 0.38)} color={light ? '#000' : '#FFF'} />}
            </View>
            <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 8, color: selected ? C.gold : C.muted, letterSpacing: 0.4, marginTop: 4, textAlign: 'center' }} numberOfLines={1}>
              {s.name}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

// ── FacialFeature row ─────────────────────────────────────────────────────────
function FeatureRow({ feature, onRemove }: { feature: FacialFeature; onRemove: () => void }) {
  return (
    <View style={fr.row}>
      <View style={{ flex: 1 }}>
        <Text style={fr.name}>{feature.featureName}</Text>
        <Text style={fr.detail}>{feature.location} · {feature.description}</Text>
      </View>
      <TouchableOpacity onPress={onRemove} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
        <Feather name="x" size={13} color={C.muted} />
      </TouchableOpacity>
    </View>
  );
}
const fr = StyleSheet.create({
  row:    { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: C.border, borderRadius: 8, padding: 10, marginBottom: 6 },
  name:   { fontFamily: 'Inter_700Bold', fontSize: 11, color: C.white, marginBottom: 2 },
  detail: { fontFamily: 'Inter_400Regular', fontSize: 10, color: C.muted },
});

// ── TattooProfile row ─────────────────────────────────────────────────────────
function TattooRow({ tattoo, onRemove }: { tattoo: TattooProfile; onRemove: () => void }) {
  return (
    <View style={[fr.row, { borderColor: C.purple + '50' }]}>
      <View style={{ flex: 1 }}>
        <Text style={[fr.name, { color: C.purple }]}>{tattoo.tattooName}</Text>
        <Text style={fr.detail}>
          {tattoo.bodyLocation} · {tattoo.style} · {tattoo.color}
          {tattoo.glowing ? ' · Glowing' : ''}
          {tattoo.magical ? ' · Magical' : ''}
        </Text>
      </View>
      <TouchableOpacity onPress={onRemove} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
        <Feather name="x" size={13} color={C.muted} />
      </TouchableOpacity>
    </View>
  );
}

// ── WeaponProfile row ─────────────────────────────────────────────────────────
function WeaponRow({ weapon, onRemove }: { weapon: WeaponProfile; onRemove: () => void }) {
  return (
    <View style={[fr.row, { borderColor: C.red + '40' }]}>
      <View style={{ flex: 1 }}>
        <Text style={[fr.name, { color: '#FF6A00' }]}>{weapon.weaponName}</Text>
        <Text style={fr.detail}>
          {weapon.weaponType} · {weapon.material}
          {weapon.energyEffect && weapon.energyEffect !== 'none' ? ` · ${weapon.energyEffect}` : ''}
          {weapon.signatureWeapon ? ' · SIGNATURE' : ''}
        </Text>
      </View>
      <TouchableOpacity onPress={onRemove} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
        <Feather name="x" size={13} color={C.muted} />
      </TouchableOpacity>
    </View>
  );
}

// ── Character Art Preview Box ─────────────────────────────────────────────────
function CharacterPreviewBox({ dna, onGenerate, imageUri, loading, failed }: {
  dna: CharacterDNA;
  onGenerate: () => void;
  imageUri: string | null;
  loading: boolean;
  failed: boolean;
}) {
  const spinAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (loading) {
      Animated.loop(
        Animated.timing(spinAnim, { toValue: 1, duration: 1400, useNativeDriver: true })
      ).start();
    } else {
      spinAnim.stopAnimation();
      spinAnim.setValue(0);
    }
  }, [loading]);
  const spin = spinAnim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });

  return (
    <View style={[pv.wrap, { backgroundColor: C.card, borderColor: C.border }]}>
      <View style={pv.imageArea}>
        {imageUri ? (
          <>
            <Image source={{ uri: imageUri }} style={pv.image} resizeMode="cover" />
            <View style={pv.nameOverlay}>
              <Text style={pv.nameText} numberOfLines={1}>{dna.characterName || 'Unnamed'}</Text>
              <Text style={pv.roleText}>{dna.role?.replace(/_/g, ' ') ?? 'HERO'}</Text>
            </View>
          </>
        ) : loading ? (
          <View style={pv.placeholder}>
            <Animated.View style={{ transform: [{ rotate: spin }] }}>
              <Feather name="aperture" size={36} color={C.gold} />
            </Animated.View>
            <Text style={[pv.hintText, { color: C.gold, marginTop: 10 }]}>RENDERING CHARACTER ART...</Text>
          </View>
        ) : failed ? (
          <View style={pv.placeholder}>
            <Feather name="alert-circle" size={30} color={C.red} />
            <Text style={[pv.hintText, { color: C.red, marginTop: 8 }]}>GENERATION FAILED — TAP RETRY</Text>
          </View>
        ) : (
          <View style={pv.placeholder}>
            <Feather name="user" size={40} color={C.border} />
            <Text style={[pv.hintText, { color: C.muted, marginTop: 10 }]}>BUILD YOUR CHARACTER · TAP GENERATE</Text>
          </View>
        )}
      </View>
      <TouchableOpacity
        style={[pv.btn, { backgroundColor: loading ? 'transparent' : C.gold, borderColor: C.gold, opacity: loading ? 0.7 : 1 }]}
        onPress={onGenerate}
        disabled={loading}
        activeOpacity={0.8}
      >
        <Feather name={loading ? 'loader' : 'cpu'} size={13} color={loading ? C.gold : C.bg} />
        <Text style={[pv.btnText, { color: loading ? C.gold : C.bg }]}>
          {loading ? 'GENERATING...' : imageUri ? 'REGENERATE ART' : 'GENERATE CHARACTER ART'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}
const pv = StyleSheet.create({
  wrap:        { marginHorizontal: 20, marginBottom: 12, borderRadius: 14, borderWidth: 1, overflow: 'hidden' },
  imageArea:   { width: '100%', aspectRatio: 1, backgroundColor: '#0D0B09' },
  image:       { width: '100%', height: '100%' },
  placeholder: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  hintText:    { fontFamily: 'Inter_600SemiBold', fontSize: 9, letterSpacing: 1.2 },
  nameOverlay: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: '#000000AA', paddingHorizontal: 12, paddingVertical: 8 },
  nameText:    { fontFamily: 'Inter_700Bold', fontSize: 14, color: '#F5F0E8' },
  roleText:    { fontFamily: 'Inter_600SemiBold', fontSize: 9, color: '#FFD600', letterSpacing: 1.5, marginTop: 2 },
  btn:         { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7, borderTopWidth: 1, paddingVertical: 12 },
  btnText:     { fontFamily: 'Inter_700Bold', fontSize: 11, letterSpacing: 1 },
});

// ── Lock row ──────────────────────────────────────────────────────────────────
function LockRow({ label, desc, value, onToggle }: {
  label: string; desc: string; value: boolean; onToggle: () => void;
}) {
  return (
    <TouchableOpacity style={lr.row} onPress={onToggle} activeOpacity={0.85}>
      <View style={[lr.icon, { backgroundColor: value ? C.green + '18' : C.card, borderColor: value ? C.green + '50' : C.border }]}>
        <Feather name={value ? 'lock' : 'unlock'} size={16} color={value ? C.green : C.muted} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[lr.label, { color: value ? C.white : C.muted }]}>{label}</Text>
        <Text style={lr.desc}>{desc}</Text>
      </View>
      <Switch
        value={value}
        onValueChange={onToggle}
        trackColor={{ false: C.border, true: C.green + '60' }}
        thumbColor={value ? C.green : C.muted}
        ios_backgroundColor={C.border}
      />
    </TouchableOpacity>
  );
}
const lr = StyleSheet.create({
  row:   { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 10, borderWidth: 1, borderRadius: 10, marginBottom: 7, borderColor: C.border },
  icon:  { width: 36, height: 36, borderRadius: 8, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  label: { fontFamily: 'Inter_700Bold', fontSize: 12, marginBottom: 2 },
  desc:  { fontFamily: 'Inter_400Regular', fontSize: 10, color: C.muted },
});

// ── CharacterBuilderModal ─────────────────────────────────────────────────────

export default function CharacterBuilderModal({
  visible,
  onClose,
  onApply,
  initialName,
  savedNames,
  onLoad,
  onDelete,
}: {
  visible: boolean;
  onClose: () => void;
  onApply: (dna: CharacterDNA) => void;
  initialName: string;
  savedNames: string[];
  onLoad: (name: string) => CharacterDNA | null;
  onDelete: (name: string) => void;
}) {
  const [tab, setTab] = useState<TabId>('FACE');
  const [dna, setDna] = useState<CharacterDNA>({ characterName: initialName, ...BLANK_CHARACTER_DNA });
  const [saved, setSaved] = useState(false);

  // AI character preview
  const [previewUri, setPreviewUri]         = useState<string | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewFailed, setPreviewFailed]   = useState(false);

  const generatePreview = useCallback(async () => {
    if (previewLoading) return;
    setPreviewLoading(true);
    setPreviewFailed(false);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      const resp = await fetch('/api/character/preview-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dna),
      });
      const data = await resp.json() as { b64_json?: string; error?: string };
      if (data.b64_json) {
        setPreviewUri(`data:image/png;base64,${data.b64_json}`);
      } else {
        setPreviewFailed(true);
      }
    } catch {
      setPreviewFailed(true);
    } finally {
      setPreviewLoading(false);
    }
  }, [dna, previewLoading]);

  // Quick Fill
  const [quickFill, setQuickFill] = useState('');
  const [quickFilling, setQuickFilling] = useState(false);

  // Add-item forms (FACE tab — facial markings)
  const [addFaceTattooName, setAddFaceTattooName] = useState('');
  const [addFaceTattooLoc, setAddFaceTattooLoc] = useState<'Face' | 'Forehead' | 'Cheek' | 'Neck' | 'Head'>('Face');

  // Add-item forms (MARKS)
  const [addScarDesc, setAddScarDesc] = useState('');
  const [addScarLoc, setAddScarLoc] = useState('Left Cheek');
  const [addBirthDesc, setAddBirthDesc] = useState('');
  const [addBirthLoc, setAddBirthLoc] = useState('Neck');
  const [addTattooName, setAddTattooName] = useState('');
  const [addTattooLoc, setAddTattooLoc] = useState('Right Arm');
  const [addTattooStyle, setAddTattooStyle] = useState('Ancient Runes');
  const [addTattooColor, setAddTattooColor] = useState('Blue');
  const [addTattooGlow, setAddTattooGlow] = useState(false);
  const [addPaintStyle, setAddPaintStyle] = useState('War Paint');
  const [addPaintColor, setAddPaintColor] = useState('Red');
  const [addPaintPlace, setAddPaintPlace] = useState('Across Eyes');

  // Add-item forms (POWERS)
  const [addWeaponName, setAddWeaponName] = useState('');
  const [addWeaponType, setAddWeaponType] = useState('Sword');
  const [addWeaponMat, setAddWeaponMat] = useState('Steel');
  const [addWeaponEnergy, setAddWeaponEnergy] = useState('none');
  const [addPower, setAddPower] = useState('');

  useEffect(() => {
    if (visible) {
      const existing = onLoad(initialName);
      setDna(existing ?? { characterName: initialName, ...BLANK_CHARACTER_DNA });
      setSaved(false);
      setQuickFill('');
    }
  }, [visible, initialName]);

  function set<K extends keyof CharacterDNA>(key: K, val: CharacterDNA[K]) {
    setDna(prev => ({ ...prev, [key]: val }));
    setSaved(false);
  }

  function handleApply() { onApply(dna); onClose(); }
  function handleLoad(name: string) {
    const loaded = onLoad(name);
    if (loaded) { setDna(loaded); setSaved(false); }
  }

  // Quick Fill — Java: CharacterDescriptionInterpreter.interpret()
  function handleQuickFill() {
    if (!quickFill.trim()) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setQuickFilling(true);
    const partial = interpretCharacterDescription(quickFill);
    setDna(prev => ({ ...prev, ...partial }));
    setSaved(false);
    setQuickFill('');
    setTimeout(() => setQuickFilling(false), 600);
  }

  // MARKS helpers
  function addScar() {
    if (!addScarDesc.trim()) return;
    const f: FacialFeature = { featureName: 'Scar', location: addScarLoc, description: addScarDesc.trim(), permanent: true };
    set('scars', [...(dna.scars ?? []), f]);
    setAddScarDesc('');
  }
  function removeScar(i: number) { set('scars', dna.scars?.filter((_, idx) => idx !== i) ?? []); }

  function addBirthmark() {
    if (!addBirthDesc.trim()) return;
    const f: FacialFeature = { featureName: 'Birthmark', location: addBirthLoc, description: addBirthDesc.trim(), permanent: true };
    set('birthmarks', [...(dna.birthmarks ?? []), f]);
    setAddBirthDesc('');
  }
  function removeBirthmark(i: number) { set('birthmarks', dna.birthmarks?.filter((_, idx) => idx !== i) ?? []); }

  function addTattoo() {
    if (!addTattooName.trim()) return;
    const t: TattooProfile = {
      tattooName: addTattooName.trim(), bodyLocation: addTattooLoc, style: addTattooStyle,
      color: addTattooColor, glowing: addTattooGlow, magical: false,
      symbolism: 'Personal identity mark.',
    };
    set('tattoos', [...(dna.tattoos ?? []), t]);
    setAddTattooName('');
  }
  function removeTattoo(i: number) { set('tattoos', dna.tattoos?.filter((_, idx) => idx !== i) ?? []); }

  function addFaceTattoo() {
    if (!addFaceTattooName.trim()) return;
    const t: TattooProfile = {
      tattooName: addFaceTattooName.trim(),
      bodyLocation: addFaceTattooLoc,
      style: addTattooStyle,
      color: addTattooColor,
      glowing: addTattooGlow,
      magical: false,
      symbolism: 'Facial marking.',
    };
    set('tattoos', [...(dna.tattoos ?? []), t]);
    setAddFaceTattooName('');
  }

  function applyFacialPaint() {
    const p: FacialPaint = {
      paintStyle: addPaintStyle, color: addPaintColor, placement: addPaintPlace,
      emotionalMeaning: 'Warrior spirit.', symmetrical: true,
    };
    set('facialPaints', [...(dna.facialPaints ?? []), p]);
  }
  function removePaint(i: number) { set('facialPaints', dna.facialPaints?.filter((_, idx) => idx !== i) ?? []); }

  // POWERS helpers
  function addWeapon() {
    if (!addWeaponName.trim()) return;
    const w: WeaponProfile = {
      weaponName: addWeaponName.trim(), weaponType: addWeaponType,
      material: addWeaponMat, energyEffect: addWeaponEnergy, signatureWeapon: true,
    };
    set('weapons', [...(dna.weapons ?? []), w]);
    setAddWeaponName('');
  }
  function removeWeapon(i: number) { set('weapons', dna.weapons?.filter((_, idx) => idx !== i) ?? []); }

  function addPowerEntry() {
    if (!addPower.trim()) return;
    set('powers', [...(dna.powers ?? []), addPower.trim()]);
    setAddPower('');
  }
  function removePower(i: number) { set('powers', dna.powers?.filter((_, idx) => idx !== i) ?? []); }

  const canSave = dna.characterName.trim().length > 0;
  const allLocked = dna.lockFace && dna.lockHair && dna.lockTattooPlacement && dna.lockCostume && dna.lockColorPalette && dna.lockWeapons && dna.lockLighting;

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <Pressable style={m.overlay} onPress={onClose}>
        <Pressable style={[m.sheet, { backgroundColor: C.bg }]} onPress={e => e.stopPropagation()}>

          <View style={[m.handle, { backgroundColor: C.gold }]} />

          {/* Header */}
          <View style={m.header}>
            <View style={{ flex: 1 }}>
              <Text style={m.eyebrow}>UNIVERSAL CHARACTER DNA ENGINE · CONSISTENCY SYSTEM</Text>
              <Text style={m.title}>CHARACTER BUILDER</Text>
            </View>
            <TouchableOpacity onPress={onClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Feather name="x" size={20} color={C.muted} />
            </TouchableOpacity>
          </View>

          {/* QUICK FILL bar — Java: CharacterDescriptionInterpreter */}
          <View style={m.quickFillRow}>
            <View style={[m.quickFillWrap, { borderColor: quickFill.length > 0 ? C.gold + '60' : C.border }]}>
              <Feather name="edit-3" size={13} color={C.muted} />
              <TextInput
                style={m.quickFillInput}
                value={quickFill}
                onChangeText={setQuickFill}
                placeholder="Auto-fill from description: 30-year-old warrior with beard, scar..."
                placeholderTextColor={C.muted}
                onSubmitEditing={handleQuickFill}
                returnKeyType="done"
              />
              {quickFill.length > 0 && (
                <TouchableOpacity onPress={() => setQuickFill('')} hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}>
                  <Feather name="x" size={12} color={C.muted} />
                </TouchableOpacity>
              )}
            </View>
            <TouchableOpacity
              style={[m.quickFillBtn, { backgroundColor: quickFill.length > 0 ? C.gold : C.border, opacity: quickFill.length > 0 ? 1 : 0.5 }]}
              onPress={handleQuickFill}
              disabled={quickFill.length === 0}
              activeOpacity={0.85}
            >
              <Text style={[m.quickFillBtnText, { color: quickFill.length > 0 ? C.bg : C.muted }]}>
                {quickFilling ? <Feather name="check" size={13} color={C.bg} /> : 'FILL'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Character name */}
          <View style={m.nameRow}>
            <View style={m.nameInputWrap}>
              <Text style={m.nameLabel}>CHARACTER NAME</Text>
              <TextInput
                style={m.nameInput}
                value={dna.characterName}
                onChangeText={v => set('characterName', v)}
                placeholder="Nyx, Titan, Shadow..."
                placeholderTextColor={C.muted}
                autoCapitalize="words"
              />
            </View>
            <TouchableOpacity
              style={[m.applyBtn, { backgroundColor: canSave ? C.gold : C.border, opacity: canSave ? 1 : 0.5 }]}
              onPress={handleApply}
              disabled={!canSave}
              activeOpacity={0.85}
            >
              <Text style={[m.applyBtnText, { color: canSave ? C.bg : C.muted }]}>APPLY</Text>
            </TouchableOpacity>
          </View>

          {/* Saved characters */}
          {savedNames.length > 0 && (
            <View style={m.savedRow}>
              <Text style={m.savedLabel}>MEMORY</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6 }}>
                {savedNames.map(name => (
                  <View key={name} style={m.savedChipWrap}>
                    <TouchableOpacity
                      style={[m.savedChip, { borderColor: dna.characterName === name ? C.gold : C.border, backgroundColor: dna.characterName === name ? C.gold + '15' : C.card }]}
                      onPress={() => handleLoad(name)}
                      activeOpacity={0.8}
                    >
                      <Text style={[m.savedChipText, { color: dna.characterName === name ? C.gold : C.muted }]}>{name}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={m.deleteBtn}
                      onPress={() => onDelete(name)}
                      hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                    >
                      <Feather name="x" size={9} color={C.muted} />
                    </TouchableOpacity>
                  </View>
                ))}
              </ScrollView>
            </View>
          )}

          {/* AI Character Preview Box */}
          <CharacterPreviewBox
            dna={dna}
            onGenerate={generatePreview}
            imageUri={previewUri}
            loading={previewLoading}
            failed={previewFailed}
          />

          {/* Tab bar */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={m.tabStrip} contentContainerStyle={m.tabStripContent}>
            {TABS.map(t => {
              const active = tab === t.id;
              const hasContent =
                (t.id === 'MARKS'  && ((dna.scars?.length ?? 0) > 0 || (dna.tattoos?.length ?? 0) > 0 || (dna.facialPaints?.length ?? 0) > 0)) ||
                (t.id === 'POWERS' && ((dna.weapons?.length ?? 0) > 0 || (dna.powers?.length ?? 0) > 0)) ||
                (t.id === 'FX'     && !!dna.comicLanguageScene?.artStyleDNA) ||
                (t.id === 'INTEL'  && (!!dna.visualIntelligenceScene?.silhouetteType || !!dna.visualIntelligenceScene?.archetype)) ||
                (t.id === 'PANEL'  && (!!dna.cinematicCompositionScene?.panelLayout || !!dna.cinematicCompositionScene?.cinematicShot)) ||
                (t.id === 'WORLD'  && !!dna.worldSetting) ||
                (t.id === 'LOCK'   && allLocked);
              return (
                <TouchableOpacity
                  key={t.id}
                  style={[m.tabBtn, { borderColor: active ? C.gold : hasContent ? C.gold + '40' : C.border, backgroundColor: active ? C.gold + '12' : 'transparent' }]}
                  onPress={() => setTab(t.id)}
                  activeOpacity={0.8}
                >
                  <Feather name={t.icon} size={13} color={active ? C.gold : hasContent ? C.goldDim : C.muted} />
                  <Text style={[m.tabLabel, { color: active ? C.gold : hasContent ? C.goldDim : C.muted }]}>{t.label}</Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* Tab content */}
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={m.tabContent} keyboardShouldPersistTaps="handled">

            {/* ── FACE ── */}
            {tab === 'FACE' && (
              <>
                {/* Face Shape */}
                <View style={or.wrap}>
                  <Text style={or.label}>FACE SHAPE</Text>
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                    {FACE_SHAPES.map(fs => (
                      <TouchableOpacity
                        key={fs.value}
                        style={[m.styleChip, { borderColor: dna.faceShape === fs.value ? C.gold : C.border, backgroundColor: dna.faceShape === fs.value ? C.gold + '15' : C.card }]}
                        onPress={() => set('faceShape', fs.value)}
                        activeOpacity={0.8}
                      >
                        <Text style={[m.styleChipText, { color: dna.faceShape === fs.value ? C.gold : C.muted }]}>{fs.value}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                  {dna.faceShape && (
                    <Text style={{ color: C.muted, fontSize: 10, marginTop: 4 }}>
                      {FACE_SHAPES.find(f => f.value === dna.faceShape)?.desc}
                    </Text>
                  )}
                </View>

                <OptionRow label="EYE SHAPE"   options={EYE_SHAPES}  value={dna.eyeShape}   onChange={v => set('eyeShape', v)} />
                <OptionRow label="JAW TYPE"    options={JAW_TYPES}   value={dna.jawType}    onChange={v => set('jawType', v)} />
                <OptionRow label="NOSE TYPE"   options={NOSE_TYPES}  value={dna.noseType}   onChange={v => set('noseType', v)} />
                <OptionRow label="MOUTH"       options={MOUTH_TYPES} value={dna.mouthType}  onChange={v => set('mouthType', v)} />
                <OptionRow label="FACIAL SCAR" options={SCAR_TYPES}  value={dna.facialScar} onChange={v => set('facialScar', v)} />

                {/* Quick Scars */}
                <SectionLabel>SCARS · DETAILED ADD</SectionLabel>
                {(dna.scars ?? []).map((s, i) => <FeatureRow key={i} feature={s} onRemove={() => removeScar(i)} />)}
                <View style={m.addRow}>
                  <TextInput
                    style={[m.addInput, { flex: 1 }]}
                    value={addScarDesc}
                    onChangeText={setAddScarDesc}
                    placeholder="e.g. Deep vertical slash, burn scar..."
                    placeholderTextColor={C.muted}
                  />
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 5 }}>
                    {['Left Cheek', 'Right Cheek', 'Brow', 'Chin', 'Neck', 'Chest', 'Forehead', 'Lip'].map(loc => (
                      <Chip key={loc} label={loc} active={addScarLoc === loc} onPress={() => setAddScarLoc(loc)} />
                    ))}
                  </ScrollView>
                  <TouchableOpacity style={m.addBtn} onPress={addScar}>
                    <Feather name="plus" size={14} color={C.bg} />
                  </TouchableOpacity>
                </View>

                {/* Facial Tattoos & Markings */}
                <SectionLabel>FACIAL TATTOOS & MARKINGS</SectionLabel>
                {(dna.tattoos ?? []).filter(t => ['Face', 'Head', 'Neck', 'Forehead', 'Cheek'].includes(t.bodyLocation)).map((t, i) => {
                  const realIdx = (dna.tattoos ?? []).indexOf(t);
                  return <TattooRow key={i} tattoo={t} onRemove={() => removeTattoo(realIdx)} />;
                })}
                <View style={[m.addCard, { borderColor: C.purple + '40' }]}>
                  <TextInput
                    style={m.addInput}
                    value={addFaceTattooName}
                    onChangeText={setAddFaceTattooName}
                    placeholder="e.g. Tribal Mark, Rune Sigil, Clan Tattoo..."
                    placeholderTextColor={C.muted}
                  />
                  <OptionRow label="TATTOO STYLE" options={TATTOO_STYLES} value={addTattooStyle} onChange={setAddTattooStyle} color={C.purple} />
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 10, flexWrap: 'wrap' }}>
                    <Chip label="Glowing" active={addTattooGlow} onPress={() => setAddTattooGlow(g => !g)} color={C.purple} />
                    {['Blue', 'Red', 'Gold', 'Green', 'White', 'Black'].map(col => (
                      <Chip key={col} label={col} active={addTattooColor === col} onPress={() => setAddTattooColor(col)} color={C.purple} />
                    ))}
                  </View>
                  <View style={{ flexDirection: 'row', gap: 6, marginBottom: 6, flexWrap: 'wrap' }}>
                    {(['Face', 'Forehead', 'Cheek', 'Neck', 'Head'] as const).map(loc => (
                      <Chip key={loc} label={loc} active={addFaceTattooLoc === loc} onPress={() => setAddFaceTattooLoc(loc)} color={C.purple} />
                    ))}
                  </View>
                  <TouchableOpacity style={[m.addBtn, { alignSelf: 'flex-end', backgroundColor: C.purple }]} onPress={addFaceTattoo}>
                    <Feather name="plus" size={14} color={C.bg} />
                    <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 10, color: C.bg }}>ADD MARKING</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}

            {/* ── BODY ── */}
            {tab === 'BODY' && (
              <>
                {/* Body Archetype DNA — HorizontalScrollToggle */}
                <View style={or.wrap}>
                  <Text style={or.label}>BODY ARCHETYPE</Text>
                  <Text style={{ color: C.muted, fontSize: 10, marginBottom: 10, lineHeight: 14 }}>
                    AI-linked — choose the silhouette class that defines your character's physical presence.
                  </Text>
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    style={{ marginHorizontal: -20 }}
                    contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 4 }}
                  >
                    {BODY_ARCHETYPE_DNA.map(arch => (
                      <BodyArchetypeCard
                        key={arch.id}
                        arch={arch}
                        selected={dna.bodyArchetype === arch.id}
                        onPress={() => setDna(prev => ({ ...prev, bodyArchetype: arch.id }))}
                      />
                    ))}
                  </ScrollView>
                </View>

                {/* Master Anatomy Style */}
                <View style={or.wrap}>
                  <Text style={or.label}>MASTER ANATOMY STYLE</Text>
                  <Text style={{ color: C.muted, fontSize: 10, marginBottom: 10, lineHeight: 14 }}>
                    Genre-based proportion system — powers AI consistency lock, posing, and rendering.
                  </Text>
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    style={{ marginHorizontal: -20 }}
                    contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 4 }}
                  >
                    {MASTER_ANATOMY_ARCHETYPES.map(arch => (
                      <MasterAnatomyCard
                        key={arch.id}
                        arch={arch}
                        selected={dna.masterAnatomyType === arch.id}
                        onPress={() => setDna(prev => ({ ...prev, masterAnatomyType: arch.id }))}
                      />
                    ))}
                  </ScrollView>
                </View>

                {/* Character Role — Java: CharacterRole enum */}
                <View style={or.wrap}>
                  <Text style={or.label}>CHARACTER ROLE</Text>
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                    {CHARACTER_ROLES.map(r => (
                      <TouchableOpacity
                        key={r.id}
                        style={[m.styleChip, { borderColor: dna.role === r.id ? C.gold : C.border, backgroundColor: dna.role === r.id ? C.gold + '15' : C.card }]}
                        onPress={() => set('role', r.id)}
                        activeOpacity={0.8}
                      >
                        <Feather name={ROLE_ICONS[r.id] ?? 'circle'} size={12} color={dna.role === r.id ? C.gold : C.muted} />
                        <Text style={[m.styleChipText, { color: dna.role === r.id ? C.gold : C.muted }]}>{r.label}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
                {/* Gender — Java: CinematicDescriptionInterpreter.gender */}
                <View style={or.wrap}>
                  <Text style={or.label}>GENDER</Text>
                  <View style={{ flexDirection: 'row', gap: 6 }}>
                    {(['Male', 'Female', 'Non-Binary'] as const).map(g => (
                      <TouchableOpacity
                        key={g}
                        style={[m.styleChip, { borderColor: dna.gender === g ? C.gold : C.border, backgroundColor: dna.gender === g ? C.gold + '15' : C.card }]}
                        onPress={() => {
                          const next: Partial<CharacterDNA> = { gender: g };
                          if (g === 'Male' && !dna.maleAnatomyType)     next.maleAnatomyType   = 'HEROIC_V_TAPER';
                          if (g === 'Female' && !dna.femaleAnatomyType) next.femaleAnatomyType = 'ATHLETIC_HEROINE';
                          setDna(prev => ({ ...prev, ...next }));
                        }}
                        activeOpacity={0.8}
                      >
                        <Feather name={g === 'Male' ? 'user' : g === 'Female' ? 'user' : 'users'} size={13} color={dna.gender === g ? C.gold : C.muted} />
                        <Text style={[m.styleChipText, { color: dna.gender === g ? C.gold : C.muted }]}>{g}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                {/* Anatomy Archetype — Java: MaleAnatomyType / FemaleAnatomyType */}
                {(dna.gender === 'Male' || dna.gender === undefined) && (
                  <View style={or.wrap}>
                    <Text style={or.label}>MALE ANATOMY ARCHETYPE</Text>
                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                      {(Object.entries(MALE_ANATOMY_PROFILES) as [MaleAnatomyType, typeof MALE_ANATOMY_PROFILES[MaleAnatomyType]][]).map(([id, p]) => (
                        <TouchableOpacity
                          key={id}
                          style={[m.styleChip, { borderColor: dna.maleAnatomyType === id ? C.gold : C.border, backgroundColor: dna.maleAnatomyType === id ? C.gold + '15' : C.card, minWidth: 100 }]}
                          onPress={() => setDna(prev => ({ ...prev, maleAnatomyType: id, bodyProportions: p.proportions }))}
                          activeOpacity={0.8}
                        >
                          <Text style={[m.styleChipText, { color: dna.maleAnatomyType === id ? C.gold : C.muted }]}>{p.label}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                    {dna.maleAnatomyType && (
                      <Text style={{ color: C.muted, fontSize: 10, marginTop: 4 }}>
                        {MALE_ANATOMY_PROFILES[dna.maleAnatomyType].desc}
                      </Text>
                    )}
                  </View>
                )}
                {dna.gender === 'Female' && (
                  <View style={or.wrap}>
                    <Text style={or.label}>FEMALE ANATOMY ARCHETYPE</Text>
                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                      {(Object.entries(FEMALE_ANATOMY_PROFILES) as [FemaleAnatomyType, typeof FEMALE_ANATOMY_PROFILES[FemaleAnatomyType]][]).map(([id, p]) => (
                        <TouchableOpacity
                          key={id}
                          style={[m.styleChip, { borderColor: dna.femaleAnatomyType === id ? C.gold : C.border, backgroundColor: dna.femaleAnatomyType === id ? C.gold + '15' : C.card, minWidth: 100 }]}
                          onPress={() => setDna(prev => ({ ...prev, femaleAnatomyType: id, bodyProportions: p.proportions }))}
                          activeOpacity={0.8}
                        >
                          <Text style={[m.styleChipText, { color: dna.femaleAnatomyType === id ? C.gold : C.muted }]}>{p.label}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                    {dna.femaleAnatomyType && (
                      <Text style={{ color: C.muted, fontSize: 10, marginTop: 4 }}>
                        {FEMALE_ANATOMY_PROFILES[dna.femaleAnatomyType].desc}
                      </Text>
                    )}
                  </View>
                )}

                {/* Body Emotion — Java: CinematicBodyLanguageAI */}
                <View style={or.wrap}>
                  <Text style={or.label}>BODY EMOTION</Text>
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                    {(Object.entries(BODY_EMOTION_PROFILES) as [BodyEmotion, typeof BODY_EMOTION_PROFILES[BodyEmotion]][]).map(([id, ep]) => (
                      <TouchableOpacity
                        key={id}
                        style={[m.styleChip, { borderColor: dna.bodyEmotion === id ? C.gold : C.border, backgroundColor: dna.bodyEmotion === id ? C.gold + '15' : C.card }]}
                        onPress={() => set('bodyEmotion', id)}
                        activeOpacity={0.8}
                      >
                        <Text style={[m.styleChipText, { color: dna.bodyEmotion === id ? C.gold : C.muted }]}>{id}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                  {dna.bodyEmotion && (
                    <Text style={{ color: C.muted, fontSize: 10, marginTop: 4 }}>
                      {BODY_EMOTION_PROFILES[dna.bodyEmotion].poseCue}
                    </Text>
                  )}
                </View>

                {/* Pose Style — Java: CharacterAnatomyDNA.poseStyle */}
                <View style={or.wrap}>
                  <Text style={or.label}>POSE STYLE</Text>
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                    {POSE_STYLES.map(ps => (
                      <TouchableOpacity
                        key={ps.id}
                        style={[m.styleChip, { borderColor: dna.poseStyle === ps.id ? C.gold : C.border, backgroundColor: dna.poseStyle === ps.id ? C.gold + '15' : C.card }]}
                        onPress={() => set('poseStyle', ps.id)}
                        activeOpacity={0.8}
                      >
                        <Text style={{ fontSize: 12 }}>{ps.emoji}</Text>
                        <Text style={[m.styleChipText, { color: dna.poseStyle === ps.id ? C.gold : C.muted }]}>{ps.label}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                {/* Muscle Flow — Java: MuscleFlowProfile pre-built instances */}
                <View style={or.wrap}>
                  <Text style={or.label}>MUSCLE FLOW</Text>
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                    {Object.entries(ACTION_MUSCLE_FLOWS).map(([id, mf]) => {
                      const active = dna.muscleFlow?.torsoFlow === mf.torsoFlow;
                      return (
                        <TouchableOpacity
                          key={id}
                          style={[m.styleChip, { borderColor: active ? C.gold : C.border, backgroundColor: active ? C.gold + '15' : C.card }]}
                          onPress={() => set('muscleFlow', { torsoFlow: mf.torsoFlow, spineCurve: mf.spineCurve, tensionDirection: mf.tensionDirection, weightDistribution: mf.weightDistribution, compressionZones: mf.compressionZones, stretchZones: mf.stretchZones })}
                          activeOpacity={0.8}
                        >
                          <Text style={{ fontSize: 12 }}>{mf.emoji}</Text>
                          <Text style={[m.styleChipText, { color: active ? C.gold : C.muted }]}>{mf.label}</Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                  {dna.muscleFlow && (
                    <Text style={{ color: C.muted, fontSize: 10, marginTop: 4 }}>
                      {dna.muscleFlow.torsoFlow} · {dna.muscleFlow.tensionDirection}
                    </Text>
                  )}
                </View>

                <OptionRow label="BODY TYPE"   options={BODY_TYPES} value={dna.bodyType} onChange={v => set('bodyType', v)} />
                <View style={or.wrap}>
                  <Text style={or.label}>MUSCLE MASS — {Math.round(dna.muscleMass * 100)}%</Text>
                  <View style={{ flexDirection: 'row', gap: 6, flexWrap: 'wrap' }}>
                    {[0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0].map(v => (
                      <Chip key={v} label={`${Math.round(v * 100)}%`} active={dna.muscleMass === v} onPress={() => set('muscleMass', v)} />
                    ))}
                  </View>
                </View>
                <View style={or.wrap}>
                  <Text style={or.label}>HEIGHT RATIO — {dna.heightRatio.toFixed(1)}×</Text>
                  <View style={{ flexDirection: 'row', gap: 6, flexWrap: 'wrap' }}>
                    {[0.8, 0.9, 1.0, 1.1, 1.2].map(v => (
                      <Chip key={v} label={`${v.toFixed(1)}×`} active={dna.heightRatio === v} onPress={() => set('heightRatio', v)} />
                    ))}
                  </View>
                </View>
                <View style={or.wrap}>
                  <Text style={or.label}>SHOULDER WIDTH — {Math.round(dna.shoulderWidth * 100)}%</Text>
                  <View style={{ flexDirection: 'row', gap: 6, flexWrap: 'wrap' }}>
                    {[0.5, 0.6, 0.7, 0.8, 0.9, 1.0].map(v => (
                      <Chip key={v} label={`${Math.round(v * 100)}%`} active={dna.shoulderWidth === v} onPress={() => set('shoulderWidth', v)} />
                    ))}
                  </View>
                </View>
              </>
            )}

            {/* ── HAIR ── */}
            {tab === 'HAIR' && (
              <>
                <OptionRow label="HAIR STYLE" options={HAIR_STYLES} value={dna.hairStyle} onChange={v => set('hairStyle', v)} />
                <OptionRow label="HAIR COLOR" options={HAIR_COLORS} value={dna.hairColor} onChange={v => set('hairColor', v)} />
                <View style={or.wrap}>
                  <Text style={or.label}>BEARD STYLE</Text>
                  <View style={{ flexDirection: 'row', gap: 6, flexWrap: 'wrap' }}>
                    {['none', 'Stubble', 'Goatee', 'Full Beard', 'Long Beard', 'Braided Beard'].map(b => (
                      <Chip key={b} label={b} active={(dna.beardStyle ?? 'none') === b} onPress={() => set('beardStyle', b === 'none' ? undefined : b)} />
                    ))}
                  </View>
                </View>
              </>
            )}

            {/* ── COSTUME ── */}
            {tab === 'COSTUME' && (
              <>
                {/* Costume Material DNA */}
                <View style={or.wrap}>
                  <Text style={or.label}>COSTUME MATERIAL DNA</Text>
                  <Text style={{ color: C.muted, fontSize: 10, marginBottom: 10, lineHeight: 14 }}>
                    Multi-select — AI builds fabric lighting, fold physics, and material render quality from these. Tap to add or remove.
                  </Text>
                  {(dna.costumeMaterials ?? []).length > 0 && (
                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 5, marginBottom: 12 }}>
                      {(dna.costumeMaterials ?? []).map(id => {
                        const mat = COSTUME_MATERIAL_DNA.find(m => m.id === id);
                        const col = mat ? (MATERIAL_CATEGORY_COLORS[mat.category] ?? C.gold) : C.gold;
                        return (
                          <TouchableOpacity
                            key={id}
                            style={{ flexDirection: 'row', alignItems: 'center', gap: 4, borderWidth: 1, borderColor: col + '80', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4, backgroundColor: col + '15' }}
                            onPress={() => setDna(prev => ({ ...prev, costumeMaterials: (prev.costumeMaterials ?? []).filter(m => m !== id) }))}
                          >
                            <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 9, color: col, letterSpacing: 0.5 }}>{mat?.displayName ?? id}</Text>
                            <Feather name="x" size={10} color={col} />
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  )}
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    style={{ marginHorizontal: -20 }}
                    contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 4 }}
                  >
                    {COSTUME_MATERIAL_DNA.map(mat => (
                      <MaterialCard
                        key={mat.id}
                        mat={mat}
                        selected={(dna.costumeMaterials ?? []).includes(mat.id)}
                        onPress={() => setDna(prev => {
                          const mats = prev.costumeMaterials ?? [];
                          const exists = mats.includes(mat.id);
                          return { ...prev, costumeMaterials: exists ? mats.filter(m => m !== mat.id) : [...mats, mat.id] };
                        })}
                      />
                    ))}
                  </ScrollView>
                </View>

                {/* Free-text costume description */}
                <View style={or.wrap}>
                  <Text style={or.label}>COSTUME DESCRIPTION</Text>
                  <Text style={{ color: C.muted, fontSize: 10, marginBottom: 8, lineHeight: 14 }}>
                    Describe your costume in your own words — sent directly to the AI image generator.
                  </Text>
                  <TextInput
                    style={[{ borderWidth: 1.5, borderColor: (dna.costumeDescription?.trim()) ? C.gold : C.border, borderRadius: 10, padding: 12, color: '#F5EDD6', fontFamily: 'Inter_400Regular', fontSize: 12, minHeight: 70, textAlignVertical: 'top', backgroundColor: C.card }]}
                    value={dna.costumeDescription ?? ''}
                    onChangeText={v => set('costumeDescription', v)}
                    placeholder="e.g. A dark armored suit with glowing gold runes stitched into the lining and a tattered cloak..."
                    placeholderTextColor={C.muted}
                    multiline
                  />
                </View>

                {/* Structured suit pickers */}
                <OptionRow label="PRIMARY SUIT"   options={SUIT_TYPES}     value={dna.primarySuit}   onChange={v => set('primarySuit', v)} />
                <OptionRow label="SECONDARY SUIT" options={SECONDARY_SUIT} value={dna.secondarySuit} onChange={v => set('secondarySuit', v)} />
                <OptionRow label="CAPE"           options={CAPE_TYPES}     value={dna.capeType}      onChange={v => set('capeType', v)} />
                <OptionRow label="CHEST SYMBOL"   options={SYMBOLS}        value={dna.symbol}        onChange={v => set('symbol', v)} />
              </>
            )}

            {/* ── COLORS ── */}
            {tab === 'COLORS' && (
              <>
                {/* ── Live palette preview banner ── */}
                <View style={col.banner}>
                  <View style={col.bannerSwatch}>
                    <View style={[col.bannerCircle, { backgroundColor: SKIN_TONES.find(s => s.name === dna.skinTone)?.hex ?? '#D4886A' }]} />
                    <Text style={col.bannerLabel}>SKIN</Text>
                  </View>
                  <View style={col.bannerDivider} />
                  <View style={col.bannerSwatch}>
                    <View style={[col.bannerCircle, { backgroundColor: EYE_COLOR_SWATCHES.find(e => e.name === dna.eyeColor)?.hex ?? '#6B3A2A' }]} />
                    <Text style={col.bannerLabel}>EYES</Text>
                  </View>
                  <View style={col.bannerDivider} />
                  <View style={col.bannerSwatch}>
                    <View style={[col.bannerCircle, { backgroundColor: HAIR_COLOR_SWATCHES.find(h => h.name === dna.hairColor)?.hex ?? '#0A0806' }]} />
                    <Text style={col.bannerLabel}>HAIR</Text>
                  </View>
                  <View style={col.bannerDivider} />
                  <View style={col.bannerSwatch}>
                    <View style={[col.bannerCircle, { backgroundColor: dna.primaryColor }]} />
                    <Text style={col.bannerLabel}>SUIT 1</Text>
                  </View>
                  <View style={col.bannerDivider} />
                  <View style={col.bannerSwatch}>
                    <View style={[col.bannerCircle, { backgroundColor: dna.secondaryColor }]} />
                    <Text style={col.bannerLabel}>SUIT 2</Text>
                  </View>
                </View>

                {/* ── Skin Tone ── */}
                <View style={or.wrap}>
                  <Text style={or.label}>SKIN TONE · FLESH</Text>
                  <Text style={[or.label, { color: C.muted, fontSize: 9, letterSpacing: 0.8, marginBottom: 10 }]}>HUMAN RANGE</Text>
                  <SwatchGrid
                    swatches={SKIN_TONES.filter(s => !s.fantasy)}
                    value={dna.skinTone}
                    onChange={v => set('skinTone', v)}
                    size={52}
                  />
                  <Text style={[or.label, { color: C.purple, fontSize: 9, letterSpacing: 0.8, marginTop: 16, marginBottom: 10 }]}>FANTASY · ALIEN · SUPERNATURAL</Text>
                  <SwatchGrid
                    swatches={SKIN_TONES.filter(s => s.fantasy)}
                    value={dna.skinTone}
                    onChange={v => set('skinTone', v)}
                    size={52}
                  />
                </View>

                {/* ── Eye Color ── */}
                <View style={or.wrap}>
                  <Text style={or.label}>EYE COLOR</Text>
                  <SwatchGrid
                    swatches={EYE_COLOR_SWATCHES}
                    value={dna.eyeColor}
                    onChange={v => set('eyeColor', v)}
                    size={44}
                  />
                </View>

                {/* ── Hair Color ── */}
                <View style={or.wrap}>
                  <Text style={or.label}>HAIR COLOR</Text>
                  <SwatchGrid
                    swatches={HAIR_COLOR_SWATCHES}
                    value={dna.hairColor}
                    onChange={v => set('hairColor', v)}
                    size={44}
                  />
                </View>

                {/* ── Costume Colors ── */}
                <View style={[or.wrap, { borderTopWidth: 1, borderTopColor: C.border, paddingTop: 16 }]}>
                  <Text style={or.label}>COSTUME · PRIMARY COLOR</Text>
                  <ColorGrid value={dna.primaryColor} onChange={v => set('primaryColor', v)} />
                </View>
                <View style={[or.wrap, { marginTop: 14 }]}>
                  <Text style={or.label}>COSTUME · SECONDARY COLOR</Text>
                  <ColorGrid value={dna.secondaryColor} onChange={v => set('secondaryColor', v)} />
                </View>
                <View style={m.colorPreview}>
                  <View style={[m.colorSwatchLarge, { backgroundColor: dna.primaryColor }]}>
                    <Text style={m.colorLabel}>PRIMARY</Text>
                  </View>
                  <Feather name="arrow-right" size={14} color={C.muted} />
                  <View style={[m.colorSwatchLarge, { backgroundColor: dna.secondaryColor }]}>
                    <Text style={m.colorLabel}>SECONDARY</Text>
                  </View>
                </View>
              </>
            )}

            {/* ── STYLE ── */}
            {tab === 'STYLE' && (
              <>
                <View style={or.wrap}>
                  <Text style={or.label}>RENDER STYLE DNA</Text>
                  <Text style={{ color: C.muted, fontSize: 10, marginBottom: 10, lineHeight: 14 }}>
                    Can change anytime — does not alter character identity. Sets the visual language of the generated art.
                  </Text>
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    style={{ marginHorizontal: -20 }}
                    contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 4 }}
                  >
                    {RENDER_STYLE_DNA.map(s => (
                      <RenderStyleCard
                        key={s.id}
                        style={s}
                        selected={dna.renderingStyle === s.id}
                        onPress={() => set('renderingStyle', s.id)}
                      />
                    ))}
                  </ScrollView>
                </View>
                {/* Cinematic style — Java: CinematicStyle enum */}
                <View style={or.wrap}>
                  <Text style={or.label}>CINEMATIC STYLE · JAVA: CinematicStyle</Text>
                  {CINEMATIC_STYLES.map(cs => (
                    <TouchableOpacity
                      key={cs.id}
                      style={[m.cinemaRow, { borderColor: dna.cinematicStyleDNA === cs.id ? C.gold : C.border, backgroundColor: dna.cinematicStyleDNA === cs.id ? C.gold + '10' : C.card }]}
                      onPress={() => set('cinematicStyleDNA', cs.id)}
                      activeOpacity={0.85}
                    >
                      <View style={{ flex: 1 }}>
                        <Text style={[m.cinemaLabel, { color: dna.cinematicStyleDNA === cs.id ? C.gold : C.white }]}>{cs.label}</Text>
                        <Text style={m.cinemaDesc}>{cs.desc}</Text>
                      </View>
                      {dna.cinematicStyleDNA === cs.id && <Feather name="check" size={14} color={C.gold} />}
                    </TouchableOpacity>
                  ))}
                </View>
                {/* Motion style */}
                <View style={or.wrap}>
                  <Text style={or.label}>MOTION STYLE</Text>
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                    {['Diagonal Aggressive Motion', 'Rapid Diagonal Motion', 'Heavy Weighted Motion', 'Fluid Circular Motion', 'Static Power Stance'].map(ms => (
                      <Chip key={ms} label={ms} active={(dna.motionStyle ?? '') === ms} onPress={() => set('motionStyle', ms)} />
                    ))}
                  </View>
                </View>
              </>
            )}

            {/* ── MARKS — FacialFeature, TattooProfile, FacialPaint (Java ports) ── */}
            {tab === 'MARKS' && (
              <>
                {/* Scars */}
                <SectionLabel>SCARS · Java: FacialFeature</SectionLabel>
                {(dna.scars ?? []).map((s, i) => <FeatureRow key={i} feature={s} onRemove={() => removeScar(i)} />)}
                <View style={m.addRow}>
                  <TextInput
                    style={[m.addInput, { flex: 1 }]}
                    value={addScarDesc}
                    onChangeText={setAddScarDesc}
                    placeholder="Scar description..."
                    placeholderTextColor={C.muted}
                  />
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 5 }}>
                    {['Left Cheek', 'Right Cheek', 'Brow', 'Chin', 'Neck', 'Chest'].map(loc => (
                      <Chip key={loc} label={loc} active={addScarLoc === loc} onPress={() => setAddScarLoc(loc)} />
                    ))}
                  </ScrollView>
                  <TouchableOpacity style={m.addBtn} onPress={addScar}>
                    <Feather name="plus" size={14} color={C.bg} />
                  </TouchableOpacity>
                </View>

                {/* Birthmarks */}
                <SectionLabel>BIRTHMARKS · Java: FacialFeature</SectionLabel>
                {(dna.birthmarks ?? []).map((b, i) => <FeatureRow key={i} feature={b} onRemove={() => removeBirthmark(i)} />)}
                <View style={m.addRow}>
                  <TextInput
                    style={[m.addInput, { flex: 1 }]}
                    value={addBirthDesc}
                    onChangeText={setAddBirthDesc}
                    placeholder="Birthmark description..."
                    placeholderTextColor={C.muted}
                  />
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 5 }}>
                    {['Neck', 'Cheek', 'Shoulder', 'Hand', 'Back'].map(loc => (
                      <Chip key={loc} label={loc} active={addBirthLoc === loc} onPress={() => setAddBirthLoc(loc)} />
                    ))}
                  </ScrollView>
                  <TouchableOpacity style={m.addBtn} onPress={addBirthmark}>
                    <Feather name="plus" size={14} color={C.bg} />
                  </TouchableOpacity>
                </View>

                {/* Tattoos */}
                <SectionLabel>TATTOOS · Java: TattooProfile</SectionLabel>
                {(dna.tattoos ?? []).map((t, i) => <TattooRow key={i} tattoo={t} onRemove={() => removeTattoo(i)} />)}
                <View style={[m.addCard, { borderColor: C.purple + '40' }]}>
                  <TextInput
                    style={m.addInput}
                    value={addTattooName}
                    onChangeText={setAddTattooName}
                    placeholder="Tattoo name (e.g. Rune Tattoo)..."
                    placeholderTextColor={C.muted}
                  />
                  <OptionRow label="BODY LOCATION" options={BODY_LOCATIONS} value={addTattooLoc} onChange={setAddTattooLoc} color={C.purple} />
                  <OptionRow label="STYLE"         options={TATTOO_STYLES}  value={addTattooStyle} onChange={setAddTattooStyle} color={C.purple} />
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                    <Chip label="Glowing" active={addTattooGlow} onPress={() => setAddTattooGlow(g => !g)} color={C.purple} />
                    {['Blue', 'Red', 'Gold', 'Green', 'White', 'Black'].map(col => (
                      <Chip key={col} label={col} active={addTattooColor === col} onPress={() => setAddTattooColor(col)} color={C.purple} />
                    ))}
                  </View>
                  <TouchableOpacity style={[m.addBtn, { alignSelf: 'flex-end', backgroundColor: C.purple }]} onPress={addTattoo}>
                    <Feather name="plus" size={14} color={C.bg} />
                    <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 10, color: C.bg }}>ADD TATTOO</Text>
                  </TouchableOpacity>
                </View>

                {/* Facial Paint */}
                <SectionLabel>FACIAL PAINT · Java: FacialPaint</SectionLabel>
                {(dna.facialPaints ?? []).map((p, i) => (
                  <View key={i} style={[fr.row, { borderColor: C.red + '40' }]}>
                    <View style={{ flex: 1 }}>
                      <Text style={[fr.name, { color: C.red }]}>{p.paintStyle}</Text>
                      <Text style={fr.detail}>{p.color} · {p.placement}</Text>
                    </View>
                    <TouchableOpacity onPress={() => removePaint(i)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                      <Feather name="x" size={13} color={C.muted} />
                    </TouchableOpacity>
                  </View>
                ))}
                <View style={m.addCard}>
                  <OptionRow label="STYLE"     options={PAINT_STYLES}     value={addPaintStyle} onChange={setAddPaintStyle} color={C.red} />
                  <OptionRow label="PLACEMENT" options={PAINT_PLACEMENTS} value={addPaintPlace} onChange={setAddPaintPlace} color={C.red} />
                  <View style={{ flexDirection: 'row', gap: 6, marginBottom: 10, flexWrap: 'wrap' }}>
                    {['Red', 'Black', 'White', 'Blue', 'Gold', 'Green'].map(col => (
                      <Chip key={col} label={col} active={addPaintColor === col} onPress={() => setAddPaintColor(col)} color={C.red} />
                    ))}
                  </View>
                  <TouchableOpacity style={[m.addBtn, { alignSelf: 'flex-end', backgroundColor: C.red }]} onPress={applyFacialPaint}>
                    <Feather name="plus" size={14} color={C.bg} />
                    <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 10, color: C.bg }}>ADD PAINT</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}

            {/* ── POWERS — WeaponProfile, powers[], energyEffects[] ── */}
            {tab === 'POWERS' && (
              <>
                {/* Signature Weapons — Java: WeaponProfile */}
                <SectionLabel>SIGNATURE WEAPONS · Java: WeaponProfile</SectionLabel>
                {(dna.weapons ?? []).map((w, i) => <WeaponRow key={i} weapon={w} onRemove={() => removeWeapon(i)} />)}
                <View style={[m.addCard, { borderColor: '#FF6A0040' }]}>
                  <TextInput
                    style={m.addInput}
                    value={addWeaponName}
                    onChangeText={setAddWeaponName}
                    placeholder="Weapon name (e.g. Storm Staff)..."
                    placeholderTextColor={C.muted}
                  />
                  <OptionRow label="TYPE"          options={WEAPON_TYPES}    value={addWeaponType}   onChange={setAddWeaponType}   color="#FF6A00" />
                  <OptionRow label="MATERIAL"      options={WEAPON_MATERIALS} value={addWeaponMat}    onChange={setAddWeaponMat}    color="#FF6A00" />
                  <OptionRow label="ENERGY EFFECT" options={ENERGY_EFFECTS}  value={addWeaponEnergy} onChange={setAddWeaponEnergy} color="#FF6A00" />
                  <TouchableOpacity style={[m.addBtn, { alignSelf: 'flex-end', backgroundColor: '#FF6A00' }]} onPress={addWeapon}>
                    <Feather name="plus" size={14} color={C.bg} />
                    <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 10, color: C.bg }}>ADD WEAPON</Text>
                  </TouchableOpacity>
                </View>

                {/* Powers */}
                <SectionLabel>POWERS</SectionLabel>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 10 }}>
                  {(dna.powers ?? []).map((p, i) => (
                    <TouchableOpacity
                      key={i}
                      style={[ch.chip, { borderColor: '#67E8F9' + '60', backgroundColor: '#67E8F908', flexDirection: 'row', gap: 4 }]}
                      onPress={() => removePower(i)}
                    >
                      <Text style={[ch.label, { color: '#67E8F9' }]}>{p}</Text>
                      <Feather name="x" size={9} color="#67E8F9" />
                    </TouchableOpacity>
                  ))}
                </View>
                <View style={m.addRow}>
                  <TextInput
                    style={[m.addInput, { flex: 1 }]}
                    value={addPower}
                    onChangeText={setAddPower}
                    placeholder="Power name..."
                    placeholderTextColor={C.muted}
                    onSubmitEditing={addPowerEntry}
                    returnKeyType="done"
                  />
                  <TouchableOpacity style={[m.addBtn, { backgroundColor: '#67E8F9' }]} onPress={addPowerEntry}>
                    <Feather name="plus" size={14} color={C.bg} />
                  </TouchableOpacity>
                </View>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 10, marginTop: 6 }}>
                  {['Lightning Control', 'Pyrokinesis', 'Super Strength', 'Telepathy', 'Flight', 'Shadow Manipulation', 'Cryokinesis', 'Invisibility', 'Healing Factor', 'Time Manipulation'].map(p => (
                    <Chip key={p} label={p} active={(dna.powers ?? []).includes(p)} color="#67E8F9"
                      onPress={() => {
                        const curr = dna.powers ?? [];
                        set('powers', curr.includes(p) ? curr.filter(x => x !== p) : [...curr, p]);
                      }}
                    />
                  ))}
                </View>

                {/* Energy Effects */}
                <SectionLabel>ENERGY EFFECTS</SectionLabel>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                  {ENERGY_EFFECTS.filter(e => e !== 'none').map(e => (
                    <Chip key={e} label={e} active={(dna.energyEffects ?? []).includes(e)} color="#FDE68A"
                      onPress={() => {
                        const curr = dna.energyEffects ?? [];
                        set('energyEffects', curr.includes(e) ? curr.filter(x => x !== e) : [...curr, e]);
                      }}
                    />
                  ))}
                </View>
              </>
            )}

            {/* ── LOCK — ConsistencyEngine (Java port) ── */}
            {/* ── FX — Stylized Comic Language Engine ── */}
            {tab === 'FX' && (() => {
              const cls = dna.comicLanguageScene ?? {};
              const setCLS = (patch: Partial<ComicLanguageScene>) =>
                setDna(prev => ({ ...prev, comicLanguageScene: { ...(prev.comicLanguageScene ?? {}), ...patch } }));
              return (
                <>
                  {/* Impact Level */}
                  <View style={or.wrap}>
                    <Text style={or.label}>IMPACT LEVEL</Text>
                    <View style={{ flexDirection: 'row', gap: 7 }}>
                      {(['lightImpact', 'mediumImpact', 'heavyImpact', 'cosmicImpact'] as const).map(lvl => {
                        const col = COMIC_IMPACT_COLORS[lvl];
                        const active = cls.impactLevel === lvl;
                        return (
                          <TouchableOpacity key={lvl} activeOpacity={0.8}
                            style={[wt.envBtn, { borderColor: active ? col : C.border, backgroundColor: active ? col + '18' : C.card, flex: 1 }]}
                            onPress={() => setCLS({ impactLevel: active ? undefined : lvl })}
                          >
                            <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 7, color: active ? col : C.muted, letterSpacing: 0.8, textAlign: 'center' }}>{COMIC_IMPACT_LABELS[lvl]}</Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                    {cls.impactLevel && (
                      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
                        {COMIC_IMPACT_FX[cls.impactLevel].map(fx => (
                          <View key={fx} style={[wt.symbolChip, { borderColor: COMIC_IMPACT_COLORS[cls.impactLevel!] + '50' }]}>
                            <Text style={[wt.symbolVal, { color: COMIC_IMPACT_COLORS[cls.impactLevel!] }]}>{fx}</Text>
                          </View>
                        ))}
                      </View>
                    )}
                  </View>

                  {/* Damage Effects */}
                  <View style={or.wrap}>
                    <Text style={or.label}>DAMAGE LANGUAGE</Text>
                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 7 }}>
                      {COMIC_DAMAGE_EFFECTS.map(fx => {
                        const active = (cls.damageEffects ?? []).includes(fx);
                        return (
                          <Chip key={fx} label={fx} active={active} color={C.goldDim}
                            onPress={() => {
                              const cur = cls.damageEffects ?? [];
                              setCLS({ damageEffects: active ? cur.filter(v => v !== fx) : [...cur, fx] });
                            }} />
                        );
                      })}
                    </View>
                  </View>

                  {/* Stylized Alternatives */}
                  <View style={or.wrap}>
                    <Text style={or.label}>STYLIZED IMPACT ALTERNATIVES</Text>
                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 7 }}>
                      {COMIC_STYLIZED_BLOOD_ALTERNATIVES.map(fx => {
                        const active = (cls.damageEffects ?? []).includes(fx);
                        return (
                          <Chip key={fx} label={fx} active={active} color={C.muted}
                            onPress={() => {
                              const cur = cls.damageEffects ?? [];
                              setCLS({ damageEffects: active ? cur.filter(v => v !== fx) : [...cur, fx] });
                            }} />
                        );
                      })}
                    </View>
                  </View>

                  {/* Speed FX */}
                  <View style={or.wrap}>
                    <Text style={or.label}>SPEED FX</Text>
                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 7 }}>
                      {COMIC_SPEED_FX_ALL.map(fx => {
                        const active = (cls.speedFX ?? []).includes(fx);
                        return (
                          <Chip key={fx} label={fx} active={active} color='#22C55E'
                            onPress={() => {
                              const cur = cls.speedFX ?? [];
                              setCLS({ speedFX: active ? cur.filter(v => v !== fx) : [...cur, fx] });
                            }} />
                        );
                      })}
                    </View>
                  </View>

                  {/* Power FX Category */}
                  <View style={or.wrap}>
                    <Text style={or.label}>POWER FX</Text>
                    <View style={{ flexDirection: 'row', gap: 7, marginBottom: 8 }}>
                      {(['cosmic', 'mystical', 'darkEnergy', 'elemental'] as const).map(cat => {
                        const col = COMIC_POWER_COLORS[cat];
                        const active = cls.powerFXCategory === cat;
                        return (
                          <TouchableOpacity key={cat} activeOpacity={0.8}
                            style={[wt.envBtn, { borderColor: active ? col : C.border, backgroundColor: active ? col + '18' : C.card, flex: 1 }]}
                            onPress={() => setCLS({ powerFXCategory: active ? undefined : cat, powerFXEffects: [] })}
                          >
                            <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 7, color: active ? col : C.muted, letterSpacing: 0.6, textAlign: 'center' }}>{cat.replace('darkEnergy', 'DARK').toUpperCase()}</Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                    {cls.powerFXCategory && (
                      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 7 }}>
                        {COMIC_POWER_FX[cls.powerFXCategory].map(fx => {
                          const active = (cls.powerFXEffects ?? []).includes(fx);
                          return (
                            <Chip key={fx} label={fx} active={active} color={COMIC_POWER_COLORS[cls.powerFXCategory!]}
                              onPress={() => {
                                const cur = cls.powerFXEffects ?? [];
                                setCLS({ powerFXEffects: active ? cur.filter(v => v !== fx) : [...cur, fx] });
                              }} />
                          );
                        })}
                      </View>
                    )}
                  </View>

                  {/* Panel Mood */}
                  <View style={or.wrap}>
                    <Text style={or.label}>PANEL LANGUAGE</Text>
                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 7, marginBottom: 8 }}>
                      {(['heroicReveal', 'emotionalIsolation', 'intimidation', 'finalBattle'] as const).map(mood => {
                        const col = COMIC_PANEL_MOOD_COLORS[mood];
                        const active = cls.panelMood === mood;
                        return (
                          <TouchableOpacity key={mood} activeOpacity={0.8}
                            style={[wt.envBtn, { borderColor: active ? col : C.border, backgroundColor: active ? col + '18' : C.card, paddingHorizontal: 12 }]}
                            onPress={() => setCLS({ panelMood: active ? undefined : mood })}
                          >
                            <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 7, color: active ? col : C.muted, letterSpacing: 0.7, textAlign: 'center' }}>{COMIC_PANEL_MOOD_LABELS[mood]}</Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                    {cls.panelMood && (
                      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                        {COMIC_PANEL_MOODS[cls.panelMood].map(fx => (
                          <View key={fx} style={[wt.symbolChip, { borderColor: COMIC_PANEL_MOOD_COLORS[cls.panelMood!] + '50' }]}>
                            <Text style={[wt.symbolVal, { color: COMIC_PANEL_MOOD_COLORS[cls.panelMood!] }]}>{fx}</Text>
                          </View>
                        ))}
                      </View>
                    )}
                  </View>

                  {/* Shadow Language */}
                  <View style={or.wrap}>
                    <Text style={or.label}>SHADOW LANGUAGE</Text>
                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 7 }}>
                      {COMIC_SHADOW_STYLES.map(s => (
                        <Chip key={s} label={s} active={cls.shadowStyle === s} color='#C4913A'
                          onPress={() => setCLS({ shadowStyle: cls.shadowStyle === s ? undefined : s })} />
                      ))}
                    </View>
                  </View>

                  {/* Emotional State */}
                  <View style={or.wrap}>
                    <Text style={or.label}>EMOTIONAL FX</Text>
                    <View style={{ flexDirection: 'row', gap: 9, marginBottom: 8 }}>
                      {(['rage', 'sorrow', 'fear'] as const).map(emo => {
                        const col = COMIC_EMOTIONAL_COLORS[emo];
                        const active = cls.emotionalState === emo;
                        return (
                          <TouchableOpacity key={emo} activeOpacity={0.8}
                            style={[wt.envBtn, { borderColor: active ? col : C.border, backgroundColor: active ? col + '18' : C.card, flex: 1 }]}
                            onPress={() => setCLS({ emotionalState: active ? undefined : emo })}
                          >
                            <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 10, color: active ? col : C.muted, textAlign: 'center' }}>{emo.toUpperCase()}</Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                    {cls.emotionalState && (
                      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                        {COMIC_EMOTIONAL_FX[cls.emotionalState].map(fx => (
                          <View key={fx} style={[wt.symbolChip, { borderColor: COMIC_EMOTIONAL_COLORS[cls.emotionalState!] + '50' }]}>
                            <Text style={[wt.symbolVal, { color: COMIC_EMOTIONAL_COLORS[cls.emotionalState!] }]}>{fx}</Text>
                          </View>
                        ))}
                      </View>
                    )}
                  </View>

                  {/* Art Style DNA */}
                  <View style={or.wrap}>
                    <Text style={or.label}>ART STYLE DNA</Text>
                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 7, marginBottom: 8 }}>
                      {(['bronzeAge', 'modernCinematic', 'mangaHybrid', 'darkFantasy'] as const).map(style => {
                        const active = cls.artStyleDNA === style;
                        return (
                          <TouchableOpacity key={style} activeOpacity={0.8}
                            style={[wt.envBtn, { borderColor: active ? C.gold : C.border, backgroundColor: active ? C.gold + '12' : C.card, paddingHorizontal: 12 }]}
                            onPress={() => setCLS({ artStyleDNA: active ? undefined : style })}
                          >
                            <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 8, color: active ? C.gold : C.muted, letterSpacing: 0.7 }}>{COMIC_ART_STYLE_LABELS[style]}</Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                    {cls.artStyleDNA && (
                      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                        {COMIC_ART_STYLE_DNA[cls.artStyleDNA].map(trait => (
                          <View key={trait} style={[wt.symbolChip, { borderColor: C.gold + '40' }]}>
                            <Text style={[wt.symbolVal, { color: C.goldDim }]}>{trait}</Text>
                          </View>
                        ))}
                      </View>
                    )}
                  </View>

                  {/* Sound FX Reference */}
                  <View style={or.wrap}>
                    <Text style={or.label}>SOUND FX REFERENCE</Text>
                    {(['impacts', 'blades', 'energy'] as const).map(cat => (
                      <View key={cat} style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                        <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 7, color: C.muted, letterSpacing: 1, width: 44 }}>{cat.toUpperCase()}</Text>
                        <View style={{ flexDirection: 'row', gap: 6 }}>
                          {COMIC_SOUND_FX[cat].map(sfx => (
                            <View key={sfx} style={[wt.symbolChip, { borderColor: C.red + '50' }]}>
                              <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 9, color: C.red, letterSpacing: 1 }}>{sfx}</Text>
                            </View>
                          ))}
                        </View>
                      </View>
                    ))}
                  </View>

                  {/* Cinematic Additions strip */}
                  <View style={or.wrap}>
                    <Text style={or.label}>ALWAYS APPLIED — CINEMATIC LANGUAGE</Text>
                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 5 }}>
                      {COMIC_CINEMATIC_ADDITIONS.map(add => (
                        <View key={add} style={[wt.symbolChip, { borderColor: C.purple + '40' }]}>
                          <Text style={[wt.symbolVal, { color: C.purple }]}>{add}</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                </>
              );
            })()}

            {/* ── INTEL — Character Visual Intelligence Engine ── */}
            {tab === 'INTEL' && (() => {
              const vi = dna.visualIntelligenceScene ?? {};
              const setVI = (patch: Partial<VisualIntelligenceScene>) =>
                setDna(prev => ({ ...prev, visualIntelligenceScene: { ...(prev.visualIntelligenceScene ?? {}), ...patch } }));
              return (
                <>
                  {/* Silhouette System */}
                  <View style={or.wrap}>
                    <Text style={or.label}>SILHOUETTE SYSTEM</Text>
                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 7, marginBottom: 8 }}>
                      {(['heroic', 'speedster', 'tank', 'assassin', 'cosmicEntity'] as const).map(sil => {
                        const col = VI_SILHOUETTE_COLORS[sil];
                        const active = vi.silhouetteType === sil;
                        return (
                          <TouchableOpacity key={sil} activeOpacity={0.8}
                            style={[wt.envBtn, { borderColor: active ? col : C.border, backgroundColor: active ? col + '18' : C.card, paddingHorizontal: 12 }]}
                            onPress={() => setVI({ silhouetteType: active ? undefined : sil })}
                          >
                            <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 8, color: active ? col : C.muted, letterSpacing: 0.8 }}>{VI_SILHOUETTE_LABELS[sil]}</Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                    {vi.silhouetteType && (
                      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                        {VI_SILHOUETTE_TRAITS[vi.silhouetteType].map(t => (
                          <View key={t} style={[wt.symbolChip, { borderColor: VI_SILHOUETTE_COLORS[vi.silhouetteType!] + '50' }]}>
                            <Text style={[wt.symbolVal, { color: VI_SILHOUETTE_COLORS[vi.silhouetteType!] }]}>{t}</Text>
                          </View>
                        ))}
                      </View>
                    )}
                  </View>

                  {/* Anatomy System */}
                  <View style={or.wrap}>
                    <Text style={or.label}>HEROIC ANATOMY</Text>
                    <View style={{ flexDirection: 'row', gap: 8, marginBottom: 8 }}>
                      {(['male', 'female'] as const).map(g => {
                        const active = vi.anatomyGender === g;
                        return (
                          <TouchableOpacity key={g} activeOpacity={0.8}
                            style={[wt.envBtn, { borderColor: active ? C.gold : C.border, backgroundColor: active ? C.gold + '12' : C.card, flex: 1 }]}
                            onPress={() => setVI({ anatomyGender: active ? undefined : g, anatomyBuild: undefined })}
                          >
                            <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 9, color: active ? C.gold : C.muted, letterSpacing: 1, textAlign: 'center' }}>{g.toUpperCase()}</Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                    {vi.anatomyGender && (
                      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 7 }}>
                        {Object.keys(VI_ANATOMY_BUILDS[vi.anatomyGender]).map(build => {
                          const active = vi.anatomyBuild === build;
                          const traits = VI_ANATOMY_BUILDS[vi.anatomyGender!][build];
                          return (
                            <TouchableOpacity key={build} activeOpacity={0.8}
                              style={[wt.envBtn, { borderColor: active ? C.goldDim : C.border, backgroundColor: active ? C.goldDim + '18' : C.card, paddingHorizontal: 12 }]}
                              onPress={() => setVI({ anatomyBuild: active ? undefined : build })}
                            >
                              <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 8, color: active ? C.goldDim : C.muted, letterSpacing: 0.7 }}>{VI_BUILD_LABELS[build]}</Text>
                            </TouchableOpacity>
                          );
                        })}
                      </View>
                    )}
                    {vi.anatomyGender && vi.anatomyBuild && VI_ANATOMY_BUILDS[vi.anatomyGender][vi.anatomyBuild] && (
                      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
                        {VI_ANATOMY_BUILDS[vi.anatomyGender][vi.anatomyBuild].map(t => (
                          <View key={t} style={[wt.symbolChip, { borderColor: C.goldDim + '40' }]}>
                            <Text style={[wt.symbolVal, { color: C.goldDim }]}>{t}</Text>
                          </View>
                        ))}
                      </View>
                    )}
                  </View>

                  {/* Posture Psychology */}
                  <View style={or.wrap}>
                    <Text style={or.label}>POSTURE PSYCHOLOGY</Text>
                    <View style={{ flexDirection: 'row', gap: 8, marginBottom: 8 }}>
                      {(['hero', 'villain', 'brokenCharacter', 'berserker'] as const).map(p => {
                        const col = VI_POSTURE_COLORS[p];
                        const active = vi.posturePsychology === p;
                        return (
                          <TouchableOpacity key={p} activeOpacity={0.8}
                            style={[wt.envBtn, { borderColor: active ? col : C.border, backgroundColor: active ? col + '18' : C.card, flex: 1 }]}
                            onPress={() => setVI({ posturePsychology: active ? undefined : p })}
                          >
                            <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 7, color: active ? col : C.muted, letterSpacing: 0.7, textAlign: 'center' }}>{VI_POSTURE_LABELS[p]}</Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                    {vi.posturePsychology && (
                      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                        {VI_POSTURE_TRAITS[vi.posturePsychology].map(t => (
                          <View key={t} style={[wt.symbolChip, { borderColor: VI_POSTURE_COLORS[vi.posturePsychology!] + '50' }]}>
                            <Text style={[wt.symbolVal, { color: VI_POSTURE_COLORS[vi.posturePsychology!] }]}>{t}</Text>
                          </View>
                        ))}
                      </View>
                    )}
                  </View>

                  {/* Costume Identity */}
                  <View style={or.wrap}>
                    <Text style={or.label}>COSTUME IDENTITY</Text>
                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 7, marginBottom: 8 }}>
                      {(['heroic', 'darkKnight', 'cosmic', 'feudalJapan'] as const).map(ci => {
                        const col = VI_COSTUME_COLORS[ci];
                        const active = vi.costumeIdentity === ci;
                        return (
                          <TouchableOpacity key={ci} activeOpacity={0.8}
                            style={[wt.envBtn, { borderColor: active ? col : C.border, backgroundColor: active ? col + '18' : C.card, paddingHorizontal: 12 }]}
                            onPress={() => setVI({ costumeIdentity: active ? undefined : ci })}
                          >
                            <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 8, color: active ? col : C.muted, letterSpacing: 0.7 }}>{VI_COSTUME_LABELS[ci]}</Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                    {vi.costumeIdentity && (
                      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                        {VI_COSTUME_IDENTITY[vi.costumeIdentity].map(t => (
                          <View key={t} style={[wt.symbolChip, { borderColor: VI_COSTUME_COLORS[vi.costumeIdentity!] + '50' }]}>
                            <Text style={[wt.symbolVal, { color: VI_COSTUME_COLORS[vi.costumeIdentity!] }]}>{t}</Text>
                          </View>
                        ))}
                      </View>
                    )}
                  </View>

                  {/* Emotional Presence */}
                  <View style={or.wrap}>
                    <Text style={or.label}>EMOTIONAL PRESENCE</Text>
                    <View style={{ flexDirection: 'row', gap: 7, marginBottom: 8 }}>
                      {(['rage', 'sorrow', 'intimidation', 'determination'] as const).map(e => {
                        const col = VI_EMOTIONAL_COLORS[e];
                        const active = vi.emotionalPresence === e;
                        return (
                          <TouchableOpacity key={e} activeOpacity={0.8}
                            style={[wt.envBtn, { borderColor: active ? col : C.border, backgroundColor: active ? col + '18' : C.card, flex: 1 }]}
                            onPress={() => setVI({ emotionalPresence: active ? undefined : e })}
                          >
                            <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 7, color: active ? col : C.muted, letterSpacing: 0.6, textAlign: 'center' }}>{e.toUpperCase()}</Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                    {vi.emotionalPresence && (
                      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                        {VI_EMOTIONAL_TRAITS[vi.emotionalPresence].map(t => (
                          <View key={t} style={[wt.symbolChip, { borderColor: VI_EMOTIONAL_COLORS[vi.emotionalPresence!] + '50' }]}>
                            <Text style={[wt.symbolVal, { color: VI_EMOTIONAL_COLORS[vi.emotionalPresence!] }]}>{t}</Text>
                          </View>
                        ))}
                      </View>
                    )}
                  </View>

                  {/* Archetype Recognition */}
                  <View style={or.wrap}>
                    <Text style={or.label}>ARCHETYPE RECOGNITION</Text>
                    <View style={{ gap: 7 }}>
                      {(['titanHero', 'rogueAssassin', 'cosmicEmperor', 'demonHunter', 'shadowVigilante'] as const).map(arch => {
                        const col = VI_ARCHETYPE_COLORS[arch];
                        const active = vi.archetype === arch;
                        const data = VI_ARCHETYPES[arch];
                        return (
                          <TouchableOpacity key={arch} activeOpacity={0.8}
                            style={{ borderWidth: 1.5, borderRadius: 12, borderColor: active ? col : C.border, backgroundColor: active ? col + '0C' : C.card, padding: 12, gap: 6 }}
                            onPress={() => setVI({ archetype: active ? undefined : arch })}
                          >
                            <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 10, color: active ? col : '#F5EDD6', letterSpacing: 0.5 }}>{VI_ARCHETYPE_LABELS[arch]}</Text>
                            <View style={{ flexDirection: 'row', gap: 6, flexWrap: 'wrap' }}>
                              <View style={[wt.symbolChip, { borderColor: col + '40' }]}>
                                <Text style={wt.symbolKey}>SILHOUETTE</Text>
                                <Text style={[wt.symbolVal, { color: col }]}>{data.silhouette}</Text>
                              </View>
                              <View style={[wt.symbolChip, { borderColor: col + '40' }]}>
                                <Text style={wt.symbolKey}>POSTURE</Text>
                                <Text style={[wt.symbolVal, { color: col }]}>{data.posture}</Text>
                              </View>
                              <View style={[wt.symbolChip, { borderColor: col + '40' }]}>
                                <Text style={wt.symbolKey}>LIGHTING</Text>
                                <Text style={[wt.symbolVal, { color: col }]}>{data.lighting}</Text>
                              </View>
                            </View>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  </View>

                  {/* Cinematic Framing */}
                  <View style={or.wrap}>
                    <Text style={or.label}>CINEMATIC FRAMING</Text>
                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 7 }}>
                      {VI_CINEMATIC_FRAMINGS.map(f => (
                        <Chip key={f} label={f} active={vi.cinematicFraming === f} color={C.purple}
                          onPress={() => setVI({ cinematicFraming: vi.cinematicFraming === f ? undefined : f })} />
                      ))}
                    </View>
                  </View>

                  {/* Visual Hierarchy + Readability — reference strips */}
                  <View style={or.wrap}>
                    <Text style={or.label}>VISUAL HIERARCHY — DOMINANCE TOOLS</Text>
                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                      {VI_DOMINANCE_TOOLS.map(t => (
                        <View key={t} style={[wt.symbolChip, { borderColor: C.gold + '30' }]}>
                          <Text style={[wt.symbolVal, { color: C.goldDim }]}>{t}</Text>
                        </View>
                      ))}
                    </View>
                  </View>

                  <View style={or.wrap}>
                    <Text style={or.label}>ACTION READABILITY — AUTO APPLIED</Text>
                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                      {VI_ACTION_READABILITY.map(t => (
                        <View key={t} style={[wt.symbolChip, { borderColor: C.green + '30' }]}>
                          <Text style={[wt.symbolVal, { color: '#22C55E' }]}>{t}</Text>
                        </View>
                      ))}
                    </View>
                  </View>

                  <View style={or.wrap}>
                    <Text style={or.label}>SHADOW LANGUAGE — AUTO APPLIED</Text>
                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                      {VI_SHADOW_LANGUAGE.map(t => (
                        <View key={t} style={[wt.symbolChip, { borderColor: C.muted + '30' }]}>
                          <Text style={[wt.symbolVal, { color: C.muted }]}>{t}</Text>
                        </View>
                      ))}
                    </View>
                  </View>

                  <View style={or.wrap}>
                    <Text style={or.label}>CINEMATIC EXPANSION — ALWAYS APPLIED</Text>
                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 5 }}>
                      {VI_CINEMATIC_EXPANSION.map(t => (
                        <View key={t} style={[wt.symbolChip, { borderColor: C.purple + '40' }]}>
                          <Text style={[wt.symbolVal, { color: C.purple }]}>{t}</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                </>
              );
            })()}

            {/* ── PANEL — Cinematic Composition Engine ── */}
            {tab === 'PANEL' && (() => {
              const cc = dna.cinematicCompositionScene ?? {};
              const setCC = (patch: Partial<CinematicCompositionScene>) =>
                setDna(prev => ({ ...prev, cinematicCompositionScene: { ...(prev.cinematicCompositionScene ?? {}), ...patch } }));
              return (
                <>
                  {/* Panel Layout */}
                  <View style={or.wrap}>
                    <Text style={or.label}>PANEL LAYOUT</Text>
                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 7, marginBottom: 8 }}>
                      {(['standardGrid', 'diagonalPanels', 'verticalPanels', 'widescreenPanels', 'splashPages'] as const).map(layout => {
                        const col = CC_PANEL_COLORS[layout];
                        const active = cc.panelLayout === layout;
                        return (
                          <TouchableOpacity key={layout} activeOpacity={0.8}
                            style={[wt.envBtn, { borderColor: active ? col : C.border, backgroundColor: active ? col + '18' : C.card, paddingHorizontal: 12 }]}
                            onPress={() => setCC({ panelLayout: active ? undefined : layout })}
                          >
                            <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 7, color: active ? col : C.muted, letterSpacing: 0.7 }}>{CC_PANEL_LABELS[layout]}</Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                    {cc.panelLayout && (
                      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                        {CC_PANEL_LAYOUTS[cc.panelLayout].map(p => (
                          <View key={p} style={[wt.symbolChip, { borderColor: CC_PANEL_COLORS[cc.panelLayout!] + '50' }]}>
                            <Text style={[wt.symbolVal, { color: CC_PANEL_COLORS[cc.panelLayout!] }]}>{p}</Text>
                          </View>
                        ))}
                      </View>
                    )}
                  </View>

                  {/* Camera Angle */}
                  <View style={or.wrap}>
                    <Text style={or.label}>CAMERA LANGUAGE</Text>
                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 7, marginBottom: 8 }}>
                      {(['lowAngle', 'birdsEyeView', 'dutchAngle', 'extremeCloseUp', 'overShoulder'] as const).map(cam => {
                        const col = CC_CAMERA_COLORS[cam];
                        const active = cc.cameraAngle === cam;
                        return (
                          <TouchableOpacity key={cam} activeOpacity={0.8}
                            style={[wt.envBtn, { borderColor: active ? col : C.border, backgroundColor: active ? col + '18' : C.card, paddingHorizontal: 11 }]}
                            onPress={() => setCC({ cameraAngle: active ? undefined : cam })}
                          >
                            <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 7, color: active ? col : C.muted, letterSpacing: 0.6 }}>{CC_CAMERA_LABELS[cam]}</Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                    {cc.cameraAngle && (
                      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                        {CC_CAMERA_MEANINGS[cc.cameraAngle].map(m => (
                          <View key={m} style={[wt.symbolChip, { borderColor: CC_CAMERA_COLORS[cc.cameraAngle!] + '50' }]}>
                            <Text style={[wt.symbolVal, { color: CC_CAMERA_COLORS[cc.cameraAngle!] }]}>{m}</Text>
                          </View>
                        ))}
                      </View>
                    )}
                  </View>

                  {/* Emotional Pacing */}
                  <View style={or.wrap}>
                    <Text style={or.label}>EMOTIONAL PACING</Text>
                    <View style={{ flexDirection: 'row', gap: 7, marginBottom: 8 }}>
                      {(['calmMoments', 'tensionBuild', 'emotionalImpact', 'explosiveMoments'] as const).map(p => {
                        const col = CC_PACING_COLORS[p];
                        const active = cc.emotionalPacing === p;
                        return (
                          <TouchableOpacity key={p} activeOpacity={0.8}
                            style={[wt.envBtn, { borderColor: active ? col : C.border, backgroundColor: active ? col + '18' : C.card, flex: 1 }]}
                            onPress={() => setCC({ emotionalPacing: active ? undefined : p })}
                          >
                            <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 7, color: active ? col : C.muted, letterSpacing: 0.6, textAlign: 'center' }}>{CC_PACING_LABELS[p]}</Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                    {cc.emotionalPacing && (
                      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                        {CC_EMOTIONAL_PACING[cc.emotionalPacing].map(t => (
                          <View key={t} style={[wt.symbolChip, { borderColor: CC_PACING_COLORS[cc.emotionalPacing!] + '50' }]}>
                            <Text style={[wt.symbolVal, { color: CC_PACING_COLORS[cc.emotionalPacing!] }]}>{t}</Text>
                          </View>
                        ))}
                      </View>
                    )}
                  </View>

                  {/* Visual Rhythm */}
                  <View style={or.wrap}>
                    <Text style={or.label}>VISUAL RHYTHM</Text>
                    <View style={{ flexDirection: 'row', gap: 8, marginBottom: 8 }}>
                      {(['slowBurn', 'actionRush', 'emotionalFocus'] as const).map(r => {
                        const col = CC_RHYTHM_COLORS[r];
                        const active = cc.pacingStyle === r;
                        return (
                          <TouchableOpacity key={r} activeOpacity={0.8}
                            style={[wt.envBtn, { borderColor: active ? col : C.border, backgroundColor: active ? col + '18' : C.card, flex: 1 }]}
                            onPress={() => setCC({ pacingStyle: active ? undefined : r })}
                          >
                            <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 7, color: active ? col : C.muted, letterSpacing: 0.7, textAlign: 'center' }}>{CC_RHYTHM_LABELS[r]}</Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                    {cc.pacingStyle && (
                      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                        {CC_VISUAL_RHYTHM[cc.pacingStyle].map(t => (
                          <View key={t} style={[wt.symbolChip, { borderColor: CC_RHYTHM_COLORS[cc.pacingStyle!] + '50' }]}>
                            <Text style={[wt.symbolVal, { color: CC_RHYTHM_COLORS[cc.pacingStyle!] }]}>{t}</Text>
                          </View>
                        ))}
                      </View>
                    )}
                  </View>

                  {/* Cinematic Shot Database */}
                  <View style={or.wrap}>
                    <Text style={or.label}>CINEMATIC SHOT DATABASE</Text>
                    <View style={{ gap: 7 }}>
                      {(['heroicReveal', 'rooftopSilhouette', 'finalBattleWideShot', 'emotionalCloseUp', 'intimidationFrame', 'rainDuelShot'] as const).map(shot => {
                        const col = CC_SHOT_COLORS[shot];
                        const active = cc.cinematicShot === shot;
                        const elements = CC_CINEMATIC_SHOTS[shot];
                        return (
                          <TouchableOpacity key={shot} activeOpacity={0.8}
                            style={{ borderWidth: 1.5, borderRadius: 12, borderColor: active ? col : C.border, backgroundColor: active ? col + '0C' : C.card, padding: 12, gap: 6 }}
                            onPress={() => setCC({ cinematicShot: active ? undefined : shot })}
                          >
                            <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 10, color: active ? col : '#F5EDD6', letterSpacing: 0.5 }}>{CC_SHOT_LABELS[shot]}</Text>
                            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 5 }}>
                              {elements.map(el => (
                                <View key={el} style={[wt.symbolChip, { borderColor: col + '40' }]}>
                                  <Text style={[wt.symbolVal, { color: active ? col : C.muted }]}>{el}</Text>
                                </View>
                              ))}
                            </View>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  </View>

                  {/* Panel Transitions */}
                  <View style={or.wrap}>
                    <Text style={or.label}>PANEL TRANSITION STYLE</Text>
                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 7 }}>
                      {(['actionToAction', 'subjectToSubject', 'sceneToScene', 'emotionalTransition'] as const).map(tr => {
                        const active = cc.panelTransition === tr;
                        return (
                          <TouchableOpacity key={tr} activeOpacity={0.8}
                            style={[wt.envBtn, { borderColor: active ? C.gold : C.border, backgroundColor: active ? C.gold + '12' : C.card, paddingHorizontal: 12 }]}
                            onPress={() => setCC({ panelTransition: active ? undefined : tr })}
                          >
                            <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 8, color: active ? C.gold : C.muted, letterSpacing: 0.6 }}>{CC_TRANSITION_LABELS[tr]}</Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  </View>

                  {/* Splash Page */}
                  <View style={or.wrap}>
                    <TouchableOpacity activeOpacity={0.8}
                      style={[wt.activateCard, { borderColor: cc.splashPage ? C.gold : C.border, backgroundColor: cc.splashPage ? C.gold + '0A' : C.card, marginBottom: 0 }]}
                      onPress={() => setCC({ splashPage: !cc.splashPage, splashTrigger: undefined })}
                    >
                      <View style={wt.activateRow}>
                        <View style={wt.activateLeft}>
                          <Text style={{ fontSize: 22 }}>💥</Text>
                          <View>
                            <Text style={[wt.activateTitle, { color: cc.splashPage ? C.gold : '#F5EDD6', fontSize: 12 }]}>SPLASH PAGE MODE</Text>
                            <Text style={wt.activateSub}>Full-page dramatic composition</Text>
                          </View>
                        </View>
                        <View style={[wt.activateDot, { backgroundColor: cc.splashPage ? C.gold : C.muted }]} />
                      </View>
                    </TouchableOpacity>
                    {cc.splashPage && (
                      <View style={{ marginTop: 10, gap: 8 }}>
                        <Text style={[or.label, { marginBottom: 4 }]}>SPLASH TRIGGER</Text>
                        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 7 }}>
                          {CC_SPLASH_TRIGGERS.map(trigger => (
                            <Chip key={trigger} label={trigger} active={cc.splashTrigger === trigger} color={C.gold}
                              onPress={() => setCC({ splashTrigger: cc.splashTrigger === trigger ? undefined : trigger })} />
                          ))}
                        </View>
                        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 6 }}>
                          {CC_SPLASH_VISUAL_RULES.map(rule => (
                            <View key={rule} style={[wt.symbolChip, { borderColor: C.gold + '40' }]}>
                              <Text style={[wt.symbolVal, { color: C.goldDim }]}>{rule}</Text>
                            </View>
                          ))}
                        </View>
                      </View>
                    )}
                  </View>

                  {/* Action Flow reference */}
                  <View style={or.wrap}>
                    <Text style={or.label}>ACTION FLOW — MOTION RULES</Text>
                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>
                      {CC_MOTION_RULES.map(r => (
                        <View key={r} style={[wt.symbolChip, { borderColor: C.green + '30' }]}>
                          <Text style={[wt.symbolVal, { color: '#22C55E' }]}>{r}</Text>
                        </View>
                      ))}
                    </View>
                    <Text style={[or.label, { marginBottom: 4 }]}>COMBAT FLOW SEQUENCE</Text>
                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                      {CC_COMBAT_FLOW.map((f, i) => (
                        <View key={f} style={[wt.symbolChip, { borderColor: C.red + '30' }]}>
                          <Text style={wt.symbolKey}>{i + 1}</Text>
                          <Text style={[wt.symbolVal, { color: C.red }]}>{f}</Text>
                        </View>
                      ))}
                    </View>
                  </View>

                  {/* Page Hierarchy reference */}
                  <View style={or.wrap}>
                    <Text style={or.label}>PAGE HIERARCHY</Text>
                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>
                      {CC_DOMINANCE_TOOLS.map(t => (
                        <View key={t} style={[wt.symbolChip, { borderColor: C.gold + '30' }]}>
                          <Text style={[wt.symbolVal, { color: C.goldDim }]}>{t}</Text>
                        </View>
                      ))}
                    </View>
                    <Text style={[or.label, { marginBottom: 4 }]}>EYE GUIDANCE</Text>
                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                      {CC_EYE_GUIDANCE.map(t => (
                        <View key={t} style={[wt.symbolChip, { borderColor: C.purple + '30' }]}>
                          <Text style={[wt.symbolVal, { color: C.purple }]}>{t}</Text>
                        </View>
                      ))}
                    </View>
                  </View>

                  {/* Storytelling AI reference */}
                  <View style={or.wrap}>
                    <Text style={or.label}>STORYTELLING AI — ALWAYS APPLIED</Text>
                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 5 }}>
                      {CC_STORYTELLING_SUGGESTIONS.map(s => (
                        <View key={s} style={[wt.symbolChip, { borderColor: C.purple + '40' }]}>
                          <Text style={[wt.symbolVal, { color: C.purple }]}>{s}</Text>
                        </View>
                      ))}
                    </View>
                  </View>

                  <View style={or.wrap}>
                    <Text style={or.label}>AI PAGE DIRECTOR — VISUAL DIRECTION</Text>
                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 5 }}>
                      {CC_VISUAL_DIRECTION.map(d => (
                        <View key={d} style={[wt.symbolChip, { borderColor: C.goldDim + '40' }]}>
                          <Text style={[wt.symbolVal, { color: C.goldDim }]}>{d}</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                </>
              );
            })()}

            {/* ── WORLD ── */}
            {tab === 'WORLD' && (
              <>
                {/* Activation Card */}
                <TouchableOpacity
                  style={[wt.activateCard, { borderColor: dna.worldSetting === 'feudal_japan' ? C.gold : C.border, backgroundColor: dna.worldSetting === 'feudal_japan' ? C.gold + '0A' : C.card }]}
                  onPress={() => setDna(prev => ({
                    ...prev,
                    worldSetting: prev.worldSetting === 'feudal_japan' ? undefined : 'feudal_japan',
                    feudalJapanScene: prev.worldSetting === 'feudal_japan' ? undefined : { environmentCategory: 'rural', atmosphereFX: [] },
                  }))}
                  activeOpacity={0.8}
                >
                  <View style={wt.activateRow}>
                    <View style={wt.activateLeft}>
                      <Text style={{ fontSize: 28 }}>⚔️</Text>
                      <View>
                        <Text style={[wt.activateTitle, { color: dna.worldSetting === 'feudal_japan' ? C.gold : '#F5EDD6' }]}>FEUDAL JAPAN ENGINE</Text>
                        <Text style={wt.activateSub}>AI World Environment Module</Text>
                      </View>
                    </View>
                    <View style={[wt.activateDot, { backgroundColor: dna.worldSetting === 'feudal_japan' ? C.gold : C.muted }]} />
                  </View>
                  <Text style={wt.activateDesc}>
                    Activates environments, atmosphere, lighting, combat styles, mythology, and cinematic shots — all fed directly into the AI image prompt.
                  </Text>
                </TouchableOpacity>

                {dna.worldSetting === 'feudal_japan' && dna.feudalJapanScene && (
                  <>
                    {/* Environment Category */}
                    <View style={or.wrap}>
                      <Text style={or.label}>ENVIRONMENT</Text>
                      <View style={{ flexDirection: 'row', gap: 8 }}>
                        {(['rural', 'urban', 'sacred', 'military'] as const).map(cat => {
                          const col = FEUDAL_ENV_COLORS[cat];
                          const active = dna.feudalJapanScene!.environmentCategory === cat;
                          return (
                            <TouchableOpacity key={cat} activeOpacity={0.8}
                              style={[wt.envBtn, { borderColor: active ? col : C.border, backgroundColor: active ? col + '18' : C.card, flex: 1 }]}
                              onPress={() => setDna(prev => ({ ...prev, feudalJapanScene: { ...prev.feudalJapanScene!, environmentCategory: cat, environmentDetail: undefined } }))}
                            >
                              <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 8, color: active ? col : C.muted, letterSpacing: 1, textAlign: 'center' }}>{cat.toUpperCase()}</Text>
                            </TouchableOpacity>
                          );
                        })}
                      </View>
                    </View>

                    {/* Scene Location */}
                    <View style={or.wrap}>
                      <Text style={or.label}>SCENE LOCATION</Text>
                      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginHorizontal: -20 }} contentContainerStyle={{ paddingHorizontal: 20, gap: 8, paddingBottom: 4 }}>
                        {FEUDAL_JAPAN_ENVIRONMENTS[dna.feudalJapanScene!.environmentCategory].map(env => {
                          const active = dna.feudalJapanScene!.environmentDetail === env;
                          return (
                            <Chip key={env} label={env} active={active} color={FEUDAL_ENV_COLORS[dna.feudalJapanScene!.environmentCategory]}
                              onPress={() => setDna(prev => ({ ...prev, feudalJapanScene: { ...prev.feudalJapanScene!, environmentDetail: active ? undefined : env } }))} />
                          );
                        })}
                      </ScrollView>
                    </View>

                    {/* Character Archetype */}
                    <View style={or.wrap}>
                      <Text style={or.label}>CHARACTER ARCHETYPE</Text>
                      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 7 }}>
                        {FEUDAL_JAPAN_CHARACTER_ARCHETYPES.map(arch => (
                          <Chip key={arch} label={arch} active={dna.feudalJapanScene!.characterArchetype === arch} color={C.gold}
                            onPress={() => setDna(prev => ({ ...prev, feudalJapanScene: { ...prev.feudalJapanScene!, characterArchetype: prev.feudalJapanScene!.characterArchetype === arch ? undefined : arch } }))} />
                        ))}
                      </View>
                    </View>

                    {/* Atmosphere FX */}
                    <View style={or.wrap}>
                      <Text style={or.label}>ATMOSPHERE FX</Text>
                      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 7 }}>
                        {FEUDAL_JAPAN_ATMOSPHERE_FX.map(fx => {
                          const active = dna.feudalJapanScene!.atmosphereFX.includes(fx);
                          return (
                            <Chip key={fx} label={fx} active={active} color='#22C55E'
                              onPress={() => setDna(prev => {
                                const fxs = prev.feudalJapanScene!.atmosphereFX;
                                return { ...prev, feudalJapanScene: { ...prev.feudalJapanScene!, atmosphereFX: active ? fxs.filter(f => f !== fx) : [...fxs, fx] } };
                              })} />
                          );
                        })}
                      </View>
                    </View>

                    {/* Lighting */}
                    <View style={or.wrap}>
                      <Text style={or.label}>LIGHTING</Text>
                      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 7 }}>
                        {FEUDAL_JAPAN_LIGHTING.map(light => (
                          <Chip key={light} label={light} active={dna.feudalJapanScene!.lighting === light} color={C.goldDim}
                            onPress={() => setDna(prev => ({ ...prev, feudalJapanScene: { ...prev.feudalJapanScene!, lighting: prev.feudalJapanScene!.lighting === light ? undefined : light } }))} />
                        ))}
                      </View>
                    </View>

                    {/* Combat Style */}
                    <View style={or.wrap}>
                      <Text style={or.label}>COMBAT STYLE</Text>
                      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginHorizontal: -20 }} contentContainerStyle={{ paddingHorizontal: 20, gap: 8, paddingBottom: 4 }}>
                        {FEUDAL_JAPAN_COMBAT_STYLES.map(style => (
                          <Chip key={style} label={style} active={dna.feudalJapanScene!.combatStyle === style} color={C.red}
                            onPress={() => setDna(prev => ({ ...prev, feudalJapanScene: { ...prev.feudalJapanScene!, combatStyle: prev.feudalJapanScene!.combatStyle === style ? undefined : style } }))} />
                        ))}
                      </ScrollView>
                    </View>

                    {/* Yokai */}
                    <View style={or.wrap}>
                      <Text style={or.label}>MYTHOLOGY — YOKAI</Text>
                      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 7 }}>
                        {FEUDAL_JAPAN_MYTHOLOGY.yokai.map(y => {
                          const active = (dna.feudalJapanScene!.yokai ?? []).includes(y);
                          return (
                            <Chip key={y} label={y} active={active} color={C.purple}
                              onPress={() => setDna(prev => {
                                const ys = prev.feudalJapanScene!.yokai ?? [];
                                return { ...prev, feudalJapanScene: { ...prev.feudalJapanScene!, yokai: active ? ys.filter(v => v !== y) : [...ys, y] } };
                              })} />
                          );
                        })}
                      </View>
                    </View>

                    {/* Cursed Artifacts */}
                    <View style={or.wrap}>
                      <Text style={or.label}>CURSED ARTIFACTS</Text>
                      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 7 }}>
                        {FEUDAL_JAPAN_MYTHOLOGY.cursedArtifacts.map(a => {
                          const active = (dna.feudalJapanScene!.cursedArtifacts ?? []).includes(a);
                          return (
                            <Chip key={a} label={a} active={active} color={C.red}
                              onPress={() => setDna(prev => {
                                const arts = prev.feudalJapanScene!.cursedArtifacts ?? [];
                                return { ...prev, feudalJapanScene: { ...prev.feudalJapanScene!, cursedArtifacts: active ? arts.filter(v => v !== a) : [...arts, a] } };
                              })} />
                          );
                        })}
                      </View>
                    </View>

                    {/* Cinematic Shot */}
                    <View style={or.wrap}>
                      <Text style={or.label}>CINEMATIC SHOT</Text>
                      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginHorizontal: -20 }} contentContainerStyle={{ paddingHorizontal: 20, gap: 8, paddingBottom: 4 }}>
                        {FEUDAL_JAPAN_CINEMATIC_SHOTS.map(shot => (
                          <Chip key={shot} label={shot} active={dna.feudalJapanScene!.cinematicShot === shot} color={C.purple}
                            onPress={() => setDna(prev => ({ ...prev, feudalJapanScene: { ...prev.feudalJapanScene!, cinematicShot: prev.feudalJapanScene!.cinematicShot === shot ? undefined : shot } }))} />
                        ))}
                      </ScrollView>
                    </View>

                    {/* Visual Style DNA */}
                    <View style={or.wrap}>
                      <Text style={or.label}>VISUAL STYLE DNA</Text>
                      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 7 }}>
                        {FEUDAL_JAPAN_STYLE_DNA.map(s => (
                          <Chip key={s} label={s} active={dna.feudalJapanScene!.styleDNA === s} color={C.gold}
                            onPress={() => setDna(prev => ({ ...prev, feudalJapanScene: { ...prev.feudalJapanScene!, styleDNA: prev.feudalJapanScene!.styleDNA === s ? undefined : s } }))} />
                        ))}
                      </View>
                    </View>

                    {/* Symbolism Guide */}
                    <View style={or.wrap}>
                      <Text style={or.label}>SYMBOLISM GUIDE</Text>
                      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                        {Object.entries(FEUDAL_JAPAN_SYMBOLISM).map(([symbol, meaning]) => (
                          <View key={symbol} style={wt.symbolChip}>
                            <Text style={wt.symbolKey}>{symbol.replace(/([A-Z])/g, ' $1').trim()}</Text>
                            <Text style={wt.symbolVal}>{meaning}</Text>
                          </View>
                        ))}
                      </View>
                    </View>
                  </>
                )}
              </>
            )}

            {tab === 'LOCK' && (
              <>
                {/* All lock toggle */}
                <TouchableOpacity
                  style={[m.allLockBtn, { borderColor: allLocked ? C.green + '60' : C.border, backgroundColor: allLocked ? C.green + '10' : C.card }]}
                  onPress={() => {
                    const next = !allLocked;
                    setDna(prev => ({ ...prev, lockFace: next, lockHair: next, lockTattooPlacement: next, lockCostume: next, lockColorPalette: next, lockWeapons: next, lockLighting: next }));
                    setSaved(false);
                  }}
                  activeOpacity={0.85}
                >
                  <Feather name={allLocked ? 'lock' : 'unlock'} size={18} color={allLocked ? C.green : C.muted} />
                  <Text style={[m.allLockText, { color: allLocked ? C.green : C.muted }]}>
                    {allLocked ? 'ALL CONSISTENCY LOCKS ACTIVE' : 'TAP TO LOCK ALL'}
                  </Text>
                </TouchableOpacity>

                <Text style={[or.label, { marginBottom: 12, marginTop: 6 }]}>
                  CONSISTENCY LOCKS — Java: ConsistencyEngine.applyConsistency(){'\n'}
                  Locked elements are injected into every AI prompt to maintain visual consistency across all panels.
                </Text>

                <LockRow label="Face Structure" desc="Locks facial features, scars, eye shape, jaw type across all panels."
                  value={dna.lockFace ?? true} onToggle={() => { set('lockFace', !(dna.lockFace ?? true)); Haptics.selectionAsync(); }} />
                <LockRow label="Hair & Beard" desc="Locks hair style, color, and beard style."
                  value={dna.lockHair ?? true} onToggle={() => { set('lockHair', !(dna.lockHair ?? true)); Haptics.selectionAsync(); }} />
                <LockRow label="Tattoo Placement" desc="Locks all tattoo positions and styles."
                  value={dna.lockTattooPlacement ?? true} onToggle={() => { set('lockTattooPlacement', !(dna.lockTattooPlacement ?? true)); Haptics.selectionAsync(); }} />
                <LockRow label="Costume Design" desc="Locks suit, cape, symbols, and accessories."
                  value={dna.lockCostume ?? true} onToggle={() => { set('lockCostume', !(dna.lockCostume ?? true)); Haptics.selectionAsync(); }} />
                <LockRow label="Color Palette" desc="Locks primary and secondary colors."
                  value={dna.lockColorPalette ?? true} onToggle={() => { set('lockColorPalette', !(dna.lockColorPalette ?? true)); Haptics.selectionAsync(); }} />
                <LockRow label="Signature Weapons" desc="Locks weapon names, types, and energy effects."
                  value={dna.lockWeapons ?? true} onToggle={() => { set('lockWeapons', !(dna.lockWeapons ?? true)); Haptics.selectionAsync(); }} />
                <LockRow label="Lighting Identity" desc="Locks cinematic lighting style across all panels."
                  value={dna.lockLighting ?? true} onToggle={() => { set('lockLighting', !(dna.lockLighting ?? true)); Haptics.selectionAsync(); }} />
              </>
            )}

            {/* DNA summary strip */}
            <View style={[m.summary, { borderColor: C.gold + '25' }]}>
              <Text style={m.summaryTitle}>DNA SUMMARY</Text>
              <Text style={m.summaryText} numberOfLines={5}>
                {[
                  dna.characterName || 'Unnamed',
                  dna.role ? dna.role.replace(/_/g, ' ') : null,
                  dna.age ? `Age ${dna.age}` : null,
                  `${dna.eyeShape.replace(/_/g, ' ')} eyes`,
                  `${dna.bodyType.replace(/_/g, ' ')}`,
                  `${dna.hairStyle.replace(/_/g, ' ')} ${dna.hairColor} hair`,
                  dna.beardStyle && dna.beardStyle !== 'none' ? dna.beardStyle : null,
                  `${dna.primarySuit.replace(/_/g, ' ')}`,
                  dna.capeType !== 'none' ? dna.capeType.replace(/_/g, ' ') : null,
                  (dna.tattoos?.length ?? 0) > 0 ? `${dna.tattoos!.length} tattoo${dna.tattoos!.length > 1 ? 's' : ''}` : null,
                  (dna.weapons?.length ?? 0) > 0 ? dna.weapons!.map(w => w.weaponName).join(', ') : null,
                  (dna.powers?.length ?? 0) > 0 ? dna.powers!.join(', ') : null,
                  dna.cinematicStyleDNA ? dna.cinematicStyleDNA.replace(/_/g, ' ') : null,
                  `${dna.renderingStyle.replace(/_/g, ' ')} style`,
                ].filter(Boolean).join(' · ')}
              </Text>
            </View>

            <View style={{ height: 40 }} />
          </ScrollView>

        </Pressable>
      </Pressable>
    </Modal>
  );
}

// ── Styles ─────────────────────────────────────────────────────────────────────
const m = StyleSheet.create({
  overlay:  { flex: 1, backgroundColor: '#000000CC', justifyContent: 'flex-end' },
  sheet:    { borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '94%' },
  handle:   { width: 44, height: 4, borderRadius: 2, alignSelf: 'center', marginTop: 10, marginBottom: 4 },

  header:   { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingTop: 8, paddingBottom: 8 },
  eyebrow:  { fontFamily: 'Inter_700Bold', fontSize: 7, color: C.muted, letterSpacing: 1.4, marginBottom: 2 },
  title:    { fontFamily: 'Inter_700Bold', fontSize: 17, color: C.gold, letterSpacing: 0.5 },

  quickFillRow:   { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 20, marginBottom: 8 },
  quickFillWrap:  { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 7, borderWidth: 1, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 7, backgroundColor: '#110E0B' },
  quickFillInput: { flex: 1, fontFamily: 'Inter_400Regular', fontSize: 11, color: '#F5F0E8' },
  quickFillBtn:   { borderRadius: 10, paddingHorizontal: 14, paddingVertical: 11 },
  quickFillBtnText:{ fontFamily: 'Inter_700Bold', fontSize: 12, letterSpacing: 0.8 },

  nameRow:  { flexDirection: 'row', alignItems: 'flex-end', gap: 10, paddingHorizontal: 20, marginBottom: 10 },
  nameInputWrap: { flex: 1, borderWidth: 1, borderColor: C.border, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8, backgroundColor: C.card },
  nameLabel:{ fontFamily: 'Inter_700Bold', fontSize: 8, color: C.muted, letterSpacing: 1.2, marginBottom: 4 },
  nameInput:{ fontFamily: 'Inter_600SemiBold', fontSize: 14, color: C.white },
  applyBtn: { borderRadius: 10, paddingHorizontal: 16, paddingVertical: 14 },
  applyBtnText: { fontFamily: 'Inter_700Bold', fontSize: 11, letterSpacing: 0.8 },

  savedRow:    { paddingHorizontal: 20, marginBottom: 10 },
  savedLabel:  { fontFamily: 'Inter_700Bold', fontSize: 8, color: C.muted, letterSpacing: 1.5, marginBottom: 6 },
  savedChipWrap:{ flexDirection: 'row', alignItems: 'center', gap: 2 },
  savedChip:   { borderWidth: 1, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 5 },
  savedChipText:{ fontFamily: 'Inter_600SemiBold', fontSize: 10 },
  deleteBtn:   { padding: 3 },

  tabStrip:       { flexGrow: 0, marginBottom: 4 },
  tabStripContent:{ paddingHorizontal: 20, gap: 6 },
  tabBtn:         { flexDirection: 'row', alignItems: 'center', gap: 6, borderWidth: 1.5, borderRadius: 12, paddingHorizontal: 13, paddingVertical: 9 },
  tabLabel:       { fontFamily: 'Inter_700Bold', fontSize: 11, letterSpacing: 0.8 },

  tabContent: { paddingHorizontal: 20, paddingTop: 16 },

  colorPreview:      { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 14, justifyContent: 'center' },
  colorSwatchLarge:  { width: 80, height: 52, borderRadius: 10, alignItems: 'center', justifyContent: 'flex-end', paddingBottom: 6 },
  colorLabel:        { fontFamily: 'Inter_700Bold', fontSize: 8, letterSpacing: 1, color: '#FFFFFF99' },

  styleChip:    { flexDirection: 'row', alignItems: 'center', gap: 6, borderWidth: 1.5, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 11 },
  styleChipText:{ fontFamily: 'Inter_700Bold', fontSize: 13, letterSpacing: 0.4 },

  cinemaRow:   { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: 10, padding: 10, marginBottom: 6 },
  cinemaLabel: { fontFamily: 'Inter_700Bold', fontSize: 12, marginBottom: 2 },
  cinemaDesc:  { fontFamily: 'Inter_400Regular', fontSize: 10, color: C.muted },

  addRow:   { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 12 },
  addInput: { fontFamily: 'Inter_400Regular', fontSize: 12, color: C.white, borderWidth: 1, borderColor: C.border, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 8, backgroundColor: C.card, marginBottom: 8 },
  addBtn:   { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: C.gold, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 11 },
  addCard:  { borderWidth: 1, borderColor: C.border, borderRadius: 12, padding: 12, marginBottom: 14, backgroundColor: '#110E0B' },

  allLockBtn:  { flexDirection: 'row', alignItems: 'center', gap: 10, borderWidth: 1, borderRadius: 12, padding: 14, marginBottom: 14 },
  allLockText: { fontFamily: 'Inter_700Bold', fontSize: 11, letterSpacing: 0.5 },

  summary:      { borderWidth: 1, borderRadius: 12, padding: 14, marginTop: 14 },
  summaryTitle: { fontFamily: 'Inter_700Bold', fontSize: 8, color: C.muted, letterSpacing: 1.5, marginBottom: 6 },
  summaryText:  { fontFamily: 'Inter_400Regular', fontSize: 11, color: C.white, lineHeight: 17 },
});

// ── COLORS tab palette banner ─────────────────────────────────────────────────
const col = StyleSheet.create({
  banner:       { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: C.card, borderWidth: 1, borderColor: C.border, borderRadius: 14, padding: 14, marginBottom: 20, gap: 0 },
  bannerSwatch: { flex: 1, alignItems: 'center', gap: 6 },
  bannerCircle: { width: 36, height: 36, borderRadius: 18, borderWidth: 1.5, borderColor: C.border },
  bannerLabel:  { fontFamily: 'Inter_700Bold', fontSize: 8, color: C.muted, letterSpacing: 1 },
  bannerDivider:{ width: 1, height: 30, backgroundColor: C.border },
});
