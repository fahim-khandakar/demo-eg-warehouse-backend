import { Branch, Power, Prisma } from "@prisma/client";
import bcrypt from "bcryptjs";
import { JwtPayload } from "jsonwebtoken";
import config from "../../../config";
import { ENUM_USER_ROLE } from "../../../enum/user";
import ApiError from "../../../errors/ApiError";
import { paginationHelpers } from "../../../helpers/paginationHelper";
import { IGenericResponse } from "../../../interfaces/common";
import { IPaginationOptions } from "../../../interfaces/pagination";
import prisma from "../../../shared/prisma";
import { sendVerificationEmail } from "../Email/Templates/userVerifyTemp";
import { generateVerificationToken } from "../Email/Templates/utils";
import { UserDetails } from "./../../../../node_modules/.prisma/client/index.d";
import { userSearchableFields } from "./user.constaints";
import { CreateUserInput, IUserFilterRequest } from "./user.interface";

type UserWithDetails = {
  id: number;
  email: string;
  role: string;
  details: {
    name: string;
    email: string;
    designation: string;
    contactNo: string;
    profileImage: string;
    powers: { id: number }[];
  } | null;
};

const insertIntoDB = async (
  data: CreateUserInput,
  role: string,
): Promise<UserWithDetails> => {
  const hashedPassword = await bcrypt.hash(
    data.password || config.default_pass || "123456",
    Number(config.bycrypt_salt_rounds),
  );
  const result = await prisma.user.create({
    data: {
      email: data.email,
      role: role,
      password: hashedPassword,
      details: {
        create: {
          name: data.name,
          email: data.email,
          contactNo: data.contactNo,
          branchId: data.branchId,
          designation: data.designation,
          profileImage: data.profileImage,
          powers: {
            connect: data.powerId.map(id => ({ id })),
          },
        },
      },
    },
    select: {
      id: true,
      email: true,
      role: true,
      details: {
        select: {
          name: true,
          email: true,
          contactNo: true,
          designation: true,
          profileImage: true,
          powers: { select: { id: true } },
        },
      },
    },
  });

  if (result) {
    const token = await generateVerificationToken(result.id);
    sendVerificationEmail(data.email, token);
  }
  return result;
};

const createPower = async (data: Power): Promise<Power> => {
  const result = await prisma.power.create({
    data: {
      name: data.name,
    },
  });

  return result;
};

const createBranch = async (data: Branch): Promise<Branch> => {
  const result = await prisma.branch.create({
    data: {
      name: data.name,
    },
  });

  return result;
};

const getBranchFromDB = async (): Promise<Power[]> => {
  const result = await prisma.branch.findMany({});
  return result;
};

const getPowersFromDB = async (): Promise<Power[]> => {
  const result = await prisma.power.findMany({});
  return result;
};

const getAllFromDB = async (
  filters: IUserFilterRequest,
  options: IPaginationOptions,
): Promise<IGenericResponse<UserDetails[]>> => {
  const { page, limit, skip } = paginationHelpers.calculatePagination(options);
  const { searchTerm } = filters;

  const andConditions = [];

  if (searchTerm) {
    andConditions.push({
      OR: userSearchableFields.map(field => ({
        [field]: {
          contains: searchTerm,
          mode: "insensitive",
        },
      })),
    });
  }

  const whereConditons: Prisma.UserDetailsWhereInput =
    andConditions.length > 0 ? { AND: andConditions } : {};

  const result = await prisma.userDetails.findMany({
    where: whereConditons,
    include: {
      powers: true,
      branch: true,
      user: {
        select: {
          id: true,
          role: true,
        },
      },
    },
    skip,
    take: limit,
  });
  const total = await prisma.userDetails.count({
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
  const result = await prisma.user.findUnique({
    where: {
      id,
    },
    select: {
      id: true,
      email: true,
      role: true,
      details: {
        select: {
          name: true,
          email: true,
          contactNo: true,
          designation: true,
          profileImage: true,
          powers: {
            select: {
              id: true,
            },
          },
        },
      },
    },
  });

  if (result && result.details) {
    // Create a new details object to ensure type safety
    const updatedDetails = {
      ...result.details,
      powers: result.details.powers.map(power => power.id), // Flatten the powers array
    };

    return {
      ...result,
      details: updatedDetails, // Replace the details object with the updated one
    };
  }

  return result;
};

const updateOneInDB = async (
  id: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  payload: any,
): Promise<UserDetails> => {
  const numericId = parseInt(id);
  if (isNaN(numericId)) {
    throw new Error("Invalid ID format");
  }

  // Extract nested user updates
  const { user, role, ...userDetailsUpdate } = payload;

  const result = await prisma.userDetails.update({
    where: { id: numericId },
    data: {
      ...userDetailsUpdate, // only fields from UserDetails
      user:
        user || role
          ? {
              update: {
                ...(user?.email && { email: user.email }),
                ...(user?.password && { password: user.password }),
                ...(role && { role }), // ✅ update role inside User
                ...(user?.active !== undefined && { active: user.active }),
                ...(user?.verified !== undefined && {
                  verified: user.verified,
                }),
              },
            }
          : undefined,
    },
    include: { user: true },
  });

  return result;
};

const deleteByIdFromDB = async (
  id: string,
  reqUser: JwtPayload,
): Promise<UserDetails | null> => {
  const userId = parseInt(id);

  try {
    const result = await prisma.$transaction(async prisma => {
      const user = await prisma.user.findUnique({
        where: {
          id: userId,
        },
      });
      if (
        user?.role !== ENUM_USER_ROLE.SUPER_ADMIN &&
        user?.id !== reqUser.id
      ) {
        throw new ApiError(400, "ACCESS DENIED");
      }

      await prisma.userOtp.deleteMany({
        where: { userId },
      });

      await prisma.userActivity.deleteMany({
        where: { userId },
      });

      const deleteUserDetails = await prisma.userDetails.delete({
        where: {
          id: userId,
        },
      });
      // Delete the associated User entry by using the userId
      await prisma.user.delete({
        where: {
          id: deleteUserDetails.userId, // Delete the user by userId from UserDetails
        },
      });

      return deleteUserDetails;
    });

    return result;
  } catch (error) {
    throw new ApiError(500, (error as Error).message);
  }
};

export const userService = {
  insertIntoDB,
  createPower,
  createBranch,
  getBranchFromDB,
  updateOneInDB,
  getByIdFromDB,
  getAllFromDB,
  getPowersFromDB,
  deleteByIdFromDB,
};
