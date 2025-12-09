import z from "zod";

const create = z.object({
  body: z.object({
    hawbNo: z.string({
      required_error: "hawb no is required",
    }),
    remarks: z.string().optional(),
    items: z.array(
      z.object({
        eventId: z.number({
          required_error: "Event ID is required",
        }),
        remarks: z.string().optional(),
      }),
    ),
  }),
});

const idsSchema = z.object({
  body: z.object({
    ids: z.array(z.number(), {
      required_error: "IDs are required",
    }),
  }),
});

export const badBufferValidation = {
  create,
  idsSchema,
};
