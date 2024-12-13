export interface IInvGroup {
  group_id: number;
  category_id: number;
  group_name: string;
  icon_id: number;
  use_base_price: boolean;
  anchored: boolean;
  anchorable: boolean;
  fittable_non_singleton: number;
  published: boolean;
  updatedAt?: Date;
  createdAt?: Date;
}
