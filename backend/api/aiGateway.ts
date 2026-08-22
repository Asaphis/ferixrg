import { ENV } from "./_core/env";
import { runCloudflareAccessibilityFixAssistant, runCloudflareContentImprover, runCloudflareDesignCopilot, runCloudflareMarketingCopy, runCloudflareProductDescriptionGenerator, type AccessibilityFixAssistantRequest, type AccessibilityFixAssistantResponse, type ContentImproverRequest, type ContentImproverResponse, type DesignCopilotRequest, type DesignCopilotResponse, type MarketingCopyRequest, type MarketingCopyResponse, type ProductDescriptionGeneratorRequest, type ProductDescriptionGeneratorResponse } from "./cloudflareAi";

export type CentralAiProvider = "cloudflare_workers_ai";

export type CentralAiReadiness = {
  provider: CentralAiProvider;
  configured: boolean;
  model: string;
  message: string;
};

export type CentralAiAdapter = {
  provider: CentralAiProvider;
  readiness(): CentralAiReadiness;
  runDesignCopilot(input: DesignCopilotRequest): Promise<DesignCopilotResponse>;
  runAccessibilityFixAssistant(input: AccessibilityFixAssistantRequest): Promise<AccessibilityFixAssistantResponse>;
  runContentImprover(input: ContentImproverRequest): Promise<ContentImproverResponse>;
  runProductDescriptionGenerator(input: ProductDescriptionGeneratorRequest): Promise<ProductDescriptionGeneratorResponse>;
  runMarketingCopy(input: MarketingCopyRequest): Promise<MarketingCopyResponse>;
};

const cloudflareAdapter: CentralAiAdapter = {
  provider: "cloudflare_workers_ai",
  readiness: () => ({
    provider: "cloudflare_workers_ai",
    configured: Boolean(ENV.cloudflareAccountId && ENV.cloudflareApiToken),
    model: ENV.cloudflareAiModel || "@cf/meta/llama-3.2-3b-instruct",
    message: ENV.cloudflareAccountId && ENV.cloudflareApiToken ? "Cloudflare Workers AI is available for the Design Copilot route." : "Cloudflare Workers AI is not configured for this deployment yet.",
  }),
  runDesignCopilot: input => runCloudflareDesignCopilot(input),
  runAccessibilityFixAssistant: input => runCloudflareAccessibilityFixAssistant(input),
  runContentImprover: input => runCloudflareContentImprover(input),
  runProductDescriptionGenerator: input => runCloudflareProductDescriptionGenerator(input),
  runMarketingCopy: input => runCloudflareMarketingCopy(input),
};

const adapters: Record<CentralAiProvider, CentralAiAdapter> = { cloudflare_workers_ai: cloudflareAdapter };

export function getCentralAiAdapter(provider: CentralAiProvider = "cloudflare_workers_ai") {
  return adapters[provider];
}

export function listCentralAiReadiness() {
  return (Object.keys(adapters) as CentralAiProvider[]).map(provider => adapters[provider].readiness());
}

export async function runDesignCopilotThroughGateway(input: DesignCopilotRequest, provider: CentralAiProvider = "cloudflare_workers_ai") {
  const adapter = getCentralAiAdapter(provider);
  const result = await adapter.runDesignCopilot(input);
  return { ...result, provider: adapter.provider };
}

export async function runAccessibilityFixAssistantThroughGateway(input: AccessibilityFixAssistantRequest, provider: CentralAiProvider = "cloudflare_workers_ai") {
  const adapter = getCentralAiAdapter(provider);
  const result = await adapter.runAccessibilityFixAssistant(input);
  return { ...result, provider: adapter.provider };
}

export async function runContentImproverThroughGateway(input: ContentImproverRequest, provider: CentralAiProvider = "cloudflare_workers_ai") {
  const adapter = getCentralAiAdapter(provider);
  const result = await adapter.runContentImprover(input);
  return { ...result, provider: adapter.provider };
}

export async function runProductDescriptionGeneratorThroughGateway(input: ProductDescriptionGeneratorRequest, provider: CentralAiProvider = "cloudflare_workers_ai") {
  const adapter = getCentralAiAdapter(provider);
  const result = await adapter.runProductDescriptionGenerator(input);
  return { ...result, provider: adapter.provider };
}

export async function runMarketingCopyThroughGateway(input: MarketingCopyRequest, provider: CentralAiProvider = "cloudflare_workers_ai") {
  const adapter = getCentralAiAdapter(provider);
  const result = await adapter.runMarketingCopy(input);
  return { ...result, provider: adapter.provider };
}


export async function runScreenshotAnalysisThroughGateway(input: { toolName: string; imageUrls: string[] }) {
  if (!input.imageUrls.length) throw new Error("At least one uploaded screenshot is required for visual analysis.");
  const { invokeLLM } = await import("./_core/llm");
  const response = await invokeLLM({
    messages: [
      { role: "system", content: "You are FerixRG Screenshot Analyzer. Analyze only the supplied storefront screenshots. Return concise, evidence-aware findings about visible layout, hierarchy, typography, spacing, contrast, responsive clues, and actionable issues. Do not claim access to the live store, hidden code, checkout, private data, or measurements not visible in the images. Clearly distinguish visible observations from recommendations. Do not invent scores, URLs, business facts, or performance data." },
      { role: "user", content: [
        { type: "text", text: `Analyze these ${input.imageUrls.length} screenshot${input.imageUrls.length === 1 ? "" : "s"} for the FerixRG ${input.toolName} workflow. Return: 1) visible observations, 2) prioritized issues, 3) practical recommendations, 4) limitations of screenshot-only evidence.` },
        ...input.imageUrls.map(url => ({ type: "image_url" as const, image_url: { url, detail: "auto" as const } })),
      ] },
    ],
  });
  const content = response.choices[0]?.message?.content;
  const text = typeof content === "string" ? content.trim() : "";
  if (!text) throw new Error("The screenshot analysis provider returned no readable result.");
  return { response: text, provider: "built_in_llm", model: response.model, promptTokens: response.usage?.prompt_tokens ?? null, completionTokens: response.usage?.completion_tokens ?? null };
}
