import { Request, Response } from "express";
import { paginationFields } from "../../../constants/pagination";
import catchAsync from "../../../shared/catchAsync";
import pick from "../../../shared/pick";
import sendResponse from "../../../shared/sendResponse";
import { StatusFilterableFields } from "./status.constaints";
import { StatusService } from "./status.service";

const insertIntoDB = catchAsync(async (req: Request, res: Response) => {
  req.body.partnerId = req.user?.id;
  const result = await StatusService.insertIntoDB(req.body);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "status Request created successfully",
    data: result,
  });
});

const getAllFromDB = catchAsync(async (req: Request, res: Response) => {
  const filters = pick(req.query, StatusFilterableFields);
  const options = pick(req.query, paginationFields);
  const result = await StatusService.getAllFromDB(filters, options);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "status Request fetched successfully",
    meta: result.meta,
    data: result.data,
  });
});

const getByIdFromDB = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const parseId = parseInt(id);
  const result = await StatusService.getByIdFromDB(parseId);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "status Request fetched successfully",
    data: result,
  });
});

const deleteFromDB = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await StatusService.deleteByIdFromDB(id);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "status Request deleted successfully",
    data: result,
  });
});

// updateOneInDB
export const StatusController = {
  insertIntoDB,
  getAllFromDB,

  getByIdFromDB,

  deleteFromDB,
};
