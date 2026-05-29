import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';

// ── Palette ───────────────────────────────────────────────────────────────────
const C = {
  bg: '#0E0C0A', card: '#181410', border: '#2E2618',
  yellow: '#FFD600', red: '#E8001C', blue: '#0057A8',
  green: '#2A7A3A', purple: '#8B3FBE', orange: '#FF6A00',
  cyan: '#00C4CC', ink: '#F0EAD8', muted: '#7A6A58',
};

// ── Package map ───────────────────────────────────────────────────────────────
const PACKAGES: { pkg: string; color: string; classes: string[] }[] = [
  { pkg: 'studio',             color: C.yellow,  classes: ['Main'] },
  { pkg: 'studio.panels',      color: C.orange,  classes: ['ComicPanel', 'PanelState'] },
  { pkg: 'studio.preview',     color: C.cyan,    classes: ['FloatingPreviewWindow', 'FlipThroughViewer'] },
  { pkg: 'studio.timeline',    color: C.blue,    classes: ['StoryboardTimeline'] },
  { pkg: 'studio.memory',      color: C.purple,  classes: ['PreviousPanelMemory'] },
  { pkg: 'studio.layout',      color: C.green,   classes: ['PageCanvas'] },
  { pkg: 'studio.speech',      color: C.red,     classes: ['SpeechBubble'] },
  { pkg: 'studio.playback',    color: C.green,   classes: ['AnimaticPlayer'] },
  { pkg: 'studio.continuity',  color: C.red,     classes: ['ContinuityEngine'] },
  { pkg: 'studio.generation',  color: C.orange,  classes: ['AIPanelDirector'] },
  { pkg: 'studio.ui',          color: C.muted,   classes: ['(reserved)'] },
];

// ── PanelState enum ───────────────────────────────────────────────────────────
const PANEL_STATES: { state: string; color: string; desc: string }[] = [
  { state: 'EMPTY',     color: C.muted,   desc: 'panel created, not yet started' },
  { state: 'SKETCHING', color: C.blue,    desc: 'rough composition underway' },
  { state: 'INKING',    color: C.purple,  desc: 'line art being applied' },
  { state: 'COLORING',  color: C.orange,  desc: 'flat colours being laid in' },
  { state: 'LIGHTING',  color: C.yellow,  desc: 'lighting & shading pass' },
  { state: 'COMPLETE',  color: C.green,   desc: 'panel fully rendered' },
];

// ── ComicPanel fields (updated version) ──────────────────────────────────────
const PANEL_FIELDS: { name: string; type: string; init?: string; isNew?: boolean }[] = [
  { name: 'panelId',           type: 'String',       init: 'UUID.randomUUID()' },
  { name: 'pageNumber',        type: 'int' },
  { name: 'panelPosition',     type: 'String' },
  { name: 'fullImage',         type: 'Image' },
  { name: 'thumbnail',         type: 'Image' },
  { name: 'prompt',            type: 'String' },
  { name: 'emotion',           type: 'String' },
  { name: 'lighting',          type: 'String' },
  { name: 'cameraShot',        type: 'String' },
  { name: 'actionDescription', type: 'String' },
  { name: 'state',             type: 'PanelState',   init: 'PanelState.EMPTY', isNew: true },
  { name: 'characters',        type: 'List<String>', init: 'new ArrayList<>()' },
  { name: 'x',                 type: 'double',       isNew: true },
  { name: 'y',                 type: 'double',       isNew: true },
  { name: 'width',             type: 'double',       isNew: true },
  { name: 'height',            type: 'double',       isNew: true },
];

// ── SpeechBubble fields ───────────────────────────────────────────────────────
const BUBBLE_FIELDS: { name: string; type: string }[] = [
  { name: 'text',   type: 'String' },
  { name: 'x',      type: 'double' },
  { name: 'y',      type: 'double' },
  { name: 'width',  type: 'double' },
  { name: 'height', type: 'double' },
];

// ── Class specs ───────────────────────────────────────────────────────────────
const CLASS_SPECS: {
  name: string; pkg: string; color: string; desc: string;
  members: string[]; isHighlight?: boolean;
}[] = [
  {
    name: 'FloatingPreviewWindow', pkg: 'studio.preview', color: C.cyan, isHighlight: true,
    desc: 'Live generation preview panel — VBox with status label + ImageView 350×500',
    members: [
      'VBox root  (spacing 10)',
      'Label status  → "Waiting..."',
      'ImageView preview  (350×500, preserveRatio)',
      'updatePreview(Image, String currentStatus) — sets image + label text',
      'build() → VBox',
    ],
  },
  {
    name: 'StoryboardTimeline', pkg: 'studio.timeline', color: C.blue,
    desc: 'Horizontal HBox thumbnail strip — 180×120 thumbs, click + drag',
    members: [
      'HBox timeline  (spacing 10, padding 10)',
      'addPanel(panel) → ImageView 180×120',
      'click → "OPEN PANEL: " + panelId',
      'drag → startFullDrag()',
      'build() → ScrollPane  (hbar: ALWAYS)',
    ],
  },
  {
    name: 'PreviousPanelMemory', pkg: 'studio.memory', color: C.purple,
    desc: 'Panel history store — renamed from PreviousPanelTracker',
    members: [
      'List<ComicPanel> history',
      'remember(ComicPanel panel)',
      'previousPanel() → last | null',
      'recentPanels(int amount) → subList tail',
    ],
  },
  {
    name: 'PageCanvas', pkg: 'studio.layout', color: C.green,
    desc: 'Page compositor — Canvas 1200×1600 · panels + speech bubbles',
    members: [
      'Canvas 1200×1600  (GraphicsContext gc)',
      'List<ComicPanel> panels',
      'List<SpeechBubble> bubbles',
      'addPanel(panel) → panels.add + refreshPage()',
      'addSpeechBubble(bubble) → bubbles.add + refreshPage()',
      'refreshPage() → clearRect → drawImage(x,y,w,h) per panel → renderSpeechBubble per bubble',
      'renderSpeechBubble → fillRoundRect(x,y,w,h, arc=20,20) + fillText(text, x+10, y+25)',
      'build() → StackPane',
    ],
  },
  {
    name: 'FlipThroughViewer', pkg: 'studio.preview', color: C.cyan,
    desc: 'Left-rail page viewer — ImageView 350×500 (resized from 400×700)',
    members: [
      'ImageView viewer  (350×500, preserveRatio)',
      'showPage(Image)',
      'build() → StackPane',
    ],
  },
  {
    name: 'AnimaticPlayer', pkg: 'studio.playback', color: C.green,
    desc: 'JavaFX Timeline — 1 page/sec · INDEFINITE cycle loop',
    members: [
      'JavaFX Timeline  (setCycleCount(INDEFINITE))',
      'KeyFrame per page at Duration.seconds(i)',
      'viewer.setImage(pages.get(index)) per frame',
      'play() / stop()',
    ],
  },
  {
    name: 'SpeechBubble', pkg: 'studio.speech', color: C.red,
    desc: 'Positioned speech bubble rendered on PageCanvas gc',
    members: [
      'SpeechBubble(text, x, y, width, height)  ← constructor',
      'getText() / getX() / getY() / getWidth() / getHeight()',
    ],
  },
];

// ── Future expansions ─────────────────────────────────────────────────────────
const FUTURE: { label: string; color: string; group: string }[] = [
  { label: 'AI Cinematic Camera',        color: C.cyan,    group: 'camera' },
  { label: 'AI Camera Motion',           color: C.cyan,    group: 'camera' },
  { label: 'AI Perspective Correction',  color: C.blue,    group: 'camera' },
  { label: 'AI Panel Composition',       color: C.blue,    group: 'camera' },
  { label: 'AI Anatomy Correction',      color: C.orange,  group: 'character' },
  { label: 'AI Character Turnarounds',   color: C.orange,  group: 'character' },
  { label: 'AI Manga Speed Lines',       color: C.yellow,  group: 'fx' },
  { label: 'AI Motion Comic Playback',   color: C.yellow,  group: 'fx' },
  { label: 'AI Dynamic Lighting',        color: C.yellow,  group: 'fx' },
  { label: 'AI Sound FX Placement',      color: C.red,     group: 'fx' },
  { label: 'AI Auto Bubble Placement',   color: C.purple,  group: 'story' },
  { label: 'AI Story Flow Analysis',     color: C.purple,  group: 'story' },
  { label: 'AI Action Sequencing',       color: C.purple,  group: 'story' },
];

// ── Project folders ───────────────────────────────────────────────────────────
const FOLDERS: { path: string; indent: number }[] = [
  { path: 'ComicProject/',    indent: 0 },
  { path: 'pages/',           indent: 1 },
  { path: 'page_01/',         indent: 2 },
  { path: 'panels/',          indent: 3 },
  { path: 'thumbnails/',      indent: 3 },
  { path: 'speech/',          indent: 3 },
  { path: 'continuity/',      indent: 3 },
  { path: 'exports/',         indent: 3 },
  { path: 'characters/',      indent: 1 },
  { path: 'poses/',           indent: 1 },
  { path: 'references/',      indent: 1 },
  { path: 'animatics/',       indent: 1 },
  { path: 'timeline/',        indent: 1 },
  { path: 'backups/',         indent: 1 },
];

// ── Helpers ───────────────────────────────────────────────────────────────────
function BHeader({ title, color }: { title: string; color: string }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10, gap: 7 }}>
      <View style={{ width: 3, height: 13, backgroundColor: color, borderRadius: 2 }} />
      <Text style={{ color, fontSize: 10, fontFamily: 'Inter_700Bold', letterSpacing: 0.8 }}>{title}</Text>
    </View>
  );
}

function Chip({ label, color }: { label: string; color: string }) {
  return (
    <View style={{ backgroundColor: color + '1A', borderWidth: 1, borderColor: color + '44', borderRadius: 5, paddingHorizontal: 6, paddingVertical: 3, margin: 2 }}>
      <Text style={{ color, fontSize: 8.5, fontFamily: 'Inter_600SemiBold' }}>{label}</Text>
    </View>
  );
}

// ── Main Export ───────────────────────────────────────────────────────────────
export function FloatingPreviewReference() {
  const [expanded, setExpanded] = React.useState(false);
  type Tab = 'classes' | 'enums' | 'pipeline' | 'aidir';
  const [tab, setTab] = React.useState<Tab>('classes');

  const TABS: { id: Tab; label: string; color: string }[] = [
    { id: 'classes',  label: 'CLASSES',  color: C.cyan },
    { id: 'enums',    label: 'ENUMS',    color: C.orange },
    { id: 'pipeline', label: 'PIPELINE', color: C.green },
    { id: 'aidir',    label: 'AI DIR',   color: C.purple },
  ];

  return (
    <View style={{ marginTop: 16, borderTopWidth: 1, borderTopColor: C.border, paddingTop: 16 }}>

      <TouchableOpacity
        onPress={() => { Haptics.selectionAsync(); setExpanded(v => !v); }}
        activeOpacity={0.8}
        style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: C.card, borderWidth: 1, borderColor: C.border, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, marginBottom: 4 }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <View style={{ backgroundColor: C.cyan + '22', borderRadius: 6, padding: 5 }}>
            <Feather name="monitor" size={13} color={C.cyan} />
          </View>
          <View>
            <Text style={{ color: C.ink, fontSize: 12, fontFamily: 'Inter_700Bold', letterSpacing: 0.5 }}>
              Floating Live Preview Window
            </Text>
            <Text style={{ color: C.muted, fontSize: 9.5, fontFamily: 'Inter_400Regular', marginTop: 1 }}>
              11 packages · 10 classes · PanelState enum · SpeechBubble overlay
            </Text>
          </View>
        </View>
        <Feather name={expanded ? 'chevron-up' : 'chevron-down'} size={14} color={C.muted} />
      </TouchableOpacity>

      {expanded && (
        <View style={{ backgroundColor: C.bg, borderWidth: 1, borderColor: C.border, borderRadius: 12, padding: 14 }}>

          <Text style={{ color: C.muted, fontSize: 9.5, fontFamily: 'Inter_400Regular', marginBottom: 2, fontStyle: 'italic' }}>
            {'// Comic Art Studio — Live AI Comic Production Environment'}
          </Text>
          <Text style={{ color: C.muted, fontSize: 9.5, fontFamily: 'Inter_400Regular', marginBottom: 12, fontStyle: 'italic' }}>
            {'// Java 21+ · JavaFX · Scene 1900×1000'}
          </Text>

          {/* Tab bar */}
          <View style={{ flexDirection: 'row', gap: 5, marginBottom: 14, flexWrap: 'wrap' }}>
            {TABS.map(t => (
              <TouchableOpacity
                key={t.id}
                onPress={() => { Haptics.selectionAsync(); setTab(t.id); }}
                style={{ borderWidth: 1, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 5, borderColor: tab === t.id ? t.color : C.border, backgroundColor: tab === t.id ? t.color + '22' : 'transparent' }}
              >
                <Text style={{ color: tab === t.id ? t.color : C.muted, fontSize: 9, fontFamily: 'Inter_700Bold', letterSpacing: 0.8 }}>{t.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* ── CLASSES ── */}
          {tab === 'classes' && (
            <View>
              {/* BorderPane layout */}
              <BHeader title="Main.java — BorderPane layout  (Scene 1900×1000)" color={C.yellow} />
              <View style={{ backgroundColor: C.card, borderRadius: 8, padding: 10, borderWidth: 1, borderColor: C.border, marginBottom: 16 }}>
                {[
                  { pos: 'CENTER', cls: 'PageCanvas',             color: C.green,  desc: '1200×1600 · panels + speech bubbles' },
                  { pos: 'RIGHT',  cls: 'FloatingPreviewWindow',  color: C.cyan,   desc: '350×500 · status label + live image' },
                  { pos: 'BOTTOM', cls: 'StoryboardTimeline',     color: C.blue,   desc: 'horizontal thumbnail strip' },
                  { pos: 'LEFT',   cls: 'FlipThroughViewer',      color: C.cyan,   desc: '350×500 · page flip viewer' },
                ].map(row => (
                  <View key={row.pos} style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 5, borderBottomWidth: 1, borderBottomColor: C.border }}>
                    <View style={{ backgroundColor: C.yellow + '20', borderRadius: 4, paddingHorizontal: 5, paddingVertical: 2, width: 56, alignItems: 'center', marginRight: 8 }}>
                      <Text style={{ color: C.yellow, fontSize: 8, fontFamily: 'Inter_700Bold' }}>{row.pos}</Text>
                    </View>
                    <View style={{ backgroundColor: row.color + '20', borderRadius: 4, paddingHorizontal: 5, paddingVertical: 2, marginRight: 8 }}>
                      <Text style={{ color: row.color, fontSize: 8.5, fontFamily: 'Inter_700Bold' }}>{row.cls}</Text>
                    </View>
                    <Text style={{ color: C.muted, fontSize: 9, fontFamily: 'Inter_400Regular', flex: 1 }}>{row.desc}</Text>
                  </View>
                ))}
              </View>

              {/* FloatingPreviewWindow highlight */}
              <BHeader title="★  FloatingPreviewWindow  — key new class" color={C.cyan} />
              <View style={{ backgroundColor: C.cyan + '0D', borderRadius: 10, padding: 12, borderWidth: 1, borderColor: C.cyan + '44', marginBottom: 16 }}>
                <Text style={{ color: C.muted, fontSize: 9, fontFamily: 'Inter_400Regular', marginBottom: 8, fontStyle: 'italic' }}>
                  {'// studio.preview — VBox(10) with status Label + ImageView 350×500'}
                </Text>
                {[
                  { sig: 'Label status',                              color: C.cyan,   note: 'init: "Waiting..."' },
                  { sig: 'ImageView preview  (350×500)',              color: C.cyan,   note: 'preserveRatio: true' },
                  { sig: 'updatePreview(Image, String currentStatus)', color: C.yellow, note: 'sets image + label text' },
                  { sig: 'build() → VBox',                           color: C.green,  note: 'root container' },
                ].map((m, i) => (
                  <View key={i} style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 4, borderBottomWidth: i < 3 ? 1 : 0, borderBottomColor: C.border }}>
                    <View style={{ backgroundColor: m.color + '20', borderRadius: 4, paddingHorizontal: 5, paddingVertical: 2, marginRight: 8, flex: 1 }}>
                      <Text style={{ color: m.color, fontSize: 9, fontFamily: 'Inter_600SemiBold' }}>{m.sig}</Text>
                    </View>
                    <Text style={{ color: C.muted, fontSize: 8.5, fontFamily: 'Inter_400Regular', fontStyle: 'italic', width: 110, textAlign: 'right' }}>{m.note}</Text>
                  </View>
                ))}
              </View>

              {/* Package map */}
              <BHeader title="Package structure  (11 packages · 10 classes)" color={C.blue} />
              {PACKAGES.map((pkg, pi) => (
                <View key={pkg.pkg} style={{ paddingVertical: 6, borderBottomWidth: pi < PACKAGES.length - 1 ? 1 : 0, borderBottomColor: C.border }}>
                  <Text style={{ color: pkg.color, fontSize: 9, fontFamily: 'Inter_700Bold', marginBottom: 4 }}>{pkg.pkg}</Text>
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', paddingLeft: 8 }}>
                    {pkg.classes.map(cls => <Chip key={cls} label={cls} color={pkg.color} />)}
                  </View>
                </View>
              ))}

              <View style={{ height: 14 }} />

              {/* Remaining class specs */}
              <BHeader title="All class specs" color={C.orange} />
              {CLASS_SPECS.map((cs, i) => (
                <View key={cs.name} style={{ paddingVertical: 9, borderBottomWidth: i < CLASS_SPECS.length - 1 ? 1 : 0, borderBottomColor: C.border, backgroundColor: cs.isHighlight ? C.cyan + '08' : 'transparent', borderRadius: cs.isHighlight ? 8 : 0, paddingHorizontal: cs.isHighlight ? 8 : 0 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4, flexWrap: 'wrap' }}>
                    <View style={{ backgroundColor: cs.color + '20', borderRadius: 5, paddingHorizontal: 6, paddingVertical: 3 }}>
                      <Text style={{ color: cs.color, fontSize: 9.5, fontFamily: 'Inter_700Bold' }}>{cs.name}</Text>
                    </View>
                    <Text style={{ color: C.muted, fontSize: 8.5, fontFamily: 'Inter_400Regular', fontStyle: 'italic' }}>{cs.pkg}</Text>
                    {cs.isHighlight && (
                      <View style={{ backgroundColor: C.cyan + '30', borderRadius: 4, paddingHorizontal: 5, paddingVertical: 2 }}>
                        <Text style={{ color: C.cyan, fontSize: 7.5, fontFamily: 'Inter_700Bold' }}>NEW</Text>
                      </View>
                    )}
                  </View>
                  <Text style={{ color: C.muted, fontSize: 9, fontFamily: 'Inter_400Regular', marginBottom: 6 }}>{cs.desc}</Text>
                  {cs.members.map((m, mi) => (
                    <View key={mi} style={{ flexDirection: 'row', paddingVertical: 2 }}>
                      <Text style={{ color: cs.color, fontSize: 9, fontFamily: 'Inter_700Bold', width: 10 }}>·</Text>
                      <Text style={{ color: C.ink, fontSize: 9, fontFamily: 'Inter_400Regular', flex: 1 }}>{m}</Text>
                    </View>
                  ))}
                </View>
              ))}
            </View>
          )}

          {/* ── ENUMS ── */}
          {tab === 'enums' && (
            <View>
              {/* PanelState enum */}
              <BHeader title="enum PanelState  (studio.panels)" color={C.orange} />
              <Text style={{ color: C.muted, fontSize: 9, fontFamily: 'Inter_400Regular', marginBottom: 10, fontStyle: 'italic' }}>
                {'// ComicPanel.state init: PanelState.EMPTY\n// AIPanelDirector steps through each state in sequence'}
              </Text>
              {PANEL_STATES.map((s, i) => (
                <View key={s.state} style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 6, borderBottomWidth: i < PANEL_STATES.length - 1 ? 1 : 0, borderBottomColor: C.border }}>
                  <View style={{ width: 22, height: 22, borderRadius: 11, backgroundColor: s.color + '30', borderWidth: 1, borderColor: s.color + '60', alignItems: 'center', justifyContent: 'center', marginRight: 10, flexShrink: 0 }}>
                    <Text style={{ color: s.color, fontSize: 8, fontFamily: 'Inter_700Bold' }}>{i}</Text>
                  </View>
                  <View style={{ backgroundColor: s.color + '20', borderRadius: 5, paddingHorizontal: 7, paddingVertical: 3, marginRight: 10, minWidth: 78, alignItems: 'center' }}>
                    <Text style={{ color: s.color, fontSize: 9, fontFamily: 'Inter_700Bold' }}>{s.state}</Text>
                  </View>
                  <Text style={{ color: C.muted, fontSize: 9.5, fontFamily: 'Inter_400Regular', flex: 1 }}>{s.desc}</Text>
                </View>
              ))}

              <View style={{ height: 16 }} />

              {/* ComicPanel fields — updated */}
              <BHeader title="class ComicPanel — fields  (updated)" color={C.orange} />
              <Text style={{ color: C.muted, fontSize: 9, fontFamily: 'Inter_400Regular', marginBottom: 8, fontStyle: 'italic' }}>
                {'// NEW fields highlighted — x / y / width / height + PanelState'}
              </Text>
              {PANEL_FIELDS.map((f, i) => (
                <View key={f.name} style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 4, borderBottomWidth: i < PANEL_FIELDS.length - 1 ? 1 : 0, borderBottomColor: C.border, backgroundColor: f.isNew ? C.cyan + '08' : 'transparent' }}>
                  <View style={{ backgroundColor: (f.isNew ? C.cyan : C.orange) + '1A', borderRadius: 4, paddingHorizontal: 5, paddingVertical: 2, marginRight: 8, minWidth: 86, alignItems: 'center' }}>
                    <Text style={{ color: f.isNew ? C.cyan : C.orange, fontSize: 8, fontFamily: 'Inter_700Bold' }}>{f.type}</Text>
                  </View>
                  <Text style={{ color: f.isNew ? C.cyan : C.ink, fontSize: 10, fontFamily: f.isNew ? 'Inter_600SemiBold' : 'Inter_400Regular', flex: 1 }}>{f.name}</Text>
                  {f.init && (
                    <Text style={{ color: C.muted, fontSize: 8, fontFamily: 'Inter_400Regular', fontStyle: 'italic' }}>{f.init}</Text>
                  )}
                  {f.isNew && (
                    <View style={{ backgroundColor: C.cyan + '30', borderRadius: 3, paddingHorizontal: 4, paddingVertical: 1, marginLeft: 4 }}>
                      <Text style={{ color: C.cyan, fontSize: 7, fontFamily: 'Inter_700Bold' }}>NEW</Text>
                    </View>
                  )}
                </View>
              ))}

              <View style={{ height: 16 }} />

              {/* SpeechBubble fields */}
              <BHeader title="class SpeechBubble  (studio.speech)" color={C.red} />
              <Text style={{ color: C.muted, fontSize: 9, fontFamily: 'Inter_400Regular', marginBottom: 8, fontStyle: 'italic' }}>
                {'// Rendered on PageCanvas via fillRoundRect(x, y, w, h, arcW=20, arcH=20)\n// Text drawn at fillText(text, x+10, y+25)'}
              </Text>
              <View style={{ backgroundColor: C.card, borderRadius: 8, padding: 10, borderWidth: 1, borderColor: C.border, marginBottom: 10 }}>
                <Text style={{ color: C.muted, fontSize: 9, fontFamily: 'Inter_700Bold', marginBottom: 6 }}>Constructor:</Text>
                <Text style={{ color: C.yellow, fontSize: 9.5, fontFamily: 'Inter_400Regular', lineHeight: 15 }}>
                  {'SpeechBubble(String text, double x, double y, double width, double height)'}
                </Text>
              </View>
              {BUBBLE_FIELDS.map((f, i) => (
                <View key={f.name} style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 4, borderBottomWidth: i < BUBBLE_FIELDS.length - 1 ? 1 : 0, borderBottomColor: C.border }}>
                  <View style={{ backgroundColor: C.red + '1A', borderRadius: 4, paddingHorizontal: 5, paddingVertical: 2, marginRight: 8, minWidth: 56, alignItems: 'center' }}>
                    <Text style={{ color: C.red, fontSize: 8, fontFamily: 'Inter_700Bold' }}>{f.type}</Text>
                  </View>
                  <Text style={{ color: C.ink, fontSize: 10, fontFamily: 'Inter_400Regular', flex: 1 }}>{f.name}</Text>
                </View>
              ))}

              <View style={{ height: 16 }} />

              {/* PreviousPanelMemory */}
              <BHeader title="class PreviousPanelMemory  (studio.memory)" color={C.purple} />
              <Text style={{ color: C.muted, fontSize: 9, fontFamily: 'Inter_400Regular', marginBottom: 8, fontStyle: 'italic' }}>
                {'// Renamed from PreviousPanelTracker · method names also changed'}
              </Text>
              {[
                { sig: 'remember(ComicPanel panel)',    ret: 'void',            note: 'was: addPanel()' },
                { sig: 'previousPanel()',               ret: 'ComicPanel|null', note: 'was: getPreviousPanel()' },
                { sig: 'recentPanels(int amount)',      ret: 'List<ComicPanel>',note: 'was: getRecentPanels()' },
              ].map((m, i) => (
                <View key={i} style={{ paddingVertical: 5, borderBottomWidth: i < 2 ? 1 : 0, borderBottomColor: C.border }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                    <View style={{ backgroundColor: C.purple + '20', borderRadius: 4, paddingHorizontal: 5, paddingVertical: 2 }}>
                      <Text style={{ color: C.purple, fontSize: 8, fontFamily: 'Inter_700Bold' }}>{m.ret}</Text>
                    </View>
                    <Text style={{ color: C.ink, fontSize: 9.5, fontFamily: 'Inter_600SemiBold', flex: 1 }}>{m.sig}</Text>
                  </View>
                  <Text style={{ color: C.muted, fontSize: 8.5, fontFamily: 'Inter_400Regular', paddingLeft: 8, fontStyle: 'italic' }}>{m.note}</Text>
                </View>
              ))}
            </View>
          )}

          {/* ── PIPELINE ── */}
          {tab === 'pipeline' && (
            <View>
              {/* AIPanelDirector with PanelState progression */}
              <BHeader title="AIPanelDirector.generatePanel(previous)" color={C.orange} />
              <Text style={{ color: C.muted, fontSize: 9, fontFamily: 'Inter_400Regular', marginBottom: 8, fontStyle: 'italic' }}>
                {'// PanelState enum steps wired into generation — state drives FloatingPreviewWindow.status'}
              </Text>
              <View style={{ backgroundColor: C.card, borderRadius: 8, padding: 12, borderWidth: 1, borderColor: C.border, marginBottom: 16 }}>
                {PANEL_STATES.filter(s => s.state !== 'EMPTY').map((s, i, arr) => (
                  <View key={s.state} style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 5, borderBottomWidth: i < arr.length - 1 ? 1 : 0, borderBottomColor: C.border }}>
                    <View style={{ width: 22, height: 22, borderRadius: 11, backgroundColor: s.color + '30', borderWidth: 1, borderColor: s.color + '60', alignItems: 'center', justifyContent: 'center', marginRight: 10, flexShrink: 0 }}>
                      <Text style={{ color: s.color, fontSize: 8, fontFamily: 'Inter_700Bold' }}>{i + 1}</Text>
                    </View>
                    <View style={{ backgroundColor: s.color + '20', borderRadius: 5, paddingHorizontal: 6, paddingVertical: 2, marginRight: 8, minWidth: 70, alignItems: 'center' }}>
                      <Text style={{ color: s.color, fontSize: 8.5, fontFamily: 'Inter_700Bold' }}>
                        {'PanelState.' + s.state}
                      </Text>
                    </View>
                    <Text style={{ color: C.muted, fontSize: 9, fontFamily: 'Inter_400Regular', flex: 1, fontStyle: 'italic' }}>
                      {'println("' + (s.state === 'COMPLETE' ? 'Complete.' : s.state.charAt(0) + s.state.slice(1).toLowerCase() + '...') + '")'}
                    </Text>
                  </View>
                ))}
                <Text style={{ color: C.muted, fontSize: 9, fontFamily: 'Inter_400Regular', marginTop: 8, fontStyle: 'italic' }}>
                  Returns new ComicPanel — inherits previous emotion/lighting via ContinuityEngine
                </Text>
              </View>

              {/* ContinuityEngine */}
              <BHeader title="ContinuityEngine.buildContinuityPrompt()" color={C.red} />
              <View style={{ backgroundColor: '#0A0800', borderRadius: 8, padding: 10, borderWidth: 1, borderColor: C.border, marginBottom: 16 }}>
                <Text style={{ color: C.yellow, fontSize: 9.5, fontFamily: 'Inter_400Regular', lineHeight: 15 }}>
                  {'"Maintain same costume. "\n+ "Maintain lighting: " + previousPanel.getLighting() + ". "\n+ "Maintain emotion: " + previousPanel.getEmotion() + ". "\n+ "Continue motion direction."'}
                </Text>
              </View>

              {/* AnimaticPlayer — INDEFINITE */}
              <BHeader title="AnimaticPlayer — INDEFINITE cycle loop" color={C.green} />
              <View style={{ backgroundColor: C.card, borderRadius: 8, padding: 12, borderWidth: 1, borderColor: C.border, marginBottom: 16 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  <View style={{ backgroundColor: C.green + '20', borderRadius: 5, paddingHorizontal: 7, paddingVertical: 3 }}>
                    <Text style={{ color: C.green, fontSize: 9, fontFamily: 'Inter_700Bold' }}>setCycleCount(INDEFINITE)</Text>
                  </View>
                  <Text style={{ color: C.muted, fontSize: 9, fontFamily: 'Inter_400Regular', fontStyle: 'italic' }}>loops forever (was: single play)</Text>
                </View>
                <Text style={{ color: C.yellow, fontSize: 9.5, fontFamily: 'Inter_400Regular', lineHeight: 15 }}>
                  {'for (int i = 0; i < pages.size(); i++) {\n  addKeyFrame(\n    Duration.seconds(i),\n    viewer.setImage(pages.get(i))\n  );\n}\ntimeline.setCycleCount(Timeline.INDEFINITE);\nplay() / stop()'}
                </Text>
              </View>

              {/* PageCanvas speech bubble render */}
              <BHeader title="PageCanvas.refreshPage() — speech bubble render" color={C.red} />
              <View style={{ backgroundColor: '#0A0800', borderRadius: 8, padding: 10, borderWidth: 1, borderColor: C.border }}>
                <Text style={{ color: C.muted, fontSize: 9, fontFamily: 'Inter_400Regular', marginBottom: 6, fontStyle: 'italic' }}>{'// After drawing panels, draws each SpeechBubble'}</Text>
                <Text style={{ color: C.yellow, fontSize: 9.5, fontFamily: 'Inter_400Regular', lineHeight: 15 }}>
                  {'gc.fillRoundRect(\n  bubble.getX(),  bubble.getY(),\n  bubble.getWidth(), bubble.getHeight(),\n  20, 20  // arcWidth, arcHeight\n);\ngc.fillText(\n  bubble.getText(),\n  bubble.getX() + 10,\n  bubble.getY() + 25\n);'}
                </Text>
              </View>
            </View>
          )}

          {/* ── AI DIR ── */}
          {tab === 'aidir' && (
            <View>
              <BHeader title={`Future Expansions  (${FUTURE.length} systems)`} color={C.cyan} />
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginBottom: 16 }}>
                {FUTURE.map(f => <Chip key={f.label} label={f.label} color={f.color} />)}
              </View>

              {[
                { group: 'Camera & Composition', color: C.cyan,   g: 'camera' },
                { group: 'Character & Anatomy',  color: C.orange, g: 'character' },
                { group: 'Visual FX',            color: C.yellow, g: 'fx' },
                { group: 'Story & Pacing',       color: C.purple, g: 'story' },
              ].map(grp => (
                <View key={grp.group} style={{ marginBottom: 12 }}>
                  <BHeader title={grp.group} color={grp.color} />
                  {FUTURE.filter(f => f.group === grp.g).map(f => (
                    <View key={f.label} style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 3 }}>
                      <Feather name="check-circle" size={10} color={grp.color} style={{ marginRight: 8 }} />
                      <Text style={{ color: C.ink, fontSize: 9.5, fontFamily: 'Inter_400Regular' }}>{f.label}</Text>
                    </View>
                  ))}
                </View>
              ))}

              <View style={{ height: 14 }} />

              <BHeader title="ComicProject/ — folder structure" color={C.purple} />
              <View style={{ backgroundColor: '#0A0800', borderRadius: 8, padding: 12, borderWidth: 1, borderColor: C.border }}>
                {FOLDERS.map((f, i) => (
                  <View key={i} style={{ flexDirection: 'row', paddingVertical: 2 }}>
                    <Text style={{ color: C.muted, width: f.indent * 14 }} />
                    <Text style={{
                      color: f.indent === 0 ? C.yellow : f.indent === 1 ? C.orange : f.indent === 2 ? C.cyan : C.blue,
                      fontSize: 9.5, fontFamily: 'Inter_400Regular',
                    }}>
                      {f.indent > 0 ? '├── ' : ''}{f.path}
                    </Text>
                  </View>
                ))}
                <Text style={{ color: C.red, fontSize: 8.5, fontFamily: 'Inter_400Regular', marginTop: 8, fontStyle: 'italic' }}>
                  note: speech/ replaces thumbnails/ at page level
                </Text>
              </View>
            </View>
          )}

          <Text style={{ color: C.border, fontSize: 9, fontFamily: 'Inter_400Regular', marginTop: 16, textAlign: 'center', letterSpacing: 0.5 }}>
            AI REFERENCE ONLY · NOT IMPLEMENTED · Live AI Comic Production Environment
          </Text>
        </View>
      )}
    </View>
  );
}
