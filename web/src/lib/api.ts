const PUBLIC_API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost/api";
const INTERNAL_API_BASE_URL = process.env.API_INTERNAL_URL || "http://backend:8000";

function getApiBaseUrl(): string {
  if (typeof window === "undefined") {
    return INTERNAL_API_BASE_URL;
  }
  return PUBLIC_API_BASE_URL;
}

export async function apiGet<T>(path: string, token?: string): Promise<T> {
  const response = await fetch(`${getApiBaseUrl()}${path}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`API GET failed: ${response.status}`);
  }

  return (await response.json()) as T;
}

export async function apiPost<T>(path: string, body: unknown, token?: string): Promise<T> {
  const response = await fetch(`${getApiBaseUrl()}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(body),
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`API POST failed: ${response.status}`);
  }

  return (await response.json()) as T;
}

export async function apiPut<T>(path: string, body: unknown, token?: string): Promise<T> {
  const response = await fetch(`${getApiBaseUrl()}${path}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(body),
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`API PUT failed: ${response.status}`);
  }

  return (await response.json()) as T;
}
