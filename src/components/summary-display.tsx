'use client';

import { useState } from 'react';
import type { SummaryResult, BasicSummary, PlusSummary, ProSummary, VideoCategory } from '@/engine/types';
import MathText from './math-text';

const MATH_CATEGORIES: VideoCategory[] = ['mathematics', 'science'];
const SCHOOL_CATEGORIES: VideoCategory[] = ['mathematics', 'science', 'history', 'literature', 'language', 'philosophy', 'technology', 'health', 'tutorial', 'business', 'general'];

interface Props {
  result: SummaryResult;
}

const PLAN_BADGES: Record<string, { bg: string; text: string }> = {
  basic: { bg: 'bg-slate-100', text: 'text-slate-600' },
  plus: { bg: 'bg-red-100', text: 'text-red-700' },
  pro: { bg: 'bg-red-100', text: 'text-red-700' },
};

const CATEGORY_META: Record<VideoCategory, { icon: string; label: string; bg: string; text: string }> = {
  mathematics:  { icon: '📐', label: 'Mathematics',  bg: 'bg-blue-50',    text: 'text-blue-700' },
  science:      { icon: '🔬', label: 'Science',      bg: 'bg-emerald-50', text: 'text-emerald-700' },
  history:      { icon: '🏛️', label: 'History',      bg: 'bg-amber-50',   text: 'text-amber-700' },
  literature:   { icon: '📖', label: 'Literature',   bg: 'bg-purple-50',  text: 'text-purple-700' },
  language:     { icon: '✍️', label: 'Language',     bg: 'bg-pink-50',    text: 'text-pink-700' },
  tutorial:     { icon: '🛠️', label: 'Tutorial',     bg: 'bg-orange-50',  text: 'text-orange-700' },
  business:     { icon: '📈', label: 'Business',     bg: 'bg-teal-50',    text: 'text-teal-700' },
  technology:   { icon: '💻', label: 'Technology',   bg: 'bg-indigo-50',  text: 'text-indigo-700' },
  health:       { icon: '🩺', label: 'Health',       bg: 'bg-green-50',   text: 'text-green-700' },
  philosophy:   { icon: '🧠', label: 'Philosophy',   bg: 'bg-violet-50',  text: 'text-violet-700' },
  general:      { icon: '🎬', label: 'General',      bg: 'bg-slate-50',   text: 'text-slate-600' },
};

function buildPlainText(result: SummaryResult): string {
  const s = result.summary;
  const lines: string[] = [`${result.videoTitle}`, `Plan: ${result.plan.toUpperCase()}`, ''];

  if (s.type === 'basic') {
    lines.push('OVERVIEW', s.overview, '', 'KEY POINTS');
    s.keyPoints.forEach(p => lines.push(`• ${p}`));
  } else if (s.type === 'plus') {
    lines.push('EXECUTIVE SUMMARY', s.executiveSummary, '', 'THEME BREAKDOWN');
    s.themeBreakdown.forEach(t => lines.push(`▸ ${t.title}`, `  ${t.content}`, ''));
    lines.push('KEY INSIGHTS');
    s.keyInsights.forEach(i => lines.push(`• ${i}`));
  } else if (s.type === 'pro') {
    lines.push('EXECUTIVE SUMMARY', s.executiveSummary, '', 'TOPIC BREAKDOWN');
    s.topicBreakdown.forEach(t => lines.push(`▸ ${t.title}`, `  ${t.content}`, ''));
    lines.push('KEY INSIGHTS');
    s.keyInsights.forEach(i => lines.push(`• ${i}`));
    lines.push('', 'ACTIONABLE TAKEAWAYS');
    s.actionableTakeaways.forEach((t, i) => lines.push(`${i + 1}. ${t}`));
    lines.push('', 'KEY QUOTES');
    s.keyQuotes.forEach(q => lines.push(`"${q}"`));
  }

  return lines.join('\n');
}

export default function SummaryDisplay({ result }: Props) {
  const [exporting, setExporting] = useState(false);
  const [copied, setCopied] = useState(false);
  const [generatingCheatSheet, setGeneratingCheatSheet] = useState(false);
  const [cheatSheetGenerated, setCheatSheetGenerated] = useState(false);
  const badge = PLAN_BADGES[result.plan] || PLAN_BADGES.basic;
  const category = (result.summary as BasicSummary | PlusSummary | ProSummary).videoCategory;
  const categoryMeta = category ? (CATEGORY_META[category] || CATEGORY_META.general) : null;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(buildPlainText(result));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      alert('Failed to copy. Please try again.');
    }
  };

  const handleCheatSheet = async () => {
    setGeneratingCheatSheet(true);
    try {
      const res = await fetch('/api/cheat-sheet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          videoTitle: result.videoTitle,
          summary: result.summary,
          category,
        }),
      });
      if (!res.ok) throw new Error('Generation failed');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `cheatsheet-${result.videoTitle.slice(0, 40)}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
      setCheatSheetGenerated(true);
    } catch {
      alert('Failed to generate cheat sheet. Please try again.');
    } finally {
      setGeneratingCheatSheet(false);
    }
  };

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
    <div className="mt-8 animate-in" style={{ fontFamily: 'var(--font-inter), system-ui, sans-serif' }}>
      <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-lg shadow-slate-100">
        <div className="border-b border-slate-100 bg-slate-50/50 px-6 py-5 sm:px-8">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <h2 className="truncate text-xl font-extrabold text-slate-900">{result.videoTitle}</h2>
              <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
                <span className={`rounded-full px-2.5 py-0.5 font-semibold uppercase ${badge.bg} ${badge.text}`}>
                  {result.plan}
                </span>
                {categoryMeta && (
                  <span className={`flex items-center gap-1 rounded-full px-2.5 py-0.5 font-semibold ${categoryMeta.bg} ${categoryMeta.text}`}>
                    <span>{categoryMeta.icon}</span>
                    {categoryMeta.label}
                  </span>
                )}
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
            <div className="flex shrink-0 items-center gap-2">
              {(!category || SCHOOL_CATEGORIES.includes(category)) && (
                <button
                  onClick={handleCheatSheet}
                  disabled={generatingCheatSheet || cheatSheetGenerated}
                  className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold transition-all disabled:cursor-not-allowed disabled:opacity-50 ${cheatSheetGenerated ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-amber-200 bg-amber-50 text-amber-700 hover:border-amber-300 hover:bg-amber-100'}`}
                >
                  {generatingCheatSheet ? (
                    <>
                      <svg className="h-3.5 w-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                      </svg>
                      Generating...
                    </>
                  ) : cheatSheetGenerated ? (
                    <>
                      <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Cheat Sheet Generated
                    </>
                  ) : (
                    <>
                      <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      Cheat Sheet
                    </>
                  )}
                </button>
              )}
              <button
                onClick={handleCopy}
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition-all hover:border-red-200 hover:bg-red-50 hover:text-red-700"
              >
                {copied ? (
                  <>
                    <svg className="h-3.5 w-3.5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-emerald-600">Copied!</span>
                  </>
                ) : (
                  <>
                    <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                    Copy
                  </>
                )}
              </button>
              <button
                onClick={handleExportPdf}
                disabled={exporting}
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition-all hover:border-red-200 hover:bg-red-50 hover:text-red-700 disabled:opacity-50"
              >
                <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                {exporting ? 'Exporting...' : 'Export PDF'}
              </button>
            </div>
          </div>
        </div>

        <div className="px-6 py-8 sm:px-10">
          {result.summary.type === 'basic' && <BasicView summary={result.summary} useMath={MATH_CATEGORIES.includes(result.summary.videoCategory)} />}
          {result.summary.type === 'plus' && <PlusView summary={result.summary} useMath={MATH_CATEGORIES.includes(result.summary.videoCategory)} />}
          {result.summary.type === 'pro' && <ProView summary={result.summary} useMath={MATH_CATEGORIES.includes(result.summary.videoCategory)} />}
        </div>
      </div>
    </div>
  );
}

function BasicView({ summary, useMath }: { summary: BasicSummary; useMath: boolean }) {
  return (
    <div className="flex flex-col gap-6 lg:flex-row">
      <div className="min-w-0 flex-1 space-y-6">
        <Section title="Overview" icon="📋">
          {useMath
            ? <MathText text={summary.overview} className="text-base font-semibold leading-relaxed text-slate-800" />
            : <p className="text-base font-semibold leading-relaxed text-slate-800">{summary.overview}</p>}
        </Section>
        <Section title="Key Points" icon="💡">
          <BulletList items={summary.keyPoints} useMath={useMath} />
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

function PlusView({ summary, useMath }: { summary: PlusSummary; useMath: boolean }) {
  return (
    <div className="space-y-8">
      <Section title="Executive Summary" icon="📋">
        {useMath
          ? <MathText text={summary.executiveSummary} className="text-base font-semibold leading-relaxed text-slate-800" />
          : <p className="text-base font-semibold leading-relaxed text-slate-800">{summary.executiveSummary}</p>}
      </Section>

      <Section title="Theme Breakdown" icon="🗂️">
        <div className="space-y-4">
          {summary.themeBreakdown.map((theme, i) => (
            <div key={i} className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
              {useMath
                ? <MathText text={theme.title} className="text-base font-extrabold text-slate-900" />
                : <h4 className="text-base font-extrabold text-slate-900">{theme.title}</h4>}
              {useMath
                ? <MathText text={theme.content} className="mt-2 text-base font-semibold leading-relaxed text-slate-700" />
                : <p className="mt-2 text-base font-semibold leading-relaxed text-slate-700">{theme.content}</p>}
            </div>
          ))}
        </div>
      </Section>

      <Section title="Key Insights" icon="💡">
        <BulletList items={summary.keyInsights} useMath={useMath} />
      </Section>

      <TimeSaved value={summary.estimatedTimeSaved} />
    </div>
  );
}

function ProView({ summary, useMath }: { summary: ProSummary; useMath: boolean }) {
  return (
    <div className="space-y-8">
      <Section title="Executive Summary" icon="📋">
        {useMath
          ? <MathText text={summary.executiveSummary} className="text-base font-semibold leading-relaxed text-slate-800" />
          : <p className="text-base font-semibold leading-relaxed text-slate-800">{summary.executiveSummary}</p>}
      </Section>

      <Section title="Topic Breakdown" icon="🗂️">
        <div className="space-y-4">
          {summary.topicBreakdown.map((topic, i) => (
            <div key={i} className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
              {useMath
                ? <MathText text={topic.title} className="text-base font-extrabold text-slate-900" />
                : <h4 className="text-base font-extrabold text-slate-900">{topic.title}</h4>}
              {useMath
                ? <MathText text={topic.content} className="mt-2 text-base font-semibold leading-relaxed text-slate-700" />
                : <p className="mt-2 text-base font-semibold leading-relaxed text-slate-700">{topic.content}</p>}
            </div>
          ))}
        </div>
      </Section>

      <Section title="Key Insights" icon="💡">
        <BulletList items={summary.keyInsights} useMath={useMath} />
      </Section>

      <Section title="Actionable Takeaways" icon="🎯">
        <ol className="space-y-3">
          {summary.actionableTakeaways.map((item, i) => (
            <li key={i} className="flex gap-4 rounded-xl border border-slate-100 bg-white p-4 text-base font-semibold text-slate-800 shadow-sm">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-red-600 text-xs font-bold text-white">
                {i + 1}
              </span>
              <span className="leading-relaxed">{useMath ? <MathText text={item} /> : item}</span>
            </li>
          ))}
        </ol>
      </Section>

      <Section title="Key Quotes" icon="💬">
        <div className="space-y-3">
          {summary.keyQuotes.map((quote, i) => (
            <blockquote
              key={i}
              className="rounded-xl border-l-4 border-red-400 bg-red-50 py-3 pl-5 pr-4 text-base font-semibold italic text-slate-700"
            >
              {useMath ? <MathText text={quote} /> : <>&ldquo;{quote}&rdquo;</>}
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
      <div className="mb-4 flex items-center gap-2.5 border-b border-slate-100 pb-3">
        <span className="text-base">{icon}</span>
        <h3 className="text-sm font-bold uppercase tracking-widest text-slate-400">{title}</h3>
      </div>
      {children}
    </div>
  );
}

function BulletList({ items, useMath }: { items: string[]; useMath?: boolean }) {
  return (
    <ul className="space-y-3">
      {items.map((item, i) => (
        <li key={i} className="flex gap-3 text-base font-semibold text-slate-800">
          <span className="mt-2 h-2.5 w-2.5 shrink-0 rounded-full bg-red-500" />
          <span className="leading-relaxed">{useMath ? <MathText text={item} /> : item}</span>
        </li>
      ))}
    </ul>
  );
}

function TimeSaved({ value }: { value: string }) {
  return (
    <div className="flex items-center gap-4 rounded-2xl bg-gradient-to-r from-red-50 to-rose-50 border border-red-100 px-6 py-4">
      <span className="text-2xl">⏱️</span>
      <div>
        <p className="text-xs font-bold uppercase tracking-widest text-red-500">Estimated time saved</p>
        <p className="mt-0.5 text-lg font-bold text-slate-900">{value}</p>
      </div>
    </div>
  );
}
