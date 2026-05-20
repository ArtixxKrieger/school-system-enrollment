import { execSync } from "child_process";
import bcrypt from "bcryptjs";
import app from "./app";
import { logger } from "./lib/logger";
import { db, usersTable } from "@workspace/db";
import { count, eq } from "drizzle-orm";

const rawPort = process.env["PORT"];

if (!rawPort) {
  throw new Error(
    "PORT environment variable is required but was not provided.",
  );
}

const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

async function syncSchema() {
  try {
    logger.info("Syncing database schema...");
    execSync("pnpm --filter @workspace/db run push", {
      stdio: "inherit",
      cwd: process.cwd().replace(/\/artifacts\/api-server$/, ""),
    });
    logger.info("Database schema is up to date.");
  } catch (err) {
    logger.warn({ err }, "Schema sync failed — continuing anyway.");
  }
}

async function seedAdmin() {
  try {
    const [{ value: adminCount }] = await db
      .select({ value: count() })
      .from(usersTable)
      .where(eq(usersTable.role, "admin"));

    if (adminCount === 0) {
      const defaultPassword = process.env["ADMIN_DEFAULT_PASSWORD"] ?? "Admin@123";
      const hashed = await bcrypt.hash(defaultPassword, 12);
      await db.insert(usersTable).values({
        username: "admin",
        password: hashed,
        email: "admin@kurios.local",
        fullName: "System Administrator",
        role: "admin",
        isActive: true,
      });
      logger.info(
        { username: "admin", password: defaultPassword },
        "Default admin account created. CHANGE THE PASSWORD after first login.",
      );
    }
  } catch (err) {
    logger.warn({ err }, "Admin seed failed — continuing anyway.");
  }
}

async function start() {
  await syncSchema();
  await seedAdmin();

  app.listen(port, (err) => {
    if (err) {
      logger.error({ err }, "Error listening on port");
      process.exit(1);
    }
    logger.info({ port }, "Server listening");
  });
}

start();
