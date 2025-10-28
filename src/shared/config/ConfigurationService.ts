import { injectable, inject } from 'inversify';
import { EventEmitter } from 'events';
import { TYPES } from '@shared/constants';
import { Logger } from '@shared/utils/logger';
import { AppConfig } from '@shared/types';
import { 
  FileSystemConfigurationManager, 
  ConfigurationValidator 
} from '@infrastructure/config';
import { FileSystemAdapter } from '@infrastructure/config';

export interface ConfigurationChangeEvent {
  type: 'configuration-changed';
  changes: Partial<AppConfig>;
  previousConfig: AppConfig;
  newConfig: AppConfig;
  timestamp: Date;
}

@injectable()
export class ConfigurationService extends EventEmitter {
  private currentConfig: AppConfig | null = null;
  private configManager: FileSystemConfigurationManager;
  private fileSystemAdapter: FileSystemAdapter;
  private isWatching: boolean = false;

  constructor(
    @inject(TYPES.Logger) private logger: Logger
  ) {
    super();
    this.configManager = new FileSystemConfigurationManager();
    this.fileSystemAdapter = new FileSystemAdapter();
  }

  /**
   * Loads the initial configuration
   */
  async initialize(): Promise<AppConfig> {
    try {
      this.logger.info('Loading application configuration...');

      // Load configuration
      this.currentConfig = await this.configManager.loadConfiguration();

      // Validate configuration
      ConfigurationValidator.validate(this.currentConfig);

      this.logger.info('Configuration loaded and validated successfully', {
        databaseType: this.currentConfig.database.type,
        serverPort: this.currentConfig.server.port,
        environment: process.env.NODE_ENV || 'development',
      });

      return this.currentConfig;

    } catch (error) {
      this.logger.error('Failed to load configuration', error as Error);
      throw error;
    }
  }

  /**
   * Gets the current configuration
   */
  getCurrentConfig(): AppConfig {
    if (!this.currentConfig) {
      throw new Error('Configuration not initialized');
    }
    return { ...this.currentConfig }; // Return a copy
  }

  /**
   * Updates configuration at runtime
   */
  async updateConfiguration(updates: Partial<AppConfig>): Promise<AppConfig> {
    try {
      if (!this.currentConfig) {
        throw new Error('Configuration not initialized');
      }

      this.logger.info('Updating configuration', { updates });

      // Validate partial configuration
      ConfigurationValidator.validatePartial(updates);

      // Create new configuration by merging updates
      const previousConfig = { ...this.currentConfig };
      const newConfig = this.mergeConfiguration(this.currentConfig, updates);

      // Validate complete new configuration
      ConfigurationValidator.validate(newConfig);

      // Update current configuration
      this.currentConfig = newConfig;

      // Emit configuration change event
      const changeEvent: ConfigurationChangeEvent = {
        type: 'configuration-changed',
        changes: updates,
        previousConfig,
        newConfig,
        timestamp: new Date(),
      };

      this.emit('configuration-changed', changeEvent);

      this.logger.info('Configuration updated successfully');

      return newConfig;

    } catch (error) {
      this.logger.error('Failed to update configuration', error as Error);
      throw error;
    }
  }

  /**
   * Reloads configuration from files
   */
  async reloadConfiguration(): Promise<AppConfig> {
    try {
      this.logger.info('Reloading configuration from files...');

      const previousConfig = this.currentConfig;
      const newConfig = await this.configManager.reloadConfiguration();

      // Validate new configuration
      ConfigurationValidator.validate(newConfig);

      this.currentConfig = newConfig;

      // Emit change event if configuration actually changed
      if (previousConfig && !this.isConfigurationEqual(previousConfig, newConfig)) {
        const changeEvent: ConfigurationChangeEvent = {
          type: 'configuration-changed',
          changes: this.getConfigurationDiff(previousConfig, newConfig),
          previousConfig,
          newConfig,
          timestamp: new Date(),
        };

        this.emit('configuration-changed', changeEvent);
      }

      this.logger.info('Configuration reloaded successfully');

      return newConfig;

    } catch (error) {
      this.logger.error('Failed to reload configuration', error as Error);
      throw error;
    }
  }

  /**
   * Saves current configuration to file
   */
  async saveConfiguration(filePath?: string): Promise<void> {
    try {
      if (!this.currentConfig) {
        throw new Error('No configuration to save');
      }

      const configPath = filePath || './config/runtime.json';
      
      this.logger.info('Saving configuration to file', { configPath });

      // Sanitize configuration before saving (remove sensitive data)
      const sanitizedConfig = ConfigurationValidator.sanitizeConfig(this.currentConfig);

      await this.fileSystemAdapter.writeJSON(configPath, sanitizedConfig);

      this.logger.info('Configuration saved successfully');

    } catch (error) {
      this.logger.error('Failed to save configuration', error as Error);
      throw error;
    }
  }

  /**
   * Validates a configuration object
   */
  validateConfiguration(config: any): { isValid: boolean; errors: string[] } {
    try {
      ConfigurationValidator.validate(config);
      return { isValid: true, errors: [] };
    } catch (error) {
      const errors = ConfigurationValidator.getValidationErrors(config);
      return { isValid: false, errors };
    }
  }

  /**
   * Gets configuration schema for documentation/UI purposes
   */
  getConfigurationSchema(): any {
    // This would return a JSON schema describing the configuration structure
    // For now, return a simplified version
    return {
      type: 'object',
      properties: {
        whatsapp: {
          type: 'object',
          properties: {
            sessionPath: { type: 'string' },
            puppeteerOptions: {
              type: 'object',
              properties: {
                headless: { type: 'boolean' },
                args: { type: 'array', items: { type: 'string' } },
              },
            },
          },
        },
        database: {
          type: 'object',
          properties: {
            type: { type: 'string', enum: ['sqlite', 'postgresql'] },
            sqlite: { type: 'object' },
            postgresql: { type: 'object' },
          },
        },
        server: {
          type: 'object',
          properties: {
            port: { type: 'number', minimum: 1, maximum: 65535 },
            host: { type: 'string' },
          },
        },
        defaults: {
          type: 'object',
          properties: {
            responseDelay: { type: 'number', minimum: 0, maximum: 86400 },
            autoMessage: { type: 'string', maxLength: 1000 },
          },
        },
      },
    };
  }

  /**
   * Starts watching configuration files for changes
   */
  async startConfigurationWatching(): Promise<void> {
    if (this.isWatching) {
      return;
    }

    try {
      this.logger.info('Starting configuration file watching...');

      // TODO: Implement file watching using fs.watch or chokidar
      // For now, we'll just set the flag
      this.isWatching = true;

      this.logger.info('Configuration file watching started');

    } catch (error) {
      this.logger.error('Failed to start configuration watching', error as Error);
      throw error;
    }
  }

  /**
   * Stops watching configuration files
   */
  async stopConfigurationWatching(): Promise<void> {
    if (!this.isWatching) {
      return;
    }

    try {
      this.logger.info('Stopping configuration file watching...');

      // TODO: Stop file watchers
      this.isWatching = false;

      this.logger.info('Configuration file watching stopped');

    } catch (error) {
      this.logger.error('Failed to stop configuration watching', error as Error);
      throw error;
    }
  }

  /**
   * Merges configuration objects
   */
  private mergeConfiguration(base: AppConfig, updates: Partial<AppConfig>): AppConfig {
    const result = { ...base };

    for (const key in updates) {
      const value = updates[key as keyof AppConfig];
      if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
        result[key as keyof AppConfig] = {
          ...(result[key as keyof AppConfig] as any),
          ...value,
        } as any;
      } else {
        (result as any)[key] = value;
      }
    }

    return result;
  }

  /**
   * Compares two configuration objects for equality
   */
  private isConfigurationEqual(config1: AppConfig, config2: AppConfig): boolean {
    return JSON.stringify(config1) === JSON.stringify(config2);
  }

  /**
   * Gets the difference between two configuration objects
   */
  private getConfigurationDiff(oldConfig: AppConfig, newConfig: AppConfig): Partial<AppConfig> {
    const diff: any = {};

    const compareObjects = (obj1: any, obj2: any, path: string = ''): void => {
      for (const key in obj2) {
        const currentPath = path ? `${path}.${key}` : key;
        
        if (obj1[key] !== obj2[key]) {
          if (typeof obj2[key] === 'object' && obj2[key] !== null && !Array.isArray(obj2[key])) {
            if (!diff[key]) diff[key] = {};
            compareObjects(obj1[key] || {}, obj2[key], currentPath);
          } else {
            diff[key] = obj2[key];
          }
        }
      }
    };

    compareObjects(oldConfig, newConfig);
    return diff;
  }
}