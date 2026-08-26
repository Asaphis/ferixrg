import { FormEvent, useEffect, useMemo, useState } from "react";
import { ArrowLeft, ArrowRight, CheckCircle2, Eye, EyeOff, LockKeyhole, Mail, RefreshCw, ShieldCheck, UserRound } from "lucide-react";
import { apiUrl } from "../lib/apiBase";
import { authPath, safeDashboardReturnPath } from "../lib/authRouting";
import "./auth.css";

type AuthRoute = "login" | "register" | "verify-email";

type AccountResponse = { success: boolean; verificationRequired?: boolean; message?: string; code?: string };

function messageFromResponse(result: AccountResponse, fallback: string) {
  return result.message || fallback;
}

async function postAccount(path: string, body: Record<string, unknown>) {
  const response = await fetch(apiUrl(path), { method: "POST", credentials: "include", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  const result = await response.json().catch(() => ({ success: false, message: "The account service did not return a valid response." })) as AccountResponse;
  if (!response.ok || !result.success) throw new Error(messageFromResponse(result, "We could not complete that request."));
  return result;
}

function startOAuth(returnPath: string) {
  const portal = import.meta.env.VITE_OAUTH_PORTAL_URL?.trim();
  const appId = import.meta.env.VITE_APP_ID?.trim();
  if (!portal || !appId) throw new Error("Single sign-on is not configured for this environment.");
  const nonce = crypto.randomUUID();
  const callback = apiUrl("/api/oauth/callback");
  document.cookie = `__Host-oauth_state=${nonce}; Path=/; Max-Age=600; SameSite=None; Secure`;
  const state = btoa(JSON.stringify({ redirectUri: callback, nonce, returnPath: safeDashboardReturnPath(returnPath) }));
  const url = new URL(`${portal.replace(/\/$/, "")}/app-auth`);
  url.searchParams.set("appId", appId);
  url.searchParams.set("redirectUri", callback);
  url.searchParams.set("state", state);
  url.searchParams.set("type", "signIn");
  window.location.assign(url.toString());
}

export default function Auth({ route, search, onNavigate }: { route: AuthRoute; search: string; onNavigate: (path: string, replace?: boolean) => void }) {
  const query = useMemo(() => new URLSearchParams(search), [search]);
  const returnPath = safeDashboardReturnPath(query.get("returnTo"));
  const [name, setName] = useState("");
  const [email, setEmail] = useState(query.get("email") ?? "");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [remember, setRemember] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [verified, setVerified] = useState(false);
  const [verificationAttempted, setVerificationAttempted] = useState(false);

  useEffect(() => {
    const token = query.get("token");
    if (route !== "verify-email" || !token || verified || busy || verificationAttempted) return;
    setVerificationAttempted(true);
    setBusy(true);
    postAccount("/api/account/verify", { token })
      .then(() => setVerified(true))
      .catch((reason: unknown) => setError(reason instanceof Error ? reason.message : "We could not verify this email link."))
      .finally(() => setBusy(false));
  }, [busy, query, route, verified]);

  const submitLogin = async (event: FormEvent) => {
    event.preventDefault();
    setError("");
    setBusy(true);
    try {
      await postAccount("/api/account/login", { email, password, remember });
      onNavigate(returnPath, true);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "We could not sign you in.");
    } finally {
      setBusy(false);
    }
  };

  const submitRegistration = async (event: FormEvent) => {
    event.preventDefault();
    setError("");
    if (password.length < 8) return setError("Use a password with at least 8 characters.");
    if (password !== confirmPassword) return setError("Passwords do not match.");
    setBusy(true);
    try {
      await postAccount("/api/account/register", { name, email, password });
      onNavigate(`/auth/verify-email?email=${encodeURIComponent(email)}`, true);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "We could not create your account.");
    } finally {
      setBusy(false);
    }
  };

  const openOAuth = () => {
    setError("");
    try {
      startOAuth(returnPath);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "We could not begin single sign-on.");
    }
  };

  if (route === "verify-email") return <main className="auth-page"><section className="auth-card auth-status-card"><div className="auth-brand"><span>FERIX<span>RG</span></span><small>intelligence workspace</small></div><div className="auth-icon success"><Mail size={23} /></div><h1>{verified ? "Email verified" : "Verify your email"}</h1><p>{verified ? "Your account is active. Sign in to open your protected workspace." : `We sent an account verification link to ${email || "your email address"}. Open the link before signing in.`}</p>{error && <div className="auth-error" role="alert">{error}</div>}{busy && <div className="auth-working"><RefreshCw size={16} /> Verifying account</div>}<button className="auth-primary" onClick={() => onNavigate(authPath("login", returnPath))}>{verified ? "Continue to sign in" : "Back to sign in"} <ArrowRight size={16} /></button><button className="auth-text" onClick={() => onNavigate(authPath("register", returnPath))}>Use a different email</button></section></main>;

  const isRegister = route === "register";
  return <main className="auth-page"><section className="auth-card"><div className="auth-brand"><span>FERIX<span>RG</span></span><small>intelligence workspace</small></div><div className="auth-heading"><span className="auth-icon"><ShieldCheck size={22} /></span><div><h1>{isRegister ? "Create your account" : "Welcome back"}</h1><p>{isRegister ? "Create an account, verify your email, and then enter your protected workspace." : "Sign in to access your protected FerixRG workspace."}</p></div></div><form onSubmit={isRegister ? submitRegistration : submitLogin} className="auth-form">{isRegister && <label><span>Name</span><div className="auth-input"><UserRound size={16} /><input value={name} onChange={event => setName(event.target.value)} autoComplete="name" required placeholder="Your name" /></div></label>}<label><span>Email address</span><div className="auth-input"><Mail size={16} /><input value={email} onChange={event => setEmail(event.target.value)} autoComplete="email" type="email" required placeholder="you@example.com" /></div></label><label><span>Password</span><div className="auth-input"><LockKeyhole size={16} /><input value={password} onChange={event => setPassword(event.target.value)} autoComplete={isRegister ? "new-password" : "current-password"} type={showPassword ? "text" : "password"} required placeholder="Enter password" /><button type="button" onClick={() => setShowPassword(current => !current)} aria-label={showPassword ? "Hide password" : "Show password"}>{showPassword ? <EyeOff size={16} /> : <Eye size={16} />}</button></div></label>{isRegister && <label><span>Confirm password</span><div className="auth-input"><LockKeyhole size={16} /><input value={confirmPassword} onChange={event => setConfirmPassword(event.target.value)} autoComplete="new-password" type={showPassword ? "text" : "password"} required placeholder="Confirm password" /></div></label>}{!isRegister && <label className="auth-remember"><input type="checkbox" checked={remember} onChange={event => setRemember(event.target.checked)} /> <span>Remember this device</span></label>}{error && <div className="auth-error" role="alert">{error}</div>}<button className="auth-primary" disabled={busy} type="submit">{busy ? <><RefreshCw className="spin" size={16} /> Please wait</> : <>{isRegister ? "Create account" : "Sign in"} <ArrowRight size={16} /></>}</button></form><div className="auth-divider"><span>or</span></div><button className="auth-secondary" onClick={openOAuth}><ShieldCheck size={16} /> Continue with secure sign-in</button><p className="auth-switch">{isRegister ? "Already have an account?" : "New to FerixRG?"} <button onClick={() => onNavigate(authPath(isRegister ? "login" : "register", returnPath))}>{isRegister ? "Sign in" : "Create an account"}</button></p>{isRegister && <p className="auth-fineprint">Your dashboard remains unavailable until your email is verified and you sign in.</p>}<button className="auth-back" onClick={() => onNavigate("/auth/login", true)}><ArrowLeft size={14} /> Back to sign in</button></section></main>;
}
