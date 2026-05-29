import React, { useEffect, useState } from 'react';
import {
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import { useColors } from '@/hooks/useColors';

function hexToRgb(hex: string): [number, number, number] | null {
  const m = hex.replace('#', '').match(/^([0-9A-Fa-f]{6})$/);
  if (!m) return null;
  const n = parseInt(m[1], 16);
  return [(n >> 16) & 0xff, (n >> 8) & 0xff, n & 0xff];
}

function isLight(hex: string): boolean {
  const rgb = hexToRgb(hex);
  if (!rgb) return false;
  const [r, g, b] = rgb;
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255 > 0.55;
}

const PRESET_COLORS = [
  '#FFFFFF', '#F8F4EE', '#F5E6D3', '#E8D5B7',
  '#D4A574', '#C4913A', '#B8860B', '#8B6914',
  '#2D4A3E', '#3D6B5B', '#4A7C6F', '#7A9E8A',
  '#1C2E1C', '#2F4F4F', '#36454F', '#4A4A4A',
  '#2C2C2C', '#1A1A1A', '#000000', '#3E2723',
  '#5D4037', '#795548', '#8D6E63', '#A1887F',
  '#D32F2F', '#C62828', '#B71C1C', '#880E4F',
  '#AD1457', '#C2185B', '#D81B60', '#E91E63',
  '#7B1FA2', '#8E24AA', '#9C27B0', '#AB47BC',
  '#5E35B1', '#673AB7', '#7E57C2', '#9575CD',
  '#303F9F', '#3949AB', '#3F51B5', '#5C6BC0',
  '#1E88E5', '#1976D2', '#1565C0', '#0D47A1',
  '#039BE5', '#0288D1', '#0277BD', '#01579B',
  '#00897B', '#00796B', '#00695C', '#004D40',
  '#43A047', '#388E3C', '#2E7D32', '#1B5E20',
  '#7CB342', '#689F38', '#558B2F', '#33691E',
  '#FDD835', '#FBC02D', '#F9A825', '#F57F17',
  '#FFB300', '#FFA000', '#FF8F00', '#E65100',
  '#FB8C00', '#F57C00', '#EF6C00', '#BF360C',
  '#E64A19', '#D84315', '#BF360C', '#3E2723',
];

export function ColorPickerModal({
  visible,
  initialColor,
  onClose,
  onApply,
}: {
  visible: boolean;
  initialColor: string;
  onClose: () => void;
  onApply: (hex: string) => void;
}) {
  const colors = useColors();

  const [hexInput, setHexInput] = useState(initialColor.toUpperCase());
  const [hexError, setHexError] = useState(false);

  useEffect(() => {
    if (!visible) return;
    setHexInput(initialColor.toUpperCase());
    setHexError(false);
  }, [visible, initialColor]);

  const handleHexChange = (text: string) => {
    setHexInput(text.toUpperCase());
    const normalized = text.startsWith('#') ? text.toUpperCase() : '#' + text.toUpperCase();
    const valid = /^#[0-9A-F]{6}$/.test(normalized);
    setHexError(text.replace('#', '').length === 6 && !valid);
  };

  const preview = hexToRgb(hexInput) ? hexInput : initialColor;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={[styles.sheet, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.header}>
            <Text style={[styles.title, { color: colors.foreground }]}>Pick a color</Text>
            <View style={[styles.preview, { backgroundColor: preview, borderColor: colors.border }]} />
          </View>

          {/* Hex input */}
          <View style={styles.hexRow}>
            <TextInput
              value={hexInput}
              onChangeText={handleHexChange}
              autoCapitalize="characters"
              maxLength={7}
              style={[
                styles.hexInput,
                {
                  color: hexError ? '#DC2626' : colors.foreground,
                  borderColor: hexError ? '#DC2626' : colors.border,
                  backgroundColor: colors.background,
                },
              ]}
              placeholder="#FFFFFF"
              placeholderTextColor={colors.mutedForeground}
            />
          </View>

          {/* Preset swatches */}
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.swatchesGrid}
          >
            <View style={styles.swatchesRow}>
              {PRESET_COLORS.map((c) => (
                <TouchableOpacity
                  key={c}
                  onPress={() => setHexInput(c)}
                  activeOpacity={0.8}
                  style={[
                    styles.swatch,
                    { backgroundColor: c },
                    preview === c && { borderColor: colors.foreground, borderWidth: 2 },
                  ]}
                />
              ))}
            </View>
          </ScrollView>

          <View style={styles.actions}>
            <TouchableOpacity
              onPress={onClose}
              style={[styles.btn, { borderColor: colors.border }]}
              activeOpacity={0.8}
            >
              <Text style={[styles.btnText, { color: colors.mutedForeground }]}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => { onApply(preview); onClose(); }}
              disabled={!hexToRgb(preview)}
              style={[styles.btn, { backgroundColor: preview, borderColor: preview, opacity: hexToRgb(preview) ? 1 : 0.4 }]}
              activeOpacity={0.85}
            >
              <Text style={[styles.btnText, { color: isLight(preview) ? '#111827' : '#FFFFFF' }]}>
                Apply
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const SWATCH_SIZE = 34;

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'flex-end',
  },
  sheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    padding: 24,
    paddingBottom: 36,
    gap: 12,
    maxHeight: '85%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  title: {
    fontSize: 18,
    fontFamily: 'Inter_700Bold',
    letterSpacing: -0.3,
  },
  preview: {
    width: 48,
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
  },
  hexRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  hexInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 15,
    fontFamily: 'Inter_600SemiBold',
    letterSpacing: 1,
  },
  swatchesGrid: {
    paddingVertical: 4,
  },
  swatchesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    justifyContent: 'space-between',
  },
  swatch: {
    width: SWATCH_SIZE,
    height: SWATCH_SIZE,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.08)',
  },
  actions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 8,
  },
  btn: {
    flex: 1,
    paddingVertical: 13,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: 'center',
  },
  btnText: {
    fontSize: 15,
    fontFamily: 'Inter_600SemiBold',
  },
});
