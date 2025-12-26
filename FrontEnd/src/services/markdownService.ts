// markdownService.ts
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkGfm from 'remark-gfm';
import remarkRehype from 'remark-rehype';
import rehypeStringify from 'rehype-stringify';
import rehypeHighlight from 'rehype-highlight';

/**
 * Parse markdown to HTML with support for:
 * - Tables (GitHub Flavored Markdown)
 * - Code blocks with syntax highlighting
 * - Lists, bold, italic, links, etc.
 */
export const markdownToHtml = async (markdown: string): Promise<string> => {
  try {
    const processor = unified()
      .use(remarkParse)
      .use(remarkGfm) // Enable GitHub Flavored Markdown (tables, strikethrough)
      .use(remarkRehype)
      .use(rehypeHighlight) // Syntax highlighting for code blocks
      .use(rehypeStringify);

    const html = await processor.process(markdown);
    return String(html);
  } catch (error) {
    console.error('Error parsing markdown:', error);
    return `<p>${markdown}</p>`; // Fallback to plain text
  }
};

/**
 * Check if a message contains markdown elements
 */
export const isMarkdown = (text: string): boolean => {
  const markdownPatterns = [
    /#{1,6}\s+/, // Headers
    /\|.*\|.*\|/, // Tables
    /```[\s\S]*?```/, // Code blocks
    /\*\*.*?\*\*/, // Bold
    /\*.*?\*/, // Italic
    /`.*?`/, // Inline code
    /\[.*?\]\(.*?\)/, // Links
    /^[-*+]\s+/, // Unordered lists
    /^\d+\.\s+/, // Ordered lists
  ];

  return markdownPatterns.some(pattern => pattern.test(text));
};