import { useEffect, useState } from "react";
import { RefreshCw, ShieldCheck } from "lucide-react";
import { useLocation } from "wouter";
import Workspace from "./Workspace";
import { apiUrl } from "../lib/apiBase";
import { authPath } from "../lib/authRouting";
import "./auth.css";

type SessionState = "checking" | "authenticated" | "unauthenticated" | "unavailable";

export default function ProtectedDashboard() {
  const [location, navigate] = useLocation();
  const [sessionState, setSessionState] = useState<SessionState>("checking");
  const returnPath = `${location}${window.location.search}`;

  useEffect(() => {
    let active = true;
    fetch(apiUrl("/api/account/session"), { credentials: "include" })
      .then(async response => ({ response, payload: await response.json().catch(() => ({ authenticated: false })) }))
      .then(({ response, payload }) => {
        if (!active) return;
        setSessionState(response.ok && payload.authenticated ? "authenticated" : "unauthenticated");
      })
      .catch(() => { if (active) setSessionState("unavailable"); });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (sessionState === "unauthenticated") navigate(authPath("login", returnPath), { replace: true });
  }, [navigate, returnPath, sessionState]);

  if (sessionState === "authenticated") return <Workspace />;
  if (sessionState === "unavailable") return <main className="auth-page"><section className="auth-card auth-status-card"><div className="auth-icon"><ShieldCheck size={23} /></div><h1>Workspace unavailable</h1><p>FerixRG could not verify your session. The dashboard stays protected until the account service is available.</p><button className="auth-primary" onClick={() => navigate(authPath("login", returnPath), { replace: true })}>Return to sign in</button></section></main>;
  return <main className="auth-page"><section className="auth-card auth-status-card"><div className="auth-working"><RefreshCw className="spin" size={18} /> Checking your secure session</div></section></main>;
}
