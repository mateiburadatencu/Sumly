'use client';

import 'katex/dist/katex.min.css';
import { InlineMath, BlockMath } from 'react-katex';

interface Props {
  text: string;
  className?: string;
}

type Segment =
  | { type: 'text'; value: string }
  | { type: 'inline'; value: string }
  | { type: 'block'; value: string };

function parseSegments(text: string): Segment[] {
  const segments: Segment[] = [];
  // Match $$...$$ (block) first, then $...$ (inline)
  const pattern = /(\$\$[\s\S]+?\$\$|\$[^$\n]+?\$)/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(text)) !== null) {
    if (match.index > lastIndex) {
      segments.push({ type: 'text', value: text.slice(lastIndex, match.index) });
    }

    const raw = match[0];
    if (raw.startsWith('$$')) {
      segments.push({ type: 'block', value: raw.slice(2, -2).trim() });
    } else {
      segments.push({ type: 'inline', value: raw.slice(1, -1).trim() });
    }

    lastIndex = match.index + raw.length;
  }

  if (lastIndex < text.length) {
    segments.push({ type: 'text', value: text.slice(lastIndex) });
  }

  return segments;
}

export default function MathText({ text, className }: Props) {
  if (!text) return null;

  const segments = parseSegments(text);
  const hasBlock = segments.some(s => s.type === 'block');

  if (hasBlock) {
    return (
      <div className={className}>
        {segments.map((seg, i) => {
          if (seg.type === 'block') {
            return (
              <div key={i} className="my-3 overflow-x-auto rounded-lg bg-slate-50 px-4 py-3 text-center">
                <BlockMath math={seg.value} errorColor="#dc2626" />
              </div>
            );
          }
          if (seg.type === 'inline') {
            return <InlineMath key={i} math={seg.value} errorColor="#dc2626" />;
          }
          return <span key={i}>{seg.value}</span>;
        })}
      </div>
    );
  }

  return (
    <span className={className}>
      {segments.map((seg, i) => {
        if (seg.type === 'inline') {
          return <InlineMath key={i} math={seg.value} errorColor="#dc2626" />;
        }
        return <span key={i}>{seg.value}</span>;
      })}
    </span>
  );
}
