import {
  Activity,
  AlertCircle,
  ArrowRight,
  BarChart3,
  Bell,
  Check,
  CheckCircle2,
  ChevronRight,
  CircleHelp,
  ClipboardCheck,
  CloudDownload,
  Code2,
  Copy,
  Download,
  Eye,
  FileBarChart,
  Filter,
  History,
  Layers3,
  LayoutDashboard,
  Link2,
  Menu,
  Monitor,
  MoreHorizontal,
  MoveRight,
  Pencil,
  Play,
  Plus,
  RefreshCw,
  Search,
  Send,
  Settings,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Store,
  Tablet,
  Tag,
  Trash2,
  Upload,
  Wand2,
  X,
  type LucideIcon,
} from "lucide-react";
import { useMemo, useState, type CSSProperties } from "react";
import { Route, Router as WouterRouter, Switch, useLocation } from "wouter";
import { toolCatalog, toolCategories, type ToolDefinition } from "@/lib/toolCatalog";

type PageKey = "overview" | "stores" | "analysis" | "issues" | "reports" | "tools" | "redesign" | "editor" | "validate" | "versions" | "more";
type Severity = "Critical" | "High" | "Medium" | "Low";
type IssueStatus = "Open" | "In progress" | "Resolved";
type StoreRecord = { id: string; name: string; domain: string; platform: string; status: "Connected" | "Needs attention" | "Disconnected"; health: number; lastAnalyzed: string; };
type IssueRecord = { id: string; title: string; severity: Severity; category: string; surface: string; status: IssueStatus; detail: string; };
type ReportRecord = { id: string; name: string; store: string; score: number; issueCount: number; date: string; type: string; };
type VersionRecord = { id: string; label: string; createdBy: "You" | "AI" | "System"; date: string; state: "Current" | "Draft" | "Archived"; score: number; };
type ToastRecord = { id: number; title: string; message?: string; };

const initialStores: StoreRecord[] = [
  { id: "northstar", name: "Northstar Supply", domain: "northstarsupply.co", platform: "Shopify", status: "Connected", health: 82, lastAnalyzed: "Today, 09:42" },
  { id: "atelier", name: "Atelier Forma", domain: "atelierforma.com", platform: "Shopify", status: "Connected", health: 74, lastAnalyzed: "Yesterday, 16:08" },
  { id: "kindred", name: "Kindred Objects", domain: "kindredobjects.com", platform: "WooCommerce", status: "Needs attention", health: 61, lastAnalyzed: "12 Jun 2024" },
];
const initialIssues: IssueRecord[] = [
  { id: "issue-1", title: "Primary purchase action is below the first scroll", severity: "Critical", category: "Conversion", surface: "Product detail / Buy button", status: "Open", detail: "On mobile, the product story and variant controls push the main purchase action below 820px. Move the action closer to price and preserve a sticky affordance for long pages." },
  { id: "issue-2", title: "Seven product images are missing useful alt text", severity: "High", category: "Accessibility", surface: "Product gallery", status: "Open", detail: "Alt attributes are present but describe the filename rather than the product. Use concise, descriptive context that distinguishes each view." },
  { id: "issue-3", title: "Collection filters are difficult to discover", severity: "High", category: "UX", surface: "Collection toolbar", status: "In progress", detail: "The filter trigger has low contrast and is visually separated from sorting. Group both controls near the result count and preserve the selection when navigating." },
  { id: "issue-4", title: "Meta description is longer than the recommended range", severity: "Medium", category: "SEO", surface: "Homepage head", status: "Open", detail: "The homepage description truncates in search previews. Tighten the copy around the product promise and preserve the strongest differentiator in the first 145 characters." },
  { id: "issue-5", title: "Trust proof arrives after the final CTA", severity: "Medium", category: "Conversion", surface: "Product detail / Reviews", status: "Open", detail: "Reviews, returns, and delivery reassurance appear late in the page. Bring a compact trust row directly below the purchase controls." },
  { id: "issue-6", title: "Heading order skips from H1 to H3", severity: "Low", category: "Structure", surface: "About page", status: "Resolved", detail: "The content outline now follows a predictable H1, H2, H3 hierarchy." },
];
const initialReports: ReportRecord[] = [
  { id: "report-1", name: "Northstar full storefront review", store: "Northstar Supply", score: 82, issueCount: 14, date: "18 Jun 2024", type: "Store health" },
  { id: "report-2", name: "Northstar mobile conversion pass", store: "Northstar Supply", score: 76, issueCount: 6, date: "17 Jun 2024", type: "Focused analysis" },
  { id: "report-3", name: "Atelier accessibility baseline", store: "Atelier Forma", score: 74, issueCount: 9, date: "16 Jun 2024", type: "Accessibility" },
  { id: "report-4", name: "Kindred collection structure", store: "Kindred Objects", score: 61, issueCount: 11, date: "12 Jun 2024", type: "UX review" },
];
const initialVersions: VersionRecord[] = [
  { id: "v-4", label: "Mobile purchase pass", createdBy: "You", date: "Today, 10:14", state: "Current", score: 88 },
  { id: "v-3", label: "AI proposal · compact product story", createdBy: "AI", date: "Today, 09:58", state: "Draft", score: 85 },
  { id: "v-2", label: "Baseline capture", createdBy: "System", date: "17 Jun 2024", state: "Archived", score: 76 },
];
const initialActivity = [
  ["Storefront analysis completed", "Northstar Supply · 18 minutes ago"],
  ["AI proposal created", "Product detail page · 42 minutes ago"],
  ["Issue marked in progress", "Collection filters · 1 hour ago"],
  ["Version saved", "Mobile purchase pass · 2 hours ago"],
];
const pageMeta: Record<PageKey, { label: string; crumb: string }> = {
  overview: { label: "Overview", crumb: "Workspace / Signal desk" },
  stores: { label: "Stores", crumb: "Workspace / Registry" },
  analysis: { label: "Analysis", crumb: "Intelligence / Runs" },
  issues: { label: "Issues", crumb: "Intelligence / Priorities" },
  reports: { label: "Reports", crumb: "Intelligence / Evidence" },
  tools: { label: "Tools", crumb: "Create & ship / Library" },
  redesign: { label: "AI Redesign", crumb: "Create & ship / Proposals" },
  editor: { label: "Design Studio", crumb: "Create & ship / Working draft" },
  validate: { label: "Validate", crumb: "Create & ship / Release checks" },
  versions: { label: "Versions", crumb: "Create & ship / History" },
  more: { label: "More", crumb: "Workspace / Controls" },
};
const navGroups: Array<{ label: string; items: Array<[string, PageKey, LucideIcon]> }> = [
  { label: "Workspace", items: [["Overview", "overview", LayoutDashboard], ["Stores", "stores", Store]] },
  { label: "Intelligence", items: [["Analysis", "analysis", BarChart3], ["Issues", "issues", ShieldCheck], ["Reports", "reports", FileBarChart]] },
  { label: "Create & ship", items: [["Tools", "tools", Wand2], ["AI Redesign", "redesign", Sparkles], ["Design Studio", "editor", Layers3], ["Validate", "validate", Monitor], ["Versions", "versions", History]] },
  { label: "Workspace settings", items: [["More", "more", MoreHorizontal]] },
] as const;
const editorLayers = ["Header", "Product media", "Product details", "Title", "Price", "Buy button", "Shipping details"];
const deviceOptions: Array<[string, LucideIcon]> = [["Desktop", Monitor], ["Tablet", Tablet], ["Mobile", Smartphone]];
const mobileNavItems: Array<[string, PageKey, LucideIcon]> = [["Home", "overview", LayoutDashboard], ["Stores", "stores", Store], ["Analyze", "analysis", BarChart3], ["Studio", "editor", Layers3], ["More", "more", MoreHorizontal]];

function pageFromPath(pathname: string): PageKey {
  const segment = pathname.split("/").filter(Boolean)[1] as PageKey | undefined;
  return segment && segment in pageMeta ? segment : "overview";
}
function initials(name: string) { return name.split(" ").map((part) => part[0]).join("").slice(0, 2).toUpperCase(); }
function DashboardApp() {
  const [location, setLocation] = useLocation();
  const page = pageFromPath(location);
  const [stores, setStores] = useState(initialStores);
  const [issues, setIssues] = useState(initialIssues);
  const [reports, setReports] = useState(initialReports);
  const [versions, setVersions] = useState(initialVersions);
  const [activity, setActivity] = useState(initialActivity);
  const [activeStoreId, setActiveStoreId] = useState("northstar");
  const [globalSearch, setGlobalSearch] = useState("");
  const [modal, setModal] = useState<"add-store" | "connect" | "notifications" | "run-tool" | null>(null);
  const [toastItems, setToastItems] = useState<ToastRecord[]>([]);
  const [mobileMenu, setMobileMenu] = useState(false);
  const [selectedIssue, setSelectedIssue] = useState<IssueRecord | null>(null);
  const [selectedReport, setSelectedReport] = useState<ReportRecord | null>(null);
  const [selectedTool, setSelectedTool] = useState<ToolDefinition>(toolCatalog[0]);
  const [selectedStoreDetail, setSelectedStoreDetail] = useState<string | null>(null);
  const [storeSettingsOpen, setStoreSettingsOpen] = useState(false);
  const [analysisRunning, setAnalysisRunning] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<{ score: number; type: string; store: string } | null>(null);
  const [toolRun, setToolRun] = useState<"idle" | "processing" | "complete">("idle");
  const [redesignState, setRedesignState] = useState<"idle" | "processing" | "proposal" | "applied" | "dismissed">("idle");
  const [redesignSource, setRedesignSource] = useState("Connected store");
  const [editorElement, setEditorElement] = useState("Buy button");
  const [editorDevice, setEditorDevice] = useState("Mobile");
  const [inspectorTab, setInspectorTab] = useState<"edit" | "ai" | "history">("edit");
  const [editorDirty, setEditorDirty] = useState(true);
  const [proposalApplied, setProposalApplied] = useState(false);
  const [aiInput, setAiInput] = useState("");
  const [aiMessages, setAiMessages] = useState([{ role: "assistant", text: "I found a conversion opportunity on the Buy button. Ask me to tighten hierarchy, change the treatment, or make it more visible on mobile." }]);
  const [validationRunning, setValidationRunning] = useState(false);
  const [validationReady, setValidationReady] = useState(false);
  const [validationChecks, setValidationChecks] = useState([
    ["Visual regression", "No unexpected shifts across 3 viewports", "pass"],
    ["Responsive behavior", "Mobile CTA remains reachable", "pass"],
    ["Accessibility", "Contrast and interactive labels", "warn"],
    ["SEO signals", "Headings and metadata preserved", "pass"],
  ]);
  const [settings, setSettings] = useState({ email: true, weekly: false, autoSave: true });
  const [profileName, setProfileName] = useState("Maya Chen");

  const activeStore = stores.find((store) => store.id === activeStoreId) ?? stores[0];
  const pushToast = (title: string, message?: string) => {
    const id = Date.now();
    setToastItems((current) => [...current.slice(-2), { id, title, message }]);
    window.setTimeout(() => setToastItems((current) => current.filter((item) => item.id !== id)), 3600);
  };
  const navigate = (next: PageKey) => {
    setMobileMenu(false);
    setLocation(next === "overview" ? "/dashboard" : `/dashboard/${next}`);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  const updateActivity = (event: string, destination: string) => setActivity((current) => [[event, `${destination} · just now`], ...current].slice(0, 6));

  function addStore(name: string, url: string) {
    try {
      const parsed = new URL(url.trim());
      if (!/^https?:$/.test(parsed.protocol)) throw new Error();
      if (!name.trim()) throw new Error();
      const newStore: StoreRecord = { id: `store-${Date.now()}`, name: name.trim(), domain: parsed.hostname.replace(/^www\./, ""), platform: "Public URL", status: "Connected", health: 0, lastAnalyzed: "Not analyzed" };
      setStores((current) => [...current, newStore]);
      setActiveStoreId(newStore.id);
      setSelectedStoreDetail(newStore.id);
      setModal(null);
      updateActivity("Store added to registry", newStore.name);
      pushToast("Store added", `${newStore.domain} is ready for its first analysis.`);
      navigate("stores");
    } catch {
      pushToast("Check the store details", "Use a name and a complete URL beginning with https://.");
    }
  }
  function runAnalysis(type: string, source: string) {
    if (source === "url" && !globalSearch.trim()) {
      pushToast("A storefront URL is needed", "Enter a URL in the source field before running this analysis.");
      return;
    }
    setAnalysisRunning(true);
    setAnalysisResult(null);
    window.setTimeout(() => {
      const score = type === "Accessibility" ? 88 : type === "Mobile UX" ? 79 : 84;
      setAnalysisRunning(false);
      setAnalysisResult({ score, type, store: activeStore?.name ?? "Selected store" });
      if (activeStore) setStores((current) => current.map((store) => store.id === activeStore.id ? { ...store, health: Math.max(store.health, score), lastAnalyzed: "Just now" } : store));
      updateActivity(`${type} analysis completed`, activeStore?.name ?? "Store");
      pushToast("Analysis ready", `${type} findings are ready to review.`);
    }, 1250);
  }
  function runSelectedTool(source: string) {
    if (!source) {
      pushToast("Choose a source", "Select where this tool should take its evidence from.");
      return;
    }
    setModal(null);
    setToolRun("processing");
    window.setTimeout(() => {
      setToolRun("complete");
      updateActivity(`${selectedTool.name} completed`, activeStore?.name ?? "Workspace");
      pushToast("Tool run complete", `${selectedTool.name} returned reviewable evidence.`);
    }, 1200);
  }
  function saveVersion() {
    const version: VersionRecord = { id: `v-${Date.now()}`, label: proposalApplied ? "Applied AI direction" : `${editorDevice} editor pass`, createdBy: proposalApplied ? "AI" : "You", date: "Just now", state: "Current", score: proposalApplied ? 90 : 88 };
    setVersions((current) => [version, ...current.map((item) => ({ ...item, state: item.state === "Current" ? "Archived" as const : item.state }))]);
    setEditorDirty(false);
    updateActivity("Version saved", version.label);
    pushToast("Version saved", "The draft is now available in Versions.");
  }
  function runValidation() {
    setValidationRunning(true);
    window.setTimeout(() => {
      setValidationRunning(false);
      setValidationReady(true);
      setValidationChecks((checks) => checks.map(([title, detail]) => [title, detail, title === "Accessibility" ? "warn" : "pass"]));
      updateActivity("Release validation completed", activeStore?.name ?? "Workspace");
      pushToast("Validation complete", "Three checks passed and one warning needs review.");
    }, 1100);
  }
  function exportReport(report: ReportRecord) {
    const blob = new Blob([`FerixRG report\n${report.name}\nScore: ${report.score}\nIssues: ${report.issueCount}\nDate: ${report.date}`], { type: "text/plain" });
    const href = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = href;
    anchor.download = `${report.name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}.txt`;
    anchor.click();
    URL.revokeObjectURL(href);
    pushToast("Report exported", `${report.name} was downloaded as a review record.`);
  }

  function Sidebar() {
    return <aside className="sidebar">
      <button className="brand" onClick={() => navigate("overview")} aria-label="Go to FerixRG overview"><span className="brand-word">FERIX<span>RG</span></span></button>
      <p className="brand-subtitle">Storefront intelligence</p>
      <div className="side-scroll">
        {navGroups.map((group) => <section className="nav-group" key={group.label}>
          <span className="nav-label">{group.label}</span>
          {group.items.map(([label, key, Icon]) => <button className={`nav-item ${page === key ? "active" : ""}`} key={key} onClick={() => navigate(key)} data-testid={`nav-${key}`}><Icon /><span>{label}</span></button>)}
        </section>)}
      </div>
      <div className="side-store">
        {activeStore ? <><div className="store-mini"><div className="store-mark">{initials(activeStore.name)}</div><div><strong>{activeStore.name}</strong><span>{activeStore.platform} · {activeStore.status}</span></div></div><button onClick={() => { setSelectedStoreDetail(activeStore.id); navigate("stores"); }}>Open store workspace <ArrowRight size={13} /></button></> : <button onClick={() => setModal("add-store")}><Plus size={14} /> Add your first store</button>}
      </div>
    </aside>;
  }
  function Topbar() {
    const meta = pageMeta[page];
    return <header className="topbar">
      <div className="context"><span className="context-crumb">{meta.crumb}</span><strong className="context-title">{meta.label}</strong></div>
      <div className="top-actions">
        <label className="search-box"><Search size={15} /><input value={globalSearch} onChange={(event) => setGlobalSearch(event.target.value)} placeholder={page === "tools" ? "Search tools…" : "Search workspace…"} aria-label="Search workspace" data-testid="input-global-search" /></label>
        <button className="icon-btn" onClick={() => pushToast("Keyboard shortcut", "Search is always available in the top bar.")} aria-label="Help"><CircleHelp size={17} /></button>
        <button className="icon-btn has-dot" onClick={() => setModal("notifications")} aria-label="Open notifications"><Bell size={17} /></button>
        <button className="avatar" onClick={() => navigate("more")} aria-label="Open profile">{initials(profileName)}</button>
        <button className="icon-btn menu-trigger" onClick={() => setMobileMenu((value) => !value)} aria-label="Toggle navigation"><Menu size={17} /></button>
      </div>
    </header>;
  }
  function Overview() {
    const openIssues = issues.filter((issue) => issue.status !== "Resolved").length;
    const average = stores.length ? Math.round(stores.reduce((sum, store) => sum + store.health, 0) / stores.length) : 0;
    return <div className="page">
      <div className="page-header"><div><span className="eyebrow">Today · 18 June</span><h1>Make the next move.</h1><p>See your store at a glance.</p></div><div className="header-actions"><button className="btn" onClick={() => navigate("stores")}><Plus size={15} /> Add store</button><button className="btn primary" onClick={() => navigate("analysis")}><Play size={15} /> Analyze</button></div></div>
      <div className="grid metric-grid">
        <div className="metric" style={{ "--metric-color": "var(--lime)" } as CSSProperties}><div className="metric-top"><span>Stores</span><Store size={15} /></div><div className="metric-value">{stores.filter((store) => store.status === "Connected").length}</div><div className="metric-note good">Connected</div></div>
        <div className="metric" style={{ "--metric-color": "var(--cyan)" } as CSSProperties}><div className="metric-top"><span>Health</span><Activity size={15} /></div><div className="metric-value">{average}<small style={{ fontSize: 13, color: "var(--text-dim)" }}>/100</small></div><div className="metric-note good">+4.8 this week</div></div>
        <div className="metric" style={{ "--metric-color": "var(--red)" } as CSSProperties}><div className="metric-top"><span>Issues</span><AlertCircle size={15} /></div><div className="metric-value">{openIssues}</div><div className="metric-note warn">Need review</div></div>
        <div className="metric" style={{ "--metric-color": "var(--purple)" } as CSSProperties}><div className="metric-top"><span>Reports</span><FileBarChart size={15} /></div><div className="metric-value">{reports.length}</div><div className="metric-note">Ready</div></div>
      </div>
      <div className="grid two-col">
        <section className="panel"><div className="panel-heading"><div><span className="eyebrow">Store health</span><h2>Northstar Supply</h2><p>Latest score by area.</p></div><button className="btn ghost" onClick={() => navigate("reports")}>Reports <ArrowRight size={14} /></button></div>
          <div className="score-layout"><div className="score-ring"><div className="score-ring-inner"><strong>{average}</strong><span>health</span><small>↑ 4.8 pts</small></div></div><div className="bars">{[["Design", 88, "var(--purple)"], ["UX", 79, "var(--cyan)"], ["Mobile", 76, "var(--orange)"], ["Access", 91, "var(--lime)"], ["SEO", 84, "var(--cyan)"], ["Sales", 73, "var(--red)"]].map(([label, score, color]) => <div className="bar-row" key={String(label)}><span>{label}</span><div className="bar"><i style={{ width: `${Number(score)}%`, "--bar-color": color } as CSSProperties} /></div><b>{score}</b></div>)}</div></div>
        </section>
        <section className="panel"><div className="panel-heading"><div><span className="eyebrow">Quick actions</span><h2>Move forward</h2></div></div><div className="action-grid">
          <button className="action-card" onClick={() => navigate("analysis")}><ScanIcon /><span>Analyze store<small>Find quick wins</small></span></button>
          <button className="action-card" onClick={() => navigate("redesign")}><Sparkles /><span>Try a redesign<small>Start a new draft</small></span></button>
          <button className="action-card" onClick={() => navigate("issues")}><ShieldCheck /><span>Review issues<small>{openIssues} open</small></span></button>
          <button className="action-card" onClick={() => navigate("editor")}><Layers3 /><span>Open studio<small>Continue editing</small></span></button>
        </div></section>
      </div>
      <div className="grid two-col" style={{ marginTop: 16 }}>
        <section className="panel"><div className="panel-heading"><div><span className="eyebrow">Stores</span><h2>Your storefronts</h2></div><button className="btn ghost" onClick={() => navigate("stores")}>All <ArrowRight size={14} /></button></div><div className="grid" style={{ gap: 9 }}>{stores.map((store) => <button className="store-card action-card" key={store.id} onClick={() => { setActiveStoreId(store.id); setSelectedStoreDetail(store.id); navigate("stores"); }}><div className="store-mark">{initials(store.name)}</div><div className="store-info"><strong>{store.name}</strong><span>{store.platform}</span></div><div className="health-number">{store.health || "—"}<small>/100</small></div><ChevronRight size={15} /></button>)}</div></section>
        <section className="panel"><div className="panel-heading"><div><span className="eyebrow">Activity</span><h2>Recent changes</h2></div><button className="btn ghost" onClick={() => pushToast("Up to date")}>Refresh <RefreshCw size={13} /></button></div><div className="activity-list">{activity.slice(0, 3).map(([event, detail], index) => <div className="activity-item" key={`${event}-${index}`}><i className="activity-dot" /><div><strong>{event.replace("Storefront analysis completed", "Analysis complete").replace("AI proposal created", "Redesign ready").replace("Issue marked in progress", "Issue updated")}</strong><span>{detail}</span></div><ChevronRight size={14} color="var(--text-dim)" /></div>)}</div></section>
      </div>
    </div>;
  }
  function Stores() {
    const detail = stores.find((store) => store.id === (selectedStoreDetail ?? activeStoreId));
    const query = globalSearch.trim().toLowerCase();
    const shownStores = stores.filter((store) => `${store.name} ${store.domain} ${store.platform}`.toLowerCase().includes(query));
    return <div className="page"><div className="page-header"><div><span className="eyebrow">Store registry</span><h1>Stores under observation.</h1><p>Keep storefront sources, connection health, and the last known decision signal in one place.</p></div><button className="btn primary" onClick={() => setModal("add-store")}><Plus size={15} /> Add store</button></div>
      <div className="grid two-col"><section className="panel"><div className="panel-heading"><div><h2>Connected sources</h2><p>{stores.length} storefronts in this workspace</p></div><button className="btn" onClick={() => setModal("connect")}><Link2 size={14} /> Connect</button></div><div className="table-wrap"><table className="data-table"><thead><tr><th>Store</th><th>Platform</th><th>Status</th><th>Health</th><th>Last analyzed</th><th /></tr></thead><tbody>{shownStores.map((store) => <tr key={store.id}><td><div className="table-store"><div className="store-mark">{initials(store.name)}</div><span>{store.name}<small style={{ display: "block", color: "var(--text-dim)", fontWeight: 400, fontSize: 10 }}>{store.domain}</small></span></div></td><td>{store.platform}</td><td><span className={`status ${store.status === "Connected" ? "connected" : "attention"}`}>{store.status}</span></td><td><b style={{ color: store.health > 75 ? "var(--lime)" : "var(--orange)" }}>{store.health || "—"}</b></td><td>{store.lastAnalyzed}</td><td><button className="icon-btn" onClick={() => { setActiveStoreId(store.id); setSelectedStoreDetail(store.id); }} aria-label={`Open ${store.name}`}><ArrowRight size={14} /></button></td></tr>)}</tbody></table></div>{shownStores.length === 0 && <div className="empty"><Search /><h3>No stores match that search</h3><p>Try a domain, platform, or store name.</p></div>}</section>
        <section className="panel">{detail ? <><div className="panel-heading"><div><span className="eyebrow">Store workspace</span><h2>{detail.name}</h2><p>{detail.domain}</p></div><button className="icon-btn" onClick={() => setSelectedStoreDetail(null)} aria-label="Close store detail"><X size={15} /></button></div><div className="store-card" style={{ marginBottom: 21 }}><div className="store-mark">{initials(detail.name)}</div><div className="store-info"><strong>{detail.platform} source</strong><span>Added to workspace · evidence boundary active</span></div><span className={`status ${detail.status === "Connected" ? "connected" : "attention"}`}>{detail.status}</span></div><div className="detail-list"><div className="detail-row"><span>Health score</span><strong>{detail.health || "Not analyzed"}{detail.health ? "/100" : ""}</strong></div><div className="detail-row"><span>Last analysis</span><strong>{detail.lastAnalyzed}</strong></div><div className="detail-row"><span>Source boundary</span><strong>Visible storefront only</strong></div><div className="detail-row"><span>Workspace role</span><strong>Editor</strong></div></div><div className="header-actions" style={{ marginTop: 18 }}><button className="btn primary" onClick={() => navigate("analysis")}><Play size={14} /> Analyze store</button><button className="btn" onClick={() => setStoreSettingsOpen((value) => !value)}><Settings size={14} /> Connection settings</button></div>{storeSettingsOpen && <div className="notice" style={{ marginTop: 15 }}><strong>Connection controls</strong><br />FerixRG reads approved storefront evidence. Reconnect, rename, or remove this source without changing the live store.<div className="header-actions" style={{ marginTop: 10 }}><button className="btn" onClick={() => pushToast("Connection checked", `${detail.name} is responding normally.`)}><RefreshCw size={13} /> Test connection</button><button className="btn danger" onClick={() => { setStores((current) => current.filter((store) => store.id !== detail.id)); setSelectedStoreDetail(null); pushToast("Store removed", "The source was removed from this demo workspace."); }}>Remove source</button></div></div>}</> : <div className="empty"><Store /><h3>Select a store</h3><p>Open a registry row to inspect connection details and run evidence.</p></div>}</section></div>
    </div>;
  }
  function Analysis() {
    const [type, setType] = useState("Store health");
    const [source, setSource] = useState("store");
    return <div className="page"><div className="page-header"><div><span className="eyebrow">Evidence runner</span><h1>Analyze what customers see.</h1><p>Choose a bounded source, run a focused check, then move directly into issues, reports, or a reviewable fix.</p></div><button className="btn" onClick={() => navigate("reports")}><FileBarChart size={14} /> Past reports</button></div>
      {analysisRunning ? <section className="panel processing"><div className="processing-icon" /><h2>Inspecting {activeStore?.name}</h2><p>Mapping visible structure, responsive behavior, and decision friction…</p></section> : analysisResult ? <section className="panel" style={{ marginBottom: 16 }}><div className="panel-heading"><div><span className="eyebrow">Run complete</span><h2>{analysisResult.type} · {analysisResult.store}</h2><p>Evidence was captured just now and is ready to review.</p></div><span className="status ready">Ready to review</span></div><div className="grid three-col"><div className="metric"><div className="metric-top"><span>Analysis score</span><CheckCircle2 size={15} /></div><div className="metric-value">{analysisResult.score}</div><div className="metric-note good">Above workspace baseline</div></div><div className="metric"><div className="metric-top"><span>Findings</span><AlertCircle size={15} /></div><div className="metric-value">7</div><div className="metric-note warn">2 high priority</div></div><div className="metric"><div className="metric-top"><span>Next action</span><MoveRight size={15} /></div><div className="metric-value" style={{ fontSize: 19, marginTop: 18 }}>Review issues</div><div className="metric-note">Evidence remains attached</div></div></div><div className="header-actions" style={{ marginTop: 17 }}><button className="btn primary" onClick={() => navigate("issues")}>Review findings <ArrowRight size={14} /></button><button className="btn" onClick={() => navigate("reports")}>Open report</button><button className="btn" onClick={() => navigate("redesign")}><Sparkles size={14} /> Create redesign</button></div></section> : null}
      <div className="grid two-col"><section className="panel"><div className="panel-heading"><div><span className="eyebrow">Configure run</span><h2>Pick a useful question.</h2></div><span className="status info">No live changes</span></div><div className="form-stack"><div className="field"><label>Analysis focus</label><select className="select" value={type} onChange={(event) => setType(event.target.value)}><option>Store health</option><option>Mobile UX</option><option>Accessibility</option><option>SEO signals</option><option>Conversion path</option></select></div><div className="field"><label>Evidence source</label><div className="source-grid"><button className={`source-option ${source === "store" ? "active" : ""}`} onClick={() => setSource("store")}><Store size={15} /><br />Connected store<br /><small>Use {activeStore?.name}</small></button><button className={`source-option ${source === "url" ? "active" : ""}`} onClick={() => setSource("url")}><Link2 size={15} /><br />Public URL<br /><small>Visible pages only</small></button><button className={`source-option ${source === "screenshot" ? "active" : ""}`} onClick={() => setSource("screenshot")}><Upload size={15} /><br />Screenshots<br /><small>Upload visual evidence</small></button></div></div>{source === "url" && <div className="field"><label>Storefront URL</label><input className="text-input" value={globalSearch} onChange={(event) => setGlobalSearch(event.target.value)} placeholder="https://northstarsupply.co" /></div>}{source === "screenshot" && <div className="notice">Screenshot input is available in the full tool workflow. This demo keeps the evidence boundary visible and lets you continue with a seeded preview.</div>}<button className="btn primary" onClick={() => runAnalysis(type, source)}><Play size={15} /> Run {type}</button></div></section>
        <section className="panel"><div className="panel-heading"><div><span className="eyebrow">Available context</span><h2>What this run can see.</h2></div></div><div className="detail-list"><div className="detail-row"><span>Source</span><strong>{source === "store" ? activeStore?.name : source === "url" ? "Public storefront URL" : "Uploaded screenshot"}</strong></div><div className="detail-row"><span>Private data</span><strong>Not accessed</strong></div><div className="detail-row"><span>Output</span><strong>Score, evidence, issues</strong></div><div className="detail-row"><span>Follow-up</span><strong>AI proposal or handoff</strong></div></div><div className="notice success" style={{ marginTop: 16 }}>Runs are review-first. FerixRG never publishes a change as part of analysis.</div></section></div>
    </div>;
  }
  function Issues() {
    const [severity, setSeverity] = useState("All severities");
    const [status, setStatus] = useState("All statuses");
    const visible = useMemo(() => issues.filter((issue) => (severity === "All severities" || issue.severity === severity) && (status === "All statuses" || issue.status === status) && `${issue.title} ${issue.category} ${issue.surface}`.toLowerCase().includes(globalSearch.toLowerCase())), [globalSearch, issues, severity, status]);
    const startFix = (issue: IssueRecord) => { setIssues((current) => current.map((item) => item.id === issue.id ? { ...item, status: "In progress" } : item)); setSelectedIssue({ ...issue, status: "In progress" }); updateActivity("Issue moved to in progress", issue.title); pushToast("Fix started", "The issue is now attached to a working fix."); };
    const resolveIssue = (issue: IssueRecord) => { setIssues((current) => current.map((item) => item.id === issue.id ? { ...item, status: "Resolved" } : item)); setSelectedIssue({ ...issue, status: "Resolved" }); pushToast("Issue resolved", "Validation is recommended before release."); };
    return <div className="page"><div className="page-header"><div><span className="eyebrow">Prioritize the signal</span><h1>Issues worth a decision.</h1><p>Every finding carries its surface, severity, status, and a clear path to an implementation-ready handoff.</p></div><button className="btn primary" onClick={() => navigate("redesign")}><Sparkles size={14} /> Fix with AI</button></div><div className="filter-row"><div className="filter-search"><label className="search-box"><Search size={14} /><input value={globalSearch} onChange={(event) => setGlobalSearch(event.target.value)} placeholder="Search issues, categories, surfaces…" /></label></div><select className="select" value={severity} onChange={(event) => setSeverity(event.target.value)}><option>All severities</option><option>Critical</option><option>High</option><option>Medium</option><option>Low</option></select><select className="select" value={status} onChange={(event) => setStatus(event.target.value)}><option>All statuses</option><option>Open</option><option>In progress</option><option>Resolved</option></select><button className="btn" onClick={() => { setSeverity("All severities"); setStatus("All statuses"); setGlobalSearch(""); }}><Filter size={14} /> Clear</button></div><div className="grid two-col"><section className="panel"><div className="panel-heading"><div><h2>{visible.length} findings</h2><p>Sorted by severity and decision impact</p></div></div><div className="table-wrap"><table className="data-table"><thead><tr><th>Finding</th><th>Severity</th><th>Surface</th><th>Status</th><th /></tr></thead><tbody>{visible.map((issue) => <tr className="issue-row" key={issue.id} onClick={() => setSelectedIssue(issue)}><td><div className="issue-title"><i className={`issue-severity ${issue.severity.toLowerCase()}`} /><span>{issue.title}<small style={{ display: "block", color: "var(--text-dim)", fontWeight: 400, fontSize: 10 }}>{issue.category}</small></span></div></td><td><span className={`status ${issue.severity === "Critical" ? "critical" : issue.severity === "High" ? "attention" : issue.severity === "Low" ? "info" : "review"}`}>{issue.severity}</span></td><td>{issue.surface}</td><td><span className={`status ${issue.status === "Resolved" ? "resolved" : issue.status === "In progress" ? "progress" : "review"}`}>{issue.status}</span></td><td><ChevronRight size={14} color="var(--text-dim)" /></td></tr>)}</tbody></table></div></section><section className="panel">{selectedIssue ? <><div className="panel-heading"><div><span className="eyebrow">{selectedIssue.category} · {selectedIssue.severity}</span><h2>{selectedIssue.title}</h2><p>{selectedIssue.surface}</p></div><button className="icon-btn" onClick={() => setSelectedIssue(null)} aria-label="Close issue detail"><X size={15} /></button></div><p style={{ color: "var(--text-soft)", fontSize: 12, lineHeight: 1.65 }}>{selectedIssue.detail}</p><div className="detail-list" style={{ marginTop: 18 }}><div className="detail-row"><span>Current state</span><strong>{selectedIssue.status}</strong></div><div className="detail-row"><span>Evidence</span><strong>Northstar mobile capture</strong></div><div className="detail-row"><span>Recommended path</span><strong>Design Studio + validation</strong></div></div><div className="header-actions" style={{ marginTop: 18 }}>{selectedIssue.status === "Resolved" ? <button className="btn" onClick={() => { setIssues((current) => current.map((item) => item.id === selectedIssue.id ? { ...item, status: "Open" } : item)); setSelectedIssue({ ...selectedIssue, status: "Open" }); pushToast("Issue reopened"); }}>Reopen</button> : <><button className="btn primary" onClick={() => navigate("editor")}><Pencil size={14} /> Open in editor</button><button className="btn" onClick={() => selectedIssue.status === "In progress" ? resolveIssue(selectedIssue) : startFix(selectedIssue)}>{selectedIssue.status === "In progress" ? <Check size={14} /> : <Sparkles size={14} />} {selectedIssue.status === "In progress" ? "Mark resolved" : "Start fix"}</button></>}</div></> : <div className="empty"><ShieldCheck /><h3>Choose a finding to inspect</h3><p>Use the detail view to move from evidence to a fix handoff.</p></div>}</section></div></div>;
  }
  function Reports() {
    const visible = reports.filter((report) => `${report.name} ${report.store} ${report.type}`.toLowerCase().includes(globalSearch.toLowerCase()));
    return <div className="page"><div className="page-header"><div><span className="eyebrow">Evidence archive</span><h1>Reports that keep context.</h1><p>Review scores, issue movement, and the exact storefront boundary behind each run.</p></div><button className="btn" onClick={() => navigate("analysis")}><Play size={14} /> New report</button></div><div className="grid two-col"><section className="panel"><div className="panel-heading"><div><h2>{reports.length} saved reports</h2><p>Most recent evidence first</p></div><button className="btn ghost" onClick={() => pushToast("Report list refreshed")}>Refresh <RefreshCw size={13} /></button></div><div className="grid" style={{ gap: 8 }}>{visible.map((report) => <button className="action-card" key={report.id} onClick={() => setSelectedReport(report)}><div className="tool-icon" style={{ margin: 0 }}><FileBarChart size={16} /></div><div className="store-info"><strong>{report.name}</strong><span>{report.store} · {report.type} · {report.date}</span></div><div className="stat-inline"><b>{report.score}</b><span>/100</span></div><ChevronRight size={14} /></button>)}</div></section><section className="panel">{selectedReport ? <><div className="panel-heading"><div><span className="eyebrow">{selectedReport.type}</span><h2>{selectedReport.name}</h2><p>{selectedReport.store} · {selectedReport.date}</p></div><button className="icon-btn" onClick={() => setSelectedReport(null)} aria-label="Close report detail"><X size={15} /></button></div><div className="grid three-col"><div className="metric"><div className="metric-top"><span>Health score</span><Activity size={14} /></div><div className="metric-value">{selectedReport.score}</div><div className="metric-note good">Reviewable</div></div><div className="metric"><div className="metric-top"><span>Issues</span><AlertCircle size={14} /></div><div className="metric-value">{selectedReport.issueCount}</div><div className="metric-note warn">Across 6 surfaces</div></div><div className="metric"><div className="metric-top"><span>Source</span><Eye size={14} /></div><div className="metric-value" style={{ fontSize: 17, marginTop: 18 }}>Public</div><div className="metric-note">Visible evidence</div></div></div><div className="notice" style={{ marginTop: 17 }}>This report records what the storefront exposed at run time. It does not imply access to private catalog, theme, or customer data.</div><div className="header-actions"><button className="btn primary" onClick={() => exportReport(selectedReport)}><Download size={14} /> Download report</button><button className="btn" onClick={() => { navigator.clipboard?.writeText(`FerixRG · ${selectedReport.name} · score ${selectedReport.score}`); pushToast("Report link copied", "A shareable review reference was copied."); }}><Copy size={14} /> Copy reference</button></div></> : <div className="empty"><FileBarChart /><h3>Choose a report</h3><p>Open a saved run to inspect its score, issues, and export options.</p></div>}</section></div></div>;
  }
  function Tools() {
    const [category, setCategory] = useState("All tools");
    const visibleTools = useMemo(() => toolCatalog.filter((tool) => (category === "All tools" || tool.category === category) && `${tool.name} ${tool.description} ${tool.category} ${tool.kind}`.toLowerCase().includes(globalSearch.toLowerCase())), [category, globalSearch]);
    return <div className="page"><div className="page-header"><div><span className="eyebrow">Instrument library · {toolCatalog.length} tools</span><h1>Pick the instrument, not a guess.</h1><p>Each tool has a source contract, a scoped outcome, and a clear next move. Nothing runs until you choose its evidence.</p></div><button className="btn primary" onClick={() => navigate("analysis")}><Play size={14} /> Quick analysis</button></div>{toolRun === "complete" && <div className="notice success"><CheckCircle2 size={14} style={{ verticalAlign: "middle", marginRight: 6 }} /><strong>{selectedTool.name} returned a reviewable result.</strong> Evidence is attached to the workspace; choose the next action below.</div>}<div className="filter-row"><label className="search-box" style={{ flex: 1, minWidth: 200 }}><Search size={14} /><input value={globalSearch} onChange={(event) => setGlobalSearch(event.target.value)} placeholder="Search the FerixRG tool library…" /></label><select className="select" value={category} onChange={(event) => setCategory(event.target.value)}>{toolCategories.map((item) => <option key={item}>{item}</option>)}</select></div><div className="grid tool-grid">{visibleTools.map((tool) => <button className={`tool-card ${selectedTool.id === tool.id ? "selected" : ""}`} key={tool.id} onClick={() => setSelectedTool(tool)}><div className="tool-icon">{tool.kind === "analysis" ? <BarChart3 size={16} /> : tool.kind === "generator" ? <Sparkles size={16} /> : tool.kind === "validation" ? <ClipboardCheck size={16} /> : <Wand2 size={16} />}</div><h3>{tool.name}</h3><p>{tool.description}</p><div className="tool-meta"><span className="category-pill">{tool.category}</span><span>{tool.sources.length} sources <ChevronRight size={12} /></span></div></button>)}</div><section className="panel" style={{ marginTop: 16 }}>{selectedTool && <div className="grid two-col"><div><span className="eyebrow">{selectedTool.category} · {selectedTool.kind}</span><h2>{selectedTool.name}</h2><p style={{ color: "var(--text-soft)", fontSize: 13, lineHeight: 1.6, marginTop: 9 }}>{selectedTool.description}</p><div className="detail-list" style={{ marginTop: 15 }}><div className="detail-row"><span>Focus</span><strong>{selectedTool.analysisFocus.slice(0, 3).join(" · ")}</strong></div><div className="detail-row"><span>Outcome</span><strong>{selectedTool.outcome}</strong></div></div></div><div><span className="eyebrow">Tool contract</span><h3 style={{ marginTop: 4 }}>Supported sources</h3><div className="source-grid" style={{ marginTop: 12 }}>{selectedTool.sources.map((source) => <div className="source-option active" key={source}><Check size={13} /> {source}</div>)}</div><button className="btn primary" style={{ marginTop: 14 }} onClick={() => setModal("run-tool")}><Play size={14} /> Set up this tool</button></div></div>}</section></div>;
  }
  function Redesign() {
    const start = () => { setRedesignState("processing"); window.setTimeout(() => { setRedesignState("proposal"); updateActivity("AI redesign proposal created", activeStore?.name ?? "Workspace"); pushToast("Proposal ready", "Review the direction before applying it."); }, 1300); };
    return <div className="page"><div className="page-header"><div><span className="eyebrow">Reviewable intelligence</span><h1>Give the storefront a better next draft.</h1><p>AI can propose a direction from evidence. You decide what enters the visual editor and what remains a suggestion.</p></div><span className="status info">Human review required</span></div>{redesignState === "processing" ? <section className="panel processing"><div className="processing-icon" /><h2>Building a reviewable direction</h2><p>Connecting health signals, mobile friction, and the selected store context…</p></section> : redesignState === "proposal" || redesignState === "applied" ? <div className="grid two-col"><section className="panel"><div className="panel-heading"><div><span className="eyebrow">Proposal · v0.4</span><h2>Compact product story</h2><p>Generated for {activeStore?.name} · {redesignSource} · Product detail page</p></div><span className={`status ${redesignState === "applied" ? "resolved" : "draft"}`}>{redesignState === "applied" ? "Applied to draft" : "Needs review"}</span></div><div className="workspace-preview" style={{ minHeight: 410 }}><div className="preview-chrome"><span>{activeStore?.domain}</span><span>AI direction preview</span></div><div className="preview-hero"><div><span style={{ color: "#55706e", fontSize: 10, textTransform: "uppercase", letterSpacing: ".1em" }}>New arrangement</span><h2>Objects for a slower pace.</h2><p>Bring product confidence above the fold, move trust proof next to the decision, and keep the action visible on smaller screens.</p><span className="preview-cta">Shop the edit</span></div></div><div className="preview-grid"><div className="preview-product"><i /><span>Field jacket</span></div><div className="preview-product"><i /><span>Canvas tote</span></div><div className="preview-product"><i /><span>Studio mug</span></div></div></div></section><section className="panel"><span className="eyebrow">Proposal notes</span><h2 style={{ marginTop: 4 }}>What changes, and why.</h2><div className="check-list" style={{ marginTop: 17 }}><div className="check"><CheckCircle2 /><div><strong>Purchase action moves into the first decision frame</strong><span>Responds to the highest-severity mobile conversion finding.</span></div></div><div className="check"><CheckCircle2 /><div><strong>Trust row sits beside delivery and returns</strong><span>Reduces the gap between product desire and reassurance.</span></div></div><div className="check warn"><AlertCircle /><div><strong>Copy is a direction, not a factual source</strong><span>Review product claims before saving a release candidate.</span></div></div></div><div className="header-actions" style={{ marginTop: 20 }}><button className="btn primary" onClick={() => { setRedesignState("applied"); setProposalApplied(true); setEditorDirty(true); pushToast("Direction applied", "The proposal is now editable in Design Studio."); navigate("editor"); }}><Check size={14} /> Apply to draft</button><button className="btn" onClick={() => { setRedesignState("dismissed"); pushToast("Proposal dismissed", "The original working draft is unchanged."); }}>Dismiss</button><button className="btn" onClick={() => navigate("editor")}><Pencil size={14} /> Edit manually</button></div></section></div> : <section className="grid two-col"><section className="panel"><div className="panel-heading"><div><span className="eyebrow">Source context</span><h2>Choose where the direction starts.</h2></div></div><div className="source-grid"><button className={`source-option ${redesignSource === "Connected store" ? "active" : ""}`} onClick={() => setRedesignSource("Connected store")}><Store size={16} /><br />Connected store<br /><small>{activeStore?.name}</small></button><button className={`source-option ${redesignSource === "Latest analysis" ? "active" : ""}`} onClick={() => setRedesignSource("Latest analysis")}><FileBarChart size={16} /><br />Latest analysis<br /><small>Northstar full storefront review</small></button><button className={`source-option ${redesignSource === "Reference design" ? "active" : ""}`} onClick={() => setRedesignSource("Reference design")}><Upload size={16} /><br />Reference design<br /><small>Upload visual evidence</small></button></div><button className="btn primary" style={{ marginTop: 16 }} onClick={start}><Sparkles size={15} /> Generate proposal</button></section><section className="panel"><span className="eyebrow">Guardrails</span><h2 style={{ marginTop: 4 }}>A proposal, not a surprise.</h2><div className="detail-list" style={{ marginTop: 15 }}><div className="detail-row"><span>Evidence used</span><strong>{redesignSource} context</strong></div><div className="detail-row"><span>Live publishing</span><strong>Never automatic</strong></div><div className="detail-row"><span>Next step</span><strong>Review in Design Studio</strong></div></div><div className="notice success" style={{ marginTop: 17 }}>The reviewer stays in control of every proposed visual and content change.</div></section></section>}</div>;
  }
  function Editor() {
    const sendAi = () => { if (!aiInput.trim()) return; setAiMessages((messages) => [...messages, { role: "user", text: aiInput }, { role: "assistant", text: `Proposal: increase contrast around ${editorElement.toLowerCase()}, reduce competing links, and keep the change scoped to ${editorDevice.toLowerCase()} without altering product facts.` }]); setAiInput(""); setInspectorTab("ai"); setEditorDirty(true); };
    return <div className="page"><div className="page-header"><div><span className="eyebrow">Working draft · {editorDirty ? "Unsaved changes" : "Saved"}</span><h1>Design Studio.</h1><p>Make a precise change, ask AI for a bounded proposal, and save a version when the direction is ready to compare.</p></div><div className="header-actions"><span className={`status ${editorDirty ? "progress" : "saved"}`}>{editorDirty ? "Unsaved changes" : "All changes saved"}</span><button className="btn primary" onClick={saveVersion}><CloudDownload size={14} /> Save version</button></div></div><div className="split-workspace"><section className="panel" style={{ padding: 12 }}><div className="panel-heading" style={{ padding: "4px 8px 11px", marginBottom: 3 }}><div><span className="eyebrow">Live preview</span><h2>{activeStore?.name} · Product page</h2></div><div className="device-switch">{deviceOptions.map(([label, Icon]) => <button className={editorDevice === label ? "active" : ""} key={label} onClick={() => { setEditorDevice(label); setEditorDirty(true); }}><Icon size={13} />{label}</button>)}</div></div><div className="workspace-preview"><div className="preview-chrome"><span>northstarsupply.co</span><span>{editorDevice} preview · 100%</span></div><div className="preview-hero"><div><span style={{ color: "#55706e", fontSize: 10, textTransform: "uppercase", letterSpacing: ".1em" }}>Selected: {editorElement}</span><h2>Objects for a slower pace.</h2><p>A considered edit of useful things for daily rituals.</p><span className="preview-cta" style={{ outline: editorElement === "Buy button" ? "3px solid #c7f36a" : "none" }}>Add to bag</span></div></div><div className="preview-grid">{["Field jacket", "Canvas tote", "Studio mug"].map((item) => <div className="preview-product" key={item}><i /><span>{item}</span><small style={{ color: "#6c827e", marginTop: 3 }}>$128</small></div>)}</div></div></section><aside className="panel inspector"><div className="inspector-tabs">{(["edit", "ai", "history"] as const).map((tab) => <button className={inspectorTab === tab ? "active" : ""} key={tab} onClick={() => setInspectorTab(tab)}>{tab === "edit" ? "Edit" : tab === "ai" ? "AI assist" : "History"}</button>)}</div>{inspectorTab === "edit" && <><div><span className="eyebrow">Layers</span><div className="layer-list" style={{ marginTop: 8 }}>{editorLayers.map((layer) => <button className={`layer ${editorElement === layer ? "active" : ""}`} key={layer} onClick={() => { setEditorElement(layer); setEditorDirty(true); }}><span>{layer}</span><ChevronRight size={13} /></button>)}</div></div><div className="field"><label>Selected element</label><p>{editorElement} · {editorDevice}</p></div><div className="field"><label>Content treatment</label><input className="text-input" defaultValue={editorElement === "Buy button" ? "Add to bag" : "Objects for a slower pace."} onChange={() => setEditorDirty(true)} /></div><div className="field"><label>Spacing intent</label><select className="select" defaultValue="Balanced" onChange={() => setEditorDirty(true)}><option>Compact</option><option>Balanced</option><option>Airy</option></select></div></>}{inspectorTab === "ai" && <><div className="notice">Ask for one focused change. AI proposals stay reviewable until you apply them.</div><div className="grid" style={{ gap: 8, maxHeight: 220, overflowY: "auto" }}>{aiMessages.map((message, index) => <div className={`proposal ${message.role === "user" ? "user-message" : ""}`} key={`${message.role}-${index}`}><strong>{message.role === "user" ? "You" : "FerixRG AI"}</strong><p>{message.text}</p></div>)}</div>{proposalApplied && <div className="notice success">AI direction applied to the working draft. Save a version when ready.</div>}<div className="field"><label>Ask for a change</label><textarea className="text-area" value={aiInput} onChange={(event) => setAiInput(event.target.value)} placeholder="Make the buy action more confident…" /></div><button className="btn primary" onClick={sendAi}><Send size={14} /> Ask AI</button><button className="btn" onClick={() => { setProposalApplied(true); setEditorDirty(true); pushToast("AI proposal applied", "Review the selected layer, then save a version."); }}>Apply latest proposal</button></>}{inspectorTab === "history" && <><div className="timeline">{versions.slice(0, 4).map((version) => <div className="timeline-row" key={version.id}><i /><div><strong>{version.label}</strong><span>{version.createdBy} · {version.score}/100</span></div><time>{version.date}</time></div>)}</div><button className="btn" onClick={() => navigate("versions")}><History size={14} /> Open versions</button></>}</aside></div></div>;
  }
  function Validate() {
    return <div className="page"><div className="page-header"><div><span className="eyebrow">Release confidence</span><h1>Validate before it leaves the draft.</h1><p>Run the checks that protect the decision: visual movement, responsive reach, accessibility, and search structure.</p></div><div className="header-actions"><span className={`status ${validationReady ? "ready" : "draft"}`}>{validationReady ? "Ready with warning" : "Not run"}</span><button className="btn primary" onClick={runValidation} disabled={validationRunning}>{validationRunning ? <><RefreshCw size={14} /> Running checks</> : <><ClipboardCheck size={14} /> Run validation</>}</button></div></div><div className="grid two-col"><section className="panel"><div className="panel-heading"><div><span className="eyebrow">Check matrix</span><h2>{validationReady ? "Validation completed" : "Four release checks"}</h2><p>Current draft · {activeStore?.name}</p></div></div><div className="check-list">{validationChecks.map(([title, detail, state]) => <div className={`check ${state === "warn" ? "warn" : ""}`} key={title}>{state === "pass" ? <CheckCircle2 /> : <AlertCircle />}<div><strong>{title}<span className={`status ${state === "pass" ? "resolved" : "review"}`} style={{ marginLeft: 8 }}>{state === "pass" ? "Passed" : "Review"}</span></strong><span>{detail}</span></div></div>)}</div></section><section className="panel"><span className="eyebrow">Release gate</span><h2 style={{ marginTop: 4 }}>{validationReady ? "One decision remains." : "Checks create the confidence layer."}</h2><div className="detail-list" style={{ marginTop: 15 }}><div className="detail-row"><span>Critical issues</span><strong>{issues.filter((issue) => issue.severity === "Critical" && issue.status !== "Resolved").length} unresolved</strong></div><div className="detail-row"><span>Draft state</span><strong>{editorDirty ? "Unsaved changes" : "Saved version"}</strong></div><div className="detail-row"><span>Store permission</span><strong>Review only</strong></div></div>{validationReady ? <><div className="notice" style={{ marginTop: 17 }}>Accessibility still needs an explicit review. Publishing is not available from this demo boundary.</div><button className="btn primary" onClick={() => pushToast("Release record prepared", "The validation result is ready for team review.")}>Create release record <ArrowRight size={14} /></button></> : <div className="empty" style={{ marginTop: 17, minHeight: 130 }}><ClipboardCheck /><h3>Run the matrix when the draft is stable</h3><p>Results will update this release gate.</p></div>}</section></div></div>;
  }
  function Versions() {
    const [compareIds, setCompareIds] = useState<string[]>([]);
    const [compareNotice, setCompareNotice] = useState("");
    const toggleCompare = (id: string) => setCompareIds((current) => current.includes(id) ? current.filter((item) => item !== id) : current.length < 2 ? [...current, id] : [current[1], id]);
    const restore = (version: VersionRecord) => { setEditorDirty(true); setCompareNotice(`${version.label} restored into the working draft. Save a new version to keep it.`); pushToast("Version restored", "The restored version is now editable."); };
    const selectedVersions = versions.filter((version) => compareIds.includes(version.id));
    return <div className="page"><div className="page-header"><div><span className="eyebrow">Draft history</span><h1>Versions with a memory.</h1><p>Compare what changed, restore a direction, or continue from the latest saved checkpoint.</p></div><button className="btn primary" onClick={() => navigate("editor")}><Pencil size={14} /> Continue editing</button></div>{compareNotice && <div className="notice success">{compareNotice}</div>}{compareIds.length === 2 && <div className="notice"><strong>Comparison ready:</strong> {selectedVersions[0].label} ({selectedVersions[0].score}) vs {selectedVersions[1].label} ({selectedVersions[1].score}). <button className="btn" style={{ marginLeft: 9, padding: "5px 8px" }} onClick={() => pushToast("Comparison exported", "The score and issue movement summary is ready.")}><Download size={12} /> Export comparison</button></div>}<section className="panel"><div className="panel-heading"><div><h2>{versions.length} saved checkpoints</h2><p>Select two versions to compare</p></div><span className="status info">{compareIds.length}/2 selected</span></div><div className="table-wrap"><table className="data-table"><thead><tr><th>Compare</th><th>Version</th><th>Created by</th><th>Date</th><th>Score</th><th>State</th><th /></tr></thead><tbody>{versions.map((version) => <tr key={version.id}><td><button className={`icon-btn ${compareIds.includes(version.id) ? "selected" : ""}`} onClick={() => toggleCompare(version.id)} aria-label={`Compare ${version.label}`}>{compareIds.includes(version.id) ? <Check size={14} /> : <Copy size={14} />}</button></td><td>{version.label}</td><td>{version.createdBy === "AI" ? <span className="status draft">AI</span> : version.createdBy}</td><td>{version.date}</td><td><b style={{ color: "var(--lime)" }}>{version.score}</b>/100</td><td><span className={`status ${version.state === "Current" ? "ready" : version.state === "Draft" ? "draft" : "info"}`}>{version.state}</span></td><td><div className="header-actions"><button className="btn" onClick={() => restore(version)}><RefreshCw size={12} /> Restore</button><button className="btn" onClick={() => { setEditorDirty(true); navigate("editor"); }}>Continue</button></div></td></tr>)}</tbody></table></div></section></div>;
  }
  function More() {
    const [teamMembers, setTeamMembers] = useState([{ name: "Maya Chen", role: "Owner", status: "Active" }, { name: "Jon Bell", role: "Editor", status: "Active" }, { name: "Priya Shah", role: "Viewer", status: "Invited" }]);
    return <div className="page"><div className="page-header"><div><span className="eyebrow">Workspace controls</span><h1>More room for the details.</h1><p>Manage profile, team access, notification rhythm, and the source controls behind this workspace.</p></div><button className="btn" onClick={() => setModal("notifications")}><Bell size={14} /> Notifications</button></div><div className="grid two-col"><section className="panel"><div className="panel-heading"><div><span className="eyebrow">Your profile</span><h2>Profile and preferences</h2></div><div className="avatar">{initials(profileName)}</div></div><div className="form-stack"><div className="field"><label>Display name</label><input className="text-input" value={profileName} onChange={(event) => setProfileName(event.target.value)} /></div><div className="field"><label>Workspace role</label><input className="text-input" value="Owner · FerixRG workspace" readOnly /></div><button className="btn primary" onClick={() => pushToast("Profile saved", `Welcome, ${profileName}.`)}><Check size={14} /> Save profile</button></div></section><section className="panel"><div className="panel-heading"><div><span className="eyebrow">Notifications</span><h2>Choose your signal rhythm.</h2></div></div><div className="detail-list"><label className="detail-row"><span>Issue activity</span><input type="checkbox" checked={settings.email} onChange={(event) => setSettings({ ...settings, email: event.target.checked })} /></label><label className="detail-row"><span>Weekly health digest</span><input type="checkbox" checked={settings.weekly} onChange={(event) => setSettings({ ...settings, weekly: event.target.checked })} /></label><label className="detail-row"><span>Editor auto-save</span><input type="checkbox" checked={settings.autoSave} onChange={(event) => setSettings({ ...settings, autoSave: event.target.checked })} /></label></div><div className="notice success" style={{ marginTop: 17 }}>Preferences save locally in this demo workspace.</div></section></div><section className="panel" style={{ marginTop: 16 }}><div className="panel-heading"><div><span className="eyebrow">Team access</span><h2>People in the workspace</h2><p>Invite the people who review evidence or ship the fix.</p></div><button className="btn primary" onClick={() => { setTeamMembers((members) => [...members, { name: `New reviewer ${members.length + 1}`, role: "Viewer", status: "Invited" }]); pushToast("Invite created", "A viewer invite was added to the demo team."); }}><Plus size={14} /> Invite teammate</button></div><div className="table-wrap"><table className="data-table"><thead><tr><th>Person</th><th>Role</th><th>Status</th><th /></tr></thead><tbody>{teamMembers.map((member) => <tr key={member.name}><td><div className="table-store"><div className="avatar">{initials(member.name)}</div><span>{member.name}</span></div></td><td><select className="select" value={member.role} onChange={(event) => setTeamMembers((members) => members.map((item) => item.name === member.name ? { ...item, role: event.target.value } : item))}><option>Owner</option><option>Editor</option><option>Viewer</option></select></td><td><span className={`status ${member.status === "Active" ? "connected" : "review"}`}>{member.status}</span></td><td><button className="icon-btn" onClick={() => { setTeamMembers((members) => members.filter((item) => item.name !== member.name)); pushToast("Teammate removed"); }} aria-label={`Remove ${member.name}`}><Trash2 size={14} /></button></td></tr>)}</tbody></table></div></section><section className="panel" style={{ marginTop: 16 }}><div className="panel-heading"><div><span className="eyebrow">Connections</span><h2>Source controls</h2></div></div><div className="grid three-col"><button className="action-card" onClick={() => setModal("connect")}><Link2 /><span>Store connections<small>{stores.length} sources registered</small></span></button><button className="action-card" onClick={() => pushToast("API keys are protected", "No live API credentials are used in this demo.")}><Code2 /><span>Developer access<small>Review-only workspace token</small></span></button><button className="action-card" onClick={() => pushToast("Billing is ready for review", "This protected demo does not process payments.")}><Tag /><span>Plan & billing<small>Workspace plan · Studio</small></span></button></div></section></div>;
  }
  function ModalLayer() {
    if (!modal) return null;
    if (modal === "notifications") return <div className="modal-backdrop" onClick={() => setModal(null)}><section className="modal" onClick={(event) => event.stopPropagation()}><div className="modal-head"><div><span className="eyebrow">Workspace feed</span><h2>Notifications</h2><p>Recent changes that may need your review.</p></div><button className="modal-close" onClick={() => setModal(null)} aria-label="Close notifications"><X size={17} /></button></div><div className="notice-list">{activity.slice(0, 4).map(([event, detail], index) => <div className="notice-card" key={`${event}-${index}`}><Bell /><div><strong>{event}</strong><span>{detail}</span></div></div>)}</div></section></div>;
    if (modal === "add-store") return <AddStoreModal />;
    if (modal === "connect") return <ConnectModal />;
    return <ToolRunModal />;
  }
  function AddStoreModal() {
    const [name, setName] = useState("");
    const [url, setUrl] = useState("");
    return <div className="modal-backdrop" onClick={() => setModal(null)}><section className="modal" onClick={(event) => event.stopPropagation()}><div className="modal-head"><div><span className="eyebrow">New source</span><h2>Add a storefront.</h2><p>Start with a public URL. You can connect a supported store later.</p></div><button className="modal-close" onClick={() => setModal(null)} aria-label="Close add store"><X size={17} /></button></div><form className="form-stack" onSubmit={(event) => { event.preventDefault(); addStore(name, url); }}><div className="field"><label>Store name</label><input className="text-input" autoFocus value={name} onChange={(event) => setName(event.target.value)} placeholder="Northstar Supply" /></div><div className="field"><label>Storefront URL</label><div className="search-box" style={{ width: "100%" }}><Link2 size={14} /><input value={url} onChange={(event) => setUrl(event.target.value)} placeholder="https://yourstore.com" /></div></div><div className="notice">FerixRG will use visible storefront evidence only. No customer, order, or private theme data is accessed by this URL flow.</div><div className="form-actions"><button type="button" className="btn" onClick={() => setModal(null)}>Cancel</button><button className="btn primary" type="submit"><Plus size={14} /> Add store</button></div></form></section></div>;
  }
  function ConnectModal() {
    const [provider, setProvider] = useState("Shopify");
    return <div className="modal-backdrop" onClick={() => setModal(null)}><section className="modal" onClick={(event) => event.stopPropagation()}><div className="modal-head"><div><span className="eyebrow">Permissioned source</span><h2>Connect a store.</h2><p>Choose a provider to simulate a reviewed connection flow.</p></div><button className="modal-close" onClick={() => setModal(null)} aria-label="Close connection dialog"><X size={17} /></button></div><div className="form-stack"><div className="field"><label>Provider</label><div className="source-grid"><button className={`source-option ${provider === "Shopify" ? "active" : ""}`} onClick={() => setProvider("Shopify")}><Store size={15} /><br />Shopify</button><button className={`source-option ${provider === "WooCommerce" ? "active" : ""}`} onClick={() => setProvider("WooCommerce")}><Link2 size={15} /><br />WooCommerce</button></div></div><div className="notice">This demo does not request OAuth credentials. The confirmation below updates local connection state only.</div><div className="form-actions"><button className="btn" onClick={() => setModal(null)}>Cancel</button><button className="btn primary" onClick={() => { if (activeStore) setStores((current) => current.map((store) => store.id === activeStore.id ? { ...store, platform: provider, status: "Connected" } : store)); setModal(null); pushToast("Connection updated", `${provider} is now the active source.`); }}><Link2 size={14} /> Confirm connection</button></div></div></section></div>;
  }
  function ToolRunModal() {
    const [source, setSource] = useState(selectedTool.sources[0] ?? "Public URL");
    return <div className="modal-backdrop" onClick={() => setModal(null)}><section className="modal" onClick={(event) => event.stopPropagation()}><div className="modal-head"><div><span className="eyebrow">{selectedTool.category}</span><h2>Set up {selectedTool.name}.</h2><p>Choose one source. You can review the output before taking action.</p></div><button className="modal-close" onClick={() => setModal(null)} aria-label="Close tool setup"><X size={17} /></button></div><div className="source-grid">{selectedTool.sources.map((item) => <button className={`source-option ${source === item ? "active" : ""}`} key={item} onClick={() => setSource(item)}><Check size={13} /> {item}</button>)}</div>{source === "Public URL" && <input className="text-input" style={{ marginTop: 12 }} placeholder="https://northstarsupply.co" />}{toolRun === "complete" && <div className="notice success" style={{ marginTop: 13 }}>A previous run is complete. Run again to create a fresh result.</div>}<div className="form-actions"><button className="btn" onClick={() => setModal(null)}>Cancel</button><button className="btn primary" onClick={() => runSelectedTool(source)}><Play size={14} /> Run tool</button></div></section></div>;
  }
  const currentContent = page === "overview" ? <Overview /> : page === "stores" ? <Stores /> : page === "analysis" ? <Analysis /> : page === "issues" ? <Issues /> : page === "reports" ? <Reports /> : page === "tools" ? <Tools /> : page === "redesign" ? <Redesign /> : page === "editor" ? <Editor /> : page === "validate" ? <Validate /> : page === "versions" ? <Versions /> : <More />;
  return <div className="ferix-app"><Sidebar /><div className="main-area"><Topbar /><main className="content">{toolRun === "processing" && <div className="notice" style={{ marginBottom: 15 }}><RefreshCw size={13} style={{ verticalAlign: "middle", marginRight: 6 }} /> {selectedTool.name} is processing evidence…</div>}{currentContent}</main></div><nav className="mobile-nav">{mobileNavItems.map(([label, key, Icon]) => <button className={page === key ? "active" : ""} key={key} onClick={() => navigate(key)}><Icon /><span>{label}</span></button>)}</nav>{mobileMenu && <div className="modal-backdrop" onClick={() => setMobileMenu(false)}><section className="modal" onClick={(event) => event.stopPropagation()}><div className="modal-head"><div><span className="eyebrow">Navigate</span><h2>Workspace areas</h2></div><button className="modal-close" onClick={() => setMobileMenu(false)} aria-label="Close menu"><X size={17} /></button></div>{navGroups.flatMap((group) => group.items.map(([label, key, Icon]) => <button className={`nav-item ${page === key ? "active" : ""}`} key={key} onClick={() => navigate(key)}><Icon /><span>{label}</span></button>))}</section></div>}{<ModalLayer />}<div className="toast-stack" aria-live="polite">{toastItems.map((toast) => <div className="toast" key={toast.id}><strong>{toast.title}</strong>{toast.message && <span>{toast.message}</span>}</div>)}</div></div>;
}

function ScanIcon() { return <BarChart3 size={17} />; }

function AppRouter() {
  return <Switch><Route path="/" component={DashboardApp} /><Route path="/dashboard" component={DashboardApp} /><Route path="/dashboard/:page" component={DashboardApp} /><Route component={DashboardApp} /></Switch>;
}

function App() {
  return <WouterRouter><AppRouter /></WouterRouter>;
}

export default App;