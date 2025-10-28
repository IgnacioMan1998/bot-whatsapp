import { injectable, inject } from 'inversify';
import { Client, LocalAuth, Message } from 'whatsapp-web.js';
import { TYPES } from '@shared/constants';
import { Logger } from '@shared/utils/logger';
import { 
  WhatsAppPort, 
  RawMessage, 
  WhatsAppConnectionStatus 
} from '@application/ports/WhatsAppPort';
import { InfrastructureError } from '@shared/types';

export interface WhatsAppWebConfig {
  sessionPath: string;
  puppeteerOptions: {
    headless: boolean;
    args: string[];
  };
}

@injectable()
export class WhatsAppWebAdapter implements WhatsAppPort {
  private client: Client | null = null;
  private isInitialized: boolean = false;
  private isClientReady: boolean = false;
  private currentQRCode: string | null = null;
  private connectionStatus: WhatsAppConnectionStatus['sessionStatus'] = 'DISCONNECTED';

  // Event callbacks
  private messageCallbacks: Array<(message: RawMessage) => void> = [];
  private readyCallbacks: Array<() => void> = [];
  private qrCodeCallbacks: Array<(qrCode: string) => void> = [];
  private authenticatedCallbacks: Array<() => void> = [];
  private disconnectedCallbacks: Array<(reason: string) => void> = [];

  constructor(
    @inject(TYPES.Logger) private logger: Logger,
    private config: WhatsAppWebConfig
  ) {}

  async initialize(): Promise<void> {
    if (this.isInitialized) {
      this.logger.warn('WhatsApp client already initialized');
      return;
    }

    try {
      this.logger.info('Initializing WhatsApp Web client');

      this.client = new Client({
        authStrategy: new LocalAuth({
          clientId: 'whatsapp-assistant',
          dataPath: this.config.sessionPath,
        }),
        puppeteer: {
          headless: this.config.puppeteerOptions.headless,
          args: this.config.puppeteerOptions.args,
        },
      });

      this.setupEventHandlers();
      
      await this.client.initialize();
      this.isInitialized = true;

      this.logger.info('WhatsApp Web client initialized successfully');
    } catch (error) {
      this.logger.error('Failed to initialize WhatsApp client', error as Error);
      throw new InfrastructureError(`WhatsApp initialization failed: ${(error as Error).message}`);
    }
  }

  async sendMessage(to: string, message: string): Promise<void> {
    if (!this.isClientReady || !this.client) {
      throw new InfrastructureError('WhatsApp client is not ready');
    }

    try {
      // Format phone number for WhatsApp (remove + and add @c.us)
      const formattedNumber = to.replace('+', '') + '@c.us';
      
      await this.client.sendMessage(formattedNumber, message);
      
      this.logger.info('Message sent successfully', { 
        to: formattedNumber, 
        messageLength: message.length 
      });
    } catch (error) {
      this.logger.error('Failed to send message', error as Error, { to, message });
      throw new InfrastructureError(`Failed to send message: ${(error as Error).message}`);
    }
  }

  onMessageReceived(callback: (message: RawMessage) => void): void {
    this.messageCallbacks.push(callback);
  }

  onReady(callback: () => void): void {
    this.readyCallbacks.push(callback);
  }

  onQRCode(callback: (qrCode: string) => void): void {
    this.qrCodeCallbacks.push(callback);
  }

  onAuthenticated(callback: () => void): void {
    this.authenticatedCallbacks.push(callback);
  }

  onDisconnected(callback: (reason: string) => void): void {
    this.disconnectedCallbacks.push(callback);
  }

  async getQRCode(): Promise<string | null> {
    return this.currentQRCode;
  }

  async getConnectionStatus(): Promise<WhatsAppConnectionStatus> {
    return {
      isConnected: this.isInitialized,
      isReady: this.isClientReady,
      qrCode: this.currentQRCode || undefined,
      sessionStatus: this.connectionStatus,
    };
  }

  async disconnect(): Promise<void> {
    if (this.client) {
      try {
        await this.client.destroy();
        this.logger.info('WhatsApp client disconnected successfully');
      } catch (error) {
        this.logger.error('Error disconnecting WhatsApp client', error as Error);
      }
    }

    this.resetState();
  }

  isReady(): boolean {
    return this.isClientReady;
  }

  async getClientInfo(): Promise<{ pushname: string; wid: string; phone: string } | null> {
    if (!this.isClientReady || !this.client) {
      return null;
    }

    try {
      const info = this.client.info;
      return {
        pushname: info.pushname,
        wid: info.wid._serialized,
        phone: info.wid.user,
      };
    } catch (error) {
      this.logger.error('Failed to get client info', error as Error);
      return null;
    }
  }

  private setupEventHandlers(): void {
    if (!this.client) return;

    // QR Code event
    this.client.on('qr', (qrCode: string) => {
      this.logger.info('QR Code generated');
      this.currentQRCode = qrCode;
      this.connectionStatus = 'CONNECTING';
      
      this.qrCodeCallbacks.forEach(callback => {
        try {
          callback(qrCode);
        } catch (error) {
          this.logger.error('Error in QR code callback', error as Error);
        }
      });
    });

    // Ready event
    this.client.on('ready', () => {
      this.logger.info('WhatsApp client is ready');
      this.isClientReady = true;
      this.connectionStatus = 'AUTHENTICATED';
      this.currentQRCode = null;
      
      this.readyCallbacks.forEach(callback => {
        try {
          callback();
        } catch (error) {
          this.logger.error('Error in ready callback', error as Error);
        }
      });
    });

    // Authenticated event
    this.client.on('authenticated', () => {
      this.logger.info('WhatsApp client authenticated');
      this.connectionStatus = 'CONNECTED';
      
      this.authenticatedCallbacks.forEach(callback => {
        try {
          callback();
        } catch (error) {
          this.logger.error('Error in authenticated callback', error as Error);
        }
      });
    });

    // Message event
    this.client.on('message', (message: Message) => {
      try {
        const rawMessage = this.convertToRawMessage(message);
        
        this.logger.debug('Message received', { 
          from: rawMessage.from, 
          isGroup: rawMessage.isGroup,
          fromMe: rawMessage.fromMe 
        });

        this.messageCallbacks.forEach(callback => {
          try {
            callback(rawMessage);
          } catch (error) {
            this.logger.error('Error in message callback', error as Error);
          }
        });
      } catch (error) {
        this.logger.error('Error processing received message', error as Error);
      }
    });

    // Disconnected event
    this.client.on('disconnected', (reason: string) => {
      this.logger.warn('WhatsApp client disconnected', { reason });
      this.resetState();
      
      this.disconnectedCallbacks.forEach(callback => {
        try {
          callback(reason);
        } catch (error) {
          this.logger.error('Error in disconnected callback', error as Error);
        }
      });
    });

    // Auth failure event
    this.client.on('auth_failure', (message: string) => {
      this.logger.error('WhatsApp authentication failed', new Error(message));
      this.connectionStatus = 'DISCONNECTED';
    });
  }

  private convertToRawMessage(message: Message): RawMessage {
    return {
      id: message.id._serialized,
      from: this.formatPhoneNumber(message.from),
      to: this.formatPhoneNumber(message.to),
      body: message.body,
      timestamp: message.timestamp * 1000, // Convert to milliseconds
      fromMe: message.fromMe,
      isGroup: message.from.includes('@g.us'),
      author: message.author ? this.formatPhoneNumber(message.author) : undefined,
    };
  }

  private formatPhoneNumber(whatsappId: string): string {
    // Convert WhatsApp ID to phone number format
    // Example: 1234567890@c.us -> +1234567890
    const phoneNumber = whatsappId.split('@')[0];
    return '+' + phoneNumber;
  }

  private resetState(): void {
    this.isInitialized = false;
    this.isClientReady = false;
    this.currentQRCode = null;
    this.connectionStatus = 'DISCONNECTED';
    this.client = null;
  }
}