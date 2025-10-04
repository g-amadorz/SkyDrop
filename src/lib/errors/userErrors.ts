/**
 * Base error class for all user-related errors
 */
export abstract class UserError extends Error {
    abstract statusCode: number;
    abstract isOperational: boolean;

    constructor(message: string) {
        super(message);
        Object.setPrototypeOf(this, new.target.prototype);
        Error.captureStackTrace(this);
    }
}

/**
 * Client errors - Invalid input or business logic violations (4xx)
 */
export class ClientError extends UserError {
    statusCode = 400;
    isOperational = true;
}

/**
 * Server errors - System failures, database issues, etc. (5xx)
 */
export class ServerError extends UserError {
    statusCode = 500;
    isOperational = true;
}

// ============================================
// Client Error Types (Invalid Input)
// ============================================

/**
 * Thrown when attempting to toggle role for an admin user
 */
export class AdminRoleToggleError extends ClientError {
    statusCode = 403;

    constructor() {
        super('Cannot toggle role for admin users');
        this.name = 'AdminRoleToggleError';
    }
}

/**
 * Thrown when the new role is the same as the current role
 */
export class RoleAlreadySetError extends ClientError {
    statusCode = 400;

    constructor(role: string) {
        super(`User is already a ${role}`);
        this.name = 'RoleAlreadySetError';
    }
}

/**
 * Thrown when attempting to toggle to an invalid role
 */
export class InvalidRoleError extends ClientError {
    statusCode = 400;

    constructor() {
        super('Can only toggle between rider and sender roles');
        this.name = 'InvalidRoleError';
    }
}

/**
 * Thrown when a user is not found
 */
export class UserNotFoundError extends ClientError {
    statusCode = 404;

    constructor(userId?: string) {
        super(userId ? `User with ID ${userId} not found` : 'User not found');
        this.name = 'UserNotFoundError';
    }
}

// ============================================
// Server Error Types (System Failures)
// ============================================

/**
 * Thrown when the database fails to update the user role
 */
export class RoleUpdateFailedError extends ServerError {
    statusCode = 500;

    constructor() {
        super('Failed to update user role due to a server error');
        this.name = 'RoleUpdateFailedError';
    }
}

/**
 * Thrown when there's a database connection or query error
 */
export class DatabaseError extends ServerError {
    statusCode = 500;

    constructor(message: string = 'Database operation failed') {
        super(message);
        this.name = 'DatabaseError';
    }
}
