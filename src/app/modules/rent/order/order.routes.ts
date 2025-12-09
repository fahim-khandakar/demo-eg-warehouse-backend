import express from "express";
import { ENUM_USER_ROLE } from "../../../../enum/user";
import auth from "../../../middlewares/auth";
import { logActivity } from "../../../middlewares/logActivity";
import validateRequest from "../../../middlewares/validateRequest";
import { OrderController } from "./order.controller";
import { orderValidation } from "./order.validation";

const router = express.Router();

router.post(
  "/",
  auth(ENUM_USER_ROLE.SUPER_ADMIN, ENUM_USER_ROLE.ADMIN, ENUM_USER_ROLE.USER),
  validateRequest(orderValidation.create),
  logActivity(true),
  OrderController.insertIntoDB,
);
router.post(
  "/download",
  auth(
    ENUM_USER_ROLE.SUPER_ADMIN,
    ENUM_USER_ROLE.ADMIN,
    ENUM_USER_ROLE.USER,
    ENUM_USER_ROLE.PRINCIPAL,
  ),
  OrderController.getOrderData,
);
router.post(
  "/change-status/:id",
  auth(ENUM_USER_ROLE.SUPER_ADMIN, ENUM_USER_ROLE.ADMIN, ENUM_USER_ROLE.USER),
  logActivity(false),
  OrderController.updateOrderStatus,
);

router.get(
  "/",
  auth(
    ENUM_USER_ROLE.SUPER_ADMIN,
    ENUM_USER_ROLE.ADMIN,
    ENUM_USER_ROLE.USER,
    ENUM_USER_ROLE.PRINCIPAL,
  ),
  OrderController.getAllFromDB,
);

//customers routes
router.get(
  "/myorders",
  auth(ENUM_USER_ROLE.PARTNER),
  OrderController.getAllFromDB,
);

router.get(
  "/parts",
  auth(
    ENUM_USER_ROLE.SUPER_ADMIN,
    ENUM_USER_ROLE.ADMIN,
    ENUM_USER_ROLE.USER,
    ENUM_USER_ROLE.PARTNER,
    ENUM_USER_ROLE.PRINCIPAL,
  ),
  OrderController.getPartsFromDB,
);

router.get(
  "/:id",
  auth(
    ENUM_USER_ROLE.SUPER_ADMIN,
    ENUM_USER_ROLE.ADMIN,
    ENUM_USER_ROLE.USER,
    ENUM_USER_ROLE.PRINCIPAL,
  ),
  OrderController.getByIdFromDB,
);

router.patch(
  "/:id",
  validateRequest(orderValidation.update),
  logActivity(true),
  OrderController.updateOneInDB,
);

router.delete(
  "/:id",
  auth(ENUM_USER_ROLE.SUPER_ADMIN, ENUM_USER_ROLE.ADMIN),
  logActivity(true),
  OrderController.deleteFromDB,
);

export const orderRoutes = router;
