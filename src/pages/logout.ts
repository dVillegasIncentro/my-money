// Cierra la sesión y redirige al login (POST nativo; 303 = See Other).
import type { APIContext } from 'astro';
import { auth } from '../lib/auth';

export async function POST(context: APIContext): Promise<Response> {
  context.cookies.delete(auth.SESSION_COOKIE, { path: '/' });
  return context.redirect('/login', 303);
}
