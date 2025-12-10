/* eslint-disable @typescript-eslint/no-explicit-any */
import { Order, Prisma } from "@prisma/client";
import { JwtPayload } from "jsonwebtoken";
import ApiError from "../../../../errors/ApiError";
import { paginationHelpers } from "../../../../helpers/paginationHelper";
import { IGenericResponse } from "../../../../interfaces/common";
import { IPaginationOptions } from "../../../../interfaces/pagination";
import prisma from "../../../../shared/prisma";
import {
  MyorderSearchableFields,
  orderSearchableFields,
} from "./order.constaints";
import {
  ICustomerRequestProduct,
  IOrderCreatedEvent,
  IOrderEditEvent,
  IOrderFilterRequest,
  IOrderList,
  IOrderProduct,
} from "./order.interface";
import { generateOrderId } from "./order.utils";

const insertIntoDB = async (data: IOrderCreatedEvent): Promise<Order> => {
  try {
    const invoiceId = await generateOrderId();

    const result = await prisma.$transaction(async transaction => {
      const { partId, qty, poll, description } = data.parts;

      // 1. Check inventory availability
      const inventory = await transaction.inventory.findUnique({
        where: {
          locationId_partId_poll: {
            locationId: data.locationId,
            partId,
            poll,
          },
        },
      });

      if (!inventory || inventory.qty < qty) {
        throw new ApiError(
          400,
          `Insufficient quantity for part ${partId} in location ${data.locationId}. Available: ${inventory?.qty ?? 0}, Requested: ${qty}`,
        );
      }

      const customerRequest = await prisma.customerRequest.create({
        data: {
          partnerId: data.partnerId,
          caseId: data.caseId,
          callDate: data.callDate,
          approvalImage: data.approvalImage,
          saidId: data.saidId,
          eventNo: data.eventNo,
          remarks: data.remarks,
          statusId: 2,
          parts: {
            create: {
              partId: data.parts.partId,
              qty: data.parts.qty,
              description: data.parts.description,
            },
          },
        },
      });

      // 2. Create the Order
      const order = await transaction.order.create({
        data: {
          invoiceId,
          partnerId: data.partnerId,
          caseId: data.caseId,
          callDate: data.callDate,
          saidId: data.saidId,
          eventNo: data.eventNo,
          remarks: data.remarks,
          statusId: 2,
          qty,
          customerRequest: {
            connect: {
              id: customerRequest?.id,
            },
          },
        },
      });

      // 3. Create the OrderPart (single entry)
      const orderPart = await transaction.orderPart.create({
        data: {
          orderId: order.id,
          inventoryId: inventory.id,
          description,
          partId,
          qty,
        },
      });

      // 4. Update Inventory
      await transaction.inventory.update({
        where: {
          locationId_partId_poll: {
            locationId: data.locationId,
            partId,
            poll,
          },
        },
        data: {
          qty: { decrement: qty },
        },
      });

      // 5. Update Part
      await transaction.part.update({
        where: { id: partId },
        data: {
          availableQty: { decrement: qty },
          sell: { increment: qty },
          loanQty: { increment: qty },
        },
      });

      return { order, orderPart }; // return both for email
    });

    // Fetch partner and part info
    const partner = await prisma.partner.findUnique({
      where: { id: data.partnerId },
    });
    const part = await prisma.part.findUnique({
      where: { id: data.parts.partId },
    });

    // if (partner && part) {
    //   await sendEmail(
    //     partner.email,
    //     "Your order has been Open",
    //     orderCreatedTemplate(
    //       partner.company,
    //       result.order.invoiceId,
    //       part.name,
    //       result.orderPart.qty,
    //     ),
    //   );
    // }

    return result.order;
  } catch (error) {
    throw new ApiError(400, (error as Error).message);
  }
};

const updateOrderStatus = async (
  orderId: number,
  statusId: number,
  customerStatusId: number,
): Promise<Order> => {
  try {
    const result = await prisma.$transaction(async transaction => {
      const order = await transaction.order.findUnique({
        where: { id: orderId },
        include: { orderPart: true, status: true, partner: true },
      });

      if (!order) {
        throw new ApiError(404, `Order with ID ${orderId} not found.`);
      }

      // if (
      //   order.statusId === 6 ||
      //   order.statusId === 11 ||
      //   order.statusId === 10
      // ) {
      //   throw new ApiError(
      //     400,
      //     `Order with ID ${orderId} is already ${order?.status?.name}.`,
      //   );
      // }

      const orderPart = order.orderPart;

      if (!orderPart) {
        throw new ApiError(400, `No OrderPart found for Order ID ${orderId}`);
      }

      // CASE 1: Going back to Transit (5) from any closed stage
      if ([6, 10, 11].includes(order.statusId) && statusId === 5) {
        await transaction.inventory.update({
          where: { id: orderPart.inventoryId },
          data: { qty: { decrement: orderPart.qty } },
        });

        await transaction.part.update({
          where: { id: orderPart.partId },
          data: {
            availableQty: { decrement: orderPart.qty },
            loanQty: { increment: orderPart.qty },
          },
        });
      }

      // CASE 2: Going from Transit (5) to a closed stage (6,10,11)
      if ([6, 10, 11].includes(statusId) && order.statusId === 5) {
        await transaction.inventory.update({
          where: { id: orderPart.inventoryId },
          data: { qty: { increment: orderPart.qty } },
        });

        await transaction.part.update({
          where: { id: orderPart.partId },
          data: {
            availableQty: { increment: orderPart.qty },
            loanQty: { decrement: orderPart.qty },
          },
        });
      }
      // Restore Inventory

      if (customerStatusId) {
        // update customer request
        await transaction.customerRequest.update({
          where: { orderId: order?.id },
          data: { statusId: customerStatusId },
        });
      }

      // Update Order Status to Closed
      const updatedOrder = await transaction.order.update({
        where: { id: orderId },
        data: {
          statusId: statusId,
          closeDate: [6, 9, 10, 11].includes(statusId) ? new Date() : null,
          updatedAt: new Date(),
        },
        include: { partner: true, status: true },
      });

      return updatedOrder;
    });

    // Send email to partner
    // if (result.partner && result.partner.email) {
    //   await sendEmail(
    //     result.partner.email,
    //     "Order Status Updated",
    //     orderStatusUpdatedTemplate(
    //       result.partner.company,
    //       result.invoiceId,
    //       "Closed",
    //       result.closeDate,
    //     ),
    //   );
    // }

    return result;
  } catch (error) {
    throw new ApiError(400, (error as Error).message);
  }
};

const getAllFromDB = async (
  filters: IOrderFilterRequest,
  options: IPaginationOptions,
): Promise<IGenericResponse<IOrderList[]>> => {
  const { page, limit, skip } = paginationHelpers.calculatePagination(options);
  const { searchTerm, ...filterDataRaw } = filters;

  // Convert string values to proper types

  const filterData: Record<string, any> = {};
  for (const [key, value] of Object.entries(filterDataRaw)) {
    if (["statusId"].includes(key)) {
      filterData[key] = parseInt(value as string, 10); // convert to int
    } else {
      filterData[key] = value;
    }
  }

  const andConditions = [];
  if (searchTerm) {
    andConditions.push({
      OR: [
        {
          caseId: {
            contains: searchTerm,
            mode: "insensitive",
          },
        },
        {
          partner: {
            contact_person: {
              contains: searchTerm,
              mode: "insensitive",
            },
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
          orderPart: {
            part: {
              name: {
                contains: searchTerm,
                mode: "insensitive",
              },
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

  const whereConditions: any =
    andConditions.length > 0 ? { AND: andConditions } : {};
  const result = await prisma.order.findMany({
    where: whereConditions,
    select: {
      id: true,
      qty: true,
      invoiceId: true,
      caseId: true,
      callDate: true,
      saidId: true,
      closeDate: true,
      eventNo: true,
      createdAt: true,
      updatedAt: true,
      status: true,
      remarks: true,
      customerRequest: {
        select: {
          approvalImage: true,
        },
      },
      orderPart: {
        select: {
          description: true,
          part: {
            select: {
              name: true,
              alternatePartName: true,
              description: true,
            },
          },
        },
      },
      partner: {
        select: {
          id: true,
          contact_person: true,
          email: true,
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
  const total = await prisma.order.count({
    where: whereConditions,
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

const getMyAllFromDB = async (
  filters: IOrderFilterRequest,
  options: IPaginationOptions,
  user: JwtPayload,
): Promise<IGenericResponse<Order[]>> => {
  const { page, limit, skip } = paginationHelpers.calculatePagination(options);
  const { searchTerm } = filters;

  const andConditions = [];
  andConditions.push({
    partnerId: user.id,
  });

  if (searchTerm) {
    andConditions.push({
      OR: MyorderSearchableFields.map(field => ({
        [field]: {
          contains: searchTerm,
          mode: "insensitive",
        },
      })),
    });
  }

  const whereConditions: Prisma.OrderWhereInput =
    andConditions.length > 0 ? { AND: andConditions } : {};

  const result = await prisma.order.findMany({
    where: whereConditions,
    select: {
      id: true,
      qty: true,
      invoiceId: true,
      caseId: true,
      saidId: true,
      eventNo: true,
      statusId: true,
      partnerId: true,
      callDate: true,
      remarks: true,
      closeDate: true,
      createdAt: true,
      updatedAt: true,
      orderPart: {
        select: {
          description: true,
          part: {
            select: {
              name: true,
              alternatePartName: true,
              description: true,
            },
          },
        },
      },
      status: {
        select: {
          id: true,
          name: true,
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
  const total = await prisma.order.count({
    where: whereConditions,
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

const getPartsFromDB = async (
  filters: IOrderFilterRequest,
  options: IPaginationOptions,
): Promise<
  IGenericResponse<
    { id: number; name: string; alternatePartName: string | null }[]
  >
> => {
  const { page, limit, skip } = paginationHelpers.calculatePagination(options);
  const { searchTerm } = filters;

  const andConditions = [];

  if (searchTerm) {
    andConditions.push({
      OR: orderSearchableFields.map(field => ({
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
      description: true,
      alternatePartName: true,
    },
    skip,
    take: limit,
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

const getByIdFromDB = async (id: number): Promise<Order | null> => {
  const result = await prisma.order.findUnique({
    where: {
      id,
    },
    include: {
      customerRequest: {
        select: {
          statusId: true,
          approvalImage: true,
        },
      },
      partner: {
        select: {
          id: true,
          contact_person: true,
          email: true,
        },
      },
      orderPart: {
        select: {
          id: true,
          qty: true,
          description: true,
          part: {
            select: {
              id: true,
              name: true,
              alternatePartName: true,
            },
          },
          inventory: {
            select: {
              id: true,
              qty: true,
              poll: true,
              location: {
                select: {
                  rack: true,
                },
              },
            },
          },
        },
      },
    },
  });
  return result;
};

export const updateOneInDB = async (
  orderId: number,
  payload: IOrderEditEvent,
) => {
  return await prisma.$transaction(async tx => {
    const order = await tx.order.findUnique({
      where: { id: orderId },
      include: { orderPart: true, customerRequest: true },
    });
    if (!order) throw new ApiError(404, `Order ${orderId} not found`);

    const updatedOrderData: any = {};
    if (payload.partnerId !== undefined)
      updatedOrderData.partnerId = payload.partnerId;
    if (payload.caseId !== undefined) updatedOrderData.caseId = payload.caseId;
    if (payload.callDate !== undefined)
      updatedOrderData.callDate = payload.callDate;
    if (payload.qty !== undefined) updatedOrderData.qty = payload.qty;
    if (payload.statusId !== undefined)
      updatedOrderData.statusId = payload.statusId;
    if (payload.eventNo !== undefined)
      updatedOrderData.eventNo = payload.eventNo;
    if (payload.remarks !== undefined)
      updatedOrderData.remarks = payload.remarks;

    // Update order main data
    const updatedOrder = await tx.order.update({
      where: { id: orderId },
      data: updatedOrderData,
    });
    console.log("updatedOrder", updatedOrderData);
    // If orderPart update is provided
    if (payload.parts) {
      const op = order.orderPart;

      if (!op) {
        throw new ApiError(400, `Order ${orderId} has no part to update`);
      }

      // 1️⃣ Restore previous inventory and part counts
      await tx.inventory.update({
        where: { id: op.inventoryId },
        data: { qty: { increment: op.qty } },
      });

      await tx.part.update({
        where: { id: op.partId },
        data: {
          availableQty: { increment: op.qty },
          sell: { decrement: op.qty },
          loanQty: { decrement: op.qty },
        },
      });

      // 2️⃣ Update the orderPart with new data
      await tx.orderPart.update({
        where: { id: op.id },
        data: {
          partId: payload.parts.partId,
          inventoryId: payload.parts.inventoryId,
          qty: payload.parts.qty,
          description: payload.parts.description || op.description,
        },
      });

      // 3️⃣ Deduct inventory and update part tracking for new part
      await tx.inventory.update({
        where: { id: payload.parts.inventoryId },
        data: { qty: { decrement: payload.parts.qty } },
      });

      await tx.part.update({
        where: { id: payload.parts.partId },
        data: {
          availableQty: { decrement: payload.parts.qty },
          sell: { increment: payload.parts.qty },
          loanQty: { increment: payload.parts.qty },
        },
      });
    }

    // 4️⃣ Update customerRequest eventNo if exists and payload.eventNo is provided
    if (payload.eventNo && order.customerRequest) {
      await tx.customerRequest.update({
        where: { id: order.customerRequest.id },
        data: { eventNo: payload.eventNo },
      });
    }

    if (payload.approvalImage || order.customerRequest) {
      await tx.customerRequest.update({
        where: {
          orderId: orderId,
        },
        data: {
          approvalImage: payload.approvalImage,
          eventNo: payload?.eventNo,
        },
      });
    }

    return updatedOrder;
  });
};

const deleteByIdFromDB = async (id: string): Promise<Order | null> => {
  const orderId = parseInt(id);

  const deletedOrder = await prisma.$transaction(async transaction => {
    const existingOrder = await transaction.order.findUnique({
      where: { id: orderId },
      select: {
        orderPart: true,
        statusId: true,
      },
    });

    if (!existingOrder) {
      throw new ApiError(404, `Order with ID ${orderId} not found.`);
    }

    const orderPart = existingOrder.orderPart;
    if (!orderPart) {
      throw new ApiError(400, `Order with ID ${orderId} has no parts.`);
    }

    if (
      existingOrder?.statusId !== 9 &&
      existingOrder?.statusId !== 11 &&
      existingOrder?.statusId !== 6
    ) {
      // Step 1: Restore inventory
      await transaction.inventory.update({
        where: { id: orderPart.inventoryId },
        data: {
          qty: { increment: orderPart.qty },
        },
      });

      // Step 2: Restore part tracking
      await transaction.part.update({
        where: { id: orderPart.partId },
        data: {
          availableQty: { increment: orderPart.qty },
          loanQty: { decrement: orderPart.qty },
          sell: { decrement: orderPart.qty },
        },
      });
    }

    // Step 3: Delete the order part
    await transaction.orderPart.delete({
      where: { id: orderPart.id },
    });

    // Step 4: Delete the order
    const order = await transaction.order.delete({
      where: { id: orderId },
    });

    return order;
  });

  return deletedOrder;
};

const getOrderFromDB = async (
  options: IPaginationOptions,
  startDate?: string,
  endDate?: string,
): Promise<
  IGenericResponse<{
    orderData: IOrderProduct[];
    customerPartsRequestData: ICustomerRequestProduct[];
  }>
> => {
  const { limit, page, skip } = paginationHelpers.calculatePagination(options);

  // Prepare date filter if provided
  const dateFilter =
    startDate || endDate
      ? {
          createdAt: {
            ...(startDate ? { gte: new Date(startDate) } : {}),
            ...(endDate ? { lte: new Date(endDate) } : {}),
          },
        }
      : {};

  // Start the transaction to get order data, customer parts request data, and the count for pagination
  const [
    orderData,
    customerPartsRequestData,
    totalOrderParts,
    totalCustomerRequests,
  ] = await prisma.$transaction([
    // Query for Order Parts
    prisma.orderPart.findMany({
      where: dateFilter,
      select: {
        id: true,
        qty: true,
        description: true,
        order: {
          select: {
            invoiceId: true,
            status: { select: { name: true } },
            partner: { select: { contact_person: true } },
          },
        },
        part: { select: { name: true } },
      },
      skip,
      take: limit,
    }),

    // Query for Customer Requested Parts
    prisma.customerRequestedPart.findMany({
      where: dateFilter,
      select: {
        id: true,
        qty: true,
        part: { select: { name: true } },
        customerRequest: {
          select: {
            partner: { select: { contact_person: true } },
            status: { select: { name: true } },
          },
        },
      },
      skip,
      take: limit,
      orderBy:
        options.sortBy && options.sortOrder
          ? { [options.sortBy]: options.sortOrder }
          : { createdAt: "desc" },
    }),

    // Count total Order Parts for pagination
    prisma.orderPart.count({ where: dateFilter }),

    // Count total Customer Requested Parts for pagination
    prisma.customerRequestedPart.count({ where: dateFilter }),
  ]);

  // Calculate the total for pagination across both datasets
  const total = totalOrderParts + totalCustomerRequests;

  return {
    meta: { total, page, limit },
    data: { orderData, customerPartsRequestData },
  };
};

// getOrderFromDB;

export const OrderService = {
  insertIntoDB,
  updateOrderStatus,
  getAllFromDB,
  getMyAllFromDB,
  getPartsFromDB,
  updateOneInDB,
  getByIdFromDB,
  getOrderFromDB,
  deleteByIdFromDB,
};
