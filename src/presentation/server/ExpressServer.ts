import express, { Application } from 'express';
import cors from 'cors';
import { injectable, inject } from 'inversify';
import { TYPES } from '@shared/constants';
import { Logger } from '@shared/utils/logger';
import { AppConfig } from '@shared/types';
import {
  ErrorHandler,
  RequestLogger,
  SecurityMiddleware,
} from '@presentation/middleware';
import { ApiRouter } from './ApiRouter';

@injectable()
export class ExpressServer {
  private app: Application;
  private errorHandler: ErrorHandler;
  private requestLogger: RequestLogger;

  constructor(
    @inject(TYPES.Logger) private logger: Logger,
    @inject(TYPES.Config) private config: AppConfig,
    @inject(ApiRouter) private apiRouter: ApiRouter
  ) {
    this.app = express();
    this.errorHandler = new ErrorHandler(this.logger);
    this.requestLogger = new RequestLogger(this.logger);
    
    this.setupMiddleware();
    this.setupRoutes();
    this.setupErrorHandling();
  }

  private setupMiddleware(): void {
    // Security middleware
    this.app.use(SecurityMiddleware.helmet());
    this.app.use(cors(SecurityMiddleware.corsOptions));
    
    // Rate limiting
    this.app.use('/api', SecurityMiddleware.createRateLimit(15 * 60 * 1000, 100)); // 100 requests per 15 minutes
    
    // Body parsing
    this.app.use(express.json({ limit: SecurityMiddleware.requestSizeLimit }));
    this.app.use(express.urlencoded({ extended: true, limit: SecurityMiddleware.requestSizeLimit }));
    
    // Request logging
    this.app.use(this.requestLogger.log);
    
    // Input sanitization
    this.app.use(SecurityMiddleware.sanitizeInput);
    
    // API Key authentication
    this.app.use('/api', SecurityMiddleware.apiKeyAuth);
    
    // Make logger available to routes
    this.app.set('logger', this.logger);
  }

  private setupRoutes(): void {
    // Health check endpoint (no auth required)
    this.app.get('/health', (req, res) => {
      res.json({
        success: true,
        message: 'Server is healthy',
        data: {
          status: 'healthy',
          timestamp: new Date().toISOString(),
          uptime: process.uptime(),
          version: process.env.npm_package_version || '1.0.0',
        },
        meta: {
          timestamp: new Date().toISOString(),
          requestId: req.headers['x-request-id'] as string,
        },
      });
    });

    // API routes
    this.app.use('/api', this.apiRouter.getRouter());

    // Catch-all for undefined routes
    this.app.use('*', this.errorHandler.notFound);
  }

  private setupErrorHandling(): void {
    // Global error handler (must be last)
    this.app.use(this.errorHandler.handle);
  }

  public getApp(): Application {
    return this.app;
  }

  public async start(): Promise<void> {
    const port = this.config.server.port;
    const host = this.config.server.host;

    return new Promise((resolve, reject) => {
      const server = this.app.listen(port, host, () => {
        this.logger.info(`🚀 Server started successfully`, {
          port,
          host,
          environment: process.env.NODE_ENV || 'development',
          pid: process.pid,
        });
        resolve();
      });

      server.on('error', (error: Error) => {
        this.logger.error('Failed to start server', error);
        reject(error);
      });

      // Graceful shutdown
      process.on('SIGTERM', () => {
        this.logger.info('SIGTERM received, shutting down gracefully');
        server.close(() => {
          this.logger.info('Server closed');
          process.exit(0);
        });
      });

      process.on('SIGINT', () => {
        this.logger.info('SIGINT received, shutting down gracefully');
        server.close(() => {
          this.logger.info('Server closed');
          process.exit(0);
        });
      });
    });
  }
}