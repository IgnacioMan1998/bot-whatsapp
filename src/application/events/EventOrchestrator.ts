import { injectable, inject } from 'inversify';
import { TYPES } from '@shared/constants';
import { Logger } from '@shared/utils/logger';
import { EventBus, InMemoryEventBus } from './EventBus';
import {
  MessageReceivedEventHandler,
  MessageSentEventHandler,
  TimerExpiredEventHandler,
  UrgentMessageDetectedEventHandler,
  AutoResponseTriggeredEventHandler,
} from './EventHandlers';

@injectable()
export class EventOrchestrator {
  constructor(
    @inject(TYPES.Logger) private logger: Logger,
    private eventBus: InMemoryEventBus,
    private messageReceivedHandler: MessageReceivedEventHandler,
    private messageSentHandler: MessageSentEventHandler,
    private timerExpiredHandler: TimerExpiredEventHandler,
    private urgentMessageHandler: UrgentMessageDetectedEventHandler,
    private autoResponseHandler: AutoResponseTriggeredEventHandler
  ) {}

  initialize(): void {
    this.logger.info('Initializing event orchestrator...');

    // Subscribe event handlers
    this.subscribeEventHandlers();

    this.logger.info('Event orchestrator initialized successfully', {
      handlerStats: this.eventBus.getHandlerStats(),
    });
  }

  shutdown(): void {
    this.logger.info('Shutting down event orchestrator...');

    // Unsubscribe all handlers
    this.unsubscribeEventHandlers();

    // Clear event bus
    this.eventBus.clear();

    this.logger.info('Event orchestrator shutdown completed');
  }

  private subscribeEventHandlers(): void {
    // Message events
    this.eventBus.subscribe('MessageReceived', this.messageReceivedHandler);
    this.eventBus.subscribe('MessageSent', this.messageSentHandler);

    // Timer events
    this.eventBus.subscribe('TimerExpired', this.timerExpiredHandler);

    // Notification events
    this.eventBus.subscribe('UrgentMessageDetected', this.urgentMessageHandler);

    // Auto-response events
    this.eventBus.subscribe('AutoResponseTriggered', this.autoResponseHandler);

    this.logger.debug('Event handlers subscribed successfully');
  }

  private unsubscribeEventHandlers(): void {
    // Message events
    this.eventBus.unsubscribe('MessageReceived', this.messageReceivedHandler);
    this.eventBus.unsubscribe('MessageSent', this.messageSentHandler);

    // Timer events
    this.eventBus.unsubscribe('TimerExpired', this.timerExpiredHandler);

    // Notification events
    this.eventBus.unsubscribe('UrgentMessageDetected', this.urgentMessageHandler);

    // Auto-response events
    this.eventBus.unsubscribe('AutoResponseTriggered', this.autoResponseHandler);

    this.logger.debug('Event handlers unsubscribed successfully');
  }

  getEventBus(): EventBus {
    return this.eventBus;
  }

  getHandlerStats(): { [eventType: string]: number } {
    return this.eventBus.getHandlerStats();
  }
}