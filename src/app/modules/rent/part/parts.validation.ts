import { z } from "zod";
const create = z.object({
  body: z.object({
    name: z.string({
      required_error: "name is required",
    }),
    alternatePartName: z.string().optional(),
    alternatePartNametwo: z.string().optional(),
    description: z.string().optional(),
  }),
});
const update = z.object({
  body: z.object({
    name: z.string().optional(),
    alternatePartName: z.string().optional(),
    alternatePartNametwo: z.string().optional(),
    description: z.string().optional(),
  }),
});

const createMany = z.object({
  body: z.array(
    z.object({
      name: z.string({
        required_error: "name is required",
      }),
      alternatePartName: z.string().optional(),
      alternatePartNametwo: z.string().optional(),
      description: z.string().optional(),
    }),
  ),
});

export const partsValidation = {
  create,
  createMany,
  update,
};
