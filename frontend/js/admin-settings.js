async function loadSettings() {
  const { settings } = await apiGet('/settings');
  document.getElementById('s-session-timeout').value = settings.session_timeout_minutes || 480;
}

document.getElementById('btn-save-settings').addEventListener('click', async () => {
  try {
    await apiPost('/settings', { key: 'session_timeout_minutes', value: document.getElementById('s-session-timeout').value });
    showSuccess('Configuración guardada');
  } catch (err) { showError(err.message); }
});

// ---------------------------------------------------------------------------
// MDB — estado compartido
// ---------------------------------------------------------------------------
let activeInfo = null;

async function loadTablesIntoDatalist(mdbPath, datalistEl, inputEl, hintEl, activeTable) {
  if (hintEl) hintEl.textContent = ' (cargando...)';
  inputEl.placeholder = 'Cargando tablas...';
  try {
    const { tables } = await apiGet(`/mdb/tables?mdbPath=${encodeURIComponent(mdbPath)}`);
    datalistEl.innerHTML = tables.map(t => `<option value="${escapeHtml(t)}">`).join('');
    if (activeTable && !inputEl.value) inputEl.value = activeTable;
    if (hintEl) hintEl.textContent = tables.length ? ` (${tables.length} tablas detectadas)` : '';
    inputEl.placeholder = 'Ej: DPSL_2024';
  } catch (err) {
    datalistEl.innerHTML = '';
    if (hintEl) hintEl.textContent = ' (escribe el nombre manualmente)';
    inputEl.placeholder = 'Escribe el nombre de la tabla';
    if (activeTable && !inputEl.value) inputEl.value = activeTable;
  }
}

async function loadMdbFiles() {
  const { files, active, searchDir } = await apiGet('/mdb/files');
  activeInfo = active;

  // Contraseña
  document.getElementById('mdb-password-status').textContent =
    active.hasPassword ? 'Contraseña configurada: Sí' : 'Contraseña configurada: No';

  // Carpeta actual
  document.getElementById('mdb-search-dir').value = searchDir || '';
  document.getElementById('mdb-search-dir-current').textContent =
    `Carpeta actual: ${searchDir || '(predeterminada)'}`;

  // Archivos
  const fileSelect = document.getElementById('mdb-file-select');
  if (files.length === 0) {
    fileSelect.innerHTML = '<option value="">No se encontraron archivos .mdb en esa carpeta</option>';
  } else {
    fileSelect.innerHTML = files.map(f =>
      `<option value="${escapeHtml(f.path)}" ${f.path === active.mdbPath ? 'selected' : ''}>
        ${escapeHtml(f.name)} (${f.sizeMB} MB)
      </option>`
    ).join('');

    // Cargar tablas del archivo seleccionado (autocompletado)
    const selectedPath = fileSelect.value;
    if (selectedPath) {
      await loadTablesIntoDatalist(
        selectedPath,
        document.getElementById('mdb-tables-datalist'),
        document.getElementById('mdb-table-input'),
        document.getElementById('mdb-table-hint'),
        active.tableName
      );
    }
  }

  document.getElementById('mdb-active-info').textContent =
    `Base activa: ${active.mdbPath} | Tabla: ${active.tableName}`;
}

// Al cambiar el archivo → cargar tablas para autocompletado
document.getElementById('mdb-file-select').addEventListener('change', async function () {
  const mdbPath = this.value;
  if (!mdbPath) return;
  document.getElementById('mdb-table-input').value = '';
  await loadTablesIntoDatalist(
    mdbPath,
    document.getElementById('mdb-tables-datalist'),
    document.getElementById('mdb-table-input'),
    document.getElementById('mdb-table-hint'),
    null
  );
});

document.getElementById('btn-set-search-dir').addEventListener('click', async () => {
  const dir = document.getElementById('mdb-search-dir').value.trim();
  if (!dir) { showError('Ingresa una ruta de carpeta'); return; }
  try {
    const result = await apiPost('/mdb/search-dir', { dir });
    showSuccess(`Carpeta actualizada. Se encontraron ${result.files.length} archivo(s) .mdb`);
    await loadMdbFiles();
  } catch (err) { showError(err.message); }
});

document.getElementById('btn-activate-mdb').addEventListener('click', async () => {
  const mdbPath = document.getElementById('mdb-file-select').value;
  const tableName = document.getElementById('mdb-table-input').value.trim();
  if (!mdbPath) { showError('Selecciona un archivo de la lista'); return; }
  if (!tableName) { showError('Escribe o selecciona el nombre de la tabla'); return; }
  try {
    await apiPost('/mdb/active', { mdbPath, tableName });
    showSuccess(`Base activada: ${tableName}`);
    await loadMdbFiles();
  } catch (err) { showError(err.message); }
});

// Ruta directa — cargar tablas para autocompletado
document.getElementById('btn-load-direct-tables').addEventListener('click', async () => {
  const mdbPath = document.getElementById('mdb-direct-path').value.trim();
  if (!mdbPath) { showError('Ingresa la ruta completa al archivo .mdb'); return; }
  await loadTablesIntoDatalist(
    mdbPath,
    document.getElementById('mdb-direct-tables-datalist'),
    document.getElementById('mdb-direct-table-input'),
    null,
    null
  );
});

// Ruta directa — activar
document.getElementById('btn-activate-direct').addEventListener('click', async () => {
  const mdbPath = document.getElementById('mdb-direct-path').value.trim();
  const tableName = document.getElementById('mdb-direct-table-input').value.trim();
  if (!mdbPath) { showError('Ingresa la ruta completa al archivo .mdb'); return; }
  if (!tableName) { showError('Escribe el nombre de la tabla'); return; }
  try {
    await apiPost('/mdb/active', { mdbPath, tableName });
    showSuccess(`Base activada: ${tableName}`);
    document.getElementById('mdb-direct-path').value = '';
    document.getElementById('mdb-direct-table-input').value = '';
    document.getElementById('mdb-direct-tables-datalist').innerHTML = '';
    await loadMdbFiles();
  } catch (err) { showError(err.message); }
});

// ---------------------------------------------------------------------------
// Contraseña
// ---------------------------------------------------------------------------
document.getElementById('btn-toggle-password').addEventListener('click', () => {
  const input = document.getElementById('mdb-password');
  input.type = input.type === 'password' ? 'text' : 'password';
});

document.getElementById('btn-save-password').addEventListener('click', async () => {
  const password = document.getElementById('mdb-password').value;
  try {
    await apiPost('/mdb/password', { password });
    document.getElementById('mdb-password').value = '';
    showSuccess(password ? 'Contraseña guardada' : 'Contraseña eliminada');
    await loadMdbFiles();
  } catch (err) { showError(err.message); }
});

document.getElementById('btn-clear-password').addEventListener('click', async () => {
  if (!confirm('¿Borrar la contraseña guardada? La base solo será accesible si no tiene contraseña.')) return;
  try {
    await apiPost('/mdb/password', { password: '' });
    document.getElementById('mdb-password').value = '';
    showSuccess('Contraseña eliminada');
    await loadMdbFiles();
  } catch (err) { showError(err.message); }
});

// ---------------------------------------------------------------------------
// Importar
// ---------------------------------------------------------------------------
document.getElementById('btn-import-mdb').addEventListener('click', async () => {
  if (!confirm('¿Importar todos los registros de la base activa hacia la aplicación? Esto puede tardar unos segundos.')) return;
  try {
    const result = await apiPost('/mdb/import');
    const box = document.getElementById('mdb-import-result');
    box.classList.remove('d-none');
    box.textContent = `Importación completa: ${result.total} registros en MDB → ${result.created} creados, ${result.updated} actualizados, ${result.skipped} con error.`;
    showSuccess('Importación finalizada');
  } catch (err) { showError(err.message); }
});

// ---------------------------------------------------------------------------
// Init
// ---------------------------------------------------------------------------
(async () => {
  await requireAuth();
  renderNavbar('admin-settings');
  if (!hasRole('Administrador')) {
    document.body.innerHTML = '<div class="container mt-5"><div class="alert alert-danger">No tienes permisos para ver esta página.</div></div>';
    return;
  }
  try {
    await loadSettings();
    await loadMdbFiles();
  } catch (err) { showError(err.message); }
})();
