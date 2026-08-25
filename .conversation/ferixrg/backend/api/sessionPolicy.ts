import { ONE_YEAR_MS } from "@shared/const";

export const REMEMBERED_SESSION_TTL_MS = ONE_YEAR_MS;
export const BROWSER_SESSION_TTL_MS = 1000 * 60 * 60 * 8;

export function getLocalSessionTtl(remember: boolean) {
  return remember ? REMEMBERED_SESSION_TTL_MS : BROWSER_SESSION_TTL_MS;
}

export const REMEMBER_BRIDGE_TTL_MS = 1000 * 60 * 5;
export const REMEMBER_BRIDGE_COOKIE = "ferixrg_remember_preference";
