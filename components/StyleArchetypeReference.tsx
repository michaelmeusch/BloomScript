import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import React from 'react';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';

// ── Palette ───────────────────────────────────────────────────────────────────
const C = {
  bg: '#0E0C0A', card: '#181410', border: '#2E2618',
  yellow: '#FFD600', red: '#E8001C', blue: '#0057A8',
  green: '#2A7A3A', purple: '#8B3FBE', orange: '#FF6A00',
  cyan: '#00C4CC', ink: '#F0EAD8', muted: '#7A6A58',
};

// ── Enums ─────────────────────────────────────────────────────────────────────
const ENUMS: { name: string; color: string; values: string[] }[] = [
  {
    name: 'ComicStyleReference',
    color: C.yellow,
    values: [
      'KIRBY_COSMIC', 'BRONZE_AGE_HEROIC', 'SILVER_AGE_COSMIC', 'GOLDEN_AGE_HERO',
      'DARK_HORSE_GRIT', 'NOIR_DETECTIVE', 'GOTHIC_VIGILANTE', 'MANGA_DYNAMIC',
      'CINEMATIC_REALISM', 'SWORD_AND_SORCERY', 'SPACE_OPERA', 'HEAVY_METAL_FANTASY',
      'BARBARIAN_WARLORD', 'RETRO_SCIFI', 'MYTHIC_GOD',
    ],
  },
  {
    name: 'BodyType',
    color: C.orange,
    values: [
      'SLIM', 'ATHLETIC', 'HEROIC', 'MASSIVE', 'BRUTE',
      'CURVY', 'MUSCULAR', 'ELEGANT', 'COSMIC', 'HEAVYSET', 'HYBRID',
    ],
  },
  {
    name: 'LightingStyle',
    color: C.cyan,
    values: [
      'HIGH_CONTRAST', 'COSMIC_GLOW', 'NOIR_SHADOWS', 'SOFT_DRAMATIC',
      'HEAVY_SHADOWS', 'CINEMATIC_RIM', 'RETRO_FLAT', 'ATMOSPHERIC_FOG', 'INDUSTRIAL_LIGHTING',
    ],
  },
  {
    name: 'AITargetSystem',
    color: C.purple,
    values: ['COMIC_ART_STUDIO_AI_GENERATOR', 'COVER_CREATOR_AI_GENERATOR', 'BOTH'],
  },
];

// ── Fields ────────────────────────────────────────────────────────────────────
const FIELD_GROUPS: { group: string; color: string; fields: { name: string; type: string }[] }[] = [
  {
    group: 'Core Identity',
    color: C.yellow,
    fields: [
      { name: 'archetypeName',  type: 'String' },
      { name: 'styleReference', type: 'ComicStyleReference' },
      { name: 'bodyType',       type: 'BodyType' },
      { name: 'lightingStyle',  type: 'LightingStyle' },
      { name: 'targetSystem',   type: 'AITargetSystem' },
    ],
  },
  {
    group: 'Anatomy (float)',
    color: C.orange,
    fields: [
      { name: 'shoulderWidth', type: 'float' },
      { name: 'chestScale',    type: 'float' },
      { name: 'waistScale',    type: 'float' },
      { name: 'hipScale',      type: 'float' },
      { name: 'armMass',       type: 'float' },
      { name: 'legMass',       type: 'float' },
      { name: 'handScale',     type: 'float  // 1.2f default' },
      { name: 'neckScale',     type: 'float  // 1.1f default' },
    ],
  },
  {
    group: 'Visual Language',
    color: C.blue,
    fields: [
      { name: 'silhouetteLanguage', type: 'String' },
      { name: 'motionLanguage',     type: 'String' },
      { name: 'cameraLanguage',     type: 'String' },
      { name: 'compositionStyle',   type: 'String' },
      { name: 'energyStyle',        type: 'String' },
      { name: 'costumeBehavior',    type: 'String  // "Dynamic cloth simulation"' },
      { name: 'shadowProfile',      type: 'String  // "Classic comics cinematic contrast"' },
    ],
  },
  {
    group: 'FX Style',
    color: C.red,
    fields: [
      { name: 'impactStyle',       type: 'String  // "Sequential impact bursts"' },
      { name: 'energyBlastStyle',  type: 'String  // = energyStyle' },
      { name: 'debrisStyle',       type: 'String  // "Foreground debris layering"' },
      { name: 'atmosphericStyle',  type: 'String  // "Volumetric comic atmosphere"' },
    ],
  },
  {
    group: 'Cover Design',
    color: C.cyan,
    fields: [
      { name: 'coverComposition',  type: 'String  // "Hero centered cinematic"' },
      { name: 'focalPointDesign',  type: 'String  // "Foreground impact emphasis"' },
      { name: 'eyeFlowDesign',     type: 'String  // "Z pattern comic flow"' },
    ],
  },
  {
    group: 'AI Flags (all true)',
    color: C.green,
    fields: [
      { name: 'cinematic',             type: 'boolean' },
      { name: 'coverFriendly',         type: 'boolean' },
      { name: 'sequentialFlow',        type: 'boolean' },
      { name: 'anatomyLock',           type: 'boolean' },
      { name: 'dynamicForeshortening', type: 'boolean' },
      { name: 'atmosphericFX',         type: 'boolean' },
    ],
  },
];

// ── Style data ────────────────────────────────────────────────────────────────
const STYLES: {
  name: string; ref: string; body: string; light: string;
  sw: number; cs: number; ws: number; hs: number;
  silhouette: string; motion: string; camera: string; energy: string;
  bodyColor: string; lightColor: string;
}[] = [
  { name: 'Kirby Cosmic Warlord',  ref: 'KIRBY_COSMIC',        body: 'MASSIVE',     light: 'COSMIC_GLOW',       sw: 2.0, cs: 2.2, ws: 0.8, hs: 1.0, silhouette: 'Massive triangle silhouette',  motion: 'Explosive dynamic motion',      camera: 'Low-angle dominance',           energy: 'Cosmic crackle energy',      bodyColor: C.red,    lightColor: C.cyan },
  { name: 'Bronze Age Hero',        ref: 'BRONZE_AGE_HEROIC',   body: 'HEROIC',      light: 'HIGH_CONTRAST',     sw: 1.6, cs: 1.7, ws: 0.8, hs: 0.9, silhouette: 'Classic heroic silhouette',   motion: 'Grounded action motion',        camera: 'Heroic cinematic framing',      energy: 'Classic impact bursts',      bodyColor: C.orange, lightColor: C.yellow },
  { name: 'Silver Age Cosmic',      ref: 'SILVER_AGE_COSMIC',   body: 'ATHLETIC',    light: 'COSMIC_GLOW',       sw: 1.4, cs: 1.5, ws: 0.8, hs: 0.9, silhouette: 'Elegant cosmic silhouette',   motion: 'Floating cosmic motion',        camera: 'Wide cosmic framing',           energy: 'Energy rings and stars',     bodyColor: C.blue,   lightColor: C.cyan },
  { name: 'Golden Age Hero',        ref: 'GOLDEN_AGE_HERO',     body: 'HEROIC',      light: 'RETRO_FLAT',        sw: 1.5, cs: 1.5, ws: 0.9, hs: 0.9, silhouette: 'Simple heroic silhouette',    motion: 'Straightforward motion',        camera: 'Centered framing',             energy: 'Simple impact flashes',      bodyColor: C.orange, lightColor: C.muted },
  { name: 'Dark Horse Grit',        ref: 'DARK_HORSE_GRIT',     body: 'ATHLETIC',    light: 'HEAVY_SHADOWS',     sw: 1.4, cs: 1.5, ws: 0.9, hs: 0.9, silhouette: 'Grounded gritty silhouette',  motion: 'Realistic combat motion',       camera: 'Close cinematic framing',      energy: 'Smoke-heavy FX',            bodyColor: C.blue,   lightColor: C.muted },
  { name: 'Noir Detective',         ref: 'NOIR_DETECTIVE',       body: 'SLIM',        light: 'NOIR_SHADOWS',      sw: 1.2, cs: 1.2, ws: 0.8, hs: 0.8, silhouette: 'Narrow noir silhouette',      motion: 'Subtle restrained motion',      camera: 'Shadow framing',               energy: 'Minimalist FX',             bodyColor: C.muted,  lightColor: C.muted },
  { name: 'Gothic Vigilante',       ref: 'GOTHIC_VIGILANTE',    body: 'HEROIC',      light: 'HEAVY_SHADOWS',     sw: 1.7, cs: 1.8, ws: 0.7, hs: 0.8, silhouette: 'Cape-heavy silhouette',       motion: 'Predatory motion',             camera: 'Extreme low-angle framing',    energy: 'Dark atmospheric FX',       bodyColor: C.orange, lightColor: C.muted },
  { name: 'Manga Dynamic',          ref: 'MANGA_DYNAMIC',       body: 'ATHLETIC',    light: 'HIGH_CONTRAST',     sw: 1.3, cs: 1.4, ws: 0.7, hs: 0.8, silhouette: 'Sharp dynamic silhouette',    motion: 'Extreme speed motion',         camera: 'Kinetic camera angles',        energy: 'Explosive impact lines',    bodyColor: C.blue,   lightColor: C.yellow },
  { name: 'Cinematic Realism',      ref: 'CINEMATIC_REALISM',   body: 'ATHLETIC',    light: 'CINEMATIC_RIM',     sw: 1.4, cs: 1.5, ws: 0.8, hs: 0.9, silhouette: 'Realistic silhouette',        motion: 'Film-style movement',          camera: 'Hollywood framing',            energy: 'Volumetric lighting FX',    bodyColor: C.blue,   lightColor: C.cyan },
  { name: 'Sword And Sorcery',      ref: 'SWORD_AND_SORCERY',   body: 'MUSCULAR',    light: 'SOFT_DRAMATIC',     sw: 1.7, cs: 1.8, ws: 0.8, hs: 0.9, silhouette: 'Barbarian silhouette',        motion: 'Heavy melee motion',           camera: 'Epic fantasy framing',         energy: 'Magic fire FX',            bodyColor: C.red,    lightColor: C.orange },
  { name: 'Space Opera',            ref: 'SPACE_OPERA',          body: 'COSMIC',      light: 'COSMIC_GLOW',       sw: 1.5, cs: 1.6, ws: 0.8, hs: 0.9, silhouette: 'Cosmic armor silhouette',    motion: 'Zero gravity motion',          camera: 'Wide galactic framing',        energy: 'Nebula FX',                bodyColor: C.purple, lightColor: C.cyan },
  { name: 'Heavy Metal Fantasy',    ref: 'HEAVY_METAL_FANTASY',  body: 'MASSIVE',     light: 'ATMOSPHERIC_FOG',   sw: 1.8, cs: 2.0, ws: 0.8, hs: 1.0, silhouette: 'Heavy fantasy silhouette',   motion: 'Violent metal motion',         camera: 'Epic metal framing',           energy: 'Fire and smoke FX',         bodyColor: C.red,    lightColor: C.muted },
  { name: 'Barbarian Warlord',      ref: 'BARBARIAN_WARLORD',   body: 'BRUTE',       light: 'HIGH_CONTRAST',     sw: 2.1, cs: 2.2, ws: 0.9, hs: 1.1, silhouette: 'Massive warrior silhouette', motion: 'Explosive melee movement',     camera: 'Dominant low-angle framing',   energy: 'Heavy debris impacts',      bodyColor: C.red,    lightColor: C.yellow },
  { name: 'Retro SciFi',            ref: 'RETRO_SCIFI',          body: 'ATHLETIC',    light: 'RETRO_FLAT',        sw: 1.4, cs: 1.4, ws: 0.8, hs: 0.9, silhouette: 'Retro future silhouette',    motion: 'Jet-age motion',               camera: 'Wide retro framing',           energy: 'Retro beam FX',            bodyColor: C.blue,   lightColor: C.muted },
  { name: 'Mythic God',             ref: 'MYTHIC_GOD',           body: 'COSMIC',      light: 'COSMIC_GLOW',       sw: 2.0, cs: 2.1, ws: 0.8, hs: 1.0, silhouette: 'Divine silhouette',          motion: 'Floating celestial motion',    camera: 'Epic god framing',             energy: 'Celestial energy FX',      bodyColor: C.purple, lightColor: C.cyan },
];

// ── Helpers ───────────────────────────────────────────────────────────────────
function SHeader({ title, color }: { title: string; color: string }) {
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
      <Text style={{ color, fontSize: 8.5, fontFamily: 'Inter_600SemiBold', letterSpacing: 0.3 }}>{label}</Text>
    </View>
  );
}

// ── Main Export ───────────────────────────────────────────────────────────────
export function StyleArchetypeReference() {
  const [expanded, setExpanded] = React.useState(false);
  type Tab = 'enums' | 'fields' | 'styles' | 'main';
  const [tab, setTab] = React.useState<Tab>('enums');

  const TABS: { id: Tab; label: string; color: string }[] = [
    { id: 'enums',  label: 'ENUMS',  color: C.yellow },
    { id: 'fields', label: 'FIELDS', color: C.blue },
    { id: 'styles', label: 'STYLES', color: C.orange },
    { id: 'main',   label: 'AI DIR', color: C.cyan },
  ];

  return (
    <View style={{ marginTop: 16, borderTopWidth: 1, borderTopColor: C.border, paddingTop: 16 }}>

      <TouchableOpacity
        onPress={() => { Haptics.selectionAsync(); setExpanded(v => !v); }}
        activeOpacity={0.8}
        style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: C.card, borderWidth: 1, borderColor: C.border, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, marginBottom: 4 }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <View style={{ backgroundColor: C.orange + '22', borderRadius: 6, padding: 5 }}>
            <Feather name="layers" size={13} color={C.orange} />
          </View>
          <View>
            <Text style={{ color: C.ink, fontSize: 12, fontFamily: 'Inter_700Bold', letterSpacing: 0.5 }}>
              StyleArchetypeReferenceSystem
            </Text>
            <Text style={{ color: C.muted, fontSize: 9.5, fontFamily: 'Inter_400Regular', marginTop: 1 }}>
              15 archetypes · 4 enums · 27 fields · Comic + Cover AI
            </Text>
          </View>
        </View>
        <Feather name={expanded ? 'chevron-up' : 'chevron-down'} size={14} color={C.muted} />
      </TouchableOpacity>

      {expanded && (
        <View style={{ backgroundColor: C.bg, borderWidth: 1, borderColor: C.border, borderRadius: 12, padding: 14 }}>

          <Text style={{ color: C.muted, fontSize: 9.5, fontFamily: 'Inter_400Regular', marginBottom: 2, fontStyle: 'italic' }}>
            {'// StyleArchetypeReferenceSystem — AI Reference Only'}
          </Text>
          <Text style={{ color: C.muted, fontSize: 9.5, fontFamily: 'Inter_400Regular', marginBottom: 12, fontStyle: 'italic' }}>
            {'// Comic Art Studio AI Generator + Cover Creator AI Generator'}
          </Text>

          {/* Tab bar */}
          <View style={{ flexDirection: 'row', gap: 6, marginBottom: 14 }}>
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

          {/* ── ENUMS tab ── */}
          {tab === 'enums' && (
            <View>
              {ENUMS.map((e, ei) => (
                <View key={e.name} style={{ marginBottom: ei < ENUMS.length - 1 ? 16 : 0 }}>
                  <SHeader title={`enum ${e.name}  (${e.values.length})`} color={e.color} />
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
                    {e.values.map(v => <Chip key={v} label={v} color={e.color} />)}
                  </View>
                </View>
              ))}
            </View>
          )}

          {/* ── FIELDS tab ── */}
          {tab === 'fields' && (
            <View>
              <Text style={{ color: C.orange, fontSize: 10, fontFamily: 'Inter_700Bold', marginBottom: 14 }}>
                {'static class StyleReference  {  // 27 fields'}
              </Text>
              {FIELD_GROUPS.map((g, gi) => (
                <View key={g.group} style={{ marginBottom: gi < FIELD_GROUPS.length - 1 ? 14 : 0 }}>
                  <SHeader title={g.group} color={g.color} />
                  {g.fields.map((f, fi) => (
                    <View key={f.name} style={{ flexDirection: 'row', alignItems: 'flex-start', paddingVertical: 3, borderBottomWidth: fi < g.fields.length - 1 ? 1 : 0, borderBottomColor: C.border }}>
                      <View style={{ backgroundColor: g.color + '1A', borderRadius: 4, paddingHorizontal: 5, paddingVertical: 2, marginRight: 8, flexShrink: 0, alignSelf: 'flex-start' }}>
                        <Text style={{ color: g.color, fontSize: 8, fontFamily: 'Inter_700Bold' }}>{f.type}</Text>
                      </View>
                      <Text style={{ color: C.ink, fontSize: 10, fontFamily: 'Inter_400Regular', flex: 1 }}>{f.name}</Text>
                    </View>
                  ))}
                </View>
              ))}
              <Text style={{ color: C.orange, fontSize: 10, fontFamily: 'Inter_700Bold', marginTop: 10 }}>{'}'}</Text>
            </View>
          )}

          {/* ── STYLES tab ── */}
          {tab === 'styles' && (
            <View>
              <SHeader title={`StyleDatabase.initialize()  — ${STYLES.length} archetypes`} color={C.orange} />
              {STYLES.map((s, i) => (
                <View key={s.ref} style={{ paddingVertical: 9, borderBottomWidth: i < STYLES.length - 1 ? 1 : 0, borderBottomColor: C.border }}>
                  {/* Name + badges */}
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 5, flexWrap: 'wrap' }}>
                    <Text style={{ color: C.ink, fontSize: 11, fontFamily: 'Inter_700Bold', marginRight: 2 }}>{s.name}</Text>
                    <View style={{ backgroundColor: s.bodyColor + '20', borderRadius: 4, paddingHorizontal: 5, paddingVertical: 2 }}>
                      <Text style={{ color: s.bodyColor, fontSize: 8, fontFamily: 'Inter_700Bold' }}>{s.body}</Text>
                    </View>
                    <View style={{ backgroundColor: s.lightColor + '20', borderRadius: 4, paddingHorizontal: 5, paddingVertical: 2 }}>
                      <Text style={{ color: s.lightColor, fontSize: 8, fontFamily: 'Inter_700Bold' }}>{s.light}</Text>
                    </View>
                  </View>
                  {/* Anatomy row */}
                  <View style={{ flexDirection: 'row', gap: 8, marginBottom: 5 }}>
                    {[['SW', s.sw], ['CS', s.cs], ['WS', s.ws], ['HS', s.hs]].map(([lbl, val]) => (
                      <View key={String(lbl)} style={{ alignItems: 'center' }}>
                        <Text style={{ color: C.muted, fontSize: 8, fontFamily: 'Inter_400Regular' }}>{String(lbl)}</Text>
                        <Text style={{ color: C.yellow, fontSize: 9, fontFamily: 'Inter_700Bold' }}>{Number(val).toFixed(1)}</Text>
                      </View>
                    ))}
                    <View style={{ flex: 1 }} />
                    <Text style={{ color: C.muted, fontSize: 8.5, fontFamily: 'Inter_400Regular', fontStyle: 'italic', alignSelf: 'center' }}>{s.ref}</Text>
                  </View>
                  {/* Style fields */}
                  {[
                    { label: 'SILHOUETTE', value: s.silhouette, color: C.blue },
                    { label: 'MOTION',     value: s.motion,     color: C.orange },
                    { label: 'CAMERA',     value: s.camera,     color: C.purple },
                    { label: 'ENERGY',     value: s.energy,     color: C.cyan },
                  ].map(row => (
                    <View key={row.label} style={{ flexDirection: 'row', alignItems: 'flex-start', marginBottom: 2 }}>
                      <Text style={{ color: row.color, fontSize: 8, fontFamily: 'Inter_700Bold', width: 68 }}>{row.label}</Text>
                      <Text style={{ color: C.muted, fontSize: 9, fontFamily: 'Inter_400Regular', flex: 1 }}>{row.value}</Text>
                    </View>
                  ))}
                </View>
              ))}
            </View>
          )}

          {/* ── AI DIR tab ── */}
          {tab === 'main' && (
            <View>
              <SHeader title="StyleDatabase.getAllStyles()" color={C.cyan} />
              <View style={{ backgroundColor: C.card, borderRadius: 8, padding: 10, borderWidth: 1, borderColor: C.border, marginBottom: 14 }}>
                <Text style={{ color: C.muted, fontSize: 9, fontFamily: 'Inter_400Regular', marginBottom: 6, fontStyle: 'italic' }}>
                  {'// Returns List<StyleReference> — all 15 archetypes'}
                </Text>
                <Text style={{ color: C.yellow, fontSize: 9.5, fontFamily: 'Inter_400Regular', lineHeight: 15 }}>
                  {'public List<StyleReference> getAllStyles() {\n    return styles;\n}'}
                </Text>
              </View>

              <SHeader title="main() — database load test" color={C.yellow} />
              <View style={{ backgroundColor: '#0A0800', borderRadius: 8, padding: 10, borderWidth: 1, borderColor: C.border, marginBottom: 14 }}>
                <Text style={{ color: C.yellow, fontSize: 9.5, fontFamily: 'Inter_400Regular', lineHeight: 15 }}>
                  {'StyleDatabase database = new StyleDatabase();\ndatabase.initialize();\n\n// Output:\nSTYLE ARCHETYPE DATABASE LOADED\nCOMIC ART STUDIO AI READY\nCOVER CREATOR AI READY\nTOTAL STYLE REFERENCES: 15'}
                </Text>
              </View>

              <SHeader title="StyleReference.toString() output per entry" color={C.orange} />
              <View style={{ backgroundColor: '#0A0800', borderRadius: 8, padding: 10, borderWidth: 1, borderColor: C.border, marginBottom: 14 }}>
                <Text style={{ color: C.yellow, fontSize: 9.5, fontFamily: 'Inter_400Regular', lineHeight: 15 }}>
                  {'// for (StyleReference style : database.getAllStyles())\n//     System.out.println(style);\n\n================================================\nARCHETYPE: Kirby Cosmic Warlord\nSTYLE:      KIRBY_COSMIC\nBODY TYPE:  MASSIVE\nLIGHTING:   COSMIC_GLOW\n================================================\n\n  ...repeats for all 15 archetypes'}
                </Text>
              </View>

              <SHeader title="Shared defaults applied to every archetype" color={C.green} />
              {[
                { field: 'costumeBehavior',  value: '"Dynamic cloth simulation"' },
                { field: 'shadowProfile',    value: '"Classic comics cinematic contrast"' },
                { field: 'impactStyle',      value: '"Sequential impact bursts"' },
                { field: 'debrisStyle',      value: '"Foreground debris layering"' },
                { field: 'atmosphericStyle', value: '"Volumetric comic atmosphere"' },
                { field: 'coverComposition', value: '"Hero centered cinematic"' },
                { field: 'focalPointDesign', value: '"Foreground impact emphasis"' },
                { field: 'eyeFlowDesign',    value: '"Z pattern comic flow"' },
                { field: 'handScale',        value: '1.2f' },
                { field: 'neckScale',        value: '1.1f' },
                { field: 'all 6 AI flags',   value: 'true' },
              ].map(row => (
                <View key={row.field} style={{ flexDirection: 'row', alignItems: 'flex-start', paddingVertical: 3, borderBottomWidth: 1, borderBottomColor: C.border }}>
                  <Text style={{ color: C.green, fontSize: 9, fontFamily: 'Inter_600SemiBold', width: 130 }}>{row.field}</Text>
                  <Text style={{ color: C.muted, fontSize: 9, fontFamily: 'Inter_400Regular', flex: 1 }}>{row.value}</Text>
                </View>
              ))}
            </View>
          )}

          <Text style={{ color: C.border, fontSize: 9, fontFamily: 'Inter_400Regular', marginTop: 16, textAlign: 'center', letterSpacing: 0.5 }}>
            AI REFERENCE ONLY · NOT IMPLEMENTED · StyleArchetypeReferenceSystem
          </Text>
        </View>
      )}
    </View>
  );
}
