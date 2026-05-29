import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useState } from 'react';
import {
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import AppLogo from './AppLogo';

// ── Palette ────────────────────────────────────────────────────────────────────
const G = '#FFD600';

// ── Pill blurb content ─────────────────────────────────────────────────────────
export const PILL_BLURBS = {
  novel: {
    icon: '📖',
    title: 'CREATE YOUR NOVEL',
    blurb:
      'Write chapter by chapter with guided prompts. BloomScript structures every chapter into scene, dialogue, action, and reflection sections — so you always know exactly what to write next.',
    accent: '#0057A8',
    border: '#0057A880',
    gradient: ['#0057A840', '#003D7A28'] as [string, string],
  },
  studio: {
    icon: '✦',
    title: 'COMIC ART STUDIO',
    blurb:
      'Generate stunning comic panels with AI. Direct camera angles, define character DNA, choose panel layouts, and apply genre styles — from Cyberpunk to Manga — all in one powerful studio.',
    accent: G,
    border: G,
    gradient: ['#FFD60038', '#FF950028'] as [string, string],
  },
  screenplay: {
    icon: '🎬',
    title: 'WRITE YOUR SCREENPLAY',
    blurb:
      'Format your script like a professional. The Bloom Wizard guides you through acts, scenes, and dialogue so your story translates perfectly from page to screen.',
    accent: '#E8001C',
    border: '#E8001C80',
    gradient: ['#E8001C38', '#8B3FBE28'] as [string, string],
  },
} as const;

export type PillKey = keyof typeof PILL_BLURBS;

// ── Pill Modal ─────────────────────────────────────────────────────────────────
function PillModal({ pillKey, onClose }: { pillKey: PillKey | null; onClose: () => void }) {
  if (!pillKey) return null;
  const p = PILL_BLURBS[pillKey];
  return (
    <Modal
      visible={!!pillKey}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <Pressable style={m.backdrop} onPress={onClose}>
        <Pressable style={m.sheet} onPress={() => {}}>
          {/* Header strip */}
          <LinearGradient
            colors={p.gradient}
            style={[m.sheetHeader, { borderColor: p.border }]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Text style={m.sheetIcon}>{p.icon}</Text>
            <Text style={[m.sheetTitle, { color: p.accent === '#FFD600' ? G : '#FFD600' }]}>
              {p.title}
            </Text>
          </LinearGradient>

          {/* Body */}
          <View style={m.sheetBody}>
            {/* Halftone accent */}
            <View style={m.sheetDots} pointerEvents="none">
              {Array.from({ length: 20 }).map((_, i) => (
                <View key={i} style={m.dot} />
              ))}
            </View>

            <Text style={m.blurb}>{p.blurb}</Text>

            {/* Dismiss */}
            <TouchableOpacity onPress={onClose} activeOpacity={0.8}>
              <LinearGradient
                colors={[G, '#FF9500']}
                style={m.dismissBtn}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                <Feather name="check" size={14} color="#000" />
                <Text style={m.dismissText}>GOT IT</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

// ── Comic Panel Header (exported) ──────────────────────────────────────────────
export function ComicHeader({ title, subtitle }: { title: string; subtitle: string }) {
  const [activePill, setActivePill] = useState<PillKey | null>(null);

  return (
    <>
      <LinearGradient
        colors={['#0A0806', '#14100A', '#1E1810']}
        style={s.header}
        start={{ x: 0.2, y: 0 }}
        end={{ x: 0.8, y: 1 }}
      >
        {/* Halftone dot grid */}
        <View style={s.halftoneGrid} pointerEvents="none">
          {Array.from({ length: 40 }).map((_, i) => (
            <View key={i} style={s.halftoneDot} />
          ))}
        </View>

        {/* Panel corner marks */}
        <View style={[s.corner, s.cornerTL]} />
        <View style={[s.corner, s.cornerTR]} />
        <View style={[s.corner, s.cornerBL]} />
        <View style={[s.corner, s.cornerBR]} />

        {/* Logo */}
        <AppLogo size={72} glow />

        {/* Title */}
        <View style={s.headerTextBlock}>
          <Text style={s.headerTitle}>{title}</Text>
          <Text style={s.headerSub}>{subtitle}</Text>
        </View>

        {/* Feature trio */}
        <View style={s.featureRow}>
          {/* Novel */}
          <TouchableOpacity
            style={s.pillTouch}
            onPress={() => setActivePill('novel')}
            activeOpacity={0.75}
          >
            <LinearGradient
              colors={PILL_BLURBS.novel.gradient}
              style={[s.featurePill, { borderColor: PILL_BLURBS.novel.border }]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Text style={s.pillIcon}>📖</Text>
              <Text style={s.pillLabel}>CREATE YOUR{'\n'}NOVEL</Text>
              <View style={s.pillTapHint}>
                <Text style={s.pillTapText}>TAP</Text>
              </View>
            </LinearGradient>
          </TouchableOpacity>

          {/* Studio — center, wider */}
          <TouchableOpacity
            style={s.pillTouchCenter}
            onPress={() => setActivePill('studio')}
            activeOpacity={0.75}
          >
            <LinearGradient
              colors={PILL_BLURBS.studio.gradient}
              style={[s.featurePillCenter, { borderColor: G }]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Text style={s.pillCenterIcon}>✦</Text>
              <Text style={[s.pillLabel, { letterSpacing: 0.9 }]}>COMIC ART{'\n'}STUDIO</Text>
              <View style={s.pillTapHint}>
                <Text style={s.pillTapText}>TAP</Text>
              </View>
            </LinearGradient>
          </TouchableOpacity>

          {/* Screenplay */}
          <TouchableOpacity
            style={s.pillTouch}
            onPress={() => setActivePill('screenplay')}
            activeOpacity={0.75}
          >
            <LinearGradient
              colors={PILL_BLURBS.screenplay.gradient}
              style={[s.featurePill, { borderColor: PILL_BLURBS.screenplay.border }]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Text style={s.pillIcon}>🎬</Text>
              <Text style={s.pillLabel}>WRITE YOUR{'\n'}SCREENPLAY</Text>
              <View style={s.pillTapHint}>
                <Text style={s.pillTapText}>TAP</Text>
              </View>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* Issue stamp */}
        <View style={s.issueStamp}>
          <Text style={s.issueText}>ISSUE #1</Text>
        </View>
      </LinearGradient>

      <PillModal pillKey={activePill} onClose={() => setActivePill(null)} />
    </>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// STYLES
// ════════════════════════════════════════════════════════════════════════════

const s = StyleSheet.create({
  header: {
    paddingTop: 28,
    paddingBottom: 32,
    paddingHorizontal: 24,
    alignItems: 'center',
    gap: 14,
    position: 'relative',
    overflow: 'hidden',
  },
  halftoneGrid: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    flexDirection: 'row', flexWrap: 'wrap', gap: 18, padding: 14, opacity: 0.6,
  },
  halftoneDot: { width: 3, height: 3, borderRadius: 1.5, backgroundColor: '#FFD60020' },
  corner: { position: 'absolute', width: 16, height: 16, borderColor: G, opacity: 0.5 },
  cornerTL: { top: 12, left: 12, borderTopWidth: 2, borderLeftWidth: 2, borderTopLeftRadius: 3 },
  cornerTR: { top: 12, right: 12, borderTopWidth: 2, borderRightWidth: 2, borderTopRightRadius: 3 },
  cornerBL: { bottom: 12, left: 12, borderBottomWidth: 2, borderLeftWidth: 2, borderBottomLeftRadius: 3 },
  cornerBR: { bottom: 12, right: 12, borderBottomWidth: 2, borderRightWidth: 2, borderBottomRightRadius: 3 },
  headerTextBlock: { alignItems: 'center', gap: 4 },
  headerTitle: { fontSize: 26, fontFamily: 'Inter_700Bold', color: '#FFF', letterSpacing: -0.5, textAlign: 'center' },
  headerSub: { fontSize: 13, color: '#FFFFFF70', textAlign: 'center' },
  issueStamp: {
    position: 'absolute', top: 14, right: 14,
    paddingHorizontal: 7, paddingVertical: 3, borderRadius: 6,
    backgroundColor: '#FFD60015', borderWidth: 1, borderColor: '#FFD60030',
  },
  issueText: { fontSize: 8, fontWeight: '900', color: '#FFD60080', letterSpacing: 1.5 },

  // Feature trio
  featureRow: { flexDirection: 'row', gap: 8, alignItems: 'stretch', width: '100%', marginTop: 4 },
  pillTouch: { flex: 1 },
  pillTouchCenter: { flex: 1.15 },
  featurePill: {
    flex: 1, alignItems: 'center', justifyContent: 'center', gap: 4,
    borderRadius: 12, paddingVertical: 10, paddingHorizontal: 6,
    borderWidth: 1.5,
  },
  featurePillCenter: {
    flex: 1, alignItems: 'center', justifyContent: 'center', gap: 3,
    borderRadius: 12, paddingVertical: 10, paddingHorizontal: 6,
    borderWidth: 1.5,
  },
  pillIcon: { fontSize: 18 },
  pillCenterIcon: { fontSize: 14, color: G },
  pillLabel: {
    fontSize: 10, fontFamily: 'Inter_700Bold', color: G,
    textAlign: 'center', lineHeight: 14, letterSpacing: 0.8,
  },
  pillTapHint: {
    marginTop: 3,
    paddingHorizontal: 5, paddingVertical: 2,
    borderRadius: 4, borderWidth: 1, borderColor: '#FFD60050',
    backgroundColor: '#FFD60012',
  },
  pillTapText: { fontSize: 7, fontWeight: '900', color: '#FFD60080', letterSpacing: 1.2 },
});

// Modal styles
const m = StyleSheet.create({
  backdrop: {
    flex: 1, backgroundColor: '#000000BB',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#14100A',
    borderTopLeftRadius: 22, borderTopRightRadius: 22,
    overflow: 'hidden',
    borderTopWidth: 2, borderColor: '#FFD60040',
    ...Platform.select({
      ios: { shadowColor: G, shadowOffset: { width: 0, height: -6 }, shadowOpacity: 0.3, shadowRadius: 20 },
      android: { elevation: 20 },
    }),
  },
  sheetHeader: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: 24, paddingVertical: 18,
    borderBottomWidth: 1,
  },
  sheetIcon: { fontSize: 28 },
  sheetTitle: { fontSize: 16, fontFamily: 'Inter_700Bold', letterSpacing: 1, flex: 1 },
  sheetBody: { padding: 24, gap: 16, position: 'relative' },
  sheetDots: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    flexDirection: 'row', flexWrap: 'wrap', gap: 20, padding: 12, opacity: 0.5,
  },
  dot: { width: 3, height: 3, borderRadius: 1.5, backgroundColor: '#FFD60018' },
  blurb: {
    fontSize: 15, fontFamily: 'Inter_400Regular',
    color: '#F0EAD8CC', lineHeight: 24,
  },
  dismissBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, borderRadius: 12, paddingVertical: 14,
    ...Platform.select({
      ios: { shadowColor: G, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 12 },
      android: { elevation: 8 },
    }),
  },
  dismissText: { fontSize: 14, fontFamily: 'Inter_700Bold', color: '#000', letterSpacing: 1.2 },
});
