const configuredApiBaseUrl = import.meta.env.VITE_API_BASE_URL?.trim();
const productionApiBaseUrl = "https://ferixrgapi.ferixas.com";

export const API_BASE_URL = (configuredApiBaseUrl || (import.meta.env.PROD ? productionApiBaseUrl : "")).replace(/\/$/, "");

export function apiUrl(path: string) {
  return `${API_BASE_URL}${path}`;
}
