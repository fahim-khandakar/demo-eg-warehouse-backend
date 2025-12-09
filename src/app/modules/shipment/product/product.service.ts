import { Prisma, Product } from "@prisma/client";
import { paginationHelpers } from "../../../../helpers/paginationHelper";
import { IGenericResponse } from "../../../../interfaces/common";
import { IPaginationOptions } from "../../../../interfaces/pagination";
import prisma from "../../../../shared/prisma";
import { productSearchableFields } from "./product.constaints";
import { IProductFilterRequest } from "./product.interface";

const insertIntoDB = async (data: Product): Promise<Product> => {
  const result = await prisma.product.create({
    data,
  });
  return result;
};

const getAllFromDB = async (
  filters: IProductFilterRequest,
  options: IPaginationOptions,
): Promise<IGenericResponse<Product[]>> => {
  const { page, limit, skip } = paginationHelpers.calculatePagination(options);
  const { searchTerm } = filters;

  const andConditions = [];

  if (searchTerm) {
    andConditions.push({
      OR: productSearchableFields.map(field => ({
        [field]: {
          contains: searchTerm,
          mode: "insensitive",
        },
      })),
    });
  }

  const whereConditons: Prisma.ProductWhereInput =
    andConditions.length > 0 ? { AND: andConditions } : {};

  const result = await prisma.product.findMany({
    skip,
    take: limit,
    where: whereConditons,
    orderBy:
      options.sortBy && options.sortOrder
        ? {
            [options.sortBy]: options.sortOrder,
          }
        : {
            createdAt: "desc",
          },
  });
  const total = await prisma.product.count({
    where: whereConditons,
  });

  return {
    meta: {
      page,
      limit,
      total,
    },
    data: result,
  };
};

const updateOneInDB = async (
  id: string,
  payload: Partial<Product>,
): Promise<Product> => {
  const result = await prisma.product.update({
    where: {
      id: parseInt(id),
    },
    data: payload,
  });
  return result;
};

const getByIdFromDB = async (id: number): Promise<Product | null> => {
  // const result = await prisma.product.findUnique({
  //   where: {
  //     id,
  //   },
  // });
  const result = await prisma.product.findUnique({
    where: { id: id },
    include: {
      events: {
        select: {
          shipment: true,
        },
        distinct: ["shipmentId"],
      },
    },
  });

  return result;
};

export const ProductService = {
  insertIntoDB,
  getAllFromDB,
  updateOneInDB,
  getByIdFromDB,
};
