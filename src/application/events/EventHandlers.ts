import { injectable, inject } from 'inversify';
import { TYPES } from '@shared/constants';
import { Logger } from '@shared/utils/logger';
import { EventHandler } from './EventBus';
import {
  MessageReceivedEvent,
  MessageSentEvent,
  TimerExpiredEvent,
  UrgentMessageDetectedEvent,
  AutoResponseTriggeredEvent,
} from './DomainEvent';
import {
  StartAutoResponseTimerUseCase,
  HandleTimerExpirationUseCase,
  ProcessUrgentMessageUseCase,
} from '@application/use-cases';
import { WhatsAppPort } from '@application/ports';

// Message Event Handlers
@injectable()
export class MessageReceivedEventHandler implements EventHandler<MessageReceivedEvent> {
  constructor(
    @inject(TYPES.Logger) private logger: Logger,
    @inject(TYPES.StartAutoResponseTimerUseCase) private startTimerUseCase: StartAutoResponseTimerUseCase
  ) {}

  async handle(event: MessageReceivedEvent): Promise<void> {
    this.logger.info('Handling MessageReceived event', {
      eventId: event.eventId,
      messageId: event.aggregateId,
      from: event.data.from,
    });

    // Skip group messages for auto-response - CRITICAL SECURITY RULE
    if (event.data.isGroup) {
      console.log(`[SECURITY] Auto-response timer blocked for group message from ${event.data.from}`);
      return;
    }

    try {
      // Start auto-response timer
      await this.startTimerUseCase.execute({
        contactId: event.data.from,
        messageId: event.aggregateId,
        delayInSeconds: 60, // Default delay - should come from contact config
      });

      this.logger.debug('Auto-response timer started for message', {
        messageId: event.aggregateId,
        contactId: event.data.from,
      });

    } catch (error) {
      this.logger.error('Failed to start auto-response timer', error as Error, {
        messageId: event.aggregateId,
        contactId: event.data.from,
      });
    }
  }
}

@injectable()
export class MessageSentEventHandler implements EventHandler<MessageSentEvent> {
  constructor(
    @inject(TYPES.Logger) private logger: Logger
  ) {}

  async handle(event: MessageSentEvent): Promise<void> {
    this.logger.info('Handling MessageSent event', {
      eventId: event.eventId,
      messageId: event.aggregateId,
      to: event.data.to,
    });

    // TODO: Cancel any active timers for this contact since user responded
    // This would involve calling CancelAutoResponseTimerUseCase
  }
}

// Timer Event Handlers
@injectable()
export class TimerExpiredEventHandler implements EventHandler<TimerExpiredEvent> {
  constructor(
    @inject(TYPES.Logger) private logger: Logger,
    @inject(TYPES.HandleTimerExpirationUseCase) private handleExpirationUseCase: HandleTimerExpirationUseCase,
    @inject(TYPES.WhatsAppPort) private whatsAppPort: WhatsAppPort
  ) {}

  async handle(event: TimerExpiredEvent): Promise<void> {
    this.logger.info('Handling TimerExpired event', {
      eventId: event.eventId,
      timerId: event.aggregateId,
      contactId: event.data.contactId,
    });

    try {
      // Handle timer expiration and get auto-response
      const result = await this.handleExpirationUseCase.execute({
        timerId: event.aggregateId,
        contactId: event.data.contactId,
        messageId: event.data.messageId,
      });

      if (result.success && result.data?.shouldRespond) {
        // Send auto-response via WhatsApp
        await this.whatsAppPort.sendMessage(
          event.data.contactId,
          result.data.responseMessage!
        );

        this.logger.info('Auto-response sent successfully', {
          contactId: event.data.contactId,
          messageLength: result.data.responseMessage!.length,
        });
      }

    } catch (error) {
      this.logger.error('Failed to handle timer expiration', error as Error, {
        timerId: event.aggregateId,
        contactId: event.data.contactId,
      });
    }
  }
}

// Notification Event Handlers
@injectable()
export class UrgentMessageDetectedEventHandler implements EventHandler<UrgentMessageDetectedEvent> {
  constructor(
    @inject(TYPES.Logger) private logger: Logger,
    @inject(TYPES.ProcessUrgentMessageUseCase) private processUrgentUseCase: ProcessUrgentMessageUseCase
  ) {}

  async handle(event: UrgentMessageDetectedEvent): Promise<void> {
    this.logger.info('Handling UrgentMessageDetected event', {
      eventId: event.eventId,
      messageId: event.aggregateId,
      contactId: event.data.contactId,
      urgencyLevel: event.data.urgencyLevel,
    });

    try {
      // Process urgent message
      await this.processUrgentUseCase.execute({
        messageId: event.aggregateId,
        contactId: event.data.contactId,
        urgencyLevel: event.data.urgencyLevel,
      });

      this.logger.info('Urgent message processed successfully', {
        messageId: event.aggregateId,
        urgencyLevel: event.data.urgencyLevel,
      });

    } catch (error) {
      this.logger.error('Failed to process urgent message', error as Error, {
        messageId: event.aggregateId,
        contactId: event.data.contactId,
      });
    }
  }
}

// Auto Response Event Handler
@injectable()
export class AutoResponseTriggeredEventHandler implements EventHandler<AutoResponseTriggeredEvent> {
  constructor(
    @inject(TYPES.Logger) private logger: Logger,
    @inject(TYPES.WhatsAppPort) private whatsAppPort: WhatsAppPort
  ) {}

  async handle(event: AutoResponseTriggeredEvent): Promise<void> {
    this.logger.info('Handling AutoResponseTriggered event', {
      eventId: event.eventId,
      contactId: event.aggregateId,
      messageId: event.data.messageId,
    });

    try {
      // Send auto-response message
      await this.whatsAppPort.sendMessage(
        event.aggregateId,
        event.data.responseMessage
      );

      this.logger.info('Auto-response sent via WhatsApp', {
        contactId: event.aggregateId,
        messageId: event.data.messageId,
        responseLength: event.data.responseMessage.length,
      });

    } catch (error) {
      this.logger.error('Failed to send auto-response', error as Error, {
        contactId: event.aggregateId,
        messageId: event.data.messageId,
      });
    }
  }
}