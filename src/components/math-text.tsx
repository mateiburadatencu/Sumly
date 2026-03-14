'use client';

import { useEffect, useRef } from 'react';
import katex from 'katex';
import 'katex/dist/katex.min.css';

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

function KatexSpan({ math, displayMode }: { math: string; displayMode: boolean }) {
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    if (ref.current) {
      try {
        katex.render(math, ref.current, { displayMode, throwOnError: false, errorColor: '#dc2626' });
      } catch { /* silent */ }
    }
  }, [math, displayMode]);
  return <span ref={ref} />;
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
                <KatexSpan math={seg.value} displayMode={true} />
              </div>
            );
          }
          if (seg.type === 'inline') {
            return <KatexSpan key={i} math={seg.value} displayMode={false} />;
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
          return <KatexSpan key={i} math={seg.value} displayMode={false} />;
        }
        return <span key={i}>{seg.value}</span>;
      })}
    </span>
  );
}
