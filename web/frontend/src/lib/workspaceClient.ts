import { createTRPCProxyClient, httpBatchLink } from "@trpc/client";
import superjson from "superjson";
import { apiUrl } from "./apiBase";
import { getSessionAuthorizationHeaders } from "./sessionAuth";

const createUntypedClient = createTRPCProxyClient as unknown as (options: unknown) => any;

export const workspaceClient = createUntypedClient({
  links: [
    httpBatchLink({
      url: apiUrl("/api/trpc"),
      transformer: superjson,
      headers() {
        return getSessionAuthorizationHeaders();
      },
      fetch(input: RequestInfo | URL, init?: RequestInit) {
        return fetch(input, { ...(init ?? {}), credentials: "include" });
      },
    }),
  ],
});
