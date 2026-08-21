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
  const headings = extractHeadings(html);
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
    bytesRead: new TextEncoder().encode(html).byteLength,
  };
}
