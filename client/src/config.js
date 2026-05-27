export const LOGO_MAX_BYTES = 2 * 1024 * 1024;

export const TYPE_CONFIG = {
  url: {
    icon: 'fa-link',
    label: 'Link / URL',
    fields: [
      { id: 'url', type: 'url', placeholder: 'https://example.com', label: 'Website URL', validate: 'url', required: true },
    ],
  },
  wifi: {
    icon: 'fa-wifi',
    label: 'WiFi',
    fields: [
      { id: 'ssid', type: 'text', placeholder: 'Network Name', label: 'Network Name (SSID)' },
      { id: 'password', type: 'text', placeholder: 'Password', label: 'Password' },
      { id: 'encryption', type: 'select', label: 'Security', options: ['WPA/WPA2', 'WEP', 'nopass'] },
    ],
  },
  vcard: {
    icon: 'fa-address-card',
    label: 'Contact',
    fields: [
      { id: 'fname', type: 'text', placeholder: 'John', label: 'First Name', width: 'half' },
      { id: 'lname', type: 'text', placeholder: 'Doe', label: 'Last Name', width: 'half' },
      { id: 'phone', type: 'tel', placeholder: '+1 234 567 890', label: 'Phone', validate: 'phone' },
      { id: 'email', type: 'email', placeholder: 'john@example.com', label: 'Email', validate: 'email' },
      { id: 'org', type: 'text', placeholder: 'Company Inc.', label: 'Organization' },
    ],
  },
  email: {
    icon: 'fa-envelope',
    label: 'Email',
    fields: [
      { id: 'email_to', type: 'email', placeholder: 'recipient@example.com', label: 'Recipient', validate: 'email', required: true },
      { id: 'email_sub', type: 'text', placeholder: 'Subject Line', label: 'Subject' },
      { id: 'email_body', type: 'textarea', placeholder: 'Message body...', label: 'Message' },
    ],
  },
  text: {
    icon: 'fa-align-left',
    label: 'Plain Text',
    fields: [
      { id: 'plain_text', type: 'textarea', placeholder: 'Enter your text here...', label: 'Content' },
    ],
  },
};
