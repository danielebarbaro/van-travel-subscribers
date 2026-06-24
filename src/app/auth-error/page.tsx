// front-landing/src/app/auth-error/page.tsx
import Link from 'next/link';

const MESSAGES: Record<string, { title: string; body: string }> = {
  Configuration: {
    title: 'Servizio non disponibile',
    body: 'C’è un problema di configurazione lato server. Riprova tra poco; se persiste avvisaci.',
  },
  Verification: {
    title: 'Link non più valido',
    body: 'Questo link di accesso è scaduto o è già stato usato. Richiedine uno nuovo.',
  },
  AccessDenied: {
    title: 'Accesso negato',
    body: 'Questa email non può accedere. Iscriviti dalla landing per poter entrare.',
  },
};

const FALLBACK = {
  title: 'Qualcosa è andato storto',
  body: 'Non siamo riusciti a completare l’accesso. Riprova dal login.',
};

export default async function AuthErrorPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const { title, body } = (error && MESSAGES[error]) || FALLBACK;

  return (
    <main className="bs flex items-center justify-center p-6">
      <div className="bs-card w-full max-w-md p-8 sm:p-10 text-center">
        <div
          className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl"
          style={{ background: 'var(--bs-danger-soft)' }}
          aria-hidden
        >
          <svg
            width="30"
            height="30"
            viewBox="0 0 24 24"
            fill="none"
            stroke="var(--bs-danger)"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="12" cy="12" r="9" />
            <path d="M12 8v5" />
            <path d="M12 16h.01" />
          </svg>
        </div>
        <h1 className="bs-title text-3xl mb-3">{title}</h1>
        <p className="bs-muted text-[0.95rem] leading-relaxed mb-7">{body}</p>
        <Link href="/login" className="bs-btn bs-btn-primary w-full">
          Torna al login
        </Link>
      </div>
    </main>
  );
}
