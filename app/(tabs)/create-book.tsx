import { Feather } from '@expo/vector-icons';
import { useAuth } from '@clerk/expo';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { useNavigation } from 'expo-router';
import React, { useLayoutEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { API_BASE } from '@/constants/api';
import { KeyboardAwareScrollViewCompat as KeyboardAwareScrollView } from '@/components/KeyboardAwareScrollViewCompat';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useBooks } from '@/context/BookContext';
import { useColors } from '@/hooks/useColors';
import { useTranslation } from 'react-i18next';
import { ALL_GENRES, Folder, FOLDER_COLORS, FolderColor, Genre } from '@/types';
import { getWorkLabel } from '@/lib/workLabel';

const FORMAT_HINT_KEYS: Partial<Record<Genre, { icon: string; title: string; bullets: [string, string, string] }>> = {
  Poem: {
    icon: 'feather',
    title: 'Poetry format',
    bullets: [
      'Each chapter is a poem — use sections for stanzas, verses, or notes',
      'The AI respects meter, imagery, and voice from your description',
      'Export as a poetry collection with custom heading fonts',
    ],
  },
  Screenplay: {
    icon: 'film',
    title: 'Screenplay format',
    bullets: [
      'Chapters map to scenes — sections follow: slug line → action → character → dialogue',
      'AI drafts in proper screenplay format using your genre, tone, and characters',
      'Export with Courier typeface and standard script layout',
    ],
  },
  'Comic Book': {
    icon: 'grid',
    title: 'Comic Book format',
    bullets: [
      'Each chapter is an issue — sections become panels or sequences',
      'Use the Panel button in any chapter to generate AI comic art from your scene text',
      'Use Character Genesis to build your cast with silhouettes, turnarounds, and renders',
    ],
  },
};

function wordCount(text: string) {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

export default function CreateBookScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const { signOut, getToken } = useAuth();
  const { t } = useTranslation();
  const { createBook, folders, assignBookToFolder, createFolder } = useBooks();

  const [title, setTitle] = useState('');
  const [genre, setGenre] = useState<Genre>('Fiction');
  const [description, setDescription] = useState('');

  const [folderPickerVisible, setFolderPickerVisible] = useState(false);
  const [pendingBookId, setPendingBookId] = useState<string | null>(null);
  const [pickerSubView, setPickerSubView] = useState<'list' | 'create'>('list');
  const [newFolderName, setNewFolderName] = useState('');
  const [newFolderColor, setNewFolderColor] = useState<FolderColor>('#2D4A3E');
  const [genLoading, setGenLoading] = useState(false);

  const isComicBook = genre === 'Comic Book';
  const descMinMet = !isComicBook || description.trim().length >= 50;
  const canCreate = title.trim().length > 0 && descMinMet;
  const descWords = wordCount(description);

  const handleGenerateDescription = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setGenLoading(true);
    try {
      const token = await getToken();
      if (!token) throw new Error('Not signed in — please restart the app and try again.');
      const url = `${API_BASE}/ai-studio/generate-book-description`;
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ title: title.trim() || 'Untitled Comic', genre }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({})) as { error?: string };
        throw new Error(body.error ?? `Server returned ${res.status}`);
      }
      const { description: generated } = await res.json() as { description: string };
      setDescription(generated);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      console.error('[AutoGen]', msg);
      Alert.alert('Generation failed', msg);
    } finally {
      setGenLoading(false);
    }
  };

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <TouchableOpacity
          onPress={() => { Haptics.selectionAsync(); signOut(); }}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          style={{ marginRight: Platform.OS === 'web' ? 8 : 0 }}
        >
          <Feather name="log-out" size={18} color={colors.mutedForeground} />
        </TouchableOpacity>
      ),
    });
  }, [navigation, colors, signOut]);

  const handleCreate = () => {
    if (!canCreate) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const book = createBook(title.trim(), genre, description.trim());
    setPendingBookId(book.id);
    setPickerSubView(folders.length > 0 ? 'list' : 'create');
    setFolderPickerVisible(true);
  };

  const handleSkipFolder = () => {
    setFolderPickerVisible(false);
    if (pendingBookId) {
      router.replace({ pathname: '/book/[bookId]', params: { bookId: pendingBookId } });
    }
    setPendingBookId(null);
  };

  const handleAssignFolder = (folder: Folder) => {
    if (!pendingBookId) return;
    assignBookToFolder(pendingBookId, folder.id);
    Haptics.selectionAsync();
    setFolderPickerVisible(false);
    router.replace({ pathname: '/book/[bookId]', params: { bookId: pendingBookId } });
    setPendingBookId(null);
  };

  const handleCreateAndAssign = () => {
    if (!newFolderName.trim() || !pendingBookId) return;
    const f = createFolder(newFolderName.trim(), newFolderColor);
    assignBookToFolder(pendingBookId, f.id);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setFolderPickerVisible(false);
    router.replace({ pathname: '/book/[bookId]', params: { bookId: pendingBookId } });
    setPendingBookId(null);
    setNewFolderName('');
    setNewFolderColor('#2D4A3E');
  };

  const bottomPadding = (Platform.OS === 'web' ? 34 : insets.bottom) + 16;

  return (
    <>
      <KeyboardAwareScrollView
        style={[styles.container, { backgroundColor: colors.background }]}
        contentContainerStyle={[styles.content, { paddingBottom: bottomPadding }]}
        bottomOffset={24}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Text style={[styles.label, { color: colors.mutedForeground }]}>{t('createBook.bookTitle').toUpperCase()}</Text>
        <TextInput
          style={[
            styles.titleInput,
            { color: colors.foreground, borderBottomColor: title.length > 0 ? colors.primary : colors.border },
          ]}
          placeholder={t('createBook.bookTitlePlaceholder')}
          placeholderTextColor={colors.mutedForeground}
          value={title}
          onChangeText={setTitle}
          maxLength={120}
          autoFocus
          returnKeyType="next"
        />
        <Text style={[styles.charCount, { color: colors.mutedForeground }]}>{title.length}/120</Text>

        <Text style={[styles.label, { color: colors.mutedForeground }]}>{t('createBook.genre').toUpperCase()}</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.genreRow}
        >
          {ALL_GENRES.map((g) => {
            const selected = g === genre;
            return (
              <TouchableOpacity
                key={g}
                onPress={() => { Haptics.selectionAsync(); setGenre(g); }}
                style={[
                  styles.genrePill,
                  {
                    backgroundColor: selected ? colors.primary : colors.secondary,
                    borderColor: selected ? colors.primary : colors.border,
                  },
                ]}
                activeOpacity={0.8}
              >
                <Text
                  style={[
                    styles.genrePillText,
                    { color: selected ? colors.primaryForeground : colors.secondaryForeground },
                  ]}
                >
                  {t(`genres.${g}`, g)}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Quick-start buttons for special formats */}
        <View style={styles.quickStartRow}>
          <TouchableOpacity
            onPress={() => { Haptics.selectionAsync(); setGenre('Poem'); }}
            style={[
              styles.quickStartBtn,
              {
                backgroundColor: genre === 'Poem' ? colors.primary : colors.card,
                borderColor: genre === 'Poem' ? colors.primary : colors.border,
              },
            ]}
            activeOpacity={0.8}
          >
            <Feather name="feather" size={16} color={genre === 'Poem' ? colors.primaryForeground : colors.primary} />
            <Text style={[styles.quickStartText, { color: genre === 'Poem' ? colors.primaryForeground : colors.foreground }]}>
              {t('createBook.writePoem', 'Write a Poem')}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => { Haptics.selectionAsync(); setGenre('Screenplay'); }}
            style={[
              styles.quickStartBtn,
              {
                backgroundColor: genre === 'Screenplay' ? colors.primary : colors.card,
                borderColor: genre === 'Screenplay' ? colors.primary : colors.border,
              },
            ]}
            activeOpacity={0.8}
          >
            <Feather name="film" size={16} color={genre === 'Screenplay' ? colors.primaryForeground : colors.primary} />
            <Text style={[styles.quickStartText, { color: genre === 'Screenplay' ? colors.primaryForeground : colors.foreground }]}>
              {t('createBook.writeScreenplay', 'Write a Screenplay')}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => { Haptics.selectionAsync(); setGenre('Comic Book'); }}
            style={[
              styles.quickStartBtn,
              {
                backgroundColor: genre === 'Comic Book' ? colors.primary : colors.card,
                borderColor: genre === 'Comic Book' ? colors.primary : colors.border,
              },
            ]}
            activeOpacity={0.8}
          >
            <Feather name="grid" size={16} color={genre === 'Comic Book' ? colors.primaryForeground : colors.primary} />
            <Text style={[styles.quickStartText, { color: genre === 'Comic Book' ? colors.primaryForeground : colors.foreground }]}>
              Make a Comic Book
            </Text>
          </TouchableOpacity>
        </View>

        {FORMAT_HINT_KEYS[genre] && (() => {
          const hint = FORMAT_HINT_KEYS[genre]!;
          return (
            <View style={[styles.formatHint, { backgroundColor: colors.card, borderColor: colors.primary }]}>
              <View style={styles.formatHintHeader}>
                <Feather name={hint.icon as never} size={15} color={colors.primary} />
                <Text style={[styles.formatHintTitle, { color: colors.primary }]}>{hint.title}</Text>
              </View>
              {hint.bullets.map((bullet, i) => (
                <View key={i} style={styles.formatHintRow}>
                  <Text style={[styles.formatHintDot, { color: colors.primary }]}>•</Text>
                  <Text style={[styles.formatHintText, { color: colors.mutedForeground }]}>{bullet}</Text>
                </View>
              ))}
            </View>
          );
        })()}

        <View style={styles.labelRow}>
          <Text style={[styles.label, { color: colors.mutedForeground }]}>
            {t('createBook.description').toUpperCase()}{' '}
            {isComicBook
              ? <Text style={[styles.optional, { color: colors.primary }]}>(min 50 chars)</Text>
              : <Text style={[styles.optional, { color: colors.mutedForeground }]}>({t('common.optional').toLowerCase()})</Text>
            }
          </Text>
          <View style={styles.descLabelRight}>
            {isComicBook && (
              <TouchableOpacity
                onPress={handleGenerateDescription}
                disabled={genLoading}
                style={[styles.genBtn, { backgroundColor: colors.primary, opacity: genLoading ? 0.6 : 1 }]}
                activeOpacity={0.8}
              >
                {genLoading
                  ? <ActivityIndicator size={12} color={colors.primaryForeground} />
                  : <Feather name="zap" size={12} color={colors.primaryForeground} />
                }
                <Text style={[styles.genBtnText, { color: colors.primaryForeground }]}>
                  {genLoading ? 'Generating…' : 'Auto Generate'}
                </Text>
              </TouchableOpacity>
            )}
            {!isComicBook && (
              <Text style={[styles.wordCountLabel, { color: descWords > 1000 ? colors.destructive : colors.mutedForeground }]}>
                {descWords} / 1,000 {t('common.words')}
              </Text>
            )}
          </View>
        </View>
        <TextInput
          style={[
            styles.descInput,
            {
              color: colors.foreground,
              backgroundColor: colors.card,
              borderColor: descWords > 1000
                ? colors.destructive
                : isComicBook && description.trim().length > 0 && !descMinMet
                ? colors.destructive
                : isComicBook && descMinMet && description.trim().length > 0
                ? colors.primary
                : colors.border,
            },
          ]}
          placeholder={isComicBook
            ? 'Describe your hero, their world, the central conflict, and the visual tone…'
            : t('createBook.descriptionPlaceholder')}
          placeholderTextColor={colors.mutedForeground}
          value={description}
          onChangeText={setDescription}
          multiline
          textAlignVertical="top"
        />
        {isComicBook && (
          <Text style={[
            styles.charHint,
            { color: descMinMet ? colors.primary : description.trim().length > 0 ? colors.destructive : colors.mutedForeground },
          ]}>
            {description.trim().length} / 50 min chars{descMinMet ? ' ✓' : ''}
          </Text>
        )}

        {isComicBook && (
          <View style={[styles.tabletBanner, { backgroundColor: '#1D4ED820', borderColor: '#1D4ED840' }]}>
            <Feather name="tablet" size={13} color="#1D4ED8" />
            <Text style={[styles.tabletBannerText, { color: '#1D4ED8' }]}>
              Comic Book — best experienced on iPad & Android Tablet
            </Text>
          </View>
        )}

        <View style={styles.tip}>
          <Feather name="info" size={14} color={colors.accent} />
          <Text style={[styles.tipText, { color: colors.mutedForeground }]}>
            {genre === 'Poem'
              ? 'A detailed description helps the AI craft stanzas that stay true to your poem\'s voice, theme, and style.'
              : genre === 'Screenplay'
              ? 'A detailed description helps the AI craft scenes that stay true to your script\'s tone, characters, and structure.'
              : genre === 'Comic Book'
              ? 'Describe your story world, main characters, and tone — the AI will draft panel-by-panel scenes and you can generate comic art directly from any chapter.'
              : 'A detailed description helps the AI craft chapters that stay true to your book\'s voice, characters, and world.'}
          </Text>
        </View>

        <TouchableOpacity
          style={[styles.createButton, { backgroundColor: canCreate ? colors.primary : colors.muted }]}
          onPress={handleCreate}
          disabled={!canCreate}
          activeOpacity={0.85}
        >
          <Feather name="feather" size={18} color={canCreate ? colors.primaryForeground : colors.mutedForeground} />
          <Text style={[styles.createButtonText, { color: canCreate ? colors.primaryForeground : colors.mutedForeground }]}>
            {t('library.startWriting')}
          </Text>
        </TouchableOpacity>
      </KeyboardAwareScrollView>

      {/* Add to Folder picker — appears after book is created if folders exist */}
      <Modal
        visible={folderPickerVisible}
        transparent
        animationType="slide"
        onRequestClose={handleSkipFolder}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalSheet, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.modalHandle} />
            {pickerSubView === 'list' ? (
              <>
                <Text style={[styles.modalTitle, { color: colors.foreground }]}>{t('createBook.addToFolder')}</Text>
                <Text style={[styles.modalSubtitle, { color: colors.mutedForeground }]}>
                  {t('library.continueWriting')}
                </Text>
                {folders.map((f) => (
                  <TouchableOpacity
                    key={f.id}
                    style={[styles.folderRow, { borderBottomColor: colors.border }]}
                    onPress={() => handleAssignFolder(f)}
                  >
                    <View style={[styles.rowDot, { backgroundColor: f.color }]} />
                    <Text style={[styles.folderRowName, { color: colors.foreground }]}>{f.name}</Text>
                    <Feather name="chevron-right" size={16} color={colors.mutedForeground} />
                  </TouchableOpacity>
                ))}
                <TouchableOpacity
                  style={[styles.newFolderBtn, { borderColor: colors.border }]}
                  onPress={() => setPickerSubView('create')}
                >
                  <Feather name="folder-plus" size={16} color={colors.primary} />
                  <Text style={[styles.newFolderBtnText, { color: colors.primary }]}>{t('createBook.createNewFolder')}</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={handleSkipFolder} style={styles.skipBtn}>
                  <Text style={[styles.skipBtnText, { color: colors.mutedForeground }]}>{t('library.noFolder')}</Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <TouchableOpacity onPress={() => setPickerSubView('list')} style={styles.backBtn}>
                  <Feather name="arrow-left" size={18} color={colors.primary} />
                  <Text style={[styles.backBtnText, { color: colors.primary }]}>{t('common.back')}</Text>
                </TouchableOpacity>
                <Text style={[styles.modalTitle, { color: colors.foreground }]}>{t('library.createFolder')}</Text>
                <Text style={[styles.inputLabel, { color: colors.mutedForeground }]}>{t('library.folderName').toUpperCase()}</Text>
                <TextInput
                  style={[styles.nameInput, { color: colors.foreground, borderColor: newFolderName.trim() ? colors.primary : colors.border, backgroundColor: colors.secondary }]}
                  value={newFolderName}
                  onChangeText={setNewFolderName}
                  placeholder="e.g. Romance Series"
                  placeholderTextColor={colors.mutedForeground}
                  maxLength={50}
                  autoFocus
                />
                <Text style={[styles.inputLabel, { color: colors.mutedForeground }]}>{t('createBook.folderColor').toUpperCase()}</Text>
                <View style={styles.colorRow}>
                  {FOLDER_COLORS.map((c) => (
                    <TouchableOpacity
                      key={c}
                      onPress={() => setNewFolderColor(c)}
                      style={[styles.colorSwatch, { backgroundColor: c, borderWidth: newFolderColor === c ? 3 : 0, borderColor: colors.foreground }]}
                    />
                  ))}
                </View>
                <TouchableOpacity
                  style={[styles.createAndMoveBtn, { backgroundColor: newFolderName.trim() ? colors.primary : colors.muted }]}
                  onPress={handleCreateAndAssign}
                  disabled={!newFolderName.trim()}
                >
                  <Text style={[styles.createAndMoveBtnText, { color: newFolderName.trim() ? colors.primaryForeground : colors.mutedForeground }]}>
                    {t('common.create')} &amp; {t('common.add')}
                  </Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingHorizontal: 20, paddingTop: 24, gap: 8 },
  labelRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 16, marginBottom: 2 },
  label: { fontSize: 11, fontFamily: 'Inter_600SemiBold', letterSpacing: 1, marginTop: 16, marginBottom: 2 },
  optional: { fontFamily: 'Inter_400Regular', textTransform: 'none', letterSpacing: 0 },
  wordCountLabel: { fontSize: 11, fontFamily: 'Inter_500Medium' },
  titleInput: { fontSize: 26, fontFamily: 'Inter_700Bold', borderBottomWidth: 2, paddingVertical: 8, letterSpacing: -0.3 },
  charCount: { fontSize: 11, fontFamily: 'Inter_400Regular', textAlign: 'right', marginTop: 2 },
  genreRow: { flexDirection: 'row', gap: 8, paddingVertical: 8, paddingRight: 20 },
  genrePill: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1 },
  genrePillText: { fontSize: 13, fontFamily: 'Inter_500Medium' },
  descInput: { borderRadius: 12, borderWidth: 1, padding: 14, fontSize: 15, fontFamily: 'Inter_400Regular', lineHeight: 22, minHeight: 180 },
  formatHint: { marginTop: 12, marginBottom: 4, padding: 14, borderRadius: 12, borderWidth: 1, gap: 8 },
  formatHintHeader: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  formatHintTitle: { fontSize: 14, fontFamily: 'Inter_600SemiBold' },
  formatHintRow: { flexDirection: 'row', gap: 8, paddingLeft: 2 },
  formatHintDot: { fontSize: 13, lineHeight: 19, fontFamily: 'Inter_600SemiBold' },
  formatHintText: { flex: 1, fontSize: 13, fontFamily: 'Inter_400Regular', lineHeight: 19 },
  tabletBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 10,
    borderWidth: 1,
    marginTop: 10,
  },
  tabletBannerText: { fontSize: 12, fontFamily: 'Inter_600SemiBold', flex: 1 },
  tip: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, backgroundColor: 'transparent', marginTop: 8, paddingHorizontal: 4 },
  tipText: { flex: 1, fontSize: 13, fontFamily: 'Inter_400Regular', lineHeight: 19 },
  createButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, paddingVertical: 16, borderRadius: 30, marginTop: 16 },
  createButtonText: { fontSize: 17, fontFamily: 'Inter_600SemiBold' },
  descLabelRight: { flexDirection: 'row', alignItems: 'center' },
  genBtn: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20 },
  genBtnText: { fontSize: 12, fontFamily: 'Inter_600SemiBold' },
  charHint: { fontSize: 12, fontFamily: 'Inter_500Medium', textAlign: 'right', marginTop: 4 },
  quickStartRow: { flexDirection: 'row', gap: 10, marginTop: 10, marginBottom: 2 },
  quickStartBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1.5,
  },
  quickStartText: { fontSize: 14, fontFamily: 'Inter_600SemiBold' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  modalSheet: { borderTopLeftRadius: 24, borderTopRightRadius: 24, borderWidth: 1, borderBottomWidth: 0, paddingHorizontal: 24, paddingTop: 12, paddingBottom: 48, gap: 12 },
  modalHandle: { width: 36, height: 4, borderRadius: 2, backgroundColor: '#ccc', alignSelf: 'center', marginBottom: 8 },
  modalTitle: { fontSize: 20, fontFamily: 'Inter_700Bold', letterSpacing: -0.3 },
  modalSubtitle: { fontSize: 14, fontFamily: 'Inter_400Regular', marginTop: -4 },
  inputLabel: { fontSize: 11, fontFamily: 'Inter_600SemiBold', letterSpacing: 1, marginTop: 4 },
  nameInput: { borderRadius: 12, borderWidth: 1.5, padding: 14, fontSize: 16, fontFamily: 'Inter_500Medium' },
  colorRow: { flexDirection: 'row', gap: 12, paddingVertical: 4 },
  colorSwatch: { width: 36, height: 36, borderRadius: 18 },
  folderRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 14, borderBottomWidth: 1 },
  rowDot: { width: 14, height: 14, borderRadius: 7 },
  folderRowName: { flex: 1, fontSize: 16, fontFamily: 'Inter_500Medium' },
  newFolderBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 14, borderTopWidth: 1 },
  newFolderBtnText: { fontSize: 15, fontFamily: 'Inter_600SemiBold' },
  skipBtn: { alignItems: 'center', paddingVertical: 12 },
  skipBtnText: { fontSize: 15, fontFamily: 'Inter_500Medium' },
  backBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
  backBtnText: { fontSize: 15, fontFamily: 'Inter_500Medium' },
  createAndMoveBtn: { borderRadius: 20, paddingVertical: 14, alignItems: 'center', marginTop: 8 },
  createAndMoveBtnText: { fontSize: 16, fontFamily: 'Inter_600SemiBold' },
});
