const tokenKey = "rent_reminder_token";
const apiBaseKey = "rent_reminder_api_base";

const byId = (id) => document.getElementById(id);
const logPane = byId("logConsole");
const authState = byId("authState");
const apiState = byId("apiState");

const state = {
  token: localStorage.getItem(tokenKey) || "",
  apiBase: localStorage.getItem(apiBaseKey) || "http://localhost:3000/api",
};

function log(message, data) {
  const time = new Date().toLocaleTimeString();
  const line = `[${time}] ${message}`;
  logPane.textContent = data ? `${line}\n${JSON.stringify(data, null, 2)}\n\n${logPane.textContent}` : `${line}\n${logPane.textContent}`;
}

function setApiBase(value) {
  state.apiBase = value.replace(/\/+$/, "");
  localStorage.setItem(apiBaseKey, state.apiBase);
  byId("apiBase").value = state.apiBase;
  apiState.textContent = `API Base: ${state.apiBase}`;
}

function setToken(token) {
  state.token = token || "";
  if (state.token) {
    localStorage.setItem(tokenKey, state.token);
    authState.textContent = "Token: set";
  } else {
    localStorage.removeItem(tokenKey);
    authState.textContent = "Token: not set";
  }
}

function headers() {
  const h = { "Content-Type": "application/json" };
  if (state.token) h.Authorization = `Bearer ${state.token}`;
  return h;
}

async function api(path, options = {}) {
  const res = await fetch(`${state.apiBase}${path}`, {
    ...options,
    headers: { ...headers(), ...(options.headers || {}) },
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(body.message || `Request failed (${res.status})`);
  return body;
}

function formatDate(value) {
  return value ? new Date(value).toLocaleDateString() : "-";
}

function renderTenants(tenants) {
  const tbody = byId("tenantRows");
  tbody.innerHTML = "";
  tenants.forEach((t) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${t.phone || "-"}</td>
      <td>${t.rentAmount ?? "-"}</td>
      <td>${formatDate(t.dueDate)}</td>
      <td>${t.status || "-"}</td>
      <td>
        <button class="action" data-id="${t._id}" data-action="paid">Mark Paid</button>
        <button class="action" data-id="${t._id}" data-action="remind">Remind</button>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

function renderLogs(logs) {
  const tbody = byId("logRows");
  tbody.innerHTML = "";
  logs.forEach((l) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${l.phone || "-"}</td>
      <td>${l.status || "-"}</td>
      <td>${l.message || "-"}</td>
      <td>${formatDate(l.sentAt)}</td>
    `;
    tbody.appendChild(tr);
  });
}

async function register() {
  const payload = { name: byId("name").value, phone: byId("phone").value, password: byId("password").value };
  const data = await api("/landlords/register", { method: "POST", body: JSON.stringify(payload) });
  log("Registered landlord", data);
}

async function login() {
  const payload = { phone: byId("phone").value, password: byId("password").value };
  const data = await api("/landlords/login", { method: "POST", body: JSON.stringify(payload) });
  setToken(data.token);
  log("Logged in", data.landlord);
}

async function addTenant() {
  const payload = {
    phone: byId("tenantPhone").value,
    amount: Number(byId("tenantAmount").value),
    date: byId("tenantDate").value,
  };
  const data = await api("/landlords/tenants", { method: "POST", body: JSON.stringify(payload) });
  log("Tenant created (auto reminder flow triggered)", data.tenant);
}

async function refreshSummary() {
  const data = await api("/landlords/dashboard/summary");
  byId("mTotal").textContent = data.total;
  byId("mOverdue").textContent = data.overdue;
  byId("mPaid").textContent = data.paid;
  byId("mPending").textContent = data.pending;
  log("Summary loaded", data);
}

async function loadTenants(path = "/landlords/tenants") {
  const data = await api(path);
  renderTenants(data.tenants || []);
  log(`Loaded tenants from ${path}`, { count: (data.tenants || []).length });
}

async function loadLogs() {
  const data = await api("/sms-logs");
  renderLogs(data.logs || []);
  log("Loaded SMS logs", { count: (data.logs || []).length });
}

async function handleTenantAction(event) {
  const target = event.target;
  if (!target.matches("button.action")) return;
  const tenantId = target.dataset.id;
  const action = target.dataset.action;
  if (action === "paid") {
    await api(`/landlords/tenants/${tenantId}/mark-paid`, { method: "POST" });
    log("Marked rent as paid", { tenantId });
    await loadTenants();
    await refreshSummary();
  }
  if (action === "remind") {
    await api(`/landlords/tenants/${tenantId}/reminder`, { method: "POST" });
    log("Manual reminder sent", { tenantId });
    await loadLogs();
  }
}

async function run(fn) {
  try {
    await fn();
  } catch (err) {
    log(`Error: ${err.message}`);
  }
}

byId("saveApiBtn").addEventListener("click", () => {
  setApiBase(byId("apiBase").value || "http://localhost:3000/api");
  log("API base updated", { apiBase: state.apiBase });
});
byId("registerBtn").addEventListener("click", () => run(register));
byId("loginBtn").addEventListener("click", () => run(login));
byId("logoutBtn").addEventListener("click", () => {
  setToken("");
  log("Logged out");
});
byId("addTenantBtn").addEventListener("click", () => run(addTenant));
byId("refreshSummaryBtn").addEventListener("click", () => run(refreshSummary));
byId("loadTenantsBtn").addEventListener("click", () => run(() => loadTenants("/landlords/tenants")));
byId("loadOverdueBtn").addEventListener("click", () => run(() => loadTenants("/landlords/tenants/overdue")));
byId("loadUpcomingBtn").addEventListener("click", () => run(() => loadTenants("/landlords/tenants/upcoming")));
byId("loadLogsBtn").addEventListener("click", () => run(loadLogs));
byId("tenantRows").addEventListener("click", (e) => run(() => handleTenantAction(e)));

setApiBase(state.apiBase);
setToken(state.token);
log("Standalone dashboard ready");
