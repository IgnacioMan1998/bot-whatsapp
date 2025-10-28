import { inject, injectable } from 'inversify';
import { TYPES } from '@shared/constants';
import { Logger } from '@shared/utils/logger';
import { 
  Timer,
  Contact,
  Message,
  TimerRepository, 
  ContactRepository,
  MessageRepository,
  AutoResponseService
} from '@domain/index';
import { TimerId, MessageContent, MessageTypeVO } from '@domain/value-objects';
import { HandleTimerExpirationCommand, AutoResponseResult } from '@application/dtos';

export interface HandleTimerExpirationUseCase {
  execute(command: HandleTimerExpirationCommand): Promise<AutoResponseResult>;
}

@injectable()
export class HandleTimerExpirationUseCaseImpl implements HandleTimerExpirationUseCase {
  constructor(
    @inject(TYPES.TimerRepository) private timerRepository: TimerRepository,
    @inject(TYPES.ContactRepository) private contactRepository: ContactRepository,
    @inject(TYPES.MessageRepository) private messageRepository: MessageRepository,
    @inject(TYPES.AutoResponseService) private autoResponseService: AutoResponseService,
    @inject(TYPES.Logger) private logger: Logger
  ) {}

  async execute(command: HandleTimerExpirationCommand): Promise<AutoResponseResult> {
    try {
      this.logger.info('Handling timer expiration', { 
        timerId: command.timerId,
        contactId: command.contactId 
      });

      // 1. Get and validate timer
      const timerId = TimerId.fromString(command.timerId);
      const timer = await this.timerRepository.findById(timerId);
      
      if (!timer) {
        return {
          success: false,
          errors: ['Timer not found'],
        };
      }

      if (!timer.isExpired()) {
        return {
          success: false,
          errors: ['Timer has not expired yet'],
        };
      }

      // 2. Get contact and message
      const contact = await this.contactRepository.findById(timer.contactId);
      const originalMessage = await this.messageRepository.findById(timer.messageId);
      
      if (!contact || !originalMessage) {
        await this.timerRepository.delete(timerId);
        return {
          success: false,
          errors: ['Contact or message not found'],
        };
      }

      // 3. Check if user has responded in the meantime
      const hasUserResponded = await this.checkIfUserResponded(contact, originalMessage);
      
      if (hasUserResponded) {
        await this.timerRepository.delete(timerId);
        return {
          success: true,
          message: 'User has already responded, auto-response cancelled',
          data: {
            shouldRespond: false,
          },
        };
      }

      // 4. Generate auto-response
      const responseMessage = this.autoResponseService.generateResponse(contact, originalMessage);

      // 5. Create and save auto-response message
      const autoResponseMsg = this.createAutoResponseMessage(contact, originalMessage, responseMessage);
      await this.messageRepository.save(autoResponseMsg);

      // 6. Clean up timer
      await this.timerRepository.delete(timerId);

      // 7. Send the actual WhatsApp message (this would be handled by infrastructure layer)
      // For now, we just log it
      this.logger.info('Auto-response message created', { 
        contactId: contact.id.value,
        responseMessage: responseMessage.substring(0, 100),
        originalMessageId: originalMessage.id.value 
      });

      return {
        success: true,
        message: 'Auto-response sent successfully',
        data: {
          shouldRespond: true,
          responseMessage,
          delayInSeconds: 0, // Already processed
        },
      };

    } catch (error) {
      this.logger.error('Error handling timer expiration', error as Error, { command });
      return {
        success: false,
        errors: ['Failed to handle timer expiration'],
      };
    }
  }

  private async checkIfUserResponded(contact: Contact, originalMessage: Message): Promise<boolean> {
    try {
      // Check if there are any outgoing messages to this contact after the original message
      const recentMessages = await this.messageRepository.findByContact(contact.id, 10);
      
      return recentMessages.some(msg => 
        msg.type.isOutgoing() && 
        msg.timestamp > originalMessage.timestamp
      );
    } catch (error) {
      this.logger.warn('Failed to check if user responded', { 
        contactId: contact.id.value,
        error: (error as Error).message 
      });
      return false;
    }
  }

  private createAutoResponseMessage(contact: Contact, originalMessage: Message, responseText: string): Message {
    const content = MessageContent.fromString(responseText);
    
    return Message.create({
      from: originalMessage.to, // Assistant responds from user's number
      to: originalMessage.from, // To the contact who sent the original message
      content,
      timestamp: new Date(),
      type: MessageTypeVO.outgoing(),
      isGroup: originalMessage.isGroup,
    });
  }
}