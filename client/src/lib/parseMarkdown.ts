/**
 * Client-side markdown phrase parsing utility
 */

import type { Phrase } from '@/shared/types';

/**
 * Markdown section structure
 */
export interface MarkdownSection {
  id: string;
  title: string;
  level: number;
  startLine: number;
  endLine: number;
  phrases: Phrase[];
}

/**
 * Parse markdown content to extract phrases, ignoring lines containing #
 */
export function parseMarkdownPhrases(content: string): Phrase[] {
  const lines = content.split('\n');
  const phrases: Phrase[] = [];

  lines.forEach((line, index) => {
    const trimmedLine = line.trim();

    // Skip empty lines, HTML comments, and lines containing # anywhere (treat as comments)
    if (trimmedLine && !trimmedLine.startsWith('<!--') && !trimmedLine.includes('#')) {
      // Regular text line (skip code blocks and empty lines)
      if (!trimmedLine.startsWith('```')) {
        // Check for **Response:** prefix
        let text = trimmedLine;
        let prefix: string | undefined;

        if (trimmedLine.startsWith('**Response:**')) {
          prefix = '**Response:**';
          text = trimmedLine.substring('**Response:**'.length).trim();
        }

        phrases.push({
          id: `${index}-text`,
          text: text,
          lineNumber: index + 1,
          isHeading: false,
          prefix: prefix,
        });
      }
    }
  });

  return phrases;
}

/**
 * Parse markdown content to extract sections (headings) and their phrases
 */
export function parseMarkdownSections(content: string): MarkdownSection[] {
  const lines = content.split('\n');
  const sections: MarkdownSection[] = [];
  const phrases = parseMarkdownPhrases(content);
  const headingLines: Array<{ index: number; level: number; title: string }> = [];

  // First pass: find all headings (only ## and above, ignore single #)
  lines.forEach((line, index) => {
    const trimmedLine = line.trim();
    const headingMatch = trimmedLine.match(/^(#{2,6})\s+(.+)$/);
    
    if (headingMatch) {
      headingLines.push({
        index,
        level: headingMatch[1].length,
        title: headingMatch[2].trim(),
      });
    }
  });

  // If no headings found, create a default section with all phrases
  if (headingLines.length === 0) {
    sections.push({
      id: 'section-all',
      title: 'All Phrases',
      level: 1,
      startLine: 0,
      endLine: lines.length - 1,
      phrases: phrases,
    });
    return sections;
  }

  // Second pass: create sections and assign phrases
  headingLines.forEach((heading, headingIndex) => {
    const startLine = heading.index + 1; // Line after heading
    const endLine = headingIndex < headingLines.length - 1
      ? headingLines[headingIndex + 1].index
      : lines.length;

    // Find phrases that belong to this section
    const sectionPhrases = phrases.filter(phrase =>
      phrase.lineNumber >= startLine && phrase.lineNumber < endLine
    );

    sections.push({
      id: `section-${heading.index}`,
      title: heading.title,
      level: heading.level,
      startLine,
      endLine,
      phrases: sectionPhrases,
    });
  });

  return sections;
}
