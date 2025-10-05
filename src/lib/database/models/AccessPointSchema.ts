
import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IAccessPoint extends Document {
    name: string;
    nearestStation: string;
    account: mongoose.Types.ObjectId;
    lat: Number;
    lng: Number;
}

const AccessPointSchema: Schema<IAccessPoint> = new Schema(
    {
        name: {
            type: String,
            required: [true, 'Access point name is required'],
            trim: true,
        },
        nearestStation: {
            type: String,
            required: [true, "Access point's nearest station is required"],
            trim: true,
        },
        account: {
            type: Schema.Types.ObjectId,
            ref: 'User',
        },
        lat: {
            type: Number,
            required: [true, "Access point latitude required"],
        },
        lng: {
            type: Number,
            required: [true, "Access point longitude required"],
        }
    },
    {
        timestamps: true,
    }
);

const AccessPoint: Model<IAccessPoint> = 
    mongoose.models.AccessPoint || mongoose.model<IAccessPoint>('AccessPoint', AccessPointSchema);

export default AccessPoint;