// Endpoint de login: verifica la contraseña, firma la cookie y redirige (303 = See Other).
import type { APIContext } from 'astro';
import { auth, createSessionCookie, verifyPassword } from '../../lib/auth';
import { env } from '../../lib/env';

export async function POST(context: APIContext): Promise<Response> {
  const hash = env('MM_PASSWORD_HASH');
  const form = await context.request.formData();
  const password = String(form.get('password') ?? '');
  const remember = form.get('remember') === 'on';

  if (!hash || !verifyPassword(password, hash)) {
    return context.redirect('/login?error=bad', 303);
  }

  const cookie = createSessionCookie({ MM_PASSWORD_HASH: hash });
  context.cookies.set(auth.SESSION_COOKIE, cookie, {
    httpOnly: true,
    sameSite: 'lax',
    secure: import.meta.env.PROD,
    path: '/',
    maxAge: remember ? auth.SESSION_DURATION : undefined,
  });
  return context.redirect('/', 303);
}
