import NextAuth from 'next-auth';
import Resend from 'next-auth/providers/resend';
import { DrizzleAdapter } from '@auth/drizzle-adapter';
import { db } from '@/db/drizzle';
import { users, accounts, sessions, verificationTokens } from '@/db/schema';
import { emailDatabase } from '@/lib/database';

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
    }),
  ],
  pages: {
    signIn: '/login',
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
