import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  Modal,
  StyleSheet,
  Text,
  View,
} from 'react-native';

export const ANALYSIS_MESSAGES = [
  'Reading your film concept...',
  'Identifying narrative themes...',
  'Mapping character dynamics...',
  'Analysing story structure...',
  'Extracting core conflicts...',
  'Crafting opening concepts...',
  'Finalising your development plan...',
];

export const PLOT_MESSAGES = [
  'Mapping your story structure...',
  'Building Act One beats...',
  'Finding the midpoint turn...',
  'Crafting Act Two obstacles...',
  'Engineering the all-is-lost moment...',
  'Designing your climax...',
  'Finalising story beats...',
];

export const SCENE_MESSAGES = [
  'Setting the location...',
  'Establishing the tone and atmosphere...',
  'Writing the opening action block...',
  'Crafting the character entrance...',
  'Building the key exchange...',
  'Writing the scene out...',
  'Polishing your scene...',
];

interface ScreenplayLoaderProps {
  visible: boolean;
  messages: string[];
  title?: string;
}

const CARD_BG = '#F8F4EE';
const ACCENT = '#2D4A3E';
const GOLD = '#C4913A';
const DARK_OVERLAY = 'rgba(10, 8, 6, 0.88)';

export default function ScreenplayLoader({ visible, messages, title = 'DEVELOPING YOUR SCREENPLAY' }: ScreenplayLoaderProps) {
  const [msgIndex, setMsgIndex] = useState(0);
  const msgOpacity = useRef(new Animated.Value(1)).current;
  const iconScale = useRef(new Animated.Value(1)).current;
  const iconRotate = useRef(new Animated.Value(0)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;
  const stripAnim = useRef(new Animated.Value(0)).current;

  // Icon pulse loop
  useEffect(() => {
    if (!visible) return;
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(iconScale, { toValue: 1.08, duration: 900, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(iconScale, { toValue: 1.0, duration: 900, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, [visible]);

  // Film strip scroll loop
  useEffect(() => {
    if (!visible) return;
    const scroll = Animated.loop(
      Animated.timing(stripAnim, { toValue: 1, duration: 1800, easing: Easing.linear, useNativeDriver: true })
    );
    scroll.start();
    return () => { scroll.stop(); stripAnim.setValue(0); };
  }, [visible]);

  // Progress bar fills over total estimated duration
  useEffect(() => {
    if (!visible) { progressAnim.setValue(0); return; }
    Animated.timing(progressAnim, {
      toValue: 0.92,
      duration: messages.length * 2400,
      easing: Easing.out(Easing.quad),
      useNativeDriver: false,
    }).start();
    return () => { progressAnim.stopAnimation(); progressAnim.setValue(0); };
  }, [visible, messages.length]);

  // Cycle messages with crossfade
  useEffect(() => {
    if (!visible) { setMsgIndex(0); return; }
    let idx = 0;
    const cycle = () => {
      Animated.timing(msgOpacity, { toValue: 0, duration: 350, useNativeDriver: true }).start(() => {
        idx = (idx + 1) % messages.length;
        setMsgIndex(idx);
        Animated.timing(msgOpacity, { toValue: 1, duration: 350, useNativeDriver: true }).start();
      });
    };
    const interval = setInterval(cycle, 2400);
    return () => clearInterval(interval);
  }, [visible, messages.length]);

  const stripTranslate = stripAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -24],
  });

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  return (
    <Modal visible={visible} transparent animationType="fade" statusBarTranslucent>
      <View style={styles.overlay}>
        <View style={styles.card}>

          {/* ── Film strip top ───────────────────────────── */}
          <View style={styles.filmStrip}>
            <Animated.View style={[styles.filmStripInner, { transform: [{ translateX: stripTranslate }] }]}>
              {Array.from({ length: 16 }).map((_, i) => (
                <View key={i} style={styles.filmHole} />
              ))}
            </Animated.View>
          </View>

          {/* ── Icon ────────────────────────────────────── */}
          <View style={styles.iconArea}>
            <Animated.View style={[styles.iconOuter, { transform: [{ scale: iconScale }] }]}>
              <View style={styles.iconInner}>
                <Text style={styles.iconEmoji}>🎬</Text>
              </View>
            </Animated.View>
          </View>

          {/* ── Title ───────────────────────────────────── */}
          <Text style={styles.loaderTitle}>{title}</Text>

          {/* ── Cycling message ──────────────────────────── */}
          <Animated.View style={[styles.messageBox, { opacity: msgOpacity }]}>
            <Text style={styles.messageText}>{messages[msgIndex]}</Text>
          </Animated.View>

          {/* ── Progress bar ─────────────────────────────── */}
          <View style={styles.progressTrack}>
            <Animated.View style={[styles.progressFill, { width: progressWidth }]} />
          </View>

          {/* ── Film strip bottom ────────────────────────── */}
          <View style={styles.filmStrip}>
            <Animated.View style={[styles.filmStripInner, { transform: [{ translateX: stripTranslate }] }]}>
              {Array.from({ length: 16 }).map((_, i) => (
                <View key={i} style={styles.filmHole} />
              ))}
            </Animated.View>
          </View>

        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: DARK_OVERLAY,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  card: {
    backgroundColor: CARD_BG,
    borderRadius: 20,
    width: '100%',
    maxWidth: 340,
    alignItems: 'center',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.4,
    shadowRadius: 24,
    elevation: 20,
  },
  filmStrip: {
    width: '100%',
    height: 24,
    backgroundColor: '#1A1A1A',
    overflow: 'hidden',
    flexDirection: 'row',
    alignItems: 'center',
  },
  filmStripInner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 4,
    gap: 10,
    width: '200%',
  },
  filmHole: {
    width: 12,
    height: 12,
    borderRadius: 3,
    backgroundColor: '#444',
    borderWidth: 1,
    borderColor: '#555',
  },
  iconArea: {
    marginTop: 28,
    marginBottom: 16,
  },
  iconOuter: {
    width: 72,
    height: 72,
    borderRadius: 20,
    backgroundColor: ACCENT + '15',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: ACCENT + '30',
  },
  iconInner: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconEmoji: {
    fontSize: 34,
  },
  loaderTitle: {
    fontSize: 11,
    fontFamily: 'Inter_700Bold',
    color: ACCENT,
    letterSpacing: 1.5,
    textAlign: 'center',
    paddingHorizontal: 24,
    marginBottom: 20,
  },
  messageBox: {
    minHeight: 48,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  messageText: {
    fontSize: 16,
    fontFamily: 'Inter_400Regular',
    color: '#2A2016',
    textAlign: 'center',
    lineHeight: 24,
  },
  progressTrack: {
    width: '80%',
    height: 4,
    borderRadius: 2,
    backgroundColor: '#E5DDD0',
    marginBottom: 28,
    overflow: 'hidden',
  },
  progressFill: {
    height: 4,
    borderRadius: 2,
    backgroundColor: GOLD,
  },
});
