import { Container } from 'inversify';
import { AppConfig } from '@shared/types';
import { DatabaseAdapter, DatabaseFactory } from '@infrastructure/database';
import { FileSystemConfigurationManager } from '@infrastructure/config';
import { WhatsAppPort } from '@application/ports';
import { DIContainer } from './container';
import { Logger } from '@shared/utils/logger';
import { TYPES } from '@shared/constants';

export interface ApplicationDependencies {
  container: Container;
  config: AppConfig;
  databaseAdapter: DatabaseAdapter;
  logger: Logger;
}

export class ApplicationFactory {
  
  /**
   * Creates and configures all application dependencies
   */
  static async create(): Promise<ApplicationDependencies> {
    // 1. Load configuration
    const configManager = new FileSystemConfigurationManager();
    const config = await configManager.loadConfiguration();

    // 2. Create and connect database adapter
    const databaseAdapter = await DatabaseFactory.createConnectAndMigrate(config.database);

    // 3. Setup dependency injection container
    await DIContainer.setupBindings(config, databaseAdapter);
    const container = DIContainer.getInstance();

    // 4. Get logger instance
    const logger = container.get<Logger>(TYPES.Logger);

    logger.info('Application dependencies created successfully', {
      databaseType: config.database.type,
      serverPort: config.server.port,
    });

    return {
      container,
      config,
      databaseAdapter,
      logger,
    };
  }

  /**
   * Creates dependencies for testing with custom configuration
   */
  static async createForTesting(testConfig?: Partial<AppConfig>): Promise<ApplicationDependencies> {
    // Use in-memory SQLite for testing
    const config: AppConfig = {
      whatsapp: {
        sessionPath: './test-sessions',
        puppeteerOptions: {
          headless: true,
          args: ['--no-sandbox'],
        },
      },
      database: {
        type: 'sqlite',
        sqlite: {
          path: ':memory:',
          enableWAL: false,
          busyTimeout: 5000,
        },
      },
      server: {
        port: 0, // Random port for testing
        host: 'localhost',
      },
      defaults: {
        responseDelay: 1, // Fast response for testing
        autoMessage: 'Test auto message',
      },
      ...testConfig,
    };

    // Create database adapter
    const databaseAdapter = await DatabaseFactory.createConnectAndMigrate(config.database);

    // Setup container
    await DIContainer.setupBindings(config, databaseAdapter);
    const container = DIContainer.getInstance();

    // Get logger
    const logger = container.get<Logger>(TYPES.Logger);

    return {
      container,
      config,
      databaseAdapter,
      logger,
    };
  }

  /**
   * Gracefully shuts down all application dependencies
   */
  static async shutdown(dependencies: ApplicationDependencies): Promise<void> {
    const { databaseAdapter, logger } = dependencies;

    try {
      logger.info('Shutting down application dependencies...');

      // Disconnect database
      await databaseAdapter.disconnect();
      logger.info('Database disconnected');

      // Reset DI container
      DIContainer.reset();
      logger.info('DI container reset');

      logger.info('Application shutdown completed successfully');
    } catch (error) {
      logger.error('Error during application shutdown', error as Error);
      throw error;
    }
  }

  /**
   * Health check for all dependencies
   */
  static async healthCheck(dependencies: ApplicationDependencies): Promise<{
    healthy: boolean;
    services: {
      database: boolean;
      whatsapp: boolean;
    };
  }> {
    const { databaseAdapter, container } = dependencies;

    try {
      // Check database health
      const databaseHealthy = await databaseAdapter.healthCheck();

      // Check WhatsApp health
      const whatsAppPort = container.get<WhatsAppPort>(TYPES.WhatsAppPort);
      const whatsAppStatus = await whatsAppPort.getConnectionStatus();
      const whatsAppHealthy = whatsAppStatus.isConnected;

      const overall = databaseHealthy && whatsAppHealthy;

      return {
        healthy: overall,
        services: {
          database: databaseHealthy,
          whatsapp: whatsAppHealthy,
        },
      };
    } catch (error) {
      return {
        healthy: false,
        services: {
          database: false,
          whatsapp: false,
        },
      };
    }
  }
}