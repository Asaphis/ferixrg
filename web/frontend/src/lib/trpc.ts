import { createTRPCReact } from "@trpc/react-query";
// The frontend package communicates with the backend through HTTP only.
// Backend implementation types are intentionally not a frontend dependency.
const createIndependentTrpc = createTRPCReact as unknown as () => any;
export const trpc = createIndependentTrpc();
