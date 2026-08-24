import { Activity, ArrowRight, BarChart3, Bell, Check, ChevronRight, CircleHelp, FileBarChart, LayoutDashboard, Layers3, Link2, Monitor, MoreHorizontal, Play, Plus, ScanLine, Search, Settings, ShieldCheck, Sparkles, Store, Wand2 } from "lucide-react";
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

    return (
      <div className="approved-dashboard">
        <div className="approved-greeting">
          <div>
            <span className="approved-eyebrow">Store registry</span>
            <h1>Your Stores</h1>
            <p>Add a public storefront URL to begin analysis, or start a supported connection when its server-side authorization is configured.</p>
          </div>
          <button className="approved-primary" onClick={() => navigateStores("add")}>
            <Plus /> Add Store
          </button>
        </div>
        <div className="approved-dashboard-grid">
          <article className="approved-panel approved-stores-panel">
            <div className="approved-panel-title">
              <div>
                <span className="approved-eyebrow">Connected storefronts</span>
                <h2>Your Stores</h2>
              </div>
              <button className="approved-secondary" onClick={() => navigateStores("add")}>
                <Plus /> Add Store
              </button>
            </div>
            {workspaceStoresQuery.data?.map(store => (
              <div key={store.id} className="approved-store-primary" style={{ borderBottom: "1px solid #303641", paddingBottom: "15px", marginBottom: "15px" }}>
                <div className="approved-store-title">
                  <div className="approved-store-mark">{store.name.slice(0, 2).toUpperCase()}</div>
                  <div>
                    <b>{store.name}</b>
                    <small>{store.platform} · <em>{store.status}</em></small>
                  </div>
                  <span className="approved-status">{store.status}</span>
                </div>
                <div className="approved-store-actions">
                  <button className="approved-secondary" onClick={() => { setToolFlow("setup"); changeView("Tools Library"); }}>Analyze</button>
                  <button className="approved-primary" onClick={() => openStore(String(store.id))}>Open workspace</button>
                </div>
              </div>
            ))}
          </article>
        </div>
      </div>
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
    return <Placeholder title="Analysis" copy="Analyze your storefront for design, UX, performance, and accessibility issues." />;
  }

  function Issues() {
    return <Placeholder title="Issues" copy="Review and manage issues found during analysis." />;
  }

  function Redesign() {
    return <Placeholder title="AI Redesign" copy="Use AI to generate redesign suggestions for your storefront." />;
  }

  function Editor() {
    return <Placeholder title="Visual Editor" copy="Edit your storefront design with visual tools." />;
  }

  function ValidationRelease() {
    return <Placeholder title="Preview & Validate" copy="Preview changes and validate before publishing." />;
  }

  function Versions() {
    return <Placeholder title="Versions" copy="Manage draft versions and version history." />;
  }

  function Reports() {
    return <Placeholder title="Reports" copy="View and download analysis reports." />;
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
        <div className="approved-dashboard-grid">
          <article className="approved-panel">
            <div className="approved-panel-title">
              <h2>Account</h2>
            </div>
            <p>Manage your personal details, email, and security.</p>
            <button className="approved-secondary">Edit Profile</button>
          </article>
          <article className="approved-panel">
            <div className="approved-panel-title">
              <h2>Team</h2>
            </div>
            <p>Manage workspace members and permissions.</p>
            <button className="approved-secondary">Manage Team</button>
          </article>
          <article className="approved-panel">
            <div className="approved-panel-title">
              <h2>Billing</h2>
            </div>
            <p>View your subscription and usage.</p>
            <button className="approved-secondary">View Billing</button>
          </article>
        </div>
        <div className="approved-dashboard-grid">
          <article className="approved-panel">
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
