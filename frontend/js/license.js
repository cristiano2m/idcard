const STATE_LABELS = {
  active:   { cls: 'alert-success', text: 'Licencia activa' },
  expiring: { cls: 'alert-warning', text: 'Licencia próxima a vencer' },
  expired:  { cls: 'alert-danger',  text: 'Licencia expirada' },
  inactive: { cls: 'alert-danger',  text: 'Sin licencia activa' },
};

function fmtExpiry(expiry) {
  if (!expiry) return '';
  const [y, m, d] = expiry.split('-');
  return `${d}/${m}/${y}`;
}

function showStatus(status) {
  const box = document.getElementById('status-box');
  const label = STATE_LABELS[status.state] || STATE_LABELS.inactive;
  let detail = '';
  if (status.expiry && status.state === 'active') {
    detail = ` — vence el <strong>${fmtExpiry(status.expiry)}</strong> (${status.daysLeft} días restantes)`;
  } else if (status.expiry && status.state === 'expiring') {
    detail = ` — vence el <strong>${fmtExpiry(status.expiry)}</strong>. Quedan <strong>${status.daysLeft}</strong> día(s).`;
  } else if (status.expiry && status.state === 'expired') {
    detail = ` — venció el <strong>${fmtExpiry(status.expiry)}</strong>.`;
  }
  box.className = `alert ${label.cls} mb-4`;
  box.innerHTML = `<strong>${label.text}</strong>${detail}`;
  box.style.display = '';
}

(async () => {
  await requireAuth();
  renderNavbar('license');

  let status;
  try {
    status = await apiGet('/license/status');
  } catch {
    status = { state: 'inactive', expiry: null, daysLeft: null };
  }

  showStatus(status);

  const isAdmin = currentUser?.role === 'Administrador';
  document.getElementById('activate-section').style.display = isAdmin ? '' : 'none';
  document.getElementById('no-access-msg').style.display  = isAdmin ? 'none' : '';

  if (!isAdmin) return;

  document.getElementById('btn-activate').addEventListener('click', async () => {
    const code  = document.getElementById('inp-code').value.trim();
    const errEl = document.getElementById('activate-error');
    errEl.style.display = 'none';

    if (!code) { errEl.textContent = 'Ingresa un código'; errEl.style.display = ''; return; }

    const btn = document.getElementById('btn-activate');
    btn.disabled = true;
    btn.textContent = 'Activando...';

    try {
      const result = await apiPost('/license/activate', { code });
      showStatus(result);
      showSuccess('Licencia activada correctamente');
      document.getElementById('inp-code').value = '';
      // If we were blocked (expired/inactive) the user can now continue
      if (result.state === 'active' || result.state === 'expiring') {
        setTimeout(() => { window.location.href = '/pages/dashboard.html'; }, 1500);
      }
    } catch (err) {
      errEl.textContent = err.message || 'Código inválido';
      errEl.style.display = '';
    } finally {
      btn.disabled = false;
      btn.textContent = 'Activar';
    }
  });

  document.getElementById('inp-code').addEventListener('keydown', e => {
    if (e.key === 'Enter') document.getElementById('btn-activate').click();
  });
})();
