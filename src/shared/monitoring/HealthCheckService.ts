import { injectable, inject } from 'inversify';
import { TYPES } from '@shared/constants';
import { Logger } from '@shared/utils/logger';
import { DatabaseAdapter } from '@infrastructure/database';
import { WhatsAppPort } from '@application/ports';
import { MetricsCollector } from './MetricsCollector';

export interface HealthCheck {
  name: string;
  status: 'healthy' | 'unhealthy';
  message?: string;
  duration: number;
  timestamp: Date;
}

export interface HealthReport {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: Date;
  uptime: number;
  checks: HealthCheck[];
  summary: {
    total: number;
    healthy: number;
    unhealthy: number;
  };
}

@injectable()
export class HealthCheckService {
  constructor(
    @inject(TYPES.Logger) private logger: Logger,
    @inject(TYPES.DatabaseAdapter) private databaseAdapter: DatabaseAdapter,
    @inject(TYPES.WhatsAppPort) private whatsAppPort: WhatsAppPort,
    private metricsCollector: MetricsCollector
  ) {}

  async performHealthCheck(): Promise<HealthReport> {
    const startTime = Date.now();
    const checks: HealthCheck[] = [];

    try {
      this.logger.info('Starting health check...');

      // Run all health checks in parallel
      const checkPromises = [
        this.checkDatabase(),
        this.checkWhatsApp(),
        this.checkMemoryUsage(),
        this.checkSystemResources(),
      ];

      const results = await Promise.allSettled(checkPromises);
      
      results.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          checks.push(result.value);
        } else {
          checks.push({
            name: ['Database', 'WhatsApp', 'Memory', 'System'][index],
            status: 'unhealthy',
            message: `Health check failed: ${result.reason}`,
            duration: 0,
            timestamp: new Date(),
          });
        }
      });

      // Calculate overall status
      const healthyCount = checks.filter(check => check.status === 'healthy').length;
      const totalCount = checks.length;
      
      let overallStatus: 'healthy' | 'degraded' | 'unhealthy';
      if (healthyCount === totalCount) {
        overallStatus = 'healthy';
      } else if (healthyCount >= totalCount * 0.7) {
        overallStatus = 'degraded';
      } else {
        overallStatus = 'unhealthy';
      }

      const report: HealthReport = {
        status: overallStatus,
        timestamp: new Date(),
        uptime: process.uptime(),
        checks,
        summary: {
          total: totalCount,
          healthy: healthyCount,
          unhealthy: totalCount - healthyCount,
        },
      };

      const duration = Date.now() - startTime;
      this.logger.info('Health check completed', {
        status: overallStatus,
        duration: `${duration}ms`,
        healthyChecks: healthyCount,
        totalChecks: totalCount,
      });

      return report;

    } catch (error) {
      this.logger.error('Health check failed', error as Error);
      
      return {
        status: 'unhealthy',
        timestamp: new Date(),
        uptime: process.uptime(),
        checks: [{
          name: 'HealthCheck',
          status: 'unhealthy',
          message: `Health check system failed: ${(error as Error).message}`,
          duration: Date.now() - startTime,
          timestamp: new Date(),
        }],
        summary: {
          total: 1,
          healthy: 0,
          unhealthy: 1,
        },
      };
    }
  }

  private async checkDatabase(): Promise<HealthCheck> {
    const startTime = Date.now();
    
    try {
      const isHealthy = await this.databaseAdapter.healthCheck();
      
      return {
        name: 'Database',
        status: isHealthy ? 'healthy' : 'unhealthy',
        message: isHealthy ? 'Database connection is healthy' : 'Database connection failed',
        duration: Date.now() - startTime,
        timestamp: new Date(),
      };
    } catch (error) {
      return {
        name: 'Database',
        status: 'unhealthy',
        message: `Database check failed: ${(error as Error).message}`,
        duration: Date.now() - startTime,
        timestamp: new Date(),
      };
    }
  }

  private async checkWhatsApp(): Promise<HealthCheck> {
    const startTime = Date.now();
    
    try {
      const status = await this.whatsAppPort.getConnectionStatus();
      const isHealthy = status.isConnected && status.isReady;
      
      return {
        name: 'WhatsApp',
        status: isHealthy ? 'healthy' : 'unhealthy',
        message: isHealthy 
          ? 'WhatsApp connection is healthy' 
          : `WhatsApp status: ${status.sessionStatus}`,
        duration: Date.now() - startTime,
        timestamp: new Date(),
      };
    } catch (error) {
      return {
        name: 'WhatsApp',
        status: 'unhealthy',
        message: `WhatsApp check failed: ${(error as Error).message}`,
        duration: Date.now() - startTime,
        timestamp: new Date(),
      };
    }
  }

  private async checkMemoryUsage(): Promise<HealthCheck> {
    const startTime = Date.now();
    
    try {
      const memUsage = process.memoryUsage();
      const usagePercentage = (memUsage.heapUsed / memUsage.heapTotal) * 100;
      const isHealthy = usagePercentage < 90; // Consider unhealthy if > 90%
      
      return {
        name: 'Memory',
        status: isHealthy ? 'healthy' : 'unhealthy',
        message: `Memory usage: ${usagePercentage.toFixed(1)}% (${Math.round(memUsage.heapUsed / 1024 / 1024)}MB)`,
        duration: Date.now() - startTime,
        timestamp: new Date(),
      };
    } catch (error) {
      return {
        name: 'Memory',
        status: 'unhealthy',
        message: `Memory check failed: ${(error as Error).message}`,
        duration: Date.now() - startTime,
        timestamp: new Date(),
      };
    }
  }

  private async checkSystemResources(): Promise<HealthCheck> {
    const startTime = Date.now();
    
    try {
      const uptime = process.uptime();
      const isHealthy = uptime > 10; // Consider unhealthy if uptime < 10 seconds (just started)
      
      return {
        name: 'System',
        status: isHealthy ? 'healthy' : 'unhealthy',
        message: `System uptime: ${Math.floor(uptime)}s`,
        duration: Date.now() - startTime,
        timestamp: new Date(),
      };
    } catch (error) {
      return {
        name: 'System',
        status: 'unhealthy',
        message: `System check failed: ${(error as Error).message}`,
        duration: Date.now() - startTime,
        timestamp: new Date(),
      };
    }
  }

  async getQuickStatus(): Promise<{ status: string; uptime: number; timestamp: Date }> {
    return {
      status: 'running',
      uptime: process.uptime(),
      timestamp: new Date(),
    };
  }
}