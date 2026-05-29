export type TextAlignment = 'left' | 'center' | 'right';
export type PageNumberStyle = 'none' | 'bottom-center' | 'bottom-outside';

export interface FormatSettings {
  titleAlignment: TextAlignment;
  chapterTitleAlignment: TextAlignment;
  pageNumbers: PageNumberStyle;
  titleFontSize?: number;
  chapterTitleFontSize?: number;
  authorFontSize?: number;
}

export type SectionType =
  | 'scene'
  | 'dialogue'
  | 'description'
  | 'action'
  | 'reflection'
  | 'character'
  | 'world'
  | 'verse'
  | 'custom';

export type Genre =
  | 'Fiction'
  | 'Non-Fiction'
  | 'Mystery'
  | 'Romance'
  | 'Sci-Fi'
  | 'Sci-Fi Illustration'
  | 'Fantasy'
  | 'Urban Fantasy'
  | 'Horror'
  | "Children's Fantasy"
  | 'Memoir'
  | 'Biography'
  | 'Self-Help'
  | "Children's"
  | 'Thriller'
  | 'Poem'
  | 'Screenplay'
  | 'Comic Book'
  | 'Other';

export type FolderColor =
  | '#2D4A3E'
  | '#C4913A'
  | '#C4704A'
  | '#4A6C8A'
  | '#7A9E8A'
  | '#7A5A8A';

export const FOLDER_COLORS: FolderColor[] = [
  '#2D4A3E',
  '#C4913A',
  '#C4704A',
  '#4A6C8A',
  '#7A9E8A',
  '#7A5A8A',
];

export const FOLDER_COLOR_LABELS: Record<FolderColor, string> = {
  '#2D4A3E': 'Forest',
  '#C4913A': 'Gold',
  '#C4704A': 'Terra',
  '#4A6C8A': 'Slate',
  '#7A9E8A': 'Sage',
  '#7A5A8A': 'Plum',
};

export interface Section {
  id: string;
  prompt: string;
  content: string;
  type: SectionType;
}

export interface Chapter {
  id: string;
  title: string;
  number: number;
  sections: Section[];
  isComplete: boolean;
  createdAt: number;
  updatedAt: number;
}

export interface Character {
  id: string;
  name: string;
  role: string;
}

export interface Book {
  id: string;
  title: string;
  genre: Genre;
  description: string;
  synopsis?: string;
  screenplayFormat?: 'short-film' | 'feature' | 'play';
  screenplayRuntime?: string;
  screenplayThemes?: string[];
  screenplayCoreTheme?: string;
  screenplayMainMessage?: string;
  screenplayOpeningTheme?: string;
  chapters: Chapter[];
  characters?: Character[];
  folderId?: string;
  prologue?: string;
  epilogue?: string;
  copyright?: string;
  dedication?: string;
  epigraph?: string;
  foreword?: string;
  preface?: string;
  acknowledgements?: string;
  includeTOC?: boolean;
  includePrologue?: boolean;
  includeEpilogue?: boolean;
  includeCopyright?: boolean;
  includeDedication?: boolean;
  includeEpigraph?: boolean;
  includeForeword?: boolean;
  includePreface?: boolean;
  includeAcknowledgements?: boolean;
  previewFontId?: string;
  headingFontId?: string;
  dialogueFontId?: string;
  dialogueFontBold?: boolean;
  dialogueFontItalic?: boolean;
  headingFontBold?: boolean;
  headingFontItalic?: boolean;
  coverTitleFontId?: string;
  coverImageUri?: string;
  coverRawImageUri?: string;
  coverImageBase64?: string;
  coverAuthorName?: string;
  coverSubtitle?: string;
  amazonDescription?: string;
  seoKeywords?: { term: string; reason: string }[];
  formatSettings?: FormatSettings;
  createdAt: number;
  updatedAt: number;
}

export interface Folder {
  id: string;
  name: string;
  color: FolderColor;
  createdAt: number;
}

export interface ArtistBook {
  title: string;
  genre: string;
  excerpt: string;
}

export interface ArtistProfile {
  id: string;
  name: string;
  bio: string;
  genres: string[];
  avatarColor: string;
  avatarUri?: string;
  books: ArtistBook[];
  baseLikes: number;
}

export interface ArtistReview {
  id: string;
  artistId: string;
  text: string;
  createdAt: number;
}

export interface ArtistLike {
  artistId: string;
  liked: boolean;
}

export const ALL_GENRES: Genre[] = [
  'Fiction',
  'Non-Fiction',
  'Mystery',
  'Romance',
  'Sci-Fi',
  'Sci-Fi Illustration',
  'Fantasy',
  'Urban Fantasy',
  'Horror',
  "Children's Fantasy",
  'Memoir',
  'Biography',
  'Self-Help',
  "Children's",
  'Thriller',
  'Poem',
  'Screenplay',
  'Comic Book',
  'Other',
];

export interface AuthorProfile {
  penName: string;
  bio: string;
  genres: Genre[];
  localAvatarUri?: string;
}
