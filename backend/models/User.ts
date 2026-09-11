import mongoose, { Schema, Document, Types } from 'mongoose';

export type UserRole = 'MINE_OFFICER' | 'CORPORATE_MANAGER';

export interface IUser extends Document {
  name: string;
  email: string;
  password: string;
  role: UserRole;
  mineIds: Types.ObjectId[];
  organizationId?: Types.ObjectId;
  createdAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
    },
    role: {
      type: String,
      required: [true, 'Role is mandatory'],
      enum: ['MINE_OFFICER', 'CORPORATE_MANAGER'],
    },
    mineIds: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Mine',
      },
    ],
    organizationId: {
      type: Schema.Types.ObjectId,
      default: null,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: false,
    versionKey: false,
  }
);

// Indexes
UserSchema.index({ email: 1 }, { unique: true });

export const User: mongoose.Model<IUser> =
  (mongoose.models.User as mongoose.Model<IUser>) ||
  mongoose.model<IUser>('User', UserSchema, 'users');
