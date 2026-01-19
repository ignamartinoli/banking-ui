import React, { useState } from "react";
import { register, setToken } from "../api/http.js";
import { useNavigate } from "react-router-dom";
import { Card, Field, Input, Button, Alert } from "../components/ui.jsx";

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
      setErr(ex?.message ?? "Registration failed");
    }
  };

  return (
    <div className="grid" style={{ maxWidth: 520 }}>
      <Card
        title="Register"
        subtitle="Creates a user and returns a JWT token."
      >
        {err && <Alert kind="danger">{err}</Alert>}
        <form onSubmit={onSubmit} className="row" style={{ marginTop: 12 }}>
          <Field label="Email">
            <Input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@domain.com" />
          </Field>
          <Field label="Password">
            <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password123_" />
          </Field>
          <Button type="submit">Create account</Button>
        </form>
      </Card>
    </div>
  );
}
