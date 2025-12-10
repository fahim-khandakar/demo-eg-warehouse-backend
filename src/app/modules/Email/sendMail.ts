import ApiError from "../../../errors/ApiError";

export async function sendEmail(to: string, subject: string, html: string) {
  try {
    // const transporter = nodemailer.createTransport({
    //   host: "necgroupbd.net",
    //   port: 587, // 587 for production
    //   secure: false, // STARTTLS
    //   auth: {
    //     user: config.email,
    //     pass: config.appPass,
    //   },
    //   tls: {
    //     rejectUnauthorized: false, // Render container e testing jonno
    //   },
    //   pool: true,
    //   maxConnections: 5,
    //   maxMessages: 100,
    //   connectionTimeout: 10000,
    //   greetingTimeout: 5000,
    //   socketTimeout: 20000,
    // });
    // if (to) {
    //   await transporter.sendMail({
    //     from: {
    //       name: "NEC Group",
    //       address: config.email || "",
    //     },
    //     to,
    //     subject,
    //     html,
    //   });
    // }
  } catch (error) {
    throw new ApiError(500, (error as Error).message);
  }
}
