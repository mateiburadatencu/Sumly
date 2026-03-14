'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import type { User } from '@supabase/supabase-js';

interface Profile {
  plan: string;
  subscription_status: string;
  email: string;
  full_name: string;
}

interface HistoryItem {
  id: string;
  video_id: string;
  video_title: string;
  plan: string;
  created_at: string;
}

const PLAN_STYLES: Record<string, { bg: string; text: string; icon: string }> = {
  basic: { bg: 'bg-slate-100', text: 'text-slate-700', icon: '⚡' },
  plus: { bg: 'bg-red-100', text: 'text-red-700', icon: '🚀' },
  pro: { bg: 'bg-red-100', text: 'text-red-700', icon: '👑' },
};

const CANCEL_REASONS = [
  "It's too expensive",
  "I don't use it enough",
  "I found a better alternative",
  "Missing features I need",
  "The summaries aren't accurate enough",
  "Technical issues",
  "Other",
];

export default function DashboardPage() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [portalLoading, setPortalLoading] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelOther, setCancelOther] = useState('');
  const [cancelLoading, setCancelLoading] = useState(false);
  const [cancelDone, setCancelDone] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const load = async () => {
      const supabase = createSupabaseBrowserClient();
      const { data: { session } } = await supabase.auth.getSession().catch(() => ({ data: { session: null } }));
      const user = session?.user ?? null;

      if (!user) {
        router.push('/auth/login');
        return;
      }

      setUser(user);

      const { data: profileData } = await supabase
        .from('profiles')
        .select('plan, subscription_status, email, full_name')
        .eq('id', user.id)
        .single();

      if (profileData) setProfile(profileData);

      const { data: historyData } = await supabase
        .from('summary_history')
        .select('id, video_id, video_title, plan, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(20);

      if (historyData) setHistory(historyData);
      setLoading(false);
    };

    load();
  }, [router]);

  const handleManageSubscription = async () => {
    setPortalLoading(true);
    try {
      const supabase = createSupabaseBrowserClient();
      const { data: { session } } = await supabase.auth.getSession();

      const res = await fetch('/api/create-portal', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session?.access_token}`,
        },
      });

      const data = await res.json();
      if (data.url) window.location.href = data.url;
    } catch {
      alert('Failed to open subscription portal.');
    } finally {
      setPortalLoading(false);
    }
  };

  const handleCancelSubscription = async () => {
    const reason = cancelReason === 'Other' ? cancelOther.trim() : cancelReason;
    if (!reason) return;
    setCancelLoading(true);
    try {
      const supabase = createSupabaseBrowserClient();
      const { data: { session } } = await supabase.auth.getSession();

      const res = await fetch('/api/cancel-subscription', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({ reason }),
      });

      const data = await res.json();
      if (data.success) {
        setCancelDone(true);
      } else {
        alert(data.error || 'Failed to cancel subscription.');
        setShowCancelModal(false);
      }
    } catch {
      alert('Failed to cancel subscription.');
      setShowCancelModal(false);
    } finally {
      setCancelLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-[3px] border-red-100 border-t-red-500" />
      </div>
    );
  }

  const plan = profile?.plan || 'basic';
  const styles = PLAN_STYLES[plan] || PLAN_STYLES.basic;

  return (
    <div className="hero-pattern min-h-[calc(100vh-4rem)] px-6 py-12">
      <div className="mx-auto max-w-4xl">
        <div className="mb-10">
          <h1 className="text-3xl font-bold text-slate-900">Dashboard</h1>
          <p className="mt-1 text-slate-500">
            Welcome back{profile?.full_name ? `, ${profile.full_name}` : ''}
          </p>
        </div>

        <div className="grid gap-5 sm:grid-cols-3">
          <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Current Plan</p>
              <span className="text-xl">{styles.icon}</span>
            </div>
            <p className={`mt-2 text-3xl font-extrabold capitalize ${styles.text}`}>{plan}</p>
            <p className="mt-1 text-xs text-slate-400">
              {profile?.subscription_status === 'active' ? 'Active subscription' : 'Free tier'}
            </p>
            {plan === 'basic' ? (
              <Link
                href="/pricing"
                className="mt-4 inline-flex items-center gap-1 rounded-lg bg-red-600 px-4 py-2 text-xs font-semibold text-white shadow-md shadow-red-200 transition-all hover:bg-red-700 hover:shadow-lg"
              >
                Upgrade
                <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </Link>
            ) : (
              <button
                onClick={() => setShowCancelModal(true)}
                className="mt-4 rounded-lg border border-red-200 px-4 py-2 text-xs font-semibold text-red-600 transition-all hover:bg-red-50 disabled:opacity-50"
              >
                Cancel my subscription
              </button>
            )}
          </div>

          <div className="flex flex-col justify-between rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Summaries</p>
            <p className="mt-4 text-6xl font-extrabold text-slate-900">{history.length}</p>
            <p className="mt-2 text-sm font-medium text-slate-400">Total generated</p>
          </div>

          <div className="flex flex-col justify-between rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Account</p>
            <p className="mt-4 truncate text-sm font-bold text-slate-900">{user?.email}</p>
            <p className="mt-2 text-sm font-medium text-slate-400">
              Member since {new Date(user?.created_at || '').toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
            </p>
          </div>
        </div>

        <div className="mt-8">
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-red-200 transition-all hover:bg-red-700 hover:shadow-xl"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            New Summary
          </Link>
        </div>

        <div className="mt-12">
          <h2 className="text-lg font-bold text-slate-900">Recent Summaries</h2>
          {history.length === 0 ? (
            <div className="mt-4 rounded-2xl border-2 border-dashed border-slate-200 py-16 text-center">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-red-50 text-xl">
                📝
              </div>
              <p className="text-sm font-medium text-slate-500">No summaries yet</p>
              <Link href="/" className="mt-3 inline-block text-sm font-semibold text-red-600 hover:text-red-800">
                Create your first summary →
              </Link>
            </div>
          ) : (
            <div className="mt-4 space-y-2">
              {history.map((item) => {
                const itemStyle = PLAN_STYLES[item.plan] || PLAN_STYLES.basic;
                return (
                  <Link
                    key={item.id}
                    href={`/summary/${item.video_id}?plan=${item.plan}`}
                    className="flex items-center justify-between rounded-xl border border-slate-100 bg-white px-5 py-4 shadow-sm transition-all hover:border-red-100 hover:shadow-md"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-slate-900">
                        {item.video_title || item.video_id}
                      </p>
                      <div className="mt-1 flex items-center gap-2 text-xs text-slate-400">
                        <span>{new Date(item.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                        <span className={`rounded-full px-2 py-0.5 font-semibold uppercase ${itemStyle.bg} ${itemStyle.text}`}>
                          {item.plan}
                        </span>
                      </div>
                    </div>
                    <span className="ml-4 flex shrink-0 items-center gap-1 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-500 transition-all group-hover:border-red-200 group-hover:bg-red-50 group-hover:text-red-600">
                      View
                      <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </span>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {showCancelModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-white p-7 shadow-2xl">
            {cancelDone ? (
              <div className="text-center">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50 text-3xl">✓</div>
                <h2 className="text-xl font-bold text-slate-900">Subscription cancelled</h2>
                <p className="mt-2 text-sm text-slate-500">
                  Your subscription will remain active until the end of the current billing period. We&apos;re sorry to see you go.
                </p>
                <button
                  onClick={() => { setShowCancelModal(false); setCancelDone(false); setCancelReason(''); setCancelOther(''); }}
                  className="mt-6 w-full rounded-xl bg-slate-900 py-3 text-sm font-semibold text-white transition-all hover:bg-slate-800"
                >
                  Close
                </button>
              </div>
            ) : (
              <>
                <h2 className="text-xl font-bold text-slate-900">Cancel subscription</h2>
                <p className="mt-1 text-sm text-slate-500">We&apos;d love to know why you&apos;re leaving. Please select a reason:</p>

                <div className="mt-5 space-y-2">
                  {CANCEL_REASONS.map((reason) => (
                    <button
                      key={reason}
                      onClick={() => setCancelReason(reason)}
                      className={`w-full rounded-xl border px-4 py-3 text-left text-sm font-medium transition-all ${
                        cancelReason === reason
                          ? 'border-red-400 bg-red-50 text-red-700'
                          : 'border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      {reason}
                    </button>
                  ))}
                </div>

                {cancelReason === 'Other' && (
                  <textarea
                    value={cancelOther}
                    onChange={(e) => setCancelOther(e.target.value)}
                    placeholder="Tell us more..."
                    rows={3}
                    className="mt-3 w-full rounded-xl border border-slate-200 p-3 text-sm text-slate-700 outline-none focus:border-red-300 focus:ring-2 focus:ring-red-100"
                  />
                )}

                <div className="mt-6 flex gap-3">
                  <button
                    onClick={() => { setShowCancelModal(false); setCancelReason(''); setCancelOther(''); }}
                    className="flex-1 rounded-xl border border-slate-200 py-3 text-sm font-semibold text-slate-600 transition-all hover:bg-slate-50"
                  >
                    Keep my plan
                  </button>
                  <button
                    onClick={handleCancelSubscription}
                    disabled={cancelLoading || !cancelReason || (cancelReason === 'Other' && !cancelOther.trim())}
                    className="flex-1 rounded-xl bg-red-600 py-3 text-sm font-semibold text-white shadow-md shadow-red-200 transition-all hover:bg-red-700 disabled:opacity-40"
                  >
                    {cancelLoading ? 'Cancelling...' : 'Confirm cancel'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
