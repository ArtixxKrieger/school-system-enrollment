import { Router, type IRouter, type Request, type Response, type NextFunction } from "express";
import { db, usersTable, rolesTable, rolePermissionsTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { getSessionUser } from "./session";

export async function getUserWithPermissions(userId: number) {
  const user = await db.query.usersTable.findFirst({
    where: eq(usersTable.id, userId),
  });
  if (!user) return null;

  const perms = await db
    .select()
    .from(rolePermissionsTable)
    .where(
      and(
        eq(rolePermissionsTable.roleId, user.roleId ?? 0),
        eq(rolePermissionsTable.isAllowed, true),
      ),
    );

  const permissions: Record<string, string[]> = {};
  for (const p of perms) {
    if (!permissions[p.permissionModuleSlug]) permissions[p.permissionModuleSlug] = [];
    permissions[p.permissionModuleSlug].push(p.action);
  }

  return { ...user, permissions };
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const sessionUser = getSessionUser(req);
  if (!sessionUser) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  next();
}

export function requireRole(...roles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    const sessionUser = getSessionUser(req);
    if (!sessionUser) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }
    if (!roles.includes(sessionUser.userRole) && sessionUser.userRole !== "superadmin") {
      res.status(403).json({ error: "Forbidden" });
      return;
    }
    next();
  };
}
