import { Feather } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { SHOWCASE_SEEN_KEY } from '@/app/(tabs)/comic-showcase';
import React, { useEffect, useRef, useState } from 'react';
import { useAuth } from '@clerk/expo';
import {
  Animated,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';
import { useCinematicDevice, useCinematicInsets, useCinematicSpacing, useCinematicType } from '@/hooks/useCinematicDevice';

// ── Studio Themes ─────────────────────────────────────────────────────────────
type ThemeKey = 'NEO_TOKYO' | 'GOLDEN_AGE' | 'NOIR_STUDIO' | 'CREATOR_LOFT' | 'COSMIC_LAB';

const THEMES: Record<ThemeKey, {
  label: string;
  emoji: string;
  bg: string;
  panel: string;
  accent: string;
  text: string;
  muted: string;
  border: string;
  glow: string;
}> = {
  NEO_TOKYO: {
    label: 'Neo Tokyo',
    emoji: '⚡',
    bg: '#0D0D1A',
    panel: '#14142B',
    accent: '#00E5FF',
    text: '#E0E0FF',
    muted: '#7070A0',
    border: '#2A2A4A',
    glow: '#00E5FF',
  },
  GOLDEN_AGE: {
    label: 'Golden Age',
    emoji: '🌟',
    bg: '#FFF8E7',
    panel: '#FFF0C0',
    accent: '#C8841A',
    text: '#2A1A00',
    muted: '#7A6040',
    border: '#E0C870',
    glow: '#FFD600',
  },
  NOIR_STUDIO: {
    label: 'Noir Studio',
    emoji: '🎬',
    bg: '#0A0A0A',
    panel: '#141414',
    accent: '#FFFFFF',
    text: '#EEEEEE',
    muted: '#666666',
    border: '#2A2A2A',
    glow: '#FFFFFF',
  },
  CREATOR_LOFT: {
    label: 'Creator Loft',
    emoji: '🍃',
    bg: '#F4F1EA',
    panel: '#EAE5D8',
    accent: '#2D4A3E',
    text: '#1A2A24',
    muted: '#6A8070',
    border: '#C8C0A8',
    glow: '#5A8C70',
  },
  COSMIC_LAB: {
    label: 'Cosmic Lab',
    emoji: '🔭',
    bg: '#060B18',
    panel: '#0C1428',
    accent: '#9B5DE5',
    text: '#D8C8FF',
    muted: '#5A4A80',
    border: '#1E1A3A',
    glow: '#9B5DE5',
  },
};

// ── AI Sidekick suggestions ───────────────────────────────────────────────────
const AI_SUGGESTIONS = [
  '💡 Try a cinematic low-angle shot for the hero entrance — adds dramatic tension instantly.',
  '🎭 Break the next dialogue scene into 3 rapid-fire close-up panels for urgency.',
  '🌑 Noir lighting tip: one strong light source from below creates instant menace.',
  '📐 Use the Wally Wood "two-shot" preset — characters shoulder-to-shoulder feels intimate and tense.',
  '💬 Switch your next speech bubble to a SHOUT type — vary bubble shapes to pace the reader.',
  '🔄 Consider a silent panel before the reveal — white space builds suspense.',
  '🎨 Golden Age palette: red + yellow + blue primary triad creates maximum visual punch.',
  '⚡ A speed-line background transforms any action panel into a kinetic explosion.',
  '🧬 Build your antagonist with Character Genesis — a strong silhouette beats a detailed face.',
  '🎞️ Pan shot across 3 panels to create a cinematic widescreen effect on mobile.',
  '🌆 Establish your scene with a wide establishing shot, then cut tight — classic Eisner technique.',
  '✍️ Splash page rule: one panel, one page — save it for the most powerful beat in the issue.',
];

// ── Tool launcher items ───────────────────────────────────────────────────────
type FeatherName = React.ComponentProps<typeof Feather>['name'];

const TOOLS: {
  id: string;
  emoji: string;
  label: string;
  sublabel: string;
  icon: FeatherName;
  route: string;
  hot?: boolean;
}[] = [
  {
    id: 'projects',
    emoji: '🗂',
    label: 'Production Studio',
    sublabel: 'Projects · Characters · Continuity',
    icon: 'folder',
    route: '/(tabs)/comic-projects',
    hot: true,
  },
  {
    id: 'director',
    emoji: '🎬',
    label: 'Panel Director',
    sublabel: 'Cinematography · Lens · AI Generate',
    icon: 'film',
    route: '/(tabs)/panel-director',
    hot: true,
  },
  {
    id: 'page-flow',
    emoji: '📐',
    label: 'Page Flow Engine',
    sublabel: 'Z-Pattern · 6 layouts · Eye Flow AI',
    icon: 'layout',
    route: '/(tabs)/panel-page',
    hot: true,
  },
  {
    id: 'story-pages',
    emoji: '📖',
    label: 'Page Pipeline',
    sublabel: 'Sequential pages · Story continuity',
    icon: 'book',
    route: '/(tabs)/story-pages',
  },
  {
    id: 'character',
    emoji: '🧬',
    label: 'Character Genesis',
    sublabel: 'DNA · Silhouette · Turnaround',
    icon: 'user',
    route: '/(tabs)/character-genesis',
  },
  {
    id: 'consistency',
    emoji: '🔒',
    label: 'Consistency Engine',
    sublabel: 'Auto-gen · Style lock · DNA',
    icon: 'shield',
    route: '/(tabs)/character-consistency',
  },
  {
    id: 'checker',
    emoji: '⚠️',
    label: 'Consistency Checker',
    sublabel: 'Panel vs DNA · AI warnings · Lock',
    icon: 'alert-triangle',
    route: '/(tabs)/consistency-checker',
    hot: true,
  },
  {
    id: 'poses',
    emoji: '🧌',
    label: 'Pose Library',
    sublabel: '110+ poses · Silhouettes · AI metadata',
    icon: 'grid',
    route: '/(tabs)/pose-browser',
    hot: true,
  },
  {
    id: 'bubbles',
    emoji: '💬',
    label: 'Speech Bubbles',
    sublabel: 'Speech · Thought · Shout · Caption',
    icon: 'message-square',
    route: '/(tabs)/comic-panel',
  },
  {
    id: 'export',
    emoji: '📤',
    label: 'Export Studio',
    sublabel: 'PDF · Webtoon · Share',
    icon: 'share-2',
    route: '/(tabs)/comic-panel',
  },
  {
    id: 'ai-director',
    emoji: '🎬',
    label: 'AI Director',
    sublabel: 'Master Orchestration · All Systems · One Engine',
    icon: 'layers',
    route: '/(tabs)/ai-director',
    hot: true,
  },
  {
    id: 'style-interpreter',
    emoji: '🧠',
    label: 'Style Interpreter',
    sublabel: 'Genre · Mood · Render Engine · Fusion',
    icon: 'cpu',
    route: '/(tabs)/style-interpreter',
    hot: true,
  },
  {
    id: 'library',
    emoji: '📚',
    label: 'My Comic Library',
    sublabel: 'All issues & chapters',
    icon: 'book-open',
    route: '/(tabs)/',
  },
];

// ── Utilized modules (replaces Coming Soon) ───────────────────────────────────

export default function ComicArtStudio() {
  const { width: screenWidth } = useWindowDimensions();
  const isTablet = screenWidth >= 768;
  const { signOut } = useAuth();

  const device = useCinematicDevice();
  const cinInsets = useCinematicInsets();
  const spacing = useCinematicSpacing();
  const type = useCinematicType();
  const isPhone = device.form === 'phone';

  const [currentTheme, setCurrentTheme] = useState<ThemeKey>('NEO_TOKYO');
  const [suggestionIdx, setSuggestionIdx] = useState(0);
  const [sidekickVisible, setSidekickVisible] = useState(true);

  const theme = THEMES[currentTheme];

  const pulseAnim = useRef(new Animated.Value(1)).current;
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;

  // First-launch showcase
  useEffect(() => {
    AsyncStorage.getItem(SHOWCASE_SEEN_KEY).then(v => {
      if (!v) router.push('/(tabs)/comic-showcase' as never);
    });
  }, []);

  // Pulse the glow on the header
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.03, duration: 1400, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 1400, useNativeDriver: true }),
      ])
    ).start();
  }, [pulseAnim]);

  // Rotate AI suggestions every 6s
  useEffect(() => {
    const timer = setInterval(() => {
      Animated.sequence([
        Animated.timing(fadeAnim, { toValue: 0, duration: 250, useNativeDriver: true }),
        Animated.timing(slideAnim, { toValue: -10, duration: 0, useNativeDriver: true }),
      ]).start(() => {
        setSuggestionIdx((i) => (i + 1) % AI_SUGGESTIONS.length);
        Animated.parallel([
          Animated.timing(fadeAnim, { toValue: 1, duration: 350, useNativeDriver: true }),
          Animated.timing(slideAnim, { toValue: 0, duration: 350, useNativeDriver: true }),
        ]).start();
      });
    }, 6000);
    return () => clearInterval(timer);
  }, [fadeAnim, slideAnim]);

  const nextSuggestion = () => {
    Haptics.selectionAsync();
    Animated.timing(fadeAnim, { toValue: 0, duration: 200, useNativeDriver: true }).start(() => {
      setSuggestionIdx((i) => (i + 1) % AI_SUGGESTIONS.length);
      Animated.timing(fadeAnim, { toValue: 1, duration: 300, useNativeDriver: true }).start();
    });
  };

  const switchTheme = (key: ThemeKey) => {
    Haptics.selectionAsync();
    setCurrentTheme(key);
  };

  const handleTool = (route: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push(route as never);
  };

  const topPad = Platform.OS === 'web' ? 16 : cinInsets.top + 8;
  const bottomPad = Platform.OS === 'web' ? 34 : cinInsets.bottom + 20;
  const contentPad = isTablet ? Math.max(20, (screenWidth - 680) / 2) : cinInsets.horizontal;

  return (
    <View style={[styles.root, { backgroundColor: theme.bg }]}>
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingTop: topPad, paddingBottom: bottomPad, paddingHorizontal: contentPad }]}
        showsVerticalScrollIndicator={false}
      >

        {/* ── Header ── */}
        <View style={styles.headerRow}>
          <TouchableOpacity
            onPress={() => { Haptics.selectionAsync(); router.back(); }}
            style={[styles.backBtn, { borderColor: theme.border, backgroundColor: theme.panel }]}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Feather name="arrow-left" size={18} color={theme.text} />
          </TouchableOpacity>
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={[styles.headerEyebrow, { color: theme.accent }]}>BLOOMSCRIPT</Text>
            <Animated.Text
              style={[styles.headerTitle, { color: theme.text, transform: [{ scale: pulseAnim }] }]}
            >
              COMIC ART STUDIO
            </Animated.Text>
          </View>
          <View style={[styles.themeBadge, { backgroundColor: theme.accent + '20', borderColor: theme.accent + '50' }]}>
            <Text style={{ fontSize: 14 }}>{theme.emoji}</Text>
            <Text style={[styles.themeBadgeLabel, { color: theme.accent }]}>{theme.label}</Text>
          </View>
          <TouchableOpacity
            onPress={() => { Haptics.selectionAsync(); signOut(); }}
            style={[styles.backBtn, { borderColor: theme.border, backgroundColor: theme.panel, marginLeft: 8 }]}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Feather name="log-out" size={16} color={theme.muted} />
          </TouchableOpacity>
        </View>

        {/* ── Theme switcher ── */}
        <View style={[styles.themeCard, { backgroundColor: theme.panel, borderColor: theme.border }]}>
          <Text style={[styles.sectionLabel, { color: theme.muted }]}>STUDIO THEME</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.themeRow}>
            {(Object.entries(THEMES) as [ThemeKey, typeof THEMES[ThemeKey]][]).map(([key, t]) => (
              <TouchableOpacity
                key={key}
                onPress={() => switchTheme(key)}
                style={[
                  styles.themeChip,
                  {
                    backgroundColor: currentTheme === key ? theme.accent : theme.bg,
                    borderColor: currentTheme === key ? theme.accent : theme.border,
                  },
                ]}
                activeOpacity={0.8}
              >
                <Text style={{ fontSize: 14 }}>{t.emoji}</Text>
                <Text style={[
                  styles.themeChipLabel,
                  { color: currentTheme === key ? theme.bg : theme.muted },
                ]}>
                  {t.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* ── AI Sidekick ── */}
        {sidekickVisible && (
          <View style={[styles.sidekickCard, { backgroundColor: theme.panel, borderColor: theme.accent + '50' }]}>
            <View style={styles.sidekickHeader}>
              <View style={[styles.sidekickDot, { backgroundColor: theme.accent }]} />
              <Text style={[styles.sidekickTitle, { color: theme.accent }]}>AI SIDEKICK</Text>
              <Text style={[styles.sidekickCounter, { color: theme.muted }]}>
                {suggestionIdx + 1} / {AI_SUGGESTIONS.length}
              </Text>
              <TouchableOpacity
                onPress={() => setSidekickVisible(false)}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Feather name="x" size={14} color={theme.muted} />
              </TouchableOpacity>
            </View>
            <Animated.Text
              style={[styles.sidekickText, { color: theme.text, opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}
            >
              {AI_SUGGESTIONS[suggestionIdx]}
            </Animated.Text>
            <TouchableOpacity
              onPress={nextSuggestion}
              style={[styles.sidekickNextBtn, { borderColor: theme.accent + '40' }]}
              activeOpacity={0.7}
            >
              <Feather name="refresh-cw" size={12} color={theme.accent} />
              <Text style={[styles.sidekickNextLabel, { color: theme.accent }]}>Next tip</Text>
            </TouchableOpacity>
          </View>
        )}

        {!sidekickVisible && (
          <TouchableOpacity
            onPress={() => { Haptics.selectionAsync(); setSidekickVisible(true); }}
            style={[styles.sidekickRestoreBtn, { backgroundColor: theme.panel, borderColor: theme.accent + '40' }]}
            activeOpacity={0.8}
          >
            <Feather name="zap" size={13} color={theme.accent} />
            <Text style={[styles.sidekickRestoreLabel, { color: theme.accent }]}>Show AI Sidekick</Text>
          </TouchableOpacity>
        )}

        {/* ── Tool Launcher ── */}
        <Text style={[styles.sectionLabel, { color: theme.muted, marginBottom: 10 }]}>STUDIO TOOLS</Text>
        <View style={isTablet ? styles.toolGridTablet : styles.toolGrid}>
          {TOOLS.map((tool) => (
            <TouchableOpacity
              key={tool.id}
              style={[
                isTablet ? styles.toolCardTablet : styles.toolCard,
                { backgroundColor: theme.panel, borderColor: theme.border },
                tool.hot && { borderColor: theme.accent + '80', borderWidth: 2 },
              ]}
              onPress={() => handleTool(tool.route)}
              activeOpacity={0.8}
            >
              {tool.hot && (
                <View style={[styles.hotBadge, { backgroundColor: theme.accent }]}>
                  <Text style={[styles.hotBadgeText, { color: theme.bg }]}>HOT</Text>
                </View>
              )}
              <Text style={styles.toolEmoji}>{tool.emoji}</Text>
              <Text style={[styles.toolLabel, { color: theme.text }]}>{tool.label}</Text>
              <Text style={[styles.toolSublabel, { color: theme.muted }]} numberOfLines={1}>{tool.sublabel}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* ── Storyboard Timeline (visual) ── */}
        <View style={[styles.storyboardCard, { backgroundColor: theme.panel, borderColor: theme.border }]}>
          <View style={styles.sidekickHeader}>
            <Feather name="film" size={14} color={theme.accent} />
            <Text style={[styles.sectionLabel, { color: theme.accent, marginBottom: 0 }]}>STORYBOARD TIMELINE</Text>
          </View>
          <Text style={[styles.storyboardSub, { color: theme.muted }]}>
            Cinematic story flow · Emotional graph · Scene timing · Dialogue rhythm
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 12 }}>
            {['ACT I\nSetup', 'ACT II\nConflict', 'CLIMAX\nTension', 'RESOLUTION\nRelease', 'EPILOGUE\nEcho'].map((label, i) => (
              <View key={i} style={{ alignItems: 'center', marginRight: 10 }}>
                <View style={[
                  styles.timelineNode,
                  {
                    backgroundColor: i <= 2 ? theme.accent : theme.bg,
                    borderColor: theme.accent,
                  },
                ]}>
                  <Text style={[styles.timelineNum, { color: i <= 2 ? theme.bg : theme.muted }]}>{i + 1}</Text>
                </View>
                {i < 4 && (
                  <View style={[styles.timelineLine, { backgroundColor: i < 2 ? theme.accent : theme.border }]} />
                )}
                <Text style={[styles.timelineLabel, { color: theme.muted }]}>{label}</Text>
              </View>
            ))}
          </ScrollView>
        </View>

        {/* ── Footer ── */}
        <View style={[styles.footer, { borderTopColor: theme.border }]}>
          <Text style={[styles.footerText, { color: theme.muted }]}>
            BloomScript Novels Scripts Comic Production · Every artist was first an amateur.
          </Text>
        </View>

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: {},
  headerRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerEyebrow: {
    fontFamily: 'Inter_700Bold',
    fontSize: 10,
    letterSpacing: 3,
    marginBottom: 1,
  },
  headerTitle: {
    fontFamily: 'Inter_700Bold',
    fontSize: 22,
    letterSpacing: 1,
    lineHeight: 26,
  },
  themeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
  },
  themeBadgeLabel: { fontFamily: 'Inter_600SemiBold', fontSize: 11 },
  sectionLabel: {
    fontFamily: 'Inter_700Bold',
    fontSize: 10,
    letterSpacing: 2,
    marginBottom: 8,
  },
  themeCard: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    marginBottom: 14,
  },
  themeRow: { gap: 8 },
  themeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
  },
  themeChipLabel: { fontFamily: 'Inter_600SemiBold', fontSize: 12 },
  sidekickCard: {
    borderRadius: 12,
    borderWidth: 1.5,
    padding: 14,
    marginBottom: 14,
  },
  sidekickHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 },
  sidekickDot: { width: 7, height: 7, borderRadius: 4 },
  sidekickTitle: { fontFamily: 'Inter_700Bold', fontSize: 10, letterSpacing: 2, flex: 1 },
  sidekickCounter: { fontFamily: 'Inter_400Regular', fontSize: 11 },
  sidekickText: { fontFamily: 'Inter_400Regular', fontSize: 14, lineHeight: 21 },
  sidekickNextBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    alignSelf: 'flex-end',
    marginTop: 10,
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 20,
    borderWidth: 1,
  },
  sidekickNextLabel: { fontFamily: 'Inter_600SemiBold', fontSize: 12 },
  sidekickRestoreBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: 20,
    borderWidth: 1,
    marginBottom: 14,
  },
  sidekickRestoreLabel: { fontFamily: 'Inter_600SemiBold', fontSize: 12 },
  toolGrid: {
    flexDirection: 'column',
    gap: 14,
    marginBottom: 16,
  },
  toolGridTablet: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 14,
  },
  toolCard: {
    width: '100%',
    borderRadius: 18,
    borderWidth: 1,
    paddingHorizontal: 20,
    paddingVertical: 18,
    position: 'relative',
    overflow: 'hidden',
    minHeight: 110,
  },
  toolCardTablet: {
    width: '47%',
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
  },
  hotBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 5,
  },
  hotBadgeText: { fontFamily: 'Inter_700Bold', fontSize: 10, letterSpacing: 1 },
  toolEmoji: { fontSize: 32, marginBottom: 10 },
  toolLabel: { fontFamily: 'Inter_700Bold', fontSize: 16, marginBottom: 4, lineHeight: 20 },
  toolSublabel: { fontFamily: 'Inter_400Regular', fontSize: 13, lineHeight: 18, marginTop: 2 },
  storyboardCard: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 14,
    marginBottom: 16,
  },
  storyboardSub: { fontFamily: 'Inter_400Regular', fontSize: 12, lineHeight: 17, marginTop: 4 },
  timelineNode: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  timelineNum: { fontFamily: 'Inter_700Bold', fontSize: 13 },
  timelineLine: {
    width: 40,
    height: 2,
    position: 'absolute',
    left: 36,
    top: 17,
  },
  timelineLabel: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 9,
    textAlign: 'center',
    lineHeight: 13,
    marginTop: 4,
    maxWidth: 56,
  },
  footer: { borderTopWidth: 1, paddingTop: 20, marginTop: 20 },
  footerText: { fontFamily: 'Inter_400Regular', fontSize: 11, textAlign: 'center', lineHeight: 17 },
});
