import { Prisma, ReturnEvent, ShipmentType } from "@prisma/client";
import ApiError from "../../../../errors/ApiError";
import { paginationHelpers } from "../../../../helpers/paginationHelper";
import { IPaginationOptions } from "../../../../interfaces/pagination";
import { BadPartEventSearchableFields } from "./badpart.constaints";
import {
  IBadBufferCreateEvent,
  IShipmentReceiptFilterRequest,
} from "./badpart.interface";

import prisma from "../../../../shared/prisma";

const insertIntoDB = async (
  data: IBadBufferCreateEvent,
): Promise<ReturnEvent[]> => {
  const createdReturnEvents: ReturnEvent[] = [];
  const affectedShipmentIds = new Set<number>();

  await prisma.$transaction(async tx => {
    const hawbNo = data.hawbNo.trim();

    // Create or fetch the HAWB row first
    let hawb = await tx.returnBadPartHawb.findUnique({
      where: { hawbNo },
    });

    if (!hawb) {
      hawb = await tx.returnBadPartHawb.create({
        data: {
          hawbNo,
          description: data.remarks,
        },
      });
    }

    for (const { eventId, remarks } of data.items) {
      const event = await tx.event.findUnique({
        where: { id: eventId },
        include: {
          product: true,
          partner: true,
        },
      });

      if (!event) throw new ApiError(404, `Event ${eventId} not found`);

      if (event.statusId !== 3)
        throw new ApiError(
          400,
          `Event ${eventId} is not completed (statusId must be 3)`,
        );

      // Check if already returned
      const existingReturn = await tx.returnEvent.findUnique({
        where: { eventId },
      });
      if (existingReturn)
        throw new ApiError(
          409,
          `ReturnEvent already exists for event ${eventId}`,
        );

      affectedShipmentIds.add(event.shipmentId);

      const returnEvent = await tx.returnEvent.create({
        data: {
          eventId: event.id,
          description: remarks?.trim() ?? null,
          productId: event.productId,
          partnerId: event.partnerId,
          hwabId: hawb.id,
          statusId: 4,
          shipmentId: event.shipmentId,
        },
      });

      await tx.event.update({
        where: { id: event.id },
        data: { statusId: 4 },
      });

      createdReturnEvents.push(returnEvent);
    }

    // Update shipment completion if all returned
    for (const shipmentId of affectedShipmentIds) {
      const events = await tx.event.findMany({
        where: { shipmentId },
        select: { statusId: true },
      });

      const allReturned = events.every(e => e.statusId === 4);

      if (allReturned) {
        await tx.shipment.update({
          where: { id: shipmentId },
          data: { type: ShipmentType.Completed },
        });
      }
    }
  });

  return createdReturnEvents;
};

const getAllFromDB = async (
  filters: IShipmentReceiptFilterRequest,
  options: IPaginationOptions,
  startDate?: Date,
  endDate?: Date,
) => {
  const { limit, page, skip } = paginationHelpers.calculatePagination(options);
  const { searchTerm, ...filterData } = filters;

  const andConditions: Prisma.ReturnEventWhereInput[] = [];

  if (startDate && endDate) {
    andConditions.push({
      createdAt: {
        gte: startDate,
        lte: endDate,
      },
    });
  }

  if (searchTerm) {
    andConditions.push({
      OR: BadPartEventSearchableFields.map(field => ({
        [field]: {
          contains: searchTerm,
          mode: "insensitive",
        },
      })),
    });
  }

  if (Object.keys(filterData).length > 0) {
    andConditions.push({
      AND: Object.entries(filterData).map(([field, value]) => ({
        [field]: value,
      })),
    });
  }

  const whereConditions: Prisma.ReturnEventWhereInput =
    andConditions.length > 0 ? { AND: andConditions } : {};

  const result = await prisma.returnEvent.findMany({
    where: whereConditions,
    select: {
      id: true,
      event: {
        select: {
          id: true,
          eventNo: true,
          product: {
            select: {
              name: true,
            },
          },
          shipment: {
            select: {
              id: true,
              control: true,
            },
          },
        },
      },
      description: true,
      status: true,
      createdAt: true,
      updatedAt: true,
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

  const total = await prisma.returnEvent.count({
    where: whereConditions,
  });

  return {
    meta: {
      total,
      page,
      limit,
    },
    data: result,
  };
};

const getMultipleFromDB = async (ids: number[]) => {
  const result = await prisma.returnEvent.findMany({
    where: {
      id: {
        in: ids,
      },
    },
    select: {
      id: true,
      event: {
        select: {
          id: true,
          eventNo: true,
          product: {
            select: {
              id: true,
              name: true,
              hsCode: true,
            },
          },
          partner: {
            select: {
              id: true,
              company: true,
            },
          },
          description: true,
          btrc: true,
          value: true,
          weight: true,
        },
      },
    },
  });

  return {
    meta: {
      total: 1,
      page: 1,
      limit: 10,
    },
    data: result,
  };
};

const getByIdFromDB = async (id: number): Promise<ReturnEvent | null> => {
  const result = await prisma.returnEvent.findUnique({
    where: { id },
  });
  return result;
};

const updateOneInDB = async (
  id: number,
  payload: Partial<ReturnEvent>,
): Promise<ReturnEvent> => {
  const result = await prisma.returnEvent.update({
    where: {
      id,
    },
    data: payload,
  });
  return result;
};

export const BadPartEventService = {
  insertIntoDB,
  getAllFromDB,
  getByIdFromDB,
  updateOneInDB,
  getMultipleFromDB,
};
