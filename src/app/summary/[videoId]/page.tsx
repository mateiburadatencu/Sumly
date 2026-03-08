'use client';

import { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import SummaryDisplay from '@/components/summary-display';
import type { SummaryResult } from '@/engine/types';

export default function SummaryPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const videoId = params.videoId as string;
  const plan = searchParams.get('plan') || 'basic';

  const [result, setResult] = useState<SummaryResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch(`/api/summary/${videoId}?plan=${plan}`);
        const data = await res.json();

        if (!res.ok) {
          setError(data.error || 'Summary not found.');
          return;
        }

        setResult(data as SummaryResult);
      } catch {
        setError('Failed to load summary.');
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [videoId, plan]);

  if (loading) {
    return (
      <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-[3px] border-red-100 border-t-red-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center px-6">
        <div className="mx-auto max-w-md text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-red-50 text-2xl">
            📄
          </div>
          <h1 className="text-lg font-bold text-slate-900">{error}</h1>
          <p className="mt-2 text-sm text-slate-500">
            This summary may have expired or hasn&apos;t been generated yet.
          </p>
          <Link
            href="/"
            className="mt-6 inline-flex items-center gap-1.5 rounded-lg bg-red-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-red-200 transition-all hover:bg-red-700"
          >
            Create a new summary
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] px-6 py-10">
      <div className="mx-auto max-w-3xl">
        <Link
          href="/dashboard"
          className="mb-6 inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 transition-colors hover:text-red-600"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Dashboard
        </Link>

        {result && <SummaryDisplay result={result} />}
      </div>
    </div>
  );
}
