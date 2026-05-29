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

// ── Repository collections ────────────────────────────────────────────────────
const REPO_COLLECTIONS: { name: string; type: string; color: string; desc: string; count: string }[] = [
  { name: 'poses',   type: 'List<PoseReference>',   color: C.blue,   desc: 'Heroic / Combat / Dialogue / Emotional / Cinematic archetypes', count: '25+ entries' },
  { name: 'hands',   type: 'List<HandReference>',   color: C.purple, desc: 'Fist / Open Palm / Weapon Grip / Spell Cast / Emotional hands',  count: '23 entries' },
  { name: 'weapons', type: 'List<WeaponReference>',  color: C.red,    desc: 'Sword / Hammer / Gun / Energy / Magic / Alien / Mech weapons',   count: '19 entries' },
  { name: 'effects', type: 'List<FXReference>',      color: C.orange, desc: 'Kinetic / Energy / Laser / Shockwave / Cosmic / Cover FX',       count: '20 entries' },
];

// ── CoverCreatorAI pipeline ───────────────────────────────────────────────────
const COVER_PIPELINE: { step: number; input: string; type: string; outputField: string; color: string }[] = [
  { step: 1, input: 'pose',      type: 'PoseReference',  outputField: 'pose.poseName',          color: C.blue },
  { step: 2, input: 'weapon',    type: 'WeaponReference', outputField: 'weapon.weaponName',      color: C.red },
  { step: 3, input: 'fx',        type: 'FXReference',     outputField: 'fx.fxName',              color: C.orange },
  { step: 4, input: 'lighting',  type: 'String',          outputField: 'fx.lightingBehavior',    color: C.yellow },
  { step: 5, input: 'eye flow',  type: 'String',          outputField: 'fx.eyeFlowDirection',    color: C.cyan },
];

// ── ComicPanelAI pipeline ─────────────────────────────────────────────────────
const PANEL_PIPELINE: { step: number; input: string; type: string; outputField: string; color: string }[] = [
  { step: 1, input: 'script',       type: 'String',     outputField: 'Natural-language panel description',  color: C.blue },
  { step: 2, input: 'fx (matched)', type: 'FXReference',outputField: 'fx.fxName  (via analyzeScene)',       color: C.orange },
  { step: 3, input: 'impact',       type: 'String',     outputField: 'fx.impactReaction',                   color: C.red },
  { step: 4, input: 'environment',  type: 'String',     outputField: 'fx.environmentalReaction',            color: C.green },
  { step: 5, input: 'lighting',     type: 'String',     outputField: 'fx.lightingBehavior',                 color: C.yellow },
];

// ── analyzeScene keyword rules ────────────────────────────────────────────────
const SCENE_RULES: { keywords: string[]; result: string; idx: number }[] = [
  { keywords: ['"purple"', '"alien"'], result: 'alien_purple_blast → effects[0]', idx: 0 },
  { keywords: ['"laser"'],             result: 'ship_laser → effects[1]',         idx: 1 },
  { keywords: ['"repulsion"'],         result: 'repulsion_field → effects[2]',    idx: 2 },
  { keywords: ['(default)'],           result: 'effects[0]',                      idx: 0 },
];

// ── Sub-components ────────────────────────────────────────────────────────────
function OHeader({ title, color }: { title: string; color: string }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10, gap: 7 }}>
      <View style={{ width: 3, height: 13, backgroundColor: color, borderRadius: 2 }} />
      <Text style={{ color, fontSize: 10, fontFamily: 'Inter_700Bold', letterSpacing: 0.8 }}>{title}</Text>
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
export function ComicAIOrchestrator() {
  const [expanded, setExpanded] = React.useState(false);
  type Tab = 'repo' | 'cover' | 'panel' | 'main';
  const [tab, setTab] = React.useState<Tab>('repo');

  const TABS: { id: Tab; label: string; color: string }[] = [
    { id: 'repo',  label: 'REPO',      color: C.blue },
    { id: 'cover', label: 'COVER AI',  color: C.cyan },
    { id: 'panel', label: 'PANEL AI',  color: C.orange },
    { id: 'main',  label: 'MAIN',      color: C.yellow },
  ];

  return (
    <View style={{ marginTop: 16, borderTopWidth: 1, borderTopColor: C.border, paddingTop: 16 }}>

      <TouchableOpacity
        onPress={() => { Haptics.selectionAsync(); setExpanded(v => !v); }}
        activeOpacity={0.8}
        style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: C.card, borderWidth: 1, borderColor: C.border, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, marginBottom: 4 }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <View style={{ backgroundColor: C.yellow + '22', borderRadius: 6, padding: 5 }}>
            <Feather name="cpu" size={13} color={C.yellow} />
          </View>
          <View>
            <Text style={{ color: C.ink, fontSize: 12, fontFamily: 'Inter_700Bold', letterSpacing: 0.5 }}>
              ComicArtStudioAI — Orchestrator
            </Text>
            <Text style={{ color: C.muted, fontSize: 9.5, fontFamily: 'Inter_400Regular', marginTop: 1 }}>
              Repository · CoverCreatorAI · ComicPanelAI · AI reference only
            </Text>
          </View>
        </View>
        <Feather name={expanded ? 'chevron-up' : 'chevron-down'} size={14} color={C.muted} />
      </TouchableOpacity>

      {expanded && (
        <View style={{ backgroundColor: C.bg, borderWidth: 1, borderColor: C.border, borderRadius: 12, padding: 14 }}>

          <Text style={{ color: C.muted, fontSize: 9.5, fontFamily: 'Inter_400Regular', marginBottom: 2, fontStyle: 'italic' }}>
            {'// ComicArtStudioAI — Replit Safe Unified Build'}
          </Text>
          <Text style={{ color: C.muted, fontSize: 9.5, fontFamily: 'Inter_400Regular', marginBottom: 12, fontStyle: 'italic' }}>
            {'// Unified orchestration layer: Pose + Hand + Weapon + FX → Cover / Panel'}
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

          {/* ── REPO tab ── */}
          {tab === 'repo' && (
            <View>
              <OHeader title="class Repository  — unified data store" color={C.blue} />
              <Text style={{ color: C.blue, fontSize: 10, fontFamily: 'Inter_700Bold', marginBottom: 12 }}>
                {'static class Repository {'}
              </Text>

              {REPO_COLLECTIONS.map((col, i) => (
                <View key={col.name} style={{ paddingVertical: 8, borderBottomWidth: i < REPO_COLLECTIONS.length - 1 ? 1 : 0, borderBottomColor: C.border }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                    <View style={{ backgroundColor: col.color + '20', borderRadius: 4, paddingHorizontal: 5, paddingVertical: 2 }}>
                      <Text style={{ color: col.color, fontSize: 8.5, fontFamily: 'Inter_700Bold' }}>{col.type}</Text>
                    </View>
                    <Text style={{ color: C.ink, fontSize: 11, fontFamily: 'Inter_700Bold' }}>{col.name}</Text>
                    <View style={{ backgroundColor: C.border, borderRadius: 4, paddingHorizontal: 5, paddingVertical: 1 }}>
                      <Text style={{ color: C.muted, fontSize: 8, fontFamily: 'Inter_400Regular' }}>{col.count}</Text>
                    </View>
                  </View>
                  <Text style={{ color: C.muted, fontSize: 9.5, fontFamily: 'Inter_400Regular', lineHeight: 14 }}>{col.desc}</Text>
                </View>
              ))}

              <Text style={{ color: C.blue, fontSize: 10, fontFamily: 'Inter_700Bold', marginTop: 12, marginBottom: 16 }}>{'}'}</Text>

              {/* analyzeScene */}
              <OHeader title="Repository.analyzeScene() — FX routing" color={C.cyan} />
              {SCENE_RULES.map((r, i) => (
                <View key={i} style={{ flexDirection: 'row', alignItems: 'flex-start', paddingVertical: 5, borderBottomWidth: i < SCENE_RULES.length - 1 ? 1 : 0, borderBottomColor: C.border }}>
                  <View style={{ flexDirection: 'row', gap: 4, width: 130, flexShrink: 0, flexWrap: 'wrap' }}>
                    {r.keywords.map(k => (
                      <View key={k} style={{ backgroundColor: C.cyan + '18', borderRadius: 4, paddingHorizontal: 4, paddingVertical: 2 }}>
                        <Text style={{ color: C.cyan, fontSize: 8.5, fontFamily: 'Inter_600SemiBold' }}>{k}</Text>
                      </View>
                    ))}
                  </View>
                  <Text style={{ color: C.muted, fontSize: 9.5, fontFamily: 'Inter_400Regular', flex: 1, lineHeight: 14 }}>
                    {'→ '}<Text style={{ color: C.yellow }}>{r.result}</Text>
                  </Text>
                </View>
              ))}
            </View>
          )}

          {/* ── COVER AI tab ── */}
          {tab === 'cover' && (
            <View>
              <OHeader title="class CoverCreatorAI" color={C.cyan} />
              <Text style={{ color: C.cyan, fontSize: 10, fontFamily: 'Inter_700Bold', marginBottom: 6 }}>
                {'static class CoverCreatorAI {'}
              </Text>
              <Text style={{ color: C.muted, fontSize: 9.5, fontFamily: 'Inter_400Regular', marginBottom: 14, fontStyle: 'italic' }}>
                {'// buildCover(FXReference fx, WeaponReference weapon, PoseReference pose)'}
              </Text>

              <OHeader title="Input → Output pipeline" color={C.yellow} />
              {COVER_PIPELINE.map((step, i) => (
                <View key={step.step} style={{ flexDirection: 'row', alignItems: 'flex-start', paddingVertical: 7, borderBottomWidth: i < COVER_PIPELINE.length - 1 ? 1 : 0, borderBottomColor: C.border }}>
                  <View style={{ width: 22, height: 22, borderRadius: 11, backgroundColor: step.color + '30', borderWidth: 1, borderColor: step.color + '60', alignItems: 'center', justifyContent: 'center', marginRight: 10, flexShrink: 0 }}>
                    <Text style={{ color: step.color, fontSize: 9, fontFamily: 'Inter_700Bold' }}>{step.step}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 2 }}>
                      <View style={{ backgroundColor: step.color + '20', borderRadius: 4, paddingHorizontal: 4, paddingVertical: 2 }}>
                        <Text style={{ color: step.color, fontSize: 8, fontFamily: 'Inter_700Bold' }}>{step.type}</Text>
                      </View>
                      <Text style={{ color: C.ink, fontSize: 10, fontFamily: 'Inter_600SemiBold' }}>{step.input}</Text>
                    </View>
                    <Text style={{ color: C.muted, fontSize: 9, fontFamily: 'Inter_400Regular', fontStyle: 'italic' }}>{step.outputField}</Text>
                  </View>
                </View>
              ))}

              <Text style={{ color: C.cyan, fontSize: 10, fontFamily: 'Inter_700Bold', marginTop: 12, marginBottom: 16 }}>{'}'}</Text>

              <OHeader title="Cover output fields" color={C.muted} />
              {[
                { field: 'POSE',     value: 'pose.poseName',       example: '"Standing Tall"' },
                { field: 'WEAPON',   value: 'weapon.weaponName',   example: '"Hero Katana"' },
                { field: 'FX',       value: 'fx.fxName',           example: '"Alien Purple Blast"' },
                { field: 'LIGHTING', value: 'fx.lightingBehavior', example: '"Violet glow bloom"' },
                { field: 'FLOW',     value: 'fx.eyeFlowDirection', example: '"Left to right"' },
              ].map(row => (
                <View key={row.field} style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 4, borderBottomWidth: 1, borderBottomColor: C.border }}>
                  <Text style={{ color: C.yellow, fontSize: 9, fontFamily: 'Inter_700Bold', width: 60 }}>{row.field}</Text>
                  <Text style={{ color: C.muted, fontSize: 9, fontFamily: 'Inter_400Regular', flex: 1 }}>{row.value}</Text>
                  <Text style={{ color: C.green, fontSize: 9, fontFamily: 'Inter_400Regular' }}>{row.example}</Text>
                </View>
              ))}
            </View>
          )}

          {/* ── PANEL AI tab ── */}
          {tab === 'panel' && (
            <View>
              <OHeader title="class ComicPanelAI" color={C.orange} />
              <Text style={{ color: C.orange, fontSize: 10, fontFamily: 'Inter_700Bold', marginBottom: 6 }}>
                {'static class ComicPanelAI {'}
              </Text>
              <Text style={{ color: C.muted, fontSize: 9.5, fontFamily: 'Inter_400Regular', marginBottom: 14, fontStyle: 'italic' }}>
                {'// generatePanel(String script, FXReference fx)'}
              </Text>

              <OHeader title="Input → Output pipeline" color={C.yellow} />
              {PANEL_PIPELINE.map((step, i) => (
                <View key={step.step} style={{ flexDirection: 'row', alignItems: 'flex-start', paddingVertical: 7, borderBottomWidth: i < PANEL_PIPELINE.length - 1 ? 1 : 0, borderBottomColor: C.border }}>
                  <View style={{ width: 22, height: 22, borderRadius: 11, backgroundColor: step.color + '30', borderWidth: 1, borderColor: step.color + '60', alignItems: 'center', justifyContent: 'center', marginRight: 10, flexShrink: 0 }}>
                    <Text style={{ color: step.color, fontSize: 9, fontFamily: 'Inter_700Bold' }}>{step.step}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 2 }}>
                      <View style={{ backgroundColor: step.color + '20', borderRadius: 4, paddingHorizontal: 4, paddingVertical: 2 }}>
                        <Text style={{ color: step.color, fontSize: 8, fontFamily: 'Inter_700Bold' }}>{step.type}</Text>
                      </View>
                      <Text style={{ color: C.ink, fontSize: 10, fontFamily: 'Inter_600SemiBold' }}>{step.input}</Text>
                    </View>
                    <Text style={{ color: C.muted, fontSize: 9, fontFamily: 'Inter_400Regular', fontStyle: 'italic' }}>{step.outputField}</Text>
                  </View>
                </View>
              ))}

              <Text style={{ color: C.orange, fontSize: 10, fontFamily: 'Inter_700Bold', marginTop: 12, marginBottom: 16 }}>{'}'}</Text>

              <OHeader title="Panel output fields" color={C.muted} />
              {[
                { field: 'SCRIPT',      value: 'script',                        example: '"Jon was struck by..."' },
                { field: 'FX',          value: 'fx.fxName',                     example: '"Alien Purple Blast"' },
                { field: 'IMPACT',      value: 'fx.impactReaction',             example: '"Chest blowback"' },
                { field: 'ENVIRONMENT', value: 'fx.environmentalReaction',      example: '"Purple atmospheric haze"' },
                { field: 'LIGHTING',    value: 'fx.lightingBehavior',           example: '"Violet glow bloom"' },
              ].map(row => (
                <View key={row.field} style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 4, borderBottomWidth: 1, borderBottomColor: C.border }}>
                  <Text style={{ color: C.yellow, fontSize: 9, fontFamily: 'Inter_700Bold', width: 80 }}>{row.field}</Text>
                  <Text style={{ color: C.muted, fontSize: 9, fontFamily: 'Inter_400Regular', flex: 1 }}>{row.value}</Text>
                  <Text style={{ color: C.green, fontSize: 9, fontFamily: 'Inter_400Regular', maxWidth: 120, textAlign: 'right' }}>{row.example}</Text>
                </View>
              ))}
            </View>
          )}

          {/* ── MAIN tab ── */}
          {tab === 'main' && (
            <View>
              <OHeader title="main() — full system integration test" color={C.yellow} />

              {/* Init summary */}
              <View style={{ backgroundColor: C.card, borderRadius: 8, padding: 10, borderWidth: 1, borderColor: C.border, marginBottom: 14 }}>
                <Text style={{ color: C.muted, fontSize: 9, fontFamily: 'Inter_400Regular', marginBottom: 6, fontStyle: 'italic' }}>{'// Repository.initialize() loads all 4 systems:'}</Text>
                {[
                  { label: 'POSE REFERENCES',   value: '2+ entries loaded  (25+ in full build)' },
                  { label: 'HAND REFERENCES',   value: '2+ entries loaded  (23+ in full build)' },
                  { label: 'WEAPON REFERENCES', value: '2+ entries loaded  (19+ in full build)' },
                  { label: 'FX REFERENCES',     value: '3+ entries loaded  (20+ in full build)' },
                ].map(row => (
                  <View key={row.label} style={{ flexDirection: 'row', paddingVertical: 3 }}>
                    <Text style={{ color: C.yellow, fontSize: 9, fontFamily: 'Inter_700Bold', width: 130 }}>{row.label}</Text>
                    <Text style={{ color: C.muted, fontSize: 9, fontFamily: 'Inter_400Regular' }}>{row.value}</Text>
                  </View>
                ))}
              </View>

              {/* Test scene */}
              <OHeader title="Test scene: analyzeScene() → ComicPanelAI" color={C.orange} />
              <CodeBlock>
                {'String script =\n  "Jon was struck by an alien purple blast";\n\nFXReference fx = repo.analyzeScene(script);\n// → Matches: "purple" + "alien"\n// → Returns: alien_purple_blast (ENERGY_BLAST · COSMIC · MASSIVE)\n\ncomicAI.generatePanel(script, fx);\n// → SCRIPT:      "Jon was struck by an alien purple blast"\n// → FX:          Alien Purple Blast\n// → IMPACT:      Chest blowback\n// → ENVIRONMENT: Purple atmospheric haze\n// → LIGHTING:    Violet glow bloom'}
              </CodeBlock>

              <View style={{ height: 14 }} />

              {/* Cover test */}
              <OHeader title="Test scene: buildCover() — Cover Creator AI" color={C.cyan} />
              <CodeBlock>
                {'coverAI.buildCover(\n  fx,               // alien_purple_blast\n  repo.weapons[0],  // Hero Katana\n  repo.poses[0]     // Standing Tall\n);\n// → POSE:     Standing Tall\n// → WEAPON:   Hero Katana\n// → FX:       Alien Purple Blast\n// → LIGHTING: Violet glow bloom\n// → FLOW:     Left to right'}
              </CodeBlock>

              <View style={{ height: 14 }} />

              {/* Architecture diagram */}
              <OHeader title="Architecture: data flow" color={C.purple} />
              <View style={{ backgroundColor: C.card, borderRadius: 8, padding: 12, borderWidth: 1, borderColor: C.border }}>
                {[
                  { from: 'script (String)',        arrow: '→  analyzeScene()',     to: 'FXReference',       fromC: C.blue,   toC: C.orange },
                  { from: 'FXReference + Weapon + Pose', arrow: '→  buildCover()',  to: 'Cover output',      fromC: C.orange, toC: C.cyan },
                  { from: 'script + FXReference',   arrow: '→  generatePanel()',    to: 'Panel output',      fromC: C.orange, toC: C.green },
                ].map((row, i) => (
                  <View key={i} style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 5, borderBottomWidth: i < 2 ? 1 : 0, borderBottomColor: C.border }}>
                    <Text style={{ color: row.fromC, fontSize: 9, fontFamily: 'Inter_600SemiBold', flex: 1 }}>{row.from}</Text>
                    <Text style={{ color: C.muted, fontSize: 9, fontFamily: 'Inter_400Regular', marginHorizontal: 6 }}>{row.arrow}</Text>
                    <Text style={{ color: row.toC, fontSize: 9, fontFamily: 'Inter_700Bold' }}>{row.to}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          <Text style={{ color: C.border, fontSize: 9, fontFamily: 'Inter_400Regular', marginTop: 16, textAlign: 'center', letterSpacing: 0.5 }}>
            AI REFERENCE ONLY · NOT IMPLEMENTED · ComicArtStudioAI
          </Text>
        </View>
      )}
    </View>
  );
}
