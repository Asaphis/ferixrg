// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import ManualEditor from "./ManualEditor";

const context = { projectTitle: "Homepage mobile review", toolName: "Responsive Analysis", source: "Project / Saved Analysis", finding: "Hero button exceeds mobile container", evidence: "Mobile 375 px · Primary CTA", recommendation: "Set a maximum width and review the layout." };
const renderEditor = () => render(<ManualEditor context={context} mode="Manual" onModeChange={vi.fn()} onBack={vi.fn()} />);

describe("local-only product Manual Editor", () => {
  beforeEach(() => cleanup());

  it("allows direct selected-text editing on the sample storefront", () => {
    renderEditor();
    fireEvent.change(screen.getAllByRole("textbox")[0]!, { target: { value: "A prototype change" } });
    expect(screen.getAllByText("A prototype change").length).toBeGreaterThan(0);
  });

  it("adds a local section divider to the selected hero section", () => {
    renderEditor();
    fireEvent.click(screen.getAllByRole("button", { name: "Hero section" })[0]!);
    fireEvent.click(screen.getByRole("button", { name: "Shape" }));
    const selects = screen.getAllByRole("combobox");
    fireEvent.change(selects[1]!, { target: { value: "w-shape" } });
    expect(document.querySelector('[aria-label="w-shape bottom divider"]')).not.toBeNull();
  });

  it("opens an independent sample page and inserts a visible element", () => {
    renderEditor();
    fireEvent.click(screen.getAllByRole("button", { name: "Pages" })[0]!);
    fireEvent.click(screen.getByRole("button", { name: "Product details" }));
    fireEvent.click(screen.getAllByRole("button", { name: "Add" })[0]!);
    fireEvent.click(screen.getByRole("button", { name: "Heading" }));
    expect(screen.getAllByText("Your new heading").length).toBeGreaterThan(0);
  });

  it("opens a reviewable local AI proposal without calling an AI service", () => {
    const onModeChange = vi.fn();
    render(<ManualEditor context={context} mode="Manual" onModeChange={onModeChange} onBack={vi.fn()} />);

    fireEvent.click(screen.getByRole("button", { name: /Ask AI about this selection/ }));

    expect(onModeChange).toHaveBeenCalledWith("AI proposal");
    expect(screen.getByText("AI review — prototype only")).toBeTruthy();
    expect(screen.getByText(/does not call an AI service/)).toBeTruthy();
  });

  it("keeps the complete five-action mobile editing navigation available", () => {
    renderEditor();
    ["Select", "Add", "Layers", "AI", "More"].forEach(label => {
      expect(screen.getAllByRole("button", { name: label }).length).toBeGreaterThan(0);
    });
  });
});
