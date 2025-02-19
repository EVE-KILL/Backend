// models/Killmails.ts

import { Schema, model, Document, Model } from "mongoose";
import { IKillmail, IAttacker, IItem, IVictim } from "../interfaces/IKillmail"; // Adjust the path as necessary

export interface IKillmailDocument extends IKillmail, Document {}

const attackerSchema = new Schema<IAttacker>(
  {
    ship_id: { type: Number },
    ship_name: { type: String },
    ship_group_id: { type: Number },
    ship_group_name: { type: String },
    character_id: { type: Number },
    character_name: { type: String },
    corporation_id: { type: Number },
    corporation_name: { type: String },
    alliance_id: { type: Number },
    alliance_name: { type: String },
    faction_id: { type: Number },
    faction_name: { type: String },
    security_status: { type: Number },
    damage_done: { type: Number },
    final_blow: { type: Boolean },
    weapon_type_id: { type: Number },
    weapon_type_name: { type: String },
  },
  { _id: false }
);

const itemSchema = new Schema<IItem>(
  {
    type_id: { type: Number },
    type_name: { type: String },
    group_id: { type: Number },
    group_name: { type: String },
    category_id: { type: Number },
    flag: { type: Number },
    qty_dropped: { type: Number },
    qty_destroyed: { type: Number },
    singleton: { type: Number },
    value: { type: Number },
  },
  { _id: false }
);
itemSchema.add({
  items: { type: [itemSchema], default: undefined, required: false },
});

const victimSchema = new Schema<IVictim>(
  {
    ship_id: { type: Number },
    ship_name: { type: String },
    ship_group_id: { type: Number },
    ship_group_name: { type: String },
    damage_taken: { type: Number },
    character_id: { type: Number },
    character_name: { type: String },
    corporation_id: { type: Number },
    corporation_name: { type: String },
    alliance_id: { type: Number },
    alliance_name: { type: String },
    faction_id: { type: Number },
    faction_name: { type: String },
  },
  { _id: false }
);

const killmailsSchema = new Schema<IKillmailDocument>(
  {
    killmail_hash: { type: String },
    killmail_id: { type: Number },
    attackers: { type: [attackerSchema] },
    dna: { type: String },
    fitting_value: { type: Number },
    is_npc: { type: Boolean },
    is_solo: { type: Boolean },
    items: { type: [itemSchema] },
    kill_time: { type: Date },
    kill_time_str: { type: String },
    near: { type: String },
    region_id: { type: Number },
    region_name: { type: String },
    ship_value: { type: Number },
    system_id: { type: Number },
    system_name: { type: String },
    system_security: { type: Number },
    total_value: { type: Number },
    victim: { type: victimSchema },
    war_id: { type: Number },
    x: { type: Number },
    y: { type: Number },
    z: { type: Number }
  },
  {
    collection: "killmails",
    timestamps: true,
    toJSON: {
      transform: (doc, ret) => {
        delete ret._id;
        delete ret.__v;
      },
    },
  }
);

// Primary indexes
killmailsSchema.index({ killmail_id: 1, killmail_hash: 1 }, { unique: true });
killmailsSchema.index({ kill_time: -1 }, { sparse: true });

// Timestamp indexes
killmailsSchema.index({ createdAt: 1 }, { sparse: true });
killmailsSchema.index({ updatedAt: 1 }, { sparse: true });
killmailsSchema.index({ createdAt: -1 }, { sparse: true });
killmailsSchema.index({ updatedAt: -1 }, { sparse: true });

// Victim indexes
killmailsSchema.index({ "victim.character_id": 1, kill_time: 1 }, { sparse: true });
killmailsSchema.index({ "victim.corporation_id": 1, kill_time: 1 }, { sparse: true });
killmailsSchema.index({ "victim.alliance_id": 1, kill_time: 1 }, { sparse: true });
killmailsSchema.index({ "victim.faction_id": 1, kill_time: 1 }, { sparse: true });
killmailsSchema.index({ "victim.ship_id": 1, kill_time: 1 }, { sparse: true });
killmailsSchema.index({ "victim.ship_group_id": 1, kill_time: 1 }, { sparse: true });
killmailsSchema.index({ "victim.character_id": -1, kill_time: -1 }, { sparse: true });
killmailsSchema.index({ "victim.corporation_id": -1, kill_time: -1 }, { sparse: true });
killmailsSchema.index({ "victim.alliance_id": -1, kill_time: -1 }, { sparse: true });
killmailsSchema.index({ "victim.faction_id": -1, kill_time: -1 }, { sparse: true });
killmailsSchema.index({ "victim.ship_id": -1, kill_time: -1 }, { sparse: true });
killmailsSchema.index({ "victim.ship_group_id": -1, kill_time: -1 }, { sparse: true });

// Attacker indexes
killmailsSchema.index({ "attackers.character_id": 1, kill_time: 1 }, { sparse: true });
killmailsSchema.index({ "attackers.character_name": 1, kill_time: 1 }, { sparse: true });
killmailsSchema.index({ "attackers.corporation_id": 1, kill_time: 1 }, { sparse: true });
killmailsSchema.index({ "attackers.alliance_id": 1, kill_time: 1 }, { sparse: true });
killmailsSchema.index({ "attackers.faction_id": 1, kill_time: 1 }, { sparse: true });
killmailsSchema.index({ "attackers.ship_id": 1, kill_time: 1 }, { sparse: true });
killmailsSchema.index({ "attackers.ship_group_id": 1, kill_time: 1 }, { sparse: true });
killmailsSchema.index({ "attackers.weapon_type_id": 1, kill_time: 1 }, { sparse: true });
killmailsSchema.index({ "attackers.character_id": -1, kill_time: -1 }, { sparse: true });
killmailsSchema.index({ "attackers.character_name": -1, kill_time: -1 }, { sparse: true });
killmailsSchema.index({ "attackers.corporation_id": -1, kill_time: -1 }, { sparse: true });
killmailsSchema.index({ "attackers.alliance_id": -1, kill_time: -1 }, { sparse: true });
killmailsSchema.index({ "attackers.faction_id": -1, kill_time: -1 }, { sparse: true });
killmailsSchema.index({ "attackers.ship_id": -1, kill_time: -1 }, { sparse: true });
killmailsSchema.index({ "attackers.ship_group_id": -1, kill_time: -1 }, { sparse: true });
killmailsSchema.index({ "attackers.weapon_type_id": -1, kill_time: -1 }, { sparse: true });

// Item indexes
killmailsSchema.index({ "items.type_id": 1, kill_time: 1 }, { sparse: true });
killmailsSchema.index({ "items.group_id": 1, kill_time: 1 }, { sparse: true });
killmailsSchema.index({ "items.type_id": -1, kill_time: -1 }, { sparse: true });
killmailsSchema.index({ "items.group_id": -1, kill_time: -1 }, { sparse: true });

// General indexes
killmailsSchema.index({ war_id: 1, kill_time: 1 }, { sparse: true });
killmailsSchema.index({ system_id: 1, kill_time: 1 }, { sparse: true });
killmailsSchema.index({ region_id: 1, kill_time: 1 }, { sparse: true });
killmailsSchema.index({ is_npc: 1, kill_time: 1 }, { sparse: true });
killmailsSchema.index({ is_solo: 1, kill_time: 1 }, { sparse: true });
killmailsSchema.index({ total_value: 1, kill_time: 1 }, { sparse: true });
killmailsSchema.index({ x: 1, y: 1, z: 1, system_id: 1, kill_time: 1 }, { sparse: true });
killmailsSchema.index({ war_id: -1, kill_time: -1 }, { sparse: true });
killmailsSchema.index({ system_id: -1, kill_time: -1 }, { sparse: true });
killmailsSchema.index({ region_id: -1, kill_time: -1 }, { sparse: true });
killmailsSchema.index({ is_npc: -1, kill_time: -1 }, { sparse: true });
killmailsSchema.index({ is_solo: -1, kill_time: -1 }, { sparse: true });
killmailsSchema.index({ total_value: -1, kill_time: -1 }, { sparse: true });
killmailsSchema.index({ x: -1, y: -1, z: -1, system_id: -1, kill_time: -1 }, { sparse: true });

export const Killmails: Model<IKillmailDocument> = model<IKillmailDocument>(
  "killmails",
  killmailsSchema,
  "killmails"
);
