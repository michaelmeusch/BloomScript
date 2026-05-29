import { useAuth } from '@clerk/expo';
import { Feather } from '@expo/vector-icons';
import * as FileSystem from 'expo-file-system/legacy';
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';
import * as MediaLibrary from 'expo-media-library';
import { router, useLocalSearchParams } from 'expo-router';
import * as Sharing from 'expo-sharing';
import React, { useEffect, useRef, useState } from 'react';
import {
  Alert,
  Animated,
  Easing,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useBooks } from '@/context/BookContext';
import { useColors } from '@/hooks/useColors';
import { API_BASE } from '@/constants/api';
import { Book } from '@/types';

// ── Style definitions ─────────────────────────────────────────────────────────

const STYLES = [
  { key: 'realistic',    label: 'Realistic',     icon: '📷' },
  { key: 'cinematic',    label: 'Cinematic',     icon: '🎬' },
  { key: 'artistic',     label: 'Artistic',      icon: '🎨' },
  { key: 'fantasy',      label: 'Fantasy',       icon: '🧙' },
  { key: 'portrait',     label: 'Portrait',      icon: '🧑‍🎨' },
  { key: 'watercolor',   label: 'Watercolor',    icon: '💧' },
  { key: 'ink',          label: 'Ink',           icon: '✒️' },
  { key: 'impressionist',label: 'Impressionist', icon: '🌸' },
  { key: 'baroque',      label: 'Baroque',       icon: '👑' },
  { key: 'noir',         label: 'Noir',          icon: '🌙' },
  { key: 'surreal',      label: 'Surreal',       icon: '🌀' },
  { key: 'scifi',        label: 'Sci-Fi',        icon: '🚀' },
  { key: 'vintage',      label: 'Vintage',       icon: '📜' },
  { key: 'minimal',      label: 'Minimal',       icon: '◼' },
];

// ── Camera view / framing definitions (Wally Wood "22 Panels") ───────────────

const VIEW_STYLES = [
  { key: 'none',           label: 'Auto',          icon: '⊙' },
  { key: 'big_head',       label: 'Big Head',      icon: '🔍' },
  { key: 'extreme_closeup',label: 'X-Closeup',     icon: '🔬' },
  { key: 'profile',        label: 'Profile',       icon: '◁' },
  { key: 'full_figure',    label: 'Full Fig',      icon: '🧍' },
  { key: 'small_figure',   label: 'Small Fig',     icon: '🏔️' },
  { key: 'eye_level',      label: 'Eye Level',     icon: '👁️' },
  { key: 'down_shot',      label: 'Down Shot',     icon: '⬇️' },
  { key: 'depth',          label: 'Depth',         icon: '🌅' },
  { key: 'silhouette',     label: 'Silhouette',    icon: '🌑' },
  { key: 'three_stage',    label: '3-Stage',       icon: '🎭' },
  { key: 'cast_shadows',   label: 'Shadows',       icon: '🌗' },
  { key: 'contrast',       label: 'Contrast',      icon: '◑' },
];

// ── Figure & anatomy definitions ─────────────────────────────────────────────

const FIGURE_STYLES = [
  { key: 'none',          label: 'None',          icon: '○' },
  { key: 'michelangelo',  label: 'Michelangelo',  icon: '🗿' },
  { key: 'raphael',       label: 'Raphael',       icon: '🌿' },
  { key: 'hal_foster',    label: 'Hal Foster',    icon: '⚔️' },
  { key: 'burne_hogarth', label: 'B. Hogarth',    icon: '💪' },
  { key: 'russ_manning',  label: 'R. Manning',    icon: '🚀' },
  { key: 'joe_kubert',    label: 'Joe Kubert',    icon: '🦅' },
  { key: 'heroic_male',   label: 'Heroic ♂',      icon: '🧍' },
  { key: 'heroic_female', label: 'Heroic ♀',      icon: '🧍' },
];

// ── Cover Artist Reference Library ───────────────────────────────────────────
// Sourced from Library of Congress Book Arts archives, AIGA design collections,
// and Smithsonian Institution archives of 20th-century book cover design.

const COVER_ARTISTS = [
  { key: 'none',            label: 'None',          icon: '○',  era: '' },
  { key: 'saul_bass',       label: 'Saul Bass',     icon: '🔺', era: '1950s–60s' },
  { key: 'chip_kidd',       label: 'Chip Kidd',     icon: '📚', era: '1990s–' },
  { key: 'paul_rand',       label: 'Paul Rand',     icon: '🟥', era: '1940s–90s' },
  { key: 'louise_fili',     label: 'L. Fili',       icon: '🌿', era: 'Art Deco' },
  { key: 'paula_scher',     label: 'P. Scher',      icon: '🗺️', era: 'Bold Type' },
  { key: 'milton_glaser',   label: 'M. Glaser',     icon: '🌀', era: '1960s–70s' },
  { key: 'alex_steinweiss', label: 'Steinweiss',    icon: '🎷', era: '1940s–50s' },
  { key: 'robert_mcginnis', label: 'McGinnis',      icon: '🔫', era: 'Pulp/Spy' },
  { key: 'david_pelham',    label: 'D. Pelham',     icon: '🛸', era: 'Sci-Fi' },
  { key: 'alvin_lustig',    label: 'A. Lustig',     icon: '🌕', era: '1940s' },
  { key: 'jan_tschichold',  label: 'Tschichold',    icon: '📐', era: 'Penguin' },
  { key: 'george_salter',   label: 'G. Salter',     icon: '✍️', era: 'Calligraph' },
  { key: 'leo_lionni',      label: 'Leo Lionni',    icon: '✂️', era: 'Collage' },
  { key: 'george_mackay_brown', label: 'Nordic Folk',  icon: '🌊', era: 'Woodcut' },
  { key: 'james_avati',         label: 'J. Avati',     icon: '🕯️', era: 'Paperback' },
  { key: 'bascove',             label: 'Bascove',       icon: '🪵', era: 'Woodcut' },
  { key: 'leo_dillon',          label: 'Dillon×2',      icon: '🌍', era: 'Multi-cult' },
  { key: 'aubrey_beardsley',    label: 'Beardsley',     icon: '🌹', era: 'Art Nouveau' },
  { key: 'arthur_rackham',      label: 'Rackham',       icon: '🧚', era: 'Golden Age' },
  { key: 'nc_wyeth',            label: 'N.C. Wyeth',    icon: '⚔️', era: 'Brandywine' },
  { key: 'haddon_sundblom',     label: 'Sundblom',      icon: '☕', era: 'Saturday EP' },
  { key: 'robert_jonas',        label: 'R. Jonas',      icon: '🖌️', era: '1940s NAL' },
  { key: 'mcknight_kauffer',    label: 'Kauffer',       icon: '🔷', era: 'Modernist' },
  { key: 'helen_dryden',        label: 'H. Dryden',     icon: '💎', era: 'Art Deco' },
  { key: 'robert_abbett',       label: 'R. Abbett',     icon: '🐆', era: 'Ballantine' },
  { key: 'rudolph_belarski',    label: 'Belarski',      icon: '⚡', era: 'Pop Library' },
  { key: 'mitchell_hooks',      label: 'M. Hooks',      icon: '🌫️', era: 'Lew Archer' },
  { key: 'walter_popp',         label: 'W. Popp',       icon: '🔪', era: '1950s Noir' },
  { key: 'robert_maguire',      label: 'R. Maguire',    icon: '🎴', era: '1200 Covers' },
  { key: 'elaine_duillo',       label: 'E. Duillo',     icon: '🌹', era: 'Romance' },
  { key: 'harry_bennett',       label: 'H. Bennett',    icon: '🔲', era: 'Stark/Avon' },
  { key: 'robert_schulz',       label: 'R. Schulz',     icon: '🌑', era: 'Dell Crime' },
  { key: 'john_stanley',        label: 'J. Stanley',    icon: '🌧️', era: 'Signet' },
  { key: 'paul_rader',          label: 'P. Rader',      icon: '💄', era: 'Midwood' },
  { key: 'ernest_chiriaka',     label: 'Chiriaka',      icon: '🗡️', era: 'Gold Medal' },
];

// ── Lighting definitions ──────────────────────────────────────────────────────

const LIGHTING = [
  { key: 'auto',      label: 'Auto',       icon: '✦' },
  { key: 'golden',    label: 'Golden Hr',  icon: '🌅' },
  { key: 'dramatic',  label: 'Dramatic',   icon: '🎭' },
  { key: 'soft',      label: 'Soft',       icon: '☁️' },
  { key: 'moonlight', label: 'Moonlight',  icon: '🌕' },
  { key: 'neon',      label: 'Neon',       icon: '💜' },
  { key: 'studio',    label: 'Studio',     icon: '💡' },
  { key: 'rembrandt', label: 'Rembrandt',  icon: '🕯️' },
];

const GEN_MESSAGES = [
  'Composing with the Golden Mean...',
  'Placing subject at φ intersection...',
  'Tracing the Fibonacci spiral...',
  'Shaping the light...',
  'Layering depth and texture...',
  'Crafting the final harmony...',
];

// ── Generating overlay ────────────────────────────────────────────────────────

function GeneratingOverlay({ visible, colors }: { visible: boolean; colors: ReturnType<typeof useColors> }) {
  const [msgIndex, setMsgIndex] = useState(0);
  const msgOpacity = useRef(new Animated.Value(1)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;
  const pulseScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (!visible) { progressAnim.setValue(0); setMsgIndex(0); return; }

    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseScale, { toValue: 1.12, duration: 1000, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(pulseScale, { toValue: 1.0, duration: 1000, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ])
    );
    pulse.start();

    Animated.timing(progressAnim, {
      toValue: 0.9,
      duration: GEN_MESSAGES.length * 2800,
      easing: Easing.out(Easing.quad),
      useNativeDriver: false,
    }).start();

    let idx = 0;
    const cycle = () => {
      Animated.timing(msgOpacity, { toValue: 0, duration: 300, useNativeDriver: true }).start(() => {
        idx = (idx + 1) % GEN_MESSAGES.length;
        setMsgIndex(idx);
        Animated.timing(msgOpacity, { toValue: 1, duration: 300, useNativeDriver: true }).start();
      });
    };
    const interval = setInterval(cycle, 2800);

    return () => {
      pulse.stop();
      clearInterval(interval);
      progressAnim.stopAnimation();
      progressAnim.setValue(0);
    };
  }, [visible]);

  if (!visible) return null;

  const progressWidth = progressAnim.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] });

  return (
    <View style={[ovStyles.overlay, { backgroundColor: 'rgba(0,0,0,0.80)' }]}>
      <View style={[ovStyles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Animated.View style={[ovStyles.iconWrap, { backgroundColor: colors.primary + '18', transform: [{ scale: pulseScale }] }]}>
          <Text style={ovStyles.iconEmoji}>φ</Text>
        </Animated.View>
        <Text style={[ovStyles.title, { color: colors.primary }]}>GENERATING IMAGE</Text>
        <View style={[ovStyles.goldenBadge, { backgroundColor: colors.accent + '22', borderColor: colors.accent + '44' }]}>
          <Text style={[ovStyles.goldenBadgeText, { color: colors.accent }]}>✦ Golden Mean composition</Text>
        </View>
        <Animated.View style={{ opacity: msgOpacity, marginBottom: 20, minHeight: 48, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={[ovStyles.msg, { color: colors.foreground }]}>{GEN_MESSAGES[msgIndex]}</Text>
        </Animated.View>
        <View style={[ovStyles.progressTrack, { backgroundColor: colors.border }]}>
          <Animated.View style={[ovStyles.progressFill, { backgroundColor: colors.accent, width: progressWidth }]} />
        </View>
      </View>
    </View>
  );
}

const ovStyles = StyleSheet.create({
  overlay: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: 32 },
  card: { width: '100%', maxWidth: 320, borderRadius: 20, borderWidth: 1, padding: 28, alignItems: 'center' },
  iconWrap: { width: 68, height: 68, borderRadius: 18, alignItems: 'center', justifyContent: 'center', marginBottom: 18 },
  iconEmoji: { fontSize: 32, fontFamily: 'Inter_700Bold' },
  title: { fontSize: 11, fontFamily: 'Inter_700Bold', letterSpacing: 1.5, marginBottom: 10 },
  goldenBadge: { borderRadius: 8, borderWidth: 1, paddingHorizontal: 10, paddingVertical: 4, marginBottom: 18 },
  goldenBadgeText: { fontSize: 11, fontFamily: 'Inter_600SemiBold', letterSpacing: 0.3 },
  msg: { fontSize: 15, fontFamily: 'Inter_400Regular', textAlign: 'center', lineHeight: 22 },
  progressTrack: { width: '80%', height: 4, borderRadius: 2, overflow: 'hidden' },
  progressFill: { height: 4, borderRadius: 2 },
});

// ── Book picker modal ─────────────────────────────────────────────────────────

function BookPickerModal({
  visible, books, colors, onSelect, onClose,
}: {
  visible: boolean; books: Book[]; colors: ReturnType<typeof useColors>;
  onSelect: (book: Book) => void; onClose: () => void;
}) {
  const insets = useSafeAreaInsets();
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={pkStyles.overlay}>
        <View style={[pkStyles.sheet, { backgroundColor: colors.card, paddingBottom: insets.bottom + 16 }]}>
          <View style={[pkStyles.handle, { backgroundColor: colors.border }]} />
          <Text style={[pkStyles.title, { color: colors.foreground }]}>Choose a Book</Text>
          <Text style={[pkStyles.sub, { color: colors.mutedForeground }]}>
            The image will be set as the background for this book's cover.
          </Text>
          {books.length === 0 ? (
            <Text style={[pkStyles.empty, { color: colors.mutedForeground }]}>You haven't created any books yet.</Text>
          ) : (
            <FlatList
              data={books}
              keyExtractor={(b) => b.id}
              style={{ maxHeight: 320 }}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[pkStyles.bookRow, { borderColor: colors.border }]}
                  onPress={() => onSelect(item)}
                  activeOpacity={0.75}
                >
                  <View style={[pkStyles.bookIcon, { backgroundColor: colors.secondary }]}>
                    <Feather name="book-open" size={18} color={colors.primary} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[pkStyles.bookTitle, { color: colors.foreground }]} numberOfLines={1}>{item.title}</Text>
                    <Text style={[pkStyles.bookGenre, { color: colors.mutedForeground }]}>{item.genre}</Text>
                  </View>
                  <Feather name="chevron-right" size={16} color={colors.mutedForeground} />
                </TouchableOpacity>
              )}
            />
          )}
          <TouchableOpacity style={[pkStyles.cancelBtn, { borderColor: colors.border }]} onPress={onClose} activeOpacity={0.75}>
            <Text style={[pkStyles.cancelText, { color: colors.mutedForeground }]}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const pkStyles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  sheet: { borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingHorizontal: 20, paddingTop: 12 },
  handle: { width: 40, height: 4, borderRadius: 2, alignSelf: 'center', marginBottom: 16 },
  title: { fontSize: 18, fontFamily: 'Inter_700Bold', marginBottom: 4 },
  sub: { fontSize: 13, fontFamily: 'Inter_400Regular', marginBottom: 16, lineHeight: 18 },
  empty: { fontSize: 14, fontFamily: 'Inter_400Regular', textAlign: 'center', paddingVertical: 24 },
  bookRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, borderBottomWidth: 1 },
  bookIcon: { width: 40, height: 40, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  bookTitle: { fontSize: 15, fontFamily: 'Inter_600SemiBold' },
  bookGenre: { fontSize: 12, fontFamily: 'Inter_400Regular', marginTop: 1 },
  cancelBtn: { marginTop: 16, paddingVertical: 14, borderRadius: 12, borderWidth: 1, alignItems: 'center' },
  cancelText: { fontSize: 15, fontFamily: 'Inter_500Medium' },
});

// ── Main screen ───────────────────────────────────────────────────────────────

export default function AIStudioScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ seedPrompt?: string; bookId?: string }>();
  const { books, updateBook } = useBooks();
  const { getToken } = useAuth();

  const [prompt, setPrompt] = useState(params.seedPrompt ?? '');
  const [selectedStyles, setSelectedStyles] = useState<string[]>(['realistic']);
  const [selectedLighting, setSelectedLighting] = useState<string>('auto');
  const [selectedFigure, setSelectedFigure] = useState<string>('none');
  const [selectedView, setSelectedView] = useState<string>('none');
  const [selectedArtist, setSelectedArtist] = useState<string>('none');
  const [copyrightChecking, setCopyrightChecking] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [imageFileUri, setImageFileUri] = useState<string | null>(null);
  const [backend, setBackend] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [bookPickerVisible, setBookPickerVisible] = useState(false);

  const topPadding = Platform.OS === 'web' ? 67 : insets.top;
  const bottomPadding = (Platform.OS === 'web' ? 34 : insets.bottom) + 24;

  const isBlending = selectedStyles.length === 2;

  // ── Style picker logic ──────────────────────────────────────────────────────

  const handleStyleTap = (key: string) => {
    Haptics.selectionAsync();
    setSelectedStyles((prev) => {
      if (prev.includes(key)) {
        if (prev.length === 1) return prev;
        return prev.filter((s) => s !== key);
      }
      if (prev.length < 2) return [...prev, key];
      return [prev[1], key];
    });
  };

  // ── File helper ─────────────────────────────────────────────────────────────

  const ensureFileUri = async (b64: string): Promise<string> => {
    if (imageFileUri) return imageFileUri;
    const uri = `${FileSystem.cacheDirectory}bloomscript_ai_${Date.now()}.png`;
    await FileSystem.writeAsStringAsync(uri, b64, { encoding: FileSystem.EncodingType.Base64 });
    setImageFileUri(uri);
    return uri;
  };

  // ── Scan reference image for copyright ──────────────────────────────────────

  const handleScanReference = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('Permission needed', 'Please allow photo access to scan a reference image.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.6,
      base64: true,
      allowsEditing: false,
    });
    if (result.canceled || !result.assets?.[0]?.base64) return;

    const b64 = result.assets[0].base64!;
    setCopyrightChecking(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      const token = await getToken();
      const res = await fetch(`${API_BASE}/ai-studio/check-image`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ imageBase64: b64 }),
      });
      const data = await res.json() as { isCopyrighted: boolean; reason: string; styleDescription: string };

      if (data.isCopyrighted) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        Alert.alert(
          'Copyright material detected',
          'This image appears to be copyrighted material and cannot be used directly.\n\nWould you like me to generate something in the same style instead?',
          [
            { text: 'No thanks', style: 'cancel' },
            {
              text: 'Yes, use the style',
              onPress: () => {
                setPrompt(data.styleDescription);
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              },
            },
          ]
        );
      } else {
        Alert.alert('All clear', 'No copyright issues detected with this reference image.');
      }
    } catch {
      Alert.alert('Error', 'Could not scan the image. Please try again.');
    } finally {
      setCopyrightChecking(false);
    }
  };

  // ── Generate ────────────────────────────────────────────────────────────────

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setError(null);
    setImageBase64(null);
    setImageFileUri(null);
    setGenerating(true);

    try {
      const token = await getToken();
      if (!token) {
        setError('You must be signed in to generate images.');
        setGenerating(false);
        return;
      }

      const body: Record<string, unknown> = {
        prompt: prompt.trim(),
        styles: selectedStyles,
        width: 1024,
        height: 1024,
      };
      if (selectedLighting !== 'auto') {
        body.lighting = selectedLighting;
      }
      if (selectedFigure !== 'none') {
        body.figure = selectedFigure;
      }
      if (selectedView !== 'none') {
        body.view = selectedView;
      }
      if (selectedArtist !== 'none') {
        body.coverArtist = selectedArtist;
      }

      const res = await fetch(`${API_BASE}/ai-studio/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const errBody = await res.json().catch(() => ({}));
        throw new Error((errBody as { error?: string }).error ?? `Server error ${res.status}`);
      }

      const data = await res.json() as { imageBase64: string; backend: string };
      setImageBase64(data.imageBase64);
      setBackend(data.backend);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Generation failed. Please try again.');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setGenerating(false);
    }
  };

  // ── Save to Photos ──────────────────────────────────────────────────────────

  const handleSaveToPhotos = async () => {
    if (!imageBase64) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Please allow photo library access in Settings to save images.', [{ text: 'OK' }]);
        return;
      }
      const uri = await ensureFileUri(imageBase64);
      const asset = await MediaLibrary.createAssetAsync(uri);
      const albumName = 'Comic Artist Studio';
      const album = await MediaLibrary.getAlbumAsync(albumName);
      if (album == null) {
        await MediaLibrary.createAlbumAsync(albumName, asset, false);
      } else {
        await MediaLibrary.addAssetsToAlbumAsync([asset], album, false);
      }
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('Saved!', `Image saved to the "${albumName}" album.`);
    } catch (err) {
      console.error('[AI Studio] Save error:', err);
      setError(`Could not save to photo library: ${err instanceof Error ? err.message : 'Try sharing instead.'}`);
    }
  };

  // ── Share ───────────────────────────────────────────────────────────────────

  const handleShare = async () => {
    if (!imageBase64) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      const uri = await ensureFileUri(imageBase64);
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, { mimeType: 'image/png', dialogTitle: 'Share AI image' });
      }
    } catch {
      setError('Could not share the image.');
    }
  };

  // ── Use as Cover ────────────────────────────────────────────────────────────

  const applyToCover = async (book: Book) => {
    if (!imageBase64) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      const uri = await ensureFileUri(imageBase64);
      // Store the base64 directly on the book for library card / detail display,
      // set coverRawImageUri so cover-generator picks it up as background, and
      // clear any previous finalised coverImageUri so the new AI image shows immediately.
      updateBook(book.id, { coverImageBase64: imageBase64, coverRawImageUri: uri, coverImageUri: undefined });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.push({ pathname: '/(tabs)/cover-generator', params: { bookId: book.id } } as never);
    } catch {
      setError('Could not apply image to cover. Please try again.');
    }
  };

  const handleUseCover = () => {
    if (!imageBase64) return;
    if (params.bookId) {
      const book = books.find((b) => b.id === params.bookId);
      if (book) { applyToCover(book); return; }
    }
    setBookPickerVisible(true);
  };

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <GeneratingOverlay visible={generating} colors={colors} />
      <BookPickerModal
        visible={bookPickerVisible}
        books={books}
        colors={colors}
        onSelect={(book) => { setBookPickerVisible(false); applyToCover(book); }}
        onClose={() => setBookPickerVisible(false)}
      />

      {/* Header */}
      <View style={[styles.header, { paddingTop: topPadding + 12, borderBottomColor: colors.border, backgroundColor: colors.card }]}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }} style={styles.backBtn}>
          <Feather name="arrow-left" size={20} color={colors.foreground} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={[styles.headerTitle, { color: colors.foreground }]}>AI Studio</Text>
          <Text style={[styles.headerSub, { color: colors.mutedForeground }]}>Golden Mean · {STYLES.length} styles · {LIGHTING.length - 1} lights</Text>
        </View>
        {backend && (
          <View style={[styles.backendBadge, { backgroundColor: colors.secondary, borderColor: colors.border }]}>
            <Text style={[styles.backendText, { color: colors.mutedForeground }]}>
              {backend === 'stability' ? '⚡ Pro' : '🌸 Free'}
            </Text>
          </View>
        )}
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView
          contentContainerStyle={[styles.content, { paddingBottom: bottomPadding }]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >

          {/* Image preview */}
          {imageBase64 ? (
            <View style={styles.imageSection}>
              <Image
                source={{ uri: `data:image/png;base64,${imageBase64}` }}
                style={[styles.generatedImage, { borderColor: colors.border }]}
                resizeMode="cover"
              />
              {/* Golden Mean indicator overlay */}
              <View style={[styles.goldenTag, { backgroundColor: colors.accent + 'CC' }]}>
                <Text style={styles.goldenTagText}>φ Golden Mean</Text>
              </View>
              <View style={styles.imageActions}>
                {Platform.OS !== 'web' && (
                  <TouchableOpacity
                    style={[styles.actionBtn, { backgroundColor: colors.secondary, borderColor: colors.border }]}
                    onPress={handleSaveToPhotos}
                    activeOpacity={0.8}
                  >
                    <Feather name="download" size={15} color={colors.foreground} />
                    <Text style={[styles.actionBtnText, { color: colors.foreground }]}>Save</Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity
                  style={[styles.actionBtn, { backgroundColor: colors.secondary, borderColor: colors.border }]}
                  onPress={handleShare}
                  activeOpacity={0.8}
                >
                  <Feather name="share-2" size={15} color={colors.foreground} />
                  <Text style={[styles.actionBtnText, { color: colors.foreground }]}>Share</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.actionBtn, styles.actionBtnPrimary, { backgroundColor: colors.accent }]}
                  onPress={handleUseCover}
                  activeOpacity={0.8}
                >
                  <Feather name="image" size={15} color="#fff" />
                  <Text style={[styles.actionBtnText, { color: '#fff' }]}>Use as Cover</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <View style={[styles.imagePlaceholder, { backgroundColor: colors.secondary, borderColor: colors.border }]}>
              <Text style={styles.placeholderSymbol}>φ</Text>
              <Text style={[styles.placeholderTitle, { color: colors.foreground }]}>Golden Mean Composition</Text>
              <Text style={[styles.placeholderText, { color: colors.mutedForeground }]}>
                Every image is composed using the Golden Ratio (φ = 1.618) — subjects placed at φ intersections, Fibonacci spiral eye path, and golden-section horizon.
              </Text>
            </View>
          )}

          {/* Prompt input */}
          <View style={styles.section}>
            <View style={styles.sectionLabelRow}>
              <Text style={[styles.sectionLabel, { color: colors.foreground }]}>Describe your image</Text>
              <TouchableOpacity
                style={[styles.scanRefBtn, { backgroundColor: colors.secondary, borderColor: colors.border, opacity: copyrightChecking ? 0.5 : 1 }]}
                onPress={handleScanReference}
                disabled={copyrightChecking}
                activeOpacity={0.75}
              >
                <Feather name="camera" size={13} color={colors.mutedForeground} />
                <Text style={[styles.scanRefLabel, { color: colors.mutedForeground }]}>
                  {copyrightChecking ? 'Checking…' : 'Scan reference'}
                </Text>
              </TouchableOpacity>
            </View>
            <TextInput
              style={[styles.promptInput, { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground }]}
              value={prompt}
              onChangeText={setPrompt}
              placeholder="A misty mountain village at dawn, ancient stone bridge over a waterfall..."
              placeholderTextColor={colors.mutedForeground}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              returnKeyType="default"
            />
          </View>

          {/* Style picker — multi-select up to 2 */}
          <View style={styles.section}>
            <View style={styles.sectionLabelRow}>
              <Text style={[styles.sectionLabel, { color: colors.foreground }]}>Visual style</Text>
              {isBlending ? (
                <View style={[styles.blendBadge, { backgroundColor: colors.accent + '22', borderColor: colors.accent + '55' }]}>
                  <Text style={[styles.blendBadgeText, { color: colors.accent }]}>✦ Blending 2 styles</Text>
                </View>
              ) : (
                <Text style={[styles.sectionHint, { color: colors.mutedForeground }]}>Tap 2 to blend</Text>
              )}
            </View>
            <View style={styles.styleGrid}>
              {STYLES.map((s, idx) => {
                const selIdx = selectedStyles.indexOf(s.key);
                const isSelected = selIdx >= 0;
                const isPrimary = selIdx === 0;
                const isSecondary = selIdx === 1;
                return (
                  <TouchableOpacity
                    key={s.key}
                    style={[
                      styles.styleChip,
                      {
                        backgroundColor: isSelected ? (isPrimary ? colors.primary : colors.accent) : colors.secondary,
                        borderColor: isSelected ? (isPrimary ? colors.primary : colors.accent) : colors.border,
                        borderWidth: isSelected ? 2 : 1,
                      },
                    ]}
                    onPress={() => handleStyleTap(s.key)}
                    activeOpacity={0.75}
                  >
                    <Text style={styles.styleIcon}>{s.icon}</Text>
                    <Text style={[styles.styleLabel, { color: isSelected ? '#fff' : colors.foreground }]}>
                      {s.label}
                    </Text>
                    {isSecondary && (
                      <View style={styles.blendDot}>
                        <Text style={styles.blendDotText}>2</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Camera view picker (Wally Wood) */}
          <View style={styles.section}>
            <View style={styles.sectionLabelRow}>
              <Text style={[styles.sectionLabel, { color: colors.foreground }]}>Camera View</Text>
              <Text style={[styles.sectionHint, { color: colors.mutedForeground }]}>Wally Wood framing</Text>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.lightingRow}>
              {VIEW_STYLES.map((v) => {
                const isActive = selectedView === v.key;
                return (
                  <TouchableOpacity
                    key={v.key}
                    style={[
                      styles.lightChip,
                      {
                        backgroundColor: isActive ? colors.primary : colors.secondary,
                        borderColor: isActive ? colors.primary : colors.border,
                        borderWidth: isActive ? 2 : 1,
                      },
                    ]}
                    onPress={() => { setSelectedView(v.key); Haptics.selectionAsync(); }}
                    activeOpacity={0.75}
                  >
                    <Text style={styles.lightIcon}>{v.icon}</Text>
                    <Text style={[styles.lightLabel, { color: isActive ? colors.primaryForeground : colors.foreground }]}>
                      {v.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>

          {/* Lighting picker */}
          <View style={styles.section}>
            <Text style={[styles.sectionLabel, { color: colors.foreground }]}>Lighting</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.lightingRow}>
              {LIGHTING.map((l) => {
                const isActive = selectedLighting === l.key;
                return (
                  <TouchableOpacity
                    key={l.key}
                    style={[
                      styles.lightChip,
                      {
                        backgroundColor: isActive ? colors.primary : colors.secondary,
                        borderColor: isActive ? colors.primary : colors.border,
                        borderWidth: isActive ? 2 : 1,
                      },
                    ]}
                    onPress={() => { setSelectedLighting(l.key); Haptics.selectionAsync(); }}
                    activeOpacity={0.75}
                  >
                    <Text style={styles.lightIcon}>{l.icon}</Text>
                    <Text style={[styles.lightLabel, { color: isActive ? colors.primaryForeground : colors.foreground }]}>
                      {l.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>

          {/* Figure & anatomy picker */}
          <View style={styles.section}>
            <View style={styles.sectionLabelRow}>
              <Text style={[styles.sectionLabel, { color: colors.foreground }]}>Figure & Anatomy</Text>
              <Text style={[styles.sectionHint, { color: colors.mutedForeground }]}>Masters · Body types</Text>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.lightingRow}>
              {FIGURE_STYLES.map((f) => {
                const isActive = selectedFigure === f.key;
                return (
                  <TouchableOpacity
                    key={f.key}
                    style={[
                      styles.lightChip,
                      {
                        backgroundColor: isActive ? colors.accent : colors.secondary,
                        borderColor: isActive ? colors.accent : colors.border,
                        borderWidth: isActive ? 2 : 1,
                      },
                    ]}
                    onPress={() => { setSelectedFigure(f.key); Haptics.selectionAsync(); }}
                    activeOpacity={0.75}
                  >
                    <Text style={styles.lightIcon}>{f.icon}</Text>
                    <Text style={[styles.lightLabel, { color: isActive ? '#fff' : colors.foreground }]}>
                      {f.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>

          {/* Cover Artist Reference picker */}
          <View style={styles.section}>
            <View style={styles.sectionLabelRow}>
              <Text style={[styles.sectionLabel, { color: colors.foreground }]}>Cover Artist Reference</Text>
              <Text style={[styles.sectionHint, { color: colors.mutedForeground }]}>LoC · AIGA · Smithsonian</Text>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.lightingRow}>
              {COVER_ARTISTS.map((a) => {
                const isActive = selectedArtist === a.key;
                return (
                  <TouchableOpacity
                    key={a.key}
                    style={[
                      styles.artistChip,
                      {
                        backgroundColor: isActive ? '#B45309' : colors.secondary,
                        borderColor: isActive ? '#B45309' : colors.border,
                        borderWidth: isActive ? 2 : 1,
                      },
                    ]}
                    onPress={() => { setSelectedArtist(a.key); Haptics.selectionAsync(); }}
                    activeOpacity={0.75}
                  >
                    <Text style={styles.lightIcon}>{a.icon}</Text>
                    <View>
                      <Text style={[styles.artistName, { color: isActive ? '#fff' : colors.foreground }]}>
                        {a.label}
                      </Text>
                      {a.era ? (
                        <Text style={[styles.artistEra, { color: isActive ? '#fff' + 'CC' : colors.mutedForeground }]}>
                          {a.era}
                        </Text>
                      ) : null}
                    </View>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>

          {/* Golden Mean info chip */}
          <View style={[styles.goldenInfoRow, { backgroundColor: colors.secondary, borderColor: colors.border }]}>
            <Text style={[styles.goldenInfoSymbol, { color: colors.accent }]}>φ</Text>
            <View style={{ flex: 1 }}>
              <Text style={[styles.goldenInfoTitle, { color: colors.foreground }]}>Golden Mean always applied</Text>
              <Text style={[styles.goldenInfoSub, { color: colors.mutedForeground }]}>
                Subject at φ intersection · Fibonacci spiral eye path · Golden-section horizon
              </Text>
            </View>
          </View>

          {/* Error */}
          {error && (
            <View style={[styles.errorRow, { backgroundColor: colors.destructive + '18', borderColor: colors.destructive + '40' }]}>
              <Feather name="alert-circle" size={14} color={colors.destructive} />
              <Text style={[styles.errorText, { color: colors.destructive }]}>{error}</Text>
            </View>
          )}

          {/* Generate button */}
          <Pressable
            style={[styles.generateBtn, { backgroundColor: colors.primary }, (!prompt.trim() || generating) && { opacity: 0.5 }]}
            onPress={handleGenerate}
            disabled={!prompt.trim() || generating}
          >
            <Feather name="zap" size={18} color={colors.primaryForeground} />
            <Text style={[styles.generateBtnText, { color: colors.primaryForeground }]}>
              {generating ? 'Generating...' : imageBase64 ? 'Generate Again' : 'Generate Image'}
            </Text>
          </Pressable>

          <Text style={[styles.hint, { color: colors.mutedForeground }]}>
            Powered by {backend === 'stability' ? 'Stability AI' : 'Pollinations AI'} · For personal use only
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },

  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingBottom: 14, borderBottomWidth: 1, gap: 12,
  },
  backBtn: { padding: 4 },
  headerCenter: { flex: 1 },
  headerTitle: { fontSize: 18, fontFamily: 'Inter_700Bold', letterSpacing: -0.3 },
  headerSub: { fontSize: 11, fontFamily: 'Inter_400Regular', marginTop: 1 },
  backendBadge: { borderRadius: 10, borderWidth: 1, paddingHorizontal: 8, paddingVertical: 4 },
  backendText: { fontSize: 11, fontFamily: 'Inter_500Medium' },

  content: { paddingHorizontal: 16, paddingTop: 20, gap: 20 },

  imageSection: { gap: 12 },
  generatedImage: { width: '100%', aspectRatio: 1, borderRadius: 16, borderWidth: 1 },
  goldenTag: {
    position: 'absolute', top: 10, right: 10,
    borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3,
  },
  goldenTagText: { fontSize: 11, fontFamily: 'Inter_600SemiBold', color: '#fff', letterSpacing: 0.2 },
  imageActions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  actionBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 5, paddingVertical: 12, borderRadius: 12, borderWidth: 1, minWidth: 90,
  },
  actionBtnPrimary: { borderWidth: 0 },
  actionBtnText: { fontSize: 13, fontFamily: 'Inter_600SemiBold' },

  imagePlaceholder: {
    borderRadius: 16, borderWidth: 1, borderStyle: 'dashed',
    alignItems: 'center', justifyContent: 'center', gap: 8, padding: 32,
  },
  placeholderSymbol: { fontSize: 42, fontFamily: 'Inter_700Bold', color: '#C4913A', opacity: 0.7 },
  placeholderTitle: { fontSize: 15, fontFamily: 'Inter_600SemiBold', textAlign: 'center' },
  placeholderText: { fontSize: 13, fontFamily: 'Inter_400Regular', textAlign: 'center', lineHeight: 19 },

  section: { gap: 10 },
  sectionLabelRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  sectionLabel: { fontSize: 14, fontFamily: 'Inter_600SemiBold' },
  sectionHint: { fontSize: 11, fontFamily: 'Inter_400Regular' },
  blendBadge: { borderRadius: 8, borderWidth: 1, paddingHorizontal: 8, paddingVertical: 3 },
  blendBadgeText: { fontSize: 11, fontFamily: 'Inter_600SemiBold', letterSpacing: 0.2 },

  scanRefBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 10, paddingVertical: 5,
    borderWidth: 1, borderRadius: 20,
  },
  scanRefLabel: { fontSize: 12, fontFamily: 'Inter_500Medium' },

  promptInput: {
    borderWidth: 1, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12,
    fontSize: 15, fontFamily: 'Inter_400Regular', minHeight: 100,
  },

  styleGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  styleChip: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 11, paddingVertical: 8, borderRadius: 20,
  },
  styleIcon: { fontSize: 13 },
  styleLabel: { fontSize: 13, fontFamily: 'Inter_500Medium' },
  blendDot: {
    width: 16, height: 16, borderRadius: 8, backgroundColor: 'rgba(255,255,255,0.3)',
    alignItems: 'center', justifyContent: 'center', marginLeft: 2,
  },
  blendDotText: { fontSize: 10, fontFamily: 'Inter_700Bold', color: '#fff' },

  lightingRow: { gap: 8, paddingRight: 16 },
  lightChip: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 12, paddingVertical: 9, borderRadius: 20,
  },
  lightIcon: { fontSize: 14 },
  lightLabel: { fontSize: 13, fontFamily: 'Inter_500Medium' },

  artistChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    marginRight: 8,
  },
  artistName: {
    fontSize: 12,
    fontFamily: 'Inter_600SemiBold',
  },
  artistEra: {
    fontSize: 10,
    fontFamily: 'Inter_400Regular',
    marginTop: 1,
  },
  goldenInfoRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    borderWidth: 1, borderRadius: 12, padding: 12,
  },
  goldenInfoSymbol: { fontSize: 26, fontFamily: 'Inter_700Bold', width: 32, textAlign: 'center' },
  goldenInfoTitle: { fontSize: 13, fontFamily: 'Inter_600SemiBold', marginBottom: 2 },
  goldenInfoSub: { fontSize: 11, fontFamily: 'Inter_400Regular', lineHeight: 16 },

  errorRow: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 8,
    borderWidth: 1, borderRadius: 10, padding: 12,
  },
  errorText: { fontSize: 13, fontFamily: 'Inter_400Regular', flex: 1 },

  generateBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, paddingVertical: 16, borderRadius: 30,
  },
  generateBtnText: { fontSize: 17, fontFamily: 'Inter_600SemiBold' },
  hint: { fontSize: 11, fontFamily: 'Inter_400Regular', textAlign: 'center' },
});
