import { model, Schema } from 'mongoose';

const authKeySchema = new Schema({
  key: { type: String, unique: true },
  isActive: { type: Boolean, default: true }
});

export const AuthKey = model('AuthKey', authKeySchema);
