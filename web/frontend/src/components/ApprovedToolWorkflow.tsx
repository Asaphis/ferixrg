import type { ToolDefinition, ToolSource } from "@/lib/toolCatalog";
import { getToolRoute, type ToolRoute } from "@/lib/toolRouting";
import { getRunCapability } from "@/lib/toolCapabilities";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  ChevronRight,
  Download,
  FileDown,
  History,
  ImagePlus,
  Layers3,
  Link2,
  Monitor,
  Paintbrush,
  Play,
  RefreshCw,
  Save,
  Send,
  ShieldCheck,
  Sparkles,
  Store,
  TabletSmartphone,
  Upload,
  Wand2,
} from "lucide-react";
import React, { useMemo, useState } from "react";
import { trpc } from "@/lib/trpc";
import "./approved-tool-workflow.css";
import "./approved-tool-workflow-overrides.css";
import "./exact-tool-contract.css";
import "./tool-workflow-specialist.css";

type Stage = "setup" | "processing" | "results" | "editor" | "review" | "finish";
type InspectorTab = "edit" | "ai" | "history";
type ChatMessage = { role: "user" | "assistant"; content: string };
type PublicUrlInspection = { url: string; statusCode: number; title: string | null; language: string | null; metaDescriptionLength: number; canonicalUrl: string | null; hasViewport: boolean; headingCount: number; headings?: Array<{ level: 1 | 2 | 3 | 4 | 5 | 6; text: string }>; imageCount: number; imagesWithAlt?: number; imagesWithoutAlt: number; linkCount: number; linksWithText?: number; linksWithoutText?: number; navigationLandmarkCount?: number; mainLandmarkCount?: number; bytesRead: number };
type ObservedIssue = { id: number; title: string; severity: "critical" | "high" | "medium" | "low" | "info" };

const evidenceAsset = "/manus-storage/ferixrg-analysis-evidence_b61b40c0.png";
const redesignAsset = "/manus-storage/ferixrg-redesign-compare_034828ad.png";

const stages: Array<{ id: Stage; label: string }> = [
  { id: "setup", label: "Set up" },
  { id: "processing", label: "Run" },
  { id: "results", label: "Results" },
  { id: "editor", label: "Workspace" },
  { id: "review", label: "Check" },
  { id: "finish", label: "Finish" },
];

const sourceCopy: Record<string, { detail: string; support: string }> = {
  "Connected store": { detail: "Use an already connected store and its granted context.", support: "Choose an existing connection" },
  "Public URL": { detail: "Use pages your visitors can see. You can save and download the result.", support: "Paste a public storefront URL" },
  "Specific page URL": { detail: "Use one exact page when a full-store analysis would be too broad.", support: "Paste the exact page URL" },
  Screenshots: { detail: "Use screenshots of the page or design you want to review.", support: "Upload screenshots or add a reference" },
  "Saved draft": { detail: "Continue an analysis, proposal, or design draft already in your workspace.", support: "Choose a saved project or draft" },
  "Theme files": { detail: "Use the supplied theme files to prepare a technical recommendation.", support: "Upload or select available theme files" },
  "Selected page": { detail: "Use a selected page already saved in the current project.", support: "Choose a page from the project" },
  "Selected text": { detail: "Use text or content selected for focused content work.", support: "Choose or paste the text to work on" },
  "Reference design": { detail: "Use a visual reference to extract a usable design direction.", support: "Upload a reference design" },
  "Analysis result": { detail: "Use a completed FerixRG finding as the starting context.", support: "Choose a saved analysis result" },
};

const editorLayers = ["Header", "Product media", "Product details", "Title", "Price", "Buy button", "Shipping details"];

export function ApprovedToolWorkflow({
  tool,
  onBack,
  startAt = "setup",
  startSource,
  workspaceId,
}: {
  tool: ToolDefinition;
  onBack: () => void;
  startAt?: "setup" | "results" | "editor" | "finish";
  startSource?: string;
  workspaceId?: number;
}) {
  const [stage, setStage] = useState<Stage>(startAt);
  const [source, setSource] = useState(tool.sources.includes(startSource as ToolSource) ? startSource as ToolSource : tool.sources[0] ?? "Public URL");
  const [url, setUrl] = useState("https://atelierforma.com");
  const [reportReady, setReportReady] = useState(false);
  const [selectedElement, setSelectedElement] = useState("Buy button");
  const [device, setDevice] = useState("Mobile");
  const [inspectorTab, setInspectorTab] = useState<InspectorTab>("edit");
  const [proposalVisible, setProposalVisible] = useState(false);
  const [proposalApplied, setProposalApplied] = useState(false);
  const [versionSaved, setVersionSaved] = useState(false);
  const [finishNotice, setFinishNotice] = useState("");
  const [aiInput, setAiInput] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "assistant",
      content: `I am looking at **${tool.name}** on Product page → ${selectedElement} → ${device}. Tell me what you would like to improve, or attach a visual reference.`,
    },
  ]);
  const [toolRunId, setToolRunId] = useState<number | null>(null);
  const [reportId, setReportId] = useState<number | null>(null);
  const [inspection, setInspection] = useState<PublicUrlInspection | null>(null);
  const [observedIssues, setObservedIssues] = useState<ObservedIssue[]>([]);
  const [draftId, setDraftId] = useState<number | null>(null);
  const [savedVersionCount, setSavedVersionCount] = useState(0);
  const [editorDirty, setEditorDirty] = useState(false);
  const [pendingStage, setPendingStage] = useState<Stage | null>(null);
  const [runError, setRunError] = useState("");
  const queueToolRunMutation = trpc.workspace.queueToolRun.useMutation();
  const startToolRunMutation = trpc.workspace.startToolRun.useMutation();
  const executePublicUrlToolRunMutation = trpc.workspace.executePublicUrlToolRun.useMutation();
  const reportDownloadMutation = trpc.workspace.reportDownload.useMutation();
  const designCopilotMutation = trpc.workspace.designCopilot.useMutation();
  const createDraftMutation = trpc.workspace.createDraft.useMutation();
  const saveDraftVersionMutation = trpc.workspace.saveDraftVersion.useMutation();

  const isConnected = source === "Connected store";
  const route = getToolRoute(tool.id);
  const capability = getRunCapability(source, route);
  const routeUsesReview = route.workspace === "Release Review" || route.workspace === "Validation Workspace" || route.workspace === "Version & Comparison";
  const sourceDetail = sourceCopy[source] ?? sourceCopy["Public URL"];
  const stageIndex = stages.findIndex(item => item.id === stage);
  const scope = capability.scope;
  const editorDraftLabel = draftId ? (savedVersionCount ? `Saved version ${savedVersionCount}` : "Saved workspace draft") : "Unsaved workspace draft";
  const observedHost = useMemo(() => {
    try { return inspection?.url ? new URL(inspection.url).hostname : "public page"; } catch { return "public page"; }
  }, [inspection]);
  const statusSummary = useMemo(() => {
    if (inspection) return `Observed ${inspection.title ? `“${inspection.title}”` : observedHost} with HTTP ${inspection.statusCode}. Review the stored inspection evidence before acting on it.`;
    return "This run has no executor-created evidence yet. A result can be reviewed only after a supported executor records it.";
  }, [inspection, observedHost]);

  const move = (next: Stage) => {
    setStage(next);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const requestEditorExit = (next: Stage) => {
    if (stage === "editor" && editorDirty) {
      setPendingStage(next);
      setFinishNotice("You have unsaved editor changes. Save this version or discard the changes before continuing.");
      return;
    }
    move(next);
  };

  const openCorrectWorkspace = () => move(routeUsesReview ? "review" : "editor");

  const sourceType = source === "Connected store" ? "connected_store" : source === "Saved draft" ? "saved_draft" : source === "Screenshots" || source === "Reference design" || source === "Theme files" ? "upload" : source === "Public URL" || source === "Specific page URL" ? "public_url" : "manual";
  const beginLiveToolRun = async () => {
    try {
      if (!workspaceId) throw new Error("Workspace is still loading");
      setRunError("");
      const queued = await queueToolRunMutation.mutateAsync({ workspaceId, toolId: tool.id, sourceType, inputSummary: { source, url: source === "Public URL" || source === "Specific page URL" ? url : undefined } });
      const started = await startToolRunMutation.mutateAsync({ workspaceId, toolRunId: queued.id });
      if (sourceType === "public_url") {
        const execution = await executePublicUrlToolRunMutation.mutateAsync({ workspaceId, toolRunId: started.id });
        setReportId(execution.report?.id ?? null);
        setInspection(execution.inspection);
        setObservedIssues(execution.issues ?? []);
      } else { setReportId(null); setInspection(null); setObservedIssues([]); }
      setToolRunId(started.id);
      move("processing");
    } catch (error) {
      setRunError(error instanceof Error ? error.message : "We couldn’t start this tool run. Please try again.");
    }
  };

  const downloadGeneratedReport = async () => {
    try {
      if (!workspaceId || !reportId) throw new Error("A generated report artifact is not available for this run.");
      const artifact = await reportDownloadMutation.mutateAsync({ workspaceId, reportId });
      window.open(artifact.url, "_blank", "noopener,noreferrer");
      setReportReady(true);
    } catch (error) {
      setFinishNotice(error instanceof Error ? error.message : "We couldn’t prepare this report download.");
    }
  };

  const sendToAi = async (content: string) => {
    if (!content.trim()) return;
    setMessages(previous => [...previous, { role: "user", content }]);
    setAiInput("");
    if (tool.id !== "ai-design-copilot" || !workspaceId || !toolRunId) {
      setMessages(previous => [...previous, { role: "assistant", content: `I prepared a scoped suggestion for **${selectedElement}** on the ${device.toLowerCase()} view. It keeps the current evidence and draft context. Review it beside your current design before applying it.` }]);
      setProposalVisible(true);
      return;
    }
    try {
      const result = await designCopilotMutation.mutateAsync({ workspaceId, toolRunId, message: content, context: { tool: tool.name, page: "Product page", selectedElement, device, source } });
      setMessages(previous => [...previous, { role: "assistant", content: result.response }]);
      setProposalVisible(true);
    } catch (error) {
      setMessages(previous => [...previous, { role: "assistant", content: error instanceof Error ? error.message : "Design Copilot could not complete this request. Please try again." }]);
    }
  };

  const saveVersion = async () => {
    if (!workspaceId) {
      setFinishNotice("Your workspace is still loading. Try saving again in a moment.");
      return;
    }
    const designState = JSON.stringify({ toolId: tool.id, toolName: tool.name, source, url: source === "Public URL" || source === "Specific page URL" ? url : undefined, selectedElement, device, proposalApplied, selectedInspector: inspectorTab });
    const label = savedVersionCount ? `Saved version ${savedVersionCount + 1}` : "Initial working version";
    try {
      if (!draftId) {
        const created = await createDraftMutation.mutateAsync({ workspaceId, title: `${tool.name} draft`, source: tool.id === "ai-design-copilot" ? "ai" : "tool", label, note: `Saved from ${tool.name} in the approved editor workflow.`, designState, createdByType: proposalApplied ? "ai" : "user" });
        setDraftId(created.draft.id);
      } else {
        await saveDraftVersionMutation.mutateAsync({ workspaceId, draftId, label, note: `Saved from ${tool.name} in the approved editor workflow.`, designState, createdByType: proposalApplied ? "ai" : "user" });
      }
      setSavedVersionCount(previous => previous + 1);
      setVersionSaved(true);
      setEditorDirty(false);
      setFinishNotice("Saved to your workspace. You can compare it, restore it, or continue editing.");
    } catch (error) {
      setFinishNotice(error instanceof Error ? error.message : "We couldn’t save this version. Please try again.");
    }
  };

  const setupScreen = (
    <>
      <WorkflowHeader
        kicker={`Selected tool · ${tool.category}`}
        title={`Set up ${tool.name}.`}
        copy="Choose one supported input. Nothing runs until you start this tool."
        back={onBack}
      />
      <section className="tool-workflow-setup-grid">
        <article className="tool-workflow-card tool-workflow-tool-summary">
          <span className="tool-workflow-kicker">Selected FerixRG tool</span>
          <h2>{tool.name}</h2>
          <p>{tool.description}</p>
          <div className="tool-workflow-contract-list"><span>What this tool checks or uses</span><div>{tool.analysisFocus.slice(0, 6).map(item => <b key={item}>{item}</b>)}</div></div>
          <div className="tool-workflow-outcome">
            <Sparkles />
            <div>
              <span>What you will receive</span>
              <b>{tool.outcome}</b>
            </div>
          </div>
        </article>
        <article className="tool-workflow-card tool-workflow-source-picker">
          <span className="tool-workflow-kicker">What would you like to use?</span>
          <h2>Choose a source for this tool.</h2>
          <div className="tool-workflow-sources">
            {tool.sources.map(item => (
              <button
                className={source === item ? "active" : ""}
                onClick={() => setSource(item)}
                key={item}
              >
                <SourceIcon source={item} />
                <span>
                  <b>{item}</b>
                  <small>{sourceCopy[item]?.detail}</small>
                </span>
                {source === item ? <Check /> : <ChevronRight />}
              </button>
            ))}
          </div>
        </article>
        <article className="tool-workflow-card tool-workflow-source-detail">
          <span className="tool-workflow-kicker">{source} selected</span>
          <h2>{sourceDetail.support}</h2>
          {(source === "Public URL" || source === "Specific page URL") && (
            <label className="tool-workflow-input">
              <span>{source === "Specific page URL" ? "Page URL" : "Storefront URL"}</span>
              <div><Link2 /><input value={url} onChange={event => setUrl(event.target.value)} /></div>
            </label>
          )}
          {source === "Connected store" && (
            <div className="tool-workflow-connected-choice">
              <Store />
              <div><b>Atelier Forma</b><small>Shopify · connected</small></div>
              <Check />
            </div>
          )}
          {source === "Screenshots" && (
            <button className="tool-workflow-dropzone"><Upload /><span><b>Upload screenshots</b><small>PNG, JPG, WEBP</small></span><ImagePlus /></button>
          )}
          {source === "Saved draft" && (
            <div className="tool-workflow-connected-choice"><History /><div><b>Product page · {editorDraftLabel}</b><small>{draftId ? "Stored in this workspace" : "Save a version to store it in this workspace"}</small></div><ChevronRight /></div>
          )}
          {source === "Selected page" && <div className="tool-workflow-connected-choice"><Layers3 /><div><b>Product page</b><small>Selected from the current project</small></div><ChevronRight /></div>}
          {source === "Analysis result" && <div className="tool-workflow-connected-choice"><ShieldCheck /><div><b>Latest saved analysis</b><small>Storefront Analyzer · evidence ready</small></div><ChevronRight /></div>}
          {source === "Selected text" && <label className="tool-workflow-input"><span>Selected content</span><div><FileDown /><input defaultValue="Improve the selected product content." /></div></label>}
          {source === "Reference design" && <button className="tool-workflow-dropzone"><Upload /><span><b>Upload reference design</b><small>PNG, JPG, WEBP</small></span><ImagePlus /></button>}
          {source === "Theme files" && (
            <button className="tool-workflow-dropzone"><Upload /><span><b>Choose theme files</b><small>Use verified file context only</small></span><FileDown /></button>
          )}
          <div className="tool-workflow-scope"><ShieldCheck /><p>{scope}</p></div>
          {runError && <p className="tool-workflow-inline-notice" role="alert">{runError}</p>}
          <button className="tool-workflow-primary" disabled={queueToolRunMutation.isPending || startToolRunMutation.isPending || executePublicUrlToolRunMutation.isPending} onClick={beginLiveToolRun}><Play /> {queueToolRunMutation.isPending || startToolRunMutation.isPending || executePublicUrlToolRunMutation.isPending ? "Inspecting…" : `Run ${tool.name}`}</button>
        </article>
      </section>
    </>
  );

  const processingScreen = (
    <>
      <WorkflowHeader
        kicker={`Running · ${tool.name}`}
        title={`${tool.name} is checking your input.`}
        copy={`${source} · ${source === "Public URL" ? url.replace(/^https?:\/\//, "") : sourceDetail.support}`}
        back={() => move("setup")}
      />
      <section className="tool-workflow-processing-grid">
        <article className="tool-workflow-card tool-workflow-progress-card">
          <div className="tool-workflow-progress-ring"><b>72%</b><span>almost ready</span></div>
          <div className="tool-workflow-processing-stages">
            {[
              [`Preparing ${source.toLowerCase()} context`, "Complete"],
              [`Reviewing ${tool.analysisFocus[0]?.toLowerCase() ?? "the selected evidence"}`, "Complete"],
              [`Finding ${tool.analysisFocus[1]?.toLowerCase() ?? "issues and opportunities"}`, "Working"],
              [`Preparing ${tool.name} results`, "Next"],
              ["Creating the report", "Next"],
            ].map(([label, state], index) => <div className={state === "Working" ? "active" : state === "Complete" ? "complete" : ""} key={label}><i>{state === "Complete" ? "✓" : state === "Working" ? "●" : "○"}</i><span>{label}</span><small>{state}</small>{index < 4 && <em />}</div>)}
          </div>
          <div className="tool-workflow-scope"><ShieldCheck /><p>{scope}</p></div>
          <button className="tool-workflow-secondary" onClick={() => move("setup")}>Cancel and change source</button>
          <button className="tool-workflow-primary" onClick={() => move("results")}>{toolRunId ? "See run record" : "See result"}</button>
        </article>
        <article className="tool-workflow-card tool-workflow-context-card">
          <span className="tool-workflow-kicker">Your run</span>
          <h2>Everything stays connected to this tool.</h2>
          <div className="tool-workflow-context-list">
            <div><span>Tool</span><b>{tool.name}</b></div>
            <div><span>Input</span><b>{source}</b></div>
            <div><span>Access mode</span><b>{capability.mode}</b></div>
            <div><span>Live store changes</span><b>{capability.actions.includes("publish") ? "Eligible after review" : "Not available"}</b></div>
          </div>
        </article>
      </section>
    </>
  );

  const resultsScreen = (
    <>
      <WorkflowHeader
        kicker={`${tool.name} · result ready`}
        title={`${tool.name} found a clear next step.`}
        copy={statusSummary}
        back={() => move("processing")}
      />
      <section className="tool-workflow-results-grid">
        <article className="tool-workflow-card tool-workflow-score-card">
          <span className="tool-workflow-kicker">Your result</span>
          <h2>{inspection?.title ?? (inspection ? "Observed public page" : "No executor-created result")}</h2>
          <div className="tool-workflow-capability"><ShieldCheck /><span><b>{capability.mode}</b><small>{capability.label}</small></span></div>
          <div className="tool-workflow-score"><b>{inspection ? inspection.statusCode : "—"}</b><span>{inspection ? "HTTP response" : "no measured score"}</span></div>
          <p>{inspection ? `Observed from ${observedHost}. This is a bounded page inspection, not a visual-quality or conversion score.` : "A measured result appears only after a supported executor records evidence for this run."}</p>
          <div className="tool-workflow-stats">{inspection ? <><span><b>{inspection.headingCount}</b><small>headings observed</small></span><span><b>{inspection.imageCount}</b><small>images observed</small></span><span><b>{observedIssues.length}</b><small>observed issue records</small></span></> : <span><b>Awaiting evidence</b><small>no recorded checks</small></span>}</div>
          <button className="tool-workflow-secondary" disabled={!reportId || reportDownloadMutation.isPending} onClick={() => { void downloadGeneratedReport(); }}><Download /> {reportDownloadMutation.isPending ? "Preparing download…" : reportReady ? "Report downloaded" : reportId ? "Download report" : "No export artifact"}</button>
        </article>
        <article className="tool-workflow-card tool-workflow-evidence-card">
          <span className="tool-workflow-kicker">Where it happens</span>
          <div className="tool-workflow-evidence-visual"><img src={evidenceAsset} alt="Mobile product page evidence" /><span>Buy button</span></div>
          <div className="tool-workflow-evidence-note"><b>{inspection ? "Observed page evidence" : "No observed evidence yet"}</b><p>{inspection ? `${inspection.hasViewport ? "Viewport metadata is present" : "Viewport metadata is absent"}; ${inspection.canonicalUrl ? "a canonical URL is declared" : "no canonical URL was observed"}; ${inspection.linkCount} links were counted.` : "Run a supported executor to create evidence before a result or recommendation is shown."}</p></div>
          <div className="tool-workflow-result-metrics"><span>{inspection ? (observedIssues.length ? "Observed issue records" : "Observed fields") : "Result boundary"}</span>{inspection ? (observedIssues.length ? observedIssues.map(issue => <b key={issue.id}>{issue.severity} · {issue.title}</b>) : [inspection.language ? `Language · ${inspection.language}` : "Language not declared", `Meta description markup · ${inspection.metaDescriptionLength} chars`, `${inspection.bytesRead} bytes inspected`].map(metric => <b key={metric}>{metric}</b>)) : <b>No generated evidence</b>}</div>
          {tool.id === "heading-structure-analyzer" && inspection?.headings && <div className="tool-workflow-result-metrics"><span>Observed heading order</span>{inspection.headings.length ? inspection.headings.map((heading, index) => <b key={`${heading.level}-${index}`}>H{heading.level} · {heading.text || "No text observed"}</b>) : <b>No heading elements were observed.</b>}</div>}
          {tool.id === "image-seo-analyzer" && inspection && <div className="tool-workflow-result-metrics"><span>Observed image alternative text</span><b>{inspection.imagesWithAlt ?? Math.max(inspection.imageCount - inspection.imagesWithoutAlt, 0)} image{(inspection.imagesWithAlt ?? Math.max(inspection.imageCount - inspection.imagesWithoutAlt, 0)) === 1 ? "" : "s"} with alt text</b><b>{inspection.imagesWithoutAlt} image{inspection.imagesWithoutAlt === 1 ? "" : "s"} without alt text</b></div>}
          {tool.id === "seo-analyzer" && inspection && <div className="tool-workflow-result-metrics"><span>Observed page SEO fields</span><b>Title · {inspection.title || "not observed"}</b><b>Meta description markup · {inspection.metaDescriptionLength ? `${inspection.metaDescriptionLength} chars` : "not observed"}</b><b>Canonical · {inspection.canonicalUrl || "not observed"}</b><b>{inspection.headingCount} headings · {inspection.linkCount} links · {inspection.imageCount} images observed</b></div>}
          {tool.id === "accessibility-analyzer" && inspection && <div className="tool-workflow-result-metrics"><span>Observed accessibility indicators</span><b>Document language · {inspection.language || "not declared"}</b><b>Viewport metadata · {inspection.hasViewport ? "present" : "absent"}</b><b>Heading elements · {inspection.headingCount} observed</b><b>Images without alt text · {inspection.imagesWithoutAlt}</b></div>}
          {tool.id === "site-structure-analyzer" && inspection && <div className="tool-workflow-result-metrics"><span>Observed page structure indicators</span><b>Page host · {observedHost}</b><b>Links on this page · {inspection.linkCount}</b><b>Heading elements · {inspection.headingCount}</b><b>Canonical URL · {inspection.canonicalUrl || "not observed"}</b></div>}
          {tool.id === "navigation-analyzer" && inspection && <div className="tool-workflow-result-metrics"><span>Observed navigation indicators</span><b>Navigation landmarks · {inspection.navigationLandmarkCount ?? "not recorded"}</b><b>Main landmarks · {inspection.mainLandmarkCount ?? "not recorded"}</b><b>Links with text · {inspection.linksWithText ?? "not recorded"}</b><b>Links without text content · {inspection.linksWithoutText ?? "not recorded"}</b></div>}
        </article>
        <article className="tool-workflow-card tool-workflow-next-card">
          <span className="tool-workflow-kicker">What would you like to do next?</span>
          <h2>Choose what happens to this result.</h2>
          <button className="active" onClick={openCorrectWorkspace}><Layers3 /><span><b>{route.primaryAction}</b><small>{route.primaryDescription}</small></span><ChevronRight /></button>
          <div className="tool-workflow-action-contract"><span>Available for this tool</span>{tool.nextActions.slice(0, 5).map(action => <b key={action}>{action}</b>)}</div>
          {route.allowsAi && capability.actions.includes("ask_ai") && <button onClick={() => { setInspectorTab("ai"); openCorrectWorkspace(); }}><Sparkles /><span><b>Ask AI about this finding</b><small>Start with the selected page and issue already attached.</small></span><ChevronRight /></button>}
          {capability.actions.includes("export_report") && <button disabled={!reportId || reportDownloadMutation.isPending} onClick={() => { void downloadGeneratedReport(); }}><Download /><span><b>{reportId ? "Download report" : "Report artifact unavailable"}</b><small>{reportId ? "Keep the executor-generated evidence and inspection export." : "A report download appears only after an executor creates a stored artifact."}</small></span><ChevronRight /></button>}
          {capability.actions.includes("save_project") && <button onClick={() => { void saveVersion(); }}><Save /><span><b>Save project</b><small>Return later with the same tool context.</small></span><ChevronRight /></button>}
          {capability.actions.includes("developer_handoff") && <button onClick={() => setFinishNotice("Your technical handoff package is ready to download.")}><FileDown /><span><b>Download developer handoff</b><small>Keep acceptance criteria and implementation context together.</small></span><ChevronRight /></button>}
          {!isConnected && route.supportsStoreRelease && <button onClick={() => setFinishNotice(capability.lockedMessage)}><Store /><span><b>Connect a store later</b><small>{capability.lockedMessage}</small></span><ChevronRight /></button>}
          {finishNotice && <p className="tool-workflow-inline-notice">{finishNotice}</p>}
        </article>
      </section>
    </>
  );

  const editorScreen = route.hasVisualEditor ? (
    <section className="tool-workflow-editor">
      <header className="tool-workflow-editor-header">
        <button onClick={() => requestEditorExit("results")}><ArrowLeft /> Results</button>
        <div><span>{route.workspace}</span><b>{tool.name} · {editorDraftLabel}</b></div>
        <em>{versionSaved ? "Saved" : "Draft"}</em>
        <div className="tool-workflow-device-switcher">{["Desktop", "Tablet", "Mobile"].map(item => <button className={device === item ? "active" : ""} onClick={() => { setDevice(item); setEditorDirty(true); }} key={item}>{item}</button>)}</div>
        <button className="tool-workflow-editor-outline" onClick={() => requestEditorExit("review")}><ShieldCheck /> Validate</button>
        <button className="tool-workflow-editor-primary" onClick={() => requestEditorExit("review")}>Finish <ArrowRight /></button>
      </header>
      <div className="tool-workflow-editor-layout">
        <aside className="tool-workflow-editor-rail">
          <div className="tool-workflow-rail-tabs"><button className="active">Pages</button><button>Layers</button><button>Add</button><button>Assets</button><button>History</button></div>
          <span>PRODUCT PAGE</span>
          {editorLayers.map((layer, index) => <button className={`${selectedElement === layer ? "active" : ""} ${index > 2 ? "indented" : ""}`} onClick={() => { setSelectedElement(layer); setEditorDirty(true); }} key={layer}><i /> {layer}</button>)}
        </aside>
        <main className="tool-workflow-canvas">
          <span className="tool-workflow-kicker">Live storefront preview · {device}</span>
          {proposalVisible ? (
            <div className="tool-workflow-proposal-compare">
              <div><span>Current draft</span><img src={evidenceAsset} alt="Current storefront draft" /></div>
              <ArrowRight />
              <div><span>AI suggestion</span><img src={redesignAsset} alt="AI storefront proposal" /></div>
            </div>
          ) : (
            <div className="tool-workflow-live-canvas"><img src={evidenceAsset} alt="Editable storefront preview" /><div className="tool-workflow-selection"><span>{selectedElement}</span></div></div>
          )}
          {proposalVisible && <div className="tool-workflow-proposal-actions"><button className="tool-workflow-primary" onClick={() => { setProposalApplied(true); setProposalVisible(false); setEditorDirty(true); setFinishNotice(`AI suggestion applied to ${editorDraftLabel}. You can continue editing it manually.`); }}>Apply change</button><button className="tool-workflow-secondary" onClick={() => setProposalVisible(false)}>Keep current</button></div>}
          <div className="tool-workflow-health-strip"><b>Design Health 76</b><span>1 mobile issue · 1 contrast note</span><button onClick={() => requestEditorExit("review")}>Review issues</button></div>
        </main>
        <aside className="tool-workflow-inspector">
          <div className="tool-workflow-inspector-tabs"><button className={inspectorTab === "edit" ? "active" : ""} onClick={() => setInspectorTab("edit")}>Edit</button><button className={inspectorTab === "ai" ? "active" : ""} onClick={() => setInspectorTab("ai")}>Ask AI</button><button className={inspectorTab === "history" ? "active" : ""} onClick={() => setInspectorTab("history")}>History</button></div>
          {inspectorTab === "edit" && <EditorControls workspace={route.workspace} selectedElement={selectedElement} device={device} onOpenAi={() => setInspectorTab("ai")} onSave={() => { void saveVersion(); }} />}
          {inspectorTab === "ai" && <div className="tool-workflow-ai-panel"><div className="tool-workflow-ai-context"><Sparkles /><span><b>Context attached</b><small>{tool.name} · Product page · {selectedElement} · {device} · {editorDraftLabel}</small></span></div><div className="tool-workflow-sim-chat">{messages.map((message, index) => <div className={message.role} key={`${message.role}-${index}`}><b>{message.role === "assistant" ? "Ferix AI" : "You"}</b><p>{message.content}</p></div>)}<div className="tool-workflow-suggestions"><button onClick={() => sendToAi("Make this less crowded")}>Make this less crowded</button><button onClick={() => sendToAi("Use a more premium hierarchy")}>Use a more premium hierarchy</button></div><div className="tool-workflow-ai-input"><input value={aiInput} onChange={event => setAiInput(event.target.value)} onKeyDown={event => { if (event.key === "Enter") sendToAi(aiInput); }} placeholder="Ask AI to improve this selected item…" /><button onClick={() => sendToAi(aiInput)} aria-label="Send AI request"><Send /></button></div></div><button className="tool-workflow-primary" onClick={() => setProposalVisible(true)}><Wand2 /> {proposalApplied ? "Preview next suggestion" : "Preview AI suggestion"}</button><button className="tool-workflow-reference"><ImagePlus /> Add screenshot or reference</button></div>}
          {inspectorTab === "history" && <div className="tool-workflow-history"><h3>Draft history</h3>{[["Original", "Starting point"], ["AI redesign V1", "Alternative saved"], ["Manual changes V2", "Current element changes"], [savedVersionCount ? `Saved version ${savedVersionCount}` : "Current working version", proposalApplied ? "AI suggestion applied" : "Current element changes"]].map(([name, note], index) => <button className={index === 3 ? "active" : ""} onClick={() => { void saveVersion(); }} key={name}><History /><span><b>{name}</b><small>{note}</small></span>{index === 3 && <Check />}</button>)}<button className="tool-workflow-secondary" onClick={() => { void saveVersion(); }}><Save /> Save version</button></div>}
        </aside>
      </div>
      {finishNotice && <div className="tool-workflow-editor-notice">{finishNotice}{pendingStage && <span className="tool-workflow-editor-notice-actions"><button onClick={() => { void saveVersion().then(() => { const next = pendingStage; setPendingStage(null); if (next) move(next); }); }}>Save and continue</button><button onClick={() => { const next = pendingStage; setEditorDirty(false); setPendingStage(null); if (next) move(next); }}>Discard changes</button><button onClick={() => setPendingStage(null)}>Keep editing</button></span>}</div>}
    </section>
  ) : <SpecialistWorkspace route={route} tool={tool} source={source} scope={scope} onBack={() => move("results")} onContinue={() => move("review")} onAskAi={() => setFinishNotice(`AI plan prepared for ${tool.name}.`)} />;

  const reviewScreen = (
    <>
      <WorkflowHeader kicker={`${tool.name} · validation`} title="Check your draft before you finish." copy="Compare the current version, review the checks, then decide how to complete this work." back={() => move(route.hasVisualEditor ? "editor" : "results")} />
      <section className="tool-workflow-review-grid">
        <article className="tool-workflow-card tool-workflow-version-card">
          <span className="tool-workflow-kicker">Compare versions</span>
          <h2>Original and current draft</h2>
          <div className="tool-workflow-version-compare"><div><span>Original</span><img src={evidenceAsset} alt="Original page view" /></div><ArrowRight /><div><span>{editorDraftLabel}</span><img src={redesignAsset} alt="Current redesigned page view" /></div></div>
          <div className="tool-workflow-version-list">{[["Original", "Before redesign"], ["AI redesign V1", "First proposal"], ["Manual changes V2", "Selected element changes"], [editorDraftLabel, draftId ? "Current stored version" : "Current unsaved version"]].map(([name, note], index) => <button className={index === 3 ? "active" : ""} onClick={saveVersion} key={name}><i /> <span><b>{name}</b><small>{note}</small></span>{index === 3 && <Check />}</button>)}</div>
        </article>
        <article className="tool-workflow-card tool-workflow-validation-card">
          <span className="tool-workflow-kicker">Validation</span>
          <h2>Four checks before completion</h2>
          {[["Mobile layout", "Ready", "good"], ["Accessibility", "1 note to review", "notice"], ["SEO and content", "Ready", "good"], ["Design consistency", "Ready", "good"]].map(([label, status, tone]) => <div className={`tool-workflow-check ${tone}`} key={label}><span>{label}</span><b>{status}</b></div>)}
          <div className="tool-workflow-scope"><ShieldCheck /><p>One note does not block completion. Review it now or keep it recorded in your report and release package.</p></div>
          <button className="tool-workflow-secondary">Review note</button><button className="tool-workflow-primary" onClick={() => move("finish")}>Continue to finish <ArrowRight /></button>
        </article>
      </section>
    </>
  );

  const finishScreen = (
    <>
      <WorkflowHeader kicker={`${tool.name} · completion`} title="Finish this work the right way." copy="The final action is based on the source and store permission currently available." back={() => move("review")} />
      <section className="tool-workflow-finish-grid">
        {isConnected ? <article className="tool-workflow-card tool-workflow-release-card"><span className="tool-workflow-kicker">Connected store available</span><h2>Atelier Forma · Shopify</h2><div className="tool-workflow-permission"><Check /> Publish permission granted</div><p>Your approved {tool.name} can be saved as a store draft or published after one final confirmation.</p><img src={redesignAsset} alt="Approved store draft" /><div className="tool-workflow-release-checks"><span>✓ Draft saved</span><span>✓ Validation complete</span><span>✓ Confirm before live publish</span></div><button className="tool-workflow-primary" onClick={() => setFinishNotice("Publishing confirmation is ready in this simulated workspace.")}>Publish changes</button><button className="tool-workflow-secondary" onClick={() => setFinishNotice("Store draft created in this simulated workspace.")}>Create store draft</button></article> : <article className="tool-workflow-card tool-workflow-export-card"><span className="tool-workflow-kicker">No store connection? Still complete.</span><h2>Download your finished package</h2><p>Use the reviewed design in your own store system or share it with your developer.</p><div className="tool-workflow-package-list">{["Before and after redesign visuals", "Evidence, score, and priority issue report", "Page and mobile change instructions", "Developer handoff with design decisions"].map(item => <span key={item}>✓ {item}</span>)}</div><button className="tool-workflow-primary" onClick={() => setFinishNotice("Your design package is ready to download.")}><Download /> Download design package</button><button className="tool-workflow-secondary" onClick={() => setFinishNotice("Your developer handoff is ready to download.")}><FileDown /> Download developer handoff</button><div className="tool-workflow-scope"><Store /><p>Connect a supported store later to retain this project and unlock store-draft or publish actions where permissions allow.</p></div></article>}
        <article className="tool-workflow-card tool-workflow-alternative-finish"><span className="tool-workflow-kicker">Other finish route</span><h2>{isConnected ? "Need an implementation package instead?" : "Want publishing later?"}</h2><p>{isConnected ? "Download the evidence and developer handoff alongside your store release." : "Connect a supported store later and keep this project, evidence, and Draft 4."}</p><button className="tool-workflow-secondary" onClick={() => setFinishNotice(isConnected ? "Design package is ready to download." : "Store connection options are ready in this simulated workspace.")}>{isConnected ? "Download design package" : "Connect a store"}</button><button className="tool-workflow-secondary" onClick={() => setFinishNotice("You can return to the tool result at any time.")}>Back to result</button></article>
      </section>
      {finishNotice && <div className="tool-workflow-finish-notice">{finishNotice}</div>}
    </>
  );

  return <section className="tool-workflow-shell">
    <WorkflowProgress activeIndex={stageIndex} />
    {stage === "setup" && setupScreen}
    {stage === "processing" && processingScreen}
    {stage === "results" && resultsScreen}
    {stage === "editor" && editorScreen}
    {stage === "review" && reviewScreen}
    {stage === "finish" && finishScreen}
  </section>;
}

function WorkflowHeader({ kicker, title, copy, back }: { kicker: string; title: string; copy: string; back?: () => void }) {
  return <header className="tool-workflow-header"><div>{back && <button className="tool-workflow-back" onClick={back}><ArrowLeft /> Back</button>}<span>{kicker}</span><h1>{title}</h1><p>{copy}</p></div></header>;
}

function WorkflowProgress({ activeIndex }: { activeIndex: number }) {
  return <div className="tool-workflow-progress-nav">{stages.map((item, index) => <div className={index === activeIndex ? "active" : index < activeIndex ? "complete" : ""} key={item.id}><i>{index < activeIndex ? "✓" : ""}</i><span>{item.label}</span></div>)}</div>;
}

function SpecialistWorkspace({ route, tool, source, scope, onBack, onContinue, onAskAi }: { route: ToolRoute; tool: ToolDefinition; source: string; scope: string; onBack: () => void; onContinue: () => void; onAskAi: () => void }) {
  const technical = route.workspace === "Developer Handoff" || route.workspace === "Optimization Workbench" || route.workspace === "Measurement Workspace";
  return <section className="tool-specialist-workspace">
    <header className="tool-specialist-header"><button onClick={onBack}><ArrowLeft /> Results</button><span>{route.workspace}</span><h1>{route.primaryAction}</h1><p>{route.primaryDescription}</p></header>
    <section className="tool-specialist-grid">
      <article className="tool-workflow-card tool-specialist-context"><span className="tool-workflow-kicker">Current context</span><h2>{tool.name}</h2><div><b>Input</b><span>{source}</span></div><div><b>Result</b><span>{tool.outcome}</span></div><div><b>Scope</b><span>{scope}</span></div></article>
      <article className="tool-workflow-card tool-specialist-evidence"><span className="tool-workflow-kicker">Evidence and recommendations</span><h2>{technical ? "What needs implementation" : "What this result tells you"}</h2><div className="tool-specialist-list"><span><i>1</i><b>{technical ? "Prioritized cause" : "Priority finding"}</b><small>{technical ? "Evidence points to a change that should be reviewed before implementation." : "The visible customer path has one clear decision to improve first."}</small></span><span><i>2</i><b>{technical ? "Expected impact" : "Recommended next step"}</b><small>{technical ? "The recommendation is recorded with scope and expected impact." : route.primaryDescription}</small></span><span><i>3</i><b>{technical ? "Delivery path" : "Safe continuation"}</b><small>{technical ? "Prepare an implementation package rather than altering a visual draft." : "Save, export, or enter the appropriate focused workspace."}</small></span></div></article>
      <article className="tool-workflow-card tool-specialist-action"><span className="tool-workflow-kicker">Next action</span><h2>{route.workspace}</h2><p>{technical ? "This workspace keeps the technical brief, affected context, acceptance criteria, and delivery choices together." : "Review the evidence and keep a clear record of the next decision."}</p>{route.allowsAi ? <button className="tool-workflow-primary" onClick={onAskAi}><Sparkles /> Create AI plan</button> : <button className="tool-workflow-primary" onClick={() => undefined}><FileDown /> Review recommendation</button>}<button className="tool-workflow-secondary" onClick={onContinue}>{technical ? "Review handoff package" : "Continue to review"} <ArrowRight /></button><button className="tool-specialist-export"><Download /> Download report and evidence</button></article>
    </section>
  </section>;
}

function SourceIcon({ source }: { source: string }) {
  if (source === "Connected store") return <Store />;
  if (source === "Public URL") return <Link2 />;
  if (source === "Screenshots") return <ImagePlus />;
  if (source === "Saved draft") return <History />;
  return <FileDown />;
}

function EditorControls({ workspace, selectedElement, device, onOpenAi, onSave }: { workspace: ToolRoute["workspace"]; selectedElement: string; device: string; onOpenAi: () => void; onSave: () => void }) {
  const controls = workspace === "Responsive Studio"
    ? [["Breakpoint", device], ["Element order", "Buy action first"], ["Visibility", "Visible on mobile"], ["Spacing", "16 px"]]
    : workspace === "Layout Composer"
      ? [["Section order", "Product story → buy action"], ["Grid", "Two columns"], ["CTA placement", "After product detail"], ["Spacing", "24 px"]]
      : workspace === "Visual Style Studio"
        ? [["Typography", "Display / 700"], ["Colour", "Primary blue"], ["Image treatment", "Natural crop"], ["Borders", "12 px radius"]]
        : workspace === "Content Studio"
          ? [["Heading", "Clear product value"], ["Reassurance", "Shipping and returns"], ["Search intent", "Product benefit"], ["Tone", "Direct and warm"]]
          : [["Reference direction", "Current evidence"], ["Hierarchy", "Decision-first"], ["Spacing", "16 px"], ["Mobile position", "Above shipping details"]];
  return <div className="tool-workflow-edit-controls"><span className="tool-workflow-kicker">{workspace} · {selectedElement}</span><h3>Make a focused change.</h3>{controls.map(([label, value]) => <label key={label}><span>{label}</span><button>{value}<ChevronRight /></button></label>)}<button className="tool-workflow-primary" onClick={onOpenAi}><Sparkles /> Ask AI to improve this</button><button className="tool-workflow-secondary" onClick={onSave}><Save /> Save version</button><button className="tool-workflow-more-controls"><Paintbrush /> More {workspace.toLowerCase()} controls</button></div>;
}
