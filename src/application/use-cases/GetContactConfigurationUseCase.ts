import { inject, injectable } from 'inversify';
import { TYPES } from '@shared/constants';
import { Logger } from '@shared/utils/logger';
import { ContactRepository } from '@domain/index';
import { ContactId, PhoneNumber } from '@domain/value-objects';
import { GetContactQuery, ContactResponse } from '@application/dtos';

export interface GetContactConfigurationUseCase {
  execute(query: GetContactQuery): Promise<ContactResponse>;
}

@injectable()
export class GetContactConfigurationUseCaseImpl implements GetContactConfigurationUseCase {
  constructor(
    @inject(TYPES.ContactRepository) private contactRepository: ContactRepository,
    @inject(TYPES.Logger) private logger: Logger
  ) {}

  async execute(query: GetContactQuery): Promise<ContactResponse> {
    try {
      this.logger.info('Getting contact configuration', { 
        contactId: query.contactId,
        phoneNumber: query.phoneNumber 
      });

      // 1. Find contact by ID or phone number
      let contact;
      
      if (query.contactId) {
        const contactId = ContactId.fromString(query.contactId);
        contact = await this.contactRepository.findById(contactId);
      } else if (query.phoneNumber) {
        const phoneNumber = PhoneNumber.fromString(query.phoneNumber);
        contact = await this.contactRepository.findByPhoneNumber(phoneNumber);
      } else {
        return {
          success: false,
          errors: ['Either contactId or phoneNumber must be provided'],
        };
      }

      if (!contact) {
        return {
          success: false,
          errors: ['Contact not found'],
        };
      }

      return {
        success: true,
        message: 'Contact configuration retrieved successfully',
        data: this.mapContactToDto(contact),
      };

    } catch (error) {
      this.logger.error('Error getting contact configuration', error as Error, { query });
      return {
        success: false,
        errors: ['Failed to retrieve contact configuration'],
      };
    }
  }

  private mapContactToDto(contact: any) {
    return {
      id: contact.id.value,
      phoneNumber: contact.phoneNumber.value,
      name: contact.name.value,
      responseDelay: contact.configuration.responseDelay,
      predefinedMessage: contact.configuration.predefinedMessage,
      isUrgent: contact.configuration.isUrgent,
      autoResponseEnabled: contact.configuration.autoResponseEnabled,
      createdAt: contact.createdAt,
      updatedAt: contact.updatedAt,
    };
  }
}