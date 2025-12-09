import { z } from "zod";

const create = z.object({
  body: z.object({
    name: z.string({
      required_error: "part name is required",
    }),
    alternatePartName: z.string().optional(),
    description: z.string().optional(),
    remarks: z.string().optional(),
    qty: z.number().positive(),
    location: z.number().positive(),
    eventNo: z.string({
      required_error: "event no. is required",
    }),
  }),
});

const createMultiple = z.object({
  body: z.array(
    z.object({
      name: z
        .string({
          required_error: "Part name is required",
        })
        .trim(),
      eventNo: z.string().optional(),
      remarks: z.string().optional(),
      qty: z.number().positive(),
      rack: z.string().trim(),
    }),
  ),
});

const update = z.object({
  body: z.object({
    partId: z.number({
      required_error: "part id is required",
    }),
    locationId: z.number({
      required_error: "location id is required",
    }),
    qty: z
      .number({
        required_error: "qty is required",
      })
      .positive(),
    remarks: z.string().optional(),
  }),
});

const StockUpdate = z.object({
  body: z.object({
    addedQty: z.number({
      required_error: "qty is required",
    }),
  }),
});
export const inventoryValidation = {
  create,
  createMultiple,
  update,
  StockUpdate,
};
