import { Router, type IRouter } from "express";
import { db, enrollmentSettingsTable, activityLogsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { UpdateSettingsBody } from "@workspace/api-zod";
import { requireAuth, requireRole } from "../lib/auth";
import { getSessionUser } from "../lib/session";

const router: IRouter = Router();

async function getOrCreateSettings() {
  const existing = await db.query.enrollmentSettingsTable.findFirst();
  if (existing) return existing;
  const [created] = await db.insert(enrollmentSettingsTable).values({}).returning();
  return created;
}

router.get("/settings", requireAuth, async (req, res) => {
  try {
    const settings = await getOrCreateSettings();
    res.json(settings);
  } catch (err) {
    req.log.error(err, "Get settings error");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.put("/settings", requireAuth, requireRole("superadmin", "admin"), async (req, res) => {
  const parsed = UpdateSettingsBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid request body" });
    return;
  }
  const session = getSessionUser(req)!;
  try {
    const existing = await getOrCreateSettings();
    const [updated] = await db
      .update(enrollmentSettingsTable)
      .set({ ...parsed.data, updatedAt: new Date() })
      .where(eq(enrollmentSettingsTable.id, existing.id))
      .returning();
    await db.insert(activityLogsTable).values({ userId: session.userId, action: "update_settings", description: "Updated enrollment settings", entityType: "settings" });
    res.json(updated);
  } catch (err) {
    req.log.error(err, "Update settings error");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
