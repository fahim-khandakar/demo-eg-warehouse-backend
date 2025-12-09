import { z } from "zod";

const create = z.object({
  body: z.object({
    callDate: z.string().optional(),
    caseId: z.string().optional(),
    saidId: z.string().optional(),
    eventNo: z.string().optional(),
    approvalImage: z.string().optional(),
    remarks: z.string({
      required_error: "description is required",
    }),
    parts: z.object({
      partId: z.number({
        required_error: "parts Id is required",
      }),
      qty: z.number({
        required_error: "quantity is required",
      }),
      description: z.string().optional(),
    }),
  }),
});
const approveSchema = z.object({
  body: z.object({
    locationId: z.string().optional(),
    statusId: z.number({
      required_error: "status Id is required",
    }),
  }),
});
const update = z.object({
  body: z.object({
    callDate: z.string().optional(),
    caseId: z.string().optional(),
    saidId: z.string().optional(),
    eventNo: z.string().optional(),
    approvalImage: z.string().optional(),
    remarks: z.string().optional(),
    parts: z
      .object({
        partId: z.number({
          required_error: "parts Id is required",
        }),
        qty: z.number({
          required_error: "quantity is required",
        }),
        description: z.string({
          required_error: "description is required",
        }),
      })
      .optional(),
  }),
});

export const orderRequestValidation = {
  create,
  update,
  approveSchema,
};
