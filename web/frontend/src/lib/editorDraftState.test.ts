import { describe, expect, it } from "vitest";
import { parseEditorDraftState } from "./editorDraftState";

describe("parseEditorDraftState", () => {
  it("rehydrates the persisted editor context used after draft restoration", () => {
    const restored = parseEditorDraftState(JSON.stringify({ device: "Tablet", selectedElement: "Trust row", spacing: { top: 32, bottom: 20 }, accentColor: "#223a77" }));

    expect(restored).toEqual({ device: "Tablet", selectedElement: "Trust row", spacing: { top: 32, bottom: 20 }, accentColor: "#223a77" });
  });

  it("does not apply malformed serialized data to an active editor", () => {
    expect(parseEditorDraftState("not-json")).toBeNull();
  });
});
