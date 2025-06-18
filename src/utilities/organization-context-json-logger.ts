export interface OrganizationContextLogEntry {
  timestamp: string;
  organizationId: string;
  level: 'info' | 'warn' | 'error' | 'debug';
  message: string;
  context?: Record<string, any>;
  error?: {
    name: string;
    message: string;
    stack?: string;
  };
}

export class OrganizationContextJsonLogger {
  
  logInformationWithOrganizationContext(
    organizationId: string,
    informationMessage: string,
    additionalContext?: Record<string, any>
  ): void {
    this.writeLogEntryToConsole('info', organizationId, informationMessage, additionalContext);
  }

  logWarningWithOrganizationContext(
    organizationId: string,
    warningMessage: string,
    additionalContext?: Record<string, any>
  ): void {
    this.writeLogEntryToConsole('warn', organizationId, warningMessage, additionalContext);
  }

  logErrorWithOrganizationContext(
    organizationId: string,
    errorMessage: string,
    errorObject?: Error,
    additionalContext?: Record<string, any>
  ): void {
    const logEntry: OrganizationContextLogEntry = {
      timestamp: new Date().toISOString(),
      organizationId: organizationId,
      level: 'error',
      message: errorMessage,
      context: additionalContext,
      error: errorObject ? {
        name: errorObject.name,
        message: errorObject.message,
        stack: errorObject.stack,
      } : undefined,
    };

    console.error(JSON.stringify(logEntry, null, 0));
  }

  logDebugInformationWithOrganizationContext(
    organizationId: string,
    debugMessage: string,
    additionalContext?: Record<string, any>
  ): void {
    this.writeLogEntryToConsole('debug', organizationId, debugMessage, additionalContext);
  }

  private writeLogEntryToConsole(
    logLevel: 'info' | 'warn' | 'error' | 'debug',
    organizationId: string,
    logMessage: string,
    additionalContext?: Record<string, any>
  ): void {
    const logEntry: OrganizationContextLogEntry = {
      timestamp: new Date().toISOString(),
      organizationId: organizationId,
      level: logLevel,
      message: logMessage,
      context: additionalContext,
    };

    const jsonLogOutput = JSON.stringify(logEntry, null, 0);

    switch (logLevel) {
      case 'info':
        console.info(jsonLogOutput);
        break;
      case 'warn':
        console.warn(jsonLogOutput);
        break;
      case 'error':
        console.error(jsonLogOutput);
        break;
      case 'debug':
        console.debug(jsonLogOutput);
        break;
    }
  }
}