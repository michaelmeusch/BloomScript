import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth, useUser } from '@clerk/expo';
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';

import { API_BASE } from '@/constants/api';
import { Book, Character, Chapter, Folder, FolderColor, Genre, Section, SectionType } from '@/types';

const STORAGE_KEY = '@CAS:books';
const FOLDERS_KEY = '@CAS:folders';

function scopedKey(key: string, userId: string | null | undefined) {
  return userId ? `${key}:${userId}` : key;
}


function genId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
}

function normalizeBook(book: Book): Book {
  if (!book.seoKeywords) return book;
  const normalized = book.seoKeywords.map((kw) =>
    typeof kw === 'string'
      ? { term: kw as string, reason: '' }
      : kw
  );
  return { ...book, seoKeywords: normalized };
}

export const DEFAULT_SECTIONS: Omit<Section, 'id'>[] = [
  { prompt: 'How does this chapter open? Set the opening scene.', content: '', type: 'scene' },
  { prompt: 'Where does this take place? Paint the setting in detail.', content: '', type: 'description' },
  { prompt: 'Who is present? Describe the characters and their state of mind.', content: '', type: 'description' },
  { prompt: 'What tension, conflict, or desire drives this chapter?', content: '', type: 'action' },
  { prompt: 'Write the key events, exchanges, or turning point.', content: '', type: 'dialogue' },
  { prompt: 'How does this chapter close? Leave the reader wanting more.', content: '', type: 'reflection' },
];

export const POEM_DEFAULT_SECTIONS: Omit<Section, 'id'>[] = [
  { prompt: 'What is the opening image or feeling that begins this poem?', content: '', type: 'verse' },
  { prompt: 'Write the first stanza — establish the central image or voice.', content: '', type: 'verse' },
  { prompt: 'Deepen the imagery or extend the central metaphor.', content: '', type: 'verse' },
  { prompt: 'Write the volta — shift the perspective, emotion, or meaning.', content: '', type: 'verse' },
  { prompt: 'Close the poem with a resonant final image or line.', content: '', type: 'verse' },
];

export const SCREENPLAY_DEFAULT_SECTIONS: Omit<Section, 'id'>[] = [
  { prompt: 'INT./EXT. — Where and when does this scene take place? (slug line + opening action)', content: '', type: 'scene' },
  { prompt: 'Describe what the camera sees and feels as the scene opens.', content: '', type: 'action' },
  { prompt: 'Who enters and what do they want in this scene? (character entrance)', content: '', type: 'character' },
  { prompt: 'Write the key exchange — what is said, and what is left unsaid.', content: '', type: 'dialogue' },
  { prompt: 'How does the scene end and what does it cut to? (scene out)', content: '', type: 'action' },
];

export const COMIC_BOOK_DEFAULT_SECTIONS: Omit<Section, 'id'>[] = [
  { prompt: 'PANEL 1 — Establishing Shot: Where does this issue open? Describe the setting in visual terms: location, time of day, atmosphere, and what the reader sees first.', content: '', type: 'scene' },
  { prompt: 'PANEL 2 — Character Entrance: Who appears on the page? Describe how they look, their pose, expression, and body language. What are they doing?', content: '', type: 'description' },
  { prompt: 'PANEL 3 — Rising Conflict: What obstacle, threat, or inciting event kicks off this issue? Describe the action beat — punchy and visual.', content: '', type: 'action' },
  { prompt: 'PANEL 4 — Key Exchange: Write the central conversation, confrontation, or monologue that drives this issue. What is said — and what is left unsaid?', content: '', type: 'dialogue' },
  { prompt: 'PANEL 5 — Reaction Beat: How do characters react? Show the emotional or physical shift in close-up — a face, a hand, a shadow.', content: '', type: 'reflection' },
  { prompt: 'PANEL 6 — Cliffhanger / Splash: End the issue with a single powerful image or beat that makes the reader desperate for the next issue.', content: '', type: 'action' },
];

export function buildPersonalizedSections(characters: Character[]): Omit<Section, 'id'>[] {
  const protagonist = characters.find((c) => c.role === 'Protagonist');
  const antagonist = characters.find((c) => c.role === 'Antagonist');
  const p = protagonist?.name;
  const a = antagonist?.name;
  if (!p) return DEFAULT_SECTIONS;
  return [
    { prompt: `How does ${p} enter this chapter? Set the opening scene.`, content: '', type: 'scene' },
    { prompt: `Where does this chapter take place? Describe the setting ${p} finds themselves in.`, content: '', type: 'description' },
    { prompt: a ? `Who else is here — how does ${p} interact with ${a} and the others around them?` : `Who else is present? Describe how ${p} perceives the characters around them.`, content: '', type: 'description' },
    { prompt: `What does ${p} want in this chapter — and what stands in the way?`, content: '', type: 'action' },
    { prompt: `Write the key events and exchanges ${p} is part of in this chapter.`, content: '', type: 'dialogue' },
    { prompt: `How does this chapter close for ${p}? Leave the reader wanting more.`, content: '', type: 'reflection' },
  ];
}

export function buildDefaultSectionsForGenre(genre: Genre, characters: Character[]): Omit<Section, 'id'>[] {
  if (genre === 'Poem') return POEM_DEFAULT_SECTIONS;
  if (genre === 'Screenplay') return SCREENPLAY_DEFAULT_SECTIONS;
  if (genre === 'Comic Book') return COMIC_BOOK_DEFAULT_SECTIONS;
  return buildPersonalizedSections(characters);
}

interface BookContextValue {
  books: Book[];
  folders: Folder[];
  loading: boolean;
  createBook: (title: string, genre: Genre, description: string) => Book;
  updateBook: (
    bookId: string,
    updates: Partial<
      Pick<
        Book,
        | 'title'
        | 'genre'
        | 'description'
        | 'synopsis'
        | 'screenplayFormat'
        | 'screenplayRuntime'
        | 'screenplayThemes'
        | 'screenplayCoreTheme'
        | 'screenplayMainMessage'
        | 'screenplayOpeningTheme'
        | 'prologue'
        | 'epilogue'
        | 'copyright'
        | 'dedication'
        | 'epigraph'
        | 'foreword'
        | 'preface'
        | 'acknowledgements'
        | 'includeTOC'
        | 'includePrologue'
        | 'includeEpilogue'
        | 'includeCopyright'
        | 'includeDedication'
        | 'includeEpigraph'
        | 'includeForeword'
        | 'includePreface'
        | 'includeAcknowledgements'
        | 'previewFontId'
        | 'headingFontId'
        | 'dialogueFontId'
        | 'dialogueFontBold'
        | 'dialogueFontItalic'
        | 'headingFontBold'
        | 'headingFontItalic'
        | 'coverTitleFontId'
        | 'coverImageUri'
        | 'coverRawImageUri'
        | 'coverImageBase64'
        | 'coverAuthorName'
        | 'coverSubtitle'
        | 'amazonDescription'
        | 'seoKeywords'
        | 'folderId'
        | 'amazonDescription'
        | 'seoKeywords'
        | 'formatSettings'
      >
    >
  ) => void;
  deleteBook: (bookId: string) => void;
  addChapter: (bookId: string, title: string) => Chapter;
  updateChapter: (
    bookId: string,
    chapterId: string,
    updates: Partial<Pick<Chapter, 'title' | 'isComplete'>>
  ) => void;
  deleteChapter: (bookId: string, chapterId: string) => void;
  updateSection: (
    bookId: string,
    chapterId: string,
    sectionId: string,
    content: string
  ) => void;
  updateSectionPrompt: (
    bookId: string,
    chapterId: string,
    sectionId: string,
    prompt: string
  ) => void;
  addSection: (
    bookId: string,
    chapterId: string,
    type: SectionType,
    prompt: string
  ) => void;
  updateChapterSectionOrder: (
    bookId: string,
    chapterId: string,
    sections: Omit<Section, 'id'>[]
  ) => void;
  deleteSection: (
    bookId: string,
    chapterId: string,
    sectionId: string
  ) => void;
  replaceChapterSections: (
    bookId: string,
    chapterId: string,
    sections: Omit<Section, 'id'>[]
  ) => void;
  splitChapter: (
    bookId: string,
    chapterId: string,
    parts: { title: string; sections: Omit<Section, 'id'>[] }[]
  ) => void;
  insertChapterAfter: (bookId: string, afterChapterId: string, title: string) => Chapter;
  addCharacter: (bookId: string, name: string, role: string) => Character;
  updateCharacter: (bookId: string, characterId: string, updates: Partial<Pick<Character, 'name' | 'role'>>) => void;
  deleteCharacter: (bookId: string, characterId: string) => void;
  getBook: (bookId: string) => Book | undefined;
  getChapter: (bookId: string, chapterId: string) => Chapter | undefined;
  createFolder: (name: string, color: FolderColor) => Folder;
  updateFolder: (folderId: string, updates: Partial<Pick<Folder, 'name' | 'color'>>) => void;
  deleteFolder: (folderId: string) => void;
  assignBookToFolder: (bookId: string, folderId: string | null) => void;
}

const BookContext = createContext<BookContextValue | null>(null);

export function BookProvider({ children }: { children: React.ReactNode }) {
  const { user } = useUser();
  const { getToken } = useAuth();
  const userId = user?.id ?? null;
  const [books, setBooks] = useState<Book[]>([]);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [loading, setLoading] = useState(true);
  const isFirstRender = useRef(true);
  const isFoldersFirstRender = useRef(true);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const foldersTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const prevUserId = useRef<string | null>(null);

  useEffect(() => {
    // Reset save-guard refs whenever the user account changes.
    if (prevUserId.current !== userId) {
      // Cancel any pending saves immediately. If not cancelled, the timer
      // callback closes over the OLD user's books but getToken() will return
      // the NEW user's token — writing the wrong user's data to the DB.
      if (saveTimer.current) {
        clearTimeout(saveTimer.current);
        saveTimer.current = null;
      }
      if (foldersTimer.current) {
        clearTimeout(foldersTimer.current);
        foldersTimer.current = null;
      }
      isFirstRender.current = true;
      isFoldersFirstRender.current = true;
      prevUserId.current = userId;
    }

    if (!userId) {
      setBooks([]);
      setFolders([]);
      setLoading(false);
      return;
    }

    setLoading(true);

    const load = async () => {
      // Hard 8-second timeout on all network calls — guarantees setLoading(false)
      // always fires so the app never freezes on the loading screen.
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000);

      try {
        const token = await getToken();
        const authHeaders: Record<string, string> = token
          ? { Authorization: `Bearer ${token}` }
          : {};
        const jsonHeaders = { 'Content-Type': 'application/json' };
        const { signal } = controller;

        // Fetch from the authenticated backend — each user gets their own data.
        const [booksRes, foldersRes] = await Promise.all([
          fetch(`${API_BASE}/books`, { headers: authHeaders, signal }),
          fetch(`${API_BASE}/folders`, { headers: authHeaders, signal }),
        ]);

        if (!booksRes.ok || !foldersRes.ok) throw new Error('API unavailable');

        let userBooks: Book[] = ((await booksRes.json()) as Book[]).map(normalizeBook);
        let userFolders: Folder[] = (await foldersRes.json()) as Folder[];

        // One-time migration: if the server has no books yet, lift any
        // existing device-local data up to the server, running contamination
        // cleanup first so only clean data reaches the database.
        if (userBooks.length === 0) {
          const [localRaw, legacyRaw] = await Promise.all([
            AsyncStorage.getItem(scopedKey(STORAGE_KEY, userId)),
            AsyncStorage.getItem(STORAGE_KEY),
          ]);
          let localBooks: Book[] = localRaw ? (JSON.parse(localRaw) as Book[]).map(normalizeBook) : [];
          if (legacyRaw) {
            try {
              const legacyBooks = JSON.parse(legacyRaw) as Book[];
              const poisonIds = new Set(legacyBooks.map((b) => b.id));
              localBooks = localBooks.filter((b) => !poisonIds.has(b.id));
            } catch { /* ignore malformed data */ }
            await AsyncStorage.removeItem(STORAGE_KEY);
          }
          if (localBooks.length > 0) {
            try {
              const migRes = await fetch(`${API_BASE}/books/sync`, {
                method: 'PUT',
                headers: { ...authHeaders, ...jsonHeaders },
                body: JSON.stringify(localBooks),
                signal,
              });
              if (migRes.ok) {
                userBooks = localBooks;
                await AsyncStorage.removeItem(scopedKey(STORAGE_KEY, userId));
              }
            } catch { /* migration failed — keep local data, retry next login */ }
          }
        }

        if (userFolders.length === 0) {
          const [localRaw, legacyRaw] = await Promise.all([
            AsyncStorage.getItem(scopedKey(FOLDERS_KEY, userId)),
            AsyncStorage.getItem(FOLDERS_KEY),
          ]);
          let localFolders: Folder[] = localRaw ? (JSON.parse(localRaw) as Folder[]) : [];
          if (legacyRaw) {
            try {
              const legacyFolders = JSON.parse(legacyRaw) as Folder[];
              const poisonIds = new Set(legacyFolders.map((f) => f.id));
              localFolders = localFolders.filter((f) => !poisonIds.has(f.id));
            } catch { /* ignore malformed data */ }
            await AsyncStorage.removeItem(FOLDERS_KEY);
          }
          if (localFolders.length > 0) {
            try {
              const migRes = await fetch(`${API_BASE}/folders/sync`, {
                method: 'PUT',
                headers: { ...authHeaders, ...jsonHeaders },
                body: JSON.stringify(localFolders),
                signal,
              });
              if (migRes.ok) {
                userFolders = localFolders;
                await AsyncStorage.removeItem(scopedKey(FOLDERS_KEY, userId));
              }
            } catch { /* migration failed — keep local data, retry next login */ }
          }
        }

        setBooks(userBooks);
        setFolders(userFolders);
      } catch {
        // API unreachable, timed out, or returned an error.
        // Fall back to local cache so the app still works offline.
        try {
          const [booksRaw, foldersRaw] = await Promise.all([
            AsyncStorage.getItem(scopedKey(STORAGE_KEY, userId)),
            AsyncStorage.getItem(scopedKey(FOLDERS_KEY, userId)),
          ]);
          setBooks(booksRaw ? (JSON.parse(booksRaw) as Book[]).map(normalizeBook) : []);
          setFolders(foldersRaw ? (JSON.parse(foldersRaw) as Folder[]) : []);
        } catch {
          setBooks([]);
          setFolders([]);
        }
      } finally {
        clearTimeout(timeoutId);
        setLoading(false);
      }
    };

    load();
  }, [userId]);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    if (!userId) return;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      getToken()
        .then((token) => {
          const headers: Record<string, string> = { 'Content-Type': 'application/json' };
          if (token) headers.Authorization = `Bearer ${token}`;
          return fetch(`${API_BASE}/books/sync`, {
            method: 'PUT',
            headers,
            body: JSON.stringify(books),
          });
        })
        .catch(() => {});
    }, 800);
  }, [books, userId]);

  useEffect(() => {
    if (isFoldersFirstRender.current) {
      isFoldersFirstRender.current = false;
      return;
    }
    if (!userId) return;
    if (foldersTimer.current) clearTimeout(foldersTimer.current);
    foldersTimer.current = setTimeout(() => {
      getToken()
        .then((token) => {
          const headers: Record<string, string> = { 'Content-Type': 'application/json' };
          if (token) headers.Authorization = `Bearer ${token}`;
          return fetch(`${API_BASE}/folders/sync`, {
            method: 'PUT',
            headers,
            body: JSON.stringify(folders),
          });
        })
        .catch(() => {});
    }, 800);
  }, [folders, userId]);

  const createBook = useCallback(
    (title: string, genre: Genre, description: string): Book => {
      const book: Book = {
        id: genId(),
        title,
        genre,
        description,
        chapters: [],
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      setBooks((prev) => [book, ...prev]);
      return book;
    },
    []
  );

  const updateBook = useCallback(
    (
      bookId: string,
      updates: Partial<
        Pick<
          Book,
          | 'title'
          | 'genre'
          | 'description'
          | 'synopsis'
          | 'screenplayFormat'
          | 'screenplayRuntime'
          | 'screenplayThemes'
          | 'screenplayCoreTheme'
          | 'screenplayMainMessage'
          | 'screenplayOpeningTheme'
          | 'prologue'
          | 'epilogue'
          | 'includeTOC'
          | 'includePrologue'
          | 'includeEpilogue'
          | 'previewFontId'
          | 'headingFontId'
          | 'dialogueFontId'
          | 'dialogueFontBold'
          | 'dialogueFontItalic'
          | 'headingFontBold'
          | 'headingFontItalic'
          | 'coverTitleFontId'
          | 'coverImageUri'
          | 'coverRawImageUri'
          | 'coverImageBase64'
          | 'coverAuthorName'
          | 'coverSubtitle'
          | 'amazonDescription'
          | 'seoKeywords'
          | 'folderId'
        >
      >
    ) => {
      setBooks((prev) =>
        prev.map((b) =>
          b.id === bookId ? { ...b, ...updates, updatedAt: Date.now() } : b
        )
      );
    },
    []
  );

  const deleteBook = useCallback((bookId: string) => {
    setBooks((prev) => prev.filter((b) => b.id !== bookId));
  }, []);

  const addCharacter = useCallback(
    (bookId: string, name: string, role: string): Character => {
      const character: Character = { id: genId(), name, role };
      setBooks((prev) =>
        prev.map((b) =>
          b.id === bookId
            ? { ...b, characters: [...(b.characters ?? []), character], updatedAt: Date.now() }
            : b
        )
      );
      return character;
    },
    []
  );

  const updateCharacter = useCallback(
    (bookId: string, characterId: string, updates: Partial<Pick<Character, 'name' | 'role'>>) => {
      setBooks((prev) =>
        prev.map((b) =>
          b.id === bookId
            ? {
                ...b,
                characters: (b.characters ?? []).map((c) =>
                  c.id === characterId ? { ...c, ...updates } : c
                ),
                updatedAt: Date.now(),
              }
            : b
        )
      );
    },
    []
  );

  const deleteCharacter = useCallback((bookId: string, characterId: string) => {
    setBooks((prev) =>
      prev.map((b) =>
        b.id === bookId
          ? {
              ...b,
              characters: (b.characters ?? []).filter((c) => c.id !== characterId),
              updatedAt: Date.now(),
            }
          : b
      )
    );
  }, []);

  const addChapter = useCallback(
    (bookId: string, title: string): Chapter => {
      const book = books.find((b) => b.id === bookId);
      const sections = buildDefaultSectionsForGenre(
        book?.genre ?? 'Fiction',
        book?.characters ?? []
      ).map((s) => ({ ...s, id: genId() }));
      const chapter: Chapter = {
        id: genId(),
        title,
        number: 0,
        sections,
        isComplete: false,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      let finalChapter = chapter;
      setBooks((prev) =>
        prev.map((b) => {
          if (b.id !== bookId) return b;
          finalChapter = { ...chapter, number: b.chapters.length + 1 };
          return {
            ...b,
            chapters: [...b.chapters, finalChapter],
            updatedAt: Date.now(),
          };
        })
      );
      return finalChapter;
    },
    [books]
  );

  const updateChapter = useCallback(
    (
      bookId: string,
      chapterId: string,
      updates: Partial<Pick<Chapter, 'title' | 'isComplete'>>
    ) => {
      setBooks((prev) =>
        prev.map((b) => {
          if (b.id !== bookId) return b;
          return {
            ...b,
            updatedAt: Date.now(),
            chapters: b.chapters.map((c) =>
              c.id === chapterId
                ? { ...c, ...updates, updatedAt: Date.now() }
                : c
            ),
          };
        })
      );
    },
    []
  );

  const deleteChapter = useCallback((bookId: string, chapterId: string) => {
    setBooks((prev) =>
      prev.map((b) => {
        if (b.id !== bookId) return b;
        const chapters = b.chapters
          .filter((c) => c.id !== chapterId)
          .map((c, i) => ({ ...c, number: i + 1 }));
        return { ...b, chapters, updatedAt: Date.now() };
      })
    );
  }, []);

  const updateSection = useCallback(
    (
      bookId: string,
      chapterId: string,
      sectionId: string,
      content: string
    ) => {
      setBooks((prev) =>
        prev.map((b) => {
          if (b.id !== bookId) return b;
          return {
            ...b,
            updatedAt: Date.now(),
            chapters: b.chapters.map((c) => {
              if (c.id !== chapterId) return c;
              return {
                ...c,
                updatedAt: Date.now(),
                sections: c.sections.map((s) =>
                  s.id === sectionId ? { ...s, content } : s
                ),
              };
            }),
          };
        })
      );
    },
    []
  );

  const updateSectionPrompt = useCallback(
    (
      bookId: string,
      chapterId: string,
      sectionId: string,
      prompt: string
    ) => {
      setBooks((prev) =>
        prev.map((b) => {
          if (b.id !== bookId) return b;
          return {
            ...b,
            updatedAt: Date.now(),
            chapters: b.chapters.map((c) => {
              if (c.id !== chapterId) return c;
              return {
                ...c,
                updatedAt: Date.now(),
                sections: c.sections.map((s) =>
                  s.id === sectionId ? { ...s, prompt } : s
                ),
              };
            }),
          };
        })
      );
    },
    []
  );

  const addSection = useCallback(
    (
      bookId: string,
      chapterId: string,
      type: SectionType,
      prompt: string
    ) => {
      const section: Section = { id: genId(), type, prompt, content: '' };
      setBooks((prev) =>
        prev.map((b) => {
          if (b.id !== bookId) return b;
          return {
            ...b,
            updatedAt: Date.now(),
            chapters: b.chapters.map((c) => {
              if (c.id !== chapterId) return c;
              return {
                ...c,
                updatedAt: Date.now(),
                sections: [...c.sections, section],
              };
            }),
          };
        })
      );
    },
    []
  );

  const updateChapterSectionOrder = useCallback(
    (bookId: string, chapterId: string, sections: Omit<Section, 'id'>[]) => {
      setBooks((prev) =>
        prev.map((b) => {
          if (b.id !== bookId) return b;
          return {
            ...b,
            updatedAt: Date.now(),
            chapters: b.chapters.map((c) => {
              if (c.id !== chapterId) return c;
              return {
                ...c,
                updatedAt: Date.now(),
                sections: sections.map((s) => ({ ...s, id: genId() })),
              };
            }),
          };
        })
      );
    },
    []
  );

  const deleteSection = useCallback(
    (bookId: string, chapterId: string, sectionId: string) => {
      setBooks((prev) =>
        prev.map((b) => {
          if (b.id !== bookId) return b;
          return {
            ...b,
            updatedAt: Date.now(),
            chapters: b.chapters.map((c) => {
              if (c.id !== chapterId) return c;
              return {
                ...c,
                updatedAt: Date.now(),
                sections: c.sections.filter((s) => s.id !== sectionId),
              };
            }),
          };
        })
      );
    },
    []
  );

  const replaceChapterSections = useCallback(
    (bookId: string, chapterId: string, sections: Omit<Section, 'id'>[]) => {
      setBooks((prev) =>
        prev.map((b) => {
          if (b.id !== bookId) return b;
          return {
            ...b,
            updatedAt: Date.now(),
            chapters: b.chapters.map((c) => {
              if (c.id !== chapterId) return c;
              return {
                ...c,
                updatedAt: Date.now(),
                sections: sections.map((s) => ({ ...s, id: genId() })),
              };
            }),
          };
        })
      );
    },
    []
  );

  const insertChapterAfter = useCallback(
    (bookId: string, afterChapterId: string, title: string): Chapter => {
      const book = books.find((b) => b.id === bookId);
      const sections = buildDefaultSectionsForGenre(
        book?.genre ?? 'Fiction',
        book?.characters ?? []
      ).map((s) => ({ ...s, id: genId() }));
      const newChapter: Chapter = {
        id: genId(),
        title,
        number: 0,
        sections,
        isComplete: false,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      let result = newChapter;
      setBooks((prev) =>
        prev.map((b) => {
          if (b.id !== bookId) return b;
          const idx = b.chapters.findIndex((c) => c.id === afterChapterId);
          const insertAt = idx === -1 ? b.chapters.length : idx + 1;
          const newChapters = [
            ...b.chapters.slice(0, insertAt),
            newChapter,
            ...b.chapters.slice(insertAt),
          ].map((c, i) => ({ ...c, number: i + 1 }));
          result = newChapters[insertAt];
          return { ...b, chapters: newChapters, updatedAt: Date.now() };
        })
      );
      return result;
    },
    [books]
  );

  const splitChapter = useCallback(
    (
      bookId: string,
      chapterId: string,
      parts: { title: string; sections: Omit<Section, 'id'>[] }[]
    ) => {
      setBooks((prev) =>
        prev.map((b) => {
          if (b.id !== bookId) return b;
          const idx = b.chapters.findIndex((c) => c.id === chapterId);
          if (idx === -1) return b;
          const newChapters = [
            ...b.chapters.slice(0, idx),
            ...parts.map((p, pi) => ({
              id: genId(),
              title: p.title,
              number: 0,
              sections: p.sections.map((s) => ({ ...s, id: genId() })),
              isComplete: false as const,
              createdAt: Date.now() + pi,
              updatedAt: Date.now() + pi,
            })),
            ...b.chapters.slice(idx + 1),
          ].map((c, i) => ({ ...c, number: i + 1 }));
          return { ...b, chapters: newChapters, updatedAt: Date.now() };
        })
      );
    },
    []
  );

  const getBook = useCallback(
    (bookId: string) => books.find((b) => b.id === bookId),
    [books]
  );

  const getChapter = useCallback(
    (bookId: string, chapterId: string) =>
      books.find((b) => b.id === bookId)?.chapters.find((c) => c.id === chapterId),
    [books]
  );

  const createFolder = useCallback((name: string, color: FolderColor): Folder => {
    const folder: Folder = { id: genId(), name, color, createdAt: Date.now() };
    setFolders((prev) => [...prev, folder]);
    return folder;
  }, []);

  const updateFolder = useCallback(
    (folderId: string, updates: Partial<Pick<Folder, 'name' | 'color'>>) => {
      setFolders((prev) =>
        prev.map((f) => (f.id === folderId ? { ...f, ...updates } : f))
      );
    },
    []
  );

  const deleteFolder = useCallback((folderId: string) => {
    setFolders((prev) => prev.filter((f) => f.id !== folderId));
    setBooks((prev) =>
      prev.map((b) =>
        b.folderId === folderId ? { ...b, folderId: undefined } : b
      )
    );
  }, []);

  const assignBookToFolder = useCallback(
    (bookId: string, folderId: string | null) => {
      setBooks((prev) =>
        prev.map((b) =>
          b.id === bookId
            ? { ...b, folderId: folderId ?? undefined, updatedAt: Date.now() }
            : b
        )
      );
    },
    []
  );

  return (
    <BookContext.Provider
      value={{
        books,
        folders,
        loading,
        createBook,
        updateBook,
        deleteBook,
        addChapter,
        updateChapter,
        deleteChapter,
        updateSection,
        updateSectionPrompt,
        addSection,
        updateChapterSectionOrder,
        deleteSection,
        replaceChapterSections,
        splitChapter,
        insertChapterAfter,
        addCharacter,
        updateCharacter,
        deleteCharacter,
        getBook,
        getChapter,
        createFolder,
        updateFolder,
        deleteFolder,
        assignBookToFolder,
      }}
    >
      {children}
    </BookContext.Provider>
  );
}

export function useBooks() {
  const ctx = useContext(BookContext);
  if (!ctx) throw new Error('useBooks must be used within BookProvider');
  return ctx;
}
