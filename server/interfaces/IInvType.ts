export interface IInvType {
  type_id: number;
  group_id: number;
  type_name: string;
  description: string;
  mass: number;
  volume: number;
  capacity: number;
  portion_size: number;
  race_id: number;
  base_price: number;
  published: boolean;
  market_group_id: number;
  icon_id: number;
  sound_id: number;
  graphic_id: number;
  updatedAt?: Date;
  createdAt?: Date;
}
