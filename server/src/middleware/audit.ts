import { Request, Response, NextFunction } from "express";
import { prisma } from "../lib/prisma.js";
import { AuthRequest } from "./auth.js";

export function auditLogger(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void {
  const start = Date.now();

  res.on("finish", () => {
    const durationMs = Date.now() - start;
    const userId = req.user?.userId ?? null;

    // Fire-and-forget, don't block response
    prisma.apiAuditLog
      .create({
        data: {
          userId,
          method: req.method,
          path: req.path,
          statusCode: res.statusCode,
          ip: req.ip ?? req.socket.remoteAddress ?? null,
          userAgent: req.headers["user-agent"] ?? null,
          durationMs,
        },
      })
      .catch(() => {
        // Silently ignore audit logging failures
      });
  });

  next();
}
