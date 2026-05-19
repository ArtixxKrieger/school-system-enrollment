import { defineConfig } from "drizzle-kit";
import path from "path";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL, ensure the database is provisioned");
}

const dbUrl = process.env.DATABASE_URL!;
const isSupabase = dbUrl.includes("supabase.co");

export default defineConfig({
  schema: path.join(__dirname, "./src/schema/index.ts"),
  dialect: "postgresql",
  dbCredentials: {
    url: isSupabase && !dbUrl.includes("sslmode")
      ? `${dbUrl}${dbUrl.includes("?") ? "&" : "?"}sslmode=require`
      : dbUrl,
  },
});
