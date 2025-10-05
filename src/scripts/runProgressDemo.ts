// runServiceQuickTest.ts — minimal, no aliases, no ESM fuss
import { Types } from "mongoose";
import DeliveryService from "../lib/services/deliveryService";

const ap1 = new Types.ObjectId();
const ap2 = new Types.ObjectId();
const ap3 = new Types.ObjectId();
const ap4 = new Types.ObjectId();
const ap5 = new Types.ObjectId();
const shipperId = new Types.ObjectId();
const productId = new Types.ObjectId();
const commuterId = new Types.ObjectId();

type AnyDoc = any;

const delivery: AnyDoc = {
  _id: new Types.ObjectId(),
  productId,
  shipperId,
  currentCommuterId: undefined,
  originAccessPoint: ap1,
  destinationAccessPoint: ap5,
  currentAccessPoint: ap1,
  status: "awaiting-pickup",
  plannedPath: [ap1, ap2, ap3, ap4, ap5],
  progress: 0,
  awardedPoints: 0,
  legs: [],
  totalCost: 25,
  paidAmount: 0,
  reservedAmount: 5,     // treat as full-route points pool
  estimatedDistance: 10,
  actualDistance: 0,
  recipientVerificationCode: "123456",
  createdAt: new Date(),
  updatedAt: new Date(),
};

const db = {
  users: new Map<string, any>([
    [shipperId.toString(), { _id: shipperId, role: "sender" }],
    [commuterId.toString(), { _id: commuterId, role: "commuter" }],
  ]),
  products: new Map<string, any>([[productId.toString(), { _id: productId }]]),
  accessPoints: new Map<string, any>([
    [ap1.toString(), { _id: ap1 }],
    [ap2.toString(), { _id: ap2 }],
    [ap3.toString(), { _id: ap3 }],
    [ap4.toString(), { _id: ap4 }],
    [ap5.toString(), { _id: ap5 }],
  ]),
  deliveries: new Map<string, AnyDoc>([[delivery._id.toString(), delivery]]),
};

function log(title: string, obj: any) {
  console.log("\n=== " + title + " ===");
  console.dir(obj, { depth: null });
}

(async () => {
  const svc = new DeliveryService();

  // Mock dependencies directly on the instance (no other files touched)
  (svc as any).userService = { findUserById: async (id: string) => db.users.get(id) || null };
  (svc as any).productService = { findProductById: async (id: string) => db.products.get(id) || null };
  (svc as any).accessPointService = { findAccessPointById: async (id: string) => db.accessPoints.get(id) || null };
  (svc as any).deliveryRepository = {
    findDeliveryById: async (id: string) => db.deliveries.get(id) || null,
    updateDelivery: async (id: string, updates: any) => {
      const doc = db.deliveries.get(id);
      if (!doc) return null;
      Object.assign(doc, updates, { updatedAt: new Date() });
      return doc;
    },
    createDelivery: async (payload: any) => ({ ...payload, _id: new Types.ObjectId() }),
  };

  log("Initial", delivery);

  // Claim
  const afterClaim = await svc.claimPackage(commuterId.toString(), delivery._id.toString());
  log("After claimPackage()", { status: afterClaim.status, legs: afterClaim.legs.length });

  // Drop at AP4 (nodes mode → 4/5)
  const res1 = await svc.dropoffPackage(
    commuterId.toString(),
    delivery._id.toString(),
    ap4.toString(),
    "nodes"
  );
  log("After drop at AP4", {
    progress: res1.progress,
    awardedNowGross: res1.awardedNowGross,
    commuterNet: res1.commuterNet,
    reservedLeft: db.deliveries.get(delivery._id.toString()).reservedAmount,
    status: res1.status,
  });

  // Claim again (simulating the next hop pickup)
  const afterClaim2 = await svc.claimPackage(commuterId.toString(), delivery._id.toString());
  log("After 2nd claim", { status: afterClaim2.status, legs: afterClaim2.legs.length });

  // Final drop at AP5 (nodes mode → remaining 1/5)
  const res2 = await svc.dropoffPackage(
    commuterId.toString(),
    delivery._id.toString(),
    ap5.toString(),
    "nodes"
  );
  log("After drop at AP5", {
    progress: res2.progress,
    awardedNowGross: res2.awardedNowGross,
    commuterNet: res2.commuterNet,
    reservedLeft: db.deliveries.get(delivery._id.toString()).reservedAmount,
    status: res2.status,
  });

  log("Final delivery", db.deliveries.get(delivery._id.toString()));
})();
