// ============================================================================
// UNIVERSAL CINEMATIC STORY ENGINE MODAL
// Port of Java UniversalAIInterpreter + CinematicTrainingSystem + AIStoryDirector
// Species DNA · Civilization Profile · Scene Understanding · Training Tips
// ============================================================================

import { Feather } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';
import React, { useMemo, useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import type { CharacterDNA, CivilizationProfile, SpeciesDNA } from '@/lib/character-memory';
import {
  CIVILIZATION_DATABASE,
  CIVILIZATION_EMOJI,
  EMOTIONAL_TONE_COLOR,
  MOTION_EMOJI,
  SPECIES_DATABASE,
  SPECIES_EMOJI,
  buildUniversalFragment,
  interpretUniversal,
  type SceneUnderstanding,
  type UniversalInterpretation,
} from '@/lib/universe-engine';

// ── Palette ───────────────────────────────────────────────────────────────────
const C = {
  bg:    '#0A0806', bgMid: '#110E0B', card: '#161210',
  border:'#2A2420', white: '#F5F0E8', muted: '#6B6560',
  gold:  '#FFD600', teal:  '#00E5FF', purple:'#A78BFA',
};

const EXAMPLE =
  'A blue avian being glides downward through a glowing energy field\n' +
  "in a worm's-eye shot while civilians look upward in awe beneath\n" +
  'floating futuristic temples.';

// ── SpeciesCard ───────────────────────────────────────────────────────────────
function SpeciesCard({ dna, onApply }: { dna: SpeciesDNA; onApply: () => void }) {
  const emoji = SPECIES_EMOJI[dna.speciesType];
  const traits: string[] = [];
  if (dna.wings)       traits.push('🪶 Wings');
  if (dna.tail)        traits.push('🐍 Tail');
  if (dna.glowingSkin) traits.push('✨ Glowing');
  return (
    <View style={sc.card}>
      <View style={sc.header}>
        <Text style={sc.emoji}>{emoji}</Text>
        <View style={{ flex: 1 }}>
          <Text style={sc.eyebrow}>SPECIES DNA DETECTED</Text>
          <Text style={sc.name}>{dna.speciesType.replace(/_/g, ' ')}</Text>
        </View>
        <TouchableOpacity style={sc.applyBtn} onPress={onApply} activeOpacity={0.85}>
          <Text style={sc.applyText}>APPLY</Text>
        </TouchableOpacity>
      </View>
      <View style={sc.grid}>
        {[
          { label: 'BODY',      value: dna.bodyStructure  },
          { label: 'SKIN',      value: dna.skinTexture     },
          { label: 'MOTION',    value: dna.movementStyle   },
          { label: 'EYES',      value: dna.eyeStructure    },
          { label: 'ENERGY',    value: dna.energySignature },
          { label: 'SILHOUETTE',value: dna.silhouetteStyle },
        ].map(({ label, value }) => (
          <View key={label} style={sc.cell}>
            <Text style={sc.cellLabel}>{label}</Text>
            <Text style={sc.cellValue} numberOfLines={2}>{value}</Text>
          </View>
        ))}
      </View>
      {traits.length > 0 && (
        <View style={sc.traitRow}>
          {traits.map(t => (
            <View key={t} style={sc.traitChip}>
              <Text style={sc.traitText}>{t}</Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}
const sc = StyleSheet.create({
  card:      { borderWidth: 1, borderColor: '#00E5FF40', borderRadius: 14, padding: 14, marginBottom: 10, backgroundColor: '#00E5FF06' },
  header:    { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 },
  emoji:     { fontSize: 28 },
  eyebrow:   { fontFamily: 'Inter_700Bold', fontSize: 8, color: '#00E5FF', letterSpacing: 1.2, marginBottom: 2 },
  name:      { fontFamily: 'Inter_700Bold', fontSize: 14, color: '#F5F0E8' },
  applyBtn:  { borderWidth: 1, borderColor: '#00E5FF50', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6 },
  applyText: { fontFamily: 'Inter_700Bold', fontSize: 9, color: '#00E5FF', letterSpacing: 0.8 },
  grid:      { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 8 },
  cell:      { width: '47%', backgroundColor: '#0A0806', borderRadius: 8, padding: 7 },
  cellLabel: { fontFamily: 'Inter_700Bold', fontSize: 7, color: '#6B6560', letterSpacing: 1.2, marginBottom: 3 },
  cellValue: { fontFamily: 'Inter_600SemiBold', fontSize: 10, color: '#F5F0E8', lineHeight: 14 },
  traitRow:  { flexDirection: 'row', gap: 6 },
  traitChip: { borderWidth: 1, borderColor: '#00E5FF40', borderRadius: 6, paddingHorizontal: 7, paddingVertical: 4 },
  traitText: { fontFamily: 'Inter_600SemiBold', fontSize: 9, color: '#00E5FF' },
});

// ── CivilizationCard ──────────────────────────────────────────────────────────
function CivilizationCard({ civ, onApply }: { civ: CivilizationProfile; onApply: () => void }) {
  const emoji = CIVILIZATION_EMOJI[civ.civilizationType];
  return (
    <View style={cc.card}>
      <View style={cc.header}>
        <Text style={cc.emoji}>{emoji}</Text>
        <View style={{ flex: 1 }}>
          <Text style={cc.eyebrow}>CIVILIZATION DETECTED</Text>
          <Text style={cc.name}>{civ.civilizationType.replace(/_/g, ' ')}</Text>
        </View>
        <TouchableOpacity style={cc.applyBtn} onPress={onApply} activeOpacity={0.85}>
          <Text style={cc.applyText}>APPLY</Text>
        </TouchableOpacity>
      </View>
      <View style={cc.grid}>
        {[
          { label: 'ARCHITECTURE', value: civ.architectureStyle },
          { label: 'TECHNOLOGY',   value: civ.technologyLevel   },
          { label: 'COLORS',       value: civ.colorIdentity     },
          { label: 'COMBAT',       value: civ.combatStyle       },
          { label: 'CLOTHING',     value: civ.clothingStyle     },
          { label: 'SYMBOLISM',    value: civ.symbolism         },
        ].map(({ label, value }) => (
          <View key={label} style={cc.cell}>
            <Text style={cc.cellLabel}>{label}</Text>
            <Text style={cc.cellValue} numberOfLines={2}>{value}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}
const cc = StyleSheet.create({
  card:      { borderWidth: 1, borderColor: '#A78BFA40', borderRadius: 14, padding: 14, marginBottom: 10, backgroundColor: '#A78BFA06' },
  header:    { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 },
  emoji:     { fontSize: 26 },
  eyebrow:   { fontFamily: 'Inter_700Bold', fontSize: 8, color: '#A78BFA', letterSpacing: 1.2, marginBottom: 2 },
  name:      { fontFamily: 'Inter_700Bold', fontSize: 14, color: '#F5F0E8' },
  applyBtn:  { borderWidth: 1, borderColor: '#A78BFA50', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6 },
  applyText: { fontFamily: 'Inter_700Bold', fontSize: 9, color: '#A78BFA', letterSpacing: 0.8 },
  grid:      { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  cell:      { width: '47%', backgroundColor: '#0A0806', borderRadius: 8, padding: 7 },
  cellLabel: { fontFamily: 'Inter_700Bold', fontSize: 7, color: '#6B6560', letterSpacing: 1.2, marginBottom: 3 },
  cellValue: { fontFamily: 'Inter_600SemiBold', fontSize: 10, color: '#F5F0E8', lineHeight: 14 },
});

// ── SceneChip ─────────────────────────────────────────────────────────────────
function SceneChip({ icon, label, value, color }: {
  icon: string; label: string; value: string; color: string;
}) {
  return (
    <View style={[chip.wrap, { borderColor: color + '50', backgroundColor: color + '0C' }]}>
      <Text style={chip.icon}>{icon}</Text>
      <View>
        <Text style={[chip.label, { color }]}>{label}</Text>
        <Text style={chip.value}>{value}</Text>
      </View>
    </View>
  );
}
const chip = StyleSheet.create({
  wrap:  { flexDirection: 'row', alignItems: 'center', gap: 7, borderWidth: 1, borderRadius: 10, padding: 9, marginBottom: 6 },
  icon:  { fontSize: 16 },
  label: { fontFamily: 'Inter_700Bold', fontSize: 8, letterSpacing: 1, marginBottom: 2 },
  value: { fontFamily: 'Inter_600SemiBold', fontSize: 11, color: '#F5F0E8' },
});

// ── SceneSection ──────────────────────────────────────────────────────────────
function SceneSection({ scene }: { scene: SceneUnderstanding }) {
  const chips = [
    scene.cameraType    && { icon: '📷', label: 'CAMERA',    value: scene.cameraType,                         color: '#38BDF8' },
    scene.motionType    && { icon: MOTION_EMOJI[scene.motionType], label: 'MOTION', value: scene.motionType.replace(/_/g,' '), color: '#FF6A00' },
    scene.environment   && { icon: '🌆', label: 'ENVIRONMENT', value: scene.environment,                       color: '#00E5FF' },
    scene.crowdBehavior && { icon: '👥', label: 'CROWD',      value: scene.crowdBehavior,                      color: '#22C55E' },
    { icon: '💡', label: 'LIGHTING',     value: scene.lighting,                                                 color: '#FDE68A' },
    { icon: '📐', label: 'COMPOSITION',  value: scene.composition,                                              color: '#60A5FA' },
    { icon: '🌫️', label: 'ATMOSPHERE',  value: scene.atmosphere,                                               color: '#94A3B8' },
  ].filter(Boolean) as Array<{ icon: string; label: string; value: string; color: string }>;

  return (
    <>
      {chips.map((c, i) => <SceneChip key={i} {...c} />)}
    </>
  );
}

// ── Species browser ───────────────────────────────────────────────────────────
function SpeciesBrowser({ onSelect }: { onSelect: (type: keyof typeof SPECIES_DATABASE) => void }) {
  const types = Object.keys(SPECIES_DATABASE) as Array<keyof typeof SPECIES_DATABASE>;
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
      {types.map(t => (
        <TouchableOpacity
          key={t}
          style={sb.card}
          onPress={() => { Haptics.selectionAsync(); onSelect(t); }}
          activeOpacity={0.8}
        >
          <Text style={sb.emoji}>{SPECIES_EMOJI[t]}</Text>
          <Text style={sb.label}>{t.replace(/_/g, '\n')}</Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}
const sb = StyleSheet.create({
  card:  { alignItems: 'center', borderWidth: 1, borderColor: '#2A2420', borderRadius: 10, padding: 10, width: 72, backgroundColor: '#161210' },
  emoji: { fontSize: 22, marginBottom: 5 },
  label: { fontFamily: 'Inter_700Bold', fontSize: 8, color: '#6B6560', textAlign: 'center', letterSpacing: 0.3, lineHeight: 11 },
});

// ── Civilization browser ──────────────────────────────────────────────────────
function CivBrowser({ onSelect }: { onSelect: (type: keyof typeof CIVILIZATION_DATABASE) => void }) {
  const types = Object.keys(CIVILIZATION_DATABASE) as Array<keyof typeof CIVILIZATION_DATABASE>;
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
      {types.map(t => (
        <TouchableOpacity
          key={t}
          style={sb.card}
          onPress={() => { Haptics.selectionAsync(); onSelect(t); }}
          activeOpacity={0.8}
        >
          <Text style={sb.emoji}>{CIVILIZATION_EMOJI[t]}</Text>
          <Text style={sb.label}>{t.replace(/_/g, '\n')}</Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}

// ── UniverseModal ─────────────────────────────────────────────────────────────
export default function UniverseModal({
  visible,
  onClose,
  onApplyCameraId,
  onApplyDNAExtension,
}: {
  visible: boolean;
  onClose: () => void;
  onApplyCameraId: (id: string) => void;
  onApplyDNAExtension: (partial: Partial<CharacterDNA>) => void;
}) {
  const [description, setDescription] = useState('');
  const [manualSpecies,  setManualSpecies]  = useState<keyof typeof SPECIES_DATABASE | null>(null);
  const [manualCiv,      setManualCiv]      = useState<keyof typeof CIVILIZATION_DATABASE | null>(null);
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'DESCRIBE' | 'BROWSE'>('DESCRIBE');

  // Live interpretation
  const interp: UniversalInterpretation | null = useMemo(
    () => description.trim().length > 4 ? interpretUniversal(description) : null,
    [description],
  );

  // Manual overrides merge on top of live interpretation
  const displaySpecies = manualSpecies
    ? SPECIES_DATABASE[manualSpecies]
    : interp?.speciesDNA ?? null;

  const displayCiv = manualCiv
    ? CIVILIZATION_DATABASE[manualCiv]
    : interp?.civilization ?? null;

  function handleApplySpecies() {
    if (!displaySpecies) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onApplyDNAExtension({ speciesDNA: displaySpecies });
  }

  function handleApplyCiv() {
    if (!displayCiv) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onApplyDNAExtension({ civilization: displayCiv });
  }

  function handleApplyCamera() {
    const id = interp?.scene.directorCameraId;
    if (id) { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); onApplyCameraId(id); }
  }

  function handleApplyAll() {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    const partial: Partial<CharacterDNA> = {};
    if (displaySpecies)  partial.speciesDNA   = displaySpecies;
    if (displayCiv)      partial.civilization = displayCiv;
    if (interp)          partial.emotionalTone = interp.scene.emotionalTone;
    onApplyDNAExtension(partial);
    if (interp?.scene.directorCameraId) onApplyCameraId(interp.scene.directorCameraId);
    onClose();
  }

  async function handleCopy() {
    if (!interp && !displaySpecies && !displayCiv) return;
    const frag = interp
      ? buildUniversalFragment({ ...interp, speciesDNA: displaySpecies, civilization: displayCiv })
      : '';
    await Clipboard.setStringAsync(frag);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const hasDetections = !!displaySpecies || !!displayCiv || !!interp?.scene.environment;
  const toneColor = interp ? EMOTIONAL_TONE_COLOR[interp.scene.emotionalTone] : C.gold;

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <Pressable style={m.overlay} onPress={onClose}>
        <Pressable style={m.sheet} onPress={e => e.stopPropagation()}>

          <View style={[m.handle, { backgroundColor: C.teal }]} />

          {/* Header */}
          <View style={m.header}>
            <View style={{ flex: 1 }}>
              <Text style={m.eyebrow}>SPECIES · CIVILIZATION · SCENE UNDERSTANDING</Text>
              <Text style={m.title}>UNIVERSE ENGINE</Text>
            </View>
            <TouchableOpacity onPress={onClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Feather name="x" size={20} color={C.muted} />
            </TouchableOpacity>
          </View>

          {/* System pills */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={m.pillRow}>
            {['Species Engine', 'Civilization Engine', 'Scene Understanding', 'Crowd Behavior', 'Cinematic AI'].map(p => (
              <View key={p} style={m.pill}><Text style={m.pillText}>✔ {p}</Text></View>
            ))}
          </ScrollView>

          {/* Tab switcher */}
          <View style={m.tabRow}>
            {(['DESCRIBE', 'BROWSE'] as const).map(t => (
              <TouchableOpacity
                key={t}
                style={[m.tabBtn, { borderColor: activeTab === t ? C.teal : C.border, backgroundColor: activeTab === t ? C.teal + '18' : 'transparent' }]}
                onPress={() => setActiveTab(t)}
                activeOpacity={0.8}
              >
                <Text style={[m.tabLabel, { color: activeTab === t ? C.teal : C.muted }]}>{t}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={m.scroll} keyboardShouldPersistTaps="handled">

            {activeTab === 'DESCRIBE' && (
              <>
                {/* Description box */}
                <View style={[m.descBox, { borderColor: description.length > 0 ? C.teal + '60' : C.border }]}>
                  <TextInput
                    style={m.descInput}
                    multiline
                    numberOfLines={5}
                    placeholder={`Describe your universal scene...\n\nExample:\n"${EXAMPLE}"`}
                    placeholderTextColor={C.muted}
                    value={description}
                    onChangeText={setDescription}
                    autoCapitalize="sentences"
                    autoCorrect
                    textAlignVertical="top"
                  />
                  {description.length > 0 && (
                    <TouchableOpacity
                      style={m.clearBtn}
                      onPress={() => setDescription('')}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                      <Feather name="x" size={14} color={C.muted} />
                    </TouchableOpacity>
                  )}
                </View>

                {/* Emotional tone badge */}
                {interp && (
                  <View style={[m.toneBadge, { borderColor: toneColor + '50', backgroundColor: toneColor + '10' }]}>
                    <Text style={m.toneLabel}>EMOTIONAL TONE</Text>
                    <Text style={[m.toneValue, { color: toneColor }]}>{interp.scene.emotionalTone}</Text>
                  </View>
                )}

                {/* Species card */}
                {displaySpecies && (
                  <SpeciesCard dna={displaySpecies} onApply={handleApplySpecies} />
                )}

                {/* Civilization card */}
                {displayCiv && (
                  <CivilizationCard civ={displayCiv} onApply={handleApplyCiv} />
                )}

                {/* Scene understanding */}
                {interp && (
                  <>
                    <Text style={m.sectionLabel}>SCENE UNDERSTANDING</Text>
                    <SceneSection scene={interp.scene} />
                  </>
                )}

                {/* Training tips */}
                {interp && interp.tips.length > 0 && (
                  <>
                    <Text style={m.sectionLabel}>CINEMATIC TIPS</Text>
                    {interp.tips.map((tip, i) => (
                      <View key={i} style={m.tipCard}>
                        <Text style={m.tipTitle}>💡 {tip.title}</Text>
                        <Text style={m.tipMessage}>{tip.message}</Text>
                      </View>
                    ))}
                  </>
                )}

                {/* Empty state */}
                {!hasDetections && description.length === 0 && (
                  <View style={m.emptyState}>
                    <Text style={m.emptyIcon}>🌌</Text>
                    <Text style={m.emptyTitle}>UNIVERSAL STORY ENGINE</Text>
                    <Text style={m.emptyDesc}>
                      Describe a scene using species, civilization, or environment keywords.{'\n\n'}
                      Try: "avian being", "floating temple", "reptilian warrior", "cyberpunk city", "energy being ascending"
                    </Text>
                  </View>
                )}
              </>
            )}

            {activeTab === 'BROWSE' && (
              <>
                <Text style={m.sectionLabel}>ALL 16 SPECIES — TAP TO SELECT</Text>
                <SpeciesBrowser onSelect={t => { setManualSpecies(t); setActiveTab('DESCRIBE'); }} />

                <Text style={[m.sectionLabel, { marginTop: 16 }]}>ALL 12 CIVILIZATIONS — TAP TO SELECT</Text>
                <CivBrowser onSelect={t => { setManualCiv(t); setActiveTab('DESCRIBE'); }} />

                <Text style={[m.sectionLabel, { marginTop: 16, marginBottom: 4 }]}>HOW TO USE</Text>
                {[
                  '"avian being gliding through energy field"',
                  '"reptilian warrior beneath a floating temple"',
                  '"cyberpunk city with android soldier"',
                  '"celestial being ascending in worm\'s-eye view"',
                  '"giant titan with civilians fleeing below"',
                ].map((ex, i) => (
                  <TouchableOpacity
                    key={i}
                    style={m.exCard}
                    onPress={() => { setDescription(ex.replace(/"/g, '')); setActiveTab('DESCRIBE'); }}
                    activeOpacity={0.8}
                  >
                    <Feather name="chevron-right" size={12} color={C.teal} />
                    <Text style={m.exText}>{ex}</Text>
                  </TouchableOpacity>
                ))}
              </>
            )}

            {/* Action row */}
            {(hasDetections || interp) && (
              <View style={m.actionRow}>
                <TouchableOpacity style={[m.copyBtn, { borderColor: C.border }]} onPress={handleCopy} activeOpacity={0.85}>
                  <Feather name={copied ? 'check' : 'copy'} size={13} color={C.muted} />
                  <Text style={m.copyText}>{copied ? 'COPIED' : 'COPY'}</Text>
                </TouchableOpacity>
                {interp?.scene.directorCameraId && (
                  <TouchableOpacity style={[m.camBtn, { borderColor: '#38BDF850' }]} onPress={handleApplyCamera} activeOpacity={0.85}>
                    <Text style={m.camText}>📷 CAMERA</Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity
                  style={[m.applyAllBtn, { backgroundColor: C.teal }]}
                  onPress={handleApplyAll}
                  activeOpacity={0.85}
                >
                  <Text style={m.applyAllText}>APPLY ALL</Text>
                  <Feather name="arrow-right" size={14} color={C.bg} />
                </TouchableOpacity>
              </View>
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
  sheet:       { backgroundColor: '#0A0806', borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '94%' },
  handle:      { width: 44, height: 4, borderRadius: 2, alignSelf: 'center', marginTop: 10, marginBottom: 4 },
  header:      { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingTop: 8, paddingBottom: 6 },
  eyebrow:     { fontFamily: 'Inter_700Bold', fontSize: 7, color: '#00E5FF', letterSpacing: 1.5, marginBottom: 2 },
  title:       { fontFamily: 'Inter_700Bold', fontSize: 17, color: '#00E5FF' },
  pillRow:     { paddingHorizontal: 20, gap: 6, marginBottom: 10 },
  pill:        { borderWidth: 1, borderColor: '#00E5FF30', borderRadius: 7, paddingHorizontal: 8, paddingVertical: 4, backgroundColor: '#00E5FF08' },
  pillText:    { fontFamily: 'Inter_600SemiBold', fontSize: 9, color: '#00E5FF' },
  tabRow:      { flexDirection: 'row', gap: 8, paddingHorizontal: 20, marginBottom: 10 },
  tabBtn:      { flex: 1, alignItems: 'center', borderWidth: 1, borderRadius: 10, paddingVertical: 8 },
  tabLabel:    { fontFamily: 'Inter_700Bold', fontSize: 11, letterSpacing: 0.5 },
  scroll:      { paddingHorizontal: 20 },
  descBox:     { borderWidth: 1.5, borderRadius: 14, padding: 14, marginBottom: 10, backgroundColor: '#161210', position: 'relative' },
  descInput:   { fontFamily: 'Inter_400Regular', fontSize: 12, color: '#F5F0E8', lineHeight: 19, minHeight: 100 },
  clearBtn:    { position: 'absolute', top: 12, right: 12 },
  toneBadge:   { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderWidth: 1, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 9, marginBottom: 10 },
  toneLabel:   { fontFamily: 'Inter_700Bold', fontSize: 9, color: '#6B6560', letterSpacing: 1.2 },
  toneValue:   { fontFamily: 'Inter_700Bold', fontSize: 14, letterSpacing: 0.5 },
  sectionLabel:{ fontFamily: 'Inter_700Bold', fontSize: 10, color: '#6B6560', letterSpacing: 1.5, marginBottom: 8, marginTop: 4 },
  tipCard:     { borderWidth: 1, borderColor: '#2A2420', borderRadius: 10, padding: 10, marginBottom: 7, backgroundColor: '#14100A' },
  tipTitle:    { fontFamily: 'Inter_700Bold', fontSize: 11, color: '#F5F0E8', marginBottom: 3 },
  tipMessage:  { fontFamily: 'Inter_400Regular', fontSize: 11, color: '#6B6560', lineHeight: 16 },
  emptyState:  { alignItems: 'center', paddingVertical: 40, paddingHorizontal: 20 },
  emptyIcon:   { fontSize: 44, marginBottom: 14 },
  emptyTitle:  { fontFamily: 'Inter_700Bold', fontSize: 13, color: '#6B6560', letterSpacing: 1.5, marginBottom: 10 },
  emptyDesc:   { fontFamily: 'Inter_400Regular', fontSize: 12, color: '#4B4540', lineHeight: 18, textAlign: 'center' },
  exCard:      { flexDirection: 'row', alignItems: 'center', gap: 8, borderWidth: 1, borderColor: '#2A2420', borderRadius: 8, padding: 10, marginBottom: 6 },
  exText:      { fontFamily: 'Inter_400Regular', fontSize: 11, color: '#6B6560', flex: 1 },
  actionRow:   { flexDirection: 'row', gap: 8, marginTop: 12 },
  copyBtn:     { flexDirection: 'row', alignItems: 'center', gap: 5, borderWidth: 1, borderRadius: 10, paddingHorizontal: 11, paddingVertical: 11 },
  copyText:    { fontFamily: 'Inter_700Bold', fontSize: 9, color: '#6B6560', letterSpacing: 0.8 },
  camBtn:      { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: 10, paddingHorizontal: 11, paddingVertical: 11 },
  camText:     { fontFamily: 'Inter_700Bold', fontSize: 9, color: '#38BDF8', letterSpacing: 0.8 },
  applyAllBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderRadius: 10, paddingVertical: 12 },
  applyAllText:{ fontFamily: 'Inter_700Bold', fontSize: 12, color: '#0A0806', letterSpacing: 0.8 },
});
