export interface RawMessage {
  id: string;
  from: string;
  to: string;
  body: string;
  timestamp: number;
  fromMe: boolean;
  isGroup: boolean;
  author?: string;
}

export interface WhatsAppConnectionStatus {
  isConnected: boolean;
  isReady: boolean;
  qrCode?: string;
  sessionStatus: 'DISCONNECTED' | 'CONNECTING' | 'CONNECTED' | 'AUTHENTICATED';
}

export interface WhatsAppPort {
  /**
   * Initialize WhatsApp connection
   */
  initialize(): Promise<void>;

  /**
   * Send a message to a contact
   */
  sendMessage(to: string, message: string): Promise<void>;

  /**
   * Register callback for incoming messages
   */
  onMessageReceived(callback: (message: RawMessage) => void): void;

  /**
   * Register callback for connection ready
   */
  onReady(callback: () => void): void;

  /**
   * Register callback for QR code generation
   */
  onQRCode(callback: (qrCode: string) => void): void;

  /**
   * Register callback for authentication success
   */
  onAuthenticated(callback: () => void): void;

  /**
   * Register callback for disconnection
   */
  onDisconnected(callback: (reason: string) => void): void;

  /**
   * Get current QR code (if available)
   */
  getQRCode(): Promise<string | null>;

  /**
   * Get connection status
   */
  getConnectionStatus(): Promise<WhatsAppConnectionStatus>;

  /**
   * Disconnect from WhatsApp
   */
  disconnect(): Promise<void>;

  /**
   * Check if client is ready to send messages
   */
  isReady(): boolean;

  /**
   * Get client information
   */
  getClientInfo(): Promise<{
    pushname: string;
    wid: string;
    phone: string;
  } | null>;
}