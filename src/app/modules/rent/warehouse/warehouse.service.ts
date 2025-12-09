import { Location, Prisma, Status } from "@prisma/client";
import { paginationHelpers } from "../../../../helpers/paginationHelper";
import { IGenericResponse } from "../../../../interfaces/common";
import { IPaginationOptions } from "../../../../interfaces/pagination";
import prisma from "../../../../shared/prisma";
import {
  warehouseInventorySearchableFields,
  warehouseSearchableFields,
} from "./warehouse.constaints";
import { IWarehouseFilterRequest } from "./warehouse.interface";

const insertIntoDB = async (data: Location): Promise<Location> => {
  const result = await prisma.location.create({
    data,
  });
  return result;
};
const insertIntoDBMultiple = async (
  data: Location[],
): Promise<{ count: number }> => {
  const result = await prisma.location.createMany({
    data,
  });
  return result;
};

const insertIntoDbStatus = async (data: Status): Promise<Status> => {
  const result = await prisma.status.create({
    data,
  });
  return result;
};

const getAllFromDB = async (
  filters: IWarehouseFilterRequest,
  options: IPaginationOptions,
): Promise<IGenericResponse<Location[]>> => {
  const { page, limit, skip } = paginationHelpers.calculatePagination(options);
  const { searchTerm } = filters;

  const andConditions = [];

  if (searchTerm) {
    andConditions.push({
      OR: warehouseSearchableFields.map(field => ({
        [field]: {
          contains: searchTerm,
          mode: "insensitive",
        },
      })),
    });
  }

  const whereConditons: Prisma.LocationWhereInput =
    andConditions.length > 0 ? { AND: andConditions } : {};

  const result = await prisma.location.findMany({
    where: whereConditons,
    include: {
      inventory: {
        select: {
          part: {
            select: {
              id: true,
              name: true,
              alternatePartName: true,
              description: true,
              totalQty: true,
              availableQty: true,
            },
          },
          qty: true,
        },
      },
    },
    skip,
    take: limit,
  });
  const total = await prisma.location.count({
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
const getInventoryWithLocation = async (
  id: number,
  filters: IWarehouseFilterRequest,
  options: IPaginationOptions,
) => {
  const { page, limit, skip } = paginationHelpers.calculatePagination(options);
  const { searchTerm } = filters;

  const andConditions: Prisma.InventoryWhereInput[] = [];

  if (searchTerm) {
    andConditions.push({
      OR: warehouseInventorySearchableFields.map(field => {
        const [relation, key] = field.split(".");
        return {
          [relation]: {
            [key]: {
              contains: searchTerm,
              mode: "insensitive",
            },
          },
        };
      }),
    });
  }

  andConditions.push({ locationId: id });

  const whereConditions: Prisma.InventoryWhereInput =
    andConditions.length > 0 ? { AND: andConditions } : {};

  const location = await prisma.location.findUnique({
    where: { id },
  });
  const result = await prisma.inventory.findMany({
    where: whereConditions,
    select: {
      id: true,
      qty: true,
      poll: true,
      part: {
        select: {
          name: true,
          alternatePartName: true,
          description: true,
          totalQty: true,
          availableQty: true,
        },
      },
    },
    skip,
    take: limit,
  });

  const total = await prisma.inventory.count({
    where: whereConditions,
  });

  return {
    meta: {
      page,
      limit,
      total,
    },
    data: { location, result },
  };
};

const getStatusFromDB = async (): Promise<Status[] | null> => {
  const result = await prisma.status.findMany({});
  return result;
};

const updateOneInDB = async (
  id: string,
  payload: Partial<Location>,
): Promise<Location> => {
  const result = await prisma.location.update({
    where: {
      id: parseInt(id),
    },
    data: payload,
  });
  return result;
};

// const deleteByIdFromDB = async (id: string): Promise<Location> => {
//   const result = await prisma.location.delete({
//     where: {
//       id: parseInt(id),
//     },
//   });
//   return result;
// };

export const warehouseService = {
  insertIntoDB,
  insertIntoDBMultiple,
  insertIntoDbStatus,
  getAllFromDB,
  getInventoryWithLocation,
  getStatusFromDB,
  updateOneInDB,
  // deleteByIdFromDB,
};
