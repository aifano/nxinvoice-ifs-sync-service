import { Request, Response } from 'express';
import { IfsTableSynchronizationService } from '../services/ifs-table-synchronization-service';
import { IfsTableSynchronizationRequest, IfsTableSynchronizationResponse } from '../types/ifs-table-synchronization';
import { OrganizationContextJsonLogger } from '../utilities/organization-context-json-logger';
import { IfsTableSynchronizationResponseMessage, IfsTableSynchronizationErrorType } from '../types/ifs-table-synchronization-response-messages';

export class IfsTableSynchronizationController {

  constructor(
    private ifsTableSynchronizationService: IfsTableSynchronizationService,
    private organizationContextLogger: OrganizationContextJsonLogger
  ) {}

  async handleIfsTableSynchronizationRequest(httpRequest: Request, httpResponse: Response): Promise<void> {
    const ifsTableNameFromUrl = httpRequest.params.table;
    const organizationIdFromHeader = httpRequest.get('organizationId') || httpRequest.get('organization_id');
    const { action, data } = httpRequest.body;

    // Validate required organization_id header
    if (!organizationIdFromHeader || typeof organizationIdFromHeader !== 'string' || organizationIdFromHeader.trim() === '') {
      this.organizationContextLogger.logWarningWithOrganizationContext(
        'unknown',
        'IFS table synchronization request missing or invalid organization_id header',
        { receivedOrganizationId: organizationIdFromHeader, ifsTableName: ifsTableNameFromUrl }
      );
      httpResponse.status(400).json({ 
        status: IfsTableSynchronizationResponseMessage.ORGANIZATION_ID_REQUIRED,
        success: false,
        error_type: IfsTableSynchronizationErrorType.ORGANIZATION_ID_MISSING
      });
      return;
    }

    this.organizationContextLogger.logInformationWithOrganizationContext(
      organizationIdFromHeader,
      'Received IFS table synchronization request',
      { 
        ifsTableName: ifsTableNameFromUrl,
        synchronizationAction: action,
        requestMethod: httpRequest.method,
        requestUrl: httpRequest.url
      }
    );

    try {
      const synchronizationRequestWithOrganizationId: IfsTableSynchronizationRequest = {
        action,
        organization_id: organizationIdFromHeader,
        data
      };
      
      const synchronizationResult = await this.ifsTableSynchronizationService.synchronizeIfsTableData(
        ifsTableNameFromUrl,
        synchronizationRequestWithOrganizationId
      );

      const synchronizationResponse: IfsTableSynchronizationResponse = { 
        status: synchronizationResult.message,
        success: synchronizationResult.success,
        error_type: synchronizationResult.error_type
      };
      
      this.organizationContextLogger.logInformationWithOrganizationContext(
        organizationIdFromHeader,
        'IFS table synchronization request completed successfully',
        { 
          ifsTableName: ifsTableNameFromUrl,
          synchronizationAction: action,
          responseStatus: synchronizationResult.status,
          responseMessage: synchronizationResult.message
        }
      );

      httpResponse.status(synchronizationResult.status).json(synchronizationResponse);
    } catch (synchronizationControllerError) {
      this.organizationContextLogger.logErrorWithOrganizationContext(
        organizationIdFromHeader,
        'IFS table synchronization controller encountered an error',
        synchronizationControllerError as Error,
        { 
          ifsTableName: ifsTableNameFromUrl,
          synchronizationAction: action,
          requestMethod: httpRequest.method,
          requestUrl: httpRequest.url
        }
      );
      
      httpResponse.status(500).json({ 
        status: IfsTableSynchronizationResponseMessage.INTERNAL_SERVER_ERROR,
        success: false,
        error_type: IfsTableSynchronizationErrorType.UNKNOWN_ERROR
      });
    }
  }
}