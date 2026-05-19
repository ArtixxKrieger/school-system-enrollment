import { Router, type IRouter } from "express";
import { db, enrolleesTable, studentsTable, coursesTable, activityLogsTable, usersTable } from "@workspace/db";
import { eq, ilike, or, and, sql, desc } from "drizzle-orm";
import bcrypt from "bcryptjs";
import {
  ListEnrolleesQueryParams,
  CreateEnrolleeBody,
  ApproveEnrolleeParams,
  ApproveEnrolleeBody,
  RejectEnrolleeParams,
  RejectEnrolleeBody,
  BulkApproveEnrolleesBody,
} from "@workspace/api-zod";
import { requireAuth, requireRole } from "../lib/auth";
import { getSessionUser } from "../lib/session";

const router: IRouter = Router();

function generatePreRegNumber(): string {
  const year = new Date().getFullYear();
  const random = Math.floor(10000 + Math.random() * 90000);
  return `PRE-${year}-${random}`;
}

function generateStudentId(): string {
  const year = new Date().getFullYear();
  const random = Math.floor(10000 + Math.random() * 90000);
  return `${year}-${random}`;
}

router.get("/enrollees", requireAuth, async (req, res) => {
  try {
    const params = ListEnrolleesQueryParams.safeParse(req.query);
    if (!params.success) {
      res.status(400).json({ error: "Invalid query params" });
      return;
    }
    const { search, status, course, page = 1 } = params.data;
    const limit = 10;
    const offset = (page - 1) * limit;

    const conditions = [];
    if (search) conditions.push(or(ilike(enrolleesTable.firstName, `%${search}%`), ilike(enrolleesTable.lastName, `%${search}%`), ilike(enrolleesTable.preRegNumber, `%${search}%`), ilike(enrolleesTable.email, `%${search}%`)));
    if (status) conditions.push(eq(enrolleesTable.status, status));
    if (course) conditions.push(eq(enrolleesTable.courseId, Number(course)));

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const [countResult] = await db.select({ count: sql<number>`count(*)::int` }).from(enrolleesTable).where(whereClause);
    const enrollees = await db
      .select({ enrollee: enrolleesTable, course: coursesTable })
      .from(enrolleesTable)
      .leftJoin(coursesTable, eq(enrolleesTable.courseId, coursesTable.id))
      .where(whereClause)
      .orderBy(desc(enrolleesTable.applicationDate))
      .limit(limit)
      .offset(offset);

    res.json({
      data: enrollees.map(({ enrollee, course }) => ({
        ...enrollee,
        courseCode: course?.courseCode ?? null,
        courseName: course?.courseName ?? null,
      })),
      total: countResult.count,
      page,
      limit,
    });
  } catch (err) {
    req.log.error(err, "List enrollees error");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/enrollees", async (req, res) => {
  const parsed = CreateEnrolleeBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid request body", details: parsed.error });
    return;
  }
  try {
    const { password, ...rest } = parsed.data as typeof parsed.data & { password?: string };
    const passwordHash = password ? await bcrypt.hash(password, 10) : null;
    const preRegNumber = generatePreRegNumber();

    const [enrollee] = await db
      .insert(enrolleesTable)
      .values({ ...rest, preRegNumber, passwordHash: passwordHash ?? undefined })
      .returning();

    res.status(201).json(enrollee);
  } catch (err: any) {
    if (err.code === "23505") {
      res.status(409).json({ error: "Email already registered" });
      return;
    }
    req.log.error(err, "Create enrollee error");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/enrollees/stats", requireAuth, async (req, res) => {
  try {
    const [preRegistered] = await db.select({ count: sql<number>`count(*)::int` }).from(enrolleesTable).where(eq(enrolleesTable.status, "pre-registered"));
    const [approved] = await db.select({ count: sql<number>`count(*)::int` }).from(enrolleesTable).where(eq(enrolleesTable.status, "approved"));
    const [rejected] = await db.select({ count: sql<number>`count(*)::int` }).from(enrolleesTable).where(eq(enrolleesTable.status, "rejected"));
    const [enrolled] = await db.select({ count: sql<number>`count(*)::int` }).from(enrolleesTable).where(eq(enrolleesTable.status, "enrolled"));
    res.json({ preRegistered: preRegistered.count, approved: approved.count, rejected: rejected.count, enrolled: enrolled.count });
  } catch (err) {
    req.log.error(err, "Enrollee stats error");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/enrollees/:id/approve", requireAuth, requireRole("superadmin", "admin", "staff"), async (req, res) => {
  const params = ApproveEnrolleeParams.safeParse({ id: Number(req.params.id) });
  const body = ApproveEnrolleeBody.safeParse(req.body);
  if (!params.success || !body.success) {
    res.status(400).json({ error: "Invalid request" });
    return;
  }
  const session = getSessionUser(req)!;
  try {
    const enrollee = await db.query.enrolleesTable.findFirst({ where: eq(enrolleesTable.id, params.data.id) });
    if (!enrollee) {
      res.status(404).json({ error: "Enrollee not found" });
      return;
    }
    if (enrollee.status !== "pre-registered") {
      res.status(400).json({ error: "Enrollee is not in pre-registered status" });
      return;
    }

    const [updated] = await db
      .update(enrolleesTable)
      .set({ status: "approved", approvedDate: new Date(), approvedBy: session.userId, notes: body.data.notes ?? enrollee.notes })
      .where(eq(enrolleesTable.id, params.data.id))
      .returning();

    await db.insert(activityLogsTable).values({ userId: session.userId, action: "approve_enrollee", description: `Approved enrollee ${updated.preRegNumber}`, entityType: "enrollee", entityId: updated.id });
    res.json(updated);
  } catch (err) {
    req.log.error(err, "Approve enrollee error");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/enrollees/:id/reject", requireAuth, requireRole("superadmin", "admin", "staff"), async (req, res) => {
  const params = RejectEnrolleeParams.safeParse({ id: Number(req.params.id) });
  const body = RejectEnrolleeBody.safeParse(req.body);
  if (!params.success || !body.success) {
    res.status(400).json({ error: "Invalid request" });
    return;
  }
  const session = getSessionUser(req)!;
  try {
    const [updated] = await db
      .update(enrolleesTable)
      .set({ status: "rejected", notes: body.data.notes ?? undefined })
      .where(eq(enrolleesTable.id, params.data.id))
      .returning();
    if (!updated) {
      res.status(404).json({ error: "Enrollee not found" });
      return;
    }
    await db.insert(activityLogsTable).values({ userId: session.userId, action: "reject_enrollee", description: `Rejected enrollee ${updated.preRegNumber}`, entityType: "enrollee", entityId: updated.id });
    res.json(updated);
  } catch (err) {
    req.log.error(err, "Reject enrollee error");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/enrollees/bulk-approve", requireAuth, requireRole("superadmin", "admin", "staff"), async (req, res) => {
  const parsed = BulkApproveEnrolleesBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid request body" });
    return;
  }
  const session = getSessionUser(req)!;
  const { enrolleeIds } = parsed.data;
  try {
    let approved = 0;
    for (const id of enrolleeIds) {
      const enrollee = await db.query.enrolleesTable.findFirst({ where: eq(enrolleesTable.id, id) });
      if (enrollee && enrollee.status === "pre-registered") {
        await db.update(enrolleesTable).set({ status: "approved", approvedDate: new Date(), approvedBy: session.userId }).where(eq(enrolleesTable.id, id));
        approved++;
      }
    }
    await db.insert(activityLogsTable).values({ userId: session.userId, action: "bulk_approve_enrollees", description: `Bulk approved ${approved} enrollees`, entityType: "enrollee" });
    res.json({ approved, total: enrolleeIds.length });
  } catch (err) {
    req.log.error(err, "Bulk approve error");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
