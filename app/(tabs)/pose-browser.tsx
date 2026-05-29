import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  FlatList,
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { LinearGradient } from 'expo-linear-gradient';
import { POSE_LIBRARY, POSE_CATEGORIES, CAT_COLORS, type ComicPose, type PoseCategory } from '@/lib/poseLibrary';

// ── API base ──────────────────────────────────────────────────────────────────
const API_BASE = '/api';

// ── Image cache — persists across card renders in the session ─────────────────
const IMAGE_CACHE: Record<string, string> = {};

// ── COMIC Palette ──────────────────────────────────────────────────────────────
const C = {
  bg:     '#0E0C0A',
  card:   '#181410',
  card2:  '#1E1812',
  border: '#2E2618',
  yellow: '#FFD600',
  red:    '#E8001C',
  blue:   '#0057A8',
  green:  '#2A7A3A',
  ink:    '#F0EAD8',
  muted:  '#7A6A58',
};

// ── Helper: intensity color ──────────────────────────────────────────────────
const intensityColor = (n: number) => {
  if (n >= 9) return C.red;
  if (n >= 7) return '#FF6B00';
  if (n >= 5) return C.yellow;
  if (n >= 3) return C.blue;
  return C.green;
};

// ── AI Pose Thumbnail ─────────────────────────────────────────────────────────
function PoseThumbnail({ pose }: { pose: ComicPose }) {
  const catColor = CAT_COLORS[pose.category];
  const [imageUri, setImageUri] = useState<string | null>(IMAGE_CACHE[pose.id] ?? null);
  const [loading, setLoading]   = useState(false);
  const [failed,  setFailed]    = useState(false);
  const spinAnim = useRef(new Animated.Value(0)).current;

  const startSpin = useCallback(() => {
    Animated.loop(
      Animated.timing(spinAnim, { toValue: 1, duration: 1800, useNativeDriver: true })
    ).start();
  }, [spinAnim]);

  const spin = spinAnim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });

  useEffect(() => {
    if (imageUri || loading || failed) return;
    setLoading(true);
    startSpin();

    fetch(`${API_BASE}/pose/generate-image`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        poseId: pose.id,
        name: pose.name,
        description: pose.description,
        silhouette: pose.silhouette,
        motionFlow: pose.motionFlow,
        emotionalPurpose: pose.emotionalPurpose,
      }),
    })
      .then(r => r.json())
      .then((data: { b64_json?: string; error?: string }) => {
        if (data.b64_json) {
          const uri = `data:image/png;base64,${data.b64_json}`;
          IMAGE_CACHE[pose.id] = uri;
          setImageUri(uri);
        } else {
          setFailed(true);
        }
      })
      .catch(() => setFailed(true))
      .finally(() => setLoading(false));
  }, [pose.id]);

  if (imageUri) {
    return (
      <View style={styles.thumbBox}>
        <Image
          source={{ uri: imageUri }}
          style={{ width: '100%', height: '100%', borderRadius: 10 }}
          resizeMode="cover"
        />
        <View style={[styles.catDot, { backgroundColor: catColor }]} />
        {pose.groupPose && (
          <View style={styles.groupBadge}>
            <Feather name="users" size={9} color={C.bg} />
          </View>
        )}
      </View>
    );
  }

  return (
    <View style={[styles.thumbBox, { backgroundColor: C.card2, borderColor: C.border }]}>
      {loading ? (
        <>
          <Animated.View style={{ transform: [{ rotate: spin }] }}>
            <Feather name="aperture" size={22} color={catColor} />
          </Animated.View>
          <Text style={[styles.thumbGenLabel, { color: catColor }]}>Generating...</Text>
        </>
      ) : failed ? (
        <>
          <Feather name="alert-circle" size={20} color={C.muted} />
          <Text style={[styles.thumbGenLabel, { color: C.muted }]}>Tap to retry</Text>
        </>
      ) : (
        <Text style={[styles.thumbInitial, { color: catColor }]}>{pose.name.charAt(0)}</Text>
      )}
      <View style={[styles.catDot, { backgroundColor: catColor }]} />
      {pose.groupPose && (
        <View style={styles.groupBadge}>
          <Feather name="users" size={9} color={C.bg} />
        </View>
      )}
    </View>
  );
}

// ── Pose Thumbnail Card ────────────────────────────────────────────────────────
function PoseCard({ pose, onPress, isLast }: { pose: ComicPose; onPress: () => void; isLast?: boolean }) {
  return (
    <TouchableOpacity
      onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); onPress(); }}
      style={[styles.poseCard, { borderColor: C.border, backgroundColor: C.card }, isLast && { marginRight: 16 }]}
      activeOpacity={0.85}
    >
      <PoseThumbnail pose={pose} />

      <Text style={[styles.poseName, { color: C.ink }]} numberOfLines={1}>{pose.name}</Text>
      <Text style={[styles.poseEmo, { color: C.muted }]} numberOfLines={1}>{pose.emotionalPurpose}</Text>

      {/* Intensity bar */}
      <View style={styles.intensityRow}>
        <View style={[styles.intensityTrack, { backgroundColor: C.border }]}>
          <View style={[styles.intensityFill, { width: `${pose.intensity * 10}%`, backgroundColor: intensityColor(pose.intensity) }]} />
        </View>
        <Text style={[styles.intensityNum, { color: intensityColor(pose.intensity) }]}>{pose.intensity}</Text>
      </View>
    </TouchableOpacity>
  );
}

// ── Pose Detail Modal ────────────────────────────────────────────────────────
function PoseDetailModal({ pose, visible, onClose }: { pose: ComicPose | null; visible: boolean; onClose: () => void }) {
  if (!pose) return null;
  const catColor = CAT_COLORS[pose.category];
  const cachedImage = IMAGE_CACHE[pose.id] ?? null;
  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <Pressable style={styles.modalOverlay} onPress={onClose}>
        <View style={[styles.modalCard, { backgroundColor: C.bg, borderColor: C.border }]}>
          <View style={[styles.modalHeaderBar, { backgroundColor: catColor }]} />
          <View style={styles.modalHeader}>
            <View>
              <Text style={[styles.modalName, { color: C.ink }]}>{pose.name}</Text>
              <View style={styles.modalMetaRow}>
                <View style={[styles.catPill, { backgroundColor: catColor + '22', borderColor: catColor + '55' }]}>
                  <Text style={[styles.catPillText, { color: catColor }]}>{pose.category}</Text>
                </View>
                {pose.groupPose && (
                  <View style={[styles.catPill, { backgroundColor: C.blue + '22', borderColor: C.blue + '55' }]}>
                    <Text style={[styles.catPillText, { color: C.blue }]}>Group</Text>
                  </View>
                )}
              </View>
            </View>
            <TouchableOpacity onPress={onClose} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Feather name="x" size={22} color={C.muted} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 20 }}>
            {/* Large AI image at top of modal */}
            {cachedImage && (
              <Image
                source={{ uri: cachedImage }}
                style={styles.modalImage}
                resizeMode="cover"
              />
            )}
            {/* AI Metadata */}
            <View style={[styles.metaBlock, { borderColor: C.border }]}>
              <Text style={[styles.metaLabel, { color: C.muted }]}>AI GENERATION DIRECTIVE</Text>
              <Text style={[styles.metaValue, { color: C.ink }]}>{pose.description}</Text>
            </View>

            <View style={styles.metaGrid}>
              <View style={[styles.metaCell, { borderColor: C.border }]}>
                <Text style={[styles.metaLabel, { color: C.muted }]}>SILHOUETTE</Text>
                <Text style={[styles.metaValue, { color: C.yellow }]}>{pose.silhouette}</Text>
              </View>
              <View style={[styles.metaCell, { borderColor: C.border }]}>
                <Text style={[styles.metaLabel, { color: C.muted }]}>MOTION FLOW</Text>
                <Text style={[styles.metaValue, { color: C.yellow }]}>{pose.motionFlow}</Text>
              </View>
              <View style={[styles.metaCell, { borderColor: C.border }]}>
                <Text style={[styles.metaLabel, { color: C.muted }]}>EMOTION</Text>
                <Text style={[styles.metaValue, { color: C.ink }]}>{pose.emotionalPurpose}</Text>
              </View>
              <View style={[styles.metaCell, { borderColor: C.border }]}>
                <Text style={[styles.metaLabel, { color: C.muted }]}>INTENSITY</Text>
                <Text style={[styles.metaValue, { color: intensityColor(pose.intensity) }]}>{pose.intensity}/10</Text>
              </View>
            </View>

            {/* Prompt builder */}
            <View style={[styles.metaBlock, { borderColor: C.border, marginTop: 12 }]}>
              <Text style={[styles.metaLabel, { color: C.muted }]}>SUGGESTED PROMPT SNIPPET</Text>
              <Text style={[styles.promptSnippet, { color: C.ink }]}>
                {pose.name} pose, {pose.description.toLowerCase()}, silhouette: {pose.silhouette.toLowerCase()}, motion: {pose.motionFlow.toLowerCase()}, intensity {pose.intensity}/10, comic book style, clean lines, professional sequential art.
              </Text>
            </View>
          </ScrollView>
        </View>
      </Pressable>
    </Modal>
  );
}

// ── Main Screen ──────────────────────────────────────────────────────────────
// ── PoseArchetypeReferenceSystem data ─────────────────────────────────────────

const REF_ENUMS: { name: string; color: string; values: string[] }[] = [
  { name: 'PoseCategory', color: '#0057A8', values: [
    'HEROIC','IDLE','DIALOGUE','EMOTIONAL','COMBAT','CINEMATIC',
    'TEAM','PERSPECTIVE','SILHOUETTE','HANDS','FACIAL_ACTING',
    'FORESHORTENING','SEQUENTIAL_FLOW','COVER_ART','CREATURE',
    'MECH','MOTION_REFERENCE','PANEL_FLOW',
  ]},
  { name: 'EmotionType', color: '#8B3FBE', values: [
    'CONFIDENCE','FEAR','RAGE','GRIEF','EXHAUSTION','TRIUMPH',
    'SHOCK','PANIC','DETERMINATION','SADNESS','INTIMIDATION',
    'RELAXED','HOPE','TENSION','NEUTRAL',
  ]},
  { name: 'CameraShot', color: '#E8001C', values: [
    'CLOSE_UP','MEDIUM_SHOT','FULL_BODY','LOW_ANGLE','HIGH_ANGLE',
    'DUTCH_ANGLE','OVER_SHOULDER','EXTREME_CLOSEUP','WIDE_SHOT',
    'BIRD_EYE','WORM_EYE','CINEMATIC_FRAME',
  ]},
  { name: 'MotionPhase', color: '#FF6A00', values: [
    'ANTICIPATION','WINDUP','IMPACT','FOLLOW_THROUGH','RECOVERY','TRANSITION','IDLE',
  ]},
  { name: 'SilhouetteType', color: '#2A7A3A', values: [
    'TRIANGLE','WIDE','CLOSED','OPEN','STEALTH','HEROIC','VILLAIN','DYNAMIC','EMOTIONAL',
  ]},
];

const POSE_ARCHETYPE_FIELDS: { type: string; name: string; desc: string }[] = [
  { type: 'String',        name: 'id',                    desc: 'Unique identifier e.g. hero_stand' },
  { type: 'String',        name: 'name',                  desc: 'Display name of the pose' },
  { type: 'PoseCategory',  name: 'category',              desc: 'Pose category enum (18 types)' },
  { type: 'EmotionType',   name: 'emotion',               desc: 'Emotional tone (15 emotions)' },
  { type: 'CameraShot',    name: 'cameraShot',            desc: 'Ideal camera framing (12 shots)' },
  { type: 'MotionPhase',   name: 'motionPhase',           desc: 'Phase in action cycle (7 phases)' },
  { type: 'SilhouetteType',name: 'silhouette',            desc: 'Silhouette shape (9 types)' },
  { type: 'String',        name: 'actingIntent',          desc: 'Narrative purpose of the pose' },
  { type: 'String',        name: 'bodyLanguage',          desc: 'Physical body positioning description' },
  { type: 'String',        name: 'motionDirection',       desc: 'Direction of movement / energy' },
  { type: 'String',        name: 'marvelReference',       desc: 'Archetypal action-comics body language ref' },
  { type: 'String',        name: 'dcReference',           desc: 'Archetypal heroic-comics body language ref' },
  { type: 'boolean',       name: 'combatReady',           desc: 'Suitable for fight / action panels' },
  { type: 'boolean',       name: 'dialogueFriendly',      desc: 'Works with speech bubble placement' },
  { type: 'boolean',       name: 'continuityLock',        desc: 'Locks pose across multi-panel sequences' },
  { type: 'boolean',       name: 'capePhysics',           desc: 'Requires cape / cloth simulation' },
  { type: 'boolean',       name: 'cinematic',             desc: 'Designed for cinematic composition' },
  { type: 'float',         name: 'energyLevel',           desc: '0.0 calm → 10.0 explosive' },
  { type: 'float',         name: 'balanceShift',          desc: '-1.0 left → +1.0 right weight' },
  { type: 'List<String>',  name: 'keywords',              desc: 'AI prompt tags: dynamic, cape-flow…' },
  { type: 'List<String>',  name: 'compatibleTransitions', desc: 'Pose IDs that flow from this one' },
  { type: 'String',        name: 'previewImagePath',      desc: 'Path to pose reference image' },
  { type: 'String',        name: 'skeletalReferencePath', desc: 'Path to wireframe / skeleton ref' },
];

const LOCK_PROFILE_FIELDS: { type: string; name: string; desc: string }[] = [
  { type: 'String',  name: 'characterName',         desc: 'Character identifier for lock' },
  { type: 'float',   name: 'headScale',             desc: 'Head size ratio relative to body' },
  { type: 'float',   name: 'shoulderWidth',         desc: 'Shoulder width proportion' },
  { type: 'float',   name: 'armLength',             desc: 'Arm length proportion' },
  { type: 'float',   name: 'legLength',             desc: 'Leg length proportion' },
  { type: 'float',   name: 'torsoLength',           desc: 'Torso length proportion' },
  { type: 'float',   name: 'capeLength',            desc: 'Cape / cloth appendage length' },
  { type: 'float',   name: 'bodyMass',              desc: 'Overall mass / bulk factor' },
  { type: 'String',  name: 'costumeReference',      desc: 'Costume asset path or description' },
  { type: 'String',  name: 'faceReference',         desc: 'Face reference image path' },
  { type: 'String',  name: 'hairReference',         desc: 'Hair style reference path' },
  { type: 'boolean', name: 'maintainProportions',   desc: 'Lock body proportions across panels' },
  { type: 'boolean', name: 'maintainCostume',       desc: 'Lock costume consistency' },
  { type: 'boolean', name: 'maintainFaceStructure', desc: 'Lock facial structure' },
  { type: 'boolean', name: 'maintainHair',          desc: 'Lock hair style' },
];

const PANEL_FLOW_FIELDS: { type: string; name: string; desc: string }[] = [
  { type: 'String',  name: 'flowDirection',       desc: 'Reading direction for this panel' },
  { type: 'boolean', name: 'zPattern',            desc: 'Part of Z-pattern eye flow' },
  { type: 'boolean', name: 'cinematicFocus',      desc: 'Cinematic lens composition applied' },
  { type: 'boolean', name: 'speechBubbleSafe',    desc: 'Clear space reserved for bubbles' },
  { type: 'float',   name: 'eyeMovementStrength', desc: '0.0 – 1.0 gaze pull strength' },
  { type: 'float',   name: 'actionMomentum',      desc: '0.0 – 1.0 forward motion energy' },
];

const SAMPLE_POSES: { id: string; name: string; cat: string; emotion: string; camera: string; phase: string; intent: string }[] = [
  { id: 'hero_stand',          name: 'Standing Tall',        cat: 'HEROIC',          emotion: 'CONFIDENCE',   camera: 'LOW_ANGLE',        phase: 'IDLE',         intent: 'Leadership and confidence' },
  { id: 'rooftop_silhouette',  name: 'Rooftop Silhouette',   cat: 'HEROIC',          emotion: 'INTIMIDATION', camera: 'WIDE_SHOT',        phase: 'IDLE',         intent: 'Watching over city' },
  { id: 'power_stance',        name: 'Power Stance',         cat: 'HEROIC',          emotion: 'TRIUMPH',      camera: 'LOW_ANGLE',        phase: 'IDLE',         intent: 'Victory and dominance' },
  { id: 'casual_lean',         name: 'Casual Lean',          cat: 'IDLE',            emotion: 'RELAXED',      camera: 'MEDIUM_SHOT',      phase: 'IDLE',         intent: 'Relaxed conversation' },
  { id: 'hands_pockets',       name: 'Hands In Pockets',     cat: 'IDLE',            emotion: 'NEUTRAL',      camera: 'FULL_BODY',        phase: 'IDLE',         intent: 'Relaxed attitude' },
  { id: 'explaining_pose',     name: 'Explaining',           cat: 'DIALOGUE',        emotion: 'DETERMINATION',camera: 'MEDIUM_SHOT',      phase: 'IDLE',         intent: 'Teaching or explaining' },
  { id: 'interrogation_pose',  name: 'Interrogation',        cat: 'DIALOGUE',        emotion: 'INTIMIDATION', camera: 'OVER_SHOULDER',    phase: 'IDLE',         intent: 'Pressure and dominance' },
  { id: 'grief_pose',          name: 'Grief',                cat: 'EMOTIONAL',       emotion: 'GRIEF',        camera: 'CLOSE_UP',         phase: 'RECOVERY',     intent: 'Loss and sadness' },
  { id: 'rage_pose',           name: 'Rage',                 cat: 'EMOTIONAL',       emotion: 'RAGE',         camera: 'LOW_ANGLE',        phase: 'IMPACT',       intent: 'Uncontrolled fury' },
  { id: 'punch_impact',        name: 'Punch Impact',         cat: 'COMBAT',          emotion: 'RAGE',         camera: 'DUTCH_ANGLE',      phase: 'IMPACT',       intent: 'Aggressive attack' },
  { id: 'landing_pose',        name: 'Hero Landing',         cat: 'COMBAT',          emotion: 'CONFIDENCE',   camera: 'LOW_ANGLE',        phase: 'RECOVERY',     intent: 'Powerful arrival' },
  { id: 'dodge_pose',          name: 'Combat Dodge',         cat: 'COMBAT',          emotion: 'FEAR',         camera: 'FULL_BODY',        phase: 'TRANSITION',   intent: 'Fast evasion' },
  { id: 'explosion_walk',      name: 'Explosion Walk',       cat: 'CINEMATIC',       emotion: 'CONFIDENCE',   camera: 'WIDE_SHOT',        phase: 'TRANSITION',   intent: 'Unstoppable confidence' },
  { id: 'doorway_frame',       name: 'Doorway Frame',        cat: 'CINEMATIC',       emotion: 'TENSION',      camera: 'CINEMATIC_FRAME',  phase: 'IDLE',         intent: 'Mysterious entrance' },
  { id: 'triangle_formation',  name: 'Triangle Formation',   cat: 'TEAM',            emotion: 'DETERMINATION',camera: 'WIDE_SHOT',        phase: 'IDLE',         intent: 'Team leadership' },
  { id: 'foreshortened_punch', name: 'Foreshortened Punch',  cat: 'PERSPECTIVE',     emotion: 'RAGE',         camera: 'WORM_EYE',         phase: 'IMPACT',       intent: 'Dynamic perspective' },
  { id: 'villain_outline',     name: 'Villain Outline',      cat: 'SILHOUETTE',      emotion: 'INTIMIDATION', camera: 'WIDE_SHOT',        phase: 'IDLE',         intent: 'Fear and dominance' },
  { id: 'open_palm',           name: 'Open Palm',            cat: 'HANDS',           emotion: 'HOPE',         camera: 'CLOSE_UP',         phase: 'IDLE',         intent: 'Peaceful interaction' },
  { id: 'silent_stare',        name: 'Silent Stare',         cat: 'FACIAL_ACTING',   emotion: 'TENSION',      camera: 'EXTREME_CLOSEUP',  phase: 'IDLE',         intent: 'Internal conflict' },
  { id: 'jump_toward_camera',  name: 'Jump Toward Camera',   cat: 'FORESHORTENING',  emotion: 'TRIUMPH',      camera: 'WORM_EYE',         phase: 'TRANSITION',   intent: 'Aggressive forward motion' },
  { id: 'run_cycle',           name: 'Run Cycle',            cat: 'SEQUENTIAL_FLOW', emotion: 'DETERMINATION',camera: 'FULL_BODY',        phase: 'TRANSITION',   intent: 'Forward momentum' },
  { id: 'hero_vs_villain',     name: 'Hero Vs Villain',      cat: 'COVER_ART',       emotion: 'TENSION',      camera: 'WIDE_SHOT',        phase: 'IDLE',         intent: 'Conflict setup' },
  { id: 'monster_roar',        name: 'Monster Roar',         cat: 'CREATURE',        emotion: 'RAGE',         camera: 'LOW_ANGLE',        phase: 'IMPACT',       intent: 'Creature intimidation' },
  { id: 'mech_landing',        name: 'Mechanical Landing',   cat: 'MECH',            emotion: 'CONFIDENCE',   camera: 'LOW_ANGLE',        phase: 'RECOVERY',     intent: 'Heavy impact' },
  { id: 'cape_physics',        name: 'Cape Physics',         cat: 'MOTION_REFERENCE',emotion: 'NEUTRAL',      camera: 'WIDE_SHOT',        phase: 'TRANSITION',   intent: 'Environmental motion' },
];

const FIELD_TYPE_COLORS: Record<string, string> = {
  'String': '#0057A8', 'float': '#FFD600', 'boolean': '#2A7A3A',
  'List<String>': '#8B3FBE', 'PoseCategory': '#0057A8', 'EmotionType': '#8B3FBE',
  'CameraShot': '#E8001C', 'MotionPhase': '#FF6A00', 'SilhouetteType': '#2A7A3A',
};

// ── Reference sub-components ──────────────────────────────────────────────────
function FieldRow({ f, last }: { f: { type: string; name: string; desc: string }; last: boolean }) {
  const tc = FIELD_TYPE_COLORS[f.type] ?? '#F0EAD8';
  return (
    <View style={{ flexDirection: 'row', alignItems: 'flex-start', paddingVertical: 6, borderBottomWidth: last ? 0 : 1, borderBottomColor: '#2E2618' }}>
      <View style={{ width: 160, flexDirection: 'row', alignItems: 'center', gap: 5, flexShrink: 0 }}>
        <View style={{ backgroundColor: tc + '20', borderRadius: 4, paddingHorizontal: 4, paddingVertical: 2 }}>
          <Text style={{ color: tc, fontSize: 8.5, fontFamily: 'Inter_700Bold' }}>{f.type}</Text>
        </View>
        <Text style={{ color: '#F0EAD8', fontSize: 10, fontFamily: 'Inter_600SemiBold' }}>{f.name}</Text>
      </View>
      <Text style={{ color: '#7A6A58', fontSize: 9.5, fontFamily: 'Inter_400Regular', flex: 1, lineHeight: 14 }}>
        {'// '}{f.desc}
      </Text>
    </View>
  );
}

function SectionHeader({ title, count, color }: { title: string; count?: string; color: string }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10, gap: 8 }}>
      <View style={{ width: 3, height: 14, backgroundColor: color, borderRadius: 2 }} />
      <Text style={{ color, fontSize: 10.5, fontFamily: 'Inter_700Bold', letterSpacing: 0.8, flex: 1 }}>{title}</Text>
      {count && <Text style={{ color: '#7A6A58', fontSize: 9, fontFamily: 'Inter_400Regular' }}>{count}</Text>}
    </View>
  );
}

function PoseArchetypeReference() {
  const [expanded, setExpanded] = React.useState(false);
  type Tab = 'enums' | 'fields' | 'poses' | 'ai';
  const [tab, setTab] = React.useState<Tab>('enums');

  const TABS: { id: Tab; label: string; color: string }[] = [
    { id: 'enums',  label: 'ENUMS',   color: '#0057A8' },
    { id: 'fields', label: 'CLASSES', color: '#FFD600' },
    { id: 'poses',  label: 'POSES',   color: '#E8001C' },
    { id: 'ai',     label: 'AI DIR',  color: '#8B3FBE' },
  ];

  return (
    <View style={{ marginTop: 24, marginBottom: 8, borderTopWidth: 1, borderTopColor: '#2E2618', paddingTop: 16 }}>

      {/* Collapse toggle */}
      <TouchableOpacity
        onPress={() => { Haptics.selectionAsync(); setExpanded(v => !v); }}
        activeOpacity={0.8}
        style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#181410', borderWidth: 1, borderColor: '#2E2618', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, marginBottom: 4 }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <View style={{ backgroundColor: '#0057A8' + '22', borderRadius: 6, padding: 5 }}>
            <Feather name="code" size={13} color="#0057A8" />
          </View>
          <View>
            <Text style={{ color: '#F0EAD8', fontSize: 12, fontFamily: 'Inter_700Bold', letterSpacing: 0.5 }}>
              PoseArchetypeReferenceSystem
            </Text>
            <Text style={{ color: '#7A6A58', fontSize: 9.5, fontFamily: 'Inter_400Regular', marginTop: 1 }}>
              com.bloomscript.comicstudio.pose · {SAMPLE_POSES.length} poses · 5 enums · for reference only
            </Text>
          </View>
        </View>
        <Feather name={expanded ? 'chevron-up' : 'chevron-down'} size={14} color="#7A6A58" />
      </TouchableOpacity>

      {expanded && (
        <View style={{ backgroundColor: '#0E0C0A', borderWidth: 1, borderColor: '#2E2618', borderRadius: 12, padding: 14 }}>

          {/* Package header */}
          <Text style={{ color: '#7A6A58', fontSize: 9.5, fontFamily: 'Inter_400Regular', marginBottom: 3, fontStyle: 'italic' }}>
            {'package com.bloomscript.comicstudio.pose;'}
          </Text>
          <Text style={{ color: '#7A6A58', fontSize: 9.5, fontFamily: 'Inter_400Regular', marginBottom: 12, fontStyle: 'italic' }}>
            {'// Classic Comics Sequential Storytelling Engine · Comic Art Studio / BloomScript'}
          </Text>

          {/* Tab picker */}
          <View style={{ flexDirection: 'row', gap: 6, marginBottom: 14 }}>
            {TABS.map(t => (
              <TouchableOpacity
                key={t.id}
                onPress={() => { Haptics.selectionAsync(); setTab(t.id); }}
                style={{ borderWidth: 1, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 5, borderColor: tab === t.id ? t.color : '#2E2618', backgroundColor: tab === t.id ? t.color + '22' : 'transparent' }}
              >
                <Text style={{ color: tab === t.id ? t.color : '#7A6A58', fontSize: 9, fontFamily: 'Inter_700Bold', letterSpacing: 0.8 }}>{t.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* ── ENUMS tab ── */}
          {tab === 'enums' && (
            <View>
              {REF_ENUMS.map(en => (
                <View key={en.name} style={{ marginBottom: 14 }}>
                  <SectionHeader title={`enum ${en.name}`} count={`${en.values.length} values`} color={en.color} />
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 5 }}>
                    {en.values.map(v => (
                      <View key={v} style={{ backgroundColor: en.color + '18', borderWidth: 1, borderColor: en.color + '44', borderRadius: 6, paddingHorizontal: 7, paddingVertical: 3 }}>
                        <Text style={{ color: en.color, fontSize: 9, fontFamily: 'Inter_600SemiBold' }}>{v}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              ))}
            </View>
          )}

          {/* ── CLASSES tab ── */}
          {tab === 'fields' && (
            <View>
              {/* PoseArchetype */}
              <SectionHeader title="class PoseArchetype" count={`${POSE_ARCHETYPE_FIELDS.length} fields`} color="#FFD600" />
              <Text style={{ color: '#FFD600', fontSize: 10, fontFamily: 'Inter_700Bold', marginBottom: 8 }}>{'public static class PoseArchetype {'}</Text>
              {POSE_ARCHETYPE_FIELDS.map((f, i) => <FieldRow key={f.name} f={f} last={i === POSE_ARCHETYPE_FIELDS.length - 1} />)}
              <Text style={{ color: '#FFD600', fontSize: 10, fontFamily: 'Inter_700Bold', marginTop: 8, marginBottom: 16 }}>{'}'}</Text>

              {/* CharacterLockProfile */}
              <SectionHeader title="class CharacterLockProfile" count={`${LOCK_PROFILE_FIELDS.length} fields`} color="#E8001C" />
              <Text style={{ color: '#E8001C', fontSize: 10, fontFamily: 'Inter_700Bold', marginBottom: 8 }}>{'public static class CharacterLockProfile {'}</Text>
              {LOCK_PROFILE_FIELDS.map((f, i) => <FieldRow key={f.name} f={f} last={i === LOCK_PROFILE_FIELDS.length - 1} />)}
              <Text style={{ color: '#E8001C', fontSize: 10, fontFamily: 'Inter_700Bold', marginTop: 8, marginBottom: 16 }}>{'}'}</Text>

              {/* PanelFlow */}
              <SectionHeader title="class PanelFlow" count={`${PANEL_FLOW_FIELDS.length} fields`} color="#2A7A3A" />
              <Text style={{ color: '#2A7A3A', fontSize: 10, fontFamily: 'Inter_700Bold', marginBottom: 8 }}>{'public static class PanelFlow {'}</Text>
              {PANEL_FLOW_FIELDS.map((f, i) => <FieldRow key={f.name} f={f} last={i === PANEL_FLOW_FIELDS.length - 1} />)}
              <Text style={{ color: '#2A7A3A', fontSize: 10, fontFamily: 'Inter_700Bold', marginTop: 8 }}>{'}'}</Text>
            </View>
          )}

          {/* ── POSES tab ── */}
          {tab === 'poses' && (
            <View>
              <SectionHeader title="PoseDatabase.initialize()" count={`${SAMPLE_POSES.length} poses`} color="#E8001C" />
              {SAMPLE_POSES.map((p, i) => (
                <View key={p.id} style={{ paddingVertical: 7, borderBottomWidth: i < SAMPLE_POSES.length - 1 ? 1 : 0, borderBottomColor: '#2E2618' }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 3 }}>
                    <Text style={{ color: '#FFD600', fontSize: 10, fontFamily: 'Inter_700Bold' }}>{p.id}</Text>
                    <View style={{ backgroundColor: '#2E2618', borderRadius: 4, paddingHorizontal: 5, paddingVertical: 1 }}>
                      <Text style={{ color: '#7A6A58', fontSize: 8, fontFamily: 'Inter_600SemiBold' }}>{p.cat}</Text>
                    </View>
                  </View>
                  <Text style={{ color: '#F0EAD8', fontSize: 10.5, fontFamily: 'Inter_600SemiBold', marginBottom: 2 }}>{p.name}</Text>
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 5 }}>
                    {[p.emotion, p.camera, p.phase].map(tag => (
                      <Text key={tag} style={{ color: '#7A6A58', fontSize: 8.5, fontFamily: 'Inter_400Regular', backgroundColor: '#181410', borderRadius: 4, paddingHorizontal: 5, paddingVertical: 2 }}>{tag}</Text>
                    ))}
                  </View>
                  <Text style={{ color: '#7A6A58', fontSize: 9.5, fontFamily: 'Inter_400Regular', marginTop: 3, fontStyle: 'italic' }}>{p.intent}</Text>
                </View>
              ))}
            </View>
          )}

          {/* ── AI DIRECTOR tab ── */}
          {tab === 'ai' && (
            <View>
              <SectionHeader title="class AIPoseDirector" color="#8B3FBE" />
              <Text style={{ color: '#8B3FBE', fontSize: 10, fontFamily: 'Inter_700Bold', marginBottom: 10 }}>{'public static class AIPoseDirector {'}</Text>

              {[
                { label: 'Input: sceneDescription', type: 'String',      desc: 'Natural-language scene context for context-aware selection' },
                { label: 'Input: emotion',           type: 'EmotionType', desc: 'Filters database to matching emotion poses first' },
                { label: 'Input: actionScene',       type: 'boolean',     desc: 'When true, prioritises COMBAT category results' },
                { label: 'Output',                   type: 'PoseArchetype',desc: 'Best matching pose or null if no candidates found' },
              ].map(row => {
                const tc = FIELD_TYPE_COLORS[row.type] ?? '#F0EAD8';
                return (
                  <View key={row.label} style={{ flexDirection: 'row', alignItems: 'flex-start', paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: '#2E2618' }}>
                    <View style={{ width: 160, flexDirection: 'row', alignItems: 'center', gap: 5, flexShrink: 0 }}>
                      <View style={{ backgroundColor: tc + '20', borderRadius: 4, paddingHorizontal: 4, paddingVertical: 2 }}>
                        <Text style={{ color: tc, fontSize: 8.5, fontFamily: 'Inter_700Bold' }}>{row.type}</Text>
                      </View>
                      <Text style={{ color: '#F0EAD8', fontSize: 9.5, fontFamily: 'Inter_600SemiBold' }}>{row.label}</Text>
                    </View>
                    <Text style={{ color: '#7A6A58', fontSize: 9.5, fontFamily: 'Inter_400Regular', flex: 1, lineHeight: 14 }}>
                      {'// '}{row.desc}
                    </Text>
                  </View>
                );
              })}

              <Text style={{ color: '#8B3FBE', fontSize: 10, fontFamily: 'Inter_700Bold', marginTop: 10, marginBottom: 12 }}>{'}'}</Text>

              {/* Algorithm summary */}
              <View style={{ backgroundColor: '#181410', borderRadius: 8, padding: 10, borderWidth: 1, borderColor: '#2E2618' }}>
                <Text style={{ color: '#7A6A58', fontSize: 9, fontFamily: 'Inter_400Regular', marginBottom: 4, fontStyle: 'italic' }}>{'// Algorithm: recommendPose()'}</Text>
                {[
                  '1. Filter PoseDatabase by EmotionType',
                  '2. If actionScene=true → prefer COMBAT category',
                  '3. Return first match, or null if empty',
                ].map(step => (
                  <Text key={step} style={{ color: '#F0EAD8', fontSize: 10, fontFamily: 'Inter_400Regular', marginBottom: 3 }}>{step}</Text>
                ))}
              </View>

              {/* Test case */}
              <View style={{ backgroundColor: '#0A0800', borderRadius: 8, padding: 10, marginTop: 10, borderWidth: 1, borderColor: '#2E2618' }}>
                <Text style={{ color: '#7A6A58', fontSize: 9, fontFamily: 'Inter_400Regular', marginBottom: 4, fontStyle: 'italic' }}>{'// main() test case'}</Text>
                <Text style={{ color: '#FFD600', fontSize: 9.5, fontFamily: 'Inter_400Regular', lineHeight: 15 }}>
                  {`director.recommendPose(\n  "Batman attacks from rooftop",\n  EmotionType.RAGE,\n  actionScene: true\n)\n→ Returns: punch_impact (COMBAT · RAGE)`}
                </Text>
              </View>
            </View>
          )}

          <Text style={{ color: '#2E2618', fontSize: 9, fontFamily: 'Inter_400Regular', marginTop: 16, textAlign: 'center', letterSpacing: 0.5 }}>
            REFERENCE ONLY · NOT IMPLEMENTED · com.bloomscript.comicstudio.pose
          </Text>
        </View>
      )}
    </View>
  );
}

export default function PoseBrowserScreen() {
  const insets = useSafeAreaInsets();
  const { width: screenWidth } = useWindowDimensions();
  const isTablet = screenWidth >= 768;

  const [activeCat, setActiveCat]   = useState<PoseCategory | 'All'>('All');
  const [search, setSearch]         = useState('');
  const [selectedPose, setSelectedPose] = useState<ComicPose | null>(null);

  const fadeAnim = useRef(new Animated.Value(0)).current;

  const filtered = useMemo(() => {
    let list = POSE_LIBRARY;
    if (activeCat !== 'All') list = list.filter((p) => p.category === activeCat);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((p) =>
        p.name.toLowerCase().includes(q) ||
        p.emotionalPurpose.toLowerCase().includes(q) ||
        p.silhouette.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q)
      );
    }
    return list;
  }, [activeCat, search]);

  const columns = isTablet ? 4 : 3;
  const cardWidth = (screenWidth - 32 - (columns - 1) * 10) / columns;

  React.useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 300, useNativeDriver: true }).start();
  }, [fadeAnim]);

  return (
    <View style={[styles.root, { backgroundColor: C.bg, paddingTop: insets.top + 10 }]}>
      {/* Header */}
      <View style={[styles.header, { paddingHorizontal: 16 }]}>
        <TouchableOpacity
          onPress={() => { Haptics.selectionAsync(); router.back(); }}
          style={[styles.backBtn, { borderColor: C.border, backgroundColor: C.card }]}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Feather name="arrow-left" size={18} color={C.ink} />
        </TouchableOpacity>
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={[styles.headerEyebrow, { color: C.yellow }]}>BLOOMSCRIPT</Text>
          <Text style={[styles.headerTitle, { color: C.ink }]}>POSE LIBRARY</Text>
        </View>
        <View style={[styles.countBadge, { backgroundColor: C.yellow + '18', borderColor: C.yellow + '44' }]}>
          <Text style={[styles.countBadgeText, { color: C.yellow }]}>{POSE_LIBRARY.length} poses</Text>
        </View>
      </View>

      {/* Category pills — at the top for quick filtering */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={{ marginTop: 14 }}
        contentContainerStyle={{ paddingHorizontal: 16, gap: 10 }}
      >
        <TouchableOpacity
          onPress={() => { Haptics.selectionAsync(); setActiveCat('All'); }}
          style={[
            styles.catChip,
            { borderColor: activeCat === 'All' ? C.yellow : C.border, backgroundColor: activeCat === 'All' ? C.yellow + '18' : C.card },
          ]}
        >
          <Text style={[styles.catChipText, { color: activeCat === 'All' ? C.yellow : C.muted }]}>All</Text>
          <Text style={[styles.catChipCount, { color: activeCat === 'All' ? C.yellow + 'AA' : C.muted }]}>
            {POSE_LIBRARY.length}
          </Text>
        </TouchableOpacity>
        {POSE_CATEGORIES.map((cat) => (
          <TouchableOpacity
            key={cat}
            onPress={() => { Haptics.selectionAsync(); setActiveCat(cat); }}
            style={[
              styles.catChip,
              {
                borderColor: activeCat === cat ? CAT_COLORS[cat] : C.border,
                backgroundColor: activeCat === cat ? CAT_COLORS[cat] + '18' : C.card,
              },
            ]}
          >
            <View style={[styles.catChipDot, { backgroundColor: CAT_COLORS[cat] }]} />
            <Text style={[styles.catChipText, { color: activeCat === cat ? CAT_COLORS[cat] : C.muted }]}>
              {cat}
            </Text>
            <Text style={[styles.catChipCount, { color: activeCat === cat ? CAT_COLORS[cat] + 'AA' : C.muted }]}>
              {POSE_LIBRARY.filter((p) => p.category === cat).length}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Search */}
      <View style={[styles.searchWrap, { paddingHorizontal: 16, marginTop: 12 }]}>
        <View style={[styles.searchField, { backgroundColor: C.card, borderColor: C.border }]}>
          <Feather name="search" size={14} color={C.muted} />
          <TextInput
            style={[styles.searchInput, { color: C.ink }]}
            placeholder="Search pose, emotion, silhouette..."
            placeholderTextColor={C.muted}
            value={search}
            onChangeText={setSearch}
            autoCapitalize="none"
            autoCorrect={false}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')} hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}>
              <Feather name="x" size={14} color={C.muted} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Action Archetype Director entry card */}
      <TouchableOpacity
        style={{ marginHorizontal: 16, marginTop: 14, marginBottom: 4, borderRadius: 14, overflow: 'hidden', borderWidth: 1, borderColor: '#FFD60050' }}
        onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); router.push('/(tabs)/action-archetype-director'); }}
        activeOpacity={0.88}
      >
        <LinearGradient
          colors={['#1A1408', '#0A0806']}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
          style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, gap: 14 }}
        >
          <View style={{ width: 46, height: 46, borderRadius: 12, backgroundColor: '#FFD60018', borderWidth: 1, borderColor: '#FFD60060', alignItems: 'center', justifyContent: 'center' }}>
            <Feather name="film" size={22} color="#FFD600" />
          </View>
          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 2 }}>
              <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 14, color: '#FFD600' }}>ACTION ARCHETYPE DIRECTOR</Text>
              <View style={{ backgroundColor: '#FFD60025', borderWidth: 1, borderColor: '#FFD60060', borderRadius: 5, paddingHorizontal: 5, paddingVertical: 1 }}>
                <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 8, color: '#FFD600', letterSpacing: 1 }}>NEW</Text>
              </View>
            </View>
            <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 11, color: '#7A6A58', lineHeight: 15 }}>
              110 archetypes · 20 artist DNA · Pose DNA bars · AI prompt builder
            </Text>
          </View>
          <Feather name="chevron-right" size={16} color="#FFD60080" />
        </LinearGradient>
      </TouchableOpacity>

      {/* Results count */}
      <View style={{ paddingHorizontal: 16, marginTop: 10, marginBottom: 4 }}>
        <Text style={{ color: C.muted, fontSize: 12, fontFamily: 'Inter_400Regular' }}>
          Showing {filtered.length} of {POSE_LIBRARY.length}
        </Text>
      </View>

      {/* Grid */}
      <FlatList
        data={filtered}
        key={columns}
        numColumns={columns}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: insets.bottom + 20, gap: 10 }}
        columnWrapperStyle={{ gap: 10, marginBottom: 10 }}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={{ width: cardWidth }}>
            <PoseCard pose={item} onPress={() => setSelectedPose(item)} />
          </View>
        )}
        ListEmptyComponent={(
          <View style={styles.empty}>
            <Feather name="search" size={28} color={C.muted} />
            <Text style={{ color: C.muted, marginTop: 10, fontSize: 14, fontFamily: 'Inter_400Regular' }}>
              No poses match your search.
            </Text>
          </View>
        )}
        ListFooterComponent={<PoseArchetypeReference />}
      />

      <PoseDetailModal
        pose={selectedPose}
        visible={!!selectedPose}
        onClose={() => setSelectedPose(null)}
      />
    </View>
  );
}

// ── Styles ─────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root: { flex: 1 },

  header: { flexDirection: 'row', alignItems: 'center', marginTop: 6 },
  backBtn: {
    width: 34, height: 34, borderRadius: 10, borderWidth: 1,
    alignItems: 'center', justifyContent: 'center',
  },
  headerEyebrow: { fontSize: 11, fontFamily: 'Inter_600SemiBold', letterSpacing: 1.2, marginBottom: 2 },
  headerTitle: { fontSize: 22, fontFamily: 'Inter_700Bold' },
  countBadge: {
    borderRadius: 8, borderWidth: 1, paddingHorizontal: 10, paddingVertical: 5,
  },
  countBadgeText: { fontSize: 11, fontFamily: 'Inter_600SemiBold' },

  searchWrap: {},
  searchField: {
    flexDirection: 'row', alignItems: 'center', borderRadius: 12, borderWidth: 1,
    paddingHorizontal: 12, paddingVertical: 9, gap: 8,
  },
  searchInput: { flex: 1, fontSize: 13, fontFamily: 'Inter_400Regular', paddingVertical: 0 },

  catChip: {
    flexDirection: 'row', alignItems: 'center', borderRadius: 14, borderWidth: 1.5,
    paddingHorizontal: 16, paddingVertical: 11, gap: 8,
  },
  catChipDot: { width: 9, height: 9, borderRadius: 5 },
  catChipText: { fontSize: 14, fontFamily: 'Inter_700Bold', letterSpacing: 0.3 },
  catChipCount: { fontSize: 12, fontFamily: 'Inter_600SemiBold', marginLeft: 2 },

  poseCard: {
    borderRadius: 12, borderWidth: 1, overflow: 'hidden', padding: 10,
  },
  thumbBox: {
    width: '100%', aspectRatio: 1, borderRadius: 10, borderWidth: 1,
    alignItems: 'center', justifyContent: 'center', marginBottom: 8,
  },
  thumbInitial: { fontSize: 28, fontFamily: 'Inter_800ExtraBold' },
  thumbGenLabel: { fontSize: 9, fontFamily: 'Inter_600SemiBold', marginTop: 6, letterSpacing: 0.5 },
  catDot: { position: 'absolute', top: 6, right: 6, width: 8, height: 8, borderRadius: 4 },
  groupBadge: {
    position: 'absolute', bottom: 6, left: 6,
    backgroundColor: C.yellow, borderRadius: 6, padding: 3,
  },
  poseName: { fontSize: 12, fontFamily: 'Inter_600SemiBold', marginBottom: 2 },
  poseEmo: { fontSize: 10, fontFamily: 'Inter_400Regular', marginBottom: 6 },
  intensityRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  intensityTrack: { flex: 1, height: 3, borderRadius: 2, overflow: 'hidden' },
  intensityFill: { height: '100%', borderRadius: 2 },
  intensityNum: { fontSize: 10, fontFamily: 'Inter_700Bold', width: 16, textAlign: 'right' },

  empty: { alignItems: 'center', justifyContent: 'center', marginTop: 60 },

  modalOverlay: {
    flex: 1, backgroundColor: '#000000CC',
    justifyContent: 'flex-end',
  },
  modalCard: {
    borderTopLeftRadius: 20, borderTopRightRadius: 20,
    borderTopWidth: 1, borderLeftWidth: 1, borderRightWidth: 1,
    paddingHorizontal: 20, paddingBottom: 30,
    maxHeight: '88%',
  },
  modalHeaderBar: { width: 40, height: 4, borderRadius: 2, alignSelf: 'center', marginTop: 10, marginBottom: 14 },
  modalHeader: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16 },
  modalName: { fontSize: 20, fontFamily: 'Inter_700Bold', marginBottom: 6 },
  modalMetaRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  catPill: {
    borderRadius: 8, borderWidth: 1,
    paddingHorizontal: 8, paddingVertical: 3,
  },
  catPillText: { fontSize: 11, fontFamily: 'Inter_600SemiBold' },

  metaBlock: {
    borderRadius: 12, borderWidth: 1,
    padding: 12, marginBottom: 8,
  },
  metaGrid: {
    flexDirection: 'row', flexWrap: 'wrap', gap: 8,
  },
  metaCell: {
    flex: 1, minWidth: '45%', borderRadius: 10, borderWidth: 1,
    padding: 10,
  },
  metaLabel: { fontSize: 9, fontFamily: 'Inter_600SemiBold', letterSpacing: 0.8, marginBottom: 4, textTransform: 'uppercase' },
  metaValue: { fontSize: 13, fontFamily: 'Inter_600SemiBold' },
  promptSnippet: {
    fontSize: 12, fontFamily: 'Inter_400Regular',
    lineHeight: 18, fontStyle: 'italic',
  },
  modalImage: {
    width: '100%', height: 260, borderRadius: 14, marginBottom: 14,
    borderWidth: 1, borderColor: '#2E2618', backgroundColor: '#181410',
  },
});
