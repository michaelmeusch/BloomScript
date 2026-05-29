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

// ── 19 packages ───────────────────────────────────────────────────────────────
const PACKAGES: { pkg: string; color: string; classes: string[]; isNew?: boolean }[] = [
  { pkg: 'studio',              color: C.yellow,  classes: ['Main'] },
  { pkg: 'studio.panels',       color: C.orange,  classes: ['ComicPanel'] },
  { pkg: 'studio.characters',   color: C.cyan,    classes: ['CharacterDNA'],          isNew: true },
  { pkg: 'studio.environments', color: C.green,   classes: ['EnvironmentState'],       isNew: true },
  { pkg: 'studio.blueprint',    color: C.blue,    classes: ['PanelBlueprint'],         isNew: true },
  { pkg: 'studio.camera',       color: C.cyan,    classes: ['CinematicCamera'],        isNew: true },
  { pkg: 'studio.pacing',       color: C.purple,  classes: ['StoryPacingAnalyzer', 'PageTurnEngine'], isNew: true },
  { pkg: 'studio.effects',      color: C.red,     classes: ['VisualFXLayer'],          isNew: true },
  { pkg: 'studio.heatmap',      color: C.orange,  classes: ['HeatmapAnalyzer'],        isNew: true },
  { pkg: 'studio.timeline',     color: C.blue,    classes: ['StoryboardTimeline', 'ThumbnailSketchGenerator'] },
  { pkg: 'studio.preview',      color: C.cyan,    classes: ['FloatingPreviewWindow', 'FlipThroughViewer'] },
  { pkg: 'studio.speech',       color: C.red,     classes: ['SpeechBubble'] },
  { pkg: 'studio.playback',     color: C.green,   classes: ['MotionComicPlayer'] },
  { pkg: 'studio.continuity',   color: C.red,     classes: ['(reserved)'] },
  { pkg: 'studio.generation',   color: C.orange,  classes: ['MasterDirectorAI'] },
  { pkg: 'studio.layout',       color: C.green,   classes: ['PageCanvas'] },
  { pkg: 'studio.script',       color: C.muted,   classes: ['(reserved)'] },
  { pkg: 'studio.memory',       color: C.purple,  classes: ['(reserved)'] },
  { pkg: 'studio.export',       color: C.muted,   classes: ['(reserved)'] },
];

// ── CinematicCamera.ShotType (8 values) ──────────────────────────────────────
const SHOT_TYPES: { value: string; color: string; desc: string }[] = [
  { value: 'EXTREME_WIDE',   color: C.cyan,    desc: 'full environment, tiny subjects' },
  { value: 'WIDE',           color: C.blue,    desc: 'scene-setting, multiple characters' },
  { value: 'MEDIUM',         color: C.blue,    desc: 'waist-up — dialogue standard' },
  { value: 'CLOSE_UP',       color: C.orange,  desc: 'face/detail — high emotion' },
  { value: 'DUTCH_ANGLE',    color: C.purple,  desc: 'tilted horizon — tension/unease' },
  { value: 'LOW_ANGLE',      color: C.yellow,  desc: 'upward shot — power/dominance' },
  { value: 'HIGH_ANGLE',     color: C.red,     desc: 'downward shot — vulnerability' },
  { value: 'OVER_SHOULDER',  color: C.green,   desc: 'two-shot — conversation / reveal' },
];

// ── CinematicCamera.CameraMotion (6 values) ───────────────────────────────────
const CAM_MOTIONS: { value: string; color: string }[] = [
  { value: 'STATIC',    color: C.muted },
  { value: 'ZOOM_IN',   color: C.cyan },
  { value: 'ZOOM_OUT',  color: C.blue },
  { value: 'TRACKING',  color: C.orange },
  { value: 'PAN_LEFT',  color: C.purple },
  { value: 'PAN_RIGHT', color: C.purple },
];

// ── VisualFXLayer.FXType (6 values) ──────────────────────────────────────────
const FX_TYPES: { value: string; color: string; desc: string }[] = [
  { value: 'SPEED_LINES',   color: C.yellow, desc: 'motion trail — action / movement' },
  { value: 'IMPACT_BURST',  color: C.orange, desc: 'radial burst — hit / explosion' },
  { value: 'RAIN',          color: C.blue,   desc: 'atmospheric precipitation' },
  { value: 'SMOKE',         color: C.muted,  desc: 'haze / aftermath / mystery' },
  { value: 'ENERGY',        color: C.cyan,   desc: 'power glow / electricity' },
  { value: 'EXPLOSION',     color: C.red,    desc: 'destructive blast overlay' },
];

// ── CharacterDNA fields ───────────────────────────────────────────────────────
const DNA_FIELDS: { name: string; desc: string }[] = [
  { name: 'characterId',    desc: 'unique identifier' },
  { name: 'faceEmbedding',  desc: 'AI facial feature vector' },
  { name: 'bodyType',       desc: 'physique classification' },
  { name: 'silhouette',     desc: 'recognizable outline shape' },
  { name: 'anatomyScale',   desc: 'proportions (heroic/realistic/stylized)' },
  { name: 'costume',        desc: 'clothing/armour description' },
  { name: 'hairstyle',      desc: 'hair type and style' },
  { name: 'facialFeatures', desc: 'defining face traits' },
  { name: 'colorPalette',   desc: 'skin/costume/hair colours' },
  { name: 'powers',         desc: 'ability/FX markers' },
];

// ── EnvironmentState fields ───────────────────────────────────────────────────
const ENV_FIELDS: { name: string; desc: string; color: string }[] = [
  { name: 'locationName',      desc: 'named setting (city, base, planet…)', color: C.green },
  { name: 'weather',           desc: 'clear / rain / storm / snow',         color: C.blue },
  { name: 'lighting',          desc: 'golden / neon / moonlit / cold',      color: C.yellow },
  { name: 'destructionLevel',  desc: 'intact / damaged / ruined',           color: C.red },
  { name: 'propLayout',        desc: 'object arrangement description',      color: C.orange },
  { name: 'atmosphere',        desc: 'mood/tone of the location',           color: C.purple },
];

// ── PanelBlueprint fields ─────────────────────────────────────────────────────
const BLUEPRINT_FIELDS: { name: string; desc: string; color: string }[] = [
  { name: 'cameraGuide',      desc: 'shot framing instruction',         color: C.cyan },
  { name: 'speechZone',       desc: 'reserved bubble placement area',   color: C.purple },
  { name: 'actionFlow',       desc: 'directional movement path',        color: C.orange },
  { name: 'eyeDirection',     desc: 'reader gaze guidance vector',      color: C.yellow },
  { name: 'compositionType',  desc: 'rule of thirds / symmetry / etc.', color: C.green },
];

// ── ComicPanel updated fields ─────────────────────────────────────────────────
const PANEL_FIELDS: { name: string; type: string; isNew?: boolean }[] = [
  { name: 'panelId',    type: 'String',  },
  { name: 'fullImage',  type: 'Image'   },
  { name: 'thumbnail',  type: 'Image'   },
  { name: 'prompt',     type: 'String'  },
  { name: 'cameraShot', type: 'String'  },
  { name: 'emotion',    type: 'String'  },
  { name: 'action',     type: 'String',  isNew: true },
  { name: 'dialogue',   type: 'String',  isNew: true },
  { name: 'x',         type: 'double'  },
  { name: 'y',         type: 'double'  },
  { name: 'width',     type: 'double'  },
  { name: 'height',    type: 'double'  },
];

// ── MasterDirectorAI steps ────────────────────────────────────────────────────
const DIRECTOR_STEPS: { step: number; label: string; color: string }[] = [
  { step: 1, label: 'Directing cinematic scene...',    color: C.cyan },
  { step: 2, label: 'Evaluating pacing...',            color: C.purple },
  { step: 3, label: 'Choosing camera shot...',         color: C.orange },
  { step: 4, label: 'Building action composition...',  color: C.yellow },
];

// ── Project folders ───────────────────────────────────────────────────────────
const FOLDERS: { path: string; indent: number }[] = [
  { path: 'ComicProject/', indent: 0 },
  { path: 'pages/',        indent: 1 },
  { path: 'page_01/',      indent: 2 },
  { path: 'panels/',       indent: 3 },
  { path: 'thumbnails/',   indent: 3 },
  { path: 'speech/',       indent: 3 },
  { path: 'fx/',           indent: 3 },
  { path: 'continuity/',   indent: 3 },
  { path: 'exports/',      indent: 3 },
  { path: 'characters/',   indent: 1 },
  { path: 'environments/', indent: 1 },
  { path: 'references/',   indent: 1 },
  { path: 'animatics/',    indent: 1 },
  { path: 'scripts/',      indent: 1 },
  { path: 'timelines/',    indent: 1 },
  { path: 'backups/',      indent: 1 },
];

// ── Tech stack ────────────────────────────────────────────────────────────────
const TECH: { label: string; color: string }[] = [
  { label: 'Java 21+',          color: C.orange },
  { label: 'JavaFX',            color: C.blue },
  { label: 'Canvas Rendering',  color: C.cyan },
  { label: 'BufferedImage',     color: C.green },
  { label: 'SQLite / JSON',     color: C.yellow },
  { label: 'ONNX Runtime Ready',color: C.purple },
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

function NewBadge() {
  return (
    <View style={{ backgroundColor: C.yellow + '30', borderRadius: 3, paddingHorizontal: 4, paddingVertical: 1, marginLeft: 4 }}>
      <Text style={{ color: C.yellow, fontSize: 7, fontFamily: 'Inter_700Bold' }}>NEW</Text>
    </View>
  );
}

// ── Main Export ───────────────────────────────────────────────────────────────
export function UltimateStudioReference() {
  const [expanded, setExpanded] = React.useState(false);
  type Tab = 'classes' | 'enums' | 'pipeline' | 'aidir';
  const [tab, setTab] = React.useState<Tab>('classes');

  const TABS: { id: Tab; label: string; color: string }[] = [
    { id: 'classes',  label: 'CLASSES',  color: C.yellow },
    { id: 'enums',    label: 'ENUMS',    color: C.cyan },
    { id: 'pipeline', label: 'PIPELINE', color: C.orange },
    { id: 'aidir',    label: 'AI DIR',   color: C.purple },
  ];

  return (
    <View style={{ marginTop: 16, borderTopWidth: 1, borderTopColor: C.border, paddingTop: 16 }}>

      <TouchableOpacity
        onPress={() => { Haptics.selectionAsync(); setExpanded(v => !v); }}
        activeOpacity={0.8}
        style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: C.card, borderWidth: 1, borderColor: C.yellow + '55', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, marginBottom: 4 }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <View style={{ backgroundColor: C.yellow + '22', borderRadius: 6, padding: 5 }}>
            <Feather name="star" size={13} color={C.yellow} />
          </View>
          <View>
            <Text style={{ color: C.yellow, fontSize: 12, fontFamily: 'Inter_700Bold', letterSpacing: 0.5 }}>
              Ultimate AI Comic Filmmaking Studio
            </Text>
            <Text style={{ color: C.muted, fontSize: 9.5, fontFamily: 'Inter_400Regular', marginTop: 1 }}>
              19 packages · 17 classes · 3 enums · CharacterDNA · ONNX Ready
            </Text>
          </View>
        </View>
        <Feather name={expanded ? 'chevron-up' : 'chevron-down'} size={14} color={C.muted} />
      </TouchableOpacity>

      {expanded && (
        <View style={{ backgroundColor: C.bg, borderWidth: 1, borderColor: C.yellow + '44', borderRadius: 12, padding: 14 }}>

          <Text style={{ color: C.muted, fontSize: 9.5, fontFamily: 'Inter_400Regular', marginBottom: 2, fontStyle: 'italic' }}>
            {'// Comic Art Studio — Ultimate AI Comic Filmmaking Studio'}
          </Text>
          <Text style={{ color: C.muted, fontSize: 9.5, fontFamily: 'Inter_400Regular', marginBottom: 4, fontStyle: 'italic' }}>
            {'// Java 21+ · JavaFX · SQLite / JSON · ONNX Runtime Ready'}
          </Text>

          {/* Tech stack chips */}
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginBottom: 14 }}>
            {TECH.map(t => <Chip key={t.label} label={t.label} color={t.color} />)}
          </View>

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
              <BHeader title="Main.java — BorderPane layout  (Scene 1920×1080)" color={C.yellow} />
              <View style={{ backgroundColor: C.card, borderRadius: 8, padding: 10, borderWidth: 1, borderColor: C.border, marginBottom: 16 }}>
                {[
                  { pos: 'CENTER', cls: 'PageCanvas',            color: C.green,  desc: '1200×1600 · panels + speech bubbles' },
                  { pos: 'RIGHT',  cls: 'FloatingPreviewWindow', color: C.cyan,   desc: '350×500 · "Generating..." label + live image' },
                  { pos: 'BOTTOM', cls: 'StoryboardTimeline',    color: C.blue,   desc: 'horizontal 180×120 thumbnail strip' },
                  { pos: 'LEFT',   cls: 'FlipThroughViewer',     color: C.cyan,   desc: '350×500 · page flip viewer' },
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

              {/* 19-package map */}
              <BHeader title="Package structure  (19 packages · 17 classes)" color={C.blue} />
              {PACKAGES.map((pkg, pi) => (
                <View key={pkg.pkg} style={{ paddingVertical: 6, borderBottomWidth: pi < PACKAGES.length - 1 ? 1 : 0, borderBottomColor: C.border }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 4 }}>
                    <Text style={{ color: pkg.color, fontSize: 9, fontFamily: 'Inter_700Bold' }}>{pkg.pkg}</Text>
                    {pkg.isNew && <NewBadge />}
                  </View>
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', paddingLeft: 8 }}>
                    {pkg.classes.map(cls => <Chip key={cls} label={cls} color={pkg.color} />)}
                  </View>
                </View>
              ))}

              <View style={{ height: 14 }} />

              {/* Key new class highlights */}
              <BHeader title="New classes — Ultimate edition" color={C.yellow} />
              {[
                { name: 'CharacterDNA',          pkg: 'studio.characters',   color: C.cyan,   desc: 'DNA Lock — 10-field character identity (face, body, costume, powers)' },
                { name: 'EnvironmentState',       pkg: 'studio.environments', color: C.green,  desc: 'Environment Memory — location, weather, lighting, destruction, atmosphere' },
                { name: 'PanelBlueprint',         pkg: 'studio.blueprint',    color: C.blue,   desc: 'Blueprint Mode — cameraGuide, speechZone, actionFlow, eyeDirection' },
                { name: 'CinematicCamera',         pkg: 'studio.camera',       color: C.cyan,   desc: 'AI Camera — ShotType (8) + CameraMotion (6) enums' },
                { name: 'StoryPacingAnalyzer',    pkg: 'studio.pacing',       color: C.purple, desc: 'Pacing — camera variety + action escalation checks' },
                { name: 'PageTurnEngine',          pkg: 'studio.pacing',       color: C.purple, desc: 'Page Turn — evaluates reveal impact at page turns' },
                { name: 'ThumbnailSketchGenerator',pkg: 'studio.timeline',    color: C.blue,   desc: 'Thumbnail — generates rough sketches for storyboard' },
                { name: 'HeatmapAnalyzer',         pkg: 'studio.heatmap',      color: C.orange, desc: 'Heatmap — clutter + focus area analysis' },
                { name: 'VisualFXLayer',           pkg: 'studio.effects',      color: C.red,    desc: 'FX Layers — FXType enum: SPEED_LINES, IMPACT_BURST, RAIN, SMOKE, ENERGY, EXPLOSION' },
                { name: 'MotionComicPlayer',       pkg: 'studio.playback',     color: C.green,  desc: 'Motion Comic — replaces AnimaticPlayer, INDEFINITE loop' },
                { name: 'MasterDirectorAI',        pkg: 'studio.generation',   color: C.orange, desc: 'AI Master Director — 4-step scene direction pipeline' },
              ].map((cs, i, arr) => (
                <View key={cs.name} style={{ paddingVertical: 8, borderBottomWidth: i < arr.length - 1 ? 1 : 0, borderBottomColor: C.border }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 3, flexWrap: 'wrap' }}>
                    <View style={{ backgroundColor: cs.color + '20', borderRadius: 5, paddingHorizontal: 6, paddingVertical: 3 }}>
                      <Text style={{ color: cs.color, fontSize: 9.5, fontFamily: 'Inter_700Bold' }}>{cs.name}</Text>
                    </View>
                    <Text style={{ color: C.muted, fontSize: 8.5, fontFamily: 'Inter_400Regular', fontStyle: 'italic' }}>{cs.pkg}</Text>
                  </View>
                  <Text style={{ color: C.muted, fontSize: 9, fontFamily: 'Inter_400Regular' }}>{cs.desc}</Text>
                </View>
              ))}
            </View>
          )}

          {/* ── ENUMS ── */}
          {tab === 'enums' && (
            <View>
              {/* CinematicCamera.ShotType */}
              <BHeader title="enum CinematicCamera.ShotType  (8 values)" color={C.cyan} />
              <Text style={{ color: C.muted, fontSize: 9, fontFamily: 'Inter_400Regular', marginBottom: 10, fontStyle: 'italic' }}>
                {'// studio.camera.CinematicCamera — AI selects shot per panel context'}
              </Text>
              {SHOT_TYPES.map((s, i) => (
                <View key={s.value} style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 5, borderBottomWidth: i < SHOT_TYPES.length - 1 ? 1 : 0, borderBottomColor: C.border }}>
                  <View style={{ backgroundColor: s.color + '20', borderRadius: 5, paddingHorizontal: 6, paddingVertical: 3, minWidth: 110, marginRight: 10, alignItems: 'center' }}>
                    <Text style={{ color: s.color, fontSize: 8.5, fontFamily: 'Inter_700Bold' }}>{s.value}</Text>
                  </View>
                  <Text style={{ color: C.muted, fontSize: 9, fontFamily: 'Inter_400Regular', flex: 1 }}>{s.desc}</Text>
                </View>
              ))}

              <View style={{ height: 16 }} />

              {/* CameraMotion */}
              <BHeader title="enum CinematicCamera.CameraMotion  (6 values)" color={C.blue} />
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginBottom: 16 }}>
                {CAM_MOTIONS.map(m => <Chip key={m.value} label={m.value} color={m.color} />)}
              </View>

              {/* VisualFXLayer.FXType */}
              <BHeader title="enum VisualFXLayer.FXType  (6 values)" color={C.red} />
              <Text style={{ color: C.muted, fontSize: 9, fontFamily: 'Inter_400Regular', marginBottom: 10, fontStyle: 'italic' }}>
                {'// studio.effects.VisualFXLayer — layered on top of PageCanvas panels'}
              </Text>
              {FX_TYPES.map((f, i) => (
                <View key={f.value} style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 5, borderBottomWidth: i < FX_TYPES.length - 1 ? 1 : 0, borderBottomColor: C.border }}>
                  <View style={{ backgroundColor: f.color + '20', borderRadius: 5, paddingHorizontal: 6, paddingVertical: 3, minWidth: 100, marginRight: 10, alignItems: 'center' }}>
                    <Text style={{ color: f.color, fontSize: 8.5, fontFamily: 'Inter_700Bold' }}>{f.value}</Text>
                  </View>
                  <Text style={{ color: C.muted, fontSize: 9, fontFamily: 'Inter_400Regular', flex: 1 }}>{f.desc}</Text>
                </View>
              ))}

              <View style={{ height: 16 }} />

              {/* ComicPanel updated fields */}
              <BHeader title="class ComicPanel — updated fields" color={C.orange} />
              <Text style={{ color: C.muted, fontSize: 9, fontFamily: 'Inter_400Regular', marginBottom: 8, fontStyle: 'italic' }}>
                {'// action + dialogue added · PanelState removed · UUID auto-init'}
              </Text>
              {PANEL_FIELDS.map((f, i) => (
                <View key={f.name} style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 4, borderBottomWidth: i < PANEL_FIELDS.length - 1 ? 1 : 0, borderBottomColor: C.border, backgroundColor: f.isNew ? C.yellow + '08' : 'transparent' }}>
                  <View style={{ backgroundColor: (f.isNew ? C.yellow : C.orange) + '1A', borderRadius: 4, paddingHorizontal: 5, paddingVertical: 2, marginRight: 8, minWidth: 56, alignItems: 'center' }}>
                    <Text style={{ color: f.isNew ? C.yellow : C.orange, fontSize: 8, fontFamily: 'Inter_700Bold' }}>{f.type}</Text>
                  </View>
                  <Text style={{ color: f.isNew ? C.yellow : C.ink, fontSize: 10, fontFamily: f.isNew ? 'Inter_600SemiBold' : 'Inter_400Regular', flex: 1 }}>{f.name}</Text>
                  {f.isNew && <NewBadge />}
                </View>
              ))}
            </View>
          )}

          {/* ── PIPELINE ── */}
          {tab === 'pipeline' && (
            <View>
              {/* MasterDirectorAI */}
              <BHeader title="MasterDirectorAI.directScene(previousPanel)" color={C.orange} />
              <Text style={{ color: C.muted, fontSize: 9, fontFamily: 'Inter_400Regular', marginBottom: 10, fontStyle: 'italic' }}>
                {'// studio.generation — returns new ComicPanel · replaces AIPanelDirector'}
              </Text>
              <View style={{ backgroundColor: C.card, borderRadius: 8, padding: 12, borderWidth: 1, borderColor: C.border, marginBottom: 16 }}>
                {DIRECTOR_STEPS.map((s, i) => (
                  <View key={s.step} style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 6, borderBottomWidth: i < DIRECTOR_STEPS.length - 1 ? 1 : 0, borderBottomColor: C.border }}>
                    <View style={{ width: 22, height: 22, borderRadius: 11, backgroundColor: s.color + '30', borderWidth: 1, borderColor: s.color + '60', alignItems: 'center', justifyContent: 'center', marginRight: 10, flexShrink: 0 }}>
                      <Text style={{ color: s.color, fontSize: 9, fontFamily: 'Inter_700Bold' }}>{s.step}</Text>
                    </View>
                    <Text style={{ color: s.color, fontSize: 10.5, fontFamily: 'Inter_600SemiBold', flex: 1 }}>"{s.label}"</Text>
                  </View>
                ))}
              </View>

              {/* StoryPacingAnalyzer */}
              <BHeader title="StoryPacingAnalyzer.analyze(panels)" color={C.purple} />
              <View style={{ backgroundColor: C.card, borderRadius: 8, padding: 10, borderWidth: 1, borderColor: C.border, marginBottom: 14 }}>
                {[
                  { step: '"Analyzing pacing..."',          color: C.purple },
                  { step: '"Checking camera variety..."',   color: C.blue },
                  { step: '"Checking action escalation..."', color: C.orange },
                ].map((s, i) => (
                  <View key={i} style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 4, borderBottomWidth: i < 2 ? 1 : 0, borderBottomColor: C.border }}>
                    <View style={{ backgroundColor: s.color + '20', borderRadius: 3, width: 6, height: 6, marginRight: 8 }} />
                    <Text style={{ color: s.color, fontSize: 9.5, fontFamily: 'Inter_400Regular', fontStyle: 'italic' }}>{s.step}</Text>
                  </View>
                ))}
              </View>

              {/* PageTurnEngine + ThumbnailSketchGenerator + HeatmapAnalyzer */}
              <View style={{ flexDirection: 'row', gap: 8, marginBottom: 14 }}>
                {[
                  { cls: 'PageTurnEngine',          method: 'evaluateReveal()',    out: '"Evaluating page turn impact..."', color: C.purple },
                  { cls: 'ThumbnailSketchGenerator', method: 'generateRoughs()',   out: '"Generating thumbnail sketches..."', color: C.blue },
                ].map(c => (
                  <View key={c.cls} style={{ flex: 1, backgroundColor: C.card, borderRadius: 8, padding: 8, borderWidth: 1, borderColor: C.border }}>
                    <View style={{ backgroundColor: c.color + '20', borderRadius: 4, paddingHorizontal: 5, paddingVertical: 2, marginBottom: 5 }}>
                      <Text style={{ color: c.color, fontSize: 8, fontFamily: 'Inter_700Bold' }}>{c.cls}</Text>
                    </View>
                    <Text style={{ color: C.ink, fontSize: 8.5, fontFamily: 'Inter_600SemiBold', marginBottom: 4 }}>{c.method}</Text>
                    <Text style={{ color: C.muted, fontSize: 8, fontFamily: 'Inter_400Regular', fontStyle: 'italic' }}>{c.out}</Text>
                  </View>
                ))}
              </View>

              {/* HeatmapAnalyzer */}
              <BHeader title="HeatmapAnalyzer.analyze()" color={C.orange} />
              <View style={{ backgroundColor: C.card, borderRadius: 8, padding: 10, borderWidth: 1, borderColor: C.border, marginBottom: 14 }}>
                {[
                  { out: '"Analyzing clutter..."',     color: C.orange },
                  { out: '"Analyzing focus areas..."', color: C.yellow },
                ].map((s, i) => (
                  <View key={i} style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 4, borderBottomWidth: i === 0 ? 1 : 0, borderBottomColor: C.border }}>
                    <View style={{ backgroundColor: s.color + '20', borderRadius: 3, width: 6, height: 6, marginRight: 8 }} />
                    <Text style={{ color: s.color, fontSize: 9.5, fontFamily: 'Inter_400Regular', fontStyle: 'italic' }}>{s.out}</Text>
                  </View>
                ))}
              </View>

              {/* MotionComicPlayer */}
              <BHeader title="MotionComicPlayer  (studio.playback)" color={C.green} />
              <View style={{ backgroundColor: C.card, borderRadius: 8, padding: 10, borderWidth: 1, borderColor: C.border, marginBottom: 14 }}>
                <Text style={{ color: C.muted, fontSize: 9, fontFamily: 'Inter_400Regular', marginBottom: 6, fontStyle: 'italic' }}>
                  {'// Replaces AnimaticPlayer — same INDEFINITE JavaFX Timeline pattern'}
                </Text>
                {[
                  { label: 'KeyFrame per page', val: 'Duration.seconds(i)', color: C.green },
                  { label: 'CycleCount',        val: 'Timeline.INDEFINITE', color: C.cyan },
                ].map((row, i) => (
                  <View key={i} style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 4, borderBottomWidth: i === 0 ? 1 : 0, borderBottomColor: C.border }}>
                    <Text style={{ color: C.muted, fontSize: 9, fontFamily: 'Inter_400Regular', width: 110 }}>{row.label}</Text>
                    <View style={{ backgroundColor: row.color + '20', borderRadius: 4, paddingHorizontal: 5, paddingVertical: 2 }}>
                      <Text style={{ color: row.color, fontSize: 8.5, fontFamily: 'Inter_700Bold' }}>{row.val}</Text>
                    </View>
                  </View>
                ))}
              </View>

              {/* FloatingPreviewWindow — updated status */}
              <BHeader title="FloatingPreviewWindow — status label change" color={C.cyan} />
              <View style={{ backgroundColor: C.card, borderRadius: 8, padding: 10, borderWidth: 1, borderColor: C.border }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                  <View style={{ backgroundColor: C.red + '20', borderRadius: 5, paddingHorizontal: 7, paddingVertical: 3 }}>
                    <Text style={{ color: C.red, fontSize: 9, fontFamily: 'Inter_700Bold' }}>BEFORE  "Waiting..."</Text>
                  </View>
                  <Feather name="arrow-right" size={12} color={C.muted} />
                  <View style={{ backgroundColor: C.cyan + '20', borderRadius: 5, paddingHorizontal: 7, paddingVertical: 3 }}>
                    <Text style={{ color: C.cyan, fontSize: 9, fontFamily: 'Inter_700Bold' }}>NOW  "Generating..."</Text>
                  </View>
                </View>
              </View>
            </View>
          )}

          {/* ── AI DIR ── */}
          {tab === 'aidir' && (
            <View>
              {/* CharacterDNA */}
              <BHeader title="CharacterDNA  (studio.characters)" color={C.cyan} />
              <Text style={{ color: C.muted, fontSize: 9, fontFamily: 'Inter_400Regular', marginBottom: 8, fontStyle: 'italic' }}>
                {'// DNA Lock — keeps character consistent across all panels'}
              </Text>
              <View style={{ backgroundColor: C.card, borderRadius: 8, padding: 10, borderWidth: 1, borderColor: C.border, marginBottom: 14 }}>
                {DNA_FIELDS.map((f, i) => (
                  <View key={f.name} style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 4, borderBottomWidth: i < DNA_FIELDS.length - 1 ? 1 : 0, borderBottomColor: C.border }}>
                    <View style={{ backgroundColor: C.cyan + '1A', borderRadius: 4, paddingHorizontal: 5, paddingVertical: 2, marginRight: 8, minWidth: 90, alignItems: 'center' }}>
                      <Text style={{ color: C.cyan, fontSize: 8, fontFamily: 'Inter_700Bold' }}>{f.name}</Text>
                    </View>
                    <Text style={{ color: C.muted, fontSize: 9, fontFamily: 'Inter_400Regular', flex: 1 }}>{f.desc}</Text>
                  </View>
                ))}
              </View>

              {/* EnvironmentState */}
              <BHeader title="EnvironmentState  (studio.environments)" color={C.green} />
              <Text style={{ color: C.muted, fontSize: 9, fontFamily: 'Inter_400Regular', marginBottom: 8, fontStyle: 'italic' }}>
                {'// Environment Memory — ensures scene consistency across pages'}
              </Text>
              <View style={{ backgroundColor: C.card, borderRadius: 8, padding: 10, borderWidth: 1, borderColor: C.border, marginBottom: 14 }}>
                {ENV_FIELDS.map((f, i) => (
                  <View key={f.name} style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 4, borderBottomWidth: i < ENV_FIELDS.length - 1 ? 1 : 0, borderBottomColor: C.border }}>
                    <View style={{ backgroundColor: f.color + '1A', borderRadius: 4, paddingHorizontal: 5, paddingVertical: 2, marginRight: 8, minWidth: 108, alignItems: 'center' }}>
                      <Text style={{ color: f.color, fontSize: 8, fontFamily: 'Inter_700Bold' }}>{f.name}</Text>
                    </View>
                    <Text style={{ color: C.muted, fontSize: 9, fontFamily: 'Inter_400Regular', flex: 1 }}>{f.desc}</Text>
                  </View>
                ))}
              </View>

              {/* PanelBlueprint */}
              <BHeader title="PanelBlueprint  (studio.blueprint)" color={C.blue} />
              <Text style={{ color: C.muted, fontSize: 9, fontFamily: 'Inter_400Regular', marginBottom: 8, fontStyle: 'italic' }}>
                {'// Blueprint Mode — lays out AI composition guides before generation'}
              </Text>
              <View style={{ backgroundColor: C.card, borderRadius: 8, padding: 10, borderWidth: 1, borderColor: C.border, marginBottom: 16 }}>
                {BLUEPRINT_FIELDS.map((f, i) => (
                  <View key={f.name} style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 4, borderBottomWidth: i < BLUEPRINT_FIELDS.length - 1 ? 1 : 0, borderBottomColor: C.border }}>
                    <View style={{ backgroundColor: f.color + '1A', borderRadius: 4, paddingHorizontal: 5, paddingVertical: 2, marginRight: 8, minWidth: 100, alignItems: 'center' }}>
                      <Text style={{ color: f.color, fontSize: 8, fontFamily: 'Inter_700Bold' }}>{f.name}</Text>
                    </View>
                    <Text style={{ color: C.muted, fontSize: 9, fontFamily: 'Inter_400Regular', flex: 1 }}>{f.desc}</Text>
                  </View>
                ))}
              </View>

              {/* Project structure */}
              <BHeader title="ComicProject/ — folder structure" color={C.purple} />
              <View style={{ backgroundColor: '#0A0800', borderRadius: 8, padding: 12, borderWidth: 1, borderColor: C.border }}>
                {FOLDERS.map((f, i) => (
                  <View key={i} style={{ flexDirection: 'row', paddingVertical: 2 }}>
                    <Text style={{ width: f.indent * 14 }} />
                    <Text style={{ color: f.indent === 0 ? C.yellow : f.indent === 1 ? C.orange : f.indent === 2 ? C.cyan : C.blue, fontSize: 9.5, fontFamily: 'Inter_400Regular' }}>
                      {f.indent > 0 ? '├── ' : ''}{f.path}
                    </Text>
                  </View>
                ))}
                <Text style={{ color: C.red, fontSize: 8.5, fontFamily: 'Inter_400Regular', marginTop: 8, fontStyle: 'italic' }}>
                  note: fx/ added at page level · environments/ + scripts/ + timelines/ added at root
                </Text>
              </View>
            </View>
          )}

          <Text style={{ color: C.border, fontSize: 9, fontFamily: 'Inter_400Regular', marginTop: 16, textAlign: 'center', letterSpacing: 0.5 }}>
            AI REFERENCE ONLY · NOT IMPLEMENTED · Ultimate AI Comic Filmmaking Studio
          </Text>
        </View>
      )}
    </View>
  );
}
