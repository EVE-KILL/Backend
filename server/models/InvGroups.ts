// models/InvGroups.ts

import { Schema, model, type Document, type Model } from "mongoose";
import type { IInvGroup } from "../interfaces/IInvGroup"; // Adjust the path as necessary

// Extend the IInvGroup interface with Mongoose's Document interface
export interface IInvGroupDocument extends IInvGroup, Document {}

// Define the InvGroups schema
const invGroupsSchema = new Schema<IInvGroupDocument>(
  {
    group_id: { type: Number, unique: true },
    category_id: { type: Number },
    group_name: { type: String },
    icon_id: { type: Number },
    use_base_price: { type: Boolean },
    anchored: { type: Boolean },
    anchorable: { type: Boolean },
    fittable_non_singleton: { type: Number },
    published: { type: Boolean },
    // Timestamps are automatically added by Mongoose
  },
  {
    collection: "invGroups",
    timestamps: true,
    toJSON: {
      transform: (_doc, ret) => {
        delete ret._id;
        delete ret.__v;
      },
    },
  },
);

// Create and export the InvGroups model
export const InvGroups: Model<IInvGroupDocument> = model<IInvGroupDocument>(
  "invgroups",
  invGroupsSchema,
  "invGroups", // Explicitly specifying the collection name
);
