/**
 * Strip common Markdown syntax to produce plain text suitable for
 * text-to-speech or preview snippets.
 */
export function stripMarkdown(text: string): string {
  return text
    .replace(/#{1,6}\s?/g, "") // headings
    .replace(/\*{1,3}([^*]+)\*{1,3}/g, "$1") // bold/italic
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1") // links
    .replace(/^[\s]*[-*+]\s/gm, "") // list markers
    .replace(/^>\s?/gm, "") // blockquotes
    .replace(/`{1,3}[^`]*`{1,3}/g, "") // inline code
    .replace(/\n{2,}/g, " ") // collapse newlines
    .replace(/\n/g, " ")
    .trim();
}
