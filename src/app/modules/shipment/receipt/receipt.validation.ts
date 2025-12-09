import z from "zod";

const create = z.object({
  body: z.object({
    eventIds: z
      .array(z.number().int().positive())
      .nonempty("At least one event must be selected."),
  }),
});

export const ReceiptValidation = {
  create,
};
