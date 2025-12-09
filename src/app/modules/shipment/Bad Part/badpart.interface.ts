export type IShipmentReceiptFilterRequest = {
  searchTerm?: string;
};

export type IBadBufferCreateEvent = {
  invoiceId: number;
  hawbNo: string;
  remarks: string;
  items: {
    eventId: number;
    remarks?: string | null;
  }[];
};
