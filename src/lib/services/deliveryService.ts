// src/lib/services/deliveryService.ts
import { Types } from "mongoose";
import { DeliveryRepository } from "@/lib/database/repository/deliveryRepository";
import { UserService } from "@/lib/services/userService";
import { ProductService } from "@/lib/services/productService";
import { AccessPointService } from "@/lib/services/accessPointService";
import { InitiateDeliveryInput } from "../schemas/deliverySchema";
import { calcProgress, calcPayoutDelta, DenominatorMode } from "./progressService";

export default class DeliveryService {
  private deliveryRepository: DeliveryRepository;
  private userService: UserService;
  private productService: ProductService;
  private accessPointService: AccessPointService;

  constructor() {
    this.deliveryRepository = new DeliveryRepository();
    this.userService = new UserService();
    this.productService = new ProductService();
    this.accessPointService = new AccessPointService();
  }

  // Small helpers to keep casting/guards local
  private asOid(v: any, fieldName: string): Types.ObjectId {
    // Works for both string and Types.ObjectId-like inputs
    if (v instanceof Types.ObjectId) return v;
    if (typeof v === "string") return new Types.ObjectId(v);
    // Try to unwrap documents `{ _id }`
    if (v && typeof v === "object" && v._id) {
      const id = (v._id as any);
      if (id instanceof Types.ObjectId) return id;
      if (typeof id === "string") return new Types.ObjectId(id);
    }
    throw new Error(`Invalid ObjectId for ${fieldName}`);
  }

  private ensure<T>(val: T | null | undefined, name: string): T {
    if (val === null || val === undefined) throw new Error(`${name} not found`);
    return val;
  }

  // 1) INITIATION (Shipper creates delivery)
  async initiateDelivery(shipperId: string, deliveryData: InitiateDeliveryInput) {
    const shipper = this.ensure(await this.userService.findUserById(shipperId), "Shipper");
    if ((shipper as any).role !== "sender") throw new Error("User must have sender role");

    this.ensure(await this.productService.findProductById(deliveryData.productId), "Product");

    // Create with exactly the fields InitiateDeliveryInput allows (no extra keys)
    const created = this.ensure(
      await this.deliveryRepository.createDelivery({
        ...deliveryData,
      } as any),
      "DeliveryCreate"
    );

    // Follow-up update to set currentAccessPoint to origin without changing your DTO/schema
    const updated = this.ensure(
      await this.deliveryRepository.updateDelivery((created as any)._id, {
        currentAccessPoint: this.asOid((created as any).originAccessPoint, "originAccessPoint"),
        status: "awaiting-pickup",
        legs: [],
        progress: 0,
        awardedPoints: 0,
        paidAmount: (created as any).paidAmount ?? 0,
        actualDistance: (created as any).actualDistance ?? 0,
      } as any),
      "DeliveryInitUpdate"
    );

    return updated;
  }

  // 2) CLAIMING (Commuter picks up package)
  async claimPackage(commuterId: string, deliveryId: string) {
    const commuter = this.ensure(await this.userService.findUserById(commuterId), "Commuter");
    const delivery = this.ensure(await this.deliveryRepository.findDeliveryById(deliveryId), "Delivery");

    if (delivery.status !== "awaiting-pickup") {
      throw new Error("Delivery must be in awaiting-pickup status");
    }
    if (delivery.currentCommuterId) {
      throw new Error("Delivery already has a commuter");
    }

    const newLeg = {
      commuterId: this.asOid((commuter as any)._id, "commuter._id"),
      fromAccessPoint: this.asOid((delivery as any).currentAccessPoint, "delivery.currentAccessPoint"),
      toAccessPoint: this.asOid((delivery as any).destinationAccessPoint, "delivery.destinationAccessPoint"),
      pickupTime: new Date(),
      distance: 0,
      earnings: 0,
      status: "in-progress" as const,
    };

    const updated = this.ensure(
      await this.deliveryRepository.updateDelivery((delivery as any)._id, {
        status: "in-transit",
        currentCommuterId: this.asOid((commuter as any)._id, "commuter._id"),
        legs: [...(delivery.legs ?? []), newLeg],
      } as any),
      "DeliveryClaimUpdate"
    );

    return updated;
  }

  // 3) DROPOFF (Commuter drops at intermediate or final destination)
  async dropoffPackage(
    commuterId: string,
    deliveryId: string,
    accessPointId: string,
    denominatorMode: DenominatorMode = "nodes" // "nodes" → 4/5 + 1/5; use "hops" for 3/4 + 1/4
  ) {
    const commuter = this.ensure(await this.userService.findUserById(commuterId), "Commuter");
    const currentAP = this.ensure(await this.accessPointService.findAccessPointById(accessPointId), "AccessPoint");
    const delivery = this.ensure(await this.deliveryRepository.findDeliveryById(deliveryId), "Delivery");

    const currentCommuterId = delivery.currentCommuterId ? delivery.currentCommuterId.toString() : null;
    if (!currentCommuterId || currentCommuterId !== (commuter as any)._id.toString()) {
      throw new Error("You are not assigned to this delivery");
    }

    // 1) Compute progress on planned path (idempotent payout via delta)
    const pathStr = (delivery.plannedPath as any[]).map((id) => this.asOid(id, "plannedPath[]").toString());
    const originStr = this.asOid((delivery as any).originAccessPoint, "originAccessPoint").toString();
    const destStr = this.asOid((delivery as any).destinationAccessPoint, "destinationAccessPoint").toString();
    const atStr = this.asOid((currentAP as any)._id, "currentAP._id").toString();

    const { progress: newProgress } = calcProgress(pathStr, originStr, destStr, atStr, denominatorMode);
    const prevProgress = delivery.progress ?? 0;

    // Reconstruct original base: awardedSoFar + remainingReserve
    const originalBase = (delivery.awardedPoints ?? 0) + (delivery.reservedAmount ?? 0);

    const grossPayoutThisDrop = calcPayoutDelta(originalBase, prevProgress, newProgress);
    const PLATFORM_FEE = 0.10;
    const commuterNet = Math.max(0, grossPayoutThisDrop * (1 - PLATFORM_FEE));

    // 2) Close the active leg
    const legs = [...(delivery.legs ?? [])];
    const last = legs[legs.length - 1];
    if (!last || last.status !== "in-progress") throw new Error("No active leg to close");

    last.toAccessPoint = this.asOid((currentAP as any)._id, "currentAP._id");
    last.dropoffTime = new Date();
    last.status = "completed";
    last.earnings = commuterNet;

    // 3) Update delivery document
    const isFinal = atStr === destStr;

    const updated = this.ensure(
      await this.deliveryRepository.updateDelivery((delivery as any)._id, {
        status: isFinal ? "ready-for-recipient" : "awaiting-pickup",
        currentCommuterId: undefined, // clear commuter (must be undefined, not null, for type)
        currentAccessPoint: this.asOid((currentAP as any)._id, "currentAP._id"),
        legs,
        progress: newProgress,
        awardedPoints: (delivery.awardedPoints ?? 0) + grossPayoutThisDrop,
        reservedAmount: Math.max(0, (delivery.reservedAmount ?? 0) - grossPayoutThisDrop),
      } as any),
      "DeliveryDropUpdate"
    );

    // NOTE: We are NOT calling userService.creditCommuter / debitShipperReserve here
    // to avoid coupling & missing methods. Instead, return amounts to the caller.
    return {
      delivery: updated,
      awardedNowGross: grossPayoutThisDrop,
      commuterNet,
      progress: newProgress,
      status: updated.status,
    };
  }

  // 4) RECIPIENT PICKUP (Recipient claims package)
  async recipientPickup(deliveryId: string, verificationCode: string, _recipientInfo: any) {
    const delivery = this.ensure(await this.deliveryRepository.findDeliveryById(deliveryId), "Delivery");
    if (delivery.status !== "ready-for-recipient") throw new Error("Delivery not ready for recipient");
    if (verificationCode !== delivery.recipientVerificationCode) throw new Error("Invalid verification code");

    // If you introduce a "completed" status, set it here; for now we keep "ready-for-recipient"
    const completed = this.ensure(
      await this.deliveryRepository.updateDelivery((delivery as any)._id, {
        completedAt: new Date(),
      } as any),
      "DeliveryCompleteUpdate"
    );

    return completed;
  }

  // Queries (unchanged stubs)
  async getDeliveryById(id: string) {
    return this.deliveryRepository.findDeliveryById(id);
  }
  async getDeliveryByProductId(productId: string) {
    return (this.deliveryRepository as any).findByProductId(productId);
  }
  async getShipperDeliveries(shipperId: string, status?: string) {
    return (this.deliveryRepository as any).findByShipper(shipperId, status);
  }
  async getCommuterActiveDeliveries(commuterId: string) {
    return (this.deliveryRepository as any).findActiveByCommuter(commuterId);
  }
}
