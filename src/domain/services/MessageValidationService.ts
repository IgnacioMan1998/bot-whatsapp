import { injectable } from 'inversify';
import { Message, Contact } from '@domain/entities';
import { MessageContent, ContactConfiguration } from '@domain/value-objects';
import { DomainError } from '@shared/types';

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export interface MessageValidationService {
  validateMessage(message: Message): ValidationResult;
  validateContact(contact: Contact): ValidationResult;
  validateAutoResponse(message: Message, contact: Contact): ValidationResult;
  validateMessageContent(content: string): ValidationResult;
  validateContactConfiguration(config: ContactConfiguration): ValidationResult;
}

@injectable()
export class MessageValidationServiceImpl implements MessageValidationService {

  /**
   * Validates a message entity
   */
  validateMessage(message: Message): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Validate message content
    if (message.content.isEmpty()) {
      errors.push('Message content cannot be empty');
    }

    // Validate timestamp
    const now = new Date();
    if (message.timestamp > now) {
      errors.push('Message timestamp cannot be in the future');
    }

    // Check for very old messages
    const oneYearAgo = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
    if (message.timestamp < oneYearAgo) {
      warnings.push('Message is older than one year');
    }

    // Validate message length
    if (message.content.length() > 4096) {
      warnings.push('Message is very long and might be truncated');
    }

    // Check for suspicious content
    if (this.containsSuspiciousContent(message.content)) {
      warnings.push('Message contains potentially suspicious content');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Validates a contact entity
   */
  validateContact(contact: Contact): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Validate phone number format
    if (!this.isValidPhoneNumberFormat(contact.phoneNumber.value)) {
      errors.push('Invalid phone number format');
    }

    // Validate name
    if (contact.name.value.length < 1) {
      errors.push('Contact name cannot be empty');
    }

    // Validate configuration
    const configValidation = this.validateContactConfiguration(contact.configuration);
    errors.push(...configValidation.errors);
    warnings.push(...configValidation.warnings);

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Validates auto-response rules
   */
  validateAutoResponse(message: Message, contact: Contact): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Check if auto-response is appropriate
    if (message.isGroup && contact.shouldAutoRespond()) {
      warnings.push('Auto-response is enabled for group messages');
    }

    // Check response delay
    const delay = contact.getResponseDelay();
    if (delay < 10) {
      warnings.push('Response delay is very short (less than 10 seconds)');
    }

    if (delay > 3600) {
      warnings.push('Response delay is very long (more than 1 hour)');
    }

    // Check for conflicting settings
    if (contact.isUrgent() && contact.shouldAutoRespond()) {
      warnings.push('Contact is marked as urgent but has auto-response enabled');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Validates message content string
   */
  validateMessageContent(content: string): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    try {
      // Try to create MessageContent to validate
      new MessageContent(content);
    } catch (error) {
      if (error instanceof DomainError) {
        errors.push(error.message);
      } else {
        errors.push('Invalid message content');
      }
    }

    // Additional content checks
    if (content.length > 1000) {
      warnings.push('Message content is very long');
    }

    if (this.containsOnlyEmojis(content)) {
      warnings.push('Message contains only emojis');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Validates contact configuration
   */
  validateContactConfiguration(config: ContactConfiguration): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Validate response delay
    if (config.responseDelay < 0) {
      errors.push('Response delay cannot be negative');
    }

    if (config.responseDelay > 86400) {
      errors.push('Response delay cannot exceed 24 hours');
    }

    // Validate predefined message
    if (config.predefinedMessage) {
      const messageValidation = this.validateMessageContent(config.predefinedMessage);
      errors.push(...messageValidation.errors.map(e => `Predefined message: ${e}`));
      warnings.push(...messageValidation.warnings.map(w => `Predefined message: ${w}`));
    }

    // Business rule validations
    if (config.isUrgent && config.autoResponseEnabled) {
      warnings.push('Urgent contacts typically should not have auto-response enabled');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Checks if phone number format is valid
   */
  private isValidPhoneNumberFormat(phoneNumber: string): boolean {
    // Basic international phone number validation
    const phoneRegex = /^\+\d{7,15}$/;
    return phoneRegex.test(phoneNumber);
  }

  /**
   * Checks for suspicious content in messages
   */
  private containsSuspiciousContent(content: MessageContent): boolean {
    const suspiciousPatterns = [
      /https?:\/\/[^\s]+/i, // URLs
      /\b\d{4}\s?\d{4}\s?\d{4}\s?\d{4}\b/, // Credit card patterns
      /\b\d{3}-?\d{2}-?\d{4}\b/, // SSN patterns
    ];

    return suspiciousPatterns.some(pattern => pattern.test(content.value));
  }

  /**
   * Checks if content contains only emojis
   */
  private containsOnlyEmojis(content: string): boolean {
    // Simple emoji detection - in production, use a proper emoji library
    const emojiRegex = /^[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\s]*$/u;
    return emojiRegex.test(content.trim());
  }

  /**
   * Validates business rules for message processing
   */
  validateMessageProcessingRules(message: Message, contact: Contact): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Rule: Don't auto-respond to very recent messages from the same contact
    // This would require message history to implement properly

    // Rule: Don't auto-respond during certain hours if configured
    const hour = new Date().getHours();
    if (contact.shouldAutoRespond() && (hour < 6 || hour > 23)) {
      warnings.push('Auto-response during night hours');
    }

    // Rule: Check for message frequency
    // This would require implementing rate limiting logic

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }
}