const allowedWorkspacePaths = new Set(["/app", "/app/tools", "/app/stores", "/app/more"]);

export function getSafeReturnPath(search: string, origin = window.location.origin) {
  const rawReturn = new URLSearchParams(search).get("returnTo");
  if (!rawReturn) return "/app";
  try {
    const parsed = new URL(rawReturn, origin);
    if (parsed.origin !== origin || !allowedWorkspacePaths.has(parsed.pathname)) return "/app";
    return `${parsed.pathname}${parsed.search}`;
  } catch {
    return "/app";
  }
}

export function withAuthReturn(route: string, returnPath: string, params: Record<string, string> = {}) {
  const search = new URLSearchParams(params);
  if (returnPath !== "/app") search.set("returnTo", returnPath);
  const query = search.toString();
  return `/auth/${route}${query ? `?${query}` : ""}`;
}
