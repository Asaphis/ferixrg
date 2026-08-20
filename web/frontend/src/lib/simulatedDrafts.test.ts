import { describe, expect, it } from "vitest";
import { parseSimulatedDrafts, previewDrafts } from "./simulatedDrafts";

describe("simulated preview drafts", () => {
  it("starts a sign-in-free preview with a usable set of comparison alternatives", () => {
    expect(parseSimulatedDrafts(null)).toHaveLength(4);
    expect(previewDrafts.find(draft => draft.isCurrent)?.id).toBe("sim-current");
  });

  it("reloads locally serialized draft history without falling back to the default examples", () => {
    const serialized = JSON.stringify([{ ...previewDrafts[0], id: "saved-local-draft", title: "Saved preview" }]);
    expect(parseSimulatedDrafts(serialized)).toEqual([expect.objectContaining({ id: "saved-local-draft", title: "Saved preview" })]);
  });
});
