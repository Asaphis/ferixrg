import { ArrowLeft, Check, ChevronRight, FileBarChart, Save, ShieldCheck } from "lucide-react";
import React, { useEffect, useState } from "react";
import "./moreActionPanel.css";
import { trpc } from "@/lib/trpc";

type Field = { label: string; value: string; type?: "text" | "email" | "select"; options?: string[] };
type AccountProfile = { name: string | null; email: string | null };
type AccountPreferences = {
  defaultPreview: "desktop" | "tablet" | "mobile";
  analysisReadyNotifications: number;
  draftReviewNotifications: number;
  publishingReadinessNotifications: number;
  releaseNotes: number;
  productResearch: number;
  reduceMotion: number;
  increaseContrast: number;
  visibleKeyboardFocus: number;
  twoStepVerification: number;
  securityAlerts: number;
};
type AccountSession = { id: number; createdAt: Date; expiresAt: Date; active: boolean; current: boolean };
type TwoStepStatus = { encryptionConfigured: boolean; enrollmentState: "not_enrolled" | "pending" | "enabled" };
type AccountSecurityEvent = { id: number; eventType: string; deliveryState: "not_requested" | "not_configured" | "sent" | "failed"; createdAt: Date };
type BillingSummary = { subscription: { plan: "free" | "starter" | "growth" | "enterprise"; status: string; provider: string | null; currentPeriodEnd: Date | null } | null; plan: { label: string; monthlyToolRuns: number | null; monthlyAiCredits: number | null; storageBytes: number | null; seats: number | null }; usage: { toolRuns: number; aiCredits: number; storageBytes: number; exports: number; publishActions: number }; ledger: { id: number; category: string; quantity: number; unit: string; createdAt: Date }[] };
type StoreProviderReadiness = { provider: string; configured: boolean; authorizationMode: string; supportsPublish: boolean; supportsRollback: boolean; message: string };
type AiProviderReadiness = { provider: string; configured: boolean; model: string; message: string };
type Detail = {
  eyebrow: string;
  title: string;
  copy: string;
  metrics: [string, string][];
  rows?: string[];
  fields?: Field[];
  toggles?: { label: string; copy: string; enabled?: boolean; disabled?: boolean }[];
  choices?: string[];
  primary: string;
  completion: string;
  destructive?: boolean;
};

export const moreActionDetails: Record<string, Detail> = {
  "billing:Subscription": { eyebrow: "Plan and usage", title: "Subscription", copy: "Review the workspace’s current plan and entitlement record. Plan changes remain unavailable until a server-side billing provider is configured.", metrics: [["—", "Current plan"], ["—", "Billing connection"]], rows: ["Plan entitlements are read-only in this environment."], primary: "Review plan record", completion: "Billing records are live and read-only. No plan change or payment action was performed." },
  "billing:Usage limits": { eyebrow: "Plan and usage", title: "Usage limits", copy: "Review current workspace usage against the active plan. Alert settings are unavailable until a billing provider and notification policy are configured.", metrics: [["—", "Recorded tool runs"], ["—", "Remaining shown from plan"]], rows: ["Usage records are read-only in this environment."], primary: "Review usage record", completion: "Billing records are live and read-only. No billing setting was changed." },
  "billing:AI credits": { eyebrow: "Plan and usage", title: "AI credits", copy: "Review recorded AI usage and the active plan allocation. Credit purchases and alert changes are unavailable until billing is configured.", metrics: [["—", "AI credits used"], ["—", "Payment connection"]], rows: ["AI usage appears only when a provider executor records it."], primary: "Review AI usage", completion: "Billing records are live and read-only. No credit purchase or setting was changed." },
  "billing:Billing history": { eyebrow: "Plan and usage", title: "Billing history", copy: "Review the workspace billing ledger. Receipts and payment collection remain unavailable until a server-side billing provider is configured.", metrics: [["—", "Ledger entries"], ["—", "Billing connection"]], rows: ["No payment-provider receipt is available in this environment."], primary: "Review billing records", completion: "Billing records are live and read-only. No receipt or payment action was performed." },
  "profile:Personal details": { eyebrow: "Personal account", title: "Personal details", copy: "Update your own display information without changing shared workspace or store settings.", metrics: [["—", "Workspace role"], ["—", "Time zone"]], fields: [{ label: "Full name", value: "" }], primary: "Save personal details", completion: "Personal details are saved only after the account update is confirmed by the server." },
  "profile:Email address": { eyebrow: "Personal account", title: "Email address", copy: "Use a verified email address to keep account notifications and sign-in recovery available.", metrics: [["—", "Current email"], ["—", "Recovery method"]], fields: [{ label: "New email address", value: "", type: "email" }], primary: "Send verification", completion: "No confirmation message was sent until the email-change request was accepted by the server." },
  "profile:Password & security": { eyebrow: "Personal account", title: "Password & security", copy: "Review the main protection controls for your personal FerixRG account.", metrics: [["—", "Recovery method"], ["—", "Security alerts"]], toggles: [{ label: "Two-step verification", copy: "Set up an authenticator app only when this deployment has encrypted secret storage configured.", disabled: true }, { label: "Security alerts", copy: "Save your account preference for new-sign-in alerts. Delivery begins only when the notification channel is configured.", enabled: true }], primary: "Send password reset link", completion: "Password-reset delivery status is shown after the request is processed." },
  "profile:Connected sessions": { eyebrow: "Personal account", title: "Connected sessions", copy: "Review the devices signed into your account and safely remove old browser sessions.", metrics: [["—", "Active sessions"], ["—", "Last activity"]], rows: [], primary: "Sign out other sessions", completion: "The server reports how many other active sessions were revoked." },
  "preferences:Workspace defaults": { eyebrow: "Personal defaults", title: "Workspace defaults", copy: "Set the starting context FerixRG should use when you open your workspace.", metrics: [["—", "Default store"], ["—", "Default viewport"]], fields: [{ label: "Default preview", value: "", type: "select", options: ["Desktop", "Tablet", "Mobile"] }], primary: "Save defaults", completion: "Workspace defaults saved for your account." },
  "preferences:Notifications": { eyebrow: "Personal defaults", title: "Notifications", copy: "Choose which work events need your attention without changing what the rest of the team receives.", metrics: [["—", "Active alerts"], ["—", "Delivery method"]], toggles: [{ label: "Analysis ready", copy: "Alert when a store analysis is complete.", enabled: true }, { label: "Draft review", copy: "Alert when a shared draft needs review.", enabled: true }, { label: "Publishing readiness", copy: "Alert when a supported release is ready.", enabled: true }], primary: "Save notifications", completion: "Notification preferences saved." },
  "preferences:Product updates": { eyebrow: "Personal defaults", title: "Product updates", copy: "Control how you hear about FerixRG releases, product improvements, and optional research.", metrics: [["—", "Release summary"], ["—", "Research invites"]], toggles: [{ label: "Release notes", copy: "Receive concise product release summaries.", enabled: true }, { label: "Product research", copy: "Receive optional invitations to feedback sessions." }], primary: "Save product updates", completion: "Product update preferences saved." },
  "preferences:Accessibility": { eyebrow: "Personal defaults", title: "Accessibility", copy: "Make the FerixRG workspace easier to use without affecting other team members’ preferences.", metrics: [["—", "Text scale"], ["—", "Visible focus"]], toggles: [{ label: "Reduce motion", copy: "Limit non-essential animated transitions." }, { label: "Increase contrast", copy: "Use stronger separation between content surfaces." }, { label: "Visible keyboard focus", copy: "Keep keyboard focus indicators visible.", enabled: true }], primary: "Save accessibility settings", completion: "Accessibility preferences saved." },
  "platform:Integrations": { eyebrow: "Workspace connections", title: "Integrations", copy: "Review the server-side readiness of FerixRG provider routes and the actions they can safely support.", metrics: [["—", "Configured store providers"], ["—", "Configured AI providers"]], rows: ["No provider readiness records are available yet."], primary: "Review integration readiness", completion: "Provider readiness is shown from the current server configuration. No merchant authorization or store permission changed." },
  "platform:Developer & API": { eyebrow: "Workspace connections", title: "Developer & API", copy: "Use structured handoff and API access when implementation needs to move beyond the visual editor.", metrics: [["—", "Developer workflow"], ["—", "Handoff format"]], rows: ["Theme patch proposals", "Structured issue evidence", "Developer handoff packages"], primary: "Prepare developer handoff", completion: "No developer handoff package was created because no handoff-generation endpoint is configured." },
  "platform:API keys": { eyebrow: "Workspace connections", title: "API keys", copy: "API-key creation is unavailable until a server-side key-management contract is configured.", metrics: [["—", "Active API keys"], ["—", "Current scope"]], rows: ["No API-key record is available in this environment."], primary: "API keys unavailable", completion: "No API key was created or exposed." },
  "platform:Request a platform": { eyebrow: "Workspace connections", title: "Request a platform", copy: "Tell the FerixRG team which storefront platform you want to connect next.", metrics: [["—", "Configured platforms"], ["—", "Fallback availability"]], fields: [{ label: "Platform name", value: "" }, { label: "Storefront URL (optional)", value: "", type: "text" }], primary: "Send platform request", completion: "Platform request submitted for review." },
  "resources:Documentation": { eyebrow: "Product guidance", title: "Documentation", copy: "Find the guidance needed to use the selected FerixRG workflow with confidence.", metrics: [["—", "Tools documented"], ["—", "Guides updated"]], rows: ["Choose and run a tool", "Review evidence and reports", "Use the shared editor", "Validate, publish, or export"], primary: "Open tool guide", completion: "No external guide was opened. The available guidance is shown in this panel." },
  "resources:Help Center": { eyebrow: "Product guidance", title: "Help Center", copy: "Browse answers for account, store connection, evidence, editing, and release questions.", metrics: [["—", "Help categories"], ["—", "Support guidance"]], rows: ["Getting started", "Store connections", "Tools and evidence", "Editing and versions", "Publishing and exports"], primary: "Open help topic", completion: "No external help topic was opened. The available help categories are shown in this panel." },
  "resources:What’s New": { eyebrow: "Product guidance", title: "What’s New", copy: "Review concise product changes without interrupting active storefront work.", metrics: [["—", "Recent updates"], ["—", "Last release"]], rows: ["Shared AI and manual editor", "Context-aware release routing", "Team access management"], primary: "Mark updates as read", completion: "Updates marked as read." },
  "resources:About": { eyebrow: "Product guidance", title: "About FerixRG", copy: "FerixRG helps teams understand, improve, validate, and responsibly deliver storefront changes.", metrics: [["—", "Tools"], ["—", "Supported paths"]], rows: ["Storefront intelligence", "Design and content correction", "Optimization and developer handoff"], primary: "View product overview", completion: "No external product page was opened. The product overview is shown in this panel." },
  "resources:Terms": { eyebrow: "Product guidance", title: "Terms", copy: "Review the product terms available for this FerixRG workspace.", metrics: [["—", "Terms version"], ["—", "Last updated"]], rows: ["Account responsibilities", "Store connection boundaries", "Export and publishing responsibilities"], primary: "View full terms", completion: "The server was checked for a published Terms version; no local document was opened." },
  "resources:Privacy": { eyebrow: "Product guidance", title: "Privacy", copy: "Review how this workspace handles data, connections, and account privacy.", metrics: [["—", "Privacy version"], ["—", "Last updated"]], rows: ["Store connection data", "Public URL analysis", "Account and workspace data"], primary: "View privacy details", completion: "The server was checked for a published Privacy version; no local document was opened." },
  "support:Contact support": { eyebrow: "Help and feedback", title: "Contact support", copy: "Send a support request with the workspace context needed to understand your question.", metrics: [["—", "Response guidance"], ["—", "Context attached"]], fields: [{ label: "Subject", value: "" }, { label: "What do you need help with?", value: "" }], primary: "Send support request", completion: "Support request sent with workspace context." },
  "support:Report a problem": { eyebrow: "Help and feedback", title: "Report a problem", copy: "Describe a problem so the FerixRG team can understand the screen and workspace context involved.", metrics: [["—", "Context attached"], ["—", "Workspace data"]], fields: [{ label: "What happened?", value: "" }, { label: "Expected result", value: "" }], primary: "Send problem report", completion: "Problem report sent with workspace context." },
  "support:Send feedback": { eyebrow: "Help and feedback", title: "Send feedback", copy: "Share product feedback while the relevant workspace context is still clear.", metrics: [["—", "Contact reply"], ["—", "Context attached"]], fields: [{ label: "Your feedback", value: "" }], primary: "Send feedback", completion: "Feedback sent to the product team." },
  "support:Feature requests": { eyebrow: "Help and feedback", title: "Feature requests", copy: "Describe the job you want FerixRG to make easier for your storefront workflow.", metrics: [["—", "Request status"], ["—", "Context attached"]], fields: [{ label: "Feature request", value: "" }, { label: "Why would this help?", value: "" }], primary: "Submit feature request", completion: "Feature request submitted for review." },
};

export function MoreActionPanel({ section, action, onBack, profile, preferences, sessions, billing, storeProviderReadiness, aiProviderReadiness, twoStepStatus, onSaveProfile, onSavePreferences, onRequestEmailChange, onRequestPasswordReset, onStartTwoStepEnrollment, onConfirmTwoStepEnrollment, onRevokeSession, onRevokeOtherSessions, onSubmitWorkspaceRequest, onReadLegalDocuments, onAcknowledgeResource }: { section: string; action: string; onBack: () => void; profile?: AccountProfile; preferences?: AccountPreferences; sessions?: AccountSession[]; billing?: BillingSummary; storeProviderReadiness?: StoreProviderReadiness[]; aiProviderReadiness?: AiProviderReadiness[]; twoStepStatus?: TwoStepStatus; onSaveProfile?: (input: { name?: string }) => Promise<void>; onSavePreferences?: (input: Partial<{ defaultPreview: "desktop" | "tablet" | "mobile"; analysisReadyNotifications: boolean; draftReviewNotifications: boolean; publishingReadinessNotifications: boolean; releaseNotes: boolean; productResearch: boolean; reduceMotion: boolean; increaseContrast: boolean; visibleKeyboardFocus: boolean; twoStepVerification: boolean; securityAlerts: boolean }>) => Promise<void>; onRequestEmailChange?: (input: { email: string }) => Promise<{ delivery: string }>; onRequestPasswordReset?: () => Promise<{ delivery: string }>; onStartTwoStepEnrollment?: () => Promise<{ secret: string; otpauthUri: string }>; onConfirmTwoStepEnrollment?: (input: { code: string }) => Promise<{ success: boolean; recoveryCodes: string[] }>; onRevokeSession?: (sessionId: number) => Promise<void>; onRevokeOtherSessions?: () => Promise<{ revoked: number }>; onSubmitWorkspaceRequest?: (input: { type: "platform_request" | "support" | "problem" | "feedback" | "feature_request"; subject: string; message: string }) => Promise<void>; onReadLegalDocuments?: (documentKey: "terms" | "privacy") => Promise<{ count: number }>; onAcknowledgeResource?: (resourceKey: string) => Promise<void> }) {
  const detail = moreActionDetails[`${section}:${action}`];
  const [selectedChoice, setSelectedChoice] = useState(detail?.choices?.[0] ?? "");
  const [saved, setSaved] = useState("");
  const [saveError, setSaveError] = useState(false);
  const [saving, setSaving] = useState(false);
  const [enrollment, setEnrollment] = useState<{ secret: string; otpauthUri: string } | null>(null);
  const [verificationCode, setVerificationCode] = useState("");
  const [recoveryCodes, setRecoveryCodes] = useState<string[]>([]);
  const twoStepStatusQuery = trpc.account.twoStepStatus.useQuery(undefined, { retry: false, refetchOnWindowFocus: false });
  const securityEventsQuery = trpc.account.securityEvents.useQuery(undefined, { retry: false, refetchOnWindowFocus: false });
  const startTwoStepEnrollmentMutation = trpc.account.startTwoStepEnrollment.useMutation();
  const confirmTwoStepEnrollmentMutation = trpc.account.confirmTwoStepEnrollment.useMutation();
  const liveTwoStepStatus = twoStepStatus ?? twoStepStatusQuery.data;
  const resolveFieldValue = (field: Field) => {
    if (section === "profile" && action === "Personal details" && field.label === "Full name") return profile?.name ?? field.value;
    if (section === "profile" && action === "Email address" && field.label === "New email address") return profile?.email ?? field.value;
    if (section === "preferences" && action === "Workspace defaults" && field.label === "Default preview") return preferences?.defaultPreview ? preferences.defaultPreview[0].toUpperCase() + preferences.defaultPreview.slice(1) : field.value;
    return field.value;
  };
  const [fieldValues, setFieldValues] = useState<Record<string, string>>(() => Object.fromEntries(detail?.fields?.map(field => [field.label, resolveFieldValue(field)]) ?? []));
  const preferenceKey = (label: string): keyof AccountPreferences | undefined => ({ "Analysis ready": "analysisReadyNotifications", "Draft review": "draftReviewNotifications", "Publishing readiness": "publishingReadinessNotifications", "Release notes": "releaseNotes", "Product research": "productResearch", "Reduce motion": "reduceMotion", "Increase contrast": "increaseContrast", "Visible keyboard focus": "visibleKeyboardFocus", "Two-step verification": "twoStepVerification", "Security alerts": "securityAlerts" })[label] as keyof AccountPreferences | undefined;
  const [toggleValues, setToggleValues] = useState<Record<string, boolean>>(() => Object.fromEntries(detail?.toggles?.map(toggle => [toggle.label, Boolean(preferences?.[preferenceKey(toggle.label) ?? "analysisReadyNotifications"] ?? toggle.enabled)]) ?? []));
  const activeSessions = sessions?.filter(session => session.active) ?? [];
  const liveSessionMetrics: [string, string][] | undefined = section === "profile" && action === "Connected sessions" && sessions ? [[String(activeSessions.length), "Active sessions"], [activeSessions.some(session => session.current) ? "Current" : "None", "This device"]] : undefined;
  const liveSessionRows: string[] | undefined = section === "profile" && action === "Connected sessions" && sessions ? (sessions.length ? sessions.map(session => `${session.current ? "Current session" : "Signed-in session"} · ${session.active ? "Active" : "Revoked or expired"} · started ${new Date(session.createdAt).toLocaleDateString()}`) : ["No account sessions are recorded."]) : undefined;
  const configuredStoreProviders = storeProviderReadiness?.filter(provider => provider.configured) ?? [];
  const configuredAiProviders = aiProviderReadiness?.filter(provider => provider.configured) ?? [];
  const livePlatformMetrics: [string, string][] | undefined = section === "platform" && action === "Integrations" && (storeProviderReadiness || aiProviderReadiness) ? [[String(configuredStoreProviders.length), "Configured store providers"], [String(configuredAiProviders.length), "Configured AI providers"]] : undefined;
  const livePlatformRows: string[] | undefined = section === "platform" && action === "Integrations" && (storeProviderReadiness || aiProviderReadiness) ? [...(storeProviderReadiness ?? []).map(provider => `${provider.provider} · ${provider.configured ? "Configuration available" : "Setup required"} · ${provider.authorizationMode}`), ...(aiProviderReadiness ?? []).map(provider => `${provider.provider} · ${provider.configured ? `Configured · ${provider.model}` : "Setup required"}`)] : undefined;
  const billingMetrics: [string, string][] | undefined = section === "billing" && billing ? action === "Subscription" ? [[billing.plan.label, "Current plan"], [billing.subscription?.status ?? "active", "Subscription status"]] : action === "Usage limits" ? [[`${billing.usage.toolRuns} / ${billing.plan.monthlyToolRuns ?? "∞"}`, "Tool runs"], [billing.plan.monthlyToolRuns === null ? "Unlimited" : `${Math.max(billing.plan.monthlyToolRuns - billing.usage.toolRuns, 0)} remaining`, "Available this period"]] : action === "AI credits" ? [[`${billing.usage.aiCredits}`, "Credits used"], [billing.plan.monthlyAiCredits === null ? "Unlimited" : `${Math.max(billing.plan.monthlyAiCredits - billing.usage.aiCredits, 0)} remaining`, "Credits available"]] : [[`${billing.ledger.length}`, "Ledger entries"], [billing.subscription?.provider ?? "Not connected", "Billing provider"]] : undefined;
  const billingRows: string[] | undefined = section === "billing" && billing ? action === "Subscription" ? [`${billing.plan.seats ?? "Unlimited"} seats included`, `${billing.plan.storageBytes === null ? "Unlimited" : `${Math.round(billing.plan.storageBytes / 1_000_000_000)} GB`} storage entitlement`, billing.subscription?.currentPeriodEnd ? `Renews ${new Date(billing.subscription.currentPeriodEnd).toLocaleDateString()}` : "No provider renewal is configured"] : action === "Usage limits" ? [`${billing.usage.storageBytes} bytes recorded in storage usage`, `${billing.usage.exports} export records`, `${billing.usage.publishActions} publish usage records`] : action === "AI credits" ? [`${billing.usage.aiCredits} AI credits recorded`, "AI usage appears only when a provider executor records it", "No frontend simulation is counted"] : billing.ledger.length ? billing.ledger.slice(0, 6).map(entry => `${entry.category} · ${entry.quantity} ${entry.unit} · ${new Date(entry.createdAt).toLocaleDateString()}`) : ["No billing ledger entries yet."] : undefined;
  useEffect(() => {
    setSelectedChoice(detail?.choices?.[0] ?? "");
    setSaved("");
    setSaveError(false);
    setFieldValues(Object.fromEntries(detail?.fields?.map(field => [field.label, resolveFieldValue(field)]) ?? []));
    setToggleValues(Object.fromEntries(detail?.toggles?.map(toggle => [toggle.label, Boolean(preferences?.[preferenceKey(toggle.label) ?? "analysisReadyNotifications"] ?? toggle.enabled)]) ?? []));
  }, [action, profile?.email, profile?.name, preferences, section]);
  if (!detail) return null;
  const persist = async () => {
    setSaving(true);
    setSaved("");
    setSaveError(false);
    try {
      if (section === "profile" && action === "Personal details" && onSaveProfile) {
        await onSaveProfile({ name: fieldValues["Full name"]?.trim() });
        setSaved("Personal details saved to your account.");
      } else if ((section === "preferences" || (section === "profile" && action === "Password & security")) && onSavePreferences) {
        const preferenceUpdate = Object.fromEntries(Object.entries(toggleValues).filter(([label]) => !detail.toggles?.find(toggle => toggle.label === label)?.disabled).map(([label, value]) => [preferenceKey(label), value]).filter(([key]) => Boolean(key))) as Partial<{ defaultPreview: "desktop" | "tablet" | "mobile"; analysisReadyNotifications: boolean; draftReviewNotifications: boolean; publishingReadinessNotifications: boolean; releaseNotes: boolean; productResearch: boolean; reduceMotion: boolean; increaseContrast: boolean; visibleKeyboardFocus: boolean; twoStepVerification: boolean; securityAlerts: boolean }>;
        if (action === "Workspace defaults") preferenceUpdate.defaultPreview = (fieldValues["Default preview"]?.toLowerCase() || "mobile") as "desktop" | "tablet" | "mobile";
        await onSavePreferences(preferenceUpdate);
        if (section === "profile" && onRequestPasswordReset) {
          const reset = await onRequestPasswordReset();
          setSaved(reset.delivery === "sent" ? "Security settings saved and a password reset link was sent." : "Security settings saved. Password-reset email delivery is not configured in this environment yet.");
        } else setSaved("Your preferences are saved to your account.");
      } else if (section === "profile" && action === "Email address" && onRequestEmailChange) {
        const result = await onRequestEmailChange({ email: fieldValues["New email address"]?.trim() ?? "" });
        setSaved(result.delivery === "sent" ? "A confirmation email was sent to the new address." : "Email delivery is not configured in this environment yet. No confirmation message was sent.");
      } else if (section === "profile" && action === "Connected sessions" && onRevokeOtherSessions) {
        const result = await onRevokeOtherSessions();
        setSaved(result.revoked ? `${result.revoked} other signed-in session${result.revoked === 1 ? "" : "s"} revoked.` : "There are no other active sessions to revoke.");
      } else if (section === "billing") {
        setSaved("Billing records are live and read-only. Plan changes, receipts, and payment collection stay unavailable until a server-side billing provider is configured.");
      } else if (section === "platform" && action === "Request a platform" && onSubmitWorkspaceRequest) {
        const platformName = fieldValues["Platform name"]?.trim();
        if (!platformName) throw new Error("Enter a platform name before submitting your request.");
        await onSubmitWorkspaceRequest({ type: "platform_request", subject: `Platform request: ${platformName}`, message: fieldValues["Storefront URL (optional)"]?.trim() || "No storefront URL was supplied." });
        setSaved("Platform request submitted with the current workspace context.");
      } else if (section === "platform" && action === "Integrations") {
        setSaved("Provider readiness reflects the current server configuration. Merchant authorization, permission refresh, publishing, and rollback remain unavailable until a secure provider adapter is implemented and configured.");
      } else if (section === "support" && onSubmitWorkspaceRequest) {
        const requestType = action === "Contact support" ? "support" : action === "Report a problem" ? "problem" : action === "Send feedback" ? "feedback" : "feature_request";
        const message = action === "Contact support" ? fieldValues["What do you need help with?"]?.trim() : action === "Report a problem" ? fieldValues["What happened?"]?.trim() : action === "Send feedback" ? fieldValues["Your feedback"]?.trim() : fieldValues["Feature request"]?.trim();
        const subject = action === "Contact support" ? fieldValues.Subject?.trim() : action === "Report a problem" ? "Problem report" : action === "Send feedback" ? "Product feedback" : fieldValues["Feature request"]?.trim() || "Feature request";
        if (!message || !subject) throw new Error("Complete the required request details before submitting.");
        await onSubmitWorkspaceRequest({ type: requestType, subject, message: action === "Feature requests" && fieldValues["Why would this help?"]?.trim() ? `${message}\n\nWhy this helps: ${fieldValues["Why would this help?"]?.trim()}` : message });
        setSaved("Your submission was saved with the current workspace context.");
      } else if (section === "resources" && (action === "Terms" || action === "Privacy") && onReadLegalDocuments) {
        const result = await onReadLegalDocuments(action === "Terms" ? "terms" : "privacy");
        setSaved(result.count ? `${result.count} published ${action.toLowerCase()} version${result.count === 1 ? "" : "s"} is available.` : `No published ${action.toLowerCase()} version is available in this environment yet.`);
      } else if (section === "resources" && action === "What’s New" && onAcknowledgeResource) {
        await onAcknowledgeResource("whats-new");
        setSaved("What’s New was acknowledged for your account.");
      } else {
        setSaved(detail.completion);
      }
    } catch (error) {
      setSaveError(true);
      setSaved(error instanceof Error ? error.message : "We couldn’t complete this request. No change was confirmed.");
    } finally {
      setSaving(false);
    }
  };
  const accountSetting = section === "profile" || section === "preferences";
  const isPasswordSecurity = section === "profile" && action === "Password & security";
  const securityEventLabel = (event: AccountSecurityEvent) => ({ two_step_enrollment_started: "Authenticator setup started", two_step_enabled: "Two-step verification enabled", session_revoked: "A session was revoked", other_sessions_revoked: "Other sessions were revoked", local_sign_in_completed: "Password sign-in completed", two_step_login_completed: "Two-step sign-in completed" })[event.eventType] ?? "Account security updated";
  const beginTwoStepEnrollment = async () => {
    if (!liveTwoStepStatus?.encryptionConfigured) return;
    setSaving(true); setSaved("");
    try { setEnrollment(await (onStartTwoStepEnrollment ? onStartTwoStepEnrollment() : startTwoStepEnrollmentMutation.mutateAsync())); setRecoveryCodes([]); setVerificationCode(""); setSaved("Add the displayed setup key to an authenticator app, then enter its six-digit code to confirm it."); }
    catch { setSaved("We couldn’t start two-step setup. Please try again."); }
    finally { setSaving(false); }
  };
  const confirmTwoStepEnrollment = async () => {
    setSaving(true); setSaved("");
    try { const result = await (onConfirmTwoStepEnrollment ? onConfirmTwoStepEnrollment({ code: verificationCode.trim() }) : confirmTwoStepEnrollmentMutation.mutateAsync({ code: verificationCode.trim() })); setRecoveryCodes(result.recoveryCodes); setEnrollment(null); setVerificationCode(""); await twoStepStatusQuery.refetch(); setSaved("Two-step verification is enabled. Save the one-time recovery codes shown below in a secure place."); }
    catch { setSaved("We couldn’t confirm that code. Check your authenticator app and try again."); }
    finally { setSaving(false); }
  };
  return <section className="more-action-page">
    <header className="more-action-header"><button className="more-action-back" onClick={onBack}><ArrowLeft /> Back to {section === "billing" ? "Billing & Usage" : section[0].toUpperCase() + section.slice(1)}</button><span className="approved-eyebrow">{detail.eyebrow}</span><h1>{detail.title}</h1><p>{detail.copy}</p></header>
    <section className="more-action-metrics">{(livePlatformMetrics ?? liveSessionMetrics ?? billingMetrics ?? detail.metrics).map(([value, label]) => <article key={label}><b>{value}</b><span>{label}</span></article>)}</section>
    <section className="more-action-grid"><article className="approved-panel more-action-main">
      {detail.choices && <div className="more-action-choice-group"><span className="approved-eyebrow">Available options</span><div>{detail.choices.map(choice => <button className={selectedChoice === choice ? "selected" : ""} onClick={() => setSelectedChoice(choice)} key={choice}><b>{choice}</b><ChevronRight /></button>)}</div></div>}
      {detail.fields && <div className="more-action-form"><span className="approved-eyebrow">Update details</span>{detail.fields.map(field => <label key={field.label}>{field.label}{field.type === "select" ? <select value={fieldValues[field.label] ?? ""} onChange={event => setFieldValues(current => ({ ...current, [field.label]: event.target.value }))}>{field.options?.map(option => <option key={option}>{option}</option>)}</select> : <input type={field.type ?? "text"} value={fieldValues[field.label] ?? ""} onChange={event => setFieldValues(current => ({ ...current, [field.label]: event.target.value }))} placeholder={field.label} />}</label>)}</div>}
      {detail.toggles && <div className="more-action-toggle-list"><span className="approved-eyebrow">Controls</span>{detail.toggles.map(toggle => <label key={toggle.label}><span><b>{toggle.label}</b><small>{toggle.copy}</small></span><input type="checkbox" disabled={toggle.disabled} checked={Boolean(toggleValues[toggle.label])} onChange={event => setToggleValues(current => ({ ...current, [toggle.label]: event.target.checked }))} /></label>)}</div>}
      {isPasswordSecurity && <section className="more-action-row-list"><span className="approved-eyebrow">Authenticator app</span>
        {!liveTwoStepStatus ? <p>Checking secure enrollment availability…</p> : !liveTwoStepStatus.encryptionConfigured ? <p>Authenticator enrollment is unavailable until this deployment has encrypted secret storage configured.</p> : liveTwoStepStatus.enrollmentState === "enabled" ? <p>Two-step verification is enabled for this account.</p> : <>
          <p>{enrollment ? "Enter the setup key in your authenticator app, then confirm its current six-digit code." : liveTwoStepStatus.enrollmentState === "pending" ? "A previous setup is awaiting confirmation. Starting again replaces that pending setup." : "Use an authenticator app to add a second verification step to future sign-ins."}</p>
          {!enrollment ? <button disabled={saving} onClick={beginTwoStepEnrollment}><span>Set up authenticator app</span><ChevronRight /></button> : <div className="more-action-form"><label>Setup key<input value={enrollment.secret} readOnly aria-label="Authenticator setup key" /></label><label>Six-digit code<input inputMode="numeric" autoComplete="one-time-code" maxLength={6} value={verificationCode} onChange={event => setVerificationCode(event.target.value.replace(/\D/g, "").slice(0, 6))} placeholder="000000" /></label><button className="approved-primary more-action-primary" disabled={saving || verificationCode.length !== 6} onClick={confirmTwoStepEnrollment}>{saving ? "Confirming…" : "Confirm setup"}</button></div>}
        </>}
        {recoveryCodes.length > 0 && <div className="more-action-form"><span className="approved-eyebrow">One-time recovery codes</span><p>Save these codes now. Each works once, and they will not be shown again.</p><input value={recoveryCodes.join("  ")} readOnly aria-label="Two-step recovery codes" /></div>}
        {securityEventsQuery.data?.length ? <div className="more-action-row-list"><span className="approved-eyebrow">Recent security activity</span>{securityEventsQuery.data.slice(0, 4).map(event => <p key={event.id}><b>{securityEventLabel(event)}</b><small>{event.deliveryState === "sent" ? " Security alert sent." : event.deliveryState === "not_configured" ? " Alert delivery is not configured." : event.deliveryState === "failed" ? " Alert delivery failed." : " No alert delivery was requested."} {new Date(event.createdAt).toLocaleDateString()}</small></p>)}</div> : null}
      </section>}
      {(livePlatformRows ?? liveSessionRows ?? billingRows ?? detail.rows) && <div className="more-action-row-list"><span className="approved-eyebrow">Available details</span>{(livePlatformRows ?? liveSessionRows ?? billingRows ?? detail.rows ?? []).map(row => <button onClick={() => setSaved(section === "billing" ? "This ledger record is available in the workspace." : `${row} is informational only; no new record or action was created.`)} key={row}><span>{row}</span><ChevronRight /></button>)}</div>}
      <button className="approved-primary more-action-primary" disabled={saving} onClick={persist}>{detail.destructive ? <ShieldCheck /> : <Save />}{saving ? "Saving…" : detail.primary}</button>
    </article><aside className="approved-panel more-action-side"><FileBarChart /><span className="approved-eyebrow">Workspace context</span><h2>Keep settings separate from storefront work.</h2><p>{accountSetting ? "Changes here apply only to your account. Store analyses, editor drafts, and release decisions remain unchanged." : section === "billing" ? "Plan and usage records are workspace-scoped. Payment-provider activation remains separate and is not simulated here." : "Changes here apply only to this workspace setting. Store analyses, editor drafts, and release decisions remain unchanged."}</p><div><Check /> <span>{accountSetting ? "Account-scoped setting" : section === "billing" ? "Workspace billing record" : "Workspace setting"}</span></div></aside></section>
    {saved && <section className="more-action-notice"><Check /><div><b>{saveError ? "No changes saved" : accountSetting ? "Account updated" : section === "billing" ? "Workspace billing record" : "Workspace updated"}</b><p>{saved}</p></div><button onClick={() => setSaved("")}>Dismiss</button></section>}
  </section>;
}
