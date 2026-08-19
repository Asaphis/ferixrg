export const AUTH_DEMO_SESSION_KEY = "ferixrg-auth-demo-session";

export function hasSimulatedSession() {
  return typeof window !== "undefined" && window.localStorage.getItem(AUTH_DEMO_SESSION_KEY) === "active";
}

export function startSimulatedSession() {
  window.localStorage.setItem(AUTH_DEMO_SESSION_KEY, "active");
}

export function clearSimulatedSession() {
  window.localStorage.removeItem(AUTH_DEMO_SESSION_KEY);
}
