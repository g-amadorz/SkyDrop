

import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IAccessPoint extends Document {
    name: string;
    nearestStation: string;
    stationId?: string;
    account: string;
    lat: number;
    lng: number;
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
        stationId: {
            type: String,
            required: false,
            trim: true,
        },
        account: {
            type: String,
            required: [true, 'Account is required'],
            trim: true,
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