import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams, useNavigation } from 'expo-router';
import React, {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';
import {
  ActivityIndicator,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { KeyboardAwareScrollViewCompat as KeyboardAwareScrollView } from '@/components/KeyboardAwareScrollViewCompat';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { API_BASE } from '@/constants/api';
import { useBooks } from '@/context/BookContext';
import { useLanguage } from '@/context/LanguageContext';
import { useColors } from '@/hooks/useColors';
import { useSubscription } from '@/lib/revenuecat';
import { Section, SectionType } from '@/types';
import { useTranslation } from 'react-i18next';

type Phase = 'loading-questions' | 'questions' | 'generating' | 'review';

interface QA {
  question: string;
  answer: string;
}

interface GeneratedSection {
  type: string;
  prompt: string;
  content: string;
}

const GENERATION_STEP_KEYS = [
  'chapterAI.generationSteps.researching',
  'chapterAI.generationSteps.opening',
  'chapterAI.generationSteps.atmosphere',
  'chapterAI.generationSteps.characters',
  'chapterAI.generationSteps.turning',
  'chapterAI.generationSteps.dialogue',
  'chapterAI.generationSteps.closing',
] as const;

export default function ChapterAIScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const { t } = useTranslation();
  const { chapterId, bookId } = useLocalSearchParams<{
    chapterId: string;
    bookId: string;
  }>();
  const { getBook, getChapter, replaceChapterSections } = useBooks();
  const { isSubscribed } = useSubscription();

  const book = getBook(bookId ?? '');
  const chapter = getChapter(bookId ?? '', chapterId ?? '');
  const { language } = useLanguage();

  const [phase, setPhase] = useState<Phase>('loading-questions');
  const [questions, setQuestions] = useState<string[]>([]);
  const [answers, setAnswers] = useState<QA[]>([]);
  const [currentQ, setCurrentQ] = useState(0);
  const [currentAnswer, setCurrentAnswer] = useState('');
  const [generatedSections, setGeneratedSections] = useState<GeneratedSection[]>([]);
  const [genStep, setGenStep] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const scrollRef = useRef<ScrollView>(null);
  const genStepTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  useLayoutEffect(() => {
    navigation.setOptions({
      title: t('chapterAI.title'),
      headerBackTitle: t('common.back'),
    });
  }, [navigation, t]);

  // Load questions on mount
  useEffect(() => {
    if (!book || !chapter) return;
    fetchQuestions();
  }, []);

  // Cycle through generation steps
  useEffect(() => {
    if (phase === 'generating') {
      genStepTimer.current = setInterval(() => {
        setGenStep((s) => (s + 1) % GENERATION_STEP_KEYS.length);
      }, 1800);
    }
    return () => {
      if (genStepTimer.current) clearInterval(genStepTimer.current);
    };
  }, [phase]);

  const fetchQuestions = async () => {
    setPhase('loading-questions');
    setError(null);
    try {
      const previousChapters = book!.chapters
        .filter((c) => c.id !== chapter!.id)
        .map((c) => c.title);

      const response = await fetch(`${API_BASE}/ai/chapter-questions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookTitle: book!.title,
          genre: book!.genre,
          bookDescription: book!.description,
          chapterTitle: chapter!.title,
          chapterNumber: chapter!.number,
          previousChapters,
          characters: book!.characters ?? [],
          language,
        }),
      });

      if (!response.ok) throw new Error('Server error');
      const data = (await response.json()) as { questions: string[] };
      setQuestions(data.questions);
      setAnswers(data.questions.map((q) => ({ question: q, answer: '' })));
      setCurrentQ(0);
      setCurrentAnswer('');
      setPhase('questions');
    } catch {
      setError(t('chapterAI.connectionError'));
      setPhase('questions');
    }
  };

  const handleNextQuestion = useCallback(() => {
    if (!currentAnswer.trim() && currentQ < questions.length - 1) {
      setCurrentQ((q) => q + 1);
      setCurrentAnswer('');
      return;
    }

    const updated = [...answers];
    updated[currentQ] = {
      question: questions[currentQ],
      answer: currentAnswer.trim(),
    };
    setAnswers(updated);

    if (currentQ < questions.length - 1) {
      Haptics.selectionAsync();
      setCurrentQ((q) => q + 1);
      setCurrentAnswer(updated[currentQ + 1]?.answer ?? '');
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
    } else {
      handleGenerate(updated);
    }
  }, [currentAnswer, currentQ, questions, answers]);

  const handlePrevQuestion = useCallback(() => {
    if (currentQ === 0) return;
    const updated = [...answers];
    updated[currentQ] = {
      question: questions[currentQ],
      answer: currentAnswer.trim(),
    };
    setAnswers(updated);
    setCurrentQ((q) => q - 1);
    setCurrentAnswer(updated[currentQ - 1]?.answer ?? '');
  }, [currentQ, currentAnswer, answers, questions]);

  const handleGenerate = async (finalAnswers: QA[]) => {
    setPhase('generating');
    setGenStep(0);
    setError(null);

    try {
      const response = await fetch(`${API_BASE}/ai/chapter-generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookTitle: book!.title,
          genre: book!.genre,
          bookDescription: book!.description,
          chapterTitle: chapter!.title,
          chapterNumber: chapter!.number,
          answers: finalAnswers.filter((a) => a.answer.trim()),
          characters: book!.characters ?? [],
          language,
        }),
      });

      if (!response.ok) {
        if (response.status === 429) {
          const body = await response.json().catch(() => ({})) as { error?: string };
          setError(body.error ?? t('chapterAI.quotaError'));
          setPhase('questions');
          return;
        }
        throw new Error('Server error');
      }
      const data = (await response.json()) as {
        sections: GeneratedSection[];
      };
      setGeneratedSections(data.sections);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setPhase('review');
    } catch {
      setError(t('chapterAI.generationError'));
      setPhase('questions');
    }
  };


  const bottomPadding = (Platform.OS === 'web' ? 34 : insets.bottom) + 24;

  if (!book || !chapter) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <Text style={[styles.errorText, { color: colors.mutedForeground }]}>
          {t('chapterAI.chapterNotFound')}
        </Text>
      </View>
    );
  }

  // ── LOADING QUESTIONS ────────────────────────────────────────────────────
  if (phase === 'loading-questions') {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <View style={[styles.aiAvatar, { backgroundColor: colors.primary }]}>
          <Feather name="feather" size={28} color={colors.primaryForeground} />
        </View>
        <Text style={[styles.loadingTitle, { color: colors.foreground }]}>
          {t('chapterAI.preparingQuestions')}
        </Text>
        <Text
          style={[styles.loadingSubtitle, { color: colors.mutedForeground }]}
        >
          {t('chapterAI.researching', { title: chapter.title })}
        </Text>
        <ActivityIndicator
          size="large"
          color={colors.primary}
          style={{ marginTop: 24 }}
        />
      </View>
    );
  }

  // ── GENERATING ───────────────────────────────────────────────────────────
  if (phase === 'generating') {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <View
          style={[
            styles.aiAvatarLarge,
            { backgroundColor: colors.primary },
          ]}
        >
          <Feather
            name="feather"
            size={36}
            color={colors.primaryForeground}
          />
        </View>
        <Text style={[styles.genTitle, { color: colors.foreground }]}>
          {t('chapterAI.writingChapter')}
        </Text>
        <Text
          style={[styles.genSubtitle, { color: colors.mutedForeground }]}
        >
          {t(GENERATION_STEP_KEYS[genStep])}
        </Text>
        <ActivityIndicator
          size="large"
          color={colors.primary}
          style={{ marginTop: 24 }}
        />
        <View
          style={[
            styles.genProgressCard,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
        >
          {GENERATION_STEP_KEYS.slice(0, 4).map((key, i) => (
            <View key={i} style={styles.genProgressRow}>
              <Feather
                name={i <= genStep ? 'check-circle' : 'circle'}
                size={14}
                color={
                  i < genStep
                    ? colors.accent
                    : i === genStep
                    ? colors.primary
                    : colors.border
                }
              />
              <Text
                style={[
                  styles.genProgressText,
                  {
                    color:
                      i < genStep
                        ? colors.foreground
                        : i === genStep
                        ? colors.primary
                        : colors.mutedForeground,
                    fontFamily:
                      i === genStep
                        ? 'Inter_600SemiBold'
                        : 'Inter_400Regular',
                  },
                ]}
              >
                {t(key)}
              </Text>
            </View>
          ))}
        </View>
      </View>
    );
  }

  // ── REVIEW ───────────────────────────────────────────────────────────────
  if (phase === 'review') {
    const typeColors: Record<string, string> = {
      scene: '#2D7D4A',
      description: '#7B4EA6',
      action: '#C27B2A',
      dialogue: '#1A6B9A',
      reflection: '#2A7B7B',
      character: '#B6446B',
      world: '#3A6E94',
      verse: '#9B5B8A',
      custom: '#6B6B6B',
    };

    // For free users: show 1 full section, rest are blurred/faded
    const PREVIEW_COUNT = 1;

    const renderSection = (s: GeneratedSection, i: number) => {
      const tc = typeColors[s.type] ?? '#6B6B6B';
      const isVisible = isSubscribed || i < PREVIEW_COUNT;
      return (
        <View
          key={i}
          style={[
            styles.reviewSection,
            {
              backgroundColor: colors.card,
              borderColor: colors.border,
              borderLeftColor: tc,
              opacity: isVisible ? 1 : 0.35,
            },
          ]}
        >
          <View style={[styles.reviewSectionBadge, { backgroundColor: tc + '18' }]}>
            <Text style={[styles.reviewSectionType, { color: tc }]}>
              {s.prompt}
            </Text>
          </View>
          <Text
            style={[
              styles.reviewSectionContent,
              { color: colors.foreground },
            ]}
            numberOfLines={isVisible ? undefined : 3}
          >
            {s.content}
          </Text>
          <Text
            style={[
              styles.reviewWordCount,
              { color: colors.mutedForeground },
            ]}
          >
            {t('chapterAI.wordCount', { count: s.content.split(/\s+/).filter(Boolean).length })}
          </Text>
        </View>
      );
    };

    if (!isSubscribed) {
      // Free user — show preview with paywall overlay
      return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
          <ScrollView
            contentContainerStyle={[
              styles.reviewContent,
              { paddingBottom: bottomPadding + 20 },
            ]}
            showsVerticalScrollIndicator={false}
          >
            <View
              style={[
                styles.reviewHeader,
                { backgroundColor: colors.card, borderColor: colors.border },
              ]}
            >
              <View
                style={[
                  styles.aiAvatarSmall,
                  { backgroundColor: colors.primary },
                ]}
              >
                <Feather
                  name="feather"
                  size={16}
                  color={colors.primaryForeground}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.reviewHeaderTitle, { color: colors.foreground }]}>
                  {t('chapterAI.chapterDraftReady')}
                </Text>
                <Text
                  style={[
                    styles.reviewHeaderSub,
                    { color: colors.mutedForeground },
                  ]}
                >
                  {t('chapterAI.sectionsWritten', { count: generatedSections.length })}
                </Text>
              </View>
            </View>

            {/* First section — fully visible */}
            {generatedSections.slice(0, PREVIEW_COUNT).map((s, i) =>
              renderSection(s, i)
            )}

            {/* Remaining sections — faded, capped height, with gradient + CTA overlay */}
            {generatedSections.length > PREVIEW_COUNT && (
              <View style={styles.lockedPreviewContainer}>
                {generatedSections.slice(PREVIEW_COUNT).map((s, i) =>
                  renderSection(s, i + PREVIEW_COUNT)
                )}
                {/* Gradient fade that blends into the CTA card below */}
                <LinearGradient
                  colors={[
                    'transparent',
                    colors.background + 'E0',
                    colors.background,
                  ]}
                  style={styles.previewFade}
                  pointerEvents="none"
                />
              </View>
            )}

            {/* Paywall CTA card — negative marginTop overlays the faded preview */}
            <View
              style={[
                styles.paywallCard,
                {
                  backgroundColor: colors.card,
                  borderColor: colors.primary + '40',
                  marginTop: generatedSections.length > PREVIEW_COUNT ? -32 : 0,
                },
              ]}
            >
              <View
                style={[styles.paywallIconWrap, { backgroundColor: colors.primary + '18' }]}
              >
                <Feather name="lock" size={24} color={colors.primary} />
              </View>
              <Text style={[styles.paywallTitle, { color: colors.foreground }]}>
                {t('chapterAI.subscribeToApply')}
              </Text>
              <Text style={[styles.paywallSubtitle, { color: colors.mutedForeground }]}>
                {t('chapterAI.subscribeSubtitle')}
              </Text>
              <TouchableOpacity
                style={[styles.paywallBtn, { backgroundColor: colors.primary }]}
                onPress={() => router.push('/paywall')}
                activeOpacity={0.85}
              >
                <Feather name="zap" size={16} color="#fff" />
                <Text style={styles.paywallBtnText}>{t('chapterAI.unlockWithPro')}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.regenerateBtnFree}
                onPress={() => setPhase('questions')}
                activeOpacity={0.8}
              >
                <Feather name="refresh-cw" size={14} color={colors.mutedForeground} />
                <Text style={[styles.regenerateBtnFreeText, { color: colors.mutedForeground }]}>
                  {t('chapterAI.adjustAnswers')}
                </Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      );
    }

    // Subscribed user — full review with Apply button
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <ScrollView
          contentContainerStyle={[
            styles.reviewContent,
            { paddingBottom: bottomPadding + 80 },
          ]}
          showsVerticalScrollIndicator={false}
        >
          <View
            style={[
              styles.reviewHeader,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}
          >
            <View
              style={[
                styles.aiAvatarSmall,
                { backgroundColor: colors.primary },
              ]}
            >
              <Feather
                name="feather"
                size={16}
                color={colors.primaryForeground}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.reviewHeaderTitle, { color: colors.foreground }]}>
                {t('chapterAI.chapterDraftReady')}
              </Text>
              <Text
                style={[
                  styles.reviewHeaderSub,
                  { color: colors.mutedForeground },
                ]}
              >
                {t('chapterAI.sectionsWrittenReady', { count: generatedSections.length })}
              </Text>
            </View>
          </View>

          {generatedSections.map((s, i) => renderSection(s, i))}
        </ScrollView>

        {/* Fixed bottom actions */}
        <View
          style={[
            styles.reviewActions,
            {
              backgroundColor: colors.background,
              borderTopColor: colors.border,
              paddingBottom: (Platform.OS === 'web' ? 34 : insets.bottom) + 12,
            },
          ]}
        >
          <TouchableOpacity
            style={[
              styles.regenerateBtn,
              { borderColor: colors.border },
            ]}
            onPress={() => setPhase('questions')}
            activeOpacity={0.8}
          >
            <Feather name="refresh-cw" size={16} color={colors.primary} />
            <Text
              style={[styles.regenerateBtnText, { color: colors.primary }]}
            >
              {t('chapterAI.adjustAnswers')}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.applyBtn,
              { backgroundColor: colors.primary },
            ]}
            onPress={handleApplyContent}
            activeOpacity={0.85}
          >
            <Feather
              name="check"
              size={18}
              color={colors.primaryForeground}
            />
            <Text
              style={[styles.applyBtnText, { color: colors.primaryForeground }]}
            >
              {t('chapterAI.applyChapter')}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // ── QUESTIONS ────────────────────────────────────────────────────────────
  const progress = questions.length > 0 ? (currentQ + 1) / questions.length : 0;
  const isLastQuestion = currentQ === questions.length - 1;

  return (
    <KeyboardAwareScrollView
      ref={scrollRef as any}
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={[
        styles.questionsContent,
        { paddingBottom: bottomPadding },
      ]}
      bottomOffset={80}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      {error && (
        <View
          style={[
            styles.errorBanner,
            { backgroundColor: '#FEE2E2', borderColor: '#FCA5A5' },
          ]}
        >
          <Feather name="alert-circle" size={14} color="#DC2626" />
          <Text style={[styles.errorBannerText, { color: '#DC2626' }]}>
            {error}
          </Text>
        </View>
      )}

      {/* Chapter info */}
      <View
        style={[
          styles.chapterInfo,
          { backgroundColor: colors.card, borderColor: colors.border },
        ]}
      >
        <Text style={[styles.chapterInfoLabel, { color: colors.mutedForeground }]}>
          {t('chapterAI.chapterLabel', { number: chapter.number })}
        </Text>
        <Text
          style={[styles.chapterInfoTitle, { color: colors.foreground }]}
          numberOfLines={1}
        >
          {chapter.title}
        </Text>
      </View>

      {/* Progress */}
      <View style={styles.progressRow}>
        <View
          style={[styles.progressTrack, { backgroundColor: colors.border }]}
        >
          <View
            style={[
              styles.progressFill,
              { backgroundColor: colors.primary, width: `${progress * 100}%` },
            ]}
          />
        </View>
        <Text
          style={[styles.progressLabel, { color: colors.mutedForeground }]}
        >
          {currentQ + 1}/{questions.length}
        </Text>
      </View>

      {/* Previous answered questions (summary) */}
      {answers.slice(0, currentQ).map((qa, i) => (
        <View key={i} style={styles.answeredRow}>
          <View
            style={[
              styles.aiBubble,
              { backgroundColor: colors.secondary },
            ]}
          >
            <Text
              style={[styles.aiBubbleText, { color: colors.foreground }]}
            >
              {qa.question}
            </Text>
          </View>
          {qa.answer.trim() && (
            <View
              style={[
                styles.userBubble,
                { backgroundColor: colors.primary },
              ]}
            >
              <Text
                style={[
                  styles.userBubbleText,
                  { color: colors.primaryForeground },
                ]}
              >
                {qa.answer}
              </Text>
            </View>
          )}
        </View>
      ))}

      {/* Current question */}
      {questions[currentQ] && (
        <>
          <View style={styles.currentQRow}>
            <View
              style={[
                styles.aiAvatarTiny,
                { backgroundColor: colors.primary },
              ]}
            >
              <Feather
                name="feather"
                size={12}
                color={colors.primaryForeground}
              />
            </View>
            <View
              style={[
                styles.aiBubble,
                {
                  backgroundColor: colors.secondary,
                  flex: 1,
                  borderWidth: 1,
                  borderColor: colors.border,
                },
              ]}
            >
              <Text
                style={[
                  styles.aiBubbleText,
                  { color: colors.foreground, fontFamily: 'Inter_500Medium' },
                ]}
              >
                {questions[currentQ]}
              </Text>
            </View>
          </View>

          {/* Answer input */}
          <TextInput
            style={[
              styles.answerInput,
              {
                color: colors.foreground,
                backgroundColor: colors.card,
                borderColor: colors.border,
              },
            ]}
            placeholder={t('chapterAI.answerPlaceholder')}
            placeholderTextColor={colors.mutedForeground}
            value={currentAnswer}
            onChangeText={setCurrentAnswer}
            multiline
            textAlignVertical="top"
            autoFocus={false}
          />

          {/* Navigation */}
          <View style={styles.navRow}>
            {currentQ > 0 && (
              <TouchableOpacity
                style={[styles.prevBtn, { borderColor: colors.border }]}
                onPress={handlePrevQuestion}
                activeOpacity={0.8}
              >
                <Feather
                  name="arrow-left"
                  size={16}
                  color={colors.mutedForeground}
                />
                <Text
                  style={[
                    styles.prevBtnText,
                    { color: colors.mutedForeground },
                  ]}
                >
                  {t('chapterAI.back')}
                </Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={[
                styles.nextBtn,
                {
                  backgroundColor:
                    currentAnswer.trim() || !isLastQuestion
                      ? colors.primary
                      : colors.muted,
                  flex: currentQ === 0 ? 1 : undefined,
                },
              ]}
              onPress={handleNextQuestion}
              activeOpacity={0.85}
            >
              <Text
                style={[
                  styles.nextBtnText,
                  {
                    color:
                      currentAnswer.trim() || !isLastQuestion
                        ? colors.primaryForeground
                        : colors.mutedForeground,
                  },
                ]}
              >
                {isLastQuestion ? t('chapterAI.generateChapter') : t('chapterAI.next')}
              </Text>
              <Feather
                name={isLastQuestion ? 'feather' : 'arrow-right'}
                size={16}
                color={
                  currentAnswer.trim() || !isLastQuestion
                    ? colors.primaryForeground
                    : colors.mutedForeground
                }
              />
            </TouchableOpacity>
          </View>

          {!isLastQuestion && (
            <TouchableOpacity
              onPress={handleNextQuestion}
              style={styles.skipBtn}
            >
              <Text style={[styles.skipText, { color: colors.mutedForeground }]}>
                {t('chapterAI.skipQuestion')}
              </Text>
            </TouchableOpacity>
          )}
        </>
      )}
    </KeyboardAwareScrollView>
  );

  // ── Apply AI content to chapter ──────────────────────────────────────────
  function handleApplyContent() {
    if (!generatedSections.length) return;
    const ALLOWED: ReadonlySet<SectionType> = new Set<SectionType>([
      'scene',
      'description',
      'action',
      'dialogue',
      'reflection',
      'character',
      'world',
      'verse',
      'custom',
    ]);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    replaceChapterSections(
      bookId ?? '',
      chapterId ?? '',
      generatedSections.map((s) => ({
        type: ALLOWED.has(s.type as SectionType)
          ? (s.type as SectionType)
          : 'custom',
        prompt: s.prompt,
        content: s.content,
      }))
    );
    router.back();
  }
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    gap: 12,
  },
  aiAvatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  aiAvatarLarge: {
    width: 88,
    height: 88,
    borderRadius: 44,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  aiAvatarSmall: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  aiAvatarTiny: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  loadingTitle: {
    fontSize: 22,
    fontFamily: 'Inter_700Bold',
    textAlign: 'center',
  },
  loadingSubtitle: {
    fontSize: 15,
    fontFamily: 'Inter_400Regular',
    textAlign: 'center',
  },
  genTitle: {
    fontSize: 24,
    fontFamily: 'Inter_700Bold',
    textAlign: 'center',
    letterSpacing: -0.3,
  },
  genSubtitle: {
    fontSize: 15,
    fontFamily: 'Inter_400Regular',
    textAlign: 'center',
    marginTop: 4,
  },
  genProgressCard: {
    marginTop: 32,
    borderRadius: 16,
    borderWidth: 1,
    padding: 20,
    gap: 14,
    width: '100%',
    maxWidth: 320,
  },
  genProgressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  genProgressText: {
    fontSize: 14,
    flex: 1,
  },
  errorText: {
    fontSize: 16,
    fontFamily: 'Inter_400Regular',
    textAlign: 'center',
  },
  questionsContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    gap: 12,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
  },
  errorBannerText: {
    flex: 1,
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
  },
  chapterInfo: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 14,
    gap: 4,
  },
  chapterInfoLabel: {
    fontSize: 10,
    fontFamily: 'Inter_600SemiBold',
    letterSpacing: 1,
  },
  chapterInfoTitle: {
    fontSize: 18,
    fontFamily: 'Inter_700Bold',
    letterSpacing: -0.2,
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  progressTrack: {
    flex: 1,
    height: 5,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  progressLabel: {
    fontSize: 12,
    fontFamily: 'Inter_500Medium',
    width: 34,
    textAlign: 'right',
  },
  answeredRow: {
    gap: 6,
    opacity: 0.65,
  },
  currentQRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  aiBubble: {
    borderRadius: 16,
    borderBottomLeftRadius: 4,
    padding: 14,
  },
  aiBubbleText: {
    fontSize: 15,
    fontFamily: 'Inter_400Regular',
    lineHeight: 22,
  },
  userBubble: {
    borderRadius: 16,
    borderBottomRightRadius: 4,
    padding: 14,
    alignSelf: 'flex-end',
    maxWidth: '85%',
  },
  userBubbleText: {
    fontSize: 15,
    fontFamily: 'Inter_400Regular',
    lineHeight: 22,
  },
  answerInput: {
    borderRadius: 14,
    borderWidth: 1.5,
    padding: 14,
    fontSize: 15,
    fontFamily: 'Inter_400Regular',
    lineHeight: 22,
    minHeight: 100,
  },
  navRow: {
    flexDirection: 'row',
    gap: 10,
  },
  prevBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 30,
    borderWidth: 1,
  },
  prevBtnText: {
    fontSize: 15,
    fontFamily: 'Inter_500Medium',
  },
  nextBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 30,
  },
  nextBtnText: {
    fontSize: 16,
    fontFamily: 'Inter_600SemiBold',
  },
  skipBtn: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  skipText: {
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
  },
  reviewContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    gap: 12,
  },
  reviewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
  },
  reviewHeaderTitle: {
    fontSize: 16,
    fontFamily: 'Inter_700Bold',
  },
  reviewHeaderSub: {
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    marginTop: 2,
  },
  reviewSection: {
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderLeftWidth: 3,
    gap: 10,
  },
  reviewSectionBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  reviewSectionType: {
    fontSize: 11,
    fontFamily: 'Inter_600SemiBold',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  reviewSectionContent: {
    fontSize: 15,
    fontFamily: 'Inter_400Regular',
    lineHeight: 24,
  },
  reviewWordCount: {
    fontSize: 11,
    fontFamily: 'Inter_400Regular',
    textAlign: 'right',
  },
  reviewActions: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 16,
    paddingTop: 12,
    borderTopWidth: 1,
  },
  regenerateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 30,
    borderWidth: 1,
  },
  regenerateBtnText: {
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
  },
  applyBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 30,
  },
  applyBtnText: {
    fontSize: 16,
    fontFamily: 'Inter_600SemiBold',
  },
  lockedPreviewContainer: {
    gap: 12,
  },
  previewFade: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 120,
  },
  paywallCard: {
    borderRadius: 20,
    borderWidth: 1.5,
    padding: 24,
    alignItems: 'center',
    gap: 12,
    marginTop: 4,
  },
  paywallIconWrap: {
    width: 56,
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  paywallTitle: {
    fontSize: 20,
    fontFamily: 'Inter_700Bold',
    textAlign: 'center',
    letterSpacing: -0.3,
  },
  paywallSubtitle: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    textAlign: 'center',
    lineHeight: 21,
  },
  paywallBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 30,
    width: '100%',
    marginTop: 4,
  },
  paywallBtnText: {
    fontSize: 16,
    fontFamily: 'Inter_600SemiBold',
    color: '#fff',
  },
  regenerateBtnFree: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
  },
  regenerateBtnFreeText: {
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
  },
});
