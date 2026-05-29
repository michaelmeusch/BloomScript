export interface ExportFont {
  id: string;
  label: string;
  family: string;
  familyBold?: string;
  cssStack: string;
  category: 'serif' | 'sans';
}

export interface FontStyleProps {
  fontFamily: string;
  fontWeight?: 'bold';
  fontStyle?: 'italic';
}

export function getFontStyleProps(font: ExportFont, bold?: boolean, italic?: boolean): FontStyleProps {
  return {
    fontFamily: bold && font.familyBold ? font.familyBold : font.family,
    fontWeight: bold && !font.familyBold ? 'bold' : undefined,
    fontStyle: italic ? 'italic' : undefined,
  };
}

export const EXPORT_FONTS: ExportFont[] = [
  {
    id: 'cinzel',
    label: 'Cinzel',
    family: 'Cinzel_400Regular',
    cssStack: "'Cinzel', Georgia, serif",
    category: 'serif',
  },
  {
    id: 'cormorant-infant',
    label: 'Cormorant Infant',
    family: 'CormorantInfant_400Regular',
    cssStack: "'Cormorant Infant', Garamond, serif",
    category: 'serif',
  },
  {
    id: 'cormorant-sc',
    label: 'Cormorant SC',
    family: 'CormorantSC_400Regular',
    cssStack: "'Cormorant SC', Garamond, serif",
    category: 'serif',
  },
  {
    id: 'domine',
    label: 'Domine',
    family: 'Domine_400Regular',
    cssStack: "'Domine', Georgia, serif",
    category: 'serif',
  },
  {
    id: 'eb-garamond-italic',
    label: 'EB Garamond Italic',
    family: 'EBGaramond_400Regular_Italic',
    cssStack: "'EB Garamond', Garamond, serif",
    category: 'serif',
  },
  {
    id: 'gentium-book-plus',
    label: 'Gentium Book Plus',
    family: 'GentiumBookPlus_400Regular',
    cssStack: "'Gentium Book Plus', Georgia, serif",
    category: 'serif',
  },
  {
    id: 'noto-serif',
    label: 'Noto Serif',
    family: 'NotoSerif_400Regular',
    cssStack: "'Noto Serif', Georgia, serif",
    category: 'serif',
  },
  {
    id: 'noticia-text',
    label: 'Noticia Text',
    family: 'NoticiaText_400Regular',
    cssStack: "'Noticia Text', Georgia, serif",
    category: 'serif',
  },
  {
    id: 'old-standard',
    label: 'Old Standard',
    family: 'OldStandardTT_400Regular',
    cssStack: "'Old Standard TT', Georgia, serif",
    category: 'serif',
  },
  {
    id: 'patrick-hand-sc',
    label: 'Patrick Hand SC',
    family: 'PatrickHandSC_400Regular',
    cssStack: "'Patrick Hand SC', cursive",
    category: 'sans',
  },
  {
    id: 'merriweather',
    label: 'Merriweather',
    family: 'Merriweather_400Regular',
    familyBold: 'Merriweather_700Bold',
    cssStack: "'Merriweather', Georgia, serif",
    category: 'serif',
  },
  {
    id: 'lora',
    label: 'Lora',
    family: 'Lora_400Regular',
    familyBold: 'Lora_700Bold',
    cssStack: "'Lora', Georgia, serif",
    category: 'serif',
  },
  {
    id: 'playfair',
    label: 'Playfair Display',
    family: 'PlayfairDisplay_400Regular',
    familyBold: 'PlayfairDisplay_700Bold',
    cssStack: "'Playfair Display', Georgia, serif",
    category: 'serif',
  },
  {
    id: 'eb-garamond',
    label: 'EB Garamond',
    family: 'EBGaramond_400Regular',
    familyBold: 'EBGaramond_700Bold',
    cssStack: "'EB Garamond', Garamond, serif",
    category: 'serif',
  },
  {
    id: 'crimson-pro',
    label: 'Crimson Pro',
    family: 'CrimsonPro_400Regular',
    familyBold: 'CrimsonPro_700Bold',
    cssStack: "'Crimson Pro', Georgia, serif",
    category: 'serif',
  },
  {
    id: 'libre-baskerville',
    label: 'Libre Baskerville',
    family: 'LibreBaskerville_400Regular',
    familyBold: 'LibreBaskerville_700Bold',
    cssStack: "'Libre Baskerville', Baskerville, serif",
    category: 'serif',
  },
  {
    id: 'source-serif',
    label: 'Source Serif',
    family: 'SourceSerifPro_400Regular',
    familyBold: 'SourceSerifPro_700Bold',
    cssStack: "'Source Serif Pro', Georgia, serif",
    category: 'serif',
  },
  {
    id: 'pt-serif',
    label: 'PT Serif',
    family: 'PTSerif_400Regular',
    familyBold: 'PTSerif_700Bold',
    cssStack: "'PT Serif', Georgia, serif",
    category: 'serif',
  },
  {
    id: 'cormorant',
    label: 'Cormorant Garamond',
    family: 'CormorantGaramond_400Regular',
    familyBold: 'CormorantGaramond_700Bold',
    cssStack: "'Cormorant Garamond', Garamond, serif",
    category: 'serif',
  },
  {
    id: 'roboto-slab',
    label: 'Roboto Slab',
    family: 'RobotoSlab_400Regular',
    familyBold: 'RobotoSlab_700Bold',
    cssStack: "'Roboto Slab', Georgia, serif",
    category: 'serif',
  },
  {
    id: 'open-sans',
    label: 'Open Sans',
    family: 'OpenSans_400Regular',
    familyBold: 'OpenSans_700Bold',
    cssStack: "'Open Sans', Helvetica, Arial, sans-serif",
    category: 'sans',
  },
  {
    id: 'quicksand',
    label: 'Quicksand',
    family: 'Quicksand_400Regular',
    cssStack: "'Quicksand', Helvetica, Arial, sans-serif",
    category: 'sans',
  },
  {
    id: 'raleway',
    label: 'Raleway',
    family: 'Raleway_400Regular',
    cssStack: "'Raleway', Helvetica, Arial, sans-serif",
    category: 'sans',
  },
  {
    id: 'archivo',
    label: 'Archivo',
    family: 'Archivo_400Regular',
    cssStack: "'Archivo', Helvetica, Arial, sans-serif",
    category: 'sans',
  },
  {
    id: 'bebas-neue',
    label: 'Bebas Neue',
    family: 'BebasNeue_400Regular',
    cssStack: "'Bebas Neue', Impact, sans-serif",
    category: 'sans',
  },
  {
    id: 'cabin',
    label: 'Cabin',
    family: 'Cabin_400Regular',
    cssStack: "'Cabin', Helvetica, Arial, sans-serif",
    category: 'sans',
  },
  {
    id: 'cantarell',
    label: 'Cantarell',
    family: 'Cantarell_400Regular',
    cssStack: "'Cantarell', Helvetica, Arial, sans-serif",
    category: 'sans',
  },
  {
    id: 'dm-sans',
    label: 'DM Sans',
    family: 'DMSans_400Regular',
    cssStack: "'DM Sans', Helvetica, Arial, sans-serif",
    category: 'sans',
  },
  {
    id: 'fira-sans',
    label: 'Fira Sans',
    family: 'FiraSans_400Regular',
    cssStack: "'Fira Sans', Helvetica, Arial, sans-serif",
    category: 'sans',
  },
  {
    id: 'ibm-plex-sans',
    label: 'IBM Plex Sans',
    family: 'IBMPlexSans_400Regular',
    cssStack: "'IBM Plex Sans', Helvetica, Arial, sans-serif",
    category: 'sans',
  },
  {
    id: 'josefin-sans',
    label: 'Josefin Sans',
    family: 'JosefinSans_400Regular',
    cssStack: "'Josefin Sans', Helvetica, Arial, sans-serif",
    category: 'sans',
  },
  {
    id: 'montserrat',
    label: 'Montserrat',
    family: 'Montserrat_400Regular',
    cssStack: "'Montserrat', Helvetica, Arial, sans-serif",
    category: 'sans',
  },
  {
    id: 'mulish',
    label: 'Mulish',
    family: 'Mulish_400Regular',
    cssStack: "'Mulish', Helvetica, Arial, sans-serif",
    category: 'sans',
  },
  {
    id: 'nunito',
    label: 'Nunito',
    family: 'Nunito_400Regular',
    cssStack: "'Nunito', Helvetica, Arial, sans-serif",
    category: 'sans',
  },
  {
    id: 'oswald',
    label: 'Oswald',
    family: 'Oswald_400Regular',
    cssStack: "'Oswald', Arial, sans-serif",
    category: 'sans',
  },
  {
    id: 'poppins',
    label: 'Poppins',
    family: 'Poppins_400Regular',
    cssStack: "'Poppins', Helvetica, Arial, sans-serif",
    category: 'sans',
  },
  {
    id: 'rubik',
    label: 'Rubik',
    family: 'Rubik_400Regular',
    cssStack: "'Rubik', Helvetica, Arial, sans-serif",
    category: 'sans',
  },
  {
    id: 'space-grotesk',
    label: 'Space Grotesk',
    family: 'SpaceGrotesk_400Regular',
    cssStack: "'Space Grotesk', Helvetica, Arial, sans-serif",
    category: 'sans',
  },
  {
    id: 'source-sans',
    label: 'Source Sans',
    family: 'SourceSansPro_400Regular',
    cssStack: "'Source Sans Pro', Helvetica, Arial, sans-serif",
    category: 'sans',
  },
  {
    id: 'syne',
    label: 'Syne',
    family: 'Syne_400Regular',
    cssStack: "'Syne', Helvetica, Arial, sans-serif",
    category: 'sans',
  },
  {
    id: 'work-sans',
    label: 'Work Sans',
    family: 'WorkSans_400Regular',
    cssStack: "'Work Sans', Helvetica, Arial, sans-serif",
    category: 'sans',
  },
  {
    id: 'inter',
    label: 'Inter',
    family: 'Inter_400Regular',
    cssStack: "'Inter', Helvetica, Arial, sans-serif",
    category: 'sans',
  },
];

export const DEFAULT_FONT_ID = 'merriweather';
export const DEFAULT_HEADING_FONT_ID = 'playfair';

export const HEADING_FONT_IDS = [
  // Original 10
  'playfair', 'cinzel', 'lora', 'cormorant', 'eb-garamond',
  'libre-baskerville', 'raleway', 'montserrat', 'oswald', 'josefin-sans',
  // 10 most-used additions
  'crimson-pro', 'pt-serif', 'noto-serif', 'roboto-slab', 'source-serif',
  'poppins', 'nunito', 'work-sans', 'bebas-neue', 'space-grotesk',
];
export const HEADING_FONT_OPTIONS = EXPORT_FONTS.filter(f => HEADING_FONT_IDS.includes(f.id));

export function getFontById(id: string | undefined): ExportFont {
  return EXPORT_FONTS.find((f) => f.id === id) ?? EXPORT_FONTS[0]!;
}

export function googleFontsCssLink(): string {
  const families = [
    'Cinzel:wght@400;700',
    'Cormorant+Infant:wght@400;700',
    'Cormorant+SC:wght@400',
    'Domine:wght@400;700',
    'EB+Garamond:wght@400;700',
    'Gentium+Book+Plus:wght@400;700',
    'Merriweather:wght@400;700',
    'Lora:wght@400;700',
    'Noto+Serif:wght@400;700',
    'Noticia+Text:wght@400;700',
    'Old+Standard+TT:wght@400;700',
    'Playfair+Display:wght@400;700',
    'Crimson+Pro:wght@400;700',
    'Libre+Baskerville:wght@400;700',
    'Source+Serif+Pro:wght@400;700',
    'PT+Serif:wght@400;700',
    'Cormorant+Garamond:wght@400;700',
    'Roboto+Slab:wght@400;700',
    'Open+Sans:wght@400;700',
    'Quicksand:wght@400;700',
    'Raleway:wght@400;700',
    'Archivo:wght@400;700',
    'Bebas+Neue:wght@400',
    'Cabin:wght@400;700',
    'Cantarell:wght@400;700',
    'DM+Sans:wght@400;700',
    'Fira+Sans:wght@400;700',
    'IBM+Plex+Sans:wght@400;700',
    'Josefin+Sans:wght@400;700',
    'Montserrat:wght@400;700',
    'Mulish:wght@400;700',
    'Nunito:wght@400;700',
    'Oswald:wght@400;700',
    'Poppins:wght@400;700',
    'Rubik:wght@400;700',
    'Space+Grotesk:wght@400;700',
    'Source+Sans+Pro:wght@400;700',
    'Syne:wght@400;700',
    'Work+Sans:wght@400;700',
    'Inter:wght@400;700',
  ];
  return `https://fonts.googleapis.com/css2?${families
    .map((f) => `family=${f}`)
    .join('&')}&display=swap`;
}
