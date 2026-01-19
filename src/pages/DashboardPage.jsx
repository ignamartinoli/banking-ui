import React, { useEffect, useMemo, useState } from "react";
import {
  listAccounts,
  createAccount,
  listCurrencies,
  createTransfer,
  depositToAccount,
} from "../api/http.js";

export default function DashboardPage() {
  const [accounts, setAccounts] = useState([]);
  const [currencies, setCurrencies] = useState([]);

  const [err, setErr] = useState("");
  const [msg, setMsg] = useState("");

  // Create account form
  const [name, setName] = useState("");
  const [balance, setBalance] = useState(0);
  const [currencyId, setCurrencyId] = useState(""); // will be set after currencies load
  const [depositAccountId, setDepositAccountId] = useState("");
  const [depositAmount, setDepositAmount] = useState(0);

  // Transfer form
  const [fromId, setFromId] = useState(""); // select value
  const [toId, setToId] = useState(""); // typed account id
  const [amount, setAmount] = useState(0);

  const currencyById = useMemo(() => {
    const m = new Map();
    currencies.forEach((c) => m.set(c.id, c.code));
    return m;
  }, [currencies]);

  const refresh = async () => {
    const [accs, curs] = await Promise.all([listAccounts(), listCurrencies()]);

    // Optional: stable ordering (nice UX)
    curs.sort((a, b) => a.code.localeCompare(b.code));

    setAccounts(accs);
    setCurrencies(curs);
  };

  useEffect(() => {
    refresh().catch((e) => setErr(e.message));
  }, []);

  // Force currency selection to one of the 3 currencies (no "default" option in UI)
  useEffect(() => {
    if (currencies.length > 0 && !currencyId) {
      const ars = currencies.find((c) => c.code === "ARS");
      setCurrencyId(String((ars ?? currencies[0]).id));
    }
  }, [currencies, currencyId]);

  const onCreateAccount = async (e) => {
    e.preventDefault();
    setErr("");
    setMsg("");

    if (!name.trim()) {
      setErr("Account name is required.");
      return;
    }
    if (!currencyId) {
      setErr("Please select a currency.");
      return;
    }

    try {
      await createAccount({
        name: name.trim(),
        initial_balance_cents: Number(balance),
        currency_id: Number(currencyId),
      });

      setName("");
      setBalance(0);
      // keep currency selection as-is
      setMsg("Account created.");
      await refresh();
    } catch (e) {
      setErr(e.message);
    }
  };

  const onDeposit = async (e) => {
    e.preventDefault();
    setErr("");
    setMsg("");

    const accountId = Number(depositAccountId);
    const amountCents = Number(depositAmount);

    if (!Number.isInteger(accountId) || accountId <= 0) {
      setErr("Please enter a valid account ID to deposit into.");
      return;
    }
    if (!Number.isInteger(amountCents) || amountCents <= 0) {
      setErr("Deposit amount must be a positive integer (cents).");
      return;
    }

    try {
      await depositToAccount(accountId, amountCents);
      setMsg("Deposit completed.");
      setDepositAccountId("");
      setDepositAmount(0);
      await refresh();
    } catch (e) {
      setErr(e.message);
    }
  };

  const onTransfer = async (e) => {
    e.preventDefault();
    setErr("");
    setMsg("");

    const fromAccountId = Number(fromId);
    const toAccountId = Number(toId);
    const amountCents = Number(amount);

    if (!Number.isInteger(fromAccountId) || fromAccountId <= 0) {
      setErr("Please select a valid source account.");
      return;
    }
    if (!Number.isInteger(toAccountId) || toAccountId <= 0) {
      setErr("Please enter a valid destination account ID.");
      return;
    }
    if (!Number.isInteger(amountCents) || amountCents <= 0) {
      setErr("Amount must be a positive integer (cents).");
      return;
    }

    try {
      await createTransfer({
        from_account_id: fromAccountId,
        to_account_id: toAccountId,
        amount_cents: amountCents,
      });

      setMsg("Transfer completed.");
      setToId("");
      setAmount(0);
      await refresh();
    } catch (e) {
      setErr(e.message);
    }
  };

  return (
    <div style={{ display: "grid", gap: 24 }}>
      <h3>Dashboard</h3>

      {err && <p style={{ color: "crimson" }}>{err}</p>}
      {msg && <p style={{ color: "green" }}>{msg}</p>}

      <section>
        <h4>Accounts</h4>
        <table
          border="1"
          cellPadding="8"
          style={{ borderCollapse: "collapse", width: "100%" }}
        >
          <thead>
            <tr>
              <th>ID</th>
              <th>Name</th>
              <th>Currency</th>
              <th>Balance (cents)</th>
            </tr>
          </thead>
          <tbody>
            {accounts.map((a) => (
              <tr key={a.id}>
                <td>{a.id}</td>
                <td>{a.name}</td>
                <td>{currencyById.get(a.currency_id) ?? a.currency_id}</td>
                <td>{a.balance_cents}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section>
        <h4>Create account</h4>
        <form
          onSubmit={onCreateAccount}
          style={{ display: "grid", gap: 10, maxWidth: 420 }}
        >
          <input
            placeholder="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />

          <input
            placeholder="initial balance (cents)"
            type="number"
            min="0"
            value={balance}
            onChange={(e) => setBalance(e.target.value)}
          />

          <select
            required
            value={currencyId}
            onChange={(e) => setCurrencyId(e.target.value)}
            disabled={currencies.length === 0}
          >
            {currencies.map((c) => (
              <option key={c.id} value={c.id}>
                {c.code}
              </option>
            ))}
          </select>

          <button type="submit" disabled={currencies.length === 0}>
            Create
          </button>
        </form>
      </section>

      <section>
        <h4>Deposit</h4>

        <form
          onSubmit={onDeposit}
          style={{ display: "grid", gap: 10, maxWidth: 420 }}
        >
          <select
            value={depositAccountId}
            onChange={(e) => setDepositAccountId(e.target.value)}
          >
            <option value="">Select account…</option>
            {accounts.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name} — {currencyById.get(a.currency_id) ?? a.currency_id} — balance:{" "}
                {a.balance_cents}
              </option>
            ))}
          </select>

          <input
            placeholder="amount (cents)"
            type="number"
            min="1"
            value={depositAmount}
            onChange={(e) => setDepositAmount(e.target.value)}
          />

          <button type="submit">Deposit</button>
        </form>
      </section>

      <section>
        <h4>Make transfer</h4>
        <form
          onSubmit={onTransfer}
          style={{ display: "grid", gap: 10, maxWidth: 420 }}
        >
          <select value={fromId} onChange={(e) => setFromId(e.target.value)}>
            <option value="">From account…</option>
            {accounts.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name} — {currencyById.get(a.currency_id) ?? a.currency_id} —
                balance: {a.balance_cents}
              </option>
            ))}
          </select>

          <input
            placeholder="To account ID…"
            inputMode="numeric"
            value={toId}
            onChange={(e) => setToId(e.target.value.replace(/\D/g, ""))}
          />

          <input
            placeholder="amount (cents)"
            type="number"
            min="1"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />

          <button type="submit">Transfer</button>
        </form>
      </section>
    </div>
  );
}
