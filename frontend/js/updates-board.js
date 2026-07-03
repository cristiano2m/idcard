function fmtDate(iso) {
  if (!iso) return '-';
  return iso.replace('T', ' ').slice(0, 16);
}

async function loadBoard() {
  const { modificados, impresos } = await apiGet('/mdb-updates');

  document.getElementById('badge-mod').textContent = modificados.length;
  document.getElementById('badge-imp').textContent = impresos.length;

  const tbodyMod = document.getElementById('tbody-mod');
  tbodyMod.innerHTML = modificados.map(r => `
    <tr class="table-modificado">
      <td>${r.record_id}</td>
      <td>${escapeHtml(r.nombre)} ${escapeHtml(r.apellido)}</td>
      <td>${escapeHtml(r.equipo || '-')}</td>
      <td>${fmtDate(r.updated_at)}</td>
      <td>
        <button class="btn btn-success btn-sm btn-impreso" data-id="${r.id}">Impreso</button>
      </td>
    </tr>
  `).join('') || '<tr><td colspan="5" class="text-center text-muted py-3">Sin registros modificados</td></tr>';

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

  const tbodyImp = document.getElementById('tbody-imp');
  tbodyImp.innerHTML = impresos.map(r => `
    <tr>
      <td>${r.record_id}</td>
      <td>${escapeHtml(r.nombre)} ${escapeHtml(r.apellido)}</td>
      <td>${escapeHtml(r.equipo || '-')}</td>
      <td>${fmtDate(r.updated_at)}</td>
      <td>${fmtDate(r.printed_at)}</td>
    </tr>
  `).join('') || '<tr><td colspan="5" class="text-center text-muted py-3">Sin registros impresos</td></tr>';
}

document.getElementById('btn-refresh').addEventListener('click', () => {
  loadBoard().catch(err => showError(err.message));
});

(async () => {
  await requireAuth();
  renderNavbar('updates-board');
  try { await loadBoard(); } catch (err) { showError(err.message); }
})();
