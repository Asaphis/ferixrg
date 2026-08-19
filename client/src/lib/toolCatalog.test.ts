import { describe, expect, it } from "vitest";
import { filterTools, toolCatalog } from "./toolCatalog";

describe("Tools Library catalogue", () => {
  it("contains a discoverable tool set across every supported work category", () => {
    expect(toolCatalog.length).toBeGreaterThanOrEqual(20);
    expect(new Set(toolCatalog.map(tool => tool.category))).toEqual(new Set(["Observe", "Diagnose", "Create", "Validate & ship"]));
  });

  it("clearly distinguishes tools that can begin from a public URL from tools that require a connected integration", () => {
    expect(toolCatalog.find(tool => tool.id === "storefront-scan")).toMatchObject({ requiresConnection: false, sources: expect.arrayContaining(["Public URL"]) });
    expect(toolCatalog.find(tool => tool.id === "store-publisher")).toMatchObject({ requiresConnection: true, connections: expect.arrayContaining(["Shopify store", "WooCommerce store"]) });
  });

  it("finds tools by functional language, source type, and category instead of name alone", () => {
    expect(filterTools("purchase path", "All tools").map(tool => tool.id)).toContain("checkout-friction");
    expect(filterTools("github", "All tools").map(tool => tool.id)).toContain("theme-sync");
    expect(filterTools("", "Create")).toHaveLength(6);
  });
});
