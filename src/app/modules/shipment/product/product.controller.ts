import { Request, Response } from "express";
// internal
import { paginationFields } from "../../../../constants/pagination";
import catchAsync from "../../../../shared/catchAsync";
import pick from "../../../../shared/pick";
import sendResponse from "../../../../shared/sendResponse";
import { productFilterableFields } from "./product.constaints";
import { ProductService } from "./product.service";

const insertIntoDB = catchAsync(async (req: Request, res: Response) => {
  const result = await ProductService.insertIntoDB(req.body);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "product created successfully",
    data: result,
  });
});

const getAllFromDB = catchAsync(async (req: Request, res: Response) => {
  const filters = pick(req.query, productFilterableFields);
  const options = pick(req.query, paginationFields);
  const result = await ProductService.getAllFromDB(filters, options);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "product fetched successfully",
    meta: result.meta,
    data: result.data,
  });
});

const getByIdFromDB = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const parseId = parseInt(id);
  const result = await ProductService.getByIdFromDB(parseId);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "product fetched successfully",
    data: result,
  });
});

const updateOneInDB = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await ProductService.updateOneInDB(id, req.body);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "product update successfully",
    data: result,
  });
});
// const deleteFromDB = catchAsync(async (req: Request, res: Response) => {
//   const { id } = req.params;
//   const result = await ProductService.deleteFromDB(id);
//   sendResponse(res, {
//     statusCode: 200,
//     success: true,
//     message: "product deleted successfully",
//     data: result,
//   });
// });

export const ProductController = {
  insertIntoDB,
  getAllFromDB,
  getByIdFromDB,
  //   getByIdFromDB,
  updateOneInDB,
  //   deleteFro mDB,
};
