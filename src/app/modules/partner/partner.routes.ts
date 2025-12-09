import express from "express";
//

import { ENUM_USER_ROLE } from "../../../enum/user";
import auth from "../../middlewares/auth";
import { logActivity } from "../../middlewares/logActivity";
import validateRequest from "../../middlewares/validateRequest";
import { partnerController } from "./partner.controller";
import { partnerValidation } from "./partner.validation";

const router = express.Router();

router.post(
  "/",
  auth(ENUM_USER_ROLE.SUPER_ADMIN, ENUM_USER_ROLE.ADMIN, ENUM_USER_ROLE.USER),
  validateRequest(partnerValidation.create),
  logActivity(true),
  partnerController.insertIntoDB,
);
router.get(
  "/",
  auth(
    ENUM_USER_ROLE.SUPER_ADMIN,
    ENUM_USER_ROLE.ADMIN,
    ENUM_USER_ROLE.USER,
    ENUM_USER_ROLE.PRINCIPAL,
  ),
  partnerController.getAllFromDB,
);
router.post(
  "/ship-to",
  auth(ENUM_USER_ROLE.SUPER_ADMIN, ENUM_USER_ROLE.ADMIN, ENUM_USER_ROLE.USER),
  validateRequest(partnerValidation.createShipTo),
  logActivity(true),
  partnerController.SenderInsertIntoDB,
);
router.get(
  "/ship-to",
  auth(
    ENUM_USER_ROLE.SUPER_ADMIN,
    ENUM_USER_ROLE.ADMIN,
    ENUM_USER_ROLE.USER,
    ENUM_USER_ROLE.PRINCIPAL,
  ),
  partnerController.getShipToFromDB,
);
router.get(
  "/profile",
  auth(ENUM_USER_ROLE.PARTNER),
  partnerController.getMyProfileByIdFromDB,
);
router.get(
  "/:id",
  auth(
    ENUM_USER_ROLE.SUPER_ADMIN,
    ENUM_USER_ROLE.ADMIN,
    ENUM_USER_ROLE.USER,
    ENUM_USER_ROLE.PARTNER,
  ),
  partnerController.getByIdFromDB,
);
router.patch(
  "/myprofile/:id",
  auth(ENUM_USER_ROLE.PARTNER),
  logActivity(true),
  validateRequest(partnerValidation.update),
  partnerController.updateMyProfileInDB,
);

router.patch(
  "/:id",
  auth(ENUM_USER_ROLE.SUPER_ADMIN, ENUM_USER_ROLE.ADMIN),
  validateRequest(partnerValidation.update),
  logActivity(true),
  partnerController.updateOneInDB,
);
router.delete(
  "/:id",
  auth(ENUM_USER_ROLE.SUPER_ADMIN, ENUM_USER_ROLE.ADMIN),
  logActivity(true),
  partnerController.deleteFromDB,
);

export const partnerRoutes = router;
