// front-landing/src/app/login/page.tsx
import { signIn } from '@/auth';

export default function LoginPage() {
  return (
    <main className="min-h-screen flex items-center justify-center p-6">
      <form
        action={async (formData: FormData) => {
          'use server';
          const email = String(formData.get('email') ?? '').toLowerCase().trim();
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
      </form>
    </main>
  );
}
