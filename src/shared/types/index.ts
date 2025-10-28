// Common types used across the application
export type DatabaseType = 'sqlite' | 'postgresql';

export interface DatabaseConfig {
  type: DatabaseType;
  sqlite?: {
    path: string;
    enableWAL?: boolean;
    busyTimeout?: number;
  };
  postgresql?: {
    host: string;
    port: number;
    database: string;
    username: string;
    password: string;
    ssl?: boolean;
    poolSize?: number;
    connectionTimeout?: number;
  };
}

export interface WhatsAppConfig {
  sessionPath: string;
  puppeteerOptions: {
    headless: boolean;
    args: string[];
  };
}

export interface ServerConfig {
  port: number;
  host: string;
}

export interface DefaultsConfig {
  responseDelay: number;
  autoMessage: string;
}

export interface AppConfig {
  whatsapp: WhatsAppConfig;
  database: DatabaseConfig;
  server: ServerConfig;
  defaults: DefaultsConfig;
  version?: string;
}

// Common error types
export class DomainError extends Error {
  constructor(message: string, public readonly code?: string) {
    super(message);
    this.name = 'DomainError';
  }
}

export class InfrastructureError extends Error {
  constructor(message: string, public readonly code?: string) {
    super(message);
    this.name = 'InfrastructureError';
  }
}

export class ApplicationError extends Error {
  constructor(message: string, public readonly code?: string) {
    super(message);
    this.name = 'ApplicationError';
  }
}