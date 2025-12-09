import z from "zod";

const create = z.object({
  body: z.object({
    shipmentId: z.number({
      required_error: "shipment Id is require",
    }),
    partnerId: z.number({
      required_error: "partner id is required",
    }),
    eventNo: z.string({
      required_error: "event no. is required",
    }),
    part: z.string({
      required_error: "Part no is required",
    }),
    hsCode: z
      .string({
        required_error: "HS Code is required",
      })
      .optional(),
    quantity: z.number({
      required_error: "quantity is required",
    }),
    value: z.number({
      required_error: "value is required",
    }),
    description: z.string().optional(),
    btrc: z.boolean({
      required_error: "BTRC is required",
    }),
    weight: z.number({
      required_error: "weight is required",
    }),
    dimensionL: z.number({
      required_error: "dimension length is required",
    }),
    dimensionH: z.number({
      required_error: "dimension height is required",
    }),
    dimensionW: z.number({
      required_error: "dimension width is required",
    }),
    coo: z.string({
      required_error: "Country of origin is required",
    }),
    boxNo: z.string({
      required_error: " boxNo is required",
    }),
    height: z
      .number({
        required_error: "height is required",
      })
      .positive(),
    boxWeight: z
      .number({
        required_error: "box weight is required",
      })
      .positive(),
    boxWidth: z
      .number({
        required_error: "box width is required",
      })
      .positive(),
    length: z
      .number({
        required_error: "length is required",
      })
      .positive(),
  }),
});

const update = z.object({
  body: z.object({
    productId: z.number().optional(),
    shipmentId: z.number().optional(),
    eventNo: z.string().optional(),
    description: z.string().optional(),
    boxId: z.number().optional(),
    btrc: z.boolean().optional(),
    value: z.number().optional(),
    weight: z.number().optional(),
    dimensionL: z.number().optional(),
    dimensionW: z.number().optional(),
    dimensionH: z.number().optional(),
    coo: z.string().optional(),
    partnerId: z.number().optional(),
    receiptId: z.number().optional(),
  }),
});

export const EventValidation = {
  create,
  update,
};
