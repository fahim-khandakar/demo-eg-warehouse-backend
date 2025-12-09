export type IInventoryFilterRequest = {
  searchTerm?: string;
};

export type IInventoryCreatedEvent = {
  name: string;
  alternatePartName: string;
  description: string;
  qty: number;
  location: number;
  eventNo: string;
  remarks: string;
  controlNo: string;
  poll: string;
};
export type IInventoryCreatedEventMultiple = {
  name: string;
  qty: number;
  rack: string;
  eventNo: string;
  controlNo: string;
  poll: string;
};

export type IInventoryList = {
  id: number;
  qty: number;
  poll: string;
  part: {
    id: number;
    name: string;
    alternatePartName: string | null;
  };
  location: {
    id: number;
    rack: string;
  };
};

export type InventoryLogWithDetails = {
  id: number;
  eventNo: string | null;
  addedQty: number;
  createdAt: Date;
  inventory: {
    id: number;
    qty: number;
    poll: string;
    part: {
      id: number;
      name: string;
      alternatePartName: string | null;
      description: string | null;
    };
    location: {
      id: number;
      rack: string | null;
    };
  };
};

export type InventoryItem = {
  qty: number;
  poll: string;
  part: Part;
  location: Location;
};

type Part = {
  id: number;
  name: string;
  alternatePartName: string | null;
  alternatePartNametwo: string | null;
  description: string | null;
  availableQty: number;
  sell: number;
  loanQty: number;
  totalQty: number;
};

type Location = {
  id: number;
  rack: string;
};
