import { injectable, inject } from 'inversify';
import { TYPES } from '@shared/constants';
import { 
  MessageRepository, 
  MessageSearchCriteria,
  Message 
} from '@domain/index';
import { MessageId, ContactId, MessageContent, MessageTypeVO } from '@domain/value-objects';
import { DatabaseAdapter } from '@infrastructure/database';
import { InfrastructureError } from '@shared/types';

interface MessageRow {
  id: string;
  contact_id: string;
  content: string;
  timestamp: string;
  type: 'incoming' | 'outgoing';
  is_group: boolean;
  created_at: string;
}

@injectable()
export class MessageRepositoryImpl implements MessageRepository {
  constructor(
    @inject(TYPES.DatabaseAdapter) private db: DatabaseAdapter
  ) {}

  async save(message: Message): Promise<void> {
    try {
      const query = this.db.createQueryBuilder()
        .insert('messages')
        .values({
          id: message.id.value,
          contact_id: message.from.value,
          content: message.content.value,
          timestamp: message.timestamp.toISOString(),
          type: message.type.value,
          is_group: message.isGroup,
        });

      const { sql, params } = query.build();
      await this.db.execute(sql, params);
    } catch (error) {
      throw new InfrastructureError(`Failed to save message: ${(error as Error).message}`);
    }
  }

  async findById(id: MessageId): Promise<Message | null> {
    try {
      const query = this.db.createQueryBuilder()
        .select('messages')
        .where('id = ?', id.value);

      const { sql, params } = query.build();
      const row = await this.db.queryOne<MessageRow>(sql, params);

      return row ? this.mapRowToMessage(row) : null;
    } catch (error) {
      throw new InfrastructureError(`Failed to find message by ID: ${(error as Error).message}`);
    }
  }

  async findByContact(contactId: ContactId, limit?: number): Promise<Message[]> {
    try {
      const query = this.db.createQueryBuilder()
        .select('messages')
        .where('contact_id = ?', contactId.value)
        .orderBy('timestamp', 'DESC');

      if (limit) {
        query.limit(limit);
      }

      const { sql, params } = query.build();
      const rows = await this.db.query<MessageRow>(sql, params);

      return rows.rows.map(row => this.mapRowToMessage(row));
    } catch (error) {
      throw new InfrastructureError(`Failed to find messages by contact: ${(error as Error).message}`);
    }
  }

  async search(query: string): Promise<Message[]> {
    try {
      const searchQuery = this.db.createQueryBuilder()
        .select('messages')
        .where('content LIKE ?', `%${query}%`)
        .orderBy('timestamp', 'DESC')
        .limit(100);

      const { sql, params } = searchQuery.build();
      const rows = await this.db.query<MessageRow>(sql, params);

      return rows.rows.map(row => this.mapRowToMessage(row));
    } catch (error) {
      throw new InfrastructureError(`Failed to search messages: ${(error as Error).message}`);
    }
  }

  async findByCriteria(
    criteria: MessageSearchCriteria, 
    limit?: number, 
    offset?: number
  ): Promise<Message[]> {
    try {
      const query = this.db.createQueryBuilder().select('messages');

      if (criteria.contactId) {
        query.where('contact_id = ?', criteria.contactId.value);
      }

      if (criteria.fromDate) {
        query.where('timestamp >= ?', criteria.fromDate.toISOString());
      }

      if (criteria.toDate) {
        query.where('timestamp <= ?', criteria.toDate.toISOString());
      }

      if (criteria.content) {
        query.where('content LIKE ?', `%${criteria.content}%`);
      }

      if (criteria.messageType) {
        query.where('type = ?', criteria.messageType);
      }

      if (criteria.isGroup !== undefined) {
        query.where('is_group = ?', criteria.isGroup);
      }

      query.orderBy('timestamp', 'DESC');

      if (limit) {
        query.limit(limit);
      }

      if (offset) {
        query.offset(offset);
      }

      const { sql, params } = query.build();
      const rows = await this.db.query<MessageRow>(sql, params);

      return rows.rows.map(row => this.mapRowToMessage(row));
    } catch (error) {
      throw new InfrastructureError(`Failed to find messages by criteria: ${(error as Error).message}`);
    }
  }

  async findUnrespondedMessages(contactId: ContactId): Promise<Message[]> {
    try {
      // Find incoming messages that don't have a corresponding outgoing message after them
      const sql = `
        SELECT m1.* FROM messages m1
        WHERE m1.contact_id = ? 
        AND m1.type = 'incoming'
        AND NOT EXISTS (
          SELECT 1 FROM messages m2 
          WHERE m2.contact_id = m1.contact_id 
          AND m2.type = 'outgoing' 
          AND m2.timestamp > m1.timestamp
        )
        ORDER BY m1.timestamp DESC
      `;

      const rows = await this.db.query<MessageRow>(sql, [contactId.value]);
      return rows.rows.map(row => this.mapRowToMessage(row));
    } catch (error) {
      throw new InfrastructureError(`Failed to find unresponded messages: ${(error as Error).message}`);
    }
  }

  async findLastMessage(contactId: ContactId): Promise<Message | null> {
    try {
      const query = this.db.createQueryBuilder()
        .select('messages')
        .where('contact_id = ?', contactId.value)
        .orderBy('timestamp', 'DESC')
        .limit(1);

      const { sql, params } = query.build();
      const row = await this.db.queryOne<MessageRow>(sql, params);

      return row ? this.mapRowToMessage(row) : null;
    } catch (error) {
      throw new InfrastructureError(`Failed to find last message: ${(error as Error).message}`);
    }
  }

  async findByDateRange(fromDate: Date, toDate: Date, limit?: number): Promise<Message[]> {
    try {
      const query = this.db.createQueryBuilder()
        .select('messages')
        .where('timestamp >= ?', fromDate.toISOString())
        .where('timestamp <= ?', toDate.toISOString())
        .orderBy('timestamp', 'DESC');

      if (limit) {
        query.limit(limit);
      }

      const { sql, params } = query.build();
      const rows = await this.db.query<MessageRow>(sql, params);

      return rows.rows.map(row => this.mapRowToMessage(row));
    } catch (error) {
      throw new InfrastructureError(`Failed to find messages by date range: ${(error as Error).message}`);
    }
  }

  async countByContact(contactId: ContactId): Promise<number> {
    try {
      const sql = 'SELECT COUNT(*) as count FROM messages WHERE contact_id = ?';
      const result = await this.db.queryOne<{ count: number }>(sql, [contactId.value]);
      return result?.count || 0;
    } catch (error) {
      throw new InfrastructureError(`Failed to count messages by contact: ${(error as Error).message}`);
    }
  }

  async countByCriteria(criteria: MessageSearchCriteria): Promise<number> {
    try {
      let sql = 'SELECT COUNT(*) as count FROM messages WHERE 1=1';
      const params: any[] = [];

      if (criteria.contactId) {
        sql += ' AND contact_id = ?';
        params.push(criteria.contactId.value);
      }

      if (criteria.fromDate) {
        sql += ' AND timestamp >= ?';
        params.push(criteria.fromDate.toISOString());
      }

      if (criteria.toDate) {
        sql += ' AND timestamp <= ?';
        params.push(criteria.toDate.toISOString());
      }

      if (criteria.content) {
        sql += ' AND content LIKE ?';
        params.push(`%${criteria.content}%`);
      }

      if (criteria.messageType) {
        sql += ' AND type = ?';
        params.push(criteria.messageType);
      }

      if (criteria.isGroup !== undefined) {
        sql += ' AND is_group = ?';
        params.push(criteria.isGroup);
      }

      const result = await this.db.queryOne<{ count: number }>(sql, params);
      return result?.count || 0;
    } catch (error) {
      throw new InfrastructureError(`Failed to count messages by criteria: ${(error as Error).message}`);
    }
  }

  async deleteOlderThan(date: Date): Promise<number> {
    try {
      const sql = 'DELETE FROM messages WHERE timestamp < ?';
      const result = await this.db.execute(sql, [date.toISOString()]);
      return result.affectedRows;
    } catch (error) {
      throw new InfrastructureError(`Failed to delete old messages: ${(error as Error).message}`);
    }
  }

  async getContactMessageStats(contactId: ContactId): Promise<{
    totalMessages: number;
    incomingMessages: number;
    outgoingMessages: number;
    lastMessageDate?: Date;
  }> {
    try {
      const sql = `
        SELECT 
          COUNT(*) as total_messages,
          SUM(CASE WHEN type = 'incoming' THEN 1 ELSE 0 END) as incoming_messages,
          SUM(CASE WHEN type = 'outgoing' THEN 1 ELSE 0 END) as outgoing_messages,
          MAX(timestamp) as last_message_date
        FROM messages 
        WHERE contact_id = ?
      `;

      const result = await this.db.queryOne<{
        total_messages: number;
        incoming_messages: number;
        outgoing_messages: number;
        last_message_date: string | null;
      }>(sql, [contactId.value]);

      return {
        totalMessages: result?.total_messages || 0,
        incomingMessages: result?.incoming_messages || 0,
        outgoingMessages: result?.outgoing_messages || 0,
        lastMessageDate: result?.last_message_date ? new Date(result.last_message_date) : undefined,
      };
    } catch (error) {
      throw new InfrastructureError(`Failed to get contact message stats: ${(error as Error).message}`);
    }
  }

  private mapRowToMessage(row: MessageRow): Message {
    return new Message({
      id: MessageId.fromString(row.id),
      from: ContactId.fromString(row.contact_id),
      to: ContactId.fromString(row.contact_id), // Simplified for now
      content: MessageContent.fromString(row.content),
      timestamp: new Date(row.timestamp),
      type: row.type === 'incoming' ? MessageTypeVO.incoming() : MessageTypeVO.outgoing(),
      isGroup: row.is_group,
    });
  }
}