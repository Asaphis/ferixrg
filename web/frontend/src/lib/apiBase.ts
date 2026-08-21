const configuredApiBaseUrl = import.meta.env.VITE_API_BASE_URL ?? "";

export const API_BASE_URL = configuredApiBaseUrl.replace(/\/$/, "");

export function apiUrl(path: string) {
  return `${API_BASE_URL}${path}`;
}
