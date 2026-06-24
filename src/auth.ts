import NextAuth from 'next-auth';
import Resend from 'next-auth/providers/resend';
import { DrizzleAdapter } from '@auth/drizzle-adapter';
import { db } from '@/db/drizzle';
import { users, accounts, sessions, verificationTokens } from '@/db/schema';
import { emailDatabase } from '@/lib/database';
import { magicLinkEmail } from '@/lib/magic-link-email';

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: DrizzleAdapter(db, {
    usersTable: users,
    accountsTable: accounts,
    sessionsTable: sessions,
    verificationTokensTable: verificationTokens,
  }),
  session: { strategy: 'jwt' },
  providers: [
    Resend({
      // Accept either the Auth.js default name or the backend's RESEND_API_KEY.
      apiKey: process.env.AUTH_RESEND_KEY ?? process.env.RESEND_API_KEY,
      from: process.env.AUTH_EMAIL_FROM ?? 'onboarding@resend.dev',
      async sendVerificationRequest({ identifier: email, url, provider }) {
        const res = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${provider.apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: provider.from,
            to: email,
            subject: 'Il tuo link di accesso a BarbiSurfer',
            html: magicLinkEmail(url),
          }),
        });

        if (!res.ok) {
          throw new Error(`Resend error: ${JSON.stringify(await res.json())}`);
        }
      },
    }),
  ],
  pages: {
    signIn: '/login',
    verifyRequest: '/verify-request',
    error: '/auth-error',
  },
  callbacks: {
    // Allow login ONLY for emails already subscribed (not soft-deleted).
    async signIn({ user }) {
      const email = user?.email?.toLowerCase().trim();
      if (!email) return false;
      return await emailDatabase.isActiveSubscriber(email);
    },
    async jwt({ token, user }) {
      if (user?.email) {
        token.email = user.email;
      }
      return token;
    },
    async session({ session, token }) {
      if (token.email) {
        session.user.email = token.email as string;
      }
      return session;
    },
  },
});
