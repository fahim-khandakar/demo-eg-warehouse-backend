export type ICustomerRequestFilterRequest = {
  searchTerm?: string;
};

export type ICustomerRequestEditEvent = {
  caseId: string | null;
  callDate?: string | null;
  statusId?: number | null;
  eventNo?: string;
  parts?: {
    partId: number;
    qty: number;
    description: string;
  };
};

export type ICustomerRequestCreatedEvent = {
  partnerId: number;
  remarks?: string;
  parts: {
    partId: number;
    qty: number;
    description: string;
  };
  caseId: string;
  callDate?: string;
  eventNo?: string;
  saidId?: string;
  approvalImage?: string;
};
