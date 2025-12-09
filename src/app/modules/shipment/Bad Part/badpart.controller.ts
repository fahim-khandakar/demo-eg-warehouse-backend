import { Request, Response } from "express";
import { paginationFields } from "../../../../constants/pagination";
import catchAsync from "../../../../shared/catchAsync";
import pick from "../../../../shared/pick";
import sendResponse from "../../../../shared/sendResponse";
import { BadPartEventFilterableFields } from "./badpart.constaints";
import { BadPartEventService } from "./badpart.service";

const insertIntoDB = catchAsync(async (req: Request, res: Response) => {
  const result = await BadPartEventService.insertIntoDB(req.body);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Bad Part Return created successfully",
    data: result,
  });
});

const getAllFromDB = catchAsync(async (req: Request, res: Response) => {
  const filters = pick(req.query, BadPartEventFilterableFields);
  const options = pick(req.query, paginationFields);
  const startDate = req.query.startDate
    ? new Date(req.query.startDate as string)
    : undefined;
  const endDate = req.query.endDate
    ? new Date(req.query.endDate as string)
    : undefined;

  const endDatePlusOne = endDate
    ? new Date(new Date(endDate).setDate(endDate.getDate() + 2))
    : undefined;

  const result = await BadPartEventService.getAllFromDB(
    filters,
    options,
    startDate,
    endDatePlusOne,
  );
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Bad Part Return fetched successfully",
    meta: result.meta,
    data: result.data,
  });
});
const getmultipleFromDB = catchAsync(async (req: Request, res: Response) => {
  const result = await BadPartEventService.getMultipleFromDB(req.body.ids);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Bad Part Return selected items fetched successfully",
    meta: result.meta,
    data: result.data,
  });
});

const getByIdFromDB = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const parseId = parseInt(id);
  const result = await BadPartEventService.getByIdFromDB(parseId);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Bad Part Return fetched successfully",
    data: result,
  });
});

const updateOneInDB = catchAsync(async (req: Request, res: Response) => {
  const id = parseInt(req.params.id);
  if (!id || isNaN(Number(id))) {
    throw new Error("Invalid Receipt ID");
  }

  const result = await BadPartEventService.updateOneInDB(id, req.body);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Bad Part Return update successfully",
    data: result,
  });
});

export const BadPartEventsController = {
  insertIntoDB,
  getAllFromDB,
  getmultipleFromDB,
  getByIdFromDB,
  updateOneInDB,
};
