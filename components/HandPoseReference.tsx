import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';

// ── Palette (fixed dark comic) ────────────────────────────────────────────────
const C = {
  bg: '#0E0C0A', card: '#181410', border: '#2E2618',
  yellow: '#FFD600', red: '#E8001C', blue: '#0057A8',
  green: '#2A7A3A', purple: '#8B3FBE', orange: '#FF6A00',
  ink: '#F0EAD8', muted: '#7A6A58',
};

// ── Data ──────────────────────────────────────────────────────────────────────

const HAND_ENUMS: { name: string; color: string; values: string[] }[] = [
  { name: 'HandCategory', color: C.blue, values: [
    'NEUTRAL','FIST','OPEN_PALM','POINTING','GRABBING','WEAPON_GRIP',
    'MAGIC_CASTING','EMOTIONAL','COMBAT','DIALOGUE','RELAXED','DEFENSIVE',
    'TECH_INTERACTION','CREATURE','MECH','OBJECT_HOLDING','PERSPECTIVE','SEQUENTIAL_MOTION',
  ]},
  { name: 'EmotionalIntent', color: C.purple, values: [
    'CONFIDENCE','RAGE','FEAR','TENSION','CALM','HOPE',
    'SADNESS','INTIMIDATION','EXHAUSTION','DETERMINATION','PANIC','CONTROL','CHAOS',
  ]},
  { name: 'HandSilhouette', color: C.green, values: [
    'OPEN','CLOSED','SHARP','RELAXED','CLAW','SPREAD','DYNAMIC','AGGRESSIVE','DEFENSIVE',
  ]},
];

const HAND_FIELDS: { type: string; name: string; desc: string }[] = [
  { type: 'String',         name: 'id',                  desc: 'Unique identifier e.g. heroic_fist' },
  { type: 'String',         name: 'name',                desc: 'Display name of the hand pose' },
  { type: 'HandCategory',   name: 'category',            desc: 'Pose category (18 types)' },
  { type: 'EmotionalIntent',name: 'emotionalIntent',     desc: 'Emotional tone of the pose (13 types)' },
  { type: 'HandSilhouette', name: 'silhouette',          desc: 'Silhouette shape (9 types)' },
  { type: 'String',         name: 'actingPurpose',       desc: 'Narrative purpose of the hand' },
  { type: 'String',         name: 'fingerStructure',     desc: 'Description of finger configuration' },
  { type: 'String',         name: 'wristAngle',          desc: 'Wrist angle or position descriptor' },
  { type: 'String',         name: 'thumbPosition',       desc: 'Thumb placement detail' },
  { type: 'boolean',        name: 'leftHandCompatible',  desc: 'Mirror-safe for left hand' },
  { type: 'boolean',        name: 'rightHandCompatible', desc: 'Works as right hand pose' },
  { type: 'boolean',        name: 'combatReady',         desc: 'Suitable for action / combat panels' },
  { type: 'boolean',        name: 'dialogueFriendly',    desc: 'Works with speech bubble panels' },
  { type: 'boolean',        name: 'objectInteraction',   desc: 'Designed to hold / interact with prop' },
  { type: 'boolean',        name: 'cinematicPose',       desc: 'Designed for cinematic composition' },
  { type: 'boolean',        name: 'foreshortened',       desc: 'Perspective-distorted for depth' },
  { type: 'float',          name: 'tensionLevel',        desc: '0.0 relaxed → 1.0 max tension' },
  { type: 'float',          name: 'fingerSpread',        desc: '0.0 closed fist → 1.0 full spread' },
  { type: 'List<String>',   name: 'keywords',            desc: 'AI prompt tags: grip, claw, power...' },
  { type: 'List<String>',   name: 'compatibleObjects',   desc: 'Props this hand can realistically hold' },
  { type: 'String',         name: 'previewImage',        desc: 'Path to hand reference image' },
  { type: 'String',         name: 'skeletalReference',   desc: 'Path to skeletal / wireframe ref' },
];

const SAMPLE_HAND_POSES: { id: string; name: string; cat: string; emotion: string; sil: string; purpose: string; fingers: string; wrist: string }[] = [
  { id: 'neutral_relaxed',      name: 'Neutral Relaxed',       cat: 'NEUTRAL',          emotion: 'CALM',          sil: 'RELAXED',    purpose: 'Natural idle state',           fingers: 'Loose fingers',             wrist: 'Neutral wrist' },
  { id: 'heroic_fist',          name: 'Heroic Fist',           cat: 'FIST',             emotion: 'DETERMINATION', sil: 'CLOSED',     purpose: 'Power and readiness',          fingers: 'Tight curled fingers',      wrist: 'Straight wrist' },
  { id: 'rage_fist',            name: 'Rage Fist',             cat: 'FIST',             emotion: 'RAGE',          sil: 'AGGRESSIVE', purpose: 'Explosive anger',              fingers: 'Extreme tension',           wrist: 'Forward wrist angle' },
  { id: 'peaceful_open_palm',   name: 'Peaceful Open Palm',    cat: 'OPEN_PALM',        emotion: 'HOPE',          sil: 'OPEN',       purpose: 'Trust and openness',           fingers: 'Soft finger curve',         wrist: 'Relaxed wrist' },
  { id: 'energy_projection',    name: 'Energy Projection',     cat: 'OPEN_PALM',        emotion: 'CONTROL',       sil: 'SPREAD',     purpose: 'Power release',                fingers: 'Spread fingers',            wrist: 'Forward wrist' },
  { id: 'accusation_point',     name: 'Accusation Point',      cat: 'POINTING',         emotion: 'INTIMIDATION',  sil: 'SHARP',      purpose: 'Aggressive accusation',        fingers: 'Extended index finger',     wrist: 'Sharp wrist angle' },
  { id: 'leadership_point',     name: 'Leadership Point',      cat: 'POINTING',         emotion: 'CONFIDENCE',    sil: 'OPEN',       purpose: 'Giving direction',             fingers: 'Firm index extension',      wrist: 'Stable wrist' },
  { id: 'combat_grab',          name: 'Combat Grab',           cat: 'GRABBING',         emotion: 'RAGE',          sil: 'CLAW',       purpose: 'Aggressive grab',              fingers: 'Hooked fingers',            wrist: 'Bent wrist' },
  { id: 'sword_grip',           name: 'Sword Grip',            cat: 'WEAPON_GRIP',      emotion: 'DETERMINATION', sil: 'CLOSED',     purpose: 'Weapon control',               fingers: 'Tight grip',                wrist: 'Locked wrist' },
  { id: 'gun_aim',              name: 'Gun Aim',               cat: 'WEAPON_GRIP',      emotion: 'CONTROL',       sil: 'SHARP',      purpose: 'Precision targeting',          fingers: 'Trigger discipline',        wrist: 'Forward alignment' },
  { id: 'spell_casting',        name: 'Spell Casting',         cat: 'MAGIC_CASTING',    emotion: 'CHAOS',         sil: 'SPREAD',     purpose: 'Mystical energy flow',         fingers: 'Wide finger spread',        wrist: 'Curved wrist' },
  { id: 'shaking_hands',        name: 'Shaking Hands',         cat: 'EMOTIONAL',        emotion: 'FEAR',          sil: 'RELAXED',    purpose: 'Anxiety and fear',             fingers: 'Loose trembling fingers',   wrist: 'Unstable wrist' },
  { id: 'grief_hand',           name: 'Grief Hand',            cat: 'EMOTIONAL',        emotion: 'SADNESS',       sil: 'CLOSED',     purpose: 'Emotional pain',               fingers: 'Weak finger curl',          wrist: 'Collapsed wrist' },
  { id: 'combat_guard',         name: 'Combat Guard',          cat: 'COMBAT',           emotion: 'DETERMINATION', sil: 'DEFENSIVE',  purpose: 'Defensive combat stance',      fingers: 'Half-curled fingers',       wrist: 'Raised wrist' },
  { id: 'explaining_hand',      name: 'Explaining Hand',       cat: 'DIALOGUE',         emotion: 'CONFIDENCE',    sil: 'OPEN',       purpose: 'Conversation gesture',         fingers: 'Open relaxed fingers',      wrist: 'Natural wrist' },
  { id: 'pocket_hand',          name: 'Pocket Hand',           cat: 'RELAXED',          emotion: 'CALM',          sil: 'RELAXED',    purpose: 'Casual attitude',              fingers: 'Hidden partial hand',       wrist: 'Relaxed position' },
  { id: 'blocking_hand',        name: 'Blocking Hand',         cat: 'DEFENSIVE',        emotion: 'FEAR',          sil: 'DEFENSIVE',  purpose: 'Protective motion',            fingers: 'Wide spread fingers',       wrist: 'Raised wrist' },
  { id: 'hologram_control',     name: 'Hologram Control',      cat: 'TECH_INTERACTION', emotion: 'CONTROL',       sil: 'DYNAMIC',    purpose: 'Advanced tech interaction',    fingers: 'Precision finger movement', wrist: 'Forward wrist' },
  { id: 'monster_claw',         name: 'Monster Claw',          cat: 'CREATURE',         emotion: 'RAGE',          sil: 'CLAW',       purpose: 'Predatory aggression',         fingers: 'Sharp hooked fingers',      wrist: 'Aggressive bend' },
  { id: 'robot_grip',           name: 'Robot Grip',            cat: 'MECH',             emotion: 'CONTROL',       sil: 'SHARP',      purpose: 'Mechanical precision',         fingers: 'Segmented fingers',         wrist: 'Locked mechanics' },
  { id: 'holding_artifact',     name: 'Holding Artifact',      cat: 'OBJECT_HOLDING',   emotion: 'HOPE',          sil: 'OPEN',       purpose: 'Careful object handling',      fingers: 'Delicate finger placement', wrist: 'Gentle wrist' },
  { id: 'camera_reach',         name: 'Reach Toward Camera',   cat: 'PERSPECTIVE',      emotion: 'TENSION',       sil: 'DYNAMIC',    purpose: 'Foreshortened perspective',    fingers: 'Extended fingers',          wrist: 'Forward stretch' },
  { id: 'punch_transition',     name: 'Punch Transition',      cat: 'SEQUENTIAL_MOTION',emotion: 'RAGE',          sil: 'AGGRESSIVE', purpose: 'Mid-motion combat',            fingers: 'Changing fist compression', wrist: 'Momentum wrist angle' },
];

// ── Type color map ────────────────────────────────────────────────────────────
const TC: Record<string, string> = {
  'String': C.blue, 'float': C.yellow, 'boolean': C.green,
  'List<String>': C.purple, 'HandCategory': C.blue,
  'EmotionalIntent': C.purple, 'HandSilhouette': C.green,
};

// ── Sub-components ────────────────────────────────────────────────────────────
function HFieldRow({ f, last }: { f: { type: string; name: string; desc: string }; last: boolean }) {
  const tc = TC[f.type] ?? C.ink;
  return (
    <View style={{ flexDirection: 'row', alignItems: 'flex-start', paddingVertical: 5, borderBottomWidth: last ? 0 : 1, borderBottomColor: C.border }}>
      <View style={{ width: 155, flexDirection: 'row', alignItems: 'center', gap: 5, flexShrink: 0 }}>
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

function HSectionHeader({ title, count, color }: { title: string; count?: string; color: string }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8, gap: 7 }}>
      <View style={{ width: 3, height: 13, backgroundColor: color, borderRadius: 2 }} />
      <Text style={{ color, fontSize: 10, fontFamily: 'Inter_700Bold', letterSpacing: 0.8, flex: 1 }}>{title}</Text>
      {count ? <Text style={{ color: C.muted, fontSize: 9, fontFamily: 'Inter_400Regular' }}>{count}</Text> : null}
    </View>
  );
}

// ── Main Export ───────────────────────────────────────────────────────────────
export function HandPoseReference() {
  const [expanded, setExpanded] = React.useState(false);
  type Tab = 'enums' | 'fields' | 'poses' | 'ai';
  const [tab, setTab] = React.useState<Tab>('enums');

  const TABS: { id: Tab; label: string; color: string }[] = [
    { id: 'enums',  label: 'ENUMS',  color: C.blue },
    { id: 'fields', label: 'FIELDS', color: C.yellow },
    { id: 'poses',  label: 'POSES',  color: C.red },
    { id: 'ai',     label: 'AI DIR', color: C.purple },
  ];

  return (
    <View style={{ marginTop: 24, borderTopWidth: 1, borderTopColor: C.border, paddingTop: 16 }}>

      <TouchableOpacity
        onPress={() => { Haptics.selectionAsync(); setExpanded(v => !v); }}
        activeOpacity={0.8}
        style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: C.card, borderWidth: 1, borderColor: C.border, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, marginBottom: 4 }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <View style={{ backgroundColor: C.purple + '22', borderRadius: 6, padding: 5 }}>
            <Feather name="code" size={13} color={C.purple} />
          </View>
          <View>
            <Text style={{ color: C.ink, fontSize: 12, fontFamily: 'Inter_700Bold', letterSpacing: 0.5 }}>
              HandPoseReferenceSystem
            </Text>
            <Text style={{ color: C.muted, fontSize: 9.5, fontFamily: 'Inter_400Regular', marginTop: 1 }}>
              com.bloomscript.comicstudio.hands · {SAMPLE_HAND_POSES.length} poses · 3 enums · AI reference only
            </Text>
          </View>
        </View>
        <Feather name={expanded ? 'chevron-up' : 'chevron-down'} size={14} color={C.muted} />
      </TouchableOpacity>

      {expanded && (
        <View style={{ backgroundColor: C.bg, borderWidth: 1, borderColor: C.border, borderRadius: 12, padding: 14 }}>

          <Text style={{ color: C.muted, fontSize: 9.5, fontFamily: 'Inter_400Regular', marginBottom: 2, fontStyle: 'italic' }}>
            {'package com.bloomscript.comicstudio.hands;'}
          </Text>
          <Text style={{ color: C.muted, fontSize: 9.5, fontFamily: 'Inter_400Regular', marginBottom: 12, fontStyle: 'italic' }}>
            {'// Classic Comics Hand Pose Reference System · Comic Art Studio / BloomScript'}
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

          {/* ENUMS */}
          {tab === 'enums' && (
            <View>
              {HAND_ENUMS.map(en => (
                <View key={en.name} style={{ marginBottom: 14 }}>
                  <HSectionHeader title={`enum ${en.name}`} count={`${en.values.length} values`} color={en.color} />
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

          {/* FIELDS */}
          {tab === 'fields' && (
            <View>
              <HSectionHeader title="class HandPose" count={`${HAND_FIELDS.length} fields`} color={C.yellow} />
              <Text style={{ color: C.yellow, fontSize: 10, fontFamily: 'Inter_700Bold', marginBottom: 8 }}>{'public static class HandPose {'}</Text>
              {HAND_FIELDS.map((f, i) => <HFieldRow key={f.name} f={f} last={i === HAND_FIELDS.length - 1} />)}
              <Text style={{ color: C.yellow, fontSize: 10, fontFamily: 'Inter_700Bold', marginTop: 8 }}>{'}'}</Text>
            </View>
          )}

          {/* POSES */}
          {tab === 'poses' && (
            <View>
              <HSectionHeader title="HandDatabase.initialize()" count={`${SAMPLE_HAND_POSES.length} poses`} color={C.red} />
              {SAMPLE_HAND_POSES.map((p, i) => (
                <View key={p.id} style={{ paddingVertical: 7, borderBottomWidth: i < SAMPLE_HAND_POSES.length - 1 ? 1 : 0, borderBottomColor: C.border }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                    <Text style={{ color: C.yellow, fontSize: 10, fontFamily: 'Inter_700Bold' }}>{p.id}</Text>
                    <View style={{ backgroundColor: C.border, borderRadius: 4, paddingHorizontal: 5, paddingVertical: 1 }}>
                      <Text style={{ color: C.muted, fontSize: 8, fontFamily: 'Inter_600SemiBold' }}>{p.cat}</Text>
                    </View>
                  </View>
                  <Text style={{ color: C.ink, fontSize: 10.5, fontFamily: 'Inter_600SemiBold', marginBottom: 3 }}>{p.name}</Text>
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 5, marginBottom: 2 }}>
                    {[p.emotion, p.sil].map(tag => (
                      <Text key={tag} style={{ color: C.muted, fontSize: 8.5, fontFamily: 'Inter_400Regular', backgroundColor: C.card, borderRadius: 4, paddingHorizontal: 5, paddingVertical: 2 }}>{tag}</Text>
                    ))}
                  </View>
                  <Text style={{ color: C.muted, fontSize: 9, fontFamily: 'Inter_400Regular', fontStyle: 'italic' }}>
                    {p.fingers} · {p.wrist}
                  </Text>
                  <Text style={{ color: C.muted, fontSize: 9.5, fontFamily: 'Inter_400Regular', marginTop: 1 }}>{p.purpose}</Text>
                </View>
              ))}
            </View>
          )}

          {/* AI DIR */}
          {tab === 'ai' && (
            <View>
              <HSectionHeader title="class AIHandDirector" color={C.purple} />
              <Text style={{ color: C.purple, fontSize: 10, fontFamily: 'Inter_700Bold', marginBottom: 10 }}>{'public static class AIHandDirector {'}</Text>

              {[
                { label: 'Input: emotion',       type: 'EmotionalIntent', desc: 'Filter database by emotional tone first' },
                { label: 'Input: combatScene',   type: 'boolean',         desc: 'When true, prioritises COMBAT category' },
                { label: 'Input: dialogueScene', type: 'boolean',         desc: 'When true, prioritises DIALOGUE category' },
                { label: 'Output',               type: 'HandPose',        desc: 'Best matching pose or null if no candidates' },
              ].map((row, i, arr) => {
                const tc = TC[row.type] ?? C.ink;
                return (
                  <View key={row.label} style={{ flexDirection: 'row', alignItems: 'flex-start', paddingVertical: 6, borderBottomWidth: i < arr.length - 1 ? 1 : 0, borderBottomColor: C.border }}>
                    <View style={{ width: 155, flexDirection: 'row', alignItems: 'center', gap: 5, flexShrink: 0 }}>
                      <View style={{ backgroundColor: tc + '20', borderRadius: 4, paddingHorizontal: 4, paddingVertical: 2 }}>
                        <Text style={{ color: tc, fontSize: 8, fontFamily: 'Inter_700Bold' }}>{row.type}</Text>
                      </View>
                      <Text style={{ color: C.ink, fontSize: 9.5, fontFamily: 'Inter_600SemiBold' }}>{row.label}</Text>
                    </View>
                    <Text style={{ color: C.muted, fontSize: 9.5, fontFamily: 'Inter_400Regular', flex: 1, lineHeight: 14 }}>{'// '}{row.desc}</Text>
                  </View>
                );
              })}

              <Text style={{ color: C.purple, fontSize: 10, fontFamily: 'Inter_700Bold', marginTop: 10, marginBottom: 12 }}>{'}'}</Text>

              <View style={{ backgroundColor: C.card, borderRadius: 8, padding: 10, borderWidth: 1, borderColor: C.border, marginBottom: 10 }}>
                <Text style={{ color: C.muted, fontSize: 9, fontFamily: 'Inter_400Regular', marginBottom: 4, fontStyle: 'italic' }}>{'// Algorithm: recommendHandPose()'}</Text>
                {[
                  '1. Filter HandDatabase by EmotionalIntent',
                  '2. If combatScene=true → prefer COMBAT category',
                  '3. If dialogueScene=true → prefer DIALOGUE category',
                  '4. Return first match, or null if empty',
                ].map(s => (
                  <Text key={s} style={{ color: C.ink, fontSize: 10, fontFamily: 'Inter_400Regular', marginBottom: 3 }}>{s}</Text>
                ))}
              </View>

              <View style={{ backgroundColor: '#0A0800', borderRadius: 8, padding: 10, borderWidth: 1, borderColor: C.border }}>
                <Text style={{ color: C.muted, fontSize: 9, fontFamily: 'Inter_400Regular', marginBottom: 4, fontStyle: 'italic' }}>{'// main() test case'}</Text>
                <Text style={{ color: C.yellow, fontSize: 9.5, fontFamily: 'Inter_400Regular', lineHeight: 15 }}>
                  {`director.recommendHandPose(\n  EmotionalIntent.RAGE,\n  combatScene: true,\n  dialogueScene: false\n)\n→ Returns: combat_guard (COMBAT · DETERMINATION)`}
                </Text>
              </View>
            </View>
          )}

          <Text style={{ color: C.border, fontSize: 9, fontFamily: 'Inter_400Regular', marginTop: 16, textAlign: 'center', letterSpacing: 0.5 }}>
            AI REFERENCE ONLY · NOT IMPLEMENTED · com.bloomscript.comicstudio.hands
          </Text>
        </View>
      )}
    </View>
  );
}
