import { Request, Response } from "express";
//internal
import { paginationFields } from "../../../constants/pagination";
import catchAsync from "../../../shared/catchAsync";
import pick from "../../../shared/pick";
import sendResponse from "../../../shared/sendResponse";
import { AnalystPODService } from "./analyst.pod.sevice";
import { AnalystService } from "./analyst.service";

const getAnalystLoan = catchAsync(async (req: Request, res: Response) => {
  const startDate = req.query.startDate
    ? new Date(req.query.startDate as string)
    : undefined;
  const endDate = req.query.endDate
    ? new Date(req.query.endDate as string)
    : undefined;
  //get from database
  const result = await AnalystService.getLoanAnalystFromDB(startDate, endDate);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Loan Analyst Fetch successfully2",
    data: result,
  });
});

const getAnalystForPOD = catchAsync(async (req: Request, res: Response) => {
  const startDate = req.query.startDate
    ? new Date(req.query.startDate as string)
    : undefined;
  const endDate = req.query.endDate
    ? new Date(req.query.endDate as string)
    : undefined;
  //get from database
  const result = await AnalystPODService.getPODAnalystFromDB(
    startDate,
    endDate,
  );
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "shipment Analyst Fetch successfully",
    data: result,
  });
});

const getPartnerOrderAnalystFromDB = catchAsync(
  async (req: Request, res: Response) => {
    const id = req.user?.id;
    const startDate = req.query.startDate
      ? new Date(req.query.startDate as string)
      : undefined;
    const endDate = req.query.endDate
      ? new Date(req.query.endDate as string)
      : undefined;
    //get from database
    const result = await AnalystService.getPartnerOrderAnalystFromDB(
      parseInt(id),
      startDate,
      endDate,
    );
    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "partner Loan Analyst Fetch successfully",
      data: result,
    });
  },
);
const getPartnerEventAnalystFromDB = catchAsync(
  async (req: Request, res: Response) => {
    const id = req.user?.id;

    const startDate = req.query.startDate
      ? new Date(req.query.startDate as string)
      : undefined;
    const endDate = req.query.endDate
      ? new Date(req.query.endDate as string)
      : undefined;
    //get from database
    const result = await AnalystService.getPartnerEventAnalystFromDB(
      parseInt(id),
      startDate,
      endDate,
    );
    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "partner event Analyst Fetch successfully",
      data: result,
    });
  },
);

const getPODAnalystFromDB = catchAsync(async (req: Request, res: Response) => {
  const analyst = await AnalystPODService.getPODAnalystFromDB();
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "POD Analyst Fetch successfully",
    data: {
      analyst,
    },
  });
});

const getAllShipmentStatusAnalytics = catchAsync(
  async (req: Request, res: Response) => {
    const pending = await AnalystPODService.getShipmentPendingStatusAnalytics();
    const closed = await AnalystPODService.getShipmentClosedStatusAnalytics();
    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "POD Shipmnet  analyst successfully",
      data: {
        pending,
        closed,
      },
    });
  },
);
const getShipmentCompletedAnalytics = catchAsync(
  async (req: Request, res: Response) => {
    const result = await AnalystPODService.getShipmentTypeStatus7Analytics();

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "POD Shipmnet  analyst successfully",
      data: result,
    });
  },
);

const getPartnerActivity = catchAsync(async (req: Request, res: Response) => {
  const logs = await AnalystService.partnerData();
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "successfully",
    data: logs,
  });
});
const getPODPartnerActivity = catchAsync(
  async (req: Request, res: Response) => {
    const logs = await AnalystPODService.partnerData();
    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "successfully",
      data: logs,
    });
  },
);

const getMostOrderFromDB = catchAsync(async (req: Request, res: Response) => {
  const options = pick(req.query, paginationFields);
  const logs = await AnalystService.getMostOrderedPartsWithNames(options);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "fetched successfully",
    data: logs,
  });
});
const getOldOrdersFromDB = catchAsync(async (req: Request, res: Response) => {
  const options = pick(req.query, paginationFields);
  const logs = await AnalystService.getLongOpenOrders(130, options);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "fetched successfully",
    data: logs,
  });
});
const getCustomerRequestAnalytics = catchAsync(
  async (req: Request, res: Response) => {
    const logs = await AnalystService.getCustomerRequestAnalytics();
    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "fetched successfully",
      data: logs,
    });
  },
);

const getActivityLogs = catchAsync(async (req: Request, res: Response) => {
  const options = pick(req.query, paginationFields);
  const logs = await AnalystService.getUserActivityLogs(options);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "User activity logs fetched successfully",
    data: logs,
  });
});

const getMyActivityLogs = catchAsync(async (req: Request, res: Response) => {
  const userId = req?.user?.id;
  const options = pick(req.query, paginationFields);
  const logs = await AnalystService.getMyActivityLogs(
    parseInt(userId),
    options,
  );

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "User activity logs fetched successfully",
    data: logs,
  });
});

export const AnalystController = {
  getAnalystLoan,
  getAnalystForPOD,
  getPODPartnerActivity,
  getActivityLogs,
  getMyActivityLogs,
  getPartnerEventAnalystFromDB,
  getPartnerOrderAnalystFromDB,
  getPartnerActivity,
  getMostOrderFromDB,
  getOldOrdersFromDB,
  getCustomerRequestAnalytics,
  getPODAnalystFromDB,
  getAllShipmentStatusAnalytics,
  getShipmentCompletedAnalytics,
};
