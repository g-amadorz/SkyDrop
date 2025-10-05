// src/lib/database/repository/deliveryRepository.ts
import mongoose from "mongoose";
import Delivery, { IDelivery } from "@/models/Delivery";
import { InitiateDeliveryInput } from "@/lib/schemas/deliverySchema";

export class DeliveryRepository {
  constructor() {}

  // --- CREATE ---
  async createDelivery(delivery: InitiateDeliveryInput) {
    const newDelivery = new Delivery(delivery);
    return await newDelivery.save();
  }

  // --- READ ---
  async findDeliveryById(id: string) {
    if (!mongoose.isValidObjectId(id)) return null;
    return await Delivery.findById(id);
  }

  async findDeliveryByProductId(productId: string) {
    if (!mongoose.isValidObjectId(productId)) return [];
    return await Delivery.find({ productId });
  }

  // Alias for service compatibility
  async findByProductId(productId: string) {
    return this.findDeliveryByProductId(productId);
  }

  async findDeliveryByShipperId(shipperId: string) {
    if (!mongoose.isValidObjectId(shipperId)) return [];
    return await Delivery.find({ shipperId });
  }

  // Alias for service compatibility (supports optional status filter)
  async findByShipper(shipperId: string, status?: string) {
    if (!mongoose.isValidObjectId(shipperId)) return [];
    const query: any = { shipperId };
    if (status) query.status = status;
    return await Delivery.find(query);
  }

  async findDeliveryByCurrentCommuterId(currentCommuterId: string) {
    if (!mongoose.isValidObjectId(currentCommuterId)) return [];
    return await Delivery.find({ currentCommuterId });
  }

  async findDeliveryByCurrentAccessPoint(currentAccessPoint: string) {
    if (!mongoose.isValidObjectId(currentAccessPoint)) return [];
    return await Delivery.find({ currentAccessPoint });
  }

  async findDeliveryByStatus(status: string) {
    return await Delivery.find({ status });
  }

  // Used by getCommuterActiveDeliveries in deliveryService
  async findActiveByCommuter(commuterId: string) {
    if (!mongoose.isValidObjectId(commuterId)) return [];
    return await Delivery.find({
      currentCommuterId: commuterId,
      status: "in-transit",
    });
  }

  // --- UPDATE ---
  async updateDelivery(id: string, updateData: Partial<IDelivery>) {
    if (!mongoose.isValidObjectId(id)) return null;
    return await Delivery.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    });
  }
}

export default DeliveryRepository;
