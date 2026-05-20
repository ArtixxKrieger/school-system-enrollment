import { Router, type IRouter } from "express";
import { db, studentsTable, coursesTable, activityLogsTable } from "@workspace/db";
import { eq, and, or, isNotNull, isNull, sql, desc } from "drizzle-orm";
import { requireAuth, requireRole } from "../lib/auth";
import { getSessionUser } from "../lib/session";

const router: IRouter = Router();

// GET /records — list students eligible for archiving or already archived
// status filter: "dropped", "inactive", "graduated", "archived"
router.get("/records", requireAuth, async (req, res) => {
  try {
    const { status, page = "1", limit = "20", search } = req.query as Record<string, string>;
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
    const offset = (pageNum - 1) * limitNum;

    const conditions: any[] = [];

    if (status === "archived") {
      conditions.push(isNotNull(studentsTable.archivedAt));
    } else if (status === "graduated") {
      conditions.push(eq(studentsTable.status, "graduated"));
      conditions.push(isNull(studentsTable.archivedAt));
    } else if (status === "inactive") {
      conditions.push(eq(studentsTable.status, "inactive"));
      conditions.push(isNull(studentsTable.archivedAt));
    } else if (status === "dropped") {
      conditions.push(eq(studentsTable.status, "dropped"));
      conditions.push(isNull(studentsTable.archivedAt));
    } else {
      // Default: all non-active, non-archived students (dropped + inactive + graduated)
      conditions.push(
        or(
          eq(studentsTable.status, "dropped"),
          eq(studentsTable.status, "inactive"),
          eq(studentsTable.status, "graduated"),
          isNotNull(studentsTable.archivedAt),
        )!
      );
    }

    if (search) {
      const like = `%${search}%`;
      conditions.push(
        or(
          sql`${studentsTable.firstName} ilike ${like}`,
          sql`${studentsTable.lastName} ilike ${like}`,
          sql`${studentsTable.studentId} ilike ${like}`,
        )!
      );
    }

    const whereClause = and(...conditions);

    const [{ total }] = await db
      .select({ total: sql<number>`count(*)::int` })
      .from(studentsTable)
      .where(whereClause);

    const rows = await db
      .select({ student: studentsTable, course: coursesTable })
      .from(studentsTable)
      .leftJoin(coursesTable, eq(studentsTable.courseId, coursesTable.id))
      .where(whereClause)
      .orderBy(desc(studentsTable.enrollmentDate))
      .limit(limitNum)
      .offset(offset);

    res.json({
      data: rows.map(({ student, course }) => ({
        ...student,
        courseCode: course?.courseCode ?? null,
        courseName: course?.courseName ?? null,
      })),
      total,
      page: pageNum,
      limit: limitNum,
    });
  } catch (err) {
    req.log.error(err, "List records error");
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /records/:id/archive — archive a student record
router.post("/records/:id/archive", requireAuth, requireRole("superadmin", "admin"), async (req, res) => {
  const id = Number(req.params.id);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  const { reason } = req.body as { reason?: string };
  const session = getSessionUser(req)!;
  try {
    const [student] = await db
      .update(studentsTable)
      .set({ archivedAt: new Date(), archiveReason: reason ?? null })
      .where(eq(studentsTable.id, id))
      .returning();
    if (!student) { res.status(404).json({ error: "Student not found" }); return; }
    await db.insert(activityLogsTable).values({
      userId: session.userId,
      action: "archive_student",
      description: `Archived student ${student.studentId}${reason ? `: ${reason}` : ""}`,
      entityType: "student",
      entityId: student.id,
    });
    res.json(student);
  } catch (err) {
    req.log.error(err, "Archive student error");
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /records/:id/restore — restore an archived/dropped/inactive student
router.post("/records/:id/restore", requireAuth, requireRole("superadmin", "admin"), async (req, res) => {
  const id = Number(req.params.id);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  const session = getSessionUser(req)!;
  try {
    const existing = await db.query.studentsTable.findFirst({ where: eq(studentsTable.id, id) });
    if (!existing) { res.status(404).json({ error: "Student not found" }); return; }
    // Restore: clear archive fields, set status back to active (only for non-graduated)
    const newStatus = existing.status === "graduated" ? "graduated" : "active";
    const [student] = await db
      .update(studentsTable)
      .set({ archivedAt: null, archiveReason: null, status: newStatus, isAccountActive: newStatus === "active" })
      .where(eq(studentsTable.id, id))
      .returning();
    await db.insert(activityLogsTable).values({
      userId: session.userId,
      action: "restore_student",
      description: `Restored student ${student.studentId} to ${newStatus}`,
      entityType: "student",
      entityId: student.id,
    });
    res.json(student);
  } catch (err) {
    req.log.error(err, "Restore student error");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
