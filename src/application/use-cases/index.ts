// Message Use Cases
export { 
  ProcessIncomingMessageUseCase, 
  ProcessIncomingMessageUseCaseImpl 
} from './ProcessIncomingMessageUseCase';

export { 
  ProcessOutgoingMessageUseCase, 
  ProcessOutgoingMessageUseCaseImpl 
} from './ProcessOutgoingMessageUseCase';

export { 
  GetMessageHistoryUseCase, 
  GetMessageHistoryUseCaseImpl 
} from './GetMessageHistoryUseCase';

// Contact Use Cases
export { 
  ConfigureContactUseCase, 
  ConfigureContactUseCaseImpl 
} from './ConfigureContactUseCase';

export { 
  GetContactConfigurationUseCase, 
  GetContactConfigurationUseCaseImpl 
} from './GetContactConfigurationUseCase';

export { 
  UpdateContactConfigurationUseCase, 
  UpdateContactConfigurationUseCaseImpl 
} from './UpdateContactConfigurationUseCase';

export { 
  GetContactsUseCase, 
  GetContactsUseCaseImpl 
} from './GetContactsUseCase';

// Timer Use Cases
export { 
  StartAutoResponseTimerUseCase, 
  StartAutoResponseTimerUseCaseImpl 
} from './StartAutoResponseTimerUseCase';

export { 
  HandleTimerExpirationUseCase, 
  HandleTimerExpirationUseCaseImpl 
} from './HandleTimerExpirationUseCase';

export { 
  CancelAutoResponseTimerUseCase, 
  CancelAutoResponseTimerUseCaseImpl 
} from './CancelAutoResponseTimerUseCase';

export { 
  GetActiveTimersUseCase, 
  GetActiveTimersUseCaseImpl 
} from './GetActiveTimersUseCase';

// Notification Use Cases
export { 
  ProcessUrgentMessageUseCase, 
  ProcessUrgentMessageUseCaseImpl 
} from './ProcessUrgentMessageUseCase';

export { 
  SendNotificationUseCase, 
  SendNotificationUseCaseImpl 
} from './SendNotificationUseCase';

export { 
  ConfigureNotificationPreferencesUseCase, 
  ConfigureNotificationPreferencesUseCaseImpl 
} from './ConfigureNotificationPreferencesUseCase';