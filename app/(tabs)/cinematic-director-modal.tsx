// ============================================================================
// CINEMATIC DIRECTOR MODAL
// Natural language scene description → live AI interpretation
// Core philosophy: user feels like a MOVIE DIRECTOR, not a settings manager
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

import {
  DETECTION_META,
  buildCinematicDescriptionFragment,
  interpretScene,
  type CameraCard,
  type DetectionResult,
  type TrainingBubble,
} from '@/lib/cinematic-interpreter';

// ── Palette ───────────────────────────────────────────────────────────────────
const C = {
  bg:     '#0A0806',
  bgMid:  '#110E0B',
  card:   '#161210',
  border: '#2A2420',
  white:  '#F5F0E8',
  muted:  '#6B6560',
  gold:   '#FFD600',
  green:  '#22C55E',
  red:    '#E8001C',
};

const PLACEHOLDER =
  'Describe your comic scene...\n\n' +
  'Example:\n' +
  '"A battle-worn warrior leaps toward the viewer\n' +
  'through a thunderstorm while holding a glowing staff.\n' +
  'Low-angle cinematic shot with mountains behind him."';

// ── Detection Chip ─────────────────────────────────────────────────────────────
function DetectionChip({ result, onApply }: {
  result: DetectionResult;
  onApply?: (result: DetectionResult) => void;
}) {
  const meta = DETECTION_META[result.type];
  return (
    <TouchableOpacity
      style={[dc.chip, { borderColor: meta.color + '55', backgroundColor: meta.color + '12' }]}
      onPress={() => onApply?.(result)}
      activeOpacity={0.8}
    >
      <Text style={dc.icon}>{meta.icon}</Text>
      <View style={{ flex: 1 }}>
        <Text style={[dc.type, { color: meta.color }]}>{meta.label}</Text>
        <Text style={dc.value} numberOfLines={1}>{result.detectedValue}</Text>
      </View>
      {onApply && (result.directorCameraId || result.archetypeCategory) && (
        <View style={[dc.applyTag, { borderColor: meta.color + '50' }]}>
          <Text style={[dc.applyText, { color: meta.color }]}>APPLY</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}
const dc = StyleSheet.create({
  chip:      { flexDirection: 'row', alignItems: 'center', gap: 8, borderWidth: 1, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 8, marginBottom: 7 },
  icon:      { fontSize: 16 },
  type:      { fontFamily: 'Inter_700Bold', fontSize: 8, letterSpacing: 1.2, marginBottom: 2 },
  value:     { fontFamily: 'Inter_600SemiBold', fontSize: 12, color: '#F5F0E8' },
  applyTag:  { borderWidth: 1, borderRadius: 6, paddingHorizontal: 6, paddingVertical: 3 },
  applyText: { fontFamily: 'Inter_700Bold', fontSize: 8, letterSpacing: 0.8 },
});

// ── Camera Recommendation Card ─────────────────────────────────────────────────
function CamRecoCard({ card, onUse }: { card: CameraCard; onUse: (id: string) => void }) {
  return (
    <TouchableOpacity
      style={cc.card}
      onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); onUse(card.directorCameraId); }}
      activeOpacity={0.85}
    >
      <View style={cc.top}>
        <Text style={cc.emoji}>📷</Text>
        <View style={{ flex: 1 }}>
          <Text style={cc.name}>{card.cameraType}</Text>
          <Text style={cc.emotion}>{card.emotion}</Text>
        </View>
        <View style={cc.useBtn}>
          <Text style={cc.useBtnText}>USE</Text>
        </View>
      </View>
      <Text style={cc.explanation} numberOfLines={2}>{card.explanation}</Text>
    </TouchableOpacity>
  );
}
const cc = StyleSheet.create({
  card:        { borderWidth: 1, borderColor: '#38BDF840', borderRadius: 12, padding: 12, marginBottom: 8, backgroundColor: '#38BDF808' },
  top:         { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 6 },
  emoji:       { fontSize: 20 },
  name:        { fontFamily: 'Inter_700Bold', fontSize: 12, color: '#38BDF8', marginBottom: 2 },
  emotion:     { fontFamily: 'Inter_600SemiBold', fontSize: 9, color: '#6B6560', letterSpacing: 0.8 },
  useBtn:      { borderWidth: 1, borderColor: '#38BDF855', borderRadius: 7, paddingHorizontal: 8, paddingVertical: 5 },
  useBtnText:  { fontFamily: 'Inter_700Bold', fontSize: 9, color: '#38BDF8', letterSpacing: 0.8 },
  explanation: { fontFamily: 'Inter_400Regular', fontSize: 10, color: '#6B6560', lineHeight: 15 },
});

// ── Training Bubble ────────────────────────────────────────────────────────────
function TipBubble({ bubble }: { bubble: TrainingBubble }) {
  return (
    <View style={[tb.bubble, { borderColor: bubble.important ? C.gold + '50' : C.border, backgroundColor: bubble.important ? C.gold + '08' : '#14100A' }]}>
      <View style={tb.top}>
        <Text style={tb.icon}>{bubble.important ? '⚡' : '💡'}</Text>
        <Text style={[tb.title, { color: bubble.important ? C.gold : '#94A3B8' }]}>{bubble.title}</Text>
      </View>
      <Text style={tb.message}>{bubble.message}</Text>
    </View>
  );
}
const tb = StyleSheet.create({
  bubble:  { borderWidth: 1, borderRadius: 10, padding: 10, marginBottom: 7 },
  top:     { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 5 },
  icon:    { fontSize: 13 },
  title:   { fontFamily: 'Inter_700Bold', fontSize: 11, letterSpacing: 0.3 },
  message: { fontFamily: 'Inter_400Regular', fontSize: 11, color: '#6B6560', lineHeight: 16 },
});

// ── Detection score bar ────────────────────────────────────────────────────────
function DirectorScore({ count }: { count: number }) {
  const score = Math.min(count, 8);
  const pct   = (score / 8) * 100;
  const color = score >= 6 ? C.green : score >= 3 ? C.gold : '#6B6560';
  const label = score >= 7 ? 'DIRECTOR QUALITY'
              : score >= 5 ? 'STRONG SCENE'
              : score >= 3 ? 'DEVELOPING'
              : 'ADD MORE DETAIL';
  return (
    <View style={ds.row}>
      <View style={ds.track}>
        <View style={[ds.fill, { width: `${pct}%` as any, backgroundColor: color }]} />
      </View>
      <Text style={[ds.label, { color }]}>{label}</Text>
    </View>
  );
}
const ds = StyleSheet.create({
  row:   { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 14 },
  track: { flex: 1, height: 4, backgroundColor: '#2A2420', borderRadius: 2, overflow: 'hidden' },
  fill:  { height: '100%', borderRadius: 2 },
  label: { fontFamily: 'Inter_700Bold', fontSize: 9, letterSpacing: 1, width: 120, textAlign: 'right' },
});

// ── CinematicDirectorModal ────────────────────────────────────────────────────
export default function CinematicDirectorModal({
  visible,
  onClose,
  onApplyCameraId,
  onApplyArchetypeCategory,
  onApplyDescription,
}: {
  visible: boolean;
  onClose: () => void;
  onApplyCameraId: (id: string) => void;
  onApplyArchetypeCategory: (cat: string) => void;
  onApplyDescription: (desc: string, fragment: string) => void;
}) {
  const [description, setDescription] = useState('');
  const [copied, setCopied] = useState(false);

  // Live interpretation — recomputes on every keystroke
  const interpretation = useMemo(
    () => (description.trim().length > 2 ? interpretScene(description) : null),
    [description],
  );

  const detections  = interpretation?.detections  ?? [];
  const bubbles     = interpretation?.bubbles     ?? [];
  const cameraCards = interpretation?.cameraCards  ?? [];

  function handleApplyDetection(result: DetectionResult) {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (result.directorCameraId)   { onApplyCameraId(result.directorCameraId); }
    if (result.archetypeCategory)  { onApplyArchetypeCategory(result.archetypeCategory); }
  }

  function handleApplyAll() {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    // Apply first camera detection
    const camDetection = detections.find(d => d.type === 'CAMERA' && d.directorCameraId);
    if (camDetection?.directorCameraId) onApplyCameraId(camDetection.directorCameraId);
    // Apply first action detection (category)
    const actDetection = detections.find(d => d.type === 'ACTION' && d.archetypeCategory);
    if (actDetection?.archetypeCategory) onApplyArchetypeCategory(actDetection.archetypeCategory);
    // Pass full description fragment
    const fragment = buildCinematicDescriptionFragment(description, detections);
    onApplyDescription(description, fragment);
    onClose();
  }

  async function handleCopy() {
    if (!description.trim()) return;
    const fragment = buildCinematicDescriptionFragment(description, detections);
    await Clipboard.setStringAsync(fragment);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const hasContent = description.trim().length > 2;

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <Pressable style={m.overlay} onPress={onClose}>
        <Pressable style={[m.sheet, { backgroundColor: C.bg }]} onPress={e => e.stopPropagation()}>

          <View style={[m.handle, { backgroundColor: C.gold }]} />

          {/* Header */}
          <View style={m.header}>
            <View style={{ flex: 1 }}>
              <Text style={m.eyebrow}>AI CINEMATIC INTERPRETER · LIVE DETECTION</Text>
              <Text style={m.title}>CINEMATIC DIRECTOR</Text>
            </View>
            <TouchableOpacity onPress={onClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Feather name="x" size={20} color={C.muted} />
            </TouchableOpacity>
          </View>

          {/* Philosophy strip */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={m.philoRow}
          >
            {['✔ Movie Director', '✔ Comic Storyteller', '✔ Cinematic Creator'].map(label => (
              <View key={label} style={m.philoChip}>
                <Text style={m.philoText}>{label}</Text>
              </View>
            ))}
          </ScrollView>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={m.scrollContent} keyboardShouldPersistTaps="handled">

            {/* Description box */}
            <View style={[m.descBox, { borderColor: hasContent ? C.gold + '60' : C.border }]}>
              <TextInput
                style={m.descInput}
                multiline
                numberOfLines={6}
                placeholder={PLACEHOLDER}
                placeholderTextColor={C.muted}
                value={description}
                onChangeText={setDescription}
                autoCapitalize="sentences"
                autoCorrect
                textAlignVertical="top"
              />
              {description.length > 0 && (
                <TouchableOpacity
                  style={m.clearDesc}
                  onPress={() => setDescription('')}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Feather name="x" size={14} color={C.muted} />
                </TouchableOpacity>
              )}
            </View>

            {/* Auto-detect label */}
            {!hasContent && (
              <View style={m.autoDetectRow}>
                {['Character', 'Pose', 'Camera Angle', 'Lighting', 'Environment', 'Composition', 'Emotional Tone', 'Motion', 'Weapon'].map(item => (
                  <View key={item} style={m.autoChip}>
                    <Text style={m.autoText}>✓ {item}</Text>
                  </View>
                ))}
              </View>
            )}

            {/* Live results */}
            {hasContent && interpretation && (
              <>
                {/* Director score */}
                <DirectorScore count={detections.length} />

                {/* Detections */}
                {detections.length > 0 && (
                  <>
                    <Text style={m.sectionLabel}>AI DETECTED ({detections.length})</Text>
                    {detections.map((result, i) => (
                      <DetectionChip
                        key={i}
                        result={result}
                        onApply={handleApplyDetection}
                      />
                    ))}
                  </>
                )}

                {/* Camera recommendations */}
                {cameraCards.length > 0 && (
                  <>
                    <Text style={m.sectionLabel}>RECOMMENDED CAMERA SHOTS</Text>
                    {cameraCards.map((card, i) => (
                      <CamRecoCard
                        key={i}
                        card={card}
                        onUse={id => { onApplyCameraId(id); Haptics.selectionAsync(); }}
                      />
                    ))}
                  </>
                )}

                {/* Training bubbles */}
                {bubbles.length > 0 && (
                  <>
                    <Text style={m.sectionLabel}>DIRECTOR TIPS</Text>
                    {bubbles.map((b, i) => <TipBubble key={i} bubble={b} />)}
                  </>
                )}

                {/* Action row */}
                <View style={m.actionRow}>
                  <TouchableOpacity
                    style={[m.copyBtn, { borderColor: C.border }]}
                    onPress={handleCopy}
                    activeOpacity={0.85}
                  >
                    <Feather name={copied ? 'check' : 'copy'} size={13} color={C.muted} />
                    <Text style={m.copyText}>{copied ? 'COPIED' : 'COPY PROMPT'}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[m.applyAllBtn, { backgroundColor: C.gold, opacity: hasContent ? 1 : 0.4 }]}
                    onPress={handleApplyAll}
                    disabled={!hasContent}
                    activeOpacity={0.85}
                  >
                    <Text style={m.applyAllText}>APPLY TO DIRECTOR</Text>
                    <Feather name="arrow-right" size={14} color={C.bg} />
                  </TouchableOpacity>
                </View>
              </>
            )}

            <View style={{ height: 40 }} />
          </ScrollView>

        </Pressable>
      </Pressable>
    </Modal>
  );
}

const m = StyleSheet.create({
  overlay:       { flex: 1, backgroundColor: '#000000CC', justifyContent: 'flex-end' },
  sheet:         { borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '94%' },
  handle:        { width: 44, height: 4, borderRadius: 2, alignSelf: 'center', marginTop: 10, marginBottom: 4 },
  header:        { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingTop: 8, paddingBottom: 8 },
  eyebrow:       { fontFamily: 'Inter_700Bold', fontSize: 8, color: '#6B6560', letterSpacing: 1.5, marginBottom: 2 },
  title:         { fontFamily: 'Inter_700Bold', fontSize: 17, color: '#FFD600' },
  philoRow:      { paddingHorizontal: 20, gap: 6, marginBottom: 10 },
  philoChip:     { borderWidth: 1, borderColor: '#22C55E40', borderRadius: 8, paddingHorizontal: 9, paddingVertical: 5, backgroundColor: '#22C55E0C' },
  philoText:     { fontFamily: 'Inter_600SemiBold', fontSize: 10, color: '#22C55E' },
  scrollContent: { paddingHorizontal: 20, paddingBottom: 20 },
  descBox:       { borderWidth: 1.5, borderRadius: 14, padding: 14, marginBottom: 12, backgroundColor: '#161210', position: 'relative' },
  descInput:     { fontFamily: 'Inter_400Regular', fontSize: 13, color: '#F5F0E8', lineHeight: 20, minHeight: 120 },
  clearDesc:     { position: 'absolute', top: 12, right: 12 },
  autoDetectRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 14 },
  autoChip:      { borderWidth: 1, borderColor: '#2A2420', borderRadius: 7, paddingHorizontal: 8, paddingVertical: 4 },
  autoText:      { fontFamily: 'Inter_400Regular', fontSize: 10, color: '#6B6560' },
  sectionLabel:  { fontFamily: 'Inter_700Bold', fontSize: 10, color: '#6B6560', letterSpacing: 1.5, marginBottom: 8, marginTop: 6 },
  actionRow:     { flexDirection: 'row', gap: 10, marginTop: 10 },
  copyBtn:       { flexDirection: 'row', alignItems: 'center', gap: 6, borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 12 },
  copyText:      { fontFamily: 'Inter_700Bold', fontSize: 9, color: '#6B6560', letterSpacing: 0.8 },
  applyAllBtn:   { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderRadius: 10, paddingVertical: 13 },
  applyAllText:  { fontFamily: 'Inter_700Bold', fontSize: 12, color: '#0A0806', letterSpacing: 0.8 },
});
