import { inject, injectable } from 'inversify';
import { TYPES } from '@shared/constants';
import { Logger } from '@shared/utils/logger';
import { MessageRepository, ContactRepository } from '@domain/index';
import { ContactId, PhoneNumber } from '@domain/value-objects';
import { GetMessageHistoryQuery, MessageHistoryResponse } from '@application/dtos';

export interface GetMessageHistoryUseCase {
  execute(query: GetMessageHistoryQuery): Promise<MessageHistoryResponse>;
}

@injectable()
export class GetMessageHistoryUseCaseImpl implements GetMessageHistoryUseCase {
  constructor(
    @inject(TYPES.MessageRepository) private messageRepository: MessageRepository,
    @inject(TYPES.ContactRepository) private contactRepository: ContactRepository,
    @inject(TYPES.Logger) private logger: Logger
  ) {}

  async execute(query: GetMessageHistoryQuery): Promise<MessageHistoryResponse> {
    try {
      this.logger.info('Getting message history', { contactId: query.contactId });

      // 1. Validate contact exists
      const contactId = ContactId.fromString(query.contactId);
      const contact = await this.contactRepository.findById(contactId);
      
      if (!contact) {
        return {
          success: false,
          errors: ['Contact not found'],
        };
      }

      // 2. Set default pagination
      const limit = query.limit || 50;
      const offset = query.offset || 0;

      // 3. Get messages with criteria
      const searchCriteria = {
        contactId: contactId,
        fromDate: query.fromDate,
        toDate: query.toDate,
      };

      const messages = await this.messageRepository.findByCriteria(
        searchCriteria,
        limit + 1, // Get one extra to check if there are more
        offset
      );

      // 4. Check if there are more messages
      const hasMore = messages.length > limit;
      const resultMessages = hasMore ? messages.slice(0, limit) : messages;

      // 5. Get total count
      const totalCount = await this.messageRepository.countByCriteria(searchCriteria);

      // 6. Map to DTOs
      const messageDtos = resultMessages.map(message => ({
        id: message.id.value,
        from: message.from.value,
        to: message.to.value,
        content: message.content.value,
        timestamp: message.timestamp,
        type: message.type.value as 'incoming' | 'outgoing',
        isGroup: message.isGroup,
      }));

      return {
        success: true,
        message: 'Message history retrieved successfully',
        data: {
          messages: messageDtos,
          totalCount,
          hasMore,
        },
      };

    } catch (error) {
      this.logger.error('Error getting message history', error as Error, { query });
      return {
        success: false,
        errors: ['Failed to retrieve message history'],
      };
    }
  }
}