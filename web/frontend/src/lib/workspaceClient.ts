import { createTRPCProxyClient, httpBatchLink } from "@trpc/client";
import superjson from "superjson";
import { apiUrl } from "./apiBase";

const createUntypedClient = createTRPCProxyClient as unknown as (options: unknown) => any;

export const workspaceClient = createUntypedClient({
  transformer: superjson,
  links: [
    httpBatchLink({
      url: apiUrl("/api/trpc"),
      fetch(input: RequestInfo | URL, init?: RequestInit) {
        return fetch(input, { ...(init ?? {}), credentials: "include" });
      },
    }),
  ],
});
