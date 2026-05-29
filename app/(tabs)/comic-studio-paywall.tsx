import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useSubscription } from '@/lib/revenuecat';

// ── Palette ───────────────────────────────────────────────────────────────────
const C = {
  bg:     '#0A0806',
  bgMid:  '#14100A',
  bgCard: '#1A1510',
  border: '#FFD60040',
  gold:   '#FFD600',
  gold2:  '#FF9500',
  goldDim:'#FFD60070',
  white:  '#FFFFFF',
  muted:  '#FFFFFF50',
  error:  '#DC2626',
};

// ── Halftone dots ─────────────────────────────────────────────────────────────
function HalftoneDots() {
  return (
    <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
      <View style={s.halftoneGrid}>
        {Array.from({ length: 80 }).map((_, i) => (
          <View key={i} style={s.halftoneDot} />
        ))}
      </View>
    </View>
  );
}

// ── Feature row ───────────────────────────────────────────────────────────────
const FEATURES = [
  { icon: '🎬', title: 'AI PANEL ENGINE',     desc: 'Generate cinematic panels from scene text using 22 composition presets' },
  { icon: '🧬', title: 'CHARACTER GENESIS',   desc: 'Full DNA: silhouette, anatomy, 3D turnaround, texture render & evolution' },
  { icon: '💬', title: 'SPEECH BUBBLE AI',    desc: 'Auto-placed speech, thought, shout & caption boxes — avoids faces' },
  { icon: '🎨', title: '5 STUDIO THEMES',     desc: 'Neo Tokyo · Golden Age · Noir · Creator Loft · Cosmic Lab' },
  { icon: '🤖', title: 'AI SIDEKICK',         desc: 'Live pacing tips, dramatic angles, dialogue rhythm & noir lighting notes' },
  { icon: '📐', title: 'PAGE FLOW ENGINE',    desc: 'Six layouts that guide your reader\'s eye. Score readability before you ink.' },
  { icon: '📤', title: 'EXPORT ENGINE',       desc: 'PDF webtoon, panel share, or full Character DNA reference sheet' },
];

export default function ComicStudioPaywall() {
  const insets = useSafeAreaInsets();
  const { isPurchasing, offerings, purchase } = useSubscription();
  const [error, setError] = useState<string | null>(null);

  const glowAnim = useRef(new Animated.Value(0.6)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, { toValue: 1, duration: 1200, useNativeDriver: true }),
        Animated.timing(glowAnim, { toValue: 0.6, duration: 1200, useNativeDriver: true }),
      ])
    ).start();
  }, [glowAnim]);

  const rcPkg = offerings?.current?.availablePackages.find(
    (p) => p.packageType === 'MONTHLY'
  );
  const rcPrice = rcPkg?.product.priceString ?? '$9.99';

  const handleRCPurchase = async () => {
    if (!rcPkg) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    setError(null);
    try {
      await purchase(rcPkg);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.replace('/(tabs)/comic-art-studio' as never);
    } catch (err) {
      const e = err as { userCancelled?: boolean; message?: string };
      if (!e.userCancelled) setError(e.message ?? 'Purchase failed.');
    }
  };

  const topPad = Platform.OS === 'web' ? 52 : insets.top + 16;
  const botPad = Platform.OS === 'web' ? 34 : insets.bottom + 24;

  return (
    <View style={s.root}>
      <HalftoneDots />

      {/* Close button */}
      <TouchableOpacity
        style={[s.closeBtn, { top: topPad - 8 }]}
        onPress={() => router.back()}
        hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
      >
        <Feather name="x" size={16} color={C.goldDim} />
      </TouchableOpacity>

      <ScrollView
        contentContainerStyle={[s.scroll, { paddingTop: topPad, paddingBottom: botPad }]}
        showsVerticalScrollIndicator={false}
      >

        {/* ── Hero header ─────────────────────────────────────────────────── */}
        <LinearGradient
          colors={[C.bgMid, C.bg]}
          style={s.hero}
          start={{ x: 0.2, y: 0 }}
          end={{ x: 0.8, y: 1 }}
        >
          {/* Corner marks */}
          <View style={[s.corner, s.cornerTL]} />
          <View style={[s.corner, s.cornerTR]} />
          <View style={[s.corner, s.cornerBL]} />
          <View style={[s.corner, s.cornerBR]} />

          <Text style={s.heroEyebrow}>✦ BLOOMSCRIPT PRESENTS</Text>
          <Text style={s.heroTitle}>COMIC ART{'\n'}STUDIO</Text>
          <Text style={s.heroSub}>YOUR IMMERSIVE CREATIVE UNIVERSE</Text>

          {/* Price badge */}
          <Animated.View style={[s.priceBadge, { opacity: glowAnim }]}>
            <LinearGradient
              colors={[C.gold, C.gold2]}
              style={s.priceBadgeGrad}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <Text style={s.priceAmount}>{rcPrice}</Text>
              <Text style={s.pricePer}>/MONTH</Text>
            </LinearGradient>
          </Animated.View>

          <View style={s.heroTagRow}>
            {['UNLIMITED ACCESS', 'NO AI CREDITS', 'CANCEL ANYTIME'].map((tag) => (
              <View key={tag} style={s.heroTag}>
                <Feather name="check" size={9} color={C.gold} />
                <Text style={s.heroTagText}>{tag}</Text>
              </View>
            ))}
          </View>
        </LinearGradient>

        {/* ── Feature panels ──────────────────────────────────────────────── */}
        <View style={s.featureGrid}>
          {FEATURES.map((f) => (
            <View key={f.title} style={s.featureCard}>
              <Text style={s.featureEmoji}>{f.icon}</Text>
              <View style={{ flex: 1 }}>
                <Text style={s.featureTitle}>{f.title}</Text>
                <Text style={s.featureDesc}>{f.desc}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* ── Quote ───────────────────────────────────────────────────────── */}
        <View style={s.quoteCard}>
          <View style={[s.corner, s.cornerTL]} />
          <View style={[s.corner, s.cornerBR]} />
          <Text style={s.quoteText}>
            "Every artist was first an amateur.{'\n'}Now you have AI."
          </Text>
          <Text style={s.quoteAuthor}>— BloomScript</Text>
        </View>

        {/* ── Error ───────────────────────────────────────────────────────── */}
        {error && (
          <View style={s.errorRow}>
            <Feather name="alert-circle" size={13} color={C.error} />
            <Text style={s.errorText}>{error}</Text>
          </View>
        )}

        {/* ── CTA button ──────────────────────────────────────────────────── */}
        <TouchableOpacity
          style={s.btnWrap}
          onPress={handleRCPurchase}
          disabled={isPurchasing || !rcPkg}
          activeOpacity={0.85}
        >
          <LinearGradient
            colors={[C.gold, C.gold2]}
            style={s.btnGrad}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            {isPurchasing ? (
              <ActivityIndicator color="#000" />
            ) : (
              <>
                <Text style={s.btnEmoji}>⚡</Text>
                <Text style={s.btnText}>ENTER STUDIO · APP STORE</Text>
                <Text style={s.btnEmoji}>⚡</Text>
              </>
            )}
          </LinearGradient>
        </TouchableOpacity>

        <Text style={s.legal}>
          Billed monthly · Cancel any time · Full studio access · No AI credits
        </Text>
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },

  // Halftone
  halftoneGrid: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    flexDirection: 'row', flexWrap: 'wrap', gap: 22, padding: 16, opacity: 0.5,
  },
  halftoneDot: { width: 3, height: 3, borderRadius: 1.5, backgroundColor: '#FFD60018' },

  // Corner marks
  corner:    { position: 'absolute', width: 14, height: 14, borderColor: C.goldDim, opacity: 0.7 },
  cornerTL:  { top: 12, left: 12, borderTopWidth: 1.5, borderLeftWidth: 1.5, borderTopLeftRadius: 2 },
  cornerTR:  { top: 12, right: 12, borderTopWidth: 1.5, borderRightWidth: 1.5, borderTopRightRadius: 2 },
  cornerBL:  { bottom: 12, left: 12, borderBottomWidth: 1.5, borderLeftWidth: 1.5, borderBottomLeftRadius: 2 },
  cornerBR:  { bottom: 12, right: 12, borderBottomWidth: 1.5, borderRightWidth: 1.5, borderBottomRightRadius: 2 },

  closeBtn: {
    position: 'absolute', right: 18, zIndex: 20,
    width: 34, height: 34, borderRadius: 17,
    backgroundColor: '#FFD60015', borderWidth: 1, borderColor: C.border,
    alignItems: 'center', justifyContent: 'center',
  },

  scroll: { paddingHorizontal: 20 },

  // Hero
  hero: {
    borderRadius: 18, borderWidth: 1.5, borderColor: C.border,
    paddingVertical: 28, paddingHorizontal: 22,
    alignItems: 'center', gap: 10,
    marginBottom: 20, overflow: 'hidden',
    position: 'relative',
    ...Platform.select({
      ios: { shadowColor: C.gold, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.2, shadowRadius: 20 },
      android: { elevation: 10 },
    }),
  },
  heroEyebrow: {
    fontSize: 10, fontFamily: 'Inter_700Bold',
    color: C.goldDim, letterSpacing: 2.5,
  },
  heroTitle: {
    fontSize: 46, fontFamily: 'Inter_700Bold',
    color: C.white, letterSpacing: 2, lineHeight: 50,
    textAlign: 'center',
  },
  heroSub: {
    fontSize: 10, fontFamily: 'Inter_600SemiBold',
    color: C.muted, letterSpacing: 2, textAlign: 'center',
  },
  priceBadge: { marginTop: 4 },
  priceBadgeGrad: {
    flexDirection: 'row', alignItems: 'baseline', gap: 4,
    paddingHorizontal: 22, paddingVertical: 10, borderRadius: 12,
    ...Platform.select({
      ios: { shadowColor: C.gold, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.5, shadowRadius: 10 },
      android: { elevation: 6 },
    }),
  },
  priceAmount: { fontSize: 32, fontFamily: 'Inter_700Bold', color: '#000' },
  pricePer:    { fontSize: 12, fontFamily: 'Inter_700Bold', color: '#00000070', letterSpacing: 1 },
  heroTagRow:  { flexDirection: 'row', gap: 10, flexWrap: 'wrap', justifyContent: 'center', marginTop: 4 },
  heroTag: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 8, paddingVertical: 3,
    backgroundColor: '#FFD60012', borderWidth: 1, borderColor: '#FFD60030', borderRadius: 6,
  },
  heroTagText: { fontSize: 9, fontFamily: 'Inter_700Bold', color: C.goldDim, letterSpacing: 1 },

  // Features
  featureGrid: { gap: 8, marginBottom: 20 },
  featureCard: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 12,
    backgroundColor: C.bgCard,
    borderWidth: 1, borderColor: '#FFD60025',
    borderRadius: 12, padding: 14,
  },
  featureEmoji: { fontSize: 22, lineHeight: 28, width: 32 },
  featureTitle: {
    fontFamily: 'Inter_700Bold', fontSize: 11,
    color: C.gold, letterSpacing: 1, marginBottom: 3,
  },
  featureDesc: {
    fontFamily: 'Inter_400Regular', fontSize: 12,
    color: '#FFFFFFAA', lineHeight: 17,
  },

  // Quote
  quoteCard: {
    borderWidth: 1, borderColor: C.border, borderRadius: 14,
    paddingVertical: 18, paddingHorizontal: 20,
    marginBottom: 24, alignItems: 'center',
    position: 'relative', overflow: 'hidden',
  },
  quoteText: {
    fontFamily: 'Inter_600SemiBold', fontSize: 14,
    color: '#FFFFFFCC', fontStyle: 'italic',
    textAlign: 'center', lineHeight: 22,
  },
  quoteAuthor: {
    fontFamily: 'Inter_400Regular', fontSize: 11,
    color: C.goldDim, marginTop: 8, letterSpacing: 1,
  },

  // Error
  errorRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 10 },
  errorText: { fontFamily: 'Inter_400Regular', fontSize: 13, color: C.error, flex: 1 },

  // Buttons
  btnWrap: { borderRadius: 14, overflow: 'hidden' },
  btnGrad: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, paddingVertical: 17,
    ...Platform.select({
      ios: { shadowColor: C.gold, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.45, shadowRadius: 12 },
      android: { elevation: 8 },
    }),
  },
  btnEmoji: { fontSize: 16 },
  btnText: { fontFamily: 'Inter_700Bold', fontSize: 14, color: '#000', letterSpacing: 1.5 },

  legal: {
    fontFamily: 'Inter_400Regular', fontSize: 11,
    color: '#FFFFFF35', textAlign: 'center',
    marginTop: 16, lineHeight: 17,
  },
});
