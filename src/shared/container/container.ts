import { Container } from 'inversify';
import { TYPES } from '@shared/constants';
import { Logger, WinstonLogger } from '@shared/utils/logger';
import { AppConfig } from '@shared/types';

// Domain Services
import {
  AutoResponseService,
  AutoResponseServiceImpl,
  NotificationService,
  NotificationServiceImpl,
  MessageValidationService,
  MessageValidationServiceImpl,
} from '@domain/services';

// Application Use Cases
import {
  ProcessIncomingMessageUseCase,
  ProcessIncomingMessageUseCaseImpl,
  ProcessOutgoingMessageUseCase,
  ProcessOutgoingMessageUseCaseImpl,
  GetMessageHistoryUseCase,
  GetMessageHistoryUseCaseImpl,
  ConfigureContactUseCase,
  ConfigureContactUseCaseImpl,
  GetContactConfigurationUseCase,
  GetContactConfigurationUseCaseImpl,
  UpdateContactConfigurationUseCase,
  UpdateContactConfigurationUseCaseImpl,
  GetContactsUseCase,
  GetContactsUseCaseImpl,
  StartAutoResponseTimerUseCase,
  StartAutoResponseTimerUseCaseImpl,
  HandleTimerExpirationUseCase,
  HandleTimerExpirationUseCaseImpl,
  CancelAutoResponseTimerUseCase,
  CancelAutoResponseTimerUseCaseImpl,
  GetActiveTimersUseCase,
  GetActiveTimersUseCaseImpl,
  ProcessUrgentMessageUseCase,
  ProcessUrgentMessageUseCaseImpl,
  SendNotificationUseCase,
  SendNotificationUseCaseImpl,
  ConfigureNotificationPreferencesUseCase,
  ConfigureNotificationPreferencesUseCaseImpl,
} from '@application/use-cases';

// Domain Repositories
import {
  MessageRepository,
  ContactRepository,
  TimerRepository,
} from '@domain/repositories';

// Infrastructure
import {
  MessageRepositoryImpl,
  ContactRepositoryImpl,
  TimerRepositoryImpl,
} from '@infrastructure/repositories';
import { DatabaseAdapter } from '@infrastructure/database';
import { WhatsAppPort } from '@application/ports';
import { WhatsAppWebAdapter } from '@infrastructure/adapters';
import { FileSystemConfigurationManager } from '@infrastructure/config';

// Presentation Controllers
import {
  MessageController,
  MessageControllerImpl,
  ContactController,
  ContactControllerImpl,
  SystemController,
  SystemControllerImpl,
} from '@presentation/controllers';

// Presentation Server
import { ApiRouter, ExpressServer } from '@presentation/server';

export class DIContainer {
  private static instance: Container;

  public static getInstance(): Container {
    if (!DIContainer.instance) {
      DIContainer.instance = new Container();
    }
    return DIContainer.instance;
  }

  public static async setupBindings(config: AppConfig, databaseAdapter: DatabaseAdapter): Promise<void> {
    const container = DIContainer.instance;

    // Clear existing bindings
    container.unbindAll();

    // Shared services
    container.bind<Logger>(TYPES.Logger).to(WinstonLogger).inSingletonScope();
    container.bind<AppConfig>(TYPES.Config).toConstantValue(config);

    // Infrastructure
    container.bind<DatabaseAdapter>(TYPES.DatabaseAdapter).toConstantValue(databaseAdapter);
    
    // WhatsApp Adapter
    const whatsAppAdapter = new WhatsAppWebAdapter(
      container.get<Logger>(TYPES.Logger),
      config.whatsapp
    );
    container.bind<WhatsAppPort>(TYPES.WhatsAppPort).toConstantValue(whatsAppAdapter);

    // Domain Services
    container.bind<AutoResponseService>(TYPES.AutoResponseService)
      .to(AutoResponseServiceImpl)
      .inSingletonScope();
    
    container.bind<NotificationService>(TYPES.NotificationService)
      .to(NotificationServiceImpl)
      .inSingletonScope();

    // Repositories
    container.bind<MessageRepository>(TYPES.MessageRepository)
      .to(MessageRepositoryImpl)
      .inSingletonScope();
    
    container.bind<ContactRepository>(TYPES.ContactRepository)
      .to(ContactRepositoryImpl)
      .inSingletonScope();
    
    container.bind<TimerRepository>(TYPES.TimerRepository)
      .to(TimerRepositoryImpl)
      .inSingletonScope();

    // Application Use Cases - Message
    container.bind<ProcessIncomingMessageUseCase>(TYPES.ProcessIncomingMessageUseCase)
      .to(ProcessIncomingMessageUseCaseImpl)
      .inSingletonScope();
    
    container.bind<ProcessOutgoingMessageUseCase>(TYPES.ProcessOutgoingMessageUseCase)
      .to(ProcessOutgoingMessageUseCaseImpl)
      .inSingletonScope();
    
    container.bind<GetMessageHistoryUseCase>(TYPES.GetMessageHistoryUseCase)
      .to(GetMessageHistoryUseCaseImpl)
      .inSingletonScope();

    // Application Use Cases - Contact
    container.bind<ConfigureContactUseCase>(TYPES.ConfigureContactUseCase)
      .to(ConfigureContactUseCaseImpl)
      .inSingletonScope();
    
    container.bind<GetContactConfigurationUseCase>(TYPES.GetContactConfigurationUseCase)
      .to(GetContactConfigurationUseCaseImpl)
      .inSingletonScope();
    
    container.bind<UpdateContactConfigurationUseCase>(TYPES.UpdateContactConfigurationUseCase)
      .to(UpdateContactConfigurationUseCaseImpl)
      .inSingletonScope();
    
    container.bind<GetContactsUseCase>(TYPES.GetContactsUseCase)
      .to(GetContactsUseCaseImpl)
      .inSingletonScope();

    // Application Use Cases - Timer
    container.bind<StartAutoResponseTimerUseCase>(TYPES.StartAutoResponseTimerUseCase)
      .to(StartAutoResponseTimerUseCaseImpl)
      .inSingletonScope();
    
    container.bind<HandleTimerExpirationUseCase>(TYPES.HandleTimerExpirationUseCase)
      .to(HandleTimerExpirationUseCaseImpl)
      .inSingletonScope();
    
    container.bind<CancelAutoResponseTimerUseCase>(TYPES.CancelAutoResponseTimerUseCase)
      .to(CancelAutoResponseTimerUseCaseImpl)
      .inSingletonScope();
    
    container.bind<GetActiveTimersUseCase>(TYPES.GetActiveTimersUseCase)
      .to(GetActiveTimersUseCaseImpl)
      .inSingletonScope();

    // Application Use Cases - Notification
    container.bind<ProcessUrgentMessageUseCase>(TYPES.ProcessUrgentMessageUseCase)
      .to(ProcessUrgentMessageUseCaseImpl)
      .inSingletonScope();
    
    container.bind<SendNotificationUseCase>(TYPES.SendNotificationUseCase)
      .to(SendNotificationUseCaseImpl)
      .inSingletonScope();
    
    container.bind<ConfigureNotificationPreferencesUseCase>(TYPES.ConfigureNotificationPreferencesUseCase)
      .to(ConfigureNotificationPreferencesUseCaseImpl)
      .inSingletonScope();

    // Presentation Controllers
    container.bind<MessageController>(TYPES.MessageController)
      .to(MessageControllerImpl)
      .inSingletonScope();
    
    container.bind<ContactController>(TYPES.ContactController)
      .to(ContactControllerImpl)
      .inSingletonScope();
    
    container.bind<SystemController>(TYPES.SystemController)
      .to(SystemControllerImpl)
      .inSingletonScope();

    // Presentation Server Components
    container.bind(ApiRouter).toSelf().inSingletonScope();
    container.bind(ExpressServer).toSelf().inSingletonScope();
  }

  public static reset(): void {
    if (DIContainer.instance) {
      DIContainer.instance.unbindAll();
      DIContainer.instance = new Container();
    }
  }
}