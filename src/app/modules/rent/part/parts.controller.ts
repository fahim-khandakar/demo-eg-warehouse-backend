import { Request, Response } from "express";
import { paginationFields } from "../../../../constants/pagination";
import catchAsync from "../../../../shared/catchAsync";
import pick from "../../../../shared/pick";
import sendResponse from "../../../../shared/sendResponse";
import { partsFilterableFields } from "./parts.constants";
import { PartService } from "./parts.service";

const insertIntoDB = catchAsync(async (req: Request, res: Response) => {
  const result = await PartService.MultiInsertIntoDB(req.body);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: " part created successfully",
    data: result,
  });
});

const MultipleInsertIntoDB = catchAsync(async (req: Request, res: Response) => {
  const result = await PartService.insertIntoDB(req.body);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "muliple part created successfully",
    data: result,
  });
});

const getAllFromDB = catchAsync(async (req: Request, res: Response) => {
  const filters = pick(req.query, partsFilterableFields);
  const options = pick(req.query, paginationFields);
  const result = await PartService.getAllFromDB(filters, options);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "part fetched successfully",
    meta: result.meta,
    data: result.data,
  });
});

const updateOneInDB = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await PartService.updateOneInDB(id, req.body);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "part update successfully",
    data: result,
  });
});

const getByIdFromDB = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const parseId = parseInt(id);
  const result = await PartService.getByIdFromDB(parseId);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "part fetched successfully",
    data: result,
  });
});
const getPartAvailableByIdFromDB = catchAsync(
  async (req: Request, res: Response) => {
    const { id } = req.params;
    const parseId = parseInt(id);
    const result = await PartService.getPartAvailableByIdFromDB(parseId);
    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "part available fetched successfully",
      data: result,
    });
  },
);

const deleteByIdFromDB = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await PartService.deleteByIdFromDB(id);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "partner deleted successfully",
    data: result,
  });
});

export const PartController = {
  insertIntoDB,
  MultipleInsertIntoDB,
  getAllFromDB,
  updateOneInDB,
  getByIdFromDB,
  getPartAvailableByIdFromDB,
  deleteByIdFromDB,
};
