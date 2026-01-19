import React, { useState } from "react";
import { register, setToken } from "../api/http.js";
import { useNavigate } from "react-router-dom";

export default function RegisterPage() {
  const nav = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");

  const onSubmit = async (e) => {
    e.preventDefault();
    setErr("");
    try {
      const res = await register(email, password);
      setToken(res.access_token);
      nav("/dashboard");
    } catch (ex) {
      setErr(ex.message);
    }
  };

  return (
    <div>
      <h3>Register</h3>
      {err && <p style={{ color: "crimson" }}>{err}</p>}
      <form onSubmit={onSubmit} style={{ display: "grid", gap: 10, maxWidth: 360 }}>
        <input placeholder="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        <input placeholder="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
        <button type="submit">Create account</button>
      </form>
    </div>
  );
}
