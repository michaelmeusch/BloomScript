import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useState } from 'react';

export type TipId = 'inline_editor' | 'thesaurus' | 'ai_write' | 'ai_suggest';

const ALL_TIPS: TipId[] = ['inline_editor', 'thesaurus', 'ai_write', 'ai_suggest'];

function tipKey(userId: string, tipId: TipId) {
  return `@CAS:tip:${userId}:${tipId}`;
}

export function useFirstUseTips(
  userId: string | null | undefined,
  isReturningUser: boolean,
) {
  const [seenTips, setSeenTips] = useState<Set<TipId>>(new Set(ALL_TIPS));
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!userId) {
      setLoaded(true);
      return;
    }

    if (isReturningUser) {
      setSeenTips(new Set(ALL_TIPS));
      setLoaded(true);
      return;
    }

    const keys = ALL_TIPS.map((id) => tipKey(userId, id));
    AsyncStorage.multiGet(keys)
      .then((pairs) => {
        const seen = new Set<TipId>();
        for (const [key, value] of pairs) {
          if (value === 'true') {
            const id = ALL_TIPS.find((tipId) => key === tipKey(userId, tipId));
            if (id) seen.add(id);
          }
        }
        setSeenTips(seen);
      })
      .catch(() => {
        setSeenTips(new Set(ALL_TIPS));
      })
      .finally(() => {
        setLoaded(true);
      });
  }, [userId, isReturningUser]);

  const dismissTip = useCallback(
    async (tipId: TipId) => {
      setSeenTips((prev) => {
        const next = new Set(prev);
        next.add(tipId);
        return next;
      });
      if (!userId) return;
      try {
        await AsyncStorage.setItem(tipKey(userId, tipId), 'true');
      } catch {
      }
    },
    [userId],
  );

  const isTipSeen = useCallback(
    (tipId: TipId): boolean => {
      if (!loaded) return true;
      return seenTips.has(tipId);
    },
    [seenTips, loaded],
  );

  return { isTipSeen, dismissTip, loaded };
}
