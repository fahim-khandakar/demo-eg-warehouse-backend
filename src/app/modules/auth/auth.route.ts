import express from "express";
//
import { ENUM_USER_ROLE } from "../../../enum/user";
import auth from "../../middlewares/auth";
import validateRequest from "../../middlewares/validateRequest";
import { AuthController } from "./auth.controller";
import { AuthValidation } from "./auth.validation";

const router = express.Router();

router.post(
  "/login",
  validateRequest(AuthValidation.loginZodSchema),
  AuthController.loginUser,
);

router.post(
  "/verify-otp",
  validateRequest(AuthValidation.verifyOtpZodSchema),
  AuthController.verifyUserOTP,
);

router.post(
  "/partner-login",
  validateRequest(AuthValidation.loginZodSchema),
  AuthController.loginPartner,
);

router.post(
  "/partner-verify-otp",
  validateRequest(AuthValidation.verifyOtpZodSchema),
  AuthController.verifyPartnerOTP,
);

router.get("/verify", AuthController.emailVerify);

router.post(
  "/resend-email",
  validateRequest(AuthValidation.ResendEmailZodSchema),
  AuthController.ResendEmailVerify,
);

router.post(
  "/change-password",
  auth(ENUM_USER_ROLE.SUPER_ADMIN, ENUM_USER_ROLE.ADMIN, ENUM_USER_ROLE.USER),
  validateRequest(AuthValidation.changePasswordZodSchema),
  AuthController.resetPassword,
);

router.post(
  "/reset-password-for_partner",
  auth(ENUM_USER_ROLE.SUPER_ADMIN, ENUM_USER_ROLE.ADMIN),
  validateRequest(AuthValidation.changePasswordZodSchema),
  AuthController.resetPartnerPasswordByAdmin,
);
router.post(
  "/change-password-partner",
  auth(ENUM_USER_ROLE.PARTNER),
  validateRequest(AuthValidation.PartnerChangePasswordZodSchema),
  AuthController.partnerChangePassword,
);

export const AuthRoutes = router;
