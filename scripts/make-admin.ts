import "dotenv/config";
import { eq } from "drizzle-orm";
import { getDb } from "../server/db";
import { users } from "../drizzle/schema";

const email = process.argv[2]?.trim().toLowerCase();
if (!email || !email.includes("@")) {
  console.error("Usage: pnpm tsx scripts/make-admin.ts user@example.com");
  process.exit(1);
}

const db = await getDb();
if (!db) throw new Error("DATABASE_URL is not configured");
const result = await db.update(users).set({ role: "admin" }).where(eq(users.email, email));
if (!result[0] || Number(result[0].affectedRows ?? 0) === 0) {
  console.error(`No user found for ${email}`);
  process.exit(1);
}
console.log(`Admin role granted to ${email}`);
