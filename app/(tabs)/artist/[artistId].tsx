import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useLocalSearchParams } from 'expo-router';
import React, { useState } from 'react';
import {
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
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { SEED_ARTISTS } from '@/constants/artists';
import { useArtists } from '@/context/ArtistContext';
import { useColors } from '@/hooks/useColors';
import { ArtistReview } from '@/types';

const MAX_REVIEW = 200;

function AvatarCircle({
  name,
  color,
  uri,
  size = 72,
}: {
  name: string;
  color: string;
  uri?: string;
  size?: number;
}) {
  const initials = name
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();
  return (
    <View
      style={[avatarStyles.circle, { width: size, height: size, borderRadius: size / 2, backgroundColor: color }]}
    >
      {uri ? (
        <Image
          source={{ uri }}
          style={{ width: size, height: size, borderRadius: size / 2 }}
        />
      ) : (
        <Text style={[avatarStyles.initials, { fontSize: size * 0.34 }]}>{initials}</Text>
      )}
    </View>
  );
}

const avatarStyles = StyleSheet.create({
  circle: { alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  initials: { color: '#fff', fontFamily: 'Inter_700Bold', letterSpacing: 0.5 },
});

function HeartButton({
  artistId,
  baseLikes,
  large,
}: {
  artistId: string;
  baseLikes: number;
  large?: boolean;
}) {
  const colors = useColors();
  const { toggleLike, getLikeCount, isLiked } = useArtists();
  const liked = isLiked(artistId);
  const count = getLikeCount(artistId, baseLikes);
  const scale = useSharedValue(1);
  const animStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  const handlePress = () => {
    scale.value = withSpring(1.4, { damping: 6, stiffness: 280 }, () => {
      scale.value = withSpring(1, { damping: 10, stiffness: 200 });
    });
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    toggleLike(artistId);
  };

  const iconSize = large ? 22 : 16;
  const fontSize = large ? 16 : 13;

  return (
    <TouchableOpacity onPress={handlePress} activeOpacity={0.8} style={heartStyles.row}>
      <Animated.View style={animStyle}>
        <MaterialCommunityIcons
          name={liked ? 'heart' : 'heart-outline'}
          size={iconSize}
          color={liked ? '#E05A5A' : colors.mutedForeground}
        />
      </Animated.View>
      <Text style={[heartStyles.count, { color: liked ? '#E05A5A' : colors.mutedForeground, fontSize }]}>
        {count} {large ? (count === 1 ? 'heart' : 'hearts') : ''}
      </Text>
    </TouchableOpacity>
  );
}

const heartStyles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  count: { fontFamily: 'Inter_600SemiBold' },
});

function ReviewCard({ review }: { review: ArtistReview }) {
  const colors = useColors();
  const date = new Date(review.createdAt);
  const label = date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });

  return (
    <View style={[reviewStyles.card, { backgroundColor: colors.secondary, borderColor: colors.border }]}>
      <View style={reviewStyles.top}>
        <View style={[reviewStyles.dot, { backgroundColor: colors.primary }]} />
        <Text style={[reviewStyles.date, { color: colors.mutedForeground }]}>{label}</Text>
      </View>
      <Text style={[reviewStyles.text, { color: colors.foreground }]}>{review.text}</Text>
    </View>
  );
}

const reviewStyles = StyleSheet.create({
  card: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 14,
    gap: 8,
    marginBottom: 10,
  },
  top: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  dot: { width: 6, height: 6, borderRadius: 3 },
  date: { fontSize: 11, fontFamily: 'Inter_500Medium' },
  text: { fontSize: 14, fontFamily: 'Inter_400Regular', lineHeight: 21 },
});

export default function ArtistProfileScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { artistId } = useLocalSearchParams<{ artistId: string }>();
  const { addReview, getReviews } = useArtists();

  const artist = SEED_ARTISTS.find((a) => a.id === artistId);
  const [reviewText, setReviewText] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!artist) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <Text style={{ color: colors.mutedForeground, fontFamily: 'Inter_400Regular' }}>
          Artist not found.
        </Text>
      </View>
    );
  }

  const reviews = getReviews(artist.id);

  const handleSubmitReview = () => {
    if (!reviewText.trim() || reviewText.trim().length > MAX_REVIEW) return;
    setSubmitting(true);
    addReview(artist.id, reviewText);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setReviewText('');
    setSubmitting(false);
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={90}
    >
      <ScrollView
        contentContainerStyle={{ paddingBottom: insets.bottom + 40 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Hero */}
        <View style={[styles.hero, { borderBottomColor: colors.border }]}>
          <AvatarCircle name={artist.name} color={artist.avatarColor} uri={artist.avatarUri} size={72} />
          <Text style={[styles.name, { color: colors.foreground }]}>{artist.name}</Text>
          <View style={styles.genres}>
            {artist.genres.map((g) => (
              <View key={g} style={[styles.genrePill, { backgroundColor: colors.secondary }]}>
                <Text style={[styles.genreText, { color: colors.primary }]}>{g}</Text>
              </View>
            ))}
          </View>
          <HeartButton artistId={artist.id} baseLikes={artist.baseLikes} large />
          <Text style={[styles.bio, { color: colors.mutedForeground }]}>{artist.bio}</Text>
        </View>

        {/* Books */}
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Books in Progress</Text>
        {artist.books.map((book, i) => (
          <View
            key={i}
            style={[styles.bookCard, { backgroundColor: colors.card, borderColor: colors.border }]}
          >
            <View style={styles.bookHeader}>
              <View style={[styles.genrePill, { backgroundColor: colors.secondary }]}>
                <Text style={[styles.genreText, { color: colors.primary }]}>{book.genre}</Text>
              </View>
            </View>
            <Text style={[styles.bookTitle, { color: colors.foreground }]}>{book.title}</Text>
            <Text style={[styles.bookExcerpt, { color: colors.mutedForeground }]}>
              "{book.excerpt}"
            </Text>
          </View>
        ))}

        {/* Reviews */}
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
          Reader Reviews {reviews.length > 0 ? `(${reviews.length})` : ''}
        </Text>

        {/* Submit review */}
        <View style={[styles.reviewInput, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <TextInput
            style={[styles.textInput, { color: colors.foreground }]}
            placeholder="Share your thoughts on this author's work…"
            placeholderTextColor={colors.mutedForeground}
            multiline
            maxLength={MAX_REVIEW}
            value={reviewText}
            onChangeText={setReviewText}
          />
          <View style={styles.reviewFooter}>
            <Text style={[styles.charCount, { color: reviewText.length > MAX_REVIEW - 20 ? '#E05A5A' : colors.mutedForeground }]}>
              {reviewText.length}/{MAX_REVIEW}
            </Text>
            <TouchableOpacity
              style={[
                styles.submitBtn,
                {
                  backgroundColor:
                    reviewText.trim().length > 0 && reviewText.length <= MAX_REVIEW
                      ? colors.primary
                      : colors.border,
                },
              ]}
              onPress={handleSubmitReview}
              disabled={!reviewText.trim() || reviewText.length > MAX_REVIEW || submitting}
              activeOpacity={0.85}
            >
              <Feather name="send" size={13} color={reviewText.trim().length > 0 ? colors.primaryForeground : colors.mutedForeground} />
              <Text
                style={[
                  styles.submitText,
                  { color: reviewText.trim().length > 0 ? colors.primaryForeground : colors.mutedForeground },
                ]}
              >
                Post Review
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {reviews.length === 0 && (
          <View style={[styles.emptyReviews, { borderColor: colors.border }]}>
            <Feather name="message-circle" size={22} color={colors.mutedForeground} />
            <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
              No reviews yet — be the first to leave one.
            </Text>
          </View>
        )}

        {reviews.map((r) => (
          <ReviewCard key={r.id} review={r} />
        ))}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },

  hero: {
    alignItems: 'center',
    padding: 24,
    gap: 12,
    borderBottomWidth: 1,
    marginBottom: 8,
  },
  name: { fontSize: 22, fontFamily: 'Inter_700Bold', textAlign: 'center' },
  genres: { flexDirection: 'row', gap: 8, flexWrap: 'wrap', justifyContent: 'center' },
  genrePill: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 20 },
  genreText: { fontSize: 12, fontFamily: 'Inter_500Medium' },
  bio: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    lineHeight: 22,
    textAlign: 'center',
    maxWidth: 340,
  },

  sectionTitle: {
    fontSize: 16,
    fontFamily: 'Inter_700Bold',
    marginHorizontal: 16,
    marginBottom: 10,
    marginTop: 4,
  },

  bookCard: {
    marginHorizontal: 16,
    marginBottom: 10,
    borderRadius: 14,
    borderWidth: 1,
    padding: 16,
    gap: 8,
  },
  bookHeader: { flexDirection: 'row' },
  bookTitle: { fontSize: 16, fontFamily: 'Inter_600SemiBold' },
  bookExcerpt: {
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    lineHeight: 20,
    fontStyle: 'italic',
  },

  reviewInput: {
    marginHorizontal: 16,
    marginBottom: 14,
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    gap: 10,
  },
  textInput: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    lineHeight: 21,
    minHeight: 72,
    textAlignVertical: 'top',
  },
  reviewFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  charCount: { fontSize: 11, fontFamily: 'Inter_400Regular' },
  submitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  submitText: { fontSize: 13, fontFamily: 'Inter_600SemiBold' },

  emptyReviews: {
    marginHorizontal: 16,
    marginBottom: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderStyle: 'dashed',
    padding: 24,
    alignItems: 'center',
    gap: 10,
  },
  emptyText: {
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    textAlign: 'center',
    lineHeight: 20,
  },
});
