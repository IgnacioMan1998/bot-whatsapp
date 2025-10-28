import { inject, injectable } from 'inversify';
import { TYPES } from '@shared/constants';
import { Logger } from '@shared/utils/logger';
import { 
  Message, 
  Contact, 
  MessageRepository, 
  ContactRepository,
  AutoResponseService,
  NotificationService,
  MessageValidationServiceImpl
} from '@domain/index';
import {
  MessageId,
  ContactId,
  MessageContent,
  MessageTypeVO,
  PhoneNumber,
  ContactName,
  ContactConfiguration
} from '@domain/value-objects';
import { ProcessIncomingMessageCommand, MessageResponse } from '@application/dtos';

export interface ProcessIncomingMessageUseCase {
  execute(command: ProcessIncomingMessageCommand): Promise<MessageResponse>;
}

@injectable()
export class ProcessIncomingMessageUseCaseImpl implements ProcessIncomingMessageUseCase {
  constructor(
    @inject(TYPES.MessageRepository) private messageRepository: MessageRepository,
    @inject(TYPES.ContactRepository) private contactRepository: ContactRepository,
    @inject(TYPES.AutoResponseService) private autoResponseService: AutoResponseService,
    @inject(TYPES.NotificationService) private notificationService: NotificationService,
    @inject(TYPES.Logger) private logger: Logger
  ) {}

  async execute(command: ProcessIncomingMessageCommand): Promise<MessageResponse> {
    try {
      this.logger.info('Processing incoming message', { 
        from: command.from, 
        content: command.content.substring(0, 50) 
      });

      // 1. Create message entity
      const message = this.createMessageFromCommand(command);

      // 2. Validate message
      const validationService = new MessageValidationServiceImpl();
      const validation = validationService.validateMessage(message);
      
      if (!validation.isValid) {
        return {
          success: false,
          errors: validation.errors,
        };
      }

      // 3. Save message to repository
      await this.messageRepository.save(message);

      // 4. Get or create contact
      const contact = await this.getOrCreateContact(command.from);

      // 5. Check if message is urgent
      if (this.notificationService.isUrgent(message, contact)) {
        await this.notificationService.sendUrgentNotification(message, contact);
        this.logger.info('Urgent notification sent', { 
          contactId: contact.id.value,
          messageId: message.id.value 
        });
      }

      // 6. Determine if auto-response should be triggered
      if (this.autoResponseService.shouldRespond(message, contact)) {
        // This will be handled by the timer system
        // The StartAutoResponseTimerUseCase will be called separately
        this.logger.info('Message requires auto-response', { 
          contactId: contact.id.value,
          delay: contact.getResponseDelay() 
        });
      }

      return {
        success: true,
        message: 'Message processed successfully',
        data: this.mapMessageToDto(message),
      };

    } catch (error) {
      this.logger.error('Error processing incoming message', error as Error, { command });
      return {
        success: false,
        errors: ['Failed to process incoming message'],
      };
    }
  }

  private createMessageFromCommand(command: ProcessIncomingMessageCommand): Message {
    const messageId = command.messageId ? MessageId.fromString(command.messageId) : MessageId.generate();
    const fromContactId = ContactId.fromString(command.from);
    const toContactId = ContactId.fromString(command.to);
    const content = MessageContent.fromString(command.content);
    const messageType = MessageTypeVO.incoming();

    return new Message({
      id: messageId,
      from: fromContactId,
      to: toContactId,
      content,
      timestamp: command.timestamp,
      type: messageType,
      isGroup: command.isGroup || false,
    });
  }

  private async getOrCreateContact(phoneNumber: string): Promise<Contact> {
    const phone = PhoneNumber.fromString(phoneNumber);
    
    // Try to find existing contact
    let contact = await this.contactRepository.findByPhoneNumber(phone);
    
    if (!contact) {
      // Create new contact with default configuration
      const name = ContactName.fromString(phoneNumber); // Use phone as default name
      const config = ContactConfiguration.default();
      
      contact = Contact.create(phone, name, config);
      await this.contactRepository.save(contact);
      
      this.logger.info('Created new contact', { 
        contactId: contact.id.value,
        phoneNumber: phoneNumber 
      });
    }

    return contact;
  }

  private mapMessageToDto(message: Message) {
    return {
      id: message.id.value,
      from: message.from.value,
      to: message.to.value,
      content: message.content.value,
      timestamp: message.timestamp,
      type: message.type.value as 'incoming' | 'outgoing',
      isGroup: message.isGroup,
    };
  }
}