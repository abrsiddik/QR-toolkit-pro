import express from 'express';
import cookieParser from 'cookie-parser';
import path from 'path';
import { fileURLToPath } from 'url';
import qrRoutes from './routes/qr.js';
import historyRoutes from './routes/history.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const clientDir = path.join(__dirname, '../client');
const PORT = process.env.PORT || 3000;

const app = express();

app.use(cookieParser());
app.use(express.json({ limit: '1mb' }));

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, service: 'qr-toolkit-pro' });
});

app.use('/api/qr', qrRoutes);
app.use('/api/history', historyRoutes);

app.use(express.static(clientDir));

app.get('*', (_req, res) => {
  res.sendFile(path.join(clientDir, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`QR Toolkit Pro running at http://localhost:${PORT}`);
});
