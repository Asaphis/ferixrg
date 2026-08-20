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
      actions: ["ask_ai", "create_proposal", "save_project", "export_report", ...(route.supportsStoreRelease ? ["create_store_draft", "validate", "publish"] as CapabilityAction[] : [])],
      lockedMessage: route.supportsStoreRelease ? "Live release still requires an explicit confirmation." : "This tool does not create a live store change.",
    };
  }
  if (source === "Saved draft") {
    return {
      mode: "Project user",
      label: "Saved project context",
      scope: "Your saved draft and prior versions are attached. You can continue the proposal, compare versions, and export a completed package.",
      actions: ["ask_ai", "create_proposal", "save_project", "export_report", "validate"],
      lockedMessage: "Connect a supported store later to create a store draft or publish.",
    };
  }
  return {
    mode: "Explorer",
    label: "Public analysis",
    scope: "Visible storefront or screenshot evidence only. No private product, theme, checkout, or publishing data has been accessed.",
    actions: ["ask_ai", "create_proposal", "save_project", "export_report"],
    lockedMessage: "Connect a supported store to unlock private context, store drafts, validation, and publishing where available.",
  };
}
