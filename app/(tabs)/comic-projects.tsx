import { Feather } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as DocumentPicker from 'expo-document-picker';
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  Alert, Image, ScrollView, StyleSheet, Text,
  TextInput, TouchableOpacity, View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const C = {
  bg: '#0E0C0A', card: '#181410', card2: '#201A14', border: '#2E2618',
  yellow: '#FFD600', red: '#E8001C', blue: '#0057A8', green: '#2A7A3A',
  purple: '#8B3FBE', orange: '#FF6A00',
  ink: '#F0EAD8', muted: '#7A6A58', dim: '#3A3028',
};

// ── Types ─────────────────────────────────────────────────────────────────────
interface ReferenceAsset {
  id: string; name: string; localUri: string;
  mimeType: string; size: number; uploadedAt: number;
  category: 'turnaround' | 'expression' | 'outfit' | 'embedding' | 'reference';
  description?: string;
}
interface PoseEntry    { id: string; name: string; emotion: string; action: string; imageUri: string; createdAt: number }
interface CostumeVariant { id: string; name: string; description: string; imageUri: string; isActive: boolean }
interface ExpressionEntry { id: string; emotion: string; imageUri: string; notes: string }

interface CharacterDNA {
  id: string; name: string;
  role: string;
  team: string;
  powers: string[];
  faceShape: string; eyeStyle: string; hairStyle: string;
  outfitTop: string; outfitBottom: string;
  colorPalette: string; bodyProportion: number;
  artStyle: string; personality: string;
  referenceImage: string; accessories: string[];
  locked: boolean;
  referenceAssets: ReferenceAsset[];
  poseHistory: PoseEntry[];
  costumeVariants: CostumeVariant[];
  expressionLibrary: ExpressionEntry[];
}
interface CharacterState { facingDirection: string; [k: string]: string | number | boolean }
interface ContinuityState { currentScene: number; characterStates: Record<string, CharacterState> }
interface PanelRecord { panelId: number; shotType: string; cameraAngle: string; lens: string; continuityReference: string; createdAt: number }
interface ComicProject {
  id: string;
  series: string;
  title: string;
  issueNumber: number;
  arcName: string;
  genre: string;
  createdAt: number; updatedAt: number;
  script: string;
  characterProfiles: CharacterDNA[];
  continuityState: ContinuityState;
  panels: PanelRecord[];
}

type Phase = 'list' | 'hub' | 'characters' | 'char-edit' | 'continuity' | 'script'

const STORAGE_KEY = '@bloomscript:projects_v1';
const ACTIVE_KEY  = '@bloomscript:active_project';

const GENRES = [
  'Superhero','Cosmic','Street Level','Mythology','Sci-Fi',
  'Noir','Sword & Sorcery','War','Espionage','Cyberpunk','Horror','Team Battle',
];
const FACE_SHAPES  = ['Square','Round','Oval','Diamond','Heart','Angular'];
const EYE_STYLES   = ['Narrow','Wide','Almond','Round','Hollow','Glowing'];
const HAIR_STYLES  = ['Short','Long','Bald','Wild','Ponytail','Mohawk','Braids','Shaved'];
const ART_STYLES = [
  // ── Golden & Silver Age ──────────────────────────────────────────────────
  'Golden Age',       // 1940s–50s: flat color, halftone dots, bold outlines
  'Kirby Classic',    // Jack Kirby: Kirby Krackle, cosmic, New Gods, FF
  'Silver Age',       // Romita Sr.: clean romantic 60s classic comics newsprint feel
  'Ditko Angular',    // Steve Ditko: surreal geometry, signature angular style
  'Curt Swan Classic', // 1950s–70s heroic era: clean, wholesome, editorial
  // ── Bronze Age ───────────────────────────────────────────────────────────
  'Neal Adams',       // Realistic anatomy, dramatic lighting — GL/Batman/X-Men
  'George Perez',     // Ultra-dense linework, crowd scenes, Crisis on IE
  'Walt Simonson',    // Angular energy lines, runic weight — Thor era
  'Bernie Wrightson', // Gothic crosshatching, horror — Swamp Thing/Frankenstein
  'John Byrne',       // Clean classic superhero — Uncanny X-Men, Fantastic Four
  // ── Dark Age / Graphic Novel ─────────────────────────────────────────────
  'Frank Miller',     // Noir: Sin City/Dark Knight Returns, deep shadow, hard ink
  'Bill Sienkiewicz', // Expressionist mixed-media, painterly — New Mutants/Elektra
  'Dave McKean',      // Dark painted collage — Arkham Asylum/Sandman covers
  // ── 90s Image / Action Comics ────────────────────────────────────────────
  'Jim Lee',          // Hyper-muscular, crosshatching, 90s action comics era
  'Todd McFarlane',   // Organic webs & capes, hyper-detail — Spider-Man/Spawn
  'Marc Silvestri',   // Dense linework, X-Men, Cyberforce, Image era
  'Mike Mignola',     // Heavy blacks, geometric shadow, horror — Hellboy/BPRD
  // ── Painted & Prestige ───────────────────────────────────────────────────
  'Alex Ross',        // Photorealistic oil painting — classic prestige graphic novels
  'Alex Maleev',      // Gritty photo-ref painting, moody — Daredevil/Spider-Woman
  // ── Contemporary ─────────────────────────────────────────────────────────
  'Jock Noir',        // Angular scratchy linework, dark — Batman Black Mirror
  'Chris Samnee',     // Bold silhouettes, graphic shapes — Daredevil Man Without Fear
  'Mike Allred',      // Retro pop art, clean Silver Age pastiche — Madman/Silver Surfer
  'Sean Murphy',      // Dense mechanical detail — Batman White Knight/Tokyo Ghost
  'Francesco Francavilla', // Retro noir, pulp palette, limited color — Batman/Black Beetle
  // ── Manga & International ─────────────────────────────────────────────────
  'Manga Superhero',  // Anime-influenced American comics, fusion style
  'Ligne Claire',     // Moebius/Tintin: clean contours, flat color, European BD
  'Bande Dessinée',   // Métal Hurlant: Moebius/Druillet airbrush sci-fi
];
const PERSONALITIES= ['Brave','Cold','Cunning','Heroic','Ruthless','Mysterious','Brooding'];
const PALETTES     = ['Dark & Gritty','Neon','Earth Tones','Monochrome','Warm','Cold Blue'];
const ROLES        = ['Hero','Villain','Anti-Hero','Sidekick','Mentor','Ally','Neutral','Antagonist'];
const FACING_DIRS  = ['left','right','forward','back'];

function newProject(series: string, title: string, issueNumber: number, arcName: string, genre: string): ComicProject {
  return {
    id: `proj_${Date.now()}`, series, title, issueNumber, arcName, genre,
    createdAt: Date.now(), updatedAt: Date.now(),
    script: '', characterProfiles: [],
    continuityState: { currentScene: 1, characterStates: {} },
    panels: [],
  };
}
function blankChar(): CharacterDNA {
  return {
    id: `char_${Date.now()}`, name: '', role: 'Hero', team: '',
    powers: [],
    faceShape: 'Oval', eyeStyle: 'Almond',
    hairStyle: 'Short', outfitTop: '', outfitBottom: '', colorPalette: 'Dark & Gritty',
    bodyProportion: 1.0, artStyle: 'Western', personality: 'Heroic',
    referenceImage: '', accessories: [],
    locked: false, referenceAssets: [], poseHistory: [],
    costumeVariants: [], expressionLibrary: [],
  };
}

function assetIcon(mimeType: string): string {
  if (mimeType.startsWith('image/')) return 'image';
  if (mimeType === 'image/svg+xml' || mimeType.includes('svg')) return 'pen-tool';
  if (mimeType.includes('pdf')) return 'file-text';
  if (mimeType.includes('java') || mimeType.includes('json') || mimeType.includes('text')) return 'code';
  if (mimeType.includes('vec') || mimeType.includes('bin')) return 'cpu';
  return 'file';
}
function assetColor(cat: ReferenceAsset['category']): string {
  return { turnaround: '#0057A8', expression: '#E06000', outfit: '#2A7A3A', embedding: '#9B59B6', reference: '#FFD600' }[cat] ?? '#7A6A58';
}
function fmtSize(bytes: number): string {
  if (bytes < 1024) return `${bytes}B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)}MB`;
}
function roleColor(role: string): string {
  const map: Record<string, string> = {
    'Hero': C.blue, 'Villain': C.red, 'Anti-Hero': C.orange,
    'Sidekick': C.green, 'Mentor': C.purple, 'Ally': C.green,
    'Neutral': C.muted, 'Antagonist': C.red,
  };
  return map[role] ?? C.muted;
}

function Chip({ label, active, color, onPress }: { label: string; active: boolean; color?: string; onPress: () => void }) {
  const ac = color ?? C.yellow;
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.75}
      style={[cs.chip, active && { borderColor: ac, backgroundColor: ac + '22' }]}>
      <Text style={[cs.chipTxt, active && { color: ac }]}>{label}</Text>
    </TouchableOpacity>
  );
}
function FL({ text }: { text: string }) {
  return <Text style={cs.fl}>{text}</Text>;
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function ComicProjects() {
  const insets = useSafeAreaInsets();
  const [phase, setPhase]       = useState<Phase>('list');
  const [projects, setProjects] = useState<ComicProject[]>([]);
  const [active, setActive]     = useState<ComicProject | null>(null);
  const [editChar, setEditChar] = useState<CharacterDNA | null>(null);
  const [newSeries, setNewSeries]   = useState('');
  const [newTitle, setNewTitle]     = useState('');
  const [newIssue, setNewIssue]     = useState('1');
  const [newArc, setNewArc]         = useState('');
  const [newGenre, setNewGenre]     = useState('Superhero');
  const [accInput, setAccInput]     = useState('');
  const [powerInput, setPowerInput] = useState('');
  const [stateKey, setStateKey]     = useState('');
  const [stateVal, setStateVal]     = useState('');
  const [editingCharId, setEditingCharId] = useState<string | null>(null);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then(raw => {
      if (raw) try { setProjects(JSON.parse(raw)); } catch { /* ignore */ }
    });
  }, []);

  const saveProjects = (list: ComicProject[]) => {
    setProjects(list);
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  };
  const saveActive = (proj: ComicProject) => {
    const updated = { ...proj, updatedAt: Date.now() };
    setActive(updated);
    const list = projects.map(p => p.id === updated.id ? updated : p);
    saveProjects(list);
    AsyncStorage.setItem(ACTIVE_KEY, JSON.stringify(updated));
  };
  const openProject = (proj: ComicProject) => {
    setActive(proj);
    AsyncStorage.setItem(ACTIVE_KEY, JSON.stringify(proj));
    setPhase('hub');
  };
  const createProject = () => {
    if (!newTitle.trim()) return;
    const issNum = parseInt(newIssue, 10) || 1;
    const proj = newProject(newSeries.trim(), newTitle.trim(), issNum, newArc.trim(), newGenre);
    saveProjects([...projects, proj]);
    setNewTitle(''); setNewSeries(''); setNewIssue('1'); setNewArc('');
    openProject(proj);
  };
  const deleteProject = (id: string) => {
    Alert.alert('Delete Project', 'This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => saveProjects(projects.filter(p => p.id !== id)) },
    ]);
  };

  const upd = (patch: Partial<CharacterDNA>) =>
    setEditChar(prev => prev ? { ...prev, ...patch } : prev);

  // ── Asset pickers ──────────────────────────────────────────────────────────
  const [assetCategory, setAssetCategory] = useState<ReferenceAsset['category']>('reference');
  const ASSET_CATS: ReferenceAsset['category'][] = ['reference', 'turnaround', 'expression', 'outfit', 'embedding'];
  const [assetNote, setAssetNote] = useState('');

  const makeAsset = (name: string, sourceUri: string, mimeType: string, size: number): ReferenceAsset => ({
    id: `asset_${Date.now()}_${Math.random().toString(36).slice(2)}`,
    name, localUri: sourceUri, mimeType, size,
    uploadedAt: Date.now(), category: assetCategory,
    description: assetNote.trim() || undefined,
  });

  const pickImage = async () => {
    if (!editChar) return;
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) { Alert.alert('Permission needed', 'Allow photo library access to upload reference images.'); return; }
    const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: 'images', quality: 0.85, allowsMultipleSelection: true });
    if (res.canceled) return;
    const newAssets = res.assets.map(a => makeAsset(a.fileName ?? `img_${Date.now()}.jpg`, a.uri, a.mimeType ?? 'image/jpeg', a.fileSize ?? 0));
    if (newAssets.length) upd({ referenceAssets: [...(editChar.referenceAssets ?? []), ...newAssets] });
  };
  const pickDocument = async () => {
    if (!editChar) return;
    const res = await DocumentPicker.getDocumentAsync({ type: '*/*', multiple: true, copyToCacheDirectory: true });
    if (res.canceled) return;
    const newAssets = res.assets.map(f => makeAsset(f.name, f.uri, f.mimeType ?? 'application/octet-stream', f.size ?? 0));
    if (newAssets.length) upd({ referenceAssets: [...(editChar.referenceAssets ?? []), ...newAssets] });
  };
  const removeAsset = (assetId: string) => {
    if (!editChar) return;
    upd({ referenceAssets: (editChar.referenceAssets ?? []).filter(a => a.id !== assetId) });
  };

  // ── LIST ──────────────────────────────────────────────────────────────────
  if (phase === 'list') return (
    <View style={[s.root, { paddingTop: insets.top }]}>
      <View style={s.hdr}>
        <TouchableOpacity onPress={() => router.back()} style={s.hdrBtn}>
          <Feather name="arrow-left" size={20} color={C.ink} />
        </TouchableOpacity>
        <Text style={s.hdrTitle}>COMIC PRODUCTION STUDIO</Text>
        <View style={{ width: 36 }} />
      </View>
      <ScrollView contentContainerStyle={s.scroll}>

        {/* ── New Project Form ── */}
        <Text style={s.secLabel}>NEW ISSUE</Text>

        <FL text="SERIES TITLE" />
        <TextInput value={newSeries} onChangeText={setNewSeries}
          placeholder="e.g. Iron Guardian Chronicles"
          placeholderTextColor={C.muted} style={s.input} />

        <View style={{ flexDirection: 'row', gap: 8, marginTop: 8 }}>
          <View style={{ flex: 2 }}>
            <FL text="ISSUE TITLE" />
            <TextInput value={newTitle} onChangeText={setNewTitle}
              placeholder="e.g. Rise of the Phantom"
              placeholderTextColor={C.muted} style={s.input} />
          </View>
          <View style={{ flex: 1 }}>
            <FL text="ISSUE #" />
            <TextInput value={newIssue} onChangeText={setNewIssue}
              placeholder="1" keyboardType="number-pad"
              placeholderTextColor={C.muted} style={s.input} />
          </View>
        </View>

        <FL text="ARC / STORYLINE  (optional)" />
        <TextInput value={newArc} onChangeText={setNewArc}
          placeholder="e.g. The Origin Arc"
          placeholderTextColor={C.muted} style={s.input} />

        <FL text="GENRE" />
        <View style={[cs.chipRow, { marginTop: 4 }]}>
          {GENRES.map(g => <Chip key={g} label={g} active={newGenre === g} onPress={() => setNewGenre(g)} />)}
        </View>

        <TouchableOpacity
          style={[s.btn, !newTitle.trim() && { opacity: 0.4 }]}
          disabled={!newTitle.trim()} onPress={createProject} activeOpacity={0.8}>
          <Feather name="plus" size={15} color={C.bg} style={{ marginRight: 6 }} />
          <Text style={s.btnTxt}>CREATE ISSUE</Text>
        </TouchableOpacity>

        {/* ── Existing Projects ── */}
        {projects.length > 0 && (
          <Text style={[s.secLabel, { marginTop: 28 }]}>MY ISSUES  ({projects.length})</Text>
        )}
        {projects.map(proj => (
          <TouchableOpacity key={proj.id} onPress={() => openProject(proj)} activeOpacity={0.8} style={s.projCard}>
            {/* Issue badge */}
            <View style={s.issueBadge}>
              <Text style={s.issueBadgeNum}>#{proj.issueNumber ?? 1}</Text>
            </View>
            <View style={{ flex: 1 }}>
              {proj.series ? <Text style={s.projSeries}>{proj.series.toUpperCase()}</Text> : null}
              <Text style={s.projTitle}>{proj.title}</Text>
              {proj.arcName ? <Text style={s.projArc}>Arc: {proj.arcName}</Text> : null}
              <Text style={s.projMeta}>
                {proj.genre} · {proj.characterProfiles.length} characters · {proj.panels.length} panels
              </Text>
              <Text style={s.projMeta}>
                Page {proj.continuityState.currentScene} · {new Date(proj.updatedAt).toLocaleDateString()}
              </Text>
            </View>
            <TouchableOpacity onPress={() => deleteProject(proj.id)} style={{ padding: 8 }}>
              <Feather name="trash-2" size={15} color={C.muted} />
            </TouchableOpacity>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );

  if (!active) return null;

  // ── HUB ───────────────────────────────────────────────────────────────────
  if (phase === 'hub') {
    const sections = [
      {
        icon: 'users' as const,      label: 'cast/',
        sub: `${active.characterProfiles.length} characters`,
        color: C.blue,               action: () => setPhase('characters'),
      },
      {
        icon: 'film' as const,       label: 'panels/',
        sub: `${active.panels.length} panels · open Panel Director`,
        color: C.yellow,             action: () => router.push('/(tabs)/panel-director' as any),
      },
      {
        icon: 'layout' as const,     label: 'pages/',
        sub: 'Page Pipeline & sequential layout',
        color: C.orange,             action: () => router.push('/(tabs)/story-pages' as any),
      },
      {
        icon: 'file-text' as const,  label: 'script/',
        sub: active.script ? `${active.script.split('\n').length} lines` : 'No script yet',
        color: C.green,              action: () => setPhase('script'),
      },
      {
        icon: 'refresh-cw' as const, label: 'continuity/',
        sub: `Page ${active.continuityState.currentScene} · ${Object.keys(active.continuityState.characterStates).length} tracked`,
        color: C.purple,             action: () => setPhase('continuity'),
      },
      {
        icon: 'image' as const,      label: 'cover/',
        sub: 'Open Cover Generator',
        color: C.red,                action: () => router.push('/(tabs)/cover-generator' as any),
      },
      {
        icon: 'share-2' as const,    label: 'export/',
        sub: 'PDF · CBZ · Webtoon',
        color: C.muted,              action: () => {},
      },
    ];
    return (
      <View style={[s.root, { paddingTop: insets.top }]}>
        <View style={s.hdr}>
          <TouchableOpacity onPress={() => setPhase('list')} style={s.hdrBtn}>
            <Feather name="arrow-left" size={20} color={C.ink} />
          </TouchableOpacity>
          <View style={{ flex: 1, marginHorizontal: 8 }}>
            {active.series ? (
              <Text style={{ color: C.muted, fontSize: 8, textAlign: 'center', letterSpacing: 2, fontWeight: '700' }}>
                {active.series.toUpperCase()}
              </Text>
            ) : null}
            <Text style={s.hdrTitle}>
              #{active.issueNumber ?? 1} — {active.title.toUpperCase()}
            </Text>
            {active.arcName ? (
              <Text style={{ color: C.yellow + 'AA', fontSize: 8, textAlign: 'center', letterSpacing: 1 }}>
                {active.arcName}
              </Text>
            ) : null}
          </View>
          <TouchableOpacity
            onPress={() => router.push('/(tabs)/panel-director' as any)}
            style={[s.hdrBtn, { width: 64 }]}>
            <Text style={{ color: C.yellow, fontSize: 10, fontWeight: '800' }}>DIRECT ▶</Text>
          </TouchableOpacity>
        </View>

        {/* Genre badge */}
        <View style={{ paddingHorizontal: 16, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: C.border, flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <View style={s.genreBadge}>
            <Text style={s.genreBadgeTxt}>{active.genre.toUpperCase()}</Text>
          </View>
          <Text style={{ color: C.muted, fontSize: 10 }}>
            {active.characterProfiles.length} characters · {active.panels.length} panels · page {active.continuityState.currentScene}
          </Text>
        </View>

        <ScrollView contentContainerStyle={s.scroll}>
          <Text style={s.secLabel}>ComicStudio/{active.series || active.title}/#{active.issueNumber ?? 1}/</Text>
          {sections.map(sec => (
            <TouchableOpacity key={sec.label} onPress={sec.action} activeOpacity={0.8} style={s.sectionCard}>
              <Feather name={sec.icon} size={16} color={sec.color} style={{ marginRight: 12 }} />
              <View style={{ flex: 1 }}>
                <Text style={s.secCardLabel}>├── {sec.label}</Text>
                <Text style={s.secCardSub}>{sec.sub}</Text>
              </View>
              <Feather name="chevron-right" size={14} color={C.muted} />
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    );
  }

  // ── CHARACTERS ────────────────────────────────────────────────────────────
  if (phase === 'characters') return (
    <View style={[s.root, { paddingTop: insets.top }]}>
      <View style={s.hdr}>
        <TouchableOpacity onPress={() => setPhase('hub')} style={s.hdrBtn}>
          <Feather name="arrow-left" size={20} color={C.ink} />
        </TouchableOpacity>
        <Text style={s.hdrTitle}>CAST</Text>
        <TouchableOpacity onPress={() => {
          setEditChar(blankChar()); setEditingCharId(null); setPhase('char-edit');
        }} style={s.hdrBtn}>
          <Feather name="user-plus" size={20} color={C.yellow} />
        </TouchableOpacity>
      </View>
      <ScrollView contentContainerStyle={s.scroll}>
        {active.characterProfiles.length === 0 && (
          <View style={{ alignItems: 'center', marginTop: 52 }}>
            <Feather name="users" size={36} color={C.border} />
            <Text style={[s.secLabel, { textAlign: 'center', marginTop: 12 }]}>No cast yet. Tap + to create a character.</Text>
          </View>
        )}
        {active.characterProfiles.map(char => (
          <TouchableOpacity key={char.id} activeOpacity={0.8} style={s.charCard}
            onPress={() => { setEditChar({ ...char }); setEditingCharId(char.id); setPhase('char-edit'); }}>
            {/* Thumbnail */}
            {(char.referenceAssets ?? []).find(a => a.mimeType?.startsWith('image/')) ? (
              <Image
                source={{ uri: (char.referenceAssets ?? []).find(a => a.mimeType?.startsWith('image/'))!.localUri }}
                style={s.charThumb} />
            ) : (
              <View style={[s.charThumbPlaceholder, { borderColor: roleColor(char.role) + '66' }]}>
                <Text style={{ color: roleColor(char.role), fontSize: 9, fontWeight: '900', letterSpacing: 0.5 }}>
                  {(char.role ?? 'HERO').slice(0, 4).toUpperCase()}
                </Text>
              </View>
            )}
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Text style={[s.charName, { color: roleColor(char.role) }]}>{char.name || 'Unnamed'}</Text>
                {char.locked && (
                  <View style={s.lockBadge}><Feather name="lock" size={9} color={C.green} /><Text style={s.lockBadgeTxt}> LOCKED</Text></View>
                )}
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 }}>
                <View style={[s.rolePill, { borderColor: roleColor(char.role) + '88', backgroundColor: roleColor(char.role) + '18' }]}>
                  <Text style={[s.rolePillTxt, { color: roleColor(char.role) }]}>{char.role}</Text>
                </View>
                {char.team ? <Text style={s.charMeta}>{char.team}</Text> : null}
              </View>
              <Text style={s.charMeta}>{char.artStyle} · {char.colorPalette} · {char.personality}</Text>
              {(char.powers ?? []).length > 0 && (
                <Text style={[s.charMeta, { color: C.yellow + 'CC' }]} numberOfLines={1}>
                  ⚡ {(char.powers ?? []).join(' · ')}
                </Text>
              )}
              <View style={{ flexDirection: 'row', gap: 8, marginTop: 3 }}>
                {(char.referenceAssets ?? []).length > 0 && <Text style={s.assetBadge}>{(char.referenceAssets ?? []).length} assets</Text>}
                {(char.costumeVariants ?? []).length > 0 && <Text style={s.assetBadge}>{(char.costumeVariants ?? []).length} costumes</Text>}
                {(char.expressionLibrary ?? []).length > 0 && <Text style={s.assetBadge}>{(char.expressionLibrary ?? []).length} expressions</Text>}
              </View>
            </View>
            <Feather name="edit-2" size={14} color={C.muted} />
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );

  // ── CHAR EDIT ─────────────────────────────────────────────────────────────
  if (phase === 'char-edit' && editChar) {
    const updChar = (patch: Partial<CharacterDNA>) => setEditChar(prev => prev ? { ...prev, ...patch } : prev);
    const saveChar = () => {
      if (!editChar.name.trim()) { Alert.alert('Name required'); return; }
      const profiles = editingCharId
        ? active.characterProfiles.map(c => c.id === editingCharId ? editChar : c)
        : [...active.characterProfiles, editChar];
      saveActive({ ...active, characterProfiles: profiles });
      setPhase('characters');
    };
    return (
      <View style={[s.root, { paddingTop: insets.top }]}>
        <View style={s.hdr}>
          <TouchableOpacity onPress={() => setPhase('characters')} style={s.hdrBtn}>
            <Feather name="arrow-left" size={20} color={C.ink} />
          </TouchableOpacity>
          <Text style={s.hdrTitle}>{editingCharId ? 'EDIT CHARACTER' : 'NEW CHARACTER'}</Text>
          <TouchableOpacity onPress={saveChar} style={[s.hdrBtn, { width: 52 }]}>
            <Text style={{ color: C.green, fontSize: 11, fontWeight: '800' }}>SAVE</Text>
          </TouchableOpacity>
        </View>
        <ScrollView contentContainerStyle={s.scroll}>
          {/* Lock toggle */}
          <TouchableOpacity onPress={() => updChar({ locked: !editChar.locked })} activeOpacity={0.8}
            style={[s.lockToggle, editChar.locked && s.lockToggleActive]}>
            <Feather name={editChar.locked ? 'lock' : 'unlock'} size={14}
              color={editChar.locked ? C.green : C.muted} style={{ marginRight: 8 }} />
            <Text style={[s.lockToggleTxt, editChar.locked && { color: C.green }]}>
              {editChar.locked ? '[✓] LOCK CHARACTER DNA — AI CONSISTENCY ON' : '[ ] LOCK CHARACTER DNA'}
            </Text>
          </TouchableOpacity>

          <FL text="CHARACTER NAME" />
          <TextInput value={editChar.name} onChangeText={t => updChar({ name: t })}
            placeholder="e.g. Commander Steel" placeholderTextColor={C.muted} style={s.input} />

          <FL text="ROLE" />
          <View style={cs.chipRow}>
            {ROLES.map(r => (
              <Chip key={r} label={r} active={editChar.role === r}
                color={roleColor(r)} onPress={() => updChar({ role: r })} />
            ))}
          </View>

          <FL text="TEAM / FACTION  (optional)" />
          <TextInput value={editChar.team ?? ''} onChangeText={t => updChar({ team: t })}
            placeholder="e.g. The Iron Guard, Syndicate X…"
            placeholderTextColor={C.muted} style={s.input} />

          <FL text="POWERS / ABILITIES" />
          <View style={s.accRow}>
            <TextInput value={powerInput} onChangeText={setPowerInput}
              placeholder="e.g. Super strength, Flight…"
              placeholderTextColor={C.muted} style={[s.input, { flex: 1 }]} />
            <TouchableOpacity onPress={() => {
              if (powerInput.trim()) { updChar({ powers: [...(editChar.powers ?? []), powerInput.trim()] }); setPowerInput(''); }
            }} style={s.addBtn}>
              <Feather name="zap" size={15} color={C.bg} />
            </TouchableOpacity>
          </View>
          <View style={cs.chipRow}>
            {(editChar.powers ?? []).map(pw => (
              <TouchableOpacity key={pw} onPress={() => updChar({ powers: (editChar.powers ?? []).filter(p => p !== pw) })}
                style={[cs.chip, { borderColor: C.yellow + '88', flexDirection: 'row', alignItems: 'center' }]}>
                <Text style={[cs.chipTxt, { color: C.yellow }]}>⚡ {pw}</Text>
                <Feather name="x" size={9} color={C.yellow} style={{ marginLeft: 4 }} />
              </TouchableOpacity>
            ))}
          </View>

          <FL text="FACE SHAPE" />
          <View style={cs.chipRow}>{FACE_SHAPES.map(f => <Chip key={f} label={f} active={editChar.faceShape === f} onPress={() => updChar({ faceShape: f })} />)}</View>

          <FL text="EYE STYLE" />
          <View style={cs.chipRow}>{EYE_STYLES.map(e => <Chip key={e} label={e} active={editChar.eyeStyle === e} onPress={() => updChar({ eyeStyle: e })} />)}</View>

          <FL text="HAIR STYLE" />
          <View style={cs.chipRow}>{HAIR_STYLES.map(h => <Chip key={h} label={h} active={editChar.hairStyle === h} onPress={() => updChar({ hairStyle: h })} />)}</View>

          <FL text="COSTUME — TOP" />
          <TextInput value={editChar.outfitTop} onChangeText={t => updChar({ outfitTop: t })}
            placeholder="e.g. Armored chest plate, cape" placeholderTextColor={C.muted} style={s.input} />

          <FL text="COSTUME — BOTTOM" />
          <TextInput value={editChar.outfitBottom} onChangeText={t => updChar({ outfitBottom: t })}
            placeholder="e.g. Tactical pants, boots" placeholderTextColor={C.muted} style={s.input} />

          <FL text="COLOR PALETTE" />
          <View style={cs.chipRow}>{PALETTES.map(p => <Chip key={p} label={p} active={editChar.colorPalette === p} onPress={() => updChar({ colorPalette: p })} />)}</View>

          <FL text="ART STYLE" />
          <View style={cs.chipRow}>{ART_STYLES.map(a => <Chip key={a} label={a} active={editChar.artStyle === a} onPress={() => updChar({ artStyle: a })} />)}</View>

          <FL text="PERSONALITY" />
          <View style={cs.chipRow}>{PERSONALITIES.map(p => <Chip key={p} label={p} active={editChar.personality === p} onPress={() => updChar({ personality: p })} />)}</View>

          <FL text={`BODY PROPORTION  ×${editChar.bodyProportion.toFixed(1)}`} />
          <View style={s.propRow}>
            <TouchableOpacity onPress={() => updChar({ bodyProportion: Math.max(0.5, +(editChar.bodyProportion - 0.1).toFixed(1)) })} style={s.propBtn}><Text style={s.propBtnTxt}>−</Text></TouchableOpacity>
            <View style={s.propBar}><View style={[s.propFill, { width: `${((editChar.bodyProportion - 0.5) / 1.5) * 100}%` as any }]} /></View>
            <TouchableOpacity onPress={() => updChar({ bodyProportion: Math.min(2.0, +(editChar.bodyProportion + 0.1).toFixed(1)) })} style={s.propBtn}><Text style={s.propBtnTxt}>+</Text></TouchableOpacity>
          </View>

          <FL text="ACCESSORIES / GEAR" />
          <View style={s.accRow}>
            <TextInput value={accInput} onChangeText={setAccInput}
              placeholder="e.g. Shield, Grappling hook…" placeholderTextColor={C.muted} style={[s.input, { flex: 1 }]} />
            <TouchableOpacity onPress={() => {
              if (accInput.trim()) { updChar({ accessories: [...editChar.accessories, accInput.trim()] }); setAccInput(''); }
            }} style={s.addBtn}>
              <Feather name="plus" size={16} color={C.bg} />
            </TouchableOpacity>
          </View>
          <View style={cs.chipRow}>
            {editChar.accessories.map(acc => (
              <TouchableOpacity key={acc} onPress={() => updChar({ accessories: editChar.accessories.filter(a => a !== acc) })}
                style={[cs.chip, { borderColor: C.blue + '88', flexDirection: 'row', alignItems: 'center' }]}>
                <Text style={[cs.chipTxt, { color: C.blue }]}>{acc}</Text>
                <Feather name="x" size={9} color={C.blue} style={{ marginLeft: 4 }} />
              </TouchableOpacity>
            ))}
          </View>

          {/* ── Reference Assets ── */}
          <FL text="REFERENCE ASSETS" />
          <Text style={s.assetHint}>Upload character sheets, turnarounds, expression grids, costume refs, embedding vectors, or any reference files.</Text>

          <View style={cs.chipRow}>
            {ASSET_CATS.map(cat => (
              <Chip key={cat} label={cat} active={assetCategory === cat}
                color={assetColor(cat)} onPress={() => setAssetCategory(cat)} />
            ))}
          </View>

          <TextInput value={assetNote} onChangeText={setAssetNote}
            placeholder="Describe this asset — pose, scene, costume variant…  (optional)"
            placeholderTextColor={C.muted} multiline
            style={[s.input, { minHeight: 60, lineHeight: 19, marginBottom: 8 }]} />

          <View style={s.uploadBtns}>
            <TouchableOpacity onPress={pickImage} activeOpacity={0.8} style={s.uploadBtn}>
              <Feather name="image" size={14} color={C.yellow} style={{ marginRight: 6 }} />
              <Text style={s.uploadBtnTxt}>PNG / JPG</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={pickDocument} activeOpacity={0.8} style={[s.uploadBtn, { borderColor: C.blue + '88' }]}>
              <Feather name="paperclip" size={14} color={C.blue} style={{ marginRight: 6 }} />
              <Text style={[s.uploadBtnTxt, { color: C.blue }]}>SVG · PDF · VEC</Text>
            </TouchableOpacity>
          </View>

          {(editChar.referenceAssets ?? []).length > 0 && (
            <View style={s.assetList}>
              {(editChar.referenceAssets ?? []).filter(a => a.mimeType?.startsWith('image/')).length > 0 && (
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 8 }}>
                  <View style={{ flexDirection: 'row', gap: 8 }}>
                    {(editChar.referenceAssets ?? []).filter(a => a.mimeType?.startsWith('image/')).map(asset => (
                      <View key={asset.id} style={s.assetThumbWrap}>
                        <Image source={{ uri: asset.localUri }} style={s.assetThumb} resizeMode="cover" />
                        <View style={[s.assetCatBadge, { backgroundColor: assetColor(asset.category) + '33' }]}>
                          <Text style={[s.assetCatTxt, { color: assetColor(asset.category) }]}>{asset.category}</Text>
                        </View>
                        <TouchableOpacity onPress={() => removeAsset(asset.id)} style={s.assetRemoveBtn}>
                          <Feather name="x" size={10} color={C.ink} />
                        </TouchableOpacity>
                      </View>
                    ))}
                  </View>
                </ScrollView>
              )}
              {(editChar.referenceAssets ?? []).filter(a => !a.mimeType?.startsWith('image/')).map(asset => (
                <View key={asset.id} style={s.assetFileCard}>
                  <Feather name={assetIcon(asset.mimeType) as any} size={16}
                    color={assetColor(asset.category)} style={{ marginRight: 10 }} />
                  <View style={{ flex: 1 }}>
                    <Text style={s.assetFileName} numberOfLines={1}>{asset.name}</Text>
                    <Text style={s.assetFileMeta}>{asset.category} · {fmtSize(asset.size)}</Text>
                    {asset.description ? <Text style={s.assetFileDesc} numberOfLines={2}>{asset.description}</Text> : null}
                  </View>
                  <TouchableOpacity onPress={() => removeAsset(asset.id)} style={{ padding: 4 }}>
                    <Feather name="trash-2" size={13} color={C.muted} />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}

          {/* DNA folder structure */}
          <View style={s.folderCard}>
            <Text style={s.folderTitle}>cast/{editChar.name || 'unnamed'}/</Text>
            <Text style={s.folderLine}>├── dna.json  [{editChar.role}]</Text>
            <Text style={s.folderLine}>├── embeddings.vec  {(editChar.referenceAssets ?? []).filter(a => a.category === 'embedding').length > 0 ? '✓' : '–'}</Text>
            <Text style={s.folderLine}>├── turnaround/  ({(editChar.referenceAssets ?? []).filter(a => a.category === 'turnaround').length})</Text>
            <Text style={s.folderLine}>├── expressions/  ({(editChar.referenceAssets ?? []).filter(a => a.category === 'expression').length})</Text>
            <Text style={s.folderLine}>├── costumes/  ({(editChar.referenceAssets ?? []).filter(a => a.category === 'outfit').length})</Text>
            <Text style={s.folderLine}>└── powers.json  [{(editChar.powers ?? []).length} abilities]</Text>
          </View>
        </ScrollView>
      </View>
    );
  }

  // ── CONTINUITY ────────────────────────────────────────────────────────────
  if (phase === 'continuity') {
    const cont = active.continuityState;
    const updatePage = (n: number) => saveActive({ ...active, continuityState: { ...cont, currentScene: Math.max(1, n) } });
    const getCharState = (name: string): CharacterState => cont.characterStates[name] ?? { facingDirection: 'right' };
    const setCharState = (name: string, state: CharacterState) =>
      saveActive({ ...active, continuityState: { ...cont, characterStates: { ...cont.characterStates, [name]: state } } });

    return (
      <View style={[s.root, { paddingTop: insets.top }]}>
        <View style={s.hdr}>
          <TouchableOpacity onPress={() => setPhase('hub')} style={s.hdrBtn}>
            <Feather name="arrow-left" size={20} color={C.ink} />
          </TouchableOpacity>
          <Text style={s.hdrTitle}>CONTINUITY TRACKER</Text>
          <View style={{ width: 36 }} />
        </View>
        <ScrollView contentContainerStyle={s.scroll}>
          <FL text="CURRENT PAGE" />
          <View style={s.sceneRow}>
            <TouchableOpacity onPress={() => updatePage(cont.currentScene - 1)} style={s.propBtn}>
              <Text style={s.propBtnTxt}>−</Text>
            </TouchableOpacity>
            <View style={{ alignItems: 'center' }}>
              <Text style={s.sceneNum}>{cont.currentScene}</Text>
              <Text style={{ color: C.muted, fontSize: 9, letterSpacing: 1 }}>PAGE</Text>
            </View>
            <TouchableOpacity onPress={() => updatePage(cont.currentScene + 1)} style={s.propBtn}>
              <Text style={s.propBtnTxt}>+</Text>
            </TouchableOpacity>
          </View>

          {active.characterProfiles.map(char => {
            const cs2 = getCharState(char.name);
            return (
              <View key={char.id} style={s.contCard}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  <Text style={[s.contCharName, { color: roleColor(char.role) }]}>{char.name}</Text>
                  <View style={[s.rolePill, { borderColor: roleColor(char.role) + '66', backgroundColor: roleColor(char.role) + '18' }]}>
                    <Text style={[s.rolePillTxt, { color: roleColor(char.role) }]}>{char.role}</Text>
                  </View>
                </View>
                <FL text="FACING DIRECTION" />
                <View style={cs.chipRow}>
                  {FACING_DIRS.map(d => (
                    <Chip key={d} label={d} active={cs2.facingDirection === d} color={C.blue}
                      onPress={() => setCharState(char.name, { ...cs2, facingDirection: d })} />
                  ))}
                </View>

                {Object.entries(cs2).filter(([k]) => k !== 'facingDirection').map(([k, v]) => (
                  <View key={k} style={s.stateRow}>
                    <Text style={s.stateKey}>{k}</Text>
                    <TextInput value={String(v)} onChangeText={t => {
                      const parsed = t === 'true' ? true : t === 'false' ? false : isNaN(+t) ? t : +t;
                      setCharState(char.name, { ...cs2, [k]: parsed });
                    }} style={s.stateVal} placeholderTextColor={C.muted} />
                    <TouchableOpacity onPress={() => {
                      const { [k]: _, ...rest } = cs2;
                      setCharState(char.name, rest as CharacterState);
                    }}>
                      <Feather name="x" size={14} color={C.muted} />
                    </TouchableOpacity>
                  </View>
                ))}

                <View style={s.accRow}>
                  <TextInput value={stateKey} onChangeText={setStateKey}
                    placeholder="state key (e.g. maskOn, injured)" placeholderTextColor={C.muted}
                    style={[s.input, { flex: 1 }]} />
                  <TextInput value={stateVal} onChangeText={setStateVal}
                    placeholder="value" placeholderTextColor={C.muted}
                    style={[s.input, { flex: 1, marginLeft: 6 }]} />
                  <TouchableOpacity onPress={() => {
                    if (!stateKey.trim()) return;
                    const parsed = stateVal === 'true' ? true : stateVal === 'false' ? false : isNaN(+stateVal) ? stateVal : +stateVal;
                    setCharState(char.name, { ...cs2, [stateKey.trim()]: parsed });
                    setStateKey(''); setStateVal('');
                  }} style={s.addBtn}>
                    <Feather name="plus" size={14} color={C.bg} />
                  </TouchableOpacity>
                </View>
              </View>
            );
          })}

          {active.characterProfiles.length === 0 && (
            <Text style={[s.secLabel, { textAlign: 'center', marginTop: 32 }]}>
              Add characters to the cast first to track continuity.
            </Text>
          )}
        </ScrollView>
      </View>
    );
  }

  // ── SCRIPT ────────────────────────────────────────────────────────────────
  return (
    <View style={[s.root, { paddingTop: insets.top }]}>
      <View style={s.hdr}>
        <TouchableOpacity onPress={() => setPhase('hub')} style={s.hdrBtn}>
          <Feather name="arrow-left" size={20} color={C.ink} />
        </TouchableOpacity>
        <Text style={s.hdrTitle}>COMIC SCRIPT</Text>
        <TouchableOpacity onPress={() => saveActive(active)} style={[s.hdrBtn, { width: 52 }]}>
          <Text style={{ color: C.green, fontSize: 11, fontWeight: '800' }}>SAVE</Text>
        </TouchableOpacity>
      </View>
      <TextInput
        value={active.script}
        onChangeText={t => setActive(a => a ? { ...a, script: t } : a)}
        onBlur={() => saveActive(active)}
        placeholder={`${(active.series || active.title).toUpperCase()} #${active.issueNumber ?? 1}${active.arcName ? `\nARC: ${active.arcName}` : ''}\n\nPAGE 1\n\nPanel 1:\nWIDE SHOT — Establishing. The city skyline at dusk.\n\nPanel 2:\nMEDIUM SHOT — HERO stands on rooftop edge, cape billowing.\nCAP: "Every city has its shadow."\n\nPanel 3:\n…`}
        placeholderTextColor={C.muted}
        multiline style={[s.scriptInput, { flex: 1 }]}
      />
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  root:       { flex: 1, backgroundColor: C.bg },
  scroll:     { padding: 16, paddingBottom: 52 },
  hdr:        { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: C.border },
  hdrTitle:   { color: C.ink, fontSize: 12, fontWeight: '800', letterSpacing: 2, textAlign: 'center' },
  hdrBtn:     { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  secLabel:   { color: C.muted, fontSize: 9, fontWeight: '700', letterSpacing: 2, marginBottom: 8 },
  input:      { backgroundColor: C.card, borderWidth: 1, borderColor: C.border, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 9, color: C.ink, fontSize: 13 },
  btn:        { backgroundColor: C.yellow, borderRadius: 10, paddingVertical: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 12 },
  btnTxt:     { color: C.bg, fontSize: 13, fontWeight: '900', letterSpacing: 1 },
  // project list
  issueBadge: { width: 44, height: 44, backgroundColor: C.yellow + '22', borderWidth: 1, borderColor: C.yellow + '55', borderRadius: 8, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  issueBadgeNum: { color: C.yellow, fontSize: 14, fontWeight: '900' },
  projCard:   { backgroundColor: C.card, borderWidth: 1, borderColor: C.border, borderRadius: 8, padding: 14, marginBottom: 10, flexDirection: 'row', alignItems: 'center' },
  projSeries: { color: C.muted, fontSize: 9, fontWeight: '800', letterSpacing: 2, marginBottom: 2 },
  projTitle:  { color: C.ink, fontSize: 14, fontWeight: '700' },
  projArc:    { color: C.yellow + 'AA', fontSize: 10, marginTop: 1 },
  projMeta:   { color: C.muted, fontSize: 11, marginTop: 2 },
  // genre badge
  genreBadge: { borderWidth: 1, borderColor: C.yellow + '55', backgroundColor: C.yellow + '18', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  genreBadgeTxt: { color: C.yellow, fontSize: 9, fontWeight: '800', letterSpacing: 1.5 },
  // hub sections
  sectionCard: { backgroundColor: C.card, borderWidth: 1, borderColor: C.border, borderRadius: 8, padding: 14, marginBottom: 8, flexDirection: 'row', alignItems: 'center' },
  secCardLabel: { color: C.ink, fontSize: 12, fontWeight: '600', fontFamily: 'monospace' },
  secCardSub:   { color: C.muted, fontSize: 11, marginTop: 2 },
  // cast
  charCard:   { backgroundColor: C.card2, borderWidth: 1, borderColor: C.border, borderRadius: 8, padding: 14, marginBottom: 8, flexDirection: 'row', alignItems: 'center' },
  charName:   { fontSize: 14, fontWeight: '700' },
  charMeta:   { color: C.muted, fontSize: 11, marginTop: 2 },
  rolePill:   { borderWidth: 1, borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2 },
  rolePillTxt:{ fontSize: 9, fontWeight: '800', letterSpacing: 0.5 },
  // char thumb
  charThumb:            { width: 52, height: 52, borderRadius: 8, marginRight: 12, borderWidth: 1, borderColor: C.border },
  charThumbPlaceholder: { width: 52, height: 52, borderRadius: 8, marginRight: 12, backgroundColor: C.card2, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  lockBadge:            { flexDirection: 'row', alignItems: 'center', backgroundColor: C.green + '22', borderRadius: 4, paddingHorizontal: 5, paddingVertical: 2 },
  lockBadgeTxt:         { color: C.green, fontSize: 9, fontWeight: '700' },
  assetBadge:           { color: C.muted, fontSize: 9, backgroundColor: C.border, borderRadius: 4, paddingHorizontal: 5, paddingVertical: 2 },
  // body proportion
  propRow:    { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 4 },
  propBtn:    { width: 36, height: 36, backgroundColor: C.card, borderWidth: 1, borderColor: C.border, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  propBtnTxt: { color: C.ink, fontSize: 18, fontWeight: '700' },
  propBar:    { flex: 1, height: 6, backgroundColor: C.border, borderRadius: 3, overflow: 'hidden' },
  propFill:   { height: 6, backgroundColor: C.yellow, borderRadius: 3 },
  // rows
  accRow:     { flexDirection: 'row', gap: 8, alignItems: 'center' },
  addBtn:     { width: 40, height: 40, backgroundColor: C.yellow, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  // lock toggle
  lockToggle:       { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: C.border, borderRadius: 8, padding: 12, marginBottom: 12 },
  lockToggleActive: { borderColor: C.green, backgroundColor: C.green + '18' },
  lockToggleTxt:    { color: C.muted, fontSize: 12, fontWeight: '700', letterSpacing: 0.5 },
  // assets
  assetHint:         { color: C.muted, fontSize: 10, lineHeight: 15, marginBottom: 8 },
  uploadBtns:        { flexDirection: 'row', gap: 8, marginBottom: 8 },
  uploadBtn:         { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: C.yellow + '66', borderRadius: 8, paddingVertical: 11 },
  uploadBtnTxt:      { color: C.yellow, fontSize: 11, fontWeight: '700' },
  assetList:         { backgroundColor: C.card2, borderRadius: 8, borderWidth: 1, borderColor: C.border, padding: 10, marginBottom: 4 },
  assetThumbWrap:    { position: 'relative', width: 80, height: 80 },
  assetThumb:        { width: 80, height: 80, borderRadius: 6, borderWidth: 1, borderColor: C.border },
  assetCatBadge:     { position: 'absolute', bottom: 2, left: 2, right: 2, borderRadius: 3, paddingVertical: 1, alignItems: 'center' },
  assetCatTxt:       { fontSize: 7, fontWeight: '800', letterSpacing: 0.5 },
  assetRemoveBtn:    { position: 'absolute', top: -4, right: -4, width: 18, height: 18, backgroundColor: C.red, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
  assetFileCard:     { flexDirection: 'row', alignItems: 'center', backgroundColor: C.card, borderRadius: 6, padding: 10, marginBottom: 6 },
  assetFileName:     { color: C.ink, fontSize: 12, fontWeight: '600' },
  assetFileMeta:     { color: C.muted, fontSize: 10, marginTop: 2 },
  assetFileDesc:     { color: C.muted + 'CC', fontSize: 10, fontStyle: 'italic', marginTop: 2, lineHeight: 14 },
  // folder
  folderCard:  { backgroundColor: '#080604', borderWidth: 1, borderColor: C.border, borderRadius: 8, padding: 12, marginTop: 8 },
  folderTitle: { color: C.yellow, fontSize: 10, fontWeight: '700', fontFamily: 'monospace', marginBottom: 5 },
  folderLine:  { color: C.muted, fontSize: 10, fontFamily: 'monospace', lineHeight: 18 },
  // continuity
  contCard:     { backgroundColor: C.card2, borderWidth: 1, borderColor: C.border, borderRadius: 8, padding: 14, marginBottom: 12 },
  contCharName: { fontSize: 13, fontWeight: '700' },
  stateRow:     { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  stateKey:     { color: C.blue, fontSize: 11, fontWeight: '700', minWidth: 120 },
  stateVal:     { flex: 1, backgroundColor: C.card, borderWidth: 1, borderColor: C.border, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 4, color: C.ink, fontSize: 11 },
  sceneRow:     { flexDirection: 'row', alignItems: 'center', gap: 16, marginBottom: 16 },
  sceneNum:     { color: C.yellow, fontSize: 40, fontWeight: '900', minWidth: 60, textAlign: 'center' },
  // script
  scriptInput:  { backgroundColor: C.card, color: C.ink, fontSize: 13, padding: 16, fontFamily: 'monospace', lineHeight: 22 },
});
const cs = StyleSheet.create({
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 4 },
  chip:    { borderWidth: 1, borderColor: C.border, borderRadius: 20, paddingHorizontal: 11, paddingVertical: 4, marginRight: 6, marginBottom: 6 },
  chipTxt: { color: C.muted, fontSize: 11, fontWeight: '600' },
  fl:      { color: C.muted, fontSize: 9, fontWeight: '700', letterSpacing: 1.5, marginBottom: 5, marginTop: 12 },
});
