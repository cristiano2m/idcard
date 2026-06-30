function formatDateTime(isoStr) {
  if (!isoStr) return '-';
  const d = new Date(isoStr.replace(' ', 'T'));
  if (isNaN(d.getTime())) return isoStr;
  return d.toLocaleString('es-ES', { dateStyle: 'short', timeStyle: 'short' });
}

function debounce(fn, delay = 350) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}

function qs(name) {
  return new URLSearchParams(window.location.search).get(name);
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str ?? '';
  return div.innerHTML;
}
