import { useUser } from '@clerk/expo';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import React, { useMemo, useState } from 'react';
import {
  Image,
  ScrollView,
  StyleSheet,
  Text,
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
import { useAuthorProfile } from '@/context/AuthorProfileContext';
import { useColors } from '@/hooks/useColors';
import { ArtistProfile } from '@/types';

function AvatarCircle({
  name,
  color,
  uri,
  size = 52,
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
}: {
  artistId: string;
  baseLikes: number;
}) {
  const colors = useColors();
  const { toggleLike, getLikeCount, isLiked } = useArtists();
  const liked = isLiked(artistId);
  const count = getLikeCount(artistId, baseLikes);
  const scale = useSharedValue(1);
  const animStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  const handlePress = () => {
    scale.value = withSpring(1.35, { damping: 6, stiffness: 300 }, () => {
      scale.value = withSpring(1, { damping: 10, stiffness: 200 });
    });
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    toggleLike(artistId);
  };

  return (
    <TouchableOpacity onPress={handlePress} activeOpacity={0.8} style={heartStyles.row}>
      <Animated.View style={animStyle}>
        <MaterialCommunityIcons
          name={liked ? 'heart' : 'heart-outline'}
          size={16}
          color={liked ? '#E05A5A' : colors.mutedForeground}
        />
      </Animated.View>
      <Text style={[heartStyles.count, { color: liked ? '#E05A5A' : colors.mutedForeground }]}>
        {count}
      </Text>
    </TouchableOpacity>
  );
}

const heartStyles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  count: { fontSize: 13, fontFamily: 'Inter_500Medium' },
});

function ArtistCard({ artist }: { artist: ArtistProfile }) {
  const colors = useColors();
  const { getReviews } = useArtists();
  const reviewCount = getReviews(artist.id).length;

  return (
    <TouchableOpacity
      style={[cardStyles.card, { backgroundColor: colors.card, borderColor: colors.border }]}
      onPress={() => router.push({ pathname: '/artist/[artistId]', params: { artistId: artist.id } } as never)}
      activeOpacity={0.88}
    >
      <View style={cardStyles.top}>
        <AvatarCircle name={artist.name} color={artist.avatarColor} />
        <View style={cardStyles.topText}>
          <Text style={[cardStyles.name, { color: colors.foreground }]}>{artist.name}</Text>
          <View style={cardStyles.genres}>
            {artist.genres.slice(0, 2).map((g) => (
              <View key={g} style={[cardStyles.genrePill, { backgroundColor: colors.secondary }]}>
                <Text style={[cardStyles.genreText, { color: colors.primary }]}>{g}</Text>
              </View>
            ))}
          </View>
        </View>
        <HeartButton artistId={artist.id} baseLikes={artist.baseLikes} />
      </View>

      <Text style={[cardStyles.bio, { color: colors.mutedForeground }]} numberOfLines={3}>
        {artist.bio}
      </Text>

      <View style={[cardStyles.bookRow, { borderTopColor: colors.border }]}>
        <Feather name="book-open" size={12} color={colors.mutedForeground} />
        <Text style={[cardStyles.bookCount, { color: colors.mutedForeground }]}>
          {artist.books.length} {artist.books.length === 1 ? 'book' : 'books'} in progress
        </Text>
        <Feather name="message-circle" size={12} color={colors.mutedForeground} style={{ marginLeft: 'auto' }} />
        <Text style={[cardStyles.bookCount, { color: colors.mutedForeground }]}>
          {reviewCount} {reviewCount === 1 ? 'review' : 'reviews'}
        </Text>
        <Feather name="chevron-right" size={14} color={colors.primary} />
        <Text style={[cardStyles.viewProfile, { color: colors.primary }]}>View Profile</Text>
      </View>
    </TouchableOpacity>
  );
}

const cardStyles = StyleSheet.create({
  card: {
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    gap: 12,
  },
  top: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  topText: { flex: 1, gap: 6 },
  name: { fontSize: 16, fontFamily: 'Inter_600SemiBold' },
  genres: { flexDirection: 'row', gap: 6, flexWrap: 'wrap' },
  genrePill: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 20 },
  genreText: { fontSize: 11, fontFamily: 'Inter_500Medium' },
  bio: { fontSize: 13, fontFamily: 'Inter_400Regular', lineHeight: 20 },
  bookRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingTop: 10,
    borderTopWidth: 1,
  },
  bookCount: { fontSize: 12, fontFamily: 'Inter_400Regular' },
  viewProfile: { fontSize: 12, fontFamily: 'Inter_600SemiBold' },
});

function MyProfileCard() {
  const colors = useColors();
  const { user } = useUser();
  const { profile } = useAuthorProfile();

  const avatarUri = profile?.localAvatarUri ?? user?.imageUrl;
  const displayName = profile?.penName ?? user?.fullName ?? 'You';

  return (
    <View style={[myCardStyles.card, { backgroundColor: colors.card, borderColor: colors.primary }]}>
      <View style={myCardStyles.youBadge}>
        <View style={[myCardStyles.youDot, { backgroundColor: colors.primary }]} />
        <Text style={[myCardStyles.youLabel, { color: colors.primary }]}>YOUR PROFILE</Text>
      </View>

      <View style={myCardStyles.top}>
        <AvatarCircle
          name={displayName}
          color={colors.primary}
          uri={avatarUri}
          size={52}
        />
        <View style={myCardStyles.topText}>
          <Text style={[myCardStyles.name, { color: colors.foreground }]}>{displayName}</Text>
          {profile && profile.genres.length > 0 && (
            <View style={myCardStyles.genres}>
              {profile.genres.slice(0, 2).map((g) => (
                <View key={g} style={[myCardStyles.genrePill, { backgroundColor: colors.secondary }]}>
                  <Text style={[myCardStyles.genreText, { color: colors.primary }]}>{g}</Text>
                </View>
              ))}
            </View>
          )}
        </View>
        <TouchableOpacity
          onPress={() => router.push('/my-profile' as never)}
          activeOpacity={0.8}
          style={[myCardStyles.editBtn, { borderColor: colors.border }]}
        >
          <Feather name="edit-2" size={13} color={colors.primary} />
          <Text style={[myCardStyles.editBtnText, { color: colors.primary }]}>Edit</Text>
        </TouchableOpacity>
      </View>

      {profile?.bio ? (
        <Text style={[myCardStyles.bio, { color: colors.mutedForeground }]} numberOfLines={3}>
          {profile.bio}
        </Text>
      ) : null}
    </View>
  );
}

const myCardStyles = StyleSheet.create({
  card: {
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 16,
    borderWidth: 1.5,
    padding: 16,
    gap: 10,
  },
  youBadge: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  youDot: { width: 6, height: 6, borderRadius: 3 },
  youLabel: { fontSize: 10, fontFamily: 'Inter_700Bold', letterSpacing: 1 },
  top: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  topText: { flex: 1, gap: 6 },
  name: { fontSize: 16, fontFamily: 'Inter_600SemiBold' },
  genres: { flexDirection: 'row', gap: 6, flexWrap: 'wrap' },
  genrePill: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 20 },
  genreText: { fontSize: 11, fontFamily: 'Inter_500Medium' },
  bio: { fontSize: 13, fontFamily: 'Inter_400Regular', lineHeight: 20 },
  editBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  editBtnText: { fontSize: 12, fontFamily: 'Inter_600SemiBold' },
});

function SetupProfileBanner() {
  const colors = useColors();
  return (
    <TouchableOpacity
      style={[bannerStyles.banner, { backgroundColor: colors.secondary, borderColor: colors.border }]}
      onPress={() => router.push('/my-profile' as never)}
      activeOpacity={0.85}
    >
      <View style={[bannerStyles.iconWrap, { backgroundColor: colors.primary }]}>
        <Feather name="user-plus" size={18} color={colors.primaryForeground} />
      </View>
      <View style={bannerStyles.text}>
        <Text style={[bannerStyles.title, { color: colors.foreground }]}>Set up your author profile</Text>
        <Text style={[bannerStyles.sub, { color: colors.mutedForeground }]}>
          Share your pen name, bio and the genres you write
        </Text>
      </View>
      <Feather name="chevron-right" size={16} color={colors.primary} />
    </TouchableOpacity>
  );
}

const bannerStyles = StyleSheet.create({
  banner: {
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: { flex: 1, gap: 2 },
  title: { fontSize: 14, fontFamily: 'Inter_600SemiBold' },
  sub: { fontSize: 12, fontFamily: 'Inter_400Regular', lineHeight: 17 },
});

function GenreFilterBar({
  genres,
  active,
  onSelect,
}: {
  genres: string[];
  active: string | null;
  onSelect: (genre: string | null) => void;
}) {
  const colors = useColors();

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={filterStyles.row}
      style={[filterStyles.bar, { borderBottomColor: colors.border }]}
    >
      {/* "All" chip */}
      <TouchableOpacity
        onPress={() => {
          onSelect(null);
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }}
        activeOpacity={0.75}
        style={[
          filterStyles.chip,
          active === null
            ? { backgroundColor: colors.primary, borderColor: colors.primary }
            : { backgroundColor: colors.card, borderColor: colors.border },
        ]}
      >
        <Text
          style={[
            filterStyles.chipText,
            { color: active === null ? colors.primaryForeground : colors.foreground },
          ]}
        >
          All
        </Text>
      </TouchableOpacity>

      {genres.map((genre) => {
        const isActive = active === genre;
        return (
          <TouchableOpacity
            key={genre}
            onPress={() => {
              onSelect(isActive ? null : genre);
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            }}
            activeOpacity={0.75}
            style={[
              filterStyles.chip,
              isActive
                ? { backgroundColor: colors.primary, borderColor: colors.primary }
                : { backgroundColor: colors.card, borderColor: colors.border },
            ]}
          >
            <Text
              style={[
                filterStyles.chipText,
                { color: isActive ? colors.primaryForeground : colors.foreground },
              ]}
            >
              {genre}
            </Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

const filterStyles = StyleSheet.create({
  bar: {
    borderBottomWidth: 1,
    marginBottom: 16,
  },
  row: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  chip: {
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  chipText: {
    fontSize: 13,
    fontFamily: 'Inter_500Medium',
  },
});

export default function ArtistSpaceScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { profile, loading } = useAuthorProfile();
  const [activeGenre, setActiveGenre] = useState<string | null>(null);

  // Derive sorted unique genres from the seed data
  const allGenres = useMemo(() => {
    const set = new Set<string>();
    SEED_ARTISTS.forEach((a) => a.genres.forEach((g) => set.add(g)));
    return Array.from(set).sort();
  }, []);

  const filteredArtists = useMemo(() => {
    if (!activeGenre) return SEED_ARTISTS;
    return SEED_ARTISTS.filter((a) => a.genres.includes(activeGenre));
  }, [activeGenre]);

  const sectionLabel = activeGenre
    ? `${filteredArtists.length} of ${SEED_ARTISTS.length} AUTHORS · ${activeGenre.toUpperCase()}`
    : `${SEED_ARTISTS.length} FEATURED AUTHORS`;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: insets.bottom + 32 }}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.hero, { backgroundColor: colors.secondary, borderBottomColor: colors.border }]}>
          <View style={[styles.heroIconWrap, { backgroundColor: colors.primary }]}>
            <Feather name="users" size={22} color={colors.primaryForeground} />
          </View>
          <View style={styles.heroText}>
            <Text style={[styles.heroTitle, { color: colors.foreground }]}>Artist Space</Text>
            <Text style={[styles.heroSub, { color: colors.mutedForeground }]}>
              Discover aspiring authors, heart their work, and leave a review.
            </Text>
          </View>
        </View>

        {/* User's own profile section */}
        {!loading && (
          profile ? <MyProfileCard /> : <SetupProfileBanner />
        )}

        {/* Genre filter bar */}
        <GenreFilterBar
          genres={allGenres}
          active={activeGenre}
          onSelect={setActiveGenre}
        />

        <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>
          {sectionLabel}
        </Text>

        {filteredArtists.length > 0 ? (
          filteredArtists.map((artist) => (
            <ArtistCard key={artist.id} artist={artist} />
          ))
        ) : (
          <View style={styles.emptyState}>
            <Feather name="search" size={28} color={colors.border} />
            <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
              No authors found for this genre
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  hero: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 20,
    marginBottom: 16,
    borderBottomWidth: 1,
  },
  heroIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroText: { flex: 1, gap: 3 },
  heroTitle: { fontSize: 20, fontFamily: 'Inter_700Bold' },
  heroSub: { fontSize: 13, fontFamily: 'Inter_400Regular', lineHeight: 18 },
  sectionLabel: {
    fontSize: 11,
    fontFamily: 'Inter_600SemiBold',
    letterSpacing: 0.8,
    marginHorizontal: 16,
    marginBottom: 12,
    marginTop: 4,
  },
  emptyState: {
    alignItems: 'center',
    gap: 12,
    paddingVertical: 48,
  },
  emptyText: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
  },
});
