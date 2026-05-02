export interface RegionResponse {
  id: string;
  name: string;
  image: string | null;
  isAvailable: boolean;
  createdAt: Date;
  updatedAt: Date;
}
