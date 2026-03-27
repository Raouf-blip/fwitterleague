import { supabase } from './supabase'
import { clearTokenCache } from '../composables/useAuth'

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000/api/v1";

async function fetchWithTimeout(
  url: string,
  options: any = {},
  timeout = 60000,
) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    clearTimeout(id);
    return response;
  } catch (error: any) {
    clearTimeout(id);
    if (error.name === "AbortError") {
      throw new Error("La requête a expiré (Timeout)");
    }
    throw error;
  }
}

async function authenticatedFetch(
  url: string,
  options: any,
  token?: string,
): Promise<Response> {
  if (token) options.headers["Authorization"] = `Bearer ${token}`;
  const res = await fetchWithTimeout(url, options);

  if (res.status === 401 && token) {
    clearTokenCache();
    const { data: { session } } = await supabase.auth.refreshSession();
    if (session?.access_token) {
      options.headers["Authorization"] = `Bearer ${session.access_token}`;
      return fetchWithTimeout(url, options);
    }
  }

  return res;
}

export const api = {
  async get(endpoint: string, token?: string) {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    const res = await authenticatedFetch(`${API_URL}${endpoint}`, { headers }, token);
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },

  async patch(endpoint: string, body: any, token?: string) {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    const res = await authenticatedFetch(`${API_URL}${endpoint}`, {
      method: "PATCH",
      headers,
      body: JSON.stringify(body),
    }, token);
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },

  async post(endpoint: string, body: any, token?: string) {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    const res = await authenticatedFetch(`${API_URL}${endpoint}`, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
    }, token);
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },

  async put(endpoint: string, body: any, token?: string) {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };

    const res = await authenticatedFetch(`${API_URL}${endpoint}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify(body),
    }, token);
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },

  async delete(endpoint: string, token?: string) {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    const res = await authenticatedFetch(`${API_URL}${endpoint}`, {
      method: "DELETE",
      headers,
    }, token);
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },
};
