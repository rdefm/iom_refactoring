// ============================================================
// INIT
// ============================================================

renderGame();

// PWA service worker — network-first, so updates land on next load
if ('serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost')) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('sw.js').catch(() => {});
  });
}
