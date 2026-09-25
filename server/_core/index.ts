import "dotenv/config";
import { createServer } from "http";
import net from "net";
import { createApp } from "../app";
import { cleanupExpiredMessageAttachments } from "../db";
import { serveStatic, setupVite } from "./vite";

function isPortAvailable(port: number): Promise<boolean> {
  return new Promise(resolve => {
    const server = net.createServer();
    server.listen(port, () => server.close(() => resolve(true)));
    server.on("error", () => resolve(false));
  });
}

async function findAvailablePort(startPort = 3000): Promise<number> {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) return port;
  }
  throw new Error(`No available port found starting from ${startPort}`);
}

async function startServer() {
  console.log("[Release] lost-found alerts enabled");
  const app = createApp();
  const server = createServer(app);

  if (process.env.NODE_ENV === "development") await setupVite(app, server);
  else serveStatic(app);

  const preferredPort = parseInt(process.env.PORT || "3000", 10);
  const port = await findAvailablePort(preferredPort);
  if (port !== preferredPort) console.log(`Port ${preferredPort} is busy, using port ${port} instead`);

  server.listen(port, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${port}/`);
    cleanupExpiredMessageAttachments().catch(error =>
      console.warn("[Messages] Initial attachment cleanup failed:", error),
    );
    const cleanupTimer = setInterval(
      () =>
        cleanupExpiredMessageAttachments().catch(error =>
          console.warn("[Messages] Scheduled attachment cleanup failed:", error),
        ),
      24 * 60 * 60 * 1000,
    );
    cleanupTimer.unref();
  });
}

startServer().catch(console.error);
