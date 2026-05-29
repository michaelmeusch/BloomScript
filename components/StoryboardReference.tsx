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
  { pkg: 'studio.panels',      color: C.orange,  classes: ['ComicPanel'] },
  { pkg: 'studio.preview',     color: C.cyan,    classes: ['LiveRenderPanel', 'FlipThroughViewer'] },
  { pkg: 'studio.timeline',    color: C.blue,    classes: ['StoryboardTimeline', 'PreviousPanelTracker'] },
  { pkg: 'studio.layout',      color: C.purple,  classes: ['PageCanvas'] },
  { pkg: 'studio.playback',    color: C.green,   classes: ['AnimaticPlayer'] },
  { pkg: 'studio.continuity',  color: C.red,     classes: ['ContinuityEngine'] },
  { pkg: 'studio.generation',  color: C.orange,  classes: ['AIPanelDirector', 'GenerationStatus'] },
];

// ── ComicPanel fields ─────────────────────────────────────────────────────────
const PANEL_FIELDS: { name: string; type: string; note?: string }[] = [
  { name: 'panelId',           type: 'String',       note: 'UUID.randomUUID()' },
  { name: 'pageNumber',        type: 'int' },
  { name: 'panelPosition',     type: 'String' },
  { name: 'fullImage',         type: 'Image' },
  { name: 'thumbnail',         type: 'Image' },
  { name: 'prompt',            type: 'String' },
  { name: 'cameraShot',        type: 'String' },
  { name: 'poseType',          type: 'String' },
  { name: 'emotion',           type: 'String' },
  { name: 'lighting',          type: 'String' },
  { name: 'actionDescription', type: 'String' },
  { name: 'characters',        type: 'List<String>', note: 'new ArrayList<>()' },
];

// ── Class specs ───────────────────────────────────────────────────────────────
const CLASS_SPECS: {
  name: string; pkg: string; color: string;
  desc: string; members: string[];
}[] = [
  {
    name: 'LiveRenderPanel', pkg: 'studio.preview', color: C.cyan,
    desc: 'Live generation preview window — ImageView 500×700',
    members: ['ImageView preview  (500×700, preserveRatio)', 'updatePreview(Image) — swaps live image', 'build() → StackPane'],
  },
  {
    name: 'StoryboardTimeline', pkg: 'studio.timeline', color: C.blue,
    desc: 'Horizontal thumbnail strip — HBox with drag & click support',
    members: ['HBox timeline  (spacing 10, padding 10)', 'addPanel(panel) → ImageView 180×120 thumb', 'click → "OPEN PANEL: {panelId}"', 'drag → startFullDrag()', 'build() → ScrollPane (hbar always visible)'],
  },
  {
    name: 'PreviousPanelTracker', pkg: 'studio.timeline', color: C.blue,
    desc: 'Panel history list — continuity lookback',
    members: ['List<ComicPanel> history', 'addPanel(panel)', 'getPreviousPanel() → last entry | null', 'getRecentPanels(amount) → subList tail'],
  },
  {
    name: 'PageCanvas', pkg: 'studio.layout', color: C.purple,
    desc: 'Main page compositor — Canvas 1200×1600',
    members: ['Canvas 1200×1600  (GraphicsContext gc)', 'List<ComicPanel> panels', 'addPanel(panel) → panels.add + redraw()', 'redraw() → clearRect + drawImage each panel at 400×400', 'build() → StackPane'],
  },
  {
    name: 'FlipThroughViewer', pkg: 'studio.preview', color: C.cyan,
    desc: 'Left-rail page viewer — ImageView 400×700',
    members: ['ImageView viewer  (400×700, preserveRatio)', 'showPage(Image) — flips to page', 'build() → StackPane'],
  },
  {
    name: 'AnimaticPlayer', pkg: 'studio.playback', color: C.green,
    desc: 'JavaFX Timeline — 1 page per second cinematic playback',
    members: ['JavaFX Timeline', 'KeyFrame per page at Duration.seconds(i)', 'viewer.setImage(pages.get(index)) per frame', 'play() / stop()'],
  },
  {
    name: 'ContinuityEngine', pkg: 'studio.continuity', color: C.red,
    desc: 'Builds AI prompt fragment to maintain panel-to-panel continuity',
    members: [
      'buildContinuityPrompt(previousPanel) → String',
      '"Maintain same costume. "',
      '"Maintain same lighting: {panel.getLighting()}. "',
      '"Maintain emotional continuity: {panel.getEmotion()}. "',
      '"Continue motion direction."',
    ],
  },
  {
    name: 'AIPanelDirector', pkg: 'studio.generation', color: C.orange,
    desc: 'Generates next ComicPanel from previous — continuity-aware',
    members: [
      'generateNextPanel(previousPanel) → ComicPanel',
      'next.setEmotion(previous.getEmotion())',
      'next.setLighting(previous.getLighting())',
      'next.setCameraShot("CLOSE_UP")',
      'next.setPrompt("Dynamic cinematic comic panel")',
    ],
  },
  {
    name: 'GenerationStatus', pkg: 'studio.generation', color: C.yellow,
    desc: 'Static status broadcaster for AI generation pipeline steps',
    members: ['showStatus(String step) → "AI STATUS: " + step'],
  },
];

// ── Generation pipeline steps ─────────────────────────────────────────────────
const GEN_STEPS: { step: number; label: string; color: string }[] = [
  { step: 1, label: 'Sketching...',  color: C.blue },
  { step: 2, label: 'Inking...',     color: C.purple },
  { step: 3, label: 'Coloring...',   color: C.orange },
  { step: 4, label: 'Lighting...',   color: C.yellow },
  { step: 5, label: 'Finalizing...', color: C.green },
];

// ── Future expansions ─────────────────────────────────────────────────────────
const FUTURE: { label: string; color: string }[] = [
  { label: 'AI Cinematic Camera',        color: C.cyan },
  { label: 'AI Page Composition',        color: C.blue },
  { label: 'AI Manga Speed Lines',       color: C.yellow },
  { label: 'AI Bubble Placement',        color: C.orange },
  { label: 'AI Pose Suggestions',        color: C.purple },
  { label: 'AI Motion Blur',             color: C.cyan },
  { label: 'AI Sound FX Placement',      color: C.red },
  { label: 'AI Eye Flow Analyzer',       color: C.green },
  { label: 'AI Character Turnarounds',   color: C.orange },
  { label: 'AI Anatomy Correction',      color: C.blue },
  { label: 'AI Perspective Correction',  color: C.purple },
  { label: 'AI Story Pacing',            color: C.yellow },
  { label: 'AI Panel Sequencing',        color: C.cyan },
];

// ── Project folder structure ──────────────────────────────────────────────────
const FOLDERS: { path: string; indent: number; color: string }[] = [
  { path: 'ComicProject/',          indent: 0, color: C.yellow },
  { path: 'pages/',                 indent: 1, color: C.orange },
  { path: 'page_01/',               indent: 2, color: C.muted },
  { path: 'panels/',                indent: 3, color: C.blue },
  { path: 'thumbnails/',            indent: 3, color: C.blue },
  { path: 'prompts/',               indent: 3, color: C.blue },
  { path: 'continuity/',            indent: 3, color: C.red },
  { path: 'exports/',               indent: 3, color: C.green },
  { path: 'characters/',            indent: 1, color: C.orange },
  { path: 'poses/',                 indent: 1, color: C.orange },
  { path: 'references/',            indent: 1, color: C.orange },
  { path: 'timeline/',              indent: 1, color: C.orange },
  { path: 'animatics/',             indent: 1, color: C.orange },
  { path: 'backups/',               indent: 1, color: C.muted },
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

function CodeBlock({ children }: { children: string }) {
  return (
    <View style={{ backgroundColor: '#0A0800', borderRadius: 8, padding: 10, borderWidth: 1, borderColor: C.border }}>
      <Text style={{ color: C.yellow, fontSize: 9.5, fontFamily: 'Inter_400Regular', lineHeight: 15 }}>{children}</Text>
    </View>
  );
}

// ── Main Export ───────────────────────────────────────────────────────────────
export function StoryboardReference() {
  const [expanded, setExpanded] = React.useState(false);
  type Tab = 'classes' | 'fields' | 'pipeline' | 'aidir';
  const [tab, setTab] = React.useState<Tab>('classes');

  const TABS: { id: Tab; label: string; color: string }[] = [
    { id: 'classes',  label: 'CLASSES',  color: C.blue },
    { id: 'fields',   label: 'FIELDS',   color: C.orange },
    { id: 'pipeline', label: 'PIPELINE', color: C.green },
    { id: 'aidir',    label: 'AI DIR',   color: C.cyan },
  ];

  return (
    <View style={{ marginTop: 16, borderTopWidth: 1, borderTopColor: C.border, paddingTop: 16 }}>

      <TouchableOpacity
        onPress={() => { Haptics.selectionAsync(); setExpanded(v => !v); }}
        activeOpacity={0.8}
        style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: C.card, borderWidth: 1, borderColor: C.border, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, marginBottom: 4 }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <View style={{ backgroundColor: C.blue + '22', borderRadius: 6, padding: 5 }}>
            <Feather name="film" size={13} color={C.blue} />
          </View>
          <View>
            <Text style={{ color: C.ink, fontSize: 12, fontFamily: 'Inter_700Bold', letterSpacing: 0.5 }}>
              Live Storyboard + Flip-Through System
            </Text>
            <Text style={{ color: C.muted, fontSize: 9.5, fontFamily: 'Inter_400Regular', marginTop: 1 }}>
              9 classes · 8 packages · ComicPanel · ContinuityEngine · AnimaticPlayer
            </Text>
          </View>
        </View>
        <Feather name={expanded ? 'chevron-up' : 'chevron-down'} size={14} color={C.muted} />
      </TouchableOpacity>

      {expanded && (
        <View style={{ backgroundColor: C.bg, borderWidth: 1, borderColor: C.border, borderRadius: 12, padding: 14 }}>

          <Text style={{ color: C.muted, fontSize: 9.5, fontFamily: 'Inter_400Regular', marginBottom: 2, fontStyle: 'italic' }}>
            {'// Comic Art Studio — Live Storyboard + Flip-Through System'}
          </Text>
          <Text style={{ color: C.muted, fontSize: 9.5, fontFamily: 'Inter_400Regular', marginBottom: 12, fontStyle: 'italic' }}>
            {'// Java 21+ · JavaFX · BufferedImage · Timeline Animation · Canvas Rendering'}
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

          {/* ── CLASSES tab ── */}
          {tab === 'classes' && (
            <View>
              {/* BorderPane layout */}
              <BHeader title="Main.java — BorderPane layout" color={C.yellow} />
              <View style={{ backgroundColor: C.card, borderRadius: 8, padding: 10, borderWidth: 1, borderColor: C.border, marginBottom: 16 }}>
                {[
                  { pos: 'CENTER', cls: 'PageCanvas',          color: C.purple, desc: '1200×1600 panel compositor' },
                  { pos: 'BOTTOM', cls: 'StoryboardTimeline',  color: C.blue,   desc: 'horizontal thumbnail strip' },
                  { pos: 'RIGHT',  cls: 'LiveRenderPanel',      color: C.cyan,   desc: '500×700 live preview' },
                  { pos: 'LEFT',   cls: 'FlipThroughViewer',   color: C.cyan,   desc: '400×700 page viewer' },
                ].map(row => (
                  <View key={row.pos} style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 4, borderBottomWidth: 1, borderBottomColor: C.border }}>
                    <View style={{ backgroundColor: C.yellow + '20', borderRadius: 4, paddingHorizontal: 5, paddingVertical: 2, width: 56, alignItems: 'center', marginRight: 8 }}>
                      <Text style={{ color: C.yellow, fontSize: 8, fontFamily: 'Inter_700Bold' }}>{row.pos}</Text>
                    </View>
                    <View style={{ backgroundColor: row.color + '20', borderRadius: 4, paddingHorizontal: 5, paddingVertical: 2, marginRight: 8 }}>
                      <Text style={{ color: row.color, fontSize: 8.5, fontFamily: 'Inter_700Bold' }}>{row.cls}</Text>
                    </View>
                    <Text style={{ color: C.muted, fontSize: 9, fontFamily: 'Inter_400Regular' }}>{row.desc}</Text>
                  </View>
                ))}
                <Text style={{ color: C.muted, fontSize: 9, fontFamily: 'Inter_400Regular', marginTop: 6, fontStyle: 'italic' }}>
                  {'Scene 1800×1000 · stage.setTitle("Comic Art Studio")'}
                </Text>
              </View>

              {/* Package map */}
              <BHeader title="Package structure  (8 packages · 9 classes)" color={C.blue} />
              {PACKAGES.map((pkg, pi) => (
                <View key={pkg.pkg} style={{ paddingVertical: 6, borderBottomWidth: pi < PACKAGES.length - 1 ? 1 : 0, borderBottomColor: C.border }}>
                  <Text style={{ color: pkg.color, fontSize: 9, fontFamily: 'Inter_700Bold', marginBottom: 4 }}>{pkg.pkg}</Text>
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', paddingLeft: 8 }}>
                    {pkg.classes.map(cls => <Chip key={cls} label={cls} color={pkg.color} />)}
                  </View>
                </View>
              ))}

              <View style={{ height: 14 }} />

              {/* Each class spec */}
              <BHeader title="Class specs" color={C.orange} />
              {CLASS_SPECS.map((cs, i) => (
                <View key={cs.name} style={{ paddingVertical: 9, borderBottomWidth: i < CLASS_SPECS.length - 1 ? 1 : 0, borderBottomColor: C.border }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4, flexWrap: 'wrap' }}>
                    <View style={{ backgroundColor: cs.color + '20', borderRadius: 5, paddingHorizontal: 6, paddingVertical: 3 }}>
                      <Text style={{ color: cs.color, fontSize: 9.5, fontFamily: 'Inter_700Bold' }}>{cs.name}</Text>
                    </View>
                    <Text style={{ color: C.muted, fontSize: 8.5, fontFamily: 'Inter_400Regular', fontStyle: 'italic' }}>{cs.pkg}</Text>
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

          {/* ── FIELDS tab ── */}
          {tab === 'fields' && (
            <View>
              {/* ComicPanel */}
              <BHeader title="class ComicPanel  (studio.panels)" color={C.orange} />
              <Text style={{ color: C.muted, fontSize: 9, fontFamily: 'Inter_400Regular', marginBottom: 10, fontStyle: 'italic' }}>
                {'// panelId auto-set: UUID.randomUUID().toString()\n// characters auto-init: new ArrayList<>()'}
              </Text>
              {PANEL_FIELDS.map((f, i) => (
                <View key={f.name} style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 4, borderBottomWidth: i < PANEL_FIELDS.length - 1 ? 1 : 0, borderBottomColor: C.border }}>
                  <View style={{ backgroundColor: C.orange + '1A', borderRadius: 4, paddingHorizontal: 5, paddingVertical: 2, marginRight: 8, minWidth: 86, alignItems: 'center' }}>
                    <Text style={{ color: C.orange, fontSize: 8, fontFamily: 'Inter_700Bold' }}>{f.type}</Text>
                  </View>
                  <Text style={{ color: C.ink, fontSize: 10, fontFamily: 'Inter_400Regular', flex: 1 }}>{f.name}</Text>
                  {f.note && (
                    <Text style={{ color: C.muted, fontSize: 8.5, fontFamily: 'Inter_400Regular', fontStyle: 'italic' }}>{f.note}</Text>
                  )}
                </View>
              ))}

              <View style={{ height: 16 }} />

              {/* PreviousPanelTracker */}
              <BHeader title="PreviousPanelTracker  (studio.timeline)" color={C.blue} />
              <View style={{ backgroundColor: C.card, borderRadius: 8, padding: 10, borderWidth: 1, borderColor: C.border, marginBottom: 14 }}>
                {[
                  { sig: 'addPanel(ComicPanel panel)',    ret: 'void',              desc: 'appends to history list' },
                  { sig: 'getPreviousPanel()',             ret: 'ComicPanel | null', desc: 'history.get(size - 1)' },
                  { sig: 'getRecentPanels(int amount)',   ret: 'List<ComicPanel>',  desc: 'subList(size-amount, size)' },
                ].map((m, mi) => (
                  <View key={mi} style={{ paddingVertical: 5, borderBottomWidth: mi < 2 ? 1 : 0, borderBottomColor: C.border }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                      <View style={{ backgroundColor: C.blue + '20', borderRadius: 4, paddingHorizontal: 5, paddingVertical: 2 }}>
                        <Text style={{ color: C.blue, fontSize: 8, fontFamily: 'Inter_700Bold' }}>{m.ret}</Text>
                      </View>
                      <Text style={{ color: C.ink, fontSize: 9.5, fontFamily: 'Inter_600SemiBold' }}>{m.sig}</Text>
                    </View>
                    <Text style={{ color: C.muted, fontSize: 9, fontFamily: 'Inter_400Regular', paddingLeft: 8 }}>{m.desc}</Text>
                  </View>
                ))}
              </View>

              {/* StoryboardTimeline interaction */}
              <BHeader title="StoryboardTimeline — panel interaction" color={C.blue} />
              <View style={{ backgroundColor: C.card, borderRadius: 8, padding: 10, borderWidth: 1, borderColor: C.border }}>
                {[
                  { event: 'click',     handler: 'setOnMouseClicked', output: '"OPEN PANEL: " + panelId', color: C.cyan },
                  { event: 'drag',      handler: 'setOnDragDetected', output: 'thumb.startFullDrag()',    color: C.orange },
                ].map(row => (
                  <View key={row.event} style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 4, borderBottomWidth: 1, borderBottomColor: C.border }}>
                    <View style={{ backgroundColor: row.color + '20', borderRadius: 4, paddingHorizontal: 5, paddingVertical: 2, marginRight: 8, width: 48, alignItems: 'center' }}>
                      <Text style={{ color: row.color, fontSize: 8, fontFamily: 'Inter_700Bold' }}>{row.event}</Text>
                    </View>
                    <Text style={{ color: C.muted, fontSize: 8.5, fontFamily: 'Inter_400Regular', width: 120 }}>{row.handler}</Text>
                    <Text style={{ color: C.ink, fontSize: 9, fontFamily: 'Inter_400Regular', flex: 1, fontStyle: 'italic' }}>{row.output}</Text>
                  </View>
                ))}
                <Text style={{ color: C.muted, fontSize: 9, fontFamily: 'Inter_400Regular', marginTop: 6, fontStyle: 'italic' }}>
                  Thumbnail size: 180×120 · ScrollPane hbar: ALWAYS
                </Text>
              </View>
            </View>
          )}

          {/* ── PIPELINE tab ── */}
          {tab === 'pipeline' && (
            <View>
              {/* ContinuityEngine */}
              <BHeader title="ContinuityEngine.buildContinuityPrompt()" color={C.red} />
              <Text style={{ color: C.muted, fontSize: 9, fontFamily: 'Inter_400Regular', marginBottom: 8, fontStyle: 'italic' }}>
                {'// param: ComicPanel previousPanel → returns String'}
              </Text>
              <CodeBlock>
                {'"Maintain same costume. "\n+ "Maintain same lighting: " + previousPanel.getLighting() + ". "\n+ "Maintain emotional continuity: " + previousPanel.getEmotion() + ". "\n+ "Continue motion direction."'}
              </CodeBlock>

              <View style={{ height: 16 }} />

              {/* AIPanelDirector */}
              <BHeader title="AIPanelDirector.generateNextPanel()" color={C.orange} />
              <Text style={{ color: C.muted, fontSize: 9, fontFamily: 'Inter_400Regular', marginBottom: 8, fontStyle: 'italic' }}>
                {'// param: ComicPanel previousPanel → returns ComicPanel'}
              </Text>
              <View style={{ backgroundColor: C.card, borderRadius: 8, padding: 10, borderWidth: 1, borderColor: C.border, marginBottom: 16 }}>
                {[
                  { field: 'emotion',     source: 'previousPanel.getEmotion()',  color: C.purple, note: 'carried forward' },
                  { field: 'lighting',    source: 'previousPanel.getLighting()', color: C.yellow, note: 'carried forward' },
                  { field: 'cameraShot',  source: '"CLOSE_UP"',                  color: C.cyan,   note: 'hard-coded default' },
                  { field: 'prompt',      source: '"Dynamic cinematic comic panel"', color: C.green, note: 'base prompt' },
                ].map((row, i) => (
                  <View key={row.field} style={{ flexDirection: 'row', alignItems: 'flex-start', paddingVertical: 5, borderBottomWidth: i < 3 ? 1 : 0, borderBottomColor: C.border }}>
                    <View style={{ backgroundColor: row.color + '20', borderRadius: 4, paddingHorizontal: 5, paddingVertical: 2, marginRight: 8, minWidth: 70, alignItems: 'center' }}>
                      <Text style={{ color: row.color, fontSize: 8, fontFamily: 'Inter_700Bold' }}>{row.field}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ color: C.ink, fontSize: 9.5, fontFamily: 'Inter_400Regular' }}>{row.source}</Text>
                      <Text style={{ color: C.muted, fontSize: 8.5, fontFamily: 'Inter_400Regular', fontStyle: 'italic' }}>{row.note}</Text>
                    </View>
                  </View>
                ))}
              </View>

              {/* Generation status flow */}
              <BHeader title="GenerationStatus — 5-step AI pipeline" color={C.yellow} />
              <Text style={{ color: C.muted, fontSize: 9, fontFamily: 'Inter_400Regular', marginBottom: 10, fontStyle: 'italic' }}>
                {'// GenerationStatus.showStatus(step) → "AI STATUS: " + step'}
              </Text>
              <View style={{ backgroundColor: C.card, borderRadius: 8, padding: 12, borderWidth: 1, borderColor: C.border }}>
                {GEN_STEPS.map((s, i) => (
                  <View key={s.step} style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 5, borderBottomWidth: i < GEN_STEPS.length - 1 ? 1 : 0, borderBottomColor: C.border }}>
                    <View style={{ width: 22, height: 22, borderRadius: 11, backgroundColor: s.color + '30', borderWidth: 1, borderColor: s.color + '60', alignItems: 'center', justifyContent: 'center', marginRight: 12, flexShrink: 0 }}>
                      <Text style={{ color: s.color, fontSize: 9, fontFamily: 'Inter_700Bold' }}>{s.step}</Text>
                    </View>
                    <Text style={{ color: s.color, fontSize: 11, fontFamily: 'Inter_700Bold', flex: 1 }}>{s.label}</Text>
                    <Text style={{ color: C.muted, fontSize: 8.5, fontFamily: 'Inter_400Regular', fontStyle: 'italic' }}>
                      {'AI STATUS: ' + s.label}
                    </Text>
                  </View>
                ))}
              </View>

              <View style={{ height: 16 }} />

              {/* AnimaticPlayer */}
              <BHeader title="AnimaticPlayer — cinematic playback" color={C.green} />
              <View style={{ backgroundColor: C.card, borderRadius: 8, padding: 10, borderWidth: 1, borderColor: C.border }}>
                <Text style={{ color: C.muted, fontSize: 9, fontFamily: 'Inter_400Regular', marginBottom: 6, fontStyle: 'italic' }}>
                  {'// JavaFX Timeline — 1 page per second'}
                </Text>
                <Text style={{ color: C.yellow, fontSize: 9.5, fontFamily: 'Inter_400Regular', lineHeight: 15 }}>
                  {'for (int i = 0; i < pages.size(); i++) {\n  addKeyFrame(\n    Duration.seconds(i),\n    viewer.setImage(pages.get(i))\n  );\n}\n\nplay()  // start animatic\nstop()  // pause/stop'}
                </Text>
              </View>
            </View>
          )}

          {/* ── AI DIR tab ── */}
          {tab === 'aidir' && (
            <View>
              {/* Future expansions */}
              <BHeader title={`Future Expansions  (${FUTURE.length} systems)`} color={C.cyan} />
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginBottom: 16 }}>
                {FUTURE.map(f => <Chip key={f.label} label={f.label} color={f.color} />)}
              </View>

              {/* Feature groups */}
              {[
                {
                  group: 'Camera & Composition',
                  color: C.blue,
                  items: ['AI Cinematic Camera', 'AI Page Composition', 'AI Eye Flow Analyzer', 'AI Perspective Correction'],
                },
                {
                  group: 'Character & Anatomy',
                  color: C.orange,
                  items: ['AI Pose Suggestions', 'AI Character Turnarounds', 'AI Anatomy Correction'],
                },
                {
                  group: 'Visual FX',
                  color: C.red,
                  items: ['AI Manga Speed Lines', 'AI Motion Blur', 'AI Sound FX Placement'],
                },
                {
                  group: 'Story & Pacing',
                  color: C.yellow,
                  items: ['AI Bubble Placement', 'AI Story Pacing', 'AI Panel Sequencing'],
                },
              ].map(g => (
                <View key={g.group} style={{ marginBottom: 12 }}>
                  <BHeader title={g.group} color={g.color} />
                  {g.items.map(item => (
                    <View key={item} style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 3 }}>
                      <Feather name="check-circle" size={10} color={g.color} style={{ marginRight: 8 }} />
                      <Text style={{ color: C.ink, fontSize: 9.5, fontFamily: 'Inter_400Regular' }}>{item}</Text>
                    </View>
                  ))}
                </View>
              ))}

              {/* Project structure */}
              <BHeader title="ComicProject/ — folder structure" color={C.purple} />
              <View style={{ backgroundColor: '#0A0800', borderRadius: 8, padding: 12, borderWidth: 1, borderColor: C.border }}>
                {FOLDERS.map((f, i) => (
                  <View key={i} style={{ flexDirection: 'row', paddingVertical: 2 }}>
                    <Text style={{ color: C.muted, width: f.indent * 14 }} />
                    <Text style={{ color: f.indent === 0 ? C.yellow : f.indent === 1 ? C.orange : f.indent === 2 ? C.cyan : f.color, fontSize: 9.5, fontFamily: 'Inter_400Regular' }}>
                      {f.indent > 0 ? '├── ' : ''}{f.path}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          <Text style={{ color: C.border, fontSize: 9, fontFamily: 'Inter_400Regular', marginTop: 16, textAlign: 'center', letterSpacing: 0.5 }}>
            AI REFERENCE ONLY · NOT IMPLEMENTED · Live Storyboard + Flip-Through System
          </Text>
        </View>
      )}
    </View>
  );
}
