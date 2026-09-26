import "dotenv/config";
import { createServer } from "node:http";
import net from "node:net";
import { cleanupExpiredMessageAttachments } from "../db";
import { setupVite, serveStatic } from "./vite";
import { createApplication } from "./app";

function isPortAvailable(port: number): Promise<boolean> {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.listen(port, () => server.close(() => resolve(true)));
    server.on("error", () => resolve(false));
  });
}

async function findAvailablePort(startPort = 3000): Promise<number> {
  for (let port = startPort; port < startPort + 20; port += 1) {
    if (await isPortAvailable(port)) return port;
  }
  throw new Error(`No available port found starting from ${startPort}`);
}

async function startServer() {
  console.log("[Release] lost-found alerts enabled");
  const app = createApplication();
  const server = createServer(app);

  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const preferredPort = Number.parseInt(process.env.PORT || "3000", 10);
  const port = await findAvailablePort(preferredPort);
  if (port !== preferredPort) {
    console.log(`Port ${preferredPort} is busy, using port ${port} instead`);
  }

  server.listen(port, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${port}/`);
    if (!process.env.VERCEL) {
      cleanupExpiredMessageAttachments().catch((error) =>
        console.warn("[Messages] Initial attachment cleanup failed:", error),
      );
      const cleanupTimer = setInterval(
        () =>
          cleanupExpiredMessageAttachments().catch((error) =>
            console.warn("[Messages] Scheduled attachment cleanup failed:", error),
          ),
        24 * 60 * 60 * 1000,
      );
      cleanupTimer.unref();
    }
  });
}

startServer().catch((error) => {
  console.error("[Release] Server startup failed", error);
  process.exitCode = 1;
});
