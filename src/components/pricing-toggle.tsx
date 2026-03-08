'use client';

interface Props {
  annual: boolean;
  onChange: (annual: boolean) => void;
}

export default function PricingToggle({ annual, onChange }: Props) {
  return (
    <div className="flex items-center justify-center gap-3">
      <span className={`text-sm font-semibold transition-colors ${!annual ? 'text-slate-900' : 'text-slate-400'}`}>
        Monthly
      </span>
      <button
        onClick={() => onChange(!annual)}
        className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors ${
          annual ? 'bg-red-600' : 'bg-slate-300'
        }`}
        role="switch"
        aria-checked={annual}
      >
        <span
          className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-sm transition-transform ${
            annual ? 'translate-x-6' : 'translate-x-1'
          }`}
        />
      </button>
      <span className={`text-sm font-semibold transition-colors ${annual ? 'text-slate-900' : 'text-slate-400'}`}>
        Annual
      </span>
      {annual && (
        <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-bold text-emerald-700">
          2 months free
        </span>
      )}
    </div>
  );
}
