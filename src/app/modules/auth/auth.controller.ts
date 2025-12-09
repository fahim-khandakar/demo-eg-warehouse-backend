import { Request, Response } from "express";
import { JwtPayload } from "jsonwebtoken";
import config from "../../../config";
import catchAsync from "../../../shared/catchAsync";
import sendResponse from "../../../shared/sendResponse";
import { AuthService } from "./auth.service";

export const loginUser = catchAsync(async (req: Request, res: Response) => {
  const { email, password } = req.body;

  await AuthService.validatePassword(email, password, "user");
  const result = await AuthService.sendLoginOtp(email, "user");

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: result.message,
  });
});

export const verifyUserOTP = catchAsync(async (req: Request, res: Response) => {
  const { email, otp } = req.body;

  const tokens = await AuthService.verifyOtp(email, otp, "user");

  res.cookie("refreshToken", tokens.refreshToken, {
    secure: config.env === "production",
    httpOnly: true,
  });

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "User logged in successfully",
    data: tokens,
  });
});

export const loginPartner = catchAsync(async (req: Request, res: Response) => {
  const { email, password } = req.body;

  await AuthService.validatePassword(email, password, "partner");
  const result = await AuthService.sendLoginOtp(email, "partner");

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: result.message,
  });
});

export const verifyPartnerOTP = catchAsync(
  async (req: Request, res: Response) => {
    const { email, otp } = req.body;

    const tokens = await AuthService.verifyOtp(email, otp, "partner");

    res.cookie("refreshToken", tokens.refreshToken, {
      secure: config.env === "production",
      httpOnly: true,
    });

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "Partner logged in successfully",
      data: tokens,
    });
  },
);
const resetPassword = catchAsync(async (req: Request, res: Response) => {
  const token = req.headers.authorization || "";
  req.body.user = req.user;
  await AuthService.resetPassword(req.body, token);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Account recovered!",
  });
});

const partnerChangePassword = catchAsync(
  async (req: Request, res: Response) => {
    req.body.user = req.user;
    const partnerId = req.user?.id;
    await AuthService.changePartnerPassword(req.body, partnerId);

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "Account recovered!",
    });
  },
);

const resetPartnerPasswordByAdmin = catchAsync(
  async (req: Request, res: Response) => {
    const user = req.user;
    await AuthService.resetPartnerPasswordByAdmin(req.body, user as JwtPayload);

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "Account recovered!",
    });
  },
);

const emailVerify = catchAsync(async (req: Request, res: Response) => {
  const { token } = req.query;
  console.log("token", token);
  const result = await AuthService.emailVerify(token as string);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Email verify successfully",
    data: result,
  });
});
const ResendEmailVerify = catchAsync(async (req: Request, res: Response) => {
  const { email } = req.body;
  const result = await AuthService.ResendEmailVerify(email);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Email send successfully",
    data: result,
  });
});
export const AuthController = {
  loginUser,
  loginPartner,
  resetPassword,
  partnerChangePassword,
  resetPartnerPasswordByAdmin,
  verifyUserOTP,
  verifyPartnerOTP,
  emailVerify,
  ResendEmailVerify,
};
