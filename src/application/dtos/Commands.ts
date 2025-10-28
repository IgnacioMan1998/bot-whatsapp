// Message Commands
export interface ProcessIncomingMessageCommand {
  messageId?: string;
  from: string;
  to: string;
  content: string;
  timestamp: Date;
  isGroup?: boolean;
}

export interface ProcessOutgoingMessageCommand {
  messageId?: string;
  from: string;
  to: string;
  content: string;
  timestamp: Date;
  isGroup?: boolean;
}

// Contact Commands
export interface ConfigureContactCommand {
  contactId?: string;
  phoneNumber: string;
  name: string;
  responseDelay: number;
  predefinedMessage?: string;
  isUrgent: boolean;
  autoResponseEnabled: boolean;
}

export interface UpdateContactConfigurationCommand {
  contactId: string;
  responseDelay?: number;
  predefinedMessage?: string;
  isUrgent?: boolean;
  autoResponseEnabled?: boolean;
}

// Timer Commands
export interface StartTimerCommand {
  contactId: string;
  messageId: string;
  delayInSeconds: number;
}

export interface CancelTimerCommand {
  contactId: string;
}

export interface HandleTimerExpirationCommand {
  timerId: string;
  contactId: string;
  messageId: string;
}

// Notification Commands
export interface SendNotificationCommand {
  messageId: string;
  contactId: string;
  urgencyLevel: 'high' | 'medium' | 'low';
}