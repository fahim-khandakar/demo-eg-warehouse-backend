export type IShipmentEventFilterRequest = {
  searchTerm?: string;
};

export type CreateEventInput = {
  shipmentId: number;
  partnerId: number;
  eventNo: string;
  part: string;
  hsCode?: string;
  quantity: number;
  value: number;
  description?: string;
  btrc: boolean;
  weight: number;
  dimensionL: number;
  dimensionH: number;
  dimensionW: number;
  coo: string;
  boxNo: string;
  height: number;
  boxWeight: number;
  boxWidth: number;
  length: number;
};
