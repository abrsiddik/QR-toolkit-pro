import { v4 as uuidv4 } from 'uuid';

export const COOKIE_NAME = 'qr_session';
const MAX_AGE_SEC = 365 * 24 * 60 * 60;

export function parseCookies(header) {
  if (!header) return {};
  return Object.fromEntries(
    header.split(';').map((part) => {
      const [key, ...rest] = part.trim().split('=');
      return [key, decodeURIComponent(rest.join('='))];
    })
  );
}

export function resolveSession(cookies) {
  let sessionId = cookies[COOKIE_NAME];
  let setCookie = null;

  if (!sessionId || typeof sessionId !== 'string') {
    sessionId = uuidv4();
    const secure = process.env.CONTEXT === 'production' ? '; Secure' : '';
    setCookie = `${COOKIE_NAME}=${sessionId}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${MAX_AGE_SEC}${secure}`;
  }

  return { sessionId, setCookie };
}

export function withSession(headers, setCookie) {
  const out = { ...headers };
  if (setCookie) out['Set-Cookie'] = setCookie;
  return out;
}
