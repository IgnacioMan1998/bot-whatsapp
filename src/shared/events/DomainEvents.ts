import { v4 as uuidv4 } from 'uuid';
import { DomainEvent } from './EventBus';

// Base class for domain events
export abstract class BaseDomainEvent implements DomainEvent {
  public readonly eventId: string;
  public readonly timestamp: Date;
  public readonly version: number;

  constructor(
    public readonly eventType: string,
    public readonly aggregateId: string,
    public readonly data: any,
    version: number = 1
  ) {
    this.eventId = uuidv4();
    this.timestamp = new Date();
    this.version = version;
  }
}

// Message Events
export class MessageReceivedEvent extends BaseDomainEvent {
  constructor(
    messageId: string,
    data: {
      from: string;
      to: string;
      content: string;
      timestamp: Date;
      isGroup: boolean;
    }
  ) {
    super('MessageReceived', messageId, data);
  }
}

export class MessageSentEvent extends BaseDomainEvent {
  constructor(
    messageId: string,
    data: {
      from: string;
      to: string;
      content: string;
      timestamp: Date;
      isGroup: boolean;
    }
  ) {
    super('MessageSent', messageId, data);
  }
}

export class UrgentMessageDetectedEvent extends BaseDomainEvent {
  constructor(
    messageId: string,
    data: {
      contactId: string;
      messageContent: string;
      urgencyLevel: 'high' | 'medium' | 'low';
      timestamp: Date;
    }
  ) {
    super('UrgentMessageDetected', messageId, data);
  }
}

// Timer Events
export class AutoResponseTimerStartedEvent extends BaseDomainEvent {
  constructor(
    timerId: string,
    data: {
      contactId: string;
      messageId: string;
      delayInSeconds: number;
      expiresAt: Date;
    }
  ) {
    super('AutoResponseTimerStarted', timerId, data);
  }
}

export class AutoResponseTimerExpiredEvent extends BaseDomainEvent {
  constructor(
    timerId: string,
    data: {
      contactId: string;
      messageId: string;
      expiredAt: Date;
    }
  ) {
    super('AutoResponseTimerExpired', timerId, data);
  }
}

export class AutoResponseTimerCancelledEvent extends BaseDomainEvent {
  constructor(
    timerId: string,
    data: {
      contactId: string;
      messageId: string;
      cancelledAt: Date;
      reason: string;
    }
  ) {
    super('AutoResponseTimerCancelled', timerId, data);
  }
}

// Contact Events
export class ContactCreatedEvent extends BaseDomainEvent {
  constructor(
    contactId: string,
    data: {
      phoneNumber: string;
      name: string;
      configuration: {
        responseDelay: number;
        predefinedMessage?: string;
        isUrgent: boolean;
        autoResponseEnabled: boolean;
      };
    }
  ) {
    super('ContactCreated', contactId, data);
  }
}

export class ContactUpdatedEvent extends BaseDomainEvent {
  constructor(
    contactId: string,
    data: {
      changes: Record<string, any>;
      previousValues: Record<string, any>;
    }
  ) {
    super('ContactUpdated', contactId, data);
  }
}

// Auto Response Events
export class AutoResponseSentEvent extends BaseDomainEvent {
  constructor(
    messageId: string,
    data: {
      originalMessageId: string;
      contactId: string;
      responseContent: string;
      sentAt: Date;
    }
  ) {
    super('AutoResponseSent', messageId, data);
  }
}

// Notification Events
export class NotificationSentEvent extends BaseDomainEvent {
  constructor(
    notificationId: string,
    data: {
      messageId: string;
      contactId: string;
      urgencyLevel: 'high' | 'medium' | 'low';
      notificationType: string;
      sentAt: Date;
    }
  ) {
    super('NotificationSent', notificationId, data);
  }
}

// System Events
export class WhatsAppConnectedEvent extends BaseDomainEvent {
  constructor(
    sessionId: string,
    data: {
      connectedAt: Date;
      clientInfo: {
        pushname: string;
        wid: string;
        phone: string;
      };
    }
  ) {
    super('WhatsAppConnected', sessionId, data);
  }
}

export class WhatsAppDisconnectedEvent extends BaseDomainEvent {
  constructor(
    sessionId: string,
    data: {
      disconnectedAt: Date;
      reason: string;
    }
  ) {
    super('WhatsAppDisconnected', sessionId, data);
  }
}