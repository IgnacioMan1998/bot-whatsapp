import { injectable } from 'inversify';
import { Message, Contact } from '@domain/entities';
import { DEFAULT_CONFIG } from '@shared/constants';

export interface AutoResponseService {
  shouldRespond(message: Message, contact: Contact): boolean;
  generateResponse(contact: Contact, message: Message): string;
  calculateResponseDelay(contact: Contact): number;
}

@injectable()
export class AutoResponseServiceImpl implements AutoResponseService {
  
  /**
   * Determines if an automatic response should be sent
   */
  shouldRespond(message: Message, contact: Contact): boolean {
    // Don't respond to outgoing messages
    if (!message.requiresAutoResponse()) {
      return false;
    }

    // Don't respond if contact is marked as urgent
    if (contact.isUrgent()) {
      return false;
    }

    // Don't respond if auto-response is disabled for this contact
    if (!contact.isAutoResponseEnabled()) {
      return false;
    }

    // Don't respond to group messages - CRITICAL SECURITY RULE
    if (message.isGroup) {
      // Log this for security auditing
      console.log(`[SECURITY] Auto-response blocked for group message from ${message.from.value}`);
      return false;
    }

    return true;
  }

  /**
   * Generates an appropriate response message
   */
  generateResponse(contact: Contact, message: Message): string {
    // Use predefined message if available
    const predefinedMessage = contact.getPredefinedMessage();
    if (predefinedMessage) {
      return this.personalizeMessage(predefinedMessage, contact, message);
    }

    // Use default message
    return this.personalizeMessage(DEFAULT_CONFIG.AUTO_MESSAGE, contact, message);
  }

  /**
   * Calculates the response delay for a contact
   */
  calculateResponseDelay(contact: Contact): number {
    return contact.getResponseDelay();
  }

  /**
   * Personalizes a message template with contact and message information
   */
  private personalizeMessage(template: string, contact: Contact, message: Message): string {
    let personalizedMessage = template;

    // Replace placeholders with actual values
    personalizedMessage = personalizedMessage.replace('{name}', contact.name.value);
    personalizedMessage = personalizedMessage.replace('{contact_name}', contact.name.value);
    
    // Add timestamp information
    const now = new Date();
    personalizedMessage = personalizedMessage.replace('{time}', now.toLocaleTimeString());
    personalizedMessage = personalizedMessage.replace('{date}', now.toLocaleDateString());

    // Add response delay information
    const delayMinutes = Math.ceil(contact.getResponseDelay() / 60);
    personalizedMessage = personalizedMessage.replace('{delay}', delayMinutes.toString());

    return personalizedMessage;
  }

  /**
   * Validates if a message template is valid
   */
  validateMessageTemplate(template: string): boolean {
    if (!template || template.trim().length === 0) {
      return false;
    }

    // Check for maximum length
    if (template.length > 1000) {
      return false;
    }

    // Check for valid placeholders (optional validation)
    const validPlaceholders = ['{name}', '{contact_name}', '{time}', '{date}', '{delay}'];
    const placeholderRegex = /\{([^}]+)\}/g;
    const matches = template.match(placeholderRegex);

    if (matches) {
      for (const match of matches) {
        if (!validPlaceholders.includes(match)) {
          // Invalid placeholder found, but we'll allow it for flexibility
          // In a stricter implementation, you might return false here
        }
      }
    }

    return true;
  }

  /**
   * Determines if a message should trigger an immediate response (bypass timer)
   */
  shouldRespondImmediately(message: Message, contact: Contact): boolean {
    // Respond immediately to certain keywords
    const immediateKeywords = ['ahora', 'now', 'inmediato', 'immediate'];
    const content = message.content.value.toLowerCase();
    
    return immediateKeywords.some(keyword => content.includes(keyword));
  }

  /**
   * Checks if the message content suggests urgency
   */
  detectUrgencyInMessage(message: Message): boolean {
    return message.isUrgent();
  }
}