import { pgTable, text, serial, timestamp, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { coursesTable } from "./courses";
import { usersTable } from "./users";

export const enrolleesTable = pgTable("enrollees", {
  id: serial("id").primaryKey(),
  preRegNumber: text("pre_reg_number").notNull().unique(),
  existingStudentId: text("existing_student_id"),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  middleName: text("middle_name"),
  email: text("email").notNull().unique(),
  phone: text("phone"),
  guardianContact: text("guardian_contact"),
  fbName: text("fb_name"),
  address: text("address"),
  birthDate: text("birth_date"),
  gender: text("gender"),
  passwordHash: text("password_hash"),
  courseId: integer("course_id").references(() => coursesTable.id, { onDelete: "set null" }),
  yearLevel: integer("year_level").notNull().default(1),
  status: text("status").notNull().default("pre-registered"),
  enrollmentType: text("enrollment_type").notNull().default("new"),
  applicationDate: timestamp("application_date", { withTimezone: true }).notNull().defaultNow(),
  approvedDate: timestamp("approved_date", { withTimezone: true }),
  approvedBy: integer("approved_by").references(() => usersTable.id, { onDelete: "set null" }),
  notes: text("notes"),
});

export const insertEnrolleeSchema = createInsertSchema(enrolleesTable).omit({ id: true, applicationDate: true });
export type InsertEnrollee = z.infer<typeof insertEnrolleeSchema>;
export type Enrollee = typeof enrolleesTable.$inferSelect;
