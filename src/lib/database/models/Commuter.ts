import mongoose, { Document, Model, Schema } from "mongoose";

export interface ICommuter extends Document {
    account: mongoose.Types.ObjectId;
    activeProductIds: mongoose.Types.ObjectId[];
}

const CommuterSchema: Schema<ICommuter> = new Schema({
    account: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'Account reference is required'],
    },
    activeProductIds: [
        {
            type: Schema.Types.ObjectId,
            ref: "Product",
        },
    ],
});

const Commuter: Model<ICommuter> = mongoose.models.Commuter || mongoose.model<ICommuter>('Commuter', CommuterSchema);

export default Commuter;
