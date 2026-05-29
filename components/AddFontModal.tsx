import { Feather } from '@expo/vector-icons';
import * as Font from 'expo-font';
import * as Haptics from 'expo-haptics';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import { useColors } from '@/hooks/useColors';
import { customFontFamilyKey, fetchGoogleFontUrl } from '@/hooks/useCustomFonts';

interface Props {
  visible: boolean;
  onClose: () => void;
  onAdd: (label: string, family: string, fontUrl: string) => Promise<void>;
}

type Phase = 'idle' | 'loading' | 'preview' | 'error';

// Popular comic-style fonts available on Google Fonts
// (Comic Sans is a Microsoft font — not on Google Fonts; Comic Neue is the closest open alternative)
const COMIC_FONTS: { label: string; hint: string }[] = [
  { label: 'Bangers',           hint: 'Classic comics style' },
  { label: 'Comic Neue',        hint: 'Comic Sans alt' },
  { label: 'Boogaloo',          hint: 'Fun condensed' },
  { label: 'Permanent Marker',  hint: 'Marker hand-drawn' },
  { label: 'Creepster',         hint: 'Horror comic' },
  { label: 'Fredoka One',       hint: 'Rounded friendly' },
  { label: 'Luckiest Guy',      hint: 'Retro cartoon' },
  { label: 'Russo One',         hint: 'Bold headline' },
  { label: 'Titan One',         hint: 'Heavy display' },
  { label: 'Pacifico',          hint: 'Fun cursive' },
  { label: 'Cabin Sketch',      hint: 'Sketch outline' },
  { label: 'Caveat',            hint: 'Handwritten casual' },
];

// Detect if user typed a non-Google font we can suggest an alternative for
function maybeComicSansAlternative(name: string): string | null {
  const lower = name.toLowerCase().replace(/\s+/g, '');
  if (lower.includes('comicsans') || lower === 'comicsanms' || lower === 'comicsansms') {
    return 'Comic Sans is a Microsoft font and isn\'t on Google Fonts. Try "Comic Neue" — it\'s the open-source alternative with the same feel.';
  }
  if (lower.includes('impact')) {
    return '"Impact" isn\'t on Google Fonts. Try "Oswald" or "Russo One" for a similar bold condensed look.';
  }
  if (lower.includes('arial') || lower.includes('helvetica')) {
    return `"${name}" is a system font, not on Google Fonts. Try "Inter", "Open Sans", or "DM Sans" instead.`;
  }
  if (lower.includes('times') || lower.includes('timesnewroman')) {
    return '"Times New Roman" isn\'t on Google Fonts. Try "Libre Baskerville" or "EB Garamond" for a similar serif look.';
  }
  return null;
}

export function AddFontModal({ visible, onClose, onAdd }: Props) {
  const colors = useColors();
  const [input, setInput] = useState('');
  const [phase, setPhase] = useState<Phase>('idle');
  const [previewFamily, setPreviewFamily] = useState('');
  const [previewUrl, setPreviewUrl] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [saving, setSaving] = useState(false);

  const doLoad = async (label: string) => {
    if (!label.trim()) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setPhase('loading');
    setErrorMsg('');
    try {
      const url = await fetchGoogleFontUrl(label);
      const family = customFontFamilyKey(label);
      try {
        await Font.loadAsync({ [family]: { uri: url } });
      } catch {
        throw new Error(`Found "${label}" but could not load it — try a different font`);
      }
      setPreviewFamily(family);
      setPreviewUrl(url);
      setPhase('preview');
    } catch (e: unknown) {
      const alternative = maybeComicSansAlternative(label);
      const raw = e instanceof Error ? e.message : 'Font not found. Check the spelling.';
      setErrorMsg(alternative ?? raw);
      setPhase('error');
    }
  };

  const handleLoad = () => doLoad(input.trim());

  const handleChip = (label: string) => {
    setInput(label);
    setPhase('idle');
    doLoad(label);
  };

  const handleAdd = async () => {
    setSaving(true);
    try {
      await onAdd(input.trim(), previewFamily, previewUrl);
      handleClose();
    } finally {
      setSaving(false);
    }
  };

  const handleClose = () => {
    setInput('');
    setPhase('idle');
    setPreviewFamily('');
    setPreviewUrl('');
    setErrorMsg('');
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={handleClose}>
      <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={handleClose} />
      <View style={[styles.sheet, { backgroundColor: colors.card, borderTopColor: colors.border }]}>
        <View style={[styles.handle, { backgroundColor: colors.border }]} />

        <Text style={[styles.title, { color: colors.foreground }]}>Add a Font</Text>
        <Text style={[styles.sub, { color: colors.mutedForeground }]}>
          Tap a popular comic font below, or type any name from fonts.google.com and tap Load.
        </Text>

        {/* Comic font quick-pick chips */}
        <View>
          <Text style={[styles.chipSectionLabel, { color: colors.mutedForeground }]}>POPULAR COMIC FONTS</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.chipRow}
          >
            {COMIC_FONTS.map((f) => {
              const active = input === f.label && phase === 'preview';
              return (
                <TouchableOpacity
                  key={f.label}
                  onPress={() => handleChip(f.label)}
                  style={[
                    styles.chip,
                    {
                      backgroundColor: active ? colors.primary : colors.background,
                      borderColor: active ? colors.primary : colors.border,
                    },
                  ]}
                  activeOpacity={0.75}
                >
                  <Text style={[styles.chipLabel, { color: active ? colors.primaryForeground : colors.foreground }]}>
                    {f.label}
                  </Text>
                  <Text style={[styles.chipHint, { color: active ? colors.primaryForeground : colors.mutedForeground }]}>
                    {f.hint}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* Manual search */}
        <View style={[styles.inputRow, { borderColor: colors.border, backgroundColor: colors.background }]}>
          <TextInput
            value={input}
            onChangeText={(v) => { setInput(v); if (phase !== 'idle') setPhase('idle'); }}
            placeholder="e.g. Bangers, Abril Fatface, Bitter"
            placeholderTextColor={colors.mutedForeground}
            style={[styles.input, { color: colors.foreground }]}
            autoCorrect={false}
            autoCapitalize="words"
            returnKeyType="search"
            onSubmitEditing={handleLoad}
          />
          <TouchableOpacity
            onPress={handleLoad}
            disabled={!input.trim() || phase === 'loading'}
            style={[styles.loadBtn, { backgroundColor: colors.primary, opacity: !input.trim() ? 0.4 : 1 }]}
          >
            {phase === 'loading' ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text style={styles.loadBtnText}>Load</Text>
            )}
          </TouchableOpacity>
        </View>

        {phase === 'preview' && (
          <View style={[styles.previewCard, { backgroundColor: colors.background, borderColor: colors.primary }]}>
            <Text style={[styles.previewLabel, { color: colors.mutedForeground }]}>PREVIEW</Text>
            <Text style={[styles.previewName, { color: colors.foreground, fontFamily: previewFamily }]}>
              {input.trim()}
            </Text>
            <Text style={[styles.previewBody, { color: colors.mutedForeground, fontFamily: previewFamily }]}>
              Pow! Zap! Boom! The hero strikes back.
            </Text>
          </View>
        )}

        {phase === 'error' && (
          <View style={[styles.errorCard, { backgroundColor: colors.background, borderColor: '#E53E3E' }]}>
            <View style={styles.errorRow}>
              <Feather name="alert-circle" size={14} color="#E53E3E" />
              <Text style={styles.errorText}>{errorMsg}</Text>
            </View>
          </View>
        )}

        <View style={styles.actions}>
          <TouchableOpacity
            onPress={handleClose}
            style={[styles.cancelBtn, { borderColor: colors.border }]}
          >
            <Text style={[styles.cancelText, { color: colors.mutedForeground }]}>Cancel</Text>
          </TouchableOpacity>
          {phase === 'preview' && (
            <TouchableOpacity
              onPress={handleAdd}
              disabled={saving}
              style={[styles.addBtn, { backgroundColor: colors.primary }]}
            >
              {saving ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={styles.addBtnText}>Add Font</Text>
              )}
            </TouchableOpacity>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: '#00000050' },
  sheet: {
    borderTopWidth: 1,
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    padding: 20,
    paddingBottom: 36,
    gap: 14,
  },
  handle: { width: 36, height: 4, borderRadius: 2, alignSelf: 'center', marginBottom: 2 },
  title: { fontSize: 18, fontFamily: 'Inter_700Bold', textAlign: 'center' },
  sub: { fontSize: 13, fontFamily: 'Inter_400Regular', textAlign: 'center', lineHeight: 19, marginTop: -6 },
  chipSectionLabel: { fontSize: 10, fontFamily: 'Inter_600SemiBold', letterSpacing: 1, marginBottom: 8 },
  chipRow: { flexDirection: 'row', gap: 8, paddingRight: 8, paddingBottom: 4 },
  chip: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    alignItems: 'center',
    minWidth: 100,
  },
  chipLabel: { fontSize: 13, fontFamily: 'Inter_600SemiBold' },
  chipHint: { fontSize: 10, fontFamily: 'Inter_400Regular', marginTop: 1 },
  inputRow: { flexDirection: 'row', borderRadius: 12, borderWidth: 1, overflow: 'hidden' },
  input: {
    flex: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    fontFamily: 'Inter_400Regular',
  },
  loadBtn: { paddingHorizontal: 18, justifyContent: 'center', alignItems: 'center', minWidth: 68 },
  loadBtnText: { color: '#fff', fontSize: 14, fontFamily: 'Inter_700Bold' },
  previewCard: { borderWidth: 1.5, borderRadius: 12, padding: 14, gap: 6 },
  previewLabel: { fontSize: 10, fontFamily: 'Inter_600SemiBold', letterSpacing: 1, textTransform: 'uppercase' },
  previewName: { fontSize: 24, lineHeight: 32 },
  previewBody: { fontSize: 14, lineHeight: 22 },
  errorCard: { borderWidth: 1, borderRadius: 12, padding: 12 },
  errorRow: { flexDirection: 'row', gap: 6, alignItems: 'flex-start' },
  errorText: { color: '#E53E3E', fontSize: 13, fontFamily: 'Inter_400Regular', flex: 1, lineHeight: 18 },
  actions: { flexDirection: 'row', gap: 10, marginTop: 2 },
  cancelBtn: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 13,
    alignItems: 'center',
  },
  cancelText: { fontSize: 14, fontFamily: 'Inter_500Medium' },
  addBtn: { flex: 2, borderRadius: 12, paddingVertical: 13, alignItems: 'center' },
  addBtnText: { color: '#fff', fontSize: 14, fontFamily: 'Inter_700Bold' },
});
