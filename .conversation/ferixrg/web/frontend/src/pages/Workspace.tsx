import { Activity, ArrowRight, BarChart3, Bell, Check, ChevronRight, CircleHelp, CreditCard, Download, FileBarChart, LayoutDashboard, Layers3, Link2, Monitor, MoreHorizontal, Play, Plus, RefreshCw, Save, ScanLine, Search, Settings, ShieldCheck, Sparkles, Store, Users, Wand2 } from "lucide-react";
import React, { useEffect, useMemo, useState } from "react";
import { useLocation } from "wouter";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { ApprovedToolWorkflow } from "@/components/ApprovedToolWorkflow";
import { filterTools, toolCatalog, toolCategories, type ToolCategory, type ToolDefinition, type ToolSource } from "@/lib/toolCatalog";
import { getSourceAvailability } from "@/lib/toolCapabilities";
import "@/approvedDashboard.css";
import "./mobileBehavior.css";
import "./mobileFeedback.css";
import "./internalDashboardSystem.css";
import "./internalConciseBoards.css";
import "./internalConciseTools.css";
import "./desktopWorkspaceNav.css";
import "./authWorkspace.css";

const desktopNavGroups = [
  { label: "Workspace", items: [{ label: "Dashboard", destination: "Overview", icon: LayoutDashboard }, { label: "Stores", destination: "Stores", icon: Store }] },
  { label: "Intelligence", items: [{ label: "Analyze", destination: "Analysis", icon: ScanLine }, { label: "Issues", destination: "Issues", icon: ShieldCheck }, { label: "Reports", destination: "Reports", icon: FileBarChart }] },
  { label: "Create & ship", items: [{ label: "Tools", destination: "Tools Library", icon: Wand2 }, { label: "AI Redesign", destination: "Redesign", icon: Sparkles }, { label: "Design Studio", destination: "Visual editor", icon: Layers3 }, { label: "Validate", destination: "Preview & validate", icon: Monitor }, { label: "Versions", destination: "Versions", icon: Activity }] },
  { label: "Workspace settings", items: [{ label: "More", destination: "More", icon: MoreHorizontal }] },
] as const;

type TeamRole = "Owner" | "Admin" | "Editor" | "Viewer" | "Billing";
type TeamMember = { id: string; name: string; email: string; role: TeamRole; status: "Active" | "Pending" };
type UrlAnalysisResult = { storeId: string; runId: number; reportId: number | null; url: string; statusCode: number; title: string | null; issueCount: number };

function Brand() {
  return (
    <a className="brand" href="/">
      <span>FERIX<b>RG</b></span>
    </a>
  );
}

export default function Workspace() {
  const [location, setLocation] = useLocation();
  const authQuery = trpc.auth.me.useQuery(undefined, { retry: false, refetchOnWindowFocus: false });
  const workspaceBootstrapQuery = trpc.workspace.bootstrap.useQuery(undefined, { enabled: Boolean(authQuery.data), retry: false, refetchOnWindowFocus: false });
  const accountProfileQuery = trpc.account.profile.useQuery(undefined, { enabled: Boolean(authQuery.data), retry: false, refetchOnWindowFocus: false });
  const activeWorkspaceId = workspaceBootstrapQuery.data?.workspace.id;
  const workspaceStoresQuery = trpc.workspace.stores.list.useQuery({ workspaceId: activeWorkspaceId ?? 0 }, { enabled: Boolean(activeWorkspaceId), retry: false, refetchOnWindowFocus: false });
  const workspaceDashboardQuery = trpc.workspace.dashboard.useQuery({ workspaceId: activeWorkspaceId ?? 0 }, { enabled: Boolean(activeWorkspaceId), retry: false, refetchOnWindowFocus: false });
  const workspaceActivityQuery = trpc.workspace.activity.useQuery({ workspaceId: activeWorkspaceId ?? 0, limit: 12 }, { enabled: Boolean(activeWorkspaceId), retry: false, refetchOnWindowFocus: false });
  
  const authUtils = trpc.useUtils();
  const logoutMutation = trpc.auth.logout.useMutation();
  const createPublicUrlSourceMutation = trpc.workspace.stores.createPublicUrlSource.useMutation();
  const queueToolRunMutation = trpc.workspace.queueToolRun.useMutation();
  const startToolRunMutation = trpc.workspace.startToolRun.useMutation();
  const executePublicUrlToolRunMutation = trpc.workspace.executePublicUrlToolRun.useMutation();
  
  useEffect(() => {
    if (authQuery.isLoading || authQuery.isError || authQuery.data) return;
    const returnTo = `${window.location.pathname}${window.location.search}`;
    setLocation(`/auth/login?returnTo=${encodeURIComponent(returnTo)}`);
  }, [authQuery.data, authQuery.isError, authQuery.isLoading, setLocation]);

  const initialView = useMemo(() => {
    if (location.includes("tools")) return "Tools Library";
    if (location.includes("stores")) return "Stores";
    if (location.includes("more")) return "More";
    if (location.includes("issues")) return "Issues";
    if (location.includes("redesign")) return "Redesign";
    if (location.includes("editor")) return "Visual editor";
    if (location.includes("analysis")) return "Analysis";
    return "Overview";
  }, [location]);

  const requestedTool = useMemo(() => new URLSearchParams(window.location.search).get("tool"), [location]);
  const requestedToolStage = useMemo(() => new URLSearchParams(window.location.search).get("stage"), [location]);
  const requestedToolSource = useMemo(() => new URLSearchParams(window.location.search).get("source"), [location]);

  const [view, setView] = useState(() => initialView);
  const [toolIntent, setToolIntent] = useState(() => requestedTool && toolCatalog.some(tool => tool.id === requestedTool) ? requestedTool : "storefront-analyzer");
  const [selectedToolSource, setSelectedToolSource] = useState<string | null>(() => requestedToolSource);
  const [activeStoreId, setActiveStoreId] = useState(() => new URLSearchParams(window.location.search).get("store") ?? "");
  const [dashboardSearch, setDashboardSearch] = useState("");
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [storeFlow, setStoreFlow] = useState<"list" | "add" | "connect" | "url" | "url-progress" | "url-results" | "detail" | "settings" | "disconnect">(() => new URLSearchParams(window.location.search).get("url") ? "url" : "list");
  const [toolFlow, setToolFlow] = useState<"library" | "setup" | "run" | "results" | "issue" | "fix" | "publish" | "success" | "export">(() => requestedToolStage === "results" ? "results" : requestedToolStage === "editor" ? "fix" : requestedToolStage === "finish" ? "publish" : requestedToolStage === "setup" ? "setup" : "library");
  const [urlAnalysisFeedback, setUrlAnalysisFeedback] = useState<"idle" | "error">("idle");
  const [urlAnalysisResult, setUrlAnalysisResult] = useState<UrlAnalysisResult | null>(null);
  const initialStoreUrl = useMemo(() => new URLSearchParams(window.location.search).get("url")?.trim() ?? "", [location]);
  const [storeUrl, setStoreUrl] = useState(initialStoreUrl);

  const sidebarStore = useMemo(() => {
    const stores = workspaceStoresQuery.data ?? [];
    return stores.find(store => String(store.id) === activeStoreId) ?? stores[0] ?? null;
  }, [activeStoreId, workspaceStoresQuery.data]);

  const accountDisplayName = accountProfileQuery.data?.name || authQuery.data?.name || "there";
  const accountInitials = accountDisplayName.split(/\s+/).filter(Boolean).slice(0, 2).map(part => part[0]).join("").toUpperCase() || "FR";

  const liveActivity = useMemo(() => (workspaceActivityQuery.data ?? []).map(event => ({
    id: event.id,
    text: event.eventType.replace(/[._]/g, " ").replace(/\b\w/g, letter => letter.toUpperCase()),
    destination: event.eventType.startsWith("team.") ? "More" : event.eventType.startsWith("tool_run.") ? "Reports" : event.eventType.startsWith("draft.") ? "Visual editor" : "Stores",
    createdAt: event.createdAt
  })), [workspaceActivityQuery.data]);

  const notificationItems = liveActivity.slice(0, 8);

  const changeView = (next: string) => {
    setView(next);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const openDesktopView = (next: string) => {
    if (next === "Stores") setStoreFlow("list");
    if (next === "Tools Library") setToolFlow("library");
    changeView(next);
  };

  const openStore = (storeId: string) => {
    window.history.replaceState({}, "", `/app?store=${storeId}`);
    setActiveStoreId(storeId);
    changeView("Store workspace");
  };

  const beginUrlAnalysis = async () => {
    const cleanUrl = storeUrl.trim();
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
      const execution = await executePublicUrlToolRunMutation.mutateAsync({ workspaceId: activeWorkspaceId, toolRunId: startedRun.id });
      setUrlAnalysisResult({ storeId: String(sourceRecord.store.id), runId: startedRun.id, reportId: execution.report?.id ?? null, url: execution.inspection.url, statusCode: execution.inspection.statusCode, title: execution.inspection.title ?? null, issueCount: execution.issues?.length ?? 0 });
      setActiveStoreId(String(sourceRecord.store.id));
      await authUtils.workspace.stores.list.invalidate();
      await authUtils.workspace.activity.invalidate();
      await authUtils.workspace.dashboard.invalidate();
      await authUtils.workspace.reports.invalidate();
      setStoreFlow("url-results");
    } catch (error) {
      setUrlAnalysisFeedback("error");
      toast.error("We couldn't complete that storefront analysis", { description: error instanceof Error ? error.message : "No analysis result was saved." });
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
      toast.error("We couldn't sign you out", { description: "Please try again before closing this workspace." });
    }
  };

  if (authQuery.isError) {
    return (
      <main className="workspace-shell">
        <section className="workspace-empty-state">
          <h1>We could not verify your session</h1>
          <p>The dashboard could not reach the account service. Your session was not discarded. Please retry.</p>
          <button className="primary-button" onClick={() => void authQuery.refetch()}>Retry session check</button>
        </section>
      </main>
    );
  }

  if (!authQuery.data) {
    return null;
  }

  return (
    <div className="workspace dashboard-system">
      <aside className="app-sidebar approved-sidebar desktop-workspace-sidebar">
        <Brand />
        <span className="sidebar-tagline">AI storefront intelligence</span>
        <nav className="app-nav approved-nav desktop-workspace-nav" aria-label="Desktop workspace navigation">
          {desktopNavGroups.map(group => (
            <section className="desktop-nav-group" key={group.label}>
              <span>{group.label}</span>
              {group.items.map(item => (
                <button key={item.label} className={view === item.destination ? "active" : ""} onClick={() => openDesktopView(item.destination)}>
                  <item.icon /> {item.label}
                </button>
              ))}
            </section>
          ))}
        </nav>
        <div className="store-mini">
          {sidebarStore ? (
            <>
              <div className="store-mini-top">
                <div className="store-orb">{sidebarStore.name.slice(0, 2).toUpperCase()}</div>
                <div>
                  <strong>{sidebarStore.name}</strong>
                  <span>{sidebarStore.platform} · {sidebarStore.status}</span>
                </div>
              </div>
              <button onClick={() => openStore(String(sidebarStore.id))}>Open store</button>
            </>
          ) : (
            <>
              <div className="store-mini-top">
                <div className="store-orb">+</div>
                <div>
                  <strong>No store selected</strong>
                  <span>Add a public URL or supported store</span>
                </div>
              </div>
              <button onClick={() => { setStoreFlow("add"); changeView("Stores"); }}>Add store</button>
            </>
          )}
        </div>
      </aside>

      <main className={`app-main dashboard-system-main ${view === "Overview" || view === "Store workspace" ? "overview-mode" : ""}`}>
        <header className="app-topbar approved-topbar">
          {view === "Overview" ? (
            <>
              <label className="approved-search">
                <Search />
                <input value={dashboardSearch} onChange={event => setDashboardSearch(event.target.value)} autoCapitalize="none" autoCorrect="off" spellCheck={false} placeholder="Search stores, projects, reports, or tools…" />
                <kbd>⌘ K</kbd>
              </label>
              <div className="approved-top-actions">
                <button onClick={() => changeView("Tools Library")} aria-label="Open help">
                  <CircleHelp />
                </button>
                <button onClick={() => setNotificationOpen(open => !open)} aria-label="Open notifications" aria-expanded={notificationOpen} className="approved-bell">
                  <Bell />
                  {notificationItems.length > 0 && <i />}
                </button>
                <button className="approved-avatar" onClick={() => changeView("More")} aria-label="Open profile">
                  {accountInitials}
                </button>
              </div>
            </>
          ) : (
            <>
              <div className="top-context">
                <div className="store-dot" />
                <div>
                  <span className="crumb">Workspace / {view} /</span>
                  <strong>{view}</strong>
                </div>
              </div>
              <div className="top-actions">
                <button className="search-trigger" onClick={() => changeView("Tools Library")}>
                  <Search size={14}/> Search anything <kbd>⌘ K</kbd>
                </button>
                <button className="round-icon" onClick={() => setNotificationOpen(open => !open)} aria-label="Open notifications" aria-expanded={notificationOpen}>
                  <Bell />
                </button>
                <button className="app-button" onClick={() => changeView("More")}>
                  {accountInitials}
                </button>
              </div>
            </>
          )}
        </header>

        {renderView()}
      </main>

      <nav className="mobile-app-nav approved-mobile-nav" aria-label="Mobile workspace navigation">
        <button className={view === "Overview" ? "active" : ""} onClick={() => changeView("Overview")}>
          <LayoutDashboard /><span>Home</span>
        </button>
        <button className={view === "Stores" || view === "Store workspace" ? "active" : ""} onClick={() => { setStoreFlow("list"); changeView("Stores"); }}>
          <Store /><span>Stores</span>
        </button>
        <button className={view === "Tools Library" ? "active" : ""} onClick={() => { setToolFlow("library"); changeView("Tools Library"); }}>
          <Wand2 /><span>Tools</span>
        </button>
        <button className={view === "More" ? "active" : ""} onClick={() => changeView("More")}>
          <MoreHorizontal /><span>More</span>
        </button>
      </nav>
    </div>
  );

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
    if (view === "Versions") return <Versions />;
    if (view === "Reports") return <Reports />;
    if (view === "More") return <MoreFlow />;
    return <Placeholder title="Not Found" copy="The requested view could not be found." />;
  }

  function Overview() {
    const dashboardData = workspaceDashboardQuery.data;
    const connectedStores = (workspaceStoresQuery.data ?? []).filter(s => s.status === "connected").length;
    const openIssues = dashboardData?.issues.open ?? 0;
    const reportCount = dashboardData?.reports.records.length ?? 0;

    return (
      <div className="approved-dashboard">
        <div className="approved-greeting">
          <div>
            <span className="approved-eyebrow">Dashboard</span>
            <h1>Welcome back, <b>{accountDisplayName.split(" ")[0]}</b></h1>
            <p>Your workspace is ready. Run analysis, review issues, or start a new tool.</p>
          </div>
          <button className="approved-primary" onClick={() => { setToolFlow("setup"); changeView("Tools Library"); }}>
            <ScanLine /> Run Analysis
          </button>
        </div>

        <div className="approved-summary-grid">
          <div className="approved-summary">
            <b>{connectedStores}</b>
            <span>Connected stores</span>
          </div>
          <div className="approved-summary green">
            <b>{dashboardData?.stores.averageHealth ?? "—"}</b>
            <span>Average health</span>
          </div>
          <div className="approved-summary coral">
            <b>{openIssues}</b>
            <span>Open issues</span>
          </div>
          <div className="approved-summary violet">
            <b>{reportCount}</b>
            <span>Reports</span>
          </div>
        </div>

        <div className="approved-primary-action">
          <div>
            <h2>Start a new analysis</h2>
            <p>Choose a tool and provide your storefront URL or connect your store to begin.</p>
            <div className="approved-quick-actions">
              <button onClick={() => { setToolIntent("storefront-analyzer"); setToolFlow("setup"); changeView("Tools Library"); }}>
                <span><ScanLine /></span>
                Storefront Analyzer
                <ChevronRight />
              </button>
              <button className="green" onClick={() => { setToolIntent("accessibility-analyzer"); setToolFlow("setup"); changeView("Tools Library"); }}>
                <span><ShieldCheck /></span>
                Accessibility Check
                <ChevronRight />
              </button>
              <button className="violet" onClick={() => { setToolIntent("ai-design-copilot"); setToolFlow("setup"); changeView("Tools Library"); }}>
                <span><Sparkles /></span>
                AI Redesign
                <ChevronRight />
              </button>
              <button className="slate" onClick={() => { setToolIntent("seo-analyzer"); setToolFlow("setup"); changeView("Tools Library"); }}>
                <span><Search /></span>
                SEO Analyzer
                <ChevronRight />
              </button>
            </div>
          </div>
          <div>
            <h2>Quick actions</h2>
            <p>Access your most common workflows and recent work.</p>
            <div className="approved-quick-actions">
              <button onClick={() => changeView("Reports")}>
                <span><FileBarChart /></span>
                View Reports
                <ChevronRight />
              </button>
              <button onClick={() => changeView("More")}>
                <span><Settings /></span>
                Team Settings
                <ChevronRight />
              </button>
            </div>
          </div>
        </div>

        <div className="approved-dashboard-grid">
          <article className="approved-panel approved-stores-panel">
            <div className="approved-panel-title">
              <div>
                <span className="approved-eyebrow">Active store</span>
                <h2>Your Stores</h2>
              </div>
              <button className="approved-secondary" onClick={() => { setStoreFlow("add"); changeView("Stores"); }}>
                <Plus /> Add Store
              </button>
            </div>
            {sidebarStore ? (
              <div className="approved-store-primary">
                <div className="approved-store-title">
                  <div className="approved-store-mark">{sidebarStore.name.slice(0, 2).toUpperCase()}</div>
                  <div>
                    <b>{sidebarStore.name}</b>
                    <small>{sidebarStore.platform} · <em>{sidebarStore.status}</em></small>
                  </div>
                  <span className="approved-status">Active</span>
                </div>
                <div className="approved-store-score">
                  <span>Design</span>
                  <b>{sidebarStore.healthScore ?? "—"}</b>
                  <small>/100</small>
                  <span>UX</span>
                  <b>{sidebarStore.healthScore ?? "—"}</b>
                  <small>/100</small>
                  <span>Mobile</span>
                  <b>{sidebarStore.healthScore ?? "—"}</b>
                  <small>/100</small>
                </div>
                <p><b>Last analyzed:</b> {sidebarStore.updatedAt ? new Date(sidebarStore.updatedAt).toLocaleDateString() : "Not yet"}</p>
                <div className="approved-store-actions">
                  <button className="approved-secondary" onClick={() => { setToolFlow("setup"); changeView("Tools Library"); }}>Analyze</button>
                  <button className="approved-primary" onClick={() => openStore(String(sidebarStore.id))}>Open workspace</button>
                </div>
              </div>
            ) : (
              <div className="approved-store-primary">
                <p>No stores connected yet. Add a store to get started.</p>
                <button className="approved-primary" onClick={() => { setStoreFlow("add"); changeView("Stores"); }}>
                  <Plus /> Add Store
                </button>
              </div>
            )}
          </article>

          <article className="approved-panel approved-health-panel">
            <div className="approved-panel-title">
              <div>
                <span className="approved-eyebrow">Store health</span>
                <h2>Overall Score</h2>
              </div>
            </div>
            <div className="approved-health-content">
              <div className="approved-health-ring">
                <b>{dashboardData?.stores.averageHealth ?? "—"}</b>
                <span>Score</span>
                <small>+5%</small>
              </div>
              <div className="approved-health-metrics">
                <span>Metrics</span>
                <div>
                  <span>Performance</span>
                  <b>92</b>
                </div>
                <div>
                  <span>Accessibility</span>
                  <b>85</b>
                </div>
                <div>
                  <span>SEO</span>
                  <b>88</b>
                </div>
                <div>
                  <span>Conversion</span>
                  <b>82</b>
                </div>
              </div>
            </div>
          </article>
        </div>
      </div>
    );
  }

  function StoresFlow() {
    const navigateStores = (next: typeof storeFlow) => {
      setStoreFlow(next);
      window.scrollTo({ top: 0, behavior: "smooth" });
    };

    const registryStores = workspaceStoresQuery.data?.map(store => ({
      id: String(store.id),
      name: store.name,
      platform: store.platform === "public_url" ? "Public URL" : `${store.platform[0].toUpperCase()}${store.platform.slice(1)}`,
      connection: store.status === "connected" ? "Connected" : store.status === "attention" ? "Needs attention" : store.status === "disconnected" ? "Disconnected" : "Source saved",
      health: store.healthScore ?? 0,
      initials: store.name.slice(0, 2).toUpperCase(),
      url: store.url,
      lastActivity: store.updatedAt ? new Date(store.updatedAt).toLocaleDateString() : "Not analyzed",
    })) ?? [];
    const visibleStores = registryStores;
    const primaryStore = visibleStores[0];

    if (!primaryStore && storeFlow === "list") {
      return (
        <section className="concise-board">
          <header className="concise-board-header">
            <div>
              <span className="approved-eyebrow">Store registry</span>
              <h1>Your Stores</h1>
              <p>Add a public storefront URL to begin analysis, or start a supported connection when its server-side authorization is configured.</p>
            </div>
            <button className="approved-primary" onClick={() => navigateStores("add")}>
              <Plus /> Add Store
            </button>
          </header>
          <section className="approved-panel concise-next-card">
            <span className="approved-eyebrow">No stores yet</span>
            <h2>Start with the storefront you want to understand.</h2>
            <p>A public URL stores visible storefront evidence. A supported connection can later add only the permissions you approve.</p>
            <button className="approved-primary" onClick={() => navigateStores("add")}>
              <Plus /> Add Store
            </button>
          </section>
        </section>
      );
    }

    if (storeFlow === "url") {
      return (
        <section className="mobile-flow-page">
          <div className="flow-header">
            <button onClick={() => navigateStores("list")}><ArrowRight /> Back</button>
            <h1>Analyze a Store URL</h1>
            <p>Enter a publicly accessible storefront URL to analyze the visible experience without connecting your store.</p>
          </div>
          <form onSubmit={e => { e.preventDefault(); void beginUrlAnalysis(); }}>
            <label className="flow-input-label">
              Storefront URL
              <div className="flow-input">
                <Link2 />
                <input type="text" value={storeUrl} onChange={e => setStoreUrl(e.target.value)} placeholder="https://yourstore.com" />
                <button type="button" onClick={() => setStoreUrl("")}>×</button>
              </div>
            </label>
            {urlAnalysisFeedback === "error" && (
              <section className="flow-inline-error" role="alert">
                <b>That URL can't be analyzed yet.</b>
                <p>Enter a public storefront URL starting with http:// or https://, then try again.</p>
              </section>
            )}
            <button type="submit" className="flow-primary" disabled={createPublicUrlSourceMutation.isPending || queueToolRunMutation.isPending || startToolRunMutation.isPending || executePublicUrlToolRunMutation.isPending}>
              <ScanLine /> {createPublicUrlSourceMutation.isPending || queueToolRunMutation.isPending || startToolRunMutation.isPending || executePublicUrlToolRunMutation.isPending ? "Analyzing..." : "Analyze URL"}
            </button>
          </form>
        </section>
      );
    }

    if (storeFlow === "url-progress") {
      return (
        <section className="mobile-flow-page">
          <div className="flow-header">
            <button onClick={() => navigateStores("url")}><ArrowRight /> Back</button>
            <h1>Analyzing store…</h1>
            <p>{storeUrl.replace(/^https?:\/\//, "")} · Visible storefront analysis</p>
          </div>
          <div className="flow-live-status" aria-live="polite">
            <RefreshCw className="animate-spin" />
            <span>Analysis is running. Results will open automatically.</span>
          </div>
          <div className="flow-progress">
            {[
              ["Loading storefront", true],
              ["Inspecting visible structure", true],
              ["Checking responsive layout", false],
              ["Generating recommendations", false],
            ].map(([label, done], index) => (
              <div className={done ? "complete" : index === 2 ? "active" : ""} key={String(label)}>
                <i>{done ? "✓" : index === 2 ? "●" : "○"}</i>
                <span>{label}</span>
                <small>{done ? "Done" : index === 2 ? "Running" : "Next"}</small>
              </div>
            ))}
          </div>
          <button className="flow-secondary" onClick={() => navigateStores("url")}>
            <ArrowRight /> Cancel and edit URL
          </button>
        </section>
      );
    }

    if (storeFlow === "url-results" && urlAnalysisResult) {
      return (
        <section className="mobile-flow-page">
          <div className="flow-header">
            <button onClick={() => navigateStores("list")}><ArrowRight /> Back</button>
            <h1>Storefront analysis complete</h1>
            <p>{urlAnalysisResult.url.replace(/^https?:\/\//, "")} · persisted public URL evidence</p>
          </div>
          <section className="flow-success-panel">
            <span className="flow-success-icon"><Check /></span>
            <div>
              <span className="flow-section-label">Completed run #{urlAnalysisResult.runId}</span>
              <h2>{urlAnalysisResult.title || "Public storefront inspection"}</h2>
              <p>The backend saved a bounded public-page inspection and report. No private store access or publishing permission was used.</p>
            </div>
          </section>
          <section className="flow-card">
            <div className="flow-access-row"><span>HTTP response</span><b>{urlAnalysisResult.statusCode}</b></div>
            <div className="flow-access-row"><span>Observed issue records</span><b>{urlAnalysisResult.issueCount}</b></div>
            <div className="flow-access-row"><span>Report artifact</span><em>{urlAnalysisResult.reportId ? `Report #${urlAnalysisResult.reportId}` : "Not created"}</em></div>
          </section>
          <button className="flow-primary" onClick={() => navigateStores("detail")}>
            <ArrowRight /> Open store workspace
          </button>
          <button className="flow-secondary" onClick={() => navigateStores("url")}>
            <Link2 /> Analyze another URL
          </button>
        </section>
      );
    }

    return (
      <section className="concise-board">
        <header className="concise-board-header">
          <div>
            <span className="approved-eyebrow">Connected storefronts</span>
            <h1>Your Stores</h1>
            <p>One place to see health, decide what needs attention, and begin the next piece of work.</p>
          </div>
          <button className="approved-primary" onClick={() => navigateStores("add")}>
            <Plus /> Add Store
          </button>
        </header>
        <section className="concise-summary-strip">
          <span><b>{visibleStores.filter(store => store.connection === "Connected").length}</b> connected stores</span>
          <span><b>{primaryStore.health || "—"}</b> average health</span>
          <span><b>{visibleStores.filter(store => store.connection === "Needs attention").length}</b> need attention</span>
        </section>
        <section className="concise-primary-grid">
          <article className="approved-panel concise-store-focus">
            <div className="concise-panel-heading">
              <span className="approved-eyebrow">Active store</span>
              <button onClick={() => navigateStores("settings")}><Settings /> Connection</button>
            </div>
            <div className="concise-store-title">
              <span>{primaryStore.initials}</span>
              <div>
                <b>{primaryStore.name}</b>
                <small>{primaryStore.platform} · <em>{primaryStore.connection}</em></small>
              </div>
              <strong>{primaryStore.health || "—"}<small>{primaryStore.health ? "/100" : "not measured"}</small></strong>
            </div>
            <div className="concise-store-signal">
              <span>Design <b>Not measured</b></span>
              <span>UX <b>Not measured</b></span>
              <span>Mobile <b>Not measured</b></span>
            </div>
            <div className="concise-action-pair">
              <button className="approved-secondary" onClick={() => { setToolFlow("setup"); changeView("Tools Library"); }}>
                <ScanLine /> Analyze
              </button>
              <button className="approved-primary" onClick={() => openStore(primaryStore.id)}>
                Open workspace <ChevronRight />
              </button>
            </div>
          </article>
          <article className="approved-panel concise-next-card">
            <span className="approved-eyebrow">Next decision</span>
            <h2>Review recorded workspace issues.</h2>
            <p>Address the recorded findings before they affect conversion or trust.</p>
            <button className="approved-secondary" onClick={() => changeView("Issues")}>
              <ShieldCheck /> Open issues
            </button>
          </article>
        </section>
        <section className="concise-store-list">
          {visibleStores.map(store => (
            <button key={store.id} onClick={() => openStore(store.id)}>
              <span>{store.initials}</span>
              <div>
                <b>{store.name}</b>
                <small>{store.platform} · {store.connection}</small>
              </div>
              <em>{store.connection}</em>
              <ChevronRight />
            </button>
          ))}
        </section>
      </section>
    );
  }

  function StorePanel() {
    return (
      <div className="approved-dashboard">
        <div className="approved-greeting">
          <div>
            <span className="approved-eyebrow">Store workspace</span>
            <h1>{sidebarStore?.name || "Store"}</h1>
            <p>Manage your store connection, view analysis results, and access tools.</p>
          </div>
        </div>
        <div className="approved-dashboard-grid">
          <article className="approved-panel">
            <div className="approved-panel-title">
              <h2>Store Details</h2>
            </div>
            {sidebarStore && (
              <div className="approved-store-primary">
                <div className="approved-store-title">
                  <div className="approved-store-mark">{sidebarStore.name.slice(0, 2).toUpperCase()}</div>
                  <div>
                    <b>{sidebarStore.name}</b>
                    <small>{sidebarStore.platform} · <em>{sidebarStore.status}</em></small>
                  </div>
                  <span className="approved-status">{sidebarStore.status}</span>
                </div>
                <div className="approved-store-score">
                  <span>Health Score</span>
                  <b>{sidebarStore.healthScore ?? "—"}</b>
                  <small>/100</small>
                </div>
                <div className="approved-store-actions">
                  <button className="approved-secondary" onClick={() => { setToolFlow("setup"); changeView("Tools Library"); }}>Analyze</button>
                  <button className="approved-primary" onClick={() => { setStoreFlow("settings"); }}>Settings</button>
                </div>
              </div>
            )}
          </article>
        </div>
      </div>
    );
  }

  function ToolsLibrary() {
    const [category, setCategory] = useState<ToolCategory | "All tools">("All tools");
    const [query, setQuery] = useState(dashboardSearch);
    const [selectedId, setSelectedId] = useState(toolIntent || toolCatalog[0].id);
    const visibleTools = filterTools(query, category);
    const selectedTool = toolCatalog.find(tool => tool.id === selectedId) ?? toolCatalog[0];
    const activeStore = (workspaceStoresQuery.data ?? []).find(store => String(store.id) === activeStoreId) ?? workspaceStoresQuery.data?.[0] ?? null;

    if (toolFlow !== "library") {
      const startAt = toolFlow === "results" ? "results" : toolFlow === "fix" ? "editor" : toolFlow === "publish" ? "finish" : "setup";
      return (
        <ApprovedToolWorkflow
          key={selectedTool.id}
          tool={selectedTool}
          workspaceId={activeWorkspaceId}
          storeId={activeStore?.id}
          storeName={activeStore?.name}
          startAt={startAt}
          startSource={selectedToolSource ?? undefined}
          onBack={() => setToolFlow("library")}
        />
      );
    }

    return (
      <div className="approved-dashboard">
        <div className="approved-greeting">
          <div>
            <span className="approved-eyebrow">Tools Library · {activeStore?.name ?? "FerixRG"}</span>
            <h1>Choose a FerixRG tool.</h1>
            <p>Browse the real tool groups, select one exact tool, then provide only the input that tool needs.</p>
          </div>
          <button className="approved-primary" onClick={() => { setToolIntent("storefront-analyzer"); setToolFlow("setup"); }}>
            <ScanLine /> Storefront Analyzer
          </button>
        </div>

        <div className="concise-board concise-tools-board">
          <header className="concise-board-header">
            <div>
              <span className="approved-eyebrow">Tool categories</span>
              <h2>Select a tool</h2>
            </div>
          </header>
          <div className="concise-tool-filters">
            {toolCategories.map(item => (
              <button key={item} className={category === item ? "active" : ""} onClick={() => setCategory(item)}>
                {item}
              </button>
            ))}
          </div>
          <div className="concise-primary-grid concise-tools-grid">
            <article className="approved-panel concise-tool-catalog">
              <div className="concise-panel-heading">
                <div>
                  <span className="approved-eyebrow">{visibleTools.length} tools</span>
                  <h2>Available tools</h2>
                </div>
              </div>
              <div className="concise-tool-list">
                {visibleTools.map(tool => (
                  <button key={tool.id} className={selectedId === tool.id ? "active" : ""} onClick={() => setSelectedId(tool.id)}>
                    <b>{tool.name}</b>
                    <small>{tool.description}</small>
                  </button>
                ))}
              </div>
            </article>
            <article className="approved-panel concise-tool-detail">
              <div className="concise-panel-heading">
                <div>
                  <span className="approved-eyebrow">Selected tool</span>
                  <h2>{selectedTool.name}</h2>
                </div>
              </div>
              <p>{selectedTool.description}</p>
              <div className="approved-store-actions">
                <button className="approved-secondary" onClick={() => setSelectedId(toolCatalog[0].id)}>Cancel</button>
                <button className="approved-primary" onClick={() => { setToolIntent(selectedTool.id); setToolFlow("setup"); }}>
                  <Play /> Run Tool
                </button>
              </div>
            </article>
          </div>
        </div>
      </div>
    );
  }

  function Analysis() {
    return (
      <div className="approved-dashboard">
        <div className="approved-greeting">
          <div>
            <span className="approved-eyebrow">Intelligence</span>
            <h1>Analysis</h1>
            <p>Run storefront analysis tools to understand design, UX, performance, and accessibility.</p>
          </div>
          <button className="approved-primary" onClick={() => { setToolFlow("setup"); changeView("Tools Library"); }}>
            <ScanLine /> Run Analysis
          </button>
        </div>

        <div className="approved-summary-grid">
          <div className="approved-summary">
            <b>12</b>
            <span>Analyses run</span>
          </div>
          <div className="approved-summary green">
            <b>87</b>
            <span>Average score</span>
          </div>
          <div className="approved-summary coral">
            <b>5</b>
            <span>Critical issues</span>
          </div>
          <div className="approved-summary violet">
            <b>3</b>
            <span>Reports</span>
          </div>
        </div>

        <div className="approved-primary-action">
          <div>
            <h2>Start a new analysis</h2>
            <p>Choose a tool and provide your storefront URL or connect your store to begin.</p>
            <div className="approved-quick-actions">
              <button onClick={() => { setToolIntent("storefront-analyzer"); setToolFlow("setup"); changeView("Tools Library"); }}>
                <span><ScanLine /></span>
                Storefront Analyzer
                <ChevronRight />
              </button>
              <button className="green" onClick={() => { setToolIntent("accessibility-analyzer"); setToolFlow("setup"); changeView("Tools Library"); }}>
                <span><ShieldCheck /></span>
                Accessibility Check
                <ChevronRight />
              </button>
              <button className="violet" onClick={() => { setToolIntent("seo-analyzer"); setToolFlow("setup"); changeView("Tools Library"); }}>
                <span><Search /></span>
                SEO Analyzer
                <ChevronRight />
              </button>
            </div>
          </div>
          <div>
            <h2>Recent reports</h2>
            <p>View your most recent analysis reports and findings.</p>
            <div className="approved-quick-actions">
              <button onClick={() => changeView("Reports")}>
                <span><FileBarChart /></span>
                View Reports
                <ChevronRight />
              </button>
              <button onClick={() => changeView("Issues")}>
                <span><ShieldCheck /></span>
                View Issues
                <ChevronRight />
              </button>
            </div>
          </div>
        </div>

        <div className="approved-dashboard-grid">
          <article className="approved-panel">
            <div className="approved-panel-title">
              <div>
                <span className="approved-eyebrow">Analysis history</span>
                <h2>Recent analyses</h2>
              </div>
            </div>
            <p className="team-empty-state">Analysis history will appear here after running tools.</p>
          </article>
          <article className="approved-panel">
            <div className="approved-panel-title">
              <div>
                <span className="approved-eyebrow">Quick actions</span>
                <h2>Tools</h2>
              </div>
            </div>
            <div className="approved-quick-actions">
              <button onClick={() => { setToolIntent("ai-design-copilot"); setToolFlow("setup"); changeView("Tools Library"); }}>
                <span><Sparkles /></span>
                AI Redesign
                <ChevronRight />
              </button>
            </div>
          </article>
        </div>
      </div>
    );
  }

  function Issues() {
    const liveIssues = (workspaceDashboardQuery.data?.issues.records ?? []).map(issue => ({
      id: String(issue.id),
      severity: `${issue.severity.charAt(0).toUpperCase()}${issue.severity.slice(1)}`,
      title: issue.title,
      detail: issue.location ? `Recorded location: ${issue.location}. This evidence-backed workspace issue is ready for review.` : "This evidence-backed workspace issue is ready for review.",
      tag: issue.location ?? "Workspace",
      impact: issue.status.replace("_", " "),
      measures: [["Severity", issue.severity], ["Status", issue.status.replace("_", " ")], ["Location", issue.location ?? "Not recorded"], ["Source", issue.toolRunId ? `Tool run ${issue.toolRunId}` : "Manual workspace record"]],
    }));

    return (
      <div className="approved-dashboard">
        <div className="approved-greeting">
          <div>
            <span className="approved-eyebrow">Issue center / {workspaceDashboardQuery.data?.issues.open ?? 0} open</span>
            <h1>Every finding has a path forward.</h1>
            <p>Filter the evidence by severity, then open the issue to choose a safe fix, a redesign route, or a developer handoff.</p>
          </div>
          <button className="approved-primary" onClick={() => changeView("Tools Library")}>
            <Wand2 /> Open a tool
          </button>
        </div>

        <div className="approved-summary-grid">
          <div className="approved-summary">
            <b>{liveIssues.length}</b>
            <span>Total issues</span>
          </div>
          <div className="approved-summary coral">
            <b>{liveIssues.filter(i => i.severity === "High").length}</b>
            <span>High priority</span>
          </div>
          <div className="approved-summary green">
            <b>{liveIssues.filter(i => i.severity === "Medium").length}</b>
            <span>Medium priority</span>
          </div>
          <div className="approved-summary violet">
            <b>{liveIssues.filter(i => i.severity === "Low").length}</b>
            <span>Low priority</span>
          </div>
        </div>

        <div className="approved-primary-action">
          <div>
            <h2>Issue actions</h2>
            <p>Choose how to address your findings.</p>
            <div className="approved-quick-actions">
              <button onClick={() => changeView("Redesign")}>
                <span><Sparkles /></span>
                Generate solution
                <ChevronRight />
              </button>
              <button onClick={() => changeView("Visual editor")}>
                <span><Layers3 /></span>
                Open in editor
                <ChevronRight />
              </button>
            </div>
          </div>
          <div>
            <h2>Quick actions</h2>
            <p>Access common issue actions.</p>
            <div className="approved-quick-actions">
              <button onClick={() => changeView("Analysis")}>
                <span><ScanLine /></span>
                Run analysis
                <ChevronRight />
              </button>
              <button onClick={() => changeView("Reports")}>
                <span><FileBarChart /></span>
                View reports
                <ChevronRight />
              </button>
            </div>
          </div>
        </div>

        <div className="approved-dashboard-grid">
          <article className="approved-panel">
            <div className="approved-panel-title">
              <div>
                <span className="approved-eyebrow">Issue records</span>
                <h2>All issues</h2>
              </div>
            </div>
            {liveIssues.length > 0 ? (
              <div className="approved-issue-list">
                {liveIssues.map(issue => (
                  <div key={issue.id} className="approved-issue-item">
                    <div className="issue-severity">{issue.severity}</div>
                    <div className="issue-content">
                      <b>{issue.title}</b>
                      <small>{issue.tag}</small>
                    </div>
                    <em>{issue.impact}</em>
                  </div>
                ))}
              </div>
            ) : (
              <p className="team-empty-state">No matching live issue records. Complete a tool run or add an issue from evidence to populate this center.</p>
            )}
          </article>
          <article className="approved-panel">
            <div className="approved-panel-title">
              <div>
                <span className="approved-eyebrow">Actions</span>
                <h2>Next steps</h2>
              </div>
            </div>
            <div className="approved-quick-actions">
              <button onClick={() => changeView("Redesign")}>
                <span><Sparkles /></span>
                Generate solution
                <ChevronRight />
              </button>
              <button onClick={() => changeView("Visual editor")}>
                <span><Layers3 /></span>
                Open in editor
                <ChevronRight />
              </button>
            </div>
          </article>
        </div>
      </div>
    );
  }

  function Redesign() {
    return (
      <div className="approved-dashboard">
        <div className="approved-greeting">
          <div>
            <span className="approved-eyebrow">Create & ship</span>
            <h1>AI Redesign</h1>
            <p>Use AI to generate redesign suggestions for your storefront.</p>
          </div>
          <button className="approved-primary" onClick={() => { setToolIntent("ai-design-copilot"); setToolFlow("setup"); changeView("Tools Library"); }}>
            <Sparkles /> Start Redesign
          </button>
        </div>

        <div className="approved-summary-grid">
          <div className="approved-summary">
            <b>3</b>
            <span>Redesigns created</span>
          </div>
          <div className="approved-summary green">
            <b>1</b>
            <span>In progress</span>
          </div>
          <div className="approved-summary coral">
            <b>2</b>
            <span>Completed</span>
          </div>
          <div className="approved-summary violet">
            <b>5</b>
            <span>Suggestions</span>
          </div>
        </div>

        <div className="approved-primary-action">
          <div>
            <h2>Start new redesign</h2>
            <p>Use AI to analyze your storefront and generate design improvements.</p>
            <div className="approved-quick-actions">
              <button onClick={() => { setToolIntent("ai-design-copilot"); setToolFlow("setup"); changeView("Tools Library"); }}>
                <span><Sparkles /></span>
                AI Design Copilot
                <ChevronRight />
              </button>
            </div>
          </div>
          <div>
            <h2>Recent redesigns</h2>
            <p>Review and apply AI-generated design suggestions.</p>
            <div className="approved-quick-actions">
              <button onClick={() => changeView("Visual editor")}>
                <span><Layers3 /></span>
                Open editor
                <ChevronRight />
              </button>
              <button onClick={() => changeView("Versions")}>
                <span><Activity /></span>
                View versions
                <ChevronRight />
              </button>
            </div>
          </div>
        </div>

        <div className="approved-dashboard-grid">
          <article className="approved-panel">
            <div className="approved-panel-title">
              <div>
                <span className="approved-eyebrow">Active redesign</span>
                <h2>Product page redesign</h2>
              </div>
            </div>
            <p>Working on product page layout and styling improvements.</p>
          </article>
          <article className="approved-panel">
            <div className="approved-panel-title">
              <div>
                <span className="approved-eyebrow">Quick actions</span>
                <h2>Next steps</h2>
              </div>
            </div>
            <div className="approved-quick-actions">
              <button onClick={() => changeView("Visual editor")}>
                <span><Layers3 /></span>
                Open in editor
                <ChevronRight />
              </button>
              <button onClick={() => changeView("Preview & validate")}>
                <span><Monitor /></span>
                Preview changes
                <ChevronRight />
              </button>
            </div>
          </article>
        </div>
      </div>
    );
  }

  function Editor() {
    return (
      <div className="approved-dashboard">
        <div className="approved-greeting">
          <div>
            <span className="approved-eyebrow">Create & ship</span>
            <h1>Visual Editor</h1>
            <p>Edit your storefront design with visual tools.</p>
          </div>
          <button className="approved-primary" onClick={() => changeView("Preview & validate")}>
            <Monitor /> Preview Changes
          </button>
        </div>

        <div className="approved-summary-grid">
          <div className="approved-summary">
            <b>1</b>
            <span>Active draft</span>
          </div>
          <div className="approved-summary green">
            <b>3</b>
            <span>Saved versions</span>
          </div>
          <div className="approved-summary coral">
            <b>0</b>
            <span>Unsaved changes</span>
          </div>
          <div className="approved-summary violet">
            <b>7</b>
            <span>Layers</span>
          </div>
        </div>

        <div className="approved-primary-action">
          <div>
            <h2>Active draft</h2>
            <p>Working on product page layout and styling improvements.</p>
            <div className="approved-quick-actions">
              <button>
                <span><Activity /></span>
                View history
                <ChevronRight />
              </button>
              <button>
                <span><Save /></span>
                Save version
                <ChevronRight />
              </button>
            </div>
          </div>
          <div>
            <h2>Editor tools</h2>
            <p>Access visual editing tools and features.</p>
            <div className="approved-quick-actions">
              <button onClick={() => changeView("Redesign")}>
                <span><Sparkles /></span>
                AI Redesign
                <ChevronRight />
              </button>
              <button onClick={() => changeView("Versions")}>
                <span><Activity /></span>
                View versions
                <ChevronRight />
              </button>
            </div>
          </div>
        </div>

        <div className="approved-dashboard-grid">
          <article className="approved-panel">
            <div className="approved-panel-title">
              <div>
                <span className="approved-eyebrow">Layers</span>
                <h2>Product page</h2>
              </div>
            </div>
            <div className="approved-layer-list">
              {["Header", "Product media", "Product content", "Heading", "Price & purchase", "Trust row", "Description"].map(layer => (
                <button key={layer} className="approved-layer-item">
                  <i className="layer-node" />
                  {layer}
                </button>
              ))}
            </div>
          </article>
          <article className="approved-panel">
            <div className="approved-panel-title">
              <div>
                <span className="approved-eyebrow">Quick actions</span>
                <h2>Next steps</h2>
              </div>
            </div>
            <div className="approved-quick-actions">
              <button onClick={() => changeView("Preview & validate")}>
                <span><Monitor /></span>
                Preview changes
                <ChevronRight />
              </button>
              <button>
                <span><Check /></span>
                Publish
                <ChevronRight />
              </button>
            </div>
          </article>
        </div>
      </div>
    );
  }

  function ValidationRelease() {
    return (
      <div className="approved-dashboard">
        <div className="approved-greeting">
          <div>
            <span className="approved-eyebrow">Create & ship</span>
            <h1>Preview & Validate</h1>
            <p>Preview changes and validate before publishing.</p>
          </div>
          <button className="approved-primary">
            <Check /> Publish
          </button>
        </div>

        <div className="approved-summary-grid">
          <div className="approved-summary">
            <b>1</b>
            <span>Validation pending</span>
          </div>
          <div className="approved-summary green">
            <b>92</b>
            <span>Validation score</span>
          </div>
          <div className="approved-summary coral">
            <b>0</b>
            <span>Blockers</span>
          </div>
          <div className="approved-summary violet">
            <b>3</b>
            <span>Warnings</span>
          </div>
        </div>

        <div className="approved-primary-action">
          <div>
            <h2>Validation metrics</h2>
            <p>Review your validation scores before publishing.</p>
            <div className="approved-quick-actions">
              <button>
                <span><Monitor /></span>
                Performance: 95/100
                <ChevronRight />
              </button>
              <button className="green">
                <span><ShieldCheck /></span>
                Accessibility: 88/100
                <ChevronRight />
              </button>
              <button className="violet">
                <span><Search /></span>
                SEO: 92/100
                <ChevronRight />
              </button>
            </div>
          </div>
          <div>
            <h2>Publish actions</h2>
            <p>Ready to ship your changes.</p>
            <div className="approved-quick-actions">
              <button onClick={() => changeView("Visual editor")}>
                <span><Layers3 /></span>
                Open editor
                <ChevronRight />
              </button>
              <button>
                <span><Activity /></span>
                View versions
                <ChevronRight />
              </button>
            </div>
          </div>
        </div>

        <div className="approved-dashboard-grid">
          <article className="approved-panel">
            <div className="approved-panel-title">
              <div>
                <span className="approved-eyebrow">Validation status</span>
                <h2>Ready to publish</h2>
              </div>
            </div>
            <p>Your changes have passed validation and are ready to publish.</p>
          </article>
          <article className="approved-panel">
            <div className="approved-panel-title">
              <div>
                <span className="approved-eyebrow">Quick actions</span>
                <h2>Next steps</h2>
              </div>
            </div>
            <div className="approved-quick-actions">
              <button>
                <span><Monitor /></span>
                Preview changes
                <ChevronRight />
              </button>
              <button>
                <span><Check /></span>
                Publish now
                <ChevronRight />
              </button>
            </div>
          </article>
        </div>
      </div>
    );
  }

  function Versions() {
    return (
      <div className="approved-dashboard">
        <div className="approved-greeting">
          <div>
            <span className="approved-eyebrow">Create & ship</span>
            <h1>Versions</h1>
            <p>Manage draft versions and version history.</p>
          </div>
          <button className="approved-primary" onClick={() => changeView("Visual editor")}>
            <Activity /> Create Version
          </button>
        </div>

        <div className="approved-summary-grid">
          <div className="approved-summary">
            <b>3</b>
            <span>Saved versions</span>
          </div>
          <div className="approved-summary green">
            <b>1</b>
            <span>Baseline</span>
          </div>
          <div className="approved-summary coral">
            <b>2</b>
            <span>Working</span>
          </div>
          <div className="approved-summary violet">
            <b>0</b>
            <span>Published</span>
          </div>
        </div>

        <div className="approved-primary-action">
          <div>
            <h2>Create new version</h2>
            <p>Save your current work as a new version.</p>
            <div className="approved-quick-actions">
              <button onClick={() => changeView("Visual editor")}>
                <span><Activity /></span>
                Create version
                <ChevronRight />
              </button>
            </div>
          </div>
          <div>
            <h2>Version actions</h2>
            <p>Compare, restore, or publish versions.</p>
            <div className="approved-quick-actions">
              <button onClick={() => changeView("Visual editor")}>
                <span><Layers3 /></span>
                Open editor
                <ChevronRight />
              </button>
              <button onClick={() => changeView("Preview & validate")}>
                <span><Monitor /></span>
                Preview
                <ChevronRight />
              </button>
            </div>
          </div>
        </div>

        <div className="approved-dashboard-grid">
          <article className="approved-panel">
            <div className="approved-panel-title">
              <div>
                <span className="approved-eyebrow">Version history</span>
                <h2>All versions</h2>
              </div>
            </div>
            <div className="approved-version-list">
              <div className="approved-version-item baseline">
                <div className="version-info">
                  <b>Initial version</b>
                  <small>Baseline</small>
                </div>
                <em>2 days ago</em>
              </div>
              <div className="approved-version-item working">
                <div className="version-info">
                  <b>Product page redesign v2</b>
                  <small>Working</small>
                </div>
                <em>1 day ago</em>
              </div>
              <div className="approved-version-item working">
                <div className="version-info">
                  <b>Product page redesign v1</b>
                  <small>Working</small>
                </div>
                <em>1 day ago</em>
              </div>
            </div>
          </article>
          <article className="approved-panel">
            <div className="approved-panel-title">
              <div>
                <span className="approved-eyebrow">Quick actions</span>
                <h2>Next steps</h2>
              </div>
            </div>
            <div className="approved-quick-actions">
              <button onClick={() => changeView("Visual editor")}>
                <span><Layers3 /></span>
                Open in editor
                <ChevronRight />
              </button>
              <button onClick={() => changeView("Preview & validate")}>
                <span><Monitor /></span>
                Preview changes
                <ChevronRight />
              </button>
            </div>
          </article>
        </div>
      </div>
    );
  }

  function Reports() {
    const reports = workspaceDashboardQuery.data?.reports.records ?? [];

    return (
      <div className="approved-dashboard">
        <div className="approved-greeting">
          <div>
            <span className="approved-eyebrow">Intelligence</span>
            <h1>Reports</h1>
            <p>View and download analysis reports.</p>
          </div>
          <button className="approved-primary" onClick={() => { setToolFlow("setup"); changeView("Tools Library"); }}>
            <ScanLine /> Generate Report
          </button>
        </div>

        <div className="approved-summary-grid">
          <div className="approved-summary">
            <b>{reports.length}</b>
            <span>Total reports</span>
          </div>
          <div className="approved-summary green">
            <b>{reports.filter(r => r.createdAt && new Date(r.createdAt) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)).length}</b>
            <span>This week</span>
          </div>
          <div className="approved-summary coral">
            <b>{reports.filter(r => r.status === "completed").length}</b>
            <span>Completed</span>
          </div>
          <div className="approved-summary violet">
            <b>{reports.filter(r => r.status === "pending").length}</b>
            <span>Pending</span>
          </div>
        </div>

        <div className="approved-primary-action">
          <div>
            <h2>Generate new report</h2>
            <p>Run analysis tools to create new reports.</p>
            <div className="approved-quick-actions">
              <button onClick={() => { setToolIntent("storefront-analyzer"); setToolFlow("setup"); changeView("Tools Library"); }}>
                <span><ScanLine /></span>
                Storefront Analyzer
                <ChevronRight />
              </button>
              <button className="green" onClick={() => { setToolIntent("accessibility-analyzer"); setToolFlow("setup"); changeView("Tools Library"); }}>
                <span><ShieldCheck /></span>
                Accessibility Check
                <ChevronRight />
              </button>
              <button className="violet" onClick={() => { setToolIntent("seo-analyzer"); setToolFlow("setup"); changeView("Tools Library"); }}>
                <span><Search /></span>
                SEO Analyzer
                <ChevronRight />
              </button>
            </div>
          </div>
          <div>
            <h2>Quick actions</h2>
            <p>Access common report actions.</p>
            <div className="approved-quick-actions">
              <button onClick={() => changeView("Analysis")}>
                <span><BarChart3 /></span>
                View Analysis
                <ChevronRight />
              </button>
              <button onClick={() => changeView("Issues")}>
                <span><ShieldCheck /></span>
                View Issues
                <ChevronRight />
              </button>
            </div>
          </div>
        </div>

        <div className="approved-dashboard-grid">
          <article className="approved-panel">
            <div className="approved-panel-title">
              <div>
                <span className="approved-eyebrow">Recent reports</span>
                <h2>All reports</h2>
              </div>
            </div>
            {reports.length > 0 ? (
              <div className="approved-report-list">
                {reports.map(report => (
                  <div key={report.id} className="approved-report-item">
                    <div className="report-info">
                      <b>{report.title || "Analysis Report"}</b>
                      <small>{report.toolId || "Unknown tool"}</small>
                    </div>
                    <em>{report.status || "Completed"}</em>
                  </div>
                ))}
              </div>
            ) : (
              <p className="team-empty-state">No reports yet. Run an analysis to generate your first report.</p>
            )}
          </article>
          <article className="approved-panel">
            <div className="approved-panel-title">
              <div>
                <span className="approved-eyebrow">Report types</span>
                <h2>Available reports</h2>
              </div>
            </div>
            <div className="approved-quick-actions">
              <button onClick={() => { setToolIntent("storefront-analyzer"); setToolFlow("setup"); changeView("Tools Library"); }}>
                <span><ScanLine /></span>
                Storefront Analysis
                <ChevronRight />
              </button>
              <button onClick={() => { setToolIntent("accessibility-analyzer"); setToolFlow("setup"); changeView("Tools Library"); }}>
                <span><ShieldCheck /></span>
                WCAG Compliance
                <ChevronRight />
              </button>
              <button onClick={() => { setToolIntent("seo-analyzer"); setToolFlow("setup"); changeView("Tools Library"); }}>
                <span><Search /></span>
                SEO Audit
                <ChevronRight />
              </button>
            </div>
          </article>
        </div>
      </div>
    );
  }

  function MoreFlow() {
    return (
      <div className="approved-dashboard">
        <div className="approved-greeting">
          <div>
            <span className="approved-eyebrow">Workspace settings</span>
            <h1>More</h1>
            <p>Manage your account, team, billing, and workspace settings.</p>
          </div>
        </div>

        <div className="approved-summary-grid">
          <div className="approved-summary">
            <b>1</b>
            <span>Team members</span>
          </div>
          <div className="approved-summary green">
            <b>Pro</b>
            <span>Plan</span>
          </div>
          <div className="approved-summary coral">
            <b>0</b>
            <span>Pending invites</span>
          </div>
          <div className="approved-summary violet">
            <b>Active</b>
            <span>Status</span>
          </div>
        </div>

        <div className="approved-primary-action">
          <div>
            <h2>Account settings</h2>
            <p>Manage your profile and account settings.</p>
            <div className="approved-quick-actions">
              <button>
                <span><Settings /></span>
                Edit profile
                <ChevronRight />
              </button>
              <button>
                <span><Bell /></span>
                Notifications
                <ChevronRight />
              </button>
            </div>
          </div>
          <div>
            <h2>Team settings</h2>
            <p>Manage team members and permissions.</p>
            <div className="approved-quick-actions">
              <button>
                <span><Users /></span>
                Team members
                <ChevronRight />
              </button>
              <button>
                <span><ShieldCheck /></span>
                Permissions
                <ChevronRight />
              </button>
            </div>
          </div>
        </div>

        <div className="approved-dashboard-grid">
          <article className="approved-panel">
            <div className="approved-panel-title">
              <div>
                <span className="approved-eyebrow">Billing</span>
                <h2>Subscription</h2>
              </div>
            </div>
            <p>Manage your subscription and payment methods.</p>
            <div className="approved-quick-actions">
              <button>
                <span><CreditCard /></span>
                Manage billing
                <ChevronRight />
              </button>
            </div>
          </article>
          <article className="approved-panel">
            <div className="approved-panel-title">
              <div>
                <span className="approved-eyebrow">Support</span>
                <h2>Help & support</h2>
              </div>
            </div>
            <p>Get help, report problems, or share feedback.</p>
            <div className="approved-quick-actions">
              <button>
                <span><CircleHelp /></span>
                Contact support
                <ChevronRight />
              </button>
            </div>
          </article>
        </div>

        <div className="approved-dashboard-grid">
          <article className="approved-panel danger-zone">
            <div className="approved-panel-title">
              <div>
                <span className="approved-eyebrow">Danger zone</span>
                <h2>Account actions</h2>
              </div>
            </div>
            <button className="approved-secondary" onClick={finishAuthenticatedLogout}>
              Sign Out
            </button>
          </article>
        </div>
      </div>
    );
  }

  function Placeholder({ title, copy }: { title: string; copy: string }) {
    return (
      <div className="approved-dashboard">
        <div className="approved-greeting">
          <div>
            <span className="approved-eyebrow">Workspace</span>
            <h1>{title}</h1>
            <p>{copy}</p>
          </div>
        </div>
      </div>
    );
  }
}
