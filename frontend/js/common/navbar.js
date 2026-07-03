function renderNavbar(activePage) {
  const links = [
    { href: '/pages/dashboard.html', label: 'Dashboard', key: 'dashboard' },
    { href: '/pages/persons-list.html', label: 'Personas', key: 'persons' },
    { href: '/pages/updates-board.html', label: 'Actualizaciones', key: 'updates-board' },
    { href: '/pages/history.html', label: 'Historial', key: 'history' },
    { href: '/pages/admin-users.html', label: 'Usuarios', key: 'admin-users', roles: ['Administrador'] },
    { href: '/pages/admin-settings.html', label: 'Configuración', key: 'admin-settings', roles: ['Administrador'] },
    { href: '/pages/license.html', label: 'Licencia', key: 'license', roles: ['Administrador'] },
  ];

  const navHtml = links
    .filter(l => !l.roles || hasRole(...l.roles))
    .map(l => `<li class="nav-item">
      <a class="nav-link ${activePage === l.key ? 'active fw-bold' : ''}" href="${l.href}">${l.label}</a>
    </li>`).join('');

  const nav = document.getElementById('app-navbar');
  if (!nav) return;
  nav.innerHTML = `
    <nav class="navbar navbar-expand-lg navbar-dark bg-brand mb-4">
      <div class="container-fluid">
        <a class="navbar-brand" href="/pages/dashboard.html">Credenciales PVC</a>
        <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navContent">
          <span class="navbar-toggler-icon"></span>
        </button>
        <div class="collapse navbar-collapse" id="navContent">
          <ul class="navbar-nav me-auto">${navHtml}</ul>
          <span class="navbar-text text-white me-3">${currentUser ? currentUser.fullName + ' (' + currentUser.role + ')' : ''}</span>
          <button class="btn btn-outline-light btn-sm" onclick="logout()">Cerrar sesión</button>
        </div>
      </div>
    </nav>`;
}
