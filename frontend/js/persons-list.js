let currentPage = 1;
const pageSize = 20;
let sortBy = 'fecha';
let sortDir = 'DESC';

function badgeForEstado(estado) {
  const cls = estado === 'Impreso' ? 'success' : estado === 'Cancelado' ? 'danger' : 'warning';
  return `<span class="badge bg-${cls}">${estado}</span>`;
}

function getFilters() {
  return {
    nombre: document.getElementById('f-nombre').value.trim(),
    equipo: document.getElementById('f-equipo').value.trim(),
    documentoId: document.getElementById('f-documento').value.trim(),
    estado: document.getElementById('f-estado').value,
    fechaDesde: document.getElementById('f-fecha').value,
  };
}

function updateSortIcons() {
  document.querySelectorAll('th.sortable').forEach(th => {
    const icon = th.querySelector('.sort-icon');
    if (th.dataset.col === sortBy) {
      icon.textContent = sortDir === 'ASC' ? ' ▲' : ' ▼';
      th.classList.add('text-primary');
    } else {
      icon.textContent = ' ⇅';
      th.classList.remove('text-primary');
    }
  });
}

async function loadPersons() {
  const filters = getFilters();
  const params = new URLSearchParams({ page: currentPage, pageSize, sortBy, sortDir, ...filters });
  for (const [k, v] of [...params.entries()]) if (!v) params.delete(k);

  const { items, total } = await apiGet(`/persons/search?${params.toString()}`);

  const tbody = document.getElementById('persons-table-body');
  tbody.innerHTML = items.map(p => `
    <tr>
      <td>${escapeHtml(p.nombre)} ${escapeHtml(p.apellido)}</td>
      <td>${escapeHtml(p.equipo)}</td>
      <td>${escapeHtml(p.documentoId)}</td>
      <td>${p.numeroCamiseta ?? '-'}</td>
      <td>${badgeForEstado(p.estado)}</td>
      <td>${formatDateTime(p.createdAt)}</td>
      <td class="table-actions">
        <a class="btn btn-sm btn-outline-primary" href="/pages/person-detail.html?id=${p.id}">Ver</a>
        <a class="btn btn-sm btn-outline-secondary" href="/pages/person-form.html?id=${p.id}">Editar</a>
      </td>
    </tr>
  `).join('') || '<tr><td colspan="7" class="text-center text-muted">Sin resultados</td></tr>';

  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  document.getElementById('pagination-info').textContent = `Página ${currentPage} de ${totalPages} (${total} registros)`;
  document.getElementById('btn-prev').disabled = currentPage <= 1;
  document.getElementById('btn-next').disabled = currentPage >= totalPages;

  updateSortIcons();
}

const debouncedReload = debounce(() => { currentPage = 1; loadPersons().catch(err => showError(err.message)); });

['f-nombre', 'f-equipo', 'f-documento', 'f-estado', 'f-fecha'].forEach(id => {
  document.getElementById(id).addEventListener('input', debouncedReload);
  document.getElementById(id).addEventListener('change', debouncedReload);
});

document.querySelectorAll('th.sortable').forEach(th => {
  th.addEventListener('click', () => {
    if (sortBy === th.dataset.col) {
      sortDir = sortDir === 'ASC' ? 'DESC' : 'ASC';
    } else {
      sortBy = th.dataset.col;
      sortDir = 'ASC';
    }
    currentPage = 1;
    loadPersons().catch(err => showError(err.message));
  });
});

document.getElementById('btn-prev').addEventListener('click', () => { currentPage--; loadPersons(); });
document.getElementById('btn-next').addEventListener('click', () => { currentPage++; loadPersons(); });

(async () => {
  await requireAuth();
  renderNavbar('persons');
  try { await loadPersons(); } catch (err) { showError(err.message); }
})();
