import { z } from "zod";

const create = z.object({
  body: z.object({
    callDate: z.string().optional(),
    caseId: z.string().optional(),
    saidId: z.string().optional(),
    eventNo: z.string().optional(),
    approvalImage: z.string().optional(),
    locationId: z.number({
      required_error: "location Id is required",
    }),
    partnerId: z.number({
      required_error: "partner Id is required",
    }),
    parts: z.object({
      partId: z.number({
        required_error: "parts Id is required",
      }),
      qty: z.number({
        required_error: "quantity is required",
      }),
      poll: z.string({
        required_error: "poll is required",
      }),
      description: z.string().optional(),
    }),
  }),
});
const update = z.object({
  body: z.object({
    callDate: z.string().optional(),
    caseId: z.string().optional(),
    saidId: z.string().optional(),
    locationId: z.number().optional(),
    partnerId: z.number().optional(),
    eventNo: z.string().optional(),
    approvalImage: z.string().optional(),
    parts: z
      .object({
        partId: z.number({
          required_error: "parts Id is required",
        }),
        qty: z.number({
          required_error: "quantity is required",
        }),
        poll: z.string(),
        description: z.string().optional(),
      })
      .optional(),
  }),
});

export const orderValidation = {
  create,
  update,
};
