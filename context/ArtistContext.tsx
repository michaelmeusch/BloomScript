import AsyncStorage from '@react-native-async-storage/async-storage';
import { useUser } from '@clerk/expo';
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';

import { ArtistReview } from '@/types';

const LIKES_KEY = '@CAS:artist_likes';
const REVIEWS_KEY = '@CAS:artist_reviews';

function scopedKey(key: string, userId: string | null | undefined) {
  return userId ? `${key}:${userId}` : key;
}


function genId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
}

interface ArtistContextValue {
  likes: Record<string, boolean>;
  reviews: ArtistReview[];
  toggleLike: (artistId: string) => void;
  addReview: (artistId: string, text: string) => void;
  getLikes: (artistId: string) => boolean;
  getLikeCount: (artistId: string, baseLikes: number) => number;
  getReviews: (artistId: string) => ArtistReview[];
  isLiked: (artistId: string) => boolean;
}

const ArtistContext = createContext<ArtistContextValue | null>(null);

export function ArtistProvider({ children }: { children: React.ReactNode }) {
  const { user } = useUser();
  const userId = user?.id ?? null;
  const [likes, setLikes] = useState<Record<string, boolean>>({});
  const [reviews, setReviews] = useState<ArtistReview[]>([]);
  const isFirstLikes = useRef(true);
  const isFirstReviews = useRef(true);
  const likesTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reviewsTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const prevUserId = useRef<string | null>(null);

  useEffect(() => {
    if (prevUserId.current !== userId) {
      isFirstLikes.current = true;
      isFirstReviews.current = true;
      prevUserId.current = userId;
    }

    setLikes({});
    setReviews([]);

    if (!userId) return;

    Promise.all([
      AsyncStorage.getItem(scopedKey(LIKES_KEY, userId)),
      AsyncStorage.getItem(scopedKey(REVIEWS_KEY, userId)),
    ])
      .then(([likesRaw, reviewsRaw]) => {
        setLikes(likesRaw ? (JSON.parse(likesRaw) as Record<string, boolean>) : {});
        setReviews(reviewsRaw ? (JSON.parse(reviewsRaw) as ArtistReview[]) : []);
      })
      .catch(() => {});
  }, [userId]);

  useEffect(() => {
    if (isFirstLikes.current) { isFirstLikes.current = false; return; }
    if (!userId) return;
    if (likesTimer.current) clearTimeout(likesTimer.current);
    likesTimer.current = setTimeout(() => {
      AsyncStorage.setItem(scopedKey(LIKES_KEY, userId), JSON.stringify(likes)).catch(() => {});
    }, 400);
  }, [likes, userId]);

  useEffect(() => {
    if (isFirstReviews.current) { isFirstReviews.current = false; return; }
    if (!userId) return;
    if (reviewsTimer.current) clearTimeout(reviewsTimer.current);
    reviewsTimer.current = setTimeout(() => {
      AsyncStorage.setItem(scopedKey(REVIEWS_KEY, userId), JSON.stringify(reviews)).catch(() => {});
    }, 400);
  }, [reviews, userId]);

  const toggleLike = useCallback((artistId: string) => {
    setLikes((prev) => ({ ...prev, [artistId]: !prev[artistId] }));
  }, []);

  const addReview = useCallback((artistId: string, text: string) => {
    const review: ArtistReview = {
      id: genId(),
      artistId,
      text: text.trim(),
      createdAt: Date.now(),
    };
    setReviews((prev) => [review, ...prev]);
  }, []);

  const getLikeCount = useCallback(
    (artistId: string, baseLikes: number) =>
      baseLikes + (likes[artistId] ? 1 : 0),
    [likes]
  );

  const getReviews = useCallback(
    (artistId: string) => reviews.filter((r) => r.artistId === artistId),
    [reviews]
  );

  const getLikes = useCallback(
    (artistId: string) => !!likes[artistId],
    [likes]
  );

  const isLiked = useCallback(
    (artistId: string) => !!likes[artistId],
    [likes]
  );

  return (
    <ArtistContext.Provider
      value={{ likes, reviews, toggleLike, addReview, getLikes, getLikeCount, getReviews, isLiked }}
    >
      {children}
    </ArtistContext.Provider>
  );
}

export function useArtists() {
  const ctx = useContext(ArtistContext);
  if (!ctx) throw new Error('useArtists must be used within ArtistProvider');
  return ctx;
}
