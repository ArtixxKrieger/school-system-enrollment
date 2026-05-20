import { Router, type IRouter } from "express";
import { db, vouchersTable, usersTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";
import { requireAuth, requireRole } from "../lib/auth";
import { getSessionUser } from "../lib/session";

const router: IRouter = Router();

function generateVoucherCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 12; i++) {
    if (i > 0 && i % 4 === 0) code += "-";
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

router.get("/vouchers", requireAuth, requireRole("superadmin", "admin"), async (req, res) => {
  try {
    const vouchers = await db
      .select({
        id: vouchersTable.id,
        code: vouchersTable.code,
        isUsed: vouchersTable.isUsed,
        usedBy: vouchersTable.usedBy,
        notes: vouchersTable.notes,
        expiresAt: vouchersTable.expiresAt,
        createdAt: vouchersTable.createdAt,
        createdBy: vouchersTable.createdBy,
        createdByName: usersTable.fullName,
      })
      .from(vouchersTable)
      .leftJoin(usersTable, eq(vouchersTable.createdBy, usersTable.id))
      .orderBy(desc(vouchersTable.createdAt));

    res.json(vouchers);
  } catch (err) {
    req.log.error(err, "List vouchers error");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/vouchers", requireAuth, requireRole("superadmin", "admin"), async (req, res) => {
  const session = getSessionUser(req);
  const { count = 1, notes, expiresAt } = req.body as { count?: number; notes?: string; expiresAt?: string };

  const batchCount = Math.min(Math.max(1, Number(count) || 1), 50);

  try {
    const newVouchers = [];
    for (let i = 0; i < batchCount; i++) {
      let code: string;
      let attempts = 0;
      do {
        code = generateVoucherCode();
        attempts++;
        if (attempts > 20) break;
        const existing = await db.query.vouchersTable.findFirst({ where: eq(vouchersTable.code, code) });
        if (!existing) break;
      } while (true);

      newVouchers.push({
        code: code!,
        createdBy: session?.userId ?? null,
        notes: notes ?? null,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
      });
    }

    const created = await db.insert(vouchersTable).values(newVouchers).returning();
    res.status(201).json(created);
  } catch (err) {
    req.log.error(err, "Generate voucher error");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/vouchers/validate", async (req, res) => {
  const { code } = req.body as { code?: string };
  if (!code) {
    res.status(400).json({ valid: false, error: "Voucher code is required" });
    return;
  }

  try {
    const voucher = await db.query.vouchersTable.findFirst({
      where: eq(vouchersTable.code, code.trim().toUpperCase()),
    });

    if (!voucher) {
      res.status(400).json({ valid: false, error: "Invalid voucher code" });
      return;
    }
    if (voucher.isUsed) {
      res.status(400).json({ valid: false, error: "Voucher has already been used" });
      return;
    }
    if (voucher.expiresAt && new Date() > voucher.expiresAt) {
      res.status(400).json({ valid: false, error: "Voucher has expired" });
      return;
    }

    res.json({ valid: true, voucherId: voucher.id });
  } catch (err) {
    req.log.error(err, "Validate voucher error");
    res.status(500).json({ valid: false, error: "Internal server error" });
  }
});

router.delete("/vouchers/:id", requireAuth, requireRole("superadmin", "admin"), async (req, res) => {
  const id = Number(req.params.id);
  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid voucher id" });
    return;
  }
  try {
    const [deleted] = await db.delete(vouchersTable).where(eq(vouchersTable.id, id)).returning();
    if (!deleted) {
      res.status(404).json({ error: "Voucher not found" });
      return;
    }
    res.json({ ok: true });
  } catch (err) {
    req.log.error(err, "Delete voucher error");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
