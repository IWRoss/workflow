

const MarkdownIt = require("markdown-it");

const PT_11 = { magnitude: 11, unit: "PT" };

// Tune this if your markdown uses 4 spaces per nesting level instead of 2.
const SPACES_PER_INDENT_LEVEL = 2;

/**
 * Render markdown-it inline tokens into plain text and style ranges.
 */
function renderInlineTokens(tokens, baseIndex) {
  const boldRanges = [];
  const italicRanges = [];
  const linkRanges = [];

  let text = "";
  const stack = [];

  const pushStyle = (type, data) => {
    stack.push({ type, data, startIndex: baseIndex + text.length });
  };

  const popStyle = (type) => {
    for (let i = stack.length - 1; i >= 0; i -= 1) {
      if (stack[i].type === type) {
        const entry = stack.splice(i, 1)[0];
        const endIndex = baseIndex + text.length;
        if (endIndex > entry.startIndex) {
          if (type === "bold") boldRanges.push({ startIndex: entry.startIndex, endIndex });
          if (type === "italic") italicRanges.push({ startIndex: entry.startIndex, endIndex });
          if (type === "link" && entry.data) {
            linkRanges.push({
              startIndex: entry.startIndex,
              endIndex,
              url: entry.data,
            });
          }
        }
        return;
      }
    }
  };

  for (const token of tokens || []) {
    switch (token.type) {
      case "text":
        text += token.content;
        break;
      case "softbreak":
      case "hardbreak":
        text += " ";
        break;
      case "strong_open":
        pushStyle("bold");
        break;
      case "strong_close":
        popStyle("bold");
        break;
      case "em_open":
        pushStyle("italic");
        break;
      case "em_close":
        popStyle("italic");
        break;
      case "link_open":
        pushStyle("link", token.attrGet("href"));
        break;
      case "link_close":
        popStyle("link");
        break;
      case "code_inline": {
        text += token.content;
        break;
      }
      case "image": {
        // Insert alt text or a placeholder for images
        text += token.content || "image";
        break;
      }
      default:
        break;
    }
  }

  // Close any unclosed styles at end of line
  for (let i = stack.length - 1; i >= 0; i -= 1) {
    const entry = stack[i];
    const endIndex = baseIndex + text.length;
    if (endIndex > entry.startIndex) {
      if (entry.type === "bold") boldRanges.push({ startIndex: entry.startIndex, endIndex });
      if (entry.type === "italic") italicRanges.push({ startIndex: entry.startIndex, endIndex });
      if (entry.type === "link" && entry.data) {
        linkRanges.push({ startIndex: entry.startIndex, endIndex, url: entry.data });
      }
    }
  }

  return { text, boldRanges, italicRanges, linkRanges };
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

  const md = new MarkdownIt({
    html: false,
    linkify: true,
    breaks: false,
  });

  const tokens = md.parse(markdown, {});

  const requests = [];

  // Inline styles
  const boldRanges = [];
  const italicRanges = [];
  const linkRanges = [];

  // Heading line ranges (Option A: NORMAL_TEXT + bold + 11pt)
  const headingRanges = [];

  // Per-paragraph list info: { type: "bullet"|"number", startIndex, endIndex }
  // We collect every list paragraph individually, then merge contiguous same-type
  // paragraphs into blocks for a single createParagraphBullets call.
  const listParagraphs = [];

  let plainText = "";
  let currentIndex = startIndex;

  const listStack = [];
  let inListItem = false;

  const appendLine = (lineText, isHeading, listType) => {
    const lineStartIndex = currentIndex;
    plainText += lineText + "\n";

    const paragraphEndIndex = lineStartIndex + lineText.length;

    if (isHeading) {
      headingRanges.push({ startIndex: lineStartIndex, endIndex: paragraphEndIndex });
    }

    if (listType) {
      listParagraphs.push({
        type: listType,
        startIndex: lineStartIndex,
        endIndex: paragraphEndIndex + 1,
      });
    }

    currentIndex = startIndex + plainText.length;
  };

  for (let i = 0; i < tokens.length; i += 1) {
    const token = tokens[i];

    switch (token.type) {
      case "bullet_list_open":
        listStack.push("bullet");
        break;
      case "ordered_list_open":
        listStack.push("number");
        break;
      case "bullet_list_close":
      case "ordered_list_close":
        listStack.pop();
        break;
      case "list_item_open":
        inListItem = true;
        break;
      case "list_item_close":
        inListItem = false;
        break;
      case "inline": {
        const prev = tokens[i - 1];
        const isHeading = prev && prev.type === "heading_open";
        const indentLevel = inListItem ? Math.max(0, listStack.length - 1) : 0;
        const indentPrefix = indentationToTabs(" ".repeat(indentLevel * SPACES_PER_INDENT_LEVEL));
        const listType = inListItem ? listStack[listStack.length - 1] : null;

        const contentBaseIndex = currentIndex + indentPrefix.length;
        const { text, boldRanges: br, italicRanges: ir, linkRanges: lr } =
          renderInlineTokens(token.children || [], contentBaseIndex);

        const lineText = indentPrefix + text;
        appendLine(lineText, isHeading, listType);

        boldRanges.push(...br);
        italicRanges.push(...ir);
        linkRanges.push(...lr);
        break;
      }
      case "fence":
      case "code_block": {
        const content = token.content || "";
        const lines = content.replace(/\n$/, "").split("\n");
        for (const line of lines) {
          appendLine(line, false, null);
        }
        break;
      }
      default:
        break;
    }
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

  for (const r of linkRanges) {
    requests.push({
      updateTextStyle: {
        range: { startIndex: r.startIndex, endIndex: r.endIndex },
        textStyle: { link: { url: r.url } },
        fields: "link",
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
 * Remove list styling that can leak into template paragraphs after inserted markdown.
 * Google Docs may keep bullet styling on following empty paragraphs in the template.
 */
const clearTrailingInheritedBullets = async (docs, documentId, anchorIndex) => {
  const doc = await docs.documents.get({ documentId });
  const content = doc.data.body?.content || [];

  // Find the paragraph that contains the anchor (end of inserted markdown)
  let anchorParagraphIdx = -1;
  for (let i = 0; i < content.length; i += 1) {
    const element = content[i];
    if (!element.paragraph) continue;
    const start = element.startIndex ?? 0;
    const end = element.endIndex ?? 0;
    if (anchorIndex >= start && anchorIndex <= end) {
      anchorParagraphIdx = i;
      break;
    }
  }

  if (anchorParagraphIdx === -1) return;

  // Scan following paragraphs and remove bullets from the contiguous inherited run
  let clearStart = null;
  let clearEnd = null;

  for (let i = anchorParagraphIdx + 1; i < content.length; i += 1) {
    const element = content[i];
    if (!element.paragraph) continue;

    const isBulletParagraph = Boolean(element.paragraph.bullet);
    if (isBulletParagraph) {
      if (clearStart == null) {
        clearStart = element.startIndex;
      }
      clearEnd = element.endIndex;
      continue;
    }

    // Stop at first non-bullet paragraph after starting a bullet run
    if (clearStart != null) {
      break;
    }

    // No inherited bullets immediately after inserted content
    break;
  }

  if (clearStart == null || clearEnd == null || clearEnd <= clearStart) {
    return;
  }

  await docs.documents.batchUpdate({
    documentId,
    requestBody: {
      requests: [
        {
          deleteParagraphBullets: {
            range: {
              startIndex: clearStart,
              endIndex: clearEnd,
            },
          },
        },
      ],
    },
  });
};

const findPlaceholderInParagraph = (elements = [], placeholder) => {
  const placeholderLength = placeholder.length;
  if (placeholderLength === 0) return null;

  // Sliding window across consecutive text runs so split tokens still match.
  const windowChars = [];
  const windowDocIndices = [];

  for (const textElement of elements) {
    const text = textElement.textRun?.content || "";
    const startIndex = textElement.startIndex;
    if (!text || startIndex == null) continue;

    for (let i = 0; i < text.length; i += 1) {
      windowChars.push(text[i]);
      windowDocIndices.push(startIndex + i);

      if (windowChars.length > placeholderLength) {
        windowChars.shift();
        windowDocIndices.shift();
      }

      if (windowChars.length === placeholderLength) {
        if (windowChars.join("") === placeholder) {
          return windowDocIndices[0];
        }
      }
    }
  }

  return null;
};

const findPlaceholderInContent = (content = [], placeholder) => {
  for (const element of content) {
    if (element.paragraph?.elements) {
      const paragraphIndex = findPlaceholderInParagraph(
        element.paragraph.elements,
        placeholder
      );
      if (paragraphIndex != null) return paragraphIndex;
    }

    if (element.table?.tableRows) {
      for (const row of element.table.tableRows) {
        for (const cell of row.tableCells || []) {
          const cellIndex = findPlaceholderInContent(
            cell.content || [],
            placeholder
          );
          if (cellIndex != null) return cellIndex;
        }
      }
    }

    if (element.tableOfContents?.content) {
      const tocIndex = findPlaceholderInContent(
        element.tableOfContents.content,
        placeholder
      );
      if (tocIndex != null) return tocIndex;
    }
  }

  return null;
};

/**
 * Find the index where a placeholder exists in the document.
 * Returns the start index of the placeholder text.
 */
const findPlaceholderIndex = async (docs, documentId, placeholder) => {
  const doc = await docs.documents.get({ documentId });

  const segments = [doc.data.body?.content || []];
  for (const header of Object.values(doc.data.headers || {})) {
    segments.push(header.content || []);
  }
  for (const footer of Object.values(doc.data.footers || {})) {
    segments.push(footer.content || []);
  }

  for (const content of segments) {
    const index = findPlaceholderInContent(content, placeholder);
    if (index != null) return index;
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

  // If inserted markdown created list items, ensure following template paragraphs
  // do not inherit list styling (common with placeholder + empty-line layouts).
  const insertedContainsLists = formatRequests.some(
    (req) => req.createParagraphBullets
  );

  if (insertedContainsLists) {
    const anchorIndex = placeholderIndex + plainText.length;
    await clearTrailingInheritedBullets(docs, documentId, anchorIndex);
  }

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
