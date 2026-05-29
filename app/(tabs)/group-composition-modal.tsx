// ============================================================================
// GROUP COMPOSITION MODAL
// Comic Art Studio — AI Group Composition Engine (ported from Java)
// ============================================================================

import { Feather } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';
import React, { useState } from 'react';
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

import {
  COMPOSITION_TEMPLATES,
  EMOTIONAL_TONE_COLORS,
  EYE_FLOW_EMOJI,
  analyzeGroupPrompt,
  buildGroupCompositionFragment,
  optimizeComposition,
  type CompositionTemplate,
  type CompositionType,
} from '@/lib/group-composition';

// ── Palette ───────────────────────────────────────────────────────────────────
const C = {
  bg:      '#0A0806',
  bgMid:   '#110E0B',
  card:    '#161210',
  border:  '#2A2420',
  white:   '#F5F0E8',
  muted:   '#6B6560',
  gold:    '#FFD600',
  purple:  '#A78BFA',
  green:   '#22C55E',
};

// All templates as an array for the scroller
const ALL_TEMPLATES = Object.values(COMPOSITION_TEMPLATES);

// ── Panel Diagram — draws character slot dots on a mini stage ─────────────────
function PanelDiagram({ template }: { template: CompositionTemplate }) {
  const W = 260, H = 160;
  const toneColor = EMOTIONAL_TONE_COLORS[template.emotionalTone];
  return (
    <View style={[pd.frame, { width: W, height: H, borderColor: toneColor + '40' }]}>
      {/* Eye flow label */}
      <Text style={[pd.flowLabel, { color: toneColor + '99' }]}>
        {EYE_FLOW_EMOJI[template.eyeFlowPattern]} {template.eyeFlowPattern.replace(/_/g, ' ')}
      </Text>
      {/* Character slot dots */}
      {template.characterSlots.map((slot, i) => {
        const left = slot.position.x * W - 10;
        const top  = (1 - slot.position.y) * H - 10;
        const size = Math.round(8 + slot.scale * 6);
        const color = slot.foregroundPriority ? toneColor : C.muted;
        return (
          <View
            key={i}
            style={[pd.dot, {
              left, top,
              width: size, height: size,
              borderRadius: size / 2,
              backgroundColor: color + (slot.foregroundPriority ? 'EE' : '66'),
              borderColor: color,
            }]}
          />
        );
      })}
      {/* Focal point label */}
      <Text style={[pd.focal, { color: toneColor }]}>{template.focalPoint}</Text>
    </View>
  );
}
const pd = StyleSheet.create({
  frame:      { position: 'relative', borderWidth: 1, borderRadius: 12, overflow: 'hidden', alignSelf: 'center', backgroundColor: '#0D0A08', marginBottom: 14 },
  dot:        { position: 'absolute', borderWidth: 1.5 },
  flowLabel:  { position: 'absolute', top: 6, left: 8, fontFamily: 'Inter_700Bold', fontSize: 8, letterSpacing: 0.8 },
  focal:      { position: 'absolute', bottom: 5, right: 8, fontFamily: 'Inter_700Bold', fontSize: 8, letterSpacing: 0.8 },
});

// ── Character Slot Row ────────────────────────────────────────────────────────
function SlotRow({ slot, toneColor }: { slot: CompositionTemplate['characterSlots'][0]; toneColor: string }) {
  return (
    <View style={[sr.row, { borderColor: slot.foregroundPriority ? toneColor + '40' : C.border }]}>
      <View style={[sr.depthBadge, { backgroundColor: toneColor + (slot.foregroundPriority ? '30' : '12') }]}>
        <Text style={[sr.depthText, { color: toneColor }]}>L{slot.depthLayer}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[sr.role, { color: slot.foregroundPriority ? toneColor : C.white }]}>{slot.role}</Text>
        <Text style={sr.pose}>{slot.suggestedPose} · {slot.motionDirection.replace(/_/g, ' ')}</Text>
      </View>
      {slot.foregroundPriority && (
        <View style={sr.fgBadge}><Text style={sr.fgText}>FG</Text></View>
      )}
      {slot.silhouettePriority && (
        <View style={sr.silBadge}><Text style={sr.silText}>SIL</Text></View>
      )}
    </View>
  );
}
const sr = StyleSheet.create({
  row:       { flexDirection: 'row', alignItems: 'center', gap: 8, borderWidth: 1, borderRadius: 8, padding: 8, marginBottom: 6 },
  depthBadge:{ width: 28, height: 28, borderRadius: 6, alignItems: 'center', justifyContent: 'center' },
  depthText: { fontFamily: 'Inter_700Bold', fontSize: 9, letterSpacing: 0.5 },
  role:      { fontFamily: 'Inter_700Bold', fontSize: 12, marginBottom: 2 },
  pose:      { fontFamily: 'Inter_400Regular', fontSize: 10, color: '#6B6560' },
  fgBadge:   { borderWidth: 1, borderColor: '#FFD60060', borderRadius: 5, paddingHorizontal: 5, paddingVertical: 2 },
  fgText:    { fontFamily: 'Inter_700Bold', fontSize: 8, color: '#FFD600' },
  silBadge:  { borderWidth: 1, borderColor: '#6B656060', borderRadius: 5, paddingHorizontal: 5, paddingVertical: 2 },
  silText:   { fontFamily: 'Inter_700Bold', fontSize: 8, color: '#6B6560' },
});

// ── Composition Card (horizontal scroller) ─────────────────────────────────────
function CompCard({ tmpl, active, onPress }: {
  tmpl: CompositionTemplate;
  active: boolean;
  onPress: () => void;
}) {
  const tc = EMOTIONAL_TONE_COLORS[tmpl.emotionalTone];
  return (
    <TouchableOpacity
      style={[cc.card, { borderColor: active ? tc : C.border, backgroundColor: active ? tc + '14' : C.card }]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <Text style={cc.emoji}>{tmpl.emoji}</Text>
      <Text style={[cc.name, { color: active ? tc : C.white }]} numberOfLines={2}>
        {tmpl.type.replace(/_/g, '\n')}
      </Text>
      <View style={[cc.tonePill, { backgroundColor: tc + '22', borderColor: tc + '55' }]}>
        <Text style={[cc.toneText, { color: tc }]}>{tmpl.emotionalTone}</Text>
      </View>
    </TouchableOpacity>
  );
}
const cc = StyleSheet.create({
  card:     { width: 100, borderWidth: 1, borderRadius: 12, padding: 10, alignItems: 'center', gap: 5 },
  emoji:    { fontSize: 26 },
  name:     { fontFamily: 'Inter_700Bold', fontSize: 9, letterSpacing: 0.5, textAlign: 'center', lineHeight: 13 },
  tonePill: { borderWidth: 1, borderRadius: 6, paddingHorizontal: 5, paddingVertical: 3, marginTop: 2 },
  toneText: { fontFamily: 'Inter_700Bold', fontSize: 7, letterSpacing: 0.8 },
});

// ── GroupCompositionModal ─────────────────────────────────────────────────────
export default function GroupCompositionModal({
  visible, onClose, activeType, onTypeChange,
}: {
  visible: boolean;
  onClose: () => void;
  activeType: CompositionType | null;
  onTypeChange: (t: CompositionType) => void;
}) {
  const [analyzeText, setAnalyzeText] = useState('');
  const [copied, setCopied] = useState(false);

  const selected = activeType ? optimizeComposition(COMPOSITION_TEMPLATES[activeType]) : null;
  const toneColor = selected ? EMOTIONAL_TONE_COLORS[selected.emotionalTone] : C.purple;

  function handleAnalyze() {
    if (!analyzeText.trim()) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const detected = analyzeGroupPrompt(analyzeText);
    onTypeChange(detected);
  }

  async function handleCopy() {
    if (!activeType) return;
    const frag = buildGroupCompositionFragment(activeType);
    await Clipboard.setStringAsync(frag);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <Pressable style={m.overlay} onPress={onClose}>
        <Pressable style={[m.sheet, { backgroundColor: C.bg }]} onPress={e => e.stopPropagation()}>

          <View style={[m.handle, { backgroundColor: C.purple }]} />

          {/* Header */}
          <View style={m.header}>
            <View style={{ flex: 1 }}>
              <Text style={m.eyebrow}>AI GROUP COMPOSITION ENGINE · 19 TEMPLATES</Text>
              <Text style={[m.title, { color: C.purple }]}>GROUP DIRECTOR</Text>
            </View>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              {activeType && (
                <TouchableOpacity
                  style={[m.clearBtn, { borderColor: C.border }]}
                  onPress={() => onTypeChange('Z_FLOW_LAYOUT')}
                  activeOpacity={0.8}
                >
                  <Text style={m.clearText}>RESET</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity onPress={onClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                <Feather name="x" size={20} color={C.muted} />
              </TouchableOpacity>
            </View>
          </View>

          {/* AI Analyze bar */}
          <View style={m.analyzeRow}>
            <Text style={{ fontSize: 13 }}>🤖</Text>
            <TextInput
              style={m.analyzeInput}
              placeholder="Describe scene: team charge, battle vs villain..."
              placeholderTextColor={C.muted}
              value={analyzeText}
              onChangeText={setAnalyzeText}
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="done"
              onSubmitEditing={handleAnalyze}
            />
            <TouchableOpacity
              style={[m.analyzeBtn, { backgroundColor: analyzeText.trim() ? C.purple : C.border }]}
              onPress={handleAnalyze}
              activeOpacity={0.8}
            >
              <Text style={m.analyzeBtnText}>AI PICK</Text>
            </TouchableOpacity>
          </View>

          {/* Template horizontal scroller */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={m.cardScroll}
            contentContainerStyle={{ paddingHorizontal: 20, gap: 8 }}
          >
            {ALL_TEMPLATES.map(t => (
              <CompCard
                key={t.type}
                tmpl={t}
                active={activeType === t.type}
                onPress={() => { Haptics.selectionAsync(); onTypeChange(t.type); }}
              />
            ))}
          </ScrollView>

          {/* Detail view */}
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={m.scrollContent}>

            {selected ? (
              <>
                {/* Description + meta chips */}
                <View style={[m.descCard, { borderColor: toneColor + '30', backgroundColor: toneColor + '08' }]}>
                  <Text style={m.descText}>{selected.description}</Text>
                  <View style={m.metaRow}>
                    <View style={[m.chip, { borderColor: toneColor + '50' }]}>
                      <Text style={[m.chipText, { color: toneColor }]}>
                        {selected.cameraAngle.replace(/_/g, ' ')}
                      </Text>
                    </View>
                    <View style={[m.chip, { borderColor: toneColor + '50' }]}>
                      <Text style={[m.chipText, { color: toneColor }]}>
                        {EYE_FLOW_EMOJI[selected.eyeFlowPattern]} {selected.eyeFlowPattern.replace(/_/g, ' ')}
                      </Text>
                    </View>
                    <View style={[m.chip, { borderColor: toneColor + '50' }]}>
                      <Text style={[m.chipText, { color: toneColor }]}>
                        {selected.environmentType.replace(/_/g, ' ')}
                      </Text>
                    </View>
                  </View>
                  <Text style={m.lightText}>💡 {selected.lightingStyle}</Text>
                </View>

                {/* Panel diagram */}
                <PanelDiagram template={selected} />

                {/* Character slots */}
                <Text style={[m.sectionLabel, { color: toneColor }]}>
                  CHARACTER SLOTS ({selected.characterSlots.length})
                </Text>
                {selected.characterSlots.map((slot, i) => (
                  <SlotRow key={i} slot={slot} toneColor={toneColor} />
                ))}

                {/* Copy prompt */}
                <TouchableOpacity
                  style={[m.copyBtn, { borderColor: toneColor, backgroundColor: toneColor + '18' }]}
                  onPress={handleCopy}
                  activeOpacity={0.85}
                >
                  <Feather name={copied ? 'check' : 'copy'} size={14} color={toneColor} />
                  <Text style={[m.copyText, { color: toneColor }]}>
                    {copied ? 'COMPOSITION COPIED' : 'COPY COMPOSITION PROMPT'}
                  </Text>
                </TouchableOpacity>
              </>
            ) : (
              <View style={m.emptyState}>
                <Text style={m.emptyEmoji}>🎬</Text>
                <Text style={m.emptyText}>Select a composition type above{'\n'}or use AI PICK to detect from text</Text>
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
  overlay:      { flex: 1, backgroundColor: '#000000CC', justifyContent: 'flex-end' },
  sheet:        { borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '94%' },
  handle:       { width: 44, height: 4, borderRadius: 2, alignSelf: 'center', marginTop: 10, marginBottom: 4 },
  header:       { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingTop: 8, paddingBottom: 10 },
  eyebrow:      { fontFamily: 'Inter_700Bold', fontSize: 8, color: C.muted, letterSpacing: 1.5, marginBottom: 2 },
  title:        { fontFamily: 'Inter_700Bold', fontSize: 17 },
  clearBtn:     { borderWidth: 1, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 5 },
  clearText:    { fontFamily: 'Inter_700Bold', fontSize: 9, color: C.muted, letterSpacing: 0.8 },
  analyzeRow:   { flexDirection: 'row', alignItems: 'center', gap: 8, marginHorizontal: 20, marginBottom: 12, borderWidth: 1, borderRadius: 10, borderColor: '#2A2420', paddingHorizontal: 12, paddingVertical: 8, backgroundColor: '#161210' },
  analyzeInput: { flex: 1, fontFamily: 'Inter_400Regular', fontSize: 11, color: C.white, paddingVertical: 0 },
  analyzeBtn:   { borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6 },
  analyzeBtnText:{ fontFamily: 'Inter_700Bold', fontSize: 9, color: '#0A0806', letterSpacing: 0.8 },
  cardScroll:   { flexGrow: 0, marginBottom: 12 },
  scrollContent:{ paddingHorizontal: 20, paddingTop: 4 },
  descCard:     { borderWidth: 1, borderRadius: 12, padding: 12, marginBottom: 14 },
  descText:     { fontFamily: 'Inter_400Regular', fontSize: 11, color: C.white, lineHeight: 17, marginBottom: 10 },
  metaRow:      { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 8 },
  chip:         { borderWidth: 1, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 },
  chipText:     { fontFamily: 'Inter_700Bold', fontSize: 9, letterSpacing: 0.6 },
  lightText:    { fontFamily: 'Inter_600SemiBold', fontSize: 10, color: C.muted },
  sectionLabel: { fontFamily: 'Inter_700Bold', fontSize: 10, letterSpacing: 1.5, marginBottom: 8, marginTop: 4 },
  copyBtn:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderWidth: 1, borderRadius: 12, paddingVertical: 14, marginTop: 14 },
  copyText:     { fontFamily: 'Inter_700Bold', fontSize: 12, letterSpacing: 1 },
  emptyState:   { alignItems: 'center', paddingVertical: 60, gap: 12 },
  emptyEmoji:   { fontSize: 44 },
  emptyText:    { fontFamily: 'Inter_400Regular', fontSize: 13, color: C.muted, textAlign: 'center', lineHeight: 20 },
});
