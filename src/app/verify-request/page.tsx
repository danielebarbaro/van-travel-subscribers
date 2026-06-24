// front-landing/src/app/verify-request/page.tsx
import Link from 'next/link';

export default function VerifyRequestPage() {
  return (
    <main className="bs flex items-center justify-center p-6">
      <div className="bs-card w-full max-w-md p-8 sm:p-10 text-center">
        <div
          className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl"
          style={{ background: 'var(--bs-accent-soft)' }}
          aria-hidden
        >
          <svg
            width="30"
            height="30"
            viewBox="0 0 24 24"
            fill="none"
            stroke="var(--bs-accent)"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <rect x="2" y="4" width="20" height="16" rx="3" />
            <path d="m3 7 9 6 9-6" />
          </svg>
        </div>
        <h1 className="bs-title text-3xl mb-3">Controlla la tua email</h1>
        <p className="bs-muted text-[0.95rem] leading-relaxed">
          Ti abbiamo mandato un link di accesso. Aprilo dalla tua casella per entrare
          nel pannello. Il link vale pochi minuti.
        </p>
        <p className="bs-muted text-sm mt-6">
          Non lo trovi? Controlla lo spam, oppure{' '}
          <Link href="/login" className="bs-accent underline font-medium">
            richiedine un altro
          </Link>
          .
        </p>
      </div>
    </main>
  );
}
