const ERP_AUTH_KEY = "collegeErpAuth";

function saveAuthSession(role, user) {
  sessionStorage.setItem(ERP_AUTH_KEY, JSON.stringify({ role, user }));
}

function getAuthSession() {
  const raw = sessionStorage.getItem(ERP_AUTH_KEY);
  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw);
  } catch (error) {
    sessionStorage.removeItem(ERP_AUTH_KEY);
    return null;
  }
}

function clearAuthSession() {
  sessionStorage.removeItem(ERP_AUTH_KEY);
}

function redirectTo(path) {
  window.location.href = path;
}

function requireRole(allowedRoles) {
  const session = getAuthSession();
  if (!session || !allowedRoles.includes(session.role)) {
    redirectTo("/login.html");
    return null;
  }

  return session;
}

async function apiFetch(url, options = {}) {
  const response = await fetch(url, options);
  const data = await response.json();

  if (!response.ok || !data.success) {
    throw new Error(data.error || data.message || "Request failed.");
  }

  return data;
}

function showMessage(element, text, isError = false) {
  element.textContent = text;
  element.style.color = isError ? "#b84040" : "#074b4b";
}
