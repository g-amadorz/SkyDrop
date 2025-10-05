/**
 * Product-specific errors
 */

import {
    NotFoundError,
    AlreadyExistsError,
    ValidationError,
    DatabaseError as BaseDBError,
    ConflictError,
} from './AppError';

// ============================================
// Product-Specific Error Types
// ============================================

/**
 * Thrown when a product is not found
 */
export class ProductNotFoundError extends NotFoundError {
    constructor(productId?: string) {
        super('Product', productId);
        this.name = 'ProductNotFoundError';
    }
}

/**
 * Thrown when a product already exists
 */
export class ProductAlreadyExistsError extends AlreadyExistsError {
    constructor(trackingNumber: string) {
        super('Product', 'tracking number', trackingNumber);
        this.name = 'ProductAlreadyExistsError';
    }
}

/**
 * Thrown when product status transition is invalid
 */
export class InvalidStatusTransitionError extends ConflictError {
    constructor(currentStatus: string, newStatus: string) {
        super(`Cannot transition product from '${currentStatus}' to '${newStatus}'`);
        this.name = 'InvalidStatusTransitionError';
    }
}

/**
 * Thrown when product update fails
 */
export class ProductUpdateFailedError extends BaseDBError {
    constructor(operation: string = 'update') {
        super(operation, 'Product update failed');
        this.name = 'ProductUpdateFailedError';
    }
}

/**
 * Thrown when product validation fails
 */
export class ProductValidationError extends ValidationError {
    constructor(message: string) {
        super(message);
        this.name = 'ProductValidationError';
    }
}
