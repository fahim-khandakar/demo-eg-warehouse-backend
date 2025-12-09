import z from "zod";

const create = z.object({
  body: z.object({
    name: z.string({
      required_error: "name is required",
    }),
    email: z
      .string({
        required_error: "email is required",
      })
      .email(),
    contactNo: z.string({
      required_error: "contact no. is required",
    }),
    designation: z.string().optional(),
    profileImage: z.string({
      required_error: "image is required",
    }),
    branchId: z.number().optional(),
    powerId: z.array(z.number()),
    password: z.string().optional(),
  }),
});
const createPower = z.object({
  body: z.object({
    name: z.string({
      required_error: "name is required",
    }),
  }),
});

const update = z.object({
  body: z.object({
    name: z.string().optional(),
    email: z.string().optional(),
    designation: z.string().optional(),
    contactNo: z.string().optional(),
    role: z.string().optional(),
    profileImage: z.string().optional(),
    branchId: z.number().optional(),
  }),
});

export const userValidation = {
  create,
  createPower,
  update,
};
