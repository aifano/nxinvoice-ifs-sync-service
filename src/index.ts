import express from 'express';
import { PORT } from './utilities/config';
import { prisma } from './utilities/prisma';
import { IfsTableSynchronizationService } from './services/ifs-table-synchronization-service';
import { IfsTableSynchronizationController } from './controllers/sync';
import { OrganizationContextJsonLogger } from './utilities/organization-context-json-logger';
import { IfsTableSqlAuditLogger } from './utilities/ifs-table-sql-audit-logger';
import { IfsTableSynchronizationResponseMessage, IfsTableSynchronizationErrorType } from './types/ifs-table-synchronization-response-messages';

const app = express();

// Initialize dependencies
const organizationContextLogger = new OrganizationContextJsonLogger();
const sqlAuditLogger = new IfsTableSqlAuditLogger(organizationContextLogger);

// Initialize services with proper dependency injection
const ifsTableSynchronizationService = new IfsTableSynchronizationService(
    prisma,
    organizationContextLogger,
    sqlAuditLogger
);
const ifsTableSynchronizationController = new IfsTableSynchronizationController(
    ifsTableSynchronizationService,
    organizationContextLogger
);

app.use(express.json({
    verify: (req, _res, buf) => {
        (req as any).rawBody = buf.toString('utf8');
    }
}));

const jsonParsingErrorHandler: express.ErrorRequestHandler = (jsonParsingError, httpRequest, httpResponse, next) => {
    if (jsonParsingError instanceof SyntaxError && 'body' in jsonParsingError) {
        organizationContextLogger.logErrorWithOrganizationContext(
            'unknown',
            'Invalid JSON payload received in HTTP request',
            jsonParsingError,
            { 
                requestMethod: httpRequest.method,
                requestUrl: httpRequest.url,
                rawRequestBody: (httpRequest as any).rawBody
            }
        );
        httpResponse.status(400).json({ 
          error: IfsTableSynchronizationResponseMessage.INVALID_JSON_PAYLOAD,
          success: false,
          error_type: IfsTableSynchronizationErrorType.MALFORMED_JSON
        });
        return;
    }
    next();
};
app.use(jsonParsingErrorHandler);

// Single IFS table synchronization endpoint
app.post('/ifs-sync/v1/:table', (httpRequest, httpResponse) => 
    ifsTableSynchronizationController.handleIfsTableSynchronizationRequest(httpRequest, httpResponse)
);

app.listen(PORT, () => {
    organizationContextLogger.logInformationWithOrganizationContext(
        'system',
        'IFS Table Synchronization Service started successfully',
        { 
            serverPort: PORT,
            supportedIfsTableNames: ifsTableSynchronizationService.getSupportedIfsTableNames(),
            numberOfSupportedTables: ifsTableSynchronizationService.getNumberOfSupportedIfsTableNames()
        }
    );
});
