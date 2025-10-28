import { inject, injectable } from 'inversify';
import { TYPES } from '@shared/constants';
import { Logger } from '@shared/utils/logger';
import { ContactRepository, MessageValidationServiceImpl } from '@domain/index';
import { ContactId, ContactConfiguration } from '@domain/value-objects';
import { UpdateContactConfigurationCommand, ContactResponse } from '@application/dtos';

export interface UpdateContactConfigurationUseCase {
  execute(command: UpdateContactConfigurationCommand): Promise<ContactResponse>;
}

@injectable()
export class UpdateContactConfigurationUseCaseImpl implements UpdateContactConfigurationUseCase {
  constructor(
    @inject(TYPES.ContactRepository) private contactRepository: ContactRepository,
    @inject(TYPES.Logger) private logger: Logger
  ) {}

  async execute(command: UpdateContactConfigurationCommand): Promise<ContactResponse> {
    try {
      this.logger.info('Updating contact configuration', { 
        contactId: command.contactId 
      });

      // 1. Find existing contact
      const contactId = ContactId.fromString(command.contactId);
      const existingContact = await this.contactRepository.findById(contactId);
      
      if (!existingContact) {
        return {
          success: false,
          errors: ['Contact not found'],
        };
      }

      // 2. Create updated configuration
      const currentConfig = existingContact.configuration;
      const updatedConfiguration = new ContactConfiguration({
        responseDelay: command.responseDelay ?? currentConfig.responseDelay,
        predefinedMessage: command.predefinedMessage !== undefined 
          ? command.predefinedMessage 
          : currentConfig.predefinedMessage,
        isUrgent: command.isUrgent ?? currentConfig.isUrgent,
        autoResponseEnabled: command.autoResponseEnabled ?? currentConfig.autoResponseEnabled,
      });

      // 3. Update contact with new configuration
      const updatedContact = existingContact.updateConfiguration(updatedConfiguration);

      // 4. Validate updated contact
      const validationService = new MessageValidationServiceImpl();
      const validation = validationService.validateContact(updatedContact);
      
      if (!validation.isValid) {
        return {
          success: false,
          errors: validation.errors,
        };
      }

      // 5. Save updated contact
      await this.contactRepository.save(updatedContact);

      this.logger.info('Contact configuration updated successfully', { 
        contactId: command.contactId 
      });

      return {
        success: true,
        message: 'Contact configuration updated successfully',
        data: this.mapContactToDto(updatedContact),
      };

    } catch (error) {
      this.logger.error('Error updating contact configuration', error as Error, { command });
      return {
        success: false,
        errors: ['Failed to update contact configuration'],
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