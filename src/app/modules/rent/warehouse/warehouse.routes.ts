import express from "express";
import { ENUM_USER_ROLE } from "../../../../enum/user";
import auth from "../../../middlewares/auth";
import { logActivity } from "../../../middlewares/logActivity";
import validateRequest from "../../../middlewares/validateRequest";
import { WarehouseController } from "./warehouse.controller";
import { warehouseValidation } from "./warehouse.validation";

const router = express.Router();

router.post(
  "/",
  auth(ENUM_USER_ROLE.SUPER_ADMIN, ENUM_USER_ROLE.ADMIN),
  validateRequest(warehouseValidation.create),
  logActivity(true),
  WarehouseController.insertIntoDB,
);
// router.post(
//   "/multiple",
//   auth(ENUM_USER_ROLE.SUPER_ADMIN, ENUM_USER_ROLE.ADMIN),
//   WarehouseController.insertIntoDBMultiple,
// );

// router.post(
//   //Open,Delivered,Badbuffer Pending,Closed, Approved, Rejected,Completed
//   "/status",
//   auth(ENUM_USER_ROLE.SUPER_ADMIN),
//   WarehouseController.insertIntoDbStatus,
// );
router.get(
  "/",
  auth(
    ENUM_USER_ROLE.SUPER_ADMIN,
    ENUM_USER_ROLE.ADMIN,
    ENUM_USER_ROLE.USER,
    ENUM_USER_ROLE.PRINCIPAL,
  ),
  WarehouseController.getAllFromDB,
);
router.get(
  "/status",
  auth(
    ENUM_USER_ROLE.SUPER_ADMIN,
    ENUM_USER_ROLE.ADMIN,
    ENUM_USER_ROLE.USER,
    ENUM_USER_ROLE.PRINCIPAL,
  ),
  WarehouseController.getStatusFromDB,
);
router.get(
  "/:id",
  auth(
    ENUM_USER_ROLE.SUPER_ADMIN,
    ENUM_USER_ROLE.ADMIN,
    ENUM_USER_ROLE.USER,
    ENUM_USER_ROLE.PRINCIPAL,
  ),
  WarehouseController.getByIdFromDB,
);
router.patch(
  "/:id",
  auth(ENUM_USER_ROLE.SUPER_ADMIN),
  validateRequest(warehouseValidation.update),
  logActivity(true),
  WarehouseController.updateOneInDB,
);
// router.delete(
//   "/:id",
//   auth(ENUM_USER_ROLE.SUPER_ADMIN, ENUM_USER_ROLE.ADMIN),
//   WarehouseController.deleteFromDB,
// );

export const warehouseRoutes = router;
