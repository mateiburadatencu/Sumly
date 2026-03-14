'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import type { User } from '@supabase/supabase-js';

export default function Navbar() {
  const [user, setUser] = useState<User | null>(null);
  const [userPlan, setUserPlan] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const supabase = createSupabaseBrowserClient();
    const loadSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        setUser(session?.user ?? null);
        if (session?.user) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('plan, subscription_status')
            .eq('id', session.user.id)
            .single();
          if (profile?.subscription_status === 'active') {
            setUserPlan(profile.plan);
          } else {
            setUserPlan('basic');
          }
        }
      } catch { /* silent */ }
    };
    loadSession();
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (!session) setUserPlan(null);
    });
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const handleSignOut = async () => {
    const supabase = createSupabaseBrowserClient();
    await supabase.auth.signOut();
    setUser(null);
    window.location.href = '/';
  };

  return (
    <nav
      className={`fixed top-0 z-50 w-full border-b transition-all duration-300 ${
        scrolled
          ? 'border-slate-200 bg-white shadow-sm'
          : 'border-slate-100 bg-white/95 backdrop-blur-md'
      }`}
    >
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
        <Link href="/" className="text-4xl font-bold text-slate-900" style={{ fontFamily: 'var(--font-fraunces), Georgia, serif' }}>
          sumly
        </Link>

        <div className="hidden items-center gap-2 sm:flex">
          <Link
            href="/pricing"
            className="rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white shadow-md shadow-red-200 transition-colors hover:bg-red-700"
          >
            {user && userPlan !== 'pro' ? 'Upgrade' : 'Pricing'}
          </Link>
          {user ? (
            <>
              <Link
                href="/dashboard"
                className="rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white shadow-md shadow-red-200 transition-colors hover:bg-red-700"
              >
                Dashboard
              </Link>
              <button
                onClick={handleSignOut}
                className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50"
              >
                Sign Out
              </button>
            </>
          ) : (
            <>
              <Link
                href="/auth/login"
                className="rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white shadow-md shadow-red-200 transition-colors hover:bg-red-700"
              >
                Log In
              </Link>
              <Link
                href="/auth/signup"
                className="rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white shadow-md shadow-red-200 transition-colors hover:bg-red-700"
              >
                Get Started
              </Link>
            </>
          )}
        </div>

        <button
          className="sm:hidden"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle menu"
        >
          <svg className="h-6 w-6 text-slate-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            {menuOpen ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>
      </div>

      {menuOpen && (
        <div className="border-t border-gray-100 bg-white/95 px-6 py-4 backdrop-blur-xl sm:hidden">
          <div className="flex flex-col gap-2">
            <Link href="/pricing" className="rounded-lg px-3 py-2 text-sm font-medium text-slate-600 hover:bg-red-50" onClick={() => setMenuOpen(false)}>
              {user && userPlan !== 'pro' ? 'Upgrade' : 'Pricing'}
            </Link>
            {user ? (
              <>
                <Link href="/dashboard" className="rounded-lg px-3 py-2 text-sm font-medium text-slate-600 hover:bg-red-50" onClick={() => setMenuOpen(false)}>
                  Dashboard
                </Link>
                <button onClick={handleSignOut} className="rounded-lg px-3 py-2 text-left text-sm font-medium text-slate-600 hover:bg-red-50">
                  Sign Out
                </button>
              </>
            ) : (
              <>
                <Link href="/auth/login" className="rounded-lg px-3 py-2 text-sm font-medium text-slate-600 hover:bg-red-50" onClick={() => setMenuOpen(false)}>
                  Log In
                </Link>
                <Link href="/auth/signup" className="rounded-lg bg-red-600 px-3 py-2 text-center text-sm font-medium text-white" onClick={() => setMenuOpen(false)}>
                  Get Started
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
