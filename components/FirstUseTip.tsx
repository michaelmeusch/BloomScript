import { Feather } from '@expo/vector-icons';
import React, { useEffect, useRef, useState } from 'react';
import { Animated, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { useColors } from '@/hooks/useColors';

interface Props {
  visible: boolean;
  message: string;
  onDismiss: () => void;
  icon?: keyof typeof Feather.glyphMap;
  bottomOffset?: number;
}

export function FirstUseTip({ visible, message, onDismiss, icon = 'info', bottomOffset = 16 }: Props) {
  const colors = useColors();
  const translateY = useRef(new Animated.Value(80)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    if (visible && !mounted) setMounted(true);
  }, [visible]);

  useEffect(() => {
    if (!mounted) return;
    if (visible) {
      Animated.parallel([
        Animated.spring(translateY, {
          toValue: 0,
          useNativeDriver: true,
          tension: 70,
          friction: 10,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: 80,
          duration: 220,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0,
          duration: 180,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible, mounted]);

  if (!mounted) return null;

  return (
    <Animated.View
      pointerEvents={visible ? 'box-none' : 'none'}
      style={[
        styles.container,
        {
          backgroundColor: colors.card,
          borderColor: colors.border,
          bottom: bottomOffset,
          transform: [{ translateY }],
          opacity,
        },
      ]}
    >
      <View style={[styles.iconWrap, { backgroundColor: colors.primary + '18' }]}>
        <Feather name={icon} size={15} color={colors.primary} />
      </View>
      <Text style={[styles.message, { color: colors.foreground }]} numberOfLines={3}>
        {message}
      </Text>
      <TouchableOpacity
        onPress={onDismiss}
        activeOpacity={0.75}
        style={[styles.gotIt, { backgroundColor: colors.primary }]}
      >
        <Text style={[styles.gotItText, { color: colors.primaryForeground }]}>Got it</Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 16,
    right: 16,
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
    paddingHorizontal: 13,
    paddingVertical: 11,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.13,
    shadowRadius: 10,
    elevation: 7,
    zIndex: 200,
  },
  iconWrap: {
    width: 30,
    height: 30,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  message: {
    flex: 1,
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    lineHeight: 18,
  },
  gotIt: {
    borderRadius: 8,
    paddingHorizontal: 11,
    paddingVertical: 7,
    flexShrink: 0,
  },
  gotItText: {
    fontSize: 12,
    fontFamily: 'Inter_600SemiBold',
  },
});
