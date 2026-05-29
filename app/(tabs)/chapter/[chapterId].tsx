import { Feather } from '@expo/vector-icons';
import { useAuth } from '@clerk/expo';
import { useTranslation } from 'react-i18next';
import * as Haptics from 'expo-haptics';
import { router, useLocalSearchParams, useNavigation } from 'expo-router';
import React, { useCallback, useLayoutEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Keyboard,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { API_BASE } from '@/constants/api';
import { CoachMark } from '@/components/CoachMark';
import { ThesaurusModal } from '@/components/ThesaurusModal';
import { AddFontModal } from '@/components/AddFontModal';
import { DEFAULT_FONT_ID, DEFAULT_HEADING_FONT_ID, getFontById, getFontStyleProps, HEADING_FONT_OPTIONS } from '@/constants/fonts';
import { useBooks } from '@/context/BookContext';
import { useLanguage } from '@/context/LanguageContext';
import { useCustomFonts } from '@/hooks/useCustomFonts';
import { useColors } from '@/hooks/useColors';
import { useFirstUseTips, TipId } from '@/hooks/useFirstUseTips';
import { useSubscription } from '@/lib/revenuecat';
import { getWorkLabel } from '@/lib/workLabel';
import { Book, Chapter, Section, SectionType } from '@/types';

interface TipControls {
  isTipSeen: (tipId: TipId) => boolean;
  dismissTip: (tipId: TipId) => void;
}

export const SECTION_TYPE_META: Record<
  SectionType,
  { label: string; color: string; icon: string; defaultPrompt: string }
> = {
  scene: {
    label: 'Scene',
    color: '#2D7D4A',
    icon: 'sun',
    defaultPrompt: 'Describe what happens in this scene.',
  },
  description: {
    label: 'Description',
    color: '#7B4EA6',
    icon: 'align-left',
    defaultPrompt: 'Paint the setting or atmosphere in detail.',
  },
  dialogue: {
    label: 'Dialogue',
    color: '#1A6B9A',
    icon: 'message-square',
    defaultPrompt: 'Write the key exchange or conversation.',
  },
  action: {
    label: 'Action',
    color: '#C27B2A',
    icon: 'zap',
    defaultPrompt: 'What conflict, tension, or event drives this beat?',
  },
  reflection: {
    label: 'Reflection',
    color: '#2A7B7B',
    icon: 'heart',
    defaultPrompt: 'Reflect on what just happened and what it means.',
  },
  character: {
    label: 'Character',
    color: '#B6446B',
    icon: 'user',
    defaultPrompt:
      'Add a character: name, role, what they want vs. what they need, their flaw, and one vivid detail.',
  },
  world: {
    label: 'World / Setting',
    color: '#3A6E94',
    icon: 'globe',
    defaultPrompt:
      'Describe a piece of the world: a place, faction, rule, ritual, or artifact — with a sensory detail and the conflict it creates.',
  },
  verse: {
    label: 'Verse',
    color: '#9B5B8A',
    icon: 'feather',
    defaultPrompt: 'Write this verse or stanza.',
  },
  custom: {
    label: 'Custom',
    color: '#6B6B6B',
    icon: 'edit',
    defaultPrompt: 'Write a prompt or question for this section...',
  },
};

const SECTION_TYPE_OPTIONS: SectionType[] = [
  'scene',
  'description',
  'character',
  'world',
  'dialogue',
  'action',
  'reflection',
  'verse',
  'custom',
];

function SectionCard({
  section,
  bookId,
  chapterId,
  book,
  chapter,
  onDelete,
  tipControls,
  isFirstSection,
}: {
  section: Section;
  bookId: string;
  chapterId: string;
  book: Book;
  chapter: Chapter;
  onDelete: () => void;
  tipControls?: TipControls;
  isFirstSection?: boolean;
}) {
  const colors = useColors();
  const { t } = useTranslation();
  const { updateSection, updateSectionPrompt, addSection } = useBooks();
  const { language } = useLanguage();
  const meta = SECTION_TYPE_META[section.type];
  const wordCount = section.content.split(/\s+/).filter(Boolean).length;
  const dialogueStyleProps = section.type === 'dialogue'
    ? getFontStyleProps(getFontById(book.dialogueFontId ?? DEFAULT_FONT_ID), book.dialogueFontBold, book.dialogueFontItalic)
    : {};
  const isFilled = section.content.trim().length > 0;
  const supportsAISuggest = section.type === 'character' || section.type === 'world';

  const editInputRef = useRef<TextInput>(null);

  const paragraphs = useMemo<string[]>(() => {
    const trimmed = section.content.trim();
    if (!trimmed) return [];
    const byDoubleNewline = trimmed.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean);
    if (byDoubleNewline.length > 1) return byDoubleNewline;
    const bySingleNewline = trimmed.split(/\n/).map((p) => p.trim()).filter(Boolean);
    if (bySingleNewline.length > 1) return bySingleNewline;
    return [trimmed];
  }, [section.content]);

  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isSuggesting, setIsSuggesting] = useState(false);
  const [suggestError, setSuggestError] = useState<string | null>(null);

  const [followUpQ, setFollowUpQ] = useState<string | null>(null);
  const [isFollowingUp, setIsFollowingUp] = useState(false);

  // Prompt refresh
  const [isRefreshingPrompt, setIsRefreshingPrompt] = useState(false);

  const handleRefreshPrompt = useCallback(async () => {
    Haptics.selectionAsync();
    setIsRefreshingPrompt(true);
    try {
      const res = await fetch(`${API_BASE}/writing/refresh-prompt`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sectionType: section.type,
          bookTitle: book.title,
          genre: book.genre,
          chapterTitle: chapter.title,
          chapterNumber: chapter.number,
          language,
          currentPrompt: section.prompt,
        }),
      });
      if (!res.ok) throw new Error('Server error');
      const data = (await res.json()) as { prompt: string };
      updateSectionPrompt(bookId, chapterId, section.id, data.prompt);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {
      // silently fail — the old prompt stays
    } finally {
      setIsRefreshingPrompt(false);
    }
  }, [section.type, section.prompt, section.id, book.title, book.genre, chapter.title, chapter.number, language, bookId, chapterId, updateSectionPrompt]);

  // Writing assistant
  const [writingAnalysis, setWritingAnalysis] = useState<{
    tone: string;
    readabilityScore: number;
    readabilityLabel: string;
    suggestions: string[];
    improvedText: string;
  } | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);

  const handleFollowUp = useCallback(async () => {
    if (!isFilled) return;
    Haptics.selectionAsync();
    setIsFollowingUp(true);
    setFollowUpQ(null);
    try {
      const res = await fetch(`${API_BASE}/ai/follow-up-question`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookTitle: book.title,
          genre: book.genre,
          characters: book.characters ?? [],
          chapterTitle: chapter.title,
          sectionType: section.type,
          prompt: section.prompt,
          answer: section.content,
          language,
        }),
      });
      if (!res.ok) throw new Error('Server error');
      const data = (await res.json()) as { question: string };
      setFollowUpQ(data.question);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {
      Alert.alert(t('chapter.couldNotGenerateQuestion'), t('chapter.checkConnection'));
    } finally {
      setIsFollowingUp(false);
    }
  }, [book.title, book.genre, book.characters, chapter.title, section.type, section.prompt, section.content, isFilled]);

  const handleAnalyzeWriting = useCallback(async () => {
    if (!isFilled) return;
    Haptics.selectionAsync();
    setIsAnalyzing(true);
    setAnalysisError(null);
    setWritingAnalysis(null);
    try {
      const res = await fetch(`${API_BASE}/writing/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: section.content,
          sectionType: section.type,
          bookTitle: book.title,
          genre: book.genre,
          language,
        }),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(data.error ?? 'Server error');
      }
      const data = await res.json() as {
        tone: string;
        readabilityScore: number;
        readabilityLabel: string;
        suggestions: string[];
        improvedText: string;
      };
      setWritingAnalysis(data);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (err) {
      const e = err as { message?: string };
      setAnalysisError(e.message ?? 'Could not analyze writing. Please try again.');
    } finally {
      setIsAnalyzing(false);
    }
  }, [section.content, section.type, book.title, book.genre, language, isFilled]);

  const handleUseFollowUpAsPrompt = useCallback(() => {
    if (!followUpQ) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    addSection(bookId, chapterId, section.type, followUpQ);
    setFollowUpQ(null);
  }, [followUpQ, bookId, chapterId, section.type, addSection]);

  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editText, setEditText] = useState('');
  const [showWriteBox, setShowWriteBox] = useState(false);
  const [writeText, setWriteText] = useState('');

  const [editSelection, setEditSelection] = useState({ start: 0, end: 0 });
  const [inlineThesaurusVisible, setInlineThesaurusVisible] = useState(false);
  const [inlineThesaurusWord, setInlineThesaurusWord] = useState('');
  const [inlineThesaurusSelection, setInlineThesaurusSelection] = useState({ start: 0, end: 0 });

  const handleChange = useCallback(
    (text: string) => {
      updateSection(bookId, chapterId, section.id, text);
    },
    [bookId, chapterId, section.id, updateSection]
  );

  const handleApplyImprovedText = useCallback(() => {
    if (!writingAnalysis) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    handleChange(writingAnalysis.improvedText);
    setWritingAnalysis(null);
  }, [writingAnalysis, handleChange]);

  const handleTapParagraph = useCallback(
    (index: number, text: string) => {
      Haptics.selectionAsync();
      setEditingIndex(index);
      setEditText(text);
      setShowWriteBox(false);
      setTimeout(() => editInputRef.current?.focus(), 80);
    },
    []
  );

  const handleApplyEdit = useCallback(() => {
    if (editingIndex === null) return;
    const next = editText.trim();
    const updated = paragraphs.map((p, i) => (i === editingIndex ? next : p)).filter(Boolean);
    handleChange(updated.join('\n\n'));
    setEditingIndex(null);
    setEditText('');
    Keyboard.dismiss();
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, [editingIndex, editText, paragraphs, handleChange]);

  const handleCancelEdit = useCallback(() => {
    setEditingIndex(null);
    setEditText('');
    Keyboard.dismiss();
  }, []);

  const handleAppendWrite = useCallback(() => {
    const addition = writeText.trim();
    if (!addition) return;
    const sep = section.content.trim().length > 0 ? '\n\n' : '';
    handleChange(`${section.content}${sep}${addition}`);
    setWriteText('');
    setShowWriteBox(false);
    Keyboard.dismiss();
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, [writeText, section.content, handleChange]);

  const handleSuggest = useCallback(async () => {
    if (!supportsAISuggest) return;
    Haptics.selectionAsync();
    setIsSuggesting(true);
    setSuggestError(null);
    try {
      const response = await fetch(`${API_BASE}/ai/section-suggest`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookTitle: book.title,
          genre: book.genre,
          bookDescription: book.description,
          chapterTitle: chapter.title,
          chapterNumber: chapter.number,
          sectionType: section.type,
          currentText: section.content,
          language,
        }),
      });
      if (!response.ok) {
        const data = (await response.json().catch(() => ({}))) as { error?: string };
        throw new Error(data.error ?? 'Server error');
      }
      const data = (await response.json()) as { suggestions: string[] };
      setSuggestions(data.suggestions);
    } catch (err) {
      const e = err as { message?: string };
      setSuggestError(e.message ?? 'Could not load suggestions.');
    } finally {
      setIsSuggesting(false);
    }
  }, [
    book.title,
    book.genre,
    book.description,
    chapter.title,
    chapter.number,
    section.type,
    section.content,
    supportsAISuggest,
  ]);

  const handleInsertSuggestion = useCallback(
    (text: string) => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      const sep = section.content.trim().length > 0 ? '\n\n' : '';
      handleChange(`${section.content}${sep}${text}`);
      setSuggestions((prev) => prev.filter((s) => s !== text));
    },
    [section.content, handleChange]
  );

  const extractWordAtSelection = useCallback(
    (text: string, start: number, end: number): string => {
      if (start !== end) return text.slice(start, end).trim().replace(/\W+$/, '');
      let l = start;
      let r = start;
      while (l > 0 && /\w/.test(text[l - 1] ?? '')) l--;
      while (r < text.length && /\w/.test(text[r] ?? '')) r++;
      return text.slice(l, r);
    },
    []
  );

  const handleOpenInlineThesaurus = useCallback(() => {
    Haptics.selectionAsync();
    const word = extractWordAtSelection(editText, editSelection.start, editSelection.end);
    if (!word) return;
    setInlineThesaurusWord(word);
    setInlineThesaurusSelection(editSelection);
    setInlineThesaurusVisible(true);
  }, [editText, editSelection, extractWordAtSelection]);

  const handleSynonymSelect = useCallback(
    (synonym: string) => {
      const { start, end } = inlineThesaurusSelection;
      let l = start;
      let r = end;
      if (l === r) {
        while (l > 0 && /\w/.test(editText[l - 1] ?? '')) l--;
        while (r < editText.length && /\w/.test(editText[r] ?? '')) r++;
      }
      setEditText(editText.slice(0, l) + synonym + editText.slice(r));
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    },
    [editText, inlineThesaurusSelection]
  );

  const isEditing = editingIndex !== null;

  return (
    <View
      style={[
        styles.sectionCard,
        {
          backgroundColor: colors.card,
          borderColor: colors.border,
          borderLeftColor: meta.color,
          borderLeftWidth: 3,
        },
      ]}
    >
      <View style={styles.sectionHeader}>
        <View style={[styles.typeBadge, { backgroundColor: meta.color + '18' }]}>
          <Text style={[styles.typeLabel, { color: meta.color }]}>
            {t(`chapter.sectionTypes.${section.type}`)}
          </Text>
        </View>
        <TouchableOpacity
          onPress={onDelete}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Feather name="x" size={14} color={colors.mutedForeground} />
        </TouchableOpacity>
      </View>

      <View style={styles.promptRow}>
        <Text style={[styles.promptText, { color: colors.mutedForeground, flex: 1 }]}>
          {section.prompt}
        </Text>
        <TouchableOpacity
          onPress={handleRefreshPrompt}
          disabled={isRefreshingPrompt}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          style={[styles.refreshPromptBtn, { opacity: isRefreshingPrompt ? 0.5 : 1 }]}
        >
          {isRefreshingPrompt ? (
            <ActivityIndicator size="small" color={meta.color} style={{ width: 16, height: 16 }} />
          ) : (
            <Feather name="refresh-cw" size={13} color={meta.color} />
          )}
        </TouchableOpacity>
      </View>

      {/* First-use tip: inline editor — only on the first section */}
      {paragraphs.length > 0 && isFirstSection && tipControls && !tipControls.isTipSeen('inline_editor') && (
        <CoachMark
          icon="edit-2"
          title="Tap to edit inline"
          body="Tap any paragraph block to open the inline editor. You can also select a word and use the Thesaurus to swap it instantly."
          onDismiss={() => tipControls.dismissTip('inline_editor')}
        />
      )}

      {/* Paragraph blocks — tap to edit */}
      {paragraphs.length > 0 && (
        <View style={styles.paragraphList}>
          {paragraphs.map((para, index) => {
            const active = editingIndex === index;
            return (
              <TouchableOpacity
                key={`${section.id}-p${index}`}
                activeOpacity={0.75}
                onPress={() => handleTapParagraph(index, para)}
                style={[
                  styles.paragraphBlock,
                  {
                    borderColor: active ? meta.color : colors.border,
                    backgroundColor: active ? meta.color + '10' : colors.background,
                  },
                ]}
              >
                {paragraphs.length > 1 && (
                  <Text style={[styles.paragraphNum, { color: meta.color }]}>
                    ¶{index + 1}
                  </Text>
                )}
                <Text style={[styles.paragraphText, { color: colors.foreground }, dialogueStyleProps]}>
                  {para}
                </Text>
                {!active && (
                  <Feather
                    name="edit-2"
                    size={10}
                    color={meta.color + '88'}
                    style={styles.paragraphEditIcon}
                  />
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      )}

      {/* Inline editor — shown when a paragraph is tapped, or write box open */}
      {isEditing && (
        <View
          style={[
            styles.inlineEditor,
            { borderColor: meta.color, backgroundColor: colors.background },
          ]}
        >
          <View style={styles.inlineEditorHeader}>
            <Feather name="edit-2" size={12} color={meta.color} />
            <Text style={[styles.inlineEditorLabel, { color: meta.color }]}>
              Editing paragraph {(editingIndex ?? 0) + 1}
            </Text>
            <TouchableOpacity
              onPress={handleOpenInlineThesaurus}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              style={[styles.thesaurusBtn, { backgroundColor: meta.color + '18' }]}
            >
              <Feather name="book" size={12} color={meta.color} />
              <Text style={[styles.thesaurusBtnText, { color: meta.color }]}>Thesaurus</Text>
            </TouchableOpacity>
          </View>
          {/* First-use tip: thesaurus — only on first section, after inline_editor is dismissed */}
          {isFirstSection && tipControls && tipControls.isTipSeen('inline_editor') && !tipControls.isTipSeen('thesaurus') && (
            <CoachMark
              icon="book"
              title="Thesaurus at your fingertips"
              body="Select a word in the editor above, then tap Thesaurus to instantly find and replace it with a synonym."
              onDismiss={() => tipControls.dismissTip('thesaurus')}
            />
          )}
          <TextInput
            ref={editInputRef}
            style={[styles.contentInput, { color: colors.foreground }, dialogueStyleProps]}
            value={editText}
            onChangeText={setEditText}
            onSelectionChange={(e) => setEditSelection(e.nativeEvent.selection)}
            multiline
            textAlignVertical="top"
            autoFocus
          />
          <View style={styles.inlineEditorActions}>
            <TouchableOpacity
              onPress={handleCancelEdit}
              style={[styles.inlineEditorBtn, { borderColor: colors.border }]}
            >
              <Text style={[styles.inlineEditorBtnText, { color: colors.mutedForeground }]}>
                Cancel
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleApplyEdit}
              style={[styles.inlineEditorBtn, { backgroundColor: meta.color, borderColor: meta.color }]}
            >
              <Feather name="check" size={13} color="#fff" />
              <Text style={[styles.inlineEditorBtnText, { color: '#fff' }]}>
                Apply
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      <ThesaurusModal
        visible={inlineThesaurusVisible}
        onClose={() => setInlineThesaurusVisible(false)}
        prefilledWord={inlineThesaurusWord}
        onSelectSynonym={handleSynonymSelect}
      />

      {/* Write / Append box — shown when content is empty, or user taps + Write More */}
      {!isEditing && (
        <>
          {!isFilled ? (
            <TextInput
              style={[styles.contentInput, { color: colors.foreground }, dialogueStyleProps]}
              placeholder="Write your response here..."
              placeholderTextColor={colors.mutedForeground}
              value={section.content}
              onChangeText={handleChange}
              multiline
              textAlignVertical="top"
            />
          ) : showWriteBox ? (
            <View
              style={[
                styles.inlineEditor,
                { borderColor: colors.border, backgroundColor: colors.background },
              ]}
            >
              <View style={styles.inlineEditorHeader}>
                <Feather name="plus" size={12} color={meta.color} />
                <Text style={[styles.inlineEditorLabel, { color: meta.color }]}>
                  Append new paragraph
                </Text>
              </View>
              <TextInput
                style={[styles.contentInput, { color: colors.foreground }]}
                placeholder="Continue writing…"
                placeholderTextColor={colors.mutedForeground}
                value={writeText}
                onChangeText={setWriteText}
                multiline
                textAlignVertical="top"
                autoFocus
              />
              <View style={styles.inlineEditorActions}>
                <TouchableOpacity
                  onPress={() => { setShowWriteBox(false); setWriteText(''); Keyboard.dismiss(); }}
                  style={[styles.inlineEditorBtn, { borderColor: colors.border }]}
                >
                  <Text style={[styles.inlineEditorBtnText, { color: colors.mutedForeground }]}>
                    Cancel
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={handleAppendWrite}
                  style={[styles.inlineEditorBtn, { backgroundColor: meta.color, borderColor: meta.color }]}
                >
                  <Feather name="check" size={13} color="#fff" />
                  <Text style={[styles.inlineEditorBtnText, { color: '#fff' }]}>
                    Add
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <TouchableOpacity
              onPress={() => { Haptics.selectionAsync(); setShowWriteBox(true); }}
              activeOpacity={0.8}
              style={[styles.writeMoreBtn, { borderColor: meta.color + '60' }]}
            >
              <Feather name="plus" size={13} color={meta.color} />
              <Text style={[styles.writeMoreBtnText, { color: meta.color }]}>
                Write more
              </Text>
            </TouchableOpacity>
          )}
        </>
      )}

      {wordCount > 0 && !isEditing && (
        <Text style={[styles.wordCount, { color: colors.mutedForeground }]}>
          {wordCount} {wordCount === 1 ? 'word' : 'words'}
        </Text>
      )}

      {supportsAISuggest && (
        <View style={styles.suggestBlock}>
          {/* First-use tip: AI suggestions */}
          {tipControls && !tipControls.isTipSeen('ai_suggest') && (
            <CoachMark
              icon="zap"
              title="AI-powered suggestions"
              body="Tap the button below to get AI suggestions for characters or world-building details. Tap any suggestion to add it straight to this section."
              onDismiss={() => tipControls.dismissTip('ai_suggest')}
            />
          )}
          <TouchableOpacity
            onPress={handleSuggest}
            disabled={isSuggesting}
            activeOpacity={0.85}
            style={[
              styles.suggestBtn,
              {
                borderColor: meta.color,
                backgroundColor: meta.color + '14',
                opacity: isSuggesting ? 0.7 : 1,
              },
            ]}
          >
            {isSuggesting ? (
              <ActivityIndicator size="small" color={meta.color} />
            ) : (
              <Feather name="zap" size={13} color={meta.color} />
            )}
            <Text style={[styles.suggestBtnText, { color: meta.color }]}>
              {isSuggesting
                ? 'Researching storycraft...'
                : suggestions.length > 0
                ? 'Get more suggestions'
                : section.type === 'character'
                ? 'Ask AI for character suggestions'
                : 'Ask AI for world suggestions'}
            </Text>
          </TouchableOpacity>

          {suggestError && (
            <Text style={[styles.suggestError, { color: '#DC2626' }]}>
              {suggestError}
            </Text>
          )}

          {suggestions.map((s, i) => (
            <TouchableOpacity
              key={`${i}-${s.slice(0, 20)}`}
              onPress={() => handleInsertSuggestion(s)}
              activeOpacity={0.85}
              style={[
                styles.suggestCard,
                { backgroundColor: colors.background, borderColor: colors.border },
              ]}
            >
              <View style={styles.suggestCardRow}>
                <Text style={[styles.suggestBullet, { color: meta.color }]}>•</Text>
                <Text
                  style={[styles.suggestCardText, { color: colors.foreground }]}
                >
                  {s}
                </Text>
              </View>
              <View style={styles.suggestCardFooter}>
                <Feather name="plus-circle" size={12} color={meta.color} />
                <Text style={[styles.suggestCardCta, { color: meta.color }]}>
                  Tap to add to section
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {isFilled && !isEditing && (
        <View style={styles.followUpBlock}>
          <TouchableOpacity
            onPress={handleFollowUp}
            disabled={isFollowingUp}
            activeOpacity={0.85}
            style={[
              styles.followUpBtn,
              { borderColor: colors.accent + '80', backgroundColor: colors.accent + '10', opacity: isFollowingUp ? 0.7 : 1 },
            ]}
          >
            {isFollowingUp ? (
              <ActivityIndicator size="small" color={colors.accent} />
            ) : (
              <Feather name="message-circle" size={13} color={colors.accent} />
            )}
            <Text style={[styles.followUpBtnText, { color: colors.accent }]}>
              {isFollowingUp ? 'Thinking of a follow-up...' : 'Ask a follow-up question'}
            </Text>
          </TouchableOpacity>

          {followUpQ && (
            <View style={[styles.followUpCard, { backgroundColor: colors.background, borderColor: colors.accent + '50' }]}>
              <Text style={[styles.followUpCardLabel, { color: colors.accent }]}>✦ Follow-up</Text>
              <Text style={[styles.followUpCardQ, { color: colors.foreground }]}>{followUpQ}</Text>
              <View style={styles.followUpCardActions}>
                <TouchableOpacity
                  onPress={handleUseFollowUpAsPrompt}
                  style={[styles.followUpUseBtn, { backgroundColor: colors.accent }]}
                  activeOpacity={0.85}
                >
                  <Feather name="plus" size={12} color="#fff" />
                  <Text style={styles.followUpUseBtnText}>Use as new prompt</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => setFollowUpQ(null)}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Text style={[styles.followUpDismiss, { color: colors.mutedForeground }]}>Dismiss</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>
      )}

      {/* Writing assistant — Polish button + analysis panel */}
      {isFilled && !isEditing && (
        <View style={styles.writingAssistantBlock}>
          <TouchableOpacity
            onPress={handleAnalyzeWriting}
            disabled={isAnalyzing}
            activeOpacity={0.85}
            style={[
              styles.polishBtn,
              { borderColor: '#8B5CF6', backgroundColor: '#8B5CF610', opacity: isAnalyzing ? 0.7 : 1 },
            ]}
          >
            {isAnalyzing ? (
              <ActivityIndicator size="small" color="#8B5CF6" />
            ) : (
              <Feather name="edit-3" size={13} color="#8B5CF6" />
            )}
            <Text style={[styles.polishBtnText, { color: '#8B5CF6' }]}>
              {isAnalyzing ? 'Polishing your prose…' : writingAnalysis ? 'Re-analyse' : '✦ Polish writing'}
            </Text>
          </TouchableOpacity>

          {analysisError && (
            <Text style={[styles.suggestError, { color: '#DC2626' }]}>{analysisError}</Text>
          )}

          {writingAnalysis && (
            <View style={[styles.analysisCard, { backgroundColor: colors.card, borderColor: '#8B5CF640' }]}>
              {/* Tone + readability row */}
              <View style={styles.analysisMeta}>
                <View style={[styles.toneBadge, { backgroundColor: '#8B5CF620' }]}>
                  <Text style={[styles.toneBadgeText, { color: '#8B5CF6' }]}>
                    {writingAnalysis.tone}
                  </Text>
                </View>
                <View style={styles.readabilityRow}>
                  <Text style={[styles.readabilityLabel, { color: colors.mutedForeground }]}>
                    Readability:
                  </Text>
                  <Text style={[styles.readabilityValue, { color: colors.foreground }]}>
                    {writingAnalysis.readabilityLabel} · {writingAnalysis.readabilityScore}/10
                  </Text>
                </View>
              </View>

              {/* Suggestions */}
              {writingAnalysis.suggestions.length > 0 && (
                <View style={styles.analysisSection}>
                  <Text style={[styles.analysisSectionLabel, { color: colors.mutedForeground }]}>
                    CRAFT NOTES
                  </Text>
                  {writingAnalysis.suggestions.map((s, i) => (
                    <View key={i} style={styles.analysisSuggestionRow}>
                      <Text style={[styles.analysisBullet, { color: '#8B5CF6' }]}>›</Text>
                      <Text style={[styles.analysisSuggestionText, { color: colors.foreground }]}>{s}</Text>
                    </View>
                  ))}
                </View>
              )}

              {/* Improved text */}
              <View style={[styles.analysisSection, { borderTopWidth: 1, borderTopColor: colors.border }]}>
                <Text style={[styles.analysisSectionLabel, { color: colors.mutedForeground }]}>
                  POLISHED VERSION
                </Text>
                <Text style={[styles.improvedText, { color: colors.foreground }]}>
                  {writingAnalysis.improvedText}
                </Text>
                <View style={styles.analysisActions}>
                  <TouchableOpacity
                    onPress={handleApplyImprovedText}
                    activeOpacity={0.85}
                    style={[styles.applyBtn, { backgroundColor: '#8B5CF6' }]}
                  >
                    <Feather name="check" size={13} color="#fff" />
                    <Text style={styles.applyBtnText}>Apply</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => setWritingAnalysis(null)}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <Text style={[styles.followUpDismiss, { color: colors.mutedForeground }]}>Discard</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          )}
        </View>
      )}
    </View>
  );
}

export default function ChapterEditorScreen() {
  const colors = useColors();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { width: screenWidth } = useWindowDimensions();
  const isTablet = screenWidth >= 768;
  const navigation = useNavigation();
  const { signOut, userId } = useAuth();
  const { chapterId, bookId } = useLocalSearchParams<{
    chapterId: string;
    bookId: string;
  }>();
  const { getBook, getChapter, updateBook, updateChapter, deleteSection, addSection, books } = useBooks();
  const { isSubscribed } = useSubscription();

  const isReturningUser = React.useMemo(
    () =>
      books.some((b) =>
        b.chapters.some((ch) => ch.sections.some((s) => s.content.trim().length > 0))
      ),
    [books],
  );

  const { isTipSeen, dismissTip } = useFirstUseTips(userId, isReturningUser);
  const tipControls: TipControls = React.useMemo(
    () => ({ isTipSeen, dismissTip }),
    [isTipSeen, dismissTip],
  );

  const { addCustomFont, asExportFonts } = useCustomFonts();
  const [addFontVisible, setAddFontVisible] = useState(false);

  const book = getBook(bookId ?? '');
  const chapter = getChapter(bookId ?? '', chapterId ?? '');
  const [addingSection, setAddingSection] = useState(false);
  const [newPrompt, setNewPrompt] = useState('');
  const [newType, setNewType] = useState<SectionType>('character');
  const [thesaurusVisible, setThesaurusVisible] = useState(false);
  const [editingChapterTitle, setEditingChapterTitle] = useState(false);
  const [chapterTitleDraft, setChapterTitleDraft] = useState('');

  const filled = useMemo(
    () =>
      chapter?.sections.filter((s) => s.content.trim().length > 0).length ?? 0,
    [chapter?.sections]
  );
  const total = chapter?.sections.length ?? 0;

  useLayoutEffect(() => {
    navigation.setOptions({
      title: chapter ? `Ch. ${chapter.number}: ${chapter.title}` : 'Chapter',
      headerRight: () => (
        <View style={styles.headerRight}>
          <TouchableOpacity
            onPress={() => {
              setChapterTitleDraft(chapter?.title ?? '');
              setEditingChapterTitle(true);
            }}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Feather name="edit-2" size={18} color={colors.primary} />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => { Haptics.selectionAsync(); signOut(); }}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Feather name="log-out" size={18} color={colors.mutedForeground} />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => { Haptics.selectionAsync(); setThesaurusVisible(true); }}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Feather name="book" size={18} color={colors.primary} />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={handleToggleComplete}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            style={{ marginRight: Platform.OS === 'web' ? 8 : 0 }}
          >
            <Feather
              name={chapter?.isComplete ? 'check-circle' : 'circle'}
              size={20}
              color={chapter?.isComplete ? colors.accent : colors.mutedForeground}
            />
          </TouchableOpacity>
        </View>
      ),
    });
  }, [navigation, chapter?.number, chapter?.title, chapter?.isComplete, colors, thesaurusVisible, signOut]);

  const handleToggleComplete = () => {
    if (!chapter) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    updateChapter(bookId ?? '', chapterId ?? '', {
      isComplete: !chapter.isComplete,
    });
  };

  const handleSaveChapterTitle = () => {
    const title = chapterTitleDraft.trim();
    if (!title) return;
    updateChapter(bookId ?? '', chapterId ?? '', { title });
    setEditingChapterTitle(false);
  };

  const handleDeleteSection = (sectionId: string) => {
    Alert.alert(t('chapter.removeSection'), t('chapter.removeSectionConfirm'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('chapter.remove'),
        style: 'destructive',
        onPress: () => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          deleteSection(bookId ?? '', chapterId ?? '', sectionId);
        },
      },
    ]);
  };

  const handleAddSection = () => {
    const prompt = newPrompt.trim() || t(`chapter.defaultPrompts.${newType}`);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    addSection(bookId ?? '', chapterId ?? '', newType, prompt);
    setNewPrompt('');
    setAddingSection(false);
    setNewType('character');
  };

  const handlePickType = (t: SectionType) => {
    Haptics.selectionAsync();
    setNewType(t);
    if (!newPrompt.trim()) {
      setNewPrompt('');
    }
  };

  if (!chapter || !book) {
    return (
      <View style={[styles.notFound, { backgroundColor: colors.background }]}>
        <Text style={[styles.notFoundText, { color: colors.mutedForeground }]}>
          Chapter not found
        </Text>
      </View>
    );
  }

  const bookFmt = book.formatSettings ?? { titleAlignment: 'center' as const, chapterTitleAlignment: 'left' as const, pageNumbers: 'none' as const };

  const bottomPadding =
    (Platform.OS === 'web' ? 34 : insets.bottom) + 24;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: bottomPadding, paddingHorizontal: isTablet ? Math.max(16, (screenWidth - 720) / 2) : 16 },
        ]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Chapter title */}
        <View style={styles.chapterTitleRow}>
          <Text
            style={[styles.chapterTitleText, { color: colors.foreground }]}
          >
            {chapter.title}
          </Text>
          {chapter.isComplete && (
            <View
              style={[styles.completeBadge, { backgroundColor: colors.accent }]}
            >
              <Text style={styles.completeText}>Complete</Text>
            </View>
          )}
        </View>

        {editingChapterTitle && (
          <View style={[styles.renameCard, { borderColor: colors.border, backgroundColor: colors.card }]}>
            <TextInput
              value={chapterTitleDraft}
              onChangeText={setChapterTitleDraft}
              placeholder="Chapter title"
              placeholderTextColor={colors.mutedForeground}
              style={[styles.renameInput, { color: colors.foreground, borderColor: colors.border }]}
              autoFocus
            />
            <View style={styles.renameActions}>
              <TouchableOpacity onPress={() => setEditingChapterTitle(false)}>
                <Text style={[styles.renameCancel, { color: colors.mutedForeground }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleSaveChapterTitle} disabled={!chapterTitleDraft.trim()}>
                <Text style={[styles.renameSave, { color: colors.primary }]}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Progress bar */}
        <View style={styles.progressRow}>
          <View
            style={[styles.progressTrack, { backgroundColor: colors.border }]}
          >
            <View
              style={[
                styles.progressFill,
                {
                  backgroundColor:
                    filled === total && total > 0
                      ? colors.accent
                      : colors.primary,
                  width: total > 0 ? `${(filled / total) * 100}%` : '0%',
                },
              ]}
            />
          </View>
          <Text style={[styles.progressLabel, { color: colors.mutedForeground }]}>
            {filled}/{total}
          </Text>
        </View>

        {/* AI Write + Comic Panel buttons */}
        <View style={styles.aiButtonRow}>
          <TouchableOpacity
            style={[styles.aiButton, styles.aiButtonFlex, { backgroundColor: colors.primary }]}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              router.push({
                pathname: '/chapter-ai/[chapterId]',
                params: { chapterId: chapterId ?? '', bookId: bookId ?? '' },
              });
            }}
            activeOpacity={0.85}
          >
            <Feather name="feather" size={16} color={colors.primaryForeground} />
            <Text style={[styles.aiButtonText, { color: colors.primaryForeground }]}>
              Write with AI
            </Text>
            {isSubscribed ? (
              <View style={[styles.aiButtonBadge, { backgroundColor: colors.accent }]}>
                <Text style={styles.aiButtonBadgeText}>PRO</Text>
              </View>
            ) : (
              <View style={[styles.aiButtonBadge, { backgroundColor: '#00000033' }]}>
                <Feather name="lock" size={9} color="#fff" />
              </View>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.aiButton, styles.aiButtonPanel, { backgroundColor: colors.card, borderColor: colors.border }]}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              const sectionText = chapter.sections
                .filter((s) => s.content?.trim())
                .map((s) => s.content)
                .join(' ')
                .slice(0, 400);
              router.push({
                pathname: '/comic-panel',
                params: { sectionText },
              });
            }}
            activeOpacity={0.85}
          >
            <Feather name="grid" size={16} color={colors.primary} />
            <Text style={[styles.aiButtonText, { color: colors.primary }]}>Panel</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.aiButton, styles.aiButtonPanel, { backgroundColor: colors.card, borderColor: colors.border }]}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.push('/character-genesis' as never);
            }}
            activeOpacity={0.85}
          >
            <Feather name="user" size={16} color={colors.primary} />
            <Text style={[styles.aiButtonText, { color: colors.primary }]}>Character</Text>
          </TouchableOpacity>
        </View>

        {/* First-use tip: Write with AI */}
        {!isTipSeen('ai_write') && (
          <CoachMark
            icon="feather"
            title="Generate a full chapter draft with AI"
            body={`Tap Write with AI to get a complete draft based on your ${getWorkLabel(book?.genre)}'s genre, characters, and section prompts. Edit it section by section after.`}
            onDismiss={() => dismissTip('ai_write')}
          />
        )}

        {book.characters && book.characters.length > 0 && (
          <View style={[styles.castBar, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Feather name="users" size={12} color={colors.mutedForeground} />
            <Text style={[styles.castLabel, { color: colors.mutedForeground }]}>Cast:</Text>
            {book.characters.map((c) => (
              <View key={c.id} style={[styles.castChip, { backgroundColor: colors.primary + '14', borderColor: colors.primary + '30' }]}>
                <Text style={[styles.castChipText, { color: colors.primary }]}>{c.name}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Title Font picker */}
        <View style={[styles.fontBar, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.fontBarHeader}>
            <Feather name="type" size={11} color={colors.mutedForeground} />
            <Text style={[styles.fontBarLabel, { color: colors.mutedForeground }]}>TITLE FONT</Text>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.fontBarChips}>
            {[...HEADING_FONT_OPTIONS, ...asExportFonts()].map(f => {
              const selected = f.id === (book.headingFontId ?? DEFAULT_HEADING_FONT_ID);
              return (
                <TouchableOpacity
                  key={f.id}
                  onPress={() => { Haptics.selectionAsync(); updateBook(bookId ?? '', { headingFontId: f.id }); }}
                  style={[
                    styles.fontBarChip,
                    {
                      borderColor: selected ? colors.primary : colors.border,
                      backgroundColor: selected ? colors.primary + '18' : 'transparent',
                    },
                  ]}
                >
                  <Text style={[styles.fontBarChipText, { color: selected ? colors.primary : colors.mutedForeground, fontFamily: f.family }]}>
                    {f.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
            <TouchableOpacity
              onPress={() => { Haptics.selectionAsync(); setAddFontVisible(true); }}
              style={[styles.fontBarChip, { borderColor: colors.primary, borderStyle: 'dashed', flexDirection: 'row', alignItems: 'center', gap: 4 }]}
            >
              <Feather name="plus" size={12} color={colors.primary} />
              <Text style={[styles.fontBarChipText, { color: colors.primary }]}>Add</Text>
            </TouchableOpacity>
          </ScrollView>
          <View style={[styles.sizeBarDivider, { backgroundColor: colors.border }]} />
          {([
            { key: 'titleFontSize' as const, label: 'TITLE SIZE', def: 32, min: 18, max: 52 },
            { key: 'chapterTitleFontSize' as const, label: 'CHAPTER SIZE', def: 22, min: 14, max: 38 },
            { key: 'authorFontSize' as const, label: 'AUTHOR SIZE', def: 16, min: 10, max: 28 },
          ]).map(({ key, label, def, min, max }) => {
            const current = bookFmt[key] ?? def;
            return (
              <View key={key} style={styles.sizeRow}>
                <Text style={[styles.sizeLabel, { color: colors.mutedForeground }]}>{label}</Text>
                <View style={styles.sizeStepper}>
                  <TouchableOpacity
                    onPress={() => { Haptics.selectionAsync(); updateBook(bookId ?? '', { formatSettings: { ...bookFmt, [key]: Math.max(min, current - 2) } }); }}
                    style={[styles.sizeBtn, { borderColor: current <= min ? colors.border + '60' : colors.border, backgroundColor: colors.background }]}
                    disabled={current <= min}
                  >
                    <Text style={[styles.sizeBtnText, { color: current <= min ? colors.mutedForeground : colors.foreground }]}>−</Text>
                  </TouchableOpacity>
                  <Text style={[styles.sizeValue, { color: colors.foreground }]}>{current}</Text>
                  <TouchableOpacity
                    onPress={() => { Haptics.selectionAsync(); updateBook(bookId ?? '', { formatSettings: { ...bookFmt, [key]: Math.min(max, current + 2) } }); }}
                    style={[styles.sizeBtn, { borderColor: current >= max ? colors.border + '60' : colors.border, backgroundColor: colors.background }]}
                    disabled={current >= max}
                  >
                    <Text style={[styles.sizeBtnText, { color: current >= max ? colors.mutedForeground : colors.foreground }]}>+</Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          })}
        </View>

        <Text style={[styles.guidedLabel, { color: colors.mutedForeground }]}>
          GUIDED SECTIONS — answer each prompt to build your chapter
        </Text>

        {/* Sections */}
        {chapter.sections.map((section, idx) => (
          <SectionCard
            key={section.id}
            section={section}
            bookId={bookId ?? ''}
            chapterId={chapterId ?? ''}
            book={book}
            chapter={chapter}
            onDelete={() => handleDeleteSection(section.id)}
            tipControls={tipControls}
            isFirstSection={idx === 0}
          />
        ))}

        {/* Add custom section */}
        {addingSection ? (
          <View
            style={[
              styles.addSectionForm,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}
          >
            <Text style={[styles.addFormLabel, { color: colors.mutedForeground }]}>
              {t('chapter.sectionTypeLabel')}
            </Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.typeRow}
            >
              {SECTION_TYPE_OPTIONS.map((sType) => {
                const m = SECTION_TYPE_META[sType];
                const selected = sType === newType;
                return (
                  <TouchableOpacity
                    key={sType}
                    onPress={() => handlePickType(sType)}
                    style={[
                      styles.typePill,
                      {
                        backgroundColor: selected ? m.color : m.color + '18',
                        borderColor: m.color,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.typePillText,
                        { color: selected ? '#fff' : m.color },
                      ]}
                    >
                      {t(`chapter.sectionTypes.${sType}`)}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            <Text style={[styles.addFormLabel, { color: colors.mutedForeground }]}>
              {t('chapter.writingPromptLabel')}
            </Text>
            <TextInput
              style={[
                styles.promptInput,
                { color: colors.foreground, borderColor: colors.border },
              ]}
              placeholder={t(`chapter.defaultPrompts.${newType}`)}
              placeholderTextColor={colors.mutedForeground}
              value={newPrompt}
              onChangeText={setNewPrompt}
              multiline
              autoFocus
              textAlignVertical="top"
            />
            <Text style={[styles.addFormHelp, { color: colors.mutedForeground }]}>
              {t('chapter.promptHint')}
            </Text>

            <View style={styles.addSectionButtons}>
              <TouchableOpacity
                onPress={() => { setAddingSection(false); setNewPrompt(''); }}
                style={[styles.cancelBtn, { borderColor: colors.border }]}
              >
                <Text style={[styles.cancelBtnText, { color: colors.mutedForeground }]}>
                  Cancel
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleAddSection}
                style={[styles.addBtn, { backgroundColor: colors.primary }]}
              >
                <Text style={[styles.addBtnText, { color: colors.primaryForeground }]}>
                  Add Section
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <TouchableOpacity
            style={[styles.addSectionButton, { borderColor: colors.border }]}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setAddingSection(true);
            }}
            activeOpacity={0.7}
          >
            <Feather name="plus" size={16} color={colors.primary} />
            <Text style={[styles.addSectionText, { color: colors.primary }]}>
              Add Section
            </Text>
          </TouchableOpacity>
        )}

        {/* Mark complete */}
        <TouchableOpacity
          style={[
            styles.completeButton,
            {
              backgroundColor: chapter.isComplete ? colors.accent : colors.secondary,
              borderColor: chapter.isComplete ? colors.accent : colors.border,
            },
          ]}
          onPress={handleToggleComplete}
          activeOpacity={0.85}
        >
          <Feather
            name={chapter.isComplete ? 'check-circle' : 'circle'}
            size={18}
            color={chapter.isComplete ? '#fff' : colors.mutedForeground}
          />
          <Text
            style={[
              styles.completeButtonText,
              { color: chapter.isComplete ? '#fff' : colors.mutedForeground },
            ]}
          >
            {chapter.isComplete ? 'Chapter Complete' : 'Mark Chapter as Complete'}
          </Text>
        </TouchableOpacity>
      </ScrollView>

      <ThesaurusModal
        visible={thesaurusVisible}
        onClose={() => setThesaurusVisible(false)}
      />
      <AddFontModal
        visible={addFontVisible}
        onClose={() => setAddFontVisible(false)}
        onAdd={async (label, family, fontUrl) => {
          await addCustomFont(label, family, fontUrl);
          updateBook(bookId ?? '', { headingFontId: `custom-${label.toLowerCase().replace(/\s+/g, '-')}` });
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  notFound: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  notFoundText: { fontSize: 16, fontFamily: 'Inter_400Regular' },
  fontBar: { borderWidth: 1, borderRadius: 12, padding: 10, gap: 8 },
  fontBarHeader: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  fontBarLabel: { fontSize: 10, fontFamily: 'Inter_600SemiBold', letterSpacing: 1, textTransform: 'uppercase' },
  fontBarChips: { flexDirection: 'row', gap: 6, paddingVertical: 2 },
  fontBarChip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999, borderWidth: 1 },
  fontBarChipText: { fontSize: 13 },
  sizeBarDivider: { height: StyleSheet.hairlineWidth, marginVertical: 6 },
  sizeRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 2 },
  sizeLabel: { fontSize: 10, fontFamily: 'Inter_600SemiBold', letterSpacing: 1 },
  sizeStepper: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  sizeBtn: { width: 28, height: 28, borderRadius: 8, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  sizeBtnText: { fontSize: 18, fontFamily: 'Inter_400Regular', lineHeight: 22 },
  sizeValue: { fontSize: 14, fontFamily: 'Inter_600SemiBold', width: 28, textAlign: 'center' },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginRight: Platform.OS === 'web' ? 8 : 0,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    gap: 12,
    // paddingHorizontal overridden dynamically for tablet
  },
  chapterTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flexWrap: 'wrap',
  },
  chapterTitleText: {
    fontSize: 24,
    fontFamily: 'Inter_700Bold',
    letterSpacing: -0.3,
    flex: 1,
  },
  completeBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  completeText: {
    fontSize: 11,
    fontFamily: 'Inter_600SemiBold',
    color: '#fff',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
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
    width: 30,
    textAlign: 'right',
  },
  aiButtonRow: {
    flexDirection: 'row',
    gap: 10,
  },
  aiButtonFlex: {
    flex: 1,
  },
  aiButtonPanel: {
    borderWidth: 1.5,
    paddingHorizontal: 18,
  },
  aiButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 14,
  },
  aiButtonText: {
    fontSize: 16,
    fontFamily: 'Inter_600SemiBold',
  },
  aiButtonBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    marginLeft: 2,
  },
  aiButtonBadgeText: {
    fontSize: 9,
    fontFamily: 'Inter_700Bold',
    color: '#fff',
    letterSpacing: 0.5,
  },
  guidedLabel: {
    fontSize: 10,
    fontFamily: 'Inter_600SemiBold',
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  sectionCard: {
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    gap: 10,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  typeBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  typeLabel: {
    fontSize: 11,
    fontFamily: 'Inter_600SemiBold',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  promptText: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    fontStyle: 'italic',
    lineHeight: 20,
  },
  contentInput: {
    fontSize: 15,
    fontFamily: 'Inter_400Regular',
    lineHeight: 23,
    minHeight: 80,
  },
  paragraphList: {
    gap: 6,
  },
  paragraphBlock: {
    borderRadius: 8,
    borderWidth: 1,
    padding: 10,
    gap: 4,
    position: 'relative',
  },
  paragraphNum: {
    fontSize: 10,
    fontFamily: 'Inter_600SemiBold',
    letterSpacing: 0.4,
    marginBottom: 2,
  },
  paragraphText: {
    fontSize: 15,
    fontFamily: 'Inter_400Regular',
    lineHeight: 22,
    paddingRight: 18,
  },
  paragraphEditIcon: {
    position: 'absolute',
    bottom: 10,
    right: 10,
  },
  inlineEditor: {
    borderRadius: 10,
    borderWidth: 1.5,
    padding: 12,
    gap: 10,
  },
  inlineEditorHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    justifyContent: 'space-between',
  },
  inlineEditorLabel: {
    fontSize: 11,
    fontFamily: 'Inter_600SemiBold',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    flex: 1,
  },
  thesaurusBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  thesaurusBtnText: {
    fontSize: 11,
    fontFamily: 'Inter_600SemiBold',
  },
  inlineEditorActions: {
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'flex-end',
  },
  inlineEditorBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  inlineEditorBtnText: {
    fontSize: 13,
    fontFamily: 'Inter_600SemiBold',
  },
  writeMoreBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 9,
    paddingHorizontal: 14,
    borderRadius: 20,
    borderWidth: 1,
    alignSelf: 'flex-start',
    borderStyle: 'dashed',
  },
  writeMoreBtnText: {
    fontSize: 13,
    fontFamily: 'Inter_500Medium',
  },
  wordCount: {
    fontSize: 11,
    fontFamily: 'Inter_400Regular',
    textAlign: 'right',
  },
  addSectionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1.5,
    borderStyle: 'dashed',
  },
  addSectionText: {
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
  },
  addSectionForm: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 16,
    gap: 12,
  },
  addFormLabel: {
    fontSize: 10,
    fontFamily: 'Inter_600SemiBold',
    letterSpacing: 0.8,
  },
  typeRow: {
    flexDirection: 'row',
    gap: 8,
    paddingVertical: 4,
  },
  typePill: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1.5,
  },
  typePillText: {
    fontSize: 12,
    fontFamily: 'Inter_600SemiBold',
  },
  promptInput: {
    borderRadius: 10,
    borderWidth: 1,
    padding: 12,
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    lineHeight: 20,
    minHeight: 72,
  },
  addSectionButtons: {
    flexDirection: 'row',
    gap: 10,
    justifyContent: 'flex-end',
  },
  cancelBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
  },
  cancelBtnText: {
    fontSize: 14,
    fontFamily: 'Inter_500Medium',
  },
  addBtn: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  addBtnText: {
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
  },
  addFormHelp: {
    fontSize: 11,
    fontFamily: 'Inter_400Regular',
    fontStyle: 'italic',
  },
  suggestBlock: {
    gap: 10,
    marginTop: 4,
  },
  suggestBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 10,
    borderWidth: 1,
  },
  suggestBtnText: {
    fontSize: 13,
    fontFamily: 'Inter_600SemiBold',
  },
  suggestError: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
  },
  suggestCard: {
    borderRadius: 10,
    borderWidth: 1,
    padding: 12,
    gap: 8,
  },
  suggestCardRow: {
    flexDirection: 'row',
    gap: 8,
  },
  suggestBullet: {
    fontSize: 16,
    lineHeight: 19,
    fontFamily: 'Inter_600SemiBold',
  },
  suggestCardText: {
    flex: 1,
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    lineHeight: 19,
  },
  suggestCardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  suggestCardCta: {
    fontSize: 11,
    fontFamily: 'Inter_600SemiBold',
    letterSpacing: 0.2,
  },
  completeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 16,
    borderRadius: 30,
    borderWidth: 1,
    marginTop: 8,
  },
  completeButtonText: {
    fontSize: 15,
    fontFamily: 'Inter_600SemiBold',
  },
  renameCard: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    gap: 10,
    marginBottom: 8,
  },
  renameInput: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 15,
    fontFamily: 'Inter_400Regular',
  },
  renameActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 16,
  },
  renameCancel: {
    fontSize: 14,
    fontFamily: 'Inter_500Medium',
  },
  renameSave: {
    fontSize: 14,
    fontFamily: 'Inter_700Bold',
  },
  castBar: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 4,
  },
  castLabel: {
    fontSize: 12,
    fontFamily: 'Inter_500Medium',
  },
  castChip: {
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  castChipText: {
    fontSize: 12,
    fontFamily: 'Inter_600SemiBold',
  },
  followUpBlock: {
    gap: 10,
    marginTop: 4,
  },
  followUpBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 10,
    borderWidth: 1,
  },
  followUpBtnText: {
    fontSize: 13,
    fontFamily: 'Inter_600SemiBold',
  },
  followUpCard: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 14,
    gap: 10,
  },
  followUpCardLabel: {
    fontSize: 11,
    fontFamily: 'Inter_700Bold',
    letterSpacing: 0.5,
  },
  followUpCardQ: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    lineHeight: 20,
  },
  followUpCardActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  followUpUseBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  followUpUseBtnText: {
    fontSize: 13,
    fontFamily: 'Inter_600SemiBold',
    color: '#fff',
  },
  followUpDismiss: {
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
  },
  promptRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  refreshPromptBtn: {
    paddingTop: 1,
    width: 24,
    alignItems: 'center',
  },
  writingAssistantBlock: {
    gap: 10,
    marginTop: 4,
  },
  polishBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 10,
    borderWidth: 1,
  },
  polishBtnText: {
    fontSize: 13,
    fontFamily: 'Inter_600SemiBold',
  },
  analysisCard: {
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
  },
  analysisMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 12,
  },
  toneBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  toneBadgeText: {
    fontSize: 12,
    fontFamily: 'Inter_700Bold',
    letterSpacing: 0.3,
  },
  readabilityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    flex: 1,
  },
  readabilityLabel: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
  },
  readabilityValue: {
    fontSize: 12,
    fontFamily: 'Inter_600SemiBold',
  },
  analysisSection: {
    padding: 12,
    gap: 8,
  },
  analysisSectionLabel: {
    fontSize: 10,
    fontFamily: 'Inter_700Bold',
    letterSpacing: 0.8,
  },
  analysisSuggestionRow: {
    flexDirection: 'row',
    gap: 6,
    alignItems: 'flex-start',
  },
  analysisBullet: {
    fontSize: 16,
    fontFamily: 'Inter_700Bold',
    lineHeight: 20,
  },
  analysisSuggestionText: {
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    lineHeight: 19,
    flex: 1,
  },
  improvedText: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    lineHeight: 22,
  },
  analysisActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginTop: 4,
  },
  applyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  applyBtnText: {
    fontSize: 13,
    fontFamily: 'Inter_600SemiBold',
    color: '#fff',
  },
});
