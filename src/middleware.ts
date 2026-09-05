import { defineMiddleware } from 'astro:middleware';
import { auth, verifySessionCookie } from './lib/auth';

// Protege toda la app excepto: página de login, acciones y endpoint de login.
export const onRequest = defineMiddleware(async (context, next) => {
  const pathname = context.url.pathname;
  const bypass = pathname.startsWith('/_actions/') || pathname === '/login' || pathname === '/api/login';

  if (bypass) return next();

  const env = import.meta.env as { MM_PASSWORD_HASH?: string };
  const cookie = context.cookies.get(auth.SESSION_COOKIE)?.value;
  const authed = cookie ? verifySessionCookie(cookie, env) : false;

  if (!authed) {
    return context.redirect('/login');
  }
  return next();
});
