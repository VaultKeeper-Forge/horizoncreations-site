import { z } from "zod";

export const cartSchema = z.object({
  productId: z.string().min(1),
  quantity: z.number().int().min(1).max(10).default(1),
});

export const inventoryPrepareSchema = z.object({
  productId: z.string().min(1),
  delta: z.number().int().min(-100).max(100).refine((value) => value !== 0, "delta must not be zero"),
  expectedVersion: z.number().int().positive(),
});

export const approvalSchema = z.object({ approvalId: z.string().min(1) });

export const inventoryExecuteSchema = inventoryPrepareSchema.extend({
  approvalId: z.string().min(1),
  idempotencyKey: z.string().min(12).max(160),
});
