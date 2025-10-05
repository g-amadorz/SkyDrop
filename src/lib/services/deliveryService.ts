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
        // - Reserve funds from shipper's wallet // Done
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
            distance: 0, // Will be calculated on dropoff
            earnings: 0, // Will be calculated on dropoff
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
    async dropoffPackage(commuterId: string, deliveryId: string, accessPointId: string) {
        // - Verify commuter owns this delivery
        // - Verify commuter is at the access point
        // - Calculate leg distance and earnings
        // - Complete current delivery leg
        // - Deduct earnings from shipper's reserved amount
        // - Pay commuter
        // - Check if this is final destination:
        //   - If YES: Update status to 'ready-for-recipient'
        //   - If NO: Update status to 'awaiting-pickup', clear commuter
        // - Update product currentLocation
        // - Remove from commuter's activeProductIds
        
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

        if (delivery.destinationAccessPoint !== currentAccessPoint._id) {
            const updatedDelivery = await this.deliveryRepository.updateDelivery(deliveryId, {
                status: 'awaiting-pickup',
                currentCommuterId: null,
            });
        } else {
            const updatedDelivery = await this.deliveryRepository.updateDelivery(deliveryId, {
                status: 'ready-for-recipient',
                currentCommuterId: null,
            });
        }


        const earnings = this.calculateLegEarnings(delivery.legs[delivery.legs.length - 1].distance, delivery.legs[delivery.legs.length - 1].distance, delivery.legs[delivery.legs.length - 1].earnings);

        
    
    
    
    }

    // 4. RECIPIENT PICKUP (Recipient claims package)
    async recipientPickup(deliveryId: string, verificationCode: string, recipientInfo: any) {
        // - Verify delivery exists
        // - Verify status is 'ready-for-recipient'
        // - Verify verification code matches
        // - Verify recipient details match
        // - Update delivery status to 'completed'
        // - Update product status to 'delivered'
        // - Set completedAt timestamp
        // - Release any unused reserved funds back to shipper
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
        // - Find delivery by ID
        // - Populate shipper, commuter, product, access points
        // - Return full delivery details
    }

    async getDeliveryByProductId(productId: string) {
        // - Find delivery by product ID
        // - Return delivery details
    }

    async getShipperDeliveries(shipperId: string, status?: string) {
        // - Find all deliveries for a shipper
        // - Optional filter by status
        // - Return list with pagination
    }

    async getCommuterActiveDeliveries(commuterId: string) {
        // - Find all deliveries where currentCommuterId matches
        // - Filter by status 'in-transit'
        // - Return active deliveries with route info
    }

    // 6. PRICING & CALCULATION
    async calculateDeliveryCost(originId: string, destinationId: string, weight: number, priority: string) {
        // - Get origin and destination coordinates
        // - Calculate distance using Haversine formula
        // - Apply pricing formula:
        //   baseCost = (distance * RATE_PER_KM) + (weight * RATE_PER_KG)
        //   totalCost = baseCost * priorityMultiplier * demandMultiplier
        // - Return estimated cost
    }

    private calculateLegEarnings(legDistance: number, totalDistance: number, totalCost: number) {
        // - Calculate percentage of journey completed
        // - Apply platform fee (10%)
        // - Return earnings for this leg
        
    
    
    }

    // 7. VALIDATION & HELPERS
    async validateShipperBalance(shipperId: string, requiredAmount: number) {
        // - Get shipper's current points
        // - Check if sufficient
        // - Throw InsufficientFundsError if not
    }

    async validateCommuterCapacity(commuterId: string) {
        // - Get commuter's active deliveries count
        // - Check against max capacity
        // - Throw CapacityExceededError if exceeded
    }

    async validateLocation(userId: string, requiredAccessPointId: string) {
        // - Get user's current location (from request or GPS)
        // - Get access point location
        // - Calculate distance
        // - Throw LocationMismatchError if too far
    }

    // private generateVerificationCode(): string {
    //     // - Generate 6-digit random code
    //     // - Return code
    // }

    // 9. TRACKING & HISTORY
    async getDeliveryHistory(deliveryId: string) {
        // - Get all delivery legs
        // - Return timeline of pickup/dropoff events
        // - Include commuters, locations, timestamps
    }

    async trackDelivery(trackingNumber: string) {
        // - Find delivery by tracking number
        // - Return current status, location, estimated arrival
    }
}