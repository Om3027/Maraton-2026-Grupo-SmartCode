import * as SecureStore from "expo-secure-store";

export const BASE_URL =
  process.env.EXPO_PUBLIC_API_URL ||
  "https://smartcode-maraton-app-c7f9asg3badvf8fr.spaincentral-01.azurewebsites.net";
const TOKEN_KEY = "rs_token";

export const tokenStore = {
  get: () => SecureStore.getItemAsync(TOKEN_KEY),
  set: (token) => SecureStore.setItemAsync(TOKEN_KEY, token),
  clear: () => SecureStore.deleteItemAsync(TOKEN_KEY),
};

export class ApiError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

export async function api(path, { method = "GET", body } = {}) {
  const token = await tokenStore.get();
  const headers = { "Content-Type": "application/json" };
  if (token) headers.Authorization = `Bearer ${token}`;
  let response;
  try {
    response = await fetch(`${BASE_URL}/api${path}`, {
      method,
      headers,
      cache: "no-store",
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new ApiError(0, "Sin conexión a internet. Seguimos intentando.");
  }
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new ApiError(response.status, data.error || "Algo salió mal. Intenta de nuevo.");
  return data;
}
