import React from 'react';
import { Image, StyleSheet, View } from 'react-native';

const GOLD = '#C4913A';

interface AppLogoProps {
  size?: number;
  showText?: boolean;
  textColor?: string;
  textSize?: number;
  glow?: boolean;
}

export default function AppLogo({
  size = 72,
  glow = false,
}: AppLogoProps) {
  const radius = Math.round(size * 0.22);

  if (!glow) {
    return (
      <View style={styles.wrap}>
        <Image
          source={require('@/assets/images/logo.png')}
          style={{ width: size, height: size, borderRadius: radius }}
          resizeMode="contain"
        />
      </View>
    );
  }

  const ringSize = size + 12;
  const ringRadius = Math.round(ringSize * 0.22);
  const glowSize = size + 32;
  const glowRadius = Math.round(glowSize * 0.22);

  return (
    <View style={styles.wrap}>
      <View
        style={[
          styles.outerGlow,
          { width: glowSize, height: glowSize, borderRadius: glowRadius },
        ]}
      >
        <View
          style={[
            styles.goldRing,
            { width: ringSize, height: ringSize, borderRadius: ringRadius },
          ]}
        >
          <Image
            source={require('@/assets/images/logo.png')}
            style={{ width: size, height: size, borderRadius: radius }}
            resizeMode="contain"
          />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center' },
  outerGlow: {
    backgroundColor: 'rgba(196, 145, 58, 0.10)',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0px 6px 24px rgba(196, 145, 58, 0.45)',
  },
  goldRing: {
    borderWidth: 2,
    borderColor: GOLD,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(196, 145, 58, 0.05)',
  },
});
