import { z } from 'zod';

// Schema for creating a delivery leg
export const deliveryLegSchema = z.object({
  commuterId: z.string(),
  fromAccessPoint: z.string(),
  toAccessPoint: z.string(),
  pickupTime: z.date().optional(),
  dropoffTime: z.date().optional(),
  distance: z.number().min(0),
  earnings: z.number().min(0),
  status: z.enum(['in-progress', 'completed']).default('in-progress'),
});

// Schema for initiating a delivery
export const initiateDeliverySchema = z.object({
  productId: z.string(),
  shipperId: z.string(),
  originAccessPoint: z.string(),
  destinationAccessPoint: z.string(),
  estimatedDistance: z.number().min(0),
  totalCost: z.number().min(0),
  recipientVerificationCode: z.string().min(4).max(8),
});

// Schema for claiming a package (commuter picks up)
export const claimPackageSchema = z.object({
  deliveryId: z.string(),
  commuterId: z.string(),
  packageIds: z.array(z.string()).min(1).max(10), // Support multiple packages
});

// Schema for dropping off a package
export const dropoffPackageSchema = z.object({
  deliveryId: z.string(),
  commuterId: z.string(),
  accessPointId: z.string(),
  distance: z.number().min(0),
});

// Schema for recipient pickup
export const recipientPickupSchema = z.object({
  deliveryId: z.string(),
  verificationCode: z.string().min(4).max(8),
  recipientPhone: z.string().optional(),
  recipientName: z.string().optional(),
});

// Schema for updating delivery status
export const updateDeliveryStatusSchema = z.object({
  status: z.enum(['awaiting-pickup', 'in-transit', 'at-intermediate', 'ready-for-recipient', 'completed', 'cancelled']),
  currentAccessPoint: z.string().optional(),
  currentCommuterId: z.string().optional(),
});

// Schema for getting available packages for commuters
export const getAvailablePackagesSchema = z.object({
  accessPointId: z.string().optional(),
  maxDistance: z.number().min(0).optional(),
  minEarnings: z.number().min(0).optional(),
  destinationDirection: z.enum(['VCC-CLARK', 'LAFARGE']).optional(),
});

// Schema for tracking delivery
export const trackDeliverySchema = z.object({
  trackingNumber: z.string().optional(),
  deliveryId: z.string().optional(),
}).refine(data => data.trackingNumber || data.deliveryId, {
  message: "Either trackingNumber or deliveryId must be provided",
});

// Type exports
export type DeliveryLegInput = z.infer<typeof deliveryLegSchema>;
export type InitiateDeliveryInput = z.infer<typeof initiateDeliverySchema>;
export type ClaimPackageInput = z.infer<typeof claimPackageSchema>;
export type DropoffPackageInput = z.infer<typeof dropoffPackageSchema>;
export type RecipientPickupInput = z.infer<typeof recipientPickupSchema>;
export type UpdateDeliveryStatusInput = z.infer<typeof updateDeliveryStatusSchema>;
export type GetAvailablePackagesInput = z.infer<typeof getAvailablePackagesSchema>;
export type TrackDeliveryInput = z.infer<typeof trackDeliverySchema>;
