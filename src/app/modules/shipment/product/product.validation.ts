import z from "zod";

const update = z.object({
  body: z.object({
    name: z.string().optional(),
    hsCode: z.string().optional(),
    quantity: z.number().optional(),
  }),
});

export const ProductValidation = {
  update,
};
