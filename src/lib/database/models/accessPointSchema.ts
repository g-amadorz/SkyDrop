import mongoose, { Schema, Document, Model } from 'mongoose';


export interface IAccessPoint extends Document {
    name: string;
    location: string;
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
    },
    {
        timestamps: true,
    }
);

const AccessPoint: Model<IAccessPoint> = mongoose.model<IAccessPoint>('AccessPoint', AccessPointSchema);

export default AccessPoint;
