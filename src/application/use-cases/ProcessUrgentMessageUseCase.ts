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

export interface ProcessUrgentMessageUseCase {
  execute(command: SendNotificationCommand): Promise<NotificationResponse>;
}

@injectable()
export class ProcessUrgentMessageUseCaseImpl implements ProcessUrgentMessageUseCase {
  constructor(
    @inject(TYPES.MessageRepository) private messageRepository: MessageRepository,
    @inject(TYPES.ContactRepository) private contactRepository: ContactRepository,
    @inject(TYPES.NotificationService) private notificationService: NotificationService,
    @inject(TYPES.Logger) private logger: Logger
  ) {}

  async execute(command: SendNotificationCommand): Promise<NotificationResponse> {
    try {
      this.logger.info('Processing urgent message notification', { 
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

      // 2. Verify if message is actually urgent
      const isUrgent = this.notificationService.isUrgent(message, contact);
      
      if (!isUrgent && command.urgencyLevel === 'low') {
        return {
          success: false,
          errors: ['Message does not meet urgency criteria'],
        };
      }

      // 3. Send urgent notification
      await this.notificationService.sendUrgentNotification(message, contact);

      // 4. Determine final urgency level
      const finalUrgencyLevel = command.urgencyLevel || 
        this.notificationService.determineUrgencyLevel(message, contact);

      this.logger.info('Urgent notification sent successfully', { 
        messageId: command.messageId,
        contactId: command.contactId,
        urgencyLevel: finalUrgencyLevel 
      });

      return {
        success: true,
        message: 'Urgent notification sent successfully',
        data: {
          notificationSent: true,
          urgencyLevel: finalUrgencyLevel,
        },
      };

    } catch (error) {
      this.logger.error('Error processing urgent message notification', error as Error, { command });
      return {
        success: false,
        errors: ['Failed to process urgent message notification'],
      };
    }
  }
}