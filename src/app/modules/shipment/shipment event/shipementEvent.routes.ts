import express from "express";
import { ENUM_USER_ROLE } from "../../../../enum/user";
import auth from "../../../middlewares/auth";
import validateRequest from "../../../middlewares/validateRequest";
import { EventController } from "./shipmentEvent.controller";
import { EventValidation } from "./shipmentEvent.validation";

const router = express.Router();

router.post(
  "/",
  auth(ENUM_USER_ROLE.SUPER_ADMIN),
  validateRequest(EventValidation.create),
  EventController.insertIntoDB,
);
router.get(
  "/",
  auth(
    ENUM_USER_ROLE.SUPER_ADMIN,
    ENUM_USER_ROLE.ADMIN,
    ENUM_USER_ROLE.USER,
    ENUM_USER_ROLE.PRINCIPAL,
  ),
  EventController.getAllFromDB,
);
router.get(
  "/myevents",
  auth(ENUM_USER_ROLE.PARTNER),
  EventController.getMyAllFromDB,
);

router.get(
  "/:id",
  auth(
    ENUM_USER_ROLE.SUPER_ADMIN,
    ENUM_USER_ROLE.ADMIN,
    ENUM_USER_ROLE.USER,
    ENUM_USER_ROLE.PRINCIPAL,
  ),
  EventController.getByIdFromDB,
);

router.patch(
  "/:id",
  auth(ENUM_USER_ROLE.SUPER_ADMIN, ENUM_USER_ROLE.ADMIN),
  validateRequest(EventValidation.update),
  EventController.updateOneInDB,
);
export const eventRoutes = router;
