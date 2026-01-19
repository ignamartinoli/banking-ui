import React, { useEffect, useMemo, useState } from "react";
import ReactSelect from "react-select";
import {
  listAccounts,
  createAccount,
  listCurrencies,
  createTransfer,
  depositToAccount,
} from "../api/http.js";
import { Card, Field, Input, Button, Alert } from "../components/ui.jsx";

/** -----------------------------
 * Money helpers (major <-> cents)
 * ------------------------------ */
function centsToMajor(cents) {
  const n = Number(cents ?? 0);
  return (n / 100).toFixed(2);
}

function majorToCents(value) {
  const s = String(value ?? "").trim().replace(",", ".");
  if (!s) return NaN;

  const n = Number(s);
  if (!Number.isFinite(n)) return NaN;

  return Math.round(n * 100);
}

/** -----------------------------
 * react-select glass styles
 * Keep these centralized = maintainable
 * ------------------------------ */
const glassSelectStyles = {
  control: (base, state) => ({
    ...base,
    backgroundColor: "rgba(0,0,0,0.18)",
    borderColor: state.isFocused ? "rgba(255,255,255,0.25)" : "rgba(255,255,255,0.14)",
    boxShadow: state.isFocused ? "0 0 0 4px rgba(139, 92, 246, 0.18)" : "none",
    borderRadius: 12,
    minHeight: 44,
    backdropFilter: "blur(14px)",
    WebkitBackdropFilter: "blur(14px)",
  }),
  menu: (base) => ({
    ...base,
    backgroundColor: "rgba(12, 16, 32, 0.96)",
    border: "1px solid rgba(255,255,255,0.14)",
    boxShadow: "0 18px 50px rgba(0,0,0,0.45)",
    borderRadius: 12,
    overflow: "hidden",
    backdropFilter: "blur(16px)",
    WebkitBackdropFilter: "blur(16px)",
  }),
  option: (base, state) => ({
    ...base,
    backgroundColor: state.isSelected
      ? "rgba(139, 92, 246, 0.35)"
      : state.isFocused
        ? "rgba(255,255,255,0.10)"
        : "transparent",
    color: "rgba(255,255,255,0.92)",
    cursor: "pointer",
  }),
  singleValue: (base) => ({
    ...base,
    color: "rgba(255,255,255,0.92)",
  }),
  placeholder: (base) => ({
    ...base,
    color: "rgba(255,255,255,0.55)",
  }),
  input: (base) => ({
    ...base,
    color: "rgba(255,255,255,0.92)",
  }),
  dropdownIndicator: (base) => ({
    ...base,
    color: "rgba(255,255,255,0.75)",
    ":hover": { color: "rgba(255,255,255,0.92)" },
  }),
  indicatorSeparator: (base) => ({
    ...base,
    backgroundColor: "rgba(255,255,255,0.14)",
  }),
  clearIndicator: (base) => ({
    ...base,
    color: "rgba(255,255,255,0.75)",
    ":hover": { color: "rgba(255,255,255,0.92)" },
  }),
  valueContainer: (base) => ({
    ...base,
    paddingLeft: 10,
    paddingRight: 10,
  }),
};

const reactSelectTheme = (theme) => ({
  ...theme,
  borderRadius: 12,
  colors: {
    ...theme.colors,
    primary: "rgba(139, 92, 246, 0.75)",
    primary25: "rgba(255,255,255,0.10)",
    neutral0: "rgba(12,16,32,0.96)",
    neutral80: "rgba(255,255,255,0.92)",
    neutral20: "rgba(255,255,255,0.14)",
    neutral30: "rgba(255,255,255,0.25)",
  },
});

/** -----------------------------
 * Small wrapper to keep usage consistent
 * ------------------------------ */
function GlassSelect({
  placeholder,
  options,
  value,
  onChange,
  isDisabled,
  isClearable = false,
  isSearchable = false,
  name,
}) {
  return (
    <ReactSelect
      name={name}
      placeholder={placeholder}
      options={options}
      value={value}
      onChange={onChange}
      isDisabled={isDisabled}
      isClearable={isClearable}
      isSearchable={isSearchable}
      styles={glassSelectStyles}
      theme={reactSelectTheme}
      // Important so the menu appears above cards
      menuPortalTarget={document.body}
      menuPosition="fixed"
    />
  );
}

export default function DashboardPage() {
  const [accounts, setAccounts] = useState([]);
  const [currencies, setCurrencies] = useState([]);

  const [err, setErr] = useState("");
  const [msg, setMsg] = useState("");

  // Create account form
  const [name, setName] = useState("");
  const [balanceMajor, setBalanceMajor] = useState("0.00");
  const [currencyId, setCurrencyId] = useState(""); // string id

  // Deposit form
  const [depositAccountId, setDepositAccountId] = useState("");
  const [depositAmountMajor, setDepositAmountMajor] = useState("0.00");

  // Transfer form
  const [fromId, setFromId] = useState("");
  const [toId, setToId] = useState("");
  const [amountMajor, setAmountMajor] = useState("0.00");

  const currencyById = useMemo(() => {
    const m = new Map();
    currencies.forEach((c) => m.set(c.id, c.code));
    return m;
  }, [currencies]);

  const accountsById = useMemo(() => {
    const m = new Map();
    accounts.forEach((a) => m.set(a.id, a));
    return m;
  }, [accounts]);

  /** -----------------------------
   * react-select options
   * Keep "value" as string to match state
   * ------------------------------ */
  const currencyOptions = useMemo(
    () =>
      currencies
        .slice()
        .sort((a, b) => a.code.localeCompare(b.code))
        .map((c) => ({ value: String(c.id), label: c.code })),
    [currencies]
  );

  const accountOptions = useMemo(
    () =>
      accounts.map((a) => ({
        value: String(a.id),
        label: `${a.name} — ${currencyById.get(a.currency_id) ?? a.currency_id} — balance: ${centsToMajor(
          a.balance_cents
        )}`,
      })),
    [accounts, currencyById]
  );

  const selectedCurrencyOption = useMemo(
    () => currencyOptions.find((o) => o.value === String(currencyId)) ?? null,
    [currencyOptions, currencyId]
  );

  const selectedDepositAccountOption = useMemo(
    () => accountOptions.find((o) => o.value === String(depositAccountId)) ?? null,
    [accountOptions, depositAccountId]
  );

  const selectedFromAccountOption = useMemo(
    () => accountOptions.find((o) => o.value === String(fromId)) ?? null,
    [accountOptions, fromId]
  );

  const kpis = useMemo(() => {
    const totalAccounts = accounts.length;

    const totals = new Map(); // code -> total cents
    for (const a of accounts) {
      const code = currencyById.get(a.currency_id) ?? String(a.currency_id);
      totals.set(code, (totals.get(code) ?? 0) + (a.balance_cents ?? 0));
    }

    const balanceLabels = Array.from(totals.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([code, sumCents]) => ({ code, sumCents }));

    return { totalAccounts, balanceLabels };
  }, [accounts, currencyById]);

  const refresh = async () => {
    const [accs, curs] = await Promise.all([listAccounts(), listCurrencies()]);
    setAccounts(accs);
    setCurrencies(curs);
  };

  useEffect(() => {
    refresh().catch((e) => setErr(e?.message ?? String(e)));
  }, []);

  // Default currency selection to ARS when currencies arrive
  useEffect(() => {
    if (currencies.length > 0 && !currencyId) {
      const ars = currencies.find((c) => c.code === "ARS");
      setCurrencyId(String((ars ?? currencies[0]).id));
    }
  }, [currencies, currencyId]);

  const clearAlerts = () => {
    setErr("");
    setMsg("");
  };

  const onCreateAccount = async (e) => {
    e.preventDefault();
    clearAlerts();

    if (!name.trim()) {
      setErr("Account name is required.");
      return;
    }
    if (!currencyId) {
      setErr("Please select a currency.");
      return;
    }

    const initialCents = majorToCents(balanceMajor);
    if (!Number.isInteger(initialCents) || initialCents < 0) {
      setErr("Initial balance must be a valid number (e.g. 0, 10, 10.50).");
      return;
    }

    try {
      await createAccount({
        name: name.trim(),
        initial_balance_cents: initialCents,
        currency_id: Number(currencyId),
      });

      setName("");
      setBalanceMajor("0.00");
      setMsg("Account created.");
      await refresh();
    } catch (e) {
      setErr(e?.message ?? String(e));
    }
  };

  const onDeposit = async (e) => {
    e.preventDefault();
    clearAlerts();

    const accountId = Number(depositAccountId);
    if (!Number.isInteger(accountId) || accountId <= 0) {
      setErr("Please select a valid account to deposit into.");
      return;
    }

    const amountCents = majorToCents(depositAmountMajor);
    if (!Number.isInteger(amountCents) || amountCents <= 0) {
      setErr("Deposit amount must be > 0 (e.g. 1, 10, 10.50).");
      return;
    }

    try {
      await depositToAccount(accountId, amountCents);
      setMsg("Deposit completed.");
      setDepositAccountId("");
      setDepositAmountMajor("0.00");
      await refresh();
    } catch (e) {
      setErr(e?.message ?? String(e));
    }
  };

  const onTransfer = async (e) => {
    e.preventDefault();
    clearAlerts();

    const fromAccountId = Number(fromId);
    const toAccountId = Number(toId);

    if (!Number.isInteger(fromAccountId) || fromAccountId <= 0) {
      setErr("Please select a valid source account.");
      return;
    }
    if (!Number.isInteger(toAccountId) || toAccountId <= 0) {
      setErr("Please enter a valid destination account ID.");
      return;
    }

    const amountCents = majorToCents(amountMajor);
    if (!Number.isInteger(amountCents) || amountCents <= 0) {
      setErr("Amount must be > 0 (e.g. 1, 10, 10.50).");
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
      setAmountMajor("0.00");
      await refresh();
    } catch (e) {
      setErr(e?.message ?? String(e));
    }
  };

  const fromAccount = fromId ? accountsById.get(Number(fromId)) : null;
  const fromCurrency = fromAccount ? currencyById.get(fromAccount.currency_id) ?? "" : "";

  return (
    <div className="grid" style={{ gap: 16 }}>
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between" }}>
        <div>
          <h3 style={{ margin: 0 }}>Dashboard</h3>
          <div className="subtle">
            Amounts are entered in major units (e.g. 10.50). Stored as cents in the backend.
          </div>
        </div>
      </div>

      {err && <Alert kind="danger">{err}</Alert>}
      {msg && <Alert kind="ok">{msg}</Alert>}

      <div className="kpis">
        <div className="glass kpi">
          <div className="label">Accounts</div>
          <div className="value">{kpis.totalAccounts}</div>
        </div>

        {kpis.balanceLabels.slice(0, 3).map((b) => (
          <div key={b.code} className="glass kpi">
            <div className="label">Total balance ({b.code})</div>
            <div className="value">{centsToMajor(b.sumCents)}</div>
          </div>
        ))}

        {kpis.balanceLabels.length === 0 && (
          <div className="glass kpi">
            <div className="label">Total balance</div>
            <div className="value">—</div>
          </div>
        )}
      </div>

      <div className="grid-2">
        <Card title="Accounts" subtitle="Your accounts and current balances.">
          <table className="table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Currency</th>
                <th>Balance</th>
              </tr>
            </thead>
            <tbody>
              {accounts.length === 0 ? (
                <tr>
                  <td colSpan={3} className="subtle">
                    No accounts yet. Create one on the right.
                  </td>
                </tr>
              ) : (
                accounts.map((a) => (
                  <tr key={a.id}>
                    <td>{a.name}</td>
                    <td>{currencyById.get(a.currency_id) ?? a.currency_id}</td>
                    <td>{centsToMajor(a.balance_cents)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
          <div className="subtle" style={{ marginTop: 10 }}>
            Transfers are rejected if accounts use different currencies.
          </div>
        </Card>

        <div className="grid">
          <Card title="Create account" subtitle="Pick a currency and set an initial balance.">
            <form onSubmit={onCreateAccount} className="row">
              <Field label="Name">
                <Input
                  placeholder="e.g. Savings"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </Field>

              <Field label="Initial balance">
                <Input
                  inputMode="decimal"
                  placeholder="e.g. 1000.00"
                  value={balanceMajor}
                  onChange={(e) => setBalanceMajor(e.target.value)}
                />
              </Field>

              <Field label="Currency">
                <GlassSelect
                  name="currency"
                  placeholder="Select currency…"
                  options={currencyOptions}
                  value={selectedCurrencyOption}
                  onChange={(opt) => setCurrencyId(opt?.value ?? "")}
                  isDisabled={currencyOptions.length === 0}
                  isSearchable={false}
                />
              </Field>

              <Button type="submit" disabled={currencyOptions.length === 0}>
                Create
              </Button>
            </form>
          </Card>

          <Card title="Deposit" subtitle="Add funds to one of your accounts.">
            <form onSubmit={onDeposit} className="row">
              <Field label="Account">
                <GlassSelect
                  name="depositAccount"
                  placeholder="Select account…"
                  options={accountOptions}
                  value={selectedDepositAccountOption}
                  onChange={(opt) => setDepositAccountId(opt?.value ?? "")}
                  isDisabled={accountOptions.length === 0}
                  isSearchable
                  isClearable
                />
              </Field>

              <Field label="Amount">
                <Input
                  inputMode="decimal"
                  placeholder="e.g. 50.00"
                  value={depositAmountMajor}
                  onChange={(e) => setDepositAmountMajor(e.target.value)}
                />
              </Field>

              <Button type="submit">Deposit</Button>
            </form>
          </Card>

          <Card title="Transfer" subtitle="Destination is entered by account ID.">
            <form onSubmit={onTransfer} className="row">
              <Field label="From account">
                <GlassSelect
                  name="fromAccount"
                  placeholder="Select account…"
                  options={accountOptions}
                  value={selectedFromAccountOption}
                  onChange={(opt) => setFromId(opt?.value ?? "")}
                  isDisabled={accountOptions.length === 0}
                  isSearchable
                  isClearable
                />
              </Field>

              <Field label="To account ID">
                <Input
                  placeholder="e.g. 12"
                  inputMode="numeric"
                  value={toId}
                  onChange={(e) => setToId(e.target.value.replace(/\D/g, ""))}
                />
              </Field>

              <Field label="Amount">
                <Input
                  inputMode="decimal"
                  placeholder="e.g. 10.50"
                  value={amountMajor}
                  onChange={(e) => setAmountMajor(e.target.value)}
                />
              </Field>

              {fromCurrency && (
                <div className="subtle">
                  Source currency: <b>{fromCurrency}</b> (destination must match)
                </div>
              )}

              <Button type="submit">Transfer</Button>
            </form>
          </Card>
        </div>
      </div>
    </div>
  );
}
