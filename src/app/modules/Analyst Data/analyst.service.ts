/* eslint-disable @typescript-eslint/no-explicit-any */
import { Prisma } from "@prisma/client";
import { paginationHelpers } from "../../../helpers/paginationHelper";
import { LoanAnalyticsResult } from "../../../interfaces/common";
import { IPaginationOptions } from "../../../interfaces/pagination";
import prisma from "../../../shared/prisma";

export const getLoanAnalystFromDB = async (
  startDate?: Date,
  endDate?: Date,
): Promise<LoanAnalyticsResult> => {
  // Normalize dates: if provided, ensure endDate includes the whole day
  let partDateFilter: any = {};
  let orderDateFilter: any = {};
  let inventoryDateFilter: any = {};

  if (startDate && endDate) {
    // Use inclusive bounds for createdAt
    const start = startDate;
    // if endDate has time 00:00:00, include end of that day by setting to 23:59:59.999
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);

    partDateFilter = { createdAt: { gte: start, lte: end } };
    orderDateFilter = { createdAt: { gte: start, lte: end } }; // for order counts
    inventoryDateFilter = { createdAt: { gte: start, lte: end } };
  }

  // Prepare parallel queries
  const [
    partCount,
    partAggAvailable,
    partAggLoan,
    partAggSell,
    loanedPartsCount,
    topLoanedParts,
    lowStockParts,
    inventorySum,
    inventoryGroupBy,
  ] = await Promise.all([
    // 1) count parts created in date range (or all)
    prisma.part.count({ where: partDateFilter }),

    // 2) sum of availableQty for parts in date range
    prisma.part.aggregate({
      where: partDateFilter,
      _sum: { availableQty: true },
    }),

    // 3) sum of loanQty (loaned quantity) for parts in date range
    prisma.part.aggregate({
      where: partDateFilter,
      _sum: { loanQty: true },
    }),

    // 4) sum of sell (historical sold) - optional useful metric
    prisma.part.aggregate({
      where: partDateFilter,
      _sum: { sell: true },
    }),

    // 5) count of parts that currently have loanQty > 0 (no date filter, because loanQty is current snapshot)
    prisma.part.count({
      where: { loanQty: { gt: 0 } },
    }),

    // 6) top 5 loaned parts (by current loanQty)
    prisma.part.findMany({
      where: {}, // use current snapshot; optionally can filter by createdAt if you want
      orderBy: { loanQty: "desc" },
      take: 5,
      select: {
        id: true,
        name: true,
        loanQty: true,
        availableQty: true,
        totalQty: true,
      },
    }),

    // 7) low-stock parts (availableQty <= threshold). threshold set to 5 (you can change)
    prisma.part.findMany({
      where: { availableQty: { lte: 5 } },
      orderBy: { availableQty: "asc" },
      take: 10,
      select: { id: true, name: true, availableQty: true, totalQty: true },
    }),

    // 8) total inventory qty sum (may want all inventory entries in date range)
    prisma.inventory.aggregate({
      where: inventoryDateFilter,
      _sum: { qty: true },
    }),

    // 9) inventory grouped by locationId
    prisma.inventory.groupBy({
      by: ["locationId"],
      where: inventoryDateFilter,
      _sum: { qty: true },
    }),
  ]);

  // countsByStatus: fetch counts for statuses 1..11 in parallel
  const statusIds = await prisma.status.findMany();

  const countsByStatusResults = await Promise.all(
    statusIds.map(async sid => {
      const c = await prisma.order.count({
        where: { statusId: sid.id, ...orderDateFilter },
      });

      return {
        name: sid.name,
        statusId: sid.id,
        count: c,
      };
    }),
  );

  const countsByStatus = countsByStatusResults.map(r => ({
    name: r.name,
    statusId: r.statusId,
    count: r.count,
  }));

  // Map inventory group by to include location names (fetch locations for ids present)
  const locationIds = inventoryGroupBy.map(g => g.locationId);
  let locationsById: Record<number, string | null> = {};
  if (locationIds.length > 0) {
    const locations = await prisma.location.findMany({
      where: { id: { in: locationIds } },
      select: { id: true, rack: true },
    });
    locationsById = Object.fromEntries(locations.map(l => [l.id, l.rack]));
  }

  // Null safety for aggregate results (if null, convert to 0)
  const totalAvailableQty = (partAggAvailable?._sum?.availableQty ??
    0) as number;
  const totalLoanQty = (partAggLoan?._sum?.loanQty ?? 0) as number;
  const totalSellQty = (partAggSell?._sum?.sell ?? 0) as number;
  const totalInventoryQty = (inventorySum?._sum?.qty ?? 0) as number;

  const inventoryByLocation = inventoryGroupBy.map(g => ({
    locationId: g.locationId,
    locationName: locationsById[g.locationId] ?? null,
    totalQty: g._sum?.qty ?? 0,
  }));

  const data: LoanAnalyticsResult = {
    partCount,
    totalAvailableQty,
    totalLoanQty,
    totalSellQty,
    totalInventoryQty,
    loanedPartsCount,
    partCountInDateRange: partCount,
    countsByStatus,
    topLoanedParts: topLoanedParts.map(p => ({
      id: p.id,
      name: p.name,
      loanQty: p.loanQty ?? 0,
      availableQty: p.availableQty ?? 0,
      totalQty: p.totalQty ?? 0,
    })),
    lowStockParts: lowStockParts.map(p => ({
      id: p.id,
      name: p.name,
      availableQty: p.availableQty ?? 0,
      totalQty: p.totalQty ?? 0,
    })),
    inventoryByLocation,
  };

  return data;
};

const partnerData = async () => {
  return prisma.$queryRaw<
    { partnerId: number; company: string; totalOrders: number }[]
  >`
SELECT 
  p.id AS "partnerId",
  p.company,
  CAST(COUNT(o.id) AS INTEGER) AS "totalOrders"
FROM partners p
LEFT JOIN orders o ON p.id = o."partnerId"
GROUP BY p.id, p.company
ORDER BY "totalOrders" DESC
`;
};

async function getMostOrderedPartsWithNames(options: IPaginationOptions) {
  const { page = 1, limit = 20, sortOrder = "desc" } = options;
  const skip = (page - 1) * limit;

  // Total qty of all parts (for percentage calc)
  const totalOrders = await prisma.orderPart.aggregate({
    _sum: { qty: true },
  });

  // Group by partId and sum qty
  const groupedParts = await prisma.orderPart.groupBy({
    by: ["partId"],
    _sum: { qty: true },
    orderBy: {
      _sum: { qty: sortOrder },
    },
    take: limit,
    skip: skip,
  });

  // Fetch part names
  const partIds = groupedParts.map(p => p.partId);
  const parts = await prisma.part.findMany({
    where: { id: { in: partIds } },
    select: { id: true, name: true },
  });

  const partMap = new Map(parts.map(p => [p.id, p.name]));

  // Map to desired output
  return groupedParts.map(item => {
    const orderedQty = item._sum.qty ?? 0;
    const partName = partMap.get(item.partId) || "Unknown Part";
    const avgOrderPercentage =
      totalOrders._sum.qty && orderedQty
        ? (orderedQty / totalOrders._sum.qty) * 100
        : 0;

    return {
      partName,
      orderedQty,
      avgOrderPercentage: Number(avgOrderPercentage.toFixed(2)),
    };
  });
}

async function getLongOpenOrders(
  daysThreshold = 130,
  options: IPaginationOptions,
) {
  const thresholdDate = new Date();
  thresholdDate.setDate(thresholdDate.getDate() - daysThreshold);

  // Calculate pagination values (skip, limit, sortBy, sortOrder)
  const { page, limit, skip, sortBy, sortOrder } =
    paginationHelpers.calculatePagination(options);
  // Fetch orders based on the pagination parameters
  const orders = await prisma.order.findMany({
    where: {
      statusId: 1,
      callDate: {
        lt: thresholdDate,
      },
    },
    select: {
      id: true,
      invoiceId: true,
      createdAt: true,
      callDate: true,
      partner: {
        select: {
          company: true,
        },
      },
    },
    orderBy: {
      [sortBy]: sortOrder, // Dynamic sorting
    },
    skip, // Pagination
    take: limit, // Pagination
  });

  return orders;
}

export async function getCustomerRequestAnalytics() {
  const totalRequests = await prisma.customerRequest.count();

  const requestsByStatus = await prisma.customerRequest.groupBy({
    by: ["statusId"],
    _count: true,
  });

  const mostRequestedParts = await prisma.customerRequestedPart.groupBy({
    by: ["partId"],
    _sum: {
      qty: true,
    },
    orderBy: {
      _sum: {
        qty: "desc",
      },
    },
    take: 5,
  });

  const partNames = await prisma.part.findMany({
    where: {
      id: {
        in: mostRequestedParts.map(p => p.partId),
      },
    },
    select: {
      id: true,
      name: true,
    },
  });

  const requestsByPartner = await prisma.customerRequest.groupBy({
    by: ["partnerId"],
    _count: true,
  });

  const withParts = await prisma.customerRequestedPart.count();
  const withoutParts = totalRequests - withParts;

  return {
    totalRequests,
    requestsByStatus: requestsByStatus.map(r => ({
      statusId: r.statusId,
      count: r._count,
    })),
    mostRequestedParts: mostRequestedParts.map(p => ({
      partId: p.partId,
      partName: partNames.find(name => name.id === p.partId)?.name || "Unknown",
      totalQty: p._sum.qty,
    })),
    requestsByPartner,
    withParts,
    withoutParts,
  };
}

export const getUserActivityLogs = async (options: IPaginationOptions) => {
  const { page, limit, skip } = paginationHelpers.calculatePagination(options);
  const result = await prisma.userActivity.findMany({
    where: {},
    skip,
    take: limit,
    include: {
      user: {
        select: {
          id: true,
          email: true,
          details: {
            select: {
              name: true,
            },
          },
        },
      },
    },
    orderBy: { timestamp: "desc" },
  });
  const total = await prisma.userActivity.count({
    where: {},
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

export const getMyActivityLogs = async (
  userId: number,
  options: IPaginationOptions,
) => {
  const { page, limit, skip } = paginationHelpers.calculatePagination(options);
  const result = await prisma.userActivity.findMany({
    where: { userId },
    skip,
    take: limit,
    include: {
      user: {
        select: {
          id: true,
          email: true,
          details: {
            select: {
              name: true,
            },
          },
        },
      },
    },
    orderBy: { timestamp: "desc" },
  });
  const total = await prisma.userActivity.count({
    where: { userId },
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

export const getPartnerOrderAnalystFromDB = async (
  partnerId: number,
  startDate?: Date,
  endDate?: Date,
) => {
  let dateFilter: any = {};
  if (startDate && endDate) {
    const start = startDate;
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);
    dateFilter = { createdAt: { gte: start, lte: end } };
  }

  // Fetch all statuses except 6,9,11
  const statuses = await prisma.status.findMany({
    where: { id: { notIn: [6, 9, 11] } },
    select: { id: true, name: true },
  });

  // Count orders for each status
  const countsByStatusResults = await Promise.all(
    statuses.map(async s => {
      const count = await prisma.customerRequest.count({
        where: { partnerId, statusId: s.id, ...dateFilter },
      });
      return { statusId: s.id, name: s.name, count };
    }),
  );

  // Total orders
  const totalOrders = await prisma.order.count({
    where: { partnerId, ...dateFilter },
  });

  // Total quantity
  const totalQtyAgg = await prisma.orderPart.aggregate({
    where: { order: { partnerId, ...dateFilter } },
    _sum: { qty: true },
  });
  const totalQty = totalQtyAgg._sum.qty || 0;

  // Top ordered parts (group by partId)
  const topParts = await prisma.orderPart.groupBy({
    by: [Prisma.OrderPartScalarFieldEnum.partId],
    where: { order: { partnerId, ...dateFilter } },
    _sum: { qty: true },
    orderBy: { _sum: { qty: "desc" } },
    take: 5,
  });

  // Fetch part names
  const partIds = topParts.map(p => p.partId);
  const parts = await prisma.part.findMany({
    where: { id: { in: partIds } },
    select: { id: true, name: true },
  });
  const partsById = Object.fromEntries(parts.map(p => [p.id, p.name]));

  const topOrderedParts = topParts.map(p => ({
    partId: p.partId,
    name: partsById[p.partId] ?? "Unknown",
    qty: p._sum.qty ?? 0,
  }));

  return {
    partnerId,
    totalOrders,
    totalQty,
    countsByStatus: countsByStatusResults,
    topOrderedParts,
  };
};

const getPartnerEventAnalystFromDB = async (
  partnerId: number,
  startDate?: Date,
  endDate?: Date,
) => {
  const dateFilter =
    startDate && endDate ? { createdAt: { gte: startDate, lte: endDate } } : {};

  const eventCount = await prisma.event.count({
    where: {
      partnerId,
      type: "DEFAULT",
      ...dateFilter,
    },
  });

  const openShipment = await prisma.shipment.count({
    where: {
      statusId: 1,
      type: "DEFAULT", // Open shipments
      events: { some: { partnerId } },
      ...dateFilter,
    },
  });

  const closeShipment = await prisma.shipment.count({
    where: {
      statusId: 4, // Closed shipments
      type: "Completed",
      events: { some: { partnerId } },
      ...dateFilter,
    },
  });

  return {
    partnerId,
    eventCount,
    openShipment,
    closeShipment,
  };
};

export const AnalystService = {
  getLoanAnalystFromDB,
  getUserActivityLogs,
  getMyActivityLogs,
  getPartnerOrderAnalystFromDB,
  getPartnerEventAnalystFromDB,
  partnerData,
  getMostOrderedPartsWithNames,
  getLongOpenOrders,
  getCustomerRequestAnalytics,
};
