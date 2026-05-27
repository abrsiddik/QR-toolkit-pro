import { getStore } from '@netlify/blobs';

const STORE_NAME = 'qr-history';

function mapItem(row) {
  return {
    id: row.id,
    type: row.type,
    data: row.data,
    date: new Date(row.created_at).toLocaleDateString(),
  };
}

export async function getHistory(sessionId) {
  const store = getStore(STORE_NAME);
  const items = (await store.get(sessionId, { type: 'json' })) || [];
  return items.map(mapItem);
}

export async function addHistory(sessionId, type, data) {
  const store = getStore(STORE_NAME);
  const items = (await store.get(sessionId, { type: 'json' })) || [];

  if (items[0]?.data === data) {
    return items.map(mapItem);
  }

  const id = items.reduce((max, h) => Math.max(max, h.id || 0), 0) + 1;
  items.unshift({
    id,
    type,
    data,
    created_at: new Date().toISOString(),
  });

  const trimmed = items.slice(0, 20);
  await store.setJSON(sessionId, trimmed);
  return trimmed.map(mapItem);
}

export async function clearHistory(sessionId) {
  const store = getStore(STORE_NAME);
  await store.delete(sessionId);
  return [];
}
