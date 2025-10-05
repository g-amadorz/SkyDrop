import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IProduct extends Document {
  name: string;
  description: string;
  destinationAccessPoint: mongoose.Types.ObjectId;
  currentLocation: mongoose.Types.ObjectId;
  status: 'pending' | 'in-transit' | 'delivered' | 'cancelled';
  trackingNumber?: string;
  sender: mongoose.Types.ObjectId;
  recipient: {
    name: string;
    email: string;
    phone: string;
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
    destinationAccessPoint: {
        type: Schema.Types.ObjectId,
        ref: 'AccessPoint',
        required: [true, 'Destination access point is required'],
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
      required: [true, 'Sender is required'],
    },
    recipient: {
      name: {
        type: String,
        required: [true, 'Recipient name is required'],
        trim: true,
      },
      email: {
        type: String,
        required: [true, 'Recipient email is required'],
        trim: true,
      },
      phone: {
        type: String,
        required: [true, 'Recipient phone is required'],
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
