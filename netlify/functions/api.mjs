import { createQrImage } from '../../server/services/qr.js';
import { parseCookies, resolveSession, withSession } from '../utils/session.js';
import * as historyStore from '../utils/history-store.js';

function json(data, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...extraHeaders,
    },
  });
}

function getApiPath(url) {
  const { pathname } = new URL(url);
  if (pathname.startsWith('/.netlify/functions/api')) {
    const rest = pathname.slice('/.netlify/functions/api'.length);
    return rest || '/';
  }
  return pathname;
}

export default async (request) => {
  const path = getApiPath(request.url);
  const cookies = parseCookies(request.headers.get('cookie'));

  try {
    if (path === '/api/health' || path === '/health') {
      return json({ ok: true, service: 'qr-toolkit-pro' });
    }

    if ((path === '/api/qr/generate' || path === '/qr/generate') && request.method === 'POST') {
      const body = await request.json();
      const { type, data, size, color, bgcolor, hasLogo } = body || {};

      if (!type || !data) {
        return json({ error: 'type and data are required' }, 400);
      }

      const result = await createQrImage({
        type,
        data,
        size,
        color,
        bgcolor,
        hasLogo: Boolean(hasLogo),
      });

      return json(result);
    }

    if (path === '/api/history' || path === '/history') {
      const { sessionId, setCookie } = resolveSession(cookies);
      const headers = withSession({}, setCookie);

      if (request.method === 'GET') {
        const history = await historyStore.getHistory(sessionId);
        return json(history, 200, headers);
      }

      if (request.method === 'POST') {
        const body = await request.json();
        const { type, data } = body || {};
        if (!type || !data) {
          return json({ error: 'type and data are required' }, 400);
        }
        const history = await historyStore.addHistory(sessionId, type, String(data));
        return json(history, 200, headers);
      }

      if (request.method === 'DELETE') {
        const history = await historyStore.clearHistory(sessionId);
        return json(history, 200, headers);
      }

      return json({ error: 'Method not allowed' }, 405, headers);
    }

    return json({ error: 'Not found' }, 404);
  } catch (err) {
    console.error('API error:', err);
    return json({ error: err.message || 'Internal server error' }, 500);
  }
};
