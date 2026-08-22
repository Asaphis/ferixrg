/* FerixRG — Quiet Instrument Panel: a focused operational workspace where every interaction is tied to evidence and a clear next move. */
import { Activity, ArrowRight, BarChart3, Bell, Bot, Check, ChevronRight, CircleHelp, Code2, Eye, FileBarChart, LayoutDashboard, Layers3, Lightbulb, Link2, Monitor, MoreHorizontal, PanelRightOpen, Play, Plus, RefreshCw, Save, ScanLine, Search, Settings, ShieldCheck, Sparkles, Store, TabletSmartphone, Wand2 } from "lucide-react";
import "@/approvedDashboard.css";
import { parseEditorDraftState } from "@/lib/editorDraftState";
import { filterTools, toolCatalog, toolCategories, type ToolCategory, type ToolDefinition, type ToolSource } from "@/lib/toolCatalog";
import { getSourceAvailability } from "@/lib/toolCapabilities";

import { ApprovedToolWorkflow } from "@/components/ApprovedToolWorkflow";
import { MoreActionPanel, moreActionDetails } from "@/components/MoreActionPanel";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useLocation } from "wouter";
import "./mobileBehavior.css";
import "./mobileFeedback.css";
import "./internalDashboardSystem.css";
import "./internalConciseBoards.css";
import "./internalConciseTools.css";
import "./internalJourneyBoards.css";
import "./desktopWorkspaceNav.css";
import "./authWorkspace.css";
import "./moreDetail.css";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";

const markAsset = "/branding/ferixrg-logo-transparent.png";

const desktopNavGroups = [
  { label: "Workspace", items: [{ label: "Dashboard", destination: "Overview", icon: LayoutDashboard }, { label: "Stores", destination: "Stores", icon: Store }] },
  { label: "Intelligence", items: [{ label: "Analyze", destination: "Analysis", icon: ScanLine }, { label: "Issues", destination: "Issues", icon: ShieldCheck }, { label: "Reports", destination: "Reports", icon: FileBarChart }] },
  { label: "Create & ship", items: [{ label: "Tools", destination: "Tools Library", icon: Wand2 }, { label: "AI Redesign", destination: "Redesign", icon: Sparkles }, { label: "Design Studio", destination: "Visual editor", icon: Layers3 }, { label: "Validate", destination: "Preview & validate", icon: Monitor }, { label: "Versions", destination: "Versions", icon: Activity }] },
  { label: "Workspace settings", items: [{ label: "More", destination: "More", icon: MoreHorizontal }] },
] as const;
type TeamRole = "Owner" | "Admin" | "Editor" | "Viewer" | "Billing";
type TeamMember = { id: string; name: string; email: string; role: TeamRole; status: "Active" | "Pending"; source?: "member" | "invitation"; sourceId?: number };
type WorkspaceIssue = { id: number; severity: string; title: string; detail: string; tag: string; impact: string; measures: Array<[string, string]>; status: string };
type EditorVersion = { id: string; title: string; label: string; time: string; note: string; tone: "current" | "baseline"; designState: string; isCurrent: boolean };

function Brand() { return <a className="brand" href="/"><img src={markAsset} alt="FerixRG" /><span>FERIX<b>RG</b></span></a>; }

export default function Workspace() {
  const [location, setLocation] = useLocation();
  const authQuery = trpc.auth.me.useQuery(undefined, { retry: false, refetchOnWindowFocus: false });
  const workspaceBootstrapQuery = trpc.workspace.bootstrap.useQuery(undefined, { enabled: Boolean(authQuery.data), retry: false, refetchOnWindowFocus: false });
  const accountProfileQuery = trpc.account.profile.useQuery(undefined, { enabled: Boolean(authQuery.data), retry: false, refetchOnWindowFocus: false });
  const accountPreferencesQuery = trpc.account.preferences.useQuery(undefined, { enabled: Boolean(authQuery.data), retry: false, refetchOnWindowFocus: false });
  const accountSessionsQuery = trpc.account.sessions.useQuery(undefined, { enabled: Boolean(authQuery.data), retry: false, refetchOnWindowFocus: false });
  const activeWorkspaceId = workspaceBootstrapQuery.data?.workspace.id;
  const workspaceMembersQuery = trpc.workspace.members.useQuery({ workspaceId: activeWorkspaceId ?? 0 }, { enabled: Boolean(activeWorkspaceId), retry: false, refetchOnWindowFocus: false });
  const workspaceInvitationsQuery = trpc.workspace.invitations.useQuery({ workspaceId: activeWorkspaceId ?? 0 }, { enabled: Boolean(activeWorkspaceId), retry: false, refetchOnWindowFocus: false });
  const workspaceActivityQuery = trpc.workspace.activity.useQuery({ workspaceId: activeWorkspaceId ?? 0, limit: 12 }, { enabled: Boolean(activeWorkspaceId), retry: false, refetchOnWindowFocus: false });
  const workspaceStoresQuery = trpc.workspace.stores.list.useQuery({ workspaceId: activeWorkspaceId ?? 0 }, { enabled: Boolean(activeWorkspaceId), retry: false, refetchOnWindowFocus: false });
  const storeProviderReadinessQuery = trpc.workspace.stores.providerReadiness.useQuery(undefined, { enabled: Boolean(authQuery.data), retry: false, refetchOnWindowFocus: false });
  const aiProviderReadinessQuery = trpc.workspace.aiProviderReadiness.useQuery(undefined, { enabled: Boolean(authQuery.data), retry: false, refetchOnWindowFocus: false });
  const workspaceDashboardQuery = trpc.workspace.dashboard.useQuery({ workspaceId: activeWorkspaceId ?? 0 }, { enabled: Boolean(activeWorkspaceId), retry: false, refetchOnWindowFocus: false });
  const workspaceValidationRunsQuery = trpc.workspace.validationRuns.useQuery({ workspaceId: activeWorkspaceId ?? 0, limit: 20 }, { enabled: Boolean(activeWorkspaceId), retry: false, refetchOnWindowFocus: false });
  const workspaceReleasesQuery = trpc.workspace.releases.useQuery({ workspaceId: activeWorkspaceId ?? 0, limit: 20 }, { enabled: Boolean(activeWorkspaceId), retry: false, refetchOnWindowFocus: false });
  const workspaceUsageSummaryQuery = trpc.workspace.usageSummary.useQuery({ workspaceId: activeWorkspaceId ?? 0 }, { enabled: Boolean(activeWorkspaceId), retry: false, refetchOnWindowFocus: false });
  const workspaceRequestsQuery = trpc.workspace.requests.useQuery({ workspaceId: activeWorkspaceId ?? 0, limit: 20 }, { enabled: Boolean(activeWorkspaceId), retry: false, refetchOnWindowFocus: false });
  const legalTermsQuery = trpc.workspace.legalDocuments.useQuery({ documentKey: "terms" }, { enabled: false, retry: false });
  const legalPrivacyQuery = trpc.workspace.legalDocuments.useQuery({ documentKey: "privacy" }, { enabled: false, retry: false });
  const workspaceDraftsQuery = trpc.workspace.drafts.useQuery({ workspaceId: activeWorkspaceId ?? 0 }, { enabled: Boolean(activeWorkspaceId), retry: false, refetchOnWindowFocus: false });
  const [activeEditorDraftId, setActiveEditorDraftId] = useState<number | null>(null);
  const resolvedEditorDraftId = activeEditorDraftId ?? workspaceDraftsQuery.data?.[0]?.id ?? null;
  const workspaceDraftVersionsQuery = trpc.workspace.draftVersions.useQuery({ workspaceId: activeWorkspaceId ?? 0, draftId: resolvedEditorDraftId ?? 0 }, { enabled: Boolean(activeWorkspaceId && resolvedEditorDraftId), retry: false, refetchOnWindowFocus: false });
  const authUtils = trpc.useUtils();
  const logoutMutation = trpc.auth.logout.useMutation();
  const updateProfileMutation = trpc.account.updateProfile.useMutation();
  const updatePreferencesMutation = trpc.account.updatePreferences.useMutation();
  const requestEmailChangeMutation = trpc.account.requestEmailChange.useMutation();
  const requestPasswordResetMutation = trpc.account.requestPasswordReset.useMutation();
  const revokeOtherSessionsMutation = trpc.account.revokeOtherSessions.useMutation();
  const revokeSessionMutation = trpc.account.revokeSession.useMutation();
  const inviteWorkspaceMemberMutation = trpc.workspace.invite.useMutation();
  const updateWorkspaceMemberRoleMutation = trpc.workspace.updateMemberRole.useMutation();
  const updateWorkspaceInvitationRoleMutation = trpc.workspace.updateInvitationRole.useMutation();
  const removeWorkspaceMemberMutation = trpc.workspace.removeMember.useMutation();
  const cancelWorkspaceInvitationMutation = trpc.workspace.cancelInvitation.useMutation();
  const createPublicUrlSourceMutation = trpc.workspace.stores.createPublicUrlSource.useMutation();
  const createStoreMutation = trpc.workspace.stores.create.useMutation();
  const beginStoreConnectionMutation = trpc.workspace.stores.beginConnection.useMutation();
  const disconnectStoreMutation = trpc.workspace.stores.disconnect.useMutation();
  const queueToolRunMutation = trpc.workspace.queueToolRun.useMutation();
  const startToolRunMutation = trpc.workspace.startToolRun.useMutation();
  const executePublicUrlToolRunMutation = trpc.workspace.executePublicUrlToolRun.useMutation();
  const reportDownloadMutation = trpc.workspace.reportDownload.useMutation();
  const createWorkspaceDraftMutation = trpc.workspace.createDraft.useMutation();
  const saveWorkspaceDraftVersionMutation = trpc.workspace.saveDraftVersion.useMutation();
  const restoreWorkspaceDraftVersionMutation = trpc.workspace.restoreDraftVersion.useMutation();
  const queueValidationRunMutation = trpc.workspace.queueValidationRun.useMutation();
  const startValidationRunMutation = trpc.workspace.startValidationRun.useMutation();
  const executeDraftIntegrityValidationMutation = trpc.workspace.executeDraftIntegrityValidation.useMutation();
  const createReleaseActionMutation = trpc.workspace.createReleaseAction.useMutation();
  const approveReleaseActionMutation = trpc.workspace.approveReleaseAction.useMutation();
  const executeReleaseActionMutation = trpc.workspace.executeReleaseAction.useMutation();
  const cancelReleaseActionMutation = trpc.workspace.cancelReleaseAction.useMutation();
  const submitWorkspaceRequestMutation = trpc.workspace.submitRequest.useMutation();
  const acknowledgeResourceMutation = trpc.workspace.acknowledgeResource.useMutation();
  useEffect(() => {
    // A transport/API failure is not proof that the session is invalid. Do not
    // turn a dashboard request failure into a misleading login redirect.
    if (authQuery.isLoading || authQuery.isError || authQuery.data) return;
    const returnTo = `${window.location.pathname}${window.location.search}`;
    setLocation(`/auth/login?returnTo=${encodeURIComponent(returnTo)}`);
  }, [authQuery.data, authQuery.isError, authQuery.isLoading, setLocation]);
  if (authQuery.isError) return <main className="workspace-shell"><section className="workspace-empty-state"><h1>We could not verify your session</h1><p>The dashboard could not reach the account service. Your session was not discarded. Please retry.</p><button className="primary-button" onClick={() => void authQuery.refetch()}>Retry session check</button></section></main>;
  const initialView = useMemo(() => {
    if (location.includes("tools")) return "Tools Library"; if (location.includes("stores")) return "Stores"; if (location.includes("more")) return "More"; if (location.includes("issues")) return "Issues"; if (location.includes("redesign")) return "Redesign"; if (location.includes("editor")) return "Visual editor"; if (location.includes("analysis")) return "Analysis"; return "Overview";
  }, [location]);
  const requestedTool = useMemo(() => new URLSearchParams(window.location.search).get("tool"), [location]);
  const requestedToolStage = useMemo(() => new URLSearchParams(window.location.search).get("stage"), [location]);
  const requestedToolSource = useMemo(() => new URLSearchParams(window.location.search).get("source"), [location]);
  const requestedMoreFlow = useMemo(() => new URLSearchParams(window.location.search).get("more"), [location]);
  const requestedMoreAction = useMemo(() => new URLSearchParams(window.location.search).get("action"), [location]);
  const [view, setView] = useState(() => new URLSearchParams(window.location.search).get("store") ? "Store workspace" : requestedMoreFlow ? "More" : initialView);
  const [selectedIssue, setSelectedIssue] = useState<WorkspaceIssue | null>(null);
  const [filter, setFilter] = useState("All");
  const [toolIntent, setToolIntent] = useState(() => requestedTool && toolCatalog.some(tool => tool.id === requestedTool) ? requestedTool : "storefront-analyzer");
  const [selectedToolSource, setSelectedToolSource] = useState<string | null>(() => requestedToolSource);

  const [expandedToolGroup, setExpandedToolGroup] = useState<ToolCategory>("Content & AI");
  const [activeStoreId, setActiveStoreId] = useState(() => new URLSearchParams(window.location.search).get("store") ?? "atelier-forma");
  const activeStoreRecord = workspaceStoresQuery.data?.find(store => String(store.id) === activeStoreId) ?? workspaceStoresQuery.data?.[0];
  const activeStoreRecordId = activeStoreRecord?.id;
  const activeStoreConnectionsQuery = trpc.workspace.stores.connections.useQuery({ workspaceId: activeWorkspaceId ?? 0, storeId: activeStoreRecordId ?? 0 }, { enabled: Boolean(activeWorkspaceId && activeStoreRecordId), retry: false, refetchOnWindowFocus: false });
  const [dashboardSearch, setDashboardSearch] = useState("");
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [storeFlow, setStoreFlow] = useState<"list" | "add" | "connect" | "url" | "url-progress" | "detail" | "settings" | "disconnect">(() => new URLSearchParams(window.location.search).get("url") ? "url" : "list");
  const [toolFlow, setToolFlow] = useState<"library" | "setup" | "run" | "results" | "issue" | "fix" | "publish" | "success" | "export">(() => requestedToolStage === "results" ? "results" : requestedToolStage === "editor" ? "fix" : requestedToolStage === "finish" ? "publish" : requestedToolStage === "setup" ? "setup" : "library");
  const [moreFlow, setMoreFlow] = useState<"home" | "team" | "billing" | "profile" | "preferences" | "platform" | "resources" | "support">(() => ["team", "billing", "profile", "preferences", "platform", "resources", "support"].includes(requestedMoreFlow ?? "") ? requestedMoreFlow as "team" | "billing" | "profile" | "preferences" | "platform" | "resources" | "support" : "home");
  const [moreNotice, setMoreNotice] = useState("");
  const [moreAction, setMoreAction] = useState<{ section: string; action: string } | null>(() => requestedMoreFlow && requestedMoreAction && moreActionDetails[`${requestedMoreFlow}:${requestedMoreAction}`] ? { section: requestedMoreFlow, action: requestedMoreAction } : null);
  const [connectionFeedback, setConnectionFeedback] = useState<"idle" | "loading" | "error">("idle");
  const [connectionProvider, setConnectionProvider] = useState<"shopify" | "woocommerce" | "magento" | "custom">("shopify");
  const [urlAnalysisFeedback, setUrlAnalysisFeedback] = useState<"idle" | "error">("idle");
  const initialStoreUrl = useMemo(() => new URLSearchParams(window.location.search).get("url")?.trim() ?? "", [location]);
  const storeUrlRef = useRef(initialStoreUrl);
  const [logoutPrompt, setLogoutPrompt] = useState<"none" | "confirm" | "unsaved">("none");
  const [editorDirty, setEditorDirty] = useState(false);
  const [pendingEditorExit, setPendingEditorExit] = useState<string | "logout" | null>(null);
  const [saveBeforeEditorExit, setSaveBeforeEditorExit] = useState(false);
  const [teamInviteOpen, setTeamInviteOpen] = useState(false);
  const [removalMemberId, setRemovalMemberId] = useState<string | null>(null);
  const liveTeamMembers = useMemo<TeamMember[]>(() => {
    if (!activeWorkspaceId) return [];
    const active = (workspaceMembersQuery.data ?? []).map(item => ({ id: `member-${item.member.id}`, source: "member" as const, sourceId: item.member.id, name: item.user.name || item.user.email || "Workspace member", email: item.user.email || "No email address", role: `${item.member.role[0].toUpperCase()}${item.member.role.slice(1)}` as TeamRole, status: "Active" as const }));
    const pending = (workspaceInvitationsQuery.data ?? []).filter(item => item.status === "pending").map(item => ({ id: `invitation-${item.id}`, source: "invitation" as const, sourceId: item.id, name: item.email.split("@")[0].replace(/[._-]/g, " ").replace(/\b\w/g, letter => letter.toUpperCase()), email: item.email, role: `${item.role[0].toUpperCase()}${item.role.slice(1)}` as TeamRole, status: "Pending" as const }));
    return [...active, ...pending];
  }, [activeWorkspaceId, workspaceInvitationsQuery.data, workspaceMembersQuery.data]);
  const liveActivity = useMemo(() => (workspaceActivityQuery.data ?? []).map(event => ({ id: event.id, text: event.eventType.replace(/[._]/g, " ").replace(/\b\w/g, letter => letter.toUpperCase()), destination: event.eventType.startsWith("team.") ? "More" : event.eventType.startsWith("tool_run.") ? "Reports" : event.eventType.startsWith("draft.") ? "Visual editor" : "Stores", createdAt: event.createdAt })), [workspaceActivityQuery.data]);
  const notificationItems = liveActivity.slice(0, 8);
  const searchToolResults = useMemo(() => dashboardSearch.trim() ? filterTools(dashboardSearch, "All tools").slice(0, 8) : [], [dashboardSearch]);
  const searchActivityResults = useMemo(() => {
    const query = dashboardSearch.trim().toLowerCase();
    return query ? liveActivity.filter(item => item.text.toLowerCase().includes(query)).slice(0, 4) : [];
  }, [dashboardSearch, liveActivity]);
  const searchStoreResults = useMemo(() => {
    const query = dashboardSearch.trim().toLowerCase();
    return query ? (workspaceStoresQuery.data ?? []).filter(store => `${store.name} ${store.platform} ${store.url}`.toLowerCase().includes(query)).slice(0, 4) : [];
  }, [dashboardSearch, workspaceStoresQuery.data]);
  const searchReportResults = useMemo(() => {
    const query = dashboardSearch.trim().toLowerCase();
    const reports = workspaceDashboardQuery.data?.reports.records ?? [];
    return query ? reports.filter(report => `${report.title} ${report.format} ${report.toolRunId}`.toLowerCase().includes(query)).slice(0, 4) : [];
  }, [dashboardSearch, workspaceDashboardQuery.data?.reports.records]);
  const sidebarStore = useMemo(() => {
    const stores = workspaceStoresQuery.data ?? [];
    return stores.find(store => String(store.id) === activeStoreId) ?? stores[0] ?? null;
  }, [activeStoreId, workspaceStoresQuery.data]);
  const accountDisplayName = accountProfileQuery.data?.name || authQuery.data?.name || "there";
  const accountInitials = accountDisplayName.split(/\s+/).filter(Boolean).slice(0, 2).map(part => part[0]).join("").toUpperCase() || "FR";

  const applyViewChange = (next: string) => { if (next === "Overview" && window.location.search) window.history.replaceState({}, "", "/app"); setView(next); window.scrollTo({ top: 0, behavior: "smooth" }); };
  const changeView = (next: string) => {
    if (view === "Visual editor" && editorDirty && next !== "Visual editor") {
      setPendingEditorExit(next);
      setLogoutPrompt("unsaved");
      return;
    }
    applyViewChange(next);
  };
  const openDesktopView = (next: string) => {
    if (next === "Stores") setStoreFlow("list");
    if (next === "Tools Library") setToolFlow("library");
    if (next === "More") setMoreFlow("home");
    changeView(next);
  };
  const openTool = (toolId: string, source?: string) => { setToolIntent(toolId); setSelectedToolSource(source ?? null); setToolFlow("library"); changeView("Tools Library"); };
  const openStore = (storeId: string) => { window.history.replaceState({}, "", `/app?store=${storeId}`); setActiveStoreId(storeId); changeView("Store workspace"); };
  const beginStoreConnection = async () => {
    setConnectionFeedback("loading");
    try {
      if (!activeWorkspaceId) throw new Error("Workspace is not ready.");
      let connectionStore = workspaceStoresQuery.data?.find(store => String(store.id) === activeStoreId && store.platform === connectionProvider) ?? workspaceStoresQuery.data?.find(store => store.platform === connectionProvider);
      if (!connectionStore) {
        const parsed = new URL(storeUrlRef.current);
        if (!/^https?:$/.test(parsed.protocol)) throw new Error("Enter the public HTTPS storefront URL before connecting Shopify.");
        const created = await createStoreMutation.mutateAsync({ workspaceId: activeWorkspaceId, name: parsed.hostname.replace(/^www\./, "") || `${connectionProvider} storefront`, platform: connectionProvider, url: parsed.toString() });
        connectionStore = created;
      }
      const result = await beginStoreConnectionMutation.mutateAsync({ workspaceId: activeWorkspaceId, storeId: connectionStore.id, provider: connectionProvider, scopes: ["read_products", "read_content", "read_themes"] });
      await authUtils.workspace.stores.list.invalidate();
      await authUtils.workspace.activity.invalidate();
      setConnectionFeedback("idle");
      setStoreFlow("detail");
      toast.success("Connection request recorded", { description: result.readiness.message });
    } catch (error) {
      setConnectionFeedback("error");
      toast.error("Connection couldn’t be completed", { description: error instanceof Error ? error.message : "No store data or publishing permissions were changed." });
    }
  };
  const showConnectionError = () => {
    setConnectionFeedback("error");
    toast.error("Connection couldn’t be completed", { description: "No store data or publishing permissions were changed. Check access and try again." });
  };
  const disconnectStore = async () => {
    setConnectionFeedback("loading");
    try {
      if (!activeWorkspaceId || !activeStoreRecordId) throw new Error("No live store is selected.");
      await disconnectStoreMutation.mutateAsync({ workspaceId: activeWorkspaceId, storeId: activeStoreRecordId });
      await authUtils.workspace.stores.list.invalidate();
      await authUtils.workspace.stores.connections.invalidate();
      await authUtils.workspace.activity.invalidate();
      await authUtils.workspace.dashboard.invalidate();
      setConnectionFeedback("idle");
      setStoreFlow("list");
      toast.success("Store disconnected", { description: "The connection was revoked. Existing snapshots, reports, and drafts were kept." });
    } catch (error) {
      setConnectionFeedback("error");
      toast.error("Store could not be disconnected", { description: error instanceof Error ? error.message : "No store data was changed." });
    }
  };
  const beginUrlAnalysis = async () => {
    const cleanUrl = storeUrlRef.current.trim();
    let parsed: URL;
    try {
      if (!cleanUrl) throw new Error("URL is required");
      parsed = new URL(cleanUrl);
      if (!/^https?:$/.test(parsed.protocol)) throw new Error("Unsupported URL protocol");
    } catch {
      setUrlAnalysisFeedback("error");
      toast.error("Enter a valid storefront URL", { description: "Use a public URL beginning with http:// or https://, then try the analysis again." });
      return;
    }
    setUrlAnalysisFeedback("idle");
    try {
      if (!activeWorkspaceId) throw new Error("Workspace is not ready");
      const name = parsed.hostname.replace(/^www\./, "") || "Public storefront";
      const sourceRecord = await createPublicUrlSourceMutation.mutateAsync({ workspaceId: activeWorkspaceId, name, url: parsed.toString() });
      const queuedRun = await queueToolRunMutation.mutateAsync({ workspaceId: activeWorkspaceId, toolId: "storefront-analyzer", sourceType: "public_url", storeId: sourceRecord.store.id, inputSummary: { url: parsed.toString(), sourceSnapshotId: sourceRecord.snapshot.id } });
      const startedRun = await startToolRunMutation.mutateAsync({ workspaceId: activeWorkspaceId, toolRunId: queuedRun.id });
      await executePublicUrlToolRunMutation.mutateAsync({ workspaceId: activeWorkspaceId, toolRunId: startedRun.id });
      await authUtils.workspace.stores.list.invalidate();
      await authUtils.workspace.activity.invalidate();
      await authUtils.workspace.dashboard.invalidate();
      await authUtils.workspace.reports.invalidate();
      setStoreFlow("list");
    } catch (error) {
      setUrlAnalysisFeedback("error");
      toast.error("We couldn’t complete that storefront analysis", { description: error instanceof Error ? error.message : "No analysis result was saved." });
      return;
    }
    changeView("Stores");
    toast.success("URL inspection completed", { description: "The public-URL executor saved the storefront evidence and report record in the Stores workspace." });
  };
  const finishAuthenticatedLogout = async () => {
    try {
      await logoutMutation.mutateAsync();
      await authUtils.auth.me.invalidate();
      setLocation("/auth/login?reason=signed-out");
    } catch {
      toast.error("We couldn’t sign you out", { description: "Please try again before closing this workspace." });
      setLogoutPrompt("none");
    }
  };
  const finishPendingEditorExit = async () => {
    const destination = pendingEditorExit;
    setEditorDirty(false);
    setPendingEditorExit(null);
    setLogoutPrompt("none");
    if (destination === "logout") await finishAuthenticatedLogout();
    else if (destination) applyViewChange(destination);
  };
  const resolveEditorExit = (save: boolean) => {
    if (save) {
      setSaveBeforeEditorExit(true);
      return;
    }
    void finishPendingEditorExit();
  };
  const requestLogout = () => {
    if (view === "Visual editor" && editorDirty) {
      setPendingEditorExit("logout");
      setLogoutPrompt("unsaved");
      return;
    }
    setLogoutPrompt("confirm");
  };
  useEffect(() => {
    const preventUnload = (event: BeforeUnloadEvent) => {
      if (!editorDirty) return;
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", preventUnload);
    return () => window.removeEventListener("beforeunload", preventUnload);
  }, [editorDirty]);
  const toolGroupLabel = (group: ToolCategory) => group;
  return <div className="workspace dashboard-system">
    <aside className="app-sidebar approved-sidebar desktop-workspace-sidebar"><Brand /><span className="sidebar-tagline">AI storefront intelligence</span><nav className="app-nav approved-nav desktop-workspace-nav" aria-label="Desktop workspace navigation">{desktopNavGroups.map(group => <section className="desktop-nav-group" key={group.label}><span>{group.label}</span>{group.items.map(item => <button key={item.label} className={view === item.destination ? "active" : ""} onClick={() => openDesktopView(item.destination)}><item.icon /> {item.label}</button>)}</section>)}</nav>{view === "Tools Library" && <div className="desktop-tool-subnav" aria-label="Tool groups">{(toolCategories.slice(1) as ToolCategory[]).map(group => <section key={group}><button onClick={() => setExpandedToolGroup(expandedToolGroup === group ? "Content & AI" : group)}><span>{expandedToolGroup === group ? "⌄" : "›"}</span>{toolGroupLabel(group)}<b>{toolCatalog.filter(tool => tool.category === group).length}</b></button>{expandedToolGroup === group && <div>{toolCatalog.filter(tool => tool.category === group).map(tool => <button className={toolIntent === tool.id ? "active" : ""} onClick={() => { setToolIntent(tool.id); setToolFlow("library"); }} key={tool.id}>{tool.name}</button>)}</div>}</section>)}</div>}<div className="store-mini">{sidebarStore ? <><div className="store-mini-top"><div className="store-orb">{sidebarStore.name.slice(0, 2).toUpperCase()}</div><div><strong>{sidebarStore.name}</strong><span>{sidebarStore.platform} · {sidebarStore.status}</span></div></div><button onClick={() => openStore(String(sidebarStore.id))}>Open store</button></> : <><div className="store-mini-top"><div className="store-orb">+</div><div><strong>No store selected</strong><span>Add a public URL or supported store</span></div></div><button onClick={() => { setStoreFlow("add"); changeView("Stores"); }}>Add store</button></>}</div></aside>
    <main className={`app-main dashboard-system-main ${view === "Overview" || view === "Store workspace" ? "overview-mode" : ""}`}><header className="app-topbar approved-topbar">{view === "Overview" ? <><label className="approved-search"><Search /><input value={dashboardSearch} onFocus={() => setSearchOpen(Boolean(dashboardSearch.trim()))} onChange={event => { setDashboardSearch(event.target.value); setSearchOpen(Boolean(event.target.value.trim())); }} autoCapitalize="none" autoCorrect="off" spellCheck={false} enterKeyHint="search" onKeyDown={event => { if (event.key === "Enter") { const tool = searchToolResults[0]; const store = searchStoreResults[0]; setSearchOpen(false); if (tool) { setToolIntent(tool.id); setSelectedToolSource(null); changeView("Tools Library"); } else if (store) openStore(String(store.id)); else changeView("Reports"); } }} placeholder="Search stores, projects, reports, or tools…" /><kbd>⌘ K</kbd></label><div className="approved-top-actions"><button onClick={() => changeView("Tools Library")} aria-label="Open help"><CircleHelp /></button><button onClick={() => setNotificationOpen(open => !open)} aria-label="Open notifications" aria-expanded={notificationOpen} className="approved-bell"><Bell />{notificationItems.length > 0 && <i />}</button><button className="approved-avatar" onClick={() => { setMoreFlow("profile"); changeView("More"); }} aria-label="Open profile">{accountInitials}</button></div></> : <><div className="top-context"><div className="store-dot" /><div><span className="crumb">Workspace / {view} /</span><strong>{view}</strong></div></div><div className="top-actions"><button className="search-trigger" onClick={() => changeView("Tools Library")}><Search size={14}/> Search anything <kbd>⌘ K</kbd></button><button className="round-icon" onClick={() => setNotificationOpen(open => !open)} aria-label="Open notifications" aria-expanded={notificationOpen}><Bell /></button><button className="app-button" onClick={() => changeView("Tools Library")}><ScanLine size={14}/><span>Start a tool</span></button></div></>}</header>{view === "Overview" && searchOpen && dashboardSearch.trim() && <section className="workspace-search-popover" role="listbox" aria-label="Search results"><header><div><span className="approved-eyebrow">Command center search</span><h2>Results for “{dashboardSearch.trim()}”</h2></div><button type="button" onClick={() => { setDashboardSearch(""); setSearchOpen(false); }} aria-label="Clear search">×</button></header>{searchToolResults.length || searchStoreResults.length || searchReportResults.length || searchActivityResults.length ? <div className="workspace-search-results">{searchToolResults.map(tool => <button type="button" key={tool.id} onClick={() => { setToolIntent(tool.id); setSelectedToolSource(null); setSearchOpen(false); changeView("Tools Library"); }}><span className="workspace-search-icon"><ScanLine size={14} /></span><span><b>{tool.name}</b><small>{tool.category} · {tool.description}</small></span><ChevronRight /></button>)}{searchStoreResults.map(store => <button type="button" key={`store-${store.id}`} onClick={() => { setSearchOpen(false); openStore(String(store.id)); }}><span className="workspace-search-icon"><Store size={14} /></span><span><b>{store.name}</b><small>{store.platform} · {store.status}</small></span><ChevronRight /></button>)}{searchReportResults.map(report => <button type="button" key={`report-${report.id}`} onClick={() => { setSearchOpen(false); changeView("Reports"); }}><span className="workspace-search-icon"><FileBarChart size={14} /></span><span><b>{report.title}</b><small>{report.format.toUpperCase()} · saved report</small></span><ChevronRight /></button>)}{searchActivityResults.map(item => <button type="button" key={`activity-${item.id}`} onClick={() => { setSearchOpen(false); changeView(item.destination); }}><span className="workspace-search-icon"><Activity size={14} /></span><span><b>{item.text}</b><small>Workspace activity · open {item.destination}</small></span><ChevronRight /></button>)}</div> : <div className="workspace-search-empty"><Search /><b>No matching tools or activity</b><p>Try a tool name, capability, report, store, or recorded workspace event.</p></div>}</section>}{notificationOpen && <section className="workspace-notification-popover" role="dialog" aria-label="Notifications"><header><div><span className="approved-eyebrow">Workspace activity</span><h2>Notifications</h2></div><button type="button" onClick={() => setNotificationOpen(false)} aria-label="Close notifications">×</button></header>{notificationItems.length ? <div className="workspace-notification-list">{notificationItems.map(item => <button type="button" key={item.id} onClick={() => { setNotificationOpen(false); changeView(item.destination); }}><span className="workspace-notification-dot"><Bell size={14} /></span><span><b>{item.text}</b><small>{item.createdAt ? new Date(item.createdAt).toLocaleString() : "Recorded in workspace activity"}</small></span><ChevronRight /></button>)}</div> : <div className="workspace-notification-empty"><Bell /><b>No notifications yet</b><p>New login, store, upload, tool-run, draft, and team events will appear here when recorded by the workspace.</p></div>}<button type="button" className="workspace-notification-footer" onClick={() => { setNotificationOpen(false); changeView("Reports"); }}>Open activity history <ChevronRight /></button></section>}<div className="app-content">{renderView()}</div></main>
    <nav className="mobile-app-nav approved-mobile-nav" aria-label="Mobile workspace navigation">
      <button className={view==="Overview" ? "active" : ""} onClick={() => changeView("Overview")}><LayoutDashboard /><span>Home</span></button>
      <button className={view==="Stores" || view==="Store workspace" ? "active" : ""} onClick={() => { setStoreFlow("list"); changeView("Stores"); }}><Store /><span>Stores</span></button>
      <button className={view==="Tools Library" ? "active" : ""} onClick={() => { setToolFlow("library"); changeView("Tools Library"); }}><Wand2 /><span>Tools</span></button>
      <button className={view==="More" ? "active" : ""} onClick={() => { setMoreFlow("home"); changeView("More"); }}><MoreHorizontal /><span>More</span></button>
    </nav>
    {logoutPrompt !== "none" && <div className="logout-dialog-layer" role="dialog" aria-modal="true" aria-labelledby="logout-dialog-title"><section className="logout-dialog"><span className="logout-dialog-icon"><ShieldCheck /></span><h2 id="logout-dialog-title">{logoutPrompt === "unsaved" ? "You have unsaved editor changes" : "Sign out of your account?"}</h2><p>{logoutPrompt === "unsaved" ? "Save a workspace version before leaving, or leave without saving these editor changes." : "You’ll need to sign in again to access your workspace."}</p>{logoutPrompt === "unsaved" ? <><button className="approved-primary" onClick={() => resolveEditorExit(true)}><Check /> {pendingEditorExit === "logout" ? "Save & Sign Out" : "Save & Continue"}</button><button className="logout-destructive" onClick={() => resolveEditorExit(false)}>{pendingEditorExit === "logout" ? "Sign Out Without Saving" : "Leave Without Saving"}</button></> : <button className="logout-destructive" onClick={finishAuthenticatedLogout}>Sign Out</button>}<button className="approved-secondary" onClick={() => { setPendingEditorExit(null); setSaveBeforeEditorExit(false); setLogoutPrompt("none"); }}>Cancel</button></section></div>}
  </div>;

  function PageHeading({ label, title, copy, action }: { label: string; title: string; copy: string; action?: React.ReactNode }) { return <div className="page-heading"><div><span className="eyebrow">{label}</span><h1>{title}</h1><p className="subtle">{copy}</p></div>{action}</div>; }

  function renderView() {
    if (view === "Overview") return <Overview />;
    if (view === "Stores") return <StoresFlow />;
    if (view === "Store workspace") return <StorePanel />;
    if (view === "Tools Library") return <ToolsLibrary />;
    if (view === "Analysis") return <Analysis />;
    if (view === "Issues") return <Issues />;
    if (view === "Redesign") return <Redesign />;
    if (view === "Visual editor") return <Editor />;
    if (view === "Preview & validate") return <ValidationRelease />;
    if (view === "Versions") return <Placeholder title="Every deliberate change deserves a trace." copy="Review the draft history, compare score changes, restore a prior version, and keep publish decisions grounded in validation evidence." icon={<Activity />} action="Create a baseline version" />;
    if (view === "Reports") return <Reports />;
    if (view === "More") return <MoreFlow />;
    return <Placeholder title="A technical answer should include the context." copy="Use the Developer Tools to scan a URL, inspect responsive evidence, and create a concise implementation handoff." icon={<Code2 />} action="Start a URL diagnostic" />;
  }

  function ToolsLibrary() {
    const [category, setCategory] = useState<ToolCategory | "All tools">("All tools");
    const [query, setQuery] = useState(dashboardSearch);
    useEffect(() => { if (dashboardSearch !== query) setQuery(dashboardSearch); }, [dashboardSearch]);
    const [selectedId, setSelectedId] = useState(toolIntent || toolCatalog[0].id);
    const [startChoice, setStartChoice] = useState(selectedToolSource ?? requestedToolSource ?? "");
    const [launchNote, setLaunchNote] = useState("");
    const [showAllTools, setShowAllTools] = useState(false);
    const toolDetailRef = useRef<HTMLElement | null>(null);
    const visibleTools = filterTools(query, category);
    const selectedTool = toolCatalog.find(tool => tool.id === selectedId) ?? toolCatalog[0];
    useEffect(() => {
      const intendedTool = toolIntent ? toolCatalog.find(tool => tool.id === toolIntent) : undefined;
      if (!intendedTool) return;
      setSelectedId(intendedTool.id);
      setStartChoice(selectedToolSource && intendedTool.sources.includes(selectedToolSource as never) ? selectedToolSource : "");
      setLaunchNote("");
    }, [selectedToolSource, toolIntent]);
    useEffect(() => {
      if (visibleTools.length && !visibleTools.some(tool => tool.id === selectedId)) {
        setSelectedId(visibleTools[0].id);
        setStartChoice("");
        setLaunchNote("");
      }
    }, [query, category, selectedId, visibleTools]);
    const iconFor = (tool: ToolDefinition) => tool.kind === "analysis" ? ScanLine : tool.kind === "generator" ? Sparkles : tool.kind === "workspace" ? Layers3 : tool.kind === "release" ? Check : ShieldCheck;
    const chooseStart = (choice: string) => { setStartChoice(choice); setLaunchNote(""); };
    const selectTool = (id: string) => { setSelectedId(id); setStartChoice(""); setSelectedToolSource(null); setLaunchNote(""); if (window.innerWidth <= 820) window.setTimeout(() => toolDetailRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 0); };
    const clearDiscovery = () => { setQuery(""); setCategory("All tools"); };
    const categoryCount = (item: ToolCategory | "All tools") => filterTools(query, item).length;
    const hasDiscoveryFilter = Boolean(query) || category !== "All tools";
    const launchPreview = () => { setToolIntent(selectedTool.id); setSelectedToolSource(startChoice || null); setToolFlow("setup"); window.scrollTo({ top: 0, behavior: "smooth" }); };
    const activeStore = (workspaceStoresQuery.data ?? []).find(store => String(store.id) === activeStoreId) ?? workspaceStoresQuery.data?.[0] ?? null;
    const liveDashboard = workspaceDashboardQuery.data;
    const displayedTools = hasDiscoveryFilter || showAllTools ? visibleTools : visibleTools.slice(0, 6);
    if (toolFlow !== "library") {
      const startAt = toolFlow === "results" ? "results" : toolFlow === "fix" ? "editor" : toolFlow === "publish" ? "finish" : "setup";
      return <ApprovedToolWorkflow key={selectedTool.id} tool={selectedTool} workspaceId={activeWorkspaceId} storeId={activeStore?.id} storeName={activeStore?.name} startAt={startAt} startSource={selectedToolSource ?? requestedToolSource ?? undefined} onBack={() => setToolFlow("library")} />;
    }
    return <section className="concise-board concise-tools-board"><header className="concise-board-header"><div><span className="approved-eyebrow">Tools Library · {activeStore?.name ?? "FerixRG"}</span><h1>Choose a FerixRG tool.</h1><p>Browse the real tool groups, select one exact tool, then provide only the input that tool needs.</p></div><button className="approved-primary" onClick={() => selectTool("storefront-analyzer")}><ScanLine /> Storefront Analyzer</button></header><section className="concise-summary-strip"><span><b>{toolCatalog.length}</b> available tools</span><span><b>{liveDashboard?.stores.connected ?? 0}</b> connected stores</span><span><b>{liveDashboard?.issues.open ?? 0}</b> open issues</span></section><section className="approved-panel concise-tool-search"><Search /><input value={query} onChange={event => setQuery(event.target.value)} autoCapitalize="none" autoCorrect="off" spellCheck={false} enterKeyHint="search" placeholder="Search exact tools, results, inputs, or features" aria-label="Search the Tools Library" />{query && <button type="button" onClick={() => setQuery("")}>Clear</button>}</section><div className="concise-tool-filters" aria-label="Tool categories">{toolCategories.map(item => <button className={category === item ? "active" : ""} onClick={() => { setCategory(item); setShowAllTools(true); }} key={item}>{item}<b>{categoryCount(item)}</b></button>)}{hasDiscoveryFilter && <button onClick={() => { clearDiscovery(); setShowAllTools(false); }}>Reset</button>}</div><section className="concise-primary-grid concise-tools-grid"><article className="approved-panel concise-tool-catalog"><div className="concise-panel-heading"><div><span className="approved-eyebrow">{hasDiscoveryFilter ? `${visibleTools.length} matches` : "Exact tool catalogue"}</span><h2>{hasDiscoveryFilter ? "Relevant tools" : "Select a tool"}</h2></div>{!hasDiscoveryFilter && <button onClick={() => setShowAllTools(!showAllTools)}>{showAllTools ? "Show fewer" : "See all tools"} <ChevronRight /></button>}</div><div className="concise-tool-grid">{displayedTools.length ? displayedTools.map(tool => { const ToolIcon = iconFor(tool); return <button className={`concise-tool-card ${selectedTool.id === tool.id ? "selected" : ""}`} onClick={() => selectTool(tool.id)} key={tool.id}><span><ToolIcon /></span><div><b>{tool.name}</b><small>{tool.requiresConnection ? "Connection required" : tool.kind === "workspace" ? "Workspace access" : "Supported inputs available"}</small></div><ChevronRight /></button> }) : <div className="tool-empty-state"><Search /><h3>No matching tools.</h3><button className="approved-primary" onClick={clearDiscovery}>Clear search</button></div>}</div></article><aside className="approved-panel tool-detail-panel concise-tool-detail" ref={toolDetailRef}><span className="approved-eyebrow">Selected {selectedTool.kind}</span><h2>{selectedTool.name}</h2><p>{selectedTool.description}</p><div className="concise-tool-result"><b>Result</b><span>{selectedTool.outcome}</span></div><div className="concise-source-row">{selectedTool.sources.map(source => <button className={startChoice === source ? "selected" : ""} onClick={() => chooseStart(source)} key={source}>{source}</button>)}</div>{selectedTool.connections.length > 0 && <p className="concise-requirement">Requires {selectedTool.connections.join(" or ")} for restricted access or release actions.</p>}<button className="approved-primary" disabled={!startChoice} onClick={launchPreview}><Play /> Start {selectedTool.name}</button>{!startChoice && <small>Choose one input to continue.</small>}</aside></section></section>;
  }

  function UploadIcon() { return <PanelRightOpen />; }

  function FlowHeader({ back, title, copy, action }: { back?: () => void; title: string; copy: string; action?: React.ReactNode }) {
    return <header className="mobile-flow-header"><div>{back && <button className="mobile-back" onClick={back}><ArrowRight /> Back</button>}<span className="flow-kicker">FERIXRG WORKSPACE</span><h1>{title}</h1><p>{copy}</p></div>{action}</header>;
  }

  function StoresFlow() {
    const navigateStores = (next: typeof storeFlow) => { setStoreFlow(next); window.scrollTo({ top: 0, behavior: "smooth" }); };
    const registryStores = workspaceStoresQuery.data?.map(store => ({ id: String(store.id), name: store.name, platform: store.platform === "public_url" ? "Public URL" : `${store.platform[0].toUpperCase()}${store.platform.slice(1)}`, connection: store.status === "connected" ? "Connected" : store.status === "attention" ? "Needs attention" : store.status === "disconnected" ? "Disconnected" : "Source saved", health: store.healthScore ?? 0, initials: store.name.slice(0, 2).toUpperCase(), url: store.url, lastActivity: store.updatedAt ? new Date(store.updatedAt).toLocaleDateString() : "Not analyzed", openIssues: (workspaceDashboardQuery.data?.issues.records ?? []).filter(issue => issue.storeId === store.id && (issue.status === "open" || issue.status === "in_progress")).length, drafts: (workspaceDraftsQuery.data ?? []).filter(draft => draft.storeId === store.id && (draft.status === "draft" || draft.status === "review")).length }));
    const visibleStores = registryStores ?? [];
    const primaryStore = visibleStores[0];
    const selectedStore = visibleStores.find(store => store.id === activeStoreId) ?? primaryStore;
    const selectedConnection = activeStoreConnectionsQuery.data?.[0];
    const selectedProviderReadiness = storeProviderReadinessQuery.data?.find(provider => provider.provider === selectedConnection?.provider || provider.provider === selectedStore?.platform?.toLowerCase());
    const selectedConnectionReady = selectedConnection?.status === "connected" && Boolean(selectedProviderReadiness?.configured);
    const popularPlatforms = [{ label: "Shopify", provider: "shopify", mark: "S" }, { label: "WooCommerce", provider: "woocommerce", mark: "woo" }, { label: "Adobe Commerce", provider: "magento", mark: "A" }, { label: "Custom adapter", provider: "custom", mark: "C" }] as const;
    const readinessForProvider = (provider: string) => storeProviderReadinessQuery.data?.find(item => item.provider === provider);
    if (!primaryStore && storeFlow === "list") return <section className="concise-board concise-stores-board"><header className="concise-board-header"><div><span className="approved-eyebrow">Store registry</span><h1>Your Stores</h1><p>Add a public storefront URL to begin analysis, or start a supported connection when its server-side authorization is configured.</p></div><button className="approved-primary" onClick={() => navigateStores("add")}><Plus /> Add Store</button></header><section className="approved-panel concise-next-card"><span className="approved-eyebrow">No stores yet</span><h2>Start with the storefront you want to understand.</h2><p>A public URL stores visible storefront evidence. A supported connection can later add only the permissions you approve.</p><button className="approved-primary" onClick={() => navigateStores("add")}><Plus /> Add Store</button></section></section>;
    if (storeFlow === "add") return <section className="mobile-flow-page"><FlowHeader back={() => navigateStores("list")} title="Add a Store" copy="Connect your storefront to unlock the tools and capabilities available for your platform." /><div className="mobile-search-field"><Search /> Search platforms...</div><span className="flow-section-label">Popular platforms</span><div className="platform-choice-grid">{popularPlatforms.map(platform => { const readiness = readinessForProvider(platform.provider); const available = Boolean(readiness?.configured); return <button className={connectionProvider === platform.provider ? "selected" : ""} disabled={!available} aria-label={`${platform.label}${available ? "" : ", adapter not configured"}`} onClick={() => { if (!available) return; setConnectionProvider(platform.provider); setConnectionFeedback("idle"); navigateStores("connect"); }} key={platform.provider}><b>{platform.mark}</b><span>{platform.label}<small>{available ? "Configured server adapter" : readiness?.message ?? "Adapter not configured"}</small></span><ChevronRight /></button>; })}</div><span className="flow-section-label">More platforms</span><div className="flow-chip-grid">{["PrestaShop", "OpenCart", "Ecwid", "Saleor", "commercetools", "Medusa", "Vendure"].map(item => <button type="button" disabled aria-label={`${item}, platform adapter not configured`} key={item}>{item}<small>Unavailable</small></button>)}</div><button className="flow-url-link" onClick={() => navigateStores("url")}><Link2 /> I don’t see my platform — analyze by URL instead</button></section>;
    if (storeFlow === "connect") { const providerName = connectionProvider === "shopify" ? "Shopify" : connectionProvider === "woocommerce" ? "WooCommerce" : connectionProvider === "magento" ? "Adobe Commerce" : "Custom store"; const providerMark = connectionProvider === "shopify" ? "S" : connectionProvider === "woocommerce" ? "woo" : connectionProvider === "magento" ? "A" : "C"; return <section className="mobile-flow-page"><FlowHeader back={() => navigateStores("add")} title={`Connect your ${providerName} store`} copy="Connect your store securely to use the capabilities available for this platform." /><div className="connection-identity"><span>{providerMark}</span><div><b>{providerName}</b><small>Server-side adapter readiness</small></div></div><label className="flow-input-label">Storefront URL<div className="flow-input"><Link2 /><input type="url" inputMode="url" autoCapitalize="none" autoCorrect="off" spellCheck={false} defaultValue={storeUrlRef.current} onChange={event => { storeUrlRef.current = event.target.value; }} aria-label={`${providerName} storefront URL`} /></div></label><section className="flow-card"><span className="flow-section-label">Available after connection</span><div className="flow-access-row"><span>Provider configuration</span><em>{selectedProviderReadiness?.configured ? "Configured" : selectedProviderReadiness?.message ?? "Not configured"}</em></div><div className="flow-access-row"><span>Authorization request</span><em>{selectedProviderReadiness?.configured ? "Available after URL validation" : "Unavailable until configured"}</em></div><div className="flow-access-row"><span>Publishing access</span><em>Not granted by this request</em></div></section>{connectionFeedback === "error" && <section className="flow-inline-error" role="alert"><b>We couldn’t complete the connection.</b><p>No store data or publishing permission was changed. Check that you have store access, then try again.</p></section>}<button className={`flow-primary ${connectionFeedback === "loading" ? "is-loading" : ""}`} disabled={connectionFeedback === "loading"} onClick={beginStoreConnection}>{connectionFeedback === "loading" ? <><RefreshCw className="animate-spin" /> Connecting securely…</> : <><Store /> Connect Store</>}</button>{connectionFeedback === "loading" && <p className="flow-loading-copy" aria-live="polite">Verifying store access and supported capabilities…</p>}{connectionFeedback === "error" ? <button className="flow-secondary" onClick={beginStoreConnection}><RefreshCw /> Retry connection</button> : <button className="flow-url-link" onClick={showConnectionError}>Having trouble connecting?</button>}<button className="flow-secondary" onClick={() => navigateStores("url")}><Link2 /> Analyze by URL instead</button></section>;
    };
    if (storeFlow === "url") return <section className="mobile-flow-page"><FlowHeader back={() => navigateStores("add")} title="Analyze a Store URL" copy="Enter a publicly accessible storefront URL to analyze the visible experience without connecting your store." /><form onSubmit={event => { event.preventDefault(); void beginUrlAnalysis(); }}><label className="flow-input-label">Storefront URL<div className="flow-input"><Link2 /><input type="text" inputMode="url" autoCapitalize="none" autoCorrect="off" spellCheck={false} placeholder="https://yourstore.com" defaultValue={storeUrlRef.current} onChange={event => { storeUrlRef.current = event.target.value; if (urlAnalysisFeedback === "error") setUrlAnalysisFeedback("idle"); }} aria-label="Storefront URL" aria-invalid={urlAnalysisFeedback === "error"} /><button type="button" className="flow-input-clear" aria-label="Clear storefront URL" disabled={false} onClick={event => { storeUrlRef.current = ""; const input = event.currentTarget.parentElement?.querySelector("input"); if (input) input.value = ""; setUrlAnalysisFeedback("idle"); }}>×</button></div></label>{urlAnalysisFeedback === "error" && <section className="flow-inline-error" role="alert"><b>That URL can’t be analyzed yet.</b><p>Enter a public storefront URL starting with http:// or https://, then try again.</p></section>}<section className="flow-card"><b>URL analysis unlocks</b><p>Visible design, structure, responsiveness, performance, and accessibility analysis.</p><div className="flow-access-row"><span>Storefront analysis</span><b>✓</b></div><div className="flow-access-row"><span>Publishing or editing</span><em>Connect a supported store</em></div></section><button type="submit" className="flow-primary" disabled={createPublicUrlSourceMutation.isPending || queueToolRunMutation.isPending || startToolRunMutation.isPending || executePublicUrlToolRunMutation.isPending}><ScanLine /> {createPublicUrlSourceMutation.isPending || queueToolRunMutation.isPending || startToolRunMutation.isPending || executePublicUrlToolRunMutation.isPending ? "Sending request…" : "Analyze URL"}</button></form></section>;
    if (storeFlow === "url-progress") return <section className="mobile-flow-page"><FlowHeader back={() => navigateStores("url")} title="Analyzing store…" copy={`${storeUrlRef.current.replace(/^https?:\/\//, "")} · Visible storefront analysis`} /><div className="flow-live-status" aria-live="polite"><RefreshCw className="animate-spin" /><span>Analysis is running. Results will open automatically.</span></div><div className="flow-progress">{[["Loading storefront", true], ["Inspecting visible structure", true], ["Checking responsive layout", false], ["Generating recommendations", false]].map(([label, done], index) => <div className={done ? "complete" : index === 2 ? "active" : ""} key={String(label)}><i>{done ? "✓" : index === 2 ? "●" : "○"}</i><span>{label}</span><small>{done ? "Done" : index === 2 ? "Running" : "Next"}</small></div>)}</div><section className="flow-notice"><b>URL analysis mode</b><p>You can save evidence and recommendations. Editing and publishing become available after a supported connection.</p></section><button className="flow-secondary" onClick={() => navigateStores("url")}><ArrowRight /> Cancel and edit URL</button></section>;
    if (storeFlow === "settings") return <section className="mobile-flow-page"><FlowHeader back={() => navigateStores("detail")} title="Store Connection" copy={`${selectedStore.platform} · ${selectedStore.connection} · ${selectedStore.lastActivity}`} /><section className="flow-card"><span className="flow-section-label">Current capabilities</span><div className="flow-access-row"><span>Store information, products & pages</span><em>{selectedConnectionReady ? "Available" : "Not available"}</em></div><div className="flow-access-row"><span>Themes & resources</span><em>{selectedConnectionReady ? "Available" : "Not available"}</em></div><div className="flow-access-row"><span>Publishing</span><em>{selectedConnectionReady ? "Available after approval" : selectedProviderReadiness?.message ?? "Requires configured provider"}</em></div></section><section className="flow-menu-list"><button onClick={() => navigateStores("connect")}><span>Reconnect Store</span><ChevronRight /></button><button onClick={() => navigateStores("connect")}><span>Refresh Permissions</span><ChevronRight /></button><button onClick={() => navigateStores("detail")}><span>View Connection Details</span><ChevronRight /></button></section><button className="flow-danger" onClick={() => navigateStores("disconnect")}>Disconnect Store</button></section>;
    if (storeFlow === "disconnect") return <section className="mobile-flow-page"><FlowHeader back={() => navigateStores("settings")} title="Disconnect this store?" copy={`Disconnecting ${selectedStore.name} revokes its provider connection. Previous analyses, snapshots, reports, and drafts remain available.`} /><div className="flow-warning-icon">!</div><section className="flow-card"><div className="flow-access-row"><span>Store connection</span><em>Removed</em></div><div className="flow-access-row"><span>Saved work</span><b>Kept</b></div><div className="flow-access-row"><span>Publishing controls</span><em>Unavailable</em></div></section><button className="flow-danger" disabled={connectionFeedback === "loading" || disconnectStoreMutation.isPending} onClick={() => void disconnectStore()}>{connectionFeedback === "loading" || disconnectStoreMutation.isPending ? "Disconnecting…" : "Disconnect"}</button><button className="flow-secondary" onClick={() => navigateStores("settings")}>Cancel</button></section>;
    if (storeFlow === "detail") return <section className="mobile-flow-page"><FlowHeader back={() => navigateStores("list")} title={selectedStore.name} copy={`${selectedStore.platform} · ${selectedStore.connection} · ${selectedStore.lastActivity}`} action={<button className="flow-top-action" onClick={() => navigateStores("settings")}><Settings /></button>} /><div className="flow-action-row"><button onClick={() => { setToolFlow("setup"); changeView("Tools Library"); }}><ScanLine />Analyze</button><button onClick={() => { setToolFlow("library"); changeView("Tools Library"); }}><Wand2 />Tools</button><button onClick={() => changeView("Preview & validate")}><Eye />Preview</button><button onClick={() => { setToolFlow("publish"); changeView("Tools Library"); }}><Check />Publish</button></div><section className="flow-health"><div><span>Store health</span><b>{selectedStore.health || "—"}<small>{selectedStore.health ? "/100" : "not measured"}</small></b></div><div className="flow-score-grid">{[["Design","Not measured"],["UX","Not measured"],["Mobile","Not measured"],["Performance","Not measured"],["SEO","Not measured"],["Conversion","Not measured"]].map(([label, score]) => <span key={String(label)}>{label}<b>{score}</b></span>)}</div></section><section className="flow-card"><span className="flow-section-label">Available capabilities</span>{["Analyze storefront", "Inspect pages", "Generate redesign", "Edit supported elements", "Preview changes"].map(item => <div className="flow-access-row" key={item}><span>✓ {item}</span><b>Available</b></div>)}<div className="flow-access-row"><span>{selectedConnectionReady ? "✓ Publish changes" : "⚠ Publish changes"}</span><em>{selectedConnectionReady ? "Available after validation and approval" : selectedProviderReadiness?.message ?? "Requires a configured provider"}</em></div></section><section className="flow-card"><span className="flow-section-label">Connection state</span><b>{selectedConnection?.status ? `${selectedConnection.provider} · ${selectedConnection.status}` : "No connection record"}</b><p>{selectedProviderReadiness?.message ?? "Provider readiness is unavailable."}</p></section><section className="flow-card"><span className="flow-section-label">Recent work</span><b>{selectedStore.drafts ? `${selectedStore.drafts} active drafts` : "No saved drafts"}</b><p>{selectedStore.openIssues ? `${selectedStore.openIssues} open issue records need review.` : "No issue evidence is recorded for this store yet."}</p></section></section>;
    return <section className="concise-board concise-stores-board"><header className="concise-board-header"><div><span className="approved-eyebrow">Connected storefronts</span><h1>Your Stores</h1><p>One place to see health, decide what needs attention, and begin the next piece of work.</p></div><button className="approved-primary" onClick={() => navigateStores("add")}><Plus /> Add Store</button></header><section className="concise-summary-strip"><span><b>{visibleStores.filter(store => store.connection === "Connected").length}</b> connected stores</span><span><b>{primaryStore.health || "—"}</b> average health</span><span><b>{visibleStores.filter(store => store.connection === "Needs attention").length}</b> need attention</span></section><section className="concise-primary-grid"><article className="approved-panel concise-store-focus"><div className="concise-panel-heading"><span className="approved-eyebrow">Active store</span><button onClick={() => navigateStores("settings")}><Settings /> Connection</button></div><div className="concise-store-title"><span>{primaryStore.initials}</span><div><b>{primaryStore.name}</b><small>{primaryStore.platform} · <em>{primaryStore.connection}</em></small></div><strong>{primaryStore.health || "—"}<small>{primaryStore.health ? "/100" : "not measured"}</small></strong></div><div className="concise-store-signal"><span>Design <b>Not measured</b></span><span>UX <b>Not measured</b></span><span>Mobile <b>Not measured</b></span></div><div className="concise-action-pair"><button className="approved-secondary" onClick={() => { setToolFlow("setup"); changeView("Tools Library"); }}><ScanLine /> Analyze</button><button className="approved-primary" onClick={() => navigateStores("detail")}>Open workspace <ChevronRight /></button></div></article><article className="approved-panel concise-next-card"><span className="approved-eyebrow">Next decision</span><h2>{(workspaceDashboardQuery.data?.issues.open ?? 0) ? "Review recorded workspace issues." : "Run a supported analysis to create evidence."}</h2><p>{(workspaceDashboardQuery.data?.issues.open ?? 0) ? `${workspaceDashboardQuery.data?.issues.open} open issue records are available for review.` : "No issue evidence is recorded for this workspace yet."}</p><button className="approved-primary" onClick={() => { changeView("Issues"); }}><Sparkles /> Review issues</button></article></section><section className="approved-panel concise-store-list"><div className="concise-panel-heading"><div><span className="approved-eyebrow">Other stores</span><h2>At a glance</h2></div></div>{visibleStores.slice(1).map(store => <button onClick={() => { setActiveStoreId(store.id); navigateStores("detail"); }} key={store.id}><span>{store.initials}</span><div><b>{store.name}</b><small>{store.platform} · {store.lastActivity}</small></div><em className={store.connection === "Connected" ? "connected" : "attention"}>{store.connection === "Connected" ? (store.health ? `Health ${store.health}` : "Health not measured") : store.connection}</em><ChevronRight /></button>)}</section></section>;
  }

  function TeamManagement({ back }: { back: () => void }) {
    const [inviteEmail, setInviteEmail] = useState("");
    const [inviteRole, setInviteRole] = useState<TeamRole>("Editor");
    const [inviteError, setInviteError] = useState("");
    const activeMembers = liveTeamMembers.filter(member => member.status === "Active");
    const pendingMembers = liveTeamMembers.filter(member => member.status === "Pending");
    const submitInvite = async () => {
      const email = inviteEmail.trim().toLowerCase();
      if (!/^\S+@\S+\.\S+$/.test(email)) { setInviteError("Enter a valid email address to send an invitation."); return; }
      if (liveTeamMembers.some(member => member.email.toLowerCase() === email)) { setInviteError("This email already has workspace access or a pending invitation."); return; }
      try {
        if (activeWorkspaceId) {
          await inviteWorkspaceMemberMutation.mutateAsync({ workspaceId: activeWorkspaceId, email, role: inviteRole.toLowerCase() as "admin" | "editor" | "viewer" | "billing" });
          await authUtils.workspace.invitations.invalidate();
        } else throw new Error("Workspace is not ready.");
        setInviteEmail(""); setInviteError(""); setTeamInviteOpen(false);
        setMoreNotice(`Invitation sent to ${email} as ${inviteRole}.`);
      } catch { setInviteError("We couldn’t send that invitation. Please try again."); }
    };
    const changeRole = async (id: string, role: TeamRole) => {
      const member = liveTeamMembers.find(item => item.id === id);
      if (!member || role === "Owner") return;
      try {
        if (activeWorkspaceId && member.sourceId) {
          const inputRole = role.toLowerCase() as "admin" | "editor" | "viewer" | "billing";
          if (member.source === "member") { await updateWorkspaceMemberRoleMutation.mutateAsync({ workspaceId: activeWorkspaceId, memberId: member.sourceId, role: inputRole }); await authUtils.workspace.members.invalidate(); }
          else { await updateWorkspaceInvitationRoleMutation.mutateAsync({ workspaceId: activeWorkspaceId, invitationId: member.sourceId, role: inputRole }); await authUtils.workspace.invitations.invalidate(); }
        } else throw new Error("Workspace member is not available.");
        setMoreNotice(`${member.name} is now ${role === "Editor" ? "an" : "a"} ${role}.`);
      } catch { setMoreNotice("We couldn’t update that role. Please try again."); }
    };
    const removeMember = async () => {
      const member = liveTeamMembers.find(item => item.id === removalMemberId);
      if (!member) return;
      try {
        if (activeWorkspaceId && member.sourceId) {
          if (member.source === "invitation") { await cancelWorkspaceInvitationMutation.mutateAsync({ workspaceId: activeWorkspaceId, invitationId: member.sourceId }); await authUtils.workspace.invitations.invalidate(); }
          else { await removeWorkspaceMemberMutation.mutateAsync({ workspaceId: activeWorkspaceId, memberId: member.sourceId }); await authUtils.workspace.members.invalidate(); }
        } else throw new Error("Workspace member is not available.");
        setRemovalMemberId(null);
        setMoreNotice(member.status === "Pending" ? `Invitation to ${member.email} was canceled.` : `${member.name} no longer has workspace access.`);
      } catch { setMoreNotice("We couldn’t remove that access. Please try again."); }
    };
    const selectedForRemoval = liveTeamMembers.find(member => member.id === removalMemberId);
    return <section className="more-detail-page team-management-page"><PageHeading label="Workspace settings / More" title="Team" copy="Manage who can access this workspace and what they can do." action={<button className="app-button" onClick={() => { setInviteError(""); setTeamInviteOpen(true); }}><Plus /> Invite member</button>} /><section className="more-detail-summary"><span className="more-detail-icon"><Layers3 /></span><div><span className="approved-eyebrow">Workspace access</span><h2>Keep shared access simple and visible.</h2><p>Invite people, assign the right role, and cancel access safely when work changes.</p></div><button className="more-detail-back" onClick={back}><ArrowRight /> Back to More</button></section><section className="team-stat-grid"><article><b>{activeMembers.length}</b><span>Active members</span></article><article><b>{pendingMembers.length}</b><span>Pending invitations</span></article><article><b>Owner</b><span>Required role</span></article></section><section className="team-management-grid"><article className="approved-panel team-member-panel"><div className="more-detail-list-head"><div><span className="approved-eyebrow">Workspace members</span><h2>Access and roles</h2></div><button className="approved-secondary" onClick={() => { setInviteError(""); setTeamInviteOpen(true); }}><Plus /> Invite</button></div><div className="team-member-list">{activeMembers.map(member => <article key={member.id}><span className="team-avatar">{member.name.split(" ").map(part => part[0]).join("")}</span><div><b>{member.name}{member.role === "Owner" && <em>Owner</em>}</b><small>{member.email} · Active</small></div><label><span className="sr-only">Role for {member.name}</span><select value={member.role} disabled={member.role === "Owner"} onChange={event => changeRole(member.id, event.target.value as TeamRole)}><option>Owner</option><option>Editor</option><option>Viewer</option></select></label>{member.role !== "Owner" && <button className="team-remove" onClick={() => setRemovalMemberId(member.id)}>Remove</button>}</article>)}</div></article><aside className="approved-panel team-guide-panel"><span className="approved-eyebrow">Role guide</span><h2>Give only the access each person needs.</h2><div><b>Owner</b><p>Manages workspace access, billing, and all workspace settings.</p></div><div><b>Editor</b><p>Can use tools, create drafts, and prepare supported releases.</p></div><div><b>Viewer</b><p>Can review evidence, reports, and shared draft progress.</p></div></aside></section><section className="approved-panel pending-invite-panel"><div className="more-detail-list-head"><div><span className="approved-eyebrow">Pending invitations</span><h2>Waiting for a response</h2></div><span>{pendingMembers.length} pending</span></div>{pendingMembers.length ? <div className="team-member-list pending">{pendingMembers.map(member => <article key={member.id}><span className="team-avatar muted">{member.name.split(" ").map(part => part[0]).join("")}</span><div><b>{member.email}</b><small>Invited as {member.role} · Invitation not accepted yet</small></div><label><span className="sr-only">Role for invitation to {member.email}</span><select value={member.role} onChange={event => changeRole(member.id, event.target.value as TeamRole)}><option>Editor</option><option>Viewer</option></select></label><button className="team-remove" onClick={() => setRemovalMemberId(member.id)}>Cancel invite</button></article>)}</div> : <p className="team-empty-state">No invitations are pending. Invite a teammate when you are ready to share this workspace.</p>}</section>{moreNotice && <section className="more-detail-notice"><Check /><div><b>Team workspace updated</b><p>{moreNotice}</p></div><button onClick={() => setMoreNotice("")}>Dismiss</button></section>}{teamInviteOpen && <div className="team-dialog-layer" role="dialog" aria-modal="true" aria-labelledby="invite-member-title"><section className="team-dialog"><span className="team-dialog-icon"><Plus /></span><h2 id="invite-member-title">Invite a workspace member</h2><p>The invitation is recorded in the workspace; email delivery depends on the configured mail provider.</p><label>Email address<input value={inviteEmail} onChange={event => { setInviteEmail(event.target.value); setInviteError(""); }} placeholder="teammate@company.com" autoFocus /></label><label>Role<select value={inviteRole} onChange={event => setInviteRole(event.target.value as TeamRole)}><option>Editor</option><option>Viewer</option></select></label>{inviteError && <p className="team-dialog-error" role="alert">{inviteError}</p>}<div className="team-dialog-actions"><button className="approved-secondary" onClick={() => setTeamInviteOpen(false)}>Cancel</button><button className="approved-primary" onClick={submitInvite}><Plus /> Send invitation</button></div></section></div>}{selectedForRemoval && <div className="team-dialog-layer" role="dialog" aria-modal="true" aria-labelledby="remove-member-title"><section className="team-dialog"><span className="team-dialog-icon warning">!</span><h2 id="remove-member-title">{selectedForRemoval.status === "Pending" ? "Cancel this invitation?" : `Remove ${selectedForRemoval.name}?`}</h2><p>{selectedForRemoval.status === "Pending" ? "The recipient will no longer be able to accept this invitation." : "They will immediately lose access to shared workspace tools, drafts, and reports."}</p><div className="team-dialog-actions"><button className="approved-secondary" onClick={() => setRemovalMemberId(null)}>Keep access</button><button className="team-confirm-remove" onClick={removeMember}>{selectedForRemoval.status === "Pending" ? "Cancel invitation" : "Remove member"}</button></div></section></div>}</section>;
  }

  function MoreFlow() {
    const back = () => { setMoreFlow("home"); setMoreNotice(""); window.scrollTo({ top: 0, behavior: "smooth" }); };
    const open = (next: typeof moreFlow) => { setMoreFlow(next); setMoreNotice(""); setMoreAction(null); window.scrollTo({ top: 0, behavior: "smooth" }); };
    const billing = workspaceUsageSummaryQuery.data;
    const activeMemberCount = liveTeamMembers.filter(member => member.status === "Active").length;
    const connectedStoreCount = (workspaceStoresQuery.data ?? []).filter(store => store.status === "connected").length;
    const toolRunLimit = billing?.plan.monthlyToolRuns ?? null;
    const toolRunUsage = billing?.usage.toolRuns ?? 0;
    const usagePercent = toolRunLimit === null ? null : Math.min(100, Math.round((toolRunUsage / toolRunLimit) * 100));
    const billingStatus = toolRunLimit === null ? "Usage limit not set" : `${Math.max(toolRunLimit - toolRunUsage, 0)} monthly tool runs remaining`;
    const detail = {
      team: { title: "Team", copy: "Manage the people who have access to your workspace.", rows: ["Invite member", "Manage roles", "Pending invitations"] },
      billing: { title: "Billing & Usage", copy: "Free plan · Track workspace usage and manage subscription.", rows: ["Subscription", "Usage limits", "AI credits", "Billing history"] },
      profile: { title: "Profile", copy: "Manage your personal details, email, and account security.", rows: ["Personal details", "Email address", "Password & security", "Connected sessions"] },
      preferences: { title: "Preferences", copy: "Choose how your workspace, alerts, and updates work for you.", rows: ["Workspace defaults", "Notifications", "Product updates", "Accessibility"] },
      platform: { title: "Platform", copy: "Configure integrations, developer access, and platform connections.", rows: ["Integrations", "Developer & API", "API keys", "Request a platform"] },
      resources: { title: "Resources", copy: "Find product guidance and stay current with FerixRG updates.", rows: ["Documentation", "Help Center", "What’s New", "About", "Terms", "Privacy"] },
      support: { title: "Support", copy: "Get help, report a problem, or share feedback with the product team.", rows: ["Contact support", "Report a problem", "Send feedback", "Feature requests", "Sign out"] },
    };
    if (moreAction) return <MoreActionPanel section={moreAction.section} action={moreAction.action} profile={accountProfileQuery.data ? { name: accountProfileQuery.data.name, email: accountProfileQuery.data.email } : undefined} preferences={accountPreferencesQuery.data} sessions={accountSessionsQuery.data} billing={workspaceUsageSummaryQuery.data} storeProviderReadiness={storeProviderReadinessQuery.data} aiProviderReadiness={aiProviderReadinessQuery.data} onSaveProfile={async input => { await updateProfileMutation.mutateAsync(input); await authUtils.account.profile.invalidate(); }} onSavePreferences={async input => { await updatePreferencesMutation.mutateAsync(input); await authUtils.account.preferences.invalidate(); }} onRequestEmailChange={async input => requestEmailChangeMutation.mutateAsync(input)} onRequestPasswordReset={async () => requestPasswordResetMutation.mutateAsync()} onRevokeSession={async sessionId => { await revokeSessionMutation.mutateAsync({ sessionId }); await authUtils.account.sessions.invalidate(); }} onRevokeOtherSessions={async () => { const result = await revokeOtherSessionsMutation.mutateAsync(); await authUtils.account.sessions.invalidate(); return result; }} onSubmitWorkspaceRequest={async input => { if (!activeWorkspaceId) throw new Error("Workspace is not ready."); await submitWorkspaceRequestMutation.mutateAsync({ workspaceId: activeWorkspaceId, ...input, context: { selectedView: view, selectedStoreId: activeStoreId ?? null, selectedToolId: toolIntent } }); await authUtils.workspace.requests.invalidate(); await authUtils.workspace.activity.invalidate(); }} onReadLegalDocuments={async documentKey => { const result = await (documentKey === "terms" ? legalTermsQuery.refetch() : legalPrivacyQuery.refetch()); return { count: result.data?.length ?? 0 }; }} onAcknowledgeResource={async resourceKey => { await acknowledgeResourceMutation.mutateAsync({ resourceKey }); }} onBack={() => { setMoreAction(null); window.scrollTo({ top: 0, behavior: "smooth" }); }} />;
    if (moreFlow === "team") return <TeamManagement back={back} />;
    const alignedDetail = moreFlow !== "home";
    const detailIcon = moreFlow === "billing" ? <BarChart3 /> : moreFlow === "profile" ? <Settings /> : moreFlow === "preferences" ? <Bell /> : moreFlow === "platform" ? <Layers3 /> : moreFlow === "resources" ? <FileBarChart /> : <CircleHelp />;
    const detailAction = moreFlow === "billing" ? "Manage plan" : moreFlow === "profile" ? "Edit profile" : moreFlow === "preferences" ? "Save preferences" : moreFlow === "platform" ? "Review integrations" : moreFlow === "resources" ? "Open documentation" : "Contact support";
    const detailCaption = moreFlow === "billing" ? "Plan details and usage stay clear without mixing them into storefront work." : moreFlow === "profile" ? "Personal details and account security stay separate from the shared workspace." : moreFlow === "preferences" ? "Choose your defaults and notifications without changing the work your team sees." : moreFlow === "platform" ? "Connection health, developer access, and delivery capabilities are managed here." : moreFlow === "resources" ? "Guidance and release notes stay separate from day-to-day storefront work." : "Support requests retain their workspace context without disrupting your current draft.";
    if (alignedDetail) {
      const current = detail[moreFlow];
      const context = moreFlow === "billing" ? { eyebrow: "Plan and usage", heading: "Keep plan decisions separate from storefront work.", rowCopy: "Review plan details and current workspace usage.", sideTitle: `${billing?.plan.label ?? "Workspace"} plan is active`, sideCopy: toolRunLimit === null ? "Usage is recorded in the workspace ledger. A monthly tool-run limit has not been set for this plan." : `${toolRunUsage} of ${toolRunLimit} tool runs are recorded this period. AI usage appears only when a provider executor records it.`, status: billingStatus } : moreFlow === "profile" ? { eyebrow: "Personal account", heading: "Keep your identity and security in one clear place.", rowCopy: "Update only your personal account and security details.", sideTitle: accountDisplayName, sideCopy: `${accountProfileQuery.data?.email ?? authQuery.data?.email ?? "No email on file"}. Profile changes never alter shared store settings.`, status: "Account profile loaded" } : moreFlow === "preferences" ? { eyebrow: "Personal defaults", heading: "Choose how FerixRG works for you.", rowCopy: "Set your own workspace and notification defaults.", sideTitle: "Preferences are personal", sideCopy: "Your notification and accessibility choices apply to your account, not to other workspace members.", status: "Notifications and defaults are enabled" } : moreFlow === "platform" ? { eyebrow: "Workspace connections", heading: "Keep every integration understandable.", rowCopy: "Configure access and supported capability.", sideTitle: `${connectedStoreCount} connected store${connectedStoreCount === 1 ? "" : "s"}`, sideCopy: connectedStoreCount ? "A connected store record is visible here. Publishing only becomes available in a supported release review." : "No connected store record is available yet. Add a public URL or prepare a supported connection to begin.", status: `${connectedStoreCount} supported connection${connectedStoreCount === 1 ? "" : "s"}` } : moreFlow === "resources" ? { eyebrow: "Product guidance", heading: "Find the next answer without leaving your work.", rowCopy: "Open guidance in a focused workspace panel.", sideTitle: "Guidance stays linked to tools", sideCopy: "Use the selected tool, evidence, and current draft to open only the guidance you need.", status: `${toolCatalog.length} tools documented` } : { eyebrow: "Help and feedback", heading: "Get the right help with your current context.", rowCopy: "Start with your workspace context attached.", sideTitle: "No active support requests", sideCopy: "When you contact support, your selected store or tool can be included in the request.", status: "Response guidance available" };
      return <section className="more-detail-page"><PageHeading label="Workspace settings / More" title={current.title} copy={current.copy} action={<button className="app-button" onClick={() => setMoreAction({ section: moreFlow, action: current.rows[0] })}>{detailIcon} {detailAction}</button>} /><section className="more-detail-summary"><span className="more-detail-icon">{detailIcon}</span><div><span className="approved-eyebrow">{context.eyebrow}</span><h2>{context.heading}</h2><p>{detailCaption}</p></div><button className="more-detail-back" onClick={back}><ArrowRight /> Back to More</button></section><section className="more-detail-grid"><article className="approved-panel more-detail-list"><div className="more-detail-list-head"><div><span className="approved-eyebrow">Available actions</span><h2>{current.title} essentials</h2></div><span>{current.rows.length} options</span></div>{current.rows.map((item, index) => <button onClick={() => item === "Sign out" ? requestLogout() : setMoreAction({ section: moreFlow, action: item })} key={item}><span className="more-detail-row-index">{String(index + 1).padStart(2, "0")}</span><span><b>{item}</b><small>{context.rowCopy}</small></span><ChevronRight /></button>)}</article><aside className="approved-panel more-detail-side"><span className="approved-eyebrow">Current workspace</span><h2>{context.sideTitle}</h2><p>{context.sideCopy}</p><div className="more-detail-side-status"><i /> <span>{context.status}</span></div><button className="approved-secondary" onClick={() => setMoreAction({ section: moreFlow, action: current.rows[0] })}><Save /> Open {current.rows[0]}</button></aside></section>{moreNotice && <section className="more-detail-notice"><Check /><div><b>Workspace preview</b><p>{moreNotice}</p></div><button onClick={() => setMoreNotice("")}>Dismiss</button></section>}</section>;
    }
    return <section className="concise-board concise-more-board"><header className="concise-board-header"><div><span className="approved-eyebrow">Workspace settings</span><h1>More</h1><p>Manage the essentials without turning settings into another dashboard.</p></div><button className="concise-signout" onClick={requestLogout}>Sign Out</button></header><section className="concise-summary-strip"><span><b>{activeMemberCount}</b> active team members</span><span><b>{usagePercent === null ? "—" : `${usagePercent}%`}</b> {usagePercent === null ? "usage not limited" : "monthly usage"}</span><span><b>{connectedStoreCount}</b> connected store{connectedStoreCount === 1 ? "" : "s"}</span></section><section className="concise-primary-grid"><article className="approved-panel concise-settings-card"><span className="approved-eyebrow">Workspace</span><h2>Team & billing</h2><p>People, plan, and usage in one place.</p><div className="concise-action-pair"><button className="approved-secondary" onClick={() => open("team")}>Team <ChevronRight /></button><button className="approved-primary" onClick={() => open("billing")}>Usage <ChevronRight /></button></div></article><article className="approved-panel concise-settings-card"><span className="approved-eyebrow">Account</span><h2>Profile & preferences</h2><p>Personal settings, alerts, and security.</p><div className="concise-action-pair"><button className="approved-primary" onClick={() => open("profile")}>Profile <ChevronRight /></button><button className="approved-secondary" onClick={() => open("preferences")}>Preferences</button></div></article></section><section className="approved-panel concise-utility-row"><button onClick={() => open("platform")}><span><Layers3 /></span><div><b>Platform</b><small>Integrations and developer access</small></div><ChevronRight /></button><button onClick={() => open("resources")}><span><FileBarChart /></span><div><b>Resources</b><small>Documentation and product updates</small></div><ChevronRight /></button><button onClick={() => open("support")}><span><CircleHelp /></span><div><b>Support</b><small>Help, feedback, and feature requests</small></div><ChevronRight /></button></section></section>;
  }

  function StorePanel() {
    const liveStore = workspaceStoresQuery.data?.find(item => String(item.id) === activeStoreId) ?? workspaceStoresQuery.data?.[0];
    const liveIssues = workspaceDashboardQuery.data?.issues.records ?? [];
    const liveDrafts = workspaceDraftsQuery.data ?? [];
    const storeTools = toolCatalog.filter(tool => tool.sources.includes("Connected store") || tool.requiresConnection).slice(0, 6);
    const [selectedPanelToolId, setSelectedPanelToolId] = useState(storeTools[0]?.id ?? "storefront-analyzer");
    const selectedPanelTool = storeTools.find(tool => tool.id === selectedPanelToolId) ?? storeTools[0];
    const [selectedSource, setSelectedSource] = useState("Connected store");
    useEffect(() => { if (selectedPanelTool && !selectedPanelTool.sources.includes(selectedSource as never)) setSelectedSource(selectedPanelTool.sources[0] ?? "Connected store"); }, [selectedPanelTool, selectedSource]);
    if (!liveStore || !selectedPanelTool) return <section className="store-panel"><button className="back-to-stores" onClick={() => changeView("Stores")}><ArrowRight /> All stores</button><section className="workspace-empty-state"><h1>No live store selected</h1><p>Open a persisted store record before using store-specific tools.</p><button className="app-button" onClick={() => changeView("Stores")}><Store /> Open Stores</button></section></section>;
    const store = {
      id: String(liveStore.id),
      name: liveStore.name,
      platform: liveStore.platform === "public_url" ? "Public URL" : `${liveStore.platform[0].toUpperCase()}${liveStore.platform.slice(1)}`,
      connection: liveStore.status === "connected" ? "Connected" : liveStore.status === "attention" ? "Needs attention" : liveStore.status === "disconnected" ? "Disconnected" : "Source saved",
      health: liveStore.healthScore ?? 0,
      initials: liveStore.name.slice(0, 2).toUpperCase(),
      url: liveStore.url,
      lastActivity: liveStore.updatedAt ? new Date(liveStore.updatedAt).toLocaleDateString() : "Not analyzed",
      openIssues: liveIssues.filter(issue => issue.storeId === liveStore.id && (issue.status === "open" || issue.status === "in_progress")).length,
      drafts: liveDrafts.filter(draft => draft.storeId === liveStore.id && (draft.status === "draft" || draft.status === "review")).length,
    };
    const pickerIcon = (kind: ToolDefinition["kind"]) => kind === "analysis" ? <Eye /> : kind === "generator" ? <Sparkles /> : kind === "release" ? <Check /> : <Layers3 />;
    const selectedSourceAvailability = getSourceAvailability(selectedSource as ToolSource, selectedPanelTool.id);
    const launchStoreTool = () => { if (selectedSourceAvailability.available) openTool(selectedPanelTool.id, selectedSource); };
    return <section className="store-panel"><button className="back-to-stores" onClick={() => changeView("Stores")}><ArrowRight /> All stores</button><header className="store-panel-header"><div className="store-panel-mark">{store.initials}</div><div><span className="command-kicker">{store.platform} store workspace</span><h1>{store.name}</h1><p>{store.url} · {store.connection} · {store.lastActivity}</p></div><div className="store-panel-health"><span>Store health</span><b>{store.health || "—"}</b></div></header><section className="store-panel-intro"><div><span>Your working area</span><h2>Choose a tool for {store.name}.</h2><p>Inspect this persisted source with a supported tool. Store changes remain unavailable until the provider and permission checks pass.</p></div><button onClick={() => changeView("Stores")}><Bot /> Manage connection</button></section><section className="store-tool-workbench"><div className="store-tool-picker"><div><span className="card-eyebrow" style={{color:'#8fb2ff'}}>Store tools</span><h3>What do you want to work on?</h3><p>Select a real catalog tool and the source it should use.</p></div><div className="store-tool-options">{storeTools.map(tool => <button className={selectedPanelTool.id === tool.id ? "active" : ""} onClick={() => setSelectedPanelToolId(tool.id)} key={tool.id}><span>{pickerIcon(tool.kind)}</span><b>{tool.name}</b></button>)}</div></div><aside className="store-tool-guide"><div className="store-tool-guide-head"><span className="store-tool-guide-icon">{pickerIcon(selectedPanelTool.kind)}</span><div><small>Selected tool for {store.name}</small><h3>{selectedPanelTool.name}</h3></div></div><p>{selectedPanelTool.description}</p><div className="store-source-picker"><span>Choose what this tool should use</span><div>{selectedPanelTool.sources.map(source => <button className={selectedSource === source ? "selected" : ""} onClick={() => setSelectedSource(source)} key={source}>{source}{source === "Connected store" ? <Bot /> : source === "Saved draft" ? <Layers3 /> : source === "Screenshots" ? <PanelRightOpen /> : <ScanLine />}</button>)}</div></div><div className={`store-tool-requirement ${selectedSourceAvailability.available ? "ready" : "connection"}`}><i /> <span><b>{selectedSourceAvailability.available ? "Supported source available" : selectedSourceAvailability.label}</b><small>{selectedSourceAvailability.message}</small></span></div><button className="store-tool-launch" disabled={!selectedSourceAvailability.available} onClick={launchStoreTool}>{pickerIcon(selectedPanelTool.kind)} Open {selectedPanelTool.name} for {store.name} <ChevronRight /></button></aside></section><section className="store-panel-bottom"><article><div className="simple-card-heading"><div><span>Current work</span><h2>What needs attention</h2></div><button onClick={() => changeView("Issues")}>Open issues <ChevronRight /></button></div><div className="store-work-summary"><span><b>{store.openIssues}</b><small>Issues to review</small></span><span><b>{store.drafts}</b><small>Drafts available</small></span><span><b>{store.connection === "Connected" ? "Ready" : "Check"}</b><small>Connection state</small></span></div></article><article><div className="simple-card-heading"><div><span>Store activity</span><h2>Recent work on this store</h2></div></div><div className="store-specific-activity"><p>Activity appears here after a persisted tool run, draft, issue, or report is recorded for this store.</p></div></article></section></section>;
  }

  function Analysis() {
    const dashboard = workspaceDashboardQuery.data;
    const runs = dashboard?.runs.records ?? [];
    const activeRun = runs.find(run => run.status === "running" || run.status === "queued") ?? runs[0];
    return <><PageHeading label="Analyze / workspace records" title="Evidence stays tied to every run." copy="Review actual queued, running, completed, or failed tool records. Evidence and findings appear only when a tool executor saves them." action={<button className="app-button" onClick={() => changeView("Tools Library")}><Play /> Start an approved tool</button>} />
      <div className="analysis-layout"><aside className="scan-panel instrument-card"><span className="card-eyebrow" style={{color:'#155eef'}}>Current run state</span><h3>{activeRun ? activeRun.toolId : "No tool run selected"}</h3><p>{activeRun ? `${activeRun.sourceType.replace("_", " ")} · ${activeRun.status}` : "Use the Tool Library to create a real workspace run from a supported source."}</p>{[["Queued", activeRun?.status === "queued"], ["Running", activeRun?.status === "running"], ["Completed", activeRun?.status === "completed"], ["Failed", activeRun?.status === "failed"]].map(([label, state]) => <div className={`scan-stage ${state ? "active" : ""}`} key={String(label)}><i className="scan-dot" /> {label}</div>)}<div className="scan-footer"><span>{dashboard?.runs.total ?? 0} recent run records</span><span>{dashboard?.issues.open ?? 0} open issues</span></div></aside><div className="analysis-main"><section className="analyzer-feature"><div className="analysis-summary"><div><span className="card-eyebrow">Workspace evidence</span><h2>{activeRun ? `Review ${activeRun.toolId} in context.` : "Start with one scoped source."}</h2><p>{activeRun ? "The run record is preserved with its selected source. Any executor-created evidence, issues, reports, or developer handoffs remain attached to this workspace." : "Public URLs, saved drafts, uploads, and supported store context are all recorded before a tool begins."}</p></div><div className="tiny-stats"><span><b>{dashboard?.runs.completed ?? 0}</b><span>completed runs</span></span><span><b>{dashboard?.issues.total ?? 0}</b><span>issue records</span></span></div></div></section><section className="analyzer-grid">{runs.length ? runs.map(run => <button className="analyzer-card" onClick={() => changeView(run.status === "completed" ? "Reports" : "Tools Library")} key={run.id}><span className="analyzer-top"><span>{run.toolId}</span><ChevronRight size={13}/></span><b className="analyzer-score">{run.status}</b><p>{run.sourceType.replace("_", " ")} source · run #{run.id}</p></button>) : <section className="team-empty-state">No analysis run exists yet. The Tool Library creates live source and execution records first.</section>}</section></div></div>
    </>;
  }

  function Issues() {
    const liveIssues = (workspaceDashboardQuery.data?.issues.records ?? []).map(issue => ({
      id: String(issue.id), severity: `${issue.severity.charAt(0).toUpperCase()}${issue.severity.slice(1)}`, title: issue.title,
      detail: issue.location ? `Recorded location: ${issue.location}. This evidence-backed workspace issue is ready for review.` : "This evidence-backed workspace issue is ready for review.",
      tag: issue.location ?? "Workspace", impact: issue.status.replace("_", " "), measures: [["Severity", issue.severity], ["Status", issue.status.replace("_", " ")], ["Location", issue.location ?? "Not recorded"], ["Source", issue.toolRunId ? `Tool run ${issue.toolRunId}` : "Manual workspace record"]],
    }));
    const filtered = filter === "All" ? liveIssues : liveIssues.filter(issue => issue.severity === filter);
    const displayedIssue = filtered.find(issue => issue.id === selectedIssue?.id) ?? filtered[0];
    return <>
      <PageHeading label={`Issue center / ${workspaceDashboardQuery.data?.issues.open ?? 0} open`} title="Every finding has a path forward." copy="Filter the evidence by severity, then open the issue to choose a safe fix, a redesign route, or a developer handoff." action={<button className="app-button" onClick={() => changeView("Tools Library")}><Wand2 /> Open a tool</button>} />
      <div className="issues-layout"><section className="issue-board instrument-card"><div className="issue-filterbar"><div className="filter-chips">{["All","High","Medium","Low"].map(f=><button className={filter===f?"filter-chip active":"filter-chip"} onClick={() => setFilter(f)} key={f}>{f}{f==="All"?" issues":""}</button>)}</div><button className="text-link" onClick={() => setFilter("All")}>Clear filters</button></div>{filtered.length ? filtered.map(issue => <button className="issue-row" onClick={() => setSelectedIssue(issue)} key={issue.id}><span className={`severity ${issue.severity.toLowerCase()}`}>{issue.severity}</span><span><b>{issue.title}</b><p>{issue.detail.slice(0, 78)}…</p></span><span className="tag">{issue.tag}</span><span className="impact">{issue.impact}</span><ChevronRight /></button>) : <p className="team-empty-state">No matching live issue records. Complete a tool run or add an issue from evidence to populate this center.</p>}</section><aside className="issue-detail instrument-card">{displayedIssue ? <><span className={`severity ${displayedIssue.severity.toLowerCase()}`}>{displayedIssue.severity} priority</span><h2>{displayedIssue.title}</h2><p>{displayedIssue.detail}</p><div className="issue-evidence"><div className="issue-evidence-placeholder"><Layers3 /><b>No stored evidence image</b><span>Visual evidence appears only when the selected issue has an executor-created asset.</span></div></div><div className="measure-grid">{displayedIssue.measures.map(([label,value]) => <div className="measure" key={label}><span>{label}</span><b>{value}</b></div>)}</div><button className="app-button" onClick={() => changeView("Redesign")}><Sparkles /> Generate solution</button><button className="app-button ghost" style={{width:'100%',justifyContent:'center',marginTop:8}} onClick={() => changeView("Visual editor")}><Layers3 /> Open in editor</button></> : <p className="team-empty-state">Choose a live issue record to view its scoped evidence and next actions.</p>}</aside></div>
    </>;
  }

  function Reports() {
    const dashboard = workspaceDashboardQuery.data;
    const reports = dashboard?.reports.records ?? [];
    const runs = dashboard?.runs.records ?? [];
    const downloadReport = async (reportId: number) => {
      try {
        if (!activeWorkspaceId) throw new Error("Your workspace is still loading.");
        const artifact = await reportDownloadMutation.mutateAsync({ workspaceId: activeWorkspaceId, reportId });
        window.open(artifact.url, "_blank", "noopener,noreferrer");
      } catch (error) { toast.error(error instanceof Error ? error.message : "We couldn’t prepare that report download."); }
    };
    return <><PageHeading label={`Reports / ${reports.length} saved`} title="Make the audit easy to act on." copy="Saved report records, their source tool runs, and export availability stay together in this workspace." action={<button className="app-button" onClick={() => changeView("Tools Library")}><FileBarChart /> Start a tool run</button>} />
      <section className="concise-board"><header className="concise-board-header"><div><span className="approved-eyebrow">Workspace delivery</span><h1>Reports</h1><p>Create a report record from an approved tool run, then download it only after a generated artifact is available.</p></div><span className="concise-board-status">{reports.length} saved</span></header><section className="approved-panel concise-more-board">{reports.length ? reports.map(report => <article className="approved-analysis-row" key={report.id}><span><b>{report.title}</b><small>{report.format.toUpperCase()} · {new Date(report.createdAt).toLocaleString()}</small></span><em>{report.storageKey ? "Ready" : "Record"}</em>{report.storageKey ? <button className="approved-secondary" onClick={() => { void downloadReport(report.id); }}>Download {report.format.toUpperCase()}</button> : <strong>Awaiting export artifact</strong>}</article>) : <p className="team-empty-state">No report records yet. Complete a tool run and create a report record to keep its evidence and delivery context together.</p>}</section><section className="approved-panel concise-more-board"><div className="approved-panel-title"><div><span className="approved-eyebrow">Recent tool runs</span><h2>Source records available for reporting.</h2></div><button onClick={() => changeView("Tools Library")}>Run a tool <ChevronRight /></button></div>{runs.length ? runs.map(run => <article className="approved-analysis-row" key={run.id}><span><b>{run.toolId}</b><small>{run.sourceType} · {run.status}</small></span><em>{run.status}</em><strong>Run #{run.id}</strong></article>) : <p className="team-empty-state">No tool runs yet. The Tools Library will create real run records here.</p>}</section></section>
    </>;
  }

  function ValidationRelease() {
    const currentVersionId = workspaceDraftVersionsQuery.data?.draft?.currentVersionId ?? null;
    const validationRuns = workspaceValidationRunsQuery.data ?? [];
    const releases = workspaceReleasesQuery.data ?? [];
    const connectedStore = (workspaceStoresQuery.data ?? []).find(store => store.status === "connected");
    const connectedStoreProvider = connectedStore ? storeProviderReadinessQuery.data?.find(provider => provider.provider === connectedStore.platform.toLowerCase()) : undefined;
    const publishReady = Boolean(connectedStore && connectedStoreProvider?.configured);
    const [notice, setNotice] = useState("");
    const startValidation = async () => {
      try {
        if (!activeWorkspaceId || !currentVersionId) throw new Error("Save a draft version before validation.");
        const queued = await queueValidationRunMutation.mutateAsync({ workspaceId: activeWorkspaceId, draftVersionId: currentVersionId });
        const started = await startValidationRunMutation.mutateAsync({ workspaceId: activeWorkspaceId, validationRunId: queued.id });
        const completed = await executeDraftIntegrityValidationMutation.mutateAsync({ workspaceId: activeWorkspaceId, validationRunId: started.id });
        await authUtils.workspace.validationRuns.invalidate();
        await authUtils.workspace.activity.invalidate();
        setNotice(completed.status === "passed" ? "Saved-draft integrity validation passed. This does not certify provider publish readiness, visual quality, accessibility, or SEO." : "Saved-draft integrity validation found an incomplete persisted draft record. Review the saved version before release planning.");
      } catch (error) { setNotice(error instanceof Error ? error.message : "We couldn’t start validation."); }
    };
    const createRelease = async (actionType: "export" | "publish") => {
      try {
        if (!activeWorkspaceId || !currentVersionId) throw new Error("Save a draft version before creating a release plan.");
        const action = await createReleaseActionMutation.mutateAsync({ workspaceId: activeWorkspaceId, draftVersionId: currentVersionId, storeId: actionType === "publish" ? connectedStore?.id : undefined, actionType });
        await authUtils.workspace.releases.invalidate();
        await authUtils.workspace.activity.invalidate();
        setNotice(actionType === "export" ? "Export plan recorded. A downloadable file appears only after an export artifact is generated." : "Publish plan recorded. It requires explicit approval and a supported provider executor before any live change can occur.");
      } catch (error) { setNotice(error instanceof Error ? error.message : "We couldn’t create this release plan."); }
    };
    const approveRelease = async (id: number) => {
      try { if (!activeWorkspaceId) return; await approveReleaseActionMutation.mutateAsync({ workspaceId: activeWorkspaceId, releaseActionId: id }); await authUtils.workspace.releases.invalidate(); setNotice("Release plan approved. It still requires an explicit provider execution action."); } catch (error) { setNotice(error instanceof Error ? error.message : "We couldn’t approve this release plan."); }
    };
    const executeRelease = async (id: number) => {
      try { if (!activeWorkspaceId) return; const result = await executeReleaseActionMutation.mutateAsync({ workspaceId: activeWorkspaceId, releaseActionId: id }); await authUtils.workspace.releases.invalidate(); await authUtils.workspace.activity.invalidate(); setNotice(`Provider action completed with reference ${result.providerReference}.`); } catch (error) { setNotice(error instanceof Error ? error.message : "Provider execution is not available for this release plan."); }
    };
    const cancelRelease = async (id: number) => {
      try { if (!activeWorkspaceId) return; await cancelReleaseActionMutation.mutateAsync({ workspaceId: activeWorkspaceId, releaseActionId: id }); await authUtils.workspace.releases.invalidate(); setNotice("Release plan cancelled. No live store change was made."); } catch (error) { setNotice(error instanceof Error ? error.message : "We couldn’t cancel this release plan."); }
    };
    return <><PageHeading label="Preview & validate / workspace release" title="Validate deliberate changes before release." copy="Validation, export, publish, and rollback all remain explicit workspace records. Live publishing is unavailable until the correct connection and permission are present." action={<button className="app-button" onClick={startValidation}><Monitor /> Run validation</button>} />
      <section className="concise-board"><section className="approved-panel concise-more-board"><div className="approved-panel-title"><div><span className="approved-eyebrow">Current saved version</span><h2>{currentVersionId ? `Version #${currentVersionId}` : "No saved version selected"}</h2></div><span>{currentVersionId ? "Ready for validation" : "Save a version first"}</span></div><p>{currentVersionId ? "Validation creates a durable run against this exact draft version. It does not publish anything." : "Use the visual editor to save a draft version before entering validation or release review."}</p><div className="concise-action-pair"><button className="approved-primary" disabled={!currentVersionId} onClick={startValidation}>Run validation</button><button className="approved-secondary" disabled={!currentVersionId} onClick={() => createRelease("export")}>Create export plan</button>{publishReady ? <button className="approved-secondary" disabled={!currentVersionId} onClick={() => createRelease("publish")}>Create publish plan</button> : <button className="approved-secondary" onClick={() => setNotice(connectedStore ? connectedStoreProvider?.message ?? "Provider publishing is not configured for this store." : "Connect a supported store before creating a publish plan.")}>{connectedStore ? "Publishing unavailable" : "Connect a supported store"}</button>}</div></section>
      <section className="approved-panel concise-more-board"><div className="approved-panel-title"><div><span className="approved-eyebrow">Validation runs</span><h2>Checks remain tied to the saved version.</h2></div><span>{validationRuns.length} records</span></div>{validationRuns.length ? validationRuns.map(run => <article className="approved-analysis-row" key={run.id}><span><b>Version #{run.draftVersionId}</b><small>{run.status} · {new Date(run.createdAt).toLocaleString()}</small></span><em>{run.status}</em><strong>{run.summary ? "Result recorded" : "Awaiting validator output"}</strong></article>) : <p className="team-empty-state">No validation record yet. Start validation from a saved draft version.</p>}</section>
      <section className="approved-panel concise-more-board"><div className="approved-panel-title"><div><span className="approved-eyebrow">Release plans</span><h2>Approval is separate from execution.</h2></div><span>{releases.length} records</span></div>{releases.length ? releases.map(release => <article className="approved-analysis-row" key={release.id}><span><b>{release.actionType}</b><small>{release.status} · requested {new Date(release.requestedAt).toLocaleString()}</small></span><em>{release.status}</em><div className="concise-action-pair">{release.status === "pending" && <button className="approved-secondary" onClick={() => approveRelease(release.id)}>Approve</button>}{release.status === "approved" && release.actionType !== "export" && <button className="approved-primary" onClick={() => executeRelease(release.id)}>Execute provider action</button>}{(release.status === "pending" || release.status === "approved") && <button className="approved-secondary" onClick={() => cancelRelease(release.id)}>Cancel</button>}<strong>{release.status === "approved" && release.actionType !== "export" ? "Ready for explicit provider execution" : release.actionType === "publish" && !release.providerReference ? "Provider execution gated" : "Record available"}</strong></div></article>) : <p className="team-empty-state">No release plan exists. Export plans are safe for saved versions; publish plans require a supported connected store and approval.</p>}</section>{notice && <section className="more-detail-notice"><Check /><div><b>Release status</b><p>{notice}</p></div><button onClick={() => setNotice("")}>Dismiss</button></section>}</section>
    </>;
  }

  function Redesign() {
    const redesignTool = toolCatalog.find(tool => tool.id === "ai-store-redesign") ?? toolCatalog[0];
    return <ApprovedToolWorkflow tool={redesignTool} workspaceId={activeWorkspaceId} startAt="setup" onBack={() => changeView("Tools Library")} />;
  }

  function Overview() {
    const dashboard = workspaceDashboardQuery.data;
    const stores = dashboard?.stores.records ?? [];
    const primaryStore = stores[0];
    const issues = dashboard?.issues.records ?? [];
    const runs = dashboard?.runs.records ?? [];
    const reports = dashboard?.reports.records ?? [];
    const drafts = dashboard?.drafts.records ?? [];
    const healthScore = dashboard?.health.average;
    const summary = [
      { id: "health", value: healthScore ?? "—", label: healthScore === null || healthScore === undefined ? "Health not measured" : "Average store health", tone: "blue" },
      { id: "issues", value: dashboard?.issues.open ?? 0, label: "Open issues", tone: "coral" },
      { id: "drafts", value: dashboard?.drafts.active ?? 0, label: "Active drafts", tone: "purple" },
      { id: "stores", value: dashboard?.stores.connected ?? 0, label: "Connected stores", tone: "green" },
    ];
    return <section className="approved-dashboard">
      <header className="approved-greeting"><div><span className="approved-eyebrow">Your storefront command center</span><h1>Welcome back, <b>{authQuery.data?.name ?? "there"}.</b></h1><p>These workspace records update as you save sources, run tools, review findings, and prepare store changes.</p></div><div className="approved-greeting-actions"><button className="approved-primary" onClick={() => openTool("storefront-analyzer")}><ScanLine /> Analyze a store</button><button className="approved-secondary" onClick={() => changeView("Stores")}><Plus /> Connect store</button></div></header>
      <section className="approved-summary-grid">{summary.map(item => <article className={`approved-summary ${item.tone}`} key={item.id}><b>{item.value}</b><span>{item.label}</span></article>)}</section>
      <section className="approved-primary-action"><div><span className="approved-eyebrow">Start here</span><h2>{primaryStore ? `Continue improving ${primaryStore.name}.` : "Add your first storefront source."}</h2><p>{primaryStore ? "Review the latest live workspace records or run a tool against this store." : "Use a public URL, upload evidence, or connect a supported store to begin a real workspace record."}</p><div><button className="approved-primary" onClick={() => openTool("storefront-analyzer")}>Analyze a store</button><button className="approved-secondary" onClick={() => changeView("Stores")}>Manage sources</button></div></div><div className="approved-quick-actions"><button className="blue" onClick={() => openTool("responsive-analyzer")}><span><TabletSmartphone /></span><b>Check responsive behavior</b><ChevronRight /></button><button className="purple" onClick={() => changeView("Visual editor")}><span><Layers3 /></span><b>Open a saved draft</b><ChevronRight /></button><button className="gold" onClick={() => changeView("Reports")}><span><FileBarChart /></span><b>Review reports</b><ChevronRight /></button></div></section>
      <section className="approved-section-heading"><div><span className="approved-eyebrow">Store overview</span><h2>Your Stores</h2></div><button onClick={() => changeView("Stores")}>View all <ChevronRight /></button></section>
      <section className="approved-dashboard-grid">
        <article className="approved-panel approved-stores-panel">{primaryStore ? <><div className="approved-store-primary"><div className="approved-store-title"><span className="approved-store-mark">{primaryStore.name.slice(0, 1)}</span><div><b>{primaryStore.name}</b><small>{primaryStore.platform} · <em>{primaryStore.status}</em></small></div><span className="approved-status">{primaryStore.status}</span></div><div className="approved-store-score"><span>Health score</span><b>{primaryStore.healthScore ?? "—"}<small>/100</small></b></div><p>Live record from your connected workspace source.</p><div className="approved-store-actions"><button className="approved-primary" onClick={() => changeView("Stores")}>View store</button><button className="approved-secondary" onClick={() => openTool("storefront-analyzer")}>Improve</button></div></div><div className="approved-store-list">{stores.slice(1, 4).map(store => <button onClick={() => changeView("Stores")} key={store.id}><span className="approved-store-mark compact">{store.name.slice(0, 1)}</span><span><b>{store.name}</b><small>{store.status}</small></span><em>Health {store.healthScore ?? "—"}</em><ChevronRight /></button>)}</div></> : <p className="team-empty-state">No stores are saved yet. Add a public URL, upload a source, or begin a supported connection.</p>}</article>
        <article className="approved-panel approved-health-panel"><div className="approved-panel-title"><div><span className="approved-eyebrow">Store health</span><h2>Every measured score tells you where to work next.</h2></div><button onClick={() => changeView("Analysis")}>View full health <ChevronRight /></button></div><div className="approved-health-content"><div className="approved-health-ring"><b>{healthScore ?? "—"}</b><span>/100</span><small>{dashboard?.health.measuredStoreCount ? `${dashboard.health.measuredStoreCount} measured store${dashboard.health.measuredStoreCount === 1 ? "" : "s"}` : "No measured store yet"}</small></div><div className="approved-health-metrics"><span>Workspace measurements</span><div><span>Connected stores</span><b>{dashboard?.stores.connected ?? 0}</b><i style={{ width: `${Math.min((dashboard?.stores.connected ?? 0) * 20, 100)}%` }} /></div><div><span>Completed runs</span><b>{dashboard?.runs.completed ?? 0}</b><i style={{ width: `${Math.min((dashboard?.runs.completed ?? 0) * 15, 100)}%` }} /></div><div><span>Open issues</span><b>{dashboard?.issues.open ?? 0}</b><i style={{ width: `${Math.min((dashboard?.issues.open ?? 0) * 20, 100)}%` }} /></div></div></div></article>
        <article className="approved-panel approved-issues-panel"><div className="approved-panel-title"><div><span className="approved-eyebrow">Priority issues</span><h2>Fix what blocks momentum.</h2></div><button onClick={() => changeView("Issues")}>View all <ChevronRight /></button></div>{issues.length ? issues.slice(0, 3).map(issue => <div className={`approved-issue ${issue.severity}`} key={issue.id}><i /><p>{issue.title}</p><button onClick={() => changeView("Issues")}>{issue.status.replace("_", " ")}</button></div>) : <p className="team-empty-state">No issue records yet. Completed tools can add evidence-backed findings here.</p>}</article>
        <article className="approved-panel approved-recommendation"><span className="approved-eyebrow">Next workspace action</span><h2>{dashboard?.runs.running ? "A tool run is in progress." : dashboard?.runs.queued ? "A tool run is ready to start." : "Run a scoped analysis."}</h2><p>{dashboard?.runs.running ? "The active run remains in your workspace and can collect evidence, issues, reports, or a developer handoff." : "Choose a public URL, saved draft, connected store, or upload through the Tool Library."}</p><button className="approved-primary" onClick={() => changeView("Tools Library")}><Sparkles /> Open Tools Library</button></article>
        <article className="approved-panel approved-analyses"><div className="approved-panel-title"><div><span className="approved-eyebrow">Recent analyses</span><h2>Run records to revisit.</h2></div><button onClick={() => changeView("Reports")}>View history <ChevronRight /></button></div>{runs.length ? runs.map(run => <button onClick={() => changeView("Reports")} className="approved-analysis-row" key={run.id}><span><b>{run.toolId}</b><small>{run.sourceType} · {run.status}</small></span><em>{run.status}</em><strong>View record</strong><ChevronRight /></button>) : <p className="team-empty-state">No tool runs yet. Start an approved tool to create a live analysis record.</p>}</article>
        <article className="approved-panel approved-transformation"><div className="approved-panel-title"><div><span className="approved-eyebrow">Your latest transformation</span><h2>Saved work, ready to compare.</h2></div><button onClick={() => changeView("Visual editor")}>View comparison <ChevronRight /></button></div><div className="approved-compare"><div><div className="approved-preview before"/><span>Drafts <b>{dashboard?.drafts.total ?? 0}</b></span></div><ArrowRight /><div><div className="approved-preview after"/><span>Reports <b>{reports.length}</b></span></div><strong>{drafts.length ? "Saved" : "New"}<small>workspace state</small></strong></div></article>
        <article className="approved-panel approved-publish"><div><span className="approved-eyebrow">Release boundary</span><h2>Publish only after a supported connection.</h2><p>Saved drafts and reports are available now. Live publish controls appear only when the connection and permission allow them.</p></div><div><button className="approved-secondary" onClick={() => changeView("Preview & validate")}>Review validation</button><button className="approved-secondary" onClick={() => changeView("Stores")}>Check connections</button></div></article>
        <article className="approved-panel approved-activity"><div className="approved-panel-title"><div><span className="approved-eyebrow">Recent activity</span><h2>Progress at a glance.</h2></div><button onClick={() => changeView("Reports")}>View activity <ChevronRight /></button></div>{liveActivity.length ? liveActivity.map(activity => <button onClick={() => changeView(activity.destination)} key={activity.id}><Check /> {activity.text}<ChevronRight /></button>) : <p className="team-empty-state">No workspace activity yet. Start by inviting a teammate, adding a store, or running a tool.</p>}</article>
      </section>
    </section>;
  }

  function Editor() {
    const [device, setDevice] = useState("Mobile");
    const [historyOpen, setHistoryOpen] = useState(true);
    const [leftVersion, setLeftVersion] = useState<string | null>(null);
    const [rightVersion, setRightVersion] = useState<string | null>(null);
    const [selectedElement, setSelectedElement] = useState("Price & purchase");
    const [spacing, setSpacing] = useState({ top: 24, bottom: 16 });
    const [accentColor, setAccentColor] = useState("#155eef");
    const versions = useMemo<EditorVersion[]>(() => {
      const draft = workspaceDraftVersionsQuery.data?.draft;
      return (workspaceDraftVersionsQuery.data?.versions ?? []).map(version => ({
        id: String(version.id),
        title: `${draft?.title ?? "Draft"} v${version.versionNumber}`,
        label: version.label,
        time: version.createdAt ? new Date(version.createdAt).toLocaleString() : "Saved now",
        note: version.note ?? "Saved editor state for this workspace.",
        tone: version.id === draft?.currentVersionId ? "current" : "baseline",
        designState: version.designState,
        isCurrent: version.id === draft?.currentVersionId,
      }));
    }, [workspaceDraftVersionsQuery.data]);
    useEffect(() => {
      if (!versions.length) return;
      setRightVersion(current => current && versions.some(version => version.id === current) ? current : versions[0].id);
      setLeftVersion(current => current && versions.some(version => version.id === current) ? current : versions[1]?.id ?? versions[0].id);
    }, [versions]);
    const rehydrateDesignState = (designState: string) => {
      const restored = parseEditorDraftState(designState);
      if (!restored) return;
      setDevice(restored.device);
      setSelectedElement(restored.selectedElement);
      setSpacing(restored.spacing);
      setAccentColor(restored.accentColor);
      setEditorDirty(false);
    };
    const left = versions.find(version => version.id === leftVersion) ?? versions[1] ?? versions[0];
    const right = versions.find(version => version.id === rightVersion) ?? versions[0];
    const saveCurrentDraft = async () => {
      const designState = JSON.stringify({ device, selectedElement, spacing, accentColor });
      try {
        if (!activeWorkspaceId) throw new Error("Workspace is not ready");
        if (resolvedEditorDraftId) {
          const version = await saveWorkspaceDraftVersionMutation.mutateAsync({ workspaceId: activeWorkspaceId, draftId: resolvedEditorDraftId, label: `Manual adjustment · ${selectedElement}`, note: `Preserves the ${selectedElement.toLowerCase()} adjustment.`, designState });
          setRightVersion(String(version.id));
        } else {
          const created = await createWorkspaceDraftMutation.mutateAsync({ workspaceId: activeWorkspaceId, title: "Product page redesign", source: "manual", label: "Initial editor state", note: `Started with the ${selectedElement.toLowerCase()} adjustment.`, designState });
          setActiveEditorDraftId(created.draft.id);
          setRightVersion(String(created.version.id));
        }
        await authUtils.workspace.drafts.invalidate();
        await authUtils.workspace.draftVersions.invalidate();
        await authUtils.workspace.activity.invalidate();
        setEditorDirty(false);
        toast.success("Draft version saved", { description: "Your editor state is now stored in this workspace." });
        if (saveBeforeEditorExit) {
          setSaveBeforeEditorExit(false);
          await finishPendingEditorExit();
        }
      } catch {
        setSaveBeforeEditorExit(false);
        toast.error("We couldn’t save this draft", { description: "Your current editor controls remain unchanged. Please try again." });
      }
    };
    useEffect(() => { if (saveBeforeEditorExit) void saveCurrentDraft(); }, [saveBeforeEditorExit]);
    const restoreSelectedDraft = async () => {
      if (!right) return;
      try {
        if (!activeWorkspaceId || !resolvedEditorDraftId) throw new Error("Draft is not ready");
        const version = await restoreWorkspaceDraftVersionMutation.mutateAsync({ workspaceId: activeWorkspaceId, draftId: resolvedEditorDraftId, versionId: Number(right.id) });
        rehydrateDesignState(version.designState);
        await authUtils.workspace.drafts.invalidate();
        await authUtils.workspace.draftVersions.invalidate();
        await authUtils.workspace.activity.invalidate();
        toast.success("Version restored", { description: "The selected saved editor state is active again." });
      } catch { toast.error("We couldn’t restore that version", { description: "Please try again." }); }
    };
    const renderVersionSurface = (version: EditorVersion, side: "left" | "right") => <article className={`comparison-surface ${side}`} key={side}><header><span>{side === "left" ? "LEFT REFERENCE" : "RIGHT REFERENCE"}</span><b>{version.title}</b><small>{version.label} · {version.time}</small></header><div className={`version-render ${version.tone}`}><div className="version-placeholder"><Layers3 /><b>Stored editor state</b><small>No rendered snapshot was generated for this version.</small></div><div className="version-annotation"><span>Health</span><b>Not measured</b><small>Run validation to create a measured result.</small></div></div><p>{version.note}</p></article>;
    return <>
      <PageHeading label={`Visual editor / ${resolvedEditorDraftId ? "saved workspace state" : "new workspace draft"}`} title="Refine the selected decision." copy="Save a version to keep the current editor state in this workspace. Connected-store publishing remains available only when the store connection and permission support it." action={<span className="editor-heading-actions"><button className="app-button ghost" onClick={() => setHistoryOpen(!historyOpen)}><Activity /> {historyOpen ? "Close history" : "Version history"}</button><button className="app-button" onClick={() => changeView("Preview & validate")}><Eye /> Preview changes</button></span>} />
      <section className="editor-shell"><aside className="editor-pane"><span className="card-eyebrow" style={{color:'#155eef'}}>Layers</span><h3>Product page</h3>{["Header","Product media","Product content","Heading","Price & purchase","Trust row","Description"].map((layer,i)=><button className={`layer-item ${layer===selectedElement?"active":""} ${i>2?"layer-indent":""}`} onClick={() => { setSelectedElement(layer); setEditorDirty(true); }} key={layer}><i className="layer-node" /> {layer}</button>)}</aside><div className="editor-canvas"><div className="viewport-toolbar">{["Desktop","Tablet","Mobile"].map(item=><button className={device===item?"active":""} onClick={() => { setDevice(item); setEditorDirty(true); }} key={item}>{item}</button>)}</div><div className="store-preview"><div className="editor-empty-preview"><Layers3 /><b>No rendered storefront preview is available.</b><span>Persisted editor state can be saved and reviewed, but this workspace does not claim to render or change a live store.</span></div></div></div><aside className="editor-pane right"><span className="card-eyebrow" style={{color:'#155eef'}}>Properties</span><h3>{selectedElement}</h3><div className="prop-group"><span>Spacing</span><div className="prop-controls"><div className="prop-control">Top<b>{spacing.top} px</b></div><div className="prop-control">Bottom<b>{spacing.bottom} px</b></div></div></div><div className="prop-group"><span>Typography</span><div className="prop-controls"><div className="prop-control">Weight<b>700</b></div><div className="prop-control">Size<b>16 px</b></div></div></div><div className="prop-group"><span>Appearance</span><div className="prop-control">Accent color<div className="color-swatch" style={{background:accentColor}}/></div></div><button className="app-button" onClick={saveCurrentDraft}><Check /> Save workspace version</button></aside></section>
      {historyOpen && <section className="version-history-panel" aria-label="Version history and comparison"><aside className="history-rail"><div className="history-rail-heading"><span className="card-eyebrow" style={{color:'#155eef'}}>Saved version history</span><h2>Compare the thinking, not just the pixels.</h2><p>Saved versions are retained in this workspace, so you can compare and restore deliberate editor decisions across sessions.</p></div><div className="history-list">{versions.map((version, index) => <article className={`history-item ${version.id === rightVersion ? "selected" : ""}`} key={version.id}><div className="history-index"><span>{String(versions.length - index).padStart(2, "0")}</span><i /></div><div><b>{version.title}</b><p>{version.label} · {version.time}</p><small>Stored editor state · health not measured</small></div><div className="history-select-actions"><button className={leftVersion === version.id ? "active" : ""} onClick={() => setLeftVersion(version.id)}>L</button><button className={rightVersion === version.id ? "active" : ""} onClick={() => setRightVersion(version.id)}>R</button></div></article>)}</div></aside><div className="comparison-stage">{left && right ? <><div className="comparison-stage-heading"><div><span className="card-eyebrow" style={{color:'#8fb2ff'}}>Side-by-side evidence</span><h2>{left.title} <span>vs.</span> {right.title}</h2></div><span className="viewport-tag"><TabletSmartphone /> {device} viewport</span></div><div className="comparison-surfaces">{renderVersionSurface(left, "left")}{renderVersionSurface(right, "right")}</div><div className="comparison-summary"><span><b>—</b> health movement not measured</span><span>Persisted design-state metadata only · visual diff not run</span><button className="app-button ghost" onClick={restoreSelectedDraft}><Layers3 /> Restore {right.title}</button></div></> : <div className="comparison-empty"><Activity /><h2>Your saved comparison will appear here.</h2><p>Save at least one draft, then use the L and R controls to set the references you want to compare.</p></div>}</div></section>}
    </>;
  }

  function Placeholder({ title, copy, icon, action }: { title: string; copy: string; icon: React.ReactNode; action: string }) { return <><PageHeading label={`Store operations / ${activeStoreRecord?.name ?? "No store selected"}`} title={title} copy={copy} /><section className="placeholder-page"><div><div className="empty-icon">{icon}</div><h2>{title}</h2><p>{copy}</p><button className="app-button" onClick={() => changeView("Analysis")}><ArrowRight /> {action}</button></div></section></> }
}
