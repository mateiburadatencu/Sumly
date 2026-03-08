'use client';

import { useEffect, useState } from 'react';

const STEPS = [
  { label: 'Fetching transcript...', icon: '📝' },
  { label: 'Analyzing content...', icon: '🔍' },
  { label: 'Generating summary...', icon: '✨' },
  { label: 'Almost done...', icon: '🚀' },
];

export default function LoadingAnimation() {
  const [step, setStep] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setStep((s) => (s < STEPS.length - 1 ? s + 1 : s));
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="mt-10 flex flex-col items-center gap-6">
      <div className="relative">
        <div className="h-16 w-16 animate-spin rounded-full border-[3px] border-red-100 border-t-red-500" />
        <div className="absolute inset-0 flex items-center justify-center text-xl">
          {STEPS[step].icon}
        </div>
      </div>

      <div className="flex flex-col items-center gap-3">
        <p className="text-sm font-semibold text-slate-700">{STEPS[step].label}</p>

        <div className="flex gap-2">
          {STEPS.map((_, i) => (
            <div key={i} className="relative h-1.5 w-12 overflow-hidden rounded-full bg-slate-100">
              <div
                className={`absolute inset-y-0 left-0 rounded-full bg-red-500 transition-all duration-500 ${
                  i < step ? 'w-full' : i === step ? 'w-1/2 animate-pulse' : 'w-0'
                }`}
              />
            </div>
          ))}
        </div>

        <p className="text-xs text-slate-400">This usually takes 15-30 seconds</p>
      </div>
    </div>
  );
}
