import { ShipmentType } from "@prisma/client";
import prisma from "../../../shared/prisma";

const getPODAnalystFromDB = async (startDate?: Date, endDate?: Date) => {
  const dateFilter =
    startDate && endDate ? { createdAt: { gte: startDate, lte: endDate } } : {};

  const eventStatusGroup = await prisma.event.groupBy({
    by: ["statusId"],
    where: {
      ...dateFilter,
      statusId: { in: [1, 2, 3, 4] }, // Only include status 1-4
    },
    _count: {
      statusId: true,
    },
  });

  const statusLabels: Record<number, string> = {
    1: "Open",
    2: "Delivered",
    3: "Pending",
    4: "Closed",
  };

  const eventStatusAnalytics = [1, 2, 3, 4].map(statusId => ({
    statusId,
    name: statusLabels[statusId] || "unknown",
    count: 0,
  }));

  for (const group of eventStatusGroup) {
    const index = eventStatusAnalytics.findIndex(
      e => e.statusId === group.statusId,
    );
    if (index !== -1) {
      eventStatusAnalytics[index].count = group._count.statusId;
    }
  }

  return {
    eventStatusAnalytics,
  };
};

const partnerData = async () => {
  const data = await prisma.$queryRaw<
    { partnerId: number; company: string; totalEvents: number }[]
  >`
    SELECT 
      p.id AS "partnerId",
      p.company,
      CAST(COUNT(e.id) AS INTEGER) AS "totalEvents"
    FROM partners p
    LEFT JOIN events e ON p.id = e."partnerId"
    GROUP BY p.id, p.company
    ORDER BY "totalEvents" DESC;
  `;

  return data.map(item => ({
    ...item,
    totalEvents: Number(item.totalEvents), // redundant if already cast, but safe
  }));
};

export const getShipmentPendingStatusAnalytics = async () => {
  const shipments = await prisma.shipment.findMany({
    where: {
      type: ShipmentType.DEFAULT,
    },
    orderBy: {
      createdAt: "desc",
    },
    take: 20,
    select: {
      id: true,
      control: true,
      events: {
        select: {
          statusId: true,
        },
      },
    },
  });

  // Step 2: Map and calculate analytics
  const analytics = shipments.map(shipment => {
    const totalEvents = shipment.events.length;
    const status2Events = shipment.events.filter(e => e.statusId === 2).length;
    const status2Percentage =
      totalEvents === 0 ? 0 : (status2Events / totalEvents) * 100;

    return {
      shipmentId: shipment.id,
      control: shipment.control,
      events: totalEvents,
      StatusCount: status2Events,
      percentage: status2Percentage.toFixed(2),
    };
  });
  return analytics;
};
export const getShipmentClosedStatusAnalytics = async () => {
  const shipments = await prisma.shipment.findMany({
    where: {
      type: ShipmentType.DEFAULT,
    },
    orderBy: {
      createdAt: "desc",
    },
    take: 20,
    select: {
      id: true,
      control: true,
      events: {
        select: {
          statusId: true,
        },
      },
    },
  });

  // Step 2: Map and calculate analytics
  const analytics = shipments.map(shipment => {
    const totalEvents = shipment.events.length;
    const status2Events = shipment.events.filter(e => e.statusId === 4).length;
    const status2Percentage =
      totalEvents === 0 ? 0 : (status2Events / totalEvents) * 100;

    return {
      shipmentId: shipment.id,
      control: shipment.control,
      events: totalEvents,
      StatusCount: status2Events,
      percentage: status2Percentage.toFixed(2),
    };
  });
  return analytics;
};

export const getShipmentTypeStatus7Analytics = async () => {
  // 1. Get all shipments and map shipmentId to type
  const shipments = await prisma.shipment.findMany({
    select: {
      id: true,
      type: true,
    },
  });

  const shipmentTypeMap = new Map<number, string>();
  for (const shipment of shipments) {
    shipmentTypeMap.set(shipment.id, shipment.type);
  }

  // 2. Group total events by shipmentId
  const totalEvents = await prisma.event.groupBy({
    by: ["shipmentId"],
    _count: {
      shipmentId: true,
    },
  });

  // 3. Group statusId = 7 events by shipmentId
  const status7Events = await prisma.event.groupBy({
    by: ["shipmentId"],
    where: {
      statusId: 7,
    },
    _count: {
      shipmentId: true,
    },
  });

  // 4. Aggregate totals by shipment type
  const typeAnalytics: Record<
    string,
    { totalEvents: number; status7Events: number }
  > = {};

  for (const { shipmentId, _count } of totalEvents) {
    const type = shipmentTypeMap.get(shipmentId) ?? "UNKNOWN";
    if (!typeAnalytics[type]) {
      typeAnalytics[type] = { totalEvents: 0, status7Events: 0 };
    }
    typeAnalytics[type].totalEvents += _count.shipmentId;
  }

  for (const { shipmentId, _count } of status7Events) {
    const type = shipmentTypeMap.get(shipmentId) ?? "UNKNOWN";
    if (!typeAnalytics[type]) {
      typeAnalytics[type] = { totalEvents: 0, status7Events: 0 };
    }
    typeAnalytics[type].status7Events += _count.shipmentId;
  }

  // 5. Calculate percentage
  const result = Object.entries(typeAnalytics).map(([type, data]) => {
    const percentage =
      data.totalEvents === 0
        ? 0
        : (data.status7Events / data.totalEvents) * 100;
    return {
      type,
      events: data.totalEvents,
      complete: data.status7Events,
      percentage: percentage.toFixed(2),
    };
  });

  return result;
};

export const AnalystPODService = {
  getPODAnalystFromDB,
  partnerData,
  getShipmentPendingStatusAnalytics,
  getShipmentClosedStatusAnalytics,
  getShipmentTypeStatus7Analytics,
};
