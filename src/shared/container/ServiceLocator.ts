import { Container } from 'inversify';
import { TYPES } from '@shared/constants';
import { Logger } from '@shared/utils/logger';
import { AppConfig } from '@shared/types';

// Domain Services
import {
  AutoResponseService,
  NotificationService,
} from '@domain/services';

// Application Use Cases
import {
  ProcessIncomingMessageUseCase,
  ProcessOutgoingMessageUseCase,
  GetMessageHistoryUseCase,
  ConfigureContactUseCase,
  GetContactConfigurationUseCase,
  UpdateContactConfigurationUseCase,
  GetContactsUseCase,
  StartAutoResponseTimerUseCase,
  HandleTimerExpirationUseCase,
  CancelAutoResponseTimerUseCase,
  GetActiveTimersUseCase,
  ProcessUrgentMessageUseCase,
  SendNotificationUseCase,
  ConfigureNotificationPreferencesUseCase,
} from '@application/use-cases';

// Domain Repositories
import {
  MessageRepository,
  ContactRepository,
  TimerRepository,
} from '@domain/repositories';

// Infrastructure
import { DatabaseAdapter } from '@infrastructure/database';
import { WhatsAppPort } from '@application/ports';

// Presentation Controllers
import {
  MessageController,
  ContactController,
  SystemController,
} from '@presentation/controllers';

export class ServiceLocator {
  private static container: Container;

  public static setContainer(container: Container): void {
    ServiceLocator.container = container;
  }

  // Shared Services
  public static getLogger(): Logger {
    return ServiceLocator.container.get<Logger>(TYPES.Logger);
  }

  public static getConfig(): AppConfig {
    return ServiceLocator.container.get<AppConfig>(TYPES.Config);
  }

  // Infrastructure Services
  public static getDatabaseAdapter(): DatabaseAdapter {
    return ServiceLocator.container.get<DatabaseAdapter>(TYPES.DatabaseAdapter);
  }

  public static getWhatsAppPort(): WhatsAppPort {
    return ServiceLocator.container.get<WhatsAppPort>(TYPES.WhatsAppPort);
  }

  // Domain Services
  public static getAutoResponseService(): AutoResponseService {
    return ServiceLocator.container.get<AutoResponseService>(TYPES.AutoResponseService);
  }

  public static getNotificationService(): NotificationService {
    return ServiceLocator.container.get<NotificationService>(TYPES.NotificationService);
  }

  // Repositories
  public static getMessageRepository(): MessageRepository {
    return ServiceLocator.container.get<MessageRepository>(TYPES.MessageRepository);
  }

  public static getContactRepository(): ContactRepository {
    return ServiceLocator.container.get<ContactRepository>(TYPES.ContactRepository);
  }

  public static getTimerRepository(): TimerRepository {
    return ServiceLocator.container.get<TimerRepository>(TYPES.TimerRepository);
  }

  // Message Use Cases
  public static getProcessIncomingMessageUseCase(): ProcessIncomingMessageUseCase {
    return ServiceLocator.container.get<ProcessIncomingMessageUseCase>(TYPES.ProcessIncomingMessageUseCase);
  }

  public static getProcessOutgoingMessageUseCase(): ProcessOutgoingMessageUseCase {
    return ServiceLocator.container.get<ProcessOutgoingMessageUseCase>(TYPES.ProcessOutgoingMessageUseCase);
  }

  public static getGetMessageHistoryUseCase(): GetMessageHistoryUseCase {
    return ServiceLocator.container.get<GetMessageHistoryUseCase>(TYPES.GetMessageHistoryUseCase);
  }

  // Contact Use Cases
  public static getConfigureContactUseCase(): ConfigureContactUseCase {
    return ServiceLocator.container.get<ConfigureContactUseCase>(TYPES.ConfigureContactUseCase);
  }

  public static getGetContactConfigurationUseCase(): GetContactConfigurationUseCase {
    return ServiceLocator.container.get<GetContactConfigurationUseCase>(TYPES.GetContactConfigurationUseCase);
  }

  public static getUpdateContactConfigurationUseCase(): UpdateContactConfigurationUseCase {
    return ServiceLocator.container.get<UpdateContactConfigurationUseCase>(TYPES.UpdateContactConfigurationUseCase);
  }

  public static getGetContactsUseCase(): GetContactsUseCase {
    return ServiceLocator.container.get<GetContactsUseCase>(TYPES.GetContactsUseCase);
  }

  // Timer Use Cases
  public static getStartAutoResponseTimerUseCase(): StartAutoResponseTimerUseCase {
    return ServiceLocator.container.get<StartAutoResponseTimerUseCase>(TYPES.StartAutoResponseTimerUseCase);
  }

  public static getHandleTimerExpirationUseCase(): HandleTimerExpirationUseCase {
    return ServiceLocator.container.get<HandleTimerExpirationUseCase>(TYPES.HandleTimerExpirationUseCase);
  }

  public static getCancelAutoResponseTimerUseCase(): CancelAutoResponseTimerUseCase {
    return ServiceLocator.container.get<CancelAutoResponseTimerUseCase>(TYPES.CancelAutoResponseTimerUseCase);
  }

  public static getGetActiveTimersUseCase(): GetActiveTimersUseCase {
    return ServiceLocator.container.get<GetActiveTimersUseCase>(TYPES.GetActiveTimersUseCase);
  }

  // Notification Use Cases
  public static getProcessUrgentMessageUseCase(): ProcessUrgentMessageUseCase {
    return ServiceLocator.container.get<ProcessUrgentMessageUseCase>(TYPES.ProcessUrgentMessageUseCase);
  }

  public static getSendNotificationUseCase(): SendNotificationUseCase {
    return ServiceLocator.container.get<SendNotificationUseCase>(TYPES.SendNotificationUseCase);
  }

  public static getConfigureNotificationPreferencesUseCase(): ConfigureNotificationPreferencesUseCase {
    return ServiceLocator.container.get<ConfigureNotificationPreferencesUseCase>(TYPES.ConfigureNotificationPreferencesUseCase);
  }

  // Controllers
  public static getMessageController(): MessageController {
    return ServiceLocator.container.get<MessageController>(TYPES.MessageController);
  }

  public static getContactController(): ContactController {
    return ServiceLocator.container.get<ContactController>(TYPES.ContactController);
  }

  public static getSystemController(): SystemController {
    return ServiceLocator.container.get<SystemController>(TYPES.SystemController);
  }

  // Utility method to check if container is set
  public static isInitialized(): boolean {
    return ServiceLocator.container !== undefined;
  }

  // Utility method to get any service by type
  public static get<T>(serviceIdentifier: symbol): T {
    return ServiceLocator.container.get<T>(serviceIdentifier);
  }
}