import React from "react";
import { Routes, Route, Navigate, Link, useNavigate, useLocation } from "react-router-dom";
import RegisterPage from "./pages/RegisterPage.jsx";
import LoginPage from "./pages/LoginPage.jsx";
import DashboardPage from "./pages/DashboardPage.jsx";
import { getToken, clearToken } from "./api/http.js";
import { Button } from "./components/ui.jsx";

function PrivateRoute({ children }) {
  return getToken() ? children : <Navigate to="/login" replace />;
}

export default function App() {
  const nav = useNavigate();
  const loc = useLocation();

  const authed = !!getToken();

  const onLogout = () => {
    clearToken();
    nav("/login");
  };

  return (
    <div className="container">
      <header className="nav">
        <div className="brand">
          <div className="brand-badge" />
          <div>
            <h1>Banking UI</h1>
            <div className="subtle">FastAPI • JWT • Transactions • /api/v1</div>
          </div>
        </div>

        <nav className="nav-links">
          {authed && <Link to="/dashboard">Dashboard</Link>}
          {!authed && <Link to="/login">Login</Link>}
          {!authed && <Link to="/register">Register</Link>}
          {authed && <Button variant="ghost" onClick={onLogout}>Logout</Button>}
        </nav>
      </header>

      <Routes>
        <Route path="/" element={<Navigate to={authed ? "/dashboard" : "/login"} replace />} />
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
        <Route path="*" element={<Navigate to={loc.pathname.startsWith("/dashboard") ? "/dashboard" : "/"} replace />} />
      </Routes>
    </div>
  );
}
