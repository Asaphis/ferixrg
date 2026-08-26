const dashboardPath = "/app";

export function isDashboardPath(pathname: string) {
  return pathname === dashboardPath || pathname.startsWith(`${dashboardPath}/`);
}

export function safeDashboardReturnPath(raw: string | null | undefined) {
  if (!raw || !raw.startsWith("/") || raw.startsWith("//")) return dashboardPath;
  const [pathname] = raw.split("?");
  return isDashboardPath(pathname) ? raw : dashboardPath;
}

export function authPath(route: "login" | "register", returnPath = dashboardPath) {
  const safeReturnPath = safeDashboardReturnPath(returnPath);
  return safeReturnPath === dashboardPath ? `/auth/${route}` : `/auth/${route}?returnTo=${encodeURIComponent(safeReturnPath)}`;
}
