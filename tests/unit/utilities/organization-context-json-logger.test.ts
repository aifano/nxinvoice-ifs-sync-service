import { OrganizationContextJsonLogger } from '../../../src/utilities/organization-context-json-logger';

describe('OrganizationContextJsonLogger', () => {
  let logger: OrganizationContextJsonLogger;
  let consoleSpy: jest.SpyInstance;

  beforeEach(() => {
    logger = new OrganizationContextJsonLogger();
    consoleSpy = jest.spyOn(console, 'info').mockImplementation();
  });

  afterEach(() => {
    consoleSpy.mockRestore();
  });

  describe('logInformationWithOrganizationContext', () => {
    it('should log information message with organization context', () => {
      const organizationId = 'test_org_123';
      const message = 'Test information message';
      const context = { testKey: 'testValue' };

      logger.logInformationWithOrganizationContext(organizationId, message, context);

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringMatching(/"level":"info"/)
      );
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringMatching(/"organizationId":"test_org_123"/)
      );
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringMatching(/"message":"Test information message"/)
      );
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringMatching(/"testKey":"testValue"/)
      );
    });

    it('should log information message without additional context', () => {
      const organizationId = 'test_org_456';
      const message = 'Simple info message';

      logger.logInformationWithOrganizationContext(organizationId, message);

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringMatching(/"level":"info"/)
      );
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringMatching(/"organizationId":"test_org_456"/)
      );
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringMatching(/"message":"Simple info message"/)
      );
    });
  });

  describe('logWarningWithOrganizationContext', () => {
    it('should log warning message with organization context', () => {
      const warnSpy = jest.spyOn(console, 'warn').mockImplementation();
      
      const organizationId = 'test_org_789';
      const message = 'Test warning message';
      const context = { warningType: 'validation' };

      logger.logWarningWithOrganizationContext(organizationId, message, context);

      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringMatching(/"level":"warn"/)
      );
      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringMatching(/"organizationId":"test_org_789"/)
      );
      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringMatching(/"message":"Test warning message"/)
      );
      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringMatching(/"warningType":"validation"/)
      );

      warnSpy.mockRestore();
    });
  });

  describe('logErrorWithOrganizationContext', () => {
    it('should log error message with error object and organization context', () => {
      const errorSpy = jest.spyOn(console, 'error').mockImplementation();
      
      const organizationId = 'test_org_error';
      const message = 'Test error message';
      const error = new Error('Test error details');
      const context = { errorType: 'database' };

      logger.logErrorWithOrganizationContext(organizationId, message, error, context);

      expect(errorSpy).toHaveBeenCalledWith(
        expect.stringMatching(/"level":"error"/)
      );
      expect(errorSpy).toHaveBeenCalledWith(
        expect.stringMatching(/"organizationId":"test_org_error"/)
      );
      expect(errorSpy).toHaveBeenCalledWith(
        expect.stringMatching(/"message":"Test error message"/)
      );
      expect(errorSpy).toHaveBeenCalledWith(
        expect.stringMatching(/"errorType":"database"/)
      );
      expect(errorSpy).toHaveBeenCalledWith(
        expect.stringMatching(/"error":{"name":"Error","message":"Test error details"/)
      );

      errorSpy.mockRestore();
    });

    it('should log error message without error object', () => {
      const errorSpy = jest.spyOn(console, 'error').mockImplementation();
      
      const organizationId = 'test_org_simple_error';
      const message = 'Simple error message';

      logger.logErrorWithOrganizationContext(organizationId, message);

      expect(errorSpy).toHaveBeenCalledWith(
        expect.stringMatching(/"level":"error"/)
      );
      expect(errorSpy).toHaveBeenCalledWith(
        expect.stringMatching(/"organizationId":"test_org_simple_error"/)
      );
      expect(errorSpy).toHaveBeenCalledWith(
        expect.stringMatching(/"message":"Simple error message"/)
      );

      errorSpy.mockRestore();
    });
  });

  describe('logDebugInformationWithOrganizationContext', () => {
    it('should log debug message with organization context', () => {
      const debugSpy = jest.spyOn(console, 'debug').mockImplementation();
      
      const organizationId = 'test_org_debug';
      const message = 'Test debug message';
      const context = { debugLevel: 'verbose' };

      logger.logDebugInformationWithOrganizationContext(organizationId, message, context);

      expect(debugSpy).toHaveBeenCalledWith(
        expect.stringMatching(/"level":"debug"/)
      );
      expect(debugSpy).toHaveBeenCalledWith(
        expect.stringMatching(/"organizationId":"test_org_debug"/)
      );
      expect(debugSpy).toHaveBeenCalledWith(
        expect.stringMatching(/"message":"Test debug message"/)
      );
      expect(debugSpy).toHaveBeenCalledWith(
        expect.stringMatching(/"debugLevel":"verbose"/)
      );

      debugSpy.mockRestore();
    });
  });

  describe('JSON format validation', () => {
    it('should produce valid JSON output', () => {
      logger.logInformationWithOrganizationContext(
        'test_org',
        'Test message',
        { testKey: 'testValue' }
      );

      const loggedJson = consoleSpy.mock.calls[0][0];
      
      // Should not throw when parsing
      expect(() => JSON.parse(loggedJson)).not.toThrow();
      
      const parsedLog = JSON.parse(loggedJson);
      expect(parsedLog).toHaveProperty('timestamp');
      expect(parsedLog).toHaveProperty('organizationId', 'test_org');
      expect(parsedLog).toHaveProperty('level', 'info');
      expect(parsedLog).toHaveProperty('message', 'Test message');
      expect(parsedLog).toHaveProperty('context.testKey', 'testValue');
    });

    it('should handle special characters in messages and context', () => {
      const specialMessage = 'Message with "quotes" and \n newlines \t tabs';
      const specialContext = { 
        special: 'Value with äöü and 💡 emoji',
        nested: { deep: 'value' }
      };

      logger.logInformationWithOrganizationContext(
        'test_org',
        specialMessage,
        specialContext
      );

      const loggedJson = consoleSpy.mock.calls[0][0];
      expect(() => JSON.parse(loggedJson)).not.toThrow();
      
      const parsedLog = JSON.parse(loggedJson);
      expect(parsedLog.message).toBe(specialMessage);
      expect(parsedLog.context.special).toBe('Value with äöü and 💡 emoji');
      expect(parsedLog.context.nested.deep).toBe('value');
    });
  });

  describe('timestamp validation', () => {
    it('should include valid ISO timestamp', () => {
      const beforeTime = Date.now();
      
      logger.logInformationWithOrganizationContext('test_org', 'Test message');
      
      const afterTime = Date.now();
      const loggedJson = consoleSpy.mock.calls[0][0];
      const parsedLog = JSON.parse(loggedJson);
      
      expect(parsedLog.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
      
      const logTime = new Date(parsedLog.timestamp).getTime();
      expect(logTime).toBeGreaterThanOrEqual(beforeTime);
      expect(logTime).toBeLessThanOrEqual(afterTime);
    });
  });
});