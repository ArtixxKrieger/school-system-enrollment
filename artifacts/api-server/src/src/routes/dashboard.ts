import { Router, type IRouter } from "express";
import { db, studentsTable, coursesTable, enrolleesTable, curriculumTable } from "@workspace/db";
import { eq, sql, and } from "drizzle-orm";
import { requireAuth } from "../lib/auth";

const router: IRouter = Router();

router.get("/dashboard/stats", requireAuth, async (req, res) => {
  try {
    const [totalStudents] = await db.select({ count: sql<number>`count(*)::int` }).from(studentsTable).where(eq(studentsTable.status, "active"));
    const [activeCourses] = await db.select({ count: sql<number>`count(*)::int` }).from(coursesTable).where(eq(coursesTable.isActive, true));
    const [pendingEnrollees] = await db.select({ count: sql<number>`count(*)::int` }).from(enrolleesTable).where(eq(enrolleesTable.status, "pre-registered"));
    const [approvedEnrollees] = await db.select({ count: sql<number>`count(*)::int` }).from(enrolleesTable).where(eq(enrolleesTable.status, "approved"));
    const [totalEnrolled] = await db.select({ count: sql<number>`count(*)::int` }).from(studentsTable);
    const [totalSubjects] = await db.select({ count: sql<number>`count(*)::int` }).from(curriculumTable).where(eq(curriculumTable.isActive, true));

    const programBreakdown = await db
      .select({
        courseId: studentsTable.courseId,
        count: sql<number>`count(*)::int`,
      })
      .from(studentsTable)
      .where(eq(studentsTable.status, "active"))
      .groupBy(studentsTable.courseId);

    const coursesData = await db.select().from(coursesTable);
    const courseMap = Object.fromEntries(coursesData.map((c) => [c.id, c]));

    const yearLevelBreakdown = await db
      .select({
        yearLevel: studentsTable.yearLevel,
        count: sql<number>`count(*)::int`,
      })
      .from(studentsTable)
      .where(eq(studentsTable.status, "active"))
      .groupBy(studentsTable.yearLevel)
      .orderBy(studentsTable.yearLevel);

    res.json({
      totalStudents: totalStudents.count,
      activeCourses: activeCourses.count,
      pendingEnrollees: pendingEnrollees.count,
      approvedEnrollees: approvedEnrollees.count,
      totalEnrolled: totalEnrolled.count,
      totalSubjects: totalSubjects.count,
      programBreakdown: programBreakdown.map((p) => ({
        courseId: p.courseId,
        courseCode: courseMap[p.courseId ?? 0]?.courseCode ?? "N/A",
        courseName: courseMap[p.courseId ?? 0]?.courseName ?? "Unknown",
        count: p.count,
      })),
      yearLevelBreakdown: yearLevelBreakdown.map((y) => ({
        yearLevel: y.yearLevel,
        count: y.count,
      })),
    });
  } catch (err) {
    req.log.error(err, "Dashboard stats error");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
