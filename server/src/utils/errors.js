/**
 * Custom error classes for consistent API error responses
 */

class AppError extends Error {
  constructor(message, statusCode, code = 'INTERNAL_ERROR') {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

class NotFoundError extends AppError {
  constructor(resource = 'Resource') {
    super(`${resource} not found`, 404, 'NOT_FOUND');
  }
}

class ValidationError extends AppError {
  constructor(message = 'Validation failed', details = null) {
    super(message, 400, 'VALIDATION_ERROR');
    this.details = details;
  }
}

class BadRequestError extends AppError {
  constructor(message = 'Bad request', details = null) {
    super(message, 400, 'BAD_REQUEST');
    this.details = details;
  }
}

class AuthenticationError extends AppError {
  constructor(message = 'Authentication required') {
    super(message, 401, 'AUTH_ERROR');
  }
}

class AuthorizationError extends AppError {
  constructor(message = 'Insufficient permissions') {
    super(message, 403, 'FORBIDDEN');
  }
}

class ConflictError extends AppError {
  constructor(message = 'Resource already exists') {
    super(message, 409, 'CONFLICT');
  }
}

class DuplicateScanError extends AppError {
  constructor(studentName, groupName) {
    super(`${studentName} already scanned for ${groupName} today`, 409, 'DUPLICATE_SCAN');
  }
}

module.exports = {
  AppError,
  NotFoundError,
  ValidationError,
  BadRequestError,
  AuthenticationError,
  AuthorizationError,
  ConflictError,
  DuplicateScanError,
};
