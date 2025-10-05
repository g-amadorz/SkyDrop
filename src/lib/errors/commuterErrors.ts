/**
 * Commuter-specific errors
 */

import {
    NotFoundError,
    AlreadyExistsError,
    ValidationError,
    DatabaseError as BaseDBError,
    ConflictError,
} from './AppError';

// ============================================
// Commuter-Specific Error Types
// ============================================

/**
 * Thrown when a commuter is not found
 */
export class CommuterNotFoundError extends NotFoundError {
    constructor(commuterId?: string) {
        super('Commuter', commuterId);
        this.name = 'CommuterNotFoundError';
    }
}

/**
 * Thrown when a commuter already exists for an account
 */
export class CommuterAlreadyExistsError extends AlreadyExistsError {
    constructor(accountId: string) {
        super('Commuter', 'account', accountId);
        this.name = 'CommuterAlreadyExistsError';
    }
}

/**
 * Thrown when commuter has no active direction set
 */
export class NoDirectionSetError extends ValidationError {
    constructor() {
        super('Commuter must set a direction before claiming packages');
        this.name = 'NoDirectionSetError';
    }
}

/**
 * Thrown when trying to assign an invalid direction
 */
export class InvalidDirectionError extends ValidationError {
    constructor(direction: string) {
        super(`Invalid direction: ${direction}. Must be VCC-CLARK or LAFARGE`);
        this.name = 'InvalidDirectionError';
    }
}

/**
 * Thrown when commuter has too many active deliveries
 */
export class TooManyActiveDeliveriesError extends ConflictError {
    constructor(current: number, max: number) {
        super(`Too many active deliveries. Current: ${current}, Max: ${max}`);
        this.name = 'TooManyActiveDeliveriesError';
    }
}

/**
 * Thrown when commuter update fails
 */
export class CommuterUpdateFailedError extends BaseDBError {
    constructor(operation: string = 'update') {
        super(operation, 'Commuter update failed');
        this.name = 'CommuterUpdateFailedError';
    }
}
