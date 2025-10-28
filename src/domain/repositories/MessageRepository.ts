import { Message } from '@domain/entities';
import { MessageId, ContactId } from '@domain/value-objects';

export interface MessageSearchCriteria {
  contactId?: ContactId;
  fromDate?: Date;
  toDate?: Date;
  content?: string;
  messageType?: 'incoming' | 'outgoing';
  isGroup?: boolean;
}

export interface MessageRepository {
  /**
   * Save a message to the repository
   */
  save(message: Message): Promise<void>;

  /**
   * Find a message by its ID
   */
  findById(id: MessageId): Promise<Message | null>;

  /**
   * Find messages by contact ID with optional limit
   */
  findByContact(contactId: ContactId, limit?: number): Promise<Message[]>;

  /**
   * Search messages using text query
   */
  search(query: string): Promise<Message[]>;

  /**
   * Find messages using advanced search criteria
   */
  findByCriteria(criteria: MessageSearchCriteria, limit?: number, offset?: number): Promise<Message[]>;

  /**
   * Find unresponded messages for a contact (incoming messages without outgoing response)
   */
  findUnrespondedMessages(contactId: ContactId): Promise<Message[]>;

  /**
   * Find the last message between two contacts
   */
  findLastMessage(contactId: ContactId): Promise<Message | null>;

  /**
   * Find messages within a date range
   */
  findByDateRange(fromDate: Date, toDate: Date, limit?: number): Promise<Message[]>;

  /**
   * Count total messages for a contact
   */
  countByContact(contactId: ContactId): Promise<number>;

  /**
   * Count messages by criteria
   */
  countByCriteria(criteria: MessageSearchCriteria): Promise<number>;

  /**
   * Delete messages older than specified date
   */
  deleteOlderThan(date: Date): Promise<number>;

  /**
   * Get message statistics for a contact
   */
  getContactMessageStats(contactId: ContactId): Promise<{
    totalMessages: number;
    incomingMessages: number;
    outgoingMessages: number;
    lastMessageDate?: Date;
  }>;
}