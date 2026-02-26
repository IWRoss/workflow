

const PT_11 = { magnitude: 11, unit: "PT" };

// Tune this if your markdown uses 4 spaces per nesting level instead of 2.
const SPACES_PER_INDENT_LEVEL = 2;

/**
 * Parse inline markdown formatting and return:
 * - plain text (without markers)
 * - bold/italic ranges (absolute doc indices)
 */
function parseInlineFormatting(raw, baseIndex) {
  const boldRanges = [];
  const italicRanges = [];

  // **bold** or __bold__
  const boldMatches = [...raw.matchAll(/\*\*(.+?)\*\*|__(.+?)__/g)].map((m) => ({
    type: "bold",
    originalStart: m.index,
    originalEnd: m.index + m[0].length,
    content: m[1] || m[2] || "",
  }));

  // *italic* or _italic_ (not inside bold)
  const italicMatchesAll = [
    ...raw.matchAll(/(?<!\*)\*([^*]+?)\*(?!\*)|(?<!_)_([^_]+?)_(?!_)/g),
  ].map((m) => ({
    type: "italic",
    originalStart: m.index,
    originalEnd: m.index + m[0].length,
    content: m[1] || m[2] || "",
  }));

  const italicMatches = italicMatchesAll.filter((it) => {
    return !boldMatches.some(
      (b) => it.originalStart >= b.originalStart && it.originalEnd <= b.originalEnd
    );
  });

  const markers = [...boldMatches, ...italicMatches].sort(
    (a, b) => a.originalStart - b.originalStart
  );

  let plain = "";
  let lastEnd = 0;

  for (const mk of markers) {
    plain += raw.slice(lastEnd, mk.originalStart);

    const start = baseIndex + plain.length;
    plain += mk.content;
    const end = baseIndex + plain.length;

    if (mk.type === "bold") boldRanges.push({ startIndex: start, endIndex: end });
    if (mk.type === "italic") italicRanges.push({ startIndex: start, endIndex: end });

    lastEnd = mk.originalEnd;
  }

  plain += raw.slice(lastEnd);
  return { plain, boldRanges, italicRanges };
}

/**
 * Turn leading spaces into leading tabs for Docs nesting.
 */
function indentationToTabs(leadingSpaces) {
  const count = leadingSpaces?.length || 0;
  const levels = Math.floor(count / SPACES_PER_INDENT_LEVEL);
  return "\t".repeat(Math.max(0, levels));
}

/**
 * Parse markdown and generate Docs API formatting requests.
 * @param {string} markdown
 * @param {number} startIndex - insertion index in the doc
 * @returns {{ plainText: string, requests: Array }}
 */
const parseMarkdownForGoogleDocs = (markdown, startIndex = 1) => {
  if (!markdown) return { plainText: "", requests: [] };

  const lines = markdown.replace(/\r\n/g, "\n").split("\n");

  const requests = [];

  // Inline styles
  const boldRanges = [];
  const italicRanges = [];

  // Heading line ranges (Option A: NORMAL_TEXT + bold + 11pt)
  const headingRanges = [];

  // Per-paragraph list info: { type: "bullet"|"number", startIndex, endIndex }
  // We collect every list paragraph individually, then merge contiguous same-type
  // paragraphs into blocks for a single createParagraphBullets call.
  const listParagraphs = [];

  let plainText = "";
  let currentIndex = startIndex;
  let lastLineWasList = false; // tracks whether the most recent non-blank line was a list item

  for (let i = 0; i < lines.length; i++) {
    let rawLine = lines[i];

    // Blank line: preserve it UNLESS it sits between two list items.
    // If we emit an empty paragraph between bullets, Google Docs will
    // auto-inherit bullet styling onto it, creating ghost "* " lines.
    if (rawLine.trim() === "") {
      // Look back: was the previous non-blank line a list item?
      const prevIsList = lastLineWasList;

      // Look ahead: is the next non-blank line also a list item?
      let nextIsList = false;
      if (prevIsList) {
        for (let k = i + 1; k < lines.length; k++) {
          const peek = lines[k];
          if (peek.trim() === "") continue; // skip further blanks
          // Check if it matches bullet or numbered pattern
          nextIsList = /^(\s*)[-*]\s+/.test(peek) || /^(\s*)\d+\.\s+/.test(peek);
          break;
        }
      }

      // Skip this blank line if it's between two list items
      if (prevIsList && nextIsList) {
        continue;
      }

      plainText += "\n";
      currentIndex = startIndex + plainText.length;
      continue;
    }

    // Detect heading: ## Heading
    let isHeading = false;
    const headingMatch = rawLine.match(/^(#{1,6})\s+(.*)$/);
    if (headingMatch) {
      isHeading = true;
      rawLine = headingMatch[2] || "";
    }

    // Detect bullet / numbered with indentation
    let isBullet = false;
    let isNumbered = false;
    let indentPrefix = "";

    // Bullet: allow leading whitespace (for nesting)
    const bulletMatch = rawLine.match(/^(\s*)[-*]\s+(.*)$/);
    if (bulletMatch) {
      indentPrefix = indentationToTabs(bulletMatch[1] || "");
      rawLine = bulletMatch[2] || "";
      isBullet = true;
    }

    // Numbered: allow leading whitespace (for nesting)
    if (!isBullet) {
      const numberedMatch = rawLine.match(/^(\s*)\d+\.\s+(.*)$/);
      if (numberedMatch) {
        indentPrefix = indentationToTabs(numberedMatch[1] || "");
        rawLine = numberedMatch[2] || "";
        isNumbered = true;
      }
    }

    // Build paragraph text: indent tabs + content (inline formatting)
    const lineStartIndex = currentIndex;
    const contentBaseIndex = lineStartIndex + indentPrefix.length;

    const {
      plain: contentPlain,
      boldRanges: br,
      italicRanges: ir,
    } = parseInlineFormatting(rawLine, contentBaseIndex);

    const plainLine = indentPrefix + contentPlain;

    // Append to document text with newline
    plainText += plainLine + "\n";

    // Collect inline style ranges
    boldRanges.push(...br);
    italicRanges.push(...ir);

    // Paragraph end (exclude newline) for paragraph-level styling
    const paragraphEndIndex = lineStartIndex + plainLine.length;

    // Heading Option A: store range to style as "normal heading look" (bold + 11pt)
    if (isHeading) {
      headingRanges.push({ startIndex: lineStartIndex, endIndex: paragraphEndIndex });
    }

    // Record individual list paragraph range.
    // endIndex = paragraphEndIndex + 1  (includes the \n, which Docs needs to
    // identify the paragraph for createParagraphBullets).
    if (isBullet) {
      listParagraphs.push({
        type: "bullet",
        startIndex: lineStartIndex,
        endIndex: paragraphEndIndex + 1,
      });
    } else if (isNumbered) {
      listParagraphs.push({
        type: "number",
        startIndex: lineStartIndex,
        endIndex: paragraphEndIndex + 1,
      });
    }

    // Track whether this line was a list item (for blank-line collapsing)
    lastLineWasList = isBullet || isNumbered;

    // Advance current index
    currentIndex = startIndex + plainText.length;
  }

  // ---- Merge contiguous same-type list paragraphs into blocks ----
  // Two list paragraphs are "contiguous" if there is nothing between them
  // except possibly other list paragraphs of the same type.
  // We detect gaps by checking whether paragraph N's startIndex equals
  // paragraph N-1's endIndex (i.e. they are adjacent, no blank line between).
  const bulletBlocks = [];
  const numberBlocks = [];

  if (listParagraphs.length > 0) {
    let blockStart = listParagraphs[0].startIndex;
    let blockEnd = listParagraphs[0].endIndex;
    let blockType = listParagraphs[0].type;

    for (let j = 1; j < listParagraphs.length; j++) {
      const prev = listParagraphs[j - 1];
      const curr = listParagraphs[j];

      // Continue the block if same type AND directly adjacent (no blank line gap)
      if (curr.type === blockType && curr.startIndex === prev.endIndex) {
        blockEnd = curr.endIndex;
      } else {
        // Close previous block
        if (blockType === "bullet") bulletBlocks.push({ startIndex: blockStart, endIndex: blockEnd });
        else numberBlocks.push({ startIndex: blockStart, endIndex: blockEnd });

        // Start new block
        blockStart = curr.startIndex;
        blockEnd = curr.endIndex;
        blockType = curr.type;
      }
    }

    // Close final block
    if (blockType === "bullet") bulletBlocks.push({ startIndex: blockStart, endIndex: blockEnd });
    else numberBlocks.push({ startIndex: blockStart, endIndex: blockEnd });
  }

  // ---- Strip trailing newline FIRST so clamp uses the real inserted length ----
  while (plainText.endsWith("\n")) {
  plainText = plainText.slice(0, -1);
}

  // ---- Clamp block endIndex to actual inserted text boundary ----
  // The inserted plainText does NOT have a trailing \n, so the absolute end
  // of our content in the doc is startIndex + plainText.length.
  // createParagraphBullets only needs to OVERLAP a paragraph's content to
  // apply — it does NOT need to include the paragraph's terminating \n.
  // Clamping here prevents the range from bleeding into whatever follows
  // the inserted text in the existing document.
  const textEndIndex = startIndex + plainText.length;

  const clampEnd = (block) => ({
    startIndex: block.startIndex,
    endIndex: Math.min(block.endIndex, textEndIndex),
  });

  const clampedBulletBlocks = bulletBlocks.map(clampEnd);
  const clampedNumberBlocks = numberBlocks.map(clampEnd);

  // ---- Build requests ----

  // 1) Heading styling (Option A)
  for (const h of headingRanges) {
    requests.push({
      updateParagraphStyle: {
        range: { startIndex: h.startIndex, endIndex: h.endIndex },
        paragraphStyle: { namedStyleType: "NORMAL_TEXT" },
        fields: "namedStyleType",
      },
    });

    requests.push({
      updateTextStyle: {
        range: { startIndex: h.startIndex, endIndex: h.endIndex },
        textStyle: { bold: true, fontSize: PT_11 },
        fields: "bold,fontSize",
      },
    });
  }

  // 2) Inline styles
  for (const r of boldRanges) {
    requests.push({
      updateTextStyle: {
        range: { startIndex: r.startIndex, endIndex: r.endIndex },
        textStyle: { bold: true },
        fields: "bold",
      },
    });
  }

  for (const r of italicRanges) {
    requests.push({
      updateTextStyle: {
        range: { startIndex: r.startIndex, endIndex: r.endIndex },
        textStyle: { italic: true },
        fields: "italic",
      },
    });
  }

  // 3) Bullets/numbering LAST (Docs may remove leading tabs when applying bullets)
  for (const block of clampedBulletBlocks) {
    if (block.endIndex > block.startIndex) {
      requests.push({
        createParagraphBullets: {
          range: { startIndex: block.startIndex, endIndex: block.endIndex },
          bulletPreset: "BULLET_DISC_CIRCLE_SQUARE",
        },
      });
    }
  }

  for (const block of clampedNumberBlocks) {
    if (block.endIndex > block.startIndex) {
      requests.push({
        createParagraphBullets: {
          range: { startIndex: block.startIndex, endIndex: block.endIndex },
          bulletPreset: "NUMBERED_DECIMAL_NESTED",
        },
      });
    }
  }

  return { plainText, requests };
};

/**
 * Find the index where a placeholder exists in the document.
 * Returns the start index of the placeholder text.
 */
const findPlaceholderIndex = async (docs, documentId, placeholder) => {
  const doc = await docs.documents.get({ documentId });
  const content = doc.data.body?.content || [];

  for (const element of content) {
    const para = element.paragraph;
    if (!para?.elements) continue;

    for (const textElement of para.elements) {
      const text = textElement.textRun?.content || "";
      const pos = text.indexOf(placeholder);
      if (pos !== -1) {
        return (textElement.startIndex ?? 0) + pos;
      }
    }
  }
  return null;
};

/**
 * Replace a placeholder with formatted markdown content:
 * - Deletes placeholder
 * - Inserts plain text
 * - Applies formatting requests
 */
const replaceWithFormattedMarkdown = async (docs, documentId, placeholder, markdown) => {
  const placeholderIndex = await findPlaceholderIndex(docs, documentId, placeholder);
  if (placeholderIndex == null) {
    console.warn(`Placeholder not found: ${placeholder}`);
    return false;
  }

  const { plainText, requests: formatRequests } = parseMarkdownForGoogleDocs(
    markdown,
    placeholderIndex
  );

  const requests = [
    {
      deleteContentRange: {
        range: {
          startIndex: placeholderIndex,
          endIndex: placeholderIndex + placeholder.length,
        },
      },
    },
    {
      insertText: {
        location: { index: placeholderIndex },
        text: plainText,
      },
    },
    ...formatRequests,
  ];

  await docs.documents.batchUpdate({
    documentId,
    requestBody: { requests },
  });

  return true;
};

/**
 * Generate insert+format requests (if you want to integrate into a larger batch)
 */
const generateInsertWithFormatRequests = (markdown, insertIndex) => {
  const { plainText, requests: formatRequests } = parseMarkdownForGoogleDocs(markdown, insertIndex);

  return {
    plainText,
    insertRequest: {
      insertText: {
        location: { index: insertIndex },
        text: plainText,
      },
    },
    formatRequests,
  };
};

module.exports = {
  parseMarkdownForGoogleDocs,
  findPlaceholderIndex,
  replaceWithFormattedMarkdown,
  generateInsertWithFormatRequests,
};