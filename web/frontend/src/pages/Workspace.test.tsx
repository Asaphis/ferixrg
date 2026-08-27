import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import Workspace from "./Workspace";

describe("approved premium dashboard overview", () => {
  it("renders resume-work modules and lists all 12 tools before any source selection", () => {
    const markup = renderToStaticMarkup(<Workspace />);

    expect(markup).toContain("Continue where you stopped");
    expect(markup).toContain("Recent stores");
    expect(markup).toContain("Recent projects &amp; drafts");
    expect(markup).toContain("Active analyses");
    expect(markup).toContain("Release &amp; validation");
    expect(markup).toContain("Choose a tool first.");
    expect(markup).not.toContain("Studio");
    expect(markup).not.toContain("Manual Editor");

    ["Design", "Responsive", "Structure", "UX", "Conversion", "SEO", "Performance", "Accessibility", "Security", "Content", "Asset", "Design System"].forEach(tool => {
      expect(markup).toContain(`>${tool}</span>`);
    });

    expect(markup).not.toContain("Compatible sources appear next.</p><div class=\"analysis-tool-strip\"><button");
  });

  it("keeps the Tools catalogue tool-first and exposes all 12 approved analyses", () => {
    const markup = renderToStaticMarkup(<Workspace initialView="Tools" />);

    expect(markup).toContain("Choose a tool first. Compatible sources appear next.");
    expect(markup).not.toContain("Choose a supported source");
    expect(markup).not.toContain("Manual Design Editor");
    expect(markup).not.toContain("Responsive Editor");

    ["Design Analysis", "Responsive Analysis", "Structure Analysis", "UX Analysis", "Conversion Analysis", "SEO Analysis", "Performance Analysis", "Accessibility Analysis", "Security Analysis", "Content Analysis", "Asset Analysis", "Design System Analysis"].forEach(tool => {
      expect(markup).toContain(tool);
    });
  });
});
