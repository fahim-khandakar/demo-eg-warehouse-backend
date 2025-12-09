import { Request, Response } from "express";
import { paginationFields } from "../../../../constants/pagination";
import catchAsync from "../../../../shared/catchAsync";
import pick from "../../../../shared/pick";
import sendResponse from "../../../../shared/sendResponse";
import { warehouseFilterableFields } from "./warehouse.constaints";
import { warehouseService } from "./warehouse.service";

const insertIntoDB = catchAsync(async (req: Request, res: Response) => {
  const result = await warehouseService.insertIntoDB(req.body);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "warehouse created successfully",
    data: result,
  });
});

const insertIntoDBMultiple = catchAsync(async (req: Request, res: Response) => {
  const result = await warehouseService.insertIntoDBMultiple(req.body);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "warehouse created successfully",
    data: result,
  });
});

const insertIntoDbStatus = catchAsync(async (req: Request, res: Response) => {
  const result = await warehouseService.insertIntoDbStatus(req.body);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "status created successfully",
    data: result,
  });
});

const getAllFromDB = catchAsync(async (req: Request, res: Response) => {
  const filters = pick(req.query, warehouseFilterableFields);
  const options = pick(req.query, paginationFields);
  const result = await warehouseService.getAllFromDB(filters, options);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "warehouse fetched successfully",
    meta: result.meta,
    data: result.data,
  });
});
const getStatusFromDB = catchAsync(async (req: Request, res: Response) => {
  const result = await warehouseService.getStatusFromDB();
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "status fetched successfully",
    data: result,
  });
});

const getByIdFromDB = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const parseId = parseInt(id);
  const filters = pick(req.query, warehouseFilterableFields);
  const options = pick(req.query, paginationFields);
  const result = await warehouseService.getInventoryWithLocation(
    parseId,
    filters,
    options,
  );
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "warehouse fetched successfully",
    data: result,
  });
});

const updateOneInDB = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await warehouseService.updateOneInDB(id, req.body);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "warehouse update successfully",
    data: result,
  });
});

// const deleteFromDB = catchAsync(async (req: Request, res: Response) => {
//   const { id } = req.params;
//   const result = await warehouseService.deleteByIdFromDB(id);
//   sendResponse(res, {
//     statusCode: 200,
//     success: true,
//     message: "warehouse deleted successfully",
//     data: result,
//   });
// });

export const WarehouseController = {
  insertIntoDB,
  getAllFromDB,
  getByIdFromDB,
  insertIntoDbStatus,
  getStatusFromDB,
  insertIntoDBMultiple,
  updateOneInDB,
  // getByIdFromDB,
  // updateIntoDB,
  // deleteFromDB,
};
