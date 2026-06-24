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
    <main className="min-h-screen max-w-lg mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-semibold">Le tue preferenze</h1>
      <p className="text-sm text-gray-500">{email}</p>
      <PreferencesForm initial={prefs} countries={[...countries]} />
    </main>
  );
}
