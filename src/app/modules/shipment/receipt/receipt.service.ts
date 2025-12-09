import { Prisma, Receipt, ShipmentType } from "@prisma/client";
import ApiError from "../../../../errors/ApiError";
import { paginationHelpers } from "../../../../helpers/paginationHelper";
import { IPaginationOptions } from "../../../../interfaces/pagination";
import prisma from "../../../../shared/prisma";
import { shipmentReceiptSearchableFields } from "./receipt.constaints";
import { IShipmentReceiptFilterRequest } from "./receipt.interface";

const insertIntoDB = async (eventIds: number[]): Promise<Receipt> => {
  const events = await prisma.event.findMany({
    where: {
      id: { in: eventIds },
      receiptId: null,
    },
  });

  if (events.length === 0) {
    throw new ApiError(400, "Events are already linked to a receipt.");
  }

  const totalValue = events.reduce((sum, event) => sum + event.value, 0);
  const totalWeight = events.reduce((sum, event) => sum + event.weight, 0);

  // Get shipment IDs related to events
  const shipmentIds = [...new Set(events.map(event => event.shipmentId))];

  const result = await prisma.$transaction(async prisma => {
    // Create the receipt
    const receipt = await prisma.receipt.create({
      data: {
        receiptNo: `REC-${Date.now()}`,
        totalValue,
        totalWeight,
        events: {
          connect: eventIds.map(id => ({ id })), // Link events to the receipt
        },
      },
      include: { events: true },
    });

    // Update event statuses
    await prisma.event.updateMany({
      where: { id: { in: eventIds } },
      data: { statusId: 3 }, // Mark events as "Processed"
    });

    // Check if all events of a shipment have statusId = 2
    for (const shipmentId of shipmentIds) {
      const remainingEvents = await prisma.event.findMany({
        where: { shipmentId, statusId: { not: 3 } }, // Find events that are NOT status 2
      });

      if (remainingEvents.length === 0) {
        // If no remaining events, update shipment status
        await prisma.shipment.update({
          where: { id: shipmentId },
          data: { type: ShipmentType.FORWARD }, // Mark shipment as "Processed"
        });
      }
    }

    return receipt;
  });

  return result;
};

const getAllFromDB = async (
  filters: IShipmentReceiptFilterRequest,
  options: IPaginationOptions,
) => {
  const { limit, page, skip } = paginationHelpers.calculatePagination(options);
  const { searchTerm, ...filterDataRaw } = filters;

  // ✅ Convert statusId to number if present
  const filterData: Record<string, unknown> = { ...filterDataRaw };
  if (filterData.statusId) {
    filterData.statusId = Number(filterData.statusId);
  }

  const andConditions: Prisma.ReceiptWhereInput[] = [];

  if (searchTerm) {
    andConditions.push({
      OR: shipmentReceiptSearchableFields.map(field => ({
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

  const whereConditions: Prisma.ReceiptWhereInput =
    andConditions.length > 0 ? { AND: andConditions } : {};

  const result = await prisma.receipt.findMany({
    where: whereConditions,
    select: {
      id: true,
      receiptNo: true,
      totalValue: true,
      totalWeight: true,
      statusId: true,
      events: {
        select: {
          id: true,
          eventNo: true,
          description: true,
          partner: {
            select: {
              id: true,
              contact_person: true,
              email: true,
              company: true,
            },
          },
          createdAt: true,
          product: {
            select: {
              id: true,
              name: true,
              quantity: true,
            },
          },
          status: {
            select: {
              id: true,
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
      createdAt: true,
    },
    skip,
    take: limit,
    orderBy:
      options.sortBy && options.sortOrder
        ? { [options.sortBy]: options.sortOrder }
        : { createdAt: "desc" },
  });

  const total = await prisma.receipt.count({
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

const getByIdFromDB = async (id: number): Promise<Receipt | null> => {
  const result = await prisma.receipt.findUnique({
    where: { id },
    select: {
      id: true,
      receiptNo: true,
      totalValue: true,
      totalWeight: true,
      statusId: true,
      events: {
        select: {
          id: true,
          eventNo: true,
          description: true,
          partner: {
            select: {
              contact_person: true,
              company: true,
              contactNo: true,
              email: true,
            },
          },
          createdAt: true,
          product: {
            select: {
              id: true,
              name: true,
              quantity: true,
            },
          },
          status: {
            select: {
              id: true,
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
      createdAt: true,
    },
  });
  return result;
};

const updateOneInDB = async (
  receiptId: number,
  updatedEventIds: number[],
): Promise<Receipt> => {
  const result = await prisma.$transaction(async prisma => {
    // Fetch existing receipt
    const existingReceipt = await prisma.receipt.findUnique({
      where: { id: receiptId },
      include: { events: true },
    });

    if (!existingReceipt) {
      throw new ApiError(404, "Receipt not found.");
    }

    // Get current and new events
    const existingEventIds = existingReceipt.events.map(event => event.id);
    const eventsToRemove = existingEventIds.filter(
      id => !updatedEventIds.includes(id),
    );
    const eventsToAdd = updatedEventIds.filter(
      id => !existingEventIds.includes(id),
    );

    // Update event links (Remove & Add)
    if (eventsToRemove.length > 0) {
      await prisma.event.updateMany({
        where: { id: { in: eventsToRemove } },
        data: { receiptId: null, statusId: 1 }, // Unlink and reset status
      });
    }

    if (eventsToAdd.length > 0) {
      await prisma.event.updateMany({
        where: { id: { in: eventsToAdd } },
        data: { receiptId, statusId: 2 }, // Link and update status
      });
    }

    // Fetch all events linked to the updated receipt
    const updatedEvents = await prisma.event.findMany({
      where: { id: { in: updatedEventIds } },
    });

    // Recalculate totals
    const totalValue = updatedEvents.reduce(
      (sum, event) => sum + event.value,
      0,
    );
    const totalWeight = updatedEvents.reduce(
      (sum, event) => sum + event.weight,
      0,
    );

    // Update receipt with new totals
    const updatedReceipt = await prisma.receipt.update({
      where: { id: receiptId },
      data: {
        totalValue,
        totalWeight,
        events: {
          connect: eventsToAdd.map(id => ({ id })), // Connect new events
          disconnect: eventsToRemove.map(id => ({ id })), // Disconnect removed events
        },
      },
      include: { events: true },
    });

    // Check and update shipment status
    const shipmentIds = [
      ...new Set(updatedEvents.map(event => event.shipmentId)),
    ];

    for (const shipmentId of shipmentIds) {
      const remainingEvents = await prisma.event.findMany({
        where: { shipmentId, statusId: { not: 2 } }, // Find events that are NOT status 2
      });

      if (remainingEvents.length === 0) {
        // If all events are status 2, update shipment status
        await prisma.shipment.update({
          where: { id: shipmentId },
          data: { type: ShipmentType.FORWARD },
        });
      }
    }

    return updatedReceipt;
  });
  return result;
};

const deleteFromDB = async (id: number): Promise<void> => {
  return await prisma.$transaction(async prisma => {
    const receipt = await prisma.receipt.findUnique({
      where: { id },
      include: { events: true },
    });

    if (!receipt) {
      throw new ApiError(404, "Receipt not found.");
    }

    const eventIds = receipt.events.map(event => event.id);
    const shipmentIds = [
      ...new Set(receipt.events.map(event => event.shipmentId)),
    ];

    // Unlink events (remove receipt reference and reset status)
    if (eventIds.length > 0) {
      await prisma.event.updateMany({
        where: { id: { in: eventIds } },
        data: { receiptId: null, statusId: 1 }, // Reset event status
      });
    }

    // Delete receipt
    await prisma.receipt.delete({ where: { id } });

    // Check and update shipment status
    for (const shipmentId of shipmentIds) {
      const remainingEvents = await prisma.event.findMany({
        where: { shipmentId, statusId: { not: 2 } }, // Find events that are NOT status 2
      });

      if (remainingEvents.length === 0) {
        // If all events are status 2, update shipment status
        await prisma.shipment.update({
          where: { id: shipmentId },
          data: { type: ShipmentType.FORWARD },
        });
      }
    }
  });
};

export const ReceiptService = {
  insertIntoDB,
  getAllFromDB,
  getByIdFromDB,
  updateOneInDB,
  deleteFromDB,
};
