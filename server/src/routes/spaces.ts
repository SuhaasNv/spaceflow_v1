import { Router, Response } from "express";
import { z } from "zod";
import { SpaceType, Prisma } from "@prisma/client";
import { prisma } from "../lib/prisma.js";
import { authenticate, requireAdmin, requireAdminOrFM, AuthRequest } from "../middleware/auth.js";

const router = Router();

const createSpaceSchema = z.object({
  name: z.string().min(1).max(200).trim(),
  type: z.nativeEnum(SpaceType),
  floor: z.string().max(50).optional(),
  building: z.string().max(100).optional(),
  capacity: z.number().int().min(1).max(10000),
  metadata: z.record(z.unknown()).optional(),
});

const updateSpaceSchema = createSpaceSchema.partial().extend({
  isActive: z.boolean().optional(),
});

// GET /api/spaces
router.get("/", authenticate, async (req: AuthRequest, res: Response) => {
  const { type, floor, building, active } = req.query;

  const spaces = await prisma.space.findMany({
    where: {
      isActive: active === "false" ? false : true,
      ...(type ? { type: type as SpaceType } : {}),
      ...(floor ? { floor: String(floor) } : {}),
      ...(building ? { building: String(building) } : {}),
    },
    orderBy: [{ building: "asc" }, { floor: "asc" }, { name: "asc" }],
  });

  res.json({ spaces });
});

// GET /api/spaces/:id
router.get("/:id", authenticate, async (req: AuthRequest, res: Response) => {
  const space = await prisma.space.findUnique({ where: { id: String(req.params["id"]) } });
  if (!space) {
    res.status(404).json({ error: "Space not found" });
    return;
  }
  res.json({ space });
});

// POST /api/spaces
router.post("/", authenticate, requireAdminOrFM, async (req: AuthRequest, res: Response) => {
  const body = createSpaceSchema.parse(req.body);
  const space = await prisma.space.create({
    data: {
      ...body,
      metadata: body.metadata as Prisma.InputJsonValue | undefined,
    },
  });
  res.status(201).json({ space });
});

// PATCH /api/spaces/:id
router.patch("/:id", authenticate, requireAdminOrFM, async (req: AuthRequest, res: Response) => {
  const id = String(req.params["id"]);
  const space = await prisma.space.findUnique({ where: { id } });
  if (!space) {
    res.status(404).json({ error: "Space not found" });
    return;
  }
  const body = updateSpaceSchema.parse(req.body);
  const updated = await prisma.space.update({
    where: { id },
    data: {
      ...body,
      metadata: body.metadata as Prisma.InputJsonValue | undefined,
    },
  });
  res.json({ space: updated });
});

// DELETE /api/spaces/:id
router.delete("/:id", authenticate, requireAdminOrFM, async (req: AuthRequest, res: Response) => {
  const id = String(req.params["id"]);
  const space = await prisma.space.findUnique({ where: { id } });
  if (!space) {
    res.status(404).json({ error: "Space not found" });
    return;
  }
  // Soft-delete
  const updated = await prisma.space.update({
    where: { id },
    data: { isActive: false },
  });
  res.json({ space: updated });
});

export default router;
