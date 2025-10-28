import { Request, Response } from 'express';
import { injectable, inject } from 'inversify';
import { TYPES } from '@shared/constants';
import { Logger } from '@shared/utils/logger';
import { 
  ConfigureContactUseCase,
  GetContactConfigurationUseCase,
  UpdateContactConfigurationUseCase,
  GetContactsUseCase,
  ConfigureContactCommand,
  UpdateContactConfigurationCommand,
  GetContactQuery,
  GetContactsQuery
} from '@application/index';
import { 
  CreateContactRequest,
  UpdateContactRequest,
  GetContactRequest,
  GetContactsRequest,
  ApiResponse,
  PaginatedApiResponse,
  ContactResponse 
} from '@presentation/dtos';
import { ValidationSchemas } from '@presentation/middleware';

export interface ContactController {
  create(req: Request, res: Response): Promise<void>;
  get(req: Request, res: Response): Promise<void>;
  update(req: Request, res: Response): Promise<void>;
  delete(req: Request, res: Response): Promise<void>;
  list(req: Request, res: Response): Promise<void>;
}

@injectable()
export class ContactControllerImpl implements ContactController {
  constructor(
    @inject(TYPES.ConfigureContactUseCase) private configureContactUseCase: ConfigureContactUseCase,
    @inject(TYPES.GetContactConfigurationUseCase) private getContactConfigurationUseCase: GetContactConfigurationUseCase,
    @inject(TYPES.UpdateContactConfigurationUseCase) private updateContactConfigurationUseCase: UpdateContactConfigurationUseCase,
    @inject(TYPES.GetContactsUseCase) private getContactsUseCase: GetContactsUseCase,
    @inject(TYPES.Logger) private logger: Logger
  ) {}

  async create(req: Request, res: Response): Promise<void> {
    try {
      const request = req as CreateContactRequest;
      
      // Validate request body
      const validation = ValidationSchemas.createContact.validate(request.body);
      if (validation.error) {
        const response: ApiResponse = {
          success: false,
          message: 'Validation error',
          errors: validation.error.details.map(detail => detail.message),
          meta: {
            timestamp: new Date().toISOString(),
            requestId: req.headers['x-request-id'] as string,
          },
        };
        res.status(400).json(response);
        return;
      }

      // Build command
      const command: ConfigureContactCommand = {
        phoneNumber: request.body.phoneNumber,
        name: request.body.name,
        responseDelay: request.body.responseDelay || 60,
        predefinedMessage: request.body.predefinedMessage,
        isUrgent: request.body.isUrgent || false,
        autoResponseEnabled: request.body.autoResponseEnabled !== false,
      };

      // Execute use case
      const result = await this.configureContactUseCase.execute(command);

      if (!result.success) {
        const response: ApiResponse = {
          success: false,
          message: result.message || 'Failed to create contact',
          errors: result.errors,
          meta: {
            timestamp: new Date().toISOString(),
            requestId: req.headers['x-request-id'] as string,
          },
        };
        res.status(400).json(response);
        return;
      }

      // Map to response format
      const contactResponse: ContactResponse = {
        id: result.data!.id,
        phoneNumber: result.data!.phoneNumber,
        name: result.data!.name,
        responseDelay: result.data!.responseDelay,
        predefinedMessage: result.data!.predefinedMessage,
        isUrgent: result.data!.isUrgent,
        autoResponseEnabled: result.data!.autoResponseEnabled,
        createdAt: result.data!.createdAt.toISOString(),
        updatedAt: result.data!.updatedAt.toISOString(),
      };

      const response: ApiResponse<ContactResponse> = {
        success: true,
        message: 'Contact created successfully',
        data: contactResponse,
        meta: {
          timestamp: new Date().toISOString(),
          requestId: req.headers['x-request-id'] as string,
        },
      };

      res.status(201).json(response);
    } catch (error) {
      this.logger.error('Error in ContactController.create', error as Error);
      const response: ApiResponse = {
        success: false,
        message: 'Internal server error',
        errors: ['Failed to create contact'],
        meta: {
          timestamp: new Date().toISOString(),
          requestId: req.headers['x-request-id'] as string,
        },
      };
      res.status(500).json(response);
    }
  }

  async get(req: Request, res: Response): Promise<void> {
    try {
      const request = req as GetContactRequest;
      const { id } = request.params;

      // Validate contact ID
      const validation = ValidationSchemas.uuid.validate(id);
      if (validation.error) {
        const response: ApiResponse = {
          success: false,
          message: 'Invalid contact ID',
          errors: [validation.error.message],
          meta: {
            timestamp: new Date().toISOString(),
            requestId: req.headers['x-request-id'] as string,
          },
        };
        res.status(400).json(response);
        return;
      }

      // Build query
      const query: GetContactQuery = { contactId: id };

      // Execute use case
      const result = await this.getContactConfigurationUseCase.execute(query);

      if (!result.success) {
        const statusCode = result.errors?.includes('Contact not found') ? 404 : 400;
        const response: ApiResponse = {
          success: false,
          message: result.message || 'Failed to get contact',
          errors: result.errors,
          meta: {
            timestamp: new Date().toISOString(),
            requestId: req.headers['x-request-id'] as string,
          },
        };
        res.status(statusCode).json(response);
        return;
      }

      // Map to response format
      const contactResponse: ContactResponse = {
        id: result.data!.id,
        phoneNumber: result.data!.phoneNumber,
        name: result.data!.name,
        responseDelay: result.data!.responseDelay,
        predefinedMessage: result.data!.predefinedMessage,
        isUrgent: result.data!.isUrgent,
        autoResponseEnabled: result.data!.autoResponseEnabled,
        createdAt: result.data!.createdAt.toISOString(),
        updatedAt: result.data!.updatedAt.toISOString(),
      };

      const response: ApiResponse<ContactResponse> = {
        success: true,
        message: 'Contact retrieved successfully',
        data: contactResponse,
        meta: {
          timestamp: new Date().toISOString(),
          requestId: req.headers['x-request-id'] as string,
        },
      };

      res.json(response);
    } catch (error) {
      this.logger.error('Error in ContactController.get', error as Error);
      const response: ApiResponse = {
        success: false,
        message: 'Internal server error',
        errors: ['Failed to retrieve contact'],
        meta: {
          timestamp: new Date().toISOString(),
          requestId: req.headers['x-request-id'] as string,
        },
      };
      res.status(500).json(response);
    }
  }

  async update(req: Request, res: Response): Promise<void> {
    try {
      const request = req as UpdateContactRequest;
      const { id } = request.params;

      // Validate contact ID
      const idValidation = ValidationSchemas.uuid.validate(id);
      if (idValidation.error) {
        const response: ApiResponse = {
          success: false,
          message: 'Invalid contact ID',
          errors: [idValidation.error.message],
          meta: {
            timestamp: new Date().toISOString(),
            requestId: req.headers['x-request-id'] as string,
          },
        };
        res.status(400).json(response);
        return;
      }

      // Validate request body
      const bodyValidation = ValidationSchemas.updateContact.validate(request.body);
      if (bodyValidation.error) {
        const response: ApiResponse = {
          success: false,
          message: 'Validation error',
          errors: bodyValidation.error.details.map(detail => detail.message),
          meta: {
            timestamp: new Date().toISOString(),
            requestId: req.headers['x-request-id'] as string,
          },
        };
        res.status(400).json(response);
        return;
      }

      // Build command
      const command: UpdateContactConfigurationCommand = {
        contactId: id,
        ...request.body,
      };

      // Execute use case
      const result = await this.updateContactConfigurationUseCase.execute(command);

      if (!result.success) {
        const statusCode = result.errors?.includes('Contact not found') ? 404 : 400;
        const response: ApiResponse = {
          success: false,
          message: result.message || 'Failed to update contact',
          errors: result.errors,
          meta: {
            timestamp: new Date().toISOString(),
            requestId: req.headers['x-request-id'] as string,
          },
        };
        res.status(statusCode).json(response);
        return;
      }

      // Map to response format
      const contactResponse: ContactResponse = {
        id: result.data!.id,
        phoneNumber: result.data!.phoneNumber,
        name: result.data!.name,
        responseDelay: result.data!.responseDelay,
        predefinedMessage: result.data!.predefinedMessage,
        isUrgent: result.data!.isUrgent,
        autoResponseEnabled: result.data!.autoResponseEnabled,
        createdAt: result.data!.createdAt.toISOString(),
        updatedAt: result.data!.updatedAt.toISOString(),
      };

      const response: ApiResponse<ContactResponse> = {
        success: true,
        message: 'Contact updated successfully',
        data: contactResponse,
        meta: {
          timestamp: new Date().toISOString(),
          requestId: req.headers['x-request-id'] as string,
        },
      };

      res.json(response);
    } catch (error) {
      this.logger.error('Error in ContactController.update', error as Error);
      const response: ApiResponse = {
        success: false,
        message: 'Internal server error',
        errors: ['Failed to update contact'],
        meta: {
          timestamp: new Date().toISOString(),
          requestId: req.headers['x-request-id'] as string,
        },
      };
      res.status(500).json(response);
    }
  }

  async delete(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      // Validate contact ID
      const validation = ValidationSchemas.uuid.validate(id);
      if (validation.error) {
        const response: ApiResponse = {
          success: false,
          message: 'Invalid contact ID',
          errors: [validation.error.message],
          meta: {
            timestamp: new Date().toISOString(),
            requestId: req.headers['x-request-id'] as string,
          },
        };
        res.status(400).json(response);
        return;
      }

      // TODO: Implement delete contact use case
      // For now, return a placeholder response
      const response: ApiResponse = {
        success: true,
        message: 'Contact deleted successfully',
        meta: {
          timestamp: new Date().toISOString(),
          requestId: req.headers['x-request-id'] as string,
        },
      };

      res.json(response);
    } catch (error) {
      this.logger.error('Error in ContactController.delete', error as Error);
      const response: ApiResponse = {
        success: false,
        message: 'Internal server error',
        errors: ['Failed to delete contact'],
        meta: {
          timestamp: new Date().toISOString(),
          requestId: req.headers['x-request-id'] as string,
        },
      };
      res.status(500).json(response);
    }
  }

  async list(req: Request, res: Response): Promise<void> {
    try {
      const request = req as GetContactsRequest;
      const { 
        limit = '20', 
        offset = '0', 
        isUrgent, 
        autoResponseEnabled, 
        search 
      } = request.query;

      // Build query
      const query: GetContactsQuery = {
        limit: parseInt(limit, 10),
        offset: parseInt(offset, 10),
        isUrgent: isUrgent ? isUrgent === 'true' : undefined,
        autoResponseEnabled: autoResponseEnabled ? autoResponseEnabled === 'true' : undefined,
      };

      // Execute use case
      const result = await this.getContactsUseCase.execute(query);

      if (!result.success) {
        const response: ApiResponse = {
          success: false,
          message: result.message || 'Failed to get contacts',
          errors: result.errors,
          meta: {
            timestamp: new Date().toISOString(),
            requestId: req.headers['x-request-id'] as string,
          },
        };
        res.status(400).json(response);
        return;
      }

      // Map to response format
      const contacts: ContactResponse[] = result.data!.contacts.map(contact => ({
        id: contact.id,
        phoneNumber: contact.phoneNumber,
        name: contact.name,
        responseDelay: contact.responseDelay,
        predefinedMessage: contact.predefinedMessage,
        isUrgent: contact.isUrgent,
        autoResponseEnabled: contact.autoResponseEnabled,
        createdAt: contact.createdAt.toISOString(),
        updatedAt: contact.updatedAt.toISOString(),
      }));

      const response: PaginatedApiResponse<ContactResponse[]> = {
        success: true,
        message: 'Contacts retrieved successfully',
        data: contacts,
        pagination: {
          page: Math.floor(parseInt(offset, 10) / parseInt(limit, 10)) + 1,
          limit: parseInt(limit, 10),
          total: result.data!.totalCount,
          totalPages: Math.ceil(result.data!.totalCount / parseInt(limit, 10)),
          hasNext: result.data!.hasMore,
          hasPrev: parseInt(offset, 10) > 0,
        },
        meta: {
          timestamp: new Date().toISOString(),
          requestId: req.headers['x-request-id'] as string,
        },
      };

      res.json(response);
    } catch (error) {
      this.logger.error('Error in ContactController.list', error as Error);
      const response: ApiResponse = {
        success: false,
        message: 'Internal server error',
        errors: ['Failed to retrieve contacts'],
        meta: {
          timestamp: new Date().toISOString(),
          requestId: req.headers['x-request-id'] as string,
        },
      };
      res.status(500).json(response);
    }
  }
}