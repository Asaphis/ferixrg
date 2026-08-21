import { describe, expect, it, vi } from "vitest";
import { CloudflareAiError, runCloudflareContentImprover, runCloudflareDesignCopilot, runCloudflareProductDescriptionGenerator } from "./cloudflareAi";

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

  it("sends bounded supplied text to Content Improver and rejects credential-like source text before any provider request", async () => {
    const fetchMock = vi.fn().mockResolvedValue({ json: async () => ({ success: true, result: { response: "Proposed revision: Clearer product copy.\n\nReview before applying.", usage: { neurons: 0.8, prompt_tokens: 10, completion_tokens: 11 } } }) });
    vi.stubGlobal("fetch", fetchMock);

    await expect(runCloudflareContentImprover({ sourceText: "A useful product description.", instruction: "Make it more concise." }, { accountId: "account", apiToken: "token", model: "model" })).resolves.toMatchObject({ neurons: 0.8, promptTokens: 10, completionTokens: 11 });
    expect(fetchMock).toHaveBeenCalledWith(expect.stringContaining("/accounts/account/ai/run/model"), expect.objectContaining({ headers: expect.objectContaining({ Authorization: "Bearer token" }) }));

    fetchMock.mockClear();
    await expect(runCloudflareContentImprover({ sourceText: "password: should-not-leave-this-browser" }, { accountId: "account", apiToken: "token", model: "model" })).rejects.toMatchObject<Partial<CloudflareAiError>>({ code: "invalid_input" });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("sends only supplied product facts to Product Description Generator and rejects credential-like facts before any provider request", async () => {
    const fetchMock = vi.fn().mockResolvedValue({ json: async () => ({ success: true, result: { response: "A versatile canvas tote for everyday essentials. Verify factual accuracy before applying.", usage: { neurons: 0.7, prompt_tokens: 12, completion_tokens: 12 } } }) });
    vi.stubGlobal("fetch", fetchMock);

    await expect(runCloudflareProductDescriptionGenerator({ productFacts: "Canvas tote. Internal pocket. Adjustable strap." }, { accountId: "account", apiToken: "token", model: "model" })).resolves.toMatchObject({ neurons: 0.7, promptTokens: 12, completionTokens: 12 });
    expect(fetchMock).toHaveBeenCalledWith(expect.stringContaining("/accounts/account/ai/run/model"), expect.objectContaining({ headers: expect.objectContaining({ Authorization: "Bearer token" }) }));

    fetchMock.mockClear();
    await expect(runCloudflareProductDescriptionGenerator({ productFacts: "api_key: should-not-leave-this-browser" }, { accountId: "account", apiToken: "token", model: "model" })).rejects.toMatchObject<Partial<CloudflareAiError>>({ code: "invalid_input" });
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
