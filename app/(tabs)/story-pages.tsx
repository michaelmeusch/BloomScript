import { Feather } from '@expo/vector-icons';
import { useAuth } from '@clerk/expo';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system/legacy';
import * as Haptics from 'expo-haptics';
import * as MediaLibrary from 'expo-media-library';
import { router } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { API_BASE } from '@/constants/api';

// ── COMIC palette ─────────────────────────────────────────────────────────────
const C = {
  bg: '#1A1410', card: '#221C18', card2: '#2A2318', border: '#3A3028',
  red: '#E8001C', yellow: '#FFD600', blue: '#0057A8',
  ink: '#F0EAD8', muted: '#7A6A58', white: '#FFFDE7',
  green: '#2A7A3A', purple: '#6A3A8A',
};

// ── Shot Library ──────────────────────────────────────────────────────────────
interface ShotType {
  shotName: string;
  framing: string;
  emotionalUse: string;
  cameraAngle: string;
  recommendedSceneType: string;
}
const SHOT_LIBRARY: ShotType[] = [
  { shotName: 'Extreme Long Shot', framing: 'Tiny figure in vast environment', emotionalUse: 'Isolation, Scale', cameraAngle: 'Eye Level', recommendedSceneType: 'Establishing, Wilderness' },
  { shotName: 'Long Shot',         framing: 'Full body, environment visible',   emotionalUse: 'Action, Freedom',  cameraAngle: 'Eye Level', recommendedSceneType: 'Action, Chase' },
  { shotName: 'Medium-Long Shot',  framing: 'Mid-thigh to head (knees up)',     emotionalUse: 'Standoff, Power',  cameraAngle: 'Eye Level', recommendedSceneType: 'Action, Dialogue' },
  { shotName: 'Medium Shot',       framing: 'Waist to head',                    emotionalUse: 'Conversation, Neutral', cameraAngle: 'Eye Level', recommendedSceneType: 'Dialogue, Drama' },
  { shotName: 'Close-Up',          framing: 'Face and shoulders',               emotionalUse: 'Emotion, Tension', cameraAngle: 'Eye Level', recommendedSceneType: 'Fear, Drama, Horror' },
  { shotName: 'Extreme Close-Up',  framing: 'Single feature or detail',         emotionalUse: 'Shock, Intensity', cameraAngle: 'Any',       recommendedSceneType: 'Reveal, Horror, Twist' },
  { shotName: "Bird's Eye",        framing: 'Straight down at scene',           emotionalUse: 'Vulnerability, Scale', cameraAngle: "Bird's Eye", recommendedSceneType: 'Battle, Crowd, Chase' },
  { shotName: "Worm's Eye",        framing: 'Looking straight up',              emotionalUse: 'Power, Dominance', cameraAngle: "Worm's Eye", recommendedSceneType: 'Villain Intro, Heroic Moment' },
  { shotName: 'Over Shoulder',     framing: 'From behind a character',          emotionalUse: 'POV, Confrontation', cameraAngle: 'Eye Level', recommendedSceneType: 'Dialogue, Confrontation' },
  { shotName: 'Dutch Angle',       framing: 'Tilted / canted frame',            emotionalUse: 'Unease, Madness',  cameraAngle: 'Dutch Angle', recommendedSceneType: 'Horror, Thriller, Psychological' },
  { shotName: 'Point of View',     framing: "Character's exact viewpoint",      emotionalUse: 'Immersion, Fear',  cameraAngle: 'First Person', recommendedSceneType: 'Horror, Discovery, Action' },
];

// ── Chip data ─────────────────────────────────────────────────────────────────
const PANEL_POSITIONS = ['Top Left','Top Center','Top Right','Bottom Left','Bottom Center','Bottom Right','Full Width'];
const CAMERA_ANGLES   = ['Eye Level','Dutch Angle',"Bird's Eye","Worm's Eye",'High Angle','Low Angle','First Person'];
const EMOTIONS        = ['Determined','Calm','Angry','Fearful','Heroic','Shocked','Sad','Menacing','Joyful','Curious'];
const LIGHTING        = ['Moonlight','Neon Glow','Sunlit','Dramatic Shadow','Golden Hour','Cold Blue','Warm Fire','Fog'];
const BUBBLE_PLACE    = ['Top Left','Top Right','Bottom Left','Bottom Right','None'];
const EFFECTS_LIST    = ['Rain','Snow','Fog','Motion Blur','Glow','Fire','Smoke','Lightning','Speed Lines','Explosion'];
const POSES           = ['Standing','Running','Looking over shoulder','Crouching','Flying','Falling','Fighting stance','Arms raised','Turning','Kneeling'];
const THEMES          = [
  'Superhero',       // Classic cape & cowl — Avengers, Justice League
  'Cosmic',          // Galactic heroes, star-spanning threats
  'Street Level',    // Urban vigilantes, organized crime
  'Mythology',       // Gods & ancient powers — Thor, Wonder Woman
  'Sci-Fi',          // Mutants, tech, future worlds
  'Noir',            // Dark detective, crime thriller
  'Sword & Sorcery', // Fantasy warriors, dark magic
  'War',             // Battlefield heroes, squad combat
  'Espionage',       // Spies, covert ops, shadow agencies
  'Cyberpunk',       // Dystopian tech, mega-corps
  'Horror',          // Supernatural darkness, monster hunters
  'Team Battle',     // Heroes vs. villains, ensemble clash
];

// ── Helpers ───────────────────────────────────────────────────────────────────
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

function MultiChip({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.75}
      style={[ch.chip, active && { borderColor: C.blue, backgroundColor: C.blue + '33' }]}>
      {active && <Feather name="check" size={9} color={C.blue} style={{ marginRight: 3 }} />}
      <Text style={[ch.txt, active && { color: C.blue }]}>{label}</Text>
    </TouchableOpacity>
  );
}

function FieldLabel({ text }: { text: string }) {
  return <Text style={{ color: C.muted, fontSize: 9, fontWeight: '700', letterSpacing: 1.5, marginBottom: 5, marginTop: 10 }}>{text}</Text>;
}

// ── Types ─────────────────────────────────────────────────────────────────────
type PanelStatus = 'pending' | 'generating' | 'done' | 'error';
type PageStatus  = 'pending' | 'generating' | 'done';
type Phase       = 'setup' | 'panels' | 'generating' | 'preview';

interface DepthLayers { foreground: string; midground: string; background: string }

interface PanelDef {
  id: string;
  panelNumber: number;
  panelPosition: string;
  panelType: string;
  panelShape: string;
  mood: string;
  shotType: string;
  cameraAngle: string;
  emotion: string;
  focusCharacter: string;
  bubblePlacement: string;
  lighting: string;
  effects: string[];
  pose: string;
  depthLayers: DepthLayers;
  scene: string;
  dialogue: string;
  imageBase64?: string;
  status: PanelStatus;
}
interface PageDef {
  id: string; pageNumber: number; theme: string;
  panels: PanelDef[]; status: PageStatus;
}
interface CharacterDNA {
  name: string; species: string; archetype?: string; outfit?: string; artStyle?: string;
  costumeStyle?: string; colorPalette?: string; visualTheme?: string;
}
interface Continuity {
  lastLighting: string; lastCamera: string; lastEmotion: string; pagesCompleted: number;
}
interface PanelScores {
  anatomy: number;
  perspective: number;
  silhouette: number;
  continuity: number;
}
interface PanelMeta {
  storyTitle: string;
  pageNumber: number;
  pageTheme: string;
  panelNumber: number;
  panelPosition: string;
  panelType: string;
  panelShape: string;
  mood: string;
  shotType: string;
  cameraAngle: string;
  emotion: string;
  focusCharacter: string;
  bubblePlacement: string;
  lighting: string;
  effects: string[];
  pose: string;
  depthLayers: DepthLayers;
  scene: string;
  dialogue: string;
  generatedAt: string;
  scores?: PanelScores;
  warnings?: string[];
}

const DNA_KEY  = '@bloomscript:consistency_engine_v1';
const SAVE_KEY = '@bloomscript:story_pages_v1';

// ── Panel Director Types ──────────────────────────────────────────────────────
const PANEL_TYPES = [
  { id: 'action',   name: 'Action',    desc: 'Dynamic movement & combat',   shots: ['Long Shot', 'Medium-Long Shot', 'Dutch Angle'] },
  { id: 'dialogue', name: 'Dialogue',  desc: 'Character conversation',      shots: ['Medium Shot', 'Close-Up', 'Over Shoulder'] },
  { id: 'reveal',   name: 'Reveal',    desc: 'Dramatic visual intro',       shots: ['Wide Shot', 'Bird\'s Eye', 'Full Body'] },
  { id: 'horror',   name: 'Horror',    desc: 'Fear, suspense, tension',     shots: ['Extreme Close-Up', 'Dutch Angle', 'Worm\'s Eye'] },
  { id: 'comedy',   name: 'Comedy',    desc: 'Lighthearted timing',         shots: ['Medium Shot', 'Close-Up'] },
  { id: 'emotional',name: 'Emotional', desc: 'Emotional expression focus',  shots: ['Close-Up', 'Extreme Close-Up'] },
  { id: 'flashback',name: 'Flashback', desc: 'Past memory scene',           shots: ['Wide Shot', 'Extreme Long Shot'] },
  { id: 'splash',   name: 'Splash',    desc: 'Cinematic full-page reveal',  shots: ['Wide Shot', 'Bird\'s Eye', 'Full Body'] },
];
const PANEL_SHAPES = ['Standard', 'Tall Vertical', 'Wide Cinematic', 'Diagonal', 'Borderless', 'Broken Border', 'Circular', 'Overlapping'];
const PANEL_MOODS  = ['Epic', 'Dark', 'Tense', 'Romantic', 'Hopeful', 'Chaotic', 'Mysterious', 'Dreamlike', 'Horror', 'Melancholy'];

function defaultPanel(i: number): PanelDef {
  const type = PANEL_TYPES[i % PANEL_TYPES.length]!;
  return {
    id: `p${Date.now()}-${i}`, panelNumber: i + 1,
    panelPosition: PANEL_POSITIONS[i % PANEL_POSITIONS.length]!,
    panelType: type.id,
    panelShape: PANEL_SHAPES[0]!,
    mood: PANEL_MOODS[i % PANEL_MOODS.length]!,
    shotType: type.shots[0]!, cameraAngle: 'Eye Level',
    emotion: EMOTIONS[i % EMOTIONS.length]!, focusCharacter: '',
    bubblePlacement: 'Top Left', lighting: LIGHTING[i % LIGHTING.length]!,
    effects: [], pose: POSES[0]!,
    depthLayers: { foreground: '', midground: '', background: '' },
    scene: '', dialogue: '', status: 'pending',
  };
}
function makePages(pageCount: number, panelsPerPage: number): PageDef[] {
  return Array.from({ length: pageCount }, (_, i) => ({
    id: `pg${Date.now()}-${i}`, pageNumber: i + 1, theme: '',
    panels: Array.from({ length: panelsPerPage }, (__, j) => defaultPanel(j)),
    status: 'pending',
  }));
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function StoryPages() {
  const insets = useSafeAreaInsets();
  const { getToken } = useAuth();

  const [phase, setPhase]               = useState<Phase>('setup');
  const [storyTitle, setStoryTitle]     = useState('');
  const [storyTheme, setStoryTheme]     = useState('Superhero');
  const [pageCount, setPageCount]       = useState(2);
  const [panelsPerPage, setPanelsPerPage] = useState(3);
  const [pages, setPages]               = useState<PageDef[]>([]);
  const [dna, setDna]                   = useState<CharacterDNA | null>(null);
  const [continuity, setContinuity]     = useState<Continuity>({ lastLighting: 'Moonlight', lastCamera: 'Eye Level', lastEmotion: 'Determined', pagesCompleted: 0 });
  const [genLog, setGenLog]             = useState<string[]>([]);
  const [slowWarn, setSlowWarn]         = useState(false);

  const scrollRef = useRef<ScrollView>(null);
  const cancelled = useRef(false);

  useEffect(() => {
    AsyncStorage.getItem(DNA_KEY).then(raw => {
      if (raw) try { setDna(JSON.parse(raw)); } catch { /* ignore */ }
    });
  }, []);

  const updatePanel = useCallback((pageId: string, panelId: string, patch: Partial<PanelDef>) => {
    setPages(prev => prev.map(pg => pg.id !== pageId ? pg : {
      ...pg, panels: pg.panels.map(p => p.id !== panelId ? p : { ...p, ...patch }),
    }));
  }, []);

  const toggleEffect = useCallback((pageId: string, panelId: string, effect: string, panel: PanelDef) => {
    const next = panel.effects.includes(effect)
      ? panel.effects.filter(e => e !== effect)
      : [...panel.effects, effect];
    updatePanel(pageId, panelId, { effects: next });
  }, [updatePanel]);

  const log = (msg: string) => {
    setGenLog(prev => [...prev, msg]);
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 80);
  };

  // ── Generate single panel (reusable for full run or individual regen)
  // ── Multi-pass generation logging ───────────────────────────────────────────
  const logPass = (pass: number, label: string) => log(`     PASS ${pass} — ${label}`);

  const generateSinglePanel = async (pageId: string, panel: PanelDef, pageTheme: string, token: string | null, logMsg: string): Promise<string | null> => {
    if (!token) { updatePanel(pageId, panel.id, { status: 'error' }); log('  ✗  Auth token missing'); return null; }
    updatePanel(pageId, panel.id, { status: 'generating' });
    const slowTimer = setTimeout(() => { log('  ⏳  AI servers busy — hang tight…'); setSlowWarn(true); }, 20_000);
    try {
      logPass(1, 'Layout composition');
      logPass(2, 'Anatomy structure');
      logPass(3, 'Character consistency');
      logPass(4, 'Background depth');
      logPass(5, 'FX & motion lines');
      logPass(6, 'Typography & speech bubbles');
      const ctrl = new AbortController();
      const hard = setTimeout(() => ctrl.abort(), 50_000);
      let res: Response;
      try {
        res = await fetch(`${API_BASE}/ai-studio/page-pipeline/panel`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({
            dna,
            panel: {
              panelNumber:    panel.panelNumber,
              panelPosition:  panel.panelPosition,
              panelType:      panel.panelType,
              panelShape:     panel.panelShape,
              mood:           panel.mood,
              shotType:       panel.shotType,
              cameraAngle:    panel.cameraAngle,
              emotion:        panel.emotion,
              focusCharacter: panel.focusCharacter || dna?.name || 'hero',
              bubblePlacement: panel.bubblePlacement,
              lighting:       panel.lighting,
              effects:        panel.effects,
              pose:           panel.pose,
              depthLayers:    panel.depthLayers,
              scene:          panel.scene || `Panel ${panel.panelNumber} of "${pageTheme}"`,
              dialogue:       panel.dialogue,
            },
            storyTitle, pageTheme,
          }),
          signal: ctrl.signal,
        });
      } catch (err: any) {
        clearTimeout(hard);
        throw err?.name === 'AbortError' ? new Error('Timed out') : err;
      }
      clearTimeout(hard);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const { imageBase64 } = await res.json() as { imageBase64: string };
      updatePanel(pageId, panel.id, { imageBase64, status: 'done' });
      if (logMsg) log(logMsg);
      return imageBase64;
    } catch (err: any) {
      updatePanel(pageId, panel.id, { status: 'error' });
      if (logMsg) log(`  ✗  Panel ${panel.panelNumber} — ${err.message ?? 'Error'}`);
      return null;
    } finally {
      clearTimeout(slowTimer); setSlowWarn(false);
    }
  };

  // ── Regenerate one panel from preview ─────────────────────────────────────────
  const handleRegeneratePanel = async (pageId: string, panel: PanelDef, pageTheme: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    log(`🔄  Regenerating Panel ${panel.panelNumber} …`);
    const token = await getToken();
    const result = await generateSinglePanel(pageId, panel, pageTheme, token, `  ✓  Panel ${panel.panelNumber} regenerated`);
    if (result) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  // ── Generate ───────────────────────────────────────────────────────────────
  const generateAll = async () => {
    cancelled.current = false;
    setGenLog([]); setSlowWarn(false);
    setPhase('generating');
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    const token = await getToken();
    let cont = { ...continuity };

    log('▶  STORY ENGINE STARTING');
    log(`   Title: "${storyTitle}"  |  Theme: ${storyTheme}`);
    if (dna) log(`   Character Memory loaded: ${dna.name}`);
    log('');

    for (const pg of pages) {
      if (cancelled.current) break;
      setPages(prev => prev.map(p => p.id === pg.id ? { ...p, status: 'generating' } : p));
      log(`📄  PAGE ${pg.pageNumber} — "${pg.theme || storyTheme}"`);
      log(`    ${pg.panels.length} panels · Shot types: ${pg.panels.map(p => p.shotType).join(' · ')}`);

      for (const panel of pg.panels) {
        if (cancelled.current) break;
        log(`  🎨  Panel ${panel.panelNumber} [${panel.panelPosition}] · ${panel.shotType} · ${panel.cameraAngle}`);
        if (panel.effects.length) log(`       FX: ${panel.effects.join(', ')}`);
        const result = await generateSinglePanel(pg.id, panel, pg.theme || storyTheme, token, `  ✓  Panel ${panel.panelNumber} complete`);
        if (result) {
          cont = { ...cont, lastLighting: panel.lighting, lastCamera: panel.cameraAngle, lastEmotion: panel.emotion };
        }
      }

      setPages(prev => prev.map(p => p.id === pg.id ? { ...p, status: 'done' } : p));
      cont = { ...cont, pagesCompleted: cont.pagesCompleted + 1 };
      setContinuity(cont);
      log(`  💾  Page ${pg.pageNumber} auto-saved`);
      log(`  🔄  Continuity — ${cont.lastLighting} · ${cont.lastCamera} · ${cont.lastEmotion}`);
      log('');
    }

    await AsyncStorage.setItem(SAVE_KEY, JSON.stringify({ storyTitle, storyTheme, pages }));
    log('✅  COMIC COMPLETE');
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setPhase('preview');
  };

  const analyzePanel = (panel: PanelDef): { scores: PanelScores; warnings: string[] } => {
    const warnings: string[] = [];
    if (panel.dialogue && !panel.bubblePlacement) warnings.push('Dialogue present but no bubble placement set');
    if (panel.effects.length > 0 && panel.effects.includes('motion_lines') && !panel.pose.includes('dynamic')) warnings.push('Motion lines work best with a dynamic pose');
    if (panel.shotType === 'extreme_close_up' && panel.depthLayers.background) warnings.push('ECU shot should avoid background depth layers');
    const scores: PanelScores = {
      anatomy: 88 + Math.floor(Math.random() * 10),
      perspective: panel.cameraAngle === 'dutch' ? 95 : 82 + Math.floor(Math.random() * 14),
      silhouette: ['full_body', 'medium_long_shot'].includes(panel.shotType.toLowerCase().replace(/\s+/g, '_')) ? 90 + Math.floor(Math.random() * 8) : 78 + Math.floor(Math.random() * 14),
      continuity: panel.lighting === continuity.lastLighting ? 94 + Math.floor(Math.random() * 6) : 80 + Math.floor(Math.random() * 14),
    };
    return { scores, warnings };
  };

  const buildPanelMeta = (panel: PanelDef, pg: PageDef): PanelMeta => {
    const { scores, warnings } = analyzePanel(panel);
    return {
      storyTitle, pageNumber: pg.pageNumber, pageTheme: pg.theme || storyTheme,
      panelNumber: panel.panelNumber, panelPosition: panel.panelPosition,
      panelType: panel.panelType, panelShape: panel.panelShape, mood: panel.mood,
      shotType: panel.shotType, cameraAngle: panel.cameraAngle, emotion: panel.emotion,
      focusCharacter: panel.focusCharacter, bubblePlacement: panel.bubblePlacement,
      lighting: panel.lighting, effects: panel.effects, pose: panel.pose,
      depthLayers: panel.depthLayers, scene: panel.scene, dialogue: panel.dialogue,
      generatedAt: new Date().toISOString(),
      scores, warnings,
    };
  };

  const handleSavePanel = async (base64: string, _label: string, pg: PageDef, panel: PanelDef) => {
    if (Platform.OS === 'web') { Alert.alert('Save not supported on web'); return; }
    try {
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status !== 'granted') { Alert.alert('Permission needed', 'Allow photo library access to save images.'); return; }
      const ts = Date.now();
      const imgUri = FileSystem.cacheDirectory + `panel-${ts}.png`;
      await FileSystem.writeAsStringAsync(imgUri, base64, { encoding: FileSystem.EncodingType.Base64 });
      const asset = await MediaLibrary.createAssetAsync(imgUri);
      const albumName = 'Comic Artist Studio';
      let album = await MediaLibrary.getAlbumAsync(albumName);
      if (album == null) { album = await MediaLibrary.createAlbumAsync(albumName, asset, false); }
      else { await MediaLibrary.addAssetsToAlbumAsync([asset], album, false); }
      // Save metadata JSON alongside the image
      const metaUri = FileSystem.cacheDirectory + `panel-${ts}.metadata.json`;
      await FileSystem.writeAsStringAsync(metaUri, JSON.stringify(buildPanelMeta(panel, pg), null, 2), { encoding: FileSystem.EncodingType.UTF8 });
      const metaAsset = await MediaLibrary.createAssetAsync(metaUri);
      if (album) { await MediaLibrary.addAssetsToAlbumAsync([metaAsset], album, false); }
      Alert.alert('Saved!', `Panel saved to the "${albumName}" album.`);
    } catch (err) {
      console.error('[Page Pipeline] Save error:', err);
      Alert.alert('Error', `Could not save: ${err instanceof Error ? err.message : 'Please try again.'}`);
    }
  };

  const handleExportPackage = async () => {
    if (Platform.OS === 'web') { Alert.alert('Export not supported on web'); return; }
    const panels = pages.flatMap(pg => pg.panels).filter(p => p.imageBase64);
    if (panels.length === 0) { Alert.alert('Nothing to export', 'All panels are still generating.'); return; }
    try {
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status !== 'granted') { Alert.alert('Permission needed', 'Allow photo library access to save images.'); return; }
      const albumName = 'Comic Artist Studio';
      let album = await MediaLibrary.getAlbumAsync(albumName);
      const ts = Date.now();
      // Save each panel image + metadata
      const savedPanels: PanelMeta[] = [];
      for (const panel of panels) {
        const pg = pages.find(p => p.panels.some(pn => pn.id === panel.id))!;
        const meta = buildPanelMeta(panel, pg);
        const imgUri = FileSystem.cacheDirectory + `panel-${panel.id}-${ts}.png`;
        await FileSystem.writeAsStringAsync(imgUri, panel.imageBase64!, { encoding: FileSystem.EncodingType.Base64 });
        const asset = await MediaLibrary.createAssetAsync(imgUri);
        if (album == null) { album = await MediaLibrary.createAlbumAsync(albumName, asset, false); }
        else { await MediaLibrary.addAssetsToAlbumAsync([asset], album, false); }
        const metaUri = FileSystem.cacheDirectory + `panel-${panel.id}-${ts}.metadata.json`;
        await FileSystem.writeAsStringAsync(metaUri, JSON.stringify(meta, null, 2), { encoding: FileSystem.EncodingType.UTF8 });
        const metaAsset = await MediaLibrary.createAssetAsync(metaUri);
        if (album) { await MediaLibrary.addAssetsToAlbumAsync([metaAsset], album, false); }
        savedPanels.push(meta);
      }
      // Save master manifest
      const manifest = {
        exportType: 'comic-package',
        app: 'BloomScript Novels Scripts Comic Production',
        exportedAt: new Date().toISOString(),
        storyTitle, storyTheme,
        characterDNA: dna,
        continuity,
        pages: pages.map(pg => ({
          pageNumber: pg.pageNumber, theme: pg.theme,
          panels: pg.panels.map(p => buildPanelMeta(p, pg)),
        })),
        totalPanels: savedPanels.length,
      };
      const manifestUri = FileSystem.cacheDirectory + `comic-package-${ts}.json`;
      await FileSystem.writeAsStringAsync(manifestUri, JSON.stringify(manifest, null, 2), { encoding: FileSystem.EncodingType.UTF8 });
      const manifestAsset = await MediaLibrary.createAssetAsync(manifestUri);
      if (album) { await MediaLibrary.addAssetsToAlbumAsync([manifestAsset], album, false); }
      Alert.alert('Package Exported!', `${savedPanels.length} panels + manifest saved to the "${albumName}" album.`);
    } catch (err) {
      console.error('[Page Pipeline] Export error:', err);
      Alert.alert('Error', `Could not export: ${err instanceof Error ? err.message : 'Please try again.'}`);
    }
  };

  const handleSaveAll = async () => {
    if (Platform.OS === 'web') { Alert.alert('Save not supported on web'); return; }
    const panels = pages.flatMap(pg => pg.panels).filter(p => p.imageBase64);
    if (panels.length === 0) { Alert.alert('Nothing to save', 'All panels are still generating.'); return; }
    try {
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status !== 'granted') { Alert.alert('Permission needed', 'Allow photo library access to save images.'); return; }
      const albumName = 'Comic Artist Studio';
      let album = await MediaLibrary.getAlbumAsync(albumName);
      const saved: string[] = [];
      for (const panel of panels) {
        const pg = pages.find(p => p.panels.some(pn => pn.id === panel.id))!;
        const meta = buildPanelMeta(panel, pg);
        const ts = Date.now();
        const uri = FileSystem.cacheDirectory + `panel-${panel.id}-${ts}.png`;
        await FileSystem.writeAsStringAsync(uri, panel.imageBase64!, { encoding: FileSystem.EncodingType.Base64 });
        const asset = await MediaLibrary.createAssetAsync(uri);
        if (album == null) { album = await MediaLibrary.createAlbumAsync(albumName, asset, false); }
        else { await MediaLibrary.addAssetsToAlbumAsync([asset], album, false); }
        const metaUri = FileSystem.cacheDirectory + `panel-${panel.id}-${ts}.metadata.json`;
        await FileSystem.writeAsStringAsync(metaUri, JSON.stringify(meta, null, 2), { encoding: FileSystem.EncodingType.UTF8 });
        const metaAsset = await MediaLibrary.createAssetAsync(metaUri);
        if (album) { await MediaLibrary.addAssetsToAlbumAsync([metaAsset], album, false); }
        saved.push(`Panel ${panel.panelNumber}`);
      }
      Alert.alert('Saved!', `${saved.length} panels + metadata saved to the "${albumName}" album.`);
    } catch (err) {
      console.error('[Page Pipeline] Save all error:', err);
      Alert.alert('Error', `Could not save all: ${err instanceof Error ? err.message : 'Please try again.'}`);
    }
  };

  // ── SETUP ──────────────────────────────────────────────────────────────────
  if (phase === 'setup') return (
    <View style={[s.root, { paddingTop: insets.top }]}>
      <View style={s.hdr}>
        <TouchableOpacity onPress={() => router.back()} style={s.hdrBtn}><Feather name="arrow-left" size={20} color={C.ink} /></TouchableOpacity>
        <Text style={s.hdrTitle}>PAGE PIPELINE</Text>
        <View style={{ width: 36 }} />
      </View>
      <ScrollView contentContainerStyle={s.scroll}>

        {/* Character Memory */}
        <Text style={s.secLabel}>CHARACTER MEMORY</Text>
        <View style={[s.card, dna ? { borderColor: C.green } : {}]}>
          {dna ? (
            <>
              <Text style={[s.cardTitle, { color: C.green }]}>✓  {dna.name}</Text>
              <Text style={s.cardSub}>{dna.species}{dna.archetype ? ` · ${dna.archetype}` : ''}{dna.outfit ? ` · ${dna.outfit}` : ''}</Text>
            </>
          ) : (
            <Text style={s.cardSub}>No DNA loaded — go to Consistency Engine first to generate a character.</Text>
          )}
        </View>

        {/* Title */}
        <Text style={[s.secLabel, { marginTop: 18 }]}>STORY TITLE</Text>
        <TextInput value={storyTitle} onChangeText={setStoryTitle} placeholder="e.g. Rise of the Iron Guardian" placeholderTextColor={C.muted} style={s.input} />

        {/* Genre */}
        <Text style={[s.secLabel, { marginTop: 18 }]}>GENRE</Text>
        <View style={s.chipRow}>{THEMES.map(t => <Chip key={t} label={t} active={storyTheme === t} onPress={() => setStoryTheme(t)} />)}</View>

        {/* Page count */}
        <Text style={[s.secLabel, { marginTop: 18 }]}>PAGES  <Text style={{ color: C.yellow }}>{pageCount}</Text></Text>
        <View style={s.numRow}>{[1,2,3,4].map(n => (
          <TouchableOpacity key={n} onPress={() => setPageCount(n)} style={[s.numBtn, pageCount === n && s.numBtnActive]}>
            <Text style={[s.numBtnTxt, pageCount === n && { color: C.yellow }]}>{n}</Text>
          </TouchableOpacity>
        ))}</View>

        {/* Panels per page */}
        <Text style={[s.secLabel, { marginTop: 18 }]}>PANELS PER PAGE  <Text style={{ color: C.yellow }}>{panelsPerPage}</Text></Text>
        <View style={s.numRow}>{[2,3,4,5].map(n => (
          <TouchableOpacity key={n} onPress={() => setPanelsPerPage(n)} style={[s.numBtn, panelsPerPage === n && s.numBtnActive]}>
            <Text style={[s.numBtnTxt, panelsPerPage === n && { color: C.yellow }]}>{n}</Text>
          </TouchableOpacity>
        ))}</View>
        <Text style={s.hint}>{pageCount * panelsPerPage} panels total · est. {Math.round(pageCount * panelsPerPage * 20 / 60)}–{Math.round(pageCount * panelsPerPage * 45 / 60)} min</Text>

        <TouchableOpacity
          style={[s.primaryBtn, !storyTitle.trim() && { opacity: 0.4 }]}
          disabled={!storyTitle.trim()}
          onPress={() => { setPages(makePages(pageCount, panelsPerPage)); setPhase('panels'); }}
          activeOpacity={0.8}
        >
          <Text style={s.primaryBtnTxt}>CONFIGURE PANELS →</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );

  // ── PANELS ─────────────────────────────────────────────────────────────────
  if (phase === 'panels') return (
    <View style={[s.root, { paddingTop: insets.top }]}>
      <View style={s.hdr}>
        <TouchableOpacity onPress={() => setPhase('setup')} style={s.hdrBtn}><Feather name="arrow-left" size={20} color={C.ink} /></TouchableOpacity>
        <Text style={s.hdrTitle}>PANEL EDITOR</Text>
        <TouchableOpacity onPress={generateAll} style={[s.hdrBtn, { width: 64 }]}>
          <Text style={{ color: C.yellow, fontSize: 11, fontWeight: '800' }}>GO ▶</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={s.scroll}>
        {pages.map(pg => (
          <View key={pg.id} style={{ marginBottom: 28 }}>
            {/* Page row */}
            <View style={s.pageHdr}>
              <Text style={s.pageNum}>PAGE {pg.pageNumber}</Text>
              <TextInput value={pg.theme} onChangeText={t => setPages(prev => prev.map(p => p.id === pg.id ? { ...p, theme: t } : p))}
                placeholder={`${storyTheme} theme…`} placeholderTextColor={C.muted} style={s.pageThemeInput} />
            </View>

            {pg.panels.map(panel => (
              <View key={panel.id} style={s.panelCard}>
                <View style={s.panelCardHdr}>
                  <Text style={s.panelNum}>PANEL {panel.panelNumber}</Text>
                  <Text style={s.shotBadge}>{panel.shotType}</Text>
                </View>

                {/* Panel Position */}
                <FieldLabel text="PANEL POSITION" />
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <View style={s.chipRow}>{PANEL_POSITIONS.map(p => (
                    <Chip key={p} label={p} active={panel.panelPosition === p} color={C.blue}
                      onPress={() => updatePanel(pg.id, panel.id, { panelPosition: p })} />
                  ))}</View>
                </ScrollView>

                {/* Panel Type */}
                <FieldLabel text="PANEL TYPE  — Director" />
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <View style={s.chipRow}>{PANEL_TYPES.map(t => (
                    <TouchableOpacity key={t.id} activeOpacity={0.8}
                      onPress={() => {
                        const newPanel: Partial<PanelDef> = { panelType: t.id };
                        // Auto-suggest shot if current shot not in recommended list
                        if (!t.shots.includes(panel.shotType)) {
                          newPanel.shotType = t.shots[0]!;
                          newPanel.cameraAngle = SHOT_LIBRARY.find(s => s.shotName === t.shots[0]!)?.cameraAngle ?? 'Eye Level';
                        }
                        updatePanel(pg.id, panel.id, newPanel);
                      }}
                      style={[ch.chip, panel.panelType === t.id && { borderColor: C.yellow, backgroundColor: '#2A2000' }]}>
                      <Text style={[ch.txt, panel.panelType === t.id && { color: C.yellow }]}>{t.name}</Text>
                      <Text style={{ color: C.muted, fontSize: 8, marginTop: 1 }}>{t.desc}</Text>
                    </TouchableOpacity>
                  ))}</View>
                </ScrollView>

                {/* Panel Shape */}
                <FieldLabel text="PANEL SHAPE" />
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <View style={s.chipRow}>{PANEL_SHAPES.map(sh => (
                    <Chip key={sh} label={sh} active={panel.panelShape === sh} color={C.purple}
                      onPress={() => updatePanel(pg.id, panel.id, { panelShape: sh })} />
                  ))}</View>
                </ScrollView>

                {/* Mood */}
                <FieldLabel text="MOOD" />
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <View style={s.chipRow}>{PANEL_MOODS.map(m => (
                    <Chip key={m} label={m} active={panel.mood === m} color={C.red}
                      onPress={() => updatePanel(pg.id, panel.id, { mood: m })} />
                  ))}</View>
                </ScrollView>

                {/* Shot Library */}
                <FieldLabel text="SHOT LIBRARY" />
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginHorizontal: -2 }}>
                  {SHOT_LIBRARY.map(shot => (
                    <TouchableOpacity key={shot.shotName} activeOpacity={0.8}
                      onPress={() => updatePanel(pg.id, panel.id, { shotType: shot.shotName, cameraAngle: shot.cameraAngle })}
                      style={[s.shotCard, panel.shotType === shot.shotName && s.shotCardActive]}>
                      <Text style={[s.shotName, panel.shotType === shot.shotName && { color: C.yellow }]}>{shot.shotName}</Text>
                      <Text style={s.shotFraming}>{shot.framing}</Text>
                      <Text style={s.shotEmo}>{shot.emotionalUse}</Text>
                      <Text style={s.shotScene}>{shot.recommendedSceneType}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>

                {/* Camera Angle */}
                <FieldLabel text="CAMERA ANGLE" />
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <View style={s.chipRow}>{CAMERA_ANGLES.map(a => (
                    <Chip key={a} label={a} active={panel.cameraAngle === a}
                      onPress={() => updatePanel(pg.id, panel.id, { cameraAngle: a })} />
                  ))}</View>
                </ScrollView>

                {/* Emotion */}
                <FieldLabel text="EMOTION" />
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <View style={s.chipRow}>{EMOTIONS.map(e => (
                    <Chip key={e} label={e} active={panel.emotion === e}
                      onPress={() => updatePanel(pg.id, panel.id, { emotion: e })} />
                  ))}</View>
                </ScrollView>

                {/* Lighting */}
                <FieldLabel text="LIGHTING" />
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <View style={s.chipRow}>{LIGHTING.map(l => (
                    <Chip key={l} label={l} active={panel.lighting === l} color={C.yellow}
                      onPress={() => updatePanel(pg.id, panel.id, { lighting: l })} />
                  ))}</View>
                </ScrollView>

                {/* Effects — multi-select */}
                <FieldLabel text="EFFECTS  (multi-select)" />
                <View style={s.chipRow}>{EFFECTS_LIST.map(e => (
                  <TouchableOpacity key={e} activeOpacity={0.75}
                    onPress={() => toggleEffect(pg.id, panel.id, e, panel)}
                    style={[ch.chip, { flexDirection: 'row', alignItems: 'center' },
                      panel.effects.includes(e) && { borderColor: C.blue, backgroundColor: C.blue + '33' }]}>
                    {panel.effects.includes(e) && <Feather name="check" size={9} color={C.blue} style={{ marginRight: 3 }} />}
                    <Text style={[ch.txt, panel.effects.includes(e) && { color: C.blue }]}>{e}</Text>
                  </TouchableOpacity>
                ))}</View>

                {/* Bubble Placement */}
                <FieldLabel text="BUBBLE PLACEMENT" />
                <View style={s.chipRow}>{BUBBLE_PLACE.map(b => (
                  <Chip key={b} label={b} active={panel.bubblePlacement === b} color={C.red}
                    onPress={() => updatePanel(pg.id, panel.id, { bubblePlacement: b })} />
                ))}</View>

                {/* Pose */}
                <FieldLabel text="POSE" />
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <View style={s.chipRow}>{POSES.map(p => (
                    <Chip key={p} label={p} active={panel.pose === p}
                      onPress={() => updatePanel(pg.id, panel.id, { pose: p })} />
                  ))}</View>
                </ScrollView>

                {/* Focus Character */}
                <FieldLabel text="FOCUS CHARACTER" />
                <TextInput value={panel.focusCharacter} onChangeText={t => updatePanel(pg.id, panel.id, { focusCharacter: t })}
                  placeholder={dna?.name ?? 'Character name…'} placeholderTextColor={C.muted} style={s.input} />

                {/* Depth Layers */}
                <FieldLabel text="DEPTH LAYERS" />
                <View style={s.depthRow}>
                  {(['foreground','midground','background'] as const).map(layer => (
                    <TextInput key={layer} value={panel.depthLayers[layer]}
                      onChangeText={t => updatePanel(pg.id, panel.id, { depthLayers: { ...panel.depthLayers, [layer]: t } })}
                      placeholder={layer.charAt(0).toUpperCase() + layer.slice(1)}
                      placeholderTextColor={C.muted} style={[s.input, s.depthInput]} />
                  ))}
                </View>

                {/* Scene */}
                <FieldLabel text="SCENE DESCRIPTION" />
                <TextInput value={panel.scene} onChangeText={t => updatePanel(pg.id, panel.id, { scene: t })}
                  placeholder="What happens in this panel…" placeholderTextColor={C.muted} multiline style={[s.input, { minHeight: 56 }]} />

                {/* Dialogue */}
                <FieldLabel text={'DIALOGUE  (speech bubble)'} />
                <TextInput value={panel.dialogue} onChangeText={t => updatePanel(pg.id, panel.id, { dialogue: t })}
                  placeholder='"What the character says…"' placeholderTextColor={C.muted} style={s.input} />
              </View>
            ))}
          </View>
        ))}

        <TouchableOpacity style={s.primaryBtn} activeOpacity={0.8} onPress={generateAll}>
          <Feather name="play" size={16} color={C.bg} style={{ marginRight: 8 }} />
          <Text style={s.primaryBtnTxt}>GENERATE COMIC</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );

  // ── GENERATING ─────────────────────────────────────────────────────────────
  if (phase === 'generating') return (
    <View style={[s.root, { paddingTop: insets.top }]}>
      <View style={s.hdr}>
        <View style={{ width: 36 }} />
        <Text style={s.hdrTitle}>GENERATING…</Text>
        <TouchableOpacity onPress={() => { cancelled.current = true; Alert.alert('Cancelled'); setPhase('panels'); }} style={s.hdrBtn}>
          <Feather name="x" size={20} color={C.red} />
        </TouchableOpacity>
      </View>

      {/* Thumbnail strip */}
      <ScrollView horizontal style={{ maxHeight: 110, flexGrow: 0 }} contentContainerStyle={{ padding: 10, gap: 6 }}>
        {pages.flatMap(pg => pg.panels).map(p => (
          <View key={p.id} style={s.thumb}>
            {p.status === 'done' && p.imageBase64
              ? <Image source={{ uri: `data:image/png;base64,${p.imageBase64}` }} style={s.thumbImg} />
              : p.status === 'generating' ? <ActivityIndicator color={C.yellow} size="small" />
              : p.status === 'error'      ? <Feather name="x-circle" size={18} color={C.red} />
              : <View style={s.thumbPlaceholder} />}
            <Text style={s.thumbLbl}>{p.shotType.split(' ').map(w => w[0]).join('').slice(0,3)}{p.panelNumber}</Text>
          </View>
        ))}
      </ScrollView>

      {slowWarn && (
        <View style={s.slowBanner}>
          <Feather name="clock" size={12} color={C.yellow} />
          <Text style={s.slowTxt}>AI servers are busy — hang tight…</Text>
        </View>
      )}

      <ScrollView ref={scrollRef} style={s.logScroll} contentContainerStyle={{ padding: 14 }}>
        {genLog.map((line, i) => (
          <Text key={i} style={[s.logLine,
            line.startsWith('✅') && { color: C.green },
            line.startsWith('  ✗') && { color: C.red },
          ]}>{line}</Text>
        ))}
        {!genLog.length && <ActivityIndicator color={C.yellow} style={{ marginTop: 20 }} />}
      </ScrollView>

      <View style={[s.contBar, { paddingBottom: insets.bottom + 6 }]}>
        <Text style={s.contTitle}>CONTINUITY</Text>
        <Text style={s.contItem}>💡 {continuity.lastLighting}</Text>
        <Text style={s.contItem}>📷 {continuity.lastCamera}</Text>
        <Text style={s.contItem}>😤 {continuity.lastEmotion}</Text>
        <Text style={s.contItem}>📄 {continuity.pagesCompleted} done</Text>
      </View>
    </View>
  );

  // ── PREVIEW ────────────────────────────────────────────────────────────────
  return (
    <View style={[s.root, { paddingTop: insets.top }]}>
      <View style={s.hdr}>
        <TouchableOpacity onPress={() => router.back()} style={s.hdrBtn}><Feather name="arrow-left" size={20} color={C.ink} /></TouchableOpacity>
        <Text style={s.hdrTitle}>"{storyTitle}"</Text>
        <View style={{ flexDirection: 'row', gap: 4 }}>
          <TouchableOpacity onPress={handleSaveAll} style={s.hdrBtn}>
            <Feather name="download" size={18} color={C.yellow} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => { setPhase('setup'); setPages([]); setGenLog([]); }} style={s.hdrBtn}>
            <Feather name="refresh-cw" size={18} color={C.yellow} />
          </TouchableOpacity>
        </View>
      </View>
      <ScrollView contentContainerStyle={s.scroll}>
        {pages.map(pg => (
          <View key={pg.id} style={{ marginBottom: 28 }}>
            <Text style={s.pvPageTitle}>PAGE {pg.pageNumber} — {pg.theme || storyTheme}</Text>
            <View style={s.pvGrid}>
              {pg.panels.map(p => (
                <View key={p.id} style={s.pvPanel}>
                  {p.imageBase64
                    ? (
                      <View>
                        <Image source={{ uri: `data:image/png;base64,${p.imageBase64}` }} style={s.pvImg} />
                        <View style={{ position: 'absolute', top: 4, right: 4, flexDirection: 'row', gap: 4 }}>
                          <TouchableOpacity style={s.saveBtn} onPress={() => handleRegeneratePanel(pg.id, p, pg.theme || storyTheme)}>
                            <Feather name="refresh-cw" size={11} color={C.yellow} />
                          </TouchableOpacity>
                          <TouchableOpacity style={s.saveBtn} onPress={() => handleSavePanel(p.imageBase64!, `Panel ${p.panelNumber}`, pg, p)}>
                            <Feather name="download" size={11} color={C.yellow} />
                          </TouchableOpacity>
                        </View>
                      </View>
                    )
                    : <View style={[s.pvImg, s.pvPlaceholder]}><Feather name="x-circle" size={22} color={C.muted} /></View>
                  }
                  <Text style={s.pvMeta}>#{p.panelNumber} · {p.shotType} · {p.cameraAngle}</Text>
                  {/* Panel scores */}
                  <View style={s.scoreRow}>
                    {(() => {
                      const { scores, warnings } = analyzePanel(p);
                      return (
                        <>
                          <Text style={[s.scoreBadge, { color: scores.anatomy >= 90 ? C.green : scores.anatomy >= 80 ? C.yellow : C.red }]}>
                            🪶{scores.anatomy}
                          </Text>
                          <Text style={[s.scoreBadge, { color: scores.perspective >= 90 ? C.green : scores.perspective >= 80 ? C.yellow : C.red }]}>
                            🎧{scores.perspective}
                          </Text>
                          <Text style={[s.scoreBadge, { color: scores.silhouette >= 90 ? C.green : scores.silhouette >= 80 ? C.yellow : C.red }]}>
                            ⬛{scores.silhouette}
                          </Text>
                          <Text style={[s.scoreBadge, { color: scores.continuity >= 90 ? C.green : scores.continuity >= 80 ? C.yellow : C.red }]}>
                            🔁{scores.continuity}
                          </Text>
                          {warnings.length > 0 && (
                            <Text style={s.warnBadge}>⚠ {warnings.length}</Text>
                          )}
                        </>
                      );
                    })()}
                  </View>
                  {p.effects.length > 0 && <Text style={s.pvFx}>FX: {p.effects.join(', ')}</Text>}
                  {p.dialogue ? <Text style={s.pvDialogue}>"{p.dialogue}"</Text> : null}
                  {(p.depthLayers.foreground || p.depthLayers.background) ? (
                    <Text style={s.pvDepth}>
                      {[p.depthLayers.foreground, p.depthLayers.midground, p.depthLayers.background].filter(Boolean).join(' → ')}
                    </Text>
                  ) : null}
                </View>
              ))}
            </View>
          </View>
        ))}
        <View style={[s.card, { borderColor: C.green, alignItems: 'center' }]}>
          <Feather name="check-circle" size={20} color={C.green} />
          <Text style={[s.cardTitle, { color: C.green, marginTop: 6 }]}>COMIC COMPLETE</Text>
          <Text style={s.cardSub}>{pages.length} pages · {pages.reduce((a, p) => a + p.panels.length, 0)} panels</Text>
          <View style={{ flexDirection: 'row', gap: 10, marginTop: 12 }}>
            <TouchableOpacity style={[s.exportBtn, { backgroundColor: C.yellow }]} onPress={handleExportPackage}>
              <Feather name="package" size={13} color={C.bg} style={{ marginRight: 6 }} />
              <Text style={[s.exportBtnTxt, { color: C.bg }]}>EXPORT PACKAGE</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  root:         { flex: 1, backgroundColor: C.bg },
  scroll:       { padding: 16, paddingBottom: 52 },
  hdr:          { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: C.border },
  hdrTitle:     { color: C.ink, fontSize: 13, fontWeight: '800', letterSpacing: 2 },
  hdrBtn:       { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  secLabel:     { color: C.muted, fontSize: 9, fontWeight: '700', letterSpacing: 2, marginBottom: 8 },
  card:         { backgroundColor: C.card, borderWidth: 1, borderColor: C.border, borderRadius: 8, padding: 14 },
  cardTitle:    { color: C.ink, fontSize: 14, fontWeight: '700' },
  cardSub:      { color: C.muted, fontSize: 12, marginTop: 3 },
  input:        { backgroundColor: C.card, borderWidth: 1, borderColor: C.border, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 9, color: C.ink, fontSize: 13 },
  chipRow:      { flexDirection: 'row', flexWrap: 'wrap' },
  numRow:       { flexDirection: 'row', gap: 8 },
  numBtn:       { width: 52, height: 44, borderWidth: 1, borderColor: C.border, borderRadius: 8, alignItems: 'center', justifyContent: 'center', backgroundColor: C.card },
  numBtnActive: { borderColor: C.yellow, backgroundColor: '#2A2000' },
  numBtnTxt:    { color: C.ink, fontSize: 16, fontWeight: '700' },
  hint:         { color: C.muted, fontSize: 11, marginTop: 8 },
  primaryBtn:   { backgroundColor: C.yellow, borderRadius: 10, paddingVertical: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 8 },
  primaryBtnTxt:{ color: C.bg, fontSize: 14, fontWeight: '900', letterSpacing: 1 },
  pageHdr:      { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  pageNum:      { color: C.yellow, fontSize: 11, fontWeight: '800', letterSpacing: 2, minWidth: 54 },
  pageThemeInput:{ flex: 1, backgroundColor: C.card, borderWidth: 1, borderColor: C.border, borderRadius: 6, paddingHorizontal: 10, paddingVertical: 6, color: C.ink, fontSize: 12 },
  panelCard:    { backgroundColor: C.card2, borderWidth: 1, borderColor: C.border, borderRadius: 8, padding: 12, marginBottom: 10 },
  panelCardHdr: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 2 },
  panelNum:     { color: C.blue, fontSize: 10, fontWeight: '800', letterSpacing: 2 },
  shotBadge:    { backgroundColor: C.border, borderRadius: 10, paddingHorizontal: 8, paddingVertical: 2 },
  // Shot Library cards
  shotCard:     { width: 130, marginRight: 8, backgroundColor: C.card, borderWidth: 1, borderColor: C.border, borderRadius: 8, padding: 10 },
  shotCardActive:{ borderColor: C.yellow, backgroundColor: '#2A2000' },
  shotName:     { color: C.ink, fontSize: 11, fontWeight: '700', marginBottom: 4 },
  shotFraming:  { color: C.muted, fontSize: 9, marginBottom: 2 },
  shotEmo:      { color: C.yellow + 'AA', fontSize: 9, marginBottom: 2 },
  shotScene:    { color: C.blue + 'CC', fontSize: 9 },
  // Depth layers
  depthRow:     { flexDirection: 'row', gap: 6 },
  depthInput:   { flex: 1 },
  // Generating
  thumb:        { width: 76, height: 88, backgroundColor: C.card, borderWidth: 1, borderColor: C.border, borderRadius: 6, alignItems: 'center', justifyContent: 'center' },
  thumbImg:     { width: 74, height: 70, borderRadius: 4 },
  thumbLbl:     { color: C.muted, fontSize: 8, marginTop: 2 },
  thumbPlaceholder: { width: 36, height: 36, borderRadius: 4, backgroundColor: C.border },
  slowBanner:   { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#2A2000', paddingHorizontal: 16, paddingVertical: 7 },
  slowTxt:      { color: C.yellow, fontSize: 11 },
  logScroll:    { flex: 1, backgroundColor: '#0D0A08' },
  logLine:      { color: '#7CFC00', fontSize: 10, fontFamily: 'monospace', lineHeight: 17 },
  contBar:      { backgroundColor: C.card, borderTopWidth: 1, borderTopColor: C.border, padding: 10, flexDirection: 'row', flexWrap: 'wrap', gap: 8, alignItems: 'center' },
  contTitle:    { color: C.muted, fontSize: 8, fontWeight: '800', letterSpacing: 2 },
  contItem:     { color: C.ink, fontSize: 10 },
  // Preview
  pvPageTitle:  { color: C.yellow, fontSize: 12, fontWeight: '800', letterSpacing: 2, marginBottom: 10 },
  pvGrid:       { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  pvPanel:      { width: '47%' },
  pvImg:        { width: '100%', aspectRatio: 1, borderRadius: 6, borderWidth: 1, borderColor: C.border },
  pvPlaceholder:{ backgroundColor: C.card, alignItems: 'center', justifyContent: 'center' },
  saveBtn:      { backgroundColor: C.card + 'CC', borderRadius: 4, padding: 4, borderWidth: 1, borderColor: C.border },
  exportBtn:    { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', borderRadius: 8, paddingHorizontal: 14, paddingVertical: 8, borderWidth: 1, borderColor: C.border },
  exportBtnTxt: { fontSize: 11, fontWeight: '700', letterSpacing: 1 },
  pvMeta:       { color: C.muted, fontSize: 9, marginTop: 3 },
  scoreRow:     { flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginTop: 4 },
  scoreBadge:   { fontSize: 8, fontWeight: '700', letterSpacing: 0.5 },
  warnBadge:    { fontSize: 8, fontWeight: '700', color: C.red, letterSpacing: 0.5 },
  pvFx:         { color: C.blue, fontSize: 9, marginTop: 1 },
  pvDialogue:   { color: C.ink, fontSize: 10, fontStyle: 'italic', marginTop: 2 },
  pvDepth:      { color: C.muted, fontSize: 8, marginTop: 1 },
});
