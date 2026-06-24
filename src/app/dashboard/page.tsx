// front-landing/src/app/dashboard/page.tsx
import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { emailDatabase } from '@/lib/database';
import { countries } from '@/lib/countries';
import { PreferencesForm } from './PreferencesForm';

export default async function DashboardPage() {
  const session = await auth();
  const email = session?.user?.email?.toLowerCase().trim();
  if (!email) {
    redirect('/login');
  }

  const prefs = await emailDatabase.getPreferences(email);
  if (!prefs) {
    redirect('/login');
  }

  return (
    <main className="bs px-6 py-12 sm:py-16">
      <div className="mx-auto w-full max-w-lg">
        <header className="mb-8">
          <p className="bs-label mb-2">BarbiSurfer</p>
          <h1 className="bs-title text-4xl mb-1">Le tue preferenze</h1>
          <p className="bs-muted text-sm">{email}</p>
        </header>
        <PreferencesForm initial={prefs} countries={[...countries]} />
      </div>
    </main>
  );
}
