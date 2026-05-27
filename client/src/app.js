import { LOGO_MAX_BYTES, TYPE_CONFIG } from './config.js';
import { getFormattedData as buildPayload } from './payload.js';
import {
  validateField,
  formatPhoneNumber,
  formatBytes,
} from './validation.js';
import { generateQr, fetchHistory, saveHistory, clearHistoryApi } from './api.js';

const state = {
  type: 'url',
  viewMode: 'generate',
  data: {},
  fieldErrors: {},
  lastScan: '',
  theme: localStorage.getItem('qr_theme') || 'nebula',
  config: {
    size: 300,
    color: '000000',
    bgcolor: 'ffffff',
    logo: null,
  },
  history: [],
};

let html5QrScanner = null;
let scannerActive = false;

        // --- DOM Elements ---
        const els = {
            typeTabs: document.getElementById('typeTabs'),
            dynamicInputs: document.getElementById('dynamicInputs'),
            formTitle: document.getElementById('formTitle'),
            typeBadge: document.getElementById('typeBadge'),
            qrImage: document.getElementById('qrImage'),
            qrWrapper: document.getElementById('qrPreviewWrapper'),
            logoOverlay: document.getElementById('logoOverlay'),
            placeholder: document.getElementById('qrPlaceholder'),
            loader: document.getElementById('loader'),
            downloadBtn: document.getElementById('downloadBtn'),
            sizeInput: document.getElementById('sizeInput'),
            sizeValue: document.getElementById('sizeValue'),
            colorInput: document.getElementById('colorInput'),
            colorHex: document.getElementById('colorHex'),
            bgInput: document.getElementById('bgColorInput'),
            bgHex: document.getElementById('bgColorHex'),
            logoInput: document.getElementById('logoInput'),
            logoFileName: document.getElementById('logoFileName'),
            removeLogoBtn: document.getElementById('removeLogoBtn'),
            historyList: document.getElementById('historyList'),
            sidebar: document.getElementById('sidebar'),
            backdrop: document.getElementById('mobileBackdrop'),
            html: document.documentElement,
            generateView: document.getElementById('generateView'),
            scanView: document.getElementById('scanView'),
            modeGenerateBtn: document.getElementById('modeGenerateBtn'),
            modeScanBtn: document.getElementById('modeScanBtn'),
            headerTitle: document.getElementById('headerTitle'),
            headerSubtitle: document.getElementById('headerSubtitle'),
            scanResult: document.getElementById('scanResult'),
            scannerStatus: document.getElementById('scannerStatus'),
            scannerToggleBtn: document.getElementById('scannerToggleBtn'),
            copyScanBtn: document.getElementById('copyScanBtn'),
            useScanBtn: document.getElementById('useScanBtn'),
            logoSizeHint: document.getElementById('logoSizeHint')
        };

export async function init() {
  renderTabs();
  renderInputs('url');
  setupEventListeners();

  if (window.matchMedia?.('(prefers-color-scheme: dark)').matches) {
    els.html.classList.add('dark');
  }
  setTheme(state.theme);

  try {
    state.history = await fetchHistory();
    renderHistory();
  } catch {
    state.history = [];
    renderHistory();
  }
}

function setFieldValidationUI(fieldId, result) {
            const input = document.getElementById(`inp_${fieldId}`);
            const errEl = document.getElementById(`err_${fieldId}`);
            if (!input) return;

            input.classList.remove('input-invalid', 'input-valid');
            if (!input.value.trim()) {
                state.fieldErrors[fieldId] = null;
                if (errEl) errEl.classList.add('hidden');
                return;
            }

            if (result.valid) {
                input.classList.add('input-valid');
                state.fieldErrors[fieldId] = null;
                if (errEl) errEl.classList.add('hidden');
            } else {
                input.classList.add('input-invalid');
                state.fieldErrors[fieldId] = result.message;
                if (errEl) {
                    errEl.textContent = result.message;
                    errEl.classList.remove('hidden');
                }
            }
        }

        function validateCurrentForm() {
            const config = TYPE_CONFIG[state.type];
            if (!config) return true;
            let allValid = true;

            config.fields.forEach(field => {
                if (!field.validate) return;
                const value = (state.data[field.id] || '').trim();
                if (!value) {
                    if (field.required) allValid = false;
                    return;
                }
                const result = validateField(field, value);
                setFieldValidationUI(field.id, result);
                if (!result.valid) allValid = false;
            });

            return allValid;
        }

// --- View Mode (Generate / Scan) ---
export function setViewMode(mode) {
            state.viewMode = mode;
            const isGenerate = mode === 'generate';

            els.generateView.classList.toggle('hidden', !isGenerate);
            els.scanView.classList.toggle('hidden', isGenerate);

            els.modeGenerateBtn.className = 'mode-btn ' + (isGenerate ? 'mode-btn--active-create' : 'mode-btn--inactive');
            els.modeScanBtn.className = 'mode-btn ' + (!isGenerate ? 'mode-btn--active-scan' : 'mode-btn--inactive');

            els.headerTitle.textContent = isGenerate ? 'Dashboard' : 'QR Scanner';
            els.headerSubtitle.textContent = isGenerate ? 'Design & Generate' : 'Read codes with your camera';

            if (isGenerate && scannerActive) stopScanner();
        }

        // --- QR Scanner ---
        function onScanSuccess(decodedText) {
            if (!decodedText || decodedText === state.lastScan) return;
            state.lastScan = decodedText;
            els.scanResult.textContent = decodedText;
            els.scanResult.classList.remove('text-gray-400');
            els.scanResult.classList.add('text-gray-800', 'dark:text-gray-100');
            els.copyScanBtn.disabled = false;
            els.useScanBtn.disabled = false;
            els.scannerStatus.textContent = 'Detected';
            els.scannerStatus.className = 'text-[10px] md:text-xs bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300 px-2 py-1 rounded-md font-medium';
            showToast('Scanned', 'QR code decoded successfully');
        }

        // Responsive qrbox: never exceeds 80% of the viewfinder, capped at 250px
        function qrboxFn(viewfinderWidth, viewfinderHeight) {
            const size = Math.min(Math.floor(Math.min(viewfinderWidth, viewfinderHeight) * 0.8), 250);
            return { width: size, height: size };
        }

        async function startScannerWithConstraint(constraint) {
            html5QrScanner = new Html5Qrcode('qr-reader');
            await html5QrScanner.start(
                constraint,
                { fps: 10, qrbox: qrboxFn },
                onScanSuccess,
                () => {}
            );
        }

        export async function toggleScanner() {
            if (scannerActive) {
                stopScanner();
                return;
            }
            if (typeof Html5Qrcode === 'undefined') {
                showToast('Scanner unavailable', 'Could not load scanner library', true);
                return;
            }
            try {
                els.scannerStatus.textContent = 'Starting…';
                try {
                    // Prefer rear camera; falls back to any camera on desktop/front-only devices
                    await startScannerWithConstraint({ facingMode: 'environment' });
                } catch (constraintErr) {
                    console.warn('Rear camera unavailable, trying default camera:', constraintErr);
                    await startScannerWithConstraint({ facingMode: 'user' });
                }
                scannerActive = true;
                els.scannerToggleBtn.innerHTML = '<i class="fa-solid fa-stop mr-1"></i> Stop Camera';
                els.scannerStatus.textContent = 'Scanning';
                els.scannerStatus.className = 'text-[10px] md:text-xs bg-brand-100 text-brand-700 dark:bg-brand-900/40 dark:text-brand-300 px-2 py-1 rounded-md font-medium';
            } catch (err) {
                console.error(err);
                showToast('Camera error', 'Allow camera access or try another device', true);
                els.scannerStatus.textContent = 'Error';
                stopScanner();
            }
        }

        async function stopScanner() {
            if (html5QrScanner && scannerActive) {
                try {
                    await html5QrScanner.stop();
                    html5QrScanner.clear(); // clear only after a successful stop
                } catch (e) { /* already stopped */ }
            }
            html5QrScanner = null;
            scannerActive = false;
            els.scannerToggleBtn.innerHTML = '<i class="fa-solid fa-play mr-1"></i> Start Camera';
            if (state.viewMode === 'scan' && els.scannerStatus.textContent !== 'Detected') {
                els.scannerStatus.textContent = 'Ready';
                els.scannerStatus.className = 'text-[10px] md:text-xs bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300 px-2 py-1 rounded-md font-medium';
            }
        }

        export function copyScanResult() {
            if (!state.lastScan) return;
            navigator.clipboard.writeText(state.lastScan).then(() => {
                showToast('Copied', 'Scan result copied to clipboard');
            }).catch(() => showToast('Copy failed', 'Could not access clipboard', true));
        }

        export function useScanInGenerator() {
            if (!state.lastScan) return;
            const text = state.lastScan;
            setViewMode('generate');

            if (/^https?:\/\//i.test(text) || /^www\./i.test(text)) {
                switchType('url');
                setInputValue('url', text);
            } else if (text.startsWith('mailto:')) {
                switchType('email');
                try {
                    const mail = text.replace(/^mailto:/i, '');
                    const [addr, query] = mail.split('?');
                    const params = new URLSearchParams(query || '');
                    setInputValue('email_to', decodeURIComponent(addr));
                    setInputValue('email_sub', decodeURIComponent(params.get('subject') || ''));
                    setInputValue('email_body', decodeURIComponent(params.get('body') || ''));
                } catch {
                    setInputValue('email_to', text.replace(/^mailto:/i, ''));
                }
            } else if (text.startsWith('BEGIN:VCARD')) {
                switchType('vcard');
                const get = (key) => {
                    const m = text.match(new RegExp(`^${key}:(.+)$`, 'm'));
                    return m ? m[1].trim() : '';
                };
                const name = get('FN') || get('N');
                const parts = name.split(/\s+/);
                setInputValue('fname', parts[0] || '');
                setInputValue('lname', parts.slice(1).join(' ') || '');
                setInputValue('phone', get('TEL'));
                setInputValue('email', get('EMAIL'));
                setInputValue('org', get('ORG'));
            } else if (text.startsWith('WIFI:')) {
                switchType('wifi');
                const ssid = text.match(/S:([^;]*)/);
                const pass = text.match(/P:([^;]*)/);
                setInputValue('ssid', ssid ? ssid[1] : '');
                setInputValue('password', pass ? pass[1] : '');
            } else {
                switchType('text');
                setInputValue('plain_text', text);
            }
            showToast('Loaded', 'Scan content applied to generator');
            debouncedGenerate();
        }

        function setInputValue(fieldId, value) {
            const input = document.getElementById(`inp_${fieldId}`);
            if (!input) return;
            input.value = value || '';
            state.data[fieldId] = input.value;
            const field = TYPE_CONFIG[state.type]?.fields.find(f => f.id === fieldId);
            if (field) {
                const result = validateField(field, input.value);
                setFieldValidationUI(fieldId, result);
            }
        }

        // --- Theme Engine ---
        export function setTheme(themeName) {
            state.theme = themeName;
            localStorage.setItem('qr_theme', themeName);
            ['bg-nebula', 'bg-grid', 'bg-sunset', 'bg-arctic'].forEach(id => {
                document.getElementById(id).classList.add('opacity-0');
            });
            const activeBg = document.getElementById(`bg-${themeName}`);
            if(activeBg) activeBg.classList.remove('opacity-0');
        }

        export function toggleDarkMode() {
            els.html.classList.toggle('dark');
        }

        // --- Responsive Sidebar ---
        export function toggleSidebar() {
            const isClosed = els.sidebar.classList.contains('-translate-x-full');
            if (isClosed) {
                // Open
                els.sidebar.classList.remove('-translate-x-full');
                els.backdrop.classList.remove('hidden');
                setTimeout(() => els.backdrop.classList.remove('opacity-0'), 10);
            } else {
                // Close
                els.sidebar.classList.add('-translate-x-full');
                els.backdrop.classList.add('opacity-0');
                setTimeout(() => els.backdrop.classList.add('hidden'), 300);
            }
        }

        function setupEventListeners() {
            els.sizeInput.addEventListener('input', (e) => {
                state.config.size = e.target.value;
                els.sizeValue.innerText = `${state.config.size}px`;
                debouncedGenerate();
            });

            els.colorInput.addEventListener('input', (e) => {
                state.config.color = e.target.value.replace('#', '');
                els.colorHex.value = e.target.value.toUpperCase();
                debouncedGenerate();
            });

            els.bgInput.addEventListener('input', (e) => {
                state.config.bgcolor = e.target.value.replace('#', '');
                els.bgHex.value = e.target.value.toUpperCase();
                debouncedGenerate();
            });

            els.logoInput.addEventListener('change', handleLogoUpload);
        }

        // --- Dynamic UI Generation ---
        function renderTabs() {
            els.typeTabs.innerHTML = Object.keys(TYPE_CONFIG).map(key => {
                const conf = TYPE_CONFIG[key];
                return `
                    <button onclick="switchType('${key}')" 
                        class="tab-btn flex-shrink-0 flex items-center gap-2 px-3 md:px-4 py-2 rounded-lg text-sm font-medium transition-all ${state.type === key ? 'bg-brand-500 text-white shadow-md' : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700'}">
                        <i class="fa-solid ${conf.icon}"></i> ${conf.label}
                    </button>
                `;
            }).join('');
        }

        export function switchType(type) {
            state.type = type;
            state.data = {};
            state.fieldErrors = {};
            renderTabs();
            renderInputs(type);
            showPlaceholder();
        }

        function renderInputs(type) {
            const config = TYPE_CONFIG[type];
            els.formTitle.innerHTML = `<i class="fa-solid ${config.icon} text-brand-500"></i> ${config.label}`;
            els.typeBadge.innerText = type.toUpperCase();

            els.dynamicInputs.innerHTML = config.fields.map(field => {
                const widthClass = field.width === 'half' ? 'col-span-1' : 'col-span-2';
                let inputHtml = '';
                
                const baseClass = "w-full px-4 py-3 rounded-xl border border-gray-200/60 dark:border-gray-600/60 bg-white/40 dark:bg-black/20 text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none transition-all backdrop-blur-sm";

                if (field.type === 'textarea') {
                    inputHtml = `<textarea id="inp_${field.id}" rows="3" class="${baseClass} resize-none" placeholder="${field.placeholder}"></textarea>`;
                } else if (field.type === 'select') {
                    inputHtml = `
                        <select id="inp_${field.id}" class="${baseClass}">
                            ${field.options.map(opt => `<option value="${opt}">${opt}</option>`).join('')}
                        </select>`;
                } else {
                    inputHtml = `<input type="${field.type}" id="inp_${field.id}" class="${baseClass}" placeholder="${field.placeholder}">`;
                }

                return `
                    <div class="${widthClass}">
                        <label class="block text-xs font-bold text-gray-500 mb-1 ml-1 uppercase tracking-wide">${field.label}</label>
                        ${inputHtml}
                        ${field.validate ? `<p id="err_${field.id}" class="field-error hidden" role="alert"></p>` : ''}
                    </div>
                `;
            }).join('');

            if (config.fields.some(f => f.width === 'half')) {
                els.dynamicInputs.className = 'grid grid-cols-2 gap-3 md:gap-4';
            } else {
                els.dynamicInputs.className = 'space-y-3 md:space-y-4';
            }

            config.fields.forEach(field => {
                const input = document.getElementById(`inp_${field.id}`);
                input.addEventListener('input', (e) => {
                    let value = e.target.value;
                    if (field.validate === 'phone') {
                        const formatted = formatPhoneNumber(value);
                        if (formatted !== value) {
                            const pos = input.selectionStart;
                            input.value = formatted;
                            value = formatted;
                            try { input.setSelectionRange(pos, pos); } catch (_) {}
                        }
                    }
                    state.data[field.id] = value;
                    if (field.validate) {
                        const result = validateField(field, value);
                        if (result.valid && result.normalized !== undefined && field.validate === 'url') {
                            state.data[field.id] = result.normalized;
                        }
                        if (result.valid && result.normalized !== undefined && field.validate === 'email') {
                            state.data[field.id] = result.normalized;
                        }
                        setFieldValidationUI(field.id, result);
                    }
                    debouncedGenerate();
                });
                input.addEventListener('blur', () => {
                    if (!field.validate) return;
                    const result = validateField(field, input.value);
                    setFieldValidationUI(field.id, result);
                });
            });
        }

        // --- Logic: Data Formatting ---
function getFormattedData() {
  return buildPayload(state.type, state.data);
}

        // --- QR Generation ---
        let generateTimeout;
        function debouncedGenerate() {
            clearTimeout(generateTimeout);
            generateTimeout = setTimeout(generateQR, 600);
        }

async function generateQR() {
  if (!validateCurrentForm()) {
    showPlaceholder();
    return;
  }

  const dataString = getFormattedData();
  if (!dataString || dataString.length < 2) {
    showPlaceholder();
    return;
  }

  els.loader.classList.remove('hidden');

  try {
    const { image } = await generateQr({
      type: state.type,
      data: state.data,
      size: state.config.size,
      color: state.config.color,
      bgcolor: state.config.bgcolor,
      hasLogo: !!state.config.logo,
    });

    els.qrImage.src = image;
    els.qrImage.classList.remove('hidden');
    els.placeholder.classList.add('hidden');
    els.loader.classList.add('hidden');
    els.downloadBtn.disabled = false;
    await addToHistory(state.type, dataString);
  } catch (err) {
    console.error(err);
    showToast('Generation failed', err.message || 'Could not generate QR', true);
    els.loader.classList.add('hidden');
  }
}

        function showPlaceholder() {
            els.qrImage.classList.add('hidden');
            els.placeholder.classList.remove('hidden');
            els.downloadBtn.disabled = true;
        }

        // --- Logo Handling ---
        function handleLogoUpload(e) {
            const file = e.target.files[0];
            if (!file) return;

            const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/gif'];
            if (!allowedTypes.includes(file.type)) {
                showToast('Invalid file', 'Use PNG, JPG, WebP, or GIF', true);
                e.target.value = '';
                return;
            }

            if (file.size > LOGO_MAX_BYTES) {
                showToast('File too large', `Logo must be under ${formatBytes(LOGO_MAX_BYTES)} (selected: ${formatBytes(file.size)})`, true);
                e.target.value = '';
                if (els.logoSizeHint) {
                    els.logoSizeHint.textContent = `Max size: ${formatBytes(LOGO_MAX_BYTES)}`;
                    els.logoSizeHint.classList.remove('hidden');
                    els.logoSizeHint.classList.add('text-red-500');
                }
                return;
            }

            if (els.logoSizeHint) {
                els.logoSizeHint.textContent = formatBytes(file.size);
                els.logoSizeHint.classList.remove('hidden', 'text-red-500');
                els.logoSizeHint.classList.add('text-gray-400');
            }

            const reader = new FileReader();
            reader.onload = (event) => {
                state.config.logo = event.target.result;
                els.logoOverlay.src = state.config.logo;
                els.logoOverlay.classList.remove('hidden');
                els.logoFileName.innerText = file.name.substring(0, 15) + (file.name.length > 15 ? '...' : '');
                els.removeLogoBtn.classList.remove('hidden');
                debouncedGenerate();
            };
            reader.readAsDataURL(file);
        }

        export function removeLogo() {
            state.config.logo = null;
            els.logoInput.value = '';
            els.logoOverlay.classList.add('hidden');
            els.logoFileName.innerText = 'Upload PNG/JPG';
            els.removeLogoBtn.classList.add('hidden');
            if (els.logoSizeHint) {
                els.logoSizeHint.classList.add('hidden');
                els.logoSizeHint.textContent = '';
            }
            debouncedGenerate();
        }

        // --- Download Logic ---
export function downloadQR() {
            const btn = els.downloadBtn;
            const originalText = btn.innerHTML;
            btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Processing...';
            
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            const size = parseInt(state.config.size);
            canvas.width = size;
            canvas.height = size;

            const qrImg = new Image();
            qrImg.crossOrigin = "Anonymous";
            qrImg.src = els.qrImage.src;
            
            qrImg.onload = () => {
                ctx.drawImage(qrImg, 0, 0, size, size);
                if (state.config.logo) {
                    const logoImg = new Image();
                    logoImg.src = state.config.logo;
                    logoImg.onload = () => {
                        const logoSize = size * 0.22;
                        const center = (size - logoSize) / 2;
                        ctx.fillStyle = "#ffffff";
                        ctx.fillRect(center - 2, center - 2, logoSize + 4, logoSize + 4);
                        ctx.drawImage(logoImg, center, center, logoSize, logoSize);
                        triggerDownload(canvas);
                    };
                } else {
                    triggerDownload(canvas);
                }
            };
            
            function triggerDownload(c) {
                const link = document.createElement('a');
                link.download = `qr-toolkit-${state.type}-${Date.now()}.png`;
                link.href = c.toDataURL('image/png');
                link.click();
                btn.innerHTML = originalText;
                showToast('Success', 'QR Code saved to device');
            }
        }

        // --- History ---
async function addToHistory(type, data) {
  try {
    state.history = await saveHistory(type, data);
    renderHistory();
  } catch (err) {
    console.error('History save failed', err);
  }
}

        function renderHistory() {
            els.historyList.innerHTML = state.history.length ? '' : '<div class="text-center text-gray-400 py-10 text-xs">No history yet</div>';
            state.history.forEach(item => {
                const config = TYPE_CONFIG[item.type] || TYPE_CONFIG['text'];
                const div = document.createElement('div');
                div.className = 'group p-3 glass-panel bg-white/50 dark:bg-gray-800/50 rounded-lg border border-gray-100 dark:border-gray-700 hover:border-brand-500 cursor-pointer transition-all active:scale-95';
                div.innerHTML = `
                    <div class="flex items-center gap-3">
                        <div class="w-8 h-8 rounded-full bg-brand-100 dark:bg-brand-900/50 flex items-center justify-center text-brand-600 dark:text-brand-400">
                            <i class="fa-solid ${config.icon} text-xs"></i>
                        </div>
                        <div class="flex-1 min-w-0">
                            <p class="text-xs font-bold text-gray-700 dark:text-gray-200 truncate">${item.type.toUpperCase()}</p>
                            <p class="text-[10px] text-gray-400 truncate">${item.data}</p>
                        </div>
                    </div>
                `;
                els.historyList.appendChild(div);
            });
        }
        
export async function clearHistory() {
  try {
    state.history = await clearHistoryApi();
  } catch {
    state.history = [];
  }
  renderHistory();
  showToast('Cleared', 'History removed');
}

        function showToast(title, msg, isError = false) {
            const t = document.getElementById('toast');
            document.getElementById('toastTitle').innerText = title;
            document.getElementById('toastMsg').innerText = msg;
            document.getElementById('toastIcon').className = `w-6 h-6 rounded-full flex items-center justify-center ${isError ? 'bg-red-500/20 text-red-500' : 'bg-green-500/20 text-green-500'} text-xs`;
            document.getElementById('toastIcon').innerHTML = `<i class="fa-solid ${isError ? 'fa-exclamation' : 'fa-check'}"></i>`;
            t.classList.remove('translate-y-24', 'opacity-0');
            setTimeout(() => t.classList.add('translate-y-24', 'opacity-0'), 3000);
        }

