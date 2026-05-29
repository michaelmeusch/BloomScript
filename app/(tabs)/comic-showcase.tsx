import { Feather } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React, { useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  FlatList,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ViewToken,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export const SHOWCASE_SEEN_KEY = '@bloomscript:studio_showcased_v1';

const { width: W, height: H } = Dimensions.get('window');

// ══════════════════════════════════════════════════════════════════════════════
// SLIDE DATA
// ══════════════════════════════════════════════════════════════════════════════

// Single unified ink+gold palette — matches the login/sign-up screen
const INK_A = '#0A0806';
const INK_B = '#14100A';
const INK_C = '#1E1810';
const GOLD  = '#FFD600';
const GOLD2 = '#FF9500';

const SLIDES = [
  { id: 'welcome',           accentA: GOLD, accentB: GOLD2, gradA: INK_A, gradB: INK_B, gradC: INK_C },
  { id: 'panel-director',    accentA: GOLD, accentB: GOLD2, gradA: INK_A, gradB: INK_B, gradC: INK_C },
  { id: 'character-genesis', accentA: GOLD, accentB: GOLD2, gradA: INK_A, gradB: INK_B, gradC: INK_C },
  { id: 'style-interpreter', accentA: GOLD, accentB: GOLD2, gradA: INK_A, gradB: INK_B, gradC: INK_C },
  { id: 'page-flow',         accentA: GOLD, accentB: GOLD2, gradA: INK_A, gradB: INK_B, gradC: INK_C },
  { id: 'ai-director',       accentA: GOLD, accentB: GOLD2, gradA: INK_A, gradB: INK_B, gradC: INK_C },
  { id: 'get-started',       accentA: GOLD, accentB: GOLD2, gradA: INK_A, gradB: INK_B, gradC: INK_C },
] as const;

type SlideId = (typeof SLIDES)[number]['id'];

// ══════════════════════════════════════════════════════════════════════════════
// VISUAL MOCK-UPS  (one per slide)
// ══════════════════════════════════════════════════════════════════════════════

function WelcomeVisual({ accent }: { accent: string }) {
  const comics = [
    { genre: 'CYBERPUNK', emoji: '⚡', color: '#00E5FF', bg: '#000D1A', scene: 'Nyx rises above the neon skyline' },
    { genre: 'HORROR',    emoji: '💀', color: '#CC2200', bg: '#120000', scene: 'Something sits in that booth' },
    { genre: 'SUPERHERO', emoji: '🦸', color: '#FFD600', bg: '#020A18', scene: 'Ironspire stands defiant' },
    { genre: 'MANGA',     emoji: '⚔️', color: '#FF3030', bg: '#120002', scene: '0.003 seconds. Already done.' },
  ];
  return (
    <View style={v.welcomeGrid}>
      {comics.map(c => (
        <View key={c.genre} style={[v.welcomeCell, { backgroundColor: c.bg, borderColor: c.color + '60' }]}>
          <Text style={v.welcomeCellEmoji}>{c.emoji}</Text>
          <Text style={[v.welcomeCellGenre, { color: c.color }]}>{c.genre}</Text>
          <Text style={v.welcomeCellScene} numberOfLines={2}>{c.scene}</Text>
        </View>
      ))}
    </View>
  );
}

function PanelDirectorVisual({ accent }: { accent: string }) {
  const shots = ['DUTCH ANGLE', 'HERO LOW ANGLE', 'HORROR POV', 'SILHOUETTE'];
  return (
    <View style={v.pdWrap}>
      {/* Mock panel */}
      <View style={[v.mockPanel, { borderColor: accent + '80' }]}>
        <View style={v.mockPanelTop}>
          <View style={[v.mockBadge, { backgroundColor: accent }]}>
            <Text style={v.mockBadgeText}>PANEL 1</Text>
          </View>
          <View style={[v.mockCamBadge, { borderColor: accent + '60' }]}>
            <Text style={[v.mockCamText, { color: accent }]}>DUTCH ANGLE</Text>
          </View>
        </View>
        <View style={v.mockCaption}>
          <Text style={v.mockCaptionText}>11:58 PM — The drones found her first.</Text>
        </View>
        <Text style={v.mockScene}>Rain-soaked rooftop. Nyx stands at the edge, amulet blazing violet. Two hundred drones form a death circle below.</Text>
        <View style={v.mockBubble}>
          <Text style={[v.mockBubbleName, { color: accent }]}>NYX</Text>
          <Text style={v.mockBubbleText}>"They know I'm here."</Text>
        </View>
      </View>
      {/* Shot selector */}
      <View style={v.shotRow}>
        {shots.map((s, i) => (
          <View key={s} style={[v.shotChip, i === 0 && { backgroundColor: accent + '30', borderColor: accent }]}>
            <Text style={[v.shotChipText, i === 0 ? { color: accent } : { color: '#FFFFFF40' }]}>{s}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

function CharacterGenesisVisual({ accent }: { accent: string }) {
  const traits = [
    { label: 'SPECIES',  value: 'Cosmic Entity'             },
    { label: 'BODY',     value: 'Athletic — 6\'1"'           },
    { label: 'COSTUME',  value: 'Dark neon techno-mystic armor' },
    { label: 'POWERS',   value: 'Void Manipulation · Energy Projection' },
  ];
  const colors = ['#000000', '#8B00FF', '#00E5FF'];
  return (
    <View style={v.dnaCard}>
      <View style={v.dnaHeader}>
        <View style={[v.dnaDot, { backgroundColor: accent }]} />
        <Text style={[v.dnaName, { color: accent }]}>NYX</Text>
        <View style={[v.dnaLock, { borderColor: accent + '60' }]}>
          <Feather name="lock" size={10} color={accent} />
          <Text style={[v.dnaLockText, { color: accent }]}>DNA LOCKED</Text>
        </View>
      </View>
      <View style={v.dnaDivider} />
      {traits.map(t => (
        <View key={t.label} style={v.dnaTrait}>
          <Text style={v.dnaTraitLabel}>{t.label}</Text>
          <Text style={v.dnaTraitValue}>{t.value}</Text>
        </View>
      ))}
      <View style={v.dnaColorsRow}>
        <Text style={v.dnaTraitLabel}>COLORS</Text>
        <View style={{ flexDirection: 'row', gap: 6 }}>
          {colors.map(c => (
            <View key={c} style={[v.colorSwatch, { backgroundColor: c, borderColor: '#FFFFFF30' }]} />
          ))}
        </View>
      </View>
      <View style={[v.dnaContinuity, { borderColor: accent + '40', backgroundColor: accent + '10' }]}>
        <Feather name="shield" size={11} color={accent} />
        <Text style={[v.dnaContinuityText, { color: accent }]}>Consistency engine active — DNA enforced across all panels</Text>
      </View>
    </View>
  );
}

function StyleInterpreterVisual({ accent }: { accent: string }) {
  const meters = [
    { label: 'Ink Density',          val: 0.80, color: '#F0EAD8' },
    { label: 'Motion Intensity',     val: 0.70, color: '#FFD600' },
    { label: 'Realism Level',        val: 0.85, color: '#00E5FF' },
    { label: 'Env. Detail',          val: 1.00, color: '#2ECC71' },
    { label: 'Color Complexity',     val: 0.90, color: '#A855F7' },
  ];
  const flags = ['Cinematic Lighting', 'Heavy Shadowing', 'Exaggerated Perspective'];
  return (
    <View style={v.styleWrap}>
      <View style={v.styleGenreRow}>
        {(['CYBERPUNK ⚡', 'HORROR 💀', 'NOIR 🕯️'] as string[]).map((g, i) => (
          <View key={g} style={[v.styleGenreChip, i === 0 && { backgroundColor: accent + '28', borderColor: accent }]}>
            <Text style={[v.styleGenreText, i === 0 && { color: accent }]}>{g}</Text>
          </View>
        ))}
      </View>
      <View style={[v.styleRenderBadge, { borderColor: accent + '60' }]}>
        <Text style={[v.styleRenderLabel, { color: accent }]}>NEON NOIR  ·  PARANOID  ·  CINEMATIC WIDE</Text>
      </View>
      {meters.map(m => (
        <View key={m.label} style={v.meterRow}>
          <Text style={v.meterLabel}>{m.label}</Text>
          <View style={v.meterTrack}>
            <View style={[v.meterFill, { width: `${Math.round(m.val * 100)}%` as any, backgroundColor: m.color }]} />
          </View>
          <Text style={[v.meterPct, { color: m.color }]}>{Math.round(m.val * 100)}%</Text>
        </View>
      ))}
      <View style={v.flagsRow}>
        {flags.map(f => (
          <View key={f} style={[v.flagChip, { borderColor: accent + '60' }]}>
            <Text style={[v.flagText, { color: accent }]}>✓ {f}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

function PageFlowVisual({ accent }: { accent: string }) {
  return (
    <View style={v.pfWrap}>
      {/* Mini page layout */}
      <View style={[v.pfPage, { borderColor: accent + '50' }]}>
        <Text style={[v.pfLayoutLabel, { color: accent }]}>Z-PATTERN LAYOUT</Text>
        <View style={v.pfRow}>
          <View style={[v.pfPanel, { flex: 2, backgroundColor: accent + '18', borderColor: accent + '50' }]}>
            <Text style={[v.pfPanelNum, { color: accent }]}>1</Text>
            <Text style={v.pfPanelDesc}>Wide establishing</Text>
          </View>
          <View style={[v.pfPanel, { flex: 1, backgroundColor: accent + '10', borderColor: accent + '30' }]}>
            <Text style={[v.pfPanelNum, { color: accent }]}>2</Text>
            <Text style={v.pfPanelDesc}>Close-up</Text>
          </View>
        </View>
        <View style={[v.pfPanel, { width: '100%', height: 36, backgroundColor: accent + '14', borderColor: accent + '40' }]}>
          <Text style={[v.pfPanelNum, { color: accent }]}>3</Text>
          <Text style={v.pfPanelDesc}>Action beat — full width</Text>
        </View>
        <View style={v.pfRow}>
          <View style={[v.pfPanel, { flex: 1, backgroundColor: accent + '10', borderColor: accent + '30' }]}>
            <Text style={[v.pfPanelNum, { color: accent }]}>4</Text>
            <Text style={v.pfPanelDesc}>Reaction</Text>
          </View>
          <View style={[v.pfPanel, { flex: 2, backgroundColor: accent + '18', borderColor: accent + '50' }]}>
            <Text style={[v.pfPanelNum, { color: accent }]}>5</Text>
            <Text style={v.pfPanelDesc}>Scene exit</Text>
          </View>
        </View>
        {/* Flow arrows */}
        <View style={v.pfFlowRow}>
          <Text style={[v.pfFlowArrow, { color: accent }]}>→ → ↓ ← ←</Text>
          <Text style={v.pfFlowLabel}>Eye flow path</Text>
        </View>
      </View>
      {/* Score */}
      <View style={[v.pfScoreRow, { borderColor: accent + '40' }]}>
        <Text style={[v.pfScoreLabel, { color: accent }]}>READABILITY SCORE</Text>
        <View style={v.pfScoreTrack}>
          <View style={[v.pfScoreFill, { backgroundColor: accent, width: '96%' }]} />
        </View>
        <Text style={[v.pfScoreNum, { color: accent }]}>96/100</Text>
      </View>
      <View style={v.pfLayoutsRow}>
        {['Z-Pattern', 'Manga Vert.', 'Cinematic Wide', 'Diagonal'].map(l => (
          <View key={l} style={[v.pfLayoutChip, { borderColor: accent + '40' }]}>
            <Text style={[v.pfLayoutChipText, { color: accent }]}>{l}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

function AIDirectorVisual({ accent }: { accent: string }) {
  const pipeline = [
    { icon: '🎨', name: 'Style Database',     out: 'Genre → Render Profile' },
    { icon: '⚗️',  name: 'Genre Fusion',       out: 'Blends Two Genres'      },
    { icon: '🎬', name: 'Camera Director',     out: 'Genre + Mood → Shot'    },
    { icon: '🧬', name: 'Char Continuity',    out: 'DNA Enforced Across All' },
    { icon: '🧠', name: 'Prompt Composer',    out: 'Full Structured Prompt'  },
    { icon: '🦴', name: 'Pose Engine',        out: 'Genre → Pose Directive'  },
  ];
  return (
    <View style={v.adWrap}>
      <View style={[v.adHeader, { borderColor: accent + '60', backgroundColor: accent + '12' }]}>
        <Text style={[v.adHeaderText, { color: accent }]}>🎬 AI DIRECTOR  ·  ALL SYSTEMS ACTIVE</Text>
      </View>
      {pipeline.map((step, i) => (
        <View key={step.name}>
          <View style={v.adStep}>
            <Text style={v.adStepEmoji}>{step.icon}</Text>
            <View style={{ flex: 1 }}>
              <Text style={v.adStepName}>{step.name}</Text>
              <Text style={v.adStepOut}>{step.out}</Text>
            </View>
            <View style={[v.adActiveChip, { borderColor: accent + '60' }]}>
              <Text style={[v.adActiveText, { color: accent }]}>ACTIVE</Text>
            </View>
          </View>
          {i < pipeline.length - 1 && (
            <View style={v.adArrow}>
              <View style={[v.adArrowLine, { backgroundColor: accent + '30' }]} />
              <Text style={[v.adArrowHead, { color: accent + '60' }]}>↓</Text>
            </View>
          )}
        </View>
      ))}
    </View>
  );
}

function GetStartedVisual({ accent }: { accent: string }) {
  const tools = [
    { emoji: '🗂',  label: 'Production\nStudio'   },
    { emoji: '🎬', label: 'Panel\nDirector'       },
    { emoji: '📐', label: 'Page Flow\nEngine'     },
    { emoji: '🧬', label: 'Character\nGenesis'    },
    { emoji: '🔒', label: 'Consistency\nEngine'   },
    { emoji: '🧌',  label: 'Pose\nLibrary'         },
    { emoji: '💬', label: 'Speech\nBubbles'       },
    { emoji: '🤖', label: 'AI\nDirector'          },
    { emoji: '🧠', label: 'Style\nInterpreter'    },
    { emoji: '📖', label: 'Page\nPipeline'        },
  ];
  return (
    <View style={v.gsGrid}>
      {tools.map(t => (
        <View key={t.label} style={[v.gsTool, { borderColor: '#FFD60040', backgroundColor: '#FFD60010' }]}>
          <Text style={v.gsToolEmoji}>{t.emoji}</Text>
          <Text style={[v.gsToolLabel, { color: '#F0EAD8' }]}>{t.label}</Text>
        </View>
      ))}
    </View>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// SLIDE CONTENT DEFINITIONS
// ══════════════════════════════════════════════════════════════════════════════

type SlideContent = {
  eyebrow: string;
  headline: string;
  body: string;
  Visual: React.ComponentType<{ accent: string }>;
};

const CONTENT: Record<SlideId, SlideContent> = {
  'welcome': {
    eyebrow:  'BLOOMSCRIPT PRESENTS',
    headline: 'Comic Art Studio',
    body:     'Professional-grade sequential art creation. Ten specialized tools. One unified AI-powered studio.',
    Visual:   WelcomeVisual,
  },
  'panel-director': {
    eyebrow:  'TOOL 1',
    headline: '🎬 Panel Director',
    body:     'Set the shot. Choose your lens. Describe the scene — the AI generates cinematic panels with precise director control over camera, lighting, and mood.',
    Visual:   PanelDirectorVisual,
  },
  'character-genesis': {
    eyebrow:  'TOOL 2',
    headline: '🧬 Character Genesis',
    body:     'Build characters with living DNA — species, body, costume, powers, and colors locked in. The Consistency Engine enforces their look across every single panel, automatically.',
    Visual:   CharacterGenesisVisual,
  },
  'style-interpreter': {
    eyebrow:  'TOOL 3',
    headline: '🧠 Style Interpreter',
    body:     '34 genres. Each one produces a complete visual profile — render language, panel style, ink density, motion intensity, and more. Fuse two genres together for hybrid styles no one has made before.',
    Visual:   StyleInterpreterVisual,
  },
  'page-flow': {
    eyebrow:  'TOOL 4',
    headline: '📐 Page Flow Engine',
    body:     'Six scientifically-optimized layouts guide your reader\'s eye exactly where you want it. Score your page for readability before committing a single panel to ink.',
    Visual:   PageFlowVisual,
  },
  'ai-director': {
    eyebrow:  'MASTER SYSTEM',
    headline: '🎬 AI Director',
    body:     'The central brain. Every subsystem — style, camera, characters, poses, prompts — coordinated through one unified engine. One project state. Complete control.',
    Visual:   AIDirectorVisual,
  },
  'get-started': {
    eyebrow:  'YOU\'RE READY',
    headline: 'Your comic\nstarts here.',
    body:     'Ten powerful tools. Zero limits. Every genre, every style, every story — yours to create.',
    Visual:   GetStartedVisual,
  },
};

// ══════════════════════════════════════════════════════════════════════════════
// MAIN SCREEN
// ══════════════════════════════════════════════════════════════════════════════

export default function ComicShowcaseScreen() {
  const insets  = useSafeAreaInsets();
  const listRef = useRef<FlatList>(null);
  const [activeIdx, setActiveIdx] = useState(0);

  const isLast = activeIdx === SLIDES.length - 1;
  const current = SLIDES[activeIdx];
  const content = CONTENT[current.id];
  const accent  = current.accentA;

  const onViewRef = useRef(({ viewableItems }: { viewableItems: ViewToken[] }) => {
    if (viewableItems[0]) setActiveIdx(viewableItems[0].index ?? 0);
  });
  const viewConfigRef = useRef({ viewAreaCoveragePercentThreshold: 50 });

  async function dismiss() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await AsyncStorage.setItem(SHOWCASE_SEEN_KEY, '1');
    router.back();
  }

  function next() {
    Haptics.selectionAsync();
    if (isLast) { dismiss(); return; }
    listRef.current?.scrollToIndex({ index: activeIdx + 1, animated: true });
  }

  function renderSlide({ item }: { item: typeof SLIDES[number]; index: number }) {
    const c   = CONTENT[item.id];
    const acc = item.accentA;
    return (
      <View style={{ width: W }}>
        <LinearGradient
          colors={[item.gradA, item.gradB, item.gradC]}
          style={StyleSheet.absoluteFill}
          start={{ x: 0.3, y: 0 }}
          end={{ x: 0.7, y: 1 }}
        />
        {/* Visual area */}
        <View style={[sl.visualArea, { borderColor: acc + '30' }]}>
          {/* Halftone dot grid — matches login header */}
          <View style={sl.halftoneGrid} pointerEvents="none">
            {Array.from({ length: 48 }).map((_, i) => (
              <View key={i} style={sl.halftoneDot} />
            ))}
          </View>
          {/* Corner marks — matches login header */}
          <View style={[sl.corner, sl.cornerTL]} />
          <View style={[sl.corner, sl.cornerTR]} />
          <View style={[sl.corner, sl.cornerBL]} />
          <View style={[sl.corner, sl.cornerBR]} />
          <c.Visual accent={acc} />
        </View>
      </View>
    );
  }

  return (
    <View style={sl.root}>
      {/* Persistent gradient for the bottom chrome */}
      <LinearGradient
        colors={[current.gradA, current.gradB, current.gradC]}
        style={StyleSheet.absoluteFill}
        start={{ x: 0.3, y: 0 }}
        end={{ x: 0.7, y: 1 }}
      />

      {/* ── Top skip ────────────────────────────────────────────────────────── */}
      <View style={[sl.topBar, { paddingTop: insets.top + 10 }]}>
        <View />
        <TouchableOpacity onPress={dismiss} style={sl.skipBtn} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Text style={sl.skipText}>SKIP</Text>
          <Feather name="chevron-right" size={13} color="#FFD60090" />
        </TouchableOpacity>
      </View>

      {/* ── Swipeable slides (visual only) ──────────────────────────────────── */}
      <FlatList
        ref={listRef}
        data={SLIDES}
        keyExtractor={item => item.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onViewableItemsChanged={onViewRef.current}
        viewabilityConfig={viewConfigRef.current}
        renderItem={renderSlide}
        style={sl.flatList}
        getItemLayout={(_, index) => ({ length: W, offset: W * index, index })}
      />

      {/* ── Bottom chrome — text + nav (not scrollable, updates on scroll) ──── */}
      <Animated.View style={[sl.bottomChrome, { paddingBottom: insets.bottom + 12 }]}>

        {/* Eyebrow */}
        <Text style={[sl.eyebrow, { color: accent }]}>{content.eyebrow}</Text>

        {/* Headline */}
        <Text style={sl.headline}>{content.headline}</Text>

        {/* Body */}
        <Text style={sl.body}>{content.body}</Text>

        {/* Dot indicators */}
        <View style={sl.dotsRow}>
          {SLIDES.map((_, i) => (
            <TouchableOpacity
              key={i}
              onPress={() => {
                Haptics.selectionAsync();
                listRef.current?.scrollToIndex({ index: i, animated: true });
              }}
            >
              <View
                style={[
                  sl.dot,
                  {
                    backgroundColor: i === activeIdx ? accent : '#FFFFFF28',
                    width: i === activeIdx ? 22 : 7,
                  },
                ]}
              />
            </TouchableOpacity>
          ))}
        </View>

        {/* Next / Get Started button */}
        <TouchableOpacity style={sl.nextBtn} onPress={next} activeOpacity={0.85}>
          <LinearGradient
            colors={[current.accentA, current.accentB]}
            style={sl.nextGrad}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            {isLast ? (
              <>
                <Feather name="edit-3" size={16} color="#000" />
                <Text style={sl.nextText}>OPEN COMIC ART STUDIO</Text>
                <Feather name="arrow-right" size={16} color="#000" />
              </>
            ) : (
              <>
                <Text style={sl.nextText}>NEXT</Text>
                <Feather name="chevron-right" size={16} color="#000" />
              </>
            )}
          </LinearGradient>
        </TouchableOpacity>

        {/* Step counter */}
        <Text style={sl.stepCounter}>{activeIdx + 1} of {SLIDES.length}</Text>
      </Animated.View>
    </View>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// VISUAL SUB-STYLES
// ══════════════════════════════════════════════════════════════════════════════

const v = StyleSheet.create({
  // Welcome visual
  welcomeGrid:    { flexDirection: 'row', flexWrap: 'wrap', gap: 8, padding: 4 },
  welcomeCell:    { width: (W - 64) / 2, borderRadius: 12, borderWidth: 1, padding: 12, justifyContent: 'flex-end', minHeight: 100 },
  welcomeCellEmoji: { fontSize: 22, marginBottom: 4 },
  welcomeCellGenre: { fontSize: 10, fontWeight: '800', letterSpacing: 1.2, marginBottom: 4 },
  welcomeCellScene: { fontSize: 11, color: '#FFFFFF70', lineHeight: 15 },

  // Panel Director visual
  pdWrap:         { gap: 12 },
  mockPanel:      { borderRadius: 12, borderWidth: 1.5, backgroundColor: '#00000080', padding: 12, gap: 8 },
  mockPanelTop:   { flexDirection: 'row', alignItems: 'center', gap: 8 },
  mockBadge:      { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  mockBadgeText:  { fontSize: 9, fontWeight: '900', color: '#000', letterSpacing: 0.8 },
  mockCamBadge:   { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, borderWidth: 1 },
  mockCamText:    { fontSize: 9, fontWeight: '700', letterSpacing: 0.6 },
  mockCaption:    { backgroundColor: '#000000CC', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 5, borderLeftWidth: 2, borderLeftColor: '#FFFFFF30' },
  mockCaptionText:{ fontSize: 10, color: '#FFFFFFCC', fontStyle: 'italic' },
  mockScene:      { fontSize: 12, color: '#FFFFFF', lineHeight: 17 },
  mockBubble:     { backgroundColor: '#FFFFFFEE', borderRadius: 10, padding: 8 },
  mockBubbleName: { fontSize: 8, fontWeight: '900', letterSpacing: 1, marginBottom: 2 },
  mockBubbleText: { fontSize: 12, color: '#111', fontStyle: 'italic', fontWeight: '600' },
  shotRow:        { flexDirection: 'row', gap: 6, flexWrap: 'wrap' },
  shotChip:       { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, borderWidth: 1, borderColor: '#FFFFFF20' },
  shotChipText:   { fontSize: 9, fontWeight: '700', letterSpacing: 0.5 },

  // Character Genesis visual
  dnaCard:        { backgroundColor: '#00000060', borderRadius: 14, padding: 14, gap: 8, borderWidth: 1, borderColor: '#FFFFFF15' },
  dnaHeader:      { flexDirection: 'row', alignItems: 'center', gap: 8 },
  dnaDot:         { width: 8, height: 8, borderRadius: 4 },
  dnaName:        { fontSize: 18, fontWeight: '900', flex: 1 },
  dnaLock:        { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, borderWidth: 1 },
  dnaLockText:    { fontSize: 9, fontWeight: '700', letterSpacing: 0.8 },
  dnaDivider:     { height: 1, backgroundColor: '#FFFFFF15' },
  dnaTrait:       { flexDirection: 'row', gap: 8, alignItems: 'flex-start' },
  dnaTraitLabel:  { fontSize: 9, fontWeight: '800', color: '#FFFFFF50', letterSpacing: 1, width: 64, marginTop: 2 },
  dnaTraitValue:  { fontSize: 12, color: '#FFFFFF', flex: 1, lineHeight: 16 },
  dnaColorsRow:   { flexDirection: 'row', alignItems: 'center', gap: 8 },
  colorSwatch:    { width: 18, height: 18, borderRadius: 9, borderWidth: 1 },
  dnaContinuity:  { flexDirection: 'row', alignItems: 'center', gap: 6, borderRadius: 8, borderWidth: 1, padding: 8 },
  dnaContinuityText:{ fontSize: 10, flex: 1, lineHeight: 14 },

  // Style interpreter visual
  styleWrap:      { gap: 8 },
  styleGenreRow:  { flexDirection: 'row', gap: 6 },
  styleGenreChip: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10, borderWidth: 1, borderColor: '#FFFFFF25', backgroundColor: '#FFFFFF10' },
  styleGenreText: { fontSize: 10, fontWeight: '800', color: '#FFFFFF50', letterSpacing: 0.5 },
  styleRenderBadge:{ paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, borderWidth: 1, backgroundColor: '#FFFFFF08' },
  styleRenderLabel:{ fontSize: 10, fontWeight: '800', letterSpacing: 0.8 },
  meterRow:       { flexDirection: 'row', alignItems: 'center', gap: 6 },
  meterLabel:     { fontSize: 9, color: '#FFFFFF60', width: 100 },
  meterTrack:     { flex: 1, height: 6, backgroundColor: '#FFFFFF18', borderRadius: 3, overflow: 'hidden' },
  meterFill:      { height: '100%', borderRadius: 3 },
  meterPct:       { fontSize: 9, fontWeight: '700', width: 28, textAlign: 'right' },
  flagsRow:       { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  flagChip:       { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, borderWidth: 1, borderColor: '#FFFFFF25' },
  flagText:       { fontSize: 9, fontWeight: '700' },

  // Page flow visual
  pfWrap:         { gap: 8 },
  pfPage:         { borderRadius: 10, borderWidth: 1, padding: 10, gap: 6 },
  pfLayoutLabel:  { fontSize: 9, fontWeight: '800', letterSpacing: 1, marginBottom: 2 },
  pfRow:          { flexDirection: 'row', gap: 5 },
  pfPanel:        { borderRadius: 6, borderWidth: 1, padding: 5, justifyContent: 'center', alignItems: 'center', height: 44 },
  pfPanelNum:     { fontSize: 13, fontWeight: '900' },
  pfPanelDesc:    { fontSize: 8, color: '#FFFFFF50', textAlign: 'center', marginTop: 1 },
  pfFlowRow:      { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 },
  pfFlowArrow:    { fontSize: 11, fontWeight: '700', letterSpacing: 2 },
  pfFlowLabel:    { fontSize: 9, color: '#FFFFFF40' },
  pfScoreRow:     { flexDirection: 'row', alignItems: 'center', gap: 8, borderRadius: 8, borderWidth: 1, padding: 8 },
  pfScoreLabel:   { fontSize: 8, fontWeight: '800', letterSpacing: 1, width: 80 },
  pfScoreTrack:   { flex: 1, height: 6, backgroundColor: '#FFFFFF18', borderRadius: 3, overflow: 'hidden' },
  pfScoreFill:    { height: '100%', borderRadius: 3 },
  pfScoreNum:     { fontSize: 12, fontWeight: '900', width: 40, textAlign: 'right' },
  pfLayoutsRow:   { flexDirection: 'row', gap: 6, flexWrap: 'wrap' },
  pfLayoutChip:   { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, borderWidth: 1, borderColor: '#FFFFFF25' },
  pfLayoutChipText:{ fontSize: 9, fontWeight: '700' },

  // AI Director visual
  adWrap:         { gap: 0 },
  adHeader:       { borderRadius: 10, borderWidth: 1, padding: 10, marginBottom: 10, alignItems: 'center' },
  adHeaderText:   { fontSize: 10, fontWeight: '900', letterSpacing: 1 },
  adStep:         { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#FFFFFF08', borderRadius: 8, padding: 8 },
  adStepEmoji:    { fontSize: 16 },
  adStepName:     { fontSize: 11, fontWeight: '700', color: '#FFFFFF' },
  adStepOut:      { fontSize: 9, color: '#FFFFFF50', marginTop: 1 },
  adActiveChip:   { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 5, borderWidth: 1 },
  adActiveText:   { fontSize: 8, fontWeight: '800', letterSpacing: 0.8 },
  adArrow:        { alignItems: 'center', marginVertical: 1 },
  adArrowLine:    { width: 1, height: 4 },
  adArrowHead:    { fontSize: 10, lineHeight: 10 },

  // Get Started visual
  gsGrid:         { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  gsTool:         { width: (W - 72) / 4, borderRadius: 10, borderWidth: 1, padding: 8, alignItems: 'center', gap: 4 },
  gsToolEmoji:    { fontSize: 18 },
  gsToolLabel:    { fontSize: 8, fontWeight: '700', textAlign: 'center', letterSpacing: 0.3, lineHeight: 11 },
});

// ══════════════════════════════════════════════════════════════════════════════
// MAIN LAYOUT STYLES
// ══════════════════════════════════════════════════════════════════════════════

const VISUAL_HEIGHT = H * 0.42;
const CHROME_HEIGHT = H - VISUAL_HEIGHT;

const sl = StyleSheet.create({
  root:       { flex: 1, backgroundColor: '#0A0806' },
  topBar:     { position: 'absolute', top: 0, left: 0, right: 0, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 18, zIndex: 10 },
  skipBtn:    { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 14, backgroundColor: '#FFD60015', borderWidth: 1, borderColor: '#FFD60040' },
  skipText:   { fontSize: 11, fontWeight: '800', color: '#FFD60090', letterSpacing: 1 },

  flatList:   { height: VISUAL_HEIGHT, flexGrow: 0 },
  visualArea: {
    height: VISUAL_HEIGHT,
    width: W,
    justifyContent: 'center',
    padding: 20,
    borderBottomWidth: 1,
    marginTop: 60, // below topBar
  },

  bottomChrome: {
    flex: 1,
    paddingHorizontal: 22,
    paddingTop: 20,
    gap: 4,
  },
  eyebrow:    { fontSize: 10, fontWeight: '800', letterSpacing: 2 },
  headline:   { fontSize: 28, fontWeight: '900', color: '#FFFFFF', letterSpacing: 0.3, lineHeight: 33, marginTop: 2 },
  body:       { fontSize: 14, color: '#FFFFFF80', lineHeight: 21, marginTop: 4, flex: 1 },

  dotsRow:    { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8 },
  dot:        { height: 7, borderRadius: 3.5 },

  nextBtn:    { borderRadius: 14, overflow: 'hidden', marginTop: 10 },
  nextGrad:   { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 15 },
  nextText:   { fontSize: 14, fontWeight: '900', color: '#000', letterSpacing: 1 },

  stepCounter:{ fontSize: 11, color: '#FFFFFF35', textAlign: 'center', marginTop: 6 },

  // Halftone dots + corner marks — mirrors AuthHeader ComicHeader
  halftoneGrid: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    flexDirection: 'row', flexWrap: 'wrap', gap: 18, padding: 14,
    opacity: 0.5,
  },
  halftoneDot:  { width: 3, height: 3, borderRadius: 1.5, backgroundColor: '#FFD60025' },
  corner:       { position: 'absolute', width: 16, height: 16, borderColor: '#FFD600', opacity: 0.45 },
  cornerTL:     { top: 12, left: 12, borderTopWidth: 2, borderLeftWidth: 2, borderTopLeftRadius: 3 },
  cornerTR:     { top: 12, right: 12, borderTopWidth: 2, borderRightWidth: 2, borderTopRightRadius: 3 },
  cornerBL:     { bottom: 12, left: 12, borderBottomWidth: 2, borderLeftWidth: 2, borderBottomLeftRadius: 3 },
  cornerBR:     { bottom: 12, right: 12, borderBottomWidth: 2, borderRightWidth: 2, borderBottomRightRadius: 3 },
});
