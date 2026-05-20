import { pgTable, text, serial, timestamp, boolean, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { coursesTable } from "./courses.js";
import { usersTable } from "./users.js";

export const curriculumTable = pgTable("curriculum", {
  id: serial("id").primaryKey(),
  courseId: integer("course_id").notNull().references(() => coursesTable.id, { onDelete: "cascade" }),
  subjectCode: text("subject_code").notNull(),
  subjectName: text("subject_name").notNull(),
  yearLevel: integer("year_level").notNull(),
  semester: integer("semester").notNull(),
  units: integer("units").notNull().default(3),
  description: text("description"),
  prerequisites: text("prerequisites"),
  professorId: integer("professor_id").references(() => usersTable.id, { onDelete: "set null" }),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertCurriculumSchema = createInsertSchema(curriculumTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertCurriculum = z.infer<typeof insertCurriculumSchema>;
export type Curriculum = typeof curriculumTable.$inferSelect;
