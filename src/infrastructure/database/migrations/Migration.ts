import { DatabaseAdapter } from '../interfaces/DatabaseAdapter';

export interface Migration {
  version: number;
  name: string;
  up: (adapter: DatabaseAdapter) => Promise<void>;
  down: (adapter: DatabaseAdapter) => Promise<void>;
}

export interface MigrationRunner {
  getCurrentVersion(): Promise<number>;
  runMigrations(): Promise<void>;
  rollback(targetVersion: number): Promise<void>;
  addMigration(migration: Migration): void;
}

export class DatabaseMigrationRunner implements MigrationRunner {
  private migrations: Migration[] = [];

  constructor(private adapter: DatabaseAdapter) {}

  addMigration(migration: Migration): void {
    this.migrations.push(migration);
    // Sort by version to ensure correct order
    this.migrations.sort((a, b) => a.version - b.version);
  }

  async getCurrentVersion(): Promise<number> {
    try {
      // Create migrations table if it doesn't exist
      await this.adapter.execute(`
        CREATE TABLE IF NOT EXISTS schema_migrations (
          version INTEGER PRIMARY KEY,
          name TEXT NOT NULL,
          applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);

      const result = await this.adapter.queryOne<{ version: number }>(
        'SELECT MAX(version) as version FROM schema_migrations'
      );

      return result?.version || 0;
    } catch (error) {
      // If table doesn't exist or other error, assume version 0
      return 0;
    }
  }

  async runMigrations(): Promise<void> {
    const currentVersion = await this.getCurrentVersion();
    const pendingMigrations = this.migrations.filter(m => m.version > currentVersion);

    if (pendingMigrations.length === 0) {
      return;
    }

    for (const migration of pendingMigrations) {
      await this.adapter.transaction(async (adapter) => {
        await migration.up(adapter);
        
        await adapter.execute(
          'INSERT INTO schema_migrations (version, name) VALUES (?, ?)',
          [migration.version, migration.name]
        );
      });
    }
  }

  async rollback(targetVersion: number): Promise<void> {
    const currentVersion = await this.getCurrentVersion();
    const migrationsToRollback = this.migrations
      .filter(m => m.version > targetVersion && m.version <= currentVersion)
      .sort((a, b) => b.version - a.version); // Reverse order for rollback

    for (const migration of migrationsToRollback) {
      await this.adapter.transaction(async (adapter) => {
        await migration.down(adapter);
        
        await adapter.execute(
          'DELETE FROM schema_migrations WHERE version = ?',
          [migration.version]
        );
      });
    }
  }
}