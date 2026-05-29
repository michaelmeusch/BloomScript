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

const WEAPON_ENUMS: { name: string; color: string; values: string[] }[] = [
  { name: 'WeaponCategory', color: C.red, values: [
    'MELEE','SWORD','HAMMER','SPEAR','SHIELD','GUN','HEAVY_WEAPON',
    'ENERGY_WEAPON','SCIFI','MAGIC','ALIEN','NINJA','MEDIEVAL',
    'POST_APOCALYPTIC','CYBERPUNK','STEAMPUNK','MECH','CREATURE',
    'IMPROVISED','THROWABLE','DUAL_WIELD',
  ]},
  { name: 'WeaponWeight', color: C.orange, values: [
    'LIGHT','MEDIUM','HEAVY','MASSIVE',
  ]},
  { name: 'CombatStyle', color: C.yellow, values: [
    'AGGRESSIVE','DEFENSIVE','TACTICAL','BRUTAL','ACROBATIC',
    'PRECISE','CHAOTIC','CONTROLLED','POWER_BASED','STEALTH',
  ]},
  { name: 'WeaponSilhouette', color: C.green, values: [
    'SHARP','WIDE','HEAVY','ELEGANT','BRUTAL','TECHNICAL','ORGANIC','HEROIC','VILLAINOUS',
  ]},
];

const WEAPON_FIELDS: { type: string; name: string; desc: string }[] = [
  { type: 'String',          name: 'id',                    desc: 'Unique identifier e.g. hero_katana' },
  { type: 'String',          name: 'weaponName',            desc: 'Display name of the weapon' },
  { type: 'WeaponCategory',  name: 'category',              desc: 'Weapon type (21 categories)' },
  { type: 'WeaponWeight',    name: 'weight',                desc: 'Mass class: LIGHT → MASSIVE' },
  { type: 'CombatStyle',     name: 'combatStyle',           desc: 'Fighting approach (10 styles)' },
  { type: 'WeaponSilhouette',name: 'silhouette',            desc: 'Visual shape read (9 types)' },
  { type: 'String',          name: 'actingIntent',          desc: 'Narrative purpose e.g. "Mythic dominance"' },
  { type: 'String',          name: 'motionArc',             desc: 'Attack motion path descriptor' },
  { type: 'String',          name: 'gripStyle',             desc: 'How the character holds the weapon' },
  { type: 'String',          name: 'stanceRecommendation',  desc: 'Recommended body stance pairing' },
  { type: 'String',          name: 'cameraRecommendation',  desc: 'Suggested camera angle for impact' },
  { type: 'boolean',         name: 'cinematic',             desc: 'Suited for cinematic panel composition' },
  { type: 'boolean',         name: 'coverFriendly',         desc: 'Works as a cover-art focal element' },
  { type: 'boolean',         name: 'dualWieldCompatible',   desc: 'Can be used in a dual-wield pair' },
  { type: 'boolean',         name: 'energyEffects',         desc: 'Supports glow/energy VFX overlay' },
  { type: 'boolean',         name: 'environmentalDamage',   desc: 'Should show debris/impact in background' },
  { type: 'float',           name: 'recoilLevel',           desc: '0.0 no recoil → 1.0 full body recoil' },
  { type: 'float',           name: 'motionSpeed',           desc: '0.0 slow heavy → 1.0 blinding fast' },
  { type: 'float',           name: 'intimidationLevel',     desc: '0.0 non-threatening → 1.0 terrifying' },
  { type: 'List<String>',    name: 'keywords',              desc: 'AI prompt tags: cinematic, energy-glow...' },
  { type: 'List<String>',    name: 'compatiblePoses',       desc: 'Pose IDs that pair naturally with weapon' },
  { type: 'String',          name: 'conceptImage',          desc: 'Path to weapon concept reference' },
  { type: 'String',          name: 'motionReference',       desc: 'Path to motion arc reference image' },
];

const SAMPLE_WEAPONS: {
  id: string; name: string; cat: string; weight: string;
  style: string; sil: string; intent: string; motion: string; grip: string; stance: string;
}[] = [
  { id: 'hero_katana',      name: 'Hero Katana',        cat: 'SWORD',        weight: 'MEDIUM',  style: 'PRECISE',     sil: 'ELEGANT',    intent: 'Controlled mastery',          motion: 'Fast diagonal slashes',   grip: 'Two-handed precision grip',    stance: 'Low balanced stance' },
  { id: 'massive_greatsword',name:'Massive Greatsword', cat: 'SWORD',        weight: 'MASSIVE', style: 'BRUTAL',      sil: 'HEAVY',      intent: 'Overwhelming force',          motion: 'Heavy momentum arcs',     grip: 'Wide power grip',              stance: 'Grounded heavy stance' },
  { id: 'thunder_hammer',   name: 'Thunder Hammer',     cat: 'HAMMER',       weight: 'MASSIVE', style: 'POWER_BASED', sil: 'HEROIC',     intent: 'Mythic dominance',            motion: 'Circular heavy swings',   grip: 'Power grip',                   stance: 'Wide heroic stance' },
  { id: 'energy_spear',     name: 'Energy Spear',       cat: 'SPEAR',        weight: 'MEDIUM',  style: 'PRECISE',     sil: 'SHARP',      intent: 'Elegant precision',           motion: 'Linear thrust motion',    grip: 'Extended reach grip',          stance: 'Forward balanced stance' },
  { id: 'hero_shield',      name: 'Hero Shield',        cat: 'SHIELD',       weight: 'HEAVY',   style: 'DEFENSIVE',   sil: 'HEROIC',     intent: 'Protection and leadership',   motion: 'Deflection arcs',         grip: 'Arm-locked grip',              stance: 'Defensive combat stance' },
  { id: 'tactical_pistol',  name: 'Tactical Pistol',    cat: 'GUN',          weight: 'LIGHT',   style: 'TACTICAL',    sil: 'TECHNICAL',  intent: 'Precision control',           motion: 'Sharp recoil motion',     grip: 'Two-hand firearm grip',        stance: 'Combat aiming stance' },
  { id: 'minigun',          name: 'Heavy Minigun',      cat: 'HEAVY_WEAPON', weight: 'MASSIVE', style: 'BRUTAL',      sil: 'HEAVY',      intent: 'Overwhelming suppression',    motion: 'Rotational recoil',       grip: 'Heavy support grip',           stance: 'Wide recoil stance' },
  { id: 'plasma_blaster',   name: 'Plasma Blaster',     cat: 'ENERGY_WEAPON',weight: 'MEDIUM',  style: 'CHAOTIC',     sil: 'TECHNICAL',  intent: 'High energy destruction',     motion: 'Energy recoil pulse',     grip: 'Forward tech grip',            stance: 'Aggressive firing stance' },
  { id: 'railgun',          name: 'Railgun',             cat: 'SCIFI',        weight: 'HEAVY',   style: 'PRECISE',     sil: 'TECHNICAL',  intent: 'Advanced precision warfare',  motion: 'Linear recoil blast',     grip: 'Mechanical support grip',      stance: 'Scoped firing stance' },
  { id: 'arcane_staff',     name: 'Arcane Staff',        cat: 'MAGIC',        weight: 'MEDIUM',  style: 'CONTROLLED',  sil: 'ELEGANT',    intent: 'Mystic authority',            motion: 'Flowing spell arcs',      grip: 'Loose casting grip',           stance: 'Ceremonial stance' },
  { id: 'bio_cannon',       name: 'Bio Cannon',          cat: 'ALIEN',        weight: 'HEAVY',   style: 'CHAOTIC',     sil: 'ORGANIC',    intent: 'Living weapon aggression',    motion: 'Organic recoil motion',   grip: 'Integrated grip',              stance: 'Predatory stance' },
  { id: 'chain_blade',      name: 'Chain Blade',         cat: 'NINJA',        weight: 'LIGHT',   style: 'ACROBATIC',   sil: 'SHARP',      intent: 'Fast stealth attacks',        motion: 'Whip motion arcs',        grip: 'Flexible wrist grip',          stance: 'Low agile stance' },
  { id: 'battle_axe',       name: 'Battle Axe',          cat: 'MEDIEVAL',     weight: 'HEAVY',   style: 'BRUTAL',      sil: 'HEAVY',      intent: 'Raw destructive force',       motion: 'Heavy chopping arcs',     grip: 'Overhead grip',                stance: 'Wide grounded stance' },
  { id: 'neon_smg',         name: 'Neon SMG',            cat: 'CYBERPUNK',    weight: 'LIGHT',   style: 'AGGRESSIVE',  sil: 'TECHNICAL',  intent: 'Urban rapid combat',          motion: 'Rapid recoil pattern',    grip: 'Compact firearm grip',         stance: 'Street combat stance' },
  { id: 'steam_rifle',      name: 'Steam Rifle',         cat: 'STEAMPUNK',    weight: 'HEAVY',   style: 'PRECISE',     sil: 'TECHNICAL',  intent: 'Industrial precision',        motion: 'Mechanical recoil',       grip: 'Wood-metal grip',              stance: 'Victorian combat stance' },
  { id: 'mech_cannon',      name: 'Mech Cannon',         cat: 'MECH',         weight: 'MASSIVE', style: 'POWER_BASED', sil: 'HEAVY',      intent: 'Titan-scale warfare',         motion: 'Massive recoil',          grip: 'Integrated arm cannon',        stance: 'Mechanical stability stance' },
  { id: 'bone_blade',       name: 'Bone Blade',          cat: 'CREATURE',     weight: 'MEDIUM',  style: 'CHAOTIC',     sil: 'ORGANIC',    intent: 'Savage predatory violence',   motion: 'Jagged slash arcs',       grip: 'Clawed grip',                  stance: 'Animalistic posture' },
  { id: 'energy_disc',      name: 'Energy Disc',         cat: 'THROWABLE',    weight: 'LIGHT',   style: 'PRECISE',     sil: 'SHARP',      intent: 'Fast ranged attack',          motion: 'Circular throw arcs',     grip: 'Finger-edge grip',             stance: 'Throwing stance' },
  { id: 'dual_blades',      name: 'Dual Blades',         cat: 'DUAL_WIELD',   weight: 'LIGHT',   style: 'ACROBATIC',   sil: 'SHARP',      intent: 'Speed and fluidity',          motion: 'Cross-motion attacks',    grip: 'Reverse blade grip',           stance: 'Acrobatic combat stance' },
];

// ── Type color map ────────────────────────────────────────────────────────────
const TC: Record<string, string> = {
  'String': C.blue, 'float': C.yellow, 'boolean': C.green,
  'List<String>': C.purple, 'WeaponCategory': C.red,
  'WeaponWeight': C.orange, 'CombatStyle': C.yellow, 'WeaponSilhouette': C.green,
};

// ── Sub-components ────────────────────────────────────────────────────────────
function WFieldRow({ f, last }: { f: { type: string; name: string; desc: string }; last: boolean }) {
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

function WSectionHeader({ title, count, color }: { title: string; count?: string; color: string }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8, gap: 7 }}>
      <View style={{ width: 3, height: 13, backgroundColor: color, borderRadius: 2 }} />
      <Text style={{ color, fontSize: 10, fontFamily: 'Inter_700Bold', letterSpacing: 0.8, flex: 1 }}>{title}</Text>
      {count ? <Text style={{ color: C.muted, fontSize: 9, fontFamily: 'Inter_400Regular' }}>{count}</Text> : null}
    </View>
  );
}

// ── Main Export ───────────────────────────────────────────────────────────────
export function WeaponReference() {
  const [expanded, setExpanded] = React.useState(false);
  type Tab = 'enums' | 'fields' | 'weapons' | 'ai';
  const [tab, setTab] = React.useState<Tab>('enums');

  const TABS: { id: Tab; label: string; color: string }[] = [
    { id: 'enums',   label: 'ENUMS',    color: C.red },
    { id: 'fields',  label: 'FIELDS',   color: C.yellow },
    { id: 'weapons', label: 'WEAPONS',  color: C.orange },
    { id: 'ai',      label: 'AI DIR',   color: C.purple },
  ];

  return (
    <View style={{ marginTop: 16, borderTopWidth: 1, borderTopColor: C.border, paddingTop: 16 }}>

      <TouchableOpacity
        onPress={() => { Haptics.selectionAsync(); setExpanded(v => !v); }}
        activeOpacity={0.8}
        style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: C.card, borderWidth: 1, borderColor: C.border, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, marginBottom: 4 }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <View style={{ backgroundColor: C.red + '22', borderRadius: 6, padding: 5 }}>
            <Feather name="shield" size={13} color={C.red} />
          </View>
          <View>
            <Text style={{ color: C.ink, fontSize: 12, fontFamily: 'Inter_700Bold', letterSpacing: 0.5 }}>
              WeaponReferenceSystem
            </Text>
            <Text style={{ color: C.muted, fontSize: 9.5, fontFamily: 'Inter_400Regular', marginTop: 1 }}>
              com.bloomscript.comicstudio.weapons · {SAMPLE_WEAPONS.length} weapons · 4 enums · AI reference only
            </Text>
          </View>
        </View>
        <Feather name={expanded ? 'chevron-up' : 'chevron-down'} size={14} color={C.muted} />
      </TouchableOpacity>

      {expanded && (
        <View style={{ backgroundColor: C.bg, borderWidth: 1, borderColor: C.border, borderRadius: 12, padding: 14 }}>

          <Text style={{ color: C.muted, fontSize: 9.5, fontFamily: 'Inter_400Regular', marginBottom: 2, fontStyle: 'italic' }}>
            {'package com.bloomscript.comicstudio.weapons;'}
          </Text>
          <Text style={{ color: C.muted, fontSize: 9.5, fontFamily: 'Inter_400Regular', marginBottom: 12, fontStyle: 'italic' }}>
            {'// Classic Comics Weapon Reference System · Cover Creator AI + Comic Art Studio AI'}
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
              {WEAPON_ENUMS.map(en => (
                <View key={en.name} style={{ marginBottom: 14 }}>
                  <WSectionHeader title={`enum ${en.name}`} count={`${en.values.length} values`} color={en.color} />
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
              <WSectionHeader title="class WeaponReference" count={`${WEAPON_FIELDS.length} fields`} color={C.yellow} />
              <Text style={{ color: C.yellow, fontSize: 10, fontFamily: 'Inter_700Bold', marginBottom: 8 }}>{'public static class WeaponReference {'}</Text>
              {WEAPON_FIELDS.map((f, i) => <WFieldRow key={f.name} f={f} last={i === WEAPON_FIELDS.length - 1} />)}
              <Text style={{ color: C.yellow, fontSize: 10, fontFamily: 'Inter_700Bold', marginTop: 8 }}>{'}'}</Text>
            </View>
          )}

          {/* ── WEAPONS ── */}
          {tab === 'weapons' && (
            <View>
              <WSectionHeader title="WeaponDatabase.initialize()" count={`${SAMPLE_WEAPONS.length} weapons`} color={C.orange} />
              {SAMPLE_WEAPONS.map((w, i) => (
                <View key={w.id} style={{ paddingVertical: 7, borderBottomWidth: i < SAMPLE_WEAPONS.length - 1 ? 1 : 0, borderBottomColor: C.border }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                    <Text style={{ color: C.yellow, fontSize: 10, fontFamily: 'Inter_700Bold' }}>{w.id}</Text>
                    <View style={{ backgroundColor: C.border, borderRadius: 4, paddingHorizontal: 5, paddingVertical: 1 }}>
                      <Text style={{ color: C.muted, fontSize: 8, fontFamily: 'Inter_600SemiBold' }}>{w.cat}</Text>
                    </View>
                    <View style={{ backgroundColor: C.orange + '22', borderRadius: 4, paddingHorizontal: 5, paddingVertical: 1 }}>
                      <Text style={{ color: C.orange, fontSize: 8, fontFamily: 'Inter_600SemiBold' }}>{w.weight}</Text>
                    </View>
                  </View>
                  <Text style={{ color: C.ink, fontSize: 10.5, fontFamily: 'Inter_600SemiBold', marginBottom: 3 }}>{w.name}</Text>
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 5, marginBottom: 3 }}>
                    {[w.style, w.sil].map(tag => (
                      <Text key={tag} style={{ color: C.muted, fontSize: 8.5, fontFamily: 'Inter_400Regular', backgroundColor: C.card, borderRadius: 4, paddingHorizontal: 5, paddingVertical: 2 }}>{tag}</Text>
                    ))}
                  </View>
                  <Text style={{ color: C.muted, fontSize: 9, fontFamily: 'Inter_400Regular', fontStyle: 'italic' }}>
                    {w.motion} · {w.grip}
                  </Text>
                  <Text style={{ color: C.muted, fontSize: 9, fontFamily: 'Inter_400Regular', marginTop: 1 }}>
                    Stance: {w.stance}
                  </Text>
                  <Text style={{ color: C.muted, fontSize: 9.5, fontFamily: 'Inter_400Regular', marginTop: 2 }}>{w.intent}</Text>
                </View>
              ))}
            </View>
          )}

          {/* ── AI DIR ── */}
          {tab === 'ai' && (
            <View>
              <WSectionHeader title="class CoverWeaponDirector" color={C.purple} />
              <Text style={{ color: C.purple, fontSize: 10, fontFamily: 'Inter_700Bold', marginBottom: 10 }}>{'public static class CoverWeaponDirector {'}</Text>

              {[
                { label: 'Input: style',       type: 'CombatStyle', desc: 'Filter database by combat style first' },
                { label: 'Input: heroicCover', type: 'boolean',     desc: 'When true, only returns coverFriendly=true weapons' },
                { label: 'Output',             type: 'WeaponReference', desc: 'First matching weapon or null if none found' },
              ].map((row, i, arr) => {
                const tc = TC[row.type] ?? C.ink;
                return (
                  <View key={row.label} style={{ flexDirection: 'row', alignItems: 'flex-start', paddingVertical: 6, borderBottomWidth: i < arr.length - 1 ? 1 : 0, borderBottomColor: C.border }}>
                    <View style={{ width: 160, flexDirection: 'row', alignItems: 'center', gap: 5, flexShrink: 0 }}>
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
                <Text style={{ color: C.muted, fontSize: 9, fontFamily: 'Inter_400Regular', marginBottom: 4, fontStyle: 'italic' }}>{'// Algorithm: recommendWeapon()'}</Text>
                {[
                  '1. Iterate all weapons in WeaponDatabase',
                  '2. Match combatStyle == requested CombatStyle',
                  '3. Check weapon.coverFriendly == true',
                  '4. Return first match, or null if none found',
                ].map(s => (
                  <Text key={s} style={{ color: C.ink, fontSize: 10, fontFamily: 'Inter_400Regular', marginBottom: 3 }}>{s}</Text>
                ))}
              </View>

              <View style={{ backgroundColor: '#0A0800', borderRadius: 8, padding: 10, borderWidth: 1, borderColor: C.border }}>
                <Text style={{ color: C.muted, fontSize: 9, fontFamily: 'Inter_400Regular', marginBottom: 4, fontStyle: 'italic' }}>{'// main() test case'}</Text>
                <Text style={{ color: C.yellow, fontSize: 9.5, fontFamily: 'Inter_400Regular', lineHeight: 15 }}>
                  {`director.recommendWeapon(\n  CombatStyle.BRUTAL,\n  heroicCover: true\n)\n→ Returns: massive_greatsword\n  (SWORD · BRUTAL · coverFriendly=true)`}
                </Text>
              </View>
            </View>
          )}

          <Text style={{ color: C.border, fontSize: 9, fontFamily: 'Inter_400Regular', marginTop: 16, textAlign: 'center', letterSpacing: 0.5 }}>
            AI REFERENCE ONLY · NOT IMPLEMENTED · com.bloomscript.comicstudio.weapons
          </Text>
        </View>
      )}
    </View>
  );
}
