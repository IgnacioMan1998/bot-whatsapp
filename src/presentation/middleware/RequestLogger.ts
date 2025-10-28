import { Request, Response, NextFunction } from 'express';
import { Logger } from '@shared/utils/logger';
import { v4 as uuidv4 } from 'uuid';

export class RequestLogger {
  constructor(private logger: Logger) {}

  log = (req: Request, res: Response, next: NextFunction): void => {
    // Generate request ID if not present
    if (!req.headers['x-request-id']) {
      req.headers['x-request-id'] = uuidv4();
    }

    const requestId = req.headers['x-request-id'] as string;
    const startTime = Date.now();

    // Log incoming request
    this.logger.info('Incoming request', {
      requestId,
      method: req.method,
      url: req.url,
      userAgent: req.get('User-Agent'),
      ip: req.ip,
      contentType: req.get('Content-Type'),
    });

    // Override res.json to log response
    const originalJson = res.json;
    res.json = function(body: any) {
      const duration = Date.now() - startTime;
      
      // Log response (without sensitive data)
      const logData = {
        requestId,
        method: req.method,
        url: req.url,
        statusCode: res.statusCode,
        duration: `${duration}ms`,
        responseSize: JSON.stringify(body).length,
      };

      if (res.statusCode >= 400) {
        req.app.get('logger').warn('Request completed with error', logData);
      } else {
        req.app.get('logger').info('Request completed successfully', logData);
      }

      return originalJson.call(this, body);
    };

    next();
  };
}