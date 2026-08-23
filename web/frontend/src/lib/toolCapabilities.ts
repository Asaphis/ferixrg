import type { ToolSource } from "./toolCatalog";
import type { ToolRoute } from "./toolRouting";

export type UserMode = "Explorer" | "Project user" | "Connected-store user" | "Developer / agency";
export type CapabilityAction = "ask_ai" | "create_proposal" | "save_project" | "export_report" | "create_store_draft" | "validate" | "publish" | "developer_handoff";

export type RunCapability = {
  mode: UserMode;
  label: string;
  scope: string;
  actions: CapabilityAction[];
  lockedMessage: string;
};

export type SourceAvailability = {
  available: boolean;
  label: string;
  message: string;
};

const publicUrlExecutorToolIds = new Set([
  "storefront-analyzer", "page-analyzer", "site-structure-analyzer", "visual-design-analyzer", "layout-analyzer", "visual-hierarchy-analyzer", "typography-analyzer", "color-contrast-analyzer", "ux-analyzer", "conversion-analyzer", "cta-analyzer", "trust-credibility-analyzer", "customer-journey-analyzer", "responsive-analyzer", "mobile-ux-analyzer", "breakpoint-analyzer", "product-page-analyzer", "product-presentation-analyzer", "product-content-analyzer", "navigation-analyzer", "collection-analyzer", "cart-analyzer", "checkout-ux-analyzer", "content-quality-analyzer", "seo-analyzer", "heading-structure-analyzer", "image-seo-analyzer", "performance-analyzer", "image-optimization-analyzer", "asset-analyzer", "accessibility-analyzer",
]);

export function getSourceAvailability(source: ToolSource, toolId: string, isAiConfigured: boolean = false): SourceAvailability {
  if (source === "Public URL" || source === "Specific page URL") {
    return publicUrlExecutorToolIds.has(toolId)
      ? { available: true, label: "Ready", message: "This tool has a bounded public-URL executor." }
      : { available: false, label: "Not yet available", message: "This tool has no dedicated public-URL executor yet. No run will be queued." };
  }
  if (source === "Screenshots") {
    return toolId === "screenshot-analyzer"
      ? { available: true, label: "Ready", message: "Selected images will be uploaded, evidenced, and sent to the screenshot vision executor." }
      : { available: false, label: "Choose Screenshot Analyzer", message: "Only Screenshot Analyzer currently has a screenshot executor. No run will be queued for this tool." };
  }
  if (source === "Saved draft") {
    return toolId === "before-after-comparator"
      ? { available: true, label: "Ready", message: "Two persisted draft versions will be compared deterministically." }
      : { available: false, label: "Not yet available", message: "Saved-draft execution is currently limited to Before/After Comparator." };
  }
  if (source === "Connected store") return { available: false, label: "Provider required", message: "Connected-store execution is unavailable until a provider API and OAuth executor are configured." };
  // Check for AI tools that require Cloudflare configuration
  const aiToolIds = new Set(["ai-design-copilot", "ai-store-redesign", "visual-style-studio", "responsive-studio", "layout-composer", "component-builder", "content-editor", "accessibility-fix-assistant", "ai-content-improver", "product-description-generator", "cta-generator", "seo-content-generator", "meta-generator"]);
  if (aiToolIds.has(toolId) && !isAiConfigured) {
    return { available: false, label: "AI not configured", message: "This tool requires Cloudflare Workers AI credentials (CLOUDFLARE_ACCOUNT_ID and CLOUDFLARE_API_TOKEN) to be configured on the server." };
  }
  return { available: false, label: "Not yet available", message: "This input is selectable for planning, but its live executor has not been implemented yet." };
}

export function getRunCapability(source: ToolSource, route: ToolRoute): RunCapability {
  if (source === "Theme files") {
    return {
      mode: "Developer / agency",
      label: "Technical input attached",
      scope: "Theme or code context is available for a technical plan. Changes remain review-only until a compatible release target is confirmed.",
      actions: ["export_report", "developer_handoff"],
      lockedMessage: "Visual publishing is not available from this technical input alone.",
    };
  }
  if (source === "Connected store") {
    return {
      mode: "Connected-store user",
      label: "Connected store context",
      scope: "Store context is attached. Store drafts, validation, and publishing only appear when this tool and granted platform permissions support them.",
      actions: ["ask_ai", "create_proposal", "save_project", "export_report", "developer_handoff", ...(route.supportsStoreRelease ? ["create_store_draft", "validate", "publish"] as CapabilityAction[] : [])],
      lockedMessage: route.supportsStoreRelease ? "Live release still requires an explicit confirmation." : "This tool does not create a live store change.",
    };
  }
  if (source === "Saved draft") {
    return {
      mode: "Project user",
      label: "Saved project context",
      scope: "Your saved draft and prior versions are attached. You can continue the proposal, compare versions, and export a completed package.",
      actions: ["ask_ai", "create_proposal", "save_project", "export_report", "developer_handoff", "validate"],
      lockedMessage: "Connect a supported store later to create a store draft or publish.",
    };
  }
  return {
    mode: "Explorer",
    label: "Public analysis",
    scope: "Visible storefront or screenshot evidence only. No private product, theme, checkout, or publishing data has been accessed.",
    actions: ["ask_ai", "create_proposal", "save_project", "export_report", "developer_handoff"],
    lockedMessage: "Connect a supported store to unlock private context, store drafts, validation, and publishing where available.",
  };
}
