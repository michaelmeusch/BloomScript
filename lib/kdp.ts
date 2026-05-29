import * as FileSystem from 'expo-file-system/legacy';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import JSZip from 'jszip';
import { Platform } from 'react-native';
import {
  AlignmentType,
  Document,
  HeadingLevel,
  Packer,
  Paragraph,
  TextRun,
  convertInchesToTwip,
} from 'docx';

import { getFontById, DEFAULT_FONT_ID, googleFontsCssLink } from '@/constants/fonts';
import { Book } from '@/types';

export type KdpFormat = 'epub' | 'docx' | 'kdp-pdf';
export type TrimSize = '6x9' | '5.5x8.5' | '5.06x7.81';

export const TRIM_SIZES: { id: TrimSize; label: string; desc: string }[] = [
  { id: '6x9', label: '6 × 9 in', desc: 'Standard novel (most popular)' },
  { id: '5.5x8.5', label: '5.5 × 8.5 in', desc: 'Non-fiction / self-help' },
  { id: '5.06x7.81', label: '5.06 × 7.81 in', desc: 'Trade paperback' },
];

const TRIM_DIMS: Record<TrimSize, { w: number; h: number }> = {
  '6x9': { w: 6, h: 9 },
  '5.5x8.5': { w: 5.5, h: 8.5 },
  '5.06x7.81': { w: 5.06, h: 7.81 },
};

const WORDS_PER_PAGE = 280;

export function estimatePageNumbers(book: Book): { pageMap: Record<string, number>; totalPages: number } {
  const pageMap: Record<string, number> = {};
  let page = 1;
  const inclPrologue = !!book.includePrologue && (book.prologue?.trim().length ?? 0) > 0;
  const inclEpilogue = !!book.includeEpilogue && (book.epilogue?.trim().length ?? 0) > 0;
  if (inclPrologue) {
    pageMap['prologue'] = page;
    page += Math.max(1, Math.ceil(book.prologue!.trim().split(/\s+/).filter(Boolean).length / WORDS_PER_PAGE));
  }
  for (const chapter of book.chapters) {
    pageMap[chapter.id] = page;
    const words = chapter.sections.reduce((s, sec) => s + sec.content.trim().split(/\s+/).filter(Boolean).length, 0);
    page += Math.max(1, Math.ceil(words / WORDS_PER_PAGE));
  }
  if (inclEpilogue) {
    pageMap['epilogue'] = page;
    page += Math.max(1, Math.ceil(book.epilogue!.trim().split(/\s+/).filter(Boolean).length / WORDS_PER_PAGE));
  }
  return { pageMap, totalPages: Math.max(0, page - 1) };
}

function safeName(title: string): string {
  return title.replace(/[^a-zA-Z0-9 ]/g, '').replace(/\s+/g, '_').slice(0, 50) || 'book';
}

function xmlEsc(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function xhtmlParagraphs(text: string): string {
  return text
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean)
    .map((p) => `<p>${xmlEsc(p).replace(/\n/g, '<br/>')}</p>`)
    .join('\n');
}

function buildChapterXhtml(title: string, subtitle: string, body: string): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops" xml:lang="en" lang="en">
<head>
  <meta charset="utf-8"/>
  <title>${xmlEsc(title)}</title>
  <link rel="stylesheet" type="text/css" href="../styles/style.css"/>
</head>
<body>
  <div class="chapter">
    <p class="chapter-label">${xmlEsc(title)}</p>
    ${subtitle ? `<h1>${xmlEsc(subtitle)}</h1>` : ''}
    <div class="chapter-body">
      ${body}
    </div>
  </div>
</body>
</html>`;
}

function epubStyle(cssStack: string): string {
  return `body {
  font-family: ${cssStack};
  font-size: 1em;
  line-height: 1.7;
  margin: 5%;
  color: #1a1a1a;
}
h1 {
  font-size: 1.5em;
  text-align: center;
  margin: 0 0 1.2em;
  font-weight: bold;
}
h2 {
  font-size: 1.1em;
  font-style: italic;
  text-align: center;
  margin: 0 0 2em;
  font-weight: normal;
  color: #555;
}
h3.section-prompt {
  font-size: 0.9em;
  font-style: italic;
  color: #666;
  margin: 1.5em 0 0.5em;
  font-weight: normal;
}
p {
  text-indent: 1.5em;
  margin: 0 0 0.2em;
  text-align: justify;
}
p.first { text-indent: 0; }
.chapter-label {
  font-size: 0.75em;
  text-transform: uppercase;
  letter-spacing: 0.15em;
  text-align: center;
  color: #999;
  margin: 0 0 0.4em;
  text-indent: 0;
}
.toc-list { list-style: none; padding: 0; }
.toc-list li { margin: 0.4em 0; }
.toc-list a { text-decoration: none; color: #1a1a1a; }
`;
}

export async function generateAndShareEpub(book: Book): Promise<void> {
  const font = getFontById(book.previewFontId ?? DEFAULT_FONT_ID);
  const includeTOC = !!book.includeTOC;
  const includePrologue = !!book.includePrologue && (book.prologue?.trim().length ?? 0) > 0;
  const includeEpilogue = !!book.includeEpilogue && (book.epilogue?.trim().length ?? 0) > 0;

  const bookId = `urn:uuid:${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
  const modDate = new Date().toISOString().split('.')[0] + 'Z';

  const items: { id: string; href: string }[] = [];
  const spineItems: string[] = [];
  const navEntries: { href: string; label: string }[] = [];
  const zip = new JSZip();

  zip.file('mimetype', 'application/epub+zip', { compression: 'STORE' });
  zip.file('META-INF/container.xml', `<?xml version="1.0" encoding="UTF-8"?>
<container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container">
  <rootfiles>
    <rootfile full-path="OEBPS/content.opf" media-type="application/oebps-package+xml"/>
  </rootfiles>
</container>`);

  zip.file('OEBPS/styles/style.css', epubStyle(font.cssStack));
  items.push({ id: 'style', href: 'styles/style.css' });

  const addChapter = (id: string, filename: string, labelTitle: string, subtitle: string, bodyXhtml: string, navLabel: string) => {
    zip.file(`OEBPS/${filename}`, buildChapterXhtml(labelTitle, subtitle, bodyXhtml));
    items.push({ id, href: filename });
    spineItems.push(id);
    navEntries.push({ href: filename, label: navLabel });
  };

  if (includePrologue) {
    const body = xhtmlParagraphs(book.prologue!.trim());
    addChapter('prologue', 'prologue.xhtml', 'Prologue', '', body, 'Prologue');
  }

  for (const chapter of book.chapters) {
    const id = `chapter${chapter.number}`;
    const filename = `chapter${chapter.number}.xhtml`;
    const bodyXhtml = chapter.sections
      .filter((s) => s.content.trim())
      .map((s) => {
        const prompt = s.prompt.trim()
          ? `<h3 class="section-prompt">${xmlEsc(s.prompt.trim())}</h3>`
          : '';
        return `${prompt}${xhtmlParagraphs(s.content.trim())}`;
      })
      .join('\n') || '<p class="first"><em>[No content written]</em></p>';

    addChapter(
      id,
      filename,
      `Chapter ${chapter.number}`,
      chapter.title,
      bodyXhtml,
      `Chapter ${chapter.number}: ${chapter.title}`,
    );
  }

  if (includeEpilogue) {
    const body = xhtmlParagraphs(book.epilogue!.trim());
    addChapter('epilogue', 'epilogue.xhtml', 'Epilogue', '', body, 'Epilogue');
  }

  const navOl = navEntries
    .map((e) => `    <li><a href="${e.href}">${xmlEsc(e.label)}</a></li>`)
    .join('\n');

  const navXhtml = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops">
<head>
  <meta charset="utf-8"/>
  <title>Table of Contents</title>
  <link rel="stylesheet" type="text/css" href="styles/style.css"/>
</head>
<body>
  <nav epub:type="toc" id="toc">
    <h1>Table of Contents</h1>
    <ol class="toc-list">
${navOl}
    </ol>
  </nav>
</body>
</html>`;
  zip.file('OEBPS/nav.xhtml', navXhtml);

  const manifestItems = [
    `<item id="nav" href="nav.xhtml" media-type="application/xhtml+xml" properties="nav"/>`,
    ...items.map((item) => {
      const mt = item.href.endsWith('.css') ? 'text/css' : 'application/xhtml+xml';
      return `<item id="${item.id}" href="${item.href}" media-type="${mt}"/>`;
    }),
  ].join('\n    ');

  const spineItemRefs = spineItems
    .map((id) => `<itemref idref="${id}"/>`)
    .join('\n    ');

  const opf = `<?xml version="1.0" encoding="UTF-8"?>
<package xmlns="http://www.idpf.org/2007/opf" version="3.0" unique-identifier="book-id" xml:lang="en">
  <metadata xmlns:dc="http://purl.org/dc/elements/1.1/">
    <dc:identifier id="book-id">${bookId}</dc:identifier>
    <dc:title>${xmlEsc(book.title)}</dc:title>
    <dc:language>en</dc:language>
    <dc:creator>Author</dc:creator>
    ${book.genre ? `<dc:subject>${xmlEsc(book.genre)}</dc:subject>` : ''}
    ${book.description ? `<dc:description>${xmlEsc(book.description)}</dc:description>` : ''}
    <meta property="dcterms:modified">${modDate}</meta>
  </metadata>
  <manifest>
    ${manifestItems}
  </manifest>
  <spine>
    ${includeTOC ? `<itemref idref="nav"/>` : ''}
    ${spineItemRefs}
  </spine>
</package>`;
  zip.file('OEBPS/content.opf', opf);

  const base64 = await zip.generateAsync({ type: 'base64' });
  const filename = `${safeName(book.title)}_kdp.epub`;
  const uri = `${FileSystem.cacheDirectory}${filename}`;
  await FileSystem.writeAsStringAsync(uri, base64, { encoding: FileSystem.EncodingType.Base64 });
  await Sharing.shareAsync(uri, {
    mimeType: 'application/epub+zip',
    dialogTitle: `Share "${book.title}" EPUB`,
    UTI: 'org.idpf.epub-container',
  });
}

export async function generateAndShareDocx(book: Book): Promise<void> {
  const includeTOC = !!book.includeTOC;
  const includePrologue = !!book.includePrologue && (book.prologue?.trim().length ?? 0) > 0;
  const includeEpilogue = !!book.includeEpilogue && (book.epilogue?.trim().length ?? 0) > 0;

  const children: Paragraph[] = [];

  const bodyParagraphs = (text: string, firstNoIndent = true): Paragraph[] =>
    text
      .split(/\n\n+/)
      .map((p) => p.trim())
      .filter(Boolean)
      .map((p, i) =>
        new Paragraph({
          children: [new TextRun({ text: p })],
          indent: i === 0 && firstNoIndent ? {} : { firstLine: convertInchesToTwip(0.3) },
          alignment: AlignmentType.JUSTIFIED,
          spacing: { after: 0 },
        }),
      );

  children.push(
    new Paragraph({
      children: [new TextRun({ text: book.title, bold: true })],
      heading: HeadingLevel.TITLE,
      alignment: AlignmentType.CENTER,
    }),
  );
  if (book.genre) {
    children.push(
      new Paragraph({
        children: [new TextRun({ text: book.genre.toUpperCase(), italics: true, color: '888888' })],
        alignment: AlignmentType.CENTER,
        spacing: { before: 120 },
      }),
    );
  }
  if (book.description) {
    children.push(
      new Paragraph({
        children: [new TextRun({ text: book.description, italics: true })],
        alignment: AlignmentType.CENTER,
        spacing: { before: 240 },
      }),
    );
  }

  if (includeTOC) {
    children.push(
      new Paragraph({ text: '', pageBreakBefore: true }),
      new Paragraph({
        children: [new TextRun({ text: 'Table of Contents' })],
        heading: HeadingLevel.HEADING_1,
        alignment: AlignmentType.CENTER,
      }),
    );
    if (includePrologue) {
      children.push(new Paragraph({ children: [new TextRun({ text: 'Prologue' })] }));
    }
    for (const c of book.chapters) {
      children.push(
        new Paragraph({ children: [new TextRun({ text: `Chapter ${c.number}: ${c.title}` })] }),
      );
    }
    if (includeEpilogue) {
      children.push(new Paragraph({ children: [new TextRun({ text: 'Epilogue' })] }));
    }
  }

  if (includePrologue) {
    children.push(
      new Paragraph({ text: '', pageBreakBefore: true }),
      new Paragraph({
        children: [new TextRun({ text: 'Prologue' })],
        heading: HeadingLevel.HEADING_1,
        alignment: AlignmentType.CENTER,
      }),
      ...bodyParagraphs(book.prologue!.trim()),
    );
  }

  for (const chapter of book.chapters) {
    children.push(
      new Paragraph({ text: '', pageBreakBefore: true }),
      new Paragraph({
        children: [
          new TextRun({
            text: `CHAPTER ${chapter.number}`,
            color: '999999',
            size: 18,
          }),
        ],
        alignment: AlignmentType.CENTER,
        spacing: { after: 80 },
      }),
      new Paragraph({
        children: [new TextRun({ text: chapter.title })],
        heading: HeadingLevel.HEADING_1,
        alignment: AlignmentType.CENTER,
      }),
    );

    for (const section of chapter.sections) {
      if (!section.content.trim()) continue;
      if (section.prompt.trim()) {
        children.push(
          new Paragraph({
            children: [new TextRun({ text: `— ${section.prompt.trim()} —`, italics: true, color: '666666' })],
            alignment: AlignmentType.CENTER,
            spacing: { before: 240, after: 120 },
          }),
        );
      }
      children.push(...bodyParagraphs(section.content.trim()));
    }
  }

  if (includeEpilogue) {
    children.push(
      new Paragraph({ text: '', pageBreakBefore: true }),
      new Paragraph({
        children: [new TextRun({ text: 'Epilogue' })],
        heading: HeadingLevel.HEADING_1,
        alignment: AlignmentType.CENTER,
      }),
      ...bodyParagraphs(book.epilogue!.trim()),
    );
  }

  const doc = new Document({
    sections: [{ children }],
  });

  const base64 = await Packer.toBase64String(doc);
  const filename = `${safeName(book.title)}_kdp.docx`;
  const uri = `${FileSystem.cacheDirectory}${filename}`;
  await FileSystem.writeAsStringAsync(uri, base64, { encoding: FileSystem.EncodingType.Base64 });
  await Sharing.shareAsync(uri, {
    mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    dialogTitle: `Share "${book.title}" DOCX`,
    UTI: 'org.openxmlformats.wordprocessingml.document',
  });
}

export async function generateAndShareKdpPdf(
  book: Book,
  trimSize: TrimSize,
  coverBase64?: string,
  coverMimeType?: string,
): Promise<void> {
  const font = getFontById(book.previewFontId ?? DEFAULT_FONT_ID);
  const dims = TRIM_DIMS[trimSize];
  const includeTOC = !!book.includeTOC;
  const includePrologue = !!book.includePrologue && (book.prologue?.trim().length ?? 0) > 0;
  const includeEpilogue = !!book.includeEpilogue && (book.epilogue?.trim().length ?? 0) > 0;

  function esc(s: string): string {
    return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  function paras(text: string): string {
    return text
      .split(/\n\s*\n/)
      .map((p) => p.trim())
      .filter(Boolean)
      .map((p, i) =>
        `<p${i === 0 ? ' class="first"' : ''}>${esc(p).replace(/\n/g, '<br/>')}</p>`,
      )
      .join('');
  }

  const { pageMap: pgMap } = estimatePageNumbers(book);

  const tocRow = (label: string, pg: number | string) =>
    `<tr>
      <td class="toc-lbl">${label}</td>
      <td class="toc-fill"></td>
      <td class="toc-pg">${pg}</td>
    </tr>`;

  const tocHtml = includeTOC
    ? `<div class="chapter toc">
        <h2 class="chapter-title" style="text-align:center">Table of Contents</h2>
        <table class="toc-tbl">
          ${includePrologue ? tocRow('Prologue', pgMap['prologue'] ?? 1) : ''}
          ${book.chapters.map((c) => tocRow(`Chapter ${c.number}: ${esc(c.title)}`, pgMap[c.id] ?? '—')).join('')}
          ${includeEpilogue ? tocRow('Epilogue', pgMap['epilogue'] ?? '—') : ''}
        </table>
      </div>`
    : '';

  const coverPageHtml = coverBase64
    ? `<div class="cover-page">
        <img src="data:${coverMimeType ?? 'image/jpeg'};base64,${coverBase64}"
             style="width:100%;height:100%;object-fit:cover;display:block"/>
      </div>`
    : '';

  const prologueHtml = includePrologue
    ? `<div class="chapter"><p class="chapter-num">Prologue</p>${paras(book.prologue!.trim())}</div>`
    : '';

  const epilogueHtml = includeEpilogue
    ? `<div class="chapter"><p class="chapter-num">Epilogue</p>${paras(book.epilogue!.trim())}</div>`
    : '';

  const chaptersHtml = book.chapters
    .map((ch) => {
      const body = ch.sections
        .filter((s) => s.content.trim())
        .map((s) => {
          const prompt = s.prompt.trim()
            ? `<h3 class="section-prompt">${esc(s.prompt.trim())}</h3>`
            : '';
          return `${prompt}${paras(s.content.trim())}`;
        })
        .join('');
      return `<div class="chapter">
        <p class="chapter-num">Chapter ${ch.number}</p>
        <h2 class="chapter-title">${esc(ch.title)}</h2>
        ${body || '<p class="first" style="color:#999;font-style:italic">[No content written]</p>'}
      </div>`;
    })
    .join('');

  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8"/>
  <link href="${googleFontsCssLink()}" rel="stylesheet"/>
  <style>
    @page {
      size: ${dims.w}in ${dims.h}in;
      margin: 0.75in 0.5in 0.75in 0.75in;
      @bottom-center { content: counter(page); font-size: 9pt; color: #999; font-family: ${font.cssStack}; }
    }
    @page cover-page { margin: 0; @bottom-center { content: none; } }
    body { font-family: ${font.cssStack}; font-size: 11pt; line-height: 1.8; color: #1a1a1a; }
    .cover-page {
      page: cover-page;
      page-break-after: always;
      margin: -0.75in -0.5in -0.75in -0.75in;
      width: ${dims.w}in;
      height: ${dims.h}in;
      overflow: hidden;
      position: relative;
    }
    .cover-page img { position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover; }
    .title-page { text-align: center; padding: 48pt 0 36pt; }
    h1.book-title { font-size: 26pt; margin: 0 0 8pt; letter-spacing: -0.5pt; }
    .book-genre { font-size: 8pt; text-transform: uppercase; letter-spacing: 2pt; color: #888; margin: 0; }
    .book-desc { font-size: 10pt; color: #555; font-style: italic; margin-top: 14pt; }
    .chapter { page-break-before: always; margin-top: 0; }
    .toc-tbl { width: 100%; border-collapse: collapse; }
    .toc-lbl { font-size: 11pt; padding: 3pt 0; text-align: left; }
    .toc-fill { width: 100%; border-bottom: 0.5pt dotted #bbb; padding-bottom: 2pt; vertical-align: bottom; padding-left: 4pt; padding-right: 4pt; }
    .toc-pg { font-size: 11pt; padding: 3pt 0 3pt 6pt; text-align: right; white-space: nowrap; }
    .chapter-num { font-size: 8pt; text-transform: uppercase; letter-spacing: 2pt; color: #999; margin: 0 0 4pt; text-align: center; }
    h2.chapter-title { font-size: 18pt; margin: 0 0 18pt; font-weight: bold; text-align: center; }
    h3.section-prompt { font-size: 10pt; font-weight: normal; font-style: italic; color: #666; margin: 16pt 0 6pt; text-align: center; }
    p { margin: 0; text-align: justify; text-indent: 1.5em; }
    p.first { text-indent: 0; }
  </style>
</head>
<body>
  ${coverPageHtml}
  <div class="title-page">
    <h1 class="book-title">${esc(book.title)}</h1>
    ${book.genre ? `<p class="book-genre">${esc(book.genre)}</p>` : ''}
    ${book.description ? `<p class="book-desc">${esc(book.description)}</p>` : ''}
  </div>
  ${tocHtml}
  ${prologueHtml}
  ${chaptersHtml}
  ${epilogueHtml}
</body>
</html>`;

  if (Platform.OS === 'web') {
    const printHtml = html.replace(
      '</head>',
      `<script>window.addEventListener('load', function() { setTimeout(function() { window.print(); }, 400); });</script></head>`,
    );
    const blob = new Blob([printHtml], { type: 'text/html;charset=utf-8' });
    const objectUrl = URL.createObjectURL(blob);
    window.open(objectUrl, '_blank');
    setTimeout(() => URL.revokeObjectURL(objectUrl), 10000);
    return;
  }

  const result = await Print.printToFileAsync({ html });
  if (!result?.uri) throw new Error('PDF generation failed.');
  const filename = `${safeName(book.title)}_kdp_${trimSize}.pdf`;
  const dest = `${FileSystem.cacheDirectory}${filename}`;
  await FileSystem.copyAsync({ from: result.uri, to: dest });
  await Sharing.shareAsync(dest, {
    mimeType: 'application/pdf',
    dialogTitle: `Share "${book.title}" KDP PDF`,
    UTI: 'com.adobe.pdf',
  });
}
