import { Box, Prisma, Product, Shipment, ShipmentType } from "@prisma/client";
//internal
import ApiError from "../../../../errors/ApiError";
import { paginationHelpers } from "../../../../helpers/paginationHelper";
import { IPaginationOptions } from "../../../../interfaces/pagination";
import prisma from "../../../../shared/prisma";
import { shipmentListSearchableFields } from "./shipmentList.constaints";
import {
  IShipmentCreatedByFileEvent,
  IShipmentCreatedEvent,
  IShipmentCreatedPODEvent,
  IShipmentListFilterRequest,
  ShipmentUpdateWithEvents,
} from "./shipmentList.interface";

const insertIntoDB = async (data: IShipmentCreatedEvent): Promise<Shipment> => {
  try {
    const result = await prisma.$transaction(async transaction => {
      let totalValue = 0;
      let totalWeight = 0;
      let totalQuantity = 0;
      // Create the Shipment entry
      const shipment = await transaction.shipment.create({
        data: {
          shipToId: data.shipToId,
          control: data.control,
          sendBy: data.sendBy,
          hawb: data.hawb,
          invoiceValue: data.invoiceValue,
          statusId: 1,
        },
      });
      const boxMap = new Map<string, Box>();
      // Prepare data for Products and Events
      for (const event of data.events) {
        let box: Box;
        if (!boxMap.has(event.boxNo)) {
          // Create a new box entry if it doesn't exist
          box = await transaction.box.create({
            data: {
              shipmentId: shipment.id,
              boxNo: event.boxNo,
              boxWeight: event.boxWeight,
              width: event.boxWidth,
              height: event.height,
              length: event.length,
            },
          });
          boxMap.set(event.boxNo, box);
        } else {
          box = boxMap.get(event.boxNo)!;
        }

        let product = await transaction.product.findFirst({
          where: {
            name: event.part,
            hsCode: event.hsCode,
          },
        });

        if (!product) {
          // If not found, create a new product
          product = await transaction.product.create({
            data: {
              name: event.part,
              hsCode: event.hsCode,
              quantity: event.quantity,
            },
          });
        }
        totalValue += event.value;
        totalWeight += event.weight;
        totalQuantity += event.quantity;

        await transaction.event.create({
          data: {
            productId: product.id,
            shipmentId: shipment.id,
            boxId: box.id,
            partnerId: event.partnerId,
            eventNo: event.eventNo,
            description: event.description,
            btrc: event.btrc,
            value: event.value,
            weight: event.weight,
            dimensionL: event.dimensionL,
            dimensionW: event.dimensionW,
            dimensionH: event.dimensionH,
            coo: event.coo,
          },
        });
      }

      await transaction.shipment.update({
        where: { id: shipment.id },
        data: {
          totalValue,
          totalWeight,
          totalQuantity,
        },
      });

      return shipment;
    });

    return result;
  } catch (error) {
    throw new ApiError(400, (error as Error).message);
  }
};

const PODReturnInsertIntoDB = async (
  data: IShipmentCreatedPODEvent,
): Promise<Shipment> => {
  try {
    const result = await prisma.$transaction(async transaction => {
      let totalValue = 0;
      let totalWeight = 0;
      let totalQuantity = 0;

      // 1. Create the Shipment
      const shipment = await transaction.shipment.create({
        data: {
          shipToId: data.shipToId,
          control: data.control,
          sendBy: data.sendBy,
          hawb: data.hawb,
          type: ShipmentType.RETURN,
          statusId: 6,
        },
      });

      const boxMap = new Map<string, Box>();

      // 2. Pre-fetch all needed products
      const productIds = [...new Set(data.events.map(e => e.part))];
      const products = await transaction.product.findMany({
        where: { id: { in: productIds } },
      });
      const productMap = new Map(products.map(p => [p.id, p]));

      // 3. Loop through events and create them
      for (const event of data.events) {
        // Check product existence
        const product = productMap.get(event.part);
        if (!product) {
          throw new ApiError(400, `Product with ID ${event.part} not found`);
        }

        // Handle box
        let box: Box;
        if (!boxMap.has(event.boxNo)) {
          box = await transaction.box.create({
            data: {
              shipmentId: shipment.id,
              boxNo: event.boxNo,
              boxWeight: event.boxWeight,
              width: event.boxWidth,
              height: event.height,
              length: event.length,
            },
          });
          boxMap.set(event.boxNo, box);
        } else {
          box = boxMap.get(event.boxNo)!;
        }

        // Accumulate totals
        totalValue += event.value;
        totalWeight += event.weight;
        totalQuantity += event.quantity;

        // Create Event
        await transaction.event.create({
          data: {
            productId: product.id,
            shipmentId: shipment.id,
            boxId: box.id,
            partnerId: event.partnerId,
            eventNo: event.eventNo,
            type: data.type,
            description: event.description,
            btrc: event.btrc,
            value: event.value,
            weight: event.weight,
            dimensionL: event.dimensionL,
            dimensionW: event.dimensionW,
            dimensionH: event.dimensionH,
            coo: event.coo,
          },
        });
      }

      // 4. Update Shipment with totals
      await transaction.shipment.update({
        where: { id: shipment.id },
        data: {
          totalValue,
          totalWeight,
          totalQuantity,
        },
      });

      // 5. Update old events (DEFAULT type) to statusId = 7
      const defaultEventNos = data.events.map(e => e.eventNo);
      await transaction.event.updateMany({
        where: {
          eventNo: { in: defaultEventNos },
          type: ShipmentType.DEFAULT,
        },
        data: { statusId: 7 },
      });

      // 6. Update related return events (if exist)
      await transaction.returnEvent.updateMany({
        where: {
          event: {
            eventNo: { in: defaultEventNos },
            type: ShipmentType.DEFAULT,
          },
        },
        data: { statusId: 7 },
      });

      await transaction.receipt.updateMany({
        where: {
          events: {
            some: {
              eventNo: { in: defaultEventNos },
              type: ShipmentType.DEFAULT,
            },
          },
        },
        data: {
          statusId: 7,
        },
      });

      return shipment;
    });

    return result;
  } catch (error) {
    throw new ApiError(400, (error as Error).message);
  }
};

const insertIntoDbByFile = async (
  data: IShipmentCreatedByFileEvent,
): Promise<Shipment> => {
  try {
    return await prisma.$transaction(async tx => {
      // Find shipTo once
      const shipTo = await tx.shipTo.findFirst({
        where: { company: data.shipTo },
      });
      if (!shipTo) throw new ApiError(400, "shipTo not found");

      // Create shipment with initial data
      const shipment = await tx.shipment.create({
        data: {
          shipToId: shipTo.id,
          control: data.control,
          sendBy: data.sendBy,
          invoiceValue: data.invoiceValue,
          statusId: 1,
          type: data.type,
        },
      });

      // Cache for boxes, partners, products
      const boxMap = new Map<string, Box>();
      const partnerMap = new Map<string, number>();
      const productMap = new Map<string, Product>(); // key: `${name}__${hsCode}`

      // Gather totals
      let totalValue = 0;
      let totalWeight = 0;
      let totalQuantity = 0;

      // Preload partners from unique partner names in data.events
      const uniquePartners = Array.from(
        new Set(data.events.map(e => e.partner.trim())),
      );
      const partners = await tx.partner.findMany({
        where: { company: { in: uniquePartners } },
      });
      for (const p of partners) partnerMap.set(p.company, p.id);
      for (const pName of uniquePartners) {
        if (!partnerMap.has(pName))
          throw new ApiError(400, `Partner "${pName}" not found`);
      }

      // Process boxes and products first without creating events yet
      for (const event of data.events) {
        // Create box if not exist
        if (!boxMap.has(event.boxNo)) {
          const box = await tx.box.create({
            data: {
              shipmentId: shipment.id,
              boxNo: event.boxNo,
              boxWeight: event.boxWeight,
              width: event.dimensionW,
              height: event.height,
              length: event.length,
            },
          });
          boxMap.set(event.boxNo, box);
        }

        // Cache or create product
        const productKey = `${event.part}__${event.hsCode}`;
        if (!productMap.has(productKey)) {
          // Try find
          let product = await tx.product.findFirst({
            where: {
              name: event.part,
              hsCode: event.hsCode,
            },
          });

          if (product) {
            // Update quantity
            await tx.product.update({
              where: { id: product.id },
              data: { quantity: { increment: event.quantity } },
            });
          } else {
            // Create product
            product = await tx.product.create({
              data: {
                name: event.part,
                hsCode: event.hsCode,
                quantity: event.quantity,
              },
            });
          }
          productMap.set(productKey, product);
        } else {
          // Product cached, just update quantity in DB and cache
          const product = productMap.get(productKey)!;
          await tx.product.update({
            where: { id: product.id },
            data: { quantity: { increment: event.quantity } },
          });
          // Update cached product quantity
          product.quantity += event.quantity;
          productMap.set(productKey, product);
        }

        // Accumulate totals
        totalValue += event.value;
        totalWeight += event.weight;
        totalQuantity += event.quantity;
      }

      // Create all events after boxes/products prepared
      // You can parallelize event creation, but inside transaction it might be safer sequentially
      for (const event of data.events) {
        const box = boxMap.get(event.boxNo)!;
        const product = productMap.get(`${event.part}__${event.hsCode}`)!;
        const partnerId = partnerMap.get(event.partner)!;

        await tx.event.create({
          data: {
            productId: product.id,
            shipmentId: shipment.id,
            boxId: box.id,
            partnerId,
            eventNo: event.eventNo,
            type: data.type,
            description: event.description,
            btrc: event.btrc,
            value: event.value,
            weight: event.weight,
            dimensionL: event.dimensionL,
            dimensionH: event.dimensionH,
            dimensionW: event.dimensionW,
            coo: event.coo,
          },
        });
      }

      // Update shipment totals
      await tx.shipment.update({
        where: { id: shipment.id },
        data: {
          totalValue,
          totalWeight,
          totalQuantity,
        },
      });

      return shipment;
    });
  } catch (error) {
    throw new ApiError(400, (error as Error).message);
  }
};

const getAllFromDB = async (
  filters: IShipmentListFilterRequest,
  options: IPaginationOptions,
) => {
  const { limit, page, skip } = paginationHelpers.calculatePagination(options);
  const { searchTerm, ...filterData } = filters;

  const andConditions = [];

  if (searchTerm) {
    andConditions.push({
      OR: shipmentListSearchableFields.map(field => ({
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

  const whereConditions: Prisma.ShipmentWhereInput =
    andConditions.length > 0 ? { AND: andConditions } : {};

  const result = await prisma.shipment.findMany({
    where: whereConditions,
    select: {
      id: true,
      control: true,
      sendBy: true,
      hawb: true,
      totalValue: true,
      totalWeight: true,
      totalQuantity: true,
      type: true,
      _count: {
        select: {
          boxes: true,
        },
      },
      createdAt: true,
      events: {
        select: {
          id: true,
          partner: {
            select: {
              id: true,
              company: true,
            },
          },
          eventNo: true,
          description: true,
          btrc: true,
          value: true,
          weight: true,
          coo: true,
        },
      },
      status: {
        select: {
          id: true,
          name: true,
        },
      },
      shipTo: {
        select: {
          id: true,
          company: true,
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

  const total = await prisma.shipment.count({
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

const getByIdFromDB = async (id: number): Promise<Shipment | null> => {
  const result = await prisma.shipment.findUnique({
    where: {
      id,
    },
    include: {
      boxes: true,
      events: {
        select: {
          id: true,
          partner: {
            select: {
              id: true,
              company: true,
            },
          },
          product: {
            select: {
              id: true,
              name: true,
              hsCode: true,
            },
          },
          ox: {
            select: {
              id: true,
              boxNo: true,
              height: true,
              width: true,
              length: true,
              boxWeight: true,
            },
          },
          eventNo: true,
          description: true,
          dimensionH: true,
          dimensionL: true,
          dimensionW: true,
          btrc: true,
          value: true,
          weight: true,
          coo: true,
        },
      },
      status: true,
      shipTo: true,
    },
  });
  return result;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function filterUndefined<T extends Record<string, any>>(obj: T): Partial<T> {
  return Object.fromEntries(
    Object.entries(obj).filter(([_, v]) => v !== undefined),
  ) as Partial<T>;
}

export const updateOneInDB = async (
  id: string,
  payload: ShipmentUpdateWithEvents,
): Promise<Shipment> => {
  const shipmentId = parseInt(id, 10);
  if (isNaN(shipmentId)) throw new ApiError(400, "Invalid shipment ID");

  const { events = [], ...shipmentData } = payload;
  const updatedShipment = await prisma.$transaction(async tx => {
    // 1. Update shipment fields
    const shipment = await tx.shipment.update({
      where: { id: shipmentId },
      data: filterUndefined(shipmentData),
    });

    // 2. Track payload event IDs
    const payloadEventIds: number[] = [];

    // 3. Update or create events
    for (const event of events) {
      if (event.id) {
        payloadEventIds.push(event.id);
        await tx.event.update({
          where: { id: event.id },
          data: filterUndefined({
            eventNo: event.eventNo,
            description: event.description,
            value: event.value,
            weight: event.weight,
            dimensionL: event.dimensionL,
            dimensionW: event.dimensionW,
            dimensionH: event.dimensionH,
            coo: event.coo,
            partnerId: event.partnerId,
            productId: event.productId,
            boxId: event.boxId,
            statusId: event.statusId,
          }),
        });
      } else {
        await tx.event.create({
          data: {
            eventNo: event.eventNo!,
            description: event.description,
            value: event.value!,
            weight: event.weight!,
            dimensionL: event.dimensionL!,
            dimensionW: event.dimensionW!,
            dimensionH: event.dimensionH!,
            coo: event.coo,
            partnerId: event.partnerId,
            productId: event.productId!,
            boxId: event.boxId,
            shipmentId,
            statusId: event.statusId ?? 1,
          },
        });
      }
    }

    // 4. Delete events not included in payload
    if (payloadEventIds.length > 0) {
      await tx.event.deleteMany({
        where: {
          shipmentId,
          id: { notIn: payloadEventIds },
        },
      });
    }

    return shipment;
  });

  return updatedShipment;
};
const deleteByIdFromDB = async (id: string): Promise<Shipment | null> => {
  const shipmentId = parseInt(id, 10);
  if (isNaN(shipmentId)) {
    throw new ApiError(400, "Invalid shipment ID");
  }

  try {
    const deletedShipment = await prisma.$transaction(async prisma => {
      // 1. Find all Event IDs related to shipment
      const events = await prisma.event.findMany({
        where: { shipmentId },
        select: { id: true },
      });
      const eventIds = events.map(e => e.id);

      if (eventIds.length > 0) {
        // 2. Delete ReturnEvents referencing those Event IDs
        await prisma.returnEvent.deleteMany({
          where: {
            eventId: { in: eventIds },
          },
        });

        // 3. Delete Events
        await prisma.event.deleteMany({
          where: {
            id: { in: eventIds },
          },
        });
      }

      // 4. Delete Boxes related to shipment
      await prisma.box.deleteMany({
        where: {
          shipmentId,
        },
      });

      // 5. Delete the Shipment
      const shipment = await prisma.shipment.delete({
        where: {
          id: shipmentId,
        },
      });

      return shipment;
    });

    return deletedShipment;
  } catch (error) {
    throw new ApiError(500, (error as Error).message);
  }
};

const getPodFromDB = async (id: number): Promise<Shipment | null> => {
  if (!id || isNaN(Number(id))) {
    throw new Error("Invalid Event ID");
  }
  const result = await prisma.shipment.findUnique({
    where: { id },
    include: {
      boxes: {
        select: {
          _count: true,
        },
      },
      events: {
        select: {
          id: true,
          eventNo: true,
          type: true,
          product: {
            select: {
              id: true,
              name: true,
              hsCode: true,
            },
          },
          description: true,
          btrc: true,
          value: true,
          weight: true,
          dimensionH: true,
          dimensionL: true,
          dimensionW: true,
          coo: true,
          ox: {
            select: {
              id: true,
              boxNo: true,
              boxWeight: true,
              width: true,
              height: true,
              length: true,
            },
          },
          status: {
            select: {
              name: true,
            },
          },
          receipt: {
            select: {
              receiptNo: true,
            },
          },
          createdAt: true,
        },
      },
    },
  });

  return result;
};
export const ShipmentListService = {
  insertIntoDB,
  PODReturnInsertIntoDB,
  insertIntoDbByFile,
  getAllFromDB,
  getByIdFromDB,
  getPodFromDB,
  updateOneInDB,
  deleteByIdFromDB,
};
