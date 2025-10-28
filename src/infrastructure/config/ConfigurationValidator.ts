import Joi from 'joi';
import { AppConfig } from '@shared/types';
import { InfrastructureError } from '@shared/types';

export class ConfigurationValidator {
  private static readonly schema = Joi.object({
    whatsapp: Joi.object({
      sessionPath: Joi.string().required(),
      puppeteerOptions: Joi.object({
        headless: Joi.boolean().required(),
        args: Joi.array().items(Joi.string()).required(),
      }).required(),
    }).required(),

    database: Joi.object({
      type: Joi.string().valid('sqlite', 'postgresql').required(),
      sqlite: Joi.when('type', {
        is: 'sqlite',
        then: Joi.object({
          path: Joi.string().required(),
          enableWAL: Joi.boolean().optional(),
          busyTimeout: Joi.number().integer().min(0).optional(),
        }).required(),
        otherwise: Joi.optional(),
      }),
      postgresql: Joi.when('type', {
        is: 'postgresql',
        then: Joi.object({
          host: Joi.string().required(),
          port: Joi.number().integer().min(1).max(65535).required(),
          database: Joi.string().required(),
          username: Joi.string().required(),
          password: Joi.string().allow('').required(),
          ssl: Joi.boolean().optional(),
          poolSize: Joi.number().integer().min(1).max(100).optional(),
          connectionTimeout: Joi.number().integer().min(1000).optional(),
        }).required(),
        otherwise: Joi.optional(),
      }),
    }).required(),

    server: Joi.object({
      port: Joi.number().integer().min(1).max(65535).required(),
      host: Joi.string().required(),
    }).required(),

    defaults: Joi.object({
      responseDelay: Joi.number().integer().min(0).max(86400).required(),
      autoMessage: Joi.string().min(1).max(1000).required(),
    }).required(),
  });

  static validate(config: any): AppConfig {
    const { error, value } = ConfigurationValidator.schema.validate(config, {
      abortEarly: false,
      allowUnknown: false,
      stripUnknown: true,
    });

    if (error) {
      const errorMessages = error.details.map(detail => detail.message).join(', ');
      throw new InfrastructureError(`Configuration validation failed: ${errorMessages}`);
    }

    return value as AppConfig;
  }

  static validatePartial(config: any): Partial<AppConfig> {
    const { error, value } = ConfigurationValidator.schema.validate(config, {
      abortEarly: false,
      allowUnknown: false,
      stripUnknown: true,
      presence: 'optional', // Allow partial validation
    });

    if (error) {
      const errorMessages = error.details.map(detail => detail.message).join(', ');
      throw new InfrastructureError(`Partial configuration validation failed: ${errorMessages}`);
    }

    return value as Partial<AppConfig>;
  }

  static validateDatabaseConfig(config: any): boolean {
    const databaseSchema = Joi.object({
      type: Joi.string().valid('sqlite', 'postgresql').required(),
      sqlite: Joi.when('type', {
        is: 'sqlite',
        then: Joi.object({
          path: Joi.string().required(),
          enableWAL: Joi.boolean().optional(),
          busyTimeout: Joi.number().integer().min(0).optional(),
        }).required(),
        otherwise: Joi.optional(),
      }),
      postgresql: Joi.when('type', {
        is: 'postgresql',
        then: Joi.object({
          host: Joi.string().required(),
          port: Joi.number().integer().min(1).max(65535).required(),
          database: Joi.string().required(),
          username: Joi.string().required(),
          password: Joi.string().allow('').required(),
          ssl: Joi.boolean().optional(),
          poolSize: Joi.number().integer().min(1).max(100).optional(),
          connectionTimeout: Joi.number().integer().min(1000).optional(),
        }).required(),
        otherwise: Joi.optional(),
      }),
    });

    const { error } = databaseSchema.validate(config);
    return !error;
  }

  static validateServerConfig(config: any): boolean {
    const serverSchema = Joi.object({
      port: Joi.number().integer().min(1).max(65535).required(),
      host: Joi.string().required(),
    });

    const { error } = serverSchema.validate(config);
    return !error;
  }

  static validateWhatsAppConfig(config: any): boolean {
    const whatsappSchema = Joi.object({
      sessionPath: Joi.string().required(),
      puppeteerOptions: Joi.object({
        headless: Joi.boolean().required(),
        args: Joi.array().items(Joi.string()).required(),
      }).required(),
    });

    const { error } = whatsappSchema.validate(config);
    return !error;
  }

  static getValidationErrors(config: any): string[] {
    const { error } = ConfigurationValidator.schema.validate(config, {
      abortEarly: false,
    });

    if (error) {
      return error.details.map(detail => detail.message);
    }

    return [];
  }

  static sanitizeConfig(config: AppConfig): AppConfig {
    // Create a copy and sanitize sensitive information for logging
    const sanitized = JSON.parse(JSON.stringify(config));

    if (sanitized.database?.postgresql?.password) {
      sanitized.database.postgresql.password = '***REDACTED***';
    }

    return sanitized;
  }
}