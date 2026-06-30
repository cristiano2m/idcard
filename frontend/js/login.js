document.getElementById('login-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const errorBox = document.getElementById('login-error');
  errorBox.classList.add('d-none');

  const username = document.getElementById('username').value.trim();
  const password = document.getElementById('password').value;

  try {
    await apiPost('/auth/login', { username, password });
    window.location.href = '/pages/dashboard.html';
  } catch (err) {
    errorBox.textContent = err.message || 'Error al iniciar sesión';
    errorBox.classList.remove('d-none');
  }
});

(async () => {
  try {
    const data = await apiGet('/auth/me');
    if (data?.user) window.location.href = '/pages/dashboard.html';
  } catch {}
})();
