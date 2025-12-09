import { z } from "zod";

export const shipmentTypeSchema = z.enum([
  "DEFAULT",
  "INBOUND",
  "FORWARD",
  "Completed",
  "RETURN",
  "CANCELLED",
]);

const create = z.object({
  body: z.object({
    shipToId: z.number({
      required_error: "ship to is required",
    }),
    sendBy: z.string({
      required_error: "send by name is required",
    }),
    control: z.string({
      required_error: "control no. is required",
    }),
    hawb: z.string().optional(),
    invoiceValue: z.number({
      required_error: "invoice value is required",
    }),
    events: z.array(
      z.object({
        partnerId: z.number({
          required_error: "partner id is required",
        }),
        eventNo: z.string({
          required_error: "event no. is required",
        }),
        part: z.string({
          required_error: "Part name is required",
        }),
        hsCode: z.string({
          required_error: "HS Code is required",
        }),
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
    ),
  }),
});

const createPODReturn = z.object({
  body: z.object({
    shipToId: z.number({
      required_error: "send to is required",
    }),
    sendBy: z.string({
      required_error: "send by name is required",
    }),
    control: z.string({
      required_error: "control no. is required",
    }),
    hawb: z.string().optional(),
    type: shipmentTypeSchema,
    events: z.array(
      z.object({
        partnerId: z.number({
          required_error: "partner id is required",
        }),
        eventNo: z.string({
          required_error: "event no. is required",
        }),
        part: z.number({
          required_error: "Part Id is required",
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
    ),
  }),
});

const createByFile = z.object({
  body: z.object({
    shipTo: z.string({
      required_error: "send to is required",
    }),
    sendBy: z.string({
      required_error: "send by name is required",
    }),
    control: z.string({
      required_error: "control no. is required",
    }),
    hawb: z.string().optional(),
    invoiceValue: z.number({
      required_error: "invoice value is required",
    }),
    events: z.array(
      z.object({
        partner: z
          .string({
            required_error: "company is required",
          })
          .trim(),
        eventNo: z.string({
          required_error: "event no. is required",
        }),
        part: z.string({
          required_error: "Part name is required",
        }),
        hsCode: z.string({
          required_error: "HS Code is required",
        }),
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
        boxNo: z.string({
          required_error: " boxNo is required",
        }),
        height: z
          .number({
            required_error: "height is required",
          })
          .positive(),
        length: z
          .number({
            required_error: "length is required",
          })
          .positive(),
        weight: z.number({
          required_error: "weight is required",
        }),
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
      }),
    ),
  }),
});

const ShipmentUpdateEventSchema = z.object({
  id: z.number(),
  eventNo: z.string(),
  description: z.string().optional(),
  value: z.number().optional(),
  weight: z.number().optional(),
  dimensionL: z.number().optional(),
  dimensionW: z.number().optional(),
  dimensionH: z.number().optional(),
  coo: z.string().optional(),
  partnerId: z.number().optional(),
  productId: z.number(),
  boxId: z.number().optional(),
  statusId: z.number().optional(),
});

const update = z.object({
  body: z.object({
    statusId: z.number().optional(),
    type: shipmentTypeSchema.optional(),
    control: z.string().optional(),
    sendBy: z.string().optional(),
    hawb: z.string().optional(),
    invoiceValue: z.number().optional(),
    totalValue: z.number().optional(),
    totalWeight: z.number().optional(),
    totalQuantity: z.number().optional(),
    events: z.array(ShipmentUpdateEventSchema).optional(),
  }),
});

export const shipmentValidation = {
  create,
  createByFile,
  createPODReturn,
  update,
};
