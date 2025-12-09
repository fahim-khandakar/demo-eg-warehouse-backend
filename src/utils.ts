import bcrypt from "bcryptjs";
import config from "./config";
import prisma from "./shared/prisma";

const allPowers = [
  "add product",
  "edit product",
  "add loan",
  "update loan",
  "add pod",
  "pod update",
  "edit event",
] as const;

//Open,Delivered,Badbuffer Pending,Closed, Approved, Rejected,Completed

// const allStatus = [
//   "Open",
//   "Delivered",
//   "Badbuffer",
//   "Pending",
//   "Closed",
//   "Approved",
//   "Rejected",
//   "Completed",
// ] as const;

// don't change the array order
const allStatus = [
  "AP",
  "APPROVED",
  "HANDOVER",
  "DELIVERED",
  "OR",
  "WHR",
  "RECEIVED",
  "RETURNED",
  "SCRAP",
  "REJECTED",
  "GPR",
] as const;

export const bootstrapSuperAdmin = async () => {
  // Check if super admin already exists
  const existing = await prisma.user.findUnique({
    where: { email: config.default_super_admin },
  });

  if (existing) {
    console.log("⚠️ Super admin already exists. Skipping seeding.");
    return;
  }

  await prisma.$transaction(async tx => {
    // Ensure all required powers exist
    const powers = await Promise.all(
      allPowers.map(name =>
        tx.power.upsert({
          where: { name },
          update: {},
          create: { name },
        }),
      ),
    );

    // Ensure all statuses exist
    const statuses = await Promise.all(
      allStatus.map(async (name, index) => {
        const existing = await tx.status.findFirst({
          where: { name },
        });

        if (existing) {
          return tx.status.update({
            where: { id: existing.id },
            data: { name },
          });
        }

        return tx.status.create({
          data: {
            id: index + 1,
            name,
          },
        });
      }),
    );

    // Ensure "Head Office" branch exists
    const branch = await tx.branch.upsert({
      where: { name: "Head Office" },
      update: {},
      create: { name: "Head Office" },
    });

    // Hash password
    const hashedPassword = await bcrypt.hash(
      config.default_pass || "NEC@123456",
      Number(config.bycrypt_salt_rounds),
    );

    const result = await tx.user.create({
      data: {
        email: config.default_super_admin,
        role: "super_admin",
        password: hashedPassword,
        details: {
          create: {
            name: "Super Admin",
            email: config.default_super_admin,
            contactNo: "+8801700000000",
            branchId: branch.id,
            designation: "Super Admin",
            profileImage: "",
            powers: {
              connect: powers.map(power => ({ id: power.id })),
            },
          },
        },
      },
      include: { details: true },
    });

    console.log("✅ Super Admin created successfully:", {
      id: result.id,
      email: result.email,
      branch: branch.name,
      powers: powers.map(p => p.name),
      statuses: statuses.map(s => s.name),
    });
  });
};
