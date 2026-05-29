/**
 * CHARACTER FACE LAB
 * Direct port of the Java AdvancedCharacterCreator blueprint.
 * Features: Face Shape · Facial Archetype · Actual / Perceived Age · Age Group detection
 *           Live Face Feature Analyzer · Face Region detection · Continuity Signature
 *           AI Prompt Builder (copyable)
 */
import { Feather } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import React, { useCallback, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// ── Palette (ink + gold) ───────────────────────────────────────────────────────
const C = {
  bg:     '#0A0806',
  bgMid:  '#14100A',
  card:   '#1A1510',
  border: '#2A2218',
  gold:   '#FFD600',
  goldDim:'#FFD60070',
  goldBg: '#FFD60015',
  white:  '#F0EAD8',
  muted:  '#7A6A58',
  green:  '#22C55E',
  error:  '#EF4444',
};

// ── Data — direct port from Java spec ─────────────────────────────────────────

const FACE_SHAPES = [
  { value: 'OVAL',      emoji: '🟡', desc: 'Classic balanced proportions' },
  { value: 'ROUND',     emoji: '⭕', desc: 'Soft full cheeks' },
  { value: 'SQUARE',    emoji: '🟥', desc: 'Strong angular jaw' },
  { value: 'RECTANGLE', emoji: '📐', desc: 'Long with parallel sides' },
  { value: 'TRIANGLE',  emoji: '🔺', desc: 'Narrow forehead, wide jaw' },
  { value: 'HEART',     emoji: '❤️',  desc: 'Wide forehead, pointed chin' },
  { value: 'DIAMOND',   emoji: '💎', desc: 'Narrow at brow and jaw' },
  { value: 'LONG',      emoji: '📏', desc: 'Elongated proportions' },
  { value: 'GAUNT',     emoji: '💀', desc: 'Hollow cheeks, sunken eyes' },
  { value: 'HEROIC',    emoji: '⚜️',  desc: 'Idealized comic hero face' },
  { value: 'MONSTER',   emoji: '👹', desc: 'Non-human distortion' },
  { value: 'SYNTHETIC', emoji: '🤖', desc: 'Android / synthetic face' },
  { value: 'ALIEN',     emoji: '👽', desc: 'Extra-terrestrial features' },
] as const;

type FaceShape = (typeof FACE_SHAPES)[number]['value'];

const FACIAL_ARCHETYPES = [
  { value: 'CLEAN_HERO',      emoji: '⚜️',  desc: 'Perfect jawline, bright eyes, strong brow' },
  { value: 'GRIZZLED_VETERAN',emoji: '🪖', desc: 'Battle-worn, stubble, weathered scars' },
  { value: 'MAD_TITAN',       emoji: '💜', desc: 'Colossal chinned, alien-hued, intense gaze' },
  { value: 'STREET_FIGHTER',  emoji: '🥊', desc: 'Broken nose, cut brow, scarred cheek' },
  { value: 'NOBLE_KING',      emoji: '👑', desc: 'Regal bearing, high cheekbones, proud chin' },
  { value: 'DEMONIC',         emoji: '😈', desc: 'Horns, flame irises, fissured dark skin' },
  { value: 'CYBORG',          emoji: '🤖', desc: 'Partial metal plate, optical lens, data ports' },
  { value: 'MUTANT',          emoji: '🧬', desc: 'Extra features, bone ridges, feral eyes' },
  { value: 'GODLIKE',         emoji: '⚡', desc: 'Luminous skin, cosmic pupils, ageless' },
  { value: 'DETECTIVE',       emoji: '🔍', desc: 'Sharp observant eyes, gaunt, analytical' },
  { value: 'ASSASSIN',        emoji: '🗡️',  desc: 'Cold, controlled, expressionless mask' },
  { value: 'MONSTER',         emoji: '👹', desc: 'Fangs, multiple eyes, inhuman structure' },
  { value: 'SPACE_WARRIOR',   emoji: '🚀', desc: 'Alien-blended, battle-hardened cosmos veteran' },
  { value: 'ANCIENT_WIZARD',  emoji: '🧙', desc: 'Deep wrinkles, glowing irises, ancient beard' },
] as const;

type FacialArchetype = (typeof FACIAL_ARCHETYPES)[number]['value'];

type AgeGroup =
  | 'INFANT' | 'CHILD' | 'PRETEEN' | 'TEEN'
  | 'YOUNG ADULT' | 'ADULT' | 'MIDDLE-AGED'
  | 'ELDER' | 'ANCIENT' | 'IMMORTAL';

const AGE_GROUP_COLORS: Record<AgeGroup, string> = {
  'INFANT':      '#60A5FA',
  'CHILD':       '#34D399',
  'PRETEEN':     '#A78BFA',
  'TEEN':        '#F472B6',
  'YOUNG ADULT': '#22C55E',
  'ADULT':       C.gold,
  'MIDDLE-AGED': '#FB923C',
  'ELDER':       '#9CA3AF',
  'ANCIENT':     '#EF4444',
  'IMMORTAL':    '#818CF8',
};

function determineAgeGroup(age: number): AgeGroup {
  if (age <= 3)   return 'INFANT';
  if (age <= 12)  return 'CHILD';
  if (age <= 15)  return 'PRETEEN';
  if (age <= 19)  return 'TEEN';
  if (age <= 30)  return 'YOUNG ADULT';
  if (age <= 45)  return 'ADULT';
  if (age <= 60)  return 'MIDDLE-AGED';
  if (age <= 120) return 'ELDER';
  if (age <= 1000)return 'ANCIENT';
  return 'IMMORTAL';
}

// ── Face Feature Analyzer (ported from Java FaceFeatureAnalyzer) ──────────────

interface FaceFeatures {
  scars:             boolean;
  beard:             boolean;
  eyeDamage:         boolean;
  ageLines:          boolean;
  burnMarks:         boolean;
  faceTattoos:       boolean;
  brokenNose:        boolean;
  cyberneticFeatures:boolean;
  glowingEyes:       boolean;
  crackedSkin:       boolean;
  missingJaw:        boolean;
  affectedRegions:   string[];
}

function analyzeFaceText(input: string): FaceFeatures {
  const t = input.toLowerCase();
  const regions: string[] = [];
  if (t.includes('left eye'))   regions.push('LEFT EYE');
  if (t.includes('right eye'))  regions.push('RIGHT EYE');
  if (t.includes('forehead'))   regions.push('FOREHEAD');
  if (t.includes('cheek'))      regions.push('CHEEK');
  if (t.includes('jaw'))        regions.push('JAW');
  if (t.includes('nose'))       regions.push('NOSE');
  if (t.includes('chin'))       regions.push('CHIN');
  if (t.includes('mouth'))      regions.push('MOUTH');
  return {
    scars:              t.includes('scar'),
    beard:              t.includes('beard') || t.includes('stubble') || t.includes('mustache'),
    eyeDamage:          t.includes('eye patch') || t.includes('missing eye') || t.includes('cyber eye') || t.includes('damaged eye'),
    ageLines:           t.includes('wrinkle') || t.includes('aged') || t.includes('old'),
    burnMarks:          t.includes('burn'),
    faceTattoos:        t.includes('tattoo') || t.includes('markings'),
    brokenNose:         t.includes('broken nose'),
    cyberneticFeatures: t.includes('cybernetic') || t.includes('robotic') || t.includes('mechanical'),
    glowingEyes:        t.includes('glowing eyes') || t.includes('red eyes') || t.includes('energy eyes'),
    crackedSkin:        t.includes('cracked skin') || t.includes('stone skin'),
    missingJaw:         t.includes('missing jaw') || t.includes('metal jaw'),
    affectedRegions:    regions,
  };
}

// ── Continuity Signature (ported from Java ContinuityBuilder) ─────────────────

interface ContinuitySignature {
  wrinkleMap:      number;
  beardDensity:    number;
  grayHairRatio:   number;
  eyeAging:        number;
  postureProfile:  number;
  skinTexture:     number;
  muscleLoss:      number;
}

function buildSignature(features: FaceFeatures, age: number): ContinuitySignature {
  return {
    wrinkleMap:    Math.min(10, +(age * 0.1).toFixed(1)),
    grayHairRatio: Math.min(10, +(age * 0.02).toFixed(2)),
    eyeAging:      Math.min(10, +(age * 0.05).toFixed(2)),
    skinTexture:   Math.min(10, +(age * 0.03).toFixed(2)),
    postureProfile:Math.min(10, +(age * 0.04).toFixed(2)),
    muscleLoss:    Math.min(10, +(age * 0.02).toFixed(2)),
    beardDensity:  features.beard ? 9.0 : 1.0,
  };
}

// ── AI Prompt Builder (ported from Java AIPromptBuilder) ──────────────────────

function buildAIPrompt(
  name: string,
  faceShape: FaceShape | null,
  archetype: FacialArchetype | null,
  ageGroup: AgeGroup,
  actualAge: number,
  perceivedAge: number,
  faceDesc: string,
  agingNotes: string,
  features: FaceFeatures,
): string {
  const parts: string[] = [];
  if (name.trim()) parts.push(name.trim() + '.');
  if (archetype)   parts.push(archetype.replace(/_/g, ' ') + '.');
  if (faceShape)   parts.push(faceShape + ' face shape.');
  parts.push(ageGroup + '.');
  parts.push(`Actual age ${actualAge}.`);
  parts.push(`Perceived age ${perceivedAge}.`);
  if (faceDesc.trim())    parts.push(faceDesc.trim() + '.');
  if (agingNotes.trim())  parts.push(agingNotes.trim() + '.');
  if (features.scars)              parts.push('Visible facial scars.');
  if (features.beard)              parts.push('Detailed beard texture.');
  if (features.eyeDamage)          parts.push('Eye damage or cybernetic eye.');
  if (features.ageLines)           parts.push('Detailed wrinkles and aging lines.');
  if (features.burnMarks)          parts.push('Burn damage on face.');
  if (features.faceTattoos)        parts.push('Facial tattoos or markings.');
  if (features.brokenNose)         parts.push('Broken fighter nose.');
  if (features.cyberneticFeatures) parts.push('Cybernetic facial features.');
  if (features.glowingEyes)        parts.push('Glowing eyes.');
  if (features.crackedSkin)        parts.push('Cracked stone skin texture.');
  if (features.missingJaw)         parts.push('Mechanical jaw replacement.');
  parts.push('Professional comic art. Consistent classic comics quality character design. Highly detailed facial continuity. Cinematic comic rendering.');
  return parts.join(' ');
}

// ── Tiny subcomponents ────────────────────────────────────────────────────────

function SectionHeader({ emoji, title, sub }: { emoji: string; title: string; sub?: string }) {
  return (
    <View style={sh.wrap}>
      <Text style={sh.emoji}>{emoji}</Text>
      <View>
        <Text style={sh.title}>{title}</Text>
        {sub && <Text style={sh.sub}>{sub}</Text>}
      </View>
    </View>
  );
}
const sh = StyleSheet.create({
  wrap:  { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 },
  emoji: { fontSize: 20 },
  title: { fontFamily: 'Inter_700Bold', fontSize: 13, color: C.gold, letterSpacing: 1 },
  sub:   { fontFamily: 'Inter_400Regular', fontSize: 11, color: C.muted, marginTop: 1 },
});

function AgePicker({
  label, value, onChange,
}: { label: string; value: number; onChange: (v: number) => void }) {
  return (
    <View style={ap.wrap}>
      <Text style={ap.label}>{label}</Text>
      <View style={ap.row}>
        <TouchableOpacity
          style={ap.btn}
          onPress={() => { Haptics.selectionAsync(); onChange(Math.max(1, value - 1)); }}
          activeOpacity={0.7}
        >
          <Feather name="minus" size={14} color={C.gold} />
        </TouchableOpacity>
        <Text style={ap.val}>{value}</Text>
        <TouchableOpacity
          style={ap.btn}
          onPress={() => { Haptics.selectionAsync(); onChange(Math.min(10000, value + 1)); }}
          activeOpacity={0.7}
        >
          <Feather name="plus" size={14} color={C.gold} />
        </TouchableOpacity>
      </View>
    </View>
  );
}
const ap = StyleSheet.create({
  wrap:  { flex: 1 },
  label: { fontFamily: 'Inter_600SemiBold', fontSize: 11, color: C.muted, marginBottom: 8, letterSpacing: 0.5 },
  row:   { flexDirection: 'row', alignItems: 'center', gap: 0, backgroundColor: C.card, borderRadius: 10, borderWidth: 1, borderColor: C.border, overflow: 'hidden' },
  btn:   { width: 40, height: 40, alignItems: 'center', justifyContent: 'center', backgroundColor: C.bgMid },
  val:   { flex: 1, fontFamily: 'Inter_700Bold', fontSize: 18, color: C.white, textAlign: 'center' },
});

function FeaturePill({ label, active }: { label: string; active: boolean }) {
  return (
    <View style={[fp.pill, { borderColor: active ? C.gold : C.border, backgroundColor: active ? C.goldBg : 'transparent' }]}>
      {active && <Feather name="check" size={9} color={C.gold} />}
      <Text style={[fp.text, { color: active ? C.gold : C.muted }]}>{label}</Text>
    </View>
  );
}
const fp = StyleSheet.create({
  pill: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 9, paddingVertical: 5, borderRadius: 20, borderWidth: 1 },
  text: { fontFamily: 'Inter_600SemiBold', fontSize: 11 },
});

function SignatureBar({ label, value }: { label: string; value: number }) {
  const pct = Math.min(100, (value / 10) * 100);
  const color = pct > 66 ? C.error : pct > 33 ? '#FB923C' : C.green;
  return (
    <View style={sg.row}>
      <Text style={sg.label}>{label}</Text>
      <View style={sg.track}>
        <View style={[sg.fill, { width: `${pct}%` as any, backgroundColor: color }]} />
      </View>
      <Text style={[sg.val, { color }]}>{value.toFixed(1)}</Text>
    </View>
  );
}
const sg = StyleSheet.create({
  row:   { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 7 },
  label: { width: 108, fontFamily: 'Inter_600SemiBold', fontSize: 11, color: C.muted },
  track: { flex: 1, height: 5, borderRadius: 3, backgroundColor: C.border, overflow: 'hidden' },
  fill:  { height: 5, borderRadius: 3 },
  val:   { width: 34, fontFamily: 'Inter_700Bold', fontSize: 11, textAlign: 'right' },
});

// ── Main Screen ───────────────────────────────────────────────────────────────

export default function CharacterFaceLab() {
  const insets = useSafeAreaInsets();

  const [name,         setName]         = useState('');
  const [faceShape,    setFaceShape]    = useState<FaceShape | null>(null);
  const [archetype,    setArchetype]    = useState<FacialArchetype | null>(null);
  const [actualAge,    setActualAge]    = useState(30);
  const [perceivedAge, setPerceivedAge] = useState(30);
  const [faceDesc,     setFaceDesc]     = useState('');
  const [agingNotes,   setAgingNotes]   = useState('');
  const [copied,       setCopied]       = useState(false);

  const copyTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const ageGroup  = useMemo(() => determineAgeGroup(perceivedAge), [perceivedAge]);
  const features  = useMemo(() => analyzeFaceText(faceDesc), [faceDesc]);
  const signature = useMemo(() => buildSignature(features, actualAge), [features, actualAge]);
  const aiPrompt  = useMemo(
    () => buildAIPrompt(name, faceShape, archetype, ageGroup, actualAge, perceivedAge, faceDesc, agingNotes, features),
    [name, faceShape, archetype, ageGroup, actualAge, perceivedAge, faceDesc, agingNotes, features],
  );

  const handleCopy = useCallback(async () => {
    await Clipboard.setStringAsync(aiPrompt);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setCopied(true);
    if (copyTimerRef.current) clearTimeout(copyTimerRef.current);
    copyTimerRef.current = setTimeout(() => setCopied(false), 2200);
  }, [aiPrompt]);

  const detectedCount = Object.entries(features).filter(
    ([k, v]) => k !== 'affectedRegions' && v === true
  ).length;

  const topPad = Platform.OS === 'web' ? 16 : insets.top;
  const botPad = Platform.OS === 'web' ? 24 : insets.bottom + 24;

  return (
    <View style={[s.root, { paddingTop: topPad }]}>
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          style={s.backBtn}
        >
          <Feather name="arrow-left" size={20} color={C.white} />
        </TouchableOpacity>
        <View style={s.headerCenter}>
          <Text style={s.headerTitle}>FACE LAB</Text>
          <Text style={s.headerSub}>Face Shape · Archetype · Age · AI Prompt</Text>
        </View>
        <View style={[s.detectedBadge, { borderColor: detectedCount > 0 ? C.gold : C.border }]}>
          <Text style={[s.detectedCount, { color: detectedCount > 0 ? C.gold : C.muted }]}>
            {detectedCount}
          </Text>
          <Text style={[s.detectedLabel, { color: detectedCount > 0 ? C.goldDim : C.muted }]}>
            detected
          </Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={[s.scroll, { paddingBottom: botPad }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >

        {/* ── 1. Character Name ─────────────────────────────────────────── */}
        <View style={s.card}>
          <SectionHeader emoji="✏️" title="CHARACTER NAME" sub="Used in the AI prompt output" />
          <TextInput
            style={s.nameInput}
            value={name}
            onChangeText={setName}
            placeholder="e.g. Victor Ashfall, Kira Nova…"
            placeholderTextColor={C.muted}
            returnKeyType="done"
          />
        </View>

        {/* ── 2. Face Shape ─────────────────────────────────────────────── */}
        <View style={s.card}>
          <SectionHeader emoji="🫀" title="FACE SHAPE" sub="Structural foundation of the face" />
          <View style={s.pillGrid}>
            {FACE_SHAPES.map((fs) => {
              const sel = faceShape === fs.value;
              return (
                <TouchableOpacity
                  key={fs.value}
                  style={[s.shapePill, { borderColor: sel ? C.gold : C.border, backgroundColor: sel ? C.goldBg : C.bgMid }]}
                  onPress={() => { Haptics.selectionAsync(); setFaceShape(sel ? null : fs.value); }}
                  activeOpacity={0.8}
                >
                  <Text style={s.pillEmoji}>{fs.emoji}</Text>
                  <View>
                    <Text style={[s.pillLabel, { color: sel ? C.gold : C.white }]}>{fs.value}</Text>
                    <Text style={s.pillDesc}>{fs.desc}</Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* ── 3. Facial Archetype ───────────────────────────────────────── */}
        <View style={s.card}>
          <SectionHeader emoji="🎭" title="FACIAL ARCHETYPE" sub="Classic comics character archetype set" />
          <View style={s.pillGrid}>
            {FACIAL_ARCHETYPES.map((fa) => {
              const sel = archetype === fa.value;
              return (
                <TouchableOpacity
                  key={fa.value}
                  style={[s.shapePill, { borderColor: sel ? C.gold : C.border, backgroundColor: sel ? C.goldBg : C.bgMid }]}
                  onPress={() => { Haptics.selectionAsync(); setArchetype(sel ? null : fa.value); }}
                  activeOpacity={0.8}
                >
                  <Text style={s.pillEmoji}>{fa.emoji}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={[s.pillLabel, { color: sel ? C.gold : C.white }]}>
                      {fa.value.replace(/_/g, ' ')}
                    </Text>
                    <Text style={s.pillDesc}>{fa.desc}</Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* ── 4. Age System ────────────────────────────────────────────── */}
        <View style={s.card}>
          <SectionHeader emoji="⏳" title="AGE SYSTEM" sub="Actual age affects continuity · Perceived age sets age group" />
          <View style={s.ageRow}>
            <AgePicker label="ACTUAL AGE" value={actualAge} onChange={setActualAge} />
            <View style={s.ageDivider} />
            <AgePicker label="PERCEIVED AGE" value={perceivedAge} onChange={setPerceivedAge} />
          </View>
          {/* Age Group badge */}
          <View style={s.ageGroupRow}>
            <Text style={s.ageGroupLabel}>Age Group:</Text>
            <View style={[s.ageGroupBadge, { backgroundColor: (AGE_GROUP_COLORS[ageGroup] ?? C.gold) + '20', borderColor: AGE_GROUP_COLORS[ageGroup] ?? C.gold }]}>
              <Text style={[s.ageGroupText, { color: AGE_GROUP_COLORS[ageGroup] ?? C.gold }]}>{ageGroup}</Text>
            </View>
          </View>
        </View>

        {/* ── 5. Face Details / Feature Analyzer ───────────────────────── */}
        <View style={s.card}>
          <SectionHeader
            emoji="🔬"
            title="FACE DETAILS — FEATURE ANALYZER"
            sub="Describe face: scars, beard, cybernetic eye, tattoos, burns…"
          />
          <TextInput
            style={s.textArea}
            value={faceDesc}
            onChangeText={setFaceDesc}
            placeholder={'e.g. Deep scar across left eye, heavy stubble, broken nose, cybernetic right eye glowing red, forehead burn marks…'}
            placeholderTextColor={C.muted}
            multiline
            numberOfLines={5}
            textAlignVertical="top"
          />

          {/* Live feature detection pills */}
          <Text style={s.detectedTitle}>DETECTED FEATURES</Text>
          <View style={s.featurePills}>
            <FeaturePill label="Scars"        active={features.scars} />
            <FeaturePill label="Beard"        active={features.beard} />
            <FeaturePill label="Eye Damage"   active={features.eyeDamage} />
            <FeaturePill label="Wrinkles"     active={features.ageLines} />
            <FeaturePill label="Burns"        active={features.burnMarks} />
            <FeaturePill label="Tattoos"      active={features.faceTattoos} />
            <FeaturePill label="Broken Nose"  active={features.brokenNose} />
            <FeaturePill label="Cybernetic"   active={features.cyberneticFeatures} />
            <FeaturePill label="Glowing Eyes" active={features.glowingEyes} />
            <FeaturePill label="Cracked Skin" active={features.crackedSkin} />
            <FeaturePill label="Missing Jaw"  active={features.missingJaw} />
          </View>

          {/* Affected regions */}
          {features.affectedRegions.length > 0 && (
            <View style={s.regionsRow}>
              <Text style={s.regionsLabel}>REGIONS:</Text>
              {features.affectedRegions.map((r) => (
                <View key={r} style={s.regionChip}>
                  <Text style={s.regionText}>{r}</Text>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* ── 6. Aging Notes ───────────────────────────────────────────── */}
        <View style={s.card}>
          <SectionHeader emoji="📜" title="AGING NOTES / PHYSICAL WEAR" sub="Battle damage, fatigue, time-worn details" />
          <TextInput
            style={[s.textArea, { minHeight: 90 }]}
            value={agingNotes}
            onChangeText={setAgingNotes}
            placeholder={'e.g. Decades of combat aging, sunken eyes from lack of sleep, knuckle scarring visible in face muscles…'}
            placeholderTextColor={C.muted}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
        </View>

        {/* ── 7. Continuity Signature ───────────────────────────────────── */}
        <View style={s.card}>
          <SectionHeader emoji="🧬" title="CONTINUITY SIGNATURE" sub="Consistency scores derived from age + features" />
          <SignatureBar label="Wrinkle Map"    value={signature.wrinkleMap} />
          <SignatureBar label="Beard Density"  value={signature.beardDensity} />
          <SignatureBar label="Gray Hair"      value={signature.grayHairRatio} />
          <SignatureBar label="Eye Aging"      value={signature.eyeAging} />
          <SignatureBar label="Posture"        value={signature.postureProfile} />
          <SignatureBar label="Skin Texture"   value={signature.skinTexture} />
          <SignatureBar label="Muscle Loss"    value={signature.muscleLoss} />
        </View>

        {/* ── 8. AI Prompt Output ───────────────────────────────────────── */}
        <View style={s.card}>
          <View style={s.promptHeader}>
            <SectionHeader emoji="🤖" title="AI IMAGE PROMPT" />
            <TouchableOpacity
              style={[s.copyBtn, { borderColor: copied ? C.green : C.border, backgroundColor: copied ? C.green + '18' : C.bgMid }]}
              onPress={handleCopy}
              activeOpacity={0.8}
            >
              <Feather name={copied ? 'check' : 'copy'} size={13} color={copied ? C.green : C.muted} />
              <Text style={[s.copyBtnText, { color: copied ? C.green : C.muted }]}>
                {copied ? 'COPIED!' : 'COPY'}
              </Text>
            </TouchableOpacity>
          </View>
          <View style={s.promptBox}>
            <Text style={s.promptText} selectable>{aiPrompt}</Text>
          </View>
          <Text style={s.promptHint}>
            Paste this into any AI image generator. It includes your face shape, archetype, age group, detected features, and aging notes.
          </Text>
        </View>

      </ScrollView>
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  header: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: 16, paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: C.border,
  },
  backBtn: { width: 32, alignItems: 'center' },
  headerCenter: { flex: 1 },
  headerTitle: { fontFamily: 'Inter_700Bold', fontSize: 16, color: C.white, letterSpacing: 1 },
  headerSub:   { fontFamily: 'Inter_400Regular', fontSize: 11, color: C.muted, marginTop: 1 },
  detectedBadge: {
    alignItems: 'center', borderWidth: 1, borderRadius: 10,
    paddingHorizontal: 8, paddingVertical: 4,
  },
  detectedCount: { fontFamily: 'Inter_700Bold', fontSize: 16, lineHeight: 20 },
  detectedLabel: { fontFamily: 'Inter_400Regular', fontSize: 9, letterSpacing: 0.5 },
  scroll: { padding: 16, gap: 12 },

  card: {
    backgroundColor: C.card, borderWidth: 1, borderColor: C.border,
    borderRadius: 14, padding: 16,
  },

  // Name input
  nameInput: {
    backgroundColor: C.bgMid, borderWidth: 1, borderColor: C.border, borderRadius: 10,
    paddingHorizontal: 14, paddingVertical: 12,
    fontFamily: 'Inter_400Regular', fontSize: 15, color: C.white,
  },

  // Pill grid (face shapes + archetypes)
  pillGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  shapePill: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    borderWidth: 1, borderRadius: 10,
    paddingHorizontal: 10, paddingVertical: 8,
    width: '48%',
  },
  pillEmoji: { fontSize: 18, width: 26, textAlign: 'center' },
  pillLabel: { fontFamily: 'Inter_700Bold', fontSize: 11, letterSpacing: 0.5 },
  pillDesc:  { fontFamily: 'Inter_400Regular', fontSize: 10, color: C.muted, marginTop: 1 },

  // Age
  ageRow: { flexDirection: 'row', gap: 12, marginBottom: 14 },
  ageDivider: { width: 1, backgroundColor: C.border, alignSelf: 'stretch' },
  ageGroupRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  ageGroupLabel: { fontFamily: 'Inter_600SemiBold', fontSize: 12, color: C.muted },
  ageGroupBadge: { borderWidth: 1, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 4 },
  ageGroupText:  { fontFamily: 'Inter_700Bold', fontSize: 12, letterSpacing: 1 },

  // Text areas
  textArea: {
    backgroundColor: C.bgMid, borderWidth: 1, borderColor: C.border, borderRadius: 10,
    paddingHorizontal: 14, paddingVertical: 12,
    fontFamily: 'Inter_400Regular', fontSize: 13, color: C.white, lineHeight: 20,
    minHeight: 110,
  },

  // Feature detection
  detectedTitle: {
    fontFamily: 'Inter_700Bold', fontSize: 10, color: C.muted,
    letterSpacing: 1.5, marginTop: 14, marginBottom: 8,
  },
  featurePills: { flexDirection: 'row', flexWrap: 'wrap', gap: 7 },
  regionsRow:   { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 6, marginTop: 10 },
  regionsLabel: { fontFamily: 'Inter_700Bold', fontSize: 10, color: C.muted, letterSpacing: 1 },
  regionChip: {
    backgroundColor: '#60A5FA15', borderWidth: 1, borderColor: '#60A5FA40',
    borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3,
  },
  regionText: { fontFamily: 'Inter_600SemiBold', fontSize: 10, color: '#60A5FA' },

  // AI Prompt
  promptHeader: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 0 },
  copyBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    borderWidth: 1, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6,
  },
  copyBtnText: { fontFamily: 'Inter_700Bold', fontSize: 11, letterSpacing: 1 },
  promptBox: {
    backgroundColor: C.bgMid, borderWidth: 1, borderColor: C.border,
    borderRadius: 10, padding: 14, marginTop: 4,
  },
  promptText: {
    fontFamily: 'Inter_400Regular', fontSize: 12, color: C.white, lineHeight: 20,
  },
  promptHint: {
    fontFamily: 'Inter_400Regular', fontSize: 11, color: C.muted,
    marginTop: 10, lineHeight: 16,
  },
});
