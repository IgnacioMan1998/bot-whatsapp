import { EventEmitter } from 'events';
import { Logger } from '@shared/utils/logger';

export interface DomainEvent {
  eventId: string;
  eventType: string;
  aggregateId: string;
  timestamp: Date;
  version: number;
  data: any;
}

export interface EventHandler<T extends DomainEvent = DomainEvent> {
  handle(event: T): Promise<void>;
}

export class EventBus {
  private emitter: EventEmitter;
  private handlers: Map<string, EventHandler[]>;
  private logger: Logger;

  constructor(logger: Logger) {
    this.emitter = new EventEmitter();
    this.handlers = new Map();
    this.logger = logger;
    
    // Increase max listeners to handle multiple event handlers
    this.emitter.setMaxListeners(100);
  }

  /**
   * Publishes an event to all registered handlers
   */
  async publish(event: DomainEvent): Promise<void> {
    try {
      this.logger.debug('Publishing event', {
        eventType: event.eventType,
        eventId: event.eventId,
        aggregateId: event.aggregateId,
      });

      // Get handlers for this event type
      const eventHandlers = this.handlers.get(event.eventType) || [];

      // Execute all handlers concurrently
      const promises = eventHandlers.map(async (handler) => {
        try {
          await handler.handle(event);
        } catch (error) {
          this.logger.error(`Error in event handler for ${event.eventType}`, error as Error, {
            eventId: event.eventId,
            handlerName: handler.constructor.name,
          });
          // Don't rethrow - we want other handlers to continue processing
        }
      });

      await Promise.all(promises);

      this.logger.debug('Event published successfully', {
        eventType: event.eventType,
        eventId: event.eventId,
        handlersCount: eventHandlers.length,
      });

    } catch (error) {
      this.logger.error('Error publishing event', error as Error, {
        eventType: event.eventType,
        eventId: event.eventId,
      });
      throw error;
    }
  }

  /**
   * Subscribes a handler to an event type
   */
  subscribe<T extends DomainEvent>(eventType: string, handler: EventHandler<T>): void {
    if (!this.handlers.has(eventType)) {
      this.handlers.set(eventType, []);
    }

    this.handlers.get(eventType)!.push(handler as EventHandler);

    this.logger.debug('Event handler subscribed', {
      eventType,
      handlerName: handler.constructor.name,
      totalHandlers: this.handlers.get(eventType)!.length,
    });
  }

  /**
   * Unsubscribes a handler from an event type
   */
  unsubscribe<T extends DomainEvent>(eventType: string, handler: EventHandler<T>): void {
    const handlers = this.handlers.get(eventType);
    if (handlers) {
      const index = handlers.indexOf(handler as EventHandler);
      if (index > -1) {
        handlers.splice(index, 1);
        this.logger.debug('Event handler unsubscribed', {
          eventType,
          handlerName: handler.constructor.name,
        });
      }
    }
  }

  /**
   * Gets all registered event types
   */
  getEventTypes(): string[] {
    return Array.from(this.handlers.keys());
  }

  /**
   * Gets handler count for an event type
   */
  getHandlerCount(eventType: string): number {
    return this.handlers.get(eventType)?.length || 0;
  }

  /**
   * Clears all handlers
   */
  clear(): void {
    this.handlers.clear();
    this.emitter.removeAllListeners();
    this.logger.debug('Event bus cleared');
  }
}