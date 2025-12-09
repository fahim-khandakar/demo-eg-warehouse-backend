import express from "express";
import { ENUM_USER_ROLE } from "../../../../enum/user";
import auth from "../../../middlewares/auth";
import { logActivity } from "../../../middlewares/logActivity";
import validateRequest from "../../../middlewares/validateRequest";
import { InventoryController } from "./inventory.controller";
import { inventoryValidation } from "./inventory.validation";

const router = express.Router();

router.post(
  "/",
  auth(ENUM_USER_ROLE.SUPER_ADMIN, ENUM_USER_ROLE.ADMIN, ENUM_USER_ROLE.USER),
  validateRequest(inventoryValidation.create),
  logActivity(true),
  InventoryController.insertIntoDB,
);
router.post(
  "/create-multiple",
  auth(ENUM_USER_ROLE.SUPER_ADMIN, ENUM_USER_ROLE.ADMIN, ENUM_USER_ROLE.USER),
  validateRequest(inventoryValidation.createMultiple),
  logActivity(false),
  InventoryController.insertMultipleIntoDB,
);

router.get(
  "/",
  auth(
    ENUM_USER_ROLE.SUPER_ADMIN,
    ENUM_USER_ROLE.ADMIN,
    ENUM_USER_ROLE.USER,
    ENUM_USER_ROLE.PRINCIPAL,
  ),
  InventoryController.getAllFromDB,
);

router.post(
  "/download",
  auth(
    ENUM_USER_ROLE.SUPER_ADMIN,
    ENUM_USER_ROLE.ADMIN,
    ENUM_USER_ROLE.USER,
    ENUM_USER_ROLE.PRINCIPAL,
  ),
  InventoryController.getInventoryData,
);

router.get(
  "/stocks",
  auth(
    ENUM_USER_ROLE.SUPER_ADMIN,
    ENUM_USER_ROLE.ADMIN,
    ENUM_USER_ROLE.USER,
    ENUM_USER_ROLE.PRINCIPAL,
  ),
  InventoryController.getStocksAllFromDB,
);

router.get(
  "/stocks/:id",
  auth(
    ENUM_USER_ROLE.SUPER_ADMIN,
    ENUM_USER_ROLE.ADMIN,
    ENUM_USER_ROLE.USER,
    ENUM_USER_ROLE.PRINCIPAL,
  ),
  InventoryController.getStockByIdFromDB,
);
router.get(
  "/:id",
  auth(
    ENUM_USER_ROLE.SUPER_ADMIN,
    ENUM_USER_ROLE.ADMIN,
    ENUM_USER_ROLE.USER,
    ENUM_USER_ROLE.PRINCIPAL,
  ),
  InventoryController.getByIdFromDB,
);

router.patch(
  "/stocks/:id",
  auth(ENUM_USER_ROLE.SUPER_ADMIN, ENUM_USER_ROLE.ADMIN, ENUM_USER_ROLE.USER),
  validateRequest(inventoryValidation.StockUpdate),
  logActivity(true),
  InventoryController.updateLogOneInDB,
);
router.patch(
  "/:id",
  auth(ENUM_USER_ROLE.SUPER_ADMIN),
  validateRequest(inventoryValidation.update),
  logActivity(true),
  InventoryController.updateOneInDB,
);
router.delete(
  "/:id",
  auth(ENUM_USER_ROLE.SUPER_ADMIN),
  logActivity(true),
  InventoryController.deleteInventoryFromDB,
);
router.delete(
  "/stock/:id",
  auth(ENUM_USER_ROLE.SUPER_ADMIN),
  logActivity(true),
  InventoryController.deleteInventoryLogFromDB,
);

export const inventoryRoutes = router;
