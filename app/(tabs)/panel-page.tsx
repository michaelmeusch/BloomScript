import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import React, { useState } from 'react';
import {
  Dimensions, ScrollView, StyleSheet, Text,
  TouchableOpacity, View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Circle, Defs, G, Line, Marker, Path, Polygon, Rect, Text as SvgText } from 'react-native-svg';

// ── COMIC palette ──────────────────────────────────────────────────────────────
const C = {
  bg: '#0E0C0A', card: '#181410', card2: '#201A14', border: '#2E2618',
  yellow: '#FFD600', red: '#E8001C', blue: '#0057A8', green: '#2A7A3A',
  ink: '#F0EAD8', muted: '#7A6A58', dim: '#3A3028',
};

// ── Types ──────────────────────────────────────────────────────────────────────
type PanelType =
  | 'ESTABLISHING' | 'ACTION' | 'DIALOGUE' | 'EMOTIONAL' | 'REVEAL'
  | 'SPLASH' | 'HORROR' | 'TRANSITION' | 'IMPACT' | 'SILENT';
type PanelShape = 'RECTANGLE' | 'WIDE' | 'VERTICAL' | 'DIAGONAL' | 'BORDERLESS' | 'OVERLAP' | 'SPLASH';
type FlowDir = 'LEFT→RIGHT' | 'RIGHT→LEFT' | 'TOP→BOTTOM' | 'DIAGONAL↘' | 'CIRCULAR';
type LayoutStyle = 'Z Pattern' | 'Manga Vertical' | 'Cinematic Wide' | 'Action Chaos' | 'Dialogue Heavy' | 'Splash Layout';

interface PanelDef {
  id: number;
  x: number; y: number; w: number; h: number; // 0-100 normalized
  panelType: PanelType;
  panelShape: PanelShape;
  visualWeight: number; // 1-10
  emotionalPurpose: string;
  eyeFlow: FlowDir;
  reserveDialogueTop?: boolean;
  aiDirectives: string[];
}

// ── Panel type colors ──────────────────────────────────────────────────────────
const TYPE_COLOR: Record<PanelType, string> = {
  ESTABLISHING: '#0057A8',
  ACTION:       '#E8001C',
  DIALOGUE:     '#2A7A3A',
  EMOTIONAL:    '#8B3FBE',
  REVEAL:       '#FFD600',
  SPLASH:       '#FF6A00',
  HORROR:       '#3A0A0A',
  TRANSITION:   '#1A3A4A',
  IMPACT:       '#CC0033',
  SILENT:       '#3A3028',
};

const TYPE_EMOJI: Record<PanelType, string> = {
  ESTABLISHING: '🌆', ACTION: '💥', DIALOGUE: '💬', EMOTIONAL: '❤️',
  REVEAL: '👁️', SPLASH: '🌊', HORROR: '😱', TRANSITION: '🌀',
  IMPACT: '⚡', SILENT: '🤫',
};

// ── Layout definitions (normalized 0-100 coords on 100×130 grid) ───────────────
const LAYOUTS: Record<LayoutStyle, PanelDef[]> = {
  'Z Pattern': [
    { id: 1, x:  2, y:  2, w: 63, h: 30, panelType: 'ESTABLISHING', panelShape: 'RECTANGLE', visualWeight: 10, emotionalPurpose: 'Scene Introduction',   eyeFlow: 'LEFT→RIGHT',  reserveDialogueTop: true, aiDirectives: ['wide establishing shot','strong left-to-right composition'] },
    { id: 2, x: 67, y:  2, w: 31, h: 14, panelType: 'DIALOGUE',     panelShape: 'VERTICAL',  visualWeight:  5, emotionalPurpose: 'Conversation Reaction', eyeFlow: 'TOP→BOTTOM',  aiDirectives: ['conversation reaction shot'] },
    { id: 3, x: 67, y: 18, w: 31, h: 14, panelType: 'REVEAL',       panelShape: 'VERTICAL',  visualWeight:  7, emotionalPurpose: 'Dramatic Reveal',       eyeFlow: 'DIAGONAL↘',   aiDirectives: ['dramatic reveal close-up'] },
    { id: 4, x:  2, y: 34, w: 96, h: 22, panelType: 'ACTION',       panelShape: 'WIDE',      visualWeight:  9, emotionalPurpose: 'High Impact Sequence',   eyeFlow: 'LEFT→RIGHT',  aiDirectives: ['high impact action','cinematic movement'] },
    { id: 5, x:  2, y: 58, w: 44, h: 27, panelType: 'EMOTIONAL',    panelShape: 'RECTANGLE', visualWeight:  6, emotionalPurpose: 'Character Close-Up',     eyeFlow: 'DIAGONAL↘',   aiDirectives: ['emotional character close-up'] },
    { id: 6, x: 48, y: 58, w: 50, h: 27, panelType: 'IMPACT',       panelShape: 'RECTANGLE', visualWeight: 10, emotionalPurpose: 'Final Dramatic Impact',   eyeFlow: 'LEFT→RIGHT',  aiDirectives: ['final dramatic impact','page turn hook'] },
  ],
  'Manga Vertical': [
    { id: 1, x:  2, y:  2, w: 96, h: 18, panelType: 'ESTABLISHING', panelShape: 'WIDE',      visualWeight:  9, emotionalPurpose: 'Scene Spread',          eyeFlow: 'LEFT→RIGHT',  aiDirectives: ['panoramic establishing shot'] },
    { id: 2, x: 50, y: 22, w: 48, h: 28, panelType: 'DIALOGUE',     panelShape: 'VERTICAL',  visualWeight:  5, emotionalPurpose: 'Character A',            eyeFlow: 'TOP→BOTTOM',  aiDirectives: ['dialogue — character A','right panel manga flow'] },
    { id: 3, x:  2, y: 22, w: 46, h: 28, panelType: 'DIALOGUE',     panelShape: 'VERTICAL',  visualWeight:  5, emotionalPurpose: 'Character B',            eyeFlow: 'TOP→BOTTOM',  aiDirectives: ['dialogue — character B','left panel manga flow'] },
    { id: 4, x: 50, y: 52, w: 48, h: 26, panelType: 'EMOTIONAL',    panelShape: 'VERTICAL',  visualWeight:  7, emotionalPurpose: 'Reaction',               eyeFlow: 'TOP→BOTTOM',  aiDirectives: ['emotional reaction shot'] },
    { id: 5, x:  2, y: 52, w: 46, h: 26, panelType: 'REVEAL',       panelShape: 'VERTICAL',  visualWeight:  8, emotionalPurpose: 'Reveal Moment',          eyeFlow: 'DIAGONAL↘',   aiDirectives: ['reveal — tension build'] },
    { id: 6, x:  2, y: 80, w: 96, h: 18, panelType: 'IMPACT',       panelShape: 'WIDE',      visualWeight: 10, emotionalPurpose: 'Page-End Impact',        eyeFlow: 'LEFT→RIGHT',  aiDirectives: ['full-bleed impact','page turn hook'] },
  ],
  'Cinematic Wide': [
    { id: 1, x:  2, y:  2, w: 96, h: 28, panelType: 'ESTABLISHING', panelShape: 'WIDE',      visualWeight: 10, emotionalPurpose: 'Cinematic Establishing', eyeFlow: 'LEFT→RIGHT',  aiDirectives: ['2.39:1 letterbox establishing','widescreen film composition'] },
    { id: 2, x:  2, y: 32, w: 60, h: 20, panelType: 'ACTION',       panelShape: 'WIDE',      visualWeight:  8, emotionalPurpose: 'Action Sequence',        eyeFlow: 'LEFT→RIGHT',  aiDirectives: ['widescreen action beat'] },
    { id: 3, x: 64, y: 32, w: 34, h: 20, panelType: 'DIALOGUE',     panelShape: 'VERTICAL',  visualWeight:  5, emotionalPurpose: 'Reaction Shot',          eyeFlow: 'TOP→BOTTOM',  aiDirectives: ['tight reaction close-up'] },
    { id: 4, x:  2, y: 54, w: 34, h: 22, panelType: 'EMOTIONAL',    panelShape: 'VERTICAL',  visualWeight:  6, emotionalPurpose: 'Emotional Beat',          eyeFlow: 'DIAGONAL↘',   aiDirectives: ['low-key emotional beat','Dutch angle'] },
    { id: 5, x: 38, y: 54, w: 60, h: 22, panelType: 'REVEAL',       panelShape: 'WIDE',      visualWeight:  9, emotionalPurpose: 'Grand Reveal',           eyeFlow: 'LEFT→RIGHT',  aiDirectives: ['grand cinematic reveal','pull-back reveal shot'] },
    { id: 6, x:  2, y: 78, w: 96, h: 20, panelType: 'IMPACT',       panelShape: 'WIDE',      visualWeight: 10, emotionalPurpose: 'Climax Beat',            eyeFlow: 'LEFT→RIGHT',  aiDirectives: ['climax widescreen moment','maximum visual weight'] },
  ],
  'Action Chaos': [
    { id: 1, x:  2, y:  2, w: 58, h: 35, panelType: 'ACTION',    panelShape: 'RECTANGLE', visualWeight:  9, emotionalPurpose: 'Action Opener',   eyeFlow: 'LEFT→RIGHT', aiDirectives: ['explosive action opener','speed lines'] },
    { id: 2, x: 62, y:  2, w: 36, h: 35, panelType: 'IMPACT',    panelShape: 'VERTICAL',  visualWeight: 10, emotionalPurpose: 'Impact Hit',       eyeFlow: 'DIAGONAL↘',  aiDirectives: ['massive impact close-up','shatter effect'] },
    { id: 3, x:  2, y: 39, w: 28, h: 48, panelType: 'DIALOGUE',  panelShape: 'VERTICAL',  visualWeight:  4, emotionalPurpose: 'Taunt / Quip',     eyeFlow: 'TOP→BOTTOM', aiDirectives: ['villain taunt narrow panel'] },
    { id: 4, x: 32, y: 39, w: 66, h: 22, panelType: 'ACTION',    panelShape: 'WIDE',      visualWeight:  8, emotionalPurpose: 'Clash Sequence',   eyeFlow: 'LEFT→RIGHT', aiDirectives: ['battle clash wide shot'] },
    { id: 5, x: 32, y: 63, w: 32, h: 24, panelType: 'EMOTIONAL', panelShape: 'RECTANGLE', visualWeight:  6, emotionalPurpose: 'Hero Struggle',    eyeFlow: 'DIAGONAL↘',  aiDirectives: ['hero pain / struggle close-up'] },
    { id: 6, x: 66, y: 63, w: 32, h: 24, panelType: 'HORROR',    panelShape: 'RECTANGLE', visualWeight:  7, emotionalPurpose: 'Villain Loom',     eyeFlow: 'TOP→BOTTOM', aiDirectives: ['villain looming low angle','menacing shadow'] },
  ],
  'Dialogue Heavy': [
    { id: 1, x:  2, y:  2, w: 96, h: 22, panelType: 'ESTABLISHING', panelShape: 'WIDE',      visualWeight:  8, emotionalPurpose: 'Scene Setting',    eyeFlow: 'LEFT→RIGHT', aiDirectives: ['establishing interior shot','set the mood'] },
    { id: 2, x:  2, y: 26, w: 46, h: 22, panelType: 'DIALOGUE',     panelShape: 'VERTICAL',  visualWeight:  5, emotionalPurpose: 'Character A Speaks', eyeFlow: 'TOP→BOTTOM', aiDirectives: ['character A medium shot','eye-level'] },
    { id: 3, x: 50, y: 26, w: 48, h: 22, panelType: 'DIALOGUE',     panelShape: 'VERTICAL',  visualWeight:  5, emotionalPurpose: 'Character B Reacts', eyeFlow: 'TOP→BOTTOM', aiDirectives: ['character B reaction','over-shoulder'] },
    { id: 4, x:  2, y: 50, w: 46, h: 22, panelType: 'DIALOGUE',     panelShape: 'VERTICAL',  visualWeight:  5, emotionalPurpose: 'Tension Rise',      eyeFlow: 'TOP→BOTTOM', aiDirectives: ['tighter close-up — tension rising'] },
    { id: 5, x: 50, y: 50, w: 48, h: 22, panelType: 'EMOTIONAL',    panelShape: 'VERTICAL',  visualWeight:  7, emotionalPurpose: 'Emotional Peak',    eyeFlow: 'DIAGONAL↘',  aiDirectives: ['emotion peak — tears or anger'] },
    { id: 6, x:  2, y: 74, w: 96, h: 24, panelType: 'REVEAL',       panelShape: 'WIDE',      visualWeight: 10, emotionalPurpose: 'Plot Revelation',   eyeFlow: 'LEFT→RIGHT', aiDirectives: ['wide reveal panel','dialogue payoff'] },
  ],
  'Splash Layout': [
    { id: 1, x:  2, y:  2, w: 62, h: 80, panelType: 'SPLASH',   panelShape: 'SPLASH',    visualWeight: 10, emotionalPurpose: 'Hero Splash Page',  eyeFlow: 'CIRCULAR',   aiDirectives: ['full character splash','dynamic pose','high detail'] },
    { id: 2, x: 66, y:  2, w: 32, h: 18, panelType: 'ESTABLISHING', panelShape: 'VERTICAL', visualWeight: 6, emotionalPurpose: 'Environment',      eyeFlow: 'TOP→BOTTOM', aiDirectives: ['environment context'] },
    { id: 3, x: 66, y: 22, w: 32, h: 18, panelType: 'DIALOGUE',  panelShape: 'VERTICAL',  visualWeight:  5, emotionalPurpose: 'Villain Reaction',  eyeFlow: 'TOP→BOTTOM', aiDirectives: ['villain reaction shot'] },
    { id: 4, x: 66, y: 42, w: 32, h: 18, panelType: 'IMPACT',    panelShape: 'VERTICAL',  visualWeight:  7, emotionalPurpose: 'Impact Detail',     eyeFlow: 'DIAGONAL↘',  aiDirectives: ['extreme close-up impact detail'] },
    { id: 5, x: 66, y: 62, w: 32, h: 20, panelType: 'REVEAL',    panelShape: 'VERTICAL',  visualWeight:  8, emotionalPurpose: 'Power Reveal',      eyeFlow: 'DIAGONAL↘',  aiDirectives: ['power / ability reveal'] },
    { id: 6, x:  2, y: 84, w: 96, h: 14, panelType: 'TRANSITION', panelShape: 'WIDE',     visualWeight:  6, emotionalPurpose: 'Next Scene Hook',   eyeFlow: 'LEFT→RIGHT', aiDirectives: ['transition / next-page teaser'] },
  ],
};

// ── Eye Flow Metrics per layout ────────────────────────────────────────────────
interface Metric { label: string; value: string; score: number }
const METRICS: Record<LayoutStyle, Metric[]> = {
  'Z Pattern': [
    { label: 'READABILITY SCORE',  value: '96',      score: 96 },
    { label: 'Z-FLOW STRENGTH',    value: 'HIGH',    score: 90 },
    { label: 'PANEL PACING',       value: 'STRONG',  score: 88 },
    { label: 'DIALOGUE FLOW',      value: 'NATURAL', score: 82 },
    { label: 'ACTION CLARITY',     value: 'HIGH',    score: 91 },
    { label: 'READER CONFUSION',   value: 'LOW',     score: 95 },
    { label: 'EMOTIONAL BUILD',    value: 'STRONG',  score: 85 },
    { label: 'CINEMATIC RHYTHM',   value: 'GOOD',    score: 84 },
    { label: 'FOCAL BALANCE',      value: 'STABLE',  score: 87 },
    { label: 'PAGE TURN HOOK',     value: 'STRONG',  score: 92 },
  ],
  'Manga Vertical': [
    { label: 'READABILITY SCORE',  value: '91',      score: 91 },
    { label: 'MANGA FLOW',         value: 'STRONG',  score: 94 },
    { label: 'PANEL PACING',       value: 'FAST',    score: 90 },
    { label: 'DIALOGUE FLOW',      value: 'HIGH',    score: 87 },
    { label: 'ACTION CLARITY',     value: 'MEDIUM',  score: 74 },
    { label: 'READER CONFUSION',   value: 'LOW',     score: 89 },
    { label: 'EMOTIONAL BUILD',    value: 'STRONG',  score: 88 },
    { label: 'CINEMATIC RHYTHM',   value: 'FAST',    score: 86 },
    { label: 'FOCAL BALANCE',      value: 'STRONG',  score: 90 },
    { label: 'PAGE TURN HOOK',     value: 'HIGH',    score: 93 },
  ],
  'Cinematic Wide': [
    { label: 'READABILITY SCORE',  value: '93',      score: 93 },
    { label: 'Z-FLOW STRENGTH',    value: 'MEDIUM',  score: 72 },
    { label: 'PANEL PACING',       value: 'SLOW',    score: 68 },
    { label: 'DIALOGUE FLOW',      value: 'NATURAL', score: 78 },
    { label: 'ACTION CLARITY',     value: 'HIGH',    score: 92 },
    { label: 'READER CONFUSION',   value: 'VERY LOW',score: 97 },
    { label: 'EMOTIONAL BUILD',    value: 'STRONG',  score: 89 },
    { label: 'CINEMATIC RHYTHM',   value: 'PERFECT', score: 98 },
    { label: 'FOCAL BALANCE',      value: 'STABLE',  score: 91 },
    { label: 'PAGE TURN HOOK',     value: 'STRONG',  score: 88 },
  ],
  'Action Chaos': [
    { label: 'READABILITY SCORE',  value: '78',      score: 78 },
    { label: 'Z-FLOW STRENGTH',    value: 'BROKEN',  score: 40 },
    { label: 'PANEL PACING',       value: 'INTENSE', score: 96 },
    { label: 'DIALOGUE FLOW',      value: 'MINIMAL', score: 55 },
    { label: 'ACTION CLARITY',     value: 'MAXIMUM', score: 99 },
    { label: 'READER CONFUSION',   value: 'MEDIUM',  score: 60 },
    { label: 'EMOTIONAL BUILD',    value: 'EXTREME', score: 94 },
    { label: 'CINEMATIC RHYTHM',   value: 'CHAOTIC', score: 82 },
    { label: 'FOCAL BALANCE',      value: 'DYNAMIC', score: 74 },
    { label: 'PAGE TURN HOOK',     value: 'EXTREME', score: 97 },
  ],
  'Dialogue Heavy': [
    { label: 'READABILITY SCORE',  value: '98',      score: 98 },
    { label: 'Z-FLOW STRENGTH',    value: 'STEADY',  score: 85 },
    { label: 'PANEL PACING',       value: 'CALM',    score: 65 },
    { label: 'DIALOGUE FLOW',      value: 'PERFECT', score: 99 },
    { label: 'ACTION CLARITY',     value: 'LOW',     score: 42 },
    { label: 'READER CONFUSION',   value: 'NONE',    score: 100 },
    { label: 'EMOTIONAL BUILD',    value: 'GRADUAL', score: 78 },
    { label: 'CINEMATIC RHYTHM',   value: 'STEADY',  score: 72 },
    { label: 'FOCAL BALANCE',      value: 'EVEN',    score: 93 },
    { label: 'PAGE TURN HOOK',     value: 'DIALOGUE',score: 82 },
  ],
  'Splash Layout': [
    { label: 'READABILITY SCORE',  value: '88',      score: 88 },
    { label: 'Z-FLOW STRENGTH',    value: 'LOW',     score: 45 },
    { label: 'PANEL PACING',       value: 'EPIC',    score: 98 },
    { label: 'DIALOGUE FLOW',      value: 'MINIMAL', score: 52 },
    { label: 'ACTION CLARITY',     value: 'MAXIMUM', score: 97 },
    { label: 'READER CONFUSION',   value: 'LOW',     score: 85 },
    { label: 'EMOTIONAL BUILD',    value: 'PEAK',    score: 96 },
    { label: 'CINEMATIC RHYTHM',   value: 'BOLD',    score: 92 },
    { label: 'FOCAL BALANCE',      value: 'DOMINANT',score: 89 },
    { label: 'PAGE TURN HOOK',     value: 'MAXIMAL', score: 99 },
  ],
};

// ── Panel type options for editor ─────────────────────────────────────────────
const PANEL_TYPES: PanelType[] = [
  'ESTABLISHING','ACTION','DIALOGUE','EMOTIONAL','REVEAL',
  'SPLASH','HORROR','TRANSITION','IMPACT','SILENT',
];
const PANEL_SHAPES: PanelShape[] = [
  'RECTANGLE','WIDE','VERTICAL','DIAGONAL','BORDERLESS','OVERLAP','SPLASH',
];
const FLOW_DIRS: FlowDir[] = [
  'LEFT→RIGHT','RIGHT→LEFT','TOP→BOTTOM','DIAGONAL↘','CIRCULAR',
];
const LAYOUT_NAMES: LayoutStyle[] = [
  'Z Pattern','Manga Vertical','Cinematic Wide','Action Chaos','Dialogue Heavy','Splash Layout',
];
const LAYOUT_EMOJI: Record<LayoutStyle, string> = {
  'Z Pattern':      'Z',
  'Manga Vertical': '⬇',
  'Cinematic Wide': '⬛',
  'Action Chaos':   '💢',
  'Dialogue Heavy': '💬',
  'Splash Layout':  '🌊',
};

// ── Page Canvas component ──────────────────────────────────────────────────────
const CANVAS_W = Dimensions.get('window').width - 32;
const CANVAS_H = CANVAS_W * 1.3;

function toCanvasX(pct: number) { return (pct / 100) * CANVAS_W; }
function toCanvasY(pct: number) { return (pct / 100) * CANVAS_H; }
function focalX(p: PanelDef) { return toCanvasX(p.x + p.w / 2); }
function focalY(p: PanelDef) { return toCanvasY(p.y + p.h / 2); }

function arrowPath(x1: number, y1: number, x2: number, y2: number): string {
  const mx = (x1 + x2) / 2;
  const my = (y1 + y2) / 2;
  return `M${x1} ${y1} Q${mx + (y2 - y1) * 0.1} ${my - (x2 - x1) * 0.1} ${x2} ${y2}`;
}

interface PageCanvasProps {
  panels: PanelDef[];
  selectedId: number | null;
  onSelectPanel: (id: number) => void;
  showFlow: boolean;
}
function PageCanvas({ panels, selectedId, onSelectPanel, showFlow }: PageCanvasProps) {
  return (
    <View style={{ width: CANVAS_W, height: CANVAS_H, backgroundColor: '#F0EAD8', borderRadius: 6, overflow: 'hidden' }}>
      <Svg width={CANVAS_W} height={CANVAS_H}>
        <Defs>
          <Marker id="arrow" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
            <Polygon points="0 0, 6 3, 0 6" fill={C.red} opacity="0.85" />
          </Marker>
        </Defs>

        {/* Page border */}
        <Rect x={0} y={0} width={CANVAS_W} height={CANVAS_H} fill="#F0EAD8" stroke={C.border} strokeWidth={1} />

        {/* Panels */}
        {panels.map((p) => {
          const px = toCanvasX(p.x);
          const py = toCanvasY(p.y);
          const pw = toCanvasX(p.w);
          const ph = toCanvasY(p.h);
          const color = TYPE_COLOR[p.panelType];
          const isSelected = selectedId === p.id;
          const fw = p.visualWeight / 10;
          return (
            <G key={p.id}>
              {/* Panel fill */}
              <Rect
                x={px} y={py} width={pw} height={ph}
                fill={color} opacity={0.12 + fw * 0.08}
                rx={isSelected ? 0 : 2}
              />
              {/* Panel border */}
              <Rect
                x={px} y={py} width={pw} height={ph}
                fill="none"
                stroke={isSelected ? C.yellow : '#111'}
                strokeWidth={isSelected ? 2.5 : 1.5}
                rx={2}
              />
              {/* Dialogue reserve bar */}
              {p.reserveDialogueTop && (
                <Rect x={px} y={py} width={pw} height={Math.max(ph * 0.18, 10)} fill="#C8C8FF" opacity={0.35} />
              )}
              {/* Panel number badge */}
              <Rect x={px + 2} y={py + 2} width={14} height={13} fill="#111" opacity={0.75} rx={2} />
              <SvgText x={px + 9} y={py + 13} fill={C.yellow} fontSize={9} fontWeight="800" textAnchor="middle">
                {p.id}
              </SvgText>
              {/* Panel type label */}
              <SvgText x={px + pw / 2} y={py + ph / 2 - 5} fill={color} fontSize={7.5} fontWeight="700" textAnchor="middle" opacity={0.9}>
                {p.panelType}
              </SvgText>
              {/* Emotional purpose */}
              <SvgText x={px + pw / 2} y={py + ph / 2 + 7} fill="#333" fontSize={6} textAnchor="middle" opacity={0.7}>
                {p.emotionalPurpose}
              </SvgText>
              {/* Weight indicator */}
              <SvgText x={px + pw - 3} y={py + ph - 3} fill={color} fontSize={6} fontWeight="700" textAnchor="end" opacity={0.8}>
                W{p.visualWeight}
              </SvgText>
              {/* Focal point */}
              <Circle cx={focalX(p)} cy={focalY(p)} r={4} fill={C.red} opacity={0.7} />
              <Circle cx={focalX(p)} cy={focalY(p)} r={7} fill="none" stroke={C.red} strokeWidth={1} opacity={0.4} />
            </G>
          );
        })}

        {/* Z-pattern flow arrows */}
        {showFlow && panels.map((p, i) => {
          if (i === panels.length - 1) return null;
          const next = panels[i + 1]!;
          const x1 = focalX(p);
          const y1 = focalY(p);
          const x2 = focalX(next);
          const y2 = focalY(next);
          return (
            <Path
              key={`flow-${p.id}`}
              d={arrowPath(x1, y1, x2, y2)}
              fill="none"
              stroke={C.red}
              strokeWidth={1.5}
              strokeDasharray="5,4"
              opacity={0.65}
              markerEnd="url(#arrow)"
            />
          );
        })}
      </Svg>

      {/* Tap targets (invisible, on top of SVG) */}
      {panels.map((p) => (
        <TouchableOpacity
          key={`tap-${p.id}`}
          onPress={() => { Haptics.selectionAsync(); onSelectPanel(p.id); }}
          activeOpacity={0.7}
          style={{
            position: 'absolute',
            left: toCanvasX(p.x),
            top: toCanvasY(p.y),
            width: toCanvasX(p.w),
            height: toCanvasY(p.h),
          }}
        />
      ))}
    </View>
  );
}

// ── Chip component ─────────────────────────────────────────────────────────────
function Chip({ label, active, color, onPress }: { label: string; active: boolean; color?: string; onPress: () => void }) {
  const ac = color ?? C.yellow;
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.75}
      style={[chip.base, active && { borderColor: ac, backgroundColor: ac + '22' }]}>
      <Text style={[chip.txt, active && { color: ac }]}>{label}</Text>
    </TouchableOpacity>
  );
}
const chip = StyleSheet.create({
  base: { borderWidth: 1, borderColor: C.border, borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4, marginRight: 6, marginBottom: 5 },
  txt:  { color: C.muted, fontSize: 10.5, fontWeight: '600' },
});

function SectionLabel({ text }: { text: string }) {
  return <Text style={{ color: C.muted, fontSize: 9, fontWeight: '700', letterSpacing: 1.5, marginBottom: 5, marginTop: 14 }}>{text}</Text>;
}

// ── Main Screen ───────────────────────────────────────────────────────────────
export default function PanelPage() {
  const insets = useSafeAreaInsets();

  const [layout, setLayout]       = useState<LayoutStyle>('Z Pattern');
  const [panels, setPanels]       = useState<PanelDef[]>(() => LAYOUTS['Z Pattern']!.map(p => ({ ...p })));
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [showFlow, setShowFlow]   = useState(true);
  const [optimized, setOptimized] = useState(false);

  const selectedPanel = panels.find(p => p.id === selectedId) ?? null;

  const switchLayout = (name: LayoutStyle) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setLayout(name);
    setPanels(LAYOUTS[name]!.map(p => ({ ...p })));
    setSelectedId(null);
    setOptimized(false);
  };

  const updatePanel = (id: number, patch: Partial<PanelDef>) => {
    Haptics.selectionAsync();
    setPanels(prev => prev.map(p => p.id === id ? { ...p, ...patch } : p));
  };

  const optimizeFlow = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setOptimized(true);
    setShowFlow(true);
  };

  const metrics = METRICS[layout]!;
  const dominantPanel = [...panels].sort((a, b) => b.visualWeight - a.visualWeight)[0];

  return (
    <View style={[s.root, { backgroundColor: C.bg }]}>
      {/* Header */}
      <View style={[s.header, { paddingTop: insets.top + 8, borderBottomColor: C.border }]}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Feather name="arrow-left" size={20} color={C.yellow} />
        </TouchableOpacity>
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={[s.headerTitle, { color: C.ink }]}>PAGE FLOW ENGINE</Text>
          <Text style={{ color: C.muted, fontSize: 9, fontFamily: 'Inter_400Regular' }}>
            Z-Pattern · Cinematic · {panels.length} panels · {layout}
          </Text>
        </View>
        <TouchableOpacity
          onPress={() => setShowFlow(v => !v)}
          style={[s.flowToggle, { borderColor: showFlow ? C.red : C.border, backgroundColor: showFlow ? C.red + '22' : 'transparent' }]}
        >
          <Text style={{ color: showFlow ? C.red : C.muted, fontSize: 9, fontWeight: '800' }}>
            {showFlow ? '👁 FLOW' : '   FLOW'}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={[s.scroll, { paddingBottom: insets.bottom + 32 }]} showsVerticalScrollIndicator={false}>

        {/* ── Layout Style Picker ─────────────────────────────────────────── */}
        <SectionLabel text="LAYOUT STYLE" />
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 4 }}>
          <View style={{ flexDirection: 'row' }}>
            {LAYOUT_NAMES.map(name => (
              <TouchableOpacity
                key={name}
                onPress={() => switchLayout(name)}
                activeOpacity={0.8}
                style={[s.layoutCard, layout === name && { borderColor: C.yellow, backgroundColor: C.yellow + '18' }]}
              >
                <Text style={[s.layoutEmoji, layout === name && { color: C.yellow }]}>{LAYOUT_EMOJI[name]}</Text>
                <Text style={[s.layoutName, layout === name && { color: C.yellow }]}>{name}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>

        {/* ── Visual Page Canvas ──────────────────────────────────────────── */}
        <SectionLabel text="PAGE CANVAS — TAP A PANEL TO EDIT" />
        <PageCanvas panels={panels} selectedId={selectedId} onSelectPanel={setSelectedId} showFlow={showFlow} />

        {/* Flow legend */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 8, flexWrap: 'wrap' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: C.red }} />
            <Text style={{ color: C.muted, fontSize: 9 }}>Focal Point</Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            <View style={{ width: 16, height: 2, borderBottomWidth: 1, borderBottomColor: C.red, borderStyle: 'dashed' }} />
            <Text style={{ color: C.muted, fontSize: 9 }}>Eye Flow</Text>
          </View>
          {dominantPanel && (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <Text style={{ color: C.yellow, fontSize: 9 }}>★</Text>
              <Text style={{ color: C.muted, fontSize: 9 }}>Dominant: Panel {dominantPanel.id} (W{dominantPanel.visualWeight})</Text>
            </View>
          )}
        </View>

        {/* ── Panel Editor ────────────────────────────────────────────────── */}
        {selectedPanel ? (
          <View style={[s.editorCard, { borderColor: C.yellow + '88', backgroundColor: C.card }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
              <Text style={{ color: C.yellow, fontSize: 13, fontWeight: '800' }}>
                {TYPE_EMOJI[selectedPanel.panelType]}  PANEL {selectedPanel.id} EDITOR
              </Text>
              <TouchableOpacity onPress={() => setSelectedId(null)}>
                <Feather name="x" size={16} color={C.muted} />
              </TouchableOpacity>
            </View>

            {/* Purpose */}
            <Text style={{ color: C.muted, fontSize: 10, marginBottom: 6 }}>
              Purpose: <Text style={{ color: C.ink }}>{selectedPanel.emotionalPurpose}</Text>
            </Text>

            {/* AI Directives */}
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 5, marginBottom: 10 }}>
              {selectedPanel.aiDirectives.map(d => (
                <View key={d} style={{ backgroundColor: C.dim, borderRadius: 10, paddingHorizontal: 8, paddingVertical: 3 }}>
                  <Text style={{ color: C.yellow, fontSize: 9 }}>{d}</Text>
                </View>
              ))}
            </View>

            <SectionLabel text="PANEL TYPE" />
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={{ flexDirection: 'row' }}>
                {PANEL_TYPES.map(t => (
                  <TouchableOpacity
                    key={t}
                    onPress={() => updatePanel(selectedPanel.id, { panelType: t })}
                    activeOpacity={0.8}
                    style={[s.typeChip, {
                      borderColor: selectedPanel.panelType === t ? TYPE_COLOR[t] : C.border,
                      backgroundColor: selectedPanel.panelType === t ? TYPE_COLOR[t] + '30' : 'transparent',
                    }]}
                  >
                    <Text style={{ fontSize: 10, marginBottom: 1 }}>{TYPE_EMOJI[t]}</Text>
                    <Text style={[s.typeChipTxt, selectedPanel.panelType === t && { color: TYPE_COLOR[t] }]}>{t}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>

            <SectionLabel text="PANEL SHAPE" />
            <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
              {PANEL_SHAPES.map(sh => (
                <Chip key={sh} label={sh} active={selectedPanel.panelShape === sh} color={C.blue}
                  onPress={() => updatePanel(selectedPanel.id, { panelShape: sh })} />
              ))}
            </View>

            <SectionLabel text="EYE FLOW DIRECTION" />
            <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
              {FLOW_DIRS.map(fd => (
                <Chip key={fd} label={fd} active={selectedPanel.eyeFlow === fd} color={C.red}
                  onPress={() => updatePanel(selectedPanel.id, { eyeFlow: fd })} />
              ))}
            </View>

            <SectionLabel text="VISUAL WEIGHT  (1–10)" />
            <View style={{ flexDirection: 'row', gap: 5, flexWrap: 'wrap', marginBottom: 4 }}>
              {[1,2,3,4,5,6,7,8,9,10].map(w => (
                <TouchableOpacity
                  key={w}
                  onPress={() => updatePanel(selectedPanel.id, { visualWeight: w })}
                  style={[s.weightBtn, {
                    backgroundColor: selectedPanel.visualWeight >= w ? C.yellow : C.dim,
                    opacity: selectedPanel.visualWeight >= w ? 1 : 0.4,
                  }]}
                >
                  <Text style={{ color: C.bg, fontSize: 9, fontWeight: '700' }}>{w}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ) : (
          <View style={[s.tapHint, { borderColor: C.border }]}>
            <Feather name="mouse-pointer" size={13} color={C.muted} />
            <Text style={{ color: C.muted, fontSize: 11, marginLeft: 7 }}>Tap any panel above to edit its type, shape, flow &amp; weight</Text>
          </View>
        )}

        {/* ── Panel Summary Grid ───────────────────────────────────────────── */}
        <SectionLabel text="PANEL SUMMARY" />
        <View style={s.summaryGrid}>
          {panels.map(p => (
            <TouchableOpacity
              key={p.id}
              onPress={() => { Haptics.selectionAsync(); setSelectedId(p.id); }}
              style={[s.summaryCard, {
                borderColor: selectedId === p.id ? C.yellow : TYPE_COLOR[p.panelType] + '66',
                backgroundColor: TYPE_COLOR[p.panelType] + '12',
              }]}
            >
              <Text style={{ fontSize: 13, textAlign: 'center' }}>{TYPE_EMOJI[p.panelType]}</Text>
              <Text style={{ color: C.yellow, fontSize: 9, fontWeight: '800', marginTop: 2 }}>P{p.id}</Text>
              <Text style={{ color: TYPE_COLOR[p.panelType], fontSize: 7.5, fontWeight: '700', textAlign: 'center', marginTop: 1 }}>{p.panelType}</Text>
              <Text style={{ color: C.muted, fontSize: 7, textAlign: 'center' }}>W{p.visualWeight} · {p.eyeFlow}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* ── Optimize + Generate buttons ─────────────────────────────────── */}
        <View style={{ flexDirection: 'row', gap: 10, marginTop: 8 }}>
          <TouchableOpacity
            style={[s.optimizeBtn, { borderColor: optimized ? C.green : C.yellow, flex: 1 }]}
            onPress={optimizeFlow}
            activeOpacity={0.8}
          >
            <Feather name={optimized ? 'check-circle' : 'zap'} size={13} color={optimized ? C.green : C.yellow} />
            <Text style={[s.optimizeTxt, { color: optimized ? C.green : C.yellow }]}>
              {optimized ? 'FLOW OPTIMIZED' : 'OPTIMIZE EYE FLOW'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* ── Eye Flow Analysis ────────────────────────────────────────────── */}
        <SectionLabel text="EYE FLOW ANALYSIS" />
        <View style={[s.analysisCard, { backgroundColor: C.card, borderColor: C.border }]}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 }}>
            <Text style={{ color: C.yellow, fontSize: 11, fontWeight: '800' }}>📊 {layout.toUpperCase()} METRICS</Text>
            {optimized && <Text style={{ color: C.green, fontSize: 9, fontWeight: '700' }}>✓ OPTIMIZED</Text>}
          </View>
          {metrics.map((m) => {
            const score = optimized ? Math.min(100, m.score + 4) : m.score;
            const barColor = score >= 85 ? C.green : score >= 65 ? C.yellow : C.red;
            return (
              <View key={m.label} style={s.metricRow}>
                <Text style={s.metricLabel}>{m.label}</Text>
                <View style={{ flex: 1, height: 4, backgroundColor: C.dim, borderRadius: 2, marginHorizontal: 8 }}>
                  <View style={{ width: `${score}%`, height: 4, backgroundColor: barColor, borderRadius: 2 }} />
                </View>
                <Text style={[s.metricValue, { color: barColor }]}>{m.value}</Text>
              </View>
            );
          })}
        </View>

        {/* ── Panel Type Reference ─────────────────────────────────────────── */}
        <SectionLabel text="PANEL TYPE REFERENCE" />
        <View style={[s.refCard, { backgroundColor: C.card, borderColor: C.border }]}>
          {PANEL_TYPES.map(t => (
            <View key={t} style={s.refRow}>
              <View style={{ width: 8, height: 8, borderRadius: 2, backgroundColor: TYPE_COLOR[t], marginRight: 8 }} />
              <Text style={{ color: TYPE_COLOR[t], fontSize: 10, fontWeight: '700', width: 90 }}>{TYPE_EMOJI[t]} {t}</Text>
              <Text style={{ color: C.muted, fontSize: 9.5, flex: 1 }}>
                {t === 'ESTABLISHING' && 'Wide scene setter, max visual weight, anchors reader to location'}
                {t === 'ACTION'       && 'High-energy movement, speed lines, dynamic composition'}
                {t === 'DIALOGUE'     && 'Character interaction, speech bubbles, medium framing'}
                {t === 'EMOTIONAL'    && 'Close-up facial, inner feeling, quiet power'}
                {t === 'REVEAL'       && 'Dramatic information drop, diagonal tension'}
                {t === 'SPLASH'       && 'Full panel / page art, maximum visual impact'}
                {t === 'HORROR'       && 'Shadow, dread, extreme contrast, menacing presence'}
                {t === 'TRANSITION'   && 'Time/space shift, abstract flow, page bridge'}
                {t === 'IMPACT'       && 'Climax hit, page-turn hook, maximum weight'}
                {t === 'SILENT'       && 'No dialogue, pure visual storytelling, emotional silence'}
              </Text>
            </View>
          ))}
        </View>

        {/* ── Next Systems ─────────────────────────────────────────────────── */}
        <SectionLabel text="NEXT SYSTEMS" />
        <View style={[s.nextCard, { backgroundColor: C.card, borderColor: C.border }]}>
          {[
            '✓ AI Thumbnail Page Generator',
            '✓ Auto Dialogue Bubble Placement',
            '✓ Panel Crowding Detection',
            '✓ Manga Flow Mode',
            '✓ Page Turn Cliffhanger AI',
            '✓ Story Rhythm Analysis',
            '✓ Cinematic Storyboard Timeline',
            '✓ Action Line Detection',
            '✓ AI Reader Eye Tracking',
            '✓ Panel Psychology Engine',
            '✓ Motion Vector System',
            '✓ Panel Transition Theory',
          ].map(item => (
            <Text key={item} style={{ color: C.muted, fontSize: 10.5, marginBottom: 4 }}>{item}</Text>
          ))}
        </View>

      </ScrollView>
    </View>
  );
}

// ── Styles ─────────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  root:        { flex: 1 },
  header:      { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingBottom: 12, borderBottomWidth: 1 },
  headerTitle: { fontSize: 14, fontWeight: '900', letterSpacing: 1.5, fontFamily: 'Inter_700Bold' },
  flowToggle:  { borderWidth: 1, borderRadius: 12, paddingHorizontal: 8, paddingVertical: 4 },
  scroll:      { paddingHorizontal: 16, paddingTop: 12 },

  layoutCard:  { borderWidth: 1, borderColor: '#2E2618', borderRadius: 10, padding: 10, marginRight: 8, alignItems: 'center', minWidth: 72 },
  layoutEmoji: { fontSize: 18, color: C.ink, fontWeight: '900', marginBottom: 3 },
  layoutName:  { color: C.muted, fontSize: 9, fontWeight: '700', textAlign: 'center' },

  editorCard:  { borderWidth: 1.5, borderRadius: 12, padding: 14, marginTop: 12 },
  typeChip:    { borderWidth: 1, borderRadius: 8, paddingHorizontal: 9, paddingVertical: 6, marginRight: 6, marginBottom: 5, alignItems: 'center', minWidth: 62 },
  typeChipTxt: { color: C.muted, fontSize: 8, fontWeight: '700' },
  weightBtn:   { width: 24, height: 24, borderRadius: 4, alignItems: 'center', justifyContent: 'center' },

  tapHint:     { borderWidth: 1, borderRadius: 10, padding: 12, flexDirection: 'row', alignItems: 'center', marginTop: 10 },

  summaryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 4 },
  summaryCard: { borderWidth: 1, borderRadius: 8, padding: 8, alignItems: 'center', width: (CANVAS_W - 40) / 6 - 2, minWidth: 50 },

  optimizeBtn: { borderWidth: 1.5, borderRadius: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 12 },
  optimizeTxt: { fontSize: 11, fontWeight: '800', letterSpacing: 1 },

  analysisCard: { borderWidth: 1, borderRadius: 12, padding: 14, marginBottom: 4 },
  metricRow:    { flexDirection: 'row', alignItems: 'center', marginBottom: 9 },
  metricLabel:  { color: C.muted, fontSize: 9, fontWeight: '700', width: 120, letterSpacing: 0.5 },
  metricValue:  { fontSize: 9.5, fontWeight: '800', width: 60, textAlign: 'right' },

  refCard: { borderWidth: 1, borderRadius: 10, padding: 12, marginBottom: 4 },
  refRow:  { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 8 },

  nextCard: { borderWidth: 1, borderRadius: 10, padding: 12, marginBottom: 8 },
});
