import { Container } from 'inversify';
import { TYPES } from '@shared/constants';
import { 
  MessageRepository, 
  ContactRepository, 
  TimerRepository 
} from '@domain/index';
import { MessageRepositoryImpl } from './MessageRepositoryImpl';
import { ContactRepositoryImpl } from './ContactRepositoryImpl';
import { TimerRepositoryImpl } from './TimerRepositoryImpl';
import { DatabaseAdapter } from '@infrastructure/database';

export class RepositoryFactory {
  static registerRepositories(container: Container): void {
    // Bind repository implementations
    container.bind<MessageRepository>(TYPES.MessageRepository)
      .to(MessageRepositoryImpl)
      .inSingletonScope();

    container.bind<ContactRepository>(TYPES.ContactRepository)
      .to(ContactRepositoryImpl)
      .inSingletonScope();

    container.bind<TimerRepository>(TYPES.TimerRepository)
      .to(TimerRepositoryImpl)
      .inSingletonScope();
  }

  static createRepositories(databaseAdapter: DatabaseAdapter): {
    messageRepository: MessageRepository;
    contactRepository: ContactRepository;
    timerRepository: TimerRepository;
  } {
    // Create a temporary container for this factory method
    const container = new Container();
    
    // Bind the database adapter
    container.bind<DatabaseAdapter>(TYPES.DatabaseAdapter).toConstantValue(databaseAdapter);
    
    // Register repositories
    RepositoryFactory.registerRepositories(container);
    
    return {
      messageRepository: container.get<MessageRepository>(TYPES.MessageRepository),
      contactRepository: container.get<ContactRepository>(TYPES.ContactRepository),
      timerRepository: container.get<TimerRepository>(TYPES.TimerRepository),
    };
  }
}