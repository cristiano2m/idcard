let dataModificados = [];
let dataImpresos    = [];

const sortState = {
  mod: { col: 'updated_at', dir: 'DESC' },
  imp: { col: 'printed_at', dir: 'DESC' },
};

function fmtDate(iso) {
  if (!iso) return '-';
  const d = new Date(iso.includes('T') ? iso : iso.replace(' ', 'T'));
  if (isNaN(d)) return iso.slice(0, 16);
  return d.toLocaleDateString('es', { day: '2-digit', month: 'short', year: 'numeric' }) +
    ' ' + d.toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' });
}

function sortData(arr, col, dir) {
  return [...arr].sort((a, b) => {
    let va = col === 'nombre' ? `${a.nombre} ${a.apellido}` : (a[col] || '');
    let vb = col === 'nombre' ? `${b.nombre} ${b.apellido}` : (b[col] || '');
    if (va < vb) return dir === 'ASC' ? -1 : 1;
    if (va > vb) return dir === 'ASC' ?  1 : -1;
    return 0;
  });
}

function updateSortIcons(table) {
  const { col, dir } = sortState[table];
  document.querySelectorAll(`.sort-th[data-table="${table}"]`).forEach(th => {
    const icon = th.querySelector('.sort-icon');
    const isActive = th.dataset.col === col;
    icon.textContent = isActive ? (dir === 'ASC' ? '▲' : '▼') : '⇅';
    th.classList.toggle('active', isActive);
  });
}

function renderMod() {
  const { col, dir } = sortState.mod;
  const rows = sortData(dataModificados, col, dir);

  document.getElementById('badge-mod').textContent = rows.length;
  document.getElementById('tbody-mod').innerHTML = rows.map(r => `
    <tr class="row-mod">
      <td>${escapeHtml(r.nombre || '')} ${escapeHtml(r.apellido || '')}</td>
      <td>${escapeHtml(r.equipo || '-')}</td>
      <td class="text-center">${r.numero_camiseta != null ? r.numero_camiseta : '-'}</td>
      <td>${fmtDate(r.updated_at)}</td>
      <td class="text-end">
        <button class="btn btn-success btn-sm btn-impreso" data-id="${r.id}">Impreso</button>
      </td>
    </tr>
  `).join('') || '<tr><td colspan="5" class="text-center text-muted py-4">Sin registros modificados</td></tr>';

  document.querySelectorAll('.btn-impreso').forEach(btn => {
    btn.addEventListener('click', async () => {
      btn.disabled = true;
      try {
        await apiPost(`/mdb-updates/${btn.dataset.id}/impreso`, {});
        await loadBoard();
      } catch (err) {
        showError(err.message);
        btn.disabled = false;
      }
    });
  });

  updateSortIcons('mod');
}

function renderImp() {
  const { col, dir } = sortState.imp;
  const rows = sortData(dataImpresos, col, dir);

  document.getElementById('badge-imp').textContent = rows.length;
  document.getElementById('tbody-imp').innerHTML = rows.map(r => `
    <tr>
      <td>${escapeHtml(r.nombre || '')} ${escapeHtml(r.apellido || '')}</td>
      <td>${escapeHtml(r.equipo || '-')}</td>
      <td class="text-center">${r.numero_camiseta != null ? r.numero_camiseta : '-'}</td>
      <td class="text-muted small">${fmtDate(r.updated_at)}</td>
      <td>${fmtDate(r.printed_at)}</td>
    </tr>
  `).join('') || '<tr><td colspan="5" class="text-center text-muted py-4">Sin registros impresos</td></tr>';

  updateSortIcons('imp');
}

async function loadBoard() {
  const fecha = document.getElementById('f-fecha').value;
  const params = fecha ? `?fecha=${fecha}` : '';
  const { modificados, impresos } = await apiGet(`/mdb-updates${params}`);
  dataModificados = modificados;
  dataImpresos    = impresos;
  renderMod();
  renderImp();
  const now = new Date();
  document.getElementById('last-updated').textContent =
    `Actualizado ${now.toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}`;
}

// Sort click handlers
document.querySelectorAll('.sort-th').forEach(th => {
  th.addEventListener('click', () => {
    const table = th.dataset.table;
    const col   = th.dataset.col;
    if (sortState[table].col === col) {
      sortState[table].dir = sortState[table].dir === 'ASC' ? 'DESC' : 'ASC';
    } else {
      sortState[table].col = col;
      sortState[table].dir = 'ASC';
    }
    table === 'mod' ? renderMod() : renderImp();
  });
});

document.getElementById('f-fecha').addEventListener('change', () => {
  loadBoard().catch(err => showError(err.message));
});

document.getElementById('btn-all-dates').addEventListener('click', () => {
  document.getElementById('f-fecha').value = '';
  loadBoard().catch(err => showError(err.message));
});

document.getElementById('btn-refresh').addEventListener('click', () => {
  loadBoard().catch(err => showError(err.message));
});

(async () => {
  await requireAuth();
  renderNavbar('updates-board');
  const hoy = new Date().toISOString().split('T')[0];
  document.getElementById('f-fecha').value = hoy;
  try { await loadBoard(); } catch (err) { showError(err.message); }
  setInterval(() => loadBoard().catch(() => {}), 30_000);
})();
