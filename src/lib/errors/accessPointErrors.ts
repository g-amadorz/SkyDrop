/**
 * AccessPoint-specific errors
 */

import {
    NotFoundError,
    AlreadyExistsError,
    ValidationError,
    DatabaseError as BaseDBError,
} from './AppError';

// ============================================
// AccessPoint-Specific Error Types
// ============================================

/**
 * Thrown when an access point is not found
 */
export class AccessPointNotFoundError extends NotFoundError {
    constructor(accessPointId?: string) {
        super('Access Point', accessPointId);
        this.name = 'AccessPointNotFoundError';
    }
}

/**
 * Thrown when an access point already exists at a location
 */
export class AccessPointAlreadyExistsError extends AlreadyExistsError {
    constructor(location: string) {
        super('Access Point', 'location', location);
        this.name = 'AccessPointAlreadyExistsError';
    }
}

/**
 * Thrown when access point validation fails
 */
export class AccessPointValidationError extends ValidationError {
    constructor(message: string) {
        super(message);
        this.name = 'AccessPointValidationError';
    }
}

/**
 * Thrown when access point update fails
 */
export class AccessPointUpdateFailedError extends BaseDBError {
    constructor(operation: string = 'update') {
        super(operation, 'Access Point update failed');
        this.name = 'AccessPointUpdateFailedError';
    }
}
