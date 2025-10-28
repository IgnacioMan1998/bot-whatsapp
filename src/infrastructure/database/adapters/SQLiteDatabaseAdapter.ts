import { injectable } from 'inversify';
import sqlite3 from 'sqlite3';
import { DatabaseAdapter, QueryResult, QueryBuilder } from '../interfaces/DatabaseAdapter';
import { SQLiteQueryBuilder } from '../query-builder/SQLiteQueryBuilder';
import { InfrastructureError } from '@shared/types';

@injectable()
export class SQLiteDatabaseAdapter implements DatabaseAdapter {
  private db: sqlite3.Database | null = null;
  private dbPath: string;
  private isConnected: boolean = false;

  constructor(dbPath: string = ':memory:') {
    this.dbPath = dbPath;
  }

  async connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.db = new sqlite3.Database(this.dbPath, (err) => {
        if (err) {
          reject(new InfrastructureError(`Failed to connect to SQLite database: ${err.message}`));
        } else {
          this.isConnected = true;
          // Enable foreign keys
          this.db!.run('PRAGMA foreign_keys = ON');
          // Enable WAL mode for better concurrency
          this.db!.run('PRAGMA journal_mode = WAL');
          resolve();
        }
      });
    });
  }

  async disconnect(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.db) {
        this.db.close((err) => {
          if (err) {
            reject(new InfrastructureError(`Failed to close SQLite database: ${err.message}`));
          } else {
            this.isConnected = false;
            this.db = null;
            resolve();
          }
        });
      } else {
        resolve();
      }
    });
  }

  async query<T>(sql: string, params: any[] = []): Promise<QueryResult<T>> {
    this.ensureConnected();
    
    return new Promise((resolve, reject) => {
      this.db!.all(sql, params, (err, rows) => {
        if (err) {
          reject(new InfrastructureError(`SQLite query failed: ${err.message}`));
        } else {
          resolve({
            rows: rows as T[],
            rowCount: rows.length,
          });
        }
      });
    });
  }

  async queryOne<T>(sql: string, params: any[] = []): Promise<T | null> {
    this.ensureConnected();
    
    return new Promise((resolve, reject) => {
      this.db!.get(sql, params, (err, row) => {
        if (err) {
          reject(new InfrastructureError(`SQLite query failed: ${err.message}`));
        } else {
          resolve(row as T || null);
        }
      });
    });
  }

  async execute(sql: string, params: any[] = []): Promise<{ affectedRows: number; insertId?: any }> {
    this.ensureConnected();
    
    return new Promise((resolve, reject) => {
      this.db!.run(sql, params, function(err) {
        if (err) {
          reject(new InfrastructureError(`SQLite execution failed: ${err.message}`));
        } else {
          resolve({
            affectedRows: this.changes,
            insertId: this.lastID,
          });
        }
      });
    });
  }

  async transaction<T>(operation: (adapter: DatabaseAdapter) => Promise<T>): Promise<T> {
    this.ensureConnected();
    
    await this.execute('BEGIN TRANSACTION');
    
    try {
      const result = await operation(this);
      await this.execute('COMMIT');
      return result;
    } catch (error) {
      await this.execute('ROLLBACK');
      throw error;
    }
  }

  createQueryBuilder(): QueryBuilder {
    return new SQLiteQueryBuilder();
  }

  async migrate(): Promise<void> {
    this.ensureConnected();
    
    // Create tables if they don't exist
    const migrations = [
      // Messages table
      `CREATE TABLE IF NOT EXISTS messages (
        id TEXT PRIMARY KEY,
        contact_id TEXT NOT NULL,
        content TEXT NOT NULL,
        timestamp DATETIME NOT NULL,
        type TEXT CHECK(type IN ('incoming', 'outgoing')) NOT NULL,
        is_group BOOLEAN DEFAULT FALSE,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (contact_id) REFERENCES contacts(id)
      )`,
      
      // Contacts table
      `CREATE TABLE IF NOT EXISTS contacts (
        id TEXT PRIMARY KEY,
        name TEXT,
        phone_number TEXT UNIQUE NOT NULL,
        response_delay INTEGER DEFAULT 60,
        predefined_message TEXT,
        is_urgent BOOLEAN DEFAULT FALSE,
        auto_response_enabled BOOLEAN DEFAULT TRUE,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`,
      
      // Global config table
      `CREATE TABLE IF NOT EXISTS global_config (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`,
      
      // Active timers table
      `CREATE TABLE IF NOT EXISTS active_timers (
        contact_id TEXT PRIMARY KEY,
        message_id TEXT NOT NULL,
        expires_at DATETIME NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (contact_id) REFERENCES contacts(id),
        FOREIGN KEY (message_id) REFERENCES messages(id)
      )`,
      
      // Indexes
      `CREATE INDEX IF NOT EXISTS idx_messages_contact_timestamp ON messages(contact_id, timestamp DESC)`,
      `CREATE INDEX IF NOT EXISTS idx_messages_timestamp ON messages(timestamp DESC)`,
      `CREATE INDEX IF NOT EXISTS idx_active_timers_expires ON active_timers(expires_at)`,
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
    if (!this.db || !this.isConnected) {
      throw new InfrastructureError('Database not connected');
    }
  }
}