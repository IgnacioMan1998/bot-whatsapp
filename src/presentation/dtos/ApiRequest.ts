import { Request } from 'express';

// Base API Request
export interface ApiRequest extends Request {
  user?: {
    id: string;
    role: string;
  };
}

// Message API Requests
export interface GetMessageHistoryRequest extends ApiRequest {
  params: {
    contactId: string;
  };
  query: {
    limit?: string;
    offset?: string;
    fromDate?: string;
    toDate?: string;
  };
}

export interface SearchMessagesRequest extends ApiRequest {
  query: {
    q: string;
    contactId?: string;
    messageType?: 'incoming' | 'outgoing';
    limit?: string;
    offset?: string;
  };
}

// Contact API Requests
export interface CreateContactRequest extends ApiRequest {
  body: {
    phoneNumber: string;
    name: string;
    responseDelay?: number;
    predefinedMessage?: string;
    isUrgent?: boolean;
    autoResponseEnabled?: boolean;
  };
}

export interface UpdateContactRequest extends ApiRequest {
  params: {
    id: string;
  };
  body: {
    name?: string;
    responseDelay?: number;
    predefinedMessage?: string;
    isUrgent?: boolean;
    autoResponseEnabled?: boolean;
  };
}

export interface GetContactRequest extends ApiRequest {
  params: {
    id: string;
  };
}

export interface GetContactsRequest extends ApiRequest {
  query: {
    limit?: string;
    offset?: string;
    isUrgent?: string;
    autoResponseEnabled?: string;
    search?: string;
  };
}

// System API Requests
export interface UpdateConfigRequest extends ApiRequest {
  body: {
    defaults?: {
      responseDelay?: number;
      autoMessage?: string;
    };
    whatsapp?: {
      sessionPath?: string;
    };
  };
}