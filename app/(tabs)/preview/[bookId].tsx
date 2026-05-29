import { Feather } from '@expo/vector-icons';
import { useAuth } from '@clerk/expo';
import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';
import { type Href, useLocalSearchParams, useNavigation, router } from 'expo-router';
import React, { useLayoutEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  Platform,
  ScrollView,
  Share,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { API_BASE } from '@/constants/api';
import { useBooks } from '@/context/BookContext';
import { useLanguage } from '@/context/LanguageContext';
import { useColors } from '@/hooks/useColors';
import { useSubscription } from '@/lib/revenuecat';
import { detectRunOns, detectDialoguePunctuation, type RunOnIssue, type DialoguePuncIssue } from '@/utils/proofing';
import { DEFAULT_FONT_ID, DEFAULT_HEADING_FONT_ID, EXPORT_FONTS, getFontById, getFontStyleProps } from '@/constants/fonts';
import { type TextAlignment, type PageNumberStyle, type FormatSettings } from '@/types';

export default function BookPreviewScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { width: screenWidth } = useWindowDimensions();
  const isTablet = screenWidth >= 768;
  const navigation = useNavigation();
  const { signOut } = useAuth();
  const { bookId } = useLocalSearchParams<{ bookId: string }>();
  const { getBook, updateBook, updateSection } = useBooks();
  const { isSubscribed, hasSeoKeywords, seoPackage, purchase, isPurchasing } = useSubscription();
  const { language } = useLanguage();

  const book = getBook(bookId ?? '');

  const [optionsVisible, setOptionsVisible] = useState(false);
  const [fontPickerVisible, setFontPickerVisible] = useState(false);
  type FrontMatterEditType = 'prologue' | 'epilogue' | 'copyright' | 'dedication' | 'epigraph' | 'foreword' | 'preface' | 'acknowledgements';
  const [editingFront, setEditingFront] = useState<FrontMatterEditType | null>(null);
  const [editText, setEditText] = useState('');
  const [aiGenerating, setAiGenerating] = useState(false);
  const [descModalVisible, setDescModalVisible] = useState(false);
  const [descGenerating, setDescGenerating] = useState(false);
  const [descCopied, setDescCopied] = useState(false);
  const [seoModalVisible, setSeoModalVisible] = useState(false);
  const [seoGenerating, setSeoGenerating] = useState(false);
  const [seoAllCopied, setSeoAllCopied] = useState(false);
  const [seoChipCopied, setSeoChipCopied] = useState<string | null>(null);
  const [formatModalVisible, setFormatModalVisible] = useState(false);
  const [seoTooltip, setSeoTooltip] = useState<{ term: string; reason: string } | null>(null);
  const seoLongPressRef = React.useRef(false);

  // ── Proofreading checks ───────────────────────────────────────────────────
  type ProofingCheckType = 'runon' | 'dialogue';
  const [proofingModal, setProofingModal] = useState<ProofingCheckType | null>(null);
  const [runOnRepairs, setRunOnRepairs] = useState<Record<number, { loading: boolean; suggestion: string | null; applied: boolean }>>({});

  const requestRepair = async (issue: RunOnIssue, idx: number) => {
    setRunOnRepairs(prev => ({ ...prev, [idx]: { loading: true, suggestion: null, applied: false } }));
    try {
      const res = await fetch(`${API_BASE}/ai/repair-run-on`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sentence: issue.fullSentence,
          bookTitle: book?.title,
          genre: book?.genre,
        }),
      });
      if (res.ok) {
        const data = await res.json() as { repair?: string };
        setRunOnRepairs(prev => ({ ...prev, [idx]: { loading: false, suggestion: data.repair ?? null, applied: false } }));
      } else {
        setRunOnRepairs(prev => ({ ...prev, [idx]: { loading: false, suggestion: null, applied: false } }));
      }
    } catch {
      setRunOnRepairs(prev => ({ ...prev, [idx]: { loading: false, suggestion: null, applied: false } }));
    }
  };

  const applyRepair = (issue: RunOnIssue, idx: number, repair: string) => {
    const chapter = book?.chapters.find(c => c.id === issue.chapterId);
    if (!chapter) return;
    const targetSection = chapter.sections.find(s => s.content.includes(issue.fullSentence));
    if (!targetSection) return;
    const newContent = targetSection.content.replace(issue.fullSentence, repair);
    updateSection(bookId ?? '', chapter.id, targetSection.id, newContent);
    setRunOnRepairs(prev => ({ ...prev, [idx]: { ...prev[idx]!, applied: true } }));
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  // Flatten chapter sections into plain text for proofing checks
  const chapterContents = useMemo(
    () =>
      (book?.chapters ?? []).map((c) => ({
        id: c.id,
        title: c.title,
        content: c.sections.map((s) => s.content).join('\n\n'),
      })),
    [book?.chapters]
  );

  const runOnResult = useMemo(() => detectRunOns(chapterContents), [chapterContents]);
  const dialogueResult = useMemo(() => detectDialoguePunctuation(chapterContents), [chapterContents]);

  const includeTOC = book?.includeTOC ?? false;
  const includePrologue = book?.includePrologue ?? false;
  const includeEpilogue = book?.includeEpilogue ?? false;
  const includeCopyright = book?.includeCopyright ?? false;
  const includeDedication = book?.includeDedication ?? false;
  const includeEpigraph = book?.includeEpigraph ?? false;
  const includeForeword = book?.includeForeword ?? false;
  const includePreface = book?.includePreface ?? false;
  const includeAcknowledgements = book?.includeAcknowledgements ?? false;

  const fmt: FormatSettings = book?.formatSettings ?? {
    titleAlignment: 'center',
    chapterTitleAlignment: 'left',
    pageNumbers: 'none',
  };
  const fontId = book?.previewFontId ?? DEFAULT_FONT_ID;
  const font = getFontById(fontId);
  const headingFontId = book?.headingFontId ?? DEFAULT_HEADING_FONT_ID;
  const headingFont = getFontById(headingFontId);
  const dialogueFont = getFontById(book?.dialogueFontId);
  const dialogueStyleProps = getFontStyleProps(dialogueFont, book?.dialogueFontBold, book?.dialogueFontItalic);
  const headingStyleProps = getFontStyleProps(headingFont, book?.headingFontBold, book?.headingFontItalic);

  const [headingFontPickerVisible, setHeadingFontPickerVisible] = useState(false);

  const allChaptersComplete =
    !!book && book.chapters.length > 0 && book.chapters.every((c) => c.isComplete);

  const fullText = useMemo(() => {
    if (!book) return '';
    let out = `${book.title}\n`;
    if (book.genre) out += `Genre: ${book.genre}\n`;
    if (book.description) out += `\n${book.description}\n`;
    out += '\n';
    if (includeCopyright && book.copyright?.trim()) {
      out += `\n${'─'.repeat(40)}\n\n${book.copyright.trim()}\n\n`;
    }
    if (includeDedication && book.dedication?.trim()) {
      out += `\n${'─'.repeat(40)}\n\n${book.dedication.trim()}\n\n`;
    }
    if (includeEpigraph && book.epigraph?.trim()) {
      out += `\n${'─'.repeat(40)}\n\n${book.epigraph.trim()}\n\n`;
    }
    if (includeTOC) {
      out += `\nTABLE OF CONTENTS\n${'─'.repeat(20)}\n`;
      if (includePrologue && book.prologue?.trim()) out += `Prologue\n`;
      for (const c of book.chapters) out += `Chapter ${c.number}: ${c.title}\n`;
      if (includeEpilogue && book.epilogue?.trim()) out += `Epilogue\n`;
      out += '\n';
    }
    if (includeForeword && book.foreword?.trim()) {
      out += `\n${'─'.repeat(40)}\nFOREWORD\n${'─'.repeat(40)}\n\n${book.foreword.trim()}\n\n`;
    }
    if (includePreface && book.preface?.trim()) {
      out += `\n${'─'.repeat(40)}\nPREFACE\n${'─'.repeat(40)}\n\n${book.preface.trim()}\n\n`;
    }
    if (includeAcknowledgements && book.acknowledgements?.trim()) {
      out += `\n${'─'.repeat(40)}\nACKNOWLEDGEMENTS\n${'─'.repeat(40)}\n\n${book.acknowledgements.trim()}\n\n`;
    }
    if (includePrologue && book.prologue?.trim()) {
      out += `\n${'─'.repeat(40)}\nPROLOGUE\n${'─'.repeat(40)}\n\n${book.prologue.trim()}\n\n`;
    }
    for (const chapter of book.chapters) {
      out += `\n${'─'.repeat(40)}\n`;
      out += `Chapter ${chapter.number}: ${chapter.title}\n`;
      out += `${'─'.repeat(40)}\n\n`;
      for (const section of chapter.sections) {
        if (section.content.trim()) {
          if (section.prompt.trim()) {
            out += `— ${section.prompt.trim()} —\n\n`;
          }
          out += `${section.content.trim()}\n\n`;
        }
      }
    }
    if (includeEpilogue && book.epilogue?.trim()) {
      out += `\n${'─'.repeat(40)}\nEPILOGUE\n${'─'.repeat(40)}\n\n${book.epilogue.trim()}\n\n`;
    }
    return out.trim();
  }, [book, includeTOC, includePrologue, includeEpilogue, includeCopyright, includeDedication, includeEpigraph, includeForeword, includePreface, includeAcknowledgements]);

  const wordCount = useMemo(() => {
    return fullText.split(/\s+/).filter(Boolean).length;
  }, [fullText]);

  const handleCopy = async () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    await Share.share({ message: fullText, title: book?.title });
  };

  useLayoutEffect(() => {
    navigation.setOptions({
      title: book?.title ?? 'Preview',
      headerRight: () => (
        <View style={styles.headerRight}>
          <TouchableOpacity
            onPress={() => { Haptics.selectionAsync(); signOut(); }}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Feather name="log-out" size={18} color={colors.mutedForeground} />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={handleCopy}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            style={{ marginRight: Platform.OS === 'web' ? 8 : 0 }}
          >
            <Feather name="copy" size={18} color={colors.primary} />
          </TouchableOpacity>
        </View>
      ),
    });
  }, [navigation, book?.title, colors, fullText, signOut]);

  if (!book) {
    return (
      <View style={[styles.notFound, { backgroundColor: colors.background }]}>
        <Text style={[styles.notFoundText, { color: colors.mutedForeground }]}>
          Book not found
        </Text>
      </View>
    );
  }

  const bottomPadding = (Platform.OS === 'web' ? 34 : insets.bottom) + 24;

  const filledSections = book.chapters.reduce(
    (sum, c) => sum + c.sections.filter((s) => s.content.trim().length > 0).length,
    0,
  );
  const totalSections = book.chapters.reduce((sum, c) => sum + c.sections.length, 0);

  const openEdit = (which: FrontMatterEditType) => {
    const textMap: Record<FrontMatterEditType, string | undefined> = {
      prologue: book.prologue,
      epilogue: book.epilogue,
      copyright: book.copyright,
      dedication: book.dedication,
      epigraph: book.epigraph,
      foreword: book.foreword,
      preface: book.preface,
      acknowledgements: book.acknowledgements,
    };
    setEditText(textMap[which] ?? '');
    setEditingFront(which);
  };

  const saveEdit = () => {
    if (!editingFront) return;
    const includeKeyMap: Record<FrontMatterEditType, string> = {
      prologue: 'includePrologue',
      epilogue: 'includeEpilogue',
      copyright: 'includeCopyright',
      dedication: 'includeDedication',
      epigraph: 'includeEpigraph',
      foreword: 'includeForeword',
      preface: 'includePreface',
      acknowledgements: 'includeAcknowledgements',
    };
    const extra = editText.trim() ? { [includeKeyMap[editingFront]]: true } : {};
    updateBook(book.id, { [editingFront]: editText, ...extra } as Parameters<typeof updateBook>[1]);
    setEditingFront(null);
  };

  const generateBookDescription = async () => {
    if (!book) return;
    try {
      setDescGenerating(true);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      const response = await fetch(`${API_BASE}/ai/book-description`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookTitle: book.title,
          genre: book.genre,
          bookDescription: book.description,
          characters: book.characters,
          chapterTitles: book.chapters.map((c) => c.title),
          prologue: book.prologue,
          language,
        }),
      });
      if (!response.ok) throw new Error('Server error');
      const data = (await response.json()) as { text: string };
      updateBook(book.id, { amazonDescription: data.text } as Parameters<typeof updateBook>[1]);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {
      Alert.alert('Error', 'Could not generate description. Please try again.');
    } finally {
      setDescGenerating(false);
    }
  };

  const copyDescription = async () => {
    if (!book?.amazonDescription) return;
    await Clipboard.setStringAsync(book.amazonDescription);
    setDescCopied(true);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setTimeout(() => setDescCopied(false), 2000);
  };

  const shareDescription = async () => {
    if (!book?.amazonDescription) return;
    try {
      await Share.share({
        message: `${book.title} — Amazon Description\n\n${book.amazonDescription}`,
        title: `${book.title} — Amazon Description`,
      });
    } catch {
      // dismissed
    }
  };

  const generateSeoKeywords = async () => {
    if (!book) return;
    try {
      setSeoGenerating(true);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      const response = await fetch(`${API_BASE}/ai/seo-keywords`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookTitle: book.title,
          genre: book.genre,
          bookDescription: book.description,
          characters: book.characters,
          chapterTitles: book.chapters.map((c) => c.title),
          language,
        }),
      });
      if (!response.ok) throw new Error('Server error');
      const data = (await response.json()) as { keywords: { term: string; reason: string }[] };
      updateBook(book.id, { seoKeywords: data.keywords });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {
      Alert.alert('Error', 'Could not generate keywords. Please try again.');
    } finally {
      setSeoGenerating(false);
    }
  };

  const copySeoChip = async (term: string) => {
    await Clipboard.setStringAsync(term);
    setSeoChipCopied(term);
    Haptics.selectionAsync();
    setTimeout(() => setSeoChipCopied(null), 1800);
  };

  const copyAllSeoKeywords = async () => {
    if (!book?.seoKeywords?.length) return;
    await Clipboard.setStringAsync(book.seoKeywords.map((k) => k.term).join('\n'));
    setSeoAllCopied(true);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setTimeout(() => setSeoAllCopied(false), 2000);
  };

  const purchaseSeoKeywords = async () => {
    if (!seoPackage) {
      Alert.alert('Unavailable', 'SEO Keywords product not found. Please try again later.');
      return;
    }
    try {
      await purchase(seoPackage);
    } catch {
      Alert.alert('Purchase Failed', 'The purchase could not be completed. Please try again.');
    }
  };

  const generateFrontMatter = async (forType?: FrontMatterEditType) => {
    const type = forType ?? editingFront;
    if (!type || !book) return;
    if (type === 'copyright') {
      openEdit('copyright');
      return;
    }
    if (!isSubscribed) {
      Alert.alert('Pro Feature', 'AI generation is available to BloomScript Pro subscribers.');
      return;
    }
    if (!editingFront) {
      setEditText('');
      setEditingFront(type);
    }
    try {
      setAiGenerating(true);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      const response = await fetch(`${API_BASE}/ai/front-matter`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type,
          bookTitle: book.title,
          genre: book.genre,
          bookDescription: book.description,
          characters: book.characters,
          chapterTitles: book.chapters.map((c) => c.title),
          language,
        }),
      });
      if (!response.ok) throw new Error('Server error');
      const data = (await response.json()) as { text: string };
      setEditText(data.text);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {
      Alert.alert('Error', 'Could not generate content. Please try again.');
    } finally {
      setAiGenerating(false);
    }
  };

  const renderTOC = () => (
    <View style={styles.tocBlock}>
      <Text style={[styles.tocHeading, { color: colors.foreground, fontFamily: headingFont.family }]}>
        Table of Contents
      </Text>
      <View style={[styles.tocDivider, { backgroundColor: colors.accent }]} />
      {includePrologue && book.prologue?.trim() && (
        <View style={styles.tocRow}>
          <Text style={[styles.tocItem, { color: colors.foreground, fontFamily: font.family }]}>
            Prologue
          </Text>
          <View style={[styles.tocDots, { borderColor: colors.border }]} />
          <Text style={[styles.tocItem, { color: colors.mutedForeground, fontFamily: font.family }]}>
            —
          </Text>
        </View>
      )}
      {book.chapters.map((c) => (
        <View key={c.id} style={styles.tocRow}>
          <Text
            style={[styles.tocItem, { color: colors.foreground, fontFamily: font.family }]}
            numberOfLines={1}
          >
            Chapter {c.number}: {c.title}
          </Text>
          <View style={[styles.tocDots, { borderColor: colors.border }]} />
          <Text style={[styles.tocItem, { color: colors.mutedForeground, fontFamily: font.family }]}>
            —
          </Text>
        </View>
      ))}
      {includeEpilogue && book.epilogue?.trim() && (
        <View style={styles.tocRow}>
          <Text style={[styles.tocItem, { color: colors.foreground, fontFamily: font.family }]}>
            Epilogue
          </Text>
          <View style={[styles.tocDots, { borderColor: colors.border }]} />
          <Text style={[styles.tocItem, { color: colors.mutedForeground, fontFamily: font.family }]}>
            —
          </Text>
        </View>
      )}
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Stats bar */}
      <View style={[styles.statsBar, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <View style={styles.statChip}>
          <Feather name="book-open" size={12} color={colors.primary} />
          <Text style={[styles.statText, { color: colors.mutedForeground }]}>
            {book.chapters.length} chapters
          </Text>
        </View>
        <View style={styles.statChip}>
          <Feather name="edit-3" size={12} color={colors.primary} />
          <Text style={[styles.statText, { color: colors.mutedForeground }]}>
            {wordCount.toLocaleString()} words
          </Text>
        </View>
        <View style={styles.statChip}>
          <Feather name="layers" size={12} color={colors.primary} />
          <Text style={[styles.statText, { color: colors.mutedForeground }]}>
            {filledSections}/{totalSections} sections
          </Text>
        </View>
        <TouchableOpacity
          onPress={() => {
            Haptics.selectionAsync();
            setOptionsVisible(true);
          }}
          style={[styles.copyBtn, { backgroundColor: colors.secondary }]}
          activeOpacity={0.8}
        >
          <Feather name="sliders" size={13} color={colors.foreground} />
          <Text style={[styles.copyBtnText, { color: colors.foreground }]}>Options</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={handleCopy}
          style={[styles.copyBtn, { backgroundColor: colors.primary }]}
          activeOpacity={0.8}
        >
          <Feather name="copy" size={13} color={colors.primaryForeground} />
          <Text style={[styles.copyBtnText, { color: colors.primaryForeground }]}>Copy</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => router.push((`/(tabs)/export-book?bookId=${book.id}`) as Href)}
          style={[styles.copyBtn, { backgroundColor: colors.accent }]}
          activeOpacity={0.8}
        >
          <Feather name="download" size={13} color="#fff" />
          <Text style={[styles.copyBtnText, { color: '#fff' }]}>Export</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: bottomPadding, paddingHorizontal: isTablet ? Math.max(24, (screenWidth - 720) / 2) : 24 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Title page */}
        <View style={styles.titlePage}>
          <Text
            style={[styles.bookTitle, { color: colors.foreground, fontFamily: headingFont.family, textAlign: fmt.titleAlignment, fontSize: fmt.titleFontSize ?? 32, lineHeight: (fmt.titleFontSize ?? 32) * 1.25 }]}
          >
            {book.title}
          </Text>
          {book.coverAuthorName?.trim() ? (
            <Text style={[styles.authorText, { color: colors.mutedForeground, fontFamily: font.family, textAlign: fmt.titleAlignment, fontSize: fmt.authorFontSize ?? 16 }]}>
              {book.coverAuthorName.trim()}
            </Text>
          ) : null}
          <View style={[styles.titleDivider, { backgroundColor: colors.accent }]} />
          <Text
            style={[styles.genreText, { color: colors.mutedForeground, fontFamily: font.family }]}
          >
            {book.genre}
          </Text>
          {book.description.length > 0 && (
            <Text
              style={[styles.descText, { color: colors.mutedForeground, fontFamily: font.family, textAlign: fmt.titleAlignment }]}
            >
              {book.description}
            </Text>
          )}
        </View>

        {includeCopyright && (book.copyright?.trim().length ?? 0) > 0 && (
          <View style={styles.frontMatterBlock}>
            <View style={[styles.chapterDivider, { backgroundColor: colors.border }]} />
            <Text style={[styles.chapterLabel, { color: colors.mutedForeground, fontFamily: headingFont.family }]}>Copyright</Text>
            <Text style={[styles.chapterBody, { color: colors.foreground, fontFamily: font.family, fontSize: 13, lineHeight: 21 }]}>{book.copyright!.trim()}</Text>
          </View>
        )}

        {includeDedication && (book.dedication?.trim().length ?? 0) > 0 && (
          <View style={[styles.frontMatterBlock, { alignItems: 'center', paddingVertical: 32 }]}>
            <View style={[styles.chapterDivider, { backgroundColor: colors.border }]} />
            <Text style={[styles.chapterBody, { color: colors.foreground, fontFamily: font.family, fontStyle: 'italic', textAlign: 'center', fontSize: 17, lineHeight: 28 }]}>{book.dedication!.trim()}</Text>
          </View>
        )}

        {includeEpigraph && (book.epigraph?.trim().length ?? 0) > 0 && (
          <View style={[styles.frontMatterBlock, { alignItems: 'center', paddingVertical: 24, paddingHorizontal: 24 }]}>
            <View style={[styles.chapterDivider, { backgroundColor: colors.border }]} />
            <Text style={[styles.chapterBody, { color: colors.mutedForeground, fontFamily: font.family, fontStyle: 'italic', textAlign: 'center', fontSize: 15, lineHeight: 24 }]}>{book.epigraph!.trim()}</Text>
          </View>
        )}

        {includeTOC && book.chapters.length > 0 && renderTOC()}

        {includeForeword && (book.foreword?.trim().length ?? 0) > 0 && (
          <View style={styles.frontMatterBlock}>
            <View style={[styles.chapterDivider, { backgroundColor: colors.border }]} />
            <Text style={[styles.chapterLabel, { color: colors.mutedForeground, fontFamily: headingFont.family }]}>Foreword</Text>
            <Text style={[styles.chapterBody, { color: colors.foreground, fontFamily: font.family }]}>{book.foreword!.trim()}</Text>
          </View>
        )}

        {includePreface && (book.preface?.trim().length ?? 0) > 0 && (
          <View style={styles.frontMatterBlock}>
            <View style={[styles.chapterDivider, { backgroundColor: colors.border }]} />
            <Text style={[styles.chapterLabel, { color: colors.mutedForeground, fontFamily: headingFont.family }]}>Preface</Text>
            <Text style={[styles.chapterBody, { color: colors.foreground, fontFamily: font.family }]}>{book.preface!.trim()}</Text>
          </View>
        )}

        {includeAcknowledgements && (book.acknowledgements?.trim().length ?? 0) > 0 && (
          <View style={styles.frontMatterBlock}>
            <View style={[styles.chapterDivider, { backgroundColor: colors.border }]} />
            <Text style={[styles.chapterLabel, { color: colors.mutedForeground, fontFamily: headingFont.family }]}>Acknowledgements</Text>
            <Text style={[styles.chapterBody, { color: colors.foreground, fontFamily: font.family }]}>{book.acknowledgements!.trim()}</Text>
          </View>
        )}

        {includePrologue && (book.prologue?.trim().length ?? 0) > 0 && (
          <View style={styles.frontMatterBlock}>
            <View style={[styles.chapterDivider, { backgroundColor: colors.border }]} />
            <Text
              style={[styles.chapterLabel, { color: colors.mutedForeground, fontFamily: headingFont.family }]}
            >
              Prologue
            </Text>
            <Text
              style={[styles.chapterBody, { color: colors.foreground, fontFamily: font.family }]}
            >
              {book.prologue!.trim()}
            </Text>
          </View>
        )}

        {book.chapters.length === 0 ? (
          <View style={styles.emptyPreview}>
            <Feather name="file-text" size={40} color={colors.mutedForeground} />
            <Text style={[styles.emptyText, { color: colors.mutedForeground, fontFamily: font.family }]}>
              No chapters written yet
            </Text>
          </View>
        ) : (
          book.chapters.map((chapter) => {
            const writtenSections = chapter.sections.filter((s) => s.content.trim());
            return (
              <View key={chapter.id} style={styles.chapterBlock}>
                <View style={[styles.chapterDivider, { backgroundColor: colors.border }]} />
                <Text
                  style={[styles.chapterLabel, { color: colors.mutedForeground, textAlign: fmt.chapterTitleAlignment }, headingStyleProps]}
                >
                  Chapter {chapter.number}
                </Text>
                <Text
                  style={[styles.chapterTitle, { color: colors.foreground, textAlign: fmt.chapterTitleAlignment, fontSize: fmt.chapterTitleFontSize ?? 22, lineHeight: (fmt.chapterTitleFontSize ?? 22) * 1.27 }, headingStyleProps]}
                >
                  {chapter.title}
                </Text>
                {writtenSections.length > 0 ? (
                  writtenSections.map((s) => (
                    <View key={s.id} style={styles.sectionBlock}>
                      {s.prompt.trim().length > 0 && (
                        <Text
                          style={[styles.sectionPrompt, { color: colors.mutedForeground, fontFamily: font.family }]}
                        >
                          {s.prompt.trim()}
                        </Text>
                      )}
                      <Text
                        style={[styles.chapterBody, { color: colors.foreground }, s.type === 'dialogue' ? dialogueStyleProps : { fontFamily: font.family }]}
                      >
                        {s.content.trim()}
                      </Text>
                    </View>
                  ))
                ) : (
                  <Text
                    style={[styles.emptyChapter, { color: colors.mutedForeground, fontFamily: font.family }]}
                  >
                    No content written yet
                  </Text>
                )}
                {fmt.pageNumbers !== 'none' && (
                  <View style={[
                    styles.pageNumRow,
                    { borderTopColor: colors.border },
                    fmt.pageNumbers === 'bottom-outside'
                      ? { justifyContent: chapter.number % 2 === 0 ? 'flex-start' : 'flex-end' }
                      : { justifyContent: 'center' },
                  ]}>
                    <Text style={[styles.pageNumText, { color: colors.mutedForeground, fontFamily: font.family }]}>
                      {chapter.number}
                    </Text>
                  </View>
                )}
              </View>
            );
          })
        )}

        {includeEpilogue && (book.epilogue?.trim().length ?? 0) > 0 && (
          <View style={styles.frontMatterBlock}>
            <View style={[styles.chapterDivider, { backgroundColor: colors.border }]} />
            <Text
              style={[styles.chapterLabel, { color: colors.mutedForeground, fontFamily: headingFont.family }]}
            >
              Epilogue
            </Text>
            <Text
              style={[styles.chapterBody, { color: colors.foreground, fontFamily: font.family }]}
            >
              {book.epilogue!.trim()}
            </Text>
          </View>
        )}
      </ScrollView>

      {/* ── Proofreading detail modal ── */}
      <Modal
        visible={!!proofingModal}
        transparent
        animationType="slide"
        onRequestClose={() => setProofingModal(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalSheet, { backgroundColor: colors.card, borderColor: colors.border, maxHeight: '90%' }]}>
            <View style={styles.modalHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Feather
                  name={proofingModal === 'runon' ? 'alert-circle' : 'message-square'}
                  size={18}
                  color={colors.warning}
                />
                <Text style={[styles.modalTitle, { color: colors.foreground }]}>
                  {proofingModal === 'runon' ? 'Run-on Sentences' : 'Dialogue Punctuation'}
                </Text>
              </View>
              <TouchableOpacity onPress={() => setProofingModal(null)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                <Feather name="x" size={20} color={colors.mutedForeground} />
              </TouchableOpacity>
            </View>

            {proofingModal === 'runon' ? (
              runOnResult.count === 0 ? (
                <View style={styles.proofAllClear}>
                  <Feather name="check-circle" size={36} color={colors.primary} />
                  <Text style={[styles.proofAllClearText, { color: colors.foreground }]}>All clear!</Text>
                  <Text style={[styles.proofAllClearSub, { color: colors.mutedForeground }]}>
                    No sentences over 40 words found.
                  </Text>
                </View>
              ) : (
                <ScrollView showsVerticalScrollIndicator={false} style={{ flex: 1 }}>
                  <Text style={[styles.proofIntro, { color: colors.mutedForeground }]}>
                    Style guides flag sentences over 40 words as hard to follow. Tap any chapter button to go fix it.
                  </Text>
                  {runOnResult.issues.map((issue: RunOnIssue, i: number) => {
                    const repairState = runOnRepairs[i];
                    return (
                      <View key={i} style={[styles.proofIssueCard, { borderColor: colors.warning + '40', backgroundColor: colors.warning + '08' }]}>
                        <Text style={[styles.proofIssueChapter, { color: colors.warning }]} numberOfLines={1}>
                          {issue.chapterTitle}
                        </Text>
                        <Text style={[styles.proofIssueLine, { color: colors.foreground }]}>
                          "{issue.sentence}"
                        </Text>

                        {repairState?.applied ? (
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 6 }}>
                            <Feather name="check-circle" size={13} color={colors.primary} />
                            <Text style={{ fontSize: 12, fontFamily: 'Inter_500Medium', color: colors.primary }}>Repair applied</Text>
                          </View>
                        ) : repairState?.suggestion ? (
                          <View style={{ marginTop: 8, gap: 6 }}>
                            <Text style={{ fontSize: 11, fontFamily: 'Inter_600SemiBold', color: colors.warning, textTransform: 'uppercase', letterSpacing: 0.5 }}>Suggested repair</Text>
                            <View style={{ padding: 10, borderRadius: 8, backgroundColor: colors.background, borderWidth: 1, borderColor: colors.border }}>
                              <Text style={{ fontSize: 13, fontFamily: 'Inter_400Regular', color: colors.foreground, lineHeight: 19 }}>
                                {repairState.suggestion}
                              </Text>
                            </View>
                            <View style={{ flexDirection: 'row', gap: 8 }}>
                              <TouchableOpacity
                                onPress={() => applyRepair(issue, i, repairState.suggestion!)}
                                style={[styles.proofGoBtn, { flex: 1, borderColor: colors.primary + '60', backgroundColor: colors.primary + '14' }]}
                                activeOpacity={0.8}
                              >
                                <Feather name="check" size={12} color={colors.primary} />
                                <Text style={[styles.proofGoBtnText, { color: colors.primary }]}>Apply fix</Text>
                              </TouchableOpacity>
                              <TouchableOpacity
                                onPress={() => requestRepair(issue, i)}
                                style={[styles.proofGoBtn, { borderColor: colors.warning + '60', backgroundColor: colors.warning + '08' }]}
                                activeOpacity={0.8}
                              >
                                <Feather name="refresh-cw" size={12} color={colors.warning} />
                                <Text style={[styles.proofGoBtnText, { color: colors.warning }]}>Retry</Text>
                              </TouchableOpacity>
                            </View>
                          </View>
                        ) : (
                          <View style={{ flexDirection: 'row', gap: 8, marginTop: 6 }}>
                            <TouchableOpacity
                              onPress={() => requestRepair(issue, i)}
                              disabled={repairState?.loading}
                              style={[styles.proofGoBtn, { flex: 1, borderColor: colors.primary + '60', backgroundColor: colors.primary + '10' }]}
                              activeOpacity={0.8}
                            >
                              {repairState?.loading ? (
                                <ActivityIndicator size="small" color={colors.primary} />
                              ) : (
                                <Feather name="zap" size={12} color={colors.primary} />
                              )}
                              <Text style={[styles.proofGoBtnText, { color: colors.primary }]}>
                                {repairState?.loading ? 'Rewriting…' : 'Suggest repair'}
                              </Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                              onPress={() => {
                                setProofingModal(null);
                                setTimeout(() =>
                                  router.push({ pathname: '/chapter/[chapterId]', params: { chapterId: issue.chapterId, bookId: bookId ?? '' } }),
                                  250
                                );
                              }}
                              style={[styles.proofGoBtn, { borderColor: colors.warning + '60', backgroundColor: colors.warning + '08' }]}
                              activeOpacity={0.8}
                            >
                              <Feather name="edit-3" size={12} color={colors.warning} />
                              <Text style={[styles.proofGoBtnText, { color: colors.warning }]}>Edit</Text>
                            </TouchableOpacity>
                          </View>
                        )}
                      </View>
                    );
                  })}
                </ScrollView>
              )
            ) : (
              dialogueResult.count === 0 ? (
                <View style={styles.proofAllClear}>
                  <Feather name="check-circle" size={36} color={colors.primary} />
                  <Text style={[styles.proofAllClearText, { color: colors.foreground }]}>All clear!</Text>
                  <Text style={[styles.proofAllClearSub, { color: colors.mutedForeground }]}>
                    Dialogue punctuation looks good (Chicago style).
                  </Text>
                </View>
              ) : (
                <ScrollView showsVerticalScrollIndicator={false} style={{ flex: 1 }}>
                  <Text style={[styles.proofIntro, { color: colors.mutedForeground }]}>
                    These passages differ from US publishing standards (Chicago Manual of Style). Tap to fix each one.
                  </Text>
                  {dialogueResult.issues.map((issue: DialoguePuncIssue, i: number) => (
                    <View key={i} style={[styles.proofIssueCard, { borderColor: colors.accent + '40', backgroundColor: colors.accent + '08' }]}>
                      <Text style={[styles.proofIssueChapter, { color: colors.accent }]} numberOfLines={1}>
                        {issue.chapterTitle}
                      </Text>
                      <Text style={[styles.proofIssueLabel, { color: colors.foreground }]}>{issue.issue}</Text>
                      <Text style={[styles.proofIssueLine, { color: colors.mutedForeground }]}>
                        "{issue.excerpt}"
                      </Text>
                      <TouchableOpacity
                        onPress={() => {
                          setProofingModal(null);
                          setTimeout(() =>
                            router.push({ pathname: '/chapter/[chapterId]', params: { chapterId: issue.chapterId, bookId: bookId ?? '' } }),
                            250
                          );
                        }}
                        style={[styles.proofGoBtn, { borderColor: colors.accent + '60', backgroundColor: colors.accent + '14' }]}
                        activeOpacity={0.8}
                      >
                        <Feather name="edit-3" size={12} color={colors.accent} />
                        <Text style={[styles.proofGoBtnText, { color: colors.accent }]}>Open chapter to fix</Text>
                      </TouchableOpacity>
                    </View>
                  ))}
                </ScrollView>
              )
            )}

            <TouchableOpacity
              onPress={() => setProofingModal(null)}
              style={[styles.modalDoneBtn, { backgroundColor: colors.primary, marginTop: 12 }]}
              activeOpacity={0.85}
            >
              <Text style={[styles.modalDoneText, { color: colors.primaryForeground }]}>Done</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Options modal */}
      <Modal
        visible={optionsVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setOptionsVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalSheet, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.foreground }]}>
                Finishing Touches
              </Text>
              <TouchableOpacity
                onPress={() => setOptionsVisible(false)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Feather name="x" size={20} color={colors.mutedForeground} />
              </TouchableOpacity>
            </View>

            {!allChaptersComplete && (
              <View style={[styles.hintBanner, { backgroundColor: colors.secondary }]}>
                <Feather name="info" size={13} color={colors.mutedForeground} />
                <Text style={[styles.hintText, { color: colors.mutedForeground }]}>
                  Mark every chapter complete to fully wrap up your book.
                </Text>
              </View>
            )}

            <Text style={[styles.modalSection, { color: colors.mutedForeground }]}>
              FRONT & BACK MATTER
            </Text>

            <View style={styles.optionRow}>
              <View style={styles.optionLabelWrap}>
                <Feather name="list" size={16} color={colors.primary} />
                <View style={{ flex: 1 }}>
                  <Text style={[styles.optionLabel, { color: colors.foreground }]}>
                    Table of Contents
                  </Text>
                  <Text style={[styles.optionDesc, { color: colors.mutedForeground }]}>
                    Auto-generated from your chapters.
                  </Text>
                </View>
              </View>
              <Switch
                value={includeTOC}
                onValueChange={(v) => updateBook(book.id, { includeTOC: v })}
                trackColor={{ false: colors.border, true: colors.primary }}
              />
            </View>

            {/* ── Copyright ── */}
            <View style={styles.optionRow}>
              <View style={styles.optionLabelWrap}>
                <Feather name="shield" size={16} color={colors.primary} />
                <View style={{ flex: 1 }}>
                  <Text style={[styles.optionLabel, { color: colors.foreground }]}>Copyright</Text>
                  <Text style={[styles.optionDesc, { color: colors.mutedForeground }]}>
                    {book.copyright?.trim() ? `${book.copyright.trim().split(/\s+/).filter(Boolean).length} words` : 'Standard copyright notice'}
                  </Text>
                </View>
              </View>
              <View style={styles.optionTrailing}>
                <TouchableOpacity onPress={() => openEdit('copyright')} style={[styles.miniBtn, { borderColor: colors.border }]}>
                  <Feather name="edit-2" size={12} color={colors.foreground} />
                  <Text style={[styles.miniBtnText, { color: colors.foreground }]}>{book.copyright?.trim() ? 'Edit' : 'Write'}</Text>
                </TouchableOpacity>
                <Switch value={includeCopyright} onValueChange={(v) => updateBook(book.id, { includeCopyright: v })} trackColor={{ false: colors.border, true: colors.primary }} />
              </View>
            </View>

            {/* ── Dedication ── */}
            <View style={styles.optionRow}>
              <View style={styles.optionLabelWrap}>
                <Feather name="heart" size={16} color={colors.primary} />
                <View style={{ flex: 1 }}>
                  <Text style={[styles.optionLabel, { color: colors.foreground }]}>Dedication</Text>
                  <Text style={[styles.optionDesc, { color: colors.mutedForeground }]}>
                    {book.dedication?.trim() ? `${book.dedication.trim().split(/\s+/).filter(Boolean).length} words written` : 'A short personal tribute'}
                  </Text>
                </View>
              </View>
              <View style={styles.optionTrailing}>
                {book.dedication?.trim() ? (
                  <TouchableOpacity onPress={() => openEdit('dedication')} style={[styles.miniBtn, { borderColor: colors.border }]}>
                    <Feather name="edit-2" size={12} color={colors.foreground} />
                    <Text style={[styles.miniBtnText, { color: colors.foreground }]}>Edit</Text>
                  </TouchableOpacity>
                ) : (
                  <>
                    <TouchableOpacity onPress={() => generateFrontMatter('dedication')} style={[styles.miniBtn, { borderColor: colors.primary, backgroundColor: colors.primary + '12' }]}>
                      <Feather name="zap" size={12} color={colors.primary} />
                      <Text style={[styles.miniBtnText, { color: colors.primary }]}>Generate</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => openEdit('dedication')} style={[styles.miniBtn, { borderColor: colors.border }]}>
                      <Feather name="edit-2" size={12} color={colors.foreground} />
                      <Text style={[styles.miniBtnText, { color: colors.foreground }]}>Write</Text>
                    </TouchableOpacity>
                  </>
                )}
                <Switch value={includeDedication} onValueChange={(v) => updateBook(book.id, { includeDedication: v })} trackColor={{ false: colors.border, true: colors.primary }} />
              </View>
            </View>

            {/* ── Epigraph ── */}
            <View style={styles.optionRow}>
              <View style={styles.optionLabelWrap}>
                <Feather name="message-circle" size={16} color={colors.primary} />
                <View style={{ flex: 1 }}>
                  <Text style={[styles.optionLabel, { color: colors.foreground }]}>Epigraph</Text>
                  <Text style={[styles.optionDesc, { color: colors.mutedForeground }]}>
                    {book.epigraph?.trim() ? 'Quote added' : 'Opening quote that sets the tone'}
                  </Text>
                </View>
              </View>
              <View style={styles.optionTrailing}>
                {book.epigraph?.trim() ? (
                  <TouchableOpacity onPress={() => openEdit('epigraph')} style={[styles.miniBtn, { borderColor: colors.border }]}>
                    <Feather name="edit-2" size={12} color={colors.foreground} />
                    <Text style={[styles.miniBtnText, { color: colors.foreground }]}>Edit</Text>
                  </TouchableOpacity>
                ) : (
                  <>
                    <TouchableOpacity onPress={() => generateFrontMatter('epigraph')} style={[styles.miniBtn, { borderColor: colors.primary, backgroundColor: colors.primary + '12' }]}>
                      <Feather name="zap" size={12} color={colors.primary} />
                      <Text style={[styles.miniBtnText, { color: colors.primary }]}>Suggest</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => openEdit('epigraph')} style={[styles.miniBtn, { borderColor: colors.border }]}>
                      <Feather name="edit-2" size={12} color={colors.foreground} />
                      <Text style={[styles.miniBtnText, { color: colors.foreground }]}>Write</Text>
                    </TouchableOpacity>
                  </>
                )}
                <Switch value={includeEpigraph} onValueChange={(v) => updateBook(book.id, { includeEpigraph: v })} trackColor={{ false: colors.border, true: colors.primary }} />
              </View>
            </View>

            {/* ── Foreword ── */}
            <View style={styles.optionRow}>
              <View style={styles.optionLabelWrap}>
                <Feather name="users" size={16} color={colors.primary} />
                <View style={{ flex: 1 }}>
                  <Text style={[styles.optionLabel, { color: colors.foreground }]}>Foreword</Text>
                  <Text style={[styles.optionDesc, { color: colors.mutedForeground }]}>
                    {book.foreword?.trim() ? `${book.foreword.trim().split(/\s+/).filter(Boolean).length} words written` : 'Written by a colleague or mentor'}
                  </Text>
                </View>
              </View>
              <View style={styles.optionTrailing}>
                {book.foreword?.trim() ? (
                  <TouchableOpacity onPress={() => openEdit('foreword')} style={[styles.miniBtn, { borderColor: colors.border }]}>
                    <Feather name="edit-2" size={12} color={colors.foreground} />
                    <Text style={[styles.miniBtnText, { color: colors.foreground }]}>Edit</Text>
                  </TouchableOpacity>
                ) : (
                  <>
                    <TouchableOpacity onPress={() => generateFrontMatter('foreword')} style={[styles.miniBtn, { borderColor: colors.primary, backgroundColor: colors.primary + '12' }]}>
                      <Feather name="zap" size={12} color={colors.primary} />
                      <Text style={[styles.miniBtnText, { color: colors.primary }]}>Generate</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => openEdit('foreword')} style={[styles.miniBtn, { borderColor: colors.border }]}>
                      <Feather name="edit-2" size={12} color={colors.foreground} />
                      <Text style={[styles.miniBtnText, { color: colors.foreground }]}>Write</Text>
                    </TouchableOpacity>
                  </>
                )}
                <Switch value={includeForeword} onValueChange={(v) => updateBook(book.id, { includeForeword: v })} trackColor={{ false: colors.border, true: colors.primary }} />
              </View>
            </View>

            {/* ── Preface ── */}
            <View style={styles.optionRow}>
              <View style={styles.optionLabelWrap}>
                <Feather name="feather" size={16} color={colors.primary} />
                <View style={{ flex: 1 }}>
                  <Text style={[styles.optionLabel, { color: colors.foreground }]}>Preface</Text>
                  <Text style={[styles.optionDesc, { color: colors.mutedForeground }]}>
                    {book.preface?.trim() ? `${book.preface.trim().split(/\s+/).filter(Boolean).length} words written` : "Author's voice — why you wrote this"}
                  </Text>
                </View>
              </View>
              <View style={styles.optionTrailing}>
                {book.preface?.trim() ? (
                  <TouchableOpacity onPress={() => openEdit('preface')} style={[styles.miniBtn, { borderColor: colors.border }]}>
                    <Feather name="edit-2" size={12} color={colors.foreground} />
                    <Text style={[styles.miniBtnText, { color: colors.foreground }]}>Edit</Text>
                  </TouchableOpacity>
                ) : (
                  <>
                    <TouchableOpacity onPress={() => generateFrontMatter('preface')} style={[styles.miniBtn, { borderColor: colors.primary, backgroundColor: colors.primary + '12' }]}>
                      <Feather name="zap" size={12} color={colors.primary} />
                      <Text style={[styles.miniBtnText, { color: colors.primary }]}>Generate</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => openEdit('preface')} style={[styles.miniBtn, { borderColor: colors.border }]}>
                      <Feather name="edit-2" size={12} color={colors.foreground} />
                      <Text style={[styles.miniBtnText, { color: colors.foreground }]}>Write</Text>
                    </TouchableOpacity>
                  </>
                )}
                <Switch value={includePreface} onValueChange={(v) => updateBook(book.id, { includePreface: v })} trackColor={{ false: colors.border, true: colors.primary }} />
              </View>
            </View>

            {/* ── Acknowledgements ── */}
            <View style={styles.optionRow}>
              <View style={styles.optionLabelWrap}>
                <Feather name="award" size={16} color={colors.primary} />
                <View style={{ flex: 1 }}>
                  <Text style={[styles.optionLabel, { color: colors.foreground }]}>Acknowledgements</Text>
                  <Text style={[styles.optionDesc, { color: colors.mutedForeground }]}>
                    {book.acknowledgements?.trim() ? `${book.acknowledgements.trim().split(/\s+/).filter(Boolean).length} words written` : 'Thank the people who helped'}
                  </Text>
                </View>
              </View>
              <View style={styles.optionTrailing}>
                {book.acknowledgements?.trim() ? (
                  <TouchableOpacity onPress={() => openEdit('acknowledgements')} style={[styles.miniBtn, { borderColor: colors.border }]}>
                    <Feather name="edit-2" size={12} color={colors.foreground} />
                    <Text style={[styles.miniBtnText, { color: colors.foreground }]}>Edit</Text>
                  </TouchableOpacity>
                ) : (
                  <>
                    <TouchableOpacity onPress={() => generateFrontMatter('acknowledgements')} style={[styles.miniBtn, { borderColor: colors.primary, backgroundColor: colors.primary + '12' }]}>
                      <Feather name="zap" size={12} color={colors.primary} />
                      <Text style={[styles.miniBtnText, { color: colors.primary }]}>Generate</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => openEdit('acknowledgements')} style={[styles.miniBtn, { borderColor: colors.border }]}>
                      <Feather name="edit-2" size={12} color={colors.foreground} />
                      <Text style={[styles.miniBtnText, { color: colors.foreground }]}>Write</Text>
                    </TouchableOpacity>
                  </>
                )}
                <Switch value={includeAcknowledgements} onValueChange={(v) => updateBook(book.id, { includeAcknowledgements: v })} trackColor={{ false: colors.border, true: colors.primary }} />
              </View>
            </View>

            {/* ── Prologue ── */}
            <View style={styles.optionRow}>
              <View style={styles.optionLabelWrap}>
                <Feather name="bookmark" size={16} color={colors.primary} />
                <View style={{ flex: 1 }}>
                  <Text style={[styles.optionLabel, { color: colors.foreground }]}>
                    Prologue
                  </Text>
                  <Text style={[styles.optionDesc, { color: colors.mutedForeground }]}>
                    {book.prologue?.trim()
                      ? `${book.prologue.trim().split(/\s+/).filter(Boolean).length} words written`
                      : 'Would you like one generated?'}
                  </Text>
                </View>
              </View>
              <View style={styles.optionTrailing}>
                {book.prologue?.trim() ? (
                  <TouchableOpacity
                    onPress={() => openEdit('prologue')}
                    style={[styles.miniBtn, { borderColor: colors.border }]}
                  >
                    <Feather name="edit-2" size={12} color={colors.foreground} />
                    <Text style={[styles.miniBtnText, { color: colors.foreground }]}>Edit</Text>
                  </TouchableOpacity>
                ) : (
                  <>
                    <TouchableOpacity
                      onPress={() => generateFrontMatter('prologue')}
                      style={[styles.miniBtn, { borderColor: colors.primary, backgroundColor: colors.primary + '12' }]}
                    >
                      <Feather name="zap" size={12} color={colors.primary} />
                      <Text style={[styles.miniBtnText, { color: colors.primary }]}>Generate</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => openEdit('prologue')}
                      style={[styles.miniBtn, { borderColor: colors.border }]}
                    >
                      <Feather name="edit-2" size={12} color={colors.foreground} />
                      <Text style={[styles.miniBtnText, { color: colors.foreground }]}>Write</Text>
                    </TouchableOpacity>
                  </>
                )}
                <Switch
                  value={includePrologue}
                  onValueChange={(v) => updateBook(book.id, { includePrologue: v })}
                  trackColor={{ false: colors.border, true: colors.primary }}
                />
              </View>
            </View>

            <View style={styles.optionRow}>
              <View style={styles.optionLabelWrap}>
                <Feather name="bookmark" size={16} color={colors.primary} />
                <View style={{ flex: 1 }}>
                  <Text style={[styles.optionLabel, { color: colors.foreground }]}>
                    Epilogue
                  </Text>
                  <Text style={[styles.optionDesc, { color: colors.mutedForeground }]}>
                    {book.epilogue?.trim()
                      ? `${book.epilogue.trim().split(/\s+/).filter(Boolean).length} words written`
                      : 'Would you like one generated?'}
                  </Text>
                </View>
              </View>
              <View style={styles.optionTrailing}>
                {book.epilogue?.trim() ? (
                  <TouchableOpacity
                    onPress={() => openEdit('epilogue')}
                    style={[styles.miniBtn, { borderColor: colors.border }]}
                  >
                    <Feather name="edit-2" size={12} color={colors.foreground} />
                    <Text style={[styles.miniBtnText, { color: colors.foreground }]}>Edit</Text>
                  </TouchableOpacity>
                ) : (
                  <>
                    <TouchableOpacity
                      onPress={() => generateFrontMatter('epilogue')}
                      style={[styles.miniBtn, { borderColor: colors.primary, backgroundColor: colors.primary + '12' }]}
                    >
                      <Feather name="zap" size={12} color={colors.primary} />
                      <Text style={[styles.miniBtnText, { color: colors.primary }]}>Generate</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => openEdit('epilogue')}
                      style={[styles.miniBtn, { borderColor: colors.border }]}
                    >
                      <Feather name="edit-2" size={12} color={colors.foreground} />
                      <Text style={[styles.miniBtnText, { color: colors.foreground }]}>Write</Text>
                    </TouchableOpacity>
                  </>
                )}
                <Switch
                  value={includeEpilogue}
                  onValueChange={(v) => updateBook(book.id, { includeEpilogue: v })}
                  trackColor={{ false: colors.border, true: colors.primary }}
                />
              </View>
            </View>

            <Text style={[styles.modalSection, { color: colors.mutedForeground }]}>
              PROOFREADING
            </Text>

            <TouchableOpacity
              onPress={() => {
                setOptionsVisible(false);
                setTimeout(() => setProofingModal('runon'), 200);
              }}
              activeOpacity={0.7}
              style={styles.optionRow}
            >
              <View style={styles.optionLabelWrap}>
                <Feather
                  name={runOnResult.count === 0 ? 'check-circle' : 'alert-circle'}
                  size={16}
                  color={runOnResult.count === 0 ? colors.primary : colors.warning}
                />
                <View style={{ flex: 1 }}>
                  <Text style={[styles.optionLabel, { color: colors.foreground }]}>
                    Run-on Sentences
                  </Text>
                  <Text style={[styles.optionDesc, { color: colors.mutedForeground }]}>
                    {runOnResult.count === 0
                      ? 'All clear — no sentences over 40 words.'
                      : `${runOnResult.count} sentence${runOnResult.count !== 1 ? 's' : ''} flagged — tap to review & fix`}
                  </Text>
                </View>
              </View>
              {runOnResult.count > 0 && (
                <View style={[styles.proofBadge, { backgroundColor: colors.warning }]}>
                  <Text style={styles.proofBadgeText}>{runOnResult.count}</Text>
                </View>
              )}
              <Feather name="chevron-right" size={18} color={colors.mutedForeground} />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => {
                setOptionsVisible(false);
                setTimeout(() => setProofingModal('dialogue'), 200);
              }}
              activeOpacity={0.7}
              style={styles.optionRow}
            >
              <View style={styles.optionLabelWrap}>
                <Feather
                  name={dialogueResult.count === 0 ? 'check-circle' : 'alert-circle'}
                  size={16}
                  color={dialogueResult.count === 0 ? colors.primary : colors.warning}
                />
                <View style={{ flex: 1 }}>
                  <Text style={[styles.optionLabel, { color: colors.foreground }]}>
                    Dialogue Punctuation
                  </Text>
                  <Text style={[styles.optionDesc, { color: colors.mutedForeground }]}>
                    {dialogueResult.count === 0
                      ? 'All clear — Chicago style looks good.'
                      : `${dialogueResult.count} issue${dialogueResult.count !== 1 ? 's' : ''} flagged — tap to review & fix`}
                  </Text>
                </View>
              </View>
              {dialogueResult.count > 0 && (
                <View style={[styles.proofBadge, { backgroundColor: colors.warning }]}>
                  <Text style={styles.proofBadgeText}>{dialogueResult.count}</Text>
                </View>
              )}
              <Feather name="chevron-right" size={18} color={colors.mutedForeground} />
            </TouchableOpacity>

            <Text style={[styles.modalSection, { color: colors.mutedForeground }]}>
              PUBLISHING
            </Text>

            <TouchableOpacity
              onPress={() => {
                setOptionsVisible(false);
                setTimeout(() => setDescModalVisible(true), 200);
              }}
              activeOpacity={0.7}
              style={styles.optionRow}
            >
              <View style={styles.optionLabelWrap}>
                <Feather name="shopping-bag" size={16} color={colors.primary} />
                <View style={{ flex: 1 }}>
                  <Text style={[styles.optionLabel, { color: colors.foreground }]}>
                    Amazon Description
                  </Text>
                  <Text style={[styles.optionDesc, { color: colors.mutedForeground }]}>
                    {book.amazonDescription?.trim()
                      ? `${book.amazonDescription.trim().split(/\s+/).filter(Boolean).length} words · ready to copy`
                      : 'AI-written back-cover blurb for KDP.'}
                  </Text>
                </View>
              </View>
              <Feather name="chevron-right" size={18} color={colors.mutedForeground} />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => {
                setOptionsVisible(false);
                setTimeout(() => setSeoModalVisible(true), 200);
              }}
              activeOpacity={0.7}
              style={styles.optionRow}
            >
              <View style={styles.optionLabelWrap}>
                <Feather name="search" size={16} color={colors.primary} />
                <View style={{ flex: 1 }}>
                  <Text style={[styles.optionLabel, { color: colors.foreground }]}>
                    SEO Keywords {!hasSeoKeywords && '· $9.99'}
                  </Text>
                  <Text style={[styles.optionDesc, { color: colors.mutedForeground }]}>
                    {hasSeoKeywords
                      ? book.seoKeywords?.length
                        ? `${book.seoKeywords.length} keywords ready to paste into KDP`
                        : 'Generate 7 targeted Amazon search phrases'
                      : 'One-time unlock — 7 AI-targeted search phrases'}
                  </Text>
                </View>
              </View>
              {hasSeoKeywords
                ? <Feather name="chevron-right" size={18} color={colors.mutedForeground} />
                : <Feather name="lock" size={14} color={colors.mutedForeground} />
              }
            </TouchableOpacity>

            <Text style={[styles.modalSection, { color: colors.mutedForeground }]}>
              TYPOGRAPHY
            </Text>

            <TouchableOpacity
              onPress={() => {
                setOptionsVisible(false);
                setTimeout(() => setHeadingFontPickerVisible(true), 200);
              }}
              activeOpacity={0.7}
              style={styles.optionRow}
            >
              <View style={styles.optionLabelWrap}>
                <Feather name="edit-3" size={16} color={colors.primary} />
                <View style={{ flex: 1 }}>
                  <Text style={[styles.optionLabel, { color: colors.foreground }]}>
                    Heading Font
                  </Text>
                  <Text style={[styles.optionDesc, { color: colors.mutedForeground }]}>
                    {`Currently: ${headingFont.label} · titles, chapters & TOC`}
                  </Text>
                </View>
              </View>
              <Feather name="chevron-right" size={18} color={colors.mutedForeground} />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => {
                if (!isSubscribed) {
                  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
                  return;
                }
                setOptionsVisible(false);
                setTimeout(() => setFontPickerVisible(true), 200);
              }}
              activeOpacity={isSubscribed ? 0.7 : 1}
              style={[styles.optionRow, !isSubscribed && { opacity: 0.7 }]}
            >
              <View style={styles.optionLabelWrap}>
                <Feather name="type" size={16} color={colors.primary} />
                <View style={{ flex: 1 }}>
                  <Text style={[styles.optionLabel, { color: colors.foreground }]}>
                    Reading Font {!isSubscribed && '· Pro'}
                  </Text>
                  <Text style={[styles.optionDesc, { color: colors.mutedForeground }]}>
                    {isSubscribed
                      ? `Currently: ${font.label}`
                      : 'Subscribe to choose from 12 literary fonts.'}
                  </Text>
                </View>
              </View>
              {isSubscribed ? (
                <Feather name="chevron-right" size={18} color={colors.mutedForeground} />
              ) : (
                <Feather name="lock" size={14} color={colors.mutedForeground} />
              )}
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => {
                setOptionsVisible(false);
                setTimeout(() => setFormatModalVisible(true), 200);
              }}
              activeOpacity={0.7}
              style={styles.optionRow}
            >
              <View style={styles.optionLabelWrap}>
                <Feather name="align-center" size={16} color={colors.primary} />
                <View style={{ flex: 1 }}>
                  <Text style={[styles.optionLabel, { color: colors.foreground }]}>
                    Document Format
                  </Text>
                  <Text style={[styles.optionDesc, { color: colors.mutedForeground }]}>
                    {[
                      `Title: ${fmt.titleAlignment}`,
                      `Chapters: ${fmt.chapterTitleAlignment}`,
                      fmt.pageNumbers !== 'none' ? 'Page numbers on' : 'No page numbers',
                    ].join(' · ')}
                  </Text>
                </View>
              </View>
              <Feather name="chevron-right" size={18} color={colors.mutedForeground} />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setOptionsVisible(false)}
              style={[styles.modalDoneBtn, { backgroundColor: colors.primary }]}
              activeOpacity={0.85}
            >
              <Text style={[styles.modalDoneText, { color: colors.primaryForeground }]}>
                Done
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Font picker modal (subscriber-only) */}
      <Modal
        visible={fontPickerVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setFontPickerVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalSheet, { backgroundColor: colors.card, borderColor: colors.border, maxHeight: '85%' }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.foreground }]}>
                Reading Font
              </Text>
              <TouchableOpacity
                onPress={() => setFontPickerVisible(false)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Feather name="x" size={20} color={colors.mutedForeground} />
              </TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
              {EXPORT_FONTS.map((f) => {
                const selected = f.id === fontId;
                return (
                  <TouchableOpacity
                    key={f.id}
                    onPress={() => {
                      Haptics.selectionAsync();
                      updateBook(book.id, { previewFontId: f.id });
                    }}
                    activeOpacity={0.85}
                    style={[
                      styles.fontRow,
                      {
                        backgroundColor: selected ? colors.primary + '12' : 'transparent',
                        borderColor: selected ? colors.primary : colors.border,
                      },
                    ]}
                  >
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.fontLabel, { color: colors.mutedForeground }]}>
                        {f.label} · {f.category === 'serif' ? 'Serif' : 'Sans-serif'}
                      </Text>
                      <Text
                        style={[
                          styles.fontSample,
                          { color: colors.foreground, fontFamily: f.family },
                        ]}
                      >
                        The quick brown fox jumps over the lazy dog.
                      </Text>
                    </View>
                    {selected && <Feather name="check" size={18} color={colors.primary} />}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
            <TouchableOpacity
              onPress={() => setFontPickerVisible(false)}
              style={[styles.modalDoneBtn, { backgroundColor: colors.primary }]}
              activeOpacity={0.85}
            >
              <Text style={[styles.modalDoneText, { color: colors.primaryForeground }]}>
                Done
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Heading font picker modal */}
      <Modal
        visible={headingFontPickerVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setHeadingFontPickerVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalSheet, { backgroundColor: colors.card, borderColor: colors.border, maxHeight: '85%' }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.foreground }]}>
                Heading Font
              </Text>
              <TouchableOpacity
                onPress={() => setHeadingFontPickerVisible(false)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Feather name="x" size={20} color={colors.mutedForeground} />
              </TouchableOpacity>
            </View>
            <Text style={[styles.optionDesc, { color: colors.mutedForeground, marginBottom: 10 }]}>
              Applied to your book title, chapter headings, and table of contents.
            </Text>
            <ScrollView showsVerticalScrollIndicator={false}>
              {EXPORT_FONTS.map((f) => {
                const selected = f.id === headingFontId;
                return (
                  <TouchableOpacity
                    key={f.id}
                    onPress={() => {
                      Haptics.selectionAsync();
                      updateBook(book.id, { headingFontId: f.id });
                    }}
                    activeOpacity={0.85}
                    style={[
                      styles.fontRow,
                      {
                        backgroundColor: selected ? colors.primary + '12' : 'transparent',
                        borderColor: selected ? colors.primary : colors.border,
                      },
                    ]}
                  >
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.fontLabel, { color: colors.mutedForeground }]}>
                        {f.label} · {f.category === 'serif' ? 'Serif' : 'Sans-serif'}
                      </Text>
                      <Text
                        style={[
                          styles.fontSample,
                          { color: colors.foreground, fontFamily: f.family },
                        ]}
                      >
                        The quick brown fox jumps over the lazy dog.
                      </Text>
                    </View>
                    {selected && <Feather name="check" size={18} color={colors.primary} />}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
            <TouchableOpacity
              onPress={() => setHeadingFontPickerVisible(false)}
              style={[styles.modalDoneBtn, { backgroundColor: colors.primary }]}
              activeOpacity={0.85}
            >
              <Text style={[styles.modalDoneText, { color: colors.primaryForeground }]}>
                Done
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* SEO Keywords modal */}
      <Modal
        visible={seoModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setSeoModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalSheet, { backgroundColor: colors.card, borderColor: colors.border, maxHeight: '90%' }]}>
            <View style={styles.modalHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Feather name="search" size={18} color={colors.primary} />
                <Text style={[styles.modalTitle, { color: colors.foreground }]}>
                  SEO Keywords
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setSeoModalVisible(false)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Feather name="x" size={20} color={colors.mutedForeground} />
              </TouchableOpacity>
            </View>

            {!hasSeoKeywords ? (
              /* ── Paywall state ── */
              <View style={styles.seoPaywall}>
                <View style={[styles.seoPaywallIcon, { backgroundColor: colors.secondary }]}>
                  <Feather name="search" size={28} color={colors.primary} />
                </View>
                <Text style={[styles.seoPaywallTitle, { color: colors.foreground }]}>
                  Amazon SEO Keywords
                </Text>
                <Text style={[styles.seoPaywallDesc, { color: colors.mutedForeground }]}>
                  Get 7 AI-researched search phrases tailored to your genre and story. Paste them straight into the Amazon KDP keyword fields to boost discoverability.
                </Text>
                <View style={styles.seoPaywallBullets}>
                  {[
                    'Long-tail phrases real readers search for',
                    'Tuned to your genre\'s top search trends',
                    'Tap any keyword to copy it instantly',
                    'One-time purchase — yours forever',
                  ].map((b) => (
                    <View key={b} style={styles.seoPaywallBulletRow}>
                      <Feather name="check" size={13} color={colors.primary} />
                      <Text style={[styles.seoPaywallBulletText, { color: colors.mutedForeground }]}>{b}</Text>
                    </View>
                  ))}
                </View>
                <TouchableOpacity
                  onPress={purchaseSeoKeywords}
                  disabled={isPurchasing}
                  activeOpacity={0.85}
                  style={[styles.seoUnlockBtn, { backgroundColor: colors.primary, opacity: isPurchasing ? 0.7 : 1 }]}
                >
                  {isPurchasing ? (
                    <ActivityIndicator size="small" color={colors.primaryForeground} />
                  ) : (
                    <Feather name="unlock" size={15} color={colors.primaryForeground} />
                  )}
                  <Text style={[styles.seoUnlockBtnText, { color: colors.primaryForeground }]}>
                    {isPurchasing ? 'Processing…' : `Unlock for ${seoPackage?.product?.priceString ?? '$9.99'}`}
                  </Text>
                </TouchableOpacity>
                <Text style={[styles.seoPaywallNote, { color: colors.mutedForeground }]}>
                  One-time purchase · No subscription required
                </Text>
              </View>
            ) : (
              /* ── Keyword tool state ── */
              <ScrollView showsVerticalScrollIndicator={false}>
                <Text style={[styles.optionDesc, { color: colors.mutedForeground, marginBottom: 14 }]}>
                  Paste these into the 7 keyword fields in your Amazon KDP book setup. Tap to copy · Long-press to see why it was chosen.
                </Text>

                {book.seoKeywords && book.seoKeywords.length > 0 ? (
                  <View style={styles.seoChipsGrid}>
                    {book.seoKeywords.map((kw, i) => {
                      const copied = seoChipCopied === kw.term;
                      return (
                        <TouchableOpacity
                          key={i}
                          onPress={() => {
                            if (seoLongPressRef.current) {
                              seoLongPressRef.current = false;
                              return;
                            }
                            copySeoChip(kw.term);
                          }}
                          onLongPress={() => {
                            seoLongPressRef.current = true;
                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                            setSeoTooltip(kw);
                          }}
                          delayLongPress={400}
                          activeOpacity={0.75}
                          style={[
                            styles.seoChip,
                            {
                              backgroundColor: copied ? colors.primary : colors.secondary,
                              borderColor: copied ? colors.primary : colors.border,
                            },
                          ]}
                        >
                          <Feather
                            name={copied ? 'check' : 'copy'}
                            size={11}
                            color={copied ? colors.primaryForeground : colors.mutedForeground}
                          />
                          <Text
                            style={[
                              styles.seoChipText,
                              { color: copied ? colors.primaryForeground : colors.foreground },
                            ]}
                          >
                            {kw.term}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                ) : (
                  <View style={[styles.descEmptyBox, { backgroundColor: colors.background, borderColor: colors.border }]}>
                    <Feather name="search" size={28} color={colors.mutedForeground} />
                    <Text style={[styles.descEmptyText, { color: colors.mutedForeground }]}>
                      No keywords yet — tap Generate to create them.
                    </Text>
                  </View>
                )}

                <TouchableOpacity
                  onPress={generateSeoKeywords}
                  disabled={seoGenerating}
                  activeOpacity={0.8}
                  style={[
                    styles.aiGenerateBtn,
                    {
                      backgroundColor: colors.primary,
                      borderColor: colors.primary,
                      marginTop: 12,
                      opacity: seoGenerating ? 0.7 : 1,
                    },
                  ]}
                >
                  {seoGenerating ? (
                    <>
                      <ActivityIndicator size="small" color={colors.primaryForeground} />
                      <Text style={[styles.aiGenerateBtnText, { color: colors.primaryForeground }]}>
                        Researching keywords…
                      </Text>
                    </>
                  ) : (
                    <>
                      <Feather name="zap" size={13} color={colors.primaryForeground} />
                      <Text style={[styles.aiGenerateBtnText, { color: colors.primaryForeground }]}>
                        {book.seoKeywords?.length ? 'Regenerate Keywords' : 'Generate Keywords'}
                      </Text>
                    </>
                  )}
                </TouchableOpacity>

                {(book.seoKeywords?.length ?? 0) > 0 && (
                  <TouchableOpacity
                    onPress={copyAllSeoKeywords}
                    activeOpacity={0.8}
                    style={[
                      styles.descActionBtn,
                      {
                        backgroundColor: seoAllCopied ? colors.primary : colors.secondary,
                        borderColor: seoAllCopied ? colors.primary : colors.border,
                        marginTop: 8,
                      },
                    ]}
                  >
                    <Feather name={seoAllCopied ? 'check' : 'copy'} size={14} color={seoAllCopied ? colors.primaryForeground : colors.foreground} />
                    <Text style={[styles.descActionText, { color: seoAllCopied ? colors.primaryForeground : colors.foreground }]}>
                      {seoAllCopied ? 'All Copied!' : `Copy All ${book.seoKeywords?.length ?? ''} Keywords`.trim()}
                    </Text>
                  </TouchableOpacity>
                )}
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>

      {/* Document Format modal */}
      <Modal
        visible={formatModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setFormatModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalSheet, { backgroundColor: colors.card, borderColor: colors.border, maxHeight: '88%' }]}>
            <View style={styles.modalHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Feather name="align-center" size={18} color={colors.primary} />
                <Text style={[styles.modalTitle, { color: colors.foreground }]}>Document Format</Text>
              </View>
              <TouchableOpacity onPress={() => setFormatModalVisible(false)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                <Feather name="x" size={20} color={colors.mutedForeground} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Title alignment */}
              <Text style={[styles.fmtSectionLabel, { color: colors.mutedForeground }]}>TITLE ALIGNMENT</Text>
              <View style={styles.fmtChoiceRow}>
                {(['left', 'center', 'right'] as TextAlignment[]).map((align) => {
                  const icons: Record<TextAlignment, string> = { left: 'align-left', center: 'align-center', right: 'align-right' };
                  const selected = fmt.titleAlignment === align;
                  return (
                    <TouchableOpacity
                      key={align}
                      onPress={() => {
                        Haptics.selectionAsync();
                        updateBook(book.id, { formatSettings: { ...fmt, titleAlignment: align } });
                      }}
                      activeOpacity={0.8}
                      style={[styles.fmtCard, { backgroundColor: selected ? colors.primary + '18' : colors.background, borderColor: selected ? colors.primary : colors.border }]}
                    >
                      <Feather name={icons[align] as any} size={20} color={selected ? colors.primary : colors.mutedForeground} />
                      <Text style={[styles.fmtCardLabel, { color: selected ? colors.primary : colors.foreground, fontFamily: selected ? 'Inter_700Bold' : 'Inter_400Regular' }]}>
                        {align.charAt(0).toUpperCase() + align.slice(1)}
                      </Text>
                      {selected && <View style={[styles.fmtCardDot, { backgroundColor: colors.primary }]} />}
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Chapter title alignment */}
              <Text style={[styles.fmtSectionLabel, { color: colors.mutedForeground, marginTop: 20 }]}>CHAPTER TITLE ALIGNMENT</Text>
              <View style={styles.fmtChoiceRow}>
                {(['left', 'center', 'right'] as TextAlignment[]).map((align) => {
                  const icons: Record<TextAlignment, string> = { left: 'align-left', center: 'align-center', right: 'align-right' };
                  const selected = fmt.chapterTitleAlignment === align;
                  return (
                    <TouchableOpacity
                      key={align}
                      onPress={() => {
                        Haptics.selectionAsync();
                        updateBook(book.id, { formatSettings: { ...fmt, chapterTitleAlignment: align } });
                      }}
                      activeOpacity={0.8}
                      style={[styles.fmtCard, { backgroundColor: selected ? colors.primary + '18' : colors.background, borderColor: selected ? colors.primary : colors.border }]}
                    >
                      <Feather name={icons[align] as any} size={20} color={selected ? colors.primary : colors.mutedForeground} />
                      <Text style={[styles.fmtCardLabel, { color: selected ? colors.primary : colors.foreground, fontFamily: selected ? 'Inter_700Bold' : 'Inter_400Regular' }]}>
                        {align.charAt(0).toUpperCase() + align.slice(1)}
                      </Text>
                      {selected && <View style={[styles.fmtCardDot, { backgroundColor: colors.primary }]} />}
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Page numbers */}
              <Text style={[styles.fmtSectionLabel, { color: colors.mutedForeground, marginTop: 20 }]}>PAGE NUMBERS</Text>
              <View style={styles.fmtChoiceRow}>
                {([
                  { value: 'none', label: 'None', icon: 'slash' },
                  { value: 'bottom-center', label: 'Center', icon: 'align-justify' },
                  { value: 'bottom-outside', label: 'Outside', icon: 'columns' },
                ] as { value: PageNumberStyle; label: string; icon: string }[]).map(({ value, label, icon }) => {
                  const selected = fmt.pageNumbers === value;
                  return (
                    <TouchableOpacity
                      key={value}
                      onPress={() => {
                        Haptics.selectionAsync();
                        updateBook(book.id, { formatSettings: { ...fmt, pageNumbers: value } });
                      }}
                      activeOpacity={0.8}
                      style={[styles.fmtCard, { backgroundColor: selected ? colors.primary + '18' : colors.background, borderColor: selected ? colors.primary : colors.border }]}
                    >
                      <Feather name={icon as any} size={20} color={selected ? colors.primary : colors.mutedForeground} />
                      <Text style={[styles.fmtCardLabel, { color: selected ? colors.primary : colors.foreground, fontFamily: selected ? 'Inter_700Bold' : 'Inter_400Regular' }]}>
                        {label}
                      </Text>
                      {selected && <View style={[styles.fmtCardDot, { backgroundColor: colors.primary }]} />}
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Font sizes */}
              {([
                { key: 'titleFontSize' as const, label: 'TITLE SIZE', def: 32, min: 18, max: 52 },
                { key: 'chapterTitleFontSize' as const, label: 'CHAPTER TITLE SIZE', def: 22, min: 14, max: 38 },
                { key: 'authorFontSize' as const, label: 'AUTHOR SIZE', def: 16, min: 10, max: 28 },
              ]).map(({ key, label, def, min, max }) => {
                const current = fmt[key] ?? def;
                return (
                  <View key={key} style={{ marginTop: 20 }}>
                    <Text style={[styles.fmtSectionLabel, { color: colors.mutedForeground }]}>{label}</Text>
                    <View style={styles.fmtStepperRow}>
                      <TouchableOpacity
                        onPress={() => { Haptics.selectionAsync(); updateBook(book.id, { formatSettings: { ...fmt, [key]: Math.max(min, current - 2) } }); }}
                        style={[styles.fmtStepBtn, { borderColor: current <= min ? colors.border + '60' : colors.border, backgroundColor: colors.background }]}
                        disabled={current <= min}
                      >
                        <Text style={[styles.fmtStepBtnText, { color: current <= min ? colors.mutedForeground : colors.foreground }]}>−</Text>
                      </TouchableOpacity>
                      <Text style={[styles.fmtStepValue, { color: colors.foreground, backgroundColor: colors.secondary, borderColor: colors.border }]}>{current}</Text>
                      <TouchableOpacity
                        onPress={() => { Haptics.selectionAsync(); updateBook(book.id, { formatSettings: { ...fmt, [key]: Math.min(max, current + 2) } }); }}
                        style={[styles.fmtStepBtn, { borderColor: current >= max ? colors.border + '60' : colors.border, backgroundColor: colors.background }]}
                        disabled={current >= max}
                      >
                        <Text style={[styles.fmtStepBtnText, { color: current >= max ? colors.mutedForeground : colors.foreground }]}>+</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                );
              })}

              <View style={[styles.fmtHintCard, { backgroundColor: colors.secondary, borderColor: colors.border }]}>
                <Feather name="info" size={13} color={colors.mutedForeground} />
                <Text style={[styles.fmtHintText, { color: colors.mutedForeground }]}>
                  Changes apply instantly to the preview and are saved to your book.
                </Text>
              </View>

              <TouchableOpacity
                onPress={() => setFormatModalVisible(false)}
                style={[styles.modalDoneBtn, { backgroundColor: colors.primary, marginTop: 20 }]}
                activeOpacity={0.85}
              >
                <Text style={[styles.modalDoneText, { color: colors.primaryForeground }]}>Done</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Amazon Description modal */}
      <Modal
        visible={descModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setDescModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalSheet, { backgroundColor: colors.card, borderColor: colors.border, maxHeight: '85%' }]}>
            <View style={styles.modalHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Feather name="shopping-bag" size={18} color={colors.primary} />
                <Text style={[styles.modalTitle, { color: colors.foreground }]}>
                  Amazon Description
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setDescModalVisible(false)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Feather name="x" size={20} color={colors.mutedForeground} />
              </TouchableOpacity>
            </View>

            <Text style={[styles.optionDesc, { color: colors.mutedForeground, marginBottom: 14 }]}>
              Paste this into the Amazon KDP book description field when publishing.
            </Text>

            {book.amazonDescription?.trim() ? (
              <ScrollView
                style={[styles.descTextBox, { backgroundColor: colors.background, borderColor: colors.border }]}
                showsVerticalScrollIndicator={false}
              >
                <Text style={[styles.descBodyText, { color: colors.foreground }]}>
                  {book.amazonDescription.trim()}
                </Text>
              </ScrollView>
            ) : (
              <View style={[styles.descEmptyBox, { backgroundColor: colors.background, borderColor: colors.border }]}>
                <Feather name="file-text" size={28} color={colors.mutedForeground} />
                <Text style={[styles.descEmptyText, { color: colors.mutedForeground }]}>
                  No description yet — tap Generate to create one.
                </Text>
              </View>
            )}

            <TouchableOpacity
              onPress={generateBookDescription}
              disabled={descGenerating}
              activeOpacity={0.8}
              style={[
                styles.aiGenerateBtn,
                {
                  backgroundColor: colors.primary,
                  borderColor: colors.primary,
                  marginTop: 12,
                  opacity: descGenerating ? 0.7 : 1,
                },
              ]}
            >
              {descGenerating ? (
                <>
                  <ActivityIndicator size="small" color={colors.primaryForeground} />
                  <Text style={[styles.aiGenerateBtnText, { color: colors.primaryForeground }]}>
                    Writing description…
                  </Text>
                </>
              ) : (
                <>
                  <Feather name="zap" size={13} color={colors.primaryForeground} />
                  <Text style={[styles.aiGenerateBtnText, { color: colors.primaryForeground }]}>
                    {book.amazonDescription?.trim() ? 'Regenerate with AI' : 'Generate with AI'}
                  </Text>
                </>
              )}
            </TouchableOpacity>

            {book.amazonDescription?.trim() && (
              <View style={styles.descActions}>
                <TouchableOpacity
                  onPress={copyDescription}
                  activeOpacity={0.8}
                  style={[styles.descActionBtn, { backgroundColor: descCopied ? colors.primary : colors.secondary, borderColor: descCopied ? colors.primary : colors.border }]}
                >
                  <Feather name={descCopied ? 'check' : 'copy'} size={14} color={descCopied ? colors.primaryForeground : colors.foreground} />
                  <Text style={[styles.descActionText, { color: descCopied ? colors.primaryForeground : colors.foreground }]}>
                    {descCopied ? 'Copied!' : 'Copy'}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={shareDescription}
                  activeOpacity={0.8}
                  style={[styles.descActionBtn, { backgroundColor: colors.secondary, borderColor: colors.border }]}
                >
                  <Feather name="share-2" size={14} color={colors.foreground} />
                  <Text style={[styles.descActionText, { color: colors.foreground }]}>
                    Share
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </Modal>

      {/* SEO keyword reason tooltip */}
      <Modal
        visible={seoTooltip !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setSeoTooltip(null)}
      >
        <TouchableOpacity
          style={styles.tooltipOverlay}
          activeOpacity={1}
          onPress={() => setSeoTooltip(null)}
        >
          <View style={[styles.tooltipBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.tooltipHeader}>
              <Feather name="info" size={14} color={colors.primary} />
              <Text style={[styles.tooltipTerm, { color: colors.foreground }]} numberOfLines={2}>
                {seoTooltip?.term}
              </Text>
            </View>
            <Text style={[styles.tooltipReason, { color: colors.mutedForeground }]}>
              {seoTooltip?.reason || 'Regenerate your keywords to see the strategy behind each one.'}
            </Text>
            <TouchableOpacity
              onPress={() => setSeoTooltip(null)}
              style={[styles.tooltipDismiss, { backgroundColor: colors.secondary, borderColor: colors.border }]}
              activeOpacity={0.8}
            >
              <Text style={[styles.tooltipDismissText, { color: colors.foreground }]}>Got it</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Prologue / Epilogue editor */}
      <Modal
        visible={editingFront !== null}
        transparent
        animationType="slide"
        onRequestClose={() => setEditingFront(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalSheet, { backgroundColor: colors.card, borderColor: colors.border, maxHeight: '85%' }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.foreground }]}>
                {editingFront === 'prologue' ? 'Prologue' : 'Epilogue'}
              </Text>
              <TouchableOpacity
                onPress={() => setEditingFront(null)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Feather name="x" size={20} color={colors.mutedForeground} />
              </TouchableOpacity>
            </View>
            <Text style={[styles.optionDesc, { color: colors.mutedForeground, marginBottom: 12 }]}>
              {editingFront === 'prologue'
                ? 'A scene or note that comes before chapter 1.'
                : 'A closing scene or note that comes after your last chapter.'}
            </Text>
            <TouchableOpacity
              onPress={() => generateFrontMatter()}
              disabled={aiGenerating}
              activeOpacity={0.8}
              style={[
                styles.aiGenerateBtn,
                {
                  backgroundColor: isSubscribed ? colors.primary : colors.secondary,
                  borderColor: isSubscribed ? colors.primary : colors.border,
                  opacity: aiGenerating ? 0.7 : 1,
                },
              ]}
            >
              {aiGenerating ? (
                <>
                  <ActivityIndicator size="small" color={isSubscribed ? colors.primaryForeground : colors.mutedForeground} />
                  <Text style={[styles.aiGenerateBtnText, { color: isSubscribed ? colors.primaryForeground : colors.mutedForeground }]}>
                    Writing...
                  </Text>
                </>
              ) : (
                <>
                  <Feather name="zap" size={13} color={isSubscribed ? colors.primaryForeground : colors.mutedForeground} />
                  <Text style={[styles.aiGenerateBtnText, { color: isSubscribed ? colors.primaryForeground : colors.mutedForeground }]}>
                    {isSubscribed
                      ? `Generate ${editingFront === 'prologue' ? 'Prologue' : 'Epilogue'} with AI`
                      : `Generate with AI · Pro`}
                  </Text>
                </>
              )}
            </TouchableOpacity>
            <TextInput
              value={editText}
              onChangeText={setEditText}
              multiline
              autoFocus
              placeholder={
                editingFront === 'prologue'
                  ? 'Open with a hook from before the story begins...'
                  : 'Bring your story home with a final scene or reflection...'
              }
              placeholderTextColor={colors.mutedForeground}
              style={[
                styles.frontInput,
                {
                  color: colors.foreground,
                  borderColor: colors.border,
                  backgroundColor: colors.background,
                  fontFamily: font.family,
                },
              ]}
            />
            <View style={styles.editorActions}>
              <TouchableOpacity
                onPress={() => setEditingFront(null)}
                disabled={aiGenerating}
                style={[styles.editorBtn, { borderColor: colors.border, opacity: aiGenerating ? 0.5 : 1 }]}
              >
                <Text style={[styles.editorBtnText, { color: colors.foreground }]}>
                  Cancel
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={saveEdit}
                disabled={aiGenerating}
                style={[styles.editorBtn, { backgroundColor: colors.primary, borderColor: colors.primary, opacity: aiGenerating ? 0.5 : 1 }]}
              >
                <Text style={[styles.editorBtnText, { color: colors.primaryForeground }]}>
                  Save
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  notFound: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  notFoundText: { fontSize: 16, fontFamily: 'Inter_400Regular' },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginRight: Platform.OS === 'web' ? 8 : 0,
  },
  statsBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    gap: 8,
    flexWrap: 'wrap',
  },
  statChip: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  statText: { fontSize: 12, fontFamily: 'Inter_400Regular' },
  copyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  copyBtnText: { fontSize: 12, fontFamily: 'Inter_600SemiBold' },
  sectionBlock: { marginTop: 14, gap: 6 },
  sectionPrompt: {
    fontSize: 11,
    fontStyle: 'italic',
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
  scrollContent: { paddingHorizontal: 24, paddingTop: 32, gap: 0 }, // paddingHorizontal overridden dynamically for tablet
  titlePage: { alignItems: 'center', paddingBottom: 40, gap: 12 },
  bookTitle: {
    fontSize: 32,
    textAlign: 'center',
    letterSpacing: -0.5,
    lineHeight: 40,
    fontWeight: '700',
  },
  titleDivider: { width: 48, height: 3, borderRadius: 2, marginVertical: 4 },
  genreText: { fontSize: 14, textTransform: 'uppercase', letterSpacing: 1.5 },
  descText: {
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 16,
    marginTop: 8,
    fontStyle: 'italic',
  },
  emptyPreview: { alignItems: 'center', gap: 12, paddingTop: 40 },
  emptyText: { fontSize: 16 },
  chapterBlock: { gap: 8, paddingBottom: 32 },
  frontMatterBlock: { gap: 8, paddingBottom: 32 },
  chapterDivider: { height: 1, marginBottom: 16 },
  chapterLabel: { fontSize: 12, textTransform: 'uppercase', letterSpacing: 1.5 },
  chapterTitle: {
    fontSize: 22,
    letterSpacing: -0.3,
    lineHeight: 28,
    marginBottom: 12,
    fontWeight: '700',
  },
  chapterBody: { fontSize: 16, lineHeight: 26, letterSpacing: 0.1 },
  emptyChapter: { fontSize: 14, fontStyle: 'italic' },
  tocBlock: { gap: 6, paddingBottom: 32, alignItems: 'center' },
  tocHeading: { fontSize: 22, fontWeight: '700', letterSpacing: -0.3 },
  tocDivider: { width: 48, height: 3, borderRadius: 2, marginVertical: 8 },
  tocRow: { flexDirection: 'row', alignItems: 'center', alignSelf: 'stretch', gap: 8 },
  tocItem: { fontSize: 14 },
  tocDots: { flex: 1, borderBottomWidth: 1, borderStyle: 'dashed', marginHorizontal: 4 },
  // ── modal styles ─────────────────────────────────────────
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  modalSheet: {
    padding: 20,
    paddingBottom: 36,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderTopWidth: 1,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    gap: 4,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  modalTitle: { fontSize: 18, fontFamily: 'Inter_700Bold' },
  modalSection: {
    fontSize: 11,
    fontFamily: 'Inter_600SemiBold',
    letterSpacing: 1.2,
    marginTop: 16,
    marginBottom: 4,
  },
  hintBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 10,
    borderRadius: 10,
    marginBottom: 4,
  },
  hintText: { fontSize: 12, fontFamily: 'Inter_400Regular', flex: 1 },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    gap: 12,
  },
  optionLabelWrap: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    flex: 1,
    paddingTop: 2,
  },
  optionLabel: { fontSize: 14, fontFamily: 'Inter_600SemiBold' },
  optionDesc: { fontSize: 12, fontFamily: 'Inter_400Regular', marginTop: 2 },
  optionTrailing: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  miniBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  miniBtnText: { fontSize: 11, fontFamily: 'Inter_600SemiBold' },
  modalDoneBtn: {
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 18,
  },
  modalDoneText: { fontSize: 14, fontFamily: 'Inter_600SemiBold' },
  fontRow: {
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  fontLabel: {
    fontSize: 11,
    fontFamily: 'Inter_500Medium',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  fontSample: { fontSize: 16, lineHeight: 22 },
  frontInput: {
    minHeight: 220,
    maxHeight: 360,
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    fontSize: 15,
    lineHeight: 22,
    textAlignVertical: 'top',
  },
  aiGenerateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 10,
  },
  aiGenerateBtnText: { fontSize: 13, fontFamily: 'Inter_600SemiBold' },
  descTextBox: {
    maxHeight: 220,
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
  },
  descBodyText: {
    fontSize: 14,
    lineHeight: 22,
    fontFamily: 'Inter_400Regular',
  },
  descEmptyBox: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    gap: 10,
  },
  descEmptyText: {
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    textAlign: 'center',
    lineHeight: 18,
  },
  descActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 10,
  },
  descActionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 11,
    borderRadius: 10,
    borderWidth: 1,
  },
  descActionText: { fontSize: 14, fontFamily: 'Inter_600SemiBold' },
  pageNumRow: {
    flexDirection: 'row',
    borderTopWidth: StyleSheet.hairlineWidth,
    marginTop: 20,
    paddingTop: 8,
  },
  pageNumText: { fontSize: 11, letterSpacing: 0.5 },
  fmtSectionLabel: { fontSize: 10, fontFamily: 'Inter_600SemiBold', letterSpacing: 1.2, marginBottom: 10 },
  fmtChoiceRow: { flexDirection: 'row', gap: 8 },
  fmtCard: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 16,
    borderRadius: 14,
    borderWidth: 1.5,
    position: 'relative',
  },
  fmtCardLabel: { fontSize: 12 },
  fmtCardDot: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  fmtHintCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    marginTop: 20,
  },
  fmtHintText: { fontSize: 12, fontFamily: 'Inter_400Regular', flex: 1, lineHeight: 18 },
  authorText: { fontSize: 16, letterSpacing: 0.2 },
  fmtStepperRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 16 },
  fmtStepBtn: { width: 44, height: 44, borderRadius: 12, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  fmtStepBtnText: { fontSize: 24, fontFamily: 'Inter_400Regular', lineHeight: 28 },
  fmtStepValue: { fontSize: 18, fontFamily: 'Inter_600SemiBold', width: 52, textAlign: 'center', paddingVertical: 8, borderRadius: 10, borderWidth: 1, overflow: 'hidden' },
  seoPaywall: { alignItems: 'center', gap: 12, paddingVertical: 8 },
  seoPaywallIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  seoPaywallTitle: { fontSize: 18, fontFamily: 'Inter_700Bold', textAlign: 'center' },
  seoPaywallDesc: { fontSize: 13, fontFamily: 'Inter_400Regular', textAlign: 'center', lineHeight: 20 },
  seoPaywallBullets: { alignSelf: 'stretch', gap: 8, marginVertical: 4 },
  seoPaywallBulletRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  seoPaywallBulletText: { fontSize: 13, fontFamily: 'Inter_400Regular', flex: 1 },
  seoUnlockBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 14,
    alignSelf: 'stretch',
    marginTop: 4,
  },
  seoUnlockBtnText: { fontSize: 16, fontFamily: 'Inter_700Bold' },
  seoPaywallNote: { fontSize: 11, fontFamily: 'Inter_400Regular', textAlign: 'center' },
  seoChipsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  seoChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingVertical: 7,
    paddingHorizontal: 11,
    borderRadius: 20,
    borderWidth: 1,
  },
  seoChipText: { fontSize: 12, fontFamily: 'Inter_600SemiBold' },
  editorActions: { flexDirection: 'row', gap: 10, marginTop: 14 },
  editorBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
  },
  editorBtnText: { fontSize: 14, fontFamily: 'Inter_600SemiBold' },
  tooltipOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.45)',
    paddingHorizontal: 28,
  },
  tooltipBox: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 18,
    gap: 10,
    width: '100%',
    maxWidth: 380,
  },
  tooltipHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  tooltipTerm: {
    fontSize: 15,
    fontFamily: 'Inter_700Bold',
    flex: 1,
  },
  tooltipReason: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    lineHeight: 21,
  },
  tooltipDismiss: {
    alignSelf: 'flex-end',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    marginTop: 4,
  },
  tooltipDismissText: { fontSize: 13, fontFamily: 'Inter_600SemiBold' },
  proofBadge: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 2,
  },
  proofBadgeText: { color: '#fff', fontSize: 11, fontFamily: 'Inter_700Bold' },
  proofIntro: { fontSize: 13, fontFamily: 'Inter_400Regular', lineHeight: 19, marginBottom: 12 },
  proofAllClear: { alignItems: 'center', gap: 10, paddingVertical: 32 },
  proofAllClearText: { fontSize: 18, fontFamily: 'Inter_700Bold' },
  proofAllClearSub: { fontSize: 13, fontFamily: 'Inter_400Regular', textAlign: 'center' },
  proofIssueCard: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    gap: 6,
  },
  proofIssueChapter: { fontSize: 11, fontFamily: 'Inter_600SemiBold', letterSpacing: 0.4 },
  proofIssueLabel: { fontSize: 13, fontFamily: 'Inter_600SemiBold' },
  proofIssueLine: { fontSize: 13, fontFamily: 'Inter_400Regular', fontStyle: 'italic', lineHeight: 18 },
  proofGoBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    marginTop: 2,
  },
  proofGoBtnText: { fontSize: 12, fontFamily: 'Inter_600SemiBold' },
});
