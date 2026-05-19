import { Router, type IRouter } from "express";
import { db, curriculumTable, coursesTable, activityLogsTable } from "@workspace/db";
import { eq, and, asc } from "drizzle-orm";
import { ListCurriculumQueryParams, CreateCurriculumSubjectBody, UpdateCurriculumSubjectParams, UpdateCurriculumSubjectBody, DeleteCurriculumSubjectParams } from "@workspace/api-zod";
import { requireAuth, requireRole } from "../lib/auth";
import { getSessionUser } from "../lib/session";

const router: IRouter = Router();

router.get("/curriculum", requireAuth, async (req, res) => {
  try {
    const params = ListCurriculumQueryParams.safeParse(req.query);
    if (!params.success) {
      res.status(400).json({ error: "Invalid query params" });
      return;
    }
    const { course_id, year_level, semester } = params.data;

    const conditions = [];
    if (course_id) conditions.push(eq(curriculumTable.courseId, Number(course_id)));
    if (year_level) conditions.push(eq(curriculumTable.yearLevel, Number(year_level)));
    if (semester) conditions.push(eq(curriculumTable.semester, Number(semester)));

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const subjects = await db
      .select({ subject: curriculumTable, course: coursesTable })
      .from(curriculumTable)
      .leftJoin(coursesTable, eq(curriculumTable.courseId, coursesTable.id))
      .where(whereClause)
      .orderBy(asc(curriculumTable.yearLevel), asc(curriculumTable.semester), asc(curriculumTable.subjectCode));

    res.json(subjects.map(({ subject, course }) => ({
      ...subject,
      courseCode: course?.courseCode ?? null,
      courseName: course?.courseName ?? null,
    })));
  } catch (err) {
    req.log.error(err, "List curriculum error");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/curriculum", requireAuth, requireRole("superadmin", "admin"), async (req, res) => {
  const parsed = CreateCurriculumSubjectBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid request body" });
    return;
  }
  try {
    const [subject] = await db.insert(curriculumTable).values(parsed.data).returning();
    const session = getSessionUser(req)!;
    await db.insert(activityLogsTable).values({ userId: session.userId, action: "create_curriculum", description: `Added subject ${subject.subjectCode}`, entityType: "curriculum", entityId: subject.id });
    res.status(201).json(subject);
  } catch (err) {
    req.log.error(err, "Create curriculum error");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.put("/curriculum/:id", requireAuth, requireRole("superadmin", "admin"), async (req, res) => {
  const params = UpdateCurriculumSubjectParams.safeParse({ id: Number(req.params.id) });
  const body = UpdateCurriculumSubjectBody.safeParse(req.body);
  if (!params.success || !body.success) {
    res.status(400).json({ error: "Invalid request" });
    return;
  }
  try {
    const [subject] = await db.update(curriculumTable).set({ ...body.data, updatedAt: new Date() }).where(eq(curriculumTable.id, params.data.id)).returning();
    if (!subject) {
      res.status(404).json({ error: "Subject not found" });
      return;
    }
    res.json(subject);
  } catch (err) {
    req.log.error(err, "Update curriculum error");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.delete("/curriculum/:id", requireAuth, requireRole("superadmin", "admin"), async (req, res) => {
  const params = DeleteCurriculumSubjectParams.safeParse({ id: Number(req.params.id) });
  if (!params.success) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }
  try {
    const [deleted] = await db.delete(curriculumTable).where(eq(curriculumTable.id, params.data.id)).returning();
    if (!deleted) {
      res.status(404).json({ error: "Subject not found" });
      return;
    }
    res.json({ ok: true });
  } catch (err) {
    req.log.error(err, "Delete curriculum error");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
