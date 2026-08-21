import { describe, expect, it, vi } from "vitest";
import { inspectPublicUrl, validatePublicInspectionUrl } from "./publicUrlExecutor";

describe("public URL inspection executor", () => {
  it("records only observed HTML metadata and accessibility-relevant document facts", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ status: 200, headers: { get: (name: string) => name === "content-type" ? "text/html; charset=utf-8" : null }, body: new ReadableStream({ start(controller) { controller.enqueue(new TextEncoder().encode('<html lang="en"><head><title>Store</title><meta name="viewport" content="width=device-width"><link rel="canonical" href="https://shop.example/"></head><body><nav><a href="/shop">Shop</a><a href="/menu"><svg></svg></a></nav><main><h1>Store</h1><img src="product.jpg"></main></body></html>')); controller.close(); } }) }));
    await expect(inspectPublicUrl("https://shop.example")).resolves.toMatchObject({ statusCode: 200, title: "Store", language: "en", hasViewport: true, headingCount: 1, headings: [{ level: 1, text: "Store" }], imageCount: 1, imagesWithAlt: 0, imagesWithoutAlt: 1, linkCount: 2, linksWithText: 1, linksWithoutText: 1, navigationLandmarkCount: 1, mainLandmarkCount: 1, ctaElementCount: 2, ctaElementsWithText: 1, ctaElementsWithoutText: 1, ctaTexts: ["Shop"] });
  });

  it("blocks local and private network targets before any request", () => {
    expect(() => validatePublicInspectionUrl("http://127.0.0.1:3000")).toThrow(/public storefront/i);
    expect(() => validatePublicInspectionUrl("http://localhost:3000")).toThrow(/public storefront/i);
  });

  it("records elapsed fetch-and-read time as an observed page-transfer indicator", async () => {
    const clock = vi.spyOn(Date, "now").mockReturnValueOnce(1_000).mockReturnValueOnce(1_275);
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ status: 200, headers: { get: (name: string) => name === "content-type" ? "text/html" : null }, body: new ReadableStream({ start(controller) { controller.enqueue(new TextEncoder().encode("<html><body>Store</body></html>")); controller.close(); } }) }));

    await expect(inspectPublicUrl("https://shop.example")).resolves.toMatchObject({ fetchAndReadDurationMs: 275, bytesRead: 31 });
    clock.mockRestore();
  });

  it("records extracted body-text, paragraph, and heading indicators without scoring writing quality", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ status: 200, headers: { get: (name: string) => name === "content-type" ? "text/html" : null }, body: new ReadableStream({ start(controller) { controller.enqueue(new TextEncoder().encode('<html><body><h1>Welcome</h1><h2></h2><p>Discover carefully selected products.</p><p> </p><script>ignored words</script></body></html>')); controller.close(); } }) }));

    await expect(inspectPublicUrl("https://shop.example")).resolves.toMatchObject({ bodyTextCharacterCount: 45, bodyTextWordCount: 5, paragraphCount: 2, paragraphsWithText: 1, emptyHeadingCount: 1 });
  });

  it("records only parsed Product JSON-LD declarations without querying a catalog", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ status: 200, headers: { get: (name: string) => name === "content-type" ? "text/html" : null }, body: new ReadableStream({ start(controller) { controller.enqueue(new TextEncoder().encode('<html><body><script type="application/ld+json">{"@context":"https://schema.org","@type":"Product","name":"Canvas Tote","offers":[{"@type":"Offer"},{"@type":"Offer"}]}</script></body></html>')); controller.close(); } }) }));

    await expect(inspectPublicUrl("https://shop.example")).resolves.toMatchObject({ productStructuredDataCount: 1, productNames: ["Canvas Tote"], productOfferCount: 2 });
  });
});
