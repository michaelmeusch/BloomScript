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

// ── Enums ─────────────────────────────────────────────────────────────────────
const FX_ENUMS: { name: string; color: string; values: string[] }[] = [
  { name: 'FXCategory', color: C.red, values: [
    'KINETIC_IMPACT','ENERGY_BLAST','CONCUSSIVE_FORCE','REPULSION_FIELD',
    'SHOCKWAVE','LASER_BLAST','PLASMA','COSMIC_BEAM','MAGIC_BLAST',
    'ELECTRIC_SURGE','SONIC_WAVE','SPEED_IMPACT','CHEST_HIT','FORCE_BOLT',
    'EXPLOSION','GROUND_CRACK','DEBRIS_FIELD','FIRE_BURST','SMOKE_TRAIL',
    'ATMOSPHERIC_DISTORTION','POWER_CHARGE','DEFENSIVE_SHIELD',
    'DIMENSIONAL_RIFT','COVER_COMPOSITION_FX',
  ]},
  { name: 'ForceType', color: C.orange, values: [
    'KINETIC','REPULSIVE','EXPLOSIVE','PIERCING','THERMAL',
    'ELECTRICAL','COSMIC','SONIC','GRAVITATIONAL','DIMENSIONAL','MAGICAL',
  ]},
  { name: 'FXIntensity', color: C.yellow, values: [
    'LOW','MEDIUM','HIGH','MASSIVE','APOCALYPTIC',
  ]},
  { name: 'AITargetSystem', color: C.cyan, values: [
    'COMIC_ART_STUDIO_AI_GENERATOR','COVER_CREATOR_AI_GENERATOR','BOTH',
  ]},
];

// ── Field groups ──────────────────────────────────────────────────────────────
type FieldGroup = { section: string; color: string; fields: { type: string; name: string; desc: string }[] };

const FX_FIELD_GROUPS: FieldGroup[] = [
  { section: 'Core Identity', color: C.red, fields: [
    { type: 'String',         name: 'id',             desc: 'Unique identifier e.g. superman_punch' },
    { type: 'String',         name: 'fxName',         desc: 'Display name of the effect' },
    { type: 'FXCategory',     name: 'category',       desc: 'Effect category (24 types)' },
    { type: 'ForceType',      name: 'forceType',      desc: 'Physical force driving the FX (11 types)' },
    { type: 'FXIntensity',    name: 'intensity',      desc: 'Scale: LOW → APOCALYPTIC (5 levels)' },
    { type: 'AITargetSystem', name: 'targetSystem',   desc: 'Which AI generator uses this effect' },
  ]},
  { section: 'Visual Language', color: C.orange, fields: [
    { type: 'String', name: 'visualBehavior',       desc: 'How the FX looks e.g. "Radial impact burst"' },
    { type: 'String', name: 'motionPattern',        desc: 'Movement path e.g. "Forward explosive force"' },
    { type: 'String', name: 'impactReaction',       desc: 'Target body response e.g. "Torso compression"' },
    { type: 'String', name: 'environmentalReaction',desc: 'Background damage e.g. "Concrete fragmentation"' },
    { type: 'String', name: 'lightingBehavior',     desc: 'Light output e.g. "White impact flare"' },
    { type: 'String', name: 'cinematicPurpose',     desc: 'Narrative role of this FX in the scene' },
  ]},
  { section: 'Character Reaction', color: C.yellow, fields: [
    { type: 'String', name: 'bodyCompression',      desc: 'Torso / limb compression during hit' },
    { type: 'String', name: 'recoilBehavior',       desc: 'Backward / angular displacement pattern' },
    { type: 'String', name: 'clothingDisplacement', desc: 'Fabric force-reaction descriptor' },
    { type: 'String', name: 'capeReaction',         desc: 'Cape blast displacement behavior' },
  ]},
  { section: 'Cover Composition', color: C.cyan, fields: [
    { type: 'String', name: 'eyeFlowDirection',      desc: 'Reader eye-path e.g. "Left to right Z-flow"' },
    { type: 'String', name: 'focalPointBehavior',    desc: 'Where focus lands e.g. "Center impact emphasis"' },
    { type: 'String', name: 'depthRecommendation',   desc: 'Layering tip e.g. "Foreground debris layering"' },
    { type: 'String', name: 'silhouetteEnhancement', desc: 'Outline treatment e.g. "Backlit character outline"' },
  ]},
  { section: 'Effect Flags', color: C.green, fields: [
    { type: 'boolean', name: 'cinematic',                desc: 'Designed for cinematic panel framing' },
    { type: 'boolean', name: 'coverFriendly',            desc: 'Usable as primary cover art element' },
    { type: 'boolean', name: 'environmentDamage',        desc: 'Generates background destruction' },
    { type: 'boolean', name: 'atmosphericDistortion',    desc: 'Warps the surrounding air/space' },
    { type: 'boolean', name: 'sequentialFlowCompatible', desc: 'Works across multi-panel sequences' },
    { type: 'boolean', name: 'motionBlur',               desc: 'Requires motion-blur rendering pass' },
    { type: 'boolean', name: 'debrisGeneration',         desc: 'Spawns particle debris layer' },
    { type: 'boolean', name: 'glowEffects',              desc: 'Emits bloom / glow overlay' },
  ]},
  { section: 'Power Values', color: C.purple, fields: [
    { type: 'float', name: 'blastRadius',              desc: '0.0 pinpoint → 1.0 full-screen radius' },
    { type: 'float', name: 'recoilForce',              desc: '0.0 no recoil → 1.0 full-body throw' },
    { type: 'float', name: 'environmentalDamageRadius',desc: '0.0 none → 1.0 city-block destruction' },
    { type: 'float', name: 'visualNoise',              desc: '0.0 clean → 1.0 maximum chaos' },
    { type: 'float', name: 'glowIntensity',            desc: '0.0 no glow → 1.0 blinding bloom' },
  ]},
  { section: 'Tags & References', color: C.blue, fields: [
    { type: 'List<String>', name: 'keywords',           desc: 'AI prompt tags: comic, cinematic, marvel...' },
    { type: 'List<String>', name: 'compatibleScenes',   desc: 'Scene types that suit this FX' },
    { type: 'List<String>', name: 'compatiblePoses',    desc: 'Pose IDs that pair well with this FX' },
    { type: 'String',       name: 'previewImage',       desc: 'Path to FX reference image' },
    { type: 'String',       name: 'animationReference', desc: 'Path to motion reference file' },
    { type: 'String',       name: 'shaderReference',    desc: 'Path to shader / VFX reference' },
  ]},
];

// ── Sample FX ─────────────────────────────────────────────────────────────────
const SAMPLE_FX: {
  id: string; name: string; cat: string; force: string; intensity: string;
  target: string; visual: string; motion: string; lighting: string;
}[] = [
  { id: 'superman_punch',    name: 'Massive Kinetic Punch',   cat: 'KINETIC_IMPACT',       force: 'KINETIC',     intensity: 'HIGH',        target: 'BOTH',                      visual: 'Radial impact burst',         motion: 'Forward explosive force',     lighting: 'White impact flare' },
  { id: 'alien_purple_blast',name: 'Alien Purple Blast',      cat: 'ENERGY_BLAST',         force: 'COSMIC',      intensity: 'MASSIVE',     target: 'BOTH',                      visual: 'Chaotic purple plasma',       motion: 'Spiral beam distortion',      lighting: 'Violet energy bloom' },
  { id: 'repulsion_field',   name: 'Repulsion Field',         cat: 'REPULSION_FIELD',      force: 'REPULSIVE',   intensity: 'HIGH',        target: 'BOTH',                      visual: 'Transparent energy dome',     motion: 'Ripple wave expansion',       lighting: 'Blue edge glow' },
  { id: 'concussive_wave',   name: 'Concussive Force Burst',  cat: 'CONCUSSIVE_FORCE',     force: 'REPULSIVE',   intensity: 'HIGH',        target: 'BOTH',                      visual: 'Air compression rings',       motion: 'Expanding shockwave',         lighting: 'Compressed flash lighting' },
  { id: 'ship_laser',        name: 'Ship Cannon Laser',       cat: 'LASER_BLAST',          force: 'PIERCING',    intensity: 'APOCALYPTIC', target: 'BOTH',                      visual: 'Focused energy beam',         motion: 'Linear beam pressure',        lighting: 'Extreme light bloom' },
  { id: 'blow_to_chest',     name: 'Chest Blow Impact',       cat: 'CHEST_HIT',            force: 'KINETIC',     intensity: 'MEDIUM',      target: 'BOTH',                      visual: 'Impact burst ring',           motion: 'Focused collision force',     lighting: 'Brief flash burst' },
  { id: 'kinetic_force_bolt',name: 'Kinetic Force Bolt',      cat: 'FORCE_BOLT',           force: 'KINETIC',     intensity: 'HIGH',        target: 'BOTH',                      visual: 'Compressed energy projectile',motion: 'High-speed bolt motion',      lighting: 'Pressure burst lighting' },
  { id: 'shockwave_ring',    name: 'Shockwave Ring',          cat: 'SHOCKWAVE',            force: 'EXPLOSIVE',   intensity: 'HIGH',        target: 'BOTH',                      visual: 'Circular pressure burst',     motion: 'Expanding radial wave',       lighting: 'Pressure glow' },
  { id: 'cosmic_beam',       name: 'Cosmic Beam',             cat: 'COSMIC_BEAM',          force: 'COSMIC',      intensity: 'APOCALYPTIC', target: 'BOTH',                      visual: 'Massive celestial beam',      motion: 'Continuous beam pressure',    lighting: 'Celestial illumination' },
  { id: 'lightning_surge',   name: 'Electric Surge',          cat: 'ELECTRIC_SURGE',       force: 'ELECTRICAL',  intensity: 'HIGH',        target: 'BOTH',                      visual: 'Chaotic lightning arcs',      motion: 'Branching electricity',       lighting: 'Blue-white flashes' },
  { id: 'sonic_wave',        name: 'Sonic Wave Blast',        cat: 'SONIC_WAVE',           force: 'SONIC',       intensity: 'HIGH',        target: 'BOTH',                      visual: 'Visible vibration rings',     motion: 'Cone pressure motion',        lighting: 'Frequency shimmer' },
  { id: 'comic_explosion',   name: 'Comic Explosion Burst',   cat: 'EXPLOSION',            force: 'EXPLOSIVE',   intensity: 'APOCALYPTIC', target: 'BOTH',                      visual: 'Massive radial explosion',    motion: 'Debris sphere expansion',     lighting: 'Extreme fire bloom' },
  { id: 'ground_slam',       name: 'Ground Slam Impact',      cat: 'GROUND_CRACK',         force: 'KINETIC',     intensity: 'MASSIVE',     target: 'BOTH',                      visual: 'Radial crack expansion',      motion: 'Ground rupture shockwave',    lighting: 'Dust flare lighting' },
  { id: 'debris_cloud',      name: 'Debris Cloud',            cat: 'DEBRIS_FIELD',         force: 'EXPLOSIVE',   intensity: 'HIGH',        target: 'BOTH',                      visual: 'Flying debris storm',         motion: 'Directional fragment motion', lighting: 'Dust atmosphere' },
  { id: 'fire_burst',        name: 'Fire Burst',              cat: 'FIRE_BURST',           force: 'THERMAL',     intensity: 'HIGH',        target: 'BOTH',                      visual: 'Expanding flame bloom',       motion: 'Heatwave turbulence',         lighting: 'Orange-red illumination' },
  { id: 'smoke_trail',       name: 'Smoke Trail',             cat: 'SMOKE_TRAIL',          force: 'THERMAL',     intensity: 'MEDIUM',      target: 'BOTH',                      visual: 'Flowing smoke ribbons',       motion: 'Trailing motion blur',        lighting: 'Dark haze' },
  { id: 'energy_charge',     name: 'Energy Charge',           cat: 'POWER_CHARGE',         force: 'COSMIC',      intensity: 'HIGH',        target: 'BOTH',                      visual: 'Energy accumulation',         motion: 'Orbital particle motion',     lighting: 'Glow buildup' },
  { id: 'defensive_barrier', name: 'Defensive Barrier',       cat: 'DEFENSIVE_SHIELD',     force: 'REPULSIVE',   intensity: 'HIGH',        target: 'BOTH',                      visual: 'Protective energy shell',     motion: 'Ripple wave response',        lighting: 'Shield edge glow' },
  { id: 'dimensional_rift',  name: 'Dimensional Rift',        cat: 'DIMENSIONAL_RIFT',     force: 'DIMENSIONAL', intensity: 'APOCALYPTIC', target: 'BOTH',                      visual: 'Reality tearing',             motion: 'Chaotic spatial distortion',  lighting: 'Void illumination' },
  { id: 'cover_energy_frame',name: 'Cover Energy Frame',      cat: 'COVER_COMPOSITION_FX', force: 'COSMIC',      intensity: 'HIGH',        target: 'COVER_CREATOR_AI_GENERATOR', visual: 'Framing energy arcs',         motion: 'Circular composition flow',   lighting: 'Focal illumination' },
];

// ── Scene keywords driving AIFXDirector ──────────────────────────────────────
const SCENE_RULES: { keyword: string[]; maps: string; result: string }[] = [
  { keyword: ['"purple"', '"alien"'], maps: 'ENERGY_BLAST',       result: 'alien_purple_blast' },
  { keyword: ['"laser"'],             maps: 'LASER_BLAST',         result: 'ship_laser' },
  { keyword: ['"repulsion"'],         maps: 'REPULSION_FIELD',     result: 'repulsion_field' },
  { keyword: ['"chest"'],             maps: 'CHEST_HIT',           result: 'blow_to_chest' },
  { keyword: ['(default)'],           maps: 'getAllEffects()[0]',   result: 'superman_punch' },
];

// ── Type color map ────────────────────────────────────────────────────────────
const TC: Record<string, string> = {
  'String': C.blue, 'float': C.yellow, 'boolean': C.green,
  'List<String>': C.purple, 'FXCategory': C.red,
  'ForceType': C.orange, 'FXIntensity': C.yellow, 'AITargetSystem': C.cyan,
};

// ── Sub-components ────────────────────────────────────────────────────────────
function FXFieldRow({ f, last }: { f: { type: string; name: string; desc: string }; last: boolean }) {
  const tc = TC[f.type] ?? C.ink;
  return (
    <View style={{ flexDirection: 'row', alignItems: 'flex-start', paddingVertical: 5, borderBottomWidth: last ? 0 : 1, borderBottomColor: C.border }}>
      <View style={{ width: 160, flexDirection: 'row', alignItems: 'center', gap: 5, flexShrink: 0 }}>
        <View style={{ backgroundColor: tc + '20', borderRadius: 4, paddingHorizontal: 4, paddingVertical: 2 }}>
          <Text style={{ color: tc, fontSize: 8, fontFamily: 'Inter_700Bold' }}>{f.type}</Text>
        </View>
        <Text style={{ color: C.ink, fontSize: 10, fontFamily: 'Inter_600SemiBold' }}>{f.name}</Text>
      </View>
      <Text style={{ color: C.muted, fontSize: 9.5, fontFamily: 'Inter_400Regular', flex: 1, lineHeight: 14 }}>
        {'// '}{f.desc}
      </Text>
    </View>
  );
}

function FXSectionHeader({ title, count, color }: { title: string; count?: string; color: string }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8, gap: 7 }}>
      <View style={{ width: 3, height: 13, backgroundColor: color, borderRadius: 2 }} />
      <Text style={{ color, fontSize: 10, fontFamily: 'Inter_700Bold', letterSpacing: 0.8, flex: 1 }}>{title}</Text>
      {count ? <Text style={{ color: C.muted, fontSize: 9, fontFamily: 'Inter_400Regular' }}>{count}</Text> : null}
    </View>
  );
}

// ── Intensity color helper ────────────────────────────────────────────────────
function intensityColor(i: string): string {
  if (i === 'APOCALYPTIC') return C.red;
  if (i === 'MASSIVE')     return C.orange;
  if (i === 'HIGH')        return C.yellow;
  if (i === 'MEDIUM')      return C.green;
  return C.muted;
}

// ── Main Export ───────────────────────────────────────────────────────────────
export function ImpactFXReference() {
  const [expanded, setExpanded] = React.useState(false);
  type Tab = 'enums' | 'fields' | 'fx' | 'ai';
  const [tab, setTab] = React.useState<Tab>('enums');

  const TABS: { id: Tab; label: string; color: string }[] = [
    { id: 'enums',  label: 'ENUMS',  color: C.red },
    { id: 'fields', label: 'FIELDS', color: C.yellow },
    { id: 'fx',     label: 'FX',     color: C.orange },
    { id: 'ai',     label: 'AI DIR', color: C.purple },
  ];

  const totalFields = FX_FIELD_GROUPS.reduce((n, g) => n + g.fields.length, 0);

  return (
    <View style={{ marginTop: 16, borderTopWidth: 1, borderTopColor: C.border, paddingTop: 16 }}>

      <TouchableOpacity
        onPress={() => { Haptics.selectionAsync(); setExpanded(v => !v); }}
        activeOpacity={0.8}
        style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: C.card, borderWidth: 1, borderColor: C.border, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, marginBottom: 4 }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <View style={{ backgroundColor: C.red + '22', borderRadius: 6, padding: 5 }}>
            <Feather name="zap" size={13} color={C.red} />
          </View>
          <View>
            <Text style={{ color: C.ink, fontSize: 12, fontFamily: 'Inter_700Bold', letterSpacing: 0.5 }}>
              ImpactFXRepository
            </Text>
            <Text style={{ color: C.muted, fontSize: 9.5, fontFamily: 'Inter_400Regular', marginTop: 1 }}>
              com.bloomscript.ai.fx · {SAMPLE_FX.length} effects · 4 enums · {totalFields} fields · AI reference only
            </Text>
          </View>
        </View>
        <Feather name={expanded ? 'chevron-up' : 'chevron-down'} size={14} color={C.muted} />
      </TouchableOpacity>

      {expanded && (
        <View style={{ backgroundColor: C.bg, borderWidth: 1, borderColor: C.border, borderRadius: 12, padding: 14 }}>

          <Text style={{ color: C.muted, fontSize: 9.5, fontFamily: 'Inter_400Regular', marginBottom: 2, fontStyle: 'italic' }}>
            {'package com.bloomscript.ai.fx;'}
          </Text>
          <Text style={{ color: C.muted, fontSize: 9.5, fontFamily: 'Inter_400Regular', marginBottom: 4, fontStyle: 'italic' }}>
            {'// Targets: Comic Art Studio AI Generator · Cover Creator AI Generator'}
          </Text>
          <Text style={{ color: C.muted, fontSize: 9.5, fontFamily: 'Inter_400Regular', marginBottom: 12, fontStyle: 'italic' }}>
            {'// Inspired by: Western Comics · Dark Horse · Manga FX · Cinematic Storyboards'}
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

          {/* ── ENUMS ── */}
          {tab === 'enums' && (
            <View>
              {FX_ENUMS.map(en => (
                <View key={en.name} style={{ marginBottom: 14 }}>
                  <FXSectionHeader title={`enum ${en.name}`} count={`${en.values.length} values`} color={en.color} />
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 5 }}>
                    {en.values.map(v => (
                      <View key={v} style={{ backgroundColor: en.color + '18', borderWidth: 1, borderColor: en.color + '44', borderRadius: 6, paddingHorizontal: 7, paddingVertical: 3 }}>
                        <Text style={{ color: en.color, fontSize: 9, fontFamily: 'Inter_600SemiBold' }}>{v}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              ))}
            </View>
          )}

          {/* ── FIELDS ── */}
          {tab === 'fields' && (
            <View>
              <Text style={{ color: C.yellow, fontSize: 10, fontFamily: 'Inter_700Bold', marginBottom: 12 }}>
                {'public static class FXReference {  // '}{totalFields}{' fields'}
              </Text>
              {FX_FIELD_GROUPS.map((group, gi) => (
                <View key={group.section} style={{ marginBottom: gi < FX_FIELD_GROUPS.length - 1 ? 16 : 0 }}>
                  <FXSectionHeader title={group.section} color={group.color} />
                  {group.fields.map((f, i) => (
                    <FXFieldRow key={f.name} f={f} last={i === group.fields.length - 1} />
                  ))}
                </View>
              ))}
              <Text style={{ color: C.yellow, fontSize: 10, fontFamily: 'Inter_700Bold', marginTop: 12 }}>{'}'}</Text>
            </View>
          )}

          {/* ── FX ── */}
          {tab === 'fx' && (
            <View>
              <FXSectionHeader title="FXDatabase.initialize()" count={`${SAMPLE_FX.length} effects`} color={C.orange} />
              {SAMPLE_FX.map((fx, i) => {
                const ic = intensityColor(fx.intensity);
                const isCoverOnly = fx.target === 'COVER_CREATOR_AI_GENERATOR';
                return (
                  <View key={fx.id} style={{ paddingVertical: 7, borderBottomWidth: i < SAMPLE_FX.length - 1 ? 1 : 0, borderBottomColor: C.border }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 2, flexWrap: 'wrap' }}>
                      <Text style={{ color: C.yellow, fontSize: 10, fontFamily: 'Inter_700Bold' }}>{fx.id}</Text>
                      <View style={{ backgroundColor: C.border, borderRadius: 4, paddingHorizontal: 5, paddingVertical: 1 }}>
                        <Text style={{ color: C.muted, fontSize: 8, fontFamily: 'Inter_600SemiBold' }}>{fx.cat}</Text>
                      </View>
                      <View style={{ backgroundColor: ic + '22', borderRadius: 4, paddingHorizontal: 5, paddingVertical: 1 }}>
                        <Text style={{ color: ic, fontSize: 8, fontFamily: 'Inter_700Bold' }}>{fx.intensity}</Text>
                      </View>
                      {isCoverOnly && (
                        <View style={{ backgroundColor: C.cyan + '22', borderRadius: 4, paddingHorizontal: 5, paddingVertical: 1 }}>
                          <Text style={{ color: C.cyan, fontSize: 8, fontFamily: 'Inter_600SemiBold' }}>COVER ONLY</Text>
                        </View>
                      )}
                    </View>
                    <Text style={{ color: C.ink, fontSize: 10.5, fontFamily: 'Inter_600SemiBold', marginBottom: 2 }}>{fx.name}</Text>
                    <Text style={{ color: C.muted, fontSize: 8.5, fontFamily: 'Inter_400Regular', marginBottom: 2 }}>
                      {fx.force} · {fx.visual}
                    </Text>
                    <Text style={{ color: C.muted, fontSize: 9, fontFamily: 'Inter_400Regular', fontStyle: 'italic' }}>
                      {fx.motion} · {fx.lighting}
                    </Text>
                  </View>
                );
              })}
            </View>
          )}

          {/* ── AI DIR ── */}
          {tab === 'ai' && (
            <View>
              <FXSectionHeader title="class AIFXDirector" color={C.purple} />
              <Text style={{ color: C.purple, fontSize: 10, fontFamily: 'Inter_700Bold', marginBottom: 10 }}>
                {'public static class AIFXDirector {'}
              </Text>

              {/* Method signature */}
              <View style={{ flexDirection: 'row', alignItems: 'flex-start', paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: C.border, marginBottom: 12 }}>
                <View style={{ width: 160, flexDirection: 'row', alignItems: 'center', gap: 5, flexShrink: 0 }}>
                  <View style={{ backgroundColor: C.blue + '20', borderRadius: 4, paddingHorizontal: 4, paddingVertical: 2 }}>
                    <Text style={{ color: C.blue, fontSize: 8, fontFamily: 'Inter_700Bold' }}>String</Text>
                  </View>
                  <Text style={{ color: C.ink, fontSize: 9.5, fontFamily: 'Inter_600SemiBold' }}>sceneDescription</Text>
                </View>
                <Text style={{ color: C.muted, fontSize: 9.5, fontFamily: 'Inter_400Regular', flex: 1, lineHeight: 14 }}>
                  {'// Input: natural-language scene text → FXReference'}
                </Text>
              </View>

              {/* Keyword rules */}
              <FXSectionHeader title="analyzeScene() keyword rules" color={C.cyan} />
              {SCENE_RULES.map((r, i) => (
                <View key={i} style={{ flexDirection: 'row', alignItems: 'flex-start', paddingVertical: 5, borderBottomWidth: i < SCENE_RULES.length - 1 ? 1 : 0, borderBottomColor: C.border }}>
                  <View style={{ flexDirection: 'row', gap: 4, width: 140, flexShrink: 0, flexWrap: 'wrap' }}>
                    {r.keyword.map(k => (
                      <View key={k} style={{ backgroundColor: C.cyan + '18', borderRadius: 4, paddingHorizontal: 4, paddingVertical: 2 }}>
                        <Text style={{ color: C.cyan, fontSize: 8.5, fontFamily: 'Inter_600SemiBold' }}>{k}</Text>
                      </View>
                    ))}
                  </View>
                  <Text style={{ color: C.muted, fontSize: 9.5, fontFamily: 'Inter_400Regular', flex: 1, lineHeight: 14 }}>
                    {'→ '}<Text style={{ color: C.orange }}>{r.maps}</Text>{'  ('}<Text style={{ color: C.yellow }}>{r.result}</Text>{')'}
                  </Text>
                </View>
              ))}

              <Text style={{ color: C.purple, fontSize: 10, fontFamily: 'Inter_700Bold', marginTop: 12, marginBottom: 12 }}>{'}'}</Text>

              {/* Test case */}
              <View style={{ backgroundColor: '#0A0800', borderRadius: 8, padding: 10, borderWidth: 1, borderColor: C.border }}>
                <Text style={{ color: C.muted, fontSize: 9, fontFamily: 'Inter_400Regular', marginBottom: 4, fontStyle: 'italic' }}>
                  {'// main() test case'}
                </Text>
                <Text style={{ color: C.yellow, fontSize: 9.5, fontFamily: 'Inter_400Regular', lineHeight: 15 }}>
                  {'director.analyzeScene(\n  "Jon was struck by an alien purple blast"\n)\n→ Matches: "purple" + "alien"\n→ Returns: alien_purple_blast\n   (ENERGY_BLAST · COSMIC · MASSIVE)'}
                </Text>
              </View>
            </View>
          )}

          <Text style={{ color: C.border, fontSize: 9, fontFamily: 'Inter_400Regular', marginTop: 16, textAlign: 'center', letterSpacing: 0.5 }}>
            AI REFERENCE ONLY · NOT IMPLEMENTED · com.bloomscript.ai.fx
          </Text>
        </View>
      )}
    </View>
  );
}
