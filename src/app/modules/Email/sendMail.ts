import nodemailer from "nodemailer";
import config from "../../../config";
import ApiError from "../../../errors/ApiError";

export async function sendEmail(to: string, subject: string, html: string) {
  try {
    const transporter = nodemailer.createTransport({
      host: "necgroupbd.net",
      port: 465,
      secure: true,
      auth: {
        user: config.email,
        pass: config.appPass,
      },
      pool: true,
      maxConnections: 5,
      maxMessages: 100,
      connectionTimeout: 10000, // 10 sec timeout
      greetingTimeout: 5000, // 5 sec greeting wait
      socketTimeout: 20000, // 20 sec socket timeout
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
