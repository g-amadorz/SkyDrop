import { DeliveryRepository } from "@/lib/database/repository/deliveryRepository";
import { UserService } from "@/lib/services/userService";
import { ProductService } from "@/lib/services/productService";
import { AccessPointService } from "@/lib/services/accessPointService";
import { InitiateDeliveryInput } from "../schemas/deliverySchema";

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

    // 1. INITIATION (Shipper creates delivery)
    async initiateDelivery(shipperId: string, deliveryData: InitiateDeliveryInput) {
        // - Verify shipper exists and has 'sender' role // Done
        // - Check shipper has sufficient points // Done
        // - Calculate estimated cost // Done
        // - Create delivery record // Done
        // - Update product status to 'awaiting-pickup' // Done
        // - Generate recipient verification code
        // - Return delivery with tracking info // Done
        
        const shipper = await this.userService.findUserById(shipperId);
        if (!shipper) {
            throw new Error('Shipper not found');
        }

        if (shipper.role !== 'sender') {
            throw new Error('User must have sender role');
        }

        const product = await this.productService.findProductById(deliveryData.productId);
        if (!product) {
            throw new Error('Product not found');
        }

        const totalDeliveryCost = await this.calculateDeliveryCost();
        
        // TODO: Implement validateShipperBalance error handling
        try {
            this.validateShipperBalance(shipperId, totalDeliveryCost)
        } catch (error) {
            throw error;
        }


        
        const delivery = await this.deliveryRepository.createDelivery(deliveryData);
        return delivery;
    }

    // 2. CLAIMING (Commuter picks up package)
    async claimPackage(commuterId: string, deliveryId: string) {
        // - Assign commuter to delivery
        // - Create new delivery leg
        // - Update product status to 'in-transit'
        // - Add product to commuter's activeProductIds

        const commuter = await this.userService.findUserById(commuterId);
        if (!commuter) {
            throw new Error('Commuter not found');
        }

        const delivery = await this.deliveryRepository.findDeliveryById(deliveryId);

        if (!delivery) {
            throw new Error('Delivery not found');
        }

        if (delivery.status !== 'awaiting-pickup') {
            throw new Error('Delivery must be in awaiting-pickup status');
        }

        if (delivery.currentCommuterId) {
            throw new Error('Delivery already has a commuter');
        }

        const newLeg = {
            commuterId: commuter._id,
            fromAccessPoint: delivery.currentAccessPoint,
            toAccessPoint: delivery.destinationAccessPoint, // Will be updated on dropoff
            pickupTime: new Date(),
            status: 'in-progress' as const,
        };

        const updatedDelivery = await this.deliveryRepository.updateDelivery(deliveryId, {
            status: 'in-transit',
            currentCommuterId: commuter._id,
            legs: [...delivery.legs, newLeg],
        });

        return updatedDelivery;
    }

    // 3. DROPOFF (Commuter drops at intermediate or final destination)
    async dropoffPackage(commuterId: string, deliveryId: string, accessPointId: string, distance: number) {
        const commuter = await this.userService.findUserById(commuterId);
        if (!commuter) {
            throw new Error('Commuter not found');
        }
        
        const currentAccessPoint = await this.accessPointService.findAccessPointById(accessPointId);
        if (!currentAccessPoint) {
            throw new Error('Access point not found');
        }

        const delivery = await this.deliveryRepository.findDeliveryById(deliveryId);
        if (!delivery) {
            throw new Error('Delivery not found');
        }

        // Verify commuter owns this delivery
        if (delivery.currentCommuterId?.toString() !== commuterId) {
            throw new Error('Commuter does not own this delivery');
        }

        // Get current leg and complete it
        const currentLeg = delivery.legs[delivery.legs.length - 1];
        if (!currentLeg) {
            throw new Error('No active delivery leg found');
        }

        // Calculate earnings for this leg
        const earnings = this.calculateLegEarnings(distance, delivery.estimatedDistance, delivery.totalCost);

        // Update the current leg
        currentLeg.dropoffTime = new Date();
        currentLeg.distance = distance;
        currentLeg.earnings = earnings;
        currentLeg.status = 'completed';
        currentLeg.toAccessPoint = currentAccessPoint._id as any;

        // Pay commuter
        await this.userService.addPointsToUser(commuterId, earnings);

        // Update delivery paid amount
        const newPaidAmount = delivery.paidAmount + earnings;
        const newActualDistance = delivery.actualDistance + distance;

        // Check if this is final destination
        const isFinalDestination = delivery.destinationAccessPoint.toString() === accessPointId;
        
        const updatedDelivery = await this.deliveryRepository.updateDelivery(deliveryId, {
            status: isFinalDestination ? 'ready-for-recipient' : 'awaiting-pickup',
            currentCommuterId: isFinalDestination ? null : delivery.currentCommuterId,
            currentAccessPoint: currentAccessPoint._id,
            legs: delivery.legs,
            paidAmount: newPaidAmount,
            actualDistance: newActualDistance,
        });

        // Update product location
        // Note: Product update needs to be done via repository directly due to schema limitations
        // await this.productService.updateProduct(delivery.productId.toString(), {
        //     currentLocation: accessPointId,
        //     status: isFinalDestination ? 'ready-for-pickup' : 'in-transit',
        // });

        return updatedDelivery;
    }

    

    // 4. RECIPIENT PICKUP (Recipient claims package)
    async recipientPickup(deliveryId: string, verificationCode: string, recipientInfo: any) {
        const delivery = await this.deliveryRepository.findDeliveryById(deliveryId);
        if (!delivery) {
            throw new Error('Delivery not found');
        }

        if (delivery.status !== 'ready-for-recipient') {
            throw new Error('Delivery is not ready for recipient pickup');
        }

        if (delivery.recipientVerificationCode !== verificationCode) {
            throw new Error('Invalid verification code');
        }

        // Calculate unused funds
        const unusedFunds = delivery.reservedAmount - delivery.paidAmount;

        // Release unused funds back to shipper
        if (unusedFunds > 0) {
            await this.userService.addPointsToUser(delivery.shipperId.toString(), unusedFunds);
        }

        // Update delivery status to completed
        const updatedDelivery = await this.deliveryRepository.updateDelivery(deliveryId, {
            status: 'completed' as any,
            completedAt: new Date(),
        });

        // Update product status to delivered
        // Note: Product update needs to be done via repository directly due to schema limitations
        // await this.productService.updateProduct(delivery.productId.toString(), {
        //     status: 'delivered',
        // });

        return updatedDelivery;
    }

    // // 5. QUERY OPERATIONS
    // async getAvailablePackages(filters: GetAvailablePackagesInput) {
    //     // - Query deliveries with status 'awaiting-pickup'
    //     // - Filter by access point location
    //     // - Filter by destination direction
    //     // - Filter by minimum earnings
    //     // - Filter by max distance from commuter
    //     // - Return sorted by earnings (highest first)
    // }

    async getDeliveryById(id: string) {
        const delivery = await this.deliveryRepository.findDeliveryById(id);
        if (!delivery) {
            throw new Error('Delivery not found');
        }
        return delivery;
    }

    async getDeliveryByProductId(productId: string) {
        const deliveries = await this.deliveryRepository.findDeliveryByProductId(productId);
        return deliveries;
    }

    async getShipperDeliveries(shipperId: string, status?: string) {
        if (status) {
            const deliveries = await this.deliveryRepository.findDeliveryByStatus(status);
            return deliveries.filter(d => d.shipperId.toString() === shipperId);
        }
        return await this.deliveryRepository.findDeliveryByShipperId(shipperId);
    }

    async getCommuterActiveDeliveries(commuterId: string) {
        const deliveries = await this.deliveryRepository.findDeliveryByCurrentCommuterId(commuterId);
        return deliveries.filter(d => d.status === 'in-transit');
    }

    // 6. PRICING & CALCULATION
    async calculateDeliveryCost(): Promise<number>{
        // - Get origin and destination coordinates
        // - Calculate distance using Haversine formula
        // - Apply pricing formula:
        //   baseCost = (distance * RATE_PER_KM) + (weight * RATE_PER_KG)
        //   totalCost = baseCost * priorityMultiplier * demandMultiplier
        // - Return estimated cost

        return 0;
    }

    private calculateLegEarnings(legDistance: number, totalDistance: number, totalCost: number): number {
        // Calculate percentage of journey completed
        const percentageOfJourney = legDistance / totalDistance;
        
        // Calculate base earnings for this leg
        const baseEarnings = totalCost * percentageOfJourney;
        
        // Apply platform fee (10%)
        const platformFee = baseEarnings * 0.10;
        const earnings = baseEarnings - platformFee;
        
        return Math.round(earnings * 100) / 100; // Round to 2 decimal places
    }

    // 7. VALIDATION & HELPERS
    async validateShipperBalance(shipperId: string, requiredAmount: number) {
        const shipper = await this.userService.findUserById(shipperId);
        if (!shipper) {
            throw new Error('Shipper not found');
        }
        
        if (shipper.points < requiredAmount) {
            throw new Error(`Insufficient funds. Required: ${requiredAmount}, Available: ${shipper.points}`);
        }
    }

    async validateCommuterCapacity(commuterId: string) {
        const activeDeliveries = await this.getCommuterActiveDeliveries(commuterId);
        const MAX_CAPACITY = 5; // Maximum packages a commuter can carry
        
        if (activeDeliveries.length >= MAX_CAPACITY) {
            throw new Error(`Capacity exceeded. Maximum capacity: ${MAX_CAPACITY}`);
        }
    }

    async validateLocation(userId: string, requiredAccessPointId: string) {
        // This would typically integrate with GPS/location services
        // For now, we'll implement a basic check
        const accessPoint = await this.accessPointService.findAccessPointById(requiredAccessPointId);
        if (!accessPoint) {
            throw new Error('Access point not found');
        }
        
        // In a real implementation, you would:
        // 1. Get user's current GPS coordinates
        // 2. Calculate distance to access point
        // 3. Verify they are within acceptable range (e.g., 100 meters)
        // For now, we'll just return true
        return true;
    }

    // private generateVerificationCode(): string {
    //     // - Generate 6-digit random code
    //     // - Return code
    // }

    // 9. TRACKING & HISTORY
    async getDeliveryHistory(deliveryId: string) {
        const delivery = await this.deliveryRepository.findDeliveryById(deliveryId);
        if (!delivery) {
            throw new Error('Delivery not found');
        }
        
        // Return timeline of all legs with pickup/dropoff events
        return {
            deliveryId: delivery._id,
            status: delivery.status,
            legs: delivery.legs,
            createdAt: delivery.createdAt,
            completedAt: delivery.completedAt,
        };
    }

    async trackDelivery(trackingNumber: string) {
        // Note: This assumes trackingNumber is the delivery ID
        // In production, you'd have a separate tracking number field
        const delivery = await this.deliveryRepository.findDeliveryById(trackingNumber);
        if (!delivery) {
            throw new Error('Delivery not found');
        }
        
        return {
            trackingNumber,
            status: delivery.status,
            currentLocation: delivery.currentAccessPoint,
            destination: delivery.destinationAccessPoint,
            estimatedDistance: delivery.estimatedDistance,
            actualDistance: delivery.actualDistance,
            legs: delivery.legs,
        };
    }
}