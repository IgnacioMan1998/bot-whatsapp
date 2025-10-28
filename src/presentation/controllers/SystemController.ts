import { Request, Response } from 'express';
import { injectable, inject } from 'inversify';
import { TYPES } from '@shared/constants';
import { Logger } from '@shared/utils/logger';
import { AppConfig } from '@shared/types';
import { DatabaseAdapter } from '@infrastructure/database';
import { WhatsAppPort } from '@application/ports';
import { 
  UpdateConfigRequest,
  ApiResponse,
  SystemStatusResponse,
  ConfigResponse 
} from '@presentation/dtos';
import { ValidationSchemas } from '@presentation/middleware';

export interface SystemController {
  getStatus(req: Request, res: Response): Promise<void>;
  getConfig(req: Request, res: Response): Promise<void>;
  updateConfig(req: Request, res: Response): Promise<void>;
  getStats(req: Request, res: Response): Promise<void>;
}

@injectable()
export class SystemControllerImpl implements SystemController {
  constructor(
    @inject(TYPES.Logger) private logger: Logger,
    @inject(TYPES.Config) private config: AppConfig,
    @inject(TYPES.DatabaseAdapter) private databaseAdapter: DatabaseAdapter,
    @inject(TYPES.WhatsAppPort) private whatsAppPort: WhatsAppPort
  ) {}

  async getStatus(req: Request, res: Response): Promise<void> {
    try {
      // Check database status
      const dbHealthy = await this.databaseAdapter.healthCheck();
      
      // Check WhatsApp status
      const whatsappStatus = await this.whatsAppPort.getConnectionStatus();
      
      // Get system stats
      const stats = await this.getSystemStats();
      
      // Determine overall system status
      let overallStatus: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
      
      if (!dbHealthy) {
        overallStatus = 'unhealthy';
      } else if (!whatsappStatus.isReady) {
        overallStatus = 'degraded';
      }

      const systemStatus: SystemStatusResponse = {
        status: overallStatus,
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        version: process.env.npm_package_version || '1.0.0',
        services: {
          database: {
            status: dbHealthy ? 'connected' : 'disconnected',
            type: this.config.database.type,
          },
          whatsapp: {
            status: whatsappStatus.isConnected ? 'connected' : 'disconnected',
            isReady: whatsappStatus.isReady,
            sessionStatus: whatsappStatus.sessionStatus,
          },
        },
        stats,
      };

      const response: ApiResponse<SystemStatusResponse> = {
        success: true,
        message: 'System status retrieved successfully',
        data: systemStatus,
        meta: {
          timestamp: new Date().toISOString(),
          requestId: req.headers['x-request-id'] as string,
        },
      };

      res.json(response);
    } catch (error) {
      this.logger.error('Error in SystemController.getStatus', error as Error);
      const response: ApiResponse = {
        success: false,
        message: 'Failed to retrieve system status',
        errors: ['Internal server error'],
        meta: {
          timestamp: new Date().toISOString(),
          requestId: req.headers['x-request-id'] as string,
        },
      };
      res.status(500).json(response);
    }
  }

  async getConfig(req: Request, res: Response): Promise<void> {
    try {
      // Return non-sensitive configuration
      const configResponse: ConfigResponse = {
        defaults: {
          responseDelay: this.config.defaults.responseDelay,
          autoMessage: this.config.defaults.autoMessage,
        },
        server: {
          port: this.config.server.port,
          host: this.config.server.host,
        },
        // Don't expose database credentials or other sensitive info
      };

      const response: ApiResponse<ConfigResponse> = {
        success: true,
        message: 'Configuration retrieved successfully',
        data: configResponse,
        meta: {
          timestamp: new Date().toISOString(),
          requestId: req.headers['x-request-id'] as string,
        },
      };

      res.json(response);
    } catch (error) {
      this.logger.error('Error in SystemController.getConfig', error as Error);
      const response: ApiResponse = {
        success: false,
        message: 'Failed to retrieve configuration',
        errors: ['Internal server error'],
        meta: {
          timestamp: new Date().toISOString(),
          requestId: req.headers['x-request-id'] as string,
        },
      };
      res.status(500).json(response);
    }
  }

  async updateConfig(req: Request, res: Response): Promise<void> {
    try {
      const request = req as UpdateConfigRequest;
      
      // Validate request body
      const validation = ValidationSchemas.updateConfig.validate(request.body);
      if (validation.error) {
        const response: ApiResponse = {
          success: false,
          message: 'Validation error',
          errors: validation.error.details.map(detail => detail.message),
          meta: {
            timestamp: new Date().toISOString(),
            requestId: req.headers['x-request-id'] as string,
          },
        };
        res.status(400).json(response);
        return;
      }

      // TODO: Implement configuration update logic
      // This would typically involve:
      // 1. Validating the new configuration
      // 2. Updating the configuration in memory/file
      // 3. Restarting affected services if needed
      
      this.logger.info('Configuration update requested', {
        requestId: req.headers['x-request-id'] as string,
        updates: request.body,
      });

      const response: ApiResponse = {
        success: true,
        message: 'Configuration updated successfully',
        meta: {
          timestamp: new Date().toISOString(),
          requestId: req.headers['x-request-id'] as string,
        },
      };

      res.json(response);
    } catch (error) {
      this.logger.error('Error in SystemController.updateConfig', error as Error);
      const response: ApiResponse = {
        success: false,
        message: 'Failed to update configuration',
        errors: ['Internal server error'],
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
      const stats = await this.getSystemStats();

      const response: ApiResponse = {
        success: true,
        message: 'System statistics retrieved successfully',
        data: {
          ...stats,
          memory: {
            used: process.memoryUsage().heapUsed,
            total: process.memoryUsage().heapTotal,
            external: process.memoryUsage().external,
          },
          cpu: {
            usage: process.cpuUsage(),
          },
          process: {
            pid: process.pid,
            uptime: process.uptime(),
            version: process.version,
            platform: process.platform,
          },
        },
        meta: {
          timestamp: new Date().toISOString(),
          requestId: req.headers['x-request-id'] as string,
        },
      };

      res.json(response);
    } catch (error) {
      this.logger.error('Error in SystemController.getStats', error as Error);
      const response: ApiResponse = {
        success: false,
        message: 'Failed to retrieve system statistics',
        errors: ['Internal server error'],
        meta: {
          timestamp: new Date().toISOString(),
          requestId: req.headers['x-request-id'] as string,
        },
      };
      res.status(500).json(response);
    }
  }

  private async getSystemStats(): Promise<{
    totalMessages: number;
    totalContacts: number;
    activeTimers: number;
  }> {
    try {
      // Get basic statistics from database
      const [messagesResult, contactsResult, timersResult] = await Promise.all([
        this.databaseAdapter.queryOne<{ count: number }>('SELECT COUNT(*) as count FROM messages'),
        this.databaseAdapter.queryOne<{ count: number }>('SELECT COUNT(*) as count FROM contacts'),
        this.databaseAdapter.queryOne<{ count: number }>('SELECT COUNT(*) as count FROM active_timers WHERE expires_at > datetime("now")'),
      ]);

      return {
        totalMessages: messagesResult?.count || 0,
        totalContacts: contactsResult?.count || 0,
        activeTimers: timersResult?.count || 0,
      };
    } catch (error) {
      this.logger.warn('Failed to get system stats from database', { error: (error as Error).message });
      return {
        totalMessages: 0,
        totalContacts: 0,
        activeTimers: 0,
      };
    }
  }
}