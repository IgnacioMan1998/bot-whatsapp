import { EventEmitter } from 'events';
import { injectable } from 'inversify';
import { DomainEvent } from './DomainEvent';
import { Logger } from '@shared/utils/logger';

export interface EventHandler<T extends DomainEvent = DomainEvent> {
  handle(event: T): Promise<void>;
}

export interface EventBus {
  publish(event: DomainEvent): Promise<void>;
  subscribe<T extends DomainEvent>(eventType: string, handler: EventHandler<T>): void;
  unsubscribe(eventType: string, handler: EventHandler): void;
}

@injectable()
export class InMemoryEventBus implements EventBus {
  private eventEmitter: EventEmitter;
  private handlers: Map<string, EventHandler[]>;
  private logger: Logger;

  constructor(logger: Logger) {
    this.eventEmitter = new EventEmitter();
    this.handlers = new Map();
    this.logger = logger;
    
    // Increase max listeners to handle multiple event handlers
    this.eventEmitter.setMaxListeners(100);
  }

  async publish(event: DomainEvent): Promise<void> {
    try {
      this.logger.debug('Publishing domain event', {
        eventType: event.eventType,
        eventId: event.eventId,
        aggregateId: event.aggregateId,
      });

      // Emit the event
      this.eventEmitter.emit(event.eventType, event);

      // Also emit a generic 'domain-event' for global listeners
      this.eventEmitter.emit('domain-event', event);

    } catch (error) {
      this.logger.error('Error publishing domain event', error as Error, {
        eventType: event.eventType,
        eventId: event.eventId,
      });
      throw error;
    }
  }

  subscribe<T extends DomainEvent>(eventType: string, handler: EventHandler<T>): void {
    try {
      // Add to handlers map for tracking
      if (!this.handlers.has(eventType)) {
        this.handlers.set(eventType, []);
      }
      this.handlers.get(eventType)!.push(handler as EventHandler);

      // Subscribe to event emitter
      this.eventEmitter.on(eventType, async (event: T) => {
        try {
          await handler.handle(event);
        } catch (error) {
          this.logger.error('Error in event handler', error as Error, {
            eventType,
            eventId: event.eventId,
            handlerName: handler.constructor.name,
          });
        }
      });

      this.logger.debug('Event handler subscribed', {
        eventType,
        handlerName: handler.constructor.name,
      });

    } catch (error) {
      this.logger.error('Error subscribing event handler', error as Error, {
        eventType,
        handlerName: handler.constructor.name,
      });
      throw error;
    }
  }

  unsubscribe(eventType: string, handler: EventHandler): void {
    try {
      // Remove from handlers map
      const handlers = this.handlers.get(eventType);
      if (handlers) {
        const index = handlers.indexOf(handler);
        if (index > -1) {
          handlers.splice(index, 1);
        }
        
        if (handlers.length === 0) {
          this.handlers.delete(eventType);
        }
      }

      // Remove from event emitter
      this.eventEmitter.removeListener(eventType, handler.handle);

      this.logger.debug('Event handler unsubscribed', {
        eventType,
        handlerName: handler.constructor.name,
      });

    } catch (error) {
      this.logger.error('Error unsubscribing event handler', error as Error, {
        eventType,
        handlerName: handler.constructor.name,
      });
    }
  }

  // Get statistics about registered handlers
  getHandlerStats(): { [eventType: string]: number } {
    const stats: { [eventType: string]: number } = {};
    
    for (const [eventType, handlers] of this.handlers.entries()) {
      stats[eventType] = handlers.length;
    }
    
    return stats;
  }

  // Clear all handlers (useful for testing)
  clear(): void {
    this.eventEmitter.removeAllListeners();
    this.handlers.clear();
    this.logger.debug('All event handlers cleared');
  }
}