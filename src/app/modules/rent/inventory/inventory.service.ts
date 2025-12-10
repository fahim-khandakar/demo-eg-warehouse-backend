/* eslint-disable @typescript-eslint/no-explicit-any */
import { Inventory, InventoryLog, Prisma } from "@prisma/client";
import ApiError from "../../../../errors/ApiError";
import { paginationHelpers } from "../../../../helpers/paginationHelper";
import { IGenericResponse } from "../../../../interfaces/common";
import { IPaginationOptions } from "../../../../interfaces/pagination";
import prisma from "../../../../shared/prisma";
import { inventorySearchableFields } from "./inventory.constaints";
import {
  IInventoryCreatedEvent,
  IInventoryCreatedEventMultiple,
  IInventoryFilterRequest,
  IInventoryList,
  InventoryItem,
  InventoryLogWithDetails,
} from "./inventory.interface";

const insertIntoDB = async (
  data: IInventoryCreatedEvent,
): Promise<Inventory> => {
  return await prisma.$transaction(async prisma => {
    // Fetch the part with a lock to prevent race conditions
    const part = await prisma.part.findUnique({
      where: { name: data.name },
      select: { id: true, totalQty: true, availableQty: true },
    });

    if (!part) {
      throw new ApiError(400, "Part not found");
    }

    // Update part total and available quantity inside the transaction
    await prisma.part.update({
      where: { id: part.id },
      data: {
        totalQty: { increment: data.qty },
        availableQty: { increment: data.qty },
      },
    });

    // Check if inventory exists for the specified part and location
    let inventory = await prisma.inventory.findFirst({
      where: { partId: part.id, locationId: data.location, poll: data.poll },
    });

    if (inventory) {
      // Update existing inventory quantity
      inventory = await prisma.inventory.update({
        where: { id: inventory.id },
        data: { qty: { increment: data.qty } },
      });
    } else {
      // Create new inventory if it does not exist
      inventory = await prisma.inventory.create({
        data: {
          partId: part.id,
          locationId: data.location,
          qty: data.qty,
          poll: data.poll,
        },
      });
    }

    // Insert inventory log within the transaction
    await prisma.inventoryLog.create({
      data: {
        inventoryId: inventory.id,
        eventNo: data.eventNo,
        remarks: data.remarks,
        addedQty: data.qty,
      },
    });

    return inventory;
  });
};

export const insertMultipleIntoDB = async (
  data: IInventoryCreatedEventMultiple[],
  chunkSize = 50, // adjust per batch
) => {
  if (!Array.isArray(data) || data.length === 0) {
    throw new ApiError(400, "No inventory data provided.");
  }

  const inventories: any[] = [];

  // Split data into chunks
  for (let i = 0; i < data.length; i += chunkSize) {
    const chunk = data.slice(i, i + chunkSize);

    // 1️⃣ Prepare unique part & rack names
    const partNames = [...new Set(chunk.map(d => d.name))];
    const rackNames = [...new Set(chunk.map(d => d.rack))];

    // 2️⃣ Upsert parts
    const existingParts = await prisma.part.findMany({
      where: { name: { in: partNames } },
    });
    const partMap = new Map(existingParts.map(p => [p.name, p]));
    const missingParts = partNames.filter(n => !partMap.has(n));

    if (missingParts.length > 0) {
      await prisma.part.createMany({
        data: missingParts.map(name => ({
          name,
          totalQty: 0,
          availableQty: 0,
        })),
      });
      const newParts = await prisma.part.findMany({
        where: { name: { in: missingParts } },
      });
      newParts.forEach(p => partMap.set(p.name, p));
    }

    // 3️⃣ Upsert locations
    const existingLocations = await prisma.location.findMany({
      where: { rack: { in: rackNames } },
    });
    const locationMap = new Map(existingLocations.map(l => [l.rack, l]));
    const missingLocations = rackNames.filter(r => !locationMap.has(r));

    if (missingLocations.length > 0) {
      await prisma.location.createMany({
        data: missingLocations.map(r => ({ rack: r })),
      });
      const newLocations = await prisma.location.findMany({
        where: { rack: { in: missingLocations } },
      });
      newLocations.forEach(l => locationMap.set(l.rack, l));
    }

    // 4️⃣ Process each inventory item with upsert
    for (const item of chunk) {
      const part = partMap.get(item.name)!;
      const location = locationMap.get(item.rack)!;

      // Upsert inventory
      const inventory = await prisma.inventory.upsert({
        where: {
          locationId_partId_poll: {
            // ✅ correct compound unique name
            partId: part.id,
            locationId: location.id,
            poll: item.poll,
          },
        },

        update: {
          qty: { increment: item.qty },
          updatedAt: new Date(),
        },
        create: {
          partId: part.id,
          locationId: location.id,
          poll: item.poll,
          qty: item.qty,
        },
      });

      // Inventory log
      await prisma.inventoryLog.create({
        data: {
          inventoryId: inventory.id,
          eventNo: item.eventNo ?? null,
          addedQty: item.qty,
        },
      });

      // Part update
      await prisma.part.update({
        where: { id: part.id },
        data: {
          totalQty: { increment: item.qty },
          availableQty: { increment: item.qty },
        },
      });

      inventories.push(inventory);
    }
  }

  return { message: "Multiple inventories added", count: inventories.length };
};

const getAllFromDB = async (
  filters: IInventoryFilterRequest,
  options: IPaginationOptions,
): Promise<
  IGenericResponse<{ inventories: IInventoryList[]; totalQty: number }>
> => {
  const { page, limit, skip } = paginationHelpers.calculatePagination(options);
  const { searchTerm, ...filtersData } = filters;

  const andConditions = [];

  if (searchTerm) {
    andConditions.push({
      OR: inventorySearchableFields.map(field => {
        const [relation, key] = field.split(".");
        return {
          [relation]: {
            [key]: {
              contains: searchTerm,
              mode: "insensitive",
            },
          },
        };
      }),
    });
  }
  // Filters needs $and to fullfill all the conditions
  if (Object.keys(filtersData).length) {
    Object.entries(filtersData).forEach(([field, value]) => {
      andConditions.push({
        [field]: value,
      });
    });
  }

  const whereConditons: Prisma.InventoryWhereInput =
    andConditions.length > 0 ? { AND: andConditions } : {};
  const result = await prisma.inventory.findMany({
    where: whereConditons,
    select: {
      id: true,
      qty: true,
      poll: true,
      part: {
        select: {
          id: true,
          name: true,
          alternatePartName: true,
          alternatePartNametwo: true,
          description: true,
          totalQty: true,
          availableQty: true,
        },
      },
      location: {
        select: {
          id: true,
          rack: true,
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
  const total = await prisma.inventory.count({
    where: whereConditons,
  });

  const totalQty = await prisma.inventory.aggregate({
    where: whereConditons,
    _sum: {
      qty: true,
    },
  });
  return {
    meta: {
      page,
      limit,
      total,
    },
    data: {
      inventories: result,
      totalQty: totalQty._sum.qty || 0,
    },
  };
};

const getStocksAllFromDB = async (
  filters: IInventoryFilterRequest,
  options: IPaginationOptions,
): Promise<IGenericResponse<InventoryLogWithDetails[]>> => {
  const { page, limit, skip } = paginationHelpers.calculatePagination(options);
  const { searchTerm } = filters;

  // Build the filter for searchTerm
  const andConditions = [];

  if (searchTerm) {
    andConditions.push({
      OR: [
        {
          inventory: {
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

  const whereConditions: any =
    andConditions.length > 0 ? { AND: andConditions } : {};

  // Query the data from Prisma
  const result = await prisma.inventoryLog.findMany({
    where: whereConditions,
    skip,
    take: limit,
    select: {
      id: true,
      eventNo: true,
      addedQty: true,
      createdAt: true,
      remarks: true,
      inventory: {
        select: {
          id: true,
          part: {
            select: {
              id: true,
              name: true,
              alternatePartName: true,
              description: true,
            },
          },
          location: {
            select: {
              id: true,
              rack: true,
            },
          },
          poll: true,
          qty: true,
        },
      },
    },
    orderBy:
      options.sortBy && options.sortOrder
        ? { [options.sortBy]: options.sortOrder }
        : {
            createdAt: "desc",
          },
  });

  // Get total count of records for pagination
  const total = await prisma.inventoryLog.count({
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

const getByIdFromDB = async (id: number): Promise<Inventory | null> => {
  const result = await prisma.inventory.findUnique({
    where: {
      id,
    },
    include: {
      part: {
        select: {
          id: true,
          name: true,
          alternatePartName: true,
          description: true,
          totalQty: true,
          availableQty: true,
          loanQty: true,
          createdAt: true,
          updatedAt: true,
        },
      },
      location: {
        select: {
          id: true,
          rack: true,
        },
      },
    },
  });
  return result;
};
const getStockByIdFromDB = async (id: number) => {
  const result = await prisma.inventoryLog.findUnique({
    where: {
      id,
    },
    select: {
      id: true,
      eventNo: true,
      addedQty: true,
      remarks: true,
      createdAt: true,
      inventory: {
        select: {
          id: true,
          poll: true,
          part: {
            select: {
              id: true,
              name: true,
              alternatePartName: true,
              description: true,
            },
          },
          location: {
            select: {
              id: true,
              rack: true,
            },
          },
          qty: true,
        },
      },
    },
  });
  return result;
};

const updateOneInDB = async (
  id: string,
  payload: Partial<Inventory>,
): Promise<Inventory> => {
  const inventory = await prisma.inventory.findUnique({
    where: {
      id: parseInt(id, 10),
    },
  });
  if (!inventory) {
    throw new ApiError(400, "Inventory part not found");
  }

  if (!payload.partId || payload.qty === undefined) {
    throw new ApiError(400, "Invalid payload data");
  }

  const updatedWarehouseParts = await prisma.$transaction(async prisma => {
    // Update the inventory quantity
    const updatedInventory = await prisma.inventory.update({
      where: { id: inventory.id },
      data: { qty: payload.qty },
    });

    await prisma.part.update({
      where: { id: payload.partId },
      data: {
        availableQty: { decrement: inventory.qty },
        totalQty: { decrement: inventory.qty },
      },
    });

    await prisma.part.update({
      where: { id: payload.partId },
      data: {
        availableQty: { increment: payload.qty },
        totalQty: { increment: payload.qty },
      },
    });

    return updatedInventory;
  });

  return updatedWarehouseParts;
};

const updateInventoryLog = async (
  id: number,
  payload: Partial<InventoryLog>,
): Promise<InventoryLog> => {
  console.log("hello world", payload);
  const inventoryLog = await prisma.inventoryLog.findUnique({
    where: {
      id,
    },
    include: {
      inventory: {
        include: {
          part: true,
        },
      },
    },
  });

  if (!inventoryLog) {
    throw new ApiError(
      400,
      "Inventory log not found for the given event number",
    );
  }

  const { inventory, addedQty: oldQty } = inventoryLog;
  const { part } = inventory;

  const newQty = payload.addedQty ?? oldQty;
  const qtyDifference = newQty - oldQty;
  const updatedInventoryLog = await prisma.$transaction(async prisma => {
    // Update inventory quantity
    await prisma.inventory.update({
      where: { id: inventory.id },
      data: { qty: { increment: qtyDifference } },
    });
    await prisma.part.update({
      where: { id: part.id },
      data: {
        availableQty: { increment: qtyDifference },
        totalQty: { increment: qtyDifference },
      },
    });

    const updatedLog = await prisma.inventoryLog.update({
      where: { id: inventoryLog.id },
      data: {
        addedQty: payload.addedQty,
        eventNo: payload.eventNo,
        remarks: payload.remarks,
      },
    });

    return updatedLog;
  });

  return updatedInventoryLog;
};

const getInventoryFromDB = async (
  options: IPaginationOptions,
): Promise<IGenericResponse<InventoryItem[]>> => {
  const { limit, page, skip } = paginationHelpers.calculatePagination(options);

  const result = await prisma.inventory.findMany({
    select: {
      qty: true,
      poll: true,
      part: {
        select: {
          id: true,
          name: true,
          alternatePartName: true,
          alternatePartNametwo: true,
          description: true,
          totalQty: true,
          availableQty: true,
          loanQty: true,
          sell: true,
        },
      },
      location: {
        select: {
          id: true,
          rack: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
    skip,
    take: limit,
  });

  const total = await prisma.inventory.count({});

  return {
    meta: { total, page, limit },
    data: result,
  };
};

const deleteInventoryLogByIdFromDB = async (
  id: number,
): Promise<InventoryLog> => {
  return await prisma.$transaction(async tx => {
    // 1. Find log
    const inventoryLog = await tx.inventoryLog.findUnique({
      where: { id },
    });

    if (!inventoryLog) {
      throw new ApiError(404, "Inventory log not found");
    }

    // 2. Check inventory & related orders
    const inventory = await tx.inventory.findUnique({
      where: { id: inventoryLog.inventoryId },
      select: {
        id: true,
        qty: true,
        partId: true,
        orders: { select: { id: true } },
      },
    });

    if (!inventory) {
      throw new ApiError(404, "Inventory not found");
    }

    if (inventory.orders.length > 0) {
      throw new ApiError(
        400,
        "You cannot delete this log because it is linked with order records",
      );
    }

    // 3. Rollback qty
    const updatedQty = inventory.qty - inventoryLog.addedQty;

    if (updatedQty < 0) {
      throw new ApiError(
        400,
        "Cannot delete this log because it will result in negative inventory quantity",
      );
    }

    // Update inventory
    await tx.inventory.update({
      where: { id: inventory.id },
      data: { qty: updatedQty },
    });

    // 4. Also update Part.availableQty
    await tx.part.update({
      where: { id: inventory.partId },
      data: {
        availableQty: { decrement: inventoryLog.addedQty },
        totalQty: { decrement: inventoryLog.addedQty },
      },
    });

    // 5. Finally delete log
    await tx.inventoryLog.delete({
      where: { id },
    });

    return inventoryLog;
  });
};

const deleteInventoryByIdFromDB = async (id: number): Promise<Inventory> => {
  return await prisma.$transaction(async tx => {
    // 1. Find inventory with orders
    const inventory = await tx.inventory.findUnique({
      where: { id },
      include: {
        orders: {
          select: { id: true },
        },
      },
    });

    if (!inventory) {
      throw new ApiError(404, "Inventory not found");
    }

    // 2. Prevent delete if linked with orders
    if (inventory.orders.length > 0) {
      throw new ApiError(
        400,
        "You cannot delete this inventory because it is linked with orders",
      );
    }

    // 3. Check if any logs exist
    const logCount = await tx.inventoryLog.count({
      where: { inventoryId: id },
    });

    // ❌ Logs exist → cannot delete
    if (logCount > 0) {
      throw new ApiError(
        400,
        "Cannot delete inventory because logs are connected",
      );
    }

    // 4. Safe to delete inventory because:
    //    ✔ No orders
    //    ✔ No logs
    const deletedInventory = await tx.inventory.delete({
      where: { id },
    });

    return deletedInventory;
  });
};

export const InventoryService = {
  insertIntoDB,
  insertMultipleIntoDB,
  getAllFromDB,
  getStocksAllFromDB,
  getByIdFromDB,
  deleteInventoryLogByIdFromDB,
  deleteInventoryByIdFromDB,
  getStockByIdFromDB,
  updateOneInDB,
  updateInventoryLog,
  getInventoryFromDB,
};
