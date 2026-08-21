import { describe, expect, it, vi } from "vitest";

vi.mock("./cloudflareAi", () => ({ runCloudflareAccessibilityFixAssistant: vi.fn(), runCloudflareDesignCopilot: vi.fn(), CloudflareAiError: class CloudflareAiError extends Error {} }));

import { runCloudflareAccessibilityFixAssistant, runCloudflareDesignCopilot } from "./cloudflareAi";
import { getCentralAiAdapter, listCentralAiReadiness, runAccessibilityFixAssistantThroughGateway, runDesignCopilotThroughGateway } from "./aiGateway";

describe("central AI gateway", () => {
  it("exposes a provider-neutral adapter boundary with truthful Cloudflare readiness", () => {
    expect(getCentralAiAdapter().provider).toBe("cloudflare_workers_ai");
    expect(listCentralAiReadiness()).toHaveLength(1);
    expect(listCentralAiReadiness()[0]).toMatchObject({ provider: "cloudflare_workers_ai", model: "@cf/meta/llama-3.2-3b-instruct" });
  });

  it("routes Design Copilot through the active adapter while preserving provider attribution", async () => {
    vi.mocked(runCloudflareDesignCopilot).mockResolvedValue({ response: "Review before applying.", model: "@cf/meta/llama-3.2-3b-instruct", neurons: 1, promptTokens: 2, completionTokens: 3 });
    await expect(runDesignCopilotThroughGateway({ message: "Improve visual hierarchy." })).resolves.toMatchObject({ provider: "cloudflare_workers_ai", response: "Review before applying." });
  });

  it("routes Accessibility Fix Assistant through the active adapter", async () => {
    vi.mocked(runCloudflareAccessibilityFixAssistant).mockResolvedValue({ response: "Propose a labeled control and verify focus before applying.", model: "@cf/meta/llama-3.2-3b-instruct", neurons: 1, promptTokens: 2, completionTokens: 3 });
    await expect(runAccessibilityFixAssistantThroughGateway({ message: "The form has no observed accessible-name evidence." })).resolves.toMatchObject({ provider: "cloudflare_workers_ai", response: "Propose a labeled control and verify focus before applying." });
  });
});
