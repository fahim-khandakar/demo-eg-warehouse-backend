import { Request, Response } from "express";
//
import { JwtPayload } from "jsonwebtoken";
import { paginationFields } from "../../../constants/pagination";
import { ENUM_USER_ROLE } from "../../../enum/user";
import catchAsync from "../../../shared/catchAsync";
import pick from "../../../shared/pick";
import sendResponse from "../../../shared/sendResponse";
import { userFilterableFields } from "./user.constaints";
import { userService } from "./user.services";

const insertIntoDB = catchAsync(async (req: Request, res: Response) => {
  const result = await userService.insertIntoDB(req.body, "user");
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "user created successfully",
    data: result,
  });
});
const AdminInsertIntoDB = catchAsync(async (req: Request, res: Response) => {
  const result = await userService.insertIntoDB(req.body, "admin");
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "admin created successfully",
    data: result,
  });
});

const SuperAdminInsertIntoDB = catchAsync(
  async (req: Request, res: Response) => {
    const result = await userService.insertIntoDB(req.body, "super_admin");
    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "super admin created successfully",
      data: result,
    });
  },
);
const PrincipalInsertIntoDB = catchAsync(
  async (req: Request, res: Response) => {
    const result = await userService.insertIntoDB(
      req.body,
      ENUM_USER_ROLE.PRINCIPAL,
    );
    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "Pricipal created successfully",
      data: result,
    });
  },
);

const createPower = catchAsync(async (req: Request, res: Response) => {
  const result = await userService.createPower(req.body);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "power created successfully",
    data: result,
  });
});
const createBranch = catchAsync(async (req: Request, res: Response) => {
  const result = await userService.createBranch(req.body);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "branch created successfully",
    data: result,
  });
});

const getAllFromDB = catchAsync(async (req: Request, res: Response) => {
  const filters = pick(req.query, userFilterableFields);
  const options = pick(req.query, paginationFields);
  const result = await userService.getAllFromDB(filters, options);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "user fetched successfully",
    meta: result.meta,
    data: result.data,
  });
});
const getPowersFromDB = catchAsync(async (req: Request, res: Response) => {
  const result = await userService.getPowersFromDB();
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "powers fetched successfully",
    data: result,
  });
});
const getBranchFromDB = catchAsync(async (req: Request, res: Response) => {
  const result = await userService.getBranchFromDB();
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "branch fetched successfully",
    data: result,
  });
});

const getByIdFromDB = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const parseId = parseInt(id);
  const result = await userService.getByIdFromDB(parseId);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "user fetched successfully",
    data: result,
  });
});

const updateOneInDB = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await userService.updateOneInDB(id, req.body);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "user update successfully",
    data: result,
  });
});

const deleteFromDB = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const reqUser = req?.user;
  const result = await userService.deleteByIdFromDB(id, reqUser as JwtPayload);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "User deleted successfully",
    data: result,
  });
});

export const userController = {
  insertIntoDB,
  AdminInsertIntoDB,
  SuperAdminInsertIntoDB,
  createPower,
  createBranch,
  getAllFromDB,
  getBranchFromDB,
  getPowersFromDB,
  getByIdFromDB,
  updateOneInDB,
  deleteFromDB,
  PrincipalInsertIntoDB,
};
