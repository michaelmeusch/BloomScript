import { useUser } from '@clerk/expo';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
  Alert,
  Image,
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

import { useAuthorProfile } from '@/context/AuthorProfileContext';
import { themes, ThemeName } from '@/constants/colors';
import { useTheme } from '@/context/ThemeContext';
import { useColors } from '@/hooks/useColors';
import { ALL_GENRES, AuthorProfile, Genre } from '@/types';

const COLOR_SCHEMES: { name: ThemeName; label: string; swatches: string[] }[] = [
  { name: 'classic', label: 'Classic', swatches: ['#F8F4EE', '#2D4A3E', '#C4913A'] },
  { name: 'midnight', label: 'Midnight Ink', swatches: ['#0D1117', '#3A6B9A', '#E8C87A'] },
  { name: 'sage', label: 'Sage & Linen', swatches: ['#F0EAE0', '#4A7B6F', '#C0553E'] },
  { name: 'dusk', label: 'Dusk Plum', swatches: ['#130E1E', '#9B7FD4', '#E8A86E'] },
  { name: 'blossom', label: 'Blossom', swatches: ['#FDF6F8', '#C2607A', '#D4926A'] },
  { name: 'steel', label: 'Steel & Navy', swatches: ['#D2BCA1', '#273F5B', '#6F481C'] },
  { name: 'bordeaux', label: 'Bordeaux & Hunter', swatches: ['#D8D0C2', '#233126', '#4A1A23'] },
  { name: 'forest', label: 'Forest', swatches: ['#F0F5F0', '#2E5232', '#7AAAB2'] },
  { name: 'wisteria', label: 'Wisteria', swatches: ['#F5F1FA', '#6B4A8C', '#4A9B8A'] },
];

const MAX_BIO = 300;
const MAX_GENRES = 3;

export default function MyProfileScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { user } = useUser();
  const { profile, saveProfile } = useAuthorProfile();
  const { themeName, setTheme } = useTheme();

  const [penName, setPenName] = useState(profile?.penName ?? user?.fullName ?? '');
  const [bio, setBio] = useState(profile?.bio ?? '');
  const [selectedGenres, setSelectedGenres] = useState<Genre[]>(profile?.genres ?? []);
  const [localAvatarUri, setLocalAvatarUri] = useState<string | undefined>(
    profile?.localAvatarUri
  );
  // Hydrate form once when the profile arrives from AsyncStorage (async load case).
  // We use a ref so user edits are never overwritten after initial hydration.
  const hydrated = useRef(profile !== null);
  useEffect(() => {
    if (hydrated.current || !profile) return;
    hydrated.current = true;
    setPenName(profile.penName);
    setBio(profile.bio);
    setSelectedGenres(profile.genres);
    setLocalAvatarUri(profile.localAvatarUri);
  }, [profile]);

  const avatarUri = localAvatarUri ?? user?.imageUrl;

  const initials = penName
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase() || '?';

  const canSave = penName.trim().length > 0 && bio.trim().length > 0 && selectedGenres.length > 0;

  const handlePickPhoto = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Photo Access Needed',
        'To set a profile picture, allow BloomScript Novels Scripts Comic Production to access your photo library in Settings.',
        [{ text: 'OK' }]
      );
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      setLocalAvatarUri(result.assets[0].uri);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const handleToggleGenre = (genre: Genre) => {
    setSelectedGenres((prev) => {
      if (prev.includes(genre)) return prev.filter((g) => g !== genre);
      if (prev.length >= MAX_GENRES) return prev;
      return [...prev, genre];
    });
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handleSave = () => {
    if (!canSave) return;
    const p: AuthorProfile = {
      penName: penName.trim(),
      bio: bio.trim(),
      genres: selectedGenres,
      localAvatarUri,
    };
    saveProfile(p);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    router.back();
  };

  return (
    <KeyboardAvoidingView
      style={[styles.root, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* Header */}
      <View
        style={[
          styles.header,
          {
            paddingTop: insets.top + 12,
            backgroundColor: colors.background,
            borderBottomColor: colors.border,
          },
        ]}
      >
        <TouchableOpacity onPress={() => router.back()} style={styles.headerBtn} activeOpacity={0.7}>
          <Text style={[styles.headerBtnText, { color: colors.mutedForeground }]}>Cancel</Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>Author Profile</Text>
        <TouchableOpacity
          onPress={handleSave}
          style={styles.headerBtn}
          activeOpacity={0.7}
          disabled={!canSave}
        >
          <Text
            style={[
              styles.headerBtnText,
              { color: canSave ? colors.primary : colors.border, fontFamily: 'Inter_700Bold' },
            ]}
          >
            Done
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 40 }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Avatar picker */}
        <View style={styles.avatarSection}>
          <TouchableOpacity onPress={handlePickPhoto} activeOpacity={0.85} style={styles.avatarWrap}>
            {avatarUri ? (
              <Image source={{ uri: avatarUri }} style={styles.avatarImg} />
            ) : (
              <View style={[styles.avatarFallback, { backgroundColor: colors.primary }]}>
                <Text style={[styles.avatarInitials, { color: colors.primaryForeground }]}>
                  {initials}
                </Text>
              </View>
            )}
            <View style={[styles.avatarOverlay, { backgroundColor: colors.primary }]}>
              <Feather name="camera" size={14} color="#fff" />
            </View>
          </TouchableOpacity>
          <Text style={[styles.avatarHint, { color: colors.mutedForeground }]}>
            Tap to change photo
          </Text>
        </View>

        {/* Pen name */}
        <View style={styles.section}>
          <Text style={[styles.label, { color: colors.foreground }]}>Pen Name</Text>
          <TextInput
            style={[
              styles.input,
              { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground },
            ]}
            placeholder="Your author name…"
            placeholderTextColor={colors.mutedForeground}
            value={penName}
            onChangeText={setPenName}
            maxLength={60}
            returnKeyType="next"
          />
        </View>

        {/* Bio */}
        <View style={styles.section}>
          <View style={styles.labelRow}>
            <Text style={[styles.label, { color: colors.foreground }]}>Bio</Text>
            <Text
              style={[
                styles.charCount,
                { color: bio.length > MAX_BIO - 30 ? '#E05A5A' : colors.mutedForeground },
              ]}
            >
              {bio.length}/{MAX_BIO}
            </Text>
          </View>
          <TextInput
            style={[
              styles.bioInput,
              { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground },
            ]}
            placeholder="Tell readers about yourself and what you write…"
            placeholderTextColor={colors.mutedForeground}
            value={bio}
            onChangeText={(t) => setBio(t.slice(0, MAX_BIO))}
            multiline
            textAlignVertical="top"
          />
        </View>

        {/* Genres */}
        <View style={styles.section}>
          <View style={styles.labelRow}>
            <Text style={[styles.label, { color: colors.foreground }]}>Genres</Text>
            <Text style={[styles.charCount, { color: colors.mutedForeground }]}>
              {selectedGenres.length}/{MAX_GENRES}
            </Text>
          </View>
          <Text style={[styles.genreHint, { color: colors.mutedForeground }]}>
            Pick up to {MAX_GENRES} genres you write in
          </Text>
          <View style={styles.genreGrid}>
            {ALL_GENRES.map((genre) => {
              const selected = selectedGenres.includes(genre);
              const disabled = !selected && selectedGenres.length >= MAX_GENRES;
              return (
                <TouchableOpacity
                  key={genre}
                  onPress={() => handleToggleGenre(genre)}
                  activeOpacity={0.75}
                  disabled={disabled}
                  style={[
                    styles.genreChip,
                    {
                      backgroundColor: selected ? colors.primary : colors.card,
                      borderColor: selected ? colors.primary : colors.border,
                      opacity: disabled ? 0.4 : 1,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.genreChipText,
                      { color: selected ? colors.primaryForeground : colors.foreground },
                    ]}
                  >
                    {genre}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Color scheme */}
        <View style={styles.section}>
          <Text style={[styles.label, { color: colors.foreground }]}>App Theme</Text>
          <Text style={[styles.genreHint, { color: colors.mutedForeground }]}>
            Choose the look and feel of your writing space
          </Text>
          <View style={themeStyles.grid}>
            {COLOR_SCHEMES.map((scheme) => {
              const isSelected = themeName === scheme.name;
              const palette = themes[scheme.name];
              return (
                <TouchableOpacity
                  key={scheme.name}
                  style={[
                    themeStyles.schemeCard,
                    {
                      backgroundColor: palette.card,
                      borderColor: isSelected ? palette.primary : palette.border,
                      borderWidth: isSelected ? 2 : 1,
                    },
                  ]}
                  onPress={() => {
                    setTheme(scheme.name);
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  }}
                  activeOpacity={0.8}
                >
                  <View style={[themeStyles.preview, { backgroundColor: palette.background }]}>
                    <View style={[themeStyles.previewBar, { backgroundColor: palette.card, borderBottomColor: palette.border }]}>
                      <View style={[themeStyles.previewDot, { backgroundColor: palette.primary }]} />
                      <View style={[themeStyles.previewLine, { backgroundColor: palette.muted }]} />
                    </View>
                    <View style={themeStyles.previewBody}>
                      <View style={[themeStyles.previewRow, { backgroundColor: palette.card, borderColor: palette.border }]}>
                        <View style={[themeStyles.previewAccent, { backgroundColor: palette.primary }]} />
                        <View style={[themeStyles.previewTextLine, { backgroundColor: palette.foreground }]} />
                      </View>
                      <View style={[themeStyles.previewRow, { backgroundColor: palette.card, borderColor: palette.border }]}>
                        <View style={[themeStyles.previewAccent, { backgroundColor: palette.accent }]} />
                        <View style={[themeStyles.previewTextLine, { backgroundColor: palette.mutedForeground, opacity: 0.6 }]} />
                      </View>
                    </View>
                  </View>
                  <View style={themeStyles.cardInfo}>
                    <View style={themeStyles.swatchRow}>
                      {scheme.swatches.map((hex) => (
                        <View key={hex} style={[themeStyles.swatch, { backgroundColor: hex, borderColor: palette.border }]} />
                      ))}
                      {isSelected && (
                        <View style={[themeStyles.checkBadge, { backgroundColor: palette.primary }]}>
                          <Feather name="check" size={9} color={palette.primaryForeground} />
                        </View>
                      )}
                    </View>
                    <Text style={[themeStyles.schemeLabel, { color: palette.foreground }]}>{scheme.label}</Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },

  header: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  headerBtn: { minWidth: 60 },
  headerBtnText: { fontSize: 16, fontFamily: 'Inter_500Medium' },
  headerTitle: { fontSize: 16, fontFamily: 'Inter_700Bold' },

  scroll: { padding: 20, gap: 24 },

  avatarSection: { alignItems: 'center', gap: 8, marginBottom: 4 },
  avatarWrap: { position: 'relative' },
  avatarImg: { width: 96, height: 96, borderRadius: 48 },
  avatarFallback: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitials: { fontSize: 34, fontFamily: 'Inter_700Bold' },
  avatarOverlay: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  avatarHint: { fontSize: 12, fontFamily: 'Inter_400Regular' },

  section: { gap: 8 },
  labelRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  label: { fontSize: 14, fontFamily: 'Inter_600SemiBold' },
  charCount: { fontSize: 11, fontFamily: 'Inter_400Regular' },

  input: {
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    fontFamily: 'Inter_400Regular',
  },
  bioInput: {
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    lineHeight: 22,
    minHeight: 110,
  },

  genreHint: { fontSize: 12, fontFamily: 'Inter_400Regular', marginTop: -4 },
  genreGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  genreChip: {
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 7,
  },
  genreChipText: { fontSize: 13, fontFamily: 'Inter_500Medium' },

});

const themeStyles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  schemeCard: {
    width: '47%',
    borderRadius: 12,
    overflow: 'hidden',
  },
  preview: {
    height: 70,
    overflow: 'hidden',
  },
  previewBar: {
    height: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 6,
    borderBottomWidth: 1,
  },
  previewDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  previewLine: {
    flex: 1,
    height: 3,
    borderRadius: 2,
    opacity: 0.4,
  },
  previewBody: {
    flex: 1,
    padding: 4,
    gap: 3,
  },
  previewRow: {
    flex: 1,
    borderRadius: 5,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 4,
  },
  previewAccent: {
    width: 3,
    alignSelf: 'stretch',
    borderRadius: 2,
    marginVertical: 3,
  },
  previewTextLine: {
    flex: 1,
    height: 3,
    borderRadius: 2,
    opacity: 0.7,
  },
  cardInfo: {
    padding: 8,
    gap: 3,
  },
  swatchRow: {
    flexDirection: 'row',
    gap: 3,
    alignItems: 'center',
    marginBottom: 1,
  },
  swatch: {
    width: 12,
    height: 12,
    borderRadius: 3,
    borderWidth: 1,
  },
  checkBadge: {
    width: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 2,
  },
  schemeLabel: {
    fontSize: 12,
    fontFamily: 'Inter_600SemiBold',
    letterSpacing: -0.1,
  },
});
