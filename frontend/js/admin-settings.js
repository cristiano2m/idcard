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
  const { files, active } = await apiGet('/mdb/files');
  const select = document.getElementById('mdb-file-select');
  select.innerHTML = files.map(f =>
    `<option value="${escapeHtml(f.path)}" ${f.path === active.mdbPath ? 'selected' : ''}>
      ${escapeHtml(f.name)} (${f.sizeMB} MB)
    </option>`
  ).join('') || '<option value="">No se encontraron archivos .mdb</option>';

  document.getElementById('mdb-active-info').textContent =
    `Base activa actual: ${active.mdbPath} (tabla: ${active.tableName})`;
}

document.getElementById('btn-activate-mdb').addEventListener('click', async () => {
  const mdbPath = document.getElementById('mdb-file-select').value;
  if (!mdbPath) return;
  try {
    await apiPost('/mdb/active', { mdbPath });
    showSuccess('Base de datos activa actualizada');
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
