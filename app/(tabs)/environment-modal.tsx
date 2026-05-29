// ============================================================================
// ENVIRONMENT MODAL
// Comic Art Studio — Environment + Aerial Intelligence Integration
// ============================================================================

import { Feather } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import {
  ALL_LOCATIONS,
  BLANK_ENVIRONMENT,
  COMIC_ENVIRONMENT_DATABASE,
  GENRE_COLORS,
  type ActiveEnvironment,
} from '@/lib/environment-database';

// ── Palette ───────────────────────────────────────────────────────────────────
const C = {
  bg:     '#0A0806',
  bgMid:  '#110E0B',
  card:   '#161210',
  border: '#2A2420',
  white:  '#F5F0E8',
  muted:  '#6B6560',
  gold:   '#FFD600',
  teal:   '#00E5FF',
  green:  '#22C55E',
};

type TabId = 'LOCATION' | 'ATMOSPHERE' | 'AERIAL';
const TABS: Array<{ id: TabId; icon: string; label: string }> = [
  { id: 'LOCATION',   icon: '🌆', label: 'LOCATION' },
  { id: 'ATMOSPHERE', icon: '🌧', label: 'WEATHER' },
  { id: 'AERIAL',     icon: '🦅', label: 'AERIAL' },
];

// ── LocationCard ──────────────────────────────────────────────────────────────
function LocationCard({ entry, active, onPress }: {
  entry: typeof ALL_LOCATIONS[number];
  active: boolean;
  onPress: () => void;
}) {
  const genreKey = entry.kind === 'city' ? entry.genre : entry.category;
  const genreColor = GENRE_COLORS[genreKey ?? ''] ?? C.gold;
  return (
    <TouchableOpacity
      style={[lc.card, {
        borderColor: active ? genreColor : C.border,
        backgroundColor: active ? genreColor + '15' : C.card,
      }]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <View style={lc.top}>
        <View style={[lc.genrePill, { backgroundColor: genreColor + '22', borderColor: genreColor + '55' }]}>
          <Text style={[lc.genreText, { color: genreColor }]}>
            {(genreKey ?? '').toUpperCase()}
          </Text>
        </View>
        {active && <Feather name="check-circle" size={13} color={genreColor} />}
      </View>
      <Text style={[lc.name, { color: active ? genreColor : C.white }]}>{entry.name}</Text>
      <Text style={lc.traits} numberOfLines={2}>
        {'architecture' in entry
          ? entry.architecture.slice(0, 3).join(' · ')
          : entry.traits.slice(0, 3).join(' · ')}
      </Text>
      <Text style={[lc.kind, { color: C.muted }]}>
        {entry.kind === 'city' ? '🌇 EXTERIOR' : '🏛 INTERIOR'}
      </Text>
    </TouchableOpacity>
  );
}
const lc = StyleSheet.create({
  card:      { borderWidth: 1, borderRadius: 12, padding: 12, marginBottom: 10 },
  top:       { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  genrePill: { borderWidth: 1, borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2 },
  genreText: { fontFamily: 'Inter_700Bold', fontSize: 8, letterSpacing: 1 },
  name:      { fontFamily: 'Inter_700Bold', fontSize: 13, marginBottom: 4 },
  traits:    { fontFamily: 'Inter_400Regular', fontSize: 10, color: '#6B6560', lineHeight: 15 },
  kind:      { fontFamily: 'Inter_600SemiBold', fontSize: 8, letterSpacing: 1, marginTop: 6 },
});

// ── AtmosphereCard ─────────────────────────────────────────────────────────────
function AtmosphereCard({ entry, active, onPress }: {
  entry: typeof COMIC_ENVIRONMENT_DATABASE.atmosphereDatabase[number];
  active: boolean;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      style={[atm.card, {
        borderColor: active ? C.teal : C.border,
        backgroundColor: active ? C.teal + '12' : C.card,
      }]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <Text style={atm.emoji}>{entry.emoji}</Text>
      <Text style={[atm.name, { color: active ? C.teal : C.white }]}>{entry.name}</Text>
      <Text style={atm.traits} numberOfLines={2}>{entry.traits.join(' · ')}</Text>
      {active && <View style={[atm.activeDot, { backgroundColor: C.teal }]} />}
    </TouchableOpacity>
  );
}
const atm = StyleSheet.create({
  card:      { borderWidth: 1, borderRadius: 12, padding: 12, alignItems: 'center', gap: 4 },
  emoji:     { fontSize: 28, marginBottom: 2 },
  name:      { fontFamily: 'Inter_700Bold', fontSize: 12, textAlign: 'center' },
  traits:    { fontFamily: 'Inter_400Regular', fontSize: 9, color: '#6B6560', textAlign: 'center', lineHeight: 14 },
  activeDot: { width: 6, height: 6, borderRadius: 3, marginTop: 4 },
});

// ── AerialCard ────────────────────────────────────────────────────────────────
function AerialCard({ entry, active, onPress }: {
  entry: typeof COMIC_ENVIRONMENT_DATABASE.aerialPoses[number];
  active: boolean;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      style={[ar.card, {
        borderColor: active ? '#38BDF8' : C.border,
        backgroundColor: active ? '#38BDF820' : C.card,
      }]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <View style={ar.row}>
        <View>
          <Text style={[ar.name, { color: active ? '#38BDF8' : C.white }]}>{entry.name}</Text>
          <Text style={ar.cat}>{entry.category.toUpperCase()} · {entry.momentum}</Text>
        </View>
        {active && <Feather name="check-circle" size={14} color="#38BDF8" />}
      </View>
      <Text style={ar.traits} numberOfLines={1}>{entry.traits.slice(0, 3).join(' · ')}</Text>
      <View style={ar.cameras}>
        {entry.cameraAngles.slice(0, 3).map(cam => (
          <View key={cam} style={ar.camChip}>
            <Text style={ar.camText}>{cam.replace(/([A-Z])/g, ' $1').trim()}</Text>
          </View>
        ))}
      </View>
    </TouchableOpacity>
  );
}
const ar = StyleSheet.create({
  card:    { borderWidth: 1, borderRadius: 12, padding: 12, marginBottom: 10 },
  row:     { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 5 },
  name:    { fontFamily: 'Inter_700Bold', fontSize: 13 },
  cat:     { fontFamily: 'Inter_700Bold', fontSize: 8, color: '#6B6560', letterSpacing: 0.8, marginTop: 2 },
  traits:  { fontFamily: 'Inter_400Regular', fontSize: 10, color: '#6B6560', marginBottom: 8 },
  cameras: { flexDirection: 'row', gap: 5, flexWrap: 'wrap' },
  camChip: { borderWidth: 1, borderColor: '#2A2420', borderRadius: 6, paddingHorizontal: 6, paddingVertical: 3 },
  camText: { fontFamily: 'Inter_600SemiBold', fontSize: 8, color: '#6B6560', letterSpacing: 0.5 },
});

// ── Active environment summary strip ─────────────────────────────────────────
function EnvSummaryStrip({ env, teal }: { env: ActiveEnvironment; teal: string }) {
  const hasAny = env.locationId || env.atmosphereId || env.aerialPoseId;
  if (!hasAny) return null;
  const loc  = ALL_LOCATIONS.find(l => l.id === env.locationId);
  const atmo = COMIC_ENVIRONMENT_DATABASE.atmosphereDatabase.find(a => a.id === env.atmosphereId);
  const ap   = COMIC_ENVIRONMENT_DATABASE.aerialPoses.find(a => a.id === env.aerialPoseId);
  return (
    <View style={[ss.strip, { borderColor: teal + '40', backgroundColor: teal + '0C' }]}>
      {loc  && <Text style={[ss.chip, { color: teal }]}>🌆 {loc.name}</Text>}
      {atmo && <Text style={[ss.chip, { color: teal }]}>{atmo.emoji} {atmo.name}</Text>}
      {ap   && <Text style={[ss.chip, { color: teal }]}>🦅 {ap.name}</Text>}
    </View>
  );
}
const ss = StyleSheet.create({
  strip: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8, marginBottom: 12 },
  chip:  { fontFamily: 'Inter_600SemiBold', fontSize: 10 },
});

// ── EnvironmentModal ──────────────────────────────────────────────────────────
export default function EnvironmentModal({
  visible, onClose, env, onEnvChange,
}: {
  visible: boolean;
  onClose: () => void;
  env: ActiveEnvironment;
  onEnvChange: (next: ActiveEnvironment) => void;
}) {
  const [tab, setTab] = useState<TabId>('LOCATION');

  function toggleLocation(id: string)   { onEnvChange({ ...env, locationId:   env.locationId   === id ? null : id }); }
  function toggleAtmosphere(id: string) { onEnvChange({ ...env, atmosphereId: env.atmosphereId === id ? null : id }); }
  function toggleAerial(id: string)     { onEnvChange({ ...env, aerialPoseId: env.aerialPoseId === id ? null : id }); }

  const hasAny = !!(env.locationId || env.atmosphereId || env.aerialPoseId);

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <Pressable style={m.overlay} onPress={onClose}>
        <Pressable style={[m.sheet, { backgroundColor: C.bg }]} onPress={e => e.stopPropagation()}>

          <View style={[m.handle, { backgroundColor: C.teal }]} />

          {/* Header */}
          <View style={m.header}>
            <View style={{ flex: 1 }}>
              <Text style={m.eyebrow}>ENVIRONMENT ENGINE · AERIAL INTELLIGENCE</Text>
              <Text style={m.title}>SCENE ENVIRONMENT</Text>
            </View>
            <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
              {hasAny && (
                <TouchableOpacity
                  style={[m.clearBtn, { borderColor: C.border }]}
                  onPress={() => onEnvChange(BLANK_ENVIRONMENT)}
                  activeOpacity={0.8}
                >
                  <Text style={m.clearText}>CLEAR</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity onPress={onClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                <Feather name="x" size={20} color={C.muted} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Active summary */}
          {hasAny && (
            <View style={{ paddingHorizontal: 20, marginBottom: 4 }}>
              <EnvSummaryStrip env={env} teal={C.teal} />
            </View>
          )}

          {/* Storytelling rules strip */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={m.rulesRow}
          >
            {COMIC_ENVIRONMENT_DATABASE.storytellingRules.cinematicComposition.map(rule => (
              <View key={rule} style={m.ruleChip}>
                <Text style={m.ruleText}>{rule.replace(/([A-Z])/g, ' $1').trim().toUpperCase()}</Text>
              </View>
            ))}
          </ScrollView>

          {/* Tab bar */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={m.tabStrip} contentContainerStyle={m.tabContent}>
            {TABS.map(t => {
              const active = tab === t.id;
              return (
                <TouchableOpacity
                  key={t.id}
                  style={[m.tabBtn, { borderColor: active ? C.teal : C.border, backgroundColor: active ? C.teal + '15' : 'transparent' }]}
                  onPress={() => setTab(t.id)}
                  activeOpacity={0.8}
                >
                  <Text style={{ fontSize: 13 }}>{t.icon}</Text>
                  <Text style={[m.tabLabel, { color: active ? C.teal : C.muted }]}>{t.label}</Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* Content */}
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={m.scrollContent}>

            {tab === 'LOCATION' && (
              ALL_LOCATIONS.map(loc => (
                <LocationCard
                  key={loc.id}
                  entry={loc}
                  active={env.locationId === loc.id}
                  onPress={() => toggleLocation(loc.id)}
                />
              ))
            )}

            {tab === 'ATMOSPHERE' && (
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
                {COMIC_ENVIRONMENT_DATABASE.atmosphereDatabase.map(a => (
                  <View key={a.id} style={{ width: '47%' }}>
                    <AtmosphereCard
                      entry={a}
                      active={env.atmosphereId === a.id}
                      onPress={() => toggleAtmosphere(a.id)}
                    />
                  </View>
                ))}
              </View>
            )}

            {tab === 'AERIAL' && (
              COMIC_ENVIRONMENT_DATABASE.aerialPoses.map(ap => (
                <AerialCard
                  key={ap.id}
                  entry={ap}
                  active={env.aerialPoseId === ap.id}
                  onPress={() => toggleAerial(ap.id)}
                />
              ))
            )}

            <View style={{ height: 40 }} />
          </ScrollView>

        </Pressable>
      </Pressable>
    </Modal>
  );
}

const m = StyleSheet.create({
  overlay:     { flex: 1, backgroundColor: '#000000CC', justifyContent: 'flex-end' },
  sheet:       { borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '92%' },
  handle:      { width: 44, height: 4, borderRadius: 2, alignSelf: 'center', marginTop: 10, marginBottom: 4 },
  header:      { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingTop: 8, paddingBottom: 10 },
  eyebrow:     { fontFamily: 'Inter_700Bold', fontSize: 8, color: C.muted, letterSpacing: 1.5, marginBottom: 2 },
  title:       { fontFamily: 'Inter_700Bold', fontSize: 17, color: C.teal },
  clearBtn:    { borderWidth: 1, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 5 },
  clearText:   { fontFamily: 'Inter_700Bold', fontSize: 9, color: C.muted, letterSpacing: 0.8 },
  rulesRow:    { paddingHorizontal: 20, gap: 6, marginBottom: 8 },
  ruleChip:    { borderWidth: 1, borderColor: '#2A2420', borderRadius: 6, paddingHorizontal: 7, paddingVertical: 4 },
  ruleText:    { fontFamily: 'Inter_600SemiBold', fontSize: 8, color: C.muted, letterSpacing: 0.6 },
  tabStrip:    { flexGrow: 0, marginBottom: 4 },
  tabContent:  { paddingHorizontal: 20, gap: 7 },
  tabBtn:      { flexDirection: 'row', alignItems: 'center', gap: 5, borderWidth: 1, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 7 },
  tabLabel:    { fontFamily: 'Inter_700Bold', fontSize: 10, letterSpacing: 0.5 },
  scrollContent:{ paddingHorizontal: 20, paddingTop: 14 },
});
