import { Feather } from '@expo/vector-icons';
import * as FileSystem from 'expo-file-system/legacy';
import * as Haptics from 'expo-haptics';
import { useLocalSearchParams, router } from 'expo-router';
import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useBooks } from '@/context/BookContext';
import { useColors } from '@/hooks/useColors';
import {
  generateAndShareEpub,
  generateAndShareDocx,
  generateAndShareKdpPdf,
  TrimSize,
  TRIM_SIZES,
  estimatePageNumbers,
} from '@/lib/kdp';

const COVER_RATIO = 1000 / 625;

export default function PrintBookScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { bookId } = useLocalSearchParams<{ bookId: string }>();
  const { getBook } = useBooks();

  const book = getBook(bookId ?? '');

  const [trimSize, setTrimSize] = useState<TrimSize>('6x9');
  const [isExporting, setIsExporting] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const { pageMap, totalPages } = useMemo(() => {
    if (!book) return { pageMap: {} as Record<string, number>, totalPages: 0 };
    return estimatePageNumbers(book);
  }, [book]);

  const totalWords = useMemo(() => {
    if (!book) return 0;
    return book.chapters.reduce(
      (sum, c) =>
        sum + c.sections.reduce((s2, s) => s2 + s.content.trim().split(/\s+/).filter(Boolean).length, 0),
      0
    );
  }, [book]);

  const handleExport = async (format: 'kdp-pdf' | 'epub' | 'docx') => {
    if (!book) return;
    setIsExporting(format);
    setError(null);
    try {
      let coverBase64: string | undefined;
      let coverMimeType: string | undefined;
      if (book.coverImageUri && format === 'kdp-pdf') {
        try {
          if (Platform.OS === 'web') {
            if (book.coverImageUri.startsWith('data:')) {
              const comma = book.coverImageUri.indexOf(',');
              const header = book.coverImageUri.slice(0, comma);
              coverBase64 = book.coverImageUri.slice(comma + 1);
              coverMimeType = header.match(/data:([^;]+)/)?.[1] ?? 'image/png';
            }
          } else {
            coverBase64 = await FileSystem.readAsStringAsync(book.coverImageUri, {
              encoding: FileSystem.EncodingType.Base64,
            });
            coverMimeType = book.coverImageUri.toLowerCase().endsWith('.png') ? 'image/png' : 'image/jpeg';
          }
        } catch {
          // Cover unreadable — proceed without it
        }
      }

      if (format === 'kdp-pdf') {
        await generateAndShareKdpPdf(book, trimSize, coverBase64, coverMimeType);
      } else if (format === 'epub') {
        await generateAndShareEpub(book);
      } else {
        await generateAndShareDocx(book);
      }
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (err) {
      const e = err as { message?: string };
      setError(e.message ?? 'Export failed. Please try again.');
    } finally {
      setIsExporting(null);
    }
  };

  const bottomPadding = (Platform.OS === 'web' ? 34 : insets.bottom) + 40;

  if (!book) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <TouchableOpacity
          style={[styles.closeBtn, { backgroundColor: colors.secondary }]}
          onPress={() => router.back()}
        >
          <Feather name="x" size={18} color={colors.mutedForeground} />
        </TouchableOpacity>
        <Text style={[styles.notFound, { color: colors.mutedForeground }]}>Book not found</Text>
      </View>
    );
  }

  const includeTOC = !!book.includeTOC;
  const includePrologue = !!book.includePrologue && !!book.prologue?.trim();
  const includeEpilogue = !!book.includeEpilogue && !!book.epilogue?.trim();

  const coverWidth = 144;
  const coverHeight = Math.round(coverWidth * COVER_RATIO);

  const kdpChecklist = [
    { ok: !!book.title, label: 'Book title is set' },
    { ok: !!book.coverImageUri, label: 'Cover image generated (625 × 1,000 px min)' },
    { ok: !!book.coverAuthorName, label: 'Author name set on cover' },
    { ok: book.chapters.length > 0, label: 'At least one chapter exists' },
    { ok: book.chapters.some((c) => c.sections.some((s) => s.content.trim())), label: 'Content written in chapters' },
    { ok: totalPages >= 24, label: `Minimum 24 pages for print (~${totalPages} estimated)` },
  ];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: bottomPadding }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={[styles.closeBtn, { backgroundColor: colors.secondary }]}
            onPress={() => router.back()}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Feather name="x" size={18} color={colors.mutedForeground} />
          </TouchableOpacity>
          <View style={styles.headerText}>
            <Text style={[styles.screenTitle, { color: colors.foreground }]}>Print Preview</Text>
            <Text style={[styles.screenSubtitle, { color: colors.mutedForeground }]}>
              Amazon KDP · Print-Ready Export
            </Text>
          </View>
        </View>

        {/* Book Hero */}
        <View style={[styles.heroCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => router.push({ pathname: '/cover-generator', params: { bookId: book.id } })}
          >
            <View
              style={[
                styles.coverBox,
                { width: coverWidth, height: coverHeight, backgroundColor: colors.secondary, borderColor: colors.border },
              ]}
            >
              {book.coverImageUri ? (
                <Image source={{ uri: book.coverImageUri }} style={StyleSheet.absoluteFill} resizeMode="cover" />
              ) : (
                <View style={styles.coverEmpty}>
                  <Feather name="image" size={22} color={colors.mutedForeground} />
                  <Text style={[styles.coverEmptyLabel, { color: colors.mutedForeground }]}>Add Cover</Text>
                </View>
              )}
              <View style={[styles.coverSpine, { backgroundColor: 'rgba(0,0,0,0.14)' }]} />
            </View>
          </TouchableOpacity>

          <View style={styles.heroMeta}>
            <Text style={[styles.heroTitle, { color: colors.foreground }]} numberOfLines={3}>
              {book.title}
            </Text>
            {book.coverAuthorName ? (
              <Text style={[styles.heroAuthor, { color: colors.mutedForeground }]}>
                by {book.coverAuthorName}
              </Text>
            ) : null}
            {book.genre ? (
              <View style={[styles.genrePill, { backgroundColor: colors.secondary }]}>
                <Text style={[styles.genreText, { color: colors.mutedForeground }]}>{book.genre}</Text>
              </View>
            ) : null}
            <View style={styles.statsRow}>
              <View style={styles.stat}>
                <Text style={[styles.statValue, { color: colors.foreground }]}>
                  {totalWords > 999 ? `${(totalWords / 1000).toFixed(1)}k` : totalWords}
                </Text>
                <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>words</Text>
              </View>
              <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
              <View style={styles.stat}>
                <Text style={[styles.statValue, { color: colors.foreground }]}>~{totalPages}</Text>
                <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>pages</Text>
              </View>
              <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
              <View style={styles.stat}>
                <Text style={[styles.statValue, { color: colors.foreground }]}>{book.chapters.length}</Text>
                <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>chapters</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Table of Contents */}
        <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>TABLE OF CONTENTS</Text>
        <View style={[styles.tocCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          {/* Cover page */}
          {book.coverImageUri ? (
            <View style={[styles.tocRow, { borderBottomColor: colors.border }]}>
              <Text style={[styles.tocEntryItalic, { color: colors.mutedForeground }]}>Cover Page</Text>
              <View style={[styles.tocDots, { borderColor: colors.border }]} />
              <Text style={[styles.tocPage, { color: colors.mutedForeground }]}>—</Text>
            </View>
          ) : null}

          {/* Title page */}
          <View style={[styles.tocRow, { borderBottomColor: colors.border }]}>
            <Text style={[styles.tocEntryItalic, { color: colors.mutedForeground }]}>Title Page</Text>
            <View style={[styles.tocDots, { borderColor: colors.border }]} />
            <Text style={[styles.tocPage, { color: colors.mutedForeground }]}>i</Text>
          </View>

          {/* TOC page itself */}
          {includeTOC ? (
            <View style={[styles.tocRow, { borderBottomColor: colors.border }]}>
              <Text style={[styles.tocEntryItalic, { color: colors.mutedForeground }]}>Table of Contents</Text>
              <View style={[styles.tocDots, { borderColor: colors.border }]} />
              <Text style={[styles.tocPage, { color: colors.mutedForeground }]}>ii</Text>
            </View>
          ) : null}

          {/* Prologue */}
          {includePrologue ? (
            <View style={[styles.tocRow, { borderBottomColor: colors.border }]}>
              <Text style={[styles.tocEntry, { color: colors.foreground }]}>Prologue</Text>
              <View style={[styles.tocDots, { borderColor: colors.border }]} />
              <Text style={[styles.tocPage, { color: colors.foreground }]}>{pageMap['prologue'] ?? 1}</Text>
            </View>
          ) : null}

          {/* Chapters */}
          {book.chapters.map((chapter, idx) => {
            const isLast = idx === book.chapters.length - 1 && !includeEpilogue;
            return (
              <View
                key={chapter.id}
                style={[styles.tocRow, !isLast && { borderBottomColor: colors.border }]}
              >
                <View style={styles.tocChapterLeft}>
                  <Text style={[styles.tocChapterNum, { color: colors.mutedForeground }]}>
                    {chapter.number}
                  </Text>
                  <Text style={[styles.tocEntry, { color: colors.foreground, flex: 1 }]} numberOfLines={1}>
                    {chapter.title}
                  </Text>
                </View>
                <View style={[styles.tocDots, { borderColor: colors.border }]} />
                <Text style={[styles.tocPage, { color: colors.foreground }]}>
                  {pageMap[chapter.id] ?? idx + 1}
                </Text>
              </View>
            );
          })}

          {/* Epilogue */}
          {includeEpilogue ? (
            <View style={[styles.tocRow, { borderBottomWidth: 0 }]}>
              <Text style={[styles.tocEntry, { color: colors.foreground }]}>Epilogue</Text>
              <View style={[styles.tocDots, { borderColor: colors.border }]} />
              <Text style={[styles.tocPage, { color: colors.foreground }]}>{pageMap['epilogue'] ?? '—'}</Text>
            </View>
          ) : null}

          {book.chapters.length === 0 ? (
            <Text style={[styles.tocEmpty, { color: colors.mutedForeground }]}>
              Add chapters to see them here.
            </Text>
          ) : null}
        </View>

        {/* Trim Size */}
        <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>KDP TRIM SIZE</Text>
        <View style={[styles.trimCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          {TRIM_SIZES.map((ts, idx) => (
            <TouchableOpacity
              key={ts.id}
              style={[
                styles.trimRow,
                idx < TRIM_SIZES.length - 1 && { borderBottomColor: colors.border, borderBottomWidth: StyleSheet.hairlineWidth },
                trimSize === ts.id && { backgroundColor: colors.primary + '0D' },
              ]}
              onPress={() => setTrimSize(ts.id)}
              activeOpacity={0.7}
            >
              <View
                style={[
                  styles.radio,
                  { borderColor: trimSize === ts.id ? colors.primary : colors.border },
                ]}
              >
                {trimSize === ts.id ? (
                  <View style={[styles.radioDot, { backgroundColor: colors.primary }]} />
                ) : null}
              </View>
              <View style={styles.trimText}>
                <Text style={[styles.trimLabel, { color: colors.foreground }]}>{ts.label}</Text>
                <Text style={[styles.trimDesc, { color: colors.mutedForeground }]}>{ts.desc}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Export */}
        <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>EXPORT</Text>

        {error ? (
          <View style={[styles.errorBanner, { backgroundColor: '#C0392B18', borderColor: '#C0392B40' }]}>
            <Feather name="alert-circle" size={14} color="#C0392B" />
            <Text style={[styles.errorText, { color: '#C0392B' }]}>{error}</Text>
          </View>
        ) : null}

        {/* Primary: Amazon KDP PDF */}
        <TouchableOpacity
          style={[styles.primaryBtn, { backgroundColor: colors.primary }]}
          onPress={() => handleExport('kdp-pdf')}
          disabled={!!isExporting}
          activeOpacity={0.85}
        >
          {isExporting === 'kdp-pdf' ? (
            <ActivityIndicator color={colors.primaryForeground} size="small" />
          ) : (
            <Feather name="printer" size={20} color={colors.primaryForeground} />
          )}
          <View style={styles.primaryBtnText}>
            <Text style={[styles.primaryBtnLabel, { color: colors.primaryForeground }]}>
              Amazon KDP PDF
            </Text>
            <Text style={[styles.primaryBtnDesc, { color: colors.primaryForeground + 'AA' }]}>
              {book.coverImageUri
                ? 'Print-ready PDF with cover page included'
                : 'Print-ready interior PDF · generate a cover to include it'}
            </Text>
          </View>
          {isExporting !== 'kdp-pdf' ? (
            <Feather name="chevron-right" size={16} color={colors.primaryForeground + '88'} />
          ) : null}
        </TouchableOpacity>

        {/* Secondary exports */}
        <View style={[styles.secondaryCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <TouchableOpacity
            style={[styles.secondaryRow, { borderBottomColor: colors.border }]}
            onPress={() => handleExport('epub')}
            disabled={!!isExporting}
            activeOpacity={0.7}
          >
            {isExporting === 'epub' ? (
              <ActivityIndicator size="small" color={colors.accent} />
            ) : (
              <Feather name="book-open" size={18} color={colors.accent} />
            )}
            <View style={styles.secondaryText}>
              <Text style={[styles.secondaryLabel, { color: colors.foreground }]}>Kindle EPUB</Text>
              <Text style={[styles.secondaryDesc, { color: colors.mutedForeground }]}>
                Upload to KDP for Kindle ebook distribution
              </Text>
            </View>
            <Feather name="chevron-right" size={14} color={colors.mutedForeground} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.secondaryRow, { borderBottomWidth: 0 }]}
            onPress={() => handleExport('docx')}
            disabled={!!isExporting}
            activeOpacity={0.7}
          >
            {isExporting === 'docx' ? (
              <ActivityIndicator size="small" color={colors.accent} />
            ) : (
              <Feather name="file" size={18} color={colors.accent} />
            )}
            <View style={styles.secondaryText}>
              <Text style={[styles.secondaryLabel, { color: colors.foreground }]}>DOCX Manuscript</Text>
              <Text style={[styles.secondaryDesc, { color: colors.mutedForeground }]}>
                Word format accepted by KDP for paperbacks
              </Text>
            </View>
            <Feather name="chevron-right" size={14} color={colors.mutedForeground} />
          </TouchableOpacity>
        </View>

        {/* KDP Checklist */}
        <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>KDP CHECKLIST</Text>
        <View style={[styles.checklistCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          {kdpChecklist.map((item, idx) => (
            <View
              key={idx}
              style={[
                styles.checkRow,
                idx < kdpChecklist.length - 1 && {
                  borderBottomWidth: StyleSheet.hairlineWidth,
                  borderBottomColor: colors.border,
                },
              ]}
            >
              <Feather
                name={item.ok ? 'check-circle' : 'circle'}
                size={16}
                color={item.ok ? colors.accent : colors.border}
              />
              <Text
                style={[
                  styles.checkLabel,
                  { color: item.ok ? colors.foreground : colors.mutedForeground },
                ]}
              >
                {item.label}
              </Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { padding: 16, gap: 10 },
  notFound: { textAlign: 'center', marginTop: 60, fontSize: 15, fontFamily: 'Inter_400Regular' },

  header: { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 4 },
  closeBtn: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  headerText: { flex: 1 },
  screenTitle: { fontSize: 20, fontFamily: 'Inter_700Bold' },
  screenSubtitle: { fontSize: 12, fontFamily: 'Inter_400Regular', marginTop: 2 },

  heroCard: {
    flexDirection: 'row',
    gap: 16,
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
  },
  coverBox: {
    borderRadius: 8,
    borderWidth: 1,
    overflow: 'hidden',
    flexShrink: 0,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 2, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 6,
  },
  coverEmpty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 6 },
  coverEmptyLabel: { fontSize: 11, fontFamily: 'Inter_500Medium' },
  coverSpine: { position: 'absolute', left: 0, top: 0, bottom: 0, width: 8 },
  heroMeta: { flex: 1, gap: 6, justifyContent: 'center' },
  heroTitle: { fontSize: 18, fontFamily: 'Inter_700Bold', lineHeight: 24 },
  heroAuthor: { fontSize: 13, fontFamily: 'Inter_400Regular' },
  genrePill: { alignSelf: 'flex-start', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 3 },
  genreText: { fontSize: 11, fontFamily: 'Inter_500Medium' },
  statsRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 },
  stat: { alignItems: 'center' },
  statValue: { fontSize: 15, fontFamily: 'Inter_700Bold' },
  statLabel: { fontSize: 10, fontFamily: 'Inter_400Regular' },
  statDivider: { width: 1, height: 28 },

  sectionLabel: {
    fontSize: 11,
    fontFamily: 'Inter_600SemiBold',
    letterSpacing: 1,
    marginTop: 6,
    paddingHorizontal: 4,
  },

  tocCard: { borderRadius: 14, borderWidth: 1, overflow: 'hidden' },
  tocRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 11,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: 6,
  },
  tocChapterLeft: { flexDirection: 'row', alignItems: 'center', gap: 8, flexShrink: 1, maxWidth: '70%' },
  tocChapterNum: { fontSize: 11, fontFamily: 'Inter_700Bold', width: 18, textAlign: 'center' },
  tocEntry: { fontSize: 14, fontFamily: 'Inter_500Medium' },
  tocEntryItalic: { fontSize: 13, fontFamily: 'Inter_400Regular', fontStyle: 'italic' },
  tocDots: {
    flex: 1,
    height: 1,
    borderBottomWidth: 1,
    borderStyle: 'dashed',
    marginBottom: 2,
  },
  tocPage: { fontSize: 13, fontFamily: 'Inter_600SemiBold', minWidth: 28, textAlign: 'right' },
  tocEmpty: { padding: 16, textAlign: 'center', fontSize: 13, fontFamily: 'Inter_400Regular' },

  trimCard: { borderRadius: 14, borderWidth: 1, overflow: 'hidden' },
  trimRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 14, paddingVertical: 13 },
  radio: { width: 18, height: 18, borderRadius: 9, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  radioDot: { width: 8, height: 8, borderRadius: 4 },
  trimText: { flex: 1 },
  trimLabel: { fontSize: 14, fontFamily: 'Inter_600SemiBold' },
  trimDesc: { fontSize: 12, fontFamily: 'Inter_400Regular', marginTop: 1 },

  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: 10,
    borderWidth: 1,
    padding: 12,
  },
  errorText: { flex: 1, fontSize: 13, fontFamily: 'Inter_400Regular' },

  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    borderRadius: 16,
    padding: 18,
  },
  primaryBtnText: { flex: 1 },
  primaryBtnLabel: { fontSize: 16, fontFamily: 'Inter_700Bold' },
  primaryBtnDesc: { fontSize: 12, fontFamily: 'Inter_400Regular', marginTop: 3, lineHeight: 17 },

  secondaryCard: { borderRadius: 14, borderWidth: 1, overflow: 'hidden' },
  secondaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  secondaryText: { flex: 1 },
  secondaryLabel: { fontSize: 14, fontFamily: 'Inter_600SemiBold' },
  secondaryDesc: { fontSize: 12, fontFamily: 'Inter_400Regular', marginTop: 2 },

  checklistCard: { borderRadius: 14, borderWidth: 1, overflow: 'hidden' },
  checkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  checkLabel: { flex: 1, fontSize: 13, fontFamily: 'Inter_400Regular', lineHeight: 18 },
});
