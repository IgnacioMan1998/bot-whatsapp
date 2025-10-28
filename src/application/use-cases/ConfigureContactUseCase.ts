import { inject, injectable } from 'inversify';
import { TYPES } from '@shared/constants';
import { Logger } from '@shared/utils/logger';
import { Contact, ContactRepository, MessageValidationServiceImpl } from '@domain/index';
import {
  ContactId,
  PhoneNumber,
  ContactName,
  ContactConfiguration
} from '@domain/value-objects';
import { ConfigureContactCommand, ContactResponse } from '@application/dtos';

export interface ConfigureContactUseCase {
  execute(command: ConfigureContactCommand): Promise<ContactResponse>;
}

@injectable()
export class ConfigureContactUseCaseImpl implements ConfigureContactUseCase {
  constructor(
    @inject(TYPES.ContactRepository) private contactRepository: ContactRepository,
    @inject(TYPES.Logger) private logger: Logger
  ) {}

  async execute(command: ConfigureContactCommand): Promise<ContactResponse> {
    try {
      this.logger.info('Configuring contact', { 
        phoneNumber: command.phoneNumber,
        name: command.name 
      });

      // 1. Create or update contact
      let contact: Contact;
      
      if (command.contactId) {
        // Update existing contact
        contact = await this.updateExistingContact(command);
      } else {
        // Create new contact
        contact = await this.createNewContact(command);
      }

      // 2. Validate contact
      const validationService = new MessageValidationServiceImpl();
      const validation = validationService.validateContact(contact);
      
      if (!validation.isValid) {
        return {
          success: false,
          errors: validation.errors,
        };
      }

      // 3. Save contact
      await this.contactRepository.save(contact);

      this.logger.info('Contact configured successfully', { 
        contactId: contact.id.value,
        phoneNumber: command.phoneNumber 
      });

      return {
        success: true,
        message: 'Contact configured successfully',
        data: this.mapContactToDto(contact),
      };

    } catch (error) {
      this.logger.error('Error configuring contact', error as Error, { command });
      return {
        success: false,
        errors: ['Failed to configure contact'],
      };
    }
  }

  private async updateExistingContact(command: ConfigureContactCommand): Promise<Contact> {
    const contactId = ContactId.fromString(command.contactId!);
    const existingContact = await this.contactRepository.findById(contactId);
    
    if (!existingContact) {
      throw new Error('Contact not found');
    }

    // Update contact properties
    let updatedContact = existingContact;

    // Update name if provided
    if (command.name !== existingContact.name.value) {
      const newName = ContactName.fromString(command.name);
      updatedContact = updatedContact.updateName(newName);
    }

    // Update configuration
    const newConfiguration = new ContactConfiguration({
      responseDelay: command.responseDelay,
      predefinedMessage: command.predefinedMessage,
      isUrgent: command.isUrgent,
      autoResponseEnabled: command.autoResponseEnabled,
    });

    if (!newConfiguration.equals(existingContact.configuration)) {
      updatedContact = updatedContact.updateConfiguration(newConfiguration);
    }

    return updatedContact;
  }

  private async createNewContact(command: ConfigureContactCommand): Promise<Contact> {
    const phoneNumber = PhoneNumber.fromString(command.phoneNumber);
    
    // Check if contact already exists
    const existingContact = await this.contactRepository.findByPhoneNumber(phoneNumber);
    if (existingContact) {
      throw new Error('Contact with this phone number already exists');
    }

    const name = ContactName.fromString(command.name);
    const configuration = new ContactConfiguration({
      responseDelay: command.responseDelay,
      predefinedMessage: command.predefinedMessage,
      isUrgent: command.isUrgent,
      autoResponseEnabled: command.autoResponseEnabled,
    });

    return Contact.create(phoneNumber, name, configuration);
  }

  private mapContactToDto(contact: Contact) {
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