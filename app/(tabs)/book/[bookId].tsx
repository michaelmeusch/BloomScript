import { Feather } from '@expo/vector-icons';
import { useAuth } from '@clerk/expo';
import * as DocumentPicker from 'expo-document-picker';
import { readAsStringAsync, EncodingType } from 'expo-file-system/legacy';
import * as Haptics from 'expo-haptics';
import { router, useLocalSearchParams, useNavigation } from 'expo-router';
import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import {
  Alert,
  FlatList,
  Image,
  Modal,
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

import { FirstUseTip } from '@/components/FirstUseTip';
import { AddFontModal } from '@/components/AddFontModal';
import { useBooks } from '@/context/BookContext';
import { DEFAULT_FONT_ID, DEFAULT_HEADING_FONT_ID, EXPORT_FONTS, getFontById, getFontStyleProps } from '@/constants/fonts';
import { useColors } from '@/hooks/useColors';
import { useFirstUseTip } from '@/hooks/useFirstUseTip';
import { useCustomFonts } from '@/hooks/useCustomFonts';
import { Chapter, Character, Genre, Section } from '@/types';
import { useTranslation } from 'react-i18next';

// ── Contextual unit labels: Chapters / Poems / Scenes ────────────────────────
function getUnitLabels(genre: Genre, t: (key: string) => string) {
  if (genre === 'Poem') {
    return {
      unit: 'poem',
      units: t('book.poems'),
      addUnit: t('book.addPoem'),
      addNextUnit: 'Add Next Poem',
      noUnits: t('book.noPoems'),
      noUnitsSubtitle: t('book.noPoemsSubtitle'),
      deleteUnit: t('book.deletePoem'),
      deleteUnitConfirm: t('book.deletePoemConfirm'),
      unitPlaceholder: (n: number) => t('book.poemTitlePlaceholder').replace('{{number}}', String(n)),
      isGettingLong: (n: number) => n === 1 ? '1 poem is getting long' : `${n} poems are getting long`,
      tapToReview: 'Tap to review — add or split poems',
      splitOrLabel: '— or split this poem —',
      continueInFresh: 'Continue your collection in a fresh poem',
    };
  }
  if (genre === 'Screenplay') {
    return {
      unit: 'scene',
      units: t('book.scenes'),
      addUnit: t('book.addScene'),
      addNextUnit: 'Add Next Scene',
      noUnits: t('book.noScenes'),
      noUnitsSubtitle: t('book.noScenesSubtitle'),
      deleteUnit: t('book.deleteScene'),
      deleteUnitConfirm: t('book.deleteSceneConfirm'),
      unitPlaceholder: (n: number) => t('book.sceneTitlePlaceholder').replace('{{number}}', String(n)),
      isGettingLong: (n: number) => n === 1 ? '1 scene is getting long' : `${n} scenes are getting long`,
      tapToReview: 'Tap to review — add or split scenes',
      splitOrLabel: '— or split this scene —',
      continueInFresh: 'Continue your screenplay in a fresh scene',
    };
  }
  return {
    unit: 'chapter',
    units: t('book.chapters'),
    addUnit: t('book.addChapter'),
    addNextUnit: 'Add Next Chapter',
    noUnits: t('book.noChapters'),
    noUnitsSubtitle: t('book.noChaptersSubtitle'),
    deleteUnit: t('book.deleteChapter'),
    deleteUnitConfirm: t('book.deleteChapterConfirm'),
    unitPlaceholder: (n: number) => t('book.chapterTitlePlaceholder').replace('{{number}}', String(n)),
    isGettingLong: (n: number) => n === 1 ? '1 chapter is getting long' : `${n} chapters are getting long`,
    tapToReview: 'Tap to review — add or split chapters',
    splitOrLabel: '— or split this chapter —',
    continueInFresh: 'Continue your story in a fresh chapter',
  };
}

// ── Chapter-length thresholds (matches genre-aware logic in bloom-manuscript) ─
function getChapterFlagThreshold(genre: Genre): { flagAt: number; targetWords: number; rangeLabel: string } {
  switch (genre) {
    case 'Thriller':
    case 'Mystery':
      return { flagAt: 4_500, targetWords: 2_000, rangeLabel: '1,500–3,000' };
    case 'Romance':
      return { flagAt: 5_500, targetWords: 2_500, rangeLabel: '2,000–4,000' };
    case 'Sci-Fi':
    case 'Fantasy':
    case 'Urban Fantasy':
    case "Children's Fantasy":
      return { flagAt: 8_000, targetWords: 3_500, rangeLabel: '3,000–6,000' };
    case 'Non-Fiction':
    case 'Memoir':
    case 'Biography':
    case 'Self-Help':
      return { flagAt: 9_000, targetWords: 4_000, rangeLabel: '3,000–8,000' };
    case "Children's":
      return { flagAt: 3_000, targetWords: 1_500, rangeLabel: '1,000–2,000' };
    default:
      return { flagAt: 6_000, targetWords: 2_500, rangeLabel: '2,000–5,000' };
  }
}

// Split a chapter's sections into groups targeting targetWords words each
function splitSectionsIntoGroups(sections: Section[], targetWords: number): Section[][] {
  const groups: Section[][] = [];
  let current: Section[] = [];
  let wc = 0;
  for (const s of sections) {
    const sw = s.content.split(/\s+/).filter(Boolean).length;
    if (wc > 0 && wc + sw > targetWords && current.length > 0) {
      groups.push(current);
      current = [s];
      wc = sw;
    } else {
      current.push(s);
      wc += sw;
    }
  }
  if (current.length > 0) groups.push(current);
  return groups.filter((g) => g.length > 0);
}

function ChapterCard({
  chapter,
  onPress,
  onDelete,
}: {
  chapter: Chapter;
  onPress: () => void;
  onDelete: () => void;
}) {
  const colors = useColors();
  const { t } = useTranslation();
  const filled = chapter.sections.filter(
    (s) => s.content.trim().length > 0
  ).length;
  const total = chapter.sections.length;
  const progress = total > 0 ? filled / total : 0;
  const words = chapter.sections.reduce(
    (sum, s) => sum + s.content.split(/\s+/).filter(Boolean).length,
    0
  );

  return (
    <View
      style={[
        styles.chapterCard,
        { backgroundColor: colors.card, borderColor: colors.border },
      ]}
    >
      {/* Main tap area — delete button is intentionally outside this */}
      <TouchableOpacity onPress={onPress} activeOpacity={0.85}>
        <View style={styles.chapterTop}>
          <View
            style={[
              styles.chapterNumBadge,
              { backgroundColor: colors.primary },
            ]}
          >
            <Text
              style={[styles.chapterNum, { color: colors.primaryForeground }]}
            >
              {chapter.number}
            </Text>
          </View>
          <View style={[styles.chapterTitleArea, { paddingRight: 48 }]}>
            <Text
              style={[styles.chapterTitle, { color: colors.foreground }]}
              numberOfLines={1}
            >
              {chapter.title}
            </Text>
            <Text
              style={[styles.chapterMeta, { color: colors.mutedForeground }]}
            >
              {filled}/{total} {filled === 1 && total === 1 ? t('common.section') : t('common.sections')}
              {words > 0 ? ` · ${words.toLocaleString()} ${t('common.words')}` : ''}
            </Text>
          </View>
        </View>

        <View style={[styles.chapterProgress, { backgroundColor: colors.border }]}>
          <View
            style={[
              styles.chapterProgressFill,
              {
                backgroundColor:
                  progress === 1 ? colors.accent : colors.primary,
                width: `${progress * 100}%`,
              },
            ]}
          />
        </View>
      </TouchableOpacity>

      {/* Actions sit outside the tap TouchableOpacity so they get their own touches */}
      <View style={styles.chapterActionsOverlay}>
        {chapter.isComplete && (
          <Feather name="check-circle" size={16} color={colors.accent} />
        )}
        <TouchableOpacity
          onPress={onDelete}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <Feather name="trash-2" size={15} color={colors.mutedForeground} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

export default function BookDetailScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const { width: screenWidth } = useWindowDimensions();
  const isTablet = screenWidth >= 768;
  const navigation = useNavigation();
  const { userId } = useAuth();
  const { bookId } = useLocalSearchParams<{ bookId: string }>();
  const { getBook, addChapter, insertChapterAfter, deleteChapter, updateBook, deleteBook, addCharacter, updateCharacter, deleteCharacter, splitChapter } = useBooks();

  const book = getBook(bookId ?? '');
  const unitLabels = getUnitLabels(book?.genre ?? 'Fiction', t);
  const { visible: charactersTipVisible, dismiss: dismissCharactersTip } = useFirstUseTip('tip_characters', userId);
  const [addingChapter, setAddingChapter] = useState(false);
  const [newChapterTitle, setNewChapterTitle] = useState('');
  const [editingBookTitle, setEditingBookTitle] = useState(false);
  const [bookTitleDraft, setBookTitleDraft] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const CHARACTER_ROLES = ['Protagonist', 'Antagonist', 'Supporting', 'Narrator', 'Other'];
  const { customFonts, addCustomFont, asExportFonts } = useCustomFonts();
  const [typoTarget, setTypoTarget] = useState<'dialogue' | 'heading'>('dialogue');
  const [typoPickerVisible, setTypoPickerVisible] = useState(false);
  const [addFontVisible, setAddFontVisible] = useState(false);

  // ── Long-chapter split modal + review queue ──────────────────────────────
  const [chapterSplitModal, setChapterSplitModal] = useState<{
    chapter: Chapter;
    groups: Section[][];
    words: number;
    thresholds: { flagAt: number; targetWords: number; rangeLabel: string };
  } | null>(null);
  const [splitNames, setSplitNames] = useState<string[]>([]);
  // Chapters still waiting in a bulk review session
  const [splitQueue, setSplitQueue] = useState<Chapter[]>([]);

  const [charModalVisible, setCharModalVisible] = useState(false);
  const [editingChar, setEditingChar] = useState<Character | null>(null);
  const [charName, setCharName] = useState('');
  const [charRole, setCharRole] = useState('Protagonist');

  // ── Synopsis (Screenplay only) ───────────────────────────────────────────
  const [synopsisExpanded, setSynopsisExpanded] = useState(false);
  const [synopsisDraft, setSynopsisDraft] = useState('');
  const [synopsisUploading, setSynopsisUploading] = useState(false);

  useEffect(() => {
    setSynopsisDraft(book?.synopsis ?? '');
  }, [book?.id]);

  const handleSynopsisBlur = () => {
    if (!book) return;
    updateBook(book.id, { synopsis: synopsisDraft });
  };

  const handleSynopsisUpload = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['text/plain', 'text/markdown', 'text/x-markdown'],
        copyToCacheDirectory: true,
        multiple: false,
      });
      if (result.canceled || !result.assets?.length) return;
      const asset = result.assets[0];
      const ext = (asset.name ?? '').split('.').pop()?.toLowerCase() ?? '';
      const supported = ['txt', 'md', 'text', 'markdown'];
      if (!supported.includes(ext) && !asset.mimeType?.includes('text')) {
        Alert.alert(t('book.synopsisUploadError'), t('book.synopsisUploadErrorMsg'));
        return;
      }
      setSynopsisUploading(true);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      const text = await readAsStringAsync(asset.uri, { encoding: EncodingType.UTF8 });
      setSynopsisDraft(text.trim());
      if (book) updateBook(book.id, { synopsis: text.trim() });
    } catch {
      Alert.alert(t('book.synopsisUploadError'), t('book.synopsisUploadErrorMsg'));
    } finally {
      setSynopsisUploading(false);
    }
  };

  const openAddChar = () => {
    setEditingChar(null);
    setCharName('');
    setCharRole('Protagonist');
    setCharModalVisible(true);
  };

  const openEditChar = (c: Character) => {
    setEditingChar(c);
    setCharName(c.name);
    setCharRole(c.role);
    setCharModalVisible(true);
  };

  const handleSaveChar = () => {
    const name = charName.trim();
    if (!name) return;
    if (editingChar) {
      updateCharacter(bookId ?? '', editingChar.id, { name, role: charRole });
    } else {
      addCharacter(bookId ?? '', name, charRole);
    }
    setCharModalVisible(false);
  };

  const handleDeleteChar = (c: Character) => {
    Alert.alert(t('book.characters'), `${t('common.delete')} "${c.name}"?`, [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('common.delete'),
        style: 'destructive',
        onPress: () => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          deleteCharacter(bookId ?? '', c.id);
        },
      },
    ]);
  };

  // Always-fresh ref so the header button never captures a stale closure
  const deleteBookRef = useRef<() => void>(null!);
  deleteBookRef.current = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setShowDeleteConfirm(true);
  };

  const editTitleRef = useRef<() => void>(null!);
  editTitleRef.current = () => {
    setBookTitleDraft(book?.title ?? '');
    setEditingBookTitle(true);
  };

  useLayoutEffect(() => {
    navigation.setOptions({
      title: book?.title ?? 'Book',
      headerRight: () => (
        <View style={styles.headerRight}>
          <TouchableOpacity
            onPress={() => editTitleRef.current()}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Feather name="edit-2" size={18} color={colors.primary} />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => deleteBookRef.current()}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            style={{ marginRight: Platform.OS === 'web' ? 8 : 0 }}
          >
            <Feather name="trash-2" size={18} color={colors.destructive} />
          </TouchableOpacity>
        </View>
      ),
    });
  }, [navigation, book?.title, colors]);

  const handleSaveBookTitle = () => {
    const title = bookTitleDraft.trim();
    if (!title) return;
    updateBook(book!.id, { title });
    setEditingBookTitle(false);
  };

  const handleAddChapter = () => {
    const title = newChapterTitle.trim();
    if (!title) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const chapter = addChapter(bookId ?? '', title);
    setNewChapterTitle('');
    setAddingChapter(false);
    router.push({
      pathname: '/chapter/[chapterId]',
      params: { chapterId: chapter.id, bookId: bookId ?? '' },
    });
  };

  // Open the split modal for a specific chapter, with an optional remaining queue
  const openSplitModalForChapter = (chapter: Chapter, remainingQueue: Chapter[]) => {
    const thresholds = getChapterFlagThreshold(book!.genre);
    const words = chapter.sections.reduce(
      (sum, s) => sum + s.content.split(/\s+/).filter(Boolean).length,
      0
    );
    const groups = splitSectionsIntoGroups(chapter.sections, thresholds.targetWords);
    setSplitQueue(remainingQueue);
    setChapterSplitModal({ chapter, groups, words, thresholds });
    setSplitNames(
      groups.map((_, gi) =>
        gi === 0 ? chapter.title : `${chapter.title} — Part ${gi + 1}`
      )
    );
  };

  // Advance to the next chapter in the queue (or close if empty)
  const advanceSplitQueue = () => {
    if (splitQueue.length > 0) {
      const [next, ...rest] = splitQueue;
      openSplitModalForChapter(next, rest);
    } else {
      setChapterSplitModal(null);
    }
  };

  const handleChapterPress = (chapter: Chapter) => {
    const words = chapter.sections.reduce(
      (sum, s) => sum + s.content.split(/\s+/).filter(Boolean).length,
      0
    );
    const thresholds = getChapterFlagThreshold(book!.genre);
    if (words >= thresholds.flagAt) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      openSplitModalForChapter(chapter, []);
      return;
    }
    router.push({ pathname: '/chapter/[chapterId]', params: { chapterId: chapter.id, bookId: book!.id } });
  };

  const handleDoChapterSplit = () => {
    const modal = chapterSplitModal!;
    const parts = modal.groups.map((group, gi) => ({
      title: splitNames[gi]?.trim() || (gi === 0 ? modal.chapter.title : `${modal.chapter.title} — Part ${gi + 1}`),
      sections: group,
    }));
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    splitChapter(bookId ?? '', modal.chapter.id, parts);
    setChapterSplitModal(null);
    if (splitQueue.length > 0) {
      const [next, ...rest] = splitQueue;
      setSplitQueue(rest);
      setTimeout(() => openSplitModalForChapter(next, rest), 350);
    }
  };

  const handleDoAddNextChapter = () => {
    const modal = chapterSplitModal!;
    const nextNumber = modal.chapter.number + 1;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const newChapter = insertChapterAfter(bookId ?? '', modal.chapter.id, unitLabels.unitPlaceholder(nextNumber));
    setChapterSplitModal(null);
    // Advance queue after a moment; if empty, navigate to the new chapter
    if (splitQueue.length > 0) {
      const [next, ...rest] = splitQueue;
      setSplitQueue(rest);
      setTimeout(() => openSplitModalForChapter(next, rest), 350);
    } else {
      setTimeout(() => {
        router.push({ pathname: '/chapter/[chapterId]', params: { chapterId: newChapter.id, bookId: bookId ?? '' } });
      }, 200);
    }
  };

  const handleDeleteChapter = (chapterId: string, title: string) => {
    Alert.alert(
      unitLabels.deleteUnit,
      unitLabels.deleteUnitConfirm,
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.delete'),
          style: 'destructive',
          onPress: () => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
            deleteChapter(bookId ?? '', chapterId);
          },
        },
      ]
    );
  };

  if (!book) {
    return (
      <View
        style={[styles.notFound, { backgroundColor: colors.background }]}
      >
        <Text style={[styles.notFoundText, { color: colors.mutedForeground }]}>
          {t('errors.bookNotFound')}
        </Text>
      </View>
    );
  }

  const totalWords = book.chapters.reduce(
    (sum, c) =>
      sum +
      c.sections.reduce(
        (s2, s) => s2 + s.content.split(/\s+/).filter(Boolean).length,
        0
      ),
    0
  );

  // Chapters that exceed the genre threshold (long enough to warrant action)
  const flaggedChapters = (() => {
    const thresholds = getChapterFlagThreshold(book.genre);
    return book.chapters.filter((c) => {
      const words = c.sections.reduce(
        (s, sec) => s + sec.content.split(/\s+/).filter(Boolean).length,
        0
      );
      return words >= thresholds.flagAt;
    });
  })();

  const bottomPadding =
    (Platform.OS === 'web' ? 34 : insets.bottom) + 24;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* ── Delete book confirmation modal ── */}
      <Modal visible={showDeleteConfirm} transparent animationType="fade" statusBarTranslucent>
        <View style={styles.deleteOverlay}>
          <View style={[styles.deleteCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={[styles.deleteIconWrap, { backgroundColor: colors.destructive + '18' }]}>
              <Feather name="trash-2" size={22} color={colors.destructive} />
            </View>
            <Text style={[styles.deleteTitle, { color: colors.foreground }]}>Delete Book?</Text>
            <Text style={[styles.deleteBody, { color: colors.mutedForeground }]}>
              {`"${book?.title}" and all its chapters will be permanently removed. This cannot be undone.`}
            </Text>
            <TouchableOpacity
              style={[styles.deleteConfirmBtn, { backgroundColor: colors.destructive }]}
              onPress={() => {
                setShowDeleteConfirm(false);
                deleteBook(bookId ?? '');
                router.back();
              }}
              activeOpacity={0.85}
            >
              <Text style={styles.deleteConfirmText}>Delete Forever</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.deleteCancelBtn, { borderColor: colors.border }]}
              onPress={() => setShowDeleteConfirm(false)}
              activeOpacity={0.7}
            >
              <Text style={[styles.deleteCancelText, { color: colors.foreground }]}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ── Long-chapter modal ── */}
      <Modal visible={!!chapterSplitModal} transparent animationType="slide" statusBarTranslucent>
        <View style={styles.splitOverlay}>
          <View style={[styles.splitCard, { backgroundColor: colors.card }]}>
            {/* Header */}
            <View style={[styles.splitHeader, { backgroundColor: colors.warning + '18' }]}>
              <View style={[styles.splitIconWrap, { backgroundColor: colors.warning }]}>
                <Feather name="book-open" size={18} color="#fff" />
              </View>
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <Text style={[styles.splitTitle, { color: colors.foreground }]}>
                    This {unitLabels.unit} is getting long
                  </Text>
                  {splitQueue.length > 0 && (
                    <View style={[styles.splitQueueBadge, { backgroundColor: colors.warning }]}>
                      <Text style={styles.splitQueueBadgeText}>
                        {flaggedChapters.length - splitQueue.length}/{flaggedChapters.length}
                      </Text>
                    </View>
                  )}
                </View>
                <Text style={[styles.splitSubtitle, { color: colors.mutedForeground }]} numberOfLines={1}>
                  "{chapterSplitModal?.chapter.title}"
                </Text>
              </View>
              <View style={[styles.splitBadge, { backgroundColor: colors.warning + '22' }]}>
                <Text style={[styles.splitBadgeText, { color: colors.warning }]}>
                  {chapterSplitModal?.words.toLocaleString()} words
                </Text>
              </View>
            </View>

            <Text style={[styles.splitBody, { color: colors.mutedForeground }]}>
              At {chapterSplitModal?.words.toLocaleString()} words this is longer than the {chapterSplitModal?.thresholds.rangeLabel}-word range typical for this genre.{(chapterSplitModal?.groups.length ?? 0) > 1 ? ` Start a new ${unitLabels.unit} here, or split this one into ${chapterSplitModal?.groups.length} parts.` : ` Start a new ${unitLabels.unit} to continue.`}
            </Text>

            {/* Primary action — Add Next Chapter */}
            <TouchableOpacity
              onPress={handleDoAddNextChapter}
              style={[styles.splitAddChapterBtn, { backgroundColor: colors.accent }]}
              activeOpacity={0.85}
            >
              <Feather name="plus-circle" size={18} color="#fff" />
              <View style={{ flex: 1 }}>
                <Text style={styles.splitAddChapterTitle}>{unitLabels.addNextUnit}</Text>
                <Text style={styles.splitAddChapterSub}>{unitLabels.continueInFresh}</Text>
              </View>
              <Feather name="chevron-right" size={16} color="rgba(255,255,255,0.8)" />
            </TouchableOpacity>

            {/* Split option — only shown when chapter can be divided */}
            {(chapterSplitModal?.groups.length ?? 0) > 1 && (
              <>
                <Text style={[styles.splitOrLabel, { color: colors.mutedForeground }]}>{unitLabels.splitOrLabel}</Text>

                <ScrollView style={styles.splitScroll} showsVerticalScrollIndicator={false}>
                  {chapterSplitModal?.groups.map((group, gi) => {
                    const gWords = group.reduce((s, sec) => s + sec.content.split(/\s+/).filter(Boolean).length, 0);
                    return (
                      <View key={gi} style={[styles.splitSegCard, { borderColor: colors.border, backgroundColor: colors.background }]}>
                        <View style={styles.splitSegRow}>
                          <View style={[styles.splitSegNum, { backgroundColor: colors.primary }]}>
                            <Text style={styles.splitSegNumText}>{gi + 1}</Text>
                          </View>
                          <Text style={[styles.splitSegMeta, { color: colors.mutedForeground }]}>
                            {group.length} section{group.length !== 1 ? 's' : ''} · {gWords.toLocaleString()} words
                          </Text>
                        </View>
                        <TextInput
                          value={splitNames[gi] ?? ''}
                          onChangeText={(v) => setSplitNames((prev) => { const n = [...prev]; n[gi] = v; return n; })}
                          placeholder={`Name for part ${gi + 1}…`}
                          placeholderTextColor={colors.mutedForeground}
                          style={[styles.splitNameInput, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.card }]}
                        />
                      </View>
                    );
                  })}
                </ScrollView>

                <View style={styles.splitActions}>
                  <TouchableOpacity
                    onPress={() => {
                      const capturedChapter = chapterSplitModal!.chapter;
                      if (splitQueue.length > 0) {
                        advanceSplitQueue();
                      } else {
                        setChapterSplitModal(null);
                        router.push({ pathname: '/chapter/[chapterId]', params: { chapterId: capturedChapter.id, bookId: book.id } });
                      }
                    }}
                    style={[styles.splitKeepBtn, { borderColor: colors.border }]}
                    activeOpacity={0.8}
                  >
                    <Text style={[styles.splitKeepText, { color: colors.mutedForeground }]}>
                      {splitQueue.length > 0 ? 'Skip' : 'Keep as one'}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={handleDoChapterSplit}
                    style={[styles.splitDoBtn, { backgroundColor: colors.primary }]}
                    activeOpacity={0.85}
                  >
                    <Feather name="scissors" size={15} color="#fff" />
                    <Text style={styles.splitDoBtnText}>Split it up</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}

            {/* Dismiss row — always shown when split section is hidden */}
            {(chapterSplitModal?.groups.length ?? 0) <= 1 && (
              <View style={[styles.splitActions, { paddingTop: 4 }]}>
                <TouchableOpacity
                  onPress={() => {
                    const capturedChapter = chapterSplitModal!.chapter;
                    if (splitQueue.length > 0) {
                      advanceSplitQueue();
                    } else {
                      setChapterSplitModal(null);
                      router.push({ pathname: '/chapter/[chapterId]', params: { chapterId: capturedChapter.id, bookId: book.id } });
                    }
                  }}
                  style={[styles.splitKeepBtn, { borderColor: colors.border, flex: 1 }]}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.splitKeepText, { color: colors.mutedForeground }]}>
                    {splitQueue.length > 0 ? 'Skip' : 'Keep as one chapter'}
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </Modal>

      {/* Character Add/Edit Modal */}
      <Modal
        visible={charModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setCharModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalSheet, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.modalTitle, { color: colors.foreground }]}>
              {editingChar ? 'Edit Character' : 'Add Character'}
            </Text>
            <TextInput
              style={[styles.modalInput, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.background }]}
              placeholder="Character name"
              placeholderTextColor={colors.mutedForeground}
              value={charName}
              onChangeText={setCharName}
              autoFocus
              returnKeyType="done"
            />
            <Text style={[styles.modalRoleLabel, { color: colors.mutedForeground }]}>Role</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.modalRoleRow}>
              {CHARACTER_ROLES.map((role) => (
                <TouchableOpacity
                  key={role}
                  onPress={() => { Haptics.selectionAsync(); setCharRole(role); }}
                  style={[
                    styles.modalRoleChip,
                    charRole === role
                      ? { backgroundColor: colors.primary, borderColor: colors.primary }
                      : { backgroundColor: 'transparent', borderColor: colors.border },
                  ]}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.modalRoleChipText, { color: charRole === role ? colors.primaryForeground : colors.foreground }]}>
                    {role}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <View style={styles.modalActions}>
              {editingChar && (
                <TouchableOpacity
                  onPress={() => { setCharModalVisible(false); handleDeleteChar(editingChar); }}
                  style={[styles.modalDeleteBtn, { borderColor: colors.destructive + '60' }]}
                  activeOpacity={0.8}
                >
                  <Feather name="trash-2" size={14} color={colors.destructive} />
                </TouchableOpacity>
              )}
              <TouchableOpacity
                onPress={() => setCharModalVisible(false)}
                style={[styles.modalCancelBtn, { borderColor: colors.border }]}
                activeOpacity={0.8}
              >
                <Text style={[styles.modalCancelText, { color: colors.mutedForeground }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleSaveChar}
                disabled={!charName.trim()}
                style={[styles.modalSaveBtn, { backgroundColor: charName.trim() ? colors.primary : colors.muted }]}
                activeOpacity={0.85}
              >
                <Text style={[styles.modalSaveText, { color: charName.trim() ? colors.primaryForeground : colors.mutedForeground }]}>
                  {editingChar ? 'Save' : 'Add'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Typography font picker */}
      <Modal
        visible={typoPickerVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setTypoPickerVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalSheet, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={[styles.modalHeader, { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }]}>
              <Text style={[styles.modalTitle, { color: colors.foreground }]}>
                {typoTarget === 'dialogue' ? 'Dialogue Font' : 'Heading Font'}
              </Text>
              <TouchableOpacity onPress={() => setTypoPickerVisible(false)}>
                <Feather name="x" size={20} color={colors.mutedForeground} />
              </TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 420 }}>
              <TouchableOpacity
                onPress={() => { setTypoPickerVisible(false); setAddFontVisible(true); }}
                activeOpacity={0.85}
                style={[styles.typoFontRow, { backgroundColor: colors.primary + '08', borderColor: colors.primary, borderStyle: 'dashed' }]}
              >
                <Feather name="plus" size={15} color={colors.primary} />
                <View style={{ flex: 1, marginLeft: 8 }}>
                  <Text style={[styles.typoFontLabel, { color: colors.primary }]}>Add a Google Font</Text>
                  <Text style={[styles.typoFontSample, { color: colors.mutedForeground }]}>Load any font from fonts.google.com</Text>
                </View>
              </TouchableOpacity>
              {asExportFonts().length > 0 && (
                <>
                  <Text style={[styles.typoFontSectionLabel, { color: colors.mutedForeground }]}>MY FONTS</Text>
                  {asExportFonts().map((f) => {
                    const currentId = typoTarget === 'dialogue' ? (book.dialogueFontId ?? DEFAULT_FONT_ID) : (book.headingFontId ?? DEFAULT_HEADING_FONT_ID);
                    const selected = f.id === currentId;
                    return (
                      <TouchableOpacity key={f.id} activeOpacity={0.85}
                        onPress={() => { if (!book) return; updateBook(book.id, typoTarget === 'dialogue' ? { dialogueFontId: f.id } : { headingFontId: f.id }); setTypoPickerVisible(false); }}
                        style={[styles.typoFontRow, { backgroundColor: selected ? colors.primary + '12' : colors.background, borderColor: selected ? colors.primary : colors.border }]}
                      >
                        <View style={{ flex: 1 }}>
                          <Text style={[styles.typoFontLabel, { color: colors.foreground }]}>{f.label}</Text>
                          <Text style={[styles.typoFontSample, { color: colors.mutedForeground, fontFamily: f.family }]}>The quick brown fox jumps over the lazy dog.</Text>
                        </View>
                        {selected && <Feather name="check" size={16} color={colors.primary} />}
                      </TouchableOpacity>
                    );
                  })}
                  <Text style={[styles.typoFontSectionLabel, { color: colors.mutedForeground }]}>ALL FONTS</Text>
                </>
              )}
              {EXPORT_FONTS.map((f) => {
                const currentId = typoTarget === 'dialogue' ? (book.dialogueFontId ?? DEFAULT_FONT_ID) : (book.headingFontId ?? DEFAULT_HEADING_FONT_ID);
                const selected = f.id === currentId;
                return (
                  <TouchableOpacity key={f.id} activeOpacity={0.85}
                    onPress={() => { if (!book) return; updateBook(book.id, typoTarget === 'dialogue' ? { dialogueFontId: f.id } : { headingFontId: f.id }); setTypoPickerVisible(false); }}
                    style={[styles.typoFontRow, { backgroundColor: selected ? colors.primary + '12' : colors.background, borderColor: selected ? colors.primary : colors.border }]}
                  >
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.typoFontLabel, { color: colors.foreground }]}>{f.label}</Text>
                      <Text style={[styles.typoFontSample, { color: colors.mutedForeground, fontFamily: f.family }]}>The quick brown fox jumps over the lazy dog.</Text>
                    </View>
                    {selected && <Feather name="check" size={16} color={colors.primary} />}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        </View>
      </Modal>

      <AddFontModal
        visible={addFontVisible}
        onClose={() => setAddFontVisible(false)}
        onAdd={async (label, family, fontUrl) => {
          await addCustomFont(label, family, fontUrl);
          if (!book) return;
          const id = `custom-${label.toLowerCase().replace(/\s+/g, '-')}`;
          updateBook(book.id, typoTarget === 'dialogue' ? { dialogueFontId: id } : { headingFontId: id });
        }}
      />

      <FirstUseTip
        visible={charactersTipVisible}
        icon="users"
        message="Add your characters here — AI will weave them into your chapters automatically."
        onDismiss={dismissCharactersTip}
        bottomOffset={(Platform.OS === 'web' ? 34 : insets.bottom) + 16}
      />

      <FlatList
        data={book.chapters}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[
          styles.listContent,
          { paddingBottom: bottomPadding, paddingHorizontal: isTablet ? Math.max(16, (screenWidth - 720) / 2) : 16 },
        ]}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <View style={styles.bookHeader}>
            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <Text
                  style={[styles.statValue, { color: colors.foreground }]}
                >
                  {book.chapters.length}
                </Text>
                <Text
                  style={[styles.statLabel, { color: colors.mutedForeground }]}
                >
                  {unitLabels.units}
                </Text>
              </View>
              <View
                style={[styles.statDivider, { backgroundColor: colors.border }]}
              />
              <View style={styles.statItem}>
                <Text
                  style={[styles.statValue, { color: colors.foreground }]}
                >
                  {totalWords.toLocaleString()}
                </Text>
                <Text
                  style={[styles.statLabel, { color: colors.mutedForeground }]}
                >
                  {t('common.words')}
                </Text>
              </View>
              <View
                style={[styles.statDivider, { backgroundColor: colors.border }]}
              />
              <View style={styles.statItem}>
                <Text
                  style={[styles.statValue, { color: colors.foreground }]}
                >
                  {book.chapters.filter((c) => c.isComplete).length}
                </Text>
                <Text
                  style={[styles.statLabel, { color: colors.mutedForeground }]}
                >
                  {t('book.complete')}
                </Text>
              </View>
            </View>

            {book.description.length > 0 && (
              <Text
                style={[styles.bookDesc, { color: colors.mutedForeground }]}
              >
                {book.description}
              </Text>
            )}

            {/* ── Synopsis panel — Screenplay only ─────────────────────── */}
            {book.genre === 'Screenplay' && (
              <View style={[styles.synopsisCard, { borderColor: colors.border, backgroundColor: colors.card }]}>
                <TouchableOpacity
                  onPress={() => { Haptics.selectionAsync(); setSynopsisExpanded(v => !v); }}
                  activeOpacity={0.8}
                  style={styles.synopsisHeader}
                >
                  <View style={styles.synopsisHeaderLeft}>
                    <Feather name="film" size={14} color={colors.primary} />
                    <Text style={[styles.synopsisTitle, { color: colors.foreground }]}>
                      {t('book.synopsis')}
                    </Text>
                    {!!synopsisDraft && !synopsisExpanded && (
                      <View style={[styles.synopsisBadge, { backgroundColor: colors.primary + '22' }]}>
                        <Text style={[styles.synopsisBadgeText, { color: colors.primary }]}>
                          {synopsisDraft.split(/\s+/).filter(Boolean).length}w
                        </Text>
                      </View>
                    )}
                  </View>
                  <Feather
                    name={synopsisExpanded ? 'chevron-up' : 'chevron-down'}
                    size={16}
                    color={colors.mutedForeground}
                  />
                </TouchableOpacity>

                {synopsisExpanded && (
                  <View style={styles.synopsisBody}>
                    <TextInput
                      style={[styles.synopsisInput, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.background }]}
                      value={synopsisDraft}
                      onChangeText={setSynopsisDraft}
                      onBlur={handleSynopsisBlur}
                      placeholder={t('book.synopsisPlaceholder')}
                      placeholderTextColor={colors.mutedForeground}
                      multiline
                      textAlignVertical="top"
                    />
                    {(() => {
                      const wc = synopsisDraft.trim().split(/\s+/).filter(Boolean).length;
                      const hasDraft = synopsisDraft.trim().length > 0;
                      const MIN_W = 20;
                      const met = wc >= MIN_W;
                      return (
                        <View style={styles.synopsisWordRow}>
                          {hasDraft && (
                            <View style={[styles.synopsisWordBar, { backgroundColor: colors.border }]}>
                              <View style={[
                                styles.synopsisWordFill,
                                { width: `${Math.min((wc / MIN_W) * 100, 100)}%`, backgroundColor: met ? colors.primary : '#C4913A' }
                              ]} />
                            </View>
                          )}
                          <Text style={[styles.synopsisWordCount, {
                            color: !hasDraft ? colors.mutedForeground : met ? colors.primary : '#C4913A',
                            fontFamily: hasDraft ? 'Inter_600SemiBold' : 'Inter_400Regular',
                          }]}>
                            {!hasDraft
                              ? `Minimum ${MIN_W} words required`
                              : `${wc} / ${MIN_W} words${met ? ' ✓' : ' min'}`}
                          </Text>
                        </View>
                      );
                    })()}
                    <TouchableOpacity
                      onPress={handleSynopsisUpload}
                      activeOpacity={0.8}
                      disabled={synopsisUploading}
                      style={[styles.synopsisUploadBtn, { borderColor: colors.primary + '55', backgroundColor: colors.primary + '0D' }]}
                    >
                      <Feather name={synopsisUploading ? 'loader' : 'upload'} size={14} color={colors.primary} />
                      <Text style={[styles.synopsisUploadText, { color: colors.primary }]}>
                        {synopsisUploading ? t('book.synopsisUploading') : t('book.synopsisUpload')}
                      </Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            )}

            {/* ── Develop Screenplay CTA ───────────────────────────────── */}
            {book.genre === 'Screenplay' && (
              <TouchableOpacity
                style={[styles.developBanner, { backgroundColor: colors.primary + '0E', borderColor: colors.primary + '40' }]}
                onPress={() => router.push({ pathname: '/screenplay-wizard', params: { bookId: book.id } })}
                activeOpacity={0.8}
              >
                <View style={[styles.developBannerIcon, { backgroundColor: colors.primary + '20' }]}>
                  <Feather name="film" size={17} color={colors.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.developBannerTitle, { color: colors.primary }]}>
                    {book.screenplayCoreTheme ? 'Review Development Plan' : 'Develop Your Screenplay'}
                  </Text>
                  <Text style={[styles.developBannerSub, { color: colors.mutedForeground }]}>
                    {book.screenplayCoreTheme
                      ? `Core theme: ${book.screenplayCoreTheme}`
                      : 'Analyse your concept · themes · core message · opening scene'}
                  </Text>
                </View>
                <Feather name="chevron-right" size={16} color={colors.primary + '99'} />
              </TouchableOpacity>
            )}

            {editingBookTitle && (
              <View style={[styles.renameCard, { borderColor: colors.border, backgroundColor: colors.card }]}>
                <TextInput
                  value={bookTitleDraft}
                  onChangeText={setBookTitleDraft}
                  placeholder="Book title"
                  placeholderTextColor={colors.mutedForeground}
                  style={[styles.renameInput, { color: colors.foreground, borderColor: colors.border }]}
                  autoFocus
                />
                <View style={styles.renameActions}>
                  <TouchableOpacity onPress={() => setEditingBookTitle(false)}>
                    <Text style={[styles.renameCancel, { color: colors.mutedForeground }]}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={handleSaveBookTitle} disabled={!bookTitleDraft.trim()}>
                    <Text style={[styles.renameSave, { color: colors.primary }]}>Save</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {flaggedChapters.length > 0 && (
              <TouchableOpacity
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                  const [first, ...rest] = flaggedChapters;
                  openSplitModalForChapter(first, rest);
                }}
                style={[styles.splitBanner, { borderColor: colors.warning + '55', backgroundColor: colors.warning + '0E' }]}
                activeOpacity={0.8}
              >
                <View style={[styles.splitBannerIcon, { backgroundColor: colors.warning + '22' }]}>
                  <Feather name="scissors" size={16} color={colors.warning} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.splitBannerTitle, { color: colors.warning }]}>
                    {unitLabels.isGettingLong(flaggedChapters.length)}
                  </Text>
                  <Text style={[styles.splitBannerSub, { color: colors.mutedForeground }]}>
                    {unitLabels.tapToReview}
                  </Text>
                </View>
                <Feather name="chevron-right" size={16} color={colors.warning} />
              </TouchableOpacity>
            )}

            {book.chapters.length > 0 && (
              <View style={styles.bookActions}>
                <TouchableOpacity
                  style={[
                    styles.previewButton,
                    { borderColor: colors.border, backgroundColor: colors.card },
                  ]}
                  onPress={() =>
                    router.push({
                      pathname: '/preview/[bookId]',
                      params: { bookId: book.id },
                    })
                  }
                  activeOpacity={0.8}
                >
                  <Feather name="eye" size={16} color={colors.primary} />
                  <Text style={[styles.previewButtonText, { color: colors.primary }]}>
                    Preview
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.previewButton,
                    { borderColor: colors.border, backgroundColor: colors.card },
                  ]}
                  onPress={() =>
                    router.push({
                      pathname: '/illustrate-book',
                      params: { bookId: book.id },
                    })
                  }
                  activeOpacity={0.8}
                >
                  <Feather name="image" size={16} color={colors.accent} />
                  <Text style={[styles.previewButtonText, { color: colors.accent }]}>
                    Illustrate
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.previewButton,
                    { borderColor: colors.border, backgroundColor: colors.card },
                  ]}
                  onPress={() =>
                    router.push({
                      pathname: '/cover-generator',
                      params: { bookId: book.id },
                    })
                  }
                  activeOpacity={0.8}
                >
                  <Feather name="aperture" size={16} color="#FF9900" />
                  <Text style={[styles.previewButtonText, { color: '#FF9900' }]}>
                    Cover
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.previewButton,
                    { borderColor: colors.primary + '55', backgroundColor: colors.primary + '0E' },
                  ]}
                  onPress={() =>
                    router.push({
                      pathname: '/bloom-wizard',
                      params: {
                        bookId: book.id,
                        chapterCount: String(book.chapters.length),
                        wordCount: String(totalWords),
                      },
                    })
                  }
                  activeOpacity={0.8}
                >
                  <Text style={{ fontSize: 13 }}>🌸</Text>
                  <Text style={[styles.previewButtonText, { color: colors.primary }]}>
                    Publish
                  </Text>
                </TouchableOpacity>
              </View>
            )}

            {book.chapters.length > 0 && (
              <TouchableOpacity
                style={[
                  styles.printButton,
                  { borderColor: colors.primary + '55', backgroundColor: colors.primary + '0D' },
                ]}
                onPress={() =>
                  router.push({
                    pathname: '/print-book',
                    params: { bookId: book.id },
                  })
                }
                activeOpacity={0.8}
              >
                <Feather name="printer" size={16} color={colors.primary} />
                <View style={{ flex: 1 }}>
                  <Text style={[styles.printButtonTitle, { color: colors.primary }]}>
                    Print Book
                  </Text>
                  <Text style={[styles.printButtonSub, { color: colors.mutedForeground }]}>
                    Preview layout · Amazon KDP export
                  </Text>
                </View>
                <Feather name="chevron-right" size={16} color={colors.primary + '88'} />
              </TouchableOpacity>
            )}

            {/* Cover thumbnail — shown when a cover has been saved or an AI image has been set */}
            {(book.coverImageUri || book.coverImageBase64) && (
              <TouchableOpacity
                style={[styles.coverThumbCard, { backgroundColor: colors.card, borderColor: colors.border }]}
                onPress={() => router.push({ pathname: '/cover-generator', params: { bookId: book.id } })}
                activeOpacity={0.85}
              >
                <Image
                  source={{ uri: book.coverImageUri ?? `data:image/png;base64,${book.coverImageBase64}` }}
                  style={styles.coverThumbImage}
                  resizeMode="cover"
                />
                <View style={styles.coverThumbInfo}>
                  <View style={styles.coverThumbSavedRow}>
                    <Feather name="check-circle" size={13} color={colors.accent} />
                    <Text style={[styles.coverThumbSavedLabel, { color: colors.accent }]}>
                      {book.coverImageUri ? 'Cover saved' : 'AI cover set'}
                    </Text>
                  </View>
                  <Text style={[styles.coverThumbTitle, { color: colors.foreground }]} numberOfLines={3}>
                    {book.title}
                  </Text>
                  {book.coverAuthorName ? (
                    <Text style={[styles.coverThumbAuthor, { color: colors.mutedForeground }]} numberOfLines={1}>
                      {book.coverAuthorName}
                    </Text>
                  ) : null}
                  <View style={[styles.coverThumbEditBtn, { backgroundColor: colors.primary + '14', borderColor: colors.primary + '30' }]}>
                    <Feather name="edit-2" size={12} color={colors.primary} />
                    <Text style={[styles.coverThumbEditText, { color: colors.primary }]}>Edit Cover</Text>
                  </View>
                </View>
              </TouchableOpacity>
            )}

            {book.chapters.length > 0 && !book.coverImageUri && !book.coverImageBase64 && (
              <TouchableOpacity
                style={[styles.coverBanner, { backgroundColor: '#FF990015', borderColor: '#FF990040' }]}
                onPress={() =>
                  router.push({
                    pathname: '/cover-generator',
                    params: { bookId: book.id },
                  })
                }
                activeOpacity={0.8}
              >
                <Feather name="aperture" size={18} color="#FF9900" />
                <View style={{ flex: 1 }}>
                  <Text style={[styles.coverBannerTitle, { color: colors.foreground }]}>
                    Ready to publish?
                  </Text>
                  <Text style={[styles.coverBannerSub, { color: colors.mutedForeground }]}>
                    Generate an AI book cover — Amazon KDP requires 625 × 1,000 px minimum
                  </Text>
                </View>
                <Feather name="chevron-right" size={16} color="#FF9900" />
              </TouchableOpacity>
            )}

            {/* Characters section */}
            <View style={[styles.charSection, { borderColor: colors.border, backgroundColor: colors.card }]}>
              <View style={styles.charHeader}>
                <View style={styles.charHeaderLeft}>
                  <Feather name="users" size={14} color={colors.primary} />
                  <Text style={[styles.charSectionLabel, { color: colors.foreground }]}>Characters</Text>
                </View>
                <TouchableOpacity onPress={openAddChar} activeOpacity={0.7} style={[styles.charAddBtn, { borderColor: colors.primary + '55' }]}>
                  <Feather name="plus" size={13} color={colors.primary} />
                  <Text style={[styles.charAddBtnText, { color: colors.primary }]}>Add</Text>
                </TouchableOpacity>
              </View>
              {(book.characters ?? []).length === 0 ? (
                <TouchableOpacity onPress={openAddChar} activeOpacity={0.7}>
                  <Text style={[styles.charEmptyText, { color: colors.mutedForeground }]}>
                    Add characters to personalize your writing prompts
                  </Text>
                </TouchableOpacity>
              ) : (
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.charChipRow}>
                  {(book.characters ?? []).map((c) => (
                    <TouchableOpacity
                      key={c.id}
                      activeOpacity={0.75}
                      onPress={() => openEditChar(c)}
                      onLongPress={() => handleDeleteChar(c)}
                      style={[styles.charChip, { backgroundColor: colors.primary + '14', borderColor: colors.primary + '40' }]}
                    >
                      <Text style={[styles.charChipName, { color: colors.primary }]}>{c.name}</Text>
                      <Text style={[styles.charChipRole, { color: colors.primary + 'AA' }]}>{c.role}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              )}
            </View>

            {/* Typography */}
            {(() => {
              const dialogueFont = getFontById(book.dialogueFontId ?? DEFAULT_FONT_ID);
              const headingFont = getFontById(book.headingFontId ?? DEFAULT_HEADING_FONT_ID);
              const dBold = !!book.dialogueFontBold;
              const dItalic = !!book.dialogueFontItalic;
              const hBold = !!book.headingFontBold;
              const hItalic = !!book.headingFontItalic;
              return (
                <View style={[styles.typoCard, { borderColor: colors.border, backgroundColor: colors.card }]}>
                  <View style={styles.typoHeader}>
                    <Feather name="type" size={14} color={colors.primary} />
                    <Text style={[styles.typoTitle, { color: colors.foreground }]}>Typography</Text>
                  </View>
                  {/* Dialogue font row */}
                  <View style={[styles.typoRow, { borderColor: colors.border }]}>
                    <View style={styles.typoRowContent}>
                      <Text style={[styles.typoQuestion, { color: colors.mutedForeground }]}>
                        Do you want to change the character's dialogue font?
                      </Text>
                      <TouchableOpacity
                        onPress={() => { Haptics.selectionAsync(); setTypoTarget('dialogue'); setTypoPickerVisible(true); }}
                        style={styles.typoFontSelector}
                        activeOpacity={0.75}
                      >
                        <Text style={[styles.typoValue, { color: colors.primary, fontFamily: dialogueFont.family }]}>
                          {dialogueFont.label}
                        </Text>
                        <Feather name="chevron-right" size={14} color={colors.mutedForeground} />
                      </TouchableOpacity>
                      <View style={styles.typoStyleToggleRow}>
                        <TouchableOpacity
                          onPress={() => { Haptics.selectionAsync(); updateBook(book.id, { dialogueFontBold: !dBold }); }}
                          style={[styles.typoStyleChip, { backgroundColor: dBold ? colors.primary : colors.background, borderColor: dBold ? colors.primary : colors.border }]}
                          activeOpacity={0.8}
                        >
                          <Text style={[styles.typoStyleChipText, { color: dBold ? colors.primaryForeground : colors.foreground, fontWeight: 'bold' }]}>B</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          onPress={() => { Haptics.selectionAsync(); updateBook(book.id, { dialogueFontItalic: !dItalic }); }}
                          style={[styles.typoStyleChip, { backgroundColor: dItalic ? colors.primary : colors.background, borderColor: dItalic ? colors.primary : colors.border }]}
                          activeOpacity={0.8}
                        >
                          <Text style={[styles.typoStyleChipText, { color: dItalic ? colors.primaryForeground : colors.foreground, fontStyle: 'italic' }]}>I</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>
                  {/* Heading font row */}
                  <View style={[styles.typoRow, { borderColor: colors.border }]}>
                    <View style={styles.typoRowContent}>
                      <Text style={[styles.typoQuestion, { color: colors.mutedForeground }]}>
                        Do you want to change the chapter heading or chapter title throughout the work?
                      </Text>
                      <TouchableOpacity
                        onPress={() => { Haptics.selectionAsync(); setTypoTarget('heading'); setTypoPickerVisible(true); }}
                        style={styles.typoFontSelector}
                        activeOpacity={0.75}
                      >
                        <Text style={[styles.typoValue, { color: colors.primary, fontFamily: headingFont.family }]}>
                          {headingFont.label}
                        </Text>
                        <Feather name="chevron-right" size={14} color={colors.mutedForeground} />
                      </TouchableOpacity>
                      <View style={styles.typoStyleToggleRow}>
                        <TouchableOpacity
                          onPress={() => { Haptics.selectionAsync(); updateBook(book.id, { headingFontBold: !hBold }); }}
                          style={[styles.typoStyleChip, { backgroundColor: hBold ? colors.primary : colors.background, borderColor: hBold ? colors.primary : colors.border }]}
                          activeOpacity={0.8}
                        >
                          <Text style={[styles.typoStyleChipText, { color: hBold ? colors.primaryForeground : colors.foreground, fontWeight: 'bold' }]}>B</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          onPress={() => { Haptics.selectionAsync(); updateBook(book.id, { headingFontItalic: !hItalic }); }}
                          style={[styles.typoStyleChip, { backgroundColor: hItalic ? colors.primary : colors.background, borderColor: hItalic ? colors.primary : colors.border }]}
                          activeOpacity={0.8}
                        >
                          <Text style={[styles.typoStyleChipText, { color: hItalic ? colors.primaryForeground : colors.foreground, fontStyle: 'italic' }]}>I</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>
                </View>
              );
            })()}

            <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>
              {unitLabels.units.toUpperCase()}
            </Text>
          </View>
        }
        ListEmptyComponent={
          <View style={styles.emptyChapters}>
            <Feather name="file-text" size={36} color={colors.mutedForeground} />
            <Text
              style={[styles.emptyChapTitle, { color: colors.foreground }]}
            >
              {unitLabels.noUnits}
            </Text>
            <Text
              style={[
                styles.emptyChapBody,
                { color: colors.mutedForeground },
              ]}
            >
              {unitLabels.noUnitsSubtitle}
            </Text>
          </View>
        }
        renderItem={({ item }) => (
          <ChapterCard
            chapter={item}
            onPress={() => handleChapterPress(item)}
            onDelete={() => handleDeleteChapter(item.id, item.title)}
          />
        )}
        ListFooterComponent={
          <View style={styles.addChapterArea}>
            {addingChapter ? (
              <View
                style={[
                  styles.addChapterForm,
                  {
                    backgroundColor: colors.card,
                    borderColor: colors.border,
                  },
                ]}
              >
                <TextInput
                  style={[
                    styles.chapterInput,
                    { color: colors.foreground },
                  ]}
                  placeholder={unitLabels.unitPlaceholder(book.chapters.length + 1)}
                  placeholderTextColor={colors.mutedForeground}
                  value={newChapterTitle}
                  onChangeText={setNewChapterTitle}
                  autoFocus
                  returnKeyType="done"
                  onSubmitEditing={handleAddChapter}
                />
                <View style={styles.addChapterButtons}>
                  <TouchableOpacity
                    onPress={() => {
                      setAddingChapter(false);
                      setNewChapterTitle('');
                    }}
                    style={[
                      styles.cancelBtn,
                      { borderColor: colors.border },
                    ]}
                  >
                    <Text
                      style={[
                        styles.cancelBtnText,
                        { color: colors.mutedForeground },
                      ]}
                    >
                      Cancel
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={handleAddChapter}
                    style={[
                      styles.addBtn,
                      {
                        backgroundColor:
                          newChapterTitle.trim().length > 0
                            ? colors.primary
                            : colors.muted,
                      },
                    ]}
                    disabled={newChapterTitle.trim().length === 0}
                  >
                    <Text
                      style={[
                        styles.addBtnText,
                        {
                          color:
                            newChapterTitle.trim().length > 0
                              ? colors.primaryForeground
                              : colors.mutedForeground,
                        },
                      ]}
                    >
                      {unitLabels.addUnit}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <TouchableOpacity
                style={[
                  styles.addChapterButton,
                  { borderColor: colors.border },
                ]}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setAddingChapter(true);
                }}
                activeOpacity={0.7}
              >
                <Feather name="plus" size={18} color={colors.primary} />
                <Text
                  style={[styles.addChapterText, { color: colors.primary }]}
                >
                  {unitLabels.addUnit}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  notFound: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notFoundText: {
    fontSize: 16,
    fontFamily: 'Inter_400Regular',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginRight: Platform.OS === 'web' ? 8 : 0,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    gap: 10,
    // paddingHorizontal overridden dynamically for tablet
  },
  bookHeader: {
    gap: 12,
    marginBottom: 8,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 0,
    paddingVertical: 16,
    paddingHorizontal: 8,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
  },
  statValue: {
    fontSize: 28,
    fontFamily: 'Inter_700Bold',
    letterSpacing: -0.5,
  },
  statLabel: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
  },
  statDivider: {
    width: 1,
    height: 40,
    marginHorizontal: 8,
  },
  bookDesc: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    lineHeight: 20,
    paddingHorizontal: 4,
  },
  bookActions: {
    flexDirection: 'row',
    gap: 10,
  },
  previewButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  previewButtonText: {
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
  },
  printButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
  },
  printButtonTitle: {
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
  },
  printButtonSub: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    marginTop: 1,
  },
  coverBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
  },
  coverBannerTitle: {
    fontSize: 13,
    fontFamily: 'Inter_600SemiBold',
  },
  coverBannerSub: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    lineHeight: 17,
    marginTop: 2,
  },
  coverThumbCard: {
    flexDirection: 'row',
    borderRadius: 14,
    borderWidth: 1,
    overflow: 'hidden',
  },
  coverThumbImage: {
    width: 88,
    height: 141,
  },
  coverThumbInfo: {
    flex: 1,
    padding: 14,
    gap: 5,
    justifyContent: 'center',
  },
  coverThumbSavedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  coverThumbSavedLabel: {
    fontSize: 11,
    fontFamily: 'Inter_600SemiBold',
    letterSpacing: 0.3,
  },
  coverThumbTitle: {
    fontSize: 15,
    fontFamily: 'Inter_700Bold',
    letterSpacing: -0.2,
    lineHeight: 20,
  },
  coverThumbAuthor: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
  },
  coverThumbEditBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderRadius: 20,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 6,
    alignSelf: 'flex-start',
    marginTop: 4,
  },
  coverThumbEditText: {
    fontSize: 12,
    fontFamily: 'Inter_600SemiBold',
  },
  sectionLabel: {
    fontSize: 11,
    fontFamily: 'Inter_600SemiBold',
    letterSpacing: 1,
    marginTop: 8,
    paddingHorizontal: 4,
  },
  typoCard: { borderWidth: 1, borderRadius: 14, padding: 14, gap: 10, marginTop: 4 },
  typoHeader: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  typoTitle: { fontSize: 13, fontFamily: 'Inter_600SemiBold' },
  typoRow: { flexDirection: 'row', alignItems: 'center', borderTopWidth: 1, paddingTop: 10, gap: 8 },
  typoRowContent: { flex: 1, gap: 3 },
  typoQuestion: { fontSize: 12, fontFamily: 'Inter_400Regular', lineHeight: 17 },
  typoValue: { fontSize: 14, fontFamily: 'Inter_600SemiBold' },
  typoFontSectionLabel: { fontSize: 10, fontFamily: 'Inter_600SemiBold', letterSpacing: 1, textTransform: 'uppercase', marginTop: 6, marginBottom: 2 },
  typoFontSelector: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingTop: 2 },
  typoStyleToggleRow: { flexDirection: 'row', gap: 6, marginTop: 6 },
  typoStyleChip: { width: 32, height: 32, borderRadius: 8, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  typoStyleChipText: { fontSize: 14 },
  typoFontRow: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: 10, padding: 10, marginBottom: 8 },
  typoFontLabel: { fontSize: 13, fontFamily: 'Inter_600SemiBold' },
  typoFontSample: { fontSize: 12, fontFamily: 'Inter_400Regular', marginTop: 2 },
  modalHeader: {},
  chapterCard: {
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    gap: 12,
  },
  chapterTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  chapterNumBadge: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  chapterNum: {
    fontSize: 16,
    fontFamily: 'Inter_700Bold',
  },
  chapterTitleArea: {
    flex: 1,
    gap: 2,
  },
  chapterTitle: {
    fontSize: 16,
    fontFamily: 'Inter_600SemiBold',
  },
  chapterMeta: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
  },
  chapterActionsOverlay: {
    position: 'absolute',
    top: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  chapterProgress: {
    height: 3,
    borderRadius: 2,
    overflow: 'hidden',
  },
  chapterProgressFill: {
    height: '100%',
    borderRadius: 2,
  },
  emptyChapters: {
    alignItems: 'center',
    gap: 8,
    paddingVertical: 32,
    paddingHorizontal: 24,
  },
  emptyChapTitle: {
    fontSize: 18,
    fontFamily: 'Inter_600SemiBold',
    marginTop: 8,
  },
  emptyChapBody: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    textAlign: 'center',
    lineHeight: 20,
  },
  addChapterArea: {
    marginTop: 8,
  },
  addChapterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1.5,
    borderStyle: 'dashed',
  },
  addChapterText: {
    fontSize: 15,
    fontFamily: 'Inter_600SemiBold',
  },
  addChapterForm: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 16,
    gap: 12,
  },
  chapterInput: {
    fontSize: 18,
    fontFamily: 'Inter_600SemiBold',
    paddingVertical: 4,
  },
  addChapterButtons: {
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
  developBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
  },
  developBannerIcon: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  developBannerTitle: {
    fontSize: 14,
    fontFamily: 'Inter_700Bold',
    marginBottom: 2,
  },
  developBannerSub: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    lineHeight: 17,
  },
  synopsisCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    gap: 0,
  },
  synopsisHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  synopsisHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  synopsisTitle: {
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
  },
  synopsisBadge: {
    borderRadius: 10,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  synopsisBadgeText: {
    fontSize: 11,
    fontFamily: 'Inter_600SemiBold',
  },
  synopsisBody: {
    marginTop: 12,
    gap: 8,
  },
  synopsisInput: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    minHeight: 120,
    lineHeight: 21,
  },
  synopsisWordRow: { gap: 4 },
  synopsisWordBar: { height: 3, borderRadius: 2, overflow: 'hidden' },
  synopsisWordFill: { height: 3, borderRadius: 2 },
  synopsisWordCount: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    textAlign: 'right',
  },
  synopsisUploadBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
  },
  synopsisUploadText: {
    fontSize: 13,
    fontFamily: 'Inter_600SemiBold',
  },
  charSection: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    gap: 10,
  },
  charHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  charHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  charSectionLabel: {
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
  },
  charAddBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
  },
  charAddBtnText: {
    fontSize: 13,
    fontFamily: 'Inter_600SemiBold',
  },
  charEmptyText: {
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    lineHeight: 18,
  },
  charChipRow: {
    flexDirection: 'row',
  },
  charChip: {
    borderRadius: 20,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
    alignItems: 'center',
  },
  charChipName: {
    fontSize: 13,
    fontFamily: 'Inter_600SemiBold',
  },
  charChipRole: {
    fontSize: 11,
    fontFamily: 'Inter_400Regular',
    marginTop: 1,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: '#00000055',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderWidth: 1,
    padding: 24,
    gap: 14,
    maxWidth: 600,
    alignSelf: 'center',
    width: '100%',
  },
  modalTitle: {
    fontSize: 18,
    fontFamily: 'Inter_700Bold',
  },
  modalInput: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 16,
    fontFamily: 'Inter_400Regular',
  },
  modalRoleLabel: {
    fontSize: 12,
    fontFamily: 'Inter_500Medium',
    letterSpacing: 0.5,
    marginBottom: -6,
  },
  modalRoleRow: {
    flexDirection: 'row',
  },
  modalRoleChip: {
    borderRadius: 20,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 7,
    marginRight: 8,
  },
  modalRoleChipText: {
    fontSize: 13,
    fontFamily: 'Inter_500Medium',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
    marginTop: 4,
  },
  modalDeleteBtn: {
    width: 40,
    height: 40,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCancelBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
  },
  modalCancelText: {
    fontSize: 15,
    fontFamily: 'Inter_500Medium',
  },
  modalSaveBtn: {
    flex: 2,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  modalSaveText: {
    fontSize: 15,
    fontFamily: 'Inter_600SemiBold',
  },
  splitOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
    paddingHorizontal: 16,
    paddingBottom: 32,
  },
  splitCard: {
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 10 },
    elevation: 16,
    maxHeight: '85%' as unknown as number,
  },
  splitHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 18 },
  splitIconWrap: { width: 38, height: 38, borderRadius: 11, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  splitTitle: { fontSize: 15, fontFamily: 'Inter_700Bold', marginBottom: 2 },
  splitSubtitle: { fontSize: 12, fontFamily: 'Inter_400Regular' },
  splitBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, flexShrink: 0 },
  splitBadgeText: { fontSize: 12, fontFamily: 'Inter_600SemiBold' },
  splitBody: { fontSize: 13, fontFamily: 'Inter_400Regular', lineHeight: 19, paddingHorizontal: 18, paddingBottom: 12 },
  splitScroll: { maxHeight: 300, paddingHorizontal: 18 },
  splitSegCard: { borderWidth: 1, borderRadius: 14, padding: 12, marginBottom: 10 },
  splitSegRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  splitSegNum: { width: 22, height: 22, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  splitSegNumText: { color: '#fff', fontSize: 11, fontFamily: 'Inter_700Bold' },
  splitSegMeta: { fontSize: 12, fontFamily: 'Inter_400Regular' },
  splitNameInput: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8, fontSize: 14, fontFamily: 'Inter_400Regular' },
  splitActions: { flexDirection: 'row', gap: 10, padding: 18, paddingTop: 14 },
  splitKeepBtn: { flex: 1, borderWidth: 1, borderRadius: 14, paddingVertical: 13, alignItems: 'center', justifyContent: 'center' },
  splitKeepText: { fontSize: 14, fontFamily: 'Inter_500Medium' },
  splitDoBtn: { flex: 2, borderRadius: 14, paddingVertical: 13, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 7 },
  splitDoBtnText: { color: '#fff', fontSize: 15, fontFamily: 'Inter_700Bold' },
  splitQueueBadge: { paddingHorizontal: 7, paddingVertical: 2, borderRadius: 10 },
  splitQueueBadgeText: { color: '#fff', fontSize: 10, fontFamily: 'Inter_700Bold' },
  splitBanner: { flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: 14, borderWidth: 1, padding: 14, marginTop: 14 },
  splitBannerIcon: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  splitBannerTitle: { fontSize: 13, fontFamily: 'Inter_600SemiBold', marginBottom: 2 },
  splitBannerSub: { fontSize: 12, fontFamily: 'Inter_400Regular' },
  splitAddChapterBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginHorizontal: 18,
    marginBottom: 4,
    borderRadius: 14,
    padding: 14,
  },
  splitAddChapterTitle: { color: '#fff', fontSize: 15, fontFamily: 'Inter_700Bold', marginBottom: 1 },
  splitAddChapterSub: { color: 'rgba(255,255,255,0.8)', fontSize: 12, fontFamily: 'Inter_400Regular' },
  splitOrLabel: { textAlign: 'center', fontSize: 12, fontFamily: 'Inter_400Regular', marginVertical: 10 },
  deleteOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  deleteCard: {
    width: '100%',
    borderRadius: 20,
    borderWidth: 1,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.18,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 10,
  },
  deleteIconWrap: {
    width: 52,
    height: 52,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  deleteTitle: { fontSize: 18, fontFamily: 'Inter_700Bold', marginBottom: 8, textAlign: 'center' },
  deleteBody: { fontSize: 14, fontFamily: 'Inter_400Regular', lineHeight: 20, textAlign: 'center', marginBottom: 22 },
  deleteConfirmBtn: {
    width: '100%',
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    marginBottom: 10,
  },
  deleteConfirmText: { color: '#fff', fontSize: 16, fontFamily: 'Inter_700Bold' },
  deleteCancelBtn: {
    width: '100%',
    paddingVertical: 13,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
  },
  deleteCancelText: { fontSize: 15, fontFamily: 'Inter_500Medium' },
});
