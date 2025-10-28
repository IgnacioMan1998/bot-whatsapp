import { ApplicationFactory, ApplicationDependencies, ServiceLocator } from '@shared/container';
import { ExpressServer } from '@presentation/server';
import { ApiRouter } from '@presentation/server';
import { Logger } from '@shared/utils/logger';
import { AppConfig } from '@shared/types';
import { WhatsAppPort } from '@application/ports';
import { TYPES } from '@shared/constants';

export interface ApplicationServices {
  expressServer: ExpressServer;
  whatsAppPort: WhatsAppPort;
  logger: Logger;
  config: AppConfig;
}

export class CompositionRoot {
  private dependencies: ApplicationDependencies | null = null;
  private services: ApplicationServices | null = null;

  /**
   * Initializes the entire application
   */
  async initialize(): Promise<ApplicationServices> {
    try {
      // 1. Create all dependencies
      this.dependencies = await ApplicationFactory.create();
      
      // 2. Set up service locator
      ServiceLocator.setContainer(this.dependencies.container);

      // 3. Create application services
      this.services = await this.createApplicationServices();

      // 4. Initialize WhatsApp connection
      await this.initializeWhatsApp();

      this.dependencies.logger.info('🎉 Application composition completed successfully');

      return this.services;
    } catch (error) {
      if (this.dependencies?.logger) {
        this.dependencies.logger.error('Failed to initialize application', error as Error);
      } else {
        console.error('Failed to initialize application:', error);
      }
      throw error;
    }
  }

  /**
   * Creates application services using the DI container
   */
  private async createApplicationServices(): Promise<ApplicationServices> {
    if (!this.dependencies) {
      throw new Error('Dependencies not initialized');
    }

    const { container, config, logger } = this.dependencies;

    // Create API router
    const apiRouter = new ApiRouter(
      container.get(TYPES.MessageController),
      container.get(TYPES.ContactController),
      container.get(TYPES.SystemController)
    );

    // Create Express server
    const expressServer = new ExpressServer(
      logger,
      config,
      apiRouter
    );

    // Get WhatsApp port
    const whatsAppPort = container.get<WhatsAppPort>(TYPES.WhatsAppPort);

    return {
      expressServer,
      whatsAppPort,
      logger,
      config,
    };
  }

  /**
   * Initializes WhatsApp connection
   */
  private async initializeWhatsApp(): Promise<void> {
    if (!this.services) {
      throw new Error('Services not created');
    }

    const { whatsAppPort, logger } = this.services;

    try {
      logger.info('🔌 Initializing WhatsApp connection...');

      // Set up event handlers
      whatsAppPort.onReady(() => {
        logger.info('✅ WhatsApp client is ready');
      });

      whatsAppPort.onQRCode((qrCode) => {
        logger.info('📱 QR Code generated for WhatsApp authentication');
        // In a real application, you might want to display this QR code
        // or send it to a web interface for scanning
      });

      whatsAppPort.onAuthenticated(() => {
        logger.info('🔐 WhatsApp client authenticated successfully');
      });

      whatsAppPort.onDisconnected((reason) => {
        logger.warn('🔌 WhatsApp client disconnected', { reason });
        // TODO: Implement reconnection logic
      });

      whatsAppPort.onMessageReceived((message) => {
        logger.debug('📨 Message received', { 
          from: message.from, 
          isGroup: message.isGroup 
        });
        // TODO: Process incoming message through use case
        this.handleIncomingMessage(message);
      });

      // Initialize the connection
      await whatsAppPort.initialize();
      
    } catch (error) {
      logger.error('Failed to initialize WhatsApp connection', error as Error);
      throw error;
    }
  }

  /**
   * Handles incoming WhatsApp messages
   */
  private async handleIncomingMessage(message: any): Promise<void> {
    try {
      if (!this.services) return;

      const processIncomingMessageUseCase = ServiceLocator.getProcessIncomingMessageUseCase();
      
      await processIncomingMessageUseCase.execute({
        from: message.from,
        to: message.to,
        content: message.body,
        timestamp: new Date(message.timestamp),
        isGroup: message.isGroup,
      });

      // If auto-response is needed, start timer
      if (!message.fromMe && !message.isGroup) {
        const startTimerUseCase = ServiceLocator.getStartAutoResponseTimerUseCase();
        const contactRepository = ServiceLocator.getContactRepository();
        
        // Get or create contact to determine response delay
        // This is a simplified implementation
        await startTimerUseCase.execute({
          contactId: message.from,
          messageId: message.id,
          delayInSeconds: 60, // Default delay, should come from contact config
        });
      }

    } catch (error) {
      this.services?.logger.error('Error handling incoming message', error as Error);
    }
  }

  /**
   * Starts the application server
   */
  async start(): Promise<void> {
    if (!this.services) {
      throw new Error('Application not initialized');
    }

    const { expressServer, logger } = this.services;

    try {
      await expressServer.start();
      logger.info('🌐 HTTP server started successfully');
    } catch (error) {
      logger.error('Failed to start HTTP server', error as Error);
      throw error;
    }
  }

  /**
   * Gracefully shuts down the application
   */
  async shutdown(): Promise<void> {
    if (!this.dependencies) {
      return;
    }

    const { logger } = this.dependencies;

    try {
      logger.info('🛑 Shutting down application...');

      // Disconnect WhatsApp
      if (this.services?.whatsAppPort) {
        await this.services.whatsAppPort.disconnect();
        logger.info('📱 WhatsApp disconnected');
      }

      // Shutdown dependencies
      await ApplicationFactory.shutdown(this.dependencies);

      logger.info('✅ Application shutdown completed');
    } catch (error) {
      logger.error('Error during application shutdown', error as Error);
      throw error;
    }
  }

  /**
   * Performs health check on all services
   */
  async healthCheck(): Promise<{
    healthy: boolean;
    services: Record<string, boolean>;
  }> {
    if (!this.dependencies) {
      return {
        healthy: false,
        services: {},
      };
    }

    try {
      const healthResult = await ApplicationFactory.healthCheck(this.dependencies);
      
      return {
        healthy: healthResult.healthy,
        services: {
          database: healthResult.services.database,
          whatsapp: healthResult.services.whatsapp,
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

  /**
   * Gets the current application services (for testing or external access)
   */
  getServices(): ApplicationServices | null {
    return this.services;
  }

  /**
   * Gets the current dependencies (for testing or external access)
   */
  getDependencies(): ApplicationDependencies | null {
    return this.dependencies;
  }
}