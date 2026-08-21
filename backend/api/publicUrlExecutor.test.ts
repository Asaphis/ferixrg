import { describe, expect, it, vi } from "vitest";
import { inspectPublicUrl, validatePublicInspectionUrl } from "./publicUrlExecutor";

describe("public URL inspection executor", () => {
  it("records only observed HTML metadata and accessibility-relevant document facts", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ status: 200, headers: { get: (name: string) => name === "content-type" ? "text/html; charset=utf-8" : null }, body: new ReadableStream({ start(controller) { controller.enqueue(new TextEncoder().encode('<html lang="en"><head><title>Store</title><meta name="viewport" content="width=device-width"><link rel="canonical" href="https://shop.example/"></head><body><nav><a href="/shop">Shop</a><a href="/menu"><svg></svg></a></nav><main><h1>Store</h1><img src="product.jpg"></main></body></html>')); controller.close(); } }) }));
    await expect(inspectPublicUrl("https://shop.example")).resolves.toMatchObject({ statusCode: 200, title: "Store", language: "en", hasViewport: true, headingCount: 1, headings: [{ level: 1, text: "Store" }], imageCount: 1, imagesWithAlt: 0, imagesWithoutAlt: 1, linkCount: 2, linksWithText: 1, linksWithoutText: 1, navigationLandmarkCount: 1, mainLandmarkCount: 1 });
  });

  it("blocks local and private network targets before any request", () => {
    expect(() => validatePublicInspectionUrl("http://127.0.0.1:3000")).toThrow(/public storefront/i);
    expect(() => validatePublicInspectionUrl("http://localhost:3000")).toThrow(/public storefront/i);
  });
});
