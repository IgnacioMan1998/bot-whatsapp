import { Container } from 'inversify';
import { TYPES } from '@shared/constants';
import { AppConfig } from '@shared/types';
import { Logger } from '@shared/utils/logger';
import { DatabaseAdapter } from '@infrastructure/database';
import { WhatsAppPort } from '@application/ports';

// Use Cases
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

// Controllers
import {
  MessageController,
  ContactController,
  SystemController,
} from '@presentation/controllers';

export class CompositionRoot {
  constructor(private container: Container) {}

  // Factory methods for Use Cases
  createProcessIncomingMessageUseCase(): ProcessIncomingMessageUseCase {
    return this.container.get<ProcessIncomingMessageUseCase>(TYPES.ProcessIncomingMessageUseCase);
  }

  createProcessOutgoingMessageUseCase(): ProcessOutgoingMessageUseCase {
    return this.container.get<ProcessOutgoingMessageUseCase>(TYPES.ProcessOutgoingMessageUseCase);
  }

  createGetMessageHistoryUseCase(): GetMessageHistoryUseCase {
    return this.container.get<GetMessageHistoryUseCase>(TYPES.GetMessageHistoryUseCase);
  }

  createConfigureContactUseCase(): ConfigureContactUseCase {
    return this.container.get<ConfigureContactUseCase>(TYPES.ConfigureContactUseCase);
  }

  createGetContactConfigurationUseCase(): GetContactConfigurationUseCase {
    return this.container.get<GetContactConfigurationUseCase>(TYPES.GetContactConfigurationUseCase);
  }

  createUpdateContactConfigurationUseCase(): UpdateContactConfigurationUseCase {
    return this.container.get<UpdateContactConfigurationUseCase>(TYPES.UpdateContactConfigurationUseCase);
  }

  createGetContactsUseCase(): GetContactsUseCase {
    return this.container.get<GetContactsUseCase>(TYPES.GetContactsUseCase);
  }

  createStartAutoResponseTimerUseCase(): StartAutoResponseTimerUseCase {
    return this.container.get<StartAutoResponseTimerUseCase>(TYPES.StartAutoResponseTimerUseCase);
  }

  createHandleTimerExpirationUseCase(): HandleTimerExpirationUseCase {
    return this.container.get<HandleTimerExpirationUseCase>(TYPES.HandleTimerExpirationUseCase);
  }

  createCancelAutoResponseTimerUseCase(): CancelAutoResponseTimerUseCase {
    return this.container.get<CancelAutoResponseTimerUseCase>(TYPES.CancelAutoResponseTimerUseCase);
  }

  createGetActiveTimersUseCase(): GetActiveTimersUseCase {
    return this.container.get<GetActiveTimersUseCase>(TYPES.GetActiveTimersUseCase);
  }

  createProcessUrgentMessageUseCase(): ProcessUrgentMessageUseCase {
    return this.container.get<ProcessUrgentMessageUseCase>(TYPES.ProcessUrgentMessageUseCase);
  }

  createSendNotificationUseCase(): SendNotificationUseCase {
    return this.container.get<SendNotificationUseCase>(TYPES.SendNotificationUseCase);
  }

  createConfigureNotificationPreferencesUseCase(): ConfigureNotificationPreferencesUseCase {
    return this.container.get<ConfigureNotificationPreferencesUseCase>(TYPES.ConfigureNotificationPreferencesUseCase);
  }

  // Factory methods for Controllers
  createMessageController(): MessageController {
    return this.container.get<MessageController>(TYPES.MessageController);
  }

  createContactController(): ContactController {
    return this.container.get<ContactController>(TYPES.ContactController);
  }

  createSystemController(): SystemController {
    return this.container.get<SystemController>(TYPES.SystemController);
  }

  // Factory methods for Infrastructure
  getDatabaseAdapter(): DatabaseAdapter {
    return this.container.get<DatabaseAdapter>(TYPES.DatabaseAdapter);
  }

  getWhatsAppPort(): WhatsAppPort {
    return this.container.get<WhatsAppPort>(TYPES.WhatsAppPort);
  }

  getLogger(): Logger {
    return this.container.get<Logger>(TYPES.Logger);
  }

  getConfig(): AppConfig {
    return this.container.get<AppConfig>(TYPES.Config);
  }

  // Service locator pattern for complex scenarios
  getService<T>(serviceIdentifier: symbol): T {
    return this.container.get<T>(serviceIdentifier);
  }

  // Check if service is bound
  isBound(serviceIdentifier: symbol): boolean {
    return this.container.isBound(serviceIdentifier);
  }

  // Rebind service (useful for testing)
  rebind<T>(serviceIdentifier: symbol): void {
    this.container.rebind<T>(serviceIdentifier);
  }

  // Get container for advanced scenarios
  getContainer(): Container {
    return this.container;
  }
}