import { createTRPCReact } from "@trpc/react-query";
import type { AppRouter } from "../../../../backend/api/routers";

export const trpc = createTRPCReact<AppRouter>();
