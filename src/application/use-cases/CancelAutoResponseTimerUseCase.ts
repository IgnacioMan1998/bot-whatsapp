import { inject, injectable } from 'inversify';
import { TYPES } from '@shared/constants';
import { Logger } from '@shared/utils/logger';
import { TimerRepository, ContactRepository } from '@domain/index';
import { ContactId } from '@domain/value-objects';
import { CancelTimerCommand, TimerResponse } from '@application/dtos';

export interface CancelAutoResponseTimerUseCase {
  execute(command: CancelTimerCommand): Promise<TimerResponse>;
}

@injectable()
export class CancelAutoResponseTimerUseCaseImpl implements CancelAutoResponseTimerUseCase {
  constructor(
    @inject(TYPES.TimerRepository) private timerRepository: TimerRepository,
    @inject(TYPES.ContactRepository) private contactRepository: ContactRepository,
    @inject(TYPES.Logger) private logger: Logger
  ) {}

  async execute(command: CancelTimerCommand): Promise<TimerResponse> {
    try {
      this.logger.info('Cancelling auto-response timer', { 
        contactId: command.contactId 
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

      // 2. Find active timer for contact
      const activeTimer = await this.timerRepository.findByContact(contactId);
      
      if (!activeTimer) {
        return {
          success: false,
          errors: ['No active timer found for this contact'],
        };
      }

      if (!activeTimer.isActive()) {
        return {
          success: false,
          errors: ['Timer is not active'],
        };
      }

      // 3. Cancel the timer
      await this.timerRepository.cancelByContact(contactId);

      this.logger.info('Auto-response timer cancelled successfully', { 
        timerId: activeTimer.id.value,
        contactId: command.contactId 
      });

      return {
        success: true,
        message: 'Auto-response timer cancelled successfully',
        data: {
          id: activeTimer.id.value,
          contactId: activeTimer.contactId.value,
          messageId: activeTimer.messageId.value,
          expiresAt: activeTimer.expiresAt,
          createdAt: activeTimer.createdAt,
          isActive: false, // Now cancelled
          remainingSeconds: 0,
        },
      };

    } catch (error) {
      this.logger.error('Error cancelling auto-response timer', error as Error, { command });
      return {
        success: false,
        errors: ['Failed to cancel auto-response timer'],
      };
    }
  }
}