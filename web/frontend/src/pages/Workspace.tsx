import { ChangeEvent, useMemo, useState } from "react";
import { Activity, ArrowLeft, ArrowUpRight, Bell, Boxes, CheckCircle2, ChevronDown, ChevronRight, CircleAlert, CircleHelp, CreditCard, FileBarChart, FileStack, Gauge, Globe2, Image, Layers3, LayoutDashboard, Menu, Package, Palette, Search, Settings, ShieldCheck, Smartphone, Sparkles, Store, Upload, UserRound, UsersRound, Wand2, X } from "lucide-react";
import { useWorkspaceData, type WorkspaceRecord } from "../lib/workspaceData";
import { workspaceClient } from "../lib/workspaceClient";
import "./dashboardPreview.css";
import "./menuHubs.css";

type View = "Overview" | "Stores" | "Analysis" | "Issues" | "Reports" | "Tools" | "Redesign" | "Studio" | "Validate" | "Specialist" | "Projects" | "Settings" | "Profile" | "Notifications" | "Team" | "Billing" | "Help";
type SourceKind = "URL" | "Connected Store" | "Uploaded File" | "Project / Saved Analysis" | "Developer Source / Code";

type AnalysisTool = { id: string; name: string; executionId: string; sources: SourceKind[]; description: string; requiresConnection?: boolean; publicUrlExecutable?: boolean };

const navigation: Array<{ label: string; view: View; icon: typeof LayoutDashboard; group: string }> = [
  { label: "Overview", view: "Overview", icon: LayoutDashboard, group: "Workspace" },
  { label: "Stores", view: "Stores", icon: Store, group: "Workspace" },
  { label: "Analysis", view: "Analysis", icon: Gauge, group: "Intelligence" },
  { label: "Issues", view: "Issues", icon: ShieldCheck, group: "Intelligence" },
  { label: "Reports", view: "Reports", icon: FileBarChart, group: "Intelligence" },
  { label: "Tools", view: "Tools", icon: Wand2, group: "Create & ship" },
  { label: "Redesign", view: "Redesign", icon: Sparkles, group: "Create & ship" },
  { label: "Studio", view: "Studio", icon: Layers3, group: "Create & ship" },
  { label: "Validate", view: "Validate", icon: Boxes, group: "Create & ship" },
  { label: "Projects", view: "Projects", icon: Activity, group: "Create & ship" },
  { label: "Settings", view: "Settings", icon: Settings, group: "Workspace" },
];

const mobileNavigation: Array<{ label: "Home" | "Store" | "Tools" | "Project"; view: View; icon: typeof LayoutDashboard }> = [
  { label: "Home", view: "Overview", icon: LayoutDashboard },
  { label: "Store", view: "Stores", icon: Store },
  { label: "Tools", view: "Tools", icon: Wand2 },
  { label: "Project", view: "Projects", icon: Activity },
];

const accountNavigation: Array<{ label: string; view: View; icon: typeof UserRound }> = [
  { label: "Profile", view: "Profile", icon: UserRound },
  { label: "Notifications", view: "Notifications", icon: Bell },
  { label: "Team & members", view: "Team", icon: UsersRound },
  { label: "Billing", view: "Billing", icon: CreditCard },
  { label: "Help", view: "Help", icon: CircleHelp },
];

const analysisTools: AnalysisTool[] = [
  { id: "design-analysis", name: "Design Analysis", executionId: "visual-design-analyzer", sources: ["URL", "Connected Store", "Uploaded File", "Project / Saved Analysis"], description: "Review visual design evidence from an authenticated workspace source.", publicUrlExecutable: true },
  { id: "responsive-analysis", name: "Responsive Analysis", executionId: "responsive-analyzer", sources: ["URL", "Connected Store", "Uploaded File", "Project / Saved Analysis"], description: "Review responsive evidence and declared viewport signals.", publicUrlExecutable: true },
  { id: "structure-analysis", name: "Structure Analysis", executionId: "site-structure-analyzer", sources: ["URL", "Connected Store", "Project / Saved Analysis"], description: "Review observed page structure and hierarchy.", publicUrlExecutable: true },
  { id: "ux-analysis", name: "UX Analysis", executionId: "ux-analyzer", sources: ["URL", "Connected Store", "Project / Saved Analysis"], description: "Review observed journey and interaction signals.", publicUrlExecutable: true },
  { id: "conversion-analysis", name: "Conversion Analysis", executionId: "conversion-analyzer", sources: ["URL", "Connected Store", "Project / Saved Analysis"], description: "Review observed commerce-path signals.", publicUrlExecutable: true },
  { id: "seo-analysis", name: "SEO Analysis", executionId: "seo-analyzer", sources: ["URL", "Connected Store", "Project / Saved Analysis"], description: "Review observed metadata and search signals.", publicUrlExecutable: true },
  { id: "performance-analysis", name: "Performance Analysis", executionId: "performance-analyzer", sources: ["URL", "Connected Store", "Project / Saved Analysis", "Developer Source / Code"], description: "Review measured public URL fetch and resource signals.", publicUrlExecutable: true },
  { id: "accessibility-analysis", name: "Accessibility Analysis", executionId: "accessibility-analyzer", sources: ["URL", "Connected Store", "Uploaded File", "Project / Saved Analysis", "Developer Source / Code"], description: "Review source-bounded accessibility indicators.", publicUrlExecutable: true },
  { id: "security-analysis", name: "Security Analysis", executionId: "technical-analyzer", sources: ["Connected Store"], description: "Requires an authorized connected-store context and permitted technical access.", requiresConnection: true },
  { id: "content-analysis", name: "Content Analysis", executionId: "content-quality-analyzer", sources: ["URL", "Connected Store", "Uploaded File", "Project / Saved Analysis"], description: "Review observed content, clarity, and hierarchy.", publicUrlExecutable: true },
  { id: "asset-analysis", name: "Asset Analysis", executionId: "asset-analyzer", sources: ["URL", "Connected Store", "Uploaded File", "Project / Saved Analysis", "Developer Source / Code"], description: "Review observed asset references and uploaded asset evidence.", publicUrlExecutable: true },
  { id: "design-system-analysis", name: "Design System Analysis", executionId: "component-builder", sources: ["Connected Store", "Project / Saved Analysis", "Developer Source / Code"], description: "Requires compatible authenticated source evidence before its execution path is available." },
];

function formatDate(value: unknown) {
  if (!value) return "No timestamp";
  const date = new Date(String(value));
  return Number.isNaN(date.getTime()) ? "No timestamp" : date.toLocaleString();
}

function titleCase(value: unknown) {
  return String(value ?? "Unknown").replaceAll("_", " ").replace(/\b\w/g, letter => letter.toUpperCase());
}

function EmptyState({ title, detail, action }: { title: string; detail: string; action?: { label: string; onClick: () => void } }) {
  return <section className="panel project-empty"><FileStack size={21} /><div><h2>{title}</h2><p>{detail}</p></div>{action && <button className="secondary" onClick={action.onClick}>{action.label}</button>}</section>;
}

function Status({ value }: { value: unknown }) {
  return <span className="workspace-status draft">{titleCase(value)}</span>;
}

async function toBase64(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("The selected file could not be read."));
    reader.onload = () => resolve(String(reader.result).split(",").pop() ?? "");
    reader.readAsDataURL(file);
  });
}

export default function Workspace() {
  const { data, loading, error, refresh } = useWorkspaceData();
  const [view, setView] = useState<View>("Overview");
  const [moreOpen, setMoreOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [tool, setTool] = useState<AnalysisTool>(analysisTools[0]!);
  const [source, setSource] = useState<SourceKind>("URL");
  const [sourceUrl, setSourceUrl] = useState("");
  const [sourceStoreId, setSourceStoreId] = useState<number | null>(null);
  const [sourceDraftId, setSourceDraftId] = useState<number | null>(null);
  const [selectedRun, setSelectedRun] = useState<WorkspaceRecord | null>(null);
  const [selectedRunEvidence, setSelectedRunEvidence] = useState<WorkspaceRecord[]>([]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [aiMessage, setAiMessage] = useState("");
  const [aiProposal, setAiProposal] = useState<string | null>(null);
  const [aiRemainingCapacity, setAiRemainingCapacity] = useState<number | null>(null);
  const [aiProviderError, setAiProviderError] = useState<string | null>(null);
  const [draftTitle, setDraftTitle] = useState("");
  const [selectedDraftId, setSelectedDraftId] = useState<number | null>(null);
  const [draftVersions, setDraftVersions] = useState<WorkspaceRecord[]>([]);
  const [selectedVersionId, setSelectedVersionId] = useState<number | null>(null);
  const [releaseReadiness, setReleaseReadiness] = useState<string | null>(null);
  const [createUrlName, setCreateUrlName] = useState("");
  const [createUrl, setCreateUrl] = useState("");
  const [connectStoreName, setConnectStoreName] = useState("");
  const [connectStoreUrl, setConnectStoreUrl] = useState("");
  const [connectPlatform, setConnectPlatform] = useState("shopify");
  const [providerAuthorizationUrl, setProviderAuthorizationUrl] = useState<string | null>(null);

  const workspaceId = Number(data.workspace?.id);
  const groups = useMemo(() => navigation.reduce<Record<string, typeof navigation>>((result, item) => { (result[item.group] ??= []).push(item); return result; }, {}), []);
  const activeStore = data.stores.find(store => Number(store.id) === sourceStoreId) ?? null;
  const notifications = [...data.runs.filter(run => ["completed", "failed"].includes(String(run.status))), ...data.validations.filter(run => ["passed", "failed"].includes(String(run.status)))].slice(0, 8);
  const searchResults = useMemo(() => {
    const needle = search.trim().toLowerCase();
    if (!needle) return [];
    const records = [
      ...data.stores.map(item => ({ type: "Store", title: item.name, onClick: () => setView("Stores") })),
      ...data.runs.map(item => ({ type: "Analysis", title: titleCase(item.toolId), onClick: () => setView("Analysis") })),
      ...data.issues.map(item => ({ type: "Issue", title: item.title, onClick: () => setView("Issues") })),
      ...data.reports.map(item => ({ type: "Report", title: item.title, onClick: () => setView("Reports") })),
      ...data.drafts.map(item => ({ type: "Draft", title: item.title, onClick: () => setView("Projects") })),
    ];
    return records.filter(item => String(item.title ?? "").toLowerCase().includes(needle)).slice(0, 8);
  }, [data, search]);

  const selectTool = (next: AnalysisTool) => {
    setTool(next);
    setSource(next.sources[0]!);
    setNotice(null);
  };

  const createPublicUrlSource = async () => {
    if (!workspaceId || !createUrlName.trim() || !createUrl.trim()) return setNotice("Enter a source name and valid public URL.");
    setBusy(true); setNotice(null);
    try {
      await workspaceClient.workspace.stores.createPublicUrlSource.mutate({ workspaceId, name: createUrlName.trim(), url: createUrl.trim() });
      setCreateUrlName(""); setCreateUrl(""); setNotice("Public URL source recorded in your workspace.");
      await refresh();
    } catch (reason) { setNotice(reason instanceof Error ? reason.message : "The public URL source could not be saved."); } finally { setBusy(false); }
  };

  const connectStore = async () => {
    if (!workspaceId || !connectStoreName.trim() || !connectStoreUrl.trim()) return setNotice("Enter a store name and valid store URL before connecting.");
    setBusy(true); setNotice(null); setProviderAuthorizationUrl(null);
    try {
      const store = await workspaceClient.workspace.stores.create.mutate({ workspaceId, name: connectStoreName.trim(), platform: connectPlatform, url: connectStoreUrl.trim() });
      const connection = await workspaceClient.workspace.stores.beginConnection.mutate({ workspaceId, storeId: Number(store.id), provider: connectPlatform });
      const authorizationUrl = String(connection?.authorization?.url ?? "");
      setProviderAuthorizationUrl(authorizationUrl || null);
      setNotice(authorizationUrl ? "Your store record was created. Continue to the provider authorization page to approve the requested connection." : String(connection?.readiness?.message || "Connection setup was requested. Follow the provider instructions to continue."));
      await refresh();
    } catch (reason) { setNotice(reason instanceof Error ? reason.message : "The store connection could not be started."); } finally { setBusy(false); }
  };

  const uploadSource = async () => {
    if (!workspaceId || !activeStore || !selectedFile) return setNotice("Choose an existing workspace store or URL source and a file before uploading.");
    if (selectedFile.size > 8 * 1024 * 1024) return setNotice("Upload a file smaller than 8 MB.");
    setBusy(true); setNotice(null);
    try {
      const result = await workspaceClient.workspace.stores.uploadSource.mutate({ workspaceId, storeId: Number(activeStore.id), fileName: selectedFile.name, mimeType: selectedFile.type || "application/octet-stream", contentBase64: await toBase64(selectedFile), sourceType: selectedFile.type.startsWith("image/") ? "screenshot" : "manual_upload" });
      if (selectedFile.type.startsWith("image/")) setPreviewUrl(URL.createObjectURL(selectedFile));
      setNotice(`Uploaded ${selectedFile.name} to your workspace source record.`);
      await refresh();
      return result;
    } catch (reason) { setNotice(reason instanceof Error ? reason.message : "The file could not be uploaded."); } finally { setBusy(false); }
  };

  const runSelectedTool = async () => {
    if (!workspaceId) return setNotice("Your workspace is still loading.");
    if (source === "URL" && !sourceUrl.trim()) return setNotice("Enter a public URL before running this analysis.");
    if (source === "Connected Store" && !activeStore) return setNotice("Choose one of your connected workspace stores.");
    if ((source === "Uploaded File" || source === "Developer Source / Code") && !selectedFile) return setNotice("Upload a file first so the run can use a real source record.");
    if (source === "Project / Saved Analysis" && !sourceDraftId) return setNotice("Choose a saved draft from your workspace before running this analysis.");
    if (tool.requiresConnection && activeStore?.status !== "connected") return setNotice("This analysis requires an authorized connected store.");
    setBusy(true); setNotice(null);
    try {
      const sourceType = source === "URL" ? "public_url" : source === "Connected Store" ? "connected_store" : source === "Project / Saved Analysis" ? "saved_draft" : "upload";
      const queued = await workspaceClient.workspace.queueToolRun.mutate({ workspaceId, storeId: activeStore ? Number(activeStore.id) : undefined, draftId: source === "Project / Saved Analysis" ? sourceDraftId : undefined, toolId: tool.executionId, sourceType, inputSummary: source === "URL" ? { url: sourceUrl.trim(), analysisLabel: tool.name } : { analysisLabel: tool.name, source } });
      if (source === "URL" && tool.publicUrlExecutable) {
        await workspaceClient.workspace.executePublicUrlToolRun.mutate({ workspaceId, toolRunId: Number(queued.id) });
        setNotice(`${tool.name} completed. Its evidence, report, and observed issues are now in your workspace.`);
      } else {
        await workspaceClient.workspace.startToolRun.mutate({ workspaceId, toolRunId: Number(queued.id) });
        setNotice(`${tool.name} is now running with your selected ${source.toLowerCase()} source. It will appear in Analysis when its supported executor completes.`);
      }
      setView("Analysis");
      await refresh();
    } catch (reason) { setNotice(reason instanceof Error ? reason.message : "This analysis could not be started."); } finally { setBusy(false); }
  };

  const updatePreference = async (field: string, value: boolean) => {
    try { await workspaceClient.account.updatePreferences.mutate({ [field]: value }); await refresh(); setNotice("Notification preference saved."); } catch (reason) { setNotice(reason instanceof Error ? reason.message : "The preference could not be updated."); }
  };

  const requestDesignProposal = async () => {
    const provider = data.aiReadiness.find(item => item.provider === "cloudflare_workers_ai");
    if (!workspaceId || !provider?.configured) return setNotice(provider?.message || "No AI provider is configured for this deployment.");
    if (!aiMessage.trim()) return setNotice("Describe the proposed design change before requesting AI assistance.");
    setBusy(true); setNotice(null); setAiProposal(null); setAiProviderError(null);
    try {
      const result = await workspaceClient.workspace.designCopilot.mutate({ workspaceId, message: aiMessage.trim(), context: { workspace: String(data.workspace?.name || "FerixRG workspace"), sourceBoundary: "Proposal only. Review before applying." } });
      setAiProposal(String(result.response || "The AI provider returned no proposal text."));
      setAiRemainingCapacity(typeof result.remainingEstimatedNeurons === "number" ? result.remainingEstimatedNeurons : null);
      setNotice(`Design Copilot proposal received from ${result.model}. It has not changed a draft, store, or release.`);
      await refresh();
    } catch (reason) { const message = reason instanceof Error ? reason.message : "The AI proposal could not be generated."; setAiProviderError(message); setNotice(message); } finally { setBusy(false); }
  };

  const createDraft = async () => {
    if (!workspaceId || !draftTitle.trim()) return setNotice("Enter a draft title before creating it.");
    setBusy(true); setNotice(null);
    try {
      const draft = await workspaceClient.workspace.createDraft.mutate({ workspaceId, title: draftTitle.trim(), source: "manual", label: draftTitle.trim(), designState: JSON.stringify({ source: "manual", createdFrom: "authenticated_studio" }), createdByType: "user" });
      setDraftTitle(""); setSelectedDraftId(Number(draft.id)); setNotice("Draft created in your workspace. Save a version before validation or release.");
      await refresh();
    } catch (reason) { setNotice(reason instanceof Error ? reason.message : "The draft could not be created."); } finally { setBusy(false); }
  };

  const loadDraftVersions = async (draftId: number) => {
    if (!workspaceId) return;
    setSelectedDraftId(draftId); setSelectedVersionId(null); setReleaseReadiness(null); setBusy(true); setNotice(null);
    try { const versions = await workspaceClient.workspace.draftVersions.query({ workspaceId, draftId }); setDraftVersions(versions); if (!versions.length) setNotice("This draft has no saved version yet. Save a version in the editor before validation."); }
    catch (reason) { setNotice(reason instanceof Error ? reason.message : "The draft versions could not be loaded."); }
    finally { setBusy(false); }
  };

  const queueValidation = async () => {
    if (!workspaceId || !selectedVersionId) return setNotice("Choose a saved draft version before queueing validation.");
    setBusy(true); setNotice(null);
    try { await workspaceClient.workspace.queueValidationRun.mutate({ workspaceId, draftVersionId: selectedVersionId }); setNotice("Validation was queued for the selected saved version."); await refresh(); }
    catch (reason) { setNotice(reason instanceof Error ? reason.message : "Validation could not be queued."); }
    finally { setBusy(false); }
  };

  const checkReleaseReadiness = async () => {
    if (!workspaceId || !selectedVersionId) return setNotice("Choose a saved draft version before checking release readiness.");
    setBusy(true); setReleaseReadiness(null);
    try { const result = await workspaceClient.workspace.releaseEligibility.query({ workspaceId, draftVersionId: selectedVersionId, actionType: "export" }); setReleaseReadiness(JSON.stringify(result)); }
    catch (reason) { setReleaseReadiness(reason instanceof Error ? reason.message : "Release readiness could not be checked."); }
    finally { setBusy(false); }
  };

  const openRunResult = async (run: WorkspaceRecord) => {
    if (!workspaceId) return;
    setBusy(true); setNotice(null); setSelectedRun(run); setSelectedRunEvidence([]);
    try { const evidence = await workspaceClient.workspace.toolEvidence.query({ workspaceId, toolRunId: Number(run.id) }); setSelectedRunEvidence(evidence); }
    catch (reason) { setNotice(reason instanceof Error ? reason.message : "Result evidence could not be loaded."); }
    finally { setBusy(false); }
  };

  const downloadReport = async (report: WorkspaceRecord) => {
    if (!workspaceId) return;
    setBusy(true); setNotice(null);
    try { const artifact = await workspaceClient.workspace.reportDownload.mutate({ workspaceId, reportId: Number(report.id) }); window.open(String(artifact.url), "_blank", "noopener,noreferrer"); }
    catch (reason) { setNotice(reason instanceof Error ? reason.message : "This report does not have a downloadable artifact yet."); }
    finally { setBusy(false); }
  };

  const overview = <>
    <div className="hero-card"><div><span className="eyebrow">Workspace pulse</span><h1>{data.profile?.name ? `Welcome back, ${data.profile.name}.` : "Your workspace"}</h1><p>{data.stores.length || data.runs.length ? "Your authenticated workspace data and next review steps." : "Add a public URL, connect a store, or run your first analysis."}</p><button className="primary" onClick={() => setView("Tools")}>Run analysis <ArrowUpRight size={16} /></button></div><div className="pulse-ring"><div><strong>{data.dashboard?.health?.average ?? "—"}</strong><span>health score</span></div></div></div>
    <div className="stats-grid"><article className="stat-card mint"><span>Stores</span><strong>{data.dashboard?.stores?.total ?? 0}</strong><em>{data.dashboard?.stores?.connected ?? 0} connected</em></article><article className="stat-card blue"><span>Open issues</span><strong>{data.dashboard?.issues?.open ?? 0}</strong><em>{data.dashboard?.issues?.total ?? 0} total</em></article><article className="stat-card violet"><span>Completed analyses</span><strong>{data.dashboard?.runs?.completed ?? 0}</strong><em>{data.dashboard?.runs?.running ?? 0} running</em></article></div>
    <div className="content-grid"><section className="panel chart-panel"><div className="panel-heading"><h2>Workspace status</h2><button className="ghost" onClick={() => setView("Analysis")}>View analysis <ChevronRight size={15} /></button></div><div className="chart"><div className="chart-line" /><div className="chart-labels"><span>{data.dashboard?.runs?.queued ?? 0} queued</span><span>{data.dashboard?.runs?.running ?? 0} running</span><span>{data.dashboard?.runs?.completed ?? 0} completed</span></div></div></section><section className="panel activity-panel"><div className="panel-heading"><h2>Recent activity</h2><Activity size={17} /></div>{data.activity.length ? data.activity.slice(0, 4).map((item, index) => <div className="activity-row" key={item.id ?? `${item.eventType}-${index}`}><span className={`activity-dot dot-${index % 4}`} /><div><strong>{titleCase(item.eventType)}</strong><small>{formatDate(item.createdAt)}</small></div></div>) : <EmptyState title="No activity yet" detail="Activity appears after you add a source, run an analysis, or save a workspace record." />}</section></div>
    <section className="panel opportunity-panel"><div className="panel-heading"><h2>Open issues</h2><button className="ghost" onClick={() => setView("Issues")}>View all <ArrowUpRight size={15} /></button></div>{data.issues.length ? <div className="opportunity-grid">{data.issues.filter(item => item.status !== "resolved").slice(0, 3).map(item => <button className="opportunity" key={item.id} onClick={() => setView("Issues")}><div><Status value={item.severity} /><h3>{item.title}</h3><p>{item.location || "Workspace evidence"}</p></div><ArrowUpRight size={18} /></button>)}</div> : <EmptyState title="No issues have been recorded" detail="Completed analyses will add observed issues here when the source evidence supports them." />}</section>
  </>;

  const storesView = <section className="store-page"><div className="page-intro store-intro"><div><span className="eyebrow">Workspace / Stores</span><h1>Stores & sources</h1><p>Only sources and stores in your workspace appear here.</p></div></div><section className="panel connect-store-panel"><Globe2 size={20} /><div><strong>Add a public URL source</strong><small>Create a real workspace source before running URL analysis.</small></div><div className="source-form"><input value={createUrlName} onChange={event => setCreateUrlName(event.target.value)} placeholder="Source name" /><input value={createUrl} onChange={event => setCreateUrl(event.target.value)} placeholder="https://example.com" /><button className="secondary" disabled={busy} onClick={createPublicUrlSource}>Save source</button></div></section><section className="panel connect-store-panel"><Store size={20} /><div><strong>Connect a store</strong><small>Create an owned store record, then continue only if the selected provider is configured.</small></div><div className="source-form"><input value={connectStoreName} onChange={event => setConnectStoreName(event.target.value)} placeholder="Store name" /><input value={connectStoreUrl} onChange={event => setConnectStoreUrl(event.target.value)} placeholder="https://your-store.example" /><select value={connectPlatform} onChange={event => setConnectPlatform(event.target.value)}><option value="shopify">Shopify</option><option value="woocommerce">WooCommerce</option><option value="magento">Magento</option><option value="custom">Custom</option></select><button className="secondary" disabled={busy} onClick={connectStore}>Start connection</button></div>{providerAuthorizationUrl ? <a className="text-button" href={providerAuthorizationUrl}>Continue provider authorization <ArrowUpRight size={14} /></a> : null}</section>{data.stores.length ? <div className="store-list">{data.stores.map(store => <article className="panel store-card" key={store.id}><div className="store-card-mark">{String(store.name ?? "S").slice(0, 1)}</div><div className="store-card-main"><div><Status value={store.status} /><h2>{store.name}</h2></div><p>{titleCase(store.platform)} · {store.url}</p><div className="store-card-meta"><span><Activity size={13} /> {formatDate(store.updatedAt)}</span><span><Package size={13} /> Health {store.healthScore ?? "not measured"}</span></div></div></article>)}</div> : <EmptyState title="No stores or sources yet" detail="Add a public URL source or connect a supported store. Nothing from another user’s workspace is shown here." />}</section>;

  const runsView = <section className="workspace-hub"><div className="page-intro workspace-hub-intro"><div><span className="eyebrow">Workspace / Analysis</span><h1>Analysis</h1><p>Each row is an authenticated tool-run record from this workspace.</p></div><button className="primary" onClick={() => setView("Tools")}>Open tools <ArrowUpRight size={16} /></button></div>{selectedRun ? <section className="panel tool-setup"><div><span className="eyebrow">Analysis result</span><h2>{titleCase(selectedRun.toolId)}</h2><p>{titleCase(selectedRun.status)} · {titleCase(selectedRun.sourceType)} · {formatDate(selectedRun.completedAt || selectedRun.createdAt)}</p>{selectedRun.errorMessage && <p className="workspace-error">{selectedRun.errorMessage}</p>}</div><div className="workspace-card-list">{selectedRunEvidence.length ? selectedRunEvidence.map(evidence => <article className="panel workspace-item" key={evidence.id}><div><Status value={evidence.kind} /><h2>{evidence.title}</h2><p>{evidence.sourceUrl || "Workspace-owned evidence"}</p></div></article>) : <EmptyState title="No evidence artifact yet" detail="Evidence appears when the selected executor completes a supported source inspection." />}</div><div className="editor-footer-actions"><button className="secondary" onClick={() => setSelectedRun(null)}>Back to analyses</button><button className="primary" onClick={() => setView(["visual-design-analyzer", "responsive-analyzer", "accessibility-analyzer"].includes(String(selectedRun.toolId)) ? "Studio" : "Specialist")}>{["visual-design-analyzer", "responsive-analyzer", "accessibility-analyzer"].includes(String(selectedRun.toolId)) ? "Open visual review" : "Open specialist handoff"}</button></div></section> : data.runs.length ? <div className="workspace-card-list">{data.runs.map(run => <article className="panel workspace-item" key={run.id}><div><Status value={run.status} /><h2>{titleCase(run.toolId)}</h2><p>{titleCase(run.sourceType)} · {formatDate(run.createdAt)}</p>{run.errorMessage && <small className="workspace-error">{run.errorMessage}</small>}</div><button className="secondary" onClick={() => void openRunResult(run)}>View result <ChevronRight size={15} /></button></article>)}</div> : <EmptyState title="No analysis runs yet" detail="Run one of the approved analysis tools using a source in your workspace." action={{ label: "Open tools", onClick: () => setView("Tools") }} />}</section>;

  const issuesView = <section className="workspace-hub"><div className="page-intro workspace-hub-intro"><div><span className="eyebrow">Workspace / Issues</span><h1>Issues</h1><p>Only observed issues created from your workspace sources are listed.</p></div></div>{data.issues.length ? <div className="issue-queue">{data.issues.map(issue => <article className="panel" key={issue.id}><Status value={issue.severity} /><div><h2>{issue.title}</h2><p>{issue.location || "Workspace evidence"} · {titleCase(issue.status)}</p></div><button className="text-button" onClick={() => setView("Analysis")}>Open analysis <ArrowUpRight size={14} /></button></article>)}</div> : <EmptyState title="No issues recorded" detail="Issues appear only after a real completed analysis produces source-bounded evidence." />}</section>;

  const reportsView = <section className="workspace-hub"><div className="page-intro workspace-hub-intro"><div><span className="eyebrow">Workspace / Reports</span><h1>Reports</h1><p>Reports are generated from your completed analysis or AI proposal records.</p></div></div>{data.reports.length ? <div className="workspace-card-list">{data.reports.map(report => <article className="panel workspace-item" key={report.id}><div><Status value={report.format} /><h2>{report.title}</h2><p>{report.summary || "No report summary provided."}</p></div><button className="secondary" disabled={busy || !report.storageKey} onClick={() => void downloadReport(report)}>{report.storageKey ? "Download" : "No artifact"}</button></article>)}</div> : <EmptyState title="No reports available" detail="A report appears after an analysis or reviewable proposal creates one for this workspace." />}</section>;

  const toolsView = <section className="tool-page"><div className="page-intro"><div><span className="eyebrow">Workspace / Tools</span><h1>Analysis tools</h1><p>Select an approved analysis and provide a compatible real source.</p></div></div><div className="tool-library">{analysisTools.map(item => <button className={tool.id === item.id ? "tool-library-card active" : "tool-library-card"} onClick={() => selectTool(item)} key={item.id}><Wand2 size={17} /><strong>{item.name}</strong><small>{item.description}</small></button>)}</div><section className="panel tool-setup"><div><span className="eyebrow">Selected analysis</span><h2>{tool.name}</h2><p>{tool.description}</p></div><div className="tool-source-row">{tool.sources.map(item => <button className={source === item ? "active" : ""} onClick={() => setSource(item)} key={item}>{item}</button>)}</div>{source === "URL" && <input className="tool-input" value={sourceUrl} onChange={event => setSourceUrl(event.target.value)} placeholder="https://store.example/page" />}{source === "Project / Saved Analysis" ? <select className="tool-input" value={sourceDraftId ?? ""} onChange={event => setSourceDraftId(event.target.value ? Number(event.target.value) : null)}><option value="">Choose saved draft</option>{data.drafts.map(draft => <option value={draft.id} key={draft.id}>{draft.title} · {titleCase(draft.status)}</option>)}</select> : source !== "URL" ? <select className="tool-input" value={sourceStoreId ?? ""} onChange={event => setSourceStoreId(event.target.value ? Number(event.target.value) : null)}><option value="">Choose workspace source</option>{data.stores.map(store => <option value={store.id} key={store.id}>{store.name} · {titleCase(store.status)}</option>)}</select> : null}{(source === "Uploaded File" || source === "Developer Source / Code") && <><input className="tool-input" type="file" accept={source === "Developer Source / Code" ? ".css,.js,.jsx,.ts,.tsx,.json,.liquid,.html,.zip,.txt" : "image/png,image/jpeg,image/webp,.zip,.json,.csv,.pdf"} onChange={(event: ChangeEvent<HTMLInputElement>) => setSelectedFile(event.target.files?.[0] ?? null)} /><button className="secondary" disabled={busy || !selectedFile} onClick={uploadSource}><Upload size={15} /> Upload selected file</button>{source === "Developer Source / Code" ? <small>Developer files are stored as owned source attachments only. FerixRG does not execute uploaded code or claim code-level findings until a supported server-side executor provides them.</small> : null}{previewUrl && <img className="uploaded-source-preview" src={previewUrl} alt="Uploaded source preview" />}</>}<button className="primary" disabled={busy} onClick={runSelectedTool}>{busy ? "Working…" : "Run analysis"} <ArrowUpRight size={16} /></button>{notice && <p className="workspace-notice">{notice}</p>}</section></section>;

  const projectsView = <section className="project-page"><div className="page-intro project-intro"><div><span className="eyebrow">Workspace / Projects</span><h1>Projects</h1><p>Projects are derived from real drafts and tool-run records.</p></div></div>{data.drafts.length || data.runs.length ? <div className="project-list">{[...data.drafts.map(draft => ({ id: `draft-${draft.id}`, title: draft.title, state: draft.status, detail: draft.label || "Saved draft" })), ...data.runs.map(run => ({ id: `run-${run.id}`, title: titleCase(run.toolId), state: run.status, detail: `${titleCase(run.sourceType)} analysis` }))].map(project => <article className="panel project-card" key={project.id}><div className="project-card-main"><Status value={project.state} /><h2>{project.title}</h2><p>{project.detail}</p></div></article>)}</div> : <EmptyState title="No projects yet" detail="A saved draft or tool run creates the first project record for this workspace." action={{ label: "Open tools", onClick: () => setView("Tools") }} />}</section>;

  const studioView = <section className="workspace-hub"><div className="page-intro workspace-hub-intro"><div><span className="eyebrow">Create / Studio</span><h1>Studio</h1><p>Saved drafts and versions from this workspace appear here.</p></div></div>{selectedRun ? <section className="panel specialist-context"><div><span className="eyebrow">Retained result context</span><h2>{titleCase(selectedRun.toolId)}</h2><p>{selectedRunEvidence.length ? `${selectedRunEvidence.length} evidence record${selectedRunEvidence.length === 1 ? "" : "s"} remain attached to this review.` : "No evidence artifact has been generated yet."}</p></div><Status value={selectedRun.status} /></section> : null}<section className="panel tool-setup"><div><span className="eyebrow">New draft</span><h2>Create a reviewable draft</h2><p>A draft is saved to your authenticated workspace. It does not publish or change a store.</p></div><input className="tool-input" value={draftTitle} onChange={event => setDraftTitle(event.target.value)} placeholder="Draft title" /><button className="primary" disabled={busy} onClick={createDraft}>Create draft</button></section>{data.drafts.length ? <div className="workspace-card-list">{data.drafts.map(draft => <article className="panel workspace-item" key={draft.id}><div><Status value={draft.status} /><h2>{draft.title}</h2><p>{draft.label || "Untitled version"} · {formatDate(draft.updatedAt)}</p></div><button className="secondary" onClick={() => { void loadDraftVersions(Number(draft.id)); setView("Validate"); }}>Open validation <ChevronRight size={15} /></button></article>)}</div> : <EmptyState title="No saved drafts" detail="Create a reviewable draft from a completed analysis before opening Studio." />}</section>;

  const validateView = <section className="workspace-hub"><div className="page-intro workspace-hub-intro"><div><span className="eyebrow">Create / Validate</span><h1>Validate</h1><p>Validation and release readiness use saved workspace draft versions.</p></div></div><section className="panel tool-setup"><div><span className="eyebrow">Draft version</span><h2>Choose evidence to validate</h2><p>Only a saved draft version can be queued for validation or checked for release eligibility.</p></div><select className="tool-input" value={selectedDraftId ?? ""} onChange={event => event.target.value && void loadDraftVersions(Number(event.target.value))}><option value="">Choose draft</option>{data.drafts.map(draft => <option value={draft.id} key={draft.id}>{draft.title}</option>)}</select>{selectedDraftId ? <select className="tool-input" value={selectedVersionId ?? ""} onChange={event => setSelectedVersionId(event.target.value ? Number(event.target.value) : null)}><option value="">Choose saved version</option>{draftVersions.map(version => <option value={version.id} key={version.id}>{version.label || `Version ${version.id}`} · {formatDate(version.createdAt)}</option>)}</select> : null}<div className="editor-footer-actions"><button className="secondary" disabled={busy || !selectedVersionId} onClick={queueValidation}>Queue validation</button><button className="primary" disabled={busy || !selectedVersionId} onClick={checkReleaseReadiness}>Check release readiness</button></div>{releaseReadiness && <pre className="workspace-notice">{releaseReadiness}</pre>}</section>{data.validations.length ? <div className="validation-queue">{data.validations.map(run => <article className="panel" key={run.id}><div><ShieldCheck size={18} /><span><h2>Draft version {run.draftVersionId}</h2><p>{formatDate(run.createdAt)}</p></span></div><Status value={run.status} /></article>)}</div> : <EmptyState title="No validation runs" detail="Queue validation from a saved draft version before release or export." />}{data.releases.length ? <section className="workspace-card-list">{data.releases.map(release => <article className="panel workspace-item" key={release.id}><div><Status value={release.status} /><h2>{titleCase(release.actionType)}</h2><p>Requested {formatDate(release.requestedAt)}{release.errorMessage ? ` · ${release.errorMessage}` : ""}</p></div></article>)}</section> : <EmptyState title="No release actions" detail="Release actions appear here only after a validated draft is exported, published, or rolled back through the permission-aware backend." />}</section>;

  const specialistView = <section className="specialist-workspace"><div className="page-intro"><div><span className="eyebrow">Workspace / Specialist handoff</span><h1>{selectedRun ? titleCase(selectedRun.toolId) : "Specialist handoff"}</h1><p>Technical and nonvisual work retains only evidence generated for the selected authenticated run.</p></div><button className="secondary" onClick={() => setView("Analysis")}><ArrowLeft size={16} /> Analysis</button></div>{selectedRun ? <><section className="panel specialist-context"><div><span className="eyebrow">Retained run context</span><h2>{titleCase(selectedRun.toolId)}</h2><p>{titleCase(selectedRun.sourceType)} · {titleCase(selectedRun.status)} · {formatDate(selectedRun.completedAt || selectedRun.createdAt)}</p></div><Status value={selectedRun.status} /></section><section className="panel specialist-finding"><div><span className="eyebrow">Evidence boundary</span><h2>{selectedRunEvidence.length} retained evidence record{selectedRunEvidence.length === 1 ? "" : "s"}</h2><p>Use only the stored evidence and report artifacts for this technical review. No inferred code, store access, or change is applied here.</p></div><div>{selectedRunEvidence.map(item => <p key={item.id}>{item.title}</p>)}</div></section><section className="panel flow-action-panel"><div><span className="eyebrow">Next step</span><h2>Review, then validate or create a developer handoff.</h2><p>Release actions remain permission-aware and require a saved draft version.</p></div><div className="specialist-actions"><button className="secondary" onClick={() => setView("Validate")}>Open validation</button><button className="primary" onClick={() => setView("Reports")}>Open reports</button></div></section></> : <EmptyState title="No selected analysis" detail="Open a completed nonvisual run from Analysis to retain its evidence in this specialist handoff." />}</section>;

  const aiProvider = data.aiReadiness.find(item => item.provider === "cloudflare_workers_ai");
  const redesignView = <section className="workspace-hub"><div className="page-intro workspace-hub-intro"><div><span className="eyebrow">Create / Redesign</span><h1>Redesign</h1><p>AI proposals are review-only and do not change a draft, store, or release.</p></div><button className="primary" onClick={() => setView("Analysis")}>Choose analysis <ArrowUpRight size={16} /></button></div><section className="panel tool-setup"><div><span className="eyebrow">AI provider</span><h2>{aiProvider?.configured ? "Cloudflare Workers AI is ready" : "AI provider is not ready"}</h2><p>{aiProvider?.message || "Provider readiness could not be loaded for this authenticated workspace."}</p>{aiRemainingCapacity !== null ? <small>Estimated protected daily capacity remaining: {aiRemainingCapacity} neurons.</small> : <small>Remaining capacity is shown after the first successful Design Copilot request.</small>}{aiProviderError ? <p className="workspace-error" role="alert">{aiProviderError}</p> : null}</div><textarea className="tool-input" value={aiMessage} onChange={event => setAiMessage(event.target.value)} placeholder="Describe the design change you want to review…" aria-label="Design Copilot request" /><button className="primary" disabled={busy || !aiProvider?.configured} onClick={requestDesignProposal}><Sparkles size={16} /> {busy ? "Requesting proposal…" : "Generate reviewable proposal"}</button>{aiProposal && <section className="panel specialist-proposal"><div><span className="eyebrow">Reviewable proposal</span><h2>AI response</h2><p>{aiProposal}</p></div><div className="specialist-proposal-tags"><span>Not applied</span><span>Review required</span><span>Recorded to workspace activity</span></div></section>}</section></section>;

  const profileView = <section className="workspace-hub"><div className="page-intro workspace-hub-intro"><div><span className="eyebrow">Account / Profile</span><h1>Profile</h1><p>Account details are loaded from your authenticated profile.</p></div></div><section className="panel account-profile"><div className="account-avatar">{String(data.profile?.name ?? "U").slice(0, 2).toUpperCase()}</div><div><h2>{data.profile?.name || "No profile name"}</h2><p>{data.profile?.email || "No verified email available"}</p></div></section></section>;

  const notificationsView = <section className="workspace-hub"><div className="page-intro workspace-hub-intro"><div><span className="eyebrow">Account / Notifications</span><h1>Notifications</h1><p>Alerts reflect completed or failed workspace actions and saved account preferences.</p></div></div><div className="preference-list">{[["analysisReadyNotifications", "Analysis ready", "Notify when a real analysis completes"], ["draftReviewNotifications", "Draft review", "Notify when a saved draft needs review"], ["publishingReadinessNotifications", "Release readiness", "Notify when release prerequisites change"]].map(([field, title, detail]) => <article className="panel" key={field}><div><h2>{title}</h2><p>{detail}</p></div><button className={data.preferences?.[field] ? "primary" : "secondary"} onClick={() => updatePreference(field, !data.preferences?.[field])}>{data.preferences?.[field] ? "On" : "Off"}</button></article>)}</div>{notifications.length ? <div className="workspace-card-list">{notifications.map(item => <article className="panel workspace-item" key={`${item.id}-${item.createdAt}`}><div><Status value={item.status} /><h2>{item.toolId ? titleCase(item.toolId) : `Validation ${item.id}`}</h2><p>{formatDate(item.completedAt || item.createdAt)}</p></div></article>)}</div> : <EmptyState title="No notifications yet" detail="Completed, failed, and review-required workspace records will appear here when notification preferences are enabled." />}</section>;

  const teamView = <section className="workspace-hub"><div className="page-intro workspace-hub-intro"><div><span className="eyebrow">Account / Team</span><h1>Team & members</h1><p>Only actual workspace members are listed.</p></div></div>{data.members.length ? <div className="team-list">{data.members.map(member => <article className="panel" key={member.id}><span className="team-avatar">{String(member.userId).slice(-2)}</span><div><h2>Member {member.userId}</h2><p>{titleCase(member.role)} · joined {formatDate(member.joinedAt)}</p></div><Status value={member.role} /></article>)}</div> : <EmptyState title="No members found" detail="This workspace has no visible membership records." />}</section>;

  const billingView = <section className="workspace-hub"><div className="page-intro workspace-hub-intro"><div><span className="eyebrow">Account / Billing</span><h1>Billing</h1><p>Subscription and usage values are read from this authenticated workspace.</p></div></div>{data.subscription ? <section className="panel billing-summary"><div><span className="eyebrow">Current subscription</span><h2>{data.subscription.planName || data.subscription.plan || "Workspace plan"}</h2><p>{titleCase(data.subscription.status || "active")}</p></div><Status value={data.subscription.status || "active"} /></section> : <EmptyState title="No subscription record" detail="The backend has not returned a subscription record for this workspace." />}{data.usageSummary ? <div className="account-setting-grid">{Object.entries(data.usageSummary).filter(([, value]) => typeof value !== "object").map(([label, value]) => <article className="panel" key={label}><span>{titleCase(label)}</span><strong>{String(value ?? "—")}</strong></article>)}</div> : <EmptyState title="No usage summary" detail="Usage values are permission-controlled and appear when the backend provides them." />}</section>;

  const helpView = <section className="workspace-hub"><div className="page-intro workspace-hub-intro"><div><span className="eyebrow">Account / Help</span><h1>Help</h1><p>Use real sources, review completed evidence, then validate before release.</p></div></div><div className="help-list"><article className="panel"><CircleHelp size={18} /><div><h2>Start with a source</h2><p>Add a URL source, connect a store, or upload an owned file before analysis.</p></div></article><article className="panel"><CheckCircle2 size={18} /><div><h2>Review before applying</h2><p>AI proposals and releases remain permission-aware and reviewable.</p></div></article></div></section>;

  const settingsView = <section className="workspace-hub"><div className="page-intro workspace-hub-intro"><div><span className="eyebrow">Workspace / Settings</span><h1>Settings</h1><p>Open authenticated account and workspace settings.</p></div></div><div className="settings-link-grid">{accountNavigation.filter(item => item.view !== "Help").map(item => { const Icon = item.icon; return <button className="panel" onClick={() => setView(item.view)} key={item.view}><Icon size={18} /><span><strong>{item.label}</strong><small>Open {item.label.toLowerCase()}</small></span><ChevronRight size={16} /></button>; })}</div></section>;

  let content = overview;
  if (loading) content = <EmptyState title="Loading your workspace" detail="FerixRG is loading only the data available to this authenticated session." />;
  else if (error) content = <EmptyState title="Workspace data is unavailable" detail={error} action={{ label: "Try again", onClick: () => void refresh() }} />;
  else if (view === "Stores") content = storesView;
  else if (view === "Analysis") content = runsView;
  else if (view === "Issues") content = issuesView;
  else if (view === "Reports") content = reportsView;
  else if (view === "Tools") content = toolsView;
  else if (view === "Projects") content = projectsView;
  else if (view === "Studio") content = studioView;
  else if (view === "Validate") content = validateView;
  else if (view === "Specialist") content = specialistView;
  else if (view === "Redesign") content = redesignView;
  else if (view === "Profile") content = profileView;
  else if (view === "Notifications") content = notificationsView;
  else if (view === "Team") content = teamView;
  else if (view === "Billing") content = billingView;
  else if (view === "Help") content = helpView;
  else if (view === "Settings") content = settingsView;

  const currentLabel = navigation.find(item => item.view === view)?.label ?? view;
  return <div className="preview-shell"><aside className="sidebar"><div className="logo">FERIX<span>RG</span><small>intelligence workspace</small></div><nav>{Object.entries(groups).map(([group, items]) => <div className="nav-group" key={group}><span>{group}</span>{items.map(item => { const Icon = item.icon; return <button className={view === item.view ? "active" : ""} onClick={() => setView(item.view)} key={item.view}><Icon size={17} />{item.label}{item.view === "Issues" && data.dashboard?.issues?.open ? <b>{data.dashboard.issues.open}</b> : null}</button>; })}</div>)}</nav><button className="sidebar-store" onClick={() => setView("Stores")}><div className="store-mark">{String(data.stores[0]?.name ?? "+").slice(0, 1)}</div><div><strong>{data.stores[0]?.name ?? "Add a source"}</strong><small>{data.stores.length ? `${data.stores.length} workspace source${data.stores.length === 1 ? "" : "s"}` : "No source connected"}</small></div><ChevronRight size={15} /></button></aside>{moreOpen && <button className="mobile-more-backdrop" onClick={() => setMoreOpen(false)} aria-label="Close More panel" />}<section className={moreOpen ? "mobile-more-panel open" : "mobile-more-panel"} aria-label="More workspace items"><div className="mobile-more-heading"><div><span className="eyebrow">Workspace</span><h2>More</h2></div><button onClick={() => setMoreOpen(false)} aria-label="Close More"><X size={18} /></button></div><div className="mobile-more-list"><span>Workspace</span>{navigation.filter(item => !["Overview", "Stores", "Tools", "Projects"].includes(item.view)).map(item => { const Icon = item.icon; return <button onClick={() => { setView(item.view); setMoreOpen(false); }} key={item.view}><Icon size={17} />{item.label}<ChevronRight size={15} /></button>; })}</div><div className="mobile-more-list"><span>Account</span>{accountNavigation.map(item => { const Icon = item.icon; return <button onClick={() => { setView(item.view); setMoreOpen(false); }} key={item.view}><Icon size={17} />{item.label}<ChevronRight size={15} /></button>; })}</div></section><main className="main"><header className="topbar"><div className="breadcrumb"><span>Workspace</span><ChevronRight size={13} /><strong>{currentLabel}</strong></div><div className="top-actions"><label className="search"><Search size={16} /><input placeholder="Search your workspace" value={search} onChange={event => setSearch(event.target.value)} />{searchResults.length ? <div className="search-results">{searchResults.map((item, index) => <button onClick={() => { item.onClick(); setSearch(""); }} key={`${item.type}-${item.title}-${index}`}><small>{item.type}</small>{item.title}</button>)}</div> : null}</label><button className="icon-button notification" aria-label="Notifications" onClick={() => setView("Notifications")}><Bell size={17} />{notifications.length ? <i /> : null}</button><button className="avatar" aria-label="Profile" onClick={() => setView("Profile")}>{String(data.profile?.name ?? "U").slice(0, 2).toUpperCase()}</button></div></header><div className="page"><div className="mobile-kicker"><span className="eyebrow">AUTHENTICATED WORKSPACE</span><span>{data.stores.length ? `${data.stores.length} source${data.stores.length === 1 ? "" : "s"}` : "No store connected"}</span></div>{content}</div><nav className="bottom-nav" aria-label="Mobile workspace navigation">{mobileNavigation.map(item => { const Icon = item.icon; return <button className={view === item.view ? "active" : ""} onClick={() => setView(item.view)} key={item.label}><Icon size={17} /><span>{item.label}</span></button>; })}<button className={moreOpen ? "active" : ""} onClick={() => setMoreOpen(true)}><Menu size={17} /><span>More</span></button></nav></main></div>;
}
