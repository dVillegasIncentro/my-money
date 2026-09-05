import { defineMiddleware } from 'astro:middleware';
import { auth, verifySessionCookie } from './lib/auth';
import { env } from './lib/env';

// Protege toda la app excepto: página de login, acciones y endpoint de login.
export const onRequest = defineMiddleware(async (context, next) => {
  const pathname = context.url.pathname;
  const bypass = pathname.startsWith('/_actions/') || pathname === '/login' || pathname === '/api/login';

  if (bypass) return next();

  const cookie = context.cookies.get(auth.SESSION_COOKIE)?.value;
  const authed = cookie && env('MM_PASSWORD_HASH') ? verifySessionCookie(cookie, { MM_PASSWORD_HASH: env('MM_PASSWORD_HASH') }) : false;

  if (!authed) {
    return context.redirect('/login');
  }
  return next();
});
