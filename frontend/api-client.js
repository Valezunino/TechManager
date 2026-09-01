const STORAGE_KEYS = {
  token: "techmanager_token",
  user: "techmanager_user",
  apiUrl: "techmanager_api_url"
};

function defaultBaseUrl() {
  const localHosts = new Set(["localhost", "127.0.0.1", "0.0.0.0"]);
  return localHosts.has(window.location.hostname)
    ? "http://localhost:8080"
    : "/api";
}

export function getApiBaseUrl() {
  return localStorage.getItem(STORAGE_KEYS.apiUrl) || defaultBaseUrl();
}

export function setApiBaseUrl(value) {
  const normalized = String(value || "").trim().replace(/\/+$/, "");
  if (!normalized) {
    localStorage.removeItem(STORAGE_KEYS.apiUrl);
  } else {
    localStorage.setItem(STORAGE_KEYS.apiUrl, normalized);
  }
}

export function getSession() {
  const token = localStorage.getItem(STORAGE_KEYS.token);
  const rawUser = localStorage.getItem(STORAGE_KEYS.user);
  let user = null;
  try {
    user = rawUser ? JSON.parse(rawUser) : null;
  } catch {
    localStorage.removeItem(STORAGE_KEYS.user);
  }
  return { token, user };
}

export function saveSession(response) {
  const user = {
    nombre: response.nombre,
    email: response.email,
    rol: response.rol
  };
  localStorage.setItem(STORAGE_KEYS.token, response.token);
  localStorage.setItem(STORAGE_KEYS.user, JSON.stringify(user));
  return { token: response.token, user };
}

export function clearSession() {
  localStorage.removeItem(STORAGE_KEYS.token);
  localStorage.removeItem(STORAGE_KEYS.user);
}

export async function apiRequest(path, options = {}) {
  const { token } = getSession();
  const headers = new Headers(options.headers || {});
  headers.set("Accept", "application/json");

  if (options.body !== undefined && !(options.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }
  if (token && options.auth !== false) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(`${getApiBaseUrl()}${path}`, {
    ...options,
    headers,
    body: options.body === undefined || options.body instanceof FormData
      ? options.body
      : JSON.stringify(options.body)
  });

  const contentType = response.headers.get("content-type") || "";
  const payload = response.status === 204
    ? null
    : contentType.includes("application/json")
      ? await response.json()
      : await response.text();

  if (!response.ok) {
    if (response.status === 401 && options.auth !== false) {
      clearSession();
      window.dispatchEvent(new CustomEvent("techmanager:session-expired"));
    }
    const message = payload?.message || payload?.error || payload || "No se pudo completar la operación";
    const error = new Error(String(message));
    error.status = response.status;
    error.payload = payload;
    throw error;
  }

  return payload;
}

export async function checkConnection() {
  try {
    await apiRequest("/auth/bootstrap-status", { auth: false });
    return true;
  } catch {
    return false;
  }
}

