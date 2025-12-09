import { ShipmentType } from "@prisma/client";

export type IShipmentListFilterRequest = {
  searchTerm?: string;
};

export type IShipmentCreatedEvent = {
  shipToId: number;
  control: string;
  sendBy: string;
  hawb?: string;
  invoiceValue?: number;
  status: number;
  type: ShipmentType;
  events: Array<{
    partnerId: number;
    eventNo: string;
    part: string;
    hsCode: string;
    quantity: number;
    description: string;
    btrc?: boolean;
    boxNo: string;
    value: number;
    weight: number;
    // part dimension
    dimensionL: number;
    dimensionH: number;
    dimensionW: number;
    // box dimension
    boxWeight: number;
    boxWidth: number;
    length: number;
    height: number;
    coo: string;
  }>;
};
export type IShipmentCreatedPODEvent = {
  shipToId: number;
  control: string;
  sendBy: string;
  hawb?: string;
  invoiceValue?: number;
  status: number;
  type: ShipmentType;
  events: Array<{
    partnerId: number;
    eventNo: string;
    part: number;
    quantity: number;
    hsCode?: string;
    description?: string;
    btrc?: boolean;
    boxNo: string;
    value: number;
    weight: number;
    // part dimension
    dimensionL: number;
    dimensionH: number;
    dimensionW: number;
    // box dimension
    boxWeight: number;
    boxWidth: number;
    length: number;
    height: number;
    coo: string;
  }>;
};

export type IShipmentCreatedByFileEvent = {
  shipTo: string;
  sendBy: string;
  control: string;
  invoiceValue?: number;
  type: ShipmentType;
  events: Array<{
    partner: string;
    eventNo: string;
    part: string;
    hsCode: string;
    quantity: number;
    description: string;
    btrc?: boolean;
    boxNo: string;
    value: number;
    // box dimension
    grossWeight: number;
    boxWeight: number;
    height: number;
    length: number;
    // part dimension
    weight: number;
    dimensionL: number;
    dimensionH: number;
    dimensionW: number;
    coo: string;
  }>;
};

export type ShipmentUpdateEvent = {
  id?: number; // optional, if new event it won't have an ID
  eventNo: string;
  description?: string;
  value: number;
  weight: number;
  dimensionL: number;
  dimensionW: number;
  dimensionH: number;
  coo: string;
  partnerId: number;
  productId: number;
  boxId: number;
  statusId?: number;
};

export type ShipmentUpdateWithEvents = {
  control?: string;
  hawb?: string;
  sendBy?: string;
  statusId?: number;
  type?: ShipmentType;
  totalValue?: number;
  totalWeight?: number;
  totalQuantity?: number;
  events?: ShipmentUpdateEvent[];
};
