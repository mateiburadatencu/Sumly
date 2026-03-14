'use client';

import { useEffect, useState } from 'react';

const STEPS = [
  { label: 'Fetching transcript...', icon: '📝', duration: 8000 },
  { label: 'Detecting video type...', icon: '🔍', duration: 8000 },
  { label: 'Analyzing content...', icon: '🧠', duration: 15000 },
  { label: 'Generating explanation...', icon: '✨', duration: 20000 },
  { label: 'Finalizing your summary...', icon: '🚀', duration: Infinity },
];

export default function LoadingAnimation() {
  const [step, setStep] = useState(0);
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    let current = 0;
    const advance = () => {
      if (current < STEPS.length - 1) {
        current++;
        setStep(current);
        if (STEPS[current].duration !== Infinity) {
          setTimeout(advance, STEPS[current].duration);
        }
      }
    };
    const t = setTimeout(advance, STEPS[0].duration);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    const t = setInterval(() => setElapsed(s => s + 1), 1000);
    return () => clearInterval(t);
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
            <div key={i} className="relative h-1.5 w-10 overflow-hidden rounded-full bg-slate-100">
              <div
                className={`absolute inset-y-0 left-0 rounded-full bg-red-500 transition-all duration-700 ${
                  i < step ? 'w-full' : i === step ? 'w-1/2 animate-pulse' : 'w-0'
                }`}
              />
            </div>
          ))}
        </div>

        <p className="text-xs text-slate-400">
          {elapsed < 15
            ? 'This usually takes 30–60 seconds for detailed analysis'
            : elapsed < 40
            ? 'AI is deeply analyzing the content…'
            : elapsed < 65
            ? 'Almost there — writing your explanation…'
            : 'Taking a bit longer than usual, please wait…'}
        </p>
      </div>
    </div>
  );
}
