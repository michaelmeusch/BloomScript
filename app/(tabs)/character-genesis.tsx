import { Feather } from '@expo/vector-icons';
import { useAuth } from '@clerk/expo';
import * as Haptics from 'expo-haptics';
import * as FileSystem from 'expo-file-system/legacy';
import * as MediaLibrary from 'expo-media-library';
import * as Sharing from 'expo-sharing';
import { router } from 'expo-router';
import React, { useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  Image,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { API_BASE } from '@/constants/api';

// ── COMIC palette ─────────────────────────────────────────────────────────────
const C = {
  bg: '#0E0C0A', card: '#181410', card2: '#201A14', border: '#2E2618',
  yellow: '#FFD600', red: '#E8001C', blue: '#0057A8', green: '#2A7A3A',
  ink: '#F0EAD8', muted: '#7A6A58', dim: '#3A3028',
};

// ── Questions ─────────────────────────────────────────────────────────────────

const QUESTIONS = [
  {
    id: 'species' as const,
    label: 'What kind of being?',
    emoji: '🧬',
    options: [
      { value: 'Human / Mutant',     emoji: '🦸', desc: 'Street-level hero, enhanced human' },
      { value: 'Alien / Kryptonian', emoji: '👽', desc: 'Solar-powered alien visitor' },
      { value: 'Asgardian / God',    emoji: '⚡', desc: 'Mythic warrior deity' },
      { value: 'Demon / Hellspawn',  emoji: '🔥', desc: 'Infernal anti-hero, occult origin' },
      { value: 'Cyborg / Android',   emoji: '🤖', desc: 'Half-machine soldier, synthetic life' },
      { value: 'Atlantean / Mer',    emoji: '🐟', desc: 'Ocean monarch, aquatic champion' },
      { value: 'Vampire / Undead',   emoji: '🧛', desc: 'Night hunter, cursed immortal' },
      { value: 'Cosmic Entity',      emoji: '🌌', desc: 'Galactic herald, universe-level power' },
    ],
  },
  {
    id: 'bodyType' as const,
    label: 'Body Type?',
    emoji: '💪',
    options: [
      { value: 'Slim / Acrobat',    emoji: '🏃', desc: 'Agile wall-crawler, parkour specialist' },
      { value: 'Athletic / Heroic', emoji: '🏋️', desc: 'Peak human form, tactical athlete' },
      { value: 'Massive / Brute',   emoji: '🗿', desc: 'Giant rage monster, unstoppable force' },
      { value: 'Muscular / Toned',  emoji: '💪', desc: 'Powerhouse champion, godlike physique' },
      { value: 'Lean / Wiry',       emoji: '🧘', desc: 'Compact berserker, relentless scrapper' },
      { value: 'Shape-Shifter',     emoji: '🐉', desc: 'Molecular mimic, fluid form changer' },
      { value: 'Multi-Limbed',      emoji: '🦀', desc: 'Mechanical appendages, tentacle combat' },
      { value: 'Hulking / Monstrous', emoji: '🦍', desc: 'Kaiju-scale destroyer, living weapon' },
    ],
  },
  {
    id: 'personality' as const,
    label: 'Personality Archetype?',
    emoji: '🎭',
    options: [
      { value: 'Hero / Champion',       emoji: '⚜️', desc: 'Beacon of justice, unwavering moral compass' },
      { value: 'Ruler / King',          emoji: '👑', desc: 'Hidden monarch, secret-nation sovereign' },
      { value: 'Rebel / Outlaw',        emoji: '🙎', desc: 'Anti-authority freedom fighter, system hacker' },
      { value: 'Sage / Seeker',         emoji: '📚', desc: 'Truth-hunting scholar, masked detective' },
      { value: 'Explorer / Wanderer',   emoji: '🧭', desc: 'Cosmic drifter, dimension-hopping scout' },
      { value: 'Creator / Inventor',    emoji: '🔧', desc: 'Builder of impossible machines, tech artist' },
      { value: 'Jester / Trickster',    emoji: '🎩', desc: 'Quip-slinging chaos agent, irreverent warrior' },
      { value: 'Caregiver / Healer',    emoji: '💚', desc: 'Battlefield medic, team protector, empath' },
      { value: 'Everyman / Citizen',      emoji: '👔', desc: 'Relatable average Joe, suddenly empowered' },
      { value: 'Lover / Devoted',       emoji: '❤️', desc: 'Driven by love, redemption-seeking romantic' },
      { value: 'Innocent / Pure',       emoji: '💕', desc: 'Naive powerhouse, gentle giant, childlike wonder' },
      { value: 'Mage / Wizard',         emoji: '🧙', desc: 'Mystic mentor, spell-weaving strategist' },
      { value: 'Shadow / Destroyer',    emoji: '🌑', desc: 'Tragedy-driven vigilante, dark avenger' },
      { value: 'Warrior / Berserker',   emoji: '🐺', desc: 'Feral lone wolf, claws-out relentless fighter' },
    ],
  },
  {
    id: 'combatStyle' as const,
    label: 'Combat Style?',
    emoji: '⚔️',
    options: [
      { value: 'Agile / Acrobatic',    emoji: '🌪️', desc: 'Web-swinging martial artist, rooftop fighter' },
      { value: 'Heavy / Brute Force',  emoji: '🪨', desc: 'Smash-first powerhouse, earthquake puncher' },
      { value: 'Tactical / Martial',   emoji: '🥷', desc: 'World-class detective, shield-wielding soldier' },
      { value: 'Gadget / Tech',        emoji: '🔧', desc: 'Armored inventor, trick-arrow archer' },
      { value: 'Energy Projection',    emoji: '✨', desc: 'Optic-blast marksman, ring-wielding space cop' },
      { value: 'Psychic / Mental',     emoji: '🧠', desc: 'Mind-reading commander, telekinetic warrior' },
      { value: 'Speed / Blitz',        emoji: '⚡', desc: 'Lightning-fast runner, time-bending blur' },
      { value: 'Weather / Elemental',  emoji: '🌧️', desc: 'Storm goddess, living flame or ice' },
      { value: 'Weapon Master',        emoji: '🗡️', desc: 'Dual-sword mercenary, vampire hunter' },
    ],
  },
  {
    id: 'environment' as const,
    label: 'Home Environment?',
    emoji: '🌍',
    options: [
      { value: 'Space / Cosmic',      emoji: '🚀', desc: 'Galactic peacekeeper, silver cosmic herald' },
      { value: 'Fantasy / Magical',   emoji: '🧙', desc: 'Sorcerer supreme, lightning-powered champion' },
      { value: 'Urban / Street',      emoji: '🏙️', desc: 'Gothic rooftop guardian, blind martial artist' },
      { value: 'Underwater',          emoji: '🐟', desc: 'Ocean throne king, underwater empire ruler' },
      { value: 'Apocalypse / Ruins',  emoji: '☢️', desc: 'Wasteland survivor, time-traveling soldier' },
      { value: 'Cyberpunk / Neon',    emoji: '🌆', desc: 'Android ghost agent, neon-noir hacker' },
      { value: 'Hidden Kingdom',      emoji: '🏰', desc: 'Secret utopia nation, hidden island realm' },
      { value: 'Otherworld / Hell',   emoji: '🔥', desc: 'Demon detective, flaming skull rider' },
    ],
  },
  {
    id: 'energySource' as const,
    label: 'Power Source?',
    emoji: '⚡',
    options: [
      { value: 'Solar Radiation',    emoji: '☀️', desc: 'Sun-charged alien, solar-cell physiology' },
      { value: 'Gamma Radiation',    emoji: '🔵', desc: 'Unstoppable rage beast, gamma-fueled monster' },
      { value: 'Speed Force',        emoji: '⚡', desc: 'Lightning-trajectory runner, time-stream runner' },
      { value: 'Vibranium / Tech',   emoji: '🔧', desc: 'Super-metal king, powered-armor inventor' },
      { value: 'Infinity / Cosmic',  emoji: '🌌', desc: 'Gauntlet-wielding titan, photon-absorbing ace' },
      { value: 'Arcane / Magic',     emoji: '✨', desc: 'Spell-casting master, stage-magician turned real' },
      { value: 'Mutation / X-Gene',  emoji: '🧬', desc: 'Genetic outcast, magnetic field controller' },
      { value: 'Symbiote / Alien',   emoji: '👾', desc: 'Living goo suit, parasitic alien hunter' },
      { value: 'Occult / Demonic',   emoji: '🔥', desc: 'Hell-born investigator, penance-streaked spirit' },
    ],
  },
  {
    id: 'origin' as const,
    label: 'Origin Story?',
    emoji: '📚',
    options: [
      { value: 'Lab Accident',        emoji: '🧪', desc: 'Radiation experiment gone wrong' },
      { value: 'Alien Heritage',       emoji: '👽', desc: 'Last son of a dead planet' },
      { value: 'Tragic Loss',         emoji: '💀', desc: 'Orphaned heir turned night avenger' },
      { value: 'Divine / Mythic',     emoji: '⚡', desc: 'Thunder god reborn on Earth' },
      { value: 'Military / Experiment', emoji: '🎖️', desc: 'Super-soldier serum volunteer' },
      { value: 'Crime / Street Rise',  emoji: '🔪', desc: 'Blind lawyer by day, vigilante by night' },
      { value: 'Occult Summoning',    emoji: '🔮', desc: 'Demon raised by humans to fight evil' },
      { value: 'Tech Genius',         emoji: '💻', desc: 'Billionaire inventor in powered armor' },
    ],
  },
  {
    id: 'costumeStyle' as const,
    label: 'Costume Style?',
    emoji: '🎭',
    options: [
      { value: 'Spandex / Bright',   emoji: '🦋', desc: 'Primary-color bodysuit, bold emblem chest' },
      { value: 'Tactical / Armor',   emoji: '🛡️', desc: 'Kevlar weave, utility belt, armored plates' },
      { value: 'High-Tech / Mech',   emoji: '🤖', desc: 'Powered exoskeleton, HUD visor, repulsors' },
      { value: 'Trench Coat / Noir', emoji: '🧥', desc: 'Long coat, rumpled suit, occult investigator' },
      { value: 'Minimal / Mask',     emoji: '🎭', desc: ' sleek bodysuit, cowl, ear-horn silhouette' },
      { value: 'Cape / Regal',       emoji: '🦢', desc: 'Flowing cloak, high collar, mystical mantle' },
      { value: 'Street Clothes',     emoji: '👔', desc: 'Leather jacket, hoodie, everyday hero look' },
      { value: 'Robes / Mystic',     emoji: '🧙', desc: 'Floating cloak, Eye of Agamotto pendant' },
    ],
  },
  {
    id: 'signatureWeapon' as const,
    label: 'Signature Weapon / Power?',
    emoji: '💥',
    options: [
      { value: 'Shield',         emoji: '🛡️', desc: 'Throwing disc, ricochet master, star emblem' },
      { value: 'Hammer / Mace',  emoji: '🔨', desc: 'Mjolnir-style lightning hammer, only the worthy' },
      { value: 'Energy Rings',   emoji: '💍', desc: 'Will-powered hard-light constructs' },
      { value: 'Web-Shooters',   emoji: '🕸️', desc: 'Wrist-mounted fluid shooters, wall-crawler' },
      { value: 'Claws / Blades', emoji: '🗡️', desc: 'Retractable knuckle claws, dual katanas' },
      { value: 'Gadget Belt',    emoji: '🎒', desc: 'Batarangs, smoke bombs, grapnel gun' },
      { value: 'Magic Artifact', emoji: '💎', desc: 'Cloak of Levitation, spell-amplifying relic' },
      { value: 'Eye Beams',      emoji: '👁️', desc: 'Concussive optic blasts, heat vision' },
      { value: 'None / Fists',   emoji: '👊', desc: 'Giant green fists, unbreakable skin' },
    ],
  },
  {
    id: 'costumeColors' as const,
    label: 'Costume Color Palette?',
    emoji: '🎨',
    options: [
      { value: 'Red & Blue',       emoji: '🔴🔵', desc: 'Classic primary suit, web or shield motif' },
      { value: 'Black & Yellow',   emoji: '⚫📱', desc: 'Dark knight scheme, bat silhouette belt' },
      { value: 'Green & Black',    emoji: '🟢⚫', desc: 'Emerald power ring, moss-green muscle' },
      { value: 'Gold & Purple',    emoji: '🟡🟣', desc: 'Royal vibranium weave, cosmic tyrant trim' },
      { value: 'Silver / Chrome',  emoji: '🥇', desc: 'Mirror-finish skin, liquid-metal physique' },
      { value: 'All Black',        emoji: '⚫', desc: 'Symbiote sleek, shadow assassin, living ink' },
      { value: 'White & Gold',     emoji: '⚪🟡', desc: 'Moon-god ceremonial, white cape gold trim' },
      { value: 'Red & Gold',       emoji: '🔴🟡', desc: 'Hot-rod armor, repulsor glow chest plate' },
      { value: 'Blue & Silver',    emoji: '🔵🥇', desc: 'Nuclear blue glow, icy chrome body' },
      { value: 'Orange & Brown',   emoji: '🟧🦉', desc: 'Stone-skinned orange, trench-coat earthy' },
    ],
  },
  {
    id: 'faceCoverage' as const,
    label: 'Face Coverage / Mask?',
    emoji: '🎭',
    options: [
      { value: 'Full Face Mask',      emoji: '🎭', desc: 'Expressive white lenses, zippered mouth' },
      { value: 'Eyes Only / Domino',  emoji: '🌻', desc: 'Black pointed cowl, cat-eye slits' },
      { value: 'Half Mask / Jaw',     emoji: '👁️', desc: 'Metal jaw plate, exposed human eye' },
      { value: 'Hood + Shadow',       emoji: '🦓', desc: 'Living cloak hood, red glowing eye slits' },
      { value: 'Helmet / Visor',      emoji: '🤖', desc: 'Red-and-gold helmet, magneto dome' },
      { value: 'Breathing Apparatus', emoji: '🫁', desc: 'Gas-mask tubes, voice-modulator box' },
      { value: 'No Mask / Face',      emoji: '👤', desc: 'Open heroic face, crown or helmet off' },
      { value: 'Goggles / Scarf',     emoji: '🥿', desc: 'Aviator goggles, hooded scarf, mohawk' },
    ],
  },
  // ── SUPERPOWER TYPE (sourced from the all-powers taxonomy) ─────────────────
  {
    id: 'superpowerType' as const,
    label: 'Primary Superpower?',
    emoji: '💥',
    options: [
      // ── Physical ──
      { value: 'Super Strength',       emoji: '💪', desc: 'Physical: lifting mountains, earth-shattering punches' },
      { value: 'Super Speed',          emoji: '⚡', desc: 'Physical: lightning velocity, time-trace movement' },
      { value: 'Flight / Levitation',  emoji: '🦅', desc: 'Physical: unaided airborne freedom, gravity defiance' },
      { value: 'Invulnerability',      emoji: '🛡️', desc: 'Physical: near-indestructible body, bullet-proof skin' },
      { value: 'Healing Factor',       emoji: '🩹', desc: 'Biological: instant regeneration from any wound' },
      { value: 'Size Manipulation',    emoji: '🔬', desc: 'Biological: grow giant or shrink to microscopic scale' },
      // ── Energy ──
      { value: 'Energy Projection',    emoji: '✨', desc: 'Energy: fire concussive beams and force blasts' },
      { value: 'Force Fields',         emoji: '🔵', desc: 'Energy: project impenetrable psionic barriers' },
      { value: 'Energy Absorption',    emoji: '♻️', desc: 'Energy: absorb, store and redirect any energy form' },
      // ── Psychic ──
      { value: 'Telepathy',            emoji: '🧠', desc: 'Psychic: read thoughts, broadcast emotions, link minds' },
      { value: 'Telekinesis',          emoji: '🌀', desc: 'Psychic: move objects/people with pure mental force' },
      { value: 'Mind Control',         emoji: '👁️', desc: 'Psychic: override free will, puppet any organism' },
      { value: 'Precognition',         emoji: '🔮', desc: 'Psychic: see likely futures, read probability streams' },
      // ── Elemental ──
      { value: 'Pyrokinesis / Fire',   emoji: '🔥', desc: 'Elemental: generate and control living flame' },
      { value: 'Cryokinesis / Ice',    emoji: '❄️', desc: 'Elemental: freeze matter, project sub-zero blasts' },
      { value: 'Electrokinesis',       emoji: '⛈️', desc: 'Elemental: summon lightning, ride magnetic fields' },
      { value: 'Geokinesis / Earth',   emoji: '🌍', desc: 'Elemental: command stone, rock, and tectonic plates' },
      { value: 'Aerokinesis / Wind',   emoji: '🌪️', desc: 'Elemental: direct hurricanes and atmospheric pressure' },
      { value: 'Hydrokinesis / Water', emoji: '🌊', desc: 'Elemental: reshape tidal forces and water states' },
      // ── Space / Time ──
      { value: 'Teleportation',        emoji: '🚪', desc: 'Space-Time: instant spatial transit, portal creation' },
      { value: 'Time Manipulation',    emoji: '⏱️', desc: 'Space-Time: slow, freeze, rewind, or accelerate time' },
      { value: 'Phasing / Intangibility', emoji: '👻', desc: 'Space-Time: pass through solid matter' },
      { value: 'Dimensional Travel',   emoji: '🌌', desc: 'Space-Time: shift between parallel universes/realms' },
      // ── Reality / Cosmic ──
      { value: 'Reality Warping',      emoji: '🎆', desc: 'Cosmic: rewrite laws of physics on the fly' },
      { value: 'Gravity Control',      emoji: '⚫', desc: 'Cosmic: manipulate mass, black-hole pulls, orbit' },
      { value: 'Matter Manipulation',  emoji: '🧪', desc: 'Cosmic: transmute elements, reshape molecular bonds' },
      // ── Magic ──
      { value: 'Sorcery / Spellcasting', emoji: '🧙', desc: 'Magic: mystical incantations, arcane formula casting' },
      { value: 'Necromancy / Death',   emoji: '💀', desc: 'Magic: raise undead, control life-force and mortality' },
      { value: 'Summoning / Binding',  emoji: '📜', desc: 'Magic: call demons, spirits, or cosmic entities' },
      // ── Stealth / Bio ──
      { value: 'Invisibility',         emoji: '👁️', desc: 'Stealth: bend light around body, become unseen' },
      { value: 'Shape-Shifting',       emoji: '🐉', desc: 'Biological: copy any person, creature, or object' },
      { value: 'Animal Mimicry',       emoji: '🐾', desc: 'Biological: replicate any creature ability on demand' },
      { value: 'Symbiosis / Bond',     emoji: '👾', desc: 'Biological: alien/organic suit merges with host body' },
      // ── Tech ──
      { value: 'Cybernetics / Tech',   emoji: '🤖', desc: 'Tech: machine-enhanced body, AI neural interface' },
      { value: 'Magnetism / Metal',    emoji: '🧲', desc: 'Tech: control ferrous metals, generate EM pulses' },
      { value: 'Sonic / Vibration',    emoji: '📢', desc: 'Tech: shockwave screams, resonance frequency attacks' },
      { value: 'Darkness / Shadow',    emoji: '🌑', desc: 'Stealth: command living shadow, void portals' },
    ],
  },
] as const;

type QuestionId = (typeof QUESTIONS)[number]['id'];

// ── Pipeline ──────────────────────────────────────────────────────────────────

const PIPELINE = [
  {
    id: 'analyze' as const,
    label: 'Trait Analyzer  ·  Character DNA Builder',
    module: 'questionnaire / traits / ai',
  },
  {
    id: 'silhouette' as const,
    label: 'Silhouette Generator',
    module: 'silhouette / anatomy',
  },
  {
    id: 'character' as const,
    label: 'Anatomy Engine  ·  Species Constructor',
    module: 'anatomy / species',
  },
  {
    id: 'turnaround' as const,
    label: '3D Turnaround Generator',
    module: 'rotation / rendering',
  },
  {
    id: 'texture' as const,
    label: 'Texture + Costume AI',
    module: 'textures / mech / rendering',
  },
] as const;

type PipelineStepId = (typeof PIPELINE)[number]['id'];
type StepStatus = 'pending' | 'running' | 'done' | 'error';

// ── Types ─────────────────────────────────────────────────────────────────────

type Answers = Partial<Record<QuestionId, string>>;

interface CharacterDNA {
  name: string;
  species: string;
  bodyArchetype: string;
  personalityProfile: string;
  combatStyle: string;
  environment: string;
  energySource: string;
  origin: string;
  costumeStyle: string;
  signatureWeapon: string;
  costumeColors: string;
  faceCoverage: string;
  superpowerType: string;
  visualTheme: string;
  colorPalette: string;
  powerSignature: string;
  armorStyle: string;
}

interface CharacterResult {
  dna: CharacterDNA | null;
  silhouetteBase64: string | null;
  characterBase64: string | null;
  turnaroundBase64: string | null;
  textureBase64: string | null;
}

type Phase = 'questionnaire' | 'generating' | 'result';

// ── Step status indicator ─────────────────────────────────────────────────────

function StepRow({
  step,
  status,
}: {
  step: (typeof PIPELINE)[number];
  status: StepStatus;
}) {
  const spinAnim = useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    if (status === 'running') {
      Animated.loop(
        Animated.timing(spinAnim, {
          toValue: 1,
          duration: 900,
          useNativeDriver: true,
        })
      ).start();
    } else {
      spinAnim.setValue(0);
    }
  }, [status]);

  const spin = spinAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const iconColor =
    status === 'done'
      ? '#22C55E'
      : status === 'running'
        ? C.yellow
        : status === 'error'
          ? '#EF4444'
          : C.muted;

  return (
    <View
      style={[
        stepStyles.row,
        {
          backgroundColor:
            status === 'running'
              ? C.yellow + '10'
              : status === 'done'
                ? '#22C55E10'
                : C.card,
          borderColor:
            status === 'running'
              ? C.yellow
              : status === 'done'
                ? '#22C55E'
                : C.border,
        },
      ]}
    >
      <View style={stepStyles.iconWrap}>
        {status === 'running' ? (
          <Animated.View style={{ transform: [{ rotate: spin }] }}>
            <Feather name="loader" size={16} color={iconColor} />
          </Animated.View>
        ) : status === 'done' ? (
          <Feather name="check-circle" size={16} color={iconColor} />
        ) : status === 'error' ? (
          <Feather name="x-circle" size={16} color={iconColor} />
        ) : (
          <Feather name="circle" size={16} color={iconColor} />
        )}
      </View>
      <View style={stepStyles.textWrap}>
        <Text
          style={[
            stepStyles.label,
            {
              color:
                status === 'pending' ? C.muted : C.ink,
              fontFamily:
                status === 'running' ? 'Inter_600SemiBold' : 'Inter_400Regular',
            },
          ]}
        >
          {step.label}
        </Text>
        <Text style={[stepStyles.module, { color: C.muted }]}>
          {step.module}
        </Text>
      </View>
      {status === 'done' && (
        <Text style={{ fontSize: 12, color: '#22C55E', fontFamily: 'Inter_600SemiBold' }}>
          DONE
        </Text>
      )}
      {status === 'running' && (
        <Text
          style={{
            fontSize: 11,
            color: C.yellow,
            fontFamily: 'Inter_600SemiBold',
          }}
        >
          …
        </Text>
      )}
    </View>
  );
}

const stepStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 8,
  },
  iconWrap: { width: 24, alignItems: 'center' },
  textWrap: { flex: 1 },
  label: { fontSize: 13, lineHeight: 18 },
  module: { fontSize: 10, fontFamily: 'Inter_400Regular', marginTop: 1 },
});

// ── Image card ────────────────────────────────────────────────────────────────

function ResultImageCard({
  label,
  sublabel,
  imageBase64,
  wide,
  onSave,
}: {
  label: string;
  sublabel: string;
  imageBase64: string;
  wide?: boolean;
  onSave: (base64: string, label: string) => void;
}) {
  return (
    <View
      style={[
        imgStyles.card,
        { borderColor: C.border, backgroundColor: C.card },
        wide && imgStyles.cardWide,
      ]}
    >
      <View style={imgStyles.cardHeader}>
        <View>
          <Text style={[imgStyles.cardLabel, { color: C.ink }]}>
            {label}
          </Text>
          <Text style={[imgStyles.cardSub, { color: C.muted }]}>
            {sublabel}
          </Text>
        </View>
        <TouchableOpacity
          style={[imgStyles.saveBtn, { backgroundColor: C.yellow + '18' }]}
          onPress={() => onSave(imageBase64, label)}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Feather name="download" size={14} color={C.yellow} />
        </TouchableOpacity>
      </View>
      <Image
        source={{ uri: `data:image/png;base64,${imageBase64}` }}
        style={[imgStyles.image, wide && imgStyles.imageWide]}
        resizeMode="contain"
      />
    </View>
  );
}

const imgStyles = StyleSheet.create({
  card: {
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
    marginBottom: 14,
  },
  cardWide: {},
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
  },
  cardLabel: { fontSize: 14, fontFamily: 'Inter_700Bold' },
  cardSub: { fontSize: 11, fontFamily: 'Inter_400Regular', marginTop: 1 },
  saveBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  image: { width: '100%', aspectRatio: 512 / 768, backgroundColor: '#f0f0f0' },
  imageWide: { aspectRatio: 1024 / 512 },
});

// ── Main screen ───────────────────────────────────────────────────────────────

export default function CharacterGenesisScreen() {
  const insets = useSafeAreaInsets();
  const { getToken } = useAuth();

  const [phase, setPhase] = useState<Phase>('questionnaire');
  const [answers, setAnswers] = useState<Answers>({});
  const [stepStatuses, setStepStatuses] = useState<Record<PipelineStepId, StepStatus>>({
    analyze: 'pending',
    silhouette: 'pending',
    character: 'pending',
    turnaround: 'pending',
    texture: 'pending',
  });
  const [result, setResult] = useState<CharacterResult>({
    dna: null,
    silhouetteBase64: null,
    characterBase64: null,
    turnaroundBase64: null,
    textureBase64: null,
  });
  const [genError, setGenError] = useState<string | null>(null);

  const answeredCount = Object.values(answers).filter(Boolean).length;
  const allAnswered = answeredCount === QUESTIONS.length;

  const setStatus = (id: PipelineStepId, status: StepStatus) =>
    setStepStatuses((prev) => ({ ...prev, [id]: status }));

  const [slowWarn, setSlowWarn] = useState(false);

  const callStep = async (
    token: string,
    path: string,
    body: object
  ): Promise<any> => {
    const controller = new AbortController();
    const hardTimeout = setTimeout(() => controller.abort(), 50_000);
    const slowTimer = setTimeout(() => setSlowWarn(true), 20_000);

    let res: Response;
    try {
      res = await fetch(`${API_BASE}/ai-studio/${path}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
        signal: controller.signal,
      });
    } catch (err: any) {
      clearTimeout(hardTimeout);
      clearTimeout(slowTimer);
      setSlowWarn(false);
      if (err?.name === 'AbortError') {
        throw new Error('Image generation timed out — please try again');
      }
      throw err;
    }
    clearTimeout(hardTimeout);
    clearTimeout(slowTimer);
    setSlowWarn(false);

    if (!res.ok) throw new Error(`${path} failed (${res.status})`);
    return res.json();
  };

  const handleGenerate = async () => {
    if (!allAnswered) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    setGenError(null);
    setResult({ dna: null, silhouetteBase64: null, characterBase64: null, turnaroundBase64: null, textureBase64: null });
    setStepStatuses({ analyze: 'running', silhouette: 'pending', character: 'pending', turnaround: 'pending', texture: 'pending' });
    setPhase('generating');

    try {
      const token = await getToken();

      // 1 · Trait Analyzer + DNA Builder
      const { dna } = await callStep(token!, 'character-genesis/analyze', answers);
      setResult((p) => ({ ...p, dna }));
      setStatus('analyze', 'done');
      setStatus('silhouette', 'running');

      // 2 · Silhouette Generator
      const { imageBase64: silB64 } = await callStep(token!, 'character-genesis/silhouette', { dna });
      setResult((p) => ({ ...p, silhouetteBase64: silB64 }));
      setStatus('silhouette', 'done');
      setStatus('character', 'running');

      // 3 · Anatomy Engine + Species Constructor
      const { imageBase64: charB64 } = await callStep(token!, 'character-genesis/character', { dna });
      setResult((p) => ({ ...p, characterBase64: charB64 }));
      setStatus('character', 'done');
      setStatus('turnaround', 'running');

      // 4 · 3D Turnaround Generator
      const { imageBase64: turnB64 } = await callStep(token!, 'character-genesis/turnaround', { dna });
      setResult((p) => ({ ...p, turnaroundBase64: turnB64 }));
      setStatus('turnaround', 'done');
      setStatus('texture', 'running');

      // 5 · Texture + Costume AI
      const { imageBase64: texB64 } = await callStep(token!, 'character-genesis/texture', { dna });
      setResult((p) => ({ ...p, textureBase64: texB64 }));
      setStatus('texture', 'done');

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setPhase('result');
    } catch (err: any) {
      setGenError(err.message ?? 'Generation failed.');
      setStepStatuses((prev) => {
        const updated = { ...prev };
        for (const k of Object.keys(updated) as PipelineStepId[]) {
          if (updated[k] === 'running') updated[k] = 'error';
        }
        return updated;
      });
    }
  };

  const handleSaveImage = async (base64: string, label: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (Platform.OS === 'web') {
      Alert.alert('Save not supported on web');
      return;
    }
    try {
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Allow photo library access to save images.');
        return;
      }
      const uri = FileSystem.cacheDirectory + `character-${Date.now()}.png`;
      await FileSystem.writeAsStringAsync(uri, base64, {
        encoding: FileSystem.EncodingType.Base64,
      });
      const asset = await MediaLibrary.createAssetAsync(uri);
      const albumName = 'Comic Artist Studio';
      const album = await MediaLibrary.getAlbumAsync(albumName);
      if (album == null) {
        await MediaLibrary.createAlbumAsync(albumName, asset, false);
      } else {
        await MediaLibrary.addAssetsToAlbumAsync([asset], album, false);
      }
      Alert.alert('Saved!', `${label} saved to the "${albumName}" album.`);
    } catch (err) {
      console.error('[Character Genesis] Save error:', err);
      Alert.alert('Error', `Could not save image: ${err instanceof Error ? err.message : 'Please try again.'}`);
    }
  };

  const handleShare = async () => {
    if (!result.textureBase64) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      const uri = FileSystem.cacheDirectory + `character-${Date.now()}.png`;
      await FileSystem.writeAsStringAsync(uri, result.textureBase64, {
        encoding: FileSystem.EncodingType.Base64,
      });
      await Sharing.shareAsync(uri, { mimeType: 'image/png' });
    } catch {
      Alert.alert('Error', 'Could not share image.');
    }
  };

  // ExportEngine — share character DNA as structured text
  const handleExportDNA = async () => {
    if (!result.dna) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const { dna } = result;
    const text = [
      `╔══════════════════════════════╗`,
      `  PANELFORGE — CHARACTER DNA`,
      `╚══════════════════════════════╝`,
      ``,
      `NAME          ${dna.name}`,
      `SPECIES       ${dna.species}`,
      `BODY          ${dna.bodyArchetype}`,
      `PERSONALITY   ${dna.personalityProfile}`,
      `COMBAT        ${dna.combatStyle}`,
      `ENVIRONMENT   ${dna.environment}`,
      `ENERGY        ${dna.energySource}`,
      ``,
      `ORIGIN        ${dna.origin}`,
      `COSTUME       ${dna.costumeStyle}`,
      `COLORS        ${dna.costumeColors}`,
      `MASK / FACE   ${dna.faceCoverage}`,
      `SUPERPOWER    ${dna.superpowerType}`,
      `WEAPON        ${dna.signatureWeapon}`,
      `VISUAL THEME  ${dna.visualTheme}`,
      `COLOR PALETTE ${dna.colorPalette}`,
      `POWER         ${dna.powerSignature}`,
      `ARMOR         ${dna.armorStyle}`,
      ``,
      `Generated by PanelForge AI · BloomScript Novels Scripts Comic Production`,
    ].join('\n');
    try {
      const uri = FileSystem.cacheDirectory + `dna-${Date.now()}.txt`;
      await FileSystem.writeAsStringAsync(uri, text, { encoding: FileSystem.EncodingType.UTF8 });
      await Sharing.shareAsync(uri, { mimeType: 'text/plain', dialogTitle: `${dna.name} — Character DNA` });
    } catch {
      Alert.alert('Export Failed', 'Could not export DNA.');
    }
  };

  const handleReset = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setPhase('questionnaire');
    setAnswers({});
    setGenError(null);
  };

  const bottomPad = (Platform.OS === 'web' ? 34 : insets.bottom) + 24;

  // ── QUESTIONNAIRE phase ───────────────────────────────────────────────────

  if (phase === 'questionnaire') {
    return (
      <View style={[styles.root, { backgroundColor: C.bg }]}>
        {/* Header */}
        <View
          style={[
            styles.header,
            {
              backgroundColor: C.bg,
              borderBottomColor: C.border,
              paddingTop: insets.top + 8,
            },
          ]}
        >

          <TouchableOpacity
            onPress={() => router.back()}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Feather name="arrow-left" size={22} color={C.yellow} />
          </TouchableOpacity>
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={[styles.headerTitle, { color: C.ink }]}>
              Character Genesis
            </Text>
            <Text style={[styles.headerSub, { color: C.muted }]}>
              {answeredCount}/{QUESTIONS.length} answered
            </Text>
          </View>
          {/* Progress dots */}
          <View style={{ flexDirection: 'row', gap: 5 }}>
            {QUESTIONS.map((q) => (
              <View
                key={q.id}
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: 4,
                  backgroundColor: answers[q.id] ? C.yellow : C.border,
                }}
              />
            ))}
          </View>
        </View>

        {/* Tablet recommendation banner */}
        <View style={[styles.tabletBanner, { backgroundColor: '#1D4ED820', borderColor: '#1D4ED840' }]}>
          <Feather name="tablet" size={13} color="#1D4ED8" />
          <Text style={[styles.tabletBannerText, { color: '#1D4ED8' }]}>
            Best experienced on iPad & Android Tablet
          </Text>
        </View>

        <ScrollView
          contentContainerStyle={[styles.scroll, { paddingBottom: bottomPad }]}
          showsVerticalScrollIndicator={true}
        >
          {/* Module map label */}
          <View style={[styles.moduleMap, { backgroundColor: C.card, borderColor: C.border }]}>
            <Text style={[styles.moduleMapText, { color: C.muted }]}>
              📦 questionnaire → traits → personality → anatomy → species → mech → silhouette → rotation → textures → rendering → evolution
            </Text>
          </View>

          {QUESTIONS.map((q, qi) => (
            <View key={q.id} style={styles.questionBlock}>
              <Text style={[styles.questionLabel, { color: C.ink }]}>
                <Text style={{ color: C.muted }}>{qi + 1}. </Text>
                {q.emoji} {q.label}
              </Text>
              <View style={styles.optionGrid}>
                {q.options.map((opt) => {
                  const isSelected = answers[q.id] === opt.value;
                  return (
                    <TouchableOpacity
                      key={opt.value}
                      style={[
                        styles.optionCard,
                        {
                          backgroundColor: isSelected
                            ? C.yellow + '14'
                            : C.card,
                          borderColor: isSelected ? C.yellow : C.border,
                          borderWidth: isSelected ? 2 : 1,
                        },
                      ]}
                      onPress={() => {
                        Haptics.selectionAsync();
                        setAnswers((prev) => ({
                          ...prev,
                          [q.id]: isSelected ? undefined : opt.value,
                        }));
                      }}
                      activeOpacity={0.8}
                    >
                      <Text style={styles.optionEmoji}>{opt.emoji}</Text>
                      <Text
                        style={[
                          styles.optionValue,
                          { color: isSelected ? C.yellow : C.ink },
                        ]}
                      >
                        {opt.value}
                      </Text>
                      <Text
                        style={[styles.optionDesc, { color: C.muted }]}
                      >
                        {opt.desc}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          ))}

          <TouchableOpacity
            style={[
              styles.generateBtn,
              {
                backgroundColor: allAnswered ? C.yellow : C.dim,
                opacity: allAnswered ? 1 : 0.6,
              },
            ]}
            onPress={handleGenerate}
            disabled={!allAnswered}
            activeOpacity={0.85}
          >
            <Text style={[styles.generateBtnEmoji]}>⚡</Text>
            <Text style={[styles.generateBtnText, { color: C.bg }]}>
              {allAnswered
                ? 'Build Character'
                : `Answer all ${QUESTIONS.length} questions to continue`}
            </Text>
            <Text style={styles.generateBtnEmoji}>⚡</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    );
  }

  // ── GENERATING phase ──────────────────────────────────────────────────────

  if (phase === 'generating') {
    return (
      <View
        style={[
          styles.root,
          styles.centeredRoot,
          { backgroundColor: C.bg },
        ]}
      >
        <View style={[styles.generatingCard, { backgroundColor: C.card, borderColor: C.border }]}>
          <Text style={[styles.generatingTitle, { color: C.ink }]}>
            Building Your Character
          </Text>
          <Text style={[styles.generatingSubtitle, { color: C.muted }]}>
            Running all 12 pipeline modules…
          </Text>

          <View style={{ marginTop: 20 }}>
            {PIPELINE.map((step) => (
              <StepRow
                key={step.id}
                step={step}
                status={stepStatuses[step.id]}
              />
            ))}
          </View>

          {slowWarn && !genError && (
            <View style={[styles.errorRow, { marginTop: 12, backgroundColor: '#2A2000', borderRadius: 8, padding: 10 }]}>
              <Feather name="clock" size={14} color="#FFD600" />
              <Text style={[styles.errorText, { color: '#FFD600', marginLeft: 6 }]}>
                Taking longer than usual — AI servers are busy. Hang tight…
              </Text>
            </View>
          )}

          {genError && (
            <View style={[styles.errorRow, { marginTop: 12 }]}>
              <Feather name="alert-circle" size={14} color="#EF4444" />
              <Text style={styles.errorText}>{genError}</Text>
            </View>
          )}

          {genError && (
            <TouchableOpacity
              style={[styles.retryBtn, { borderColor: C.yellow }]}
              onPress={handleReset}
              activeOpacity={0.8}
            >
              <Feather name="refresh-cw" size={14} color={C.yellow} />
              <Text style={[styles.retryBtnText, { color: C.yellow }]}>
                Start Over
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  }

  // ── RESULT phase ──────────────────────────────────────────────────────────

  const { dna } = result;

  return (
    <View style={[styles.root, { backgroundColor: C.bg }]}>
      {/* Header */}
      <View
        style={[
          styles.header,
          {
            backgroundColor: C.bg,
            borderBottomColor: C.border,
            paddingTop: insets.top + 8,
          },
        ]}
      >
        <TouchableOpacity
          onPress={handleReset}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Feather name="refresh-cw" size={20} color={C.yellow} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: C.ink, flex: 1, marginLeft: 12 }]}>
          {dna?.name ?? 'Character Generated'}
        </Text>
        {result.textureBase64 && (
          <TouchableOpacity
            style={[styles.shareBtn, { backgroundColor: C.yellow }]}
            onPress={handleShare}
            activeOpacity={0.85}
          >
            <Feather name="share-2" size={14} color={C.bg} />
            <Text style={[styles.shareBtnText, { color: C.bg }]}>
              Share
            </Text>
          </TouchableOpacity>
        )}
      </View>

      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: bottomPad }]}
        showsVerticalScrollIndicator={false}
      >
        {/* DNA Card */}
        {dna && (
          <View
            style={[styles.dnaCard, { backgroundColor: C.card, borderColor: C.border }]}
          >
            <View style={styles.dnaHeader}>
              <Text style={[styles.dnaName, { color: C.ink }]}>{dna.name}</Text>
              <View style={[styles.dnaBadge, { backgroundColor: C.yellow + '18' }]}>
                <Text style={[styles.dnaBadgeText, { color: C.yellow }]}>DNA</Text>
              </View>
            </View>
            <Text style={[styles.dnaTheme, { color: C.yellow }]}>{dna.visualTheme}</Text>
            <View style={styles.dnaGrid}>
              {[
                { label: 'Species', value: dna.species },
                { label: 'Body', value: dna.bodyArchetype },
                { label: 'Personality', value: dna.personalityProfile },
                { label: 'Combat', value: dna.combatStyle },
                { label: 'Energy', value: dna.powerSignature },
                { label: 'Colors', value: dna.colorPalette },
                { label: 'Origin', value: dna.origin },
                { label: 'Costume', value: dna.costumeStyle },
                { label: 'Colors', value: dna.costumeColors },
                { label: 'Mask / Face', value: dna.faceCoverage },
                { label: 'Superpower', value: dna.superpowerType },
                { label: 'Weapon', value: dna.signatureWeapon },
              ].map((item) => (
                <View
                  key={item.label}
                  style={[styles.dnaRow, { borderBottomColor: C.border }]}
                >
                  <Text style={[styles.dnaRowLabel, { color: C.muted }]}>
                    {item.label}
                  </Text>
                  <Text
                    style={[styles.dnaRowValue, { color: C.ink }]}
                    numberOfLines={2}
                  >
                    {item.value}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Images — show as they are available */}
        {result.silhouetteBase64 && (
          <ResultImageCard
            label="Silhouette"
            sublabel="silhouette / anatomy module"
            imageBase64={result.silhouetteBase64}
            onSave={handleSaveImage}
          />
        )}

        {result.characterBase64 && (
          <ResultImageCard
            label="Character — Front View"
            sublabel="anatomy / species module"
            imageBase64={result.characterBase64}
            onSave={handleSaveImage}
          />
        )}

        {result.turnaroundBase64 && (
          <ResultImageCard
            label="3D Turnaround Sheet"
            sublabel="rotation / rendering module"
            imageBase64={result.turnaroundBase64}
            wide
            onSave={handleSaveImage}
          />
        )}

        {result.textureBase64 && (
          <ResultImageCard
            label="Final Render — Texture + Costume"
            sublabel="textures / mech / rendering module"
            imageBase64={result.textureBase64}
            onSave={handleSaveImage}
          />
        )}

        {/* Evolution Engine — regenerate */}
        <View
          style={[
            styles.evolutionCard,
            { backgroundColor: C.card, borderColor: C.border },
          ]}
        >
          <View style={styles.evolutionHeader}>
            <Feather name="refresh-cw" size={16} color={C.yellow} />
            <Text style={[styles.evolutionTitle, { color: C.ink }]}>
              Evolution Engine
            </Text>
          </View>
          <Text style={[styles.evolutionDesc, { color: C.muted }]}>
            Not happy with the results? Run the full pipeline again — the AI uses
            your same DNA profile but generates fresh visual interpretations.
          </Text>
          <View style={styles.evolutionButtons}>
            <TouchableOpacity
              style={[styles.evoBtn, { backgroundColor: C.yellow }]}
              onPress={handleGenerate}
              activeOpacity={0.85}
            >
              <Feather name="zap" size={14} color={C.bg} />
              <Text style={[styles.evoBtnText, { color: C.bg }]}>
                Regenerate All
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.evoBtn, styles.evoBtnOutline, { borderColor: C.border }]}
              onPress={handleReset}
              activeOpacity={0.85}
            >
              <Feather name="edit-3" size={14} color={C.ink} />
              <Text style={[styles.evoBtnText, { color: C.ink }]}>
                New Character
              </Text>
            </TouchableOpacity>
          </View>

          {/* ExportEngine */}
          {result.dna && (
            <TouchableOpacity
              style={[styles.exportBtn, { backgroundColor: C.bg, borderColor: C.border }]}
              onPress={handleExportDNA}
              activeOpacity={0.8}
            >
              <Feather name="file-text" size={13} color={C.muted} />
              <Text style={[styles.exportBtnText, { color: C.muted }]}>Export DNA as Text</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* ── Face Lab entry ───────────────────────────────────────────── */}
        <TouchableOpacity
          style={[styles.faceLabCard, { backgroundColor: C.card, borderColor: C.yellow + '40' }]}
          onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); router.push('/(tabs)/character-face-lab' as never); }}
          activeOpacity={0.85}
        >
          <View style={[styles.faceLabIconWrap, { backgroundColor: C.yellow + '15' }]}>
            <Text style={{ fontSize: 22 }}>🫀</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.faceLabTitle, { color: C.yellow }]}>FACE LAB</Text>
            <Text style={[styles.faceLabDesc, { color: C.muted }]}>
              Face Shape · Archetype · Age System · Live Feature Analyzer · Continuity Signature · AI Prompt Builder
            </Text>
          </View>
          <Feather name="chevron-right" size={16} color={C.yellow} />
        </TouchableOpacity>

        {/* FutureModules */}
        <View style={[styles.futureCard, { backgroundColor: C.card, borderColor: C.border }]}>
          <View style={styles.futureHeader}>
            <Feather name="cpu" size={15} color={C.yellow} />
            <Text style={[styles.futureTitle, { color: C.ink }]}>Future AI Modules</Text>
          </View>
          <Text style={[styles.futureSubtitle, { color: C.muted }]}>
            Modules currently in development — coming to PanelForge soon.
          </Text>
          {[
            { emoji: '🖊️', name: 'Auto Inking Engine',       desc: 'AI linework refinement and inking pass' },
            { emoji: '🎨', name: 'AI Coloring Engine',        desc: 'Automatic flat + rendering color fills' },
            { emoji: '🎙️', name: 'Voice Generation',          desc: 'Character voice synthesis from DNA profile' },
            { emoji: '🎬', name: 'Animation System',          desc: '2D frame-by-frame motion from still panels' },
            { emoji: '🧬', name: 'Procedural Creatures',      desc: 'Generative alien anatomy from rules' },
            { emoji: '⚡', name: 'Manga FX Engine',           desc: 'Speed lines, impact frames, screen tones' },
          ].map((mod) => (
            <View
              key={mod.name}
              style={[styles.futureModule, { backgroundColor: C.bg, borderColor: C.border }]}
            >
              <Text style={styles.futureModuleEmoji}>{mod.emoji}</Text>
              <View style={{ flex: 1 }}>
                <Text style={[styles.futureModuleName, { color: C.ink }]}>{mod.name}</Text>
                <Text style={[styles.futureModuleDesc, { color: C.muted }]}>{mod.desc}</Text>
              </View>
              <View style={[styles.comingSoonBadge, { backgroundColor: C.yellow + '15' }]}>
                <Text style={[styles.comingSoonText, { color: C.yellow }]}>Soon</Text>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: { flex: 1 },
  centeredRoot: { alignItems: 'center', justifyContent: 'center', padding: 20 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerTitle: { fontSize: 17, fontFamily: 'Inter_700Bold' },
  headerSub: { fontSize: 12, fontFamily: 'Inter_400Regular', marginTop: 1 },
  scroll: { padding: 16 },
  // Tablet banner
  tabletBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
  },
  tabletBannerText: { fontSize: 12, fontFamily: 'Inter_600SemiBold' },
  // Module map
  moduleMap: {
    borderRadius: 8,
    borderWidth: 1,
    padding: 10,
    marginBottom: 20,
  },
  moduleMapText: {
    fontSize: 10,
    fontFamily: 'Inter_400Regular',
    lineHeight: 15,
  },
  // Questions
  questionBlock: { marginBottom: 24 },
  questionLabel: {
    fontSize: 16,
    fontFamily: 'Inter_700Bold',
    marginBottom: 12,
  },
  optionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  optionCard: {
    width: '47%',
    borderRadius: 10,
    padding: 12,
    alignItems: 'center',
    gap: 4,
  },
  optionEmoji: { fontSize: 26 },
  optionValue: { fontSize: 14, fontFamily: 'Inter_700Bold', textAlign: 'center' },
  optionDesc: { fontSize: 11, fontFamily: 'Inter_400Regular', textAlign: 'center' },
  // Generate button
  generateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 16,
    borderRadius: 12,
    marginTop: 8,
  },
  generateBtnEmoji: { fontSize: 18 },
  generateBtnText: { fontSize: 16, fontFamily: 'Inter_700Bold' },
  // Generating card
  generatingCard: {
    width: '100%',
    maxWidth: 420,
    borderRadius: 16,
    borderWidth: 1,
    padding: 20,
  },
  generatingTitle: { fontSize: 20, fontFamily: 'Inter_700Bold', textAlign: 'center' },
  generatingSubtitle: {
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    textAlign: 'center',
    marginTop: 4,
  },
  errorRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  errorText: { fontSize: 13, fontFamily: 'Inter_400Regular', color: '#EF4444', flex: 1 },
  retryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    justifyContent: 'center',
    borderWidth: 1,
    borderRadius: 8,
    padding: 10,
    marginTop: 12,
  },
  retryBtnText: { fontSize: 14, fontFamily: 'Inter_600SemiBold' },
  // Result header
  shareBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
  },
  shareBtnText: { fontSize: 13, fontFamily: 'Inter_600SemiBold' },
  // DNA Card
  dnaCard: { borderRadius: 12, borderWidth: 1, padding: 16, marginBottom: 16 },
  dnaHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 },
  dnaName: { fontSize: 20, fontFamily: 'Inter_700Bold' },
  dnaBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  dnaBadgeText: { fontSize: 11, fontFamily: 'Inter_700Bold', letterSpacing: 1 },
  dnaTheme: { fontSize: 13, fontFamily: 'Inter_600SemiBold', marginBottom: 12 },
  dnaGrid: {},
  dnaRow: {
    flexDirection: 'row',
    gap: 8,
    paddingVertical: 7,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  dnaRowLabel: { fontSize: 12, fontFamily: 'Inter_600SemiBold', width: 80 },
  dnaRowValue: { fontSize: 12, fontFamily: 'Inter_400Regular', flex: 1, lineHeight: 17 },
  // Evolution Engine
  evolutionCard: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
    marginTop: 4,
  },
  evolutionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  evolutionTitle: { fontSize: 15, fontFamily: 'Inter_700Bold' },
  evolutionDesc: { fontSize: 13, fontFamily: 'Inter_400Regular', lineHeight: 19, marginBottom: 14 },
  evolutionButtons: { flexDirection: 'row', gap: 10 },
  evoBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    padding: 11,
    borderRadius: 8,
  },
  evoBtnOutline: { borderWidth: 1 },
  evoBtnText: { fontSize: 13, fontFamily: 'Inter_600SemiBold' },
  // ExportEngine
  exportBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    marginTop: 10,
  },
  exportBtnText: { fontSize: 12, fontFamily: 'Inter_400Regular' },
  // FutureModules
  futureCard: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
    marginTop: 14,
    gap: 12,
  },
  futureHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  futureTitle: { fontSize: 15, fontFamily: 'Inter_700Bold' },
  futureSubtitle: { fontSize: 12, fontFamily: 'Inter_400Regular', lineHeight: 17, marginTop: -4 },
  futureModule: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
  },
  futureModuleEmoji: { fontSize: 20, width: 26, textAlign: 'center' },
  futureModuleName: { fontSize: 13, fontFamily: 'Inter_600SemiBold' },
  futureModuleDesc: { fontSize: 11, fontFamily: 'Inter_400Regular', marginTop: 1 },
  comingSoonBadge: { paddingHorizontal: 7, paddingVertical: 3, borderRadius: 6 },
  comingSoonText: { fontSize: 10, fontFamily: 'Inter_700Bold', letterSpacing: 0.5 },
  // Face Lab entry card
  faceLabCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    borderRadius: 14, borderWidth: 1.5,
    padding: 14, marginTop: 14,
  },
  faceLabIconWrap: {
    width: 44, height: 44, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center',
  },
  faceLabTitle: { fontFamily: 'Inter_700Bold', fontSize: 13, letterSpacing: 1, marginBottom: 3 },
  faceLabDesc:  { fontFamily: 'Inter_400Regular', fontSize: 11, lineHeight: 16 },
});
