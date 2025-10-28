import { MessageDto, ContactDto, TimerDto, MessageStatsDto, TimerStatsDto } from './';

// Base Response
export interface BaseResponse {
  success: boolean;
  message?: string;
  errors?: string[];
}

// Message Responses
export interface MessageResponse extends BaseResponse {
  data?: MessageDto;
}

export interface MessageHistoryResponse extends BaseResponse {
  data?: {
    messages: MessageDto[];
    totalCount: number;
    hasMore: boolean;
  };
}

export interface MessageStatsResponse extends BaseResponse {
  data?: MessageStatsDto;
}

// Contact Responses
export interface ContactResponse extends BaseResponse {
  data?: ContactDto;
}

export interface ContactListResponse extends BaseResponse {
  data?: {
    contacts: ContactDto[];
    totalCount: number;
    hasMore: boolean;
  };
}

// Timer Responses
export interface TimerResponse extends BaseResponse {
  data?: TimerDto;
}

export interface TimerListResponse extends BaseResponse {
  data?: {
    timers: TimerDto[];
    totalCount: number;
  };
}

export interface TimerStatsResponse extends BaseResponse {
  data?: TimerStatsDto;
}

// Auto Response Response
export interface AutoResponseResult extends BaseResponse {
  data?: {
    shouldRespond: boolean;
    responseMessage?: string;
    delayInSeconds?: number;
  };
}

// Notification Response
export interface NotificationResponse extends BaseResponse {
  data?: {
    notificationSent: boolean;
    urgencyLevel: 'high' | 'medium' | 'low';
  };
}