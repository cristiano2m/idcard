let userModal;

async function loadUsers() {
  const { users } = await apiGet('/users');
  const tbody = document.getElementById('users-table-body');
  tbody.innerHTML = users.map(u => `
    <tr>
      <td>${escapeHtml(u.username)}</td>
      <td>${escapeHtml(u.fullName)}</td>
      <td>${escapeHtml(u.role)}</td>
      <td>${u.isActive ? '<span class="badge bg-success">Sí</span>' : '<span class="badge bg-secondary">No</span>'}</td>
      <td>${formatDateTime(u.lastLoginAt)}</td>
      <td class="table-actions">
        <button class="btn btn-sm btn-outline-secondary" onclick="editUser(${u.id})">Editar</button>
        <button class="btn btn-sm btn-outline-danger" onclick="removeUser(${u.id})">Eliminar</button>
      </td>
    </tr>
  `).join('');
  window._usersCache = users;
}

function openCreateModal() {
  document.getElementById('user-form').reset();
  document.getElementById('u-id').value = '';
  document.getElementById('user-modal-title').textContent = 'Nuevo Usuario';
  document.getElementById('u-username').disabled = false;
  document.getElementById('u-password').required = true;
  document.getElementById('u-password-label').textContent = 'Contraseña';
  document.getElementById('u-active-wrap').classList.add('d-none');
}

function editUser(id) {
  const u = window._usersCache.find(x => x.id === id);
  if (!u) return;
  document.getElementById('u-id').value = u.id;
  document.getElementById('u-username').value = u.username;
  document.getElementById('u-username').disabled = true;
  document.getElementById('u-fullname').value = u.fullName;
  document.getElementById('u-role').value = u.role;
  document.getElementById('u-password').value = '';
  document.getElementById('u-password').required = false;
  document.getElementById('u-password-label').textContent = 'Nueva contraseña (dejar en blanco para no cambiar)';
  document.getElementById('u-active').checked = u.isActive;
  document.getElementById('u-active-wrap').classList.remove('d-none');
  document.getElementById('user-modal-title').textContent = 'Editar Usuario';
  userModal.show();
}

async function removeUser(id) {
  if (!confirm('¿Eliminar este usuario?')) return;
  try {
    await apiDelete(`/users/${id}`);
    showSuccess('Usuario eliminado');
    await loadUsers();
  } catch (err) { showError(err.message); }
}

document.getElementById('btn-new-user').addEventListener('click', openCreateModal);

document.getElementById('user-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const id = document.getElementById('u-id').value;
  try {
    if (id) {
      const payload = {
        fullName: document.getElementById('u-fullname').value,
        role: document.getElementById('u-role').value,
        isActive: document.getElementById('u-active').checked,
      };
      const pwd = document.getElementById('u-password').value;
      if (pwd) payload.newPassword = pwd;
      await apiPut(`/users/${id}`, payload);
      showSuccess('Usuario actualizado');
    } else {
      await apiPost('/users', {
        username: document.getElementById('u-username').value,
        password: document.getElementById('u-password').value,
        fullName: document.getElementById('u-fullname').value,
        role: document.getElementById('u-role').value,
      });
      showSuccess('Usuario creado');
    }
    userModal.hide();
    await loadUsers();
  } catch (err) { showError(err.message); }
});

(async () => {
  const user = await requireAuth();
  renderNavbar('admin-users');
  if (!hasRole('Administrador')) {
    document.body.innerHTML = '<div class="container mt-5"><div class="alert alert-danger">No tienes permisos para ver esta página.</div></div>';
    return;
  }
  userModal = new bootstrap.Modal(document.getElementById('userModal'));
  try { await loadUsers(); } catch (err) { showError(err.message); }
})();
