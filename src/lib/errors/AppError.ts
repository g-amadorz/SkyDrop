/**
 * Base error class for all application errors
 */
export abstract class AppError extends Error {
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
export class ClientError extends AppError {
    statusCode = 400;
    isOperational = true;
}

/**
 * Server errors - System failures, database issues, etc. (5xx)
 */
export class ServerError extends AppError {
    statusCode = 500;
    isOperational = true;
}

// ============================================
// Generic Client Error Types (4xx)
// ============================================

/**
 * Resource not found (404)
 */
export class NotFoundError extends ClientError {
    statusCode = 404;

    constructor(resource: string, identifier?: string) {
        super(identifier ? `${resource} with ID ${identifier} not found` : `${resource} not found`);
        this.name = 'NotFoundError';
    }
}

/**
 * Resource already exists (409)
 */
export class AlreadyExistsError extends ClientError {
    statusCode = 409;

    constructor(resource: string, field?: string, value?: string) {
        const message = field && value 
            ? `${resource} with ${field} '${value}' already exists`
            : `${resource} already exists`;
        super(message);
        this.name = 'AlreadyExistsError';
    }
}

/**
 * Unauthorized access (401)
 */
export class UnauthorizedError extends ClientError {
    statusCode = 401;

    constructor(message: string = 'Authentication required') {
        super(message);
        this.name = 'UnauthorizedError';
    }
}

/**
 * Forbidden access (403)
 */
export class ForbiddenError extends ClientError {
    statusCode = 403;

    constructor(message: string = 'Access forbidden') {
        super(message);
        this.name = 'ForbiddenError';
    }
}

/**
 * Invalid input or validation error (400)
 */
export class ValidationError extends ClientError {
    statusCode = 400;

    constructor(message: string) {
        super(message);
        this.name = 'ValidationError';
    }
}

/**
 * Insufficient resources (e.g., points, credits) (400)
 */
export class InsufficientResourceError extends ClientError {
    statusCode = 400;

    constructor(resource: string, required?: number, available?: number) {
        const message = required !== undefined && available !== undefined
            ? `Insufficient ${resource}. Required: ${required}, Available: ${available}`
            : `Insufficient ${resource}`;
        super(message);
        this.name = 'InsufficientResourceError';
    }
}

/**
 * Conflict in business logic (409)
 */
export class ConflictError extends ClientError {
    statusCode = 409;

    constructor(message: string) {
        super(message);
        this.name = 'ConflictError';
    }
}

/**
 * Bad request - generic invalid input (400)
 */
export class BadRequestError extends ClientError {
    statusCode = 400;

    constructor(message: string) {
        super(message);
        this.name = 'BadRequestError';
    }
}

// ============================================
// Generic Server Error Types (5xx)
// ============================================

/**
 * Database operation failed (500)
 */
export class DatabaseError extends ServerError {
    statusCode = 500;

    constructor(operation?: string, details?: string) {
        const message = operation 
            ? `Database ${operation} failed${details ? `: ${details}` : ''}`
            : 'Database operation failed';
        super(message);
        this.name = 'DatabaseError';
    }
}

/**
 * External service failure (502)
 */
export class ExternalServiceError extends ServerError {
    statusCode = 502;

    constructor(service: string, details?: string) {
        super(`External service '${service}' failed${details ? `: ${details}` : ''}`);
        this.name = 'ExternalServiceError';
    }
}

/**
 * Internal server error (500)
 */
export class InternalServerError extends ServerError {
    statusCode = 500;

    constructor(message: string = 'Internal server error') {
        super(message);
        this.name = 'InternalServerError';
    }
}

/**
 * Service unavailable (503)
 */
export class ServiceUnavailableError extends ServerError {
    statusCode = 503;

    constructor(message: string = 'Service temporarily unavailable') {
        super(message);
        this.name = 'ServiceUnavailableError';
    }
}
