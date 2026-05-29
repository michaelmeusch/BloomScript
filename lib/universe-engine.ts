// ============================================================================
// COMIC ART STUDIO AI — UNIVERSAL CINEMATIC STORY ENGINE
// TypeScript port of Java UniversalAIInterpreter, CinematicTrainingSystem,
//   AIStoryDirector, SpeciesDNA, CivilizationProfile, SceneUnderstanding
// ============================================================================

import type {
  CivilizationProfile,
  CivilizationType,
  EmotionalToneScene,
  MotionType,
  SpeciesDNA,
  SpeciesType,
} from './character-memory';

// ── SceneUnderstanding (Java: SceneUnderstanding class) ───────────────────────
export interface SceneUnderstanding {
  cameraType:    string | null;
  directorCameraId: string | null;
  motionType:    MotionType | null;
  emotionalTone: EmotionalToneScene;
  environment:   string | null;
  lighting:      string | null;
  crowdBehavior: string | null;
  composition:   string;
  atmosphere:    string;
}

export interface UniversalInterpretation {
  speciesDNA:        SpeciesDNA | null;
  civilization:      CivilizationProfile | null;
  scene:             SceneUnderstanding;
  tips:              Array<{ title: string; message: string }>;
}

// ── SPECIES DATABASE (all 16 SpeciesType entries) ────────────────────────────

export const SPECIES_DATABASE: Record<SpeciesType, SpeciesDNA> = {
  HUMAN: {
    speciesType: 'HUMAN', bodyStructure: 'Standard Human Anatomy', skinTexture: 'Smooth Skin',
    movementStyle: 'Bipedal Upright Motion', eyeStructure: 'Standard Human Eyes',
    wings: false, tail: false, glowingSkin: false,
    energySignature: 'None', silhouetteStyle: 'Classic Human Silhouette',
  },
  AVIAN: {
    speciesType: 'AVIAN', bodyStructure: 'Lightweight Winged Anatomy', skinTexture: 'Feathered',
    movementStyle: 'Gliding Motion', eyeStructure: 'Sharp Birdlike Eyes',
    wings: true, tail: false, glowingSkin: true,
    energySignature: 'Blue Energy Aura', silhouetteStyle: 'Wide Wing Silhouette',
  },
  REPTILIAN: {
    speciesType: 'REPTILIAN', bodyStructure: 'Heavy Muscular Frame', skinTexture: 'Scaled Skin',
    movementStyle: 'Predatory Stalking Motion', eyeStructure: 'Vertical Slitted Eyes',
    wings: false, tail: true, glowingSkin: false,
    energySignature: 'Heat Signature', silhouetteStyle: 'Massive Tail Silhouette',
  },
  INSECTOID: {
    speciesType: 'INSECTOID', bodyStructure: 'Exoskeleton Multi-Limb Frame', skinTexture: 'Chitinous Armor',
    movementStyle: 'Scuttling Burst Motion', eyeStructure: 'Faceted Compound Eyes',
    wings: true, tail: false, glowingSkin: false,
    energySignature: 'Hive Pheromone Trail', silhouetteStyle: 'Multi-Limb Angular Silhouette',
  },
  AQUATIC: {
    speciesType: 'AQUATIC', bodyStructure: 'Streamlined Hydrodynamic Body', skinTexture: 'Bioluminescent Scales',
    movementStyle: 'Fluid Wave Motion', eyeStructure: 'Wide Deep-Pressure Eyes',
    wings: false, tail: true, glowingSkin: true,
    energySignature: 'Bioluminescent Pulse', silhouetteStyle: 'Flowing Tail Silhouette',
  },
  CELESTIAL: {
    speciesType: 'CELESTIAL', bodyStructure: 'Ethereal Luminous Anatomy', skinTexture: 'Translucent Light Skin',
    movementStyle: 'Ascending Float Motion', eyeStructure: 'All-White Starlight Eyes',
    wings: true, tail: false, glowingSkin: true,
    energySignature: 'Divine Light Radiance', silhouetteStyle: 'Halo + Wing Silhouette',
  },
  SHADOW_ENTITY: {
    speciesType: 'SHADOW_ENTITY', bodyStructure: 'Shifting Shadow Form', skinTexture: 'Living Darkness',
    movementStyle: 'Phasing Void Motion', eyeStructure: 'Glowing Red Void Eyes',
    wings: false, tail: false, glowingSkin: true,
    energySignature: 'Dark Void Energy', silhouetteStyle: 'Formless Shadow Silhouette',
  },
  ENERGY_BEING: {
    speciesType: 'ENERGY_BEING', bodyStructure: 'Pure Plasma Energy Form', skinTexture: 'Crackling Energy Skin',
    movementStyle: 'Quantum Phase Motion', eyeStructure: 'Energy Vortex Core Eyes',
    wings: false, tail: false, glowingSkin: true,
    energySignature: 'Unstable Plasma Field', silhouetteStyle: 'Radiating Energy Silhouette',
  },
  CYBORG: {
    speciesType: 'CYBORG', bodyStructure: 'Human-Machine Hybrid Frame', skinTexture: 'Metal-Flesh Interface',
    movementStyle: 'Servo-Assisted Mechanical Motion', eyeStructure: 'HUD Scanner Eyes',
    wings: false, tail: false, glowingSkin: false,
    energySignature: 'Tech Power Grid Hum', silhouetteStyle: 'Asymmetric Augment Silhouette',
  },
  SYNTHETIC: {
    speciesType: 'SYNTHETIC', bodyStructure: 'Full Android Precision Frame', skinTexture: 'Polished Metal Skin',
    movementStyle: 'Exact Calculated Motion', eyeStructure: 'Optical Array Eyes',
    wings: false, tail: false, glowingSkin: false,
    energySignature: 'Clean Power Cell Signal', silhouetteStyle: 'Perfect Geometric Silhouette',
  },
  PLANT_BASED: {
    speciesType: 'PLANT_BASED', bodyStructure: 'Botanical Wood-Vine Frame', skinTexture: 'Bark and Leaf Texture',
    movementStyle: 'Rooting Growth Motion', eyeStructure: 'Chlorophyll Green Eyes',
    wings: false, tail: false, glowingSkin: false,
    energySignature: 'Photosynthesis Aura', silhouetteStyle: 'Branching Organic Silhouette',
  },
  GIANT: {
    speciesType: 'GIANT', bodyStructure: 'Titanic Crushing Anatomy', skinTexture: 'Stone-Dense Skin',
    movementStyle: 'Earth-Shaking Heavy Motion', eyeStructure: 'Deep-Set Boulder Eyes',
    wings: false, tail: false, glowingSkin: false,
    energySignature: 'Seismic Ground Pressure', silhouetteStyle: 'Massive Towering Silhouette',
  },
  DEMONIC: {
    speciesType: 'DEMONIC', bodyStructure: 'Corrupted Powerhouse Frame', skinTexture: 'Obsidian Scale Skin',
    movementStyle: 'Predatory Chaos Motion', eyeStructure: 'Burning Hellfire Eyes',
    wings: true, tail: true, glowingSkin: true,
    energySignature: 'Hellfire Corruption Aura', silhouetteStyle: 'Horns + Wings + Tail Silhouette',
  },
  ANGELIC: {
    speciesType: 'ANGELIC', bodyStructure: 'Divine Proportioned Frame', skinTexture: 'Divine Radiant Skin',
    movementStyle: 'Ascending Sacred Motion', eyeStructure: 'Pure White Holy Eyes',
    wings: true, tail: false, glowingSkin: true,
    energySignature: 'Holy Light Energy', silhouetteStyle: 'Divine Wings Halo Silhouette',
  },
  HYBRID: {
    speciesType: 'HYBRID', bodyStructure: 'Mixed Species Adaptive Anatomy', skinTexture: 'Multi-Texture Skin',
    movementStyle: 'Adaptive Combat Motion', eyeStructure: 'Heterochromia Mixed Eyes',
    wings: false, tail: false, glowingSkin: false,
    energySignature: 'Unstable Mixed Aura', silhouetteStyle: 'Dynamic Mixed Silhouette',
  },
  CRYSTALLINE: {
    speciesType: 'CRYSTALLINE', bodyStructure: 'Geometric Crystal Frame', skinTexture: 'Faceted Prism Crystal Skin',
    movementStyle: 'Refraction Phase Motion', eyeStructure: 'Crystal Prism Eyes',
    wings: false, tail: false, glowingSkin: true,
    energySignature: 'Light Refraction Spectrum', silhouetteStyle: 'Geometric Crystal Silhouette',
  },
};

// ── CIVILIZATION DATABASE (all 12 CivilizationType entries) ──────────────────

export const CIVILIZATION_DATABASE: Record<CivilizationType, CivilizationProfile> = {
  FUTURISTIC_EMPIRE: {
    civilizationType: 'FUTURISTIC_EMPIRE', architectureStyle: 'Mega-Tower Spires',
    technologyLevel: 'Post-Human Technology', colorIdentity: 'Silver + White + Blue',
    combatStyle: 'Energy Weapons', clothingStyle: 'Uniform Tech Suits', symbolism: 'Imperial Data Glyphs',
  },
  ANCIENT_KINGDOM: {
    civilizationType: 'ANCIENT_KINGDOM', architectureStyle: 'Stone Pillar Columns',
    technologyLevel: 'Pre-Industrial', colorIdentity: 'Brown + Gold + Red',
    combatStyle: 'Sword and Shield', clothingStyle: 'Ceremonial Robes + Plate Armor', symbolism: 'Royal Crests',
  },
  CYBERPUNK_CITY: {
    civilizationType: 'CYBERPUNK_CITY', architectureStyle: 'Neon Megacity Skyline',
    technologyLevel: 'Hyper Advanced', colorIdentity: 'Purple + Cyan + Neon Pink',
    combatStyle: 'Tech Combat + Augmented Weapons', clothingStyle: 'Augmented Street Armor', symbolism: 'Digital Neon Signs',
  },
  VOLCANIC_CLANS: {
    civilizationType: 'VOLCANIC_CLANS', architectureStyle: 'Forge Halls + Lava Caves',
    technologyLevel: 'Fire-Age Technology', colorIdentity: 'Red + Orange + Black',
    combatStyle: 'Hammer + Forge Weapons', clothingStyle: 'Heat-Resistant Obsidian Armor', symbolism: 'Flame Clan Marks',
  },
  SKY_TEMPLE: {
    civilizationType: 'SKY_TEMPLE', architectureStyle: 'Floating Ancient Temples',
    technologyLevel: 'Advanced Mystical Technology', colorIdentity: 'Blue + Gold',
    combatStyle: 'Energy Spears + Air Combat', clothingStyle: 'Flowing Ceremonial Robes', symbolism: 'Celestial Symbols',
  },
  UNDERWATER_REALM: {
    civilizationType: 'UNDERWATER_REALM', architectureStyle: 'Coral Abyssal Structures',
    technologyLevel: 'Bioluminescent Technology', colorIdentity: 'Blue + Green + Teal',
    combatStyle: 'Current Trident Weapons', clothingStyle: 'Bioluminescent Garments', symbolism: 'Deep Wave Runes',
  },
  INTERGALACTIC_ORDER: {
    civilizationType: 'INTERGALACTIC_ORDER', architectureStyle: 'Modular Station Architecture',
    technologyLevel: 'Galactic Technology', colorIdentity: 'White + Blue + Gold',
    combatStyle: 'Energy Beam Combat', clothingStyle: 'Flight Suits + Rank Insignia', symbolism: 'Star Map Crests',
  },
  HIVE_COLONY: {
    civilizationType: 'HIVE_COLONY', architectureStyle: 'Organic Tunnel Networks',
    technologyLevel: 'Bio-Technology', colorIdentity: 'Brown + Black + Amber',
    combatStyle: 'Venom + Swarm Tactics', clothingStyle: 'Chitin Bio-Armor', symbolism: 'Hive Queen Marks',
  },
  NOMADIC_TRIBES: {
    civilizationType: 'NOMADIC_TRIBES', architectureStyle: 'Mobile Tent + Wagon',
    technologyLevel: 'Nature Technology', colorIdentity: 'Earth Tones + Bone White',
    combatStyle: 'Thrown + Bow Weapons', clothingStyle: 'Fur + Leather Layers', symbolism: 'Totemic Animal Marks',
  },
  MYSTICAL_REALM: {
    civilizationType: 'MYSTICAL_REALM', architectureStyle: 'Floating Rune Stone Towers',
    technologyLevel: 'Magic Technology', colorIdentity: 'Purple + Gold + Teal',
    combatStyle: 'Spell Casting + Magic Staves', clothingStyle: 'Enchanted Flowing Robes', symbolism: 'Arcane Rune Circles',
  },
  MECHANICAL_WORLD: {
    civilizationType: 'MECHANICAL_WORLD', architectureStyle: 'Clockwork Gear Towers',
    technologyLevel: 'Steam Automaton Technology', colorIdentity: 'Bronze + Brass + Black',
    combatStyle: 'Automaton Combat', clothingStyle: 'Engineer Coat + Goggles', symbolism: 'Gear Crest Emblems',
  },
  RUINED_APOCALYPSE: {
    civilizationType: 'RUINED_APOCALYPSE', architectureStyle: 'Crumbling Rubble Fields',
    technologyLevel: 'Salvaged Scrap Technology', colorIdentity: 'Gray + Rust + Dried Blood',
    combatStyle: 'Scrap Melee Weapons', clothingStyle: 'Patchwork Survivor Armor', symbolism: 'Scratched Survival Marks',
  },
};

// ── Species + Civilization detection keyword maps ─────────────────────────────

const SPECIES_KEYWORDS: Array<{ keywords: string[]; type: SpeciesType }> = [
  { keywords: ['avian', 'bird', 'feathered', 'winged being', 'hawk'], type: 'AVIAN' },
  { keywords: ['reptilian', 'scaled', 'lizard', 'serpent being', 'reptile'], type: 'REPTILIAN' },
  { keywords: ['insect', 'bug', 'chitinous', 'exoskeleton', 'hive being'], type: 'INSECTOID' },
  { keywords: ['aquatic', 'fish being', 'marine being', 'sea creature', 'mermaid'], type: 'AQUATIC' },
  { keywords: ['celestial being', 'divine being', 'ethereal being', 'star being'], type: 'CELESTIAL' },
  { keywords: ['shadow entity', 'void being', 'darkness entity', 'shadow creature'], type: 'SHADOW_ENTITY' },
  { keywords: ['energy being', 'plasma being', 'living energy', 'pure energy'], type: 'ENERGY_BEING' },
  { keywords: ['cyborg', 'half machine', 'augmented human', 'bionic'], type: 'CYBORG' },
  { keywords: ['android', 'synthetic', 'robot humanoid', 'artificial being'], type: 'SYNTHETIC' },
  { keywords: ['plant being', 'botanical', 'tree creature', 'vine creature'], type: 'PLANT_BASED' },
  { keywords: ['giant', 'titan', 'colossal being', 'massive giant'], type: 'GIANT' },
  { keywords: ['demon', 'demonic', 'hellish', 'infernal being'], type: 'DEMONIC' },
  { keywords: ['angel', 'angelic', 'seraph', 'divine warrior'], type: 'ANGELIC' },
  { keywords: ['hybrid', 'half-breed', 'mixed species', 'crossbreed'], type: 'HYBRID' },
  { keywords: ['crystal being', 'crystalline', 'gem creature', 'prism being'], type: 'CRYSTALLINE' },
];

const CIVILIZATION_KEYWORDS: Array<{ keywords: string[]; type: CivilizationType }> = [
  { keywords: ['floating temple', 'sky temple', 'celestial temple', 'temple in the sky'], type: 'SKY_TEMPLE' },
  { keywords: ['cyberpunk', 'neon city', 'augmented city', 'cyber city'], type: 'CYBERPUNK_CITY' },
  { keywords: ['ancient kingdom', 'old kingdom', 'stone kingdom', 'ruins kingdom'], type: 'ANCIENT_KINGDOM' },
  { keywords: ['volcano', 'volcanic', 'lava forge', 'fire clan', 'lava city'], type: 'VOLCANIC_CLANS' },
  { keywords: ['underwater city', 'deep sea city', 'ocean realm', 'coral city'], type: 'UNDERWATER_REALM' },
  { keywords: ['space station', 'galactic order', 'intergalactic', 'star fleet'], type: 'INTERGALACTIC_ORDER' },
  { keywords: ['hive', 'colony', 'swarm nest', 'insect city'], type: 'HIVE_COLONY' },
  { keywords: ['nomadic', 'wandering tribe', 'nomad camp', 'tribal lands'], type: 'NOMADIC_TRIBES' },
  { keywords: ['magical realm', 'mystical realm', 'enchanted kingdom', 'arcane world'], type: 'MYSTICAL_REALM' },
  { keywords: ['clockwork', 'steampunk', 'mechanical world', 'gear city'], type: 'MECHANICAL_WORLD' },
  { keywords: ['apocalypse', 'ruined city', 'wasteland', 'post-apocalyptic'], type: 'RUINED_APOCALYPSE' },
  { keywords: ['futuristic empire', 'mega-city', 'future city', 'tech empire', 'advanced empire'], type: 'FUTURISTIC_EMPIRE' },
];

// ── UniversalAIInterpreter.interpretCharacter() ───────────────────────────────

function detectSpecies(d: string): SpeciesType | null {
  for (const { keywords, type } of SPECIES_KEYWORDS) {
    if (keywords.some(k => d.includes(k))) return type;
  }
  return null;
}

function detectCivilization(d: string): CivilizationType | null {
  for (const { keywords, type } of CIVILIZATION_KEYWORDS) {
    if (keywords.some(k => d.includes(k))) return type;
  }
  // Fallback: single keywords
  if (d.includes('temple'))          return 'SKY_TEMPLE';
  if (d.includes('cyberpunk'))       return 'CYBERPUNK_CITY';
  if (d.includes('ancient'))         return 'ANCIENT_KINGDOM';
  if (d.includes('futuristic'))      return 'FUTURISTIC_EMPIRE';
  if (d.includes('underwater'))      return 'UNDERWATER_REALM';
  if (d.includes('space'))           return 'INTERGALACTIC_ORDER';
  return null;
}

function detectMotion(d: string): MotionType | null {
  if (d.includes('gliding') || d.includes('soaring'))                           return 'GLIDING';
  if (d.includes('falling') || d.includes('plummeting'))                        return 'FALLING';
  if (d.includes('leaping') || d.includes('bounding'))                          return 'LEAPING';
  if (d.includes('charging') || d.includes('rushing'))                          return 'CHARGING';
  if (d.includes('floating') || d.includes('hovering'))                         return 'FLOATING';
  if (d.includes('attacking') || d.includes('striking'))                        return 'ATTACKING';
  if (d.includes('descending') || d.includes('gliding down') || d.includes('down through')) return 'DESCENDING';
  if (d.includes('ascending') || d.includes('rising') || d.includes('flying up')) return 'ASCENDING';
  if (d.includes('running') || d.includes('sprinting'))                         return 'RUNNING';
  if (d.includes('impact') || d.includes('crashing') || d.includes('landing')) return 'IMPACT';
  return null;
}

function detectEmotionalTone(d: string): EmotionalToneScene {
  if (d.includes('awe') || d.includes('divine') || d.includes('holy'))           return 'DIVINE';
  if (d.includes('heroic') || d.includes('triumphant'))                          return 'HEROIC';
  if (d.includes('epic') || d.includes('legendary'))                             return 'EPIC';
  if (d.includes('fearful') || d.includes('terrified') || d.includes('horror')) return 'FEARFUL';
  if (d.includes('chaotic') || d.includes('frenzied') || d.includes('panic'))   return 'CHAOTIC';
  if (d.includes('mystical') || d.includes('magical') || d.includes('arcane'))  return 'MYSTICAL';
  if (d.includes('hopeful') || d.includes('inspired'))                           return 'HOPEFUL';
  if (d.includes('intimidating') || d.includes('looming') || d.includes('dread')) return 'INTIMIDATING';
  if (d.includes('dark') || d.includes('sinister') || d.includes('grim'))       return 'DARK';
  if (d.includes('tragic') || d.includes('sorrowful') || d.includes('grief'))   return 'TRAGIC';
  return 'EPIC';
}

function detectCamera(d: string): { label: string; id: string } | null {
  if (d.includes("worm") || d.includes("worm's-eye"))           return { label: "Worm's Eye View",    id: 'WORM_EYE_VIEW'      };
  if (d.includes('low-angle') || d.includes('low angle'))       return { label: 'Cinematic Low Angle', id: 'CINEMATIC_LOW_ANGLE' };
  if (d.includes('bird') || d.includes("bird's eye"))           return { label: "Bird's Eye View",     id: 'BIRD_EYE_VIEW'      };
  if (d.includes('dutch'))                                       return { label: 'Dutch Angle',         id: 'DUTCH_ANGLE'        };
  if (d.includes('close-up') || d.includes('closeup'))          return { label: 'Close-Up',            id: 'CLOSE_UP'           };
  if (d.includes('wide shot') || d.includes('wide-shot'))       return { label: 'Wide Shot',           id: 'WIDE_SHOT'          };
  if (d.includes('over shoulder'))                               return { label: 'Over Shoulder',       id: 'OVER_SHOULDER'      };
  if (d.includes('tracking'))                                    return { label: 'Action Tracking',     id: 'ACTION_TRACKING'    };
  return null;
}

function detectEnvironment(d: string): string | null {
  if (d.includes('mountain'))       return 'Snowy Mountains';
  if (d.includes('temple') || d.includes('floating temple')) return 'Floating Sky Temples';
  if (d.includes('city') || d.includes('skyline'))           return 'City Environment';
  if (d.includes('rooftop'))        return 'Rooftop Scene';
  if (d.includes('underwater') || d.includes('ocean'))       return 'Underwater Realm';
  if (d.includes('forest'))         return 'Dense Forest';
  if (d.includes('space') || d.includes('cosmos'))           return 'Deep Space';
  if (d.includes('volcano'))        return 'Volcanic Landscape';
  if (d.includes('ruins'))          return 'Ancient Ruins';
  if (d.includes('desert'))         return 'Barren Desert';
  if (d.includes('snow') || d.includes('arctic')) return 'Frozen Arctic';
  return null;
}

function detectCrowdBehavior(d: string): string | null {
  if (d.includes('people looking up') || d.includes('looking upward') || d.includes('civilians look')) return 'Crowd Looking Upward In Awe';
  if (d.includes('fleeing') || d.includes('running away') || d.includes('scatter'))                     return 'Crowd Fleeing In Panic';
  if (d.includes('cheering') || d.includes('celebrating') || d.includes('celebrate'))                   return 'Crowd Cheering And Celebrating';
  if (d.includes('bowing') || d.includes('kneeling'))                                                   return 'Crowd Bowing In Reverence';
  if (d.includes('civilians') || d.includes('people') || d.includes('crowd'))                           return 'Crowd Witnesses Present';
  return null;
}

// ── interpretUniversalCharacter — Java UniversalAIInterpreter.interpretCharacter() ──

export function interpretUniversalCharacter(description: string): {
  speciesDNA: SpeciesDNA | null;
  civilization: CivilizationProfile | null;
} {
  const d = description.toLowerCase();
  const speciesType = detectSpecies(d);
  const civType     = detectCivilization(d);
  return {
    speciesDNA:   speciesType ? SPECIES_DATABASE[speciesType]  : null,
    civilization: civType     ? CIVILIZATION_DATABASE[civType] : null,
  };
}

// ── interpretUniversalScene — Java UniversalAIInterpreter.interpretScene() ────

export function interpretUniversalScene(description: string): SceneUnderstanding {
  const d = description.toLowerCase();
  const cam = detectCamera(d);
  return {
    cameraType:       cam?.label ?? null,
    directorCameraId: cam?.id    ?? null,
    motionType:       detectMotion(d),
    emotionalTone:    detectEmotionalTone(d),
    environment:      detectEnvironment(d),
    lighting:         d.includes('energy field') ? 'Volumetric Energy Lighting'
                    : d.includes('neon')          ? 'Neon City Lighting'
                    : d.includes('glow')          ? 'Bioluminescent Glow'
                    : d.includes('sunset') || d.includes('golden') ? 'Golden Hour'
                    : 'Cinematic Contrast Lighting',
    crowdBehavior:    detectCrowdBehavior(d),
    composition:      d.includes('upward') || d.includes('descend') ? 'Vertical Cinematic Hierarchy'
                    : d.includes('wide') || d.includes('team')      ? 'Horizontal Epic Spread'
                    : 'Dynamic Diagonal Composition',
    atmosphere:       d.includes('energy') || d.includes('glow') ? 'Energy Field Atmosphere'
                    : d.includes('fog') || d.includes('mist')     ? 'Atmospheric Fog'
                    : d.includes('storm') || d.includes('thunder') ? 'Storm Atmosphere'
                    : 'Cinematic Depth Atmosphere',
  };
}

// ── generateCinematicTips — Java CinematicTrainingSystem.generateTips() ───────

export function generateCinematicTips(description: string): Array<{ title: string; message: string }> {
  const tips: Array<{ title: string; message: string }> = [];
  const d = description.toLowerCase();

  if (d.includes('worm') || d.includes("worm's-eye"))
    tips.push({ title: "Worm's-Eye Perspective", message: "Worm's-eye cameras exaggerate scale and make characters feel legendary." });
  if (d.includes('gliding') || d.includes('soaring') || d.includes('floating'))
    tips.push({ title: "Aerial Motion", message: "Curved motion lines and flowing cloth help gliding poses feel more natural." });
  if (d.includes('people looking up') || d.includes('civilians') || d.includes('crowd'))
    tips.push({ title: "Crowd Reactions", message: "Crowd reactions increase scale, emotion, and cinematic storytelling impact." });
  if (d.includes('temple') || d.includes('floating'))
    tips.push({ title: "Environment Scale", message: "Floating architecture behind a character creates cinematic depth and spiritual grandeur." });
  if (d.includes('energy') || d.includes('glow'))
    tips.push({ title: "Energy FX", message: "Energy fields look best with volumetric lighting — light scattering around the character." });
  if (d.includes('avian') || d.includes('wing'))
    tips.push({ title: "Wing Silhouette", message: "Spread wings create a natural focal frame — compose the character between the wing edges." });
  if (d.includes('reptilian') || d.includes('tail'))
    tips.push({ title: "Tail Dynamics", message: "A tail in motion adds weight and balance to reptilian species — let it arc opposite the lean." });
  if (d.includes('demonic') || d.includes('demon'))
    tips.push({ title: "Demonic Silhouette", message: "Horns, wings, and tail extend the silhouette in all directions — use negative space deliberately." });
  if (d.includes('giant') || d.includes('titan'))
    tips.push({ title: "Scale Contrast", message: "Human figures at the base of a giant create immediate scale understanding — add them even if small." });

  if (tips.length === 0)
    tips.push({ title: "Universal Director Tip", message: "Combine species biology + civilization architecture in the background to create a rich world instantly." });

  return tips;
}

// ── Full interpretation (combines character + scene) ─────────────────────────

export function interpretUniversal(description: string): UniversalInterpretation {
  const { speciesDNA, civilization } = interpretUniversalCharacter(description);
  const scene = interpretUniversalScene(description);
  const tips  = generateCinematicTips(description);
  return { speciesDNA, civilization, scene, tips };
}

// ── Prompt fragment builders ──────────────────────────────────────────────────

export function buildSpeciesFragment(dna: SpeciesDNA): string {
  const traits: string[] = [];
  if (dna.wings)       traits.push('Wings');
  if (dna.tail)        traits.push('Tail');
  if (dna.glowingSkin) traits.push('Glowing Skin');
  return [
    `Species: ${dna.speciesType.replace(/_/g, ' ')}.`,
    `Body structure: ${dna.bodyStructure}.`,
    `Skin: ${dna.skinTexture}.`,
    `Movement: ${dna.movementStyle}.`,
    `Eyes: ${dna.eyeStructure}.`,
    traits.length > 0 ? `Traits: ${traits.join(', ')}.` : null,
    dna.energySignature !== 'None' ? `Energy: ${dna.energySignature}.` : null,
    `Silhouette: ${dna.silhouetteStyle}.`,
  ].filter(Boolean).join(' ');
}

export function buildCivilizationFragment(civ: CivilizationProfile): string {
  return [
    `Civilization: ${civ.civilizationType.replace(/_/g, ' ')}.`,
    `Architecture: ${civ.architectureStyle}.`,
    `Technology: ${civ.technologyLevel}.`,
    `Color palette: ${civ.colorIdentity}.`,
    `Combat style: ${civ.combatStyle}.`,
    `Clothing: ${civ.clothingStyle}.`,
    `Symbolism: ${civ.symbolism}.`,
  ].join(' ');
}

export function buildSceneFragment(scene: SceneUnderstanding): string {
  return [
    scene.cameraType    ? `Camera: ${scene.cameraType}.`          : null,
    scene.motionType    ? `Motion: ${scene.motionType.replace(/_/g, ' ')}.` : null,
    scene.environment   ? `Environment: ${scene.environment}.`    : null,
    scene.crowdBehavior ? `Crowd: ${scene.crowdBehavior}.`        : null,
    `Lighting: ${scene.lighting}.`,
    `Composition: ${scene.composition}.`,
    `Atmosphere: ${scene.atmosphere}.`,
    `Emotional tone: ${scene.emotionalTone}.`,
  ].filter(Boolean).join(' ');
}

export function buildUniversalFragment(interp: UniversalInterpretation): string {
  const parts: string[] = [];
  if (interp.speciesDNA)   parts.push(buildSpeciesFragment(interp.speciesDNA));
  if (interp.civilization) parts.push(buildCivilizationFragment(interp.civilization));
  parts.push(buildSceneFragment(interp.scene));
  return parts.join(' ');
}

// ── Display helpers ───────────────────────────────────────────────────────────

export const SPECIES_EMOJI: Record<SpeciesType, string> = {
  HUMAN: '👤', AVIAN: '🦅', REPTILIAN: '🦎', INSECTOID: '🦗', AQUATIC: '🐟',
  CELESTIAL: '✨', SHADOW_ENTITY: '🌑', ENERGY_BEING: '⚡', CYBORG: '🤖', SYNTHETIC: '🔩',
  PLANT_BASED: '🌿', GIANT: '🗿', DEMONIC: '😈', ANGELIC: '😇', HYBRID: '🧬', CRYSTALLINE: '💎',
};

export const CIVILIZATION_EMOJI: Record<CivilizationType, string> = {
  FUTURISTIC_EMPIRE: '🏙️', ANCIENT_KINGDOM: '🏛️', CYBERPUNK_CITY: '💜', VOLCANIC_CLANS: '🌋',
  SKY_TEMPLE: '⛩️', UNDERWATER_REALM: '🌊', INTERGALACTIC_ORDER: '🚀', HIVE_COLONY: '🐝',
  NOMADIC_TRIBES: '🏕️', MYSTICAL_REALM: '🔮', MECHANICAL_WORLD: '⚙️', RUINED_APOCALYPSE: '💀',
};

export const EMOTIONAL_TONE_COLOR: Record<EmotionalToneScene, string> = {
  HEROIC: '#FFD600', EPIC: '#FF6A00', FEARFUL: '#94A3B8', CHAOTIC: '#E8001C',
  MYSTICAL: '#A78BFA', HOPEFUL: '#22C55E', INTIMIDATING: '#F97316', DIVINE: '#FDE68A',
  DARK: '#374151', TRAGIC: '#6366F1',
};

export const MOTION_EMOJI: Record<MotionType, string> = {
  GLIDING: '🦅', FALLING: '⬇️', LEAPING: '🦘', CHARGING: '⚡', FLOATING: '🌌',
  ATTACKING: '⚔️', DESCENDING: '↘️', ASCENDING: '↗️', RUNNING: '💨', IMPACT: '💥',
};
