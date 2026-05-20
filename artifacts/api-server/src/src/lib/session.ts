import type { Request } from "express";
import type { User } from "@workspace/db";

declare module "express-session" {
  interface SessionData {
    userId: number;
    userRole: string;
    version?: number;
  }
}

export function getSessionUser(req: Request): { userId: number; userRole: string } | null {
  if (!req.session.userId) return null;
  return { userId: req.session.userId, userRole: req.session.userRole ?? "staff" };
}

export function setSessionUser(req: Request, user: User): void {
  req.session.userId = user.id;
  req.session.userRole = user.role;
}

export function clearSession(req: Request): Promise<void> {
  return new Promise((resolve, reject) => {
    req.session.destroy((err) => {
      if (err) reject(err);
      else resolve();
    });
  });
}
