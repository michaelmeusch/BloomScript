import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import * as Print from 'expo-print';
import { useLocalSearchParams, router } from 'expo-router';
import * as Sharing from 'expo-sharing';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Modal,
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
import { useSubscription, REVENUECAT_EXPORT_ENTITLEMENT } from '@/lib/revenuecat';
import {
  generateAndShareEpub,
  generateAndShareDocx,
  generateAndShareKdpPdf,
  KdpFormat,
  TrimSize,
  TRIM_SIZES,
} from '@/lib/kdp';
import { Book } from '@/types';
import { DEFAULT_FONT_ID, DEFAULT_HEADING_FONT_ID, getFontById, googleFontsCssLink } from '@/constants/fonts';

type ExportFormat = 'pdf' | 'txt' | 'markdown';

type FeatherName = React.ComponentProps<typeof Feather>['name'];

const FORMAT_OPTIONS: { id: ExportFormat; label: string; ext: string; desc: string; icon: FeatherName }[] = [
  { id: 'pdf', label: 'PDF', ext: '.pdf', desc: 'Beautifully formatted, ready to share or print', icon: 'file-text' },
  { id: 'txt', label: 'Plain Text', ext: '.txt', desc: 'Simple text file, works everywhere', icon: 'align-left' },
  { id: 'markdown', label: 'Markdown', ext: '.md', desc: 'Structured format for writers & developers', icon: 'hash' },
];

const KDP_FORMAT_OPTIONS: { id: KdpFormat; label: string; ext: string; desc: string; icon: FeatherName }[] = [
  { id: 'epub', label: 'Kindle EPUB', ext: '.epub', desc: 'Upload to KDP for Kindle ebook distribution', icon: 'book-open' },
  { id: 'docx', label: 'DOCX Manuscript', ext: '.docx', desc: 'Word format accepted by KDP for text books', icon: 'file' },
  { id: 'kdp-pdf', label: 'Print PDF', ext: '.pdf', desc: 'Print-ready PDF with KDP trim size & margins', icon: 'printer' },
];

function esc(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function paragraphs(text: string): string {
  return text
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean)
    .map((p) => `<p>${esc(p).replace(/\n/g, '<br/>')}</p>`)
    .join('');
}

function generateHtml(book: Book): string {
  const escapedTitle = esc(book.title);
  const escapedGenre = esc(book.genre);
  const escapedDesc = esc(book.description);
  const font = getFontById(book.previewFontId ?? DEFAULT_FONT_ID);
  const headingFont = getFontById(book.headingFontId ?? DEFAULT_HEADING_FONT_ID);
  const includeTOC = !!book.includeTOC;
  const includePrologue =
    !!book.includePrologue && (book.prologue?.trim().length ?? 0) > 0;
  const includeEpilogue =
    !!book.includeEpilogue && (book.epilogue?.trim().length ?? 0) > 0;

  const tocHtml = includeTOC
    ? `<div class="toc">
        <h2 class="toc-title">Table of Contents</h2>
        <ol class="toc-list">
          ${includePrologue ? `<li><span>Prologue</span></li>` : ''}
          ${book.chapters
            .map(
              (c) =>
                `<li><span>Chapter ${c.number}: ${esc(c.title)}</span></li>`,
            )
            .join('')}
          ${includeEpilogue ? `<li><span>Epilogue</span></li>` : ''}
        </ol>
      </div>`
    : '';

  const prologueHtml = includePrologue
    ? `<div class="chapter front-matter">
        <hr class="divider"/>
        <p class="chapter-num">Prologue</p>
        ${paragraphs(book.prologue!.trim())}
      </div>`
    : '';

  const epilogueHtml = includeEpilogue
    ? `<div class="chapter front-matter">
        <hr class="divider"/>
        <p class="chapter-num">Epilogue</p>
        ${paragraphs(book.epilogue!.trim())}
      </div>`
    : '';

  const chaptersHtml = book.chapters
    .map((chapter) => {
      const chapterTitle = esc(chapter.title);
      const body = chapter.sections
        .filter((s) => s.content.trim())
        .map((s) => {
          const heading = s.prompt.trim()
            ? `<h3 class="section-prompt">${esc(s.prompt.trim())}</h3>`
            : '';
          return `${heading}${paragraphs(s.content.trim())}`;
        })
        .join('');
      return `
      <div class="chapter">
        <hr class="divider"/>
        <p class="chapter-num">Chapter ${chapter.number}</p>
        <h2 class="chapter-title">${chapterTitle}</h2>
        ${body || '<p class="empty-chapter">[No content written]</p>'}
      </div>`;
    })
    .join('');

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8"/>
  <link href="${googleFontsCssLink()}" rel="stylesheet"/>
  <style>
    @page { margin: 56pt; }
    body { font-family: ${font.cssStack}; font-size: 12pt; line-height: 1.8; color: #1a1a1a; }
    .title-page { text-align: center; padding: 60pt 0 48pt; }
    h1 { font-family: ${headingFont.cssStack}; font-size: 30pt; margin: 0 0 10pt; letter-spacing: -0.5pt; }
    .genre { font-size: 9pt; text-transform: uppercase; letter-spacing: 2pt; color: #888; margin: 0; }
    .description { font-size: 11pt; color: #555; font-style: italic; margin-top: 16pt; max-width: 400pt; margin-left: auto; margin-right: auto; }
    .toc { page-break-before: always; padding: 40pt 0 0; }
    h2.toc-title { font-family: ${headingFont.cssStack}; font-size: 22pt; margin: 0 0 20pt; text-align: center; }
    ol.toc-list { list-style: none; padding: 0; margin: 0; }
    ol.toc-list li { font-size: 12pt; margin: 0 0 8pt; padding: 0 0 4pt; border-bottom: 0.5pt dashed #ccc; }
    .chapter { margin-top: 32pt; page-break-before: always; }
    .front-matter { font-style: normal; }
    hr.divider { border: none; border-top: 0.5pt solid #ccc; margin-bottom: 20pt; }
    .chapter-num { font-size: 9pt; text-transform: uppercase; letter-spacing: 2pt; color: #999; margin: 0 0 4pt; }
    h2.chapter-title { font-family: ${headingFont.cssStack}; font-size: 20pt; margin: 0 0 20pt; font-weight: bold; }
    h3.section-prompt { font-size: 11pt; font-weight: normal; font-style: italic; color: #666; margin: 18pt 0 6pt; letter-spacing: 0.3pt; }
    p { margin: 0 0 12pt; text-align: justify; }
    .empty-chapter { color: #999; font-style: italic; }
  </style>
</head>
<body>
  <div class="title-page">
    <h1>${escapedTitle}</h1>
    ${escapedGenre ? `<p class="genre">${escapedGenre}</p>` : ''}
    ${escapedDesc ? `<p class="description">${escapedDesc}</p>` : ''}
  </div>
  ${tocHtml}
  ${prologueHtml}
  ${chaptersHtml}
  ${epilogueHtml}
</body>
</html>`;
}

function generateText(book: Book): string {
  const includeTOC = !!book.includeTOC;
  const includePrologue =
    !!book.includePrologue && (book.prologue?.trim().length ?? 0) > 0;
  const includeEpilogue =
    !!book.includeEpilogue && (book.epilogue?.trim().length ?? 0) > 0;

  let out = `${book.title}\n`;
  if (book.genre) out += `Genre: ${book.genre}\n`;
  if (book.description) out += `\n${book.description}\n`;
  out += '\n';

  if (includeTOC) {
    out += `\nTABLE OF CONTENTS\n${'─'.repeat(20)}\n`;
    if (includePrologue) out += `Prologue\n`;
    for (const c of book.chapters) out += `Chapter ${c.number}: ${c.title}\n`;
    if (includeEpilogue) out += `Epilogue\n`;
    out += '\n';
  }

  if (includePrologue) {
    out += `\n${'─'.repeat(40)}\nPROLOGUE\n${'─'.repeat(40)}\n\n${book.prologue!.trim()}\n\n`;
  }

  for (const chapter of book.chapters) {
    out += `\n${'─'.repeat(40)}\n`;
    out += `Chapter ${chapter.number}: ${chapter.title}\n`;
    out += `${'─'.repeat(40)}\n\n`;
    for (const section of chapter.sections) {
      if (section.content.trim()) {
        if (section.prompt.trim()) out += `— ${section.prompt.trim()} —\n\n`;
        out += `${section.content.trim()}\n\n`;
      }
    }
  }

  if (includeEpilogue) {
    out += `\n${'─'.repeat(40)}\nEPILOGUE\n${'─'.repeat(40)}\n\n${book.epilogue!.trim()}\n\n`;
  }

  return out.trim();
}

function generateMarkdown(book: Book): string {
  const includeTOC = !!book.includeTOC;
  const includePrologue =
    !!book.includePrologue && (book.prologue?.trim().length ?? 0) > 0;
  const includeEpilogue =
    !!book.includeEpilogue && (book.epilogue?.trim().length ?? 0) > 0;

  let out = `# ${book.title}\n\n`;
  if (book.genre) out += `**Genre:** ${book.genre}\n\n`;
  if (book.description) out += `${book.description}\n\n`;
  out += '---\n\n';

  if (includeTOC) {
    out += `## Table of Contents\n\n`;
    if (includePrologue) out += `- Prologue\n`;
    for (const c of book.chapters) out += `- Chapter ${c.number}: ${c.title}\n`;
    if (includeEpilogue) out += `- Epilogue\n`;
    out += `\n---\n\n`;
  }

  if (includePrologue) {
    out += `## Prologue\n\n${book.prologue!.trim()}\n\n---\n\n`;
  }

  for (const chapter of book.chapters) {
    out += `## Chapter ${chapter.number}: ${chapter.title}\n\n`;
    const body = chapter.sections
      .filter((s) => s.content.trim())
      .map((s) =>
        s.prompt.trim()
          ? `### ${s.prompt.trim()}\n\n${s.content.trim()}`
          : s.content.trim()
      )
      .join('\n\n');
    if (body) out += `${body}\n\n`;
    out += '---\n\n';
  }

  if (includeEpilogue) {
    out += `## Epilogue\n\n${book.epilogue!.trim()}\n\n---\n\n`;
  }

  return out.trim();
}

function safeName(title: string): string {
  return title.replace(/[^a-zA-Z0-9 ]/g, '').replace(/\s+/g, '_').slice(0, 60) || 'book';
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function wrapTextAsHtml(title: string, content: string): string {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8"/>
  <style>
    body { font-family: Georgia, 'Times New Roman', Times, serif; padding: 24px; white-space: pre-wrap; line-height: 1.7; color: #111; }
    h1 { font-size: 24px; margin: 0 0 16px; }
    pre { white-space: pre-wrap; word-wrap: break-word; margin: 0; }
  </style>
</head>
<body>
  <h1>${escapeHtml(title)}</h1>
  <pre>${escapeHtml(content)}</pre>
</body>
</html>`;
}

export default function ExportBookScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { bookId } = useLocalSearchParams<{ bookId: string }>();
  const { getBook } = useBooks();
  const {
    isSubscribed,
    customerInfo,
    offerings,
    isPurchasing: rcPurchasing,
    purchase,
    initError: rcInitError,
  } = useSubscription();

  const book = getBook(bookId ?? '');

  const [selectedFormat, setSelectedFormat] = useState<ExportFormat>(
    Platform.OS === 'web' ? 'txt' : 'pdf'
  );
  const [isExporting, setIsExporting] = useState(false);
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [confirmVisible, setConfirmVisible] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [kdpVisible, setKdpVisible] = useState(false);
  const [selectedKdpFormat, setSelectedKdpFormat] = useState<KdpFormat>('epub');
  const [trimSize, setTrimSize] = useState<TrimSize>('6x9');
  const [checklistExpanded, setChecklistExpanded] = useState(false);
  const [kdpExporting, setKdpExporting] = useState(false);
  const [kdpError, setKdpError] = useState<string | null>(null);

  const hasExportAccess =
    isSubscribed ||
    customerInfo?.entitlements.active?.[REVENUECAT_EXPORT_ENTITLEMENT] !== undefined;

  const exportPkg = offerings?.all?.['exports']?.availablePackages?.[0];
  const priceStr = exportPkg?.product.priceString ?? '$9.99';

  const handleExport = async () => {
    if (!book) return;
    setIsExporting(true);
    setError(null);
    try {
      const name = safeName(book.title);

      if (selectedFormat === 'pdf') {
        const html = generateHtml(book);
        const result = await Print.printToFileAsync({ html });
        if (!result?.uri) {
          setError('PDF generation failed. Please try again.');
          return;
        }
        await Sharing.shareAsync(result.uri, {
          mimeType: 'application/pdf',
          dialogTitle: `Share "${book.title}"`,
          UTI: 'com.adobe.pdf',
        });
      } else if (selectedFormat === 'txt') {
        const content = generateText(book);
        const result = await Print.printToFileAsync({
          html: wrapTextAsHtml(book.title, content),
        });
        if (!result?.uri) {
          setError('TXT export failed. Please try again.');
          return;
        }
        await Sharing.shareAsync(result.uri, {
          mimeType: 'text/plain',
          dialogTitle: `Share "${book.title}"`,
          UTI: 'public.plain-text',
        });
      } else {
        const content = generateMarkdown(book);
        await Sharing.shareAsync(`data:text/markdown;charset=utf-8,${encodeURIComponent(content)}`, {
          mimeType: 'text/markdown',
          dialogTitle: `Share "${book.title}"`,
        });
      }
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (err) {
      const e = err as { message?: string };
      setError(e.message ?? 'Export failed. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  const handleKdpExport = async () => {
    if (!book) return;
    setKdpExporting(true);
    setKdpError(null);
    try {
      if (selectedKdpFormat === 'epub') {
        await generateAndShareEpub(book);
      } else if (selectedKdpFormat === 'docx') {
        await generateAndShareDocx(book);
      } else {
        await generateAndShareKdpPdf(book, trimSize);
      }
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (err) {
      const e = err as { message?: string };
      setKdpError(e.message ?? 'Export failed. Please try again.');
    } finally {
      setKdpExporting(false);
    }
  };

  const handlePurchase = async () => {
    if (!exportPkg) return;
    setConfirmVisible(false);
    setIsPurchasing(true);
    setError(null);
    try {
      await purchase(exportPkg);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (err) {
      const e = err as { userCancelled?: boolean; message?: string };
      if (!e.userCancelled) {
        setError(e.message ?? 'Purchase failed. Please try again.');
      }
    } finally {
      setIsPurchasing(false);
    }
  };

  const bottomPadding = (Platform.OS === 'web' ? 34 : insets.bottom) + 24;

  if (!book) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <TouchableOpacity style={[styles.closeBtn, { backgroundColor: colors.secondary }]} onPress={() => router.back()}>
          <Feather name="x" size={18} color={colors.mutedForeground} />
        </TouchableOpacity>
        <Text style={[styles.notFound, { color: colors.mutedForeground }]}>Book not found</Text>
      </View>
    );
  }

  const kdpChecklist = book
    ? [
        { ok: !!book.title, label: 'Book title is set' },
        { ok: book.chapters.length > 0, label: 'At least one chapter exists' },
        {
          ok: book.chapters.some((c) => c.sections.some((s) => s.content.trim())),
          label: 'At least one chapter has content',
        },
        { ok: true, label: 'Language: English (required by KDP)' },
      ]
    : [];
  const allChecksPass = kdpChecklist.every((c) => c.ok);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: bottomPadding }]}
        showsVerticalScrollIndicator={false}
      >
        <TouchableOpacity
          style={[styles.closeBtn, { backgroundColor: colors.secondary }]}
          onPress={() => router.back()}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Feather name="x" size={18} color={colors.mutedForeground} />
        </TouchableOpacity>

        {/* Hero */}
        <View style={styles.hero}>
          <Image
            source={require('@/assets/images/logo.png')}
            style={{ width: 88, height: 88, borderRadius: 20 }}
            resizeMode="contain"
          />
          <Text style={[styles.heroTitle, { color: colors.foreground }]}>
            {hasExportAccess ? 'Export Your Book' : 'Download Your Book'}
          </Text>
          <Text style={[styles.heroSubtitle, { color: colors.mutedForeground }]}>
            {hasExportAccess
              ? `"${book.title}" — choose a format below`
              : 'Export your finished book in PDF, plain text, or Markdown'}
          </Text>
        </View>

        {hasExportAccess ? (
          <>
            {/* Format picker */}
            <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>
              CHOOSE FORMAT
            </Text>
            {FORMAT_OPTIONS.filter((fmt) => !(fmt.id === 'pdf' && Platform.OS === 'web')).map((fmt) => (
              <TouchableOpacity
                key={fmt.id}
                style={[
                  styles.formatCard,
                  {
                    backgroundColor: colors.card,
                    borderColor: selectedFormat === fmt.id ? colors.primary : colors.border,
                    borderWidth: selectedFormat === fmt.id ? 2 : 1,
                  },
                ]}
                onPress={() => { Haptics.selectionAsync(); setSelectedFormat(fmt.id); }}
                activeOpacity={0.85}
              >
                <View style={[styles.formatIcon, { backgroundColor: selectedFormat === fmt.id ? colors.primary + '18' : colors.secondary }]}>
                  <Feather name={fmt.icon} size={20} color={selectedFormat === fmt.id ? colors.primary : colors.mutedForeground} />
                </View>
                <View style={styles.formatText}>
                  <View style={styles.formatTitleRow}>
                    <Text style={[styles.formatLabel, { color: colors.foreground }]}>{fmt.label}</Text>
                    <Text style={[styles.formatExt, { color: colors.mutedForeground }]}>{fmt.ext}</Text>
                  </View>
                  <Text style={[styles.formatDesc, { color: colors.mutedForeground }]}>{fmt.desc}</Text>
                </View>
                <View style={[styles.radio, { borderColor: selectedFormat === fmt.id ? colors.primary : colors.border }]}>
                  {selectedFormat === fmt.id && (
                    <View style={[styles.radioInner, { backgroundColor: colors.primary }]} />
                  )}
                </View>
              </TouchableOpacity>
            ))}

            {error && (
              <View style={styles.errorRow}>
                <Feather name="alert-circle" size={14} color="#DC2626" />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}

            <TouchableOpacity
              style={[styles.actionBtn, { backgroundColor: colors.primary }]}
              onPress={handleExport}
              disabled={isExporting}
              activeOpacity={0.85}
            >
              {isExporting ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Feather name="download" size={18} color="#fff" />
                  <Text style={styles.actionBtnText}>
                    Export as {FORMAT_OPTIONS.find((f) => f.id === selectedFormat)?.label}
                  </Text>
                </>
              )}
            </TouchableOpacity>

            {isSubscribed && (
              <Text style={[styles.includedNote, { color: colors.mutedForeground }]}>
                ✓ Included with your BloomScript Pro subscription
              </Text>
            )}

            {/* KDP Divider */}
            <View style={[styles.kdpDivider, { borderColor: colors.border }]} />

            {/* KDP Section Header */}
            <TouchableOpacity
              style={[styles.kdpHeaderRow, { backgroundColor: colors.card, borderColor: colors.border }]}
              onPress={() => {
                Haptics.selectionAsync();
                setKdpVisible((v) => !v);
              }}
              activeOpacity={0.85}
            >
              <View style={[styles.kdpBadge, { backgroundColor: '#FF9900' + '22' }]}>
                <Text style={styles.kdpBadgeText}>KDP</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.kdpHeaderTitle, { color: colors.foreground }]}>
                  Ready to publish?
                </Text>
                <Text style={[styles.kdpHeaderSub, { color: colors.mutedForeground }]}>
                  Let me prepare your KDP-ready manuscript
                </Text>
              </View>
              <Feather
                name={kdpVisible ? 'chevron-up' : 'chevron-down'}
                size={20}
                color={colors.mutedForeground}
              />
            </TouchableOpacity>

            {kdpVisible && (
              <>
                {/* KDP Checklist */}
                <TouchableOpacity
                  style={[styles.checklistCard, { backgroundColor: colors.card, borderColor: colors.border }]}
                  onPress={() => setChecklistExpanded((v) => !v)}
                  activeOpacity={0.85}
                >
                  <View style={styles.checklistHeader}>
                    <Feather
                      name="check-square"
                      size={15}
                      color={allChecksPass ? '#22C55E' : colors.primary}
                    />
                    <Text style={[styles.checklistTitle, { color: colors.foreground }]}>
                      KDP Readiness Checklist
                    </Text>
                    <View style={[
                      styles.checklistBadge,
                      { backgroundColor: allChecksPass ? '#22C55E22' : '#F9731622' },
                    ]}>
                      <Text style={[styles.checklistBadgeText, { color: allChecksPass ? '#22C55E' : '#F97316' }]}>
                        {kdpChecklist.filter((c) => c.ok).length}/{kdpChecklist.length}
                      </Text>
                    </View>
                    <Feather
                      name={checklistExpanded ? 'chevron-up' : 'chevron-down'}
                      size={15}
                      color={colors.mutedForeground}
                    />
                  </View>
                  {checklistExpanded && (
                    <View style={[styles.checklistBody, { borderTopColor: colors.border }]}>
                      {kdpChecklist.map((item, i) => (
                        <View key={i} style={styles.checklistItem}>
                          <Feather
                            name={item.ok ? 'check' : 'x'}
                            size={13}
                            color={item.ok ? '#22C55E' : '#DC2626'}
                          />
                          <Text style={[styles.checklistItemText, { color: colors.foreground }]}>
                            {item.label}
                          </Text>
                        </View>
                      ))}
                    </View>
                  )}
                </TouchableOpacity>

                {/* KDP Format label */}
                <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>
                  KDP FORMAT
                </Text>

                {/* KDP Format cards */}
                {KDP_FORMAT_OPTIONS.map((fmt) => (
                  <TouchableOpacity
                    key={fmt.id}
                    style={[
                      styles.formatCard,
                      {
                        backgroundColor: colors.card,
                        borderColor: selectedKdpFormat === fmt.id ? '#FF9900' : colors.border,
                        borderWidth: selectedKdpFormat === fmt.id ? 2 : 1,
                      },
                    ]}
                    onPress={() => { Haptics.selectionAsync(); setSelectedKdpFormat(fmt.id); }}
                    activeOpacity={0.85}
                  >
                    <View style={[
                      styles.formatIcon,
                      { backgroundColor: selectedKdpFormat === fmt.id ? '#FF990018' : colors.secondary },
                    ]}>
                      <Feather
                        name={fmt.icon}
                        size={20}
                        color={selectedKdpFormat === fmt.id ? '#FF9900' : colors.mutedForeground}
                      />
                    </View>
                    <View style={styles.formatText}>
                      <View style={styles.formatTitleRow}>
                        <Text style={[styles.formatLabel, { color: colors.foreground }]}>{fmt.label}</Text>
                        <Text style={[styles.formatExt, { color: colors.mutedForeground }]}>{fmt.ext}</Text>
                      </View>
                      <Text style={[styles.formatDesc, { color: colors.mutedForeground }]}>{fmt.desc}</Text>
                    </View>
                    <View style={[
                      styles.radio,
                      { borderColor: selectedKdpFormat === fmt.id ? '#FF9900' : colors.border },
                    ]}>
                      {selectedKdpFormat === fmt.id && (
                        <View style={[styles.radioInner, { backgroundColor: '#FF9900' }]} />
                      )}
                    </View>
                  </TouchableOpacity>
                ))}

                {/* Trim size picker — only for Print PDF */}
                {selectedKdpFormat === 'kdp-pdf' && (
                  <>
                    <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>
                      TRIM SIZE
                    </Text>
                    <View style={styles.trimRow}>
                      {TRIM_SIZES.map((ts) => (
                        <TouchableOpacity
                          key={ts.id}
                          style={[
                            styles.trimPill,
                            {
                              borderColor: trimSize === ts.id ? '#FF9900' : colors.border,
                              backgroundColor: trimSize === ts.id ? '#FF990015' : colors.card,
                            },
                          ]}
                          onPress={() => { Haptics.selectionAsync(); setTrimSize(ts.id); }}
                          activeOpacity={0.85}
                        >
                          <Text style={[
                            styles.trimPillLabel,
                            { color: trimSize === ts.id ? '#FF9900' : colors.foreground },
                          ]}>
                            {ts.label}
                          </Text>
                          <Text style={[styles.trimPillDesc, { color: colors.mutedForeground }]}>
                            {ts.desc}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </>
                )}

                {kdpError && (
                  <View style={styles.errorRow}>
                    <Feather name="alert-circle" size={14} color="#DC2626" />
                    <Text style={styles.errorText}>{kdpError}</Text>
                  </View>
                )}

                <TouchableOpacity
                  style={[styles.actionBtn, { backgroundColor: '#FF9900' }]}
                  onPress={handleKdpExport}
                  disabled={kdpExporting}
                  activeOpacity={0.85}
                >
                  {kdpExporting ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <>
                      <Feather name="upload-cloud" size={18} color="#fff" />
                      <Text style={styles.actionBtnText}>
                        Export {KDP_FORMAT_OPTIONS.find((f) => f.id === selectedKdpFormat)?.label}
                      </Text>
                    </>
                  )}
                </TouchableOpacity>

                <Text style={[styles.kdpFootnote, { color: colors.mutedForeground }]}>
                  Upload your exported file at kdp.amazon.com to complete publishing.
                </Text>
              </>
            )}
          </>
        ) : (
          <>
            {/* Purchase UI */}
            <View style={[styles.featuresCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              {FORMAT_OPTIONS.map((fmt, i) => (
                <View
                  key={fmt.id}
                  style={[
                    styles.featureRow,
                    i < FORMAT_OPTIONS.length - 1 && { borderBottomWidth: 1, borderBottomColor: colors.border },
                  ]}
                >
                  <View style={[styles.featureIconWrap, { backgroundColor: colors.primary + '18' }]}>
                    <Feather name={fmt.icon} size={16} color={colors.primary} />
                  </View>
                  <View style={styles.featureText}>
                    <Text style={[styles.featureLabel, { color: colors.foreground }]}>{fmt.label}</Text>
                    <Text style={[styles.featureDesc, { color: colors.mutedForeground }]}>{fmt.desc}</Text>
                  </View>
                  <Feather name="check" size={14} color={colors.accent} />
                </View>
              ))}
              {/* KDP teaser row */}
              <View style={[styles.featureRow, { borderTopWidth: 1, borderTopColor: colors.border }]}>
                <View style={[styles.featureIconWrap, { backgroundColor: '#FF990018' }]}>
                  <Feather name="book-open" size={16} color="#FF9900" />
                </View>
                <View style={styles.featureText}>
                  <Text style={[styles.featureLabel, { color: colors.foreground }]}>Amazon KDP Export</Text>
                  <Text style={[styles.featureDesc, { color: colors.mutedForeground }]}>EPUB, DOCX & print-ready PDF</Text>
                </View>
                <Feather name="check" size={14} color={colors.accent} />
              </View>
            </View>

            <View style={[styles.priceBanner, { backgroundColor: colors.primary }]}>
              <Feather name="lock" size={16} color={colors.accent} />
              <Text style={styles.priceBannerText}>
                One-time purchase · All formats included
              </Text>
            </View>

            {rcInitError && (
              <View style={styles.errorRow}>
                <Feather name="alert-circle" size={14} color="#DC2626" />
                <Text style={styles.errorText}>Purchases unavailable: {rcInitError}</Text>
              </View>
            )}

            {error && (
              <View style={styles.errorRow}>
                <Feather name="alert-circle" size={14} color="#DC2626" />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}

            <TouchableOpacity
              style={[styles.actionBtn, { backgroundColor: colors.accent }]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                setConfirmVisible(true);
              }}
              disabled={isPurchasing || rcPurchasing || !exportPkg}
              activeOpacity={0.85}
            >
              {isPurchasing || rcPurchasing ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Feather name="download-cloud" size={18} color="#fff" />
                  <Text style={styles.actionBtnText}>
                    Unlock Downloads — {priceStr}
                  </Text>
                </>
              )}
            </TouchableOpacity>

            <Text style={[styles.legalNote, { color: colors.mutedForeground }]}>
              One-time purchase. Unlock all export formats for all your books.
            </Text>
          </>
        )}
      </ScrollView>

      {/* Confirm purchase modal */}
      <Modal
        visible={confirmVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setConfirmVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={[styles.modalIcon, { backgroundColor: colors.accent + '18' }]}>
              <Feather name="download-cloud" size={24} color={colors.accent} />
            </View>
            <Text style={[styles.modalTitle, { color: colors.foreground }]}>Unlock Book Exports</Text>
            <Text style={[styles.modalBody, { color: colors.mutedForeground }]}>
              Purchase export access for {priceStr}? You'll be able to export all your books in PDF, plain text, Markdown, and KDP-ready formats.
            </Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalCancelBtn, { borderColor: colors.border }]}
                onPress={() => setConfirmVisible(false)}
              >
                <Text style={[styles.modalCancelText, { color: colors.mutedForeground }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalConfirmBtn, { backgroundColor: colors.accent }]}
                onPress={handlePurchase}
              >
                <Text style={styles.modalConfirmText}>Buy {priceStr}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { paddingHorizontal: 20, paddingTop: 20, gap: 14 },
  closeBtn: {
    alignSelf: 'flex-end',
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notFound: {
    textAlign: 'center',
    fontSize: 16,
    fontFamily: 'Inter_400Regular',
    marginTop: 60,
  },
  hero: { alignItems: 'center', paddingVertical: 12, gap: 10 },
  heroIcon: {
    width: 80,
    height: 80,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroTitle: {
    fontSize: 26,
    fontFamily: 'Inter_700Bold',
    letterSpacing: -0.5,
    textAlign: 'center',
    marginTop: 4,
  },
  heroSubtitle: {
    fontSize: 15,
    fontFamily: 'Inter_400Regular',
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 16,
  },
  sectionLabel: {
    fontSize: 11,
    fontFamily: 'Inter_600SemiBold',
    letterSpacing: 0.8,
    marginTop: 4,
  },
  formatCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    padding: 14,
    gap: 12,
  },
  formatIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  formatText: { flex: 1, gap: 2 },
  formatTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  formatLabel: { fontSize: 16, fontFamily: 'Inter_600SemiBold' },
  formatExt: { fontSize: 12, fontFamily: 'Inter_400Regular' },
  formatDesc: { fontSize: 12, fontFamily: 'Inter_400Regular', lineHeight: 18 },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  radioInner: { width: 10, height: 10, borderRadius: 5 },
  featuresCard: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
  },
  featureIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureText: { flex: 1, gap: 2 },
  featureLabel: { fontSize: 15, fontFamily: 'Inter_600SemiBold' },
  featureDesc: { fontSize: 12, fontFamily: 'Inter_400Regular', lineHeight: 18 },
  priceBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  priceBannerText: {
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
    color: '#fff',
  },
  errorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FEF2F2',
    borderRadius: 10,
    padding: 12,
  },
  errorText: {
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    color: '#DC2626',
    flex: 1,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 16,
    borderRadius: 30,
    marginTop: 4,
  },
  actionBtnText: {
    fontSize: 17,
    fontFamily: 'Inter_600SemiBold',
    color: '#fff',
  },
  includedNote: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    textAlign: 'center',
  },
  legalNote: {
    fontSize: 11,
    fontFamily: 'Inter_400Regular',
    textAlign: 'center',
    lineHeight: 16,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  modalBox: {
    width: '100%',
    borderRadius: 20,
    borderWidth: 1,
    padding: 24,
    alignItems: 'center',
    gap: 12,
  },
  modalIcon: {
    width: 56,
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  modalTitle: { fontSize: 20, fontFamily: 'Inter_700Bold', letterSpacing: -0.3 },
  modalBody: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    textAlign: 'center',
    lineHeight: 20,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 8,
    width: '100%',
  },
  modalCancelBtn: {
    flex: 1,
    paddingVertical: 13,
    borderRadius: 30,
    borderWidth: 1,
    alignItems: 'center',
  },
  modalCancelText: { fontSize: 15, fontFamily: 'Inter_500Medium' },
  modalConfirmBtn: {
    flex: 1,
    paddingVertical: 13,
    borderRadius: 30,
    alignItems: 'center',
  },
  modalConfirmText: { fontSize: 15, fontFamily: 'Inter_600SemiBold', color: '#fff' },
  kdpDivider: {
    borderTopWidth: StyleSheet.hairlineWidth,
    marginVertical: 6,
  },
  kdpHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
  },
  kdpBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  kdpBadgeText: {
    fontSize: 11,
    fontFamily: 'Inter_700Bold',
    color: '#FF9900',
    letterSpacing: 0.5,
  },
  kdpHeaderTitle: {
    fontSize: 15,
    fontFamily: 'Inter_600SemiBold',
  },
  kdpHeaderSub: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    marginTop: 1,
  },
  checklistCard: {
    borderRadius: 14,
    borderWidth: 1,
    overflow: 'hidden',
  },
  checklistHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
  },
  checklistTitle: {
    flex: 1,
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
  },
  checklistBadge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 8,
  },
  checklistBadgeText: {
    fontSize: 11,
    fontFamily: 'Inter_600SemiBold',
  },
  checklistBody: {
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 8,
  },
  checklistItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  checklistItemText: {
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
  },
  trimRow: {
    gap: 10,
  },
  trimPill: {
    borderRadius: 12,
    borderWidth: 1.5,
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  trimPillLabel: {
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
  },
  trimPillDesc: {
    fontSize: 11,
    fontFamily: 'Inter_400Regular',
    marginTop: 2,
  },
  kdpFootnote: {
    fontSize: 11,
    fontFamily: 'Inter_400Regular',
    textAlign: 'center',
    lineHeight: 16,
    marginTop: -4,
  },
});
