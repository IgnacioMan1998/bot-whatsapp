import { injectable, inject } from 'inversify';
import { TYPES } from '@shared/constants';
import { 
  ContactRepository, 
  ContactSearchCriteria,
  Contact 
} from '@domain/index';
import { 
  ContactId, 
  PhoneNumber, 
  ContactName, 
  ContactConfiguration 
} from '@domain/value-objects';
import { DatabaseAdapter } from '@infrastructure/database';
import { InfrastructureError } from '@shared/types';

interface ContactRow {
  id: string;
  name: string;
  phone_number: string;
  response_delay: number;
  predefined_message: string | null;
  is_urgent: boolean;
  auto_response_enabled: boolean;
  created_at: string;
  updated_at: string;
}

@injectable()
export class ContactRepositoryImpl implements ContactRepository {
  constructor(
    @inject(TYPES.DatabaseAdapter) private db: DatabaseAdapter
  ) {}

  async save(contact: Contact): Promise<void> {
    try {
      // Check if contact exists
      const existing = await this.findById(contact.id);
      
      if (existing) {
        // Update existing contact
        const query = this.db.createQueryBuilder()
          .update('contacts')
          .set({
            name: contact.name.value,
            phone_number: contact.phoneNumber.value,
            response_delay: contact.configuration.responseDelay,
            predefined_message: contact.configuration.predefinedMessage || null,
            is_urgent: contact.configuration.isUrgent,
            auto_response_enabled: contact.configuration.autoResponseEnabled,
            updated_at: new Date().toISOString(),
          })
          .where('id = ?', contact.id.value);

        const { sql, params } = query.build();
        await this.db.execute(sql, params);
      } else {
        // Insert new contact
        const query = this.db.createQueryBuilder()
          .insert('contacts')
          .values({
            id: contact.id.value,
            name: contact.name.value,
            phone_number: contact.phoneNumber.value,
            response_delay: contact.configuration.responseDelay,
            predefined_message: contact.configuration.predefinedMessage || null,
            is_urgent: contact.configuration.isUrgent,
            auto_response_enabled: contact.configuration.autoResponseEnabled,
            created_at: contact.createdAt.toISOString(),
            updated_at: contact.updatedAt.toISOString(),
          });

        const { sql, params } = query.build();
        await this.db.execute(sql, params);
      }
    } catch (error) {
      throw new InfrastructureError(`Failed to save contact: ${(error as Error).message}`);
    }
  }

  async findById(id: ContactId): Promise<Contact | null> {
    try {
      const query = this.db.createQueryBuilder()
        .select('contacts')
        .where('id = ?', id.value);

      const { sql, params } = query.build();
      const row = await this.db.queryOne<ContactRow>(sql, params);

      return row ? this.mapRowToContact(row) : null;
    } catch (error) {
      throw new InfrastructureError(`Failed to find contact by ID: ${(error as Error).message}`);
    }
  }

  async findByPhoneNumber(phoneNumber: PhoneNumber): Promise<Contact | null> {
    try {
      const query = this.db.createQueryBuilder()
        .select('contacts')
        .where('phone_number = ?', phoneNumber.value);

      const { sql, params } = query.build();
      const row = await this.db.queryOne<ContactRow>(sql, params);

      return row ? this.mapRowToContact(row) : null;
    } catch (error) {
      throw new InfrastructureError(`Failed to find contact by phone number: ${(error as Error).message}`);
    }
  }

  async findAll(): Promise<Contact[]> {
    try {
      const query = this.db.createQueryBuilder()
        .select('contacts')
        .orderBy('name', 'ASC');

      const { sql, params } = query.build();
      const rows = await this.db.query<ContactRow>(sql, params);

      return rows.rows.map(row => this.mapRowToContact(row));
    } catch (error) {
      throw new InfrastructureError(`Failed to find all contacts: ${(error as Error).message}`);
    }
  }

  async findByCriteria(
    criteria: ContactSearchCriteria, 
    limit?: number, 
    offset?: number
  ): Promise<Contact[]> {
    try {
      const query = this.db.createQueryBuilder().select('contacts');

      if (criteria.name) {
        query.where('name LIKE ?', `%${criteria.name}%`);
      }

      if (criteria.isUrgent !== undefined) {
        query.where('is_urgent = ?', criteria.isUrgent);
      }

      if (criteria.autoResponseEnabled !== undefined) {
        query.where('auto_response_enabled = ?', criteria.autoResponseEnabled);
      }

      if (criteria.hasResponseDelay !== undefined) {
        if (criteria.hasResponseDelay) {
          query.where('response_delay > ?', 0);
        } else {
          query.where('response_delay = ?', 0);
        }
      }

      if (criteria.hasPredefinedMessage !== undefined) {
        if (criteria.hasPredefinedMessage) {
          query.where('predefined_message IS NOT NULL');
        } else {
          query.where('predefined_message IS NULL');
        }
      }

      query.orderBy('name', 'ASC');

      if (limit) {
        query.limit(limit);
      }

      if (offset) {
        query.offset(offset);
      }

      const { sql, params } = query.build();
      const rows = await this.db.query<ContactRow>(sql, params);

      return rows.rows.map(row => this.mapRowToContact(row));
    } catch (error) {
      throw new InfrastructureError(`Failed to find contacts by criteria: ${(error as Error).message}`);
    }
  }

  async findByName(name: string): Promise<Contact[]> {
    try {
      const query = this.db.createQueryBuilder()
        .select('contacts')
        .where('name LIKE ?', `%${name}%`)
        .orderBy('name', 'ASC');

      const { sql, params } = query.build();
      const rows = await this.db.query<ContactRow>(sql, params);

      return rows.rows.map(row => this.mapRowToContact(row));
    } catch (error) {
      throw new InfrastructureError(`Failed to find contacts by name: ${(error as Error).message}`);
    }
  }

  async findUrgentContacts(): Promise<Contact[]> {
    try {
      const query = this.db.createQueryBuilder()
        .select('contacts')
        .where('is_urgent = ?', true)
        .orderBy('name', 'ASC');

      const { sql, params } = query.build();
      const rows = await this.db.query<ContactRow>(sql, params);

      return rows.rows.map(row => this.mapRowToContact(row));
    } catch (error) {
      throw new InfrastructureError(`Failed to find urgent contacts: ${(error as Error).message}`);
    }
  }

  async findAutoResponseEnabled(): Promise<Contact[]> {
    try {
      const query = this.db.createQueryBuilder()
        .select('contacts')
        .where('auto_response_enabled = ?', true)
        .orderBy('name', 'ASC');

      const { sql, params } = query.build();
      const rows = await this.db.query<ContactRow>(sql, params);

      return rows.rows.map(row => this.mapRowToContact(row));
    } catch (error) {
      throw new InfrastructureError(`Failed to find auto-response enabled contacts: ${(error as Error).message}`);
    }
  }

  async findWithPredefinedMessages(): Promise<Contact[]> {
    try {
      const query = this.db.createQueryBuilder()
        .select('contacts')
        .where('predefined_message IS NOT NULL')
        .orderBy('name', 'ASC');

      const { sql, params } = query.build();
      const rows = await this.db.query<ContactRow>(sql, params);

      return rows.rows.map(row => this.mapRowToContact(row));
    } catch (error) {
      throw new InfrastructureError(`Failed to find contacts with predefined messages: ${(error as Error).message}`);
    }
  }

  async delete(id: ContactId): Promise<void> {
    try {
      const query = this.db.createQueryBuilder()
        .delete('contacts')
        .where('id = ?', id.value);

      const { sql, params } = query.build();
      await this.db.execute(sql, params);
    } catch (error) {
      throw new InfrastructureError(`Failed to delete contact: ${(error as Error).message}`);
    }
  }

  async existsByPhoneNumber(phoneNumber: PhoneNumber): Promise<boolean> {
    try {
      const sql = 'SELECT COUNT(*) as count FROM contacts WHERE phone_number = ?';
      const result = await this.db.queryOne<{ count: number }>(sql, [phoneNumber.value]);
      return (result?.count || 0) > 0;
    } catch (error) {
      throw new InfrastructureError(`Failed to check if contact exists: ${(error as Error).message}`);
    }
  }

  async count(): Promise<number> {
    try {
      const sql = 'SELECT COUNT(*) as count FROM contacts';
      const result = await this.db.queryOne<{ count: number }>(sql);
      return result?.count || 0;
    } catch (error) {
      throw new InfrastructureError(`Failed to count contacts: ${(error as Error).message}`);
    }
  }

  async countByCriteria(criteria: ContactSearchCriteria): Promise<number> {
    try {
      let sql = 'SELECT COUNT(*) as count FROM contacts WHERE 1=1';
      const params: any[] = [];

      if (criteria.name) {
        sql += ' AND name LIKE ?';
        params.push(`%${criteria.name}%`);
      }

      if (criteria.isUrgent !== undefined) {
        sql += ' AND is_urgent = ?';
        params.push(criteria.isUrgent);
      }

      if (criteria.autoResponseEnabled !== undefined) {
        sql += ' AND auto_response_enabled = ?';
        params.push(criteria.autoResponseEnabled);
      }

      if (criteria.hasResponseDelay !== undefined) {
        if (criteria.hasResponseDelay) {
          sql += ' AND response_delay > ?';
          params.push(0);
        } else {
          sql += ' AND response_delay = ?';
          params.push(0);
        }
      }

      if (criteria.hasPredefinedMessage !== undefined) {
        if (criteria.hasPredefinedMessage) {
          sql += ' AND predefined_message IS NOT NULL';
        } else {
          sql += ' AND predefined_message IS NULL';
        }
      }

      const result = await this.db.queryOne<{ count: number }>(sql, params);
      return result?.count || 0;
    } catch (error) {
      throw new InfrastructureError(`Failed to count contacts by criteria: ${(error as Error).message}`);
    }
  }

  async updateConfiguration(id: ContactId, contact: Contact): Promise<void> {
    // This is handled by the save method
    await this.save(contact);
  }

  async findRecentlyActive(days: number, limit?: number): Promise<Contact[]> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - days);

      let sql = `
        SELECT DISTINCT c.* FROM contacts c
        INNER JOIN messages m ON c.id = m.contact_id
        WHERE m.timestamp >= ?
        ORDER BY MAX(m.timestamp) DESC
      `;

      const params = [cutoffDate.toISOString()];

      if (limit) {
        sql += ` LIMIT ${limit}`;
      }

      const rows = await this.db.query<ContactRow>(sql, params);
      return rows.rows.map(row => this.mapRowToContact(row));
    } catch (error) {
      throw new InfrastructureError(`Failed to find recently active contacts: ${(error as Error).message}`);
    }
  }

  private mapRowToContact(row: ContactRow): Contact {
    const configuration = new ContactConfiguration({
      responseDelay: row.response_delay,
      predefinedMessage: row.predefined_message || undefined,
      isUrgent: row.is_urgent,
      autoResponseEnabled: row.auto_response_enabled,
    });

    return Contact.fromExisting(
      ContactId.fromString(row.id),
      PhoneNumber.fromString(row.phone_number),
      ContactName.fromString(row.name),
      configuration,
      new Date(row.created_at),
      new Date(row.updated_at)
    );
  }
}