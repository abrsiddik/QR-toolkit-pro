import { Router } from 'express';
import { createQrImage } from '../services/qr.js';

const router = Router();

router.post('/generate', async (req, res) => {
  try {
    const { type, data, size, color, bgcolor, hasLogo } = req.body || {};
    if (!type || !data) {
      return res.status(400).json({ error: 'type and data are required' });
    }

    const result = await createQrImage({
      type,
      data,
      size,
      color,
      bgcolor,
      hasLogo: Boolean(hasLogo),
    });

    res.json(result);
  } catch (err) {
    res.status(400).json({ error: err.message || 'Failed to generate QR code' });
  }
});

export default router;
