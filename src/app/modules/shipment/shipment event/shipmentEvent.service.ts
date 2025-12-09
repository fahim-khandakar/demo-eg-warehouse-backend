import { Event, Prisma } from "@prisma/client";
import { JwtPayload } from "jsonwebtoken";
import ApiError from "../../../../errors/ApiError";
import { paginationHelpers } from "../../../../helpers/paginationHelper";
import { IPaginationOptions } from "../../../../interfaces/pagination";
import prisma from "../../../../shared/prisma";
import { shipmentEventSearchableFields } from "./shipmentEvent.constaints";
import {
  CreateEventInput,
  IShipmentEventFilterRequest,
} from "./shipmentEvent.interface";
//internal

const insertIntoDB = async (data: CreateEventInput): Promise<Event> => {
  try {
    const result = await prisma.$transaction(async transaction => {
      const shipment = await transaction.shipment.findUniqueOrThrow({
        where: { id: data.shipmentId },
      });

      // Check or create the box
      let box = await transaction.box.findFirst({
        where: {
          shipmentId: shipment.id,
          boxNo: data.boxNo,
        },
      });

      if (!box) {
        box = await transaction.box.create({
          data: {
            shipmentId: shipment.id,
            boxNo: data.boxNo,
            boxWeight: data.boxWeight,
            width: data.boxWidth,
            height: data.height,
            length: data.length,
          },
        });
      }

      // Check or create the product
      let product = await transaction.product.findFirst({
        where: {
          name: data.part,
          hsCode: data.hsCode || undefined,
        },
      });

      if (!product) {
        product = await transaction.product.create({
          data: {
            name: data.part,
            hsCode: data.hsCode || "",
            quantity: data.quantity,
          },
        });
      }

      // Create the event
      const event = await transaction.event.create({
        data: {
          productId: product.id,
          shipmentId: shipment.id,
          boxId: box.id,
          partnerId: data.partnerId,
          eventNo: data.eventNo,
          description: data.description,
          btrc: data.btrc,
          value: data.value,
          weight: data.weight,
          dimensionL: data.dimensionL,
          dimensionW: data.dimensionW,
          dimensionH: data.dimensionH,
          coo: data.coo,
        },
      });

      // Update shipment totals
      await transaction.shipment.update({
        where: { id: shipment.id },
        data: {
          totalValue: (shipment.totalValue || 0) + data.value,
          totalWeight: (shipment.totalWeight || 0) + data.weight,
          totalQuantity: (shipment.totalQuantity || 0) + data.quantity,
        },
      });

      return event;
    });

    return result;
  } catch (error) {
    throw new ApiError(400, (error as Error).message);
  }
};

const getAllFromDB = async (
  filters: IShipmentEventFilterRequest,
  options: IPaginationOptions,
  startDate?: Date,
  endDate?: Date,
) => {
  const { limit, page, skip } = paginationHelpers.calculatePagination(options);
  const { searchTerm, ...filterDataRaw } = filters;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const filterData: Record<string, any> = {};
  for (const [key, value] of Object.entries(filterDataRaw)) {
    if (["statusId"].includes(key)) {
      filterData[key] = parseInt(value as string, 10);
    } else {
      filterData[key] = value;
    }
  }
  const andConditions: Prisma.EventWhereInput[] = [];
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
      OR: [
        {
          eventNo: {
            contains: searchTerm,
            mode: "insensitive",
          },
        },
        {
          partner: {
            company: {
              contains: searchTerm,
              mode: "insensitive",
            },
          },
        },
        {
          shipment: {
            control: {
              contains: searchTerm,
              mode: "insensitive",
            },
          },
        },
      ],
    });
  }

  if (Object.keys(filterData).length > 0) {
    andConditions.push({
      AND: Object.entries(filterData).map(([field, value]) => ({
        [field]: value,
      })),
    });
  }

  const whereConditions: Prisma.EventWhereInput =
    andConditions.length > 0 ? { AND: andConditions } : {};

  const result = await prisma.event.findMany({
    where: whereConditions,
    select: {
      id: true,
      eventNo: true,
      type: true,
      partner: {
        select: {
          id: true,
          contact_person: true,
          email: true,
          company: true,
        },
      },
      description: true,
      btrc: true,
      weight: true,
      coo: true,
      product: {
        select: {
          id: true,
          name: true,
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
          hawb: true,
        },
      },
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

  const total = await prisma.event.count({
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

const getMyAllFromDB = async (
  filters: IShipmentEventFilterRequest,
  options: IPaginationOptions,
  user: JwtPayload,
) => {
  const { limit, page, skip } = paginationHelpers.calculatePagination(options);
  const { searchTerm, ...filterData } = filters;

  const loggedInPartner = await prisma.partner.findUnique({
    where: { id: user.id },
    select: { company: true },
  });

  if (!loggedInPartner) {
    throw new Error("Partner not found");
  }

  const companyPartners = await prisma.partner.findMany({
    where: { company: loggedInPartner.company },
    select: { id: true },
  });

  const partnerIds = companyPartners.map(p => p.id);

  const andConditions: Prisma.EventWhereInput[] = [
    {
      partnerId: { in: partnerIds },
      type: "DEFAULT",
    },
  ];

  if (searchTerm) {
    andConditions.push({
      OR: shipmentEventSearchableFields.map(field => ({
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

  const whereConditions: Prisma.EventWhereInput =
    andConditions.length > 0 ? { AND: andConditions } : {};

  const result = await prisma.event.findMany({
    where: whereConditions,
    select: {
      id: true,
      eventNo: true,
      description: true,
      btrc: true,
      weight: true,
      coo: true,
      product: {
        select: {
          id: true,
          name: true,
        },
      },
      ox: {
        select: {
          id: true,
          boxNo: true,
          height: true,
          length: true,
          width: true,
          boxWeight: true,
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
          hawb: true,
        },
      },
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

  const total = await prisma.event.count({
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

const getByIdFromDB = async (id: number) => {
  const result = await prisma.event.findUnique({
    where: { id },
    select: {
      id: true,
      partner: {
        select: {
          id: true,
          contact_person: true,
          company: true,
        },
      },
      eventNo: true,
      description: true,
      btrc: true,
      weight: true,
      value: true,
      coo: true,
      product: {
        select: {
          id: true,
          name: true,
        },
      },
      receipt: {
        select: {
          id: true,
          receiptNo: true,
        },
      },
      ox: {
        select: {
          id: true,
          boxNo: true,
          height: true,
          length: true,
          width: true,
          boxWeight: true,
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
          hawb: true,
          boxes: true,
        },
      },
      createdAt: true,
      updatedAt: true,
    },
  });
  return result;
};

const updateOneInDB = async (
  id: string,
  payload: Partial<Event>,
): Promise<Event> => {
  if (!id || isNaN(Number(id))) {
    throw new Error("Invalid Event ID");
  }

  const updateData: Prisma.EventUpdateInput = {
    updatedAt: new Date(), // always update timestamp
  };

  // Direct fields
  if (payload.eventNo !== undefined) updateData.eventNo = payload.eventNo;
  if (payload.description !== undefined)
    updateData.description = payload.description;
  if (payload.btrc !== undefined) updateData.btrc = payload.btrc;
  if (payload.weight !== undefined) updateData.weight = payload.weight;
  if (payload.value !== undefined) updateData.value = payload.value;
  if (payload.dimensionL !== undefined)
    updateData.dimensionL = payload.dimensionL;
  if (payload.dimensionH !== undefined)
    updateData.dimensionH = payload.dimensionH;
  if (payload.dimensionW !== undefined)
    updateData.dimensionW = payload.dimensionW;
  if (payload.coo !== undefined) updateData.coo = payload.coo;

  if (payload.statusId !== undefined) {
    updateData.status = { connect: { id: payload.statusId } };
  }
  // Relations
  if (payload.productId !== undefined) {
    updateData.product = { connect: { id: payload.productId } };
  }
  if (payload.shipmentId !== undefined) {
    updateData.shipment = { connect: { id: payload.shipmentId } };
  }
  if (payload.boxId !== undefined) {
    updateData.ox = { connect: { id: payload.boxId } };
  }
  if (payload.partnerId !== undefined) {
    updateData.partner = { connect: { id: payload.partnerId } };
  }
  if (payload.receiptId !== undefined && payload.receiptId !== null) {
    updateData.receipt = { connect: { id: payload.receiptId } };
  }

  // Execute the update
  const result = await prisma.event.update({
    where: { id: parseInt(id) },
    data: updateData,
  });

  return result;
};

export const EventService = {
  insertIntoDB,
  getAllFromDB,
  getByIdFromDB,
  updateOneInDB,
  getMyAllFromDB,
};
