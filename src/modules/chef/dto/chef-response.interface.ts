export interface ChefResponse {
  id: string;
  name: string;
  specialization: string;
  image?: string;
  bakeryId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface PaginatedChefResponse {
  items: ChefResponse[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
