import { Request, Response } from "express";
import fs from "fs";
import { JwtPayload } from "jsonwebtoken";
//internal
import { paginationFields } from "../../../../constants/pagination";
import catchAsync from "../../../../shared/catchAsync";
import pick from "../../../../shared/pick";
import sendResponse from "../../../../shared/sendResponse";
import { orderFilterableFields } from "./order.constaints";
import { OrderService } from "./order.service";
import { exportToExcel } from "./order.utils";

const insertIntoDB = catchAsync(async (req: Request, res: Response) => {
  const result = await OrderService.insertIntoDB(req.body);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "order created successfully",
    data: result,
  });
});
const updateOrderStatus = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const parseId = parseInt(id);
  const statusId = req?.body?.statusId;
  const customerStatusId = req?.body?.customerStatusId;
  const result = await OrderService.updateOrderStatus(
    parseId,
    statusId,
    customerStatusId,
  );
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Status changed successfully",
    data: result,
  });
});

const getAllFromDB = catchAsync(async (req: Request, res: Response) => {
  const filters = pick(req.query, orderFilterableFields);
  const options = pick(req.query, paginationFields);
  const result = await OrderService.getAllFromDB(filters, options);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "order fetched successfully",
    meta: result.meta,
    data: result.data,
  });
});

const getMyAllFromDB = catchAsync(async (req: Request, res: Response) => {
  const filters = pick(req.query, orderFilterableFields);
  const options = pick(req.query, paginationFields);
  const user = req.user;
  const result = await OrderService.getMyAllFromDB(
    filters,
    options,
    user as JwtPayload,
  );
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: " order fetched successfully",
    meta: result.meta,
    data: result.data,
  });
});

const getOrderData = catchAsync(async (req: Request, res: Response) => {
  const startDate = req.query.startDate
    ? new Date(req.query.startDate as string).toISOString()
    : undefined;
  const endDate = req.query.endDate
    ? new Date(req.query.endDate as string).toISOString()
    : undefined;
  const options = pick(req.query, paginationFields);
  const order = await OrderService.getOrderFromDB(options, startDate, endDate);
  const excelFilePath = await exportToExcel(order.data);
  res.setHeader(
    "Content-Type",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  );
  res.setHeader(
    "Content-Disposition",
    "attachment; filename=Order_data(HPE).xlsx",
  );

  res.sendFile(excelFilePath, () => {
    fs.unlinkSync(excelFilePath);
  });
});

const getPartsFromDB = catchAsync(async (req: Request, res: Response) => {
  const filters = pick(req.query, orderFilterableFields);
  const options = pick(req.query, paginationFields);
  const result = await OrderService.getPartsFromDB(filters, options);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "order parts fetched successfully",
    meta: result.meta,
    data: result.data,
  });
});

const getByIdFromDB = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const parseId = parseInt(id);
  const result = await OrderService.getByIdFromDB(parseId);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "order fetched successfully",
    data: result,
  });
});

const deleteFromDB = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await OrderService.deleteByIdFromDB(id);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "order deleted successfully",
    data: result,
  });
});

const updateOneInDB = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await OrderService.updateOneInDB(parseInt(id), req.body);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "order update successfully",
    data: result,
  });
});

// updateOneInDB
export const OrderController = {
  insertIntoDB,
  updateOrderStatus,
  getAllFromDB,
  getMyAllFromDB,
  getByIdFromDB,
  getPartsFromDB,
  updateOneInDB,
  deleteFromDB,
  getOrderData,
};
