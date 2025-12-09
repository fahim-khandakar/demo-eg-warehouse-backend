import express from "express";
import { analystRoutes } from "../modules/Analyst Data/analyst.routes";
import { AuthRoutes } from "../modules/auth/auth.route";
import { partnerRoutes } from "../modules/partner/partner.routes";
import { principalRoutes } from "../modules/principal/principal.routes";
import { inventoryRoutes } from "../modules/rent/inventory/inventory.routes";
import { orderRoutes } from "../modules/rent/order/order.routes";
import { partsRoutes } from "../modules/rent/part/parts.routes";
import { customerRequestRoutes } from "../modules/rent/partner request/partnerRequest.routes";
import { warehouseRoutes } from "../modules/rent/warehouse/warehouse.routes";
import { badBuffersRoutes } from "../modules/shipment/Bad Part/badpart.routes";
import { productRoutes } from "../modules/shipment/product/product.routes";
import { receiptsRoutes } from "../modules/shipment/receipt/receipt.routes";
import { eventRoutes } from "../modules/shipment/shipment event/shipementEvent.routes";
import { shipmentsRoutes } from "../modules/shipment/shipment List/shipmentList.routes";
import { statusRoutes } from "../modules/status/status.routes";
import { usersRoutes } from "../modules/user/user.routes";
const router = express.Router();

const moduleRoutes = [
  // ... routes
  {
    path: "/auth",
    route: AuthRoutes,
  },
  {
    path: "/users",
    route: usersRoutes,
  },
  {
    path: "/analytics",
    route: analystRoutes,
  },
  {
    path: "/parts",
    route: partsRoutes,
  },
  {
    path: "/partners",
    route: partnerRoutes,
  },
  {
    path: "/warehouse",
    route: warehouseRoutes,
  },
  {
    path: "/order",
    route: orderRoutes,
  },
  {
    path: "/inventory",
    route: inventoryRoutes,
  },
  {
    path: "/events",
    route: eventRoutes,
  },
  {
    path: "/shipments",
    route: shipmentsRoutes,
  },
  {
    path: "/products",
    route: productRoutes,
  },
  {
    path: "/receipts",
    route: receiptsRoutes,
  },
  {
    path: "/order-request",
    route: customerRequestRoutes,
  },
  {
    path: "/bad-buffers",
    route: badBuffersRoutes,
  },
  {
    path: "/status",
    route: statusRoutes,
  },
  {
    path: "/principals",
    route: principalRoutes,
  },
];

moduleRoutes.forEach(route => router.use(route.path, route.route));
export default router;
