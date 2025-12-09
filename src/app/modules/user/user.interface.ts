export type IUserFilterRequest = {
  searchTerm?: string;
};

export type CreateUserInput = {
  name: string;
  email: string;
  contactNo: string;
  designation: string;
  profileImage: string;
  branchId?: number;
  powerId: number[];
  password?: string;
};
