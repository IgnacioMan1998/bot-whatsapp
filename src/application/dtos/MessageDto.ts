export interface MessageDto {
  id: string;
  from: string;
  to: string;
  content: string;
  timestamp: Date;
  type: 'incoming' | 'outgoing';
  isGroup?: boolean;
}

export interface CreateMessageDto {
  from: string;
  to: string;
  content: string;
  timestamp: Date;
  type: 'incoming' | 'outgoing';
  isGroup?: boolean;
}

export interface MessageHistoryDto {
  messages: MessageDto[];
  totalCount: number;
  hasMore: boolean;
}

export interface MessageSearchDto {
  contactId?: string;
  fromDate?: Date;
  toDate?: Date;
  content?: string;
  messageType?: 'incoming' | 'outgoing';
  isGroup?: boolean;
  limit?: number;
  offset?: number;
}

export interface MessageStatsDto {
  totalMessages: number;
  incomingMessages: number;
  outgoingMessages: number;
  lastMessageDate?: Date;
}