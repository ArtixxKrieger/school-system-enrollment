import { Router, type IRouter } from "express";
import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { UpdateProfileBody } from "@workspace/api-zod";
import { requireAuth } from "../lib/auth";
import { getSessionUser } from "../lib/session";

const router: IRouter = Router();

router.get("/profile", requireAuth, async (req, res) => {
  const session = getSessionUser(req)!;
  try {
    const user = await db.query.usersTable.findFirst({ where: eq(usersTable.id, session.userId) });
    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }
    const { password, ...safe } = user;
    res.json(safe);
  } catch (err) {
    req.log.error(err, "Get profile error");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.put("/profile", requireAuth, async (req, res) => {
  const session = getSessionUser(req)!;
  const parsed = UpdateProfileBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid request body" });
    return;
  }
  try {
    const [user] = await db.update(usersTable).set({ ...parsed.data, updatedAt: new Date() }).where(eq(usersTable.id, session.userId)).returning();
    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }
    const { password, ...safe } = user;
    res.json(safe);
  } catch (err) {
    req.log.error(err, "Update profile error");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
