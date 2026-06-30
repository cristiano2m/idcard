const API_BASE = '/api';

async function request(method, path, body, isFormData = false) {
  const opts = {
    method,
    credentials: 'include',
    headers: isFormData ? {} : { 'Content-Type': 'application/json' },
  };
  if (body !== undefined) {
    opts.body = isFormData ? body : JSON.stringify(body);
  }
  const res = await fetch(`${API_BASE}${path}`, opts);

  if (res.status === 401 && !path.startsWith('/auth/')) {
    window.location.href = '/pages/login.html';
    return;
  }

  let data = null;
  try { data = await res.json(); } catch {}

  if (!res.ok) {
    const error = new Error(data?.error?.message || `Error ${res.status}`);
    error.status = res.status;
    error.details = data?.error?.details;
    error.code = data?.error?.code;
    throw error;
  }
  return data;
}

const apiGet = (path) => request('GET', path);
const apiPost = (path, body, isFormData = false) => request('POST', path, body, isFormData);
const apiPut = (path, body, isFormData = false) => request('PUT', path, body, isFormData);
const apiPatch = (path, body) => request('PATCH', path, body);
const apiDelete = (path) => request('DELETE', path);
