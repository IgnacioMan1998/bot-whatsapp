import { inject, injectable } from 'inversify';
import { TYPES } from '@shared/constants';
import { Logger } from '@shared/utils/logger';
import { 
  Message, 
  Contact, 
  MessageRepository, 
  ContactRepository,
  TimerRepository
} from '@domain/index';
import {
  MessageId,
  ContactId,
  MessageContent,
  MessageTypeVO,
  PhoneNumber
} from '@domain/value-objects';
import { ProcessOutgoingMessageCommand, MessageResponse } from '@application/dtos';

export interface ProcessOutgoingMessageUseCase {
  execute(command: ProcessOutgoingMessageCommand): Promise<MessageResponse>;
}

@injectable()
export class ProcessOutgoingMessageUseCaseImpl implements ProcessOutgoingMessageUseCase {
  constructor(
    @inject(TYPES.MessageRepository) private messageRepository: MessageRepository,
    @inject(TYPES.ContactRepository) private contactRepository: ContactRepository,
    @inject(TYPES.TimerRepository) private timerRepository: TimerRepository,
    @inject(TYPES.Logger) private logger: Logger
  ) {}

  async execute(command: ProcessOutgoingMessageCommand): Promise<MessageResponse> {
    try {
      this.logger.info('Processing outgoing message', { 
        to: command.to, 
        content: command.content.substring(0, 50) 
      });

      // 1. Create message entity
      const message = this.createMessageFromCommand(command);

      // 2. Save message to repository
      await this.messageRepository.save(message);

      // 3. Cancel any active timer for this contact (user responded)
      await this.cancelActiveTimer(command.to);

      // 4. Update contact if exists
      await this.updateContactIfExists(command.to);

      return {
        success: true,
        message: 'Outgoing message processed successfully',
        data: this.mapMessageToDto(message),
      };

    } catch (error) {
      this.logger.error('Error processing outgoing message', error as Error, { command });
      return {
        success: false,
        errors: ['Failed to process outgoing message'],
      };
    }
  }

  private createMessageFromCommand(command: ProcessOutgoingMessageCommand): Message {
    const messageId = command.messageId ? MessageId.fromString(command.messageId) : MessageId.generate();
    const fromContactId = ContactId.fromString(command.from);
    const toContactId = ContactId.fromString(command.to);
    const content = MessageContent.fromString(command.content);
    const messageType = MessageTypeVO.outgoing();

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

  private async cancelActiveTimer(contactPhoneNumber: string): Promise<void> {
    try {
      const phone = PhoneNumber.fromString(contactPhoneNumber);
      const contact = await this.contactRepository.findByPhoneNumber(phone);
      
      if (contact) {
        const activeTimer = await this.timerRepository.findByContact(contact.id);
        
        if (activeTimer && activeTimer.isActive()) {
          await this.timerRepository.cancelByContact(contact.id);
          
          this.logger.info('Cancelled active timer due to user response', { 
            contactId: contact.id.value,
            timerId: activeTimer.id.value 
          });
        }
      }
    } catch (error) {
      this.logger.warn('Failed to cancel active timer', { 
        contactPhoneNumber,
        error: (error as Error).message 
      });
    }
  }

  private async updateContactIfExists(contactPhoneNumber: string): Promise<void> {
    try {
      const phone = PhoneNumber.fromString(contactPhoneNumber);
      const contact = await this.contactRepository.findByPhoneNumber(phone);
      
      if (contact) {
        // Could update last interaction time or other metadata here
        // For now, we just log the interaction
        this.logger.debug('User sent message to contact', { 
          contactId: contact.id.value,
          phoneNumber: contactPhoneNumber 
        });
      }
    } catch (error) {
      this.logger.warn('Failed to update contact information', { 
        contactPhoneNumber,
        error: (error as Error).message 
      });
    }
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