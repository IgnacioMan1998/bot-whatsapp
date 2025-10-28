import { inject, injectable } from 'inversify';
import { TYPES } from '@shared/constants';
import { Logger } from '@shared/utils/logger';
import { 
  Timer, 
  Contact,
  TimerRepository, 
  ContactRepository,
  MessageRepository,
  AutoResponseService
} from '@domain/index';
import { ContactId, MessageId } from '@domain/value-objects';
import { StartTimerCommand, TimerResponse } from '@application/dtos';

export interface StartAutoResponseTimerUseCase {
  execute(command: StartTimerCommand): Promise<TimerResponse>;
}

@injectable()
export class StartAutoResponseTimerUseCaseImpl implements StartAutoResponseTimerUseCase {
  constructor(
    @inject(TYPES.TimerRepository) private timerRepository: TimerRepository,
    @inject(TYPES.ContactRepository) private contactRepository: ContactRepository,
    @inject(TYPES.MessageRepository) private messageRepository: MessageRepository,
    @inject(TYPES.AutoResponseService) private autoResponseService: AutoResponseService,
    @inject(TYPES.Logger) private logger: Logger
  ) {}

  async execute(command: StartTimerCommand): Promise<TimerResponse> {
    try {
      this.logger.info('Starting auto-response timer', { 
        contactId: command.contactId,
        messageId: command.messageId,
        delay: command.delayInSeconds 
      });

      // 1. Validate contact exists
      const contactId = ContactId.fromString(command.contactId);
      const contact = await this.contactRepository.findById(contactId);
      
      if (!contact) {
        return {
          success: false,
          errors: ['Contact not found'],
        };
      }

      // 2. Validate message exists
      const messageId = MessageId.fromString(command.messageId);
      const message = await this.messageRepository.findById(messageId);
      
      if (!message) {
        return {
          success: false,
          errors: ['Message not found'],
        };
      }

      // 3. Check if auto-response should be started
      if (!this.autoResponseService.shouldRespond(message, contact)) {
        return {
          success: false,
          errors: ['Auto-response not allowed for this message/contact combination'],
        };
      }

      // 4. Cancel any existing timer for this contact
      await this.cancelExistingTimer(contactId);

      // 5. Create new timer
      const timer = Timer.create(contactId, messageId, command.delayInSeconds);

      // 6. Save timer
      await this.timerRepository.save(timer);

      this.logger.info('Auto-response timer started successfully', { 
        timerId: timer.id.value,
        contactId: command.contactId,
        expiresAt: timer.expiresAt 
      });

      return {
        success: true,
        message: 'Auto-response timer started successfully',
        data: this.mapTimerToDto(timer),
      };

    } catch (error) {
      this.logger.error('Error starting auto-response timer', error as Error, { command });
      return {
        success: false,
        errors: ['Failed to start auto-response timer'],
      };
    }
  }

  private async cancelExistingTimer(contactId: ContactId): Promise<void> {
    try {
      const existingTimer = await this.timerRepository.findByContact(contactId);
      
      if (existingTimer && existingTimer.isActive()) {
        await this.timerRepository.cancelByContact(contactId);
        
        this.logger.info('Cancelled existing timer for contact', { 
          contactId: contactId.value,
          existingTimerId: existingTimer.id.value 
        });
      }
    } catch (error) {
      this.logger.warn('Failed to cancel existing timer', { 
        contactId: contactId.value,
        error: (error as Error).message 
      });
    }
  }

  private mapTimerToDto(timer: Timer) {
    return {
      id: timer.id.value,
      contactId: timer.contactId.value,
      messageId: timer.messageId.value,
      expiresAt: timer.expiresAt,
      createdAt: timer.createdAt,
      isActive: timer.isActive(),
      remainingSeconds: timer.getRemainingSeconds(),
    };
  }
}