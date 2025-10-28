# Implementation Plan

- [x] 1. Set up project structure following Clean Architecture
  - Create Node.js project with TypeScript configuration
  - Install core dependencies: whatsapp-web.js, sqlite3, pg, express, winston
  - Install additional dependencies: inversify, reflect-metadata, joi, dotenv
  - Set up Clean Architecture directory structure: domain/, application/, infrastructure/, presentation/
  - Configure TypeScript with path mapping for clean imports and decorators
  - Configure ESLint, Prettier, and dependency injection container
  - _Requirements: 4.1, 4.3_

- [x] 2. Implement Domain Layer (Entities and Business Logic)
  - [x] 2.1 Create core domain entities
    - Implement Message entity with business logic methods
    - Create Contact entity with configuration management
    - Implement Timer entity with expiration logic
    - Define value objects: MessageId, ContactId, PhoneNumber, etc.
    - _Requirements: 1.1, 1.2, 3.1, 2.1_

  - [x] 2.2 Define repository interfaces (ports)
    - Create MessageRepository interface with domain methods
    - Define ContactRepository interface for contact management
    - Implement TimerRepository interface for timer operations
    - _Requirements: 5.1, 5.2, 3.1, 2.1_

  - [x] 2.3 Implement domain services
    - Create AutoResponseService with business rules
    - Implement NotificationService for urgent message detection
    - Add domain validation and business rule enforcement
    - _Requirements: 2.3, 3.2, 6.1, 6.3_

  - [ ]\* 2.4 Write unit tests for domain layer
    - Test entity business logic and invariants
    - Validate domain services behavior
    - _Requirements: 1.1, 2.1, 3.1_

- [x] 3. Implement Application Layer (Use Cases)
  - [x] 3.1 Create message processing use cases
    - Implement ProcessIncomingMessageUseCase with domain orchestration
    - Create ProcessOutgoingMessageUseCase for user messages
    - Add GetMessageHistoryUseCase for message retrieval
    - Define command and query DTOs for use case communication
    - _Requirements: 1.1, 1.2, 5.2_

  - [x] 3.2 Implement contact management use cases
    - Create ConfigureContactUseCase for contact configuration
    - Implement GetContactConfigurationUseCase for retrieval
    - Add UpdateContactConfigurationUseCase for modifications
    - _Requirements: 3.1, 3.3, 3.4_

  - [x] 3.3 Create timer and auto-response use cases
    - Implement StartAutoResponseTimerUseCase for timer creation
    - Create HandleTimerExpirationUseCase for expired timers
    - Add CancelAutoResponseTimerUseCase for user responses
    - _Requirements: 2.1, 2.2, 2.3_

  - [x] 3.4 Implement notification use cases
    - Create ProcessUrgentMessageUseCase for urgent handling
    - Implement SendNotificationUseCase for user alerts
    - Add ConfigureNotificationPreferencesUseCase
    - _Requirements: 6.1, 6.2, 6.4_

  - [ ]\* 3.5 Write unit tests for use cases
    - Test use case orchestration and business flow
    - Mock repository dependencies for isolated testing
    - _Requirements: 1.1, 2.1, 3.1, 6.1_

- [x] 4. Implement Infrastructure Layer (Adapters)
  - [x] 4.1 Create database abstraction layer and adapters
    - Implement DatabaseAdapter interface with query builder
    - Create SQLiteDatabaseAdapter as default implementation
    - Implement PostgreSQLDatabaseAdapter for production scaling
    - Add database migration system with version control
    - Create database factory for adapter selection based on configuration
    - _Requirements: 5.1, 5.2, 5.3, 3.1_

  - [x] 4.2 Implement WhatsApp adapter
    - Create WhatsAppWebAdapter implementing WhatsAppPort
    - Add QR code generation and authentication handling
    - Implement message sending and receiving capabilities
    - Handle connection errors and automatic reconnection
    - _Requirements: 1.1, 1.4, 4.2, 4.4_

  - [x] 4.3 Implement repository implementations for both databases
    - Create MessageRepositoryImpl using DatabaseAdapter abstraction
    - Implement ContactRepositoryImpl with multi-database support
    - Create TimerRepositoryImpl with database-agnostic queries
    - Add repository factory for dependency injection
    - _Requirements: 5.1, 5.2, 3.1, 2.1_

  - [x] 4.4 Create configuration and file system adapters
    - Implement FileSystemConfigAdapter for configuration management
    - Create JSONConfigurationRepository for settings persistence
    - Add environment variable configuration support with database selection
    - Implement configuration validation for different database types
    - _Requirements: 4.3, 3.4_

  - [ ]\* 4.5 Write integration tests for adapters
    - Test database adapter operations with both SQLite and PostgreSQL
    - Create database-agnostic test suite for repository implementations
    - Mock WhatsApp Web for adapter testing
    - Test migration system with both database types
    - _Requirements: 5.1, 1.1, 4.2_

- [x] 5. Implement Presentation Layer (Controllers and API)
  - [x] 5.1 Create Express server with Clean Architecture setup
    - Set up Express server with dependency injection
    - Configure middleware for authentication, logging, and error handling
    - Implement request/response DTOs and validation
    - Add OpenAPI/Swagger documentation setup
    - _Requirements: 4.3_

  - [x] 5.2 Implement message management controllers
    - Create MessageController with use case injection
    - Implement GET /api/messages/:contactId endpoint
    - Add GET /api/messages with filtering and pagination
    - Create message search endpoint with query validation
    - _Requirements: 5.2, 5.3_

  - [x] 5.3 Implement contact management controllers
    - Create ContactController with clean separation
    - Implement POST/PUT /api/contacts endpoints
    - Add GET /api/contacts with proper response mapping
    - Create DELETE /api/contacts/:id with validation
    - _Requirements: 3.3, 3.4_

  - [x] 5.4 Implement system configuration controllers
    - Create SystemController for configuration management
    - Implement PUT /api/config with validation
    - Add GET /api/config with proper response formatting
    - Create GET /api/status for health monitoring
    - _Requirements: 4.3_

  - [ ]\* 5.5 Write integration tests for API layer
    - Test controller behavior with mocked use cases
    - Validate request/response mapping and error handling
    - _Requirements: 4.3, 5.2, 3.3_

- [x] 6. Implement Dependency Injection and Application Composition
  - [x] 6.1 Create dependency injection container
    - Set up IoC container (e.g., inversify or awilix)
    - Define service registration and lifetime management
    - Create factory functions for complex dependencies
    - Implement configuration-based service registration
    - _Requirements: 4.1, 4.3_

  - [x] 6.2 Create application composition root
    - Implement CompositionRoot for dependency wiring
    - Create factory methods for use case instantiation
    - Add adapter registration and configuration
    - Implement service locator pattern for controllers
    - _Requirements: 4.1, 4.2, 4.3_

  - [ ]\* 6.3 Write tests for dependency injection
    - Test service registration and resolution
    - Validate dependency graph construction
    - _Requirements: 4.1_

- [x] 7. Create Application Orchestrator and Event Handling
  - [x] 7.1 Implement main Application class with Clean Architecture
    - Create Application class as composition root coordinator
    - Implement application startup sequence with proper dependency order
    - Add graceful shutdown handling with resource cleanup
    - Create application lifecycle management with health monitoring
    - _Requirements: 4.1, 4.2, 4.3_

  - [x] 7.2 Implement event-driven message processing
    - Create event bus for decoupled communication between layers
    - Implement domain events for message processing
    - Add event handlers for timer expiration and auto-responses
    - Create event sourcing for message audit trail
    - _Requirements: 1.1, 1.2, 2.1, 2.3_

  - [x] 7.3 Add configuration management and validation
    - Implement configuration loading with environment overrides
    - Add configuration validation with schema validation
    - Create configuration hot-reloading capabilities
    - Implement configuration versioning and migration
    - _Requirements: 4.3, 3.4_

  - [ ]\* 7.4 Write integration tests for application orchestration
    - Test application startup and shutdown sequences
    - Validate event processing and message flows
    - _Requirements: 4.1, 1.1, 2.1_

- [ ] 8. Create CLI Interface and Monitoring
  - [-] 8.1 Implement CLI commands following Clean Architecture
    - Create CLI command handlers using use cases
    - Implement commands for contact management and configuration
    - Add system status and health check commands
    - Create data export and import commands
    - _Requirements: 4.3, 5.3_

  - [ ] 8.2 Add comprehensive logging and monitoring
    - Implement structured logging with correlation IDs
    - Add performance monitoring and metrics collection
    - Create health check endpoints with dependency validation
    - Implement error tracking and alerting
    - _Requirements: 4.1, 4.4_

  - [ ]\* 8.3 Write monitoring and observability tests
    - Test logging output and structured data
    - Validate health check responses and metrics
    - _Requirements: 4.1, 4.4_

- [ ] 9. Create deployment artifacts and documentation
  - [ ] 9.1 Create application entry points and build scripts
    - Implement main index.ts with proper error handling
    - Create npm scripts for development, build, and production
    - Add Docker configuration with multi-stage builds
    - Create process management configuration (PM2/systemd)
    - _Requirements: 4.1, 4.2_

  - [ ] 9.2 Create configuration templates and deployment guides
    - Create environment-specific configuration templates
    - Write deployment and setup documentation
    - Add troubleshooting guide and FAQ
    - Create API documentation with examples
    - _Requirements: 4.3_

  - [ ]\* 9.3 Write end-to-end system tests
    - Create full system integration tests with real dependencies
    - Test complete message flow from WhatsApp to auto-response
    - Validate system behavior under load and error conditions
    - _Requirements: 1.1, 2.1, 2.3, 4.1_
