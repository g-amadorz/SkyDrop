/**
 * Delivery-specific errors
 */

import {
    NotFoundError,
    ValidationError,
    DatabaseError as BaseDBError,
    ConflictError,
    ForbiddenError,
    InsufficientResourceError,
} from './AppError';

// ============================================
// Delivery-Specific Error Types
// ============================================

/**
 * Thrown when a delivery is not found
 */
export class DeliveryNotFoundError extends NotFoundError {
    constructor(deliveryId?: string) {
        super('Delivery', deliveryId);
        this.name = 'DeliveryNotFoundError';
    }
}

/**
 * Thrown when shipper has insufficient funds for delivery
 */
export class InsufficientFundsError extends InsufficientResourceError {
    constructor(required: number, available: number) {
        super('funds', required, available);
        this.name = 'InsufficientFundsError';
    }
}

/**
 * Thrown when commuter tries to claim a package they're not authorized for
 */
export class UnauthorizedClaimError extends ForbiddenError {
    constructor(reason?: string) {
        super(reason || 'Not authorized to claim this package');
        this.name = 'UnauthorizedClaimError';
    }
}

/**
 * Thrown when package is already claimed by another commuter
 */
export class PackageAlreadyClaimedError extends ConflictError {
    constructor(packageId: string) {
        super(`Package ${packageId} is already claimed by another commuter`);
        this.name = 'PackageAlreadyClaimedError';
    }
}

/**
 * Thrown when commuter exceeds their capacity
 */
export class CapacityExceededError extends ConflictError {
    constructor(currentLoad: number, maxCapacity: number) {
        super(`Capacity exceeded. Current: ${currentLoad}, Max: ${maxCapacity}`);
        this.name = 'CapacityExceededError';
    }
}

/**
 * Thrown when verification code is invalid
 */
export class InvalidVerificationCodeError extends ValidationError {
    constructor() {
        super('Invalid verification code');
        this.name = 'InvalidVerificationCodeError';
    }
}

/**
 * Thrown when delivery status transition is invalid
 */
export class InvalidDeliveryStatusError extends ConflictError {
    constructor(currentStatus: string, newStatus: string) {
        super(`Cannot transition delivery from '${currentStatus}' to '${newStatus}'`);
        this.name = 'InvalidDeliveryStatusError';
    }
}

/**
 * Thrown when commuter is not at the required location
 */
export class LocationMismatchError extends ValidationError {
    constructor(requiredLocation: string) {
        super(`You must be at ${requiredLocation} to perform this action`);
        this.name = 'LocationMismatchError';
    }
}

/**
 * Thrown when delivery update fails
 */
export class DeliveryUpdateFailedError extends BaseDBError {
    constructor(operation: string = 'update') {
        super(operation, 'Delivery update failed');
        this.name = 'DeliveryUpdateFailedError';
    }
}

/**
 * Thrown when payment processing fails
 */
export class PaymentProcessingError extends BaseDBError {
    constructor(details?: string) {
        super('payment', details || 'Payment processing failed');
        this.name = 'PaymentProcessingError';
    }
}
