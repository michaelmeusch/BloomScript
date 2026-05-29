import { Feather } from '@expo/vector-icons';
import { useAuth } from '@clerk/expo';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import { API_BASE } from '@/constants/api';
import { useCinematicInsets, useCinematicDevice } from '@/hooks/useCinematicDevice';

// ── COMIC palette ─────────────────────────────────────────────────────────────
const C = {
  bg: '#0E0C0A', card: '#181410', card2: '#201A14', border: '#2E2618',
  yellow: '#FFD600', red: '#E8001C', blue: '#0057A8', green: '#2A7A3A',
  ink: '#F0EAD8', muted: '#7A6A58', dim: '#3A3028',
};

// ── Wally Wood scene presets ──────────────────────────────────────────────────
// Inspired by Wally Wood's legendary "22 Panels That Always Work" reference
// sheet — compositional techniques every comics artist should know.
// Each preset wires a camera angle and effect directly into the prompt so
// the AI immediately applies the right visual grammar.

interface WallyWoodPreset {
  name: string;
  description: string;
  scene: string;
  style: ComicStyleId;
  emoji: string;
  techniqueId?: string;
}

const WALLY_WOOD_PRESETS: WallyWoodPreset[] = [
  {
    name: 'Big Head',
    description: 'Emotion fills the frame',
    emoji: '😤',
    style: 'frank_miller',
    techniqueId: 'BIG_HEAD',
    scene: 'A face fills the entire panel — every expression line, every flicker of emotion raw and exposed. Tension in the eyes, jaw set, the ghost of a scar. Nothing hidden, nowhere to hide. The background bleeds into absolute darkness behind.',
  },
  {
    name: 'Extreme Close-Up',
    description: 'Hyper-detail, single feature',
    emoji: '👁️',
    style: 'chris_samnee',
    techniqueId: 'EXTREME_CLOSEUP',
    scene: 'An eye — enormous, lone, searching — stares from the panel. The pupil is dilated with shock. A single tear forming at the lower lid. Every capillary, every eyelash rendered with hyper-clarity. Extreme macro intimacy, nothing else exists.',
  },
  {
    name: 'Back of Head',
    description: 'Shared tension, unknown ahead',
    emoji: '🔭',
    style: 'ligne_claire',
    techniqueId: 'BACK_OF_HEAD',
    scene: 'A lone figure faces away from us, watching something we cannot yet see. Their posture telegraphs everything — tense shoulders, fists clenched, weight shifting forward. The unknown lies before them and we share their dread. Clean, simple background.',
  },
  {
    name: 'Profile',
    description: 'Pure silhouette strength',
    emoji: '🎭',
    style: 'golden_age',
    techniqueId: 'PROFILE',
    scene: 'A sharp side-view profile cuts the character against a high-contrast background. The clean line of their jaw, focused gaze directed off-frame, every muscle telegraphing intent. Authoritative. Classic. The pure power of a perfect profile.',
  },
  {
    name: 'No Background',
    description: 'Character alone on white',
    emoji: '⬜',
    style: 'manga_superhero',
    techniqueId: 'NO_BACKGROUND',
    scene: 'The character floats against pure white emptiness. No context, no world — just the raw undiluted force of their form and expression. Isolated. Every line deliberate. The absence of environment forces the figure to carry everything.',
  },
  {
    name: 'White Background',
    description: 'Stark void amplifies action',
    emoji: '🤍',
    style: 'chris_samnee',
    techniqueId: 'WHITE_BACKGROUND',
    scene: 'Characters and objects play out in a void of stark white. No environment — the action itself is everything. Figures pop with striking clarity against the emptiness. The white space presses in. What is shown becomes absolute.',
  },
  {
    name: 'Open Panel',
    description: 'Action bursts beyond borders',
    emoji: '🖼️',
    style: 'kirby_classic',
    techniqueId: 'OPEN_PANEL',
    scene: 'The image bursts past its panel borders in every direction, bleeding to the edges of the page. An explosion, a charge, a shockwave — too vast, too fast to be contained. The frame cannot hold it back. Pure unrestrained scale.',
  },
  {
    name: 'All Black',
    description: 'Darkness reveals only what matters',
    emoji: '⬛',
    style: 'frank_miller',
    techniqueId: 'ALL_BLACK',
    scene: 'Darkness dominates 90% of the panel. A single shaft of harsh light cuts through and reveals only what must be seen — a hand reaching, a face half-lit, the glint of a blade. What remains in shadow is more terrifying than what is shown.',
  },
  {
    name: 'One Big Object',
    description: 'Scale through foreground prop',
    emoji: '🔫',
    style: 'ligne_claire',
    techniqueId: 'ONE_BIG_OBJECT',
    scene: 'A single enormous prop dominates the foreground — a massive weapon, a colossal door, ancient towering machinery. Small human figures interact with it in the background. Scale becomes the storytelling device. The object owns the panel.',
  },
  {
    name: 'Full Figure',
    description: 'Head-to-toe authority pose',
    emoji: '🧍',
    style: 'kirby_classic',
    techniqueId: 'FULL_FIGURE',
    scene: 'A character stands head-to-toe, their entire body visible from crown to boot. Costume, posture, proportion — everything about who they are stated in one authoritative full-body pose. The viewer reads their whole story in a glance.',
  },
  {
    name: 'Reverse Silhouette',
    description: 'Dark figure, blazing backlight',
    emoji: '🌅',
    style: 'kirby_classic',
    techniqueId: 'REVERSE_SILHOUETTE',
    scene: 'A dark figure stands against blazing backlight — an explosion, a setting sun, a searchlight. The silhouette alone tells us who they are and what they represent. Power distilled to pure shape. The light behind them is almost divine.',
  },
  {
    name: 'Small Figure',
    description: 'Human dwarfed by environment',
    emoji: '🔬',
    style: 'bande_dessinee',
    techniqueId: 'SMALL_FIGURE',
    scene: 'A tiny human figure stands at the base of an immense, indifferent landscape — sheer canyon walls, towering megastructures, endless star-filled void. The world does not notice them. Overwhelmed by scale. Magnificently alone.',
  },
  {
    name: 'Depth Shot',
    description: 'Three living depth planes',
    emoji: '🌄',
    style: 'ligne_claire',
    techniqueId: 'DEPTH_SHOT',
    scene: 'Three distinct planes of depth pull the eye through the image: a sharp foreground figure, action unfolding in the midground, and a detailed environment stretching into the deep background. All three planes alive simultaneously.',
  },
  {
    name: 'Down Shot',
    description: "Bird's-eye exposes vulnerability",
    emoji: '⬇️',
    style: 'manga_superhero',
    techniqueId: 'DOWN_SHOT',
    scene: "The camera looks straight down from above onto the scene. Characters become small, exposed, observed from on high. The bird's-eye view strips away heroism and reveals the truth of their position — tiny in a vast, indifferent world.",
  },
  {
    name: 'Cast Shadows',
    description: 'Shadow as character',
    emoji: '🌑',
    style: 'frank_miller',
    techniqueId: 'CAST_SHADOWS',
    scene: 'Hard directional light throws dramatic shadows across faces, walls, and floors. The shadow itself becomes a second character — stretched, distorted, revealing what the illuminated face tries to conceal. The light lies. The shadow tells the truth.',
  },
  {
    name: 'L-Shape Silhouette',
    description: 'Shadow corridor, forced focus',
    emoji: '📐',
    style: 'frank_miller',
    techniqueId: 'L_SHAPE_SILHOUETTE',
    scene: 'Dark shadow masses form a heavy L-shape along two panel edges — floor and wall, or two sides of the frame. The darkness creates a corridor of negative space that forces the eye inescapably to the focal point. Claustrophobic geometry.',
  },
  {
    name: 'Diagonal Eye Level',
    description: 'Dutch tilt — world off balance',
    emoji: '↗️',
    style: 'manga_superhero',
    techniqueId: 'DIAGONAL_EYE_LEVEL',
    scene: 'The horizon tilts at a sharp 30–45 degree angle. Everything feels kinetically wrong, unstable, on the verge of collapse. The world itself is failing. Dutch tilt at its most expressive — the visual equivalent of a mind fracturing.',
  },
  {
    name: 'Side Light',
    description: 'Chiaroscuro — half truth, half shadow',
    emoji: '💡',
    style: 'golden_age',
    techniqueId: 'SIDE_LIGHT',
    scene: 'A single light source rakes from one side, carving the figure in half — one side brilliant and exposed, one side consumed by shadow. Baroque chiaroscuro in a single panel. Half truth, half mystery. No middle ground exists.',
  },
  {
    name: 'Reflection',
    description: 'Mirror reveals what we avoid',
    emoji: '🪞',
    style: 'chris_samnee',
    techniqueId: 'REFLECTION',
    scene: "A character's face stares back from a reflective surface — a cracked mirror, a dark rain puddle, the polished barrel of a gun. The reflection is subtly wrong. It reveals what the figure cannot face directly about themselves.",
  },
  {
    name: 'Window Frame',
    description: 'Observer, not participant',
    emoji: '🪟',
    style: 'ligne_claire',
    techniqueId: 'WINDOW_FRAME',
    scene: 'The scene is observed through an architectural frame — a window, a doorway, an archway between ruined columns. We are witnesses looking in, not participants. The frame creates moral distance. We cannot intervene. We can only watch.',
  },
  {
    name: '3-Stage Depth',
    description: 'Cinematic foreground, mid, far',
    emoji: '🎬',
    style: 'bande_dessinee',
    techniqueId: 'THREE_STAGE_DEPTH',
    scene: 'Extreme foreground object fills one edge, action unfolds in the midrange, and a vast detailed environment stretches into the deep background. All three stages alive, distinct, and narratively active. The panel breathes like cinema.',
  },
  {
    name: 'High Contrast',
    description: 'No grey — only absolute light and dark',
    emoji: '🎨',
    style: 'silver_age',
    techniqueId: 'HIGH_CONTRAST',
    scene: 'Pure blacks slam against pure whites. No grey, no nuance, no compromise. The starkest possible visual statement — bold Kirby-style line work, cosmic energy crackling, figures burning with silver-age heroism. Moral clarity made visible.',
  },
];

const COMIC_STYLES = [
  // ── Golden & Silver Age ──────────────────────────────────────────────────
  {
    id: 'golden_age',
    label: 'Golden Age',
    emoji: '🏅',
    desc: '1940s–50s: halftone dots, flat primaries, bold outlines — Joe Shuster / Bob Kane era',
  },
  {
    id: 'kirby_classic',
    label: 'Kirby Classic',
    emoji: '💫',
    desc: 'Jack Kirby: Kirby Krackle energy dots, cosmic scope, blocky power — FF / New Gods / Captain America',
  },
  {
    id: 'silver_age',
    label: 'Silver Age',
    emoji: '🌟',
    desc: 'Romita Sr. / Curt Swan: clean romance, newsprint warmth, optimistic heroism — 1960s classic comics',
  },
  {
    id: 'ditko_angular',
    label: 'Ditko',
    emoji: '🕸️',
    desc: 'Steve Ditko: angular webs, surreal geometric backgrounds, existential tension — Spider-Man / Dr. Strange',
  },
  // ── Bronze Age ───────────────────────────────────────────────────────────
  {
    id: 'neal_adams',
    label: 'Neal Adams',
    emoji: '🦅',
    desc: 'Realistic anatomy, dramatic perspective, intense lighting — Green Lantern / Batman / X-Men',
  },
  {
    id: 'george_perez',
    label: 'George Pérez',
    emoji: '📐',
    desc: 'Ultra-dense linework, intricate crowd scenes, architectural detail — Crisis on Infinite Earths / Teen Titans',
  },
  {
    id: 'walt_simonson',
    label: 'Walt Simonson',
    emoji: '⚡',
    desc: 'Angular energy, runic weight, explosive force lines — Thor / Manhunter / Orion',
  },
  {
    id: 'bernie_wrightson',
    label: 'Wrightson',
    emoji: '🕯️',
    desc: 'Gothic crosshatching, fine pen detail, horror atmosphere — Swamp Thing / Frankenstein / House of Mystery',
  },
  {
    id: 'john_byrne',
    label: 'John Byrne',
    emoji: '🔵',
    desc: 'Clean classic superhero, strong storytelling, solid anatomy — Uncanny X-Men / Fantastic Four / Superman',
  },
  // ── Dark Age / Graphic Novel ─────────────────────────────────────────────
  {
    id: 'frank_miller',
    label: 'Frank Miller',
    emoji: '🌑',
    desc: 'Noir: brutal shadow masses, silhouette focus, hard-boiled ink — Dark Knight Returns / Sin City / Daredevil',
  },
  {
    id: 'bill_sienkiewicz',
    label: 'Sienkiewicz',
    emoji: '🎭',
    desc: 'Expressionist mixed-media, painterly abstraction, collage — New Mutants / Elektra Assassin / Moon Knight',
  },
  {
    id: 'dave_mckean',
    label: 'Dave McKean',
    emoji: '🖼️',
    desc: 'Dark painted, photo collage, distorted realism — Arkham Asylum / Sandman covers',
  },
  // ── 90s Image / Action Comics ────────────────────────────────────────────
  {
    id: 'jim_lee',
    label: 'Jim Lee',
    emoji: '💪',
    desc: 'Hyper-muscular anatomy, dense crosshatching, dynamic splash — X-Men / WildCATS / Batman: Hush',
  },
  {
    id: 'todd_mcfarlane',
    label: 'McFarlane',
    emoji: '🕷️',
    desc: 'Organic webs & capes, ultra-detailed linework, kinetic chaos — Spider-Man / Spawn',
  },
  {
    id: 'mike_mignola',
    label: 'Mike Mignola',
    emoji: '🔴',
    desc: 'Heavy black masses, geometric shadow, minimal flat color — Hellboy / BPRD / horror atmospheric',
  },
  // ── Painted & Prestige ───────────────────────────────────────────────────
  {
    id: 'alex_ross',
    label: 'Alex Ross',
    emoji: '🎨',
    desc: 'Photorealistic oil painting, museum-quality figures, heroic grandeur — classic prestige graphic novels',
  },
  {
    id: 'alex_maleev',
    label: 'Alex Maleev',
    emoji: '📷',
    desc: 'Gritty photo-reference painting, moody street-level realism — Daredevil / Spider-Woman',
  },
  // ── Contemporary ─────────────────────────────────────────────────────────
  {
    id: 'jock_noir',
    label: 'Jock',
    emoji: '🦇',
    desc: 'Angular scratchy linework, stark contrast, dread atmosphere — Batman Black Mirror / Wytches / The Losers',
  },
  {
    id: 'chris_samnee',
    label: 'Chris Samnee',
    emoji: '◼',
    desc: 'Bold silhouettes, graphic shape language, minimal line — Daredevil Man Without Fear / Black Widow',
  },
  {
    id: 'mike_allred',
    label: 'Mike Allred',
    emoji: '🌈',
    desc: 'Retro pop art, Silver Age pastiche, vibrant flat color — Madman / Silver Surfer / iZombie',
  },
  {
    id: 'sean_murphy',
    label: 'Sean Murphy',
    emoji: '⚙️',
    desc: 'Dense mechanical detail, architectural environments — Batman White Knight / Tokyo Ghost / Punk Rock Jesus',
  },
  {
    id: 'francavilla_pulp',
    label: 'Francavilla',
    emoji: '🟠',
    desc: 'Retro noir pulp, limited warm palette, strong silhouettes — Batman / Black Beetle / Afterlife with Archie',
  },
  // ── Manga & European ─────────────────────────────────────────────────────
  {
    id: 'manga_superhero',
    label: 'Manga Superhero',
    emoji: '🇯🇵',
    desc: 'Anime-influenced American comics — fusion style, speed lines, expressive eyes',
  },
  {
    id: 'ligne_claire',
    label: 'Ligne Claire',
    emoji: '🔲',
    desc: 'Moebius/Tintin: clean uniform contours, flat color, zero shadow — European clarity',
  },
  {
    id: 'bande_dessinee',
    label: 'Bande Dessinée',
    emoji: '🚀',
    desc: 'Métal Hurlant: Moebius/Druillet airbrush sci-fi, lush European graphic novel tradition',
  },
  {
    id: 'underground',
    label: 'Underground',
    emoji: '✊',
    desc: 'Zap Comix, R. Crumb crosshatching, raw expressive line — countercultural & indie',
  },
  {
    id: 'ukiyo_e',
    label: 'Ukiyo-e',
    emoji: '🌊',
    desc: 'Japanese woodblock tradition: flat fill, contour line, decorative pattern',
  },
] as const;

type ComicStyleId = (typeof COMIC_STYLES)[number]['id'];

// ── Page Layout Types (inspired by the 9-type panel layout reference) ─────────
const PAGE_LAYOUTS = [
  {
    id: 'pure_grid',
    label: 'Pure Grid',
    emoji: '⊞',
    desc: 'Equal-size panels in a regular grid — classic, balanced pacing',
    promptFrag: 'classic equal-panel grid layout, uniform gutters, balanced page flow,',
  },
  {
    id: 'vertical_stagger',
    label: 'Vertical Stagger',
    emoji: '↕',
    desc: 'Panels of varying heights — creates visual rhythm',
    promptFrag: 'vertically staggered panels of varying heights, dynamic page rhythm,',
  },
  {
    id: 'horizontal_stagger',
    label: 'Horizontal Stagger',
    emoji: '↔',
    desc: 'Panels of varying widths for cinematic flow',
    promptFrag: 'horizontally staggered panels of varying widths, cinematic widescreen flow,',
  },
  {
    id: 'blockage',
    label: 'Blockage',
    emoji: '▣',
    desc: 'One dominant panel interrupts and blocks the layout',
    promptFrag: 'dominant blockage panel interrupting the page flow, visual hierarchy focal point,',
  },
  {
    id: 'whole_row',
    label: 'Whole Row',
    emoji: '▬',
    desc: 'A full-width panel for maximum impact',
    promptFrag: 'full-width splash row panel spanning the entire page width, cinematic panoramic,',
  },
  {
    id: 'inset',
    label: 'Inset',
    emoji: '◫',
    desc: 'Small panel inset inside a larger panel',
    promptFrag: 'inset micro-panel nested inside the main panel, layered panel-within-panel depth,',
  },
  {
    id: 'separation',
    label: 'Separation',
    emoji: '⊠',
    desc: 'Dramatic gutters separating panels for tension',
    promptFrag: 'wide gutter separation between panels, dramatic visual pause and breathing room,',
  },
  {
    id: 'overlap',
    label: 'Overlap',
    emoji: '⧉',
    desc: 'Panels overlap at borders for energy and urgency',
    promptFrag: 'overlapping panel borders creating visual energy, kinetic panel collision,',
  },
  {
    id: 'bleed',
    label: 'Bleed',
    emoji: '⬔',
    desc: 'Image bleeds off the page edge — no border, full immersion',
    promptFrag: 'full bleed panel bleeding off page edges, no border, total visual immersion,',
  },
] as const;

type PageLayoutId = (typeof PAGE_LAYOUTS)[number]['id'];

// ── Sketch Stage (Rough Sketch → Sketch → Line Art) ───────────────────────────
const SKETCH_STAGES = [
  {
    id: 'rough_sketch',
    label: 'Rough Sketch',
    emoji: '✏️',
    desc: 'Loose gestural underdrawing, construction lines visible',
    promptFrag: 'rough gestural pencil sketch style, construction lines visible, loose underdrawing,',
  },
  {
    id: 'sketch',
    label: 'Sketch',
    emoji: '📐',
    desc: 'Refined lines, details emerging, clean structure',
    promptFrag: 'refined pencil sketch style, clean confident lines, details emerging, no ink yet,',
  },
  {
    id: 'line_art',
    label: 'Line Art',
    emoji: '🖊️',
    desc: 'Final inking — crisp bold outlines, ready to colour',
    promptFrag: 'final black ink line art, crisp bold outlines, cel-shading ready, professional inking,',
  },
] as const;

type SketchStageId = (typeof SKETCH_STAGES)[number]['id'];

// ── Wally Wood's 22 Panels That Always Work ───────────────────────────────────
const WALLY_WOOD_PANEL_TYPES = [
  { id: 'BIG_HEAD',           label: 'Big Head',            emoji: '😤' },
  { id: 'EXTREME_CLOSEUP',    label: 'Extreme Close-up',    emoji: '👁️' },
  { id: 'BACK_OF_HEAD',       label: 'Back of Head',        emoji: '🔭' },
  { id: 'PROFILE',            label: 'Profile',             emoji: '🎭' },
  { id: 'NO_BACKGROUND',      label: 'No Background',       emoji: '⬜' },
  { id: 'WHITE_BACKGROUND',   label: 'White BG',            emoji: '🤍' },
  { id: 'OPEN_PANEL',         label: 'Open Panel',          emoji: '🖼️' },
  { id: 'ALL_BLACK',          label: 'All Black',           emoji: '⬛' },
  { id: 'ONE_BIG_OBJECT',     label: 'One Big Object',      emoji: '🔫' },
  { id: 'FULL_FIGURE',        label: 'Full Figure',         emoji: '🧍' },
  { id: 'REVERSE_SILHOUETTE', label: 'Reverse Silhouette',  emoji: '🌅' },
  { id: 'SMALL_FIGURE',       label: 'Small Figure',        emoji: '🔬' },
  { id: 'DEPTH_SHOT',         label: 'Depth Shot',          emoji: '🌄' },
  { id: 'DOWN_SHOT',          label: 'Down Shot',           emoji: '⬇️' },
  { id: 'CAST_SHADOWS',       label: 'Cast Shadows',        emoji: '🌑' },
  { id: 'L_SHAPE_SILHOUETTE', label: 'L-Shape Shadow',      emoji: '📐' },
  { id: 'DIAGONAL_EYE_LEVEL', label: 'Diagonal Eye Level',  emoji: '↗️' },
  { id: 'SIDE_LIGHT',         label: 'Side Light',          emoji: '💡' },
  { id: 'REFLECTION',         label: 'Reflection',          emoji: '🪞' },
  { id: 'WINDOW_FRAME',       label: 'Window Frame',        emoji: '🪟' },
  { id: 'THREE_STAGE_DEPTH',  label: '3-Stage Depth',       emoji: '🎬' },
  { id: 'HIGH_CONTRAST',      label: 'High Contrast',       emoji: '🎨' },
] as const;

type WallyWoodPanelTypeId = (typeof WALLY_WOOD_PANEL_TYPES)[number]['id'];

interface PanelResult {
  imageBase64: string;
  cameraAngle: string;
  perspective: string;
  composition: string;
  poseStyle: string;
  hasMotionLines: boolean;
  bubbleZone: string;
  eyeFlow: number;
  depth: number;
}

// ── PanelForge Engine Types ──────────────────────────────────────────────────

interface LocalModelWeights {
  silhouetteBoost: number;
  poseBoost: number;
  readabilityAvg: number;
  poseQualityAvg: number;
  totalSamples: number;
}

interface CustomPreset {
  id: string;
  name: string;
  emoji: string;
  scene: string;
  style: ComicStyleId;
  panelType: WallyWoodPanelTypeId | null;
  createdAt: number;
}

interface RecentScene {
  scene: string;
  style: ComicStyleId;
  timestamp: number;
}

type QuizAnswers = { sceneType?: string; camera?: string; energy?: string };

// ── MiniLayoutDiagram ─────────────────────────────────────────────────────────
// Renders a tiny SVG-style React Native View diagram for each layout type.
function MiniLayoutDiagram({ id, accent }: { id: string; accent: string }) {
  const b = accent;   // border/fill colour
  const bg = 'transparent';
  const t = { borderColor: b, borderWidth: 1, backgroundColor: bg } as const;
  const filled = { backgroundColor: b + '40', borderColor: b, borderWidth: 1 } as const;

  const shared: Record<string, React.ReactElement> = {
    pure_grid: (
      <View style={{ flex: 1, gap: 2 }}>
        <View style={{ flex: 1, flexDirection: 'row', gap: 2 }}>
          <View style={[{ flex: 1, borderRadius: 1 }, t]} />
          <View style={[{ flex: 1, borderRadius: 1 }, t]} />
        </View>
        <View style={{ flex: 1, flexDirection: 'row', gap: 2 }}>
          <View style={[{ flex: 1, borderRadius: 1 }, t]} />
          <View style={[{ flex: 1, borderRadius: 1 }, t]} />
        </View>
      </View>
    ),
    vertical_stagger: (
      <View style={{ flex: 1, flexDirection: 'row', gap: 2 }}>
        <View style={{ flex: 1, gap: 2 }}>
          <View style={[{ flex: 1.2, borderRadius: 1 }, t]} />
          <View style={[{ flex: 0.8, borderRadius: 1 }, t]} />
          <View style={[{ flex: 1.0, borderRadius: 1 }, t]} />
        </View>
        <View style={{ flex: 1, gap: 2 }}>
          <View style={[{ flex: 2, borderRadius: 1 }, t]} />
          <View style={[{ flex: 1, borderRadius: 1 }, t]} />
        </View>
      </View>
    ),
    horizontal_stagger: (
      <View style={{ flex: 1, gap: 2 }}>
        <View style={[{ flex: 1, borderRadius: 1 }, t]} />
        <View style={{ flex: 1, flexDirection: 'row', gap: 2 }}>
          <View style={[{ flex: 1.6, borderRadius: 1 }, t]} />
          <View style={[{ flex: 1, borderRadius: 1 }, t]} />
        </View>
        <View style={{ flex: 1, flexDirection: 'row', gap: 2 }}>
          <View style={[{ flex: 1, borderRadius: 1 }, t]} />
          <View style={[{ flex: 1.6, borderRadius: 1 }, t]} />
        </View>
      </View>
    ),
    blockage: (
      <View style={{ flex: 1, gap: 2 }}>
        <View style={{ flex: 1, flexDirection: 'row', gap: 2 }}>
          <View style={[{ flex: 1, borderRadius: 1 }, t]} />
          <View style={[{ flex: 1, borderRadius: 1 }, t]} />
        </View>
        <View style={[{ flex: 1.4, borderRadius: 1 }, filled]} />
        <View style={{ flex: 1, flexDirection: 'row', gap: 2 }}>
          <View style={[{ flex: 1, borderRadius: 1 }, t]} />
          <View style={[{ flex: 1, borderRadius: 1 }, t]} />
        </View>
      </View>
    ),
    whole_row: (
      <View style={{ flex: 1, gap: 2 }}>
        <View style={{ flex: 1, flexDirection: 'row', gap: 2 }}>
          <View style={[{ flex: 1, borderRadius: 1 }, t]} />
          <View style={[{ flex: 1, borderRadius: 1 }, t]} />
        </View>
        <View style={[{ flex: 1.4, borderRadius: 1 }, filled]} />
        <View style={{ flex: 1, flexDirection: 'row', gap: 2 }}>
          <View style={[{ flex: 1, borderRadius: 1 }, t]} />
          <View style={[{ flex: 1, borderRadius: 1 }, t]} />
        </View>
      </View>
    ),
    inset: (
      <View style={{ flex: 1 }}>
        <View style={[{ flex: 1, borderRadius: 1, padding: 4 }, t]}>
          <View style={[{ position: 'absolute', bottom: 4, right: 4, width: 18, height: 14, borderRadius: 1 }, filled]} />
        </View>
      </View>
    ),
    separation: (
      <View style={{ flex: 1, flexDirection: 'row', gap: 6 }}>
        <View style={{ flex: 1, gap: 2 }}>
          <View style={[{ flex: 1, borderRadius: 1 }, t]} />
          <View style={[{ flex: 1, borderRadius: 1 }, t]} />
        </View>
        <View style={{ flex: 1, gap: 2 }}>
          <View style={[{ flex: 1, borderRadius: 1 }, t]} />
          <View style={[{ flex: 1, borderRadius: 1 }, t]} />
        </View>
      </View>
    ),
    overlap: (
      <View style={{ flex: 1 }}>
        <View style={[{ position: 'absolute', top: 0, left: 0, right: 6, bottom: 8, borderRadius: 1 }, t]} />
        <View style={[{ position: 'absolute', top: 8, left: 6, right: 0, bottom: 0, borderRadius: 1 }, filled]} />
      </View>
    ),
    bleed: (
      <View style={{ flex: 1, gap: 2 }}>
        <View style={[{ flex: 1.2, borderRadius: 0, marginHorizontal: -6 }, filled]} />
        <View style={{ flex: 1, flexDirection: 'row', gap: 2 }}>
          <View style={[{ flex: 1, borderRadius: 1 }, t]} />
          <View style={[{ flex: 1, borderRadius: 1 }, t]} />
        </View>
      </View>
    ),
  };

  return shared[id] ?? <View style={[{ flex: 1, borderRadius: 1 }, t]} />;
}

const MODEL_KEY = 'panelforge_model_v1';
const PRESETS_KEY = 'panelforge_presets_v1';
const SCENES_KEY = 'panelforge_scenes_v1';

const DEFAULT_WEIGHTS: LocalModelWeights = {
  silhouetteBoost: 0,
  poseBoost: 0,
  readabilityAvg: 80,
  poseQualityAvg: 80,
  totalSamples: 0,
};

// ── QuestionEngine data ───────────────────────────────────────────────────────
const QUIZ_QUESTIONS = [
  {
    id: 'sceneType' as const,
    label: 'What type of scene?',
    options: [
      { value: 'action',    label: 'Action',    emoji: '⚡' },
      { value: 'suspense',  label: 'Suspense',  emoji: '👁️' },
      { value: 'emotional', label: 'Emotional', emoji: '💔' },
      { value: 'horror',    label: 'Horror',    emoji: '💀' },
    ],
  },
  {
    id: 'camera' as const,
    label: 'Choose camera style',
    options: [
      { value: 'low_angle',  label: 'Low Angle',   emoji: '⬆️' },
      { value: 'eye_level',  label: 'Eye Level',   emoji: '👀' },
      { value: 'birds_eye',  label: "Bird's Eye",  emoji: '🦅' },
      { value: 'dutch_tilt', label: 'Dutch Tilt',  emoji: '↗️' },
    ],
  },
  {
    id: 'energy' as const,
    label: 'Choose composition energy',
    options: [
      { value: 'calm',      label: 'Calm',      emoji: '🌊' },
      { value: 'dynamic',   label: 'Dynamic',   emoji: '💨' },
      { value: 'explosive', label: 'Explosive', emoji: '🔥' },
      { value: 'cinematic', label: 'Cinematic', emoji: '🎬' },
    ],
  },
];

const SCENE_TEXTS: Record<string, string> = {
  action:    'Two combatants clash in fierce combat, every muscle burning with effort. Kinetic force tears through the air.',
  suspense:  'A lone figure moves through shadow, aware they are being watched — but unsure from which direction the threat will come.',
  emotional: 'A character confronts a truth they have been avoiding. Time presses in from all sides. Silence is deafening.',
  horror:    'Something is terribly wrong. The walls breathe. The shadows move on their own. There is no safe direction left.',
};
const CAMERA_TEXTS: Record<string, string> = {
  low_angle:  'Camera pushes up from far below, making the figure loom massive and heroic against the sky.',
  eye_level:  'Camera meets the character straight on — intimate, honest, no camera tricks.',
  birds_eye:  'Camera looks straight down from above, exposing every vulnerability in the scene.',
  dutch_tilt: 'Camera cants at a sharp angle, making the world feel unstable, wrong, on the verge of collapse.',
};
const ENERGY_TEXTS: Record<string, string> = {
  calm:      'Still composition. Balance and negative space. No urgency. Silence.',
  dynamic:   'Speed lines radiate outward. Diagonal forces tear through the frame.',
  explosive: 'Debris and shockwaves burst in every direction. The panel barely contains the force.',
  cinematic: 'Wide-angle drama. Shadows long, light sharp, every element placed with deliberate intent.',
};

function buildSceneFromQuiz(answers: QuizAnswers): string {
  return [
    answers.sceneType ? SCENE_TEXTS[answers.sceneType] : '',
    answers.camera    ? CAMERA_TEXTS[answers.camera]   : '',
    answers.energy    ? ENERGY_TEXTS[answers.energy]   : '',
  ].filter(Boolean).join(' ');
}

// ── LocalAIModel: enhance prompt with learned weights ────────────────────────
function applyLocalModel(prompt: string, w: LocalModelWeights): string {
  let out = prompt;
  if (w.silhouetteBoost > 0.5) out += ' Bold clear silhouette, strong figure-ground contrast.';
  if (w.poseBoost > 0.5)       out += ' Dynamic confident pose, clear character stance and gesture.';
  return out;
}

// ── SelfLearningEngine: update weights from feedback ────────────────────────
function analyzeFeedback(w: LocalModelWeights, readability: number, poseQuality: number): LocalModelWeights {
  const n = w.totalSamples;
  const newR = (w.readabilityAvg * n + readability) / (n + 1);
  const newP = (w.poseQualityAvg * n + poseQuality) / (n + 1);
  return {
    silhouetteBoost: newR < 70 ? 1 : 0,
    poseBoost: newP < 70 ? 1 : 0,
    readabilityAvg: newR,
    poseQualityAvg: newP,
    totalSamples: n + 1,
  };
}

export default function ComicPanelScreen() {
  const cinInsets = useCinematicInsets();
  const { form: deviceForm } = useCinematicDevice();
  const isTablet = deviceForm === 'tablet';
  const { getToken } = useAuth();
  const { sectionText } = useLocalSearchParams<{ sectionText?: string }>();

  const [scene, setScene] = useState(sectionText ?? '');
  const [selectedStyle, setSelectedStyle] = useState<ComicStyleId>('kirby_classic');
  const [selectedPanelType, setSelectedPanelType] = useState<WallyWoodPanelTypeId | null>(null);
  const [selectedPageLayout, setSelectedPageLayout] = useState<string | null>(null);
  const [selectedSketchStage, setSelectedSketchStage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<PanelResult | null>(null);

  // ── PanelForge engine state ─────────────────────────────────────────────────
  const [modelWeights, setModelWeights] = useState<LocalModelWeights>(DEFAULT_WEIGHTS);
  const [customPresets, setCustomPresets] = useState<CustomPreset[]>([]);
  const [recentScenes, setRecentScenes] = useState<RecentScene[]>([]);
  // QuestionEngine
  const [showWizard, setShowWizard] = useState(false);
  const [quizAnswers, setQuizAnswers] = useState<QuizAnswers>({});
  // SelfLearningEngine feedback
  const [readabilityRating, setReadabilityRating] = useState(0);
  const [poseRating, setPoseRating] = useState(0);
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);
  // BubblePlacementEngine
  const [bubbleText, setBubbleText] = useState('');
  const [captionText, setCaptionText] = useState('');
  const [bubbleType, setBubbleType] = useState<'speech' | 'thought' | 'shout' | 'none'>('speech');
  // PluginLoader — save preset modal
  const [saveModalVisible, setSaveModalVisible] = useState(false);
  const [presetName, setPresetName] = useState('');

  // LocalAIModel — load persisted data on mount
  useEffect(() => {
    (async () => {
      try {
        const [modelRaw, presetsRaw, scenesRaw] = await Promise.all([
          AsyncStorage.getItem(MODEL_KEY),
          AsyncStorage.getItem(PRESETS_KEY),
          AsyncStorage.getItem(SCENES_KEY),
        ]);
        if (modelRaw)  setModelWeights(JSON.parse(modelRaw));
        if (presetsRaw) setCustomPresets(JSON.parse(presetsRaw));
        if (scenesRaw)  setRecentScenes(JSON.parse(scenesRaw));
      } catch {}
    })();
  }, []);

  const handleGenerate = async () => {
    if (!scene.trim()) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setLoading(true);
    setResult(null);
    setFeedbackSubmitted(false);
    setReadabilityRating(0);
    setPoseRating(0);
    try {
      const token = await getToken();
      // LocalAIModel: enhance prompt with learned weights before sending
      const enhancedPrompt = applyLocalModel(scene.trim(), modelWeights);
      const response = await fetch(`${API_BASE}/ai-studio/generate-panel`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          prompt: enhancedPrompt,
          style: selectedStyle,
          ...(selectedPanelType ? { panelType: selectedPanelType } : {}),
          silhouetteBoost: modelWeights.silhouetteBoost,
          poseBoost: modelWeights.poseBoost,
          bubbleText: bubbleText.trim() || undefined,
          captionText: captionText.trim() || undefined,
          bubbleType: bubbleText.trim() ? bubbleType : undefined,
          ...(selectedPageLayout ? { pageLayout: selectedPageLayout } : {}),
          ...(selectedSketchStage ? { sketchStage: selectedSketchStage } : {}),
        }),
      });
      if (!response.ok) throw new Error('Generation failed');
      const data: PanelResult = await response.json();
      setResult(data);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      // SceneMemory: persist this scene
      setRecentScenes((prev) => {
        const entry: RecentScene = { scene: scene.trim(), style: selectedStyle, timestamp: Date.now() };
        const updated = [entry, ...prev.filter((s) => s.scene !== scene.trim())].slice(0, 5);
        AsyncStorage.setItem(SCENES_KEY, JSON.stringify(updated)).catch(() => {});
        return updated;
      });
    } catch {
      Alert.alert('Generation Failed', 'Could not generate the panel. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // SelfLearningEngine — submit feedback and update local model weights
  const handleSubmitFeedback = useCallback(async () => {
    if (!readabilityRating || !poseRating) return;
    const newWeights = analyzeFeedback(modelWeights, readabilityRating * 20, poseRating * 20);
    setModelWeights(newWeights);
    setFeedbackSubmitted(true);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    try { await AsyncStorage.setItem(MODEL_KEY, JSON.stringify(newWeights)); } catch {}
  }, [modelWeights, readabilityRating, poseRating]);

  // PluginLoader — save current config as a named custom preset
  const handleSavePreset = useCallback(async () => {
    if (!presetName.trim()) return;
    const preset: CustomPreset = {
      id: Date.now().toString(),
      name: presetName.trim(),
      emoji: '⭐',
      scene,
      style: selectedStyle,
      panelType: selectedPanelType,
      createdAt: Date.now(),
    };
    const updated = [...customPresets, preset];
    setCustomPresets(updated);
    setSaveModalVisible(false);
    setPresetName('');
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    try { await AsyncStorage.setItem(PRESETS_KEY, JSON.stringify(updated)); } catch {}
  }, [presetName, scene, selectedStyle, selectedPanelType, customPresets]);

  const handleDeletePreset = useCallback(async (id: string) => {
    const updated = customPresets.filter((p) => p.id !== id);
    setCustomPresets(updated);
    try { await AsyncStorage.setItem(PRESETS_KEY, JSON.stringify(updated)); } catch {}
  }, [customPresets]);

  const handleShare = async () => {
    if (!result?.imageBase64) return;
    try {
      const path = `${FileSystem.documentDirectory}panel_${Date.now()}.png`;
      await FileSystem.writeAsStringAsync(path, result.imageBase64, {
        encoding: FileSystem.EncodingType.Base64,
      });
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(path, { mimeType: 'image/png' });
      } else {
        Alert.alert('Saved', 'Panel saved to your files.');
      }
    } catch {
      Alert.alert('Error', 'Could not save the panel.');
    }
  };

  return (
    <View style={[styles.root, { backgroundColor: C.bg }]}>
      {/* Header */}
      <View
        style={[
          styles.header,
          {
            paddingTop: cinInsets.top + 12,
            borderBottomColor: C.border,
            backgroundColor: C.card,
          },
        ]}
      >
        <TouchableOpacity
          onPress={() => router.back()}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Feather name="x" size={22} color={C.ink} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Feather name="grid" size={15} color={C.yellow} />
          <Text style={[styles.headerTitle, { color: C.ink }]}>Comic Panel</Text>
        </View>
        {result ? (
          <TouchableOpacity
            onPress={handleShare}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Feather name="share" size={20} color={C.yellow} />
          </TouchableOpacity>
        ) : (
          <View style={{ width: 22 }} />
        )}
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          { paddingBottom: cinInsets.bottom + 40 },
        ]}
        keyboardShouldPersistTaps="handled"
      >
        {/* ── PluginLoader: MY PRESETS ──────────────────────────────────────── */}
        {customPresets.length > 0 && (
          <View style={styles.block}>
            <Text style={[styles.sectionLabel, { color: C.muted }]}>MY PRESETS</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.presetRow}>
              {customPresets.map((p) => (
                <TouchableOpacity
                  key={p.id}
                  style={[styles.presetCard, { backgroundColor: C.yellow + '12', borderColor: C.yellow + '40' }]}
                  onPress={() => {
                    Haptics.selectionAsync();
                    setScene(p.scene);
                    setSelectedStyle(p.style);
                    if (p.panelType) setSelectedPanelType(p.panelType);
                    setResult(null);
                  }}
                  onLongPress={() => Alert.alert('Delete Preset', `Remove "${p.name}"?`, [
                    { text: 'Cancel', style: 'cancel' },
                    { text: 'Delete', style: 'destructive', onPress: () => handleDeletePreset(p.id) },
                  ])}
                  activeOpacity={0.8}
                >
                  <Text style={styles.presetEmoji}>{p.emoji}</Text>
                  <Text style={[styles.presetName, { color: C.yellow }]}>{p.name}</Text>
                  <Text style={[styles.presetDesc, { color: C.muted }]} numberOfLines={2}>
                    {p.scene.slice(0, 40)}…
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* ── QuestionEngine Wizard ──────────────────────────────────────────── */}
        <View style={styles.block}>
          <TouchableOpacity
            style={[styles.wizardToggle, { backgroundColor: C.card, borderColor: C.border }]}
            onPress={() => setShowWizard((v) => !v)}
            activeOpacity={0.8}
          >
            <Feather name="sliders" size={14} color={C.yellow} />
            <Text style={[styles.wizardToggleText, { color: C.ink }]}>Scene Wizard</Text>
            <Feather name={showWizard ? 'chevron-up' : 'chevron-down'} size={14} color={C.muted} />
          </TouchableOpacity>
          {showWizard && (
            <View style={[styles.wizardCard, { backgroundColor: C.card, borderColor: C.border }]}>
              {QUIZ_QUESTIONS.map((q) => (
                <View key={q.id} style={styles.wizardQuestion}>
                  <Text style={[styles.wizardQLabel, { color: C.ink }]}>{q.label}</Text>
                  <View style={styles.wizardOptionsRow}>
                    {q.options.map((opt) => {
                      const selected = quizAnswers[q.id] === opt.value;
                      return (
                        <TouchableOpacity
                          key={opt.value}
                          style={[styles.wizardOption, {
                            backgroundColor: selected ? C.yellow + '18' : C.bg,
                            borderColor: selected ? C.yellow : C.border,
                          }]}
                          onPress={() => {
                            Haptics.selectionAsync();
                            const updated = { ...quizAnswers, [q.id]: opt.value };
                            setQuizAnswers(updated);
                            if (updated.sceneType && updated.camera && updated.energy) {
                              setScene(buildSceneFromQuiz(updated));
                            }
                          }}
                          activeOpacity={0.8}
                        >
                          <Text style={styles.wizardOptionEmoji}>{opt.emoji}</Text>
                          <Text style={[styles.wizardOptionLabel, { color: selected ? C.yellow : C.ink }]}>
                            {opt.label}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>
              ))}
              {quizAnswers.sceneType && quizAnswers.camera && quizAnswers.energy && (
                <TouchableOpacity
                  style={[styles.wizardBuildBtn, { backgroundColor: C.yellow }]}
                  onPress={() => { setScene(buildSceneFromQuiz(quizAnswers)); setShowWizard(false); }}
                  activeOpacity={0.85}
                >
                  <Feather name="check" size={13} color={C.bg} />
                  <Text style={[styles.wizardBuildBtnText, { color: C.bg }]}>Apply to Scene</Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        </View>

        {/* ── SceneMemory: Recent Scenes ────────────────────────────────────── */}
        {recentScenes.length > 0 && (
          <View style={styles.block}>
            <Text style={[styles.sectionLabel, { color: C.muted }]}>RECENT SCENES</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.presetRow}>
              {recentScenes.map((rs, i) => (
                <TouchableOpacity
                  key={i}
                  style={[styles.recentCard, { backgroundColor: C.card, borderColor: C.border }]}
                  onPress={() => { Haptics.selectionAsync(); setScene(rs.scene); setSelectedStyle(rs.style); setResult(null); }}
                  activeOpacity={0.8}
                >
                  <Feather name="clock" size={11} color={C.muted} />
                  <Text style={[styles.recentText, { color: C.ink }]} numberOfLines={2}>
                    {rs.scene.slice(0, 50)}…
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Wally Wood quick-scene presets */}
        <View style={styles.block}>
          <Text style={[styles.sectionLabel, { color: C.muted }]}>
            WALLY WOOD'S 22 PANELS
          </Text>
          <Text style={[styles.presetHint, { color: C.muted }]}>
            All 22 compositional techniques — tap to load scene + technique.
          </Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.presetRow}
          >
            {WALLY_WOOD_PRESETS.map((preset) => (
              <TouchableOpacity
                key={preset.name}
                style={[
                  styles.presetCard,
                  { backgroundColor: C.card, borderColor: C.border },
                ]}
                onPress={() => {
                  Haptics.selectionAsync();
                  setScene(preset.scene);
                  setSelectedStyle(preset.style);
                  if (preset.techniqueId) {
                    setSelectedPanelType(preset.techniqueId as WallyWoodPanelTypeId);
                  }
                  setResult(null);
                }}
                activeOpacity={0.8}
              >
                <Text style={styles.presetEmoji}>{preset.emoji}</Text>
                <Text style={[styles.presetName, { color: C.ink }]}>
                  {preset.name}
                </Text>
                <Text style={[styles.presetDesc, { color: C.muted }]}>
                  {preset.description}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Scene input */}
        <View style={styles.block}>
          <Text style={[styles.sectionLabel, { color: C.muted }]}>
            SCENE DESCRIPTION
          </Text>
          <TextInput
            style={[
              styles.sceneInput,
              {
                color: C.ink,
                backgroundColor: C.card,
                borderColor: C.border,
              },
            ]}
            value={scene}
            onChangeText={setScene}
            multiline
            numberOfLines={4}
            placeholder="Describe who is in the scene, what is happening, the setting and mood…"
            placeholderTextColor={C.muted}
            textAlignVertical="top"
          />
        </View>

        {/* BubblePlacementEngine */}
        <View style={styles.block}>
          <Text style={[styles.sectionLabel, { color: C.muted }]}>SPEECH BUBBLE</Text>
          {/* Bubble type chips */}
          <View style={styles.bubbleTypeRow}>
            {(['none', 'speech', 'thought', 'shout'] as const).map((t) => {
              const meta = { none: { emoji: '🚫', label: 'None' }, speech: { emoji: '💬', label: 'Speech' }, thought: { emoji: '💭', label: 'Thought' }, shout: { emoji: '💥', label: 'Shout' } }[t];
              const sel = bubbleType === t;
              return (
                <TouchableOpacity
                  key={t}
                  style={[styles.bubbleTypeChip, { backgroundColor: sel ? C.yellow + '18' : C.card, borderColor: sel ? C.yellow : C.border, borderWidth: sel ? 1.5 : 1 }]}
                  onPress={() => { Haptics.selectionAsync(); setBubbleType(t); if (t === 'none') setBubbleText(''); }}
                  activeOpacity={0.8}
                >
                  <Text style={styles.bubbleTypeEmoji}>{meta.emoji}</Text>
                  <Text style={[styles.bubbleTypeLabel, { color: sel ? C.yellow : C.ink }]}>{meta.label}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
          {/* Dialogue text input */}
          {bubbleType !== 'none' && (
            <TextInput
              style={[styles.bubbleInput, { color: C.ink, backgroundColor: C.card, borderColor: bubbleText.trim() ? C.yellow + '60' : C.border }]}
              value={bubbleText}
              onChangeText={setBubbleText}
              placeholder={bubbleType === 'thought' ? 'Character thought…' : bubbleType === 'shout' ? 'SHOUTED TEXT!' : 'Spoken dialogue…'}
              placeholderTextColor={C.muted}
              maxLength={80}
            />
          )}
          {bubbleText.trim().length > 0 && (
            <Text style={[styles.bubbleCharCount, { color: C.muted }]}>{bubbleText.trim().length}/80 chars</Text>
          )}
        </View>

        {/* Caption box (narrator) */}
        <View style={styles.block}>
          <Text style={[styles.sectionLabel, { color: C.muted }]}>CAPTION BOX</Text>
          <TextInput
            style={[styles.bubbleInput, { color: C.ink, backgroundColor: C.card, borderColor: captionText.trim() ? C.yellow + '60' : C.border }]}
            value={captionText}
            onChangeText={setCaptionText}
            placeholder="Narrator caption at top or bottom of panel…"
            placeholderTextColor={C.muted}
            maxLength={100}
          />
          {captionText.trim().length > 0 && (
            <Text style={[styles.bubbleCharCount, { color: C.muted }]}>{captionText.trim().length}/100 chars</Text>
          )}
        </View>

        {/* Sketch Stage picker */}
        <View style={styles.block}>
          <Text style={[styles.sectionLabel, { color: C.muted }]}>
            SKETCH STAGE
          </Text>
          <Text style={[styles.presetHint, { color: C.muted }]}>
            Drawing progression — Rough Sketch, Sketch, or finished Line Art.
          </Text>
          <View style={isTablet ? styles.sketchStageRow : styles.sketchStageRowPhone}>
            {SKETCH_STAGES.map((stage) => {
              const isSelected = selectedSketchStage === stage.id;
              return (
                <TouchableOpacity
                  key={stage.id}
                  style={[
                    isTablet ? styles.sketchStageCard : styles.sketchStageCardPhone,
                    {
                      backgroundColor: isSelected ? '#1A1410' : C.card,
                      borderColor: isSelected ? '#FFD600' : C.border,
                      borderWidth: isSelected ? 2 : 1,
                    },
                  ]}
                  onPress={() => {
                    Haptics.selectionAsync();
                    setSelectedSketchStage(isSelected ? null : stage.id);
                  }}
                  activeOpacity={0.8}
                >
                  <Text style={styles.sketchStageEmoji}>{stage.emoji}</Text>
                  <View style={{ flex: 1, gap: 4 }}>
                    <Text
                      style={[
                        styles.sketchStageLabel,
                        { color: isSelected ? '#FFD600' : C.ink, textAlign: isTablet ? 'center' : 'left' },
                      ]}
                    >
                      {stage.label}
                    </Text>
                    <Text
                      style={[styles.sketchStageDesc, { color: C.muted, textAlign: isTablet ? 'center' : 'left' }]}
                      numberOfLines={2}
                    >
                      {stage.desc}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Page Layout picker */}
        <View style={styles.block}>
          <Text style={[styles.sectionLabel, { color: C.muted }]}>
            PAGE LAYOUT
          </Text>
          <Text style={[styles.presetHint, { color: C.muted }]}>
            Panel arrangement type — how panels are placed on the page.
          </Text>
          <View style={isTablet ? styles.layoutGrid : styles.layoutGridPhone}>
            {PAGE_LAYOUTS.map((layout) => {
              const isSelected = selectedPageLayout === layout.id;
              return (
                <TouchableOpacity
                  key={layout.id}
                  style={[
                    isTablet ? styles.layoutCard : styles.layoutCardPhone,
                    {
                      backgroundColor: isSelected ? '#0057A8' + '18' : C.card,
                      borderColor: isSelected ? '#0057A8' : C.border,
                      borderWidth: isSelected ? 2 : 1,
                    },
                  ]}
                  onPress={() => {
                    Haptics.selectionAsync();
                    setSelectedPageLayout(isSelected ? null : layout.id);
                  }}
                  activeOpacity={0.8}
                >
                  <View style={[
                    isTablet ? styles.layoutDiagram : styles.layoutDiagramPhone,
                    { borderColor: isSelected ? '#0057A8' : C.border },
                  ]}>
                    <MiniLayoutDiagram id={layout.id} accent={isSelected ? '#0057A8' : C.muted} />
                  </View>
                  <Text
                    style={[
                      styles.layoutCardLabel,
                      { color: isSelected ? '#0057A8' : C.ink, textAlign: isTablet ? 'center' : 'left' },
                    ]}
                    numberOfLines={1}
                  >
                    {layout.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
          {selectedPageLayout && (
            <Text style={[styles.presetHint, { color: C.muted, marginTop: 8 }]}>
              {PAGE_LAYOUTS.find((l) => l.id === selectedPageLayout)?.desc}
            </Text>
          )}
        </View>

        {/* Style picker */}
        <View style={styles.block}>
          <Text style={[styles.sectionLabel, { color: C.muted }]}>
            COMIC STYLE
          </Text>
          <View style={styles.styleGrid}>
            {COMIC_STYLES.map((s) => {
              const isSelected = selectedStyle === s.id;
              return (
                <TouchableOpacity
                  key={s.id}
                  style={[
                    styles.styleCard,
                    {
                      backgroundColor: isSelected
                        ? C.yellow + '12'
                        : C.card,
                      borderColor: isSelected ? C.yellow : C.border,
                      borderWidth: isSelected ? 2 : 1,
                    },
                  ]}
                  onPress={() => {
                    Haptics.selectionAsync();
                    setSelectedStyle(s.id);
                  }}
                  activeOpacity={0.8}
                >
                  <Text style={styles.styleEmoji}>{s.emoji}</Text>
                  <Text
                    style={[
                      styles.styleName,
                      { color: isSelected ? C.yellow : C.ink },
                    ]}
                  >
                    {s.label}
                  </Text>
                  <Text
                    style={[styles.styleDesc, { color: C.muted }]}
                    numberOfLines={2}
                  >
                    {s.desc}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Wally Wood panel technique picker */}
        <View style={styles.block}>
          <Text style={[styles.sectionLabel, { color: C.muted }]}>
            PANEL TECHNIQUE
          </Text>
          <Text style={[styles.presetHint, { color: C.muted }]}>
            Wally Wood's 22 Panels That Always Work — optional compositional override.
          </Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.chipRow}
          >
            {/* "Any" chip — deselect */}
            <TouchableOpacity
              style={[
                styles.chip,
                {
                  backgroundColor: selectedPanelType === null ? C.yellow : C.card,
                  borderColor: selectedPanelType === null ? C.yellow : C.border,
                },
              ]}
              onPress={() => { Haptics.selectionAsync(); setSelectedPanelType(null); }}
              activeOpacity={0.8}
            >
              <Text style={[styles.chipText, { color: selectedPanelType === null ? C.bg : C.ink }]}>
                Any
              </Text>
            </TouchableOpacity>

            {WALLY_WOOD_PANEL_TYPES.map((pt) => {
              const isSelected = selectedPanelType === pt.id;
              return (
                <TouchableOpacity
                  key={pt.id}
                  style={[
                    styles.chip,
                    {
                      backgroundColor: isSelected ? C.yellow + '18' : C.card,
                      borderColor: isSelected ? C.yellow : C.border,
                      borderWidth: isSelected ? 1.5 : 1,
                    },
                  ]}
                  onPress={() => {
                    Haptics.selectionAsync();
                    setSelectedPanelType(isSelected ? null : pt.id);
                  }}
                  activeOpacity={0.8}
                >
                  <Text style={styles.chipEmoji}>{pt.emoji}</Text>
                  <Text style={[styles.chipText, { color: isSelected ? C.yellow : C.ink }]}>
                    {pt.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* Generate button */}
        <TouchableOpacity
          style={[
            styles.generateBtn,
            { backgroundColor: scene.trim() && !loading ? C.yellow : C.dim },
          ]}
          onPress={handleGenerate}
          activeOpacity={0.85}
          disabled={!scene.trim() || loading}
        >
          {loading ? (
            <ActivityIndicator color={C.bg} size="small" />
          ) : (
            <Feather name="grid" size={16} color={C.bg} />
          )}
          <Text style={[styles.generateBtnText, { color: C.bg }]}>
            {loading ? 'Generating Panel…' : 'Generate Panel'}
          </Text>
        </TouchableOpacity>

        {/* LocalAIModel active indicator */}
        {modelWeights.totalSamples > 0 && (modelWeights.silhouetteBoost > 0.5 || modelWeights.poseBoost > 0.5) && (
          <View style={[styles.learningBadge, { backgroundColor: C.yellow + '18', borderColor: C.yellow + '40' }]}>
            <Feather name="cpu" size={11} color={C.yellow} />
            <Text style={[styles.learningBadgeText, { color: C.yellow }]}>
              🧠 AI learning active · {modelWeights.totalSamples} sessions
              {modelWeights.silhouetteBoost > 0.5 ? ' · boosting silhouette' : ''}
              {modelWeights.poseBoost > 0.5 ? ' · boosting pose' : ''}
            </Text>
          </View>
        )}

        {/* Result */}
        {result && (
          <View style={styles.resultBlock}>
            {/* Panel image */}
            <View style={[styles.panelFrame, { borderColor: C.border, backgroundColor: C.card }]}>
              <Image
                source={{ uri: `data:image/png;base64,${result.imageBase64}` }}
                style={styles.panelImage}
                resizeMode="contain"
              />
            </View>

            {/* Save as preset button (PluginLoader) */}
            <TouchableOpacity
              style={[styles.savePresetBtn, { backgroundColor: C.card, borderColor: C.border }]}
              onPress={() => { setSaveModalVisible(true); setPresetName(''); }}
              activeOpacity={0.8}
            >
              <Feather name="bookmark" size={13} color={C.yellow} />
              <Text style={[styles.savePresetBtnText, { color: C.yellow }]}>Save as Preset</Text>
            </TouchableOpacity>

            {/* Metadata */}
            <View style={[styles.metaCard, { backgroundColor: C.card, borderColor: C.border }]}>
              <Text style={[styles.sectionLabel, { color: C.muted }]}>PANEL ANALYSIS</Text>
              <View style={styles.badgeGrid}>
                <MetaBadge icon="camera"         label="Camera"       value={result.cameraAngle}                    />
                <MetaBadge icon="box"            label="Perspective"  value={result.perspective}                    />
                <MetaBadge icon="layout"         label="Composition"  value={result.composition}                    />
                <MetaBadge icon="user"           label="Pose"         value={result.poseStyle}                      />
                <MetaBadge icon="zap"            label="Motion lines" value={result.hasMotionLines ? 'Yes' : 'No'}  />
                <MetaBadge icon="message-circle" label="Bubble zone"  value={result.bubbleZone}                     />
              </View>
              <View style={styles.scoreRow}>
                <ScoreBar label="Eye flow" value={result.eyeFlow} />
                <ScoreBar label="Depth"    value={result.depth}   />
              </View>
            </View>

            {/* SelfLearningEngine — Feedback widget */}
            <View style={[styles.feedbackCard, { backgroundColor: C.card, borderColor: C.border }]}>
              <Text style={[styles.sectionLabel, { color: C.muted }]}>RATE THIS PANEL</Text>
              <Text style={[styles.feedbackHint, { color: C.muted }]}>
                Your ratings train the AI to improve future panels automatically.
              </Text>
              {feedbackSubmitted ? (
                <View style={styles.feedbackDone}>
                  <Feather name="check-circle" size={18} color={C.yellow} />
                  <Text style={[styles.feedbackDoneText, { color: C.yellow }]}>
                    Model updated! {modelWeights.silhouetteBoost > 0.5 ? 'Silhouette boost on. ' : ''}{modelWeights.poseBoost > 0.5 ? 'Pose boost on.' : ''}
                  </Text>
                </View>
              ) : (
                <>
                  <View style={styles.feedbackRow}>
                    <Text style={[styles.feedbackLabel, { color: C.ink }]}>Readability</Text>
                    <View style={styles.starRow}>
                      {[1, 2, 3, 4, 5].map((star) => (
                        <TouchableOpacity key={star} onPress={() => { Haptics.selectionAsync(); setReadabilityRating(star); }} activeOpacity={0.7}>
                          <Feather name="star" size={22} color={readabilityRating >= star ? '#F59E0B' : C.border} />
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                  <View style={styles.feedbackRow}>
                    <Text style={[styles.feedbackLabel, { color: C.ink }]}>Pose Quality</Text>
                    <View style={styles.starRow}>
                      {[1, 2, 3, 4, 5].map((star) => (
                        <TouchableOpacity key={star} onPress={() => { Haptics.selectionAsync(); setPoseRating(star); }} activeOpacity={0.7}>
                          <Feather name="star" size={22} color={poseRating >= star ? '#F59E0B' : C.border} />
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                  <TouchableOpacity
                    style={[styles.feedbackSubmitBtn, {
                      backgroundColor: readabilityRating && poseRating ? C.yellow : C.dim,
                    }]}
                    onPress={handleSubmitFeedback}
                    disabled={!readabilityRating || !poseRating}
                    activeOpacity={0.85}
                  >
                    <Feather name="cpu" size={13} color={C.bg} />
                    <Text style={[styles.feedbackSubmitText, { color: C.bg }]}>Update AI Model</Text>
                  </TouchableOpacity>
                </>
              )}
            </View>
          </View>
        )}
      </ScrollView>

      {/* ── PluginLoader: Save Preset Modal ──────────────────────────────────── */}
      <Modal visible={saveModalVisible} transparent animationType="fade">
        <Pressable style={styles.modalOverlay} onPress={() => setSaveModalVisible(false)}>
          <Pressable style={[styles.modalCard, { backgroundColor: C.card, borderColor: C.border }]}>
            <Text style={[styles.modalTitle, { color: C.ink }]}>Save Preset</Text>
            <TextInput
              style={[styles.modalInput, { color: C.ink, backgroundColor: C.bg, borderColor: C.border }]}
              value={presetName}
              onChangeText={setPresetName}
              placeholder="Preset name…"
              placeholderTextColor={C.muted}
              autoFocus
              maxLength={30}
            />
            <View style={styles.modalActions}>
              <TouchableOpacity onPress={() => setSaveModalVisible(false)} style={[styles.modalCancelBtn, { borderColor: C.border }]}>
                <Text style={[styles.modalCancelText, { color: C.muted }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleSavePreset}
                disabled={!presetName.trim()}
                style={[styles.modalSaveBtn, { backgroundColor: presetName.trim() ? C.yellow : C.dim }]}
              >
                <Text style={[styles.modalSaveText, { color: C.bg }]}>Save</Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

function MetaBadge({
  icon,
  label,
  value,
}: {
  icon: React.ComponentProps<typeof Feather>['name'];
  label: string;
  value: string;
}) {
  return (
    <View
      style={[
        badgeStyles.wrap,
        { backgroundColor: C.bg, borderColor: C.border },
      ]}
    >
      <Feather name={icon} size={11} color={C.yellow} style={{ marginTop: 1 }} />
      <View style={{ flex: 1 }}>
        <Text style={[badgeStyles.label, { color: C.muted }]}>{label}</Text>
        <Text style={[badgeStyles.value, { color: C.ink }]} numberOfLines={2}>
          {value}
        </Text>
      </View>
    </View>
  );
}

function ScoreBar({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  const pct = Math.round(value * 100);
  const isGood = pct >= 75;
  const barColor = isGood ? C.yellow : '#F59E0B';
  return (
    <View style={scoreStyles.wrap}>
      <View style={scoreStyles.row}>
        <Text style={[scoreStyles.label, { color: C.muted }]}>{label}</Text>
        <Text style={[scoreStyles.pct, { color: barColor }]}>{pct}%</Text>
      </View>
      <View style={[scoreStyles.track, { backgroundColor: C.border }]}>
        <View
          style={[
            scoreStyles.fill,
            { width: `${pct}%` as unknown as number, backgroundColor: barColor },
          ]}
        />
      </View>
    </View>
  );
}

const badgeStyles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 7,
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    width: '48%',
  },
  label: { fontSize: 10, fontFamily: 'Inter_400Regular', marginBottom: 2 },
  value: { fontSize: 12, fontFamily: 'Inter_600SemiBold' },
});

const scoreStyles = StyleSheet.create({
  wrap: { flex: 1, gap: 5 },
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  label: { fontSize: 11, fontFamily: 'Inter_400Regular' },
  pct: { fontSize: 11, fontFamily: 'Inter_700Bold' },
  track: { height: 4, borderRadius: 2, overflow: 'hidden' },
  fill: { height: 4, borderRadius: 2 },
});

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 14,
    borderBottomWidth: 1,
  },
  headerCenter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  headerTitle: { fontSize: 17, fontFamily: 'Inter_600SemiBold' },
  scroll: { padding: 20, gap: 24 },
  block: { gap: 10 },
  sectionLabel: {
    fontSize: 11,
    fontFamily: 'Inter_600SemiBold',
    letterSpacing: 0.8,
  },
  sceneInput: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
    fontFamily: 'Inter_400Regular',
    minHeight: 110,
  },
  styleGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  styleCard: {
    borderRadius: 12,
    padding: 12,
    width: '47%',
    gap: 4,
  },
  styleEmoji: { fontSize: 22 },
  styleName: { fontSize: 14, fontFamily: 'Inter_700Bold' },
  styleDesc: { fontSize: 12, fontFamily: 'Inter_400Regular', lineHeight: 17 },
  presetHint: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    marginTop: -4,
  },
  chipRow: {
    gap: 8,
    paddingVertical: 2,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  chipEmoji: { fontSize: 13 },
  chipText: { fontSize: 12, fontFamily: 'Inter_600SemiBold' },
  presetRow: {
    gap: 10,
    paddingVertical: 2,
  },
  presetCard: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    width: 130,
    gap: 4,
  },
  presetEmoji: { fontSize: 22 },
  presetName: { fontSize: 13, fontFamily: 'Inter_700Bold' },
  presetDesc: { fontSize: 11, fontFamily: 'Inter_400Regular', lineHeight: 15 },
  generateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    borderRadius: 14,
  },
  generateBtnText: { fontSize: 16, fontFamily: 'Inter_600SemiBold' },
  resultBlock: { gap: 16 },
  panelFrame: {
    borderWidth: 1,
    borderRadius: 16,
    overflow: 'hidden',
    aspectRatio: 3 / 4,
  },
  panelImage: { width: '100%', height: '100%' },
  metaCard: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
    gap: 14,
  },
  badgeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  scoreRow: { flexDirection: 'row', gap: 16 },
  // BubblePlacementEngine
  bubbleTypeRow: { flexDirection: 'row', gap: 8 },
  bubbleTypeChip: {
    flex: 1,
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    gap: 3,
  },
  bubbleTypeEmoji: { fontSize: 18 },
  bubbleTypeLabel: { fontSize: 11, fontFamily: 'Inter_600SemiBold' },
  bubbleInput: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
  },
  bubbleCharCount: { fontSize: 11, fontFamily: 'Inter_400Regular', textAlign: 'right' },
  // QuestionEngine wizard
  wizardToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  wizardToggleText: { flex: 1, fontSize: 14, fontFamily: 'Inter_600SemiBold' },
  wizardCard: { borderRadius: 12, borderWidth: 1, padding: 16, gap: 16 },
  wizardQuestion: { gap: 8 },
  wizardQLabel: { fontSize: 13, fontFamily: 'Inter_600SemiBold' },
  wizardOptionsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  wizardOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  wizardOptionEmoji: { fontSize: 13 },
  wizardOptionLabel: { fontSize: 12, fontFamily: 'Inter_600SemiBold' },
  wizardBuildBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 10,
  },
  wizardBuildBtnText: { fontSize: 13, fontFamily: 'Inter_600SemiBold' },
  // SceneMemory
  recentCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    width: 160,
  },
  recentText: { flex: 1, fontSize: 11, fontFamily: 'Inter_400Regular', lineHeight: 15 },
  // LocalAIModel indicator
  learningBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    marginTop: -8,
  },
  learningBadgeText: { flex: 1, fontSize: 11, fontFamily: 'Inter_400Regular' },
  // SelfLearningEngine feedback
  feedbackCard: { borderRadius: 16, borderWidth: 1, padding: 16, gap: 12 },
  feedbackHint: { fontSize: 12, fontFamily: 'Inter_400Regular', marginTop: -4 },
  feedbackRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  feedbackLabel: { fontSize: 13, fontFamily: 'Inter_600SemiBold' },
  starRow: { flexDirection: 'row', gap: 4 },
  feedbackSubmitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: 12,
  },
  feedbackSubmitText: { fontSize: 14, fontFamily: 'Inter_600SemiBold' },
  feedbackDone: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  feedbackDoneText: { fontSize: 13, fontFamily: 'Inter_600SemiBold', flex: 1 },
  // PluginLoader — save preset button + modal
  savePresetBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
  },
  savePresetBtnText: { fontSize: 13, fontFamily: 'Inter_600SemiBold' },
  modalOverlay: {
    flex: 1,
    backgroundColor: '#00000066',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalCard: {
    width: '100%',
    borderRadius: 16,
    borderWidth: 1,
    padding: 20,
    gap: 14,
  },
  modalTitle: { fontSize: 16, fontFamily: 'Inter_700Bold' },
  modalInput: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    fontSize: 15,
    fontFamily: 'Inter_400Regular',
  },
  modalActions: { flexDirection: 'row', gap: 10 },
  modalCancelBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
  },
  modalCancelText: { fontSize: 14, fontFamily: 'Inter_600SemiBold' },
  modalSaveBtn: { flex: 1, paddingVertical: 12, borderRadius: 10, alignItems: 'center' },
  modalSaveText: { fontSize: 14, fontFamily: 'Inter_600SemiBold' },
  // Sketch Stage
  sketchStageRow: { flexDirection: 'row', gap: 8 },
  sketchStageRowPhone: { flexDirection: 'column', gap: 10 },
  sketchStageCard: {
    flex: 1,
    borderRadius: 14,
    padding: 14,
    alignItems: 'center',
    gap: 5,
  },
  sketchStageCardPhone: {
    width: '100%',
    borderRadius: 16,
    padding: 16,
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: 14,
  },
  sketchStageEmoji: { fontSize: 26 },
  sketchStageLabel: { fontSize: 13, fontFamily: 'Inter_700Bold', textAlign: 'center' },
  sketchStageDesc: { fontSize: 11, fontFamily: 'Inter_400Regular', textAlign: 'center', lineHeight: 15 },
  // Page Layout
  layoutGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  layoutGridPhone: { flexDirection: 'column', gap: 10 },
  layoutCard: {
    width: '30%',
    borderRadius: 14,
    padding: 10,
    alignItems: 'center',
    gap: 6,
  },
  layoutCardPhone: {
    width: '100%',
    borderRadius: 16,
    padding: 14,
    alignItems: 'center',
    flexDirection: 'row',
    gap: 14,
  },
  layoutDiagram: {
    width: '100%',
    height: 50,
    borderRadius: 6,
    borderWidth: 1,
    overflow: 'hidden',
    padding: 5,
  },
  layoutDiagramPhone: {
    width: 60,
    height: 60,
    borderRadius: 8,
    borderWidth: 1,
    overflow: 'hidden',
    padding: 5,
  },
  layoutCardLabel: { fontSize: 12, fontFamily: 'Inter_600SemiBold', textAlign: 'center' },
});
