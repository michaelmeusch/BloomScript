import { Feather } from '@expo/vector-icons';
import { useAuth } from '@clerk/expo';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator, Image, ScrollView,
  StyleSheet, Text, TextInput, TouchableOpacity, View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { API_BASE } from '@/constants/api';

const C = {
  bg: '#0E0C0A', card: '#181410', card2: '#1E1812', border: '#2E2618',
  yellow: '#FFD600', red: '#E8001C', blue: '#0057A8', green: '#2A7A3A',
  orange: '#E06000', ink: '#F0EAD8', muted: '#7A6A58',
};

interface CharacterDNA {
  id: string; name: string; faceShape: string; eyeStyle: string; hairStyle: string;
  outfitTop: string; outfitBottom: string; colorPalette: string;
  bodyProportion: number; artStyle: string; accessories: string[];
  locked?: boolean;
  referenceAssets?: Array<{ localUri: string; mimeType: string; name: string }>;
}
interface ComicProject { title: string; characterProfiles: CharacterDNA[] }

interface ConsistencyIssue {
  category: 'face' | 'hair' | 'outfit' | 'accessories' | 'proportions' | 'style' | 'other';
  description: string;
  severity: 'error' | 'warning';
}
interface CheckResult { issues: ConsistencyIssue[]; consistencyScore: number }

type Phase = 'setup' | 'analyzing' | 'results';

const CAT_ICONS: Record<string, string> = {
  face: 'smile', hair: 'wind', outfit: 'layers', accessories: 'tag',
  proportions: 'maximize-2', style: 'pen-tool', other: 'alert-circle',
};
const CAT_COLORS: Record<string, string> = {
  face: C.blue, hair: C.yellow, outfit: C.orange, accessories: C.green,
  proportions: C.red, style: '#9B59B6', other: C.muted,
};

function scoreColor(n: number) { return n >= 80 ? C.green : n >= 60 ? C.orange : C.red; }

function IssueRow({ issue }: { issue: ConsistencyIssue }) {
  const icon = (CAT_ICONS[issue.category] ?? 'alert-circle') as any;
  const col  = CAT_COLORS[issue.category] ?? C.muted;
  return (
    <View style={[il.row, issue.severity === 'error' && il.rowError]}>
      <Feather name={icon} size={13} color={col} style={{ marginRight: 8, marginTop: 1 }} />
      <View style={{ flex: 1 }}>
        <Text style={[il.cat, { color: col }]}>{issue.category.toUpperCase()}</Text>
        <Text style={il.desc}>{issue.description}</Text>
      </View>
      <View style={[il.badge, { backgroundColor: issue.severity === 'error' ? C.red + '33' : C.orange + '33' }]}>
        <Text style={[il.badgeTxt, { color: issue.severity === 'error' ? C.red : C.orange }]}>
          {issue.severity === 'error' ? '✕ ERR' : '⚠ WARN'}
        </Text>
      </View>
    </View>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function ConsistencyChecker() {
  const insets = useSafeAreaInsets();
  const { getToken } = useAuth();

  const [project, setProject]       = useState<ComicProject | null>(null);
  const [characters, setChars]      = useState<CharacterDNA[]>([]);
  const [activeChar, setActiveChar] = useState<CharacterDNA | null>(null);
  const [panelUri, setPanelUri]     = useState<string | null>(null);
  const [panelB64, setPanelB64]     = useState<string | null>(null);
  const [phase, setPhase]           = useState<Phase>('setup');
  const [result, setResult]         = useState<CheckResult | null>(null);
  const [error, setError]           = useState<string | null>(null);
  const [locked, setLocked]         = useState(false);
  const [sceneDesc, setSceneDesc]   = useState('');

  // Load characters from active project OR consistency engine fallback
  useEffect(() => {
    (async () => {
      // 1. Try active project (production studio format)
      const projRaw = await AsyncStorage.getItem('@bloomscript:active_project');
      if (projRaw) {
        try {
          const proj = JSON.parse(projRaw) as ComicProject;
          setProject(proj);
          const chars = proj.characterProfiles ?? [];
          if (chars.length) {
            setChars(chars);
            setActiveChar(chars[0]);
            setLocked(chars[0]!.locked ?? false);
            return;
          }
        } catch { /* ignore */ }
      }
      // 2. Fallback: consistency engine (auto-character format)
      const engRaw = await AsyncStorage.getItem('@bloomscript:consistency_engine_v1');
      if (engRaw) {
        try {
          const engineChars = JSON.parse(engRaw) as Array<{
            id: string; name: string; archetype?: string; species?: string;
            artStyle?: string; hairstyle?: string; outfit?: string;
            personality?: string; power?: string;
            primaryColor?: string; secondaryColor?: string;
            heightRatio?: number; shoulderWidth?: number;
            armLength?: number; legLength?: number;
            styleLockStrength?: number; hasArmor?: boolean; hasCape?: boolean;
            consistencyLocked?: boolean; createdAt?: number;
          }>;
          const converted: CharacterDNA[] = engineChars.map(c => ({
            id: c.id,
            name: c.name,
            faceShape: 'Oval',
            eyeStyle: 'Almond',
            hairStyle: c.hairstyle ?? 'Short',
            outfitTop: c.outfit ?? '',
            outfitBottom: '',
            colorPalette: c.primaryColor && c.secondaryColor
              ? `${c.primaryColor} / ${c.secondaryColor}`
              : 'Dark & Gritty',
            bodyProportion: c.heightRatio ? c.heightRatio / 8 : 1.0,
            artStyle: c.artStyle ?? 'Noir',
            accessories: [],
            locked: c.consistencyLocked ?? false,
            referenceAssets: [],
          }));
          setChars(converted);
          if (converted[0]) { setActiveChar(converted[0]); setLocked(converted[0].locked ?? false); }
        } catch { /* ignore */ }
      }
    })();
  }, []);

  const pickPanel = async () => {
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: 'images',
      quality: 0.9,
      base64: true,
      allowsEditing: true,
      aspect: [1, 1],
    });
    if (!res.canceled && res.assets[0]) {
      setPanelUri(res.assets[0].uri);
      setPanelB64(res.assets[0].base64 ?? null);
    }
  };

  const getFirstImageAsset = () => {
    const assets = activeChar?.referenceAssets ?? [];
    return assets.find(a => a.mimeType?.startsWith('image/'));
  };

  const analyze = async () => {
    if (!panelB64 || !activeChar) return;
    setError(null); setResult(null); setPhase('analyzing');

    try {
      const token = await getToken();
      const refAsset = getFirstImageAsset();

      const res = await fetch(`${API_BASE}/ai-studio/consistency-check`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          panelBase64: panelB64,
          referenceImageUri: refAsset?.localUri ?? null,
          sceneDescription: sceneDesc.trim() || undefined,
          characterDNA: {
            name: activeChar.name,
            faceShape: activeChar.faceShape,
            eyeStyle: activeChar.eyeStyle,
            hairStyle: activeChar.hairStyle,
            outfitTop: activeChar.outfitTop,
            outfitBottom: activeChar.outfitBottom,
            colorPalette: activeChar.colorPalette,
            bodyProportion: activeChar.bodyProportion,
            artStyle: activeChar.artStyle,
            accessories: activeChar.accessories,
          },
        }),
      });
      if (!res.ok) throw new Error(`Check failed (${res.status})`);
      const data = await res.json() as CheckResult;
      setResult(data);
      setPhase('results');
    } catch (err: any) {
      setError(err.message ?? 'Check failed');
      setPhase('setup');
    }
  };

  const lockCharacter = async () => {
    if (!activeChar) return;
    setLocked(true);
    const raw = await AsyncStorage.getItem('@bloomscript:active_project');
    if (!raw) return;
    try {
      const proj = JSON.parse(raw) as ComicProject & { id: string; updatedAt: number; [k: string]: any };
      proj.characterProfiles = (proj.characterProfiles ?? []).map((c: CharacterDNA) =>
        c.id === activeChar.id ? { ...c, locked: true } : c
      );
      proj.updatedAt = Date.now();
      await AsyncStorage.setItem('@bloomscript:active_project', JSON.stringify(proj));
      const allRaw = await AsyncStorage.getItem('@bloomscript:projects_v1');
      if (allRaw) {
        const all = JSON.parse(allRaw) as typeof proj[];
        await AsyncStorage.setItem('@bloomscript:projects_v1',
          JSON.stringify(all.map((p: typeof proj) => p.id === proj.id ? proj : p)));
      }
    } catch { /* ignore */ }
  };

  // ── SETUP ──────────────────────────────────────────────────────────────────
  if (phase === 'setup') return (
    <View style={[s.root, { paddingTop: insets.top }]}>
      <View style={s.hdr}>
        <TouchableOpacity onPress={() => router.back()} style={s.hdrBtn}><Feather name="arrow-left" size={20} color={C.ink} /></TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={s.hdrTitle}>CONSISTENCY CHECKER</Text>
          <Text style={{ color: C.muted, fontSize: 9, textAlign: 'center' }}>Panel vs CharacterDNA</Text>
        </View>
        <View style={{ width: 36 }} />
      </View>
      <ScrollView contentContainerStyle={s.scroll}>
        {error && (
          <View style={s.errBox}><Feather name="alert-circle" size={13} color={C.red} /><Text style={s.errTxt}>{error}</Text></View>
        )}

        {/* Character select */}
        {characters.length > 0 ? (
          <>
            <Text style={s.fl}>SELECT CHARACTER</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
              {characters.map(c => (
                <TouchableOpacity key={c.id} onPress={() => { setActiveChar(c); setLocked(c.locked ?? false); }}
                  activeOpacity={0.8}
                  style={[s.charChip, activeChar?.id === c.id && s.charChipActive]}>
                  {c.locked && <Feather name="lock" size={9} color={C.green} style={{ marginRight: 4 }} />}
                  <Text style={[s.charChipTxt, activeChar?.id === c.id && { color: C.yellow }]}>{c.name}</Text>
                </TouchableOpacity>
              ))}
            </View>
            {activeChar && (
              <View style={s.dnaCard}>
                <Text style={s.dnaTitle}>{activeChar.name}  {activeChar.locked ? '🔒 LOCKED' : '○ unlocked'}</Text>
                <Text style={s.dnaLine}>Face: {activeChar.faceShape} · Eyes: {activeChar.eyeStyle} · Hair: {activeChar.hairStyle}</Text>
                <Text style={s.dnaLine}>Outfit: {activeChar.outfitTop} + {activeChar.outfitBottom}</Text>
                {activeChar.accessories.length > 0 && <Text style={s.dnaLine}>Accessories: {activeChar.accessories.join(', ')}</Text>}
                <Text style={s.dnaLine}>×{activeChar.bodyProportion.toFixed(1)} proportion · {activeChar.artStyle}</Text>
                {getFirstImageAsset() && (
                  <Image source={{ uri: getFirstImageAsset()!.localUri }} style={s.refThumb} resizeMode="cover" />
                )}
              </View>
            )}
          </>
        ) : (
          <View style={s.emptyBox}>
            <Feather name="users" size={28} color={C.muted} />
            <Text style={s.emptyTxt}>No characters in active project.{'\n'}Open Production Studio to create one.</Text>
          </View>
        )}

        {/* Panel upload */}
        {/* Scene / action description */}
        <Text style={[s.fl, { marginTop: 20 }]}>SCENE / ACTION DESCRIPTION  <Text style={{ color: C.muted, fontWeight: '400' }}>(optional)</Text></Text>
        <TextInput
          value={sceneDesc}
          onChangeText={setSceneDesc}
          placeholder={'e.g. Mara reaches for her holster in a rainy alley,\nDutch angle, neon lighting from the left'}
          placeholderTextColor={C.muted}
          multiline
          style={s.descInput}
        />

        <Text style={[s.fl, { marginTop: 16 }]}>GENERATED PANEL TO CHECK</Text>
        <TouchableOpacity onPress={pickPanel} activeOpacity={0.8} style={[s.uploadBox, panelUri && { borderColor: C.yellow }]}>
          {panelUri ? (
            <Image source={{ uri: panelUri }} style={s.panelPreview} resizeMode="cover" />
          ) : (
            <View style={s.uploadInner}>
              <Feather name="upload" size={28} color={C.muted} />
              <Text style={s.uploadTxt}>Upload Panel Image</Text>
              <Text style={s.uploadSub}>PNG · JPG from gallery</Text>
            </View>
          )}
        </TouchableOpacity>
        {panelUri && (
          <TouchableOpacity onPress={() => { setPanelUri(null); setPanelB64(null); }} style={s.clearBtn}>
            <Feather name="x" size={12} color={C.muted} /><Text style={s.clearBtnTxt}>Clear</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={[s.analyzeBtn, (!panelB64 || !activeChar) && { opacity: 0.4 }]}
          disabled={!panelB64 || !activeChar} onPress={analyze} activeOpacity={0.8}>
          <Feather name="search" size={16} color={C.bg} style={{ marginRight: 8 }} />
          <Text style={s.analyzeBtnTxt}>ANALYZE CONSISTENCY</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );

  // ── ANALYZING ─────────────────────────────────────────────────────────────
  if (phase === 'analyzing') return (
    <View style={[s.root, s.center, { paddingTop: insets.top }]}>
      <ActivityIndicator size="large" color={C.yellow} />
      <Text style={[s.hdrTitle, { marginTop: 20 }]}>ANALYZING…</Text>
      <Text style={[s.dnaLine, { textAlign: 'center', marginTop: 8, paddingHorizontal: 40 }]}>
        Comparing generated panel against{'\n'}{activeChar?.name ?? 'character'}'s DNA
      </Text>
      <View style={s.analyzeSteps}>
        {['Detecting facial features','Comparing outfit & costume','Checking accessories','Measuring proportions'].map(step => (
          <View key={step} style={s.analyzeStep}>
            <ActivityIndicator size="small" color={C.muted} />
            <Text style={s.analyzeStepTxt}>{step}</Text>
          </View>
        ))}
      </View>
    </View>
  );

  // ── RESULTS ───────────────────────────────────────────────────────────────
  if (!result) return null;
  const errors   = result.issues.filter(i => i.severity === 'error');
  const warnings = result.issues.filter(i => i.severity === 'warning');
  const categories = [...new Set(result.issues.map(i => i.category))];

  return (
    <View style={[s.root, { paddingTop: insets.top }]}>
      <View style={s.hdr}>
        <TouchableOpacity onPress={() => setPhase('setup')} style={s.hdrBtn}><Feather name="arrow-left" size={20} color={C.ink} /></TouchableOpacity>
        <Text style={s.hdrTitle}>CONSISTENCY REPORT</Text>
        <View style={{ width: 36 }} />
      </View>
      <ScrollView contentContainerStyle={s.scroll}>

        {/* Score */}
        <View style={s.scoreCard}>
          <Text style={s.scoreLabel}>CONSISTENCY SCORE</Text>
          <Text style={[s.scoreNum, { color: scoreColor(result.consistencyScore) }]}>
            {result.consistencyScore}
            <Text style={s.scoreUnit}>/100</Text>
          </Text>
          <View style={s.scoreBar}>
            <View style={[s.scoreFill, { width: `${result.consistencyScore}%`, backgroundColor: scoreColor(result.consistencyScore) }]} />
          </View>
          <Text style={s.scoreSub}>{errors.length} errors · {warnings.length} warnings · {categories.length} categories</Text>
        </View>

        {/* Side by side */}
        <View style={s.compareRow}>
          <View style={s.compareBox}>
            <Text style={s.compareLabel}>GENERATED PANEL</Text>
            {panelUri && <Image source={{ uri: panelUri }} style={s.compareImg} resizeMode="cover" />}
          </View>
          <View style={s.compareBox}>
            <Text style={s.compareLabel}>CHARACTER DNA</Text>
            {getFirstImageAsset() ? (
              <Image source={{ uri: getFirstImageAsset()!.localUri }} style={s.compareImg} resizeMode="cover" />
            ) : (
              <View style={[s.compareImg, s.comparePlaceholder]}>
                <Feather name="user" size={24} color={C.muted} />
                <Text style={{ color: C.muted, fontSize: 9, marginTop: 4 }}>No ref image</Text>
              </View>
            )}
          </View>
        </View>

        {/* Issues */}
        {result.issues.length === 0 ? (
          <View style={s.okBox}>
            <Feather name="check-circle" size={24} color={C.green} />
            <Text style={s.okTxt}>No consistency issues found!</Text>
          </View>
        ) : (
          <>
            <Text style={s.fl}>CONSISTENCY ISSUES  ({result.issues.length})</Text>
            {errors.length > 0 && (
              <View style={s.issueGroup}>
                <Text style={[s.groupHdr, { color: C.red }]}>✕  ERRORS  ({errors.length})</Text>
                {errors.map((iss, i) => <IssueRow key={i} issue={iss} />)}
              </View>
            )}
            {warnings.length > 0 && (
              <View style={s.issueGroup}>
                <Text style={[s.groupHdr, { color: C.orange }]}>⚠  WARNINGS  ({warnings.length})</Text>
                {warnings.map((iss, i) => <IssueRow key={i} issue={iss} />)}
              </View>
            )}
          </>
        )}

        {/* Lock button */}
        <TouchableOpacity
          style={[s.lockBtn, locked && s.lockBtnActive]}
          onPress={lockCharacter} activeOpacity={0.8} disabled={locked}>
          <Feather name={locked ? 'lock' : 'unlock'} size={15} color={locked ? C.bg : C.green} style={{ marginRight: 8 }} />
          <Text style={[s.lockBtnTxt, locked && { color: C.bg }]}>
            {locked ? '✓  CHARACTER CONSISTENCY LOCKED' : 'LOCK CHARACTER CONSISTENCY'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => { setPhase('setup'); setResult(null); setPanelUri(null); setPanelB64(null); }}
          style={s.retryBtn} activeOpacity={0.8}>
          <Feather name="refresh-cw" size={13} color={C.muted} style={{ marginRight: 6 }} />
          <Text style={s.retryTxt}>CHECK ANOTHER PANEL</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  root:      { flex: 1, backgroundColor: C.bg },
  center:    { alignItems: 'center', justifyContent: 'center' },
  scroll:    { padding: 16, paddingBottom: 52 },
  hdr:       { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: C.border },
  hdrTitle:  { color: C.ink, fontSize: 12, fontWeight: '800', letterSpacing: 2, textAlign: 'center' },
  hdrBtn:    { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  fl:        { color: C.muted, fontSize: 9, fontWeight: '700', letterSpacing: 1.5, marginBottom: 8 },
  errBox:    { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#2A0008', borderRadius: 8, padding: 10, marginBottom: 12 },
  errTxt:    { color: C.red, fontSize: 11, flex: 1 },
  charChip:  { borderWidth: 1, borderColor: C.border, borderRadius: 20, paddingHorizontal: 12, paddingVertical: 5, marginRight: 8, marginBottom: 8, flexDirection: 'row', alignItems: 'center' },
  charChipActive: { borderColor: C.yellow, backgroundColor: '#2A2000' },
  charChipTxt:    { color: C.muted, fontSize: 12, fontWeight: '600' },
  dnaCard:   { backgroundColor: C.card2, borderWidth: 1, borderColor: C.border, borderRadius: 8, padding: 12, marginBottom: 4 },
  dnaTitle:  { color: C.yellow, fontSize: 13, fontWeight: '700', marginBottom: 4 },
  dnaLine:   { color: C.muted, fontSize: 11, lineHeight: 17 },
  refThumb:  { width: 80, height: 80, borderRadius: 6, marginTop: 8, borderWidth: 1, borderColor: C.border },
  uploadBox: { borderWidth: 2, borderColor: C.border, borderStyle: 'dashed', borderRadius: 10, minHeight: 180, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' },
  uploadInner:{ alignItems: 'center', justifyContent: 'center', padding: 32 },
  uploadTxt: { color: C.ink, fontSize: 14, fontWeight: '700', marginTop: 10 },
  uploadSub: { color: C.muted, fontSize: 11, marginTop: 4 },
  panelPreview:{ width: '100%', aspectRatio: 1 },
  clearBtn:  { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 6, alignSelf: 'flex-end' },
  clearBtnTxt:{ color: C.muted, fontSize: 11 },
  analyzeBtn:{ backgroundColor: C.yellow, borderRadius: 10, paddingVertical: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 16 },
  analyzeBtnTxt:{ color: C.bg, fontSize: 14, fontWeight: '900', letterSpacing: 1 },
  analyzeSteps:{ marginTop: 32, gap: 12 },
  analyzeStep: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  analyzeStepTxt:{ color: C.muted, fontSize: 11 },
  emptyBox:  { alignItems: 'center', paddingVertical: 40, gap: 10 },
  emptyTxt:  { color: C.muted, fontSize: 13, textAlign: 'center', lineHeight: 20 },
  scoreCard: { backgroundColor: C.card, borderWidth: 1, borderColor: C.border, borderRadius: 10, padding: 20, alignItems: 'center', marginBottom: 16 },
  scoreLabel:{ color: C.muted, fontSize: 9, fontWeight: '700', letterSpacing: 2 },
  scoreNum:  { fontSize: 64, fontWeight: '900', lineHeight: 72 },
  scoreUnit: { fontSize: 20, fontWeight: '400', color: C.muted },
  scoreBar:  { width: '100%', height: 8, backgroundColor: C.border, borderRadius: 4, overflow: 'hidden', marginTop: 8 },
  scoreFill: { height: 8, borderRadius: 4 },
  scoreSub:  { color: C.muted, fontSize: 10, marginTop: 6 },
  compareRow:{ flexDirection: 'row', gap: 10, marginBottom: 16 },
  compareBox:{ flex: 1 },
  compareLabel:{ color: C.muted, fontSize: 8, fontWeight: '700', letterSpacing: 1, marginBottom: 5 },
  compareImg:{ width: '100%', aspectRatio: 1, borderRadius: 8, borderWidth: 1, borderColor: C.border },
  comparePlaceholder:{ alignItems: 'center', justifyContent: 'center', backgroundColor: C.card2 },
  issueGroup:{ marginBottom: 12 },
  groupHdr:  { fontSize: 10, fontWeight: '800', letterSpacing: 1.5, marginBottom: 6 },
  okBox:     { alignItems: 'center', paddingVertical: 32, gap: 10 },
  okTxt:     { color: C.green, fontSize: 14, fontWeight: '700' },
  lockBtn:   { borderWidth: 2, borderColor: C.green, borderRadius: 10, paddingVertical: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 12 },
  lockBtnActive:{ backgroundColor: C.green },
  lockBtnTxt:{ color: C.green, fontSize: 13, fontWeight: '900', letterSpacing: 1 },
  retryBtn:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 10, paddingVertical: 10 },
  retryTxt:  { color: C.muted, fontSize: 11 },
  descInput: { backgroundColor: C.card, borderWidth: 1, borderColor: C.border, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, color: C.ink, fontSize: 13, minHeight: 72, lineHeight: 20 },
});
const il = StyleSheet.create({
  row:    { flexDirection: 'row', alignItems: 'flex-start', padding: 12, backgroundColor: C.card, borderRadius: 8, marginBottom: 6 },
  rowError:{ backgroundColor: '#1A0005' },
  cat:    { fontSize: 9, fontWeight: '800', letterSpacing: 1.5, marginBottom: 3 },
  desc:   { color: C.ink, fontSize: 12, lineHeight: 17 },
  badge:  { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, alignSelf: 'flex-start', marginLeft: 8 },
  badgeTxt:{ fontSize: 9, fontWeight: '800' },
});
