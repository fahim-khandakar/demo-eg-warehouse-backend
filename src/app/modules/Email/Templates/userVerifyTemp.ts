import config from "../../../../config";
import { errorlogger } from "../../../../shared/logger";

export const sendVerificationEmail = async (
  to: string,
  token: string,
): Promise<boolean> => {
  // const transporter = nodemailer.createTransport({
  //   host: config.host,

  //   port: Number(config.mailPort) || 465,
  //   secure: false,
  //   auth: {
  //     user: config.email,
  //     pass: config.appPass,
  //   },
  // });
  const verificationLink = `${config.verifyUrl}?token=${token}`;
  try {
    const mailOptions = {
      from: {
        name: "NEC Group",
        address: config.email || "",
      },
      to,
      subject: "Verify Your Email",
      html: `<div
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
        <h2 style="color: #007bff">Welcome to NEC Group!</h2>
        <p style="font-size: 16px; color: #555">
          You're almost ready to get started. Please verify your email address
          to activate your account.
        </p>
        <a
          href="${verificationLink}"
          style="
            display: inline-block;
            padding: 12px 24px;
            margin-top: 20px;
            background-color: #007bff;
            color: #ffffff;
            text-decoration: none;
            border-radius: 5px;
            font-size: 18px;
          "
        >
          Verify My Email
        </a>
        <p style="margin-top: 20px; font-size: 14px; color: #777">
          This link will expire in <strong>2 hour</strong>. If the button above
          doesn't work, you can also copy and paste the following link into your
          browser:
        </p>
        <p style="word-wrap: break-word; font-size: 14px; color: #007bff">
          ${verificationLink}
        </p>
        <hr style="margin-top: 30px" />
        <p style="font-size: 12px; color: #999">
          If you did not sign up for this account, you can safely ignore this
          email.
        </p>
        <p style="font-size: 12px; color: #999">
          © ${new Date().getFullYear()} NEC Group. All rights reserved.
        </p>
      </div>
    </div>`,
    };

    // await transporter.sendMail(mailOptions);
    return true;
  } catch (error) {
    errorlogger.error("Email sending failed:", error);
    return false;
  }
};
