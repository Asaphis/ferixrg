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

    ["Design", "Responsive", "Structure", "UX", "Conversion", "SEO", "Performance", "Accessibility", "Security", "Content", "Asset", "Design System"].forEach(tool => {
      expect(markup).toContain(`>${tool}</span>`);
    });

    expect(markup).not.toContain("Compatible sources appear next.</p><div class=\"analysis-tool-strip\"><button");
  });
});
