import { describe, expect, it, vi } from "vitest";

vi.mock("./cloudflareAi", () => ({ runCloudflareDesignCopilot: vi.fn(), CloudflareAiError: class CloudflareAiError extends Error {} }));

import { runCloudflareDesignCopilot } from "./cloudflareAi";
import { getCentralAiAdapter, listCentralAiReadiness, runDesignCopilotThroughGateway } from "./aiGateway";

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
});
