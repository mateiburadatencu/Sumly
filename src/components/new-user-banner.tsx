'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';

const STORAGE_KEY = 'sumly_has_account';

export default function NewUserBanner() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    // Don't show if this device has ever had an account
    if (localStorage.getItem(STORAGE_KEY)) return;

    const supabase = createSupabaseBrowserClient();
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        // Logged-in user — mark device and hide
        localStorage.setItem(STORAGE_KEY, 'true');
        return;
      }
      // No account on this device — show the banner
      setShow(true);
    });
  }, []);

  if (!show) return null;

  return (
    <div className="fixed bottom-5 left-1/2 z-50 w-[calc(100%-2rem)] max-w-md -translate-x-1/2 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="relative flex items-center gap-4 rounded-2xl border border-red-100 bg-white px-5 py-4 shadow-xl shadow-red-100/40">
        {/* Close */}
        <button
          onClick={() => setShow(false)}
          className="absolute right-3 top-3 text-slate-300 hover:text-slate-500 transition-colors"
          aria-label="Dismiss"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Icon */}
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-600 shadow-lg shadow-red-200">
          <svg className="h-5 w-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        </div>

        {/* Text */}
        <div className="flex-1 pr-4">
          <p className="text-sm font-bold text-slate-900">Get a free Pro summary</p>
          <p className="mt-0.5 text-xs text-slate-500">
            Create a free account and your first summary is on us — full Pro quality.
          </p>
        </div>

        {/* CTA */}
        <Link
          href="/auth/signup"
          className="shrink-0 rounded-xl bg-red-600 px-4 py-2 text-xs font-bold text-white shadow-md shadow-red-200 transition-all hover:bg-red-700"
        >
          Sign up free
        </Link>
      </div>
    </div>
  );
}
