import { injectable, inject } from 'inversify';
import { TYPES } from '@shared/constants';
import { TimerRepository, Timer } from '@domain/index';
import { TimerId, ContactId, MessageId } from '@domain/value-objects';
import { DatabaseAdapter } from '@infrastructure/database';
import { InfrastructureError } from '@shared/types';

interface TimerRow {
  contact_id: string;
  message_id: string;
  expires_at: string;
  created_at: string;
}

@injectable()
export class TimerRepositoryImpl implements TimerRepository {
  constructor(
    @inject(TYPES.DatabaseAdapter) private db: DatabaseAdapter
  ) {}

  async save(timer: Timer): Promise<void> {
    try {
      // Delete any existing timer for this contact first
      await this.deleteByContact(timer.contactId);

      // Insert new timer
      const query = this.db.createQueryBuilder()
        .insert('active_timers')
        .values({
          contact_id: timer.contactId.value,
          message_id: timer.messageId.value,
          expires_at: timer.expiresAt.toISOString(),
          created_at: timer.createdAt.toISOString(),
        });

      const { sql, params } = query.build();
      await this.db.execute(sql, params);
    } catch (error) {
      throw new InfrastructureError(`Failed to save timer: ${(error as Error).message}`);
    }
  }

  async findById(id: TimerId): Promise<Timer | null> {
    // Note: In our schema, we use contact_id as primary key, not timer id
    // This method would need to be implemented differently or the schema adjusted
    throw new InfrastructureError('findById not implemented for TimerRepository - use findByContact instead');
  }

  async findByContact(contactId: ContactId): Promise<Timer | null> {
    try {
      const query = this.db.createQueryBuilder()
        .select('active_timers')
        .where('contact_id = ?', contactId.value);

      const { sql, params } = query.build();
      const row = await this.db.queryOne<TimerRow>(sql, params);

      return row ? this.mapRowToTimer(row) : null;
    } catch (error) {
      throw new InfrastructureError(`Failed to find timer by contact: ${(error as Error).message}`);
    }
  }

  async findByMessage(messageId: MessageId): Promise<Timer | null> {
    try {
      const query = this.db.createQueryBuilder()
        .select('active_timers')
        .where('message_id = ?', messageId.value);

      const { sql, params } = query.build();
      const row = await this.db.queryOne<TimerRow>(sql, params);

      return row ? this.mapRowToTimer(row) : null;
    } catch (error) {
      throw new InfrastructureError(`Failed to find timer by message: ${(error as Error).message}`);
    }
  }

  async findExpired(currentTime?: Date): Promise<Timer[]> {
    try {
      const now = currentTime || new Date();
      
      const query = this.db.createQueryBuilder()
        .select('active_timers')
        .where('expires_at <= ?', now.toISOString())
        .orderBy('expires_at', 'ASC');

      const { sql, params } = query.build();
      const rows = await this.db.query<TimerRow>(sql, params);

      return rows.rows.map(row => this.mapRowToTimer(row));
    } catch (error) {
      throw new InfrastructureError(`Failed to find expired timers: ${(error as Error).message}`);
    }
  }

  async findActive(currentTime?: Date): Promise<Timer[]> {
    try {
      const now = currentTime || new Date();
      
      const query = this.db.createQueryBuilder()
        .select('active_timers')
        .where('expires_at > ?', now.toISOString())
        .orderBy('expires_at', 'ASC');

      const { sql, params } = query.build();
      const rows = await this.db.query<TimerRow>(sql, params);

      return rows.rows.map(row => this.mapRowToTimer(row));
    } catch (error) {
      throw new InfrastructureError(`Failed to find active timers: ${(error as Error).message}`);
    }
  }

  async findExpiringWithin(minutes: number, currentTime?: Date): Promise<Timer[]> {
    try {
      const now = currentTime || new Date();
      const futureTime = new Date(now.getTime() + minutes * 60 * 1000);
      
      const query = this.db.createQueryBuilder()
        .select('active_timers')
        .where('expires_at > ?', now.toISOString())
        .where('expires_at <= ?', futureTime.toISOString())
        .orderBy('expires_at', 'ASC');

      const { sql, params } = query.build();
      const rows = await this.db.query<TimerRow>(sql, params);

      return rows.rows.map(row => this.mapRowToTimer(row));
    } catch (error) {
      throw new InfrastructureError(`Failed to find timers expiring within ${minutes} minutes: ${(error as Error).message}`);
    }
  }

  async delete(timerId: TimerId): Promise<void> {
    // Since we don't store timer ID in the database, this method needs adjustment
    throw new InfrastructureError('delete by TimerId not implemented - use deleteByContact or deleteByMessage instead');
  }

  async deleteByContact(contactId: ContactId): Promise<void> {
    try {
      const query = this.db.createQueryBuilder()
        .delete('active_timers')
        .where('contact_id = ?', contactId.value);

      const { sql, params } = query.build();
      await this.db.execute(sql, params);
    } catch (error) {
      throw new InfrastructureError(`Failed to delete timer by contact: ${(error as Error).message}`);
    }
  }

  async deleteByMessage(messageId: MessageId): Promise<void> {
    try {
      const query = this.db.createQueryBuilder()
        .delete('active_timers')
        .where('message_id = ?', messageId.value);

      const { sql, params } = query.build();
      await this.db.execute(sql, params);
    } catch (error) {
      throw new InfrastructureError(`Failed to delete timer by message: ${(error as Error).message}`);
    }
  }

  async deleteExpired(currentTime?: Date): Promise<number> {
    try {
      const now = currentTime || new Date();
      
      const query = this.db.createQueryBuilder()
        .delete('active_timers')
        .where('expires_at <= ?', now.toISOString());

      const { sql, params } = query.build();
      const result = await this.db.execute(sql, params);
      
      return result.affectedRows;
    } catch (error) {
      throw new InfrastructureError(`Failed to delete expired timers: ${(error as Error).message}`);
    }
  }

  async cancelByContact(contactId: ContactId): Promise<void> {
    // In our implementation, canceling is the same as deleting
    await this.deleteByContact(contactId);
  }

  async cancelByMessage(messageId: MessageId): Promise<void> {
    // In our implementation, canceling is the same as deleting
    await this.deleteByMessage(messageId);
  }

  async countActive(currentTime?: Date): Promise<number> {
    try {
      const now = currentTime || new Date();
      
      const sql = 'SELECT COUNT(*) as count FROM active_timers WHERE expires_at > ?';
      const result = await this.db.queryOne<{ count: number }>(sql, [now.toISOString()]);
      
      return result?.count || 0;
    } catch (error) {
      throw new InfrastructureError(`Failed to count active timers: ${(error as Error).message}`);
    }
  }

  async countExpired(currentTime?: Date): Promise<number> {
    try {
      const now = currentTime || new Date();
      
      const sql = 'SELECT COUNT(*) as count FROM active_timers WHERE expires_at <= ?';
      const result = await this.db.queryOne<{ count: number }>(sql, [now.toISOString()]);
      
      return result?.count || 0;
    } catch (error) {
      throw new InfrastructureError(`Failed to count expired timers: ${(error as Error).message}`);
    }
  }

  async findByContacts(contactIds: ContactId[]): Promise<Timer[]> {
    try {
      if (contactIds.length === 0) {
        return [];
      }

      const query = this.db.createQueryBuilder()
        .select('active_timers')
        .whereIn('contact_id', contactIds.map(id => id.value))
        .orderBy('expires_at', 'ASC');

      const { sql, params } = query.build();
      const rows = await this.db.query<TimerRow>(sql, params);

      return rows.rows.map(row => this.mapRowToTimer(row));
    } catch (error) {
      throw new InfrastructureError(`Failed to find timers by contacts: ${(error as Error).message}`);
    }
  }

  async existsByContact(contactId: ContactId): Promise<boolean> {
    try {
      const sql = 'SELECT COUNT(*) as count FROM active_timers WHERE contact_id = ?';
      const result = await this.db.queryOne<{ count: number }>(sql, [contactId.value]);
      
      return (result?.count || 0) > 0;
    } catch (error) {
      throw new InfrastructureError(`Failed to check if timer exists for contact: ${(error as Error).message}`);
    }
  }

  async getTimerStats(): Promise<{
    totalActive: number;
    totalExpired: number;
    averageResponseTime: number;
  }> {
    try {
      const now = new Date();
      
      const activeCount = await this.countActive(now);
      const expiredCount = await this.countExpired(now);
      
      // Calculate average response time (simplified - would need message history for accurate calculation)
      const avgSql = `
        SELECT AVG(
          CASE 
            WHEN expires_at <= ? THEN 
              (julianday(expires_at) - julianday(created_at)) * 24 * 60 * 60
            ELSE NULL 
          END
        ) as avg_response_time
        FROM active_timers
      `;
      
      const avgResult = await this.db.queryOne<{ avg_response_time: number | null }>(
        avgSql, 
        [now.toISOString()]
      );
      
      return {
        totalActive: activeCount,
        totalExpired: expiredCount,
        averageResponseTime: avgResult?.avg_response_time || 0,
      };
    } catch (error) {
      throw new InfrastructureError(`Failed to get timer stats: ${(error as Error).message}`);
    }
  }

  private mapRowToTimer(row: TimerRow): Timer {
    // Generate a timer ID based on contact ID (since we don't store it)
    const timerId = TimerId.fromString(row.contact_id);
    
    return Timer.fromExisting(
      timerId,
      ContactId.fromString(row.contact_id),
      MessageId.fromString(row.message_id),
      new Date(row.expires_at),
      new Date(row.created_at)
    );
  }
}