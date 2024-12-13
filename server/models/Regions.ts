import { Schema, model, Document, Model } from "mongoose";
import { IRegion } from "../interfaces/IRegion"; // Adjust the path as necessary

export interface IRegionDocument extends IRegion, Document {}

const regionsSchema = new Schema<IRegionDocument>(
  {
    region_id: { type: Number, unique: true },
    region_name: { type: String },
    x: { type: Number },
    y: { type: Number },
    z: { type: Number },
    x_min: { type: Number },
    x_max: { type: Number },
    y_min: { type: Number },
    y_max: { type: Number },
    z_min: { type: Number },
    z_max: { type: Number },
    faction_id: { type: Number },
    nebula: { type: Number },
    radius: { type: Number },
    updatedAt: { type: Date },
    createdAt: { type: Date },
  },
  {
    collection: "regions",
    timestamps: true,
    toJSON: {
      transform: (doc, ret) => {
        delete ret._id;
        delete ret.__v;
      },
    },
  }
);

// Define indexes for the schema
regionsSchema.index({ region_id: 1 }, { unique: true });

export const Regions: Model<IRegionDocument> = model<IRegionDocument>(
  "regions",
  regionsSchema,
  "regions"
);
