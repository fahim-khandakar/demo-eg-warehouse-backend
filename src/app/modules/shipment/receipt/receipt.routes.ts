import express from "express";
import { ENUM_USER_ROLE } from "../../../../enum/user";
import auth from "../../../middlewares/auth";
import validateRequest from "../../../middlewares/validateRequest";
import { ReceiptsController } from "./receipt.controller";
import { ReceiptValidation } from "./receipt.validation";

const router = express.Router();

router.post(
  "/",
  validateRequest(ReceiptValidation.create),
  ReceiptsController.insertIntoDB,
);
router.get(
  "/",
  auth(
    ENUM_USER_ROLE.SUPER_ADMIN,
    ENUM_USER_ROLE.ADMIN,
    ENUM_USER_ROLE.USER,
    ENUM_USER_ROLE.PRINCIPAL,
  ),
  ReceiptsController.getAllFromDB,
);
router.get(
  "/:id",
  auth(
    ENUM_USER_ROLE.SUPER_ADMIN,
    ENUM_USER_ROLE.ADMIN,
    ENUM_USER_ROLE.USER,
    ENUM_USER_ROLE.PRINCIPAL,
  ),
  ReceiptsController.getByIdFromDB,
);

router.patch(
  "/:id",
  auth(ENUM_USER_ROLE.SUPER_ADMIN, ENUM_USER_ROLE.ADMIN),
  validateRequest(ReceiptValidation.create),
  ReceiptsController.updateOneInDB,
);
router.delete(
  "/:id",
  auth(ENUM_USER_ROLE.SUPER_ADMIN, ENUM_USER_ROLE.ADMIN),
  ReceiptsController.deleteFromDB,
);

export const receiptsRoutes = router;
