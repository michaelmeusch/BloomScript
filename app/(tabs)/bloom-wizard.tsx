import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useRef, useState, useCallback } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useBooks } from '@/context/BookContext';
import { getWorkLabel, getWorkLabelCap, replaceWorkLabel } from '@/lib/workLabel';
import { useColors } from '@/hooks/useColors';
import { useLanguage } from '@/context/LanguageContext';
import type { Chapter } from '@/types';
import { SUPPORTED_LANGUAGES } from '@/lib/i18n';
import { API_BASE } from '@/constants/api';
import { detectDialoguePunctuation, detectRunOns, type DialoguePuncIssue, type RunOnIssue } from '@/utils/proofing';

type Step = 'cover' | 'toc' | 'copyright' | 'dedication' | 'epigraph' | 'foreword' | 'preface' | 'acknowledgements' | 'prologue' | 'dialogue';

// ── Front-matter section config ─────────────────────────────────────────────
type FMKey = 'copyright' | 'dedication' | 'epigraph' | 'foreword' | 'preface' | 'acknowledgements';

interface FMFieldDef {
  key: string;
  label: string;
  placeholder: string;
  multiline?: boolean;
  minHeight?: number;
}

interface FMSectionConfig {
  label: string;
  icon: keyof typeof Feather.glyphMap;
  hint: string;
  placeholder: string;
  generateLabel: string;
  isTemplate: boolean;
  fields: FMFieldDef[];
}

const FM_CONFIG: Record<FMKey, FMSectionConfig> = {
  copyright: {
    label: 'Copyright Page',
    icon: 'shield',
    hint: 'Fill in the details and tap Build to generate standard copyright text, or type your own.',
    placeholder: 'Your copyright text will appear here after clicking Build, or type your own…',
    generateLabel: 'Build',
    isTemplate: true,
    fields: [
      { key: 'year', label: 'Copyright year', placeholder: '' },
      { key: 'author', label: 'Author / publisher name', placeholder: 'Your name or pen name' },
      { key: 'isbn', label: 'ISBN (optional)', placeholder: 'e.g. 978-0-00-000000-0' },
      { key: 'publisher', label: 'Publisher (optional)', placeholder: 'e.g. Self-published' },
    ],
  },
  dedication: {
    label: 'Dedication',
    icon: 'heart',
    hint: 'A short, personal tribute — usually 1 to 5 lines.',
    placeholder: 'For those who believed before I did…',
    generateLabel: 'Generate with AI',
    isTemplate: false,
    fields: [
      { key: 'dedicatees', label: 'Dedicated to', placeholder: 'e.g. My mother Sarah, who always believed' },
      { key: 'personalNote', label: 'Personal message (optional)', placeholder: 'e.g. For your quiet strength and patience', multiline: true, minHeight: 60 },
    ],
  },
  epigraph: {
    label: 'Epigraph',
    icon: 'message-circle',
    hint: 'A quote at the start of your book that captures its spirit. Type your own or let AI suggest one.',
    placeholder: '"…"\n— Author',
    generateLabel: 'Suggest a quote',
    isTemplate: false,
    fields: [
      { key: 'themeNotes', label: 'Theme or mood (helps AI pick the right quote)', placeholder: 'e.g. loss and redemption, the courage to begin', multiline: true, minHeight: 60 },
    ],
  },
  foreword: {
    label: 'Foreword',
    icon: 'users',
    hint: 'Written by someone other than you — a colleague, mentor, or authority in the field.',
    placeholder: 'It is a rare thing to encounter a work that…',
    generateLabel: 'Draft foreword',
    isTemplate: false,
    fields: [
      { key: 'forewordWriter', label: 'Written by (name)', placeholder: 'e.g. Dr. Jane Smith' },
      { key: 'writerRole', label: 'Their role or relationship', placeholder: 'e.g. Professor of Literature, longtime colleague' },
    ],
  },
  preface: {
    label: 'Preface',
    icon: 'feather',
    hint: 'Written by you — explain why you wrote this book and what readers will discover.',
    placeholder: 'This book began with a question I could not stop asking…',
    generateLabel: 'Draft preface',
    isTemplate: false,
    fields: [
      { key: 'writingJourney', label: 'Why did you write this book?', placeholder: 'e.g. A personal experience, years of research, a gap I noticed…', multiline: true, minHeight: 70 },
      { key: 'writingPurpose', label: 'What should readers take away?', placeholder: 'e.g. Practical tools, hope, a new perspective…', multiline: true, minHeight: 55 },
    ],
  },
  acknowledgements: {
    label: 'Acknowledgements',
    icon: 'award',
    hint: 'Thank the people who helped make your book possible.',
    placeholder: 'Writing this book would not have been possible without…',
    generateLabel: 'Draft acknowledgements',
    isTemplate: false,
    fields: [
      { key: 'thanksList', label: 'Who would you like to thank?', placeholder: 'e.g. My editor James, beta readers Sarah & Tom, my writing group, my family…', multiline: true, minHeight: 80 },
      { key: 'extraNotes', label: 'Additional context (optional)', placeholder: 'e.g. Research institutions, funding, archives…', multiline: true, minHeight: 50 },
    ],
  },
};

const FM_STEPS: FMKey[] = ['copyright', 'dedication', 'epigraph', 'foreword', 'preface', 'acknowledgements'];

function buildCopyrightText(inputs: Record<string, string>, genre: string): string {
  const year = inputs['year']?.trim() || new Date().getFullYear().toString();
  const author = inputs['author']?.trim() || '';
  const isbn = inputs['isbn']?.trim();
  const publisher = inputs['publisher']?.trim();
  const isNonFiction = ['Non-Fiction', 'Memoir', 'Biography', 'Self-Help'].includes(genre);
  const lines: string[] = [];
  lines.push(`© ${year} ${author}. All rights reserved.`);
  lines.push('');
  lines.push('No part of this publication may be reproduced, distributed, or transmitted in any form or by any means, including photocopying, recording, or other electronic or mechanical methods, without the prior written permission of the publisher, except in the case of brief quotations embodied in critical reviews and certain other noncommercial uses permitted by copyright law.');
  if (publisher) { lines.push(''); lines.push(`Published by ${publisher}`); }
  if (isbn) { lines.push(''); lines.push(`ISBN: ${isbn}`); }
  if (!isNonFiction) {
    lines.push('');
    lines.push("This is a work of fiction. Names, characters, businesses, places, events, and incidents are either the products of the author's imagination or used in a fictitious manner. Any resemblance to actual persons, living or dead, or actual events is purely coincidental.");
  }
  return lines.join('\n');
}

const STEPS: {
  key: Step;
  icon: keyof typeof Feather.glyphMap;
  question: string;
  subtitle: string;
  yesLabel: string;
  noLabel: string;
}[] = [
  {
    key: 'toc',
    icon: 'list',
    question: 'Generate a Table of Contents?',
    subtitle: "I'll build a formatted table of contents from your chapter titles, ready to include in your book preview and export.",
    yesLabel: 'Yes, generate ToC',
    noLabel: 'Skip for now',
  },
  {
    key: 'copyright',
    icon: 'shield',
    question: 'Add a Copyright page?',
    subtitle: 'Protect your work with a standard copyright notice including year, author name, and rights statement.',
    yesLabel: 'Yes, add copyright',
    noLabel: 'Skip for now',
  },
  {
    key: 'dedication',
    icon: 'heart',
    question: 'Would you like to add a Dedication?',
    subtitle: 'A short, personal tribute — usually just a few lines — to the people who inspired or supported your work.',
    yesLabel: 'Yes, write dedication',
    noLabel: 'Skip for now',
  },
  {
    key: 'epigraph',
    icon: 'message-circle',
    question: 'Add an Epigraph?',
    subtitle: 'A single quote at the very start of your book that sets the tone and hints at your theme.',
    yesLabel: 'Yes, add epigraph',
    noLabel: 'Skip for now',
  },
  {
    key: 'foreword',
    icon: 'users',
    question: 'Include a Foreword?',
    subtitle: "A foreword is written by someone other than you — a mentor, colleague, or expert who introduces your work.",
    yesLabel: 'Yes, add foreword',
    noLabel: 'Skip for now',
  },
  {
    key: 'preface',
    icon: 'feather',
    question: 'Write a Preface?',
    subtitle: 'Your personal voice explaining why you wrote this book, the journey behind it, and what readers will find inside.',
    yesLabel: 'Yes, write preface',
    noLabel: 'Skip for now',
  },
  {
    key: 'acknowledgements',
    icon: 'award',
    question: 'Add Acknowledgements?',
    subtitle: 'Thank the editors, beta readers, family, and everyone who made your book possible.',
    yesLabel: 'Yes, add acknowledgements',
    noLabel: 'Skip for now',
  },
  {
    key: 'prologue',
    icon: 'edit-3',
    question: 'Would you like to add a Prologue?',
    subtitle: "Write an opening prologue that sets the stage for your story. It will appear before Chapter 1 in your book preview.",
    yesLabel: 'Yes, write a prologue',
    noLabel: 'Skip for now',
  },
  {
    key: 'dialogue',
    icon: 'message-square',
    question: 'Check dialogue punctuation & grammar?',
    subtitle: "I'll scan every chapter for dialogue punctuation errors and run-on sentences, then offer AI-powered fixes for each one.",
    yesLabel: 'Yes, check my writing',
    noLabel: 'Skip for now',
  },
  {
    key: 'cover',
    icon: 'aperture',
    question: 'Would you like to design a cover?',
    subtitle: 'Open the Cover Studio to create a professional cover with backgrounds, shapes, and custom text — ready for Amazon KDP.',
    yesLabel: 'Yes, design a cover',
    noLabel: 'Skip for now',
  },
];

const STEP_LABEL: Record<Step, string> = {
  cover: 'Cover Design',
  toc: 'Table of Contents',
  copyright: 'Copyright',
  dedication: 'Dedication',
  epigraph: 'Epigraph',
  foreword: 'Foreword',
  preface: 'Preface',
  acknowledgements: 'Acknowledgements',
  prologue: 'Prologue',
  dialogue: 'Dialogue & Grammar Check',
};

export default function BloomWizardScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { bookId, chapterCount, wordCount } = useLocalSearchParams<{ bookId: string; chapterCount: string; wordCount: string }>();
  const { getBook, updateBook, updateChapter, updateSection } = useBooks();
  const { language } = useLanguage();
  const languageName = SUPPORTED_LANGUAGES.find(l => l.code === language)?.label ?? 'English';

  const [stepIdx, setStepIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<string, boolean>>({});

  // ToC state
  const [showTocEditor, setShowTocEditor] = useState(false);
  const [tocTitles, setTocTitles] = useState<string[]>([]);
  const [suggestingIdx, setSuggestingIdx] = useState<number | null>(null);
  const [suggestingAll, setSuggestingAll] = useState(false);
  const suggestingAllRef = useRef(false);

  // Prologue state (kept separate for backward compat)
  const [prologueText, setPrologueText] = useState('');
  const [showPrologueInput, setShowPrologueInput] = useState(false);
  const [generatingPrologue, setGeneratingPrologue] = useState(false);

  // Generic front-matter section state
  const [fmInputs, setFmInputs] = useState<Partial<Record<FMKey, Record<string, string>>>>({});
  const [fmTexts, setFmTexts] = useState<Partial<Record<FMKey, string>>>({});
  const [showEditorKey, setShowEditorKey] = useState<FMKey | null>(null);
  const [generatingKey, setGeneratingKey] = useState<FMKey | null>(null);

  // Dialogue & grammar check state
  const [showDialogueChecker, setShowDialogueChecker] = useState(false);
  const [dialogueIssues, setDialogueIssues] = useState<DialoguePuncIssue[]>([]);
  const [runOnIssues, setRunOnIssues] = useState<RunOnIssue[]>([]);
  type RepairState = { loading: boolean; suggestion: string | null; applied: boolean };
  const [dialogueRepairs, setDialogueRepairs] = useState<Record<string, RepairState>>({});

  const scrollRef = useRef<ScrollView>(null);

  const book = getBook(bookId ?? '');
  const currentStep = STEPS[stepIdx];
  const isDone = stepIdx >= STEPS.length;

  const advanceStep = (key: string, yes: boolean) => {
    setAnswers(prev => ({ ...prev, [key]: yes }));
    setStepIdx(i => i + 1);
    setTimeout(() => { scrollRef.current?.scrollToEnd({ animated: true }); }, 280);
  };

  const answer = (yes: boolean) => {
    if (!currentStep) return;
    Haptics.selectionAsync();
    const key = currentStep.key;

    if (key === 'toc' && yes) {
      setTocTitles(book?.chapters.map(c => c.title) ?? []);
      setShowTocEditor(true);
      return;
    }

    if (key === 'prologue' && yes) {
      setAnswers(prev => ({ ...prev, [key]: yes }));
      setShowPrologueInput(true);
      return;
    }

    if (key === 'dialogue' && yes) {
      const chapters = (book?.chapters ?? []).map(ch => ({
        id: ch.id,
        title: ch.title,
        content: ch.sections.map(s => s.content).join('\n\n'),
      }));
      const dlg = detectDialoguePunctuation(chapters);
      const ron = detectRunOns(chapters);
      setDialogueIssues(dlg.issues);
      setRunOnIssues(ron.issues);
      setDialogueRepairs({});
      setAnswers(prev => ({ ...prev, [key]: yes }));
      setShowDialogueChecker(true);
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 280);
      return;
    }

    if (yes && (FM_STEPS as string[]).includes(key)) {
      const fmKey = key as FMKey;
      // Pre-populate copyright defaults
      if (fmKey === 'copyright') {
        setFmInputs(prev => ({
          ...prev,
          copyright: {
            year: new Date().getFullYear().toString(),
            author: book?.coverAuthorName?.trim() || '',
            ...(prev['copyright'] ?? {}),
          },
        }));
      }
      setAnswers(prev => ({ ...prev, [key]: yes }));
      setShowEditorKey(fmKey);
      return;
    }

    advanceStep(key, yes);
  };

  // ── ToC helpers ──────────────────────────────────────────────────────────

  const saveToc = () => {
    const chapters = book?.chapters ?? [];
    chapters.forEach((ch, i) => {
      const newTitle = tocTitles[i]?.trim();
      if (newTitle && newTitle !== ch.title) {
        updateChapter(bookId ?? '', ch.id, { title: newTitle });
      }
    });
    updateBook(bookId ?? '', { includeTOC: true });
    setShowTocEditor(false);
    advanceStep('toc', true);
  };

  const skipTocNaming = () => {
    updateBook(bookId ?? '', { includeTOC: true });
    setShowTocEditor(false);
    advanceStep('toc', true);
  };

  const fetchSuggestion = useCallback(async (
    idx: number,
    chapters: Chapter[],
    currentTitles: string[]
  ): Promise<string | null> => {
    const ch = chapters[idx];
    if (!ch) return null;
    try {
      const chapterText = ch.sections.map(s => s.content.trim()).filter(Boolean).join('\n\n');
      const res = await fetch(`${API_BASE}/ai/suggest-chapter-name`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookTitle: book?.title,
          genre: book?.genre,
          bookDescription: book?.description,
          chapterNumber: ch.number,
          chapterText: chapterText.slice(0, 4000),
          currentTitle: currentTitles[idx] ?? ch.title,
          otherTitles: currentTitles.filter((_, i) => i !== idx),
          language: languageName !== 'English' ? languageName : undefined,
        }),
      });
      if (res.ok) {
        const data = await res.json() as { suggestion?: string };
        return data.suggestion ?? null;
      }
      const errText = await res.text().catch(() => '');
      throw new Error(`Server error ${res.status}${errText ? `: ${errText}` : ''}`);
    } catch (e) {
      throw e;
    }
  }, [book, languageName]);

  const suggestChapterName = async (idx: number) => {
    const chapters = book?.chapters ?? [];
    const ch = chapters[idx];
    if (!ch || suggestingIdx !== null || suggestingAll) return;
    setSuggestingIdx(idx);
    try {
      const suggestion = await fetchSuggestion(idx, chapters, tocTitles);
      if (suggestion) {
        setTocTitles(prev => { const next = [...prev]; next[idx] = suggestion; return next; });
      }
    } catch (e: any) {
      Alert.alert('Could not suggest a name', e?.message ?? 'Check your connection and try again.');
    }
    setSuggestingIdx(null);
  };

  const suggestAllChapterNames = async () => {
    const chapters = book?.chapters ?? [];
    if (chapters.length === 0 || suggestingAll) return;
    suggestingAllRef.current = true;
    setSuggestingAll(true);
    const workingTitles = [...tocTitles];
    let lastError: string | null = null;
    for (let idx = 0; idx < chapters.length; idx++) {
      if (!suggestingAllRef.current) break;
      setSuggestingIdx(idx);
      try {
        const suggestion = await fetchSuggestion(idx, chapters, workingTitles);
        if (suggestion) {
          workingTitles[idx] = suggestion;
          setTocTitles([...workingTitles]);
        }
      } catch (e: any) {
        lastError = e?.message ?? 'Unknown error';
        break;
      }
    }
    setSuggestingIdx(null);
    setSuggestingAll(false);
    suggestingAllRef.current = false;
    if (lastError) {
      Alert.alert('Suggest All stopped', lastError);
    }
  };

  const cancelSuggestAll = () => {
    suggestingAllRef.current = false;
    setSuggestingAll(false);
    setSuggestingIdx(null);
  };

  // ── Prologue helpers ──────────────────────────────────────────────────────

  const generatePrologue = async () => {
    if (generatingPrologue) return;
    setGeneratingPrologue(true);
    try {
      const chapters = book?.chapters ?? [];
      const res = await fetch(`${API_BASE}/ai/front-matter`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'prologue',
          bookTitle: book?.title ?? '',
          genre: book?.genre ?? 'fiction',
          bookDescription: book?.description,
          chapterTitles: chapters.map(c => c.title).filter(Boolean),
          language: languageName !== 'English' ? languageName : undefined,
        }),
      });
      if (res.ok) {
        const data = await res.json() as { text?: string };
        if (data.text) setPrologueText(data.text);
      } else {
        const errText = await res.text().catch(() => '');
        Alert.alert('Generation failed', `Server returned ${res.status}${errText ? `: ${errText}` : ''}. Try again.`);
      }
    } catch (e: any) {
      Alert.alert('Could not generate prologue', e?.message ?? 'Check your connection and try again.');
    }
    setGeneratingPrologue(false);
  };

  const savePrologue = () => {
    if (prologueText.trim()) {
      updateBook(bookId ?? '', { prologue: prologueText.trim(), includePrologue: true });
    }
    setShowPrologueInput(false);
    advanceStep('prologue', !!prologueText.trim());
  };

  const skipPrologue = () => {
    setShowPrologueInput(false);
    advanceStep('prologue', false);
  };

  // ── Dialogue & Grammar check helpers ─────────────────────────────────────

  const doneDialogueCheck = () => {
    setShowDialogueChecker(false);
    advanceStep('dialogue', true);
  };

  const requestRepairDialogue = async (key: string, line: string, issue: string) => {
    setDialogueRepairs(prev => ({ ...prev, [key]: { loading: true, suggestion: null, applied: false } }));
    try {
      const res = await fetch(`${API_BASE}/ai/repair-grammar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ line, issue, genre: book?.genre, bookTitle: book?.title }),
      });
      if (res.ok) {
        const data = await res.json() as { repair?: string };
        setDialogueRepairs(prev => ({ ...prev, [key]: { loading: false, suggestion: data.repair ?? null, applied: false } }));
      } else {
        setDialogueRepairs(prev => ({ ...prev, [key]: { loading: false, suggestion: null, applied: false } }));
        Alert.alert('Could not get fix', 'AI repair failed. Try again.');
      }
    } catch {
      setDialogueRepairs(prev => ({ ...prev, [key]: { loading: false, suggestion: null, applied: false } }));
      Alert.alert('Could not get fix', 'Check your connection and try again.');
    }
  };

  const applyRepairDialogue = (key: string, chapterId: string, originalLine: string, repair: string) => {
    const chapter = book?.chapters.find(c => c.id === chapterId);
    if (!chapter) return;
    const section = chapter.sections.find(s => s.content.includes(originalLine));
    if (!section) return;
    const newContent = section.content.replace(originalLine, repair);
    updateSection(bookId ?? '', chapter.id, section.id, newContent);
    setDialogueRepairs(prev => ({ ...prev, [key]: { ...prev[key]!, applied: true } }));
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const requestRepairRunOn = async (key: string, sentence: string) => {
    setDialogueRepairs(prev => ({ ...prev, [key]: { loading: true, suggestion: null, applied: false } }));
    try {
      const res = await fetch(`${API_BASE}/ai/repair-run-on`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sentence, genre: book?.genre, bookTitle: book?.title }),
      });
      if (res.ok) {
        const data = await res.json() as { repair?: string };
        setDialogueRepairs(prev => ({ ...prev, [key]: { loading: false, suggestion: data.repair ?? null, applied: false } }));
      } else {
        setDialogueRepairs(prev => ({ ...prev, [key]: { loading: false, suggestion: null, applied: false } }));
        Alert.alert('Could not get fix', 'AI repair failed. Try again.');
      }
    } catch {
      setDialogueRepairs(prev => ({ ...prev, [key]: { loading: false, suggestion: null, applied: false } }));
      Alert.alert('Could not get fix', 'Check your connection and try again.');
    }
  };

  const applyRepairRunOn = (key: string, chapterId: string, fullSentence: string, repair: string) => {
    const chapter = book?.chapters.find(c => c.id === chapterId);
    if (!chapter) return;
    const section = chapter.sections.find(s => s.content.includes(fullSentence));
    if (!section) return;
    const newContent = section.content.replace(fullSentence, repair);
    updateSection(bookId ?? '', chapter.id, section.id, newContent);
    setDialogueRepairs(prev => ({ ...prev, [key]: { ...prev[key]!, applied: true } }));
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  // ── Generic front-matter section helpers ─────────────────────────────────

  const setFmInput = (key: FMKey, field: string, value: string) => {
    setFmInputs(prev => ({
      ...prev,
      [key]: { ...(prev[key] ?? {}), [field]: value },
    }));
  };

  const generateSection = async (key: FMKey) => {
    if (generatingKey) return;
    setGeneratingKey(key);
    try {
      const inputs = fmInputs[key] ?? {};
      const chapters = book?.chapters ?? [];
      const res = await fetch(`${API_BASE}/ai/front-matter`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: key,
          bookTitle: book?.title ?? '',
          genre: book?.genre ?? 'Fiction',
          bookDescription: book?.description,
          chapterTitles: chapters.map(c => c.title).filter(Boolean),
          language: languageName !== 'English' ? languageName : undefined,
          ...inputs,
        }),
      });
      if (res.ok) {
        const data = await res.json() as { text?: string };
        if (data.text) setFmTexts(prev => ({ ...prev, [key]: data.text! }));
      } else {
        const errText = await res.text().catch(() => '');
        Alert.alert('Generation failed', `Server returned ${res.status}${errText ? `: ${errText}` : ''}. Try again.`);
      }
    } catch (e: any) {
      Alert.alert('Could not generate content', e?.message ?? 'Check your connection and try again.');
    }
    setGeneratingKey(null);
  };

  const saveSection = (key: FMKey) => {
    const text = fmTexts[key]?.trim();
    if (text) {
      const includeKey = `include${key.charAt(0).toUpperCase()}${key.slice(1)}`;
      updateBook(bookId ?? '', { [key]: text, [includeKey]: true } as Parameters<typeof updateBook>[1]);
    }
    setShowEditorKey(null);
    advanceStep(key, !!text);
  };

  const skipSection = (key: FMKey) => {
    setShowEditorKey(null);
    advanceStep(key, false);
  };

  // ── Navigation ────────────────────────────────────────────────────────────

  const goToCover = () => {
    router.push({ pathname: '/cover-generator', params: { bookId: bookId ?? '' } });
  };

  const goToBook = () => {
    router.replace({ pathname: '/book/[bookId]', params: { bookId: bookId ?? '' } });
  };

  // ── Dialogue checker card renderer ───────────────────────────────────────

  const renderDialogueChecker = () => {
    if (!showDialogueChecker) return null;
    const totalIssues = dialogueIssues.length + runOnIssues.length;
    const allApplied = totalIssues > 0 && [...dialogueIssues.map((_, i) => `dlg-${i}`), ...runOnIssues.map((_, i) => `ron-${i}`)].every(k => dialogueRepairs[k]?.applied);

    return (
      <View style={[styles.prologueCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 2 }}>
          <Feather name="message-square" size={15} color={colors.primary} />
          <Text style={[styles.prologueLabel, { color: colors.primary, marginBottom: 0 }]}>
            Dialogue & Grammar Check
          </Text>
        </View>

        {totalIssues === 0 ? (
          <View style={{ alignItems: 'center', paddingVertical: 20, gap: 10 }}>
            <Feather name="check-circle" size={36} color={colors.primary} />
            <Text style={{ fontSize: 15, fontFamily: 'Inter_700Bold', color: colors.foreground }}>All clear!</Text>
            <Text style={{ fontSize: 13, fontFamily: 'Inter_400Regular', color: colors.mutedForeground, textAlign: 'center', lineHeight: 19 }}>
              No dialogue punctuation errors or run-on sentences found.
            </Text>
          </View>
        ) : (
          <>
            <Text style={{ fontSize: 12, color: colors.mutedForeground, fontFamily: 'Inter_400Regular', lineHeight: 17, marginBottom: 8 }}>
              Found {totalIssues} issue{totalIssues !== 1 ? 's' : ''} — tap ⚡ AI Fix to get a suggested correction, then Apply to update your chapter.
            </Text>

            {/* Dialogue punctuation issues */}
            {dialogueIssues.length > 0 && (
              <View style={{ marginBottom: 6 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                  <View style={{ height: 1, flex: 1, backgroundColor: colors.border }} />
                  <Text style={{ fontSize: 10, fontFamily: 'Inter_600SemiBold', color: colors.mutedForeground, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                    Dialogue Punctuation · {dialogueIssues.length}
                  </Text>
                  <View style={{ height: 1, flex: 1, backgroundColor: colors.border }} />
                </View>
                {dialogueIssues.map((issue, i) => {
                  const key = `dlg-${i}`;
                  const repairState = dialogueRepairs[key];
                  return (
                    <View key={key} style={[styles.proofIssueCard, { borderColor: colors.primary + '30', backgroundColor: colors.primary + '06' }]}>
                      <Text style={[styles.proofIssueChapter, { color: colors.primary }]} numberOfLines={1}>
                        {issue.chapterTitle}
                      </Text>
                      <Text style={[styles.proofIssueBadge, { color: colors.primary, backgroundColor: colors.primary + '15' }]}>
                        {issue.issue}
                      </Text>
                      <Text style={[styles.proofIssueExcerpt, { color: colors.foreground }]} numberOfLines={3}>
                        {issue.excerpt}
                      </Text>
                      {repairState?.applied ? (
                        <View style={[styles.proofApplied, { backgroundColor: colors.primary + '12' }]}>
                          <Feather name="check-circle" size={13} color={colors.primary} />
                          <Text style={{ fontSize: 12, fontFamily: 'Inter_600SemiBold', color: colors.primary }}>Fix applied</Text>
                        </View>
                      ) : repairState?.suggestion ? (
                        <View style={{ gap: 6, marginTop: 4 }}>
                          <View style={[styles.proofSuggestionBox, { backgroundColor: colors.primary + '0D', borderColor: colors.primary + '25' }]}>
                            <Text style={{ fontSize: 12, fontFamily: 'Inter_400Regular', color: colors.foreground, lineHeight: 18 }}>
                              {repairState.suggestion}
                            </Text>
                          </View>
                          <TouchableOpacity
                            onPress={() => applyRepairDialogue(key, issue.chapterId, issue.excerpt.replace('…', ''), repairState.suggestion!)}
                            style={[styles.proofApplyBtn, { backgroundColor: colors.primary }]}
                            activeOpacity={0.8}
                          >
                            <Feather name="check" size={12} color="#fff" />
                            <Text style={{ fontSize: 12, fontFamily: 'Inter_700Bold', color: '#fff' }}>Apply Fix</Text>
                          </TouchableOpacity>
                        </View>
                      ) : (
                        <TouchableOpacity
                          onPress={() => requestRepairDialogue(key, issue.excerpt, issue.issue)}
                          disabled={repairState?.loading}
                          style={[styles.proofFixBtn, { borderColor: colors.primary + '50', backgroundColor: colors.primary + '10' }]}
                          activeOpacity={0.75}
                        >
                          {repairState?.loading ? (
                            <ActivityIndicator size="small" color={colors.primary} />
                          ) : (
                            <Feather name="zap" size={12} color={colors.primary} />
                          )}
                          <Text style={{ fontSize: 12, fontFamily: 'Inter_600SemiBold', color: colors.primary }}>
                            {repairState?.loading ? 'Getting fix…' : 'AI Fix'}
                          </Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  );
                })}
              </View>
            )}

            {/* Run-on sentence issues */}
            {runOnIssues.length > 0 && (
              <View>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                  <View style={{ height: 1, flex: 1, backgroundColor: colors.border }} />
                  <Text style={{ fontSize: 10, fontFamily: 'Inter_600SemiBold', color: colors.mutedForeground, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                    Run-on Sentences · {runOnIssues.length}
                  </Text>
                  <View style={{ height: 1, flex: 1, backgroundColor: colors.border }} />
                </View>
                {runOnIssues.map((issue, i) => {
                  const key = `ron-${i}`;
                  const repairState = dialogueRepairs[key];
                  return (
                    <View key={key} style={[styles.proofIssueCard, { borderColor: colors.warning + '40', backgroundColor: colors.warning + '08' }]}>
                      <Text style={[styles.proofIssueChapter, { color: colors.warning }]} numberOfLines={1}>
                        {issue.chapterTitle}
                      </Text>
                      <Text style={[styles.proofIssueBadge, { color: colors.warning, backgroundColor: colors.warning + '15' }]}>
                        Too long — over 40 words
                      </Text>
                      <Text style={[styles.proofIssueExcerpt, { color: colors.foreground }]} numberOfLines={3}>
                        {issue.sentence}
                      </Text>
                      {repairState?.applied ? (
                        <View style={[styles.proofApplied, { backgroundColor: colors.primary + '12' }]}>
                          <Feather name="check-circle" size={13} color={colors.primary} />
                          <Text style={{ fontSize: 12, fontFamily: 'Inter_600SemiBold', color: colors.primary }}>Fix applied</Text>
                        </View>
                      ) : repairState?.suggestion ? (
                        <View style={{ gap: 6, marginTop: 4 }}>
                          <View style={[styles.proofSuggestionBox, { backgroundColor: colors.warning + '0D', borderColor: colors.warning + '25' }]}>
                            <Text style={{ fontSize: 12, fontFamily: 'Inter_400Regular', color: colors.foreground, lineHeight: 18 }}>
                              {repairState.suggestion}
                            </Text>
                          </View>
                          <TouchableOpacity
                            onPress={() => applyRepairRunOn(key, issue.chapterId, issue.fullSentence, repairState.suggestion!)}
                            style={[styles.proofApplyBtn, { backgroundColor: colors.primary }]}
                            activeOpacity={0.8}
                          >
                            <Feather name="check" size={12} color="#fff" />
                            <Text style={{ fontSize: 12, fontFamily: 'Inter_700Bold', color: '#fff' }}>Apply Fix</Text>
                          </TouchableOpacity>
                        </View>
                      ) : (
                        <TouchableOpacity
                          onPress={() => requestRepairRunOn(key, issue.fullSentence)}
                          disabled={repairState?.loading}
                          style={[styles.proofFixBtn, { borderColor: colors.warning + '50', backgroundColor: colors.warning + '10' }]}
                          activeOpacity={0.75}
                        >
                          {repairState?.loading ? (
                            <ActivityIndicator size="small" color={colors.warning} />
                          ) : (
                            <Feather name="zap" size={12} color={colors.warning} />
                          )}
                          <Text style={{ fontSize: 12, fontFamily: 'Inter_600SemiBold', color: colors.warning }}>
                            {repairState?.loading ? 'Getting fix…' : 'AI Fix'}
                          </Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  );
                })}
              </View>
            )}
          </>
        )}

        <TouchableOpacity
          onPress={doneDialogueCheck}
          style={[styles.prologueSave, { backgroundColor: allApplied ? colors.primary : colors.primary, marginTop: 4 }]}
          activeOpacity={0.85}
        >
          <Text style={styles.prologueSaveText}>
            {totalIssues === 0 ? 'Continue' : allApplied ? 'All fixed — continue' : `Done (${Object.values(dialogueRepairs).filter(r => r.applied).length}/${totalIssues} fixed)`}
          </Text>
        </TouchableOpacity>
      </View>
    );
  };

  // ── Generic FM editor card renderer ──────────────────────────────────────

  const renderFMEditor = () => {
    if (!showEditorKey) return null;
    const key = showEditorKey;
    const config = FM_CONFIG[key];
    const inputs = fmInputs[key] ?? {};
    const text = fmTexts[key] ?? '';
    const isGenerating = generatingKey === key;
    const canSave = !!text.trim();

    return (
      <View style={[styles.prologueCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        {/* Header */}
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Feather name={config.icon} size={15} color={colors.primary} />
            <Text style={[styles.prologueLabel, { color: colors.primary, marginBottom: 0 }]}>
              {config.label}
            </Text>
          </View>
          <TouchableOpacity
            onPress={() => {
              if (config.isTemplate) {
                const built = buildCopyrightText(inputs, book?.genre ?? 'Fiction');
                setFmTexts(prev => ({ ...prev, [key]: built }));
              } else {
                generateSection(key);
              }
            }}
            disabled={isGenerating}
            style={{ flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, borderWidth: 1, borderColor: colors.primary + '50', backgroundColor: colors.primary + '10' }}
            activeOpacity={0.75}
          >
            {isGenerating ? (
              <ActivityIndicator size="small" color={colors.primary} />
            ) : (
              <Feather name={config.isTemplate ? 'settings' : 'zap'} size={12} color={colors.primary} />
            )}
            <Text style={{ fontSize: 12, fontFamily: 'Inter_600SemiBold', color: colors.primary }}>
              {isGenerating ? 'Writing…' : (text && !config.isTemplate) ? 'Regenerate' : config.generateLabel}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Hint */}
        <Text style={{ fontSize: 12, color: colors.mutedForeground, fontFamily: 'Inter_400Regular', lineHeight: 17 }}>
          {replaceWorkLabel(config.hint, book?.genre)}
        </Text>

        {/* Input fields */}
        {config.fields.map(field => (
          <View key={field.key} style={{ gap: 4 }}>
            <Text style={styles.fmFieldLabel}>
              {field.label}
            </Text>
            <TextInput
              value={inputs[field.key] ?? ''}
              onChangeText={(v) => setFmInput(key, field.key, v)}
              placeholder={field.placeholder || (field.key === 'year' ? new Date().getFullYear().toString() : '')}
              placeholderTextColor={colors.mutedForeground}
              multiline={field.multiline}
              editable={!isGenerating}
              style={[
                styles.fmFieldInput,
                { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.background },
                field.multiline && { textAlignVertical: 'top', minHeight: field.minHeight ?? 60 },
              ]}
            />
          </View>
        ))}

        {/* Hint when text box is empty */}
        {!text && !isGenerating && !config.isTemplate && (
          <Text style={{ fontSize: 12, color: colors.mutedForeground + 'BB', fontFamily: 'Inter_400Regular', lineHeight: 17 }}>
            Fill in the fields above and tap {config.generateLabel}, or type your own below.
          </Text>
        )}

        {/* Text output */}
        <TextInput
          value={text}
          onChangeText={(v) => setFmTexts(prev => ({ ...prev, [key]: v }))}
          multiline
          placeholder={config.placeholder}
          placeholderTextColor={colors.mutedForeground}
          style={[styles.prologueInput, { color: colors.foreground, borderColor: colors.border, opacity: isGenerating ? 0.4 : 1 }]}
          textAlignVertical="top"
          scrollEnabled={false}
          editable={!isGenerating}
        />

        {/* Action buttons */}
        <View style={styles.prologueBtns}>
          <TouchableOpacity
            onPress={() => skipSection(key)}
            disabled={isGenerating}
            style={[styles.prologueSkip, { borderColor: colors.border, opacity: isGenerating ? 0.4 : 1 }]}
          >
            <Text style={[styles.prologueSkipText, { color: colors.mutedForeground }]}>Skip</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => saveSection(key)}
            disabled={isGenerating || !canSave}
            style={[styles.prologueSave, { backgroundColor: colors.primary, opacity: (isGenerating || !canSave) ? 0.4 : 1 }]}
          >
            <Text style={styles.prologueSaveText}>Save {config.label}</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  // ─────────────────────────────────────────────────────────────────────────

  const topPad = Platform.OS === 'web' ? 16 : insets.top;

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: colors.background }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>

      {/* ── Header ── */}
      <View style={[styles.header, { paddingTop: topPad + 12, backgroundColor: colors.primary }]}>
        <TouchableOpacity onPress={goToBook} style={styles.skipBtn}>
          <Text style={styles.skipBtnText}>Skip all</Text>
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <View style={[styles.bloomBadge, { backgroundColor: colors.accent }]}>
            <Text style={styles.bloomBadgeLetter}>B</Text>
          </View>
          <Text style={styles.headerTitle}>BloomScript Wizard</Text>
        </View>
        <View style={{ width: 60 }} />
      </View>

      {/* Progress bar */}
      <View style={[styles.progressRow, { backgroundColor: colors.primary }]}>
        {STEPS.map((s, i) => (
          <View key={s.key} style={[styles.progressSegment, {
            backgroundColor: answers[s.key] !== undefined
              ? colors.accent
              : i === stepIdx
                ? 'rgba(255,255,255,0.8)'
                : 'rgba(255,255,255,0.25)',
          }]} />
        ))}
      </View>
      <View style={[styles.progressLabel, { backgroundColor: colors.primary }]}>
        <Text style={styles.progressText}>
          {isDone ? '✓ Complete' : `Step ${stepIdx + 1} of ${STEPS.length}`}
          {book && !isDone ? ` · ${book.title}` : ''}
        </Text>
      </View>

      {/* ── Chat scroll ── */}
      <ScrollView
        ref={scrollRef}
        style={{ flex: 1 }}
        contentContainerStyle={[styles.chat, { paddingBottom: (Platform.OS === 'web' ? 24 : insets.bottom) + 24 }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: true })}
      >
        {/* Import confirmation bubble */}
        <View style={styles.systemBubble}>
          <View style={[styles.systemBubbleInner, { backgroundColor: colors.secondary, borderColor: colors.border }]}>
            <Feather name="check-circle" size={14} color={colors.primary} />
            <Text style={[styles.systemBubbleText, { color: colors.foreground }]}>
              Manuscript imported · {chapterCount} chapter{Number(chapterCount) !== 1 ? 's' : ''} · {Number(wordCount).toLocaleString()} words
            </Text>
          </View>
        </View>

        {/* Past answered steps */}
        {STEPS.slice(0, stepIdx).map(step => (
          <View key={step.key}>
            <View style={styles.bloomRow}>
              <View style={[styles.bloomAvatar, { backgroundColor: colors.accent }]}>
                <Text style={styles.bloomAvatarText}>B</Text>
              </View>
              <View style={[styles.bloomBubble, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <Feather name={step.icon} size={13} color={colors.primary} />
                <Text style={[styles.bloomBubbleText, { color: colors.foreground }]}>{step.question}</Text>
              </View>
            </View>
            <View style={styles.userRow}>
              <View style={[styles.userBubble, { backgroundColor: answers[step.key] ? colors.primary : colors.secondary, borderColor: answers[step.key] ? colors.primary : colors.border }]}>
                <Text style={[styles.userBubbleText, { color: answers[step.key] ? colors.primaryForeground : colors.mutedForeground }]}>
                  {answers[step.key] ? step.yesLabel : step.noLabel}
                </Text>
              </View>
            </View>
          </View>
        ))}

        {/* Current step question */}
        {!isDone && !showPrologueInput && !showTocEditor && !showEditorKey && !showDialogueChecker && (
          <View>
            <View style={styles.bloomRow}>
              <View style={[styles.bloomAvatar, { backgroundColor: colors.accent }]}>
                <Text style={styles.bloomAvatarText}>B</Text>
              </View>
              <View style={[styles.bloomBubble, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <Feather name={currentStep.icon} size={13} color={colors.primary} />
                <Text style={[styles.bloomBubbleText, { color: colors.foreground }]}>{currentStep.question}</Text>
              </View>
            </View>
            <View style={styles.bloomSubRow}>
              <View style={[styles.bloomSubBubble, { backgroundColor: colors.accent + '14', borderColor: colors.accent + '35' }]}>
                <Text style={[styles.bloomSubText, { color: colors.accent }]}>{replaceWorkLabel(currentStep.subtitle, book?.genre)}</Text>
              </View>
            </View>
            <View style={styles.answerBtns}>
              <TouchableOpacity onPress={() => answer(true)} activeOpacity={0.85}
                style={[styles.yesBtn, { backgroundColor: colors.primary }]}>
                <Feather name="check" size={15} color="#fff" />
                <Text style={styles.yesBtnText}>{currentStep.yesLabel}</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => answer(false)} activeOpacity={0.85}
                style={[styles.noBtn, { borderColor: colors.border }]}>
                <Text style={[styles.noBtnText, { color: colors.mutedForeground }]}>{currentStep.noLabel}</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* ToC chapter names editor */}
        {showTocEditor && (
          <View style={[styles.prologueCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 2 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Feather name="list" size={15} color={colors.primary} />
                <Text style={[styles.prologueLabel, { color: colors.primary, marginBottom: 0 }]}>Name your chapters</Text>
              </View>
              {suggestingAll ? (
                <TouchableOpacity
                  onPress={cancelSuggestAll}
                  style={{ flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 6, borderWidth: 1, borderColor: colors.border }}
                  activeOpacity={0.75}
                >
                  <Feather name="x" size={11} color={colors.mutedForeground} />
                  <Text style={{ fontSize: 11, fontFamily: 'Inter_500Medium', color: colors.mutedForeground }}>Cancel</Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  onPress={suggestAllChapterNames}
                  disabled={suggestingIdx !== null}
                  style={{ flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 6, borderWidth: 1, borderColor: colors.primary + '50', backgroundColor: colors.primary + '10' }}
                  activeOpacity={0.75}
                >
                  <Feather name="zap" size={11} color={colors.primary} />
                  <Text style={{ fontSize: 11, fontFamily: 'Inter_500Medium', color: colors.primary }}>Suggest All</Text>
                </TouchableOpacity>
              )}
            </View>
            <Text style={{ fontSize: 12, color: colors.mutedForeground, fontFamily: 'Inter_400Regular', lineHeight: 17, marginBottom: 4 }}>
              {suggestingAll
                ? `Generating names… (${suggestingIdx !== null ? suggestingIdx + 1 : '?'} of ${book?.chapters.length ?? 0})`
                : 'Edit each title or tap ⚡ for an AI name, or use Suggest All.'}
            </Text>

            {(book?.chapters ?? []).map((ch, idx) => (
              <View key={ch.id} style={[styles.tocRow, { borderColor: colors.border }]}>
                <Text style={[styles.tocChNum, { color: colors.mutedForeground }]}>Ch. {ch.number}</Text>
                <TextInput
                  style={[styles.tocInput, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.background }]}
                  value={tocTitles[idx] ?? ch.title}
                  onChangeText={(text) => setTocTitles(prev => { const next = [...prev]; next[idx] = text; return next; })}
                  placeholder={`Chapter ${ch.number}`}
                  placeholderTextColor={colors.mutedForeground}
                  returnKeyType="next"
                  editable={!suggestingAll}
                />
                <TouchableOpacity
                  onPress={() => suggestChapterName(idx)}
                  disabled={suggestingIdx !== null || suggestingAll}
                  style={[styles.tocSuggestBtn, { borderColor: colors.primary + '50', backgroundColor: colors.primary + '10' }]}
                  activeOpacity={0.75}
                >
                  {suggestingIdx === idx ? (
                    <ActivityIndicator size="small" color={colors.primary} />
                  ) : (
                    <Feather name="zap" size={13} color={(suggestingIdx !== null || suggestingAll) ? colors.mutedForeground : colors.primary} />
                  )}
                </TouchableOpacity>
              </View>
            ))}

            <View style={styles.prologueBtns}>
              <TouchableOpacity onPress={skipTocNaming} disabled={suggestingAll}
                style={[styles.prologueSkip, { borderColor: colors.border, opacity: suggestingAll ? 0.4 : 1 }]}>
                <Text style={[styles.prologueSkipText, { color: colors.mutedForeground }]}>Skip naming</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={saveToc} disabled={suggestingAll}
                style={[styles.prologueSave, { backgroundColor: colors.primary, opacity: suggestingAll ? 0.4 : 1 }]}>
                <Text style={styles.prologueSaveText}>Save Chapter Names</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Generic FM section editor */}
        {renderFMEditor()}

        {/* Dialogue & Grammar checker */}
        {renderDialogueChecker()}

        {/* Prologue inline editor */}
        {showPrologueInput && (
          <View style={[styles.prologueCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
              <Text style={[styles.prologueLabel, { color: colors.primary, marginBottom: 0 }]}>Write your Prologue</Text>
              <TouchableOpacity
                onPress={generatePrologue}
                disabled={generatingPrologue}
                style={{ flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, borderWidth: 1, borderColor: colors.primary + '50', backgroundColor: colors.primary + '10' }}
                activeOpacity={0.75}
              >
                {generatingPrologue ? (
                  <ActivityIndicator size="small" color={colors.primary} />
                ) : (
                  <Feather name="zap" size={12} color={colors.primary} />
                )}
                <Text style={{ fontSize: 12, fontFamily: 'Inter_600SemiBold', color: colors.primary }}>
                  {generatingPrologue ? 'Writing…' : prologueText ? 'Regenerate' : 'Generate with AI'}
                </Text>
              </TouchableOpacity>
            </View>
            {!prologueText && !generatingPrologue && (
              <Text style={{ fontSize: 12, color: colors.mutedForeground, fontFamily: 'Inter_400Regular', lineHeight: 17, marginBottom: 6 }}>
                Tap Generate to let AI write a 200–350 word opening, or type your own below.
              </Text>
            )}
            <TextInput
              value={prologueText}
              onChangeText={setPrologueText}
              multiline
              autoFocus={!generatingPrologue}
              placeholder="Set the stage for your story…"
              placeholderTextColor={colors.mutedForeground}
              style={[styles.prologueInput, { color: colors.foreground, borderColor: colors.border, opacity: generatingPrologue ? 0.4 : 1 }]}
              textAlignVertical="top"
              scrollEnabled={false}
              editable={!generatingPrologue}
            />
            <View style={styles.prologueBtns}>
              <TouchableOpacity onPress={skipPrologue} disabled={generatingPrologue}
                style={[styles.prologueSkip, { borderColor: colors.border, opacity: generatingPrologue ? 0.4 : 1 }]}>
                <Text style={[styles.prologueSkipText, { color: colors.mutedForeground }]}>Skip</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={savePrologue} disabled={generatingPrologue || !prologueText.trim()}
                style={[styles.prologueSave, { backgroundColor: colors.primary, opacity: (generatingPrologue || !prologueText.trim()) ? 0.4 : 1 }]}>
                <Text style={styles.prologueSaveText}>Save Prologue</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Done state */}
        {isDone && (
          <View style={[styles.doneCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={[styles.doneIcon, { backgroundColor: colors.primary + '18' }]}>
              <Text style={{ fontSize: 28 }}>🎉</Text>
            </View>
            <Text style={[styles.doneTitle, { color: colors.foreground }]}>Your {getWorkLabel(book?.genre)} is ready!</Text>
            <Text style={[styles.doneSub, { color: colors.mutedForeground }]}>Here's what BloomScript Novels Scripts Comic Production prepared:</Text>

            <View style={styles.doneSummary}>
              {STEPS.map(step => (
                <View key={step.key} style={[styles.doneSummaryRow, { borderColor: colors.border }]}>
                  <Feather name={step.icon} size={15} color={answers[step.key] ? colors.primary : colors.mutedForeground} />
                  <Text style={[styles.doneSummaryLabel, { color: answers[step.key] ? colors.foreground : colors.mutedForeground }]}>
                    {STEP_LABEL[step.key]}
                  </Text>
                  <Text style={[styles.doneSummaryStatus, { color: answers[step.key] ? colors.accent : colors.mutedForeground }]}>
                    {answers[step.key] ? '✓ Added' : 'Skipped'}
                  </Text>
                </View>
              ))}
            </View>

            {answers['cover'] && (
              <TouchableOpacity onPress={goToCover} activeOpacity={0.85}
                style={[styles.coverCta, { backgroundColor: '#FF990015', borderColor: '#FF990040' }]}>
                <Feather name="aperture" size={16} color="#FF9900" />
                <View style={{ flex: 1 }}>
                  <Text style={[styles.coverCtaTitle, { color: colors.foreground }]}>Open Cover Studio</Text>
                  <Text style={[styles.coverCtaSub, { color: colors.mutedForeground }]}>Design your {getWorkLabel(book?.genre)} cover now</Text>
                </View>
                <Feather name="chevron-right" size={16} color="#FF990080" />
              </TouchableOpacity>
            )}

            <TouchableOpacity onPress={goToBook} activeOpacity={0.85}
              style={[styles.goToBookBtn, { backgroundColor: colors.primary }]}>
              <Feather name="book-open" size={16} color="#fff" />
              <Text style={styles.goToBookText}>Go to My {getWorkLabelCap(book?.genre)}</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingBottom: 10 },
  skipBtn: { width: 60 },
  skipBtnText: { color: 'rgba(255,255,255,0.55)', fontSize: 13, fontFamily: 'Inter_500Medium' },
  headerCenter: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  bloomBadge: { width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  bloomBadgeLetter: { color: '#fff', fontFamily: 'Inter_700Bold', fontSize: 15 },
  headerTitle: { color: '#fff', fontSize: 16, fontFamily: 'Inter_700Bold' },
  progressRow: { flexDirection: 'row', gap: 3, paddingHorizontal: 16, paddingBottom: 4 },
  progressSegment: { flex: 1, height: 3, borderRadius: 99 },
  progressLabel: { paddingHorizontal: 16, paddingBottom: 14 },
  progressText: { color: 'rgba(255,255,255,0.55)', fontSize: 11, fontFamily: 'Inter_500Medium' },
  chat: { padding: 16, gap: 0 },
  systemBubble: { alignItems: 'center', marginBottom: 20 },
  systemBubbleInner: { flexDirection: 'row', alignItems: 'center', gap: 7, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 99, borderWidth: 1 },
  systemBubbleText: { fontSize: 12, fontFamily: 'Inter_500Medium' },
  bloomRow: { flexDirection: 'row', gap: 10, alignItems: 'flex-start', marginBottom: 6 },
  bloomAvatar: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 2 },
  bloomAvatarText: { color: '#fff', fontFamily: 'Inter_700Bold', fontSize: 13 },
  bloomBubble: { flexShrink: 1, borderRadius: 18, borderTopLeftRadius: 4, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 11, flexDirection: 'row', alignItems: 'flex-start', gap: 8, maxWidth: '85%' },
  bloomBubbleText: { flex: 1, fontSize: 14, fontFamily: 'Inter_500Medium', lineHeight: 21 },
  bloomSubRow: { paddingLeft: 38, marginBottom: 14 },
  bloomSubBubble: { borderWidth: 1, borderRadius: 14, paddingHorizontal: 13, paddingVertical: 9 },
  bloomSubText: { fontSize: 12, fontFamily: 'Inter_400Regular', lineHeight: 18 },
  userRow: { flexDirection: 'row', justifyContent: 'flex-end', marginBottom: 18 },
  userBubble: { borderWidth: 1, borderRadius: 18, borderTopRightRadius: 4, paddingHorizontal: 14, paddingVertical: 10, maxWidth: '75%' },
  userBubbleText: { fontSize: 13, fontFamily: 'Inter_600SemiBold' },
  answerBtns: { gap: 10, marginBottom: 20, paddingLeft: 38 },
  yesBtn: { borderRadius: 14, paddingVertical: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  yesBtnText: { color: '#fff', fontSize: 14, fontFamily: 'Inter_700Bold' },
  noBtn: { borderRadius: 14, paddingVertical: 12, alignItems: 'center', borderWidth: 1 },
  noBtnText: { fontSize: 13, fontFamily: 'Inter_500Medium' },
  prologueCard: { borderWidth: 1, borderRadius: 16, padding: 16, marginBottom: 16, gap: 12 },
  prologueLabel: { fontSize: 14, fontFamily: 'Inter_700Bold', marginBottom: 0 },
  prologueInput: { borderWidth: 1, borderRadius: 12, padding: 12, fontSize: 14, fontFamily: 'Inter_400Regular', lineHeight: 22, minHeight: 130 },
  prologueBtns: { flexDirection: 'row', gap: 10 },
  prologueSkip: { flex: 1, borderWidth: 1, borderRadius: 12, paddingVertical: 12, alignItems: 'center' },
  prologueSkipText: { fontSize: 13, fontFamily: 'Inter_500Medium' },
  prologueSave: { flex: 2, borderRadius: 12, paddingVertical: 12, alignItems: 'center' },
  prologueSaveText: { color: '#fff', fontSize: 14, fontFamily: 'Inter_700Bold' },
  fmFieldLabel: { fontSize: 11, fontFamily: 'Inter_600SemiBold', color: '#888', textTransform: 'uppercase', letterSpacing: 0.5 },
  fmFieldInput: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 11, paddingVertical: 9, fontSize: 13, fontFamily: 'Inter_400Regular', minHeight: 40 },
  doneCard: { borderWidth: 1, borderRadius: 20, padding: 20, gap: 14, alignItems: 'center' },
  doneIcon: { width: 60, height: 60, borderRadius: 30, alignItems: 'center', justifyContent: 'center' },
  doneTitle: { fontSize: 20, fontFamily: 'Inter_700Bold' },
  doneSub: { fontSize: 13, fontFamily: 'Inter_400Regular' },
  doneSummary: { width: '100%', gap: 0 },
  doneSummaryRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 11, borderBottomWidth: StyleSheet.hairlineWidth },
  doneSummaryLabel: { flex: 1, fontSize: 13, fontFamily: 'Inter_500Medium' },
  doneSummaryStatus: { fontSize: 12, fontFamily: 'Inter_600SemiBold' },
  coverCta: { width: '100%', flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 1, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 12 },
  coverCtaTitle: { fontSize: 14, fontFamily: 'Inter_600SemiBold' },
  coverCtaSub: { fontSize: 12, fontFamily: 'Inter_400Regular' },
  goToBookBtn: { width: '100%', borderRadius: 14, paddingVertical: 15, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 },
  goToBookText: { color: '#fff', fontSize: 15, fontFamily: 'Inter_700Bold' },
  tocRow: { flexDirection: 'row', alignItems: 'center', gap: 8, borderBottomWidth: StyleSheet.hairlineWidth, paddingVertical: 6 },
  tocChNum: { fontSize: 11, fontFamily: 'Inter_600SemiBold', width: 36 },
  tocInput: { flex: 1, borderWidth: 1, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 7, fontSize: 13, fontFamily: 'Inter_400Regular' },
  tocSuggestBtn: { width: 34, height: 34, borderRadius: 10, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  proofIssueCard: { borderWidth: 1, borderRadius: 12, padding: 12, gap: 6, marginBottom: 10 },
  proofIssueChapter: { fontSize: 11, fontFamily: 'Inter_700Bold', textTransform: 'uppercase', letterSpacing: 0.4 },
  proofIssueBadge: { fontSize: 11, fontFamily: 'Inter_600SemiBold', paddingHorizontal: 7, paddingVertical: 3, borderRadius: 6, alignSelf: 'flex-start' },
  proofIssueExcerpt: { fontSize: 12, fontFamily: 'Inter_400Regular', lineHeight: 18, fontStyle: 'italic' },
  proofApplied: { flexDirection: 'row', alignItems: 'center', gap: 6, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 7 },
  proofSuggestionBox: { borderWidth: 1, borderRadius: 10, padding: 10 },
  proofApplyBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, borderRadius: 10, paddingVertical: 9 },
  proofFixBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8, alignSelf: 'flex-start' },
});
