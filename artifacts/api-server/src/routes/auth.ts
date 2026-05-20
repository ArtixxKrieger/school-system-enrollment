import { Router, type IRouter } from "express";
import bcrypt from "bcryptjs";
import { db, usersTable, activityLogsTable } from "@workspace/db";
import { eq, or } from "drizzle-orm";
import { LoginBody, ChangePasswordBody } from "@workspace/api-zod";
import { getSessionUser, setSessionUser, clearSession } from "../lib/session";
import { getUserWithPermissions, requireAuth } from "../lib/auth";

const router: IRouter = Router();

router.post("/auth/login", async (req, res) => {
  const parsed = LoginBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid request body" });
    return;
  }
  const { identifier, password } = parsed.data;

  try {
    const user = await db.query.usersTable.findFirst({
      where: or(eq(usersTable.username, identifier), eq(usersTable.email, identifier)),
    });

    if (!user || !user.isActive) {
      res.status(401).json({ error: "Invalid credentials" });
      return;
    }

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      res.status(401).json({ error: "Invalid credentials" });
      return;
    }

    setSessionUser(req, user);
    await db.update(usersTable).set({ lastLogin: new Date() }).where(eq(usersTable.id, user.id));

    await db.insert(activityLogsTable).values({
      userId: user.id,
      action: "login",
      description: `User ${user.username} logged in`,
      entityType: "user",
      entityId: user.id,
      ipAddress: req.ip,
    });

    const userWithPerms = await getUserWithPermissions(user.id);
    res.json({ ok: true, user: userWithPerms });
  } catch (err) {
    req.log.error(err, "Login error");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/auth/logout", requireAuth, async (req, res) => {
  const session = getSessionUser(req);
  if (session) {
    await db.insert(activityLogsTable).values({
      userId: session.userId,
      action: "logout",
      description: "User logged out",
      entityType: "user",
      entityId: session.userId,
      ipAddress: req.ip,
    }).catch(() => {});
  }
  await clearSession(req);
  res.json({ ok: true });
});

router.get("/auth/me", async (req, res) => {
  const session = getSessionUser(req);
  if (!session) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  try {
    const user = await getUserWithPermissions(session.userId);
    if (!user || !user.isActive) {
      await clearSession(req);
      res.status(401).json({ error: "Unauthorized" });
      return;
    }
    res.json(user);
  } catch (err) {
    req.log.error(err, "Get me error");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/auth/change-password", requireAuth, async (req, res) => {
  const parsed = ChangePasswordBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid request body" });
    return;
  }
  const session = getSessionUser(req)!;
  const { currentPassword, newPassword } = parsed.data;

  try {
    const user = await db.query.usersTable.findFirst({ where: eq(usersTable.id, session.userId) });
    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }
    const valid = await bcrypt.compare(currentPassword, user.password);
    if (!valid) {
      res.status(400).json({ error: "Current password is incorrect" });
      return;
    }
    const hash = await bcrypt.hash(newPassword, 10);
    await db.update(usersTable).set({ password: hash }).where(eq(usersTable.id, user.id));
    res.json({ ok: true });
  } catch (err) {
    req.log.error(err, "Change password error");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
