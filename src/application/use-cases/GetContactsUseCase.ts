import { inject, injectable } from 'inversify';
import { TYPES } from '@shared/constants';
import { Logger } from '@shared/utils/logger';
import { ContactRepository } from '@domain/index';
import { GetContactsQuery, ContactListResponse } from '@application/dtos';

export interface GetContactsUseCase {
  execute(query: GetContactsQuery): Promise<ContactListResponse>;
}

@injectable()
export class GetContactsUseCaseImpl implements GetContactsUseCase {
  constructor(
    @inject(TYPES.ContactRepository) private contactRepository: ContactRepository,
    @inject(TYPES.Logger) private logger: Logger
  ) {}

  async execute(query: GetContactsQuery): Promise<ContactListResponse> {
    try {
      this.logger.info('Getting contacts list', { 
        limit: query.limit,
        offset: query.offset 
      });

      // 1. Set default pagination
      const limit = query.limit || 50;
      const offset = query.offset || 0;

      // 2. Build search criteria
      const searchCriteria = {
        isUrgent: query.isUrgent,
        autoResponseEnabled: query.autoResponseEnabled,
      };

      // 3. Get contacts with criteria
      const contacts = await this.contactRepository.findByCriteria(
        searchCriteria,
        limit + 1, // Get one extra to check if there are more
        offset
      );

      // 4. Check if there are more contacts
      const hasMore = contacts.length > limit;
      const resultContacts = hasMore ? contacts.slice(0, limit) : contacts;

      // 5. Get total count
      const totalCount = await this.contactRepository.countByCriteria(searchCriteria);

      // 6. Map to DTOs
      const contactDtos = resultContacts.map(contact => ({
        id: contact.id.value,
        phoneNumber: contact.phoneNumber.value,
        name: contact.name.value,
        responseDelay: contact.configuration.responseDelay,
        predefinedMessage: contact.configuration.predefinedMessage,
        isUrgent: contact.configuration.isUrgent,
        autoResponseEnabled: contact.configuration.autoResponseEnabled,
        createdAt: contact.createdAt,
        updatedAt: contact.updatedAt,
      }));

      return {
        success: true,
        message: 'Contacts retrieved successfully',
        data: {
          contacts: contactDtos,
          totalCount,
          hasMore,
        },
      };

    } catch (error) {
      this.logger.error('Error getting contacts', error as Error, { query });
      return {
        success: false,
        errors: ['Failed to retrieve contacts'],
      };
    }
  }
}