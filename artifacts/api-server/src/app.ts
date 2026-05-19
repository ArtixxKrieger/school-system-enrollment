import express, { type Express } from "express";
import cors from "cors";
import session from "express-session";
import connectPgSimple from "connect-pg-simple";
import pinoHttp from "pino-http";
import path from "node:path";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import bcryptjs from "bcryptjs";
import router from "./routes";
import { logger } from "./lib/logger";
import { pool, db } from "@workspace/db";

const PgSession = connectPgSimple(session);

const app: Express = express();

// Run migrations on cold start — safe to run every time, drizzle tracks what's applied
export const migrationReady: Promise<void> = (async () => {
  try {
    const migrationsFolder = path.join(__dirname, "../../../lib/db/drizzle");
    await migrate(db, { migrationsFolder });
    logger.info("Migrations applied");

    const result = await pool.query(
      "SELECT id FROM users WHERE role = 'admin' LIMIT 1"
    );
    if (result.rows.length === 0) {
      const password = process.env.ADMIN_DEFAULT_PASSWORD ?? "Admin@123";
      const hashed = await bcryptjs.hash(password, 12);
      await pool.query(
        `INSERT INTO users (username, password, email, full_name, role, is_active)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        ["admin", hashed, "admin@kurios.local", "System Administrator", "admin", true]
      );
      logger.info("Admin account created — change password after first login");
    }
  } catch (err: any) {
    logger.error({ err: err.message }, "Migration error");
  }
})();

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);

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
