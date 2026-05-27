export function normalizeUrl(value) {
  let url = (value || '').trim();
  if (!url) return '';
  if (!/^https?:\/\//i.test(url)) url = `https://${url}`;
  return url;
}

export function getFormattedData(type, data) {
  const d = data || {};
  switch (type) {
    case 'url':
      return d.url ? normalizeUrl(d.url) : '';
    case 'wifi':
      if (!d.ssid) return '';
      return `WIFI:T:${d.encryption || 'WPA'};S:${d.ssid};P:${d.password || ''};;`;
    case 'email':
      if (!d.email_to) return '';
      return `mailto:${d.email_to}?subject=${encodeURIComponent(d.email_sub || '')}&body=${encodeURIComponent(d.email_body || '')}`;
    case 'vcard':
      if (!d.fname && !d.phone) return '';
      return `BEGIN:VCARD\nVERSION:3.0\nN:${d.lname || ''};${d.fname || ''};;;\nFN:${d.fname || ''} ${d.lname || ''}\nORG:${d.org || ''}\nTEL:${d.phone || ''}\nEMAIL:${d.email || ''}\nEND:VCARD`;
    case 'text':
      return d.plain_text || '';
    default:
      return '';
  }
}
