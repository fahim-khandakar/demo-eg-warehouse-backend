import express from "express";
import { ENUM_USER_ROLE } from "../../../enum/user";
import auth from "../../middlewares/auth";
import validateRequest from "../../middlewares/validateRequest";
import { userController } from "./user.controller";
import { userValidation } from "./user.validation";

const router = express.Router();

router.post(
  "/create-user",
  auth(ENUM_USER_ROLE.SUPER_ADMIN, ENUM_USER_ROLE.ADMIN),
  validateRequest(userValidation.create),
  userController.insertIntoDB,
);
router.post(
  "/create-admin",
  auth(ENUM_USER_ROLE.SUPER_ADMIN, ENUM_USER_ROLE.ADMIN),
  validateRequest(userValidation.create),
  userController.AdminInsertIntoDB,
);
router.post(
  "/create-principal",
  auth(ENUM_USER_ROLE.SUPER_ADMIN, ENUM_USER_ROLE.ADMIN),
  validateRequest(userValidation.create),
  userController.PrincipalInsertIntoDB,
);
router.post(
  "/create-super_admin",
  auth(ENUM_USER_ROLE.SUPER_ADMIN),
  validateRequest(userValidation.create),
  userController.SuperAdminInsertIntoDB,
);
// 1. add product 2. edit product 3. add loan 4. update loan 5.add pod 6. pod update 7. edit event
router.post(
  "/create-power",
  auth(ENUM_USER_ROLE.SUPER_ADMIN), //POD , Loan
  validateRequest(userValidation.createPower),
  userController.createPower,
);

router.post(
  "/branches",
  auth(ENUM_USER_ROLE.SUPER_ADMIN, ENUM_USER_ROLE.ADMIN),
  validateRequest(userValidation.createPower),
  userController.createBranch,
);

router.get(
  "/",
  auth(
    ENUM_USER_ROLE.SUPER_ADMIN,
    ENUM_USER_ROLE.ADMIN,
    ENUM_USER_ROLE.USER,
    ENUM_USER_ROLE.PRINCIPAL,
  ),
  userController.getAllFromDB,
);
router.get(
  "/powers",
  auth(
    ENUM_USER_ROLE.SUPER_ADMIN,
    ENUM_USER_ROLE.ADMIN,
    ENUM_USER_ROLE.USER,
    ENUM_USER_ROLE.PRINCIPAL,
  ),
  userController.getPowersFromDB,
);
router.get(
  "/branches",
  auth(
    ENUM_USER_ROLE.SUPER_ADMIN,
    ENUM_USER_ROLE.ADMIN,
    ENUM_USER_ROLE.USER,
    ENUM_USER_ROLE.PRINCIPAL,
  ),
  userController.getBranchFromDB,
);
router.patch(
  "/:id",
  auth(ENUM_USER_ROLE.SUPER_ADMIN, ENUM_USER_ROLE.ADMIN),
  validateRequest(userValidation.update),
  userController.updateOneInDB,
);
router.get(
  "/:id",
  auth(
    ENUM_USER_ROLE.SUPER_ADMIN,
    ENUM_USER_ROLE.ADMIN,
    ENUM_USER_ROLE.USER,
    ENUM_USER_ROLE.PRINCIPAL,
  ),
  userController.getByIdFromDB,
);
router.delete(
  "/:id",
  auth(ENUM_USER_ROLE.SUPER_ADMIN, ENUM_USER_ROLE.ADMIN),
  userController.deleteFromDB,
);

export const usersRoutes = router;
