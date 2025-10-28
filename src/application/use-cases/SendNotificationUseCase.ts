import { inject, injectable } from 'inversify';
import { TYPES } from '@shared/constants';
import { Logger } from '@shared/utils/logger';
import { 
  Message,
  Contact,
  MessageRepository, 
  ContactRepository,
  NotificationService
} from '@domain/index';
import { MessageId, ContactId } from '@domain/value-objects';
import { SendNotificationCommand, NotificationResponse } from '@application/dtos';

export interface SendNotificationUseCase {
  execute(command: SendNotificationCommand): Promise<NotificationResponse>;
}

@injectable()
export class SendNotificationUseCaseImpl implements SendNotificationUseCase {
  constructor(
    @inject(TYPES.MessageRepository) private messageRepository: MessageRepository,
    @inject(TYPES.ContactRepository) private contactRepository: ContactRepository,
    @inject(TYPES.NotificationService) private notificationService: NotificationService,
    @inject(TYPES.Logger) private logger: Logger
  ) {}

  async execute(command: SendNotificationCommand): Promise<NotificationResponse> {
    try {
      this.logger.info('Sending notification', { 
        messageId: command.messageId,
        contactId: command.contactId,
        urgencyLevel: command.urgencyLevel 
      });

      // 1. Get message and contact
      const messageId = MessageId.fromString(command.messageId);
      const contactId = ContactId.fromString(command.contactId);
      
      const [message, contact] = await Promise.all([
        this.messageRepository.findById(messageId),
        this.contactRepository.findById(contactId)
      ]);

      if (!message) {
        return {
          success: false,
          errors: ['Message not found'],
        };
      }

      if (!contact) {
        return {
          success: false,
          errors: ['Contact not found'],
        };
      }

      // 2. Determine urgency level if not provided
      const urgencyLevel = command.urgencyLevel || 
        this.notificationService.determineUrgencyLevel(message, contact);

      // 3. Send notification based on urgency level
      let notificationSent = false;

      if (urgencyLevel === 'high' || urgencyLevel === 'medium') {
        await this.notificationService.sendUrgentNotification(message, contact);
        notificationSent = true;
      } else {
        // For low urgency, we might choose not to send immediate notification
        // or send a less intrusive notification
        this.logger.info('Low urgency message, notification skipped', { 
          messageId: command.messageId,
          contactId: command.contactId 
        });
      }

      this.logger.info('Notification processing completed', { 
        messageId: command.messageId,
        contactId: command.contactId,
        urgencyLevel,
        notificationSent 
      });

      return {
        success: true,
        message: notificationSent ? 'Notification sent successfully' : 'Notification not required for low urgency',
        data: {
          notificationSent,
          urgencyLevel,
        },
      };

    } catch (error) {
      this.logger.error('Error sending notification', error as Error, { command });
      return {
        success: false,
        errors: ['Failed to send notification'],
      };
    }
  }
}