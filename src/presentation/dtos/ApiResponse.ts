import { Response } from 'express';

// Base API Response
export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  errors?: string[];
  meta?: {
    timestamp: string;
    requestId?: string;
    version?: string;
  };
}

// Pagination metadata
export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

// Paginated response
export interface PaginatedApiResponse<T = any> extends ApiResponse<T> {
  pagination?: PaginationMeta;
}

// Specific response types
export interface MessageResponse {
  id: string;
  from: string;
  to: string;
  content: string;
  timestamp: string;
  type: 'incoming' | 'outgoing';
  isGroup: boolean;
}

export interface ContactResponse {
  id: string;
  phoneNumber: string;
  name: string;
  responseDelay: number;
  predefinedMessage?: string;
  isUrgent: boolean;
  autoResponseEnabled: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SystemStatusResponse {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  uptime: number;
  version: string;
  services: {
    database: {
      status: 'connected' | 'disconnected';
      type: string;
    };
    whatsapp: {
      status: 'connected' | 'disconnected' | 'connecting';
      isReady: boolean;
      sessionStatus: string;
    };
  };
  stats: {
    totalMessages: number;
    totalContacts: number;
    activeTimers: number;
  };
}

export interface ConfigResponse {
  defaults: {
    responseDelay: number;
    autoMessage: string;
  };
  server: {
    port: number;
    host: string;
  };
  // Don't expose sensitive database config
}