import { Router, type IRouter } from "express";
import { db, coursesTable, studentsTable } from "@workspace/db";
import { eq, sql, ilike, or, asc } from "drizzle-orm";
import { CreateCourseBody, UpdateCourseBody, UpdateCourseParams, DeleteCourseParams } from "@workspace/api-zod";
import { requireAuth, requireRole } from "../lib/auth";
import { getSessionUser } from "../lib/session";
import { db as dbConn, activityLogsTable } from "@workspace/db";

const router: IRouter = Router();

router.get("/courses", requireAuth, async (req, res) => {
  try {
    const courses = await db.select().from(coursesTable).orderBy(asc(coursesTable.displayOrder), asc(coursesTable.courseCode));
    const studentCounts = await db
      .select({ courseId: studentsTable.courseId, count: sql<number>`count(*)::int` })
      .from(studentsTable)
      .groupBy(studentsTable.courseId);
    const countMap = Object.fromEntries(studentCounts.map((s) => [s.courseId ?? 0, s.count]));
    res.json(courses.map((c) => ({ ...c, studentCount: countMap[c.id] ?? 0 })));
  } catch (err) {
    req.log.error(err, "List courses error");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/courses", requireAuth, requireRole("superadmin", "admin"), async (req, res) => {
  const parsed = CreateCourseBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid request body", details: parsed.error });
    return;
  }
  try {
    const [course] = await db.insert(coursesTable).values(parsed.data).returning();
    const session = getSessionUser(req)!;
    await db.insert(activityLogsTable).values({ userId: session.userId, action: "create_course", description: `Created course ${course.courseCode}`, entityType: "course", entityId: course.id });
    res.status(201).json(course);
  } catch (err) {
    req.log.error(err, "Create course error");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.put("/courses/:id", requireAuth, requireRole("superadmin", "admin"), async (req, res) => {
  const params = UpdateCourseParams.safeParse({ id: Number(req.params.id) });
  const body = UpdateCourseBody.safeParse(req.body);
  if (!params.success || !body.success) {
    res.status(400).json({ error: "Invalid request" });
    return;
  }
  try {
    const [course] = await db.update(coursesTable).set({ ...body.data, updatedAt: new Date() }).where(eq(coursesTable.id, params.data.id)).returning();
    if (!course) {
      res.status(404).json({ error: "Course not found" });
      return;
    }
    res.json(course);
  } catch (err) {
    req.log.error(err, "Update course error");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.delete("/courses/:id", requireAuth, requireRole("superadmin", "admin"), async (req, res) => {
  const params = DeleteCourseParams.safeParse({ id: Number(req.params.id) });
  if (!params.success) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }
  try {
    const [deleted] = await db.delete(coursesTable).where(eq(coursesTable.id, params.data.id)).returning();
    if (!deleted) {
      res.status(404).json({ error: "Course not found" });
      return;
    }
    res.json({ ok: true });
  } catch (err) {
    req.log.error(err, "Delete course error");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
