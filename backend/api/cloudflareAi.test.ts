import { describe, expect, it, vi } from "vitest";
import { CloudflareAiError, runCloudflareDesignCopilot } from "./cloudflareAi";

describe("Cloudflare Workers AI gateway", () => {
  it("sends only bounded editor context to the configured server-side model and returns measured usage", async () => {
    const fetchMock = vi.fn().mockResolvedValue({ json: async () => ({ success: true, result: { response: "Prioritize the purchase action, then review before applying.", usage: { neurons: 1.25, prompt_tokens: 12, completion_tokens: 9 } } }) });
    vi.stubGlobal("fetch", fetchMock);

    await expect(runCloudflareDesignCopilot({ message: "Make the buy action clearer.", context: { device: "Mobile", selectedElement: "Buy button" } }, { accountId: "account", apiToken: "token", model: "@cf/meta/llama-3.2-3b-instruct" })).resolves.toMatchObject({ neurons: 1.25, promptTokens: 12, completionTokens: 9 });
    expect(fetchMock).toHaveBeenCalledWith(expect.stringContaining("/accounts/account/ai/run/%40cf%2Fmeta%2Fllama-3.2-3b-instruct"), expect.objectContaining({ headers: expect.objectContaining({ Authorization: "Bearer token" }) }));
  });

  it("rejects credential-like prompt content before any provider request", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    await expect(runCloudflareDesignCopilot({ message: "Use Authorization: Bearer secret-value to inspect my storefront." }, { accountId: "account", apiToken: "token", model: "model" })).rejects.toMatchObject<Partial<CloudflareAiError>>({ code: "invalid_input" });
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
