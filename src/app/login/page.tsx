// front-landing/src/app/login/page.tsx
import { signIn } from '@/auth';
import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import Link from 'next/link';
import { checkRateLimit } from '@/lib/rate-limiter';
import { emailDatabase } from '@/lib/database';

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <main className="bs flex items-center justify-center p-6">
      <div className="bs-card w-full max-w-md p-8 sm:p-10">
        <p className="bs-label mb-3">BarbiSurfer</p>
        <h1 className="bs-title text-4xl mb-3">Accedi</h1>
        <p className="bs-muted text-[0.95rem] leading-relaxed mb-7">
          Inserisci l&apos;email con cui ti sei iscritto. Ti mandiamo un link per
          entrare, senza password.
        </p>

        <form
          action={async (formData: FormData) => {
            'use server';
            const email = String(formData.get('email') ?? '').toLowerCase().trim();

            const h = await headers();
            const ip = (h.get('x-forwarded-for')?.split(',')[0] ?? 'unknown').trim();

            const { allowed } = checkRateLimit(ip);
            if (!allowed) {
              redirect('/login?error=rate');
            }

            if (!(await emailDatabase.isActiveSubscriber(email))) {
              redirect('/login?error=notfound');
            }

            await signIn('resend', { email, redirectTo: '/dashboard' });
          }}
          className="space-y-3"
        >
          <div className="space-y-1.5">
            <label htmlFor="email" className="bs-label">
              Email
            </label>
            <input
              id="email"
              type="email"
              name="email"
              required
              autoComplete="email"
              placeholder="tu@esempio.com"
              className="bs-input"
            />
          </div>
          <button type="submit" className="bs-btn bs-btn-primary w-full">
            Inviami il link
          </button>
        </form>

        {error === 'notfound' && (
          <div className="bs-alert-error mt-5">
            Questa email non risulta iscritta.{' '}
            <Link href="/" className="underline font-medium">
              Iscriviti dalla landing.
            </Link>
          </div>
        )}
        {error === 'rate' && (
          <div className="bs-alert-error mt-5">
            Troppi tentativi. Riprova tra qualche minuto.
          </div>
        )}
      </div>
    </main>
  );
}
