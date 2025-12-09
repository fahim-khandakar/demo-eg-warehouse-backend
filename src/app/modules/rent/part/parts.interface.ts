export type IPartsFilterRequest = {
  searchTerm?: string;
};

export type IPartsList = {
  id: number;
  name: string;
  alternatePartName: string | null;
  description: string | null;
  totalQty: number;
  availableQty: number;
  sell: number;
  updatedAt: Date;
  inventory: {
    id: number;
    location: {
      id: number;
      rack: string;
    };
    qty: number;
  }[];
};
