import React from "react";
import { Routes, Route, Navigate, Link, useNavigate } from "react-router-dom";
import RegisterPage from "./pages/RegisterPage.jsx";
import LoginPage from "./pages/LoginPage.jsx";
import DashboardPage from "./pages/DashboardPage.jsx";
import { getToken, clearToken } from "./api/http.js";

function PrivateRoute({ children }) {
  return getToken() ? children : <Navigate to="/login" replace />;
}

export default function App() {
  const nav = useNavigate();

  const onLogout = () => {
    clearToken();
    nav("/login");
  };

  return (
    <div style={{ maxWidth: 900, margin: "40px auto", fontFamily: "system-ui" }}>
      <header style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 24 }}>
        <h2 style={{ marginRight: "auto" }}>Banking UI</h2>
        <Link to="/dashboard">Dashboard</Link>
        <Link to="/login">Login</Link>
        <Link to="/register">Register</Link>
        {getToken() && <button onClick={onLogout}>Logout</button>}
      </header>

      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route
          path="/dashboard"
          element={
            <PrivateRoute>
              <DashboardPage />
            </PrivateRoute>
          }
        />
      </Routes>
    </div>
  );
}
