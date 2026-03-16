'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import PricingCard from '@/components/pricing-card';
import PricingToggle from '@/components/pricing-toggle';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import Link from 'next/link';

const PLANS = [
  {
    name: 'Basic',
    plan: 'basic' as const,
    monthlyPrice: 'Free',
    annualPrice: 'Free',
    monthlyPeriod: '',
    annualPeriod: '',
    features: [
      '1 summary per day',
      'Videos up to 15 minutes',
      'Concise summary format',
      'PDF export (with watermark)',
    ],
    cta: 'Get Started',
  },
  {
    name: 'Plus',
    plan: 'plus' as const,
    monthlyPrice: '€4.99',
    annualPrice: '€49',
    monthlyPeriod: 'month',
    annualPeriod: 'year',
    badge: 'Most Popular',
    features: [
      '80 summaries per month',
      'Videos up to 2 hours',
      'Detailed structured summary',
      'Better AI results',
      'PDF export (no watermark)',
      'Faster processing',
      'Study Mode Lite (coming soon)',
    ],
    highlighted: true,
    cta: 'Start Plus',
  },
  {
    name: 'Pro',
    plan: 'pro' as const,
    monthlyPrice: '€9.99',
    annualPrice: '€99',
    monthlyPeriod: 'month',
    annualPeriod: 'year',
    badge: 'Best Value',
    dark: true,
    features: [
      '250 summaries per month',
      'Videos up to 4 hours',
      'Full detailed summary',
      'Even better AI results',
      'PDF export (no watermark)',
      'Highest priority processing',
      'Advanced study features (coming soon)',
    ],
    cta: 'Start Pro',
  },
];


const FAQ = [
  {
    q: 'What YouTube videos work with Sumly?',
    a: 'All public YouTube videos work with Sumly — lectures, tutorials, podcasts, interviews, car reviews, vlogs, and more. Just paste the link and get your summary instantly.',
  },
  {
    q: 'How do the AI results differ between plans?',
    a: 'All plans use GPT-5 mini. Basic gives you a concise overview and key points. Plus provides detailed theme breakdowns and more insights. Pro delivers the most comprehensive analysis with actionable takeaways, key quotes, and deeper topic coverage.',
  },
  {
    q: 'Can I cancel my subscription anytime?',
    a: 'Yes. You can cancel anytime from your dashboard. You\'ll keep access until the end of your current billing period.',
  },
  {
    q: 'Do longer videos get longer summaries?',
    a: 'Yes. Summary length scales with video duration. A 5-minute video gets a concise summary, while a 2-hour lecture gets a much more thorough breakdown.',
  },
];

export default function PricingPage() {
  const [annual, setAnnual] = useState(false);
  const [loading, setLoading] = useState<string | null>(null);
  const [currentPlan, setCurrentPlan] = useState<string | null>(null);
  const router = useRouter();

  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
    const fetchPlan = async () => {
      try {
        const supabase = createSupabaseBrowserClient();
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;
        const { data: profile } = await supabase
          .from('profiles')
          .select('plan, subscription_status')
          .eq('id', session.user.id)
          .single();
        if (profile?.subscription_status === 'active') {
          setCurrentPlan(profile.plan);
        } else {
          setCurrentPlan('basic');
        }
      } catch { /* silent */ }
    };
    fetchPlan();
  }, []);

  const handleSelect = async (plan: string) => {
    if (plan === 'basic') {
      router.push('/auth/signup');
      return;
    }

    setLoading(plan);

    try {
      const supabase = createSupabaseBrowserClient();
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        router.push('/auth/signup');
        return;
      }

      const res = await fetch('/api/create-checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ plan, billing: annual ? 'annual' : 'monthly' }),
      });

      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        alert(data.error || 'Something went wrong. Please try again.');
      }
    } catch {
      alert('Something went wrong. Please try again.');
    } finally {
      setLoading(null);
    }
  };

  if (!mounted) return null;

  return (
    <div className="hero-pattern min-h-[calc(100vh-4rem)]">
      <section className="px-6 pt-20 pb-4">
        <div className="mx-auto max-w-3xl text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-red-200 bg-red-50 px-4 py-1.5 text-sm font-medium text-red-700">
            💰 Save ~17% with annual billing
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl">
            Simple, <span className="gradient-text">transparent</span> pricing
          </h1>
          <p className="mt-4 text-lg text-slate-500">
            Start free. Upgrade when you need more power.
          </p>
          <div className="mt-8">
            <PricingToggle annual={annual} onChange={setAnnual} />
          </div>
        </div>
      </section>

      <section className="px-6 py-12">
        <div className="mx-auto grid max-w-5xl gap-6 md:grid-cols-3">
          {PLANS.map((plan) => (
            <PricingCard
              key={plan.plan}
              name={plan.name}
              price={annual ? plan.annualPrice : plan.monthlyPrice}
              period={annual ? plan.annualPeriod : plan.monthlyPeriod}
              features={plan.features}
              highlighted={plan.highlighted}
              dark={plan.dark}
              badge={plan.badge}
              cta={plan.cta}
              onSelect={() => handleSelect(plan.plan)}
              loading={loading === plan.plan}
              isCurrent={currentPlan === plan.plan}
            />
          ))}
        </div>
      </section>

      <section className="px-6 py-16">
        <div className="mx-auto max-w-4xl">
          <h2 className="mb-8 text-center text-2xl font-bold text-slate-900">
            Full feature comparison
          </h2>
          <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[520px] text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50">
                    <th className="px-4 py-4 font-semibold text-slate-500 sm:px-6">Feature</th>
                    <th className="px-3 py-4 text-center font-semibold text-slate-500 sm:px-4">Basic</th>
                    <th className="px-3 py-4 text-center font-semibold text-red-600 sm:px-4">Plus</th>
                    <th className="px-3 py-4 text-center font-semibold text-red-700 sm:px-4">Pro</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {[
                  ['Summaries', '1/day', '80/month', '250/month'],
                  ['Max video length', '15 min', '2 hours', '4 hours'],
                  ['Summary detail', 'Concise', 'Detailed', 'Full'],
                  ['AI result quality', 'Standard', 'Better', 'Even better'],
                  ['Key insights', '6 points', '8-10 insights', '10 + quotes'],
                  ['Actionable takeaways', '—', '—', '5 takeaways'],
                  ['Cheat Sheet generator', '—', '✓', '✓'],
                  ['PDF export', 'Watermark', 'Clean', 'Clean'],
                  ['Priority processing', '—', 'Faster', 'Highest'],
                  ['Study features', '—', 'Lite (soon)', 'Full (soon)'],
                  ['Monthly price', 'Free', '€4.99', '€9.99'],
                  ['Annual price', 'Free', '€49/yr', '€99/yr'],
                  ].map(([feature, basic, plus, pro], i) => (
                    <tr key={i} className="hover:bg-slate-50/50">
                      <td className="px-4 py-3 font-medium text-slate-700 sm:px-6">{feature}</td>
                      <td className={`px-3 py-3 text-center sm:px-4 ${basic === '✓' ? 'font-bold text-emerald-600' : basic === '—' ? 'text-slate-300' : 'text-slate-500'}`}>{basic}</td>
                      <td className={`px-3 py-3 text-center font-medium sm:px-4 ${plus === '✓' ? 'font-bold text-emerald-600' : plus === '—' ? 'text-slate-300' : 'text-slate-700'}`}>{plus}</td>
                      <td className={`px-3 py-3 text-center font-medium sm:px-4 ${pro === '✓' ? 'font-bold text-emerald-600' : pro === '—' ? 'text-slate-300' : 'text-slate-700'}`}>{pro}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>

      <section className="px-6 py-16">
        <div className="mx-auto max-w-2xl">
          <h2 className="mb-8 text-center text-2xl font-bold text-slate-900">
            Frequently asked questions
          </h2>
          <div className="space-y-4">
            {FAQ.map((item, i) => (
              <div key={i} className="rounded-xl border border-slate-100 bg-white p-5 shadow-sm">
                <h3 className="font-semibold text-slate-900">{item.q}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-500">{item.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="px-6 py-16">
        <div className="mx-auto max-w-2xl text-center">
          <div className="rounded-3xl bg-red-600 p-10 shadow-xl shadow-red-200 sm:p-14">
            <h2 className="text-2xl font-bold text-white sm:text-3xl">
              Start summarizing for free
            </h2>
            <p className="mt-3 text-red-100">
              No credit card required. Get your first summary in under a minute.
            </p>
            <Link
              href="/auth/signup"
              className="mt-6 inline-block rounded-xl bg-white px-8 py-3 text-sm font-bold text-red-700 shadow-lg transition-all hover:shadow-xl"
            >
              Get Started
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
