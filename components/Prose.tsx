import type { ReactNode } from 'react';

/**
 * Tiny text-to-HTML renderer for blog posts and descriptions, so no markdown package is needed.
 *   "## Heading"      -> h2
 *   "- item" lines    -> bullet list
 *   anything else     -> paragraph (blank line between paragraphs)
 * Text is always rendered as text, never as HTML.
 */
export default function Prose({ text }: { text: string }) {
  const blocks = text.split(/\n{2,}/).map((b) => b.trim()).filter(Boolean);
  const out: ReactNode[] = [];
  blocks.forEach((block, i) => {
    if (block.startsWith('## ')) {
      out.push(<h2 key={i}>{block.slice(3).trim()}</h2>);
    } else if (block.split('\n').every((l) => l.trim().startsWith('- '))) {
      out.push(
        <ul key={i}>
          {block.split('\n').map((l, j) => (
            <li key={j}>{l.trim().slice(2)}</li>
          ))}
        </ul>,
      );
    } else {
      // a heading followed by text in the same block
      const lines = block.split('\n');
      if (lines[0].startsWith('## ')) {
        out.push(<h2 key={`${i}h`}>{lines[0].slice(3).trim()}</h2>);
        out.push(<p key={`${i}p`}>{lines.slice(1).join(' ').trim()}</p>);
      } else {
        out.push(<p key={i}>{lines.join(' ')}</p>);
      }
    }
  });
  return <div className="prose-body">{out}</div>;
}
