import {
  init,
  setViewMode,
  toggleScanner,
  copyScanResult,
  useScanInGenerator,
  setTheme,
  toggleDarkMode,
  toggleSidebar,
  switchType,
  removeLogo,
  downloadQR,
  clearHistory,
} from './app.js';

Object.assign(window, {
  setViewMode,
  toggleScanner,
  copyScanResult,
  useScanInGenerator,
  setTheme,
  toggleDarkMode,
  toggleSidebar,
  switchType,
  removeLogo,
  downloadQR,
  clearHistory,
});

init();
