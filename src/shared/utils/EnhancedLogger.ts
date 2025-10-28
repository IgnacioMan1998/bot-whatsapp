import winston from 'winston';
import { v4 as uuidv4 } from 'uuid';
import { Logger } from './logger';

export interface LogContext {
  correlationId?: string;
  userId?: string;
  contactId?: string;
  messageId?: string;
  requestId?: string;
  operation?: string;
  [key: string]: any;
}

export class EnhancedLogger implements Logger {
  private logger: winston.Logger;
  private defaultContext: LogContext = {};

  constructor() {
    this.logger = winston.createLogger({
      level: process.env.LOG_LEVEL || 'info',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.errors({ stack: true }),
        winston.format.json(),
        winston.format.printf(({ timestamp, level, message, correlationId, ...meta }) => {
          const logEntry = {
            timestamp,
            level,
            message,
            correlationId: correlationId || 'no-correlation',
            ...meta,
          };
          return JSON.stringify(logEntry);
        })
      ),
      defaultMeta: { 
        service: 'whatsapp-assistant',
        version: process.env.npm_package_version || '1.0.0',
        environment: process.env.NODE_ENV || 'development',
        pid: process.pid,
      },
      transports: [
        new winston.transports.File({ 
          filename: 'logs/error.log', 
          level: 'error',
          maxsize: 5242880, // 5MB
          maxFiles: 5,
        }),
        new winston.transports.File({ 
          filename: 'logs/combined.log',
          maxsize: 5242880, // 5MB
          maxFiles: 10,
        }),
      ],
    });

    if (process.env.NODE_ENV !== 'production') {
      this.logger.add(
        new winston.transports.Console({
          format: winston.format.combine(
            winston.format.colorize(),
            winston.format.timestamp({ format: 'HH:mm:ss' }),
            winston.format.printf(({ timestamp, level, message, correlationId, ...meta }) => {
              const metaStr = Object.keys(meta).length > 0 ? ` ${JSON.stringify(meta)}` : '';
              const corrId = correlationId ? `[${correlationId.substring(0, 8)}]` : '[no-corr]';
              return `${timestamp} ${level} ${corrId} ${message}${metaStr}`;
            })
          ),
        })
      );
    }
  }

  setDefaultContext(context: LogContext): void {
    this.defaultContext = { ...context };
  }

  clearDefaultContext(): void {
    this.defaultContext = {};
  }

  withContext(context: LogContext): EnhancedLogger {
    const newLogger = new EnhancedLogger();
    newLogger.setDefaultContext({ ...this.defaultContext, ...context });
    return newLogger;
  }

  generateCorrelationId(): string {
    return uuidv4();
  }

  info(message: string, meta?: LogContext): void {
    const context = { ...this.defaultContext, ...meta };
    if (!context.correlationId) {
      context.correlationId = this.generateCorrelationId();
    }
    this.logger.info(message, context);
  }

  error(message: string, error?: Error, meta?: LogContext): void {
    const context = { 
      ...this.defaultContext, 
      ...meta,
      error: error ? {
        name: error.name,
        message: error.message,
        stack: error.stack,
      } : undefined,
    };
    if (!context.correlationId) {
      context.correlationId = this.generateCorrelationId();
    }
    this.logger.error(message, context);
  }

  warn(message: string, meta?: LogContext): void {
    const context = { ...this.defaultContext, ...meta };
    if (!context.correlationId) {
      context.correlationId = this.generateCorrelationId();
    }
    this.logger.warn(message, context);
  }

  debug(message: string, meta?: LogContext): void {
    const context = { ...this.defaultContext, ...meta };
    if (!context.correlationId) {
      context.correlationId = this.generateCorrelationId();
    }
    this.logger.debug(message, context);
  }

  // Performance logging
  startTimer(operation: string, context?: LogContext): () => void {
    const correlationId = context?.correlationId || this.generateCorrelationId();
    const startTime = Date.now();
    
    this.info(`Starting operation: ${operation}`, {
      ...this.defaultContext,
      ...context,
      correlationId,
      operation,
      phase: 'start',
    });

    return () => {
      const duration = Date.now() - startTime;
      this.info(`Completed operation: ${operation}`, {
        ...this.defaultContext,
        ...context,
        correlationId,
        operation,
        phase: 'complete',
        duration: `${duration}ms`,
      });
    };
  }

  // Structured logging for different event types
  logMessageReceived(messageId: string, from: string, context?: LogContext): void {
    this.info('Message received', {
      ...this.defaultContext,
      ...context,
      messageId,
      from,
      eventType: 'message_received',
    });
  }

  logMessageSent(messageId: string, to: string, context?: LogContext): void {
    this.info('Message sent', {
      ...this.defaultContext,
      ...context,
      messageId,
      to,
      eventType: 'message_sent',
    });
  }

  logAutoResponse(messageId: string, contactId: string, responseMessage: string, context?: LogContext): void {
    this.info('Auto-response sent', {
      ...this.defaultContext,
      ...context,
      messageId,
      contactId,
      responseLength: responseMessage.length,
      eventType: 'auto_response',
    });
  }

  logTimerStarted(timerId: string, contactId: string, delaySeconds: number, context?: LogContext): void {
    this.info('Auto-response timer started', {
      ...this.defaultContext,
      ...context,
      timerId,
      contactId,
      delaySeconds,
      eventType: 'timer_started',
    });
  }

  logTimerExpired(timerId: string, contactId: string, context?: LogContext): void {
    this.info('Auto-response timer expired', {
      ...this.defaultContext,
      ...context,
      timerId,
      contactId,
      eventType: 'timer_expired',
    });
  }

  logUrgentMessage(messageId: string, contactId: string, urgencyLevel: string, context?: LogContext): void {
    this.warn('Urgent message detected', {
      ...this.defaultContext,
      ...context,
      messageId,
      contactId,
      urgencyLevel,
      eventType: 'urgent_message',
    });
  }

  logWhatsAppEvent(event: string, details?: any, context?: LogContext): void {
    this.info(`WhatsApp event: ${event}`, {
      ...this.defaultContext,
      ...context,
      whatsappEvent: event,
      details,
      eventType: 'whatsapp_event',
    });
  }

  logApiRequest(method: string, path: string, statusCode: number, duration: number, context?: LogContext): void {
    const level = statusCode >= 400 ? 'warn' : 'info';
    this.logger.log(level, 'API request', {
      ...this.defaultContext,
      ...context,
      httpMethod: method,
      httpPath: path,
      httpStatusCode: statusCode,
      duration: `${duration}ms`,
      eventType: 'api_request',
    });
  }

  // Metrics logging
  logMetrics(metrics: Record<string, number>, context?: LogContext): void {
    this.info('System metrics', {
      ...this.defaultContext,
      ...context,
      metrics,
      eventType: 'system_metrics',
    });
  }

  // Security logging
  logSecurityEvent(event: string, severity: 'low' | 'medium' | 'high', details?: any, context?: LogContext): void {
    this.warn(`Security event: ${event}`, {
      ...this.defaultContext,
      ...context,
      securityEvent: event,
      severity,
      details,
      eventType: 'security_event',
    });
  }
}