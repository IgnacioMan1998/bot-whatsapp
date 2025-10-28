import { injectable } from 'inversify';
import { Pool, PoolClient } from 'pg';
import { DatabaseAdapter, QueryResult, QueryBuilder } from '../interfaces/DatabaseAdapter';
import { PostgreSQLQueryBuilder } from '../query-builder/PostgreSQLQueryBuilder';
import { InfrastructureError } from '@shared/types';

export interface PostgreSQLConfig {
  host: string;
  port: number;
  database: string;
  username: string;
  password: string;
  ssl?: boolean;
  poolSize?: number;
  connectionTimeout?: number;
}

@injectable()
export class PostgreSQLDatabaseAdapter implements DatabaseAdapter {
  private pool: Pool | null = null;
  private config: PostgreSQLConfig;
  private isConnected: boolean = false;

  constructor(config: PostgreSQLConfig) {
    this.config = config;
  }

  async connect(): Promise<void> {
    try {
      this.pool = new Pool({
        host: this.config.host,
        port: this.config.port,
        database: this.config.database,
        user: this.config.username,
        password: this.config.password,
        ssl: this.config.ssl,
        max: this.config.poolSize || 10,
        connectionTimeoutMillis: this.config.connectionTimeout || 30000,
        idleTimeoutMillis: 30000,
      });

      // Test connection
      const client = await this.pool.connect();
      client.release();
      
      this.isConnected = true;
    } catch (error) {
      throw new InfrastructureError(`Failed to connect to PostgreSQL database: ${(error as Error).message}`);
    }
  }

  async disconnect(): Promise<void> {
    if (this.pool) {
      await this.pool.end();
      this.pool = null;
      this.isConnected = false;
    }
  }

  async query<T>(sql: string, params: any[] = []): Promise<QueryResult<T>> {
    this.ensureConnected();
    
    try {
      const result = await this.pool!.query(sql, params);
      return {
        rows: result.rows as T[],
        rowCount: result.rowCount || 0,
      };
    } catch (error) {
      throw new InfrastructureError(`PostgreSQL query failed: ${(error as Error).message}`);
    }
  }

  async queryOne<T>(sql: string, params: any[] = []): Promise<T | null> {
    const result = await this.query<T>(sql, params);
    return result.rows.length > 0 ? result.rows[0] : null;
  }

  async execute(sql: string, params: any[] = []): Promise<{ affectedRows: number; insertId?: any }> {
    this.ensureConnected();
    
    try {
      const result = await this.pool!.query(sql, params);
      return {
        affectedRows: result.rowCount || 0,
        insertId: result.rows.length > 0 ? result.rows[0].id : undefined,
      };
    } catch (error) {
      throw new InfrastructureError(`PostgreSQL execution failed: ${(error as Error).message}`);
    }
  }

  async transaction<T>(operation: (adapter: DatabaseAdapter) => Promise<T>): Promise<T> {
    this.ensureConnected();
    
    const client: PoolClient = await this.pool!.connect();
    
    try {
      await client.query('BEGIN');
      
      // Create a temporary adapter that uses this client
      const transactionAdapter = new PostgreSQLTransactionAdapter(client);
      const result = await operation(transactionAdapter);
      
      await client.query('COMMIT');
      return result;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  createQueryBuilder(): QueryBuilder {
    return new PostgreSQLQueryBuilder();
  }

  async migrate(): Promise<void> {
    this.ensureConnected();
    
    const migrations = [
      // Create enum type
      `DO $$ BEGIN
        CREATE TYPE message_type AS ENUM ('incoming', 'outgoing');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;`,
      
      // Contacts table
      `CREATE TABLE IF NOT EXISTS contacts (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name TEXT,
        phone_number TEXT UNIQUE NOT NULL,
        response_delay INTEGER DEFAULT 60,
        predefined_message TEXT,
        is_urgent BOOLEAN DEFAULT FALSE,
        auto_response_enabled BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      )`,
      
      // Messages table
      `CREATE TABLE IF NOT EXISTS messages (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        contact_id UUID NOT NULL,
        content TEXT NOT NULL,
        timestamp TIMESTAMPTZ NOT NULL,
        type message_type NOT NULL,
        is_group BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        FOREIGN KEY (contact_id) REFERENCES contacts(id) ON DELETE CASCADE
      )`,
      
      // Global config table
      `CREATE TABLE IF NOT EXISTS global_config (
        key TEXT PRIMARY KEY,
        value JSONB NOT NULL,
        updated_at TIMESTAMPTZ DEFAULT NOW()
      )`,
      
      // Active timers table
      `CREATE TABLE IF NOT EXISTS active_timers (
        contact_id UUID PRIMARY KEY,
        message_id UUID NOT NULL,
        expires_at TIMESTAMPTZ NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        FOREIGN KEY (contact_id) REFERENCES contacts(id) ON DELETE CASCADE,
        FOREIGN KEY (message_id) REFERENCES messages(id) ON DELETE CASCADE
      )`,
      
      // Indexes
      `CREATE INDEX IF NOT EXISTS idx_messages_contact_timestamp ON messages(contact_id, timestamp DESC)`,
      `CREATE INDEX IF NOT EXISTS idx_messages_timestamp ON messages(timestamp DESC)`,
      `CREATE INDEX IF NOT EXISTS idx_active_timers_expires ON active_timers(expires_at)`,
      `CREATE INDEX IF NOT EXISTS idx_messages_content_gin ON messages USING gin(to_tsvector('spanish', content))`,
      
      // Trigger for updated_at
      `CREATE OR REPLACE FUNCTION update_updated_at_column()
      RETURNS TRIGGER AS $$
      BEGIN
          NEW.updated_at = NOW();
          RETURN NEW;
      END;
      $$ language 'plpgsql';`,
      
      `DROP TRIGGER IF EXISTS update_contacts_updated_at ON contacts;
      CREATE TRIGGER update_contacts_updated_at BEFORE UPDATE ON contacts
          FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();`,
    ];

    for (const migration of migrations) {
      await this.execute(migration);
    }
  }

  async healthCheck(): Promise<boolean> {
    try {
      if (!this.isConnected) {
        return false;
      }
      
      await this.queryOne('SELECT 1 as health');
      return true;
    } catch (error) {
      return false;
    }
  }

  private ensureConnected(): void {
    if (!this.pool || !this.isConnected) {
      throw new InfrastructureError('Database not connected');
    }
  }
}

// Helper class for transaction operations
class PostgreSQLTransactionAdapter implements DatabaseAdapter {
  constructor(private client: PoolClient) {}

  async connect(): Promise<void> {
    // Already connected via transaction
  }

  async disconnect(): Promise<void> {
    // Don't disconnect during transaction
  }

  async query<T>(sql: string, params: any[] = []): Promise<QueryResult<T>> {
    try {
      const result = await this.client.query(sql, params);
      return {
        rows: result.rows as T[],
        rowCount: result.rowCount || 0,
      };
    } catch (error) {
      throw new InfrastructureError(`PostgreSQL transaction query failed: ${(error as Error).message}`);
    }
  }

  async queryOne<T>(sql: string, params: any[] = []): Promise<T | null> {
    const result = await this.query<T>(sql, params);
    return result.rows.length > 0 ? result.rows[0] : null;
  }

  async execute(sql: string, params: any[] = []): Promise<{ affectedRows: number; insertId?: any }> {
    try {
      const result = await this.client.query(sql, params);
      return {
        affectedRows: result.rowCount || 0,
        insertId: result.rows.length > 0 ? result.rows[0].id : undefined,
      };
    } catch (error) {
      throw new InfrastructureError(`PostgreSQL transaction execution failed: ${(error as Error).message}`);
    }
  }

  async transaction<T>(operation: (adapter: DatabaseAdapter) => Promise<T>): Promise<T> {
    // Nested transactions not supported, just execute the operation
    return await operation(this);
  }

  createQueryBuilder(): QueryBuilder {
    return new PostgreSQLQueryBuilder();
  }

  async migrate(): Promise<void> {
    throw new InfrastructureError('Migration not supported in transaction context');
  }

  async healthCheck(): Promise<boolean> {
    try {
      await this.queryOne('SELECT 1 as health');
      return true;
    } catch (error) {
      return false;
    }
  }
}