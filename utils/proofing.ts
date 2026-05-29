// ── Shared proofing utilities ─────────────────────────────────────────────
// Detect run-on sentences and dialogue-punctuation issues across book chapters.
// Accepts chapters with an `id` field so callers can navigate to the chapter.

export type RunOnIssue = {
  sentence: string;
  fullSentence: string;
  chapterTitle: string;
  chapterId: string;
};

export type DialoguePuncIssue = {
  excerpt: string;
  issue: string;
  chapterTitle: string;
  chapterId: string;
};

function countWords(text: string) {
  return text.trim() ? text.trim().split(/\s+/).length : 0;
}

const DIALOGUE_TAGS =
  /^(said|asked|replied|whispered|shouted|murmured|muttered|called|cried|answered|laughed|groaned|growled|hissed|snapped|yelled|sighed|added|continued|began|finished|stated|declared|insisted|responded|repeated|breathed|faltered|blurted|scoffed|teased|urged|warned)\b/;

export function detectRunOns(
  chapters: { id: string; title: string; content: string }[]
): { count: number; issues: RunOnIssue[] } {
  const issues: RunOnIssue[] = [];
  let count = 0;
  for (const ch of chapters) {
    const sentences = ch.content
      .replace(/([.!?])\s+/g, '$1\n')
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean);
    for (const s of sentences) {
      const wc = countWords(s);
      const commas = (s.match(/,/g) ?? []).length;
      if (wc > 40 || (commas >= 3 && wc > 30)) {
        count++;
        const preview = s.length > 120 ? s.slice(0, 117) + '…' : s;
        issues.push({ sentence: preview, fullSentence: s, chapterTitle: ch.title, chapterId: ch.id });
      }
    }
  }
  return { count, issues };
}

export function detectDialoguePunctuation(
  chapters: { id: string; title: string; content: string }[]
): { count: number; issues: DialoguePuncIssue[] } {
  const issues: DialoguePuncIssue[] = [];
  let count = 0;
  const hasMixedQuotes: Set<string> = new Set();

  const flag = (line: string, issue: string, ch: { id: string; title: string }) => {
    count++;
    issues.push({
      excerpt: line.length > 110 ? line.slice(0, 107) + '…' : line,
      issue,
      chapterTitle: ch.title,
      chapterId: ch.id,
    });
  };

  for (const ch of chapters) {
    const lines = ch.content
      .split(/\n+/)
      .map((l) => l.trim())
      .filter(Boolean);

    for (const line of lines) {
      if (!/"/.test(line) && !/[\u201C\u201D]/.test(line)) continue;

      if (/"\s*[,.]/.test(line)) {
        flag(line, 'Punctuation outside closing quote — move it inside', ch);
        continue;
      }

      const tagMatch = line.match(/\.\"\s+([a-z]+)/);
      if (tagMatch && DIALOGUE_TAGS.test(tagMatch[1]!)) {
        flag(line, 'Period before dialogue tag — use a comma instead', ch);
        continue;
      }

      if (/--/.test(line)) {
        flag(line, 'Double dash — use an em dash (—) for interrupted speech', ch);
        continue;
      }

      const nStraight = (line.match(/"/g) ?? []).length;
      if (nStraight % 2 !== 0) {
        flag(line, 'Unmatched quotation mark — possible missing open or close quote', ch);
      }
    }

    const hasStraight = /"/.test(ch.content);
    const hasCurly = /[\u201C\u201D]/.test(ch.content);
    if (hasStraight && hasCurly && !hasMixedQuotes.has(ch.id)) {
      hasMixedQuotes.add(ch.id);
      count++;
      issues.push({
        excerpt: 'Mix of straight (" ") and curly (\u201C \u201D) quote marks',
        issue: 'Inconsistent quote style — pick one and use it throughout',
        chapterTitle: ch.title,
        chapterId: ch.id,
      });
    }
  }

  return { count, issues };
}
