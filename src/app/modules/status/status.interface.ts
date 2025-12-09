export type IStatusFilterRequest = {
  searchTerm?: string;
};

export type IStatusEditEvent = {
  name?: string | null;
};

export type IStatusCreatedEvent = {
  name: string;
};
