import { Request, Response, NextFunction } from 'express';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';

export class SecurityMiddleware {
  
  // Rate limiting
  static createRateLimit(windowMs: number = 15 * 60 * 1000, max: number = 100) {
    return rateLimit({
      windowMs, // 15 minutes by default
      max, // limit each IP to 100 requests per windowMs
      message: {
        success: false,
        message: 'Too many requests',
        errors: ['Rate limit exceeded. Please try again later.'],
        meta: {
          timestamp: new Date().toISOString(),
        },
      },
      standardHeaders: true,
      legacyHeaders: false,
    });
  }

  // Helmet security headers
  static helmet() {
    return helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          scriptSrc: ["'self'"],
          imgSrc: ["'self'", "data:", "https:"],
        },
      },
      hsts: {
        maxAge: 31536000,
        includeSubDomains: true,
        preload: true,
      },
    });
  }

  // CORS configuration
  static corsOptions = {
    origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
      // Allow requests with no origin (like mobile apps or curl requests)
      if (!origin) return callback(null, true);
      
      // In production, you should configure allowed origins
      const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'];
      
      if (allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-ID'],
  };

  // Request size limiting
  static requestSizeLimit = '10mb';

  // API Key authentication (simple implementation)
  static apiKeyAuth = (req: Request, res: Response, next: NextFunction): void => {
    // Skip auth for health check
    if (req.path === '/health' || req.path === '/api/status') {
      return next();
    }

    const apiKey = req.headers['x-api-key'] as string;
    const validApiKey = process.env.API_KEY;

    // If no API key is configured, skip authentication (development mode)
    if (!validApiKey) {
      return next();
    }

    if (!apiKey || apiKey !== validApiKey) {
      res.status(401).json({
        success: false,
        message: 'Unauthorized',
        errors: ['Valid API key required'],
        meta: {
          timestamp: new Date().toISOString(),
          requestId: req.headers['x-request-id'] as string,
        },
      });
      return;
    }

    next();
  };

  // Input sanitization
  static sanitizeInput = (req: Request, res: Response, next: NextFunction): void => {
    // Basic XSS protection - remove script tags and dangerous characters
    const sanitize = (obj: any): any => {
      if (typeof obj === 'string') {
        return obj
          .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
          .replace(/javascript:/gi, '')
          .replace(/on\w+\s*=/gi, '');
      }
      
      if (typeof obj === 'object' && obj !== null) {
        const sanitized: any = Array.isArray(obj) ? [] : {};
        for (const key in obj) {
          sanitized[key] = sanitize(obj[key]);
        }
        return sanitized;
      }
      
      return obj;
    };

    if (req.body) {
      req.body = sanitize(req.body);
    }
    
    if (req.query) {
      req.query = sanitize(req.query);
    }

    next();
  };
}