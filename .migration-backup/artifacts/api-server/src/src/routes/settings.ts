import { Router, type IRouter } from "express";
import { db, enrollmentSettingsTable, activityLogsTable, studentsTable } from "@workspace/db";
import { eq, and, sql } from "drizzle-orm";
import { UpdateSettingsBody } from "@workspace/api-zod";
import { requireAuth, requireRole } from "../lib/auth";
import { getSessionUser } from "../lib/session";

const router: IRouter = Router();

async function getOrCreateSettings() {
  const existing = await db.query.enrollmentSettingsTable.findFirst();
  if (existing) return existing;
  const [created] = await db.insert(enrollmentSettingsTable).values({}).returning();
  return created;
}

router.get("/settings", requireAuth, async (req, res) => {
  try {
    const settings = await getOrCreateSettings();
    res.json(settings);
  } catch (err) {
    req.log.error(err, "Get settings error");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.put("/settings", requireAuth, requireRole("superadmin", "admin"), async (req, res) => {
  const parsed = UpdateSettingsBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid request body" });
    return;
  }
  const session = getSessionUser(req)!;
  try {
    const existing = await getOrCreateSettings();
    const [updated] = await db
      .update(enrollmentSettingsTable)
      .set({ ...parsed.data, updatedAt: new Date() })
      .where(eq(enrollmentSettingsTable.id, existing.id))
      .returning();
    await db.insert(activityLogsTable).values({ userId: session.userId, action: "update_settings", description: "Updated enrollment settings", entityType: "settings" });
    res.json(updated);
  } catch (err) {
    req.log.error(err, "Update settings error");
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /settings/end-semester — trigger semester-end progression
// semester=1: moves 1st sem students to 2nd sem
// semester=2: advances year level (or graduates 4th year students)
router.post("/settings/end-semester", requireAuth, requireRole("superadmin", "admin"), async (req, res) => {
  const { semester, academicYear } = req.body as { semester: 1 | 2; academicYear?: string };
  if (semester !== 1 && semester !== 2) {
    res.status(400).json({ error: "semester must be 1 or 2" });
    return;
  }
  const session = getSessionUser(req)!;
  try {
    if (semester === 1) {
      // Move all active 1st-semester enrolled students to 2nd semester
      const result = await db
        .update(studentsTable)
        .set({ currentSemester: 2, progressionStatus: "pending_progression" })
        .where(and(
          eq(studentsTable.status, "active"),
          eq(studentsTable.currentSemester, 1),
          eq(studentsTable.progressionStatus, "enrolled"),
        ))
        .returning({ id: studentsTable.id });
      const affected = result.length;
      const message = affected > 0
        ? `${affected} student(s) advanced to 2nd semester and sent to re-enrollment queue.`
        : "No eligible students found for 1st semester progression.";
      await db.insert(activityLogsTable).values({
        userId: session.userId,
        action: "semester_end_triggered",
        description: `Processed semester-end progression for semester 1 (${affected} student(s) affected).`,
        entityType: "enrollment_progression",
        newValue: JSON.stringify({ semester: 1, affected, message }),
      });
      res.json({ affected, message });
    } else {
      // Semester 2 end: advance year level or graduate 4th-year students
      const eligible = await db.query.studentsTable.findMany({
        where: and(
          eq(studentsTable.status, "active"),
          eq(studentsTable.currentSemester, 2),
          eq(studentsTable.progressionStatus, "enrolled"),
        ),
      });

      let advanced = 0;
      let graduated = 0;
      const MAX_YEAR = 4;

      for (const student of eligible) {
        if (student.yearLevel >= MAX_YEAR) {
          // Graduate
          await db.update(studentsTable).set({
            status: "graduated",
            graduatedAt: new Date(),
            isAccountActive: false,
            progressionStatus: "graduated",
          }).where(eq(studentsTable.id, student.id));
          graduated++;
        } else {
          // Advance to next year level, 1st semester
          const nextYear = academicYear ?? null;
          await db.update(studentsTable).set({
            yearLevel: student.yearLevel + 1,
            currentSemester: 1,
            progressionStatus: "pending_progression",
            ...(nextYear ? { currentAcademicYear: nextYear } : {}),
          }).where(eq(studentsTable.id, student.id));
          advanced++;
        }
      }

      const affected = advanced + graduated;
      const message = affected > 0
        ? `${advanced} student(s) advanced to next year level. ${graduated} student(s) graduated.`
        : "No eligible students found for 2nd semester progression.";
      await db.insert(activityLogsTable).values({
        userId: session.userId,
        action: "semester_end_triggered",
        description: `Processed semester-end progression for semester 2 (${affected} student(s) affected).`,
        entityType: "enrollment_progression",
        newValue: JSON.stringify({ semester: 2, affected, advanced, graduated, message }),
      });
      res.json({ affected, advanced, graduated, message });
    }
  } catch (err) {
    req.log.error(err, "End semester error");
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /settings/progression-preview — preview how many students will be affected
router.get("/settings/progression-preview", requireAuth, async (req, res) => {
  try {
    const [sem1Count] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(studentsTable)
      .where(and(eq(studentsTable.status, "active"), eq(studentsTable.currentSemester, 1), eq(studentsTable.progressionStatus, "enrolled")));
    const [sem2Count] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(studentsTable)
      .where(and(eq(studentsTable.status, "active"), eq(studentsTable.currentSemester, 2), eq(studentsTable.progressionStatus, "enrolled")));
    const [yr4Count] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(studentsTable)
      .where(and(eq(studentsTable.status, "active"), eq(studentsTable.currentSemester, 2), eq(studentsTable.progressionStatus, "enrolled"), eq(studentsTable.yearLevel, 4)));
    res.json({
      sem1Eligible: sem1Count.count,
      sem2Eligible: sem2Count.count,
      graduatingCount: yr4Count.count,
    });
  } catch (err) {
    req.log.error(err, "Progression preview error");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
