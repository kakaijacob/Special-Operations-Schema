/**
 * Shared API client for Project Noir server mode.
 */

const API = {
  async me() {
    const res = await fetch("/api/me", { credentials: "include" });
    return res.json();
  },
  async login(username, password) {
    const res = await fetch("/api/login", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Login failed");
    return data;
  },
  async logout() {
    await fetch("/api/logout", { method: "POST", credentials: "include" });
  },
  async state() {
    const res = await fetch("/api/state", { credentials: "include" });
    if (!res.ok) throw new Error("Could not load books");
    return res.json();
  },
  async createOrder(payload) {
    const res = await fetch("/api/orders", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Could not save order");
    return data;
  },
  async updateOrder(id, payload) {
    const res = await fetch(`/api/orders/${encodeURIComponent(id)}`, {
      method: "PUT",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Could not update order");
    return data;
  },
  async deleteOrder(id) {
    const res = await fetch(`/api/orders/${encodeURIComponent(id)}`, {
      method: "DELETE",
      credentials: "include",
    });
    if (!res.ok) throw new Error("Could not delete order");
  },
  async createExp(payload) {
    const res = await fetch("/api/expenditures", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Could not save expenditure");
    return data;
  },
  async updateExp(id, payload) {
    const res = await fetch(`/api/expenditures/${encodeURIComponent(id)}`, {
      method: "PUT",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Could not update expenditure");
    return data;
  },
  async deleteExp(id) {
    const res = await fetch(`/api/expenditures/${encodeURIComponent(id)}`, {
      method: "DELETE",
      credentials: "include",
    });
    if (!res.ok) throw new Error("Could not delete expenditure");
  },
  async updateBalance(payload) {
    const res = await fetch("/api/balance", {
      method: "PUT",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Could not update balance sheet");
    return data;
  },
  async health() {
    try {
      const res = await fetch("/api/health", { credentials: "include" });
      return res.ok;
    } catch {
      return false;
    }
  },
};

export default API;
