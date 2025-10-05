import Shipper from "@/lib/database/models/Shipper";
import { IShipper } from "@/lib/database/models/Shipper";
import { createShipperInput, updateShipperInput } from "@/lib/schemas/shipperSchema";

export class ShipperRepository {
    constructor() {}

    async createShipper(shipperData: createShipperInput): Promise<IShipper> {
        const shipper = await Shipper.create(shipperData);
        return shipper;
    }

    async findShipperById(id: string): Promise<IShipper | null> {
        return await Shipper.findById(id).populate('account').populate('activeProductIds');
    }

    async findShipperByAccount(accountId: string): Promise<IShipper | null> {
        return await Shipper.findOne({ account: accountId }).populate('account').populate('activeProductIds');
    }

    async updateShipper(id: string, shipperData: updateShipperInput): Promise<IShipper | null> {
        return await Shipper.findByIdAndUpdate(id, shipperData, {
            new: true,
            runValidators: true,
        }).populate('account').populate('activeProductIds');
    }

    async deleteShipper(id: string): Promise<IShipper | null> {
        return await Shipper.findByIdAndDelete(id);
    }

    async findShippersByActiveProducts(): Promise<IShipper[]> {
        return await Shipper.find({ activeProductIds: { $ne: [] } }).populate('account').populate('activeProductIds');
    }

    async getAllShippers(): Promise<IShipper[]> {
        return await Shipper.find({}).populate('account').populate('activeProductIds');
    }

    async addProductToShipper(shipperId: string, productId: string): Promise<IShipper | null> {
        return await Shipper.findByIdAndUpdate(
            shipperId,
            { $addToSet: { activeProductIds: productId } },
            { new: true, runValidators: true }
        ).populate('account').populate('activeProductIds');
    }

    async removeProductFromShipper(shipperId: string, productId: string): Promise<IShipper | null> {
        return await Shipper.findByIdAndUpdate(
            shipperId,
            { $pull: { activeProductIds: productId } },
            { new: true, runValidators: true }
        ).populate('account').populate('activeProductIds');
    }
}
