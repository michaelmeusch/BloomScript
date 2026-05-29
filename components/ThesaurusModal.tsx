import { Feather } from '@expo/vector-icons';
import { useAuth } from '@clerk/expo';
import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';
import React, { useCallback, useEffect, useRef, useState } from 'react';
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
import { useFirstUseTip } from '@/hooks/useFirstUseTip';

interface DatamuseWord {
  word: string;
  score: number;
  tags?: string[];
}

type PoSGroup = {
  label: string;
  words: string[];
};

const POS_LABELS: Record<string, string> = {
  n: 'Nouns',
  v: 'Verbs',
  adj: 'Adjectives',
  adv: 'Adverbs',
  other: 'Other',
};

function groupByPoS(words: DatamuseWord[]): PoSGroup[] {
  const map: Record<string, string[]> = {};
  for (const w of words) {
    const pos = w.tags?.find((t) => ['n', 'v', 'adj', 'adv'].includes(t)) ?? 'other';
    if (!map[pos]) map[pos] = [];
    map[pos]!.push(w.word);
  }
  const order = ['adj', 'adv', 'v', 'n', 'other'];
  return order
    .filter((p) => map[p])
    .map((p) => ({ label: POS_LABELS[p] ?? p, words: map[p]! }));
}

interface Props {
  visible: boolean;
  onClose: () => void;
  /** When provided the modal opens with this word pre-searched */
  prefilledWord?: string;
  /** When provided, chips show "Replace" behaviour instead of copy */
  onSelectSynonym?: (synonym: string) => void;
}

export function ThesaurusModal({ visible, onClose, prefilledWord, onSelectSynonym }: Props) {
  const colors = useColors();
  const { userId } = useAuth();
  const inputRef = useRef<TextInput>(null);

  const { visible: tipVisible, dismiss: dismissTip } = useFirstUseTip('tip_thesaurus', userId);

  const [query, setQuery] = useState('');
  const [groups, setGroups] = useState<PoSGroup[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copiedWord, setCopiedWord] = useState<string | null>(null);
  const [searched, setSearched] = useState(false);

  const lookup = useCallback(async (word: string) => {
    const w = word.trim().toLowerCase();
    if (!w) return;
    setLoading(true);
    setError(null);
    setGroups([]);
    setSearched(true);
    try {
      const [synRes, relRes] = await Promise.all([
        fetch(`https://api.datamuse.com/words?rel_syn=${encodeURIComponent(w)}&md=p&max=40`),
        fetch(`https://api.datamuse.com/words?ml=${encodeURIComponent(w)}&md=p&max=20`),
      ]);
      const synWords: DatamuseWord[] = synRes.ok ? await synRes.json() : [];
      const relWords: DatamuseWord[] = relRes.ok ? await relRes.json() : [];

      const seen = new Set<string>();
      const merged: DatamuseWord[] = [];
      for (const item of [...synWords, ...relWords]) {
        if (!seen.has(item.word) && item.word !== w) {
          seen.add(item.word);
          merged.push(item);
        }
      }
      const result = groupByPoS(merged);
      setGroups(result);
      if (result.length === 0) setError(`No synonyms found for "${w}".`);
    } catch {
      setError('Could not connect. Check your internet connection.');
    } finally {
      setLoading(false);
    }
  }, []);

  // Auto-search when a pre-filled word is provided on open
  useEffect(() => {
    if (visible && prefilledWord && prefilledWord.trim()) {
      setQuery(prefilledWord.trim());
      lookup(prefilledWord.trim());
    }
  }, [visible, prefilledWord, lookup]);

  const handleSubmit = () => {
    Haptics.selectionAsync();
    lookup(query);
  };

  const handleChipPress = async (word: string) => {
    if (onSelectSynonym) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      onSelectSynonym(word);
      handleClose();
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      await Clipboard.setStringAsync(word);
      setCopiedWord(word);
      setTimeout(() => setCopiedWord(null), 2000);
    }
  };

  const handleClose = () => {
    setQuery('');
    setGroups([]);
    setError(null);
    setSearched(false);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={handleClose}
    >
      <View style={styles.overlay}>
        <View style={[styles.sheet, { backgroundColor: colors.card, borderColor: colors.border }]}>
          {/* Handle */}
          <View style={[styles.handle, { backgroundColor: colors.border }]} />

          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <Feather name="book" size={18} color={colors.primary} />
              <Text style={[styles.title, { color: colors.foreground }]}>Thesaurus</Text>
            </View>
            <TouchableOpacity
              onPress={handleClose}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            >
              <Feather name="x" size={20} color={colors.mutedForeground} />
            </TouchableOpacity>
          </View>

          {/* Search */}
          <View style={[styles.searchRow, { backgroundColor: colors.background, borderColor: colors.border }]}>
            <Feather name="search" size={16} color={colors.mutedForeground} />
            <TextInput
              ref={inputRef}
              style={[styles.searchInput, { color: colors.foreground }]}
              placeholder="Look up a word…"
              placeholderTextColor={colors.mutedForeground}
              value={query}
              onChangeText={setQuery}
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="search"
              onSubmitEditing={handleSubmit}
            />
            {query.length > 0 && (
              <TouchableOpacity
                onPress={() => { setQuery(''); setGroups([]); setError(null); setSearched(false); }}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Feather name="x-circle" size={15} color={colors.mutedForeground} />
              </TouchableOpacity>
            )}
          </View>

          <TouchableOpacity
            onPress={handleSubmit}
            disabled={!query.trim() || loading}
            activeOpacity={0.85}
            style={[
              styles.lookupBtn,
              {
                backgroundColor: query.trim() ? colors.primary : colors.secondary,
                opacity: loading ? 0.7 : 1,
              },
            ]}
          >
            {loading ? (
              <ActivityIndicator size="small" color={query.trim() ? colors.primaryForeground : colors.mutedForeground} />
            ) : (
              <Text style={[styles.lookupBtnText, { color: query.trim() ? colors.primaryForeground : colors.mutedForeground }]}>
                Find Synonyms
              </Text>
            )}
          </TouchableOpacity>

          {tipVisible && (
            <View style={[styles.tipBanner, { backgroundColor: colors.primary + '12', borderColor: colors.primary + '30' }]}>
              <Feather name="info" size={13} color={colors.primary} />
              <Text style={[styles.tipText, { color: colors.foreground }]}>
                {onSelectSynonym
                  ? 'Tap any word to swap it into your writing.'
                  : 'Tap any word to copy it — then paste it into your writing.'}
              </Text>
              <TouchableOpacity onPress={dismissTip} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                <Feather name="x" size={14} color={colors.mutedForeground} />
              </TouchableOpacity>
            </View>
          )}

          {/* Results */}
          <ScrollView
            style={styles.results}
            contentContainerStyle={styles.resultsContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {error && (
              <View style={[styles.emptyState, { backgroundColor: colors.secondary }]}>
                <Feather name="alert-circle" size={16} color={colors.mutedForeground} />
                <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>{error}</Text>
              </View>
            )}

            {!searched && !loading && (
              <View style={styles.emptyState}>
                <Feather name="type" size={28} color={colors.border} />
                <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
                  Type a word above and tap{' '}
                  <Text style={{ fontFamily: 'Inter_600SemiBold' }}>Find Synonyms</Text>.
                </Text>
                <Text style={[styles.emptyHint, { color: colors.mutedForeground }]}>
                  Tap any result to copy it to your clipboard — then paste it into your writing.
                </Text>
              </View>
            )}

            {groups.map((group) => (
              <View key={group.label} style={styles.group}>
                <Text style={[styles.groupLabel, { color: colors.mutedForeground }]}>
                  {group.label.toUpperCase()}
                </Text>
                <View style={styles.chips}>
                  {group.words.map((word) => {
                    const copied = copiedWord === word;
                    return (
                      <TouchableOpacity
                        key={word}
                        onPress={() => handleChipPress(word)}
                        activeOpacity={0.7}
                        style={[
                          styles.chip,
                          {
                            backgroundColor: copied ? colors.accent + '22' : colors.background,
                            borderColor: copied ? colors.accent : colors.border,
                          },
                        ]}
                      >
                        {copied && (
                          <Feather name="check" size={11} color={colors.accent} />
                        )}
                        <Text
                          style={[
                            styles.chipText,
                            { color: copied ? colors.accent : colors.foreground },
                          ]}
                        >
                          {word}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            ))}

            {groups.length > 0 && (
              <Text style={[styles.copyHint, { color: colors.mutedForeground }]}>
                {onSelectSynonym
                  ? 'Tap any word to replace it in your text'
                  : 'Tap any word to copy it · paste into your writing'}
              </Text>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  sheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderTopWidth: 1,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    padding: 20,
    paddingBottom: 36,
    maxHeight: '88%',
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontSize: 18,
    fontFamily: 'Inter_700Bold',
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    fontFamily: 'Inter_400Regular',
  },
  lookupBtn: {
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  lookupBtnText: {
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
  },
  results: {
    flex: 1,
  },
  resultsContent: {
    gap: 16,
    paddingBottom: 8,
  },
  emptyState: {
    alignItems: 'center',
    gap: 10,
    padding: 24,
    borderRadius: 14,
  },
  emptyText: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    textAlign: 'center',
    lineHeight: 20,
  },
  emptyHint: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    textAlign: 'center',
    lineHeight: 18,
    opacity: 0.8,
  },
  group: {
    gap: 8,
  },
  groupLabel: {
    fontSize: 10,
    fontFamily: 'Inter_600SemiBold',
    letterSpacing: 1.2,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
  },
  chipText: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
  },
  copyHint: {
    fontSize: 11,
    fontFamily: 'Inter_400Regular',
    textAlign: 'center',
    opacity: 0.7,
    marginTop: 4,
  },
  tipBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 9,
    marginBottom: 12,
  },
  tipText: {
    flex: 1,
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    lineHeight: 18,
  },
});
