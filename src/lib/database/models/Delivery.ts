import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IDeliveryLeg {
  commuterId: mongoose.Types.ObjectId;
  fromAccessPoint: mongoose.Types.ObjectId;
  toAccessPoint: mongoose.Types.ObjectId;
  pickupTime: Date;
  dropoffTime?: Date;
  distance: number;
  earnings: number;
  status: 'in-progress' | 'completed';
}

export interface IDelivery extends Document {
  productId: mongoose.Types.ObjectId;
  shipperId: mongoose.Types.ObjectId;
  currentCommuterId?: mongoose.Types.ObjectId;
  originAccessPoint: mongoose.Types.ObjectId;
  destinationAccessPoint: mongoose.Types.ObjectId;
  currentAccessPoint: mongoose.Types.ObjectId;
  status: 'awaiting-pickup' | 'in-transit' | 'ready-for-recipient' |;
  legs: IDeliveryLeg[];
  totalCost: number;
  paidAmount: number;
  reservedAmount: number;
  estimatedDistance: number;
  actualDistance: number;
  recipientVerificationCode: string;
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
}

const DeliveryLegSchema = new Schema<IDeliveryLeg>({
  commuterId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  fromAccessPoint: {
    type: Schema.Types.ObjectId,
    ref: 'AccessPoint',
    required: true,
  },
  toAccessPoint: {
    type: Schema.Types.ObjectId,
    ref: 'AccessPoint',
    required: true,
  },
  pickupTime: {
    type: Date,
    required: true,
    default: Date.now,
  },
  dropoffTime: {
    type: Date,
  },
  distance: {
    type: Number,
    required: true,
    min: 0,
  },
  earnings: {
    type: Number,
    required: true,
    min: 0,
  },
  status: {
    type: String,
    enum: ['awaiting-pickup','in-progress', 'completed'],
    default: 'in-progress',
  },
});

const DeliverySchema: Schema<IDelivery> = new Schema(
  {
    productId: {
      type: Schema.Types.ObjectId,
      ref: 'Product',
      required: [true, 'Product ID is required'],
    },
    shipperId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Shipper ID is required'],
    },
    currentCommuterId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    originAccessPoint: {
      type: Schema.Types.ObjectId,
      ref: 'AccessPoint',
      required: [true, 'Origin access point is required'],
    },
    destinationAccessPoint: {
      type: Schema.Types.ObjectId,
      ref: 'AccessPoint',
      required: [true, 'Destination access point is required'],
    },
    currentAccessPoint: {
      type: Schema.Types.ObjectId,
      ref: 'AccessPoint',
      required: [true, 'Current access point is required'],
    },
    status: {
      type: String,
      enum: ['awaiting-pickup', 'in-transit', 'ready-for-recipient'],
      default: 'awaiting-pickup',
    },
    legs: [DeliveryLegSchema],
    totalCost: {
      type: Number,
      required: [true, 'Total cost is required'],
      min: 0,
    },
    paidAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    reservedAmount: {
      type: Number,
      required: [true, 'Reserved amount is required'],
      min: 0,
    },
    estimatedDistance: {
      type: Number,
      required: [true, 'Estimated distance is required'],
      min: 0,
    },
    actualDistance: {
      type: Number,
      default: 0,
      min: 0,
    },
    recipientVerificationCode: {
      type: String,
      required: [true, 'Recipient verification code is required'],
    },
    completedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

DeliverySchema.index({ status: 1, currentAccessPoint: 1 });
DeliverySchema.index({ shipperId: 1, status: 1 });
DeliverySchema.index({ currentCommuterId: 1, status: 1 });
DeliverySchema.index({ productId: 1 });

const Delivery: Model<IDelivery> = mongoose.models.Delivery || mongoose.model<IDelivery>('Delivery', DeliverySchema);

export default Delivery;
