let currentUser = null;

async function requireAuth() {
  try {
    const data = await apiGet('/auth/me');
    currentUser = data.user;
    return currentUser;
  } catch {
    window.location.href = '/pages/login.html';
    return null;
  }
}

function hasRole(...roles) {
  return currentUser && roles.includes(currentUser.role);
}

async function logout() {
  await apiPost('/auth/logout');
  window.location.href = '/pages/login.html';
}
