import { Request, Response } from "express";
import { paginationFields } from "../../../../constants/pagination";
import catchAsync from "../../../../shared/catchAsync";
import pick from "../../../../shared/pick";
import sendResponse from "../../../../shared/sendResponse";
import { shipmentReceiptFilterableFields } from "./receipt.constaints";
import { ReceiptService } from "./receipt.service";

const insertIntoDB = catchAsync(async (req: Request, res: Response) => {
  const result = await ReceiptService.insertIntoDB(req.body.eventIds);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Receipt created successfully",
    data: result,
  });
});

const getAllFromDB = catchAsync(async (req: Request, res: Response) => {
  const filters = pick(req.query, shipmentReceiptFilterableFields);
  const options = pick(req.query, paginationFields);
  const result = await ReceiptService.getAllFromDB(filters, options);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Receipt fetched successfully",
    meta: result.meta,
    data: result.data,
  });
});

const getByIdFromDB = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const parseId = parseInt(id);
  const result = await ReceiptService.getByIdFromDB(parseId);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Receipt fetched successfully",
    data: result,
  });
});

const updateOneInDB = catchAsync(async (req: Request, res: Response) => {
  const id = parseInt(req.params.id);
  if (!id || isNaN(Number(id))) {
    throw new Error("Invalid Receipt ID");
  }
  const result = await ReceiptService.updateOneInDB(id, req.body.eventIds);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Receipt update successfully",
    data: result,
  });
});

const deleteFromDB = catchAsync(async (req: Request, res: Response) => {
  const id = parseInt(req.params.id);
  if (!id || isNaN(Number(id))) {
    throw new Error("Invalid Receipt ID");
  }
  const result = await ReceiptService.deleteFromDB(id);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Receipt deleted successfully",
    data: result,
  });
});
export const ReceiptsController = {
  insertIntoDB,
  getAllFromDB,
  getByIdFromDB,
  updateOneInDB,
  deleteFromDB,
};
