import type { NextAuthConfig } from 'next-auth';

// Edge-safe config: no database adapter, no Node-only imports (e.g. crypto).
// Used by the middleware, which runs in the Edge Runtime.
export const authConfig = {
  session: { strategy: 'jwt' },
  providers: [],
  pages: {
    signIn: '/login',
    verifyRequest: '/verify-request',
    error: '/auth-error',
  },
  callbacks: {
    authorized({ auth, request }) {
      const isLoggedIn = Boolean(auth?.user);
      const isDashboard = request.nextUrl.pathname.startsWith('/dashboard');
      if (isDashboard) return isLoggedIn;
      return true;
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
} satisfies NextAuthConfig;
