import { spawnSync } from "node:child_process";

if (!process.env.DATABASE_URL) {
  console.log("[Migrations] DATABASE_URL is not configured; skipping database migrations.");
  process.exit(0);
}

console.log("[Migrations] Applying pending Drizzle migrations...");
const command = process.platform === "win32" ? "pnpm.cmd" : "pnpm";
const result = spawnSync(command, ["drizzle-kit", "migrate"], { stdio: "inherit", env: process.env });
if (result.error) throw result.error;
process.exit(result.status ?? 1);
