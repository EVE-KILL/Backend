import { Schema, model, Document, Model } from "mongoose";
import { IInvType } from "../interfaces/IInvType"; // Adjust the path as necessary

export interface IInvTypeDocument extends IInvType, Document {}

const invTypesSchema = new Schema<IInvTypeDocument>(
  {
    type_id: { type: Number, unique: true },
    group_id: { type: Number },
    type_name: { type: String },
    description: { type: String },
    mass: { type: Number },
    volume: { type: Number },
    capacity: { type: Number },
    portion_size: { type: Number },
    race_id: { type: Number },
    base_price: { type: Number },
    published: { type: Boolean },
    market_group_id: { type: Number },
    icon_id: { type: Number },
    sound_id: { type: Number },
    graphic_id: { type: Number },
    updatedAt: { type: Date },
    createdAt: { type: Date },
  },
  {
    collection: "invTypes",
    timestamps: true,
    toJSON: {
      transform: (doc, ret) => {
        delete ret._id;
        delete ret.__v;
      },
    },
  }
);

invTypesSchema.index({ group_id: 1 }, { sparse: true });

export const InvTypes: Model<IInvTypeDocument> = model<IInvTypeDocument>(
  "invTypes",
  invTypesSchema,
  "invTypes"
);
