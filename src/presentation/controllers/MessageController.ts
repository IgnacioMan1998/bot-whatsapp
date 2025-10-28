import { Request, Response } from 'express';
import { injectable, inject } from 'inversify';
import { TYPES } from '@shared/constants';
import { Logger } from '@shared/utils/logger';
import { 
  GetMessageHistoryUseCase,
  GetMessageHistoryQuery 
} from '@application/index';
import { 
  GetMessageHistoryRequest,
  SearchMessagesRequest,
  ApiResponse,
  PaginatedApiResponse,
  MessageResponse 
} from '@presentation/dtos';
import { ValidationMiddleware, ValidationSchemas } from '@presentation/middleware';

export interface MessageController {
  getHistory(req: Request, res: Response): Promise<void>;
  search(req: Request, res: Response): Promise<void>;
  getStats(req: Request, res: Response): Promise<void>;
}

@injectable()
export class MessageControllerImpl implements MessageController {
  constructor(
    @inject(TYPES.GetMessageHistoryUseCase) private getMessageHistoryUseCase: GetMessageHistoryUseCase,
    @inject(TYPES.Logger) private logger: Logger
  ) {}

  async getHistory(req: Request, res: Response): Promise<void> {
    try {
      const request = req as GetMessageHistoryRequest;
      const { contactId } = request.params;
      const { limit = '50', offset = '0', fromDate, toDate } = request.query;

      // Validate parameters
      const validation = ValidationSchemas.uuid.validate(contactId);
      if (validation.error) {
        const response: ApiResponse = {
          success: false,
          message: 'Invalid contact ID',
          errors: [validation.error.message],
          meta: {
            timestamp: new Date().toISOString(),
            requestId: req.headers['x-request-id'] as string,
          },
        };
        res.status(400).json(response);
        return;
      }

      // Build query
      const query: GetMessageHistoryQuery = {
        contactId,
        limit: parseInt(limit, 10),
        offset: parseInt(offset, 10),
        fromDate: fromDate ? new Date(fromDate) : undefined,
        toDate: toDate ? new Date(toDate) : undefined,
      };

      // Execute use case
      const result = await this.getMessageHistoryUseCase.execute(query);

      if (!result.success) {
        const response: ApiResponse = {
          success: false,
          message: result.message || 'Failed to get message history',
          errors: result.errors,
          meta: {
            timestamp: new Date().toISOString(),
            requestId: req.headers['x-request-id'] as string,
          },
        };
        res.status(400).json(response);
        return;
      }

      // Map to response format
      const messages: MessageResponse[] = result.data!.messages.map(msg => ({
        id: msg.id,
        from: msg.from,
        to: msg.to,
        content: msg.content,
        timestamp: msg.timestamp.toISOString(),
        type: msg.type,
        isGroup: msg.isGroup || false,
      }));

      const response: PaginatedApiResponse<MessageResponse[]> = {
        success: true,
        message: 'Message history retrieved successfully',
        data: messages,
        pagination: {
          page: Math.floor(parseInt(offset, 10) / parseInt(limit, 10)) + 1,
          limit: parseInt(limit, 10),
          total: result.data!.totalCount,
          totalPages: Math.ceil(result.data!.totalCount / parseInt(limit, 10)),
          hasNext: result.data!.hasMore,
          hasPrev: parseInt(offset, 10) > 0,
        },
        meta: {
          timestamp: new Date().toISOString(),
          requestId: req.headers['x-request-id'] as string,
        },
      };

      res.json(response);
    } catch (error) {
      this.logger.error('Error in MessageController.getHistory', error as Error);
      const response: ApiResponse = {
        success: false,
        message: 'Internal server error',
        errors: ['Failed to retrieve message history'],
        meta: {
          timestamp: new Date().toISOString(),
          requestId: req.headers['x-request-id'] as string,
        },
      };
      res.status(500).json(response);
    }
  }

  async search(req: Request, res: Response): Promise<void> {
    try {
      const request = req as SearchMessagesRequest;
      const { q, contactId, messageType, limit = '20', offset = '0' } = request.query;

      // Validate query parameters
      const validation = ValidationSchemas.searchMessages.validate(request.query);
      if (validation.error) {
        const response: ApiResponse = {
          success: false,
          message: 'Invalid search parameters',
          errors: validation.error.details.map(detail => detail.message),
          meta: {
            timestamp: new Date().toISOString(),
            requestId: req.headers['x-request-id'] as string,
          },
        };
        res.status(400).json(response);
        return;
      }

      // TODO: Implement search use case
      // For now, return a placeholder response
      const response: PaginatedApiResponse<MessageResponse[]> = {
        success: true,
        message: 'Message search completed',
        data: [], // TODO: Implement actual search
        pagination: {
          page: Math.floor(parseInt(offset, 10) / parseInt(limit, 10)) + 1,
          limit: parseInt(limit, 10),
          total: 0,
          totalPages: 0,
          hasNext: false,
          hasPrev: parseInt(offset, 10) > 0,
        },
        meta: {
          timestamp: new Date().toISOString(),
          requestId: req.headers['x-request-id'] as string,
        },
      };

      res.json(response);
    } catch (error) {
      this.logger.error('Error in MessageController.search', error as Error);
      const response: ApiResponse = {
        success: false,
        message: 'Internal server error',
        errors: ['Failed to search messages'],
        meta: {
          timestamp: new Date().toISOString(),
          requestId: req.headers['x-request-id'] as string,
        },
      };
      res.status(500).json(response);
    }
  }

  async getStats(req: Request, res: Response): Promise<void> {
    try {
      const { contactId } = req.params;

      // Validate contact ID
      const validation = ValidationSchemas.uuid.validate(contactId);
      if (validation.error) {
        const response: ApiResponse = {
          success: false,
          message: 'Invalid contact ID',
          errors: [validation.error.message],
          meta: {
            timestamp: new Date().toISOString(),
            requestId: req.headers['x-request-id'] as string,
          },
        };
        res.status(400).json(response);
        return;
      }

      // TODO: Implement message stats use case
      // For now, return placeholder data
      const response: ApiResponse = {
        success: true,
        message: 'Message statistics retrieved successfully',
        data: {
          totalMessages: 0,
          incomingMessages: 0,
          outgoingMessages: 0,
          lastMessageDate: null,
        },
        meta: {
          timestamp: new Date().toISOString(),
          requestId: req.headers['x-request-id'] as string,
        },
      };

      res.json(response);
    } catch (error) {
      this.logger.error('Error in MessageController.getStats', error as Error);
      const response: ApiResponse = {
        success: false,
        message: 'Internal server error',
        errors: ['Failed to retrieve message statistics'],
        meta: {
          timestamp: new Date().toISOString(),
          requestId: req.headers['x-request-id'] as string,
        },
      };
      res.status(500).json(response);
    }
  }
}