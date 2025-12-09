import { z } from "zod";

const loginZodSchema = z.object({
  body: z.object({
    email: z.string({
      required_error: "email is required",
    }),
    password: z.string({
      required_error: "Password is required",
    }),
  }),
});

const refreshTokenZodSchema = z.object({
  cookies: z.object({
    refreshToken: z.string({
      required_error: "Refresh Token is required",
    }),
  }),
});

const changePasswordZodSchema = z.object({
  body: z.object({
    email: z
      .string({
        required_error: "email  is required",
      })
      .email(),
    newPassword: z.string({
      required_error: "New password  is required",
    }),
  }),
});
const PartnerChangePasswordZodSchema = z.object({
  body: z.object({
    email: z
      .string({
        required_error: "email  is required",
      })
      .email(),
    oldPassword: z.string({
      required_error: "Old password  is required",
    }),
    newPassword: z.string({
      required_error: "New password  is required",
    }),
  }),
});

const verifyOtpZodSchema = z.object({
  body: z.object({
    email: z.string().email({ message: "Invalid email address" }),
    otp: z.string().length(6, { message: "OTP must be 6 digits" }),
  }),
});

const ResendEmailZodSchema = z.object({
  body: z.strictObject({
    email: z.string({
      required_error: "email  is required",
    }),
  }),
});

export const AuthValidation = {
  loginZodSchema,
  refreshTokenZodSchema,
  changePasswordZodSchema,
  PartnerChangePasswordZodSchema,
  verifyOtpZodSchema,
  ResendEmailZodSchema,
};
