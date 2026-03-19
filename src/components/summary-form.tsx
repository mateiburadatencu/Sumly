'use client';

import { useState, useEffect } from 'react';
import { isValidYouTubeUrl } from '@/lib/utils/youtube';
import LoadingAnimation from './loading-animation';
import SummaryDisplay from './summary-display';
import type { SummaryResult } from '@/engine/types';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';

export default function SummaryForm() {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<SummaryResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [trialRemaining, setTrialRemaining] = useState<number | null>(null);
  const [hasFreeTrial, setHasFreeTrial] = useState(false);
  const [showNewUserBanner, setShowNewUserBanner] = useState(false);

  useEffect(() => {
    const checkTrial = async () => {
      try {
        const supabase = createSupabaseBrowserClient();
        const { data: { session } } = await supabase.auth.getSession();

        if (!session?.user) {
          // Not logged in — show banner only if this device has never had an account
          if (!localStorage.getItem('sumly_has_account')) {
            setShowNewUserBanner(true);
          }
          return;
        }

        // Logged in — mark device so banner never shows again
        localStorage.setItem('sumly_has_account', 'true');

        const { data: profile } = await supabase
          .from('profiles')
          .select('trial_summaries_used, subscription_status')
          .eq('id', session.user.id)
          .single();

        if (profile && profile.subscription_status !== 'active' && (profile.trial_summaries_used ?? 0) < 1) {
          setHasFreeTrial(true);
        }
      } catch { /* silent */ }
    };
    checkTrial();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setResult(null);

    if (!url.trim()) {
      setError('Please enter a YouTube URL.');
      return;
    }

    if (!isValidYouTubeUrl(url)) {
      setError('Please enter a valid YouTube URL.');
      return;
    }

    setLoading(true);

    try {
      const supabase = createSupabaseBrowserClient();
      const { data: { session } } = await supabase.auth.getSession();

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      if (session?.access_token) {
        headers['Authorization'] = `Bearer ${session.access_token}`;
      }

      const res = await fetch('/api/summarize', {
        method: 'POST',
        headers,
        body: JSON.stringify({ url }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Something went wrong.');
        return;
      }

      if (typeof data.trialRemaining === 'number') {
        setTrialRemaining(data.trialRemaining);
        setHasFreeTrial(false);
      }
      setResult(data as SummaryResult);
    } catch {
      setError('Network error. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full">
      {showNewUserBanner && (
        <div className="mb-5 flex items-center gap-3 rounded-2xl border border-red-100 bg-gradient-to-r from-red-50 to-orange-50 px-5 py-3.5 shadow-sm">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-red-600 shadow-md shadow-red-200">
            <svg className="h-4 w-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold text-slate-900">Create a free account &amp; get a Pro summary</p>
            <p className="text-xs text-slate-500">Sign up in seconds — your first summary is full Pro quality, on us.</p>
          </div>
          <a
            href="/auth/signup"
            className="shrink-0 rounded-xl bg-red-600 px-4 py-2 text-xs font-bold text-white shadow-md shadow-red-200 transition-all hover:bg-red-700"
          >
            Sign up free
          </a>
        </div>
      )}

      {hasFreeTrial && (
        <div className="mb-5 flex items-center gap-3 rounded-2xl border border-red-100 bg-gradient-to-r from-red-50 to-orange-50 px-5 py-3.5 shadow-sm">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-red-600 shadow-md shadow-red-200">
            <svg className="h-4 w-4 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold text-slate-900">Your free Pro summary is ready</p>
            <p className="text-xs text-slate-500">Get a full Pro-quality summary — key insights, topic breakdown, actionable takeaways & more.</p>
          </div>
          <span className="shrink-0 rounded-full bg-red-600 px-3 py-1 text-xs font-bold uppercase tracking-wide text-white shadow-sm">
            Free
          </span>
        </div>
      )}
      <form onSubmit={handleSubmit} className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <div className="pointer-events-none absolute inset-y-0 left-4 flex items-center">
            <svg className="h-5 w-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <input
            type="text"
            value={url}
            onChange={(e) => {
              setUrl(e.target.value);
              if (error) setError(null);
            }}
            placeholder="Paste a YouTube link here..."
            className="h-13 w-full rounded-xl border border-slate-200 bg-white pl-12 pr-10 text-sm text-slate-900 placeholder-slate-400 shadow-sm outline-none transition-all focus:border-red-400 focus:ring-4 focus:ring-red-100"
            disabled={loading}
          />
          {url && !loading && (
            <button
              type="button"
              onClick={() => { setUrl(''); setError(null); setResult(null); }}
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              aria-label="Clear input"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
        <button
          type="submit"
          disabled={loading || !url.trim()}
          className="h-13 rounded-xl bg-red-600 px-8 text-sm font-semibold text-white shadow-lg shadow-red-200 transition-all hover:bg-red-700 hover:shadow-xl hover:shadow-red-200 disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none"
        >
          {loading ? (
            <span className="flex items-center gap-2">
              <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Processing...
            </span>
          ) : 'Summarize'}
        </button>
      </form>

      {error && (
        <div className="mt-4 flex items-start gap-3 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
          <svg className="mt-0.5 h-4 w-4 shrink-0 text-red-500" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
          {error}
        </div>
      )}

      {trialRemaining !== null && !loading && (
        <div className={`mt-4 flex items-center gap-2.5 rounded-xl border px-4 py-2.5 text-sm font-medium ${trialRemaining > 0 ? 'border-amber-200 bg-amber-50 text-amber-700' : 'border-slate-200 bg-slate-50 text-slate-600'}`}>
          <svg className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
          {trialRemaining > 0
            ? <span>Pro trial: <strong>{trialRemaining}</strong> free {trialRemaining === 1 ? 'summary' : 'summaries'} remaining</span>
            : <span>Your free Pro summary has been used. <a href="/pricing" className="font-semibold text-red-600 hover:underline">Upgrade to keep Pro quality →</a></span>
          }
        </div>
      )}

      {loading && <LoadingAnimation />}

      {result && !loading && <SummaryDisplay result={result} />}
    </div>
  );
}
