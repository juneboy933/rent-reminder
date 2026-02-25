"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const TOKEN_KEY = "rent_reminder_token";
const LANDLORD_KEY = "rent_reminder_landlord";
const API_KEY = "rent_reminder_api_base";
const DEFAULT_API = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:3000/api";

export default function LoginClient() {
  const router = useRouter();
  const [apiBase, setApiBase] = useState(DEFAULT_API);
  const [registerForm, setRegisterForm] = useState({ name: "", phone: "", password: "" });
  const [loginForm, setLoginForm] = useState({ phone: "", password: "" });
  const [message, setMessage] = useState("Set API base and login.");

  useEffect(() => {
    const stored = window.localStorage.getItem(API_KEY);
    if (stored) setApiBase(stored);
  }, []);

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
      setMessage("Account created. You can login now.");
    } catch (error) {
      setMessage(error.message);
    }
  }

  async function login() {
    try {
      const data = await request("/landlords/login", { method: "POST", body: JSON.stringify(loginForm) });
      localStorage.setItem(TOKEN_KEY, data.token);
      localStorage.setItem(LANDLORD_KEY, JSON.stringify(data.landlord));
      localStorage.setItem(API_KEY, apiBase);
      router.replace("/");
    } catch (error) {
      setMessage(error.message);
    }
  }

  return (
    <div className="login-wrap">
      <div className="login-card">
        <h1>Rent Reminder</h1>
        <p>Landlord Sign In</p>

        <div className="col">
          <label>API Base</label>
          <input value={apiBase} onChange={(e) => setApiBase(e.target.value)} placeholder="http://localhost:3000/api" />
        </div>

        <div className="split">
          <div className="card">
            <h2>Register</h2>
            <div className="col">
              <input placeholder="Name" value={registerForm.name} onChange={(e) => setRegisterForm({ ...registerForm, name: e.target.value })} />
              <input placeholder="Phone" value={registerForm.phone} onChange={(e) => setRegisterForm({ ...registerForm, phone: e.target.value })} />
              <input type="password" placeholder="Password" value={registerForm.password} onChange={(e) => setRegisterForm({ ...registerForm, password: e.target.value })} />
              <button onClick={register}>Create Account</button>
            </div>
          </div>

          <div className="card">
            <h2>Login</h2>
            <div className="col">
              <input placeholder="Phone" value={loginForm.phone} onChange={(e) => setLoginForm({ ...loginForm, phone: e.target.value })} />
              <input type="password" placeholder="Password" value={loginForm.password} onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })} />
              <button onClick={login}>Login</button>
            </div>
          </div>
        </div>

        <small>{message}</small>
      </div>
    </div>
  );
}


