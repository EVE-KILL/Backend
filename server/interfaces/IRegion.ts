export interface IRegion {
  region_id: number;
  region_name: string;
  x: number;
  y: number;
  z: number;
  x_min: number;
  x_max: number;
  y_min: number;
  y_max: number;
  z_min: number;
  z_max: number;
  faction_id: number;
  nebula: number;
  radius: number;
  updatedAt?: Date;
  createdAt?: Date;
}