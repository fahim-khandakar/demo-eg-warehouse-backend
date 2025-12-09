import { Request, Response } from "express";
import { JwtPayload } from "jsonwebtoken";
import { paginationFields } from "../../../constants/pagination";
import catchAsync from "../../../shared/catchAsync";
import pick from "../../../shared/pick";
import sendResponse from "../../../shared/sendResponse";
import { partnerFilterableFields } from "./partner.constaints";
import { PartnerService } from "./partner.service";

const insertIntoDB = catchAsync(async (req: Request, res: Response) => {
  const result = await PartnerService.insertIntoDB(req.body);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "partner created successfully",
    data: result,
  });
});

const SenderInsertIntoDB = catchAsync(async (req: Request, res: Response) => {
  const result = await PartnerService.SenderInsertIntoDB(req.body);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "send to created successfully",
    data: result,
  });
});

const getAllFromDB = catchAsync(async (req: Request, res: Response) => {
  const filters = pick(req.query, partnerFilterableFields);
  const options = pick(req.query, paginationFields);
  const result = await PartnerService.getAllFromDB(filters, options);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "partner fetched successfully",
    meta: result.meta,
    data: result.data,
  });
});

const updateOneInDB = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await PartnerService.updateOneInDB(id, req.body);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "partner update successfully",
    data: result,
  });
});
const updateMyProfileInDB = catchAsync(async (req: Request, res: Response) => {
  const user = req.user;
  const result = await PartnerService.updateMyProfileInDB(
    user as JwtPayload,
    req.body,
  );
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "partner update successfully",
    data: result,
  });
});

const getShipToFromDB = catchAsync(async (req: Request, res: Response) => {
  const result = await PartnerService.getShipToFromDB();
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "send to fetch successfully",
    data: result,
  });
});
const getByIdFromDB = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const parseId = parseInt(id);
  const result = await PartnerService.getByIdFromDB(parseId);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "partner fetched successfully",
    data: result,
  });
});
const getMyProfileByIdFromDB = catchAsync(
  async (req: Request, res: Response) => {
    const user = req.user;
    const result = await PartnerService.getMyProfileByIdFromDB(
      user as JwtPayload,
    );
    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "partner fetched successfully",
      data: result,
    });
  },
);
const deleteFromDB = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const parseId = parseInt(id);
  const result = await PartnerService.deleteFromDB(parseId);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "partner deleted successfully",
    data: result,
  });
});

export const partnerController = {
  insertIntoDB,
  getAllFromDB,
  getByIdFromDB,
  updateOneInDB,
  SenderInsertIntoDB,
  getShipToFromDB,
  updateMyProfileInDB,
  getMyProfileByIdFromDB,
  // updateIntoDB,
  deleteFromDB,
};
