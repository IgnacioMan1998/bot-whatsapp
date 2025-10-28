import { inject, injectable } from 'inversify';
import { TYPES } from '@shared/constants';
import { Logger } from '@shared/utils/logger';
import { TimerRepository } from '@domain/index';
import { ContactId } from '@domain/value-objects';
import { GetActiveTimersQuery, TimerListResponse } from '@application/dtos';

export interface GetActiveTimersUseCase {
  execute(query: GetActiveTimersQuery): Promise<TimerListResponse>;
}

@injectable()
export class GetActiveTimersUseCaseImpl implements GetActiveTimersUseCase {
  constructor(
    @inject(TYPES.TimerRepository) private timerRepository: TimerRepository,
    @inject(TYPES.Logger) private logger: Logger
  ) {}

  async execute(query: GetActiveTimersQuery): Promise<TimerListResponse> {
    try {
      this.logger.info('Getting active timers', { 
        contactId: query.contactId 
      });

      let timers;

      if (query.contactId) {
        // Get timer for specific contact
        const contactId = ContactId.fromString(query.contactId);
        const timer = await this.timerRepository.findByContact(contactId);
        timers = timer && timer.isActive() ? [timer] : [];
      } else {
        // Get all active timers
        timers = await this.timerRepository.findActive();
      }

      // Map to DTOs
      const timerDtos = timers.map(timer => ({
        id: timer.id.value,
        contactId: timer.contactId.value,
        messageId: timer.messageId.value,
        expiresAt: timer.expiresAt,
        createdAt: timer.createdAt,
        isActive: timer.isActive(),
        remainingSeconds: timer.getRemainingSeconds(),
      }));

      return {
        success: true,
        message: 'Active timers retrieved successfully',
        data: {
          timers: timerDtos,
          totalCount: timerDtos.length,
        },
      };

    } catch (error) {
      this.logger.error('Error getting active timers', error as Error, { query });
      return {
        success: false,
        errors: ['Failed to retrieve active timers'],
      };
    }
  }
}