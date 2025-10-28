// Application constants
export const TYPES = {
  // Domain
  MessageRepository: Symbol.for('MessageRepository'),
  ContactRepository: Symbol.for('ContactRepository'),
  TimerRepository: Symbol.for('TimerRepository'),
  AutoResponseService: Symbol.for('AutoResponseService'),
  NotificationService: Symbol.for('NotificationService'),

  // Application
  ProcessIncomingMessageUseCase: Symbol.for('ProcessIncomingMessageUseCase'),
  ProcessOutgoingMessageUseCase: Symbol.for('ProcessOutgoingMessageUseCase'),
  ConfigureContactUseCase: Symbol.for('ConfigureContactUseCase'),
  StartAutoResponseTimerUseCase: Symbol.for('StartAutoResponseTimerUseCase'),
  HandleTimerExpirationUseCase: Symbol.for('HandleTimerExpirationUseCase'),
  CancelAutoResponseTimerUseCase: Symbol.for('CancelAutoResponseTimerUseCase'),
  GetActiveTimersUseCase: Symbol.for('GetActiveTimersUseCase'),
  ProcessUrgentMessageUseCase: Symbol.for('ProcessUrgentMessageUseCase'),
  SendNotificationUseCase: Symbol.for('SendNotificationUseCase'),
  ConfigureNotificationPreferencesUseCase: Symbol.for('ConfigureNotificationPreferencesUseCase'),
  GetMessageHistoryUseCase: Symbol.for('GetMessageHistoryUseCase'),
  GetContactConfigurationUseCase: Symbol.for('GetContactConfigurationUseCase'),
  UpdateContactConfigurationUseCase: Symbol.for('UpdateContactConfigurationUseCase'),
  GetContactsUseCase: Symbol.for('GetContactsUseCase'),

  // Infrastructure
  DatabaseAdapter: Symbol.for('DatabaseAdapter'),
  WhatsAppPort: Symbol.for('WhatsAppPort'),
  FileSystemPort: Symbol.for('FileSystemPort'),
  Logger: Symbol.for('Logger'),
  Config: Symbol.for('Config'),

  // Presentation
  MessageController: Symbol.for('MessageController'),
  ContactController: Symbol.for('ContactController'),
  SystemController: Symbol.for('SystemController'),
} as const;

export const MESSAGE_TYPES = {
  INCOMING: 'incoming',
  OUTGOING: 'outgoing',
} as const;

export const DATABASE_TYPES = {
  SQLITE: 'sqlite',
  POSTGRESQL: 'postgresql',
} as const;

export const DEFAULT_CONFIG = {
  RESPONSE_DELAY: 60, // seconds
  AUTO_MESSAGE: 'Hola! Este es un mensaje automático. Te responderé pronto.',
  DATABASE_PATH: './data/assistant.db',
  SERVER_PORT: 3000,
  SERVER_HOST: 'localhost',
} as const;