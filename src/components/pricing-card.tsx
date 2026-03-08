'use client';

interface Props {
  name: string;
  price: string;
  period: string;
  features: string[];
  highlighted?: boolean;
  dark?: boolean;
  badge?: string;
  cta: string;
  onSelect: () => void;
  loading?: boolean;
}

export default function PricingCard({
  name,
  price,
  period,
  features,
  highlighted,
  dark,
  badge,
  cta,
  onSelect,
  loading,
}: Props) {
  const cardClass = dark
    ? 'border-2 border-slate-900 bg-white shadow-xl shadow-slate-200'
    : highlighted
      ? 'border-red-200 bg-white shadow-xl shadow-red-100/50 ring-1 ring-red-100'
      : 'border-slate-200 bg-white shadow-sm hover:shadow-md';

  const badgeClass = dark
    ? 'bg-slate-900 text-white'
    : 'bg-red-600 text-white';

  const titleClass = dark
    ? 'text-slate-900'
    : highlighted
      ? 'text-red-700'
      : 'text-slate-900';

  const priceClass = 'text-slate-900';
  const periodClass = 'text-slate-400';
  const featureTextClass = 'text-slate-600';
  const checkClass = dark ? 'text-slate-900' : 'text-red-500';

  const buttonClass = dark
    ? 'bg-slate-900 text-white shadow-lg shadow-slate-200 hover:bg-slate-800 hover:shadow-xl'
    : highlighted
      ? 'bg-red-600 text-white shadow-lg shadow-red-200 hover:bg-red-700 hover:shadow-xl'
      : 'border border-slate-200 bg-white text-slate-700 hover:border-red-200 hover:bg-red-50 hover:text-red-700';

  return (
    <div className={`relative flex flex-col rounded-2xl border p-6 transition-all sm:p-8 ${cardClass}`}>
      {badge && (
        <div className={`absolute -top-3 left-1/2 -translate-x-1/2 rounded-full px-4 py-1 text-xs font-bold shadow-md ${badgeClass}`}>
          {badge}
        </div>
      )}

      <div className="mb-6">
        <h3 className={`text-lg font-bold ${titleClass}`}>{name}</h3>
        <div className="mt-3 flex items-baseline gap-1">
          <span className={`text-4xl font-extrabold ${priceClass}`}>{price}</span>
          {period && <span className={`text-sm ${periodClass}`}>/{period}</span>}
        </div>
      </div>

      <ul className="mb-8 flex-1 space-y-3">
        {features.map((feature, i) => (
          <li key={i} className={`flex items-start gap-2.5 text-sm ${featureTextClass}`}>
            <svg className={`mt-0.5 h-4 w-4 shrink-0 ${checkClass}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
            </svg>
            {feature}
          </li>
        ))}
      </ul>

      <button
        onClick={onSelect}
        disabled={loading}
        className={`w-full rounded-xl py-3 text-sm font-semibold transition-all disabled:opacity-50 ${buttonClass}`}
      >
        {loading ? 'Loading...' : cta}
      </button>
    </div>
  );
}
