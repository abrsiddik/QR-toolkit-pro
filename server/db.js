import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dataDir = path.join(__dirname, 'data');
const dbPath = path.join(dataDir, 'history.json');

function loadDb() {
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  if (!fs.existsSync(dbPath)) {
    return { history: [] };
  }
  try {
    return JSON.parse(fs.readFileSync(dbPath, 'utf8'));
  } catch {
    return { history: [] };
  }
}

function saveDb(db) {
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  fs.writeFileSync(dbPath, JSON.stringify(db, null, 2));
}

function mapRow(row) {
  return {
    id: row.id,
    type: row.type,
    data: row.data,
    date: new Date(row.created_at).toLocaleDateString(),
  };
}

export function getHistory(sessionId) {
  const db = loadDb();
  return db.history
    .filter((h) => h.session_id === sessionId)
    .sort((a, b) => b.id - a.id)
    .slice(0, 20)
    .map(mapRow);
}

export function addHistory(sessionId, type, data) {
  const db = loadDb();
  const latest = db.history
    .filter((h) => h.session_id === sessionId)
    .sort((a, b) => b.id - a.id)[0];

  if (latest?.data === data) {
    return getHistory(sessionId);
  }

  const id = db.history.reduce((max, h) => Math.max(max, h.id), 0) + 1;
  db.history.push({
    id,
    session_id: sessionId,
    type,
    data,
    created_at: new Date().toISOString(),
  });

  saveDb(db);
  return getHistory(sessionId);
}

export function clearHistory(sessionId) {
  const db = loadDb();
  db.history = db.history.filter((h) => h.session_id !== sessionId);
  saveDb(db);
  return [];
}
