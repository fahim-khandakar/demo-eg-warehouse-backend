import crypto from "crypto";
import prisma from "../../../../shared/prisma";
import { sendEmail } from "../sendMail";

export async function generateVerificationToken(id: number) {
  if (!id) {
    throw new Error("User ID is missing while generating verification token");
  }
  const token = crypto.randomBytes(32).toString("hex");
  const expires = new Date();
  expires.setHours(expires.getHours() + 2);

  await prisma.user.update({
    where: { id },
    data: {
      verificationToken: token,
      verificationExpires: expires,
    },
  });

  return token;
}

export function generateOtp() {
  return crypto.randomInt(100000, 999999).toString(); // 6-digit code
}

export async function sendOtpEmail(to: string, otp: string) {
  const html = `
    <div
      style="
        font-family: Arial, sans-serif;
        max-width: 600px;
        margin: auto;
        padding: 20px;
        border: 1px solid #ddd;
        border-radius: 10px;
      "
    >
      <div style="text-align: center">
        <img
          style="height: 50px; width: 70px"
          src="https://necgroupbd.com/wp-content/uploads/2024/03/cropped-NEC-1-e1710062416429.png"
          alt=""
        />
        <h2 style="color: #007bff">NEC Group!</h2>
        <p style="font-size: 16px; color: #555">
        We have received a sign in attempt with the follwing code. Please enter in it the brower window where verify opt page.
        </p>
    <h2 style="margin: 30px; font-size: 20px;">${otp}</h2>
        <p style="margin-top: 20px; font-size: 14px; color: #777">
          If you did not attempt to sign in but received this email, please disregard it. The code will remain active for 10 minutes.
        </p>

        <p style="font-size: 12px;margin-top: 30px; color: #999">
          If you did not sign up for this account, you can safely ignore this
          email.
        </p>
        <p style="font-size: 12px; color: #999">
          © ${new Date().getFullYear()} NEC Group. All rights reserved.
        </p>
      </div>
    </div>
  `;
  await sendEmail(to, "Your Login OTP", html);
}
