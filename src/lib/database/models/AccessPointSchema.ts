
import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IAccessPoint extends Document {
    name: string;
    location: string;
    account: mongoose.Types.ObjectId;
}

const AccessPointSchema: Schema<IAccessPoint> = new Schema(
    {
        name: {
            type: String,
            required: [true, 'Access point name is required'],
            trim: true,
        },
        location: {
            type: String,
            required: [true, 'Location is required'],
            trim: true,
        },
        account: {
            type: Schema.Types.ObjectId,
            ref: 'User',
        }
    },
    {
        timestamps: true,
    }
);

const AccessPoint: Model<IAccessPoint> = mongoose.model<IAccessPoint>('AccessPoint', AccessPointSchema);

export default AccessPoint;