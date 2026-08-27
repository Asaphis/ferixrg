// @vitest-environment jsdom
import { renderToStaticMarkup } from "react-dom/server";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
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
  beforeEach(() => {
    cleanup();
    window.localStorage.clear();
    window.matchMedia = vi.fn().mockImplementation(() => ({ matches: false, addEventListener: vi.fn(), removeEventListener: vi.fn() }));
  });
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

    ["Select", "Pen", "Pencil", "Compare", "Validate", "Publish", "Vector drawing canvas"].forEach(label => expect(markup).toContain(label));
    expect(markup).not.toContain("Publish now");
  });

  it("keeps AI changes in a reviewable proposal state", () => {
    const markup = renderToStaticMarkup(<ManualEditor context={context} mode="AI proposal" onModeChange={vi.fn()} onBack={vi.fn()} />);

    expect(markup).toContain("AI proposal mode");
    expect(markup).toContain("Review changes before applying them.");
    expect(markup).toContain("Increase navigation spacing and preserve clear touch targets.");
  });

  it("keeps mobile Studio navigation and contextual editing controls available without removing desktop inspector capabilities", () => {
    const markup = renderToStaticMarkup(<ManualEditor context={context} mode="Manual" onModeChange={vi.fn()} onBack={vi.fn()} />);
    const addMarkup = renderToStaticMarkup(<ManualEditor context={context} mode="Manual" onModeChange={vi.fn()} onBack={vi.fn()} initialPanel="Add" />);

    ["Select", "Add", "Layers", "AI", "More", "Edit", "Style", "Move", "Duplicate", "Delete", "Layout", "Effects"].forEach(label => {
      expect(markup).toContain(label);
    });
    expect(addMarkup).toContain("Search components");
    expect(markup).not.toContain("Publish now");
  });

  it("updates the selected text directly on the local canvas", () => {
    render(<ManualEditor context={context} mode="Manual" onModeChange={vi.fn()} onBack={vi.fn()} initialInspectorTab="Content" />);

    fireEvent.change(screen.getByRole("textbox"), { target: { value: "A directly edited heading" } });

    expect(screen.getAllByText("A directly edited heading").length).toBeGreaterThan(0);
  });

  it("renders an editable section-bottom divider immediately in the local canvas", () => {
    const { container } = render(<ManualEditor context={context} mode="Manual" onModeChange={vi.fn()} onBack={vi.fn()} />);

    fireEvent.click(container.querySelector(".canvas-hero")!);
    const dividerSelects = Array.from(container.querySelectorAll("select")).filter(select => Array.from(select.options).some(option => option.value === "wave"));
    expect(dividerSelects).toHaveLength(2);
    fireEvent.change(dividerSelects[1]!, { target: { value: "wave" } });

    expect(container.querySelector('[aria-label="wave bottom divider"]')).not.toBeNull();
  });
});
