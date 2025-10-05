/**
 * User-specific errors
 * Re-exports generic errors from AppError for backward compatibility
 * and provides user-specific error classes
 */

import {
    NotFoundError,
    AlreadyExistsError,
    ForbiddenError,
    ValidationError,
    DatabaseError as BaseDBError,
    InsufficientResourceError,
    ConflictError,
} from './AppError';

// ============================================
// User-Specific Error Types
// ============================================

/**
 * Thrown when a user is not found
 */
export class UserNotFoundError extends NotFoundError {
    constructor(userId?: string) {
        super('User', userId);
        this.name = 'UserNotFoundError';
    }
}

/**
 * Thrown when a user already exists
 */
export class UserAlreadyExistsError extends AlreadyExistsError {
    constructor(email: string) {
        super('User', 'email', email);
        this.name = 'UserAlreadyExistsError';
    }
}

/**
 * Thrown when attempting to toggle role for an admin user
 */
export class AdminRoleToggleError extends ForbiddenError {
    constructor() {
        super('Cannot toggle role for admin users');
        this.name = 'AdminRoleToggleError';
    }
}

/**
 * Thrown when the new role is the same as the current role
 */
export class RoleAlreadySetError extends ConflictError {
    constructor(role: string) {
        super(`User is already a ${role}`);
        this.name = 'RoleAlreadySetError';
    }
}

/**
 * Thrown when attempting to toggle to an invalid role
 */
export class InvalidRoleError extends ValidationError {
    constructor() {
        super('Can only toggle between rider and sender roles');
        this.name = 'InvalidRoleError';
    }
}

/**
 * Thrown when user has insufficient points
 */
export class InsufficientPointsError extends InsufficientResourceError {
    constructor(required: number, available: number) {
        super('points', required, available);
        this.name = 'InsufficientPointsError';
    }
}

/**
 * Thrown when invalid credentials are provided
 */
export class InvalidCredentialsError extends ValidationError {
    constructor() {
        super('Invalid email or password');
        this.name = 'InvalidCredentialsError';
    }
}

/**
 * Thrown when the database fails to update the user
 */
export class UserUpdateFailedError extends BaseDBError {
    constructor(operation: string = 'update') {
        super(operation, 'User update failed');
        this.name = 'UserUpdateFailedError';
    }
}
