import { defineConfig } from "drizzle-kit";
import { getAivenSslOptions } from "./server/mysqlConnection";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL is required to run drizzle commands");
}

const ssl = getAivenSslOptions(connectionString);
const parsed = ssl ? new URL(connectionString) : null;
const dbCredentials = parsed
  ? {
      host: parsed.hostname,
      port: Number(parsed.port || 3306),
      user: decodeURIComponent(parsed.username),
      password: decodeURIComponent(parsed.password),
      database: decodeURIComponent(parsed.pathname.replace(/^\//, "")),
      ssl,
    }
  : { url: connectionString };

export default defineConfig({
  schema: "./drizzle/schema.ts",
  out: "./drizzle",
  dialect: "mysql",
  dbCredentials,
});
