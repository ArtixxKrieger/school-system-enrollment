import express, { type Express } from "express";
import cors from "cors";
import session from "express-session";
import connectPgSimple from "connect-pg-simple";
import bcryptjs from "bcryptjs";
import router from "./routes";
import { logger } from "./lib/logger";
import { pool } from "@workspace/db";

const PgSession = connectPgSimple(session);

const app: Express = express();

// Each entry is run as a separate query so a failure pinpoints exactly which statement broke.
const INIT_STATEMENTS = [
  `CREATE TABLE IF NOT EXISTS "permission_modules" (
    "id" serial PRIMARY KEY NOT NULL,
    "module_slug" text NOT NULL,
    "module_name" text NOT NULL,
    "description" text,
    "created_at" timestamp with time zone DEFAULT now() NOT NULL
  )`,
  `DO $$ BEGIN ALTER TABLE "permission_modules" ADD CONSTRAINT "permission_modules_module_slug_unique" UNIQUE("module_slug"); EXCEPTION WHEN duplicate_object THEN NULL; END $$`,
  `CREATE TABLE IF NOT EXISTS "roles" (
    "id" serial PRIMARY KEY NOT NULL,
    "name" text NOT NULL,
    "description" text,
    "is_system" boolean DEFAULT false NOT NULL,
    "is_active" boolean DEFAULT true NOT NULL,
    "created_at" timestamp with time zone DEFAULT now() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT now() NOT NULL
  )`,
  `DO $$ BEGIN ALTER TABLE "roles" ADD CONSTRAINT "roles_name_unique" UNIQUE("name"); EXCEPTION WHEN duplicate_object THEN NULL; END $$`,
  `CREATE TABLE IF NOT EXISTS "role_permissions" (
    "id" serial PRIMARY KEY NOT NULL,
    "role_id" integer NOT NULL,
    "permission_module_slug" text NOT NULL,
    "action" text NOT NULL,
    "is_allowed" boolean DEFAULT true NOT NULL,
    "created_at" timestamp with time zone DEFAULT now() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT now() NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS "users" (
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
    "updated_at" timestamp with time zone DEFAULT now() NOT NULL
  )`,
  `DO $$ BEGIN ALTER TABLE "users" ADD CONSTRAINT "users_username_unique" UNIQUE("username"); EXCEPTION WHEN duplicate_object THEN NULL; END $$`,
  `DO $$ BEGIN ALTER TABLE "users" ADD CONSTRAINT "users_email_unique" UNIQUE("email"); EXCEPTION WHEN duplicate_object THEN NULL; END $$`,
  `CREATE TABLE IF NOT EXISTS "courses" (
    "id" serial PRIMARY KEY NOT NULL,
    "course_code" text NOT NULL,
    "course_name" text NOT NULL,
    "description" text,
    "is_active" boolean DEFAULT true NOT NULL,
    "display_order" integer DEFAULT 0 NOT NULL,
    "created_at" timestamp with time zone DEFAULT now() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT now() NOT NULL
  )`,
  `DO $$ BEGIN ALTER TABLE "courses" ADD CONSTRAINT "courses_course_code_unique" UNIQUE("course_code"); EXCEPTION WHEN duplicate_object THEN NULL; END $$`,
  `CREATE TABLE IF NOT EXISTS "enrollees" (
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
    "notes" text
  )`,
  `DO $$ BEGIN ALTER TABLE "enrollees" ADD CONSTRAINT "enrollees_pre_reg_number_unique" UNIQUE("pre_reg_number"); EXCEPTION WHEN duplicate_object THEN NULL; END $$`,
  `DO $$ BEGIN ALTER TABLE "enrollees" ADD CONSTRAINT "enrollees_email_unique" UNIQUE("email"); EXCEPTION WHEN duplicate_object THEN NULL; END $$`,
  `CREATE TABLE IF NOT EXISTS "students" (
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
    "progression_status" text DEFAULT 'enrolled' NOT NULL
  )`,
  `DO $$ BEGIN ALTER TABLE "students" ADD CONSTRAINT "students_student_id_unique" UNIQUE("student_id"); EXCEPTION WHEN duplicate_object THEN NULL; END $$`,
  `DO $$ BEGIN ALTER TABLE "students" ADD CONSTRAINT "students_email_unique" UNIQUE("email"); EXCEPTION WHEN duplicate_object THEN NULL; END $$`,
  `CREATE TABLE IF NOT EXISTS "curriculum" (
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
  `CREATE TABLE IF NOT EXISTS "activity_logs" (
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
  `CREATE TABLE IF NOT EXISTS "enrollment_settings" (
    "id" serial PRIMARY KEY NOT NULL,
    "auto_close_accounts" text DEFAULT 'never' NOT NULL,
    "strict_enrollment_windows" boolean DEFAULT false NOT NULL,
    "auto_progression" boolean DEFAULT true NOT NULL,
    "created_at" timestamp with time zone DEFAULT now() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT now() NOT NULL
  )`,
  `ALTER TABLE "enrollment_settings" ADD COLUMN IF NOT EXISTS "enrollment_open" boolean DEFAULT true NOT NULL`,
  `ALTER TABLE "enrollment_settings" ADD COLUMN IF NOT EXISTS "system_close_date" timestamp with time zone`,
  `CREATE TABLE IF NOT EXISTS "vouchers" (
    "id" serial PRIMARY KEY NOT NULL,
    "code" text NOT NULL,
    "is_used" boolean DEFAULT false NOT NULL,
    "used_by" integer,
    "created_by" integer,
    "notes" text,
    "expires_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT now() NOT NULL
  )`,
  `DO $$ BEGIN ALTER TABLE "vouchers" ADD CONSTRAINT "vouchers_code_unique" UNIQUE("code"); EXCEPTION WHEN duplicate_object THEN NULL; END $$`,
  `CREATE TABLE IF NOT EXISTS "course_enrollment_schedule" (
    "id" serial PRIMARY KEY NOT NULL,
    "course_id" integer NOT NULL,
    "enrollment_start_date" timestamp with time zone NOT NULL,
    "enrollment_end_date" timestamp with time zone NOT NULL,
    "max_slots" integer,
    "notes" text,
    "created_at" timestamp with time zone DEFAULT now() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT now() NOT NULL
  )`,
];

// Run on every cold start — all statements are idempotent (IF NOT EXISTS / DO blocks).
export const migrationReady: Promise<void> = (async () => {
  for (const sql of INIT_STATEMENTS) {
    await pool.query(sql);
  }
  logger.info("Schema ready");

  const { rows } = await pool.query(
    "SELECT id FROM users WHERE username = 'admin' LIMIT 1"
  );
  if (rows.length === 0) {
    const password = process.env.ADMIN_DEFAULT_PASSWORD ?? "Admin@123";
    const hashed = await bcryptjs.hash(password, 12);
    await pool.query(
      `INSERT INTO users (username, password, email, full_name, role, is_active)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (username) DO NOTHING`,
      ["admin", hashed, "admin@kurios.local", "System Administrator", "admin", true]
    );
    logger.info("Default admin account created. CHANGE THE PASSWORD after first login.");
  }
})();

app.use(
  cors({
    origin: process.env.CORS_ORIGIN ?? true,
    credentials: true,
  }),
);

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

const isProduction = process.env.NODE_ENV === "production";

app.use(
  session({
    store: new PgSession({
      pool,
      tableName: "session",
      createTableIfMissing: true,
    }),
    secret: process.env.SESSION_SECRET ?? "kurios-enrollment-secret",
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: isProduction,
      httpOnly: true,
      sameSite: isProduction ? "none" : "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    },
  }),
);

app.use("/api", router);

export default app;
