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

async function loadMdbFiles() {
  const { files, active, searchDir } = await apiGet('/mdb/files');

  // Estado de contraseña
  document.getElementById('mdb-password-status').textContent =
    active.hasPassword ? 'Contraseña configurada: Sí' : 'Contraseña configurada: No';

  // Mostrar carpeta actual
  document.getElementById('mdb-search-dir').value = searchDir || '';
  document.getElementById('mdb-search-dir-current').textContent =
    `Carpeta actual: ${searchDir || '(predeterminada)'}`;

  // Llenar select
  const select = document.getElementById('mdb-file-select');
  if (files.length === 0) {
    select.innerHTML = '<option value="">No se encontraron archivos .mdb en esa carpeta</option>';
  } else {
    select.innerHTML = files.map(f =>
      `<option value="${escapeHtml(f.path)}" ${f.path === active.mdbPath ? 'selected' : ''}>
        ${escapeHtml(f.name)} (${f.sizeMB} MB)
      </option>`
    ).join('');
  }

  document.getElementById('mdb-active-info').textContent =
    `Base activa: ${active.mdbPath} (tabla: ${active.tableName})`;
}

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
  if (!mdbPath) { showError('Selecciona un archivo de la lista'); return; }
  try {
    await apiPost('/mdb/active', { mdbPath });
    showSuccess('Base de datos activa actualizada');
    await loadMdbFiles();
  } catch (err) { showError(err.message); }
});

document.getElementById('btn-activate-direct').addEventListener('click', async () => {
  const mdbPath = document.getElementById('mdb-direct-path').value.trim();
  if (!mdbPath) { showError('Ingresa la ruta completa al archivo .mdb'); return; }
  try {
    await apiPost('/mdb/active', { mdbPath });
    showSuccess('Base de datos activa actualizada');
    document.getElementById('mdb-direct-path').value = '';
    await loadMdbFiles();
  } catch (err) { showError(err.message); }
});

// Mostrar/ocultar contraseña
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
