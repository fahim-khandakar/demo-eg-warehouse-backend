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

// DON'T CHANGE THE ORDER
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
  // ------------------------------
  // CHECK IF ADMIN EXISTS
  // ------------------------------
  const existing = await prisma.user.findUnique({
    where: { email: config.default_super_admin },
  });

  if (existing) {
    console.log("⚠️ Super admin already exists. Skipping seeding.");
    return;
  }

  await prisma.$transaction(async tx => {
    // ------------------------------
    // SEED POWERS (SAFE)
    // ------------------------------
    const powers = await Promise.all(
      allPowers.map(name =>
        tx.power.upsert({
          where: { name },
          update: {},
          create: { name },
        }),
      ),
    );

    // ------------------------------
    // SEED STATUSES (MANUAL ID SAFE)
    // ------------------------------
    for (let i = 0; i < allStatus.length; i++) {
      const name = allStatus[i];
      const id = i + 1;

      await tx.status.upsert({
        where: { name }, // If exists, update
        update: { name },
        create: {
          // If not exists, create manual ID
          id,
          name,
        },
      });
    }

    // ------------------------------
    // SEED BRANCH
    // ------------------------------
    const branch = await tx.branch.upsert({
      where: { name: "Head Office" },
      update: {},
      create: { name: "Head Office" },
    });

    // ------------------------------
    // HASH PASSWORD
    // ------------------------------
    const hashedPassword = await bcrypt.hash(
      config.default_pass || "NEC@123456",
      Number(config.bycrypt_salt_rounds),
    );

    // ------------------------------
    // CREATE SUPER ADMIN
    // ------------------------------
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
              connect: powers.map(p => ({ id: p.id })),
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
      statuses: allStatus,
    });
  });
};
