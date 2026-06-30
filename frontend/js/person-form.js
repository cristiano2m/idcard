let capturedPhotoDataUrl = null;
let editingPersonId = null;

const FIELD_IDS = ['nombre', 'apellido', 'equipo', 'documentoId', 'fechaNacimiento', 'numeroCamiseta'];

function showFormError(msg) {
  const box = document.getElementById('form-error');
  box.textContent = msg;
  box.classList.remove('d-none');
}

function clearFormError() {
  document.getElementById('form-error').classList.add('d-none');
}

async function loadPersonForEdit(id) {
  const { person } = await apiGet(`/persons/${id}`);
  editingPersonId = id;
  document.getElementById('form-title').textContent = `Editar Persona: ${person.fullName || person.nombre + ' ' + person.apellido}`;
  for (const field of FIELD_IDS) {
    const el = document.getElementById(field);
    if (el && person[field] !== undefined && person[field] !== null) el.value = person[field];
  }
  if (person.fotoPath) {
    document.getElementById('photo-preview').src = `/uploads/${person.fotoPath.replace(/\\/g, '/')}`;
  }
}

document.getElementById('foto-file').addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (!file) return;
  capturedPhotoDataUrl = null;
  const reader = new FileReader();
  reader.onload = (ev) => { document.getElementById('photo-preview').src = ev.target.result; };
  reader.readAsDataURL(file);
});

document.getElementById('btn-start-camera').addEventListener('click', async () => {
  try {
    await startCamera(document.getElementById('webcam-video'));
    document.getElementById('btn-capture-photo').disabled = false;
  } catch (err) {
    showError('No se pudo acceder a la cámara: ' + err.message);
  }
});

document.getElementById('btn-capture-photo').addEventListener('click', () => {
  const video = document.getElementById('webcam-video');
  const canvas = document.getElementById('webcam-canvas');
  capturedPhotoDataUrl = capturePhotoAsDataUrl(video, canvas);
  document.getElementById('photo-preview').src = capturedPhotoDataUrl;
  document.getElementById('foto-file').value = '';
});

document.getElementById('person-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  clearFormError();

  const formData = new FormData();
  for (const field of FIELD_IDS) {
    const val = document.getElementById(field).value;
    if (val) formData.append(field, val);
  }

  const fileInput = document.getElementById('foto-file');
  if (fileInput.files[0]) {
    formData.append('foto', fileInput.files[0]);
  } else if (capturedPhotoDataUrl) {
    formData.append('webcamBase64', capturedPhotoDataUrl);
  }

  try {
    if (editingPersonId) {
      await apiPut(`/persons/${editingPersonId}`, formData, true);
      showSuccess('Persona actualizada correctamente');
    } else {
      await apiPost('/persons', formData, true);
      showSuccess('Persona registrada correctamente');
    }
    setTimeout(() => { window.location.href = '/pages/persons-list.html'; }, 800);
  } catch (err) {
    showFormError(err.message + (err.details ? ': ' + err.details.map(d => d.message).join(', ') : ''));
  }
});

(async () => {
  await requireAuth();
  renderNavbar('persons');
  const id = qs('id');
  if (id) await loadPersonForEdit(id);
  window.addEventListener('beforeunload', stopCamera);
})();
