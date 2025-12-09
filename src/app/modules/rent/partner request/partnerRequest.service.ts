import { CustomerRequest, Prisma } from "@prisma/client";
import { JwtPayload } from "jsonwebtoken";
import { ENUM_USER_ROLE } from "../../../../enum/user";
import ApiError from "../../../../errors/ApiError";
import { paginationHelpers } from "../../../../helpers/paginationHelper";
import { IGenericResponse } from "../../../../interfaces/common";
import { IPaginationOptions } from "../../../../interfaces/pagination";
import prisma from "../../../../shared/prisma";
import { PartRequestSearchableFields } from "./partnerRequest.constaints";
import {
  ICustomerRequestCreatedEvent,
  ICustomerRequestEditEvent,
  ICustomerRequestFilterRequest,
} from "./partnerRequest.interface";
import { generateOrderId } from "./partnerRequest.utils";

const insertIntoDB = async (
  data: ICustomerRequestCreatedEvent,
): Promise<CustomerRequest> => {
  try {
    const result = await prisma.customerRequest.create({
      data: {
        partnerId: data.partnerId,
        caseId: data.caseId,
        callDate: data.callDate,
        approvalImage: data.approvalImage,
        saidId: data.saidId,
        eventNo: data.eventNo,
        remarks: data.remarks,
        statusId: 1,
        parts: {
          create: {
            partId: data.parts.partId,
            qty: data.parts.qty,
            description: data.parts.description,
          },
        },
      },
      include: {
        parts: { include: { part: true } },
        partner: true,
      },
    });

    // if (result.parts?.part) {
    //   await sendEmail(
    //     config?.default_super_admin,
    //     "Customer Request Received",
    //     customerRequestTemplate(
    //       result.partner?.company || "Partner",
    //       result.id.toString(),
    //       result.parts.part.name,
    //       result.parts.qty,
    //     ),
    //   );
    // }

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

const updatePartRequestStatus = async (
  requestId: number,
  statusId: number,
  customerStatusId: number,
): Promise<CustomerRequest> => {
  try {
    console.log("statusId", statusId, "customerId", customerStatusId);
    const result = await prisma.$transaction(async transaction => {
      const partRequest = await transaction.customerRequest.findUnique({
        where: { id: requestId },
        include: { status: true, partner: true },
      });

      if (!partRequest) {
        throw new ApiError(404, `partRequest with ID ${requestId} not found.`);
      }

      if (
        partRequest.statusId === 8 ||
        partRequest.statusId === 10 ||
        partRequest.statusId === 11
      ) {
        throw new ApiError(
          400,
          `partRequest with ID ${requestId} is already ${partRequest?.status?.name}.`,
        );
      }

      // Restore Inventory

      // update customer request
      await transaction.customerRequest.update({
        where: { id: requestId },
        data: { statusId: customerStatusId },
      });

      if (partRequest?.orderId) {
        // Update Order Status to Closed
        await transaction.order.update({
          where: { id: partRequest.orderId },
          data: {
            statusId: statusId,
            closeDate: [7, 11, 10, 9].includes(statusId) ? new Date() : null,
            updatedAt: new Date(),
          },
          include: { partner: true, status: true },
        });
      }

      return partRequest;
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

const approveRequest = async (
  customerRequestId: number,
  locationId: number,
  poll: string,
) => {
  const customerRequest = await prisma.customerRequest.findUnique({
    where: { id: customerRequestId },
    include: {
      partner: true,
      parts: { include: { part: true } },
    },
  });

  if (!customerRequest) {
    throw new ApiError(400, "CustomerRequest not found!");
  }

  if (customerRequest.statusId !== 1) {
    throw new ApiError(
      400,
      `CustomerRequest ${customerRequestId} not AP or not ENP/AP`,
    );
  }

  // take first part
  const orderPart = customerRequest.parts;
  if (!orderPart) {
    throw new ApiError(400, "No part found for this customer request.");
  }

  const inventory = await prisma.inventory.findFirst({
    where: {
      locationId,
      partId: orderPart.partId,
      poll,
    },
  });

  if (!inventory || inventory.qty < orderPart.qty) {
    throw new ApiError(
      400,
      `Insufficient quantity for part ${orderPart.partId}.`,
    );
  }

  const orderId = await generateOrderId();

  const order = await prisma.$transaction(async transaction => {
    const order = await transaction.order.create({
      data: {
        invoiceId: orderId,
        partnerId: customerRequest.partnerId,
        caseId: customerRequest.caseId,
        callDate: customerRequest.callDate,
        remarks: customerRequest?.remarks,
        saidId: customerRequest?.saidId,
        eventNo: customerRequest?.eventNo,
        qty: orderPart.qty,
        statusId: 2,
        customerRequest: { connect: { id: customerRequest.id } },
      },
    });

    await transaction.orderPart.create({
      data: {
        orderId: order.id,
        inventoryId: inventory.id,
        partId: orderPart.partId,
        qty: orderPart.qty,
        description: orderPart.description,
      },
    });

    await transaction.inventory.update({
      where: { id: inventory.id },
      data: { qty: { decrement: orderPart.qty } },
    });

    await transaction.part.update({
      where: { id: orderPart.partId },
      data: {
        availableQty: { decrement: orderPart.qty },
        sell: { increment: orderPart.qty },
        loanQty: { increment: orderPart.qty },
      },
    });

    await transaction.customerRequest.update({
      where: { id: customerRequestId },
      data: { statusId: 2, orderId: order?.id },
    });

    return order;
  });

  // if (customerRequest.partner?.email) {
  //   await sendEmail(
  //     customerRequest.partner.email,
  //     "Customer Request Approved",
  //     customerRequestApprovedTemplate(
  //       customerRequest.partner.company,
  //       customerRequest.id.toString(),
  //       orderPart.part?.name ?? "",
  //       orderPart.qty,
  //       order.invoiceId,
  //     ),
  //   );
  // }

  return order;
};

const getAllFromDB = async (
  filters: ICustomerRequestFilterRequest,
  options: IPaginationOptions,
) => {
  const { page, limit, skip } = paginationHelpers.calculatePagination(options);
  const { searchTerm } = filters;

  const andConditions = [];

  if (searchTerm) {
    andConditions.push({
      OR: PartRequestSearchableFields.map(field => ({
        [field]: {
          contains: searchTerm,
          mode: "insensitive",
        },
      })),
    });
  }

  const whereConditons: Prisma.CustomerRequestWhereInput =
    andConditions.length > 0 ? { AND: andConditions } : {};

  const result = await prisma.customerRequest.findMany({
    where: whereConditons,
    select: {
      id: true,
      saidId: true,
      eventNo: true,
      remarks: true,
      approvalImage: true,
      order: {
        select: {
          statusId: true,
        },
      },
      partner: {
        select: {
          id: true,
          contact_person: true,
          company: true,
        },
      },
      status: {
        select: {
          id: true,
          name: true,
        },
      },
      parts: {
        select: {
          part: {
            select: {
              id: true,
              name: true,
            },
          },
          qty: true,
        },
      },
      caseId: true,
      callDate: true,
      statusId: true,
      createdAt: true,
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

const getMyOrdersFromDB = async (
  filters: ICustomerRequestFilterRequest,
  options: IPaginationOptions,
  user: JwtPayload,
): Promise<IGenericResponse<CustomerRequest[]>> => {
  const { page, limit, skip } = paginationHelpers.calculatePagination(options);
  const { searchTerm } = filters;

  try {
    const andConditions = [];
    if (user?.role === ENUM_USER_ROLE.PARTNER) {
      andConditions.push({ partnerId: user?.id });
    }

    andConditions.push({
      statusId: { notIn: [6, 8, 9, 11] },
    });

    if (searchTerm) {
      andConditions.push({
        OR: PartRequestSearchableFields.map(field => ({
          [field]: {
            contains: searchTerm,
            mode: "insensitive",
          },
        })),
      });
    }

    const whereConditons: Prisma.CustomerRequestWhereInput =
      andConditions.length > 0 ? { AND: andConditions } : {};

    const result = await prisma.customerRequest.findMany({
      where: whereConditons,
      select: {
        id: true,
        saidId: true,
        approvalImage: true,
        remarks: true,
        eventNo: true,
        orderId: true,
        order: {
          select: {
            statusId: true,
          },
        },
        status: {
          select: {
            id: true,
            name: true,
          },
        },
        parts: {
          select: {
            part: {
              select: {
                id: true,
                name: true,
              },
            },
            qty: true,
          },
        },
        partnerId: true,
        caseId: true,
        callDate: true,
        statusId: true,
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
  } catch (error) {
    throw new ApiError(500, "An error occurred while fetching data");
  }
};

const getMyCompanyOrdersFromDB = async (
  filters: ICustomerRequestFilterRequest,
  options: IPaginationOptions,
  user: JwtPayload,
) => {
  const { page, limit, skip } = paginationHelpers.calculatePagination(options);
  const { searchTerm } = filters;

  const companyPartners = await prisma.partner.findMany({
    where: { company: user.company },
    select: { id: true },
  });

  const partnerIds = companyPartners.map(p => p.id);

  const andConditions: Prisma.CustomerRequestWhereInput[] = [
    { partnerId: { in: partnerIds } },
    {
      statusId: { in: [8, 10] },
    },
  ];

  if (searchTerm) {
    andConditions.push({
      OR: PartRequestSearchableFields.map(field => ({
        [field]: {
          contains: searchTerm,
          mode: "insensitive",
        },
      })),
    });
  }

  const whereConditons: Prisma.CustomerRequestWhereInput =
    andConditions.length > 0 ? { AND: andConditions } : {};

  const result = await prisma.customerRequest.findMany({
    where: whereConditons,
    select: {
      id: true,
      callDate: true,
      caseId: true,
      saidId: true,
      eventNo: true,
      createdAt: true,
      status: true,
      partner: {
        select: {
          company: true,
          contact_person: true,
        },
      },
      parts: {
        select: {
          part: {
            select: {
              name: true,
            },
          },
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
  const result = await prisma.customerRequest.findUnique({
    where: {
      id,
    },
    select: {
      id: true,
      eventNo: true,
      remarks: true,
      saidId: true,
      approvalImage: true,
      partner: {
        select: {
          id: true,
          contact_person: true,
          company: true,
        },
      },
      parts: {
        select: {
          id: true,
          part: {
            select: {
              id: true,
              name: true,
              alternatePartName: true,
            },
          },
          qty: true,
        },
      },
      caseId: true,
      callDate: true,
      statusId: true,
      status: {
        select: {
          id: true,
          name: true,
        },
      },
      createdAt: true,
    },
  });
  return result;
};
const getMyOrderByIdFromDB = async (id: number, user: JwtPayload) => {
  const result = await prisma.customerRequest.findFirst({
    where: {
      id,
      partnerId: user.id,
    },
    select: {
      id: true,
      eventNo: true,
      order: {
        select: {
          statusId: true,
        },
      },
      partner: {
        select: {
          id: true,
          contact_person: true,
          company: true,
        },
      },
      parts: {
        select: {
          id: true,
          part: {
            select: {
              id: true,
              name: true,
              alternatePartName: true,
            },
          },
          qty: true,
        },
      },
      caseId: true,
      callDate: true,
      statusId: true,
      status: {
        select: {
          id: true,
          name: true,
        },
      },
      createdAt: true,
    },
  });

  if (!result) {
    throw new ApiError(404, `Order with ID ${id} not found for this user.`);
  }

  return result;
};

const updateOneInDB = async (
  id: string,
  payload: ICustomerRequestEditEvent,
): Promise<CustomerRequest> => {
  try {
    const existingRequest = await prisma.customerRequest.findUnique({
      where: { id: parseInt(id) },
      include: { parts: true },
    });

    if (!existingRequest) {
      throw new ApiError(400, `CustomerRequest with ID ${id} not found.`);
    }
    if (existingRequest?.orderId) {
      const order = await prisma.order.findUnique({
        where: { id: existingRequest.orderId },
        select: {
          eventNo: true,
          id: true,
        },
      });

      if (!order) {
        throw new ApiError(400, "Ordre not found");
      }

      if (payload.eventNo) {
        await prisma.order.update({
          where: { id: order.id },
          data: { eventNo: payload.eventNo },
        });
      }
    }
    if (payload.statusId && payload.statusId === 5) {
      throw new ApiError(400, "Order request approved cannot be updated.");
    }

    if (payload.parts) {
      const { partId, qty, description } = payload.parts;

      // Check if the existingRequest already has a related customerRequestedPart
      const existingPart = existingRequest.parts;

      if (existingPart) {
        await prisma.customerRequestedPart.update({
          where: { id: existingPart.id },
          data: {
            qty: qty,
          },
        });
      } else {
        await prisma.customerRequestedPart.create({
          data: {
            customerRequestId: existingRequest.id,
            partId: partId,
            qty: qty,
            description: description,
          },
        });
      }
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updateData: any = {
      updatedAt: new Date(),
      ...payload,
    };

    // Remove statusId if it's null or undefined to avoid Prisma errors
    if (payload.statusId === undefined || payload.statusId === null) {
      delete updateData.statusId;
    }

    const result = await prisma.customerRequest.update({
      where: {
        id: parseInt(id),
      },
      data: {
        ...updateData,
        parts: payload.parts
          ? {
              update: {
                qty: payload.parts.qty,
                partId: payload.parts.partId,
              },
            }
          : undefined,
      },
      include: {
        parts: true,
      },
    });

    return result;
  } catch (error) {
    throw new ApiError(400, (error as Error).message);
  }
};

const deleteByIdFromDB = async (
  id: string,
): Promise<CustomerRequest | null> => {
  const customerRequestId = parseInt(id);
  const request = await prisma.customerRequest.findUnique({
    where: {
      id: customerRequestId,
    },
    select: {
      orderId: true,
    },
  });
  if (request?.orderId) {
    throw new ApiError(
      400,
      "You can't delete this request cause it's connect with a order!",
    );
  }
  const deletedOrder = await prisma.$transaction(async prisma => {
    await prisma.customerRequestedPart.deleteMany({
      where: {
        customerRequestId: customerRequestId,
      },
    });

    const order = await prisma.customerRequest.delete({
      where: {
        id: customerRequestId,
      },
    });

    return order;
  });

  return deletedOrder;
};
const deleteMyOrderByIdFromDB = async (
  id: string,
  user: JwtPayload,
): Promise<CustomerRequest> => {
  const customerRequestId = Number(id);

  if (isNaN(customerRequestId)) {
    throw new ApiError(400, "Invalid order ID.");
  }

  return await prisma.$transaction(async tx => {
    // 1. Check if the order belongs to the user
    const existingOrder = await tx.customerRequest.findFirst({
      where: {
        id: customerRequestId,
        partnerId: user.id,
      },
    });

    if (!existingOrder) {
      throw new ApiError(
        404,
        `CustomerRequest with ID ${id} not found or does not belong to you.`,
      );
    }

    // 2. Delete child parts first
    await tx.customerRequestedPart.deleteMany({
      where: { customerRequestId },
    });

    // 3. Delete main record
    const deletedOrder = await tx.customerRequest.delete({
      where: { id: customerRequestId },
    });

    return deletedOrder;
  });
};

export const PartnerPartRequestService = {
  insertIntoDB,
  approveRequest,
  getAllFromDB,
  getMyOrdersFromDB,
  getMyCompanyOrdersFromDB,
  updateOneInDB,
  getByIdFromDB,
  getMyOrderByIdFromDB,
  deleteByIdFromDB,
  deleteMyOrderByIdFromDB,
  updatePartRequestStatus,
};
