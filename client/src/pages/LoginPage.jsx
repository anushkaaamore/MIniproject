import { useState } from "react";
import { api } from "../api/client";

export default function LoginPage({ onLogin }) {
  const [mode, setMode] = useState("login");
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState("");

  const submit = async () => {
    setError("");
    try {
      if (mode === "register") {
        await api.post("/auth/register", form);
      }
      const res = await api.post("/auth/login", { email: form.email, password: form.password });
      localStorage.setItem("teacher_token", res.data.token);
      localStorage.setItem("teacher_name", res.data.teacher.name);
      onLogin();
    } catch (e) {
      setError(e?.response?.data?.message || "Authentication failed");
    }
  };

  return (
    <div className="auth-shell">
      <div className="auth-card">
        <h2 className="auth-title">{mode === "login" ? "Teacher Login" : "Teacher Registration"}</h2>
        <p className="auth-subtitle">Secure access to exam-network malpractice monitoring</p>
        <div className="grid">
          {mode === "register" && (
            <div className="field">
              <label>Name</label>
              <input
                className="input"
                placeholder="e.g. Dr. Anushka"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>
          )}
          <div className="field">
            <label>Email</label>
            <input
              className="input"
              placeholder="name@college.edu"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
          </div>
          <div className="field">
            <label>Password</label>
            <input
              className="input"
              type="password"
              placeholder="Enter password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
            />
          </div>
        </div>
        <div className="actions" style={{ marginTop: 14 }}>
          <button className="btn btn-primary" onClick={submit}>
            {mode === "login" ? "Login" : "Register & Login"}
          </button>
          <button className="btn btn-ghost" onClick={() => setMode(mode === "login" ? "register" : "login")}>
            Switch to {mode === "login" ? "Register" : "Login"}
          </button>
        </div>
        {error && <p className="error">{error}</p>}
      </div>
    </div>
  );
}
