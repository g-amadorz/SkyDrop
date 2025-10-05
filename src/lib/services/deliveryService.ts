import { DeliveryRepository } from "@/lib/database/repository/deliveryRepository";
import { UserService } from "@/lib/services/userService";
import { ProductService } from "@/lib/services/productService";
import { AccessPointService } from "@/lib/services/accessPointService";
import { InitiateDeliveryInput } from "../schemas/deliverySchema";
import { calculateStationDistance } from "../data/skytrainNetwork";


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

        const totalDeliveryCost = await this.calculateDeliveryCost(deliveryData.originAccessPoint, deliveryData.destinationAccessPoint);
        
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
        const earnings = await this.calculateLegEarnings(
            currentLeg.fromAccessPoint.toString(),
            accessPointId
        );

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
        const isFinalDestination = delivery.destinationAccessPoint == currentAccessPoint._id;
        
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

        const unusedFunds = delivery.reservedAmount - delivery.paidAmount;

        if (unusedFunds > 0) {
            await this.userService.addPointsToUser(delivery.shipperId.toString(), unusedFunds);
        }

        // Update delivery status to completed
        const updatedDelivery = await this.deliveryRepository.updateDelivery(deliveryId, {
            status: 'completed' as any,
            completedAt: new Date(),
        });

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
    async calculateDeliveryCost(originAccessPointId: string, destinationAccessPointId: string): Promise<number>{
        const originAccessPoint = await this.accessPointService.findAccessPointById(originAccessPointId);
        const destinationAccessPoint = await this.accessPointService.findAccessPointById(destinationAccessPointId);

        if (!originAccessPoint || !destinationAccessPoint) {
            throw new Error('Access point not found');
        }

        const hops = calculateStationDistance(
            originAccessPoint.stationId,
            destinationAccessPoint.stationId
        );

        // Pricing constants
        const COST_PER_STATION = 1.50; // $1.50 per station hop
        const PLATFORM_FEE_PERCENTAGE = 0.10; // 10% platform fee

        // Calculate base cost
        const baseCost = (hops * COST_PER_STATION);

        // Add platform fee
        const totalCost = baseCost * (1 + PLATFORM_FEE_PERCENTAGE);

        // Round to 2 decimal places
        return Math.round(totalCost * 100) / 100;
    }

    async calculateLegEarnings(originAccessPointId: string, destinationAccessPointId: string): Promise<number> {
        const originAccessPoint = await this.accessPointService.findAccessPointById(originAccessPointId);
        const destinationAccessPoint = await this.accessPointService.findAccessPointById(destinationAccessPointId);

        if (!originAccessPoint || !destinationAccessPoint) {
            throw new Error('Access point not found');
        }

        const hops = calculateStationDistance(
            originAccessPoint.stationId,
            destinationAccessPoint.stationId
        );

        const COST_PER_STATION = 1.50; 
        const PLATFORM_FEE_PERCENTAGE = 0.10;

        const baseCost = (hops * COST_PER_STATION);

        const totalCost = baseCost * (1 + PLATFORM_FEE_PERCENTAGE);

        return Math.round(totalCost * 100) / 100;
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

}