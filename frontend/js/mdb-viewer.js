let currentPage = 1;
const pageSize = 33;
let sortBy = 'recordId';
let sortDir = 'ASC';
let editModal = null;
let editingRecordId = null;
const rowCache = {}; // recordId → item, evita rellamar al MDB al abrir el modal

function badgeForEstado(estado) {
  const cls = estado === 'Impreso' ? 'success' : estado === 'Cancelado' ? 'danger' : 'warning';
  return `<span class="badge bg-${cls}">${estado}</span>`;
}

function isoToDate(isoStr) {
  if (!isoStr) return '';
  return String(isoStr).split('T')[0];
}

function formatFechaNac(val) {
  const d = isoToDate(val);
  if (!d || d === '1970-01-01') return '-';
  return d;
}

function updateSortIcons() {
  document.querySelectorAll('th.sortable').forEach(th => {
    const icon = th.querySelector('.sort-icon');
    if (th.dataset.col === sortBy) {
      icon.textContent = sortDir === 'ASC' ? '▲' : '▼';
      th.classList.add('text-primary');
    } else {
      icon.textContent = '⇅';
      th.classList.remove('text-primary');
    }
  });
}

async function loadRecords() {
  const nombre = document.getElementById('f-nombre').value.trim();
  const equipo = document.getElementById('f-equipo').value.trim();
  const params = new URLSearchParams({ page: currentPage, pageSize, sortBy, sortDir });
  if (nombre) params.set('nombre', nombre);
  if (equipo) params.set('equipo', equipo);

  const { items, total, mdbPath, tableName } = await apiGet(`/mdb/records?${params.toString()}`);
  items.forEach(r => { rowCache[r.recordId] = r; });

  document.getElementById('mdb-source-info').textContent = `Fuente: ${mdbPath} | Tabla: ${tableName}`;

  const tbody = document.getElementById('mdb-table-body');
  tbody.innerHTML = items.map(r => `
    <tr>
      <td>${r.recordId}</td>
      <td>${escapeHtml(r.nombre)} ${escapeHtml(r.apellido)}</td>
      <td>${escapeHtml(r.equipo || '-')}</td>
      <td>${r.numeroCamiseta != null ? r.numeroCamiseta : '-'}</td>
      <td>${formatFechaNac(r.fechaNacimiento)}</td>
      <td>${badgeForEstado(r.estado)}</td>
      <td>
        <button class="btn btn-sm btn-outline-primary btn-edit" data-id="${r.recordId}">Editar</button>
      </td>
    </tr>
  `).join('') || '<tr><td colspan="7" class="text-center text-muted">Sin resultados</td></tr>';

  document.querySelectorAll('.btn-edit').forEach(btn => {
    btn.addEventListener('click', () => openEditModal(Number(btn.dataset.id)));
  });

  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  document.getElementById('pagination-info').textContent = `Página ${currentPage} de ${totalPages} (${total} registros en el MDB)`;
  document.getElementById('btn-prev').disabled = currentPage <= 1;
  document.getElementById('btn-next').disabled = currentPage >= totalPages;
  updateSortIcons();
}

function openEditModal(recordId) {
  const r = rowCache[recordId];
  if (!r) { showError('Registro no encontrado en caché, recarga la página'); return; }

  editingRecordId = recordId;
  document.getElementById('edit-record-id').textContent = `#${recordId}`;
  document.getElementById('edit-first-name').value = r.nombre || '';
  document.getElementById('edit-last-name').value  = r.apellido || '';
  document.getElementById('edit-team-name').value  = r.equipo || '';
  document.getElementById('edit-shirt').value      = r.numeroCamiseta != null ? r.numeroCamiseta : '';
  const dob = isoToDate(r.fechaNacimiento);
  document.getElementById('edit-dob').value        = (dob && dob !== '1970-01-01') ? dob : '';

  editModal.show();
}

async function saveEdit() {
  if (!editingRecordId) return;

  const firstName = document.getElementById('edit-first-name').value.trim();
  const lastName  = document.getElementById('edit-last-name').value.trim();
  if (!firstName || !lastName) {
    showError('Nombre y apellido son requeridos');
    return;
  }

  const body = {
    FIRST_NAME: firstName,
    LAST_NAME:  lastName,
    TEAM_NAME:  document.getElementById('edit-team-name').value.trim(),
    SHIRT_:     document.getElementById('edit-shirt').value !== '' ? Number(document.getElementById('edit-shirt').value) : 0,
    D_O_B_:     document.getElementById('edit-dob').value || null,
  };

  const btn = document.getElementById('btn-save-edit');
  btn.disabled = true;
  btn.textContent = 'Guardando...';

  try {
    await apiPut(`/mdb/records/${editingRecordId}`, body);

    // Actualizar caché
    if (rowCache[editingRecordId]) {
      rowCache[editingRecordId].nombre         = body.FIRST_NAME;
      rowCache[editingRecordId].apellido        = body.LAST_NAME;
      rowCache[editingRecordId].equipo          = body.TEAM_NAME;
      rowCache[editingRecordId].numeroCamiseta  = body.SHIRT_;
      rowCache[editingRecordId].fechaNacimiento = body.D_O_B_ ? body.D_O_B_ + 'T00:00:00Z' : null;
    }

    // Actualizar la fila en el DOM sin recargar la tabla
    const editBtn = document.querySelector(`.btn-edit[data-id="${editingRecordId}"]`);
    if (editBtn) {
      const cells = editBtn.closest('tr').querySelectorAll('td');
      cells[1].textContent = `${body.FIRST_NAME} ${body.LAST_NAME}`;
      cells[2].textContent = body.TEAM_NAME || '-';
      cells[3].textContent = body.SHIRT_ != null ? body.SHIRT_ : '-';
      cells[4].textContent = body.D_O_B_ || '-';
    }

    editModal.hide();
    showSuccess('Registro actualizado en el MDB');
  } catch (err) {
    showError('Error al guardar: ' + err.message);
  } finally {
    btn.disabled = false;
    btn.textContent = 'Guardar cambios';
  }
}

async function loadTeams() {
  try {
    const { teams } = await apiGet('/mdb/teams');
    const sel = document.getElementById('f-equipo');
    const current = sel.value;
    sel.innerHTML = '<option value="">Todos los equipos</option>' +
      teams.map(t => `<option value="${escapeHtml(t)}">${escapeHtml(t)}</option>`).join('');
    if (current) sel.value = current;
  } catch { /* si falla, el select queda vacío pero la app sigue funcionando */ }
}

const debouncedReload = debounce(() => { currentPage = 1; loadRecords().catch(err => showError(err.message)); });
document.getElementById('f-nombre').addEventListener('input', debouncedReload);
document.getElementById('f-equipo').addEventListener('change', debouncedReload);

document.querySelectorAll('th.sortable').forEach(th => {
  th.addEventListener('click', () => {
    if (sortBy === th.dataset.col) {
      sortDir = sortDir === 'ASC' ? 'DESC' : 'ASC';
    } else {
      sortBy = th.dataset.col;
      sortDir = 'ASC';
    }
    currentPage = 1;
    loadRecords().catch(err => showError(err.message));
  });
});

document.getElementById('btn-prev').addEventListener('click', () => { currentPage--; loadRecords(); });
document.getElementById('btn-next').addEventListener('click', () => { currentPage++; loadRecords(); });
document.getElementById('btn-save-edit').addEventListener('click', saveEdit);

(async () => {
  await requireAuth();
  renderNavbar('admin-settings');
  if (!hasRole('Administrador')) {
    document.body.innerHTML = '<div class="container mt-5"><div class="alert alert-danger">No tienes permisos para ver esta página.</div></div>';
    return;
  }
  editModal = new bootstrap.Modal(document.getElementById('editModal'));
  await loadTeams();
  try { await loadRecords(); } catch (err) { showError(err.message); }
})();
