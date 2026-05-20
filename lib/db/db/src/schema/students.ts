import { pgTable, text, serial, timestamp, boolean, integer, numeric } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { coursesTable } from "./courses.js";

export const studentsTable = pgTable("students", {
  id: serial("id").primaryKey(),
  studentId: text("student_id").notNull().unique(),
  preRegNumber: text("pre_reg_number"),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  middleName: text("middle_name"),
  email: text("email").notNull().unique(),
  phone: text("phone"),
  guardianContact: text("guardian_contact"),
  fbName: text("fb_name"),
  address: text("address"),
  profilePhoto: text("profile_photo"),
  birthDate: text("birth_date"),
  gender: text("gender"),
  courseId: integer("course_id").notNull().references(() => coursesTable.id, { onDelete: "restrict" }),
  yearLevel: integer("year_level").notNull().default(1),
  enrollmentDate: timestamp("enrollment_date", { withTimezone: true }).notNull().defaultNow(),
  financeStatus: text("finance_status").notNull().default("fully_paid"),
  financeTotal: numeric("finance_total", { precision: 10, scale: 2 }).notNull().default("0.00"),
  financePaid: numeric("finance_paid", { precision: 10, scale: 2 }).notNull().default("0.00"),
  studentType: text("student_type").notNull().default("regular"),
  status: text("status").notNull().default("active"),
  gpa: numeric("gpa", { precision: 3, scale: 2 }).default("0.00"),
  currentSemester: integer("current_semester").notNull().default(1),
  currentAcademicYear: text("current_academic_year"),
  batchNumber: text("batch_number"),
  graduatedAt: timestamp("graduated_at", { withTimezone: true }),
  archivedAt: timestamp("archived_at", { withTimezone: true }),
  archiveReason: text("archive_reason"),
  flagGroup: text("flag_group"),
  isAccountActive: boolean("is_account_active").notNull().default(true),
  progressionStatus: text("progression_status").notNull().default("enrolled"),
});

export const insertStudentSchema = createInsertSchema(studentsTable).omit({ id: true, enrollmentDate: true });
export type InsertStudent = z.infer<typeof insertStudentSchema>;
export type Student = typeof studentsTable.$inferSelect;
