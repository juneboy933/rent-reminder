"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

const TOKEN_KEY = "rent_reminder_token";
const LANDLORD_KEY = "rent_reminder_landlord";
const DEFAULT_API = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:8000/api";

const TABS = [
  { id: "add", label: "Add Tenant" },
  { id: "tenants", label: "Tenants" },
  { id: "payment", label: "Payment" },
  { id: "logs", label: "SMS Logs" },
  { id: "profile", label: "Profile" },
];

function useApi(token, apiBase) {
  return async function request(path, options = {}) {
    const res = await fetch(`${apiBase}${path}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(options.headers || {}),
      },
    });

    const body = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(body.message || `Request failed (${res.status})`);
    return body;
  };
}

export default function DashboardClient() {
  const router = useRouter();
  const [token, setToken] = useState("");
  const [apiBase, setApiBase] = useState(DEFAULT_API);
  const [landlord, setLandlord] = useState(null);
  const [activeTab, setActiveTab] = useState("add");
  const [summary, setSummary] = useState({ total: 0, overdue: 0, paid: 0, pending: 0 });
  const [tenants, setTenants] = useState([]);
  const [tenantFilter, setTenantFilter] = useState("all");
  const [tenantSearch, setTenantSearch] = useState("");
  const [logs, setLogs] = useState([]);
  const [logSearch, setLogSearch] = useState("");
  const [logStatus, setLogStatus] = useState("ALL");
  const [message, setMessage] = useState("Dashboard ready.");

  const [newTenant, setNewTenant] = useState({ phone: "", amount: "", date: "" });
  const [profile, setProfile] = useState({ name: "", phone: "" });
  const [passwordForm, setPasswordForm] = useState({ oldPassword: "", newPassword: "" });
  const [paymentForm, setPaymentForm] = useState({ phoneNumber: "", amount: "" });
  const [stkLoading, setStkLoading] = useState(false);

  useEffect(() => {
    const t = window.localStorage.getItem(TOKEN_KEY);
    if (!t) {
      router.replace("/login");
      return;
    }
    setToken(t);
    setApiBase(DEFAULT_API);
    const storedLandlord = JSON.parse(window.localStorage.getItem(LANDLORD_KEY) || "null");
    setLandlord(storedLandlord);
    setProfile({ name: storedLandlord?.name || "", phone: storedLandlord?.phone || "" });
  }, [router]);

  const api = useApi(token, apiBase);

  async function loadSummary() {
    const data = await api("/landlords/dashboard/summary");
    setSummary(data);
  }

  async function loadTenants(filter = tenantFilter) {
    const route = filter === "overdue" ? "/landlords/tenants/overdue" : filter === "upcoming" ? "/landlords/tenants/upcoming" : "/landlords/tenants";
    const data = await api(route);
    setTenantFilter(filter);
    setTenants(data.tenants || []);
  }

  async function loadLogs() {
    const data = await api("/sms-logs");
    setLogs(data.logs || []);
  }

  async function refreshAll() {
    try {
      await Promise.all([loadSummary(), loadTenants(tenantFilter), loadLogs()]);
      setMessage("Dashboard data updated successfully.");
    } catch (error) {
      setMessage(error.message);
    }
  }

  useEffect(() => {
    if (!token) return;
    refreshAll();
  }, [token]);

  async function addTenant() {
    try {
      await api("/landlords/tenants", {
        method: "POST",
        body: JSON.stringify({
          phone: newTenant.phone,
          amount: Number(newTenant.amount),
          date: newTenant.date,
        }),
      });
      setNewTenant({ phone: "", amount: "", date: "" });
      await Promise.all([loadTenants(tenantFilter), loadSummary()]);
      setMessage("Tenant added successfully and included in your portfolio.");
    } catch (error) {
      setMessage(error.message);
    }
  }

  async function runTenantAction(id, action) {
    try {
      if (action === "paid") await api(`/landlords/tenants/${id}/mark-paid`, { method: "POST" });
      if (action === "remind") await api(`/landlords/tenants/${id}/reminder`, { method: "POST" });
      if (action === "delete") await api(`/landlords/tenants/${id}`, { method: "DELETE" });
      if (action === "edit") {
        const current = tenants.find((t) => t._id === id);
        const phone = window.prompt("Tenant phone", current?.phone || "");
        if (phone === null) return;
        const amount = window.prompt("Rent amount", String(current?.rentAmount || 0));
        if (amount === null) return;
        const date = window.prompt("Due date YYYY-MM-DD", (current?.dueDate || "").slice(0, 10));
        if (date === null) return;
        await api(`/landlords/tenants/${id}`, {
          method: "PUT",
          body: JSON.stringify({ phone, amount: Number(amount), date }),
        });
      }
      await Promise.all([loadTenants(tenantFilter), loadSummary(), loadLogs()]);
      setMessage(`Tenant action completed: ${action}.`);
    } catch (error) {
      setMessage(error.message);
    }
  }


  async function saveProfile() {
    try {
      const data = await api("/landlords/profile", {
        method: "PUT",
        body: JSON.stringify(profile),
      });
      setLandlord(data.landlord);
      window.localStorage.setItem(LANDLORD_KEY, JSON.stringify(data.landlord));
      setMessage("Profile information updated successfully.");
    } catch (error) {
      setMessage(error.message);
    }
  }

  async function changePassword() {
    try {
      await api("/landlords/change-password", {
        method: "PUT",
        body: JSON.stringify(passwordForm),
      });
      setPasswordForm({ oldPassword: "", newPassword: "" });
      setMessage("Password changed successfully.");
    } catch (error) {
      setMessage(error.message);
    }
  }

  async function initiateSTKPayment() {
    try {
      if (!paymentForm.phoneNumber || !paymentForm.amount) {
        setMessage("Please enter both phone number and amount.");
        return;
      }
      setStkLoading(true);
      const data = await api("/mpesa/stkpush", {
        method: "POST",
        body: JSON.stringify({
          phoneNumber: paymentForm.phoneNumber,
          amount: Number(paymentForm.amount),
        }),
      });
      setMessage(`STK push initiated successfully. Checkout ID: ${data.response?.CheckoutRequestID || "N/A"}`);
      setPaymentForm({ phoneNumber: "", amount: "" });
    } catch (error) {
      setMessage(`Payment initiation failed: ${error.message}`);
    } finally {
      setStkLoading(false);
    }
  }

  function signOut() {
    window.localStorage.removeItem(TOKEN_KEY);
    window.localStorage.removeItem(LANDLORD_KEY);
    router.replace("/login");
  }

  const shownTenants = useMemo(() => {
    const q = tenantSearch.trim().toLowerCase();
    return tenants.filter((t) => !q || (t.phone || "").toLowerCase().includes(q));
  }, [tenantSearch, tenants]);

  const shownLogs = useMemo(() => {
    const q = logSearch.trim().toLowerCase();
    return logs.filter((l) => {
      const statusOk = logStatus === "ALL" || l.status === logStatus;
      const queryOk = !q || (l.phone || "").toLowerCase().includes(q) || (l.message || "").toLowerCase().includes(q);
      return statusOk && queryOk;
    });
  }, [logs, logSearch, logStatus]);

  return (
    <main className="dashboard-page">
      <section className="dashboard-shell">
        <header className="top-nav card">
          <div>
            <h1>Landlord Dashboard</h1>
            <p>{landlord ? `${landlord.name} - ${landlord.phone}` : "Loading landlord profile..."}</p>
          </div>
          <div className="row">
            <button className="btn ghost" onClick={refreshAll}>Refresh</button>
            <button className="btn ghost" onClick={signOut}>Sign Out</button>
          </div>
        </header>

        <section className="stats-grid">
          <div className="card stat-card"><span>Total Tenants</span><strong>{summary.total}</strong></div>
          <div className="card stat-card"><span>Overdue Tenants</span><strong>{summary.overdue}</strong></div>
          <div className="card stat-card"><span>Paid Tenants</span><strong>{summary.paid}</strong></div>
          <div className="card stat-card"><span>Pending Tenants</span><strong>{summary.pending}</strong></div>
        </section>

        <section className="workspace card">
          <aside className="workspace-sidebar">
            <h2>Manage</h2>
            {TABS.map((tab) => (
              <button key={tab.id} className={`sidebar-btn ${activeTab === tab.id ? "active" : ""}`} onClick={() => setActiveTab(tab.id)}>
                {tab.label}
              </button>
            ))}
            <small>{message}</small>
          </aside>

          <div className="workspace-content">
            {activeTab === "add" && (
              <section>
                <h2>Add Tenant</h2>
                <p>Create a tenant profile with phone, rent amount, and due date.</p>
                <div className="form-grid">
                  <input placeholder="Tenant phone" value={newTenant.phone} onChange={(e) => setNewTenant({ ...newTenant, phone: e.target.value })} />
                  <input placeholder="Rent amount" type="number" value={newTenant.amount} onChange={(e) => setNewTenant({ ...newTenant, amount: e.target.value })} />
                  <input type="date" value={newTenant.date} onChange={(e) => setNewTenant({ ...newTenant, date: e.target.value })} />
                  <button className="btn large" onClick={addTenant}>Add Tenant</button>
                </div>
              </section>
            )}

            {activeTab === "tenants" && (
              <section>
                <h2>Tenants</h2>
                <p>Review and manage tenant status, reminders, and payment updates.</p>
                <div className="row">
                  <button className={`btn ${tenantFilter === "all" ? "active" : ""}`} onClick={() => loadTenants("all")}>All</button>
                  <button className={`btn ${tenantFilter === "overdue" ? "active" : ""}`} onClick={() => loadTenants("overdue")}>Overdue</button>
                  <button className={`btn ${tenantFilter === "upcoming" ? "active" : ""}`} onClick={() => loadTenants("upcoming")}>Upcoming</button>
                  <input placeholder="Search by phone" value={tenantSearch} onChange={(e) => setTenantSearch(e.target.value)} />
                </div>
                <table>
                  <thead><tr><th>Phone</th><th>Amount</th><th>Due Date</th><th>Status</th><th>Actions</th></tr></thead>
                  <tbody>
                    {shownTenants.map((t) => (
                      <tr key={t._id}>
                        <td>{t.phone}</td>
                        <td>KES {t.rentAmount}</td>
                        <td>{new Date(t.dueDate).toLocaleDateString()}</td>
                        <td>{t.status}</td>
                        <td className="row compact">
                          <button className="btn small" onClick={() => runTenantAction(t._id, "paid")}>Mark Paid</button>
                          <button className="btn small" onClick={() => runTenantAction(t._id, "remind")}>Send Reminder</button>
                          <button className="btn small" onClick={() => runTenantAction(t._id, "edit")}>Edit</button>
                          <button className="btn small danger" onClick={() => runTenantAction(t._id, "delete")}>Delete</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>


              </section>
            )}

            {activeTab === "payment" && (
              <section>
                <h2>Initiate Payment (M-Pesa STK Push)</h2>
                <p>Enter a phone number and amount to trigger an M-Pesa payment prompt on the customer's phone.</p>
                <div className="card inner-card">
                  <div className="form-grid">
                    <input
                      placeholder="Phone number (e.g., 254712345678)"
                      value={paymentForm.phoneNumber}
                      onChange={(e) => setPaymentForm({ ...paymentForm, phoneNumber: e.target.value })}
                    />
                    <input
                      placeholder="Amount (KES)"
                      type="number"
                      value={paymentForm.amount}
                      onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })}
                    />
                    <button
                      className="btn large"
                      onClick={initiateSTKPayment}
                      disabled={stkLoading}
                    >
                      {stkLoading ? "Processing..." : "Send STK Push"}
                    </button>
                  </div>
                  <p style={{ marginTop: "1rem", fontSize: "0.9rem", color: "#666" }}>
                    ℹ️ A payment prompt will appear on the customer's phone. They have 30 seconds to enter their M-Pesa PIN.
                  </p>
                </div>
              </section>
            )}

            {activeTab === "logs" && (
              <section>
                <h2>SMS Logs</h2>
                <p>Audit reminder activity, delivery outcomes, and communication records.</p>
                <div className="row">
                  <button className="btn" onClick={loadLogs}>Refresh Logs</button>
                  <select value={logStatus} onChange={(e) => setLogStatus(e.target.value)}>
                    <option value="ALL">All statuses</option>
                    <option value="SENT">SENT</option>
                    <option value="FAILED">FAILED</option>
                    <option value="SKIPPED">SKIPPED</option>
                  </select>
                  <input placeholder="Search logs" value={logSearch} onChange={(e) => setLogSearch(e.target.value)} />
                </div>
                <table>
                  <thead><tr><th>Phone</th><th>Status</th><th>Message</th><th>Sent At</th></tr></thead>
                  <tbody>
                    {shownLogs.map((l) => (
                      <tr key={l._id}>
                        <td>{l.phone}</td>
                        <td>{l.status}</td>
                        <td>{l.message}</td>
                        <td>{new Date(l.sentAt).toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </section>
            )}

            {activeTab === "profile" && (
              <section>
                <h2>Profile Settings</h2>
                <p>Update your landlord identity and secure your account access.</p>
                <div className="split">
                  <div className="card inner-card">
                    <h3>Landlord Profile</h3>
                    <div className="form-grid">
                      <input placeholder="Name" value={profile.name} onChange={(e) => setProfile({ ...profile, name: e.target.value })} />
                      <input placeholder="Phone" value={profile.phone} onChange={(e) => setProfile({ ...profile, phone: e.target.value })} />
                      <button className="btn large" onClick={saveProfile}>Save Profile</button>
                    </div>
                  </div>
                  <div className="card inner-card">
                    <h3>Change Password</h3>
                    <div className="form-grid">
                      <input type="password" placeholder="Current password" value={passwordForm.oldPassword} onChange={(e) => setPasswordForm({ ...passwordForm, oldPassword: e.target.value })} />
                      <input type="password" placeholder="New password" value={passwordForm.newPassword} onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })} />
                      <button className="btn large" onClick={changePassword}>Update Password</button>
                    </div>
                  </div>
                </div>
              </section>
            )}
          </div>
        </section>
      </section>
    </main>
  );
}
