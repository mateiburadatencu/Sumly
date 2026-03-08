'use client';

import { useState } from 'react';
import type { SummaryResult, BasicSummary, PlusSummary, ProSummary } from '@/engine/types';

interface Props {
  result: SummaryResult;
}

const PLAN_BADGES: Record<string, { bg: string; text: string }> = {
  basic: { bg: 'bg-slate-100', text: 'text-slate-600' },
  plus: { bg: 'bg-red-100', text: 'text-red-700' },
  pro: { bg: 'bg-red-100', text: 'text-red-700' },
};

export default function SummaryDisplay({ result }: Props) {
  const [exporting, setExporting] = useState(false);
  const badge = PLAN_BADGES[result.plan] || PLAN_BADGES.basic;

  const handleExportPdf = async () => {
    setExporting(true);
    try {
      const res = await fetch('/api/export-pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          videoTitle: result.videoTitle,
          summary: result.summary,
          plan: result.plan,
        }),
      });

      if (!res.ok) throw new Error('Export failed');

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `sumly-${result.videoTitle.slice(0, 50)}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      alert('Failed to export PDF. Please try again.');
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="mt-8 animate-in">
      <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-lg shadow-slate-100">
        <div className="border-b border-slate-100 bg-slate-50/50 px-6 py-5 sm:px-8">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <h2 className="truncate text-lg font-bold text-slate-900">{result.videoTitle}</h2>
              <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
                <span className={`rounded-full px-2.5 py-0.5 font-semibold uppercase ${badge.bg} ${badge.text}`}>
                  {result.plan}
                </span>
                {result.cached && (
                  <span className="flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 font-medium text-emerald-700">
                    <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    Cached
                  </span>
                )}
                <span className="text-slate-400">
                  Generated in {(result.processingTimeMs / 1000).toFixed(1)}s
                </span>
              </div>
            </div>
            <button
              onClick={handleExportPdf}
              disabled={exporting}
              className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition-all hover:border-red-200 hover:bg-red-50 hover:text-red-700 disabled:opacity-50"
            >
              <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              {exporting ? 'Exporting...' : 'Export PDF'}
            </button>
          </div>
        </div>

        <div className="px-6 py-6 sm:px-8">
          {result.summary.type === 'basic' && <BasicView summary={result.summary} />}
          {result.summary.type === 'plus' && <PlusView summary={result.summary} />}
          {result.summary.type === 'pro' && <ProView summary={result.summary} />}
        </div>
      </div>
    </div>
  );
}

function BasicView({ summary }: { summary: BasicSummary }) {
  return (
    <div className="flex flex-col gap-6 lg:flex-row">
      <div className="min-w-0 flex-1 space-y-6">
        <Section title="Overview" icon="📋">
          <p className="text-sm leading-relaxed text-slate-600">{summary.overview}</p>
        </Section>
        <Section title="Key Points" icon="💡">
          <BulletList items={summary.keyPoints} />
        </Section>
      </div>

      <div className="hidden w-px bg-slate-100 lg:block" />

      <div className="relative min-w-0 flex-1">
        <div className="mb-4 flex items-center justify-between gap-3">
          <p className="text-[11px] italic text-slate-400">This is a shortened preview of the Pro summary.</p>
          <span className="shrink-0 rounded-full bg-red-600 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
            Pro
          </span>
        </div>
        <div className="space-y-6" aria-hidden="true">
          <Section title="Executive Summary" icon="📋">
            <div className="space-y-2 select-none blur-[6px]">
              <div className="h-3.5 w-full rounded bg-slate-200" />
              <div className="h-3.5 w-[95%] rounded bg-slate-200" />
              <div className="h-3.5 w-[88%] rounded bg-slate-200" />
              <div className="h-3.5 w-[92%] rounded bg-slate-200" />
              <div className="h-3.5 w-full rounded bg-slate-200" />
              <div className="h-3.5 w-[90%] rounded bg-slate-200" />
              <div className="h-3.5 w-[85%] rounded bg-slate-200" />
              <div className="h-3.5 w-[93%] rounded bg-slate-200" />
              <div className="h-3.5 w-[70%] rounded bg-slate-200" />
            </div>
          </Section>

          <Section title="Topic Breakdown" icon="🗂️">
            <div className="space-y-3 select-none blur-[6px]">
              {[42, 55, 38, 48, 60].map((tw, i) => (
                <div key={i} className="rounded-xl border border-slate-100 bg-slate-50/50 p-4">
                  <div className="h-3.5 rounded bg-slate-300" style={{ width: `${tw}%` }} />
                  <div className="mt-2.5 space-y-1.5">
                    <div className="h-3 w-full rounded bg-slate-200" />
                    <div className="h-3 w-[93%] rounded bg-slate-200" />
                    <div className="h-3 w-[88%] rounded bg-slate-200" />
                    <div className="h-3 w-[75%] rounded bg-slate-200" />
                  </div>
                </div>
              ))}
            </div>
          </Section>

          <Section title="Key Insights" icon="💡">
            <div className="space-y-2.5 select-none blur-[6px]">
              {[85, 92, 78, 95, 70, 88, 80, 93].map((w, i) => (
                <div key={i} className="flex gap-3">
                  <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-red-300" />
                  <div className="h-3.5 rounded bg-slate-200" style={{ width: `${w}%` }} />
                </div>
              ))}
            </div>
          </Section>

          <Section title="Actionable Takeaways" icon="🎯">
            <div className="space-y-2.5 select-none blur-[6px]">
              {[88, 75, 93, 80, 70].map((w, i) => (
                <div key={i} className="flex gap-3">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-red-400 text-[10px] font-bold text-white">
                    {i + 1}
                  </span>
                  <div className="h-3.5 rounded bg-slate-200" style={{ width: `${w}%` }} />
                </div>
              ))}
            </div>
          </Section>

          <Section title="Key Quotes" icon="💬">
            <div className="space-y-3 select-none blur-[6px]">
              {[90, 75, 85, 80].map((w, i) => (
                <div key={i} className="rounded-lg border-l-3 border-red-200 bg-red-50/50 py-2.5 pl-4 pr-3">
                  <div className="h-3.5 rounded bg-slate-200" style={{ width: `${w}%` }} />
                </div>
              ))}
            </div>
          </Section>

          <Section title="Time Saved" icon="⏱️">
            <div className="select-none blur-[6px]">
              <div className="flex items-center gap-3 rounded-xl bg-red-50 px-5 py-3.5">
                <div className="h-4 w-[60%] rounded bg-slate-200" />
              </div>
            </div>
          </Section>
        </div>

        <div className="absolute inset-x-0 bottom-0 z-10 flex items-end justify-center bg-gradient-to-t from-white via-white/90 to-transparent pb-4 pt-20">
          <a
            href="/pricing"
            className="inline-flex items-center gap-1.5 rounded-lg bg-red-600 px-5 py-2.5 text-xs font-semibold text-white shadow-lg shadow-red-200 transition-all hover:bg-red-700 hover:shadow-xl hover:shadow-red-200"
          >
            Unlock full summary
            <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </a>
        </div>
      </div>
    </div>
  );
}

function PlusView({ summary }: { summary: PlusSummary }) {
  return (
    <div className="space-y-6">
      <Section title="Executive Summary" icon="📋">
        <p className="text-sm leading-relaxed text-slate-600">{summary.executiveSummary}</p>
      </Section>

      <Section title="Theme Breakdown" icon="🗂️">
        <div className="space-y-3">
          {summary.themeBreakdown.map((theme, i) => (
            <div key={i} className="rounded-xl border border-slate-100 bg-slate-50/50 p-4">
              <h4 className="text-sm font-bold text-slate-800">{theme.title}</h4>
              <p className="mt-1.5 text-sm leading-relaxed text-slate-500">{theme.content}</p>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Key Insights" icon="💡">
        <BulletList items={summary.keyInsights} />
      </Section>

      <TimeSaved value={summary.estimatedTimeSaved} />
    </div>
  );
}

function ProView({ summary }: { summary: ProSummary }) {
  return (
    <div className="space-y-6">
      <Section title="Executive Summary" icon="📋">
        <p className="text-sm leading-relaxed text-slate-600">{summary.executiveSummary}</p>
      </Section>

      <Section title="Topic Breakdown" icon="🗂️">
        <div className="space-y-3">
          {summary.topicBreakdown.map((topic, i) => (
            <div key={i} className="rounded-xl border border-slate-100 bg-slate-50/50 p-4">
              <h4 className="text-sm font-bold text-slate-800">{topic.title}</h4>
              <p className="mt-1.5 text-sm leading-relaxed text-slate-500">{topic.content}</p>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Key Insights" icon="💡">
        <BulletList items={summary.keyInsights} />
      </Section>

      <Section title="Actionable Takeaways" icon="🎯">
        <ol className="space-y-2.5">
          {summary.actionableTakeaways.map((item, i) => (
            <li key={i} className="flex gap-3 text-sm text-slate-600">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-red-600 text-[10px] font-bold text-white">
                {i + 1}
              </span>
              {item}
            </li>
          ))}
        </ol>
      </Section>

      <Section title="Key Quotes" icon="💬">
        <div className="space-y-3">
          {summary.keyQuotes.map((quote, i) => (
            <blockquote
              key={i}
              className="rounded-lg border-l-3 border-red-300 bg-red-50/50 py-2 pl-4 pr-3 text-sm italic text-slate-600"
            >
              &ldquo;{quote}&rdquo;
            </blockquote>
          ))}
        </div>
      </Section>

      <TimeSaved value={summary.estimatedTimeSaved} />
    </div>
  );
}

function Section({ title, icon, children }: { title: string; icon: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="mb-3 flex items-center gap-2">
        <span className="text-sm">{icon}</span>
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">{title}</h3>
      </div>
      {children}
    </div>
  );
}

function BulletList({ items }: { items: string[] }) {
  return (
    <ul className="space-y-2.5">
      {items.map((item, i) => (
        <li key={i} className="flex gap-3 text-sm text-slate-600">
          <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-red-400" />
          {item}
        </li>
      ))}
    </ul>
  );
}

function TimeSaved({ value }: { value: string }) {
  return (
    <div className="flex items-center gap-3 rounded-xl bg-red-50 px-5 py-3.5">
      <span className="text-lg">⏱️</span>
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-red-600">Estimated time saved</p>
        <p className="text-sm font-bold text-slate-800">{value}</p>
      </div>
    </div>
  );
}
