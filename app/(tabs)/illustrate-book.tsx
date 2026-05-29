import { Feather } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import { useLocalSearchParams, router } from 'expo-router';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTranslation } from 'react-i18next';

import { API_BASE } from '@/constants/api';
import { useBooks } from '@/context/BookContext';
import { useLanguage } from '@/context/LanguageContext';
import { useColors } from '@/hooks/useColors';
import { useSubscription } from '@/lib/revenuecat';
import { Chapter } from '@/types';

const MAX_PER_CHAPTER = 5;
const UNLOCK_KEY = 'unlockedIllustrationBooks';
const COUNTS_PREFIX = 'illustrationCounts_';
const STYLE_PREFIX = 'illustrationStyle_';

type StyleOption = {
  id: string;
  label: string;
  emoji: string;
  desc: string;
  custom?: boolean;
};

const STYLE_OPTIONS: StyleOption[] = [
  // ── Classic & Fine Art ──────────────────────────────────────────────────
  { id: 'watercolor', label: 'Watercolor', emoji: '🎨', desc: 'Soft flowing color washes · Luminous wet-on-wet texture' },
  { id: 'oil_painting', label: 'Oil Painting', emoji: '🖌️', desc: 'Rich saturated palette · Cinematic, heroic compositions' },
  { id: 'ink', label: 'Ink & Pen', emoji: '✒️', desc: 'Fine expressive linework · Intricate cross-hatching' },
  { id: 'gouache', label: 'Gouache', emoji: '🎏', desc: 'Opaque matte pigments · Vibrant flat color fields, designer poster look' },
  { id: 'pastel', label: 'Pastel', emoji: '🌸', desc: 'Soft chalky strokes · Dreamy haze, romantic light and shadow' },
  { id: 'charcoal', label: 'Charcoal & Graphite', emoji: '🖊️', desc: 'Bold smudged darks · Dramatic tonal sketching, raw expressive texture' },
  { id: 'acrylic', label: 'Acrylic Paint', emoji: '🎭', desc: 'Bold impasto texture · Vivid, versatile, contemporary fine art' },
  { id: 'pencil_sketch', label: 'Pencil Sketch', emoji: '✏️', desc: 'Delicate graphite lines · Loose gestural hatching, sketchbook feel' },
  // ── Historical & Decorative ─────────────────────────────────────────────
  { id: 'engraving', label: 'Vintage Engraving', emoji: '📜', desc: 'Antique woodcut lines · Dramatic chiaroscuro, sepia tones' },
  { id: 'victorian', label: 'Victorian Decorative', emoji: '🦢', desc: 'Ornate Arts & Crafts borders · Bold flat colors, Morris-era patterns' },
  { id: 'art_nouveau', label: 'Art Nouveau', emoji: '🌿', desc: 'Flowing organic curves · Botanical motifs, Mucha-style elegance' },
  { id: 'art_deco', label: 'Art Deco', emoji: '💎', desc: 'Geometric glamour · Gold & black symmetry, Gatsby-era opulence' },
  { id: 'ukiyo_e', label: 'Ukiyo-e', emoji: '🗻', desc: 'Japanese woodblock flat color · Bold outlines, wave-pattern skies' },
  { id: 'linocut', label: 'Linocut / Block Print', emoji: '🖋️', desc: 'High-contrast relief print · Stark graphic shapes, textured ink marks' },
  // ── Storybook & Children's ──────────────────────────────────────────────
  { id: 'fairy_tale', label: 'Fairy Tale', emoji: '✨', desc: 'Lush magical storybook · Ornate pen borders, jewel tones' },
  { id: 'childrens', label: "Children's Book", emoji: '🐇', desc: 'Warm whimsical watercolor · Charming, naturalistic, Beatrix Potter feel' },
  { id: 'picture_book', label: 'Picture Book', emoji: '🖼️', desc: 'Bold flat collage shapes · Bright saturated primary colors' },
  { id: 'folk_art', label: 'Folk Art', emoji: '🏺', desc: 'Simple iconic shapes · Flat warm earth tones, decorative borders' },
  { id: 'collage', label: 'Paper Collage', emoji: '✂️', desc: 'Torn-paper layered texture · Abstract geometric forms, playful depth' },
  { id: 'kawaii', label: 'Kawaii / Cute', emoji: '🌟', desc: 'Rounded pastel shapes · Japanese cute aesthetic, big eyes, soft glow' },
  // ── Comics & Sequential Art ─────────────────────────────────────────────
  { id: 'comic', label: 'Comic Book', emoji: '💥', desc: 'Bold graphic outlines · Dynamic cel-shaded colors, halftone dots' },
  { id: 'manga', label: 'Manga', emoji: '⚡', desc: 'Clean Japanese comic style · Speed lines, expressive eyes, tonal screentone' },
  { id: 'graphic_novel', label: 'Graphic Novel', emoji: '🌑', desc: 'Noir cinematic panels · Gritty ink washes, dramatic chiaroscuro' },
  { id: 'webtoon', label: 'Webtoon', emoji: '📱', desc: 'Clean digital scroll art · Bright flat colors, K-webtoon character style' },
  // ── Animation & 3D ──────────────────────────────────────────────────────
  { id: 'cartoon', label: 'Animated Cartoon', emoji: '🎬', desc: 'Hand-drawn animation · Expressive, painterly, Studio Ghibli warmth' },
  { id: 'three_d', label: '3D Render', emoji: '🔷', desc: 'Smooth CGI lighting · Photorealistic or stylized 3D depth and form' },
  { id: 'pixel_art', label: 'Pixel Art', emoji: '👾', desc: 'Retro 8-bit grid · Chunky sprites, limited palette, nostalgic charm' },
  // ── Digital & Contemporary ──────────────────────────────────────────────
  { id: 'digital_painting', label: 'Digital Painting', emoji: '💻', desc: 'Rich painterly digital · Photorealistic light, lush environment detail' },
  { id: 'concept_art', label: 'Concept Art', emoji: '🚀', desc: 'Cinematic environment art · Dramatic perspective, film-production polish' },
  { id: 'flat_design', label: 'Flat Design', emoji: '🟦', desc: 'Modern vector shapes · Clean editorial, icon-style geometry' },
  { id: 'minimalist', label: 'Minimalist', emoji: '◻️', desc: 'Spare bold geometry · Strong negative space, contemporary editorial' },
  { id: 'neon_cyberpunk', label: 'Neon / Cyberpunk', emoji: '🌆', desc: 'Glowing neon on dark · Rain-slick streets, electric sci-fi atmosphere' },
  // ── Fantasy & Sci-Fi ─────────────────────────────────────────────────────
  { id: 'dark_fantasy', label: 'Dark Fantasy', emoji: '🐉', desc: 'Gothic atmospheric detail · Moody palettes, otherworldly creatures' },
  { id: 'surrealism', label: 'Surrealism', emoji: '🌀', desc: 'Dreamlike impossible scenes · Dali-esque melting logic, vivid symbolism' },
  { id: 'psychedelic', label: 'Psychedelic', emoji: '🌈', desc: 'Swirling kaleidoscopic color · 1960s poster art, fractal organic forms' },
  // ── Non-Fiction & Technical ──────────────────────────────────────────────
  { id: 'scientific', label: 'Scientific Diagram', emoji: '🔬', desc: 'Natural history plate style · Precise botanical & anatomical linework' },
  { id: 'blueprint', label: 'Blueprint', emoji: '📐', desc: 'White lines on navy · Engineering schematic, technical drafting' },
  { id: 'retro_poster', label: 'Retro Poster', emoji: '📣', desc: '1950s–60s travel poster · Bold silkscreen palette, vintage typography feel' },
  { id: 'pulp', label: 'Pulp Fiction', emoji: '📰', desc: 'Gritty magazine noir · Pulp cover drama, high contrast ink & shadow' },
];

const CUSTOM_STYLES_PREFIX = 'illustrationCustomStyles_';

type LoadingSlot = { chapterId: string; slotIndex: number };

export default function IllustrateBookScreen() {
  const colors = useColors();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { bookId } = useLocalSearchParams<{ bookId: string }>();
  const { getBook } = useBooks();
  const { language } = useLanguage();
  const {
    isSubscribed,
    customerInfo,
    offerings,
    isPurchasing: rcPurchasing,
    purchase,
    initError: rcInitError,
  } = useSubscription();

  const book = getBook(bookId ?? '');

  const [isCheckingAccess, setIsCheckingAccess] = useState(false);
  const [isUnlocked, setIsUnlocked] = useState(true);
  const [selectedStyle, setSelectedStyle] = useState('watercolor');
  const [generationCounts, setGenerationCounts] = useState<Record<string, number>>({});
  const [customStyles, setCustomStyles] = useState<StyleOption[]>([]);
  const [customStyleVisible, setCustomStyleVisible] = useState(false);
  const [customStyleEmoji, setCustomStyleEmoji] = useState('✨');
  const [customStyleLabel, setCustomStyleLabel] = useState('');
  const [customStyleDesc, setCustomStyleDesc] = useState('');
  const [suggestionVisible, setSuggestionVisible] = useState(false);
  const [suggestionLoading, setSuggestionLoading] = useState(false);
  const [suggestionText, setSuggestionText] = useState('');
  const [suggestionChapterTitle, setSuggestionChapterTitle] = useState('');
  const [suggestionChapterPreview, setSuggestionChapterPreview] = useState('');
  // images[chapterId][slotIndex] = base64 string or null — ephemeral, not persisted to AsyncStorage
  const [images, setImages] = useState<Record<string, (string | null)[]>>({});
  const [loadingSlot, setLoadingSlot] = useState<LoadingSlot | null>(null);
  const [customDescriptions, setCustomDescriptions] = useState<Record<string, string>>({});
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [confirmVisible, setConfirmVisible] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const illustrationPkg = offerings?.all?.['illustrations']?.availablePackages?.[0];
  const priceStr = illustrationPkg?.product.priceString ?? '$9.99';

  const effectiveStyle = selectedStyle;
  const allStyles = [...STYLE_OPTIONS, ...customStyles];

  useEffect(() => {
    if (!isUnlocked) return;
    const loadData = async () => {
      try {
        const countsRaw = await AsyncStorage.getItem(`${COUNTS_PREFIX}${bookId}`);
        setGenerationCounts(countsRaw ? JSON.parse(countsRaw) : {});
        const customRaw = await AsyncStorage.getItem(`${CUSTOM_STYLES_PREFIX}${bookId}`);
        setCustomStyles(customRaw ? JSON.parse(customRaw) : []);
        // Images are ephemeral (in-memory only) to avoid AsyncStorage size limits
        const styleRaw = await AsyncStorage.getItem(`${STYLE_PREFIX}${bookId}`);
        if (styleRaw) setSelectedStyle(styleRaw);
      } catch {
        // ignore
      }
    };
    loadData();
  }, [bookId, isUnlocked]);

  const handlePurchase = async () => {
    if (!illustrationPkg) return;
    setConfirmVisible(false);
    setIsPurchasing(true);
    setError(null);
    try {
      await purchase(illustrationPkg);
      const raw = await AsyncStorage.getItem(UNLOCK_KEY);
      const unlocked: string[] = raw ? JSON.parse(raw) : [];
      if (!unlocked.includes(bookId ?? '')) {
        unlocked.push(bookId ?? '');
        await AsyncStorage.setItem(UNLOCK_KEY, JSON.stringify(unlocked));
      }
      setIsUnlocked(true);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (err) {
      const e = err as { userCancelled?: boolean; message?: string };
      if (!e.userCancelled) {
        setError(e.message ?? 'Purchase failed. Please try again.');
      }
    } finally {
      setIsPurchasing(false);
    }
  };

  const handleGenerateSlot = async (chapter: Chapter, slotIndex: number) => {
    const count = generationCounts[chapter.id] ?? 0;
    if (count >= MAX_PER_CHAPTER) return;
    if (loadingSlot !== null) return;

    const chapterText = chapter.sections
      .map((s) => s.content.trim())
      .filter(Boolean)
      .join('\n\n');

    if (!chapterText) {
      Alert.alert(t('illustrateBook.noContent'), t('illustrateBook.noContent'));
      return;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setLoadingSlot({ chapterId: chapter.id, slotIndex });
    setError(null);

    try {
      const desc = customDescriptions[chapter.id]?.trim();
      const response = await fetch(`${API_BASE}/illustrations/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chapterText,
          style: effectiveStyle,
          bookTitle: book?.title ?? '',
          genre: book?.genre ?? '',
          language,
          ...(desc ? { customDescription: desc } : {}),
        }),
      });
      if (!response.ok) {
        const body = await response.json().catch(() => ({})) as { error?: string };
        throw new Error(body.error ?? 'Generation failed');
      }
      const data = await response.json() as { imageBase64?: string };
      if (!data.imageBase64) {
        throw new Error('The server did not return an image.');
      }

      // Update images: set this slot's image
      const prevSlots = images[chapter.id] ?? Array(MAX_PER_CHAPTER).fill(null);
      const newSlots = [...prevSlots] as (string | null)[];
      while (newSlots.length < MAX_PER_CHAPTER) newSlots.push(null);
      newSlots[slotIndex] = data.imageBase64;

      const newImages = { ...images, [chapter.id]: newSlots };
      const newCounts = { ...generationCounts, [chapter.id]: count + 1 };

      setImages(newImages);
      setGenerationCounts(newCounts);

      await AsyncStorage.setItem(`${STYLE_PREFIX}${bookId}`, effectiveStyle);
      // Only persist lightweight metadata — images are ephemeral (in-memory only)
      await AsyncStorage.setItem(`${COUNTS_PREFIX}${bookId}`, JSON.stringify(newCounts));

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (err) {
      const e = err as { message?: string };
      setError(e.message ?? 'Failed to generate illustration. Please try again.');
    } finally {
      setLoadingSlot(null);
    }
  };

  const handleShareImage = async (base64: string) => {
    try {
      const filename = `bloomscript-illustration-${Date.now()}.png`;
      const fileUri = `${FileSystem.cacheDirectory}${filename}`;
      await FileSystem.writeAsStringAsync(fileUri, base64, {
        encoding: FileSystem.EncodingType.Base64,
      });
      const canShare = await Sharing.isAvailableAsync();
      if (!canShare) {
        Alert.alert(t('common.sharingNotAvailable'), t('common.sharingNotAvailableDevice'));
        return;
      }
      await Sharing.shareAsync(fileUri, {
        mimeType: 'image/png',
        dialogTitle: t('illustrateBook.saveShare'),
        UTI: 'public.png',
      });
    } catch {
      Alert.alert(t('common.error'), t('illustrateBook.saveShareFailed'));
    }
  };

  const handleDeleteSlot = (chapter: Chapter, slotIndex: number) => {
    Alert.alert(
      'Delete Illustration',
      'Are you sure you want to remove this illustration?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
            const prevSlots = images[chapter.id] ?? Array(MAX_PER_CHAPTER).fill(null);
            const newSlots = [...prevSlots] as (string | null)[];
            while (newSlots.length < MAX_PER_CHAPTER) newSlots.push(null);
            newSlots[slotIndex] = null;

            const prevCount = generationCounts[chapter.id] ?? 0;
            const newCount = Math.max(0, prevCount - 1);

            const newImages = { ...images, [chapter.id]: newSlots };
            const newCounts = { ...generationCounts, [chapter.id]: newCount };

            setImages(newImages);
            setGenerationCounts(newCounts);

            AsyncStorage.setItem(`${COUNTS_PREFIX}${bookId}`, JSON.stringify(newCounts));
          },
        },
      ]
    );
  };

  const handleAddCustomStyle = async () => {
    const label = customStyleLabel.trim();
    const desc = customStyleDesc.trim();
    const emoji = customStyleEmoji.trim() || '✨';
    if (!label || !desc) {
      setError(t('illustrateBook.customStyleError'));
      return;
    }
    const nextStyle: StyleOption = {
      id: `custom_${Date.now()}`,
      label,
      emoji,
      desc,
      custom: true,
    };
    const nextStyles = [...customStyles, nextStyle];
    setCustomStyles(nextStyles);
    setSelectedStyle(nextStyle.id);
    await AsyncStorage.setItem(`${CUSTOM_STYLES_PREFIX}${bookId}`, JSON.stringify(nextStyles));
    await AsyncStorage.setItem(`${STYLE_PREFIX}${bookId}`, nextStyle.id);
    setCustomStyleVisible(false);
    setCustomStyleEmoji('✨');
    setCustomStyleLabel('');
    setCustomStyleDesc('');
  };

  const handleSuggestFromChapter = async (chapter: Chapter) => {
    const chapterText = chapter.sections
      .map((s) => s.content.trim())
      .filter(Boolean)
      .join('\n\n');
    if (!chapterText) {
      setError(t('illustrateBook.noContentShort'));
      return;
    }
    setSuggestionVisible(true);
    setSuggestionLoading(true);
    setSuggestionText('');
    setSuggestionChapterTitle(chapter.title);
    setSuggestionChapterPreview(chapterText.slice(0, 320));
    setError(null);
    try {
      const response = await fetch(`${API_BASE}/illustrations/suggest`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chapterText,
          bookTitle: book?.title ?? '',
          genre: book?.genre ?? '',
          language,
        }),
      });
      if (!response.ok) {
        const body = await response.json().catch(() => ({})) as { error?: string };
        throw new Error(body.error ?? 'Suggestion failed');
      }
      const data = await response.json() as { suggestion: string };
      setSuggestionText(data.suggestion || '');
    } catch (err) {
      const e = err as { message?: string };
      setSuggestionText(
        t('illustrateBook.suggestionFallback', { title: chapter.title })
      );
    } finally {
      setSuggestionLoading(false);
    }
  };

  const bottomPadding = (Platform.OS === 'web' ? 34 : insets.bottom) + 24;

  if (!book) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <TouchableOpacity
          style={[styles.closeBtn, { backgroundColor: colors.secondary }]}
          onPress={() => router.back()}
        >
          <Feather name="x" size={18} color={colors.mutedForeground} />
        </TouchableOpacity>
        <Text style={[styles.notFound, { color: colors.mutedForeground }]}>{t('illustrateBook.bookNotFound')}</Text>
      </View>
    );
  }

  if (isCheckingAccess) {
    return (
      <View style={[styles.container, styles.centered, { backgroundColor: colors.background }]}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  const selectedStyleOption = allStyles.find((s) => s.id === effectiveStyle);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: bottomPadding }]}
        showsVerticalScrollIndicator={false}
      >
        <TouchableOpacity
          style={[styles.closeBtn, { backgroundColor: colors.secondary }]}
          onPress={() => router.back()}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Feather name="x" size={18} color={colors.mutedForeground} />
        </TouchableOpacity>

        {/* Hero */}
        <View style={styles.hero}>
          <Image
            source={require('@/assets/images/logo.png')}
            style={{ width: 88, height: 88, borderRadius: 20 }}
            resizeMode="contain"
          />
          <Text style={[styles.heroTitle, { color: colors.foreground }]}>
            {isUnlocked ? t('illustrateBook.titleUnlocked') : t('illustrateBook.title')}
          </Text>
          <Text style={[styles.heroSubtitle, { color: colors.mutedForeground }]}>
            {isUnlocked
              ? t('illustrateBook.subtitleUnlocked', { title: book.title, count: MAX_PER_CHAPTER })
              : t('illustrateBook.subtitle')}
          </Text>
        </View>

        {isUnlocked ? (
          <>
            {/* Style section */}
            <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>
              {t('illustrateBook.artStyle')}
            </Text>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.styleRow}
            >
              {allStyles.map((style) => {
                const isSelected = selectedStyle === style.id;
                return (
                  <TouchableOpacity
                    key={style.id}
                    style={[
                      styles.styleChip,
                      {
                        backgroundColor: isSelected ? colors.primary : colors.card,
                        borderColor: isSelected ? colors.primary : colors.border,
                      },
                    ]}
                    onPress={() => {
                      Haptics.selectionAsync();
                      setSelectedStyle(style.id);
                    }}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.styleEmoji}>{style.emoji}</Text>
                    <Text
                      style={[
                        styles.styleLabel,
                        { color: isSelected ? '#fff' : colors.foreground },
                      ]}
                    >
                      {style.label}
                    </Text>
                    <Text
                      style={[
                        styles.styleDesc,
                        {
                          color: isSelected ? 'rgba(255,255,255,0.75)' : colors.mutedForeground,
                        },
                      ]}
                    >
                      {style.desc}
                    </Text>
                  </TouchableOpacity>
                );
              })}
              <TouchableOpacity
                style={[
                  styles.styleChip,
                  { backgroundColor: colors.card, borderColor: colors.border },
                ]}
                onPress={() => setCustomStyleVisible(true)}
                activeOpacity={0.8}
              >
                <Text style={styles.styleEmoji}>＋</Text>
                <Text style={[styles.styleLabel, { color: colors.foreground }]}>{t('illustrateBook.addCustomStyle')}</Text>
                <Text style={[styles.styleDesc, { color: colors.mutedForeground }]}>
                  {t('illustrateBook.addCustomStyleLabel')}
                </Text>
              </TouchableOpacity>
            </ScrollView>
            <Text style={[styles.styleHint, { color: colors.mutedForeground }]}>
              {t('illustrateBook.currentStyle', { style: selectedStyleOption?.label })}
            </Text>

            {/* Error */}
            {error && (
              <View style={styles.errorRow}>
                <Feather name="alert-circle" size={14} color="#DC2626" />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}

            {/* Chapter list */}
            <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>
              {t('illustrateBook.chapters')}
            </Text>

            {book.chapters.length === 0 ? (
              <View
                style={[
                  styles.emptyCard,
                  { backgroundColor: colors.card, borderColor: colors.border },
                ]}
              >
                <Feather name="file-text" size={28} color={colors.mutedForeground} />
                <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
                  {t('illustrateBook.noChapters')}
                </Text>
              </View>
            ) : (
              book.chapters.map((chapter) => (
                <ChapterIllustrationCard
                  key={chapter.id}
                  chapter={chapter}
                  count={generationCounts[chapter.id] ?? 0}
                  slots={images[chapter.id] ?? Array(MAX_PER_CHAPTER).fill(null)}
                  loadingSlot={
                    loadingSlot?.chapterId === chapter.id ? loadingSlot.slotIndex : null
                  }
                  isAnyLoading={loadingSlot !== null}
                  onGenerateSlot={(slotIndex) => handleGenerateSlot(chapter, slotIndex)}
                  onSuggest={() => handleSuggestFromChapter(chapter)}
                  onShareImage={handleShareImage}
                  onPreviewImage={setPreviewImage}
                  onDeleteSlot={(slotIndex) => handleDeleteSlot(chapter, slotIndex)}
                  customDescription={customDescriptions[chapter.id] ?? ''}
                  onDescriptionChange={(text) =>
                    setCustomDescriptions((prev) => ({ ...prev, [chapter.id]: text }))
                  }
                  colors={colors}
                />
              ))
            )}

            {isSubscribed && (
              <Text style={[styles.includedNote, { color: colors.mutedForeground }]}>
                {t('illustrateBook.includedWithPro')}
              </Text>
            )}
          </>
        ) : (
          <>
            {/* Feature list */}
            <View
              style={[
                styles.featuresCard,
                { backgroundColor: colors.card, borderColor: colors.border },
              ]}
            >
              {STYLE_OPTIONS.map((style, i) => (
                <View
                  key={style.id}
                  style={[
                    styles.featureRow,
                    i < STYLE_OPTIONS.length - 1 && {
                      borderBottomWidth: 1,
                      borderBottomColor: colors.border,
                    },
                  ]}
                >
                  <View
                    style={[
                      styles.featureIconWrap,
                      { backgroundColor: colors.primary + '18' },
                    ]}
                  >
                    <Text style={styles.featureEmoji}>{style.emoji}</Text>
                  </View>
                  <View style={styles.featureText}>
                    <Text style={[styles.featureLabel, { color: colors.foreground }]}>
                      {style.label}
                    </Text>
                    <Text style={[styles.featureDesc, { color: colors.mutedForeground }]}>
                      {style.desc}
                    </Text>
                  </View>
                  <Feather name="check" size={14} color={colors.accent} />
                </View>
              ))}
            </View>

            <View style={[styles.priceBanner, { backgroundColor: colors.primary }]}>
              <Feather name="image" size={16} color={colors.accent} />
              <Text style={styles.priceBannerText}>
                {t('illustrateBook.priceBanner', { count: MAX_PER_CHAPTER })}
              </Text>
            </View>

            {rcInitError && (
              <View style={styles.errorRow}>
                <Feather name="alert-circle" size={14} color="#DC2626" />
                <Text style={styles.errorText}>{t('illustrateBook.purchasesUnavailable', { error: rcInitError })}</Text>
              </View>
            )}

            {error && (
              <View style={styles.errorRow}>
                <Feather name="alert-circle" size={14} color="#DC2626" />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}

            <TouchableOpacity
              style={[styles.actionBtn, { backgroundColor: colors.accent }]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                setConfirmVisible(true);
              }}
              disabled={isPurchasing || rcPurchasing || !illustrationPkg}
              activeOpacity={0.85}
            >
              {isPurchasing || rcPurchasing ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Feather name="image" size={18} color="#fff" />
                  <Text style={styles.actionBtnText}>
                    {t('illustrateBook.unlockBtn', { price: priceStr })}
                  </Text>
                </>
              )}
            </TouchableOpacity>

            <Text style={[styles.legalNote, { color: colors.mutedForeground }]}>
              {t('illustrateBook.legalNote', { title: book.title })}
            </Text>
          </>
        )}
      </ScrollView>

      {/* Confirm purchase modal */}
      <Modal
        visible={confirmVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setConfirmVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View
            style={[
              styles.modalBox,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}
          >
            <View style={[styles.modalIcon, { backgroundColor: colors.accent + '18' }]}>
              <Feather name="image" size={24} color={colors.accent} />
            </View>
            <Text style={[styles.modalTitle, { color: colors.foreground }]}>
              {t('illustrateBook.unlockTitle')}
            </Text>
            <Text style={[styles.modalBody, { color: colors.mutedForeground }]}>
              {t('illustrateBook.unlockBody', { title: book.title, price: priceStr, count: MAX_PER_CHAPTER })}
            </Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalCancelBtn, { borderColor: colors.border }]}
                onPress={() => setConfirmVisible(false)}
              >
                <Text style={[styles.modalCancelText, { color: colors.mutedForeground }]}>
                  {t('common.cancel')}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalConfirmBtn, { backgroundColor: colors.accent }]}
                onPress={handlePurchase}
              >
                <Text style={styles.modalConfirmText}>{t('illustrateBook.buyBtn', { price: priceStr })}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal
        visible={previewImage !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setPreviewImage(null)}
      >
        <View style={styles.previewOverlay}>
          <TouchableOpacity
            style={styles.previewBackdrop}
            activeOpacity={1}
            onPress={() => setPreviewImage(null)}
          />
          <View style={[styles.previewCard, { backgroundColor: colors.card }]}>
            <View style={styles.previewHeader}>
              <TouchableOpacity
                style={[styles.previewCloseBtn, { backgroundColor: colors.secondary }]}
                onPress={() => setPreviewImage(null)}
              >
                <Feather name="x" size={18} color={colors.mutedForeground} />
              </TouchableOpacity>
              {previewImage && (
                <TouchableOpacity
                  style={[styles.previewSaveBtn, { backgroundColor: colors.primary }]}
                  onPress={() => handleShareImage(previewImage)}
                  activeOpacity={0.8}
                >
                  <Feather name="download" size={15} color="#fff" />
                  <Text style={styles.previewSaveBtnText}>{t('illustrateBook.saveShare')}</Text>
                </TouchableOpacity>
              )}
            </View>
            {previewImage && (
              <Image
                source={{ uri: `data:image/png;base64,${previewImage}` }}
                style={styles.previewImage}
                resizeMode="contain"
              />
            )}
          </View>
        </View>
      </Modal>

      <Modal
        visible={customStyleVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setCustomStyleVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View
            style={[styles.modalBox, { backgroundColor: colors.card, borderColor: colors.border }]}
          >
            <Text style={[styles.modalTitle, { color: colors.foreground }]}>{t('illustrateBook.customStyleModalTitle')}</Text>
            <TextInput
              value={customStyleEmoji}
              onChangeText={setCustomStyleEmoji}
              placeholder="✨"
              placeholderTextColor={colors.mutedForeground}
              style={[styles.input, { color: colors.foreground, borderColor: colors.border }]}
              maxLength={2}
            />
            <TextInput
              value={customStyleLabel}
              onChangeText={setCustomStyleLabel}
              placeholder={t('illustrateBook.customStyleNamePlaceholder')}
              placeholderTextColor={colors.mutedForeground}
              style={[styles.input, { color: colors.foreground, borderColor: colors.border }]}
            />
            <TextInput
              value={customStyleDesc}
              onChangeText={setCustomStyleDesc}
              placeholder={t('illustrateBook.customStyleDescPlaceholder')}
              placeholderTextColor={colors.mutedForeground}
              style={[
                styles.input,
                styles.textArea,
                { color: colors.foreground, borderColor: colors.border },
              ]}
              multiline
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalCancelBtn, { borderColor: colors.border }]}
                onPress={() => setCustomStyleVisible(false)}
              >
                <Text style={[styles.modalCancelText, { color: colors.mutedForeground }]}>
                  {t('common.cancel')}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalConfirmBtn, { backgroundColor: colors.accent }]}
                onPress={handleAddCustomStyle}
              >
                <Text style={styles.modalConfirmText}>{t('illustrateBook.customStyleSave')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal
        visible={suggestionVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setSuggestionVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View
            style={[styles.modalBox, { backgroundColor: colors.card, borderColor: colors.border }]}
          >
            <Text style={[styles.modalTitle, { color: colors.foreground }]}>
              {t('illustrateBook.suggestionTitle')}
            </Text>
            {!!suggestionChapterTitle && (
              <Text style={[styles.suggestionChapterTitle, { color: colors.foreground }]}>
                {suggestionChapterTitle}
              </Text>
            )}
            {!!suggestionChapterPreview && (
              <Text style={[styles.suggestionChapterPreview, { color: colors.mutedForeground }]}>
                {suggestionChapterPreview}
                {suggestionChapterPreview.length >= 320 ? '…' : ''}
              </Text>
            )}
            {suggestionLoading ? (
              <ActivityIndicator color={colors.primary} />
            ) : (
              <Text style={[styles.modalBody, { color: colors.mutedForeground }]}>
                {suggestionText}
              </Text>
            )}
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalCancelBtn, { borderColor: colors.border }]}
                onPress={() => setSuggestionVisible(false)}
              >
                <Text style={[styles.modalCancelText, { color: colors.mutedForeground }]}>
                  {t('illustrateBook.close')}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

type ChapterCardColors = {
  card: string;
  border: string;
  primary: string;
  primaryForeground: string;
  foreground: string;
  mutedForeground: string;
  muted: string;
  accent: string;
  secondary: string;
};

function ChapterIllustrationCard({
  chapter,
  count,
  slots,
  loadingSlot,
  isAnyLoading,
  onGenerateSlot,
  onSuggest,
  onShareImage,
  onPreviewImage,
  onDeleteSlot,
  customDescription,
  onDescriptionChange,
  colors,
}: {
  chapter: Chapter;
  count: number;
  slots: (string | null)[];
  loadingSlot: number | null;
  isAnyLoading: boolean;
  onGenerateSlot: (slotIndex: number) => void;
  onSuggest: () => void;
  onShareImage: (base64: string) => void;
  onPreviewImage: (base64: string) => void;
  onDeleteSlot: (slotIndex: number) => void;
  customDescription: string;
  onDescriptionChange: (text: string) => void;
  colors: ChapterCardColors;
}) {
  const { t } = useTranslation();
  const hasContent = chapter.sections.some((s) => s.content.trim().length > 0);

  return (
    <View
      style={[
        chapterStyles.card,
        { backgroundColor: colors.card, borderColor: colors.border },
      ]}
    >
      {/* Header */}
      <View style={chapterStyles.header}>
        <View style={[chapterStyles.badge, { backgroundColor: colors.primary }]}>
          <Text style={[chapterStyles.badgeText, { color: colors.primaryForeground }]}>
            {chapter.number}
          </Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text
            style={[chapterStyles.title, { color: colors.foreground }]}
            numberOfLines={1}
          >
            {chapter.title}
          </Text>
          <Text style={[chapterStyles.counter, { color: colors.mutedForeground }]}>
            {count} / {MAX_PER_CHAPTER} used
          </Text>
        </View>
      </View>

      {/* Progress bar */}
      <View style={[chapterStyles.bar, { backgroundColor: colors.border }]}>
        <View
          style={[
            chapterStyles.barFill,
            {
              backgroundColor: count >= MAX_PER_CHAPTER ? colors.muted : colors.accent,
              width: `${(count / MAX_PER_CHAPTER) * 100}%`,
            },
          ]}
        />
      </View>

      {!hasContent && (
        <Text style={[chapterStyles.noContent, { color: colors.mutedForeground }]}>
          Write content in this chapter to enable illustration generation.
        </Text>
      )}

      {/* Describe your illustration */}
      <Text style={[chapterStyles.describeLabel, { color: colors.mutedForeground }]}>
        {t('illustrateBook.describeLabel')}
      </Text>
      <TextInput
        value={customDescription}
        onChangeText={onDescriptionChange}
        placeholder={t('illustrateBook.describePlaceholder')}
        placeholderTextColor={colors.mutedForeground}
        style={[
          chapterStyles.describeInput,
          { color: colors.foreground, borderColor: customDescription.trim() ? colors.primary : colors.border, backgroundColor: colors.secondary },
        ]}
        multiline
        maxLength={400}
      />
      {!customDescription.trim() && (
        <Text style={[chapterStyles.describeHint, { color: colors.mutedForeground }]}>
          {t('illustrateBook.describeHint')}
        </Text>
      )}

      {/* 5-slot grid */}
      <View style={chapterStyles.slotsRow}>
        {Array.from({ length: MAX_PER_CHAPTER }).map((_, i) => {
          const image = slots[i] ?? null;
          const isLoading = loadingSlot === i;
          const canGenerate = hasContent && !isAnyLoading && count < MAX_PER_CHAPTER;

          return (
            <SlotCell
              key={i}
              image={image}
              isLoading={isLoading}
              canTap={canGenerate}
              onPress={() => onGenerateSlot(i)}
              onLongPress={() => image && onShareImage(image)}
              onPreview={() => image && onPreviewImage(image)}
              onDelete={() => image && onDeleteSlot(i)}
              colors={colors}
            />
          );
        })}
      </View>

      <TouchableOpacity
        onPress={onSuggest}
        activeOpacity={0.8}
        style={[chapterStyles.suggestBtn, { borderColor: colors.border, backgroundColor: colors.secondary }]}
      >
        <Feather name="star" size={14} color={colors.primary} />
        <Text style={[chapterStyles.suggestText, { color: colors.foreground }]}>
          Ask AI for a scene suggestion
        </Text>
      </TouchableOpacity>

      {count >= MAX_PER_CHAPTER && (
        <Text style={[chapterStyles.limitNote, { color: colors.mutedForeground }]}>
          All 5 illustration slots used for this chapter.
        </Text>
      )}
    </View>
  );
}

function SlotCell({
  image,
  isLoading,
  canTap,
  onPress,
  onLongPress,
  onPreview,
  onDelete,
  colors,
}: {
  image: string | null;
  isLoading: boolean;
  canTap: boolean;
  onPress: () => void;
  onLongPress: () => void;
  onPreview: () => void;
  onDelete: () => void;
  colors: ChapterCardColors;
}) {
  if (isLoading) {
    return (
      <View style={[slotStyles.cell, { backgroundColor: colors.primary + '18', borderColor: colors.primary }]}>
        <ActivityIndicator color={colors.primary} size="small" />
        <Text style={[slotStyles.genText, { color: colors.primary }]}>…</Text>
      </View>
    );
  }

  if (image) {
    return (
      <View style={slotStyles.cell}>
        <TouchableOpacity
          onPress={onPreview}
          onLongPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            onLongPress();
          }}
          activeOpacity={0.85}
          style={StyleSheet.absoluteFill}
          delayLongPress={400}
        >
          <Image
            source={{ uri: `data:image/png;base64,${image}` }}
            style={slotStyles.image}
            resizeMode="cover"
          />
          <View style={slotStyles.previewHint}>
            <Feather name="eye" size={10} color="rgba(255,255,255,0.85)" />
            <Text style={slotStyles.previewHintText}>Preview</Text>
          </View>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={onDelete}
          style={slotStyles.deleteBtn}
          hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
        >
          <View style={slotStyles.deleteIconBg}>
            <Feather name="trash-2" size={11} color="#fff" />
          </View>
        </TouchableOpacity>
      </View>
    );
  }

  // Empty slot
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      disabled={!canTap}
      style={[
        slotStyles.cell,
        {
          backgroundColor: canTap ? colors.secondary : colors.muted + '40',
          borderColor: canTap ? colors.border : colors.muted,
          borderStyle: canTap ? 'dashed' : 'solid',
        },
      ]}
    >
      <Feather name={canTap ? 'plus' : 'lock'} size={18} color={canTap ? colors.primary : colors.mutedForeground} />
      <Text style={[slotStyles.emptyHintText, { color: colors.mutedForeground }]}>
        {canTap ? 'Generate' : 'Locked'}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  centered: { alignItems: 'center', justifyContent: 'center' },
  scroll: { paddingHorizontal: 20, paddingTop: 20, gap: 14 },
  closeBtn: {
    alignSelf: 'flex-end',
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notFound: {
    textAlign: 'center',
    fontSize: 16,
    fontFamily: 'Inter_400Regular',
    marginTop: 60,
  },
  hero: { alignItems: 'center', paddingVertical: 12, gap: 10 },
  heroIcon: {
    width: 80,
    height: 80,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroTitle: {
    fontSize: 26,
    fontFamily: 'Inter_700Bold',
    letterSpacing: -0.5,
    textAlign: 'center',
    marginTop: 4,
  },
  heroSubtitle: {
    fontSize: 15,
    fontFamily: 'Inter_400Regular',
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 16,
  },
  sectionLabel: {
    fontSize: 11,
    fontFamily: 'Inter_600SemiBold',
    letterSpacing: 0.8,
    marginTop: 4,
  },
  lockedStyleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
  },
  lockedEmoji: { fontSize: 26 },
  lockedStyleLabel: { fontSize: 15, fontFamily: 'Inter_600SemiBold' },
  lockedStyleDesc: { fontSize: 12, fontFamily: 'Inter_400Regular', marginTop: 1 },
  lockedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  lockedBadgeText: { fontSize: 11, fontFamily: 'Inter_500Medium' },
  styleRow: {
    flexDirection: 'row',
    gap: 10,
    paddingVertical: 4,
    paddingRight: 20,
  },
  styleChip: {
    width: 130,
    borderRadius: 16,
    borderWidth: 1.5,
    padding: 14,
    gap: 4,
  },
  styleEmoji: { fontSize: 22 },
  styleLabel: { fontSize: 14, fontFamily: 'Inter_600SemiBold', marginTop: 2 },
  styleDesc: { fontSize: 11, fontFamily: 'Inter_400Regular', lineHeight: 15 },
  input: {
    width: '100%',
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
  },
  textArea: {
    minHeight: 88,
    textAlignVertical: 'top',
  },
  styleHint: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    marginTop: 6,
  },
  emptyCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 24,
    alignItems: 'center',
    gap: 10,
  },
  emptyText: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    textAlign: 'center',
    lineHeight: 20,
  },
  featuresCard: { borderRadius: 16, borderWidth: 1, overflow: 'hidden' },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
  },
  featureIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureEmoji: { fontSize: 18 },
  featureText: { flex: 1, gap: 2 },
  featureLabel: { fontSize: 15, fontFamily: 'Inter_600SemiBold' },
  featureDesc: { fontSize: 12, fontFamily: 'Inter_400Regular', lineHeight: 18 },
  priceBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  priceBannerText: { fontSize: 14, fontFamily: 'Inter_600SemiBold', color: '#fff' },
  errorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FEF2F2',
    borderRadius: 10,
    padding: 12,
  },
  errorText: { fontSize: 13, fontFamily: 'Inter_400Regular', color: '#DC2626', flex: 1 },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 16,
    borderRadius: 30,
    marginTop: 4,
  },
  actionBtnText: { fontSize: 17, fontFamily: 'Inter_600SemiBold', color: '#fff' },
  includedNote: { fontSize: 12, fontFamily: 'Inter_400Regular', textAlign: 'center' },
  legalNote: { fontSize: 11, fontFamily: 'Inter_400Regular', textAlign: 'center', lineHeight: 16 },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  modalBox: {
    width: '100%',
    borderRadius: 20,
    borderWidth: 1,
    padding: 24,
    alignItems: 'center',
    gap: 12,
  },
  modalIcon: {
    width: 56,
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  modalTitle: { fontSize: 20, fontFamily: 'Inter_700Bold', letterSpacing: -0.3 },
  modalBody: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    textAlign: 'center',
    lineHeight: 20,
  },
  suggestionChapterTitle: {
    fontSize: 15,
    fontFamily: 'Inter_600SemiBold',
    textAlign: 'center',
    marginTop: 2,
  },
  suggestionChapterPreview: {
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    textAlign: 'center',
    lineHeight: 18,
    marginTop: 4,
  },
  modalButtons: { flexDirection: 'row', gap: 10, marginTop: 8, width: '100%' },
  modalCancelBtn: {
    flex: 1,
    paddingVertical: 13,
    borderRadius: 30,
    borderWidth: 1,
    alignItems: 'center',
  },
  modalCancelText: { fontSize: 15, fontFamily: 'Inter_500Medium' },
  modalConfirmBtn: { flex: 1, paddingVertical: 13, borderRadius: 30, alignItems: 'center' },
  modalConfirmText: { fontSize: 15, fontFamily: 'Inter_600SemiBold', color: '#fff' },
  previewOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.65)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  previewBackdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  previewCard: {
    width: '100%',
    maxWidth: 520,
    borderRadius: 24,
    padding: 16,
  },
  previewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  previewCloseBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewSaveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 20,
  },
  previewSaveBtnText: {
    fontSize: 13,
    fontFamily: 'Inter_600SemiBold',
    color: '#fff',
  },
  previewImage: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: 18,
  },
});

const chapterStyles = StyleSheet.create({
  card: { borderRadius: 16, borderWidth: 1, padding: 14, gap: 10 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  badge: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  badgeText: { fontSize: 16, fontFamily: 'Inter_700Bold' },
  title: { fontSize: 15, fontFamily: 'Inter_600SemiBold' },
  counter: { fontSize: 12, fontFamily: 'Inter_400Regular', marginTop: 1 },
  bar: { height: 3, borderRadius: 2, overflow: 'hidden' },
  barFill: { height: '100%', borderRadius: 2 },
  noContent: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    fontStyle: 'italic',
    lineHeight: 18,
  },
  slotsRow: { flexDirection: 'row', gap: 10, flexWrap: 'wrap' },
  suggestBtn: {
    marginTop: 10,
    borderRadius: 14,
    borderWidth: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  suggestText: {
    fontSize: 13,
    fontFamily: 'Inter_500Medium',
  },
  limitNote: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  describeLabel: {
    fontSize: 10,
    fontFamily: 'Inter_600SemiBold',
    letterSpacing: 0.7,
    marginTop: 2,
  },
  describeInput: {
    borderWidth: 1.5,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    minHeight: 70,
    textAlignVertical: 'top',
    lineHeight: 19,
  },
  describeHint: {
    fontSize: 11,
    fontFamily: 'Inter_400Regular',
    fontStyle: 'italic',
    lineHeight: 16,
    marginTop: -4,
  },
});

const SLOT_SIZE = 72;

const slotStyles = StyleSheet.create({
  cell: {
    width: SLOT_SIZE,
    height: SLOT_SIZE,
    borderRadius: 12,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    position: 'relative',
  },
  image: { width: SLOT_SIZE, height: SLOT_SIZE },
  genText: { fontSize: 10, fontFamily: 'Inter_500Medium', marginTop: 2 },
  previewHint: {
    position: 'absolute',
    bottom: 3,
    left: 3,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(0,0,0,0.4)',
    borderRadius: 999,
    paddingHorizontal: 6,
    paddingVertical: 3,
  },
  previewHintText: { color: 'rgba(255,255,255,0.9)', fontSize: 10, fontFamily: 'Inter_600SemiBold' },
  deleteBtn: {
    position: 'absolute',
    top: 4,
    right: 4,
    zIndex: 2,
  },
  deleteIconBg: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: 'rgba(220,38,38,0.85)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyHintText: { fontSize: 10, fontFamily: 'Inter_600SemiBold', marginTop: 4 },
});
