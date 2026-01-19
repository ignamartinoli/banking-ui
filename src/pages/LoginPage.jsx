import React, { useState } from "react";
import { login, setToken } from "../api/http.js";
import { useNavigate } from "react-router-dom";

export default function LoginPage() {
  const nav = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");

  const onSubmit = async (e) => {
    e.preventDefault();
    setErr("");
    try {
      const res = await login(email, password); // username=email
      setToken(res.access_token);
      nav("/dashboard");
    } catch (ex) {
      setErr(ex.message ?? "Login failed");
    }
  };

  return (
    <div>
      <h3>Login</h3>
      {err && <p style={{ color: "crimson" }}>{err}</p>}
      <form onSubmit={onSubmit} style={{ display: "grid", gap: 10, maxWidth: 360 }}>
        <input placeholder="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        <input placeholder="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
        <button type="submit">Login</button>
      </form>
    </div>
  );
}
