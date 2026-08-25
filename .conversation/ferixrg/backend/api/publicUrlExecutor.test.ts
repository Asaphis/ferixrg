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

  it("rejects a redirect to a private network destination before following it", async () => {
    const fetchMock = vi.fn().mockResolvedValue({ status: 302, headers: { get: (name: string) => name === "location" ? "http://127.0.0.1:3000/admin" : null } });
    vi.stubGlobal("fetch", fetchMock);

    await expect(inspectPublicUrl("https://shop.example")).rejects.toThrow(/public storefront/i);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("fails inspection for non-2xx responses instead of creating a successful result", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ status: 503, headers: { get: () => "text/html" } }));

    await expect(inspectPublicUrl("https://shop.example")).rejects.toThrow(/HTTP 503/i);
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

  it("records observed image loading and dimension attributes without measuring image bytes", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ status: 200, headers: { get: (name: string) => name === "content-type" ? "text/html" : null }, body: new ReadableStream({ start(controller) { controller.enqueue(new TextEncoder().encode('<html><body><img src="hero.jpg" loading="lazy" width="1200" height="900"><img src="product.jpg" loading="eager"></body></html>')); controller.close(); } }) }));

    await expect(inspectPublicUrl("https://shop.example")).resolves.toMatchObject({ imageCount: 2, imagesLazyLoaded: 1, imagesWithDimensions: 1, imagesWithoutDimensions: 1 });
  });

  it("records observed image, stylesheet, and script reference hosts without loading assets", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ status: 200, headers: { get: (name: string) => name === "content-type" ? "text/html" : null }, body: new ReadableStream({ start(controller) { controller.enqueue(new TextEncoder().encode('<html><head><link rel="stylesheet" href="/theme.css"><script src="https://cdn.example/app.js"></script></head><body><img src="/hero.jpg"></body></html>')); controller.close(); } }) }));

    await expect(inspectPublicUrl("https://shop.example")).resolves.toMatchObject({ assetReferenceCount: 3, imageAssetReferenceCount: 1, stylesheetAssetReferenceCount: 1, scriptAssetReferenceCount: 1, assetHosts: ["shop.example", "cdn.example"] });
  });

  it("records viewport and inline responsive-style markup indicators without rendering a device view", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ status: 200, headers: { get: (name: string) => name === "content-type" ? "text/html" : null }, body: new ReadableStream({ start(controller) { controller.enqueue(new TextEncoder().encode('<html><head><meta name="viewport" content="width=device-width"><style>@media (max-width: 700px) { .hero { display: block; } }</style></head><body><img src="/hero.jpg" srcset="/hero-640.jpg 640w, /hero-1280.jpg 1280w"></body></html>')); controller.close(); } }) }));

    await expect(inspectPublicUrl("https://shop.example")).resolves.toMatchObject({ hasViewport: true, inlineStyleBlockCount: 1, inlineMediaQueryCount: 1, responsiveImageSrcsetCount: 1 });
  });

  it("records telephone and input-mode markup indicators without assessing mobile usability", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ status: 200, headers: { get: (name: string) => name === "content-type" ? "text/html" : null }, body: new ReadableStream({ start(controller) { controller.enqueue(new TextEncoder().encode('<html><head><meta name="viewport" content="width=device-width"></head><body><a href="tel:+15551234567">Call</a><input type="tel"><input inputmode="numeric"></body></html>')); controller.close(); } }) }));

    await expect(inspectPublicUrl("https://shop.example")).resolves.toMatchObject({ hasViewport: true, telephoneLinkCount: 1, telephoneInputCount: 1, mobileInputModeCount: 1 });
  });

  it("records parsed Organization, Review, and AggregateRating declarations without assessing trust or rating quality", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ status: 200, headers: { get: (name: string) => name === "content-type" ? "text/html" : null }, body: new ReadableStream({ start(controller) { controller.enqueue(new TextEncoder().encode('<html><head><script type="application/ld+json">{"@graph":[{"@type":"Organization","name":"Example"},{"@type":"Review","reviewBody":"Observed declaration"},{"@type":"AggregateRating","ratingValue":"4.8"}]}</script></head><body></body></html>')); controller.close(); } }) }));

    await expect(inspectPublicUrl("https://shop.example")).resolves.toMatchObject({ organizationStructuredDataCount: 1, reviewStructuredDataCount: 1, aggregateRatingStructuredDataCount: 1 });
  });

  it("records form, explicit role, and skip-link markup without assessing usability", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ status: 200, headers: { get: (name: string) => name === "content-type" ? "text/html" : null }, body: new ReadableStream({ start(controller) { controller.enqueue(new TextEncoder().encode('<html><body><a href="#content">Skip to content</a><nav role="navigation"></nav><main id="content" role="main"><form action="/search"><input type="search"></form></main></body></html>')); controller.close(); } }) }));

    await expect(inspectPublicUrl("https://shop.example")).resolves.toMatchObject({ formElementCount: 1, ariaRoleAttributeCount: 2, skipLinkCount: 1 });
  });

  it("records inline and style-block CSS color declarations without calculating rendered contrast", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ status: 200, headers: { get: (name: string) => name === "content-type" ? "text/html" : null }, body: new ReadableStream({ start(controller) { controller.enqueue(new TextEncoder().encode('<html><head><style>.cta { color: #fff; background-color: #123456; }</style></head><body><p style="color: rgb(1, 2, 3); border-color: var(--line)">Text</p></body></html>')); controller.close(); } }) }));

    await expect(inspectPublicUrl("https://shop.example")).resolves.toMatchObject({ inlineColorDeclarationCount: 2, styleBlockColorDeclarationCount: 2, observedColorValues: ["rgb(1, 2, 3)", "var(--line)", "#fff", "#123456"] });
  });

  it("records inline and style-block font-family declarations without assessing readability or hierarchy", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ status: 200, headers: { get: (name: string) => name === "content-type" ? "text/html" : null }, body: new ReadableStream({ start(controller) { controller.enqueue(new TextEncoder().encode('<html><head><style>h1 { font-family: "Fraunces", serif; } .body { font-family: Inter, sans-serif; }</style></head><body><p style="font-family: Arial, sans-serif">Text</p></body></html>')); controller.close(); } }) }));

    await expect(inspectPublicUrl("https://shop.example")).resolves.toMatchObject({ inlineFontFamilyDeclarationCount: 1, styleBlockFontFamilyDeclarationCount: 2, observedFontFamilies: ["Arial, sans-serif", '"Fraunces", serif', "Inter, sans-serif"] });
  });

  it("records cart and checkout link or form-action paths without predicting conversion", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ status: 200, headers: { get: (name: string) => name === "content-type" ? "text/html" : null }, body: new ReadableStream({ start(controller) { controller.enqueue(new TextEncoder().encode('<html><body><a href="/cart">Cart</a><a href="/checkout">Checkout</a><a href="/collections">Collections</a><form action="/cart/add"><button>Add</button></form><form action="/checkout"><button>Pay</button></form></body></html>')); controller.close(); } }) }));

    await expect(inspectPublicUrl("https://shop.example")).resolves.toMatchObject({ cartLinkCount: 1, checkoutLinkCount: 1, cartOrCheckoutFormActionCount: 2 });
  });

  it("records style-block media-query conditions without rendering viewport behavior", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ status: 200, headers: { get: (name: string) => name === "content-type" ? "text/html" : null }, body: new ReadableStream({ start(controller) { controller.enqueue(new TextEncoder().encode('<html><head><style>@media (max-width: 700px) { .hero { display: block; } } @media screen and (min-width: 960px) { .hero { display: grid; } }</style></head><body></body></html>')); controller.close(); } }) }));

    await expect(inspectPublicUrl("https://shop.example")).resolves.toMatchObject({ mediaQueryConditionCount: 2, observedMediaQueryConditions: ["(max-width: 700px)", "screen and (min-width: 960px)"] });
  });

  it("records collection-path links without assessing category organization or discovery", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ status: 200, headers: { get: (name: string) => name === "content-type" ? "text/html" : null }, body: new ReadableStream({ start(controller) { controller.enqueue(new TextEncoder().encode('<html><body><a href="/collections/summer">Summer</a><a href="/collection/new">New</a><a href="/products/tote">Tote</a><a href="/collections/summer">Summer again</a></body></html>')); controller.close(); } }) }));

    await expect(inspectPublicUrl("https://shop.example")).resolves.toMatchObject({ collectionLinkCount: 3, observedCollectionPaths: ["/collections/summer", "/collection/new"] });
  });

  it("records Product JSON-LD image declarations and page image elements without assessing visual presentation", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ status: 200, headers: { get: (name: string) => name === "content-type" ? "text/html" : null }, body: new ReadableStream({ start(controller) { controller.enqueue(new TextEncoder().encode('<html><head><script type="application/ld+json">{"@type":"Product","name":"Canvas Tote","image":["https://shop.example/tote-1.jpg","https://shop.example/tote-2.jpg"]}</script></head><body><img src="tote-1.jpg" alt="Tote"><img src="tote-2.jpg" alt="Tote detail"></body></html>')); controller.close(); } }) }));

    await expect(inspectPublicUrl("https://shop.example")).resolves.toMatchObject({ imageCount: 2, productStructuredDataCount: 1, productImageStructuredDataCount: 2 });
  });

  it("records Product JSON-LD title and description declarations without assessing content quality", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ status: 200, headers: { get: (name: string) => name === "content-type" ? "text/html" : null }, body: new ReadableStream({ start(controller) { controller.enqueue(new TextEncoder().encode('<html><head><script type="application/ld+json">{"@type":"Product","name":"Canvas Tote","description":"A durable tote with an inside pocket."}</script></head><body></body></html>')); controller.close(); } }) }));

    await expect(inspectPublicUrl("https://shop.example")).resolves.toMatchObject({ productStructuredDataCount: 1, productNames: ["Canvas Tote"], productDescriptionStructuredDataCount: 1, productDescriptionCharacterCount: 37 });
  });

  it("records cart links and cart form actions without assessing cart quality", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ status: 200, headers: { get: (name: string) => name === "content-type" ? "text/html" : null }, body: new ReadableStream({ start(controller) { controller.enqueue(new TextEncoder().encode('<html><body><a href="/cart">Cart</a><a href="/checkout">Checkout</a><form action="/cart/add"><button>Add</button></form><form action="/checkout"><button>Pay</button></form></body></html>')); controller.close(); } }) }));

    await expect(inspectPublicUrl("https://shop.example")).resolves.toMatchObject({ cartLinkCount: 1, cartFormActionCount: 1 });
  });

  it("records checkout links and checkout form actions without assessing checkout usability", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ status: 200, headers: { get: (name: string) => name === "content-type" ? "text/html" : null }, body: new ReadableStream({ start(controller) { controller.enqueue(new TextEncoder().encode('<html><body><a href="/cart">Cart</a><a href="/checkout">Checkout</a><form action="/cart/add"><button>Add</button></form><form action="/checkout"><button>Pay</button></form></body></html>')); controller.close(); } }) }));

    await expect(inspectPublicUrl("https://shop.example")).resolves.toMatchObject({ checkoutLinkCount: 1, checkoutFormActionCount: 1 });
  });

  it("records journey-path links without mapping customer progression or friction", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ status: 200, headers: { get: (name: string) => name === "content-type" ? "text/html" : null }, body: new ReadableStream({ start(controller) { controller.enqueue(new TextEncoder().encode('<html><body><a href="/products/tote">Tote</a><a href="/collections/new">New</a><a href="/cart">Cart</a><a href="/checkout">Checkout</a></body></html>')); controller.close(); } }) }));

    await expect(inspectPublicUrl("https://shop.example")).resolves.toMatchObject({ productLinkCount: 1, collectionLinkCount: 1, cartLinkCount: 1, checkoutLinkCount: 1 });
  });

  it("records semantic layout elements without rendering arrangement or hierarchy", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ status: 200, headers: { get: (name: string) => name === "content-type" ? "text/html" : null }, body: new ReadableStream({ start(controller) { controller.enqueue(new TextEncoder().encode('<html><body><header>Header</header><main><section>Feature</section><section><article>Story</article></section></main><footer>Footer</footer></body></html>')); controller.close(); } }) }));

    await expect(inspectPublicUrl("https://shop.example")).resolves.toMatchObject({ headerElementCount: 1, mainLandmarkCount: 1, sectionElementCount: 2, articleElementCount: 1, footerElementCount: 1, semanticLayoutElementCount: 6 });
  });

  it("records style, color, and font declarations without assessing visual design", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ status: 200, headers: { get: (name: string) => name === "content-type" ? "text/html" : null }, body: new ReadableStream({ start(controller) { controller.enqueue(new TextEncoder().encode('<html><head><style>.hero { color: #112233; font-family: Inter, sans-serif; }</style></head><body><div style="background-color: #ffffff; font-family: Georgia, serif">Welcome</div></body></html>')); controller.close(); } }) }));

    await expect(inspectPublicUrl("https://shop.example")).resolves.toMatchObject({ inlineStyleBlockCount: 1, inlineColorDeclarationCount: 1, styleBlockColorDeclarationCount: 1, inlineFontFamilyDeclarationCount: 1, styleBlockFontFamilyDeclarationCount: 1 });
  });

  it("records headings and text-bearing interactive elements without assessing visual hierarchy", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ status: 200, headers: { get: (name: string) => name === "content-type" ? "text/html" : null }, body: new ReadableStream({ start(controller) { controller.enqueue(new TextEncoder().encode('<html><body><h1>Welcome</h1><h2>Featured</h2><h2>Details</h2><a href="/products/tote">Shop tote</a><button>View collection</button></body></html>')); controller.close(); } }) }));

    await expect(inspectPublicUrl("https://shop.example")).resolves.toMatchObject({ headingCount: 3, headings: [{ level: 1, text: "Welcome" }, { level: 2, text: "Featured" }, { level: 2, text: "Details" }], ctaElementsWithText: 2 });
  });
});
