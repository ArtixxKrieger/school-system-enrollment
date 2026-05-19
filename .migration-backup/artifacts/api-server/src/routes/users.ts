import { Router, type IRouter } from "express";
import { db, usersTable, rolesTable, activityLogsTable } from "@workspace/db";
import { eq, asc } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { CreateUserBody, UpdateUserParams, UpdateUserBody } from "@workspace/api-zod";
import { requireAuth, requireRole } from "../lib/auth";
import { getSessionUser } from "../lib/session";

const router: IRouter = Router();

router.get("/users", requireAuth, requireRole("superadmin", "admin"), async (req, res) => {
  try {
    const users = await db
      .select({
        id: usersTable.id,
        username: usersTable.username,
        email: usersTable.email,
        fullName: usersTable.fullName,
        phone: usersTable.phone,
        role: usersTable.role,
        roleId: usersTable.roleId,
        isActive: usersTable.isActive,
        lastLogin: usersTable.lastLogin,
        createdAt: usersTable.createdAt,
      })
      .from(usersTable)
      .orderBy(asc(usersTable.fullName));

    const roles = await db.select().from(rolesTable);
    const roleMap = Object.fromEntries(roles.map((r) => [r.id, r]));

    res.json(users.map((u) => ({ ...u, roleName: u.roleId ? roleMap[u.roleId]?.name ?? u.role : u.role })));
  } catch (err) {
    req.log.error(err, "List users error");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/users", requireAuth, requireRole("superadmin", "admin"), async (req, res) => {
  const parsed = CreateUserBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid request body", details: parsed.error });
    return;
  }
  const session = getSessionUser(req)!;
  try {
    const { password, ...rest } = parsed.data as typeof parsed.data & { password: string };
    const hash = await bcrypt.hash(password, 10);
    const [user] = await db.insert(usersTable).values({ ...rest, password: hash }).returning({
      id: usersTable.id,
      username: usersTable.username,
      email: usersTable.email,
      fullName: usersTable.fullName,
      role: usersTable.role,
      isActive: usersTable.isActive,
    });
    await db.insert(activityLogsTable).values({ userId: session.userId, action: "create_user", description: `Created user ${user.username}`, entityType: "user", entityId: user.id });
    res.status(201).json(user);
  } catch (err: any) {
    if (err.code === "23505") {
      res.status(409).json({ error: "Username or email already exists" });
      return;
    }
    req.log.error(err, "Create user error");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.put("/users/:id", requireAuth, requireRole("superadmin", "admin"), async (req, res) => {
  const params = UpdateUserParams.safeParse({ id: Number(req.params.id) });
  const body = UpdateUserBody.safeParse(req.body);
  if (!params.success || !body.success) {
    res.status(400).json({ error: "Invalid request" });
    return;
  }
  try {
    const { password, ...rest } = body.data as typeof body.data & { password?: string };
    const updates: Record<string, unknown> = { ...rest, updatedAt: new Date() };
    if (password) {
      updates.password = await bcrypt.hash(password, 10);
    }
    const [user] = await db.update(usersTable).set(updates).where(eq(usersTable.id, params.data.id)).returning({
      id: usersTable.id,
      username: usersTable.username,
      email: usersTable.email,
      fullName: usersTable.fullName,
      role: usersTable.role,
      isActive: usersTable.isActive,
    });
    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }
    res.json(user);
  } catch (err) {
    req.log.error(err, "Update user error");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
