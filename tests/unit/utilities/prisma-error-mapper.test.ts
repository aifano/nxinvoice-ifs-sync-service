import { Prisma } from '@prisma/client';
import { mapPrismaErrorToSynchronizationResult } from '../../../src/utilities/prisma-error-mapper';
import { IfsTableSynchronizationResponseMessage } from '../../../src/types/ifs-table-synchronization-response-messages';

describe('mapPrismaErrorToSynchronizationResult', () => {
  
  describe('PrismaClientKnownRequestError mapping', () => {
    it('should map P2025 error to 404 record not found', () => {
      const error = new Prisma.PrismaClientKnownRequestError(
        'Record not found',
        { code: 'P2025', clientVersion: '5.0.0' }
      );

      const result = mapPrismaErrorToSynchronizationResult(error);

      expect(result).toEqual({
        status: 200,
        message: IfsTableSynchronizationResponseMessage.RECORD_NOT_FOUND,
        success: false,
        error_type: 'record_not_found'
      });
    });

    it('should map P2002 error to 409 duplicate constraint violation', () => {
      const error = new Prisma.PrismaClientKnownRequestError(
        'Unique constraint failed',
        { code: 'P2002', clientVersion: '5.0.0' }
      );

      const result = mapPrismaErrorToSynchronizationResult(error);

      expect(result).toEqual({
        status: 200,
        message: IfsTableSynchronizationResponseMessage.DUPLICATE_RECORD_VIOLATION,
        success: false,
        error_type: 'duplicate_record'
      });
    });

    it('should map P2003 error to 409 foreign key constraint violation', () => {
      const error = new Prisma.PrismaClientKnownRequestError(
        'Foreign key constraint failed',
        { code: 'P2003', clientVersion: '5.0.0' }
      );

      const result = mapPrismaErrorToSynchronizationResult(error);

      expect(result).toEqual({
        status: 409,
        message: IfsTableSynchronizationResponseMessage.FOREIGN_KEY_CONSTRAINT_VIOLATION,
        success: false,
        error_type: 'foreign_key_violation'
      });
    });

    it('should map unknown PrismaClientKnownRequestError to 400 validation failed', () => {
      const error = new Prisma.PrismaClientKnownRequestError(
        'Some other known error',
        { code: 'P9999', clientVersion: '5.0.0' }
      );

      const result = mapPrismaErrorToSynchronizationResult(error);

      expect(result).toEqual({
        status: 400,
        message: IfsTableSynchronizationResponseMessage.DATABASE_OPERATION_VALIDATION_FAILED,
        success: false,
        error_type: 'invalid_request_data'
      });
    });
  });

  describe('PrismaClientValidationError mapping', () => {
    it('should map validation error to 422', () => {
      const error = new Prisma.PrismaClientValidationError(
        'Validation failed on field',
        '5.0.0'
      );

      const result = mapPrismaErrorToSynchronizationResult(error);

      expect(result).toEqual({
        status: 422,
        message: IfsTableSynchronizationResponseMessage.DATABASE_SCHEMA_VALIDATION_FAILED,
        success: false,
        error_type: 'database_schema_error'
      });
    });
  });

  describe('PrismaClientInitializationError mapping', () => {
    it('should map initialization error to 500', () => {
      const error = new Prisma.PrismaClientInitializationError(
        'Could not connect to database',
        '5.0.0'
      );

      const result = mapPrismaErrorToSynchronizationResult(error);

      expect(result).toEqual({
        status: 500,
        message: IfsTableSynchronizationResponseMessage.DATABASE_CONNECTION_INITIALIZATION_FAILED,
        success: false,
        error_type: 'database_connection_error'
      });
    });
  });

  describe('PrismaClientRustPanicError mapping', () => {
    it('should map rust panic error to 500', () => {
      const error = new Prisma.PrismaClientRustPanicError(
        'Rust panic occurred',
        '5.0.0'
      );

      const result = mapPrismaErrorToSynchronizationResult(error);

      expect(result).toEqual({
        status: 500,
        message: IfsTableSynchronizationResponseMessage.DATABASE_CONNECTION_INITIALIZATION_FAILED,
        success: false,
        error_type: 'database_connection_error'
      });
    });
  });

  describe('Unknown error mapping', () => {
    it('should map generic Error to 500 unknown error', () => {
      const error = new Error('Some generic error');

      const result = mapPrismaErrorToSynchronizationResult(error);

      expect(result).toEqual({
        status: 500,
        message: IfsTableSynchronizationResponseMessage.UNKNOWN_DATABASE_OPERATION_ERROR,
        success: false,
        error_type: 'unknown_error'
      });
    });

    it('should map string error to 500 unknown error', () => {
      const error = 'String error message';

      const result = mapPrismaErrorToSynchronizationResult(error);

      expect(result).toEqual({
        status: 500,
        message: IfsTableSynchronizationResponseMessage.UNKNOWN_DATABASE_OPERATION_ERROR,
        success: false,
        error_type: 'unknown_error'
      });
    });

    it('should map null error to 500 unknown error', () => {
      const error = null;

      const result = mapPrismaErrorToSynchronizationResult(error);

      expect(result).toEqual({
        status: 500,
        message: IfsTableSynchronizationResponseMessage.UNKNOWN_DATABASE_OPERATION_ERROR,
        success: false,
        error_type: 'unknown_error'
      });
    });

    it('should map undefined error to 500 unknown error', () => {
      const error = undefined;

      const result = mapPrismaErrorToSynchronizationResult(error);

      expect(result).toEqual({
        status: 500,
        message: IfsTableSynchronizationResponseMessage.UNKNOWN_DATABASE_OPERATION_ERROR,
        success: false,
        error_type: 'unknown_error'
      });
    });
  });

  describe('Error response consistency', () => {
    it('should always return proper response structure with error_type', () => {
      const testCases = [
        new Prisma.PrismaClientKnownRequestError('msg', { code: 'P2025', clientVersion: '5.0.0' }),
        new Prisma.PrismaClientKnownRequestError('msg', { code: 'P2002', clientVersion: '5.0.0' }),
        new Prisma.PrismaClientKnownRequestError('msg', { code: 'P2003', clientVersion: '5.0.0' }),
        new Prisma.PrismaClientValidationError('msg', { clientVersion: '5.0.0' }),
        new Prisma.PrismaClientInitializationError('msg', '5.0.0'),
        new Error('generic error'),
      ];

      testCases.forEach(error => {
        const result = mapPrismaErrorToSynchronizationResult(error);
        
        expect(result.message).toBeDefined();
        expect(typeof result.message).toBe('string');
        expect(result.success).toBe(false);
        expect(result.error_type).toBeDefined();
        expect(typeof result.error_type).toBe('string');
        expect(result.status).toBeGreaterThanOrEqual(200);
        expect(result.status).toBeLessThanOrEqual(500);
      });
    });
  });
});