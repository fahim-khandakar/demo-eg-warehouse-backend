import { Partner, Prisma, ShipTo } from "@prisma/client";
import bcrypt from "bcryptjs";
import { JwtPayload } from "jsonwebtoken";
import config from "../../../config";
import { paginationHelpers } from "../../../helpers/paginationHelper";
import { IGenericResponse } from "../../../interfaces/common";
import { IPaginationOptions } from "../../../interfaces/pagination";
import prisma from "../../../shared/prisma";
import { partnerSearchableFields } from "./partner.constaints";
import { IPartnerFilterRequest } from "./partner.interface";

const insertIntoDB = async (data: Partner): Promise<Partner> => {
  const hashedPassword = await bcrypt.hash(
    data.password || "123456",
    Number(config.bycrypt_salt_rounds),
  );
  data.password = hashedPassword;
  const result = await prisma.partner.create({
    data,
  });
  return result;
};

const SenderInsertIntoDB = async (data: ShipTo): Promise<ShipTo> => {
  const result = await prisma.shipTo.create({
    data,
  });
  return result;
};

const getAllFromDB = async (
  filters: IPartnerFilterRequest,
  options: IPaginationOptions,
): Promise<IGenericResponse<Partner[]>> => {
  const { page, limit, skip } = paginationHelpers.calculatePagination(options);
  const { searchTerm } = filters;

  const andConditions = [];

  if (searchTerm) {
    andConditions.push({
      OR: partnerSearchableFields.map(field => ({
        [field]: {
          contains: searchTerm,
          mode: "insensitive",
        },
      })),
    });
  }

  const whereConditons: Prisma.PartnerWhereInput =
    andConditions.length > 0 ? { AND: andConditions } : {};

  const result = await prisma.partner.findMany({
    skip,
    take: limit,
    where: whereConditons,
  });
  const total = await prisma.partner.count({
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

const updateMyProfileInDB = async (
  user: JwtPayload,
  payload: Partial<Partner>,
): Promise<Partner> => {
  const result = await prisma.partner.update({
    where: {
      id: parseInt(user.id),
    },
    data: payload,
  });
  return result;
};

const updateOneInDB = async (
  id: string,
  payload: Partial<Partner>,
): Promise<Partner> => {
  const result = await prisma.partner.update({
    where: {
      id: parseInt(id),
    },
    data: payload,
  });
  return result;
};

const getShipToFromDB = async (): Promise<ShipTo[] | null> => {
  const result = await prisma.shipTo.findMany();
  return result;
};

const getByIdFromDB = async (id: number): Promise<Partner | null> => {
  const result = await prisma.partner.findUnique({
    where: {
      id,
    },
  });
  return result;
};
const getMyProfileByIdFromDB = async (
  user: JwtPayload,
): Promise<Partner | null> => {
  const result = await prisma.partner.findUnique({
    where: {
      id: user.id,
    },
  });
  return result;
};
const deleteFromDB = async (id: number): Promise<Partner | null> => {
  const result = await prisma.partner.delete({
    where: {
      id: id,
    },
  });
  return result;
};

export const PartnerService = {
  insertIntoDB,
  getByIdFromDB,
  SenderInsertIntoDB,
  getShipToFromDB,
  getAllFromDB,
  updateOneInDB,
  getMyProfileByIdFromDB,
  updateMyProfileInDB,
  deleteFromDB,
};
