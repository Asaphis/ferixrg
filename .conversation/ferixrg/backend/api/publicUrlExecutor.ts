import { lookup } from "node:dns/promises";
import { isIP } from "node:net";

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
  organizationStructuredDataCount: number;
  reviewStructuredDataCount: number;
  aggregateRatingStructuredDataCount: number;
  formElementCount: number;
  ariaRoleAttributeCount: number;
  skipLinkCount: number;
  inlineColorDeclarationCount: number;
  styleBlockColorDeclarationCount: number;
  observedColorValues: string[];
  inlineFontFamilyDeclarationCount: number;
  styleBlockFontFamilyDeclarationCount: number;
  observedFontFamilies: string[];
  cartLinkCount: number;
  checkoutLinkCount: number;
  cartOrCheckoutFormActionCount: number;
  cartFormActionCount: number;
  checkoutFormActionCount: number;
  mediaQueryConditionCount: number;
  observedMediaQueryConditions: string[];
  collectionLinkCount: number;
  observedCollectionPaths: string[];
  productLinkCount: number;
  headerElementCount: number;
  footerElementCount: number;
  sectionElementCount: number;
  articleElementCount: number;
  semanticLayoutElementCount: number;
  productImageStructuredDataCount: number;
  productDescriptionStructuredDataCount: number;
  productDescriptionCharacterCount: number;
  bytesRead: number;
};

const MAX_DOCUMENT_BYTES = 1_000_000;
const MAX_REDIRECTS = 5;
const PUBLIC_URL_ERROR = "FerixRG can inspect public storefront URLs only.";

function normalizedHostname(hostname: string) {
  return hostname.toLowerCase().replace(/^\[|\]$/g, "");
}

function isPrivateAddress(address: string) {
  const normalized = normalizedHostname(address);
  const version = isIP(normalized);
  if (version === 4) {
    const octets = normalized.split(".").map(Number);
    const [first, second] = octets;
    return first === 0 || first === 10 || first === 127 || (first === 169 && second === 254) || (first === 172 && second >= 16 && second <= 31) || (first === 192 && second === 168);
  }
  if (version === 6) {
    const mappedIpv4 = normalized.startsWith("::ffff:") ? normalized.slice(7) : "";
    if (mappedIpv4 && isIP(mappedIpv4) === 4) return isPrivateAddress(mappedIpv4);
    return normalized === "::" || normalized === "::1" || normalized.startsWith("fc") || normalized.startsWith("fd") || /^(?:fe[89ab])/.test(normalized);
  }
  return false;
}

function isReservedDocumentationDomain(hostname: string) {
  return hostname === "example" || hostname.endsWith(".example") || hostname === "invalid" || hostname.endsWith(".invalid") || hostname === "test" || hostname.endsWith(".test");
}

async function assertPublicDestination(url: URL) {
  const hostname = normalizedHostname(url.hostname);
  if (isReservedDocumentationDomain(hostname)) return;
  if (isIP(hostname) && isPrivateAddress(hostname)) throw new Error(PUBLIC_URL_ERROR);
  try {
    const addresses = await lookup(hostname, { all: true, verbatim: true });
    if (!addresses.length || addresses.some(address => isPrivateAddress(address.address))) throw new Error(PUBLIC_URL_ERROR);
  } catch (error) {
    if (error instanceof Error && error.message === PUBLIC_URL_ERROR) throw error;
    throw new Error(PUBLIC_URL_ERROR);
  }
}


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
  const productImageStructuredDataCount = productNodes.reduce((count, node) => count + (Array.isArray(node.image) ? node.image.length : node.image ? 1 : 0), 0);
  const productDescriptions = productNodes.flatMap(node => typeof node.description === "string" ? [node.description.trim()] : []).filter(Boolean);
  const productDescriptionStructuredDataCount = productDescriptions.length;
  const productDescriptionCharacterCount = productDescriptions.reduce((count, description) => count + description.length, 0);
  return { productStructuredDataCount: productNodes.length, productNames, productOfferCount, productImageStructuredDataCount, productDescriptionStructuredDataCount, productDescriptionCharacterCount };
}

function extractCredibilityStructuredData(html: string) {
  const scripts = Array.from(html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi));
  const counts = { organizationStructuredDataCount: 0, reviewStructuredDataCount: 0, aggregateRatingStructuredDataCount: 0 };
  const visit = (value: unknown) => {
    if (Array.isArray(value)) { value.forEach(visit); return; }
    if (!value || typeof value !== "object") return;
    const node = value as Record<string, unknown>;
    const types = (Array.isArray(node["@type"]) ? node["@type"] : [node["@type"]]).flatMap(type => typeof type === "string" ? [type.toLowerCase()] : []);
    if (types.includes("organization")) counts.organizationStructuredDataCount += 1;
    if (types.includes("review")) counts.reviewStructuredDataCount += 1;
    if (types.includes("aggregaterating")) counts.aggregateRatingStructuredDataCount += 1;
    if (node["@graph"]) visit(node["@graph"]);
  };
  for (const script of scripts) {
    if (!/\btype\s*=\s*["']application\/ld\+json["']/i.test(script[1])) continue;
    try { visit(JSON.parse(script[2])); } catch { /* Report parsed declarations only. */ }
  }
  return counts;
}

function extractUxMarkupIndicators(html: string) {
  const anchors = Array.from(html.matchAll(/<a\b([^>]*)>([\s\S]*?)<\/a>/gi));
  const skipLinkCount = anchors.filter(match => {
    const href = attribute(match[1], "href");
    const text = textContent(match[2]);
    return Boolean(href?.startsWith("#")) && /^skip\b/i.test(text);
  }).length;
  return {
    formElementCount: (html.match(/<form\b[^>]*>/gi) ?? []).length,
    ariaRoleAttributeCount: (html.match(/\brole\s*=/gi) ?? []).length,
    skipLinkCount,
  };
}

function extractColorStyleDeclarations(html: string) {
  const colorDeclaration = /\b(?:color|background-color|border-color|outline-color|fill|stroke)\s*:\s*([^;{}]+)(?:;|$)/gi;
  const values: string[] = [];
  const collect = (markup: string) => {
    let match: RegExpExecArray | null;
    while ((match = colorDeclaration.exec(markup))) {
      const value = match[1].trim().replace(/\s+/g, " ").slice(0, 160);
      if (value && values.length < 30 && !values.includes(value)) values.push(value);
    }
  };
  const inlineStyleAttributes = Array.from(html.matchAll(/\bstyle\s*=\s*(["'])([\s\S]*?)\1/gi)).map(match => match[2]);
  const styleBlocks = Array.from(html.matchAll(/<style\b[^>]*>([\s\S]*?)<\/style>/gi)).map(match => match[1]);
  const count = (styles: string[]) => styles.reduce((total, style) => total + (style.match(colorDeclaration)?.length ?? 0), 0);
  inlineStyleAttributes.forEach(collect);
  styleBlocks.forEach(collect);
  return { inlineColorDeclarationCount: count(inlineStyleAttributes), styleBlockColorDeclarationCount: count(styleBlocks), observedColorValues: values };
}

function extractFontFamilyDeclarations(html: string) {
  const fontFamilyDeclaration = /\bfont-family\s*:\s*([^;{}]+)(?:;|$)/gi;
  const families: string[] = [];
  const collect = (markup: string) => {
    let match: RegExpExecArray | null;
    while ((match = fontFamilyDeclaration.exec(markup))) {
      const family = match[1].trim().replace(/\s+/g, " ").slice(0, 240);
      if (family && families.length < 30 && !families.includes(family)) families.push(family);
    }
  };
  const inlineStyleAttributes = Array.from(html.matchAll(/\bstyle\s*=\s*(["'])([\s\S]*?)\1/gi)).map(match => match[2]);
  const styleBlocks = Array.from(html.matchAll(/<style\b[^>]*>([\s\S]*?)<\/style>/gi)).map(match => match[1]);
  const count = (styles: string[]) => styles.reduce((total, style) => total + (style.match(fontFamilyDeclaration)?.length ?? 0), 0);
  inlineStyleAttributes.forEach(collect);
  styleBlocks.forEach(collect);
  return { inlineFontFamilyDeclarationCount: count(inlineStyleAttributes), styleBlockFontFamilyDeclarationCount: count(styleBlocks), observedFontFamilies: families };
}

function extractCommercePathMarkup(html: string) {
  const anchors = Array.from(html.matchAll(/<a\b([^>]*)>/gi));
  const forms = Array.from(html.matchAll(/<form\b([^>]*)>/gi));
  const hrefs = anchors.flatMap(match => {
    const href = attribute(match[1], "href");
    return href ? [href.toLowerCase()] : [];
  });
  const actions = forms.flatMap(match => {
    const action = attribute(match[1], "action");
    return action ? [action.toLowerCase()] : [];
  });
  return {
    cartLinkCount: hrefs.filter(href => /(?:^|[/#?&=_-])cart(?:[/#?&=_-]|$)/.test(href)).length,
    checkoutLinkCount: hrefs.filter(href => /(?:^|[/#?&=_-])checkout(?:[/#?&=_-]|$)/.test(href)).length,
    cartOrCheckoutFormActionCount: actions.filter(action => /(?:^|[/#?&=_-])(?:cart|checkout)(?:[/#?&=_-]|$)/.test(action)).length,
    cartFormActionCount: actions.filter(action => /(?:^|[/#?&=_-])cart(?:[/#?&=_-]|$)/.test(action)).length,
    checkoutFormActionCount: actions.filter(action => /(?:^|[/#?&=_-])checkout(?:[/#?&=_-]|$)/.test(action)).length,
  };
}

function extractMediaQueryConditions(html: string) {
  const styleBlocks = html.match(/<style\b[^>]*>[\s\S]*?<\/style>/gi) ?? [];
  const conditions: string[] = [];
  for (const styleBlock of styleBlocks) {
    for (const match of Array.from(styleBlock.matchAll(/@media\s+([^\{]+)\{/gi))) {
      const condition = match[1].trim().replace(/\s+/g, " ").slice(0, 240);
      if (condition && conditions.length < 30 && !conditions.includes(condition)) conditions.push(condition);
    }
  }
  const mediaQueryConditionCount = styleBlocks.reduce((count, styleBlock) => count + (styleBlock.match(/@media\s+[^\{]+\{/gi)?.length ?? 0), 0);
  return { mediaQueryConditionCount, observedMediaQueryConditions: conditions };
}

function extractCollectionPathLinks(html: string) {
  const collectionPaths = Array.from(html.matchAll(/<a\b([^>]*)>/gi)).flatMap(match => {
    const href = attribute(match[1], "href");
    return href && /(?:^|[/#?&=_-])collections?(?:[/#?&=_-]|$)/i.test(href) ? [href] : [];
  });
  return { collectionLinkCount: collectionPaths.length, observedCollectionPaths: Array.from(new Set(collectionPaths)).slice(0, 30) };
}

function extractProductPathLinks(html: string) {
  const productLinkCount = Array.from(html.matchAll(/<a\b([^>]*)>/gi)).flatMap(match => {
    const href = attribute(match[1], "href");
    return href && /(?:^|[/#?&=_-])products?(?:[/#?&=_-]|$)/i.test(href) ? [href] : [];
  }).length;
  return { productLinkCount };
}

function extractSemanticLayoutElements(html: string) {
  const headerElementCount = (html.match(/<header\b[^>]*>/gi) ?? []).length;
  const mainElementCount = (html.match(/<main\b[^>]*>/gi) ?? []).length;
  const footerElementCount = (html.match(/<footer\b[^>]*>/gi) ?? []).length;
  const sectionElementCount = (html.match(/<section\b[^>]*>/gi) ?? []).length;
  const articleElementCount = (html.match(/<article\b[^>]*>/gi) ?? []).length;
  return { headerElementCount, footerElementCount, sectionElementCount, articleElementCount, semanticLayoutElementCount: headerElementCount + mainElementCount + footerElementCount + sectionElementCount + articleElementCount };
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
  const hostname = normalizedHostname(url.hostname);
  if (hostname === "localhost" || hostname.endsWith(".local") || hostname.endsWith(".internal") || (isIP(hostname) > 0 && isPrivateAddress(hostname))) throw new Error(PUBLIC_URL_ERROR);
  return url;
}

async function fetchPublicPage(initialUrl: URL) {
  let currentUrl = initialUrl;
  for (let redirectCount = 0; redirectCount <= MAX_REDIRECTS; redirectCount += 1) {
    await assertPublicDestination(currentUrl);
    const response = await fetch(currentUrl, { redirect: "manual", headers: { "User-Agent": "FerixRG-Storefront-Inspector/1.0 (+https://ferixrg.example)" }, signal: AbortSignal.timeout(15_000) });
    if (response.status >= 300 && response.status < 400) {
      if (redirectCount === MAX_REDIRECTS) throw new Error("The public page redirected too many times.");
      const location = response.headers.get("location");
      if (!location) throw new Error("The public page returned an invalid redirect.");
      currentUrl = validatePublicInspectionUrl(new URL(location, currentUrl).toString());
      continue;
    }
    if (response.status < 200 || response.status >= 300) throw new Error(`The public page returned HTTP ${response.status}.`);
    return { response, url: currentUrl };
  }
  throw new Error("The public page could not be fetched safely.");
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
  const requestedUrl = validatePublicInspectionUrl(value);
  const startedAt = Date.now();
  const { response, url } = await fetchPublicPage(requestedUrl);
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
  const credibilityStructuredData = extractCredibilityStructuredData(html);
  const uxMarkupIndicators = extractUxMarkupIndicators(html);
  const colorStyleDeclarations = extractColorStyleDeclarations(html);
  const fontFamilyDeclarations = extractFontFamilyDeclarations(html);
  const commercePathMarkup = extractCommercePathMarkup(html);
  const mediaQueryConditions = extractMediaQueryConditions(html);
  const collectionPathLinks = extractCollectionPathLinks(html);
  const productPathLinks = extractProductPathLinks(html);
  const semanticLayoutElements = extractSemanticLayoutElements(html);
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
    productImageStructuredDataCount: productStructuredData.productImageStructuredDataCount,
    productDescriptionStructuredDataCount: productStructuredData.productDescriptionStructuredDataCount,
    productDescriptionCharacterCount: productStructuredData.productDescriptionCharacterCount,
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
    organizationStructuredDataCount: credibilityStructuredData.organizationStructuredDataCount,
    reviewStructuredDataCount: credibilityStructuredData.reviewStructuredDataCount,
    aggregateRatingStructuredDataCount: credibilityStructuredData.aggregateRatingStructuredDataCount,
    formElementCount: uxMarkupIndicators.formElementCount,
    ariaRoleAttributeCount: uxMarkupIndicators.ariaRoleAttributeCount,
    skipLinkCount: uxMarkupIndicators.skipLinkCount,
    inlineColorDeclarationCount: colorStyleDeclarations.inlineColorDeclarationCount,
    styleBlockColorDeclarationCount: colorStyleDeclarations.styleBlockColorDeclarationCount,
    observedColorValues: colorStyleDeclarations.observedColorValues,
    inlineFontFamilyDeclarationCount: fontFamilyDeclarations.inlineFontFamilyDeclarationCount,
    styleBlockFontFamilyDeclarationCount: fontFamilyDeclarations.styleBlockFontFamilyDeclarationCount,
    observedFontFamilies: fontFamilyDeclarations.observedFontFamilies,
    cartLinkCount: commercePathMarkup.cartLinkCount,
    checkoutLinkCount: commercePathMarkup.checkoutLinkCount,
    cartOrCheckoutFormActionCount: commercePathMarkup.cartOrCheckoutFormActionCount,
    cartFormActionCount: commercePathMarkup.cartFormActionCount,
    checkoutFormActionCount: commercePathMarkup.checkoutFormActionCount,
    mediaQueryConditionCount: mediaQueryConditions.mediaQueryConditionCount,
    observedMediaQueryConditions: mediaQueryConditions.observedMediaQueryConditions,
    collectionLinkCount: collectionPathLinks.collectionLinkCount,
    observedCollectionPaths: collectionPathLinks.observedCollectionPaths,
    productLinkCount: productPathLinks.productLinkCount,
    headerElementCount: semanticLayoutElements.headerElementCount,
    footerElementCount: semanticLayoutElements.footerElementCount,
    sectionElementCount: semanticLayoutElements.sectionElementCount,
    articleElementCount: semanticLayoutElements.articleElementCount,
    semanticLayoutElementCount: semanticLayoutElements.semanticLayoutElementCount,
    bytesRead: new TextEncoder().encode(html).byteLength,
  };
}
