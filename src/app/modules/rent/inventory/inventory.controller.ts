import { Request, Response } from "express";
import fs from "fs";
//internal
import { paginationFields } from "../../../../constants/pagination";
import catchAsync from "../../../../shared/catchAsync";
import pick from "../../../../shared/pick";
import sendResponse from "../../../../shared/sendResponse";
import {
  inventoryFilterableFields,
  inventoryLogsFilterableFields,
} from "./inventory.constaints";
import { InventoryService } from "./inventory.service";
import { exportToExcel } from "./inventory.utils";

const insertIntoDB = catchAsync(async (req: Request, res: Response) => {
  const result = await InventoryService.insertIntoDB(req.body);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "inventory created successfully",
    data: result,
  });
});
const insertMultipleIntoDB = catchAsync(async (req: Request, res: Response) => {
  const result = await InventoryService.insertMultipleIntoDB(req.body);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "multi inventory created successfully",
    data: result,
  });
});

const getAllFromDB = catchAsync(async (req: Request, res: Response) => {
  const filters = pick(req.query, inventoryFilterableFields);
  const options = pick(req.query, paginationFields);
  const result = await InventoryService.getAllFromDB(filters, options);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "inventory fetched successfully",
    meta: result.meta,
    data: result.data,
  });
});

const getInventoryData = catchAsync(async (req: Request, res: Response) => {
  const options = pick(req.query, paginationFields);
  const Inventory = await InventoryService.getInventoryFromDB(options);
  const excelFilePath = await exportToExcel(Inventory.data);
  res.setHeader(
    "Content-Type",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  );
  res.setHeader(
    "Content-Disposition",
    "attachment; filename=Inventory_data.xlsx",
  );

  res.sendFile(excelFilePath, () => {
    fs.unlinkSync(excelFilePath);
  });
});

const getStocksAllFromDB = catchAsync(async (req: Request, res: Response) => {
  const filters = pick(req.query, inventoryLogsFilterableFields);
  const options = pick(req.query, paginationFields);
  const result = await InventoryService.getStocksAllFromDB(filters, options);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "inventory fetched successfully",
    meta: result.meta,
    data: result.data,
  });
});

const getByIdFromDB = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const parseId = parseInt(id);
  const result = await InventoryService.getByIdFromDB(parseId);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "inventory fetched successfully",
    data: result,
  });
});
const getStockByIdFromDB = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const parseId = parseInt(id);
  const result = await InventoryService.getStockByIdFromDB(parseId);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "inventory stock fetched successfully",
    data: result,
  });
});

const updateOneInDB = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await InventoryService.updateOneInDB(id, req.body);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "part update successfully",
    data: result,
  });
});
const updateLogOneInDB = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await InventoryService.updateInventoryLog(
    parseInt(id),
    req.body,
  );
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "logs update successfully",
    data: result,
  });
});

const deleteInventoryFromDB = catchAsync(
  async (req: Request, res: Response) => {
    const { id } = req.params;
    const inventoryId = parseInt(id);
    const result =
      await InventoryService.deleteInventoryByIdFromDB(inventoryId);
    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "Inventory deleted successfully",
      data: result,
    });
  },
);
const deleteInventoryLogFromDB = catchAsync(
  async (req: Request, res: Response) => {
    const { id } = req.params;
    const inventoryId = parseInt(id);
    const result =
      await InventoryService.deleteInventoryLogByIdFromDB(inventoryId);
    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "Inventory log deleted successfully",
      data: result,
    });
  },
);

export const InventoryController = {
  insertIntoDB,
  insertMultipleIntoDB,
  getAllFromDB,
  getStocksAllFromDB,
  getByIdFromDB,
  getStockByIdFromDB,
  updateOneInDB,
  updateLogOneInDB,
  getInventoryData,
  deleteInventoryFromDB,
  deleteInventoryLogFromDB,
};
