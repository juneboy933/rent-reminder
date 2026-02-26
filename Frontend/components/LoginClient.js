"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

const TOKEN_KEY = "rent_reminder_token";
const LANDLORD_KEY = "rent_reminder_landlord";
const API_KEY = "rent_reminder_api_base";
const DEFAULT_API = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:8000/api";

export default function LoginClient() {
  const router = useRouter();
  const [loginForm, setLoginForm] = useState({ phone: "", password: "" });
  const [message, setMessage] = useState("Login with your landlord credentials to continue.");
  const [apiBase, setApiBase] = useState(DEFAULT_API);

  useEffect(() => {
    const existing = window.localStorage.getItem(TOKEN_KEY);
    if (existing) router.replace("/dashboard");
    const storedApi = window.localStorage.getItem(API_KEY);
    if (storedApi) setApiBase(storedApi);
  }, [router]);

  async function request(path, options = {}) {
    const res = await fetch(`${apiBase}${path}`, {
      ...options,
      headers: { "Content-Type": "application/json", ...(options.headers || {}) },
    });
    const body = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(body.message || `Request failed (${res.status})`);
    return body;
  }

  async function login() {
    try {
      const data = await request("/landlords/login", { method: "POST", body: JSON.stringify(loginForm) });
      window.localStorage.setItem(TOKEN_KEY, data.token);
      window.localStorage.setItem(LANDLORD_KEY, JSON.stringify(data.landlord));
      window.localStorage.setItem(API_KEY, apiBase);
      router.replace("/dashboard");
    } catch (error) {
      setMessage(error.message);
    }
  }

  return (
    <main className="auth-page">
      <section className="auth-shell">
        <div className="logo-badge">RR</div>
        <h1>Landlord Login</h1>
        <p>Access your tenant portfolio, payment records, and reminder operations securely.</p>

        <div className="auth-form">
          <input placeholder="Phone number" value={loginForm.phone} onChange={(e) => setLoginForm({ ...loginForm, phone: e.target.value })} />
          <input type="password" placeholder="Password" value={loginForm.password} onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })} />
          <button className="btn large" onClick={login}>Login to Dashboard</button>
        </div>

        <div className="auth-links">
          <span>{message}</span>
          <Link href="/register">Need an account? Create one</Link>
          <Link href="/">Back to Home</Link>
        </div>
      </section>
    </main>
  );
}
