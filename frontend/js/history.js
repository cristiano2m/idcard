async function loadHistory() {
  const params = new URLSearchParams();
  const accion = document.getElementById('f-accion').value;
  const fechaDesde = document.getElementById('f-desde').value;
  const fechaHasta = document.getElementById('f-hasta').value;
  if (accion) params.set('accion', accion);
  if (fechaDesde) params.set('fechaDesde', fechaDesde);
  if (fechaHasta) params.set('fechaHasta', fechaHasta);

  const { items } = await apiGet(`/history?${params.toString()}`);
  const tbody = document.getElementById('history-table-body');
  tbody.innerHTML = items.map(h => `
    <tr>
      <td>${formatDateTime(h.createdAt)}</td>
      <td>${escapeHtml(h.userFullName || h.username || '-')}</td>
      <td>${escapeHtml(h.accion)}</td>
      <td>${escapeHtml(h.estadoResultante || '-')}</td>
      <td>${escapeHtml(h.ipAddress || '-')}</td>
    </tr>
  `).join('') || '<tr><td colspan="5" class="text-center text-muted">Sin registros</td></tr>';
}

['f-accion', 'f-desde', 'f-hasta'].forEach(id => {
  document.getElementById(id).addEventListener('change', () => loadHistory().catch(err => showError(err.message)));
});

(async () => {
  await requireAuth();
  renderNavbar('history');
  try { await loadHistory(); } catch (err) { showError(err.message); }
})();
