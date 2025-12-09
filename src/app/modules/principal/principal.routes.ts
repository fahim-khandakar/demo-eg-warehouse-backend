import express from "express";
//

import { ENUM_USER_ROLE } from "../../../enum/user";
import auth from "../../middlewares/auth";
import { logActivity } from "../../middlewares/logActivity";
import validateRequest from "../../middlewares/validateRequest";
import { principalController } from "./principal.controller";
import { partnerValidation } from "./principal.validation";

const router = express.Router();

router.post(
  "/",
  auth(ENUM_USER_ROLE.SUPER_ADMIN, ENUM_USER_ROLE.ADMIN, ENUM_USER_ROLE.USER),
  validateRequest(partnerValidation.create),
  logActivity(true),
  principalController.insertIntoDB,
);
router.get(
  "/",
  auth(
    ENUM_USER_ROLE.SUPER_ADMIN,
    ENUM_USER_ROLE.ADMIN,
    ENUM_USER_ROLE.USER,
    ENUM_USER_ROLE.PRINCIPAL,
  ),
  principalController.getAllFromDB,
);

router.get(
  "/profile",
  auth(ENUM_USER_ROLE.PARTNER),
  principalController.getMyProfileByIdFromDB,
);
router.get(
  "/:id",
  auth(
    ENUM_USER_ROLE.SUPER_ADMIN,
    ENUM_USER_ROLE.ADMIN,
    ENUM_USER_ROLE.USER,
    ENUM_USER_ROLE.PARTNER,
  ),
  principalController.getByIdFromDB,
);
router.patch(
  "/myprofile/:id",
  auth(ENUM_USER_ROLE.PARTNER),
  logActivity(true),
  validateRequest(partnerValidation.update),
  principalController.updateMyProfileInDB,
);

router.patch(
  "/:id",
  auth(ENUM_USER_ROLE.SUPER_ADMIN, ENUM_USER_ROLE.ADMIN),
  validateRequest(partnerValidation.update),
  logActivity(true),
  principalController.updateOneInDB,
);
router.delete(
  "/:id",
  auth(ENUM_USER_ROLE.SUPER_ADMIN, ENUM_USER_ROLE.ADMIN),
  logActivity(true),
  principalController.deleteFromDB,
);

export const principalRoutes = router;
