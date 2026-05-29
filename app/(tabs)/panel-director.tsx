import { Feather } from '@expo/vector-icons';
import { useAuth } from '@clerk/expo';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator, Image, ScrollView, StyleSheet,
  Text, TextInput, TouchableOpacity, View,
} from 'react-native';

import { API_BASE } from '@/constants/api';
import { useCinematicInsets } from '@/hooks/useCinematicDevice';

const C = {
  bg: '#0E0C0A', card: '#181410', card2: '#1E1812', border: '#2E2618',
  yellow: '#FFD600', red: '#E8001C', blue: '#0057A8', green: '#2A7A3A',
  ink: '#F0EAD8', muted: '#7A6A58',
};

// ── Shot Library ──────────────────────────────────────────────────────────────
const SHOTS = [
  { name: 'Extreme Long',  framing: 'Tiny in vast space',       emo: 'Isolation', angle: 'Eye Level' },
  { name: 'Long Shot',     framing: 'Full body visible',         emo: 'Action',    angle: 'Eye Level' },
  { name: 'Medium-Long Shot', framing: 'Mid-thigh to head (knees up)', emo: 'Standoff',  angle: 'Eye Level' },
  { name: 'Medium Shot',   framing: 'Waist to head',             emo: 'Dialogue',  angle: 'Eye Level' },
  { name: 'Close-Up',      framing: 'Face & shoulders',          emo: 'Tension',   angle: 'Eye Level' },
  { name: 'Extreme CU',    framing: 'Single detail / eyes',      emo: 'Shock',     angle: 'Any' },
  { name: "Bird's Eye",    framing: 'Looking straight down',     emo: 'Scale',     angle: "Bird's Eye" },
  { name: "Worm's Eye",    framing: 'Looking straight up',       emo: 'Dominance', angle: "Worm's Eye" },
  { name: 'Over Shoulder', framing: 'Behind a character',        emo: 'POV',       angle: 'Eye Level' },
  { name: 'Dutch Angle',   framing: 'Tilted / canted frame',     emo: 'Unease',    angle: 'Dutch Angle' },
  { name: 'Point of View', framing: "Character's viewpoint",     emo: 'Immersion', angle: 'First Person' },
];

const POSITIONS     = ['Top Left','Top Center','Top Right','Bottom Left','Bottom Center','Bottom Right','Full Width'];
const CAMERA_ANGLES = ['Eye Level','Dutch Angle',"Bird's Eye","Worm's Eye",'High Angle','Low Angle','First Person'];
const LENSES        = ['24mm','35mm','50mm','85mm','135mm'];
const EMOTIONS      = ['Suspense','Calm','Determination','Fear','Anger','Surprise','Grief','Cold','Menacing','Heroic'];
const LIGHTING_TYPES= ['Neon Rim Light','Three-Point','Natural','Hard Side Light','Backlight','Silhouette','Chiaroscuro','Moonlight'];
const LIGHTING_DIRS = ['Left','Right','Top','Bottom','Front','Behind'];
const BASE_ENVIRONMENTS = ['Rainy Alley','Rooftop','Underground Lab','Neon City','Dark Warehouse','Hospital','Police Station','Desert',
  'Abandoned Cathedral','Space Station Dock','Cyberpunk Street Market','Ancient Temple Ruins','Frozen Tundra','Submarine Interior',
  'Dreamscape Void','Burning Skyscraper','Fairy-Tale Forest','High-Speed Train','Vampire Manor','Dystopian Checkpoint','Floating Sky Island',
  'Volcanic Wasteland','Crystal Cavern','Ghost Town Saloon','Mech Graveyard','Arctic Research Base','Bioluminescent Reef'];
const EFFECTS       = ['Rain','Snow','Fog','Motion Blur','Glow','Fire','Smoke','Lightning','Speed Lines','Explosion'];
const BUBBLE_PLACES = ['Upper Left','Upper Right','Lower Left','Lower Right','None'];
const CONTINUITY_RULES = [
  'Same face & facial features',
  'Same jacket / outfit',
  'Same body proportions',
  'Wet clothing continuity',
  'Maintain damage & marks',
  'Consistent accessories',
];

type Phase = 'input' | 'generating' | 'result';

interface CharacterDNA {
  name: string; faceShape: string; eyeStyle: string; hairStyle: string;
  outfitTop: string; outfitBottom: string; colorPalette: string;
  bodyProportion: number; artStyle: string; personality: string;
  accessories: string[];
}
interface CharacterState { facingDirection: string; [k: string]: string | number | boolean }
interface ComicProject {
  title: string; characterProfiles: CharacterDNA[];
  continuityState: { currentScene: number; characterStates: Record<string, CharacterState> };
  panels: { panelId: number; shotType: string }[];
}

function Chip({ label, active, color, onPress }: { label: string; active: boolean; color?: string; onPress: () => void }) {
  const ac = color ?? C.yellow;
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.75}
      style={[ch.chip, active && { borderColor: ac, backgroundColor: ac + '22' }]}>
      <Text style={[ch.txt, active && { color: ac }]}>{label}</Text>
    </TouchableOpacity>
  );
}
const ch = StyleSheet.create({
  chip: { borderWidth: 1, borderColor: C.border, borderRadius: 20, paddingHorizontal: 11, paddingVertical: 4, marginRight: 6, marginBottom: 6 },
  txt:  { color: C.muted, fontSize: 11, fontWeight: '600' },
});
function FL({ text }: { text: string }) {
  return <Text style={{ color: C.muted, fontSize: 9, fontWeight: '700', letterSpacing: 1.5, marginBottom: 5, marginTop: 12 }}>{text}</Text>;
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function PanelDirector() {
  const cinInsets = useCinematicInsets();
  const { getToken } = useAuth();

  // Project context
  const [project, setProject]       = useState<ComicProject | null>(null);
  const [characters, setCharacters] = useState<CharacterDNA[]>([]);
  const [activeChar, setActiveChar] = useState<CharacterDNA | null>(null);

  // Panel spec
  const [directorNote, setDirectorNote] = useState('');
  const [panelNumber, setPanelNumber]   = useState(1);
  const [position, setPosition]         = useState('Top Left');
  const [shotType, setShotType]         = useState('Medium-Long Shot');
  const [cameraAngle, setCameraAngle]   = useState('Eye Level');
  const [lens, setLens]                 = useState('50mm');
  const [emotion, setEmotion]           = useState('Suspense');
  const [action, setAction]             = useState('');
  const [environment, setEnvironment]   = useState('Rainy Alley');
  const [customEnvs, setCustomEnvs]     = useState<string[]>([]);
  const [customEnvInput, setCustomEnvInput] = useState('');
  const [showCustomEnv, setShowCustomEnv] = useState(false);
  const [lightingType, setLightingType] = useState('Neon Rim Light');
  const [lightingDir, setLightingDir]   = useState('Left');
  const [effects, setEffects]           = useState<string[]>(['Rain','Glow']);
  const [bubblePlace, setBubblePlace]   = useState('Upper Right');
  const [contRef, setContRef]           = useState('');
  const [contRules, setContRules]       = useState<string[]>(['Same face & facial features','Same jacket / outfit','Same body proportions']);
  const [dialogue, setDialogue]         = useState('');

  // Generation
  const [phase, setPhase]       = useState<Phase>('input');
  const [resultB64, setResultB64] = useState<string | null>(null);
  const [genError, setGenError] = useState<string | null>(null);
  const [slowWarn, setSlowWarn] = useState(false);
  const [promptPreview, setPromptPreview] = useState('');

  useEffect(() => {
    AsyncStorage.getItem('@bloomscript:active_project').then(raw => {
      if (!raw) return;
      try {
        const proj = JSON.parse(raw) as ComicProject;
        setProject(proj);
        setCharacters(proj.characterProfiles ?? []);
        if (proj.characterProfiles?.length) setActiveChar(proj.characterProfiles[0]!);
        if (proj.panels?.length) {
          setPanelNumber(proj.panels.length + 1);
          setContRef(`panel_${String(proj.panels.length).padStart(3, '0')}`);
        }
      } catch { /* ignore */ }
    });
    AsyncStorage.getItem('@bloomscript:custom_environments').then(raw => {
      if (!raw) return;
      try { setCustomEnvs(JSON.parse(raw)); } catch { /* ignore */ }
    });
  }, []);

  const toggleEffect = (e: string) =>
    setEffects(prev => prev.includes(e) ? prev.filter(x => x !== e) : [...prev, e]);
  const toggleRule = (r: string) =>
    setContRules(prev => prev.includes(r) ? prev.filter(x => x !== r) : [...prev, r]);

  const pickShot = (shot: typeof SHOTS[0]) => {
    setShotType(shot.name);
    setCameraAngle(shot.angle);
    if (!emotion) setEmotion(shot.emo);
  };

  const buildContinuityDesc = () => {
    if (!activeChar) return '';
    const state = project?.continuityState.characterStates[activeChar.name];
    if (!state) return '';
    return Object.entries(state)
      .map(([k, v]) => `${k}: ${v}`)
      .join(', ');
  };

  const generate = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    setGenError(null); setSlowWarn(false); setResultB64(null);

    const contDesc = buildContinuityDesc();
    const rulesStr = contRules.length ? `Maintain: ${contRules.join(', ')}.` : '';
    const preview = [
      `${shotType} · ${cameraAngle} · ${lens}`,
      `${emotion} · ${action || 'in scene'}`,
      `${environment} · ${lightingType} from ${lightingDir}`,
      effects.length ? `FX: ${effects.join(', ')}` : '',
      rulesStr,
      directorNote ? `Director: "${directorNote}"` : '',
    ].filter(Boolean).join(' | ');
    setPromptPreview(preview);
    setPhase('generating');

    const slowTimer = setTimeout(() => setSlowWarn(true), 20_000);

    try {
      const token = await getToken();
      const ctrl  = new AbortController();
      const hard  = setTimeout(() => ctrl.abort(), 50_000);

      let res: Response;
      try {
        res = await fetch(`${API_BASE}/ai-studio/panel-director`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({
            characterDNA: activeChar,
            continuityState: buildContinuityDesc(),
            panel: {
              panelNumber, panelPosition: position,
              shotType, cameraAngle, lens, emotion,
              action: action || `Character in scene`,
              lighting: { type: lightingType, direction: lightingDir },
              environment, effects, speechBubblePlacement: bubblePlace,
              dialogue, continuityReference: contRef,
              continuityConstraints: contRules, directorNote,
            },
            projectTitle: project?.title ?? '',
          }),
          signal: ctrl.signal,
        });
      } catch (err: any) {
        clearTimeout(hard);
        throw err?.name === 'AbortError' ? new Error('Timed out — please retry') : err;
      }
      clearTimeout(hard);
      if (!res.ok) throw new Error(`Generation failed (${res.status})`);
      const { imageBase64 } = await res.json() as { imageBase64: string };
      setResultB64(imageBase64);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setPhase('result');
    } catch (err: any) {
      setGenError(err.message ?? 'Generation failed');
      setPhase('input');
    } finally {
      clearTimeout(slowTimer); setSlowWarn(false);
    }
  };

  // ── INPUT phase ───────────────────────────────────────────────────────────
  if (phase === 'input') return (
    <View style={[s.root, { paddingTop: cinInsets.top }]}>
      <View style={[s.hdr, { paddingHorizontal: cinInsets.horizontal }]}>
        <TouchableOpacity onPress={() => router.back()} style={s.hdrBtn}><Feather name="arrow-left" size={20} color={C.ink} /></TouchableOpacity>
        <View style={{ flex: 1, marginHorizontal: 8 }}>
          <Text style={s.hdrTitle}>PANEL DIRECTOR</Text>
          {project && <Text style={{ color: C.muted, fontSize: 9, textAlign: 'center' }}>{project.title} · Panel {panelNumber}</Text>}
        </View>
        <TouchableOpacity onPress={generate} style={[s.hdrBtn, { width: 64 }]}>
          <Text style={{ color: C.yellow, fontSize: 11, fontWeight: '800' }}>GEN ▶</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={[s.scroll, { paddingHorizontal: cinInsets.horizontal, paddingTop: cinInsets.top, paddingBottom: cinInsets.bottom + 40 }]}>
        {genError && (
          <View style={{ backgroundColor: '#2A0008', borderRadius: 8, padding: 10, marginBottom: 12, flexDirection: 'row', gap: 6 }}>
            <Feather name="alert-circle" size={13} color={C.red} />
            <Text style={{ color: C.red, fontSize: 11, flex: 1 }}>{genError}</Text>
          </View>
        )}

        {/* Director's Note */}
        <View style={s.directorBox}>
          <Text style={s.directorLabel}>🎬  DIRECTOR'S NOTE</Text>
          <TextInput value={directorNote} onChangeText={setDirectorNote} multiline
            placeholder={'e.g. Use a Dutch angle close-up to create tension.\nPlace Mara off-center for psychological imbalance.'}
            placeholderTextColor={C.muted}
            style={s.directorInput} />
        </View>

        {/* Character */}
        {characters.length > 0 && <>
          <FL text="FOCUS CHARACTER" />
          <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
            {characters.map(c => (
              <Chip key={c.name} label={c.name} active={activeChar?.name === c.name} color={C.blue}
                onPress={() => setActiveChar(c)} />
            ))}
          </View>
          {activeChar && (
            <View style={s.dnaPreview}>
              <Text style={s.dnaLine}>{activeChar.faceShape} face · {activeChar.eyeStyle} eyes · {activeChar.hairStyle} hair</Text>
              <Text style={s.dnaLine}>{activeChar.outfitTop} · {activeChar.outfitBottom}</Text>
              <Text style={s.dnaLine}>{activeChar.colorPalette} · ×{activeChar.bodyProportion.toFixed(1)} proportion</Text>
              {buildContinuityDesc() ? <Text style={[s.dnaLine, { color: C.blue }]}>State: {buildContinuityDesc()}</Text> : null}
            </View>
          )}
        </>}

        {/* Panel Number + Position */}
        <FL text="PANEL #" />
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 4 }}>
          <TouchableOpacity onPress={() => setPanelNumber(n => Math.max(1, n - 1))} style={s.numBtn}><Text style={s.numBtnTxt}>−</Text></TouchableOpacity>
          <Text style={{ color: C.yellow, fontSize: 24, fontWeight: '900', minWidth: 40, textAlign: 'center' }}>{panelNumber}</Text>
          <TouchableOpacity onPress={() => setPanelNumber(n => n + 1)} style={s.numBtn}><Text style={s.numBtnTxt}>+</Text></TouchableOpacity>
          <TextInput value={contRef} onChangeText={setContRef} placeholder="continuity ref (panel_001)" placeholderTextColor={C.muted}
            style={[s.input, { flex: 1 }]} />
        </View>

        <FL text="POSITION" />
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={{ flexDirection: 'row' }}>{POSITIONS.map(p => <Chip key={p} label={p} active={position === p} onPress={() => setPosition(p)} />)}</View>
        </ScrollView>

        {/* Shot Library */}
        <FL text="SHOT LIBRARY" />
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 4 }}>
          {SHOTS.map(shot => (
            <TouchableOpacity key={shot.name} onPress={() => pickShot(shot)} activeOpacity={0.8}
              style={[s.shotCard, shotType === shot.name && s.shotCardActive]}>
              <Text style={[s.shotName, shotType === shot.name && { color: C.yellow }]}>{shot.name}</Text>
              <Text style={s.shotFraming}>{shot.framing}</Text>
              <Text style={s.shotEmo}>{shot.emo}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Camera + Lens */}
        <FL text="CAMERA ANGLE" />
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={{ flexDirection: 'row' }}>{CAMERA_ANGLES.map(a => <Chip key={a} label={a} active={cameraAngle === a} onPress={() => setCameraAngle(a)} />)}</View>
        </ScrollView>
        <FL text="LENS" />
        <View style={{ flexDirection: 'row' }}>{LENSES.map(l => <Chip key={l} label={l} active={lens === l} color={C.blue} onPress={() => setLens(l)} />)}</View>

        {/* Action */}
        <FL text="ACTION" />
        <TextInput value={action} onChangeText={setAction} placeholder="e.g. Mara reaches for holster"
          placeholderTextColor={C.muted} style={s.input} />

        {/* Emotion */}
        <FL text="EMOTION" />
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={{ flexDirection: 'row' }}>{EMOTIONS.map(e => <Chip key={e} label={e} active={emotion === e} onPress={() => setEmotion(e)} />)}</View>
        </ScrollView>

        {/* Environment */}
        <FL text="ENVIRONMENT" />
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={{ flexDirection: 'row' }}>
            {[...BASE_ENVIRONMENTS, ...customEnvs].map(e => (
              <Chip key={e} label={e} active={environment === e} onPress={() => setEnvironment(e)} />
            ))}
            <Chip label="+ Custom" active={showCustomEnv} color={C.yellow} onPress={() => setShowCustomEnv(v => !v)} />
          </View>
        </ScrollView>
        {showCustomEnv && (
          <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 8, gap: 8 }}>
            <TextInput
              value={customEnvInput}
              onChangeText={setCustomEnvInput}
              placeholder="e.g. Underwater Temple, Moon Base, Ancient Library..."
              placeholderTextColor={C.muted}
              style={{ flex: 1, backgroundColor: C.card, borderWidth: 1, borderColor: C.border, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, color: C.ink, fontSize: 13 }}
            />
            <TouchableOpacity
              onPress={() => {
                const name = customEnvInput.trim();
                if (!name) return;
                const updated = customEnvs.includes(name) ? customEnvs : [...customEnvs, name];
                setCustomEnvs(updated);
                setEnvironment(name);
                setCustomEnvInput('');
                setShowCustomEnv(false);
                AsyncStorage.setItem('@bloomscript:custom_environments', JSON.stringify(updated)).catch(() => {});
              }}
              activeOpacity={0.8}
              style={{ backgroundColor: C.yellow, borderRadius: 8, paddingHorizontal: 14, paddingVertical: 10 }}>
              <Text style={{ color: C.bg, fontWeight: '800', fontSize: 12 }}>ADD</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Lighting */}
        <FL text="LIGHTING TYPE" />
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={{ flexDirection: 'row' }}>{LIGHTING_TYPES.map(l => <Chip key={l} label={l} active={lightingType === l} color={C.yellow} onPress={() => setLightingType(l)} />)}</View>
        </ScrollView>
        <FL text="LIGHTING DIRECTION" />
        <View style={{ flexDirection: 'row' }}>{LIGHTING_DIRS.map(d => <Chip key={d} label={d} active={lightingDir === d} color={C.yellow} onPress={() => setLightingDir(d)} />)}</View>

        {/* Effects */}
        <FL text="EFFECTS  (multi-select)" />
        <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>{EFFECTS.map(e => (
          <TouchableOpacity key={e} onPress={() => toggleEffect(e)} activeOpacity={0.75}
            style={[ch.chip, { flexDirection: 'row', alignItems: 'center' }, effects.includes(e) && { borderColor: C.blue, backgroundColor: C.blue + '33' }]}>
            {effects.includes(e) && <Feather name="check" size={9} color={C.blue} style={{ marginRight: 3 }} />}
            <Text style={[ch.txt, effects.includes(e) && { color: C.blue }]}>{e}</Text>
          </TouchableOpacity>
        ))}</View>

        {/* Bubble + Dialogue */}
        <FL text="SPEECH BUBBLE PLACEMENT" />
        <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>{BUBBLE_PLACES.map(b => <Chip key={b} label={b} active={bubblePlace === b} color={C.red} onPress={() => setBubblePlace(b)} />)}</View>
        <FL text="DIALOGUE" />
        <TextInput value={dialogue} onChangeText={setDialogue} placeholder='"What the character says…"'
          placeholderTextColor={C.muted} style={s.input} />

        {/* Continuity Constraints */}
        <FL text="CONTINUITY CONSTRAINTS" />
        <View style={s.contBox}>
          {CONTINUITY_RULES.map(rule => (
            <TouchableOpacity key={rule} onPress={() => toggleRule(rule)} activeOpacity={0.8}
              style={[s.contRule, contRules.includes(rule) && { borderColor: C.green, backgroundColor: '#0A2010' }]}>
              <Feather name={contRules.includes(rule) ? 'check-square' : 'square'} size={14}
                color={contRules.includes(rule) ? C.green : C.muted} style={{ marginRight: 8 }} />
              <Text style={[s.contRuleTxt, contRules.includes(rule) && { color: C.green }]}>{rule}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity style={s.genBtn} onPress={generate} activeOpacity={0.8}>
          <Feather name="film" size={16} color={C.bg} style={{ marginRight: 8 }} />
          <Text style={s.genBtnTxt}>GENERATE PANEL</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );

  // ── GENERATING phase ──────────────────────────────────────────────────────
  if (phase === 'generating') return (
    <View style={[s.root, s.center, { paddingTop: cinInsets.top }]}>
      <ActivityIndicator size="large" color={C.yellow} />
      <Text style={[s.hdrTitle, { marginTop: 20 }]}>RENDERING PANEL {panelNumber}</Text>
      <Text style={[s.subTxt, { marginTop: 8, textAlign: 'center', paddingHorizontal: 32 }]}>{promptPreview}</Text>
      {slowWarn && (
        <View style={s.slowBanner}>
          <Feather name="clock" size={12} color={C.yellow} />
          <Text style={s.slowTxt}>AI servers are busy — hang tight…</Text>
        </View>
      )}
    </View>
  );

  // ── RESULT phase ──────────────────────────────────────────────────────────
  return (
    <View style={[s.root, { paddingTop: cinInsets.top }]}>
      <View style={[s.hdr, { paddingHorizontal: cinInsets.horizontal }]}>
        <TouchableOpacity onPress={() => setPhase('input')} style={s.hdrBtn}><Feather name="arrow-left" size={20} color={C.ink} /></TouchableOpacity>
        <Text style={s.hdrTitle}>PANEL {panelNumber} COMPLETE</Text>
        <TouchableOpacity onPress={() => { setResultB64(null); setPhase('input'); setPanelNumber(n => n + 1); }} style={[s.hdrBtn, { width: 64 }]}>
          <Text style={{ color: C.yellow, fontSize: 10, fontWeight: '800' }}>NEXT ▶</Text>
        </TouchableOpacity>
      </View>
      <ScrollView contentContainerStyle={[s.scroll, { paddingHorizontal: cinInsets.horizontal, paddingBottom: cinInsets.bottom + 40 }]}>
        {resultB64 && (
          <Image source={{ uri: `data:image/png;base64,${resultB64}` }} style={s.resultImg} resizeMode="contain" />
        )}
        <View style={s.metaCard}>
          <Text style={s.metaTitle}>panel_{String(panelNumber).padStart(3,'0')}.json</Text>
          <Text style={s.metaJson}>{JSON.stringify({
            panelId: panelNumber, shotType, cameraAngle, lens,
            emotion, environment,
            lighting: { type: lightingType, direction: lightingDir },
            effects, continuityReference: contRef || null,
            character: activeChar?.name ?? null,
          }, null, 2)}</Text>
        </View>
        <TouchableOpacity style={s.genBtn} onPress={() => { setResultB64(null); setPhase('input'); setPanelNumber(n => n + 1); setContRef(`panel_${String(panelNumber).padStart(3,'0')}`); }} activeOpacity={0.8}>
          <Feather name="plus" size={15} color={C.bg} style={{ marginRight: 6 }} />
          <Text style={s.genBtnTxt}>NEXT PANEL</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  root:       { flex: 1, backgroundColor: C.bg },
  center:     { alignItems: 'center', justifyContent: 'center' },
  scroll:     { paddingBottom: 40 },
  hdr:        { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: C.border },
  hdrTitle:   { color: C.ink, fontSize: 14, fontWeight: '800', letterSpacing: 2 },
  hdrBtn:     { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  subTxt:     { color: C.muted, fontSize: 13, lineHeight: 20 },
  directorBox:{ backgroundColor: '#12100E', borderWidth: 1, borderColor: C.yellow + '44', borderRadius: 14, padding: 16, marginBottom: 8 },
  directorLabel:{ color: C.yellow, fontSize: 11, fontWeight: '800', letterSpacing: 1.5, marginBottom: 8 },
  directorInput:{ color: C.ink, fontSize: 14, lineHeight: 22, minHeight: 72 },
  dnaPreview: { backgroundColor: C.card2, borderWidth: 1, borderColor: C.border, borderRadius: 12, padding: 14, marginBottom: 8 },
  dnaLine:    { color: C.muted, fontSize: 12, lineHeight: 18 },
  input:      { backgroundColor: C.card, borderWidth: 1, borderColor: C.border, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, color: C.ink, fontSize: 14 },
  numBtn:     { width: 44, height: 44, backgroundColor: C.card, borderWidth: 1, borderColor: C.border, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  numBtnTxt:  { color: C.ink, fontSize: 20, fontWeight: '700' },
  shotCard:   { width: 148, marginRight: 10, backgroundColor: C.card, borderWidth: 1, borderColor: C.border, borderRadius: 14, padding: 14 },
  shotCardActive:{ borderColor: C.yellow, backgroundColor: '#2A2000' },
  shotName:   { color: C.ink, fontSize: 13, fontWeight: '700', marginBottom: 4 },
  shotFraming:{ color: C.muted, fontSize: 11, marginBottom: 3, lineHeight: 15 },
  shotEmo:    { color: C.yellow + '99', fontSize: 11 },
  contBox:    { backgroundColor: C.card, borderRadius: 14, borderWidth: 1, borderColor: C.border, overflow: 'hidden', marginBottom: 8 },
  contRule:   { flexDirection: 'row', alignItems: 'center', padding: 14, borderBottomWidth: 1, borderBottomColor: C.border },
  contRuleTxt:{ color: C.muted, fontSize: 13 },
  genBtn:     { backgroundColor: C.yellow, borderRadius: 14, paddingVertical: 18, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 16 },
  genBtnTxt:  { color: C.bg, fontSize: 15, fontWeight: '900', letterSpacing: 1 },
  slowBanner: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#2A2000', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 10, marginTop: 16 },
  slowTxt:    { color: C.yellow, fontSize: 12 },
  resultImg:  { width: '100%', aspectRatio: 1, borderRadius: 14, borderWidth: 1, borderColor: C.border, marginBottom: 14 },
  metaCard:   { backgroundColor: '#0D0A08', borderWidth: 1, borderColor: C.border, borderRadius: 14, padding: 16, marginBottom: 14 },
  metaTitle:  { color: C.yellow, fontSize: 11, fontWeight: '700', marginBottom: 8 },
  metaJson:   { color: '#7CFC00', fontSize: 11, fontFamily: 'monospace', lineHeight: 18 },
});
