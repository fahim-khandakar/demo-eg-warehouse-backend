import { Request, Response } from "express";
import { JwtPayload } from "jsonwebtoken";
import { paginationFields } from "../../../../constants/pagination";
import catchAsync from "../../../../shared/catchAsync";
import pick from "../../../../shared/pick";
import sendResponse from "../../../../shared/sendResponse";
import { PartRequestFilterableFields } from "./partnerRequest.constaints";
import { PartnerPartRequestService } from "./partnerRequest.service";

const insertIntoDB = catchAsync(async (req: Request, res: Response) => {
  req.body.partnerId = req.user?.id;
  const result = await PartnerPartRequestService.insertIntoDB(req.body);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "customer Request created successfully",
    data: result,
  });
});

const updatePartRequestStatus = catchAsync(
  async (req: Request, res: Response) => {
    const { id } = req.params;
    const parseId = parseInt(id);
    const statusId = req?.body?.statusId;
    const customerStatusId = req?.body?.customerStatusId;
    const result = await PartnerPartRequestService.updatePartRequestStatus(
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
  },
);

const ApproveRequest = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const parseId = parseInt(id);
  const locationId = req.body.locationid;
  const poll = req.body.poll;
  const result = await PartnerPartRequestService.approveRequest(
    parseId,
    locationId,
    poll,
  );
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "customer Request approve successfully",
    data: result,
  });
});

const getAllFromDB = catchAsync(async (req: Request, res: Response) => {
  const filters = pick(req.query, PartRequestFilterableFields);
  const options = pick(req.query, paginationFields);
  const result = await PartnerPartRequestService.getAllFromDB(filters, options);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "customer Request fetched successfully",
    meta: result.meta,
    data: result.data,
  });
});
const getMyOrdersFromDB = catchAsync(async (req: Request, res: Response) => {
  const filters = pick(req.query, PartRequestFilterableFields);
  const options = pick(req.query, paginationFields);
  const user = req.user;
  const result = await PartnerPartRequestService.getMyOrdersFromDB(
    filters,
    options,
    user as JwtPayload,
  );
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "customer Request fetched successfully",
    meta: result.meta,
    data: result.data,
  });
});
const getMyCompanyOrdersFromDB = catchAsync(
  async (req: Request, res: Response) => {
    const filters = pick(req.query, PartRequestFilterableFields);
    const options = pick(req.query, paginationFields);
    const user = req.user;
    const result = await PartnerPartRequestService.getMyCompanyOrdersFromDB(
      filters,
      options,
      user as JwtPayload,
    );
    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "customer Request fetched successfully",
      meta: result.meta,
      data: result.data,
    });
  },
);

const getByIdFromDB = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const parseId = parseInt(id);
  const result = await PartnerPartRequestService.getByIdFromDB(parseId);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "customer Request fetched successfully",
    data: result,
  });
});
const getMyOrderByIdFromDB = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const parseId = parseInt(id);
  const user = req.user;
  const result = await PartnerPartRequestService.getMyOrderByIdFromDB(
    parseId,
    user as JwtPayload,
  );
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "customer Request fetched successfully",
    data: result,
  });
});

const deleteFromDB = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await PartnerPartRequestService.deleteByIdFromDB(id);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "customer Request deleted successfully",
    data: result,
  });
});
const deleteMyOrderByIdFromDB = catchAsync(
  async (req: Request, res: Response) => {
    const { id } = req.params;
    const user = req.user;
    const result = await PartnerPartRequestService.deleteMyOrderByIdFromDB(
      id,
      user as JwtPayload,
    );
    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "customer Request deleted successfully",
      data: result,
    });
  },
);

const updateOneInDB = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await PartnerPartRequestService.updateOneInDB(id, req.body);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "customer Request update successfully",
    data: result,
  });
});

// updateOneInDB
export const OrderRequestController = {
  insertIntoDB,
  ApproveRequest,
  getAllFromDB,
  getMyOrdersFromDB,
  deleteMyOrderByIdFromDB,
  getMyCompanyOrdersFromDB,
  getByIdFromDB,
  getMyOrderByIdFromDB,
  updateOneInDB,
  deleteFromDB,
  updatePartRequestStatus,
};
