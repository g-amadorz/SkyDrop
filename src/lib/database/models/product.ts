import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IProduct extends Document {
  name: string;
  description: string;
  destination: string;
currentLocation: mongoose.Types.ObjectId;
  status: 'pending' | 'in-transit' | 'delivered' | 'cancelled';
  trackingNumber?: string;
  sender?: mongoose.Types.ObjectId;
  recipient?: {
    name: string;
    address: string;
    phone?: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

const ProductSchema: Schema<IProduct> = new Schema(
  {
    name: {
      type: String,
      required: [true, 'Package name is required'],
      trim: true,
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      trim: true,
    },
    destination: {
        accessPoint: {
            type: Schema.Types.ObjectId,
            ref: 'AccessPoint',
        },
    },
    currentLocation: {
        type: Schema.Types.ObjectId,
        ref: 'AccessPoint',
    },
    status: {
      type: String,
      enum: ['pending', 'in-transit', 'delivered', 'cancelled'],
      default: 'pending',
    },
    trackingNumber: {
      type: String,
      unique: true,
      sparse: true,
      trim: true,
    },
    sender: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    recipient: {
      name: {
        type: String,
        trim: true,
      },
      address: {
        type: String,
        trim: true,
      },
      phone: {
        type: String,
        trim: true,
      },
    },
  },
  {
    timestamps: true,
  }
);

// Prevent model recompilation in development (Next.js hot reload)
const Product: Model<IProduct> = mongoose.models.Product || mongoose.model<IProduct>('Product', ProductSchema);

export default Product;
