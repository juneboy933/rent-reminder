"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

const TOKEN_KEY = "rent_reminder_token";
const API_KEY = "rent_reminder_api_base";
const DEFAULT_API = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:3000/api";

export default function RegisterClient() {
  const router = useRouter();
  const [registerForm, setRegisterForm] = useState({ name: "", phone: "", password: "" });
  const [message, setMessage] = useState("Create your landlord account to begin managing tenants.");
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

  async function register() {
    try {
      await request("/landlords/register", { method: "POST", body: JSON.stringify(registerForm) });
      setMessage("Account created successfully. Proceed to login.");
      setRegisterForm({ name: "", phone: "", password: "" });
    } catch (error) {
      setMessage(error.message);
    }
  }

  return (
    <main className="auth-page">
      <section className="auth-shell">
        <div className="logo-badge">RR</div>
        <h1>Create Landlord Account</h1>
        <p>Register once to unlock your dashboard for tenants, payment tracking, and reminder management.</p>

        <div className="auth-form">
          <input placeholder="Full name" value={registerForm.name} onChange={(e) => setRegisterForm({ ...registerForm, name: e.target.value })} />
          <input placeholder="Phone number" value={registerForm.phone} onChange={(e) => setRegisterForm({ ...registerForm, phone: e.target.value })} />
          <input type="password" placeholder="Password" value={registerForm.password} onChange={(e) => setRegisterForm({ ...registerForm, password: e.target.value })} />
          <button className="btn large" onClick={register}>Create Account</button>
        </div>

        <div className="auth-links">
          <span>{message}</span>
          <Link href="/login">Already registered? Login</Link>
          <Link href="/">Back to Home</Link>
        </div>
      </section>
    </main>
  );
}
