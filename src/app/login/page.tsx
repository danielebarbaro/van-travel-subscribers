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
    <main className="min-h-screen flex items-center justify-center p-6">
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
        className="w-full max-w-sm space-y-4"
      >
        <h1 className="text-2xl font-semibold">Accedi</h1>
        <p className="text-sm text-gray-500">
          Inserisci l&apos;email con cui ti sei iscritto. Ti inviamo un link di accesso.
        </p>
        <input
          type="email"
          name="email"
          required
          placeholder="tu@esempio.com"
          className="w-full border rounded px-3 py-2"
        />
        <button type="submit" className="w-full bg-black text-white rounded px-3 py-2">
          Inviami il link
        </button>
        {error === 'notfound' && (
          <p className="text-sm text-red-600">
            Questa email non risulta iscritta.{' '}
            <Link href="/" className="underline">Iscriviti dalla landing page.</Link>
          </p>
        )}
        {error === 'rate' && (
          <p className="text-sm text-red-600">
            Troppi tentativi. Riprova tra qualche minuto.
          </p>
        )}
      </form>
    </main>
  );
}
