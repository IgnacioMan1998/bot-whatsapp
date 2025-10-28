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
    // Check if it's a media message that requires special handling
    const mediaResponse = this.getMediaSpecificResponse(message);
    if (mediaResponse) {
      return this.personalizeMessage(mediaResponse, contact, message);
    }

    // Use predefined message if available
    const predefinedMessage = contact.getPredefinedMessage();
    if (predefinedMessage) {
      return this.personalizeMessage(predefinedMessage, contact, message);
    }

    // Use default message
    return this.personalizeMessage(DEFAULT_CONFIG.AUTO_MESSAGE, contact, message);
  }

  /**
   * Gets specific response for media messages
   */
  private getMediaSpecificResponse(message: Message): string | null {
    // Check if message has media information
    const messageContent = message.content.value;

    // Check for media types that need special responses
    if (messageContent.includes('[Audio]')) {
      return process.env.AUDIO_RESPONSE_MESSAGE || 'Recibí tu audio. En unos minutos te respondo.';
    }

    if (messageContent.includes('[Video]')) {
      return process.env.VIDEO_RESPONSE_MESSAGE || 'Recibí tu video. En unos minutos te respondo.';
    }

    if (messageContent.includes('[Documento]')) {
      return (
        process.env.DOCUMENT_RESPONSE_MESSAGE || 'Recibí tu documento. En unos minutos te respondo.'
      );
    }

    if (messageContent.includes('[Imagen]')) {
      return process.env.IMAGE_RESPONSE_MESSAGE || 'Vi tu imagen. Te respondo en un momento.';
    }

    if (messageContent.includes('[Sticker]')) {
      return process.env.STICKER_RESPONSE_MESSAGE || 'Gracias por el sticker! Te respondo pronto.';
    }

    if (messageContent.includes('[Ubicación]')) {
      return process.env.LOCATION_RESPONSE_MESSAGE || 'Recibí tu ubicación. Te contacto pronto.';
    }

    if (messageContent.includes('[Contacto]')) {
      return 'Gracias por compartir el contacto. Te respondo en breve.';
    }

    return null;
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

    // Replace media type placeholder
    const mediaType = this.getMediaTypeFromMessage(message);
    personalizedMessage = personalizedMessage.replace('{media_type}', mediaType);

    return personalizedMessage;
  }

  /**
   * Extracts media type from message content for personalization
   */
  private getMediaTypeFromMessage(message: Message): string {
    const content = message.content.value;

    if (content.includes('[Audio]')) return 'audio';
    if (content.includes('[Video]')) return 'video';
    if (content.includes('[Documento]')) return 'documento';
    if (content.includes('[Imagen]')) return 'imagen';
    if (content.includes('[Sticker]')) return 'sticker';
    if (content.includes('[Ubicación]')) return 'ubicación';
    if (content.includes('[Contacto]')) return 'contacto';

    return 'mensaje';
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

    return immediateKeywords.some((keyword) => content.includes(keyword));
  }

  /**
   * Checks if the message content suggests urgency
   */
  detectUrgencyInMessage(message: Message): boolean {
    return message.isUrgent();
  }
}
