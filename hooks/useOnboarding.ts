import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';

function onboardingKey(userId: string) {
  return `@CAS:onboarding_complete:${userId}`;
}

export function useOnboarding(userId: string | null | undefined) {
  const [hasSeenOnboarding, setHasSeenOnboarding] = useState<boolean | null>(null);

  useEffect(() => {
    if (!userId) {
      setHasSeenOnboarding(null);
      return;
    }
    AsyncStorage.getItem(onboardingKey(userId))
      .then((value) => {
        setHasSeenOnboarding(value === 'true');
      })
      .catch(() => {
        setHasSeenOnboarding(true);
      });
  }, [userId]);

  const completeOnboarding = async () => {
    if (!userId) return;
    try {
      await AsyncStorage.setItem(onboardingKey(userId), 'true');
    } catch {
    }
    setHasSeenOnboarding(true);
  };

  return { hasSeenOnboarding, completeOnboarding };
}
