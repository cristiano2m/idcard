let currentPage = 1;
const pageSize = 20;

function badgeForEstado(estado) {
  const cls = estado === 'Impreso' ? 'success' : estado === 'Cancelado' ? 'danger' : 'warning';
  return `<span class="badge bg-${cls}">${estado}</span>`;
}

async function loadRecords() {
  const nombre = document.getElementById('f-nombre').value.trim();
  const params = new URLSearchParams({ page: currentPage, pageSize });
  if (nombre) params.set('nombre', nombre);

  const { items, total, mdbPath, tableName } = await apiGet(`/mdb/records?${params.toString()}`);

  document.getElementById('mdb-source-info').textContent = `Fuente: ${mdbPath} (tabla ${tableName})`;

  const tbody = document.getElementById('mdb-table-body');
  tbody.innerHTML = items.map(r => `
    <tr>
      <td>${r.recordId}</td>
      <td>${escapeHtml(r.nombre)} ${escapeHtml(r.apellido)}</td>
      <td>${escapeHtml(r.equipo || '-')}</td>
      <td>${escapeHtml(r.documentoId || '-')}</td>
      <td>${escapeHtml(r.fechaNacimiento || '-')}</td>
      <td>${badgeForEstado(r.estado)}</td>
    </tr>
  `).join('') || '<tr><td colspan="6" class="text-center text-muted">Sin resultados</td></tr>';

  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  document.getElementById('pagination-info').textContent = `Página ${currentPage} de ${totalPages} (${total} registros en el MDB)`;
  document.getElementById('btn-prev').disabled = currentPage <= 1;
  document.getElementById('btn-next').disabled = currentPage >= totalPages;
}

const debouncedReload = debounce(() => { currentPage = 1; loadRecords().catch(err => showError(err.message)); });
document.getElementById('f-nombre').addEventListener('input', debouncedReload);
document.getElementById('btn-prev').addEventListener('click', () => { currentPage--; loadRecords(); });
document.getElementById('btn-next').addEventListener('click', () => { currentPage++; loadRecords(); });

(async () => {
  await requireAuth();
  renderNavbar('admin-settings');
  if (!hasRole('Administrador')) {
    document.body.innerHTML = '<div class="container mt-5"><div class="alert alert-danger">No tienes permisos para ver esta página.</div></div>';
    return;
  }
  try { await loadRecords(); } catch (err) { showError(err.message); }
})();
