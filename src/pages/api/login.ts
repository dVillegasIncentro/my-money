// Endpoint de login: verifica la contraseña, firma la cookie y redirige.
import type { APIContext } from 'astro';
import { auth, createSessionCookie, verifyPassword } from '../../lib/auth';

export async function POST(context: APIContext): Promise<Response> {
  const env = import.meta.env as { MM_PASSWORD_HASH?: string };
  const form = await context.request.formData();
  const password = String(form.get('password') ?? '');
  const remember = form.get('remember') === 'on';

  if (!env.MM_PASSWORD_HASH || !verifyPassword(password, env.MM_PASSWORD_HASH)) {
    return context.redirect('/login?error=bad', 302);
  }

  const cookie = createSessionCookie(env);
  context.cookies.set(auth.SESSION_COOKIE, cookie, {
    httpOnly: true,
    sameSite: 'lax',
    secure: import.meta.env.PROD,
    path: '/',
    maxAge: remember ? auth.SESSION_DURATION : undefined,
  });
  return context.redirect('/', 302);
}
