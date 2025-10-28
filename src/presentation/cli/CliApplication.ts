import { Command } from 'commander';
import { ApplicationFactory, ApplicationDependencies, ServiceLocator } from '@shared/container';
import { Logger } from '@shared/utils/logger';

export class CliApplication {
  private program: Command;
  private dependencies: ApplicationDependencies | null = null;
  private logger: Logger | null = null;

  constructor() {
    this.program = new Command();
    this.setupCommands();
  }

  private setupCommands(): void {
    this.program
      .name('whatsapp-assistant')
      .description('WhatsApp Personal Assistant CLI')
      .version('1.0.0');

    // Status command
    this.program
      .command('status')
      .description('Show system status')
      .action(async () => {
        await this.executeCommand(this.handleStatus.bind(this));
      });

    // Contacts commands
    const contactsCmd = this.program
      .command('contacts')
      .description('Manage contacts');

    contactsCmd
      .command('list')
      .description('List all contacts')
      .option('-l, --limit <number>', 'Limit number of results', '20')
      .option('--urgent', 'Show only urgent contacts')
      .action(async (options) => {
        await this.executeCommand(() => this.handleContactsList(options));
      });

    contactsCmd
      .command('add')
      .description('Add a new contact')
      .requiredOption('-p, --phone <number>', 'Phone number')
      .requiredOption('-n, --name <name>', 'Contact name')
      .option('-d, --delay <seconds>', 'Response delay in seconds', '60')
      .option('-m, --message <text>', 'Predefined message')
      .option('--urgent', 'Mark as urgent contact')
      .action(async (options) => {
        await this.executeCommand(() => this.handleContactsAdd(options));
      });

    contactsCmd
      .command('update <contactId>')
      .description('Update a contact')
      .option('-n, --name <name>', 'Contact name')
      .option('-d, --delay <seconds>', 'Response delay in seconds')
      .option('-m, --message <text>', 'Predefined message')
      .option('--urgent <boolean>', 'Mark as urgent contact')
      .action(async (contactId, options) => {
        await this.executeCommand(() => this.handleContactsUpdate(contactId, options));
      });

    // Messages commands
    const messagesCmd = this.program
      .command('messages')
      .description('View messages');

    messagesCmd
      .command('history <contactId>')
      .description('Show message history for a contact')
      .option('-l, --limit <number>', 'Limit number of results', '50')
      .action(async (contactId, options) => {
        await this.executeCommand(() => this.handleMessagesHistory(contactId, options));
      });

    // Config commands
    const configCmd = this.program
      .command('config')
      .description('Manage configuration');

    configCmd
      .command('show')
      .description('Show current configuration')
      .action(async () => {
        await this.executeCommand(this.handleConfigShow.bind(this));
      });

    configCmd
      .command('set <key> <value>')
      .description('Set configuration value')
      .action(async (key, value) => {
        await this.executeCommand(() => this.handleConfigSet(key, value));
      });
  }

  async run(args: string[]): Promise<void> {
    try {
      await this.program.parseAsync(args);
    } catch (error) {
      console.error('CLI Error:', (error as Error).message);
      process.exit(1);
    }
  }

  private async executeCommand(handler: () => Promise<void>): Promise<void> {
    try {
      // Initialize dependencies if not already done
      if (!this.dependencies) {
        console.log('Initializing application...');
        this.dependencies = await ApplicationFactory.create();
        ServiceLocator.setContainer(this.dependencies.container);
        this.logger = this.dependencies.logger;
      }

      await handler();
    } catch (error) {
      console.error('Command failed:', (error as Error).message);
      if (this.logger) {
        this.logger.error('CLI command failed', error as Error);
      }
      process.exit(1);
    }
  }

  private async handleStatus(): Promise<void> {
    const healthResult = await ApplicationFactory.healthCheck(this.dependencies!);
    
    console.log('\n📊 System Status');
    console.log('================');
    console.log(`Overall Health: ${healthResult.healthy ? '✅ Healthy' : '❌ Unhealthy'}`);
    console.log(`Database: ${healthResult.services.database ? '✅ Connected' : '❌ Disconnected'}`);
    console.log(`WhatsApp: ${healthResult.services.whatsapp ? '✅ Connected' : '❌ Disconnected'}`);
    console.log(`Uptime: ${Math.floor(process.uptime())} seconds`);
    console.log(`Memory Usage: ${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)} MB`);
  }

  private async handleContactsList(options: any): Promise<void> {
    const getContactsUseCase = ServiceLocator.getGetContactsUseCase();
    
    const result = await getContactsUseCase.execute({
      limit: parseInt(options.limit, 10),
      offset: 0,
      isUrgent: options.urgent ? true : undefined,
    });

    if (!result.success) {
      throw new Error(result.message || 'Failed to get contacts');
    }

    console.log('\n👥 Contacts');
    console.log('===========');
    
    if (result.data!.contacts.length === 0) {
      console.log('No contacts found.');
      return;
    }

    result.data!.contacts.forEach(contact => {
      console.log(`📱 ${contact.name} (${contact.phoneNumber})`);
      console.log(`   ID: ${contact.id}`);
      console.log(`   Response Delay: ${contact.responseDelay}s`);
      console.log(`   Urgent: ${contact.isUrgent ? '🚨 Yes' : 'No'}`);
      console.log(`   Auto Response: ${contact.autoResponseEnabled ? '✅ Enabled' : '❌ Disabled'}`);
      if (contact.predefinedMessage) {
        console.log(`   Message: "${contact.predefinedMessage}"`);
      }
      console.log('');
    });

    console.log(`Total: ${result.data!.totalCount} contacts`);
  }

  private async handleContactsAdd(options: any): Promise<void> {
    const configureContactUseCase = ServiceLocator.getConfigureContactUseCase();
    
    const result = await configureContactUseCase.execute({
      phoneNumber: options.phone,
      name: options.name,
      responseDelay: parseInt(options.delay, 10),
      predefinedMessage: options.message,
      isUrgent: !!options.urgent,
      autoResponseEnabled: true,
    });

    if (!result.success) {
      throw new Error(result.message || 'Failed to create contact');
    }

    console.log('✅ Contact created successfully!');
    console.log(`   ID: ${result.data!.id}`);
    console.log(`   Name: ${result.data!.name}`);
    console.log(`   Phone: ${result.data!.phoneNumber}`);
  }

  private async handleContactsUpdate(contactId: string, options: any): Promise<void> {
    const updateContactUseCase = ServiceLocator.getUpdateContactConfigurationUseCase();
    
    const updateData: any = { contactId };
    
    if (options.name) updateData.name = options.name;
    if (options.delay) updateData.responseDelay = parseInt(options.delay, 10);
    if (options.message) updateData.predefinedMessage = options.message;
    if (options.urgent !== undefined) updateData.isUrgent = options.urgent === 'true';

    const result = await updateContactUseCase.execute(updateData);

    if (!result.success) {
      throw new Error(result.message || 'Failed to update contact');
    }

    console.log('✅ Contact updated successfully!');
    console.log(`   ID: ${result.data!.id}`);
    console.log(`   Name: ${result.data!.name}`);
  }

  private async handleMessagesHistory(contactId: string, options: any): Promise<void> {
    const getMessageHistoryUseCase = ServiceLocator.getGetMessageHistoryUseCase();
    
    const result = await getMessageHistoryUseCase.execute({
      contactId,
      limit: parseInt(options.limit, 10),
      offset: 0,
    });

    if (!result.success) {
      throw new Error(result.message || 'Failed to get message history');
    }

    console.log(`\n💬 Message History for Contact: ${contactId}`);
    console.log('================================================');
    
    if (result.data!.messages.length === 0) {
      console.log('No messages found.');
      return;
    }

    result.data!.messages.forEach(message => {
      const direction = message.type === 'incoming' ? '📨 IN' : '📤 OUT';
      const timestamp = new Date(message.timestamp).toLocaleString();
      console.log(`${direction}  ${timestamp}`);
      console.log(`     ${message.content}`);
      console.log('');
    });

    console.log(`Total: ${result.data!.totalCount} messages`);
  }

  private async handleConfigShow(): Promise<void> {
    const config = ServiceLocator.getConfig();
    
    console.log('\n⚙️  Configuration');
    console.log('=================');
    console.log(`Database Type: ${config.database.type}`);
    console.log(`Server Port: ${config.server.port}`);
    console.log(`Server Host: ${config.server.host}`);
    console.log(`Default Response Delay: ${config.defaults.responseDelay}s`);
    console.log(`Default Auto Message: "${config.defaults.autoMessage}"`);
    console.log(`WhatsApp Session Path: ${config.whatsapp.sessionPath}`);
  }

  private async handleConfigSet(key: string, value: string): Promise<void> {
    console.log(`Setting ${key} = ${value}`);
    console.log('⚠️  Configuration hot-reloading not yet implemented.');
    console.log('Please restart the application for changes to take effect.');
  }

  async cleanup(): Promise<void> {
    if (this.dependencies) {
      await ApplicationFactory.shutdown(this.dependencies);
    }
  }
}