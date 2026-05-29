import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { router, useLocalSearchParams, useNavigation } from 'expo-router';
import React, { useLayoutEffect, useMemo, useState } from 'react';
import {
  Alert,
  FlatList,
  Modal,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useBooks } from '@/context/BookContext';
import { useColors } from '@/hooks/useColors';
import { Book, Folder, FOLDER_COLORS, FolderColor } from '@/types';

const UNFILED_ID = 'unfiled';

function BookCard({
  book,
  onPress,
  onLongPress,
}: {
  book: Book;
  onPress: () => void;
  onLongPress: () => void;
}) {
  const colors = useColors();
  const totalSections = book.chapters.reduce((s, c) => s + c.sections.length, 0);
  const filledSections = book.chapters.reduce(
    (s, c) => s + c.sections.filter((sec) => sec.content.trim().length > 0).length,
    0
  );
  const progress = totalSections > 0 ? filledSections / totalSections : 0;
  const wordCount = book.chapters.reduce(
    (s, c) => s + c.sections.reduce((s2, sec) => s2 + sec.content.split(/\s+/).filter(Boolean).length, 0),
    0
  );
  const completedChapters = book.chapters.filter((c) => c.isComplete).length;

  return (
    <TouchableOpacity
      style={[styles.bookCard, { backgroundColor: colors.card, borderColor: colors.border }]}
      onPress={onPress}
      onLongPress={onLongPress}
      delayLongPress={450}
      activeOpacity={0.85}
    >
      <View style={styles.cardTop}>
        <View style={[styles.genreBadge, { backgroundColor: colors.secondary }]}>
          <Text style={[styles.genreText, { color: colors.primary }]}>{book.genre}</Text>
        </View>
        {book.chapters.length > 0 && completedChapters === book.chapters.length && (
          <View style={[styles.completeBadge, { backgroundColor: colors.accent }]}>
            <Feather name="check" size={10} color="#fff" />
            <Text style={styles.completeText}>Complete</Text>
          </View>
        )}
      </View>
      <Text style={[styles.bookTitle, { color: colors.foreground }]} numberOfLines={2}>
        {book.title}
      </Text>
      {book.description.length > 0 && (
        <Text style={[styles.bookDesc, { color: colors.mutedForeground }]} numberOfLines={2}>
          {book.description}
        </Text>
      )}
      {book.chapters.length > 0 && (
        <View style={styles.progressContainer}>
          <View style={[styles.progressTrack, { backgroundColor: colors.border }]}>
            <View
              style={[styles.progressFill, { backgroundColor: colors.primary, width: `${progress * 100}%` }]}
            />
          </View>
          <Text style={[styles.progressPct, { color: colors.mutedForeground }]}>
            {Math.round(progress * 100)}%
          </Text>
        </View>
      )}
      <View style={styles.bookMeta}>
        <View style={styles.metaItem}>
          <Feather name="book-open" size={12} color={colors.mutedForeground} />
          <Text style={[styles.metaText, { color: colors.mutedForeground }]}>
            {book.chapters.length} {book.chapters.length === 1 ? 'chapter' : 'chapters'}
          </Text>
        </View>
        {wordCount > 0 && (
          <View style={styles.metaItem}>
            <Feather name="edit-3" size={12} color={colors.mutedForeground} />
            <Text style={[styles.metaText, { color: colors.mutedForeground }]}>
              {wordCount.toLocaleString()} words
            </Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}

export default function FolderDetailScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const { folderId } = useLocalSearchParams<{ folderId: string }>();
  const { books, folders, assignBookToFolder, updateFolder, deleteFolder } = useBooks();

  const isUnfiled = folderId === UNFILED_ID;
  const folder = isUnfiled ? null : folders.find((f) => f.id === folderId);

  const folderBooks = useMemo(() => {
    if (isUnfiled) return books.filter((b) => !b.folderId);
    return books.filter((b) => b.folderId === folderId);
  }, [books, folderId, isUnfiled]);

  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editName, setEditName] = useState(folder?.name ?? '');
  const [editColor, setEditColor] = useState<FolderColor>(folder?.color ?? '#2D4A3E');
  const [assignTarget, setAssignTarget] = useState<Book | null>(null);
  const [moveSubView, setMoveSubView] = useState<'list' | 'create'>('list');
  const [newFolderName, setNewFolderName] = useState('');
  const [newFolderColor, setNewFolderColor] = useState<FolderColor>('#2D4A3E');

  const { createFolder } = useBooks();

  useLayoutEffect(() => {
    navigation.setOptions({
      title: isUnfiled ? 'Unfiled' : (folder?.name ?? 'Folder'),
      headerRight: isUnfiled
        ? undefined
        : () => (
            <TouchableOpacity
              onPress={() => {
                setEditName(folder?.name ?? '');
                setEditColor(folder?.color ?? '#2D4A3E');
                setEditModalVisible(true);
              }}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              style={{ marginRight: Platform.OS === 'web' ? 8 : 4 }}
            >
              <Feather name="edit-2" size={18} color={colors.primary} />
            </TouchableOpacity>
          ),
    });
  }, [navigation, folder, isUnfiled, colors]);

  const handleSaveEdit = () => {
    if (!folder || !editName.trim()) return;
    updateFolder(folder.id, { name: editName.trim(), color: editColor });
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setEditModalVisible(false);
  };

  const handleDeleteFolder = () => {
    Alert.alert(
      'Delete Folder',
      `Delete "${folder?.name}"? Books in this folder will be moved to Unfiled.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            deleteFolder(folderId ?? '');
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
            router.back();
          },
        },
      ]
    );
  };

  const handleAssign = (targetFolderId: string | null) => {
    if (!assignTarget) return;
    assignBookToFolder(assignTarget.id, targetFolderId);
    Haptics.selectionAsync();
    setAssignTarget(null);
    setMoveSubView('list');
  };

  const handleCreateAndAssign = () => {
    if (!newFolderName.trim() || !assignTarget) return;
    const f = createFolder(newFolderName.trim(), newFolderColor);
    assignBookToFolder(assignTarget.id, f.id);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setNewFolderName('');
    setNewFolderColor('#2D4A3E');
    setAssignTarget(null);
    setMoveSubView('list');
  };

  const bottomPadding = (Platform.OS === 'web' ? 34 : insets.bottom) + 24;

  if (!isUnfiled && !folder) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Text style={[styles.emptyTitle, { color: colors.foreground }]}>Folder not found</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {!isUnfiled && folder && (
        <TouchableOpacity
          style={[styles.folderBanner, { backgroundColor: colors.secondary, borderBottomColor: colors.border }]}
          onPress={() => {
            setEditName(folder.name);
            setEditColor(folder.color);
            setEditModalVisible(true);
          }}
          activeOpacity={0.7}
        >
          <View style={[styles.colorDot, { backgroundColor: folder.color }]} />
          <Text style={[styles.bannerText, { color: colors.mutedForeground }]}>
            {folderBooks.length} {folderBooks.length === 1 ? 'book' : 'books'}
          </Text>
          <Feather name="edit-2" size={14} color={colors.mutedForeground} style={{ marginLeft: 'auto' }} />
        </TouchableOpacity>
      )}

      <FlatList
        data={folderBooks}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[styles.listContent, { paddingBottom: bottomPadding }]}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <View style={[styles.emptyIconWrap, { backgroundColor: colors.secondary }]}>
              <Feather name="folder" size={44} color={colors.primary} />
            </View>
            <Text style={[styles.emptyTitle, { color: colors.foreground }]}>No books here</Text>
            <Text style={[styles.emptyBody, { color: colors.mutedForeground }]}>
              {isUnfiled
                ? 'All books are assigned to folders.'
                : 'Long-press any book in your library to move it here.'}
            </Text>
          </View>
        }
        renderItem={({ item }) => (
          <BookCard
            book={item}
            onPress={() => {
              Haptics.selectionAsync();
              router.push({ pathname: '/book/[bookId]', params: { bookId: item.id } });
            }}
            onLongPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              setAssignTarget(item);
              setMoveSubView('list');
            }}
          />
        )}
      />

      {/* Edit Folder Modal */}
      <Modal
        visible={editModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setEditModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalSheet, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.modalHandle} />
            <Text style={[styles.modalTitle, { color: colors.foreground }]}>Edit Folder</Text>

            <Text style={[styles.inputLabel, { color: colors.mutedForeground }]}>FOLDER NAME</Text>
            <TextInput
              style={[styles.nameInput, { color: colors.foreground, borderColor: editName.trim() ? colors.primary : colors.border, backgroundColor: colors.secondary }]}
              value={editName}
              onChangeText={setEditName}
              placeholder="Folder name"
              placeholderTextColor={colors.mutedForeground}
              maxLength={50}
              autoFocus
            />

            <Text style={[styles.inputLabel, { color: colors.mutedForeground }]}>COLOR</Text>
            <View style={styles.colorRow}>
              {FOLDER_COLORS.map((c) => (
                <TouchableOpacity
                  key={c}
                  onPress={() => setEditColor(c)}
                  style={[styles.colorSwatch, { backgroundColor: c, borderWidth: editColor === c ? 3 : 0, borderColor: colors.foreground }]}
                />
              ))}
            </View>

            <View style={styles.editActions}>
              <TouchableOpacity
                style={[styles.deleteBtn, { borderColor: colors.destructive }]}
                onPress={handleDeleteFolder}
              >
                <Feather name="trash-2" size={16} color={colors.destructive} />
                <Text style={[styles.deleteBtnText, { color: colors.destructive }]}>Delete</Text>
              </TouchableOpacity>
              <View style={styles.editActionRight}>
                <TouchableOpacity
                  style={[styles.cancelBtn, { borderColor: colors.border }]}
                  onPress={() => setEditModalVisible(false)}
                >
                  <Text style={[styles.cancelBtnText, { color: colors.mutedForeground }]}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.saveBtn, { backgroundColor: editName.trim() ? colors.primary : colors.muted }]}
                  onPress={handleSaveEdit}
                  disabled={!editName.trim()}
                >
                  <Text style={[styles.saveBtnText, { color: editName.trim() ? colors.primaryForeground : colors.mutedForeground }]}>Save</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </Modal>

      {/* Move to Folder Modal */}
      <Modal
        visible={!!assignTarget}
        transparent
        animationType="slide"
        onRequestClose={() => { setAssignTarget(null); setMoveSubView('list'); }}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalSheet, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.modalHandle} />
            {moveSubView === 'list' ? (
              <>
                <Text style={[styles.modalTitle, { color: colors.foreground }]}>Move to Folder</Text>
                <Text style={[styles.modalSubtitle, { color: colors.mutedForeground }]} numberOfLines={1}>
                  "{assignTarget?.title}"
                </Text>
                {folders.map((f) => (
                  <TouchableOpacity
                    key={f.id}
                    style={[styles.folderRow, { borderBottomColor: colors.border }]}
                    onPress={() => handleAssign(f.id)}
                  >
                    <View style={[styles.rowDot, { backgroundColor: f.color }]} />
                    <Text style={[styles.folderRowName, { color: colors.foreground }]}>{f.name}</Text>
                    {assignTarget?.folderId === f.id && (
                      <Feather name="check" size={16} color={colors.primary} />
                    )}
                  </TouchableOpacity>
                ))}
                {assignTarget?.folderId && (
                  <TouchableOpacity
                    style={[styles.folderRow, { borderBottomColor: colors.border }]}
                    onPress={() => handleAssign(null)}
                  >
                    <Feather name="x" size={14} color={colors.mutedForeground} style={{ marginRight: 4 }} />
                    <Text style={[styles.folderRowName, { color: colors.mutedForeground }]}>Remove from folder</Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity
                  style={[styles.newFolderBtn, { borderColor: colors.border }]}
                  onPress={() => setMoveSubView('create')}
                >
                  <Feather name="folder-plus" size={16} color={colors.primary} />
                  <Text style={[styles.newFolderBtnText, { color: colors.primary }]}>New Folder</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => { setAssignTarget(null); setMoveSubView('list'); }}
                  style={styles.cancelFullBtn}
                >
                  <Text style={[styles.cancelFullBtnText, { color: colors.mutedForeground }]}>Cancel</Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <TouchableOpacity onPress={() => setMoveSubView('list')} style={styles.backBtn}>
                  <Feather name="arrow-left" size={18} color={colors.primary} />
                  <Text style={[styles.backBtnText, { color: colors.primary }]}>Back</Text>
                </TouchableOpacity>
                <Text style={[styles.modalTitle, { color: colors.foreground }]}>New Folder</Text>
                <Text style={[styles.inputLabel, { color: colors.mutedForeground }]}>FOLDER NAME</Text>
                <TextInput
                  style={[styles.nameInput, { color: colors.foreground, borderColor: newFolderName.trim() ? colors.primary : colors.border, backgroundColor: colors.secondary }]}
                  value={newFolderName}
                  onChangeText={setNewFolderName}
                  placeholder="Folder name"
                  placeholderTextColor={colors.mutedForeground}
                  maxLength={50}
                  autoFocus
                />
                <Text style={[styles.inputLabel, { color: colors.mutedForeground }]}>COLOR</Text>
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
                  style={[styles.saveBtn, { backgroundColor: newFolderName.trim() ? colors.primary : colors.muted, alignSelf: 'stretch', marginTop: 16 }]}
                  onPress={handleCreateAndAssign}
                  disabled={!newFolderName.trim()}
                >
                  <Text style={[styles.saveBtnText, { color: newFolderName.trim() ? colors.primaryForeground : colors.mutedForeground }]}>
                    Create &amp; Move
                  </Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  folderBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  colorDot: { width: 12, height: 12, borderRadius: 6 },
  bannerText: { fontSize: 14, fontFamily: 'Inter_400Regular' },
  listContent: { paddingHorizontal: 16, paddingTop: 16, gap: 12 },
  bookCard: { borderRadius: 16, padding: 18, borderWidth: 1, gap: 8 },
  cardTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  genreBadge: { alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  genreText: { fontSize: 11, fontFamily: 'Inter_600SemiBold', textTransform: 'uppercase', letterSpacing: 0.5 },
  completeBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 },
  completeText: { fontSize: 10, fontFamily: 'Inter_600SemiBold', color: '#fff', textTransform: 'uppercase', letterSpacing: 0.3 },
  bookTitle: { fontSize: 22, fontFamily: 'Inter_700Bold', letterSpacing: -0.3, lineHeight: 28 },
  bookDesc: { fontSize: 14, fontFamily: 'Inter_400Regular', lineHeight: 20 },
  progressContainer: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 },
  progressTrack: { flex: 1, height: 4, borderRadius: 2, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 2 },
  progressPct: { fontSize: 12, fontFamily: 'Inter_500Medium', width: 34, textAlign: 'right' },
  bookMeta: { flexDirection: 'row', gap: 14, marginTop: 2 },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: { fontSize: 12, fontFamily: 'Inter_400Regular' },
  emptyState: { alignItems: 'center', paddingTop: 80, paddingHorizontal: 32, gap: 14 },
  emptyIconWrap: { width: 100, height: 100, borderRadius: 50, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  emptyTitle: { fontSize: 24, fontFamily: 'Inter_700Bold', textAlign: 'center', letterSpacing: -0.3 },
  emptyBody: { fontSize: 15, fontFamily: 'Inter_400Regular', textAlign: 'center', lineHeight: 22 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  modalSheet: { borderTopLeftRadius: 24, borderTopRightRadius: 24, borderWidth: 1, borderBottomWidth: 0, paddingHorizontal: 24, paddingTop: 12, paddingBottom: 40, gap: 12 },
  modalHandle: { width: 36, height: 4, borderRadius: 2, backgroundColor: '#ccc', alignSelf: 'center', marginBottom: 8 },
  modalTitle: { fontSize: 20, fontFamily: 'Inter_700Bold', letterSpacing: -0.3 },
  modalSubtitle: { fontSize: 14, fontFamily: 'Inter_400Regular', marginTop: -6, marginBottom: 4 },
  inputLabel: { fontSize: 11, fontFamily: 'Inter_600SemiBold', letterSpacing: 1, marginTop: 4 },
  nameInput: { borderRadius: 12, borderWidth: 1.5, padding: 14, fontSize: 16, fontFamily: 'Inter_500Medium' },
  colorRow: { flexDirection: 'row', gap: 12, paddingVertical: 4 },
  colorSwatch: { width: 36, height: 36, borderRadius: 18 },
  folderRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 14, borderBottomWidth: 1 },
  rowDot: { width: 14, height: 14, borderRadius: 7 },
  folderRowName: { flex: 1, fontSize: 16, fontFamily: 'Inter_500Medium' },
  newFolderBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 14, borderTopWidth: 1 },
  newFolderBtnText: { fontSize: 15, fontFamily: 'Inter_600SemiBold' },
  cancelFullBtn: { alignItems: 'center', paddingVertical: 12 },
  cancelFullBtnText: { fontSize: 15, fontFamily: 'Inter_500Medium' },
  backBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
  backBtnText: { fontSize: 15, fontFamily: 'Inter_500Medium' },
  editActions: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 },
  editActionRight: { flexDirection: 'row', gap: 10 },
  deleteBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20, borderWidth: 1 },
  deleteBtnText: { fontSize: 14, fontFamily: 'Inter_600SemiBold' },
  cancelBtn: { paddingHorizontal: 18, paddingVertical: 10, borderRadius: 20, borderWidth: 1 },
  cancelBtnText: { fontSize: 14, fontFamily: 'Inter_600SemiBold' },
  saveBtn: { paddingHorizontal: 24, paddingVertical: 10, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  saveBtnText: { fontSize: 14, fontFamily: 'Inter_600SemiBold' },
});
