export interface BakeryResponse {
  id: string;
  name: string;
  locationDescription: string;
  capacity: number;
  regionId: string;
  types: string[];
  averageRating?: number;
  totalReviews: number;
  createdAt: Date;
  updatedAt: Date;
}
