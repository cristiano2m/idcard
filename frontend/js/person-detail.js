let personId = null;

function badgeForEstado(estado) {
  const cls = estado === 'Impreso' ? 'success' : estado === 'Cancelado' ? 'danger' : 'warning';
  return `<span class="badge bg-${cls} fs-6">${estado}</span>`;
}

async function loadDetail() {
  const { person } = await apiGet(`/persons/${personId}`);

  document.getElementById('d-nombre').textContent = `${person.nombre} ${person.apellido}`;
  document.getElementById('d-equipo').textContent = person.equipo;
  document.getElementById('d-documento').textContent = person.documentoId;
  document.getElementById('d-nacimiento').textContent = person.fechaNacimiento || '-';
  document.getElementById('d-camiseta').textContent = person.numeroCamiseta ?? '-';
  document.getElementById('d-estado-badge').innerHTML = badgeForEstado(person.estado);

  if (person.fotoPath) {
    document.getElementById('d-foto').src = `/uploads/${person.fotoPath.replace(/\\/g, '/')}`;
  }
  if (person.qrPath) {
    document.getElementById('d-qr').src = `/uploads/${person.qrPath.replace(/\\/g, '/')}`;
  }
  renderBarcodePreview(document.getElementById('d-barcode'), person.barcodeValue);

  document.querySelectorAll('[data-estado]').forEach(btn => {
    btn.disabled = btn.dataset.estado === person.estado;
  });
}

document.querySelectorAll('[data-estado]').forEach(btn => {
  btn.addEventListener('click', async () => {
    try {
      await apiPatch(`/persons/${personId}/status`, { estado: btn.dataset.estado });
      showSuccess('Estado actualizado');
      await loadDetail();
    } catch (err) { showError(err.message); }
  });
});

(async () => {
  await requireAuth();
  renderNavbar('persons');
  personId = qs('id');
  try { await loadDetail(); } catch (err) { showError(err.message); }
})();
