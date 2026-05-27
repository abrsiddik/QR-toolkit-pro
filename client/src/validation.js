import { normalizeUrl } from './payload.js';

const EMAIL_REGEX = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;

export function validateUrl(value) {
  const trimmed = (value || '').trim();
  if (!trimmed) return { valid: false, message: 'URL is required' };
  try {
    const parsed = new URL(normalizeUrl(trimmed));
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      return { valid: false, message: 'Only http and https URLs are supported' };
    }
    const host = parsed.hostname;
    const isLocal = host === 'localhost' || /^\d{1,3}(\.\d{1,3}){3}$/.test(host);
    if (!host || (!isLocal && !host.includes('.'))) {
      return { valid: false, message: 'Enter a valid domain (e.g. example.com)' };
    }
    return { valid: true, normalized: parsed.href, message: '' };
  } catch {
    return { valid: false, message: 'Enter a valid URL (e.g. https://example.com)' };
  }
}

export function validateEmail(value, required = true) {
  const trimmed = (value || '').trim();
  if (!trimmed) {
    return required
      ? { valid: false, message: 'Email is required' }
      : { valid: true, message: '' };
  }
  if (!EMAIL_REGEX.test(trimmed)) {
    return { valid: false, message: 'Enter a valid email address' };
  }
  return { valid: true, normalized: trimmed.toLowerCase(), message: '' };
}

export function validatePhone(value, required = false) {
  const digits = (value || '').replace(/\D/g, '');
  if (!digits) {
    return required
      ? { valid: false, message: 'Phone number is required' }
      : { valid: true, message: '' };
  }
  if (digits.length < 7 || digits.length > 15) {
    return { valid: false, message: 'Phone must be 7–15 digits' };
  }
  return { valid: true, normalized: formatPhoneNumber(value), message: '' };
}

export function formatPhoneNumber(value) {
  if (!value) return '';
  const trimmed = value.trim();
  const hasPlus = trimmed.startsWith('+');
  const digits = trimmed.replace(/\D/g, '');
  if (!digits) return hasPlus ? '+' : '';

  if (hasPlus) {
    const cc = digits.slice(0, Math.min(3, digits.length > 10 ? 2 : 1));
    const rest = digits.slice(cc.length);
    const parts = [];
    if (rest.length > 0) parts.push(rest.slice(0, 3));
    if (rest.length > 3) parts.push(rest.slice(3, 6));
    if (rest.length > 6) parts.push(rest.slice(6, 10));
    if (rest.length > 10) parts.push(rest.slice(10));
    return `+${cc}${parts.length ? ` ${parts.join(' ')}` : ''}`;
  }

  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `${digits.slice(0, 3)} ${digits.slice(3)}`;
  if (digits.length <= 10) {
    return `${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6)}`;
  }
  return `${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6, 10)} ${digits.slice(10)}`;
}

export function validateField(field, value) {
  if (!field.validate) return { valid: true, message: '' };
  const required = field.required === true;
  switch (field.validate) {
    case 'url':
      return validateUrl(value);
    case 'email':
      return validateEmail(value, required);
    case 'phone':
      return validatePhone(value, required);
    default:
      return { valid: true, message: '' };
  }
}

export function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
