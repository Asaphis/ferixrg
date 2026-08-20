export type EditorDraftState = {
  device: "Desktop" | "Tablet" | "Mobile";
  selectedElement: string;
  spacing: { top: number; bottom: number };
  accentColor: string;
};

const fallbackState: EditorDraftState = {
  device: "Mobile",
  selectedElement: "Price & purchase",
  spacing: { top: 24, bottom: 16 },
  accentColor: "#155eef",
};

export function parseEditorDraftState(serialized: string): EditorDraftState | null {
  try {
    const parsed = JSON.parse(serialized) as Partial<EditorDraftState>;
    const device = parsed.device === "Desktop" || parsed.device === "Tablet" || parsed.device === "Mobile" ? parsed.device : fallbackState.device;
    const selectedElement = typeof parsed.selectedElement === "string" && parsed.selectedElement.length > 0 ? parsed.selectedElement : fallbackState.selectedElement;
    const top = typeof parsed.spacing?.top === "number" ? parsed.spacing.top : fallbackState.spacing.top;
    const bottom = typeof parsed.spacing?.bottom === "number" ? parsed.spacing.bottom : fallbackState.spacing.bottom;
    const accentColor = typeof parsed.accentColor === "string" && parsed.accentColor.length > 0 ? parsed.accentColor : fallbackState.accentColor;
    return { device, selectedElement, spacing: { top, bottom }, accentColor };
  } catch {
    return null;
  }
}
