import { ENV } from "./_core/env";
import { runCloudflareDesignCopilot, type DesignCopilotRequest, type DesignCopilotResponse } from "./cloudflareAi";

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
