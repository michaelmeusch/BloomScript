import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React, { useRef, useState } from 'react';
import {
  Dimensions,
  FlatList,
  Image,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ViewToken,
} from 'react-native';
import Animated, {
  interpolate,
  SharedValue,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useUser } from '@clerk/expo';

import { useTranslation } from 'react-i18next';

import AnimatedLogoIcon from '@/components/AnimatedLogoIcon';
import { themes, ThemeName } from '@/constants/colors';
import { useTheme } from '@/context/ThemeContext';
import { useColors } from '@/hooks/useColors';
import { useOnboarding } from '@/hooks/useOnboarding';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const VIEWABILITY_CONFIG = { viewAreaCoveragePercentThreshold: 50 };

interface Slide {
  key: string;
  icon?: React.ComponentProps<typeof Feather>['name'];
  iconBg?: string;
  isColorPicker?: boolean;
}

// Fixed ink + gold palette — mirrors the login/sign-up comic aesthetic
const INK = {
  bg:      '#0A0806',
  bgMid:   '#14100A',
  bgLight: '#1E1810',
  gold:    '#FFD600',
  gold2:   '#FF9500',
  iconBg:  '#1C1400',   // dark gold-tinted panel for slide icons
};

const SLIDES: Slide[] = [
  { key: 'chapter',      icon: 'book-open',     iconBg: INK.iconBg },
  { key: 'characters',   icon: 'users',          iconBg: INK.iconBg },
  { key: 'ai',           icon: 'zap',            iconBg: INK.iconBg },
  { key: 'followup',     icon: 'message-circle', iconBg: INK.iconBg },
  { key: 'thesaurus',    icon: 'book',           iconBg: INK.iconBg },
  { key: 'grammar',      icon: 'check-square',   iconBg: INK.iconBg },
  { key: 'covers',       icon: 'image',          iconBg: INK.iconBg },
  { key: 'manuscript',   icon: 'upload',         iconBg: INK.iconBg },
  { key: 'folders',      icon: 'folder',         iconBg: INK.iconBg },
  { key: 'preview',      icon: 'eye',            iconBg: INK.iconBg },
  { key: 'share',        icon: 'share-2',        iconBg: INK.iconBg },
  { key: 'print',        icon: 'printer',        iconBg: INK.iconBg },
  { key: 'comic',        icon: 'grid',           iconBg: INK.iconBg },
  { key: 'screenplay',   icon: 'film',           iconBg: INK.iconBg },
  { key: 'illustrate',   icon: 'feather',        iconBg: INK.iconBg },
  { key: 'color_scheme', isColorPicker: true },
  { key: 'pro',          icon: 'star',           iconBg: INK.iconBg },
];

const COLOR_SCHEMES: { name: ThemeName; label: string; description: string; swatches: string[] }[] = [
  {
    name: 'classic',
    label: 'Classic',
    description: 'Warm parchment & forest green',
    swatches: ['#F8F4EE', '#2D4A3E', '#C4913A'],
  },
  {
    name: 'midnight',
    label: 'Midnight Ink',
    description: 'Dark navy with gold accents',
    swatches: ['#0D1117', '#3A6B9A', '#E8C87A'],
  },
  {
    name: 'sage',
    label: 'Sage & Linen',
    description: 'Soft linen with sage green',
    swatches: ['#F0EAE0', '#4A7B6F', '#C0553E'],
  },
  {
    name: 'dusk',
    label: 'Dusk Plum',
    description: 'Deep purple with warm amber',
    swatches: ['#130E1E', '#9B7FD4', '#E8A86E'],
  },
  {
    name: 'blossom',
    label: 'Blossom',
    description: 'Rose pink with terracotta warmth',
    swatches: ['#FDF6F8', '#C2607A', '#D4926A'],
  },
  {
    name: 'steel',
    label: 'Steel & Navy',
    description: 'Deep navy with copper & cool gray',
    swatches: ['#D2BCA1', '#273F5B', '#6F481C'],
  },
  {
    name: 'bordeaux',
    label: 'Bordeaux & Hunter',
    description: 'Bone linen with hunter green & deep bordeaux',
    swatches: ['#D8D0C2', '#233126', '#4A1A23'],
  },
  {
    name: 'forest',
    label: 'Forest',
    description: 'Crisp white with deep forest green & teal',
    swatches: ['#F0F5F0', '#2E5232', '#7AAAB2'],
  },
  {
    name: 'wisteria',
    label: 'Wisteria',
    description: 'Soft lavender with purple & sage teal',
    swatches: ['#F5F1FA', '#6B4A8C', '#4A9B8A'],
  },
];

function ColorSchemeSlide({ selectedScheme, onSelect }: { selectedScheme: ThemeName; onSelect: (name: ThemeName) => void }) {
  const colors = useColors();
  const { t } = useTranslation();

  return (
    <View style={[colorStyles.container, { width: SCREEN_WIDTH }]}>
      <View style={colorStyles.inner}>
        <View style={[colorStyles.iconWrap, { backgroundColor: colors.primary + '22' }]}>
          <Feather name="droplet" size={32} color={colors.primary} />
        </View>
        <Text style={[colorStyles.headline, { color: colors.foreground }]}>
          {t('onboarding.chooseWritingSpace')}
        </Text>
        <Text style={[colorStyles.subtitle, { color: colors.mutedForeground }]}>
          {t('onboarding.chooseWritingSpaceSub')}
        </Text>

        <View style={colorStyles.grid}>
          {COLOR_SCHEMES.map((scheme) => {
            const isSelected = selectedScheme === scheme.name;
            const palette = themes[scheme.name];
            return (
              <TouchableOpacity
                key={scheme.name}
                style={[
                  colorStyles.schemeCard,
                  {
                    backgroundColor: palette.card,
                    borderColor: isSelected ? palette.primary : palette.border,
                    borderWidth: isSelected ? 2.5 : 1,
                    shadowColor: isSelected ? palette.primary : '#000',
                    shadowOpacity: isSelected ? 0.2 : 0.05,
                    shadowRadius: isSelected ? 8 : 4,
                    shadowOffset: { width: 0, height: 2 },
                    elevation: isSelected ? 4 : 1,
                  },
                ]}
                onPress={() => onSelect(scheme.name)}
                activeOpacity={0.8}
              >
                <View style={[colorStyles.preview, { backgroundColor: palette.background }]}>
                  <View style={[colorStyles.previewBar, { backgroundColor: palette.card, borderBottomColor: palette.border }]}>
                    <View style={[colorStyles.previewDot, { backgroundColor: palette.primary }]} />
                    <View style={[colorStyles.previewLine, { backgroundColor: palette.muted, flex: 1 }]} />
                  </View>
                  <View style={colorStyles.previewBody}>
                    <View style={[colorStyles.previewCard, { backgroundColor: palette.card, borderColor: palette.border }]}>
                      <View style={[colorStyles.previewAccent, { backgroundColor: palette.primary }]} />
                      <View style={colorStyles.previewLines}>
                        <View style={[colorStyles.previewLineShort, { backgroundColor: palette.foreground }]} />
                        <View style={[colorStyles.previewLineLong, { backgroundColor: palette.mutedForeground }]} />
                      </View>
                    </View>
                    <View style={[colorStyles.previewCard, { backgroundColor: palette.card, borderColor: palette.border }]}>
                      <View style={[colorStyles.previewAccent, { backgroundColor: palette.accent }]} />
                      <View style={colorStyles.previewLines}>
                        <View style={[colorStyles.previewLineShort, { backgroundColor: palette.foreground }]} />
                        <View style={[colorStyles.previewLineLong, { backgroundColor: palette.mutedForeground }]} />
                      </View>
                    </View>
                  </View>
                </View>

                <View style={colorStyles.cardInfo}>
                  <View style={colorStyles.swatchRow}>
                    {scheme.swatches.map((hex) => (
                      <View key={hex} style={[colorStyles.swatch, { backgroundColor: hex, borderColor: palette.border }]} />
                    ))}
                    {isSelected && (
                      <View style={[colorStyles.checkBadge, { backgroundColor: palette.primary }]}>
                        <Feather name="check" size={10} color={palette.primaryForeground} />
                      </View>
                    )}
                  </View>
                  <Text style={[colorStyles.schemeLabel, { color: palette.foreground }]}>{scheme.label}</Text>
                  <Text style={[colorStyles.schemeDesc, { color: palette.mutedForeground }]}>{scheme.description}</Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    </View>
  );
}

const colorStyles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  inner: {
    alignItems: 'center',
    width: '100%',
    gap: 12,
  },
  iconWrap: {
    width: 72,
    height: 72,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headline: {
    fontSize: 26,
    fontFamily: 'Inter_700Bold',
    textAlign: 'center',
    letterSpacing: -0.5,
    lineHeight: 32,
  },
  subtitle: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    textAlign: 'center',
    lineHeight: 21,
    paddingHorizontal: 8,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    justifyContent: 'center',
    width: '100%',
    marginTop: 4,
  },
  schemeCard: {
    width: (SCREEN_WIDTH - 60) / 2,
    borderRadius: 14,
    overflow: 'hidden',
  },
  preview: {
    height: 80,
    overflow: 'hidden',
  },
  previewBar: {
    height: 18,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 7,
    borderBottomWidth: 1,
  },
  previewDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  previewLine: {
    height: 4,
    borderRadius: 2,
    opacity: 0.4,
  },
  previewBody: {
    flex: 1,
    padding: 5,
    gap: 4,
  },
  previewCard: {
    flex: 1,
    borderRadius: 6,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 5,
    overflow: 'hidden',
  },
  previewAccent: {
    width: 3,
    alignSelf: 'stretch',
    borderRadius: 2,
    marginVertical: 4,
  },
  previewLines: {
    flex: 1,
    gap: 3,
    justifyContent: 'center',
  },
  previewLineShort: {
    height: 3,
    width: '55%',
    borderRadius: 2,
    opacity: 0.8,
  },
  previewLineLong: {
    height: 2,
    width: '80%',
    borderRadius: 2,
    opacity: 0.5,
  },
  cardInfo: {
    padding: 10,
    gap: 3,
  },
  swatchRow: {
    flexDirection: 'row',
    gap: 4,
    alignItems: 'center',
    marginBottom: 2,
  },
  swatch: {
    width: 14,
    height: 14,
    borderRadius: 4,
    borderWidth: 1,
  },
  checkBadge: {
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 2,
  },
  schemeLabel: {
    fontSize: 13,
    fontFamily: 'Inter_600SemiBold',
    letterSpacing: -0.1,
  },
  schemeDesc: {
    fontSize: 10,
    fontFamily: 'Inter_400Regular',
    lineHeight: 13,
  },
});

function SlideItem({
  slide,
  index,
  scrollX,
  selectedScheme,
  onSchemeSelect,
}: {
  slide: Slide;
  index: number;
  scrollX: SharedValue<number>;
  selectedScheme: ThemeName;
  onSchemeSelect: (name: ThemeName) => void;
}) {
  const { t } = useTranslation();

  const animatedStyle = useAnimatedStyle(() => {
    const inputRange = [
      (index - 1) * SCREEN_WIDTH,
      index * SCREEN_WIDTH,
      (index + 1) * SCREEN_WIDTH,
    ];
    const opacity = interpolate(scrollX.value, inputRange, [0.3, 1, 0.3]);
    const translateY = interpolate(scrollX.value, inputRange, [24, 0, 24]);
    return { opacity, transform: [{ translateY }] };
  });

  if (slide.isColorPicker) {
    return (
      <Animated.View style={[{ width: SCREEN_WIDTH, flex: 1 }, animatedStyle]}>
        <ColorSchemeSlide selectedScheme={selectedScheme} onSelect={onSchemeSelect} />
      </Animated.View>
    );
  }

  return (
    <View style={[styles.slide, { width: SCREEN_WIDTH }]}>
      <Animated.View style={[styles.slideContent, animatedStyle]}>
        <View style={styles.iconWrap}>
          <AnimatedLogoIcon
            backgroundColor={slide.iconBg!}
            icon={slide.icon!}
            size={40}
            containerSize={100}
            borderRadius={28}
          />
        </View>
        <Text style={styles.headline}>
          {t(`onboarding.slides.${slide.key}.headline`)}
        </Text>
        <Text style={styles.subtitle}>
          {t(`onboarding.slides.${slide.key}.subtitle`)}
        </Text>
      </Animated.View>
    </View>
  );
}

function AnimatedDot({ index, scrollX }: { index: number; scrollX: SharedValue<number> }) {
  const dotStyle = useAnimatedStyle(() => {
    const inputRange = [
      (index - 1) * SCREEN_WIDTH,
      index * SCREEN_WIDTH,
      (index + 1) * SCREEN_WIDTH,
    ];
    const width = interpolate(scrollX.value, inputRange, [5, 16, 5], 'clamp');
    const opacity = interpolate(scrollX.value, inputRange, [0.35, 1, 0.35], 'clamp');
    return { width, opacity };
  });

  return (
    <Animated.View
      style={[styles.dot, { backgroundColor: INK.gold }, dotStyle]}
    />
  );
}

function DotIndicator({ count, scrollX }: { count: number; scrollX: SharedValue<number> }) {
  return (
    <View style={styles.dots}>
      {Array.from({ length: count }).map((_, i) => (
        <AnimatedDot key={i} index={i} scrollX={scrollX} />
      ))}
    </View>
  );
}

export default function OnboardingScreen() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { user } = useUser();
  const { completeOnboarding } = useOnboarding(user?.id);
  const { themeName, setTheme } = useTheme();
  const flatListRef = useRef<FlatList>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [selectedScheme, setSelectedScheme] = useState<ThemeName>(themeName);
  const scrollX = useSharedValue(0);

  const buttonScale = useSharedValue(1);

  const isLast = activeIndex === SLIDES.length - 1;

  const handleSchemeSelect = async (name: ThemeName) => {
    setSelectedScheme(name);
    await setTheme(name);
  };

  const handleNext = () => {
    if (isLast) {
      handleGetStarted();
      return;
    }
    const nextIndex = activeIndex + 1;
    flatListRef.current?.scrollToIndex({ index: nextIndex, animated: true });
    setActiveIndex(nextIndex);
  };

  const handleGetStarted = async () => {
    buttonScale.value = withSpring(0.94, { damping: 10 }, () => {
      buttonScale.value = withSpring(1, { damping: 10 });
    });
    await completeOnboarding();
    router.replace('/(tabs)');
  };

  const buttonAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: buttonScale.value }],
  }));

  const onViewableItemsChanged = useRef(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      if (viewableItems.length > 0 && viewableItems[0].index !== null) {
        setActiveIndex(viewableItems[0].index);
      }
    }
  ).current;

  const topPadding = Platform.OS === 'web' ? 67 : insets.top;
  const bottomPadding = Platform.OS === 'web' ? 34 : insets.bottom;

  return (
    <View style={[styles.container, { backgroundColor: INK.bg }]}>
      <LinearGradient
        colors={[INK.bgLight, INK.bgMid, INK.bg]}
        start={{ x: 0.2, y: 0 }}
        end={{ x: 0.8, y: 1 }}
        style={[styles.header, { paddingTop: topPadding + 16 }]}
      >
        {/* Halftone dots — mirrors AuthHeader */}
        <View style={styles.halftoneGrid} pointerEvents="none">
          {Array.from({ length: 40 }).map((_, i) => (
            <View key={i} style={styles.halftoneDot} />
          ))}
        </View>
        {/* Corner marks — mirrors AuthHeader */}
        <View style={[styles.corner, styles.cornerTL]} />
        <View style={[styles.corner, styles.cornerTR]} />
        <View style={[styles.corner, styles.cornerBL]} />
        <View style={[styles.corner, styles.cornerBR]} />
        <Image
          source={require('@/assets/images/logo.png')}
          style={{ width: 88, height: 88, borderRadius: 18 }}
          resizeMode="contain"
        />
        {/* Gold divider line at bottom of header */}
        <View style={styles.headerDivider} />
      </LinearGradient>

      <FlatList
        ref={flatListRef}
        data={SLIDES}
        keyExtractor={(item) => item.key}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        bounces={false}
        onScroll={(e) => {
          scrollX.value = e.nativeEvent.contentOffset.x;
        }}
        scrollEventThrottle={16}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={VIEWABILITY_CONFIG}
        getItemLayout={(_data, index) => ({
          length: SCREEN_WIDTH,
          offset: SCREEN_WIDTH * index,
          index,
        })}
        renderItem={({ item, index }) => (
          <SlideItem
            slide={item}
            index={index}
            scrollX={scrollX}
            selectedScheme={selectedScheme}
            onSchemeSelect={handleSchemeSelect}
          />
        )}
        style={styles.flatList}
      />

      <View style={[styles.footer, { paddingBottom: bottomPadding + 24 }]}>
        <DotIndicator count={SLIDES.length} scrollX={scrollX} />

        <Animated.View style={[buttonAnimatedStyle, styles.button]}>
          <TouchableOpacity onPress={handleNext} activeOpacity={0.85} style={{ borderRadius: 32, overflow: 'hidden' }}>
            <LinearGradient
              colors={[INK.gold, INK.gold2]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.buttonGrad}
            >
              <Text style={styles.buttonText}>
                {isLast ? t('onboarding.getStarted') : t('onboarding.next')}
              </Text>
              {!isLast && (
                <Feather name="arrow-right" size={18} color="#000" />
              )}
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>

        {!isLast && (
          <TouchableOpacity onPress={handleGetStarted} activeOpacity={0.7}>
            <Text style={styles.skipText}>
              {t('onboarding.skip')}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    alignItems: 'center',
    paddingBottom: 20,
    paddingHorizontal: 20,
    position: 'relative',
    overflow: 'hidden',
  },
  headerDivider: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: '#FFD60030',
  },
  // Halftone dots — matches AuthHeader ComicHeader
  halftoneGrid: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    flexDirection: 'row', flexWrap: 'wrap', gap: 18, padding: 14,
    opacity: 0.55,
  },
  halftoneDot: { width: 3, height: 3, borderRadius: 1.5, backgroundColor: '#FFD60020' },
  // Corner marks — matches AuthHeader ComicHeader
  corner:    { position: 'absolute', width: 16, height: 16, borderColor: '#FFD600', opacity: 0.45 },
  cornerTL:  { top: 12, left: 12, borderTopWidth: 2, borderLeftWidth: 2, borderTopLeftRadius: 3 },
  cornerTR:  { top: 12, right: 12, borderTopWidth: 2, borderRightWidth: 2, borderTopRightRadius: 3 },
  cornerBL:  { bottom: 12, left: 12, borderBottomWidth: 2, borderLeftWidth: 2, borderBottomLeftRadius: 3 },
  cornerBR:  { bottom: 12, right: 12, borderBottomWidth: 2, borderRightWidth: 2, borderBottomRightRadius: 3 },

  flatList: {
    flex: 1,
  },
  slide: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 36,
  },
  slideContent: {
    alignItems: 'center',
    gap: 24,
    width: '100%',
  },
  iconWrap: {
    borderRadius: 28,
    borderWidth: 1.5,
    borderColor: '#FFD60040',
    shadowColor: '#FFD600',
    shadowOpacity: 0.25,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 0 },
  },
  headline: {
    fontSize: 28,
    fontFamily: 'Inter_700Bold',
    textAlign: 'center',
    letterSpacing: -0.5,
    lineHeight: 34,
    color: '#FFFFFF',
  },
  subtitle: {
    fontSize: 16,
    fontFamily: 'Inter_400Regular',
    textAlign: 'center',
    lineHeight: 25,
    color: '#FFFFFF80',
  },
  footer: {
    alignItems: 'center',
    gap: 16,
    paddingHorizontal: 24,
    paddingTop: 16,
  },
  dots: {
    flexDirection: 'row',
    gap: 4,
    alignItems: 'center',
    height: 8,
  },
  dot: {
    height: 6,
    borderRadius: 3,
  },
  button: {
    minWidth: 220,
  },
  buttonGrad: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 40,
    paddingVertical: 16,
    justifyContent: 'center',
  },
  buttonText: {
    fontSize: 17,
    fontFamily: 'Inter_600SemiBold',
    letterSpacing: -0.1,
    color: '#000000',
  },
  skipText: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    color: '#FFFFFF50',
  },
});
