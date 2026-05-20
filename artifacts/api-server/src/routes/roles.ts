import { Router, type IRouter } from "express";
import { db, rolesTable, rolePermissionsTable, activityLogsTable } from "@workspace/db";
import { eq, asc } from "drizzle-orm";
import { CreateRoleBody, UpdateRoleParams, UpdateRoleBody, DeleteRoleParams } from "@workspace/api-zod";
import { requireAuth, requireRole } from "../lib/auth";
import { getSessionUser } from "../lib/session";

const router: IRouter = Router();

router.get("/roles", requireAuth, async (req, res) => {
  try {
    const roles = await db.select().from(rolesTable).orderBy(asc(rolesTable.name));
    const permissions = await db.select().from(rolePermissionsTable);

    const permsMap: Record<number, { module: string; action: string }[]> = {};
    for (const p of permissions) {
      if (!permsMap[p.roleId]) permsMap[p.roleId] = [];
      permsMap[p.roleId].push({ module: p.permissionModuleSlug, action: p.action });
    }

    res.json(roles.map((r) => ({ ...r, permissions: permsMap[r.id] ?? [] })));
  } catch (err) {
    req.log.error(err, "List roles error");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/roles", requireAuth, requireRole("superadmin"), async (req, res) => {
  const parsed = CreateRoleBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid request body" });
    return;
  }
  const session = getSessionUser(req)!;
  try {
    const { permissions, ...roleData } = parsed.data as typeof parsed.data & { permissions?: { module: string; action: string }[] };
    const [role] = await db.insert(rolesTable).values(roleData).returning();

    if (permissions?.length) {
      await db.insert(rolePermissionsTable).values(permissions.map((p) => ({ roleId: role.id, permissionModuleSlug: p.module, action: p.action, isAllowed: true })));
    }

    await db.insert(activityLogsTable).values({ userId: session.userId, action: "create_role", description: `Created role ${role.name}`, entityType: "role", entityId: role.id });
    res.status(201).json(role);
  } catch (err) {
    req.log.error(err, "Create role error");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.put("/roles/:id", requireAuth, requireRole("superadmin"), async (req, res) => {
  const params = UpdateRoleParams.safeParse({ id: Number(req.params.id) });
  const body = UpdateRoleBody.safeParse(req.body);
  if (!params.success || !body.success) {
    res.status(400).json({ error: "Invalid request" });
    return;
  }
  try {
    const existing = await db.query.rolesTable.findFirst({ where: eq(rolesTable.id, params.data.id) });
    if (!existing) {
      res.status(404).json({ error: "Role not found" });
      return;
    }
    if (existing.isSystem) {
      res.status(403).json({ error: "Cannot modify system roles" });
      return;
    }

    const { permissions, ...roleData } = body.data as typeof body.data & { permissions?: { module: string; action: string }[] };
    const [role] = await db.update(rolesTable).set({ ...roleData, updatedAt: new Date() }).where(eq(rolesTable.id, params.data.id)).returning();

    if (permissions !== undefined) {
      await db.delete(rolePermissionsTable).where(eq(rolePermissionsTable.roleId, params.data.id));
      if (permissions.length) {
        await db.insert(rolePermissionsTable).values(permissions.map((p) => ({ roleId: role.id, permissionModuleSlug: p.module, action: p.action, isAllowed: true })));
      }
    }

    res.json(role);
  } catch (err) {
    req.log.error(err, "Update role error");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.delete("/roles/:id", requireAuth, requireRole("superadmin"), async (req, res) => {
  const params = DeleteRoleParams.safeParse({ id: Number(req.params.id) });
  if (!params.success) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }
  try {
    const existing = await db.query.rolesTable.findFirst({ where: eq(rolesTable.id, params.data.id) });
    if (!existing) {
      res.status(404).json({ error: "Role not found" });
      return;
    }
    if (existing.isSystem) {
      res.status(403).json({ error: "Cannot delete system roles" });
      return;
    }
    await db.delete(rolesTable).where(eq(rolesTable.id, params.data.id));
    res.json({ ok: true });
  } catch (err) {
    req.log.error(err, "Delete role error");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
