import bcrypt from "bcryptjs";
import jwt, { JwtPayload } from "jsonwebtoken";
//
import { User } from "@prisma/client";
import config from "../../../config";
import ApiError from "../../../errors/ApiError";
import { jwtHelpers } from "../../../helpers/jwtHelpers";
import prisma from "../../../shared/prisma";
import { sendVerificationEmail } from "../Email/Templates/userVerifyTemp";
import {
  generateOtp,
  generateVerificationToken,
  sendOtpEmail,
} from "../Email/Templates/utils";

const OTP_EXPIRATION_MINUTES = 15;

export async function validatePassword(
  email: string,
  password: string,
  type: "user" | "partner",
) {
  if (type === "user") {
    const account = await prisma.user.findUnique({ where: { email } });
    if (!account) throw new ApiError(400, "User does not exist");

    const isMatch = await bcrypt.compare(password, account.password);
    if (!isMatch) throw new ApiError(403, "Password incorrect");

    return account;
  } else {
    const account = await prisma.partner.findUnique({ where: { email } });
    if (!account) throw new ApiError(400, "Partner does not exist");

    const isMatch = await bcrypt.compare(password, account.password);
    if (!isMatch) throw new ApiError(403, "Password incorrect");

    return account;
  }
}

/**
 * Send OTP after password check
 */
export async function sendLoginOtp(email: string, type: "user" | "partner") {
  const otp = generateOtp();
  const expiresAt = new Date(Date.now() + OTP_EXPIRATION_MINUTES * 60 * 1000);

  if (type === "user") {
    const account = await prisma.user.findUnique({ where: { email } });
    if (!account) throw new ApiError(400, "User does not exist");

    await prisma.userOtp.create({
      data: { userId: account.id, otp, expiresAt, verified: false },
    });

    await sendOtpEmail(account.email, otp);
  } else {
    const account = await prisma.partner.findUnique({ where: { email } });
    if (!account) throw new ApiError(400, "Partner does not exist");

    await prisma.partnerOtp.create({
      data: { partnerId: account.id, otp, expiresAt, verified: false },
    });

    await sendOtpEmail(account.email, otp);
  }

  return {
    message: "OTP sent to your email. Please verify to complete login.",
  };
}

/**
 * Verify OTP and issue JWT
 */
export async function verifyOtp(
  email: string,
  otp: string,
  type: "user" | "partner",
) {
  if (type === "user") {
    const account = await prisma.user.findUnique({
      where: { email },
      include: {
        details: {
          include: {
            powers: {
              select: {
                id: true,
              },
            },
          },
        },
      },
    });

    if (!account) throw new ApiError(400, "User does not exist");

    const accountOtp = await prisma.userOtp.findFirst({
      where: { userId: account.id, otp, verified: false },
      orderBy: { expiresAt: "desc" },
    });

    if (!accountOtp) throw new ApiError(400, "Invalid OTP");
    if (accountOtp.expiresAt < new Date())
      throw new ApiError(400, "OTP expired");

    const updatedCount = await prisma.userOtp.updateMany({
      where: { id: accountOtp.id, verified: false },
      data: { verified: true },
    });
    if (updatedCount.count === 0) throw new ApiError(400, "OTP already used");

    const payloadJwt = {
      id: account.id,
      email: account.email,
      role: account?.role,
      powers: account?.details?.powers?.map(p => p.id) || [],
    };

    const accessToken = jwt.sign(payloadJwt, config.jwt.secret!, {
      expiresIn: config.jwt.expires_in,
    });
    const refreshToken = jwt.sign(payloadJwt, config.jwt.secret!, {
      expiresIn: config.jwt.refresh_expires_in,
    });

    return { accessToken, refreshToken };
  } else {
    const account = await prisma.partner.findUnique({
      where: { email },
    });
    if (!account) throw new ApiError(400, "Partner does not exist");

    const accountOtp = await prisma.partnerOtp.findFirst({
      where: { partnerId: account.id, otp, verified: false },
      orderBy: { expiresAt: "desc" },
    });

    if (!accountOtp) throw new ApiError(400, "Invalid OTP");
    if (accountOtp.expiresAt < new Date())
      throw new ApiError(400, "OTP expired");

    const updatedCount = await prisma.partnerOtp.updateMany({
      where: { id: accountOtp.id, verified: false },
      data: { verified: true },
    });
    if (updatedCount.count === 0) throw new ApiError(400, "OTP already used");

    const payloadJwt = {
      id: account.id,
      email: account.email,
      role: "partner",
      company: account.company,
    };

    const accessToken = jwt.sign(payloadJwt, config.jwt.secret!, {
      expiresIn: config.jwt.expires_in,
    });
    const refreshToken = jwt.sign(payloadJwt, config.jwt.secret!, {
      expiresIn: config.jwt.refresh_expires_in,
    });

    return { accessToken, refreshToken };
  }
}

const resetPassword = async (
  payload: { email: string; newPassword: string; user: User },
  token: string,
) => {
  const { email, newPassword } = payload;
  if (!email || !newPassword) {
    throw new ApiError(400, "Email and new password are required!");
  }
  // Find the user by id
  const user = await prisma.user.findUnique({ where: { email } });

  if (!user) {
    throw new ApiError(400, "User not found!");
  }

  if (user.role === "user" && user.email !== payload.user.email) {
    throw new ApiError(403, "User is not authorized to reset this password.");
  }

  const isVerified = await jwtHelpers.verifyToken(
    token,
    config.jwt.secret as string,
  );

  if (!isVerified) {
    throw new ApiError(403, "Token verification failed!");
  }
  // Hash the new password
  const hashedPassword = await bcrypt.hash(
    newPassword,
    Number(config.bycrypt_salt_rounds),
  );

  // Update the user's password
  await prisma.user.update({
    where: { email },
    data: { password: hashedPassword },
  });
};

const changePartnerPassword = async (
  payload: { oldPassword: string; newPassword: string; email: string },
  partnerId: number,
) => {
  const { oldPassword, newPassword, email } = payload;

  // Validate input
  if (!oldPassword || !newPassword || !email) {
    throw new ApiError(
      400,
      "Current password, new password, and email are required!",
    );
  }

  const partner = await prisma.partner.findUnique({ where: { email } });

  if (!partner) {
    throw new ApiError(400, "Partner not found!");
  }

  // Verify the partner's identity (check if the current password matches)
  const isPasswordCorrect = await bcrypt.compare(oldPassword, partner.password);

  if (!isPasswordCorrect) {
    throw new ApiError(403, "Current password is incorrect!");
  }

  // Hash the new password
  const hashedPassword = await bcrypt.hash(
    newPassword,
    Number(config.bycrypt_salt_rounds), // Adjust salt rounds as needed
  );

  // Update the partner's password in the database
  await prisma.partner.update({
    where: { id: partnerId }, // Use partner's unique ID to find them
    data: { password: hashedPassword },
  });

  return { message: "Password updated successfully" };
};

const resetPartnerPasswordByAdmin = async (
  payload: { newPassword: string; email: string },
  adminUser: JwtPayload,
) => {
  const { newPassword, email } = payload;

  // Check if the admin user is authorized to reset the partner's password
  if (adminUser.role !== "admin") {
    throw new ApiError(403, "Only admin can reset partner password.");
  }

  // Validate that new password is provided
  if (!newPassword || !email) {
    throw new ApiError(400, "Email and new password are required!");
  }

  // Find the partner by email
  const partner = await prisma.partner.findUnique({ where: { email } });

  if (!partner) {
    throw new ApiError(400, "Partner not found!");
  }

  // Hash the new password
  const hashedPassword = await bcrypt.hash(
    newPassword,
    Number(config.bycrypt_salt_rounds), // Adjust salt rounds as needed
  );

  // Update the partner's password in the database
  await prisma.partner.update({
    where: { email },
    data: { password: hashedPassword },
  });

  return { message: "Partner password updated successfully by admin" };
};

// const emailVerify = async (token: string | null) => {
//   if (!token) throw new ApiError(400, "Token is required");
//   const user = await prisma.user.findFirst({
//     where: {
//       verificationToken: token as string,
//       verificationExpires: { gt: new Date() }, // Check expiration
//     },
//   });
//   if (!user) throw new ApiError(403, "Invalid or expired token");

//   const result = await prisma.user.update({
//     where: { id: user.id },
//     data: {
//       verified: true,
//       verificationToken: null,
//       verificationExpires: null,
//     },
//     select: {
//       id: true,
//       verified: true,
//       email: true,
//     },
//   });
//   return result;
// };

const emailVerify = async (token: string | null) => {
  if (!token) throw new ApiError(400, "Token is required");
  const user = await prisma.user.findFirst({
    where: {
      verificationToken: token as string,
      // verificationExpires: { gte: new Date() }, // Check expiration
    },
  });
  if (!user) throw new ApiError(403, "Invalid or expired token");

  const result = await prisma.user.update({
    where: { id: user.id },
    data: {
      verified: true,
      verificationToken: null,
      verificationExpires: null,
    },
    select: {
      id: true,
      verified: true,
      email: true,
    },
  });
  return result;
};

const ResendEmailVerify = async (email: string) => {
  const user = await prisma.user.findFirst({
    where: {
      email,
    },
  });
  if (!user) throw new ApiError(403, "Invalid or expired token");
  const token = await generateVerificationToken(user.id);
  await sendVerificationEmail(user.email, token);
};

export const AuthService = {
  sendLoginOtp,
  verifyOtp,
  resetPassword,
  changePartnerPassword,
  resetPartnerPasswordByAdmin,
  emailVerify,
  ResendEmailVerify,
  validatePassword,
};
