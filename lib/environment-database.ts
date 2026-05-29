// ============================================================================
// COMIC ART STUDIO
// ENVIRONMENT + AERIAL COMIC INTELLIGENCE DATABASE
// VERSION 1.0 — TypeScript port from JS reference file
// ============================================================================

// ── Types ─────────────────────────────────────────────────────────────────────

export interface AerialPose {
  id: string;
  name: string;
  category: string;
  momentum: string;
  perspective: string;
  lineOfAction: string;
  cameraAngles: string[];
  traits: string[];
  environments?: string[];
}

export interface CityEnvironment {
  id: string;
  name: string;
  genre: string;
  architecture: string[];
  lighting: string[];
  atmosphere: string[];
  cameraStyles?: string[];
  storytellingTraits: string[];
}

export interface InteriorEnvironment {
  id: string;
  name: string;
  category: string;
  traits: string[];
  mood: string[];
  cameraStyles?: string[];
}

export interface CameraLanguage {
  id: string;
  name: string;
  purpose: string;
  emotionalEffect: string;
  usage: string[];
}

export interface AtmospherePreset {
  id: string;
  traits: string[];
}

export interface SceneInterpretation {
  aerialAction: boolean;
  cityEnvironment: boolean;
  cinematicShot: boolean;
  weather: string | null;
  mood: string[];
  perspective: string | null;
}

// ── Database ──────────────────────────────────────────────────────────────────

export const COMIC_ENVIRONMENT_DATABASE = {

  // ── Aerial Action Archetypes ────────────────────────────────────────────────
  aerialPoses: [
    {
      id: 'rooftopLeap',
      name: 'Rooftop Leap',
      category: 'Traversal',
      momentum: 'Forward',
      perspective: 'ThreePoint',
      lineOfAction: 'Diagonal',
      cameraAngles: ['BirdsEye', 'WormsEye', 'SideTracking'],
      traits: ['foreshortening', 'cityDepth', 'speed', 'dynamicCapeFlow', 'impactLanding'],
      environments: ['CyberpunkCity', 'GothicCity', 'ModernCity'],
    },
    {
      id: 'skyDive',
      name: 'Sky Dive',
      category: 'Falling',
      momentum: 'Vertical',
      perspective: 'ExtremeDepth',
      lineOfAction: 'StraightDown',
      cameraAngles: ['TopDown', 'Orbit', 'FirstPerson'],
      traits: ['motionBlur', 'gravityPull', 'windDistortion', 'capeWhip', 'buildingCompression'],
    },
    {
      id: 'wallRun',
      name: 'Wall Run',
      category: 'Parkour',
      momentum: 'UpwardDiagonal',
      perspective: 'ThreePoint',
      lineOfAction: 'Curve',
      cameraAngles: ['TiltedDutch', 'TrackingShot'],
      traits: ['speedLines', 'handContact', 'shoeImpact', 'urbanMomentum'],
    },
    {
      id: 'gargoylePerch',
      name: 'Gargoyle Perch',
      category: 'Stealth',
      momentum: 'Static',
      perspective: 'WideLens',
      lineOfAction: 'CrouchedCurve',
      cameraAngles: ['LowAngle', 'Silhouette'],
      traits: ['brooding', 'capeDrape', 'cityObservation', 'rainAtmosphere'],
    },
    {
      id: 'buildingSwing',
      name: 'Building Swing',
      category: 'Traversal',
      momentum: 'ArcSwing',
      perspective: 'ThreePoint',
      lineOfAction: 'Arc',
      cameraAngles: ['SideTracking', 'LowAngle', 'WormsEye'],
      traits: ['webLine', 'momentum', 'cityBackground', 'dynamicPose'],
      environments: ['ModernCity', 'CyberpunkCity'],
    },
    {
      id: 'aerialCombat',
      name: 'Aerial Combat',
      category: 'Combat',
      momentum: 'MultiDirection',
      perspective: 'DynamicAngle',
      lineOfAction: 'CrossDiagonal',
      cameraAngles: ['Orbit', 'TiltedDutch', 'WormsEye'],
      traits: ['impactBurst', 'speedLines', 'cloudDepth', 'energyTrail'],
      environments: ['CloudLayer', 'CyberpunkCity'],
    },
  ] as AerialPose[],

  // ── City Environment Archetypes ────────────────────────────────────────────
  cityEnvironments: [
    {
      id: 'neoTokyo',
      name: 'Neo Tokyo',
      genre: 'Cyberpunk',
      architecture: ['megaBillboards', 'stackedBuildings', 'neonDensity', 'skyRails', 'holograms'],
      lighting: ['neonBlue', 'magentaGlow', 'rainReflections'],
      atmosphere: ['denseFog', 'electricRain', 'crowded'],
      cameraStyles: ['wideEstablishing', 'verticalTracking', 'droneView'],
      storytellingTraits: ['urbanIsolation', 'overwhelmingScale', 'corporateOppression'],
    },
    {
      id: 'gothamStyle',
      name: 'Gothic Noir City',
      genre: 'Noir',
      architecture: ['gargoyles', 'cathedrals', 'stoneTowers', 'narrowAlleys'],
      lighting: ['moonlight', 'spotlights', 'wetStreetReflections'],
      atmosphere: ['fog', 'rain', 'heavyShadows'],
      storytellingTraits: ['fear', 'mystery', 'urbanDecay'],
    },
    {
      id: 'floatingCity',
      name: 'Floating Sky City',
      genre: 'FantasySciFi',
      architecture: ['floatingPlatforms', 'crystalStructures', 'goldenBridges'],
      lighting: ['sunRays', 'etherealGlow'],
      atmosphere: ['cloudOcean', 'cleanAir'],
      storytellingTraits: ['wonder', 'godlikeScale', 'advancedCivilization'],
    },
    {
      id: 'wasteland',
      name: 'Post-Apocalyptic Wasteland',
      genre: 'PostApoc',
      architecture: ['ruinedSkyscrapers', 'rubble', 'abandonedHighways'],
      lighting: ['ashSky', 'redSunset', 'dustBeams'],
      atmosphere: ['dustStorms', 'emptiness', 'desolation'],
      storytellingTraits: ['survival', 'hopelessness', 'lastStand'],
    },
    {
      id: 'ancientCity',
      name: 'Ancient Epic City',
      genre: 'Fantasy',
      architecture: ['collossalStatues', 'stoneTemples', 'marketPlazas', 'fortressWalls'],
      lighting: ['torchFire', 'goldenSunrise', 'moonbeams'],
      atmosphere: ['dustParticles', 'mysticalEnergy', 'epic'],
      storytellingTraits: ['mythology', 'godhood', 'epicScale'],
    },
  ] as CityEnvironment[],

  // ── Interior Environments ─────────────────────────────────────────────────
  interiorEnvironments: [
    {
      id: 'heroHQ',
      name: 'Hero Headquarters',
      category: 'Base',
      traits: ['largeScreens', 'missionTables', 'trainingAreas', 'techWalls'],
      mood: ['focused', 'strategic', 'highTech'],
      cameraStyles: ['wideRoomShot', 'overShoulder', 'groupComposition'],
    },
    {
      id: 'madScientistLab',
      name: 'Mad Scientist Lab',
      category: 'Laboratory',
      traits: ['chaoticEquipment', 'electricity', 'glowingLiquids', 'mechanicalArms'],
      mood: ['unstable', 'dangerous', 'experimental'],
    },
    {
      id: 'medievalThroneRoom',
      name: 'Medieval Throne Room',
      category: 'Fantasy',
      traits: ['stoneColumns', 'banners', 'goldTrim', 'torchFire'],
      mood: ['authority', 'ceremony', 'tension'],
    },
    {
      id: 'spaceStation',
      name: 'Space Station',
      category: 'SciFi',
      traits: ['zeroGravityHint', 'metalCorridors', 'starViewports', 'holographicPanels'],
      mood: ['isolation', 'cosmic', 'clinical'],
    },
    {
      id: 'villainLair',
      name: 'Villain Lair',
      category: 'Lair',
      traits: ['darknessContrast', 'dramaticLighting', 'henchmenRows', 'centralThroneArea'],
      mood: ['menace', 'power', 'drama'],
    },
  ] as InteriorEnvironment[],

  // ── Camera Language System ────────────────────────────────────────────────
  comicCameraSystem: [
    { id: 'birdsEye',    name: "Bird's Eye View",  purpose: 'Show scale and vulnerability', emotionalEffect: 'Overwhelming', usage: ['cityTraversal', 'warScenes', 'massiveScale'] },
    { id: 'wormsEye',    name: "Worm's Eye View",  purpose: 'Increase hero dominance',      emotionalEffect: 'Power',        usage: ['heroReveal', 'toweringCharacters'] },
    { id: 'dutchAngle',  name: 'Dutch Angle',       purpose: 'Create instability',           emotionalEffect: 'Chaos',        usage: ['combat', 'psychologicalScenes'] },
    { id: 'trackingShot',name: 'Tracking Shot',     purpose: 'Follow motion dynamically',    emotionalEffect: 'Momentum',     usage: ['running', 'flying', 'vehicleChases'] },
  ] as CameraLanguage[],

  // ── Storytelling Rules ────────────────────────────────────────────────────
  storytellingRules: {
    eyeFlowPatterns: ['ZFlow', 'SpiralFlow', 'DiagonalFlow', 'CenterExplosion'],
    depthLayering: {
      foreground: 'Close objects frame action',
      midground: 'Primary character interaction',
      background: 'World scale and storytelling',
    },
    cinematicComposition: [
      'ruleOfThirds', 'leadingLines', 'framing',
      'silhouetteReadability', 'negativeSpace', 'visualWeight',
    ],
    atmosphereRules: [
      'rainAddsDrama', 'fogAddsMystery', 'neonAddsEnergy',
      'fireAddsChaos', 'snowAddsIsolation',
    ],
  },

  // ── Weather + Atmosphere System ───────────────────────────────────────────
  atmosphereDatabase: [
    { id: 'neonRain',     name: 'Neon Rain',       emoji: '🌧',  traits: ['wetReflections', 'lightBloom', 'denseFog', 'surfaceGlow'] },
    { id: 'snowStorm',    name: 'Snow Storm',       emoji: '❄️',  traits: ['reducedVisibility', 'coldLighting', 'windMotion'] },
    { id: 'desertHeat',   name: 'Desert Heat',      emoji: '☀️',  traits: ['heatDistortion', 'dryDust', 'sunBleach'] },
    { id: 'electricStorm',name: 'Electric Storm',   emoji: '⚡',  traits: ['lightningFlashes', 'darkClouds', 'crackling'] },
    { id: 'ashFall',      name: 'Ash Fall',         emoji: '🌑',  traits: ['ashParticles', 'redSky', 'smokyAir', 'apocalypticTone'] },
    { id: 'clearNight',   name: 'Clear Night',      emoji: '🌙',  traits: ['starfield', 'moonShadows', 'crispEdges', 'silhouetteReady'] },
  ],

  // ── AI Scene Interpreter (ported from JS aiSceneInterpreter) ──────────────
  aiSceneInterpreter(userPrompt: string): SceneInterpretation {
    const result: SceneInterpretation = {
      aerialAction:    false,
      cityEnvironment: false,
      cinematicShot:   false,
      weather:         null,
      mood:            [],
      perspective:     null,
    };

    const p = userPrompt.toLowerCase();

    // City detection
    if (p.includes('city') || p.includes('rooftop') || p.includes('building') || p.includes('skyline') || p.includes('street') || p.includes('alley')) {
      result.cityEnvironment = true;
    }

    // Aerial detection
    if (p.includes('jump') || p.includes('leap') || p.includes('fall') || p.includes('swing') || p.includes('fly') || p.includes('soar') || p.includes('dive')) {
      result.aerialAction = true;
    }

    // Weather
    if (p.includes('rain') || p.includes('storm') || p.includes('wet'))  result.weather = 'neonRain';
    if (p.includes('snow') || p.includes('blizzard') || p.includes('cold')) result.weather = 'snowStorm';
    if (p.includes('desert') || p.includes('heat') || p.includes('sand')) result.weather = 'desertHeat';
    if (p.includes('ash') || p.includes('apocalypse') || p.includes('burned')) result.weather = 'ashFall';
    if (p.includes('night') && !result.weather) result.weather = 'clearNight';
    if (p.includes('lightning') || p.includes('thunder') || p.includes('electric')) result.weather = 'electricStorm';

    // Mood
    if (p.includes('dark') || p.includes('fear') || p.includes('shadow') || p.includes('noir')) result.mood.push('Noir');
    if (p.includes('epic') || p.includes('massive') || p.includes('huge') || p.includes('god')) result.mood.push('Epic');
    if (p.includes('cyber') || p.includes('neon') || p.includes('tech') || p.includes('future')) result.mood.push('Cyberpunk');
    if (p.includes('ancient') || p.includes('myth') || p.includes('temple') || p.includes('god')) result.mood.push('Fantasy');

    // Camera
    if (p.includes('huge') || p.includes('massive') || p.includes('scale') || p.includes('army')) result.perspective = 'BirdsEye';
    if (p.includes('tower') || p.includes('loom') || p.includes('above')) result.perspective = 'WormsEye';

    return result;
  },
} as const;

// ── All location options combined (cities + interiors) ────────────────────────
export type LocationEntry =
  | (CityEnvironment & { kind: 'city' })
  | (InteriorEnvironment & { kind: 'interior' });

export const ALL_LOCATIONS: LocationEntry[] = [
  ...COMIC_ENVIRONMENT_DATABASE.cityEnvironments.map(c => ({ ...c, kind: 'city' as const })),
  ...COMIC_ENVIRONMENT_DATABASE.interiorEnvironments.map(i => ({ ...i, kind: 'interior' as const })),
];

// ── Active environment state shape ────────────────────────────────────────────
export interface ActiveEnvironment {
  locationId: string | null;
  atmosphereId: string | null;
  aerialPoseId: string | null;
  detectedMood: string[];
}

export const BLANK_ENVIRONMENT: ActiveEnvironment = {
  locationId:    null,
  atmosphereId:  null,
  aerialPoseId:  null,
  detectedMood:  [],
};

// ── Prompt fragment builder ───────────────────────────────────────────────────
export function buildEnvironmentFragment(env: ActiveEnvironment): string | null {
  const parts: string[] = [];
  const { atmosphereDatabase, cityEnvironments, interiorEnvironments, aerialPoses } = COMIC_ENVIRONMENT_DATABASE;

  if (env.locationId) {
    const loc =
      [...cityEnvironments, ...interiorEnvironments].find(l => l.id === env.locationId);
    if (loc) parts.push(`Setting: ${loc.name}.`);
  }

  if (env.atmosphereId) {
    const atm = atmosphereDatabase.find(a => a.id === env.atmosphereId);
    if (atm) parts.push(`Atmosphere: ${atm.name} — ${atm.traits.slice(0, 2).join(', ')}.`);
  }

  if (env.aerialPoseId) {
    const ap = aerialPoses.find(a => a.id === env.aerialPoseId);
    if (ap) parts.push(`Aerial context: ${ap.name}, ${ap.momentum} momentum.`);
  }

  if (env.detectedMood.length > 0) {
    parts.push(`Mood: ${env.detectedMood.join(' · ')}.`);
  }

  if (parts.length === 0) return null;

  return [
    ...parts,
    'Foreground/midground/background depth layering.',
    'Cinematic comic storytelling.',
  ].join(' ');
}

// ── Genre color palette (used by EnvironmentModal) ───────────────────────────
export const GENRE_COLORS: Record<string, string> = {
  Cyberpunk:    '#00E5FF',
  Noir:         '#94A3B8',
  FantasySciFi: '#A78BFA',
  PostApoc:     '#F87171',
  Fantasy:      '#D4AF37',
  Base:         '#FFD600',
  Laboratory:   '#22C55E',
  SciFi:        '#38BDF8',
  Lair:         '#E8001C',
};
