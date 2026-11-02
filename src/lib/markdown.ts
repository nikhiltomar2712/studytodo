/**
 * StudyFlow — tiny, safe markdown renderer for flashcard text.
 *
 * Supported (deliberately minimal):
 *   **bold**   *italic*   ~~strike~~   `inline code`
 *   - bullet lists   1. ordered lists
 *   line breaks (single \n becomes <br>)
 *
 * All input is HTML-escaped first, so this is XSS-safe for local content.
 */

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/** Strips basic markdown to a single line of plain text (for previews). */
export function toPlainText(raw: string): string {
  return (raw ?? "")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/\*([^*\n]+)\*/g, "$1")
    .replace(/~~([^~]+)~~/g, "$1")
    .replace(/^\s*(?:[-*+]|\d+[.)])\s+/gm, "• ")
    .replace(/\s*\n+\s*/g, " ")
    .trim();
}

export function renderMarkdown(raw: string): string {
  const escaped = escapeHtml(raw ?? "");

  // Split into lines, group consecutive list items.
  const lines = escaped.split(/\r?\n/);
  const out: string[] = [];
  let listBuffer: string[] = [];
  let listType: "ul" | "ol" | null = null;

  const flushList = () => {
    if (listType && listBuffer.length) {
      out.push(`<${listType}>${listBuffer.join("")}</${listType}>`);
    }
    listBuffer = [];
    listType = null;
  };

  const inline = (s: string): string => {
    return s
      .replace(/`([^`]+)`/g, "<code>$1</code>")
      .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
      .replace(/(^|[^*])\*([^*\n]+)\*(?!\*)/g, "$1<em>$2</em>")
      .replace(/~~([^~]+)~~/g, "<del>$1</del>");
  };

  for (const line of lines) {
    const trimmed = line.trim();
    const ulMatch = trimmed.match(/^[-*+]\s+(.*)$/);
    const olMatch = trimmed.match(/^\d+[.)]\s+(.*)$/);

    if (ulMatch) {
      if (listType === "ol") flushList();
      listType = "ul";
      listBuffer.push(`<li>${inline(ulMatch[1])}</li>`);
    } else if (olMatch) {
      if (listType === "ul") flushList();
      listType = "ol";
      listBuffer.push(`<li>${inline(olMatch[1])}</li>`);
    } else if (trimmed === "") {
      flushList();
    } else {
      flushList();
      out.push(inline(trimmed));
    }
  }
  flushList();

  return out.join("<br/>");
}
