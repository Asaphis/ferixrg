import { useCallback, useEffect, useState } from "react";
import Auth from "./pages/Auth";
import ProtectedDashboard from "./pages/ProtectedDashboard";
import { authPath, isDashboardPath } from "./lib/authRouting";

function currentLocation() {
  return `${window.location.pathname}${window.location.search}`;
}

export default function App() {
  const [location, setLocation] = useState(currentLocation);
  const navigate = useCallback((path: string, replace = false) => {
    window.history[replace ? "replaceState" : "pushState"]({}, "", path);
    setLocation(currentLocation());
  }, []);

  useEffect(() => {
    const onPopState = () => setLocation(currentLocation());
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  const [pathname, search = ""] = location.split("?");
  const isKnownRoute = isDashboardPath(pathname) || pathname === "/auth/register" || pathname === "/auth/verify-email" || pathname === "/auth/login" || pathname === "/auth";

  useEffect(() => {
    if (!isKnownRoute) navigate(authPath("login"), true);
  }, [isKnownRoute, navigate]);

  if (isDashboardPath(pathname)) return <ProtectedDashboard returnPath={location} onNavigate={navigate} />;
  if (pathname === "/auth/register") return <Auth route="register" search={search ? `?${search}` : ""} onNavigate={navigate} />;
  if (pathname === "/auth/verify-email") return <Auth route="verify-email" search={search ? `?${search}` : ""} onNavigate={navigate} />;
  if (pathname === "/auth/login" || pathname === "/auth") return <Auth route="login" search={search ? `?${search}` : ""} onNavigate={navigate} />;

  return null;
}
