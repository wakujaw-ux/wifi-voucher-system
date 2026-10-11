
// ==========================================================
// BASE ERROR CLASS
// ==========================================================
class AppError extends Error {
    constructor(message, code, statusCode = 500) {
        super(message);
        this.name = this.constructor.name;
        this.code = code;
        this.status = statusCode;
        Error.captureStackTrace(this, this.constructor);
    }
}

// ==============================================================
// 400 - BAD REQUEST
// ==============================================================
class ValidationError extends AppError {
    constructor(message = 'Data si sahihi', code = 'VALIDATION_ERROR') {
        super(message, code, 400);
    }
}

// ===================================================================
// 401 - UNAUTHORIZED
// ===================================================================
class AuthError extends AppError {
    constructor(message = 'Haujaingia', code = 'UNAUTHORIZED') {
        super(message, code, 401);
    }
}

// ================================================================
// 403 - FORBIDDEN
// ================================================================
class ForbiddenError extends AppError {
    constructor(message = 'Hauna ruhusa', code = 'FORBIDDEN') {
        super(message, code, 403);
    }
}

// ===============================================================
// 404 - NOT FOUND
// ===============================================================
class NotFoundError extends AppError {
    constructor(message = 'Rasilimali haipo', code = 'NOT_FOUND') {
        super(message, code, 404);
    }
}

// ==============================================================
// 409 - CONFLICT
// ==============================================================
class ConflictError extends AppError {
    constructor(message = 'Kuna mgongano', code = 'CONFLICT') {
        super(message, code, 409);
    }
}

// ============================================================
// 500 - INTERNAL
// ============================================================
class InternalError extends AppError {
    constructor(message = 'Hitilafu ya ndani', code = 'INTERNAL_ERROR') {
        super(message, code, 500);
    }
}

// ============================================================
// 503 - SERVICE UNAVAILABLE
// ===========================================================
class ServiceUnavailableError extends AppError {
    constructor(message = 'Huduma haipatikani', code = 'SERVICE_UNAVAILABLE') {
        super(message, code, 503);
    }
}

module.exports = {
    AppError, ValidationError, AuthError, ForbiddenError, NotFoundError, ConflictError, InternalError, ServiceUnavailableError,
};