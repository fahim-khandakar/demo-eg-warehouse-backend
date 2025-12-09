import { Request, Response } from "express";
import { JwtPayload } from "jsonwebtoken";
import { paginationFields } from "../../../constants/pagination";
import catchAsync from "../../../shared/catchAsync";
import pick from "../../../shared/pick";
import sendResponse from "../../../shared/sendResponse";
import { principalFilterableFields } from "./principal.constaints";
import { PrincipalService } from "./principal.service";

const insertIntoDB = catchAsync(async (req: Request, res: Response) => {
  const result = await PrincipalService.insertIntoDB(req.body);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "principal created successfully",
    data: result,
  });
});

const getAllFromDB = catchAsync(async (req: Request, res: Response) => {
  const filters = pick(req.query, principalFilterableFields);
  const options = pick(req.query, paginationFields);
  const result = await PrincipalService.getAllFromDB(filters, options);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "principal fetched successfully",
    meta: result.meta,
    data: result.data,
  });
});

const updateOneInDB = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await PrincipalService.updateOneInDB(id, req.body);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "principal update successfully",
    data: result,
  });
});
const updateMyProfileInDB = catchAsync(async (req: Request, res: Response) => {
  const user = req.user;
  const result = await PrincipalService.updateMyProfileInDB(
    user as JwtPayload,
    req.body,
  );
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "principal update successfully",
    data: result,
  });
});

const getByIdFromDB = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const parseId = parseInt(id);
  const result = await PrincipalService.getByIdFromDB(parseId);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "principal fetched successfully",
    data: result,
  });
});
const getMyProfileByIdFromDB = catchAsync(
  async (req: Request, res: Response) => {
    const user = req.user;
    const result = await PrincipalService.getMyProfileByIdFromDB(
      user as JwtPayload,
    );
    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "principal fetched successfully",
      data: result,
    });
  },
);
const deleteFromDB = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const parseId = parseInt(id);
  const result = await PrincipalService.deleteFromDB(parseId);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "principal deleted successfully",
    data: result,
  });
});

export const principalController = {
  insertIntoDB,
  getAllFromDB,
  getByIdFromDB,
  updateOneInDB,
  updateMyProfileInDB,
  getMyProfileByIdFromDB,
  // updateIntoDB,
  deleteFromDB,
};
