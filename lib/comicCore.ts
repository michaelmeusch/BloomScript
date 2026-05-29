/* ============================================================
   COMIC ART STUDIO CORE
   Master AI Director System — Full Orchestration Architecture
   TypeScript port of the Master Java/TS Blueprint
   ============================================================ */

// ── Genres ───────────────────────────────────────────────────────────────────

export enum ComicGenre {
  SUPERHERO        = 'SUPERHERO',
  COSMIC           = 'COSMIC',
  SCI_FI           = 'SCI_FI',
  CYBERPUNK        = 'CYBERPUNK',
  HORROR           = 'HORROR',
  FANTASY          = 'FANTASY',
  DARK_FANTASY     = 'DARK_FANTASY',
  NOIR             = 'NOIR',
  DETECTIVE        = 'DETECTIVE',
  POST_APOCALYPTIC = 'POST_APOCALYPTIC',
  MARTIAL_ARTS     = 'MARTIAL_ARTS',
  WAR              = 'WAR',
  WESTERN          = 'WESTERN',
  STEAMPUNK        = 'STEAMPUNK',
  GOTHIC           = 'GOTHIC',
  MYTHOLOGICAL     = 'MYTHOLOGICAL',
  ROMANCE          = 'ROMANCE',
  SLICE_OF_LIFE    = 'SLICE_OF_LIFE',
  HUMOR            = 'HUMOR',
  SATIRE           = 'SATIRE',
  UNDERGROUND      = 'UNDERGROUND',
  PSYCHEDELIC      = 'PSYCHEDELIC',
  MECHA            = 'MECHA',
  MONSTER          = 'MONSTER',
  SUPERNATURAL     = 'SUPERNATURAL',
  SPACE_OPERA      = 'SPACE_OPERA',
  MANGA_ACTION     = 'MANGA_ACTION',
  MANGA_SEINEN     = 'MANGA_SEINEN',
  MANGA_SHOJO      = 'MANGA_SHOJO',
  EUROPEAN_BD      = 'EUROPEAN_BD',
  INDIE_EXPERIMENTAL = 'INDIE_EXPERIMENTAL',
  ANTHOLOGY        = 'ANTHOLOGY',
  WEBTOON          = 'WEBTOON',
}

// ── Render Languages ──────────────────────────────────────────────────────────

export enum RenderLanguage {
  DYNAMIC_ACTION         = 'DYNAMIC_ACTION',
  CINEMATIC_REALISM      = 'CINEMATIC_REALISM',
  HEAVY_INK              = 'HEAVY_INK',
  CLEAN_LINE             = 'CLEAN_LINE',
  PAINTERLY              = 'PAINTERLY',
  WATERCOLOR             = 'WATERCOLOR',
  SCREEN_TONE            = 'SCREEN_TONE',
  GRAPHIC_SHADOW         = 'GRAPHIC_SHADOW',
  GESTURAL_SKETCH        = 'GESTURAL_SKETCH',
  PSYCHEDELIC_COLOR      = 'PSYCHEDELIC_COLOR',
  NEON_NOIR              = 'NEON_NOIR',
  RETRO_PULP             = 'RETRO_PULP',
  HIGH_CONTRAST          = 'HIGH_CONTRAST',
  HALFTONE_RETRO         = 'HALFTONE_RETRO',
  DIGITAL_AIRBRUSH       = 'DIGITAL_AIRBRUSH',
  SCRATCHBOARD           = 'SCRATCHBOARD',
  ANIME_CEL              = 'ANIME_CEL',
  MINIMAL_LINEWORK       = 'MINIMAL_LINEWORK',
  GRAINY_NOIR            = 'GRAINY_NOIR',
  ABSTRACT_EXPRESSIONISM = 'ABSTRACT_EXPRESSIONISM',
}

// ── Visual Moods ──────────────────────────────────────────────────────────────

export enum VisualMood {
  HEROIC        = 'HEROIC',
  BLEAK         = 'BLEAK',
  TRIUMPHANT    = 'TRIUMPHANT',
  MELANCHOLIC   = 'MELANCHOLIC',
  APOCALYPTIC   = 'APOCALYPTIC',
  MYSTICAL      = 'MYSTICAL',
  CHAOTIC       = 'CHAOTIC',
  DREAMLIKE     = 'DREAMLIKE',
  PARANOID      = 'PARANOID',
  AGGRESSIVE    = 'AGGRESSIVE',
  WHIMSICAL     = 'WHIMSICAL',
  CLAUSTROPHOBIC = 'CLAUSTROPHOBIC',
  OPERATIC      = 'OPERATIC',
  SURREAL       = 'SURREAL',
}

// ── Camera Language ───────────────────────────────────────────────────────────

export enum CameraLanguage {
  HERO_LOW_ANGLE   = 'HERO_LOW_ANGLE',
  DUTCH_ANGLE      = 'DUTCH_ANGLE',
  OVER_SHOULDER    = 'OVER_SHOULDER',
  EXTREME_CLOSEUP  = 'EXTREME_CLOSEUP',
  WIDE_ESTABLISHING = 'WIDE_ESTABLISHING',
  TRACKING_ACTION  = 'TRACKING_ACTION',
  CINEMATIC_PAN    = 'CINEMATIC_PAN',
  INTIMATE_FACE    = 'INTIMATE_FACE',
  HORROR_POV       = 'HORROR_POV',
  SILHOUETTE_SHOT  = 'SILHOUETTE_SHOT',
}

// ── Panel Styles ──────────────────────────────────────────────────────────────

export enum PanelStyle {
  GRID_STANDARD    = 'GRID_STANDARD',
  CINEMATIC_WIDE   = 'CINEMATIC_WIDE',
  MANGA_DYNAMIC    = 'MANGA_DYNAMIC',
  CHAOTIC_ACTION   = 'CHAOTIC_ACTION',
  VERTICAL_SCROLL  = 'VERTICAL_SCROLL',
  EUROPEAN_CLEAR   = 'EUROPEAN_CLEAR',
  HORROR_FRAGMENTED = 'HORROR_FRAGMENTED',
  NOIR_SHADOWBOX   = 'NOIR_SHADOWBOX',
  SPLASH_PAGE      = 'SPLASH_PAGE',
  DIAGONAL_FLOW    = 'DIAGONAL_FLOW',
  MULTI_LAYERED    = 'MULTI_LAYERED',
  ABSTRACT_LAYOUT  = 'ABSTRACT_LAYOUT',
}

// ── Storytelling Modes ────────────────────────────────────────────────────────

export enum StorytellingMode {
  CINEMATIC         = 'CINEMATIC',
  FAST_ACTION       = 'FAST_ACTION',
  SLOW_BURN         = 'SLOW_BURN',
  EMOTIONAL         = 'EMOTIONAL',
  HORROR_TENSION    = 'HORROR_TENSION',
  MYSTERY_REVEAL    = 'MYSTERY_REVEAL',
  EPIC_SCOPE        = 'EPIC_SCOPE',
  CHARACTER_DRIVEN  = 'CHARACTER_DRIVEN',
  COMEDIC_TIMING    = 'COMEDIC_TIMING',
  DOCUMENTARY_STYLE = 'DOCUMENTARY_STYLE',
  EXPERIMENTAL_FLOW = 'EXPERIMENTAL_FLOW',
  DREAM_SEQUENCE    = 'DREAM_SEQUENCE',
}

// ── Scene Emotions ────────────────────────────────────────────────────────────

export enum SceneEmotion {
  FEAR    = 'FEAR',
  ACTION  = 'ACTION',
  LOVE    = 'LOVE',
  SADNESS = 'SADNESS',
  MYSTERY = 'MYSTERY',
  CHAOS   = 'CHAOS',
  TENSION = 'TENSION',
  WONDER  = 'WONDER',
  VICTORY = 'VICTORY',
  TRAGEDY = 'TRAGEDY',
}

// ════════════════════════════════════════════════════════════════════════════
// INTERFACES
// ════════════════════════════════════════════════════════════════════════════

export interface CharacterProfile {
  id: string;
  name: string;
  species: string;
  bodyType: string;
  facialStructure: string;
  hairstyle: string;
  costumeDescription: string;
  costumeColors: string[];
  powers: string[];
  height: number;
  muscularity: number;
  realismScale: number;
  eyeColor?: string;
  accessories?: string[];
  renderingHints?: string[];
}

export interface ComicStyleProfile {
  genre: ComicGenre;
  renderLanguage: RenderLanguage;
  storytellingMode: StorytellingMode;
  mood: VisualMood;
  panelStyle: PanelStyle;
  // Numeric parameters (0–1)
  anatomyStylization:    number;
  realismLevel:          number;
  inkDensity:            number;
  motionIntensity:       number;
  textureAmount:         number;
  environmentalDetail:   number;
  colorComplexity:       number;
  // Boolean flags
  cinematicLighting:      boolean;
  exaggeratedPerspective: boolean;
  heavyShadowing:         boolean;
  usesHalftones:          boolean;
  usesScreenTone:         boolean;
}

export interface PanelData {
  id: string;
  panelNumber: number;
  description: string;
  camera: CameraLanguage;
  panelStyle: PanelStyle;
  characters: string[];
  environment: string;
  mood: VisualMood;
  splashPage?: boolean;
}

export interface ComicPage {
  id: string;
  pageNumber: number;
  panels: PanelData[];
}

export interface ComicProjectState {
  projectId: string;
  title: string;
  genre: ComicGenre;
  styleProfile: ComicStyleProfile;
  characterDatabase: CharacterProfile[];
  pages: ComicPage[];
  continuityMemory: string[];
  promptHistory: string[];
  renderQueue: string[];
}

// ════════════════════════════════════════════════════════════════════════════
// STYLE DATABASE  — preset factory for each major genre
// ════════════════════════════════════════════════════════════════════════════

export class StyleDatabase {
  static createForGenre(genre: ComicGenre): ComicStyleProfile {
    switch (genre) {
      case ComicGenre.CYBERPUNK:
        return {
          genre, renderLanguage: RenderLanguage.NEON_NOIR,
          storytellingMode: StorytellingMode.CINEMATIC, mood: VisualMood.PARANOID,
          panelStyle: PanelStyle.CINEMATIC_WIDE,
          anatomyStylization: 0.70, realismLevel: 0.85, inkDensity: 0.80,
          motionIntensity: 0.70, textureAmount: 0.80, environmentalDetail: 1.00, colorComplexity: 0.90,
          cinematicLighting: true, exaggeratedPerspective: true, heavyShadowing: true,
          usesHalftones: false, usesScreenTone: false,
        };
      case ComicGenre.HORROR:
        return {
          genre, renderLanguage: RenderLanguage.HEAVY_INK,
          storytellingMode: StorytellingMode.HORROR_TENSION, mood: VisualMood.CLAUSTROPHOBIC,
          panelStyle: PanelStyle.HORROR_FRAGMENTED,
          anatomyStylization: 0.90, realismLevel: 0.75, inkDensity: 1.00,
          motionIntensity: 0.50, textureAmount: 0.95, environmentalDetail: 0.90, colorComplexity: 0.30,
          cinematicLighting: true, exaggeratedPerspective: true, heavyShadowing: true,
          usesHalftones: false, usesScreenTone: false,
        };
      case ComicGenre.NOIR: case ComicGenre.DETECTIVE:
        return {
          genre, renderLanguage: RenderLanguage.GRAINY_NOIR,
          storytellingMode: StorytellingMode.MYSTERY_REVEAL, mood: VisualMood.BLEAK,
          panelStyle: PanelStyle.NOIR_SHADOWBOX,
          anatomyStylization: 0.30, realismLevel: 0.70, inkDensity: 0.85,
          motionIntensity: 0.20, textureAmount: 0.75, environmentalDetail: 0.80, colorComplexity: 0.20,
          cinematicLighting: true, exaggeratedPerspective: false, heavyShadowing: true,
          usesHalftones: true, usesScreenTone: false,
        };
      case ComicGenre.SUPERHERO: case ComicGenre.COSMIC: case ComicGenre.SPACE_OPERA:
        return {
          genre, renderLanguage: RenderLanguage.DYNAMIC_ACTION,
          storytellingMode: StorytellingMode.EPIC_SCOPE, mood: VisualMood.HEROIC,
          panelStyle: PanelStyle.CHAOTIC_ACTION,
          anatomyStylization: 0.70, realismLevel: 0.50, inkDensity: 0.65,
          motionIntensity: 0.90, textureAmount: 0.40, environmentalDetail: 0.60, colorComplexity: 0.80,
          cinematicLighting: true, exaggeratedPerspective: true, heavyShadowing: false,
          usesHalftones: true, usesScreenTone: false,
        };
      case ComicGenre.MANGA_ACTION: case ComicGenre.MARTIAL_ARTS:
        return {
          genre, renderLanguage: RenderLanguage.ANIME_CEL,
          storytellingMode: StorytellingMode.FAST_ACTION, mood: VisualMood.AGGRESSIVE,
          panelStyle: PanelStyle.MANGA_DYNAMIC,
          anatomyStylization: 0.85, realismLevel: 0.30, inkDensity: 0.60,
          motionIntensity: 0.95, textureAmount: 0.30, environmentalDetail: 0.40, colorComplexity: 0.70,
          cinematicLighting: false, exaggeratedPerspective: true, heavyShadowing: false,
          usesHalftones: false, usesScreenTone: true,
        };
      case ComicGenre.MANGA_SEINEN:
        return {
          genre, renderLanguage: RenderLanguage.SCREEN_TONE,
          storytellingMode: StorytellingMode.CHARACTER_DRIVEN, mood: VisualMood.MELANCHOLIC,
          panelStyle: PanelStyle.GRID_STANDARD,
          anatomyStylization: 0.65, realismLevel: 0.50, inkDensity: 0.55,
          motionIntensity: 0.40, textureAmount: 0.50, environmentalDetail: 0.65, colorComplexity: 0.40,
          cinematicLighting: false, exaggeratedPerspective: false, heavyShadowing: false,
          usesHalftones: false, usesScreenTone: true,
        };
      case ComicGenre.MANGA_SHOJO:
        return {
          genre, renderLanguage: RenderLanguage.MINIMAL_LINEWORK,
          storytellingMode: StorytellingMode.EMOTIONAL, mood: VisualMood.DREAMLIKE,
          panelStyle: PanelStyle.VERTICAL_SCROLL,
          anatomyStylization: 0.80, realismLevel: 0.25, inkDensity: 0.40,
          motionIntensity: 0.30, textureAmount: 0.20, environmentalDetail: 0.30, colorComplexity: 0.60,
          cinematicLighting: false, exaggeratedPerspective: false, heavyShadowing: false,
          usesHalftones: false, usesScreenTone: true,
        };
      case ComicGenre.EUROPEAN_BD:
        return {
          genre, renderLanguage: RenderLanguage.CLEAN_LINE,
          storytellingMode: StorytellingMode.CINEMATIC, mood: VisualMood.OPERATIC,
          panelStyle: PanelStyle.EUROPEAN_CLEAR,
          anatomyStylization: 0.40, realismLevel: 0.60, inkDensity: 0.50,
          motionIntensity: 0.45, textureAmount: 0.30, environmentalDetail: 0.90, colorComplexity: 0.70,
          cinematicLighting: false, exaggeratedPerspective: false, heavyShadowing: false,
          usesHalftones: false, usesScreenTone: false,
        };
      case ComicGenre.FANTASY: case ComicGenre.MYTHOLOGICAL:
        return {
          genre, renderLanguage: RenderLanguage.PAINTERLY,
          storytellingMode: StorytellingMode.EPIC_SCOPE, mood: VisualMood.MYSTICAL,
          panelStyle: PanelStyle.SPLASH_PAGE,
          anatomyStylization: 0.55, realismLevel: 0.65, inkDensity: 0.50,
          motionIntensity: 0.60, textureAmount: 0.70, environmentalDetail: 0.90, colorComplexity: 0.85,
          cinematicLighting: true, exaggeratedPerspective: false, heavyShadowing: false,
          usesHalftones: false, usesScreenTone: false,
        };
      case ComicGenre.DARK_FANTASY: case ComicGenre.GOTHIC:
        return {
          genre, renderLanguage: RenderLanguage.SCRATCHBOARD,
          storytellingMode: StorytellingMode.SLOW_BURN, mood: VisualMood.BLEAK,
          panelStyle: PanelStyle.HORROR_FRAGMENTED,
          anatomyStylization: 0.50, realismLevel: 0.45, inkDensity: 0.90,
          motionIntensity: 0.35, textureAmount: 0.85, environmentalDetail: 0.80, colorComplexity: 0.35,
          cinematicLighting: true, exaggeratedPerspective: false, heavyShadowing: true,
          usesHalftones: false, usesScreenTone: false,
        };
      case ComicGenre.PSYCHEDELIC:
        return {
          genre, renderLanguage: RenderLanguage.PSYCHEDELIC_COLOR,
          storytellingMode: StorytellingMode.DREAM_SEQUENCE, mood: VisualMood.SURREAL,
          panelStyle: PanelStyle.ABSTRACT_LAYOUT,
          anatomyStylization: 0.90, realismLevel: 0.10, inkDensity: 0.40,
          motionIntensity: 0.70, textureAmount: 0.60, environmentalDetail: 0.50, colorComplexity: 1.00,
          cinematicLighting: false, exaggeratedPerspective: true, heavyShadowing: false,
          usesHalftones: false, usesScreenTone: false,
        };
      case ComicGenre.POST_APOCALYPTIC: case ComicGenre.WAR:
        return {
          genre, renderLanguage: RenderLanguage.GRAINY_NOIR,
          storytellingMode: StorytellingMode.SLOW_BURN, mood: VisualMood.BLEAK,
          panelStyle: PanelStyle.CINEMATIC_WIDE,
          anatomyStylization: 0.35, realismLevel: 0.75, inkDensity: 0.70,
          motionIntensity: 0.50, textureAmount: 0.80, environmentalDetail: 0.85, colorComplexity: 0.30,
          cinematicLighting: true, exaggeratedPerspective: false, heavyShadowing: true,
          usesHalftones: true, usesScreenTone: false,
        };
      case ComicGenre.HUMOR: case ComicGenre.SATIRE:
        return {
          genre, renderLanguage: RenderLanguage.HALFTONE_RETRO,
          storytellingMode: StorytellingMode.COMEDIC_TIMING, mood: VisualMood.WHIMSICAL,
          panelStyle: PanelStyle.GRID_STANDARD,
          anatomyStylization: 0.75, realismLevel: 0.20, inkDensity: 0.55,
          motionIntensity: 0.50, textureAmount: 0.35, environmentalDetail: 0.40, colorComplexity: 0.70,
          cinematicLighting: false, exaggeratedPerspective: false, heavyShadowing: false,
          usesHalftones: true, usesScreenTone: false,
        };
      case ComicGenre.ROMANCE:
        return {
          genre, renderLanguage: RenderLanguage.WATERCOLOR,
          storytellingMode: StorytellingMode.EMOTIONAL, mood: VisualMood.DREAMLIKE,
          panelStyle: PanelStyle.GRID_STANDARD,
          anatomyStylization: 0.50, realismLevel: 0.55, inkDensity: 0.30,
          motionIntensity: 0.20, textureAmount: 0.40, environmentalDetail: 0.60, colorComplexity: 0.65,
          cinematicLighting: false, exaggeratedPerspective: false, heavyShadowing: false,
          usesHalftones: false, usesScreenTone: false,
        };
      case ComicGenre.STEAMPUNK:
        return {
          genre, renderLanguage: RenderLanguage.RETRO_PULP,
          storytellingMode: StorytellingMode.CINEMATIC, mood: VisualMood.OPERATIC,
          panelStyle: PanelStyle.MULTI_LAYERED,
          anatomyStylization: 0.45, realismLevel: 0.65, inkDensity: 0.60,
          motionIntensity: 0.55, textureAmount: 0.75, environmentalDetail: 0.90, colorComplexity: 0.60,
          cinematicLighting: true, exaggeratedPerspective: false, heavyShadowing: false,
          usesHalftones: true, usesScreenTone: false,
        };
      case ComicGenre.MECHA:
        return {
          genre, renderLanguage: RenderLanguage.DIGITAL_AIRBRUSH,
          storytellingMode: StorytellingMode.FAST_ACTION, mood: VisualMood.AGGRESSIVE,
          panelStyle: PanelStyle.DIAGONAL_FLOW,
          anatomyStylization: 0.60, realismLevel: 0.60, inkDensity: 0.65,
          motionIntensity: 0.90, textureAmount: 0.55, environmentalDetail: 0.70, colorComplexity: 0.75,
          cinematicLighting: true, exaggeratedPerspective: true, heavyShadowing: false,
          usesHalftones: false, usesScreenTone: false,
        };
      case ComicGenre.INDIE_EXPERIMENTAL: case ComicGenre.UNDERGROUND:
        return {
          genre, renderLanguage: RenderLanguage.GESTURAL_SKETCH,
          storytellingMode: StorytellingMode.EXPERIMENTAL_FLOW, mood: VisualMood.SURREAL,
          panelStyle: PanelStyle.ABSTRACT_LAYOUT,
          anatomyStylization: 0.80, realismLevel: 0.15, inkDensity: 0.50,
          motionIntensity: 0.40, textureAmount: 0.60, environmentalDetail: 0.30, colorComplexity: 0.50,
          cinematicLighting: false, exaggeratedPerspective: false, heavyShadowing: false,
          usesHalftones: false, usesScreenTone: false,
        };
      case ComicGenre.WEBTOON:
        return {
          genre, renderLanguage: RenderLanguage.CLEAN_LINE,
          storytellingMode: StorytellingMode.CHARACTER_DRIVEN, mood: VisualMood.DREAMLIKE,
          panelStyle: PanelStyle.VERTICAL_SCROLL,
          anatomyStylization: 0.70, realismLevel: 0.40, inkDensity: 0.45,
          motionIntensity: 0.40, textureAmount: 0.25, environmentalDetail: 0.55, colorComplexity: 0.75,
          cinematicLighting: false, exaggeratedPerspective: false, heavyShadowing: false,
          usesHalftones: false, usesScreenTone: false,
        };
      default:
        return {
          genre, renderLanguage: RenderLanguage.CINEMATIC_REALISM,
          storytellingMode: StorytellingMode.CHARACTER_DRIVEN, mood: VisualMood.HEROIC,
          panelStyle: PanelStyle.GRID_STANDARD,
          anatomyStylization: 0.40, realismLevel: 0.65, inkDensity: 0.55,
          motionIntensity: 0.40, textureAmount: 0.50, environmentalDetail: 0.70, colorComplexity: 0.55,
          cinematicLighting: false, exaggeratedPerspective: false, heavyShadowing: false,
          usesHalftones: false, usesScreenTone: false,
        };
    }
  }

  static createCyberpunkStyle  = () => StyleDatabase.createForGenre(ComicGenre.CYBERPUNK);
  static createHorrorStyle     = () => StyleDatabase.createForGenre(ComicGenre.HORROR);
  static createSuperheroStyle  = () => StyleDatabase.createForGenre(ComicGenre.SUPERHERO);
}

// ════════════════════════════════════════════════════════════════════════════
// GENRE FUSION ENGINE
// ════════════════════════════════════════════════════════════════════════════

export class GenreFusionEngine {
  static fuse(a: ComicStyleProfile, b: ComicStyleProfile): ComicStyleProfile {
    return {
      genre:            a.genre,
      renderLanguage:   a.renderLanguage,
      storytellingMode: a.storytellingMode,
      mood:             b.mood,
      panelStyle:       a.panelStyle,
      anatomyStylization:  (a.anatomyStylization  + b.anatomyStylization)  / 2,
      realismLevel:        (a.realismLevel         + b.realismLevel)         / 2,
      inkDensity:          (a.inkDensity           + b.inkDensity)           / 2,
      motionIntensity:     (a.motionIntensity      + b.motionIntensity)      / 2,
      textureAmount:       (a.textureAmount        + b.textureAmount)        / 2,
      environmentalDetail: (a.environmentalDetail  + b.environmentalDetail)  / 2,
      colorComplexity:     (a.colorComplexity      + b.colorComplexity)      / 2,
      cinematicLighting:      a.cinematicLighting      || b.cinematicLighting,
      exaggeratedPerspective: a.exaggeratedPerspective || b.exaggeratedPerspective,
      heavyShadowing:         a.heavyShadowing         || b.heavyShadowing,
      usesHalftones:          a.usesHalftones          || b.usesHalftones,
      usesScreenTone:         a.usesScreenTone         || b.usesScreenTone,
    };
  }
}

// ════════════════════════════════════════════════════════════════════════════
// AI STYLE INTERPRETER  — natural-language prompt → ComicStyleProfile
// ════════════════════════════════════════════════════════════════════════════

export class AIStyleInterpreter {
  static analyzePrompt(prompt: string): ComicStyleProfile {
    const p = prompt.toLowerCase();
    if (p.includes('cyberpunk') || p.includes('neon'))    return StyleDatabase.createForGenre(ComicGenre.CYBERPUNK);
    if (p.includes('horror') || p.includes('monster'))    return StyleDatabase.createForGenre(ComicGenre.HORROR);
    if (p.includes('noir') || p.includes('detective'))    return StyleDatabase.createForGenre(ComicGenre.NOIR);
    if (p.includes('manga') || p.includes('anime'))       return StyleDatabase.createForGenre(ComicGenre.MANGA_ACTION);
    if (p.includes('fantasy') || p.includes('dragon'))    return StyleDatabase.createForGenre(ComicGenre.FANTASY);
    if (p.includes('space') || p.includes('cosmic'))      return StyleDatabase.createForGenre(ComicGenre.COSMIC);
    if (p.includes('steampunk'))                          return StyleDatabase.createForGenre(ComicGenre.STEAMPUNK);
    if (p.includes('mecha') || p.includes('robot'))       return StyleDatabase.createForGenre(ComicGenre.MECHA);
    if (p.includes('gothic') || p.includes('vampire'))    return StyleDatabase.createForGenre(ComicGenre.GOTHIC);
    if (p.includes('western') || p.includes('cowboy'))    return StyleDatabase.createForGenre(ComicGenre.WESTERN);
    return StyleDatabase.createForGenre(ComicGenre.SUPERHERO);
  }

  static analyzeGenre(genre: ComicGenre): ComicStyleProfile {
    return StyleDatabase.createForGenre(genre);
  }
}

// ════════════════════════════════════════════════════════════════════════════
// CAMERA DIRECTOR
// ════════════════════════════════════════════════════════════════════════════

export class CameraDirector {
  static chooseShot(genre: ComicGenre, mood: VisualMood): CameraLanguage {
    if (genre === ComicGenre.HORROR)                              return CameraLanguage.HORROR_POV;
    if (genre === ComicGenre.NOIR || genre === ComicGenre.DETECTIVE) return CameraLanguage.OVER_SHOULDER;
    if (genre === ComicGenre.CYBERPUNK)                           return CameraLanguage.DUTCH_ANGLE;
    if (genre === ComicGenre.ROMANCE || genre === ComicGenre.SLICE_OF_LIFE) return CameraLanguage.INTIMATE_FACE;
    if (genre === ComicGenre.MANGA_ACTION || genre === ComicGenre.MARTIAL_ARTS) return CameraLanguage.TRACKING_ACTION;
    if (mood === VisualMood.HEROIC || mood === VisualMood.TRIUMPHANT) return CameraLanguage.HERO_LOW_ANGLE;
    if (mood === VisualMood.SURREAL || mood === VisualMood.DREAMLIKE) return CameraLanguage.CINEMATIC_PAN;
    if (mood === VisualMood.CHAOTIC || mood === VisualMood.AGGRESSIVE) return CameraLanguage.TRACKING_ACTION;
    return CameraLanguage.WIDE_ESTABLISHING;
  }
}

// ════════════════════════════════════════════════════════════════════════════
// CHARACTER CONTINUITY ENGINE
// ════════════════════════════════════════════════════════════════════════════

export class CharacterContinuityEngine {
  private characterDatabase: Map<string, CharacterProfile>;

  constructor() {
    this.characterDatabase = new Map();
  }

  registerCharacter(character: CharacterProfile) {
    this.characterDatabase.set(character.id, character);
  }

  getCharacter(id: string): CharacterProfile | undefined {
    return this.characterDatabase.get(id);
  }

  updateCharacter(character: CharacterProfile) {
    this.characterDatabase.set(character.id, character);
  }

  getAllCharacters(): CharacterProfile[] {
    return Array.from(this.characterDatabase.values());
  }

  buildConsistencyHints(characterId: string): string[] {
    const c = this.characterDatabase.get(characterId);
    if (!c) return [];
    return [
      `Maintain ${c.hairstyle} hairstyle throughout`,
      `Costume: ${c.costumeDescription}`,
      `Colors: ${c.costumeColors.join(', ')}`,
      `Body: ${c.bodyType}, height ${c.height}ft, muscularity ${Math.round(c.muscularity * 100)}%`,
      ...(c.renderingHints ?? []),
    ];
  }
}

// ════════════════════════════════════════════════════════════════════════════
// AI PROMPT COMPOSER
// ════════════════════════════════════════════════════════════════════════════

export class AIPromptComposer {
  static compose(
    sceneDescription: string,
    style: ComicStyleProfile,
    camera: CameraLanguage,
    characters: CharacterProfile[],
    continuityMemory: string[] = [],
  ): string {
    const charBlock = characters.map(c =>
      `  • ${c.name} (${c.species}, ${c.bodyType})\n    Costume: ${c.costumeDescription}\n    Colors: ${c.costumeColors.join(', ')}\n    Powers: ${c.powers.join(', ')}`
    ).join('\n\n');

    const memoryBlock = continuityMemory.length > 0
      ? `\nContinuity Notes:\n${continuityMemory.map(m => `  — ${m}`).join('\n')}`
      : '';

    return `COMIC PANEL GENERATION PROMPT
═══════════════════════════════════

SCENE:
${sceneDescription.trim()}

GENRE: ${style.genre}
RENDER STYLE: ${style.renderLanguage}
STORYTELLING MODE: ${style.storytellingMode}
VISUAL MOOD: ${style.mood}
PANEL LAYOUT: ${style.panelStyle}
CAMERA: ${camera}

RENDER PARAMETERS:
  ink density          ${Math.round(style.inkDensity * 100)}%
  motion intensity     ${Math.round(style.motionIntensity * 100)}%
  realism level        ${Math.round(style.realismLevel * 100)}%
  anatomy stylization  ${Math.round(style.anatomyStylization * 100)}%
  texture amount       ${Math.round(style.textureAmount * 100)}%
  environmental detail ${Math.round(style.environmentalDetail * 100)}%
  color complexity     ${Math.round(style.colorComplexity * 100)}%

RENDER FLAGS:
${style.cinematicLighting      ? '  ✓ Cinematic Lighting\n' : ''}${style.exaggeratedPerspective  ? '  ✓ Exaggerated Perspective\n' : ''}${style.heavyShadowing          ? '  ✓ Heavy Shadowing\n' : ''}${style.usesHalftones           ? '  ✓ Halftone Dots\n'    : ''}${style.usesScreenTone          ? '  ✓ Screen Tone\n'       : ''}
VISUAL RULES:
  — cinematic comic storytelling
  — readable silhouettes throughout
  — sequential art clarity
  — dynamic composition
  — consistent anatomy

CHARACTERS:
${charBlock || '  (none registered)'}
${memoryBlock}
═══════════════════════════════════`;
  }
}

// ════════════════════════════════════════════════════════════════════════════
// POSE ENGINE
// ════════════════════════════════════════════════════════════════════════════

export class PoseEngine {
  static generatePose(genre: ComicGenre): string {
    const poseMap: Partial<Record<ComicGenre, string>> = {
      [ComicGenre.SUPERHERO]:    'dynamic heroic stance — weight on back leg, chest forward, cape billowing',
      [ComicGenre.HORROR]:       'distorted suspense — hunched, hands reaching, body twisted',
      [ComicGenre.CYBERPUNK]:    'aggressive asymmetrical — one arm extended, tech glowing, stance wide',
      [ComicGenre.NOIR]:         'hard-boiled slouch — hand in pocket, hat brim low, cigarette',
      [ComicGenre.MANGA_ACTION]: 'speed-line burst pose — extreme foreshortening, fist toward viewer',
      [ComicGenre.FANTASY]:      'epic warrior stance — weapon raised, robes flowing, environment epic',
      [ComicGenre.ROMANCE]:      'intimate natural pose — soft angles, gentle reach toward other character',
      [ComicGenre.MECHA]:        'mech landing impact — one knee down, shockwave radiating, optics bright',
      [ComicGenre.MARTIAL_ARTS]: 'kata mid-strike — balanced, focused, motion blur on limbs',
      [ComicGenre.COSMIC]:       'cosmic revelation — arms spread, energy emanating, floating',
    };
    return poseMap[genre] ?? 'neutral cinematic pose — composed, readable silhouette';
  }

  static buildPromptSnippet(genre: ComicGenre, characterName?: string): string {
    const pose = PoseEngine.generatePose(genre);
    const prefix = characterName ? `${characterName} — ` : '';
    return `${prefix}${pose}`;
  }
}

// ════════════════════════════════════════════════════════════════════════════
// PANEL FLOW ANALYZER
// ════════════════════════════════════════════════════════════════════════════

export class PanelFlowAnalyzer {
  static validateFlow(page: ComicPage): boolean {
    return page.panels.length > 0;
  }

  static analyzeReadability(page: ComicPage): {
    score: number; issues: string[]; suggestions: string[];
  } {
    const issues: string[] = [];
    const suggestions: string[] = [];
    let score = 100;

    if (page.panels.length === 0) {
      return { score: 0, issues: ['No panels defined'], suggestions: ['Add at least one panel'] };
    }
    if (page.panels.length > 9) {
      issues.push('Too many panels — reader fatigue risk');
      suggestions.push('Consider splitting across two pages');
      score -= 20;
    }
    if (page.panels.some(p => p.splashPage) && page.panels.length > 1) {
      issues.push('Splash page mixed with other panels');
      suggestions.push('Splash pages work best as the only panel on the page');
      score -= 15;
    }
    const moods = new Set(page.panels.map(p => p.mood));
    if (moods.size > 4) {
      issues.push('High mood variance across panels');
      suggestions.push('Limit mood shifts to 2–3 per page for coherence');
      score -= 10;
    }

    return { score: Math.max(0, score), issues, suggestions };
  }
}

// ════════════════════════════════════════════════════════════════════════════
// PAGE COMPOSITOR
// ════════════════════════════════════════════════════════════════════════════

export class PageCompositor {
  static summarize(page: ComicPage): string {
    const lines = [`Page ${page.pageNumber} — ${page.panels.length} panels`];
    page.panels.forEach(p => {
      lines.push(`  Panel ${p.panelNumber}: ${p.description.slice(0, 60)}… [${p.camera}] [${p.mood}]`);
    });
    return lines.join('\n');
  }

  static buildStoryboard(pages: ComicPage[]): string {
    return pages.map(p => PageCompositor.summarize(p)).join('\n\n');
  }
}

// ════════════════════════════════════════════════════════════════════════════
// EXPORT ENGINE
// ════════════════════════════════════════════════════════════════════════════

export class ExportEngine {
  static formats = ['PDF', 'PNG Sequence', 'Webtoon (Vertical)', 'Print Ready'] as const;
  static exportSummary(project: ComicProjectState): string {
    const totalPanels = project.pages.reduce((n, pg) => n + pg.panels.length, 0);
    return [
      `Project: ${project.title}`,
      `Genre: ${project.genre}`,
      `Pages: ${project.pages.length}`,
      `Total Panels: ${totalPanels}`,
      `Characters: ${project.characterDatabase.length}`,
      `Continuity Notes: ${project.continuityMemory.length}`,
      `Prompt History: ${project.promptHistory.length} entries`,
    ].join('\n');
  }
}

// ════════════════════════════════════════════════════════════════════════════
// MASTER AI DIRECTOR  — central orchestration engine
// ════════════════════════════════════════════════════════════════════════════

export class AIComicDirector {
  project: ComicProjectState;
  continuity: CharacterContinuityEngine;

  constructor(project: ComicProjectState) {
    this.project = project;
    this.continuity = new CharacterContinuityEngine();
    this.initializeCharacters();
  }

  // ── System bootstrap ──────────────────────────────────────────────────────
  initializeCharacters() {
    this.project.characterDatabase.forEach(c => this.continuity.registerCharacter(c));
  }

  // ── Style service ─────────────────────────────────────────────────────────
  applyGenre(genre: ComicGenre) {
    this.project.genre = genre;
    this.project.styleProfile = StyleDatabase.createForGenre(genre);
  }

  fuseGenres(genreA: ComicGenre, genreB: ComicGenre): ComicStyleProfile {
    const a = StyleDatabase.createForGenre(genreA);
    const b = StyleDatabase.createForGenre(genreB);
    const fused = GenreFusionEngine.fuse(a, b);
    this.project.styleProfile = fused;
    return fused;
  }

  // ── Camera service ────────────────────────────────────────────────────────
  directCamera(): CameraLanguage {
    return CameraDirector.chooseShot(
      this.project.styleProfile.genre,
      this.project.styleProfile.mood,
    );
  }

  // ── Prompt composition service ────────────────────────────────────────────
  buildScenePrompt(sceneDescription: string): string {
    const camera = this.directCamera();
    const prompt = AIPromptComposer.compose(
      sceneDescription,
      this.project.styleProfile,
      camera,
      this.project.characterDatabase,
      this.project.continuityMemory,
    );
    // Add to history (cap at 20)
    this.project.promptHistory = [prompt, ...this.project.promptHistory].slice(0, 20);
    return prompt;
  }

  // ── Pose service ──────────────────────────────────────────────────────────
  suggestPose(characterId?: string): string {
    const char = characterId ? this.continuity.getCharacter(characterId) : undefined;
    return PoseEngine.buildPromptSnippet(this.project.genre, char?.name);
  }

  // ── Character service ─────────────────────────────────────────────────────
  addCharacter(character: CharacterProfile) {
    this.project.characterDatabase.push(character);
    this.continuity.registerCharacter(character);
  }

  removeCharacter(id: string) {
    this.project.characterDatabase = this.project.characterDatabase.filter(c => c.id !== id);
  }

  // ── Continuity memory service ─────────────────────────────────────────────
  addMemoryNote(note: string) {
    this.project.continuityMemory = [note, ...this.project.continuityMemory];
  }

  removeMemoryNote(index: number) {
    this.project.continuityMemory = this.project.continuityMemory.filter((_, i) => i !== index);
  }

  // ── Page/render service ───────────────────────────────────────────────────
  addToRenderQueue(entry: string) {
    this.project.renderQueue = [entry, ...this.project.renderQueue].slice(0, 50);
  }

  clearRenderQueue() {
    this.project.renderQueue = [];
  }

  // ── Export service ────────────────────────────────────────────────────────
  getExportSummary(): string {
    return ExportEngine.exportSummary(this.project);
  }

  // ── Page analytics ────────────────────────────────────────────────────────
  analyzePageFlow(page: ComicPage) {
    return PanelFlowAnalyzer.analyzeReadability(page);
  }

  buildStoryboard(): string {
    return PageCompositor.buildStoryboard(this.project.pages);
  }
}

// ── Default project factory ───────────────────────────────────────────────────
export function createDefaultProject(
  title: string,
  genre: ComicGenre = ComicGenre.SUPERHERO,
): ComicProjectState {
  return {
    projectId: `proj_${Date.now()}`,
    title,
    genre,
    styleProfile: StyleDatabase.createForGenre(genre),
    characterDatabase: [],
    pages: [],
    continuityMemory: [],
    promptHistory: [],
    renderQueue: [],
  };
}

// ── Human-readable label maps ─────────────────────────────────────────────────
export const GENRE_LABELS: Record<ComicGenre, string> = {
  [ComicGenre.SUPERHERO]: 'Superhero', [ComicGenre.COSMIC]: 'Cosmic', [ComicGenre.SCI_FI]: 'Sci-Fi',
  [ComicGenre.CYBERPUNK]: 'Cyberpunk', [ComicGenre.HORROR]: 'Horror', [ComicGenre.FANTASY]: 'Fantasy',
  [ComicGenre.DARK_FANTASY]: 'Dark Fantasy', [ComicGenre.NOIR]: 'Noir', [ComicGenre.DETECTIVE]: 'Detective',
  [ComicGenre.POST_APOCALYPTIC]: 'Post-Apocalyptic', [ComicGenre.MARTIAL_ARTS]: 'Martial Arts',
  [ComicGenre.WAR]: 'War', [ComicGenre.WESTERN]: 'Western', [ComicGenre.STEAMPUNK]: 'Steampunk',
  [ComicGenre.GOTHIC]: 'Gothic', [ComicGenre.MYTHOLOGICAL]: 'Mythological', [ComicGenre.ROMANCE]: 'Romance',
  [ComicGenre.SLICE_OF_LIFE]: 'Slice of Life', [ComicGenre.HUMOR]: 'Humor', [ComicGenre.SATIRE]: 'Satire',
  [ComicGenre.UNDERGROUND]: 'Underground', [ComicGenre.PSYCHEDELIC]: 'Psychedelic',
  [ComicGenre.MECHA]: 'Mecha', [ComicGenre.MONSTER]: 'Monster', [ComicGenre.SUPERNATURAL]: 'Supernatural',
  [ComicGenre.SPACE_OPERA]: 'Space Opera', [ComicGenre.MANGA_ACTION]: 'Manga Action',
  [ComicGenre.MANGA_SEINEN]: 'Manga Seinen', [ComicGenre.MANGA_SHOJO]: 'Manga Shojo',
  [ComicGenre.EUROPEAN_BD]: 'European BD', [ComicGenre.INDIE_EXPERIMENTAL]: 'Indie Exp.',
  [ComicGenre.ANTHOLOGY]: 'Anthology', [ComicGenre.WEBTOON]: 'Webtoon',
};

export const GENRE_EMOJIS: Record<ComicGenre, string> = {
  [ComicGenre.SUPERHERO]: '🦸', [ComicGenre.COSMIC]: '🌌', [ComicGenre.SCI_FI]: '🚀',
  [ComicGenre.CYBERPUNK]: '⚡', [ComicGenre.HORROR]: '💀', [ComicGenre.FANTASY]: '🐉',
  [ComicGenre.DARK_FANTASY]: '🔮', [ComicGenre.NOIR]: '🕯️', [ComicGenre.DETECTIVE]: '🔍',
  [ComicGenre.POST_APOCALYPTIC]: '☢️', [ComicGenre.MARTIAL_ARTS]: '🥋', [ComicGenre.WAR]: '⚔️',
  [ComicGenre.WESTERN]: '🤠', [ComicGenre.STEAMPUNK]: '⚙️', [ComicGenre.GOTHIC]: '🦇',
  [ComicGenre.MYTHOLOGICAL]: '⚡', [ComicGenre.ROMANCE]: '💕', [ComicGenre.SLICE_OF_LIFE]: '☕',
  [ComicGenre.HUMOR]: '😂', [ComicGenre.SATIRE]: '🎭', [ComicGenre.UNDERGROUND]: '✊',
  [ComicGenre.PSYCHEDELIC]: '🌀', [ComicGenre.MECHA]: '🤖', [ComicGenre.MONSTER]: '👹',
  [ComicGenre.SUPERNATURAL]: '👻', [ComicGenre.SPACE_OPERA]: '🌠', [ComicGenre.MANGA_ACTION]: '🇯🇵',
  [ComicGenre.MANGA_SEINEN]: '📖', [ComicGenre.MANGA_SHOJO]: '🌸', [ComicGenre.EUROPEAN_BD]: '🎨',
  [ComicGenre.INDIE_EXPERIMENTAL]: '✏️', [ComicGenre.ANTHOLOGY]: '📚', [ComicGenre.WEBTOON]: '📱',
};

export const RENDER_LABELS: Record<RenderLanguage, string> = {
  [RenderLanguage.DYNAMIC_ACTION]: 'Dynamic Action',
  [RenderLanguage.CINEMATIC_REALISM]: 'Cinematic Realism',
  [RenderLanguage.HEAVY_INK]: 'Heavy Ink',
  [RenderLanguage.CLEAN_LINE]: 'Clean Line',
  [RenderLanguage.PAINTERLY]: 'Painterly',
  [RenderLanguage.WATERCOLOR]: 'Watercolor',
  [RenderLanguage.SCREEN_TONE]: 'Screen Tone',
  [RenderLanguage.GRAPHIC_SHADOW]: 'Graphic Shadow',
  [RenderLanguage.GESTURAL_SKETCH]: 'Gestural Sketch',
  [RenderLanguage.PSYCHEDELIC_COLOR]: 'Psychedelic Color',
  [RenderLanguage.NEON_NOIR]: 'Neon Noir',
  [RenderLanguage.RETRO_PULP]: 'Retro Pulp',
  [RenderLanguage.HIGH_CONTRAST]: 'High Contrast',
  [RenderLanguage.HALFTONE_RETRO]: 'Halftone Retro',
  [RenderLanguage.DIGITAL_AIRBRUSH]: 'Digital Airbrush',
  [RenderLanguage.SCRATCHBOARD]: 'Scratchboard',
  [RenderLanguage.ANIME_CEL]: 'Anime Cel',
  [RenderLanguage.MINIMAL_LINEWORK]: 'Minimal Linework',
  [RenderLanguage.GRAINY_NOIR]: 'Grainy Noir',
  [RenderLanguage.ABSTRACT_EXPRESSIONISM]: 'Abstract Expressionism',
};

export const MOOD_LABELS: Record<VisualMood, string> = {
  [VisualMood.HEROIC]: 'Heroic', [VisualMood.BLEAK]: 'Bleak', [VisualMood.TRIUMPHANT]: 'Triumphant',
  [VisualMood.MELANCHOLIC]: 'Melancholic', [VisualMood.APOCALYPTIC]: 'Apocalyptic',
  [VisualMood.MYSTICAL]: 'Mystical', [VisualMood.CHAOTIC]: 'Chaotic', [VisualMood.DREAMLIKE]: 'Dreamlike',
  [VisualMood.PARANOID]: 'Paranoid', [VisualMood.AGGRESSIVE]: 'Aggressive',
  [VisualMood.WHIMSICAL]: 'Whimsical', [VisualMood.CLAUSTROPHOBIC]: 'Claustrophobic',
  [VisualMood.OPERATIC]: 'Operatic', [VisualMood.SURREAL]: 'Surreal',
};

export const CAMERA_LABELS: Record<CameraLanguage, string> = {
  [CameraLanguage.HERO_LOW_ANGLE]: 'Hero Low Angle', [CameraLanguage.DUTCH_ANGLE]: 'Dutch Angle',
  [CameraLanguage.OVER_SHOULDER]: 'Over Shoulder', [CameraLanguage.EXTREME_CLOSEUP]: 'Extreme Closeup',
  [CameraLanguage.WIDE_ESTABLISHING]: 'Wide Establishing', [CameraLanguage.TRACKING_ACTION]: 'Tracking Action',
  [CameraLanguage.CINEMATIC_PAN]: 'Cinematic Pan', [CameraLanguage.INTIMATE_FACE]: 'Intimate Face',
  [CameraLanguage.HORROR_POV]: 'Horror POV', [CameraLanguage.SILHOUETTE_SHOT]: 'Silhouette Shot',
};

export const PANEL_LABELS: Record<PanelStyle, string> = {
  [PanelStyle.GRID_STANDARD]: 'Grid Standard', [PanelStyle.CINEMATIC_WIDE]: 'Cinematic Wide',
  [PanelStyle.MANGA_DYNAMIC]: 'Manga Dynamic', [PanelStyle.CHAOTIC_ACTION]: 'Chaotic Action',
  [PanelStyle.VERTICAL_SCROLL]: 'Vertical Scroll', [PanelStyle.EUROPEAN_CLEAR]: 'European Clear',
  [PanelStyle.HORROR_FRAGMENTED]: 'Horror Fragmented', [PanelStyle.NOIR_SHADOWBOX]: 'Noir Shadow Box',
  [PanelStyle.SPLASH_PAGE]: 'Splash Page', [PanelStyle.DIAGONAL_FLOW]: 'Diagonal Flow',
  [PanelStyle.MULTI_LAYERED]: 'Multi Layered', [PanelStyle.ABSTRACT_LAYOUT]: 'Abstract Layout',
};
