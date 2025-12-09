import { Request, Response } from "express";
import fs from "fs";
//
import { paginationFields } from "../../../../constants/pagination";
import catchAsync from "../../../../shared/catchAsync";
import pick from "../../../../shared/pick";
import sendResponse from "../../../../shared/sendResponse";
import { shipmentListFilterableFields } from "./shipmentList.constaints";
import { ShipmentListService } from "./shipmentList.service";
import { exportToExcel } from "./ShipmentList.utils";

const insertIntoDB = catchAsync(async (req: Request, res: Response) => {
  const result = await ShipmentListService.insertIntoDB(req.body);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "shipment created successfully",
    data: result,
  });
});
const insertIntoReturnPodDB = catchAsync(
  async (req: Request, res: Response) => {
    const result = await ShipmentListService.PODReturnInsertIntoDB(req.body);
    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "shipment created successfully",
      data: result,
    });
  },
);

const insertIntoDbByFile = catchAsync(async (req: Request, res: Response) => {
  const result = await ShipmentListService.insertIntoDbByFile(req.body);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "shipment by file created successfully",
    data: result,
  });
});

const getAllFromDB = catchAsync(async (req: Request, res: Response) => {
  const filters = pick(req.query, shipmentListFilterableFields);
  const options = pick(req.query, paginationFields);
  const result = await ShipmentListService.getAllFromDB(filters, options);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "shipment fetched successfully",
    meta: result.meta,
    data: result.data,
  });
});

const getByIdFromDB = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const parseId = parseInt(id);
  const result = await ShipmentListService.getByIdFromDB(parseId);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "shipment fetched successfully",
    data: result,
  });
});

const updateOneInDB = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await ShipmentListService.updateOneInDB(id, req.body);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "shipment update successfully",
    data: result,
  });
});

const deleteFromDB = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await ShipmentListService.deleteByIdFromDB(id);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "shipment deleted successfully",
    data: result,
  });
});

const getShipmentData = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const parseId = parseInt(id);
  const Inventory = await ShipmentListService.getPodFromDB(parseId);
  const excelFilePath = await exportToExcel(Inventory);
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

export const ShipmentController = {
  insertIntoDB,
  insertIntoDbByFile,
  insertIntoReturnPodDB,
  getShipmentData,
  getAllFromDB,
  getByIdFromDB,
  updateOneInDB,
  deleteFromDB,
};
