const API_BASE = import.meta.env.VITE_API_BASE_URL;

export function getToken() {
	return localStorage.getItem("token");
}

export function setToken(token) {
	localStorage.setItem("token", token);
}

export function clearToken() {
	localStorage.removeItem("token");
}

async function request(path, { method = "GET", body, auth = true, headers: extraHeaders } = {}) {
	const headers = { ...(extraHeaders ?? {}) };

	// Only set JSON content-type when we actually send JSON
	if (body && !(body instanceof URLSearchParams) && !headers["Content-Type"]) {
		headers["Content-Type"] = "application/json";
	}

	if (auth) {
		const token = getToken();
		if (token) headers.Authorization = `Bearer ${token}`;
	}

	const res = await fetch(`${API_BASE}${path}`, {
		method,
		headers,
		body: body
			? body instanceof URLSearchParams
				? body.toString()
				: JSON.stringify(body)
			: undefined,
	});

	const text = await res.text();
	const data = text ? JSON.parse(text) : null;

	if (!res.ok) {
		// Prefer FastAPI's "detail" but keep full payload if needed
		const msg =
			(typeof data?.detail === "string" && data.detail) ||
			(Array.isArray(data?.detail) && data.detail.map((d) => d.msg).join(", ")) ||
			`HTTP ${res.status}`;
		const err = new Error(msg);
		err.payload = data;
		throw err;
	}

	return data;
}

// Auth
export async function register(email, password) {
	return request("/auth/register", { method: "POST", body: { email, password }, auth: false });
}

export async function login(username, password) {
	// OAuth2PasswordRequestForm expects x-www-form-urlencoded:
	const form = new URLSearchParams();
	form.set("username", username);
	form.set("password", password);

	return request("/auth/login", {
		method: "POST",
		body: form,
		auth: false,
		headers: { "Content-Type": "application/x-www-form-urlencoded" },
	});
}

// Currencies
export async function listCurrencies() {
	return request("/currencies");
}

// Accounts
export async function listAccounts() {
	return request("/accounts");
}

export async function createAccount({ name, initial_balance_cents, currency_id }) {
	return request("/accounts", { method: "POST", body: { name, initial_balance_cents, currency_id } });
}

export async function depositToAccount(accountId, amount_cents) {
	return request(`/accounts/${accountId}/deposit`, {
		method: "POST",
		body: { amount_cents },
	});
}

// Transfers
export async function createTransfer({ from_account_id, to_account_id, amount_cents }) {
	return request("/transfers", { method: "POST", body: { from_account_id, to_account_id, amount_cents } });
}
