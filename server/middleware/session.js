import { v4 as uuidv4 } from 'uuid';

const COOKIE_NAME = 'qr_session';
const MAX_AGE_MS = 365 * 24 * 60 * 60 * 1000;

export function ensureSession(req, res, next) {
  let sessionId = req.cookies?.[COOKIE_NAME];
  if (!sessionId || typeof sessionId !== 'string') {
    sessionId = uuidv4();
    res.cookie(COOKIE_NAME, sessionId, {
      httpOnly: true,
      maxAge: MAX_AGE_MS,
      sameSite: 'lax',
    });
  }
  req.sessionId = sessionId;
  next();
}
