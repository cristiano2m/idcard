function badgeForEstado(estado) {
  const cls = estado === 'Impreso' ? 'success' : estado === 'Cancelado' ? 'danger' : 'warning';
  return `<span class="badge bg-${cls}">${estado}</span>`;
}

async function loadDashboard() {
  const { counts, recent } = await apiGet('/dashboard/stats');
  document.getElementById('stat-total').textContent = counts.total;
  document.getElementById('stat-pendiente').textContent = counts.Pendiente;
  document.getElementById('stat-impreso').textContent = counts.Impreso;
  document.getElementById('stat-cancelado').textContent = counts.Cancelado;

  const tbody = document.getElementById('recent-table-body');
  tbody.innerHTML = recent.map(p => `
    <tr>
      <td>${escapeHtml(p.nombre)} ${escapeHtml(p.apellido)}</td>
      <td>${escapeHtml(p.equipo)}</td>
      <td>${escapeHtml(p.documentoId)}</td>
      <td>${badgeForEstado(p.estado)}</td>
      <td>${formatDateTime(p.createdAt)}</td>
    </tr>
  `).join('') || '<tr><td colspan="5" class="text-center text-muted">Sin registros aún</td></tr>';
}

(async () => {
  await requireAuth();
  renderNavbar('dashboard');
  try { await loadDashboard(); } catch (err) { showError(err.message); }
})();
