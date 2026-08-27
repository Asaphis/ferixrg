import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import ManualEditor from "./ManualEditor";

const context = {
  projectTitle: "Homepage mobile review",
  toolName: "Responsive Analysis",
  source: "Project / Saved Analysis",
  finding: "Mobile navigation overlaps the primary action",
  evidence: "375 px navigation and checkout visibility",
  recommendation: "Increase navigation spacing and preserve clear touch targets.",
  focusLabels: ["Visual hierarchy", "Mobile layout"],
};

describe("ManualEditor", () => {
  it("renders the complete editor shell and its contextual workspace areas", () => {
    const markup = renderToStaticMarkup(<ManualEditor context={context} mode="Manual" onModeChange={vi.fn()} onBack={vi.fn()} />);

    ["Manual Editor", "Add", "Layers", "Pages", "Assets", "Components", "Homepage", "Hero heading", "Desktop", "Tablet", "Mobile", "Design", "Responsive", "Content", "Advanced", "Validate", "Publish"].forEach(label => {
      expect(markup).toContain(label);
    });
    expect(markup).toContain("Mobile navigation overlaps the primary action");
  });

  it("includes local page, asset, component, and breakpoint-aware editing controls", () => {
    const assets = renderToStaticMarkup(<ManualEditor context={context} mode="Manual" onModeChange={vi.fn()} onBack={vi.fn()} initialPanel="Assets" />);
    const components = renderToStaticMarkup(<ManualEditor context={context} mode="Manual" onModeChange={vi.fn()} onBack={vi.fn()} initialPanel="Components" />);
    const pages = renderToStaticMarkup(<ManualEditor context={context} mode="Manual" onModeChange={vi.fn()} onBack={vi.fn()} initialPanel="Pages" />);
    const responsive = renderToStaticMarkup(<ManualEditor context={context} mode="Manual" onModeChange={vi.fn()} onBack={vi.fn()} initialInspectorTab="Responsive" />);
    const content = renderToStaticMarkup(<ManualEditor context={context} mode="Manual" onModeChange={vi.fn()} onBack={vi.fn()} initialInspectorTab="Content" />);

    ["Upload asset", "Image, video, SVG, font, or file"].forEach(label => expect(assets).toContain(label));
    expect(components).toContain("Save selected layer");
    expect(pages).toContain("Create page");
    ["Current breakpoint", "Add breakpoint"].forEach(label => expect(responsive).toContain(label));
    expect(content).toContain("Typography · Desktop");
  });

  it("keeps vector drawing and release controls separate from automatic publishing", () => {
    const markup = renderToStaticMarkup(<ManualEditor context={context} mode="Manual" onModeChange={vi.fn()} onBack={vi.fn()} />);

    ["Select", "Pen", "Pencil", "Compare", "Validate", "Publish"].forEach(label => expect(markup).toContain(label));
    expect(markup).not.toContain("Publish now");
  });

  it("keeps AI changes in a reviewable proposal state", () => {
    const markup = renderToStaticMarkup(<ManualEditor context={context} mode="AI proposal" onModeChange={vi.fn()} onBack={vi.fn()} />);

    expect(markup).toContain("AI proposal mode");
    expect(markup).toContain("Review changes before applying them.");
    expect(markup).toContain("Increase navigation spacing and preserve clear touch targets.");
  });
});
