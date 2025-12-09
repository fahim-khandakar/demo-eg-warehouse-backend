import express from "express";
import { ENUM_USER_ROLE } from "../../../enum/user";
import auth from "../../middlewares/auth";
import { logActivity } from "../../middlewares/logActivity";
import validateRequest from "../../middlewares/validateRequest";
import { StatusController } from "./status.controller";
import { orderRequestValidation } from "./status.validation";

const router = express.Router();

router.post(
  "/",
  auth(ENUM_USER_ROLE.PARTNER),
  validateRequest(orderRequestValidation.create),
  logActivity(true),
  StatusController.insertIntoDB,
);

router.get(
  "/",
  auth(
    ENUM_USER_ROLE.SUPER_ADMIN,
    ENUM_USER_ROLE.ADMIN,
    ENUM_USER_ROLE.USER,
    ENUM_USER_ROLE.PRINCIPAL,
  ),
  StatusController.getAllFromDB,
);

router.get(
  "/:id",
  auth(
    ENUM_USER_ROLE.SUPER_ADMIN,
    ENUM_USER_ROLE.ADMIN,
    ENUM_USER_ROLE.USER,
    ENUM_USER_ROLE.PRINCIPAL,
  ),
  StatusController.getByIdFromDB,
);

router.delete(
  "/:id",
  auth(ENUM_USER_ROLE.SUPER_ADMIN, ENUM_USER_ROLE.ADMIN),
  logActivity(true),
  StatusController.deleteFromDB,
);

export const statusRoutes = router;
