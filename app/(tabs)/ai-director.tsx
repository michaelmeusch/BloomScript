import { Feather } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Animated,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  AIComicDirector,
  CameraDirector,
  CharacterProfile,
  ComicGenre,
  ComicProjectState,
  GENRE_EMOJIS,
  GENRE_LABELS,
  CAMERA_LABELS,
  MOOD_LABELS,
  PANEL_LABELS,
  RENDER_LABELS,
  createDefaultProject,
} from '@/lib/comicCore';

// ── Persistence ───────────────────────────────────────────────────────────────
const STORAGE_KEY = '@bloomscript:ai_director_v1';

async function loadProject(): Promise<ComicProjectState | null> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

async function saveProject(p: ComicProjectState): Promise<void> {
  try { await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(p)); } catch {}
}

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
};

// ── Tab definitions ───────────────────────────────────────────────────────────
type Tab = 'project' | 'style' | 'chars' | 'prompt' | 'memory';
const TABS: { id: Tab; emoji: string; label: string }[] = [
  { id: 'project', emoji: '🗂', label: 'Project' },
  { id: 'style',   emoji: '🎨', label: 'Style'   },
  { id: 'chars',   emoji: '🧬', label: 'Chars'   },
  { id: 'prompt',  emoji: '🧠', label: 'Prompt'  },
  { id: 'memory',  emoji: '📋', label: 'Memory'  },
];

// ── Meter bar ─────────────────────────────────────────────────────────────────
function MeterBar({ value, color }: { value: number; color: string }) {
  return (
    <View style={s.meterTrack}>
      <View style={[s.meterFill, { width: `${Math.round(value * 100)}%` as any, backgroundColor: color }]} />
    </View>
  );
}

// ── System status chip ────────────────────────────────────────────────────────
function StatusChip({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <View style={[s.statusChip, { borderColor: color }]}>
      <Text style={[s.statusLabel, { color }]}>{label}</Text>
      <Text style={[s.statusValue, { color }]}>{value}</Text>
    </View>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// MAIN SCREEN
// ════════════════════════════════════════════════════════════════════════════

export default function AIDirectorScreen() {
  const insets = useSafeAreaInsets();

  // ── Core state ────────────────────────────────────────────────────────────
  const [project, setProject]   = useState<ComicProjectState | null>(null);
  const [loading, setLoading]   = useState(true);
  const [tab, setTab]           = useState<Tab>('project');

  // Director instance (always in sync with project)
  const directorRef = useRef<AIComicDirector | null>(null);

  // ── Tab-specific state ────────────────────────────────────────────────────
  // Project setup
  const [newTitle, setNewTitle] = useState('');
  const [setupGenre, setSetupGenre] = useState<ComicGenre>(ComicGenre.SUPERHERO);

  // Style tab
  const [genrePickerOpen, setGenrePickerOpen] = useState(false);

  // Chars tab
  const [showAddChar, setShowAddChar] = useState(false);
  const [charName, setCharName]         = useState('');
  const [charSpecies, setCharSpecies]   = useState('');
  const [charBody, setCharBody]         = useState('');
  const [charCostume, setCharCostume]   = useState('');
  const [charColors, setCharColors]     = useState('');
  const [charPowers, setCharPowers]     = useState('');

  // Prompt tab
  const [sceneInput, setSceneInput] = useState('');
  const [builtPrompt, setBuiltPrompt] = useState('');
  const [copied, setCopied] = useState(false);

  // Memory tab
  const [noteInput, setNoteInput] = useState('');

  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  // ── Load on mount ──────────────────────────────────────────────────────────
  useEffect(() => {
    loadProject().then(p => {
      if (p) {
        directorRef.current = new AIComicDirector(p);
        setProject(p);
      }
      setLoading(false);
      Animated.parallel([
        Animated.timing(fadeAnim,  { toValue: 1, duration: 400, useNativeDriver: true }),
        Animated.timing(slideAnim, { toValue: 0, duration: 400, useNativeDriver: true }),
      ]).start();
    });
  }, []);

  // ── Persist whenever project changes ──────────────────────────────────────
  const updateProject = useCallback((updater: (p: ComicProjectState) => ComicProjectState) => {
    setProject(prev => {
      if (!prev) return prev;
      const next = updater({ ...prev });
      directorRef.current = new AIComicDirector(next);
      saveProject(next);
      return next;
    });
  }, []);

  // ── Create project ─────────────────────────────────────────────────────────
  function handleCreate() {
    if (!newTitle.trim()) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const p = createDefaultProject(newTitle.trim(), setupGenre);
    directorRef.current = new AIComicDirector(p);
    saveProject(p);
    setProject(p);
    setNewTitle('');
    setTab('style');
  }

  // ── Genre change ───────────────────────────────────────────────────────────
  function applyGenre(genre: ComicGenre) {
    if (!directorRef.current) return;
    Haptics.selectionAsync();
    directorRef.current.applyGenre(genre);
    updateProject(() => ({ ...directorRef.current!.project }));
    setGenrePickerOpen(false);
  }

  // ── Add character ──────────────────────────────────────────────────────────
  function handleAddChar() {
    if (!charName.trim() || !directorRef.current) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const char: CharacterProfile = {
      id:                 `char_${Date.now()}`,
      name:               charName.trim(),
      species:            charSpecies.trim() || 'Human',
      bodyType:           charBody.trim()    || 'Athletic',
      facialStructure:    '',
      hairstyle:          '',
      costumeDescription: charCostume.trim(),
      costumeColors:      charColors.split(',').map(c => c.trim()).filter(Boolean),
      powers:             charPowers.split(',').map(p => p.trim()).filter(Boolean),
      height:             6.0,
      muscularity:        0.6,
      realismScale:       0.7,
    };
    directorRef.current.addCharacter(char);
    updateProject(() => ({ ...directorRef.current!.project }));
    setCharName(''); setCharSpecies(''); setCharBody('');
    setCharCostume(''); setCharColors(''); setCharPowers('');
    setShowAddChar(false);
  }

  // ── Remove character ───────────────────────────────────────────────────────
  function removeChar(id: string) {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    directorRef.current?.removeCharacter(id);
    updateProject(() => ({ ...directorRef.current!.project }));
  }

  // ── Compose prompt ─────────────────────────────────────────────────────────
  function composePrompt() {
    if (!sceneInput.trim() || !directorRef.current) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const result = directorRef.current.buildScenePrompt(sceneInput.trim());
    setBuiltPrompt(result);
    updateProject(() => ({ ...directorRef.current!.project }));
  }

  async function copyPrompt() {
    if (!builtPrompt) return;
    await Clipboard.setStringAsync(builtPrompt);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  // ── Add memory note ────────────────────────────────────────────────────────
  function addNote() {
    if (!noteInput.trim() || !directorRef.current) return;
    Haptics.selectionAsync();
    directorRef.current.addMemoryNote(noteInput.trim());
    updateProject(() => ({ ...directorRef.current!.project }));
    setNoteInput('');
  }

  function removeNote(index: number) {
    directorRef.current?.removeMemoryNote(index);
    updateProject(() => ({ ...directorRef.current!.project }));
  }

  function resetProject() {
    AsyncStorage.removeItem(STORAGE_KEY);
    directorRef.current = null;
    setProject(null);
    setBuiltPrompt('');
    setTab('project');
  }

  // ── Loading ────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <View style={[s.root, { alignItems: 'center', justifyContent: 'center' }]}>
        <Text style={s.loadingText}>Initializing AI Director…</Text>
      </View>
    );
  }

  const p = project;
  const profile = p?.styleProfile;
  const camera  = p ? CameraDirector.chooseShot(p.styleProfile.genre, p.styleProfile.mood) : null;

  const genreColor = '#FFD600';

  return (
    <Animated.View style={[s.root, { paddingTop: insets.top, opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>

      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
          <Feather name="arrow-left" size={20} color={C.ink} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={s.headerTitle}>🎬 AI Director</Text>
          <Text style={s.headerSub}>Master Orchestration Engine</Text>
        </View>
        {p && (
          <View style={[s.liveChip, { borderColor: C.green }]}>
            <View style={[s.liveDot, { backgroundColor: C.green }]} />
            <Text style={[s.liveText, { color: C.green }]}>LIVE</Text>
          </View>
        )}
      </View>

      {/* ── System status strip (when project loaded) ────────────────────── */}
      {p && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.statusStrip} contentContainerStyle={s.statusStripInner}>
          <StatusChip label="GENRE"  value={`${GENRE_EMOJIS[p.genre]} ${GENRE_LABELS[p.genre]}`} color={C.yellow} />
          <StatusChip label="CHARS"  value={String(p.characterDatabase.length)} color={C.blue} />
          <StatusChip label="PAGES"  value={String(p.pages.length)} color={C.purple} />
          <StatusChip label="MEMORY" value={String(p.continuityMemory.length)} color={C.orange} />
          <StatusChip label="PROMPTS" value={String(p.promptHistory.length)} color={C.green} />
        </ScrollView>
      )}

      {/* ── Tab bar ─────────────────────────────────────────────────────────── */}
      {p && (
        <View style={s.tabBar}>
          {TABS.map(t => (
            <TouchableOpacity
              key={t.id}
              style={[s.tabBtn, tab === t.id && s.tabBtnActive]}
              onPress={() => { setTab(t.id); Haptics.selectionAsync(); }}
            >
              <Text style={s.tabEmoji}>{t.emoji}</Text>
              <Text style={[s.tabLabel, tab === t.id && { color: C.yellow }]}>{t.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* ── Content ─────────────────────────────────────────────────────────── */}
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

          {/* ════════════ NO PROJECT ════════════ */}
          {!p && (
            <View style={s.setupCard}>
              <Text style={s.setupTitle}>🎬 Initialize AI Director</Text>
              <Text style={s.setupSub}>Create a new ComicProjectState to activate the orchestration engine.</Text>

              <Text style={s.fieldLabel}>PROJECT TITLE</Text>
              <TextInput
                style={s.textInput}
                placeholder="e.g. Nyx: Neon Eclipse"
                placeholderTextColor={C.muted}
                value={newTitle}
                onChangeText={setNewTitle}
              />

              <Text style={s.fieldLabel}>GENRE</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 8 }}>
                <View style={s.hRow}>
                  {Object.values(ComicGenre).map(g => (
                    <TouchableOpacity
                      key={g}
                      style={[s.genreChip, setupGenre === g && s.genreChipActive]}
                      onPress={() => { setSetupGenre(g); Haptics.selectionAsync(); }}
                    >
                      <Text style={s.genreEmoji}>{GENRE_EMOJIS[g]}</Text>
                      <Text style={[s.genreLabel, setupGenre === g && { color: C.yellow }]}>{GENRE_LABELS[g]}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>

              <TouchableOpacity
                style={[s.primaryBtn, !newTitle.trim() && { opacity: 0.35 }]}
                onPress={handleCreate}
                disabled={!newTitle.trim()}
              >
                <Feather name="cpu" size={17} color={C.bg} />
                <Text style={s.primaryBtnText}>INITIALIZE DIRECTOR</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* ════════════ PROJECT TAB ════════════ */}
          {p && tab === 'project' && (
            <>
              <SectionLabel text="ACTIVE PROJECT" />
              <View style={s.projectCard}>
                <View style={s.projectRow}>
                  <Text style={s.projectTitle}>{p.title}</Text>
                  <View style={[s.genreBadge, { borderColor: C.yellow }]}>
                    <Text style={[s.genreBadgeText, { color: C.yellow }]}>{GENRE_EMOJIS[p.genre]} {GENRE_LABELS[p.genre]}</Text>
                  </View>
                </View>
                <Text style={s.projectId}>ID: {p.projectId}</Text>
              </View>

              <SectionLabel text="ORCHESTRATION SYSTEMS" />
              <View style={s.systemsGrid}>
                {([
                  { emoji: '🎨', name: 'Style Database',     desc: 'Genre → render profile',    status: 'ACTIVE',  color: C.yellow },
                  { emoji: '⚗️',  name: 'Genre Fusion',       desc: 'Blend two genre profiles',  status: 'READY',   color: C.purple },
                  { emoji: '🤖', name: 'Style Interpreter',  desc: 'Prompt → ComicStyleProfile', status: 'ACTIVE',  color: C.blue   },
                  { emoji: '🎬', name: 'Camera Director',     desc: 'Genre+Mood → camera shot',  status: 'ACTIVE',  color: C.orange },
                  { emoji: '🧬', name: 'Char Continuity',    desc: 'Character memory & DNA',    status: p.characterDatabase.length > 0 ? 'ACTIVE' : 'EMPTY', color: C.green },
                  { emoji: '🧠', name: 'Prompt Composer',    desc: 'Build structured AI prompt', status: p.promptHistory.length > 0 ? 'ACTIVE' : 'READY', color: C.purple },
                  { emoji: '🦴', name: 'Pose Engine',        desc: 'Genre → pose directives',   status: 'ACTIVE',  color: C.orange },
                  { emoji: '📐', name: 'Panel Flow Analyzer',desc: 'Page readability scoring',  status: p.pages.length > 0 ? 'ACTIVE' : 'READY', color: C.blue },
                  { emoji: '📤', name: 'Export Engine',      desc: 'PDF · PNG · Webtoon',       status: 'READY',   color: C.muted  },
                ] as const).map(sys => (
                  <View key={sys.name} style={s.systemCard}>
                    <Text style={s.sysEmoji}>{sys.emoji}</Text>
                    <View style={{ flex: 1 }}>
                      <Text style={s.sysName}>{sys.name}</Text>
                      <Text style={s.sysDesc}>{sys.desc}</Text>
                    </View>
                    <View style={[s.sysStatus, { borderColor: sys.color }]}>
                      <Text style={[s.sysStatusText, { color: sys.color }]}>{sys.status}</Text>
                    </View>
                  </View>
                ))}
              </View>

              <SectionLabel text="POSE ENGINE OUTPUT" />
              <View style={s.poseCard}>
                <Text style={s.poseEmoji}>🦴</Text>
                <Text style={s.poseText}>{p.characterDatabase[0]
                  ? directorRef.current?.suggestPose(p.characterDatabase[0].id)
                  : directorRef.current?.suggestPose()
                }</Text>
              </View>

              <SectionLabel text="EXPORT SUMMARY" />
              <View style={s.exportCard}>
                <Text style={s.exportText}>{directorRef.current?.getExportSummary()}</Text>
              </View>

              <TouchableOpacity style={s.dangerBtn} onPress={resetProject}>
                <Feather name="trash-2" size={14} color={C.red} />
                <Text style={[s.dangerBtnText, { color: C.red }]}>Reset Project</Text>
              </TouchableOpacity>
            </>
          )}

          {/* ════════════ STYLE TAB ════════════ */}
          {p && profile && tab === 'style' && (
            <>
              <SectionLabel text="ACTIVE STYLE PROFILE" />
              <View style={[s.styleHeaderCard, { borderColor: C.yellow }]}>
                <View style={s.styleRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={[s.stylePrimary, { color: C.yellow }]}>{RENDER_LABELS[profile.renderLanguage]}</Text>
                    <Text style={s.styleSecondary}>{MOOD_LABELS[profile.mood]} · {PANEL_LABELS[profile.panelStyle]}</Text>
                  </View>
                  <TouchableOpacity style={[s.changeBtn, { borderColor: C.yellow }]} onPress={() => setGenrePickerOpen(true)}>
                    <Feather name="refresh-cw" size={13} color={C.yellow} />
                    <Text style={[s.changeBtnText, { color: C.yellow }]}>Change Genre</Text>
                  </TouchableOpacity>
                </View>
              </View>

              <SectionLabel text="CAMERA DIRECTOR OUTPUT" />
              <View style={[s.cameraCard, { borderColor: C.orange }]}>
                <Text style={s.cameraEmoji}>🎬</Text>
                <View>
                  <Text style={[s.cameraLabel, { color: C.orange }]}>{camera ? CAMERA_LABELS[camera] : '—'}</Text>
                  <Text style={s.cameraSub}>Auto-selected for {GENRE_LABELS[p.genre]} / {MOOD_LABELS[profile.mood]}</Text>
                </View>
              </View>

              <SectionLabel text="RENDER PARAMETERS" />
              {([
                ['Ink Density',           profile.inkDensity,           C.ink],
                ['Motion Intensity',      profile.motionIntensity,      C.yellow],
                ['Realism Level',         profile.realismLevel,         C.blue],
                ['Anatomy Stylization',   profile.anatomyStylization,   C.purple],
                ['Texture Amount',        profile.textureAmount,        C.orange],
                ['Environmental Detail',  profile.environmentalDetail,  C.green],
                ['Color Complexity',      profile.colorComplexity,      C.red],
              ] as [string, number, string][]).map(([label, val, color]) => (
                <View key={label} style={s.meterRow}>
                  <Text style={s.meterLabel}>{label}</Text>
                  <MeterBar value={val} color={color} />
                  <Text style={[s.meterPct, { color }]}>{Math.round(val * 100)}%</Text>
                </View>
              ))}

              <SectionLabel text="RENDER FLAGS" />
              <View style={s.flagsRow}>
                {([
                  ['Cinematic Lighting',      profile.cinematicLighting,      C.orange],
                  ['Exaggerated Perspective', profile.exaggeratedPerspective,  C.blue],
                  ['Heavy Shadowing',         profile.heavyShadowing,          C.ink],
                  ['Halftone Dots',           profile.usesHalftones,           C.yellow],
                  ['Screen Tone',             profile.usesScreenTone,          C.purple],
                ] as [string, boolean, string][]).map(([label, active, color]) => (
                  <View key={label} style={[s.flagChip, { borderColor: active ? color : C.border, opacity: active ? 1 : 0.35 }]}>
                    <Text style={[s.flagChipText, { color: active ? color : C.muted }]}>
                      {active ? '✓' : '○'} {label}
                    </Text>
                  </View>
                ))}
              </View>
            </>
          )}

          {/* ════════════ CHARS TAB ════════════ */}
          {p && tab === 'chars' && (
            <>
              <View style={s.charHeaderRow}>
                <SectionLabelInline text={`CHARACTER DATABASE  (${p.characterDatabase.length})`} />
                <TouchableOpacity
                  style={[s.addCharBtn, showAddChar && { backgroundColor: C.card2 }]}
                  onPress={() => { setShowAddChar(!showAddChar); Haptics.selectionAsync(); }}
                >
                  <Feather name={showAddChar ? 'x' : 'plus'} size={14} color={C.yellow} />
                  <Text style={[s.addCharBtnText, { color: C.yellow }]}>{showAddChar ? 'Cancel' : 'Add'}</Text>
                </TouchableOpacity>
              </View>

              {showAddChar && (
                <View style={s.addCharForm}>
                  {([
                    ['Name *',       charName,    setCharName,    'e.g. Nyx'],
                    ['Species',      charSpecies, setCharSpecies, 'e.g. Cosmic Entity'],
                    ['Body Type',    charBody,    setCharBody,    'e.g. Athletic'],
                    ['Costume',      charCostume, setCharCostume, 'e.g. Dark neon techno-mystic armor'],
                    ['Colors (csv)', charColors,  setCharColors,  'e.g. black, purple, cyan'],
                    ['Powers (csv)', charPowers,  setCharPowers,  'e.g. void manipulation, energy projection'],
                  ] as [string, string, (v: string) => void, string][]).map(([label, val, setter, ph]) => (
                    <View key={label} style={{ marginBottom: 10 }}>
                      <Text style={s.fieldLabel}>{label}</Text>
                      <TextInput
                        style={s.textInput}
                        value={val}
                        onChangeText={setter}
                        placeholder={ph}
                        placeholderTextColor={C.muted}
                      />
                    </View>
                  ))}
                  <TouchableOpacity
                    style={[s.primaryBtn, !charName.trim() && { opacity: 0.35 }]}
                    onPress={handleAddChar}
                    disabled={!charName.trim()}
                  >
                    <Feather name="user-plus" size={15} color={C.bg} />
                    <Text style={s.primaryBtnText}>REGISTER CHARACTER</Text>
                  </TouchableOpacity>
                </View>
              )}

              {p.characterDatabase.length === 0 && !showAddChar && (
                <View style={s.emptyState}>
                  <Text style={s.emptyEmoji}>🧬</Text>
                  <Text style={s.emptyTitle}>No characters registered</Text>
                  <Text style={s.emptySub}>Add characters to enable continuity tracking and prompt enrichment.</Text>
                </View>
              )}

              {p.characterDatabase.map(char => (
                <View key={char.id} style={s.charCard}>
                  <View style={s.charHeaderRow2}>
                    <Text style={s.charName}>{char.name}</Text>
                    <TouchableOpacity onPress={() => removeChar(char.id)} style={s.charDeleteBtn}>
                      <Feather name="x" size={14} color={C.red} />
                    </TouchableOpacity>
                  </View>
                  <Text style={s.charMeta}>{char.species} · {char.bodyType}</Text>
                  {char.costumeDescription.length > 0 && (
                    <Text style={s.charDetail}>👗 {char.costumeDescription}</Text>
                  )}
                  {char.costumeColors.length > 0 && (
                    <View style={s.charColorsRow}>
                      {char.costumeColors.map(col => (
                        <View key={col} style={s.colorDot}>
                          <Text style={s.colorDotText}>{col}</Text>
                        </View>
                      ))}
                    </View>
                  )}
                  {char.powers.length > 0 && (
                    <Text style={s.charDetail}>⚡ {char.powers.join(', ')}</Text>
                  )}
                  {/* Continuity hints from the engine */}
                  <View style={s.hintBlock}>
                    <Text style={s.hintTitle}>CONTINUITY HINTS</Text>
                    {directorRef.current?.continuity.buildConsistencyHints(char.id).map((h, i) => (
                      <Text key={i} style={s.hintLine}>— {h}</Text>
                    ))}
                  </View>
                </View>
              ))}
            </>
          )}

          {/* ════════════ PROMPT TAB ════════════ */}
          {p && tab === 'prompt' && (
            <>
              <SectionLabel text="SCENE DESCRIPTION" />
              <TextInput
                style={[s.textInput, s.textInputMulti]}
                multiline
                numberOfLines={4}
                value={sceneInput}
                onChangeText={setSceneInput}
                placeholder="Describe the scene… e.g. Nyx enters a rain-soaked neon alley holding a cursed amulet while drones scan the skyline above."
                placeholderTextColor={C.muted}
                textAlignVertical="top"
              />

              {/* System routing preview */}
              {sceneInput.length > 0 && (
                <View style={s.routingCard}>
                  <Text style={s.routingTitle}>DIRECTOR PIPELINE</Text>
                  {([
                    ['Style Database', `${GENRE_LABELS[p.genre]} → ${RENDER_LABELS[profile!.renderLanguage]}`],
                    ['Camera Director', camera ? CAMERA_LABELS[camera] : '—'],
                    ['Char Continuity', `${p.characterDatabase.length} characters`],
                    ['Memory Context', `${p.continuityMemory.length} notes`],
                    ['Prompt Composer', 'Ready to compose'],
                  ] as [string, string][]).map(([sys, out]) => (
                    <View key={sys} style={s.routingRow}>
                      <Text style={s.routingSys}>{sys}</Text>
                      <Feather name="arrow-right" size={11} color={C.muted} />
                      <Text style={s.routingOut}>{out}</Text>
                    </View>
                  ))}
                </View>
              )}

              <TouchableOpacity
                style={[s.primaryBtn, { marginTop: 12 }, !sceneInput.trim() && { opacity: 0.35 }]}
                onPress={composePrompt}
                disabled={!sceneInput.trim()}
              >
                <Feather name="cpu" size={16} color={C.bg} />
                <Text style={s.primaryBtnText}>COMPOSE FULL PROMPT</Text>
              </TouchableOpacity>

              {builtPrompt.length > 0 && (
                <>
                  <View style={s.promptResultHeader}>
                    <Text style={s.sectionLabelText}>COMPOSED PROMPT</Text>
                    <TouchableOpacity onPress={copyPrompt} style={s.copyBtn}>
                      <Feather name={copied ? 'check' : 'copy'} size={14} color={copied ? C.green : C.yellow} />
                      <Text style={[s.copyBtnText, { color: copied ? C.green : C.yellow }]}>{copied ? 'Copied!' : 'Copy'}</Text>
                    </TouchableOpacity>
                  </View>
                  <View style={s.promptResult}>
                    <Text style={s.promptResultText}>{builtPrompt}</Text>
                  </View>
                </>
              )}

              {p.promptHistory.length > 0 && (
                <>
                  <SectionLabel text={`PROMPT HISTORY  (${p.promptHistory.length})`} />
                  {p.promptHistory.slice(0, 5).map((ph, i) => (
                    <View key={i} style={s.historyCard}>
                      <Text style={s.historyIndex}>#{i + 1}</Text>
                      <Text style={s.historyText} numberOfLines={3}>{ph.split('\n')[2]?.trim() ?? ph.slice(0, 80)}</Text>
                    </View>
                  ))}
                </>
              )}
            </>
          )}

          {/* ════════════ MEMORY TAB ════════════ */}
          {p && tab === 'memory' && (
            <>
              <SectionLabel text="ADD CONTINUITY NOTE" />
              <View style={s.noteInputRow}>
                <TextInput
                  style={[s.textInput, { flex: 1, marginBottom: 0 }]}
                  value={noteInput}
                  onChangeText={setNoteInput}
                  placeholder="e.g. Nyx always has her amulet visible"
                  placeholderTextColor={C.muted}
                />
                <TouchableOpacity
                  style={[s.noteAddBtn, !noteInput.trim() && { opacity: 0.4 }]}
                  onPress={addNote}
                  disabled={!noteInput.trim()}
                >
                  <Feather name="plus" size={18} color={C.bg} />
                </TouchableOpacity>
              </View>

              <SectionLabel text={`CONTINUITY MEMORY  (${p.continuityMemory.length})`} />
              {p.continuityMemory.length === 0 && (
                <View style={s.emptyState}>
                  <Text style={s.emptyEmoji}>📋</Text>
                  <Text style={s.emptyTitle}>No memory notes yet</Text>
                  <Text style={s.emptySub}>Notes added here are automatically injected into every composed prompt.</Text>
                </View>
              )}
              {p.continuityMemory.map((note, i) => (
                <View key={i} style={s.memoryCard}>
                  <Text style={s.memoryText}>{note}</Text>
                  <TouchableOpacity onPress={() => removeNote(i)} style={s.memDeleteBtn}>
                    <Feather name="x" size={13} color={C.red} />
                  </TouchableOpacity>
                </View>
              ))}

              {p.renderQueue.length > 0 && (
                <>
                  <View style={s.renderQueueHeader}>
                    <SectionLabelInline text={`RENDER QUEUE  (${p.renderQueue.length})`} />
                    <TouchableOpacity onPress={() => {
                      directorRef.current?.clearRenderQueue();
                      updateProject(() => ({ ...directorRef.current!.project }));
                    }}>
                      <Text style={[s.clearBtn, { color: C.red }]}>Clear</Text>
                    </TouchableOpacity>
                  </View>
                  {p.renderQueue.slice(0, 8).map((entry, i) => (
                    <View key={i} style={s.queueCard}>
                      <Text style={s.queueIndex}>{i + 1}</Text>
                      <Text style={s.queueText} numberOfLines={2}>{entry}</Text>
                    </View>
                  ))}
                </>
              )}
            </>
          )}

          <View style={{ height: 60 }} />
        </ScrollView>
      </KeyboardAvoidingView>

      {/* ── Genre Picker Modal ───────────────────────────────────────────────── */}
      <Modal visible={genrePickerOpen} animationType="slide" presentationStyle="pageSheet">
        <View style={[s.modal, { paddingTop: insets.top + 16 }]}>
          <View style={s.modalHeader}>
            <Text style={s.modalTitle}>Select Genre</Text>
            <TouchableOpacity onPress={() => setGenrePickerOpen(false)} style={s.modalClose}>
              <Feather name="x" size={20} color={C.ink} />
            </TouchableOpacity>
          </View>
          <ScrollView contentContainerStyle={s.modalScroll}>
            {Object.values(ComicGenre).map(g => (
              <TouchableOpacity
                key={g}
                style={[s.genreRow, p?.genre === g && { backgroundColor: C.yellow + '22', borderColor: C.yellow }]}
                onPress={() => applyGenre(g)}
              >
                <Text style={s.genreRowEmoji}>{GENRE_EMOJIS[g]}</Text>
                <Text style={[s.genreRowLabel, p?.genre === g && { color: C.yellow }]}>{GENRE_LABELS[g]}</Text>
                {p?.genre === g && <Feather name="check" size={16} color={C.yellow} />}
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </Modal>
    </Animated.View>
  );
}

// ── Small helpers ─────────────────────────────────────────────────────────────
function SectionLabel({ text }: { text: string }) {
  return <Text style={s.sectionLabelText}>{text}</Text>;
}
function SectionLabelInline({ text }: { text: string }) {
  return <Text style={[s.sectionLabelText, { marginTop: 0 }]}>{text}</Text>;
}

// ════════════════════════════════════════════════════════════════════════════
// STYLES
// ════════════════════════════════════════════════════════════════════════════

const s = StyleSheet.create({
  root:         { flex: 1, backgroundColor: C.bg },
  loadingText:  { color: C.muted, fontSize: 14 },

  // Header
  header:       { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 18, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: C.border },
  backBtn:      { width: 36, height: 36, borderRadius: 18, backgroundColor: C.card, alignItems: 'center', justifyContent: 'center' },
  headerTitle:  { fontSize: 18, fontWeight: '800', color: C.ink, letterSpacing: 0.5 },
  headerSub:    { fontSize: 11, color: C.muted, marginTop: 1 },
  liveChip:     { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 10, borderWidth: 1 },
  liveDot:      { width: 6, height: 6, borderRadius: 3 },
  liveText:     { fontSize: 10, fontWeight: '800', letterSpacing: 1 },

  // Status strip
  statusStrip:  { borderBottomWidth: 1, borderBottomColor: C.border },
  statusStripInner: { flexDirection: 'row', gap: 8, paddingHorizontal: 16, paddingVertical: 10 },
  statusChip:   { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, borderWidth: 1, backgroundColor: C.card, minWidth: 70 },
  statusLabel:  { fontSize: 8, fontWeight: '800', letterSpacing: 1.2, marginBottom: 2 },
  statusValue:  { fontSize: 12, fontWeight: '700' },

  // Tabs
  tabBar:       { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: C.border },
  tabBtn:       { flex: 1, alignItems: 'center', paddingVertical: 10, borderBottomWidth: 2, borderBottomColor: 'transparent' },
  tabBtnActive: { borderBottomColor: C.yellow },
  tabEmoji:     { fontSize: 14, marginBottom: 2 },
  tabLabel:     { fontSize: 9, fontWeight: '700', color: C.muted, letterSpacing: 0.5 },

  // Scroll
  scroll:       { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 32 },

  // Section labels
  sectionLabelText: { fontSize: 9, fontWeight: '800', color: C.muted, letterSpacing: 1.5, marginTop: 20, marginBottom: 10 },

  // Setup card
  setupCard:    { backgroundColor: C.card, borderRadius: 16, padding: 20, borderWidth: 1, borderColor: C.border },
  setupTitle:   { fontSize: 20, fontWeight: '900', color: C.ink, marginBottom: 8 },
  setupSub:     { fontSize: 13, color: C.muted, marginBottom: 20, lineHeight: 19 },
  hRow:         { flexDirection: 'row', gap: 8, paddingRight: 16, paddingBottom: 4 },
  genreChip:    { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, backgroundColor: C.card2, borderWidth: 1, borderColor: C.border, alignItems: 'center', minWidth: 76 },
  genreChipActive: { backgroundColor: C.yellow + '22', borderColor: C.yellow },
  genreEmoji:   { fontSize: 16, marginBottom: 2 },
  genreLabel:   { fontSize: 10, fontWeight: '700', color: C.muted, textAlign: 'center' },

  // Project tab
  projectCard:  { backgroundColor: C.card, borderRadius: 14, padding: 16, borderWidth: 1, borderColor: C.border, marginBottom: 4 },
  projectRow:   { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 },
  projectTitle: { fontSize: 16, fontWeight: '800', color: C.ink, flex: 1 },
  projectId:    { fontSize: 10, color: C.muted },
  genreBadge:   { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10, borderWidth: 1 },
  genreBadgeText: { fontSize: 11, fontWeight: '700' },

  systemsGrid:  { gap: 8, marginBottom: 4 },
  systemCard:   { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: C.card, borderRadius: 12, padding: 12, borderWidth: 1, borderColor: C.border },
  sysEmoji:     { fontSize: 20 },
  sysName:      { fontSize: 13, fontWeight: '700', color: C.ink },
  sysDesc:      { fontSize: 11, color: C.muted, marginTop: 1 },
  sysStatus:    { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, borderWidth: 1 },
  sysStatusText:{ fontSize: 9, fontWeight: '800', letterSpacing: 0.8 },

  poseCard:     { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: C.card, borderRadius: 12, padding: 14, borderWidth: 1, borderColor: C.border, marginBottom: 4 },
  poseEmoji:    { fontSize: 24 },
  poseText:     { flex: 1, fontSize: 13, color: C.ink, lineHeight: 18 },

  exportCard:   { backgroundColor: C.card, borderRadius: 12, padding: 14, borderWidth: 1, borderColor: C.border },
  exportText:   { fontSize: 12, color: C.muted, lineHeight: 20, fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace' },

  dangerBtn:    { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 20, paddingVertical: 10, justifyContent: 'center' },
  dangerBtnText:{ fontSize: 13, fontWeight: '700' },

  // Style tab
  styleHeaderCard: { borderRadius: 14, borderWidth: 1.5, backgroundColor: C.card, padding: 14, marginBottom: 4 },
  styleRow:     { flexDirection: 'row', alignItems: 'center', gap: 10 },
  stylePrimary: { fontSize: 16, fontWeight: '800' },
  styleSecondary:{ fontSize: 12, color: C.muted, marginTop: 3 },
  changeBtn:    { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, borderWidth: 1 },
  changeBtnText:{ fontSize: 11, fontWeight: '700' },
  cameraCard:   { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: C.card, borderRadius: 12, padding: 14, borderWidth: 1, marginBottom: 4 },
  cameraEmoji:  { fontSize: 22 },
  cameraLabel:  { fontSize: 14, fontWeight: '800' },
  cameraSub:    { fontSize: 11, color: C.muted, marginTop: 2 },
  meterRow:     { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  meterLabel:   { fontSize: 10, color: C.muted, width: 130 },
  meterTrack:   { flex: 1, height: 6, backgroundColor: C.border, borderRadius: 3, overflow: 'hidden' },
  meterFill:    { height: '100%', borderRadius: 3 },
  meterPct:     { fontSize: 10, fontWeight: '700', width: 30, textAlign: 'right' },
  flagsRow:     { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  flagChip:     { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 12, borderWidth: 1, backgroundColor: C.card },
  flagChipText: { fontSize: 11, fontWeight: '700' },

  // Chars tab
  charHeaderRow:{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 20, marginBottom: 10 },
  addCharBtn:   { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10, borderWidth: 1, borderColor: C.yellow },
  addCharBtnText:{ fontSize: 12, fontWeight: '700' },
  addCharForm:  { backgroundColor: C.card, borderRadius: 14, padding: 16, borderWidth: 1, borderColor: C.border, marginBottom: 12 },
  charCard:     { backgroundColor: C.card, borderRadius: 12, padding: 14, borderWidth: 1, borderColor: C.border, marginBottom: 10 },
  charHeaderRow2:{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 },
  charName:     { fontSize: 15, fontWeight: '800', color: C.yellow },
  charDeleteBtn:{ padding: 4 },
  charMeta:     { fontSize: 12, color: C.muted, marginBottom: 6 },
  charDetail:   { fontSize: 12, color: C.ink, marginTop: 4 },
  charColorsRow:{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 6 },
  colorDot:     { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, backgroundColor: C.card2, borderWidth: 1, borderColor: C.border },
  colorDotText: { fontSize: 10, color: C.muted },
  hintBlock:    { marginTop: 10, backgroundColor: C.card2, borderRadius: 8, padding: 10 },
  hintTitle:    { fontSize: 8, fontWeight: '800', color: C.muted, letterSpacing: 1.2, marginBottom: 6 },
  hintLine:     { fontSize: 11, color: C.muted, marginBottom: 3 },

  // Prompt tab
  routingCard:  { backgroundColor: C.card, borderRadius: 12, padding: 12, borderWidth: 1, borderColor: C.border, marginTop: 10 },
  routingTitle: { fontSize: 8, fontWeight: '800', color: C.muted, letterSpacing: 1.2, marginBottom: 8 },
  routingRow:   { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 5 },
  routingSys:   { fontSize: 11, color: C.muted, width: 110 },
  routingOut:   { fontSize: 11, color: C.ink, flex: 1 },
  promptResultHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 16, marginBottom: 8 },
  copyBtn:      { flexDirection: 'row', alignItems: 'center', gap: 5 },
  copyBtnText:  { fontSize: 12, fontWeight: '700' },
  promptResult: { backgroundColor: C.card, borderRadius: 12, padding: 14, borderWidth: 1, borderColor: C.border },
  promptResultText: { fontSize: 11, color: C.ink, lineHeight: 17, fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace' },
  historyCard:  { flexDirection: 'row', alignItems: 'flex-start', gap: 8, backgroundColor: C.card, borderRadius: 10, padding: 10, borderWidth: 1, borderColor: C.border, marginBottom: 6 },
  historyIndex: { fontSize: 10, color: C.muted, fontWeight: '700', marginTop: 1 },
  historyText:  { flex: 1, fontSize: 11, color: C.muted },

  // Memory tab
  noteInputRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 4 },
  noteAddBtn:   { width: 42, height: 42, borderRadius: 21, backgroundColor: C.yellow, alignItems: 'center', justifyContent: 'center' },
  memoryCard:   { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: C.card, borderRadius: 10, padding: 12, borderWidth: 1, borderColor: C.border, marginBottom: 8 },
  memoryText:   { flex: 1, fontSize: 13, color: C.ink },
  memDeleteBtn: { padding: 4 },
  renderQueueHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 20, marginBottom: 10 },
  clearBtn:     { fontSize: 12, fontWeight: '700' },
  queueCard:    { flexDirection: 'row', alignItems: 'flex-start', gap: 10, backgroundColor: C.card, borderRadius: 10, padding: 10, borderWidth: 1, borderColor: C.border, marginBottom: 6 },
  queueIndex:   { fontSize: 11, color: C.muted, fontWeight: '700', width: 20 },
  queueText:    { flex: 1, fontSize: 11, color: C.muted },

  // Shared
  fieldLabel:   { fontSize: 9, fontWeight: '800', color: C.muted, letterSpacing: 1.2, marginBottom: 6 },
  textInput:    { backgroundColor: C.card2, borderRadius: 10, borderWidth: 1, borderColor: C.border, padding: 12, fontSize: 14, color: C.ink, marginBottom: 12 },
  textInputMulti:{ height: 100 },
  primaryBtn:   { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14, borderRadius: 12, backgroundColor: C.yellow },
  primaryBtnText:{ fontSize: 13, fontWeight: '900', color: C.bg, letterSpacing: 1.2 },
  emptyState:   { alignItems: 'center', paddingVertical: 40 },
  emptyEmoji:   { fontSize: 40, marginBottom: 12 },
  emptyTitle:   { fontSize: 15, fontWeight: '700', color: C.ink, marginBottom: 6 },
  emptySub:     { fontSize: 13, color: C.muted, textAlign: 'center', lineHeight: 18, paddingHorizontal: 20 },

  // Modal
  modal:        { flex: 1, backgroundColor: C.bg },
  modalHeader:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: C.border },
  modalTitle:   { fontSize: 17, fontWeight: '800', color: C.ink },
  modalClose:   { width: 36, height: 36, borderRadius: 18, backgroundColor: C.card, alignItems: 'center', justifyContent: 'center' },
  modalScroll:  { padding: 16 },
  genreRow:     { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: 12, borderWidth: 1, borderColor: C.border, backgroundColor: C.card, marginBottom: 8 },
  genreRowEmoji:{ fontSize: 22 },
  genreRowLabel:{ flex: 1, fontSize: 14, fontWeight: '700', color: C.ink },
});
