import { describe, expect, it } from "vitest";
import { filterTools, toolCatalog, toolCategoryOrder } from "./toolCatalog";

describe("Tools Library catalogue", () => {
  it("contains the complete exact specification catalogue across every named work category", () => {
    expect(toolCatalog).toHaveLength(57);
    expect(new Set(toolCatalog.map(tool => tool.category))).toEqual(new Set(toolCategoryOrder));
    expect(toolCatalog.map(tool => tool.name)).toEqual(expect.arrayContaining(["Storefront Analyzer", "AI Store Redesign", "AI Design Copilot", "Responsive Studio", "Publish Manager", "Rollback"]));
  });

  it("clearly distinguishes tools that can begin from a public URL from tools that require a connected integration", () => {
    expect(toolCatalog.find(tool => tool.id === "storefront-analyzer")).toMatchObject({ requiresConnection: false, sources: expect.arrayContaining(["Public URL", "Screenshots"]) });
    expect(toolCatalog.find(tool => tool.id === "publish-manager")).toMatchObject({ requiresConnection: true, connections: expect.arrayContaining(["Supported store connection"]) });
  });

  it("finds tools by functional language, source type, and category instead of name alone", () => {
    expect(filterTools("purchase path", "All tools").map(tool => tool.id)).toContain("conversion-analyzer");
    expect(filterTools("theme code", "All tools").map(tool => tool.id)).toContain("theme-code-analyzer");
    expect(filterTools("", "Design Workspaces")).toHaveLength(5);
    expect(filterTools("accessible label", "All tools").map(tool => tool.id)).toContain("accessibility-fix-assistant");
  });
});
