const API = '/api';

async function request(path, options = {}) {
  const res = await fetch(`${API}${path}`, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
  });

  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(body.error || `Request failed (${res.status})`);
  }
  return body;
}

export function generateQr(params) {
  return request('/qr/generate', {
    method: 'POST',
    body: JSON.stringify(params),
  });
}

function loadLocalHistory() {
  try {
    return JSON.parse(localStorage.getItem('qr_toolkit_history')) || [];
  } catch {
    return [];
  }
}

function saveLocalHistory(items) {
  localStorage.setItem('qr_toolkit_history', JSON.stringify(items));
}

export async function fetchHistory() {
  try {
    return await request('/history');
  } catch {
    return loadLocalHistory();
  }
}

export async function saveHistory(type, data) {
  try {
    return await request('/history', {
      method: 'POST',
      body: JSON.stringify({ type, data }),
    });
  } catch {
    const items = loadLocalHistory();
    if (items[0]?.data !== data) {
      items.unshift({ id: Date.now(), type, data, date: new Date().toLocaleDateString() });
      if (items.length > 20) items.pop();
      saveLocalHistory(items);
    }
    return loadLocalHistory();
  }
}

export async function clearHistoryApi() {
  try {
    return await request('/history', { method: 'DELETE' });
  } catch {
    saveLocalHistory([]);
    return [];
  }
}
