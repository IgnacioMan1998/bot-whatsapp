import { injectable } from 'inversify';
import { Message, Contact } from '@domain/entities';

export interface UrgentNotification {
  messageId: string;
  contactId: string;
  contactName: string;
  messageContent: string;
  timestamp: Date;
  urgencyLevel: 'high' | 'medium' | 'low';
}

export interface NotificationService {
  isUrgent(message: Message, contact: Contact): boolean;
  sendUrgentNotification(message: Message, contact: Contact): Promise<void>;
  determineUrgencyLevel(message: Message, contact: Contact): 'high' | 'medium' | 'low';
}

@injectable()
export class NotificationServiceImpl implements NotificationService {

  /**
   * Determines if a message should be considered urgent
   */
  isUrgent(message: Message, contact: Contact): boolean {
    // Contact is marked as urgent
    if (contact.isUrgent()) {
      return true;
    }

    // Message contains urgent keywords
    if (message.isUrgent()) {
      return true;
    }

    // Message is from a VIP contact (could be extended with VIP logic)
    if (this.isVipContact(contact)) {
      return true;
    }

    // Multiple messages in short time (could be implemented with message history)
    // This would require checking recent message frequency

    return false;
  }

  /**
   * Sends an urgent notification to the user
   */
  async sendUrgentNotification(message: Message, contact: Contact): Promise<void> {
    const notification: UrgentNotification = {
      messageId: message.id.value,
      contactId: contact.id.value,
      contactName: contact.name.value,
      messageContent: message.content.value,
      timestamp: message.timestamp,
      urgencyLevel: this.determineUrgencyLevel(message, contact),
    };

    // In a real implementation, this would send notifications via:
    // - Push notifications
    // - Email
    // - SMS
    // - Desktop notifications
    // - Webhook calls
    
    console.log('🚨 URGENT MESSAGE NOTIFICATION:', {
      from: notification.contactName,
      content: notification.messageContent.substring(0, 100) + '...',
      urgencyLevel: notification.urgencyLevel,
      timestamp: notification.timestamp.toISOString(),
    });

    // TODO: Implement actual notification mechanisms
    // await this.sendPushNotification(notification);
    // await this.sendEmailNotification(notification);
    // await this.sendDesktopNotification(notification);
  }

  /**
   * Determines the urgency level of a message
   */
  determineUrgencyLevel(message: Message, contact: Contact): 'high' | 'medium' | 'low' {
    let urgencyScore = 0;

    // Contact-based urgency
    if (contact.isUrgent()) {
      urgencyScore += 3;
    }

    // Message content-based urgency
    const content = message.content.value.toLowerCase();
    
    // High urgency keywords
    const highUrgencyKeywords = [
      'emergencia', 'emergency', 'urgente', 'urgent', 'ayuda', 'help',
      'socorro', 'sos', 'hospital', 'accidente', 'accident'
    ];
    
    // Medium urgency keywords
    const mediumUrgencyKeywords = [
      'importante', 'important', 'pronto', 'soon', 'rapido', 'quick',
      'necesito', 'need', 'problema', 'problem'
    ];

    if (highUrgencyKeywords.some(keyword => content.includes(keyword))) {
      urgencyScore += 4;
    } else if (mediumUrgencyKeywords.some(keyword => content.includes(keyword))) {
      urgencyScore += 2;
    }

    // Multiple exclamation marks or caps
    if (content.includes('!!!') || content === content.toUpperCase()) {
      urgencyScore += 1;
    }

    // Time-based urgency (late night/early morning messages might be more urgent)
    const hour = message.timestamp.getHours();
    if (hour < 6 || hour > 22) {
      urgencyScore += 1;
    }

    // Determine final urgency level
    if (urgencyScore >= 5) {
      return 'high';
    } else if (urgencyScore >= 2) {
      return 'medium';
    } else {
      return 'low';
    }
  }

  /**
   * Checks if a contact should be considered VIP
   */
  private isVipContact(contact: Contact): boolean {
    // This could be extended with VIP logic:
    // - Contacts marked as VIP
    // - Contacts with high message frequency
    // - Family members
    // - Work contacts during work hours
    
    const vipKeywords = ['jefe', 'boss', 'director', 'manager', 'familia', 'family', 'mama', 'papa', 'mom', 'dad'];
    const contactName = contact.name.value.toLowerCase();
    
    return vipKeywords.some(keyword => contactName.includes(keyword));
  }

  /**
   * Analyzes message patterns to detect urgency
   */
  analyzeMessagePatterns(message: Message): {
    hasUrgentKeywords: boolean;
    hasExcessivePunctuation: boolean;
    isAllCaps: boolean;
    isOutsideBusinessHours: boolean;
  } {
    const content = message.content.value;
    const hour = message.timestamp.getHours();

    return {
      hasUrgentKeywords: message.isUrgent(),
      hasExcessivePunctuation: /[!?]{2,}/.test(content),
      isAllCaps: content.length > 10 && content === content.toUpperCase(),
      isOutsideBusinessHours: hour < 8 || hour > 18,
    };
  }

  /**
   * Creates a notification summary for multiple urgent messages
   */
  createNotificationSummary(notifications: UrgentNotification[]): string {
    if (notifications.length === 0) {
      return 'No urgent messages';
    }

    if (notifications.length === 1) {
      const notif = notifications[0];
      return `Mensaje urgente de ${notif.contactName}: ${notif.messageContent.substring(0, 50)}...`;
    }

    const highUrgency = notifications.filter(n => n.urgencyLevel === 'high').length;
    const mediumUrgency = notifications.filter(n => n.urgencyLevel === 'medium').length;
    
    return `${notifications.length} mensajes urgentes (${highUrgency} alta prioridad, ${mediumUrgency} media prioridad)`;
  }
}