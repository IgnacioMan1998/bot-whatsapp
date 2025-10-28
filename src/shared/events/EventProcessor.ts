import { injectable, inject } from 'inversify';
import { TYPES } from '@shared/constants';
import { Logger } from '@shared/utils/logger';
import { EventBus } from './EventBus';
import {
  MessageReceivedEventHandler,
  UrgentMessageDetectedEventHandler,
  AutoResponseTimerExpiredEventHandler,
} from './handlers/MessageEventHandlers';

@injectable()
export class EventProcessor {
  private eventBus: EventBus;
  private isInitialized: boolean = false;

  constructor(
    @inject(TYPES.Logger) private logger: Logger
  ) {
    this.eventBus = new EventBus(logger);
  }

  /**
   * Initializes the event processor and registers all event handlers
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    try {
      this.logger.info('Initializing event processor...');

      // Register event handlers
      await this.registerEventHandlers();

      this.isInitialized = true;
      this.logger.info('Event processor initialized successfully');

    } catch (error) {
      this.logger.error('Failed to initialize event processor', error as Error);
      throw error;
    }
  }

  /**
   * Registers all event handlers with the event bus
   */
  private async registerEventHandlers(): Promise<void> {
    // Note: In a real implementation, these handlers would be injected via DI
    // For now, we'll create them manually
    
    // Message event handlers
    // this.eventBus.subscribe('MessageReceived', new MessageReceivedEventHandler(...));
    // this.eventBus.subscribe('UrgentMessageDetected', new UrgentMessageDetectedEventHandler(...));
    // this.eventBus.subscribe('AutoResponseTimerExpired', new AutoResponseTimerExpiredEventHandler(...));

    this.logger.info('Event handlers registered', {
      eventTypes: this.eventBus.getEventTypes(),
      totalHandlers: this.eventBus.getEventTypes().reduce(
        (sum, type) => sum + this.eventBus.getHandlerCount(type), 
        0
      ),
    });
  }

  /**
   * Gets the event bus instance
   */
  getEventBus(): EventBus {
    return this.eventBus;
  }

  /**
   * Checks if the event processor is initialized
   */
  isReady(): boolean {
    return this.isInitialized;
  }

  /**
   * Shuts down the event processor
   */
  async shutdown(): Promise<void> {
    if (!this.isInitialized) {
      return;
    }

    try {
      this.logger.info('Shutting down event processor...');

      // Clear all event handlers
      this.eventBus.clear();

      this.isInitialized = false;
      this.logger.info('Event processor shut down successfully');

    } catch (error) {
      this.logger.error('Error shutting down event processor', error as Error);
      throw error;
    }
  }

  /**
   * Gets event processing statistics
   */
  getStats(): {
    isInitialized: boolean;
    eventTypes: string[];
    totalHandlers: number;
    handlersByType: Record<string, number>;
  } {
    const eventTypes = this.eventBus.getEventTypes();
    const handlersByType: Record<string, number> = {};
    
    eventTypes.forEach(type => {
      handlersByType[type] = this.eventBus.getHandlerCount(type);
    });

    return {
      isInitialized: this.isInitialized,
      eventTypes,
      totalHandlers: Object.values(handlersByType).reduce((sum, count) => sum + count, 0),
      handlersByType,
    };
  }
}