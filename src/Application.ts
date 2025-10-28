import { CompositionRoot, ApplicationServices } from '@shared/composition';
import { Logger } from '@shared/utils/logger';
import { AppConfig } from '@shared/types';

export class Application {
  private compositionRoot: CompositionRoot;
  private services: ApplicationServices | null = null;
  private isRunning: boolean = false;

  constructor() {
    this.compositionRoot = new CompositionRoot();
    this.setupProcessHandlers();
  }

  /**
   * Initializes and starts the application
   */
  async start(): Promise<void> {
    try {
      console.log('🚀 Starting WhatsApp Personal Assistant...');

      // Initialize all dependencies and services
      this.services = await this.compositionRoot.initialize();
      
      const { logger, config } = this.services;

      logger.info('🎯 Application initialized successfully', {
        environment: process.env.NODE_ENV || 'development',
        databaseType: config.database.type,
        serverPort: config.server.port,
        pid: process.pid,
      });

      // Start the HTTP server
      await this.compositionRoot.start();

      this.isRunning = true;

      logger.info('✅ WhatsApp Personal Assistant is now running!', {
        serverUrl: `http://${config.server.host}:${config.server.port}`,
        healthCheck: `http://${config.server.host}:${config.server.port}/health`,
        apiDocs: `http://${config.server.host}:${config.server.port}/api`,
      });

      // Perform initial health check
      await this.performHealthCheck();

    } catch (error) {
      console.error('❌ Failed to start application:', error);
      await this.shutdown();
      process.exit(1);
    }
  }

  /**
   * Gracefully shuts down the application
   */
  async shutdown(): Promise<void> {
    if (!this.isRunning) {
      return;
    }

    const logger = this.services?.logger;

    try {
      logger?.info('🛑 Shutting down WhatsApp Personal Assistant...');

      // Shutdown composition root
      await this.compositionRoot.shutdown();

      this.isRunning = false;
      this.services = null;

      logger?.info('✅ Application shutdown completed successfully');
    } catch (error) {
      const errorMessage = `Error during shutdown: ${(error as Error).message}`;
      if (logger) {
        logger.error(errorMessage, error as Error);
      } else {
        console.error(errorMessage, error);
      }
    }
  }

  /**
   * Performs a health check on all services
   */
  async performHealthCheck(): Promise<void> {
    if (!this.services) {
      return;
    }

    const { logger } = this.services;

    try {
      const healthResult = await this.compositionRoot.healthCheck();
      
      if (healthResult.healthy) {
        logger.info('💚 Health check passed - all services are healthy');
      } else {
        logger.warn('💛 Health check warning - some services are unhealthy', {
          services: healthResult.services,
        });
      }
    } catch (error) {
      logger.error('❤️ Health check failed', error as Error);
    }
  }

  /**
   * Gets the current application status
   */
  getStatus(): {
    isRunning: boolean;
    config?: AppConfig;
    uptime?: number;
  } {
    return {
      isRunning: this.isRunning,
      config: this.services?.config,
      uptime: this.isRunning ? process.uptime() : undefined,
    };
  }

  /**
   * Gets application services (mainly for testing)
   */
  getServices(): ApplicationServices | null {
    return this.services;
  }

  /**
   * Sets up process signal handlers for graceful shutdown
   */
  private setupProcessHandlers(): void {
    // Handle SIGTERM (Docker, Kubernetes, etc.)
    process.on('SIGTERM', async () => {
      console.log('📡 SIGTERM received, initiating graceful shutdown...');
      await this.shutdown();
      process.exit(0);
    });

    // Handle SIGINT (Ctrl+C)
    process.on('SIGINT', async () => {
      console.log('📡 SIGINT received, initiating graceful shutdown...');
      await this.shutdown();
      process.exit(0);
    });

    // Handle uncaught exceptions
    process.on('uncaughtException', async (error) => {
      console.error('💥 Uncaught Exception:', error);
      if (this.services?.logger) {
        this.services.logger.error('Uncaught Exception', error);
      }
      await this.shutdown();
      process.exit(1);
    });

    // Handle unhandled promise rejections
    process.on('unhandledRejection', async (reason, promise) => {
      console.error('💥 Unhandled Rejection at:', promise, 'reason:', reason);
      if (this.services?.logger) {
        this.services.logger.error('Unhandled Rejection', reason as Error, { promise });
      }
      await this.shutdown();
      process.exit(1);
    });

    // Handle warnings
    process.on('warning', (warning) => {
      if (this.services?.logger) {
        this.services.logger.warn('Process Warning', { 
          name: warning.name,
          message: warning.message,
          stack: warning.stack,
        });
      } else {
        console.warn('⚠️ Process Warning:', warning);
      }
    });
  }

  /**
   * Restarts the application (useful for configuration changes)
   */
  async restart(): Promise<void> {
    const logger = this.services?.logger;
    
    try {
      logger?.info('🔄 Restarting application...');
      
      await this.shutdown();
      await new Promise(resolve => setTimeout(resolve, 1000)); // Brief pause
      await this.start();
      
      logger?.info('✅ Application restarted successfully');
    } catch (error) {
      logger?.error('Failed to restart application', error as Error);
      throw error;
    }
  }

  /**
   * Updates configuration at runtime (if supported)
   */
  async updateConfiguration(updates: Partial<AppConfig>): Promise<void> {
    const logger = this.services?.logger;
    
    try {
      logger?.info('⚙️ Updating application configuration...', { updates });
      
      // TODO: Implement configuration hot-reloading
      // This would involve updating the configuration and restarting affected services
      
      logger?.warn('Configuration hot-reloading not yet implemented - restart required');
    } catch (error) {
      logger?.error('Failed to update configuration', error as Error);
      throw error;
    }
  }
}