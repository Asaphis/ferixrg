const configuredApiBaseUrl = import.meta.env.VITE_API_BASE_URL?.trim();
const productionApiBaseUrl = "https://ferixrgapi.ferixas.com";

// Production must never fall back to the frontend origin. A missing build-time
// variable previously caused every REST request to hit ferixrg.ferixas.com,
// which returned HTML and produced the same generic error across the app.
export const API_BASE_URL = (configuredApiBaseUrl || (import.meta.env.PROD ? productionApiBaseUrl : "")).replace(/\/$/, "");

export function apiUrl(path: string) {
  return `${API_BASE_URL}${path}`;
}
