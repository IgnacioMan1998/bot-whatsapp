import { injectable, inject } from 'inversify';
import { TYPES } from '@shared/constants';
import { Logger } from '@shared/utils/logger';
import { EventHandler } from '../EventBus';
import {
  MessageReceivedEvent,
  UrgentMessageDetectedEvent,
  AutoResponseTimerExpiredEvent,
} from '../DomainEvents';
import {
  ProcessIncomingMessageUseCase,
  StartAutoResponseTimerUseCase,
  HandleTimerExpirationUseCase,
  ProcessUrgentMessageUseCase,
} from '@application/use-cases';

@injectable()
export class MessageReceivedEventHandler implements EventHandler<MessageReceivedEvent> {
  constructor(
    @inject(TYPES.ProcessIncomingMessageUseCase) 
    private processIncomingMessageUseCase: ProcessIncomingMessageUseCase,
    @inject(TYPES.StartAutoResponseTimerUseCase)
    private startAutoResponseTimerUseCase: StartAutoResponseTimerUseCase,
    @inject(TYPES.Logger) private logger: Logger
  ) {}

  async handle(event: MessageReceivedEvent): Promise<void> {
    try {
      this.logger.info('Processing MessageReceived event', {
        eventId: event.eventId,
        messageId: event.aggregateId,
        from: event.data.from,
      });

      // Process the incoming message
      const result = await this.processIncomingMessageUseCase.execute({
        messageId: event.aggregateId,
        from: event.data.from,
        to: event.data.to,
        content: event.data.content,
        timestamp: event.data.timestamp,
        isGroup: event.data.isGroup,
      });

      if (!result.success) {
        this.logger.error('Failed to process incoming message', new Error(result.message || 'Unknown error'), {
          eventId: event.eventId,
          errors: result.errors,
        });
        return;
      }

      // Start auto-response timer if needed (for non-group messages)
      if (!event.data.isGroup) {
        try {
          await this.startAutoResponseTimerUseCase.execute({
            contactId: event.data.from,
            messageId: event.aggregateId,
            delayInSeconds: 60, // Default delay - should come from contact config
          });
        } catch (error) {
          this.logger.warn('Failed to start auto-response timer', {
            eventId: event.eventId,
            messageId: event.aggregateId,
            error: (error as Error).message,
          });
        }
      }

    } catch (error) {
      this.logger.error('Error handling MessageReceived event', error as Error, {
        eventId: event.eventId,
        messageId: event.aggregateId,
      });
    }
  }
}

@injectable()
export class UrgentMessageDetectedEventHandler implements EventHandler<UrgentMessageDetectedEvent> {
  constructor(
    @inject(TYPES.ProcessUrgentMessageUseCase)
    private processUrgentMessageUseCase: ProcessUrgentMessageUseCase,
    @inject(TYPES.Logger) private logger: Logger
  ) {}

  async handle(event: UrgentMessageDetectedEvent): Promise<void> {
    try {
      this.logger.info('Processing UrgentMessageDetected event', {
        eventId: event.eventId,
        messageId: event.aggregateId,
        urgencyLevel: event.data.urgencyLevel,
      });

      // Process urgent message notification
      await this.processUrgentMessageUseCase.execute({
        messageId: event.aggregateId,
        contactId: event.data.contactId,
        urgencyLevel: event.data.urgencyLevel,
      });

    } catch (error) {
      this.logger.error('Error handling UrgentMessageDetected event', error as Error, {
        eventId: event.eventId,
        messageId: event.aggregateId,
      });
    }
  }
}

@injectable()
export class AutoResponseTimerExpiredEventHandler implements EventHandler<AutoResponseTimerExpiredEvent> {
  constructor(
    @inject(TYPES.HandleTimerExpirationUseCase)
    private handleTimerExpirationUseCase: HandleTimerExpirationUseCase,
    @inject(TYPES.Logger) private logger: Logger
  ) {}

  async handle(event: AutoResponseTimerExpiredEvent): Promise<void> {
    try {
      this.logger.info('Processing AutoResponseTimerExpired event', {
        eventId: event.eventId,
        timerId: event.aggregateId,
        contactId: event.data.contactId,
      });

      // Handle timer expiration and send auto-response
      await this.handleTimerExpirationUseCase.execute({
        timerId: event.aggregateId,
        contactId: event.data.contactId,
        messageId: event.data.messageId,
      });

    } catch (error) {
      this.logger.error('Error handling AutoResponseTimerExpired event', error as Error, {
        eventId: event.eventId,
        timerId: event.aggregateId,
      });
    }
  }
}