export interface BakeryResponse {
  id: string;
  name: string;
  locationDescription: string;
  capacity: number;
  regionId: string;
  types: string[];
  notes: string | null;
  logoUrl: string | null;
  galleryImages: string[];
  averageRating?: number;
  totalReviews: number;
  createdAt: Date;
  updatedAt: Date;
}
