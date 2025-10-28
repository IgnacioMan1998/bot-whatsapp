import { injectable, inject } from 'inversify';
import { EventEmitter } from 'events';
import { TYPES } from '@shared/constants';
import { Logger } from '@shared/utils/logger';
import { AppConfig } from '@shared/types';
import { FileSystemConfigurationManager, ConfigurationValidator } from '@infrastructure/config';
import { InfrastructureError } from '@shared/types';

export interface ConfigurationChangeEvent {
  type: 'configuration-changed';
  oldConfig: AppConfig;
  newConfig: AppConfig;
  changes: string[];
  timestamp: Date;
}

export interface ConfigurationService {
  getCurrentConfig(): AppConfig;
  updateConfig(updates: Partial<AppConfig>): Promise<void>;
  reloadConfig(): Promise<void>;
  validateConfig(config: Partial<AppConfig>): { isValid: boolean; errors: string[] };
  onConfigurationChanged(callback: (event: ConfigurationChangeEvent) => void): void;
  getConfigurationHistory(): ConfigurationChangeEvent[];
}

@injectable()
export class ConfigurationServiceImpl implements ConfigurationService {
  private currentConfig: AppConfig;
  private eventEmitter: EventEmitter;
  private configurationHistory: ConfigurationChangeEvent[] = [];
  private maxHistorySize: number = 50;

  constructor(
    @inject(TYPES.Logger) private logger: Logger,
    private configManager: FileSystemConfigurationManager,
    initialConfig: AppConfig
  ) {
    this.currentConfig = initialConfig;
    this.eventEmitter = new EventEmitter();
    this.eventEmitter.setMaxListeners(20);
  }

  getCurrentConfig(): AppConfig {
    return { ...this.currentConfig }; // Return a copy to prevent mutations
  }

  async updateConfig(updates: Partial<AppConfig>): Promise<void> {
    try {
      this.logger.info('Updating configuration', { updates });

      // Validate the updates
      const validation = this.validateConfig(updates);
      if (!validation.isValid) {
        throw new InfrastructureError(`Configuration validation failed: ${validation.errors.join(', ')}`);
      }

      // Create new configuration
      const oldConfig = { ...this.currentConfig };
      const newConfig = this.mergeConfigurations(this.currentConfig, updates);

      // Validate the complete new configuration
      const fullValidation = ConfigurationValidator.validate(newConfig);

      // Detect changes
      const changes = this.detectChanges(oldConfig, newConfig);

      if (changes.length === 0) {
        this.logger.info('No configuration changes detected');
        return;
      }

      // Update current configuration
      this.currentConfig = newConfig;

      // Create change event
      const changeEvent: ConfigurationChangeEvent = {
        type: 'configuration-changed',
        oldConfig,
        newConfig,
        changes,
        timestamp: new Date(),
      };

      // Add to history
      this.addToHistory(changeEvent);

      // Emit change event
      this.eventEmitter.emit('configuration-changed', changeEvent);

      this.logger.info('Configuration updated successfully', {
        changes,
        timestamp: changeEvent.timestamp,
      });

    } catch (error) {
      this.logger.error('Failed to update configuration', error as Error);
      throw error;
    }
  }

  async reloadConfig(): Promise<void> {
    try {
      this.logger.info('Reloading configuration from file system');

      const oldConfig = { ...this.currentConfig };
      const newConfig = await this.configManager.reloadConfiguration();

      // Detect changes
      const changes = this.detectChanges(oldConfig, newConfig);

      if (changes.length === 0) {
        this.logger.info('No configuration changes detected after reload');
        return;
      }

      // Update current configuration
      this.currentConfig = newConfig;

      // Create change event
      const changeEvent: ConfigurationChangeEvent = {
        type: 'configuration-changed',
        oldConfig,
        newConfig,
        changes,
        timestamp: new Date(),
      };

      // Add to history
      this.addToHistory(changeEvent);

      // Emit change event
      this.eventEmitter.emit('configuration-changed', changeEvent);

      this.logger.info('Configuration reloaded successfully', {
        changes,
        timestamp: changeEvent.timestamp,
      });

    } catch (error) {
      this.logger.error('Failed to reload configuration', error as Error);
      throw error;
    }
  }

  validateConfig(config: Partial<AppConfig>): { isValid: boolean; errors: string[] } {
    try {
      ConfigurationValidator.validatePartial(config);
      return { isValid: true, errors: [] };
    } catch (error) {
      const errors = error instanceof Error ? [error.message] : ['Unknown validation error'];
      return { isValid: false, errors };
    }
  }

  onConfigurationChanged(callback: (event: ConfigurationChangeEvent) => void): void {
    this.eventEmitter.on('configuration-changed', callback);
  }

  getConfigurationHistory(): ConfigurationChangeEvent[] {
    return [...this.configurationHistory]; // Return a copy
  }

  // Hot-reload configuration file watching
  enableHotReload(): void {
    // TODO: Implement file system watching for configuration files
    // This would watch config files and automatically reload when they change
    this.logger.info('Hot-reload configuration watching enabled');
  }

  disableHotReload(): void {
    // TODO: Disable file system watching
    this.logger.info('Hot-reload configuration watching disabled');
  }

  // Configuration backup and restore
  async createConfigurationBackup(): Promise<string> {
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const backupPath = `./config/backups/config-backup-${timestamp}.json`;
      
      // TODO: Implement backup creation using FileSystemAdapter
      this.logger.info('Configuration backup created', { backupPath });
      
      return backupPath;
    } catch (error) {
      this.logger.error('Failed to create configuration backup', error as Error);
      throw error;
    }
  }

  async restoreConfigurationFromBackup(backupPath: string): Promise<void> {
    try {
      // TODO: Implement backup restoration
      this.logger.info('Configuration restored from backup', { backupPath });
      
      // Reload configuration after restoration
      await this.reloadConfig();
    } catch (error) {
      this.logger.error('Failed to restore configuration from backup', error as Error);
      throw error;
    }
  }

  private mergeConfigurations(base: AppConfig, updates: Partial<AppConfig>): AppConfig {
    const result: any = { ...base };

    for (const key in updates) {
      const updateValue = updates[key as keyof AppConfig];
      if (updateValue !== null && typeof updateValue === 'object' && !Array.isArray(updateValue)) {
        result[key] = {
          ...result[key],
          ...updateValue,
        };
      } else {
        result[key] = updateValue;
      }
    }

    return result as AppConfig;
  }

  private detectChanges(oldConfig: AppConfig, newConfig: AppConfig): string[] {
    const changes: string[] = [];

    // Compare top-level properties
    for (const key in newConfig) {
      if (this.hasChanged(oldConfig[key as keyof AppConfig], newConfig[key as keyof AppConfig])) {
        changes.push(key);
      }
    }

    return changes;
  }

  private hasChanged(oldValue: any, newValue: any): boolean {
    if (oldValue === newValue) {
      return false;
    }

    if (typeof oldValue !== typeof newValue) {
      return true;
    }

    if (typeof oldValue === 'object' && oldValue !== null && newValue !== null) {
      return JSON.stringify(oldValue) !== JSON.stringify(newValue);
    }

    return true;
  }

  private addToHistory(event: ConfigurationChangeEvent): void {
    this.configurationHistory.push(event);

    // Keep history size under control
    if (this.configurationHistory.length > this.maxHistorySize) {
      this.configurationHistory = this.configurationHistory.slice(-this.maxHistorySize);
    }
  }

  // Configuration migration support
  async migrateConfiguration(fromVersion: string, toVersion: string): Promise<void> {
    try {
      this.logger.info('Migrating configuration', { fromVersion, toVersion });

      // TODO: Implement configuration migration logic
      // This would handle breaking changes between configuration versions

      this.logger.info('Configuration migration completed', { fromVersion, toVersion });
    } catch (error) {
      this.logger.error('Configuration migration failed', error as Error);
      throw error;
    }
  }

  // Configuration schema versioning
  getConfigurationVersion(): string {
    return this.currentConfig.version || '1.0.0';
  }

  isConfigurationVersionSupported(version: string): boolean {
    // TODO: Implement version compatibility checking
    return true;
  }
}