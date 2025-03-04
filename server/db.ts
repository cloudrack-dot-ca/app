import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import { env } from "node:process";

if (!env.DATABASE_URL) {
  throw new Error("DATABASE_URL environment variable is not set");
}

const sql = neon(env.DATABASE_URL);
console.log("Connecting to database...");
export const db = drizzle(sql);