import { Genre } from '@/types';

export type WorkLabel = 'book' | 'poem' | 'script';

export function getWorkLabel(genre: Genre | string | undefined): WorkLabel {
  if (genre === 'Poem') return 'poem';
  if (genre === 'Screenplay') return 'script';
  return 'book';
}

export function getWorkLabelCap(genre: Genre | string | undefined): string {
  const label = getWorkLabel(genre);
  return label.charAt(0).toUpperCase() + label.slice(1);
}

export function replaceWorkLabel(text: string, genre: Genre | string | undefined): string {
  const label = getWorkLabel(genre);
  const cap = getWorkLabelCap(genre);
  return text
    .replace(/\bYour book\b/g, `Your ${label}`)
    .replace(/\byour book\b/g, `your ${label}`)
    .replace(/\bThis book\b/g, `This ${label}`)
    .replace(/\bthis book\b/g, `this ${label}`)
    .replace(/\bMy Book\b/g, `My ${cap}`)
    .replace(/\bmy book\b/g, `my ${label}`);
}
