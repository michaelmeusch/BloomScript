import { Feather } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import * as DocumentPicker from 'expo-document-picker';
import { EncodingType, readAsStringAsync } from 'expo-file-system/legacy';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import JSZip from 'jszip';
import React, { useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { API_BASE } from '@/constants/api';
import { AddFontModal } from '@/components/AddFontModal';
import { useBooks } from '@/context/BookContext';
import { DEFAULT_HEADING_FONT_ID, HEADING_FONT_OPTIONS } from '@/constants/fonts';
import { useColors } from '@/hooks/useColors';
import { useCustomFonts } from '@/hooks/useCustomFonts';
import { Genre, type TextAlignment, type PageNumberStyle, type FormatSettings } from '@/types';

// ── Manuscript parser ──────────────────────────────────────────────────────
const CHAPTER_RE = /^(?:chapter|part|section|book)\s+(?:\d+|one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|[ivxlcdm]+)[\s.:–\-]*/i;

function detectTitle(lines: string[]): string {
  for (const line of lines.slice(0, 8)) {
    const t = line.trim();
    if (t.length > 2 && t.length < 100 && !CHAPTER_RE.test(t)) return t;
  }
  return 'My Manuscript';
}

function parseManuscript(text: string): { bookTitle: string; chapters: { title: string; content: string }[] } {
  const lines = text.split('\n');
  const bookTitle = detectTitle(lines);
  const chapters: { title: string; content: string }[] = [];
  let currentTitle = '';
  let currentLines: string[] = [];

  const flush = () => {
    const content = currentLines.join('\n').trim();
    if (content) chapters.push({ title: currentTitle || `Chapter ${chapters.length + 1}`, content });
    currentLines = [];
  };

  let pastTitle = false;
  for (const line of lines) {
    const trimmed = line.trim();
    if (!pastTitle && trimmed === bookTitle) { pastTitle = true; continue; }
    if (CHAPTER_RE.test(trimmed) && trimmed.length < 100) { flush(); currentTitle = trimmed; }
    else currentLines.push(line);
  }
  flush();

  if (chapters.length === 0) chapters.push({ title: 'Chapter 1', content: text.trim() });
  return { bookTitle, chapters };
}

// ── File parsers ────────────────────────────────────────────────────────────

/** Read a local file URI as a UTF-8 string. Uses FileSystem first, falls back to XHR. */
async function readFileAsText(uri: string): Promise<string> {
  try {
    const text = await readAsStringAsync(uri, { encoding: EncodingType.UTF8 });
    if (text && text.length > 0) return text;
    throw new Error('Empty result from FileSystem');
  } catch {
    // Fallback to XHR for cases where FileSystem can't read the URI directly
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.onload = () => {
        if (xhr.responseText) resolve(xhr.responseText);
        else reject(new Error('XHR returned empty content'));
      };
      xhr.onerror = () => reject(new Error(`Could not read the file. Make sure it's stored locally on your device, not only in iCloud.`));
      xhr.open('GET', uri);
      xhr.send();
    });
  }
}

/**
 * Read a local file URI as a raw Uint8Array using XHR arraybuffer.
 * This is the most reliable approach for binary files (DOCX, PDF) on iOS
 * because XHR works for local file:// URIs the same way it does for text.
 * expo-file-system base64 reading silently fails for binary files on some
 * iOS / Expo Go versions.
 */
function readFileAsBytes(uri: string): Promise<Uint8Array> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.responseType = 'arraybuffer';
    xhr.onload = () => {
      if (!xhr.response || xhr.response.byteLength === 0) {
        reject(new Error(
          'File appears to be empty or could not be accessed. ' +
          "If it's in iCloud, download it to your device first, then try again."
        ));
        return;
      }
      resolve(new Uint8Array(xhr.response));
    };
    xhr.onerror = () =>
      reject(new Error("Could not read the file. Make sure it's stored locally on your device, not only in iCloud."));
    xhr.open('GET', uri);
    xhr.send();
  });
}

/** Pure-JS Uint8Array → base64 encoder. No atob/btoa needed. */
function uint8ToBase64(bytes: Uint8Array): string {
  const CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
  let result = '';
  const len = bytes.length;
  for (let i = 0; i < len; i += 3) {
    const a = bytes[i];
    const b = i + 1 < len ? bytes[i + 1] : 0;
    const c = i + 2 < len ? bytes[i + 2] : 0;
    result +=
      CHARS[a >> 2] +
      CHARS[((a & 3) << 4) | (b >> 4)] +
      (i + 1 < len ? CHARS[((b & 0xf) << 2) | (c >> 6)] : '=') +
      (i + 2 < len ? CHARS[c & 0x3f] : '=');
  }
  return result;
}

/** Read a local file URI as a base64 string for sending to the API. */
async function readFileAsBase64(uri: string): Promise<string> {
  const bytes = await readFileAsBytes(uri);
  return uint8ToBase64(bytes);
}

async function parseTxt(uri: string): Promise<string> {
  const text = await readFileAsText(uri);
  return text;
}

async function parseDocx(uri: string): Promise<string> {
  // Read as Uint8Array so JSZip gets clean binary regardless of any
  // whitespace/newlines that readAsStringAsync may embed in base64 output.
  const bytes = await readFileAsBytes(uri);
  const zip = await JSZip.loadAsync(bytes);
  const docXml = await zip.file('word/document.xml')?.async('string');
  if (!docXml) throw new Error('Could not read DOCX content. Make sure the file is a valid .docx (not a .doc) file.');
  return docXml
    .replace(/<w:br[^>]*\/?>/g, '\n')
    .replace(/<\/w:p>/g, '\n\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"').replace(/&#x27;/g, "'")
    .replace(/\n{3,}/g, '\n\n').trim();
}

async function parsePdf(uri: string): Promise<string> {
  const base64 = await readFileAsBase64(uri);
  const res = await fetch(`${API_BASE}/manuscript/parse-pdf`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ fileBase64: base64 }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as any).error ?? `PDF parsing failed (HTTP ${res.status})`);
  }
  const { text } = await res.json() as { text: string };
  return text;
}

// ── Long-chapter detection ──────────────────────────────────────────────────
// Thresholds sourced from publishing industry research:
//   Thriller/Mystery  → avg 1,500–3,000 w  (fast-paced, punchy pacing)
//   Romance           → avg 2,000–4,000 w
//   Fiction/Literary  → avg 2,000–5,000 w
//   Fantasy/Sci-Fi    → avg 3,000–6,000 w  (world-building density)
//   Non-Fiction/Memoir→ avg 3,000–8,000 w  (argument arcs longer)
//   YA                → avg 1,500–3,000 w
//   Default           → avg 2,000–5,000 w

type ChapterThresholds = {
  flagAt: number;      // word count that triggers the split modal
  targetWords: number; // ideal words-per-segment when splitting
  rangeLabel: string;  // shown in the modal body copy
};

function getChapterThresholds(genre: Genre): ChapterThresholds {
  switch (genre) {
    case 'Thriller':
    case 'Mystery':
      return { flagAt: 4_500, targetWords: 2_000, rangeLabel: '1,500–3,000' };
    case 'Romance':
      return { flagAt: 5_500, targetWords: 2_500, rangeLabel: '2,000–4,000' };
    case 'Sci-Fi':
    case 'Fantasy':
      return { flagAt: 8_000, targetWords: 3_500, rangeLabel: '3,000–6,000' };
    case 'Non-Fiction':
    case 'Memoir':
      return { flagAt: 9_000, targetWords: 4_000, rangeLabel: '3,000–8,000' };
    default:
      // Fiction, general
      return { flagAt: 6_000, targetWords: 2_500, rangeLabel: '2,000–5,000' };
  }
}

function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

function splitIntoSegments(content: string, targetWords = 2_500): { text: string; words: number }[] {
  const paragraphs = content.split(/\n\n+/);
  const segments: { text: string; words: number }[] = [];
  let buf: string[] = [];
  let wc = 0;
  for (const para of paragraphs) {
    const w = countWords(para);
    if (wc > 0 && wc + w > targetWords) {
      segments.push({ text: buf.join('\n\n'), words: wc });
      buf = [para]; wc = w;
    } else {
      buf.push(para); wc += w;
    }
  }
  if (buf.length) segments.push({ text: buf.join('\n\n'), words: wc });
  return segments.filter(s => s.words > 0);
}

// ── Run-on sentence detection ───────────────────────────────────────────────
// A sentence is flagged when it exceeds 40 words — the threshold used by most
// style guides (Chicago, AP) beyond which readability drops sharply. We also
// catch comma-splice chains: sentences with 3+ commas and 30+ words.
function detectRunOns(chapters: { title: string; content: string }[]): {
  count: number;
  examples: { sentence: string; chapterTitle: string }[];
} {
  const examples: { sentence: string; chapterTitle: string }[] = [];
  let count = 0;
  for (const ch of chapters) {
    const sentences = ch.content
      .replace(/([.!?])\s+/g, '$1\n')
      .split('\n')
      .map(s => s.trim())
      .filter(Boolean);
    for (const s of sentences) {
      const wc = countWords(s);
      const commas = (s.match(/,/g) ?? []).length;
      if (wc > 40 || (commas >= 3 && wc > 30)) {
        count++;
        if (examples.length < 3) {
          const preview = s.length > 120 ? s.slice(0, 117) + '…' : s;
          examples.push({ sentence: preview, chapterTitle: ch.title });
        }
      }
    }
  }
  return { count, examples };
}

// ── Dialogue punctuation check ──────────────────────────────────────────────
// Rules based on US publishing standard (Chicago Manual of Style, 17th ed.):
//   1. Punctuation goes INSIDE the closing quote  ("Hello," not "Hello",)
//   2. End with comma, not period, when a dialogue tag follows  ("Hi," she said)
//   3. Em dash for interrupted speech, not double hyphen  (— not --)
//   4. Straight quotes should be consistent throughout (no mixing with curly)
//   5. Every open quote must have a matching close quote
const DIALOGUE_TAGS = /^(said|asked|replied|whispered|shouted|murmured|muttered|called|cried|answered|laughed|groaned|growled|hissed|snapped|yelled|sighed|added|continued|began|finished|stated|declared|insisted|responded|repeated|breathed|faltered|blurted|scoffed|teased|urged|warned)\b/;

type DialoguePuncIssue = { excerpt: string; issue: string; chapterTitle: string };

function detectDialoguePunctuation(chapters: { title: string; content: string }[]): {
  count: number;
  examples: DialoguePuncIssue[];
} {
  const examples: DialoguePuncIssue[] = [];
  let count = 0;

  const flag = (line: string, issue: string, title: string) => {
    count++;
    if (examples.length < 3) {
      examples.push({
        excerpt: line.length > 110 ? line.slice(0, 107) + '…' : line,
        issue,
        chapterTitle: title,
      });
    }
  };

  const hasMixedQuotes: Set<string> = new Set();

  for (const ch of chapters) {
    const lines = ch.content.split(/\n+/).map(l => l.trim()).filter(Boolean);

    for (const line of lines) {
      if (!/"/.test(line) && !/[\u201C\u201D]/.test(line)) continue;

      // Rule 1: comma or period OUTSIDE closing quote → "Hello", or "Hello".
      if (/"\s*[,.]/.test(line)) {
        flag(line, 'Punctuation outside closing quote — move it inside', ch.title);
        continue;
      }

      // Rule 2: period before lowercase dialogue tag → "Hello." she said
      const tagMatch = line.match(/\.\"\s+([a-z]+)/);
      if (tagMatch && DIALOGUE_TAGS.test(tagMatch[1]!)) {
        flag(line, 'Period before dialogue tag — use a comma instead', ch.title);
        continue;
      }

      // Rule 3: double dash in a line that contains dialogue
      if (/--/.test(line)) {
        flag(line, 'Double dash — use an em dash (—) for interrupted speech', ch.title);
        continue;
      }

      // Rule 4: unmatched straight quotes per paragraph
      const nStraight = (line.match(/"/g) ?? []).length;
      if (nStraight % 2 !== 0) {
        flag(line, 'Unmatched quotation mark — possible missing opening or closing quote', ch.title);
      }
    }

    // Rule 5: inconsistent quote styles across the chapter (once per chapter)
    const hasStraight = /"/.test(ch.content);
    const hasCurly = /[\u201C\u201D]/.test(ch.content);
    if (hasStraight && hasCurly && !hasMixedQuotes.has(ch.title)) {
      hasMixedQuotes.add(ch.title);
      count++;
      if (examples.length < 3) {
        examples.push({
          excerpt: 'Mix of straight (" ") and curly (\u201C \u201D) quote marks',
          issue: 'Inconsistent quote style — pick one and use it throughout',
          chapterTitle: ch.title,
        });
      }
    }
  }

  return { count, examples };
}

// ── Document genre detector ────────────────────────────────────────────────
const SCREENPLAY_MARKERS = [
  /^INT\.\s/i, /^EXT\.\s/i, /^INT\/EXT\./i,
  /^FADE IN:/i, /^FADE OUT/i, /^CUT TO:/i, /^DISSOLVE TO:/i,
  /\(V\.O\.\)/i, /\(O\.S\.\)/i, /\(CONT'D\)/i,
  /^SMASH CUT/i, /^MATCH CUT/i,
];

function detectDocumentGenre(rawText: string): Genre | null {
  const lines = rawText.split('\n');
  const nonEmpty = lines.filter(l => l.trim().length > 0);
  const sample = nonEmpty.slice(0, 120);

  // ── Screenplay: look for scene headings and action markers ──────────────
  const screenplayHits = sample.filter(l =>
    SCREENPLAY_MARKERS.some(re => re.test(l.trim()))
  ).length;
  if (screenplayHits >= 2) return 'Screenplay';

  // ── Poem: short lines, no chapter headings, high short-line ratio ────────
  const hasChapter = CHAPTER_RE.test(rawText.slice(0, 3000));
  if (!hasChapter && sample.length >= 4) {
    const shortLines = sample.filter(l => l.trim().length < 65).length;
    if (shortLines / sample.length > 0.78) return 'Poem';
  }

  return null;
}

// ── Genre chips ────────────────────────────────────────────────────────────
const QUICK_GENRES: Genre[] = ['Fiction', 'Non-Fiction', 'Mystery', 'Romance', 'Sci-Fi', 'Fantasy', 'Thriller', 'Memoir', 'Poem', 'Screenplay'];

export default function BloomManuscriptScreen() {
  const colors = useColors();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { createBook, addChapter, replaceChapterSections, updateBook } = useBooks();

  const { customFonts, addCustomFont, asExportFonts } = useCustomFonts();
  const [addFontVisible, setAddFontVisible] = useState(false);
  const [text, setText] = useState('');
  const [genre, setGenre] = useState<Genre>('Fiction');
  const [headingFontId, setHeadingFontId] = useState(DEFAULT_HEADING_FONT_ID);
  const [processing, setProcessing] = useState(false);
  const [loadingVisible, setLoadingVisible] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [pickedFileName, setPickedFileName] = useState<string | null>(null);
  const [titleAlignment, setTitleAlignment] = useState<TextAlignment>('center');
  const [chapterTitleAlignment, setChapterTitleAlignment] = useState<TextAlignment>('left');
  const [pageNumbers, setPageNumbers] = useState<PageNumberStyle>('none');
  const inputRef = useRef<TextInput>(null);
  const words = text.trim() ? text.trim().split(/\s+/).length : 0;

  // ── Long-chapter split flow ───────────────────────────────────────────────
  type LongChapterInfo = {
    chapterIndex: number;
    title: string;
    wordCount: number;
    segments: { text: string; words: number }[];
  };
  const [longChapterModal, setLongChapterModal] = useState<LongChapterInfo | null>(null);
  const [splitNames, setSplitNames] = useState<string[]>([]);

  // ── Run-on sentence check flow ────────────────────────────────────────────
  type RunOnInfo = { count: number; examples: { sentence: string; chapterTitle: string }[] };
  const [runOnModal, setRunOnModal] = useState<RunOnInfo | null>(null);

  // ── Dialogue punctuation check flow ──────────────────────────────────────
  const [dialoguePuncModal, setDialoguePuncModal] = useState<{ count: number; examples: DialoguePuncIssue[] } | null>(null);
  const pendingImport = useRef<{
    chapters: { title: string; content: string }[];
    bookTitle: string;
    longQueue: number[];
    thresholds: ChapterThresholds;
  } | null>(null);

  // ── File picker ──────────────────────────────────────────────────────────
  // ⚠️  CRITICAL: Do NOT call setState or haptics before getDocumentAsync.
  //     Any re-render before the native picker presents will silently kill it on iOS.
  const handlePickFile = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: [
          'application/pdf',
          'application/msword',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'text/plain',
          'text/markdown',
          'text/x-markdown',
          'application/rtf',
          'text/rtf',
        ],
        copyToCacheDirectory: true,
        multiple: false,
      });

      if (result.canceled) {
        return;
      }

      if (!result.assets?.length) {
        Alert.alert(t('bloomManuscript.noFileReceived'), t('bloomManuscript.noFileReceivedMsg'));
        return;
      }

      const asset = result.assets[0];
      const { uri, name, mimeType } = asset;
      const ext = (name ?? '').split('.').pop()?.toLowerCase() ?? '';

      const SUPPORTED = ['pdf', 'docx', 'doc', 'txt', 'md', 'text', 'rtf'];
      const isSupported = SUPPORTED.includes(ext)
        || !!mimeType?.includes('pdf')
        || !!mimeType?.includes('word')
        || !!mimeType?.includes('text')
        || !!mimeType?.includes('plain');
      if (!isSupported) {
        Alert.alert(t('bloomManuscript.unsupportedFile'), t('bloomManuscript.unsupportedFileMsg', { name, type: mimeType ?? 'unknown' }));
        return;
      }

      // ── All state changes happen AFTER the picker is fully dismissed ──
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      setPickedFileName(name ?? 'file');
      setLoadingMessage(t('bloomManuscript.readingFile', { name: name ?? 'file' }));
      setLoadingVisible(true);

      let extracted = '';
      try {
        if (ext === 'pdf' || mimeType?.includes('pdf')) {
          setLoadingMessage(t('bloomManuscript.extractingPdf'));
          extracted = await parsePdf(uri);
        } else if (ext === 'docx' || ext === 'doc' || mimeType?.includes('word') || mimeType?.includes('wordprocessingml')) {
          setLoadingMessage(t('bloomManuscript.readingWord'));
          extracted = await parseDocx(uri);
        } else {
          setLoadingMessage(t('bloomManuscript.readingText'));
          extracted = await parseTxt(uri);
        }
      } finally {
        setLoadingVisible(false);
      }

      if (!extracted.trim()) {
        Alert.alert(t('bloomManuscript.emptyFile'), t('bloomManuscript.emptyFileMsg'));
        setPickedFileName(null);
        return;
      }

      setText(extracted);
      const detected = detectDocumentGenre(extracted);
      if (detected) setGenre(detected);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (err: any) {
      setLoadingVisible(false);
      setPickedFileName(null);
      Alert.alert(t('bloomManuscript.couldNotReadFile'), err?.message ?? t('bloomManuscript.couldNotReadFileDefault'));
    }
  };

  // ── Import helpers ───────────────────────────────────────────────────────
  const doImport = (bookTitle: string, chapters: { title: string; content: string }[]) => {
    const totalWords = chapters.reduce((sum, ch) => sum + countWords(ch.content), 0);
    const book = createBook(bookTitle, genre, t('bloomManuscript.importedDescription', { chapters: chapters.length, words: totalWords.toLocaleString() }));
    for (const ch of chapters) {
      const chapter = addChapter(book.id, ch.title);
      if (ch.content) {
        replaceChapterSections(book.id, chapter.id, [{ prompt: t('bloomManuscript.manuscriptContent'), content: ch.content, type: 'scene' }]);
      }
    }
    updateBook(book.id, { headingFontId, formatSettings: { titleAlignment, chapterTitleAlignment, pageNumbers } });
    if (genre === 'Poem' || genre === 'Screenplay') {
      router.replace({ pathname: '/book/[bookId]', params: { bookId: book.id } });
    } else {
      router.replace({ pathname: '/bloom-wizard', params: { bookId: book.id, chapterCount: String(chapters.length), wordCount: String(totalWords) } });
    }
  };

  const showDialoguePuncModal = () => {
    const imp = pendingImport.current!;
    const result = detectDialoguePunctuation(imp.chapters);
    if (result.count > 0) {
      setDialoguePuncModal(result);
    } else {
      doImport(imp.bookTitle, imp.chapters);
    }
  };

  const handleDialoguePuncDismiss = () => {
    setDialoguePuncModal(null);
    const imp = pendingImport.current!;
    doImport(imp.bookTitle, imp.chapters);
  };

  const showRunOnModal = () => {
    const imp = pendingImport.current!;
    const result = detectRunOns(imp.chapters);
    if (result.count > 0) {
      setRunOnModal(result);
    } else {
      showDialoguePuncModal();
    }
  };

  const handleRunOnDismiss = () => {
    setRunOnModal(null);
    showDialoguePuncModal();
  };

  const showNextLongChapterModal = () => {
    const imp = pendingImport.current;
    if (!imp || imp.longQueue.length === 0) {
      showRunOnModal();
      return;
    }
    const idx = imp.longQueue[0]!;
    const ch = imp.chapters[idx]!;
    const wordCount = countWords(ch.content);
    const segments = splitIntoSegments(ch.content, imp.thresholds.targetWords);
    setLongChapterModal({ chapterIndex: idx, title: ch.title, wordCount, segments });
    setSplitNames(segments.map((_, si) =>
      si === 0 ? ch.title : t('bloomManuscript.partSuffix', { title: ch.title, number: si + 1 })
    ));
  };

  const handleKeepChapter = () => {
    pendingImport.current!.longQueue.shift();
    setLongChapterModal(null);
    showNextLongChapterModal();
  };

  const handleSplitChapter = () => {
    const imp = pendingImport.current!;
    const idx = imp.longQueue[0]!;
    const ch = imp.chapters[idx]!;
    const segments = splitIntoSegments(ch.content, imp.thresholds.targetWords);
    const newSubs = segments.map((seg, si) => ({
      title: splitNames[si]?.trim() || (si === 0 ? ch.title : t('bloomManuscript.partSuffix', { title: ch.title, number: si + 1 })),
      content: seg.text,
    }));
    imp.chapters = [
      ...imp.chapters.slice(0, idx),
      ...newSubs,
      ...imp.chapters.slice(idx + 1),
    ];
    const inserted = segments.length - 1;
    imp.longQueue = imp.longQueue.slice(1).map(i => i + inserted);
    setLongChapterModal(null);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    showNextLongChapterModal();
  };

  // ── Process manuscript ───────────────────────────────────────────────────
  const handleProcess = async () => {
    if (!text.trim()) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setProcessing(true);
    try {
      const { bookTitle, chapters } = parseManuscript(text.trim());
      const thresholds = getChapterThresholds(genre);
      const longQueue = chapters
        .map((ch, i) => ({ i, w: countWords(ch.content) }))
        .filter(x => x.w >= thresholds.flagAt)
        .map(x => x.i);
      pendingImport.current = { chapters: [...chapters], bookTitle, longQueue, thresholds };
      setProcessing(false);
      if (longQueue.length > 0) {
        showNextLongChapterModal();
      } else {
        showRunOnModal();
      }
    } catch {
      Alert.alert(t('common.error'), t('bloomManuscript.parseError'));
      setProcessing(false);
    }
  };

  const topPad = Platform.OS === 'web' ? 16 : insets.top;
  const bottomPad = Platform.OS === 'web' ? 24 : insets.bottom + 16;

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: colors.background }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>

      {/* ── Long-chapter split modal ── */}
      <Modal visible={!!longChapterModal} transparent animationType="slide" statusBarTranslucent>
        <View style={styles.overlay}>
          <View style={[styles.splitCard, { backgroundColor: colors.card }]}>
            {/* Header */}
            <View style={[styles.splitHeader, { backgroundColor: colors.primary + '14' }]}>
              <View style={[styles.splitIconWrap, { backgroundColor: colors.primary }]}>
                <Feather name="scissors" size={18} color="#fff" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.splitTitle, { color: colors.foreground }]}>{t('bloomManuscript.chapterTooLong')}</Text>
                <Text style={[styles.splitSubtitle, { color: colors.mutedForeground }]} numberOfLines={1}>
                  "{longChapterModal?.title}"
                </Text>
              </View>
              <View style={[styles.splitWordBadge, { backgroundColor: colors.accent + '20' }]}>
                <Text style={[styles.splitWordBadgeText, { color: colors.accent }]}>
                  {longChapterModal?.wordCount.toLocaleString()} words
                </Text>
              </View>
            </View>

            <Text style={[styles.splitBody, { color: colors.mutedForeground }]}>
              {t('bloomManuscript.chapterTooLongBody', { genre: genre.toLowerCase(), range: pendingImport.current?.thresholds.rangeLabel, count: longChapterModal?.segments.length })}
            </Text>

            {/* Proposed segments */}
            <ScrollView style={styles.splitScroll} showsVerticalScrollIndicator={false}>
              {longChapterModal?.segments.map((seg, si) => (
                <View key={si} style={[styles.splitSegCard, { borderColor: colors.border, backgroundColor: colors.background }]}>
                  <View style={styles.splitSegHeader}>
                    <View style={[styles.splitSegNum, { backgroundColor: colors.primary }]}>
                      <Text style={styles.splitSegNumText}>{si + 1}</Text>
                    </View>
                    <Text style={[styles.splitSegWords, { color: colors.mutedForeground }]}>
                      {seg.words.toLocaleString()} words
                    </Text>
                  </View>
                  <TextInput
                    value={splitNames[si] ?? ''}
                    onChangeText={v => setSplitNames(prev => { const n = [...prev]; n[si] = v; return n; })}
                    placeholder={t('bloomManuscript.nameChapter', { number: si + 1 })}
                    placeholderTextColor={colors.mutedForeground}
                    style={[styles.splitNameInput, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.card }]}
                  />
                </View>
              ))}
            </ScrollView>

            {/* Actions */}
            <View style={styles.splitActions}>
              <TouchableOpacity
                onPress={handleKeepChapter}
                style={[styles.splitKeepBtn, { borderColor: colors.border }]}
                activeOpacity={0.8}
              >
                <Text style={[styles.splitKeepText, { color: colors.mutedForeground }]}>{t('bloomManuscript.keepAsOne')}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleSplitChapter}
                style={[styles.splitDoBtn, { backgroundColor: colors.primary }]}
                activeOpacity={0.85}
              >
                <Feather name="scissors" size={15} color="#fff" />
                <Text style={styles.splitDoBtnText}>{t('bloomManuscript.splitItUp')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ── Run-on sentence check modal ── */}
      <Modal visible={!!runOnModal} transparent animationType="slide" statusBarTranslucent>
        <View style={styles.overlay}>
          <View style={[styles.splitCard, { backgroundColor: colors.card }]}>
            {/* Header */}
            <View style={[styles.splitHeader, { backgroundColor: colors.warning + '18' }]}>
              <View style={[styles.splitIconWrap, { backgroundColor: colors.warning }]}>
                <Feather name="alert-circle" size={18} color="#fff" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.splitTitle, { color: colors.foreground }]}>{t('bloomManuscript.runOnSentences')}</Text>
                <Text style={[styles.splitSubtitle, { color: colors.mutedForeground }]}>
                  {t('bloomManuscript.runOnFlagged', { count: runOnModal?.count ?? 0 })}
                </Text>
              </View>
              <View style={[styles.splitWordBadge, { backgroundColor: colors.warning + '22' }]}>
                <Text style={[styles.splitWordBadgeText, { color: colors.warning }]}>
                  {t('bloomManuscript.runOnThreshold')}
                </Text>
              </View>
            </View>

            <Text style={[styles.splitBody, { color: colors.mutedForeground }]}>
              {t('bloomManuscript.runOnBody')}
            </Text>

            {/* Example sentences */}
            <ScrollView style={[styles.splitScroll, { maxHeight: 260 }]} showsVerticalScrollIndicator={false}>
              {runOnModal?.examples.map((ex, ei) => (
                <View key={ei} style={[styles.runOnCard, { borderColor: colors.warning + '40', backgroundColor: colors.warning + '08' }]}>
                  <Text style={[styles.runOnChapter, { color: colors.warning }]} numberOfLines={1}>
                    {ex.chapterTitle}
                  </Text>
                  <Text style={[styles.runOnSentence, { color: colors.foreground }]}>
                    "{ex.sentence}"
                  </Text>
                </View>
              ))}
              {(runOnModal?.count ?? 0) > 3 && (
                <Text style={[styles.runOnMore, { color: colors.mutedForeground }]}>
                  {t('bloomManuscript.runOnMore', { count: (runOnModal?.count ?? 0) - 3 })}
                </Text>
              )}
            </ScrollView>

            {/* Single action — import regardless */}
            <View style={[styles.splitActions, { paddingTop: 12 }]}>
              <TouchableOpacity
                onPress={handleRunOnDismiss}
                style={[styles.splitDoBtn, { backgroundColor: colors.primary, flex: 1 }]}
                activeOpacity={0.85}
              >
                <Feather name="check" size={15} color="#fff" />
                <Text style={styles.splitDoBtnText}>{t('bloomManuscript.gotItImport')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ── Dialogue punctuation check modal ── */}
      <Modal visible={!!dialoguePuncModal} transparent animationType="slide" statusBarTranslucent>
        <View style={styles.overlay}>
          <View style={[styles.splitCard, { backgroundColor: colors.card }]}>
            {/* Header */}
            <View style={[styles.splitHeader, { backgroundColor: colors.accent + '18' }]}>
              <View style={[styles.splitIconWrap, { backgroundColor: colors.accent }]}>
                <Feather name="message-square" size={18} color="#fff" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.splitTitle, { color: colors.foreground }]}>{t('bloomManuscript.dialoguePunc')}</Text>
                <Text style={[styles.splitSubtitle, { color: colors.mutedForeground }]}>
                  {t('bloomManuscript.dialoguePuncPatterns', { count: dialoguePuncModal?.count ?? 0 })}
                </Text>
              </View>
              <View style={[styles.splitWordBadge, { backgroundColor: colors.accent + '22' }]}>
                <Text style={[styles.splitWordBadgeText, { color: colors.accent }]}>{t('bloomManuscript.chicagoStyle')}</Text>
              </View>
            </View>

            <Text style={[styles.splitBody, { color: colors.mutedForeground }]}>
              {t('bloomManuscript.dialoguePuncBody')}
            </Text>

            {/* Example issues */}
            <ScrollView style={[styles.splitScroll, { maxHeight: 280 }]} showsVerticalScrollIndicator={false}>
              {dialoguePuncModal?.examples.map((ex, ei) => (
                <View key={ei} style={[styles.runOnCard, { borderColor: colors.accent + '40', backgroundColor: colors.accent + '08' }]}>
                  <Text style={[styles.runOnChapter, { color: colors.accent }]} numberOfLines={1}>
                    {ex.chapterTitle}
                  </Text>
                  <Text style={[styles.dialogueIssueLabel, { color: colors.foreground }]}>
                    {ex.issue}
                  </Text>
                  <Text style={[styles.runOnSentence, { color: colors.mutedForeground }]}>
                    "{ex.excerpt}"
                  </Text>
                </View>
              ))}
              {(dialoguePuncModal?.count ?? 0) > 3 && (
                <Text style={[styles.runOnMore, { color: colors.mutedForeground }]}>
                  {t('bloomManuscript.dialoguePuncMore', { count: (dialoguePuncModal?.count ?? 0) - 3 })}
                </Text>
              )}
            </ScrollView>

            {/* Action */}
            <View style={[styles.splitActions, { paddingTop: 12 }]}>
              <TouchableOpacity
                onPress={handleDialoguePuncDismiss}
                style={[styles.splitDoBtn, { backgroundColor: colors.accent, flex: 1 }]}
                activeOpacity={0.85}
              >
                <Feather name="check" size={15} color="#fff" />
                <Text style={styles.splitDoBtnText}>{t('bloomManuscript.gotItImport')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ── Full-screen loading overlay ── */}
      <Modal visible={loadingVisible} transparent animationType="fade" statusBarTranslucent>
        <View style={styles.overlay}>
          <View style={[styles.overlayCard, { backgroundColor: colors.card }]}>
            <ActivityIndicator size="large" color={colors.accent} style={{ marginBottom: 18 }} />
            <Text style={[styles.overlayTitle, { color: colors.foreground }]}>{t('bloomManuscript.processing')}</Text>
            <Text style={[styles.overlayMsg, { color: colors.mutedForeground }]}>{loadingMessage}</Text>
          </View>
        </View>
      </Modal>

      {/* ── Header ── */}
      <View style={[styles.header, { paddingTop: topPad + 12, backgroundColor: colors.primary }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Feather name="arrow-left" size={20} color="#fff" />
        </TouchableOpacity>
        <View style={styles.headerBrand}>
          <View style={[styles.bloomBadge, { backgroundColor: colors.accent }]}>
            <Text style={styles.bloomBadgeLetter}>B</Text>
          </View>
          <View>
            <Text style={styles.bloomPowered}>{t('bloomManuscript.poweredBy')}</Text>
            <Text style={styles.bloomName}>BloomScript Novels Scripts Comic Production</Text>
          </View>
        </View>
        <View style={{ width: 32 }} />
      </View>

      <View style={[styles.headerBody, { backgroundColor: colors.primary }]}>
        <Text style={styles.headerTitle}>{t('bloomManuscript.headerTitle')}</Text>
        <Text style={styles.headerSub}>{t('bloomManuscript.headerSub')}</Text>
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={[styles.body, { paddingBottom: bottomPad }]} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>

        {/* Genre */}
        <Text style={[styles.label, { color: colors.mutedForeground }]}>{t('bloomManuscript.genre')}</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 20 }}>
          <View style={styles.genreRow}>
            {QUICK_GENRES.map(g => (
              <TouchableOpacity key={g} onPress={() => setGenre(g)}
                style={[styles.genreChip, { borderColor: genre === g ? colors.primary : colors.border, backgroundColor: genre === g ? colors.primary + '18' : colors.card }]}>
                <Text style={[styles.genreChipText, { color: genre === g ? colors.primary : colors.mutedForeground, fontFamily: genre === g ? 'Inter_600SemiBold' : 'Inter_400Regular' }]}>{g}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>

        {/* File upload */}
        <Text style={[styles.label, { color: colors.mutedForeground }]}>{t('bloomManuscript.importFile')}</Text>
        <TouchableOpacity
          style={[styles.uploadBtn, { borderColor: colors.accent, backgroundColor: colors.accent + '0D' }]}
          onPress={handlePickFile}
          activeOpacity={0.8}
        >
          {pickedFileName ? (
            <>
              <Feather name="check-circle" size={20} color={colors.accent} />
              <View style={{ flex: 1 }}>
                <Text style={[styles.uploadBtnText, { color: colors.accent }]} numberOfLines={1}>{pickedFileName}</Text>
                <Text style={[styles.uploadBtnSub, { color: colors.mutedForeground }]}>{t('bloomManuscript.tapToChange')}</Text>
              </View>
              <TouchableOpacity
                onPress={(e) => { e.stopPropagation(); setPickedFileName(null); setText(''); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
                hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                style={{ paddingLeft: 8 }}
              >
                <Feather name="x-circle" size={18} color={colors.mutedForeground} />
              </TouchableOpacity>
            </>
          ) : (
            <>
              <Feather name="upload" size={20} color={colors.accent} />
              <View style={{ flex: 1 }}>
                <Text style={[styles.uploadBtnText, { color: colors.accent }]}>{t('bloomManuscript.chooseFile')}</Text>
                <Text style={[styles.uploadBtnSub, { color: colors.mutedForeground }]}>{t('bloomManuscript.fileFormats')}</Text>
              </View>
              <Feather name="chevron-right" size={16} color={colors.accent} />
            </>
          )}
        </TouchableOpacity>

        {/* Divider */}
        <View style={styles.dividerRow}>
          <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
          <Text style={[styles.dividerText, { color: colors.mutedForeground }]}>{t('bloomManuscript.orPasteText')}</Text>
          <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
        </View>

        {/* Paste area */}
        <Text style={[styles.label, { color: colors.mutedForeground }]}>{t('bloomManuscript.manuscriptText')}</Text>
        <View style={[styles.textAreaWrapper, { borderColor: text ? colors.primary : colors.border, backgroundColor: colors.card }]}>
          <TextInput
            ref={inputRef}
            value={text}
            onChangeText={setText}
            multiline
            placeholder={t('bloomManuscript.pastePlaceholder')}
            placeholderTextColor={colors.mutedForeground}
            style={[styles.textArea, { color: colors.foreground }]}
            textAlignVertical="top"
            scrollEnabled={false}
          />
          {words > 0 && (
            <View style={styles.wordCountRow}>
              <Feather name="type" size={12} color={colors.mutedForeground} />
              <Text style={[styles.wordCount, { color: colors.mutedForeground }]}>{t('common.wordCount', { count: words.toLocaleString() })}</Text>
            </View>
          )}
        </View>

        {/* Tip */}
        <View style={[styles.tipCard, { backgroundColor: colors.accent + '12', borderColor: colors.accent + '40' }]}>
          <Feather name="zap" size={14} color={colors.accent} />
          <Text style={[styles.tipText, { color: colors.accent }]}>
            {t('bloomManuscript.tipText')}
          </Text>
        </View>

        {/* Heading Font */}
        <Text style={[styles.label, { color: colors.mutedForeground }]}>{t('bloomManuscript.headingFont')}</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 24 }}>
          <View style={styles.genreRow}>
            {[...HEADING_FONT_OPTIONS, ...asExportFonts()].map(f => (
              <TouchableOpacity
                key={f.id}
                onPress={() => { Haptics.selectionAsync(); setHeadingFontId(f.id); }}
                style={[styles.fontChip, {
                  borderColor: headingFontId === f.id ? colors.primary : colors.border,
                  backgroundColor: headingFontId === f.id ? colors.primary + '18' : colors.card,
                }]}
              >
                <Text style={[styles.fontChipText, {
                  color: headingFontId === f.id ? colors.primary : colors.mutedForeground,
                  fontFamily: f.family,
                }]}>
                  {f.label}
                </Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity
              onPress={() => { Haptics.selectionAsync(); setAddFontVisible(true); }}
              style={[styles.fontChip, { borderColor: colors.primary, borderStyle: 'dashed', backgroundColor: colors.card }]}
            >
              <Feather name="plus" size={13} color={colors.primary} />
              <Text style={[styles.fontChipText, { color: colors.primary }]}>{t('bloomManuscript.addFont')}</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>

        <AddFontModal
          visible={addFontVisible}
          onClose={() => setAddFontVisible(false)}
          onAdd={async (label, family, fontUrl) => {
            await addCustomFont(label, family, fontUrl);
            setHeadingFontId(`custom-${label.toLowerCase().replace(/\s+/g, '-')}`);
          }}
        />

        {/* Document Format */}
        <Text style={[styles.label, { color: colors.mutedForeground }]}>{t('bloomManuscript.titleAlignment')}</Text>
        <View style={styles.fmtRow}>
          {([
            { value: 'left', icon: 'align-left', labelKey: 'bloomManuscript.alignLeft' },
            { value: 'center', icon: 'align-center', labelKey: 'bloomManuscript.alignCenter' },
            { value: 'right', icon: 'align-right', labelKey: 'bloomManuscript.alignRight' },
          ] as { value: TextAlignment; icon: string; labelKey: string }[]).map(({ value, icon, labelKey }) => {
            const label = t(labelKey);
            const selected = titleAlignment === value;
            return (
              <TouchableOpacity
                key={value}
                onPress={() => { Haptics.selectionAsync(); setTitleAlignment(value); }}
                style={[styles.fmtCard, {
                  borderColor: selected ? colors.primary : colors.border,
                  backgroundColor: selected ? colors.primary + '18' : colors.card,
                }]}
              >
                <Feather name={icon as any} size={18} color={selected ? colors.primary : colors.mutedForeground} />
                <Text style={[styles.fmtCardText, { color: selected ? colors.primary : colors.mutedForeground, fontFamily: selected ? 'Inter_700Bold' : 'Inter_400Regular' }]}>
                  {label}
                </Text>
                {selected && <View style={[styles.fmtDot, { backgroundColor: colors.primary }]} />}
              </TouchableOpacity>
            );
          })}
        </View>

        <Text style={[styles.label, { color: colors.mutedForeground, marginTop: 16 }]}>{t('bloomManuscript.chapterTitleAlignment')}</Text>
        <View style={styles.fmtRow}>
          {([
            { value: 'left', icon: 'align-left', labelKey: 'bloomManuscript.alignLeft' },
            { value: 'center', icon: 'align-center', labelKey: 'bloomManuscript.alignCenter' },
            { value: 'right', icon: 'align-right', labelKey: 'bloomManuscript.alignRight' },
          ] as { value: TextAlignment; icon: string; labelKey: string }[]).map(({ value, icon, labelKey }) => {
            const label = t(labelKey);
            const selected = chapterTitleAlignment === value;
            return (
              <TouchableOpacity
                key={value}
                onPress={() => { Haptics.selectionAsync(); setChapterTitleAlignment(value); }}
                style={[styles.fmtCard, {
                  borderColor: selected ? colors.primary : colors.border,
                  backgroundColor: selected ? colors.primary + '18' : colors.card,
                }]}
              >
                <Feather name={icon as any} size={18} color={selected ? colors.primary : colors.mutedForeground} />
                <Text style={[styles.fmtCardText, { color: selected ? colors.primary : colors.mutedForeground, fontFamily: selected ? 'Inter_700Bold' : 'Inter_400Regular' }]}>
                  {label}
                </Text>
                {selected && <View style={[styles.fmtDot, { backgroundColor: colors.primary }]} />}
              </TouchableOpacity>
            );
          })}
        </View>

        <Text style={[styles.label, { color: colors.mutedForeground, marginTop: 16 }]}>{t('bloomManuscript.pageNumbers')}</Text>
        <View style={[styles.fmtRow, { marginBottom: 24 }]}>
          {([
            { value: 'none', icon: 'slash', labelKey: 'bloomManuscript.pageNone' },
            { value: 'bottom-center', icon: 'align-justify', labelKey: 'bloomManuscript.pageCenter' },
            { value: 'bottom-outside', icon: 'columns', labelKey: 'bloomManuscript.pageOutside' },
          ] as { value: PageNumberStyle; icon: string; labelKey: string }[]).map(({ value, icon, labelKey }) => {
            const label = t(labelKey);
            const selected = pageNumbers === value;
            return (
              <TouchableOpacity
                key={value}
                onPress={() => { Haptics.selectionAsync(); setPageNumbers(value); }}
                style={[styles.fmtCard, {
                  borderColor: selected ? colors.primary : colors.border,
                  backgroundColor: selected ? colors.primary + '18' : colors.card,
                }]}
              >
                <Feather name={icon as any} size={18} color={selected ? colors.primary : colors.mutedForeground} />
                <Text style={[styles.fmtCardText, { color: selected ? colors.primary : colors.mutedForeground, fontFamily: selected ? 'Inter_700Bold' : 'Inter_400Regular' }]}>
                  {label}
                </Text>
                {selected && <View style={[styles.fmtDot, { backgroundColor: colors.primary }]} />}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* CTA */}
        <TouchableOpacity
          onPress={handleProcess}
          disabled={!text.trim() || processing}
          activeOpacity={0.85}
          style={[styles.ctaBtn, { backgroundColor: text.trim() ? colors.primary : colors.border }]}
        >
          {processing ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <>
              <Text style={styles.ctaBtnText}>{t('bloomManuscript.processBtn')}</Text>
              <Feather name="arrow-right" size={18} color="#fff" />
            </>
          )}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  overlayCard: {
    borderRadius: 24,
    padding: 36,
    alignItems: 'center',
    width: '100%',
    maxWidth: 320,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 8 },
    elevation: 12,
  },
  overlayTitle: { fontSize: 18, fontFamily: 'Inter_700Bold', marginBottom: 8 },
  overlayMsg: { fontSize: 14, fontFamily: 'Inter_400Regular', textAlign: 'center', lineHeight: 20 },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingBottom: 0, gap: 12 },
  backBtn: { width: 32, alignItems: 'flex-start' },
  headerBrand: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10, justifyContent: 'center' },
  bloomBadge: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
  bloomBadgeLetter: { color: '#fff', fontFamily: 'Inter_700Bold', fontSize: 17 },
  bloomPowered: { color: 'rgba(255,255,255,0.55)', fontSize: 10, fontFamily: 'Inter_500Medium', letterSpacing: 0.5 },
  bloomName: { color: '#fff', fontSize: 16, fontFamily: 'Inter_700Bold', letterSpacing: 0.3 },
  headerBody: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 20 },
  headerTitle: { color: '#fff', fontSize: 22, fontFamily: 'Inter_700Bold', marginBottom: 4 },
  headerSub: { color: 'rgba(255,255,255,0.7)', fontSize: 13, fontFamily: 'Inter_400Regular', lineHeight: 19 },
  body: { padding: 20, gap: 0 },
  label: { fontSize: 10, fontFamily: 'Inter_600SemiBold', letterSpacing: 1, marginBottom: 10 },
  genreRow: { flexDirection: 'row', gap: 8 },
  genreChip: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 999, borderWidth: 1 },
  genreChipText: { fontSize: 13 },
  uploadBtn: { borderWidth: 1.5, borderStyle: 'dashed', borderRadius: 16, paddingVertical: 18, paddingHorizontal: 18, flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 20 },
  uploadBtnText: { fontSize: 15, fontFamily: 'Inter_600SemiBold' },
  uploadBtnSub: { fontSize: 12, fontFamily: 'Inter_400Regular', marginTop: 2 },
  dividerRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 20 },
  dividerLine: { flex: 1, height: StyleSheet.hairlineWidth },
  dividerText: { fontSize: 12, fontFamily: 'Inter_400Regular' },
  textAreaWrapper: { borderWidth: 1.5, borderRadius: 16, padding: 14, marginBottom: 16, minHeight: 180 },
  textArea: { fontSize: 14, fontFamily: 'Inter_400Regular', lineHeight: 22, minHeight: 140 },
  wordCountRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 8 },
  wordCount: { fontSize: 12, fontFamily: 'Inter_400Regular' },
  tipCard: { borderWidth: 1, borderRadius: 14, padding: 14, flexDirection: 'row', gap: 10, alignItems: 'flex-start', marginBottom: 24 },
  tipText: { flex: 1, fontSize: 13, fontFamily: 'Inter_400Regular', lineHeight: 19 },
  ctaBtn: { borderRadius: 16, paddingVertical: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 },
  ctaBtnText: { color: '#fff', fontSize: 16, fontFamily: 'Inter_700Bold' },
  splitCard: {
    borderRadius: 24, padding: 0, width: '100%', maxWidth: 400,
    shadowColor: '#000', shadowOpacity: 0.25, shadowRadius: 24, shadowOffset: { width: 0, height: 10 }, elevation: 16,
    overflow: 'hidden', maxHeight: '85%',
  },
  splitHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 18, paddingBottom: 16 },
  splitIconWrap: { width: 38, height: 38, borderRadius: 11, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  splitTitle: { fontSize: 16, fontFamily: 'Inter_700Bold', marginBottom: 1 },
  splitSubtitle: { fontSize: 12, fontFamily: 'Inter_400Regular' },
  splitWordBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, flexShrink: 0 },
  splitWordBadgeText: { fontSize: 12, fontFamily: 'Inter_600SemiBold' },
  splitBody: { fontSize: 13, fontFamily: 'Inter_400Regular', lineHeight: 19, paddingHorizontal: 18, paddingBottom: 12 },
  splitScroll: { maxHeight: 320, paddingHorizontal: 18 },
  splitSegCard: { borderWidth: 1, borderRadius: 14, padding: 12, marginBottom: 10 },
  splitSegHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  splitSegNum: { width: 22, height: 22, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  splitSegNumText: { color: '#fff', fontSize: 11, fontFamily: 'Inter_700Bold' },
  splitSegWords: { fontSize: 12, fontFamily: 'Inter_400Regular' },
  splitNameInput: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8, fontSize: 14, fontFamily: 'Inter_400Regular' },
  splitActions: { flexDirection: 'row', gap: 10, padding: 18, paddingTop: 14 },
  splitKeepBtn: { flex: 1, borderWidth: 1, borderRadius: 14, paddingVertical: 13, alignItems: 'center', justifyContent: 'center' },
  splitKeepText: { fontSize: 14, fontFamily: 'Inter_500Medium' },
  splitDoBtn: { flex: 2, borderRadius: 14, paddingVertical: 13, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 7 },
  splitDoBtnText: { color: '#fff', fontSize: 15, fontFamily: 'Inter_700Bold' },
  runOnCard: { borderWidth: 1, borderRadius: 12, padding: 12, marginBottom: 10 },
  runOnChapter: { fontSize: 11, fontFamily: 'Inter_600SemiBold', marginBottom: 5, textTransform: 'uppercase', letterSpacing: 0.5 },
  runOnSentence: { fontSize: 13, fontFamily: 'Inter_400Regular', lineHeight: 19, fontStyle: 'italic' },
  runOnMore: { fontSize: 12, fontFamily: 'Inter_400Regular', textAlign: 'center', paddingVertical: 6, paddingBottom: 4 },
  dialogueIssueLabel: { fontSize: 12, fontFamily: 'Inter_600SemiBold', marginBottom: 4 },
  fontChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999, borderWidth: 1, marginRight: 8 },
  fontChipText: { fontSize: 14 },
  fmtRow: { flexDirection: 'row', gap: 8, marginBottom: 4 },
  fmtCard: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1.5,
    position: 'relative',
  },
  fmtCardText: { fontSize: 12 },
  fmtDot: {
    position: 'absolute',
    top: 7,
    right: 7,
    width: 6,
    height: 6,
    borderRadius: 3,
  },
});
