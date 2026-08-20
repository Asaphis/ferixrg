import type { EditorDraftState } from "./editorDraftState";

export type SimulatedDraft = {
  id: string;
  title: string;
  label: string;
  score: number;
  scoreDelta: number;
  time: string;
  note: string;
  tone: "current" | "conversion" | "premium" | "baseline";
  designState: string;
  isCurrent: boolean;
};

const storageKey = "ferixrg:simulated-editor-drafts:v1";

const state = (draftState: EditorDraftState) => JSON.stringify(draftState);

export const previewDrafts: SimulatedDraft[] = [
  { id: "sim-current", title: "Draft v3", label: "Current preview", score: 82, scoreDelta: 4, time: "Just now", note: "Improves purchase-action hierarchy at 390px.", tone: "current", designState: state({ device: "Mobile", selectedElement: "Price & purchase", spacing: { top: 24, bottom: 16 }, accentColor: "#155eef" }), isCurrent: true },
  { id: "sim-conversion", title: "Alternative B", label: "Conversion-led", score: 79, scoreDelta: 8, time: "22 min ago", note: "Moves trust context to the point of purchase intent.", tone: "conversion", designState: state({ device: "Mobile", selectedElement: "Trust row", spacing: { top: 20, bottom: 18 }, accentColor: "#155eef" }), isCurrent: false },
  { id: "sim-premium", title: "Alternative A", label: "Premium path", score: 76, scoreDelta: 5, time: "41 min ago", note: "Introduces a calmer, more spacious product narrative.", tone: "premium", designState: state({ device: "Tablet", selectedElement: "Heading", spacing: { top: 32, bottom: 20 }, accentColor: "#223a77" }), isCurrent: false },
  { id: "sim-baseline", title: "Baseline", label: "Original render", score: 71, scoreDelta: 0, time: "Before redesign", note: "The untouched mobile product page captured in scan 018.", tone: "baseline", designState: state({ device: "Mobile", selectedElement: "Product media", spacing: { top: 16, bottom: 12 }, accentColor: "#7d8795" }), isCurrent: false },
];

export function parseSimulatedDrafts(serialized: string | null): SimulatedDraft[] {
  if (!serialized) return previewDrafts;
  try {
    const parsed = JSON.parse(serialized);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed as SimulatedDraft[] : previewDrafts;
  } catch {
    return previewDrafts;
  }
}

export function loadSimulatedDrafts(): SimulatedDraft[] {
  if (typeof window === "undefined") return previewDrafts;
  return parseSimulatedDrafts(window.localStorage.getItem(storageKey));
}

export function persistSimulatedDrafts(drafts: SimulatedDraft[]) {
  if (typeof window !== "undefined") window.localStorage.setItem(storageKey, JSON.stringify(drafts));
}
