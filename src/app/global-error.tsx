'use client';

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html>
      <body style={{ fontFamily: 'sans-serif', padding: '2rem', background: '#fff' }}>
        <h2 style={{ color: '#dc2626' }}>Something went wrong</h2>
        <pre style={{ background: '#f1f5f9', padding: '1rem', borderRadius: '8px', overflow: 'auto', fontSize: '13px' }}>
          {error?.message || 'Unknown error'}
          {'\n'}
          {error?.stack || ''}
        </pre>
        <button onClick={reset} style={{ marginTop: '1rem', padding: '0.5rem 1rem', background: '#dc2626', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>
          Try again
        </button>
      </body>
    </html>
  );
}
