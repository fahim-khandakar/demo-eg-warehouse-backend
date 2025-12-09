import { z } from "zod";

const create = z.object({
  body: z.object({
    rack: z
      .string()
      .min(2, "warehouse must be at least 2 characters long")
      .max(20, "warehouse name cannot exceed 50 characters"),
  }),
});

const update = z.object({
  body: z.object({
    rack: z
      .string()
      .min(2, "warehouse must be at least 2 characters long")
      .max(20, "warehouse name cannot exceed 50 characters")
      .optional(),
  }),
});

export const warehouseValidation = {
  create,
  update,
};
