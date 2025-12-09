import { Prisma, Status } from "@prisma/client";
import ApiError from "../../../errors/ApiError";
import { paginationHelpers } from "../../../helpers/paginationHelper";
import { IPaginationOptions } from "../../../interfaces/pagination";
import prisma from "../../../shared/prisma";
import { StatusSearchableFields } from "./status.constaints";
import { IStatusCreatedEvent, IStatusFilterRequest } from "./status.interface";

const insertIntoDB = async (data: IStatusCreatedEvent): Promise<Status> => {
  try {
    const total = await prisma.status.count();
    const result = await prisma.status.create({
      data: {
        id: total + 1,
        name: data.name,
      },
    });

    return result;
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      const field = (error.meta?.target as string[])?.join(", ") || "field";
      throw new ApiError(409, `Duplicate entry: ${field} must be unique.`);
    }
    throw new ApiError(500, (error as Error).message);
  }
};

const getAllFromDB = async (
  filters: IStatusFilterRequest,
  options: IPaginationOptions,
) => {
  const { page, limit, skip } = paginationHelpers.calculatePagination(options);
  const { searchTerm } = filters;

  const andConditions = [];

  if (searchTerm) {
    andConditions.push({
      OR: StatusSearchableFields.map(field => ({
        [field]: {
          contains: searchTerm,
          mode: "insensitive",
        },
      })),
    });
  }

  const whereConditons: Prisma.StatusWhereInput =
    andConditions.length > 0 ? { AND: andConditions } : {};

  const result = await prisma.status.findMany({
    where: whereConditons,
    select: {
      id: true,
      name: true,
    },

    skip,
    take: limit,
    orderBy:
      options.sortBy && options.sortOrder
        ? { [options.sortBy]: options.sortOrder }
        : { id: "asc" },
  });
  const total = await prisma.customerRequest.count({
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

const getByIdFromDB = async (id: number) => {
  const result = await prisma.status.findUnique({
    where: {
      id,
    },
    select: {
      id: true,
      name: true,
    },
  });
  return result;
};

const deleteByIdFromDB = async (id: string): Promise<Status | null> => {
  const statusId = parseInt(id);

  const deletedOrder = await prisma.$transaction(async prisma => {
    await prisma.status.deleteMany({
      where: {
        id: statusId,
      },
    });

    const order = await prisma.status.delete({
      where: {
        id: statusId,
      },
    });

    return order;
  });

  return deletedOrder;
};

export const StatusService = {
  insertIntoDB,
  getAllFromDB,

  getByIdFromDB,
  deleteByIdFromDB,
};
