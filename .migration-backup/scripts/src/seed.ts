import bcrypt from "bcryptjs";
import { db, usersTable, enrollmentSettingsTable } from "@workspace/db";
import { count, eq } from "drizzle-orm";

async function seedAdmin() {
  const [{ value: adminCount }] = await db
    .select({ value: count() })
    .from(usersTable)
    .where(eq(usersTable.role, "admin"));

  if (Number(adminCount) === 0) {
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
    console.log(`[seed] Admin user created. Username: admin  Password: ${defaultPassword}`);
  } else {
    console.log("[seed] Admin user already exists, skipping.");
  }
}

async function seedSettings() {
  const [{ value: settingsCount }] = await db
    .select({ value: count() })
    .from(enrollmentSettingsTable);

  if (Number(settingsCount) === 0) {
    await db.insert(enrollmentSettingsTable).values({});
    console.log("[seed] Default enrollment settings created.");
  }
}

async function main() {
  console.log("[seed] Starting database seed...");
  await seedAdmin();
  await seedSettings();
  console.log("[seed] Done.");
  process.exit(0);
}

main().catch((err) => {
  console.error("[seed] Seed failed:", err);
  process.exit(1);
});
