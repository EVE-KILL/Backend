export interface IAttacker {
  ship_id: number;
  ship_name: string;
  ship_group_id: number;
  ship_group_name: string;
  character_id: number;
  character_name: string;
  corporation_id: number;
  corporation_name: string;
  alliance_id: number;
  alliance_name: string;
  faction_id: number;
  faction_name: string;
  security_status: number;
  damage_done: number;
  final_blow: boolean;
  weapon_type_id: number;
  weapon_type_name: string;
}

export interface IItem {
  type_id: number;
  type_name: string;
  group_id: number;
  group_name: string;
  category_id: number;
  flag: number;
  qty_dropped: number;
  qty_destroyed: number;
  singleton: number;
  value: number;
  items?: IItem[];
}

export interface IVictim {
  ship_id: number;
  ship_name: string;
  ship_group_id: number;
  ship_group_name: string;
  damage_taken: number;
  character_id: number;
  character_name: string;
  corporation_id: number;
  corporation_name: string;
  alliance_id: number;
  alliance_name: string;
  faction_id: number;
  faction_name: string;
}

export interface IKillmail {
  killmail_hash: string;
  killmail_id: number;
  attackers: IAttacker[];
  dna: string;
  fitting_value: number;
  is_npc: boolean;
  is_solo: boolean;
  items: IItem[];
  kill_time: Date;
  kill_time_str: string;
  near: string;
  region_id: number;
  region_name: string;
  ship_value: number;
  system_id: number;
  system_name: string;
  system_security: number;
  total_value: number;
  victim: IVictim;
  war_id: number;
  x: number;
  y: number;
  z: number;
  emitted: boolean;
  updatedAt?: Date;
  createdAt?: Date;
}
