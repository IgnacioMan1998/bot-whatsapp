// Message Queries
export interface GetMessageHistoryQuery {
  contactId: string;
  limit?: number;
  offset?: number;
  fromDate?: Date;
  toDate?: Date;
}

export interface SearchMessagesQuery {
  query: string;
  contactId?: string;
  messageType?: 'incoming' | 'outgoing';
  limit?: number;
  offset?: number;
}

export interface GetMessageStatsQuery {
  contactId: string;
}

// Contact Queries
export interface GetContactQuery {
  contactId?: string;
  phoneNumber?: string;
}

export interface GetContactsQuery {
  limit?: number;
  offset?: number;
  isUrgent?: boolean;
  autoResponseEnabled?: boolean;
}

export interface GetContactConfigurationQuery {
  contactId: string;
}

// Timer Queries
export interface GetActiveTimersQuery {
  contactId?: string;
}

export interface GetExpiredTimersQuery {
  beforeDate?: Date;
}

export interface GetTimerStatsQuery {
  // No specific parameters needed for general stats
}