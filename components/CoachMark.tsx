import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { useColors } from '@/hooks/useColors';

interface Props {
  icon: React.ComponentProps<typeof Feather>['name'];
  title: string;
  body: string;
  onDismiss: () => void;
}

export function CoachMark({ icon, title, body, onDismiss }: Props) {
  const colors = useColors();

  const handleDismiss = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onDismiss();
  };

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: colors.primary + '12', borderColor: colors.primary + '35' },
      ]}
    >
      <View style={styles.row}>
        <View style={[styles.iconWrap, { backgroundColor: colors.primary + '20' }]}>
          <Feather name={icon} size={14} color={colors.primary} />
        </View>
        <View style={styles.textBlock}>
          <Text style={[styles.title, { color: colors.primary }]}>{title}</Text>
          <Text style={[styles.body, { color: colors.foreground }]}>{body}</Text>
        </View>
      </View>
      <TouchableOpacity
        onPress={handleDismiss}
        activeOpacity={0.8}
        style={[styles.dismissBtn, { borderColor: colors.primary + '50', backgroundColor: colors.primary + '18' }]}
      >
        <Text style={[styles.dismissText, { color: colors.primary }]}>Got it</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    gap: 10,
  },
  row: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'flex-start',
  },
  iconWrap: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  textBlock: {
    flex: 1,
    gap: 3,
  },
  title: {
    fontSize: 13,
    fontFamily: 'Inter_700Bold',
    letterSpacing: 0.1,
  },
  body: {
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    lineHeight: 18,
  },
  dismissBtn: {
    alignSelf: 'flex-end',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
  },
  dismissText: {
    fontSize: 12,
    fontFamily: 'Inter_600SemiBold',
  },
});
