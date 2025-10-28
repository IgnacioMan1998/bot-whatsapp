import { injectable } from 'inversify';
import * as fs from 'fs/promises';
import * as path from 'path';
import { AppConfig, DatabaseConfig } from '@shared/types';
import { InfrastructureError } from '@shared/types';

export interface ConfigurationManager {
  loadConfiguration(): Promise<AppConfig>;
  validateConfiguration(config: AppConfig): void;
  getEnvironmentOverrides(): Partial<AppConfig>;
}

@injectable()
export class FileSystemConfigurationManager implements ConfigurationManager {
  private configCache: AppConfig | null = null;
  private readonly configDir: string;

  constructor(configDir: string = './config') {
    this.configDir = configDir;
  }

  async loadConfiguration(): Promise<AppConfig> {
    if (this.configCache) {
      return this.configCache;
    }

    try {
      // Determine environment
      const env = process.env.NODE_ENV || 'development';
      
      // Load base configuration
      const defaultConfig = await this.loadConfigFile('default.json');
      
      // Load environment-specific configuration
      let envConfig = {};
      try {
        envConfig = await this.loadConfigFile(`${env}.json`);
      } catch (error) {
        // Environment config is optional
        console.warn(`No configuration file found for environment: ${env}`);
      }

      // Merge configurations (env overrides default)
      const mergedConfig = this.mergeConfigurations(defaultConfig, envConfig);
      
      // Apply environment variable overrides
      const envOverrides = this.getEnvironmentOverrides();
      const finalConfig = this.mergeConfigurations(mergedConfig, envOverrides);

      // Validate final configuration
      this.validateConfiguration(finalConfig);

      // Cache the configuration
      this.configCache = finalConfig;
      
      return finalConfig;
    } catch (error) {
      throw new InfrastructureError(`Failed to load configuration: ${(error as Error).message}`);
    }
  }

  validateConfiguration(config: AppConfig): void {
    // Validate WhatsApp configuration
    if (!config.whatsapp) {
      throw new InfrastructureError('WhatsApp configuration is required');
    }

    if (!config.whatsapp.sessionPath) {
      throw new InfrastructureError('WhatsApp session path is required');
    }

    // Validate database configuration
    if (!config.database) {
      throw new InfrastructureError('Database configuration is required');
    }

    if (!config.database.type) {
      throw new InfrastructureError('Database type is required');
    }

    if (config.database.type === 'sqlite' && !config.database.sqlite?.path) {
      throw new InfrastructureError('SQLite database path is required');
    }

    if (config.database.type === 'postgresql') {
      const pgConfig = config.database.postgresql;
      if (!pgConfig?.host || !pgConfig?.database || !pgConfig?.username) {
        throw new InfrastructureError('PostgreSQL configuration is incomplete');
      }
    }

    // Validate server configuration
    if (!config.server) {
      throw new InfrastructureError('Server configuration is required');
    }

    if (!config.server.port || config.server.port < 1 || config.server.port > 65535) {
      throw new InfrastructureError('Valid server port is required');
    }

    // Validate defaults
    if (!config.defaults) {
      throw new InfrastructureError('Default configuration is required');
    }

    if (config.defaults.responseDelay < 0) {
      throw new InfrastructureError('Response delay cannot be negative');
    }
  }

  getEnvironmentOverrides(): Partial<AppConfig> {
    const overrides: Partial<AppConfig> = {};

    // Server overrides
    if (process.env.PORT) {
      overrides.server = {
        ...overrides.server,
        port: parseInt(process.env.PORT, 10),
        host: overrides.server?.host || 'localhost',
      };
    }

    if (process.env.HOST) {
      overrides.server = {
        ...overrides.server,
        host: process.env.HOST,
        port: overrides.server?.port || 3000,
      };
    }

    // Database overrides
    if (process.env.DB_TYPE) {
      overrides.database = {
        ...overrides.database,
        type: process.env.DB_TYPE as 'sqlite' | 'postgresql',
      };
    }

    // PostgreSQL overrides
    if (process.env.DB_HOST || process.env.DB_PORT || process.env.DB_NAME || 
        process.env.DB_USER || process.env.DB_PASSWORD) {
      overrides.database = {
        type: 'postgresql',
        ...overrides.database,
        postgresql: {
          host: process.env.DB_HOST || 'localhost',
          port: parseInt(process.env.DB_PORT || '5432', 10),
          database: process.env.DB_NAME || 'whatsapp_assistant',
          username: process.env.DB_USER || 'assistant_user',
          password: process.env.DB_PASSWORD || '',
          ssl: process.env.DB_SSL === 'true',
          poolSize: parseInt(process.env.DB_POOL_SIZE || '10', 10),
          connectionTimeout: parseInt(process.env.DB_CONNECTION_TIMEOUT || '30000', 10),
        },
      };
    }

    // SQLite overrides
    if (process.env.SQLITE_PATH) {
      overrides.database = {
        type: 'sqlite',
        ...overrides.database,
        sqlite: {
          path: process.env.SQLITE_PATH,
          enableWAL: process.env.SQLITE_WAL === 'true',
          busyTimeout: parseInt(process.env.SQLITE_BUSY_TIMEOUT || '30000', 10),
        },
      };
    }

    // WhatsApp overrides
    if (process.env.WHATSAPP_SESSION_PATH) {
      overrides.whatsapp = {
        ...overrides.whatsapp,
        sessionPath: process.env.WHATSAPP_SESSION_PATH,
        puppeteerOptions: {
          headless: process.env.WHATSAPP_HEADLESS !== 'false',
          args: ['--no-sandbox', '--disable-setuid-sandbox'],
        },
      };
    }

    // Defaults overrides
    if (process.env.DEFAULT_RESPONSE_DELAY) {
      overrides.defaults = {
        ...overrides.defaults,
        responseDelay: parseInt(process.env.DEFAULT_RESPONSE_DELAY, 10),
        autoMessage: process.env.DEFAULT_AUTO_MESSAGE || 'Hola! Este es un mensaje automático. Te responderé pronto.',
      };
    }

    return overrides;
  }

  private async loadConfigFile(filename: string): Promise<any> {
    const filePath = path.join(this.configDir, filename);
    
    try {
      const fileContent = await fs.readFile(filePath, 'utf-8');
      return JSON.parse(fileContent);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        throw new InfrastructureError(`Configuration file not found: ${filePath}`);
      }
      throw new InfrastructureError(`Failed to parse configuration file ${filePath}: ${(error as Error).message}`);
    }
  }

  private mergeConfigurations(base: any, override: any): any {
    const result = { ...base };

    for (const key in override) {
      if (override[key] !== null && typeof override[key] === 'object' && !Array.isArray(override[key])) {
        result[key] = this.mergeConfigurations(result[key] || {}, override[key]);
      } else {
        result[key] = override[key];
      }
    }

    return result;
  }

  // Method to reload configuration (useful for hot-reloading)
  async reloadConfiguration(): Promise<AppConfig> {
    this.configCache = null;
    return await this.loadConfiguration();
  }

  // Method to get specific configuration section
  async getDatabaseConfig(): Promise<DatabaseConfig> {
    const config = await this.loadConfiguration();
    return config.database;
  }

  // Method to update configuration (for runtime changes)
  updateConfiguration(updates: Partial<AppConfig>): void {
    if (this.configCache) {
      this.configCache = this.mergeConfigurations(this.configCache, updates);
    }
  }
}