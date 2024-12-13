import { Schema, model } from 'mongoose';

const imagesSchema = new Schema(
  {
    url: { type: String, unique: true },
    content: { type: Buffer },
    size: { type: Number },
    etag: { type: String },
    updatedAt: { type: Date },
    createdAt: { type: Date },
  },
  {
    collection: 'images',
    timestamps: true,
    toJSON: {
      transform: (doc, ret) => {
        delete ret._id;
        delete ret.__v;
      },
    },
  }
);

export const Images = model(
  'images',
  imagesSchema,
  'images'
);
