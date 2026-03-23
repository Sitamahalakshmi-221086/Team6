(function (global) {
  const API_BASE =
    typeof global.CAMPUS_API_BASE === 'string' && global.CAMPUS_API_BASE
      ? global.CAMPUS_API_BASE.replace(/\/$/, '')
      : 'http://127.0.0.1:5000';

  function showEmpty(container, message) {
    if (!container) return;
    container.innerHTML = `<p class="empty-state">${message}</p>`;
  }

  global.CAMPUS_API_BASE = API_BASE;
  global.showEmpty = showEmpty;
})(typeof window !== 'undefined' ? window : globalThis);
