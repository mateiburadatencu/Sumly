import SummaryForm from '@/components/summary-form';

export default function Home() {
  return (
    <div className="hero-pattern">
      {/* Hero */}
      <section className="flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center px-6 pb-20 pt-10">
        <div className="flex w-full max-w-3xl flex-col items-center text-center">
          <h1 className="text-5xl font-extrabold leading-tight tracking-tight text-slate-900 sm:text-6xl lg:text-7xl">
            YouTube videos,{' '}
            <span className="gradient-text">summarized</span>
          </h1>

          <p className="mt-5 max-w-xl text-lg leading-relaxed text-slate-500 sm:text-xl">
            Turn any YouTube video into clear, structured notes in seconds.
            Stop watching — start <em>learning</em>.
          </p>

          <div className="mt-10 w-full max-w-2xl">
            <SummaryForm />
          </div>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-6 text-sm text-slate-400">
            <span className="flex items-center gap-1.5">
              <svg className="h-4 w-4 text-emerald-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              No credit card needed
            </span>
            <span className="flex items-center gap-1.5">
              <svg className="h-4 w-4 text-emerald-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              1 free summary per day
            </span>
            <span className="flex items-center gap-1.5">
              <svg className="h-4 w-4 text-emerald-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              Works with any video
            </span>
          </div>
        </div>
      </section>

      {/* Trusted by */}
      <section className="border-y border-slate-100 bg-white/50 py-10">
        <div className="mx-auto max-w-5xl px-6 text-center">
          <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">Trusted by students and professionals</p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-x-12 gap-y-4 text-2xl font-bold text-slate-200">
            <span>Stanford</span>
            <span>MIT</span>
            <span>Oxford</span>
            <span>Harvard</span>
            <span>TU Berlin</span>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-100 bg-white/50 py-8">
        <div className="mx-auto flex max-w-5xl flex-col items-center gap-3 px-6 text-center">
          <p className="text-xs text-slate-400">
            &copy; {new Date().getFullYear()} Sumly. All rights reserved.
          </p>
          <p className="text-[11px] text-slate-300">Operated by AGROMAR PROD SRL</p>
          <div className="flex flex-wrap items-center justify-center gap-4 text-xs text-slate-400">
            <a href="/terms" className="transition-colors hover:text-red-600">Terms of Service</a>
            <span className="text-slate-200">·</span>
            <a href="/privacy" className="transition-colors hover:text-red-600">Privacy Policy</a>
            <span className="text-slate-200">·</span>
            <a href="mailto:viralpersona@gmail.com" className="transition-colors hover:text-red-600">viralpersona@gmail.com</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
