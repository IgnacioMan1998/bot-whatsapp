export interface DomainEvent {
  readonly eventId: string;
  readonly eventType: string;
  readonly aggregateId: string;
  readonly occurredAt: Date;
  readonly version: number;
  readonly data: any;
}

export abstract class BaseDomainEvent implements DomainEvent {
  public readonly eventId: string;
  public readonly eventType: string;
  public readonly aggregateId: string;
  public readonly occurredAt: Date;
  public readonly version: number;
  public readonly data: any;

  constructor(
    eventType: string,
    aggregateId: string,
    data: any,
    version: number = 1
  ) {
    this.eventId = this.generateEventId();
    this.eventType = eventType;
    this.aggregateId = aggregateId;
    this.occurredAt = new Date();
    this.version = version;
    this.data = data;
  }

  private generateEventId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}

// Message Events
export class MessageReceivedEvent extends BaseDomainEvent {
  constructor(messageId: string, data: {
    from: string;
    to: string;
    content: string;
    timestamp: Date;
    isGroup: boolean;
  }) {
    super('MessageReceived', messageId, data);
  }
}

export class MessageSentEvent extends BaseDomainEvent {
  constructor(messageId: string, data: {
    from: string;
    to: string;
    content: string;
    timestamp: Date;
    isGroup: boolean;
  }) {
    super('MessageSent', messageId, data);
  }
}

export class AutoResponseTriggeredEvent extends BaseDomainEvent {
  constructor(contactId: string, data: {
    messageId: string;
    responseMessage: string;
    delayInSeconds: number;
  }) {
    super('AutoResponseTriggered', contactId, data);
  }
}

// Timer Events
export class TimerStartedEvent extends BaseDomainEvent {
  constructor(timerId: string, data: {
    contactId: string;
    messageId: string;
    expiresAt: Date;
  }) {
    super('TimerStarted', timerId, data);
  }
}

export class TimerExpiredEvent extends BaseDomainEvent {
  constructor(timerId: string, data: {
    contactId: string;
    messageId: string;
    expiredAt: Date;
  }) {
    super('TimerExpired', timerId, data);
  }
}

export class TimerCancelledEvent extends BaseDomainEvent {
  constructor(timerId: string, data: {
    contactId: string;
    cancelledAt: Date;
    reason: string;
  }) {
    super('TimerCancelled', timerId, data);
  }
}

// Contact Events
export class ContactCreatedEvent extends BaseDomainEvent {
  constructor(contactId: string, data: {
    phoneNumber: string;
    name: string;
    configuration: any;
  }) {
    super('ContactCreated', contactId, data);
  }
}

export class ContactUpdatedEvent extends BaseDomainEvent {
  constructor(contactId: string, data: {
    changes: any;
    updatedAt: Date;
  }) {
    super('ContactUpdated', contactId, data);
  }
}

// Notification Events
export class UrgentMessageDetectedEvent extends BaseDomainEvent {
  constructor(messageId: string, data: {
    contactId: string;
    urgencyLevel: 'high' | 'medium' | 'low';
    content: string;
  }) {
    super('UrgentMessageDetected', messageId, data);
  }
}

export class NotificationSentEvent extends BaseDomainEvent {
  constructor(notificationId: string, data: {
    messageId: string;
    contactId: string;
    notificationType: string;
    sentAt: Date;
  }) {
    super('NotificationSent', notificationId, data);
  }
}