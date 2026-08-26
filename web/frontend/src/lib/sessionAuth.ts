import { COOKIE_NAME } from "../shared/const";

export function sessionTokenFromCookieString(raw: string | null | undefined) {
  if (!raw) return null;
  const prefix = `${COOKIE_NAME}=`;
  const pair = raw.split(";").find(item => item.trim().startsWith(prefix));
  return pair?.trim().slice(prefix.length) || null;
}

export function getSessionAuthorizationHeaders() {
  try {
    const token = sessionTokenFromCookieString(sessionStorage.getItem("manus-cookie"));
    return token ? { Authorization: `Bearer ${token}` } : {};
  } catch {
    return {};
  }
}
