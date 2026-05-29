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

// ── ArtifactType enum (16) ────────────────────────────────────────────────────
const ARTIFACT_TYPES: { value: string; color: string; category: string }[] = [
  { value: 'POWER_RING',     color: C.cyan,    category: 'worn' },
  { value: 'AMULET',         color: C.purple,  category: 'worn' },
  { value: 'HELMET',         color: C.blue,    category: 'worn' },
  { value: 'ARMOR',          color: C.blue,    category: 'worn' },
  { value: 'GAUNTLET',       color: C.blue,    category: 'worn' },
  { value: 'MASK',           color: C.muted,   category: 'worn' },
  { value: 'STAFF',          color: C.yellow,  category: 'wielded' },
  { value: 'SWORD',          color: C.red,     category: 'wielded' },
  { value: 'ORB',            color: C.cyan,    category: 'wielded' },
  { value: 'TOTEM',          color: C.green,   category: 'wielded' },
  { value: 'CRYSTAL',        color: C.cyan,    category: 'object' },
  { value: 'RELIC',          color: C.orange,  category: 'object' },
  { value: 'SCROLL',         color: C.muted,   category: 'object' },
  { value: 'BOOK',           color: C.muted,   category: 'object' },
  { value: 'COSMIC_OBJECT',  color: C.yellow,  category: 'cosmic' },
  { value: 'TECH_DEVICE',    color: C.green,   category: 'cosmic' },
];

// ── PowerSource enum (10) ─────────────────────────────────────────────────────
const POWER_SOURCES: { value: string; color: string; desc: string }[] = [
  { value: 'COSMIC',      color: C.yellow,  desc: 'universal energy from beyond reality' },
  { value: 'MAGIC',       color: C.purple,  desc: 'arcane or mystical force' },
  { value: 'TECHNOLOGY',  color: C.cyan,    desc: 'advanced engineering / AI-enhanced' },
  { value: 'DIVINE',      color: C.yellow,  desc: 'godly or celestial origin' },
  { value: 'DEMONIC',     color: C.red,     desc: 'dark, corrupting, infernal source' },
  { value: 'PSIONIC',     color: C.purple,  desc: 'mental / psychic resonance' },
  { value: 'ELEMENTAL',   color: C.green,   desc: 'fire, water, earth, air force' },
  { value: 'QUANTUM',     color: C.cyan,    desc: 'probability / reality manipulation' },
  { value: 'CELESTIAL',   color: C.yellow,  desc: 'star-born, cosmic hierarchy power' },
  { value: 'VOID',        color: C.muted,   desc: 'nothingness — anti-energy, entropy' },
];

// ── Artifact fields (13) ──────────────────────────────────────────────────────
const ARTIFACT_FIELDS: { name: string; type: string; note?: string }[] = [
  { name: 'artifactId',         type: 'String',       note: 'UUID.randomUUID()' },
  { name: 'name',               type: 'String' },
  { name: 'type',               type: 'ArtifactType' },
  { name: 'material',           type: 'String' },
  { name: 'glowColor',          type: 'String' },
  { name: 'origin',             type: 'String' },
  { name: 'powerSource',        type: 'String' },
  { name: 'symbolLanguage',     type: 'String' },
  { name: 'activationMethod',   type: 'String' },
  { name: 'visualDescription',  type: 'String' },
  { name: 'energyEffect',       type: 'String' },
  { name: 'summonStyle',        type: 'String' },
  { name: 'dangerLevel',        type: 'String' },
  { name: 'abilities',          type: 'List<String>', note: 'new ArrayList<>()' },
];

// ── SummoningEffect fields ────────────────────────────────────────────────────
const SUMMON_FIELDS: { name: string; color: string }[] = [
  { name: 'creatureName', color: C.red },
  { name: 'portalType',   color: C.purple },
  { name: 'energyColor',  color: C.cyan },
  { name: 'smokeEffect',  color: C.muted },
  { name: 'soundEffect',  color: C.orange },
];

// ── Keyword detection map ─────────────────────────────────────────────────────
const DETECTION: { keyword: string; returns: string; color: string }[] = [
  { keyword: '"ring"',    returns: 'POWER_RING', color: C.cyan },
  { keyword: '"amulet"',  returns: 'AMULET',     color: C.purple },
  { keyword: '"staff"',   returns: 'STAFF',       color: C.yellow },
  { keyword: '"sword"',   returns: 'SWORD',       color: C.red },
  { keyword: '"orb"',     returns: 'ORB',         color: C.cyan },
  { keyword: 'default',   returns: 'RELIC',       color: C.orange },
];

// ── AI chat question prompts ──────────────────────────────────────────────────
const QUESTIONS = [
  'shape', 'material', 'glow color', 'symbols',
  'powers', 'origin', 'activation method', 'emotional effect', 'summon effect',
];

// ── Future expansions ─────────────────────────────────────────────────────────
const FUTURE: { label: string; color: string }[] = [
  { label: 'AI Relic Designer',            color: C.purple },
  { label: 'AI Rune Generator',            color: C.cyan },
  { label: 'AI Alien Language Creator',    color: C.blue },
  { label: 'AI Weapon Evolution',          color: C.red },
  { label: 'AI Artifact History Timeline', color: C.orange },
  { label: 'AI Cosmic Energy Effects',     color: C.yellow },
  { label: 'AI Magic Circle Generator',    color: C.purple },
  { label: 'AI Portal FX',                 color: C.cyan },
  { label: 'AI Mythology Builder',         color: C.green },
  { label: 'AI Item Upgrade Tree',         color: C.orange },
  { label: 'AI Villain Relic Corruption',  color: C.red },
  { label: 'AI Sentient Weapon System',    color: C.yellow },
];

// ── Project folders ───────────────────────────────────────────────────────────
const FOLDERS = [
  'artifacts/', 'relics/', 'weapons/', 'summoning/', 'creatures/',
  'lore/', 'runes/', 'portals/', 'continuity/', 'prompts/', 'references/',
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

function PipelineStep({ n, label, color }: { n: number; label: string; color: string }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 5, borderBottomWidth: 1, borderBottomColor: C.border }}>
      <View style={{ width: 22, height: 22, borderRadius: 11, backgroundColor: color + '30', borderWidth: 1, borderColor: color + '60', alignItems: 'center', justifyContent: 'center', marginRight: 10, flexShrink: 0 }}>
        <Text style={{ color, fontSize: 9, fontFamily: 'Inter_700Bold' }}>{n}</Text>
      </View>
      <Text style={{ color, fontSize: 10.5, fontFamily: 'Inter_600SemiBold', fontStyle: 'italic', flex: 1 }}>"{label}"</Text>
    </View>
  );
}

// ── Main Export ───────────────────────────────────────────────────────────────
export function ArtifactPowerReference() {
  const [expanded, setExpanded] = React.useState(false);
  type Tab = 'enums' | 'fields' | 'pipeline' | 'aidir';
  const [tab, setTab] = React.useState<Tab>('enums');

  const TABS: { id: Tab; label: string; color: string }[] = [
    { id: 'enums',    label: 'ENUMS',    color: C.purple },
    { id: 'fields',   label: 'FIELDS',   color: C.orange },
    { id: 'pipeline', label: 'PIPELINE', color: C.red },
    { id: 'aidir',    label: 'AI DIR',   color: C.cyan },
  ];

  return (
    <View style={{ marginTop: 16, borderTopWidth: 1, borderTopColor: C.border, paddingTop: 16 }}>

      <TouchableOpacity
        onPress={() => { Haptics.selectionAsync(); setExpanded(v => !v); }}
        activeOpacity={0.8}
        style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: C.card, borderWidth: 1, borderColor: C.purple + '55', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, marginBottom: 4 }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <View style={{ backgroundColor: C.purple + '22', borderRadius: 6, padding: 5 }}>
            <Feather name="zap" size={13} color={C.purple} />
          </View>
          <View>
            <Text style={{ color: C.ink, fontSize: 12, fontFamily: 'Inter_700Bold', letterSpacing: 0.5 }}>
              AI Artifact + Power Object System
            </Text>
            <Text style={{ color: C.muted, fontSize: 9.5, fontFamily: 'Inter_400Regular', marginTop: 1 }}>
              9 packages · 14 classes · ArtifactType (16) · PowerSource (10)
            </Text>
          </View>
        </View>
        <Feather name={expanded ? 'chevron-up' : 'chevron-down'} size={14} color={C.muted} />
      </TouchableOpacity>

      {expanded && (
        <View style={{ backgroundColor: C.bg, borderWidth: 1, borderColor: C.purple + '44', borderRadius: 12, padding: 14 }}>

          <Text style={{ color: C.muted, fontSize: 9.5, fontFamily: 'Inter_400Regular', marginBottom: 2, fontStyle: 'italic' }}>
            {'// Comic Art Studio — AI Artifact + Power Object Reference System'}
          </Text>
          <Text style={{ color: C.muted, fontSize: 9.5, fontFamily: 'Inter_400Regular', marginBottom: 12, fontStyle: 'italic' }}>
            {'// Packages: artifacts · ai · chat · lore · prompts · generation · continuity · references · ui'}
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

          {/* ── ENUMS ── */}
          {tab === 'enums' && (
            <View>
              {/* ArtifactType */}
              <BHeader title="enum ArtifactType  (16 values · studio.artifacts)" color={C.purple} />
              {(['worn', 'wielded', 'object', 'cosmic'] as const).map(cat => {
                const items = ARTIFACT_TYPES.filter(a => a.category === cat);
                const catColors: Record<string, string> = { worn: C.blue, wielded: C.red, object: C.orange, cosmic: C.yellow };
                const catLabel: Record<string, string> = { worn: 'WORN', wielded: 'WIELDED', object: 'OBJECT', cosmic: 'COSMIC / TECH' };
                return (
                  <View key={cat} style={{ marginBottom: 12 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                      <View style={{ backgroundColor: catColors[cat] + '20', borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2 }}>
                        <Text style={{ color: catColors[cat], fontSize: 8, fontFamily: 'Inter_700Bold' }}>{catLabel[cat]}</Text>
                      </View>
                    </View>
                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', paddingLeft: 8 }}>
                      {items.map(a => <Chip key={a.value} label={a.value} color={a.color} />)}
                    </View>
                  </View>
                );
              })}

              <View style={{ height: 14 }} />

              {/* PowerSource */}
              <BHeader title="enum PowerSource  (10 values · studio.artifacts)" color={C.cyan} />
              <Text style={{ color: C.muted, fontSize: 9, fontFamily: 'Inter_400Regular', marginBottom: 10, fontStyle: 'italic' }}>
                {'// Classifies the energy origin of every artifact in the system'}
              </Text>
              {POWER_SOURCES.map((p, i) => (
                <View key={p.value} style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 5, borderBottomWidth: i < POWER_SOURCES.length - 1 ? 1 : 0, borderBottomColor: C.border }}>
                  <View style={{ backgroundColor: p.color + '20', borderRadius: 5, paddingHorizontal: 7, paddingVertical: 3, minWidth: 90, marginRight: 10, alignItems: 'center' }}>
                    <Text style={{ color: p.color, fontSize: 8.5, fontFamily: 'Inter_700Bold' }}>{p.value}</Text>
                  </View>
                  <Text style={{ color: C.muted, fontSize: 9, fontFamily: 'Inter_400Regular', flex: 1 }}>{p.desc}</Text>
                </View>
              ))}
            </View>
          )}

          {/* ── FIELDS ── */}
          {tab === 'fields' && (
            <View>
              {/* Artifact (13 fields) */}
              <BHeader title="class Artifact  (studio.artifacts · 14 fields)" color={C.orange} />
              <Text style={{ color: C.muted, fontSize: 9, fontFamily: 'Inter_400Regular', marginBottom: 8, fontStyle: 'italic' }}>
                {'// artifactId auto-set: UUID.randomUUID()\n// abilities auto-init: new ArrayList<>()'}
              </Text>
              {ARTIFACT_FIELDS.map((f, i) => (
                <View key={f.name} style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 4, borderBottomWidth: i < ARTIFACT_FIELDS.length - 1 ? 1 : 0, borderBottomColor: C.border }}>
                  <View style={{ backgroundColor: C.orange + '1A', borderRadius: 4, paddingHorizontal: 5, paddingVertical: 2, marginRight: 8, minWidth: 90, alignItems: 'center' }}>
                    <Text style={{ color: C.orange, fontSize: 8, fontFamily: 'Inter_700Bold' }}>{f.type}</Text>
                  </View>
                  <Text style={{ color: C.ink, fontSize: 10, fontFamily: 'Inter_400Regular', flex: 1 }}>{f.name}</Text>
                  {f.note && <Text style={{ color: C.muted, fontSize: 8, fontFamily: 'Inter_400Regular', fontStyle: 'italic' }}>{f.note}</Text>}
                </View>
              ))}

              <View style={{ height: 16 }} />

              {/* SummoningEffect */}
              <BHeader title="class SummoningEffect  (studio.generation)" color={C.red} />
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginBottom: 14 }}>
                {SUMMON_FIELDS.map(f => <Chip key={f.name} label={f.name} color={f.color} />)}
              </View>

              {/* ArtifactDetector keyword map */}
              <BHeader title="ArtifactDetector.detectArtifact(text)  — keyword map" color={C.cyan} />
              <Text style={{ color: C.muted, fontSize: 9, fontFamily: 'Inter_400Regular', marginBottom: 8, fontStyle: 'italic' }}>
                {'// text.toLowerCase() → contains() checks in order'}
              </Text>
              <View style={{ backgroundColor: C.card, borderRadius: 8, padding: 10, borderWidth: 1, borderColor: C.border }}>
                {DETECTION.map((d, i) => (
                  <View key={d.keyword} style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 5, borderBottomWidth: i < DETECTION.length - 1 ? 1 : 0, borderBottomColor: C.border }}>
                    <View style={{ backgroundColor: C.card, borderRadius: 4, borderWidth: 1, borderColor: C.border, paddingHorizontal: 6, paddingVertical: 2, marginRight: 10, minWidth: 60, alignItems: 'center' }}>
                      <Text style={{ color: C.yellow, fontSize: 9, fontFamily: 'Inter_400Regular' }}>{d.keyword}</Text>
                    </View>
                    <Feather name="arrow-right" size={10} color={C.muted} style={{ marginRight: 10 }} />
                    <View style={{ backgroundColor: d.color + '20', borderRadius: 5, paddingHorizontal: 6, paddingVertical: 2 }}>
                      <Text style={{ color: d.color, fontSize: 9, fontFamily: 'Inter_700Bold' }}>{d.returns}</Text>
                    </View>
                  </View>
                ))}
              </View>

              <View style={{ height: 14 }} />

              {/* ArtifactMemory + ArtifactDatabase */}
              <View style={{ flexDirection: 'row', gap: 8 }}>
                {[
                  { cls: 'ArtifactMemory', pkg: 'studio.continuity', color: C.purple,
                    members: ['HashMap<String, Artifact>', 'remember(artifact)', 'recall(name) → Artifact'] },
                  { cls: 'ArtifactDatabase', pkg: 'studio.references', color: C.blue,
                    members: ['List<Artifact> artifacts', 'addArtifact(artifact)', 'getArtifacts() → List'] },
                ].map(c => (
                  <View key={c.cls} style={{ flex: 1, backgroundColor: C.card, borderRadius: 8, padding: 8, borderWidth: 1, borderColor: C.border }}>
                    <View style={{ backgroundColor: c.color + '20', borderRadius: 4, paddingHorizontal: 5, paddingVertical: 2, marginBottom: 6 }}>
                      <Text style={{ color: c.color, fontSize: 8, fontFamily: 'Inter_700Bold' }}>{c.cls}</Text>
                    </View>
                    <Text style={{ color: C.muted, fontSize: 7.5, fontFamily: 'Inter_400Regular', marginBottom: 5 }}>{c.pkg}</Text>
                    {c.members.map((m, mi) => (
                      <View key={mi} style={{ flexDirection: 'row', paddingVertical: 2 }}>
                        <Text style={{ color: c.color, fontSize: 8.5, fontFamily: 'Inter_700Bold', width: 8 }}>·</Text>
                        <Text style={{ color: C.ink, fontSize: 8.5, fontFamily: 'Inter_400Regular', flex: 1 }}>{m}</Text>
                      </View>
                    ))}
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* ── PIPELINE ── */}
          {tab === 'pipeline' && (
            <View>
              {/* ArtifactChatAssistant */}
              <BHeader title="ArtifactChatAssistant.buildQuestions(type)" color={C.purple} />
              <View style={{ backgroundColor: C.card, borderRadius: 8, padding: 12, borderWidth: 1, borderColor: C.border, marginBottom: 16 }}>
                <Text style={{ color: C.muted, fontSize: 9, fontFamily: 'Inter_400Regular', marginBottom: 8, fontStyle: 'italic' }}>
                  {'// "I detected a {type}.\\n\\nPlease describe:"'}
                </Text>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
                  {QUESTIONS.map((q, i) => (
                    <View key={q} style={{ flexDirection: 'row', alignItems: 'center', marginRight: 6, marginBottom: 4 }}>
                      <View style={{ backgroundColor: C.purple + '20', borderRadius: 3, width: 16, height: 16, alignItems: 'center', justifyContent: 'center', marginRight: 4 }}>
                        <Text style={{ color: C.purple, fontSize: 8, fontFamily: 'Inter_700Bold' }}>{i + 1}</Text>
                      </View>
                      <Text style={{ color: C.ink, fontSize: 9.5, fontFamily: 'Inter_400Regular' }}>{q}</Text>
                    </View>
                  ))}
                </View>
              </View>

              {/* ArtifactLoreGenerator */}
              <BHeader title="ArtifactLoreGenerator.generateLore(artifact)" color={C.green} />
              <View style={{ backgroundColor: '#0A0800', borderRadius: 8, padding: 10, borderWidth: 1, borderColor: C.border, marginBottom: 14 }}>
                <Text style={{ color: C.yellow, fontSize: 9.5, fontFamily: 'Inter_400Regular', lineHeight: 16 }}>
                  {'{name} was forged in an ancient realm.\nIts power source is tied to {visualDescription}.\nIt grants abilities connected to cosmic energy.'}
                </Text>
              </View>

              {/* ArtifactPromptBuilder */}
              <BHeader title="ArtifactPromptBuilder.buildPrompt(artifact)" color={C.cyan} />
              <Text style={{ color: C.muted, fontSize: 9, fontFamily: 'Inter_400Regular', marginBottom: 6, fontStyle: 'italic' }}>
                {'// Output fed to image generation AI'}
              </Text>
              <View style={{ backgroundColor: '#0A0800', borderRadius: 8, padding: 10, borderWidth: 1, borderColor: C.border, marginBottom: 14 }}>
                <Text style={{ color: C.cyan, fontSize: 9.5, fontFamily: 'Inter_400Regular', lineHeight: 16 }}>
                  {'Cinematic comic artifact,\n{type},\n{visualDescription},\nglowing {glowColor},\nhighly detailed,\ndramatic lighting,\ncomic book style'}
                </Text>
              </View>

              {/* StorySceneDirector */}
              <BHeader title="StorySceneDirector.directScene(text)" color={C.orange} />
              <View style={{ backgroundColor: C.card, borderRadius: 8, padding: 10, borderWidth: 1, borderColor: C.border, marginBottom: 14 }}>
                <PipelineStep n={1} label="Analyzing story scene..."    color={C.orange} />
                <PipelineStep n={2} label="Detecting artifacts..."       color={C.yellow} />
                <PipelineStep n={3} label="Building cinematic panel..."  color={C.cyan} />
              </View>

              {/* CreatureSummoner */}
              <BHeader title="CreatureSummoner.summon(creatureName)" color={C.red} />
              <View style={{ backgroundColor: C.card, borderRadius: 8, padding: 10, borderWidth: 1, borderColor: C.border, marginBottom: 14 }}>
                <PipelineStep n={1} label="Opening dimensional portal..."               color={C.purple} />
                <View style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 5 }}>
                  <View style={{ width: 22, height: 22, borderRadius: 11, backgroundColor: C.red + '30', borderWidth: 1, borderColor: C.red + '60', alignItems: 'center', justifyContent: 'center', marginRight: 10, flexShrink: 0 }}>
                    <Text style={{ color: C.red, fontSize: 9, fontFamily: 'Inter_700Bold' }}>2</Text>
                  </View>
                  <Text style={{ color: C.red, fontSize: 10.5, fontFamily: 'Inter_600SemiBold', fontStyle: 'italic', flex: 1 }}>"Summoning creature: <Text style={{ color: C.yellow }}>{'{creatureName}'}</Text>"</Text>
                </View>
              </View>

              {/* ReferenceAnalyzer */}
              <BHeader title="ReferenceAnalyzer.analyzeObject(description)" color={C.blue} />
              <View style={{ backgroundColor: C.card, borderRadius: 8, padding: 10, borderWidth: 1, borderColor: C.border }}>
                <PipelineStep n={1} label="Analyzing comic artifact..."    color={C.blue} />
                <PipelineStep n={2} label="Determining energy type..."     color={C.cyan} />
                <PipelineStep n={3} label="Building visual references..."  color={C.green} />
              </View>

              {/* AIChatWindow */}
              <View style={{ height: 14 }} />
              <BHeader title="AIChatWindow  (studio.ui)" color={C.muted} />
              <View style={{ backgroundColor: C.card, borderRadius: 8, padding: 10, borderWidth: 1, borderColor: C.border }}>
                <Text style={{ color: C.muted, fontSize: 9, fontFamily: 'Inter_400Regular', marginBottom: 6, fontStyle: 'italic' }}>
                  {'// VBox(10) — conversation + input TextAreas + "Send" Button'}
                </Text>
                {[
                  { widget: 'TextArea', label: 'conversation',  color: C.blue },
                  { widget: 'TextArea', label: 'input',         color: C.green },
                  { widget: 'Button',   label: '"Send"',        color: C.yellow },
                ].map((w, i) => (
                  <View key={i} style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 4, borderBottomWidth: i < 2 ? 1 : 0, borderBottomColor: C.border }}>
                    <View style={{ backgroundColor: w.color + '20', borderRadius: 4, paddingHorizontal: 5, paddingVertical: 2, marginRight: 8, minWidth: 64, alignItems: 'center' }}>
                      <Text style={{ color: w.color, fontSize: 8, fontFamily: 'Inter_700Bold' }}>{w.widget}</Text>
                    </View>
                    <Text style={{ color: C.ink, fontSize: 9.5, fontFamily: 'Inter_400Regular' }}>{w.label}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* ── AI DIR ── */}
          {tab === 'aidir' && (
            <View>
              {/* Example flow */}
              <BHeader title="Example flow — Nyx's amulet" color={C.yellow} />
              <View style={{ backgroundColor: C.card, borderRadius: 8, padding: 12, borderWidth: 1, borderColor: C.border, marginBottom: 16 }}>
                {[
                  { role: 'USER',   color: C.blue,   text: '"Nyx used his power amulet and summoned the creature."' },
                  { role: 'DETECT', color: C.yellow, text: 'ArtifactDetector → "amulet" → ArtifactType.AMULET' },
                  { role: 'CHAT',   color: C.purple, text: 'ArtifactChatAssistant → 9 descriptor questions' },
                  { role: 'USER',   color: C.blue,   text: '"It is black obsidian with glowing blue runes."' },
                  { role: 'AI',     color: C.green,  text: 'Generates: lore · memory · cinematic refs · summoning FX · continuity · panel prompts' },
                ].map((row, i) => (
                  <View key={i} style={{ paddingVertical: 6, borderBottomWidth: i < 4 ? 1 : 0, borderBottomColor: C.border }}>
                    <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 6 }}>
                      <View style={{ backgroundColor: row.color + '20', borderRadius: 4, paddingHorizontal: 5, paddingVertical: 2, minWidth: 48, alignItems: 'center', flexShrink: 0, marginTop: 1 }}>
                        <Text style={{ color: row.color, fontSize: 7.5, fontFamily: 'Inter_700Bold' }}>{row.role}</Text>
                      </View>
                      <Text style={{ color: row.role === 'USER' ? C.ink : row.color, fontSize: 9.5, fontFamily: 'Inter_400Regular', flex: 1 }}>{row.text}</Text>
                    </View>
                  </View>
                ))}
              </View>

              {/* Future expansions */}
              <BHeader title={`Future Expansions  (${FUTURE.length} systems)`} color={C.cyan} />
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginBottom: 16 }}>
                {FUTURE.map(f => <Chip key={f.label} label={f.label} color={f.color} />)}
              </View>

              {/* Project structure */}
              <BHeader title="ComicProject/ — folder structure" color={C.purple} />
              <View style={{ backgroundColor: '#0A0800', borderRadius: 8, padding: 12, borderWidth: 1, borderColor: C.border }}>
                <Text style={{ color: C.yellow, fontSize: 9.5, fontFamily: 'Inter_400Regular', marginBottom: 4 }}>ComicProject/</Text>
                {FOLDERS.map((f, i) => (
                  <View key={i} style={{ flexDirection: 'row', paddingVertical: 2 }}>
                    <Text style={{ color: C.muted, width: 14 }} />
                    <Text style={{ color: C.orange, fontSize: 9.5, fontFamily: 'Inter_400Regular' }}>├── {f}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          <Text style={{ color: C.border, fontSize: 9, fontFamily: 'Inter_400Regular', marginTop: 16, textAlign: 'center', letterSpacing: 0.5 }}>
            AI REFERENCE ONLY · NOT IMPLEMENTED · AI Artifact + Power Object Reference System
          </Text>
        </View>
      )}
    </View>
  );
}
