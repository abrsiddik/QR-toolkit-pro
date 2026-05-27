import QRCode from 'qrcode';
import { getFormattedData } from './payload.js';

const MAX_DATA_LENGTH = 4000;
const MIN_SIZE = 200;
const MAX_SIZE = 1000;

function hexColor(value, fallback) {
  const hex = String(value || fallback).replace('#', '').toLowerCase();
  if (!/^[0-9a-f]{6}$/.test(hex)) return fallback;
  return hex;
}

export async function createQrImage({ type, data, size, color, bgcolor, hasLogo }) {
  const payload = getFormattedData(type, data);
  if (!payload || payload.length < 2) {
    throw new Error('QR payload is empty or too short');
  }
  if (payload.length > MAX_DATA_LENGTH) {
    throw new Error('QR payload exceeds maximum length');
  }

  const width = Math.min(MAX_SIZE, Math.max(MIN_SIZE, parseInt(size, 10) || 300));
  const dark = `#${hexColor(color, '000000')}`;
  const light = `#${hexColor(bgcolor, 'ffffff')}`;

  const buffer = await QRCode.toBuffer(payload, {
    type: 'png',
    width,
    margin: 1,
    color: { dark, light },
    errorCorrectionLevel: hasLogo ? 'H' : 'M',
  });

  return {
    image: `data:image/png;base64,${buffer.toString('base64')}`,
    payload,
    size: width,
  };
}
