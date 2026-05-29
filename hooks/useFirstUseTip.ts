import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useState } from 'react';

function tipKey(tipId: string, userId: string) {
  return `@CAS:tip_seen:${tipId}:${userId}`;
}

export function useFirstUseTip(tipId: string, userId: string | null | undefined) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!userId) return;
    AsyncStorage.getItem(tipKey(tipId, userId))
      .then((val) => {
        if (val !== 'true') setVisible(true);
      })
      .catch(() => {});
  }, [tipId, userId]);

  const dismiss = useCallback(async () => {
    setVisible(false);
    if (!userId) return;
    await AsyncStorage.setItem(tipKey(tipId, userId), 'true').catch(() => {});
  }, [tipId, userId]);

  return { visible, dismiss };
}
