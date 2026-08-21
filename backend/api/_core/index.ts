import "dotenv/config";
import express from "express";
import { createServer } from "http";
import net from "net";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth";
import { registerLocalAuthRoutes } from "./localAuthRoutes";
import { registerStoreConnectionRoutes } from "./storeConnectionRoutes";
import { registerStorageProxy } from "./storageProxy";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { assertProductionConfiguration, ENV } from "./env";
import { listCentralAiReadiness } from "../aiGateway";
import { listStoreProviderReadiness } from "../storeProviders";

function isPortAvailable(port: number): Promise<boolean> {
  return new Promise(resolve => {
    const server = net.createServer();
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    server.on("error", () => resolve(false));
  });
}

async function findAvailablePort(startPort: number = 3000): Promise<number> {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available port found starting from ${startPort}`);
}

async function startServer() {
  assertProductionConfiguration();
  const app = express();
  const server = createServer(app);
  const allowedAppOrigin = process.env.FERIXRG_APP_ORIGIN?.trim().replace(/\/$/, "");
  app.use((req, res, next) => {
    const requestOrigin = req.get("origin");
    res.vary("Origin");
    if (requestOrigin && requestOrigin === allowedAppOrigin) {
      res.setHeader("Access-Control-Allow-Origin", requestOrigin);
      res.setHeader("Access-Control-Allow-Credentials", "true");
      res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
      res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    }
    if (req.method === "OPTIONS") {
      res.sendStatus(requestOrigin === allowedAppOrigin ? 204 : 403);
      return;
    }
    next();
  });
  // Configure body parser with larger size limit for file uploads
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));
  app.get("/api/health", (_req, res) => {
    res.status(200).json({
      ok: true,
      service: "ferixrg",
      environment: ENV.isProduction ? "production" : "development",
      ai: listCentralAiReadiness().map(item => ({ provider: item.provider, configured: item.configured, model: item.model, message: item.message })),
      storeProviders: listStoreProviderReadiness().map(item => ({ provider: item.provider, configured: item.configured, supportsPublish: item.supportsPublish, supportsRollback: item.supportsRollback, message: item.message })),
    });
  });
  registerStorageProxy(app);
  registerOAuthRoutes(app);
  registerLocalAuthRoutes(app);
  registerStoreConnectionRoutes(app);
  // tRPC API
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );
  const preferredPort = parseInt(process.env.PORT || "3000");
  const port = ENV.isProduction ? preferredPort : await findAvailablePort(preferredPort);

  if (ENV.isProduction && !(await isPortAvailable(port))) {
    throw new Error(`Configured production port ${port} is unavailable; refusing to start on a different port.`);
  }
  if (!ENV.isProduction && port !== preferredPort) {
    console.log(`Port ${preferredPort} is busy, using port ${port} instead`);
  }

  // Keep unhandled API failures JSON-shaped so the frontend can show a useful
  // server-error state instead of collapsing an HTML/empty response into a
  // misleading generic account message.
  app.use((error: unknown, _req: express.Request, res: express.Response, next: express.NextFunction) => {
    if (res.headersSent) return next(error);
    console.error("[HTTP] Unhandled request error", error);
    res.status(500).json({ success: false, code: "SERVER_ERROR", message: "We could not complete that request right now. Please try again." });
  });

  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/`);
  });
}

startServer().catch(console.error);
