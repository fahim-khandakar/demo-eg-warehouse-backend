import { Part, Prisma } from "@prisma/client";
import { paginationHelpers } from "../../../../helpers/paginationHelper";
import { IGenericResponse } from "../../../../interfaces/common";
import { IPaginationOptions } from "../../../../interfaces/pagination";
import prisma from "../../../../shared/prisma";
import { partsSearchableFields } from "./parts.constants";
import { IPartsFilterRequest, IPartsList } from "./parts.interface";

const insertIntoDB = async (data: Part): Promise<Part> => {
  const result = await prisma.part.create({
    data,
  });
  return result;
};

const MultiInsertIntoDB = async (data: Part[]): Promise<{ count: number }> => {
  const result = await prisma.part.createMany({
    data,
    skipDuplicates: true,
  });
  return result;
};

const getAllFromDB = async (
  filters: IPartsFilterRequest,
  options: IPaginationOptions,
): Promise<IGenericResponse<IPartsList[]>> => {
  const { page, limit, skip } = paginationHelpers.calculatePagination(options);
  const { searchTerm } = filters;

  const andConditions = [];

  if (searchTerm) {
    andConditions.push({
      OR: partsSearchableFields.map(field => ({
        [field]: {
          contains: searchTerm,
          mode: "insensitive",
        },
      })),
    });
  }
  const whereConditons: Prisma.PartWhereInput =
    andConditions.length > 0 ? { AND: andConditions } : {};

  const result = await prisma.part.findMany({
    where: whereConditons,
    select: {
      id: true,
      name: true,
      alternatePartName: true,
      alternatePartNametwo: true,
      description: true,
      totalQty: true,
      availableQty: true,
      loanQty: true,
      sell: true,
      updatedAt: true,
      inventory: {
        select: {
          id: true,
          location: true,
          qty: true,
        },
      },
    },
    skip,
    take: limit,
    orderBy:
      options.sortBy && options.sortOrder
        ? { [options.sortBy]: options.sortOrder }
        : {
            createdAt: "desc",
          },
  });
  const total = await prisma.part.count({
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

const getByIdFromDB = async (id: number): Promise<Part | null> => {
  const result = await prisma.part.findUnique({
    where: {
      id,
    },
    include: {
      inventory: {
        select: {
          id: true,
          location: true,
          qty: true,
        },
      },
      orderParts: {
        select: {
          id: true,
          qty: true,
          order: {
            select: {
              id: true,
              partner: {
                select: {
                  id: true,
                  contact_person: true,
                  email: true,
                  company: true,
                },
              },
              qty: true,
              status: true,
              caseId: true,
              createdAt: true,
              updatedAt: true,
            },
          },
          inventory: {
            select: {
              id: true,
              location: true,
              qty: true,
            },
          },
        },
      },
    },
  });
  return result;
};
const getPartAvailableByIdFromDB = async (id: number): Promise<Part | null> => {
  const result = await prisma.part.findUnique({
    where: {
      id,
    },
    include: {
      inventory: {
        select: {
          id: true,
          location: true,
          poll: true,
          qty: true,
        },
      },
    },
  });
  return result;
};

const updateOneInDB = async (
  id: string,
  payload: Partial<Part>,
): Promise<Part> => {
  const result = await prisma.part.update({
    where: {
      id: parseInt(id),
    },
    data: payload,
  });
  return result;
};

const deleteByIdFromDB = async (id: string): Promise<Part | null> => {
  const partId = parseInt(id);

  return await prisma.$transaction(async prisma => {
    // Check if the Part exists
    const part = await prisma.part.findUnique({
      where: { id: partId },
    });

    if (!part) {
      throw new Error(`Part with ID ${partId} does not exist.`);
    }

    // Step 1: Find all inventory records for this part
    const inventories = await prisma.inventory.findMany({
      where: { partId },
      select: { id: true },
    });
    const inventoryIds = inventories.map(inv => inv.id);

    // Step 2: Delete related inventory logs
    if (inventoryIds.length > 0) {
      await prisma.inventoryLog.deleteMany({
        where: {
          inventoryId: { in: inventoryIds },
        },
      });
    }

    // Step 3: Delete related OrderPart records
    await prisma.orderPart.deleteMany({
      where: { partId },
    });

    // Step 4: Delete related CustomerRequestedPart records
    await prisma.customerRequestedPart.deleteMany({
      where: { partId },
    });

    // Step 5: Delete related Inventory records
    await prisma.inventory.deleteMany({
      where: { partId },
    });

    // Step 6: Delete related Scrap records
    await prisma.scrap.deleteMany({
      where: { partId },
    });

    // Step 7: Finally delete the Part
    const deletedPart = await prisma.part.delete({
      where: { id: partId },
    });

    return deletedPart;
  });
};

export const PartService = {
  insertIntoDB,
  MultiInsertIntoDB,
  getByIdFromDB,
  getPartAvailableByIdFromDB,
  getAllFromDB,
  updateOneInDB,
  deleteByIdFromDB,
};
