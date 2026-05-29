import { useAuth, useUser } from '@clerk/expo';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { type Href, router } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  Dimensions,
  FlatList,
  Image,
  Modal,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';
import { TouchableOpacity as GHTouchableOpacity } from 'react-native-gesture-handler';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  useSharedValue,
} from 'react-native-reanimated';

import AsyncStorage from '@react-native-async-storage/async-storage';

import {
  DragFloatingCard,
  DraggableBookCard,
  DroppableFolderCard,
  FolderPosition,
} from '@/components/DragDrop';
import { useBooks } from '@/context/BookContext';
import { useColors } from '@/hooks/useColors';
import { useOnboarding } from '@/hooks/useOnboarding';
import { useSubscription } from '@/lib/revenuecat';
import { Book, Folder, FOLDER_COLORS, FolderColor } from '@/types';
import { useTranslation } from 'react-i18next';

const TERMS_ACCEPTED_BASE_KEY = '@CAS:terms_accepted';

const AUTHOR_QUOTES = [
  { text: 'There is no greater agony than bearing an untold story inside you.', author: 'Maya Angelou' },
  { text: 'Start writing, no matter what. The water does not flow until the faucet is turned on.', author: 'Louis L\'Amour' },
  { text: 'You can always edit a bad page. You can\'t edit a blank page.', author: 'Jodi Picoult' },
  { text: 'The first draft is just you telling yourself the story.', author: 'Terry Pratchett' },
  { text: 'If there\'s a book that you want to read, but it hasn\'t been written yet, then you must write it.', author: 'Toni Morrison' },
  { text: 'A reader lives a thousand lives before he dies. The man who never reads lives only one.', author: 'George R.R. Martin' },
  { text: 'You must stay drunk on writing so reality cannot destroy you.', author: 'Ray Bradbury' },
  { text: 'Either write something worth reading or do something worth writing.', author: 'Benjamin Franklin' },
  { text: 'The scariest moment is always just before you start.', author: 'Stephen King' },
  { text: 'Writing is the painting of the voice.', author: 'Voltaire' },
  // Shakespeare
  { text: 'All the world\'s a stage, and all the men and women merely players.', author: 'William Shakespeare' },
  { text: 'We know what we are, but know not what we may be.', author: 'William Shakespeare' },
  { text: 'Words without thoughts never to heaven go.', author: 'William Shakespeare' },
  { text: 'The pen is mightier than the sword, but no match for the actor.', author: 'William Shakespeare' },
  { text: 'What\'s in a name? That which we call a rose by any other name would smell as sweet.', author: 'William Shakespeare' },
  // Lord Byron
  { text: 'If I don\'t write to empty my mind, I go mad.', author: 'Lord Byron' },
  { text: 'The great object of life is sensation — to feel that we exist, even though in pain.', author: 'Lord Byron' },
  { text: 'I am the very slave of circumstance and impulse — borne away with every breath!', author: 'Lord Byron' },
  { text: 'There is pleasure in the pathless woods, there is rapture in the lonely shore.', author: 'Lord Byron' },
  // Rimbaud
  { text: 'I is another.', author: 'Arthur Rimbaud' },
  { text: 'One must be absolutely modern.', author: 'Arthur Rimbaud' },
  { text: 'The poet makes himself a seer by a long, prodigious, and rational disordering of all the senses.', author: 'Arthur Rimbaud' },
  { text: 'Life is the farce which everyone has to perform.', author: 'Arthur Rimbaud' },
  // Fitzgerald
  { text: 'So we beat on, boats against the current, borne back ceaselessly into the past.', author: 'F. Scott Fitzgerald' },
  { text: 'You don\'t write because you want to say something; you write because you have something to say.', author: 'F. Scott Fitzgerald' },
  { text: 'The test of a first-rate intelligence is the ability to hold two opposed ideas in mind at the same time.', author: 'F. Scott Fitzgerald' },
  { text: 'All good writing is swimming under water and holding your breath.', author: 'F. Scott Fitzgerald' },
  { text: 'Writers aren\'t people exactly. Or, if they\'re any good, they\'re a whole lot of people trying to be one person.', author: 'F. Scott Fitzgerald' },
];

const QUOTE_INTERVAL = 8000;

function QuoteCard() {
  const colors = useColors();
  const [index, setIndex] = useState(() => Math.floor(Math.random() * AUTHOR_QUOTES.length));
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    timerRef.current = setInterval(() => {
      setIndex((i) => (i + 1) % AUTHOR_QUOTES.length);
    }, QUOTE_INTERVAL);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const quote = AUTHOR_QUOTES[index];

  return (
    <View style={[quoteStyles.card, { backgroundColor: colors.secondary, borderColor: colors.border }]}> 
      <Feather name="bookmark" size={14} color={colors.accent} style={quoteStyles.icon} />
      <Text style={[quoteStyles.text, { color: colors.foreground }]}>"{quote.text}"</Text>
      <Text style={[quoteStyles.author, { color: colors.accent }]}>— {quote.author}</Text>
    </View>
  );
}

const quoteStyles = StyleSheet.create({
  card: {
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 4,
    borderRadius: 14,
    borderWidth: 1,
    padding: 16,
    gap: 8,
  },
  icon: { alignSelf: 'flex-start' },
  text: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    lineHeight: 21,
    fontStyle: 'italic',
  },
  author: {
    fontSize: 12,
    fontFamily: 'Inter_600SemiBold',
    letterSpacing: 0.2,
  },
});

function BookCard({
  book,
  onPress,
  onLongPress,
  onMenuPress,
}: {
  book: Book;
  onPress: () => void;
  onLongPress?: () => void;
  onMenuPress?: () => void;
}) {
  const colors = useColors();
  const { t } = useTranslation();
  const totalSections = book.chapters.reduce((sum, c) => sum + c.sections.length, 0);
  const filledSections = book.chapters.reduce(
    (sum, c) => sum + c.sections.filter((s) => s.content.trim().length > 0).length,
    0
  );
  const progress = totalSections > 0 ? filledSections / totalSections : 0;
  const wordCount = book.chapters.reduce(
    (sum, c) =>
      sum + c.sections.reduce((s2, sec) => s2 + sec.content.split(/\s+/).filter(Boolean).length, 0),
    0
  );
  const completedChapters = book.chapters.filter((c) => c.isComplete).length;

  const coverUri = book.coverImageUri
    ?? (book.coverImageBase64 ? `data:image/png;base64,${book.coverImageBase64}` : null);

  return (
    <TouchableOpacity
      style={[styles.bookCard, { backgroundColor: colors.card, borderColor: colors.border }]}
      onPress={onPress}
      onLongPress={onLongPress}
      delayLongPress={450}
      activeOpacity={0.85}
    >
      <View style={styles.cardRow}>
        <View style={styles.cardContent}>
          <View style={styles.cardTop}>
            <View style={[styles.genreBadge, { backgroundColor: colors.secondary }]}>
              <Text style={[styles.genreText, { color: colors.primary }]}>{book.genre}</Text>
            </View>
            <View style={styles.cardTopRight}>
              {book.chapters.length > 0 && completedChapters === book.chapters.length && (
                <View style={[styles.completeBadge, { backgroundColor: colors.accent }]}>
                  <Feather name="check" size={10} color="#fff" />
                  <Text style={styles.completeText}>{t('book.complete')}</Text>
                </View>
              )}
              {onMenuPress && (
                <GHTouchableOpacity
                  onPress={() => onMenuPress()}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  style={[styles.cardMenuBtn, { backgroundColor: colors.secondary }]}
                >
                  <Feather name="more-horizontal" size={15} color={colors.mutedForeground} />
                </GHTouchableOpacity>
              )}
            </View>
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
                {book.chapters.length} {book.chapters.length === 1 ? t('common.chapter') : t('common.chapters')}
              </Text>
            </View>
            {wordCount > 0 && (
              <View style={styles.metaItem}>
                <Feather name="edit-3" size={12} color={colors.mutedForeground} />
                <Text style={[styles.metaText, { color: colors.mutedForeground }]}> 
                  {wordCount.toLocaleString()} {t('common.words')}
                </Text>
              </View>
            )}
          </View>
        </View>

        {coverUri && (
          <Image
            source={{ uri: coverUri }}
            style={[styles.cardCoverThumb, { borderColor: colors.border }]}
            resizeMode="cover"
          />
        )}
      </View>
    </TouchableOpacity>
  );
}

function FolderCard({
  folder,
  bookCount,
  previewTitles,
  onPress,
}: {
  folder: Folder;
  bookCount: number;
  previewTitles: string[];
  onPress: () => void;
}) {
  const colors = useColors();
  const { t } = useTranslation();
  return (
    <TouchableOpacity
      style={[styles.folderCard, { backgroundColor: colors.card, borderColor: colors.border }]}
      onPress={onPress}
      activeOpacity={0.85}
    >
      <View style={[styles.folderColorBar, { backgroundColor: folder.color }]} />
      <View style={styles.folderCardBody}>
        <Text style={[styles.folderName, { color: colors.foreground }]} numberOfLines={1}>
          {folder.name}
        </Text>
        <Text style={[styles.folderCount, { color: colors.mutedForeground }]}> 
          {bookCount} {bookCount === 1 ? t('common.book') : t('common.books')}
        </Text>
        {previewTitles.length > 0 && (
          <View style={styles.previewTitles}>
            {previewTitles.map((title, i) => (
              <Text
                key={i}
                style={[styles.previewTitle, { color: colors.mutedForeground }]}
                numberOfLines={1}
              >
                · {title}
              </Text>
            ))}
          </View>
        )}
      </View>
      <Feather name="chevron-right" size={16} color={colors.mutedForeground} style={styles.folderChevron} />
    </TouchableOpacity>
  );
}

export default function LibraryScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const { width: screenWidth } = useWindowDimensions();
  const isTablet = screenWidth >= 768;
  const { books, folders, loading, assignBookToFolder, createFolder, deleteBook } = useBooks();
  const { isSubscribed } = useSubscription();
  const { signOut } = useAuth();
  const { user } = useUser();
  const { hasSeenOnboarding } = useOnboarding(user?.id);

  const [termsAccepted, setTermsAccepted] = useState<boolean | null>(null);
  const [viewMode, setViewMode] = useState<'books' | 'folders'>('books');

  const [assignTarget, setAssignTarget] = useState<Book | null>(null);
  const [moveSubView, setMoveSubView] = useState<'list' | 'create'>('list');
  const [newFolderName, setNewFolderName] = useState('');
  const [newFolderColor, setNewFolderColor] = useState<FolderColor>('#2D4A3E');
  const [createFolderVisible, setCreateFolderVisible] = useState(false);
  const [createName, setCreateName] = useState('');
  const [createColor, setCreateColor] = useState<FolderColor>('#2D4A3E');

  const [draggingBook, setDraggingBook] = useState<Book | null>(null);
  const [hoveredFolderId, setHoveredFolderId] = useState<string | null>(null);
  const dragX = useSharedValue(0);
  const dragY = useSharedValue(0);
  const draggingBookRef = useRef<Book | null>(null);
  const hoveredFolderIdRef = useRef<string | null>(null);
  const folderPositions = useRef<FolderPosition[]>([]);
  const dropScrollRef = useRef<ScrollView>(null);
  const dropScrollOffset = useRef(0);
  const autoScrollTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const dropPanelRef = useRef<View>(null);
  const dropPanelTopRef = useRef(0);

  const registerFolderLayout = useCallback(
    (id: string, top: number, bottom: number) => {
      folderPositions.current = [
        ...folderPositions.current.filter((fp) => fp.id !== id),
        { id, top, bottom },
      ];
    },
    []
  );

  const onDropPanelLayout = useCallback(() => {
    dropPanelRef.current?.measure((_x, _y, _w, _h, _pageX, pageY) => {
      dropPanelTopRef.current = pageY;
    });
  }, []);

  const onDropScrollEvent = useCallback((e: NativeSyntheticEvent<NativeScrollEvent>) => {
    dropScrollOffset.current = e.nativeEvent.contentOffset.y;
  }, []);

  const stopAutoScroll = useCallback(() => {
    if (autoScrollTimer.current) {
      clearInterval(autoScrollTimer.current);
      autoScrollTimer.current = null;
    }
  }, []);

  const handleDragStart = useCallback(
    (book: Book, x: number, y: number) => {
      draggingBookRef.current = book;
      dragX.value = x;
      dragY.value = y;
      dropScrollOffset.current = 0;
      setDraggingBook(book);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    },
    [dragX, dragY]
  );

  const handleDragMove = useCallback(
    (x: number, y: number) => {
      dragX.value = x;
      dragY.value = y;

      const scrollOff = dropScrollOffset.current;
      const hovered = folderPositions.current.find(
        (fp) => y >= fp.top - scrollOff && y <= fp.bottom - scrollOff
      );
      const nextId = hovered?.id ?? null;
      if (nextId !== hoveredFolderIdRef.current) {
        hoveredFolderIdRef.current = nextId;
        setHoveredFolderId(nextId);
        if (nextId !== null) {
          Haptics.selectionAsync();
        }
      }

      const screenH = Dimensions.get('window').height;
      const panelTop = dropPanelTopRef.current;
      const autoScrollUpZone = panelTop + 72;
      const autoScrollDownZone = screenH - 72;
      stopAutoScroll();
      if (y >= panelTop && y < autoScrollUpZone) {
        autoScrollTimer.current = setInterval(() => {
          const next = Math.max(0, dropScrollOffset.current - 5);
          dropScrollRef.current?.scrollTo({ y: next, animated: false });
        }, 16);
      } else if (y > autoScrollDownZone) {
        autoScrollTimer.current = setInterval(() => {
          dropScrollRef.current?.scrollTo({
            y: dropScrollOffset.current + 5,
            animated: false,
          });
        }, 16);
      }
    },
    [dragX, dragY, stopAutoScroll]
  );

  const handleDragEnd = useCallback(() => {
    stopAutoScroll();
    const book = draggingBookRef.current;
    const folderId = hoveredFolderIdRef.current;
    if (book && folderId !== null) {
      assignBookToFolder(book.id, folderId);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    draggingBookRef.current = null;
    hoveredFolderIdRef.current = null;
    setDraggingBook(null);
    setHoveredFolderId(null);
    folderPositions.current = [];
    dropScrollOffset.current = 0;
  }, [assignBookToFolder, stopAutoScroll]);

  const termsKey = user?.id ? `${TERMS_ACCEPTED_BASE_KEY}:${user.id}` : TERMS_ACCEPTED_BASE_KEY;

  useEffect(() => {
    if (!user?.id) return;
    AsyncStorage.getItem(termsKey).then((val) => {
      setTermsAccepted(val === 'true');
    });
  }, [user?.id, termsKey]);

  const topPadding = Platform.OS === 'web' ? 67 : insets.top;
  const bottomPadding = (Platform.OS === 'web' ? 34 : insets.bottom) + 24;

  const handleNewBook = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push('/create-book');
  };

  const handleBookMenu = useCallback((book: Book) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Alert.alert(book.title, undefined, [
      {
        text: t('library.moveToFolder'),
        onPress: () => { setAssignTarget(book); setMoveSubView('list'); },
      },
      {
        text: t('library.deleteBook'),
        style: 'destructive',
        onPress: () => {
          Alert.alert(
            t('library.deleteBook'),
            t('library.deleteBookConfirm', { title: book.title }),
            [
              { text: t('common.cancel'), style: 'cancel' },
              {
                text: t('common.delete'),
                style: 'destructive',
                onPress: () => {
                  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
                  deleteBook(book.id);
                },
              },
            ]
          );
        },
      },
      { text: t('common.cancel'), style: 'cancel' },
    ]);
  }, [deleteBook]);

  const isReturningUser = !loading && books.length > 0;
  const firstName = user?.firstName ?? user?.emailAddresses?.[0]?.emailAddress?.split('@')[0] ?? null;
  const welcomeMessage = firstName ? `Welcome back, ${firstName}!` : 'Welcome back, let\'s get writing!';

  const handleAcceptTerms = async () => {
    await AsyncStorage.setItem(termsKey, 'true');
    setTermsAccepted(true);
  };

  const unfiledCount = useMemo(() => books.filter((b) => !b.folderId).length, [books]);

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

  const handleCreateFolder = () => {
    if (!createName.trim()) return;
    createFolder(createName.trim(), createColor);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setCreateName('');
    setCreateColor('#2D4A3E');
    setCreateFolderVisible(false);
  };

  const folderListData = useMemo(() => folders, [folders]);

  if (hasSeenOnboarding === null || hasSeenOnboarding === false) return null;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}> 
      {termsAccepted === false && (
        <Modal visible transparent animationType="fade">
          <View style={styles.termsOverlay}>
            <View style={[styles.termsCard, { backgroundColor: colors.card, borderColor: colors.border }]}> 
              <View style={[styles.termsIconWrap, { backgroundColor: colors.secondary }]}> 
                <Feather name="file-text" size={28} color={colors.primary} />
              </View>
              <Text style={[styles.termsCardTitle, { color: colors.foreground }]}>Terms &amp; Conditions</Text>
              <Text style={[styles.termsCardBody, { color: colors.mutedForeground }]}>Please review and agree to our Terms &amp; Conditions to continue using BloomScript Novels Scripts Comic Production.</Text>
              <TouchableOpacity onPress={() => router.push('/terms' as Href)} activeOpacity={0.7}>
                <Text style={[styles.termsReadLink, { color: colors.accent }]}>Read Terms &amp; Conditions →</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.termsAgreeBtn, { backgroundColor: colors.primary }]}
                onPress={handleAcceptTerms}
                activeOpacity={0.85}
              >
                <Feather name="check" size={16} color={colors.primaryForeground} />
                <Text style={[styles.termsAgreeBtnText, { color: colors.primaryForeground }]}>I Agree</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      )}

      <LinearGradient
        colors={[colors.primary + '28', colors.background]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[
          styles.header,
          { paddingTop: topPadding + 16, borderBottomColor: colors.border },
          isTablet && styles.headerTablet,
        ]}
      >
        <View style={styles.headerLeft}>
          <View style={styles.headerTitleRow}>
            <Image source={require('../../assets/images/logo.png')} style={{ width: 88, height: 88, borderRadius: 18 }} resizeMode="contain" />
            {isSubscribed && (
              <View style={[styles.proBadge, { backgroundColor: colors.accent }]}> 
                <Text style={styles.proBadgeText}>PRO</Text>
              </View>
            )}
          </View>
          <Text style={[styles.headerSubtitle, { color: colors.mutedForeground }]}> 
            {loading ? 'Loading...' : isReturningUser ? welcomeMessage : `${books.length} ${books.length === 1 ? 'book' : 'books'}`}
          </Text>
        </View>
        <View style={styles.headerActions}>
          {isSubscribed && Platform.OS !== 'web' && (
            <TouchableOpacity
              style={[styles.manageButton, { backgroundColor: colors.secondary, borderColor: colors.accent }]}
              onPress={() => router.push('/paywall')}
              activeOpacity={0.8}
            >
              <Feather name="settings" size={16} color={colors.accent} />
              <Text style={[styles.manageButtonText, { color: colors.accent }]}>Pro</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={[styles.accountBtn, { backgroundColor: colors.secondary, borderColor: colors.border }]}
            onPress={() => { Haptics.selectionAsync(); router.push('/(tabs)/ai-studio' as never); }}
            activeOpacity={0.8}
            hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}
          >
            <Feather name="zap" size={16} color={colors.accent} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.accountBtn, { backgroundColor: colors.secondary, borderColor: colors.border }]}
            onPress={() => { Haptics.selectionAsync(); router.push('/settings' as never); }}
            activeOpacity={0.8}
            hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}
          >
            <Feather name="settings" size={16} color={colors.mutedForeground} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.accountBtn, { backgroundColor: colors.secondary, borderColor: colors.border }]}
            onPress={() => {
              Haptics.selectionAsync();
              signOut();
            }}
            activeOpacity={0.8}
            hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}
          >
            <Feather name="log-out" size={15} color={colors.mutedForeground} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.addButton, { backgroundColor: colors.primary }]}
            onPress={handleNewBook}
            activeOpacity={0.8}
          >
            <Feather name="plus" size={22} color={colors.primaryForeground} />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <View style={isTablet ? styles.tabletBannerShell : undefined}>
        <TouchableOpacity
          style={[styles.artistBanner, { backgroundColor: colors.primary }]}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            router.push({ pathname: '/(tabs)/artist-space' } as never);
          }}
          activeOpacity={0.88}
        >
          <Feather name="users" size={16} color={colors.primaryForeground} />
          <Text style={[styles.artistBannerText, { color: colors.primaryForeground }]}>Artist Space — Discover aspiring authors</Text>
          <Feather name="chevron-right" size={15} color={colors.primaryForeground} />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.bloomBanner, { backgroundColor: colors.accent }]}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            router.push('/bloom-manuscript');
          }}
          activeOpacity={0.82}
        >
          <Feather name="upload" size={16} color="#fff" />
          <View style={{ flex: 1 }}>
            <Text style={[styles.bloomBannerTitle, { color: '#fff' }]}>Upload a Manuscript</Text>
            <Text style={[styles.bloomBannerSub, { color: 'rgba(255,255,255,0.8)' }]}>Paste your work — BloomScript Novels Scripts Comic Production detects chapters automatically</Text>
          </View>
          <Feather name="chevron-right" size={15} color="#fff" />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.comicStudioBanner}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
            if (isSubscribed) {
              router.push('/(tabs)/comic-art-studio' as never);
            } else {
              router.push('/(tabs)/comic-studio-paywall' as never);
            }
          }}
          activeOpacity={0.88}
        >
          {/* Halftone dot grid */}
          <View style={styles.comicBannerDots} pointerEvents="none">
            {Array.from({ length: 24 }).map((_, i) => (
              <View key={i} style={styles.comicBannerDot} />
            ))}
          </View>
          {/* Corner marks */}
          <View style={styles.comicBannerCornerTL} />
          <View style={styles.comicBannerCornerBR} />
          <View style={styles.comicBannerLeft}>
            <Text style={styles.comicBannerEyebrow}>✦ COMIC ART STUDIO</Text>
            <Text style={styles.comicBannerTitle}>Generate. Direct.{'\n'}Publish.</Text>
            <Text style={styles.comicBannerSub}>Panel Gen · Character DNA · AI Director · 5 Themes</Text>
          </View>
          <View style={styles.comicBannerRight}>
            <View style={styles.comicBannerBadge}>
              <Text style={styles.comicBannerPrice}>$9.99</Text>
              <Text style={styles.comicBannerPriceSub}>/mo</Text>
            </View>
            <Feather name="chevron-right" size={14} color="#FFD600" style={{ marginTop: 6 }} />
          </View>
        </TouchableOpacity>
      </View>

      <View style={[styles.toggleRow, { borderBottomColor: colors.border }, isTablet && styles.toggleRowTablet]}> 
        <TouchableOpacity
          style={[styles.toggleBtn, viewMode === 'books' && { borderBottomColor: colors.primary, borderBottomWidth: 2 }]}
          onPress={() => { Haptics.selectionAsync(); setViewMode('books'); }}
          activeOpacity={0.7}
        >
          <Feather name="book" size={14} color={viewMode === 'books' ? colors.primary : colors.mutedForeground} />
          <Text style={[styles.toggleLabel, { color: viewMode === 'books' ? colors.primary : colors.mutedForeground }]}>{t('library.allBooks')}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.toggleBtn, viewMode === 'folders' && { borderBottomColor: colors.primary, borderBottomWidth: 2 }]}
          onPress={() => { Haptics.selectionAsync(); setViewMode('folders'); }}
          activeOpacity={0.7}
        >
          <Feather name="folder" size={14} color={viewMode === 'folders' ? colors.primary : colors.mutedForeground} />
          <Text style={[styles.toggleLabel, { color: viewMode === 'folders' ? colors.primary : colors.mutedForeground }]}>{t('library.folders')}</Text>
        </TouchableOpacity>
      </View>

      {viewMode === 'books' ? (
        <FlatList
          data={books}
          keyExtractor={(item) => item.id}
          contentContainerStyle={[styles.listContent, { paddingBottom: bottomPadding, paddingHorizontal: isTablet ? Math.max(16, (screenWidth - 720) / 2) : 16 }]}
          scrollEnabled
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={isReturningUser ? <QuoteCard /> : null}
          ListEmptyComponent={
            !loading ? (
              <View style={styles.emptyState}>
                <View style={[styles.emptyIconWrap, { backgroundColor: colors.secondary }]}> 
                  <Feather name="book" size={44} color={colors.primary} />
                </View>
                <Text style={[styles.emptyTitle, { color: colors.foreground }]}>{t('library.noBooks')}</Text>
                <Text style={[styles.emptyBody, { color: colors.mutedForeground }]}>{t('library.noBooksSubtitle')}</Text>
                <TouchableOpacity
                  style={[styles.emptyButton, { backgroundColor: colors.primary }]}
                  onPress={handleNewBook}
                  activeOpacity={0.8}
                >
                  <Feather name="plus" size={16} color={colors.primaryForeground} />
                  <Text style={[styles.emptyButtonText, { color: colors.primaryForeground }]}>{t('library.newBook')}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.emptyButton, { backgroundColor: colors.accent, marginTop: 10 }]}
                  onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); router.push('/bloom-manuscript'); }}
                  activeOpacity={0.8}
                >
                  <Feather name="upload" size={16} color="#fff" />
                  <Text style={[styles.emptyButtonText, { color: '#fff' }]}>Upload a Manuscript</Text>
                </TouchableOpacity>
              </View>
            ) : null
          }
          ListFooterComponent={
            <TouchableOpacity
              style={styles.termsFooter}
              onPress={() => router.push('/terms' as Href)}
              activeOpacity={0.6}
            >
              <Text style={[styles.termsFooterText, { color: colors.mutedForeground }]}>Terms &amp; Conditions</Text>
            </TouchableOpacity>
          }
          renderItem={({ item }) => (
            <DraggableBookCard
              book={item}
              onDragStart={handleDragStart}
              onDragMove={handleDragMove}
              onDragEnd={handleDragEnd}
            >
              <BookCard
                book={item}
                onPress={() => {
                  Haptics.selectionAsync();
                  router.push({ pathname: '/book/[bookId]', params: { bookId: item.id } });
                }}
                onMenuPress={() => handleBookMenu(item)}
              />
            </DraggableBookCard>
          )}
        />
      ) : (
        <FlatList
          data={folderListData}
          keyExtractor={(item) => item.id}
          contentContainerStyle={[styles.listContent, { paddingBottom: bottomPadding, paddingHorizontal: isTablet ? Math.max(16, (screenWidth - 720) / 2) : 16 }]}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
            <TouchableOpacity
              style={[styles.newFolderRow, { borderColor: colors.border, backgroundColor: colors.secondary }]}
              onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setCreateFolderVisible(true); }}
              activeOpacity={0.8}
            >
              <Feather name="folder-plus" size={18} color={colors.primary} />
              <Text style={[styles.newFolderRowText, { color: colors.primary }]}>New Folder</Text>
            </TouchableOpacity>
          }
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <View style={[styles.emptyIconWrap, { backgroundColor: colors.secondary }]}> 
                <Feather name="folder" size={44} color={colors.primary} />
              </View>
              <Text style={[styles.emptyTitle, { color: colors.foreground }]}>No folders yet</Text>
              <Text style={[styles.emptyBody, { color: colors.mutedForeground }]}>Create folders to organise your books by series, genre, or status.</Text>
            </View>
          }
          ListFooterComponent={
            unfiledCount > 0 ? (
              <TouchableOpacity
                style={[styles.unfiledRow, { backgroundColor: colors.card, borderColor: colors.border }]}
                onPress={() => router.push({ pathname: '/folder/[folderId]', params: { folderId: 'unfiled' } })}
                activeOpacity={0.85}
              >
                <Feather name="inbox" size={18} color={colors.mutedForeground} />
                <Text style={[styles.unfiledName, { color: colors.foreground }]}>Unfiled</Text>
                <Text style={[styles.unfiledCount, { color: colors.mutedForeground }]}> {unfiledCount} {unfiledCount === 1 ? 'book' : 'books'}</Text>
                <Feather name="chevron-right" size={16} color={colors.mutedForeground} />
              </TouchableOpacity>
            ) : null
          }
          renderItem={({ item }) => {
            const folderBooks = books.filter((b) => b.folderId === item.id);
            const previewTitles = folderBooks.slice(0, 2).map((b) => b.title);
            return (
              <FolderCard
                folder={item}
                bookCount={folderBooks.length}
                previewTitles={previewTitles}
                onPress={() => {
                  Haptics.selectionAsync();
                  router.push({ pathname: '/folder/[folderId]', params: { folderId: item.id } });
                }}
              />
            );
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1.5,
  },
  headerTablet: {
    alignSelf: 'center',
    width: '100%',
    maxWidth: 752,
    paddingHorizontal: 16,
  },
  tabletBannerShell: {
    alignSelf: 'center',
    width: '100%',
    maxWidth: 752,
    paddingHorizontal: 16,
  },
  toggleRowTablet: {
    alignSelf: 'center',
    width: '100%',
    maxWidth: 752,
  },
  headerLeft: {
    flex: 1,
    gap: 6,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  headerTitle: {
    fontSize: 26,
    fontFamily: 'Inter_700Bold',
  },
  headerSubtitle: {
    fontSize: 14,
    fontFamily: 'Inter_500Medium',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  proBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
  },
  proBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontFamily: 'Inter_700Bold',
    letterSpacing: 0.6,
  },
  manageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  manageButtonText: {
    fontSize: 13,
    fontFamily: 'Inter_600SemiBold',
  },
  accountBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  artistBanner: {
    marginHorizontal: 16,
    marginTop: 14,
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  artistBannerText: {
    flex: 1,
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
  },
  bloomBanner: {
    marginHorizontal: 16,
    marginTop: 8,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  bloomBannerTitle: {
    fontSize: 13,
    fontFamily: 'Inter_600SemiBold',
    marginBottom: 1,
  },
  bloomBannerSub: {
    fontSize: 11,
    fontFamily: 'Inter_400Regular',
  },
  comicStudioBanner: {
    marginHorizontal: 16,
    marginTop: 8,
    borderRadius: 14,
    backgroundColor: '#0A0806',
    borderWidth: 1.5,
    borderColor: '#FFD60060',
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    overflow: 'hidden',
    shadowColor: '#FFD600',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.22,
    shadowRadius: 12,
    elevation: 8,
  },
  comicBannerDots: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    flexDirection: 'row', flexWrap: 'wrap',
    gap: 16, padding: 10, opacity: 0.6,
  },
  comicBannerDot: {
    width: 3, height: 3, borderRadius: 1.5,
    backgroundColor: '#FFD60025',
  },
  comicBannerCornerTL: {
    position: 'absolute', top: 8, left: 8,
    width: 12, height: 12,
    borderTopWidth: 1.5, borderLeftWidth: 1.5,
    borderTopLeftRadius: 2, borderColor: '#FFD60070',
  },
  comicBannerCornerBR: {
    position: 'absolute', bottom: 8, right: 8,
    width: 12, height: 12,
    borderBottomWidth: 1.5, borderRightWidth: 1.5,
    borderBottomRightRadius: 2, borderColor: '#FFD60070',
  },
  comicBannerLeft: { flex: 1, gap: 3 },
  comicBannerEyebrow: {
    fontFamily: 'Inter_700Bold',
    fontSize: 9,
    color: '#FFD600',
    letterSpacing: 2,
  },
  comicBannerTitle: {
    fontFamily: 'Inter_700Bold',
    fontSize: 17,
    color: '#FFFFFF',
    letterSpacing: 0.2,
    lineHeight: 22,
  },
  comicBannerSub: {
    fontFamily: 'Inter_400Regular',
    fontSize: 11,
    color: '#FFFFFF55',
    lineHeight: 16,
    marginTop: 1,
  },
  comicBannerRight: { alignItems: 'center', justifyContent: 'center', paddingLeft: 12 },
  comicBannerBadge: {
    backgroundColor: '#FFD60018',
    borderWidth: 1, borderColor: '#FFD60060',
    borderRadius: 10,
    paddingHorizontal: 10, paddingVertical: 6,
    alignItems: 'center',
  },
  comicBannerPrice: {
    fontFamily: 'Inter_700Bold',
    fontSize: 18,
    color: '#FFD600',
    lineHeight: 20,
  },
  comicBannerPriceSub: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 9,
    color: '#FFD60080',
    letterSpacing: 1,
  },
  toggleRow: {
    flexDirection: 'row',
    borderBottomWidth: StyleSheet.hairlineWidth,
    marginTop: 10,
    paddingHorizontal: 16,
    gap: 24,
  },
  toggleBtn: {
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  toggleLabel: {
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
  },
  listContent: {
    paddingTop: 12,
    paddingHorizontal: 16,
    gap: 14,
  },
  bookCard: {
    borderWidth: 1,
    borderRadius: 18,
    padding: 16,
    gap: 12,
  },
  cardRow: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'flex-start',
  },
  cardContent: {
    flex: 1,
    gap: 12,
  },
  cardCoverThumb: {
    width: 72,
    height: 108,
    borderRadius: 8,
    borderWidth: 1,
    alignSelf: 'center',
  },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardTopRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  cardMenuBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  genreBadge: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  genreText: {
    fontSize: 11,
    fontFamily: 'Inter_600SemiBold',
  },
  completeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  completeText: {
    color: '#fff',
    fontSize: 10,
    fontFamily: 'Inter_700Bold',
  },
  bookTitle: {
    fontSize: 20,
    fontFamily: 'Inter_700Bold',
    lineHeight: 27,
  },
  bookDesc: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    lineHeight: 21,
  },
  progressContainer: {
    gap: 6,
  },
  progressTrack: {
    height: 6,
    borderRadius: 999,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 999,
  },
  progressPct: {
    fontSize: 12,
    fontFamily: 'Inter_500Medium',
  },
  bookMeta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metaText: {
    fontSize: 12,
    fontFamily: 'Inter_500Medium',
  },
  folderCard: {
    borderWidth: 1,
    borderRadius: 18,
    overflow: 'hidden',
    flexDirection: 'row',
    alignItems: 'stretch',
  },
  folderColorBar: {
    width: 10,
  },
  folderCardBody: {
    flex: 1,
    padding: 16,
    gap: 4,
  },
  folderName: {
    fontSize: 18,
    fontFamily: 'Inter_700Bold',
  },
  folderCount: {
    fontSize: 13,
    fontFamily: 'Inter_500Medium',
  },
  previewTitles: {
    marginTop: 4,
  },
  previewTitle: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
  },
  folderChevron: {
    alignSelf: 'center',
    marginRight: 14,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
    gap: 12,
  },
  emptyIconWrap: {
    width: 82,
    height: 82,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    fontSize: 20,
    fontFamily: 'Inter_700Bold',
    textAlign: 'center',
  },
  emptyBody: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    textAlign: 'center',
    lineHeight: 21,
    maxWidth: 280,
  },
  emptyButton: {
    marginTop: 6,
    borderRadius: 999,
    paddingHorizontal: 18,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  emptyButtonText: {
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
  },
  termsFooter: {
    alignSelf: 'center',
    paddingVertical: 16,
  },
  termsFooterText: {
    fontSize: 13,
    fontFamily: 'Inter_500Medium',
  },
  termsOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'center',
    padding: 20,
  },
  termsCard: {
    borderRadius: 24,
    borderWidth: 1,
    padding: 20,
    gap: 12,
  },
  termsIconWrap: {
    width: 56,
    height: 56,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  termsCardTitle: {
    fontSize: 22,
    fontFamily: 'Inter_700Bold',
  },
  termsCardBody: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    lineHeight: 21,
  },
  termsReadLink: {
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
  },
  termsAgreeBtn: {
    marginTop: 6,
    borderRadius: 999,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  termsAgreeBtnText: {
    fontSize: 15,
    fontFamily: 'Inter_700Bold',
  },
  newFolderRow: {
    borderWidth: 1,
    borderRadius: 18,
    paddingVertical: 14,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  newFolderRowText: {
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
  },
  unfiledRow: {
    borderWidth: 1,
    borderRadius: 18,
    paddingVertical: 14,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  unfiledName: {
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
  },
  unfiledCount: {
    flex: 1,
    fontSize: 13,
    fontFamily: 'Inter_500Medium',
  },
});
