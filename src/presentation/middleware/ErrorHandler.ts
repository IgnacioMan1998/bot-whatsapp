import { Request, Response, NextFunction } from 'express';
import { Logger } from '@shared/utils/logger';
import { DomainError, ApplicationError, InfrastructureError } from '@shared/types';
import { ApiResponse } from '@presentation/dtos';

export class ErrorHandler {
  constructor(private logger: Logger) {}

  handle = (error: Error, req: Request, res: Response, next: NextFunction): void => {
    const requestId = req.headers['x-request-id'] as string || 'unknown';
    
    this.logger.error('API Error', error, {
      requestId,
      method: req.method,
      url: req.url,
      userAgent: req.get('User-Agent'),
      ip: req.ip,
    });

    const response: ApiResponse = {
      success: false,
      meta: {
        timestamp: new Date().toISOString(),
        requestId,
      },
    };

    // Handle different types of errors
    if (error instanceof DomainError) {
      response.message = 'Domain validation error';
      response.errors = [error.message];
      res.status(400).json(response);
    } else if (error instanceof ApplicationError) {
      response.message = 'Application error';
      response.errors = [error.message];
      res.status(422).json(response);
    } else if (error instanceof InfrastructureError) {
      response.message = 'Service temporarily unavailable';
      response.errors = ['Internal service error'];
      res.status(503).json(response);
    } else if (error.name === 'ValidationError') {
      response.message = 'Validation error';
      response.errors = [error.message];
      res.status(400).json(response);
    } else if (error.name === 'UnauthorizedError') {
      response.message = 'Unauthorized';
      response.errors = ['Authentication required'];
      res.status(401).json(response);
    } else {
      // Generic server error
      response.message = 'Internal server error';
      response.errors = ['An unexpected error occurred'];
      res.status(500).json(response);
    }
  };

  // Handle 404 errors
  notFound = (req: Request, res: Response): void => {
    const response: ApiResponse = {
      success: false,
      message: 'Resource not found',
      errors: [`Route ${req.method} ${req.path} not found`],
      meta: {
        timestamp: new Date().toISOString(),
        requestId: req.headers['x-request-id'] as string || 'unknown',
      },
    };

    res.status(404).json(response);
  };
}