import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useSubscription } from '@/lib/revenuecat';

// ── Comic book palette (hardwired — intentionally separate from app themes) ───
const COMIC = {
  red: '#E8001C',
  yellow: '#FFD600',
  blue: '#0057A8',
  black: '#1A1410',
  white: '#FFFDE7',
  ink: '#111111',
};

// ── Ben-Day dot background ────────────────────────────────────────────────────
function DotGrid() {
  const dots: React.ReactElement[] = [];
  const cols = 16;
  const rows = 28;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      dots.push(
        <View
          key={`${r}-${c}`}
          style={{
            position: 'absolute',
            top: r * 22 + (c % 2 === 0 ? 0 : 11),
            left: c * 22,
            width: 5,
            height: 5,
            borderRadius: 3,
            backgroundColor: COMIC.yellow,
            opacity: 0.55,
          }}
        />
      );
    }
  }
  return (
    <View
      style={StyleSheet.absoluteFillObject}
      pointerEvents="none"
    >
      {dots}
    </View>
  );
}

// ── Starburst price badge ─────────────────────────────────────────────────────
function StarburstBadge({ price }: { price: string }) {
  return (
    <View style={styles.starburstWrap}>
      {/* Rotated squares behind give the jagged starburst feel */}
      {[0, 22.5, 45, 67.5].map((deg) => (
        <View
          key={deg}
          style={[
            styles.starburstLayer,
            { transform: [{ rotate: `${deg}deg` }] },
          ]}
        />
      ))}
      <View style={styles.starburstCircle}>
        <Text style={styles.starburstPrice}>{price}</Text>
        <Text style={styles.starburstPer}>/MONTH</Text>
      </View>
    </View>
  );
}

// ── Speech bubble caption ─────────────────────────────────────────────────────
function Caption({ text }: { text: string }) {
  return (
    <View style={styles.caption}>
      <Text style={styles.captionText}>{text}</Text>
    </View>
  );
}

export default function CharacterGenesisPaywall() {
  const insets = useSafeAreaInsets();
  const { isPurchasing, offerings, purchase } = useSubscription();
  const [error, setError] = useState<string | null>(null);

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
      router.back();
    } catch (err) {
      const e = err as { userCancelled?: boolean; message?: string };
      if (!e.userCancelled) setError(e.message ?? 'Purchase failed.');
    }
  };

  return (
    <View style={styles.root}>
      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          { paddingBottom: (Platform.OS === 'web' ? 34 : insets.bottom) + 24 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <DotGrid />

        {/* Close */}
        <TouchableOpacity
          style={styles.closeBtn}
          onPress={() => router.back()}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <Feather name="x" size={18} color={COMIC.black} />
        </TouchableOpacity>

        {/* Red header banner */}
        <View style={styles.banner}>
          <Text style={styles.bannerEyebrow}>⚡ ADD-ON</Text>
          <Text style={styles.bannerTitle}>CHARACTER{'\n'}GENESIS</Text>
          <Text style={styles.bannerSub}>
            BUILD ANY CHARACTER · COMIC BOOK GRADE
          </Text>
        </View>

        {/* Starburst price */}
        <View style={styles.starburstRow}>
          <StarburstBadge price={rcPrice} />
          <View style={styles.unlimitedBadge}>
            <Text style={styles.unlimitedLine1}>UNLIMITED</Text>
            <Text style={styles.unlimitedLine2}>NO CREDITS</Text>
            <Text style={styles.unlimitedLine3}>EVER.</Text>
          </View>
        </View>

        {/* Feature panels */}
        <View style={styles.panelGrid}>
          {[
            { emoji: '🧬', title: 'TRAIT ANALYZER', desc: 'Breaks down your answers into a full Character DNA profile' },
            { emoji: '⬛', title: 'SILHOUETTE ENGINE', desc: 'Clean reference silhouette — pure shape, zero distraction' },
            { emoji: '🧍', title: 'ANATOMY + SPECIES', desc: 'Full-body front-view character concept art, highly detailed' },
            { emoji: '🎬', title: '3D TURNAROUND', desc: 'Front / 3-quarter / side / back reference sheet' },
            { emoji: '🎨', title: 'TEXTURE + COSTUME', desc: 'Final cinematic render with materials, lighting, and energy FX' },
            { emoji: '🔄', title: 'EVOLUTION ENGINE', desc: 'Regenerate any stage — infinite variations of your character' },
          ].map((f) => (
            <View key={f.title} style={styles.featurePanel}>
              <Text style={styles.featurePanelEmoji}>{f.emoji}</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.featurePanelTitle}>{f.title}</Text>
                <Text style={styles.featurePanelDesc}>{f.desc}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Speech bubble caption */}
        <Caption text='"With great power comes unlimited character generation!"' />

        {error && (
          <View style={styles.errorRow}>
            <Feather name="alert-circle" size={13} color={COMIC.red} />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {/* CTA button */}
        <TouchableOpacity
          style={styles.unlockBtn}
          onPress={handleRCPurchase}
          disabled={isPurchasing || !rcPkg}
          activeOpacity={0.85}
        >
          {isPurchasing ? (
            <ActivityIndicator color={COMIC.white} />
          ) : (
            <>
              <Text style={styles.unlockBtnEmoji}>⚡</Text>
              <Text style={styles.unlockBtnText}>UNLOCK VIA APP STORE</Text>
              <Text style={styles.unlockBtnEmoji}>⚡</Text>
            </>
          )}
        </TouchableOpacity>

        <Text style={styles.legal}>
          Billed monthly · Cancel any time · Unlimited usage · No AI credits consumed
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: COMIC.white,
  },
  scroll: {
    paddingHorizontal: 20,
    paddingTop: 52,
  },
  closeBtn: {
    position: 'absolute',
    top: 12,
    right: 16,
    zIndex: 10,
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: COMIC.black,
    backgroundColor: COMIC.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Banner
  banner: {
    backgroundColor: COMIC.red,
    borderWidth: 4,
    borderColor: COMIC.black,
    borderRadius: 4,
    paddingVertical: 20,
    paddingHorizontal: 18,
    marginBottom: 24,
    shadowColor: COMIC.black,
    shadowOffset: { width: 5, height: 5 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 8,
    zIndex: 1,
  },
  bannerEyebrow: {
    fontFamily: 'Inter_700Bold',
    fontSize: 13,
    color: COMIC.yellow,
    letterSpacing: 3,
    marginBottom: 6,
  },
  bannerTitle: {
    fontFamily: 'Inter_700Bold',
    fontSize: 40,
    lineHeight: 42,
    color: COMIC.white,
    letterSpacing: 2,
    textShadowColor: COMIC.black,
    textShadowOffset: { width: 3, height: 3 },
    textShadowRadius: 0,
  },
  bannerSub: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 12,
    color: COMIC.yellow,
    letterSpacing: 2,
    marginTop: 10,
  },
  // Starburst
  starburstRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
    marginBottom: 28,
    zIndex: 1,
  },
  starburstWrap: {
    width: 110,
    height: 110,
    alignItems: 'center',
    justifyContent: 'center',
  },
  starburstLayer: {
    position: 'absolute',
    width: 88,
    height: 88,
    backgroundColor: COMIC.yellow,
    borderWidth: 2,
    borderColor: COMIC.black,
  },
  starburstCircle: {
    width: 78,
    height: 78,
    borderRadius: 39,
    backgroundColor: COMIC.yellow,
    borderWidth: 3,
    borderColor: COMIC.black,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  starburstPrice: {
    fontFamily: 'Inter_700Bold',
    fontSize: 22,
    color: COMIC.black,
    lineHeight: 24,
  },
  starburstPer: {
    fontFamily: 'Inter_700Bold',
    fontSize: 10,
    color: COMIC.black,
    letterSpacing: 1,
  },
  unlimitedBadge: {
    flex: 1,
    backgroundColor: COMIC.black,
    borderWidth: 3,
    borderColor: COMIC.black,
    borderRadius: 4,
    paddingVertical: 12,
    paddingHorizontal: 14,
    shadowColor: COMIC.black,
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 6,
  },
  unlimitedLine1: {
    fontFamily: 'Inter_700Bold',
    fontSize: 22,
    color: COMIC.yellow,
    letterSpacing: 1,
  },
  unlimitedLine2: {
    fontFamily: 'Inter_700Bold',
    fontSize: 14,
    color: COMIC.white,
    letterSpacing: 2,
  },
  unlimitedLine3: {
    fontFamily: 'Inter_700Bold',
    fontSize: 20,
    color: COMIC.red,
    letterSpacing: 3,
  },
  // Feature panels grid
  panelGrid: {
    gap: 10,
    marginBottom: 24,
    zIndex: 1,
  },
  featurePanel: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    backgroundColor: COMIC.white,
    borderWidth: 3,
    borderColor: COMIC.black,
    borderRadius: 2,
    padding: 12,
    shadowColor: COMIC.black,
    shadowOffset: { width: 3, height: 3 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 4,
  },
  featurePanelEmoji: { fontSize: 22, lineHeight: 28 },
  featurePanelTitle: {
    fontFamily: 'Inter_700Bold',
    fontSize: 13,
    color: COMIC.black,
    letterSpacing: 1,
    marginBottom: 2,
  },
  featurePanelDesc: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    color: '#444',
    lineHeight: 17,
    flex: 1,
  },
  // Speech bubble
  caption: {
    backgroundColor: COMIC.white,
    borderWidth: 3,
    borderColor: COMIC.black,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginBottom: 20,
    zIndex: 1,
    shadowColor: COMIC.black,
    shadowOffset: { width: 3, height: 3 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 4,
  },
  captionText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 14,
    color: COMIC.black,
    fontStyle: 'italic',
    textAlign: 'center',
  },
  // Error
  errorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 10,
  },
  errorText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
    color: COMIC.red,
    flex: 1,
  },
  // CTA button
  unlockBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COMIC.red,
    borderWidth: 3,
    borderColor: COMIC.black,
    borderRadius: 4,
    paddingVertical: 16,
    paddingHorizontal: 20,
    gap: 8,
    shadowColor: COMIC.black,
    shadowOffset: { width: 5, height: 5 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 8,
    zIndex: 1,
  },
  unlockBtnEmoji: { fontSize: 18 },
  unlockBtnText: {
    fontFamily: 'Inter_700Bold',
    fontSize: 16,
    color: COMIC.white,
    letterSpacing: 2,
  },
  legal: {
    fontFamily: 'Inter_400Regular',
    fontSize: 11,
    color: '#666',
    textAlign: 'center',
    marginTop: 14,
    lineHeight: 17,
    zIndex: 1,
  },
});
