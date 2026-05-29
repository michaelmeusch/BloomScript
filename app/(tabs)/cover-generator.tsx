import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system/legacy';
import { useLocalSearchParams, router } from 'expo-router';
import * as Sharing from 'expo-sharing';
import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  PanResponder,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import ViewShot from 'react-native-view-shot';
import Svg, { Rect as SvgRect, Ellipse as SvgEllipse, Line as SvgLine, Polygon as SvgPolygon, Path as SvgPath } from 'react-native-svg';

import { useAuth } from '@clerk/expo';
import { useTranslation } from 'react-i18next';

import { API_BASE } from '@/constants/api';
import { useBooks } from '@/context/BookContext';
import { useLanguage } from '@/context/LanguageContext';
import { useColors } from '@/hooks/useColors';
import { SUPPORTED_LANGUAGES } from '@/lib/i18n';
import { useSubscription } from '@/lib/revenuecat';
import { DEFAULT_FONT_ID, EXPORT_FONTS } from '@/constants/fonts';
import { AddFontModal } from '@/components/AddFontModal';
import { ColorPickerModal } from '@/components/ColorPickerModal';
import { useCustomFonts } from '@/hooks/useCustomFonts';

const COVER_GENRES = [
  'Fantasy',
  'Urban Fantasy',
  'Thriller',
  'Romance',
  'Horror',
  'Sci-Fi',
  "Children's Fantasy",
  'Mystery',
  'Fiction',
  'Non-Fiction',
  'Memoir',
  'Other',
] as const;

const COVER_FORMATS = [
  { key: 'standard', label: 'Standard', sub: '5 × 8″',  ratio: 1000 / 625,  icon: '📕' },
  { key: 'trade',    label: 'Trade',    sub: '6 × 9″',  ratio: 9 / 6,       icon: '📗' },
  { key: 'square',   label: 'Square',   sub: '1 : 1',   ratio: 1,            icon: '◻' },
] as const;
type CoverFormatKey = typeof COVER_FORMATS[number]['key'];

// ── Research-backed standard book cover sizes ──────────────────────────────
// Based on publishing industry norms for a 6×9" cover printed at 300 dpi.
// Scaled to the phone preview canvas (≈342×547 px):
//   Title    52 px → matches 70–90 pt dominant title, readable at thumbnail
//   Subtitle 20 px → 38% of title (Chicago Manual cover hierarchy ratio)
//   Author   18 px → 35% of title (debut author standard positioning)
const STANDARD_SIZES = { title: 52, subtitle: 20, author: 18 } as const;
const BLOCK_SIZES = [0.12, 0.18, 0.28, 0.4, 0.52] as const;
const FONT_COLOR_STOPS = [
  '#FFFFFF',
  '#F8FAFC',
  '#E2E8F0',
  '#CBD5E1',
  '#94A3B8',
  '#64748B',
  '#334155',
  '#111827',
  '#7C3AED',
  '#2563EB',
  '#059669',
  '#DC2626',
] as const;

function rotatePt(x: number, y: number, cx: number, cy: number, deg: number) {
  const r = deg * Math.PI / 180;
  const cos = Math.cos(r), sin = Math.sin(r);
  const dx = x - cx, dy = y - cy;
  return { x: cx + dx * cos - dy * sin, y: cy + dx * sin + dy * cos };
}

function starPath(w: number, h: number, outerR: number, innerR: number, numPoints: number): string {
  const cx = w / 2, cy = h / 2;
  const pts: string[] = [];
  for (let i = 0; i < numPoints * 2; i++) {
    const angle = (i * Math.PI / numPoints) - Math.PI / 2;
    const r = i % 2 === 0 ? outerR : innerR;
    pts.push(`${cx + r * Math.cos(angle)},${cy + r * Math.sin(angle)}`);
  }
  return `M ${pts.join(' L ')} Z`;
}

const KNOWN_ARTIST_RE = new RegExp(
  [
    'rossetti','dante gabriel','millais','holman hunt','burne.jones','waterhouse',
    'ford madox','william morris','beardsley','armstrong','n\\.c\\. wyeth','nc wyeth',
    'mcginnis','lissitzky','rodchenko','chip kidd','mendelsund','michael whelan',
    'kelly freas','chris foss','schoenherr','frank r\\. paul','boris vallejo','vallejo',
    'richard powers','robert mccall','john berkey','berkey','ian miller',
    'bruce pennington','pennington','tran nguyen','chris riddell','rebecca frank',
    'leni kauffman','monique aimee','pino daeni','daeni','chinthaka pradeep',
    'anna moshak','elaine duillo','duillo','harry bennett','victor gadino','gadino',
    'james griffin','renato aime','rachelle baker','darren booth','isabel urbina',
    'rachel willey','janet hansen','walter crane',
  ].join('|'),
  'i',
);

export default function CoverGeneratorScreen() {
  const colors = useColors();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  const { bookId } = useLocalSearchParams<{ bookId: string }>();
  const { getBook, updateBook } = useBooks();
  const { getToken } = useAuth();
  const { isSubscribed, customerInfo } = useSubscription();
  const { language } = useLanguage();
  const languageName = SUPPORTED_LANGUAGES.find((l) => l.code === language)?.label ?? 'English';

  const book = getBook(bookId ?? '');
  const titleFontId = book?.coverTitleFontId ?? book?.previewFontId ?? DEFAULT_FONT_ID;

  const [title, setTitle] = useState('');
  const [authorName, setAuthorName] = useState(book?.coverAuthorName ?? '');
  const [subtitle, setSubtitle] = useState(book?.coverSubtitle ?? '');
  const { customFonts, addCustomFont, asExportFonts } = useCustomFonts();
  const allFonts = [...EXPORT_FONTS, ...asExportFonts()];
  const titleFont = allFonts.find((f) => f.id === titleFontId) ?? EXPORT_FONTS[0]!;
  const subtitleFont = allFonts.find((f) => f.id === (book?.previewFontId ?? DEFAULT_FONT_ID)) ?? EXPORT_FONTS[0]!;
  const [fontPickerVisible, setFontPickerVisible] = useState(false);
  const [fontTarget, setFontTarget] = useState<'title' | 'subtitle'>('title');
  const [addFontVisible, setAddFontVisible] = useState(false);
  const [description, setDescription] = useState('');
  const [coverGenre, setCoverGenre] = useState<string>(book?.genre ?? '');
  const [selectedFormat, setSelectedFormat] = useState<CoverFormatKey>('standard');
  const [titleScale, setTitleScale] = useState(1);
  const [titleGap, setTitleGap] = useState(8);
  const [titleSize, setTitleSize] = useState(28);
  const [subtitleSize, setSubtitleSize] = useState(14);
  const [authorSize, setAuthorSize] = useState(13);
  const [titlePosition, setTitlePosition] = useState({ x: 0, y: 0 });
  const titleDragStart = useRef({ x: 0, y: 0 });
  const titlePositionRef = useRef({ x: 0, y: 0 });
  const titleSizeRef = useRef(28);
  const subtitleSizeRef = useRef(14);
  const authorSizeRef = useRef(13);
  const pinchStartDistRef = useRef<number | null>(null);
  const pinchStartSizesRef = useRef({ title: 28, subtitle: 14, author: 13 });
  const [subtitlePosition, setSubtitlePosition] = useState({ x: 0, y: 0 });
  const subtitleDragStart = useRef({ x: 0, y: 0 });
  const subtitlePositionRef = useRef({ x: 0, y: 0 });
  const subtitlePinchDistRef = useRef<number | null>(null);
  const subtitlePinchStartSizeRef = useRef(14);
  const [authorPosition, setAuthorPosition] = useState({ x: 0, y: 0 });
  const authorDragStart = useRef({ x: 0, y: 0 });
  const authorPositionRef = useRef({ x: 0, y: 0 });
  const authorPinchDistRef = useRef<number | null>(null);
  const authorPinchStartSizeRef = useRef(13);
  const [activeDragEl, setActiveDragEl] = useState<'title' | 'subtitle' | 'author' | null>(null);
  const [snapV, setSnapV] = useState(false);
  const [snapH, setSnapH] = useState(false);
  const [snapGoldenH1, setSnapGoldenH1] = useState(false);
  const [snapGoldenH2, setSnapGoldenH2] = useState(false);
  const [snapGoldenV1, setSnapGoldenV1] = useState(false);
  const [snapGoldenV2, setSnapGoldenV2] = useState(false);
  const [alignGuideY, setAlignGuideY] = useState<number | null>(null);
  type TextEffect = 'none' | 'shadow' | 'embossed' | 'glow' | 'neon' | 'retro' | 'starburst';
  const EFFECT_LABELS: Record<TextEffect, string> = {
    none: 'None', shadow: 'Shadow', embossed: 'Emboss',
    glow: 'Glow', neon: 'Neon', retro: 'Retro', starburst: 'Starburst',
  };
  const [titleEffect, setTitleEffect] = useState<TextEffect>('none');
  const [subtitleEffect, setSubtitleEffect] = useState<TextEffect>('none');
  const [authorEffect, setAuthorEffect] = useState<TextEffect>('none');
  const [titleColor, setTitleColor] = useState('#FFFFFF');
  const [subtitleColor, setSubtitleColor] = useState('#FFFFFF');
  const [authorColor, setAuthorColor] = useState('#FFFFFF');
  const [titlePickerVisible, setTitlePickerVisible] = useState(false);
  const [subtitlePickerVisible, setSubtitlePickerVisible] = useState(false);
  const [authorPickerVisible, setAuthorPickerVisible] = useState(false);
  const [artistNameWarning, setArtistNameWarning] = useState(false);
  const [inspirationUri, setInspirationUri] = useState<string | null>(null);
  const [inspirationBase64, setInspirationBase64] = useState<string | null>(null);
  const [inspirationMimeType, setInspirationMimeType] = useState<string>('image/jpeg');
  const [generatedBase64, setGeneratedBase64] = useState<string | null>(null);
  const [uploadedCoverBase64, setUploadedCoverBase64] = useState<string | null>(null);
  const [uploadedCoverUri, setUploadedCoverUri] = useState<string | null>(null);
  const [uploadedCoverMimeType, setUploadedCoverMimeType] = useState<string>('image/jpeg');
  // rawBgUri = the raw AI art (no text burned in) — the editing background.
  // coverImageUri = the final composite (text burned in) — stored on the book, never used as bg here.
  const [rawBgUri, setRawBgUri] = useState<string | null>(book?.coverRawImageUri ?? null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedUri, setSavedUri] = useState<string | null>(book?.coverImageUri ?? null);

  type ShapeKind = 'rect' | 'circle' | 'line' | 'diamond' | 'triangle' | 'starburst' | 'sparkle' | 'rays';
  interface CoverShape {
    id: string;
    kind: ShapeKind;
    x: number;
    y: number;
    w: number;
    h: number;
    color: string;
    opacity: number;
    filled: boolean;
    strokeWidth: number;
    rotation: number;
    curveOffsets: { top: number; right: number; bottom: number; left: number };
    locked?: boolean;
  }
  const [shapes, setShapes] = useState<CoverShape[]>([]);
  const [selectedShapeId, setSelectedShapeId] = useState<string | null>(null);
  const shapeDragRef = useRef<{ pageX: number; pageY: number; sx: number; sy: number; id: string } | null>(null);
  const shapeRotateRef = useRef<{ cx: number; cy: number; id: string; startAngle: number; startRotation: number } | null>(null);
  const shapeResizeRef = useRef<{ id: string; cx: number; cy: number } | null>(null);
  const shapeCurveRef = useRef<{ id: string; edge: 'top' | 'right' | 'bottom' | 'left' } | null>(null);
  const shapeSnapshotRef = useRef<CoverShape[] | null>(null);
  const shapesHistoryRef = useRef<CoverShape[][]>([]);
  const [shapesHistoryLen, setShapesHistoryLen] = useState(0);

  const snapStart = (current: CoverShape[]) => { shapeSnapshotRef.current = current; };
  const snapCommit = () => {
    const snapshot = shapeSnapshotRef.current;
    shapeSnapshotRef.current = null;
    if (!snapshot) return;
    shapesHistoryRef.current = [...shapesHistoryRef.current.slice(-29), snapshot];
    setShapesHistoryLen(shapesHistoryRef.current.length);
  };
  const undoShapes = () => {
    const hist = shapesHistoryRef.current;
    if (hist.length === 0) return;
    const last = hist[hist.length - 1];
    shapesHistoryRef.current = hist.slice(0, -1);
    setShapesHistoryLen(shapesHistoryRef.current.length);
    setShapes(last);
  };
  const canvasRef = useRef<View>(null);
  const canvasPageOffset = useRef({ x: 0, y: 0 });
  const [isDraggingShape, setIsDraggingShape] = useState(false);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const viewShotRef = useRef<any>(null);

  useEffect(() => {
    setTitle(book?.title ?? '');
    setAuthorName(book?.coverAuthorName ?? '');
    setSubtitle(book?.coverSubtitle ?? '');
    setSavedUri(book?.coverImageUri ?? null);
  // Font ID changes should NOT reset text — only actual book metadata changes should.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [book?.title, book?.coverAuthorName, book?.coverSubtitle, book?.coverImageUri]);

  const hasAccess =
    isSubscribed ||
    !!customerInfo?.entitlements.active?.['pro'];

  const activeFormat = COVER_FORMATS.find((f) => f.key === selectedFormat) ?? COVER_FORMATS[0]!;
  const COVER_RATIO = activeFormat.ratio;
  // Cap canvas height to 52% of screen so toolbar is always visible on iPad
  const maxCanvasHeight = screenHeight * 0.52;
  const uncappedWidth = screenWidth - 48;
  const previewHeight = Math.min(uncappedWidth * COVER_RATIO, maxCanvasHeight);
  const previewWidth = previewHeight / COVER_RATIO;
  const titleFontSize = 26 * titleScale;
  const titleLineHeight = 32 * titleScale;

  // φ — golden ratio composition lines (38.2% / 61.8% of each dimension)
  const PHI = 1.6180339887;
  const GOLDEN_H1_ABS = previewHeight * (1 - 1 / PHI); // 38.2% from top
  const GOLDEN_H2_ABS = previewHeight / PHI;            // 61.8% from top
  const GOLDEN_V1_ABS = previewWidth  * (1 - 1 / PHI); // 38.2% from left
  const GOLDEN_V2_ABS = previewWidth  / PHI;            // 61.8% from left
  // Per-element Y offsets to reach each golden line (baseline % → pixel)
  const TITLE_BASE_Y    = previewHeight * 0.18;
  const SUBTITLE_BASE_Y = previewHeight * 0.38;
  const AUTHOR_BASE_Y   = previewHeight * 0.54;
  const TITLE_GH1    = GOLDEN_H1_ABS - TITLE_BASE_Y;
  const TITLE_GH2    = GOLDEN_H2_ABS - TITLE_BASE_Y;
  const SUB_GH1      = GOLDEN_H1_ABS - SUBTITLE_BASE_Y;
  const SUB_GH2      = GOLDEN_H2_ABS - SUBTITLE_BASE_Y;
  const AUTH_GH1     = GOLDEN_H1_ABS - AUTHOR_BASE_Y;
  const AUTH_GH2     = GOLDEN_H2_ABS - AUTHOR_BASE_Y;

  const SNAP_THRESHOLD = 10;
  const GOLDEN_SNAP = 15;

  const getTouchDist = (touches: { pageX: number; pageY: number }[]) => {
    const dx = touches[0]!.pageX - touches[1]!.pageX;
    const dy = touches[0]!.pageY - touches[1]!.pageY;
    return Math.sqrt(dx * dx + dy * dy);
  };

  const setAllSizes = (title: number, subtitle: number, author: number) => {
    titleSizeRef.current = title;
    subtitleSizeRef.current = subtitle;
    authorSizeRef.current = author;
    setTitleSize(title);
    setSubtitleSize(subtitle);
    setAuthorSize(author);
  };

  // Shared guide-state reset — called on every release/terminate
  const clearGuides = () => {
    setSnapV(false); setSnapH(false);
    setSnapGoldenH1(false); setSnapGoldenH2(false);
    setSnapGoldenV1(false); setSnapGoldenV2(false);
    setAlignGuideY(null);
    setActiveDragEl(null);
  };

  // Resolve X: center-snap, then golden-ratio V snap
  const resolveX = (raw: number): { x: number; sv: boolean; gv1: boolean; gv2: boolean } => {
    if (Math.abs(raw) < SNAP_THRESHOLD) return { x: 0, sv: true, gv1: false, gv2: false };
    // golden V: element center (translateX=0 means center of cover) relative to GOLDEN_V1/V2
    const cx = raw; // offset from cover-center
    const toV1 = cx - (GOLDEN_V1_ABS - previewWidth / 2);
    const toV2 = cx - (GOLDEN_V2_ABS - previewWidth / 2);
    const toV1m = cx - -(GOLDEN_V1_ABS - previewWidth / 2); // mirror
    const toV2m = cx - -(GOLDEN_V2_ABS - previewWidth / 2);
    if (Math.abs(toV1) < GOLDEN_SNAP) return { x: GOLDEN_V1_ABS - previewWidth / 2, sv: false, gv1: true, gv2: false };
    if (Math.abs(toV2) < GOLDEN_SNAP) return { x: GOLDEN_V2_ABS - previewWidth / 2, sv: false, gv1: false, gv2: true };
    if (Math.abs(toV1m) < GOLDEN_SNAP) return { x: -(GOLDEN_V1_ABS - previewWidth / 2), sv: false, gv1: true, gv2: false };
    if (Math.abs(toV2m) < GOLDEN_SNAP) return { x: -(GOLDEN_V2_ABS - previewWidth / 2), sv: false, gv1: false, gv2: true };
    return { x: raw, sv: false, gv1: false, gv2: false };
  };

  // Resolve Y for a given element: center-snap, golden-H snap, cross-element alignment
  const resolveY = (
    rawY: number,
    baseY: number,
    gh1Target: number,
    gh2Target: number,
    otherAbsYs: number[],
  ): { y: number; sh: boolean; gh1: boolean; gh2: boolean; alignY: number | null } => {
    if (Math.abs(rawY) < SNAP_THRESHOLD) return { y: 0, sh: true, gh1: false, gh2: false, alignY: null };
    const absY = baseY + rawY;
    if (Math.abs(absY - GOLDEN_H1_ABS) < GOLDEN_SNAP) return { y: gh1Target, sh: false, gh1: true, gh2: false, alignY: null };
    if (Math.abs(absY - GOLDEN_H2_ABS) < GOLDEN_SNAP) return { y: gh2Target, sh: false, gh1: false, gh2: true, alignY: null };
    for (const oy of otherAbsYs) {
      if (Math.abs(absY - oy) < GOLDEN_SNAP) return { y: oy - baseY, sh: false, gh1: false, gh2: false, alignY: oy };
    }
    return { y: rawY, sh: false, gh1: false, gh2: false, alignY: null };
  };

  const titlePanResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (evt) => {
        setIsDraggingShape(true);
        setActiveDragEl('title');
        const touches = evt.nativeEvent.touches;
        if (touches.length >= 2) {
          pinchStartDistRef.current = getTouchDist(touches as { pageX: number; pageY: number }[]);
          pinchStartSizesRef.current = { ...pinchStartSizesRef.current, title: titleSizeRef.current };
        } else {
          titleDragStart.current = { ...titlePositionRef.current };
        }
      },
      onPanResponderMove: (evt, gestureState) => {
        const touches = evt.nativeEvent.touches;
        if (touches.length >= 2) {
          if (pinchStartDistRef.current === null) {
            pinchStartDistRef.current = getTouchDist(touches as { pageX: number; pageY: number }[]);
            pinchStartSizesRef.current = { ...pinchStartSizesRef.current, title: titleSizeRef.current };
            return;
          }
          const scale = getTouchDist(touches as { pageX: number; pageY: number }[]) / pinchStartDistRef.current;
          const v = Math.round(Math.max(10, Math.min(72, pinchStartSizesRef.current.title * scale)));
          titleSizeRef.current = v; setTitleSize(v);
        } else {
          pinchStartDistRef.current = null;
          const rawX = titleDragStart.current.x + gestureState.dx;
          const rawY = titleDragStart.current.y + gestureState.dy;
          const xr = resolveX(rawX);
          const yr = resolveY(rawY, TITLE_BASE_Y, TITLE_GH1, TITLE_GH2, [
            SUBTITLE_BASE_Y + subtitlePositionRef.current.y,
            AUTHOR_BASE_Y + authorPositionRef.current.y,
          ]);
          setSnapV(xr.sv); setSnapH(yr.sh);
          setSnapGoldenV1(xr.gv1); setSnapGoldenV2(xr.gv2);
          setSnapGoldenH1(yr.gh1); setSnapGoldenH2(yr.gh2);
          setAlignGuideY(yr.alignY);
          titlePositionRef.current = { x: xr.x, y: yr.y }; setTitlePosition({ x: xr.x, y: yr.y });
        }
      },
      onPanResponderRelease: () => { pinchStartDistRef.current = null; clearGuides(); setIsDraggingShape(false); },
      onPanResponderTerminate: () => { pinchStartDistRef.current = null; clearGuides(); setIsDraggingShape(false); },
    })
  ).current;

  const subtitlePanResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (evt) => {
        setIsDraggingShape(true);
        setActiveDragEl('subtitle');
        const touches = evt.nativeEvent.touches;
        if (touches.length >= 2) {
          subtitlePinchDistRef.current = getTouchDist(touches as { pageX: number; pageY: number }[]);
          subtitlePinchStartSizeRef.current = subtitleSizeRef.current;
        } else {
          subtitleDragStart.current = { ...subtitlePositionRef.current };
        }
      },
      onPanResponderMove: (evt, gestureState) => {
        const touches = evt.nativeEvent.touches;
        if (touches.length >= 2) {
          if (subtitlePinchDistRef.current === null) {
            subtitlePinchDistRef.current = getTouchDist(touches as { pageX: number; pageY: number }[]);
            subtitlePinchStartSizeRef.current = subtitleSizeRef.current;
            return;
          }
          const scale = getTouchDist(touches as { pageX: number; pageY: number }[]) / subtitlePinchDistRef.current;
          const v = Math.round(Math.max(8, Math.min(48, subtitlePinchStartSizeRef.current * scale)));
          subtitleSizeRef.current = v; setSubtitleSize(v);
        } else {
          subtitlePinchDistRef.current = null;
          const rawX = subtitleDragStart.current.x + gestureState.dx;
          const rawY = subtitleDragStart.current.y + gestureState.dy;
          const xr = resolveX(rawX);
          const yr = resolveY(rawY, SUBTITLE_BASE_Y, SUB_GH1, SUB_GH2, [
            TITLE_BASE_Y + titlePositionRef.current.y,
            AUTHOR_BASE_Y + authorPositionRef.current.y,
          ]);
          setSnapV(xr.sv); setSnapH(yr.sh);
          setSnapGoldenV1(xr.gv1); setSnapGoldenV2(xr.gv2);
          setSnapGoldenH1(yr.gh1); setSnapGoldenH2(yr.gh2);
          setAlignGuideY(yr.alignY);
          subtitlePositionRef.current = { x: xr.x, y: yr.y }; setSubtitlePosition({ x: xr.x, y: yr.y });
        }
      },
      onPanResponderRelease: () => { subtitlePinchDistRef.current = null; clearGuides(); setIsDraggingShape(false); },
      onPanResponderTerminate: () => { subtitlePinchDistRef.current = null; clearGuides(); setIsDraggingShape(false); },
    })
  ).current;

  const authorPanResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (evt) => {
        setIsDraggingShape(true);
        setActiveDragEl('author');
        const touches = evt.nativeEvent.touches;
        if (touches.length >= 2) {
          authorPinchDistRef.current = getTouchDist(touches as { pageX: number; pageY: number }[]);
          authorPinchStartSizeRef.current = authorSizeRef.current;
        } else {
          authorDragStart.current = { ...authorPositionRef.current };
        }
      },
      onPanResponderMove: (evt, gestureState) => {
        const touches = evt.nativeEvent.touches;
        if (touches.length >= 2) {
          if (authorPinchDistRef.current === null) {
            authorPinchDistRef.current = getTouchDist(touches as { pageX: number; pageY: number }[]);
            authorPinchStartSizeRef.current = authorSizeRef.current;
            return;
          }
          const scale = getTouchDist(touches as { pageX: number; pageY: number }[]) / authorPinchDistRef.current;
          const v = Math.round(Math.max(8, Math.min(48, authorPinchStartSizeRef.current * scale)));
          authorSizeRef.current = v; setAuthorSize(v);
        } else {
          authorPinchDistRef.current = null;
          const rawX = authorDragStart.current.x + gestureState.dx;
          const rawY = authorDragStart.current.y + gestureState.dy;
          const xr = resolveX(rawX);
          const yr = resolveY(rawY, AUTHOR_BASE_Y, AUTH_GH1, AUTH_GH2, [
            TITLE_BASE_Y + titlePositionRef.current.y,
            SUBTITLE_BASE_Y + subtitlePositionRef.current.y,
          ]);
          setSnapV(xr.sv); setSnapH(yr.sh);
          setSnapGoldenV1(xr.gv1); setSnapGoldenV2(xr.gv2);
          setSnapGoldenH1(yr.gh1); setSnapGoldenH2(yr.gh2);
          setAlignGuideY(yr.alignY);
          authorPositionRef.current = { x: xr.x, y: yr.y }; setAuthorPosition({ x: xr.x, y: yr.y });
        }
      },
      onPanResponderRelease: () => { authorPinchDistRef.current = null; clearGuides(); setIsDraggingShape(false); },
      onPanResponderTerminate: () => { authorPinchDistRef.current = null; clearGuides(); setIsDraggingShape(false); },
    })
  ).current;
  const fontColorIndex = (color: string) => {
    const index = FONT_COLOR_STOPS.indexOf(color as (typeof FONT_COLOR_STOPS)[number]);
    return index >= 0 ? index : 0;
  };
  const colorFromIndex = (index: number) => FONT_COLOR_STOPS[Math.max(0, Math.min(FONT_COLOR_STOPS.length - 1, index))];
  const getEffectStyle = (effect: TextEffect) => {
    if (effect === 'shadow')    return { textShadowColor: 'rgba(0,0,0,0.8)',         textShadowOffset: { width: 2, height: 3 }, textShadowRadius: 6  };
    if (effect === 'embossed')  return { textShadowColor: 'rgba(0,0,0,0.55)',        textShadowOffset: { width: 2, height: 2 }, textShadowRadius: 1  };
    if (effect === 'glow')      return { textShadowColor: 'rgba(255,255,255,0.85)',  textShadowOffset: { width: 0, height: 0 }, textShadowRadius: 10 };
    if (effect === 'neon')      return { textShadowColor: 'rgba(255,220,80,0.95)',   textShadowOffset: { width: 0, height: 0 }, textShadowRadius: 14 };
    if (effect === 'retro')     return { textShadowColor: '#000000',                 textShadowOffset: { width: 4, height: 4 }, textShadowRadius: 0  };
    if (effect === 'starburst') return { textShadowColor: 'rgba(255,255,255,0.7)',   textShadowOffset: { width: 0, height: 0 }, textShadowRadius: 22 };
    return {};
  };
  const handlePickInspiration = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      setError('Photo library access is required to upload an inspiration image.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [5, 8],
      quality: 0.6,
      base64: true,
    });
    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      setInspirationUri(asset.uri);
      setInspirationBase64(asset.base64 ?? null);
      setInspirationMimeType(asset.mimeType ?? 'image/jpeg');
    }
  };

  const handlePickOwnCover = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      setError('Photo library access is required to upload a cover image.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [5, 8],
      quality: 0.85,
      base64: true,
    });
    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      // Clear AI-generated image — uploaded cover takes over as the background
      setGeneratedBase64(null);
      setUploadedCoverBase64(asset.base64 ?? null);
      setUploadedCoverUri(asset.uri);
      setUploadedCoverMimeType(asset.mimeType ?? 'image/jpeg');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  };

  const clearUploadedCover = () => {
    setUploadedCoverBase64(null);
    setUploadedCoverUri(null);
    setUploadedCoverMimeType('image/jpeg');
  };

  const handleRestoreSavedCover = async () => {
    if (!savedUri) return;
    try {
      if (savedUri.startsWith('data:')) {
        const [header, b64] = savedUri.split(',');
        const mime = header.match(/data:([^;]+)/)?.[1] ?? 'image/png';
        setUploadedCoverBase64(b64 ?? null);
        setUploadedCoverUri(savedUri);
        setUploadedCoverMimeType(mime);
      } else {
        const b64 = await FileSystem.readAsStringAsync(savedUri, {
          encoding: FileSystem.EncodingType.Base64,
        });
        const ext = savedUri.split('.').pop()?.toLowerCase() ?? 'png';
        const mime =
          ext === 'jpg' || ext === 'jpeg' ? 'image/jpeg'
          : ext === 'webp' ? 'image/webp'
          : 'image/png';
        setUploadedCoverBase64(b64);
        setUploadedCoverUri(savedUri);
        setUploadedCoverMimeType(mime);
      }
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {
      setError('Could not load the saved cover. Try uploading it manually.');
    }
  };

  const handleGenerate = async () => {
    if (!description.trim()) {
      setError('Please describe what you want the cover to look like.');
      return;
    }
    setIsGenerating(true);
    setError(null);
    try {
      const body: Record<string, string> = {
        title: title.trim() || (book?.title ?? 'Untitled'),
        description: description.trim(),
      };
      if (authorName.trim()) body.authorName = authorName.trim();
      if (subtitle.trim()) body.subtitle = subtitle.trim();
      if (coverGenre.trim()) body.genre = coverGenre.trim();
      if (inspirationBase64) {
        body.inspirationImageBase64 = inspirationBase64;
        body.inspirationMimeType = inspirationMimeType;
      }

      if (languageName !== 'English') body.language = languageName;
      const token = await getToken();
      const resp = await fetch(`${API_BASE}/covers/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(body),
      });
      if (!resp.ok) {
        const data = await resp.json().catch(() => ({})) as { error?: string };
        throw new Error(data.error ?? `Server error ${resp.status}`);
      }
      const data = await resp.json() as { imageBase64: string };
      setGeneratedBase64(data.imageBase64);
      clearUploadedCover();
      setSavedUri(null);

      // Persist the raw background so reopening the designer doesn't double text.
      // On native: write to disk and store the file:// URI.
      // On web: store as a data URI directly.
      if (Platform.OS !== 'web' && bookId) {
        try {
          const rawDir = `${FileSystem.documentDirectory}books/${bookId}/`;
          await FileSystem.makeDirectoryAsync(rawDir, { intermediates: true });
          const rawPath = `${rawDir}cover-raw.png`;
          await FileSystem.writeAsStringAsync(rawPath, data.imageBase64, {
            encoding: FileSystem.EncodingType.Base64,
          });
          setRawBgUri(rawPath);
          updateBook(bookId, { coverRawImageUri: rawPath });
        } catch {
          // Non-fatal — raw bg still available via generatedBase64 this session.
        }
      } else if (Platform.OS === 'web' && bookId) {
        const dataUri = `data:image/png;base64,${data.imageBase64}`;
        setRawBgUri(dataUri);
        updateBook(bookId, { coverRawImageUri: dataUri });
      }

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (err) {
      const e = err as { message?: string };
      setError(e.message ?? 'Generation failed. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const addShape = (kind: ShapeKind) => {
    const id = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
    const isLine = kind === 'line';
    const isCircle = kind === 'circle';
    const isStar = kind === 'starburst' || kind === 'sparkle' || kind === 'rays';
    const w = isLine ? previewWidth * 0.55 : isCircle ? previewWidth * 0.28 : kind === 'diamond' || kind === 'triangle' ? previewWidth * 0.32 : isStar ? previewWidth * 0.45 : previewWidth * 0.42;
    const h = isLine ? 4 : kind === 'diamond' || kind === 'triangle' || isCircle || isStar ? w : previewHeight;
    const newShape: CoverShape = { id, kind, x: (previewWidth - w) / 2, y: (previewHeight - h) / 2, w, h, color: '#FFFFFF', opacity: 0.9, filled: isLine || isStar, strokeWidth: 2, rotation: 0, curveOffsets: { top: 0, right: 0, bottom: 0, left: 0 }, locked: false };
    setShapes(prev => [...prev, newShape]);
    setSelectedShapeId(id);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const deleteSelectedShape = () => {
    if (!selectedShapeId) return;
    setShapes(prev => prev.filter(s => s.id !== selectedShapeId));
    setSelectedShapeId(null);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
  };

  const updateShape = (id: string, updates: Partial<CoverShape>) => {
    setShapes(prev => prev.map(s => s.id === id ? { ...s, ...updates } : s));
  };

  const bringToFront = (id: string) => {
    setShapes(prev => {
      const idx = prev.findIndex(s => s.id === id);
      if (idx < 0 || idx === prev.length - 1) return prev;
      const next = [...prev];
      const [item] = next.splice(idx, 1);
      next.push(item);
      return next;
    });
  };

  const sendToBack = (id: string) => {
    setShapes(prev => {
      const idx = prev.findIndex(s => s.id === id);
      if (idx <= 0) return prev;
      const next = [...prev];
      const [item] = next.splice(idx, 1);
      next.unshift(item);
      return next;
    });
  };

  const moveShapeUp = (id: string) => {
    setShapes(prev => {
      const idx = prev.findIndex(s => s.id === id);
      if (idx < 0 || idx === prev.length - 1) return prev;
      const next = [...prev];
      [next[idx], next[idx + 1]] = [next[idx + 1], next[idx]];
      return next;
    });
  };

  const moveShapeDown = (id: string) => {
    setShapes(prev => {
      const idx = prev.findIndex(s => s.id === id);
      if (idx <= 0) return prev;
      const next = [...prev];
      [next[idx], next[idx - 1]] = [next[idx - 1], next[idx]];
      return next;
    });
  };

  const handlePickFont = (id: string) => {
    if (!bookId) return;
    updateBook(bookId, fontTarget === 'title' ? { coverTitleFontId: id } : { previewFontId: id });
    setFontPickerVisible(false);
  };


  const coverDestUri = (): string => {
    if (Platform.OS === 'web') return '';
    const dir = `${FileSystem.documentDirectory}books/${bookId ?? 'unknown'}/`;
    return `${dir}cover.png`;
  };

  const handleSave = async () => {
    setIsSaving(true);
    setError(null);
    try {
      if (Platform.OS === 'web') {
        // On web, ViewShot.capture() uses findNodeHandle which isn't supported.
        // Use html2canvas to render the cover canvas DOM element instead.
        const html2canvasMod = await import('html2canvas');
        const html2canvas = html2canvasMod.default;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const el = (global as any).document?.getElementById('cover-canvas') as HTMLElement | null;
        if (!el) throw new Error('Cover canvas not found');
        const canvas = await html2canvas(el, {
          useCORS: true,
          allowTaint: true,
          scale: 2,
          width: el.offsetWidth,
          height: el.offsetHeight,
          logging: false,
        });
        const capturedUri = canvas.toDataURL('image/png', 1.0);
        setSavedUri(capturedUri);
        if (bookId) {
          updateBook(bookId, {
            coverImageUri: capturedUri,
            coverImageBase64: undefined,
            coverAuthorName: authorName.trim() || undefined,
            coverSubtitle: subtitle.trim() || undefined,
            coverTitleFontId: titleFontId,
          });
        }
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        return;
      }

      if (!viewShotRef.current) return;
      const capturedUri = await viewShotRef.current.capture();
      if (!capturedUri) throw new Error('Capture failed');

      const dir = `${FileSystem.documentDirectory}books/${bookId ?? 'unknown'}/`;
      await FileSystem.makeDirectoryAsync(dir, { intermediates: true });
      const destUri = `${dir}cover.png`;
      await FileSystem.deleteAsync(destUri, { idempotent: true });
      await FileSystem.copyAsync({ from: capturedUri, to: destUri });
      setSavedUri(destUri);
      if (bookId) {
        updateBook(bookId, {
          coverImageUri: destUri,
          coverImageBase64: undefined,
          coverAuthorName: authorName.trim() || undefined,
          coverSubtitle: subtitle.trim() || undefined,
          coverTitleFontId: titleFontId,
        });
      }
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (err) {
      const e = err as { message?: string };
      setError(e.message ?? 'Save failed. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleShare = async () => {
    const uriToShare = savedUri ?? coverDestUri();
    if (!uriToShare) return;
    try {
      await Sharing.shareAsync(uriToShare, {
        mimeType: 'image/png',
        dialogTitle: `Share "${title}" Cover`,
        UTI: 'public.png',
      });
    } catch (err) {
      const e = err as { message?: string };
      setError(e.message ?? 'Share failed. Please try again.');
    }
  };

  const bottomPadding = (Platform.OS === 'web' ? 34 : insets.bottom) + 32;

  if (!book) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <TouchableOpacity
          style={[styles.closeBtn, { backgroundColor: colors.secondary }]}
          onPress={() => router.back()}
        >
          <Feather name="x" size={18} color={colors.mutedForeground} />
        </TouchableOpacity>
        <Text style={[styles.notFound, { color: colors.mutedForeground }]}>{t('coverGenerator.bookNotFound')}</Text>
      </View>
    );
  }

  // Always use the raw background (no text) as the image layer.
  // Never show the saved composite here — it already has text burned in,
  // which would double on top of the live overlay.
  const previewImageUri = generatedBase64
    ? `data:image/png;base64,${generatedBase64}`
    : uploadedCoverBase64
    ? `data:${uploadedCoverMimeType};base64,${uploadedCoverBase64}`
    : rawBgUri;
  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: bottomPadding }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        scrollEnabled={!isDraggingShape}
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
            <Text style={[styles.screenTitle, { color: colors.foreground }]}>
              {t('coverGenerator.coverStudio')}
            </Text>
            <Text style={[styles.screenSubtitle, { color: colors.mutedForeground }]}>
              {t('coverGenerator.coverStudioSub')}
            </Text>
          </View>
        </View>

        {/* Canvas format picker — 3 sizes */}
        <View style={styles.formatRow}>
          {COVER_FORMATS.map((fmt) => {
            const active = selectedFormat === fmt.key;
            return (
              <TouchableOpacity
                key={fmt.key}
                style={[
                  styles.formatChip,
                  {
                    backgroundColor: active ? colors.primary : colors.secondary,
                    borderColor: active ? colors.primary : colors.border,
                    borderWidth: active ? 2 : 1,
                  },
                ]}
                onPress={() => setSelectedFormat(fmt.key)}
                activeOpacity={0.75}
              >
                <Text style={styles.formatIcon}>{fmt.icon}</Text>
                <View>
                  <Text style={[styles.formatLabel, { color: active ? colors.primaryForeground : colors.foreground }]}>
                    {fmt.label}
                  </Text>
                  <Text style={[styles.formatSub, { color: active ? colors.primaryForeground + 'CC' : colors.mutedForeground }]}>
                    {fmt.sub}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Cover Preview (ViewShot captures this) */}
        <View style={styles.previewContainer}>
          <View
            nativeID="cover-canvas"
            style={[
              styles.coverPreview,
              { width: previewWidth, height: previewHeight, backgroundColor: '#fff', overflow: 'hidden' },
            ]}
          >
          <ViewShot
            ref={viewShotRef}
            options={{ format: 'png', quality: 1.0, result: 'tmpfile' }}
            style={StyleSheet.absoluteFill}
          >
            {previewImageUri ? <Image source={{ uri: previewImageUri }} style={StyleSheet.absoluteFill} resizeMode="contain" /> : null}

            {/* Canvas measurement anchor — used to compute page offsets for rotation math */}
            <View
              ref={canvasRef}
              style={StyleSheet.absoluteFill}
              pointerEvents="none"
              onLayout={() => {
                canvasRef.current?.measure((_fx, _fy, _w, _h, px, py) => {
                  canvasPageOffset.current = { x: px, y: py };
                });
              }}
            />

            {/* Guide lines — pointer events none so they never intercept drag */}
            <View style={StyleSheet.absoluteFill} pointerEvents="none">
              {/* Center snap guides */}
              <View style={[styles.previewGuideVertical,   snapV && styles.previewGuideActive]} />
              <View style={[styles.previewGuideHorizontal, snapH && styles.previewGuideActive]} />
              {/* Rule of thirds — always faint */}
              <View style={styles.previewGuideThirdTop} />
              <View style={styles.previewGuideThirdBottom} />
              {/* Golden ratio H lines — shown faintly always, amber when snapping */}
              <View style={[styles.previewGoldenH, { top: GOLDEN_H1_ABS }, snapGoldenH1 && styles.previewGoldenActive]} />
              <View style={[styles.previewGoldenH, { top: GOLDEN_H2_ABS }, snapGoldenH2 && styles.previewGoldenActive]} />
              {/* Golden ratio V lines — shown faintly always, amber when snapping */}
              <View style={[styles.previewGoldenV, { left: GOLDEN_V1_ABS }, (snapGoldenV1 || snapGoldenV2) && styles.previewGoldenActive]} />
              <View style={[styles.previewGoldenV, { left: GOLDEN_V2_ABS }, (snapGoldenV1 || snapGoldenV2) && styles.previewGoldenActive]} />
              {/* φ power-point dots at each golden ratio intersection */}
              {(activeDragEl !== null) && (<>
                <View style={[styles.phiDot, { top: GOLDEN_H1_ABS - 3, left: GOLDEN_V1_ABS - 3 }]} />
                <View style={[styles.phiDot, { top: GOLDEN_H1_ABS - 3, left: GOLDEN_V2_ABS - 3 }]} />
                <View style={[styles.phiDot, { top: GOLDEN_H2_ABS - 3, left: GOLDEN_V1_ABS - 3 }]} />
                <View style={[styles.phiDot, { top: GOLDEN_H2_ABS - 3, left: GOLDEN_V2_ABS - 3 }]} />
              </>)}
              {/* Cross-element alignment guide — orange when two elements share Y */}
              {alignGuideY !== null && (
                <View style={[styles.previewAlignGuide, { top: alignGuideY }]} />
              )}
            </View>

            {/* Shape layer — draggable SVG shapes */}
            {shapes.map(shape => {
              const isSelected = shape.id === selectedShapeId;
              const fill = shape.filled ? shape.color : 'none';
              const stroke = !shape.filled ? shape.color : 'none';
              const sw = shape.strokeWidth;
              let svgShape: React.ReactNode = null;
              if (shape.kind === 'rect') {
                const co = shape.curveOffsets ?? { top: 0, right: 0, bottom: 0, left: 0 };
                const hasCurve = co.top !== 0 || co.right !== 0 || co.bottom !== 0 || co.left !== 0;
                if (hasCurve) {
                  const d = `M 0,0 Q ${shape.w / 2},${-co.top} ${shape.w},0 Q ${shape.w + co.right},${shape.h / 2} ${shape.w},${shape.h} Q ${shape.w / 2},${shape.h + co.bottom} 0,${shape.h} Q ${-co.left},${shape.h / 2} 0,0 Z`;
                  svgShape = <SvgPath d={d} fill={fill} stroke={stroke} strokeWidth={sw} />;
                } else {
                  svgShape = <SvgRect x={0} y={0} width={shape.w} height={shape.h} fill={fill} stroke={stroke} strokeWidth={sw} rx={4} />;
                }
              }
              else if (shape.kind === 'circle') svgShape = <SvgEllipse cx={shape.w / 2} cy={shape.h / 2} rx={shape.w / 2} ry={shape.h / 2} fill={fill} stroke={stroke} strokeWidth={sw} />;
              else if (shape.kind === 'line') svgShape = <SvgRect x={0} y={0} width={shape.w} height={shape.h} fill={shape.color} rx={shape.h / 2} />;
              else if (shape.kind === 'diamond') { const pts = `${shape.w / 2},0 ${shape.w},${shape.h / 2} ${shape.w / 2},${shape.h} 0,${shape.h / 2}`; svgShape = <SvgPolygon points={pts} fill={fill} stroke={stroke} strokeWidth={sw} />; }
              else if (shape.kind === 'triangle') { const pts = `${shape.w / 2},0 ${shape.w},${shape.h} 0,${shape.h}`; svgShape = <SvgPolygon points={pts} fill={fill} stroke={stroke} strokeWidth={sw} />; }
              else if (shape.kind === 'starburst') { const r = Math.min(shape.w, shape.h) / 2; svgShape = <SvgPath d={starPath(shape.w, shape.h, r * 0.96, r * 0.50, 16)} fill={fill} stroke={stroke} strokeWidth={sw} />; }
              else if (shape.kind === 'sparkle') { const r = Math.min(shape.w, shape.h) / 2; svgShape = <SvgPath d={starPath(shape.w, shape.h, r * 0.96, r * 0.12, 4)} fill={fill} stroke={stroke} strokeWidth={sw} />; }
              else if (shape.kind === 'rays') { const r = Math.min(shape.w, shape.h) / 2; svgShape = <SvgPath d={starPath(shape.w, shape.h, r * 0.98, r * 0.60, 24)} fill={fill} stroke={stroke} strokeWidth={sw} />; }
              return (
                <View
                  key={shape.id}
                  onStartShouldSetResponder={() => { if (shape.locked) { setSelectedShapeId(shape.id); return false; } return true; }}
                  onMoveShouldSetResponder={() => !shape.locked}
                  onResponderGrant={e => {
                    snapStart(shapes);
                    setSelectedShapeId(shape.id);
                    setIsDraggingShape(true);
                    shapeDragRef.current = { pageX: e.nativeEvent.pageX, pageY: e.nativeEvent.pageY, sx: shape.x, sy: shape.y, id: shape.id };
                  }}
                  onResponderMove={e => {
                    const dr = shapeDragRef.current;
                    if (!dr || dr.id !== shape.id) return;
                    const minVisible = 10;
                    const nx = Math.max(-(shape.w - minVisible), Math.min(previewWidth - minVisible, dr.sx + e.nativeEvent.pageX - dr.pageX));
                    const ny = Math.max(-(shape.h - minVisible), Math.min(previewHeight - minVisible, dr.sy + e.nativeEvent.pageY - dr.pageY));
                    setShapes(prev => prev.map(s => s.id === shape.id ? { ...s, x: nx, y: ny } : s));
                  }}
                  onResponderRelease={() => { shapeDragRef.current = null; snapCommit(); setIsDraggingShape(false); }}
                  onResponderTerminate={() => { shapeDragRef.current = null; snapCommit(); setIsDraggingShape(false); }}
                  style={[
                    { position: 'absolute', left: shape.x, top: shape.y, width: shape.w, height: shape.h, opacity: shape.opacity, transform: [{ rotate: `${shape.rotation}deg` }] },
                    isSelected && { borderWidth: 1.5, borderColor: shape.locked ? '#F59E0B' : '#3B82F6', borderStyle: 'dashed' },
                  ]}
                >
                  <Svg width={shape.w} height={shape.h}>{svgShape}</Svg>
                  {shape.locked && (
                    <View style={{ position: 'absolute', top: 4, right: 4 }}>
                      <Feather name="lock" size={12} color="#F59E0B" />
                    </View>
                  )}
                </View>
              );
            })}

            {/* Shape handles — corner resize (solid blue), edge curve (outlined blue), rotation — all canvas siblings */}
            {(() => {
              const sel = shapes.find(s => s.id === selectedShapeId);
              if (!sel || sel.locked) return null;
              const cx = sel.x + sel.w / 2;
              const cy = sel.y + sel.h / 2;
              const co = sel.curveOffsets ?? { top: 0, right: 0, bottom: 0, left: 0 };
              const rp = (px: number, py: number) => rotatePt(px, py, cx, cy, sel.rotation);

              // 4 corner positions in canvas space
              const cornerDefs: { key: string; pt: { x: number; y: number } }[] = [
                { key: 'tl', pt: rp(sel.x, sel.y) },
                { key: 'tr', pt: rp(sel.x + sel.w, sel.y) },
                { key: 'bl', pt: rp(sel.x, sel.y + sel.h) },
                { key: 'br', pt: rp(sel.x + sel.w, sel.y + sel.h) },
              ];

              // 4 edge curve handle positions (bezier control points, rect only)
              const curveDefs: { key: 'top' | 'right' | 'bottom' | 'left'; pt: { x: number; y: number } }[] = sel.kind === 'rect' ? [
                { key: 'top',    pt: rp(sel.x + sel.w / 2,        sel.y - co.top) },
                { key: 'right',  pt: rp(sel.x + sel.w + co.right, sel.y + sel.h / 2) },
                { key: 'bottom', pt: rp(sel.x + sel.w / 2,        sel.y + sel.h + co.bottom) },
                { key: 'left',   pt: rp(sel.x - co.left,          sel.y + sel.h / 2) },
              ] : [];

              // Rotation handle
              const rotDist = Math.max(sel.h / 2 + 24, 32);
              const rotRad = (sel.rotation * Math.PI) / 180;
              const rotPt = { x: cx + rotDist * Math.sin(rotRad) - 14, y: cy - rotDist * Math.cos(rotRad) - 14 };

              return (
                <>
                  {/* Corner resize handles */}
                  {cornerDefs.map(({ key, pt }) => (
                    <View
                      key={`corner-${key}-${sel.id}`}
                      style={{
                        position: 'absolute', left: pt.x - 9, top: pt.y - 9,
                        width: 18, height: 18, borderRadius: 9,
                        backgroundColor: '#3B82F6', borderWidth: 2, borderColor: '#fff',
                        shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 3, elevation: 4,
                      }}
                      onStartShouldSetResponder={() => true}
                      onMoveShouldSetResponder={() => true}
                      onResponderGrant={() => {
                        snapStart(shapes);
                        shapeResizeRef.current = { id: sel.id, cx, cy };
                        setIsDraggingShape(true);
                      }}
                      onResponderMove={e => {
                        const rr = shapeResizeRef.current;
                        if (!rr || rr.id !== sel.id) return;
                        const tx = e.nativeEvent.pageX - canvasPageOffset.current.x;
                        const ty = e.nativeEvent.pageY - canvasPageOffset.current.y;
                        const local = rotatePt(tx, ty, rr.cx, rr.cy, -sel.rotation);
                        const newW = Math.max(20, Math.abs(local.x - rr.cx) * 2);
                        const newH = Math.max(20, Math.abs(local.y - rr.cy) * 2);
                        setShapes(prev => prev.map(s => s.id === sel.id
                          ? { ...s, w: newW, h: newH, x: rr.cx - newW / 2, y: rr.cy - newH / 2 }
                          : s));
                      }}
                      onResponderRelease={() => { shapeResizeRef.current = null; snapCommit(); setIsDraggingShape(false); }}
                      onResponderTerminate={() => { shapeResizeRef.current = null; snapCommit(); setIsDraggingShape(false); }}
                    />
                  ))}

                  {/* Edge curve handles (rect only) — drag to bow edges into bezier curves */}
                  {curveDefs.map(({ key, pt }) => (
                    <View
                      key={`curve-${key}-${sel.id}`}
                      style={{
                        position: 'absolute', left: pt.x - 7, top: pt.y - 7,
                        width: 14, height: 14, borderRadius: 7,
                        backgroundColor: '#fff', borderWidth: 2, borderColor: '#3B82F6',
                        shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 2, elevation: 3,
                      }}
                      onStartShouldSetResponder={() => true}
                      onMoveShouldSetResponder={() => true}
                      onResponderGrant={() => {
                        snapStart(shapes);
                        shapeCurveRef.current = { id: sel.id, edge: key };
                        setIsDraggingShape(true);
                      }}
                      onResponderMove={e => {
                        const rr = shapeCurveRef.current;
                        if (!rr || rr.id !== sel.id) return;
                        const tx = e.nativeEvent.pageX - canvasPageOffset.current.x;
                        const ty = e.nativeEvent.pageY - canvasPageOffset.current.y;
                        const local = rotatePt(tx, ty, cx, cy, -sel.rotation);
                        const maxC = Math.max(sel.w, sel.h) * 0.65;
                        setShapes(prev => prev.map(s => {
                          if (s.id !== sel.id) return s;
                          const cur = s.curveOffsets ?? { top: 0, right: 0, bottom: 0, left: 0 };
                          const clamp = (v: number) => Math.max(-maxC, Math.min(maxC, v));
                          const next = { ...cur };
                          if (rr.edge === 'top')    next.top    = clamp(s.y - local.y);
                          if (rr.edge === 'right')  next.right  = clamp(local.x - (s.x + s.w));
                          if (rr.edge === 'bottom') next.bottom = clamp(local.y - (s.y + s.h));
                          if (rr.edge === 'left')   next.left   = clamp(s.x - local.x);
                          return { ...s, curveOffsets: next };
                        }));
                      }}
                      onResponderRelease={() => { shapeCurveRef.current = null; snapCommit(); setIsDraggingShape(false); }}
                      onResponderTerminate={() => { shapeCurveRef.current = null; snapCommit(); setIsDraggingShape(false); }}
                    />
                  ))}

                  {/* Rotation handle */}
                  <View
                    key={`rot-handle-${sel.id}`}
                    style={{
                      position: 'absolute', left: rotPt.x, top: rotPt.y,
                      width: 28, height: 28, borderRadius: 14,
                      backgroundColor: '#3B82F6', alignItems: 'center', justifyContent: 'center',
                      shadowColor: '#000', shadowOpacity: 0.3, shadowRadius: 4,
                      shadowOffset: { width: 0, height: 2 }, elevation: 5,
                    }}
                    onStartShouldSetResponder={() => true}
                    onMoveShouldSetResponder={() => true}
                    onResponderGrant={e => {
                      snapStart(shapes);
                      const pcx = canvasPageOffset.current.x + cx;
                      const pcy = canvasPageOffset.current.y + cy;
                      const startAngle = Math.atan2(e.nativeEvent.pageY - pcy, e.nativeEvent.pageX - pcx) * 180 / Math.PI;
                      shapeRotateRef.current = { cx: pcx, cy: pcy, id: sel.id, startAngle, startRotation: sel.rotation };
                      setIsDraggingShape(true);
                    }}
                    onResponderMove={e => {
                      const rr = shapeRotateRef.current;
                      if (!rr || rr.id !== sel.id) return;
                      const angle = Math.atan2(e.nativeEvent.pageY - rr.cy, e.nativeEvent.pageX - rr.cx) * 180 / Math.PI;
                      const newRotation = ((rr.startRotation + angle - rr.startAngle) % 360 + 360) % 360;
                      setShapes(prev => prev.map(s => s.id === sel.id ? { ...s, rotation: newRotation } : s));
                    }}
                    onResponderRelease={() => { shapeRotateRef.current = null; snapCommit(); setIsDraggingShape(false); }}
                    onResponderTerminate={() => { shapeRotateRef.current = null; snapCommit(); setIsDraggingShape(false); }}
                  >
                    <Text style={{ color: '#fff', fontSize: 16, lineHeight: 18 }}>↻</Text>
                  </View>
                </>
              );
            })()}

            {/* Zero-point composition guide — center crosshair, visible during any drag */}
            {activeDragEl !== null && (
              <View style={StyleSheet.absoluteFill} pointerEvents="none">
                <View style={styles.zeroH} />
                <View style={styles.zeroV} />
                <View style={styles.zeroDot} />
              </View>
            )}

            {/* Title — only rendered when the user has typed something */}
            {title.trim() ? (
              <View
                style={[styles.textEl, styles.textElTitle, { transform: [{ translateX: titlePosition.x }, { translateY: titlePosition.y }] }]}
                {...titlePanResponder.panHandlers}
              >
                <Text
                  style={[styles.previewTitle, { color: titleColor, fontFamily: titleFont.family, fontSize: titleSize, lineHeight: titleSize * 1.2 }, getEffectStyle(titleEffect)]}
                  numberOfLines={3}
                >
                  {title.trim()}
                </Text>
              </View>
            ) : null}

            {/* Subtitle — independently draggable + pinchable */}
            {subtitle.trim() ? (
              <View
                style={[styles.textEl, styles.textElSubtitle, { transform: [{ translateX: subtitlePosition.x }, { translateY: subtitlePosition.y }] }]}
                {...subtitlePanResponder.panHandlers}
              >
                <Text
                  style={[styles.previewSubtitle, { color: subtitleColor, fontFamily: subtitleFont.family, fontSize: subtitleSize, lineHeight: subtitleSize * 1.3 }, getEffectStyle(subtitleEffect)]}
                  numberOfLines={2}
                >
                  {subtitle.trim()}
                </Text>
              </View>
            ) : null}

            {/* Author — independently draggable + pinchable */}
            {authorName.trim() ? (
              <View
                style={[styles.textEl, styles.textElAuthor, { transform: [{ translateX: authorPosition.x }, { translateY: authorPosition.y }] }]}
                {...authorPanResponder.panHandlers}
              >
                <Text
                  style={[styles.previewAuthor, { color: authorColor, fontFamily: subtitleFont.family, fontSize: authorSize, lineHeight: authorSize * 1.3 }, getEffectStyle(authorEffect)]}
                  numberOfLines={1}
                >
                  {authorName.trim()}
                </Text>
              </View>
            ) : null}
          </ViewShot>
          </View>

        </View>

        {/* Restore saved cover — shown when canvas is empty but a saved cover exists */}
        {savedUri && !previewImageUri && (
          <TouchableOpacity
            style={[styles.restoreBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
            onPress={handleRestoreSavedCover}
            activeOpacity={0.8}
          >
            <Image source={{ uri: savedUri }} style={styles.restoreThumb} resizeMode="cover" />
            <View style={{ flex: 1 }}>
              <Text style={[styles.restoreTitle, { color: colors.foreground }]}>{t('coverGenerator.restoreSavedCover')}</Text>
              <Text style={[styles.restoreSub, { color: colors.mutedForeground }]}>
                {t('coverGenerator.restoreSavedCoverSub')}
              </Text>
            </View>
            <Feather name="rotate-ccw" size={16} color={colors.primary} />
          </TouchableOpacity>
        )}

        {/* ── SHAPES BAR ── */}
        <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>{t('coverGenerator.shapes')}</Text>
        <View style={[styles.shapesBar, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.shapeBtnRow}>
            {([
              { kind: 'rect' as ShapeKind, label: 'Rect', icon: '▬' },
              { kind: 'circle' as ShapeKind, label: 'Circle', icon: '◯' },
              { kind: 'line' as ShapeKind, label: 'Line', icon: '━' },
              { kind: 'diamond' as ShapeKind, label: 'Diamond', icon: '◇' },
              { kind: 'triangle' as ShapeKind, label: 'Triangle', icon: '△' },
              { kind: 'starburst' as ShapeKind, label: 'Burst', icon: '✦' },
              { kind: 'sparkle' as ShapeKind, label: 'Sparkle', icon: '✧' },
              { kind: 'rays' as ShapeKind, label: 'Rays', icon: '☀' },
            ]).map(({ kind, label, icon }) => (
              <TouchableOpacity
                key={kind}
                onPress={() => addShape(kind)}
                activeOpacity={0.8}
                style={[styles.shapeBtn, { borderColor: colors.border, backgroundColor: colors.background }]}
              >
                <Text style={[styles.shapeBtnIcon, { color: colors.foreground }]}>{icon}</Text>
                <Text style={[styles.shapeBtnLabel, { color: colors.mutedForeground }]}>{label}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
          <TouchableOpacity
            onPress={undoShapes}
            disabled={shapesHistoryLen === 0}
            style={[styles.undoBtn, { borderColor: colors.border, backgroundColor: colors.background, opacity: shapesHistoryLen === 0 ? 0.3 : 1 }]}
          >
            <Feather name="rotate-ccw" size={18} color={colors.foreground} />
            <Text style={[styles.shapeBtnLabel, { color: colors.mutedForeground }]}>{t('coverGenerator.undo')}</Text>
          </TouchableOpacity>
        </View>

        {/* Shape controls — visible when a shape is selected */}
        {selectedShapeId && (() => {
          const sel = shapes.find(s => s.id === selectedShapeId);
          if (!sel) return null;
          return (
            <View style={[styles.shapeControls, { backgroundColor: colors.card, borderColor: colors.border }]}>
              {/* Color */}
              <View style={styles.inlineRow}>
                <Text style={[styles.fontCardLabel, { color: colors.mutedForeground }]}>{t('coverGenerator.shapeColor')}</Text>
                <View style={[styles.sliderTrack, { flex: 1 }]}>
                  {FONT_COLOR_STOPS.map(c => (
                    <TouchableOpacity key={`sc-${sel.id}-${c}`} onPress={() => updateShape(sel.id, { color: c })}
                      style={[styles.sliderStep, { backgroundColor: c, borderColor: sel.color === c ? colors.primary : 'transparent', flex: 1 / FONT_COLOR_STOPS.length }]} />
                  ))}
                </View>
              </View>
              {/* Fill / Stroke */}
              <View style={[styles.inlineRow, { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border }]}>
                <Text style={[styles.fontCardLabel, { color: colors.mutedForeground }]}>{t('coverGenerator.shapeStyle')}</Text>
                <View style={styles.effectChips}>
                  {(['Fill', 'Stroke'] as const).map(mode => {
                    const active = mode === 'Fill' ? sel.filled : !sel.filled;
                    return (
                      <TouchableOpacity key={mode} onPress={() => updateShape(sel.id, { filled: mode === 'Fill' })}
                        style={[styles.effectChip, { borderColor: active ? colors.primary : colors.border, backgroundColor: active ? colors.primary + '18' : 'transparent' }]}>
                        <Text style={[styles.effectChipText, { color: active ? colors.primary : colors.mutedForeground }]}>{mode}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
              {/* Opacity */}
              <View style={[styles.inlineRow, { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border }]}>
                <Text style={[styles.fontCardLabel, { color: colors.mutedForeground }]}>{t('coverGenerator.shapeOpacity')}</Text>
                <View style={styles.sizeControl}>
                  <TouchableOpacity onPress={() => updateShape(sel.id, { opacity: Math.max(0.1, Math.round((sel.opacity - 0.1) * 10) / 10) })} style={[styles.sizeBtn, { borderColor: colors.border }]}>
                    <Text style={[styles.sizeBtnText, { color: colors.foreground }]}>−</Text>
                  </TouchableOpacity>
                  <Text style={[styles.sizeValue, { color: colors.foreground }]}>{Math.round(sel.opacity * 100)}%</Text>
                  <TouchableOpacity onPress={() => updateShape(sel.id, { opacity: Math.min(1, Math.round((sel.opacity + 0.1) * 10) / 10) })} style={[styles.sizeBtn, { borderColor: colors.border }]}>
                    <Text style={[styles.sizeBtnText, { color: colors.foreground }]}>+</Text>
                  </TouchableOpacity>
                </View>
              </View>
              {/* Width */}
              <View style={[styles.inlineRow, { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border }]}>
                <Text style={[styles.fontCardLabel, { color: colors.mutedForeground }]}>{t('coverGenerator.shapeWidth')}</Text>
                <View style={[styles.sizeControl, { gap: 4 }]}>
                  <TouchableOpacity onPress={() => updateShape(sel.id, { w: Math.max(12, sel.w - 10) })} style={[styles.sizeBtn, { borderColor: colors.border }]}>
                    <Text style={[styles.sizeBtnText, { color: colors.foreground }]}>−</Text>
                  </TouchableOpacity>
                  <Text style={[styles.sizeValue, { color: colors.foreground }]}>{Math.round(sel.w)}</Text>
                  <TouchableOpacity onPress={() => updateShape(sel.id, { w: Math.min(previewWidth, sel.w + 10) })} style={[styles.sizeBtn, { borderColor: colors.border }]}>
                    <Text style={[styles.sizeBtnText, { color: colors.foreground }]}>+</Text>
                  </TouchableOpacity>
                </View>
              </View>
              {/* Height */}
              <View style={[styles.inlineRow, { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border }]}>
                <Text style={[styles.fontCardLabel, { color: colors.mutedForeground }]}>{t('coverGenerator.shapeHeight')}</Text>
                <View style={[styles.sizeControl, { gap: 4 }]}>
                  <TouchableOpacity onPress={() => updateShape(sel.id, { h: Math.max(sel.kind === 'line' ? 2 : 12, sel.h - 10) })} style={[styles.sizeBtn, { borderColor: colors.border }]}>
                    <Text style={[styles.sizeBtnText, { color: colors.foreground }]}>−</Text>
                  </TouchableOpacity>
                  <Text style={[styles.sizeValue, { color: colors.foreground }]}>{Math.round(sel.h)}</Text>
                  <TouchableOpacity onPress={() => updateShape(sel.id, { h: Math.min(previewHeight, sel.h + 10) })} style={[styles.sizeBtn, { borderColor: colors.border }]}>
                    <Text style={[styles.sizeBtnText, { color: colors.foreground }]}>+</Text>
                  </TouchableOpacity>
                </View>
              </View>
              {/* Full Cover shortcut */}
              <View style={[styles.inlineRow, { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border }]}>
                <Text style={[styles.fontCardLabel, { color: colors.mutedForeground }]}>{t('coverGenerator.shapePreset')}</Text>
                <TouchableOpacity
                  onPress={() => updateShape(sel.id, { w: previewWidth, h: previewHeight, x: 0, y: 0 })}
                  style={[styles.fullCoverBtn, { borderColor: colors.border, backgroundColor: colors.secondary }]}
                >
                  <Text style={[styles.fillChipText, { color: colors.foreground }]}>{t('coverGenerator.shapeFullCover')}</Text>
                </TouchableOpacity>
              </View>
              {/* Rotation */}
              <View style={[styles.inlineRow, { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border }]}>
                <Text style={[styles.fontCardLabel, { color: colors.mutedForeground }]}>{t('coverGenerator.shapeRotate')}</Text>
                <View style={styles.sizeControl}>
                  <TouchableOpacity
                    onPress={() => updateShape(sel.id, { rotation: (sel.rotation - 15 + 360) % 360 })}
                    style={[styles.sizeBtn, { borderColor: colors.border }]}
                  >
                    <Text style={[styles.sizeBtnText, { color: colors.foreground }]}>↺</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => updateShape(sel.id, { rotation: 0 })}
                    style={[styles.rotateResetBtn, { borderColor: colors.border }]}
                  >
                    <Text style={[styles.rotateResetText, { color: colors.mutedForeground }]}>{sel.rotation}°</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => updateShape(sel.id, { rotation: (sel.rotation + 15) % 360 })}
                    style={[styles.sizeBtn, { borderColor: colors.border }]}
                  >
                    <Text style={[styles.sizeBtnText, { color: colors.foreground }]}>↻</Text>
                  </TouchableOpacity>
                </View>
              </View>
              {/* Layer ordering */}
              {(() => {
                const idx = shapes.findIndex(s => s.id === sel.id);
                const isTop = idx === shapes.length - 1;
                const isBottom = idx === 0;
                return (
                  <View style={[styles.inlineRow, { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border }]}>
                    <Text style={[styles.fontCardLabel, { color: colors.mutedForeground }]}>{t('coverGenerator.shapeLayer')}</Text>
                    <View style={styles.effectChips}>
                      <TouchableOpacity
                        onPress={() => sendToBack(sel.id)}
                        disabled={isBottom}
                        style={[styles.effectChip, { borderColor: colors.border, opacity: isBottom ? 0.3 : 1 }]}
                      >
                        <Text style={[styles.effectChipText, { color: colors.mutedForeground }]}>{t('coverGenerator.shapeLayerBack')}</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={() => moveShapeDown(sel.id)}
                        disabled={isBottom}
                        style={[styles.effectChip, { borderColor: colors.border, opacity: isBottom ? 0.3 : 1 }]}
                      >
                        <Text style={[styles.effectChipText, { color: colors.mutedForeground }]}>↓</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={() => moveShapeUp(sel.id)}
                        disabled={isTop}
                        style={[styles.effectChip, { borderColor: colors.border, opacity: isTop ? 0.3 : 1 }]}
                      >
                        <Text style={[styles.effectChipText, { color: colors.mutedForeground }]}>↑</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={() => bringToFront(sel.id)}
                        disabled={isTop}
                        style={[styles.effectChip, { borderColor: colors.border, opacity: isTop ? 0.3 : 1 }]}
                      >
                        <Text style={[styles.effectChipText, { color: colors.mutedForeground }]}>{t('coverGenerator.shapeLayerFront')}</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                );
              })()}

              {/* Lock / Unlock */}
              <TouchableOpacity
                onPress={() => updateShape(sel.id, { locked: !sel.locked })}
                style={[styles.inlineRow, { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border, paddingHorizontal: 16, paddingVertical: 10 }]}
              >
                <Feather name={sel.locked ? 'lock' : 'unlock'} size={14} color={sel.locked ? '#F59E0B' : colors.mutedForeground} />
                <Text style={[styles.fontCardLabel, { color: sel.locked ? '#F59E0B' : colors.mutedForeground, marginLeft: 8 }]}>
                  {sel.locked ? t('coverGenerator.locked') : t('coverGenerator.unlocked')}
                </Text>
              </TouchableOpacity>
              {/* Delete */}
              <TouchableOpacity onPress={deleteSelectedShape}
                style={[styles.shapeDeleteBtn, { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border }]}>
                <Feather name="trash-2" size={14} color="#DC2626" />
                <Text style={styles.shapeDeleteText}>{t('coverGenerator.removeShape')}</Text>
              </TouchableOpacity>
            </View>
          );
        })()}

        {/* Cover Text */}
        <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>
          {t('coverGenerator.coverText')}
        </Text>
        <View style={[styles.fieldCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={[styles.fieldRow, { borderBottomColor: colors.border }]}>
            <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>{t('coverGenerator.titleField')}</Text>
            <TextInput
              style={[styles.fieldInput, { color: colors.foreground }]}
              value={title}
              onChangeText={setTitle}
              placeholder={book.title}
              placeholderTextColor={colors.mutedForeground}
              returnKeyType="next"
            />
          </View>
          <View style={[styles.fieldRow, { borderBottomColor: colors.border }]}>
            <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>{t('coverGenerator.authorField')}</Text>
            <TextInput
              style={[styles.fieldInput, { color: colors.foreground }]}
              value={authorName}
              onChangeText={setAuthorName}
              placeholder={t('coverGenerator.authorPlaceholder')}
              placeholderTextColor={colors.mutedForeground}
              returnKeyType="next"
            />
          </View>
          <View style={styles.fieldRow}>
            <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>{t('coverGenerator.subtitleField')}</Text>
            <TextInput
              style={[styles.fieldInput, { color: colors.foreground }]}
              value={subtitle}
              onChangeText={setSubtitle}
              placeholder={t('coverGenerator.optionalPlaceholder')}
              placeholderTextColor={colors.mutedForeground}
              returnKeyType="done"
            />
          </View>
        </View>

        {/* ── TITLE STYLE ── */}
        <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>{t('coverGenerator.titleStyle')}</Text>
        <View style={[styles.colorCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.inlineRow}>
            <Text style={[styles.fontCardLabel, { color: colors.mutedForeground }]}>{t('coverGenerator.sizeLabel')}</Text>
            <View style={styles.sizeControl}>
              <TouchableOpacity onPress={() => { const v = Math.max(10, titleSizeRef.current - 2); titleSizeRef.current = v; setTitleSize(v); }} style={[styles.sizeBtn, { borderColor: colors.border }]}>
                <Text style={[styles.sizeBtnText, { color: colors.foreground }]}>−</Text>
              </TouchableOpacity>
              <Text style={[styles.sizeValue, { color: colors.foreground }]}>{titleSize}</Text>
              <TouchableOpacity onPress={() => { const v = Math.min(72, titleSizeRef.current + 2); titleSizeRef.current = v; setTitleSize(v); }} style={[styles.sizeBtn, { borderColor: colors.border }]}>
                <Text style={[styles.sizeBtnText, { color: colors.foreground }]}>+</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => { Haptics.selectionAsync(); titleSizeRef.current = STANDARD_SIZES.title; setTitleSize(STANDARD_SIZES.title); }}
                style={[styles.stdBtn, { borderColor: colors.primary, backgroundColor: titleSize === STANDARD_SIZES.title ? colors.primary : 'transparent' }]}
              >
                <Text style={[styles.stdBtnText, { color: titleSize === STANDARD_SIZES.title ? '#fff' : colors.primary }]}>{t('coverGenerator.stdLabel')}</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={[styles.inlineRow, { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border }]}>
            <Text style={[styles.fontCardLabel, { color: colors.mutedForeground }]}>{t('coverGenerator.shapeColor')}</Text>
            <TouchableOpacity
              onPress={() => { Haptics.selectionAsync(); setTitlePickerVisible(true); }}
              style={[styles.customColorBtn, { borderColor: colors.border, backgroundColor: titleColor, flexDirection: 'row', alignItems: 'center', gap: 5 }]}
            >
              <Feather name="droplet" size={13} color={titleColor === '#FFFFFF' || titleColor === '#F8FAFC' ? '#64748B' : '#FFFFFF'} />
            </TouchableOpacity>
          </View>

          <View style={[styles.effectRow, { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border }]}>
            <Text style={[styles.fontCardLabel, { color: colors.mutedForeground }]}>{t('coverGenerator.effectLabel')}</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.effectChips}>
              {(Object.keys(EFFECT_LABELS) as TextEffect[]).map(e => (
                <TouchableOpacity key={`te-${e}`} onPress={() => setTitleEffect(e)}
                  style={[styles.effectChip, { borderColor: titleEffect === e ? colors.primary : colors.border, backgroundColor: titleEffect === e ? colors.primary + '18' : 'transparent' }]}>
                  <Text style={[styles.effectChipText, { color: titleEffect === e ? colors.primary : colors.mutedForeground }]}>{EFFECT_LABELS[e]}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>

        {/* ── SUBTITLE STYLE ── */}
        <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>{t('coverGenerator.subtitleStyle')}</Text>
        <View style={[styles.colorCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.inlineRow}>
            <Text style={[styles.fontCardLabel, { color: colors.mutedForeground }]}>{t('coverGenerator.sizeLabel')}</Text>
            <View style={styles.sizeControl}>
              <TouchableOpacity onPress={() => { const v = Math.max(8, subtitleSizeRef.current - 1); subtitleSizeRef.current = v; setSubtitleSize(v); }} style={[styles.sizeBtn, { borderColor: colors.border }]}>
                <Text style={[styles.sizeBtnText, { color: colors.foreground }]}>−</Text>
              </TouchableOpacity>
              <Text style={[styles.sizeValue, { color: colors.foreground }]}>{subtitleSize}</Text>
              <TouchableOpacity onPress={() => { const v = Math.min(48, subtitleSizeRef.current + 1); subtitleSizeRef.current = v; setSubtitleSize(v); }} style={[styles.sizeBtn, { borderColor: colors.border }]}>
                <Text style={[styles.sizeBtnText, { color: colors.foreground }]}>+</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => { Haptics.selectionAsync(); subtitleSizeRef.current = STANDARD_SIZES.subtitle; setSubtitleSize(STANDARD_SIZES.subtitle); }}
                style={[styles.stdBtn, { borderColor: colors.primary, backgroundColor: subtitleSize === STANDARD_SIZES.subtitle ? colors.primary : 'transparent' }]}
              >
                <Text style={[styles.stdBtnText, { color: subtitleSize === STANDARD_SIZES.subtitle ? '#fff' : colors.primary }]}>{t('coverGenerator.stdLabel')}</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={[styles.inlineRow, { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border }]}>
            <Text style={[styles.fontCardLabel, { color: colors.mutedForeground }]}>{t('coverGenerator.shapeColor')}</Text>
            <TouchableOpacity
              onPress={() => { Haptics.selectionAsync(); setSubtitlePickerVisible(true); }}
              style={[styles.customColorBtn, { borderColor: colors.border, backgroundColor: subtitleColor, flexDirection: 'row', alignItems: 'center', gap: 5 }]}
            >
              <Feather name="droplet" size={13} color={subtitleColor === '#FFFFFF' || subtitleColor === '#F8FAFC' ? '#64748B' : '#FFFFFF'} />
            </TouchableOpacity>
          </View>

          <View style={[styles.effectRow, { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border }]}>
            <Text style={[styles.fontCardLabel, { color: colors.mutedForeground }]}>{t('coverGenerator.effectLabel')}</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.effectChips}>
              {(Object.keys(EFFECT_LABELS) as TextEffect[]).map(e => (
                <TouchableOpacity key={`se-${e}`} onPress={() => setSubtitleEffect(e)}
                  style={[styles.effectChip, { borderColor: subtitleEffect === e ? colors.primary : colors.border, backgroundColor: subtitleEffect === e ? colors.primary + '18' : 'transparent' }]}>
                  <Text style={[styles.effectChipText, { color: subtitleEffect === e ? colors.primary : colors.mutedForeground }]}>{EFFECT_LABELS[e]}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          <View style={[styles.inlineRow, { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border }]}>
            <Text style={[styles.fontCardLabel, { color: colors.mutedForeground }]}>{t('coverGenerator.spacingLabel')}</Text>
            <View style={styles.sizeControl}>
              <TouchableOpacity onPress={() => setTitleGap(v => Math.max(0, v - 2))} style={[styles.sizeBtn, { borderColor: colors.border }]}>
                <Text style={[styles.sizeBtnText, { color: colors.foreground }]}>−</Text>
              </TouchableOpacity>
              <Text style={[styles.sizeValue, { color: colors.foreground }]}>{titleGap}</Text>
              <TouchableOpacity onPress={() => setTitleGap(v => Math.min(36, v + 2))} style={[styles.sizeBtn, { borderColor: colors.border }]}>
                <Text style={[styles.sizeBtnText, { color: colors.foreground }]}>+</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* ── AUTHOR STYLE ── */}
        <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>{t('coverGenerator.authorStyle')}</Text>
        <View style={[styles.colorCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.inlineRow}>
            <Text style={[styles.fontCardLabel, { color: colors.mutedForeground }]}>{t('coverGenerator.sizeLabel')}</Text>
            <View style={styles.sizeControl}>
              <TouchableOpacity onPress={() => { const v = Math.max(8, authorSizeRef.current - 1); authorSizeRef.current = v; setAuthorSize(v); }} style={[styles.sizeBtn, { borderColor: colors.border }]}>
                <Text style={[styles.sizeBtnText, { color: colors.foreground }]}>−</Text>
              </TouchableOpacity>
              <Text style={[styles.sizeValue, { color: colors.foreground }]}>{authorSize}</Text>
              <TouchableOpacity onPress={() => { const v = Math.min(48, authorSizeRef.current + 1); authorSizeRef.current = v; setAuthorSize(v); }} style={[styles.sizeBtn, { borderColor: colors.border }]}>
                <Text style={[styles.sizeBtnText, { color: colors.foreground }]}>+</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => { Haptics.selectionAsync(); authorSizeRef.current = STANDARD_SIZES.author; setAuthorSize(STANDARD_SIZES.author); }}
                style={[styles.stdBtn, { borderColor: colors.primary, backgroundColor: authorSize === STANDARD_SIZES.author ? colors.primary : 'transparent' }]}
              >
                <Text style={[styles.stdBtnText, { color: authorSize === STANDARD_SIZES.author ? '#fff' : colors.primary }]}>{t('coverGenerator.stdLabel')}</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={[styles.inlineRow, { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border }]}>
            <Text style={[styles.fontCardLabel, { color: colors.mutedForeground }]}>{t('coverGenerator.shapeColor')}</Text>
            <TouchableOpacity
              onPress={() => { Haptics.selectionAsync(); setAuthorPickerVisible(true); }}
              style={[styles.customColorBtn, { borderColor: colors.border, backgroundColor: authorColor, flexDirection: 'row', alignItems: 'center', gap: 5 }]}
            >
              <Feather name="droplet" size={13} color={authorColor === '#FFFFFF' || authorColor === '#F8FAFC' ? '#64748B' : '#FFFFFF'} />
            </TouchableOpacity>
          </View>

          <View style={[styles.effectRow, { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border }]}>
            <Text style={[styles.fontCardLabel, { color: colors.mutedForeground }]}>{t('coverGenerator.effectLabel')}</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.effectChips}>
              {(Object.keys(EFFECT_LABELS) as TextEffect[]).map(e => (
                <TouchableOpacity key={`ae-${e}`} onPress={() => setAuthorEffect(e)}
                  style={[styles.effectChip, { borderColor: authorEffect === e ? colors.primary : colors.border, backgroundColor: authorEffect === e ? colors.primary + '18' : 'transparent' }]}>
                  <Text style={[styles.effectChipText, { color: authorEffect === e ? colors.primary : colors.mutedForeground }]}>{EFFECT_LABELS[e]}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>

        {/* Description */}
        <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>
          {t('coverGenerator.describeYourCover')}
        </Text>
        <TextInput
          style={[
            styles.descInput,
            {
              backgroundColor: colors.card,
              borderColor: colors.border,
              color: colors.foreground,
            },
          ]}
          value={description}
          onChangeText={(text) => {
            setDescription(text);
            setArtistNameWarning(KNOWN_ARTIST_RE.test(text));
          }}
          placeholder={`e.g. "A misty Victorian street at night with a lone detective silhouette, fog rolling in, deep blues and amber lamplight, dramatic and moody"`}
          placeholderTextColor={colors.mutedForeground}
          multiline
          numberOfLines={5}
          textAlignVertical="top"
        />
        {artistNameWarning && (
          <View style={{
            flexDirection: 'row', alignItems: 'flex-start', gap: 8,
            backgroundColor: colors.card, borderColor: colors.border,
            borderWidth: 1, borderRadius: 10, padding: 12, marginTop: 8,
          }}>
            <Feather name="info" size={15} color={colors.mutedForeground} style={{ marginTop: 1 }} />
            <Text style={{ flex: 1, fontSize: 13, color: colors.mutedForeground, lineHeight: 19 }}>
              {t('coverGenerator.artistNameWarning')}
            </Text>
          </View>
        )}

        {/* Genre picker */}
        <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>{t('coverGenerator.coverGenre')}</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.genreChipRow}
          style={styles.genreChipScroll}
        >
          {COVER_GENRES.map(g => {
            const active = coverGenre === g;
            return (
              <TouchableOpacity
                key={g}
                onPress={() => setCoverGenre(active ? '' : g)}
                style={[
                  styles.genreChip,
                  {
                    borderColor: active ? colors.primary : colors.border,
                    backgroundColor: active ? colors.primary + '18' : colors.card,
                  },
                ]}
              >
                <Text style={[styles.genreChipText, { color: active ? colors.primary : colors.foreground }]}>
                  {g}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Inspiration Image (subscriber only) */}
        {hasAccess ? (
          <>
            <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>
              {t('coverGenerator.referenceImage')}
            </Text>
            <TouchableOpacity
              style={[
                styles.inspirationBtn,
                {
                  backgroundColor: colors.card,
                  borderColor: inspirationUri ? colors.primary : colors.border,
                  borderStyle: inspirationUri ? 'solid' : 'dashed',
                },
              ]}
              onPress={handlePickInspiration}
              activeOpacity={0.8}
            >
              {inspirationUri ? (
                <View style={styles.inspirationRow}>
                  <Image
                    source={{ uri: inspirationUri }}
                    style={styles.inspirationThumbnail}
                    resizeMode="cover"
                  />
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.inspirationTitle, { color: colors.foreground }]}>
                      {t('coverGenerator.referenceSelected')}
                    </Text>
                    <Text style={[styles.inspirationSub, { color: colors.mutedForeground }]}>
                      {t('coverGenerator.tapToChange')}
                    </Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => { setInspirationUri(null); setInspirationBase64(null); setInspirationMimeType('image/jpeg'); }}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <Feather name="x-circle" size={18} color={colors.mutedForeground} />
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={styles.inspirationEmpty}>
                  <Feather name="upload" size={20} color={colors.mutedForeground} />
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.inspirationTitle, { color: colors.foreground }]}>
                      {t('coverGenerator.uploadInspiration')}
                    </Text>
                    <Text style={[styles.inspirationSub, { color: colors.mutedForeground }]}>
                      {t('coverGenerator.uploadInspirationSub')}
                    </Text>
                  </View>
                </View>
              )}
            </TouchableOpacity>
          </>
        ) : null}

        {error && (
          <View style={styles.errorRow}>
            <Feather name="alert-circle" size={14} color="#DC2626" />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {/* Generate Button */}
        {hasAccess ? (
          <TouchableOpacity
            style={[styles.generateBtn, { backgroundColor: '#FF9900' }]}
            onPress={handleGenerate}
            disabled={isGenerating}
            activeOpacity={0.85}
          >
            {isGenerating ? (
              <View style={styles.generatingRow}>
                <ActivityIndicator color="#fff" size="small" />
                <Text style={styles.generateBtnText}>Generating cover…</Text>
              </View>
            ) : (
              <View style={styles.generatingRow}>
                <Feather name="aperture" size={18} color="#fff" />
                <Text style={styles.generateBtnText}>
                  {generatedBase64 ? 'Regenerate Cover' : 'Generate Cover'}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        ) : (
          <View style={[styles.paywallCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Feather name="lock" size={18} color={colors.primary} />
            <View style={{ flex: 1 }}>
              <Text style={[styles.paywallTitle, { color: colors.foreground }]}>
                Pro feature
              </Text>
              <Text style={[styles.paywallSub, { color: colors.mutedForeground }]}>
                Subscribe to BloomScript Pro to generate AI covers and upload inspiration images.
              </Text>
            </View>
            <TouchableOpacity
              style={[styles.paywallBtn, { backgroundColor: colors.primary }]}
              onPress={() => router.push({ pathname: '/paywall' })}
              activeOpacity={0.85}
            >
              <Text style={styles.paywallBtnText}>Upgrade</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Upload your own cover — always available, no Pro gate */}
        <View style={styles.ownCoverDivider}>
          <View style={[styles.ownCoverDividerLine, { backgroundColor: colors.border }]} />
          <Text style={[styles.ownCoverDividerText, { color: colors.mutedForeground }]}>or</Text>
          <View style={[styles.ownCoverDividerLine, { backgroundColor: colors.border }]} />
        </View>

        {uploadedCoverUri ? (
          <View style={[styles.ownCoverActive, { backgroundColor: colors.card, borderColor: colors.primary }]}>
            <Image
              source={{ uri: uploadedCoverUri }}
              style={styles.ownCoverThumb}
              resizeMode="cover"
            />
            <View style={{ flex: 1 }}>
              <Text style={[styles.ownCoverActiveTitle, { color: colors.foreground }]}>
                Your cover uploaded
              </Text>
              <Text style={[styles.ownCoverActiveSub, { color: colors.mutedForeground }]}>
                Tap Save Cover below to keep it
              </Text>
            </View>
            <TouchableOpacity
              onPress={handlePickOwnCover}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              style={{ marginRight: 4 }}
            >
              <Feather name="refresh-cw" size={16} color={colors.mutedForeground} />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={clearUploadedCover}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Feather name="x-circle" size={18} color={colors.mutedForeground} />
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity
            style={[styles.ownCoverBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
            onPress={handlePickOwnCover}
            activeOpacity={0.8}
          >
            <View style={[styles.ownCoverIconWrap, { backgroundColor: colors.primary + '18' }]}>
              <Feather name="image" size={20} color={colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.ownCoverTitle, { color: colors.foreground }]}>
                Upload your own cover
              </Text>
              <Text style={[styles.ownCoverSub, { color: colors.mutedForeground }]}>
                Already have a cover? Upload it and add your title text on top
              </Text>
            </View>
            <Feather name="chevron-right" size={18} color={colors.mutedForeground} />
          </TouchableOpacity>
        )}

        {/* Save Cover (whenever we have a background to composite with) */}
        {(previewImageUri) && (
          <>
            <TouchableOpacity
              style={[styles.saveBtn, { backgroundColor: colors.primary }]}
              onPress={handleSave}
              disabled={isSaving}
              activeOpacity={0.85}
            >
              {isSaving ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Feather name="download" size={18} color="#fff" />
                  <Text style={styles.saveBtnText}>
                    {savedUri ? 'Cover Saved ✓' : 'Save Cover'}
                  </Text>
                </>
              )}
            </TouchableOpacity>
            {savedUri && (
              <TouchableOpacity
                style={[styles.shareBtn, { borderColor: colors.border }]}
                onPress={handleShare}
                activeOpacity={0.85}
              >
                <Feather name="share" size={16} color={colors.foreground} />
                <Text style={[styles.shareBtnText, { color: colors.foreground }]}>Share Cover</Text>
              </TouchableOpacity>
            )}
          </>
        )}

        <Text style={[styles.footnote, { color: colors.mutedForeground }]}>
          {t('coverGenerator.kdpNote')}
        </Text>

      </ScrollView>

      <Modal
        visible={fontPickerVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setFontPickerVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalSheet, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.foreground }]}>Choose font</Text>
              <TouchableOpacity onPress={() => setFontPickerVisible(false)}>
                <Feather name="x" size={20} color={colors.mutedForeground} />
              </TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Add custom font row */}
              <TouchableOpacity
                onPress={() => { setFontPickerVisible(false); setAddFontVisible(true); }}
                activeOpacity={0.85}
                style={[styles.fontRow, { backgroundColor: colors.primary + '08', borderColor: colors.primary, borderStyle: 'dashed' }]}
              >
                <Feather name="plus" size={15} color={colors.primary} />
                <View style={{ flex: 1, marginLeft: 8 }}>
                  <Text style={[styles.fontLabel, { color: colors.primary }]}>Add a Google Font</Text>
                  <Text style={[styles.fontSample, { color: colors.mutedForeground }]}>
                    Load any font from fonts.google.com
                  </Text>
                </View>
              </TouchableOpacity>

              {/* Custom fonts section */}
              {customFonts.length > 0 && (
                <>
                  <Text style={[styles.fontSectionLabel, { color: colors.mutedForeground }]}>MY FONTS</Text>
                  {asExportFonts().map((f) => {
                    const selected = f.id === (fontTarget === 'title' ? titleFontId : book?.previewFontId ?? DEFAULT_FONT_ID);
                    return (
                      <TouchableOpacity
                        key={f.id}
                        onPress={() => handlePickFont(f.id)}
                        activeOpacity={0.85}
                        style={[styles.fontRow, { backgroundColor: selected ? colors.primary + '12' : colors.background, borderColor: selected ? colors.primary : colors.border }]}
                      >
                        <View style={{ flex: 1 }}>
                          <Text style={[styles.fontLabel, { color: colors.foreground }]}>{f.label}</Text>
                          <Text style={[styles.fontSample, { color: colors.mutedForeground, fontFamily: f.family }]}>
                            The quick brown fox jumps over the lazy dog.
                          </Text>
                        </View>
                        {selected && <Feather name="check" size={18} color={colors.primary} />}
                      </TouchableOpacity>
                    );
                  })}
                  <Text style={[styles.fontSectionLabel, { color: colors.mutedForeground }]}>ALL FONTS</Text>
                </>
              )}

              {EXPORT_FONTS.map((f) => {
                const selected = f.id === (fontTarget === 'title' ? titleFontId : book?.previewFontId ?? DEFAULT_FONT_ID);
                return (
                  <TouchableOpacity
                    key={f.id}
                    onPress={() => handlePickFont(f.id)}
                    activeOpacity={0.85}
                    style={[
                      styles.fontRow,
                      {
                        backgroundColor: selected ? colors.primary + '12' : colors.background,
                        borderColor: selected ? colors.primary : colors.border,
                      },
                    ]}
                  >
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.fontLabel, { color: colors.foreground }]}>
                        {f.label}
                      </Text>
                      <Text style={[styles.fontSample, { color: colors.mutedForeground, fontFamily: f.family }]}>
                        The quick brown fox jumps over the lazy dog.
                      </Text>
                    </View>
                    {selected && <Feather name="check" size={18} color={colors.primary} />}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        </View>
      </Modal>
      <AddFontModal
        visible={addFontVisible}
        onClose={() => setAddFontVisible(false)}
        onAdd={async (label, family, fontUrl) => {
          await addCustomFont(label, family, fontUrl);
          if (!bookId) return;
          const id = `custom-${label.toLowerCase().replace(/\s+/g, '-')}`;
          updateBook(bookId, fontTarget === 'title' ? { coverTitleFontId: id } : { previewFontId: id });
        }}
      />

      <ColorPickerModal
        visible={titlePickerVisible}
        initialColor={titleColor}
        onClose={() => setTitlePickerVisible(false)}
        onApply={(hex) => { setTitleColor(hex); Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); }}
      />

      <ColorPickerModal
        visible={subtitlePickerVisible}
        initialColor={subtitleColor}
        onClose={() => setSubtitlePickerVisible(false)}
        onApply={(hex) => { setSubtitleColor(hex); Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); }}
      />

      <ColorPickerModal
        visible={authorPickerVisible}
        initialColor={authorColor}
        onClose={() => setAuthorPickerVisible(false)}
        onApply={(hex) => { setAuthorColor(hex); Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); }}
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { paddingHorizontal: 20, paddingTop: 16, gap: 14 },
  header: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    marginTop: 2,
  },
  headerText: { flex: 1 },
  screenTitle: {
    fontSize: 24,
    fontFamily: 'Inter_700Bold',
    letterSpacing: -0.4,
  },
  screenSubtitle: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    marginTop: 3,
    lineHeight: 17,
  },
  notFound: {
    textAlign: 'center',
    fontSize: 16,
    fontFamily: 'Inter_400Regular',
    marginTop: 80,
  },
  formatRow: {
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'center',
  },
  formatChip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 14,
  },
  formatIcon: { fontSize: 18 },
  formatLabel: { fontSize: 13, fontFamily: 'Inter_600SemiBold' },
  formatSub: { fontSize: 10, fontFamily: 'Inter_400Regular', marginTop: 1 },
  previewContainer: {
    alignItems: 'center',
    marginTop: 4,
    backgroundColor: '#fff',
  },
  coverPreview: {
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#fff',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  placeholderContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    padding: 24,
  },
  placeholderIcon: {
    width: 72,
    height: 72,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholderTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    textAlign: 'center',
    letterSpacing: -0.4,
    color: '#000',
  },
  placeholderGenre: {
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 2,
    fontFamily: 'Inter_400Regular',
  },
  placeholderHint: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    textAlign: 'center',
    marginTop: 4,
    lineHeight: 17,
  },
  savedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 8,
    alignSelf: 'center',
  },
  savedBadgeText: {
    color: '#fff',
    fontSize: 11,
    fontFamily: 'Inter_600SemiBold',
  },
  sectionLabel: {
    fontSize: 11,
    fontFamily: 'Inter_600SemiBold',
    letterSpacing: 0.8,
    marginTop: 4,
  },
  fieldCard: {
    borderRadius: 14,
    borderWidth: 1,
    overflow: 'hidden',
  },
  fontCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  fontCardLabel: {
    fontSize: 13,
    fontFamily: 'Inter_500Medium',
  },
  fontCardValue: {
    fontSize: 16,
    fontFamily: 'Inter_600SemiBold',
    marginTop: 4,
  },
  colorCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    gap: 10,
  },
  sliderTrack: {
    flex: 1,
    flexDirection: 'row',
    height: 28,
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 1,
  },
  sliderStep: {
    height: '100%',
    borderRightWidth: StyleSheet.hairlineWidth,
    borderTopWidth: 0,
    borderBottomWidth: 0,
    borderLeftWidth: 0,
  },
  sliderStepBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sliderStepBtnText: {
    fontSize: 16,
    fontFamily: 'Inter_700Bold',
  },
  previewCaption: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: 18,
  },
  previewGuideVertical: {
    position: 'absolute',
    left: '50%',
    top: 0,
    bottom: 0,
    width: StyleSheet.hairlineWidth,
    backgroundColor: 'rgba(59,130,246,0.15)',
  },
  previewGuideHorizontal: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: '50%',
    height: StyleSheet.hairlineWidth,
    backgroundColor: 'rgba(59,130,246,0.15)',
  },
  previewGuideThirdTop: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: '33%',
    height: StyleSheet.hairlineWidth,
    backgroundColor: 'rgba(59,130,246,0.08)',
  },
  previewGuideThirdBottom: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: '66%',
    height: StyleSheet.hairlineWidth,
    backgroundColor: 'rgba(59,130,246,0.08)',
  },
  previewGuideActive: {
    backgroundColor: 'rgba(59,130,246,0.8)',
  },
  previewGoldenH: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: StyleSheet.hairlineWidth,
    backgroundColor: 'rgba(180,130,40,0.18)',
  },
  previewGoldenV: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: StyleSheet.hairlineWidth,
    backgroundColor: 'rgba(180,130,40,0.18)',
  },
  previewGoldenActive: {
    backgroundColor: 'rgba(200,148,30,0.9)',
  },
  previewAlignGuide: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: 'rgba(234,88,12,0.85)',
  },
  phiDot: {
    position: 'absolute',
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(200,148,30,0.55)',
  },
  textEl: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
    paddingHorizontal: 18,
  },
  textElTitle: { top: '18%' },
  textElSubtitle: { top: '38%' },
  textElAuthor: { top: '54%' },
  zeroH: {
    position: 'absolute',
    top: '50%',
    left: 0,
    right: 0,
    height: StyleSheet.hairlineWidth,
    backgroundColor: 'rgba(59,130,246,0.5)',
  },
  zeroV: {
    position: 'absolute',
    left: '50%',
    top: 0,
    bottom: 0,
    width: StyleSheet.hairlineWidth,
    backgroundColor: 'rgba(59,130,246,0.5)',
  },
  zeroDot: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    width: 10,
    height: 10,
    marginTop: -5,
    marginLeft: -5,
    borderRadius: 5,
    backgroundColor: 'rgba(59,130,246,0.8)',
  },
  previewSubtitle: {
    fontStyle: 'italic',
    textAlign: 'center',
  },
  previewTitle: {
    textAlign: 'center',
  },
  previewAuthor: {
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  inlinePickerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 4,
  },
  inlinePickerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
    justifyContent: 'flex-end',
  },
  inlinePickerValue: {
    fontSize: 15,
    fontFamily: 'Inter_500Medium',
  },
  inlineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    paddingHorizontal: 4,
    gap: 10,
  },
  colorSliderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sizeControl: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  sizeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sizeBtnText: {
    fontSize: 18,
    fontFamily: 'Inter_700Bold',
    lineHeight: 22,
  },
  sizeValue: {
    fontSize: 15,
    fontFamily: 'Inter_700Bold',
    minWidth: 28,
    textAlign: 'center',
  },
  stdBtn: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stdBtnText: {
    fontSize: 11,
    fontFamily: 'Inter_700Bold',
    letterSpacing: 0.3,
  },
  effectChips: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  effectRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 4,
    gap: 10,
  },
  effectChip: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
  },
  effectChipText: {
    fontSize: 12,
    fontFamily: 'Inter_600SemiBold',
  },
  customColorBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 18,
    borderWidth: 1,
  },
  customColorBtnText: {
    fontSize: 12,
    fontFamily: 'Inter_600SemiBold',
  },
  sliderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sliderLabel: {
    fontSize: 12,
    fontFamily: 'Inter_500Medium',
  },
  sliderValue: {
    fontSize: 12,
    fontFamily: 'Inter_700Bold',
  },
  sizeSliderTrack: {
    height: 28,
    borderRadius: 14,
    borderWidth: 1,
    overflow: 'hidden',
    justifyContent: 'center',
  },
  sizeSliderFill: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
  },
  sizeSliderThumb: {
    position: 'absolute',
    top: 4,
    width: 20,
    height: 20,
    marginLeft: -10,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#fff',
  },
  fieldRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: 10,
  },
  fieldLabel: {
    fontSize: 13,
    fontFamily: 'Inter_500Medium',
    width: 54,
    flexShrink: 0,
  },
  fieldInput: {
    flex: 1,
    fontSize: 15,
    fontFamily: 'Inter_400Regular',
    padding: 0,
  },
  descInput: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    lineHeight: 20,
    minHeight: 120,
  },
  genreChipScroll: {
    marginBottom: 12,
  },
  genreChipRow: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 2,
    paddingBottom: 2,
  },
  genreChip: {
    borderRadius: 20,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 7,
  },
  genreChipText: {
    fontSize: 13,
    fontFamily: 'Inter_500Medium',
  },
  inspirationBtn: {
    borderRadius: 14,
    borderWidth: 1.5,
    padding: 14,
    overflow: 'hidden',
  },
  inspirationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  inspirationEmpty: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  inspirationThumbnail: {
    width: 52,
    height: 52,
    borderRadius: 8,
    flexShrink: 0,
  },
  inspirationTitle: {
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
  },
  restoreBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderRadius: 14,
    borderWidth: 1,
    overflow: 'hidden',
    marginBottom: 4,
  },
  restoreThumb: {
    width: 52,
    height: 72,
    flexShrink: 0,
  },
  restoreTitle: {
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
  },
  restoreSub: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    marginTop: 2,
  },
  ownCoverDivider: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginVertical: 4,
  },
  ownCoverDividerLine: {
    flex: 1,
    height: StyleSheet.hairlineWidth,
  },
  ownCoverDividerText: {
    fontSize: 12,
    fontFamily: 'Inter_500Medium',
    textTransform: 'lowercase',
  },
  ownCoverBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderRadius: 14,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    padding: 14,
  },
  ownCoverIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  ownCoverTitle: {
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
  },
  ownCoverSub: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    marginTop: 2,
  },
  ownCoverActive: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderRadius: 14,
    borderWidth: 1.5,
    padding: 12,
  },
  ownCoverThumb: {
    width: 48,
    height: 64,
    borderRadius: 8,
    flexShrink: 0,
  },
  ownCoverActiveTitle: {
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
  },
  ownCoverActiveSub: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    marginTop: 2,
  },
  inspirationSub: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    marginTop: 2,
    lineHeight: 17,
  },
  errorRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
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
    lineHeight: 18,
  },
  generateBtn: {
    borderRadius: 30,
    paddingVertical: 16,
    alignItems: 'center',
  },
  generatingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  generateBtnText: {
    fontSize: 17,
    fontFamily: 'Inter_600SemiBold',
    color: '#fff',
  },
  paywallCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
  },
  paywallTitle: {
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
  },
  paywallSub: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    lineHeight: 17,
    marginTop: 2,
  },
  paywallBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    flexShrink: 0,
  },
  paywallBtnText: {
    color: '#fff',
    fontSize: 13,
    fontFamily: 'Inter_600SemiBold',
  },
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    borderRadius: 30,
    paddingVertical: 16,
  },
  saveBtnText: {
    fontSize: 17,
    fontFamily: 'Inter_600SemiBold',
    color: '#fff',
  },
  shareBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 30,
    paddingVertical: 12,
    borderWidth: 1,
    marginTop: 8,
  },
  shareBtnText: {
    fontSize: 15,
    fontFamily: 'Inter_600SemiBold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    borderWidth: 1,
    padding: 16,
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 18,
    fontFamily: 'Inter_700Bold',
    marginBottom: 12,
  },
  colorInput: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontFamily: 'Inter_600SemiBold',
    fontSize: 16,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 14,
  },
  modalBtn: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  modalBtnText: {
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  fontRow: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 12,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  fontLabel: {
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
  },
  fontSample: {
    fontSize: 14,
    marginTop: 4,
  },
  fontSectionLabel: {
    fontSize: 10,
    fontFamily: 'Inter_600SemiBold',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginTop: 8,
    marginBottom: 4,
  },
  footnote: {
    fontSize: 11,
    fontFamily: 'Inter_400Regular',
    textAlign: 'center',
    lineHeight: 16,
  },
  shapesBar: {
    borderRadius: 14,
    borderWidth: 1,
    paddingVertical: 10,
  },
  shapeBtnRow: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 14,
  },
  undoBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 56,
    height: 64,
    borderRadius: 14,
    borderWidth: 1,
    gap: 4,
    marginRight: 10,
    flexShrink: 0,
  },
  shapeBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 64,
    height: 64,
    borderRadius: 14,
    borderWidth: 1,
    gap: 4,
  },
  shapeBtnIcon: {
    fontSize: 22,
  },
  shapeBtnLabel: {
    fontSize: 10,
    fontFamily: 'Inter_500Medium',
  },
  shapeControls: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
  },
  shapeDeleteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingTop: 12,
    marginTop: 4,
  },
  shapeDeleteText: {
    fontSize: 13,
    fontFamily: 'Inter_500Medium',
    color: '#DC2626',
  },
  rotateResetBtn: {
    minWidth: 52,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  rotateResetText: {
    fontSize: 13,
    fontFamily: 'Inter_600SemiBold',
  },
  fillChip: {
    height: 28,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  fillChipText: {
    fontSize: 11,
    fontFamily: 'Inter_600SemiBold',
  },
  fullCoverBtn: {
    height: 32,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 14,
  },
});
