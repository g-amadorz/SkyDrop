import Delivery from "@/lib/database/models/Delivery"
import {InitiateDeliveryInput} from "@/lib/schemas/deliverySchema"

export class DeliveryRepository {
    constructor() {}

    async getAllDeliveries() {
        return await Delivery.find({});
    }

    async createDelivery(delivery: InitiateDeliveryInput) {
        const newDelivery = new Delivery(delivery);
        return await newDelivery.save();
    }

    async findDeliveryById(id: string) {
        return await Delivery.findById(id);
    }

    async findDeliveryByProductId(productId: string) {
        return await Delivery.find({ productId });
    }

    async findDeliveryByShipperId(shipperId: string) {
        return await Delivery.find({ shipperId });
    }

    async findDeliveryByCurrentCommuterId(currentCommuterId: string) {
        return await Delivery.find({ currentCommuterId });
    }

    async findDeliveryByCurrentAccessPoint(currentAccessPoint: string) {
        return await Delivery.find({ currentAccessPoint });
    }

    async findDeliveryByStatus(status: string) {
        return await Delivery.find({ status });
    }

    async updateDelivery(id: string, updateData: any) {
        return await Delivery.findByIdAndUpdate(id, updateData, {
            new: true,
            runValidators: true,
        });
    }
}


