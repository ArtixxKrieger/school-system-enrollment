import { Router, type IRouter } from "express";
import { db, activityLogsTable, usersTable } from "@workspace/db";
import { eq, desc, and, sql, ilike } from "drizzle-orm";
import { ListActivityLogsQueryParams } from "@workspace/api-zod";
import { requireAuth, requireRole } from "../lib/auth";

const router: IRouter = Router();

router.get("/activity-logs", requireAuth, requireRole("superadmin", "admin"), async (req, res) => {
  try {
    const params = ListActivityLogsQueryParams.safeParse(req.query);
    if (!params.success) {
      res.status(400).json({ error: "Invalid query params" });
      return;
    }
    const { page = 1, limit = 20 } = params.data;
    const offset = (page - 1) * limit;

    const conditions: ReturnType<typeof eq>[] = [];
    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const [countResult] = await db.select({ count: sql<number>`count(*)::int` }).from(activityLogsTable).where(whereClause);
    const logs = await db
      .select({
        log: activityLogsTable,
        user: { id: usersTable.id, username: usersTable.username, fullName: usersTable.fullName },
      })
      .from(activityLogsTable)
      .leftJoin(usersTable, eq(activityLogsTable.userId, usersTable.id))
      .where(whereClause)
      .orderBy(desc(activityLogsTable.createdAt))
      .limit(limit)
      .offset(offset);

    res.json({
      data: logs.map(({ log, user }) => ({ ...log, username: user?.username ?? null, userFullName: user?.fullName ?? null })),
      total: countResult.count,
      page,
      limit,
    });
  } catch (err) {
    req.log.error(err, "List activity logs error");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
