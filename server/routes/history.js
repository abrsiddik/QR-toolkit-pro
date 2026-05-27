import { Router } from 'express';
import { addHistory, clearHistory, getHistory } from '../db.js';
import { ensureSession } from '../middleware/session.js';

const router = Router();

router.use(ensureSession);

router.get('/', (req, res) => {
  res.json(getHistory(req.sessionId));
});

router.post('/', (req, res) => {
  const { type, data } = req.body || {};
  if (!type || !data) {
    return res.status(400).json({ error: 'type and data are required' });
  }
  const history = addHistory(req.sessionId, type, String(data));
  res.json(history);
});

router.delete('/', (req, res) => {
  res.json(clearHistory(req.sessionId));
});

export default router;
