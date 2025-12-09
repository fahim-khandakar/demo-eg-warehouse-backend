import { Request, Response } from "express";
import { JwtPayload } from "jsonwebtoken";
import { paginationFields } from "../../../../constants/pagination";
import catchAsync from "../../../../shared/catchAsync";
import pick from "../../../../shared/pick";
import sendResponse from "../../../../shared/sendResponse";
import { shipmentEventFilterableFields } from "./shipmentEvent.constaints";
import { EventService } from "./shipmentEvent.service";

const insertIntoDB = catchAsync(async (req: Request, res: Response) => {
  const result = await EventService.insertIntoDB(req.body);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "event created successfully",
    data: result,
  });
});

const getAllFromDB = catchAsync(async (req: Request, res: Response) => {
  const filters = pick(req.query, shipmentEventFilterableFields);
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

  const result = await EventService.getAllFromDB(
    filters,
    options,
    startDate,
    endDatePlusOne,
  );
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Event fetched successfully",
    meta: result.meta,
    data: result.data,
  });
});

const getMyAllFromDB = catchAsync(async (req: Request, res: Response) => {
  const filters = pick(req.query, shipmentEventFilterableFields);
  const options = pick(req.query, paginationFields);
  const user = req.user;
  const result = await EventService.getMyAllFromDB(
    filters,
    options,
    user as JwtPayload,
  );
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Event fetched successfully",
    meta: result.meta,
    data: result.data,
  });
});

const getByIdFromDB = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const parseId = parseInt(id);
  const result = await EventService.getByIdFromDB(parseId);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Event fetched successfully",
    data: result,
  });
});

const updateOneInDB = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await EventService.updateOneInDB(id, req.body);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Event update successfully",
    data: result,
  });
});

// const getInventoryData = catchAsync(async (req: Request, res: Response) => {
//   const options = pick(req.query, paginationFields);
//   const Inventory = await InventoryService.getInventoryFromDB(options);
//   const excelFilePath = await exportToExcel(Inventory.data);
//   res.setHeader(
//     "Content-Type",
//     "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
//   );
//   res.setHeader(
//     "Content-Disposition",
//     "attachment; filename=Inventory_data.xlsx",
//   );

//   res.sendFile(excelFilePath, () => {
//     fs.unlinkSync(excelFilePath);
//   });
// });

export const EventController = {
  insertIntoDB,
  getAllFromDB,
  getByIdFromDB,
  getMyAllFromDB,
  updateOneInDB,
  //   deleteFromDB,
};
