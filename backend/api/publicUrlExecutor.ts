export type PublicUrlInspection = {
  url: string;
  fetchedAt: string;
  statusCode: number;
  contentType: string | null;
  title: string | null;
  language: string | null;
  metaDescriptionLength: number;
  canonicalUrl: string | null;
  hasViewport: boolean;
  headingCount: number;
  headings: Array<{ level: 1 | 2 | 3 | 4 | 5 | 6; text: string }>;
  imageCount: number;
  imagesWithAlt: number;
  imagesWithoutAlt: number;
  linkCount: number;
  linksWithText: number;
  linksWithoutText: number;
  navigationLandmarkCount: number;
  mainLandmarkCount: number;
  fetchAndReadDurationMs: number;
  ctaElementCount: number;
  ctaElementsWithText: number;
  ctaElementsWithoutText: number;
  ctaTexts: string[];
  bodyTextCharacterCount: number;
  bodyTextWordCount: number;
  paragraphCount: number;
  paragraphsWithText: number;
  emptyHeadingCount: number;
  productStructuredDataCount: number;
  productNames: string[];
  productOfferCount: number;
  imagesLazyLoaded: number;
  imagesWithDimensions: number;
  imagesWithoutDimensions: number;
  assetReferenceCount: number;
  imageAssetReferenceCount: number;
  stylesheetAssetReferenceCount: number;
  scriptAssetReferenceCount: number;
  assetHosts: string[];
  inlineStyleBlockCount: number;
  inlineMediaQueryCount: number;
  responsiveImageSrcsetCount: number;
  telephoneLinkCount: number;
  telephoneInputCount: number;
  mobileInputModeCount: number;
  bytesRead: number;
};

const MAX_DOCUMENT_BYTES = 1_000_000;

function textMatch(html: string, pattern: RegExp) {
  const match = html.match(pattern)?.[1];
  return match ? match.replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim() : null;
}

function attribute(tag: string, name: string) {
  return tag.match(new RegExp(`\\b${name}\\s*=\\s*["']([^"']*)["']`, "i"))?.[1] ?? null;
}

function extractHeadings(html: string) {
  const headings: Array<{ level: 1 | 2 | 3 | 4 | 5 | 6; text: string }> = [];
  const pattern = /<h([1-6])\b[^>]*>([\s\S]*?)<\/h\1>/gi;
  let match: RegExpExecArray | null;
  while ((match = pattern.exec(html)) && headings.length < 100) {
    const text = match[2].replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim();
    headings.push({ level: Number(match[1]) as 1 | 2 | 3 | 4 | 5 | 6, text: text.slice(0, 280) });
  }
  return headings;
}

function extractAnchorTextCounts(html: string) {
  const pattern = /<a\b[^>]*>([\s\S]*?)<\/a>/gi;
  let linksWithText = 0;
  let linksWithoutText = 0;
  let match: RegExpExecArray | null;
  while ((match = pattern.exec(html))) {
    const text = match[1].replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim();
    if (text) linksWithText += 1;
    else linksWithoutText += 1;
  }
  return { linksWithText, linksWithoutText };
}

function extractCtaElements(html: string) {
  const pattern = /<(a|button)\b[^>]*>([\s\S]*?)<\/\1>/gi;
  const ctaTexts: string[] = [];
  let ctaElementsWithText = 0;
  let ctaElementsWithoutText = 0;
  let match: RegExpExecArray | null;
  while ((match = pattern.exec(html))) {
    const text = match[2].replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim();
    if (text) {
      ctaElementsWithText += 1;
      if (ctaTexts.length < 30) ctaTexts.push(text.slice(0, 160));
    } else ctaElementsWithoutText += 1;
  }
  return { ctaElementCount: ctaElementsWithText + ctaElementsWithoutText, ctaElementsWithText, ctaElementsWithoutText, ctaTexts };
}

function textContent(fragment: string) {
  return fragment.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, " ").replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, " ").replace(/<[^>]*>/g, " ").replace(/&nbsp;/gi, " ").replace(/\s+/g, " ").trim();
}

function extractContentIndicators(html: string, headings: Array<{ level: 1 | 2 | 3 | 4 | 5 | 6; text: string }>) {
  const bodyMarkup = html.match(/<body\b[^>]*>([\s\S]*?)<\/body>/i)?.[1] ?? html;
  const bodyText = textContent(bodyMarkup);
  const paragraphs = Array.from(bodyMarkup.matchAll(/<p\b[^>]*>([\s\S]*?)<\/p>/gi));
  return {
    bodyTextCharacterCount: bodyText.length,
    bodyTextWordCount: bodyText ? bodyText.split(/\s+/).length : 0,
    paragraphCount: paragraphs.length,
    paragraphsWithText: paragraphs.filter(match => Boolean(textContent(match[1]))).length,
    emptyHeadingCount: headings.filter(heading => !heading.text).length,
  };
}

function extractProductStructuredData(html: string) {
  const scripts = Array.from(html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi));
  const productNodes: Array<Record<string, unknown>> = [];
  const visit = (value: unknown) => {
    if (Array.isArray(value)) { value.forEach(visit); return; }
    if (!value || typeof value !== "object") return;
    const node = value as Record<string, unknown>;
    const types = Array.isArray(node["@type"]) ? node["@type"] : [node["@type"]];
    if (types.some(type => typeof type === "string" && type.toLowerCase() === "product")) productNodes.push(node);
    if (node["@graph"]) visit(node["@graph"]);
  };
  for (const script of scripts) {
    if (!/\btype\s*=\s*["']application\/ld\+json["']/i.test(script[1])) continue;
    try { visit(JSON.parse(script[2])); } catch { /* Report parsed Product declarations only. */ }
  }
  const productNames = productNodes.flatMap(node => typeof node.name === "string" ? [node.name.trim().slice(0, 240)] : []).filter(Boolean).slice(0, 20);
  const productOfferCount = productNodes.reduce((count, node) => count + (Array.isArray(node.offers) ? node.offers.length : node.offers ? 1 : 0), 0);
  return { productStructuredDataCount: productNodes.length, productNames, productOfferCount };
}

function extractAssetReferences(html: string, baseUrl: URL) {
  const references: Array<{ kind: "image" | "stylesheet" | "script"; value: string }> = [];
  for (const tag of html.match(/<img\b[^>]*>/gi) ?? []) {
    const src = attribute(tag, "src");
    if (src) references.push({ kind: "image", value: src });
  }
  for (const tag of html.match(/<link\b[^>]*>/gi) ?? []) {
    if (!/\brel\s*=\s*["'][^"']*stylesheet/i.test(tag)) continue;
    const href = attribute(tag, "href");
    if (href) references.push({ kind: "stylesheet", value: href });
  }
  for (const tag of html.match(/<script\b[^>]*>/gi) ?? []) {
    const src = attribute(tag, "src");
    if (src) references.push({ kind: "script", value: src });
  }
  const assetHosts = Array.from(new Set(references.flatMap(reference => {
    try { return [new URL(reference.value, baseUrl).hostname]; } catch { return []; }
  }))).slice(0, 30);
  return {
    assetReferenceCount: references.length,
    imageAssetReferenceCount: references.filter(reference => reference.kind === "image").length,
    stylesheetAssetReferenceCount: references.filter(reference => reference.kind === "stylesheet").length,
    scriptAssetReferenceCount: references.filter(reference => reference.kind === "script").length,
    assetHosts,
  };
}

function extractResponsiveIndicators(html: string) {
  const styleBlocks = html.match(/<style\b[^>]*>[\s\S]*?<\/style>/gi) ?? [];
  const inlineMediaQueryCount = styleBlocks.reduce((count, style) => count + (style.match(/@media\b/gi)?.length ?? 0), 0);
  const responsiveImageSrcsetCount = (html.match(/<(?:img|source)\b[^>]*\bsrcset\s*=/gi) ?? []).length;
  return { inlineStyleBlockCount: styleBlocks.length, inlineMediaQueryCount, responsiveImageSrcsetCount };
}

function extractMobileMarkupIndicators(html: string) {
  const telephoneLinkCount = (html.match(/<a\b[^>]*\bhref\s*=\s*["']?tel:/gi) ?? []).length;
  const inputTags = html.match(/<input\b[^>]*>/gi) ?? [];
  const telephoneInputCount = inputTags.filter(tag => /\btype\s*=\s*["']tel["']/i.test(tag)).length;
  const mobileInputModeCount = inputTags.filter(tag => /\binputmode\s*=/i.test(tag)).length;
  return { telephoneLinkCount, telephoneInputCount, mobileInputModeCount };
}

export function validatePublicInspectionUrl(value: string) {
  const url = new URL(value);
  if (url.protocol !== "https:" && url.protocol !== "http:") throw new Error("Use a public HTTP or HTTPS URL.");
  const hostname = url.hostname.toLowerCase();
  const isPrivateIp = /^(?:127\.|10\.|0\.|169\.254\.|192\.168\.|172\.(?:1[6-9]|2\d|3[0-1])\.)/.test(hostname);
  if (hostname === "localhost" || hostname === "::1" || hostname.endsWith(".local") || hostname.endsWith(".internal") || isPrivateIp) throw new Error("FerixRG can inspect public storefront URLs only.");
  return url;
}

async function readBody(response: Response) {
  const declaredLength = Number(response.headers.get("content-length") ?? 0);
  if (declaredLength && declaredLength > MAX_DOCUMENT_BYTES) throw new Error("The public page is too large to inspect safely.");
  const reader = response.body?.getReader();
  if (!reader) return "";
  const chunks: Uint8Array[] = [];
  let total = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.byteLength;
    if (total > MAX_DOCUMENT_BYTES) {
      await reader.cancel();
      throw new Error("The public page is too large to inspect safely.");
    }
    chunks.push(value);
  }
  const bytes = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength; }
  return new TextDecoder().decode(bytes);
}

export async function inspectPublicUrl(value: string): Promise<PublicUrlInspection> {
  const url = validatePublicInspectionUrl(value);
  const startedAt = Date.now();
  const response = await fetch(url, { redirect: "follow", headers: { "User-Agent": "FerixRG-Storefront-Inspector/1.0 (+https://ferixrg.example)" }, signal: AbortSignal.timeout(15_000) });
  const contentType = response.headers.get("content-type");
  const html = contentType?.toLowerCase().includes("text/html") ? await readBody(response) : "";
  const imageTags = html.match(/<img\b[^>]*>/gi) ?? [];
  const linkTags = html.match(/<a\b[^>]*>/gi) ?? [];
  const anchorTextCounts = extractAnchorTextCounts(html);
  const ctaElements = extractCtaElements(html);
  const headings = extractHeadings(html);
  const contentIndicators = extractContentIndicators(html, headings);
  const productStructuredData = extractProductStructuredData(html);
  const assetReferences = extractAssetReferences(html, url);
  const responsiveIndicators = extractResponsiveIndicators(html);
  const mobileMarkupIndicators = extractMobileMarkupIndicators(html);
  return {
    url: url.toString(),
    fetchedAt: new Date().toISOString(),
    statusCode: response.status,
    contentType,
    title: textMatch(html, /<title\b[^>]*>([\s\S]*?)<\/title>/i),
    language: html.match(/<html\b[^>]*\blang\s*=\s*["']?([^\s"'>]+)/i)?.[1] ?? null,
    metaDescriptionLength: (html.match(/<meta\b[^>]*\bname\s*=\s*["']description["'][^>]*>/i)?.[0] ?? "").length,
    canonicalUrl: attribute(html.match(/<link\b[^>]*\brel\s*=\s*["']canonical["'][^>]*>/i)?.[0] ?? "", "href"),
    hasViewport: /<meta\b[^>]*\bname\s*=\s*["']viewport["'][^>]*>/i.test(html),
    headingCount: headings.length,
    headings,
    imageCount: imageTags.length,
    imagesWithAlt: imageTags.filter(tag => /\balt\s*=/i.test(tag)).length,
    imagesWithoutAlt: imageTags.filter(tag => !/\balt\s*=/i.test(tag)).length,
    linkCount: linkTags.length,
    linksWithText: anchorTextCounts.linksWithText,
    linksWithoutText: anchorTextCounts.linksWithoutText,
    navigationLandmarkCount: (html.match(/<nav\b[^>]*>/gi) ?? []).length,
    mainLandmarkCount: (html.match(/<main\b[^>]*>/gi) ?? []).length,
    fetchAndReadDurationMs: Math.max(Date.now() - startedAt, 0),
    ctaElementCount: ctaElements.ctaElementCount,
    ctaElementsWithText: ctaElements.ctaElementsWithText,
    ctaElementsWithoutText: ctaElements.ctaElementsWithoutText,
    ctaTexts: ctaElements.ctaTexts,
    bodyTextCharacterCount: contentIndicators.bodyTextCharacterCount,
    bodyTextWordCount: contentIndicators.bodyTextWordCount,
    paragraphCount: contentIndicators.paragraphCount,
    paragraphsWithText: contentIndicators.paragraphsWithText,
    emptyHeadingCount: contentIndicators.emptyHeadingCount,
    productStructuredDataCount: productStructuredData.productStructuredDataCount,
    productNames: productStructuredData.productNames,
    productOfferCount: productStructuredData.productOfferCount,
    imagesLazyLoaded: imageTags.filter(tag => /\bloading\s*=\s*["']lazy["']/i.test(tag)).length,
    imagesWithDimensions: imageTags.filter(tag => Boolean(attribute(tag, "width")) && Boolean(attribute(tag, "height"))).length,
    imagesWithoutDimensions: imageTags.filter(tag => !attribute(tag, "width") || !attribute(tag, "height")).length,
    assetReferenceCount: assetReferences.assetReferenceCount,
    imageAssetReferenceCount: assetReferences.imageAssetReferenceCount,
    stylesheetAssetReferenceCount: assetReferences.stylesheetAssetReferenceCount,
    scriptAssetReferenceCount: assetReferences.scriptAssetReferenceCount,
    assetHosts: assetReferences.assetHosts,
    inlineStyleBlockCount: responsiveIndicators.inlineStyleBlockCount,
    inlineMediaQueryCount: responsiveIndicators.inlineMediaQueryCount,
    responsiveImageSrcsetCount: responsiveIndicators.responsiveImageSrcsetCount,
    telephoneLinkCount: mobileMarkupIndicators.telephoneLinkCount,
    telephoneInputCount: mobileMarkupIndicators.telephoneInputCount,
    mobileInputModeCount: mobileMarkupIndicators.mobileInputModeCount,
    bytesRead: new TextEncoder().encode(html).byteLength,
  };
}
