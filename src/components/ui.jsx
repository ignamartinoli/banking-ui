import React from "react";

export function Card({ title, subtitle, children }) {
  return (
    <section className="glass card">
      {title && <h3>{title}</h3>}
      {subtitle && <div className="subtle" style={{ marginBottom: 12 }}>{subtitle}</div>}
      {children}
    </section>
  );
}

export function Field({ label, children }) {
  return (
    <div className="field">
      {label && <label>{label}</label>}
      {children}
    </div>
  );
}

export function Input(props) {
  return <input className="input" {...props} />;
}

export function Select(props) {
  return <select className="select" {...props} />;
}

export function Button({ variant, ...props }) {
  const cls = variant === "ghost" ? "btn btn-ghost" : "btn";
  return <button className={cls} {...props} />;
}

export function Alert({ kind = "danger", children }) {
  const cls = kind === "ok" ? "alert alert-ok" : "alert alert-danger";
  return <div className={cls}>{children}</div>;
}
