// ============================================================
// MAXVOLT — Tiny dependency-free markdown renderer
// ------------------------------------------------------------
// Supports the subset of markdown that an LLM typically returns:
//   - **bold**, *italic*, _italic_
//   - `inline code`
//   - ``` fenced code blocks ```
//   - # ## ### headings
//   - - / * / + bullet lists
//   - 1. 2. 3. numbered lists
//   - | table | syntax | with header separator row |
//   - --- horizontal rules
//   - [text](url) links
//   - line breaks
// Everything else is rendered as plain text (never as raw HTML),
// so it's safe against XSS.
// ============================================================

import { useMemo } from 'react';

/**
 * Render a single line of inline markdown (bold, italic, code, links).
 * Returns an array of React nodes.
 */
function renderInline(text, keyPrefix = 'i') {
  const nodes = [];
  let remaining = text;
  let key = 0;

  // Order matters: code first (so `**` inside backticks isn't parsed),
  // then links, then bold, then italic.
  const patterns = [
    {
      // `inline code`
      re: /`([^`]+)`/,
      render: (m) => (
        <code
          key={`${keyPrefix}-${key++}`}
          className="px-1.5 py-0.5 rounded bg-black/30 text-[0.85em] font-mono text-accent-light"
        >
          {m[1]}
        </code>
      ),
    },
    {
      // [text](url)
      re: /\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/,
      render: (m) => (
        <a
          key={`${keyPrefix}-${key++}`}
          href={m[2]}
          target="_blank"
          rel="noopener noreferrer"
          className="text-brand-light underline hover:text-accent-light"
        >
          {m[1]}
        </a>
      ),
    },
    {
      // **bold** or __bold__
      re: /\*\*([^*]+)\*\*|__([^_]+)__/,
      render: (m) => (
        <strong key={`${keyPrefix}-${key++}`} className="font-bold text-[var(--text)]">
          {m[1] || m[2]}
        </strong>
      ),
    },
    {
      // *italic* or _italic_
      re: /\*([^*]+)\*|_([^_]+)_/,
      render: (m) => (
        <em key={`${keyPrefix}-${key++}`} className="italic">
          {m[1] || m[2]}
        </em>
      ),
    },
  ];

  while (remaining.length > 0) {
    let matched = false;
    for (const { re, render } of patterns) {
      const m = remaining.match(re);
      if (m && m.index !== undefined) {
        if (m.index > 0) {
          nodes.push(remaining.slice(0, m.index));
        }
        nodes.push(render(m));
        remaining = remaining.slice(m.index + m[0].length);
        matched = true;
        break;
      }
    }
    if (!matched) {
      nodes.push(remaining);
      break;
    }
  }

  return nodes;
}

// ------------------------------------------------------------
// Table helpers
// ------------------------------------------------------------

/**
 * Check whether a line looks like a table row.
 * A row must contain at least one `|` and have non-empty cells
 * when split on unescaped pipes.
 */
function isTableRow(line) {
  if (typeof line !== 'string') return false;
  const trimmed = line.trim();
  if (!trimmed.includes('|')) return false;
  // Must start and/or end with a pipe OR have at least two pipes
  const pipeCount = (trimmed.match(/\|/g) || []).length;
  return pipeCount >= 2;
}

/**
 * Detect the GFM table separator row, e.g.:
 *   | --- | :---: | ---: |
 *   |-----|-------|------|
 * Allows optional leading/trailing pipes and alignment colons.
 */
function isSeparatorRow(line) {
  if (typeof line !== 'string') return false;
  const trimmed = line.trim();
  // Allow a row without outer pipes: "--- | ---"
  // Each cell must be 3+ dashes (GFM requires at least one dash;
  // we're lenient and accept 1+ but typically it's 3+).
  // Must contain at least one dash and a pipe.
  if (!trimmed.includes('-') || !trimmed.includes('|')) return false;

  const cells = splitTableRow(trimmed);
  if (cells.length === 0) return false;

  return cells.every((c) => /^:?-{1,}:?$/.test(c.trim()));
}

/**
 * Split a table row into cells, handling leading/trailing pipes and
 * stripping whitespace. Does not currently handle escaped `\|` inside
 * cells (LLMs rarely emit that).
 */
function splitTableRow(line) {
  let s = line.trim();

  // Strip a single leading pipe
  if (s.startsWith('|')) s = s.slice(1);
  // Strip a single trailing pipe
  if (s.endsWith('|')) s = s.slice(0, -1);

  return s.split('|').map((c) => c.trim());
}

/**
 * Determine column alignment from the separator row.
 * Returns an array of 'left' | 'center' | 'right' | null.
 */
function parseAlignments(separatorLine) {
  const cells = splitTableRow(separatorLine);
  return cells.map((c) => {
    const t = c.trim();
    const left = t.startsWith(':');
    const right = t.endsWith(':');
    if (left && right) return 'center';
    if (right) return 'right';
    if (left) return 'left';
    return null;
  });
}

/**
 * Parse a table starting at `startIndex`. Returns:
 *   { node, nextIndex }
 * or null if there is no valid table.
 */
function parseTable(lines, startIndex, blockKey) {
  const headerLine = lines[startIndex];
  if (!isTableRow(headerLine)) return null;

  // The next line must be a separator row
  if (startIndex + 1 >= lines.length) return null;
  if (!isSeparatorRow(lines[startIndex + 1])) return null;

  const headerCells = splitTableRow(headerLine);
  const alignments = parseAlignments(lines[startIndex + 1]);

  // Collect body rows until we hit a non-table line
  const bodyRows = [];
  let i = startIndex + 2;
  while (i < lines.length && isTableRow(lines[i])) {
    // A separator row inside the body is unusual — treat it as a row
    bodyRows.push(splitTableRow(lines[i]));
    i++;
  }

  const node = (
    <div
      key={`blk-${blockKey}`}
      className="my-3 rounded-lg border border-[var(--border)] overflow-hidden"
    >
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-[0.85em]">
          <thead>
            <tr className="bg-[var(--bg-muted)]">
              {headerCells.map((cell, ci) => (
                <th
                  key={ci}
                  className="px-3 py-2 text-left font-bold text-[var(--text)] border-b border-[var(--border)] whitespace-nowrap"
                  style={{
                    textAlign: alignments[ci] || 'left',
                  }}
                >
                  {renderInline(cell, `th-${ci}`)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {bodyRows.map((row, ri) => (
              <tr
                key={ri}
                className={
                  ri % 2 === 0
                    ? 'bg-transparent'
                    : 'bg-[var(--bg-muted)]/40'
                }
              >
                {row.map((cell, ci) => (
                  <td
                    key={ci}
                    className="px-3 py-2 text-[var(--text-muted)] border-b border-[var(--border)] align-top"
                    style={{
                      textAlign: alignments[ci] || 'left',
                    }}
                  >
                    {renderInline(cell, `td-${ri}-${ci}`)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  return { node, nextIndex: i };
}

// ------------------------------------------------------------
// Block-level parser
// ------------------------------------------------------------
function parseMarkdown(src) {
  const lines = String(src).replace(/\r\n/g, '\n').split('\n');
  const blocks = [];
  let i = 0;
  let key = 0;

  while (i < lines.length) {
    const line = lines[i];

    // Fenced code block
    const fence = line.match(/^\s*```(\w*)\s*$/);
    if (fence) {
      const codeLines = [];
      i++;
      while (i < lines.length && !/^\s*```\s*$/.test(lines[i])) {
        codeLines.push(lines[i]);
        i++;
      }
      i++; // skip closing fence
      blocks.push(
        <pre
          key={`blk-${key++}`}
          className="my-2 p-3 rounded-lg bg-black/40 border border-[var(--border)] overflow-x-auto text-[0.82em] leading-relaxed"
        >
          <code className="font-mono text-[var(--text)] whitespace-pre">
            {codeLines.join('\n')}
          </code>
        </pre>
      );
      continue;
    }

    // Heading
    const h = line.match(/^(#{1,3})\s+(.+)$/);
    if (h) {
      const level = h[1].length;
      const cls =
        level === 1
          ? 'text-base font-bold mt-3 mb-1.5'
          : level === 2
          ? 'text-[0.95rem] font-bold mt-3 mb-1.5'
          : 'text-[0.9rem] font-semibold mt-2 mb-1';
      blocks.push(
        <div key={`blk-${key++}`} className={cls + ' text-[var(--text)]'}>
          {renderInline(h[2], `h-${key}`)}
        </div>
      );
      i++;
      continue;
    }

    // Horizontal rule
    if (/^\s*([-*_])(\s*\1){2,}\s*$/.test(line)) {
      blocks.push(
        <hr
          key={`blk-${key++}`}
          className="my-3 border-0 h-px bg-[var(--border)]"
        />
      );
      i++;
      continue;
    }

    // Table — must be checked BEFORE bullet list because a bullet row
    // could look like a list item, and a table row could too.
    const tableResult = parseTable(lines, i, key);
    if (tableResult) {
      blocks.push(tableResult.node);
      key++;
      i = tableResult.nextIndex;
      continue;
    }

    // Bullet list
    if (/^\s*[-*+]\s+/.test(line)) {
      const items = [];
      while (i < lines.length && /^\s*[-*+]\s+/.test(lines[i])) {
        items.push(lines[i].replace(/^\s*[-*+]\s+/, ''));
        i++;
      }
      blocks.push(
        <ul key={`blk-${key++}`} className="list-disc ml-5 my-1.5 space-y-0.5">
          {items.map((it, idx) => (
            <li key={idx}>{renderInline(it, `ul-${key}-${idx}`)}</li>
          ))}
        </ul>
      );
      continue;
    }

    // Numbered list
    if (/^\s*\d+\.\s+/.test(line)) {
      const items = [];
      while (i < lines.length && /^\s*\d+\.\s+/.test(lines[i])) {
        items.push(lines[i].replace(/^\s*\d+\.\s+/, ''));
        i++;
      }
      blocks.push(
        <ol key={`blk-${key++}`} className="list-decimal ml-5 my-1.5 space-y-0.5">
          {items.map((it, idx) => (
            <li key={idx}>{renderInline(it, `ol-${key}-${idx}`)}</li>
          ))}
        </ol>
      );
      continue;
    }

    // Blank line → skip
    if (/^\s*$/.test(line)) {
      i++;
      continue;
    }

    // Paragraph — consume consecutive non-empty, non-special lines
    const para = [];
    while (
      i < lines.length &&
      !/^\s*$/.test(lines[i]) &&
      !/^\s*```/.test(lines[i]) &&
      !/^(#{1,3})\s+/.test(lines[i]) &&
      !/^\s*([-*_])(\s*\1){2,}\s*$/.test(lines[i]) &&
      !/^\s*[-*+]\s+/.test(lines[i]) &&
      !/^\s*\d+\.\s+/.test(lines[i]) &&
      !isTableRow(lines[i])
    ) {
      para.push(lines[i]);
      i++;
    }

    // If the para loop consumed nothing (defensive), advance one line
    if (para.length === 0) {
      i++;
      continue;
    }

    blocks.push(
      <p key={`blk-${key++}`} className="my-1 leading-relaxed">
        {para.map((ln, idx) => (
          <span key={idx}>
            {idx > 0 && <br />}
            {renderInline(ln, `p-${key}-${idx}`)}
          </span>
        ))}
      </p>
    );
  }

  return blocks;
}

export default function Markdown({ children, className = '' }) {
  const content = typeof children === 'string' ? children : String(children ?? '');
  const blocks = useMemo(() => parseMarkdown(content), [content]);

  return <div className={`markdown-body ${className}`}>{blocks}</div>;
}