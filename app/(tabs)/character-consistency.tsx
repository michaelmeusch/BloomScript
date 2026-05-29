import { Feather } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Alert,
  Animated,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// ── COMIC Palette ──────────────────────────────────────────────────────────────
const C = {
  red:    '#E8001C',
  yellow: '#FFD600',
  blue:   '#0057A8',
  green:  '#2A7A3A',
  black:  '#1A1410',
  white:  '#FFFDE7',
  panel:  '#221C18',
  border: '#3A3028',
  muted:  '#7A6A58',
  ink:    '#F0EAD8',
};

// ── DNA arrays — direct port of the Java spec ──────────────────────────────────
const ARCHETYPES = [
  'Hero','Anti-Hero','Dark Warrior','Mystic Guardian','Cyber Assassin',
  'Space Ranger','Alien King','Mech Pilot','Shadow Monk','Galactic Mage',
];
const FIRST_NAMES = ['Astra','Nova','Vex','Kael','Zyra','Draven','Orion','Lyric','Nyx','Titan'];
const LAST_NAMES  = ['Storm','Void','Blaze','Night','Pulse','Shadow','Flare','Phoenix','Steel','Echo'];
const SPECIES = ['Human','Cyborg','Alien','Mutant','Spirit Being','Mech Warrior','Celestial','Shadow Entity'];
const ART_STYLES = [
  // Golden & Silver Age
  'Kirby Classic','Silver Age','Golden Age','Ditko Angular','Curt Swan Classic',
  // Bronze Age
  'Neal Adams','George Perez','Walt Simonson','Bernie Wrightson','John Byrne',
  // Dark Age / Graphic Novel
  'Frank Miller','Bill Sienkiewicz','Dave McKean',
  // 90s Image / Action Comics
  'Jim Lee','Todd McFarlane','Marc Silvestri','Mike Mignola',
  // Painted & Prestige
  'Alex Ross','Alex Maleev',
  // Contemporary
  'Jock Noir','Chris Samnee','Mike Allred','Sean Murphy','Francesco Francavilla',
  // Manga & International
  'Manga Superhero','Ligne Claire','Bande Dessinée',
];
const HAIR = ['Spiky','Long','Short','Braided','Cyberpunk','Wild','Curly','Mohawk'];
const OUTFITS = [
  'Battle Armor','Mystic Robes','Streetwear','Nano Suit',
  'Superhero Suit','Samurai Armor','Space Combat Gear','Dark Cloak',
];
const PERSONALITIES = ['Heroic','Calm','Dark','Aggressive','Wise','Mysterious','Chaotic','Strategic'];
const POWERS = [
  'Energy Manipulation','Flight','Shadow Control','Telepathy','Super Strength',
  'Time Distortion','Fire Control','Ice Manipulation','Dimensional Warp','Bio-Mechanical Fusion',
];

const COLOR_PALETTES = [
  ['#E8001C','#FFD600'],['#0057A8','#00E5FF'],['#7B2FBE','#FF6B6B'],
  ['#2D4A3E','#98FB98'],['#FF6B00','#1A1410'],['#E91E8C','#00FFFF'],
  ['#FFD600','#1A1410'],['#00BCD4','#FF5722'],
];

// ── Types ──────────────────────────────────────────────────────────────────────
interface CharacterDNA {
  id: string;
  name: string;
  archetype: string;
  species: string;
  artStyle: string;
  hairstyle: string;
  outfit: string;
  personality: string;
  power: string;
  primaryColor: string;
  secondaryColor: string;
  heightRatio: number;
  shoulderWidth: number;
  armLength: number;
  legLength: number;
  styleLockStrength: number;
  hasArmor: boolean;
  hasCape: boolean;
  consistencyLocked: boolean;
  lockedReference?: CharacterDNA;
  createdAt: number;
}

// ── TRUE CHARACTER CONSISTENCY ENGINE ─────────────────────────────────────────
interface ConsistencyReport {
  faceScore: number; bodyScore: number; costumeScore: number; silhouetteScore: number;
  averageScore: number; passed: boolean; warnings: string[];
}

function buildFaceEmbedding(dna: CharacterDNA): number[] {
  const archetypeIndex = ARCHETYPES.indexOf(dna.archetype) / Math.max(1, ARCHETYPES.length);
  const speciesIndex = SPECIES.indexOf(dna.species) / Math.max(1, SPECIES.length);
  const hairIndex = HAIR.indexOf(dna.hairstyle) / Math.max(1, HAIR.length);
  const styleIndex = ART_STYLES.indexOf(dna.artStyle) / Math.max(1, ART_STYLES.length);
  const pColor = parseInt(dna.primaryColor.replace('#', ''), 16) / 0xFFFFFF;
  const sColor = parseInt(dna.secondaryColor.replace('#', ''), 16) / 0xFFFFFF;
  return [archetypeIndex, speciesIndex, hairIndex, styleIndex, pColor, sColor, dna.hasArmor ? 1 : 0, dna.hasCape ? 1 : 0];
}
function buildBodyRatios(dna: CharacterDNA): Record<string, number> {
  return { heightRatio: dna.heightRatio, shoulderWidth: dna.shoulderWidth, armLength: dna.armLength, legLength: dna.legLength };
}
function buildCostumeProfile(dna: CharacterDNA): Record<string, string | number | boolean> {
  return { outfit: dna.outfit, hasArmor: dna.hasArmor, hasCape: dna.hasCape, primaryColor: dna.primaryColor, secondaryColor: dna.secondaryColor, artStyle: dna.artStyle };
}
function buildSilhouette(dna: CharacterDNA): number[] {
  // Silhouette fingerprint: archetype + body ratios + armor/cape
  const arch = ARCHETYPES.indexOf(dna.archetype) / Math.max(1, ARCHETYPES.length);
  return [arch, dna.heightRatio / 10, dna.shoulderWidth / 4, dna.hasArmor ? 1 : 0, dna.hasCape ? 1 : 0];
}

class ConsistencyEngine {
  static validate(ref: CharacterDNA, current: CharacterDNA): ConsistencyReport {
    const report: ConsistencyReport = { faceScore: 0, bodyScore: 0, costumeScore: 0, silhouetteScore: 0, passed: false, warnings: [], averageScore: 0 };
    report.faceScore = this.compareEmbeddings(buildFaceEmbedding(ref), buildFaceEmbedding(current));
    report.bodyScore = this.compareBodyRatios(buildBodyRatios(ref), buildBodyRatios(current));
    report.costumeScore = this.compareCostumeProfiles(buildCostumeProfile(ref), buildCostumeProfile(current));
    report.silhouetteScore = this.compareSilhouettes(buildSilhouette(ref), buildSilhouette(current));
    if (report.faceScore < 85) report.warnings.push('Face consistency drift detected');
    if (report.bodyScore < 80) report.warnings.push('Body proportions inconsistent');
    if (report.costumeScore < 90) report.warnings.push('Costume variation detected');
    if (report.silhouetteScore < 80) report.warnings.push('Silhouette mismatch');
    report.averageScore = Math.round((report.faceScore + report.bodyScore + report.costumeScore + report.silhouetteScore) / 4);
    report.passed = report.averageScore >= 85;
    return report;
  }
  private static compareEmbeddings(a: number[], b: number[]): number {
    if (!a?.length || !b?.length || a.length !== b.length) return 0;
    let similarity = 0;
    for (let i = 0; i < a.length; i++) similarity += 1 - Math.abs(a[i] - b[i]);
    return Math.floor((similarity / a.length) * 100);
  }
  private static compareBodyRatios(a: Record<string, number>, b: Record<string, number>): number {
    const keys = Object.keys(a).filter(k => typeof b[k] === 'number');
    if (!keys.length) return 0;
    let totalDiff = 0;
    for (const k of keys) totalDiff += Math.abs(a[k]! - b[k]!);
    return Math.max(0, Math.floor(100 - (totalDiff / keys.length) * 100));
  }
  private static compareCostumeProfiles(a: Record<string, any>, b: Record<string, any>): number {
    const keys = Object.keys(a);
    if (!keys.length) return 0;
    let matches = 0;
    for (const k of keys) if (a[k] === b[k]) matches++;
    return Math.floor((matches / keys.length) * 100);
  }
  private static compareSilhouettes(a: number[], b: number[]): number {
    if (!a?.length || !b?.length || a.length !== b.length) return 0;
    let similarity = 0;
    for (let i = 0; i < a.length; i++) similarity += 1 - Math.abs(a[i] - b[i]);
    return Math.floor((similarity / a.length) * 100);
  }
}

const STORAGE_KEY = '@bloomscript:consistency_engine_v1';

// ── Helpers ────────────────────────────────────────────────────────────────────
function pick<T>(arr: T[]): T { return arr[Math.floor(Math.random() * arr.length)]!; }
function rng(min: number, max: number) { return +(min + (max - min) * Math.random()).toFixed(2); }

function generateDNA(): CharacterDNA {
  const [primaryColor, secondaryColor] = pick(COLOR_PALETTES);
  return {
    id: Date.now().toString(),
    name: `${pick(FIRST_NAMES)} ${pick(LAST_NAMES)}`,
    archetype: pick(ARCHETYPES),
    species: pick(SPECIES),
    artStyle: pick(ART_STYLES),
    hairstyle: pick(HAIR),
    outfit: pick(OUTFITS),
    personality: pick(PERSONALITIES),
    power: pick(POWERS),
    primaryColor: primaryColor!,
    secondaryColor: secondaryColor!,
    heightRatio: rng(7.0, 9.5),
    shoulderWidth: rng(1.5, 3.5),
    armLength: rng(1.0, 2.0),
    legLength: rng(1.2, 2.5),
    styleLockStrength: rng(0.85, 1.0),
    hasArmor: Math.random() > 0.5,
    hasCape: Math.random() > 0.5,
    consistencyLocked: false,
    createdAt: Date.now(),
  };
}

// ── DNA stat bar ───────────────────────────────────────────────────────────────
function StatBar({ label, value, min, max, color }: { label: string; value: number; min: number; max: number; color: string }) {
  const pct = ((value - min) / (max - min)) * 100;
  return (
    <View style={sb.statRow}>
      <Text style={sb.statLabel}>{label}</Text>
      <View style={sb.statTrack}>
        <View style={[sb.statFill, { width: `${pct}%` as any, backgroundColor: color }]} />
      </View>
      <Text style={sb.statVal}>{value.toFixed(1)}</Text>
    </View>
  );
}
const sb = StyleSheet.create({
  statRow:   { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  statLabel: { width: 100, fontSize: 11, fontFamily: 'Inter_600SemiBold', color: C.muted },
  statTrack: { flex: 1, height: 6, borderRadius: 3, backgroundColor: C.border, overflow: 'hidden' },
  statFill:  { height: 6, borderRadius: 3 },
  statVal:   { width: 36, fontSize: 11, fontFamily: 'Inter_700Bold', color: C.ink, textAlign: 'right' },
});

// ── Lock animation pill ────────────────────────────────────────────────────────
function LockPill({ label, locked }: { label: string; locked: boolean }) {
  return (
    <View style={[lp.pill, { borderColor: locked ? C.yellow : C.border }]}>
      <Feather name={locked ? 'lock' : 'unlock'} size={10} color={locked ? C.yellow : C.muted} />
      <Text style={[lp.text, { color: locked ? C.yellow : C.muted }]}>{label}</Text>
    </View>
  );
}
const lp = StyleSheet.create({
  pill: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 20, borderWidth: 1 },
  text: { fontSize: 10, fontFamily: 'Inter_600SemiBold' },
});

// ── Main screen ────────────────────────────────────────────────────────────────
export default function CharacterConsistency() {
  const insets = useSafeAreaInsets();
  const [characters, setCharacters] = useState<CharacterDNA[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [lockingId, setLockingId] = useState<string | null>(null);
  const [lockProgress, setLockProgress] = useState(0);
  const [renameModalVisible, setRenameModalVisible] = useState(false);
  const [renameValue, setRenameValue] = useState('');
  const lockAnim = useRef(new Animated.Value(0)).current;
  const flashAnim = useRef(new Animated.Value(1)).current;

  const selected = characters.find((c) => c.id === selectedId) ?? null;

  // ── Load persisted characters ────────────────────────────────────────────────
  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((raw) => {
      if (raw) {
        const loaded = JSON.parse(raw) as CharacterDNA[];
        setCharacters(loaded);
        if (loaded.length > 0) setSelectedId(loaded[0]!.id);
      }
    }).catch(() => {});
  }, []);

  const persist = useCallback((chars: CharacterDNA[]) => {
    setCharacters(chars);
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(chars)).catch(() => {});
  }, []);

  // ── Generate random character ────────────────────────────────────────────────
  const handleGenerate = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    const dna = generateDNA();
    const updated = [dna, ...characters].slice(0, 20);
    persist(updated);
    setSelectedId(dna.id);

    // Flash animation
    Animated.sequence([
      Animated.timing(flashAnim, { toValue: 0, duration: 80, useNativeDriver: true }),
      Animated.timing(flashAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
    ]).start();
  };

  // ── Update a field on selected character ────────────────────────────────────
  const updateSelected = (patch: Partial<CharacterDNA>) => {
    if (!selected) return;
    const updated = characters.map((c) => c.id === selected.id ? { ...c, ...patch } : c);
    persist(updated);
  };

  // ── Delete character ─────────────────────────────────────────────────────────
  const handleDelete = (id: string) => {
    Alert.alert('Delete Character', 'Remove this character from the engine?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive', onPress: () => {
          const updated = characters.filter((c) => c.id !== id);
          persist(updated);
          if (selectedId === id) setSelectedId(updated[0]?.id ?? null);
        },
      },
    ]);
  };

  // ── Apply Consistency Lock ───────────────────────────────────────────────────
  const handleLock = () => {
    if (!selected || lockingId) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    setLockingId(selected.id);
    setLockProgress(0);

    const LOCK_STEPS = ['Face Embedding','Body Ratios','Costume Profile','Silhouette Hash','Color Palette'];
    let step = 0;

    const interval = setInterval(() => {
      step++;
      setLockProgress((step / LOCK_STEPS.length) * 100);
      Animated.timing(lockAnim, { toValue: step / LOCK_STEPS.length, duration: 300, useNativeDriver: false }).start();
      if (step >= LOCK_STEPS.length) {
        clearInterval(interval);
        setTimeout(() => {
          updateSelected({ consistencyLocked: true, lockedReference: { ...selected } });
          setLockingId(null);
          setLockProgress(0);
          lockAnim.setValue(0);
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }, 400);
      }
    }, 380);
  };

  // ── Rename ───────────────────────────────────────────────────────────────────
  const openRename = () => {
    if (!selected) return;
    setRenameValue(selected.name);
    setRenameModalVisible(true);
  };

  const confirmRename = () => {
    if (renameValue.trim()) updateSelected({ name: renameValue.trim() });
    setRenameModalVisible(false);
  };

  const isLocking = lockingId === selected?.id;

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
          <Feather name="arrow-left" size={22} color={C.ink} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>AUTO CHARACTER ENGINE</Text>
          <Text style={styles.headerSub}>Style Lock · DNA · Turnaround</Text>
        </View>
        <TouchableOpacity style={styles.generateBtn} onPress={handleGenerate} activeOpacity={0.85}>
          <Feather name="zap" size={14} color={C.black} />
          <Text style={styles.generateBtnText}>RANDOM</Text>
        </TouchableOpacity>
      </View>

      {/* ── Character strip ─────────────────────────────────────────────────── */}
      <View style={styles.stripWrapper}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.strip}>
          <TouchableOpacity style={styles.addCard} onPress={handleGenerate} activeOpacity={0.8}>
            <Feather name="plus" size={18} color={C.yellow} />
            <Text style={styles.addCardText}>NEW</Text>
          </TouchableOpacity>
          {characters.map((c) => {
            const isSel = c.id === selectedId;
            return (
              <TouchableOpacity
                key={c.id}
                style={[styles.charChip, { borderColor: isSel ? c.primaryColor : C.border, backgroundColor: isSel ? c.primaryColor + '22' : C.panel }]}
                onPress={() => { Haptics.selectionAsync(); setSelectedId(c.id); }}
                onLongPress={() => handleDelete(c.id)}
                activeOpacity={0.8}
              >
                <View style={[styles.chipColorDot, { backgroundColor: c.primaryColor }]} />
                <View>
                  <Text style={[styles.chipName, { color: isSel ? c.primaryColor : C.ink }]} numberOfLines={1}>{c.name}</Text>
                  <Text style={styles.chipArch} numberOfLines={1}>{c.archetype}</Text>
                </View>
                {c.consistencyLocked && (
                  <Feather name="lock" size={10} color={C.yellow} style={{ marginLeft: 2 }} />
                )}
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {characters.length === 0 ? (
        /* ── Empty state ───────────────────────────────────────────────────── */
        <Animated.View style={[styles.empty, { opacity: flashAnim }]}>
          <Text style={styles.emptyIcon}>🧬</Text>
          <Text style={styles.emptyTitle}>NO CHARACTERS YET</Text>
          <Text style={styles.emptyDesc}>Tap RANDOM to auto-generate your first character DNA profile.</Text>
          <TouchableOpacity style={styles.emptyBtn} onPress={handleGenerate} activeOpacity={0.85}>
            <Feather name="zap" size={16} color={C.black} />
            <Text style={styles.emptyBtnText}>GENERATE FIRST CHARACTER</Text>
          </TouchableOpacity>
        </Animated.View>
      ) : selected ? (
        /* ── Character profile ──────────────────────────────────────────────── */
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

          {/* Name + Archetype banner */}
          <View style={[styles.nameBanner, { borderColor: selected.primaryColor }]}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.charName, { color: selected.primaryColor }]}>{selected.name}</Text>
              <View style={styles.badgeRow}>
                <View style={[styles.badge, { backgroundColor: selected.primaryColor + '22', borderColor: selected.primaryColor }]}>
                  <Text style={[styles.badgeText, { color: selected.primaryColor }]}>{selected.archetype}</Text>
                </View>
                <View style={[styles.badge, { backgroundColor: C.border }]}>
                  <Text style={[styles.badgeText, { color: C.muted }]}>{selected.species}</Text>
                </View>
                <View style={[styles.badge, { backgroundColor: C.border }]}>
                  <Text style={[styles.badgeText, { color: C.muted }]}>{selected.artStyle}</Text>
                </View>
              </View>
            </View>
            <TouchableOpacity onPress={openRename} style={styles.editNameBtn}>
              <Feather name="edit-2" size={14} color={C.muted} />
            </TouchableOpacity>
          </View>

          {/* Color Palette */}
          <View style={styles.block}>
            <Text style={styles.blockLabel}>COLOR HARMONY</Text>
            <View style={styles.colorRow}>
              <View style={styles.colorSwatch}>
                <View style={[styles.colorCircle, { backgroundColor: selected.primaryColor }]} />
                <Text style={styles.colorLabel}>Primary</Text>
                <Text style={styles.colorHex}>{selected.primaryColor}</Text>
              </View>
              <View style={styles.colorSwatch}>
                <View style={[styles.colorCircle, { backgroundColor: selected.secondaryColor }]} />
                <Text style={styles.colorLabel}>Secondary</Text>
                <Text style={styles.colorHex}>{selected.secondaryColor}</Text>
              </View>
              <TouchableOpacity
                style={styles.rerollColorBtn}
                onPress={() => {
                  Haptics.selectionAsync();
                  const [p, s] = pick(COLOR_PALETTES);
                  updateSelected({ primaryColor: p!, secondaryColor: s! });
                }}
                activeOpacity={0.8}
              >
                <Feather name="refresh-cw" size={14} color={C.yellow} />
                <Text style={styles.rerollText}>Reroll</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Body DNA */}
          <View style={styles.block}>
            <Text style={styles.blockLabel}>BODY DNA</Text>
            <StatBar label="Height Ratio" value={selected.heightRatio}  min={7.0} max={9.5} color={selected.primaryColor} />
            <StatBar label="Shoulder Width" value={selected.shoulderWidth} min={1.5} max={3.5} color={selected.primaryColor} />
            <StatBar label="Arm Length"    value={selected.armLength}    min={1.0} max={2.0} color={selected.secondaryColor} />
            <StatBar label="Leg Length"    value={selected.legLength}    min={1.2} max={2.5} color={selected.secondaryColor} />
          </View>

          {/* Visual Profile */}
          <View style={styles.block}>
            <Text style={styles.blockLabel}>VISUAL PROFILE</Text>
            <View style={styles.profileGrid}>
              {[
                { label: 'Hair', value: selected.hairstyle, pool: HAIR, field: 'hairstyle' as const },
                { label: 'Outfit', value: selected.outfit, pool: OUTFITS, field: 'outfit' as const },
                { label: 'Personality', value: selected.personality, pool: PERSONALITIES, field: 'personality' as const },
                { label: 'Power', value: selected.power, pool: POWERS, field: 'power' as const },
              ].map(({ label, value, pool, field }) => (
                <TouchableOpacity
                  key={field}
                  style={styles.profileChip}
                  onPress={() => { Haptics.selectionAsync(); updateSelected({ [field]: pick(pool) }); }}
                  activeOpacity={0.8}
                >
                  <Text style={styles.profileChipLabel}>{label}</Text>
                  <Text style={[styles.profileChipValue, { color: selected.primaryColor }]} numberOfLines={1}>{value}</Text>
                  <Feather name="refresh-cw" size={9} color={C.muted} style={{ marginTop: 2 }} />
                </TouchableOpacity>
              ))}
            </View>

            {/* Armor + Cape toggles */}
            <View style={styles.toggleRow}>
              <View style={styles.toggleItem}>
                <Text style={styles.toggleLabel}>Has Armor</Text>
                <Switch
                  value={selected.hasArmor}
                  onValueChange={(v) => { Haptics.selectionAsync(); updateSelected({ hasArmor: v }); }}
                  thumbColor={selected.hasArmor ? C.yellow : C.muted}
                  trackColor={{ false: C.border, true: C.yellow + '55' }}
                />
              </View>
              <View style={styles.toggleItem}>
                <Text style={styles.toggleLabel}>Has Cape</Text>
                <Switch
                  value={selected.hasCape}
                  onValueChange={(v) => { Haptics.selectionAsync(); updateSelected({ hasCape: v }); }}
                  thumbColor={selected.hasCape ? C.yellow : C.muted}
                  trackColor={{ false: C.border, true: C.yellow + '55' }}
                />
              </View>
            </View>
          </View>

          {/* Style Lock */}
          <View style={styles.block}>
            <View style={styles.blockLabelRow}>
              <Text style={styles.blockLabel}>STYLE LOCK STRENGTH</Text>
              <Text style={[styles.lockPct, { color: selected.primaryColor }]}>{Math.round(selected.styleLockStrength * 100)}%</Text>
            </View>
            <View style={styles.lockTrack}>
              <View style={[styles.lockFill, { width: `${selected.styleLockStrength * 100}%` as any, backgroundColor: selected.primaryColor }]} />
            </View>
            <View style={styles.lockStepRow}>
              {[0.7, 0.8, 0.9, 0.95, 1.0].map((v) => (
                <TouchableOpacity
                  key={v}
                  style={[styles.lockStep, { borderColor: selected.styleLockStrength >= v ? selected.primaryColor : C.border, backgroundColor: selected.styleLockStrength >= v ? selected.primaryColor + '18' : 'transparent' }]}
                  onPress={() => { Haptics.selectionAsync(); updateSelected({ styleLockStrength: v }); }}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.lockStepText, { color: selected.styleLockStrength >= v ? selected.primaryColor : C.muted }]}>{Math.round(v * 100)}%</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Turnaround Views */}
          <View style={styles.block}>
            <Text style={styles.blockLabel}>TURNAROUND SHEET</Text>
            <Text style={styles.blockHint}>View angles locked to character DNA for consistent AI generation.</Text>
            <View style={styles.turnaroundGrid}>
              {[
                { label: 'Front View',      emoji: '⬆️', angle: 'front' },
                { label: 'Side View',       emoji: '➡️', angle: 'side' },
                { label: 'Back View',       emoji: '⬇️', angle: 'back' },
                { label: '3/4 View',        emoji: '↗️', angle: 'three_quarter' },
                { label: 'Expression Sheet', emoji: '😤', angle: 'expressions' },
                { label: 'Pose Library',    emoji: '🤸', angle: 'poses' },
              ].map(({ label, emoji, angle }) => (
                <TouchableOpacity
                  key={angle}
                  style={[styles.turnaroundCard, { borderColor: C.border }]}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                    router.push({
                      pathname: '/(tabs)/character-genesis' as never,
                      params: {
                        prefillName: selected.name,
                        prefillArchetype: selected.archetype,
                        prefillSpecies: selected.species,
                        prefillStyle: selected.artStyle,
                        prefillAngle: angle,
                      },
                    });
                  }}
                  activeOpacity={0.8}
                >
                  <Text style={styles.turnaroundEmoji}>{emoji}</Text>
                  <Text style={styles.turnaroundLabel}>{label}</Text>
                  <Feather name="external-link" size={10} color={C.muted} />
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Consistency Report (True Engine) */}
          {selected.lockedReference && (
            <View style={styles.block}>
              <Text style={styles.blockLabel}>TRUE CONSISTENCY REPORT</Text>
              {(() => {
                const rep = ConsistencyEngine.validate(selected.lockedReference, selected);
                const scoreColor = (n: number) => n >= 85 ? C.green : n >= 60 ? C.yellow : C.red;
                return (
                  <>
                    <View style={styles.scoreRow}>
                      <View style={[styles.scoreBadge, { borderColor: scoreColor(rep.faceScore) }]}>
                        <Text style={[styles.scoreVal, { color: scoreColor(rep.faceScore) }]}>{rep.faceScore}</Text>
                        <Text style={styles.scoreLabel}>FACE</Text>
                      </View>
                      <View style={[styles.scoreBadge, { borderColor: scoreColor(rep.bodyScore) }]}>
                        <Text style={[styles.scoreVal, { color: scoreColor(rep.bodyScore) }]}>{rep.bodyScore}</Text>
                        <Text style={styles.scoreLabel}>BODY</Text>
                      </View>
                      <View style={[styles.scoreBadge, { borderColor: scoreColor(rep.costumeScore) }]}>
                        <Text style={[styles.scoreVal, { color: scoreColor(rep.costumeScore) }]}>{rep.costumeScore}</Text>
                        <Text style={styles.scoreLabel}>COSTUME</Text>
                      </View>
                      <View style={[styles.scoreBadge, { borderColor: scoreColor(rep.silhouetteScore) }]}>
                        <Text style={[styles.scoreVal, { color: scoreColor(rep.silhouetteScore) }]}>{rep.silhouetteScore}</Text>
                        <Text style={styles.scoreLabel}>SILHOUETTE</Text>
                      </View>
                    </View>
                    <View style={[styles.avgScore, { borderColor: scoreColor(rep.averageScore) }]}>
                      <Text style={[styles.avgScoreNum, { color: scoreColor(rep.averageScore) }]}>{rep.averageScore}</Text>
                      <Text style={styles.avgScoreLabel}>AVERAGE</Text>
                      <Text style={[styles.avgScoreStatus, { color: rep.passed ? C.green : C.red }]}>{rep.passed ? 'PASS' : 'FAIL'}</Text>
                    </View>
                    {rep.warnings.length > 0 && (
                      <View style={{ marginTop: 10 }}>
                        {rep.warnings.map((w, i) => (
                          <View key={i} style={styles.warnRow}>
                            <Feather name="alert-triangle" size={11} color={C.red} style={{ marginRight: 6 }} />
                            <Text style={styles.warnText}>{w}</Text>
                          </View>
                        ))}
                      </View>
                    )}
                  </>
                );
              })()}
            </View>
          )}

          {/* Consistency Lock System */}
          <View style={styles.block}>
            <Text style={styles.blockLabel}>CONSISTENCY LOCK</Text>
            <Text style={styles.blockHint}>
              Locks all DNA properties so the AI generates this character identically every panel.
            </Text>
            <View style={styles.lockPillsRow}>
              {[
                'Face Embedding','Body Ratios','Costume Profile','Silhouette Hash','Color Palette',
              ].map((label) => (
                <LockPill key={label} label={label} locked={selected.consistencyLocked || isLocking} />
              ))}
            </View>

            {isLocking ? (
              <View style={styles.lockProgressBlock}>
                <Text style={styles.lockProgressLabel}>LOCKING DNA... {Math.round(lockProgress)}%</Text>
                <View style={styles.lockProgressTrack}>
                  <Animated.View
                    style={[
                      styles.lockProgressFill,
                      {
                        width: lockAnim.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }),
                        backgroundColor: C.yellow,
                      },
                    ]}
                  />
                </View>
              </View>
            ) : (
              <TouchableOpacity
                style={[
                  styles.lockBtn,
                  { backgroundColor: selected.consistencyLocked ? C.border : C.yellow },
                ]}
                onPress={selected.consistencyLocked ? () => updateSelected({ consistencyLocked: false }) : handleLock}
                activeOpacity={0.85}
              >
                <Feather
                  name={selected.consistencyLocked ? 'unlock' : 'lock'}
                  size={16}
                  color={selected.consistencyLocked ? C.muted : C.black}
                />
                <Text style={[styles.lockBtnText, { color: selected.consistencyLocked ? C.muted : C.black }]}>
                  {selected.consistencyLocked ? 'UNLOCK CHARACTER DNA' : 'APPLY CONSISTENCY LOCK'}
                </Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Reroll character */}
          <View style={styles.block}>
            <TouchableOpacity
              style={styles.rerollDnaBtn}
              onPress={() => {
                Alert.alert(
                  'Reroll DNA',
                  'Generate a completely new random DNA profile for this character? This keeps the name but randomises everything else.',
                  [
                    { text: 'Cancel', style: 'cancel' },
                    {
                      text: 'Reroll', onPress: () => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
                        const fresh = generateDNA();
                        updateSelected({
                          ...fresh,
                          id: selected.id,
                          name: selected.name,
                          createdAt: selected.createdAt,
                          consistencyLocked: false,
                        });
                      },
                    },
                  ],
                );
              }}
              activeOpacity={0.8}
            >
              <Feather name="refresh-cw" size={16} color={C.red} />
              <Text style={styles.rerollDnaBtnText}>REROLL CHARACTER DNA</Text>
            </TouchableOpacity>
          </View>

          <View style={{ height: insets.bottom + 32 }} />
        </ScrollView>
      ) : null}

      {/* ── Rename modal ──────────────────────────────────────────────────────── */}
      <Modal visible={renameModalVisible} transparent animationType="fade">
        <Pressable style={styles.modalOverlay} onPress={() => setRenameModalVisible(false)}>
          <Pressable style={styles.modalCard} onPress={(e) => e.stopPropagation()}>
            <Text style={styles.modalTitle}>RENAME CHARACTER</Text>
            <TextInput
              style={styles.modalInput}
              value={renameValue}
              onChangeText={setRenameValue}
              placeholder="Character name…"
              placeholderTextColor={C.muted}
              autoFocus
              maxLength={50}
            />
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.modalCancel} onPress={() => setRenameModalVisible(false)} activeOpacity={0.8}>
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalConfirm} onPress={confirmRename} activeOpacity={0.8}>
                <Text style={styles.modalConfirmText}>Save</Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root:          { flex: 1, backgroundColor: C.black },
  // Header
  header:        { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingBottom: 12, paddingTop: 10, borderBottomWidth: 1, borderBottomColor: C.border, gap: 12 },
  headerCenter:  { flex: 1 },
  headerTitle:   { fontSize: 14, fontFamily: 'Inter_700Bold', color: C.yellow, letterSpacing: 1.5 },
  headerSub:     { fontSize: 10, fontFamily: 'Inter_400Regular', color: C.muted, marginTop: 1 },
  generateBtn:   { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: C.yellow, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20 },
  generateBtnText: { fontSize: 11, fontFamily: 'Inter_700Bold', color: C.black, letterSpacing: 0.8 },
  // Strip
  stripWrapper:  { borderBottomWidth: 1, borderBottomColor: C.border },
  strip:         { paddingHorizontal: 12, paddingVertical: 10, gap: 8, flexDirection: 'row', alignItems: 'center' },
  addCard:       { alignItems: 'center', justifyContent: 'center', gap: 2, paddingHorizontal: 12, paddingVertical: 10, borderRadius: 12, borderWidth: 1.5, borderColor: C.yellow, borderStyle: 'dashed' },
  addCardText:   { fontSize: 10, fontFamily: 'Inter_700Bold', color: C.yellow },
  charChip:      { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12, borderWidth: 1.5, maxWidth: 160 },
  chipColorDot:  { width: 10, height: 10, borderRadius: 5 },
  chipName:      { fontSize: 12, fontFamily: 'Inter_700Bold', maxWidth: 100 },
  chipArch:      { fontSize: 9, fontFamily: 'Inter_400Regular', color: C.muted, maxWidth: 100 },
  // Empty
  empty:         { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40, gap: 12 },
  emptyIcon:     { fontSize: 56 },
  emptyTitle:    { fontSize: 18, fontFamily: 'Inter_700Bold', color: C.yellow, letterSpacing: 2 },
  emptyDesc:     { fontSize: 14, fontFamily: 'Inter_400Regular', color: C.muted, textAlign: 'center', lineHeight: 20 },
  emptyBtn:      { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: C.yellow, paddingHorizontal: 24, paddingVertical: 14, borderRadius: 30, marginTop: 8 },
  emptyBtnText:  { fontSize: 13, fontFamily: 'Inter_700Bold', color: C.black, letterSpacing: 1 },
  // Profile scroll
  scroll:        { padding: 16, gap: 0 },
  block:         { marginBottom: 16, backgroundColor: C.panel, borderRadius: 14, padding: 16, borderWidth: 1, borderColor: C.border },
  blockLabel:    { fontSize: 11, fontFamily: 'Inter_700Bold', color: C.muted, letterSpacing: 1.5, marginBottom: 10 },
  blockLabelRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
  blockHint:     { fontSize: 11, fontFamily: 'Inter_400Regular', color: C.muted, marginBottom: 12, lineHeight: 15 },
  // Name banner
  nameBanner:    { backgroundColor: C.panel, borderRadius: 14, padding: 16, borderWidth: 1.5, flexDirection: 'row', alignItems: 'flex-start', marginBottom: 16, gap: 12 },
  charName:      { fontSize: 22, fontFamily: 'Inter_700Bold', letterSpacing: 0.5, marginBottom: 6 },
  badgeRow:      { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  badge:         { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20, borderWidth: 1 },
  badgeText:     { fontSize: 10, fontFamily: 'Inter_600SemiBold' },
  editNameBtn:   { padding: 4 },
  // Color
  colorRow:      { flexDirection: 'row', alignItems: 'center', gap: 16 },
  colorSwatch:   { alignItems: 'center', gap: 4 },
  colorCircle:   { width: 44, height: 44, borderRadius: 22, borderWidth: 2, borderColor: C.border },
  colorLabel:    { fontSize: 10, fontFamily: 'Inter_600SemiBold', color: C.muted },
  colorHex:      { fontSize: 10, fontFamily: 'Inter_400Regular', color: C.ink },
  rerollColorBtn:{ flexDirection: 'row', alignItems: 'center', gap: 6, marginLeft: 'auto' as any, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: C.yellow },
  rerollText:    { fontSize: 11, fontFamily: 'Inter_600SemiBold', color: C.yellow },
  // Profile grid
  profileGrid:   { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
  profileChip:   { width: '48%' as any, backgroundColor: C.black, borderRadius: 10, padding: 12, borderWidth: 1, borderColor: C.border, gap: 2 },
  profileChipLabel: { fontSize: 9, fontFamily: 'Inter_600SemiBold', color: C.muted, letterSpacing: 1 },
  profileChipValue: { fontSize: 13, fontFamily: 'Inter_700Bold' },
  toggleRow:     { flexDirection: 'row', gap: 12 },
  toggleItem:    { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: C.black, borderRadius: 10, padding: 10, borderWidth: 1, borderColor: C.border },
  toggleLabel:   { fontSize: 12, fontFamily: 'Inter_600SemiBold', color: C.ink },
  // Lock strength
  lockPct:       { fontSize: 16, fontFamily: 'Inter_700Bold' },
  lockTrack:     { height: 8, borderRadius: 4, backgroundColor: C.border, overflow: 'hidden', marginBottom: 10 },
  lockFill:      { height: 8, borderRadius: 4 },
  lockStepRow:   { flexDirection: 'row', gap: 6 },
  lockStep:      { flex: 1, paddingVertical: 7, borderRadius: 8, borderWidth: 1, alignItems: 'center' },
  lockStepText:  { fontSize: 10, fontFamily: 'Inter_700Bold' },
  // Turnaround
  turnaroundGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  turnaroundCard: { width: '30.5%' as any, backgroundColor: C.black, borderRadius: 10, padding: 12, borderWidth: 1, alignItems: 'center', gap: 4 },
  turnaroundEmoji: { fontSize: 20 },
  turnaroundLabel: { fontSize: 9, fontFamily: 'Inter_600SemiBold', color: C.ink, textAlign: 'center' },
  // Consistency lock
  lockPillsRow:  { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 14 },
  lockProgressBlock: { gap: 8 },
  lockProgressLabel: { fontSize: 12, fontFamily: 'Inter_700Bold', color: C.yellow, letterSpacing: 1 },
  lockProgressTrack: { height: 8, borderRadius: 4, backgroundColor: C.border, overflow: 'hidden' },
  lockProgressFill:  { height: 8, borderRadius: 4 },
  lockBtn:       { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14, borderRadius: 12 },
  lockBtnText:   { fontSize: 14, fontFamily: 'Inter_700Bold', letterSpacing: 1 },
  // Reroll DNA
  rerollDnaBtn:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14, borderRadius: 12, borderWidth: 1, borderColor: C.red },
  rerollDnaBtnText: { fontSize: 13, fontFamily: 'Inter_700Bold', color: C.red, letterSpacing: 0.8 },
  // Modal
  modalOverlay:  { flex: 1, backgroundColor: '#00000088', justifyContent: 'center', alignItems: 'center', padding: 24 },
  modalCard:     { width: '100%', backgroundColor: C.panel, borderRadius: 16, borderWidth: 1, borderColor: C.border, padding: 20, gap: 16 },
  modalTitle:    { fontSize: 14, fontFamily: 'Inter_700Bold', color: C.yellow, letterSpacing: 1.5 },
  modalInput:    { borderWidth: 1, borderColor: C.border, borderRadius: 10, padding: 12, fontSize: 16, fontFamily: 'Inter_400Regular', color: C.ink, backgroundColor: C.black },
  // Consistency Report (True Engine)
  scoreRow:      { flexDirection: 'row', gap: 6, marginBottom: 10 },
  scoreBadge:    { flex: 1, alignItems: 'center', padding: 8, borderRadius: 10, borderWidth: 1.5, backgroundColor: C.black },
  scoreVal:      { fontSize: 22, fontFamily: 'Inter_700Bold' },
  scoreLabel:    { fontSize: 8, fontFamily: 'Inter_600SemiBold', color: C.muted, letterSpacing: 1, marginTop: 2 },
  avgScore:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 12, borderRadius: 10, borderWidth: 1.5, backgroundColor: C.black, marginBottom: 4 },
  avgScoreNum:   { fontSize: 28, fontFamily: 'Inter_700Bold' },
  avgScoreLabel: { fontSize: 10, fontFamily: 'Inter_600SemiBold', color: C.muted, letterSpacing: 1 },
  avgScoreStatus:{ fontSize: 12, fontFamily: 'Inter_700Bold', letterSpacing: 1 },
  warnRow:       { flexDirection: 'row', alignItems: 'center', paddingVertical: 4 },
  warnText:      { fontSize: 11, fontFamily: 'Inter_400Regular', color: C.red },
  // Modal
  modalActions:  { flexDirection: 'row', gap: 10 },
  modalCancel:   { flex: 1, paddingVertical: 12, borderRadius: 10, borderWidth: 1, borderColor: C.border, alignItems: 'center' },
  modalCancelText: { fontSize: 14, fontFamily: 'Inter_600SemiBold', color: C.muted },
  modalConfirm:  { flex: 1, paddingVertical: 12, borderRadius: 10, backgroundColor: C.yellow, alignItems: 'center' },
  modalConfirmText: { fontSize: 14, fontFamily: 'Inter_700Bold', color: C.black },
});
