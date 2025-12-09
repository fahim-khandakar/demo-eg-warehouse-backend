import nodemailer from "nodemailer";
import config from "../../../config";
import ApiError from "../../../errors/ApiError";

export async function sendEmail(to: string, subject: string, html: string) {
  try {
    const transporter = nodemailer.createTransport({
      host: config.host,
      port: Number(config.mailPort) || 465,
      secure: true,
      auth: {
        user: config.email,
        pass: config.appPass,
      },
    });
    if (to) {
      await transporter.sendMail({
        from: {
          name: "NEC Group",
          address: config.email || "",
        },
        to,
        subject,
        html,
      });
    }
  } catch (error) {
    throw new ApiError(500, (error as Error).message);
  }
}
