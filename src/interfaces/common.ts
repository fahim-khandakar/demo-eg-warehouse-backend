import { IGenericErrorMessage } from "./error";

export type IGenericResponse<T> = {
  meta: {
    page: number;
    limit: number;
    total: number;
  };
  data: T;
};

export type IGenericErrorResponse = {
  statusCode: number;
  message: string;
  errorMessages: IGenericErrorMessage[];
};

export type LoanAnalyticsResult = {
  partCount: number;
  totalAvailableQty: number;
  totalLoanQty: number;
  totalSellQty: number;
  totalInventoryQty: number;
  loanedPartsCount: number;
  partCountInDateRange: number;

  countsByStatus: Array<{
    statusId: number;
    name: string;
    count: number;
  }>;

  topLoanedParts: Array<{
    id: number;
    name: string;
    loanQty: number;
    availableQty: number;
    totalQty: number;
  }>;

  lowStockParts: Array<{
    id: number;
    name: string;
    availableQty: number;
    totalQty: number;
  }>;

  inventoryByLocation: Array<{
    locationId: number;
    locationName?: string | null;
    totalQty: number;
  }>;
};

export type PartnerOrderAnalyticsResult = {
  partnerId: number;
  totalOrders: number;
  totalQty: number;
  countsByStatus: Array<{
    statusId: number;
    name: string;
    count: number;
  }>;
  topOrderedProducts: Array<{
    productId: number;
    name: string;
    qty: number;
  }>;
};
