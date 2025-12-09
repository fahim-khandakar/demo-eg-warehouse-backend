export type IOrderFilterRequest = {
  searchTerm?: string;
};

export type IOrderEditEvent = {
  caseId: string | null;
  callDate?: Date | null;
  statusId?: number | null;
  saidId?: string | null;
  partnerId?: number;
  eventNo?: string;
  remarks?: string;
  approvalImage?: string;
  qty?: number;
  parts: {
    partId: number;
    qty: number;
    poll: string;
    description: string;
    inventoryId?: number;
  };
};

export type IOrderCreatedEvent = {
  locationId: number;
  partnerId: number;
  parts: {
    partId: number;
    qty: number;
    poll: string;
    description: string;
  };
  caseId: string;
  saidId?: string;
  eventNo?: string;
  closeDate?: Date;
  callDate?: Date;
  remarks?: string;
  approvalImage?: string;
};

export type IOrderList = {
  id: number;
  qty: number;
  hwab?: string;
  createdAt: Date;
  updatedAt: Date;
  partner: {
    id: number;
    contact_person: string;
    email: string;
  };
};
export type IOrderPartsList = {
  id: number;
  qty: number;
  part: {
    id: number;
    name: string;
    alternatePartName: string | null;
  };
  inventory: {
    id: number;
    location: {
      id: number;
      rack: string;
    };
  };
  order: {
    id: number;
    qty: number;
    statusId: number;
  };
};

export type IOrderProduct = {
  id: number;
  qty: number;
  order: {
    invoiceId: string;
    status: {
      name: string;
    };
    partner: {
      contact_person: string;
    };
  };
  part: {
    name: string;
  };
};

export type ICustomerRequestProduct = {
  id: number;
  qty: number;
  part: {
    name: string;
  };
  customerRequest: {
    partner: {
      contact_person: string;
    };
    status: {
      name: string;
    };
  };
};
