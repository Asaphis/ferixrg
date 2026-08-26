import { describe, expect, it, vi } from "vitest";

const httpBatchLink = vi.fn(options => ({ options }));
const createTRPCProxyClient = vi.fn(options => options);

vi.mock("@trpc/client", () => ({
  createTRPCProxyClient,
  httpBatchLink,
}));

describe("workspace data client", () => {
  it("places SuperJSON on the HTTP batch link that deserializes dashboard responses", async () => {
    const { default: superjson } = await import("superjson");
    await import("./workspaceClient");

    expect(httpBatchLink).toHaveBeenCalledWith(expect.objectContaining({ transformer: superjson }));
  });
});
