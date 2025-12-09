import express from "express";
import { ENUM_USER_ROLE } from "../../../../enum/user";
import auth from "../../../middlewares/auth";
import validateRequest from "../../../middlewares/validateRequest";
import { BadPartEventsController } from "./badpart.controller";
import { badBufferValidation } from "./badpart.validation";

const router = express.Router();

router.post(
  "/",
  validateRequest(badBufferValidation.create),
  BadPartEventsController.insertIntoDB,
);
router.get(
  "/",
  auth(
    ENUM_USER_ROLE.SUPER_ADMIN,
    ENUM_USER_ROLE.ADMIN,
    ENUM_USER_ROLE.USER,
    ENUM_USER_ROLE.PRINCIPAL,
  ),
  BadPartEventsController.getAllFromDB,
);
router.post(
  "/multiple",
  auth(
    ENUM_USER_ROLE.SUPER_ADMIN,
    ENUM_USER_ROLE.ADMIN,
    ENUM_USER_ROLE.USER,
    ENUM_USER_ROLE.PRINCIPAL,
  ),
  validateRequest(badBufferValidation.idsSchema),
  BadPartEventsController.getmultipleFromDB,
);

router.get(
  "/:id",
  auth(
    ENUM_USER_ROLE.SUPER_ADMIN,
    ENUM_USER_ROLE.ADMIN,
    ENUM_USER_ROLE.USER,
    ENUM_USER_ROLE.PRINCIPAL,
  ),
  BadPartEventsController.getByIdFromDB,
);

router.patch(
  "/:id",
  auth(ENUM_USER_ROLE.SUPER_ADMIN, ENUM_USER_ROLE.ADMIN),
  validateRequest(badBufferValidation.create),
  BadPartEventsController.updateOneInDB,
);

export const badBuffersRoutes = router;
