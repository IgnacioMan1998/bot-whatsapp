import { inject, injectable } from 'inversify';
import { TYPES } from '@shared/constants';
import { Logger } from '@shared/utils/logger';
import { ContactRepository } from '@domain/index';
import { ContactId } from '@domain/value-objects';
import { UpdateContactConfigurationCommand, ContactResponse } from '@application/dtos';

export interface ConfigureNotificationPreferencesUseCase {
  execute(command: UpdateContactConfigurationCommand): Promise<ContactResponse>;
}

@injectable()
export class ConfigureNotificationPreferencesUseCaseImpl implements ConfigureNotificationPreferencesUseCase {
  constructor(
    @inject(TYPES.ContactRepository) private contactRepository: ContactRepository,
    @inject(TYPES.Logger) private logger: Logger
  ) {}

  async execute(command: UpdateContactConfigurationCommand): Promise<ContactResponse> {
    try {
      this.logger.info('Configuring notification preferences', { 
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

      // 2. Update urgent status (main notification preference)
      let updatedContact = existingContact;
      
      if (command.isUrgent !== undefined) {
        updatedContact = updatedContact.setUrgentStatus(command.isUrgent);
      }

      // 3. Update auto-response settings (affects notification behavior)
      if (command.autoResponseEnabled !== undefined) {
        if (command.autoResponseEnabled) {
          updatedContact = updatedContact.enableAutoResponse();
        } else {
          updatedContact = updatedContact.disableAutoResponse();
        }
      }

      // 4. Save updated contact
      await this.contactRepository.save(updatedContact);

      this.logger.info('Notification preferences updated successfully', { 
        contactId: command.contactId,
        isUrgent: updatedContact.isUrgent(),
        autoResponseEnabled: updatedContact.isAutoResponseEnabled() 
      });

      return {
        success: true,
        message: 'Notification preferences updated successfully',
        data: this.mapContactToDto(updatedContact),
      };

    } catch (error) {
      this.logger.error('Error configuring notification preferences', error as Error, { command });
      return {
        success: false,
        errors: ['Failed to configure notification preferences'],
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