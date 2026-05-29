import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Alert,
  Animated,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  GENRE_PRESETS,
  LEARN_TRIGGERS,
  MEMORY_CATEGORY_META,
  RECALL_TRIGGERS,
  STYLE_CATEGORIES,
  USER_TRAINING_GUIDE,
  VISUAL_PRINCIPLES,
  buildStyleVectorPrompt,
  deleteCharacterDNA,
  deleteCompositionPattern,
  deleteEnvironmentStyle,
  deleteLightingSignature,
  deletePoseArchetype,
  deleteStyleProfile,
  detectLearnTrigger,
  detectRecallTrigger,
  parseStudyIntent,
  getMemoryBank,
  getTotalCount,
  saveStyleProfile,
  type MemoryBank,
  type MemoryCategory,
  type StyleVector,
} from '@/lib/visual-memory-bank';

// ── Palette ───────────────────────────────────────────────────────────────────
const C = {
  bg:     '#0A0806',
  card:   '#161210',
  card2:  '#1E1A14',
  border: '#2A2420',
  gold:   '#FFD600',
  goldDim:'#C4913A',
  red:    '#E8001C',
  muted:  '#6B6560',
  ink:    '#F5EDD6',
  green:  '#22C55E',
  purple: '#A78BFA',
  orange: '#F97316',
  blue:   '#38BDF8',
};

// ── Pipeline step labels ──────────────────────────────────────────────────────
const PIPELINE = [
  { id: 'upload',     label: 'Image Upload',           icon: '📤' },
  { id: 'preprocess', label: 'OpenCV Preprocessing',   icon: '🔬' },
  { id: 'clip',       label: 'CLIP Embedding',          icon: '🧬' },
  { id: 'extract',    label: 'Style Extraction',        icon: '🎨' },
  { id: 'classify',   label: 'Style Classification',    icon: '🏷️' },
  { id: 'keywords',   label: 'Keyword Assignment',      icon: '🔑' },
  { id: 'store',      label: 'Saved To Memory Bank',    icon: '💾' },
];

const CATEGORIES: MemoryCategory[] = [
  'styleProfiles', 'characterDNA', 'lightingSignatures',
  'poseArchetypes', 'environmentStyles', 'brushSystems', 'compositionPatterns',
];

// ── Pipeline animation component ──────────────────────────────────────────────
function PipelineVisualizer({ activeStep }: { activeStep: number }) {
  return (
    <View style={pv.root}>
      {PIPELINE.map((step, i) => {
        const done    = i < activeStep;
        const active  = i === activeStep;
        const pending = i > activeStep;
        return (
          <View key={step.id} style={pv.row}>
            <View style={[pv.dot, done && pv.dotDone, active && pv.dotActive]}>
              <Text style={{ fontSize: 10 }}>{done ? '✓' : step.icon}</Text>
            </View>
            <Text style={[pv.label, done && pv.labelDone, active && pv.labelActive, pending && pv.labelPending]}>
              {step.label}
            </Text>
            {active && (
              <View style={pv.activePulse}>
                <Text style={pv.activePulseText}>PROCESSING</Text>
              </View>
            )}
            {done && <Text style={pv.doneTag}>✓</Text>}
          </View>
        );
      })}
    </View>
  );
}

const pv = StyleSheet.create({
  root:         { backgroundColor: C.card, borderRadius: 14, borderWidth: 1, borderColor: C.border, padding: 14, gap: 10, marginBottom: 16 },
  row:          { flexDirection: 'row', alignItems: 'center', gap: 10 },
  dot:          { width: 28, height: 28, borderRadius: 14, borderWidth: 1, borderColor: C.muted, backgroundColor: C.card2, alignItems: 'center', justifyContent: 'center' },
  dotDone:      { borderColor: C.green, backgroundColor: C.green + '20' },
  dotActive:    { borderColor: C.gold, backgroundColor: C.gold + '20' },
  label:        { flex: 1, fontSize: 12, fontFamily: 'Inter_600SemiBold', color: C.muted },
  labelDone:    { color: C.green },
  labelActive:  { color: C.gold },
  labelPending: { color: C.muted },
  activePulse:  { backgroundColor: C.gold + '22', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 2 },
  activePulseText: { fontSize: 8, fontFamily: 'Inter_700Bold', color: C.gold, letterSpacing: 1 },
  doneTag:      { fontSize: 11, color: C.green, fontFamily: 'Inter_700Bold' },
});

// ── Style Vector card ─────────────────────────────────────────────────────────
function StyleVectorCard({
  sv, onDelete, onRecall,
}: { sv: StyleVector; onDelete: () => void; onRecall: () => void }) {
  const [expanded, setExpanded] = useState(false);
  const meters = [
    { label: 'Line Variation',    val: sv.lineStyle.variation,    color: C.gold },
    { label: 'Edge Sharpness',    val: sv.lineStyle.edgeSharpness, color: C.goldDim },
    { label: 'Heroic Scale',      val: sv.anatomy.heroicScale,    color: C.red },
    { label: 'Muscle Definition', val: sv.anatomy.muscleDefinition, color: C.orange },
    { label: 'Contrast',          val: sv.lighting.contrast,      color: C.purple },
    { label: 'Saturation',        val: sv.color.saturation,       color: C.blue },
    { label: 'Panel Energy',      val: sv.composition.panelEnergy, color: C.green },
    ...(sv.motion ? [
      { label: 'Pose Energy',   val: sv.motion.poseEnergy, color: '#FF6B35' },
      { label: 'Motion Blur',   val: sv.motion.motionBlur, color: '#9B59B6' },
    ] : []),
    ...(sv.environment ? [
      { label: 'Env Density', val: sv.environment.density, color: C.green },
    ] : []),
  ];

  return (
    <View style={sc.card}>
      <TouchableOpacity activeOpacity={0.8} onPress={() => setExpanded(e => !e)}>
        <View style={sc.header}>
          <View style={{ flex: 1 }}>
            <Text style={sc.name}>{sv.name}</Text>
            <Text style={sc.sub}>
              {sv.classifiedRenderLanguage?.replace(/_/g, ' ')} · {sv.classifiedGenre} · {sv.classifiedMood}
            </Text>
          </View>
          <Feather name={expanded ? 'chevron-up' : 'chevron-down'} size={16} color={C.muted} />
        </View>

        {/* Keywords */}
        <View style={sc.keywords}>
          {sv.keywords.slice(0, 4).map(k => (
            <View key={k} style={sc.kw}><Text style={sc.kwText}>{k}</Text></View>
          ))}
        </View>

        {/* Mini meters */}
        <View style={sc.meters}>
          {meters.map(m => (
            <View key={m.label} style={sc.meterRow}>
              <Text style={sc.meterLabel}>{m.label}</Text>
              <View style={sc.meterTrack}>
                <View style={[sc.meterFill, { width: `${Math.round(m.val * 100)}%` as any, backgroundColor: m.color }]} />
              </View>
              <Text style={[sc.meterPct, { color: m.color }]}>{Math.round(m.val * 100)}%</Text>
            </View>
          ))}
        </View>
      </TouchableOpacity>

      {/* Expanded detail */}
      {expanded && (
        <View style={sc.detail}>
          <View style={sc.detailGrid}>
            <DetailChip label="Line Weight"  value={sv.lineStyle.weight} />
            <DetailChip label="Inking"       value={sv.lineStyle.inkingStyle.replace(/_/g,' ')} />
            <DetailChip label="Stylization"  value={sv.anatomy.stylization} />
            <DetailChip label="Head Ratio"   value={sv.anatomy.headRatio.replace(/_/g,' ')} />
            <DetailChip label="Shadow"       value={sv.lighting.shadowType} />
            <DetailChip label="Lighting"     value={sv.lighting.lightingStyle} />
            <DetailChip label="Rim Light"    value={sv.lighting.rimLight ? 'Yes' : 'No'} />
            <DetailChip label="Temperature"  value={sv.color.temperature} />
            <DetailChip label="Color Style"  value={sv.color.style.replace(/_/g,' ')} />
            <DetailChip label="Camera"       value={sv.composition.cameraAngle.replace(/_/g,' ')} />
            <DetailChip label="Motion Flow"  value={sv.composition.motionFlow} />
          </View>
          {sv.color.palette.length > 0 && (
            <View style={sc.paletteRow}>
              <Text style={sc.meterLabel}>PALETTE</Text>
              <View style={{ flexDirection: 'row', gap: 6 }}>
                {sv.color.palette.map(hex => (
                  <View key={hex} style={[sc.swatch, { backgroundColor: hex }]} />
                ))}
              </View>
            </View>
          )}
          {/* Motion block */}
          {sv.motion && (
            <View style={{ marginBottom: 8 }}>
              <Text style={[sc.meterLabel, { marginBottom: 6 }]}>MOTION DNA</Text>
              <View style={sc.detailGrid}>
                <DetailChip label="Speed Lines"   value={sv.motion.speedLines ? 'Yes' : 'No'} />
                <DetailChip label="Impact Frames" value={sv.motion.impactFrames ? 'Yes' : 'No'} />
                <DetailChip label="Choreography"  value={sv.motion.choreography} />
              </View>
            </View>
          )}

          {/* Environment block */}
          {sv.environment && (
            <View style={{ marginBottom: 8 }}>
              <Text style={[sc.meterLabel, { marginBottom: 6 }]}>ENVIRONMENT DNA</Text>
              <View style={sc.detailGrid}>
                <DetailChip label="Atmosphere"    value={sv.environment.atmosphere} />
                <DetailChip label="Time of Day"   value={sv.environment.timeOfDay} />
                <DetailChip label="Architecture"  value={sv.environment.architectureStyle.replace(/_/g,' ')} />
              </View>
              {sv.environment.weatherFX.length > 0 && (
                <Text style={[sc.meterLabel, { marginTop: 4 }]}>FX: {sv.environment.weatherFX.join(' · ')}</Text>
              )}
            </View>
          )}

          {/* Learned patterns */}
          {sv.learnedPatterns && sv.learnedPatterns.length > 0 && (
            <View style={{ marginBottom: 8 }}>
              <Text style={[sc.meterLabel, { marginBottom: 6 }]}>LEARNED PATTERNS</Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 5 }}>
                {sv.learnedPatterns.map(p => (
                  <View key={p} style={[sc.kw, { borderColor: C.green + '40', backgroundColor: C.green + '10' }]}>
                    <Text style={[sc.kwText, { color: C.green }]}>{p.replace(/_/g,' ')}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {sv.trainingIntent && (
            <View style={{ marginBottom: 8, backgroundColor: C.gold + '10', borderRadius: 8, padding: 8, borderWidth: 1, borderColor: C.gold + '30' }}>
              <Text style={[sc.meterLabel, { color: C.gold, marginBottom: 2 }]}>TRAINING INTENT</Text>
              <Text style={{ fontSize: 11, color: C.ink, fontFamily: 'Inter_400Regular' }}>{sv.trainingIntent}</Text>
            </View>
          )}

          <Text style={[sc.meterLabel, { marginTop: 4, marginBottom: 4 }]}>VECTOR EMBEDDING (64-dim)</Text>
          <Text style={sc.embedPreview} numberOfLines={2}>
            [{sv.embedding.slice(0, 12).map(v => v.toFixed(3)).join(', ')} ...]
          </Text>
        </View>
      )}

      {/* Actions */}
      <View style={sc.actions}>
        <TouchableOpacity style={sc.recallBtn} onPress={onRecall} activeOpacity={0.8}>
          <Feather name="zap" size={12} color={C.gold} />
          <Text style={sc.recallText}>USE STYLE</Text>
        </TouchableOpacity>
        <TouchableOpacity style={sc.deleteBtn} onPress={onDelete} activeOpacity={0.8}>
          <Feather name="trash-2" size={12} color={C.red} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

function DetailChip({ label, value }: { label: string; value: string }) {
  return (
    <View style={sc.detailChip}>
      <Text style={sc.detailKey}>{label}</Text>
      <Text style={sc.detailVal}>{value}</Text>
    </View>
  );
}

const sc = StyleSheet.create({
  card:        { backgroundColor: C.card, borderRadius: 14, borderWidth: 1, borderColor: C.border, marginBottom: 10, overflow: 'hidden' },
  header:      { flexDirection: 'row', alignItems: 'flex-start', gap: 10, padding: 14, paddingBottom: 8 },
  name:        { fontSize: 14, fontFamily: 'Inter_700Bold', color: C.ink, marginBottom: 2 },
  sub:         { fontSize: 10, fontFamily: 'Inter_400Regular', color: C.muted, letterSpacing: 0.5 },
  keywords:    { flexDirection: 'row', flexWrap: 'wrap', gap: 5, paddingHorizontal: 14, marginBottom: 10 },
  kw:          { backgroundColor: C.gold + '14', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3, borderWidth: 1, borderColor: C.gold + '30' },
  kwText:      { fontSize: 9, fontFamily: 'Inter_600SemiBold', color: C.gold, letterSpacing: 0.5 },
  meters:      { paddingHorizontal: 14, gap: 5, marginBottom: 12 },
  meterRow:    { flexDirection: 'row', alignItems: 'center', gap: 8 },
  meterLabel:  { fontSize: 9, color: C.muted, fontFamily: 'Inter_400Regular', width: 110 },
  meterTrack:  { flex: 1, height: 4, backgroundColor: C.border, borderRadius: 2, overflow: 'hidden' },
  meterFill:   { height: '100%', borderRadius: 2 },
  meterPct:    { fontSize: 9, fontFamily: 'Inter_700Bold', width: 28, textAlign: 'right' },
  detail:      { paddingHorizontal: 14, paddingBottom: 12, borderTopWidth: 1, borderTopColor: C.border, paddingTop: 12 },
  detailGrid:  { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 10 },
  detailChip:  { backgroundColor: C.card2, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4, borderWidth: 1, borderColor: C.border },
  detailKey:   { fontSize: 8, color: C.muted, fontFamily: 'Inter_600SemiBold', letterSpacing: 0.5 },
  detailVal:   { fontSize: 10, color: C.ink, fontFamily: 'Inter_700Bold', marginTop: 1 },
  paletteRow:  { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 },
  swatch:      { width: 20, height: 20, borderRadius: 10, borderWidth: 1, borderColor: C.border },
  embedPreview:{ fontSize: 9, color: C.muted, fontFamily: 'Inter_400Regular', backgroundColor: C.card2, borderRadius: 6, padding: 8, lineHeight: 14 },
  actions:     { flexDirection: 'row', gap: 8, padding: 10, paddingTop: 0 },
  recallBtn:   { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: C.gold + '14', borderRadius: 10, paddingVertical: 9, borderWidth: 1, borderColor: C.gold + '30' },
  recallText:  { fontSize: 10, fontFamily: 'Inter_700Bold', color: C.gold, letterSpacing: 1 },
  deleteBtn:   { width: 38, height: 38, borderRadius: 10, backgroundColor: C.red + '12', borderWidth: 1, borderColor: C.red + '30', alignItems: 'center', justifyContent: 'center' },
});

// ── Category empty state ──────────────────────────────────────────────────────
function EmptyCategory({ label, icon }: { label: string; icon: string }) {
  return (
    <View style={{ alignItems: 'center', padding: 32, gap: 8 }}>
      <Text style={{ fontSize: 32 }}>{icon}</Text>
      <Text style={{ fontSize: 12, color: C.muted, fontFamily: 'Inter_400Regular', textAlign: 'center' }}>
        No {label} saved yet.{'\n'}Upload an image to analyze and store a style.
      </Text>
    </View>
  );
}

// ── Main Screen ───────────────────────────────────────────────────────────────
export default function VisualMemoryBankScreen() {
  const insets = useSafeAreaInsets();

  const [bank, setBank]             = useState<MemoryBank | null>(null);
  const [activeCategory, setActiveCat] = useState<MemoryCategory>('styleProfiles');

  // Upload + analysis state
  const [pickedUri, setPickedUri]   = useState<string | null>(null);
  const [pickedB64, setPickedB64]   = useState<string | null>(null);
  const [styleName, setStyleName]   = useState('');
  const [userIntent, setUserIntent] = useState('');
  const [analyzing, setAnalyzing]   = useState(false);
  const [pipelineStep, setPipelineStep] = useState(-1);
  const [lastRecalled, setLastRecalled] = useState<StyleVector | null>(null);
  const [guideExpanded, setGuideExpanded] = useState(false);
  const [presetsExpanded, setPresetsExpanded] = useState(true);

  // Trigger input
  const [triggerText, setTriggerText] = useState('');
  const [triggerMatch, setTriggerMatch] = useState<'learn' | 'recall' | null>(null);

  // Blend state
  const [blendA, setBlendA]         = useState<StyleVector | null>(null);
  const [blendB, setBlendB]         = useState<StyleVector | null>(null);
  const [blendRatio, setBlendRatio] = useState(0.5);
  const [blendName, setBlendName]   = useState('');
  const [blending, setBlending]     = useState(false);
  const [blendPickingFor, setBlendPickingFor] = useState<'A' | 'B' | null>(null);

  const resultAnim = useRef(new Animated.Value(0)).current;

  const reloadBank = useCallback(async () => {
    setBank(await getMemoryBank());
  }, []);

  useEffect(() => { reloadBank(); }, [reloadBank]);

  // Trigger phrase detection
  useEffect(() => {
    if (!triggerText.trim()) { setTriggerMatch(null); return; }
    if (detectLearnTrigger(triggerText))  { setTriggerMatch('learn');  return; }
    if (detectRecallTrigger(triggerText)) { setTriggerMatch('recall'); return; }
    setTriggerMatch(null);
  }, [triggerText]);

  async function pickImage() {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Allow photo access to upload images.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.85,
      base64: true,
      allowsEditing: false,
    });
    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      setPickedUri(asset.uri);
      setPickedB64(asset.base64 ?? null);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
  }

  async function runAnalysis() {
    if (!pickedB64) return;
    setAnalyzing(true);
    setPipelineStep(0);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);

    try {
      // Simulate step progression while API processes
      for (let s = 1; s <= 4; s++) {
        await new Promise(r => setTimeout(r, 600));
        setPipelineStep(s);
      }

      const resp = await fetch('/api/style/analyze-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64: pickedB64,
          mimeType: 'image/jpeg',
          name: styleName.trim() || 'Untitled Style',
          userIntent: userIntent.trim(),
        }),
      });

      setPipelineStep(5);
      await new Promise(r => setTimeout(r, 400));
      setPipelineStep(6);

      const data = await resp.json() as { success: boolean; styleVector: Omit<StyleVector, 'profileId' | 'createdAt'>; error?: string };
      if (!data.success) throw new Error(data.error ?? 'Analysis failed');

      const saved = await saveStyleProfile({
        ...data.styleVector,
        sourceImageUri: pickedUri ?? undefined,
      });

      await reloadBank();
      setActiveCat('styleProfiles');
      setPickedUri(null);
      setPickedB64(null);
      setStyleName('');
      setPipelineStep(7);

      resultAnim.setValue(0);
      Animated.spring(resultAnim, { toValue: 1, useNativeDriver: true, tension: 60, friction: 10 }).start();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('Style Learned!', `"${saved.name}" saved to Visual Memory Bank.`);
    } catch (err: any) {
      Alert.alert('Analysis failed', err.message ?? 'Please try again.');
      setPipelineStep(-1);
    } finally {
      setAnalyzing(false);
    }
  }

  async function runBlend() {
    if (!blendA || !blendB) return;
    setBlending(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    try {
      const resp = await fetch('/api/style/blend-styles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          styleA: blendA,
          styleB: blendB,
          ratio: blendRatio,
          name: blendName.trim() || `${blendA.name} × ${blendB.name}`,
        }),
      });
      const data = await resp.json() as { success: boolean; blended: Omit<StyleVector, 'profileId' | 'createdAt'>; error?: string };
      if (!data.success) throw new Error(data.error ?? 'Blend failed');
      const saved = await saveStyleProfile(data.blended);
      await reloadBank();
      setActiveCat('styleProfiles');
      setBlendA(null); setBlendB(null); setBlendName('');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('Hybrid Style Created!', `"${saved.name}" blended at ${Math.round(blendRatio * 100)}% B.`);
    } catch (err: any) {
      Alert.alert('Blend failed', err.message ?? 'Please try again.');
    } finally {
      setBlending(false);
    }
  }

  function handleRecall(sv: StyleVector) {
    setLastRecalled(sv);
    const prompt = buildStyleVectorPrompt(sv);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    Alert.alert(
      `Style Recalled: ${sv.name}`,
      prompt.slice(0, 200) + '…',
      [{ text: 'Copy & Use', onPress: () => {} }, { text: 'OK' }],
    );
  }

  async function handleDelete(category: MemoryCategory, profileId: string) {
    Alert.alert('Delete Profile', 'Remove this from your Memory Bank?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive',
        onPress: async () => {
          const deleteFns: Record<MemoryCategory, (id: string) => Promise<void>> = {
            styleProfiles:       deleteStyleProfile,
            characterDNA:        deleteCharacterDNA,
            lightingSignatures:  deleteLightingSignature,
            poseArchetypes:      deletePoseArchetype,
            environmentStyles:   deleteEnvironmentStyle,
            brushSystems:        (id) => import('@/lib/visual-memory-bank').then(m => m.deleteBrushSystem(id)),
            compositionPatterns: deleteCompositionPattern,
          };
          await deleteFns[category](profileId);
          await reloadBank();
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        },
      },
    ]);
  }

  const totalCount = bank ? getTotalCount(bank) : 0;

  return (
    <View style={[s.root, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
          <Feather name="arrow-left" size={20} color={C.ink} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={s.title}>🧠 Visual Memory Bank</Text>
          <Text style={s.sub}>AI Style Learning System · {totalCount} profiles stored</Text>
        </View>
        <View style={[s.countBadge, { borderColor: C.gold }]}>
          <Text style={[s.countText, { color: C.gold }]}>{totalCount}</Text>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scroll}>

        {/* ── AI Training Guide ── */}
        <TouchableOpacity
          style={s.guideHeader}
          onPress={() => { setGuideExpanded(e => !e); Haptics.selectionAsync(); }}
          activeOpacity={0.8}
        >
          <Text style={{ fontSize: 18 }}>📖</Text>
          <Text style={s.guideHeaderText}>AI TRAINING GUIDE</Text>
          <Feather name={guideExpanded ? 'chevron-up' : 'chevron-down'} size={14} color={C.muted} />
        </TouchableOpacity>
        {guideExpanded && (
          <View style={s.guideBody}>
            <Text style={s.guideSub}>HOW TO TRAIN THE AI</Text>
            <Text style={s.guideIntro}>{USER_TRAINING_GUIDE.intro}</Text>

            <Text style={[s.guideSub, { marginTop: 10 }]}>UPLOAD RULES</Text>
            {USER_TRAINING_GUIDE.uploadRules.map((r, i) => (
              <Text key={i} style={s.guideLine}>· {r}</Text>
            ))}

            <Text style={[s.guideSub, { marginTop: 10 }]}>TRAINING COMMANDS</Text>
            {USER_TRAINING_GUIDE.trainingCommands.map((c, i) => (
              <View key={i} style={s.guideCommand}>
                <Text style={s.guideCommandText}>"{c}"</Text>
              </View>
            ))}

            <Text style={[s.guideSub, { marginTop: 10 }]}>BEST PRACTICES</Text>
            {USER_TRAINING_GUIDE.bestPractices.map((p, i) => (
              <Text key={i} style={s.guideLine}>✓ {p}</Text>
            ))}

            <Text style={[s.guideSub, { marginTop: 10 }]}>EXAMPLE SESSIONS</Text>
            {USER_TRAINING_GUIDE.trainingExamples.map((ex, i) => (
              <View key={i} style={s.guideExample}>
                <Text style={s.guideExampleText}>{ex}</Text>
              </View>
            ))}
          </View>
        )}

        {/* ── 10 Genre Presets ── */}
        <View style={s.section}>
          <TouchableOpacity
            style={s.presetsHeader}
            onPress={() => { setPresetsExpanded(e => !e); Haptics.selectionAsync(); }}
            activeOpacity={0.8}
          >
            <Text style={{ fontSize: 16 }}>🎬</Text>
            <Text style={s.presetsHeaderText}>10 COMIC GENRE PRESETS</Text>
            <Text style={s.presetsHeaderSub}>Tap to load style DNA template</Text>
            <Feather name={presetsExpanded ? 'chevron-up' : 'chevron-down'} size={14} color={C.muted} />
          </TouchableOpacity>
          {presetsExpanded && (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginHorizontal: -16 }}>
              <View style={s.presetRow}>
                {GENRE_PRESETS.map((preset, i) => {
                  const colors = ['#FFD600','#FF4500','#00D4FF','#8B0000','#00F5FF','#7B68EE','#F0E68C','#FFB7C5','#FF6B35','#8B7355'];
                  const icons  = ['🦸','🥷','🏛️','🧙','🚀','🎭','🤘','💕','⚡','🎨'];
                  const col = colors[i % colors.length];
                  return (
                    <TouchableOpacity
                      key={preset.name}
                      style={[s.presetCard, { borderColor: col + '60' }]}
                      activeOpacity={0.8}
                      onPress={async () => {
                        const dummyEmbedding = Array.from({ length: 64 }, (_, j) => Math.round(Math.sin(j * 0.3 + i) * 0.5 * 10000 + 5000) / 10000);
                        await saveStyleProfile({ ...preset, embedding: dummyEmbedding });
                        await reloadBank();
                        setActiveCat('styleProfiles');
                        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                        Alert.alert('Preset Loaded!', `"${preset.name}" added to Style Profiles.`);
                      }}
                    >
                      <Text style={{ fontSize: 24 }}>{icons[i]}</Text>
                      <Text style={[s.presetName, { color: col }]}>{preset.name}</Text>
                      <Text style={s.presetGenre}>{preset.classifiedGenre}</Text>
                      <Text style={s.presetMood}>{preset.classifiedMood}</Text>
                      <View style={[s.presetTag, { borderColor: col + '50', backgroundColor: col + '12' }]}>
                        <Text style={[s.presetTagText, { color: col }]}>{preset.classifiedRenderLanguage?.replace(/_/g,' ')}</Text>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </ScrollView>
          )}
        </View>

        {/* ── Trigger Phrase Detector ── */}
        <View style={s.triggerCard}>
          <Text style={s.sectionLabel}>TRIGGER PHRASE DETECTOR</Text>
          <TextInput
            style={[s.triggerInput, triggerMatch === 'learn' && { borderColor: C.gold }, triggerMatch === 'recall' && { borderColor: C.green }]}
            value={triggerText}
            onChangeText={setTriggerText}
            placeholder='Try: "learn this" or "use learned style"'
            placeholderTextColor={C.muted}
          />
          {triggerMatch === 'learn' && (
            <View style={[s.triggerMatch, { borderColor: C.gold, backgroundColor: C.gold + '10' }]}>
              <Text style={{ fontSize: 14 }}>🎨</Text>
              <Text style={[s.triggerMatchText, { color: C.gold }]}>LEARN TRIGGER DETECTED — Upload an image below to analyze</Text>
            </View>
          )}
          {triggerMatch === 'recall' && (
            <View style={[s.triggerMatch, { borderColor: C.green, backgroundColor: C.green + '10' }]}>
              <Text style={{ fontSize: 14 }}>⚡</Text>
              <Text style={[s.triggerMatchText, { color: C.green }]}>RECALL TRIGGER DETECTED — Style will be injected into next generation</Text>
            </View>
          )}
          <View style={s.triggerChips}>
            {LEARN_TRIGGERS.slice(0, 4).map(t => (
              <TouchableOpacity key={t} style={s.triggerChip} onPress={() => setTriggerText(t)}>
                <Text style={s.triggerChipText}>{t}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* ── Image Upload + Analysis ── */}
        <View style={s.section}>
          <Text style={s.sectionLabel}>UPLOAD IMAGE · ANALYZE STYLE</Text>

          <TouchableOpacity style={s.uploadZone} onPress={pickImage} activeOpacity={0.8}>
            {pickedUri ? (
              <Image source={{ uri: pickedUri }} style={s.uploadPreview} resizeMode="cover" />
            ) : (
              <View style={s.uploadPlaceholder}>
                <Text style={{ fontSize: 36 }}>📸</Text>
                <Text style={s.uploadLabel}>TAP TO UPLOAD IMAGE</Text>
                <Text style={s.uploadSub}>Camera roll · PNG · JPG · WEBP</Text>
              </View>
            )}
          </TouchableOpacity>

          {pickedUri && (
            <View style={{ gap: 10, marginTop: 12 }}>
              <TextInput
                style={s.nameInput}
                value={styleName}
                onChangeText={setStyleName}
                placeholder="Name this style (e.g. Retro Marvel Study)"
                placeholderTextColor={C.muted}
              />

              {/* Study Intent input */}
              <View style={s.intentCard}>
                <Text style={s.intentLabel}>TRAINING INTENT (optional)</Text>
                <TextInput
                  style={s.intentInput}
                  value={userIntent}
                  onChangeText={setUserIntent}
                  placeholder='e.g. "study manga motion and speed lines"'
                  placeholderTextColor={C.muted}
                  multiline
                />
                {/* Intent preset chips */}
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 8 }}>
                  <View style={{ flexDirection: 'row', gap: 6, paddingBottom: 2 }}>
                    {[
                      'study anatomy', 'study shadows', 'study lighting',
                      'study motion', 'study composition', 'study environment',
                      'learn manga motion', 'study cinematic lighting',
                      'learn superhero anatomy', 'study noir shadows',
                    ].map(t => (
                      <TouchableOpacity
                        key={t}
                        style={[s.intentChip, userIntent === t && { borderColor: C.gold, backgroundColor: C.gold + '14' }]}
                        onPress={() => { setUserIntent(t); Haptics.selectionAsync(); }}
                      >
                        <Text style={[s.intentChipText, userIntent === t && { color: C.gold }]}>{t}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </ScrollView>
                {userIntent.trim() && (
                  <View style={s.intentActive}>
                    <Text style={{ fontSize: 10 }}>🎯</Text>
                    <Text style={s.intentActiveText}>
                      Focus: {parseStudyIntent(userIntent).focus.join(' + ')}
                    </Text>
                  </View>
                )}
              </View>

              {/* Pipeline visualizer */}
              {(analyzing || pipelineStep >= 0) && (
                <PipelineVisualizer activeStep={pipelineStep} />
              )}

              <TouchableOpacity
                style={[s.analyzeBtn, analyzing && s.analyzeBtnDisabled]}
                onPress={runAnalysis}
                disabled={analyzing}
                activeOpacity={0.85}
              >
                <Text style={{ fontSize: 18 }}>🧬</Text>
                <Text style={s.analyzeBtnText}>
                  {analyzing ? 'ANALYZING...' : 'ANALYZE STYLE'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity style={s.clearBtn} onPress={() => { setPickedUri(null); setPickedB64(null); setPipelineStep(-1); }}>
                <Text style={s.clearBtnText}>Clear image</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* ── Style Blending Engine ── */}
        <View style={s.section}>
          <Text style={s.sectionLabel}>⚗️ STYLE BLENDING ENGINE</Text>
          <View style={s.blendCard}>

            {/* Slot pickers */}
            <View style={s.blendSlots}>
              {/* Slot A */}
              <View style={[s.blendSlot, { borderColor: C.gold + '60' }]}>
                <Text style={[s.blendSlotLabel, { color: C.gold }]}>STYLE A</Text>
                {blendA ? (
                  <View style={{ gap: 4 }}>
                    <Text style={s.blendSlotName} numberOfLines={1}>{blendA.name}</Text>
                    <Text style={s.blendSlotSub}>{blendA.classifiedRenderLanguage?.replace(/_/g,' ')}</Text>
                    <TouchableOpacity onPress={() => setBlendA(null)}>
                      <Text style={{ fontSize: 10, color: C.red, fontFamily: 'Inter_600SemiBold' }}>✕ clear</Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <TouchableOpacity
                    style={s.blendSlotPick}
                    onPress={() => setBlendPickingFor('A')}
                    activeOpacity={0.8}
                  >
                    <Text style={{ fontSize: 20 }}>🎨</Text>
                    <Text style={s.blendSlotPickText}>PICK{'\n'}STYLE A</Text>
                  </TouchableOpacity>
                )}
              </View>

              {/* Ratio display */}
              <View style={s.blendCenter}>
                <Text style={s.blendX}>×</Text>
                <Text style={s.blendRatioDisplay}>{Math.round((1 - blendRatio) * 100)}:{Math.round(blendRatio * 100)}</Text>
              </View>

              {/* Slot B */}
              <View style={[s.blendSlot, { borderColor: C.purple + '60' }]}>
                <Text style={[s.blendSlotLabel, { color: C.purple }]}>STYLE B</Text>
                {blendB ? (
                  <View style={{ gap: 4 }}>
                    <Text style={s.blendSlotName} numberOfLines={1}>{blendB.name}</Text>
                    <Text style={s.blendSlotSub}>{blendB.classifiedRenderLanguage?.replace(/_/g,' ')}</Text>
                    <TouchableOpacity onPress={() => setBlendB(null)}>
                      <Text style={{ fontSize: 10, color: C.red, fontFamily: 'Inter_600SemiBold' }}>✕ clear</Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <TouchableOpacity
                    style={[s.blendSlotPick, { borderColor: C.purple + '40' }]}
                    onPress={() => setBlendPickingFor('B')}
                    activeOpacity={0.8}
                  >
                    <Text style={{ fontSize: 20 }}>🎨</Text>
                    <Text style={[s.blendSlotPickText, { color: C.purple }]}>PICK{'\n'}STYLE B</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>

            {/* Style picker modal-style list */}
            {blendPickingFor && bank && bank.styleProfiles.length > 0 && (
              <View style={s.blendPickerPanel}>
                <Text style={s.blendPickerTitle}>
                  SELECT STYLE {blendPickingFor} — tap to choose
                </Text>
                <ScrollView style={{ maxHeight: 160 }} nestedScrollEnabled>
                  {bank.styleProfiles.map(sv => (
                    <TouchableOpacity
                      key={sv.profileId}
                      style={s.blendPickerRow}
                      activeOpacity={0.8}
                      onPress={() => {
                        if (blendPickingFor === 'A') setBlendA(sv);
                        else setBlendB(sv);
                        setBlendPickingFor(null);
                        Haptics.selectionAsync();
                      }}
                    >
                      <View style={{ flex: 1 }}>
                        <Text style={s.blendPickerName}>{sv.name}</Text>
                        <Text style={s.blendPickerSub}>{sv.classifiedGenre} · {sv.classifiedMood}</Text>
                      </View>
                      <View style={[s.blendPickerDot, { backgroundColor: blendPickingFor === 'A' ? C.gold : C.purple }]} />
                    </TouchableOpacity>
                  ))}
                </ScrollView>
                <TouchableOpacity style={s.blendPickerClose} onPress={() => setBlendPickingFor(null)}>
                  <Text style={{ fontSize: 11, color: C.muted, fontFamily: 'Inter_400Regular' }}>cancel</Text>
                </TouchableOpacity>
              </View>
            )}

            {bank && bank.styleProfiles.length < 2 && !blendPickingFor && (
              <View style={s.blendEmptyHint}>
                <Text style={s.blendEmptyText}>Analyze 2+ images above to unlock style blending</Text>
              </View>
            )}

            {/* Ratio slider */}
            <View style={s.ratioRow}>
              <Text style={[s.ratioLabel, { color: C.gold }]}>A {Math.round((1 - blendRatio) * 100)}%</Text>
              <View style={s.ratioTrack}>
                <View style={[s.ratioFillA, { flex: 1 - blendRatio }]} />
                <View style={[s.ratioFillB, { flex: blendRatio }]} />
                {/* Step buttons */}
                {[0, 0.25, 0.5, 0.75, 1].map(v => (
                  <TouchableOpacity
                    key={v}
                    style={[s.ratioStep, { left: `${v * 100}%` as any }]}
                    onPress={() => { setBlendRatio(v); Haptics.selectionAsync(); }}
                  >
                    <View style={[s.ratioStepDot, blendRatio === v && s.ratioStepDotActive]} />
                  </TouchableOpacity>
                ))}
              </View>
              <Text style={[s.ratioLabel, { color: C.purple }]}>{Math.round(blendRatio * 100)}% B</Text>
            </View>

            {/* Quick ratio presets */}
            <View style={s.ratioPresets}>
              {[['A-Heavy', 0.2], ['Equal', 0.5], ['B-Heavy', 0.8]].map(([label, val]) => (
                <TouchableOpacity
                  key={label as string}
                  style={[s.ratioPreset, blendRatio === val && { borderColor: C.goldDim, backgroundColor: C.goldDim + '18' }]}
                  onPress={() => { setBlendRatio(val as number); Haptics.selectionAsync(); }}
                >
                  <Text style={[s.ratioPresetText, blendRatio === val && { color: C.gold }]}>{label as string}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Hybrid name */}
            <TextInput
              style={s.blendNameInput}
              value={blendName}
              onChangeText={setBlendName}
              placeholder={blendA && blendB ? `${blendA.name} × ${blendB.name}` : 'Name the hybrid style…'}
              placeholderTextColor={C.muted}
            />

            {/* Blend button */}
            <TouchableOpacity
              style={[s.blendBtn, (!blendA || !blendB || blending) && s.blendBtnDisabled]}
              onPress={runBlend}
              disabled={!blendA || !blendB || blending}
              activeOpacity={0.85}
            >
              <Text style={{ fontSize: 18 }}>⚗️</Text>
              <Text style={s.blendBtnText}>{blending ? 'BLENDING...' : 'BLEND STYLES'}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* ── Memory Bank — 7 categories ── */}
        <View style={s.section}>
          <Text style={s.sectionLabel}>VISUAL MEMORY BANK</Text>

          {/* Category tabs */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginHorizontal: -16 }}>
            <View style={s.catTabRow}>
              {CATEGORIES.map(cat => {
                const meta   = MEMORY_CATEGORY_META[cat];
                const active = activeCategory === cat;
                const count  = bank ? (bank[cat] as unknown[]).length : 0;
                return (
                  <TouchableOpacity
                    key={cat}
                    style={[s.catTab, active && { borderColor: meta.color, backgroundColor: meta.color + '14' }]}
                    onPress={() => { setActiveCat(cat); Haptics.selectionAsync(); }}
                    activeOpacity={0.8}
                  >
                    <Text style={{ fontSize: 16 }}>{meta.icon}</Text>
                    <Text style={[s.catTabLabel, active && { color: meta.color }]}>{meta.label}</Text>
                    {count > 0 && (
                      <View style={[s.catCount, { backgroundColor: meta.color }]}>
                        <Text style={s.catCountText}>{count}</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          </ScrollView>

          {/* Category description */}
          <View style={[s.catDesc, { borderColor: MEMORY_CATEGORY_META[activeCategory].color + '40' }]}>
            <Text style={[s.catDescText, { color: MEMORY_CATEGORY_META[activeCategory].color }]}>
              {MEMORY_CATEGORY_META[activeCategory].icon}{'  '}{MEMORY_CATEGORY_META[activeCategory].description}
            </Text>
          </View>

          {/* Category content */}
          {activeCategory === 'styleProfiles' && bank && (
            bank.styleProfiles.length === 0
              ? <EmptyCategory label="Style Profiles" icon="🎨" />
              : bank.styleProfiles.map(sv => (
                  <StyleVectorCard
                    key={sv.profileId}
                    sv={sv}
                    onDelete={() => handleDelete('styleProfiles', sv.profileId)}
                    onRecall={() => handleRecall(sv)}
                  />
                ))
          )}

          {activeCategory !== 'styleProfiles' && bank && (
            <EmptyCategory
              label={MEMORY_CATEGORY_META[activeCategory].label}
              icon={MEMORY_CATEGORY_META[activeCategory].icon}
            />
          )}
        </View>

        {/* ── Trigger reference ── */}
        <View style={s.refCard}>
          <Text style={s.sectionLabel}>TRIGGER PHRASE REFERENCE</Text>
          <View style={{ gap: 6 }}>
            <Text style={[s.refSub, { color: C.gold }]}>LEARN TRIGGERS</Text>
            {LEARN_TRIGGERS.map(t => (
              <Text key={t} style={s.refLine}>→ "{t}"</Text>
            ))}
            <Text style={[s.refSub, { color: C.green, marginTop: 10 }]}>RECALL TRIGGERS</Text>
            {RECALL_TRIGGERS.map(t => (
              <Text key={t} style={s.refLine}>→ "{t}"</Text>
            ))}
          </View>
        </View>

        <View style={{ height: 60 }} />
      </ScrollView>
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  root:      { flex: 1, backgroundColor: C.bg },
  header:    { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 18, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: C.border },
  backBtn:   { width: 36, height: 36, borderRadius: 18, backgroundColor: C.card, alignItems: 'center', justifyContent: 'center' },
  title:     { fontSize: 17, fontFamily: 'Inter_700Bold', color: C.ink },
  sub:       { fontSize: 10, color: C.muted, fontFamily: 'Inter_400Regular', marginTop: 1 },
  countBadge:{ borderWidth: 1.5, borderRadius: 16, paddingHorizontal: 10, paddingVertical: 4 },
  countText: { fontSize: 14, fontFamily: 'Inter_700Bold' },

  scroll:    { paddingHorizontal: 16, paddingTop: 16 },
  section:   { marginBottom: 24 },
  sectionLabel: { fontSize: 9, fontFamily: 'Inter_700Bold', color: C.muted, letterSpacing: 1.5, marginBottom: 12 },

  // Trigger card
  triggerCard:  { backgroundColor: C.card, borderRadius: 14, borderWidth: 1, borderColor: C.border, padding: 14, marginBottom: 20, gap: 10 },
  triggerInput: { backgroundColor: C.card2, borderRadius: 10, borderWidth: 1, borderColor: C.border, paddingHorizontal: 14, paddingVertical: 10, color: C.ink, fontSize: 13, fontFamily: 'Inter_400Regular' },
  triggerMatch: { flexDirection: 'row', alignItems: 'center', gap: 8, borderRadius: 10, borderWidth: 1, padding: 10 },
  triggerMatchText: { fontSize: 11, fontFamily: 'Inter_700Bold', flex: 1 },
  triggerChips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  triggerChip:  { backgroundColor: C.card2, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 5, borderWidth: 1, borderColor: C.border },
  triggerChipText: { fontSize: 10, color: C.muted, fontFamily: 'Inter_400Regular' },

  // Upload
  uploadZone:       { borderWidth: 1.5, borderColor: C.border, borderRadius: 14, borderStyle: 'dashed', overflow: 'hidden', minHeight: 160 },
  uploadPreview:    { width: '100%', height: 220 },
  uploadPlaceholder:{ alignItems: 'center', justifyContent: 'center', padding: 32, gap: 8 },
  uploadLabel:      { fontSize: 12, fontFamily: 'Inter_700Bold', color: C.muted, letterSpacing: 1 },
  uploadSub:        { fontSize: 10, color: C.muted, fontFamily: 'Inter_400Regular' },
  nameInput:        { backgroundColor: C.card, borderRadius: 10, borderWidth: 1, borderColor: C.border, paddingHorizontal: 14, paddingVertical: 10, color: C.ink, fontSize: 13, fontFamily: 'Inter_400Regular' },
  analyzeBtn:       { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, backgroundColor: C.gold, borderRadius: 14, paddingVertical: 15 },
  analyzeBtnDisabled:{ opacity: 0.4 },
  analyzeBtnText:   { fontSize: 14, fontFamily: 'Inter_700Bold', color: C.bg, letterSpacing: 1.5 },
  clearBtn:         { alignItems: 'center', paddingVertical: 8 },
  clearBtnText:     { fontSize: 12, color: C.muted, fontFamily: 'Inter_400Regular' },

  // Category tabs
  catTabRow:    { flexDirection: 'row', gap: 8, paddingHorizontal: 16, paddingBottom: 4 },
  catTab:       { alignItems: 'center', gap: 4, paddingHorizontal: 12, paddingVertical: 10, borderRadius: 12, borderWidth: 1, borderColor: C.border, backgroundColor: C.card, minWidth: 90, position: 'relative' },
  catTabLabel:  { fontSize: 9, fontFamily: 'Inter_700Bold', color: C.muted, letterSpacing: 0.5, textAlign: 'center' },
  catCount:     { position: 'absolute', top: -4, right: -4, borderRadius: 8, paddingHorizontal: 5, paddingVertical: 1, minWidth: 16, alignItems: 'center' },
  catCountText: { fontSize: 9, fontFamily: 'Inter_700Bold', color: C.bg },
  catDesc:      { borderRadius: 10, borderWidth: 1, padding: 10, marginTop: 10, marginBottom: 14 },
  catDescText:  { fontSize: 11, fontFamily: 'Inter_600SemiBold' },

  // Reference card
  refCard:    { backgroundColor: C.card, borderRadius: 14, borderWidth: 1, borderColor: C.border, padding: 14, marginBottom: 16, gap: 8 },
  refSub:     { fontSize: 9, fontFamily: 'Inter_700Bold', letterSpacing: 1 },
  refLine:    { fontSize: 11, color: C.muted, fontFamily: 'Inter_400Regular' },

  // Training guide
  guideHeader:      { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: C.card, borderRadius: 14, borderWidth: 1, borderColor: C.border, padding: 14, marginBottom: 4 },
  guideHeaderText:  { flex: 1, fontSize: 12, fontFamily: 'Inter_700Bold', color: C.ink, letterSpacing: 1 },
  guideBody:        { backgroundColor: C.card, borderRadius: 14, borderWidth: 1, borderColor: C.border, padding: 14, marginBottom: 16, gap: 4 },
  guideSub:         { fontSize: 8, fontFamily: 'Inter_700Bold', color: C.gold, letterSpacing: 1.5, marginBottom: 4 },
  guideIntro:       { fontSize: 11, color: C.muted, fontFamily: 'Inter_400Regular', lineHeight: 17 },
  guideLine:        { fontSize: 11, color: C.ink, fontFamily: 'Inter_400Regular', paddingLeft: 4 },
  guideCommand:     { backgroundColor: C.card2, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6, borderWidth: 1, borderColor: C.gold + '30', marginBottom: 4 },
  guideCommandText: { fontSize: 10, color: C.gold, fontFamily: 'Inter_600SemiBold' },
  guideExample:     { backgroundColor: C.card2, borderRadius: 8, padding: 10, borderWidth: 1, borderColor: C.border, marginBottom: 6 },
  guideExampleText: { fontSize: 10, color: C.ink, fontFamily: 'Inter_400Regular', lineHeight: 16 },

  // Genre presets
  presetsHeader:    { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: C.card, borderRadius: 14, borderWidth: 1, borderColor: C.border, padding: 12, marginBottom: 10 },
  presetsHeaderText:{ fontSize: 12, fontFamily: 'Inter_700Bold', color: C.ink, letterSpacing: 0.8 },
  presetsHeaderSub: { flex: 1, fontSize: 9, color: C.muted, fontFamily: 'Inter_400Regular' },
  presetRow:        { flexDirection: 'row', gap: 10, paddingHorizontal: 16, paddingBottom: 4 },
  presetCard:       { width: 130, backgroundColor: C.card, borderRadius: 14, borderWidth: 1.5, padding: 12, gap: 5, alignItems: 'flex-start' },
  presetName:       { fontSize: 11, fontFamily: 'Inter_700Bold', lineHeight: 15 },
  presetGenre:      { fontSize: 9, color: C.muted, fontFamily: 'Inter_400Regular' },
  presetMood:       { fontSize: 9, color: C.muted, fontFamily: 'Inter_400Regular' },
  presetTag:        { borderWidth: 1, borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2, marginTop: 4 },
  presetTagText:    { fontSize: 7, fontFamily: 'Inter_700Bold', letterSpacing: 0.5 },

  // Study intent
  intentCard:       { backgroundColor: C.card2, borderRadius: 12, borderWidth: 1, borderColor: C.border, padding: 12, gap: 8 },
  intentLabel:      { fontSize: 8, fontFamily: 'Inter_700Bold', color: C.muted, letterSpacing: 1.5 },
  intentInput:      { backgroundColor: C.card, borderRadius: 8, borderWidth: 1, borderColor: C.border, paddingHorizontal: 12, paddingVertical: 8, color: C.ink, fontSize: 12, fontFamily: 'Inter_400Regular', minHeight: 40 },
  intentChip:       { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, borderWidth: 1, borderColor: C.border, backgroundColor: C.card },
  intentChipText:   { fontSize: 10, color: C.muted, fontFamily: 'Inter_600SemiBold' },
  intentActive:     { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: C.gold + '12', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6, borderWidth: 1, borderColor: C.gold + '30' },
  intentActiveText: { fontSize: 10, color: C.gold, fontFamily: 'Inter_700Bold', letterSpacing: 0.5, flex: 1 },

  // Blend engine
  blendCard:         { backgroundColor: C.card, borderRadius: 14, borderWidth: 1, borderColor: C.border, padding: 14, gap: 12 },
  blendSlots:        { flexDirection: 'row', gap: 10, alignItems: 'stretch' },
  blendSlot:         { flex: 1, borderWidth: 1.5, borderRadius: 12, padding: 12, gap: 6, minHeight: 90 },
  blendSlotLabel:    { fontSize: 8, fontFamily: 'Inter_700Bold', letterSpacing: 1.5 },
  blendSlotName:     { fontSize: 12, fontFamily: 'Inter_700Bold', color: C.ink },
  blendSlotSub:      { fontSize: 9, color: C.muted, fontFamily: 'Inter_400Regular' },
  blendSlotPick:     { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 4, borderWidth: 1, borderColor: C.gold + '40', borderRadius: 8, borderStyle: 'dashed', padding: 8 },
  blendSlotPickText: { fontSize: 9, fontFamily: 'Inter_700Bold', color: C.gold, textAlign: 'center', letterSpacing: 0.5 },
  blendCenter:       { alignItems: 'center', justifyContent: 'center', gap: 4 },
  blendX:            { fontSize: 22, color: C.goldDim, fontFamily: 'Inter_700Bold' },
  blendRatioDisplay: { fontSize: 9, color: C.muted, fontFamily: 'Inter_700Bold', letterSpacing: 0.5 },

  blendPickerPanel:  { backgroundColor: C.card2, borderRadius: 10, borderWidth: 1, borderColor: C.border, overflow: 'hidden' },
  blendPickerTitle:  { fontSize: 9, color: C.gold, fontFamily: 'Inter_700Bold', letterSpacing: 1, padding: 10, paddingBottom: 6 },
  blendPickerRow:    { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 10, paddingVertical: 10, borderTopWidth: 1, borderTopColor: C.border },
  blendPickerName:   { fontSize: 12, fontFamily: 'Inter_600SemiBold', color: C.ink },
  blendPickerSub:    { fontSize: 9, color: C.muted, fontFamily: 'Inter_400Regular', marginTop: 1 },
  blendPickerDot:    { width: 10, height: 10, borderRadius: 5 },
  blendPickerClose:  { alignItems: 'center', padding: 8, borderTopWidth: 1, borderTopColor: C.border },
  blendEmptyHint:    { alignItems: 'center', padding: 12 },
  blendEmptyText:    { fontSize: 11, color: C.muted, fontFamily: 'Inter_400Regular', textAlign: 'center' },

  ratioRow:          { flexDirection: 'row', alignItems: 'center', gap: 10 },
  ratioLabel:        { fontSize: 10, fontFamily: 'Inter_700Bold', width: 50 },
  ratioTrack:        { flex: 1, height: 8, flexDirection: 'row', borderRadius: 4, overflow: 'visible', backgroundColor: C.border, position: 'relative' },
  ratioFillA:        { backgroundColor: C.gold, borderTopLeftRadius: 4, borderBottomLeftRadius: 4 },
  ratioFillB:        { backgroundColor: C.purple, borderTopRightRadius: 4, borderBottomRightRadius: 4 },
  ratioStep:         { position: 'absolute', top: -4, marginLeft: -8, width: 16, height: 16, alignItems: 'center', justifyContent: 'center' },
  ratioStepDot:      { width: 8, height: 8, borderRadius: 4, backgroundColor: C.border, borderWidth: 1.5, borderColor: C.muted },
  ratioStepDotActive:{ backgroundColor: C.gold, borderColor: C.gold },

  ratioPresets:      { flexDirection: 'row', gap: 8 },
  ratioPreset:       { flex: 1, alignItems: 'center', paddingVertical: 7, borderRadius: 8, borderWidth: 1, borderColor: C.border, backgroundColor: C.card2 },
  ratioPresetText:   { fontSize: 10, fontFamily: 'Inter_600SemiBold', color: C.muted },

  blendNameInput:    { backgroundColor: C.card2, borderRadius: 10, borderWidth: 1, borderColor: C.border, paddingHorizontal: 14, paddingVertical: 10, color: C.ink, fontSize: 12, fontFamily: 'Inter_400Regular' },
  blendBtn:          { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, backgroundColor: C.purple, borderRadius: 14, paddingVertical: 14 },
  blendBtnDisabled:  { opacity: 0.35 },
  blendBtnText:      { fontSize: 13, fontFamily: 'Inter_700Bold', color: '#fff', letterSpacing: 1.5 },
});
