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
import React, { useEffect, useMemo, useRef, useState } from "react";
import { trpc } from "@/lib/trpc";
import "./approved-tool-workflow.css";
import "./approved-tool-workflow-overrides.css";
import "./exact-tool-contract.css";
import "./tool-workflow-specialist.css";

type Stage = "setup" | "processing" | "results" | "editor" | "review" | "finish";
type InspectorTab = "edit" | "ai" | "history";
type ChatMessage = { role: "user" | "assistant"; content: string };
type PublicUrlInspection = { url: string; statusCode: number; title: string | null; language: string | null; metaDescriptionLength: number; canonicalUrl: string | null; hasViewport: boolean; headingCount: number; headings?: Array<{ level: 1 | 2 | 3 | 4 | 5 | 6; text: string }>; imageCount: number; imagesWithAlt?: number; imagesWithoutAlt: number; linkCount: number; linksWithText?: number; linksWithoutText?: number; navigationLandmarkCount?: number; mainLandmarkCount?: number; fetchAndReadDurationMs?: number; ctaElementCount?: number; ctaElementsWithText?: number; ctaElementsWithoutText?: number; ctaTexts?: string[]; bodyTextCharacterCount?: number; bodyTextWordCount?: number; paragraphCount?: number; paragraphsWithText?: number; emptyHeadingCount?: number; productStructuredDataCount?: number; productNames?: string[]; productOfferCount?: number; productImageStructuredDataCount?: number; productDescriptionStructuredDataCount?: number; productDescriptionCharacterCount?: number; imagesLazyLoaded?: number; imagesWithDimensions?: number; imagesWithoutDimensions?: number; assetReferenceCount?: number; imageAssetReferenceCount?: number; stylesheetAssetReferenceCount?: number; scriptAssetReferenceCount?: number; assetHosts?: string[]; inlineStyleBlockCount?: number; inlineMediaQueryCount?: number; responsiveImageSrcsetCount?: number; telephoneLinkCount?: number; telephoneInputCount?: number; mobileInputModeCount?: number; organizationStructuredDataCount?: number; reviewStructuredDataCount?: number; aggregateRatingStructuredDataCount?: number; formElementCount?: number; ariaRoleAttributeCount?: number; skipLinkCount?: number; inlineColorDeclarationCount?: number; styleBlockColorDeclarationCount?: number; observedColorValues?: string[]; inlineFontFamilyDeclarationCount?: number; styleBlockFontFamilyDeclarationCount?: number; observedFontFamilies?: string[]; cartLinkCount?: number; checkoutLinkCount?: number; cartOrCheckoutFormActionCount?: number; cartFormActionCount?: number; checkoutFormActionCount?: number; mediaQueryConditionCount?: number; observedMediaQueryConditions?: string[]; collectionLinkCount?: number; observedCollectionPaths?: string[]; productLinkCount?: number; headerElementCount?: number; footerElementCount?: number; sectionElementCount?: number; articleElementCount?: number; semanticLayoutElementCount?: number; bytesRead: number };
type ObservedIssue = { id: number; title: string; severity: "critical" | "high" | "medium" | "low" | "info" };
type ComparisonResult = {
  execution: "deterministic_persisted_draft_version_comparison";
  boundary: string;
  draftId: number;
  base: { versionId: number; label: string; createdAt: Date | string; createdByType: "user" | "ai" | "system"; designStateBytes: number };
  comparison: { versionId: number; label: string; createdAt: Date | string; createdByType: "user" | "ai" | "system"; designStateBytes: number };
  serializedStateMatches: boolean;
};


const stages: Array<{ id: Stage; label: string }> = [
  { id: "setup", label: "Set up" },
  { id: "processing", label: "Run" },
  { id: "results", label: "Results" },
  { id: "editor", label: "Workspace" },
  { id: "review", label: "Check" },
  { id: "finish", label: "Finish" },
];

const publicUrlExecutorToolIds = new Set(["storefront-analyzer", "page-analyzer", "site-structure-analyzer", "visual-design-analyzer", "layout-analyzer", "visual-hierarchy-analyzer", "typography-analyzer", "color-contrast-analyzer", "ux-analyzer", "conversion-analyzer", "cta-analyzer", "trust-credibility-analyzer", "customer-journey-analyzer", "responsive-analyzer", "mobile-ux-analyzer", "breakpoint-analyzer", "product-page-analyzer", "product-presentation-analyzer", "product-content-analyzer", "navigation-analyzer", "collection-analyzer", "cart-analyzer", "checkout-ux-analyzer", "content-quality-analyzer", "seo-analyzer", "heading-structure-analyzer", "image-seo-analyzer", "performance-analyzer", "image-optimization-analyzer", "asset-analyzer", "accessibility-analyzer"]);

const resolveToolSource = (value: string | undefined, sources: ToolSource[]): ToolSource => {
  const aliases: Record<string, ToolSource> = {
    url: "Public URL",
    public_url: "Public URL",
    screenshot: "Screenshots",
    screenshots: "Screenshots",
    connect: "Connected store",
    connected: "Connected store",
    connected_store: "Connected store",
  };
  const normalized = value ? aliases[value.trim().toLowerCase()] ?? value : undefined;
  return normalized && sources.includes(normalized as ToolSource) ? normalized as ToolSource : sources[0] ?? "Public URL";
};

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

function readFileAsBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result).split(",")[1] ?? "");
    reader.onerror = () => reject(reader.error ?? new Error("Unable to read the selected file."));
    reader.readAsDataURL(file);
  });
}

export function ApprovedToolWorkflow({
  tool,
  onBack,
  startAt = "setup",
  startSource,
  selectedSource,
  onSourceChange,
  workspaceId,
  storeId,
}: {
  tool: ToolDefinition;
  onBack: () => void;
  startAt?: "setup" | "results" | "editor" | "finish";
  startSource?: string;
  selectedSource?: string;
  onSourceChange?: (source: ToolSource) => void;
  workspaceId?: number;
  storeId?: number;
}) {
  const [stage, setStage] = useState<Stage>(startAt);
  const [internalSource, setInternalSource] = useState<ToolSource>(() => resolveToolSource(selectedSource ?? startSource, tool.sources));
  const source = resolveToolSource(internalSource, tool.sources);
  const chooseSource = (next: ToolSource) => { setInternalSource(next); setToolRunId(null); setReportId(null); setInspection(null); setObservedIssues([]); setComparisonResult(null); setScreenshotEvidenceCount(0); setScreenshotAnalysis(""); setRunError(""); onSourceChange?.(next); };
  const urlInputRef = useRef<HTMLInputElement>(null);
  const readUrl = () => urlInputRef.current?.value.trim() ?? "";
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
  const [selectedComparisonDraftId, setSelectedComparisonDraftId] = useState<number | null>(null);
  const [baseVersionId, setBaseVersionId] = useState<number | null>(null);
  const [comparisonVersionId, setComparisonVersionId] = useState<number | null>(null);
  const [comparisonResult, setComparisonResult] = useState<ComparisonResult | null>(null);
  const [screenshotEvidenceCount, setScreenshotEvidenceCount] = useState(0);
  const [screenshotAnalysis, setScreenshotAnalysis] = useState("");
  const [editorDirty, setEditorDirty] = useState(false);
  const [pendingStage, setPendingStage] = useState<Stage | null>(null);
  const [runError, setRunError] = useState("");
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [selectedPreviews, setSelectedPreviews] = useState<string[]>([]);
  const screenshotInputRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    const urls = selectedFiles.map(file => URL.createObjectURL(file));
    setSelectedPreviews(urls);
    return () => urls.forEach(url => URL.revokeObjectURL(url));
  }, [selectedFiles]);
  const queueToolRunMutation = trpc.workspace.queueToolRun.useMutation();
  const uploadSourceMutation = trpc.workspace.stores.uploadSource.useMutation();
  const completeToolRunMutation = trpc.workspace.completeToolRun.useMutation();
  const addToolEvidenceMutation = trpc.workspace.addToolEvidence.useMutation();
  const createReportMutation = trpc.workspace.createReport.useMutation();
  const startToolRunMutation = trpc.workspace.startToolRun.useMutation();
  const executePublicUrlToolRunMutation = trpc.workspace.executePublicUrlToolRun.useMutation();
  const executeDraftVersionComparisonMutation = trpc.workspace.executeDraftVersionComparison.useMutation();
  const executeScreenshotToolRunMutation = trpc.workspace.executeScreenshotToolRun.useMutation();
  const reportDownloadMutation = trpc.workspace.reportDownload.useMutation();
  const contentImproveMutation = trpc.workspace.contentImprove.useMutation();
  const designCopilotMutation = trpc.workspace.designCopilot.useMutation();
  const aiStoreRedesignMutation = trpc.workspace.aiStoreRedesign.useMutation();
  const visualStyleStudioMutation = trpc.workspace.visualStyleStudio.useMutation();
  const responsiveStudioMutation = trpc.workspace.responsiveStudio.useMutation();
  const layoutComposerMutation = trpc.workspace.layoutComposer.useMutation();
  const componentBuilderMutation = trpc.workspace.componentBuilder.useMutation();
  const contentEditorProposalMutation = trpc.workspace.contentEditorProposal.useMutation();
  const accessibilityFixAssistantMutation = trpc.workspace.accessibilityFixAssistant.useMutation();
  const marketingCopyMutation = trpc.workspace.generateMarketingCopy.useMutation();
  const productDescriptionMutation = trpc.workspace.generateProductDescription.useMutation();
  const createDraftMutation = trpc.workspace.createDraft.useMutation();
  const saveDraftVersionMutation = trpc.workspace.saveDraftVersion.useMutation();
  const draftsQuery = trpc.workspace.drafts.useQuery({ workspaceId: workspaceId ?? 1 }, { enabled: Boolean(workspaceId) });
  const draftVersionsQuery = trpc.workspace.draftVersions.useQuery({ workspaceId: workspaceId ?? 1, draftId: selectedComparisonDraftId ?? 1 }, { enabled: Boolean(workspaceId && selectedComparisonDraftId) });
  const validationRunsQuery = trpc.workspace.validationRuns.useQuery({ workspaceId: workspaceId ?? 1, limit: 20 }, { enabled: Boolean(workspaceId) });

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
  const latestValidation = validationRunsQuery.data?.[0];
  const statusSummary = useMemo(() => {
    if (comparisonResult) return `Compared persisted versions “${comparisonResult.base.label}” and “${comparisonResult.comparison.label}”. ${comparisonResult.boundary}`;
    if (inspection) return `Observed ${inspection.title ? `“${inspection.title}”` : observedHost} with HTTP ${inspection.statusCode}. Review the stored inspection evidence before acting on it.`;
    return "This run has no executor-created evidence yet. A result can be reviewed only after a supported executor records it.";
  }, [comparisonResult, inspection, observedHost]);

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
      if (source === "Connected store") throw new Error("Connected-store execution is not enabled until the provider API and OAuth adapter are configured.");
      if (source === "Public URL" || source === "Specific page URL") {
        const cleanUrl = readUrl();
        if (!cleanUrl) throw new Error("Enter a public storefront URL before running this tool.");
        let parsedUrl: URL;
        try { parsedUrl = new URL(cleanUrl); } catch { throw new Error("Enter a complete URL beginning with https://."); }
        if (!/^https?:$/.test(parsedUrl.protocol)) throw new Error("Only http:// and https:// storefront URLs can be analyzed.");
      }
      if (sourceType === "public_url" && !publicUrlExecutorToolIds.has(tool.id)) throw new Error(`${tool.name} does not have a dedicated public-URL executor yet. No run was queued.`);
      if (source === "Screenshots" && tool.id !== "screenshot-analyzer") throw new Error(`${tool.name} does not have a screenshot-analysis executor yet. Choose Screenshot Analyzer; no run was queued.`);
      if (source === "Saved draft" && tool.id !== "before-after-comparator") throw new Error(`${tool.name} does not have a saved-draft executor yet. No run was queued.`);
      const hasLiveExecutor = (sourceType === "public_url" && publicUrlExecutorToolIds.has(tool.id)) || (source === "Screenshots" && tool.id === "screenshot-analyzer") || (sourceType === "saved_draft" && tool.id === "before-after-comparator");
      if (!hasLiveExecutor) throw new Error(`${tool.name} is not connected to a live executor for ${source}. No run was queued and no simulated result was created.`);
      let uploadedSources: Array<{ fileName: string; storageKey: string; url: string }> = [];
      if (source === "Screenshots") {
        if (!storeId) throw new Error("Open or add a store before uploading screenshots.");
        if (!selectedFiles.length) throw new Error("Select at least one screenshot before running this tool.");
        uploadedSources = await Promise.all(selectedFiles.map(async file => {
          if (!/^image\/(png|jpeg|webp)$/.test(file.type)) throw new Error(`${file.name} is not a PNG, JPG, or WEBP image.`);
          if (file.size > 8 * 1024 * 1024) throw new Error(`${file.name} is larger than the 8 MB upload limit.`);
          const uploaded = await uploadSourceMutation.mutateAsync({ workspaceId, storeId, fileName: file.name, mimeType: file.type, contentBase64: await readFileAsBase64(file), sourceType: "screenshot" });
          return { fileName: file.name, storageKey: uploaded.storage.key, url: uploaded.storage.url };
        }));
      }
      const queued = await queueToolRunMutation.mutateAsync({ workspaceId, toolId: tool.id, sourceType, inputSummary: { source, url: source === "Public URL" || source === "Specific page URL" ? readUrl() : undefined, uploadedSources } });
      const started = await startToolRunMutation.mutateAsync({ workspaceId, toolRunId: queued.id });
      if (tool.id === "before-after-comparator" && sourceType === "saved_draft") {
        if (!baseVersionId || !comparisonVersionId) throw new Error("Choose one baseline version and one comparison version before running this tool.");
        const execution = await executeDraftVersionComparisonMutation.mutateAsync({ workspaceId, toolRunId: started.id, baseVersionId, comparisonVersionId });
        setReportId(execution.report?.id ?? null);
        setComparisonResult(execution.comparison as ComparisonResult);
        setScreenshotEvidenceCount(0);
        setScreenshotAnalysis("");
        setInspection(null);
        setObservedIssues([]);
      } else if (sourceType === "public_url") {
        const execution = await executePublicUrlToolRunMutation.mutateAsync({ workspaceId, toolRunId: started.id });
        setReportId(execution.report?.id ?? null);
        setInspection(execution.inspection);
        setObservedIssues(execution.issues ?? []);
        setComparisonResult(null);
        setScreenshotEvidenceCount(0);
        setScreenshotAnalysis("");
      } else if (source === "Screenshots") {
        const evidence = await Promise.all(uploadedSources.map(uploaded => addToolEvidenceMutation.mutateAsync({ workspaceId, toolRunId: started.id, kind: "screenshot", title: uploaded.fileName, storageKey: uploaded.storageKey, details: { source: "user_uploaded_screenshot", fileName: uploaded.fileName } })));
        const execution = await executeScreenshotToolRunMutation.mutateAsync({ workspaceId, toolRunId: started.id, storageKeys: uploadedSources.map(uploaded => uploaded.storageKey) });
        setReportId(execution.report?.id ?? null);
        setScreenshotEvidenceCount(evidence.length);
        setScreenshotAnalysis(execution.analysis);
        setInspection(null);
        setObservedIssues([]);
        setComparisonResult(null);
      } else { setReportId(null); setScreenshotEvidenceCount(0); setScreenshotAnalysis(""); setInspection(null); setObservedIssues([]); setComparisonResult(null); }
      setToolRunId(started.id);
      move("results");
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
    if ((tool.id !== "ai-design-copilot" && tool.id !== "ai-store-redesign" && tool.id !== "visual-style-studio" && tool.id !== "responsive-studio" && tool.id !== "layout-composer" && tool.id !== "component-builder" && tool.id !== "content-editor" && tool.id !== "accessibility-fix-assistant" && tool.id !== "ai-content-improver" && tool.id !== "product-description-generator" && tool.id !== "cta-generator" && tool.id !== "seo-content-generator" && tool.id !== "meta-generator") || !workspaceId || !toolRunId) {
      setMessages(previous => [...previous, { role: "assistant", content: `**${tool.name}** does not yet have a dedicated server-side AI operation for this workflow. No AI proposal was generated. You can continue with the manual editor, choose a tool with a live AI operation, or return when this executor is released.` }]);
      setFinishNotice("This tool’s AI operation is not available yet. No simulated result was created.");
      return;
    }
    try {
      const result = tool.id === "ai-store-redesign"
        ? await aiStoreRedesignMutation.mutateAsync({ workspaceId, toolRunId, message: content, context: { tool: tool.name, page: "Product page", selectedElement, device, source } })
        : tool.id === "visual-style-studio"
        ? await visualStyleStudioMutation.mutateAsync({ workspaceId, toolRunId, message: content, context: { tool: tool.name, page: "Product page", selectedElement, device, source } })
        : tool.id === "responsive-studio"
        ? await responsiveStudioMutation.mutateAsync({ workspaceId, toolRunId, message: content, context: { tool: tool.name, page: "Product page", selectedElement, device, source } })
        : tool.id === "layout-composer"
        ? await layoutComposerMutation.mutateAsync({ workspaceId, toolRunId, message: content, context: { tool: tool.name, page: "Product page", selectedElement, device, source } })
        : tool.id === "component-builder"
        ? await componentBuilderMutation.mutateAsync({ workspaceId, toolRunId, message: content, context: { tool: tool.name, page: "Product page", selectedElement, device, source } })
        : tool.id === "content-editor"
        ? await contentEditorProposalMutation.mutateAsync({ workspaceId, toolRunId, sourceText: content, instruction: `Propose a reviewable revision for this ${selectedElement.toLowerCase()} while preserving factual meaning and manual editor control.` })
        : tool.id === "accessibility-fix-assistant"
        ? await accessibilityFixAssistantMutation.mutateAsync({ workspaceId, toolRunId, message: content, context: { tool: tool.name, page: "Product page", selectedElement, device, source } })
        : tool.id === "cta-generator" || tool.id === "seo-content-generator" || tool.id === "meta-generator"
        ? await marketingCopyMutation.mutateAsync({ workspaceId, toolRunId, mode: tool.id, sourceFacts: content, instruction: `Draft ${tool.name} output using only these supplied facts.` })
        : tool.id === "product-description-generator"
        ? await productDescriptionMutation.mutateAsync({ workspaceId, toolRunId, productFacts: content, instruction: "Draft a concise product description using only these supplied facts." })
        : tool.id === "ai-content-improver"
          ? await contentImproveMutation.mutateAsync({ workspaceId, toolRunId, sourceText: content, instruction: `Improve this ${selectedElement.toLowerCase()} copy for clarity and usefulness while preserving its factual meaning.` })
          : await designCopilotMutation.mutateAsync({ workspaceId, toolRunId, message: content, context: { tool: tool.name, page: "Product page", selectedElement, device, source } });
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
    const designState = JSON.stringify({ toolId: tool.id, toolName: tool.name, source, url: source === "Public URL" || source === "Specific page URL" ? readUrl() : undefined, selectedElement, device, proposalApplied, selectedInspector: inspectorTab });
    const label = savedVersionCount ? `Saved version ${savedVersionCount + 1}` : "Initial working version";
    try {
      if (!draftId) {
        const created = await createDraftMutation.mutateAsync({ workspaceId, title: `${tool.name} draft`, source: tool.id === "ai-design-copilot" || tool.id === "ai-store-redesign" ? "ai" : "tool", label, note: `Saved from ${tool.name} in the approved editor workflow.`, designState, createdByType: proposalApplied ? "ai" : "user" });
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
                type="button"
                className={source === item ? "active" : ""}
                onClick={() => chooseSource(item)}
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
              <div><Link2 /><input ref={urlInputRef} type="url" inputMode="url" autoCapitalize="none" autoCorrect="off" spellCheck={false} placeholder="https://yourstore.com" defaultValue="" onInput={() => setRunError("")} /><button type="button" aria-label="Clear URL" onClick={() => { if (urlInputRef.current) urlInputRef.current.value = ""; setRunError(""); }} disabled={false}>×</button></div>
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
            <div className="tool-workflow-upload-area"><input ref={screenshotInputRef} type="file" accept="image/png,image/jpeg,image/webp" multiple hidden onChange={event => { setSelectedFiles(Array.from(event.target.files ?? [])); setRunError(""); }} /><button type="button" className="tool-workflow-dropzone" onClick={() => screenshotInputRef.current?.click()}><Upload /><span><b>{selectedFiles.length ? `${selectedFiles.length} screenshot${selectedFiles.length === 1 ? "" : "s"} selected` : "Upload screenshots"}</b><small>PNG, JPG, WEBP · up to 8 MB each</small></span><ImagePlus /></button>{selectedFiles.length > 0 && <div className="tool-workflow-preview-grid">{selectedFiles.map((file, index) => <figure key={`${file.name}-${file.lastModified}`}><img src={selectedPreviews[index]} alt={`Preview of ${file.name}`} /><figcaption><span>{file.name}</span><button type="button" aria-label={`Remove ${file.name}`} onClick={() => setSelectedFiles(current => current.filter(item => item !== file))}>×</button></figcaption></figure>)}</div>}</div>
          )}
          {source === "Saved draft" && tool.id === "before-after-comparator" && (
            <div className="tool-workflow-result-metrics">
              <span>Saved versions to compare</span>
              <label className="tool-workflow-input"><span>Saved draft</span><div><History /><select value={selectedComparisonDraftId ?? ""} onChange={event => { const nextDraftId = Number(event.target.value); setSelectedComparisonDraftId(nextDraftId || null); setBaseVersionId(null); setComparisonVersionId(null); }}><option value="">Choose a workspace draft</option>{(draftsQuery.data ?? []).map(draft => <option value={draft.id} key={draft.id}>{draft.title}</option>)}</select></div></label>
              {selectedComparisonDraftId && <><label className="tool-workflow-input"><span>Baseline version</span><div><History /><select value={baseVersionId ?? ""} onChange={event => setBaseVersionId(Number(event.target.value) || null)}><option value="">Choose baseline</option>{(draftVersionsQuery.data?.versions ?? []).map(version => <option value={version.id} key={version.id}>{version.label}</option>)}</select></div></label><label className="tool-workflow-input"><span>Comparison version</span><div><History /><select value={comparisonVersionId ?? ""} onChange={event => setComparisonVersionId(Number(event.target.value) || null)}><option value="">Choose comparison</option>{(draftVersionsQuery.data?.versions ?? []).map(version => <option value={version.id} key={version.id}>{version.label}</option>)}</select></div></label><b>Only metadata and serialized saved state are compared. This does not render or assess design quality.</b></>}
            </div>
          )}
          {source === "Saved draft" && tool.id !== "before-after-comparator" && (
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
          <button type="button" className="tool-workflow-primary" disabled={queueToolRunMutation.isPending || uploadSourceMutation.isPending || completeToolRunMutation.isPending || addToolEvidenceMutation.isPending || createReportMutation.isPending || startToolRunMutation.isPending || executePublicUrlToolRunMutation.isPending || executeDraftVersionComparisonMutation.isPending || executeScreenshotToolRunMutation.isPending} onClick={beginLiveToolRun}><Play /> {queueToolRunMutation.isPending || uploadSourceMutation.isPending || completeToolRunMutation.isPending || addToolEvidenceMutation.isPending || createReportMutation.isPending || startToolRunMutation.isPending || executePublicUrlToolRunMutation.isPending || executeDraftVersionComparisonMutation.isPending || executeScreenshotToolRunMutation.isPending ? "Preparing result…" : `Run ${tool.name}`}</button>
        </article>
      </section>
    </>
  );

  const processingScreen = (
    <>
      <WorkflowHeader
        kicker={`Running · ${tool.name}`}
        title={`${tool.name} is checking your input.`}
        copy={`${source} · ${source === "Public URL" ? readUrl().replace(/^https?:\/\//, "") : sourceDetail.support}`}
        back={() => move("setup")}
      />
      <section className="tool-workflow-processing-grid">
        <article className="tool-workflow-card tool-workflow-progress-card">
          <div className="tool-workflow-progress-ring"><b>{toolRunId ? "RUN" : "—"}</b><span>{toolRunId ? "record created" : "not started"}</span></div>
          <div className="tool-workflow-processing-stages"><div className={toolRunId ? "complete" : ""}><i>{toolRunId ? "✓" : "○"}</i><span>Backend run record</span><small>{toolRunId ? "Recorded" : "Waiting"}</small></div></div>
          <div className="tool-workflow-scope"><ShieldCheck /><p>{scope}</p></div>
          <button className="tool-workflow-secondary" onClick={() => move("setup")}>Cancel and change source</button>
          <button className="tool-workflow-primary" disabled={!toolRunId} onClick={() => move("results")}>{toolRunId ? "See run record" : "No run record"}</button>
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
          <h2>{comparisonResult ? "Saved versions compared" : screenshotAnalysis ? "Screenshot analysis complete" : screenshotEvidenceCount ? "Screenshot evidence stored" : inspection?.title ?? (inspection ? "Observed public page" : "No executor-created result")}</h2>
          <div className="tool-workflow-capability"><ShieldCheck /><span><b>{capability.mode}</b><small>{capability.label}</small></span></div>
          <div className="tool-workflow-score"><b>{comparisonResult ? (comparisonResult.serializedStateMatches ? "Match" : "Different") : screenshotEvidenceCount ? screenshotEvidenceCount : inspection ? inspection.statusCode : "—"}</b><span>{comparisonResult ? "serialized saved state" : screenshotEvidenceCount ? "uploaded files" : inspection ? "HTTP response" : "no measured score"}</span></div>
          <p>{comparisonResult ? comparisonResult.boundary : screenshotAnalysis ? "The AI analysis below was generated from the uploaded screenshots only. It does not claim access to hidden code, live store data, or measurements not visible in the images." : screenshotEvidenceCount ? "The selected screenshot files were uploaded to protected workspace storage and recorded as evidence. No visual score or AI interpretation was produced." : inspection ? `Observed from ${observedHost}. This is a bounded page inspection, not a visual-quality or conversion score.` : "A measured result appears only after a supported executor records evidence for this run."}</p>
          <div className="tool-workflow-stats">{screenshotEvidenceCount ? <span><b>{screenshotEvidenceCount}</b><small>screenshot files stored</small></span> : comparisonResult ? <><span><b>{comparisonResult.base.designStateBytes}</b><small>baseline bytes</small></span><span><b>{comparisonResult.comparison.designStateBytes}</b><small>comparison bytes</small></span><span><b>{comparisonResult.serializedStateMatches ? "same" : "different"}</b><small>serialized state</small></span></> : inspection ? <><span><b>{inspection.headingCount}</b><small>headings observed</small></span><span><b>{inspection.imageCount}</b><small>images observed</small></span><span><b>{observedIssues.length}</b><small>observed issue records</small></span></> : <span><b>Awaiting evidence</b><small>no recorded checks</small></span>}</div>
          <button className="tool-workflow-secondary" disabled={!reportId || reportDownloadMutation.isPending} onClick={() => { void downloadGeneratedReport(); }}><Download /> {reportDownloadMutation.isPending ? "Preparing download…" : reportReady ? "Report downloaded" : reportId ? "Download report" : "No export artifact"}</button>
        </article>
        <article className="tool-workflow-card tool-workflow-evidence-card">
          <span className="tool-workflow-kicker">Where it happens</span>
          {screenshotEvidenceCount ? <><div className="tool-workflow-evidence-visual">{selectedPreviews[0] ? <img src={selectedPreviews[0]} alt="Uploaded screenshot preview" /> : <div className="tool-workflow-evidence-note"><b>Uploaded evidence</b></div>}<span>Uploaded screenshot evidence</span></div><div className="tool-workflow-evidence-note"><b>{screenshotAnalysis ? "AI analysis from uploaded screenshots" : "Stored in workspace evidence"}</b><p>{screenshotAnalysis || `${screenshotEvidenceCount} screenshot file${screenshotEvidenceCount === 1 ? "" : "s"} uploaded and attached to this tool run. No visual score is claimed beyond the provider response.`}</p></div></> : comparisonResult ? <div className="tool-workflow-evidence-note"><b>Persisted version records</b><p>Baseline: {comparisonResult.base.label} · {new Date(comparisonResult.base.createdAt).toLocaleString()} · {comparisonResult.base.createdByType}. Comparison: {comparisonResult.comparison.label} · {new Date(comparisonResult.comparison.createdAt).toLocaleString()} · {comparisonResult.comparison.createdByType}.</p></div> : inspection ? <div className="tool-workflow-evidence-note"><b>Observed page evidence</b><p>{inspection.hasViewport ? "Viewport metadata is present" : "Viewport metadata is absent"}; {inspection.canonicalUrl ? "a canonical URL is declared" : "no canonical URL was observed"}; {inspection.linkCount} links were counted from the fetched document.</p></div> : <div className="tool-workflow-evidence-note"><b>No observed evidence yet</b><p>Run a supported executor to create evidence before a result or recommendation is shown.</p></div>}
          <div className="tool-workflow-result-metrics"><span>{screenshotEvidenceCount ? "Stored evidence" : inspection ? (observedIssues.length ? "Observed issue records" : "Observed fields") : "Result boundary"}</span>{screenshotEvidenceCount ? <b>{screenshotEvidenceCount} uploaded screenshot{screenshotEvidenceCount === 1 ? "" : "s"}</b> : inspection ? (observedIssues.length ? observedIssues.map(issue => <b key={issue.id}>{issue.severity} · {issue.title}</b>) : [inspection.language ? `Language · ${inspection.language}` : "Language not declared", `Meta description markup · ${inspection.metaDescriptionLength} chars`, `${inspection.bytesRead} bytes inspected`].map(metric => <b key={metric}>{metric}</b>)) : <b>No generated evidence</b>}</div>
          {tool.id === "heading-structure-analyzer" && inspection?.headings && <div className="tool-workflow-result-metrics"><span>Observed heading order</span>{inspection.headings.length ? inspection.headings.map((heading, index) => <b key={`${heading.level}-${index}`}>H{heading.level} · {heading.text || "No text observed"}</b>) : <b>No heading elements were observed.</b>}</div>}
          {tool.id === "image-seo-analyzer" && inspection && <div className="tool-workflow-result-metrics"><span>Observed image alternative text</span><b>{inspection.imagesWithAlt ?? Math.max(inspection.imageCount - inspection.imagesWithoutAlt, 0)} image{(inspection.imagesWithAlt ?? Math.max(inspection.imageCount - inspection.imagesWithoutAlt, 0)) === 1 ? "" : "s"} with alt text</b><b>{inspection.imagesWithoutAlt} image{inspection.imagesWithoutAlt === 1 ? "" : "s"} without alt text</b></div>}
          {tool.id === "seo-analyzer" && inspection && <div className="tool-workflow-result-metrics"><span>Observed page SEO fields</span><b>Title · {inspection.title || "not observed"}</b><b>Meta description markup · {inspection.metaDescriptionLength ? `${inspection.metaDescriptionLength} chars` : "not observed"}</b><b>Canonical · {inspection.canonicalUrl || "not observed"}</b><b>{inspection.headingCount} headings · {inspection.linkCount} links · {inspection.imageCount} images observed</b></div>}
          {tool.id === "accessibility-analyzer" && inspection && <div className="tool-workflow-result-metrics"><span>Observed accessibility indicators</span><b>Document language · {inspection.language || "not declared"}</b><b>Viewport metadata · {inspection.hasViewport ? "present" : "absent"}</b><b>Heading elements · {inspection.headingCount} observed</b><b>Images without alt text · {inspection.imagesWithoutAlt}</b></div>}
          {tool.id === "site-structure-analyzer" && inspection && <div className="tool-workflow-result-metrics"><span>Observed page structure indicators</span><b>Page host · {observedHost}</b><b>Links on this page · {inspection.linkCount}</b><b>Heading elements · {inspection.headingCount}</b><b>Canonical URL · {inspection.canonicalUrl || "not observed"}</b></div>}
          {tool.id === "navigation-analyzer" && inspection && <div className="tool-workflow-result-metrics"><span>Observed navigation indicators</span><b>Navigation landmarks · {inspection.navigationLandmarkCount ?? "not recorded"}</b><b>Main landmarks · {inspection.mainLandmarkCount ?? "not recorded"}</b><b>Links with text · {inspection.linksWithText ?? "not recorded"}</b><b>Links without text content · {inspection.linksWithoutText ?? "not recorded"}</b></div>}
          {tool.id === "performance-analyzer" && inspection && <div className="tool-workflow-result-metrics"><span>Observed page transfer indicators</span><b>HTTP response · {inspection.statusCode}</b><b>Fetch and document read · {inspection.fetchAndReadDurationMs ?? "not recorded"}{inspection.fetchAndReadDurationMs === undefined ? "" : " ms"}</b><b>Document bytes inspected · {inspection.bytesRead}</b><b>Boundary · one public response and bounded HTML read</b></div>}
          {tool.id === "cta-analyzer" && inspection && <div className="tool-workflow-result-metrics"><span>Observed interactive text</span><b>Anchor and button elements · {inspection.ctaElementCount ?? "not recorded"}</b><b>Elements with text · {inspection.ctaElementsWithText ?? "not recorded"}</b><b>Elements without text · {inspection.ctaElementsWithoutText ?? "not recorded"}</b>{inspection.ctaTexts?.length ? inspection.ctaTexts.map((text, index) => <b key={`${text}-${index}`}>Observed · {text}</b>) : <b>No interactive element text was observed.</b>}</div>}
          {tool.id === "content-quality-analyzer" && inspection && <div className="tool-workflow-result-metrics"><span>Observed extracted text indicators</span><b>Body text words · {inspection.bodyTextWordCount ?? "not recorded"}</b><b>Body text characters · {inspection.bodyTextCharacterCount ?? "not recorded"}</b><b>Paragraphs · {inspection.paragraphCount ?? "not recorded"}</b><b>Paragraphs with text · {inspection.paragraphsWithText ?? "not recorded"}</b><b>Headings without text · {inspection.emptyHeadingCount ?? "not recorded"}</b></div>}
          {tool.id === "product-page-analyzer" && inspection && <div className="tool-workflow-result-metrics"><span>Observed Product structured data</span><b>Product JSON-LD declarations · {inspection.productStructuredDataCount ?? "not recorded"}</b><b>Offer declarations · {inspection.productOfferCount ?? "not recorded"}</b>{inspection.productNames?.length ? inspection.productNames.map((name, index) => <b key={`${name}-${index}`}>Observed product name · {name}</b>) : <b>No parsed Product name was observed.</b>}</div>}
          {tool.id === "image-optimization-analyzer" && inspection && <div className="tool-workflow-result-metrics"><span>Observed image markup indicators</span><b>Image elements · {inspection.imageCount}</b><b>Lazy-loading attributes · {inspection.imagesLazyLoaded ?? "not recorded"}</b><b>Images with width and height attributes · {inspection.imagesWithDimensions ?? "not recorded"}</b><b>Images without both attributes · {inspection.imagesWithoutDimensions ?? "not recorded"}</b></div>}
          {tool.id === "asset-analyzer" && inspection && <div className="tool-workflow-result-metrics"><span>Observed asset references</span><b>Total references · {inspection.assetReferenceCount ?? "not recorded"}</b><b>Image references · {inspection.imageAssetReferenceCount ?? "not recorded"}</b><b>Stylesheet references · {inspection.stylesheetAssetReferenceCount ?? "not recorded"}</b><b>Script references · {inspection.scriptAssetReferenceCount ?? "not recorded"}</b>{inspection.assetHosts?.length ? inspection.assetHosts.map(host => <b key={host}>Observed host · {host}</b>) : <b>No asset host was observed.</b>}</div>}
          {tool.id === "responsive-analyzer" && inspection && <div className="tool-workflow-result-metrics"><span>Observed responsive markup indicators</span><b>Viewport metadata · {inspection.hasViewport ? "observed" : "not observed"}</b><b>Inline style blocks · {inspection.inlineStyleBlockCount ?? "not recorded"}</b><b>Inline media queries · {inspection.inlineMediaQueryCount ?? "not recorded"}</b><b>`srcset` references · {inspection.responsiveImageSrcsetCount ?? "not recorded"}</b></div>}
          {tool.id === "mobile-ux-analyzer" && inspection && <div className="tool-workflow-result-metrics"><span>Observed mobile-oriented markup indicators</span><b>Viewport metadata · {inspection.hasViewport ? "observed" : "not observed"}</b><b>`tel:` links · {inspection.telephoneLinkCount ?? "not recorded"}</b><b>Telephone inputs · {inspection.telephoneInputCount ?? "not recorded"}</b><b>Inputs with `inputmode` · {inspection.mobileInputModeCount ?? "not recorded"}</b></div>}
          {tool.id === "trust-credibility-analyzer" && inspection && <div className="tool-workflow-result-metrics"><span>Observed credibility-related JSON-LD declarations</span><b>Organization · {inspection.organizationStructuredDataCount ?? "not recorded"}</b><b>Review · {inspection.reviewStructuredDataCount ?? "not recorded"}</b><b>AggregateRating · {inspection.aggregateRatingStructuredDataCount ?? "not recorded"}</b></div>}
          {tool.id === "ux-analyzer" && inspection && <div className="tool-workflow-result-metrics"><span>Observed UX-related markup</span><b>Form elements · {inspection.formElementCount ?? "not recorded"}</b><b>Explicit ARIA roles · {inspection.ariaRoleAttributeCount ?? "not recorded"}</b><b>Skip links · {inspection.skipLinkCount ?? "not recorded"}</b></div>}
          {tool.id === "color-contrast-analyzer" && inspection && <div className="tool-workflow-result-metrics"><span>Observed CSS color declarations</span><b>Inline styles · {inspection.inlineColorDeclarationCount ?? "not recorded"}</b><b>Style blocks · {inspection.styleBlockColorDeclarationCount ?? "not recorded"}</b><b>Values · {inspection.observedColorValues?.join(" · ") || "none observed"}</b></div>}
          {tool.id === "typography-analyzer" && inspection && <div className="tool-workflow-result-metrics"><span>Observed CSS font-family declarations</span><b>Inline styles · {inspection.inlineFontFamilyDeclarationCount ?? "not recorded"}</b><b>Style blocks · {inspection.styleBlockFontFamilyDeclarationCount ?? "not recorded"}</b><b>Families · {inspection.observedFontFamilies?.join(" · ") || "none observed"}</b></div>}
          {tool.id === "conversion-analyzer" && inspection && <div className="tool-workflow-result-metrics"><span>Observed commerce-path markup</span><b>Cart links · {inspection.cartLinkCount ?? "not recorded"}</b><b>Checkout links · {inspection.checkoutLinkCount ?? "not recorded"}</b><b>Cart / checkout form actions · {inspection.cartOrCheckoutFormActionCount ?? "not recorded"}</b></div>}
          {tool.id === "breakpoint-analyzer" && inspection && <div className="tool-workflow-result-metrics"><span>Observed media-query conditions</span><b>Conditions · {inspection.mediaQueryConditionCount ?? "not recorded"}</b><b>Values · {inspection.observedMediaQueryConditions?.join(" · ") || "none observed"}</b></div>}
          {tool.id === "collection-analyzer" && inspection && <div className="tool-workflow-result-metrics"><span>Observed collection-path links</span><b>Link occurrences · {inspection.collectionLinkCount ?? "not recorded"}</b><b>Paths · {inspection.observedCollectionPaths?.join(" · ") || "none observed"}</b></div>}
          {tool.id === "product-presentation-analyzer" && inspection && <div className="tool-workflow-result-metrics"><span>Observed product image markup</span><b>Page image elements · {inspection.imageCount}</b><b>Product JSON-LD image declarations · {inspection.productImageStructuredDataCount ?? "not recorded"}</b><b>Product JSON-LD declarations · {inspection.productStructuredDataCount ?? "not recorded"}</b></div>}
          {tool.id === "product-content-analyzer" && inspection && <div className="tool-workflow-result-metrics"><span>Observed Product JSON-LD content declarations</span><b>Product titles · {inspection.productNames?.length ?? "not recorded"}</b><b>Product descriptions · {inspection.productDescriptionStructuredDataCount ?? "not recorded"}</b><b>Description characters · {inspection.productDescriptionCharacterCount ?? "not recorded"}</b></div>}
          {tool.id === "cart-analyzer" && inspection && <div className="tool-workflow-result-metrics"><span>Observed cart-path markup</span><b>Cart links · {inspection.cartLinkCount ?? "not recorded"}</b><b>Cart form actions · {inspection.cartFormActionCount ?? "not recorded"}</b></div>}
          {tool.id === "checkout-ux-analyzer" && inspection && <div className="tool-workflow-result-metrics"><span>Observed checkout-path markup</span><b>Checkout links · {inspection.checkoutLinkCount ?? "not recorded"}</b><b>Checkout form actions · {inspection.checkoutFormActionCount ?? "not recorded"}</b></div>}
          {tool.id === "customer-journey-analyzer" && inspection && <div className="tool-workflow-result-metrics"><span>Observed journey-path links</span><b>Product links · {inspection.productLinkCount ?? "not recorded"}</b><b>Collection links · {inspection.collectionLinkCount ?? "not recorded"}</b><b>Cart links · {inspection.cartLinkCount ?? "not recorded"}</b><b>Checkout links · {inspection.checkoutLinkCount ?? "not recorded"}</b></div>}
          {tool.id === "layout-analyzer" && inspection && <div className="tool-workflow-result-metrics"><span>Observed semantic layout markup</span><b>Headers · {inspection.headerElementCount ?? "not recorded"}</b><b>Main landmarks · {inspection.mainLandmarkCount}</b><b>Sections · {inspection.sectionElementCount ?? "not recorded"}</b><b>Articles · {inspection.articleElementCount ?? "not recorded"}</b><b>Footers · {inspection.footerElementCount ?? "not recorded"}</b></div>}
          {tool.id === "visual-design-analyzer" && inspection && <div className="tool-workflow-result-metrics"><span>Observed style declarations</span><b>Style blocks · {inspection.inlineStyleBlockCount ?? "not recorded"}</b><b>Color declarations · {(inspection.inlineColorDeclarationCount ?? 0) + (inspection.styleBlockColorDeclarationCount ?? 0)}</b><b>Font-family declarations · {(inspection.inlineFontFamilyDeclarationCount ?? 0) + (inspection.styleBlockFontFamilyDeclarationCount ?? 0)}</b></div>}
          {tool.id === "visual-hierarchy-analyzer" && inspection && <div className="tool-workflow-result-metrics"><span>Observed heading and interactive markup</span><b>Headings · {inspection.headingCount}</b><b>H1 · {inspection.headings?.filter(heading => heading.level === 1).length ?? "not recorded"}</b><b>H2 · {inspection.headings?.filter(heading => heading.level === 2).length ?? "not recorded"}</b><b>Text-bearing interactive elements · {inspection.ctaElementsWithText ?? "not recorded"}</b></div>}
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
              <div className="tool-workflow-version-placeholder"><span>Current draft</span><b>Persisted editor context</b><small>No rendered snapshot is stored for this draft.</small></div>
              <ArrowRight />
              <div className="tool-workflow-version-placeholder"><span>AI suggestion</span><b>Reviewable proposal only</b><small>Apply remains a manual editor decision; no store change is made.</small></div>
            </div>
          ) : (
            <div className="tool-workflow-live-canvas">{selectedPreviews[0] ? <img src={selectedPreviews[0]} alt="Uploaded screenshot preview" /> : <div className="tool-workflow-no-preview"><b>No rendered storefront preview is available.</b><span>This workspace can store reviewable draft metadata, but it does not claim to render or change a live store.</span></div>}<div className="tool-workflow-selection"><span>{selectedElement}</span></div></div>
          )}
          {proposalVisible && <div className="tool-workflow-proposal-actions"><button className="tool-workflow-primary" onClick={() => { setProposalApplied(true); setProposalVisible(false); setEditorDirty(true); setFinishNotice(`AI suggestion applied to ${editorDraftLabel}. You can continue editing it manually.`); }}>Apply change</button><button className="tool-workflow-secondary" onClick={() => setProposalVisible(false)}>Keep current</button></div>}
          <div className="tool-workflow-health-strip"><b>{inspection ? `HTTP ${inspection.statusCode} observed` : "Design health not measured"}</b><span>{latestValidation ? "Validation record available" : "No visual or score validation has been run"}</span><button onClick={() => requestEditorExit("review")}>Review validation</button></div>
        </main>
        <aside className="tool-workflow-inspector">
          <div className="tool-workflow-inspector-tabs"><button className={inspectorTab === "edit" ? "active" : ""} onClick={() => setInspectorTab("edit")}>Edit</button><button className={inspectorTab === "ai" ? "active" : ""} onClick={() => setInspectorTab("ai")}>Ask AI</button><button className={inspectorTab === "history" ? "active" : ""} onClick={() => setInspectorTab("history")}>History</button></div>
          {inspectorTab === "edit" && <EditorControls workspace={route.workspace} selectedElement={selectedElement} device={device} onOpenAi={() => setInspectorTab("ai")} onSave={() => { void saveVersion(); }} />}
          {inspectorTab === "ai" && <div className="tool-workflow-ai-panel"><div className="tool-workflow-ai-context"><Sparkles /><span><b>Context attached</b><small>{tool.name} · Product page · {selectedElement} · {device} · {editorDraftLabel}</small></span></div><div className="tool-workflow-sim-chat">{messages.map((message, index) => <div className={message.role} key={`${message.role}-${index}`}><b>{message.role === "assistant" ? "Ferix AI" : "You"}</b><p>{message.content}</p></div>)}<div className="tool-workflow-suggestions"><button onClick={() => sendToAi("Make this less crowded")}>Make this less crowded</button><button onClick={() => sendToAi("Use a more premium hierarchy")}>Use a more premium hierarchy</button></div><div className="tool-workflow-ai-input"><input value={aiInput} onChange={event => setAiInput(event.target.value)} onKeyDown={event => { if (event.key === "Enter") sendToAi(aiInput); }} placeholder="Ask AI to improve this selected item…" /><button onClick={() => sendToAi(aiInput)} aria-label="Send AI request"><Send /></button></div></div><button className="tool-workflow-primary" disabled={!messages.some(message => message.role === "assistant" && message.content !== `I am looking at **${tool.name}** on Product page → ${selectedElement} → ${device}. Tell me what you would like to improve, or attach a visual reference.`)} onClick={() => setProposalVisible(true)}><Wand2 /> {proposalApplied ? "Preview next suggestion" : "Preview AI response"}</button><button className="tool-workflow-reference"><ImagePlus /> Add screenshot or reference</button></div>}
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
          <div className="tool-workflow-version-compare"><div className="tool-workflow-version-placeholder"><span>Original reference</span><b>Persisted baseline metadata</b><small>No rendered snapshot is stored for this version.</small></div><ArrowRight /><div className="tool-workflow-version-placeholder"><span>{editorDraftLabel}</span><b>Current draft metadata</b><small>Save a version and run a supported validator before making visual claims.</small></div></div>
          <div className="tool-workflow-version-list">{[["Current tool context", "Persisted only after saving a version"], [editorDraftLabel, draftId ? "Current stored version" : "Current unsaved version"]].map(([name, note], index) => <button className={index === 1 ? "active" : ""} onClick={saveVersion} key={name}><i /> <span><b>{name}</b><small>{note}</small></span>{index === 1 && <Check />}</button>)}</div>
        </article>
        <article className="tool-workflow-card tool-workflow-validation-card">
          <span className="tool-workflow-kicker">Validation</span>
<h2>Validation status</h2>
          <div className={`tool-workflow-check ${latestValidation?.status === "passed" ? "good" : "notice"}`}><span>{latestValidation ? "Latest saved-draft validation" : "No validation run"}</span><b>{latestValidation ? (latestValidation.status === "passed" ? "Passed" : latestValidation.status === "failed" ? "Needs review" : latestValidation.status) : "Not measured"}</b></div>
          <div className="tool-workflow-scope"><ShieldCheck /><p>{latestValidation?.summary ? "The latest validator result is recorded in the workspace. Review its exact summary before release." : "No visual, accessibility, SEO, responsive, or provider-readiness claim is made until the corresponding validator records evidence."}</p></div>
          <button className="tool-workflow-secondary" onClick={() => setFinishNotice(latestValidation?.summary ? "Review the stored validation summary in Preview & validate before continuing." : "Run validation from Preview & validate to create a real validation record.")}>Review validation</button><button className="tool-workflow-primary" onClick={() => move("finish")}>Continue to finish <ArrowRight /></button>
        </article>
      </section>
    </>
  );

  const finishScreen = (
    <>
      <WorkflowHeader kicker={`${tool.name} · completion`} title="Finish this work the right way." copy="The final action is based on the source and store permission currently available." back={() => move("review")} />
      <section className="tool-workflow-finish-grid">
        {isConnected ? <article className="tool-workflow-card tool-workflow-release-card"><span className="tool-workflow-kicker">Connected store source selected</span><h2>Provider readiness still requires verification</h2><div className="tool-workflow-permission"><ShieldCheck /> Publish permission not verified</div><p>Your approved {tool.name} can be saved as a workspace draft. Provider-side draft creation and publishing remain gated until the configured adapter reports the required capability.</p><div className="tool-workflow-version-placeholder"><b>No provider-rendered draft snapshot</b><small>Only a configured adapter may create or publish a store-side draft.</small></div><div className="tool-workflow-release-checks"><span>✓ Workspace proposal remains reviewable</span><span>— Validation must be recorded</span><span>— Provider capability must be configured</span></div><button className="tool-workflow-primary" onClick={() => setFinishNotice("Provider publishing is not available for this deployment. Save or export the reviewed workspace state instead.")}>Provider publishing unavailable</button><button className="tool-workflow-secondary" onClick={() => { void saveVersion(); }}>Save workspace version</button></article> : <article className="tool-workflow-card tool-workflow-export-card"><span className="tool-workflow-kicker">No store connection? Still complete.</span><h2>Download your finished package</h2><p>Use the reviewed design in your own store system or share it with your developer.</p><div className="tool-workflow-package-list">{["Persisted tool evidence when an executor created it", "Workspace draft state and version metadata", "Reviewable proposal rationale and boundaries", "Developer handoff only after a real handoff artifact is generated"].map(item => <span key={item}>✓ {item}</span>)}</div><button className="tool-workflow-primary" onClick={() => setFinishNotice(reportId ? "Use the generated report download from the result screen." : "No design-package artifact has been generated for this run.")}><Download /> {reportId ? "Return to report download" : "Design package unavailable"}</button><button className="tool-workflow-secondary" onClick={() => setFinishNotice("A developer handoff download appears only after a handoff artifact is generated from recorded evidence.")}><FileDown /> Handoff artifact unavailable</button><div className="tool-workflow-scope"><Store /><p>Connect a supported store later to retain this project and unlock store-draft or publish actions where permissions allow.</p></div></article>}
        <article className="tool-workflow-card tool-workflow-alternative-finish"><span className="tool-workflow-kicker">Other finish route</span><h2>{isConnected ? "Need an implementation package instead?" : "Want publishing later?"}</h2><p>{isConnected ? "Download the evidence and developer handoff alongside your store release." : "Connect a supported store later and keep this project and its recorded workspace state."}</p><button className="tool-workflow-secondary" onClick={() => setFinishNotice(isConnected ? "Design package is ready to download." : "Store connection options are available from the Stores workspace when a provider adapter is configured.")}>{isConnected ? "Download design package" : "Connect a store"}</button><button className="tool-workflow-secondary" onClick={() => setFinishNotice("You can return to the tool result at any time.")}>Back to result</button></article>
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
      <article className="tool-workflow-card tool-specialist-action"><span className="tool-workflow-kicker">Next action</span><h2>{route.workspace}</h2><p>{technical ? "This workspace keeps the technical brief, affected context, acceptance criteria, and delivery choices together." : "Review the evidence and keep a clear record of the next decision."}</p>{route.allowsAi ? <button className="tool-workflow-primary" onClick={onAskAi}><Sparkles /> Create AI plan</button> : <button className="tool-workflow-primary" disabled><FileDown /> No recommendation executor</button>}<button className="tool-workflow-secondary" onClick={onContinue}>{technical ? "Review handoff package" : "Continue to review"} <ArrowRight /></button><button className="tool-specialist-export" disabled><Download /> No report artifact</button></article>
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
