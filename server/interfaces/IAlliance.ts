export interface IAlliance {
  alliance_id: number;
  name: string;
  ticker: string;
  creator_id: number;
  creator_corporation_id: number;
  executor_corporation_id: number;
  updatedAt?: Date;
  createdAt?: Date;
}
