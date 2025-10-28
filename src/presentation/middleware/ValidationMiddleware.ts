import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';
import { ApiResponse } from '@presentation/dtos';

export class ValidationMiddleware {
  
  static validateBody(schema: Joi.ObjectSchema) {
    return (req: Request, res: Response, next: NextFunction): void => {
      const { error, value } = schema.validate(req.body, {
        abortEarly: false,
        stripUnknown: true,
      });

      if (error) {
        const response: ApiResponse = {
          success: false,
          message: 'Validation error',
          errors: error.details.map(detail => detail.message),
          meta: {
            timestamp: new Date().toISOString(),
            requestId: req.headers['x-request-id'] as string,
          },
        };

        res.status(400).json(response);
        return;
      }

      req.body = value;
      next();
    };
  }

  static validateQuery(schema: Joi.ObjectSchema) {
    return (req: Request, res: Response, next: NextFunction): void => {
      const { error, value } = schema.validate(req.query, {
        abortEarly: false,
        stripUnknown: true,
      });

      if (error) {
        const response: ApiResponse = {
          success: false,
          message: 'Query validation error',
          errors: error.details.map(detail => detail.message),
          meta: {
            timestamp: new Date().toISOString(),
            requestId: req.headers['x-request-id'] as string,
          },
        };

        res.status(400).json(response);
        return;
      }

      req.query = value;
      next();
    };
  }

  static validateParams(schema: Joi.ObjectSchema) {
    return (req: Request, res: Response, next: NextFunction): void => {
      const { error, value } = schema.validate(req.params, {
        abortEarly: false,
        stripUnknown: true,
      });

      if (error) {
        const response: ApiResponse = {
          success: false,
          message: 'Parameter validation error',
          errors: error.details.map(detail => detail.message),
          meta: {
            timestamp: new Date().toISOString(),
            requestId: req.headers['x-request-id'] as string,
          },
        };

        res.status(400).json(response);
        return;
      }

      req.params = value;
      next();
    };
  }
}

// Common validation schemas
export const ValidationSchemas = {
  // UUID validation
  uuid: Joi.string().uuid().required(),
  
  // Phone number validation
  phoneNumber: Joi.string().pattern(/^\+\d{7,15}$/).required(),
  
  // Pagination
  pagination: Joi.object({
    limit: Joi.number().integer().min(1).max(100).default(20),
    offset: Joi.number().integer().min(0).default(0),
  }),

  // Contact schemas
  createContact: Joi.object({
    phoneNumber: Joi.string().pattern(/^\+\d{7,15}$/).required(),
    name: Joi.string().min(1).max(100).required(),
    responseDelay: Joi.number().integer().min(0).max(86400).default(60),
    predefinedMessage: Joi.string().max(1000).optional(),
    isUrgent: Joi.boolean().default(false),
    autoResponseEnabled: Joi.boolean().default(true),
  }),

  updateContact: Joi.object({
    name: Joi.string().min(1).max(100).optional(),
    responseDelay: Joi.number().integer().min(0).max(86400).optional(),
    predefinedMessage: Joi.string().max(1000).allow('').optional(),
    isUrgent: Joi.boolean().optional(),
    autoResponseEnabled: Joi.boolean().optional(),
  }),

  // Message schemas
  messageHistory: Joi.object({
    limit: Joi.number().integer().min(1).max(100).default(50),
    offset: Joi.number().integer().min(0).default(0),
    fromDate: Joi.date().iso().optional(),
    toDate: Joi.date().iso().optional(),
  }),

  searchMessages: Joi.object({
    q: Joi.string().min(1).max(100).required(),
    contactId: Joi.string().uuid().optional(),
    messageType: Joi.string().valid('incoming', 'outgoing').optional(),
    limit: Joi.number().integer().min(1).max(100).default(20),
    offset: Joi.number().integer().min(0).default(0),
  }),

  // System schemas
  updateConfig: Joi.object({
    defaults: Joi.object({
      responseDelay: Joi.number().integer().min(0).max(86400).optional(),
      autoMessage: Joi.string().min(1).max(1000).optional(),
    }).optional(),
    whatsapp: Joi.object({
      sessionPath: Joi.string().min(1).optional(),
    }).optional(),
  }),
};