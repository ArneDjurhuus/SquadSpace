/**
 * Structured error handling for SquadSpace
 * Provides consistent error types, codes, and response formats
 */

// ============================================================================
// Error Codes
// ============================================================================

export enum ErrorCode {
  // Authentication & Authorization
  AUTH_INVALID_CREDENTIALS = 'AUTH_INVALID_CREDENTIALS',
  AUTH_USER_EXISTS = 'AUTH_USER_EXISTS',
  AUTH_UNAUTHORIZED = 'AUTH_UNAUTHORIZED',
  AUTH_SESSION_EXPIRED = 'AUTH_SESSION_EXPIRED',
  AUTH_WEAK_PASSWORD = 'AUTH_WEAK_PASSWORD',
  AUTH_RATE_LIMITED = 'AUTH_RATE_LIMITED',

  // Validation
  VALIDATION_FAILED = 'VALIDATION_FAILED',
  VALIDATION_INVALID_INPUT = 'VALIDATION_INVALID_INPUT',
  VALIDATION_MISSING_FIELD = 'VALIDATION_MISSING_FIELD',

  // Resources
  RESOURCE_NOT_FOUND = 'RESOURCE_NOT_FOUND',
  RESOURCE_ALREADY_EXISTS = 'RESOURCE_ALREADY_EXISTS',
  RESOURCE_CONFLICT = 'RESOURCE_CONFLICT',

  // Permissions
  PERMISSION_DENIED = 'PERMISSION_DENIED',
  SQUAD_FULL = 'SQUAD_FULL',
  SQUAD_PRIVATE = 'SQUAD_PRIVATE',
  NOT_SQUAD_MEMBER = 'NOT_SQUAD_MEMBER',

  // Capacity & Limits
  EVENT_FULL = 'EVENT_FULL',
  LFG_FULL = 'LFG_FULL',
  TOURNAMENT_FULL = 'TOURNAMENT_FULL',
  REGISTRATION_CLOSED = 'REGISTRATION_CLOSED',

  // Database & Server
  DATABASE_ERROR = 'DATABASE_ERROR',
  SERVER_ERROR = 'SERVER_ERROR',
  TRANSACTION_FAILED = 'TRANSACTION_FAILED',

  // External Services
  STORAGE_ERROR = 'STORAGE_ERROR',
  UPLOAD_FAILED = 'UPLOAD_FAILED',

  // Generic
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
}

// ============================================================================
// Error Messages
// ============================================================================

export const ErrorMessages: Record<ErrorCode, string> = {
  [ErrorCode.AUTH_INVALID_CREDENTIALS]: 'Invalid email or password',
  [ErrorCode.AUTH_USER_EXISTS]: 'An account with this email already exists',
  [ErrorCode.AUTH_UNAUTHORIZED]: 'You must be logged in to perform this action',
  [ErrorCode.AUTH_SESSION_EXPIRED]: 'Your session has expired. Please log in again',
  [ErrorCode.AUTH_WEAK_PASSWORD]: 'Password does not meet security requirements',
  [ErrorCode.AUTH_RATE_LIMITED]: 'Too many attempts. Please try again later',

  [ErrorCode.VALIDATION_FAILED]: 'Validation failed',
  [ErrorCode.VALIDATION_INVALID_INPUT]: 'Invalid input provided',
  [ErrorCode.VALIDATION_MISSING_FIELD]: 'Required field is missing',

  [ErrorCode.RESOURCE_NOT_FOUND]: 'Resource not found',
  [ErrorCode.RESOURCE_ALREADY_EXISTS]: 'Resource already exists',
  [ErrorCode.RESOURCE_CONFLICT]: 'Resource conflict occurred',

  [ErrorCode.PERMISSION_DENIED]: 'You do not have permission to perform this action',
  [ErrorCode.SQUAD_FULL]: 'This squad has reached its member limit',
  [ErrorCode.SQUAD_PRIVATE]: 'This squad is private and requires an invite',
  [ErrorCode.NOT_SQUAD_MEMBER]: 'You must be a member of this squad',

  [ErrorCode.EVENT_FULL]: 'This event has reached its participant limit',
  [ErrorCode.LFG_FULL]: 'This group has reached its player limit',
  [ErrorCode.TOURNAMENT_FULL]: 'This tournament has reached its team limit',
  [ErrorCode.REGISTRATION_CLOSED]: 'Registration for this event has closed',

  [ErrorCode.DATABASE_ERROR]: 'A database error occurred',
  [ErrorCode.SERVER_ERROR]: 'An internal server error occurred',
  [ErrorCode.TRANSACTION_FAILED]: 'Transaction failed',

  [ErrorCode.STORAGE_ERROR]: 'Storage operation failed',
  [ErrorCode.UPLOAD_FAILED]: 'File upload failed',

  [ErrorCode.UNKNOWN_ERROR]: 'An unknown error occurred',
};

// ============================================================================
// Error Classes
// ============================================================================

export class AppError extends Error {
  constructor(
    public code: ErrorCode,
    message?: string,
    public details?: Record<string, unknown>
  ) {
    super(message || ErrorMessages[code]);
    this.name = 'AppError';
  }
}

export class ValidationError extends AppError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(ErrorCode.VALIDATION_FAILED, message, details);
    this.name = 'ValidationError';
  }
}

export class AuthError extends AppError {
  constructor(code: ErrorCode, message?: string) {
    super(code, message);
    this.name = 'AuthError';
  }
}

export class DatabaseError extends AppError {
  constructor(message?: string, details?: Record<string, unknown>) {
    super(ErrorCode.DATABASE_ERROR, message, details);
    this.name = 'DatabaseError';
  }
}

// ============================================================================
// Response Types
// ============================================================================

export type SuccessResponse<T = unknown> = {
  success: true;
  data: T;
};

export type ErrorResponse = {
  success: false;
  error: {
    code: ErrorCode;
    message: string;
    details?: Record<string, unknown>;
  };
};

export type ActionResponse<T = unknown> = SuccessResponse<T> | ErrorResponse;

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Creates a success response
 */
export function successResponse<T>(data: T): SuccessResponse<T> {
  return {
    success: true,
    data,
  };
}

/**
 * Creates an error response
 */
export function errorResponse(
  code: ErrorCode,
  message?: string,
  details?: Record<string, unknown>
): ErrorResponse {
  return {
    success: false,
    error: {
      code,
      message: message || ErrorMessages[code],
      details,
    },
  };
}

/**
 * Creates an error response from an AppError
 */
export function fromAppError(error: AppError): ErrorResponse {
  return errorResponse(error.code, error.message, error.details);
}

/**
 * Creates an error response from a Zod validation error
 */
export function fromValidationError(error: unknown): ErrorResponse {
  const details: Record<string, string> = {};
  
  if (error && typeof error === 'object' && 'errors' in error && Array.isArray(error.errors)) {
    error.errors.forEach((err: unknown) => {
      if (err && typeof err === 'object' && 'path' in err && 'message' in err) {
        const errObj = err as { path: string[]; message: string };
        const path = errObj.path.join('.');
        details[path] = errObj.message;
      }
    });
  }

  return errorResponse(
    ErrorCode.VALIDATION_FAILED,
    'Validation failed. Please check your input.',
    details
  );
}

/**
 * Creates an error response from a Supabase error
 */
export function fromSupabaseError(error: unknown): ErrorResponse {
  if (!error || typeof error !== 'object') {
    return errorResponse(ErrorCode.DATABASE_ERROR);
  }

  const err = error as { code?: string; message?: string };
  
  // Map common Supabase error codes
  if (err.code === '23505') {
    // Unique constraint violation
    return errorResponse(ErrorCode.RESOURCE_ALREADY_EXISTS);
  }
  
  if (err.code === '23503') {
    // Foreign key violation
    return errorResponse(ErrorCode.RESOURCE_NOT_FOUND);
  }

  if (err.code === 'PGRST116') {
    // Row not found
    return errorResponse(ErrorCode.RESOURCE_NOT_FOUND);
  }

  if (err.message?.includes('JWT')) {
    return errorResponse(ErrorCode.AUTH_SESSION_EXPIRED);
  }

  // Generic database error
  return errorResponse(
    ErrorCode.DATABASE_ERROR,
    'A database error occurred',
    { originalError: err.message || 'Unknown error' }
  );
}

/**
 * Handles errors in server actions
 */
export function handleActionError(error: unknown): ErrorResponse {
  // AppError instances
  if (error instanceof AppError) {
    return fromAppError(error);
  }

  // Zod validation errors
  if (error && typeof error === 'object' && 'errors' in error) {
    return fromValidationError(error);
  }

  // Supabase errors
  if (error && typeof error === 'object' && 'code' in error) {
    return fromSupabaseError(error);
  }

  // Generic errors
  if (error instanceof Error) {
    return errorResponse(ErrorCode.UNKNOWN_ERROR, error.message);
  }

  // Unknown error type
  return errorResponse(ErrorCode.UNKNOWN_ERROR);
}

/**
 * Type guard to check if a response is an error
 */
export function isErrorResponse(response: ActionResponse): response is ErrorResponse {
  return response.success === false;
}

/**
 * Type guard to check if a response is successful
 */
export function isSuccessResponse<T>(response: ActionResponse<T>): response is SuccessResponse<T> {
  return response.success === true;
}
