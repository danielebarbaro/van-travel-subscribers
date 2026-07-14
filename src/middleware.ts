import NextAuth from 'next-auth';
import { authConfig } from '@/auth.config';

// Middleware runs in the Edge Runtime, so it uses the DB-free auth.config.
export const { auth: middleware } = NextAuth(authConfig);

export default middleware((req) => {
  if (!req.auth && req.nextUrl.pathname.startsWith('/dashboard')) {
    const loginUrl = new URL('/login', req.nextUrl.origin);
    return Response.redirect(loginUrl);
  }
});

export const config = {
  matcher: ['/dashboard/:path*'],
};
