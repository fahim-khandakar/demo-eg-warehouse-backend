import { z } from "zod";

const create = z.object({
  body: z.object({
    contact_person: z
      .string({
        required_error: " person name is required",
      })
      .min(2, "Contact person name must be at least 2 characters long")
      .max(50, "Contact person name cannot exceed 50 characters"),

    email: z
      .string({
        required_error: "email is required",
      })
      .email(),

    company: z
      .string()
      .min(2, "Company name must be at least 2 characters long")
      .max(100, "Company name cannot exceed 100 characters"),
    profileImage: z.string({
      required_error: "Profile Image required",
    }),
    contactNo: z
      .string()
      .regex(
        /^01\d{9}$/,
        "Contact number must be 11 digits and start with '01'",
      ),
    password: z
      .string({
        required_error: "Password is required",
      })
      .min(6, "Password must be at least 6 characters long")
      .max(20, "Password must not exceed 20 characters"),
  }),
});

const createShipTo = z.object({
  body: z.object({
    email: z
      .string({
        required_error: "email is required",
      })
      .email(),
    company: z.string({
      required_error: "company is required",
    }),
    contactNo: z.string({
      required_error: "contact no. is required",
    }),
    fax: z.string().optional(),
    address: z.string({
      required_error: "address is required",
    }),
  }),
});

const update = z.object({
  body: z.object({
    contact_person: z
      .string()
      .min(2, "Contact person name must be at least 2 characters long")
      .max(50, "Contact person name cannot exceed 50 characters")
      .optional(),

    company: z
      .string()
      .min(2, "Company name must be at least 2 characters long")
      .max(100, "Company name cannot exceed 100 characters")
      .optional(),
    profileImage: z.string().optional(),
    contactNo: z
      .string()
      .regex(
        /^01\d{9}$/,
        "Contact number must be 11 digits and start with '01'",
      )
      .optional(),
  }),
});

export const partnerValidation = {
  create,
  update,
  createShipTo,
};
