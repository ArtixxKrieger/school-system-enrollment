import { pgTable, text, serial, timestamp, boolean, integer } from "drizzle-orm/pg-core";
import { usersTable } from "./users.js";
import { enrolleesTable } from "./enrollees.js";

export const vouchersTable = pgTable("vouchers", {
  id: serial("id").primaryKey(),
  code: text("code").notNull().unique(),
  isUsed: boolean("is_used").notNull().default(false),
  usedBy: integer("used_by").references(() => enrolleesTable.id, { onDelete: "set null" }),
  createdBy: integer("created_by").references(() => usersTable.id, { onDelete: "set null" }),
  notes: text("notes"),
  expiresAt: timestamp("expires_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type Voucher = typeof vouchersTable.$inferSelect;
export type InsertVoucher = typeof vouchersTable.$inferInsert;
