import { Principal, Prisma } from "@prisma/client";
import bcrypt from "bcryptjs";
import { JwtPayload } from "jsonwebtoken";
import config from "../../../config";
import { paginationHelpers } from "../../../helpers/paginationHelper";
import { IGenericResponse } from "../../../interfaces/common";
import { IPaginationOptions } from "../../../interfaces/pagination";
import prisma from "../../../shared/prisma";
import { principalSearchableFields } from "./principal.constaints";
import { IPrincipalFilterRequest } from "./principal.interface";

const insertIntoDB = async (data: Principal): Promise<Principal> => {
  const hashedPassword = await bcrypt.hash(
    data.password || "123456",
    Number(config.bycrypt_salt_rounds),
  );
  data.password = hashedPassword;
  const result = await prisma.principal.create({
    data,
  });
  return result;
};

const getAllFromDB = async (
  filters: IPrincipalFilterRequest,
  options: IPaginationOptions,
): Promise<IGenericResponse<Principal[]>> => {
  const { page, limit, skip } = paginationHelpers.calculatePagination(options);
  const { searchTerm } = filters;

  const andConditions = [];

  if (searchTerm) {
    andConditions.push({
      OR: principalSearchableFields.map(field => ({
        [field]: {
          contains: searchTerm,
          mode: "insensitive",
        },
      })),
    });
  }

  const whereConditons: Prisma.PrincipalWhereInput =
    andConditions.length > 0 ? { AND: andConditions } : {};

  const result = await prisma.principal.findMany({
    skip,
    take: limit,
    where: whereConditons,
  });
  const total = await prisma.principal.count({
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
  payload: Partial<Principal>,
): Promise<Principal> => {
  const result = await prisma.principal.update({
    where: {
      id: parseInt(user.id),
    },
    data: payload,
  });
  return result;
};

const updateOneInDB = async (
  id: string,
  payload: Partial<Principal>,
): Promise<Principal> => {
  const result = await prisma.principal.update({
    where: {
      id: parseInt(id),
    },
    data: payload,
  });
  return result;
};

const getByIdFromDB = async (id: number): Promise<Principal | null> => {
  const result = await prisma.principal.findUnique({
    where: {
      id,
    },
  });
  return result;
};
const getMyProfileByIdFromDB = async (
  user: JwtPayload,
): Promise<Principal | null> => {
  const result = await prisma.principal.findUnique({
    where: {
      id: user.id,
    },
  });
  return result;
};
const deleteFromDB = async (id: number): Promise<Principal | null> => {
  const result = await prisma.principal.delete({
    where: {
      id: id,
    },
  });
  return result;
};

export const PrincipalService = {
  insertIntoDB,
  getByIdFromDB,
  getAllFromDB,
  updateOneInDB,
  getMyProfileByIdFromDB,
  updateMyProfileInDB,
  deleteFromDB,
};
