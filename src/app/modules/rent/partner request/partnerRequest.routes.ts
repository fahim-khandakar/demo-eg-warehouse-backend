import express from "express";
import { ENUM_USER_ROLE } from "../../../../enum/user";
import auth from "../../../middlewares/auth";
import { logActivity } from "../../../middlewares/logActivity";
import validateRequest from "../../../middlewares/validateRequest";
import { OrderRequestController } from "./partnerRequest.controller";
import { orderRequestValidation } from "./partnerRequest.validation";

const router = express.Router();

router.post(
  "/",
  auth(ENUM_USER_ROLE.PARTNER),
  validateRequest(orderRequestValidation.create),
  logActivity(true),
  OrderRequestController.insertIntoDB,
);

router.post(
  "/change-status/:id",
  auth(
    ENUM_USER_ROLE.SUPER_ADMIN,
    ENUM_USER_ROLE.ADMIN,
    ENUM_USER_ROLE.USER,
    ENUM_USER_ROLE.PARTNER,
  ),
  logActivity(false),
  OrderRequestController.updatePartRequestStatus,
);
router.post(
  "/approved/:id",
  auth(ENUM_USER_ROLE.SUPER_ADMIN, ENUM_USER_ROLE.ADMIN, ENUM_USER_ROLE.USER),
  logActivity(false),
  OrderRequestController.ApproveRequest,
);

router.get(
  "/",
  auth(
    ENUM_USER_ROLE.SUPER_ADMIN,
    ENUM_USER_ROLE.ADMIN,
    ENUM_USER_ROLE.USER,
    ENUM_USER_ROLE.PRINCIPAL,
  ),
  OrderRequestController.getAllFromDB,
);

router.get(
  "/myorders",
  auth(ENUM_USER_ROLE.PARTNER),
  OrderRequestController.getMyOrdersFromDB,
);
router.get(
  "/mycompanies",
  auth(ENUM_USER_ROLE.PARTNER),
  OrderRequestController.getMyCompanyOrdersFromDB,
);

router.get(
  "/myorders/:id",
  auth(ENUM_USER_ROLE.PARTNER),
  OrderRequestController.getMyOrderByIdFromDB,
);

router.get(
  "/:id",
  auth(
    ENUM_USER_ROLE.SUPER_ADMIN,
    ENUM_USER_ROLE.ADMIN,
    ENUM_USER_ROLE.USER,
    ENUM_USER_ROLE.PRINCIPAL,
  ),
  OrderRequestController.getByIdFromDB,
);

router.patch(
  "/:id",
  auth(ENUM_USER_ROLE.SUPER_ADMIN, ENUM_USER_ROLE.PARTNER),
  validateRequest(orderRequestValidation.update),
  logActivity(true),
  OrderRequestController.updateOneInDB,
);

router.delete(
  "/myorders/:id",
  auth(
    ENUM_USER_ROLE.SUPER_ADMIN,
    ENUM_USER_ROLE.ADMIN,
    ENUM_USER_ROLE.PARTNER,
  ),
  logActivity(true),
  OrderRequestController.deleteMyOrderByIdFromDB,
);
router.delete(
  "/:id",
  auth(ENUM_USER_ROLE.SUPER_ADMIN, ENUM_USER_ROLE.ADMIN),
  logActivity(true),
  OrderRequestController.deleteFromDB,
);

export const customerRequestRoutes = router;
