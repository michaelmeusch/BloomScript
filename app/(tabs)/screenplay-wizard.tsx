import { Feather } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import { readAsStringAsync, EncodingType } from 'expo-file-system/legacy';
import * as Haptics from 'expo-haptics';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import ScreenplayLoader, { ANALYSIS_MESSAGES, PLOT_MESSAGES, SCENE_MESSAGES } from '@/components/ScreenplayLoader';

import { useBooks } from '@/context/BookContext';
import { useColors } from '@/hooks/useColors';
import { API_BASE } from '@/constants/api';
import { useAuth } from '@clerk/expo';
import { useLanguage } from '@/context/LanguageContext';
import { SUPPORTED_LANGUAGES } from '@/lib/i18n';

interface AnalysisResult {
  themes: string[];
  coreThemes: string[];
  mainMessages: string[];
  openingConcepts: { title: string; description: string }[];
}

interface PlotBeat { beat: string; description: string; }
interface PlotAct { name: string; beats: PlotBeat[]; }
interface PlotResult { acts: PlotAct[]; }

const TOTAL_STEPS = 7;

const FORMAT_OPTIONS: { value: 'short-film' | 'feature' | 'play'; label: string; sub: string }[] = [
  { value: 'short-film', label: 'Short Film', sub: 'Under 40 minutes · 1–40 pages' },
  { value: 'feature', label: 'Feature Film', sub: '75–180 minutes · 75–180 pages' },
  { value: 'play', label: 'Stage Play / Theatre', sub: 'Acts & scenes · stage directions' },
];

const RUNTIME_PRESETS: Record<'short-film' | 'feature' | 'play', string[]> = {
  'short-film': ['5 min', '10 min', '15 min', '20 min', '30 min', '40 min'],
  feature: ['80 min', '90 min', '100 min', '110 min', '120 min', '150 min'],
  play: ['45 min', '60 min', '75 min', '90 min', '2 hrs', '2.5 hrs'],
};

export default function ScreenplayWizardScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { getToken } = useAuth();
  const { bookId } = useLocalSearchParams<{ bookId: string }>();
  const { getBook, updateBook } = useBooks();
  const { language } = useLanguage();
  const languageName = SUPPORTED_LANGUAGES.find(l => l.code === language)?.label ?? 'English';
  const scrollRef = useRef<ScrollView>(null);

  const book = getBook(bookId ?? '');

  const [step, setStep] = useState(0);
  const [description, setDescription] = useState(book?.description ?? '');
  const [fileLoading, setFileLoading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [generatingPlots, setGeneratingPlots] = useState(false);
  const [generatingScene, setGeneratingScene] = useState(false);
  const [plotResult, setPlotResult] = useState<PlotResult | null>(null);
  const [generatedScene, setGeneratedScene] = useState<string | null>(null);
  const [activeLoader, setActiveLoader] = useState<'analysis' | 'plots' | 'scene' | null>(null);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(
    book?.screenplayCoreTheme
      ? {
          themes: book.screenplayThemes ?? [],
          coreThemes: [book.screenplayCoreTheme],
          mainMessages: book.screenplayMainMessage ? [book.screenplayMainMessage] : [],
          openingConcepts: book.screenplayOpeningTheme
            ? [{ title: book.screenplayOpeningTheme, description: '' }]
            : [],
        }
      : null
  );

  const [format, setFormat] = useState<'short-film' | 'feature' | 'play'>(
    book?.screenplayFormat ?? 'feature'
  );
  const [runtime, setRuntime] = useState(book?.screenplayRuntime ?? '');
  const [selectedThemes, setSelectedThemes] = useState<string[]>(book?.screenplayThemes ?? []);
  const [customThemeInput, setCustomThemeInput] = useState('');
  const [coreTheme, setCoreTheme] = useState(book?.screenplayCoreTheme ?? '');
  const [customCoreTheme, setCustomCoreTheme] = useState('');
  const [mainMessage, setMainMessage] = useState(book?.screenplayMainMessage ?? '');
  const [customMainMessage, setCustomMainMessage] = useState('');
  const [openingTheme, setOpeningTheme] = useState(book?.screenplayOpeningTheme ?? '');
  const [customOpeningTheme, setCustomOpeningTheme] = useState('');

  const scrollToTop = () => setTimeout(() => scrollRef.current?.scrollTo({ y: 0, animated: true }), 100);

  const STEP_TITLES = [
    'Film Concept',
    'Format & Length',
    'Ideas & Themes',
    'Core Theme',
    'Main Message',
    'Opening Scene',
    'Plot & Scene',
  ];

  const STEP_SUBTITLES = [
    'Describe your film, play, or story idea — or upload a synopsis file.',
    'Is this a short film, feature, or stage play? How long will it run?',
    'Select the ideas and themes that resonate with your story.',
    'Choose or write the single central theme your story explores.',
    'What is the core message you want your audience to leave with?',
    'Pick an opening concept or write your own vision for the first scene.',
    'Generate a three-act plot structure and write your opening scene.',
  ];

  const handlePickFile = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['text/plain', 'text/markdown', 'text/x-markdown', 'application/rtf'],
        copyToCacheDirectory: true,
        multiple: false,
      });
      if (result.canceled || !result.assets?.length) return;
      const asset = result.assets[0];
      const ext = (asset.name ?? '').split('.').pop()?.toLowerCase() ?? '';
      const supported = ['txt', 'md', 'rtf', 'text', 'markdown'];
      if (!supported.includes(ext) && !asset.mimeType?.includes('text')) {
        Alert.alert('Unsupported file', 'Please upload a .txt or .md synopsis file.');
        return;
      }
      setFileLoading(true);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      const text = await readAsStringAsync(asset.uri, { encoding: EncodingType.UTF8 });
      setDescription(text.trim());
    } catch {
      Alert.alert('Could not read file', 'Please try a different file.');
    } finally {
      setFileLoading(false);
    }
  };

  const wordCount = (text: string) => text.trim().split(/\s+/).filter(Boolean).length;
  const MIN_WORDS = 20;

  const handleAnalyze = async () => {
    const desc = description.trim();
    if (wordCount(desc) < MIN_WORDS) {
      Alert.alert('Too short', `Please write at least ${MIN_WORDS} words to describe your film concept.`);
      return;
    }
    setAnalyzing(true);
    setActiveLoader('analysis');
    try {
      const token = await getToken();
      const resp = await fetch(`${API_BASE}/ai/screenplay-analyze`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          description: desc,
          language: languageName !== 'English' ? languageName : undefined,
        }),
      });
      if (!resp.ok) throw new Error(`Server error ${resp.status}`);
      const data = await resp.json() as AnalysisResult;
      setAnalysis(data);
      if (selectedThemes.length === 0) setSelectedThemes(data.themes.slice(0, 3));
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      goToStep(1);
    } catch {
      Alert.alert('Analysis failed', 'Could not reach the AI. Please try again.');
    } finally {
      setAnalyzing(false);
      setActiveLoader(null);
    }
  };

  const handleGeneratePlots = async () => {
    const finalCoreTheme = coreTheme || customCoreTheme;
    const finalMainMessage = mainMessage || customMainMessage;
    setGeneratingPlots(true);
    setActiveLoader('plots');
    try {
      const token = await getToken();
      const resp = await fetch(`${API_BASE}/ai/screenplay-plots`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          description: description.trim(),
          coreTheme: finalCoreTheme || undefined,
          mainMessage: finalMainMessage || undefined,
          format,
          language: languageName !== 'English' ? languageName : undefined,
        }),
      });
      if (!resp.ok) throw new Error(`Server error ${resp.status}`);
      const data = await resp.json() as PlotResult;
      setPlotResult(data);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      scrollToTop();
    } catch {
      Alert.alert('Plot generation failed', 'Could not reach the AI. Please try again.');
    } finally {
      setGeneratingPlots(false);
      setActiveLoader(null);
    }
  };

  const handleGenerateScene = async () => {
    const finalCoreTheme = coreTheme || customCoreTheme;
    const finalMainMessage = mainMessage || customMainMessage;
    const finalOpening = openingTheme || customOpeningTheme;
    setGeneratingScene(true);
    setActiveLoader('scene');
    try {
      const token = await getToken();
      const resp = await fetch(`${API_BASE}/ai/screenplay-scene`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          description: description.trim(),
          coreTheme: finalCoreTheme || undefined,
          mainMessage: finalMainMessage || undefined,
          openingConcept: finalOpening || undefined,
          format,
          language: languageName !== 'English' ? languageName : undefined,
        }),
      });
      if (!resp.ok) throw new Error(`Server error ${resp.status}`);
      const data = await resp.json() as { scene: string };
      setGeneratedScene(data.scene);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {
      Alert.alert('Scene generation failed', 'Could not reach the AI. Please try again.');
    } finally {
      setGeneratingScene(false);
      setActiveLoader(null);
    }
  };

  const goToStep = (s: number) => {
    setStep(s);
    scrollToTop();
  };

  const handleNext = () => {
    if (step === 0) {
      handleAnalyze();
      return;
    }
    if (step === 5) {
      // save on leaving opening scene step, then advance to plot/scene step
      handleSaveProgress();
      goToStep(6);
      return;
    }
    if (step < TOTAL_STEPS - 1) {
      goToStep(step + 1);
    } else {
      router.back();
    }
  };

  const handleBack = () => {
    if (step === 0) {
      router.back();
    } else {
      goToStep(step - 1);
    }
  };

  const handleSaveProgress = () => {
    if (!book) return;
    const finalCoreTheme = coreTheme || customCoreTheme;
    const finalMainMessage = mainMessage || customMainMessage;
    const finalOpening = openingTheme || customOpeningTheme;
    updateBook(book.id, {
      description: description.trim() || book.description,
      screenplayFormat: format,
      screenplayRuntime: runtime,
      screenplayThemes: selectedThemes,
      screenplayCoreTheme: finalCoreTheme,
      screenplayMainMessage: finalMainMessage,
      screenplayOpeningTheme: finalOpening,
    });
  };

  const handleFinish = () => {
    handleSaveProgress();
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    router.back();
  };

  const toggleTheme = (t: string) => {
    Haptics.selectionAsync();
    setSelectedThemes(prev =>
      prev.includes(t) ? prev.filter(x => x !== t) : [...prev, t]
    );
  };

  const addCustomTheme = () => {
    const val = customThemeInput.trim();
    if (!val || selectedThemes.includes(val)) return;
    setSelectedThemes(prev => [...prev, val]);
    setCustomThemeInput('');
    Haptics.selectionAsync();
  };

  const canNext = () => {
    if (step === 0) return wordCount(description) >= MIN_WORDS;
    if (step === 6) return false; // step 6 has no Next, only Done
    return true;
  };

  const nextLabel = () => {
    if (step === 0) return analyzing ? 'Analysing…' : 'Analyse with AI';
    if (step === 5) return 'Continue to Plot';
    if (step === 6) return 'Done';
    return 'Next';
  };

  const isAnyLoading = analyzing || generatingPlots || generatingScene;

  const allThemes = [
    ...(analysis?.themes ?? []),
    ...selectedThemes.filter(t => !(analysis?.themes ?? []).includes(t)),
  ];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* ── Header ───────────────────────────────────────────────────────── */}
      <View style={[styles.header, { borderBottomColor: colors.border, paddingTop: insets.top + 8 }]}>
        <TouchableOpacity onPress={handleBack} style={styles.backBtn} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Feather name="chevron-left" size={22} color={colors.primary} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={[styles.headerTitle, { color: colors.foreground }]}>{STEP_TITLES[step]}</Text>
          <Text style={[styles.headerStep, { color: colors.mutedForeground }]}>Step {step + 1} of {TOTAL_STEPS}</Text>
        </View>
        <View style={{ width: 36 }} />
      </View>

      {/* ── Progress bar ─────────────────────────────────────────────────── */}
      <View style={[styles.progressTrack, { backgroundColor: colors.border }]}>
        <View
          style={[styles.progressFill, { backgroundColor: colors.primary, width: `${((step + 1) / TOTAL_STEPS) * 100}%` }]}
        />
      </View>

      {/* ── Body ─────────────────────────────────────────────────────────── */}
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={0}>
        <ScrollView ref={scrollRef} style={styles.body} contentContainerStyle={styles.bodyContent} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>

          <Text style={[styles.stepSubtitle, { color: colors.mutedForeground }]}>{STEP_SUBTITLES[step]}</Text>

          {/* ── Step 0: Concept & Upload ───────────────────────────────── */}
          {step === 0 && (
            <View style={styles.stepContent}>
              <TextInput
                style={[styles.conceptInput, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.card }]}
                value={description}
                onChangeText={setDescription}
                placeholder="e.g. A disgraced detective returns to his home town to investigate a cold case, only to discover his own family is involved. Set against the backdrop of a dying mining community in rural Wales…"
                placeholderTextColor={colors.mutedForeground}
                multiline
                textAlignVertical="top"
                autoFocus
              />
              <TouchableOpacity
                style={[styles.uploadBtn, { borderColor: colors.primary + '55', backgroundColor: colors.primary + '0D' }]}
                onPress={handlePickFile}
                activeOpacity={0.8}
                disabled={fileLoading}
              >
                {fileLoading
                  ? <ActivityIndicator size="small" color={colors.primary} />
                  : <Feather name="upload" size={15} color={colors.primary} />
                }
                <Text style={[styles.uploadBtnText, { color: colors.primary }]}>
                  {fileLoading ? 'Reading file…' : 'Upload synopsis (.txt / .md)'}
                </Text>
              </TouchableOpacity>
              {(() => {
                const wc = wordCount(description);
                const met = wc >= MIN_WORDS;
                if (wc === 0) return null;
                return (
                  <View style={styles.wordCountRow}>
                    <View style={[styles.wordCountBar, { backgroundColor: colors.border }]}>
                      <View style={[
                        styles.wordCountFill,
                        { width: `${Math.min((wc / MIN_WORDS) * 100, 100)}%`, backgroundColor: met ? colors.primary : '#C4913A' }
                      ]} />
                    </View>
                    <Text style={[styles.charCount, { color: met ? colors.primary : '#C4913A', fontFamily: 'Inter_600SemiBold' }]}>
                      {wc} / {MIN_WORDS} words{met ? ' ✓' : ' min'}
                    </Text>
                  </View>
                );
              })()}
            </View>
          )}

          {/* ── Step 1: Format & Length ────────────────────────────────── */}
          {step === 1 && (
            <View style={styles.stepContent}>
              <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>FORMAT</Text>
              {FORMAT_OPTIONS.map(opt => (
                <TouchableOpacity
                  key={opt.value}
                  onPress={() => { Haptics.selectionAsync(); setFormat(opt.value); setRuntime(''); }}
                  activeOpacity={0.8}
                  style={[
                    styles.formatCard,
                    {
                      borderColor: format === opt.value ? colors.primary : colors.border,
                      backgroundColor: format === opt.value ? colors.primary + '10' : colors.card,
                    },
                  ]}
                >
                  <View style={styles.formatCardLeft}>
                    <Text style={[styles.formatCardLabel, { color: format === opt.value ? colors.primary : colors.foreground }]}>
                      {opt.label}
                    </Text>
                    <Text style={[styles.formatCardSub, { color: colors.mutedForeground }]}>{opt.sub}</Text>
                  </View>
                  {format === opt.value && <Feather name="check-circle" size={18} color={colors.primary} />}
                </TouchableOpacity>
              ))}

              <Text style={[styles.sectionLabel, { color: colors.mutedForeground, marginTop: 20 }]}>
                {format === 'play' ? 'RUNNING TIME / ACTS' : 'RUNNING TIME'}
              </Text>
              <View style={styles.runtimeChips}>
                {RUNTIME_PRESETS[format].map(r => (
                  <TouchableOpacity
                    key={r}
                    onPress={() => { Haptics.selectionAsync(); setRuntime(r); }}
                    style={[
                      styles.runtimeChip,
                      {
                        borderColor: runtime === r ? colors.primary : colors.border,
                        backgroundColor: runtime === r ? colors.primary + '15' : colors.card,
                      },
                    ]}
                    activeOpacity={0.8}
                  >
                    <Text style={[styles.runtimeChipText, { color: runtime === r ? colors.primary : colors.foreground }]}>{r}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              <TextInput
                style={[styles.runtimeInput, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.card }]}
                value={runtime}
                onChangeText={setRuntime}
                placeholder="Or enter your own estimate…"
                placeholderTextColor={colors.mutedForeground}
                returnKeyType="done"
              />
            </View>
          )}

          {/* ── Step 2: Ideas & Themes ─────────────────────────────────── */}
          {step === 2 && (
            <View style={styles.stepContent}>
              <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>TAP TO SELECT</Text>
              <View style={styles.themeChipGrid}>
                {allThemes.map(t => {
                  const selected = selectedThemes.includes(t);
                  return (
                    <TouchableOpacity
                      key={t}
                      onPress={() => toggleTheme(t)}
                      activeOpacity={0.8}
                      style={[
                        styles.themeChip,
                        {
                          borderColor: selected ? colors.primary : colors.border,
                          backgroundColor: selected ? colors.primary + '15' : colors.card,
                        },
                      ]}
                    >
                      {selected && <Feather name="check" size={12} color={colors.primary} style={{ marginRight: 4 }} />}
                      <Text style={[styles.themeChipText, { color: selected ? colors.primary : colors.foreground }]}>{t}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <Text style={[styles.sectionLabel, { color: colors.mutedForeground, marginTop: 20 }]}>ADD YOUR OWN</Text>
              <View style={styles.customThemeRow}>
                <TextInput
                  style={[styles.customThemeInput, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.card }]}
                  value={customThemeInput}
                  onChangeText={setCustomThemeInput}
                  placeholder="e.g. existential dread"
                  placeholderTextColor={colors.mutedForeground}
                  returnKeyType="done"
                  onSubmitEditing={addCustomTheme}
                />
                <TouchableOpacity
                  onPress={addCustomTheme}
                  style={[styles.addThemeBtn, { backgroundColor: colors.primary }]}
                  activeOpacity={0.85}
                  disabled={!customThemeInput.trim()}
                >
                  <Feather name="plus" size={16} color="#fff" />
                </TouchableOpacity>
              </View>
              {selectedThemes.length > 0 && (
                <Text style={[styles.selectionSummary, { color: colors.mutedForeground }]}>
                  {selectedThemes.length} theme{selectedThemes.length !== 1 ? 's' : ''} selected
                </Text>
              )}
            </View>
          )}

          {/* ── Step 3: Core Theme ─────────────────────────────────────── */}
          {step === 3 && (
            <View style={styles.stepContent}>
              <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>AI SUGGESTIONS</Text>
              {(analysis?.coreThemes ?? []).map((ct, i) => (
                <TouchableOpacity
                  key={i}
                  onPress={() => { Haptics.selectionAsync(); setCoreTheme(ct); setCustomCoreTheme(''); }}
                  activeOpacity={0.8}
                  style={[
                    styles.optionCard,
                    {
                      borderColor: coreTheme === ct ? colors.primary : colors.border,
                      backgroundColor: coreTheme === ct ? colors.primary + '10' : colors.card,
                    },
                  ]}
                >
                  <View style={[styles.optionRadio, {
                    borderColor: coreTheme === ct ? colors.primary : colors.mutedForeground,
                    backgroundColor: coreTheme === ct ? colors.primary : 'transparent',
                  }]} />
                  <Text style={[styles.optionCardText, { color: coreTheme === ct ? colors.primary : colors.foreground }]}>{ct}</Text>
                </TouchableOpacity>
              ))}
              <Text style={[styles.sectionLabel, { color: colors.mutedForeground, marginTop: 20 }]}>WRITE YOUR OWN</Text>
              <TextInput
                style={[styles.customTextarea, { color: colors.foreground, borderColor: customCoreTheme ? colors.primary : colors.border, backgroundColor: colors.card }]}
                value={customCoreTheme}
                onChangeText={(v) => { setCustomCoreTheme(v); if (v) setCoreTheme(''); }}
                placeholder="e.g. The search for belonging destroys the very connections we seek…"
                placeholderTextColor={colors.mutedForeground}
                multiline
                textAlignVertical="top"
              />
            </View>
          )}

          {/* ── Step 4: Main Message ───────────────────────────────────── */}
          {step === 4 && (
            <View style={styles.stepContent}>
              <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>AI SUGGESTIONS</Text>
              {(analysis?.mainMessages ?? []).map((mm, i) => (
                <TouchableOpacity
                  key={i}
                  onPress={() => { Haptics.selectionAsync(); setMainMessage(mm); setCustomMainMessage(''); }}
                  activeOpacity={0.8}
                  style={[
                    styles.optionCard,
                    {
                      borderColor: mainMessage === mm ? colors.primary : colors.border,
                      backgroundColor: mainMessage === mm ? colors.primary + '10' : colors.card,
                    },
                  ]}
                >
                  <View style={[styles.optionRadio, {
                    borderColor: mainMessage === mm ? colors.primary : colors.mutedForeground,
                    backgroundColor: mainMessage === mm ? colors.primary : 'transparent',
                  }]} />
                  <Text style={[styles.optionCardText, { color: mainMessage === mm ? colors.primary : colors.foreground }]}>{mm}</Text>
                </TouchableOpacity>
              ))}
              <Text style={[styles.sectionLabel, { color: colors.mutedForeground, marginTop: 20 }]}>WRITE YOUR OWN</Text>
              <TextInput
                style={[styles.customTextarea, { color: colors.foreground, borderColor: customMainMessage ? colors.primary : colors.border, backgroundColor: colors.card }]}
                value={customMainMessage}
                onChangeText={(v) => { setCustomMainMessage(v); if (v) setMainMessage(''); }}
                placeholder="e.g. Love without honesty is just control by another name…"
                placeholderTextColor={colors.mutedForeground}
                multiline
                textAlignVertical="top"
              />
            </View>
          )}

          {/* ── Step 5: Opening Scene ──────────────────────────────────── */}
          {step === 5 && (
            <View style={styles.stepContent}>
              <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>CHOOSE AN OPENING</Text>
              {(analysis?.openingConcepts ?? []).map((oc, i) => (
                <TouchableOpacity
                  key={i}
                  onPress={() => { Haptics.selectionAsync(); setOpeningTheme(oc.title); setCustomOpeningTheme(''); }}
                  activeOpacity={0.8}
                  style={[
                    styles.openingCard,
                    {
                      borderColor: openingTheme === oc.title ? colors.primary : colors.border,
                      backgroundColor: openingTheme === oc.title ? colors.primary + '0E' : colors.card,
                    },
                  ]}
                >
                  <View style={styles.openingCardTop}>
                    <View style={[styles.openingIdx, { backgroundColor: openingTheme === oc.title ? colors.primary : colors.border }]}>
                      <Text style={[styles.openingIdxText, { color: openingTheme === oc.title ? '#fff' : colors.mutedForeground }]}>{i + 1}</Text>
                    </View>
                    <Text style={[styles.openingCardTitle, { color: openingTheme === oc.title ? colors.primary : colors.foreground }]}>{oc.title}</Text>
                    {openingTheme === oc.title && <Feather name="check-circle" size={16} color={colors.primary} />}
                  </View>
                  {oc.description ? (
                    <Text style={[styles.openingCardDesc, { color: colors.mutedForeground }]}>{oc.description}</Text>
                  ) : null}
                </TouchableOpacity>
              ))}
              <Text style={[styles.sectionLabel, { color: colors.mutedForeground, marginTop: 20 }]}>WRITE YOUR OWN OPENING</Text>
              <TextInput
                style={[styles.customTextarea, { color: colors.foreground, borderColor: customOpeningTheme ? colors.primary : colors.border, backgroundColor: colors.card, minHeight: 100 }]}
                value={customOpeningTheme}
                onChangeText={(v) => { setCustomOpeningTheme(v); if (v) setOpeningTheme(''); }}
                placeholder="e.g. Open on a close-up of weathered hands turning over a faded photograph. Pull back to reveal…"
                placeholderTextColor={colors.mutedForeground}
                multiline
                textAlignVertical="top"
              />
            </View>
          )}

          {/* ── Step 6: Plot & Scene ───────────────────────────────────── */}
          {step === 6 && (
            <View style={styles.stepContent}>

              {/* Generate plot beats CTA */}
              {!plotResult ? (
                <TouchableOpacity
                  style={[styles.genBtn, { borderColor: colors.primary + '55', backgroundColor: colors.primary + '0D' }]}
                  onPress={handleGeneratePlots}
                  disabled={generatingPlots}
                  activeOpacity={0.8}
                >
                  <Feather name="list" size={18} color={colors.primary} />
                  <Text style={[styles.genBtnText, { color: colors.primary }]}>Suggest Plot Beats</Text>
                  <Feather name="zap" size={14} color={colors.primary + '99'} />
                </TouchableOpacity>
              ) : (
                <View style={styles.plotResult}>
                  <View style={styles.plotResultHeader}>
                    <Text style={[styles.plotResultTitle, { color: colors.foreground }]}>Three-Act Structure</Text>
                    <TouchableOpacity onPress={handleGeneratePlots} disabled={generatingPlots} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                      <Feather name="refresh-cw" size={14} color={colors.mutedForeground} />
                    </TouchableOpacity>
                  </View>
                  {plotResult.acts.map((act, ai) => (
                    <View key={ai} style={[styles.actBlock, { borderColor: colors.border }]}>
                      <Text style={[styles.actName, { color: colors.primary, backgroundColor: colors.primary + '12' }]}>{act.name}</Text>
                      {act.beats.map((beat, bi) => (
                        <View key={bi} style={[styles.beatRow, { borderTopColor: bi === 0 ? 'transparent' : colors.border }]}>
                          <View style={[styles.beatDot, { backgroundColor: colors.primary + '60' }]} />
                          <View style={{ flex: 1 }}>
                            <Text style={[styles.beatName, { color: colors.foreground }]}>{beat.beat}</Text>
                            <Text style={[styles.beatDesc, { color: colors.mutedForeground }]}>{beat.description}</Text>
                          </View>
                        </View>
                      ))}
                    </View>
                  ))}
                </View>
              )}

              {/* Divider */}
              <View style={[styles.divider, { backgroundColor: colors.border }]} />

              {/* Generate opening scene */}
              {!generatedScene ? (
                <TouchableOpacity
                  style={[styles.genBtn, { borderColor: colors.secondary + '66', backgroundColor: colors.secondary + '0D' }]}
                  onPress={handleGenerateScene}
                  disabled={generatingScene}
                  activeOpacity={0.8}
                >
                  <Feather name="film" size={18} color={colors.foreground} />
                  <Text style={[styles.genBtnText, { color: colors.foreground }]}>Generate Opening Scene</Text>
                  <Feather name="zap" size={14} color={colors.mutedForeground} />
                </TouchableOpacity>
              ) : (
                <View style={[styles.sceneResult, { borderColor: colors.border, backgroundColor: colors.card }]}>
                  <View style={styles.sceneResultHeader}>
                    <Feather name="film" size={14} color={colors.primary} />
                    <Text style={[styles.sceneResultLabel, { color: colors.primary }]}>Opening Scene</Text>
                    <TouchableOpacity onPress={handleGenerateScene} disabled={generatingScene} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }} style={{ marginLeft: 'auto' }}>
                      <Feather name="refresh-cw" size={13} color={colors.mutedForeground} />
                    </TouchableOpacity>
                  </View>
                  <Text style={[styles.sceneText, { color: colors.foreground }]}>{generatedScene}</Text>
                </View>
              )}

            </View>
          )}

          <View style={{ height: 24 }} />
        </ScrollView>

        {/* ── Footer ───────────────────────────────────────────────────── */}
        <View style={[styles.footer, { borderTopColor: colors.border, paddingBottom: insets.bottom + 12 }]}>
          {step > 0 && (
            <TouchableOpacity
              onPress={handleBack}
              style={[styles.backFooterBtn, { borderColor: colors.border }]}
              activeOpacity={0.8}
            >
              <Feather name="chevron-left" size={16} color={colors.foreground} />
              <Text style={[styles.backFooterText, { color: colors.foreground }]}>Back</Text>
            </TouchableOpacity>
          )}
          {step === 6 ? (
            <TouchableOpacity
              onPress={handleFinish}
              style={[styles.nextBtn, { backgroundColor: colors.primary }]}
              activeOpacity={0.85}
            >
              <Text style={styles.nextBtnText}>Done</Text>
              <Feather name="check" size={15} color="#fff" style={{ marginLeft: 4 }} />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              onPress={handleNext}
              disabled={!canNext() || isAnyLoading}
              style={[
                styles.nextBtn,
                { backgroundColor: canNext() && !isAnyLoading ? colors.primary : colors.border, flex: step === 0 ? 1 : undefined },
              ]}
              activeOpacity={0.85}
            >
              <Text style={styles.nextBtnText}>{nextLabel()}</Text>
              {step === 0 && <Feather name="zap" size={15} color="#fff" style={{ marginLeft: 4 }} />}
              {step > 0 && step < 5 && <Feather name="chevron-right" size={15} color="#fff" style={{ marginLeft: 4 }} />}
              {step === 5 && <Feather name="arrow-right" size={15} color="#fff" style={{ marginLeft: 4 }} />}
            </TouchableOpacity>
          )}
        </View>
      </KeyboardAvoidingView>

      {/* ── Cinematic loader overlay ──────────────────────────────────── */}
      <ScreenplayLoader
        visible={activeLoader === 'analysis'}
        messages={ANALYSIS_MESSAGES}
        title="ANALYSING YOUR CONCEPT"
      />
      <ScreenplayLoader
        visible={activeLoader === 'plots'}
        messages={PLOT_MESSAGES}
        title="MAPPING STORY STRUCTURE"
      />
      <ScreenplayLoader
        visible={activeLoader === 'scene'}
        messages={SCENE_MESSAGES}
        title="WRITING YOUR SCENE"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    gap: 8,
  },
  backBtn: { width: 36, alignItems: 'flex-start' },
  headerCenter: { flex: 1, alignItems: 'center' },
  headerTitle: { fontSize: 17, fontFamily: 'Inter_700Bold' },
  headerStep: { fontSize: 12, fontFamily: 'Inter_400Regular', marginTop: 1 },
  progressTrack: { height: 3 },
  progressFill: { height: 3, borderRadius: 2 },
  body: { flex: 1 },
  bodyContent: { padding: 20, gap: 0 },
  stepSubtitle: { fontSize: 14, fontFamily: 'Inter_400Regular', lineHeight: 20, marginBottom: 20 },
  stepContent: { gap: 10 },
  conceptInput: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
    fontFamily: 'Inter_400Regular',
    minHeight: 160,
    lineHeight: 22,
  },
  uploadBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
  },
  uploadBtnText: { fontSize: 14, fontFamily: 'Inter_500Medium' },
  charCount: { fontSize: 12, fontFamily: 'Inter_400Regular', textAlign: 'right' },
  wordCountRow: { gap: 6 },
  wordCountBar: { height: 3, borderRadius: 2, overflow: 'hidden' },
  wordCountFill: { height: 3, borderRadius: 2 },
  sectionLabel: { fontSize: 11, fontFamily: 'Inter_600SemiBold', letterSpacing: 0.8, marginBottom: 4 },
  formatCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderRadius: 12,
    padding: 14,
    gap: 12,
  },
  formatCardLeft: { flex: 1 },
  formatCardLabel: { fontSize: 15, fontFamily: 'Inter_600SemiBold' },
  formatCardSub: { fontSize: 12, fontFamily: 'Inter_400Regular', marginTop: 2 },
  runtimeChips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 4 },
  runtimeChip: {
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 7,
  },
  runtimeChipText: { fontSize: 13, fontFamily: 'Inter_500Medium' },
  runtimeInput: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
  },
  themeChipGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  themeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  themeChipText: { fontSize: 13, fontFamily: 'Inter_500Medium' },
  customThemeRow: { flexDirection: 'row', gap: 8 },
  customThemeInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
  },
  addThemeBtn: {
    width: 42,
    height: 42,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectionSummary: { fontSize: 12, fontFamily: 'Inter_400Regular', textAlign: 'right' },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    borderWidth: 1.5,
    borderRadius: 12,
    padding: 14,
  },
  optionRadio: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    marginTop: 1,
  },
  optionCardText: { flex: 1, fontSize: 14, fontFamily: 'Inter_400Regular', lineHeight: 20 },
  customTextarea: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    minHeight: 80,
    lineHeight: 21,
  },
  openingCard: {
    borderWidth: 1.5,
    borderRadius: 12,
    padding: 14,
    gap: 8,
  },
  openingCardTop: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  openingIdx: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  openingIdxText: { fontSize: 12, fontFamily: 'Inter_700Bold' },
  openingCardTitle: { flex: 1, fontSize: 15, fontFamily: 'Inter_600SemiBold' },
  openingCardDesc: { fontSize: 13, fontFamily: 'Inter_400Regular', lineHeight: 19, marginLeft: 36 },
  footer: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 20,
    paddingTop: 12,
    borderTopWidth: 1,
  },
  backFooterBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
  },
  backFooterText: { fontSize: 14, fontFamily: 'Inter_500Medium' },
  nextBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 4,
  },
  nextBtnText: { fontSize: 15, fontFamily: 'Inter_700Bold', color: '#fff' },

  // ── Step 6: Plot & Scene ─────────────────────────────────────────────
  genBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderWidth: 1.5,
    borderRadius: 14,
    borderStyle: 'dashed',
  },
  genBtnText: { fontSize: 15, fontFamily: 'Inter_600SemiBold', flex: 1, textAlign: 'center' },
  divider: { height: 1, marginVertical: 12 },
  plotResult: { gap: 10 },
  plotResultHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  plotResultTitle: { fontSize: 15, fontFamily: 'Inter_700Bold' },
  actBlock: {
    borderWidth: 1,
    borderRadius: 12,
    overflow: 'hidden',
  },
  actName: {
    fontSize: 11,
    fontFamily: 'Inter_700Bold',
    letterSpacing: 0.8,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  beatRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderTopWidth: 1,
  },
  beatDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginTop: 5,
    flexShrink: 0,
  },
  beatName: { fontSize: 13, fontFamily: 'Inter_600SemiBold', marginBottom: 2 },
  beatDesc: { fontSize: 12, fontFamily: 'Inter_400Regular', lineHeight: 17 },
  sceneResult: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    gap: 10,
  },
  sceneResultHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  sceneResultLabel: { fontSize: 12, fontFamily: 'Inter_700Bold', letterSpacing: 0.5 },
  sceneText: {
    fontSize: 13,
    fontFamily: 'SpaceMono_400Regular',
    lineHeight: 20,
  },
});
