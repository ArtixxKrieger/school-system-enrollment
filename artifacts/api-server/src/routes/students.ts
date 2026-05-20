import { Router, type IRouter } from "express";
import { db, studentsTable, coursesTable, activityLogsTable } from "@workspace/db";
import { eq, ilike, or, and, sql, asc, desc } from "drizzle-orm";
import { ListStudentsQueryParams, UpdateStudentBody, UpdateStudentParams, UpdateStudentStatusBody, UpdateStudentStatusParams } from "@workspace/api-zod";
import { requireAuth } from "../lib/auth";
import { getSessionUser } from "../lib/session";

const router: IRouter = Router();

router.get("/students", requireAuth, async (req, res) => {
  try {
    const params = ListStudentsQueryParams.safeParse(req.query);
    if (!params.success) {
      res.status(400).json({ error: "Invalid query params" });
      return;
    }
    const { search, course_id, year_level, status, page = 1, limit = 10 } = params.data;
    const offset = (page - 1) * limit;

    const conditions = [];
    if (search) conditions.push(or(ilike(studentsTable.firstName, `%${search}%`), ilike(studentsTable.lastName, `%${search}%`), ilike(studentsTable.studentId, `%${search}%`), ilike(studentsTable.email, `%${search}%`)));
    if (course_id) conditions.push(eq(studentsTable.courseId, Number(course_id)));
    if (year_level) conditions.push(eq(studentsTable.yearLevel, Number(year_level)));
    if (status) conditions.push(eq(studentsTable.status, status));

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const [countResult] = await db.select({ count: sql<number>`count(*)::int` }).from(studentsTable).where(whereClause);
    const students = await db
      .select({
        student: studentsTable,
        course: coursesTable,
      })
      .from(studentsTable)
      .leftJoin(coursesTable, eq(studentsTable.courseId, coursesTable.id))
      .where(whereClause)
      .orderBy(desc(studentsTable.enrollmentDate))
      .limit(limit)
      .offset(offset);

    res.json({
      data: students.map(({ student, course }) => ({
        ...student,
        courseCode: course?.courseCode ?? null,
        courseName: course?.courseName ?? null,
      })),
      total: countResult.count,
      page,
      limit,
    });
  } catch (err) {
    req.log.error(err, "List students error");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/students/stats", requireAuth, async (req, res) => {
  try {
    const [active] = await db.select({ count: sql<number>`count(*)::int` }).from(studentsTable).where(eq(studentsTable.status, "active"));
    const [inactive] = await db.select({ count: sql<number>`count(*)::int` }).from(studentsTable).where(eq(studentsTable.status, "inactive"));
    const [graduated] = await db.select({ count: sql<number>`count(*)::int` }).from(studentsTable).where(eq(studentsTable.status, "graduated"));
    const [transferred] = await db.select({ count: sql<number>`count(*)::int` }).from(studentsTable).where(eq(studentsTable.status, "transferred"));
    const [regular] = await db.select({ count: sql<number>`count(*)::int` }).from(studentsTable).where(eq(studentsTable.studentType, "regular"));
    const [irregular] = await db.select({ count: sql<number>`count(*)::int` }).from(studentsTable).where(eq(studentsTable.studentType, "irregular"));

    res.json({ active: active.count, inactive: inactive.count, graduated: graduated.count, transferred: transferred.count, regular: regular.count, irregular: irregular.count });
  } catch (err) {
    req.log.error(err, "Student stats error");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/students/:id", requireAuth, async (req, res) => {
  const id = Number(req.params.id);
  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }
  try {
    const result = await db
      .select({ student: studentsTable, course: coursesTable })
      .from(studentsTable)
      .leftJoin(coursesTable, eq(studentsTable.courseId, coursesTable.id))
      .where(eq(studentsTable.id, id))
      .limit(1);
    if (!result.length) {
      res.status(404).json({ error: "Student not found" });
      return;
    }
    const { student, course } = result[0];
    res.json({ ...student, courseCode: course?.courseCode ?? null, courseName: course?.courseName ?? null });
  } catch (err) {
    req.log.error(err, "Get student error");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.put("/students/:id", requireAuth, async (req, res) => {
  const params = UpdateStudentParams.safeParse({ id: Number(req.params.id) });
  const body = UpdateStudentBody.safeParse(req.body);
  if (!params.success || !body.success) {
    res.status(400).json({ error: "Invalid request" });
    return;
  }
  try {
    const { gpa, ...rest } = body.data;
    const updateData = { ...rest, ...(gpa !== undefined ? { gpa: String(gpa) } : {}) };
    const [student] = await db.update(studentsTable).set(updateData).where(eq(studentsTable.id, params.data.id)).returning();
    if (!student) {
      res.status(404).json({ error: "Student not found" });
      return;
    }
    const session = getSessionUser(req)!;
    await db.insert(activityLogsTable).values({ userId: session.userId, action: "update_student", description: `Updated student ${student.studentId}`, entityType: "student", entityId: student.id });
    res.json(student);
  } catch (err) {
    req.log.error(err, "Update student error");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.patch("/students/:id/status", requireAuth, async (req, res) => {
  const params = UpdateStudentStatusParams.safeParse({ id: Number(req.params.id) });
  const body = UpdateStudentStatusBody.safeParse(req.body);
  if (!params.success || !body.success) {
    res.status(400).json({ error: "Invalid request" });
    return;
  }
  try {
    const [student] = await db.update(studentsTable).set(body.data).where(eq(studentsTable.id, params.data.id)).returning();
    if (!student) {
      res.status(404).json({ error: "Student not found" });
      return;
    }
    const session = getSessionUser(req)!;
    await db.insert(activityLogsTable).values({ userId: session.userId, action: "update_student_status", description: `Updated status of ${student.studentId} to ${body.data.status}`, entityType: "student", entityId: student.id });
    res.json(student);
  } catch (err) {
    req.log.error(err, "Update student status error");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
