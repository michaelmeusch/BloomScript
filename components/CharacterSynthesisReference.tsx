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
const ENUMS: { name: string; color: string; values: string[] }[] = [
  {
    name: 'ComicStyle',
    color: C.yellow,
    values: [
      'KIRBY_COSMIC', 'BRONZE_AGE', 'DARK_HORSE_GRIT', 'NOIR',
      'MANGA_DYNAMIC', 'CINEMATIC_REALISM', 'SWORD_AND_SORCERY', 'SPACE_OPERA',
    ],
  },
  {
    name: 'AttitudeType',
    color: C.orange,
    values: [
      'CONFIDENT', 'AGGRESSIVE', 'CALM', 'MYSTERIOUS', 'INTIMIDATING',
      'HEROIC', 'VILLAINOUS', 'NERVOUS', 'ARROGANT', 'WISE',
    ],
  },
  {
    name: 'PowerType',
    color: C.cyan,
    values: [
      'ENERGY_BLAST', 'COSMIC_FORCE', 'TELEPATHY', 'TELEKINESIS',
      'FIRE', 'ICE', 'LIGHTNING', 'SONIC', 'SHADOW', 'MAGIC',
      'TECHNOLOGY', 'SUPER_STRENGTH', 'FLIGHT', 'SPEED', 'GRAVITY',
    ],
  },
  {
    name: 'BodyType',
    color: C.blue,
    values: [
      'SLIM', 'ATHLETIC', 'HEROIC', 'MASSIVE', 'BRUTE',
      'CURVY', 'MUSCULAR', 'ELEGANT', 'HEAVYSET', 'COSMIC',
    ],
  },
  {
    name: 'AITargetSystem',
    color: C.purple,
    values: ['COMIC_ART_STUDIO_AI_GENERATOR', 'COVER_CREATOR_AI_GENERATOR', 'BOTH'],
  },
];

// ── CharacterDNA sub-classes ──────────────────────────────────────────────────
const SUB_CLASSES: { name: string; color: string; fields: { name: string; type: string }[] }[] = [
  {
    name: 'FacialFeatures',
    color: C.orange,
    fields: [
      { name: 'jawShape',            type: 'String' },
      { name: 'eyeShape',            type: 'String' },
      { name: 'browType',            type: 'String' },
      { name: 'noseType',            type: 'String' },
      { name: 'mouthType',           type: 'String' },
      { name: 'cheekStructure',      type: 'String' },
      { name: 'expressionType',      type: 'String' },
      { name: 'cinematicLighting',   type: 'boolean' },
    ],
  },
  {
    name: 'HairProfile',
    color: C.purple,
    fields: [
      { name: 'hairStyle',         type: 'String' },
      { name: 'silhouetteShape',   type: 'String' },
      { name: 'motionBehavior',    type: 'String' },
      { name: 'strandComplexity',  type: 'String' },
      { name: 'dynamicMovement',   type: 'boolean' },
    ],
  },
  {
    name: 'BodyProfile',
    color: C.blue,
    fields: [
      { name: 'bodyType',           type: 'BodyType' },
      { name: 'shoulderWidth',      type: 'float' },
      { name: 'chestScale',         type: 'float' },
      { name: 'waistScale',         type: 'float' },
      { name: 'hipScale',           type: 'float' },
      { name: 'armMass',            type: 'float' },
      { name: 'legMass',            type: 'float' },
      { name: 'bodyFat',            type: 'float' },
      { name: 'silhouetteLanguage', type: 'String' },
      { name: 'motionStyle',        type: 'String' },
      { name: 'anatomyLocked',      type: 'boolean' },
    ],
  },
  {
    name: 'PoseProfile',
    color: C.cyan,
    fields: [
      { name: 'poseName',               type: 'String' },
      { name: 'bodyLanguage',           type: 'String' },
      { name: 'centerOfGravity',        type: 'String' },
      { name: 'gestureType',            type: 'String' },
      { name: 'motionDirection',        type: 'String' },
      { name: 'cameraAngle',            type: 'String' },
      { name: 'cinematic',              type: 'boolean' },
      { name: 'dynamicForeshortening',  type: 'boolean' },
    ],
  },
  {
    name: 'PowerProfile',
    color: C.red,
    fields: [
      { name: 'powerType',          type: 'PowerType' },
      { name: 'energyColor',        type: 'String' },
      { name: 'blastBehavior',      type: 'String' },
      { name: 'atmosphericEffect',  type: 'String' },
      { name: 'lightingProfile',    type: 'String' },
      { name: 'impactStyle',        type: 'String' },
      { name: 'debrisGeneration',   type: 'boolean' },
      { name: 'cinematicFX',        type: 'boolean' },
    ],
  },
];

// ── CharacterDNA top-level fields ─────────────────────────────────────────────
const DNA_TOP: { name: string; type: string; color: string }[] = [
  { name: 'characterName',    type: 'String',           color: C.yellow },
  { name: 'styleReference',   type: 'ComicStyle',       color: C.yellow },
  { name: 'attitude',         type: 'AttitudeType',     color: C.yellow },
  { name: 'targetSystem',     type: 'AITargetSystem',   color: C.yellow },
  { name: 'face',             type: 'FacialFeatures',   color: C.orange },
  { name: 'hair',             type: 'HairProfile',      color: C.purple },
  { name: 'body',             type: 'BodyProfile',      color: C.blue },
  { name: 'pose',             type: 'PoseProfile',      color: C.cyan },
  { name: 'powers',           type: 'PowerProfile',     color: C.red },
];
const DNA_DETAILS: { name: string; type: string }[] = [
  { name: 'costumeDesign',     type: 'String' },
  { name: 'lightingStyle',     type: 'String' },
  { name: 'shadowStyle',       type: 'String' },
  { name: 'voiceTone',         type: 'String' },
  { name: 'emotionalBehavior', type: 'String' },
];
const DNA_FLAGS = [
  'continuityLock', 'cinematicPanels', 'sequentialFlow',
  'coverFriendly', 'expressionTracking', 'anatomyTracking', 'costumeTracking',
];

// ── Analyzers ─────────────────────────────────────────────────────────────────
const ANALYZERS: { name: string; method: string; param: string; color: string; outputs: string[] }[] = [
  {
    name: 'PoseImageAnalyzer', method: 'analyzePoseImage', param: 'String uploadedImage',
    color: C.cyan,
    outputs: [
      'poseName → "Heroic Combat Pose"',
      'bodyLanguage → "Confident forward stance"',
      'centerOfGravity → "Balanced aggressive"',
      'gestureType → "Combat ready"',
      'motionDirection → "Left to right"',
      'cameraAngle → "Low Angle"',
      'cinematic → true',
      'dynamicForeshortening → true',
    ],
  },
  {
    name: 'FacialAnalyzer', method: 'analyzeFace', param: 'String uploadedFace',
    color: C.orange,
    outputs: [
      'jawShape → "Strong angular jaw"',
      'eyeShape → "Sharp heroic eyes"',
      'browType → "Aggressive brows"',
      'noseType → "Straight nose"',
      'mouthType → "Neutral heroic mouth"',
      'cheekStructure → "Defined cheekbones"',
      'expressionType → "Determined"',
      'cinematicLighting → true',
    ],
  },
  {
    name: 'BodyAnalyzer', method: 'analyzeBody', param: 'String uploadedBody',
    color: C.blue,
    outputs: [
      'bodyType → HEROIC',
      'shoulderWidth → 1.7f',
      'chestScale → 1.8f',
      'waistScale → 0.8f',
      'hipScale → 0.9f',
      'armMass → 1.6f',
      'legMass → 1.5f',
      'bodyFat → 0.2f',
      'silhouetteLanguage → "Triangle hero silhouette"',
      'motionStyle → "Explosive comic motion"',
      'anatomyLocked → true',
    ],
  },
  {
    name: 'HairAnalyzer', method: 'analyzeHair', param: 'String uploadedHair',
    color: C.purple,
    outputs: [
      'hairStyle → "Dynamic layered hair"',
      'silhouetteShape → "Sharp anime silhouette"',
      'motionBehavior → "Wind reactive"',
      'strandComplexity → "High detail"',
      'dynamicMovement → true',
    ],
  },
  {
    name: 'PowerAnalyzer', method: 'analyzePowers', param: 'String userPrompt',
    color: C.red,
    outputs: [
      'if prompt contains "purple":',
      '  powerType → ENERGY_BLAST',
      '  energyColor → "Purple cosmic plasma"',
      '  blastBehavior → "Chaotic spiral blast"',
      '  atmosphericEffect → "Purple haze distortion"',
      '  lightingProfile → "Violet rim lighting"',
      '  impactStyle → "Chest impact burst"',
      'debrisGeneration → true  (always)',
      'cinematicFX → true  (always)',
    ],
  },
];

// ── buildCharacter() pipeline steps ──────────────────────────────────────────
const BUILD_STEPS: { step: number; field: string; call: string; color: string }[] = [
  { step: 1, field: 'dna.pose',   call: 'poseAnalyzer.analyzePoseImage(poseImage)',    color: C.cyan },
  { step: 2, field: 'dna.face',   call: 'facialAnalyzer.analyzeFace(faceImage)',       color: C.orange },
  { step: 3, field: 'dna.body',   call: 'bodyAnalyzer.analyzeBody(bodyImage)',         color: C.blue },
  { step: 4, field: 'dna.hair',   call: 'hairAnalyzer.analyzeHair(hairImage)',         color: C.purple },
  { step: 5, field: 'dna.powers', call: 'powerAnalyzer.analyzePowers(powerDescription)', color: C.red },
];

// ── Helpers ───────────────────────────────────────────────────────────────────
function CHeader({ title, color }: { title: string; color: string }) {
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

function CodeBlock({ children }: { children: string }) {
  return (
    <View style={{ backgroundColor: '#0A0800', borderRadius: 8, padding: 10, borderWidth: 1, borderColor: C.border }}>
      <Text style={{ color: C.yellow, fontSize: 9.5, fontFamily: 'Inter_400Regular', lineHeight: 15 }}>{children}</Text>
    </View>
  );
}

// ── Main Export ───────────────────────────────────────────────────────────────
export function CharacterSynthesisReference() {
  const [expanded, setExpanded] = React.useState(false);
  type Tab = 'enums' | 'dna' | 'analyzers' | 'main';
  const [tab, setTab] = React.useState<Tab>('enums');

  const TABS: { id: Tab; label: string; color: string }[] = [
    { id: 'enums',     label: 'ENUMS',     color: C.yellow },
    { id: 'dna',       label: 'DNA',       color: C.orange },
    { id: 'analyzers', label: 'ANALYZERS', color: C.cyan },
    { id: 'main',      label: 'AI DIR',    color: C.green },
  ];

  return (
    <View style={{ marginTop: 16, borderTopWidth: 1, borderTopColor: C.border, paddingTop: 16 }}>

      <TouchableOpacity
        onPress={() => { Haptics.selectionAsync(); setExpanded(v => !v); }}
        activeOpacity={0.8}
        style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: C.card, borderWidth: 1, borderColor: C.border, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, marginBottom: 4 }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <View style={{ backgroundColor: C.green + '22', borderRadius: 6, padding: 5 }}>
            <Feather name="user" size={13} color={C.green} />
          </View>
          <View>
            <Text style={{ color: C.ink, fontSize: 12, fontFamily: 'Inter_700Bold', letterSpacing: 0.5 }}>
              CharacterSynthesisSystem
            </Text>
            <Text style={{ color: C.muted, fontSize: 9.5, fontFamily: 'Inter_400Regular', marginTop: 1 }}>
              5 enums · CharacterDNA · 5 analyzers · Synthesis engine
            </Text>
          </View>
        </View>
        <Feather name={expanded ? 'chevron-up' : 'chevron-down'} size={14} color={C.muted} />
      </TouchableOpacity>

      {expanded && (
        <View style={{ backgroundColor: C.bg, borderWidth: 1, borderColor: C.border, borderRadius: 12, padding: 14 }}>

          <Text style={{ color: C.muted, fontSize: 9.5, fontFamily: 'Inter_400Regular', marginBottom: 2, fontStyle: 'italic' }}>
            {'// CharacterSynthesisSystem — AI Reference Only'}
          </Text>
          <Text style={{ color: C.muted, fontSize: 9.5, fontFamily: 'Inter_400Regular', marginBottom: 12, fontStyle: 'italic' }}>
            {'// pose upload · facial extraction · body archetype · hair · powers · continuity'}
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

          {/* ── ENUMS tab ── */}
          {tab === 'enums' && (
            <View>
              {ENUMS.map((e, ei) => (
                <View key={e.name} style={{ marginBottom: ei < ENUMS.length - 1 ? 16 : 0 }}>
                  <CHeader title={`enum ${e.name}  (${e.values.length})`} color={e.color} />
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
                    {e.values.map(v => <Chip key={v} label={v} color={e.color} />)}
                  </View>
                </View>
              ))}
            </View>
          )}

          {/* ── DNA tab ── */}
          {tab === 'dna' && (
            <View>
              {/* CharacterDNA top-level */}
              <CHeader title="class CharacterDNA  — master container" color={C.yellow} />
              <Text style={{ color: C.yellow, fontSize: 10, fontFamily: 'Inter_700Bold', marginBottom: 8 }}>
                {'static class CharacterDNA {'}
              </Text>
              {DNA_TOP.map((f, i) => (
                <View key={f.name} style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 3, borderBottomWidth: i < DNA_TOP.length - 1 ? 1 : 0, borderBottomColor: C.border }}>
                  <View style={{ backgroundColor: f.color + '1A', borderRadius: 4, paddingHorizontal: 5, paddingVertical: 2, marginRight: 8, minWidth: 90, alignItems: 'center' }}>
                    <Text style={{ color: f.color, fontSize: 8, fontFamily: 'Inter_700Bold' }}>{f.type}</Text>
                  </View>
                  <Text style={{ color: C.ink, fontSize: 10, fontFamily: 'Inter_400Regular' }}>{f.name}</Text>
                </View>
              ))}

              {/* Character details */}
              <View style={{ height: 14 }} />
              <CHeader title="Character Details" color={C.blue} />
              {DNA_DETAILS.map((f, i) => (
                <View key={f.name} style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 3, borderBottomWidth: i < DNA_DETAILS.length - 1 ? 1 : 0, borderBottomColor: C.border }}>
                  <View style={{ backgroundColor: C.blue + '1A', borderRadius: 4, paddingHorizontal: 5, paddingVertical: 2, marginRight: 8, minWidth: 48, alignItems: 'center' }}>
                    <Text style={{ color: C.blue, fontSize: 8, fontFamily: 'Inter_700Bold' }}>{f.type}</Text>
                  </View>
                  <Text style={{ color: C.ink, fontSize: 10, fontFamily: 'Inter_400Regular' }}>{f.name}</Text>
                </View>
              ))}

              {/* AI Flags */}
              <View style={{ height: 14 }} />
              <CHeader title={`AI Flags  (${DNA_FLAGS.length} · all boolean)`} color={C.green} />
              <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
                {DNA_FLAGS.map(f => <Chip key={f} label={f} color={C.green} />)}
              </View>

              {/* Sub-classes */}
              <View style={{ height: 14 }} />
              <CHeader title="Sub-class field counts" color={C.muted} />
              {SUB_CLASSES.map(sc => (
                <View key={sc.name} style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 4, borderBottomWidth: 1, borderBottomColor: C.border }}>
                  <View style={{ backgroundColor: sc.color + '1A', borderRadius: 4, paddingHorizontal: 5, paddingVertical: 2, marginRight: 8, minWidth: 100 }}>
                    <Text style={{ color: sc.color, fontSize: 8.5, fontFamily: 'Inter_700Bold' }}>{sc.name}</Text>
                  </View>
                  <Text style={{ color: C.muted, fontSize: 9.5, fontFamily: 'Inter_400Regular' }}>{sc.fields.length} fields</Text>
                </View>
              ))}
            </View>
          )}

          {/* ── ANALYZERS tab ── */}
          {tab === 'analyzers' && (
            <View>
              {/* buildCharacter pipeline */}
              <CHeader title="CharacterSynthesisEngine.buildCharacter()" color={C.yellow} />
              <Text style={{ color: C.muted, fontSize: 9, fontFamily: 'Inter_400Regular', marginBottom: 10, fontStyle: 'italic' }}>
                {'// 6 inputs → CharacterDNA'}
              </Text>
              {BUILD_STEPS.map((s, i) => (
                <View key={s.step} style={{ flexDirection: 'row', alignItems: 'flex-start', paddingVertical: 6, borderBottomWidth: i < BUILD_STEPS.length - 1 ? 1 : 0, borderBottomColor: C.border }}>
                  <View style={{ width: 22, height: 22, borderRadius: 11, backgroundColor: s.color + '30', borderWidth: 1, borderColor: s.color + '60', alignItems: 'center', justifyContent: 'center', marginRight: 10, flexShrink: 0 }}>
                    <Text style={{ color: s.color, fontSize: 9, fontFamily: 'Inter_700Bold' }}>{s.step}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: s.color, fontSize: 9, fontFamily: 'Inter_700Bold', marginBottom: 2 }}>{s.field}</Text>
                    <Text style={{ color: C.muted, fontSize: 9, fontFamily: 'Inter_400Regular', fontStyle: 'italic' }}>{s.call}</Text>
                  </View>
                </View>
              ))}

              <View style={{ height: 16 }} />

              {/* Each analyzer */}
              {ANALYZERS.map((a, ai) => (
                <View key={a.name} style={{ marginBottom: ai < ANALYZERS.length - 1 ? 16 : 0 }}>
                  <CHeader title={`${a.name}.${a.method}()`} color={a.color} />
                  <Text style={{ color: C.muted, fontSize: 9, fontFamily: 'Inter_400Regular', marginBottom: 8, fontStyle: 'italic' }}>
                    {`// param: ${a.param}`}
                  </Text>
                  {a.outputs.map((o, oi) => (
                    <View key={oi} style={{ flexDirection: 'row', paddingVertical: 2 }}>
                      <Text style={{ color: C.muted, fontSize: 9, fontFamily: 'Inter_400Regular', width: 8 }}>·</Text>
                      <Text style={{ color: o.startsWith('if') || o.startsWith('  ') ? C.muted : C.ink, fontSize: 9, fontFamily: 'Inter_400Regular', flex: 1 }}>{o}</Text>
                    </View>
                  ))}
                </View>
              ))}
            </View>
          )}

          {/* ── AI DIR tab ── */}
          {tab === 'main' && (
            <View>
              <CHeader title="main() — full synthesis test" color={C.green} />

              {/* buildCharacter call */}
              <CodeBlock>
                {'CharacterSynthesisEngine engine =\n    new CharacterSynthesisEngine();\n\nCharacterDNA character = engine.buildCharacter(\n    "Jon",                              // characterName\n    "uploaded_pose.png",                // poseImage\n    "uploaded_face.png",                // faceImage\n    "uploaded_body.png",                // bodyImage\n    "uploaded_hair.png",                // hairImage\n    "Alien purple energy blast powers"  // powerDescription\n);'}
              </CodeBlock>

              <View style={{ height: 14 }} />

              {/* CharacterDNA.toString() output */}
              <CHeader title="CharacterDNA.toString() result" color={C.yellow} />
              <View style={{ backgroundColor: '#0A0800', borderRadius: 8, padding: 10, borderWidth: 1, borderColor: C.border, marginBottom: 14 }}>
                <Text style={{ color: C.yellow, fontSize: 9.5, fontFamily: 'Inter_400Regular', lineHeight: 15 }}>
                  {'======================================\nCHARACTER DNA PROFILE\n======================================\nNAME:     Jon\nSTYLE:    KIRBY_COSMIC\nATTITUDE: HEROIC\n\nFACE STRUCTURE\n  Jaw: Strong angular jaw\n  Eyes: Sharp heroic eyes\n  Expression: Determined\n\nHAIR PROFILE\n  Style: Dynamic layered hair\n  Motion: Wind reactive\n\nBODY PROFILE\n  Type: HEROIC\n  Silhouette: Triangle hero silhouette\n\nPOSE PROFILE\n  Pose: Heroic Combat Pose\n  Body Language: Confident forward stance\n\nPOWER PROFILE\n  Power: ENERGY_BLAST\n  Energy: Purple cosmic plasma\n======================================'}
                </Text>
              </View>

              {/* ComicArtStudioAI */}
              <CHeader title="ComicArtStudioAI.generateComicPanel(dna)" color={C.orange} />
              <View style={{ backgroundColor: '#0A0800', borderRadius: 8, padding: 10, borderWidth: 1, borderColor: C.border, marginBottom: 14 }}>
                <Text style={{ color: C.yellow, fontSize: 9.5, fontFamily: 'Inter_400Regular', lineHeight: 15 }}>
                  {'====================================\nCOMIC ART STUDIO AI GENERATOR\n====================================\nGenerating cinematic comic panel...\nUsing continuity lock...\nApplying pose transfer...\nApplying energy FX...\n[CharacterDNA printed above]'}
                </Text>
              </View>

              {/* CoverCreatorAI */}
              <CHeader title="CoverCreatorAI.generateCover(dna)" color={C.cyan} />
              <View style={{ backgroundColor: '#0A0800', borderRadius: 8, padding: 10, borderWidth: 1, borderColor: C.border, marginBottom: 14 }}>
                <Text style={{ color: C.yellow, fontSize: 9.5, fontFamily: 'Inter_400Regular', lineHeight: 15 }}>
                  {'====================================\nCOVER CREATOR AI GENERATOR\n====================================\nGenerating cinematic cover...\nApplying foreground depth...\nApplying cosmic lighting...\nApplying cover composition...\n[CharacterDNA printed above]'}
                </Text>
              </View>

              {/* AI flags set by buildCharacter */}
              <CHeader title="CharacterDNA AI flags set by buildCharacter()" color={C.green} />
              <View style={{ backgroundColor: C.card, borderRadius: 8, padding: 10, borderWidth: 1, borderColor: C.border }}>
                {DNA_FLAGS.map(f => (
                  <View key={f} style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 3 }}>
                    <Feather name="check-circle" size={10} color={C.green} style={{ marginRight: 8 }} />
                    <Text style={{ color: C.ink, fontSize: 9.5, fontFamily: 'Inter_400Regular' }}>{f}</Text>
                    <Text style={{ color: C.green, fontSize: 9, fontFamily: 'Inter_700Bold', marginLeft: 6 }}>true</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          <Text style={{ color: C.border, fontSize: 9, fontFamily: 'Inter_400Regular', marginTop: 16, textAlign: 'center', letterSpacing: 0.5 }}>
            AI REFERENCE ONLY · NOT IMPLEMENTED · CharacterSynthesisSystem
          </Text>
        </View>
      )}
    </View>
  );
}
