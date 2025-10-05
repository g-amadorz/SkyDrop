import mongoose, { Document, Model, Schema } from "mongoose";

export interface IShipper extends Document {
    account: mongoose.Types.ObjectId;
    activeProductIds: mongoose.Types.ObjectId[];
}

const ShipperSchema: Schema<IShipper> = new Schema({
    account: {
        type: Schema.Types.ObjectId,
        ref: 'User',
    },
    activeProductIds: [
        {
          type: Schema.Types.ObjectId,
          ref: "Product",
        },
      ],
    
})


const Shipper: Model<IShipper> = mongoose.model<IShipper>('Shipper', ShipperSchema);

export default Shipper;
