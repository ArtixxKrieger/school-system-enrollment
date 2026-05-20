import { pgTable, serial, integer, timestamp, text } from "drizzle-orm/pg-core";
import { coursesTable } from "./courses.js";

export const courseEnrollmentScheduleTable = pgTable("course_enrollment_schedule", {
  id: serial("id").primaryKey(),
  courseId: integer("course_id").notNull().references(() => coursesTable.id, { onDelete: "cascade" }),
  enrollmentStartDate: timestamp("enrollment_start_date", { withTimezone: true }).notNull(),
  enrollmentEndDate: timestamp("enrollment_end_date", { withTimezone: true }).notNull(),
  maxSlots: integer("max_slots"),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export type CourseEnrollmentSchedule = typeof courseEnrollmentScheduleTable.$inferSelect;
