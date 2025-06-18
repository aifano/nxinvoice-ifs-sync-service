import { Prisma } from '@prisma/client';
import { IfsTableSynchronizationResult } from '../types/ifs-table-synchronization';
import { IfsTableSynchronizationResponseMessage, IfsTableSynchronizationErrorType } from '../types/ifs-table-synchronization-response-messages';

export function mapPrismaErrorToSynchronizationResult(prismaError: unknown): IfsTableSynchronizationResult {
  if (prismaError instanceof Prisma.PrismaClientKnownRequestError) {
    switch (prismaError.code) {
      case 'P2025':
        // Record not found - Business logic error, no retry needed
        return { 
          status: 200, 
          message: IfsTableSynchronizationResponseMessage.RECORD_NOT_FOUND,
          success: false,
          error_type: IfsTableSynchronizationErrorType.RECORD_NOT_FOUND
        };
      case 'P2002':
        // Duplicate record - Business logic error, no retry needed
        return { 
          status: 200, 
          message: IfsTableSynchronizationResponseMessage.DUPLICATE_RECORD_VIOLATION,
          success: false,
          error_type: IfsTableSynchronizationErrorType.DUPLICATE_RECORD
        };
      case 'P2003':
        // Foreign key violation - Could be resolved with retry if referenced record is created
        return { 
          status: 409, 
          message: IfsTableSynchronizationResponseMessage.FOREIGN_KEY_CONSTRAINT_VIOLATION,
          success: false,
          error_type: IfsTableSynchronizationErrorType.FOREIGN_KEY_VIOLATION
        };
      default:
        return { 
          status: 400, 
          message: IfsTableSynchronizationResponseMessage.DATABASE_OPERATION_VALIDATION_FAILED,
          success: false,
          error_type: IfsTableSynchronizationErrorType.INVALID_REQUEST_DATA
        };
    }
  }

  if (prismaError instanceof Prisma.PrismaClientValidationError) {
    // Schema validation - Technical error, could be retry-worthy
    return { 
      status: 422, 
      message: IfsTableSynchronizationResponseMessage.DATABASE_SCHEMA_VALIDATION_FAILED,
      success: false,
      error_type: IfsTableSynchronizationErrorType.DATABASE_SCHEMA_ERROR
    };
  }

  if (prismaError instanceof Prisma.PrismaClientInitializationError || 
      prismaError instanceof Prisma.PrismaClientRustPanicError) {
    // Connection errors - Definitely retry-worthy
    return { 
      status: 500, 
      message: IfsTableSynchronizationResponseMessage.DATABASE_CONNECTION_INITIALIZATION_FAILED,
      success: false,
      error_type: IfsTableSynchronizationErrorType.DATABASE_CONNECTION_ERROR
    };
  }

  // Unknown errors - Retry-worthy as they might be temporary
  return { 
    status: 500, 
    message: IfsTableSynchronizationResponseMessage.UNKNOWN_DATABASE_OPERATION_ERROR,
    success: false,
    error_type: IfsTableSynchronizationErrorType.UNKNOWN_ERROR
  };
}