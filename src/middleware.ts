import { defineMiddleware } from 'astro:middleware';
import { auth, verifySessionCookie } from './lib/auth';

// Protege toda la app excepto la página de login y las acciones (/_actions/*).
export const onRequest = defineMiddleware(async (context, next) => {
  const pathname = context.url.pathname;
  const isAction = pathname.startsWith('/_actions/');
  const isLogin = pathname === '/login';

  if (isAction) return next();

  const env = import.meta.env as { MM_PASSWORD_HASH?: string };
  const cookie = context.cookies.get(auth.SESSION_COOKIE)?.value;
  const authed = cookie ? verifySessionCookie(cookie, env) : false;

  if (!authed && !isLogin) {
    return context.redirect('/login');
  }
  if (authed && isLogin) {
    return context.redirect('/');
  }
  return next();
});
