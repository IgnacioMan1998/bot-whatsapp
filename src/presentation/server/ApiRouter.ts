import { Router } from 'express';
import { injectable, inject } from 'inversify';
import { TYPES } from '@shared/constants';
import { 
  MessageController,
  ContactController,
  SystemController 
} from '@presentation/controllers';

@injectable()
export class ApiRouter {
  private router: Router;

  constructor(
    @inject(TYPES.MessageController) private messageController: MessageController,
    @inject(TYPES.ContactController) private contactController: ContactController,
    @inject(TYPES.SystemController) private systemController: SystemController
  ) {
    this.router = Router();
    this.setupRoutes();
  }

  private setupRoutes(): void {
    // Message routes
    this.setupMessageRoutes();
    
    // Contact routes
    this.setupContactRoutes();
    
    // System routes
    this.setupSystemRoutes();
  }

  private setupMessageRoutes(): void {
    const messageRouter = Router();
    
    // GET /api/messages/:contactId - Get message history for a contact
    messageRouter.get('/:contactId', this.messageController.getHistory.bind(this.messageController));
    
    // GET /api/messages - Search messages
    messageRouter.get('/', this.messageController.search.bind(this.messageController));
    
    // GET /api/messages/:contactId/stats - Get message statistics for a contact
    messageRouter.get('/:contactId/stats', this.messageController.getStats.bind(this.messageController));

    this.router.use('/messages', messageRouter);
  }

  private setupContactRoutes(): void {
    const contactRouter = Router();
    
    // GET /api/contacts - List all contacts
    contactRouter.get('/', this.contactController.list.bind(this.contactController));
    
    // POST /api/contacts - Create a new contact
    contactRouter.post('/', this.contactController.create.bind(this.contactController));
    
    // GET /api/contacts/:id - Get a specific contact
    contactRouter.get('/:id', this.contactController.get.bind(this.contactController));
    
    // PUT /api/contacts/:id - Update a contact
    contactRouter.put('/:id', this.contactController.update.bind(this.contactController));
    
    // DELETE /api/contacts/:id - Delete a contact
    contactRouter.delete('/:id', this.contactController.delete.bind(this.contactController));

    this.router.use('/contacts', contactRouter);
  }

  private setupSystemRoutes(): void {
    const systemRouter = Router();
    
    // GET /api/system/status - Get system status
    systemRouter.get('/status', this.systemController.getStatus.bind(this.systemController));
    
    // GET /api/system/config - Get system configuration
    systemRouter.get('/config', this.systemController.getConfig.bind(this.systemController));
    
    // PUT /api/system/config - Update system configuration
    systemRouter.put('/config', this.systemController.updateConfig.bind(this.systemController));
    
    // GET /api/system/stats - Get system statistics
    systemRouter.get('/stats', this.systemController.getStats.bind(this.systemController));

    this.router.use('/system', systemRouter);
  }

  public getRouter(): Router {
    return this.router;
  }
}