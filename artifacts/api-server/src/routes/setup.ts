import { Router } from "express";
import pg from "pg";
import bcrypt from "bcryptjs";
import { db, usersTable, enrollmentSettingsTable } from "@workspace/db";
import { count, eq } from "drizzle-orm";

const router = Router();
const { Pool } = pg;

// Inlined migration SQL — keeps the serverless function self-contained
const MIGRATION_STATEMENTS = [
  `CREATE TABLE "permission_modules" (
    "id" serial PRIMARY KEY NOT NULL,
    "module_slug" text NOT NULL,
    "module_name" text NOT NULL,
    "description" text,
    "created_at" timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT "permission_modules_module_slug_unique" UNIQUE("module_slug")
  )`,
  `CREATE TABLE "role_permissions" (
    "id" serial PRIMARY KEY NOT NULL,
    "role_id" integer NOT NULL,
    "permission_module_slug" text NOT NULL,
    "action" text NOT NULL,
    "is_allowed" boolean DEFAULT true NOT NULL,
    "created_at" timestamp with time zone DEFAULT now() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT now() NOT NULL
  )`,
  `CREATE TABLE "roles" (
    "id" serial PRIMARY KEY NOT NULL,
    "name" text NOT NULL,
    "description" text,
    "is_system" boolean DEFAULT false NOT NULL,
    "is_active" boolean DEFAULT true NOT NULL,
    "created_at" timestamp with time zone DEFAULT now() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT "roles_name_unique" UNIQUE("name")
  )`,
  `CREATE TABLE "users" (
    "id" serial PRIMARY KEY NOT NULL,
    "username" text NOT NULL,
    "password" text NOT NULL,
    "email" text NOT NULL,
    "full_name" text NOT NULL,
    "phone" text,
    "address" text,
    "birth_date" text,
    "gender" text,
    "profile_photo" text,
    "role" text DEFAULT 'staff' NOT NULL,
    "role_id" integer,
    "is_active" boolean DEFAULT true NOT NULL,
    "last_login" timestamp with time zone,
    "session_version" integer,
    "created_at" timestamp with time zone DEFAULT now() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT "users_username_unique" UNIQUE("username"),
    CONSTRAINT "users_email_unique" UNIQUE("email")
  )`,
  `CREATE TABLE "courses" (
    "id" serial PRIMARY KEY NOT NULL,
    "course_code" text NOT NULL,
    "course_name" text NOT NULL,
    "description" text,
    "is_active" boolean DEFAULT true NOT NULL,
    "display_order" integer DEFAULT 0 NOT NULL,
    "created_at" timestamp with time zone DEFAULT now() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT "courses_course_code_unique" UNIQUE("course_code")
  )`,
  `CREATE TABLE "enrollees" (
    "id" serial PRIMARY KEY NOT NULL,
    "pre_reg_number" text NOT NULL,
    "existing_student_id" text,
    "first_name" text NOT NULL,
    "last_name" text NOT NULL,
    "middle_name" text,
    "email" text NOT NULL,
    "phone" text,
    "guardian_contact" text,
    "fb_name" text,
    "address" text,
    "birth_date" text,
    "gender" text,
    "password_hash" text,
    "course_id" integer,
    "year_level" integer DEFAULT 1 NOT NULL,
    "status" text DEFAULT 'pre-registered' NOT NULL,
    "enrollment_type" text DEFAULT 'new' NOT NULL,
    "application_date" timestamp with time zone DEFAULT now() NOT NULL,
    "approved_date" timestamp with time zone,
    "approved_by" integer,
    "notes" text,
    CONSTRAINT "enrollees_pre_reg_number_unique" UNIQUE("pre_reg_number"),
    CONSTRAINT "enrollees_email_unique" UNIQUE("email")
  )`,
  `CREATE TABLE "students" (
    "id" serial PRIMARY KEY NOT NULL,
    "student_id" text NOT NULL,
    "pre_reg_number" text,
    "first_name" text NOT NULL,
    "last_name" text NOT NULL,
    "middle_name" text,
    "email" text NOT NULL,
    "phone" text,
    "guardian_contact" text,
    "fb_name" text,
    "address" text,
    "profile_photo" text,
    "birth_date" text,
    "gender" text,
    "course_id" integer NOT NULL,
    "year_level" integer DEFAULT 1 NOT NULL,
    "enrollment_date" timestamp with time zone DEFAULT now() NOT NULL,
    "finance_status" text DEFAULT 'fully_paid' NOT NULL,
    "finance_total" numeric(10, 2) DEFAULT '0.00' NOT NULL,
    "finance_paid" numeric(10, 2) DEFAULT '0.00' NOT NULL,
    "student_type" text DEFAULT 'regular' NOT NULL,
    "status" text DEFAULT 'active' NOT NULL,
    "gpa" numeric(3, 2) DEFAULT '0.00',
    "current_semester" integer DEFAULT 1 NOT NULL,
    "current_academic_year" text,
    "batch_number" text,
    "graduated_at" timestamp with time zone,
    "archived_at" timestamp with time zone,
    "archive_reason" text,
    "flag_group" text,
    "is_account_active" boolean DEFAULT true NOT NULL,
    "progression_status" text DEFAULT 'enrolled' NOT NULL,
    CONSTRAINT "students_student_id_unique" UNIQUE("student_id"),
    CONSTRAINT "students_email_unique" UNIQUE("email")
  )`,
  `CREATE TABLE "curriculum" (
    "id" serial PRIMARY KEY NOT NULL,
    "course_id" integer NOT NULL,
    "subject_code" text NOT NULL,
    "subject_name" text NOT NULL,
    "year_level" integer NOT NULL,
    "semester" integer NOT NULL,
    "units" integer DEFAULT 3 NOT NULL,
    "description" text,
    "prerequisites" text,
    "professor_id" integer,
    "is_active" boolean DEFAULT true NOT NULL,
    "created_at" timestamp with time zone DEFAULT now() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT now() NOT NULL
  )`,
  `CREATE TABLE "activity_logs" (
    "id" serial PRIMARY KEY NOT NULL,
    "user_id" integer,
    "action" text NOT NULL,
    "description" text,
    "entity_type" text,
    "entity_id" integer,
    "old_value" text,
    "new_value" text,
    "ip_address" text,
    "created_at" timestamp with time zone DEFAULT now() NOT NULL
  )`,
  `CREATE TABLE "enrollment_settings" (
    "id" serial PRIMARY KEY NOT NULL,
    "auto_close_accounts" text DEFAULT 'never' NOT NULL,
    "strict_enrollment_windows" boolean DEFAULT false NOT NULL,
    "auto_progression" boolean DEFAULT true NOT NULL,
    "created_at" timestamp with time zone DEFAULT now() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT now() NOT NULL
  )`,
  `CREATE TABLE "vouchers" (
    "id" serial PRIMARY KEY NOT NULL,
    "code" text NOT NULL,
    "is_used" boolean DEFAULT false NOT NULL,
    "used_by" integer,
    "created_by" integer,
    "notes" text,
    "expires_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT "vouchers_code_unique" UNIQUE("code")
  )`,
  `ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_role_id_roles_id_fk" FOREIGN KEY ("role_id") REFERENCES "public"."roles"("id") ON DELETE cascade ON UPDATE no action`,
  `ALTER TABLE "users" ADD CONSTRAINT "users_role_id_roles_id_fk" FOREIGN KEY ("role_id") REFERENCES "public"."roles"("id") ON DELETE set null ON UPDATE no action`,
  `ALTER TABLE "enrollees" ADD CONSTRAINT "enrollees_course_id_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE set null ON UPDATE no action`,
  `ALTER TABLE "enrollees" ADD CONSTRAINT "enrollees_approved_by_users_id_fk" FOREIGN KEY ("approved_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action`,
  `ALTER TABLE "students" ADD CONSTRAINT "students_course_id_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE restrict ON UPDATE no action`,
  `ALTER TABLE "curriculum" ADD CONSTRAINT "curriculum_course_id_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE cascade ON UPDATE no action`,
  `ALTER TABLE "curriculum" ADD CONSTRAINT "curriculum_professor_id_users_id_fk" FOREIGN KEY ("professor_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action`,
  `ALTER TABLE "activity_logs" ADD CONSTRAINT "activity_logs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action`,
  `ALTER TABLE "vouchers" ADD CONSTRAINT "vouchers_used_by_enrollees_id_fk" FOREIGN KEY ("used_by") REFERENCES "public"."enrollees"("id") ON DELETE set null ON UPDATE no action`,
  `ALTER TABLE "vouchers" ADD CONSTRAINT "vouchers_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action`,
];

router.get("/api/setup", async (req, res) => {
  try {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
      return res.status(500).json({ error: "DATABASE_URL not set" });
    }

    const pool = new Pool({
      connectionString,
      ssl: connectionString.includes("supabase.co")
        ? { rejectUnauthorized: false }
        : undefined,
    });

    let created = 0;
    let skipped = 0;
    for (const statement of MIGRATION_STATEMENTS) {
      try {
        await pool.query(statement);
        created++;
      } catch (err: any) {
        if (
          err.code === "42P07" ||
          err.code === "42710" ||
          err.message?.includes("already exists")
        ) {
          skipped++;
        } else {
          await pool.end();
          return res.status(500).json({ error: err.message, statement: statement.slice(0, 80) });
        }
      }
    }
    await pool.end();

    // Seed admin user
    const [{ value: adminCount }] = await db
      .select({ value: count() })
      .from(usersTable)
      .where(eq(usersTable.role, "admin"));

    let adminCreated = false;
    if (Number(adminCount) === 0) {
      const defaultPassword = process.env["ADMIN_DEFAULT_PASSWORD"] ?? "Admin@123";
      const hashed = await bcrypt.hash(defaultPassword, 12);
      await db.insert(usersTable).values({
        username: "admin",
        password: hashed,
        email: "admin@kurios.local",
        fullName: "System Administrator",
        role: "admin",
        isActive: true,
      });
      adminCreated = true;
    }

    // Seed default enrollment settings
    const [{ value: settingsCount }] = await db
      .select({ value: count() })
      .from(enrollmentSettingsTable);
    if (Number(settingsCount) === 0) {
      await db.insert(enrollmentSettingsTable).values({});
    }

    return res.json({
      ok: true,
      tablesCreated: created,
      tablesSkipped: skipped,
      adminCreated,
      message: adminCreated
        ? "Setup complete! Admin created — username: admin, password: Admin@123. Login now and change the password."
        : "Setup complete. Admin already existed.",
    });
  } catch (err: any) {
    return res.status(500).json({ ok: false, error: err.message ?? "Setup failed" });
  }
});

export default router;
